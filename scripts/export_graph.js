const fs = require('fs');
const html = fs.readFileSync('Simcompanies-production-relationships/simco_tree.html', 'utf8');

// Extract raw arrays from the HTML
const nm = html.match(/const N=\[([\s\S]*?)\];/);
const em = html.match(/const E=\[([\s\S]*?)\];/);

// Parse using Function to avoid eval quirks with destructuring
const N = Function('return [' + nm[1] + ']')();
const E = Function('return [' + em[1] + ']')();

const nodes = N.map(d => ({ id: d.id, name: d.n, zh: d.zh || d.n, cat: d.c }));
const edges = E.map(d => ({ from: d.s, to: d.t, qty: d.a || 1 }));

const out = { nodes, edges };
fs.writeFileSync('data/simco_graph.json', JSON.stringify(out, null, 2));
console.log(`Done: ${nodes.length} nodes, ${edges.length} edges → data/simco_graph.json`);
