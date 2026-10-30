$ErrorActionPreference = "Stop"

$workspace = "C:\Users\wth\Documents\ChatGPT\英文測驗準備"
$runtimeRoot = "C:\Users\wth\.codex\visualizations\2026\10\30\01a18d82-91dd-7fd2-aedc-634e28906599"
$gcloudSdk = Join-Path $runtimeRoot "jasmine-gcloud-591-runtime-5\google-cloud-sdk"
$gcloudConfig = Join-Path $runtimeRoot "jasmine-gcloud-config"
$ffmpeg = Join-Path $runtimeRoot "jasmine-ffmpeg-2\ffmpeg-9.0.2-essentials_build\bin\ffmpeg.exe"
$node = "C:\Users\wth\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$git = "C:\Program Files\Git\cmd\git.exe"
$gh = Join-Path $workspace ".tools\gh\bin\gh.exe"
$project = "jasmine-ls-tts-20261031"
$keyId = "jasmine-ls-tts-v2"
$manifest = Join-Path $workspace "scripts\tts\question-audio.manifest.json"
$masters = Join-Path $workspace "public\audio\masters"
$questions = Join-Path $workspace "content\questions.json"
$logDirectory = Join-Path $workspace "logs\tts-resume"
$statusFile = Join-Path $logDirectory "status.json"
$logFile = Join-Path $logDirectory "resume-20261031.log"

New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null

function Update-Status([string]$phase, [string]$message, [bool]$complete = $false) {
  [ordered]@{
    updatedAt = (Get-Date).ToString("o")
    phase = $phase
    message = $message
    complete = $complete
  } | ConvertTo-Json | Set-Content -LiteralPath $statusFile -Encoding UTF8
}

$mutex = [System.Threading.Mutex]::new($false, "Local\JasmineLinguaskillTtsResume")
if (-not $mutex.WaitOne(0)) {
  Update-Status "already-running" "Another resume job already owns the mutex."
  exit 3
}

Start-Transcript -LiteralPath $logFile -Append | Out-Null
try {
  Set-Location -LiteralPath $workspace
  foreach ($required in @($node, $git, $gh, $ffmpeg, (Join-Path $gcloudSdk "bin\gcloud.cmd"), $manifest, $questions)) {
    if (-not (Test-Path -LiteralPath $required)) { throw "Required path is missing: $required" }
  }

  $env:CLOUDSDK_PYTHON = Join-Path $gcloudSdk "platform\bundledpython\python.exe"
  $env:CLOUDSDK_CONFIG = $gcloudConfig
  $gcloud = Join-Path $gcloudSdk "bin\gcloud.cmd"

  function Invoke-FreeGeneration([string]$model) {
    Update-Status "generating" "Generating unfinished masters with $model."
    $key = & $gcloud services api-keys get-key-string $keyId --project=$project --format="value(keyString)" --quiet
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($key)) { throw "Could not retrieve the Gemini key." }
    try {
      $env:GEMINI_API_KEY = $key.Trim()
      $env:GEMINI_TTS_MODEL = $model
      $env:GEMINI_TTS_COMPACT_CLIPS = "1"
      & $node "scripts\tts\generate-audio.mjs" --manifest $manifest --out $masters
      return $LASTEXITCODE
    }
    finally {
      Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue
      Remove-Item Env:GEMINI_TTS_MODEL -ErrorAction SilentlyContinue
      Remove-Item Env:GEMINI_TTS_COMPACT_CLIPS -ErrorAction SilentlyContinue
      $key = $null
    }
  }

  $null = Invoke-FreeGeneration "gemini-3.8-flash-tts"
  $manifestData = Get-Content -Raw -LiteralPath $manifest | ConvertFrom-Json
  $missing = @($manifestData.jobs | Where-Object { -not (Test-Path -LiteralPath (Join-Path $masters $_.masterFile)) })
  if ($missing.Count -gt 0) {
    $null = Invoke-FreeGeneration "gemini-3.8-flash-lite-tts"
    $missing = @($manifestData.jobs | Where-Object { -not (Test-Path -LiteralPath (Join-Path $masters $_.masterFile)) })
  }
  if ($missing.Count -gt 0) {
    throw "Free-tier quotas ended with $($missing.Count) master(s) still missing: $($missing.id -join ', ')"
  }

  Update-Status "compressing" "Compressing 17 reviewed-format WAV masters to phone-sized MP3 assets."
  $env:FFMPEG_PATH = $ffmpeg
  try {
    & $node "scripts\tts\compress-audio.mjs" --manifest $manifest --masters $masters --public (Join-Path $workspace "public")
    if ($LASTEXITCODE -ne 0) { throw "Audio compression failed." }
  }
  finally {
    Remove-Item Env:FFMPEG_PATH -ErrorAction SilentlyContinue
  }

  Update-Status "linking" "Linking all listening sets to their deployment assets."
  & $node "scripts\tts\link-audio-assets.mjs" --manifest $manifest --questions $questions
  if ($LASTEXITCODE -ne 0) { throw "Audio linking failed." }

  Update-Status "checking" "Running content, logic, WAV, and production-build checks."
  & $node "scripts\validate-content.mjs"
  if ($LASTEXITCODE -ne 0) { throw "Content validation failed." }
  & $node "tests\site\logic.test.mjs"
  if ($LASTEXITCODE -ne 0) { throw "Site logic tests failed." }
  & $node "scripts\tts\test-wav.mjs"
  if ($LASTEXITCODE -ne 0) { throw "WAV tests failed." }
  & $node "scripts\build-static.mjs"
  if ($LASTEXITCODE -ne 0) { throw "Production build failed." }

  Update-Status "publishing" "Committing and pushing the completed site to GitHub."
  & $git config user.name "thothwang"
  & $git config user.email "40627768+thothwang@users.noreply.github.com"
  & $git branch -M main
  & $git add --all
  & $git diff --cached --quiet
  if ($LASTEXITCODE -eq 1) {
    & $git commit -m "Build Jasmine Linguaskill practice site"
    if ($LASTEXITCODE -ne 0) { throw "Git commit failed." }
  }
  & $git push --set-upstream origin main
  if ($LASTEXITCODE -ne 0) { throw "Git push failed." }

  & $gh api "repos/thothwang/jasmine-linguaskill-practice/pages" --silent 2>$null
  if ($LASTEXITCODE -ne 0) {
    & $gh api -X POST "repos/thothwang/jasmine-linguaskill-practice/pages" -f "build_type=workflow" --silent
    if ($LASTEXITCODE -ne 0) { throw "GitHub Pages enablement failed." }
  }

  Start-Sleep -Seconds 10
  $runId = & $gh run list --repo "thothwang/jasmine-linguaskill-practice" --workflow "pages.yml" --branch main --limit 1 --json databaseId --jq ".[0].databaseId"
  if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($runId)) {
    & $gh run watch $runId.Trim() --repo "thothwang/jasmine-linguaskill-practice" --exit-status
    if ($LASTEXITCODE -ne 0) { throw "GitHub Pages workflow failed." }
  }

  Update-Status "complete" "All audio generated, site pushed, and Pages workflow completed." $true
}
catch {
  Update-Status "failed" $_.Exception.Message
  Write-Error $_
  exit 1
}
finally {
  Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue
  Stop-Transcript -ErrorAction SilentlyContinue | Out-Null
  $mutex.ReleaseMutex()
  $mutex.Dispose()
}
