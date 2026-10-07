(function(){
const KEY='ledger-demo-v9';
const now=new Date();
const pad2=n=>String(n).padStart(2,'0');
const mkey=d=>d.getFullYear()+'-'+pad2(d.getMonth()+1);
const thisM=mkey(now);
const prevDate=new Date(now.getFullYear(),now.getMonth()-1,1);
const prevM=mkey(prevDate);
const iso=(y,m,d)=>y+'-'+pad2(m)+'-'+pad2(d);
const todayISO=iso(now.getFullYear(),now.getMonth()+1,now.getDate());
const day=d=>iso(now.getFullYear(),now.getMonth()+1,Math.min(d,now.getDate()));
const pday=d=>iso(prevDate.getFullYear(),prevDate.getMonth()+1,d);
const monthName=(d,opt)=>d.toLocaleDateString('en-US',opt||{month:'long'});
const money=(n,c)=>{n=+n||0;const r=c?Math.round(n*100)/100:Math.round(n);return (r<0?'-':'')+'$'+Math.abs(r).toLocaleString('en-US',{minimumFractionDigits:c?2:0,maximumFractionDigits:c?2:0})};
const fmtD=d=>new Date(d+'T00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const r2=n=>Math.round(n*100)/100;
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let uid=1000; const id=()=>'i'+(uid++)+Math.random().toString(36).slice(2,6);

const DASH_CARDS={start:'Getting started',payday:'Payday transfers',checkin:'Weekly check-in',cardpay:'Credit card statement',networth:'Net worth',overview:'Account totals',plan:'Plan check',spending:'Spending',fixed:'Fixed costs',annual:'Annual budgets',latest:'Latest entries'};
const defaultDash=()=>({order:['start','payday','checkin','cardpay','networth','overview','goal:g3','plan','spending','fixed','debt:a6','annual','latest'],hidden:[]});
function blankPlan(){return {income:0,deposit:null,payDefault:null,framework:'csp',inc:{grossAnnual:0,pretax:0,net:0,extra:0},
  custom:[{name:'Fixed costs',roles:['need'],min:50,max:60},{name:'Investments',roles:['invest'],min:10,max:10},{name:'Savings',roles:['save'],min:5,max:10},{name:'Guilt-free spending',roles:['want'],min:20,max:35}]}}
function blank(){
  return {view:'setup',setupDone:false,tips:true,did:{},payday:[],gsSkip:[],plan:blankPlan(),categories:[],fixed:[],accounts:[],assets:[],tx:[],goals:[],snapshots:[],closed:[],log:[],
    dash:{order:['networth','overview','plan','spending','fixed','annual','latest'],hidden:[]},
    notif:{b80:true,over:true,goals:true,due:true,close:true,daily:false,weekly:true}};
}
function seed(){
  let rs=7;const rnd=()=>(rs=(rs*9301+49297)%233280)/233280;const between=(a,b)=>r2(a+rnd()*(b-a));
  const T=(o)=>Object.assign({id:id()},o);
  const mo=k=>{const d=new Date(now.getFullYear(),now.getMonth()-k,1);return {y:d.getFullYear(),m:d.getMonth()+1,key:mkey(d),d}};
  const tx=[];
  let loan=7200;const loanPay=(date)=>{const p=T({date,vendor:'Car loan payment',amount:250,kind:'fixed',fixedId:'f6',acct:'a1',to:'a6'});const i=r2(loan*6.9/1200);
    tx.push(p,T({date,vendor:'Car loan interest',amount:i,kind:'interest',acct:'a6',link:p.id}));loan=r2(loan+i-250)};
  /* six months of history */
  for(let k=6;k>=1;k--){const {y,m}=mo(k);const D=dd=>iso(y,m,dd);
    [1,15].forEach(pd=>{tx.push(T({date:D(pd),vendor:'Paycheck',amount:1250,kind:'income',acct:'a1'}));tx.push(T({date:D(pd),vendor:'Tithe/offering',amount:125,kind:'fixed',fixedId:'f1',acct:'a1'}))});
    if(k%3===0)tx.push(T({date:D(20),vendor:'Tutoring',amount:between(120,220),kind:'income',acct:'a2'}));
    tx.push(T({date:D(2),vendor:'Phone',amount:65,kind:'fixed',fixedId:'f2',acct:'a1'}));
    tx.push(T({date:D(10),vendor:'Car insurance',amount:120,kind:'fixed',fixedId:'f3',acct:'a1'}));
    tx.push(T({date:D(12),vendor:'Spotify',amount:12,kind:'fixed',fixedId:'f4',acct:'a4'}));
    if(k<=4)tx.push(T({date:D(16),vendor:'Roth IRA contribution',amount:100,kind:'fixed',fixedId:'f5',acct:'a1',to:'a5'}));
    loanPay(D(20));
    [[4,'Publix',95,135,'a1'],[11,'Chipotle',11,16,'a4'],[18,'Publix',85,125,'a1'],[25,'Chick-fil-A',9,14,'a2']].forEach(([dd,v,a,b,ac])=>tx.push(T({date:D(dd),vendor:v,amount:r2(between(a,b)*(k===5?1.25:1)),cat:'food',kind:'expense',acct:ac})));
    [[6,'Shell'],[21,'Shell']].forEach(([dd,v])=>tx.push(T({date:D(dd),vendor:v,amount:between(38,52),cat:'gas',kind:'expense',acct:'a1'})));
    if(k%2===0)tx.push(T({date:D(9),vendor:'Target',amount:between(30,95),cat:'clothes',kind:'expense',acct:'a4'}));
    tx.push(T({date:D(22),vendor:k%2?'Bowling':'AMC',amount:between(18,40),cat:'rec',kind:'expense',acct:'a2'}));
    if(k===3||k===1)tx.push(T({date:D(26),vendor:'AutoZone',amount:between(45,90),cat:'emerg',kind:'expense',acct:'a4'}));
    if(k<=2)tx.push(T({date:D(28),vendor:'Amazon',amount:between(40,70),cat:'xmas',kind:'expense',acct:'a4'}));
    if(k===1){tx.push(T({date:D(5),kind:'gmove',gFrom:'g3',gTo:'g4',acctFrom:'a3',acctTo:'a3',amount:900}));
      tx.push(T({date:D(10),vendor:'Fall 2026, September payment',amount:900,kind:'goalbuy',acct:'a3',goal:'g4'}))}
    tx.push(T({date:D(16),kind:'transfer',from:'a1',to:'a3',goal:'g1',amount:between(100,115)}));
    tx.push(T({date:D(16),kind:'transfer',from:'a1',to:'a3',goal:'g2',amount:between(78,92)}));
    tx.push(T({date:D(16),kind:'transfer',from:'a1',to:'a3',goal:'g3',amount:300}));
    tx.push(T({date:D(17),kind:'transfer',from:'a1',to:'a3',amount:450}));
    tx.push(T({date:D(27),kind:'transfer',from:'a1',to:'a4',amount:between(150,230)}));
    tx.push(T({date:D(27),kind:'transfer',from:'a1',to:'a2',amount:35}));
  }
  /* this month so far */
  [[1,{vendor:'Paycheck',amount:1250,kind:'income',acct:'a1'}],[1,{vendor:'Tithe/offering',amount:125,kind:'fixed',fixedId:'f1',acct:'a1'}],
   [1,{vendor:'Publix',amount:96.40,cat:'food',kind:'expense',acct:'a1'}],[2,{vendor:'Phone',amount:65,kind:'fixed',fixedId:'f2',acct:'a1'}],
   [2,{vendor:'Chipotle',amount:14.25,cat:'food',kind:'expense',acct:'a4'}],[3,{vendor:'Shell',amount:41.80,cat:'gas',kind:'expense',acct:'a1'}],
   [3,{vendor:'Target',amount:89.00,cat:'clothes',kind:'expense',acct:'a4'}],[4,{vendor:'Publix',amount:118.60,cat:'food',kind:'expense',acct:'a1'}],
   [5,{vendor:'AMC',amount:24.00,cat:'rec',kind:'expense',acct:'a2'}],[5,{vendor:'Amazon',amount:62.00,cat:'xmas',kind:'expense',acct:'a4'}]]
   .forEach(([dd,o])=>tx.push(T(Object.assign({date:iso(now.getFullYear(),now.getMonth()+1,Math.min(dd,now.getDate()))},o))));
  /* opening balances on day one, then every balance follows from the entries */
  const opened=iso(mo(6).y,mo(6).m,1);
  const accounts=[
      {id:'a1',name:'Capital One Checking',bank:'Capital One',type:'checking',balance:1100,pay:true,opened},
      {id:'a2',name:'Cash App',bank:'Cash App',type:'cash',balance:120,pay:true,opened},
      {id:'a3',name:'ESFCU Savings',bank:'ESFCU',type:'savings',balance:1500,pay:false,opened},
      {id:'a5',name:'Roth IRA',type:'retirement',balance:800,pay:false,opened},
      {id:'a4',name:'Credit card',type:'debt',balance:420,apr:24.9,min:40,pay:true,opened,card:true,stmt:15,payFull:true,payFrom:'a1'},
      {id:'a6',name:'Car loan',type:'debt',balance:7200,apr:6.9,min:250,pay:false,opened,start:9000,startDate:'2025-06-01',accrue:true}];
  const asOf=m=>{const b={__oth:0};accounts.forEach(a=>{const e=tx.filter(t=>t.date.slice(0,7)<=m).reduce((s,t)=>s+effectOn(t,a.id),0);b[a.id]=r2(a.type==='debt'?a.balance-e:a.balance+e)});return b};
  const snapshots=[],closed=[];
  for(let k=6;k>=2;k--){const {key,d}=mo(k);snapshots.push({m:monthName(d,{month:'short'}),key,full:monthName(d,{month:'long',year:'numeric'}),bal:asOf(key),corr:[]});closed.push(key)}
  const nowBal=asOf('9999-12');accounts.forEach(a=>a.balance=nowBal[a.id]);
  const saved=g=>r2(tx.reduce((s,t)=>s+(t.goal===g&&(t.kind==='transfer'||t.kind==='assign')?t.amount:0)+(t.kind==='gmove'&&t.gTo===g?t.amount:0)-(t.kind==='gmove'&&t.gFrom===g?t.amount:0)-(t.kind==='unassign'&&t.goal===g?t.amount:0),0));
  const sep=mo(1);
  return {
    view:'home',setupDone:true,tips:true,
    plan:{income:2500,deposit:'a1',payDefault:'a1',framework:'csp',
      inc:{grossAnnual:38000,pretax:0,net:2500,extra:0},
      custom:blankPlan().custom},
    categories:[
      {id:'food',role:'want',name:'Food',type:'monthly',budget:300},
      {id:'gas',role:'want',name:'Gas',type:'monthly',budget:150},
      {id:'clothes',role:'want',name:'Clothes/accessories',type:'monthly',budget:75},
      {id:'emerg',role:'want',name:'Emergency',type:'monthly',budget:100},
      {id:'rec',role:'want',name:'Recreation',type:'monthly',budget:100},
      {id:'xmas',role:'want',name:'Christmas gifts',type:'annual',budget:400},
      {id:'tax',role:'need',name:'Taxes',type:'annual',budget:600}
    ],
    fixed:[
      {id:'f1',name:'Tithe/offering',pct:10,acct:'a1',role:'need'},
      {id:'f2',name:'Phone',amount:65,acct:'a1',role:'need',day:2},
      {id:'f3',name:'Car insurance',amount:120,acct:'a1',role:'need',day:10},
      {id:'f4',name:'Spotify',amount:12,acct:'a4',role:'need',day:12},
      {id:'f5',name:'Roth IRA contribution',amount:100,acct:'a1',to:'a5',role:'invest',day:16},
      {id:'f6',name:'Car loan payment',amount:250,acct:'a1',to:'a6',role:'need',day:20}
    ],
    accounts,
    assets:[],
    tx,
    goals:[
      {id:'g3',name:'Grad school (JHU)',target:12000,saved:saved('g3'),date:'2028-05-01',created:'2026-04-01',acct:'a3',done:false},
      {id:'g4',name:'Fall 2026, September payment',parent:'g3',target:900,saved:saved('g4'),date:iso(sep.y,sep.m,10),created:'2026-08-15',acct:'a3',done:true,boughtOn:iso(sep.y,sep.m,10),paid:900},
      {id:'g5',name:'Fall 2026, November payment',parent:'g3',target:900,saved:saved('g5'),date:'2026-11-10',created:'2026-08-15',acct:'a3',done:false},
      {id:'g6',name:'Spring 2027, January payment',parent:'g3',target:1500,saved:saved('g6'),date:'2027-01-10',created:'2026-09-01',acct:'a3',done:false},
      {id:'g1',name:'Camera',target:1500,saved:saved('g1'),date:'2027-06-01',created:'2026-04-01',acct:'a3',done:false},
      {id:'g2',name:'Luggage',target:800,saved:saved('g2'),date:'2027-03-01',created:'2026-04-01',acct:'a3',done:false}
    ],
    snapshots,closed,log:[],dash:defaultDash(),
    notif:{b80:true,over:true,goals:true,due:true,close:true,daily:false,weekly:true}
  };
}
let S;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){S=null}
if(!S||!S.plan||!S.plan.inc||!S.dash)S=seed();
sanitize();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

/* ---------- core model ---------- */
const cat=cid=>S.categories.find(c=>c.id===cid);
const adjOf=(cid,m)=>((S.adj||{})[m]||{})[cid]||0;
function carryOf(c,m){
  if(!c.roll||!c.rollFrom||c.type!=='monthly'||m<=c.rollFrom)return 0;
  const M=memo(),k=c.id+'|'+m;if(k in M.carry)return M.carry[k];
  const d=mDate(m),pm=mkey(new Date(d.getFullYear(),d.getMonth()-1,1));
  return M.carry[k]=r2(Math.max(0,budgetOf(c,pm)-spent(c.id,pm)));
}
const budgetOf=(c,m)=>c.type==='monthly'?r2(c.budget+adjOf(c.id,m||thisM)+carryOf(c,m||thisM)):c.budget;
function sanitize(){if(!S.adj)S.adj={};if(!S.dash)S.dash=defaultDash();['cardpay','checkin','payday','start'].forEach(k=>{if(!S.dash.order.includes(k))S.dash.order.unshift(k)});Object.keys(DASH_CARDS).forEach(k=>{if(!S.dash.order.includes(k))S.dash.order.push(k)});if(!Array.isArray(S.payday))S.payday=[];if(!S.did||typeof S.did!=='object')S.did={};if(!Array.isArray(S.gsSkip))S.gsSkip=[];if(S.notif&&S.notif.weekly===undefined)S.notif.weekly=true;S.categories.forEach(c=>{if(typeof c.budget!=='number'||isNaN(c.budget))c.budget=0});(S.assets||[]).forEach(a=>{if(typeof a.value!=='number'||isNaN(a.value))a.value=0});S.fixed.forEach(f=>{if(f.pct==null&&(typeof f.amount!=='number'||isNaN(f.amount)))f.amount=0})}
const acct=aid=>S.accounts.find(a=>a.id===aid);
const aName=aid=>aid==null||aid===''?'not set':(acct(aid)||(UI.sd&&UI.sd.accounts||[]).find(a=>a.id===aid)||{name:'Deleted account'}).name;
const goal=gid=>S.goals.find(g=>g.id===gid);
const TYPES={checking:'Checking',cash:'Cash',savings:'Savings',retirement:'Retirement',debt:'Debt'};
function move(aid,delta){const a=acct(aid);if(!a)return;a.balance=r2(a.type==='debt'?a.balance-delta:a.balance+delta)}
function applyTx(t,sign){
  MEMO=null;
  if(t.kind==='expense'||t.kind==='fixed'||t.kind==='goalbuy')move(t.acct,-t.amount*sign);
  if(t.kind==='fixed'&&t.to)move(t.to,t.amount*sign);
  else if(t.kind==='income')move(t.acct,t.amount*sign);
  else if(t.kind==='transfer'){move(t.from,-t.amount*sign);move(t.to,t.amount*sign)}
  else if(t.kind==='adjust')move(t.acct,t.dir*t.amount*sign);
  else if(t.kind==='interest')move(t.acct,-t.amount*sign);
  else if(t.kind==='gmove'&&t.acctFrom!==t.acctTo){move(t.acctFrom,-t.amount*sign);move(t.acctTo,t.amount*sign)}
  if(t.goal&&(t.kind==='transfer'||t.kind==='assign')){const g=goal(t.goal);if(g)g.saved=r2(g.saved+t.amount*sign)}
  if(t.kind==='unassign'){const g=goal(t.goal);if(g)g.saved=r2(g.saved-t.amount*sign)}
  if(t.kind==='gmove'){const a=goal(t.gFrom),b=goal(t.gTo);if(a)a.saved=r2(a.saved-t.amount*sign);if(b)b.saved=r2(b.saved+t.amount*sign)}
}
/* never let a regular account drop below $0, or below what its goals have set aside */
function guardTx(add,rem){
  const d={};const acc=(t,sg)=>S.accounts.forEach(a=>{const e=effectOn(t,a.id);if(e)d[a.id]=(d[a.id]||0)+sg*e});
  (add||[]).forEach(t=>acc(t,1));(rem||[]).forEach(t=>acc(t,-1));
  for(const a of S.accounts){const dd=r2(d[a.id]||0);if(a.type==='debt'||dd>=-0.004)continue;
    const nb=r2(a.balance+dd),floor=Math.max(0,r2(assigned(a.id)));
    if(nb<floor-0.004){return nb<-0.004?`${a.name} only has ${money(Math.max(0,a.balance),true)}. This would take it below $0.`:`That would dip into ${money(floor-nb,true)} set aside for goals in ${a.name}. Move goal money back first (Goals → More → Move money).`}}
  return null;
}
const catLeft=(c,m)=>r2(budgetOf(c,m)-spent(c.id,m));
function addTx(t){t.id=id();S.tx.push(t);applyTx(t,1);return t}
const inMonth=(t,m)=>t.date.slice(0,7)===m;
let MEMO=null;
function memo(){
  if(MEMO)return MEMO;
  const m={catM:{},catY:{},inc:{},fix:{},carry:{}};
  for(const t of S.tx){const mo=t.date.slice(0,7),y=t.date.slice(0,4);
    if(t.kind==='expense'){m.catM[mo+'|'+t.cat]=(m.catM[mo+'|'+t.cat]||0)+t.amount;m.catY[y+'|'+t.cat]=(m.catY[y+'|'+t.cat]||0)+t.amount}
    else if(t.kind==='income')m.inc[mo]=(m.inc[mo]||0)+t.amount;
    else if(t.kind==='fixed')m.fix[mo+'|'+t.fixedId]=(m.fix[mo+'|'+t.fixedId]||0)+t.amount}
  return MEMO=m;
}
function spent(cid,scope){
  const c=cat(cid),m=scope||thisM,M=memo();
  return c&&c.type==='annual'?(M.catY[m.slice(0,4)+'|'+cid]||0):(M.catM[m+'|'+cid]||0);
}
function spentSlow(cid,scope){
  const c=cat(cid);const m=scope||thisM;
  return S.tx.filter(t=>t.kind==='expense'&&t.cat===cid&&(c.type==='annual'?t.date.slice(0,4)===m.slice(0,4):inMonth(t,m))).reduce((a,t)=>a+t.amount,0);
}
const incomeIn=m=>memo().inc[m]||0;
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const mIdx=m=>+m.slice(0,4)*12+(+m.slice(5,7)-1);
const perYear=f=>({monthly:12,quarterly:4,yearly:1,months:(f.months||[]).length})[f.freq||'monthly'];
function dueIn(f,m){
  m=m||thisM;if(f.begins&&m<f.begins)return false;if(f.end&&m>f.end)return false;
  const fr=f.freq||'monthly';
  if(fr==='monthly')return true;
  if(fr==='months')return (f.months||[]).includes(+m.slice(5,7));
  const a=f.begins||m,step=fr==='quarterly'?3:12;return ((mIdx(m)-mIdx(a))%step+step)%step===0;
}
function nextDue(f,m){let d=mDate(m||thisM);for(let k=1;k<=24;k++){const x=mkey(new Date(d.getFullYear(),d.getMonth()+k,1));if(dueIn(f,x))return x}return null}
const ended=f=>!!(f.end&&f.end<thisM);
function schedText(f){const fr=f.freq||'monthly';
  const base=fr==='monthly'?'Every month':fr==='quarterly'?`Every 3 months from ${MON[+(f.begins||thisM).slice(5,7)-1]}`:fr==='yearly'?`Every ${MON[+(f.begins||thisM).slice(5,7)-1]}`:`In ${(f.months||[]).slice().sort((a,b)=>a-b).map(n=>MON[n-1]).join(', ')||'no months'}`;
  return base+(f.end?`, until ${monthName(mDate(f.end),{month:'short',year:'numeric'})}`:'')+(f.begins&&f.begins>thisM&&fr==='monthly'?`, starting ${monthName(mDate(f.begins),{month:'short',year:'numeric'})}`:'')}
const fixedDue=(f,m)=>!dueIn(f,m)?0:f.pct?r2(incomeIn(m||thisM)*f.pct/100):f.amount;
const fixedPlan=f=>ended(f)?0:f.pct?S.plan.income*f.pct/100:r2(f.amount*perYear(f)/12);
const fixedPaid=(f,m)=>memo().fix[(m||thisM)+'|'+f.id]||0;
const isSpend=t=>t.kind==='expense'||t.kind==='interest'||(t.kind==='fixed'&&!t.to);
const isPlanned=t=>t.kind==='goalbuy';
const fixedOwe=(f,m)=>{if(!dueIn(f,m))return 0;const paid=fixedPaid(f,m);return f.pct!=null?r2(fixedDue(f,m)-paid):(paid>0?0:f.amount)};
function openMonths(){
  const keys=S.closed.slice().sort(),last=keys[keys.length-1];
  let start;
  if(last){const d=new Date(last+'-01T00:00');start=mkey(new Date(d.getFullYear(),d.getMonth()+1,1))}
  else start=S.tx.reduce((a,t)=>t.date<a?t.date:a,todayISO).slice(0,7);
  const out=[];let d=new Date(start+'-01T00:00');
  while(mkey(d)<thisM){out.push(mkey(d));d=new Date(d.getFullYear(),d.getMonth()+1,1)}
  return out;
}
const closeTarget=()=>openMonths()[0]||null;
const latestClosed=()=>S.closed.slice().sort().pop()||null;
const mDate=m=>new Date(m+'-01T00:00');
const existedBy=(a,m)=>!a.opened||a.opened.slice(0,7)<=m;
const lastDayOf=m=>{const d=mDate(m);return iso(d.getFullYear(),d.getMonth()+1,new Date(d.getFullYear(),d.getMonth()+1,0).getDate())};
function effectOn(t,aid){
  let d=0;
  if((t.kind==='expense'||t.kind==='fixed'||t.kind==='goalbuy')&&t.acct===aid)d-=t.amount;
  if(t.kind==='fixed'&&t.to===aid)d+=t.amount;
  if(t.kind==='income'&&t.acct===aid)d+=t.amount;
  if(t.kind==='transfer'){if(t.from===aid)d-=t.amount;if(t.to===aid)d+=t.amount}
  if(t.kind==='adjust'&&t.acct===aid)d+=t.dir*t.amount;
  if(t.kind==='interest'&&t.acct===aid)d-=t.amount;
  if(t.kind==='gmove'&&t.acctFrom!==t.acctTo){if(t.acctFrom===aid)d-=t.amount;if(t.acctTo===aid)d+=t.amount}
  return d;
}
function balAt(a,m){
  if(a.opened&&m<a.opened.slice(0,7)){m=a.opened.slice(0,7)}
  const after=S.tx.filter(t=>t.date.slice(0,7)>m).reduce((s,t)=>s+effectOn(t,a.id),0);
  return r2(a.type==='debt'?a.balance+after:a.balance-after);
}
function openedBlock(date,ids){
  for(const id of ids){const a=acct(id);if(a&&a.opened&&date<a.opened)return `${a.name} was added on ${fmtD(a.opened)}. Its starting balance already includes anything earlier, so pick that date or later.`}
  return null;
}
const activeGoals=()=>S.goals.filter(g=>!g.done);
const kids=g=>S.goals.filter(x=>x.parent===g.id);
const liveKids=g=>kids(g).filter(x=>!x.done);
const isParent=g=>!g.parent&&kids(g).length>0;
const topGoals=()=>activeGoals().filter(g=>!g.parent);
const family=g=>[g].concat(kids(g));
function famProgress(g){
  const ids=family(g).map(x=>x.id);
  const paidTx=S.tx.filter(t=>t.kind==='goalbuy'&&ids.includes(t.goal));
  const paid=r2(paidTx.reduce((a,t)=>a+t.amount,0));
  const aside=r2((g.done?0:g.saved)+liveKids(g).reduce((a,x)=>a+x.saved,0));
  const covered=r2(paid+aside),remaining=r2(Math.max(0,g.target-covered));
  return {paid,aside,covered,remaining,payments:paidTx.length,pctPaid:g.target?Math.min(100,paid/g.target*100):0,pctCov:g.target?Math.min(100,covered/g.target*100):0};
}
const liveCats=()=>S.categories.filter(c=>!c.archived);
const liveFixed=()=>S.fixed.filter(f=>!f.archived);
const liveAccts=()=>S.accounts.filter(a=>!a.archived);
const payAccts=()=>liveAccts().filter(a=>a.pay);
const firstSavings=()=>(liveAccts().find(a=>a.type==='savings')||liveAccts().find(a=>a.type!=='debt')||{}).id;
const assigned=aid=>activeGoals().filter(g=>g.acct===aid).reduce((s,g)=>s+g.saved,0);
const unassigned=aid=>r2((acct(aid)||{balance:0}).balance-assigned(aid));
const sumType=(types,bal)=>S.accounts.filter(a=>types.includes(a.type)).reduce((s,a)=>s+(bal?(bal[a.id]||0):a.balance),0);
const othNow=()=>(S.assets||[]).filter(x=>!x.archived).reduce((a,x)=>a+(x.value||0),0);
const othOf=snap=>snap?(snap.oth||0):othNow();
const netOf=(bal,snap)=>sumType(['checking','cash','savings','retirement'],bal)-sumType(['debt'],bal)+(bal?(snap?othOf(snap):(bal.__oth||0)):othNow());
function pctClass(p){return p>100?'over':p>=80?'warn':''}

const monthsTo=d=>Math.max(1,(new Date(d+'T00:00')-now)/(1000*60*60*24*30.44));
function goalInfo(g){
  if(isParent(g))return parentInfo(g);
  const t0=new Date(g.created+'T00:00'), t1=new Date(g.date+'T00:00');
  const total=Math.max(1,t1-t0), elapsed=Math.min(total,Math.max(0,now-t0));
  const expected=g.target*elapsed/total;
  const remaining=Math.max(0,g.target-g.saved);
  const monthsLeft=Math.max(1,(t1-now)/(1000*60*60*24*30.44));
  const perMonth=Math.ceil(remaining/monthsLeft);
  let status='on track';
  if(g.saved>=g.target)status='funded';
  else if(g.saved>=expected+g.target*.05)status='ahead';
  else if(g.saved<expected-g.target*.05)status='behind';
  return {perMonth,status,remaining,expected:r2(Math.min(g.target,expected)),diff:r2(g.saved-expected),cur:g.saved};
}
/* a big goal must have money ready before each sub-goal's due date, and the whole total by its own date */
function parentInfo(g){
  const fp=famProgress(g);
  let need=Math.ceil(fp.remaining/monthsTo(g.date)),cum=0,nextShort=null;
  const cover={};
  liveKids(g).slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(k=>{
    cum+=Math.max(0,k.target-k.saved);
    const gap=cum-g.saved;cover[k.id]=gap<=0.004?0:r2(Math.min(gap,k.target-k.saved));
    if(gap>0){need=Math.max(need,Math.ceil(gap/monthsTo(k.date)));if(!nextShort)nextShort={k,gap:r2(gap)}}
  });
  const t0=new Date(g.created+'T00:00'),t1=new Date(g.date+'T00:00');
  const total=Math.max(1,t1-t0),elapsed=Math.min(total,Math.max(0,now-t0)),expected=g.target*elapsed/total;
  let status='on track';
  if(fp.covered>=g.target-0.004)status='funded';
  else if(fp.covered>=expected+g.target*.05)status='ahead';
  else if(fp.covered<expected-g.target*.05)status='behind';
  return {perMonth:need,status,remaining:fp.remaining,fp,nextShort,cover,expected:r2(Math.min(g.target,expected)),diff:r2(fp.covered-expected),cur:fp.covered};
}
/* pay-yourself-first plan: income -> fixed -> goals (by priority) -> guilt-free */
function monthPlan(){
  const income=S.plan.income;
  const fixedTotal=liveFixed().reduce((a,f)=>a+fixedPlan(f),0);
  let avail=income-fixedTotal;
  const goals=topGoals().map(g=>{const need=goalInfo(g).perMonth;const funded=Math.max(0,Math.min(need,avail));avail-=funded;return {g,need,funded}});
  const goalTotal=goals.reduce((a,x)=>a+x.funded,0);
  const guilt=avail;
  const budgets=liveCats().reduce((a,c)=>a+(c.type==='monthly'?c.budget:c.budget/12),0);
  return {income,fixedTotal,goals,goalTotal,guilt,budgets,unplanned:guilt-budgets};
}

/* ---------- plan frameworks ---------- */
const FW={
  csp:{name:'Conscious Spending Plan',desc:'Ramit Sethi\u2019s method: fixed costs, investments, savings, then guilt-free spending.',buckets:[
    {name:'Fixed costs',roles:['need'],min:50,max:60},{name:'Investments',roles:['invest'],min:10,max:10},
    {name:'Savings',roles:['save'],min:5,max:10},{name:'Guilt-free spending',roles:['want'],min:20,max:35}]},
  r503020:{name:'50/30/20',desc:'Half to needs, 30% to wants, 20% to savings and investing.',buckets:[
    {name:'Needs',roles:['need'],min:50,max:50},{name:'Wants',roles:['want'],min:30,max:30},{name:'Savings & investing',roles:['save','invest'],min:20,max:20}]},
  zero:{name:'Zero-based',desc:'No percentage targets. Every dollar of income gets a job until nothing is unplanned.',zero:true,buckets:[
    {name:'Needs',roles:['need']},{name:'Investing',roles:['invest']},{name:'Savings',roles:['save']},{name:'Spending',roles:['want']}]},
  custom:{name:'Custom',desc:'Your own group names and target ranges.',buckets:null}
};
const ROLES=['need','invest','save','want'];
function buckets(fw,custom){fw=fw||S.plan.framework;return fw==='custom'?(custom||S.plan.custom):FW[fw].buckets}
function roleName(role,fw,custom){const b=buckets(fw,custom).find(b=>b.roles.includes(role));return b?b.name:role}
const aheadOk=b=>b.roles.length&&b.roles.every(r=>r==='save'||r==='invest');
function planCheck(){
  const inc=S.plan.income||1, P=monthPlan();
  const amt={need:0,invest:0,save:0,want:0},items={need:[],invest:[],save:[],want:[]};
  const add=(r,n,v,note)=>{amt[r]+=v;if(v>0.004)items[r].push({n,v,note})};
  liveFixed().forEach(f=>add(f.role||'need',f.name,fixedPlan(f),(f.freq&&f.freq!=='monthly')?'spread monthly':''));
  liveCats().forEach(c=>add(c.role||'want',c.name,c.type==='monthly'?c.budget:c.budget/12,c.type==='annual'?'1/12 of yearly':''));
  P.goals.forEach(x=>add('save',x.g.name,x.funded,'goal'));
  add('invest','Pre-tax retirement',(S.plan.inc&&S.plan.inc.pretax)||0,'from paycheck');
  return {P,rows:buckets().map((b,i)=>{const v=b.roles.reduce((s,r)=>s+amt[r],0),pct=v/inc*100;
    const its=b.roles.reduce((a,r)=>a.concat(items[r]),[]).sort((x,y)=>y.v-x.v);
    let st='',lo=null,hi=null;if(b.min!=null){lo=b.min===b.max?b.min-3:b.min;hi=b.min===b.max?b.max+3:b.max;st=pct<lo?'below':pct>hi?(aheadOk(b)?'ahead':'above'):'ok'}
    return {b,i,v,pct,st,lo,hi,its}})};
}

/* ---------- UI helpers ---------- */
let bT,tT;
function notify(title,body){
  const b=document.getElementById('banner');
  document.getElementById('bTitle').textContent=title;document.getElementById('bBody').textContent=body;
  b.classList.add('show');clearTimeout(bT);bT=setTimeout(()=>b.classList.remove('show'),4200);
}
let undoFn=null;
function toast(msg,undo){const t=document.getElementById('toast');undoFn=undo||null;
  t.innerHTML=`<span>${esc(msg)}</span>${undo?'<button id="undoBtn">Undo</button>':''}`;
  t.classList.add('show');clearTimeout(tT);tT=setTimeout(()=>{t.classList.remove('show');undoFn=null},undo?5000:2600)}
document.getElementById('toast').addEventListener('click',e=>{if(e.target.id==='undoBtn'&&undoFn){const f=undoFn;undoFn=null;document.getElementById('toast').classList.remove('show');f()}});
function removeBlock(t){
  const grp=[t].concat(S.tx.filter(x=>x.link===t.id)),d={};
  grp.forEach(x=>{
    if(x.goal&&(x.kind==='transfer'||x.kind==='assign'))d[x.goal]=(d[x.goal]||0)-x.amount;
    if(x.kind==='unassign')d[x.goal]=(d[x.goal]||0)+x.amount;
    if(x.kind==='gmove'){d[x.gFrom]=(d[x.gFrom]||0)+x.amount;d[x.gTo]=(d[x.gTo]||0)-x.amount}});
  for(const [gid,dv] of Object.entries(d)){const g=goal(gid);if(!g)continue;
    if(g.done)return `This is part of ${g.name}, which is finished, so it can’t be removed.`;
    if(g.saved+dv<-0.004)return `${g.name} has already used this money, so removing this would leave it below zero. Move money back into it first.`}
  if(t.kind==='goalbuy')return 'This belongs to a completed goal and can’t be deleted.';
  const ad={};grp.forEach(x=>S.accounts.forEach(a=>{const e=effectOn(x,a.id);if(e)ad[a.id]=(ad[a.id]||0)-e}));
  for(const [aid,e] of Object.entries(ad)){const a=acct(aid);if(a&&a.type==='debt'&&a.balance-e<-0.004)return `Removing this would leave ${a.name} below zero, as if you overpaid it. Fix the payment first, or record a correction.`}
  return null;
}
function removeTx(t){const grp=[t].concat(S.tx.filter(x=>x.link===t.id));grp.slice().reverse().forEach(x=>applyTx(x,-1));S.tx=S.tx.filter(x=>!grp.includes(x));MEMO=null;t._grp=grp;return grp}
function restoreTx(t){(t._grp||[t]).forEach(x=>{if(!S.tx.includes(x)){S.tx.push(x);applyTx(x,1)}});delete t._grp}
const UI={editAccts:false,editGoal:null,addTo:null,sec:null,draft:null};
function resetUI(){UI.menu=false;UI.editAccts=false;UI.editGoal=null;UI.addTo=null;UI.moveFrom=null;UI.addSub=null;UI.more=null;UI.sec=null;UI.draft=null;UI.sd=null;UI.help=null;UI.txOpen=null;if(typeof hideTip==='function')hideTip()}
const LOGK={settings:'Settings',goals:'Goals',budget:'Budget moves',entries:'Entries',payday:'Routine',months:'Months'};
function logKind(t){t=String(t);if(/paycheck|check-in/i.test(t))return 'payday';if(/^(Edited|Deleted|Restored) /.test(t))return 'entries';if(/^Moved .* (into|to) .* for /.test(t))return 'budget';if(/close|closed|reopen|month/i.test(t)&&!/goal/i.test(t))return 'months';if(/goal|Emergency fund|sub-goal|priority/i.test(t))return 'goals';return 'settings'}
function logIt(lines){lines.forEach(t=>S.log.push({ts:Date.now(),text:t,k:logKind(t)}))}
const LG={q:'',k:'all',all:{}};
let mOk=null;
function confirmBox(title,lines,okLabel,onOk,opt){
  opt=opt||{};
  document.getElementById('mT').textContent=title;
  document.getElementById('mL').innerHTML=lines.map(l=>`<li>${l}</li>`).join('');
  document.getElementById('mX').innerHTML=(opt.input?`<label class="field"><span>${opt.input.label}</span><input type="number" inputmode="decimal" id="mIn" value="${opt.input.value}"></label>`:'')
    +(opt.word?`<label class="field"><span>Type <b>${opt.word}</b> to confirm</span><input type="text" id="mWord" autocomplete="off" autocapitalize="off" spellcheck="false"></label>`:'')
    +(opt.select?`<label class="field"><span>${opt.select.label}</span><select id="mSel">${opt.select.options.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></label>`:'')
    +(opt.multi?`<p class="lbl" style="margin:10px 0 4px">${opt.multi.label}</p>${opt.multi.rows.map(r=>`<label class="mcrow"><span>${esc(r.label)}<small>${money(r.max,true)} left</small></span><input type="number" inputmode="decimal" class="mcIn" data-id="${r.id}" data-max="${r.max}" value="${r.value||''}" placeholder="0" aria-label="Amount from ${esc(r.label)}"></label>`).join('')}<p class="mctot" id="mcTot"></p>`:'');
  mMulti=opt.multi||null;if(mMulti)updMulti();
  const y=document.getElementById('mYes');y.textContent=okLabel;y.classList.toggle('dangerbtn',!!opt.danger);mWord=opt.word||null;y.disabled=!!mWord;
  document.getElementById('mNo').textContent=opt.cancel||'Cancel';
  lastFocus=document.activeElement;mOk=onOk;document.getElementById('mBg').classList.add('open');(document.getElementById('mIn')||document.getElementById('mWord')||(mWord?document.getElementById('mNo'):y)).focus();
}
let lastFocus=null,mMulti=null,mWord=null;
function updMulti(){const el=document.getElementById('mcTot');if(!el||!mMulti)return;const tot=r2([...document.querySelectorAll('.mcIn')].reduce((a,i)=>a+(parseFloat(i.value)||0),0));if(!mMulti.need){el.innerHTML=`Moving <b>${money(tot,true)}</b>`;el.className='mctot'+(tot>0?' good':'');return}el.innerHTML=`Covering <b>${money(tot,true)}</b> of ${money(mMulti.need,true)}${tot>mMulti.need+0.004?' (more than needed)':tot<mMulti.need-0.004?`, ${money(mMulti.need-tot,true)} still over`:', fully covered'}`;el.className='mctot'+(tot>mMulti.need+0.004?' bad':tot>=mMulti.need-0.004?' good':'')}
document.getElementById('mX').addEventListener('change',e=>{if(e.target.id==='mSel'&&mMulti&&!mMulti.need){document.querySelectorAll('#mX .mcrow').forEach(r=>{const i=r.querySelector('.mcIn');const hide=i&&i.dataset.id===e.target.value;r.hidden=hide;if(hide){i.value=''}});updMulti()}});
document.getElementById('mX').addEventListener('input',e=>{if(e.target.classList.contains('mcIn'))updMulti();if(e.target.id==='mWord')document.getElementById('mYes').disabled=e.target.value.trim().toLowerCase()!==mWord});
function closeModal(){document.getElementById('mBg').classList.remove('open');mOk=null;if(lastFocus&&document.contains(lastFocus))lastFocus.focus()}
document.getElementById('mNo').addEventListener('click',closeModal);
document.getElementById('mBg').addEventListener('click',e=>{if(e.target.id==='mBg')closeModal()});
document.getElementById('mYes').addEventListener('click',()=>{if(mWord){const w=document.getElementById('mWord');if(!w||w.value.trim().toLowerCase()!==mWord)return}const f=mOk;const inp=document.getElementById('mIn'),sel=document.getElementById('mSel');const v=inp?parseFloat(inp.value):null,sv=sel?sel.value:null,mv={};document.querySelectorAll('.mcIn').forEach(i=>{const n=r2(parseFloat(i.value)||0);if(n)mv[i.dataset.id]=n});closeModal();if(f)f(v,sv,mv)});
const chg=(name,a,b)=>`${name}: ${a} → ${b}`;
function delta(cur,prev,inv){if(prev==null)return '<span class="sub">No prior month</span>';const d=cur-prev;return `<span class="chg ${(inv?d>0:d<0)?'down':'up'}">${d>=0?'+':''}${money(d)} vs ${S.snapshots[S.snapshots.length-1].m}</span>`}

function txLine(t){
  const when=new Date(t.date+'T00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
  let title=t.vendor,meta='',sign='',cls='';
  if(t.kind==='expense'){meta=`${cat(t.cat).name}, ${aName(t.acct)}`}
  else if(t.kind==='fixed'){meta=t.to?`${aName(t.acct)} → ${aName(t.to)}`:`Fixed cost, ${aName(t.acct)}`}
  else if(t.kind==='income'){title=t.vendor||'Income';meta=`Income to ${aName(t.acct)}`;sign='+';cls='in'}
  else if(t.kind==='transfer'){title=t.goal?'To '+((goal(t.goal)||{}).name||'goal'):t.note||'Transfer';meta=`${aName(t.from)} → ${aName(t.to)}`}
  else if(t.kind==='assign'){title='To '+((goal(t.goal)||{}).name||'goal');meta=`Set aside in ${aName(t.acct)}`}
  else if(t.kind==='goalbuy'){meta=`Goal purchase, ${aName(t.acct)}`}
  else if(t.kind==='adjust'){title=t.closeOf?'Correction at close':'Balance correction';meta=aName(t.acct);sign=t.dir>0?'+':'-'}
  else if(t.kind==='interest'){title=t.vendor||'Interest';meta='Estimated interest, '+aName(t.acct)}
  else if(t.kind==='gmove'){title='Goal move';meta=`${(goal(t.gFrom)||{}).name||'Goal'} → ${(goal(t.gTo)||{}).name||'goal'}`}
  else if(t.kind==='unassign'){title='Back to unassigned';meta=`From ${(goal(t.goal)||{}).name||'goal'}, ${aName(t.acct)}`}
  const neutral=['transfer','assign','adjust','gmove','unassign'].includes(t.kind)||(t.kind==='fixed'&&t.to);
  const open=UI.txOpen===t.id;
  return `<div class="txwrap ${open?'open':''}"><button class="tx txbtn" data-txopen="${t.id}" aria-expanded="${open}"><span class="meta"><span class="t1">${esc(title)}</span><span class="t2">${esc(meta)}, ${when}</span></span>
    <span class="amt ${cls}" style="${neutral?'color:var(--muted)':''}">${sign}${money(t.amount,true)}</span><span class="chev" aria-hidden="true">${open?'▾':'›'}</span></button>
    ${open?txDetail(t):''}</div>`;
}
const KIND_LABEL={expense:'Purchase',income:'Income',fixed:'Fixed cost payment',transfer:'Transfer',assign:'Set aside for a goal',goalbuy:'Goal purchase',adjust:'Balance correction',interest:'Estimated interest',gmove:'Goal move',unassign:'Back to unassigned'};
function txDetail(t){
  const L=[],m=t.date.slice(0,7),locked=S.closed.includes(m);
  L.push(['Type',KIND_LABEL[t.kind]||t.kind]);
  L.push(['Date',new Date(t.date+'T00:00').toLocaleDateString('en-US',{weekday:'short',month:'long',day:'numeric',year:'numeric'})]);
  L.push(['Amount',money(t.amount,true)]);
  if(t.kind==='expense')L.push(['Category',cat(t.cat).name]);
  if(t.from&&t.to&&t.kind==='transfer')L.push(['From → to',aName(t.from)+' → '+aName(t.to)]);
  else if(t.acct)L.push(['Account',aName(t.acct)+(t.to?' → '+aName(t.to):'')]);
  if(t.goal&&goal(t.goal))L.push(['Goal',goal(t.goal).name]);
  const linked=S.tx.filter(x=>x.link===t.id);
  linked.forEach(x=>L.push([KIND_LABEL[x.kind]||'Linked',money(x.amount,true)+' (goes with this entry)']));
  const acts=locked?`<p class="sub" style="font-size:13px;margin:8px 0 0">🔒 ${esc(monthName(mDate(m)))} is closed, so this entry can\u2019t be changed. Reopen the month from Past months to fix it.</p>`
    :`<div class="actions txacts">${editableTx(t)?`<button class="btn small ghost" data-edit="${t.id}">🔒 Edit</button>`:''}<button class="btn small ghost" data-txclose="1">Close</button><span style="flex:1"></span><button class="danger small" data-del="${t.id}">Delete entry</button></div>`;
  return `<div class="txdet">${L.map(([k,v])=>`<div class="rowtop"><span class="sub">${esc(k)}</span><span>${esc(v)}</span></div>`).join('')}${acts}</div>`;
}

/* ---------- views ---------- */
const V={};
const editableTx=t=>['expense','income','fixed'].includes(t.kind)&&!S.closed.includes(t.date.slice(0,7));
const ordinal=n=>n+(['th','st','nd','rd'][(n%100-20)%10]||['th','st','nd','rd'][n%100]||'th');
function closeBanner(){
  const open=openMonths();if(!open.length)return '';
  const first=monthName(mDate(open[0]));
  return `<div class="editbar" style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin:12px 0 0"><div><b>${open.length>1?open.length+' months aren\u2019t closed yet':first+' isn\u2019t closed yet'} ${tip('closewhy')}</b><span>${open.length>1?'Close them oldest first, starting with '+first+'.':'Confirm balances and lock the month.'}</span></div><button class="btn small" data-go="close">Close ${esc(first)}</button></div>`;
}
function planRow(r){
  const inc=S.plan.income||0,b=r.b,p=Math.round(r.pct);
  if(b.min==null)return `<div class="row"><div class="rowtop"><b>${esc(b.name)} ${tip('bk:'+r.i)}</b><span class="num">${money(r.v)}/mo, ${p}% of income</span></div></div>`;
  const tgt=b.min===b.max?`${b.min}%`:`${b.min}–${b.max}%`, tgt$=b.min===b.max?money(inc*b.min/100):`${money(inc*b.min/100)}–${money(inc*b.max/100)}`;
  const gap=r.st==='below'?`Below target: plan ${money(inc*b.min/100-r.v)} more to reach ${b.min}%`:r.st==='ahead'?`Ahead of target: ${money(r.v-inc*b.max/100)} more than ${b.max}%`:r.st==='above'?`Above target: ${money(r.v-inc*b.max/100)} more than ${b.max}%`:'Within target';
  const zl=Math.max(0,r.lo),zw=Math.min(100,r.hi)-zl;
  return `<div class="row prow">
    <div class="rowtop"><b>${esc(b.name)} ${tip('bk:'+r.i)}</b><span class="pbig num st ${r.st}">${p}%<small> of income</small></span></div>
    <div class="pbar" role="img" aria-label="${esc(b.name)}: ${p}% of income planned, target ${tgt}. ${gap}.">
      <i class="pfill ${r.st}" style="width:${Math.min(100,Math.max(0,r.pct))}%"></i>
      <i class="pzone" style="left:${zl}%;width:${zw}%"></i>
    </div>
    <div class="pticks" aria-hidden="true"><span style="left:${Math.min(88,Math.max(10,(zl+zl+zw)/2))}%">target ${tgt}</span></div>
    <div class="pcols"><span><b class="num">${money(r.v)}</b>/mo planned</span><span>Target ${tgt} = ${tgt$} ${tip('target')}</span></div>
    <p class="pgap st ${r.st}">${r.st==='ok'?'✓ ':r.st==='below'?'↓ ':r.st==='ahead'?'★ ':'↑ '}${gap}</p>
  </div>`;
}
function homeCards(){
  const B=c=>budgetOf(c,thisM);
  const monthly=liveCats().filter(c=>c.type==='monthly');
  const annual=liveCats().filter(c=>c.type==='annual');
  const budget=monthly.reduce((a,c)=>a+B(c),0);
  const used=monthly.reduce((a,c)=>a+spent(c.id),0);
  const left=budget-used;
  const overs=monthly.map(c=>({c,o:spent(c.id)-B(c)})).filter(x=>x.o>0);
  const overTotal=overs.reduce((a,x)=>a+x.o,0);
  const remainPool=monthly.reduce((a,c)=>a+Math.max(0,B(c)-spent(c.id)),0);
  const cut=c=>{const r=Math.max(0,B(c)-spent(c.id));return overTotal>0&&remainPool>0?Math.min(r,overTotal*r/remainPool):0};
  const last=S.snapshots[S.snapshots.length-1];const lb=last?last.bal:null;
  const has=ts=>liveAccts().some(a=>ts.includes(a.type));
  const ov=(label,v,prev,inv,ts)=>ts&&!has(ts)?'':`<div class="ov"><div class="sub">${label}</div><div class="ovv num">${money(v)}</div>${prev===undefined?'':delta(v,prev,inv)}</div>`;
  const row=(c,showCut)=>{const s=spent(c.id),p=B(c)?s/B(c)*100:0,l=B(c)-s,k=showCut?cut(c):0;
    return `<div class="row"><div class="rowtop"><b>${esc(c.name)}</b><span class="num">${l>=0?money(l)+' left of '+money(B(c)):money(-l)+' over'}</span></div><div class="bar"><i class="${pctClass(p)}" style="width:${Math.min(100,p)}%"></i></div>
    <div class="cols num"><span>Budgeted ${money(B(c))}${carryOf(c,thisM)?` (incl. ${money(carryOf(c,thisM))} rolled over)`:''}${c.type==='monthly'&&adjOf(c.id,thisM)?` (${adjOf(c.id,thisM)>0?'+':'−'}${money(Math.abs(adjOf(c.id,thisM)))} moved ${adjOf(c.id,thisM)>0?'in':'out'})`:''}</span><span>Spent ${money(s)}</span></div></div>`};
  return {
    start:()=>{if(S.gsHidden)return '';const st=gsSteps(),n=st.filter(x=>x.done||x.skipped).length;if(n===st.length)return '';
      const nxt=st.find(x=>!x.done&&!x.skipped);
      return `<h2>Getting started ${tip('start')}</h2><div class="panel">
        <div class="gsbar" role="img" aria-label="${n} of ${st.length} done"><i style="width:${n/st.length*100}%"></i></div><p class="sub" style="font-size:13px;margin:6px 0 4px">${n} of ${st.length} done. Steps tick themselves off as you go.</p>
        ${st.map(x=>`<div class="gsrow ${x.done?'done':x.skipped?'skip':''} ${x===nxt?'next':''}"><span class="ckdot" aria-hidden="true">${x.done?'✓':x.skipped?'–':''}</span><div><b>${esc(x.t)}${x.opt?' <small class="optl">optional</small>':''}</b>${x===nxt||(!x.done&&!x.skipped&&x.opt)?`<small>${esc(x.d)}</small>`:''}
          ${!x.done&&!x.skipped&&(x===nxt||x.opt)?`<div class="actions" style="margin-top:6px">${x.go?`<button class="btn small ${x===nxt?'':'ghost'}" data-go="${x.go[0]}"${x.go[1]?` data-anchor="${x.go[1]}"`:''}>Go</button>`:''}${x.opt?`<button class="btn small ghost" data-act="gsSkip" data-k="${x.k}">Skip</button>`:''}</div>`:''}</div></div>`).join('')}
        <div class="actions"><button class="btn small ghost" data-act="gsHide">Hide checklist</button></div></div>`},
    payday:()=>{const all=S.payday||[];if(!all.length)return '';
      const ok=x=>routeAcct(x.from)&&routeAcct(x.to)||(acct(x.from)&&!acct(x.from).archived&&acct(x.to)&&!acct(x.to).archived);
      const live=all.filter(ok),gone=all.length-live.length,left=live.filter(x=>!x.done);
      if(!live.length&&!gone)return '';
      return `<h2>Payday transfers ${tip('payday')}</h2><div class="panel">
        <p class="sub" style="font-size:13px;margin:0 0 6px">${left.length?`The app already counted these. Make them in your bank so the two match, then tick each one.`:'All done. Your bank matches the app.'}</p>
        ${live.map(x=>`<label class="pdrow ${x.done?'done':''}"><input type="checkbox" data-pd="${x.id}" ${x.done?'checked':''}><span><b>${money(x.amount,true)}</b> ${esc(aName(x.from))} → ${esc(aName(x.to))}<small>${esc(x.label)}, ${shortD(x.date)}</small></span></label>`).join('')}
        ${gone?`<p class="sub" style="font-size:13px;margin:6px 0 0">${gone} transfer${gone===1?'':'s'} hidden because an account was removed in Settings.</p>`:''}
        <div class="actions"><button class="btn small ghost" data-act="pdClear">${left.length?'Clear list':'Done'}</button></div></div>`},
    checkin:()=>{if(!S.notif.weekly)return '';const last=S.lastCheck;const days=last?Math.floor((now-new Date(last+'T00:00'))/864e5):99;if(days<7)return '';
      const wk=new Date(now);wk.setDate(wk.getDate()-7);const wkISO=iso(wk.getFullYear(),wk.getMonth()+1,wk.getDate());
      const logged=S.tx.filter(t=>t.date>wkISO&&t.kind==='expense').length;
      const dl=new Date(now.getFullYear(),now.getMonth()+1,0).getDate()-now.getDate()+1;
      const behind=topGoals().map(g=>({g,k:goalInfo(g)})).filter(x=>x.k.status==='behind');
      const pd=(S.payday||[]).filter(x=>!x.done).length;
      const soon=liveFixed().filter(f=>f.day&&fixedOwe(f)>0.004&&f.day>=now.getDate()&&f.day<now.getDate()+7);
      const it=[[`${logged} purchase${logged===1?'':'s'} logged this week`,logged?'Check your bank for any you missed.':'Nothing logged. Check your bank for purchases to add.',logged?'ok':'warn'],
        [`${money(Math.max(0,left))} left to spend`,left>0?`About ${money(left/dl)} a day for the ${dl} day${dl===1?'':'s'} left this month.`:'You’re at or over your budgets. Use Cover it on the dashboard.',left>0?'ok':'warn']];
      if(soon.length)it.push([`${soon.length} bill${soon.length===1?'':'s'} due this week`,soon.map(f=>esc(f.name)+' ('+ordinal(f.day)+')').join(', '),'warn']);
      if(pd)it.push([`${pd} payday transfer${pd===1?'':'s'} not ticked`,'Make them in your bank so balances match.','warn']);
      it.push(behind.length?[`${behind.length} goal${behind.length===1?'':'s'} behind`,behind.map(x=>esc(x.g.name)+' ('+money(Math.abs(x.k.diff))+')').join(', '),'warn']:['Goals on pace','Nothing behind right now.','ok']);
      return `<h2>Weekly check-in ${tip('checkin')}</h2><div class="panel">${it.map(([a,b,c])=>`<div class="ckrow ${c}"><span class="ckdot" aria-hidden="true">${c==='ok'?'✓':'•'}</span><div><b>${a}</b><small>${b}</small></div></div>`).join('')}
        <div class="actions"><button class="btn small" data-act="checkDone">Done for this week</button></div></div>`},
    cardpay:()=>{const cs=liveAccts().filter(a=>a.type==='debt'&&a.card&&a.payFull);if(!cs.length)return '';
      return `<h2>Credit card ${tip('card')}</h2>${cs.map(a=>`<div class="panel" style="margin-bottom:10px"><div class="rowtop"><b>${esc(a.name)}</b><span class="sub">Statement closes the ${ordinal(a.stmt||1)}</span></div>${cardBlock(a)}</div>`).join('')}`},
    networth:()=>`<div class="panel networth">
      <div class="rowtop"><span class="sub">Net worth ${tip('networth')}</span><button class="btn small ghost" data-go="accounts">Accounts</button></div>
      <div class="num" style="font:800 46px/1.05 var(--display);letter-spacing:-.03em">${money(netOf())}</div>
      ${delta(netOf(),lb?netOf(lb):null)}</div>`,
    overview:()=>{const tiles=[ov('Checking',sumType(['checking']),lb?sumType(['checking'],lb):undefined,false,['checking']),
      ov('Liquid savings',sumType(['savings','cash']),lb?sumType(['savings','cash'],lb):undefined,false,['savings','cash']),
      ov('Retirement',sumType(['retirement']),lb?sumType(['retirement'],lb):undefined,false,['retirement']),
      ov('Debt',sumType(['debt']),lb?sumType(['debt'],lb):undefined,true,['debt']),
      ov('Total cash',sumType(['checking','cash','savings']),lb?sumType(['checking','cash','savings'],lb):undefined,false,['checking','cash','savings']),
      (S.assets||[]).some(x=>!x.archived)?ov('Other assets',othNow(),lb?(lb.__oth||0):undefined):'',
      ov('Income this month',incomeIn(thisM))].join('');return `<div class="ovgrid">${tiles}</div>`},
    plan:()=>{const {P,rows}=planCheck();const fw=S.plan.framework==='custom'?{name:'Custom plan'}:FW[S.plan.framework];
      return `<h2>${esc(fw.name)} ${tip('plan')}</h2>
      <p class="sub planintro">How your <b class="num">${money(S.plan.income)}</b> monthly take-home is split up. Each % is that group\u2019s planned dollars divided by your take-home.</p>
      <div class="panel">${rows.map(planRow).join('')}
        <div class="row"><div class="rowtop"><b>${P.unplanned>=0?'Unplanned':'Overplanned'} ${tip('unplanned')}</b><span class="num ${P.unplanned<0||(FW[S.plan.framework]||{}).zero&&Math.abs(P.unplanned)>1?'overtxt':''}">${money(Math.round(Math.abs(P.unplanned)))}, ${Math.abs(Math.round(P.unplanned/(S.plan.income||1)*100))}% of income</span></div>
        <p class="sub" style="font-size:13px;margin:4px 0 0">${P.unplanned>=0?'Take-home not given a job yet.':'You\u2019ve planned more than you take home. Lower a budget or a goal.'}</p>
        ${(FW[S.plan.framework]||{}).zero?`<p class="sub" style="font-size:13px;margin:4px 0 0">Zero-based goal: get this to $0.</p>`:''}</div>
      </div>
      <div class="plegend"><span><i class="lgfill lgok"></i>Within target</span><span><i class="lgfill"></i>Below</span><span><i class="lgfill lgahead"></i>Ahead (saving more)</span><span><i class="lgfill lgabove"></i>Above (spending more)</span><span><i class="lgzone"></i>Target zone</span><span>Tap ? on a group to see what\u2019s in it.</span></div>`},
    spending:()=>{if(!monthly.length)return `<h2>Spending</h2><div class="panel emptycard"><b>No monthly categories yet.</b><p class="sub">Categories are the buckets your spending goes into, like Food or Gas. Add them in Settings and each one gets a monthly budget here.</p><div class="actions"><button class="btn small" data-go="config">Open Settings</button></div></div>`;
      const groups=buckets().map(b=>({b,cats:monthly.filter(c=>b.roles.includes(c.role||'want'))})).filter(x=>x.cats.length);
      const bk=[...new Set(monthly.map(c=>c.acct).filter(Boolean))].map(id=>{const a=acct(id);if(!a||a.archived)return null;const cs=monthly.filter(c=>c.acct===id);const need=r2(cs.reduce((s,c)=>s+Math.max(0,B(c)-spent(c.id)),0));const have=a.type==='debt'?null:unassigned(id);return {a,cs,need,have}}).filter(Boolean);
      const bkWarn=bk.filter(x=>x.have!=null&&x.have<x.need-0.5);
      return `<h2>Spending</h2>
      ${bkWarn.map(x=>`<div class="note">${esc(x.a.name)} has ${money(x.have,true)}, but ${money(x.need,true)} is still budgeted for ${x.cs.map(c=>esc(c.name)).join(', ')} this month. Move ${money(x.need-x.have,true)} into it, or lower those budgets. ${tip('bucketwarn')}</div>`).join('')}
      <div class="panel"><div class="row"><div class="rowtop"><b>Left to spend</b><span class="num" style="font-size:16px;color:${left<0?'var(--over)':'var(--ink)'};font-weight:700">${money(left)} of ${money(budget)}</span></div></div></div>
      <div class="actions" style="margin-top:8px"><button class="btn small ghost" data-act="moveBudget">Move budget ${tip('movebudget')}</button></div>
      ${groups.map(x=>`<p class="lbl" style="margin:14px 0 6px">${esc(x.b.name)}</p><div class="panel">${x.cats.map(c=>row(c,true)).join('')}</div>`).join('')}
      ${overTotal>0?`<div class="note">You're ${money(overTotal,true)} over in ${overs.map(x=>esc(x.c.name.toLowerCase())).join(' and ')}. Cover it by moving budget from categories that have money left. ${tip('cut')}
        <div class="actions" style="margin-top:8px">${overs.map(x=>`<button class="btn small" data-act="cover" data-cat="${x.c.id}">Cover ${esc(x.c.name)}</button>`).join('')}</div></div>`:''}`},
    fixed:()=>{const all=liveFixed().filter(f=>!ended(f));if(!all.length)return `<h2>Fixed costs</h2><div class="panel emptycard"><b>No fixed costs yet.</b><p class="sub">These are bills that repeat, like rent, your phone, a loan payment, or a yearly fee. Add them in Settings and you can mark each one paid here.</p></div>`;
      const fx=all.filter(f=>dueIn(f)),later=all.filter(f=>!dueIn(f));
      return `<h2>Fixed costs ${tip('fixed')}</h2>
      <div class="panel">${fx.map(f=>{const due=fixedDue(f),owe=fixedOwe(f);
      const late=f.day&&now.getDate()>f.day&&owe>0.004;
      return `<div class="row"><div class="rowtop" style="align-items:center"><div><b>${esc(f.name)}</b><div class="sub" style="font-size:13px">${f.pct?`${f.pct}% of income logged (${money(due,true)})`:money(f.amount,true)}${f.day?`, due the ${ordinal(f.day)}`:''}, ${esc(aName(f.acct))}${f.to?' → '+esc(aName(f.to)):''}${(f.freq||'monthly')!=='monthly'||f.end?`<br>${esc(schedText(f))}`:''}</div>${late?'<div class="warnline" style="margin:2px 0 0;font-size:13px">Past due</div>':''}</div>
      ${owe>0.004?`<button class="btn small" data-payfixed="${f.id}">Pay</button>`:`<button class="paidbtn" data-unpay="${f.id}" aria-label="Paid. Tap to undo">Paid ✓</button>`}</div></div>`}).join('')||'<div class="empty">Nothing due this month.</div>'}
      ${later.length?`<div class="row"><p class="lbl" style="margin:0 0 4px">Not due this month</p>${later.map(f=>{const n=nextDue(f);return `<div class="hrow"><span>${esc(f.name)}</span><span class="num">${f.pct?f.pct+'%':money(f.amount)}${n?', next '+monthName(mDate(n),{month:'short',year:'numeric'}):''}</span></div>`}).join('')}</div>`:''}</div>`},
    annual:()=>annual.length?`<h2>Annual budgets</h2><div class="panel">${annual.map(c=>row(c,false)).join('')}</div>`:'',
    latest:()=>{const recent=S.tx.filter(t=>inMonth(t,thisM)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
      return `<h2>Latest entries</h2>
      <div class="panel">${recent.length?recent.map(txLine).join(''):'<div class="empty">Nothing logged this month yet. Tap + to log a purchase, a paycheck, or a transfer.</div>'}</div>
      <button class="btn ghost full" data-go="activity" style="margin-top:10px">See all activity</button>`}
  };
}
function pinCard(key){
  const [kind,idv]=key.split(':');
  if(kind==='goal'){const g=goal(idv);if(!g||g.done)return null;
    const k=goalInfo(g);
    const body=isParent(g)?famBar(g,k.fp)+(k.nextShort?`<p class="warnline">${esc(k.nextShort.k.name)} needs ${money(k.nextShort.gap)} more than the fund has.</p>`:'')
      :`<div class="gbar"><div class="fbar"><i class="fpaid" style="width:${Math.min(100,g.saved/g.target*100)}%"></i></div>${expMark(g,k)}</div><p class="fsum"><b class="num">${Math.round(Math.min(100,g.saved/g.target*100))}% saved</b>, ${money(g.saved)} of ${money(g.target)}</p>`;
    return `<div class="panel pincard"><div class="rowtop"><b>${esc(g.name)}</b><span class="pills">${statusPill(k,g)}</span></div>${body}
      <p class="sub" style="font-size:13px;margin:6px 0 0">${k.status==='funded'?'Fully covered.':`${money(k.perMonth)}/month to finish by ${shortD(g.date)}`}</p>
      <div class="actions"><button class="btn small ghost" data-go="goals">Open in Goals</button></div></div>`}
  if(kind==='debt'){const a=acct(idv);if(!a||a.archived)return null;
    return `<div class="panel pincard"><div class="rowtop"><b>${esc(a.name)}</b><span class="num">${money(a.balance)} owed</span></div>${debtBlock(a,true)}
      <div class="actions"><button class="btn small ghost" data-go="accounts">Open in Accounts</button></div></div>`}
  return null;
}
V.home=()=>{
  if(!S.setupDone)return V.setup();
  const C=homeCards();
  const valid=S.dash.order.filter(k=>C[k]||pinCard(k)!==null);
  if(valid.length!==S.dash.order.length)S.dash.order=valid;
  const shown=S.dash.order.filter(k=>!S.dash.hidden.includes(k));
  return `
  <p class="sub">${monthName(now,{month:'long',year:'numeric'})}</p>
  <h1>Dashboard</h1>
  ${closeBanner()}
  <div class="dgrid">${shown.map(k=>{const h=C[k]?C[k]():pinCard(k);return h?`<section class="dcard dc-${k.replace(':','-')}">${h}</section>`:''}).join('')}</div>
  ${shown.length?'':`<div class="panel emptycard"><b>Every card is hidden.</b><p class="sub">Turn some back on in Settings, under Dashboard.</p></div>`}
`;
};

function debtPay(a){return a.min||(liveFixed().find(f=>f.to===a.id&&f.pct==null)||{}).amount||0}
function debtProg(a){
  const interest=r2(S.tx.filter(t=>t.kind==='interest'&&t.acct===a.id).reduce((s,t)=>s+t.amount,0));
  if(!(a.start>0))return {has:false,interest};
  const paid=r2(Math.max(0,a.start-a.balance));
  return {has:true,paid,left:a.balance,pct:Math.min(100,paid/a.start*100),interest};
}
function cardInfo(a){
  const d=a.stmt||1,t=now,y=t.getFullYear(),m=t.getMonth();
  const closeDate=t.getDate()>=d?new Date(y,m,Math.min(d,new Date(y,m+1,0).getDate())):new Date(y,m-1,Math.min(d,new Date(y,m,0).getDate()));
  const closeISO=iso(closeDate.getFullYear(),closeDate.getMonth()+1,closeDate.getDate());
  const since=r2(S.tx.filter(x=>x.kind==='expense'&&x.acct===a.id&&x.date>closeISO).reduce((s,x)=>s+x.amount,0));
  const from=routeAcct(a.payFrom)||routeAcct(S.plan.deposit);
  const bills=from?r2(liveFixed().filter(f=>f.acct===from&&f.to!==a.id).reduce((s,f)=>s+fixedOwe(f),0)):0;
  const avail=from?r2(unassigned(from)-bills):0;
  return {closeISO,since,stmtBal:r2(Math.max(0,a.balance-since)),from,bills,avail,short:r2(Math.max(0,a.balance-avail))};
}
function cardBlock(a){const c=cardInfo(a);
  return `<div class="gstats"><div class="rorow"><span>Owed now</span><b class="num">${money(a.balance,true)}</b></div>
    <div class="rorow"><span>Charged since ${shortD(c.closeISO)} statement</span><b class="num">${money(c.since,true)}</b></div>
    ${c.from?`<div class="rorow"><span>Free in ${esc(aName(c.from))} after bills ${tip('cardfree')}</span><b class="num">${money(c.avail,true)}</b></div>`:''}</div>
    ${a.balance<=0.004?'<p class="okline">Nothing owed.</p>':!c.from?'<p class="warnline">Pick an account to pay it from in Settings.</p>':c.short>0.004?`<p class="warnline">${money(c.short,true)} short of paying the full balance. Pause card spending or move money into ${esc(aName(c.from))}. ${tip('cardshort')}</p>`:`<p class="okline">✓ You can pay it in full from ${esc(aName(c.from))}.</p>`}`;
}
function debtBlock(a,compact){
  if(a.card&&a.payFull)return cardBlock(a);
  const d=debtProg(a),p=payoff(a);
  return (d.has?`<div class="fbar" role="img" aria-label="${Math.round(d.pct)}% paid off"><i class="fpaid" style="width:${d.pct}%"></i></div>
    <p class="fsum"><b class="num">${Math.round(d.pct)}% paid off</b>, ${money(d.left)} to go of ${money(a.start)}</p>`
    :compact?'':`<p class="sub" style="font-size:13px;margin:6px 0 0">Add the original amount in Settings to see how far you\u2019ve come. ${tip('debtstart')}</p>`)
    +`<p class="sub" style="font-size:14px;margin:4px 0 0">${p.txt}</p>`
    +(d.interest>0?`<p class="sub" style="font-size:13px;margin:2px 0 0">Interest paid so far: ${money(d.interest)} (estimated) ${tip('interest')}</p>`:'');
}
/* when a payment lands on a loan that charges interest, part of it covers that month's interest */
function interestFor(debtId,date,payAmt){
  const a=acct(debtId);if(!a||a.type!=='debt'||!a.accrue||!(a.apr>0))return 0;
  if(S.tx.some(t=>t.kind==='interest'&&t.acct===debtId&&t.date.slice(0,7)===date.slice(0,7)))return 0;
  return r2(Math.min(balAt(a,date.slice(0,7))*a.apr/1200,payAmt));
}
function payDebt(base){
  const i=interestFor(base.to,base.date,base.amount),a=acct(base.to);
  const owed=r2(balAtDay(a,base.date)+i);
  if(base.amount>owed+0.004)return {err:`${a.name} only has ${money(owed,true)} left to pay${i?' including this month\u2019s interest':''}`};
  const p=addTx(base);let it=null;
  if(i>0)it=addTx({date:base.date,vendor:a.name+' interest',amount:i,kind:'interest',acct:a.id,link:p.id});
  const note=i>0?` About ${money(i,true)} went to interest, ${money(base.amount-i,true)} to principal.`:'';
  if(a.balance<=0.004)setTimeout(()=>notify(a.name+' is paid off','Archive it and its payment in Settings when you\u2019re ready.'),800);
  return {tx:p,note};
}
function balAtDay(a,date){const after=S.tx.filter(t=>t.date>date).reduce((s,t)=>s+effectOn(t,a.id),0);return r2(a.type==='debt'?a.balance+after:a.balance-after)}
function payoff(a){
  const r=(a.apr||0)/1200,B=a.balance,P=debtPay(a);
  if(B<=0)return {txt:'Paid off'};
  if(!P)return {txt:'Add a monthly payment to see a payoff date'};
  if(r>0&&P<=r*B)return {txt:'This payment doesn\u2019t cover the interest'};
  const n=r>0?Math.ceil(-Math.log(1-r*B/P)/Math.log(1+r)):Math.ceil(B/P);
  const interest=Math.max(0,n*P-B);
  const d=new Date(now.getFullYear(),now.getMonth()+n,1);
  return {txt:`Paid off ${d.toLocaleDateString('en-US',{month:'short',year:'numeric'})}, about ${money(interest)} in interest`};
}
V.accounts=()=>{
  const E=UI.editAccts;
  const groups=['checking','cash','savings','retirement','debt'];
  const famOrder=g=>{const r=g.parent?goal(g.parent):g;return S.goals.indexOf(r)*2+(g.parent?1:0)};
  const hist=S.snapshots.slice(-3);
  const debts=liveAccts().filter(a=>a.type==='debt');
  const bal=a=>E?`<input class="balin num" type="number" inputmode="decimal" data-acct="${a.id}" value="${a.balance}" aria-label="${esc(a.name)} balance">`:`<span class="num" style="font:700 17px var(--display);color:var(--ink)">${money(a.balance,true)}</span>`;
  return `<button class="btn small ghost" data-go="home" style="margin-bottom:8px">Back to dashboard</button><h1>Accounts</h1>
  ${E?`<div class="editbar"><b>Editing accounts</b><span>Use this for corrections. Day-to-day changes come from your entries. Nothing saves until you review it. ${tip('correction')}</span></div>`:`<div class="lockrow"><p class="sub">🔒 Balances update from your entries.</p><button class="btn small ghost" data-act="editAccts">Edit</button></div>`}
  ${(()=>{const all=liveAccts().slice().sort((x,y)=>groups.indexOf(x.type)-groups.indexOf(y.type));const banks=[...new Set(all.map(a=>a.bank||''))].sort((x,y)=>(x==='')-(y===''));
    const grouped=banks.some(b=>b);
    return `<h2>${grouped?'By bank':'Your accounts'} ${tip('bank')}</h2>`+banks.map(bk=>{const list=all.filter(a=>(a.bank||'')===bk);const held=list.filter(a=>a.type!=='debt').reduce((s,a)=>s+a.balance,0),owed=list.filter(a=>a.type==='debt').reduce((s,a)=>s+a.balance,0);
      return `<div class="panel bankpanel">${grouped?`<div class="bankhead"><b>${bk?esc(bk):'Other accounts'}</b><span class="num">${list.some(a=>a.type!=='debt')?money(held,true):''}${owed?`<small>${money(owed,true)} owed</small>`:''}</span></div>`:''}
      ${list.map(a=>{const gs=a.type==='debt'?[]:activeGoals().filter(g=>g.acct===a.id&&(!g.parent||g.saved>0.004));const free=unassigned(a.id);return `<div class="row acct"><div class="rowtop"><span><b>${esc(a.name)}</b><small class="atype">${TYPES[a.type]}${a.type==='debt'?', owed':''}</small></span>${bal(a)}</div>
        ${!E&&gs.length?`<div class="asplit">${gs.map(g=>`<div class="rorow"><span>${g.parent?'↳ ':''}${esc(g.name)}</span><b class="num">${money(g.saved)}</b></div>`).join('')}<div class="rorow"><span>Unassigned ${tip('unassigned')}</span><b class="num" style="${free<0?'color:var(--over)':''}">${money(free)}</b></div>${free<0?'<p class="sub" style="font-size:13px;margin:4px 0 0;color:var(--over)">This account dropped below what your goals have set aside. Move money in or lower a goal.</p>':''}</div>`:''}</div>`}).join('')}</div>`}).join('')})()}
  ${(S.assets||[]).some(x=>!x.archived)?`<h2>Other assets</h2><div class="panel">${S.assets.filter(x=>!x.archived).map(x=>`<div class="row"><div class="rowtop"><b>${esc(x.name)}</b><span class="num">${money(x.value||0)}</span></div></div>`).join('')}</div><p class="sub" style="font-size:13px;margin-top:6px">Update these during the monthly close or in Settings.</p>`:''}
  <h2>Debt tracker</h2>
  <div class="panel">${debts.map(a=>{return `<div class="row"><div class="rowtop"><b>${esc(a.name)}</b><span class="num">${money(a.balance)}</span></div>
    ${E?`<div class="two" style="margin-top:8px"><label class="field" style="margin:0"><span>APR %</span><input type="number" inputmode="decimal" data-apr="${a.id}" value="${a.apr||''}"></label><label class="field" style="margin:0"><span>Monthly payment</span><input type="number" inputmode="decimal" data-min="${a.id}" value="${a.min||''}"></label></div>`
      :`<p class="sub" style="font-size:14px;margin:6px 0 0">${a.apr||0}% APR, paying ${money(debtPay(a))}/month</p>`}
    ${debtBlock(a)}
    ${E?'':`<div class="actions" style="margin-top:8px">${pinBtn('debt:'+a.id,a.name)}</div>`}</div>`}).join('')||'<div class="empty">No debts. If you add a loan or card in Settings, it shows up here with a payoff date.</div>'}</div>
  ${E?`<div class="actions" style="margin-top:16px"><button class="btn ghost" data-act="cancel">Cancel</button><button class="btn" data-act="reviewAccts" style="flex:1">Review changes</button></div>`:''}
  <h2>Balance sheet</h2>
  <div class="panel" style="padding:4px 0;overflow-x:auto"><table class="bs num"><thead><tr><th></th>${hist.map(h=>`<th>${h.m}</th>`).join('')}<th>Now</th></tr></thead><tbody>
    ${S.accounts.filter(a=>!a.archived||hist.some(h=>h.bal[a.id])).map(a=>`<tr><td>${esc(a.name)}</td>${hist.map(h=>`<td>${h.bal[a.id]!=null?money(h.bal[a.id]):'–'}</td>`).join('')}<td>${money(a.balance)}</td></tr>`).join('')}
    ${(S.assets||[]).length||hist.some(h=>h.bal.__oth)?`<tr><td>Other assets</td>${hist.map(h=>`<td>${money(h.bal.__oth||0)}</td>`).join('')}<td>${money(othNow())}</td></tr>`:''}
    <tr class="tot"><td>Net worth</td>${hist.map(h=>`<td>${money(netOf(h.bal))}</td>`).join('')}<td>${money(netOf())}</td></tr>
  </tbody></table></div>`;
};

const pinned=key=>S.dash.order.includes(key);
function togglePin(key,name){
  if(pinned(key)){S.dash.order=S.dash.order.filter(k=>k!==key);logIt(['Dashboard — unpinned '+name]);toast(name+' unpinned from dashboard')}
  else{const i=S.dash.order.indexOf('overview');S.dash.order.splice(i>=0?i+1:0,0,key);S.dash.hidden=S.dash.hidden.filter(k=>k!==key);logIt(['Dashboard — pinned '+name]);toast(name+' pinned to dashboard')}
}
function unpinQuiet(key){S.dash.order=S.dash.order.filter(k=>k!==key)}
const pinBtn=(key,name)=>`<button class="btn small ghost" data-act="pin" data-key="${key}" data-name="${esc(name)}" aria-pressed="${pinned(key)}">${pinned(key)?'Unpin':'Pin to dashboard'}</button>`;
const shortD=d=>new Date(d+'T00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const soonOrFunded=(g,k)=>k.status==='funded'||(g.saved>0&&(new Date(g.date+'T00:00')-now)/864e5<=14);
function statusPill(k,g){
  const past=!g.done&&k.status!=='funded'&&new Date(g.date+'T00:00')<now;
  const lab=k.status==='funded'?(g.parent?'Ready to pay':'Fully funded'):past?'Past due':k.status==='behind'&&k.diff!=null?'Behind '+money(Math.abs(k.diff)):k.status==='ahead'&&k.diff!=null?'Ahead '+money(k.diff):k.status[0].toUpperCase()+k.status.slice(1);
  return `<span class="pills"><span class="pill ${k.status==='behind'||past?'behind':k.status==='ahead'?'ahead':''}">${lab}</span>${tip(k.status==='funded'?'funded':past?'pastdue':g.parent?'behind':'gstat:'+g.id)}</span>`;
}
/* inline panels shared by every goal row */
function addPanel(g){
  const free=unassigned(g.acct),sources=liveAccts().filter(a=>a.type!=='debt'&&a.id!==g.acct);
  return `<div class="inpanel">
    <label class="field"><span>Amount</span><input type="number" inputmode="decimal" id="addAmt" placeholder="0"></label>
    <label class="field"><span>Where's it coming from? ${tip('unassigned')}</span><select id="addFrom">
      <option value="unassigned">Already in ${esc(aName(g.acct))} (${money(free,true)} unassigned)</option>
      ${sources.map(a=>`<option value="${a.id}">Move from ${esc(a.name)} (${money(a.balance,true)})</option>`).join('')}
    </select></label>
    <div class="actions"><button class="btn ghost small" data-act="cancel">Cancel</button><button class="btn small" data-act="doAdd" data-id="${g.id}" style="flex:1">Add to ${esc(g.name)}</button></div></div>`;
}
function moveTargets(g){
  const fam=new Set(isParent(g)?family(g).map(x=>x.id):[g.id]);
  const out=[];const par=g.parent?goal(g.parent):null;
  if(par&&!par.done)out.push([par.id,`Back to ${par.name} fund`]);
  if(isParent(g))liveKids(g).forEach(k=>out.push([k.id,`${k.name} (sub-goal)`]));
  activeGoals().filter(x=>!fam.has(x.id)&&(!par||x.id!==par.id)&&!(isParent(g)&&x.parent===g.id)).forEach(x=>out.push([x.id,x.parent?`${x.name} (in ${goal(x.parent).name})`:x.name]));
  out.push(['unassigned',`Unassigned in ${aName(g.acct)}`]);
  return out;
}
function movePanel(g){
  return `<div class="inpanel">
    <p class="lbl" style="margin:0">Move money out of ${esc(g.name)} ${tip('gmove')}</p>
    <label class="field"><span>Amount (${money(g.saved,true)} available)</span><input type="number" inputmode="decimal" id="mvAmt" value="${g.saved}"></label>
    <label class="field"><span>Move it to</span><select id="mvTo">${moveTargets(g).map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join('')}</select></label>
    <div class="actions"><button class="btn ghost small" data-act="cancel">Cancel</button><button class="btn small" data-act="doMove" data-id="${g.id}" style="flex:1">Move money</button></div></div>`;
}
function subPanel(g){
  const first=!kids(g).length;
  return `<div class="inpanel">
    <p class="lbl" style="margin:0">Add a sub-goal to ${esc(g.name)} ${tip('subgoal')}</p>
    ${first?`<p class="sub" style="font-size:13px;margin:4px 0 0">${esc(g.name)} becomes the overall fund. Its ${money(g.target)} target becomes the total, and the ${money(g.saved)} already saved stays in the fund.</p>`:''}
    <label class="field"><span>Name</span><input type="text" id="sgName" placeholder="e.g. Spring 2027, March payment"></label>
    <div class="two"><label class="field"><span>Amount due</span><input type="number" inputmode="decimal" id="sgAmt" placeholder="1500"></label>
    <label class="field"><span>Due date</span><input type="date" id="sgDate" max="${g.date}"></label></div>
    <div class="actions"><button class="btn ghost small" data-act="cancel">Cancel</button><button class="btn small" data-act="doSub" data-id="${g.id}" style="flex:1">Add sub-goal</button></div></div>`;
}
function editPanel(g,acctOpts){
  const par=isParent(g),child=!!g.parent;
  return `<div class="goal editing">
    <div class="editbar" style="margin:0 0 6px"><b>Editing ${esc(g.name)}</b><span>Review before anything is saved.</span></div>
    <label class="field"><span>Name</span><input type="text" id="eName" value="${esc(g.name)}"></label>
    <div class="two"><label class="field"><span>${par?'Overall total':child?'Amount due':'Target'}</span><input type="number" inputmode="decimal" id="eAmt" value="${g.target}"></label>
    <label class="field"><span>${par?'Finish by':child?'Due date':'Buy by'}</span><input type="date" id="eDate" value="${g.date}"></label></div>
    ${child?`<p class="sub" style="font-size:13px">Kept in ${esc(aName(g.acct))}, with the rest of ${esc(goal(g.parent).name)}.</p>`:`<label class="field"><span>Kept in${par?' (moves the whole fund and its sub-goals)':''}</span><select id="eAcct">${acctOpts(g.acct)}</select></label>`}
    <p class="sub" style="font-size:13px">To change how much is saved, use Add money or Move money.</p>
    <div class="actions"><button class="btn ghost small" data-act="cancel">Cancel</button><button class="btn small" data-act="reviewGoal" data-id="${g.id}" style="flex:1">Review changes</button></div>
    <button class="danger" data-act="archGoal" data-id="${g.id}">${hasHistory(g)?'Archive this goal':'Delete this goal'}</button>
  </div>`;
}
const hasHistory=g=>family(g).length>1||S.tx.some(t=>t.goal===g.id||t.gFrom===g.id||t.gTo===g.id);
function kidPill(c,par){
  const short=r2(c.target-c.saved),gap=(parentInfo(par).cover||{})[c.id];
  if(short<=0.004)return `<span class="pill">Ready to pay</span>${tip('readypay')}`;
  if(new Date(c.date+'T00:00')<now)return `<span class="pill behind">Past due</span>${tip('pastdue')}`;
  if(!gap)return `<span class="pill">Covered by fund</span>${tip('coveredfund')}`;
  return `<span class="pill behind">${money(gap)} short</span>${tip('kidshort')}`;
}
function childRow(c,par){
  if(UI.editGoal===c.id)return editPanel(c,()=>'');
  if(c.done)return `<div class="kid done"><div class="rowtop"><span>✓ ${esc(c.name)}</span><span class="num">${c.archived?'Archived':money(c.paid||0)+' paid '+(c.boughtOn?new Date(c.boughtOn+'T00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}):'')}</span></div></div>`;
  const k=goalInfo(c),p=Math.min(100,c.target?c.saved/c.target*100:0),short=r2(c.target-c.saved);
  const open=UI.addTo===c.id?addPanel(c):UI.moveFrom===c.id?movePanel(c):'';
  return `<div class="kid">
    <div class="rowtop"><b>${esc(c.name)}</b><span class="pills">${kidPill(c,par)}</span></div>
    <div class="cols num"><span>Due ${shortD(c.date)}</span><span>${money(c.saved)} of ${money(c.target)} moved in ${tip('movedin')}</span></div>
    <div class="bar"><i style="width:${p}%"></i></div>
    ${open||`<div class="actions">
      ${short>0.004?`<button class="btn small" data-act="fill" data-id="${c.id}" ${par.saved>0.004?'':'disabled'}>Fill from fund${par.saved>0.004?` (${money(Math.min(short,par.saved))})`:''}</button>`:''}
      ${soonOrFunded(c,k)?`<button class="btn small ${short>0.004?'ghost':''}" data-act="bought" data-id="${c.id}">Mark paid</button>`:''}
      <button class="btn small ghost" data-act="more" data-id="${c.id}" aria-expanded="${UI.more===c.id}">More</button>
    </div>
    ${UI.more===c.id?`<div class="actions">
      <button class="btn small ghost" data-act="addTo" data-id="${c.id}">Add money</button>
      ${c.saved>0.004?`<button class="btn small ghost" data-act="moveFrom" data-id="${c.id}">Move money</button>`:''}
      <button class="btn small ghost" data-act="push" data-id="${c.id}">Push date back</button>
      <button class="btn small ghost" data-act="editGoal" data-id="${c.id}">🔒 Edit</button></div>`:''}`}
  </div>`;
}
V.goals=()=>{
  const tops=topGoals(),done=S.goals.filter(g=>g.done&&!g.parent);
  const P=monthPlan();
  const acctOpts=sel=>liveAccts().filter(a=>a.type!=='debt').map(a=>`<option value="${a.id}" ${a.id===sel?'selected':''}>${esc(a.name)}</option>`).join('');
  const panels=g=>UI.addTo===g.id?addPanel(g):UI.moveFrom===g.id?movePanel(g):UI.addSub===g.id?subPanel(g):'';
  const card=(g,i)=>{
    if(UI.editGoal===g.id)return editPanel(g,acctOpts);
    const k=goalInfo(g),pl=P.goals.find(x=>x.g.id===g.id),due=shortD(g.date),past=new Date(g.date+'T00:00')<now;
    const actions=`<div class="actions">
        ${isParent(g)?(liveKids(g).length?`<button class="btn small" data-act="addTo" data-id="${g.id}">Add money</button>`:`<button class="btn small" data-act="complete" data-id="${g.id}">Mark complete</button><button class="btn small ghost" data-act="addTo" data-id="${g.id}">Add money</button>`)
          :soonOrFunded(g,k)?`<button class="btn small" data-act="bought" data-id="${g.id}">Mark as bought</button>${k.status!=='funded'?`<button class="btn small ghost" data-act="addTo" data-id="${g.id}">Add money</button>`:''}`:`<button class="btn small" data-act="addTo" data-id="${g.id}">Add money</button>`}
        <button class="btn small ghost" data-act="more" data-id="${g.id}" aria-expanded="${UI.more===g.id}">More</button>
      </div>
      ${UI.more===g.id?`<div class="actions">
        ${g.saved>0.004?`<button class="btn small ghost" data-act="moveFrom" data-id="${g.id}">Move money</button>`:''}
        <button class="btn small ghost" data-act="addSub" data-id="${g.id}">Add a sub-goal</button>
        ${k.status==='behind'||(k.status!=='funded'&&past)?`<button class="btn small ghost" data-act="push" data-id="${g.id}">Push date back</button>`:''}
        ${i>0?`<button class="btn small ghost" data-act="up" data-id="${g.id}">Raise priority</button>`:''}
        ${pinBtn('goal:'+g.id,g.name)}
        <button class="btn small ghost" data-act="editGoal" data-id="${g.id}">🔒 Edit</button>
      </div>`:''}`;
    const efSync=g.emergency?(()=>{const t=Math.max(essentials().target,Math.ceil(g.saved));return t>0&&Math.abs(t-g.target)>Math.max(50,g.target*.05)?`<p class="sub" style="font-size:13px;margin:4px 0 0">Your essentials changed in Settings. 3 months is now ${money(t)}. <button class="linkbtn" data-act="efSync" data-id="${g.id}">Update target</button></p>`:''})():'';
    const planWarn=efSync+(pl&&pl.funded<pl.need?`<p class="warnline">Priority #${i+1}: this month's plan only covers ${money(pl.funded)} of it. ${tip('prioritywarn')}</p>`:'');
    if(isParent(g)){
      const fp=k.fp,ks=kids(g).slice().sort((a,b)=>(a.done-b.done)||a.date.localeCompare(b.date));const nxt=liveKids(g).slice().sort((a,b)=>a.date.localeCompare(b.date))[0];
      return `<div class="goal parent">
        <div class="gtop"><h3>${esc(g.name)}</h3>${statusPill(k,g)}</div>
        ${famBar(g,fp)}
        <div class="gstats">${k.status==='funded'?`<p class="okline">Everything is covered.</p>`:`<div class="rorow"><span>Save each month ${tip('parentpace:'+g.id)}</span><b class="num">${money(k.perMonth)}</b></div><div class="rorow"><span>Finish by</span><b class="num">${due}</b></div>`}</div>
        ${k.nextShort?`<p class="warnline">${esc(k.nextShort.k.name)} (${shortD(k.nextShort.k.date)}) needs ${money(k.nextShort.gap)} more than the fund has <span style="white-space:nowrap">right now. ${tip('kidshort')}</span></p>`:nxt?`<p class="okline">Next payment, ${esc(nxt.name)}, is covered.</p>`:fp.paid>0?`<p class="okline">All sub-goals are paid. Mark it complete when you're done.</p>`:''}
        ${planWarn}
        <div class="fundbox"><div class="rorow"><span>Fund ${tip('fund')}</span><b class="num">${money(g.saved)}</b></div><p class="sub" style="font-size:13px;margin:0">In ${esc(aName(g.acct))}. Saved for this goal but not in a specific payment yet.</p></div>
        ${panels(g)||actions}
        <div class="kids"><p class="lbl" style="margin:0 0 4px">Payments (sub-goals) ${tip('subgoal')}</p>${ks.map(c=>childRow(c,g)).join('')}</div>
      </div>`;
    }
    const p=Math.min(100,g.saved/g.target*100);
    return `<div class="goal">
      <div class="gtop"><h3>${esc(g.name)}</h3>${statusPill(k,g)}</div>
      <p class="gamt"><strong class="num">${money(g.saved)}</strong> of ${money(g.target)} saved</p>
      <p class="sub" style="font-size:13px;margin:0 0 4px">Kept in ${esc(aName(g.acct))} ${tip('keptin')}</p>
      <div class="gbar"><div class="bar"><i style="width:${p}%"></i></div>${expMark(g,k)}</div>
      <p class="need">${k.status==='funded'?'Ready to buy.':past?`The buy-by date (${due}) has passed. ${money(k.remaining)} to go. Push the date back or add money.`:`Set aside <b class="num">${money(k.perMonth)}/month</b> to have it by ${due}. ${tip('pace:'+g.id)}`}</p>
      ${planWarn}
      ${panels(g)||actions}
    </div>`};
  const ef=S.goals.find(g=>g.emergency&&!g.done),E=essentials();
  const efCard=!ef&&!S.efDismiss&&E.month>0?`<div class="panel efcard"><b>Start an emergency fund ${tip('emergency')}</b>
    <p class="sub" style="font-size:14px;margin:4px 0 8px">A cushion so a surprise bill doesn’t come out of grad school or your spending money.</p>
    <div class="rorow"><span>Essential bills (fixed costs)</span><b class="num">${money(E.fx)}/mo</b></div>
    ${E.cs?`<div class="rorow"><span>Need categories</span><b class="num">${money(E.cs)}/mo</b></div>`:''}
    <div class="rorow"><span>× 3 months</span><b class="num">${money(E.target)}</b></div>
    <label class="field" style="margin-top:8px"><span>Keep it in</span><select id="efAcct">${acctOpts(routeAcct(S.plan.extraTo)||firstSavings())}</select></label>
    <div class="actions"><button class="btn small" data-act="efMake">Create at top priority</button><button class="btn small ghost" data-act="efNo">Not now</button></div></div>`:'';
  return `<h1>Goals</h1><p class="sub">In priority order. When income is tight, the plan funds the top goal first. ${tip('goals')}</p>${efCard}
  <div style="margin-top:18px">${tops.length?tops.map(card).join(''):`<div class="panel emptycard"><b>Goals hold money for something specific.</b><p class="sub">A trip, a camera, a semester of tuition. Pick a target and a date, and the app works out how much to set aside each month. Start with one below.</p></div>`}</div>
  <h2>New goal</h2>
  <div class="panel" style="padding:10px 16px 16px">
    <label class="field"><span>What are you saving for?</span><input type="text" id="gName" placeholder="e.g. New laptop"></label>
    <div class="two">
      <label class="field"><span>Amount</span><input type="number" inputmode="decimal" id="gAmt" placeholder="1200"></label>
      <label class="field"><span>Buy by ${tip('buyby')}</span><input type="date" id="gDate"></label>
    </div>
    <label class="field"><span>Kept in ${tip('keptin')}</span><select id="gAcct">${acctOpts(firstSavings())}</select></label>
    <p class="sub" style="font-size:13px;margin:0 0 10px">Paying for something in parts, like tuition? Create the overall goal here, then use More → Add a sub-goal for each payment.</p>
    <button class="btn full" id="gCreate">Create goal</button>
  </div>
  ${done.length?`<h2>Completed and archived</h2><div class="panel">${done.map(g=>{const fp=famProgress(g);const many=kids(g).length>0;
    return `<div class="row"><div class="rowtop"><b>${esc(g.name)}</b><span class="num">${g.archived?'Archived '+(g.archivedOn?new Date(g.archivedOn+'T00:00').toLocaleDateString('en-US',{month:'short',year:'numeric'}):''):many?money(fp.paid)+' paid':money(g.paid||g.target,true)}</span></div>
    ${many&&!g.archived?`<div class="sub" style="font-size:13px">${fp.payments} payment${fp.payments===1?'':'s'}, ${new Date(g.created+'T00:00').toLocaleDateString('en-US',{month:'short',year:'numeric'})} to ${new Date((g.completedOn||todayISO)+'T00:00').toLocaleDateString('en-US',{month:'short',year:'numeric'})}</div>`:!g.archived&&g.boughtOn?`<div class="sub" style="font-size:13px">Bought ${new Date(g.boughtOn+'T00:00').toLocaleDateString('en-US',{month:'short',year:'numeric'})}</div>`:g.archived&&fp.paid>0?`<div class="sub" style="font-size:13px">${money(fp.paid)} paid before archiving</div>`:''}</div>`}).join('')}</div>`:''}`;
};
function expMark(g,k){
  if(!k||k.expected==null||k.status==='funded'||!g.target)return '';
  if(new Date(g.date+'T00:00')<now)return '';
  const x=Math.max(0,Math.min(100,k.expected/g.target*100));if(x<=0.5)return '';
    return `<span class="gmark" style="left:${x}%" aria-hidden="true"></span><div class="gmlbl">${x<55?`<span style="left:calc(${x}% - 6px)">▲ Today’s target: ${money(k.expected)}</span>`:`<span style="right:calc(${100-x}% - 6px)">Today’s target: ${money(k.expected)} ▲</span>`}</div>`;
}
function famBar(g,fp){
  const k=goalInfo(g);
  return `<div class="gbar"><div class="fbar" role="img" aria-label="${Math.round(fp.pctPaid)}% paid, ${Math.round(fp.pctCov)}% covered">
      <i class="fpaid" style="width:${fp.pctPaid}%"></i><i class="faside" style="width:${Math.max(0,fp.pctCov-fp.pctPaid)}%"></i></div>${expMark(g,k)}</div>
    <div class="gstats">
      <div class="rorow"><span>Total cost ${tip('totalcost')}</span><b class="num">${money(g.target)}</b></div>
      <div class="rorow"><span><span class="gsw gsw1"></span>Paid ${tip('paid')}</span><b class="num">${money(fp.paid)} <small>${Math.round(fp.pctPaid)}%</small></b></div>
      <div class="rorow"><span><span class="gsw gsw2"></span>Saved, not paid yet ${tip('covered:'+g.id)}</span><b class="num">${money(fp.aside)}</b></div>
      <div class="rorow"><span><span class="gsw gsw3"></span>Still to save</span><b class="num">${money(fp.remaining)}</b></div>
    </div>`;
}

function chart(){
  const pts=S.snapshots.map(s=>({m:s.m,net:netOf(s.bal)}));if(pts.length<2)return '<div class="empty">Close a couple of months to see a trend.</div>';
  const W=320,H=120,P=24,vals=pts.map(p=>p.net),mn=Math.min(...vals)*0.97,mx=Math.max(...vals)*1.02;
  const x=i=>P+i*(W-2*P)/(pts.length-1),y=v=>H-P-(v-mn)/(mx-mn)*(H-2*P);
  const d=pts.map((p,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(p.net).toFixed(1)).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Net worth by month">
    <path d="${d}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.net)}" r="4" fill="var(--accent)"/><text x="${x(i)}" y="${H-4}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="Instrument Sans, sans-serif">${p.m}</text>`).join('')}
  </svg>`;
}
V.close=()=>{
  const T=closeTarget(),open=openMonths();
  if(!T)return `<button class="btn small ghost" data-go="activity" style="margin-bottom:8px">Back to activity</button><h1>All caught up</h1><p class="sub">Every finished month is closed. The next one opens for closing on the 1st.</p>`;
  const pname=monthName(mDate(T),{month:'long',year:'numeric'});
  const monthly=S.categories.filter(c=>c.type==='monthly'&&(!c.archived||spent(c.id,T)>0));
  const unpaid=liveFixed().filter(f=>fixedOwe(f,T)>0.004);
  const older=T<mkey(new Date(now.getFullYear(),now.getMonth()-1,1));
  return `<button class="btn small ghost" data-go="activity" style="margin-bottom:8px">Back to activity</button>
  <h1>Close ${esc(pname)} ${tip('closewhy')}</h1>
  <p class="sub">${open.length>1?`${open.length} months are waiting. Months close in order, so this is the oldest. `:''}Review the month, then confirm balances against your bank.</p>
  <p class="step">Step 1: Review</p>
  <div class="panel">${monthly.map(c=>{const s=spent(c.id,T),b=budgetOf(c,T);return `<div class="row"><div class="rowtop"><b>${esc(c.name)}</b><span class="num">${money(s)} of ${money(b)}</span></div><div class="bar"><i class="${pctClass(b?s/b*100:0)}" style="width:${Math.min(100,b?s/b*100:0)}%"></i></div>${s>b+0.004?`<div class="actions" style="margin-top:6px"><button class="btn small ghost" data-act="cover" data-cat="${c.id}" data-m="${T}">Cover ${money(s-b,true)} over</button></div>`:''}</div>`}).join('')}
  <div class="row"><div class="rowtop"><b>Income</b><span class="num">${money(incomeIn(T))} of ${money(S.plan.income)} expected</span></div></div>
  <div class="row"><div class="rowtop"><b>Fixed costs</b><span class="num">${unpaid.length?unpaid.length+' not marked paid':'All paid'}</span></div>${unpaid.length?`<p class="sub" style="font-size:13px;margin:4px 0 6px">Mark any you actually paid so balances come out right.</p>${unpaid.map(f=>`<div class="rowtop" style="align-items:center;padding:4px 0"><span style="color:var(--ink)">${esc(f.name)}, ${money(fixedOwe(f,T),true)}</span><button class="btn small ghost" data-payold="${f.id}" data-m="${T}">Mark paid</button></div>`).join('')}`:''}</div></div>
  <p class="step">Step 2: Confirm balances</p>
  <p class="sub" style="font-size:14px">${older?`Balances as of the end of ${esc(monthName(mDate(T)))}, worked out from your entries. Check them against that month\u2019s statements.`:'Calculated from your entries.'} Change any that don't match, and the difference is recorded as a correction.</p>
  <div class="panel" style="padding:6px 16px 12px;margin-top:10px">${liveAccts().filter(a=>existedBy(a,T)).map(a=>`<label class="field"><span>${esc(a.name)}${a.type==='debt'?' (owed)':''}</span><input type="number" inputmode="decimal" data-bal="${a.id}" data-calc="${balAt(a,T)}" value="${balAt(a,T)}"></label>`).join('')}</div>
  ${(S.assets||[]).some(x=>!x.archived)?`<p class="lbl" style="margin-top:12px">Other assets (estimated value)</p><div class="panel" style="padding:6px 16px 12px;margin-top:6px">${S.assets.filter(x=>!x.archived).map(x=>`<label class="field"><span>${esc(x.name)}</span><input type="number" inputmode="decimal" data-asset="${x.id}" value="${x.value||0}"></label>`).join('')}</div>`:''}
  <p class="step">Step 3: Lock it in</p>
  <button class="btn full" data-act="closeMonth" data-m="${T}">Close ${esc(monthName(mDate(T)))}</button>`;
};

const F={year:thisM.slice(0,4),month:thisM,type:'all',cat:'all',acct:'all',q:''};
function setMonth(m){F.month=m;F.year=m==='all'?'all':m.slice(0,4)}
const TXTYPES={expense:'Purchases',fixed:'Fixed costs',income:'Income',transfer:'Transfers',assign:'Goal set-asides',goalbuy:'Goal purchases',adjust:'Balance corrections',interest:'Interest',gmove:'Goal moves',unassign:'Goal releases'};
function filteredTx(ignoreMonth){
  const q=F.q.trim().toLowerCase();
  return S.tx.filter(t=>(F.year==='all'||t.date.slice(0,4)===F.year)&&(ignoreMonth||F.month==='all'||inMonth(t,F.month))&&(F.type==='all'||t.kind===F.type)&&(F.cat==='all'||t.cat===F.cat)
    &&(F.acct==='all'||t.acct===F.acct||t.from===F.acct||t.to===F.acct||t.acctFrom===F.acct||t.acctTo===F.acct)
    &&(!q||(t.vendor||'').toLowerCase().includes(q)||(t.cat&&cat(t.cat)&&cat(t.cat).name.toLowerCase().includes(q))))
    .sort((a,b)=>b.date.localeCompare(a.date)||(b.id>a.id?1:-1));
}
const allMonths=()=>[...new Set(S.tx.map(t=>t.date.slice(0,7)).concat([thisM]))].sort().reverse();
const sumOf=(list,fn)=>list.filter(fn).reduce((a,t)=>a+t.amount,0);
/* year cards with a row per month; tap a month to open it */
function yearOverview(list){
  const years=[...new Set(list.map(t=>t.date.slice(0,4)).concat(F.year==='all'?[thisM.slice(0,4)]:[F.year]))].sort().reverse();
  return years.map(y=>{const yl=list.filter(t=>t.date.startsWith(y));
    const ms=[...new Set(yl.map(t=>t.date.slice(0,7)).concat(y===thisM.slice(0,4)?[thisM]:[]))].sort().reverse();
    return `<details class="yearcard" ${years.length===1||y===thisM.slice(0,4)?'open':''}><summary><b class="num">${y}</b><span class="num">Spent ${money(sumOf(yl,isSpend))}, income ${money(sumOf(yl,t=>t.kind==='income'))}</span></summary>
      ${ms.length?ms.map(m=>{const ml=yl.filter(t=>inMonth(t,m)),pl=sumOf(ml,isPlanned);
        return `<button class="mrow" data-pickmonth="${m}"><span class="mname">${monthName(mDate(m))}${m===thisM?' (so far)':''}${S.closed.includes(m)?' 🔒':''}</span>
          <span class="num mfig">−${money(sumOf(ml,isSpend))}<small>+${money(sumOf(ml,t=>t.kind==='income'))}${pl?`, ${money(pl)} planned`:''}</small></span><span class="chev">›</span></button>`}).join('')
      :'<div class="empty">Nothing logged this year.</div>'}</details>`}).join('');
}
function activityList(){
  const list=filteredTx();
  const out=sumOf(list,isSpend),inc=sumOf(list,t=>t.kind==='income'),pl=sumOf(list,isPlanned);
  const scope=F.month!=='all'?monthName(mDate(F.month),{month:'long',year:'numeric'}):F.year!=='all'?F.year:'All time';
  let html=`<div class="crumbs">${F.month!=='all'?`<button class="btn small ghost" data-pickyear="${F.month.slice(0,4)}">‹ ${F.month.slice(0,4)}</button>`:F.year!=='all'?`<button class="btn small ghost" data-pickyear="all">‹ All years</button>`:''}<b>${esc(scope)}</b></div>
    <div class="ovgrid" style="margin-bottom:12px"><div class="ov"><div class="sub">Spent</div><div class="ovv num">${money(out,true)}</div><span class="sub" style="font-size:12px">${list.filter(t=>t.kind==='expense').length} purchases${pl?`, plus ${money(pl)} planned from goals`:''}</span></div>
    <div class="ov"><div class="sub">Income</div><div class="ovv num">${money(inc,true)}</div><span class="sub" style="font-size:12px">${list.length} entries shown</span></div></div>`;
  if(F.month==='all')html+=`<p class="lbl" style="margin:4px 0 6px">By month</p>${yearOverview(filteredTx(true))}<p class="lbl" style="margin:16px 0 6px">Entries</p>`;
  if(!list.length)return html+'<div class="panel"><div class="empty">Nothing matches these filters. Try a different month or clear the search.</div></div>';
  let cy='',cm='';html+='<div class="panel">';
  list.slice(0,150).forEach(t=>{const y=t.date.slice(0,4),m=t.date.slice(0,7);
    if(F.month==='all'&&F.year==='all'&&y!==cy){cy=y;cm='';html+=`<p class="yhead num">${y}</p>`}
    if(F.month==='all'&&m!==cm){cm=m;html+=`<p class="lbl" style="margin:14px 0 2px">${monthName(mDate(m))}${S.closed.includes(m)?' 🔒':''}</p>`}
    html+=txLine(t)});
  return html+'</div>'+(list.length>150?'<p class="sub" style="font-size:13px">Showing the latest 150. Pick a year or month to see older entries.</p>':'');
}
V.activity=()=>{
  const months=allMonths(),years=[...new Set(months.map(m=>m.slice(0,4)))];
  if(F.year!=='all'&&!years.includes(F.year))years.unshift(F.year);
  const inYear=months.filter(m=>F.year==='all'||m.startsWith(F.year));
  const sel=(k,opts)=>`<select data-filter="${k}" aria-label="${k}">${opts.map(([v,l])=>`<option value="${v}" ${F[k]===v?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
  const snapYears=[...new Set(S.snapshots.map(s=>(s.key||'').slice(0,4)).filter(Boolean))].sort().reverse();
  const histCard=s=>{
    const tx=S.tx.filter(t=>s.key&&inMonth(t,s.key));
    const inc=tx.filter(t=>t.kind==='income').reduce((a,t)=>a+t.amount,0);
    const out=tx.filter(t=>t.kind==='expense').reduce((a,t)=>a+t.amount,0);
    const fx=tx.filter(t=>t.kind==='fixed').reduce((a,t)=>a+t.amount,0);
    const buds=s.budgets||{};
    const cats=S.categories.filter(c=>c.type==='monthly'&&(buds[c.id]!=null||spent(c.id,s.key)>0));
    return `<details class="hist"><summary><b>${monthName(mDate(s.key))}</b><span class="num">${money(netOf(s.bal))} net worth</span></summary>
      ${tx.length?`<div class="cols num" style="margin:4px 0 8px"><span>Income ${money(inc)}</span><span>Fixed ${money(fx)}</span><span>Spent ${money(out)}</span></div>
      ${cats.map(c=>{const sp=spent(c.id,s.key),b=buds[c.id]!=null?buds[c.id]:c.budget;return `<div class="hrow"><span>${esc(c.name)}</span><span class="num ${sp>b?'overtxt':''}">${money(sp)} of ${money(b)}</span></div>`}).join('')}
      <button class="btn small ghost" data-viewmonth="${s.key}" style="margin-top:8px">See entries</button>`
      :`<p class="sub" style="font-size:14px">${s.corr?'No entries were logged this month.':'Balances only. Spending wasn’t tracked in the app yet.'}</p>`}
      <div class="hrow" style="margin-top:6px"><span>Assets</span><span class="num">${money(sumType(['checking','cash','savings','retirement'],s.bal))}</span></div>
      <div class="hrow"><span>Debt</span><span class="num">${money(sumType(['debt'],s.bal))}</span></div>
      ${S.closed.includes(s.key)?`<button class="btn small ghost" data-act="reopen" data-m="${s.key}" style="margin-top:8px">Reopen ${latestClosed()===s.key?'month':'from here'}</button>`:''}
    </details>`};
  return `<h1>Activity</h1>
  ${closeBanner()}
  <div class="filters">
    <input type="search" id="fq" placeholder="Search vendor or category" value="${esc(F.q)}" aria-label="Search">
    <div class="two">
      ${sel('year',[['all','All years']].concat(years.map(y=>[y,y])))}
      ${sel('month',[['all',F.year==='all'?'All months':'All of '+F.year]].concat(inYear.map(m=>[m,F.year==='all'?monthName(mDate(m),{month:'long',year:'numeric'}):monthName(mDate(m))])))}
      ${sel('type',[['all','All types']].concat(Object.entries(TXTYPES)))}
      ${sel('cat',[['all','All categories']].concat(S.categories.map(c=>[c.id,c.name+(c.archived?' (archived)':'')])))}
    </div>
    ${sel('acct',[['all','All accounts']].concat(S.accounts.map(a=>[a.id,a.name+(a.archived?' (archived)':'')])))}
  </div>
  <div id="actList">${activityList()}</div>
  <h2>Past months ${tip('locked')}</h2>
  <p class="sub" style="font-size:14px;margin-bottom:10px">Closed months are read-only. Their entries, budgets, and balances are kept as they were.</p>
  ${closeTarget()?`<button class="btn ghost full" data-go="close" style="margin-bottom:10px">Close ${monthName(mDate(closeTarget()))}</button>`:''}
  ${snapYears.length?snapYears.map((y,i)=>`<details class="yearcard" ${i===0?'open':''}><summary><b class="num">${y}</b><span>${S.snapshots.filter(s=>(s.key||'').startsWith(y)).length} closed</span></summary>
    <div class="panel" style="padding:0 16px">${S.snapshots.filter(s=>(s.key||'').startsWith(y)).slice().reverse().map(histCard).join('')}</div></details>`).join(''):'<div class="panel"><div class="empty">No closed months yet. After a month ends, close it to record your balances.</div></div>'}
  <button class="loglink" data-go="log"><span><b>Change log</b><small>${S.log.length} change${S.log.length===1?'':'s'} recorded. Look things up there when you need to.</small></span><span class="chev">›</span></button>`;
};

V.log=()=>{
  const q=LG.q.trim().toLowerCase(),list=S.log.map(l=>Object.assign({k:l.k||logKind(l.text)},l)).filter(l=>(LG.k==='all'||l.k===LG.k)&&(!q||l.text.toLowerCase().includes(q))).reverse();
  const months=[...new Set(list.map(l=>{const d=new Date(l.ts);return d.getFullYear()+'-'+pad2(d.getMonth()+1)}))];
  const counts=Object.keys(LOGK).reduce((o,k)=>(o[k]=S.log.filter(l=>(l.k||logKind(l.text))===k).length,o),{});
  return `<button class="btn small ghost" data-go="activity" style="margin-bottom:8px">Back to Activity</button><h1>Change log</h1>
  <p class="sub">A record of every change you’ve made, kept for when you need to look something up. Nothing here needs your attention.</p>
  <input type="search" id="logq" placeholder="Search changes" value="${esc(LG.q)}" style="margin-top:14px" aria-label="Search changes">
  <div class="chips" role="group" aria-label="Filter changes"><button class="chip" data-logk="all" aria-pressed="${LG.k==='all'}">All</button>${Object.entries(LOGK).filter(([k])=>counts[k]).map(([k,l])=>`<button class="chip" data-logk="${k}" aria-pressed="${LG.k===k}">${l} <small>${counts[k]}</small></button>`).join('')}</div>
  <div id="logList">${months.length?months.map((m,i)=>{const items=list.filter(l=>{const d=new Date(l.ts);return d.getFullYear()+'-'+pad2(d.getMonth()+1)===m}),show=LG.all[m]?items:items.slice(0,25);
    return `<details class="yearcard" ${i===0||q?'open':''}><summary><b>${monthName(mDate(m),{month:'long',year:'numeric'})}</b><span>${items.length} change${items.length===1?'':'s'}</span></summary><div class="panel" style="padding:2px 16px">
      ${show.map(l=>`<div class="logrow"><span class="ltag">${LOGK[l.k]||'Settings'}</span><div>${esc(l.text)}<small>${new Date(l.ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</small></div></div>`).join('')}
      ${items.length>show.length?`<button class="btn small ghost" data-logall="${m}" style="margin:8px 0">Show all ${items.length}</button>`:''}</div></details>`}).join(''):`<div class="panel"><div class="empty">${S.log.length?'No changes match.':'No changes yet.'}</div></div>`}</div>`;
};
const clone=o=>JSON.parse(JSON.stringify(o));
const SECS={framework:'Plan framework',income:'Income and defaults',categories:'Categories',fixed:'Fixed costs',accounts:'Accounts',assets:'Other assets'};
function draftFor(sec){
  if(sec==='framework')return {framework:S.plan.framework,custom:clone(S.plan.custom)};
  if(sec==='income')return Object.assign(clone(S.plan.inc),{deposit:S.plan.deposit,payDefault:S.plan.payDefault,spendTo:routeAcct(S.plan.spendTo)||'',extraTo:routeAcct(S.plan.extraTo)||''});
  return clone(S[sec]||[]);
}
function secHead(sec,note){
  if(UI.sec===sec)return `<div class="editbar"><b>Editing ${SECS[sec].toLowerCase()}</b><span>${note||'Nothing saves until you review and confirm.'}</span></div>`;
  return `<div class="lockrow"><p class="sub">🔒 Locked</p><button class="btn small ghost" data-act="editSec" data-sec="${sec}" ${UI.sec?'disabled':''}>Edit</button></div>`;
}
const secFoot=sec=>UI.sec===sec?`<div class="actions" style="margin-top:12px"><button class="btn ghost" data-act="cancel">Cancel</button><button class="btn" data-act="reviewSec" data-sec="${sec}" style="flex:1">Review changes</button></div>`:'';
const roleOpts=(sel,fw,custom)=>ROLES.map(r=>`<option value="${r}" ${r===sel?'selected':''}>${esc(roleName(r,fw,custom))}</option>`).join('');
const acctOptsAll=(sel,list)=>(list||liveAccts()).map(a=>`<option value="${a.id}" ${a.id===sel?'selected':''}>${esc(a.name)}</option>`).join('');
const inp=(i,f,v,type,ph,extra)=>`<input type="${type||'text'}" ${type==='number'?'inputmode="decimal"':''} data-d="${f}" data-i="${i}" value="${esc(v==null?'':v)}" placeholder="${ph||''}" ${extra||''}>`;

const pctNet=v=>S.plan.income?Math.round(v/S.plan.income*1000)/10+'%':'–';
function incomeTable(){
  const I=S.plan.inc,g=I.grossAnnual||0,taxes=g?g/12-(I.pretax||0)-(I.net||0):null;
  const r=(l,m,b)=>`<tr${b?' class="tot"':''}><td>${l}</td><td>${m==null?'–':money(m)}</td><td>${m==null?'–':money(m*12)}</td></tr>`;
  return `<div style="overflow-x:auto"><table class="bs num cfgtab"><thead><tr><th></th><th>Monthly</th><th>Annual</th></tr></thead><tbody>
    ${r('Gross salary',g?g/12:null)}${r('Pre-tax retirement',I.pretax||0)}${taxes!=null?r('Taxes and deductions (est.)',Math.max(0,taxes)):''}
    ${r('Net take-home pay',I.net||0)}${r('Extra income',I.extra||0)}${r('Net total income',S.plan.income,true)}</tbody></table></div>
    <p class="sub" style="font-size:13px;margin:8px 0">Your plan is built on net total income. Pre-tax retirement counts toward your investments target.</p>
    <div class="row"><div class="rowtop"><b>Paychecks go to</b><span>${esc(aName(S.plan.deposit))}</span></div></div><div class="row"><div class="rowtop"><b>Purchases default to</b><span>${esc(aName(S.plan.payDefault))}</span></div></div>
    <div class="row"><div class="rowtop"><b>Spending money goes to</b><span>${routeAcct(S.plan.spendTo)?esc(aName(S.plan.spendTo)):'Stays where paychecks land'}</span></div>${S.plan.spendTo&&!routeAcct(S.plan.spendTo)?'<div class="sub" style="font-size:13px">That account was removed, so spending money stays put until you pick another.</div>':''}</div>
    <div class="row"><div class="rowtop"><b>Extra goes to</b><span>${routeAcct(S.plan.extraTo)?esc(aName(S.plan.extraTo)):'Stays where paychecks land'}</span></div>${S.plan.extraTo&&!routeAcct(S.plan.extraTo)?'<div class="sub" style="font-size:13px">That account was removed, so extra stays put until you pick another.</div>':''}</div>`;
}
/* ---------- shared editors (Settings and setup) ---------- */
const isNewRow=(sec,x)=>!(S[sec]||[]).some(y=>y.id===x.id);
const poolAccts=()=>UI.sd&&UI.sd.accounts?UI.sd.accounts.filter(a=>!a.archived&&String(a.name||'').trim()):liveAccts();
const poolPay=()=>poolAccts().filter(a=>a.pay);
  /* categories */
function catEdit(D){const live=D.map((c,i)=>({c,i})).filter(x=>!x.c.archived),arch=D.map((c,i)=>({c,i})).filter(x=>x.c.archived);
  return live.map(({c,i},n)=>`<div class="cfgitem">
    <label class="field"><span>Name</span>${inp(i,'name',c.name)}</label>
    <div class="three"><label class="field"><span>Budget</span>${inp(i,'budget',c.budget,'number')}</label>
    <label class="field"><span>Per</span><select data-d="type" data-i="${i}"><option value="monthly" ${c.type==='monthly'?'selected':''}>Month</option><option value="annual" ${c.type==='annual'?'selected':''}>Year</option></select></label>
    <label class="field"><span>Group</span><select data-d="role" data-i="${i}">${roleOpts(c.role||'want')}</select></label></div>
    <label class="field"><span>Usually paid from ${tip('catacct')}</span><select data-d="acct" data-i="${i}"><option value="">Any account</option>${poolPay().map(a=>`<option value="${a.id}" ${a.id===c.acct?'selected':''}>${esc(a.name)}</option>`).join('')}</select></label>
    ${c.type==='monthly'?`<label class="checkrow"><input type="checkbox" data-d="roll" data-i="${i}" ${c.roll?'checked':''}> Roll leftover into next month ${tip('roll')}</label>`:''}
    <div class="actions" style="margin-top:4px">${n>0?`<button class="btn small ghost" data-act="dUp" data-i="${i}">Move up</button>`:''}${isNewRow('categories',c)?`<button class="btn small ghost" data-act="dDrop" data-i="${i}" style="margin-left:auto">Remove</button>`:`<button class="btn small ghost" data-act="dArch" data-i="${i}" style="margin-left:auto">Archive</button>`}</div>
  </div>`).join('')+`<button class="btn ghost full" data-act="dAdd" data-sec="categories" style="margin-top:10px">Add a category</button>`
  +(arch.length?`<p class="lbl" style="margin-top:14px">Archived</p>`+arch.map(({c,i})=>`<div class="row"><div class="rowtop" style="align-items:center"><span style="color:var(--ink)">${esc(c.name)}</span><button class="btn small ghost" data-act="dRestore" data-i="${i}">Restore</button></div></div>`).join(''):'')};
const catView=()=>buckets().map(b=>{const cs=liveCats().filter(c=>b.roles.includes(c.role||'want'));return cs.length?`<p class="lbl" style="margin:12px 0 0">${esc(b.name)}</p>`+cs.map(c=>{const m=c.type==='annual'?c.budget/12:c.budget;return `<div class="row"><div class="rowtop"><b>${esc(c.name)}</b><span class="num">${c.type==='annual'?money(c.budget)+'/yr ('+money(m)+'/mo)':money(c.budget)+'/mo'}, ${pctNet(m)}</span></div>${c.roll||c.acct?`<div class="sub" style="font-size:13px">${[c.acct?'Paid from '+esc(aName(c.acct)):'',c.roll?'Leftover rolls into next month':''].filter(Boolean).join('. ')}</div>`:''}</div>`}).join(''):''}).join('')
  +(()=>{const mo=liveCats().filter(c=>c.type==='monthly').reduce((a,c)=>a+c.budget,0),an=liveCats().filter(c=>c.type==='annual').reduce((a,c)=>a+c.budget,0);return `<div class="row"><div class="rowtop"><b>Monthly budgets</b><span class="num">${money(mo)}/mo, ${pctNet(mo)}</span></div></div><div class="row"><div class="rowtop"><b>Annual budgets</b><span class="num">${money(an)}/yr (${money(an/12)}/mo), ${pctNet(an/12)}</span></div></div>`})()
  +(S.categories.some(c=>c.archived)?`<p class="sub" style="font-size:13px;margin:10px 0 4px">${S.categories.filter(c=>c.archived).length} archived. Their history stays in Activity.</p>`:'');
  +(S.categories.some(c=>c.archived)?`<p class="sub" style="font-size:13px;margin:10px 0 4px">${S.categories.filter(c=>c.archived).length} archived. Their history stays in Activity.</p>`:'');
/* fixed */
function fixEdit(D){const live=D.map((f,i)=>({f,i})).filter(x=>!x.f.archived),arch=D.map((f,i)=>({f,i})).filter(x=>x.f.archived);
  return live.map(({f,i})=>`<div class="cfgitem">
    <label class="field"><span>Name</span>${inp(i,'name',f.name)}</label>
    <div class="three"><label class="field"><span>Charged as</span><select data-d="mode" data-i="${i}" data-rr="1"><option value="amt" ${f.pct==null?'selected':''}>Amount</option><option value="pct" ${f.pct!=null?'selected':''}>% of income</option></select></label>
    <label class="field"><span>${f.pct!=null?'Percent':'Amount'}</span>${f.pct!=null?inp(i,'pct',f.pct,'number'):inp(i,'amount',f.amount,'number')}</label>
    <label class="field"><span>Due day</span>${inp(i,'day',f.day,'number','None','min="1" max="31"')}</label></div>
    ${f.pct!=null?'':`<div class="${(f.freq||'monthly')==='months'?'':'two'}"><label class="field"><span>How often ${tip('freq')}</span><select data-d="freq" data-i="${i}" data-rr="1">${[['monthly','Every month'],['quarterly','Every 3 months'],['yearly','Once a year'],['months','Specific months']].map(([v,l])=>`<option value="${v}" ${(f.freq||'monthly')===v?'selected':''}>${l}</option>`).join('')}</select></label>
    ${(f.freq||'monthly')==='months'?'<span></span>':`<label class="field"><span>${(f.freq||'monthly')==='monthly'?'Starts (optional)':'First due'}</span><input type="month" data-d="begins" data-i="${i}" value="${f.begins||((f.freq||'monthly')==='monthly'?'':thisM)}"></label>`}</div>
    ${(f.freq||'monthly')==='months'?`<div class="monthpick">${MON.map((n,k)=>`<label><input type="checkbox" data-dm="${k+1}" data-i="${i}" ${(f.months||[]).includes(k+1)?'checked':''}>${n}</label>`).join('')}</div>`:''}`}
    <label class="field"><span>Ends after (optional, for payment plans) ${tip('ends')}</span><input type="month" data-d="end" data-i="${i}" value="${f.end||''}"></label>
    <label class="field"><span>Goes to (for savings, investing, or a loan) ${tip('goesto')}</span><select data-d="to" data-i="${i}"><option value="">Nowhere, it's a bill</option>${poolAccts().filter(a=>a.id!==f.acct).map(a=>`<option value="${a.id}" ${a.id===f.to?'selected':''}>${esc(a.name)}</option>`).join('')}</select></label>
    <div class="two"><label class="field"><span>Paid from</span><select data-d="acct" data-i="${i}">${acctOptsAll(f.acct,poolPay().concat(poolAccts().filter(a=>a.id===f.acct&&!a.pay)))}</select></label>
    <label class="field"><span>Group</span><select data-d="role" data-i="${i}">${roleOpts(f.role||'need')}</select></label></div>
    <div class="actions" style="margin-top:4px">${isNewRow('fixed',f)?`<button class="btn small ghost" data-act="dDrop" data-i="${i}" style="margin-left:auto">Remove</button>`:`<button class="btn small ghost" data-act="dArch" data-i="${i}" style="margin-left:auto">Archive</button>`}</div>
  </div>`).join('')+`<button class="btn ghost full" data-act="dAdd" data-sec="fixed" style="margin-top:10px">Add a fixed cost</button>`
  +(arch.length?`<p class="lbl" style="margin-top:14px">Archived</p>`+arch.map(({f,i})=>`<div class="row"><div class="rowtop" style="align-items:center"><span style="color:var(--ink)">${esc(f.name)}</span><button class="btn small ghost" data-act="dRestore" data-i="${i}">Restore</button></div></div>`).join(''):'')};
const fixView=()=>liveFixed().map(f=>{const m=fixedPlan(f);return `<div class="row"><div class="rowtop"><b>${esc(f.name)}</b><span class="num">${ended(f)?'Ended':money(m)+'/mo, '+pctNet(m)}</span></div><div class="sub" style="font-size:13px">${f.pct!=null?f.pct+'% of income, ':esc(schedText(f))+(perYear(f)!==12?` (${money(f.amount)} each)`:'')+', '}${esc(roleName(f.role||'need'))}, from ${esc(aName(f.acct))}${f.to?' to '+esc(aName(f.to)):''}${f.day?', due the '+ordinal(f.day):''}</div></div>`}).join('')
  +(()=>{const t=liveFixed().reduce((a,f)=>a+fixedPlan(f),0);return `<div class="row"><div class="rowtop"><b>Total</b><span class="num"><b>${money(t)}/mo, ${pctNet(t)}</b></span></div></div>`})();
/* accounts */
function acctEdit(D){const live=D.map((a,i)=>({a,i})).filter(x=>!x.a.archived),arch=D.map((a,i)=>({a,i})).filter(x=>x.a.archived);
  return live.map(({a,i})=>{const isNew=!S.accounts.find(x=>x.id===a.id);const orig=S.accounts.find(x=>x.id===a.id);
    const canArch=orig&&Math.abs(orig.balance)<0.005&&!activeGoals().some(g=>g.acct===a.id)&&!liveFixed().some(f=>f.acct===a.id||f.to===a.id)&&S.plan.deposit!==a.id&&S.plan.payDefault!==a.id&&!(UI.sd&&UI.sd.income&&(UI.sd.income.deposit===a.id||UI.sd.income.payDefault===a.id));
    return `<div class="cfgitem">
    <div class="two"><label class="field"><span>Name</span>${inp(i,'name',a.name)}</label>
    <label class="field"><span>Type</span><select data-d="type" data-i="${i}" data-rr="1">${Object.entries(TYPES).filter(([k])=>isNew||!orig||(orig.type==='debt')===(k==='debt')).map(([k,l])=>`<option value="${k}" ${a.type===k?'selected':''}>${l}</option>`).join('')}</select></label></div>
    ${!isNew&&orig?`<p class="sub" style="font-size:12px;margin:0">${orig.type==='debt'?'A debt account can\u2019t become a regular account, since its balance means money owed.':'A regular account can\u2019t become a debt. Add a new debt account instead.'}</p>`:''}
    ${isNew?`<label class="field"><span>${a.type==='debt'?'Amount owed today':'Balance today'} ${tip('opened')}</span>${inp(i,'balance',a.balance,'number')}</label>`:''}
    <label class="field"><span>Bank or app ${tip('bank')}</span><input type="text" list="bankList" data-d="bank" data-i="${i}" value="${esc(a.bank||'')}" placeholder="e.g. Capital One"></label>
    <label class="checkrow"><input type="checkbox" data-d="pay" data-i="${i}" ${a.pay?'checked':''}> Use for purchases and bills</label>
    ${a.type==='debt'?`<div class="two"><label class="field"><span>APR %</span>${inp(i,'apr',a.apr,'number')}</label><label class="field"><span>Monthly payment</span>${inp(i,'min',a.min,'number')}</label></div>
    <div class="two"><label class="field"><span>Original amount ${tip('debtstart')}</span>${inp(i,'start',a.start,'number','Optional')}</label><label class="field"><span>Started on</span><input type="date" data-d="startDate" data-i="${i}" value="${a.startDate||''}"></label></div>
    <label class="checkrow"><input type="checkbox" data-d="accrue" data-i="${i}" ${a.accrue?'checked':''}> Add estimated interest when I make a payment ${tip('accrue')}</label>
    <label class="checkrow"><input type="checkbox" data-d="card" data-i="${i}" data-rr="1" ${a.card?'checked':''}> This is a credit card ${tip('card')}</label>
    ${a.card?`<div class="two"><label class="field"><span>Statement closes on day</span>${inp(i,'stmt',a.stmt,'number','e.g. 15','min="1" max="31"')}</label><label class="field"><span>Pay it from</span><select data-d="payFrom" data-i="${i}">${poolAccts().filter(x=>x.type!=='debt').map(x=>`<option value="${x.id}" ${x.id===(a.payFrom||S.plan.deposit)?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label></div>
    <label class="checkrow"><input type="checkbox" data-d="payFull" data-i="${i}" ${a.payFull?'checked':''}> I pay the full statement every month</label>`:''}`:''}
    ${isNew?`<div class="actions" style="margin-top:4px"><button class="btn small ghost" data-act="dDrop" data-i="${i}" style="margin-left:auto">Remove</button></div>`:`<div class="actions" style="margin-top:4px">${canArch?`<button class="btn small ghost" data-act="dArch" data-i="${i}" style="margin-left:auto">Archive</button>`:`<span class="sub" style="font-size:12px;margin-left:auto">To archive, bring the balance to $0 and move any goals, fixed costs, or defaults off it.</span>`}</div>`}
  </div>`}).join('')+`<datalist id="bankList">${[...new Set(D.concat(S.accounts).map(a=>a.bank).filter(Boolean))].map(b=>`<option value="${esc(b)}">`).join('')}</datalist><button class="btn ghost full" data-act="dAdd" data-sec="accounts" style="margin-top:10px">Add an account</button>`
  +(arch.length?`<p class="lbl" style="margin-top:14px">Archived</p>`+arch.map(({a,i})=>`<div class="row"><div class="rowtop" style="align-items:center"><span style="color:var(--ink)">${esc(a.name)}</span><button class="btn small ghost" data-act="dRestore" data-i="${i}">Restore</button></div></div>`).join(''):'')};
const acctView=()=>liveAccts().map(a=>`<div class="row"><div class="rowtop"><b>${esc(a.name)}</b><span>${a.bank?esc(a.bank)+', ':''}${TYPES[a.type]}${a.type==='debt'?`, ${a.apr||0}% APR`:''}</span></div>${a.pay||a.card?`<div class="sub" style="font-size:13px">${[a.pay?'Used for purchases and bills':'',a.card?`Credit card, statement closes the ${ordinal(a.stmt||1)}${a.payFull?', paid in full from '+esc(aName(routeAcct(a.payFrom)||S.plan.deposit)):''}`:''].filter(Boolean).join('. ')}</div>`:''}</div>`).join('');


V.config=()=>{
  const E=k=>UI.sec===k, D=UI.draft;
  const T=(k,t,s)=>`<div class="toggle"><div>${t}<small>${s}</small></div><input class="sw" type="checkbox" data-n="${k}" ${S.notif[k]?'checked':''} aria-label="${t}"></div>`;
  const fwNow=E('framework')?D.framework:S.plan.framework, custNow=E('framework')?D.custom:S.plan.custom;
  const bl=buckets(fwNow,custNow);

  return `<button class="btn small ghost" data-go="home" style="margin-bottom:8px">Back to dashboard</button><h1>Settings</h1>
  <p class="sub">Everything here is locked. Edit one section at a time, review, then confirm. Changes apply from this month forward and are recorded in the change log.</p>
  <div class="actions"><button class="btn ghost" data-act="runSetup" ${UI.sec?'disabled':''}>Run setup again</button><button class="btn ghost" data-go="help">Help</button></div>

  <h2>Plan framework ${tip('framework')}</h2>${secHead('framework')}
  <div class="panel" style="padding:8px 16px 14px;margin-top:10px">
    ${E('framework')?Object.entries(FW).map(([k,f])=>`<button class="fwopt" data-act="dFw" data-fw="${k}" aria-pressed="${D.framework===k}"><b>${f.name}</b><span>${f.desc}</span></button>`).join(''):`<div class="row"><b>${esc(fwNow==='custom'?'Custom':FW[fwNow].name)}</b><div class="sub" style="font-size:14px">${FW[fwNow].desc}</div></div>`}
    ${E('framework')&&D.framework==='custom'?D.custom.map((b,i)=>`<div class="cfgitem"><label class="field"><span>Group for ${({need:'needs',invest:'investing',save:'savings',want:'wants'})[b.roles[0]]}</span><input type="text" data-cb="name" data-i="${i}" value="${esc(b.name)}"></label>
      <div class="two"><label class="field"><span>Target min %</span><input type="number" inputmode="decimal" data-cb="min" data-i="${i}" value="${b.min}"></label><label class="field"><span>Target max %</span><input type="number" inputmode="decimal" data-cb="max" data-i="${i}" value="${b.max}"></label></div></div>`).join('')
    :bl.map(b=>`<div class="row"><div class="rowtop"><span style="color:var(--ink)">${esc(b.name)}</span><span class="num">${b.min==null?'No target':b.min===b.max?b.min+'%':b.min+'–'+b.max+'%'}</span></div></div>`).join('')}
  </div>${secFoot('framework')}

  <h2 id="incsec">Income and defaults</h2>${secHead('income')}
  <div class="panel" style="padding:6px 16px 12px;margin-top:10px">
    ${E('income')?`<label class="field"><span>Gross annual salary (before tax)</span><input type="number" inputmode="decimal" data-df="grossAnnual" value="${D.grossAnnual||''}"></label>
      <label class="field"><span>Pre-tax retirement contribution, per month (401k/403b)</span><input type="number" inputmode="decimal" data-df="pretax" value="${D.pretax||''}"></label>
      <label class="field"><span>Net take-home pay, per month</span><input type="number" inputmode="decimal" data-df="net" value="${D.net||''}"></label>
      <label class="field"><span>Average extra income, per month (side work, tutoring)</span><input type="number" inputmode="decimal" data-df="extra" value="${D.extra||''}"></label>
      <label class="field"><span>Paychecks go to</span><select data-df="deposit">${acctOptsAll(D.deposit,liveAccts().filter(a=>a.type!=='debt'))}</select></label>
      <label class="field"><span>Purchases default to</span><select data-df="payDefault">${acctOptsAll(D.payDefault,payAccts())}</select></label>
      <label class="field"><span>Spending money goes to ${tip('spendto')}</span><select data-df="spendTo"><option value="">Keep it where paychecks land</option>${liveAccts().filter(a=>a.type!=='debt').map(a=>`<option value="${a.id}" ${a.id===D.spendTo?'selected':''}>${esc(a.name)}</option>`).join('')}</select></label>
      <label class="field"><span>Extra goes to ${tip('extrato')}</span><select data-df="extraTo"><option value="">Keep it where paychecks land</option>${liveAccts().filter(a=>a.type!=='debt').map(a=>`<option value="${a.id}" ${a.id===D.extraTo?'selected':''}>${esc(a.name)}</option>`).join('')}</select></label>`
    :incomeTable()}
  </div>${secFoot('income')}

  <h2 id="catsec">Categories ${tip('pctnet')}</h2>${secHead('categories','Archiving hides a category but keeps its history. Nothing saves until you review.')}
  <div class="panel" style="padding:6px 16px 12px;margin-top:10px">${E('categories')?catEdit(D):catView()}</div>${secFoot('categories')}

  <h2>Fixed costs</h2>${secHead('fixed')}
  <div class="panel" style="padding:6px 16px 12px;margin-top:10px">${E('fixed')?fixEdit(D):fixView()}</div>${secFoot('fixed')}

  <h2 id="acctsec">Accounts</h2>${secHead('accounts','To correct a balance, use Edit on the Accounts tab instead.')}
  <div class="panel" style="padding:6px 16px 12px;margin-top:10px">${E('accounts')?acctEdit(D):acctView()}</div>${secFoot('accounts')}

  <h2>Other assets</h2>${secHead('assets','Things you own outside your accounts, like a car. Values count toward net worth.')}
  <div class="panel" style="padding:6px 16px 12px;margin-top:10px">${E('assets')?D.map((x,i)=>x.archived?'':`<div class="cfgitem"><div class="two"><label class="field"><span>Name</span>${inp(i,'name',x.name,'text','e.g. Car')}</label><label class="field"><span>Estimated value</span>${inp(i,'value',x.value,'number')}</label></div>
      <div class="actions" style="margin-top:4px"><button class="btn small ghost" data-act="dArch" data-i="${i}" style="margin-left:auto">Archive</button></div></div>`).join('')+`<button class="btn ghost full" data-act="dAdd" data-sec="assets" style="margin-top:10px">Add an asset</button>`
    :((S.assets||[]).filter(x=>!x.archived).map(x=>`<div class="row"><div class="rowtop"><b>${esc(x.name)}</b><span class="num">${money(x.value||0)}</span></div></div>`).join('')||'<div class="empty">None yet. Add things like a car if you want them in your net worth.</div>')}</div>${secFoot('assets')}

  <h2 id="dashsec">Dashboard ${tip('dash')}</h2>
  <p class="sub" style="font-size:14px;margin-bottom:10px">Choose which cards show and in what order. These save right away, since they only change what you see.</p>
  <div class="panel">${S.dash.order.map((k,i)=>{const pin=k.includes(':');const nm=pin?(k.startsWith('goal')?(goal(k.split(':')[1])||{}).name+' (goal)':(acct(k.split(':')[1])||{}).name+' (debt)'):DASH_CARDS[k];
    return `<div class="row dashrow"><label class="checkrow" style="margin:0;flex:1"><input type="checkbox" data-dshow="${k}" ${S.dash.hidden.includes(k)?'':'checked'}> ${pin?'📌 ':''}${esc(nm)}</label>
      <button class="x" data-act="dmove" data-key="${k}" data-dir="-1" aria-label="Move ${esc(nm)} up" ${i?'':'disabled'}>↑</button><button class="x" data-act="dmove" data-key="${k}" data-dir="1" aria-label="Move ${esc(nm)} down" ${i<S.dash.order.length-1?'':'disabled'}>↓</button>
      ${pin?`<button class="btn small ghost" data-act="pin" data-key="${k}" data-name="${esc(nm.replace(/ \((goal|debt)\)$/,''))}">Unpin</button>`:''}</div>`}).join('')}</div>
  ${(()=>{const opts=topGoals().filter(g=>!pinned('goal:'+g.id)).map(g=>['goal:'+g.id,g.name+' (goal)']).concat(liveAccts().filter(a=>a.type==='debt'&&!pinned('debt:'+a.id)).map(a=>['debt:'+a.id,a.name+' (debt)']));
    return opts.length?`<div class="inline"><select id="pinPick" aria-label="Goal or debt to pin">${opts.map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join('')}</select><button class="btn small" data-act="pinPick">Pin</button></div>`:''})()}

  <h2>Notifications</h2>
  <div class="panel">
    ${T('b80','Category at 80%','A heads-up before you run out')}
    ${T('over','Over budget','When a category goes past its limit')}
    ${T('goals','Goal updates','Milestones, falling behind, fully funded')}
    ${T('due','Bill due','The day before a fixed cost is due')}
    ${T('close','Monthly close','A reminder on the 1st')}
    ${T('daily','Evening nudge','If nothing was logged today')}
    ${T('weekly','Weekly check-in','A short review card on the dashboard every 7 days')}
  </div>
  <button class="btn ghost full" id="testN" style="margin-top:12px">Preview a notification</button>
  <h2>Help tips</h2>
  <div class="panel"><div class="toggle"><div>Show ? tips<small>Tap a ? next to anything for a quick explanation</small></div><input class="sw" type="checkbox" data-tips="1" ${S.tips?'checked':''} aria-label="Show tips"></div></div>
  <h2 id="secsec">Security ${tip('security')}</h2>
  <div class="panel" style="padding:6px 16px 12px">
    <div class="row"><div class="rowtop"><b>Account email</b><span>${SEC().email?esc(SEC().email):'Not set'}</span></div><div class="sub" style="font-size:13px">Used to sign in on a new device and to reset your passcode.</div>
      <label class="field" style="margin:6px 0 0"><span class="sr">Account email</span><input type="email" id="secEmail" placeholder="you@example.com" value="${esc(SEC().email||'')}"></label></div>
    <div class="row"><div class="rowtop"><b>App passcode</b><span>${SEC().hash?'On':'Off'}</span></div><div class="sub" style="font-size:13px">A 6-digit code that unlocks Ledger on this device.</div>
      <div class="actions">${SEC().hash?`<button class="btn small ghost" data-act="pinChange">Change passcode</button><button class="btn small ghost" data-act="pinOff">Turn off</button><button class="btn small ghost" data-act="lockNow">Lock now</button>`:`<button class="btn small" data-act="pinSet">Set a passcode</button>`}</div></div>
    ${SEC().hash?`<div class="row"><label class="field" style="margin:0"><span>Lock when I’ve been away for</span><select id="secAfter">${[[0,'Right away'],[1,'1 minute'],[5,'5 minutes'],[15,'15 minutes'],[60,'1 hour']].map(([v,l])=>`<option value="${v}" ${(SEC().lockAfter??5)===v?'selected':''}>${l}</option>`).join('')}</select></label></div>`:''}
  </div>
  <h2>Backup</h2>
  <div class="panel" style="padding:14px 16px">
    <p class="sub" style="font-size:14px;margin:0 0 10px">This demo saves only in this browser. Download a backup now and then so clearing your browser doesn’t lose anything. ${tip('backup')}</p>
    <div class="actions" style="margin-top:0"><button class="btn" data-act="backup">Download backup</button><label class="btn ghost filebtn">Restore from backup<input type="file" accept="application/json,.json" id="restoreFile" hidden></label></div>
    ${S.lastBackup?`<p class="sub" style="font-size:13px;margin:8px 0 0">Last backup: ${new Date(S.lastBackup).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</p>`:''}
  </div>
  <h2>Start over</h2>
  <div class="panel" style="padding:14px 16px">
    <p class="sub" style="font-size:14px;margin:0 0 10px">This is a demo with sample numbers, saved only in this browser.</p>
    <button class="btn ghost full" id="reset">Reset sample data</button>
    <button class="btn full dangerbtn" data-act="erase" style="margin-top:10px">Erase everything and start fresh</button>
  </div>`;
};

/* review a config section: diff the draft against saved data */
function reviewSec(sec){
  const D=UI.draft,ch=[];
  if(sec==='framework'){
    const nm=k=>k==='custom'?'Custom':FW[k].name;
    if(D.framework!==S.plan.framework)ch.push(chg('Framework',nm(S.plan.framework),nm(D.framework)));
    if(D.framework==='custom')D.custom.forEach((b,i)=>{const o=S.plan.custom[i];if(b.name!==o.name)ch.push(chg('Group name',esc(o.name),esc(b.name)));if(b.min!==o.min||b.max!==o.max)ch.push(chg(esc(b.name)+' target',o.min+'–'+o.max+'%',b.min+'–'+b.max+'%'))});
    if(D.framework==='custom'&&D.custom.some(b=>!b.name.trim()||!(b.max>=b.min))){toast('Each group needs a name and a max at least as high as its min');return}
    return {ch,apply:()=>{S.plan.framework=D.framework;S.plan.custom=D.custom}};
  }
  if(sec==='income'){
    if(!(D.net>0)){toast('Enter your take-home pay');return}
    const O=S.plan.inc,lab={grossAnnual:'Gross annual salary',pretax:'Pre-tax retirement',net:'Take-home pay',extra:'Extra income'};
    Object.keys(lab).forEach(k=>{if((D[k]||0)!==(O[k]||0))ch.push(chg(lab[k],money(O[k]||0),money(D[k]||0)))});
    if(D.deposit!==S.plan.deposit)ch.push(chg('Paychecks go to',esc(aName(S.plan.deposit)),esc(aName(D.deposit))));
    if(D.payDefault!==S.plan.payDefault)ch.push(chg('Purchases default to',esc(aName(S.plan.payDefault)),esc(aName(D.payDefault))));
    const rn=id=>id?esc(aName(id)):'where paychecks land';
    if((D.spendTo||'')!==(routeAcct(S.plan.spendTo)||''))ch.push(chg('Spending money goes to',rn(routeAcct(S.plan.spendTo)),rn(D.spendTo)));
    if((D.extraTo||'')!==(routeAcct(S.plan.extraTo)||''))ch.push(chg('Extra goes to',rn(routeAcct(S.plan.extraTo)),rn(D.extraTo)));
    if(ch.length&&(D.net+(D.extra||0))!==S.plan.income)ch.push(chg('Net total income (plan basis)',money(S.plan.income),money(D.net+(D.extra||0))));
    return {ch,apply:()=>{S.plan.inc={grossAnnual:D.grossAnnual||0,pretax:D.pretax||0,net:D.net,extra:D.extra||0};S.plan.income=r2(D.net+(D.extra||0));S.plan.deposit=D.deposit;S.plan.payDefault=D.payDefault;if(D.spendTo)S.plan.spendTo=D.spendTo;else delete S.plan.spendTo;if(D.extraTo)S.plan.extraTo=D.extraTo;else delete S.plan.extraTo}};
  }
  const old=S[sec]||[],label={categories:'category',fixed:'fixed cost',accounts:'account',assets:'asset'}[sec];
  if(D.some(x=>!String(x.name||'').trim())){toast('Every '+label+' needs a name');return}
  if(sec==='accounts'){const bad=D.find(a=>a.type==='debt'&&a.start!==''&&a.start!=null&&a.start>0&&a.start<(S.accounts.find(o=>o.id===a.id)||a).balance-0.004);if(bad){toast(`${bad.name}\u2019s original amount can\u2019t be less than what\u2019s owed now`);return}}
  if(sec==='fixed'&&D.some(f=>!f.archived&&(f.pct!=null?!(f.pct>0):!(f.amount>0)))){toast('Each fixed cost needs an amount above zero');return}
  if(sec==='fixed'&&D.some(f=>f.day!=null&&f.day!==''&&!(f.day>=1&&f.day<=31))){toast('Due days must be between 1 and 31');return}
  if(sec==='fixed'&&D.some(f=>!f.archived&&f.freq==='months'&&!(f.months||[]).length)){toast('Pick at least one month for bills due in specific months');return}
  if(sec==='fixed'&&D.some(f=>!f.archived&&f.begins&&f.end&&f.end<f.begins)){toast('A bill can\u2019t end before it starts');return}
  const fmt={freq:v=>({monthly:'every month',quarterly:'every 3 months',yearly:'once a year',months:'specific months'})[v||'monthly'],months:v=>(v||[]).map(n=>MON[n-1]).join(', ')||'none',end:v=>v?monthName(mDate(v),{month:'short',year:'numeric'}):'none',roll:v=>v?'on':'off',begins:v=>v?monthName(mDate(v),{month:'short',year:'numeric'}):'none',start:v=>v?money(v):'none',startDate:v=>v?fmtD(v):'none',accrue:v=>v?'on':'off',budget:v=>money(v||0),amount:v=>money(v||0),pct:v=>(v||0)+'%',day:v=>v?ordinal(v):'none',apr:v=>(v||0)+'%',min:v=>money(v||0),
    pay:v=>v?'yes':'no',value:v=>money(v||0),to:v=>v?aName(v):'nowhere',type:v=>TYPES[v]||(v==='annual'?'Per year':v==='monthly'?'Per month':v),role:v=>roleName(v),acct:v=>v?aName(v):'any account',bank:v=>v||'none',card:v=>v?'yes':'no',stmt:v=>v?ordinal(v):'none',payFull:v=>v?'yes':'no',payFrom:v=>v?aName(v):'paycheck account',name:v=>v};
  const names={freq:'how often',months:'months',end:'ends after',roll:'rollover',begins:'starts',start:'original amount',startDate:'start date',accrue:'estimated interest',budget:'budget',amount:'amount',pct:'percent',day:'due day',apr:'APR',min:'payment',type:sec==='accounts'?'type':'period',role:'group',acct:sec==='categories'?'usually paid from':'paid from',bank:'bank',card:'credit card',stmt:'statement day',payFull:'pays in full',payFrom:'pays from',name:'name',pay:'used for purchases',value:'value',to:'goes to'};
  D.forEach(x=>{const o=old.find(y=>y.id===x.id);
    if(!o){ch.push(`Add ${label}: ${esc(x.name)}`+(sec==='categories'?`, ${money(x.budget||0)}/${x.type==='annual'?'year':'month'} in ${esc(roleName(x.role))}`:sec==='fixed'?`, ${x.pct!=null?x.pct+'% of income':money(x.amount)+'/month'}`:sec==='assets'?`, ${money(x.value||0)}`:`, ${TYPES[x.type]}, ${money(x.balance||0)}`));return}
    if(!!x.archived!==!!o.archived){ch.push((x.archived?'Archive ':'Restore ')+label+': '+esc(o.name));return}
    Object.keys(names).forEach(k=>{if(k in x||k in o){const a=o[k],b=x[k];if(JSON.stringify(a??'')!==JSON.stringify(b??''))ch.push(`${esc(o.name)} ${names[k]}: ${esc(String(fmt[k](a)))} → ${esc(String(fmt[k](b)))}`)}});
  });
  const both=x=>!x.archived&&D.find(y=>y.id===x.id&&!y.archived)&&old.find(y=>y.id===x.id&&!y.archived);
  const ordOld=old.filter(both).map(x=>x.id).join(),ordNew=D.filter(both).map(x=>x.id).join();
  if(sec==='categories'&&ordOld!==ordNew)ch.push('Reorder categories');
  return {ch,apply:()=>{S[sec]=D.map(x=>{const y=Object.assign({},x);if(sec==='categories'){const o=old.find(z=>z.id===y.id);if(y.roll&&!(o&&o.roll))y.rollFrom=thisM;if(!y.roll){delete y.roll;delete y.rollFrom}if(y.type!=='monthly'){delete y.roll;delete y.rollFrom}}if(sec==='categories'&&(y.budget===''||y.budget==null||isNaN(y.budget)))y.budget=0;if(sec==='assets'&&(y.value===''||y.value==null))y.value=0;if(sec==='accounts'&&!y.card){delete y.card;delete y.stmt;delete y.payFull;delete y.payFrom}if(sec==='accounts'&&y.card&&y.stmt!==''&&y.stmt!=null)y.stmt=Math.min(31,Math.max(1,Math.round(parseFloat(y.stmt)||1)));['budget','amount','pct','day','apr','min','balance','value','start','stmt'].forEach(k=>{if(y[k]===''||y[k]==null)delete y[k];else y[k]=parseFloat(y[k])});if(y.to==='')delete y.to;if(y.bank!=null){y.bank=String(y.bank).trim();if(!y.bank)delete y.bank}if(sec==='categories'&&!y.acct)delete y.acct;if(sec==='fixed'){if(!y.begins)delete y.begins;if(!y.end)delete y.end;if((y.freq||'monthly')==='monthly')delete y.freq;if(y.freq!=='months')delete y.months;if(y.pct!=null){delete y.freq;delete y.months;delete y.begins}}if(y.startDate==='')delete y.startDate;if(y.type!=='debt'){delete y.start;delete y.startDate;delete y.accrue}return y});
    if(sec==='accounts')S.accounts.forEach(a=>{if(a.balance==null)a.balance=0})}};
}

let lastView=null;
/* ---------- trends ---------- */
const TR={range:6,cat:null};
const CH={};
function monthStats(m){
  const o={m,income:0,spend:0,planned:0,interest:0,save:0,invest:0,need:0,want:0,byCat:{},cnt:{},vend:{},plannedList:[]};
  S.tx.forEach(t=>{if(!inMonth(t,m))return;
    if(t.kind==='income'){o.income+=t.amount;return}
    if(t.kind==='expense'){const c=cat(t.cat);const r=(c&&c.role)||'want';o.spend+=t.amount;o.byCat[t.cat]=(o.byCat[t.cat]||0)+t.amount;o.cnt[t.cat]=(o.cnt[t.cat]||0)+1;o.vend[t.vendor]=(o.vend[t.vendor]||0)+t.amount;
      o[r]=(o[r]||0)+t.amount;return}
    if(t.kind==='fixed'){const f=S.fixed.find(x=>x.id===t.fixedId);const r=(f&&f.role)||'need';if(!t.to)o.spend+=t.amount;o[r]=(o[r]||0)+t.amount;return}
    if(t.kind==='goalbuy'){o.planned+=t.amount;o.plannedList.push(t);return}
    if(t.kind==='interest'){o.spend+=t.amount;o.interest+=t.amount;return}
    if(t.kind==='assign'||(t.kind==='transfer'&&t.goal)){o.save+=t.amount}
  });
  o.invest+=(S.plan.inc&&S.plan.inc.pretax)||0;
  return o;
}
function trendMonths(){
  const first=S.tx.reduce((a,t)=>t.date<a?t.date:a,todayISO).slice(0,7);
  const snapFirst=S.snapshots.reduce((a,x)=>x.key&&x.key<a?x.key:a,first);
  const out=[];let d=new Date(snapFirst+'-01T00:00');
  while(mkey(d)<=thisM){out.push(mkey(d));d=new Date(d.getFullYear(),d.getMonth()+1,1)}
  return TR.range==='all'?out:out.slice(-TR.range);
}
const mLabel=m=>new Date(m+'-01T00:00').toLocaleDateString('en-US',{month:'short'});
const mFull=m=>new Date(m+'-01T00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'})+(m===thisM?' (so far)':'');
const kfmt=v=>Math.abs(v)>=1000?(v<0?'-':'')+'$'+(Math.abs(v)/1000).toFixed(Math.abs(v)>=10000?0:1)+'k':(v<0?'-':'')+'$'+Math.round(Math.abs(v));
function niceRange(vals,pad0){const v=vals.filter(x=>x!=null&&isFinite(x));if(!v.length)return [0,1];let lo=Math.min(...v),hi=Math.max(...v);if(pad0)lo=Math.min(0,lo);if(lo===hi){hi+=1;lo-=pad0?0:1}const p=(hi-lo)*.08;return [pad0&&lo>=0?0:lo-p,hi+p]}
const sw=(c,dash,band)=>band?`<i class="lsw" style="background:var(--accent-soft);height:10px"></i>`:dash?`<i class="lsw" style="height:0;border-top:2px dashed ${c};background:none"></i>`:`<i class="lsw" style="background:${c}"></i>`;
function legendHTML(items){return `<div class="legend">${items.map(x=>`<span>${sw(x.color,x.dash,x.band)}${esc(x.name)}</span>`).join('')}</div>`}
/* o: {id, months, labels, series:[{name,vals,color,dash}], band, range, zero, fmt, h, aria, extra(i), legendExtra} */
function chartBlock(o,svg){
  CH[o.id]=o;
  const sel=o.sel!=null?o.sel:o.labels.length-1;
  return `<div class="chartwrap" data-chartid="${o.id}">${svg}
    ${legendHTML(o.series.map(s=>({name:s.name,color:s.color,dash:s.dash})).concat(o.legendExtra||[]))}
    <div class="readout" id="ro-${o.id}" aria-live="polite">${readout(o.id,sel)}</div>
    <p class="tapnote">Tap the chart to see each month.</p></div>`;
}
function readout(id,i){
  const o=CH[id];if(!o||i<0)return '';
  const f=o.fmt||(v=>money(v));
  const rows=o.series.map(s=>{const v=s.vals[i];return `<div class="rorow"><span>${sw(s.color,s.dash)}${esc(s.name)}</span><b class="num">${v==null?'No data':f(v)}</b></div>`}).join('');
  return `<div class="rohead">${esc(o.months?mFull(o.months[i]):o.labels[i])}</div>${rows}${o.extra?o.extra(i):''}`;
}
function selectPoint(id,i){
  const wrap=document.querySelector(`[data-chartid="${id}"]`);if(!wrap)return;
  CH[id].sel=i;
  wrap.querySelectorAll('[data-g]').forEach(g=>g.classList.toggle('on',+g.dataset.g===i));
  wrap.querySelectorAll('[data-hit]').forEach(g=>g.setAttribute('aria-pressed',+g.dataset.i===i));
  document.getElementById('ro-'+id).innerHTML=readout(id,i);
}
function hits(o,W,H,L,R,T,B,xAt,slotW){
  const n=o.labels.length,sel=o.sel!=null?o.sel:n-1;
  const gx=i=>Math.max(L-6,xAt(i)-slotW/2),gw=i=>Math.min(W-R+6,xAt(i)+slotW/2)-gx(i);
  return o.labels.map((l,i)=>`<rect class="guide ${i===sel?'on':''}" data-g="${i}" x="${gx(i)}" y="${T-6}" width="${gw(i)}" height="${H-T-B+6}" rx="6"/>`).join('')
    +o.labels.map((l,i)=>`<rect class="hit" data-hit="${o.id}" data-i="${i}" x="${xAt(i)-slotW/2}" y="0" width="${slotW}" height="${H}" tabindex="0" role="button" aria-label="${esc(o.months?mFull(o.months[i]):l)}" aria-pressed="${i===sel}"/>`).join('');
}
function lineChart(o){
  const W=340,H=o.h||160,L=40,R=12,T=16,B=24,n=o.labels.length;
  const all=[].concat(...o.series.map(s=>s.vals)).concat(o.band?o.band:[]);
  const [lo,hi]=o.range||niceRange(all,o.zero);
  const slot=n<2?(W-L-R):(W-L-R)/(n-1);
  const x=i=>L+(n<2?(W-L-R)/2:i*(W-L-R)/(n-1)),y=v=>T+(1-(v-lo)/(hi-lo))*(H-T-B);
  const f=o.axfmt||o.fmt||kfmt;
  const grid=[0,.5,1].map(fr=>{const v=lo+(hi-lo)*fr;return `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end" class="ax">${f(v)}</text>`}).join('');
  const band=o.band?`<rect x="${L}" y="${y(Math.min(hi,o.band[1]))}" width="${W-L-R}" height="${Math.max(2,y(Math.max(lo,o.band[0]))-y(Math.min(hi,o.band[1])))}" fill="var(--accent-soft)"/>`:'';
  const lines=o.series.map(s=>{let d='',pen=false;s.vals.forEach((v,i)=>{if(v==null){pen=false;return}d+=(pen?'L':'M')+x(i).toFixed(1)+' '+y(v).toFixed(1)+' ';pen=true});
    return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.5" ${s.dash?'stroke-dasharray="5 4"':''} stroke-linejoin="round" stroke-linecap="round"/>`
      +s.vals.map((v,i)=>v==null?'':`<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="${s.color}"/>`).join('')}).join('');
  const xl=o.labels.map((l,i)=>(n<=7||i%2===(n-1)%2)?`<text x="${x(i)}" y="${H-6}" text-anchor="middle" class="ax">${l}</text>`:'').join('');
  const svg=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(o.aria||'')}">${band}${grid}${hits(o,W,H,L,R,T,B,x,Math.min(slot,46)).replace(/<rect class="hit"[\s\S]*$/,'')}${lines}${xl}${hits(o,W,H,L,R,T,B,x,Math.max(slot,20)).replace(/^[\s\S]*?(?=<rect class="hit")/,'')}</svg>`;
  return chartBlock(Object.assign({legendExtra:o.band?[{name:'Target range',band:true}]:[]},o),svg);
}
function barChart(o){
  const W=340,H=o.h||175,L=40,R=8,T=16,B=24,n=o.labels.length,g=o.series.filter(s=>!s.line).length;
  const all=[].concat(...o.series.map(s=>s.vals));
  const [lo,hi]=niceRange(all,true);
  const slot=(W-L-R)/n,bw=Math.min(22,(slot*.72)/g);
  const cx=i=>L+slot*i+slot/2,y=v=>T+(1-(v-lo)/(hi-lo))*(H-T-B);
  const grid=[0,.5,1].map(f=>{const v=lo+(hi-lo)*f;return `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end" class="ax">${kfmt(v)}</text>`}).join('');
  const bs=o.series.filter(s=>!s.line);
  const bars=o.labels.map((l,i)=>{const start=cx(i)-bw*g/2;
    return bs.map((s,j)=>{const v=s.vals[i]||0;return `<rect x="${start+j*bw+1}" y="${y(Math.max(0,v))}" width="${bw-2}" height="${Math.max(0,y(0)-y(Math.max(0,v)))}" rx="3" fill="${s.color}" ${o.months&&o.months[i]===thisM?'opacity=".55"':''}/>`}).join('')
      +`<text x="${cx(i)}" y="${H-6}" text-anchor="middle" class="ax">${l}</text>`}).join('');
  const lines=o.series.filter(s=>s.line).map(s=>`<path d="${s.vals.map((v,i)=>(i?'L':'M')+(i===0?L:cx(i))+' '+y(v)).join(' ')} L${W-R} ${y(s.vals[n-1])}" fill="none" stroke="${s.color}" stroke-width="2" stroke-dasharray="5 4"/>`).join('');
  const h=hits(o,W,H,L,R,T,B,cx,slot);
  const svg=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(o.aria||'')}">${grid}${h.replace(/<rect class="hit"[\s\S]*$/,'')}${bars}${lines}${h.replace(/^[\s\S]*?(?=<rect class="hit")/,'')}</svg>`;
  return chartBlock(o,svg);
}
const seeBtn=(m,c,q)=>`<button class="btn small ghost seebtn" data-see="${m||'all'}" data-seecat="${c||''}" data-seeq="${esc(q||'')}">See entries</button>`;
V.trends=()=>{
  const months=trendMonths(),st=months.map(monthStats),labels=months.map(m=>mLabel(m)+(m===thisM?'*':''));
  const full=st.filter(x=>x.m!==thisM),fullM=full.map(x=>x.m),nf=Math.max(1,full.length);
  const nw=months.map(m=>{if(m===thisM)return netOf();const sn=S.snapshots.find(x=>x.key===m);return sn?netOf(sn.bal):null});
  const nwVals=nw.filter(v=>v!=null),nwChg=nwVals.length>1?nwVals[nwVals.length-1]-nwVals[0]:0;
  const avgSpend=full.reduce((a,x)=>a+x.spend,0)/nf, avgInc=full.reduce((a,x)=>a+x.income,0)/nf;
  const rate=full.map(x=>x.income?(x.income-x.spend)/x.income*100:null), avgRate=avgInc?(avgInc-avgSpend)/avgInc*100:0;
  const cats=liveCats().concat(S.categories.filter(c=>c.archived&&st.some(x=>x.byCat[c.id])));
  if(!TR.cat||!cat(TR.cat))TR.cat=(cats[0]||{}).id;
  const c=cat(TR.cat);
  const catTot={};st.forEach(x=>Object.entries(x.byCat).forEach(([k,v])=>catTot[k]=(catTot[k]||0)+v));
  const spendTot=st.reduce((a,x)=>a+Object.values(x.byCat).reduce((p,q)=>p+q,0),0)||1;
  const top=Object.entries(catTot).sort((a,b)=>b[1]-a[1]).slice(0,8),topMax=top.length?top[0][1]:1;
  const vendTot={},vendCnt={};S.tx.filter(t=>t.kind==='expense'&&months.includes(t.date.slice(0,7))).forEach(t=>{vendTot[t.vendor]=(vendTot[t.vendor]||0)+t.amount;vendCnt[t.vendor]=(vendCnt[t.vendor]||0)+1});
  const topV=Object.entries(vendTot).sort((a,b)=>b[1]-a[1]).slice(0,6),topVMax=topV.length?topV[0][1]:1;
  const debt=months.map(m=>{if(m===thisM)return sumType(['debt']);const sn=S.snapshots.find(x=>x.key===m);return sn?sumType(['debt'],sn.bal):null});
  const chips=[[3,'3M'],[6,'6M'],[12,'12M'],['all','All']].map(([v,l])=>`<button class="chip" data-range="${v}" aria-pressed="${TR.range===v}">${l}</button>`).join('');
  const stat=(l,v,sub,cls)=>`<div class="ov"><div class="sub">${l}</div><div class="ovv num ${cls||''}">${v}</div><span class="sub" style="font-size:12px">${sub}</span></div>`;
  const fwName=S.plan.framework==='custom'?'custom plan':FW[S.plan.framework].name;
  return `<h1>Trends</h1><p class="sub">How your money has moved over time. * marks the current month, still in progress.</p>
  <div class="chips" style="margin:14px 0">${chips}</div>
  <div class="ovgrid">
    ${stat('Net worth change',(nwChg>=0?'+':'')+money(nwChg),`across ${nwVals.length} recorded months`,nwChg>=0?'up':'down')}
    ${stat('Avg. spending',money(avgSpend),'per full month')}
    ${stat('Avg. income',money(avgInc),'per full month')}
    ${stat('Avg. savings rate',Math.round(avgRate)+'%','income not spent')}
  </div>

  <h2>Net worth</h2>
  <div class="panel cpanel">${nwVals.length>1?lineChart({id:'nw',months,labels,series:[{name:'Net worth',vals:nw,color:'var(--accent)'}],aria:'Net worth by month',
    extra:i=>{let p=i-1;while(p>=0&&nw[p]==null)p--;const sn=S.snapshots.find(x=>x.key===months[i]);
      return (nw[i]!=null&&p>=0?`<div class="rorow"><span>Change from ${mLabel(months[p])}</span><b class="num ${nw[i]-nw[p]>=0?'okc':'overtxt'}">${nw[i]-nw[p]>=0?'+':''}${money(nw[i]-nw[p])}</b></div>`:'')
        +(nw[i]==null?'<p class="sub" style="font-size:13px;margin:4px 0 0">This month wasn\u2019t closed, so no balances were recorded.</p>':months[i]===thisM?'<p class="sub" style="font-size:13px;margin:4px 0 0">Live, from your current balances.</p>':sn?`<div class="rorow"><span>Assets</span><b class="num">${money(sumType(['checking','cash','savings','retirement'],sn.bal)+(sn.bal.__oth||0))}</b></div><div class="rorow"><span>Debt</span><b class="num">${money(sumType(['debt'],sn.bal))}</b></div>`:'')}})
    :'<div class="empty">Close a couple of months to see this trend.</div>'}</div>

  <h2>Income vs. spending</h2>
  <div class="panel cpanel">${barChart({id:'ivs',months,labels,series:[{name:'Income',vals:st.map(x=>x.income),color:'var(--accent)'},{name:'Spending',vals:st.map(x=>x.spend),color:'var(--warn)'}].concat(st.some(x=>x.planned)?[{name:'Planned purchases',vals:st.map(x=>x.planned),color:'var(--plan)'}]:[]),aria:'Income, spending, and planned purchases by month',
    extra:i=>{const x=st[i],d=x.income-x.spend;return `<div class="rorow"><span>Left over (before planned purchases)</span><b class="num ${d>=0?'okc':'overtxt'}">${money(d)}</b></div><div class="rorow"><span>Moved to goals</span><b class="num">${money(x.save)}</b></div>${x.plannedList.map(t=>`<div class="rorow"><span>Paid from goal: ${esc(t.vendor)}</span><b class="num">${money(t.amount)}</b></div>`).join('')}${x.interest?`<div class="rorow"><span>Loan interest (in spending)</span><b class="num">${money(x.interest)}</b></div>`:''}${seeBtn(x.m)}`}})}
  <p class="sub" style="font-size:13px;margin:8px 0 0">Spending includes purchases, bills, and loan interest. Planned purchases are paid from money you already saved in a goal, like tuition, so they get their own bar instead of counting as overspending. ${tip('planned')}</p></div>

  <h2>Savings rate</h2>
  <div class="panel cpanel">${full.length?lineChart({id:'sr',months:fullM,labels:labels.filter((l,i)=>months[i]!==thisM),series:[{name:'Savings rate',vals:rate,color:'var(--accent)'}],fmt:v=>Math.round(v)+'%',aria:'Savings rate by month',
    extra:i=>{const x=full[i];return `<div class="rorow"><span>Income</span><b class="num">${money(x.income)}</b></div><div class="rorow"><span>Spent</span><b class="num">${money(x.spend)}</b></div><div class="rorow"><span>Kept</span><b class="num">${money(x.income-x.spend)}</b></div>`}})
    :'<div class="empty">Finish a full month to see this.</div>'}
  <p class="sub" style="font-size:13px;margin:8px 0 0">Share of each month's income you didn't spend. Full months only, and planned purchases from goals don't count against it. ${tip('savingsrate')}</p></div>

  <h2>Your plan over time</h2>
  <p class="sub" style="font-size:14px;margin-bottom:10px">Actual share of income for each part of your ${esc(fwName)}.</p>
  ${buckets().map((b,bi)=>{const v=st.map(x=>{const inc=x.income||S.plan.income;return inc?b.roles.reduce((a,r)=>a+(x[r]||0),0)/inc*100:null});
    const band=b.min!=null?[b.min===b.max?b.min-3:b.min,b.min===b.max?b.max+3:b.max]:null;
    return `<div class="panel cpanel" style="margin-bottom:10px"><div class="rowtop"><b>${esc(b.name)}</b><span class="num sub">${b.min!=null?'Target '+(b.min===b.max?b.min+'%':b.min+'–'+b.max+'%'):'No target'}</span></div>
    ${lineChart({id:'pb'+bi,months,labels,series:[{name:'Share of income',vals:v,color:'var(--plan)'}],band,range:[0,Math.max(60,...v.filter(x=>x!=null).map(x=>x+5),band?band[1]+5:0)],fmt:x=>Math.round(x)+'%',h:120,aria:b.name+' share of income by month',
      extra:i=>{const x=st[i],amt=b.roles.reduce((a,r)=>a+(x[r]||0),0),p=v[i];
        const status=band&&p!=null?(p<band[0]?`<b class="st below">Below target</b>`:p>band[1]?(aheadOk(b)?`<b class="st ahead">Ahead of target</b>`:`<b class="st above">Above target</b>`):`<b class="st ok">On target</b>`):'';
        const tg=b.min!=null?(b.min===b.max?b.min+'%':b.min+'–'+b.max+'%'):'';
        return `<div class="rorow"><span>${esc(b.name)}</span><b class="num">${money(amt)}</b></div><div class="rorow"><span>Income ${x.income?'that month':'(expected)'}</span><b class="num">${money(x.income||S.plan.income)}</b></div>${tg?`<div class="rorow"><span>Target</span><b class="num">${tg}</b></div>`:''}${status?`<div class="rorow"><span>Status</span>${status}</div>`:''}`}})}</div>`}).join('')}

  <h2>Category over time</h2>
  <div class="panel cpanel">
    <select data-trcat aria-label="Category" style="margin-bottom:8px">${cats.map(x=>`<option value="${x.id}" ${x.id===TR.cat?'selected':''}>${esc(x.name)}</option>`).join('')}</select>
    ${c?barChart({id:'cat',months,labels,series:[{name:'Spent',vals:st.map(x=>x.byCat[c.id]||0),color:'var(--accent)'}].concat(c.type==='monthly'?[{name:'Budget',vals:st.map(x=>budgetOf(c,x.m)),color:'var(--ink)',line:true,dash:true}]:[]),aria:c.name+' spending by month',
      extra:i=>{const x=st[i],v=x.byCat[c.id]||0;return `<div class="rorow"><span>Purchases</span><b class="num">${x.cnt[c.id]||0}</b></div>${c.type==='monthly'?`<div class="rorow"><span>${v>budgetOf(c,x.m)?'Over budget by':'Under budget by'}</span><b class="num ${v>budgetOf(c,x.m)?'overtxt':'okc'}">${money(Math.abs(budgetOf(c,x.m)-v))}</b></div>`:''}${seeBtn(x.m,c.id)}`}})
      +`<p class="sub" style="font-size:13px;margin:8px 0 0">Average ${money(full.reduce((a,x)=>a+(x.byCat[c.id]||0),0)/nf)} per full month${c.type==='monthly'?`, over budget in ${full.filter(x=>(x.byCat[c.id]||0)>budgetOf(c,x.m)).length} of ${full.length}`:''}.</p>`:'<div class="empty">Add a category in Settings.</div>'}
  </div>

  <h2>Where it went</h2>
  <div class="panel cpanel">${top.length?legendHTML([{name:'Total spent in this range',color:'var(--accent)'}])+top.map(([k,v])=>`<button class="hb" data-hb="${k}" aria-expanded="false"><div class="rowtop"><span>${esc(cat(k).name)}</span><span class="num">${money(v)}</span></div><div class="bar"><i style="width:${v/topMax*100}%"></i></div></button>
    <div class="hbdetail" id="hb-${k}" hidden><div class="rorow"><span>Share of purchases</span><b class="num">${Math.round(v/spendTot*100)}%</b></div><div class="rorow"><span>Average per month</span><b class="num">${money(v/Math.max(1,st.length))}</b></div><div class="rorow"><span>Purchases</span><b class="num">${st.reduce((a,x)=>a+(x.cnt[k]||0),0)}</b></div>${seeBtn('all',k)}</div>`).join('')
    +'<p class="tapnote">Tap a category for details.</p>':'<div class="empty">No purchases in this range.</div>'}</div>

  ${topV.length?`<h2>Top vendors</h2><div class="panel cpanel">${legendHTML([{name:'Total spent in this range',color:'var(--warn)'}])}${topV.map(([vn,a],i)=>`<button class="hb" data-hb="v${i}" aria-expanded="false"><div class="rowtop"><span>${esc(vn)}</span><span class="num">${money(a)}</span></div><div class="bar"><i style="width:${a/topVMax*100}%;background:var(--warn)"></i></div></button>
    <div class="hbdetail" id="hb-v${i}" hidden><div class="rorow"><span>Visits</span><b class="num">${vendCnt[vn]}</b></div><div class="rorow"><span>Average per visit</span><b class="num">${money(a/vendCnt[vn],true)}</b></div>${seeBtn('all','',vn)}</div>`).join('')}<p class="tapnote">Tap a vendor for details.</p></div>`:''}

  ${debt.some(v=>v)?`<h2>Debt</h2><div class="panel cpanel">${lineChart({id:'debt',months,labels,series:[{name:'Total owed',vals:debt,color:'var(--over)'}],zero:true,aria:'Total debt by month',
    extra:i=>{let p=i-1;while(p>=0&&debt[p]==null)p--;return debt[i]!=null&&p>=0?`<div class="rorow"><span>Change from ${mLabel(months[p])}</span><b class="num ${debt[i]-debt[p]<=0?'okc':'overtxt'}">${debt[i]-debt[p]>=0?'+':''}${money(debt[i]-debt[p])}</b></div>`:''}})}</div>`:''}`;
};

/* ---------- tips ---------- */
const TIPS={
  networth:['Everything you have (accounts and other assets) minus everything you owe.'],
  plan:()=>{const inc=S.plan.income||0,b=buckets(),fw=S.plan.framework;
    return [`<p>This is your plan for a typical month, not what you’ve spent. It takes your take-home of <b>${money(inc)}</b> and shows how much of it each group gets.</p>
    <p style="margin-top:6px">Each % = planned dollars ÷ take-home. Example: ${money(inc*.3)} ÷ ${money(inc)} = 30%.</p>
    ${b.some(x=>x.min!=null)?`<p style="margin-top:6px"><b>${esc(fw==='custom'?'Your':FW[fw].name)} targets:</b> ${b.map(x=>esc(x.name)+' '+(x.min==null?'(no target)':x.min===x.max?x.min+'%':x.min+'–'+x.max+'%')).join(', ')}.</p>`:''}
    <p style="margin-top:6px">Change the method or income in Settings.</p>`,'planread']},
  target:['The outlined box is this group’s target range. When the filled bar ends inside the box, you’re within target. Going past it is good for savings and investments (ahead of target) but a warning for fixed costs and spending (above target), since it leaves less for everything else. Targets that are a single number, like 10%, count as on target within 3 points either way.','planread'],
  unplanned:()=>{const P=monthPlan();return [`<p>Take-home left after fixed costs, goal savings, and spending budgets: <b>${money(P.income)}</b> − ${money(P.fixedTotal)} − ${money(P.goalTotal)} − ${money(P.budgets)} = <b>${money(P.unplanned)}</b>.</p><p style="margin-top:6px">Give it a job: raise a budget, fund a goal faster, or keep it as a buffer.</p>`,'planread']},
  bk:i=>{const r=planCheck().rows[+i];if(!r)return null;const inc=S.plan.income||0,b=r.b;
    const what={need:'bills and must-haves (rent, utilities, insurance, loan payments)',invest:'investing (pre-tax retirement and transfers to accounts like a Roth IRA)',save:'saving (this month’s goal contributions and savings transfers)',want:'guilt-free spending (your category budgets, like food and fun)'};
    const tg=b.min==null?'':`<p style="margin-top:6px">Target: ${b.min===b.max?b.min+'%':b.min+'–'+b.max+'%'} of ${money(inc)} = ${b.min===b.max?money(inc*b.min/100):money(inc*b.min/100)+'–'+money(inc*b.max/100)}.</p>`;
    const list=r.its.length?`<p style="margin-top:6px"><b>What’s in it now (${money(r.v)} ÷ ${money(inc)} = ${Math.round(r.pct)}%):</b></p><ul class="tiplist">${r.its.slice(0,7).map(x=>`<li><span>${esc(x.n)}${x.note?` <em>${x.note}</em>`:''}</span><b>${money(x.v)}</b></li>`).join('')}${r.its.length>7?`<li><span>${r.its.length-7} more</span><b>${money(r.its.slice(7).reduce((a,x)=>a+x.v,0))}</b></li>`:''}</ul>`:`<p style="margin-top:6px">Nothing is in this group yet.</p>`;
    return [`<p><b>${esc(b.name)}:</b> ${b.roles.map(x=>what[x]).join(' and ')}.</p>${list}${tg}`,'planread']},
  movebudget:['Planning to spend differently this month? Move budget from one or more categories into another, like clothes into food for a family dinner. It only changes this month. Each category can only give what it has left.'],
  cut:['Cover it moves this month’s budget from categories with money left into the one that’s over. It suggests amounts, starting with the categories that have the most left, and you can change them. Other months keep their normal budgets.'],
  security:['Two layers. Your account (email sign-in) protects your data on the server and on new devices. The passcode locks the app on a device that’s already signed in. Forget it? Reset it with a code sent to your email. Five wrong tries signs you out.'],
  start:['A list of things to set up and try once. Each step checks itself off when you do it. Optional steps can be skipped. Hide the list anytime and bring it back from Help.'],
  checkin:['A two-minute weekly review: purchases to add, what’s left to spend, bills due soon, transfers to make, and goals that slipped. Turn it off in Settings → Notifications.'],
  emergency:['Three months of essentials: your fixed costs marked as needs, plus any categories in the needs group, from Settings. It goes to the top of your goals so it fills first. Once it’s full, its monthly amount drops to $0 and that money flows to the next goal.','goal'],
  card:['Turn on “This is a credit card” in Settings → Accounts. Purchases on the card raise what you owe. Pay it with + → Transfer from the account you chose. If you pay the full statement each month, you never pay interest.','loan'],
  cardfree:['What’s in that account that isn’t set aside for goals, minus bills from it that haven’t been paid this month.','loan'],
  cardshort:['Paying less than the full statement means interest on what’s left, often 20% or more a year. Catching it early gives you time to cut back before the bill comes.','loan'],
  payday:['When you split a paycheck, the app records the moves right away. This list is the matching transfers to make in your real bank. Amounts come from Settings: fixed costs, each goal’s monthly pace, and your category budgets, scaled to this paycheck.','payday'],
  spendto:['Where your spending money for the month should live, like a spending bucket or checking. When you split a paycheck, your category budgets’ share moves there.','payday'],
  extrato:['Where money left after bills, goals, and spending should go, like a high-yield savings account. Leave it alone to keep extra where paychecks land.','payday'],
  fixed:['Bills that repeat every month. Tap Pay when one goes out. Tap Paid ✓ to undo.','bills'],
  goals:['Each goal holds money for something specific. Priority decides which goal the plan funds first when money is tight.','goal'],
  unassigned:['Money in an account that isn’t set aside for any goal. Goals can only use money that’s really there.','move'],
  gmove:['Moves money from one goal to another, or back to unassigned. If both goals are in the same account, nothing leaves the bank; only the label changes.','move'],
  subgoal:['Sub-goals split a big goal into payments, like one per semester. Each has its own amount and due date. “Moved in” is money already filled from the fund for that payment.','school'],
  parentpace:id=>{const g=S.goals.find(x=>x.id===id);if(!g)return null;const k=parentInfo(g),even=Math.ceil(k.remaining/monthsTo(g.date));
    return [`<p>Spreading the ${money(k.remaining)} still to save evenly until ${shortD(g.date)} would be ${money(even)}/month.</p>${k.perMonth>even&&k.nextShort?`<p style="margin-top:6px">But ${esc(k.nextShort.k.name)} is due ${shortD(k.nextShort.k.date)} and the fund is ${money(k.nextShort.gap)} short for it, so you need ${money(k.perMonth)}/month to have it ready in time.</p>`:`<p style="margin-top:6px">That pace also keeps each payment ready before its due date.</p>`}`,'schoolread']},
  covered:id=>{const g=S.goals.find(x=>x.id===id);if(!g)return null;const fp=famProgress(g),kd=r2(fp.aside-(g.done?0:g.saved));
    return [`<ul class="tiplist"><li><span>Paid (already went out)</span><b>${money(fp.paid)}</b></li><li><span>Saved in the fund</span><b>${money(g.done?0:g.saved)}</b></li><li><span>Moved into payments</span><b>${money(kd)}</b></li><li class="tot"><span>Covered</span><b>${money(fp.covered)}</b></li><li><span>Still to save</span><b>${money(fp.remaining)}</b></li></ul><p style="margin-top:6px">% paid = ${money(fp.paid)} ÷ ${money(g.target)}. % covered = ${money(fp.covered)} ÷ ${money(g.target)}.</p>`,'schoolread']},
  totalcost:['The full amount this goal needs, like the whole program. Change it with More → Edit.','schoolread'],
  paid:['Money that already went out for this goal’s payments. It’s spent, so it’s no longer in your accounts.','schoolread'],
  movedin:['How much of this payment’s amount has been filled from the fund so far. When it’s full, the payment is ready to pay.','schoolread'],
  readypay:['This payment has all its money. Tap Mark paid when you actually pay it.','school'],
  keptin:['The real account where this goal’s money sits. Nothing is a separate account in your bank; the app just labels part of that balance for this goal.','move'],
  pace:id=>{const g=S.goals.find(x=>x.id===id);if(!g)return null;const k=goalInfo(g);return [`<p>${money(k.remaining)} still to save ÷ about ${Math.max(1,Math.round(monthsTo(g.date)))} month${Math.round(monthsTo(g.date))===1?'':'s'} until ${shortD(g.date)} ≈ <b>${money(k.perMonth)}/month</b>.</p><p style="margin-top:6px">It updates as you add money or change the date.</p>`,'goal']},
  prioritywarn:['Your income this month isn’t enough to fund every goal at its full pace. Higher goals get funded first. Raise this goal’s priority, push its date back, or free up money in the plan.','goal'],
  buyby:['When you need the money. The app spreads what’s left over the months until then to get the monthly amount.','goal'],
  bank:['Group accounts by the bank or app they live in, like Capital One or ESFCU. Each bank shows its total, and each account shows how its money is split between goals and unassigned.','move'],
  catacct:['If you keep a separate account for this kind of spending, like a Capital One bucket for food, pick it here. New purchases in this category default to it, and the dashboard warns you if the account runs lower than what’s left in the budget.'],
  bucketwarn:['This account is linked to these categories in Settings. Its real balance (minus anything set aside for goals) is less than what you still plan to spend from it this month, so a purchase could come up short.'],
  fund:['The fund is the main pot for this goal. Add money here over time. Before a payment is due, Fill from fund moves what that payment needs into it. Nothing leaves your bank until you Mark paid.','schoolread'],
  coveredfund:['The fund has enough for this payment, after first setting aside what the earlier payments need. Fill from fund moves it over when you’re ready.','schoolread'],
  kidshort:['Payments are covered in date order. After the earlier ones take what they need, the fund is this much short for this one. Add money to the fund before the due date.','schoolread'],
  funded:['Everything for this goal is saved. Pay it whenever you’re ready.'],
  pastdue:['The date passed before this was fully funded. Push the date back, or add money and pay it.'],
  gstat:id=>{const g=S.goals.find(x=>x.id===id);if(!g)return null;const k=goalInfo(g);const d=k.diff;
    return [`<p>Saving evenly from when you started to ${shortD(g.date)}, you’d have <b>${money(k.expected)}</b> by today. You have <b>${money(k.cur)}</b>.</p><p style="margin-top:6px">${Math.abs(d)<1?'You’re right on pace.':d<0?`That’s <b>${money(-d)} behind</b>. Add ${money(-d)} to catch up now, or keep saving ${money(k.perMonth)}/month and you’ll still finish on time.`:`That’s <b>${money(d)} ahead</b>. You could ease off a little, or keep going and finish early.`}</p><p style="margin-top:6px">The ▲ mark on the bar (today’s target) shows where you should be today.</p>`,'goal']},
  behind:['You’ve covered less than you should have by now if you saved evenly toward the finish date. The ▲ mark on the bar (today’s target) shows where you should be today. and the monthly amount catches you up.','goal'],
  ontrack:['Saved about as much as expected by now, or more.'],
  debtstart:['How much you owed when the loan started. With it, the app shows what share you’ve paid off.','loan'],
  accrue:['For loans that charge interest monthly, like a car loan or mortgage. Part of each payment is counted as interest, so only the rest moves your progress. Check the exact balance at the monthly close.','loan'],
  interest:['Estimated from your APR each month you pay. The monthly close is where you confirm the real balance.','loan'],
  planned:['Money you saved in a goal and then spent on it, like a tuition payment. It was planned, so it doesn’t count as overspending.','school'],
  savingsrate:['The share of income you didn’t spend. Moving money to savings, goals, or investments counts as keeping it.'],
  dash:['Show, hide, or reorder the cards on your dashboard. Pin a goal or a loan to keep its progress in view.','dash'],
  closewhy:['Closing a month confirms your balances against your bank and locks that month, so later edits can’t change your history by accident.','close'],
  locked:['Closed months are read-only. If you find a mistake, reopen the most recent closed month, fix it, and close it again.','close'],
  partitions:['Shows how each account’s money is split between goals, with the rest unassigned.','move'],
  correction:['If a balance here doesn’t match your bank, change it. The difference is saved as a dated correction in Activity.','fix'],
  opened:['Entries start from today, so use today’s balance. Anything earlier is already included in it.'],
  framework:['The method your plan follows. It sets the groups and target percentages your plan is measured against. Conscious Spending Plan: fixed costs 50–60%, investments 10%, savings 5–10%, guilt-free spending 20–35%. You can switch any time; your data stays the same.','planread'],
  pctnet:['Each budget as a share of your net income: take-home pay plus extra income.'],
  freq:['For bills that don’t come every month, like car registration once a year or tuition in January and August. The plan spreads them out as a monthly amount.','bills'],
  ends:['For payment plans with a set number of payments. After this month the bill stops showing up.','bills'],
  roll:['If you spend less than this budget, the leftover is added to next month’s budget for the same category.'],
  backup:['A backup is a file with everything in the app. Restoring it brings everything back, even on another device.'],
  goesto:['Pick an account if this money moves somewhere instead of being spent, like a Roth IRA or a loan. Loan payments here also get interest handled automatically.','loan']
};
function tipOf(k){const i=k.indexOf(':'),n=i<0?k:k.slice(0,i),t=TIPS[n];if(!t)return null;return typeof t==='function'?t(i<0?'':k.slice(i+1)):t}
function tip(k){if(!S.tips||!TIPS[k.split(':')[0]])return '';return `<button class="tip" data-tip="${k}" aria-label="What does this mean?" type="button">?</button>`}
function showTip(btn){
  const pop=document.getElementById('tipPop');let t=null;try{t=tipOf(btn.dataset.tip)}catch(e){}if(!t)return;
  pop.innerHTML=`${t[0].startsWith('<')?t[0]:`<p>${t[0]}</p>`}${t[1]?`<button class="learn" data-go="help" data-help="${t[1]}">Learn more</button>`:''}`;
  pop.hidden=false;const r=btn.getBoundingClientRect(),w=Math.min(300,window.innerWidth-24);
  pop.style.width=w+'px';pop.style.left=Math.max(12,Math.min(window.innerWidth-w-12,r.left+r.width/2-w/2))+'px';
  const below=r.bottom+8+pop.offsetHeight<window.innerHeight;
  pop.style.top=(below?r.bottom+8:Math.max(8,r.top-8-pop.offsetHeight))+'px';
  pop.dataset.for=btn.dataset.tip;
}
document.addEventListener('click',e=>{if(UI.menu&&!e.target.closest('.menu,[data-menu]')){UI.menu=false;const m=document.querySelector('.menu');if(m)m.remove();const b=document.querySelector('[data-menu]');if(b)b.setAttribute('aria-expanded','false')}},true);
const hideTip=()=>{const p=document.getElementById('tipPop');if(p)p.hidden=true};
document.addEventListener('click',e=>{
  const b=e.target.closest('.tip');
  if(b){e.preventDefault();e.stopPropagation();const p=document.getElementById('tipPop');if(!p.hidden&&p.dataset.for===b.dataset.tip)hideTip();else showTip(b);return}
  const l=e.target.closest('#tipPop .learn');
  if(l){e.stopPropagation();hideTip();resetUI();closeSheet();closeModal();S.view='help';UI.help=l.dataset.help;render();window.scrollTo(0,0);const el=document.getElementById('help-'+UI.help);if(el)el.scrollIntoView({block:'start'});return}
  if(!e.target.closest('#tipPop'))hideTip();
},true);
window.addEventListener('scroll',hideTip,{passive:true});

/* ---------- help ---------- */
const GUIDES=[
  {id:'log',t:'Log a purchase, paycheck, or transfer',s:['Tap + at the bottom of any screen.','Type the amount, then pick the category and the account you paid with. Vendors you’ve used before fill in their usual category.','For a paycheck, switch to Income. You’ll get a suggested split for bills and goals.','Made a mistake? Tap Undo on the message that pops up. Later, find the entry in Activity and tap it to see its details. Edit shows you a before-and-after to confirm, and Delete asks you to type the word delete, so nothing changes by accident.'],go:['activity','Open Activity']},
  {id:'bills',t:'Pay a bill',s:['Fixed costs are listed on the dashboard.','Tap Pay when a bill goes out. If this month’s amount was different, change it before confirming.','Tap Paid ✓ to undo a payment.','Add, change, or remove bills in Settings under Fixed costs. Bills that aren’t monthly can be set to every 3 months, once a year, or specific months, and payment plans can end after a set month.'],go:['home','Open dashboard']},
  {id:'payday',t:'Payday routine',s:['Log the paycheck with + → Income. The app offers a split right away.','The split comes from Settings: bills are your fixed costs, each goal gets its monthly pace, and spending money is your category budgets, all scaled to this paycheck. Whatever’s left is extra.','In Settings → Income and defaults, choose where spending money and extra should go. Leave them alone to keep that money where paychecks land.','Apply the split. A Payday transfers card lists the real moves to make in your bank. Tick each one as you do it.','Paid every two weeks? Bills, goal amounts, and spending money are only funded once per month. In a month with a third paycheck, those are already covered, so it all goes to extra.','If you remove an account in Settings, transfers to or from it drop off the list, and the split stops sending money there.'],go:['config','Open Settings']},
  {id:'movebudget',t:'Move budget between categories',s:['On the dashboard under Spending, tap Move budget.','Pick the category to move into, then type how much to take from one or more others. Each can only give what it has left.','It only changes this month. Next month goes back to your budgets in Settings.','If a purchase is bigger than what its category has left, the app asks you to move budget in before it saves, so nothing goes over. Accounts can never go below $0 or dip into money set aside for goals.'],go:['home','Open dashboard']},
  {id:'goal',t:'Save for something',s:['On Goals, create a goal with an amount, a date, and the account it’s kept in.','The app works out how much to set aside each month. Use Add money to put money in.','Goals at the top get funded first when money is tight. Use More → Raise priority to reorder.','When you buy it, tap Mark as bought and enter what you actually paid.'],go:['goals','Open Goals']},
  {id:'school',t:'Save for school and pay by semester',s:['Create one goal for the whole program, like "Grad school", with the total cost and a finish-by date.','Open More → Add a sub-goal for each payment, with its amount and due date.','Add money to the main goal (the fund) over time. The app keeps money ready before each due date.','Before a payment is due, tap Fill from fund on that sub-goal, then Mark paid when you pay. The big goal tracks how much is paid and covered.','When the last payment is done, tap Mark complete. Leftover money can go back to unassigned or to another goal.'],go:['goals','Open Goals']},
  {id:'loan',t:'Pay down a loan or mortgage',s:['In Settings → Accounts, add the loan as a Debt account with what you owe today, the APR, and the original amount.','Turn on "Add estimated interest when I make a payment" for loans that charge interest monthly.','In Settings → Fixed costs, add the monthly payment with Goes to set to the loan.','Each time you tap Pay, part goes to interest and the rest to principal, and the progress bar moves. Pin the loan to your dashboard to keep it in view.'],go:['accounts','Open Accounts']},
  {id:'move',t:'Move money between goals',s:['On a goal, open More → Move money.','Pick an amount and where it goes: another goal, the big goal it belongs to, or back to unassigned.','If both goals are kept in the same account, nothing moves at the bank; only the label changes.','You can undo a move right after making it.'],go:['goals','Open Goals']},
  {id:'close',t:'Close a month',s:['After a month ends, the dashboard reminds you to close it.','Review spending, then check each balance against your bank. If one is off, change it and the difference is recorded as a correction.','If you skipped months, they close oldest first.','Made a mistake? Reopen the most recent closed month from Activity → Past months, fix it, and close it again.'],go:['close','Close a month']},
  {id:'fix',t:'Fix a wrong balance',s:['Small differences are best fixed at the monthly close.','To fix one right now, go to Accounts, tap Edit, change the balance, and review.','The difference is saved as a dated correction in Activity, so your history stays honest.'],go:['accounts','Open Accounts']},
  {id:'dash',t:'Customize your dashboard',s:['Open Menu → Settings, then go to the Dashboard section.','Check or uncheck cards to show or hide them, and use the arrows to reorder.','To pin a goal or loan, use Pin on its card or the Pin picker in Settings. Finished goals leave the dashboard on their own.'],go:['config','Open Settings','dashsec']},
  {id:'planread',t:'Read your spending plan',s:['The plan card shows a typical month, not what you’ve spent so far. Spending is tracked in the Spending card.','Your take-home income (set in Settings) is split into groups. With the Conscious Spending Plan these are fixed costs, investments, savings, and guilt-free spending.','Each percentage is that group’s planned dollars divided by your take-home. $750 of bills on $2,500 take-home is 30%.','The filled bar is your plan. The outlined box is the target range. Ending inside the box means you’re within target.','What counts where: bills go in fixed costs unless you set them otherwise; pre-tax retirement and transfers to investment accounts are investments; this month’s goal contributions are savings; category budgets are guilt-free spending. Yearly bills and budgets count as one-twelfth per month.','Tap ? next to a group to see exactly which items are in it.','Unplanned is take-home that hasn’t been given a job yet. Overplanned means you’ve planned more than you take home.','The card follows whichever method you pick in Settings: Conscious Spending Plan, 50/30/20, zero-based, or your own groups and targets.'],go:['home','Open dashboard']},
  {id:'schoolread',t:'Read a goal with payments',s:['Total cost is the full amount of the goal, like the whole program.','Paid is money that already went out for its payments.','Saved, not paid yet is money in the fund plus money already moved into upcoming payments.','Covered = paid + saved. At 100% covered, the whole cost is taken care of, even if some payments are still in the future.','Still to save is what you haven’t saved yet. The monthly amount spreads it out, and goes up if an upcoming payment wouldn’t be ready in time.','Each payment shows Covered by fund when the fund can handle it after the earlier ones, or how much it’s short.'],go:['goals','Open Goals']},
  {id:'plan',t:'Change your plan',s:['Settings holds your framework, income, categories, fixed costs, accounts, and other assets.','Each section is locked. Tap Edit, make changes, then Review changes to confirm.','To walk through everything again, use Run setup again at the top of Settings. Your current settings are filled in, so you only change what’s different.'],go:['config','Open Settings']}
];
V.help=()=>{
  return `<button class="btn small ghost" data-go="home" style="margin-bottom:8px">Back to dashboard</button><h1>Help</h1>
  <p class="sub">Short guides for common tasks. Look for the ? next to anything on screen for a quick explanation.</p>
  ${S.gsHidden?`<div class="actions"><button class="btn ghost" data-act="gsShow">Show the getting-started checklist</button></div>`:''}
  <div class="panel" style="margin-top:16px">${GUIDES.map(g=>`<details class="guide" id="help-${g.id}" ${UI.help===g.id?'open':''}><summary>${esc(g.t)}</summary>
    <ol>${g.s.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>
    <button class="btn small" data-go="${g.go[0]}" ${g.go[2]?`data-anchor="${g.go[2]}"`:''}>${esc(g.go[1])}</button></details>`).join('')}</div>
  <h2>Starting over</h2>
  <div class="panel" style="padding:14px 16px">
    <p class="sub" style="font-size:14px;margin:0 0 10px">Run setup again to walk through your accounts, income, bills, and categories. Nothing changes until you confirm at the end.</p>
    <button class="btn ghost full" data-act="runSetup">Run setup again</button>
  </div>`;
};

/* ---------- setup ---------- */
const STEPS=[['welcome','Welcome'],['accounts','Accounts'],['income','Income'],['fixed','Fixed costs'],['categories','Categories'],['framework','Plan'],['review','Review']];
const SUGGEST={fixed:[['Rent',0],['Phone',0],['Car insurance',0],['Internet',0],['Tithe/offering',10]],categories:['Food','Gas','Fun','Clothes','Emergency','Gifts']};
function startSetup(rerun){
  UI.sd={rerun,accounts:draftFor('accounts'),income:draftFor('income'),fixed:draftFor('fixed'),categories:draftFor('categories'),framework:draftFor('framework')};
  UI.step=0;UI.setupErr=null;S.view='setup';
}
V.setup=()=>{
  if(!UI.sd)startSetup(!!S.setupDone);
  const st=STEPS[UI.step][0],sd=UI.sd;
  UI.sec='setup';UI.draft=sd[st]||null;
  const dots=`<div class="steps" aria-label="Step ${UI.step+1} of ${STEPS.length}">${STEPS.map((x,i)=>`<i class="${i<UI.step?'done':i===UI.step?'on':''}"></i>`).join('')}</div>`;
  const nav=(next,back)=>`<div class="actions setupnav">${UI.step>0?`<button class="btn ghost" data-act="sBack">Back</button>`:sd.rerun?`<button class="btn ghost" data-act="sCancel">Cancel</button>`:''}<button class="btn" data-act="sNext" style="flex:1">${next||'Next'}</button></div>`;
  let body='';
  if(st==='welcome')body=`<h1>${sd.rerun?'Run setup again':'Let’s set up your budget'}</h1>
    <p class="sub">${sd.rerun?'Your current settings are filled in. Change only what’s different. Nothing saves until you confirm on the last step.':'Five short steps. You can change any of this later in Settings.'}</p>
    <ol class="setuplist"><li><b>Accounts</b> where your money is, and what you owe</li><li><b>Income</b> you take home each month</li><li><b>Fixed costs</b> like rent and your phone</li><li><b>Categories</b> for everyday spending</li><li><b>Plan</b> the method your budget follows</li></ol>
    ${nav('Start')}`;
  if(st==='accounts'){const D=sd.accounts;
    body=`<h1>Your accounts</h1><p class="sub">Add checking, savings, cash apps, retirement, and anything you owe, like a credit card or loan. ${tip('opened')}</p>
    <div class="panel" style="padding:6px 16px 12px;margin-top:14px">${D.filter(a=>!a.archived).length?'':'<div class="empty">No accounts yet. Add the account your paycheck goes into first.</div>'}${acctEdit(D)}</div>${nav()}`}
  if(st==='income'){const D=sd.income,nd=poolAccts().filter(a=>a.type!=='debt'),pa=poolPay();
    if(!D.deposit||!nd.some(a=>a.id===D.deposit))D.deposit=(nd[0]||{}).id||null;
    if(!D.payDefault||!pa.some(a=>a.id===D.payDefault))D.payDefault=(pa[0]||{}).id||D.deposit;
    ['spendTo','extraTo'].forEach(k=>{if(D[k]&&!nd.some(a=>a.id===D[k]))D[k]=''});
    body=`<h1>Your income</h1><p class="sub">Your budget is built on what you actually take home each month.</p>
    <div class="panel" style="padding:6px 16px 12px;margin-top:14px">
      <label class="field"><span>Take-home pay, per month</span><input type="number" inputmode="decimal" data-df="net" value="${D.net||''}" placeholder="e.g. 2500"></label>
      <label class="field"><span>Average extra income, per month (optional)</span><input type="number" inputmode="decimal" data-df="extra" value="${D.extra||''}" placeholder="Side work, tutoring"></label>
      <label class="field"><span>Gross annual salary (optional)</span><input type="number" inputmode="decimal" data-df="grossAnnual" value="${D.grossAnnual||''}"></label>
      <label class="field"><span>Pre-tax retirement, per month (optional)</span><input type="number" inputmode="decimal" data-df="pretax" value="${D.pretax||''}"></label>
      <label class="field"><span>Paychecks go to</span><select data-df="deposit">${nd.map(a=>`<option value="${a.id}" ${a.id===D.deposit?'selected':''}>${esc(a.name)}</option>`).join('')}</select></label>
      <label class="field"><span>Purchases default to</span><select data-df="payDefault">${(pa.length?pa:nd).map(a=>`<option value="${a.id}" ${a.id===D.payDefault?'selected':''}>${esc(a.name)}</option>`).join('')}</select></label>
      ${['spendTo','extraTo'].map(k=>`<label class="field"><span>${k==='spendTo'?'Spending money goes to (optional)':'Extra goes to (optional)'} ${tip(k.toLowerCase())}</span><select data-df="${k}"><option value="">Keep it where paychecks land</option>${nd.map(a=>`<option value="${a.id}" ${a.id===D[k]?'selected':''}>${esc(a.name)}</option>`).join('')}</select></label>`).join('')}
    </div>${nav()}`}
  if(st==='fixed'){const D=sd.fixed,have=new Set(D.filter(f=>!f.archived).map(f=>f.name.toLowerCase()));
    const sug=SUGGEST.fixed.filter(([n])=>!have.has(n.toLowerCase()));
    body=`<h1>Fixed costs</h1><p class="sub">Bills that come every month. Loan payments and automatic savings go here too. ${tip('fixed')}</p>
    ${sug.length?`<div class="chips small" style="margin:12px 0 0">${sug.map(([n,p])=>`<button class="chip" data-act="sSuggest" data-sec="fixed" data-name="${esc(n)}" data-pct="${p}">+ ${esc(n)}</button>`).join('')}</div>`:''}
    <div class="panel" style="padding:6px 16px 12px;margin-top:12px">${D.filter(f=>!f.archived).length?'':'<div class="empty">None yet. Tap a suggestion or add your own.</div>'}${fixEdit(D)}</div>${nav()}`}
  if(st==='categories'){const D=sd.categories,have=new Set(D.filter(c=>!c.archived).map(c=>c.name.toLowerCase()));
    const sug=SUGGEST.categories.filter(n=>!have.has(n.toLowerCase()));
    body=`<h1>Spending categories</h1><p class="sub">The buckets your everyday spending goes into, each with a budget. ${tip('pctnet')}</p>
    ${sug.length?`<div class="chips small" style="margin:12px 0 0">${sug.map(n=>`<button class="chip" data-act="sSuggest" data-sec="categories" data-name="${esc(n)}">+ ${esc(n)}</button>`).join('')}</div>`:''}
    <div class="panel" style="padding:6px 16px 12px;margin-top:12px">${D.filter(c=>!c.archived).length?'':'<div class="empty">None yet. Tap a suggestion or add your own.</div>'}${catEdit(D)}</div>${nav()}`}
  if(st==='framework'){const D=sd.framework;
    body=`<h1>Your plan</h1><p class="sub">The method your budget is measured against. ${tip('framework')}</p>
    <div class="panel" style="padding:8px 16px 14px;margin-top:14px">${Object.entries(FW).filter(([k])=>k!=='custom').map(([k,f])=>`<button class="fwopt" data-act="dFw" data-fw="${k}" aria-pressed="${D.framework===k}"><b>${f.name}</b><span>${f.desc}</span></button>`).join('')}
    <p class="sub" style="font-size:13px;margin:8px 0 0">Want your own groups and targets? Choose Custom later in Settings.</p></div>${nav('Review')}`}
  if(st==='review'){const R=setupReview();
    body=`<h1>Review</h1>${R.err?`<div class="note">${esc(R.err.msg)} <button class="btn small ghost" data-act="sGoto" data-i="${R.err.step}">Fix it</button></div>`:''}
    ${R.secs.map(x=>`<h2>${x.name}</h2><div class="panel" style="padding:8px 16px">${x.ch.length?`<ul class="chlist">${x.ch.map(c=>`<li>${c}</li>`).join('')}</ul>`:'<p class="sub" style="font-size:14px;margin:6px 0">No changes</p>'}</div>`).join('')}
    <p class="sub" style="font-size:13px;margin-top:12px">Changes apply from this month forward and go in the change log.</p>
    <div class="actions setupnav"><button class="btn ghost" data-act="sBack">Back</button><button class="btn" data-act="sSave" style="flex:1" ${R.err?'disabled':''}>${sd.rerun?'Save changes':'Finish setup'}</button></div>`}
  return `${dots}<div class="rowtop" style="align-items:center"><p class="lbl" style="margin:10px 0 0">Step ${UI.step+1} of ${STEPS.length}: ${STEPS[UI.step][1]}</p>${sd.rerun&&UI.step>0?`<button class="btn small ghost" data-act="sCancel" style="margin-top:8px">Cancel</button>`:''}</div>${body}`;
};
function setupReview(){
  const order=[['accounts','Accounts',1],['income','Income',2],['fixed','Fixed costs',3],['categories','Categories',4],['framework','Plan',5]];
  const secs=[],applies=[];let err=null;const keep=UI.draft;
  const realToast=toast;
  for(const [sec,name,step] of order){
    let msg=null;UI.draft=UI.sd[sec];
    toast=m=>{msg=m};
    let r;try{r=reviewSec(sec)}finally{toast=realToast}
    if(!r){err=err||{msg:msg||'Something needs fixing',step};secs.push({name,ch:[]});continue}
    secs.push({name,ch:r.ch});applies.push(r.apply);
  }
  UI.draft=keep;
  return {secs,applies,err};
}
function setupStepCheck(st){
  const sd=UI.sd;
  if(st==='accounts'){const L=sd.accounts.filter(a=>!a.archived);if(L.some(a=>!String(a.name||'').trim()))return 'Give every account a name';if(!L.some(a=>a.type!=='debt'))return 'Add at least one account that holds money, like checking'}
  if(st==='income'){if(!(sd.income.net>0))return 'Enter your take-home pay';if(!sd.income.deposit)return 'Pick where paychecks go'}
  if(st==='fixed'){const L=sd.fixed.filter(f=>!f.archived);if(L.some(f=>!String(f.name||'').trim()))return 'Give every fixed cost a name';if(L.some(f=>f.pct!=null?!(f.pct>0):!(f.amount>0)))return 'Each fixed cost needs an amount above zero';if(L.some(f=>!f.acct))return 'Pick which account pays each fixed cost'}
  if(st==='categories'){if(sd.categories.filter(c=>!c.archived).some(c=>!String(c.name||'').trim()))return 'Give every category a name'}
  return null;
}

function appBar(){
  if(S.view==='setup'||!S.setupDone)return '';
  const T={home:'Dashboard',trends:'Trends',goals:'Goals',activity:'Activity',accounts:'Accounts',config:'Settings',help:'Help',close:'Close a month',log:'Change log'};
  const items=[['accounts','Accounts','▦'],['config','Settings','⚙︎'],['log','Change log','≡'],['help','Help','?']].concat(closeTarget()?[['close','Close '+monthName(mDate(closeTarget())),'🔒']]:[]);
  return `<div class="appbar"><span class="brand">Ledger</span><button class="menubtn" data-menu aria-expanded="${!!UI.menu}" aria-label="Menu">☰ Menu</button></div>
    ${UI.menu?`<div class="menu" role="menu">${items.map(([v,l,i])=>`<button role="menuitem" data-go="${v}" ${S.view===v?'aria-current="page"':''}><span class="mi">${i}</span>${esc(l)}</button>`).join('')}</div>`:''}`;
}
function render(){
  MEMO=null;const y=window.scrollY||0,same=lastView===S.view;lastView=S.view;
  const app=document.getElementById('app');app.dataset.view=S.view;app.innerHTML=appBar()+V[S.view]();
  document.querySelectorAll('nav [data-view]').forEach(b=>{if(b.dataset.view===S.view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  if(same&&window.scrollTo)window.scrollTo(0,y);
  const gd=document.getElementById('gDate');if(gd){const d=new Date(now);d.setMonth(d.getMonth()+6);gd.value=d.toISOString().slice(0,10)}
  save();
}

/* ---------- goal money movement ---------- */
function moveGoalMoney(g,to,v,quiet){
  v=r2(v);if(!(v>0))return {err:'Enter an amount'};
  if(v>g.saved+0.004)return {err:`${g.name} only has ${money(g.saved,true)} set aside`};
  if(to==='unassigned'){const nt=addTx({date:todayISO,kind:'unassign',goal:g.id,acct:g.acct,amount:v});if(!quiet)logIt([`Moved ${money(v,true)} from ${g.name} to unassigned`]);return {tx:nt,msg:`${money(v,true)} moved back to unassigned`}}
  const y=goal(to);if(!y||y.done)return {err:'Pick a goal that’s still open'};
  if(y.id===g.id)return {err:'Pick a different goal'};
  const intoOwnFund=g.parent===y.id;
  const room=intoOwnFund?Infinity:isParent(y)?famProgress(y).remaining:r2(y.target-y.saved);
  if(v>room+0.004)return {err:`${y.name} only needs ${money(room,true)} more. Pick somewhere else for the rest.`};
  if(g.acct!==y.acct){const src=acct(g.acct);if(src&&v>src.balance+0.004)return {err:`${src.name} only has ${money(src.balance,true)}`}}
  const nt=addTx({date:todayISO,kind:'gmove',gFrom:g.id,gTo:y.id,acctFrom:g.acct,acctTo:y.acct,amount:v});
  if(!quiet)logIt([`Moved ${money(v,true)} from ${g.name} to ${y.name}`+(g.acct!==y.acct?` (${aName(g.acct)} → ${aName(y.acct)})`:'')]);
  return {tx:nt,msg:`${money(v,true)} moved to ${y.name}`};
}
function contributeGoal(g,v,from){
  const need=isParent(g)?famProgress(g).remaining:r2(g.target-g.saved);
  if(v>need+0.004){toast(`${g.name} only needs ${money(need,true)} more`);return false}
  if(from==='unassigned'){
    const free=unassigned(g.acct);
    if(v>free+0.004){toast(`Only ${money(free,true)} is unassigned in ${aName(g.acct)}`);return false}
    addTx({date:todayISO,kind:'assign',acct:g.acct,goal:g.id,amount:v});
  } else {
    const src=acct(from);
    if(v>src.balance+0.004){toast(`${src.name} only has ${money(src.balance,true)}`);return false}
    if(assigned(src.id)>0&&v>unassigned(src.id)+0.004){toast(`Only ${money(unassigned(src.id),true)} in ${src.name} isn\u2019t set aside for other goals`);return false}
    addTx({date:todayISO,kind:'transfer',from,to:g.acct,goal:g.id,amount:v});
  }
  if(!isParent(g))milestone(g,(g.saved-v)/g.target,g.saved/g.target);
  return true;
}
function milestone(g,before,after){
  if(!S.notif.goals)return;
  if(before<1&&after>=1)setTimeout(()=>notify(g.name+' is fully funded','You can buy it whenever you\u2019re ready.'),700);
  else if(before<.75&&after>=.75)setTimeout(()=>notify(g.name+' is 75% funded',money(g.target-g.saved)+' to go.'),700);
  else if(before<.5&&after>=.5)setTimeout(()=>notify(g.name+' is halfway there',money(g.target-g.saved)+' to go.'),700);
}

/* ---------- paycheck split ---------- */
const routeAcct=id=>{const a=id&&acct(id);return a&&!a.archived&&a.type!=='debt'?a.id:null};
function splitDone(m){const L=((S.splitLog||{})[m]||[]),o={fixed:0,spend:0,g:{}};L.forEach(b=>{o.fixed+=b.fixed||0;o.spend+=b.spend||0;Object.entries(b.g||{}).forEach(([k,v])=>o.g[k]=(o.g[k]||0)+v)});return o}
function splitFor(v,depositId,m){
  m=m||thisM;const share=S.plan.income>0?v/S.plan.income:0,done=splitDone(m);
  const pctPart=r2(liveFixed().filter(f=>f.pct&&!ended(f)).reduce((a,f)=>a+v*f.pct/100,0));
  const fixedMonth=r2(liveFixed().filter(f=>!f.pct).reduce((a,f)=>a+fixedPlan(f),0));
  const fixedAmt=r2(Math.max(0,Math.min(fixedMonth*share,fixedMonth-done.fixed)));
  const fixedPart=r2(fixedAmt+pctPart);
  let avail=r2(v-fixedPart);
  const alloc=[];
  topGoals().forEach(g=>{if(!routeAcct(g.acct))return;const k=goalInfo(g);const monthLeft=Math.max(0,k.perMonth-(done.g[g.id]||0));const want=Math.min(Math.round(k.perMonth*share),monthLeft,k.remaining);const amt=r2(Math.max(0,Math.min(want,avail)));if(amt>0){alloc.push({g,amt});avail=r2(avail-amt)}});
  const budgets=liveCats().reduce((a,c)=>a+(c.type==='monthly'?c.budget:c.budget/12),0);
  const spend=r2(Math.max(0,Math.min(avail,budgets*share,budgets-done.spend)));avail=r2(avail-spend);
  const capped=done.fixed>0&&fixedAmt<fixedMonth*share-0.5;
  return {share,fixedPart,fixedAmt,alloc,spend,extra:avail,capped,spendTo:routeAcct(S.plan.spendTo),extraTo:routeAcct(S.plan.extraTo)};
}
function gsSteps(){
  const ef=S.goals.some(g=>g.emergency);
  return [
    {k:'banks',t:'Tag each account with its bank',d:'Settings → Accounts → Edit, then fill in “Bank or app” so the Accounts page groups them.',done:liveAccts().some(a=>a.bank),go:['config','acctsec']},
    {k:'route',t:'Choose where spending money and extra go',d:'Settings → Income and defaults. The paycheck split uses these.',done:!!(routeAcct(S.plan.spendTo)||routeAcct(S.plan.extraTo)),go:['config','incsec'],opt:true},
    {k:'link',t:'Link categories to their buckets',d:'Settings → Categories → “Usually paid from”. Only needed for categories with their own account.',done:liveCats().some(c=>c.acct),go:['config','catsec'],opt:true},
    {k:'ef',t:'Start your emergency fund',d:'Goals suggests a target from your bills.',done:ef,go:['goals']},
    {k:'goals',t:'Add your other goals',d:'Grad school, a trip, anything with a target and a date.',done:topGoals().some(g=>!g.emergency),go:['goals']},
    {k:'card',t:'Set up your credit card',d:'Settings → Accounts: add it as a debt, then turn on “This is a credit card”.',done:liveAccts().some(a=>a.card),go:['config','acctsec'],opt:true},
    {k:'pin',t:'Set an app passcode',d:'Settings → Security. Add your email first so you can reset it.',done:!!(S.sec&&S.sec.hash),go:['config','secsec'],opt:true},
    {k:'split',t:'Log a paycheck and apply the split',d:'Tap +, choose Income, then Apply split.',done:!!(S.did||{}).split},
    {k:'transfers',t:'Make your payday transfers',d:'Tick each one on the Payday transfers card as you do it in your bank.',done:!!(S.did||{}).transfers},
    {k:'purchase',t:'Log a purchase',d:'Tap +, type the amount, pick a category.',done:!!(S.did||{}).purchase},
    {k:'checkin',t:'Do your first weekly check-in',d:'It shows up on the dashboard every 7 days.',done:!!S.lastCheck},
    {k:'close',t:'Close your first month',d:'After the month ends, compare balances with your bank.',done:!!(S.did||{}).close}
  ].map(x=>Object.assign(x,{skipped:!x.done&&(S.gsSkip||[]).includes(x.k)}));
}
function essentials(){
  const fx=liveFixed().filter(f=>(f.role||'need')==='need'&&!ended(f)).reduce((a,f)=>a+fixedPlan(f),0);
  const cs=liveCats().filter(c=>c.role==='need').reduce((a,c)=>a+(c.type==='monthly'?c.budget:c.budget/12),0);
  return {fx:r2(fx),cs:r2(cs),month:r2(fx+cs),target:Math.ceil((fx+cs)*3/50)*50};
}
function offerSplit(v,depositId){
  if(!(S.plan.income>0))return;
  const P=splitFor(v,depositId),dep=aName(depositId),pct=Math.round(P.share*100);
  const moves=[];
  P.alloc.forEach(x=>{if(x.g.acct!==depositId)moves.push({label:x.g.name,from:depositId,to:x.g.acct,amount:x.amt,goal:x.g.id})});
  if(P.spendTo&&P.spendTo!==depositId&&P.spend>0.004)moves.push({label:'Spending money',from:depositId,to:P.spendTo,amount:P.spend});
  if(P.extraTo&&P.extraTo!==depositId&&P.extra>0.5)moves.push({label:'Extra',from:depositId,to:P.extraTo,amount:P.extra});
  const lines=[`<span class="sl">This check is ${pct}% of your ${money(S.plan.income)} monthly take-home, so each amount is that share of what’s in Settings${P.capped?'. Earlier paychecks already covered part of this month, so those amounts are capped and the rest becomes extra':''}.</span>`,
    `<b>Bills</b> ${money(P.fixedPart,true)}, stays in ${esc(dep)} <small>your fixed costs</small>`]
    .concat(P.alloc.map(x=>`<b>${esc(x.g.name)}</b> ${money(x.amt,true)}${x.g.acct!==depositId?' → '+esc(aName(x.g.acct)):', set aside in '+esc(dep)} <small>its monthly pace</small>`))
    .concat([`<b>Spending money</b> ${money(P.spend,true)}${P.spendTo&&P.spendTo!==depositId?' → '+esc(aName(P.spendTo)):', stays in '+esc(dep)} <small>your category budgets</small>`])
    .concat(P.extra<-0.5?[`<b>Short</b> ${money(-P.extra,true)}: this check doesn’t cover its share of bills and goals`]:P.extra>0.5?[`<b>Extra</b> ${money(P.extra,true)}${P.extraTo&&P.extraTo!==depositId?' → '+esc(aName(P.extraTo)):', stays in '+esc(dep)} <small>what’s left</small>`]:[])
    .concat(moves.length?(()=>{const n=new Set(moves.map(m=>m.from+'>'+m.to)).size;return [`You’ll get a checklist of the ${n} transfer${n===1?'':'s'} to make in your bank.`]})():[]);
  setTimeout(()=>confirmBox(`Split this ${money(v)} paycheck?`,lines,'Apply split',()=>{
    const made=[];
    P.alloc.forEach(x=>{const before=x.g.saved/x.g.target;
      made.push(x.g.acct===depositId?addTx({date:todayISO,kind:'assign',acct:depositId,goal:x.g.id,amount:x.amt}):addTx({date:todayISO,kind:'transfer',from:depositId,to:x.g.acct,goal:x.g.id,amount:x.amt}));
      milestone(x.g,before,x.g.saved/x.g.target)});
    moves.filter(m=>!m.goal).forEach(m=>made.push(addTx({date:todayISO,kind:'transfer',from:m.from,to:m.to,amount:m.amount,note:m.label})));
    const batch=id();
    const ML=(S.splitLog=S.splitLog||{})[thisM]=(S.splitLog[thisM]||[]);ML.push({batch,fixed:P.fixedAmt,spend:P.spend,g:Object.fromEntries(P.alloc.map(x=>[x.g.id,x.amt]))});
    const grp={};moves.forEach(m=>{const k=m.from+'>'+m.to;(grp[k]=grp[k]||{from:m.from,to:m.to,parts:[]}).parts.push(m)});
    const items=Object.values(grp).map((g,n)=>({id:batch+n,batch,date:todayISO,label:g.parts.length===1?g.parts[0].label:g.parts.map(p=>p.label+' '+money(p.amount,true)).join(', '),from:g.from,to:g.to,amount:r2(g.parts.reduce((a,p)=>a+p.amount,0)),done:false}));
    S.payday=(S.payday||[]).filter(x=>!x.done).concat(items);(S.did=S.did||{}).split=true;if(!items.length)(S.did=S.did||{}).transfers=true;
    logIt(['Split a '+money(v)+' paycheck'+(items.length?', '+items.length+' transfer'+(items.length===1?'':'s')+' to make':'')]);
    render();toast('Paycheck split applied',()=>{made.slice().reverse().forEach(t=>removeTx(t));S.payday=S.payday.filter(x=>x.batch!==batch);if(S.splitLog&&S.splitLog[thisM])S.splitLog[thisM]=S.splitLog[thisM].filter(b=>b.batch!==batch);render();toast('Split undone')})},{cancel:'Not now'}),350);
}

/* ---------- events ---------- */
document.querySelector('nav').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b&&!S.setupDone){toast('Finish setup first. It only takes a few minutes.');return}if(b){resetUI();S.view=b.dataset.view;render();window.scrollTo(0,0)}});
const NUMF=['budget','amount','pct','day','apr','min','balance','value','start','stmt'];
function bindDraft(t){
  if(t.dataset.dm!==undefined&&UI.draft){const x=UI.draft[+t.dataset.i],n=+t.dataset.dm;x.months=(x.months||[]).filter(v=>v!==n);if(t.checked)x.months.push(n);x.months.sort((a,b)=>a-b);return false}
  if(t.dataset.d!==undefined&&UI.draft){const x=UI.draft[+t.dataset.i],f=t.dataset.d;
    if(f==='mode'){if(t.value==='pct'){x.pct=x.pct!=null?x.pct:10;delete x.amount}else{x.amount=x.amount!=null?x.amount:0;delete x.pct}return true}
    if(t.type==='checkbox'){x[f]=t.checked;return !!t.dataset.rr}
    if(f==='freq'){x.freq=t.value;if(t.value==='months'&&!(x.months||[]).length)x.months=[+thisM.slice(5,7)];if((t.value==='quarterly'||t.value==='yearly')&&!x.begins)x.begins=thisM;return true}
    x[f]=NUMF.includes(f)?(t.value===''?'':(f==='balance'?parseFloat(t.value):Math.max(0,parseFloat(t.value)||0))):t.value;return !!t.dataset.rr}
  if(t.dataset.df!==undefined&&UI.draft){const k=t.dataset.df;UI.draft[k]=['income','grossAnnual','pretax','net','extra'].includes(k)?Math.max(0,parseFloat(t.value)||0):t.value;return false}
  if(t.dataset.cb!==undefined&&UI.draft){const b=UI.draft.custom[+t.dataset.i];b[t.dataset.cb]=t.dataset.cb==='name'?t.value:(parseFloat(t.value)||0);return false}
  return false;
}
document.getElementById('app').addEventListener('input',e=>{const t=e.target;bindDraft(t);
  if(t.id==='fq'){F.q=t.value;document.getElementById('actList').innerHTML=activityList()}
  if(t.id==='logq'){LG.q=t.value;const p=t.selectionStart;render();const n=document.getElementById('logq');if(n){n.focus();try{n.setSelectionRange(p,p)}catch(e){}}}});
document.getElementById('app').addEventListener('change',e=>{const t=e.target;
  if(t.dataset.n){S.notif[t.dataset.n]=t.checked;save();return}
  if(t.id==='secAfter'){SEC().lockAfter=+t.value;logIt(['Auto-lock set to '+t.options[t.selectedIndex].text.toLowerCase()]);save();toast('Auto-lock updated');return}
  if(t.id==='secEmail'){const v=t.value.trim();if(v&&!/^\S+@\S+\.\S+$/.test(v)){toast('That email doesn’t look right');return}const o=SEC().email||'';if(v!==o){SEC().email=v;logIt(['Account email '+(o?'changed':'added')]);render();toast('Email saved')}return}
  if(t.dataset.pd){const x=(S.payday||[]).find(y=>y.id===t.dataset.pd);if(x){x.done=t.checked;if(S.payday.every(y=>y.done)){(S.did=S.did||{}).transfers=true;toast('All transfers made')}render()}return}
  if(t.id==='restoreFile'&&t.files&&t.files[0]){const fr=new FileReader();fr.onload=()=>{let d;try{d=JSON.parse(fr.result);d=d&&d.data?d.data:d}catch(e){d=null}
    if(!d||!d.plan||!Array.isArray(d.accounts)||!Array.isArray(d.tx)){toast('That file isn’t a Ledger backup');t.value='';return}
    confirmBox('Restore this backup?',[`${d.tx.length} entries and ${d.accounts.length} accounts`,'Replaces everything in the app right now','Download a backup first if you want to keep what’s here'],'Restore',()=>{resetUI();wipeSheet();{const keep=S.sec;S=d;sanitize();if(keep)S.sec=keep;else delete S.sec}S.view='home';S.log.push({ts:Date.now(),text:'Restored from a backup'});render();window.scrollTo(0,0);toast('Backup restored')},{danger:true});t.value=''};fr.readAsText(t.files[0]);return}
  if(t.dataset.tips){S.tips=t.checked;logIt(['Help tips turned '+(t.checked?'on':'off')]);render();return}
  if(t.dataset.dshow){const k=t.dataset.dshow;S.dash.hidden=t.checked?S.dash.hidden.filter(x=>x!==k):S.dash.hidden.concat(k);logIt(['Dashboard — '+(t.checked?'showing ':'hiding ')+(DASH_CARDS[k]||k)]);save();return}
  if(t.dataset.trcat!==undefined){delete CH.cat;TR.cat=t.value;render();return}
  if(t.dataset.filter){const k=t.dataset.filter;if(k==='month')setMonth(t.value);else{F[k]=t.value;if(k==='year')F.month='all'}render();return}
  if(bindDraft(t))render();});
document.getElementById('app').addEventListener('click',e=>{
  const hit=e.target.closest('[data-hit]');if(hit){selectPoint(hit.dataset.hit,+hit.dataset.i);return}
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.pickmonth){setMonth(t.dataset.pickmonth);render();const l=document.getElementById('actList');if(l)l.scrollIntoView({block:'start'});return}
  if(t.dataset.logk){LG.k=t.dataset.logk;render();return}
  if(t.dataset.logall){LG.all[t.dataset.logall]=true;render();return}
  if(t.dataset.pickyear){F.year=t.dataset.pickyear;F.month='all';render();return}
  if(t.dataset.hb){const el=document.getElementById('hb-'+t.dataset.hb);const open=el.hidden;el.hidden=!open;t.setAttribute('aria-expanded',open);return}
  if(t.dataset.see){setMonth(t.dataset.see);F.cat=t.dataset.seecat||'all';F.q=t.dataset.seeq||'';F.type='all';F.acct='all';resetUI();S.view='activity';render();window.scrollTo(0,0);return}
  if(t.dataset.range){Object.keys(CH).forEach(k=>delete CH[k]);TR.range=t.dataset.range==='all'?'all':+t.dataset.range;render();return}
  if(t.dataset.menu!==undefined){UI.menu=!UI.menu;render();return}
  if(t.dataset.go){resetUI();S.view=t.dataset.go;if(t.dataset.help)UI.help=t.dataset.help;render();window.scrollTo(0,0);const an=t.dataset.anchor&&document.getElementById(t.dataset.anchor);if(an)an.scrollIntoView({block:'start'});return}
  if(t.dataset.txopen){UI.txOpen=UI.txOpen===t.dataset.txopen?null:t.dataset.txopen;render();return}
  if(t.dataset.txclose){UI.txOpen=null;render();return}
  if(t.dataset.del){
    const x=S.tx.find(y=>y.id===t.dataset.del);
    if(S.closed.includes(x.date.slice(0,7))){toast('That month is closed and can\u2019t be changed');return}
    {const rb=removeBlock(x);if(rb){toast(rb);return}}
    const lk=S.tx.filter(y=>y.link===x.id);
    {const g=guardTx([],[x].concat(lk));if(g){toast('Can’t delete this yet. '+g);return}}
    confirmBox('Delete this entry?',[`${esc(x.vendor||KIND_LABEL[x.kind]||'Entry')}, ${money(x.amount,true)} on ${fmtD(x.date)}`,'Account balances will be adjusted back'].concat(lk.length?[`The ${lk.map(y=>(KIND_LABEL[y.kind]||'linked entry').toLowerCase()).join(' and ')} that goes with it is deleted too`]:[]),'Delete entry',()=>{UI.txOpen=null;removeTx(x);logIt(['Deleted '+(x.vendor||KIND_LABEL[x.kind]||'entry')+', '+money(x.amount,true)+' on '+fmtD(x.date)]);render();toast('Entry deleted',()=>{restoreTx(x);logIt(['Restored '+(x.vendor||'entry')]);render();toast('Entry restored')})},{danger:true,word:'delete'});return}
  if(t.dataset.payfixed){
    const f=S.fixed.find(x=>x.id===t.dataset.payfixed);const amt=fixedOwe(f);
    confirmBox('Pay '+esc(f.name)+'?',[`From ${esc(aName(f.acct))}`+(f.to?` to ${esc(aName(f.to))}`:''),'Change the amount if this month\u2019s bill was different'],'Mark paid',v=>{
      if(!(v>0)){toast('Enter the amount paid');return}
      const base=Object.assign({date:todayISO,vendor:f.name,amount:r2(v),kind:'fixed',fixedId:f.id,acct:f.acct},f.to?{to:f.to}:{});
      {const g=guardTx([base]);if(g){toast(g);return}}
      let nt,note='';if(f.to&&acct(f.to).type==='debt'){const r=payDebt(base);if(r.err){toast(r.err);return}nt=r.tx;note=r.note}else nt=addTx(base);
      render();toast(`${f.name} paid from ${aName(f.acct)}.`+note,()=>{removeTx(nt);render();toast(f.name+' marked unpaid')})},{input:{label:'Amount paid',value:amt}});return}
  if(t.dataset.payold){
    const f=S.fixed.find(x=>x.id===t.dataset.payold),m=t.dataset.m,amt=fixedOwe(f,m);
    const last=new Date(mDate(m).getFullYear(),mDate(m).getMonth()+1,0).getDate(),dd=Math.min(f.day||last,last);
    confirmBox('Mark '+esc(f.name)+' paid for '+monthName(mDate(m))+'?',[`Dated ${fmtD(m+'-'+pad2(dd))}, from ${esc(aName(f.acct))}`+(f.to?` to ${esc(aName(f.to))}`:'')],'Mark paid',v=>{
      if(!(v>0)){toast('Enter the amount paid');return}
      {const ob=openedBlock(m+'-'+pad2(dd),[f.acct].concat(f.to||[]));if(ob){toast(ob);return}}
      const base=Object.assign({date:m+'-'+pad2(dd),vendor:f.name,amount:r2(v),kind:'fixed',fixedId:f.id,acct:f.acct},f.to?{to:f.to}:{});
      let nt,note='';if(f.to&&acct(f.to).type==='debt'){const r=payDebt(base);if(r.err){toast(r.err);return}nt=r.tx;note=r.note}else nt=addTx(base);
      render();toast(f.name+' marked paid.'+note,()=>{removeTx(nt);render()})},{input:{label:'Amount paid',value:amt}});return}
  if(t.dataset.unpay){
    const f=S.fixed.find(x=>x.id===t.dataset.unpay);const txs=S.tx.filter(x=>x.kind==='fixed'&&x.fixedId===f.id&&inMonth(x,thisM));const tot=txs.reduce((a,x)=>a+x.amount,0);
    confirmBox('Undo '+esc(f.name)+' payment?',[`${money(tot,true)} goes back to ${esc(aName(f.acct))}`,'It will show as unpaid again'],'Undo payment',()=>{txs.forEach(x=>removeTx(x));render();toast(f.name+' marked unpaid')});return}
  if(t.dataset.edit){openSheet(S.tx.find(x=>x.id===t.dataset.edit));return}
  if(t.dataset.viewmonth){setMonth(t.dataset.viewmonth);F.type='all';F.cat='all';F.acct='all';F.q='';render();window.scrollTo(0,0);return}
  if(t.id==='gCreate'){
    const n=document.getElementById('gName').value.trim(),a=parseFloat(document.getElementById('gAmt').value),d=document.getElementById('gDate').value;
    if(!n||!(a>0)||!d){toast('Add a name, amount, and date');return}
    if(d<=todayISO){toast('Pick a buy-by date in the future');return}
    if(!document.getElementById('gAcct').value){toast('Add a savings or checking account in Settings first');return}
    const g={id:id(),name:n,target:a,saved:0,date:d,created:todayISO,acct:document.getElementById('gAcct').value,done:false};
    S.goals.push(g);logIt(['Created goal '+n+' ('+money(a)+' by '+fmtD(d)+')']);render();toast('Goal created: '+money(goalInfo(g).perMonth)+'/month');return}
  if(t.id==='testN'){notify('Food is at 84%','$48 left for the rest of the month.');return}
  if(t.id==='reset'){resetUI();wipeSheet();{const keep=S.sec;S=seed();if(keep)S.sec=keep}S.view='config';render();toast('Sample data restored');return}
  if(t.dataset.act)handleAct(t);
});

function handleAct(t){
  const a=t.dataset.act,g=t.dataset.id?goal(t.dataset.id):null;
  if(a==='cancel'){resetUI();render();return}
  if(a==='runSetup'){resetUI();startSetup(true);render();window.scrollTo(0,0);return}
  if(a==='sNext'){const st=STEPS[UI.step][0],e=setupStepCheck(st);if(e){toast(e);return}UI.step=Math.min(STEPS.length-1,UI.step+1);render();window.scrollTo(0,0);return}
  if(a==='sBack'){UI.step=Math.max(0,UI.step-1);render();window.scrollTo(0,0);return}
  if(a==='sGoto'){UI.step=+t.dataset.i;render();window.scrollTo(0,0);return}
  if(a==='sCancel'){resetUI();S.view='config';render();window.scrollTo(0,0);return}
  if(a==='sSuggest'){const sec=t.dataset.sec,n=t.dataset.name;
    if(sec==='fixed'){const pct=+t.dataset.pct;UI.sd.fixed.push(Object.assign({id:id(),name:n,acct:(poolPay()[0]||poolAccts()[0]||{}).id||null,role:'need'},pct?{pct}:{amount:0}))}
    else UI.sd.categories.push({id:id(),name:n,type:'monthly',budget:0,role:'want'});
    render();return}
  if(a==='sSave'){const R=setupReview();if(R.err){toast(R.err.msg);return}
    const n=R.secs.reduce((x,y)=>x+y.ch.length,0),rerun=UI.sd.rerun;
    R.applies.forEach(f=>f());S.setupDone=true;
    logIt([(rerun?'Setup run again':'Setup completed')+(n?`, ${n} change${n===1?'':'s'}`:', no changes')].concat(R.secs.flatMap(x=>x.ch.map(c=>'Setup — '+c.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>')))));
    resetUI();S.view='home';render();window.scrollTo(0,0);toast(rerun?(n?'Setup saved':'No changes made'):'You’re all set. Tap + to log your first entry.');return}
  if(a==='erase'){confirmBox('Erase everything and start fresh?',['Deletes every entry, account, goal, budget, and setting in this app','This can’t be undone','Setup starts right after'],'Erase everything',()=>{if(SEC().hash){lockOpen('verify','erase');return}doErase()},{danger:true});return}
  if(a==='reopen'){
    const K=t.dataset.m,list=S.closed.filter(m=>m>=K).sort().reverse(),snaps=list.map(m=>S.snapshots.find(x=>x.key===m)).filter(Boolean);
    const corr=snaps.flatMap(sn=>(sn.corr||[]).map(c=>Object.assign({m:sn.key},c)));
    const lines=[list.length>1?`Also reopens ${list.filter(m=>m!==K).reverse().map(m=>monthName(mDate(m))).join(', ')}, since later months build on it`:`Its entries become editable again`]
      .concat(corr.map(c=>`Undo ${c.asset?'update to':'correction to'} ${esc(c.asset?(S.assets.find(y=>y.id===c.asset)||{}).name:aName(c.id))} (${money(c.to-c.from,true)})`))
      .concat([`You’ll close ${list.length>1?'them':'it'} again when you’re done`]);
    confirmBox(`Reopen ${esc(monthName(mDate(K),{month:'long',year:'numeric'}))}?`,lines,list.length>1?`Reopen ${list.length} months`:'Reopen month',()=>{
      snaps.forEach(sn=>{(sn.corr||[]).forEach(c=>{if(c.asset){const x=S.assets.find(y=>y.id===c.asset);if(x)x.value=c.from}else if(c.tx){const t=S.tx.find(y=>y.id===c.tx);if(t)removeTx(t)}else{const x=acct(c.id);if(x)x.balance=r2(x.balance-(c.delta!=null?c.delta:c.to-c.from))}})});
      S.snapshots=S.snapshots.filter(x=>!list.includes(x.key));S.closed=S.closed.filter(m=>!list.includes(m));
      logIt([`Reopened ${list.slice().reverse().map(m=>monthName(mDate(m),{month:'short',year:'numeric'})).join(', ')}`+(corr.length?`, ${corr.length} close correction${corr.length>1?'s':''} undone`:'')]);
      render();toast(list.length>1?`${list.length} months reopened`:monthName(mDate(K))+' reopened')});return}
  if(a==='editSec'){resetUI();UI.sec=t.dataset.sec;UI.draft=draftFor(UI.sec);render();return}
  if(a==='dFw'){UI.draft.framework=t.dataset.fw;render();return}
  if(a==='dUp'){const D=UI.draft,i=+t.dataset.i;let j=i-1;while(j>=0&&D[j].archived)j--;if(j>=0)[D[i],D[j]]=[D[j],D[i]];render();return}
  if(a==='dArch'){UI.draft[+t.dataset.i].archived=true;render();return}
  if(a==='dRestore'){UI.draft[+t.dataset.i].archived=false;render();return}
  if(a==='dDrop'){UI.draft.splice(+t.dataset.i,1);render();return}
  if(a==='dAdd'){const sec=t.dataset.sec;
    if(sec==='categories')UI.draft.push({id:id(),name:'',type:'monthly',budget:0,role:'want'});
    if(sec==='fixed')UI.draft.push({id:id(),name:'',amount:0,acct:(poolPay()[0]||poolAccts()[0]||{}).id||null,role:'need'});
    if(sec==='accounts')UI.draft.push({id:id(),name:'',type:'checking',balance:0,pay:true,opened:todayISO});
    if(sec==='assets')UI.draft.push({id:id(),name:'',value:0});
    render();const ins=document.querySelectorAll('[data-d="name"]');if(ins.length)ins[ins.length-1].focus();return}
  if(a==='reviewSec'){const sec=t.dataset.sec,r=reviewSec(sec);if(!r)return;
    if(!r.ch.length){toast('No changes to save');return}
    confirmBox('Save '+SECS[sec].toLowerCase()+' changes?',r.ch,'Save changes',()=>{r.apply();logIt(r.ch.map(c=>SECS[sec]+' — '+c.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')));resetUI();render();toast(SECS[sec]+' updated')});return}
  if(a==='editAccts'){resetUI();UI.editAccts=true;render();return}
  if(a==='editGoal'){resetUI();UI.editGoal=g.id;render();return}
  if(a==='addTo'){resetUI();UI.addTo=g.id;render();const i=document.getElementById('addAmt');if(i)i.focus();return}
  if(a==='doAdd'){
    const v=parseFloat(document.getElementById('addAmt').value);if(!(v>0)){toast('Enter an amount');return}
    const from=document.getElementById('addFrom').value;
    if(contributeGoal(g,v,from)){resetUI();render();toast(`${money(v,true)} added to ${g.name}`)}return}
  if(a==='efMake'){const E=essentials(),ac=document.getElementById('efAcct').value;if(!ac){toast('Add a savings account in Settings first');return}
    const d=new Date(now.getFullYear()+1,now.getMonth(),1),g={id:id(),name:'Emergency fund',target:E.target,saved:0,date:iso(d.getFullYear(),d.getMonth()+1,1),created:todayISO,acct:ac,done:false,emergency:true};
    S.goals.unshift(g);logIt(['Created Emergency fund ('+money(E.target)+', 3 months of essentials) at top priority']);render();toast('Emergency fund created: '+money(goalInfo(g).perMonth)+'/month',()=>{S.goals=S.goals.filter(x=>x!==g);render();toast('Removed')});return}
  if(a==='efNo'){S.efDismiss=true;render();toast('Hidden. You can create one anytime below.');return}
  if(a==='efSync'){const g=goal(t.dataset.id),E3=essentials().target,T=Math.max(E3,Math.ceil(g.saved));confirmBox('Update emergency fund target?',[`${money(g.target)} → ${money(T)}`,T>E3?`You already have ${money(g.saved)} saved, more than 3 months (${money(E3)}), so the target stays at what you have`:'3 months of essential bills and need categories from Settings'],'Update target',()=>{logIt([g.name+' target: '+money(g.target)+' → '+money(T)]);g.target=T;render();toast('Target updated')});return}
  if(a==='gsSkip'){S.gsSkip=(S.gsSkip||[]).concat(t.dataset.k);render();return}
  if(a==='gsHide'){confirmBox('Hide the getting-started checklist?',['You can bring it back from Help'],'Hide it',()=>{S.gsHidden=true;render();toast('Checklist hidden. Bring it back from Help.')});return}
  if(a==='gsShow'){S.gsHidden=false;resetUI();S.view='home';render();window.scrollTo(0,0);return}
  if(a==='checkDone'){S.lastCheck=todayISO;logIt(['Weekly check-in done']);render();toast('Nice. See you next week.');return}
  if(a==='pdClear'){const left=(S.payday||[]).filter(x=>!x.done).length;const go=()=>{S.payday=[];render()};if(left)confirmBox('Clear the transfer list?',[`${left} transfer${left===1?' isn’t':'s aren’t'} ticked yet`,'The app already counted them. If you skip one in your bank, fix the balance at the monthly close'],'Clear list',go);else go();return}
  if(a==='pinSet'){if(!SEC().email){toast('Add your account email first, so you can reset a forgotten passcode');const i=document.getElementById('secEmail');if(i)i.focus();return}lockOpen('set1','new');return}
  if(a==='pinChange'){lockOpen('verify','change');return}
  if(a==='pinOff'){lockOpen('verify','off');return}
  if(a==='lockNow'){lockOpen('unlock');return}
  if(a==='moveBudget'){
    if(S.closed.includes(thisM)){toast('This month is closed');return}
    const cs=liveCats().filter(c=>c.type==='monthly');const src=cs.filter(c=>catLeft(c,thisM)>0.004);
    if(cs.length<2){toast('Add at least two monthly categories first');return}
    if(!src.length){toast('No category has money left to move this month');return}
    confirmBox('Move budget for '+monthName(mDate(thisM)),['Shift money between categories for this month only','Next month goes back to the budgets in Settings'],'Move it',(v,to,mv)=>{
      const parts=Object.entries(mv||{}).filter(([,n])=>n>0);if(!parts.length){toast('Enter an amount to move');return}
      if(parts.some(([fid])=>fid===to)){toast('Pick a category to move into that isn’t one you’re taking from');return}
      for(const [fid,n] of parts){if(n>catLeft(cat(fid),thisM)+0.004){toast(`${cat(fid).name} only has ${money(catLeft(cat(fid),thisM),true)} left`);return}}
      const tot=r2(parts.reduce((a,[,n])=>a+n,0)),m=S.adj[thisM]=S.adj[thisM]||{};const snap=JSON.stringify(m);
      parts.forEach(([fid,n])=>{m[fid]=r2((m[fid]||0)-n);m[to]=r2((m[to]||0)+n)});MEMO=null;
      logIt(['Moved '+money(tot,true)+' into '+cat(to).name+' for '+monthName(mDate(thisM))+' from '+parts.map(([fid,n])=>cat(fid).name+' '+money(n,true)).join(', ')]);
      render();toast(`${money(tot,true)} moved into ${cat(to).name}`,()=>{S.adj[thisM]=JSON.parse(snap);MEMO=null;render();toast('Move undone')})},
      {select:{label:'Move into',options:cs.map(c=>[c.id,`${c.name} (${money(Math.max(0,catLeft(c,thisM)),true)} left)`])},multi:{label:'Take from',rows:src.map(c=>({id:c.id,label:c.name,max:catLeft(c,thisM),value:''})),need:0}});
    document.getElementById('mSel').dispatchEvent(new Event('change',{bubbles:true}));
    return}
  if(a==='cover'){
    const CM=t.dataset.m||thisM;if(S.closed.includes(CM)){toast('That month is closed. Reopen it first.');return}
    const c=cat(t.dataset.cat),over=r2(spent(c.id,CM)-budgetOf(c,CM));if(!(over>0)){toast(c.name+' isn’t over anymore');return}
    const src=liveCats().filter(x=>x.type==='monthly'&&x.id!==c.id).map(x=>({x,left:r2(budgetOf(x,CM)-spent(x.id,CM))})).filter(o=>o.left>0.004).sort((a,b)=>b.left-a.left);
    if(!src.length){toast('No category has money left this month. Raise a budget in Settings instead.');return}
    let need=over;const rows=src.map(o=>{const v=r2(Math.min(need,o.left));need=r2(need-v);return {id:o.x.id,label:o.x.name,max:o.left,value:v>0?v:''}});
    confirmBox(`Cover ${money(over,true)} over in ${esc(c.name)}?`,['Take from one category or split it across several',`For ${monthName(mDate(CM))} only. Other months keep their normal budgets`],'Move budget',(v,sv,mv)=>{
      const parts=Object.entries(mv||{}).filter(([,n])=>n>0);
      if(!parts.length){toast('Enter an amount for at least one category');return}
      for(const [fid,n] of parts){const f=cat(fid),left=r2(budgetOf(f,CM)-spent(f.id,CM));if(n>left+0.004){toast(`${f.name} only has ${money(left,true)} left`);return}}
      const tot=r2(parts.reduce((a,[,n])=>a+n,0));if(tot>over+0.004){toast(`That’s more than the ${money(over,true)} you need`);return}
      const m=S.adj[CM]=S.adj[CM]||{};
      parts.forEach(([fid,n])=>{m[fid]=r2((m[fid]||0)-n);m[c.id]=r2((m[c.id]||0)+n)});
      const desc=parts.map(([fid,n])=>`${money(n,true)} from ${cat(fid).name}`).join(', ');
      logIt([`Covered ${c.name} for ${monthName(mDate(CM),{month:'long',year:'numeric'})}: ${desc}`]);render();
      toast(`${c.name} covered: ${desc}`,()=>{parts.forEach(([fid,n])=>{m[fid]=r2(m[fid]+n);m[c.id]=r2(m[c.id]-n)});logIt([`Undid cover for ${c.name}`]);render()})},
      {multi:{label:'Take it from',need:over,rows}});return}
  if(a==='backup'){
    const json=JSON.stringify({app:'ledger',version:KEY,saved:new Date().toISOString(),data:S},null,1),filename=`ledger-backup-${todayISO}.json`;
    const done=()=>{S.lastBackup=Date.now();logIt(['Backup downloaded']);render();toast('Backup saved')};
    if(DL){DL.save({filename,data:json}).then(done).catch(e=>{const c=e&&e.code;toast(c==='declined'?'Backup canceled':c==='rate_limited'?'A save prompt is already open':'Saving files isn’t available here')});return}
    const u=URL.createObjectURL(new Blob([json],{type:'application/json'})),l=document.createElement('a');l.href=u;l.download=filename;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);
    done();return}
  if(a==='more'){const m=UI.more===g.id?null:g.id;resetUI();UI.more=m;render();return}
  if(a==='moveFrom'){resetUI();UI.moveFrom=g.id;render();return}
  if(a==='addSub'){resetUI();UI.addSub=g.id;render();const n=document.getElementById('sgName');if(n)n.focus();return}
  if(a==='pin'){togglePin(t.dataset.key,t.dataset.name);render();return}
  if(a==='pinPick'){const k=document.getElementById('pinPick').value;const nm=k.startsWith('goal')?goal(k.split(':')[1]).name:acct(k.split(':')[1]).name;togglePin(k,nm);render();return}
  if(a==='dmove'){const o=S.dash.order,i=o.indexOf(t.dataset.key),j=i+(+t.dataset.dir);if(i<0||j<0||j>=o.length)return;[o[i],o[j]]=[o[j],o[i]];render();const b=document.querySelector(`[data-act=dmove][data-key="${t.dataset.key}"][data-dir="${t.dataset.dir}"]`);if(b&&!b.disabled)b.focus();return}
  if(a==='doMove'){
    const v=r2(parseFloat(document.getElementById('mvAmt').value)),to=document.getElementById('mvTo').value;
    const r=moveGoalMoney(g,to,v);if(r.err){toast(r.err);return}
    resetUI();render();toast(r.msg,()=>{removeTx(r.tx);render();toast('Move undone')});return}
  if(a==='fill'){
    const par=goal(g.parent),v=r2(Math.min(g.target-g.saved,par.saved));
    if(!(v>0)){toast(`${par.name} fund is empty. Add money to it first.`);return}
    const r=moveGoalMoney(par,g.id,v);if(r.err){toast(r.err);return}
    resetUI();render();toast(`${money(v,true)} moved from ${par.name} fund to ${g.name}`,()=>{removeTx(r.tx);render();toast('Move undone')});return}
  if(a==='doSub'){
    const n=document.getElementById('sgName').value.trim(),v=parseFloat(document.getElementById('sgAmt').value),d=document.getElementById('sgDate').value;
    if(!n||!(v>0)||!d){toast('Add a name, amount, and due date');return}
    if(d<=todayISO){toast('Pick a due date in the future');return}
    if(d>g.date){toast(`That’s after ${g.name}’s finish-by date (${shortD(g.date)}). Change one of them.`);return}
    const first=!kids(g).length;
    S.goals.push({id:id(),name:n,parent:g.id,target:v,saved:0,date:d,created:todayISO,acct:g.acct,done:false});
    logIt([`Added sub-goal ${n} (${money(v)} due ${shortD(d)}) to ${g.name}`]);
    resetUI();render();toast(first?`${g.name} is now an overall fund with sub-goals`:`${n} added`);return}
  if(a==='up'){const act=topGoals();const ai=act.indexOf(g);const prev=act[ai-1];if(!prev)return;const i1=S.goals.indexOf(g),i2=S.goals.indexOf(prev);[S.goals[i1],S.goals[i2]]=[S.goals[i2],S.goals[i1]];logIt([g.name+' moved above '+prev.name]);render();return}
  if(a==='push'){
    const d=new Date(g.date+'T00:00');d.setMonth(d.getMonth()+1);const nd=iso(d.getFullYear(),d.getMonth()+1,d.getDate());
    const par=g.parent?goal(g.parent):null;
    if(par&&nd>par.date){toast(`That would be after ${par.name}’s finish-by date (${shortD(par.date)}). Push that back first.`);return}
    confirmBox('Push back '+esc(g.name)+'?',[chg(g.parent?'Due date':isParent(g)?'Finish-by date':'Buy-by date',fmtD(g.date),fmtD(nd))],'Push it back',()=>{logIt([g.name+' — '+chg('date',fmtD(g.date),fmtD(nd))]);g.date=nd;render();toast('New date: '+fmtD(nd))});return}
  if(a==='bought'){
    const par=g.parent&&goal(g.parent)&&!goal(g.parent).done?goal(g.parent):null,free=unassigned(g.acct);
    const lines=[`Pays from ${esc(aName(g.acct))}`,
      par?`If it costs less than ${money(g.saved)}, the rest goes back to the ${esc(par.name)} fund`:`If it cost less than ${money(g.saved)}, the rest goes back to unassigned`,
      par?`If it costs more, the difference comes from the fund (${money(par.saved,true)}), then unassigned (${money(free,true)})`:`If it cost more, the difference comes from unassigned (${money(free,true)} available)`];
    confirmBox((par?'Mark ':'Mark ')+esc(g.name)+(par?' paid?':' as bought?'),lines,par?'Mark paid':'Mark as bought',v=>{
      v=r2(v);if(!(v>0)){toast('Enter what you paid');return}
      const fromFund=par?Math.min(Math.max(0,v-g.saved),par.saved):0;
      if(v>g.saved+fromFund+free+0.004){toast(`Not enough in ${aName(g.acct)}. Move money in first.`);return}
      const made=[];
      if(par&&v<g.saved-0.004)made.push(addTx({date:todayISO,kind:'gmove',gFrom:g.id,gTo:par.id,acctFrom:g.acct,acctTo:par.acct,amount:r2(g.saved-v)}));
      if(fromFund>0.004)made.push(addTx({date:todayISO,kind:'gmove',gFrom:par.id,gTo:g.id,acctFrom:par.acct,acctTo:g.acct,amount:r2(fromFund)}));
      const left=r2(g.saved-v);
      made.push(addTx({date:todayISO,vendor:g.name,amount:v,kind:'goalbuy',acct:g.acct,goal:g.id}));
      g.done=true;g.boughtOn=todayISO;g.paid=v;unpinQuiet('goal:'+g.id);
      logIt([`${g.name} ${par?'paid':'bought'} for ${money(v,true)}`+(!par&&left>0.004?` (${money(left,true)} returned to unassigned)`:'')]);
      render();toast(par?`${g.name} paid`:`${g.name} bought. Goal completed.`,()=>{made.slice().reverse().forEach(x=>removeTx(x));g.done=false;delete g.boughtOn;delete g.paid;render();toast('Payment undone')})},
      {input:{label:'What did you pay?',value:g.target}});return}
  if(a==='complete'){
    const fp=famProgress(g),dests=[['unassigned',`Unassigned in ${aName(g.acct)}`]].concat(topGoals().filter(x=>x.id!==g.id).map(x=>[x.id,x.name]));
    confirmBox(`Mark ${esc(g.name)} complete?`,[`${money(fp.paid)} paid across ${fp.payments} payment${fp.payments===1?'':'s'}`,
      g.saved>0.004?`${money(g.saved,true)} is still in the fund. Choose where it goes.`:'Nothing is left in the fund','It moves to Completed and leaves the dashboard'],'Mark complete',(v,dest)=>{
      if(g.saved>0.004){const r=moveGoalMoney(g,dest||'unassigned',g.saved,true);if(r.err){toast(r.err);return}}
      g.done=true;g.completedOn=todayISO;unpinQuiet('goal:'+g.id);
      logIt([`${g.name} completed: ${money(fp.paid)} paid across ${fp.payments} payments`]);resetUI();render();toast(g.name+' completed')},
      g.saved>0.004?{select:{label:'Leftover fund money goes to',options:dests}}:{});return}
  if(a==='archGoal'){
    const mem=family(g).filter(x=>!x.done),tot=r2(mem.reduce((s,x)=>s+x.saved,0));
    if(!hasHistory(g)){confirmBox('Delete '+esc(g.name)+'?',['It has no money or history, so it’s removed completely'],'Delete goal',()=>{S.goals=S.goals.filter(x=>x.id!==g.id);unpinQuiet('goal:'+g.id);logIt(['Deleted goal '+g.name]);resetUI();render();toast(g.name+' deleted')},{danger:true});return}
    const fam=new Set(family(g).map(x=>x.id)),par=g.parent?goal(g.parent):null;
    const dests=(par&&!par.done?[[par.id,`Back to ${par.name} fund`]]:[]).concat([['unassigned',`Unassigned in ${aName(g.acct)}`]]).concat(activeGoals().filter(x=>!fam.has(x.id)&&(!par||x.id!==par.id)).map(x=>[x.id,x.name]));
    confirmBox('Archive '+esc(g.name)+'?',(isParent(g)&&liveKids(g).length?[`Its ${liveKids(g).length} open sub-goal${liveKids(g).length===1?' is':'s are'} archived too`]:[])
      .concat([tot>0.004?`${money(tot,true)} is set aside. Choose where it goes.`:'Nothing is set aside','Payments already made stay in your history']),'Archive goal',(v,dest)=>{
      for(const x of mem){if(x.saved>0.004){const r=moveGoalMoney(x,dest||'unassigned',x.saved,true);if(r.err){toast(r.err);return}}}
      mem.forEach(x=>{x.done=true;x.archived=true;x.archivedOn=todayISO;unpinQuiet('goal:'+x.id)});
      logIt([`Archived ${g.name}`+(tot>0.004?` (${money(tot,true)} moved to ${dest&&dest!=='unassigned'?goal(dest).name:'unassigned'})`:'')]);resetUI();render();toast(g.name+' archived')},
      Object.assign({danger:true},tot>0.004?{select:{label:'Set-aside money goes to',options:dests}}:{}));return}
  if(a==='reviewGoal'){
    const ch=[],par=isParent(g),fp=famProgress(g);
    const n=document.getElementById('eName').value.trim()||g.name,amt=r2(parseFloat(document.getElementById('eAmt').value)||g.target),d=document.getElementById('eDate').value||g.date,ae=document.getElementById('eAcct'),ac=ae?ae.value:g.acct;
    if(n!==g.name)ch.push(chg('Name',esc(g.name),esc(n)));
    if(par&&amt<fp.covered-0.004){toast(`The total can’t be below the ${money(fp.covered)} already paid or set aside`);return}
    if(!par&&amt<g.saved-0.004){toast(`Target can’t be below the ${money(g.saved)} already saved`);return}
    if(amt!==g.target)ch.push(chg(par?'Overall total':'Target',money(g.target),money(amt)));
    if(g.parent&&d>goal(g.parent).date){toast(`Due date can’t be after ${goal(g.parent).name}’s finish-by date`);return}
    if(par){const late=liveKids(g).filter(k=>k.date>d);if(late.length){toast(`${late[0].name} is due after that. Move its date first.`);return}}
    if(d!==g.date)ch.push(chg(g.parent?'Due date':'Date',fmtD(g.date),fmtD(d)));
    let moveAmt=0;if(ac!==g.acct){moveAmt=r2(par?fp.aside:g.saved);const src=acct(g.acct);if(moveAmt>src.balance+0.004){toast(`${src.name} only has ${money(src.balance,true)}, so the ${money(moveAmt)} can’t move yet`);return}ch.push(chg('Kept in',esc(aName(g.acct)),esc(aName(ac)))+(par?' (with its sub-goals)':''));if(moveAmt>0)ch.push(`${money(moveAmt,true)} moves from ${esc(aName(g.acct))} to ${esc(aName(ac))}`)}
    if(!ch.length){toast('No changes to save');return}
    const label=g.name;
    confirmBox('Save changes to '+esc(label)+'?',ch,'Save changes',()=>{Object.assign(g,{name:n,target:amt,date:d});if(ac!==g.acct){if(moveAmt>0)addTx({date:todayISO,kind:'transfer',from:g.acct,to:ac,amount:moveAmt,note:'Moved with '+g.name});g.acct=ac;if(par)liveKids(g).forEach(k=>k.acct=ac)}logIt(ch.map(c=>label+' — '+c));resetUI();render();toast(n+' updated')});return}
  if(a==='reviewAccts'){
    const ch=[],apply=[];
    document.querySelectorAll('#app [data-acct]').forEach(i=>{const x=acct(i.dataset.acct),v=r2(parseFloat(i.value)||0);if(Math.abs(v-x.balance)>0.004){ch.push(chg(esc(x.name),money(x.balance,true),money(v,true)));const d=r2(v-x.balance),moneyIn=x.type==='debt'?-d:d;apply.push(()=>addTx({date:todayISO,kind:'adjust',acct:x.id,amount:Math.abs(moneyIn),dir:moneyIn>0?1:-1}))}});
    document.querySelectorAll('#app [data-apr]').forEach(i=>{const x=acct(i.dataset.apr),v=parseFloat(i.value)||0;if(v!==(x.apr||0)){ch.push(chg(esc(x.name)+' APR',(x.apr||0)+'%',v+'%'));apply.push(()=>x.apr=v)}});
    document.querySelectorAll('#app [data-min]').forEach(i=>{const x=acct(i.dataset.min),v=parseFloat(i.value)||0;if(v!==(x.min||0)){ch.push(chg(esc(x.name)+' payment',money(x.min||0),money(v)));apply.push(()=>x.min=v)}});
    if(!ch.length){toast('No changes to save');return}
    confirmBox('Save these account changes?',ch.concat(document.querySelectorAll('#app [data-acct]').length&&ch.some(c=>!/APR|payment/.test(c))?['Balance changes are saved as dated corrections in Activity']:[]),'Save changes',()=>{apply.forEach(f=>f());logIt(ch.map(c=>'Correction — '+c.replace(/<[^>]+>/g,'')));resetUI();render();toast('Accounts updated')});return}
  if(a==='closeMonth'){
    const T=t.dataset.m;if(T!==closeTarget()){toast('Close older months first');return}
    const nm=monthName(mDate(T)),corr=[],asOf={};
    document.querySelectorAll('#app [data-bal]').forEach(i=>{const x=acct(i.dataset.bal),calc=parseFloat(i.dataset.calc),v=r2(parseFloat(i.value)||0);asOf[x.id]=v;if(Math.abs(v-calc)>0.004)corr.push({id:x.id,from:calc,to:v,delta:r2(v-calc)})});
    document.querySelectorAll('#app [data-asset]').forEach(i=>{const x=S.assets.find(y=>y.id===i.dataset.asset),v=r2(Math.max(0,parseFloat(i.value)||0));if(Math.abs(v-(x.value||0))>0.004)corr.push({asset:x.id,from:x.value||0,to:v})});
    const unpaid=liveFixed().filter(f=>fixedOwe(f,T)>0.004);
    const lines=(corr.length?corr.map(c=>`${c.asset?'Update':'Correct'} ${esc(c.asset?S.assets.find(y=>y.id===c.asset).name:aName(c.id))}: ${money(c.from,true)} → ${money(c.to,true)}`):['All balances match your entries'])
      .concat(unpaid.length?[`Not marked paid: ${unpaid.map(f=>esc(f.name)).join(', ')}`]:[])
      .concat([`${nm}\u2019s entries become read-only`,'You can reopen it from Activity if something\u2019s wrong']);
    confirmBox(`Close and lock ${esc(nm)}?`,lines,'Confirm and close',()=>{
      /* corrections become dated entries on the month's last day, so every later balance still adds up */
      corr.forEach(c=>{if(c.asset){S.assets.find(y=>y.id===c.asset).value=c.to;return}
        const x=acct(c.id),moneyIn=x.type==='debt'?-c.delta:c.delta;
        const nt=addTx({date:lastDayOf(T),kind:'adjust',acct:x.id,amount:r2(Math.abs(moneyIn)),dir:moneyIn>0?1:-1,closeOf:T});c.tx=nt.id});
      const bal={__oth:othNow()};S.accounts.filter(x=>existedBy(x,T)).forEach(x=>bal[x.id]=x.id in asOf?asOf[x.id]:balAt(x,T));
      const budgets={};liveCats().forEach(c=>budgets[c.id]=budgetOf(c,T));
      S.snapshots.push({m:monthName(mDate(T),{month:'short'}),key:T,full:monthName(mDate(T),{month:'long',year:'numeric'}),bal,budgets,corr});
      S.snapshots.sort((a,b)=>(a.key||'').localeCompare(b.key||''));
      S.closed.push(T);(S.did=S.did||{}).close=true;
      logIt(corr.map(c=>`Reconciled at close — ${c.asset?S.assets.find(y=>y.id===c.asset).name:aName(c.id)}: ${money(c.from,true)} → ${money(c.to,true)}`).concat([nm+' closed and locked']));
      const next=closeTarget();
      if(next){S.view='close';render();window.scrollTo(0,0);toast(`${nm} closed. Next up: ${monthName(mDate(next))}`)}
      else{S.view='activity';setMonth(T);render();window.scrollTo(0,0);toast(nm+' closed'+(corr.length?`, ${corr.length} correction${corr.length>1?'s':''} recorded`:''))}
    });return}
}

/* ---------- quick add ---------- */
let A;
function lastFor(vendor){const v=vendor.trim().toLowerCase();if(!v)return null;return S.tx.slice().reverse().find(t=>t.kind==='expense'&&(t.vendor||'').toLowerCase()===v&&cat(t.cat)&&!cat(t.cat).archived)}
let SHEET_OK=false;
function openSheet(tx){
  if(!liveAccts().some(a=>a.type!=='debt')){toast('Finish setup first, so entries have an account to go to');resetUI();S.view='setup';render();return}
  const live=liveAccts();const to=((live.find(a=>a.type==='savings')||live[1]||live[0])||{}).id;
  A={kind:'expense',amt:'',cat:null,vendor:'',date:todayISO,acct:S.plan.payDefault,from:S.plan.deposit,to,auto:'',editId:null};
  if(tx&&tx.id)Object.assign(A,{kind:tx.kind,amt:String(tx.amount),cat:tx.cat||null,vendor:tx.vendor||'',date:tx.date,acct:tx.acct,editId:tx.id});
  drawSheet();
  document.getElementById('sheet').classList.add('open');document.getElementById('sheetBg').classList.add('open');
}
function wipeSheet(){closeSheet();document.getElementById('sheet').innerHTML=''}
function closeSheet(){document.getElementById('sheet').classList.remove('open');document.getElementById('sheetBg').classList.remove('open')}
function usage(cid){return S.tx.filter(t=>t.cat===cid).length}
function drawSheet(){
  let cats=liveCats().slice().sort((a,b)=>usage(b.id)-usage(a.id));
  if(A.cat&&!cats.find(c=>c.id===A.cat))cats=[cat(A.cat)].concat(cats);
  if(A.kind==='expense'&&!A.cat&&cats.length)A.cat=cats[0].id;
  const fx=A.kind==='fixed'?S.fixed.find(f=>f.id===(S.tx.find(t=>t.id===A.editId)||{}).fixedId):null;
  const vendors=[...new Set(S.tx.filter(t=>t.kind==='expense').map(t=>t.vendor).filter(Boolean))];
  let hint='';
  if(A.kind==='expense'&&!cats.length)hint='Add a category in Settings first';
  if(A.kind==='expense'&&A.cat){const c=cat(A.cat);const l=budgetOf(c,thisM)-spent(c.id)-(parseFloat(A.amt)||0);hint=`${esc(c.name)}: ${l>=0?money(l,true)+' left after this':money(-l,true)+' more than it has left. You’ll move budget in before saving'}`}
  if(A.kind==='income'&&parseFloat(A.amt)>0&&!A.editId)hint='You\u2019ll get a suggested split after saving';
  if(A.editId)hint=(hint?hint+'. ':'')+'Editing an entry';
  const chipsAcct=(field,list)=>`<div class="chips small">${list.map(a=>`<button class="chip" data-${field}="${a.id}" aria-pressed="${A[field]===a.id}">${esc(a.name)}</button>`).join('')}</div>`;
  const all=liveAccts(), nonDebt=all.filter(a=>a.type!=='debt');
  document.getElementById('sheet').innerHTML=`<div class="grab"></div>
  ${A.editId?`<p class="lbl" style="text-align:center;margin:0">Edit ${A.kind==='fixed'?esc(fx?fx.name:'fixed cost')+' payment':A.kind==='income'?'income':'purchase'}</p>`:`<div class="seg" role="group" aria-label="Entry type">${[['expense','Expense'],['income','Income'],['transfer','Transfer']].map(([k,l])=>`<button data-kind="${k}" aria-pressed="${A.kind===k}">${l}</button>`).join('')}</div>`}
  <div class="amount ${A.amt?'':'empty'}">$${A.amt||'0'}</div>
  <p class="hint">${hint}</p>
  <div class="pad">${['1','2','3','4','5','6','7','8','9','.','0','⌫'].map(k=>`<button data-k="${k}" aria-label="${k==='⌫'?'Delete':k}">${k}</button>`).join('')}</div>
  ${A.kind==='expense'?`
    <label class="field" style="margin:0"><span>Vendor</span><input type="text" id="aVendor" list="vlist" value="${esc(A.vendor)}" placeholder="Optional"></label>
    <datalist id="vlist">${vendors.map(v=>`<option value="${esc(v)}">`).join('')}</datalist>
    <p class="autofill">${A.auto}</p>
    <p class="lbl">Category</p><div class="chips">${cats.map(c=>`<button class="chip" data-cat="${c.id}" aria-pressed="${A.cat===c.id}">${esc(c.name)}</button>`).join('')}</div>
    <p class="lbl">Paid with</p>${chipsAcct('acct',payAccts().concat(all.filter(a=>a.id===A.acct&&!a.pay)))}`:''}
  ${A.kind==='income'?`
    <label class="field" style="margin:0"><span>Source</span><input type="text" id="aVendor" value="${esc(A.vendor)}" placeholder="Paycheck"></label>
    <p class="lbl">Deposited to</p>${chipsAcct('acct',nonDebt)}`:''}
  ${A.kind==='transfer'&&all.length<2?`<p class="hint">You need two accounts to move money between them. Add another in Settings.</p>`:''}
  ${A.kind==='transfer'&&all.length>=2?`
    <p class="lbl">From</p>${chipsAcct('from',nonDebt)}
    <p class="lbl">To</p>${chipsAcct('to',all.filter(a=>a.id!==A.from))}
    <p class="sub" style="font-size:13px">Moving money to a credit card counts as a payment. To fund a goal, use Add money on the Goals tab.</p>`:''}
  ${A.kind==='fixed'?`<p class="lbl">Paid from</p>${chipsAcct('acct',payAccts().concat(all.filter(a=>a.id===A.acct&&!a.pay)))}`:''}
  <label class="field"><span>Date</span><input type="date" id="aDate" value="${A.date}" max="${todayISO}"></label>
  <button class="btn full" id="aSave" style="margin-top:8px">${A.editId?'Save changes':'Save'}</button>`;
}
document.getElementById('addBtn').addEventListener('click',()=>openSheet());
document.getElementById('sheetBg').addEventListener('click',closeSheet);
document.addEventListener('keydown',e=>{
  const hk=e.target.closest&&e.target.closest('[data-hit]');if(hk&&(e.key==='Enter'||e.key===' ')){e.preventDefault();selectPoint(hk.dataset.hit,+hk.dataset.i);return}
  if(hk&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){const o=CH[hk.dataset.hit];const n=Math.max(0,Math.min(o.labels.length-1,+hk.dataset.i+(e.key==='ArrowRight'?1:-1)));selectPoint(hk.dataset.hit,n);const nx=document.querySelector(`[data-hit="${hk.dataset.hit}"][data-i="${n}"]`);if(nx)nx.focus();return}
  if(e.key==='Escape'){closeSheet();closeModal();return}
  const open=document.getElementById('sheet').classList.contains('open');
  if(!open||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||document.getElementById('mBg').classList.contains('open'))return;
  const key=e.key==='Backspace'?'⌫':e.key;
  if(/^[0-9.]$/.test(key)||key==='⌫'){const b=document.querySelector(`#sheet [data-k="${key}"]`);if(b){e.preventDefault();b.click()}}
  else if(e.key==='Enter'){e.preventDefault();document.getElementById('aSave').click()}
});
document.getElementById('sheet').addEventListener('input',e=>{if(e.target.id==='aVendor')A.vendor=e.target.value;if(e.target.id==='aDate')A.date=e.target.value});
document.getElementById('sheet').addEventListener('change',e=>{
  if(e.target.id==='aVendor'&&A.kind==='expense'){const l=lastFor(A.vendor);if(l){A.cat=l.cat;const la=acct(l.acct);if(la&&!la.archived&&la.pay)A.acct=l.acct;A.auto=`Filled in from your last ${esc(l.vendor)} entry: ${esc(cat(l.cat).name)}, ${esc(aName(A.acct))}`}else A.auto='';drawSheet()}
});
document.getElementById('sheet').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.kind){A.kind=b.dataset.kind;A.auto='';if(A.kind==='income'){A.acct=S.plan.deposit;if(!A.vendor)A.vendor='Paycheck'}else if(A.kind==='expense'&&!acct(A.acct).pay)A.acct=S.plan.payDefault;else if(A.vendor==='Paycheck')A.vendor='';if(A.kind==='transfer'&&(A.to===A.from||!A.to))A.to=((liveAccts().find(x=>x.id!==A.from&&x.type==='savings')||liveAccts().find(x=>x.id!==A.from))||{}).id||null;drawSheet();return}
  if(b.dataset.cat){A.cat=b.dataset.cat;A.auto='';const ca=cat(A.cat).acct&&acct(cat(A.cat).acct);if(ca&&!ca.archived&&ca.pay&&!A.editId){A.acct=ca.id;A.auto=`${esc(cat(A.cat).name)} is usually paid from ${esc(ca.name)}`}drawSheet();return}
  if(b.dataset.acct){A.acct=b.dataset.acct;drawSheet();return}
  if(b.dataset.from){A.from=b.dataset.from;if(A.to===A.from)A.to=((liveAccts().find(x=>x.id!==A.from&&x.type==='savings')||liveAccts().find(x=>x.id!==A.from))||{}).id||null;drawSheet();return}
  if(b.dataset.to){A.to=b.dataset.to;drawSheet();return}
  if(b.dataset.k){const k=b.dataset.k;
    if(k==='⌫')A.amt=A.amt.slice(0,-1);
    else if(k==='.'){if(!A.amt.includes('.'))A.amt=(A.amt||'0')+'.'}
    else{const parts=A.amt.split('.');if(parts[1]!==undefined&&parts[1].length>=2)return;if(parts[1]===undefined&&parts[0].length>=6)return;A.amt=A.amt==='0'?k:A.amt+k}
    drawSheet();return}
  if(b.id==='aSave'){
    const v=r2(parseFloat(A.amt));if(!(v>0)){toast('Enter an amount');return}
    if(!A.date||A.date>todayISO){toast('Pick today or an earlier date');return}
    if(S.closed.includes(A.date.slice(0,7))){toast('That month is closed. Pick a date in an open month.');return}
    {const ob=openedBlock(A.date,A.kind==='transfer'&&!A.editId?[A.from,A.to]:[A.acct].concat((S.tx.find(x=>x.id===A.editId)||{}).to||[]));if(ob){toast(ob);return}}
    if(A.editId){
      const t=S.tx.find(x=>x.id===A.editId);const before={amount:t.amount,date:t.date,acct:t.acct,cat:t.cat,vendor:t.vendor};
      const nv=t.kind==='expense'?(A.vendor.trim()||'Purchase'):t.kind==='income'?(A.vendor.trim()||'Income'):t.vendor;
      const pd=[];if(before.amount!==v)pd.push('Amount: '+money(before.amount,true)+' → '+money(v,true));if(before.date!==A.date)pd.push('Date: '+fmtD(before.date)+' → '+fmtD(A.date));
      if(before.acct!==A.acct)pd.push('Account: '+aName(before.acct)+' → '+aName(A.acct));if(t.kind==='expense'&&before.cat!==A.cat)pd.push('Category: '+cat(before.cat).name+' → '+cat(A.cat).name);
      if((t.kind==='expense'||t.kind==='income')&&nv!==before.vendor)pd.push('Name: '+(before.vendor||'—')+' → '+nv);
      if(!pd.length){closeSheet();toast('No changes to save');return}
      if(!SHEET_OK){confirmBox('Save changes to this entry?',pd.map(esc).concat(['Account balances update to match']),'Save changes',()=>{SHEET_OK=true;try{document.getElementById('aSave').click()}finally{SHEET_OK=false}});return}
      {const nt=Object.assign({},t,{amount:v,date:A.date,acct:A.acct});const g=guardTx([nt],[t]);if(g){toast(g);return}
        if(t.kind==='expense'&&cat(A.cat).type==='monthly'){const M=A.date.slice(0,7),same=t.cat===A.cat&&t.date.slice(0,7)===M,lf=r2(catLeft(cat(A.cat),M)+(same?t.amount:0));if(v>Math.max(0,lf)+0.004&&!(same&&v<=t.amount)){toast(`That would put ${cat(A.cat).name} ${money(v-Math.max(0,lf),true)} over. Move budget into it first (Spending → Move budget).`);return}}}
      applyTx(t,-1);Object.assign(t,{amount:v,date:A.date,acct:A.acct});
      if(t.kind==='expense'){t.cat=A.cat;t.vendor=A.vendor.trim()||'Purchase'}
      if(t.kind==='income')t.vendor=A.vendor.trim()||'Income';
      applyTx(t,1);
      const neg=[t.acct,t.to].map(acct).find(a=>a&&a.type==='debt'&&a.balance<-0.004);
      if(neg){applyTx(t,-1);Object.assign(t,{amount:before.amount,date:before.date,acct:before.acct,cat:before.cat,vendor:before.vendor});applyTx(t,1);toast(`That would pay ${neg.name} past zero`);return}
      S.tx.filter(x=>x.link===t.id).forEach(x=>{if(x.date.slice(0,7)!==t.date.slice(0,7)){applyTx(x,-1);x.date=t.date;applyTx(x,1)}});
      const d=[];if(before.amount!==v)d.push(money(before.amount,true)+' → '+money(v,true));if(before.date!==t.date)d.push(fmtD(before.date)+' → '+fmtD(t.date));
      if(before.acct!==t.acct)d.push(aName(before.acct)+' → '+aName(t.acct));if(t.kind==='expense'&&before.cat!==t.cat)d.push(cat(before.cat).name+' → '+cat(t.cat).name);
      if(d.length)logIt(['Edited '+(t.vendor||'entry')+': '+d.join(', ')]);
      closeSheet();render();toast('Entry updated');return}
    if(A.kind==='expense'){
      if(!A.cat){toast('Add a category in Settings first');return}
      {const g=guardTx([{kind:'expense',acct:A.acct,amount:v}]);if(g){toast(g);return}}
      if(!SHEET_OK&&cat(A.cat).type==='monthly'){const c0=cat(A.cat),M=A.date.slice(0,7),lf=catLeft(c0,M),short=r2(v-lf);
        if(short>0.004){
          const src=liveCats().filter(x=>x.type==='monthly'&&x.id!==c0.id).map(x=>({x,left:catLeft(x,M)})).filter(o=>o.left>0.004).sort((a,b)=>b.left-a.left);
          const tot=r2(src.reduce((a,o)=>a+o.left,0));
          if(tot<short-0.004){toast(`${c0.name} ${lf<0?'is already over':'has '+money(lf,true)+' left'} and other categories only have ${money(tot,true)} to move. Lower the amount or raise a budget in Settings.`);return}
          let need=short;const rows=src.map(o=>{const vv=r2(Math.min(need,o.left));need=r2(need-vv);return {id:o.x.id,label:o.x.name,max:o.left,value:vv>0?vv:''}});
          confirmBox(lf<0?`${esc(c0.name)} is already ${money(-lf,true)} over`:`${esc(c0.name)} only has ${money(lf,true)} left`,[lf<0?`This ${money(v,true)} purchase plus the ${money(-lf,true)} already over needs ${money(short,true)} moved in`:`This ${money(v,true)} purchase needs ${money(short,true)} more`,'Move it from other categories first, so nothing goes over',`For ${monthName(mDate(M))} only`],'Move and log it',(x1,x2,mv)=>{
            const parts=Object.entries(mv||{}).filter(([,n])=>n>0);const got=r2(parts.reduce((a,[,n])=>a+n,0));
            for(const [fid,n] of parts){if(n>catLeft(cat(fid),M)+0.004){toast(`${cat(fid).name} only has ${money(catLeft(cat(fid),M),true)} left`);return}}
            if(got<short-0.004){toast(`Move at least ${money(short,true)} to cover it`);return}
            const m=S.adj[M]=S.adj[M]||{};parts.forEach(([fid,n])=>{m[fid]=r2((m[fid]||0)-n);m[c0.id]=r2((m[c0.id]||0)+n)});MEMO=null;
            logIt(['Moved '+money(got,true)+' to '+c0.name+' for '+monthName(mDate(M))+' from '+parts.map(([fid,n])=>cat(fid).name+' '+money(n,true)).join(', ')]);
            SHEET_OK=true;try{document.getElementById('aSave').click()}finally{SHEET_OK=false}},{multi:{label:'Move from',rows,need:short}});
          return}}
      const c=cat(A.cat),before=budgetOf(c,thisM)?spent(c.id)/budgetOf(c,thisM):0;
      (S.did=S.did||{}).purchase=true;const nt=addTx({date:A.date,vendor:A.vendor.trim()||'Purchase',amount:v,cat:c.id,kind:'expense',acct:A.acct});
      const after=budgetOf(c,thisM)?spent(c.id)/budgetOf(c,thisM):0,left=budgetOf(c,thisM)-spent(c.id);
      toast(c.name+': '+(left>=0?money(left,true)+' left':money(-left,true)+' over'),()=>{removeTx(nt);render();toast('Entry removed')});
      if(S.notif.over&&before<=1&&after>1)setTimeout(()=>notify('Over budget in '+c.name.toLowerCase(),'You\u2019re '+money(-left,true)+' past this month\u2019s limit.'),900);
      else if(S.notif.b80&&before<.8&&after>=.8)setTimeout(()=>notify(c.name+' is at '+Math.round(after*100)+'%',money(left,true)+' left for the rest of the month.'),900);
      closeSheet();render();
    } else if(A.kind==='income'){
      addTx({date:A.date,vendor:A.vendor.trim()||'Income',amount:v,kind:'income',acct:A.acct});
      closeSheet();render();toast('Income logged to '+aName(A.acct));offerSplit(v,A.acct);
    } else {
      const src=acct(A.from);if(!src||!acct(A.to)){toast('Pick both accounts first');return}if(v>src.balance+0.004){toast(`${src.name} only has ${money(src.balance,true)}`);return}
      if(src.type!=='debt'&&v>unassigned(src.id)+0.004&&assigned(src.id)>0){toast(`Only ${money(unassigned(src.id),true)} in ${src.name} isn\u2019t set aside for goals`);return}
      const dst=acct(A.to);if(A.from===A.to){toast('Pick two different accounts');return}
      let nt,note='';if(dst.type==='debt'){const r=payDebt({date:A.date,amount:v,kind:'transfer',from:A.from,to:A.to});if(r.err){toast(r.err);return}nt=r.tx;note=r.note}else nt=addTx({date:A.date,amount:v,kind:'transfer',from:A.from,to:A.to});
      closeSheet();render();toast(`Moved ${money(v,true)} to ${aName(A.to)}.`+note,()=>{removeTx(nt);render();toast('Transfer removed')});
    }
  }
});

/* ---------- app lock (demo of the Supabase sign-in + device passcode plan) ---------- */
function sha256(m){const K=[],H=[];let p=2,n=0;const isP=x=>{for(let f=2;f*f<=x;f++)if(x%f===0)return false;return true};
  while(n<64){if(isP(p)){if(n<8)H[n]=(Math.pow(p,1/2)*4294967296)|0;K[n++]=(Math.pow(p,1/3)*4294967296)|0}p++}
  const b=unescape(encodeURIComponent(m)),w=[],L=b.length*8;let s=b+'\x80';while(s.length%64!==56)s+='\x00';
  for(let i=0;i<s.length;i++)w[i>>2]|=s.charCodeAt(i)<<((3-i)%4)*8;w[w.length]=(L/4294967296)|0;w[w.length]=L|0;
  const h=H.slice(0);for(let j=0;j<w.length;){const W=w.slice(j,j+=16),o=h.slice(0);
    for(let i=0;i<64;i++){const w15=W[i-15],w2=W[i-2],a=h[0],e=h[4];
      const t1=h[7]+(((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7)))+((e&h[5])^(~e&h[6]))+K[i]+(W[i]=i<16?W[i]:(W[i-16]+(((w15>>>7)|(w15<<25))^((w15>>>18)|(w15<<14))^(w15>>>3))+W[i-7]+(((w2>>>17)|(w2<<15))^((w2>>>19)|(w2<<13))^(w2>>>10)))|0);
      const t2=(((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10)))+((a&h[1])^(a&h[2])^(h[1]&h[2]));
      h.unshift((t1+t2)|0);h[4]=(h[4]+t1)|0;h.pop()}
    for(let i=0;i<8;i++)h[i]=(h[i]+o[i])|0}
  return h.map(x=>('00000000'+(x>>>0).toString(16)).slice(-8)).join('')}
const SEC=()=>(S.sec=S.sec||{lockAfter:5,email:'',tries:0});
const pinHash=(pin,salt)=>sha256(salt+':'+pin);
const weakPin=p=>/^(\d)\1{5}$/.test(p)||'0123456789'.includes(p)||'9876543210'.includes(p);
const maskEmail=e=>{if(!e||!e.includes('@'))return 'your email';const [u,d]=e.split('@');return u[0]+'•••@'+d};
const LK={on:false,mode:'unlock',buf:'',first:'',err:'',after:null,code:'',emailIn:''};
function doErase(){resetUI();wipeSheet();const keep=S.sec;S=blank();if(keep)S.sec=keep;render();window.scrollTo(0,0);toast('Everything erased. Let’s set things up.')}
function lockOpen(mode,after){Object.assign(LK,{on:true,mode,buf:'',first:'',err:'',after:after||null});drawLock()}
function lockClose(){LK.on=false;LK.buf='';const el=document.getElementById('lock');el.hidden=true;el.innerHTML='';document.getElementById('app').removeAttribute('aria-hidden');document.querySelector('nav').removeAttribute('aria-hidden')}
const PADMODES=['unlock','set1','set2','verify','code'];
function drawLock(){
  const el=document.getElementById('lock');if(!LK.on){el.hidden=true;return}
  el.hidden=false;document.getElementById('app').setAttribute('aria-hidden','true');document.querySelector('nav').setAttribute('aria-hidden','true');
  const sec=SEC(),m=LK.mode,left=5-(sec.tries||0);
  const T={unlock:['Enter your passcode',''],set1:['Choose a 6-digit passcode','You’ll use it to unlock Ledger on this device.'],set2:['Enter it again','So we know you typed it right.'],verify:['Enter your current passcode',''],
    code:['Enter the code from your email',`Sent to ${esc(maskEmail(sec.email))}. It expires in 10 minutes.`]};
  if(PADMODES.includes(m)){
    const dots=Array.from({length:6},(_,i)=>`<i class="${i<LK.buf.length?'on':''}"></i>`).join('');
    el.innerHTML=`<div class="lockbox" role="dialog" aria-modal="true" aria-labelledby="lkT"><div class="lbrand">Ledger</div><h2 id="lkT">${T[m][0]}</h2><p class="lsub">${T[m][1]}</p>
      <div class="ldots ${LK.err?'shake':''}" aria-label="${LK.buf.length} of 6 digits entered">${dots}</div><p class="lerr" role="alert">${esc(LK.err)}</p>
      ${m==='code'&&LK.code?`<p class="ldemo">Demo only: in the real app this code arrives by email. Code: <b>${LK.code}</b></p>`:''}
      <div class="lpad">${['1','2','3','4','5','6','7','8','9','','0','⌫'].map(k=>k?`<button data-lk="${k}" aria-label="${k==='⌫'?'Delete':k}">${k}</button>`:'<span></span>').join('')}</div>
      <div class="llinks">${m==='unlock'?`<button data-lka="forgot">Forgot passcode?</button>`:''}${['set1','set2','verify'].includes(m)&&['new','change','off','erase'].includes(LK.after)?`<button data-lka="cancel">Cancel</button>`:''}${m==='code'?`<button data-lka="resend">Send a new code</button>`:''}</div></div>`;
  } else if(m==='forgot'||m==='signedout'){
    el.innerHTML=`<div class="lockbox" role="dialog" aria-modal="true" aria-labelledby="lkT"><div class="lbrand">Ledger</div>
      <h2 id="lkT">${m==='forgot'?'Reset your passcode':'You’ve been signed out'}</h2>
      <p class="lsub">${m==='forgot'?'We’ll email you a code. After that you’ll choose a new passcode. Your data stays as it is.':'Too many wrong passcodes, so Ledger signed you out to protect your data. Sign in with your email to continue.'}</p>
      ${sec.email?`<p class="lsub"><b>${esc(maskEmail(sec.email))}</b></p>`:`<label class="field" style="text-align:left"><span>Email</span><input type="email" id="lkEmail" value="${esc(LK.emailIn)}" autocomplete="email"></label>`}
      <p class="lerr" role="alert">${esc(LK.err)}</p>
      <button class="btn full" data-lka="send">Email me a code</button>
      ${m==='forgot'?`<div class="llinks"><button data-lka="back">Back</button></div>`:''}</div>`;
  }
}
function lockSend(){const sec=SEC();if(!sec.email){const v=(document.getElementById('lkEmail')||{}).value||'';if(!/^\S+@\S+\.\S+$/.test(v)){LK.err='Enter a valid email';drawLock();return}sec.email=v.trim();save()}
  LK.code=String(100000+Math.floor(Math.random()*900000));LK.mode='code';LK.buf='';LK.err='';drawLock()}
function lockDigit(k){
  if(k==='⌫'){LK.buf=LK.buf.slice(0,-1);LK.err='';drawLock();return}
  if(LK.buf.length>=6)return;LK.buf+=k;LK.err='';drawLock();if(LK.buf.length<6)return;
  const sec=SEC(),pin=LK.buf;LK.buf='';
  if(LK.mode==='unlock'||LK.mode==='verify'){
    if(pinHash(pin,sec.salt)===sec.hash){sec.tries=0;save();
      if(LK.mode==='unlock'){lockClose();sec.lockedAt=null;save();return}
      const a=LK.after;if(a==='off'){delete sec.hash;delete sec.salt;logIt(['Passcode turned off']);lockClose();render();toast('Passcode turned off');return}
      if(a==='change'){LK.mode='set1';LK.after='change';drawLock();return}
      if(a==='erase'){lockClose();doErase();return}}
    sec.tries=(sec.tries||0)+1;save();
    if(sec.tries>=5){sec.signedOut=true;sec.tries=0;save();logIt(['Signed out after 5 wrong passcodes']);LK.mode='signedout';LK.err='';drawLock();return}
    LK.err=`Wrong passcode. ${5-sec.tries} ${5-sec.tries===1?'try':'tries'} left before you’re signed out.`;drawLock();return}
  if(LK.mode==='set1'){if(weakPin(pin)){LK.err='That one’s too easy to guess. Try another.';drawLock();return}LK.first=pin;LK.mode='set2';drawLock();return}
  if(LK.mode==='set2'){if(pin!==LK.first){LK.mode='set1';LK.first='';LK.err='Those didn’t match. Start again.';drawLock();return}
    const salt=Math.random().toString(36).slice(2)+Date.now().toString(36);sec.salt=salt;sec.hash=pinHash(pin,salt);sec.tries=0;sec.signedOut=false;
    logIt([LK.after==='change'?'Passcode changed':LK.after==='reset'?'Passcode reset by email':'Passcode turned on']);lockClose();render();toast(LK.after==='change'?'Passcode changed':'Passcode set. Ledger will lock when you’re away.');return}
  if(LK.mode==='code'){if(pin===LK.code){LK.code='';sec.signedOut=false;sec.tries=0;save();LK.mode='set1';LK.after='reset';LK.err='';drawLock();return}
    LK.err='That code isn’t right. Check your email and try again.';drawLock();return}
}
document.getElementById('lock').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.lk){lockDigit(b.dataset.lk);return}
  const a=b.dataset.lka;
  if(a==='forgot'){LK.mode='forgot';LK.err='';drawLock()}
  else if(a==='back'){LK.mode='unlock';LK.err='';drawLock()}
  else if(a==='send'||a==='resend')lockSend();
  else if(a==='cancel')lockClose();
});
document.getElementById('lock').addEventListener('input',e=>{if(e.target.id==='lkEmail')LK.emailIn=e.target.value});
document.addEventListener('keydown',e=>{if(!LK.on||!PADMODES.includes(LK.mode)||e.target.tagName==='INPUT')return;if(/^\d$/.test(e.key)){e.preventDefault();lockDigit(e.key)}else if(e.key==='Backspace'){e.preventDefault();lockDigit('⌫')}},true);
const lockNeeded=()=>{const s=SEC();return !!(s.hash&&S.setupDone)};
function lockIfAway(){const s=SEC();if(!lockNeeded()||LK.on)return;const away=s.awayAt?(Date.now()-s.awayAt)/60000:Infinity;if(away>=(s.lockAfter||0))lockOpen(s.signedOut?'signedout':'unlock')}
document.addEventListener('visibilitychange',()=>{const s=SEC();if(document.visibilityState==='hidden'){s.awayAt=Date.now();save()}else lockIfAway()});
function lockOnLoad(){const s=SEC();if(s.signedOut){lockOpen('signedout');return}if(lockNeeded()){s.awayAt=null;lockOpen('unlock')}}
let DL=null;
try{if(window.claude&&typeof window.claude.use==='function')window.claude.use('downloads').then(d=>{DL=d||null}).catch(()=>{})}catch(e){}
render();
lockOnLoad();
})();

