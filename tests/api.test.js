import { test } from 'node:test';
import assert from 'node:assert';
import { md5hex, getCookie, gameHeaders } from '../src/see_toolkit/core/api.js';

test('md5 known vectors', () => {
  assert.equal(md5hex(''), 'd41d8cd98f00b204e9800998ecf8427e');
  assert.equal(md5hex('abc'), '900150983cd24fb0d6963f7d28e17f72');
});
test('getCookie parses from a cookie string', () => {
  assert.equal(getCookie('csrftoken', 'a=1; csrftoken=XYZ; b=2'), 'XYZ');
  assert.equal(getCookie('missing', 'a=1'), null);
});
test('gameHeaders signs X-Prot = md5(url+now) and includes CSRF', () => {
  const h = gameHeaders('/api/v1/x/', { now: 1000, csrf: 'TOK', tzOffset: -120 });
  assert.equal(h['X-Prot'], md5hex('/api/v1/x/1000'));
  assert.equal(h['X-Ts'], '1000');
  assert.equal(h['X-tz-offset'], '-120');
  assert.equal(h['X-CSRFToken'], 'TOK');
});
