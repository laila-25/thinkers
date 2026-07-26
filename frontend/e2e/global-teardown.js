import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const processFile = path.resolve(frontendDir, 'test-results/e2e-processes.json');

export default function globalTeardown() {
  if (!fs.existsSync(processFile)) return;

  const processIds = JSON.parse(fs.readFileSync(processFile, 'utf8'));
  for (const processId of processIds) {
    try {
      if (process.platform === 'win32') {
        execFileSync('taskkill', ['/pid', String(processId), '/t', '/f'], { stdio: 'ignore' });
      } else {
        process.kill(-processId, 'SIGTERM');
      }
    } catch { /* The server may already have exited. */ }
  }
  fs.rmSync(processFile, { force: true });
}
