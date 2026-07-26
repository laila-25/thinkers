import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const backendDir = path.resolve(frontendDir, '../backend');
export const databasePath = path.resolve(backendDir, 'storage/framework/testing/e2e.sqlite');
export const backendEnv = {
  ...process.env,
  APP_ENV: 'e2e',
  APP_DEBUG: 'false',
  APP_KEY: 'base64:YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=',
  APP_URL: 'http://127.0.0.1:8010',
  FRONTEND_URL: 'http://127.0.0.1:4173',
  DB_CONNECTION: 'sqlite',
  DB_DATABASE: databasePath,
  CACHE_STORE: 'array',
  SESSION_DRIVER: 'file',
  QUEUE_CONNECTION: 'sync',
  MAIL_MAILER: 'array',
  SANCTUM_STATEFUL_DOMAINS: '127.0.0.1:4173',
  SESSION_SECURE_COOKIE: 'false',
  OPENAI_API_KEY: 'e2e-placeholder-not-used',
};
