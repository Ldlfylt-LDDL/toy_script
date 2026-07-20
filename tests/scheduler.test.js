import { test } from 'node:test';
import assert from 'node:assert';
import { runModules } from '../src/see_toolkit/core/scheduler.js';

test('dry-run collects planned writes without sending', async () => {
  let sent = 0;
  const mod = { id: 'm', title: 'M', plan: () => ({ writes: [{ label: 'w1', send: async () => { sent++; } }], view: {} }) };
  const res = await runModules({ modules: [mod], state: {}, dryRun: true, delay: 0 });
  assert.deepEqual(res.planned, ['w1']);
  assert.equal(sent, 0);
});
test('onModule fires per module as it completes (progressive render)', async () => {
  const seen = [];
  const mk = (id) => ({ id, title: id, plan: () => ({ writes: [], view: { id } }) });
  const bad = { id: 'boom', title: 'B', plan: () => { throw new Error('x'); } };
  await runModules({
    modules: [mk('a'), bad, mk('b')], state: {}, dryRun: true, delay: 0,
    onModule: (mod, view, err) => seen.push([mod.id, view ? view.id : null, !!err]),
  });
  assert.deepEqual(seen, [['a', 'a', false], ['boom', null, true], ['b', 'b', false]]);
});
test('executes writes serially', async () => {
  const order = [];
  const mk = (id) => ({ id, title: id, plan: () => ({ writes: [{ label: id, send: async () => { order.push(id); } }], view: {} }) });
  const res = await runModules({ modules: [mk('a'), mk('b')], state: {}, dryRun: false, delay: 0 });
  assert.deepEqual(order, ['a', 'b']);
  assert.deepEqual(res.executed, ['a', 'b']);
});
