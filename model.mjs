import {seed,VERSION,CAPABILITIES} from './seed.mjs';
export const STORAGE_KEY='hanchen-commercial-demo-v1';
export const ROLES={admin:'Demo Administrator',commercial:'Commercial Editor',finance:'Finance Reviewer',viewer:'Read-only Visitor'};
export const MONEY_FIELDS=['advance','certified','advanceRecovery','retention','hse','additions','deductions','tax'];
export function cents(value) {
  const s=String(value??'').trim();
  if(!/^-?\d+(\.\d{1,2})?$/.test(s)) throw new Error('Enter a valid amount with at most two decimal places.');
  const negative=s.startsWith('-'),[whole,decimal='']=s.replace('-','').split('.');
  const n=Number(whole)*100+Number(decimal.padEnd(2,'0'));
  if(!Number.isSafeInteger(n)||n>1000000000000) throw new Error('Amount is outside the supported range.');
  return negative?-n:n;
}
export function net(s){return s.pending?null:s.advance+s.certified-s.advanceRecovery-s.retention-s.hse+s.additions-s.deductions;}
export function gross(s){const n=net(s);return n===null?null:n+s.tax;}
export function receiptNet(r){return r.advance+r.certified-r.recovery-r.retained+r.released;}
export function can(db,role,cap){return role==='admin'||Boolean(db.roles[role]?.includes(cap));}
export function requireCap(db,role,cap){if(!can(db,role,cap)) throw new Error('This demo role does not have permission for this action.');}
export function packageRoot(db,contract){let c=contract,visited=new Set();while(c.parentId&&!c.separate){if(visited.has(c.id)) throw new Error('Invalid contract hierarchy.');visited.add(c.id);c=db.contracts.find(x=>x.id===c.parentId);if(!c)throw new Error('Missing parent contract.');}return c;}
export function packages(db,scope,currency){
  const map=new Map();
  db.contracts.filter(c=>c.scope===scope&&c.currency===currency).forEach(c=>{const root=packageRoot(db,c);if(!map.has(root.id))map.set(root.id,{root,members:[],amount:0,certified:0,paid:0,pending:0,areas:new Set(),categories:new Set()});const p=map.get(root.id);p.members.push(c);p.amount+=c.amount;c.areas.forEach(a=>p.areas.add(a));p.categories.add(c.category||'Unclassified');});
  for(const p of map.values()){const ids=new Set(p.members.map(c=>c.id));const ss=db.settlements.filter(s=>ids.has(s.contractId)&&s.currency===currency);p.pending=ss.filter(s=>s.pending).length;p.certified=ss.reduce((t,s)=>t+(s.pending?0:s.certified),0);const sid=new Set(ss.map(s=>s.id));p.paid=db.finance.filter(f=>sid.has(f.settlementId)).reduce((t,f)=>t+f.paid,0);p.progress=p.pending?null:p.amount>0?p.certified/p.amount:null;}
  return [...map.values()];
}
export function budgetTotals(db,budget){const cs=db.contracts.filter(c=>c.budgetId===budget.id&&c.currency===budget.currency);const actual=db.settlements.filter(s=>s.currency===budget.currency&&(s.budgetId||db.contracts.find(c=>c.id===s.contractId)?.budgetId)===budget.id);return {commitment:cs.reduce((a,c)=>a+c.amount,0),certified:actual.reduce((a,s)=>a+(s.pending?0:s.certified),0),pending:actual.filter(s=>s.pending).length};}
export function monthlyCash(db,month,currency){const income=db.receipts.filter(r=>r.currency===currency&&r.date.startsWith(month)).reduce((a,r)=>a+receiptNet(r),0);const paid=db.finance.filter(f=>f.paymentDate.startsWith(month)&&db.settlements.find(s=>s.id===f.settlementId)?.currency===currency).reduce((a,f)=>a+f.paid,0);const other=db.expenses.filter(e=>e.currency===currency&&e.date.startsWith(month)).reduce((a,e)=>a+e.net,0);return {income,paid,other,expenditure:paid+other,net:income-paid-other};}
const text=(v,max=240)=>String(v??'').trim().slice(0,max);
function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw new Error('Enter a valid date.');return v;}
function id(prefix){return prefix+'-'+crypto.randomUUID();}
function money(v){return cents(v===''||v==null?'0':v);}
export function saveSettlement(db,role,input,existingId){
  requireCap(db,role,'settlementEdit');const old=existingId?db.settlements.find(s=>s.id===existingId):null;if(existingId&&!old)throw new Error('Settlement not found.');
  const c=db.contracts.find(c=>c.id===input.contractId);if(!c)throw new Error('Select a contract.');
  if(!old&&(c.status!=='Active'||db.parties.find(p=>p.id===c.partyId)?.status!=='Active'))throw new Error('Choose an active contract and counterparty.');
  const scope=c.scope,period=text(input.period,40);if(!period)throw new Error('Enter the settlement reference.');
  if(db.settlements.some(s=>s.id!==existingId&&s.contractId===c.id&&s.period.toLowerCase()===period.toLowerCase()))throw new Error('This settlement reference already exists for this contract.');
  let pending=Boolean(input.pending)||MONEY_FIELDS.every(k=>String(input[k]??'').trim()==='');if(pending&&input.final)throw new Error('Complete the amounts before marking a final settlement.');
  const row={id:old?.id||id('s'),scope,flow:old?.flow||String(Math.max(0,...db.settlements.filter(s=>s.scope===scope).map(s=>Number(s.flow)))+1).padStart(3,'0'),contractId:c.id,period,date:date(input.date),currency:c.currency,pending,final:Boolean(input.final),budgetId:text(input.budgetId,80),notes:text(input.notes,1500),createdBy:old?.createdBy||ROLES[role]};
  for(const k of MONEY_FIELDS)row[k]=pending?0:money(input[k]);
  if(scope==='SG')for(const k of MONEY_FIELDS.filter(k=>!['certified','tax'].includes(k)))row[k]=0;
  if(row.budgetId&&!db.budgets.some(b=>b.id===row.budgetId&&b.currency===row.currency))throw new Error('Budget and settlement currencies must match.');
  if(old)Object.assign(old,row);else db.settlements.push(row);return row;
}
export function saveFinance(db,role,input,settlementId){requireCap(db,role,'financeEdit');const s=db.settlements.find(s=>s.id===settlementId);if(!s)throw new Error('Settlement not found.');const invoice=text(input.invoice,60);if(!invoice)throw new Error('Enter a sample invoice reference.');const f={id:db.finance.find(f=>f.settlementId===s.id)?.id||id('f'),settlementId:s.id,invoice,invoiceDate:date(input.invoiceDate),invoiceAmount:money(input.invoiceAmount),paid:money(input.paid),tax:money(input.tax),paymentDate:date(input.paymentDate),reference:text(input.reference,80),notes:text(input.notes,1000)};if(f.invoiceAmount<0||f.paid<0)throw new Error('Invoice and payment amounts cannot be negative.');const old=db.finance.find(x=>x.id===f.id);if(old)Object.assign(old,f);else db.finance.push(f);return f;}
export function saveContract(db,role,input,existingId){requireCap(db,role,'contractEdit');const old=db.contracts.find(c=>c.id===existingId);if(existingId&&!old)throw new Error('Contract not found.');const p=db.parties.find(p=>p.id===input.partyId);if(!p)throw new Error('Choose a counterparty.');const name=text(input.name),code=text(input.code,50).toUpperCase();if(!name||!code.startsWith(p.code+'-')||!/^S[CG]\d+-\d+-(CT|WO|VO|SA)$/.test(code))throw new Error('Use the counterparty code and a contract reference such as SC01-002-WO.');if(db.contracts.some(c=>c.id!==existingId&&c.code===code))throw new Error('Contract reference already exists.');const kind=code.split('-').at(-1);let parentId=['VO','SA'].includes(kind)?input.parentId:null;if(parentId){const parent=db.contracts.find(c=>c.id===parentId);if(!parent||parent.partyId!==p.id||parent.currency!==input.currency||parent.id===existingId||!['CT','WO',...(kind==='VO'?['SA']:[])].includes(parent.kind))throw new Error('Choose a compatible parent contract in the same currency.');}else if(['VO','SA'].includes(kind))throw new Error('A variation or supplement needs a parent contract.');
  if(old&&db.settlements.some(s=>s.contractId===old.id)&&(old.currency!==input.currency||old.partyId!==p.id||old.kind!==kind||old.parentId!==parentId))throw new Error('Keep the currency, counterparty and hierarchy of a contract with settlement history.');
  const amount=money(input.amount);if(amount<0)throw new Error('Contract value cannot be negative.');if(!['EUR','USD'].includes(input.currency))throw new Error('Unsupported currency.');
  if(input.budgetId&&!db.budgets.some(b=>b.id===input.budgetId&&b.currency===input.currency))throw new Error('Budget and contract currencies must match.');
  const row={id:old?.id||id('c'),partyId:p.id,scope:p.scope,code,name,kind,parentId,separate:kind==='SA'&&Boolean(input.separate),amount,currency:input.currency,category:text(input.category),areas:p.scope==='SC'?(input.areas||[]).filter(a=>db.areas.some(x=>x.id===a)):[],status:input.status||'Active',filing:text(input.filing),wo:kind==='WO'?text(input.wo):'',budgetId:input.budgetId||''};if(old)Object.assign(old,row);else db.contracts.push(row);return row;
}
export function saveBudget(db,role,input,existingId){requireCap(db,role,'budgetEdit');const b=db.budgets.find(b=>b.id===existingId);if(!b)throw new Error('Budget not found.');const amount=money(input.amount);if(amount<0)throw new Error('Budget cannot be negative.');b.amount=amount;b.version=text(input.version,60)||b.version;return b;}
export function saveExpense(db,role,input){requireCap(db,role,'expenses');const description=text(input.description);if(!description)throw new Error('Enter an expense description.');const e={id:id('e'),date:date(input.date),category:text(input.category),description,net:money(input.net),tax:money(input.tax),currency:input.currency};if(e.net<0||!['EUR','USD'].includes(e.currency))throw new Error('Check the expense amount and currency.');db.expenses.push(e);return e;}
export function saveReceipt(db,role,input){requireCap(db,role,'ownerReceipts');if(!text(input.reference))throw new Error('Enter a receipt reference.');if(db.receipts.some(r=>r.reference===text(input.reference)))throw new Error('Receipt reference already exists.');const r={id:id('r'),date:date(input.date),reference:text(input.reference),currency:input.currency,notes:text(input.notes)};for(const k of ['advance','certified','recovery','retained','released','tax'])r[k]=money(input[k]);if(!['EUR','USD'].includes(r.currency))throw new Error('Unsupported currency.');db.receipts.push(r);return r;}
export function saveParty(db,role,input){requireCap(db,role,'contractEdit');const code=text(input.code,20).toUpperCase(),name=text(input.name);if(!/^S[CG]\d{2,}$/.test(code)||!name)throw new Error('Enter an SC/SG code and counterparty name.');if(db.parties.some(p=>p.code===code))throw new Error('Counterparty code already exists.');const p={id:id('p'),code,name,scope:code.slice(0,2),status:'Active',contact:'Demo contact',email:'demo@example.invalid',notes:text(input.notes)};db.parties.push(p);return p;}
export class Store {
  constructor(storage){this.storage=storage;this.notice='';try{const raw=storage?.getItem(STORAGE_KEY);const d=raw?JSON.parse(raw):null;if(d&&(d.version!==VERSION||!['contracts','settlements','finance','parties','audit','budgets','areas','categories','receipts','ownerDocs','expenses','errors'].every(k=>Array.isArray(d[k]))||!d.roles))throw new Error('Invalid cache');this.db=d||seed();}catch{this.db=seed();this.notice='Saved demo data could not be loaded. A fresh fictional dataset is in use.';} }
  persist(){try{if(!this.storage)throw new Error();this.storage.setItem(STORAGE_KEY,JSON.stringify(this.db));return true;}catch{this.notice='Browser storage is unavailable. Changes last only until this page closes or reloads.';return false;}}
  change(role,action,entity,fn){const next=structuredClone(this.db);const before=structuredClone(this.db);const result=fn(next);next.revision++;next.audit.unshift({id:id('a'),at:new Date().toISOString(),actor:ROLES[role],action,entity,before:findPrior(before,result),after:structuredClone(result)});this.db=next;this.persist();return result;}
  reset(){this.db=seed();this.notice='';this.persist();}
  error(message){this.db.errors.unshift({at:new Date().toISOString(),message:text(message,500),context:'Rejected demo action',resolved:false});this.db.errors=this.db.errors.slice(0,50);this.persist();}
}
function findPrior(db,r){if(!r?.id)return null;if(r.capability&&db.roles[r.id])return {id:r.id,capability:r.capability,granted:db.roles[r.id].includes(r.capability)};for(const key of ['settlements','finance','contracts','budgets','expenses','receipts','parties']){const v=db[key].find(x=>x.id===r.id);if(v)return v;}return null;}
export function csv(rows){return '\ufeff'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"').join(',')).join('\r\n');}
