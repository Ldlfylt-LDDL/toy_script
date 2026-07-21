import esbuild from 'esbuild';
import { readFileSync } from 'node:fs';

// Auto-increment @version each build (date-time based) so Tampermonkey detects
// updates via @updateURL and pulls the new build with no copy/paste.
const d = new Date();
const p = (n) => String(n).padStart(2, '0');
const version = `2.1.${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
const banner = readFileSync('src/see_toolkit/banner.txt', 'utf8').replace('__VERSION__', version);
const opts = {
  entryPoints: ['src/see_toolkit/main.js'],
  bundle: true,
  format: 'iife',
  outfile: 'dist/see_toolkit.user.js',
  banner: { js: banner },
  legalComments: 'none',
  target: 'es2020',
  // Bake the build version into the bundle so the in-panel update check can
  // compare the running version against the remote @version.
  define: { __SEE_VERSION__: JSON.stringify(version) },
};

if (process.argv.includes('--serve')) {
  // Dev mode: rebuild on save AND serve dist/ so the Tampermonkey dev-loader can
  // fetch the latest build on every page refresh. Edit → save → refresh = live.
  const ctx = await esbuild.context(opts);
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: 'dist', host: '127.0.0.1', port: 8127 });
  console.log(`dev server: http://localhost:${port}/see_toolkit.user.js  (watching src, rebuild on save)`);
} else if (process.argv.includes('--watch')) {
  const ctx = await esbuild.context(opts);
  await ctx.watch();
  console.log('watching…');
} else {
  await esbuild.build(opts);
  console.log('built dist/see_toolkit.user.js');
}
