const DEFAULT_ALLOWED_ORIGINS = [
  'https://gcc1021.github.io',
  'https://fitsolo-ai-gcc1021.fuzzy-shrew-9655.chatgpt.site'
];

const SYSTEM_PROMPT = [
  '你是 FITSOLO-AI 的全局健身智能体。',
  '请用热情、清晰、简短的中文回答，优先给出安全、可执行的居家健身建议。',
  '涉及伤病、胸痛、呼吸困难或其他医疗风险时，应建议用户停止训练并咨询专业医生。'
].join('');

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
  if (!getAllowedOrigins(env).has(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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

    if (url.pathname === '/api/agent/chat') {
      const corsHeaders = getCorsHeaders(request, env);
      if (!corsHeaders) return jsonResponse({ message: '该来源不允许访问智能体接口。' }, 403);
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
      if (request.method !== 'POST') return jsonResponse({ message: 'Method not allowed' }, 405, corsHeaders);
      return handleAgentChat(request, env, corsHeaders);
    }

    if (!env.ASSETS) return new Response('Static assets binding is unavailable.', { status: 503 });
    if (url.pathname === '/') url.pathname = '/index.html';
    return env.ASSETS.fetch(new Request(url, request));
  }
};
