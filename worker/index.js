const DEFAULT_ALLOWED_ORIGINS = [
  'https://gcc1021.github.io',
  'https://fitsolo-ai-gcc1021.fuzzy-shrew-9655.chatgpt.site'
];

const SYSTEM_PROMPT = [
  '你是 FITSOLO-AI 的全局健身智能体。',
  '请用热情、清晰、简短的中文回答，优先给出安全、可执行的居家健身建议。',
  '涉及伤病、胸痛、呼吸困难或其他医疗风险时，应建议用户停止训练并咨询专业医生。'
].join('');

const DEMO_ACCOUNTS = new Map([
  ['13800138000', '123456'], ['13800138001', '234567'],
  ['13800138002', '345678'], ['13800138003', '456789'],
  ['13800138004', '567890'], ['13800138005', '678901'],
  ['13800138006', '789012'], ['13800138007', '890123'],
  ['13800138008', '901234'], ['13800138009', '012345']
]);

const TRAINING_TYPES = new Set(['力量训练', '有氧训练', 'HIIT', '瑜伽拉伸', '功能训练', '其他']);

function getAllowedOrigins(env) {
  const configured = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return new Set(configured.length ? configured : DEFAULT_ALLOWED_ORIGINS);
}

function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return { Vary: 'Origin' };
  if (origin !== new URL(request.url).origin && !getAllowedOrigins(env).has(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function jsonResponse(data, status, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders
    }
  });
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

async function parsePayload(request) {
  const bodyText = await request.text();
  if (bodyText.length > 64 * 1024) throw new Error('请求内容过大。');
  return JSON.parse(bodyText || '{}');
}

function toBase64Url(bytes) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function importSessionKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function createSessionToken(userId, env) {
  const secret = String(env.FITSOLO_SESSION_SECRET || '');
  if (secret.length < 24) throw new Error('会员会话密钥尚未配置。');
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({
    sub: userId,
    role: 'member',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
  })));
  const key = await importSessionKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return payload + '.' + toBase64Url(new Uint8Array(signature));
}

async function getSession(request, env) {
  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const secret = String(env.FITSOLO_SESSION_SECRET || '');
  if (secret.length < 24) return null;
  try {
    const key = await importSessionKey(secret);
    const valid = await crypto.subtle.verify(
      'HMAC', key, fromBase64Url(parts[1]), new TextEncoder().encode(parts[0])
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
  return values.year + '-' + values.month + '-' + values.day;
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

async function handleMemberLogin(request, env, corsHeaders) {
  let payload;
  try {
    payload = await parsePayload(request);
  } catch (error) {
    return jsonResponse({ message: error.message || '请求格式不正确。' }, 400, corsHeaders);
  }
  const phone = typeof payload.phone === 'string' ? payload.phone.trim() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';
  if (DEMO_ACCOUNTS.get(phone) !== password) {
    return jsonResponse({ message: '手机号或密码不匹配，请检查演示账号后重试。' }, 401, corsHeaders);
  }
  try {
    const token = await createSessionToken('member:' + phone, env);
    return jsonResponse({
      token,
      identity: {
        role: 'member', phone,
        memberId: 'FS-' + phone.slice(-4),
        displayName: 'FITSOLO 会员 ' + phone.slice(-2),
        loggedInAt: new Date().toISOString()
      }
    }, 200, corsHeaders);
  } catch (error) {
    return jsonResponse({ message: error.message || '会员登录服务暂不可用。' }, 503, corsHeaders);
  }
}

async function handleCheckIns(request, env, corsHeaders) {
  const session = await getSession(request, env);
  if (!session) return jsonResponse({ message: '登录状态已失效，请重新登录。' }, 401, corsHeaders);
  if (!env.DB) return jsonResponse({ message: '打卡数据库尚未配置。' }, 503, corsHeaders);

  if (request.method === 'GET') {
    const result = await env.DB.prepare(`
      SELECT id, user_id, check_in_date, training_type, duration_minutes, note, created_at
      FROM check_in_records
      WHERE user_id = ?
      ORDER BY check_in_date DESC, created_at DESC
    `).bind(session.sub).all();
    return jsonResponse({ records: (result.results || []).map(mapCheckIn) }, 200, corsHeaders);
  }

  let payload;
  try {
    payload = await parsePayload(request);
  } catch (error) {
    return jsonResponse({ message: error.message || '请求格式不正确。' }, 400, corsHeaders);
  }
  const trainingType = typeof payload.trainingType === 'string' ? payload.trainingType.trim() : '';
  const durationMinutes = Number(payload.durationMinutes);
  const note = typeof payload.note === 'string' ? payload.note.trim().slice(0, 500) : '';
  if (!TRAINING_TYPES.has(trainingType)) {
    return jsonResponse({ message: '请选择有效的训练类型。' }, 400, corsHeaders);
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 600) {
    return jsonResponse({ message: '训练时长需为 1–600 分钟。' }, 400, corsHeaders);
  }

  const checkInDate = todayInShanghai();
  await env.DB.prepare(`
    INSERT INTO check_in_records (user_id, check_in_date, training_type, duration_minutes, note)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, check_in_date) DO UPDATE SET
      training_type = excluded.training_type,
      duration_minutes = excluded.duration_minutes,
      note = excluded.note
  `).bind(session.sub, checkInDate, trainingType, durationMinutes, note).run();
  const record = await env.DB.prepare(`
    SELECT id, user_id, check_in_date, training_type, duration_minutes, note, created_at
    FROM check_in_records WHERE user_id = ? AND check_in_date = ?
  `).bind(session.sub, checkInDate).first();
  return jsonResponse({ record: mapCheckIn(record) }, 201, corsHeaders);
}

function proxyDeepSeekStream(upstream) {
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let buffer = '';
      try {
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
              if (typeof text === 'string' && text) {
                controller.enqueue(encoder.encode('event: delta\ndata: ' + JSON.stringify({ text }) + '\n\n'));
              }
            } catch {
              // 忽略上游被截断的单个事件，继续等待下一个完整数据块。
            }
          }
          if (part.done) break;
        }
        controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode('event: error\ndata: ' + JSON.stringify({
          error: error.message || '智能体流式连接中断。'
        }) + '\n\n'));
        controller.close();
      } finally {
        reader.releaseLock();
      }
    }
  });
}

async function handleAgentChat(request, env, corsHeaders) {
  if (!env.DEEPSEEK_API_KEY) {
    return jsonResponse({ message: '智能体服务尚未配置 API 密钥。' }, 503, corsHeaders);
  }

  let payload;
  try {
    payload = await parsePayload(request);
  } catch (error) {
    return jsonResponse({ message: error.message || '请求格式不正确。' }, 400, corsHeaders);
  }

  const message = typeof payload.message === 'string' ? payload.message.trim() : '';
  if (!message) return jsonResponse({ message: '消息不能为空。' }, 400, corsHeaders);

  const baseUrl = String(env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
  const model = String(env.DEEPSEEK_MODEL || 'deepseek-v4-flash');
  let upstream;
  try {
    upstream = await fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.DEEPSEEK_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...normalizeHistory(payload.history),
          { role: 'user', content: message.slice(0, 4000) }
        ]
      })
    });
  } catch {
    return jsonResponse({ message: '暂时无法连接 DeepSeek，请稍后重试。' }, 502, corsHeaders);
  }

  if (!upstream.ok || !upstream.body) {
    return jsonResponse({ message: 'DeepSeek 服务暂时不可用（HTTP ' + upstream.status + '）。' }, 502, corsHeaders);
  }

  return new Response(proxyDeepSeekStream(upstream), {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      ...corsHeaders
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/agent/chat' || url.pathname === '/api/auth/login' || url.pathname === '/api/check-ins') {
      const corsHeaders = getCorsHeaders(request, env);
      if (!corsHeaders) return jsonResponse({ message: '该来源不允许访问接口。' }, 403);
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
      if (url.pathname === '/api/agent/chat') {
        if (request.method !== 'POST') return jsonResponse({ message: 'Method not allowed' }, 405, corsHeaders);
        return handleAgentChat(request, env, corsHeaders);
      }
      if (url.pathname === '/api/auth/login') {
        if (request.method !== 'POST') return jsonResponse({ message: 'Method not allowed' }, 405, corsHeaders);
        return handleMemberLogin(request, env, corsHeaders);
      }
      if (request.method !== 'GET' && request.method !== 'POST') {
        return jsonResponse({ message: 'Method not allowed' }, 405, corsHeaders);
      }
      return handleCheckIns(request, env, corsHeaders);
    }

    if (!env.ASSETS) return new Response('Static assets binding is unavailable.', { status: 503 });
    if (url.pathname === '/') url.pathname = '/index.html';
    return env.ASSETS.fetch(new Request(url, request));
  }
};
