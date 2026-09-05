import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';

const port = Number(process.env.PORT || 4176);
const publicRoot = join(import.meta.dirname, 'web');
const deepSeekBaseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const deepSeekModel = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
const deepSeekApiKey = process.env.DEEPSEEK_API_KEY || '';
const mockMode = process.env.DEEPSEEK_MOCK === '1';
const sessionSecret = process.env.FITSOLO_SESSION_SECRET || 'fitsolo-local-development-session-secret';
const allowedOrigins = new Set(String(process.env.ALLOWED_ORIGINS || [
  'https://gcc1021.github.io',
  'https://fitsolo-ai-gcc1021.fuzzy-shrew-9655.chatgpt.site'
].join(',')).split(',').map((origin) => origin.trim()).filter(Boolean));
const systemPrompt = '你是一个网站的智能客服，请用热情、简短的语气回答问题。';
const demoAccounts = new Map([
  ['13800138000', '123456'], ['13800138001', '234567'],
  ['13800138002', '345678'], ['13800138003', '456789'],
  ['13800138004', '567890'], ['13800138005', '678901'],
  ['13800138006', '789012'], ['13800138007', '890123'],
  ['13800138008', '901234'], ['13800138009', '012345']
]);
const trainingTypes = new Set(['力量训练', '有氧训练', 'HIIT', '瑜伽拉伸', '功能训练', '其他']);
const checkInDatabase = new DatabaseSync(join(import.meta.dirname, 'data', 'fitsolo.db'));
checkInDatabase.exec(readFileSync(join(import.meta.dirname, 'drizzle', '0000_create_check_in_records.sql'), 'utf8'));

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png'
};

function sendJson(response, status, data) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(data));
}

function sendSse(response, event, data) {
  if (response.destroyed || response.writableEnded) return;
  if (event) response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function readJsonBody(request) {
  var body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 64 * 1024) throw new Error('请求内容过大。');
  }
  return JSON.parse(body || '{}');
}

function toBase64Url(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

function fromBase64Url(value) {
  return new Uint8Array(Buffer.from(value, 'base64url'));
}

async function importSessionKey() {
  return crypto.subtle.importKey(
    'raw', new TextEncoder().encode(sessionSecret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
}

async function createSessionToken(userId) {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({
    sub: userId, role: 'member', exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
  })));
  const signature = await crypto.subtle.sign('HMAC', await importSessionKey(), new TextEncoder().encode(payload));
  return payload + '.' + toBase64Url(new Uint8Array(signature));
}

async function getSession(request) {
  const authorization = request.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  try {
    const valid = await crypto.subtle.verify(
      'HMAC', await importSessionKey(), fromBase64Url(parts[1]), new TextEncoder().encode(parts[0])
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[0])));
    if (payload.role !== 'member' || !payload.sub || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function todayInShanghai() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function mapCheckIn(row) {
  return {
    id: row.id,
    userId: row.user_id,
    checkInDate: row.check_in_date,
    trainingType: row.training_type,
    durationMinutes: row.duration_minutes,
    note: row.note,
    createdAt: row.created_at
  };
}

async function handleMemberLogin(request, response) {
  try {
    const payload = await readJsonBody(request);
    const phone = typeof payload.phone === 'string' ? payload.phone.trim() : '';
    const password = typeof payload.password === 'string' ? payload.password : '';
    if (demoAccounts.get(phone) !== password) {
      sendJson(response, 401, { message: '手机号或密码不匹配，请检查演示账号后重试。' });
      return;
    }
    sendJson(response, 200, {
      token: await createSessionToken('member:' + phone),
      identity: {
        role: 'member', phone,
        memberId: 'FS-' + phone.slice(-4),
        displayName: 'FITSOLO 会员 ' + phone.slice(-2),
        loggedInAt: new Date().toISOString()
      }
    });
  } catch (error) {
    sendJson(response, 400, { message: error.message || '请求格式不正确。' });
  }
}

async function handleCheckIns(request, response) {
  const session = await getSession(request);
  if (!session) {
    sendJson(response, 401, { message: '登录状态已失效，请重新登录。' });
    return;
  }
  if (request.method === 'GET') {
    const records = checkInDatabase.prepare(`
      SELECT id, user_id, check_in_date, training_type, duration_minutes, note, created_at
      FROM check_in_records WHERE user_id = ?
      ORDER BY check_in_date DESC, created_at DESC
    `).all(session.sub).map(mapCheckIn);
    sendJson(response, 200, { records });
    return;
  }

  try {
    const payload = await readJsonBody(request);
    const trainingType = typeof payload.trainingType === 'string' ? payload.trainingType.trim() : '';
    const durationMinutes = Number(payload.durationMinutes);
    const note = typeof payload.note === 'string' ? payload.note.trim().slice(0, 500) : '';
    if (!trainingTypes.has(trainingType)) {
      sendJson(response, 400, { message: '请选择有效的训练类型。' });
      return;
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 600) {
      sendJson(response, 400, { message: '训练时长需为 1–600 分钟。' });
      return;
    }
    const checkInDate = todayInShanghai();
    checkInDatabase.prepare(`
      INSERT INTO check_in_records (user_id, check_in_date, training_type, duration_minutes, note)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id, check_in_date) DO UPDATE SET
        training_type = excluded.training_type,
        duration_minutes = excluded.duration_minutes,
        note = excluded.note
    `).run(session.sub, checkInDate, trainingType, durationMinutes, note);
    const record = checkInDatabase.prepare(`
      SELECT id, user_id, check_in_date, training_type, duration_minutes, note, created_at
      FROM check_in_records WHERE user_id = ? AND check_in_date = ?
    `).get(session.sub, checkInDate);
    sendJson(response, 201, { record: mapCheckIn(record) });
  } catch (error) {
    sendJson(response, 400, { message: error.message || '保存打卡失败。' });
  }
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-12).flatMap((item) => {
    if (!item || typeof item.text !== 'string') return [];
    return [{
      role: item.role === 'user' ? 'user' : 'assistant',
      content: item.text.slice(0, 4000)
    }];
  });
}

async function streamMock(response, message) {
  const reply = `收到！这是 DeepSeek SSE 接入预览。你刚才问的是“${message.slice(0, 36)}”。正式配置后，我会通过 DeepSeek V4 Flash 实时回答。`;
  for (const character of reply) {
    sendSse(response, 'delta', { text: character });
    await new Promise((resolve) => setTimeout(resolve, 24));
  }
  sendSse(response, 'done', {});
  response.end();
}

async function streamDeepSeek(response, payload) {
  const upstream = await fetch(`${deepSeekBaseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${deepSeekApiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    },
    body: JSON.stringify({
      model: deepSeekModel,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...normalizeHistory(payload.history),
        { role: 'user', content: payload.message }
      ]
    })
  });

  if (!upstream.ok || !upstream.body) {
    throw new Error(`DeepSeek 请求失败（HTTP ${upstream.status}）。`);
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  var buffer = '';

  while (true) {
    const part = await reader.read();
    buffer += decoder.decode(part.value || new Uint8Array(), { stream: !part.done });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === '[DONE]') continue;
      try {
        const event = JSON.parse(raw);
        const text = event.choices?.[0]?.delta?.content;
        if (typeof text === 'string' && text) sendSse(response, 'delta', { text });
      } catch {
        // 忽略上游不完整事件，等待下一个完整 SSE 数据块。
      }
    }
    if (part.done) break;
  }

  sendSse(response, 'done', {});
  response.end();
}

async function handleAgentChat(request, response) {
  try {
    const payload = await readJsonBody(request);
    if (typeof payload.message !== 'string' || !payload.message.trim()) {
      sendJson(response, 400, { message: '消息不能为空。' });
      return;
    }

    if (!mockMode && !deepSeekApiKey) {
      sendJson(response, 503, { message: '服务端尚未配置 DEEPSEEK_API_KEY。' });
      return;
    }

    response.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    response.flushHeaders();

    if (mockMode) await streamMock(response, payload.message.trim());
    else await streamDeepSeek(response, { ...payload, message: payload.message.trim() });
  } catch (error) {
    if (!response.headersSent) {
      sendJson(response, 502, { message: error.message || '智能体服务连接失败。' });
    } else {
      sendSse(response, 'error', { error: error.message || '智能体服务连接失败。' });
      response.end();
    }
  }
}

function serveStatic(request, response) {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const requested = pathname === '/' ? '/index.html' : pathname;
  const safePath = normalize(requested.replace(/^[/\\]+/, '')).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = join(publicRoot, safePath);

  if (!filePath.startsWith(publicRoot) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    sendJson(response, 404, { message: 'Not found' });
    return;
  }

  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  if (request.method === 'HEAD') response.end();
  else createReadStream(filePath).pipe(response);
}

createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const origin = request.headers.origin;
  const localOrigin = origin && /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(origin);
  const originAllowed = !origin || localOrigin || allowedOrigins.has(origin);
  const apiPath = pathname === '/api/agent/chat' || pathname === '/api/auth/login' || pathname === '/api/check-ins';
  if (origin && originAllowed) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
  }
  if (apiPath && !originAllowed) {
    sendJson(response, 403, { message: '该来源不允许访问接口。' });
    return;
  }
  if (request.method === 'OPTIONS' && apiPath) {
    response.writeHead(204, {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400'
    });
    response.end();
    return;
  }
  if (request.method === 'POST' && pathname === '/api/auth/login') {
    await handleMemberLogin(request, response);
    return;
  }
  if ((request.method === 'GET' || request.method === 'POST') && pathname === '/api/check-ins') {
    await handleCheckIns(request, response);
    return;
  }
  if (request.method === 'POST' && pathname === '/api/agent/chat') {
    await handleAgentChat(request, response);
    return;
  }
  if (request.method === 'GET' || request.method === 'HEAD') {
    serveStatic(request, response);
    return;
  }
  sendJson(response, 405, { message: 'Method not allowed' });
}).listen(port, process.env.HOST || '0.0.0.0', () => {
  console.log(`FITSOLO Agent preview: http://127.0.0.1:${port}`);
  console.log(mockMode ? 'DeepSeek mode: mock SSE' : 'DeepSeek mode: live API');
});
