import { useState, useMemo, useRef, useEffect } from 'react';

// ── Embedded data (from lv2_1_pipeline_ingestion_group.csv + lv2_1_pipeline_ingestion_group_plan.csv) ──
const GROUP_DATA = [
  { group: 'Aetna',         v8: 688035461213,  v9: 688035461213,  reused: true  },
  { group: 'BCBS',          v8: 282869118953,  v9: 309575557040,  reused: false },
  { group: 'Cigna',         v8: 75975645387,   v9: 107313017832,  reused: false },
  { group: 'Network Plans', v8: 11246477102,   v9: 321801463518,  reused: false },
  { group: 'UHC',           v8: 284445600239,  v9: 638561954898,  reused: false },
];

interface PlanRow {
  plan: string; group: string; cls: string; ver: string;
  codes: number; npi: number; tax: number; msa: number; recs: number;
}

const PLAN_DATA: PlanRow[] = [{"plan":"Aetna Open Choice PPO","group":"Aetna","cls":"professional","ver":"v8","codes":28820,"npi":2123392,"tax":769,"msa":1,"recs":328025427920},{"plan":"Aetna Choice POS","group":"Aetna","cls":"institutional","ver":"v8","codes":28840,"npi":9930,"tax":191,"msa":1,"recs":478827925},{"plan":"Aetna Choice POS","group":"Aetna","cls":"professional","ver":"v8","codes":28819,"npi":2129614,"tax":769,"msa":1,"recs":358925538007},{"plan":"Aetna Open Choice PPO","group":"Aetna","cls":"institutional","ver":"v8","codes":28841,"npi":9907,"tax":191,"msa":1,"recs":605667361},{"plan":"BCBS TN Blue Network P","group":"BCBS","cls":"professional","ver":"v8","codes":7723,"npi":48572,"tax":401,"msa":1,"recs":41519428200},{"plan":"Anthem BCBS NV BluePreferred","group":"BCBS","cls":"professional","ver":"v8","codes":7998,"npi":17544,"tax":355,"msa":1,"recs":326431156},{"plan":"Excellus BCBS BluePPO","group":"BCBS","cls":"professional","ver":"v9","codes":8140,"npi":1976,"tax":143,"msa":1,"recs":31638650},{"plan":"Regence BS Preferred Plan","group":"BCBS","cls":"professional","ver":"v8","codes":8082,"npi":44301,"tax":396,"msa":1,"recs":623469306},{"plan":"BCBS HI Preferred Provider Program","group":"BCBS","cls":"professional","ver":"v8","codes":8492,"npi":8961,"tax":335,"msa":1,"recs":137877747},{"plan":"BCBS NM BlueCard PPO","group":"BCBS","cls":"institutional","ver":"v8","codes":5797,"npi":6877,"tax":293,"msa":1,"recs":1673736},{"plan":"Wellmark BCBS IA Alliance Select","group":"BCBS","cls":"institutional","ver":"v8","codes":2823,"npi":600,"tax":30,"msa":1,"recs":754879},{"plan":"BCBS TX MyBlue Health HMO","group":"BCBS","cls":"professional","ver":"v8","codes":8067,"npi":100045,"tax":466,"msa":1,"recs":303763144},{"plan":"Anthem BCBS NV BluePreferred","group":"BCBS","cls":"institutional","ver":"v8","codes":7863,"npi":17359,"tax":355,"msa":1,"recs":44950369},{"plan":"Regence BS ID PPO","group":"BCBS","cls":"institutional","ver":"v8","codes":9593,"npi":151,"tax":27,"msa":1,"recs":461645},{"plan":"Anthem BCBS NH Preferred Blue","group":"BCBS","cls":"institutional","ver":"v8","codes":7738,"npi":163,"tax":28,"msa":1,"recs":90416},{"plan":"Anthem BCBS GA Blue High Performance","group":"BCBS","cls":"professional","ver":"v9","codes":8382,"npi":43656,"tax":449,"msa":1,"recs":3375672186},{"plan":"BCBS TX Blue Essentials","group":"BCBS","cls":"institutional","ver":"v8","codes":7939,"npi":179780,"tax":544,"msa":1,"recs":28295583},{"plan":"BCBS NC Preferred Provider Network","group":"BCBS","cls":"institutional","ver":"v8","codes":6477,"npi":332,"tax":30,"msa":1,"recs":432208},{"plan":"BCBS MS Network Blue","group":"BCBS","cls":"professional","ver":"v8","codes":8005,"npi":13380,"tax":274,"msa":1,"recs":128029196},{"plan":"Anthem BC CA BlueCross PPO","group":"BCBS","cls":"professional","ver":"v8","codes":8383,"npi":179668,"tax":585,"msa":1,"recs":5266492767},{"plan":"Anthem BCBS VA KeyCare PPO","group":"BCBS","cls":"institutional","ver":"v8","codes":7896,"npi":812,"tax":50,"msa":1,"recs":417560},{"plan":"Premera BC Heritage","group":"BCBS","cls":"institutional","ver":"v8","codes":9750,"npi":1080,"tax":91,"msa":1,"recs":219116419},{"plan":"BCBS KS Blue Choice","group":"BCBS","cls":"institutional","ver":"v8","codes":9727,"npi":322,"tax":26,"msa":1,"recs":2306175},{"plan":"BCBS IL Participating Provider Option","group":"BCBS","cls":"institutional","ver":"v8","codes":9694,"npi":100057,"tax":544,"msa":1,"recs":1717805},{"plan":"CareFirst BCBS BlueChoice Alternate Network","group":"BCBS","cls":"professional","ver":"v8","codes":8731,"npi":35538,"tax":343,"msa":1,"recs":474067863},{"plan":"Capital BC PA Traditional","group":"BCBS","cls":"institutional","ver":"v8","codes":9619,"npi":201,"tax":24,"msa":1,"recs":1626549},{"plan":"Anthem BCBS GA Blue High Performance","group":"BCBS","cls":"institutional","ver":"v9","codes":9626,"npi":1122,"tax":57,"msa":1,"recs":8413154},{"plan":"Anthem BC CA BlueCross PPO","group":"BCBS","cls":"institutional","ver":"v8","codes":9090,"npi":3436,"tax":101,"msa":1,"recs":6273252},{"plan":"BCBS FL Traditional","group":"BCBS","cls":"institutional","ver":"v8","codes":8234,"npi":2052,"tax":70,"msa":1,"recs":2425624},{"plan":"BCBS TX MyBlue Health HMO","group":"BCBS","cls":"professional","ver":"v9","codes":8067,"npi":101676,"tax":475,"msa":1,"recs":555256584},{"plan":"BCBS NC Blue Advantage Options","group":"BCBS","cls":"professional","ver":"v8","codes":8271,"npi":92654,"tax":424,"msa":1,"recs":1439118880},{"plan":"Anthem BCBS GA Blue High Performance","group":"BCBS","cls":"institutional","ver":"v8","codes":9626,"npi":927,"tax":46,"msa":1,"recs":1190216},{"plan":"BCBS MI Blue Preferred Plan","group":"BCBS","cls":"institutional","ver":"v8","codes":3073,"npi":1332,"tax":58,"msa":1,"recs":1995065},{"plan":"Anthem BCBS GA Blue Open Access POS","group":"BCBS","cls":"professional","ver":"v8","codes":8383,"npi":76525,"tax":510,"msa":1,"recs":1967053723},{"plan":"BCBS IL Blue Choice Preferred PPO","group":"BCBS","cls":"institutional","ver":"v8","codes":9657,"npi":85056,"tax":512,"msa":1,"recs":1702911},{"plan":"Anthem BCBS Central Blue Access","group":"BCBS","cls":"institutional","ver":"v8","codes":9458,"npi":298119,"tax":618,"msa":1,"recs":4319302884},{"plan":"Anthem BCBS NH Preferred Blue","group":"BCBS","cls":"professional","ver":"v8","codes":8388,"npi":24894,"tax":388,"msa":1,"recs":554850542},{"plan":"BCBS AZ PPO","group":"BCBS","cls":"professional","ver":"v8","codes":8316,"npi":16043,"tax":315,"msa":1,"recs":247848108},{"plan":"BCBS KC Preferred Care","group":"BCBS","cls":"professional","ver":"v8","codes":8248,"npi":17586,"tax":323,"msa":1,"recs":8297993036},{"plan":"Anthem BCBS CT Century Preferred","group":"BCBS","cls":"institutional","ver":"v8","codes":8081,"npi":283,"tax":29,"msa":1,"recs":111336},{"plan":"Capital BC PA PPO","group":"BCBS","cls":"professional","ver":"v8","codes":8217,"npi":38987,"tax":389,"msa":1,"recs":496175564},{"plan":"Regence BS Preferred Plan","group":"BCBS","cls":"institutional","ver":"v8","codes":9595,"npi":215,"tax":32,"msa":1,"recs":371571},{"plan":"BCBS NC Classic Blue","group":"BCBS","cls":"professional","ver":"v9","codes":8261,"npi":90258,"tax":422,"msa":1,"recs":1697652845},{"plan":"BCBS NE Network Blue","group":"BCBS","cls":"institutional","ver":"v8","codes":9479,"npi":3248,"tax":154,"msa":1,"recs":21360415},{"plan":"BCBS NC Blue Advantage Options","group":"BCBS","cls":"institutional","ver":"v8","codes":6488,"npi":450,"tax":30,"msa":1,"recs":490846},{"plan":"Capital BC PA Traditional","group":"BCBS","cls":"professional","ver":"v8","codes":8185,"npi":38883,"tax":388,"msa":1,"recs":354619300},{"plan":"BCBS VT Vermont Freedom Plan","group":"BCBS","cls":"institutional","ver":"v8","codes":8780,"npi":96,"tax":24,"msa":1,"recs":599208},{"plan":"BCBS TX Blue Choice PPO","group":"BCBS","cls":"professional","ver":"v8","codes":8091,"npi":182976,"tax":543,"msa":1,"recs":970985238},{"plan":"Anthem BCBS NY Empire PPO","group":"BCBS","cls":"institutional","ver":"v8","codes":8931,"npi":989,"tax":62,"msa":1,"recs":1726218},{"plan":"Highmark BCBS DE Blue Choice","group":"BCBS","cls":"institutional","ver":"v8","codes":3431,"npi":122,"tax":19,"msa":1,"recs":12920},{"plan":"Independence BC PA Personal Choice","group":"BCBS","cls":"institutional","ver":"v8","codes":982,"npi":3180,"tax":206,"msa":1,"recs":137282},{"plan":"Capital BC PA Traditional","group":"BCBS","cls":"institutional","ver":"v9","codes":9621,"npi":246,"tax":34,"msa":1,"recs":3641252},{"plan":"Highmark BCBS WV Super Blue Plus","group":"BCBS","cls":"institutional","ver":"v8","codes":4365,"npi":214,"tax":20,"msa":1,"recs":39249},{"plan":"BCBS TX MyBlue Health HMO","group":"BCBS","cls":"institutional","ver":"v9","codes":7884,"npi":100434,"tax":472,"msa":1,"recs":13566570},{"plan":"BCBS FL Blue Choice PPO","group":"BCBS","cls":"institutional","ver":"v8","codes":8240,"npi":2078,"tax":70,"msa":1,"recs":2509838},{"plan":"Anthem BCBS ME Blue Choice","group":"BCBS","cls":"institutional","ver":"v8","codes":7160,"npi":200,"tax":38,"msa":1,"recs":140751},{"plan":"BCBS TX Blue Essentials","group":"BCBS","cls":"professional","ver":"v8","codes":8102,"npi":180984,"tax":542,"msa":1,"recs":959506142},{"plan":"BCBS TX Blue Essentials","group":"BCBS","cls":"professional","ver":"v9","codes":8102,"npi":184050,"tax":550,"msa":1,"recs":1623819720},{"plan":"BCBS NC Preferred Provider Network","group":"BCBS","cls":"professional","ver":"v8","codes":8271,"npi":90912,"tax":423,"msa":1,"recs":1395243381},{"plan":"BCBS NE Network Blue","group":"BCBS","cls":"professional","ver":"v8","codes":7854,"npi":15363,"tax":295,"msa":1,"recs":418312583},{"plan":"Regence BCBS OR Preferred Provider Plan","group":"BCBS","cls":"institutional","ver":"v8","codes":9373,"npi":207,"tax":34,"msa":1,"recs":613236},{"plan":"Horizon BCBS NJ Direct Access","group":"BCBS","cls":"professional","ver":"v8","codes":8290,"npi":86747,"tax":497,"msa":1,"recs":54826135225},{"plan":"BCBS IL Participating Provider Option","group":"BCBS","cls":"professional","ver":"v8","codes":7711,"npi":120350,"tax":571,"msa":1,"recs":362446478},{"plan":"Capital BC PA Traditional","group":"BCBS","cls":"professional","ver":"v9","codes":8233,"npi":39888,"tax":389,"msa":1,"recs":689984245},{"plan":"BCBS AR True Blue PPO","group":"BCBS","cls":"professional","ver":"v8","codes":7793,"npi":3214,"tax":184,"msa":1,"recs":64229130},{"plan":"Excellus BCBS BluePPO","group":"BCBS","cls":"institutional","ver":"v9","codes":9274,"npi":274,"tax":40,"msa":1,"recs":585939},{"plan":"BCBS AL Preferred Care","group":"BCBS","cls":"institutional","ver":"v8","codes":8330,"npi":464,"tax":19,"msa":1,"recs":962973},{"plan":"BCBS TX Blue Essentials","group":"BCBS","cls":"institutional","ver":"v9","codes":7958,"npi":183001,"tax":552,"msa":1,"recs":53295492},{"plan":"BCBS IL Blue Advantage HMO","group":"BCBS","cls":"institutional","ver":"v9","codes":9668,"npi":32222,"tax":362,"msa":1,"recs":5172804},{"plan":"BCBS SC Preferred Blue","group":"BCBS","cls":"professional","ver":"v8","codes":496,"npi":5648,"tax":246,"msa":1,"recs":5156634},{"plan":"BCBS IL Blue Choice Preferred PPO","group":"BCBS","cls":"professional","ver":"v8","codes":7695,"npi":108710,"tax":548,"msa":1,"recs":303434690},{"plan":"Highmark BCBS WV Super Blue Plus","group":"BCBS","cls":"professional","ver":"v8","codes":3776,"npi":8216,"tax":255,"msa":1,"recs":336951},{"plan":"BCBS NC Classic Blue","group":"BCBS","cls":"institutional","ver":"v8","codes":5055,"npi":198,"tax":15,"msa":1,"recs":186714},{"plan":"Wellmark BCBS IA Alliance Select","group":"BCBS","cls":"professional","ver":"v8","codes":8127,"npi":22828,"tax":309,"msa":1,"recs":353868162},{"plan":"BCBS OK Blue Choice PPO","group":"BCBS","cls":"professional","ver":"v8","codes":7011,"npi":28956,"tax":394,"msa":1,"recs":62762027},{"plan":"Anthem BCBS CT Century Preferred","group":"BCBS","cls":"professional","ver":"v8","codes":8383,"npi":37771,"tax":414,"msa":1,"recs":611730096},{"plan":"BCBS TX Blue High Performance","group":"BCBS","cls":"institutional","ver":"v9","codes":7880,"npi":101247,"tax":468,"msa":1,"recs":14296989},{"plan":"BCBS KS Blue Choice","group":"BCBS","cls":"professional","ver":"v8","codes":8140,"npi":22587,"tax":353,"msa":1,"recs":9764813984},{"plan":"BCBS AL Preferred Care","group":"BCBS","cls":"professional","ver":"v8","codes":7710,"npi":25923,"tax":321,"msa":1,"recs":1430447819},{"plan":"BCBS TX MyBlue Health HMO","group":"BCBS","cls":"institutional","ver":"v8","codes":7884,"npi":98699,"tax":464,"msa":1,"recs":6521200},{"plan":"Anthem BCBS GA Blue Open Access POS","group":"BCBS","cls":"institutional","ver":"v8","codes":9639,"npi":1278,"tax":71,"msa":1,"recs":2125090},{"plan":"BCBS IL Blue Advantage HMO","group":"BCBS","cls":"professional","ver":"v8","codes":7149,"npi":33633,"tax":358,"msa":1,"recs":17227740},{"plan":"BCBS NC Classic Blue","group":"BCBS","cls":"professional","ver":"v8","codes":8261,"npi":90218,"tax":420,"msa":1,"recs":974552994},{"plan":"Independence BC PA Personal Choice","group":"BCBS","cls":"professional","ver":"v8","codes":769,"npi":8620,"tax":317,"msa":1,"recs":728902},{"plan":"BCBS SC Preferred Blue","group":"BCBS","cls":"institutional","ver":"v8","codes":7894,"npi":3785,"tax":210,"msa":1,"recs":1461848},{"plan":"Horizon BCBS NJ Direct Access","group":"BCBS","cls":"institutional","ver":"v8","codes":8239,"npi":5827,"tax":258,"msa":1,"recs":21145620},{"plan":"BCBS OK Blue Choice PPO","group":"BCBS","cls":"institutional","ver":"v8","codes":6405,"npi":16465,"tax":316,"msa":1,"recs":1069416},{"plan":"BCBS LA Preferred Care PPO","group":"BCBS","cls":"institutional","ver":"v8","codes":9691,"npi":967,"tax":43,"msa":1,"recs":1753048},{"plan":"BCBS MS Network Blue","group":"BCBS","cls":"institutional","ver":"v8","codes":9342,"npi":220,"tax":14,"msa":1,"recs":523975},{"plan":"BCBS NC Blue Value Network","group":"BCBS","cls":"professional","ver":"v8","codes":8269,"npi":79668,"tax":409,"msa":1,"recs":1193297292},{"plan":"BCBS NC Classic Blue","group":"BCBS","cls":"institutional","ver":"v9","codes":5055,"npi":230,"tax":19,"msa":1,"recs":315794},{"plan":"BCBS AR True Blue PPO","group":"BCBS","cls":"institutional","ver":"v8","codes":6271,"npi":332,"tax":77,"msa":1,"recs":2012548},{"plan":"Regence BS ID PPO","group":"BCBS","cls":"professional","ver":"v8","codes":8054,"npi":13527,"tax":269,"msa":1,"recs":215475972},{"plan":"BCBS IL Blue Choice Preferred PPO","group":"BCBS","cls":"institutional","ver":"v9","codes":9659,"npi":90194,"tax":525,"msa":1,"recs":4342773},{"plan":"BCBS MA Blue Care Elect","group":"BCBS","cls":"professional","ver":"v8","codes":6015,"npi":68104,"tax":428,"msa":1,"recs":42792454},{"plan":"Anthem BCBS CO BluePreferred PPO","group":"BCBS","cls":"institutional","ver":"v8","codes":9202,"npi":39584,"tax":411,"msa":1,"recs":118207018},{"plan":"Regence BCBS UT ValueCare","group":"BCBS","cls":"institutional","ver":"v8","codes":9560,"npi":193,"tax":30,"msa":1,"recs":201856},{"plan":"BCBS MT PPO Network","group":"BCBS","cls":"professional","ver":"v8","codes":5580,"npi":12292,"tax":316,"msa":1,"recs":18355137},{"plan":"BCBS IL Blue Advantage HMO","group":"BCBS","cls":"professional","ver":"v9","codes":7207,"npi":33755,"tax":355,"msa":1,"recs":31757876},{"plan":"BCBS HI Preferred Provider Program","group":"BCBS","cls":"institutional","ver":"v8","codes":1250,"npi":7652,"tax":292,"msa":1,"recs":226420},{"plan":"BS CA Blue Shield Preferred Network","group":"BCBS","cls":"institutional","ver":"v8","codes":9531,"npi":2520,"tax":59,"msa":1,"recs":3779405},{"plan":"BCBS RI Healthmate Coast to Coast","group":"BCBS","cls":"professional","ver":"v8","codes":8065,"npi":12753,"tax":324,"msa":1,"recs":7593783992},{"plan":"CareFirst BCBS Select Preferred Provider","group":"BCBS","cls":"professional","ver":"v8","codes":8722,"npi":63128,"tax":449,"msa":1,"recs":974004388},{"plan":"Excellus BCBS BluePPO","group":"BCBS","cls":"institutional","ver":"v8","codes":9429,"npi":209,"tax":33,"msa":1,"recs":255693},{"plan":"BC ID Preferred Blue Standard","group":"BCBS","cls":"professional","ver":"v8","codes":9024,"npi":16157,"tax":300,"msa":1,"recs":6895101704},{"plan":"BCBS MT PPO Network","group":"BCBS","cls":"institutional","ver":"v8","codes":5610,"npi":10715,"tax":299,"msa":1,"recs":1713846},{"plan":"Anthem BCBS GA Blue High Performance","group":"BCBS","cls":"professional","ver":"v8","codes":8382,"npi":42664,"tax":435,"msa":1,"recs":892010255},{"plan":"BCBS NC Blue Value Network","group":"BCBS","cls":"professional","ver":"v9","codes":8269,"npi":79735,"tax":411,"msa":1,"recs":2107251459},{"plan":"Regence BCBS UT ValueCare","group":"BCBS","cls":"professional","ver":"v8","codes":8444,"npi":20473,"tax":325,"msa":1,"recs":311528364},{"plan":"BCBS MA Blue Care Elect","group":"BCBS","cls":"institutional","ver":"v8","codes":6346,"npi":461,"tax":29,"msa":1,"recs":401086},{"plan":"BCBS WY Select","group":"BCBS","cls":"professional","ver":"v8","codes":7844,"npi":7773,"tax":320,"msa":1,"recs":333057167},{"plan":"Highmark BS PA Statewide PPO","group":"BCBS","cls":"professional","ver":"v8","codes":5028,"npi":53309,"tax":387,"msa":1,"recs":2584444},{"plan":"BCBS MN Aware","group":"BCBS","cls":"professional","ver":"v8","codes":8242,"npi":75258,"tax":474,"msa":1,"recs":1671038603},{"plan":"Anthem BCBS CO BluePreferred PPO","group":"BCBS","cls":"professional","ver":"v8","codes":8383,"npi":49634,"tax":451,"msa":1,"recs":2405835714},{"plan":"BCBS TX Blue Advantage HMO","group":"BCBS","cls":"institutional","ver":"v8","codes":7952,"npi":157545,"tax":532,"msa":1,"recs":25563643},{"plan":"BCBS LA Preferred Care PPO","group":"BCBS","cls":"professional","ver":"v8","codes":8122,"npi":29150,"tax":354,"msa":1,"recs":19810838597},{"plan":"BCBS TX Blue High Performance","group":"BCBS","cls":"professional","ver":"v9","codes":8094,"npi":102721,"tax":469,"msa":1,"recs":580138317},{"plan":"BCBS AZ PPO","group":"BCBS","cls":"institutional","ver":"v8","codes":8927,"npi":932,"tax":72,"msa":1,"recs":7077586},{"plan":"Highmark BCBS of Western NY PPO","group":"BCBS","cls":"professional","ver":"v8","codes":3111,"npi":8787,"tax":256,"msa":1,"recs":195193},{"plan":"Highmark BCBS DE Blue Choice","group":"BCBS","cls":"professional","ver":"v8","codes":3260,"npi":5353,"tax":241,"msa":1,"recs":116992},{"plan":"BCBS NM BlueCard PPO","group":"BCBS","cls":"professional","ver":"v8","codes":6209,"npi":21188,"tax":396,"msa":1,"recs":34061325},{"plan":"Wellmark BCBS SD Blue Select","group":"BCBS","cls":"institutional","ver":"v8","codes":2764,"npi":167,"tax":15,"msa":1,"recs":183120},{"plan":"BCBS VT Vermont Freedom Plan","group":"BCBS","cls":"professional","ver":"v8","codes":4863,"npi":7179,"tax":246,"msa":1,"recs":4468791},{"plan":"BCBS IL Blue Choice Preferred PPO","group":"BCBS","cls":"professional","ver":"v9","codes":7695,"npi":113783,"tax":558,"msa":1,"recs":616512131},{"plan":"BC ID Preferred Blue Standard","group":"BCBS","cls":"institutional","ver":"v8","codes":8649,"npi":236,"tax":27,"msa":1,"recs":13780504},{"plan":"BCBS IL Blue Advantage HMO","group":"BCBS","cls":"institutional","ver":"v8","codes":9666,"npi":31705,"tax":356,"msa":1,"recs":2173109},{"plan":"Anthem BCBS VA KeyCare PPO","group":"BCBS","cls":"professional","ver":"v8","codes":8348,"npi":67671,"tax":471,"msa":1,"recs":1236666861},{"plan":"BCBS MI Blue Preferred Plan","group":"BCBS","cls":"professional","ver":"v8","codes":7156,"npi":84170,"tax":440,"msa":1,"recs":2029300295},{"plan":"Wellmark BCBS SD Blue Select","group":"BCBS","cls":"professional","ver":"v8","codes":8130,"npi":7817,"tax":219,"msa":1,"recs":136227585},{"plan":"BCBS TX Blue Choice PPO","group":"BCBS","cls":"institutional","ver":"v8","codes":7923,"npi":181491,"tax":544,"msa":1,"recs":28488479},{"plan":"Highmark BCBS of Western NY PPO","group":"BCBS","cls":"institutional","ver":"v8","codes":2461,"npi":133,"tax":17,"msa":1,"recs":15350},{"plan":"BCBS FL Blue Choice PPO","group":"BCBS","cls":"professional","ver":"v8","codes":8118,"npi":5893,"tax":240,"msa":1,"recs":35564629},{"plan":"BCBS NC Blue High Performance","group":"BCBS","cls":"institutional","ver":"v9","codes":6241,"npi":250,"tax":51,"msa":1,"recs":732589},{"plan":"Highmark BS of Northeastern NY PPO","group":"BCBS","cls":"institutional","ver":"v8","codes":2093,"npi":72,"tax":15,"msa":1,"recs":9391},{"plan":"BCBS NC Blue Value Network","group":"BCBS","cls":"institutional","ver":"v8","codes":6117,"npi":295,"tax":25,"msa":1,"recs":300139},{"plan":"BCBS FL Traditional","group":"BCBS","cls":"professional","ver":"v8","codes":8100,"npi":5767,"tax":237,"msa":1,"recs":33760321},{"plan":"BCBS NC Preferred Provider Network","group":"BCBS","cls":"institutional","ver":"v9","codes":6692,"npi":452,"tax":40,"msa":1,"recs":1190748},{"plan":"BCBS TN Blue Network P","group":"BCBS","cls":"institutional","ver":"v8","codes":5990,"npi":954,"tax":50,"msa":1,"recs":97778604},{"plan":"BCBS NC Blue Value Network","group":"BCBS","cls":"institutional","ver":"v9","codes":6151,"npi":394,"tax":37,"msa":1,"recs":714787},{"plan":"BCBS RI Healthmate Coast to Coast","group":"BCBS","cls":"institutional","ver":"v8","codes":2321,"npi":91,"tax":23,"msa":1,"recs":784775},{"plan":"Regence BCBS OR Preferred Provider Plan","group":"BCBS","cls":"professional","ver":"v8","codes":8084,"npi":36583,"tax":385,"msa":1,"recs":569558848},{"plan":"Highmark BS of Northeastern NY PPO","group":"BCBS","cls":"professional","ver":"v8","codes":2711,"npi":5130,"tax":216,"msa":1,"recs":81789},{"plan":"Premera BC Heritage","group":"BCBS","cls":"professional","ver":"v8","codes":8507,"npi":65733,"tax":488,"msa":1,"recs":37394766604},{"plan":"Capital BC PA PPO","group":"BCBS","cls":"institutional","ver":"v8","codes":9625,"npi":197,"tax":24,"msa":1,"recs":1761360},{"plan":"Anthem BCBS Central Blue Access","group":"BCBS","cls":"professional","ver":"v8","codes":8383,"npi":300862,"tax":619,"msa":1,"recs":50831415702},{"plan":"BCBS NC Blue High Performance","group":"BCBS","cls":"professional","ver":"v9","codes":8232,"npi":58256,"tax":395,"msa":1,"recs":3834697969},{"plan":"Anthem BCBS NY Empire PPO","group":"BCBS","cls":"professional","ver":"v8","codes":8375,"npi":127517,"tax":542,"msa":1,"recs":3361624070},{"plan":"BCBS ND Preferred Blue PPO","group":"BCBS","cls":"professional","ver":"v8","codes":8278,"npi":11137,"tax":292,"msa":1,"recs":345364582},{"plan":"Excellus BCBS BluePPO","group":"BCBS","cls":"professional","ver":"v8","codes":8173,"npi":2760,"tax":168,"msa":1,"recs":24539784},{"plan":"BCBS NC Preferred Provider Network","group":"BCBS","cls":"professional","ver":"v9","codes":8271,"npi":90958,"tax":425,"msa":1,"recs":2473711883},{"plan":"BCBS KC Preferred Care","group":"BCBS","cls":"institutional","ver":"v8","codes":7368,"npi":289,"tax":18,"msa":1,"recs":727914},{"plan":"Anthem BCBS ME Blue Choice","group":"BCBS","cls":"professional","ver":"v8","codes":8388,"npi":18297,"tax":355,"msa":1,"recs":198632022},{"plan":"BCBS TX Blue Advantage HMO","group":"BCBS","cls":"professional","ver":"v9","codes":8098,"npi":161909,"tax":536,"msa":1,"recs":1327767986},{"plan":"Highmark BS PA Statewide PPO","group":"BCBS","cls":"institutional","ver":"v8","codes":5304,"npi":979,"tax":52,"msa":1,"recs":130822},{"plan":"BCBS TX Blue Advantage HMO","group":"BCBS","cls":"institutional","ver":"v9","codes":7958,"npi":160840,"tax":537,"msa":1,"recs":48750907},{"plan":"BCBS TX Blue Advantage HMO","group":"BCBS","cls":"professional","ver":"v8","codes":8094,"npi":158748,"tax":531,"msa":1,"recs":766670222},{"plan":"BS CA Blue Shield Preferred Network","group":"BCBS","cls":"professional","ver":"v8","codes":8321,"npi":123053,"tax":502,"msa":1,"recs":3843093829},{"plan":"Capital BC PA Blue High Performance","group":"BCBS","cls":"professional","ver":"v9","codes":68,"npi":2,"tax":1,"msa":2,"recs":136},{"plan":"BCBS MS Blue Performance","group":"BCBS","cls":"institutional","ver":"v9","codes":8793,"npi":9,"tax":5,"msa":3,"recs":18923},{"plan":"Capital BC PA Blue High Performance","group":"BCBS","cls":"institutional","ver":"v9","codes":8726,"npi":8,"tax":2,"msa":3,"recs":81498},{"plan":"BCBS KC Blue High Performance","group":"BCBS","cls":"institutional","ver":"v9","codes":582,"npi":5,"tax":5,"msa":4,"recs":1192},{"plan":"BCBS RI Blue High Performance","group":"BCBS","cls":"institutional","ver":"v9","codes":2292,"npi":169,"tax":28,"msa":5,"recs":76031},{"plan":"Highmark BCBS of Western NY HPN","group":"BCBS","cls":"institutional","ver":"v9","codes":274,"npi":56,"tax":25,"msa":7,"recs":1145},{"plan":"BCBS RI Healthmate Coast to Coast","group":"BCBS","cls":"institutional","ver":"v9","codes":2303,"npi":184,"tax":32,"msa":8,"recs":179804},{"plan":"BCBS KC Preferred Care Blue PPO","group":"BCBS","cls":"institutional","ver":"v9","codes":1495,"npi":12,"tax":7,"msa":10,"recs":5611},{"plan":"BCBS KC Preferred Care","group":"BCBS","cls":"institutional","ver":"v9","codes":41,"npi":12,"tax":7,"msa":10,"recs":202},{"plan":"BCBS SC HPN","group":"BCBS","cls":"professional","ver":"v9","codes":481,"npi":20,"tax":12,"msa":10,"recs":183188},{"plan":"BCBS MA Advantage Blue Performance","group":"BCBS","cls":"institutional","ver":"v9","codes":5855,"npi":421,"tax":27,"msa":11,"recs":569306},{"plan":"Anthem BCBS NH Blue Choice Open Access POS","group":"BCBS","cls":"institutional","ver":"v9","codes":7709,"npi":243,"tax":36,"msa":11,"recs":536248},{"plan":"BCBS AZ CHS PPO","group":"BCBS","cls":"professional","ver":"v9","codes":8277,"npi":15805,"tax":322,"msa":12,"recs":509139814},{"plan":"BCBS AZ Alliance HPN","group":"BCBS","cls":"institutional","ver":"v9","codes":8874,"npi":413,"tax":53,"msa":12,"recs":6389907},{"plan":"BCBS AZ CHS PPO","group":"BCBS","cls":"institutional","ver":"v9","codes":8895,"npi":1189,"tax":82,"msa":12,"recs":17968908},{"plan":"BCBS WY Select","group":"BCBS","cls":"institutional","ver":"v9","codes":9232,"npi":168,"tax":21,"msa":13,"recs":1791481},{"plan":"Regence BS WA HPN","group":"BCBS","cls":"institutional","ver":"v9","codes":8752,"npi":94,"tax":23,"msa":13,"recs":146197},{"plan":"BCBS MA Blue Care Elect","group":"BCBS","cls":"institutional","ver":"v9","codes":6393,"npi":583,"tax":42,"msa":14,"recs":1318181},{"plan":"Highmark BS of Northeastern NY PPO","group":"BCBS","cls":"institutional","ver":"v9","codes":2111,"npi":299,"tax":51,"msa":14,"recs":70270},{"plan":"Regence BCBS UT ValueCare","group":"BCBS","cls":"institutional","ver":"v9","codes":9512,"npi":285,"tax":36,"msa":15,"recs":465874},{"plan":"Regence BCBS UT HPN","group":"BCBS","cls":"institutional","ver":"v9","codes":9512,"npi":256,"tax":33,"msa":15,"recs":319525},{"plan":"Highmark BCBS DE Blue Choice","group":"BCBS","cls":"institutional","ver":"v9","codes":3467,"npi":198,"tax":49,"msa":16,"recs":94317},{"plan":"BCBS ND Preferred Blue PPO","group":"BCBS","cls":"institutional","ver":"v9","codes":9209,"npi":303,"tax":34,"msa":17,"recs":1309031},{"plan":"Highmark BCBS of Western NY PPO","group":"BCBS","cls":"institutional","ver":"v9","codes":2668,"npi":250,"tax":46,"msa":18,"recs":102337},{"plan":"BCBS VT Vermont Freedom Plan","group":"BCBS","cls":"institutional","ver":"v9","codes":8743,"npi":126,"tax":29,"msa":19,"recs":1108310},{"plan":"BCBS MI Blue High Performance","group":"BCBS","cls":"institutional","ver":"v9","codes":3051,"npi":946,"tax":51,"msa":19,"recs":760774},{"plan":"Wellmark BCBS SD Blue Select","group":"BCBS","cls":"institutional","ver":"v9","codes":1765,"npi":268,"tax":20,"msa":20,"recs":403464},{"plan":"Regence BS Preferred Plan","group":"BCBS","cls":"institutional","ver":"v9","codes":9546,"npi":294,"tax":41,"msa":20,"recs":1067178},{"plan":"BCBS AZ Blue Preferred","group":"BCBS","cls":"institutional","ver":"v9","codes":8895,"npi":1205,"tax":83,"msa":20,"recs":10007297},{"plan":"Regence BlueShield Preferred Plan","group":"BCBS","cls":"institutional","ver":"v9","codes":9546,"npi":269,"tax":41,"msa":21,"recs":351961},{"plan":"BCBS MS Network Blue","group":"BCBS","cls":"institutional","ver":"v9","codes":9275,"npi":258,"tax":18,"msa":22,"recs":1338657},{"plan":"Highmark BCBS WV Super Blue Plus","group":"BCBS","cls":"institutional","ver":"v9","codes":4351,"npi":343,"tax":45,"msa":22,"recs":242308},{"plan":"Regence BS ID PPO","group":"BCBS","cls":"institutional","ver":"v9","codes":9545,"npi":194,"tax":30,"msa":22,"recs":1031566},{"plan":"Regence BCBS OR Oregon HPN","group":"BCBS","cls":"institutional","ver":"v9","codes":8081,"npi":74,"tax":18,"msa":22,"recs":115922},{"plan":"BS CA Blue High Performance","group":"BCBS","cls":"institutional","ver":"v9","codes":8547,"npi":1361,"tax":49,"msa":22,"recs":10841578},{"plan":"BC ID Preferred Blue Standard","group":"BCBS","cls":"institutional","ver":"v9","codes":8634,"npi":307,"tax":28,"msa":23,"recs":730050},{"plan":"Regence BS Preferred Plan","group":"BCBS","cls":"professional","ver":"v9","codes":8047,"npi":43990,"tax":387,"msa":24,"recs":1719587146},{"plan":"BCBS LA Preferred Care PPO","group":"BCBS","cls":"institutional","ver":"v9","codes":9643,"npi":988,"tax":48,"msa":26,"recs":2541076},{"plan":"BCBS LA HPN","group":"BCBS","cls":"institutional","ver":"v9","codes":9643,"npi":984,"tax":49,"msa":26,"recs":2549235},{"plan":"Highmark BCBS of Western NY HPN","group":"BCBS","cls":"professional","ver":"v9","codes":671,"npi":1186,"tax":146,"msa":27,"recs":3588},{"plan":"BCBS AR True Blue PPO","group":"BCBS","cls":"institutional","ver":"v9","codes":6270,"npi":367,"tax":85,"msa":28,"recs":2977145},{"plan":"Capital BC PA PPO","group":"BCBS","cls":"institutional","ver":"v9","codes":9570,"npi":255,"tax":34,"msa":29,"recs":4021542},{"plan":"BCBS FL Traditional","group":"BCBS","cls":"institutional","ver":"v9","codes":8200,"npi":2385,"tax":70,"msa":29,"recs":3597361},{"plan":"BCBS KS Blue Choice","group":"BCBS","cls":"institutional","ver":"v9","codes":8914,"npi":691,"tax":61,"msa":29,"recs":4645679},{"plan":"Wellmark BCBS IA Alliance Select","group":"BCBS","cls":"institutional","ver":"v9","codes":1824,"npi":902,"tax":31,"msa":29,"recs":1428827},{"plan":"BCBS FL Traditional","group":"BCBS","cls":"professional","ver":"v9","codes":8050,"npi":6258,"tax":247,"msa":29,"recs":56780043},{"plan":"BCBS RI Blue High Performance","group":"BCBS","cls":"professional","ver":"v9","codes":8012,"npi":10964,"tax":311,"msa":33,"recs":455760632},{"plan":"Regence BCBS OR Preferred Provider Plan","group":"BCBS","cls":"institutional","ver":"v9","codes":9547,"npi":293,"tax":39,"msa":33,"recs":1739538},{"plan":"BCBS VT Vermont Freedom Plan","group":"BCBS","cls":"professional","ver":"v9","codes":4603,"npi":7266,"tax":243,"msa":34,"recs":5788344},{"plan":"BCBS RI Healthmate Coast to Coast","group":"BCBS","cls":"professional","ver":"v9","codes":8012,"npi":13397,"tax":333,"msa":34,"recs":579991028},{"plan":"BS CA Blue Shield Preferred Network","group":"BCBS","cls":"institutional","ver":"v9","codes":8554,"npi":1644,"tax":63,"msa":34,"recs":258705309},{"plan":"BCBS MA Advantage Blue Performance","group":"BCBS","cls":"professional","ver":"v9","codes":6034,"npi":43782,"tax":391,"msa":35,"recs":49986205},{"plan":"Anthem BCBS NH HPN","group":"BCBS","cls":"institutional","ver":"v9","codes":7620,"npi":3597,"tax":43,"msa":35,"recs":115509},{"plan":"Anthem BCBS CT Blue High Performance","group":"BCBS","cls":"institutional","ver":"v9","codes":7985,"npi":3208,"tax":59,"msa":35,"recs":428429},{"plan":"BCBS NE Network Blue","group":"BCBS","cls":"institutional","ver":"v9","codes":8421,"npi":1800,"tax":134,"msa":35,"recs":13907049},{"plan":"Anthem BCBS NH Preferred Blue","group":"BCBS","cls":"institutional","ver":"v9","codes":7709,"npi":3678,"tax":57,"msa":35,"recs":344765},{"plan":"Anthem BCBS CT Century Preferred","group":"BCBS","cls":"institutional","ver":"v9","codes":8052,"npi":3273,"tax":63,"msa":35,"recs":975557},{"plan":"Anthem BCBS ME Blue Choice","group":"BCBS","cls":"institutional","ver":"v9","codes":7085,"npi":3744,"tax":81,"msa":35,"recs":1019780},{"plan":"BCBS MA Blue Care Elect","group":"BCBS","cls":"professional","ver":"v9","codes":6032,"npi":68360,"tax":421,"msa":35,"recs":87979891},{"plan":"Anthem BCBS NH Blue Choice Open Access POS","group":"BCBS","cls":"professional","ver":"v9","codes":8337,"npi":26366,"tax":398,"msa":35,"recs":1750396781},{"plan":"Anthem BCBS NH HPN","group":"BCBS","cls":"professional","ver":"v9","codes":8334,"npi":24033,"tax":371,"msa":36,"recs":398426046},{"plan":"Anthem BCBS CT Century Preferred","group":"BCBS","cls":"professional","ver":"v9","codes":8316,"npi":43816,"tax":436,"msa":36,"recs":1086215044},{"plan":"Highmark BCBS PA HPN","group":"BCBS","cls":"institutional","ver":"v9","codes":3320,"npi":374,"tax":41,"msa":36,"recs":73544},{"plan":"Anthem BCBS ME Blue Choice","group":"BCBS","cls":"professional","ver":"v9","codes":8360,"npi":22700,"tax":384,"msa":36,"recs":405829581},{"plan":"Anthem BCBS NH Preferred Blue","group":"BCBS","cls":"professional","ver":"v9","codes":8337,"npi":29829,"tax":409,"msa":36,"recs":877554290},{"plan":"Anthem BCBS CT Blue High Performance","group":"BCBS","cls":"professional","ver":"v9","codes":8313,"npi":19699,"tax":318,"msa":36,"recs":374240678},{"plan":"Premera BC WA Blue High Performance State-Wide","group":"BCBS","cls":"institutional","ver":"v9","codes":9744,"npi":1234,"tax":97,"msa":37,"recs":8354325},{"plan":"BCBS TN Blue High Performance","group":"BCBS","cls":"institutional","ver":"v9","codes":6672,"npi":1096,"tax":57,"msa":37,"recs":36397655},{"plan":"BCBS TN Blue Network P","group":"BCBS","cls":"institutional","ver":"v9","codes":6679,"npi":1117,"tax":57,"msa":38,"recs":41792270},{"plan":"Anthem BCBS GA Blue Value HMO ACA","group":"BCBS","cls":"professional","ver":"v9","codes":8330,"npi":32768,"tax":381,"msa":39,"recs":2454396155},{"plan":"Anthem BCBS GA Blue Value HMO ACA","group":"BCBS","cls":"institutional","ver":"v9","codes":7693,"npi":27843,"tax":376,"msa":39,"recs":299179777},{"plan":"BCBS MN Blue High Performance","group":"BCBS","cls":"institutional","ver":"v9","codes":8884,"npi":1270,"tax":68,"msa":40,"recs":7333315},{"plan":"Premera BC Heritage","group":"BCBS","cls":"institutional","ver":"v9","codes":9744,"npi":1410,"tax":105,"msa":42,"recs":17528638},{"plan":"BCBS MN Aware","group":"BCBS","cls":"institutional","ver":"v9","codes":8884,"npi":1553,"tax":75,"msa":42,"recs":9849339},{"plan":"BCBS NC Blue Advantage Options","group":"BCBS","cls":"institutional","ver":"v9","codes":6893,"npi":580,"tax":38,"msa":42,"recs":967265},{"plan":"BCBS MI Blue Preferred Plan","group":"BCBS","cls":"institutional","ver":"v9","codes":3051,"npi":1584,"tax":65,"msa":43,"recs":1303123},{"plan":"Independence BC PA HPN","group":"BCBS","cls":"institutional","ver":"v9","codes":375,"npi":1923,"tax":188,"msa":49,"recs":94725},{"plan":"BCBS FL NetworkBlue","group":"BCBS","cls":"institutional","ver":"v9","codes":8208,"npi":2436,"tax":71,"msa":51,"recs":8173024},{"plan":"BCBS FL Blue Choice PPO","group":"BCBS","cls":"institutional","ver":"v9","codes":8209,"npi":2436,"tax":70,"msa":51,"recs":3944132},{"plan":"Horizon BCBS NJ HPN","group":"BCBS","cls":"institutional","ver":"v9","codes":8376,"npi":5563,"tax":244,"msa":52,"recs":37385975},{"plan":"Horizon BCBS NJ Direct Access","group":"BCBS","cls":"institutional","ver":"v9","codes":8375,"npi":5788,"tax":254,"msa":53,"recs":22344770},{"plan":"Highmark BS of Northeastern NY PPO","group":"BCBS","cls":"professional","ver":"v9","codes":2642,"npi":5308,"tax":222,"msa":53,"recs":110705},{"plan":"Highmark BS PA Statewide PPO","group":"BCBS","cls":"institutional","ver":"v9","codes":5517,"npi":2353,"tax":147,"msa":56,"recs":1033690},{"plan":"BCBS MS Blue Performance","group":"BCBS","cls":"professional","ver":"v9","codes":7929,"npi":1801,"tax":137,"msa":56,"recs":25352151},{"plan":"BCBS AZ Alliance HPN","group":"BCBS","cls":"professional","ver":"v9","codes":8281,"npi":7867,"tax":224,"msa":60,"recs":280784053},{"plan":"Highmark BCBS DE Blue Choice","group":"BCBS","cls":"professional","ver":"v9","codes":3369,"npi":5868,"tax":251,"msa":61,"recs":113114},{"plan":"Highmark BCBS WV Super Blue Plus","group":"BCBS","cls":"professional","ver":"v9","codes":3818,"npi":8634,"tax":261,"msa":62,"recs":202653},{"plan":"Independence BC PA Personal Choice","group":"BCBS","cls":"institutional","ver":"v9","codes":446,"npi":5080,"tax":289,"msa":66,"recs":894805},{"plan":"BCBS KC Blue High Performance","group":"BCBS","cls":"professional","ver":"v9","codes":8323,"npi":6574,"tax":212,"msa":67,"recs":67934863},{"plan":"Highmark BCBS of Western NY PPO","group":"BCBS","cls":"professional","ver":"v9","codes":3120,"npi":8494,"tax":273,"msa":69,"recs":136732},{"plan":"Independence BC PA HPN","group":"BCBS","cls":"professional","ver":"v9","codes":294,"npi":9329,"tax":332,"msa":69,"recs":346774},{"plan":"Independence BC PA Personal Choice","group":"BCBS","cls":"professional","ver":"v9","codes":352,"npi":10912,"tax":363,"msa":75,"recs":1893221},{"plan":"BCBS HI Preferred Provider Program","group":"BCBS","cls":"professional","ver":"v9","codes":8443,"npi":9374,"tax":341,"msa":75,"recs":568521890},{"plan":"BCBS AL Blue High Performance","group":"BCBS","cls":"institutional","ver":"v9","codes":8281,"npi":9251,"tax":214,"msa":78,"recs":217857},{"plan":"BCBS MT PPO Network","group":"BCBS","cls":"institutional","ver":"v9","codes":5606,"npi":12083,"tax":327,"msa":84,"recs":2865441},{"plan":"Regence BS WA HPN","group":"BCBS","cls":"professional","ver":"v9","codes":8043,"npi":24419,"tax":335,"msa":84,"recs":593440034},{"plan":"BCBS MT PPO Network","group":"BCBS","cls":"professional","ver":"v9","codes":5758,"npi":13486,"tax":338,"msa":85,"recs":27959811},{"plan":"Premera BC WA Blue High Performance State-Wide","group":"BCBS","cls":"professional","ver":"v9","codes":8505,"npi":57037,"tax":486,"msa":86,"recs":908778443},{"plan":"BS CA Blue Shield Preferred Network","group":"BCBS","cls":"professional","ver":"v9","codes":7791,"npi":109357,"tax":497,"msa":86,"recs":123900449198},{"plan":"BS CA Blue High Performance","group":"BCBS","cls":"professional","ver":"v9","codes":7791,"npi":70823,"tax":469,"msa":86,"recs":4384699812},{"plan":"Regence BCBS OR Oregon HPN","group":"BCBS","cls":"professional","ver":"v9","codes":8018,"npi":11265,"tax":253,"msa":86,"recs":294484190},{"plan":"Premera BC Heritage","group":"BCBS","cls":"professional","ver":"v9","codes":8507,"npi":69723,"tax":501,"msa":87,"recs":1722356177},{"plan":"BCBS AZ Blue Preferred","group":"BCBS","cls":"professional","ver":"v9","codes":8280,"npi":16353,"tax":326,"msa":87,"recs":315811194},{"plan":"Regence BlueShield Preferred Plan","group":"BCBS","cls":"professional","ver":"v9","codes":8050,"npi":43992,"tax":386,"msa":87,"recs":1117034254},{"plan":"BCBS MS Network Blue","group":"BCBS","cls":"professional","ver":"v9","codes":7946,"npi":13952,"tax":278,"msa":87,"recs":195009060},{"plan":"Anthem BC CA BlueCross PPO","group":"BCBS","cls":"institutional","ver":"v9","codes":9068,"npi":16566,"tax":147,"msa":88,"recs":32119462},{"plan":"CareFirst BCBS DC HPN","group":"BCBS","cls":"professional","ver":"v9","codes":8657,"npi":36735,"tax":391,"msa":88,"recs":698460863},{"plan":"Anthem Blue Cross CA Blue High Performance","group":"BCBS","cls":"institutional","ver":"v9","codes":5815,"npi":14969,"tax":74,"msa":88,"recs":890472},{"plan":"Anthem Blue Cross CA Blue High Performance","group":"BCBS","cls":"professional","ver":"v9","codes":8220,"npi":177937,"tax":584,"msa":89,"recs":4561704060},{"plan":"BCBS NM BlueCard PPO","group":"BCBS","cls":"institutional","ver":"v9","codes":5793,"npi":7800,"tax":293,"msa":89,"recs":2483102},{"plan":"Regence BCBS UT HPN","group":"BCBS","cls":"professional","ver":"v9","codes":8396,"npi":16628,"tax":300,"msa":89,"recs":659366942},{"plan":"Regence BCBS OR Preferred Provider Plan","group":"BCBS","cls":"professional","ver":"v9","codes":8040,"npi":38942,"tax":394,"msa":89,"recs":1546566402},{"plan":"Anthem BC CA BlueCross PPO","group":"BCBS","cls":"professional","ver":"v9","codes":8293,"npi":212443,"tax":604,"msa":89,"recs":8713400010},{"plan":"BCBS AR True Blue PPO","group":"BCBS","cls":"professional","ver":"v9","codes":7794,"npi":3310,"tax":196,"msa":89,"recs":100292220},{"plan":"BCBS KC Preferred Care Blue PPO","group":"BCBS","cls":"professional","ver":"v9","codes":8323,"npi":17378,"tax":290,"msa":91,"recs":380194664},{"plan":"CareFirst BCBS DC BlueChoice Alternate Network","group":"BCBS","cls":"professional","ver":"v9","codes":8312,"npi":60592,"tax":440,"msa":91,"recs":2068662318},{"plan":"Horizon BCBS NJ HPN","group":"BCBS","cls":"professional","ver":"v9","codes":8479,"npi":90416,"tax":499,"msa":91,"recs":11292288933},{"plan":"Highmark BS PA Statewide PPO","group":"BCBS","cls":"professional","ver":"v9","codes":5076,"npi":55762,"tax":407,"msa":91,"recs":1349000},{"plan":"CareFirst BCBS BlueChoice Alternate Network","group":"BCBS","cls":"professional","ver":"v9","codes":8312,"npi":60592,"tax":440,"msa":91,"recs":4137947778},{"plan":"Regence BS ID PPO","group":"BCBS","cls":"professional","ver":"v9","codes":8049,"npi":14283,"tax":271,"msa":91,"recs":588030661},{"plan":"BCBS KC Preferred Care","group":"BCBS","cls":"professional","ver":"v9","codes":8323,"npi":17361,"tax":290,"msa":91,"recs":382073325},{"plan":"BCBS SC Preferred Blue","group":"BCBS","cls":"institutional","ver":"v9","codes":7901,"npi":4671,"tax":256,"msa":92,"recs":4428229},{"plan":"Regence BCBS UT ValueCare","group":"BCBS","cls":"professional","ver":"v9","codes":8396,"npi":21314,"tax":325,"msa":92,"recs":833511568},{"plan":"Horizon BCBS NJ Direct Access","group":"BCBS","cls":"professional","ver":"v9","codes":8480,"npi":93758,"tax":503,"msa":92,"recs":6597905975},{"plan":"Capital BC PA PPO","group":"BCBS","cls":"professional","ver":"v9","codes":8183,"npi":26292,"tax":330,"msa":92,"recs":446347704},{"plan":"Anthem BCBS VA Blue High Performance","group":"BCBS","cls":"institutional","ver":"v9","codes":7658,"npi":11202,"tax":58,"msa":94,"recs":845462},{"plan":"BCBS AL Preferred Care","group":"BCBS","cls":"institutional","ver":"v9","codes":8281,"npi":26033,"tax":319,"msa":94,"recs":1301295},{"plan":"Anthem BCBS VA KeyCare PPO","group":"BCBS","cls":"institutional","ver":"v9","codes":7893,"npi":11694,"tax":82,"msa":94,"recs":1599549},{"plan":"Empire BCBS NY Blue High Performance","group":"BCBS","cls":"institutional","ver":"v9","codes":8882,"npi":11554,"tax":91,"msa":94,"recs":2999063},{"plan":"Anthem BCBS VA Blue High Performance","group":"BCBS","cls":"professional","ver":"v9","codes":8286,"npi":33705,"tax":375,"msa":94,"recs":671114568},{"plan":"CareFirst BCBS Select Preferred Provider","group":"BCBS","cls":"professional","ver":"v9","codes":8310,"npi":77663,"tax":463,"msa":94,"recs":3969717352},{"plan":"Anthem BCBS NY Empire PPO","group":"BCBS","cls":"professional","ver":"v9","codes":8339,"npi":146361,"tax":563,"msa":95,"recs":5592461158},{"plan":"Anthem BCBS VA KeyCare PPO","group":"BCBS","cls":"professional","ver":"v9","codes":8347,"npi":84183,"tax":488,"msa":95,"recs":2577914964},{"plan":"Anthem BCBS NY Empire PPO","group":"BCBS","cls":"institutional","ver":"v9","codes":8913,"npi":12018,"tax":104,"msa":95,"recs":5021575},{"plan":"Empire BCBS NY Blue High Performance","group":"BCBS","cls":"professional","ver":"v9","codes":8339,"npi":82123,"tax":490,"msa":95,"recs":2330271164},{"plan":"BCBS WY Select","group":"BCBS","cls":"professional","ver":"v9","codes":7799,"npi":8151,"tax":338,"msa":95,"recs":432274381},{"plan":"BC ID Preferred Blue Standard","group":"BCBS","cls":"professional","ver":"v9","codes":8998,"npi":17093,"tax":312,"msa":95,"recs":278860364},{"plan":"BCBS FL Blue Choice PPO","group":"BCBS","cls":"professional","ver":"v9","codes":8050,"npi":6411,"tax":250,"msa":96,"recs":60678895},{"plan":"BCBS FL NetworkBlue","group":"BCBS","cls":"professional","ver":"v9","codes":8059,"npi":6426,"tax":249,"msa":96,"recs":120063228},{"plan":"BCBS NM BlueCard PPO","group":"BCBS","cls":"professional","ver":"v9","codes":6200,"npi":22897,"tax":413,"msa":97,"recs":50194186},{"plan":"BCBS ND Preferred Blue PPO","group":"BCBS","cls":"professional","ver":"v9","codes":8105,"npi":11763,"tax":307,"msa":98,"recs":601675865},{"plan":"BCBS AL Preferred Care","group":"BCBS","cls":"professional","ver":"v9","codes":7668,"npi":26676,"tax":317,"msa":99,"recs":757821459},{"plan":"BCBS AL Blue High Performance","group":"BCBS","cls":"professional","ver":"v9","codes":7667,"npi":26635,"tax":317,"msa":99,"recs":767583556},{"plan":"Wellmark BCBS SD Blue Select","group":"BCBS","cls":"professional","ver":"v9","codes":8087,"npi":8166,"tax":227,"msa":100,"recs":223840911},{"plan":"BCBS SC Preferred Blue","group":"BCBS","cls":"professional","ver":"v9","codes":499,"npi":7385,"tax":298,"msa":101,"recs":12475088},{"plan":"Anthem BCBS NV BluePreferred","group":"BCBS","cls":"professional","ver":"v9","codes":7957,"npi":25157,"tax":379,"msa":101,"recs":585203926},{"plan":"Anthem BCBS NV BluePreferred","group":"BCBS","cls":"institutional","ver":"v9","codes":7841,"npi":24977,"tax":378,"msa":101,"recs":80565548},{"plan":"Anthem BCBS CO Blue High Performance","group":"BCBS","cls":"professional","ver":"v9","codes":8340,"npi":34007,"tax":372,"msa":102,"recs":589486878},{"plan":"Anthem BCBS CO BluePreferred PPO","group":"BCBS","cls":"institutional","ver":"v9","codes":9169,"npi":49176,"tax":434,"msa":102,"recs":215088925},{"plan":"Anthem BCBS CO Blue High Performance","group":"BCBS","cls":"institutional","ver":"v9","codes":7857,"npi":23119,"tax":310,"msa":102,"recs":24994710},{"plan":"Anthem BCBS CO BluePreferred PPO","group":"BCBS","cls":"professional","ver":"v9","codes":8340,"npi":60106,"tax":469,"msa":102,"recs":4130523159},{"plan":"Anthem BCBS NV HPN","group":"BCBS","cls":"professional","ver":"v9","codes":7943,"npi":13402,"tax":143,"msa":102,"recs":21473397},{"plan":"Anthem BCBS NV HPN","group":"BCBS","cls":"institutional","ver":"v9","codes":7840,"npi":10737,"tax":88,"msa":102,"recs":15599128},{"plan":"BCBS NE Network Blue","group":"BCBS","cls":"professional","ver":"v9","codes":7880,"npi":15999,"tax":303,"msa":106,"recs":1589024058},{"plan":"Cigna Open Access Plus","group":"Cigna","cls":"professional","ver":"v8","codes":7777,"npi":1006869,"tax":647,"msa":1,"recs":75975645387},{"plan":"Cigna Open Access Plus","group":"Cigna","cls":"professional","ver":"v9","codes":7777,"npi":1148543,"tax":667,"msa":971,"recs":107313017832},{"plan":"HealthPartners","group":"Network Plans","cls":"professional","ver":"v8","codes":7777,"npi":17085,"tax":353,"msa":1,"recs":2071004248},{"plan":"Priority Health","group":"Network Plans","cls":"professional","ver":"v8","codes":7777,"npi":21497,"tax":342,"msa":1,"recs":9175472854},{"plan":"HealthPartners","group":"Network Plans","cls":"professional","ver":"v9","codes":7777,"npi":17256,"tax":360,"msa":21,"recs":24682657180},{"plan":"Priority Health","group":"Network Plans","cls":"professional","ver":"v9","codes":7777,"npi":22345,"tax":349,"msa":47,"recs":297118806338},{"plan":"UHC Choice Plus","group":"UHC","cls":"professional","ver":"v8","codes":7777,"npi":1206895,"tax":724,"msa":1,"recs":284445600239},{"plan":"UHC Choice Plus","group":"UHC","cls":"professional","ver":"v9","codes":7777,"npi":1357982,"tax":744,"msa":971,"recs":638561954898}];

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtB(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9)  return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6)  return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3)  return (n / 1e3).toFixed(0) + 'K';
  return String(n);
}
function fmtNum(n: number): string {
  return n.toLocaleString('en-US');
}
function pct(a: number, b: number): string {
  return ((b - a) / a * 100).toFixed(1) + '%';
}

const V8_COLOR = '#6e7790';
const V9_COLOR = '#4e8f33';

// ── Stat strip ───────────────────────────────────────────────────────────────
function StatStrip() {
  const totalV8 = GROUP_DATA.reduce((s, g) => s + g.v8, 0);
  const totalV9 = GROUP_DATA.reduce((s, g) => s + g.v9, 0);
  const delta   = totalV9 - totalV8;
  const stats = [
    { k: 'Total v8 rows',     v: fmtB(totalV8), sub: 'ingested record rows' },
    { k: 'Total v9 rows',     v: fmtB(totalV9), sub: 'ingested record rows', pos: true },
    { k: 'Row delta v8→v9',   v: '+' + fmtB(delta), sub: `+${((delta/totalV8)*100).toFixed(1)}% growth`, pos: true },
    { k: 'Admin groups',      v: '5',            sub: 'Aetna · BCBS · Cigna · Net Plans · UHC' },
    { k: 'Carrier plans',     v: String(new Set(PLAN_DATA.map(p => p.plan)).size), sub: 'distinct plans across groups' },
  ];
  return (
    <div className="grid border-b border-[#e5e3de]" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: '1px', background: '#e5e3de' }}>
      {stats.map(s => (
        <div key={s.k} className="bg-white px-5 py-3.5">
          <div className="text-[11px] uppercase tracking-[0.4px] text-[#888]">{s.k}</div>
          <div className={`mt-1 text-[22px] font-semibold leading-tight ${s.pos ? 'text-[#2d6a2d]' : 'text-[#1a1a1a]'}`}>{s.v}</div>
          <div className="mt-0.5 text-[11px] text-[#999]">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── Bar chart (volume view) ──────────────────────────────────────────────────
function BarChart() {
  const maxVal = Math.max(...GROUP_DATA.flatMap(g => [g.v8, g.v9]));
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bars = barsRef.current?.querySelectorAll<HTMLDivElement>('[data-pct]');
    bars?.forEach(b => {
      setTimeout(() => { b.style.width = b.dataset.pct + '%'; }, 60);
    });
  }, []);

  return (
    <div className="px-7 py-5">
      <div className="rounded-[10px] border border-[#e5e3de] bg-white p-5">
        <div className="mb-1 text-[13px] font-semibold text-[#1a1a1a]">Ingested record rows by admin_group</div>
        <div className="mb-4 text-[11px] text-[#999]">Lv2_1 stage · National v8 vs National v9 · admin_group A → Z</div>
        <div className="mb-4 flex flex-wrap gap-4 text-[11px] text-[#666]">
          <span className="flex items-center gap-1.5"><span className="inline-block h-[11px] w-[11px] rounded-[3px]" style={{ background: V8_COLOR }} />National v8</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-[11px] w-[11px] rounded-[3px]" style={{ background: V9_COLOR }} />National v9</span>
          <span className="text-[#999]">Δ chip = v9 − v8</span>
        </div>
        <div ref={barsRef} className="space-y-0">
          {GROUP_DATA.map(g => {
            const delta = g.v9 - g.v8;
            return (
              <div key={g.group} className="border-t border-[#f0eeea] py-3.5 first:border-t-0">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-[#1a1a1a]">{g.group}</span>
                  {g.reused
                    ? <span className="rounded-[10px] bg-[#f3f2ee] px-2 py-0.5 text-[11px] font-semibold text-[#999]">v9 reuses v8 data</span>
                    : <span className="rounded-[10px] bg-[#eef7e9] px-2 py-0.5 text-[11px] font-semibold text-[#2d6a2d]">+{fmtB(delta)} ({pct(g.v8, g.v9)})</span>
                  }
                </div>
                {/* v8 bar */}
                <div className="mb-1 flex items-center gap-2.5">
                  <span className="w-[26px] flex-shrink-0 text-right text-[10px] font-bold" style={{ color: V8_COLOR }}>v8</span>
                  <div className="relative flex flex-1 items-center rounded-[4px] bg-[#f3f2ee]" style={{ height: 24 }}>
                    <div
                      data-pct={((g.v8 / maxVal) * 100).toFixed(1)}
                      className="h-full rounded-[4px] transition-[width] duration-700"
                      style={{ background: V8_COLOR, width: 0 }}
                    >
                      {(g.v8 / maxVal) > 0.15 && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-white">{fmtB(g.v8)}</span>
                      )}
                    </div>
                    {(g.v8 / maxVal) <= 0.15 && (
                      <span className="absolute left-[calc(100%+6px)] text-[11px] font-semibold text-[#555]" style={{ left: `calc(${(g.v8/maxVal)*100}% + 6px)` }}>{fmtB(g.v8)}</span>
                    )}
                  </div>
                </div>
                {/* v9 bar */}
                <div className="flex items-center gap-2.5">
                  <span className="w-[26px] flex-shrink-0 text-right text-[10px] font-bold" style={{ color: V9_COLOR }}>v9</span>
                  <div className="relative flex flex-1 items-center rounded-[4px] bg-[#f3f2ee]" style={{ height: 24 }}>
                    <div
                      data-pct={((g.v9 / maxVal) * 100).toFixed(1)}
                      className="h-full rounded-[4px] transition-[width] duration-700"
                      style={{ background: V9_COLOR, width: 0 }}
                    >
                      {(g.v9 / maxVal) > 0.15 && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-white">{fmtB(g.v9)}</span>
                      )}
                    </div>
                    {(g.v9 / maxVal) <= 0.15 && (
                      <span className="absolute text-[11px] font-semibold text-[#555]" style={{ left: `calc(${(g.v9/maxVal)*100}% + 6px)` }}>{fmtB(g.v9)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Plan descriptives view ───────────────────────────────────────────────────
type PlanSortKey = keyof Pick<PlanRow, 'plan' | 'group' | 'cls' | 'ver' | 'codes' | 'npi' | 'tax' | 'msa' | 'recs'>;

function DescriptivesView() {
  const [fVer,    setFVer]    = useState('');
  const [fGroup,  setFGroup]  = useState('');
  const [fClass,  setFClass]  = useState('');
  const [fSearch, setFSearch] = useState('');
  const [sortKey, setSortKey] = useState<PlanSortKey>('recs');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');

  const groups  = useMemo(() => [...new Set(PLAN_DATA.map(p => p.group))].sort(), []);
  const classes = useMemo(() => [...new Set(PLAN_DATA.map(p => p.cls))].sort(),  []);

  // Summary rollup for v9
  const summaryByGroup = useMemo(() => {
    const v9 = PLAN_DATA.filter(p => p.ver === 'v9');
    return groups.map(g => {
      const rows = v9.filter(p => p.group === g);
      const plans = new Set(rows.map(r => r.plan)).size;
      const med = (arr: number[]) => { const s = [...arr].sort((a,b)=>a-b); return s[Math.floor(s.length/2)] ?? 0; };
      return {
        group: g,
        plans,
        planClass: rows.length,
        medCodes: med(rows.map(r => r.codes)),
        medNpi:   med(rows.map(r => r.npi)),
        medTax:   med(rows.map(r => r.tax)),
      };
    });
  }, [groups]);

  const filtered = useMemo(() => {
    let rows = PLAN_DATA;
    if (fVer)    rows = rows.filter(r => r.ver === fVer);
    if (fGroup)  rows = rows.filter(r => r.group === fGroup);
    if (fClass)  rows = rows.filter(r => r.cls === fClass);
    if (fSearch) rows = rows.filter(r => r.plan.toLowerCase().includes(fSearch.toLowerCase()));
    return [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(String(bv)) : String(bv).localeCompare(av);
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [fVer, fGroup, fClass, fSearch, sortKey, sortDir]);

  const handleSort = (k: PlanSortKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const Th = ({ k, label, txt }: { k: PlanSortKey; label: string; txt?: boolean }) => (
    <th
      onClick={() => handleSort(k)}
      className={`sticky top-0 cursor-pointer select-none border-b border-[#e5e3de] bg-[#f4f2ee] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3px] text-[#555] hover:bg-[#ebe8e2] ${txt ? 'text-left' : 'text-right'} ${sortKey === k ? 'text-[#1a1a1a]' : ''}`}
    >
      {label} <span className="text-[9px] text-[#bbb]">{sortKey === k ? (sortDir === 'asc' ? '▲' : '▼') : '▾'}</span>
    </th>
  );

  return (
    <div className="space-y-4 px-7 py-5">
      {/* Callout */}
      <div className="max-w-[980px] rounded-[10px] border border-[#f0e2c4] bg-[#fff8ec] px-4 py-3.5 text-[13px] leading-relaxed text-[#5a4a2a]">
        <strong className="text-[#3a2f18]">What changed at ingestion (v8 → v9).</strong> Lv2_1 did not carry <code className="rounded bg-[#f0eeea] px-1 py-0.5 font-mono text-[11px] text-[#555]">msa_id</code> in v8, so <code className="rounded bg-[#f0eeea] px-1 py-0.5 font-mono text-[11px] text-[#555]">n_msa</code> registers as 1 for every v8 plan–class — a placeholder, not a true single-MSA count. v9 ingestion includes <code className="rounded bg-[#f0eeea] px-1 py-0.5 font-mono text-[11px] text-[#555]">msa_id</code> and resolves to real MSA coverage: <span className="font-bold text-[#8a5a00]">median 40 MSAs per plan–class, up to 971</span>. <strong className="text-[#3a2f18]">Aetna is the exception</strong> — its v9 release applies v8 data by decision, so Aetna rows carry v8 values and a zero delta.
      </div>

      {/* Summary rollup */}
      <div className="overflow-hidden rounded-[10px] border border-[#e5e3de] bg-white">
        <div className="border-b border-[#e5e3de] px-4 pt-3.5 pb-0">
          <div className="text-[13px] font-semibold">V9 descriptive roll-up by admin_group</div>
          <div className="mb-3 text-[11px] text-[#999]">Distinct entities ingested · National v9 (Aetna reuses v8)</div>
        </div>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full min-w-[560px] border-collapse text-[12px]">
            <thead>
              <tr className="bg-[#f4f2ee]">
                {['admin_group','Plans','Plan–class rows','Median codes','Median NPI','Median taxonomy'].map((h, i) => (
                  <th key={h} className={`border-b border-[#e5e3de] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3px] text-[#555] ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summaryByGroup.map((r, i) => (
                <tr key={r.group} className={i % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-50'}>
                  <td className="border-b border-[#f3f2ee] px-3 py-2 font-medium text-[#1a1a1a]">{r.group}</td>
                  <td className="border-b border-[#f3f2ee] px-3 py-2 text-right text-[#555]">{r.plans}</td>
                  <td className="border-b border-[#f3f2ee] px-3 py-2 text-right text-[#555]">{fmtNum(r.planClass)}</td>
                  <td className="border-b border-[#f3f2ee] px-3 py-2 text-right text-[#555]">{fmtNum(r.medCodes)}</td>
                  <td className="border-b border-[#f3f2ee] px-3 py-2 text-right text-[#555]">{fmtNum(r.medNpi)}</td>
                  <td className="border-b border-[#f3f2ee] px-3 py-2 text-right text-[#555]">{fmtNum(r.medTax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 rounded-[6px] border border-[#f0e2c4] bg-[#fff8ec] px-3 py-2 text-[11px] leading-relaxed text-[#8a5a00]">
            <strong>Note.</strong> Aetna's median distinct codes (~28,800) runs well above the other groups because Aetna ingestion includes roughly 20,000 local billing codes alongside the standard CPT/HCPCS/MS-DRG sets.
          </div>
        </div>
      </div>

      {/* Carrier-plan detail table */}
      <div className="overflow-hidden rounded-[10px] border border-[#e5e3de] bg-white">
        <div className="border-b border-[#e5e3de] px-4 pt-3.5 pb-0">
          <div className="text-[13px] font-semibold">Carrier-plan descriptive statistics</div>
          <div className="mb-3 text-[11px] text-[#999]">Per carrier plan × billing class × version · click a column to sort</div>
        </div>
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[#eee] bg-white px-4 py-3">
          <label className="text-[12px] text-[#666]">Version:</label>
          <select value={fVer} onChange={e => setFVer(e.target.value)} className="rounded-[5px] border border-[#d5d3ce] bg-[#faf9f7] px-2 py-1 text-[13px] text-[#1a1a1a]">
            <option value="">All</option><option value="v8">v8</option><option value="v9">v9</option>
          </select>
          <label className="text-[12px] text-[#666]">Group:</label>
          <select value={fGroup} onChange={e => setFGroup(e.target.value)} className="rounded-[5px] border border-[#d5d3ce] bg-[#faf9f7] px-2 py-1 text-[13px] text-[#1a1a1a]">
            <option value="">All</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <label className="text-[12px] text-[#666]">Class:</label>
          <select value={fClass} onChange={e => setFClass(e.target.value)} className="rounded-[5px] border border-[#d5d3ce] bg-[#faf9f7] px-2 py-1 text-[13px] text-[#1a1a1a]">
            <option value="">All</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="ml-auto flex items-center gap-2">
            <input type="text" placeholder="Search plan name…" value={fSearch} onChange={e => setFSearch(e.target.value)}
              className="w-[200px] rounded-[5px] border border-[#d5d3ce] bg-[#faf9f7] px-2 py-1 text-[13px] text-[#1a1a1a]" />
            <span className="rounded-[10px] bg-[#efefed] px-2 py-0.5 text-[11px] text-[#888]">{filtered.length} rows</span>
          </div>
        </div>
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr>
                <Th k="plan"  label="Carrier plan"    txt />
                <Th k="group" label="Group"            txt />
                <Th k="cls"   label="Class"            txt />
                <Th k="ver"   label="Ver" />
                <Th k="codes" label="Distinct codes" />
                <Th k="npi"   label="Distinct NPIs" />
                <Th k="tax"   label="Taxonomy codes" />
                <Th k="msa"   label="MSAs" />
                <Th k="recs"  label="Record rows" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={`${r.plan}-${r.ver}-${r.cls}`} className={`border-b border-[#f3f2ee] hover:bg-[#fbfaf7] ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                  <td className="px-3 py-[7px] text-left text-[12.5px]">{r.plan}</td>
                  <td className="px-3 py-[7px] text-left text-[12.5px] text-[#888]">{r.group}</td>
                  <td className="px-3 py-[7px] text-left text-[12.5px] text-[#888]">{r.cls}</td>
                  <td className="px-3 py-[7px] text-right">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${r.ver === 'v9' ? 'bg-[#ecf5e6] text-[#3f7a2c]' : 'bg-[#eceef3] text-[#5b6680]'}`}>{r.ver}</span>
                  </td>
                  <td className="px-3 py-[7px] text-right text-[12.5px] text-[#555]">{fmtNum(r.codes)}</td>
                  <td className="px-3 py-[7px] text-right text-[12.5px] text-[#555]">{fmtNum(r.npi)}</td>
                  <td className="px-3 py-[7px] text-right text-[12.5px] text-[#555]">{fmtNum(r.tax)}</td>
                  <td className="px-3 py-[7px] text-right text-[12.5px] text-[#555]">{r.msa}</td>
                  <td className="px-3 py-[7px] text-right text-[12.5px] font-medium text-[#1a1a1a]">{fmtB(r.recs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note */}
      <p className="max-w-[980px] text-[11px] text-[#aaa]">
        Source: <code className="rounded bg-[#f0eeea] px-1 font-mono text-[11px] text-[#555]">lv2_1_pipeline_ingestion_group.csv</code> (group totals) and <code className="rounded bg-[#f0eeea] px-1 font-mono text-[11px] text-[#555]">lv2_1_pipeline_ingestion_group_plan.csv</code> (169 carrier plans, plan×class×version grain). Counts are raw ingested source rows prior to specialty-taxonomy and place-of-service analyst filters (Lv2_3). Aetna v9 values apply v8 by release decision.
      </p>
    </div>
  );
}

// ── Tab definitions ──────────────────────────────────────────────────────────
const PIPELINE_TABS = [
  { id: 'lv2_1',  label: 'Lv2_1 Data Ingestion',       active: true  },
  { id: 'lv2_3',  label: 'Lv2_3 Analyst Filters',       active: false },
  { id: 'lv2_pp', label: 'Lv2_PP Carrier Processing',   active: false },
  { id: 'pp0',    label: 'PP_0 Hospital Provider',       active: false },
  { id: 'prod',   label: 'PROD National Release',        active: false },
];

// ── Main view ────────────────────────────────────────────────────────────────
export function HospitalMrfPipelineView() {
  const [activeTab,  setActiveTab]  = useState('lv2_1');
  const [subView,    setSubView]    = useState<'volume'|'desc'>('volume');

  return (
    <div className="flex min-h-screen flex-col" style={{ background: '#f8f7f4', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <div className="bg-[#1a1a1a] px-7 py-5 text-[#f8f7f4]">
        <h1 className="text-[18px] font-semibold tracking-[-0.3px]">Starset Administration Pipeline Lineage Reporting</h1>
        <div className="mt-0.5 text-[12px] text-[#aaa]">National Price Transparency Dataset · Lv2_1 Data Ingestion · V8 → V9</div>
        <p className="mt-3 max-w-[880px] text-[12px] leading-[1.55] text-[#b7b4ad]">
          Starset Analytics materializes semantic data layers for Transparency in Coverage negotiated rates — ingesting carrier-payer and hospital-provider machine-readable files into a normalized BigQuery warehouse, then moving them through staged pipeline gates (Lv2 ingestion and analyst filters → post-processing → the{' '}
          <code className="rounded bg-[#2a2a2a] px-1 py-0.5 font-mono text-[11px] text-[#ccc]">PROD</code> national release) for the Starset Pipeline Agents. This report tracks production lineage across those gates by carrier network group (<code className="rounded bg-[#2a2a2a] px-1 py-0.5 font-mono text-[11px] text-[#ccc]">admin_group</code>): Aetna, BCBS, Cigna, Network Plans, and UHC.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto border-t border-[#333] bg-[#1a1a1a]">
        {PIPELINE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => tab.active && setActiveTab(tab.id)}
            className={`flex-shrink-0 border-b-[3px] px-[18px] py-2.5 text-[13px] font-medium transition-colors
              ${!tab.active ? 'cursor-default border-transparent text-[#555]' : activeTab === tab.id ? 'border-white text-white' : 'border-transparent text-[#aaa] hover:text-white'}`}
          >
            {tab.label}
            {!tab.active && <span className="ml-1.5 rounded-[8px] border border-[#3a3a3a] px-[5px] py-[1px] text-[9px] uppercase tracking-[0.5px] text-[#6a6a6a]">soon</span>}
          </button>
        ))}
      </div>

      {/* Sub-nav */}
      <div className="flex items-center gap-2 border-b border-[#e5e3de] bg-[#efedea] px-7 py-2.5">
        <div className="flex overflow-hidden rounded-[8px] border border-[#d5d3ce] bg-white">
          {(['volume', 'desc'] as const).map((v, i) => (
            <button
              key={v}
              onClick={() => setSubView(v)}
              className={`px-3.5 py-1.5 text-[12px] font-medium transition-colors ${i < 1 ? 'border-r border-[#e5e3de]' : ''} ${subView === v ? 'bg-[#1a1a1a] text-white' : 'bg-white text-[#666] hover:bg-gray-50'}`}
            >
              {v === 'volume' ? 'Ingestion volume' : 'Plan descriptives'}
            </button>
          ))}
        </div>
        <span className="ml-1 text-[11px] text-[#999]">
          {subView === 'volume' ? 'Record-row counts by admin_group' : 'Per-plan descriptive statistics'}
        </span>
      </div>

      {/* Content */}
      {activeTab === 'lv2_1' && (
        <>
          {subView === 'volume' && (
            <>
              {/* Panel */}
              <div className="border-b border-[#e5e3de] bg-white px-7 py-4">
                <p className="max-w-[920px] text-[13px] leading-relaxed text-[#1a1a1a]">
                  <strong>What this shows.</strong> Lv2_1 is the payer carrier-plan source data ingestion stage — the raw negotiated-rate record rows materialized from carrier machine-readable files before any analyst filters are applied. This view compares total ingested record rows between <strong>National v8</strong> and <strong>National v9</strong>, grouped by carrier network segment (<code className="rounded bg-[#f0eeea] px-1 py-0.5 font-mono text-[11px] text-[#555]">admin_group</code>) and ordered alphabetically. Bars share a common scale so groups are directly comparable.
                </p>
                <p className="mt-2 max-w-[920px] text-[12px] leading-relaxed text-[#888]">
                  All five admin groups report in both releases. <strong>Aetna's v9 reuses its v8 data by release decision</strong>, so its delta is zero; total ingested rows still grew <strong>+53.8% (+722.7B)</strong> v8 → v9, driven mainly by UHC (~2.2×) and Network Plans (~28×).
                </p>
              </div>
              <StatStrip />
              <BarChart />
            </>
          )}
          {subView === 'desc' && <DescriptivesView />}
        </>
      )}

      {activeTab !== 'lv2_1' && (
        <div className="flex flex-1 items-center justify-center py-20 text-[#888]">
          <div className="text-center">
            <div className="mb-2 text-[15px] font-semibold text-[#555]">Coming soon</div>
            <div className="text-[13px]">This pipeline stage is under development.</div>
          </div>
        </div>
      )}
    </div>
  );
}
