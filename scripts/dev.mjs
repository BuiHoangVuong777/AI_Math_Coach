#!/usr/bin/env node
/**
 * `npm run dev`: starts the coach API server (server/index.ts, auto-restart on
 * change) and the Vite dev server together. Ctrl+C stops both.
 */
import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [
  { name: 'server', color: 36, proc: spawn(npm, ['run', '--silent', 'dev:server'], { stdio: ['ignore', 'pipe', 'pipe'] }) },
  { name: 'web', color: 35, proc: spawn(npm, ['run', '--silent', 'dev:web'], { stdio: ['ignore', 'pipe', 'pipe'] }) },
];

let stopping = false;
function stopAll(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const { proc } of children) proc.kill('SIGTERM');
  setTimeout(() => process.exit(code), 300);
}

for (const { name, color, proc } of children) {
  const prefix = `\x1b[${color}m[${name}]\x1b[0m `;
  for (const stream of [proc.stdout, proc.stderr]) {
    stream.on('data', (chunk) => {
      for (const line of chunk.toString().split('\n')) if (line.trim()) process.stdout.write(prefix + line + '\n');
    });
  }
  proc.on('exit', (code) => {
    if (!stopping) {
      console.error(`${prefix}exited with code ${code}; stopping.`);
      stopAll(code ?? 1);
    }
  });
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));
