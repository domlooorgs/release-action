import esbuild from 'esbuild';

async function build() {
  await esbuild.build({
    entryPoints: ['src/index.ts', 'src/push-engine.ts'],
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'esm', // TETEP ESM HARGA MATI!
    outdir: 'dist',
    minify: true,
    sourcemap: false,
    
    // 1. DAFTARIN SEMUA MODUL BAWAAN DENGAN PREFIX 'node:'
    // Ini biar esbuild tahu kalau ini modul native modern di ESM
    external: [
      'node:os',
      'node:fs',
      'node:path',
      'node:child_process',
      'node:crypto',
      'node:http',
      'node:https',
      'node:url',
      'node:module'
    ],

    // 2. JALAN NINJA: Pakai alias regex
    // Tiap kali ada library lama di node_modules yang manggil `require('os')` atau `require('fs')` tanpa prefix,
    // esbuild bakal langsung ngeroute itu ke 'node:os' atau 'node:fs' yang udah dideklarasikan sebagai external modern.
    alias: {
      'os': 'node:os',
      'fs': 'node:fs',
      'path': 'node:path',
      'child_process': 'node:child_process',
      'crypto': 'node:crypto',
      'http': 'node:http',
      'https': 'node:https',
      'url': 'node:url',
      'module': 'node:module'
    },

    banner: {
      js: `
        import { fileURLToPath } from 'url';
        import { dirname } from 'path';
        import { createRequire } from 'module';
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const require = createRequire(import.meta.url); // Jaga-jaga kalau ada CJS yang beneran gak bisa diredirect alias
      `,
    },
  });
}

build().catch(() => process.exit(1));
