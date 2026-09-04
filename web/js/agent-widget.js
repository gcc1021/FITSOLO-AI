(function () {
  'use strict';

  /*
   * GitHub Pages is kept as a public alias only. The AI endpoint lives on the
   * hosted site, so move visitors there before starting the widget. This makes
   * the chat request same-origin and avoids browsers/extensions blocking the
   * cross-site streaming request.
   */
  var hostedOrigin = 'https://fitsolo-ai-gcc1021.fuzzy-shrew-9655.chatgpt.site';
  if (window.location.hostname === 'gcc1021.github.io') {
    var githubProjectPrefix = '/FITSOLO-AI';
    var hostedPath = window.location.pathname.indexOf(githubProjectPrefix) === 0
      ? window.location.pathname.slice(githubProjectPrefix.length)
      : window.location.pathname;
    window.location.replace(hostedOrigin + (hostedPath || '/') + window.location.search + window.location.hash);
    return;
  }

  /*
   * 可在加载本文件前覆盖以下配置：
   * window.FITSOLO_AGENT_CONFIG = {
   *   apiUrl: '/api/agent/chat', // 后端 SSE 代理接口
   *   assistantName: 'FITSOLO Agent',
   *   welcomeMessage: '你好，我是你的 FITSOLO 智能体。'
   * };
   *
   * API 请求格式：POST { message, history, page }
   * API 响应格式：{ reply: '智能体回复内容' }
   */
  /*
   * GitHub Pages 只托管静态文件，因此备用站点需要调用独立的安全后端。
   * API Key 始终保存在服务端环境变量中，绝不能写入这里。
   */
  var hostedApiUrl = hostedOrigin + '/api/agent/chat';
  var defaults = {
    apiUrl: window.location.hostname === 'gcc1021.github.io' ? hostedApiUrl : '/api/agent/chat',
    assistantName: 'FITSOLO Agent',
    welcomeMessage: '你好，我是你的 FITSOLO 智能体。想制定计划、记录训练，还是解决今天的健身问题？',
    storageKey: 'fitsolo-agent-history-v1',
    positionKey: 'fitsolo-agent-position-v1',
    maxHistory: 30,
    requestTimeout: 45000
  };
  var config = Object.assign({}, defaults, window.FITSOLO_AGENT_CONFIG || {});

  if (document.getElementById('fitsoloAgent')) return;

  var host = document.createElement('aside');
  host.className = 'fitsolo-agent';
  host.id = 'fitsoloAgent';
  host.setAttribute('aria-label', 'FITSOLO 全局智能体');
  host.innerHTML = [
    '<section class="agent-panel" id="agentPanel" role="dialog" aria-modal="false" aria-labelledby="agentPanelTitle" aria-hidden="true">',
    '  <header class="agent-panel-header">',
    '    <span class="agent-mini-drop" aria-hidden="true">F</span>',
    '    <div class="agent-panel-title"><strong id="agentPanelTitle"></strong><span>ONLINE · 随时为你服务</span></div>',
    '    <button class="agent-close" id="agentClose" type="button" aria-label="关闭智能体对话">×</button>',
    '  </header>',
    '  <div class="agent-messages" id="agentMessages" role="log" aria-live="polite" aria-relevant="additions"></div>',
    '  <form class="agent-form" id="agentForm">',
    '    <input class="agent-input" id="agentInput" type="text" maxlength="500" autocomplete="off" placeholder="问我任何健身问题…" aria-label="发送给智能体的消息">',
    '    <button class="agent-send" id="agentSend" type="submit" aria-label="发送消息">→</button>',
    '  </form>',
    '</section>',
    '<div class="agent-launcher-wrap">',
    '  <span class="agent-ripple" aria-hidden="true"></span><span class="agent-ripple" aria-hidden="true"></span>',
    '  <button class="agent-droplet" id="agentLauncher" type="button" aria-label="打开 FITSOLO 智能体" aria-controls="agentPanel" aria-expanded="false">',
    '    <svg class="agent-core-icon" viewBox="0 0 28 24" aria-hidden="true">',
    '      <path d="M5 5.5h18v11H12l-5.5 4v-4H5z"></path>',
    '      <circle cx="10" cy="11" r=".7"></circle><circle cx="14" cy="11" r=".7"></circle><circle cx="18" cy="11" r=".7"></circle>',
    '    </svg>',
    '  </button>',
    '</div>'
  ].join('');
  document.body.appendChild(host);

  var panel = document.getElementById('agentPanel');
  var launcher = document.getElementById('agentLauncher');
  var closeButton = document.getElementById('agentClose');
  var title = document.getElementById('agentPanelTitle');
  var messagesHost = document.getElementById('agentMessages');
  var form = document.getElementById('agentForm');
  var input = document.getElementById('agentInput');
  var sendButton = document.getElementById('agentSend');
  var history = loadHistory();
  var rippleTimer = 0;
  var dragState = null;
  var suppressClick = false;

  title.textContent = config.assistantName;
  if (!history.length) {
    history.push({ role: 'agent', text: config.welcomeMessage });
    saveHistory();
  }
  renderHistory();
  restorePosition();

  function loadHistory() {
    try {
      var saved = JSON.parse(sessionStorage.getItem(config.storageKey) || '[]');
      return Array.isArray(saved) ? saved.slice(-config.maxHistory) : [];
    } catch (error) {
      return [];
    }
  }

  function saveHistory() {
    history = history.slice(-config.maxHistory);
    try {
      sessionStorage.setItem(config.storageKey, JSON.stringify(history));
    } catch (error) {
      // 存储不可用时，对话仍可在当前页面正常使用。
    }
  }

  function createMessage(item) {
    var message = document.createElement('div');
    message.className = 'agent-message ' + (item.role === 'user' ? 'is-user' : 'is-agent');
    message.textContent = item.text; // 使用 textContent，避免用户输入被解释为 HTML。
    return message;
  }

  function renderHistory() {
    messagesHost.replaceChildren();
    history.forEach(function (item) { messagesHost.appendChild(createMessage(item)); });
    scrollToLatest();
  }

  function appendMessage(role, text) {
    var item = { role: role, text: text };
    history.push(item);
    saveHistory();
    messagesHost.appendChild(createMessage(item));
    scrollToLatest();
  }

  function scrollToLatest() {
    window.requestAnimationFrame(function () {
      messagesHost.scrollTop = messagesHost.scrollHeight;
    });
  }

  function setOpen(open) {
    host.classList.toggle('is-open', open);
    panel.setAttribute('aria-hidden', String(!open));
    launcher.setAttribute('aria-expanded', String(open));
    launcher.setAttribute('aria-label', open ? '收起 FITSOLO 智能体' : '打开 FITSOLO 智能体');
    if (open) window.setTimeout(function () { input.focus({ preventScroll: true }); }, 280);
  }

  function updatePanelDirection(x, y) {
    host.classList.toggle('is-panel-right', x < window.innerWidth * 0.5);
    host.classList.toggle('is-panel-below', y < Math.min(610, window.innerHeight * 0.62));
  }

  function savePosition(left, top) {
    try {
      sessionStorage.setItem(config.positionKey, JSON.stringify({
        x: left / Math.max(1, window.innerWidth - host.offsetWidth),
        y: top / Math.max(1, window.innerHeight - host.offsetHeight)
      }));
    } catch (error) {
      // 无法存储时仅保留当前页面内的位置。
    }
  }

  function placeAt(left, top, persist) {
    var maxLeft = Math.max(8, window.innerWidth - host.offsetWidth - 8);
    var maxTop = Math.max(8, window.innerHeight - host.offsetHeight - 8);
    var safeLeft = Math.min(maxLeft, Math.max(8, left));
    var safeTop = Math.min(maxTop, Math.max(8, top));
    host.style.right = 'auto';
    host.style.bottom = 'auto';
    host.style.left = safeLeft + 'px';
    host.style.top = safeTop + 'px';
    updatePanelDirection(safeLeft, safeTop);
    if (persist) savePosition(safeLeft, safeTop);
  }

  function restorePosition() {
    try {
      var saved = JSON.parse(sessionStorage.getItem(config.positionKey) || 'null');
      if (!saved || typeof saved.x !== 'number' || typeof saved.y !== 'number') return;
      placeAt(
        saved.x * Math.max(1, window.innerWidth - host.offsetWidth),
        saved.y * Math.max(1, window.innerHeight - host.offsetHeight),
        false
      );
    } catch (error) {
      // 保存位置损坏时使用默认右下角位置。
    }
  }

  function createDragState(clientX, clientY, pointerId) {
    var bounds = host.getBoundingClientRect();
    dragState = {
      pointerId: pointerId,
      startX: clientX,
      startY: clientY,
      left: bounds.left,
      top: bounds.top,
      dx: 0,
      dy: 0,
      moved: false
    };
  }

  function moveDragTo(clientX, clientY) {
    if (!dragState) return;
    dragState.dx = clientX - dragState.startX;
    dragState.dy = clientY - dragState.startY;
    if (!dragState.moved && Math.hypot(dragState.dx, dragState.dy) > 5) {
      dragState.moved = true;
      host.classList.add('is-dragging');
      setOpen(false);
    }
    if (!dragState.moved) return;

    /* 拖动阶段只更新 transform，不触发布局重排。 */
    var nextLeft = Math.min(window.innerWidth - host.offsetWidth - 8, Math.max(8, dragState.left + dragState.dx));
    var nextTop = Math.min(window.innerHeight - host.offsetHeight - 8, Math.max(8, dragState.top + dragState.dy));
    host.style.transform = 'translate3d(' + (nextLeft - dragState.left) + 'px,' + (nextTop - dragState.top) + 'px,0)';
  }

  function finishDrag() {
    if (!dragState) return;
    if (dragState.moved) {
      var finalLeft = dragState.left + dragState.dx;
      var finalTop = dragState.top + dragState.dy;
      host.style.transform = '';
      host.classList.remove('is-dragging');
      placeAt(finalLeft, finalTop, true);
      suppressClick = true;
      window.setTimeout(function () { suppressClick = false; }, 0);
    }
    dragState = null;
  }

  function beginMouseDrag(event) {
    if (event.button !== 0) return;
    createDragState(event.clientX, event.clientY, 'mouse');
  }

  function moveMouseDrag(event) {
    if (!dragState || dragState.pointerId !== 'mouse') return;
    moveDragTo(event.clientX, event.clientY);
    if (dragState.moved) event.preventDefault();
  }

  function endMouseDrag() {
    if (!dragState || dragState.pointerId !== 'mouse') return;
    finishDrag();
  }

  function beginTouchDrag(event) {
    if (event.pointerType !== 'touch') return;
    createDragState(event.clientX, event.clientY, event.pointerId);
    launcher.setPointerCapture(event.pointerId);
  }

  function moveTouchDrag(event) {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    moveDragTo(event.clientX, event.clientY);
  }

  function endTouchDrag(event) {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    if (launcher.hasPointerCapture(event.pointerId)) launcher.releasePointerCapture(event.pointerId);
    finishDrag();
  }

  function triggerRipple() {
    host.classList.remove('is-rippling');
    void host.offsetWidth; // 仅点击时读取一次布局，用于重启动画。
    host.classList.add('is-rippling');
    window.clearTimeout(rippleTimer);
    rippleTimer = window.setTimeout(function () { host.classList.remove('is-rippling'); }, 1500);
  }

  function showTyping(show) {
    var typing = document.getElementById('agentTyping');
    if (show && !typing) {
      typing = document.createElement('div');
      typing.className = 'agent-typing';
      typing.id = 'agentTyping';
      typing.setAttribute('aria-label', '智能体正在输入');
      typing.innerHTML = '<i></i><i></i><i></i>';
      messagesHost.appendChild(typing);
      scrollToLatest();
    } else if (!show && typing) {
      typing.remove();
    }
  }

  async function streamReply(message, onDelta) {
    /*
     * API 接入点：后端必须返回 Content-Type: text/event-stream。
     * 每个增量事件格式：data: {"text":"新增内容"}\n\n
     * 完成事件格式：event: done\ndata: {}\n\n
     */
    var controller = new AbortController();
    var timeoutId = window.setTimeout(function () { controller.abort(); }, config.requestTimeout);
    var apiUrl = new URL(config.apiUrl, window.location.href);
    var response;
    try {
      response = await window.fetch(apiUrl.href, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        credentials: apiUrl.origin === window.location.origin ? 'same-origin' : 'omit',
        signal: controller.signal,
        body: JSON.stringify({
          message: message,
          history: history.slice(-12),
          page: { title: document.title, path: window.location.pathname }
        })
      });
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('智能体响应超时，请稍后重试。');
      throw new Error('无法连接智能体服务，请检查网络后重试。');
    } finally {
      window.clearTimeout(timeoutId);
    }
    if (!response.ok || !response.body) {
      var errorData = await response.json().catch(function () { return {}; });
      throw new Error(errorData.message || '智能体服务暂时不可用。');
    }

    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';
    var fullText = '';

    while (true) {
      var part = await reader.read();
      buffer += decoder.decode(part.value || new Uint8Array(), { stream: !part.done });
      var blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';

      blocks.forEach(function (block) {
        var dataLine = block.split('\n').find(function (line) { return line.startsWith('data:'); });
        if (!dataLine) return;
        try {
          var payload = JSON.parse(dataLine.slice(5).trim());
          if (payload.error) throw new Error(payload.error);
          if (typeof payload.text === 'string' && payload.text) {
            fullText += payload.text;
            onDelta(payload.text, fullText);
          }
        } catch (error) {
          if (error instanceof SyntaxError) return;
          throw error;
        }
      });

      if (part.done) break;
    }

    if (!fullText) throw new Error('智能体没有返回有效内容。');
    return fullText;
  }

  launcher.addEventListener('click', function () {
    if (suppressClick) return;
    triggerRipple();
    setOpen(!host.classList.contains('is-open'));
  });

  launcher.addEventListener('mousedown', beginMouseDrag);
  document.addEventListener('mousemove', moveMouseDrag);
  document.addEventListener('mouseup', endMouseDrag);
  launcher.addEventListener('pointerdown', beginTouchDrag);
  launcher.addEventListener('pointermove', moveTouchDrag);
  launcher.addEventListener('pointerup', endTouchDrag);
  launcher.addEventListener('pointercancel', endTouchDrag);

  window.addEventListener('resize', function () {
    var bounds = host.getBoundingClientRect();
    placeAt(bounds.left, bounds.top, false);
  }, { passive: true });

  closeButton.addEventListener('click', function () {
    setOpen(false);
    launcher.focus({ preventScroll: true });
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    var text = input.value.trim();
    if (!text || sendButton.disabled) return;
    input.value = '';
    appendMessage('user', text);
    sendButton.disabled = true;
    input.disabled = true;
    showTyping(true);
    var streamingNode = null;
    var fullReply = '';

    try {
      fullReply = await streamReply(text, function (delta, currentText) {
        fullReply = currentText;
        showTyping(false);
        if (!streamingNode) {
          streamingNode = createMessage({ role: 'agent', text: '' });
          messagesHost.appendChild(streamingNode);
        }
        streamingNode.textContent = currentText;
        scrollToLatest();
      });
      history.push({ role: 'agent', text: fullReply });
      saveHistory();
    } catch (error) {
      if (streamingNode && fullReply) {
        streamingNode.textContent = fullReply + '\n（连接中断，请稍后重试）';
        history.push({ role: 'agent', text: streamingNode.textContent });
        saveHistory();
      } else {
        appendMessage('agent', error.message || '连接出现问题，请稍后再试。');
      }
    } finally {
      showTyping(false);
      sendButton.disabled = false;
      input.disabled = false;
      input.focus({ preventScroll: true });
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && host.classList.contains('is-open')) {
      setOpen(false);
      launcher.focus({ preventScroll: true });
    }
  });
})();
