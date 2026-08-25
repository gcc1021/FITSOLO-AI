import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const distDir = resolve(projectRoot, 'dist');
const clientDir = resolve(distDir, 'client');
const serverDir = resolve(distDir, 'server');

rmSync(distDir, { recursive: true, force: true });
mkdirSync(clientDir, { recursive: true });
mkdirSync(serverDir, { recursive: true });
cpSync(resolve(projectRoot, 'web'), clientDir, { recursive: true });

const worker = `export default {
  async fetch(request, env) {
    if (!env.ASSETS) {
      return new Response('Static assets binding is unavailable.', { status: 503 });
    }

    const url = new URL(request.url);
    if (url.pathname === '/') url.pathname = '/index.html';
    return env.ASSETS.fetch(new Request(url, request));
  }
};
`;

writeFileSync(resolve(serverDir, 'index.js'), worker, 'utf8');
console.log('FITSOLO production bundle created in dist/.');
