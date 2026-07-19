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

if (process.argv.includes('--watch')) {
  const ctx = await esbuild.context(opts);
  await ctx.watch();
  console.log('watching…');
} else {
  await esbuild.build(opts);
  console.log('built dist/see_toolkit.user.js');
}
