import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { createServer } from 'node:http';

const port = Number(process.env.PORT || 4176);
const publicRoot = join(import.meta.dirname, 'web');
const deepSeekBaseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const deepSeekModel = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
const deepSeekApiKey = process.env.DEEPSEEK_API_KEY || '';
const mockMode = process.env.DEEPSEEK_MOCK === '1';
const systemPrompt = '你是一个网站的智能客服，请用热情、简短的语气回答问题。';

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

createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (request.method === 'POST' && pathname === '/api/agent/chat') {
    handleAgentChat(request, response);
    return;
  }
  if (request.method === 'GET' || request.method === 'HEAD') {
    serveStatic(request, response);
    return;
  }
  sendJson(response, 405, { message: 'Method not allowed' });
}).listen(port, '127.0.0.1', () => {
  console.log(`FITSOLO Agent preview: http://127.0.0.1:${port}`);
  console.log(mockMode ? 'DeepSeek mode: mock SSE' : 'DeepSeek mode: live API');
});

