import { cpSync, mkdirSync, rmSync } from 'node:fs';
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
cpSync(resolve(projectRoot, 'worker', 'index.js'), resolve(serverDir, 'index.js'));
console.log('FITSOLO production bundle created in dist/.');
