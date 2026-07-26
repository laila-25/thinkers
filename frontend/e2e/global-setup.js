import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { backendDir, backendEnv, databasePath } from './environment.js';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const processFile = path.resolve(frontendDir, 'test-results/e2e-processes.json');

async function waitFor(url) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch { /* Server is still starting. */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`E2E server did not become ready: ${url}`);
}

export default async function globalSetup() {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  fs.rmSync(databasePath, { force: true });
  fs.closeSync(fs.openSync(databasePath, 'w'));

  const artisan = args => execFileSync('php', ['artisan', ...args], {
    cwd: backendDir,
    env: backendEnv,
    stdio: 'inherit',
  });

  artisan(['migrate:fresh', '--force']);
  artisan(['db:seed', '--class=Database\\Seeders\\RolePermissionSeeder', '--force']);
  artisan(['db:seed', '--class=Database\\Seeders\\E2ETestSeeder', '--force']);

  fs.mkdirSync(path.dirname(processFile), { recursive: true });
  const options = { detached: true, stdio: 'ignore', windowsHide: true };
  const php = spawn('php', ['-S', '127.0.0.1:8010', '../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php'], {
    ...options,
    cwd: path.resolve(backendDir, 'public'),
    env: backendEnv,
  });
  const vite = spawn(process.execPath, [path.resolve(frontendDir, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '4173'], {
    ...options,
    cwd: frontendDir,
    env: { ...process.env, VITE_API_PROXY_TARGET: 'http://127.0.0.1:8010' },
  });
  php.unref();
  vite.unref();
  fs.writeFileSync(processFile, JSON.stringify([php.pid, vite.pid]));

  await Promise.all([waitFor('http://127.0.0.1:8010/up'), waitFor('http://127.0.0.1:4173')]);
}
