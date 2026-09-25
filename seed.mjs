// All names, identifiers, documents, dates and amounts in this file are fictional.
// This seed is authored independently. No production database is imported.
export const VERSION = 1;
export const PROJECT = {name:'Northstar Industrial Campus',subtitle:'A fictional project for exploring commercial controls',author:'Hanchen Wang',asOf:'2026-09-25'};
export const CAPABILITIES = {
  settlementEdit:'Create and edit settlements',financeEdit:'Maintain invoice and payment records',
  contractEdit:'Maintain contracts and counterparties',budgetEdit:'Maintain execution budgets',
  documents:'Browse sample contract documents',guarantees:'View sample guarantees',
  ownerDocuments:'View owner correspondence',ownerReceipts:'Maintain owner receipts',
  expenses:'Maintain other expenses',audit:'View the audit trail',users:'Configure demo permissions'
};
export function seed() {
  const areas=[['P100','Process building','Building'],['U200','Utility centre','Building'],['L300','Logistics hall','Building'],['O400','Administration','Building'],['EXT','External works','Infrastructure'],['TEMP','Temporary facilities','Infrastructure']].map(([code,name,type],i)=>({id:'a'+(i+1),code,name,type}));
  const categories=['Civil works','Structural steel','Building envelope','Mechanical services','Electrical services','Temporary works','Professional services','Site operations'];
  const names=['Aster Civil Works','Cedar Frameworks','Harbour Envelope','Meridian Mechanical','Juniper Electrical','Lumen Site Services','Orchard Engineering','Summit Logistics','Willow Fire Systems','Atlas Survey Studio','Fern Access Systems','Silverline Interiors','Meadow Administration','Kestrel Mobility','Brookfield Workplace','Aspen Advisory'];
  const parties=names.map((name,i)=>({id:'p'+(i+1),code:(i<12?'SC':'SG')+String(i<12?i+1:i-11).padStart(2,'0'),scope:i<12?'SC':'SG',name,status:i===9?'Exited':'Active',contact:'Demo contact',email:'contact'+(i+1)+'@example.invalid',notes:'Fictional counterparty. No real contact information.'}));
  const titles=['Process building earthworks','Primary steel frame','Roof and cladding package','Utility mechanical systems','Power and lighting installation','Temporary offices and welfare','Design coordination services','Materials handling and transport','Fire suppression systems','Site survey services','Access control and doors','Interior finishes','Project administration services','Vehicle leasing','Workplace services','Compliance advisory'];
  const amounts=[1280000,2150000,1460000,1875000,1390000,380000,245000,175000,670000,85000,420000,310000,96000,64000,118000,72000];
  const cat=[0,1,2,3,4,5,6,7,3,6,4,2,6,7,7,6];
  const links=[[0,4],[0,1,2],[0,2],[1,2],[0,1],[5],[],[4],[0,1,2],[4],[0,3],[3]];
  const contracts=parties.map((p,i)=>({id:'c'+(i+1),partyId:p.id,scope:p.scope,code:p.code+'-001-CT',name:titles[i],kind:'CT',parentId:null,separate:false,amount:amounts[i]*100,currency:i===6?'USD':'EUR',category:categories[cat[i]],areas:(links[i]||[]).map(j=>areas[j].id),status:i===9?'Completed':'Active',filing:'DEMO-REG-'+String(i+1).padStart(3,'0'),wo:'',budgetId:'b'+(cat[i]+1)}));
  const changes=[
    ['c1','VO','Additional drainage trenches',95000,false,0,[0,4]],
    ['c2','SA','Additional logistics steelwork',260000,true,1,[2]],
    ['c3','VO','Roof access revision',38000,false,2,[0]],
    ['c4','VO','Electrical heat tracing',42000,false,4,[1]],
    ['c5','SA','Additional cable supports',76000,false,4,[0]],
    ['c6','WO','Temporary lighting extension',28000,false,5,[5]],
    ['c8','WO','Crane attendance',54000,false,7,[4]],
    ['c17','VO','Drainage connection adjustment',12500,false,0,[4]]
  ];
  changes.forEach(([parent,kind,name,amount,separate,category,as],i)=>{
    const p=contracts.find(c=>c.id===parent),id='c'+(17+i);
    // The final VO belongs to the drainage root. VO cannot parent another VO.
    const parentId=i===7?'c1':parent;
    const party=parties.find(x=>x.id===p.partyId);
    const seq=contracts.filter(x=>x.partyId===p.partyId).length+1;
    contracts.push({id,partyId:p.partyId,scope:'SC',code:party.code+'-'+String(seq).padStart(3,'0')+'-'+kind,name,kind,parentId:kind==='WO'?null:parentId,separate,amount:amount*100,currency:p.currency,category:categories[category],areas:as.map(j=>areas[j].id),status:'Active',filing:'DEMO-REG-'+(17+i),wo:kind==='WO'?'DEMO-WO-2026-'+(i+1):'',budgetId:'b'+(category+1)});
  });
  // A child VO is included in the standalone supplement package.
  contracts.push({id:'c25',partyId:'p2',scope:'SC',code:'SC02-003-VO',name:'Revised logistics bracing',kind:'VO',parentId:'c18',separate:false,amount:1850000,currency:'EUR',category:categories[1],areas:['a3'],status:'Active',filing:'DEMO-REG-025',wo:'',budgetId:'b2'});
  const budgets=categories.map((name,i)=>({id:'b'+(i+1),name,currency:'EUR',version:'Baseline 1',amount:[1700000,2850000,2050000,3100000,2250000,550000,510000,570000][i]*100}));
  budgets.push({id:'b9',name:'Professional services',currency:'USD',version:'Baseline 1',amount:30000000});
  contracts.find(c=>c.id==='c7').budgetId='b9';
  const settlements=[]; const finance=[]; const seq={SC:0,SG:0};
  contracts.forEach((c,i)=>{
    const n=c.parentId?1:3;
    for(let j=0;j<n;j++){
      const id='s'+(settlements.length+1),pending=(i===3&&j===2)||(i===13&&j===2);
      const certified=Math.round(c.amount*(c.parentId?0.45:0.17+j*0.035));
      const advance=j===0&&!c.parentId?Math.round(c.amount*0.06):0;
      const recovery=j>0?Math.round(c.amount*0.018):0;
      const retention=Math.round(certified*0.05);
      const date='2026-'+String(7+j).padStart(2,'0')+'-'+String(8+i%15).padStart(2,'0');
      const row={id,flow:String(++seq[c.scope]).padStart(3,'0'),scope:c.scope,contractId:c.id,period:'PC-'+String(j+1).padStart(2,'0'),date,currency:c.currency,pending,final:false,advance:c.scope==='SC'?advance:0,certified,advanceRecovery:c.scope==='SC'?recovery:0,retention:c.scope==='SC'?retention:0,hse:0,additions:0,deductions:0,tax:0,budgetId:'',notes:pending?'Awaiting agreed measurement. Amount is unknown.':j===2?'Monthly certified works.':'Agreed interim statement.',createdBy:'Commercial Editor'};
      if(pending) ['advance','certified','advanceRecovery','retention','hse','additions','deductions','tax'].forEach(k=>row[k]=0);
      settlements.push(row);
      const net=row.advance+row.certified-row.advanceRecovery-row.retention;
      if(j<2||pending) finance.push({id:'f'+(finance.length+1),settlementId:id,invoice:'DEMO-INV-'+String(finance.length+1).padStart(3,'0'),invoiceDate:date,invoiceAmount:pending?1500000:net,paid:pending?1500000:Math.round(net*(j===0?1:0.68)),tax:0,paymentDate:date,reference:'SAMPLE-PAY-'+(finance.length+1),notes:pending?'Advance registered before settlement measurement.':'Fictional payment record.'});
    }
  });
  const receipts=[7,8,9].map((month,i)=>({id:'r'+(i+1),date:`2026-0${month}-05`,reference:'DEMO-OWNER-'+(i+1),advance:i===0?90000000:0,certified:(1450000+i*425000)*100,recovery:i*7500000,retained:5000000,released:0,tax:0,currency:'EUR',notes:'Fictional owner receipt.'}));
  const ownerDocs=[['Main contract','DEMO-MC-001','Main construction agreement'],['Site instructions','DEMO-SI-014','Relocation of temporary access'],['Commercial correspondence','DEMO-CC-008','Clarification of valuation basis'],['Main contract settlements','DEMO-MS-003','September interim valuation']].map(([type,reference,title],i)=>({id:'od'+i,type,reference,title,date:`2026-09-${10+i}`,revision:'R'+(i%2+1),status:i===2?'Under review':'Filed'}));
  const expenses=[{id:'e1',date:'2026-09-04',category:'Site operations',description:'Metered site utilities',net:680000,tax:0,currency:'EUR'},{id:'e2',date:'2026-08-19',category:'Professional services',description:'Independent technical review',net:420000,tax:0,currency:'EUR'}];
  const roles={admin:Object.keys(CAPABILITIES),commercial:['settlementEdit','contractEdit','budgetEdit','documents','ownerDocuments','audit'],finance:['financeEdit','documents','ownerReceipts','expenses','audit'],viewer:['documents']};
  return {version:VERSION,revision:0,areas,categories,parties,contracts,budgets,settlements,finance,receipts,ownerDocs,expenses,roles,audit:[{id:'seed-audit',at:'2026-09-25T08:00:00.000Z',actor:'Demo Administrator',action:'INITIALIZE',entity:'Fictional dataset',before:null,after:{note:'Sample history, created for this demonstration.'}}],errors:[]};
}
