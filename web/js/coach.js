/* FITSOLO Coach 页面逻辑：上下文 + 规则引擎对话 */
(function () {
  'use strict';
  var S = window.FITSOLO_STORE;
  var CO = window.FITSOLO.coach;
  var chat = document.getElementById('chat');
  var input = document.getElementById('chatInput');
  var sendBtn = document.getElementById('sendBtn');
  if (!chat || !input || !sendBtn) return;

  var CHIPS = [
    '今天加班没练怎么办？',
    '体重卡住了不掉秤',
    '代餐和蛋白粉怎么喝？',
    '增肌练不大怎么办？',
    '膝盖有点疼',
    '太累了想休息一天'
  ];

  function addMsg(who, text) {
    var d = document.createElement('div');
    d.className = 'msg ' + who;
    d.textContent = text;
    chat.appendChild(d);
    chat.scrollTop = chat.scrollHeight;
    return d;
  }

  function context() {
    var plan = S.plan();
    var recs = S.checkins();
    var h = [];
    if (plan && plan.profile) {
      var pf = plan.profile;
      h.push('<h4 style="margin-bottom:6px;">当前状态</h4>');
      h.push('<p class="muted small">📋 ' + pf.goal + ' · ' + pf.durationWeeks + ' 周方案 · 每日 ' + plan.numbers.calories + ' kcal / 蛋白 ' + plan.numbers.proteinG + 'g</p>');
    } else {
      h.push('<p class="muted">⚠️ 还没有方案。请先到 <a href="planner.html">做方案</a> 生成你的个性化方案，Coach 才能基于数据指导。</p>');
    }
    if (recs.length) {
      h.push('<p class="muted small">📅 已打卡 ' + recs.length + ' 次，连续 ' + window.FITSOLO.checker.streakDays(recs) + ' 天</p>');
      var signals = CO.detectSignals(recs, plan);
      if (signals.length) {
        h.push('<p class="small" style="margin-top:6px;color:var(--warn);">📊 检测到 ' + signals.length + ' 个调整信号：' + signals.map(function (s) { return s.rule; }).join(', ') + '</p>');
      }
    }
    document.getElementById('contextCard').innerHTML = h.join('');
    return { plan: plan, recs: recs, signals: signals || [] };
  }

  function greeting() {
    var ctx = context();
    if (ctx.signals.length) {
      var list = ctx.signals.map(function (s) { return '（' + s.rule + '）' + s.trigger; }).join('；');
      return '我看到你的最近数据，检测到需要关注的点：' + list + '。想听我给出的调整建议吗？也可以直接问我任何问题。';
    }
    return '你好，我是你的 AI 教练 🤝。基于你的方案和打卡数据，我可以帮你调整训练、饮食，或解答疑问。想聊什么？';
  }

  function send(text) {
    var q = (text || '').trim();
    if (!q) return;
    addMsg('me', q);
    input.value = '';
    var typing = addMsg('bot', '教练正在思考…');
    var ctx = context();
    setTimeout(function () {
      var ans = CO.answer(q, { signals: ctx.signals });
      typing.textContent = ans.text;
      chat.scrollTop = chat.scrollHeight;
    }, 420);
  }

  /* chips */
  var chipsHost = document.getElementById('chips');
  CHIPS.forEach(function (c) {
    var b = document.createElement('button');
    b.className = 'chip';
    b.textContent = c;
    b.addEventListener('click', function () { send(c); });
    chipsHost.appendChild(b);
  });

  sendBtn.addEventListener('click', function () { send(input.value); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(input.value); });

  addMsg('bot', greeting());
})();
