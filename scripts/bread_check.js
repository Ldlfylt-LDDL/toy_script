const parents = {};
const E=[
  {s:1,t:2,a:0.2},{s:2,t:66,a:0.1},
  {s:2,t:6,a:0.5},{s:66,t:6,a:1},
  {s:2,t:9,a:0.4},{s:6,t:9,a:0.5},
  {s:2,t:117,a:2},{s:139,t:117,a:0.5},
  {s:120,t:139,a:0.5},{s:6,t:139,a:10},
  {s:120,t:141,a:10},{s:1,t:141,a:1},
  {s:2,t:120,a:2},{s:66,t:120,a:5},
  {s:6,t:133,a:15},
  {s:117,t:134,a:0.5},
  {s:133,t:137,a:2},{s:9,t:137,a:1},{s:134,t:137,a:0.5},
  {s:137,t:121,a:1}
];
const nameMap={1:'Power',2:'Water',66:'Seeds',6:'Grain',9:'Eggs',
  117:'Milk',139:'Fodder',120:'Vegetables',141:'Veg Oil',
  133:'Flour',134:'Butter',137:'Dough',121:'Bread'};

E.forEach(e=>{ if(!parents[e.t]) parents[e.t]=[]; parents[e.t].push({s:e.s,a:e.a}); });

const depthCache={};
function getDepth(id){
  if(id===1) return 0;
  if(depthCache[id]!==undefined) return depthCache[id];
  const ps=parents[id]||[];
  if(!ps.length){depthCache[id]=0;return 0;}
  const d=1+Math.max(...ps.map(p=>getDepth(p.s)));
  depthCache[id]=d; return d;
}

function getDeps(id){
  const v=new Set(); const q=[id];
  while(q.length){const c=q.shift();if(v.has(c))continue;v.add(c);(parents[c]||[]).forEach(p=>q.push(p.s));}
  v.delete(id); v.delete(1); return v;
}

const d = getDepth(121);
const deps = getDeps(121);
console.log('Bread 深度:', d);
console.log('依赖节点 (不含Power):', [...deps].map(id=>nameMap[id]||id).join(', '));
console.log('节点总数 (含Bread,不含Power):', deps.size+1);
console.log('\n直接父节点(Dough的原料):');
(parents[121]||[]).forEach(p=>console.log(' ', nameMap[p.s], 'x'+p.a));
console.log('\nDough的父节点:');
(parents[137]||[]).forEach(p=>console.log(' ', nameMap[p.s], 'x'+p.a));
