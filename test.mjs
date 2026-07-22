import fs from 'fs';
// Extract the pure engine (Fr helpers + HEIRS + solveFaraid) from index.html
const html = fs.readFileSync(new URL('./public/index.html', import.meta.url), 'utf8');
const script = html.split('<script>')[1].split('</script>')[0];
const marker = '\n/* ============================================================\n   STATE + persistence';
const engine = script.slice(0, script.indexOf(marker));
const solveFaraid = new Function(engine + '\n;return solveFaraid;')();
const HEIRS = new Function(engine + '\n;return HEIRS;')();

function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=a%b;a=b;b=t;}return a||1;}
function reduce([n,d]){const g=gcd(n,d)||1;return [n/g,d/g];}

let pass=0, fail=0;
function test(name, sel, expected){
  const res = solveFaraid(sel);
  const got = {};
  res.rows.forEach(r=>got[r.id]=[r.frac.n,r.frac.d]);
  if(res.baitulmal) got['baitulmal']=[res.baitulmal.frac.n,res.baitulmal.frac.d];
  // verify shares sum to 1
  let sum=[0,1];
  Object.values(got).forEach(([n,d])=>{ sum=[sum[0]*d+n*sum[1], sum[1]*d]; });
  sum=reduce(sum);
  let ok = sum[0]===1 && sum[1]===1;
  const diffs=[];
  const keys=new Set([...Object.keys(expected),...Object.keys(got)]);
  for(const k of keys){
    const e=expected[k]?reduce(expected[k]):null;
    const g=got[k]?reduce(got[k]):null;
    if(!e&&g){ diffs.push(`  unexpected ${k}=${g[0]}/${g[1]}`); ok=false; }
    else if(e&&!g){ diffs.push(`  missing ${k} (want ${e[0]}/${e[1]})`); ok=false; }
    else if(e&&g&&(e[0]!==g[0]||e[1]!==g[1])){ diffs.push(`  ${k}: got ${g[0]}/${g[1]} want ${e[0]}/${e[1]}`); ok=false; }
  }
  if(ok){ pass++; console.log(`✓ ${name}`); }
  else {
    fail++; console.log(`✗ ${name}  (sum=${sum[0]}/${sum[1]})`);
    diffs.forEach(d=>console.log(d));
    console.log('   notes:', res.notes.join(' | ')||'-');
  }
}

// --- cases hand-derived from classical furud (Shafi'i / Malaysian) ---
test('Husband + mother (radd)', {s:1,i:1}, {s:[1,2], i:[1,2]});
test('Wife + mother + father (Umariyyatan)', {is:1,i:1,b:1}, {is:[1,4], i:[1,4], b:[1,2]});
test('Husband + mother + father (Umariyyatan)', {s:1,i:1,b:1}, {s:[1,2], i:[1,6], b:[1,3]});
test('Father + maternal grandmother', {b:1,nsi:1}, {b:[5,6], nsi:[1,6]});
test('Father + 1 grandson (son\'s son)', {b:1,cl:1}, {b:[1,6], cl:[5,6]});
test('1 daughter + 1 full sister (asabah ma al-ghair)', {ap:1,sk:1}, {ap:[1,2], sk:[1,2]});
test('2 full sisters (2/3 + radd)', {sk:2}, {sk:[1,1]});
test('Consanguine sister alone (1/2 + radd)', {st:1}, {st:[1,1]});
test('Father + mother + 2 brothers (mother reduced by mahjub sibs)', {b:1,i:1,bk:2}, {b:[5,6], i:[1,6]});
test('Husband + son + daughter', {s:1,al:1,ap:1}, {s:[1,4], al:[1,2], ap:[1,4]});
test('Wife + 2 daughters + father + mother (aul 27)', {is:1,ap:2,b:1,i:1}, {is:[3,27], ap:[16,27], b:[4,27], i:[4,27]});
test('Husband + mother + 2 uterine + full brother (Mushtaraka)', {s:1,i:1,ss:2,bk:1}, {s:[1,2], i:[1,6], ss:[2,9], bk:[1,9]});
test('Son alone', {al:1}, {al:[1,1]});
test('Grandfather + 1 full brother (muqasamah = equal)', {d:1,bk:1}, {d:[1,2], bk:[1,2]});
test('Grandfather + 3 brothers (1/3 better than muqasamah)', {d:1,bk:3}, {d:[1,3], bk:[2,3]});
test('2 daughters + father + mother (no residue)', {ap:2,b:1,i:1}, {ap:[2,3], b:[1,6], i:[1,6]});
test('Mother + 1 uterine (no reduction, radd)', {i:1,ss:1}, {i:[2,3], ss:[1,3]});
test('Daughter only (radd)', {ap:1}, {ap:[1,1]});
test('Husband + daughter (radd to daughter only)', {s:1,ap:1}, {s:[1,4], ap:[3,4]});
test('1 daughter + 1 granddaughter (1/6 complete + radd)', {ap:1,cp:1}, {ap:[3,4], cp:[1,4]});
test('Son + father + mother', {al:1,b:1,i:1}, {al:[2,3], b:[1,6], i:[1,6]});
test('Husband only (spouse no radd -> Baitulmal)', {s:1}, {s:[1,2], baitulmal:[1,2]});
test('Wife + son + daughter (1/8)', {is:1,al:1,ap:1}, {is:[1,8], al:[7,12], ap:[7,24]});
test('Husband + full sister (1/2 each)', {s:1,sk:1}, {s:[1,2], sk:[1,2]});
test('Husband + 2 full sisters (aul 7)', {s:1,sk:2}, {s:[3,7], sk:[4,7]});
test('Mother + father + 1 daughter', {i:1,b:1,ap:1}, {i:[1,6], ap:[1,2], b:[1,3]});

// --- regression: grandfather + SISTERS (no brothers) ---
// The sisters are the grandfather's muqasamah partners here, not furud heirs. Taking 1/2 or 2/3
// as furud *and* a muqasamah slice double-counted, so the shares summed to less than the whole
// estate (or zeroed an heir and labelled a grandfather "mahjub", which is impossible).
test('GF + 1 full sister (muqasamah 2:1)', {d:1,sk:1}, {d:[2,3], sk:[1,3]});
test('GF + 2 full sisters (muqasamah beats 1/3)', {d:1,sk:2}, {d:[1,2], sk:[1,2]});
test('GF + 3 full sisters (muqasamah 2/5)', {d:1,sk:3}, {d:[2,5], sk:[3,5]});
test('GF + 1 consanguine sister', {d:1,st:1}, {d:[2,3], st:[1,3]});
test('Husband + GF + full sister', {s:1,d:1,sk:1}, {s:[1,2], d:[1,3], sk:[1,6]});
test('Wife + GF + 2 full sisters', {is:1,d:1,sk:2}, {is:[1,4], d:[3,8], sk:[3,8]});
test('Mother + GF + 1 full sister', {i:1,d:1,sk:1}, {i:[1,3], d:[4,9], sk:[2,9]});
test('Mother + GF + 2 full sisters (mother cut to 1/6)', {i:1,d:1,sk:2}, {i:[1,6], d:[5,12], sk:[5,12]});
test('GF + full sister + daughter (1/6 floor)', {ap:1,d:1,sk:1}, {ap:[1,2], d:[1,3], sk:[1,6]});
test('Husband + mother + GF + 2 sisters (1/6 floor)', {s:1,i:1,d:1,sk:2}, {s:[1,2], i:[1,6], d:[1,6], sk:[1,6]});

// --- regression: Akdariyyah (husband + mother + grandfather + one sister) ---
// She takes her 1/2 fardu, the case 'auls, then her share and the grandfather's are pooled 2:1.
test('Akdariyyah (full sister)', {s:1,i:1,d:1,sk:1}, {s:[9,27], i:[6,27], d:[8,27], sk:[4,27]});
test('Akdariyyah (consanguine sister)', {s:1,i:1,d:1,st:1}, {s:[9,27], i:[6,27], d:[8,27], st:[4,27]});
// A wife leaves a big enough residue that the sister is not excluded — ordinary muqasamah, not Akdariyyah.
test('Wife + mother + GF + sister (NOT Akdariyyah)', {is:1,i:1,d:1,sk:1}, {is:[1,4], i:[1,3], d:[5,18], sk:[5,36]});

// --- regression: Umariyyatan must survive heirs who inherit nothing ---
// The old rule keyed off "exactly 3 heirs selected", so adding any mahjub heir silently handed
// the mother a full 1/3 and left her ahead of the father — the exact outcome the ruling prevents.
test('Umariyyatan + mahjub maternal grandmother', {s:1,i:1,b:1,nsi:1}, {s:[1,2], i:[1,6], b:[1,3]});
test('Umariyyatan + mahjub grandfather', {s:1,i:1,b:1,d:1}, {s:[1,2], i:[1,6], b:[1,3]});
test('Umariyyatan + 1 mahjub uterine sibling', {s:1,i:1,b:1,ss:1}, {s:[1,2], i:[1,6], b:[1,3]});
test('Umariyyatan (wife) + mahjub paternal grandmother', {is:1,i:1,b:1,nsb:1}, {is:[1,4], i:[1,4], b:[1,2]});
test('Umariyyatan + mahjub nephew (distant asabah)', {s:1,i:1,b:1,nk:1}, {s:[1,2], i:[1,6], b:[1,3]});
// ...but 2+ siblings cut the mother to a flat 1/6, so it is no longer Umariyyatan.
test('Spouse + parents + 2 mahjub siblings (NOT Umariyyatan)', {s:1,i:1,b:1,bk:2}, {s:[1,2], i:[1,6], b:[1,3]});
test('Wife + parents + 2 mahjub siblings (NOT Umariyyatan)', {is:1,i:1,b:1,bk:2}, {is:[1,4], i:[1,6], b:[7,12]});

// --- per-heir "Sebab" explainability (reasons on rows, baitulmal, and blockedRows) ---
function rsn(name, sel, checks){
  const res=solveFaraid(sel);
  const byId={}; res.rows.forEach(r=>byId[r.id]=r.reason||'');
  if(res.baitulmal) byId['baitulmal']=res.baitulmal.reason||'';
  const blk={}; (res.blockedRows||[]).forEach(b=>blk[b.id]=b.reason||'');
  let ok=true, msg=[];
  for(const [id,frag] of Object.entries(checks.rows||{})){
    if(!byId[id] || !byId[id].includes(frag)){ ok=false; msg.push(`row ${id} reason "${byId[id]||'(none)'}" lacks "${frag}"`); }
  }
  for(const [id,frag] of Object.entries(checks.blocked||{})){
    if(!blk[id] || !blk[id].includes(frag)){ ok=false; msg.push(`blocked ${id} reason "${blk[id]||'(none)'}" lacks "${frag}"`); }
  }
  if(ok){ pass++; console.log(`✓ ${name}`); }
  else { fail++; console.log(`✗ ${name}`); msg.forEach(m=>console.log('  '+m)); }
}
rsn('Wife with children → "Ada keturunan" 1/8', {is:1,al:1}, {rows:{is:'Ada keturunan', al:'asabah'}});
rsn('Husband no children → "Tiada keturunan" 1/2', {s:1,sk:1}, {rows:{s:'Tiada keturunan'}});
rsn('Mother reduced to 1/6 by descendant', {i:1,al:1}, {rows:{i:'Ada keturunan'}});
rsn('Mother 1/3 (no descendant, <2 siblings)', {i:1,bk:1}, {rows:{i:'kurang dua adik-beradik'}});
rsn('Mother 1/6 via 2+ (mahjub) siblings', {i:1,bk:2,b:1}, {rows:{i:'Dua atau lebih adik-beradik'}});
rsn('Daughter alone → radd marker', {ap:1}, {rows:{ap:'radd'}});
rsn('Son + daughter asabah (2:1)', {al:1,ap:1}, {rows:{al:'asabah', ap:'asabah'}});
rsn('Sister with daughter → asabah maal-ghair', {ap:1,sk:1}, {rows:{sk:"ma'al-ghair"}});
rsn('Spouse-only surplus → Baitulmal reason', {s:1}, {rows:{baitulmal:'Baitulmal'}});
rsn('Grandfather blocked by father (mahjub)', {b:1,d:1}, {blocked:{d:'Terhalang (mahjub) oleh Bapa'}});
rsn('Grandson blocked by son (mahjub)', {al:1,cl:1}, {blocked:{cl:'Terhalang oleh Anak Lelaki'}});
rsn('Umariyyatan mother reason', {s:1,i:1,b:1}, {rows:{i:'Umariyyatān'}});
rsn('Umariyyatan reason survives a mahjub heir', {s:1,i:1,b:1,nsi:1}, {rows:{i:'Umariyyatān'}});
rsn('GF + sister share the residue by muqasamah', {d:1,sk:1}, {rows:{d:'muqasamah', sk:'muqasamah'}});
rsn('Akdariyyah names itself on both rows', {s:1,i:1,d:1,sk:1}, {rows:{d:'Akdariyyah', sk:'Akdariyyah'}});
// An asabah left with no residue is not mahjub, and must not be told he was blocked.
rsn('No residue left ≠ terhalang', {s:1,sk:2,nk:1}, {blocked:{nk:'tiada baki'}});
rsn('Nearer asabah took the residue', {ap:1,b:1,uk:1}, {blocked:{uk:'lebih hampir'}});
rsn('Genuinely mahjub heir still says terhalang', {al:1,bk:1}, {blocked:{bk:'Terhalang'}});

// --- confidence / risk level (engine flags intricate or unsupported cases) ---
function ctest(name, sel, expected){
  const res=solveFaraid(sel);
  if(res.confidence===expected){ pass++; console.log(`✓ ${name}`); }
  else { fail++; console.log(`✗ ${name}: got ${res.confidence} want ${expected}`); }
}
ctest('Confidence: common case (wife+son) → standard', {is:1,al:1}, 'standard');
ctest('Confidence: husband + 2 sisters (aul) → standard', {s:1,sk:2}, 'standard');
ctest('Confidence: Umariyyatan → standard', {s:1,i:1,b:1}, 'standard');
ctest('Confidence: grandfather + brother (muqasamah) → complex', {d:1,bk:1}, 'complex');
ctest('Confidence: sister + daughter (asabah maal-ghair) → complex', {ap:1,sk:1}, 'complex');
ctest('Confidence: Musytarakah → complex', {s:1,i:1,ss:2,bk:1}, 'complex');
// Akdariyyah is now computed per the classical rule, so it is "intricate", not "unsupported".
ctest('Confidence: Akdariyyah (husband+mother+gf+sister) → complex', {s:1,i:1,d:1,sk:1}, 'complex');
ctest('Confidence: muaddah (gf + full + consanguine sibs) → review', {d:1,bk:1,bt:1}, 'review');

// --- asset net-total logic (insured debts not deducted; uninsured deducted; clamp at 0) ---
const assetBlock = script.slice(script.indexOf('function loanDeduction'), script.indexOf('\nfunction renderAssets'));
function netTotalFor(assets, loans){
  return new Function('state', assetBlock + '\n;return netTotal();')({assets, loans});
}
function atest(name, assets, expected, loans){
  const got = netTotalFor(assets, loans);
  if(got===expected){ pass++; console.log(`✓ ${name}`); }
  else { fail++; console.log(`✗ ${name}: got ${got} want ${expected}`); }
}
atest('Plain asset', [{amount:100000,isLoan:false,isInsured:false}], 100000);
atest('Insured loan: full value counts', [{amount:300000,isLoan:true,isInsured:true,loanAmount:200000}], 300000);
atest('Uninsured loan: subtract outstanding', [{amount:300000,isLoan:true,isInsured:false,loanAmount:200000}], 100000);
atest('Underwater uninsured loan reduces other assets',
  [{amount:100000,isLoan:true,isInsured:false,loanAmount:150000},{amount:200000,isLoan:false}], 150000);
atest('Insolvent estate clamps to 0',
  [{amount:50000,isLoan:true,isInsured:false,loanAmount:90000}], 0);
// standalone debts / liabilities (state.loans)
atest('No loans key still works (backward compatible)', [{amount:100000}], 100000);
atest('Standalone uninsured debt is deducted',
  [{amount:100000}], 70000, [{amount:30000,isInsured:false}]);
atest('Standalone insured debt is NOT deducted',
  [{amount:100000}], 100000, [{amount:30000,isInsured:true}]);
atest('Mixed: asset loan + standalone debt both deducted',
  [{amount:300000,isLoan:true,isInsured:false,loanAmount:50000}], 200000, [{amount:50000,isInsured:false}]);
atest('Standalone debts exceeding estate clamp to 0',
  [{amount:40000}], 0, [{amount:60000,isInsured:false}]);

// --- funnel rule engine (pure: operates on a `signals` object, logic only) ---
const recommendProducts = new Function(engine + '\n;return recommendProducts;')();
function sig(over){
  return Object.assign({
    hasSpouse:false, spouseId:null, spousePct:0,
    hasSon:false, hasGrandsonEff:false, hasMaleDescendant:false, hasDaughter:false, hasDescendant:false,
    inheritingHeads:0, asalMasalah:1, baitulmalPct:0, noHeirs:false,
    gross:0, debt:0, net:0, debtRatio:0, underwater:false,
    hasProperty:false, propertyValue:0, propertyHasLoan:false, liquidRatio:1, uninsuredPropertyLoan:false, hasTakafulHibah:false,
  }, over||{});
}
function rtest(name, signals, check){
  const rec = recommendProducts(signals);
  const codes = rec.triggers.map(t=>t.code);
  let ok=true;
  try{ ok = check(rec, codes) !== false; }catch(e){ ok=false; }
  if(ok){ pass++; console.log(`✓ ${name}`); }
  else { fail++; console.log(`✗ ${name}  codes=[${codes.join(',')}] primary=${rec.primary&&rec.primary.product}`); }
}
rtest('Underwater estate → takaful_hibah primary',
  sig({gross:100000,debt:120000,underwater:true,debtRatio:1.2}),
  (r,c)=> c.includes('underwater') && !c.includes('high_debt') && r.primary.product==='takaful_hibah');
rtest('High debt (ratio>=0.5, not underwater) → high_debt',
  sig({gross:100000,debt:50000,debtRatio:0.5}),
  (r,c)=> c.includes('high_debt') && !c.includes('underwater') && r.primary.product==='takaful_hibah');
rtest('debtRatio just under 0.5 → no high_debt',
  sig({gross:100000,debt:49000,debtRatio:0.49}),
  (r,c)=> !c.includes('high_debt'));
rtest('Daughters, no son → no_son, hibah_amanah primary',
  sig({hasDaughter:true,hasDescendant:true,inheritingHeads:2}),
  (r,c)=> c.includes('no_son') && r.primary.product==='hibah_amanah');
rtest('Property + spouse → property_to_spouse',
  sig({hasProperty:true,propertyValue:180000,hasSpouse:true,spouseId:'is',hasDescendant:true,inheritingHeads:3,gross:180000,liquidRatio:0}),
  (r,c)=> c.includes('property_to_spouse') && c.includes('fragmentation'));
rtest('Baitulmal share → baitulmal (critical)',
  sig({baitulmalPct:50,inheritingHeads:1}),
  (r,c)=> { const b=r.triggers.find(t=>t.code==='baitulmal'); return c.includes('baitulmal') && b.severity===3 && r.primary.product==='wasiat'; });
rtest('Empty estate → only baselines (wasiat info + al-wasitah medium)',
  sig({noHeirs:true,gross:0}),
  (r,c)=> c.length===2 && c.includes('baseline_wasiat') && c.includes('baseline_wasitah') && r.primary.product==='al_wasitah');
rtest('Al-Wasitah fires for everyone at medium severity',
  sig({al:1,hasMaleDescendant:true,hasDescendant:true,inheritingHeads:1,gross:50000}),
  (r,c)=> { const w=r.triggers.find(t=>t.code==='baseline_wasitah'); return c.includes('baseline_wasitah') && w.product==='al_wasitah' && w.severity===1; });
rtest('Healthy estate (heirs, no debt/property issues) → al_wasitah primary',
  sig({al:1,hasMaleDescendant:true,hasDescendant:true,inheritingHeads:1,gross:50000}),
  (r,c)=> r.primary.product==='al_wasitah');
rtest('Al-Wasitah does NOT outrank an urgent (high/critical) recommendation',
  sig({underwater:true,gross:100000,debt:120000,debtRatio:1.2}),
  (r,c)=> c.includes('baseline_wasitah') && r.primary.product==='takaful_hibah');
rtest('inheritingHeads 2 + property → no fragmentation',
  sig({hasProperty:true,inheritingHeads:2,gross:100000}),
  (r,c)=> !c.includes('fragmentation'));
rtest('inheritingHeads 3 + property → fragmentation',
  sig({hasProperty:true,inheritingHeads:3,gross:100000}),
  (r,c)=> c.includes('fragmentation'));
rtest('Spouse, no descendant → no_descendant_spouse',
  sig({hasSpouse:true,spouseId:'s',spousePct:50,hasDescendant:false,inheritingHeads:1}),
  (r,c)=> c.includes('no_descendant_spouse') && !c.includes('no_son'));
// Critical tie: baseline_wasiat (info) must NOT let Wasiat outrank an underwater Takaful.
rtest('Underwater + baitulmal → takaful_hibah beats wasiat',
  sig({hasSpouse:true,spouseId:'s',spousePct:50,baitulmalPct:50,underwater:true,gross:100000,debt:130000,debtRatio:1.3,inheritingHeads:1}),
  (r,c)=> c.includes('underwater') && c.includes('baitulmal') && r.primary.product==='takaful_hibah');

/* --- backup sanitising (restore is the app's only untrusted-input boundary) --- */
const uidFn     = script.slice(script.indexOf('function uid()'), script.indexOf('// Every asset/loan/bill needs'));
const maxForFn  = script.slice(script.indexOf('function maxFor(h)'), script.indexOf('\nfunction toggleHeir'));
const cleanBlock= script.slice(script.indexOf('function validBackup'), script.indexOf('function exportBackup'));
const [validBackup, normalizeState] =
  new Function(engine + uidFn + maxForFn + cleanBlock + '\n;return [validBackup,normalizeState];')();
function ntest(name, input, check){
  let ok=false, got;
  try{ got=normalizeState(input); ok = check(got)!==false; }catch(e){ got={threw:e.message}; }
  if(ok){ pass++; console.log(`✓ ${name}`); }
  else { fail++; console.log(`✗ ${name}\n   got ${JSON.stringify(got)}`); }
}
// An id reaches the DOM as an attribute value, so a crafted one must never survive restore.
ntest('Markup in an asset id is replaced with a fresh safe id',
  {assets:[{id:'"><img src=x onerror=alert(1)>', type:'savings', label:'X', amount:100}]},
  s=> /^[A-Za-z0-9_-]{1,40}$/.test(s.assets[0].id) && !s.assets[0].id.includes('<'));
ntest('A safe id is preserved as-is',
  {assets:[{id:'seed-elektrik', type:'savings', label:'X', amount:100}]},
  s=> s.assets[0].id==='seed-elektrik');
ntest('Reserved keys are never accepted as ids',
  {assets:[{id:'__proto__', type:'savings', label:'X', amount:100}]},
  s=> s.assets[0].id!=='__proto__' && !('x' in Object.prototype));
ntest('Amounts are coerced to non-negative numbers',
  {assets:[{id:'a1',type:'savings',label:'A',amount:'-500'},{id:'a2',type:'savings',label:'B',amount:null},
           {id:'a3',type:'savings',label:'C',amount:'12,000'},{id:'a4',type:'savings',label:'D',amount:1e999}]},
  s=> s.assets.map(a=>a.amount).join()==='0,0,0,0');
ntest('Unknown asset type falls back to "others"',
  {assets:[{id:'a1',type:'<script>',label:'A',amount:100}]},
  s=> s.assets[0].type==='others');
ntest('Non-object entries are dropped from the lists',
  {assets:['x',null,42,{id:'a1',type:'savings',label:'A',amount:100}], loans:[null], bills:['nope']},
  s=> s.assets.length===1 && s.loans.length===0 && s.bills.length===0);
ntest('Unknown heirs dropped and counts clamped',
  {sel:{al:'3', ap:999, is:99, nope:5, __proto__:1}},
  s=> s.sel.al===3 && s.sel.ap===9 && s.sel.is===4 && !('nope' in s.sel));
ntest('Only one spouse survives a restore',
  {sel:{s:1, is:2}}, s=> s.sel.s===1 && !('is' in s.sel));
ntest('Hibah pointing at a missing asset or a non-heir is dropped',
  {assets:[{id:'a1',type:'savings',label:'A',amount:100}], hibah:{a1:'ap', ghost:'ap', a1x:'nobody'}},
  s=> s.hibah.a1==='ap' && Object.keys(s.hibah).length===1);
ntest('Hibah to the explicit non-heir option survives',
  {assets:[{id:'a1',type:'savings',label:'A',amount:100}], hibah:{a1:'other'}},
  s=> s.hibah.a1==='other');
ntest('Bill log keeps real months and drops the rest',
  {billLog:{'2026-07':{'m:seed-air':35, 'bogus key':10}, 'not-a-month':{'m:x':1}}},
  s=> s.billLog['2026-07']['m:seed-air']===35 && !('bogus key' in s.billLog['2026-07']) && !('not-a-month' in s.billLog));
ntest('A backup with nothing usable normalises to an empty estate',
  {sel:'nope', assets:'nope', hibah:7},
  s=> Object.keys(s.sel).length===0 && s.assets.length===0 && Object.keys(s.hibah).length===0);
ntest('An ordinary backup round-trips unchanged',
  {sel:{is:1,al:2}, assets:[{id:'a1',type:'property',label:'Rumah',amount:180000,isLoan:true,isInsured:true,loanAmount:120000,extra:{monthly:850}}],
   loans:[{id:'l1',label:'PTPTN',amount:8000,isInsured:false}], bills:[{id:'b1',label:'Air',amount:35,category:'Utiliti'}]},
  s=> s.sel.al===2 && s.assets[0].amount===180000 && s.assets[0].loanAmount===120000 &&
      s.assets[0].extra.monthly===850 && s.loans[0].amount===8000 && s.bills[0].category==='Utiliti');
if(validBackup({sel:{}}) && !validBackup(null) && !validBackup([1,2]) && !validBackup({nope:1})){
  pass++; console.log('✓ validBackup accepts a real backup and rejects junk');
} else { fail++; console.log('✗ validBackup accepts a real backup and rejects junk'); }

/* ============================================================
   INVARIANT SWEEP — every result must divide the estate exactly.

   The engine's core promise is that the shares (plus any Baitulmal remainder) add up to exactly
   the whole estate. Hand-written cases only cover combinations somebody thought to write down;
   this sweeps the heir space instead. It is what catches a share being assigned twice or
   overwritten — the grandfather-with-sisters bug quietly summed to 1/2 or 1/3 of the estate
   while every hand-written case still passed.
   ============================================================ */
function bgcd(a,b){ a=a<0n?-a:a; b=b<0n?-b:b; while(b){const t=a%b;a=b;b=t;} return a||1n; }
function shareSum(res){
  let n=0n, d=1n;
  const add=(fn,fd)=>{ n=n*BigInt(fd)+BigInt(fn)*d; d=d*BigInt(fd); const g=bgcd(n,d); n/=g; d/=g; };
  res.rows.forEach(r=>add(r.frac.n,r.frac.d));
  if(res.baitulmal) add(res.baitulmal.frac.n,res.baitulmal.frac.d);
  return [n,d];
}
// Returns a list of violated invariants for one selection (empty when the case is sound).
function invariantProblems(sel){
  const res=solveFaraid(sel);
  const out=[];
  if(res.rows.length===0) return out;                      // nobody inherits: nothing to divide
  const [n,d]=shareSum(res);
  if(!(n===1n&&d===1n)) out.push(`shares sum to ${n}/${d}, not the whole estate`);
  res.rows.forEach(r=>{
    if(r.frac.n<=0) out.push(`${r.id} listed as inheriting but has share ${r.frac.n}/${r.frac.d}`);
    if(!r.reason)   out.push(`${r.id} inherits with no "Sebab" explanation`);
  });
  if(res.baitulmal&&res.baitulmal.frac.n<=0) out.push('Baitulmal row with a non-positive share');
  (res.blockedRows||[]).forEach(b=>{ if(!b.reason) out.push(`${b.id} listed as not inheriting with no reason`); });
  return out;
}
function sweep(name, cases){
  const bad=[]; const conf={standard:0,complex:0,review:0};
  for(const sel of cases){
    try{
      conf[solveFaraid(sel).confidence]++;
      const problems=invariantProblems(sel);
      if(problems.length && bad.length<8) bad.push({sel,problems});
      else if(problems.length) bad.push(null);
    }catch(e){ bad.push({sel,problems:['threw: '+e.message]}); }
  }
  const nbad=bad.length;
  if(nbad===0){
    pass++; console.log(`✓ ${name} — ${cases.length} cases, all divide the estate exactly `+
      `(${conf.standard} standard / ${conf.complex} complex / ${conf.review} review)`);
  } else {
    fail++; console.log(`✗ ${name} — ${nbad}/${cases.length} cases violate an invariant`);
    bad.filter(Boolean).forEach(b=>{
      console.log(`   ${JSON.stringify(b.sel)}`);
      b.problems.forEach(p=>console.log(`     ↳ ${p}`));
    });
  }
}

// (a) exhaustive: every combination of up to 3 different heirs, one head each
const ids=HEIRS.map(h=>h.id);
const bothSpouses=s=>s.s&&s.is;                        // the UI keeps these mutually exclusive
const exhaustive=[];
for(let i=0;i<ids.length;i++){
  exhaustive.push({[ids[i]]:1});
  for(let j=i+1;j<ids.length;j++){
    exhaustive.push({[ids[i]]:1,[ids[j]]:1});
    for(let k=j+1;k<ids.length;k++) exhaustive.push({[ids[i]]:1,[ids[j]]:1,[ids[k]]:1});
  }
}
sweep('Invariants: every 1–3 heir combination', exhaustive.filter(s=>!bothSpouses(s)));

// (b) randomised: larger families with multi-head counts. Seeded, so a failure is reproducible.
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0;
  let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const rnd=mulberry32(20260722);
const pick=n=>Math.floor(rnd()*n);
const random=[];
while(random.length<30000){
  const sel={}, n=1+pick(6);
  for(let i=0;i<n;i++){
    const h=HEIRS[pick(HEIRS.length)];
    sel[h.id] = h.multi ? 1+pick(h.id==='is'?4:5) : 1;
  }
  if(!bothSpouses(sel)) random.push(sel);
}
sweep('Invariants: 30k random families (1–6 heirs, multi-head)', random);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
