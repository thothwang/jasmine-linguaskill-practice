import { readFile, writeFile } from "node:fs/promises";
import { GENERAL_LISTENING_REBUILD } from "./general-listening-rebuild.mjs";

const bankPath = new URL("./questions.json", import.meta.url);
const readingPlusPath = new URL("./reading-plus-cases.json", import.meta.url);

const BL = [
  ["bl-expand-001","B2","visitor management","New visitor passes","an office manager explaining a visitor procedure",[
    ["What will change on Monday?","From Monday, visitors will receive a numbered pass at reception.","Visitors will receive numbered passes.","Staff will collect passes from security.","Visitors will enter without registering."],
    ["Why is the change being made?","The change follows several cases in which guests entered the wrong work area.","Some guests went to the wrong area.","Reception has moved to another floor.","The old passes were too expensive."],
    ["What must hosts do?","Hosts must meet their guests in the reception area.","Meet guests at reception","Send guests directly to meeting rooms","Leave a pass at the main entrance"],
    ["What restriction applies?","Guests may not use staff lifts unless accompanied.","Guests need a staff escort in the lifts.","Guests cannot enter the building after lunch.","Guests must avoid all lifts."],
    ["How will the procedure be reviewed?","Reception will record delays for the first two weeks.","By recording reception delays","By counting cancelled meetings","By surveying only external suppliers"]]],
  ["bl-expand-002","B2+","supplier communication","Supplier briefing online","a buyer announcing a supplier briefing",[
    ["What has changed?","The supplier briefing will be held online rather than in Conference Room Two.","The briefing will be online.","The briefing has been cancelled.","The briefing has moved to a larger room."],
    ["Why was this decision taken?","More overseas suppliers registered than the room could hold.","Overseas attendance exceeded room capacity.","The presenter cannot travel.","The conference room needs repairs."],
    ["What should suppliers do?","Suppliers should test the joining link before Wednesday.","Test the link before Wednesday","Email slides after the briefing","Register a second participant"],
    ["What will remain unchanged?","The question session will still begin at three o'clock.","The question session starts at three.","The product demonstration begins at three.","Registration closes at three."],
    ["What will happen afterwards?","A recording will be available for seven days.","A recording will remain available for a week.","A written test will be sent immediately.","Another live session will run the next morning."]]],
  ["bl-expand-003","B2","expenses","Receipt submission","a finance officer describing an expense update",[
    ["What is the new requirement?","Receipts must now be photographed through the expenses application.","Photograph receipts in the expenses app","Post original receipts to Finance","Attach receipts to a monthly spreadsheet"],
    ["Why was it introduced?","Email attachments were often separated from the correct claim.","Attachments were being matched to the wrong claim.","Paper receipts were becoming unreadable.","Managers wanted fewer claims."],
    ["What should staff keep?","Staff should keep original receipts until a claim is approved.","Keep originals until approval","Keep originals for a full year","Give originals to line managers"],
    ["Which claim is an exception?","Mileage claims do not require a receipt image.","Mileage claims","Hotel claims","Client-meal claims"],
    ["When can staff get help?","A short demonstration will run at lunchtime on Tuesday.","At Tuesday's lunchtime demonstration","At a Friday finance meeting","After the next payroll run"]]],
  ["bl-expand-004","B2+","product testing","Customer trial","a product manager explaining a customer trial",[
    ["What is being tested?","Selected customers will test the new dashboard for four weeks.","A new dashboard","A revised pricing plan","A customer-support chatbot"],
    ["Why were these customers chosen?","They use both the mobile and desktop versions regularly.","They regularly use both versions.","They reported the most technical problems.","They recently renewed their contracts."],
    ["What are participants asked to do?","Participants should record tasks that take longer than expected.","Record unexpectedly slow tasks","Submit a report every morning","Avoid using the mobile version"],
    ["What must staff avoid?","Staff must not guide customers through unfinished features.","Do not coach users through unfinished features.","Do not contact customers during the trial.","Do not discuss existing features."],
    ["What will determine the next step?","The team will compare completion times with the current dashboard.","A comparison of task-completion times","The number of positive comments","The cost of customer training"]]],
  ["bl-expand-005","B2","office renovation","Temporary work area","a facilities manager discussing renovation",[
    ["Where will the design team work?","The design team will use the third-floor training room next week.","In the third-floor training room","In the ground-floor café","In the client demonstration room"],
    ["Why is the move necessary?","Their usual area is being rewired.","Their normal workspace is being rewired.","Their floor is being painted.","Their desks are being replaced."],
    ["What should staff bring?","Staff should take their laptop chargers home on Friday.","Their laptop chargers","Their desk lamps","Their office chairs"],
    ["What will be unavailable?","The large-format printer will be unavailable for two days.","The large-format printer","The video-conference system","The staff kitchen"],
    ["When should normal work resume?","The team expects to return on Thursday morning.","Thursday morning","Wednesday afternoon","The following Monday"]]],
  ["bl-expand-006","B2+","customer support","Weekend support rota","a support manager announcing a rota",[
    ["What is changing?","Weekend support will rotate between two regional teams.","Two regional teams will share weekend support.","Weekend support will end.","One employee will cover every weekend."],
    ["Why is the rota changing?","Recent weekend enquiries have increased but remain unpredictable.","Weekend demand has grown unevenly.","Customers requested longer weekday hours.","A regional office is closing."],
    ["What must the duty team do?","The duty team must acknowledge urgent messages within thirty minutes.","Acknowledge urgent messages within thirty minutes","Resolve every case within thirty minutes","Telephone every customer immediately"],
    ["Which messages can wait?","Requests to change account details can wait until Monday.","Account-detail changes","Service outages","Payment-security warnings"],
    ["How will workload be checked?","Managers will review call and message volumes after six weekends.","By reviewing volumes after six weekends","By asking one customer for feedback","By comparing annual sales"]]],
  ["bl-expand-007","B2","onboarding","First-week schedule","a team leader describing onboarding",[
    ["What will new starters do first?","New starters will spend Monday morning with the operations team.","Meet the operations team on Monday morning","Complete sales training on Monday morning","Work independently from Monday morning"],
    ["Why was the order changed?","Understanding order processing makes later product training clearer.","Operations knowledge supports later training.","The trainer is absent on Monday.","New staff requested shorter training."],
    ["What should managers prepare?","Managers should prepare one realistic task for shadowing.","One realistic shadowing task","A formal performance review","A list of private customer records"],
    ["What is not expected?","New starters are not expected to answer customer calls in week one.","Answering customer calls","Observing team meetings","Practising with sample orders"],
    ["When will progress be discussed?","A short review will take place on Friday afternoon.","Friday afternoon","Tuesday lunchtime","At the end of the first month"]]],
  ["bl-expand-008","C1","quality assurance","Warehouse audit","a quality manager preparing a warehouse audit",[
    ["What will auditors examine first?","Auditors will first trace three randomly selected orders from receipt to dispatch.","Three randomly selected orders","Every order from the previous month","Only orders reported as damaged"],
    ["Why use this method?","It reveals whether records remain consistent across different stages.","To test consistency across stages","To calculate transport costs","To identify the fastest packer"],
    ["What must supervisors provide?","Supervisors must provide the current exception log.","The current exception log","Individual salary records","Next year's staffing forecast"],
    ["What should not be changed?","Teams should not tidy historical entries before the visit.","Historical entries must remain unchanged.","The warehouse must remain untidy.","Current safety signs should be removed."],
    ["What will follow the audit?","Managers will receive a factual findings note before recommendations are discussed.","A findings note before recommendations","Immediate disciplinary interviews","A final certificate on the same day"]]],
  ["bl-expand-009","B2","conference planning","Conference stand","an events coordinator giving conference instructions",[
    ["Where is the stand located?","Our stand is opposite the main coffee area, not beside registration.","Opposite the main coffee area","Beside registration","Near the east exit"],
    ["Why should staff arrive early?","The organiser requires all screens to be tested before visitors enter.","To test the screens","To collect visitor payments","To attend a private breakfast"],
    ["What should staff wear?","Staff should wear the blue company badge with normal business clothes.","A blue company badge","A conference uniform","A visitor wristband"],
    ["What may not be given away?","Prototype price sheets must not be given to visitors.","Prototype price sheets","Product leaflets","Reusable water bottles"],
    ["How will leads be recorded?","Interested visitors should scan a code on the tablet.","By scanning a code on the tablet","By signing a paper book","By giving staff a business card only"]]],
  ["bl-expand-010","B2+","training","Data-security workshop","a trainer introducing a security workshop",[
    ["What is the workshop's main focus?","The workshop focuses on recognising convincing social-engineering messages.","Recognising social-engineering messages","Creating stronger database passwords","Installing antivirus software"],
    ["Why was the focus selected?","Recent incidents began with apparently routine requests from senior staff.","Routine-looking requests caused recent incidents.","The firewall failed during an update.","Employees lost several laptops."],
    ["What will participants practise?","Participants will compare genuine and fabricated approval requests.","Comparing real and false requests","Writing software code","Repairing infected computers"],
    ["What should they not bring?","Participants should not bring real confidential emails to the session.","Real confidential emails","Their staff identification","A company laptop"],
    ["What happens after training?","A short unannounced simulation will take place later in the month.","An unannounced simulation","A public examination","A meeting with external police"]]],
  ["bl-expand-011","B2","inventory","Annual stock count","a warehouse supervisor explaining a stock count",[
    ["When will dispatch stop?","Dispatch will stop at four on Friday afternoon.","Friday at four","Friday at noon","Saturday at four"],
    ["Why is it stopping?","No goods may move while the physical count is under way.","Goods must remain still during counting.","The loading system needs repair.","The warehouse is closing permanently."],
    ["What should teams finish first?","Teams should label all returned items before Friday lunch.","Label returned items before lunch","Pack next week's orders","Remove shelf labels"],
    ["Which items are counted separately?","Damaged goods in the red area will be counted separately.","Damaged goods","Recently delivered goods","High-value goods"],
    ["When will dispatch restart?","Dispatch is expected to restart on Saturday at midday.","Saturday at midday","Saturday morning at eight","Monday afternoon"]]],
  ["bl-expand-012","B2+","sustainability","Reducing packaging","a sustainability lead announcing a packaging pilot",[
    ["What will the pilot change?","Three product lines will use reusable transport boxes.","Three lines will use reusable boxes.","All products will lose their packaging.","Customers will supply their own boxes."],
    ["Why start with these products?","Their sizes are stable and return routes already exist.","Their sizes and return routes are predictable.","They are the company's cheapest products.","They are sold only overseas."],
    ["What should warehouse staff record?","Staff should record boxes that return damaged or incomplete.","Damaged or incomplete returned boxes","Every customer's home address","The weight of each product"],
    ["What remains the same?","Protective material inside each box remains unchanged.","The internal protective material","The collection schedule","The supplier contract length"],
    ["What will define success?","Success depends on repeated box use without increased product damage.","Reuse without more product damage","A large rise in sales","Eliminating every delivery delay"]]],
  ["bl-expand-013","C1","software rollout","Staged system launch","an IT programme manager describing a system launch",[
    ["How will the system launch?","The system will launch first in two departments rather than across the company.","It will begin in two departments.","It will launch everywhere at once.","It will be limited to external partners."],
    ["Why use a staged launch?","It allows integration problems to be isolated before they affect monthly reporting.","To isolate integration problems early","To reduce software licence fees","To avoid training any staff"],
    ["What must pilot users do?","Pilot users must record the exact steps before each error.","Record steps leading to errors","Restart the system after every task","Send screenshots to all colleagues"],
    ["What is outside the pilot?","The payroll interface is outside the initial pilot.","The payroll interface","The reporting dashboard","The customer database"],
    ["What decides wider release?","Wider release requires two complete reporting cycles without a critical fault.","Two stable reporting cycles","A single positive user comment","Approval from the software supplier alone"]]],
  ["bl-expand-014","B2","business travel","Rail booking policy","a travel coordinator explaining a booking policy",[
    ["What should travellers book by default?","For journeys under four hours, staff should book standard-class rail by default.","Standard-class rail for shorter journeys","Business-class flights for all journeys","Rental cars for city-centre travel"],
    ["Why was the guidance clarified?","Different teams had interpreted the previous phrase reasonable travel differently.","Teams interpreted old guidance inconsistently.","Train fares recently doubled.","Air travel is no longer permitted."],
    ["When is an exception possible?","An exception is possible when essential equipment cannot be carried safely by train.","When essential equipment cannot travel safely","When a traveller prefers driving","When a meeting begins after lunch"],
    ["Who approves exceptions?","A department head must approve an exception before booking.","The department head","The hotel manager","The traveller's colleague"],
    ["Where should evidence be stored?","Approval evidence should be attached to the travel request.","With the travel request","In a personal email folder","On the expense receipt only"]]],
  ["bl-expand-015","C1","performance management","Quarterly reviews","a human-resources manager revising performance reviews",[
    ["What is the main change?","Quarterly conversations will replace one of the two formal annual reviews.","Quarterly conversations replace one formal review.","All performance discussions will end.","Annual reviews will happen monthly."],
    ["Why make this change?","Employees said useful feedback often arrived too late to influence current work.","Feedback was arriving too late.","Managers wanted longer forms.","Employees requested fewer conversations."],
    ["What should conversations emphasise?","Conversations should emphasise one priority and one practical support need.","One priority and one support need","A complete ranking of colleagues","Past mistakes only"],
    ["What must still be documented?","Any decision affecting pay or promotion must still be documented formally.","Pay or promotion decisions","Every informal suggestion","Personal career hopes"],
    ["How will HR evaluate the change?","HR will compare goal completion and survey whether feedback felt timely.","Goal completion and perceived timeliness","The number of pages managers write","Office attendance during review weeks"]]]
];

const GL = [
  ["gl-expand-001","B2","transport","Revised ferry stop","a ferry officer giving a travel update",[
    ["What has changed?","The afternoon ferry will use North Pier instead of Harbour Gate.","It will leave from North Pier.","It will depart from Harbour Gate.","It will terminate before the harbour."],
    ["Why is this necessary?","A damaged ramp at Harbour Gate is awaiting inspection.","A damaged ramp needs inspection.","Strong winds have closed North Pier.","The ferry needs more fuel."],
    ["What should foot passengers do?","Foot passengers should follow the blue signs from the station.","Follow blue signs from the station","Wait beside the car entrance","Buy another ticket"],
    ["What remains unchanged?","The ferry still leaves at twenty past three.","The departure time","The boarding point","The bicycle limit"],
    ["Who needs extra time?","Passengers bringing bicycles should arrive fifteen minutes earlier.","Passengers with bicycles","Passengers without luggage","Passengers holding digital tickets"]]],
  ["gl-expand-002","B2+","library","Research workshop","a librarian announcing a research workshop",[
    ["Who is the workshop for?","The workshop is for students beginning their first independent research project.","Students beginning independent research","Experienced professional researchers","Children learning to read"],
    ["What will it focus on?","It will focus on judging whether online sources are trustworthy.","Evaluating online sources","Improving handwriting","Designing presentation slides"],
    ["What should participants bring?","Participants should bring one article they are uncertain about.","One uncertain article","A completed final report","Their own printer"],
    ["What is not included?","The session will not cover statistical analysis.","Statistical analysis","Source comparison","Reference checking"],
    ["How can people attend?","People must reserve a place through the library calendar.","Reserve through the library calendar","Arrive without booking","Telephone the course tutor afterwards"]]],
  ["gl-expand-003","B2","education","Campus tour","a student guide describing a campus tour",[
    ["Where does the tour begin?","The tour begins outside the science library at ten o'clock.","Outside the science library","Inside the main hall","At the sports field"],
    ["Why is the normal route different?","Building work has closed the path beside the lake.","The lakeside path is closed for building work.","The lake has flooded.","The library is closed."],
    ["What will visitors see first?","Visitors will see the engineering studios first.","The engineering studios","The student residences","The theatre"],
    ["What should visitors wear?","Visitors should wear comfortable shoes because of several stairways.","Comfortable shoes","Formal clothes","Safety boots"],
    ["Where will questions be answered?","The guide will answer course questions in the café at the end.","In the café after the tour","During a lecture","By email before the tour"]]],
  ["gl-expand-004","B2","fitness","Pool timetable","a leisure-centre employee explaining a timetable",[
    ["What starts next week?","An early-morning lane-swimming session starts next week.","Early-morning lane swimming","An evening diving class","A weekend competition"],
    ["Why was it added?","Members asked for a quiet session before work.","Members wanted a quiet pre-work session.","The pool is too busy at lunchtime.","A coach became available at night."],
    ["What must swimmers do?","Swimmers must book by nine o'clock the previous evening.","Book the previous evening","Bring a printed medical form","Pay in cash at the pool"],
    ["What is unavailable then?","The children's pool remains closed during the early session.","The children's pool","The changing rooms","The main pool"],
    ["How long will the trial last?","The centre will test the session for six weeks.","Six weeks","Six days","Six months"]]],
  ["gl-expand-005","B2+","arts","Museum drawing class","a museum educator introducing a drawing class",[
    ["Where will the class work?","The class will work in the sculpture gallery before it opens publicly.","In the sculpture gallery","In an outdoor garden","In the museum café"],
    ["Why meet early?","The quiet gallery allows longer observation without visitor traffic.","To observe without crowds","To photograph the sunrise","To meet the sculptor"],
    ["What is provided?","The museum provides paper, boards and graphite pencils.","Paper, boards and pencils","Paint and large canvases","Digital tablets"],
    ["What is prohibited?","Charcoal is prohibited because its dust can spread.","Charcoal","Graphite pencils","Drawing boards"],
    ["What will learners do last?","Learners will compare how they represented the same sculpture.","Compare their interpretations","Sell their drawings","Clean the gallery floor"]]],
  ["gl-expand-006","B2","community","Garden volunteer day","a community organiser giving volunteer instructions",[
    ["What is the main task?","Volunteers will build raised beds for the community garden.","Build raised garden beds","Plant mature trees","Paint the community hall"],
    ["Why are raised beds needed?","The existing soil drains poorly after rain.","The soil drains poorly.","The garden is too shady.","Local animals eat the plants."],
    ["What should volunteers bring?","Volunteers should bring strong gloves and a water bottle.","Gloves and water","Their own timber","Electric tools"],
    ["What must inexperienced volunteers avoid?","Inexperienced volunteers should not operate the power saw.","Operating the power saw","Carrying soil","Measuring timber"],
    ["What happens if it rains heavily?","Heavy rain will move the work to the following Saturday.","The work moves to the following Saturday.","The event continues indoors.","Only planting will continue."]]],
  ["gl-expand-007","B2+","film","Documentary club","a club organiser describing a documentary evening",[
    ["What will be shown?","The club will show a documentary about restoring urban rivers.","A film about urban-river restoration","A drama set beside a river","A lecture about ocean travel"],
    ["Why was it selected?","Members requested a film linked to a current local planning debate.","It relates to a local planning debate.","It won the most awards.","Its director lives nearby."],
    ["What should viewers do first?","Viewers should read the one-page background note before arriving.","Read a background note","Submit a written review","Watch an earlier film"],
    ["Who joins the discussion?","A local ecologist will join the discussion by video.","A local ecologist","The film director","A city mayor"],
    ["What is different this month?","The discussion will happen before refreshments rather than after them.","Discussion comes before refreshments.","There will be no discussion.","Refreshments are served during the film."]]],
  ["gl-expand-008","C1","outdoors","Hill walk","a walk leader briefing a hiking group",[
    ["What route will the group take?","The group will take the ridge route and descend through the forest.","Up the ridge and down through the forest","Along the river in both directions","Through the forest before climbing the ridge"],
    ["Why was the original return route rejected?","Loose stone makes the steep return path unsafe after recent rain.","Loose wet stone makes it unsafe.","A bridge has been removed.","The route is too crowded."],
    ["What should walkers carry?","Walkers should carry an extra warm layer despite the mild start.","An extra warm layer","Camping equipment","A second pair of boots"],
    ["Where is water available?","Drinking water is available only at the visitor centre.","At the visitor centre","At the ridge shelter","Beside every path marker"],
    ["What may shorten the walk?","Low cloud on the ridge may require an earlier descent.","Low cloud","A late lunch","Warm weather"]]],
  ["gl-expand-009","B2","shopping","Weekend market","a market coordinator making an announcement",[
    ["Where is the market moving?","The market is moving to the covered square behind the town hall.","The covered square behind the town hall","The station car park","Inside the town hall"],
    ["Why is it moving?","The usual riverside site has no shelter from the forecast wind.","The riverside site lacks shelter.","The usual site is being sold.","The town hall requested more space."],
    ["What should shoppers use?","Shoppers should use the eastern entrance to avoid delivery vehicles.","The eastern entrance","The delivery entrance","The underground tunnel"],
    ["What will not be available?","There will be no bicycle parking inside the covered square.","Indoor bicycle parking","Food stalls","Public toilets"],
    ["When does the market close?","The market will close at four, an hour earlier than usual.","At four","At three","At five"]]],
  ["gl-expand-010","B2+","language learning","Conversation exchange","a coordinator introducing a language exchange",[
    ["How are partners matched?","Partners are matched by learning goals rather than age.","By learning goals","By age","By home address"],
    ["Why was matching changed?","Similar ages did not guarantee compatible practice needs.","Age did not predict compatible needs.","Participants refused online meetings.","Too few older people joined."],
    ["What should partners agree?","Partners should agree how much correction they want.","How much correction they want","Which language to stop using","A shared examination date"],
    ["What is discouraged?","Partners are discouraged from turning every meeting into a grammar lesson.","Making every meeting a grammar lesson","Changing discussion topics","Taking brief notes"],
    ["How is support provided?","A coordinator checks in after the first two meetings.","A check-in after two meetings","Daily classroom observation","A written test after each meeting"]]],
  ["gl-expand-011","B2","environment","Food-waste collection","a council officer explaining a collection service",[
    ["What will households receive?","Households will receive a small kitchen container and outdoor bin.","Two food-waste containers","A larger general-waste bin","Free compost for a year"],
    ["Why is the service starting?","Food waste makes up a large share of rubbish sent to landfill.","Too much food waste goes to landfill.","Residents requested weekly garden collections.","Recycling trucks are being replaced."],
    ["What may go in the bin?","Cooked food and fruit peel may both go in the bin.","Cooked food and fruit peel","Glass jars and metal cans","Only uncooked vegetables"],
    ["What must not be used?","Ordinary plastic bags must not be used as liners.","Ordinary plastic bags","Paper liners","Approved compostable liners"],
    ["When is collection?","Food-waste bins will be collected every Wednesday.","Every Wednesday","Every second Friday","Once a month"]]],
  ["gl-expand-012","B2+","health","Clinic appointment system","a clinic receptionist explaining appointments",[
    ["What can patients now book online?","Patients can now book routine nurse appointments online.","Routine nurse appointments","Emergency treatment","Specialist surgery"],
    ["Why is the service limited?","Some symptoms still need telephone assessment before booking.","Some symptoms require telephone assessment.","The website cannot show dates.","Nurses work only mornings."],
    ["What should patients update?","Patients should check that their mobile number is current.","Their mobile number","Their employer's address","Their insurance password"],
    ["Which appointment still requires a call?","A same-day urgent appointment still requires a phone call.","A same-day urgent appointment","A routine vaccination","A blood-pressure check"],
    ["What confirmation is sent?","The system sends a text confirmation and reminder.","A text confirmation and reminder","A paper letter only","An email medical report"]]],
  ["gl-expand-013","C1","theatre","Relaxed performance","a theatre manager describing a relaxed performance",[
    ["What makes the performance different?","Audience members may move, make noise or leave and return.","Movement and re-entry are permitted.","The actors improvise the entire play.","The performance has no interval."],
    ["Who may benefit?","It may benefit people who find usual theatre conventions difficult.","People uncomfortable with usual conventions","Only professional carers","People studying acting"],
    ["What adjustment is made?","Sudden sound effects will be reduced in volume.","Sudden sounds will be quieter.","All music will be removed.","Actors will use microphones."],
    ["What remains available?","The quiet room remains available throughout the performance.","A quiet room","A full meal","Backstage tours"],
    ["What should visitors expect?","The artistic content remains the same as other performances.","The same artistic content","A shorter ending","A different cast"]]],
  ["gl-expand-014","B2","adult education","Evening computing class","a tutor introducing an evening class",[
    ["What will learners create?","Learners will create a simple personal budget spreadsheet.","A personal budget spreadsheet","A public website","A computer game"],
    ["Why was this project chosen?","It practises formulas through a familiar practical task.","It teaches formulas through a practical task.","It requires advanced mathematics.","It avoids using numbers."],
    ["What should learners bring?","Learners should bring several example household expenses.","Example household expenses","A new laptop","Bank account passwords"],
    ["What is not required?","Previous spreadsheet experience is not required.","Previous spreadsheet experience","Basic mouse skills","Regular attendance"],
    ["How will files be protected?","Learners will use invented figures during shared demonstrations.","By using invented figures","By publishing files online","By emailing real statements"]]],
  ["gl-expand-015","B2+","cycling","Bicycle-share update","a transport planner explaining a bicycle-share change",[
    ["Where are new stations being added?","New stations are being added near two suburban rail stops.","Near suburban rail stops","Inside the central shopping centre","Beside rural walking paths"],
    ["Why were these locations chosen?","Many rail passengers live beyond comfortable walking distance.","Rail passengers need a link beyond walking distance.","The city centre has no bicycles.","Tourists requested longer rides."],
    ["What must users check?","Users must check that a bicycle is locked before ending a rental.","That the bicycle is locked","That its tyres are new","That the station is empty"],
    ["What fee is changing?","The fee for keeping a bicycle overnight is increasing.","The overnight-use fee","The first thirty minutes","Annual registration"],
    ["How will the change be assessed?","Planners will compare rail connections and car-park use.","Rail connections and car-park use","Tourist spending","Bicycle colour preferences"]]]
];

const GR_EXTRA = ["gr-expand-016","B2+","consumer choices","Repair café review","a review of a community repair café",[
  ["What does the service offer?","Volunteer repairers help visitors investigate faults in household objects.","Help investigating faulty household objects","Free replacement products","Professional repairs collected by post"],
  ["Why are appointments limited?","Volunteers need enough time to explain each diagnostic step.","To allow explanation of each step","Because the building closes at noon","Because tools must be hired"],
  ["What should visitors bring?","Visitors should bring any cable or charger used with the object.","The relevant cable or charger","A purchase receipt","A replacement object"],
  ["What is not guaranteed?","A successful repair cannot be guaranteed.","A successful repair","A careful diagnosis","Access to basic tools"],
  ["What did the reviewer value most?","The reviewer most valued learning how to avoid the same fault.","Learning how to prevent the fault","Receiving a new appliance","Finishing sooner than expected"]]];

const BR_CASES = [
  ["br-expand-001","B2","work patterns","Meeting-free mornings","A software team reserved two mornings a week for uninterrupted work.","Managers expected employees to resist losing flexible meeting times.","Calendar data showed that fragmented attention, not total meeting hours, caused most delays.","The team tested fixed collaboration periods in the afternoons.","people still had daily opportunities to discuss urgent work","some clients continued requesting morning calls","project tasks were completed earlier without reducing client contact","protected time works only when an alternative contact window is clear"],
  ["br-expand-002","B2+","procurement","Broader supplier search","A manufacturer wanted smaller firms to compete for service contracts.","Buyers assumed few small suppliers could satisfy the technical requirements.","A market event revealed capable firms that found the tender language confusing.","The company rewrote requirements in plain language and held an open briefing.","removing avoidable language barriers did not lower technical standards","buyers had to answer many detailed questions consistently","valid bids increased while average quality remained stable","access improves when requirements are precise rather than unnecessarily formal"],
  ["br-expand-003","B2","communication","A useful internal newsletter","An organisation reviewed an internal newsletter that few employees opened.","Editors believed the monthly publication simply needed a brighter design.","Interviews showed staff received the news after hearing it elsewhere.","Editors changed to a short weekly digest with links to optional detail.","timeliness mattered more than decorative presentation","contributors initially wrote articles that were still too long","opening rates rose and staff found policy updates more quickly","internal communication should respect when and how readers need information"],
  ["br-expand-004","B2+","staffing","Job-sharing pilot","A customer team piloted one senior role shared by two experienced employees.","Leaders feared customers would receive inconsistent decisions.","Early monitoring showed handover quality depended on shared records, not one named contact.","The partners used a common decision log and a fifteen-minute overlap each day.","both employees could see the reasoning behind previous actions","urgent cases sometimes arrived outside the overlap period","response consistency improved and neither employee accumulated excessive overtime","shared responsibility succeeds when decision history is visible"],
  ["br-expand-005","B2","workplace design","Quiet office zones","A busy office converted one area into a quiet work zone.","Facilities staff expected the rule itself to prevent interruptions.","Observation showed people entered accidentally because signs were unclear.","The office added floor markings and nearby spaces for short conversations.","staff needed an obvious alternative place to talk","some teams treated quiet space as permanent reserved seating","interruptions fell after booking limits were explained","workspace rules need physical cues and fair access arrangements"],
  ["br-expand-006","C1","logistics","Returnable packaging","A distributor tested reusable packaging for delicate equipment.","The team assumed environmental gains would automatically justify the scheme.","Initial analysis found empty return journeys could cancel much of the benefit.","Routes were redesigned so boxes returned on vehicles already making deliveries.","the scheme needed to reduce extra transport as well as waste","tracking boxes across partner companies proved difficult","damage stayed low and transport emissions fell on the redesigned routes","sustainability claims must include the whole operating system"],
  ["br-expand-007","B2+","research","A better customer survey","A service company discovered that its satisfaction survey produced little useful guidance.","Managers thought adding more questions would provide richer data.","Customers often abandoned the long form and remaining answers came from extreme opinions.","Researchers reduced it to six questions and invited a rotating sample.","a shorter representative survey was more useful than a large biased one","teams disagreed about which historical questions to remove","completion increased and moderate opinions became more visible","measurement quality depends on who responds as well as what is asked"],
  ["br-expand-008","B2","careers","Internal project marketplace","An employer created a board advertising short projects outside employees' usual teams.","Managers worried that normal work would be neglected.","The first applications came mainly from people whose managers actively encouraged them.","The company set a monthly time limit and required managers to discuss development goals.","clear boundaries protected routine responsibilities","less confident employees still hesitated to apply","participation widened after examples of small successful projects were shared","development opportunities must feel genuinely available, not merely published"],
  ["br-expand-009","C1","maintenance","Predicting equipment faults","A factory explored sensor data to predict machine failure.","Engineers expected a complex model to outperform experienced technicians.","The model detected patterns but also produced costly false alarms.","Technicians reviewed alerts and added operating context before maintenance was scheduled.","human judgement could filter signals the model could not interpret","staff needed time to agree what counted as a serious warning","unplanned stoppages fell without increasing unnecessary repairs","automation is most valuable when it strengthens rather than removes expertise"],
  ["br-expand-010","B2","employee services","Cafeteria price display","A workplace cafeteria changed how meal prices were displayed.","The operator assumed customers mainly wanted lower prices.","Feedback showed people were frustrated by discovering optional charges at the till.","Menus began showing one complete price and clearly marked paid extras.","price certainty could improve trust without reducing food quality","the till system needed several weeks of reprogramming","complaints fell even though average prices changed very little","clarity can matter as much as the absolute price"],
  ["br-expand-011","B2+","translation","Reviewing translated material","An international team revised its process for translating customer guides.","Project leads believed a fluent translator alone guaranteed accuracy.","Regional staff found technically correct phrases that sounded unnatural to customers.","A local reviewer now checks purpose and tone after specialist translation.","language quality includes audience expectations as well as literal meaning","late product changes sometimes reached reviewers too slowly","corrections after publication decreased substantially","translation needs both subject knowledge and local communication judgement"],
  ["br-expand-012","B2","benefits","Flexible staff benefits","A company let employees choose between several small wellbeing benefits.","HR expected the most expensive option to be most popular.","Choices varied strongly by life stage and working location.","The company retained equal-value options and published simple comparisons.","employees could select relevance rather than maximum price","some providers used descriptions that were difficult to compare","take-up increased across remote and office staff","fairness can mean equal value without identical provision"],
  ["br-expand-013","B2+","apprenticeships","Apprentice rotation","A technical apprenticeship added short rotations through three departments.","Supervisors feared brief placements would produce only superficial learning.","Apprentices could explain systems better after seeing how departments depended on one another.","Each rotation used one practical question linking work to the next team.","a focused question gave short placements a clear purpose","departments initially selected tasks requiring too much prior knowledge","final project proposals became more realistic and collaborative","breadth becomes useful when learners connect experiences explicitly"],
  ["br-expand-014","C1","ethics","Checking labour standards","A retailer reconsidered how it checked labour standards in its supply chain.","Executives assumed signed supplier declarations provided adequate assurance.","Worker interviews revealed subcontracting arrangements absent from formal documents.","Audits began combining records, confidential interviews and recruitment-fee checks.","different evidence sources exposed risks hidden by paperwork","access to temporary workers required negotiation with site owners","corrective plans addressed recruitment debt rather than only factory conditions","ethical review must examine how work is organised beyond the direct supplier"],
  ["br-expand-015","B2","knowledge transfer","Handover before retirement","A small firm prepared for a specialist's retirement after thirty years.","Colleagues planned to ask her to write one comprehensive manual.","Observation showed many important decisions depended on examples and exceptions.","A successor shadowed real cases and recorded short explanations of unusual choices.","knowledge could be captured while it was being applied","rare cases did not occur during every shadowing week","the team built a searchable collection that others continued to update","effective handover captures reasoning, not only standard steps"]
];

const GR_CASES = [
  ["gr-expand-001","B2","community food","Community fridge","Residents opened a shared fridge for surplus food.","Organisers expected the main problem to be attracting donations.","Donations arrived quickly, but unclear labels caused safe food to be discarded.","Volunteers introduced simple date labels and twice-daily checks.","clear handling information mattered more than increasing supply","volunteers interpreted homemade-food rules differently","waste fell and visitors trusted the service more","sharing schemes need reliable routines as well as goodwill"],
  ["gr-expand-002","B2+","study","Library study spaces","A college library tested different spaces for individual and group study.","Staff assumed silence was the priority for every student.","Surveys showed some learners needed low-level discussion to stay engaged.","One floor was divided into silent, quiet-discussion and group zones.","different tasks required different sound conditions","noise travelled between zones near the central stairs","satisfaction rose after boundaries and signs were adjusted","a useful study environment offers clear choices rather than one rule"],
  ["gr-expand-003","B2","local history","Photograph archive","A neighbourhood group invited residents to contribute old street photographs.","The group expected image scanning to take most of its time.","Volunteers struggled more with uncertain dates and unidentified locations.","Monthly identification sessions brought older and younger residents together.","shared memory could supply context missing from the photographs","people sometimes remembered the same place differently","most images gained reliable descriptions with uncertainty clearly marked","archives become valuable when evidence and memory are distinguished"],
  ["gr-expand-004","B2+","repair","Repairability map","Students mapped local places that repair everyday objects.","They assumed a simple list of addresses would be enough.","Users wanted to know which materials, brands and ages each shop accepted.","The map added searchable categories and a date for each confirmed detail.","repair information changes and must match a specific need","small shops had little time to complete long questionnaires","searches became more successful with fewer wasted journeys","public information is useful only when its limits and freshness are visible"],
  ["gr-expand-005","B2","nature","Wildlife-friendly garden","A housing group changed a neat lawn into a wildlife-friendly garden.","Some residents expected the area to look permanently untidy.","A small trial showed flowering edges could coexist with clear paths and seating.","The group used signs explaining seasonal changes and kept defined borders.","visible care helped people distinguish habitat from neglect","the first summer produced fewer flowers than the seed packet suggested","insects increased and complaints declined after the purpose was explained","environmental design also needs to communicate intention"],
  ["gr-expand-006","C1","night bus planning","Late-night bus trial","A town introduced a late-night bus on weekends.","Planners predicted demand mainly from entertainment venues in the centre.","Travel data showed many riders were evening-shift workers in outer districts.","The route was altered to connect employment areas with two housing estates.","real travel patterns differed from assumptions about nightlife","the longer route made the published timetable too optimistic","ridership grew after realistic times and safer waiting points were added","transport trials should follow observed journeys, not stereotypes about users"],
  ["gr-expand-007","B2","books","Neighbourhood book exchange","A café placed a book-exchange shelf beside its entrance.","The owner thought a rule requiring equal swaps would keep the shelf full.","People avoided borrowing when they had no book with them.","The café allowed free borrowing and requested occasional donations instead.","lowering the immediate obligation encouraged participation","popular novels disappeared faster than reference books","the collection stayed active once volunteers rotated older titles","sharing works better when contribution is flexible and easy"],
  ["gr-expand-008","B2+","school travel","Walking school bus","Families organised an adult-led walking route to primary school.","Parents believed bad weather would be the main barrier.","The larger problem was uncertainty when a regular adult became unavailable.","A shared rota named one lead and one reserve for each morning.","reliable responsibility mattered more than perfect weather","late changes were hard for families without constant phone access","attendance stabilised and car traffic near the gate declined","community routines need backup plans that everyone can see"],
  ["gr-expand-009","B2","wellbeing","Phone-free evening group","A community centre ran weekly phone-free social evenings.","Organisers expected participants to enjoy complete freedom from technology.","Some people felt anxious because family members could not reach them.","A staffed emergency number and visible clock were introduced.","participants needed reassurance rather than an absolute ban","the first venue had no secure place to store devices","people stayed longer once practical concerns were addressed","healthy boundaries are easier when essential needs remain supported"],
  ["gr-expand-010","B2+","museums","Rewriting museum labels","A museum invited visitors to comment on object labels.","Curators assumed unfamiliar technical terms caused most confusion.","Visitors understood individual words but often missed why an object mattered.","New labels began with a human question before giving technical detail.","relevance could provide a path into specialist information","some important objects had very limited historical records","visitors spent longer reading without labels becoming longer","clear explanation connects facts to a reason for caring"],
  ["gr-expand-011","B2","cooking","Flexible recipe club","A cooking club used donated ingredients that changed every week.","Members initially wanted the organiser to publish exact recipes in advance.","Fixed plans caused waste whenever expected ingredients failed to arrive.","Sessions taught adaptable methods such as soup bases and simple sauces.","techniques could absorb variation better than precise instructions","beginners worried about judging quantities without measurements","confidence grew and leftover ingredients decreased","practical learning should prepare people to respond to change"],
  ["gr-expand-012","B2+","sharing","Household tool library","Neighbours created a library for tools used only occasionally.","They assumed purchasing enough equipment would be the largest challenge.","Early loans revealed that missing instructions and returns created more work.","Each tool received a picture guide and a quick condition check.","safe repeat use depended on information and accountability","some donated tools lacked parts no volunteer could identify","late returns and minor damage both decreased","shared possessions require simple maintenance systems"],
  ["gr-expand-013","B2","media","Town podcast","Teenagers produced a podcast about changes in their town.","They planned to interview only prominent local leaders.","Trial recordings sounded formal and repeated information already in newspapers.","The team added shopkeepers, commuters and recent arrivals.","everyday experience could reveal consequences official accounts missed","background noise made several street interviews unusable","the final episodes attracted listeners from different age groups","a wider range of voices can make local reporting more informative"],
  ["gr-expand-014","B2+","language","Conversation café","A library opened a weekly café for people practising the local language.","Volunteers prepared a strict sequence of grammar exercises.","Participants spoke more freely when discussing practical situations they had faced.","Tables used picture prompts and rotating everyday themes.","meaningful topics reduced fear of making mistakes","very confident speakers sometimes dominated the conversation","turn cards gave quieter learners more opportunities","informal practice still benefits from light structure and inclusive facilitation"],
  ["gr-expand-015","C1","accessibility","Accessible nature trail","A park redesigned information for a short nature trail.","Planners first focused almost entirely on wheelchair access to the path.","Consultation revealed barriers involving sound, vision, fatigue and complex directions.","The project added resting points, tactile markers and concise audio descriptions.","accessibility involved several kinds of experience rather than one category","seasonal flooding occasionally blocked the easiest route","more visitors completed the trail independently","inclusive design improves when people describe barriers in their own terms"],
  ["gr-expand-016","B2","school costs","Second-hand uniform exchange","Parents organised an exchange for outgrown school uniform.","They expected families to value the service mainly for saving money.","Participants also appreciated reducing waste and finding discontinued sizes.","The exchange sorted items by measurement rather than age label.","actual dimensions were more reliable across different manufacturers","volunteers needed a fair method for handling heavily worn items","families found suitable clothing faster and donated more regularly","reuse services work best when quality and sizing rules are transparent"]
];

function choiceItem(fact, setIndex, itemIndex) {
  const [question, evidence, correct, wrongOne, wrongTwo] = fact;
  const labels = ["A", "B", "C"];
  const correctPosition = (setIndex + itemIndex) % 3;
  const texts = [wrongOne, wrongTwo];
  texts.splice(correctPosition, 0, correct);
  const options = labels.map((id, index) => ({ id, text: texts[index] }));
  const answer = labels[correctPosition];
  const distractorRationales = Object.fromEntries(labels
    .filter((id) => id !== answer)
    .map((id) => [id, `「${options.find((option) => option.id === id).text}」與原文線索「${evidence}」不一致。`]));
  return {
    id: `q${itemIndex + 1}`,
    question,
    responseType: "single_choice",
    options,
    answer,
    explanationZh: `關鍵線索是「${evidence}」，因此應選「${correct}」。`,
    distractorRationales,
    evidence,
  };
}

const COMPLETION = {
  "bl-expand-003": ["expenses application", "correct claim", "original receipts", "Mileage claims", "Tuesday"],
  "bl-expand-005": ["training room", "being rewired", "laptop chargers", "large-format printer", "Thursday morning"],
  "bl-expand-011": ["four", "physical count", "returned items", "Damaged goods", "Saturday at midday"],
  "gl-expand-003": ["science library", "building work", "engineering studios", "comfortable shoes", "café"],
  "gl-expand-005": ["sculpture gallery", "visitor traffic", "graphite pencils", "Charcoal", "same sculpture"],
  "gl-expand-011": ["outdoor bin", "landfill", "fruit peel", "plastic bags", "Wednesday"],
};

const GAPS = {
  "br-expand-002": {
    text: "The briefing was moved online {{1}} the room was too small. Suppliers should test the link {{2}} advance and contact us if they are unable {{3}} join. A recording will remain available {{4}} seven days, although questions can only be answered {{5}} the live session.",
    entries: [["because","although","unless"],["in","on","at"],["to","for","with"],["for","since","during"],["during","between","beside"]],
  },
  "br-expand-008": {
    text: "The audit will begin {{1}} tracing several orders through the warehouse. Supervisors must make the exception log {{2}} to the auditors. Staff should avoid changing old entries, {{3}} these form part of the evidence. Findings will be issued {{4}} recommendations are discussed, allowing managers to check them {{5}} accuracy.",
    entries: [["by","from","until"],["available","capable","possible"],["because","despite","whereas"],["before","across","without"],["for","to","with"]],
  },
  "gr-expand-002": {
    text: "The workshop is intended {{1}} students starting independent research. Participants will learn how to decide {{2}} an online source is reliable. They should bring an article they are uncertain {{3}}. Statistical analysis is not included, {{4}} the librarian can recommend a later course. Places must be reserved {{5}} the online calendar.",
    entries: [["for","by","with"],["whether","despite","unless"],["about","from","beside"],["but","so that","although"],["through","among","until"]],
  },
  "gr-expand-008": {
    text: "The group will climb by the ridge and return {{1}} the forest. Recent rain has made the steep path unsafe {{2}} loose stone. Walkers should carry a warm layer even {{3}} the valley feels mild. Water is available only {{4}} the visitor centre. The leader may turn back early {{5}} cloud reduces visibility.",
    entries: [["through","against","beyond"],["because of","instead of","apart from"],["if","so","than"],["at","between","along"],["if","despite","until"]],
  },
};

function gapItems(config, setIndex) {
  return config.entries.map((entry, index) => choiceItem([
    `Gap ${index + 1}`,
    entry[0],
    entry[0],
    entry[1],
    entry[2],
  ], setIndex, index));
}

function completionItems(facts, answers) {
  return facts.map((fact, index) => ({
    id: `q${index + 1}`,
    question: fact[0],
    responseType: "short_text",
    answer: [answers[index]],
    maxWords: answers[index].trim().split(/\s+/).length,
    explanationZh: `錄音中的原詞是「${answers[index]}」；完整線索為「${fact[1]}」。`,
    evidence: fact[1],
  }));
}

function makeSet(data, skill, setIndex, forcedId) {
  const [sourceId, level, topic, title, context, facts] = data;
  const id = forcedId ?? sourceId;
  const isListening = skill === "listening";
  const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);
  const transcript = `Here is an update about ${title.toLowerCase()}. ${facts[0][1]} ${facts[1][1]} Please remember that ${lowerFirst(facts[2][1])} Another important point is that ${lowerFirst(facts[3][1])} Finally, ${lowerFirst(facts[4][1])}`;
  const isCompletion = isListening && Boolean(COMPLETION[id]);
  const readingFacts = isListening ? facts : facts.map(([question, , originalCorrect, alternateCorrect, alternateWrong]) => [
    question,
    alternateCorrect,
    alternateCorrect,
    originalCorrect,
    alternateWrong,
  ]);
  const gapConfig = !isListening ? GAPS[id] : null;
  const isGapReading = Boolean(gapConfig);
  const readingText = readingFacts.map((fact, index) => isGapReading
    ? `${index + 1}. {{${index + 1}}}`
    : `• ${fact[1]}`).join("\n");
  return {
    id,
    domain: id.startsWith("b") ? "business" : "general",
    skill,
    taskType: isCompletion
      ? "listening_note_completion"
      : isListening
        ? "listening_five_question_mc"
        : isGapReading
          ? "reading_five_question_gap_mc"
          : "reading_five_question_mc",
    level: !isListening && level === "C1" ? "B2+" : level,
    topic,
    title: isListening ? title : `${title} — reading brief`,
    directions: isCompletion
      ? "Listen and answer each question with no more than three words from the recording."
      : isListening
        ? "Listen to the briefing and answer the five questions in order."
        : isGapReading
          ? "Choose the word or phrase that best completes each numbered point."
          : "Read the five-point notice and answer the questions.",
    prepSeconds: isListening ? 45 : 0,
    maxPlays: isListening ? 2 : 0,
    audio: isListening ? {
      asset: `audio/${id}.mp3`,
      durationEstimateSeconds: Math.max(70, Math.round(transcript.split(/\s+/).length / 2.25)),
      segments: [
        { speaker: "Narrator", voiceCue: "Neutral British narrator; clear exam pace", text: `You hear ${context}.` },
        { speaker: "Speaker", voiceCue: "Clear adult speaker; natural international English", text: transcript },
      ],
    } : null,
    stimulus: isListening
      ? isCompletion
        ? { format: "notes", text: facts.map((fact, index) => `${fact[0]}: {{${index + 1}}}`).join("\n") }
        : null
      : { format: isGapReading ? "passage" : "notice", text: isGapReading ? gapConfig.text : `Five confirmed points about ${title.toLowerCase()}:\n${readingText}` },
    items: isCompletion
      ? completionItems(facts, COMPLETION[id])
      : isGapReading
        ? gapItems(gapConfig, setIndex)
        : readingFacts.map((fact, itemIndex) => choiceItem(fact, setIndex, itemIndex)),
    strategyTags: isListening
      ? ["extended listening", "detail", "reason", "instruction"]
      : ["extended reading", "detail", "paraphrase", "inference"],
    vocabularyTags: [topic, "B2-C1 practice"],
  };
}

function readingChoice(id, question, correct, wrongOne, wrongTwo, evidence, offset) {
  return choiceItem([question, evidence, correct, wrongOne, wrongTwo], offset, Number(id.slice(1)) - 1);
}

const READING_DEPTH_NOTES = [
  ({ title, topic }) => `The ${title.toLowerCase()} review concerned ${topic}, but the team deliberately kept its claim narrow. In this ${topic} case, records were dated, comments were checked against observations, and disagreements were retained so that the final account would not describe only the most favourable experience.`,
  ({ title }) => `For ${title.toLowerCase()}, the organisers agreed in advance what would count as a useful result. The ${title.toLowerCase()} record also includes unexpected effects, since a change can solve one problem while creating another that is less visible in an overall average.`,
  ({ title, topic }) => `Because the case involved ${topic}, several groups were affected in different ways. The ${title.toLowerCase()} report therefore distinguishes direct measurements from personal preferences and explains which conclusions depend on the particular setting in which the trial took place.`,
  ({ title }) => `The account of ${title.toLowerCase()} draws on a limited review period. Its ${title.toLowerCase()} timeline includes the original plan, observations made during delivery and a later comparison, allowing readers to see where interpretation begins rather than treating every comment as equivalent evidence.`,
  ({ title, topic }) => `The ${topic} project was not evaluated only by the people who designed it. Participants in ${title.toLowerCase()} were invited to identify disadvantages, and the final record preserves points on which the group did not reach agreement.`,
  ({ title }) => `Before the ${title.toLowerCase()} decision was confirmed, the team checked whether the apparent improvement could have another explanation. That ${title.toLowerCase()} check did not remove every uncertainty, but it made the recommendation more precise and easier to test later.`,
  ({ title, topic }) => `In this ${topic} case, success was defined before the trial began. The ${title.toLowerCase()} organisers compared the final evidence with that definition instead of selecting whichever result made the change appear most successful.`,
  ({ title }) => `People reviewing ${title.toLowerCase()} were asked to separate what they had observed from what they hoped would happen in future. In the ${title.toLowerCase()} report, this distinction reduced the risk that enthusiasm for the idea would be mistaken for proof of a lasting effect.`,
  ({ title, topic }) => `The evidence in the ${topic} review comes from one local context. For ${title.toLowerCase()}, its value lies in showing why a decision was made and what happened next, not in promising that another group will obtain an identical result.`,
  ({ title }) => `A short follow-up to ${title.toLowerCase()} was scheduled before the report closed. The ${title.toLowerCase()} follow-up was intended to show whether early difficulties reflected the design itself or simply the time people needed to adjust to a new process.`,
  ({ title, topic }) => `The ${topic} evaluation includes both the intended outcome and the effort required to achieve it. In ${title.toLowerCase()}, this helps decision-makers judge whether an improvement is large enough to justify the practical cost of introducing the change.`,
  ({ title }) => `The final note on ${title.toLowerCase()} does not present disagreement as failure. In the ${title.toLowerCase()} case, contrasting experiences show which part of the conclusion is strongly supported and which part still requires a longer test.`,
  ({ title, topic }) => `Readers of the ${topic} report are given enough context to judge the limits of the evidence. For ${title.toLowerCase()}, the organisers describe the setting, the period observed and the main constraint before recommending any wider application.`,
];

function addReadingDepth(text, style, values) {
  const note = READING_DEPTH_NOTES[style % READING_DEPTH_NOTES.length](values);
  let result = `${text}\n\n${note}`;
  if (result.trim().split(/\s+/).length < 160) {
    result += ` Further evidence about ${values.title.toLowerCase()} will be collected so that the ${values.topic} conclusion can be checked over a longer period.`;
  }
  return result;
}

function addMatchingDepth(texts, style, values) {
  const note = READING_DEPTH_NOTES[style % READING_DEPTH_NOTES.length](values);
  const target = style % texts.length;
  let result = texts.map((entry, index) => index === target ? { ...entry, text: `${entry.text} ${note}` } : entry);
  if (result.flatMap(entry => entry.text.trim().split(/\s+/)).length < 160) {
    result = result.map((entry, index) => index === target ? { ...entry, text: `${entry.text} Further evidence about ${values.title.toLowerCase()} will be collected so that the ${values.topic} conclusion can be checked over a longer period.` } : entry);
  }
  return result;
}

function buildMcItems(style, values, setIndex) {
  const { title, assumption, evidence, action, reason, challenge, result, lesson, lower } = values;
  const candidates = [
    [`What is the main purpose of the account of ${title}?`,
      `to explain how evidence changed the approach to ${title.toLowerCase()}`,
      `to advertise ${title.toLowerCase()} as a solution for every organisation`,
      `to argue that collecting evidence delays useful action`,
      `${evidence} ${action}`],
    [`In the account “${title}”, what role does the early evidence play?`,
      "It weakens an explanation that had initially seemed convincing.",
      "It proves that the proposed response will work in every setting.",
      "It shows that the practical difficulty was caused by participants.",
      evidence],
    [`What can be inferred about the response tested in “${title}”?`,
      "It was intended as a testable step, not an irreversible final decision.",
      "It was chosen mainly because it required no additional effort.",
      "It repeated the arrangement that had already produced the problem.",
      `${action} ${reason}`],
    [`Why does the writer include the implementation problem in “${title}”?`,
      "to acknowledge that the reported benefit came with a practical limitation",
      "to suggest that the entire trial should be treated as invalid",
      "to blame one individual for the outcome of the project",
      challenge],
    [`Which interpretation of the result in “${title}” is best supported?`,
      "The trial produced useful local evidence, although some questions remain open.",
      "The result guarantees that the same method will succeed elsewhere.",
      "The outcome was based entirely on participants' predictions.",
      result],
    [`How does the final lesson in “${title}” relate to the trial?`,
      "It turns a local finding into cautious guidance without claiming universal proof.",
      "It rejects the measured result in favour of the original assumption.",
      "It focuses on a difficulty that the trial did not actually encounter.",
      lesson],
    [`Which description best matches the writer's attitude in “${title}”?`,
      "positive about the evidence but careful about its limits",
      "certain that the project offers a complete answer",
      "uninterested in whether the change produced a measurable result",
      `${result} ${lesson}`],
    [`What does the account “${title}” suggest about the organisers?`,
      "They were prepared to revise their view when observations contradicted it.",
      "They protected their first explanation by ignoring inconvenient information.",
      "They valued a quick decision more than a reversible experiment.",
      `${assumption} ${evidence}`],
    [`In “${title}”, which statement best distinguishes the action from the conclusion?`,
      "The action tested a practical response; the conclusion drew a broader principle from the result.",
      "The action simply repeated the initial belief; the conclusion ignored the evidence.",
      "The action measured no outcome; the conclusion focused only on the obstacle.",
      `${action} ${lesson}`],
  ];
  const order = Array.from({ length: candidates.length }, (_, offset) => (style * 2 + offset * 5) % candidates.length);
  const selected = order.slice(0, 5);
  return selected.map((candidateIndex, itemIndex) => {
    const [question, correct, wrongOne, wrongTwo, clue] = candidates[candidateIndex];
    return readingChoice(`q${itemIndex + 1}`, question, correct, wrongOne, wrongTwo, clue, setIndex);
  });
}

function buildMcArticle(style, values) {
  const { situation, assumption, evidence, action, reason, challenge, result, lesson, lower, clean, upper } = values;
  const articles = [
    () => `Case study: testing an assumption\n\n${situation} ${assumption} Yet the first review produced an awkward finding. ${evidence}\n\nThe group did not move directly from concern to permanent policy. ${action} The choice had a practical basis: ${lower(reason)}. During the trial, ${lower(challenge)}. That complication was logged rather than treated as a reason to abandon the work.\n\nThe closing review found that ${lower(result)}. The organisers compared this outcome with their original expectation and with comments from the people affected. Their final lesson was that ${lower(lesson)}. They recommended another evidence check before the approach was transferred elsewhere.`,
    () => `Internal evaluation memo\n\nIssue under review\n${situation}\n\nInitial position\n${assumption}\n\nEvidence received\n${evidence} This evidence mattered because it described what was actually happening, not what the team expected to happen.\n\nResponse and constraints\n${action} It was selected because ${lower(reason)} Implementation was not completely smooth: ${lower(challenge)}\n\nDecision note\n${upper(result)}. The review therefore records one main conclusion: ${lower(lesson)} The result supports a next step, but it is not presented as proof that every department or community would obtain the same outcome.`,
    () => `Interview with the project lead\n\nQ: What prompted the review?\nA: ${situation} ${assumption}\n\nQ: When did that view begin to change?\nA: ${evidence}\n\nQ: What did you do next?\nA: ${action} We chose that route because ${lower(reason)}.\n\nQ: Was the change easy to introduce?\nA: No. ${challenge}\n\nQ: And what did the final evidence show?\nA: ${result}\n\nQ: What should another team take from this?\nA: Our strongest conclusion is that ${lower(lesson)}. But another setting should still test its own assumptions instead of copying our decision automatically.`,
    () => `A small change with measurable consequences\n\n${situation} ${assumption} The data, however, pointed in a different direction. ${evidence}\n\nRather than debate the issue indefinitely, ${lower(action)}. The experiment was designed this way because ${lower(reason)}. One weakness soon became visible—${lower(challenge)}—so the team documented when and where that problem occurred.\n\nBy the end, ${lower(result)}. That did not settle every question, but it gave the discussion firmer ground. The people running the project now argue that ${lower(lesson)}. Their report distinguishes between the measured result and benefits that supporters merely hoped the change would produce.`,
    () => `Project diary\n\nWeek 1 — The question\n${situation} ${assumption}\n\nWeek 2 — A surprise\n${evidence} We realised that our explanation rested more on habit than on recent information.\n\nWeeks 3–6 — The trial\n${action} The reasoning was that ${lower(reason)} A difficulty appeared almost immediately: ${lower(challenge)} We kept the trial running but noted the limitation.\n\nFinal week — What changed\n${result} Looking back, the most useful lesson was that ${lower(lesson)} The diary will be reviewed again after a longer period to see whether the improvement lasts.`,
    () => `Briefing for decision-makers\n\nPurpose: to decide whether an established approach still matched current needs. ${situation}\n\n${assumption} That position became difficult to maintain once the review found that ${lower(evidence)}.\n\nThe recommended test was specific: ${lower(action)}. It offered a reasonable way forward because ${lower(reason)}. The risk log also records that ${lower(challenge)}.\n\nThe trial produced a useful but limited result: ${lower(result)}. On that basis, the briefing recommends treating the following as the guiding principle—${lower(lesson)}—while continuing to collect evidence before a wider rollout.`,
    () => `Independent observer's note\n\nI joined the project after its members had already agreed on the likely cause of the problem. ${situation} ${assumption} Soon afterwards, though, ${lower(evidence)}.\n\nThe group responded by taking a reversible step. ${action} Their explanation for the choice was that ${lower(reason)}. From an observer's perspective, the main operational weakness was clear: ${lower(challenge)}.\n\nWhen the figures were reviewed, ${lower(result)}. My reading of the evidence is close to the team's own conclusion: ${lower(lesson)}. What deserves praise is not simply the outcome, but the willingness to revise an attractive explanation when the facts did not support it.`,
    () => `What we changed—and why\n\nThe problem\n${situation}\n\nWhat we used to believe\n${assumption}\n\nWhat users or staff showed us\n${evidence}\n\nOur response\n${action} This was not chosen for novelty. It was chosen because ${lower(reason)}\n\nWhat nearly went wrong\n${challenge}\n\nWhat the trial showed\n${result}\n\nWhat we would tell another organisation\n${upper(lesson)}. Start with the evidence behind the problem, preserve a way to reverse the change, and record disadvantages as carefully as improvements.`,
    () => `Retrospective: from certainty to evidence\n\n${situation} ${assumption} That confidence faded when ${lower(evidence)}.\n\nThe team then asked what it could test without committing to a permanent redesign. Its answer was to proceed as follows: ${lower(action)}. The idea was defensible because ${lower(reason)}. Even so, ${lower(challenge)}.\n\nAt the retrospective meeting, the most important result was that ${lower(result)}. Participants disagreed about some secondary benefits, so those claims were left out of the final recommendation. What remained was a more cautious lesson: ${lower(lesson)}.`,
    () => `Consultation summary\n\nWhy people were consulted\n${situation} ${assumption}\n\nWhat respondents added\n${evidence} That contribution changed the focus from defending the existing arrangement to testing an alternative.\n\nWhat was tested\n${action} This option was preferred because ${lower(reason)}. Several respondents warned about implementation, and in practice ${lower(challenge)}.\n\nWhat happens next\n${result} The summary does not claim universal success. It records that ${lower(lesson)}. Further comments will be collected before any longer-term decision.`,
    () => `Research digest\n\nQuestion: ${situation}\n\nWorking hypothesis: ${assumption}\n\nContrary observation: ${evidence}\n\nMethod: ${action} This method was selected because ${lower(reason)}\n\nLimitation: ${challenge}\n\nFinding: ${result}\n\nInterpretation: ${upper(lesson)}. The finding is useful because it links the intervention to an observed outcome, although the short trial and local conditions prevent a claim that the same effect will occur in every context.`,
    () => `Email from the review coordinator\n\nSubject: What the trial tells us\n\nThank you to everyone who contributed. ${situation} ${assumption} The evidence submitted during the first week challenged it. ${evidence}\n\nWe therefore agreed that ${lower(action)}. This option made sense because ${lower(reason)}. Please note one problem that affected delivery: ${lower(challenge)}.\n\nThe final comparison shows that ${lower(result)}. My recommendation is based on a narrower but more defensible conclusion: ${lower(lesson)}. The attached action list separates that evidence from suggestions that still need testing.`,
    () => `A decision in four stages\n\n1 — Define the concern\n${situation}\n\n2 — Test the explanation\n${assumption} It weakened when ${lower(evidence)}.\n\n3 — Try a limited response\n${action} The team selected it because ${lower(reason)}. Delivery revealed a constraint: ${lower(challenge)}.\n\n4 — Compare and learn\n${result} The final record states that ${lower(lesson)}. It also identifies which parts of the process depended on local conditions, so future teams know what must be tested again.`,
  ];
  return articles[style % articles.length]();
}

function buildMatchingTexts(style, values) {
  const { situation, assumption, evidence, action, reason, challenge, result, lesson, lower, clean, upper } = values;
  const headingSets = [
    ["Morgan", "Leila", "Chen", "Priya"], ["Reviewer 1", "Reviewer 2", "Reviewer 3", "Reviewer 4"],
    ["North team", "East team", "South team", "West team"], ["Alex", "Sam", "Jordan", "Riley"],
    ["Comment A", "Comment B", "Comment C", "Comment D"], ["Operations", "Users", "Evaluation", "Planning"],
    ["First account", "Second account", "Third account", "Fourth account"], ["Nadia", "Tomas", "Mei", "Owen"],
  ];
  const wrappers = [
    [
      `${situation} ${assumption} The idea appeared plausible, so the team wrote it down as a claim to be checked rather than a fact.`,
      `${evidence} This changed the discussion because the new information described actual experience rather than an expected pattern.`,
      `${action} The approach was selected because ${lower(reason)} During delivery, ${lower(challenge)} Both the intended effect and this drawback were recorded.`,
      `${upper(result)}. The organisers concluded that ${lower(lesson)} They recommended retesting the principle before using it in a different setting.`,
    ],
    [
      `${situation} In the first meeting, ${lower(assumption)}. Nobody objected, but the group agreed that confidence was not the same as evidence.`,
      `The review then produced a fact that did not fit the story: ${lower(evidence)} Attention shifted from defending the old explanation to understanding the new result.`,
      `A reversible trial followed. ${action} This made sense because ${lower(reason)} One complication was that ${lower(challenge)}`,
      `At the final meeting, ${lower(result)} The group kept one conclusion for future work: ${lower(lesson)} Other possible benefits were left as questions, not reported as findings.`,
    ],
    [
      `${situation} ${assumption} This working assumption shaped the earliest proposal, although no recent measurement yet supported it.`,
      `${evidence} Once this information was available, the team could no longer treat its starting view as a sufficient explanation.`,
      `${action} The reason for this design was that ${lower(reason)} The log also shows that ${lower(challenge)}`,
      `${result} The report's recommendation is cautious: ${lower(lesson)} Local conditions are listed so that readers can judge whether the finding transfers.`,
    ],
    [
      `The review began with a practical concern. ${situation} ${assumption}`,
      `A different picture emerged from the first evidence: ${lower(evidence)} The project question was rewritten before any action was approved.`,
      `${action} It was preferred because ${lower(reason)} Yet implementation exposed a weakness: ${lower(challenge)}`,
      `${upper(result)}. The clearest learning point was that ${lower(lesson)} The team separated that conclusion from personal impressions in its published note.`,
    ],
    [
      `${situation} ${assumption} The organisers scheduled a short evidence review before committing resources.`,
      `That review found that ${lower(evidence)} It did not reveal a complete solution, but it showed why the first proposal needed revision.`,
      `The revised response was specific. ${action} It was justified on the grounds that ${lower(reason)} In practice, ${lower(challenge)}`,
      `The evaluation found that ${lower(result)} From this, the organisers inferred that ${lower(lesson)} They avoided making claims about outcomes they had not measured.`,
    ],
    [
      `${situation} Asked for an immediate answer, the group offered a simple explanation. ${assumption} It later agreed to test this account.`,
      `${evidence} That observation mattered because it came from the process itself, not from opinions about how the process ought to work.`,
      `${action} The group chose this action because ${lower(reason)} The most significant delivery issue was that ${lower(challenge)}`,
      `${result} The final reflection states that ${lower(lesson)} A follow-up will examine whether the outcome continues over time.`,
    ],
    [
      `${situation} ${assumption} Before approval, a reviewer asked what evidence would disprove that explanation.`,
      `The answer arrived quickly: ${lower(evidence)} This reality check narrowed the options considered suitable for testing.`,
      `${action} The limited test was chosen because ${lower(reason)} Its record notes one unexpected burden: ${lower(challenge)}`,
      `${upper(result)}. The next step is guided by the conclusion that ${lower(lesson)} Any wider rollout will include a new baseline measurement.`,
    ],
    [
      `${situation} ${assumption} The review panel treated this as an initial case, not a settled conclusion.`,
      `Counter-evidence came from recent experience: ${lower(evidence)} It required the panel to consider a different response.`,
      `${action} The method was selected because ${lower(reason)} During implementation, ${lower(challenge)} This reduced certainty but did not make the trial unusable.`,
      `${result} The panel's recommendation is based on one defensible lesson: ${lower(lesson)} It calls for the limits of the evidence to remain visible.`,
    ],
  ];
  const paragraphs = wrappers[style % wrappers.length];
  const source = [
    { roles: ["assumption"], text: paragraphs[0] },
    { roles: ["evidence"], text: paragraphs[1] },
    { roles: ["reason", "challenge"], text: paragraphs[2] },
    { roles: ["result", "lesson"], text: paragraphs[3] },
  ];
  const permutations = [
    [2,0,3,1], [1,3,0,2], [3,1,2,0], [0,2,1,3],
    [2,3,1,0], [1,0,3,2], [3,2,0,1], [0,3,2,1],
  ];
  const permutation = permutations[style % permutations.length];
  const headings = headingSets[style % headingSets.length];
  const roleMap = {};
  const texts = permutation.map((sourceIndex, displayIndex) => {
    const id = String.fromCharCode(65 + displayIndex);
    source[sourceIndex].roles.forEach((role) => { roleMap[role] = id; });
    return { id, heading: headings[displayIndex], text: source[sourceIndex].text };
  });
  return { texts, roleMap };
}

const MATCH_PROMPTS = {
  assumption: ["mentions a belief that was accepted before evidence was gathered", "describes what people expected at the beginning", "identifies the explanation the group first considered likely"],
  evidence: ["reports an observation that did not fit the initial explanation", "contains information that forced the team to reconsider", "describes the finding that changed the direction of the review"],
  reason: ["explains why the tested response was considered suitable", "gives the justification for the action that was chosen", "states the reasoning behind the trial design"],
  challenge: ["mentions a cost or difficulty that appeared during implementation", "describes an obstacle encountered while the response was tested", "acknowledges a practical limitation of the trial"],
  result: ["reports what changed after the response was introduced", "describes the measured outcome of the trial", "states what the final comparison found"],
  lesson: ["draws a principle that could guide later decisions", "states the broader lesson taken from the local result", "offers a cautious recommendation for future work"],
};

function makeReadingCase(data, index) {
  const [id, level, topic, title, situation, assumption, evidence, action, reason, challenge, result, lesson] = data;
  const clean = (value) => value.replace(/[.!?]+$/, "");
  const lower = (value) => clean(value).charAt(0).toLowerCase() + clean(value).slice(1);
  const upper = (value) => clean(value).charAt(0).toUpperCase() + clean(value).slice(1);
  const mode = index % 3;
  const style = Math.floor(index / 3) + (id.startsWith("gr-") ? 7 : 0);
  const base = {
    id, domain: id.startsWith("br-") ? "business" : "general", skill: "reading", level, topic, title,
    prepSeconds: 0, maxPlays: 0, audio: null,
    strategyTags: ["paraphrase", "purpose", "implication", "evidence"],
    vocabularyTags: [topic, "B2-C1 reading"],
  };
  const values = { title, topic, situation, assumption, evidence, action, reason, challenge, result, lesson, clean, lower, upper };

  if (mode === 0) {
    return {
      ...base,
      taskType: "reading_five_question_mc",
      directions: "Read the article and answer the five questions.",
      stimulus: { format: "article", text: addReadingDepth(buildMcArticle(style, values), style, values) },
      items: buildMcItems(style, values, index),
    };
  }

  if (mode === 1) {
    const gapVariants = [
      [["Although","Because","Unless"],["As a result","In contrast","For example"],["because","despite","whereas"],["After","Without","Beside"],["that","what","than"]],
      [["While","If","Until"],["Consequently","Nevertheless","Similarly"],["since","despite","unless"],["Following","Across","Without"],["how","whether","than"]],
      [["Even though","As if","So that"],["For that reason","On the contrary","In addition"],["as","although","whereas"],["At the end of","Instead of","Prior to"],["that","which","what"]],
    ];
    const gaps = gapVariants[Math.floor(index / 3) % gapVariants.length];
    const frameOpeners = [
      "Evaluation note", "Lessons from a pilot", "Reviewer's summary", "A change under examination", "Project update", "Evidence brief", "Field report", "Decision log", "What the trial revealed", "A measured response", "Implementation review", "Testing the first explanation", "Follow-up note",
    ];
    const bridgeOne = [
      "The contradiction was important enough to test rather than explain away.",
      "That contrast shifted attention from opinions to observable behaviour.",
      "The group therefore replaced a broad debate with a limited experiment.",
      "This made the original proposal less certain and a reversible trial more useful.",
      "Instead of defending its first account, the team defined what evidence it needed next.",
      "The new information did not supply an answer, but it clarified the decision.",
      "People affected by the issue were invited to comment before the response began.",
      "The assumption remained possible, but it could no longer be treated as established fact.",
      "A short test offered a way to compare the competing explanations.",
      "The organisers agreed to measure an outcome rather than rely on enthusiasm.",
      "The review panel asked for a trial with a clear end point.",
      "This evidence changed both the question and the standard for success.",
      "A baseline was recorded before any practical change was made.",
    ];
    const bridgeTwo = [
      "The difficulty was included in the final evaluation.",
      "Staff recorded when the problem occurred so that it would not be hidden by the average result.",
      "This limitation reduced confidence in some claims but did not erase the measured outcome.",
      "The project log distinguishes this cost from the benefits reported by supporters.",
      "Organisers adjusted the schedule but did not change the agreed success measure.",
      "The complication is important because another setting might experience it differently.",
      "Both positive and negative experiences were retained in the evidence summary.",
      "The team treated the obstacle as data about implementation, not merely inconvenience.",
      "A later review will check whether this problem becomes smaller with experience.",
      "The final report explains how this issue affected the interpretation of results.",
      "No attempt was made to remove less favourable responses from the comparison.",
      "The trial continued, but the limitation remained visible in the recommendation.",
      "Readers can therefore separate the outcome from the effort required to achieve it.",
    ];
    const closingChecks = [
      "The closing review compared this change with the position recorded at the beginning.",
      "Evaluators checked the figures against both the baseline and the experiences reported by participants.",
      "The group separated the measured outcome from improvements that supporters only hoped to see.",
      "Before agreeing its conclusion, the panel looked again at responses that were less positive.",
      "The final comparison considered the outcome, the implementation cost and the original objective.",
      "A reviewer who had not managed the project checked whether the evidence supported the claim.",
      "The summary identifies which result was measured and which possible benefit remains uncertain.",
      "Participants were invited to question the interpretation before the report was completed.",
      "The decision record links its recommendation to the evidence collected during the test.",
      "Results were compared across the full trial rather than only its most successful period.",
      "The team reviewed unexpected effects before deciding what should happen next.",
      "The evaluation retained observations that complicated the most favourable interpretation.",
      "The report explains the standard used to decide whether the change had been worthwhile.",
    ];
    const closingLimits = [
      "It remains a finding from one setting and should be tested again before wider use.",
      "The recommendation is deliberately narrower than a claim that the method will always work.",
      "Other groups are advised to examine their own conditions before adopting the same response.",
      "The evidence supports another step, but not a promise of identical results elsewhere.",
      "The authors describe a useful direction rather than a universal solution.",
      "A longer follow-up is still needed to show whether the effect will last.",
      "The local result is informative, although it does not remove the need for further comparison.",
      "The report avoids extending its conclusion beyond the people and period actually studied.",
      "Future trials will need to check whether the same balance of benefits and costs appears.",
      "The conclusion guides the next decision while leaving room for contrary evidence.",
      "No claim is made that a different organisation would face the same constraints.",
      "The organisers present the lesson as testable guidance, not a rule.",
      "Readers are given the limits of the trial so they can judge how far the result applies.",
    ];
    const text = `${frameOpeners[style % frameOpeners.length]}\n\n${situation} {{1}} ${lower(assumption)}, ${lower(evidence)}. ${bridgeOne[style % bridgeOne.length]}\n\n{{2}}, ${lower(action)}. The response was selected {{3}} ${clean(reason)}. During implementation, ${lower(challenge)}. ${bridgeTwo[style % bridgeTwo.length]}\n\n{{4}} the trial period, ${lower(result)}. ${closingChecks[style % closingChecks.length]} They stressed {{5}} ${clean(lesson)}. ${closingLimits[style % closingLimits.length]}`;
    return {
      ...base,
      taskType: "reading_five_question_gap_mc",
      directions: "Choose the word or phrase that best completes each gap.",
      stimulus: { format: "article", text: addReadingDepth(text, style, values) },
      items: gaps.map((entry, itemIndex) => readingChoice(`q${itemIndex + 1}`, `Gap ${itemIndex + 1}`, entry[0], entry[1], entry[2], entry[0], index)),
    };
  }

  const builtMatching = buildMatchingTexts(style, values);
  const texts = addMatchingDepth(builtMatching.texts, style, values);
  const { roleMap } = builtMatching;
  const sharedOptions = texts.map(({ id: optionId, heading }) => ({ id: optionId, text: heading }));
  const roleClues = { assumption, evidence, reason, challenge, result, lesson };
  const roleOrders = [
    ["challenge","assumption","lesson","evidence","reason"],
    ["result","reason","evidence","challenge","lesson"],
    ["evidence","lesson","assumption","result","challenge"],
    ["reason","challenge","result","assumption","lesson"],
    ["lesson","evidence","reason","result","assumption"],
    ["assumption","result","challenge","reason","evidence"],
  ];
  const roles = roleOrders[style % roleOrders.length];
  const match = (itemId, question, answer, clue) => ({
    id: itemId, question, responseType: "matching", answer,
    explanationZh: `線索「${clue}」出現在 ${answer} 段，因此應配對該段。`, evidence: clue,
  });
  return {
    ...base,
    taskType: "reading_multiple_text_matching",
    directions: "Read the four sections. Match each statement with the section that contains the information.",
    stimulus: { format: "multiple_texts", texts }, sharedOptions,
    items: [
      ...roles.map((role, itemIndex) => match(
        `q${itemIndex + 1}`,
        `In “${title}”, which section ${MATCH_PROMPTS[role][style % MATCH_PROMPTS[role].length]}?`,
        roleMap[role],
        roleClues[role],
      )),
    ],
  };
}

const bank = JSON.parse(await readFile(bankPath, "utf8"));
const readingPlus = JSON.parse(await readFile(readingPlusPath, "utf8"));
bank.sets = bank.sets.filter((set) => !/-expand-/.test(set.id));
const additions = [];

BL.forEach((data, index) => additions.push(makeSet(data, "listening", index)));
additions.push(...GENERAL_LISTENING_REBUILD);
const allBusinessReading = [...BR_CASES, ...readingPlus.business];
const allGeneralReading = [...GR_CASES, ...readingPlus.general];
allBusinessReading.forEach((data, index) => additions.push(makeReadingCase(data, index)));
allGeneralReading.forEach((data, index) => additions.push(makeReadingCase(data, index)));

const existing = new Set(bank.sets.map((set) => set.id));
for (const set of additions) {
  if (!existing.has(set.id)) {
    bank.sets.push(set);
    existing.add(set.id);
  }
}
bank.contentVersion = "2026-11-04.2";
await writeFile(bankPath, `${JSON.stringify(bank, null, 2)}\n`, "utf8");

const counts = {};
const taskFamilyCounts = {};
for (const set of bank.sets) {
  const key = `${set.domain}-${set.skill}`;
  counts[key] = (counts[key] ?? 0) + set.items.length;
  taskFamilyCounts[set.taskType] = (taskFamilyCounts[set.taskType] ?? 0) + set.items.length;
}
const countsPath = new URL("./counts.json", import.meta.url);
let generatedAt = new Date().toISOString();
try {
  const previousCounts = JSON.parse(await readFile(countsPath, "utf8"));
  if (previousCounts.contentVersion === bank.contentVersion && previousCounts.generatedAt) {
    generatedAt = previousCounts.generatedAt;
  }
} catch {
  // The report is created on the first run.
}
await writeFile(countsPath, `${JSON.stringify({
  schemaVersion: 1,
  contentVersion: bank.contentVersion,
  generatedAt,
  totalSets: bank.sets.length,
  totalScoredResponses: bank.sets.reduce((total, set) => total + set.items.length, 0),
  scoredResponsesByDomain: counts,
  scoredResponsesByTaskFamily: taskFamilyCounts,
}, null, 2)}\n`, "utf8");

console.log(JSON.stringify({ added: additions.length, totalSets: bank.sets.length, counts, taskFamilyCounts }, null, 2));


