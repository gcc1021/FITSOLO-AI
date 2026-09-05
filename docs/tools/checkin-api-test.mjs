/* FITSOLO Worker 打卡 API 的内存 SQLite 集成测试。 */
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker from '../../worker/index.js';

const database = new DatabaseSync(':memory:');
database.exec(readFileSync(new URL('../../drizzle/0000_create_check_in_records.sql', import.meta.url), 'utf8'));

const DB = {
  prepare(sql) {
    const statement = database.prepare(sql);
    let values = [];
    return {
      bind(...nextValues) {
        values = nextValues;
        return this;
      },
      async all() { return { results: statement.all(...values) }; },
      async first() { return statement.get(...values) || null; },
      async run() { return statement.run(...values); }
    };
  }
};

const env = {
  DB,
  FITSOLO_SESSION_SECRET: 'fitsolo-checkin-api-test-secret-2026'
};

async function api(path, options = {}) {
  return worker.fetch(new Request('https://fitsolo.test' + path, options), env);
}

async function login(phone, password) {
  const response = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Login failed');
  return data.token;
}

const invalid = await api('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '13800138000', password: '000000' })
});
if (invalid.status !== 401) throw new Error('Invalid password was accepted');

const token = await login('13800138000', '123456');
const authHeaders = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
const created = await api('/api/check-ins', {
  method: 'POST', headers: authHeaders,
  body: JSON.stringify({ trainingType: '力量训练', durationMinutes: 45, note: '第一次打卡' })
});
if (created.status !== 201) throw new Error('Check-in create failed');

await api('/api/check-ins', {
  method: 'POST', headers: authHeaders,
  body: JSON.stringify({ trainingType: '有氧训练', durationMinutes: 30, note: '更新当天打卡' })
});
const history = await api('/api/check-ins', { headers: { Authorization: 'Bearer ' + token } });
const historyData = await history.json();
if (historyData.records.length !== 1 || historyData.records[0].trainingType !== '有氧训练') {
  throw new Error('Same-day upsert failed');
}

const otherToken = await login('13800138001', '234567');
const otherHistory = await api('/api/check-ins', { headers: { Authorization: 'Bearer ' + otherToken } });
if ((await otherHistory.json()).records.length !== 0) throw new Error('Member data isolation failed');

const unauthorized = await api('/api/check-ins');
if (unauthorized.status !== 401) throw new Error('Unauthorized request was accepted');

console.log('CHECK-IN API TESTS PASSED');
