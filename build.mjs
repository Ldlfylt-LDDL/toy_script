import esbuild from 'esbuild';
import { readFileSync } from 'node:fs';

const banner = readFileSync('src/see_toolkit/banner.txt', 'utf8');
const opts = {
  entryPoints: ['src/see_toolkit/main.js'],
  bundle: true,
  format: 'iife',
  outfile: 'dist/see_toolkit.user.js',
  banner: { js: banner },
  legalComments: 'none',
  target: 'es2020',
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
