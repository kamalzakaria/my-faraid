import fs from 'fs';
// Extract the pure engine (Fr helpers + HEIRS + solveFaraid) from index.html
const html = fs.readFileSync(new URL('./public/index.html', import.meta.url), 'utf8');
const script = html.split('<script>')[1].split('</script>')[0];
const marker = '\n/* ============================================================\n   STATE + persistence';
const engine = script.slice(0, script.indexOf(marker));
const solveFaraid = new Function(engine + '\n;return solveFaraid;')();

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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
