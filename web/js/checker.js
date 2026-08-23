/* FITSOLO Checker 页面逻辑 */
(function () {
  'use strict';
  var S = window.FITSOLO_STORE;
  var C = window.FITSOLO.checker;
  var CO = window.FITSOLO.coach;
  var form = document.getElementById('checkinForm');
  if (!form) return;

  function today() { return new Date().toISOString().slice(0, 10); }
  function addDays(str, n) { var p = str.split('-').map(Number); var d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)); return d.toISOString().slice(0, 10); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }

  function getRecords() { return S.checkins(); }
  function saveRecords(r) { S.set('checkins', r); }

  function render() {
    var recs = getRecords();
    var streak = C.streakDays(recs);
    var ws = C.weeklySummary(recs);
    var missed = C.missedDays(recs);
    var next = C.nextMilestone(streak);

    document.getElementById('statStreak').textContent = streak;
    document.getElementById('statRate').textContent = ws.rate + '%';
    document.getElementById('statDays').textContent = ws.days;
    document.getElementById('statTrend').textContent = ws.trend == null ? '—' : (ws.trend > 0 ? '+' : '') + ws.trend;

    var mt = document.getElementById('milestoneText');
    var bar = document.getElementById('milestoneBar');
    if (next) {
      mt.textContent = '已连续打卡 ' + streak + ' 天，距 ' + next + ' 天里程碑还差 ' + (next - streak) + ' 天';
      bar.style.width = Math.min(100, Math.round((streak / next) * 100)) + '%';
    } else {
      mt.textContent = '🎉 已达成 30 天里程碑！继续保持';
      bar.style.width = '100%';
    }

    /* 7 日打卡柱状图 */
    var bars = document.getElementById('weekBars');
    var days = [], have = {};
    recs.forEach(function (r) { have[r.date] = r; });
    for (var i = 6; i >= 0; i--) {
      var d = addDays(today(), -i);
      days.push({ date: d, rec: have[d] });
    }
    bars.innerHTML = days.map(function (x) {
      var label = x.date.slice(5).replace('-', '/');
      var h = x.rec ? (x.rec.trained ? 100 : 34) : 8;
      var color = x.rec ? (x.rec.trained ? 'var(--accent)' : 'var(--warn)') : 'var(--border2)';
      return '<div class="bar" style="height:' + h + '%;background:linear-gradient(180deg,' + color + ',' + color + 'aa);opacity:' + (x.rec ? 1 : 0.5) + ';"><span>' + label + '</span></div>';
    }).join('');

    /* 历史 */
    var hist = document.getElementById('history');
    var sorted = recs.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 10);
    if (!sorted.length) { hist.innerHTML = '<p class="muted small">还没有打卡记录，从今天开始吧 💪</p>'; }
    else {
      hist.innerHTML = sorted.map(function (r) {
        return '<div class="history-item"><span class="date">' + r.date + '</span>'
          + '<span class="badge ' + (r.trained ? 'ok' : 'no') + '">' + (r.trained ? '训练✓' : '没练') + '</span>'
          + '<span class="badge ' + (r.dietOk ? 'ok' : 'no') + '">' + (r.dietOk ? '饮食✓' : '饮食✗') + '</span>'
          + (r.weight ? '<span class="muted">' + r.weight + 'kg</span>' : '')
          + (r.note ? '<span class="muted small" style="flex:1;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(r.note) + '</span>' : '')
          + '</div>';
      }).join('');
    }

    /* 提醒 */
    var notice = document.getElementById('notice');
    var msgs = [];
    if (missed >= 3) msgs.push('⚠️ 已经 ' + missed + ' 天没打卡了——教练想你了。去 <a href="coach.html">智能指导</a> 聊聊，或今天先做个 15 分钟简化训练。');
    if (recs.length >= 2) {
      var signals = CO.detectSignals(recs, S.plan());
      signals.forEach(function (s) { msgs.push('📊 检测到调整信号（' + s.rule + '）：' + s.change + '。详见 <a href="coach.html">智能指导</a>。'); });
    }
    if (msgs.length) { notice.style.display = ''; notice.innerHTML = msgs.map(function (m) { return '<p style="margin-bottom:6px;">' + m + '</p>'; }).join(''); }
    else { notice.style.display = 'none'; }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var trained = form.querySelector('input[name="trained"]:checked').value === 'yes';
    var diet = form.querySelector('input[name="dietOk"]:checked').value;
    var dietOk = diet !== 'no';
    var weight = form.ckWeight.value ? +form.ckWeight.value : null;
    var rec = {
      date: today(),
      trained: trained, dietOk: dietOk, dietRaw: diet,
      sleep: +form.ckSleep.value, energy: +form.ckEnergy.value,
      weight: weight, note: form.ckNote.value.trim()
    };
    var recs = getRecords();
    var idx = recs.findIndex(function (r) { return r.date === rec.date; });
    if (idx >= 0) { recs[idx] = rec; } else { recs.push(rec); }
    saveRecords(recs);
    form.ckNote.value = ''; form.ckWeight.value = '';
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--accent);color:#0a0e14;font-weight:700;padding:12px 22px;border-radius:12px;z-index:99;box-shadow:0 8px 24px rgba(0,0,0,.4);';
    toast.textContent = trained ? '打卡成功！今天训练完成，继续保持 💪' : '已记录。没练没关系，明天回归正轨！';
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 2400);
    render();
  });

  render();
})();
