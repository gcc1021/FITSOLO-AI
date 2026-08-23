/* FITSOLO 案例回放页面逻辑 */
(function () {
  'use strict';
  var CASES = window.FITSOLO_CASES || [];
  var listHost = document.getElementById('caseList');
  var detailHost = document.getElementById('detail');
  if (!listHost || !detailHost || !CASES.length) return;

  var TAGS = { '减脂': 't-fatloss', '增肌': 't-gain', '塑形': 't-shaping' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }

  function trainingLines(stage) {
    var t = stage.training || {}, lines = [];
    if (t.frequency) lines.push('训练频率：' + t.frequency);
    if (Array.isArray(t.days)) t.days.forEach(function (d) {
      if (typeof d === 'string') lines.push(d);
      else if (d && d.name) lines.push(d.name + '：' + (Array.isArray(d.exercises) ? d.exercises.join('；') : ''));
    });
    if (Array.isArray(t.workout)) lines.push(t.workout.join('；'));
    if (Array.isArray(t.strength)) lines.push('力量：' + t.strength.join('；'));
    if (Array.isArray(t.split)) lines.push(t.split.join('；'));
    if (t.cardio) lines.push('有氧：' + t.cardio);
    if (t.weighted) lines.push('负重：' + t.weighted);
    return lines;
  }
  function nutritionLines(stage) {
    var n = stage.nutrition || {}, lines = [];
    if (n.dailyCalories) lines.push('每日热量 ' + n.dailyCalories + ' kcal');
    if (n.proteinG) lines.push('蛋白质 ' + n.proteinG + 'g');
    if (n.carbsG) lines.push('碳水 ' + n.carbsG + 'g');
    if (n.fatG) lines.push('脂肪 ' + n.fatG + 'g');
    if (n.supplement) lines.push('补剂：' + n.supplement);
    if (n.mealReplacement) lines.push('代餐/补剂：' + n.mealReplacement);
    if (n.waterL) lines.push('饮水 ' + n.waterL + 'L');
    return lines;
  }
  function toList(x) { return Array.isArray(x) ? x : (x ? [x] : []); }

  function renderCaseList() {
    listHost.innerHTML = CASES.map(function (c) {
      return '<div class="case-card" data-id="' + esc(c.id) + '" style="cursor:pointer;">'
        + '<span class="case-tag ' + (TAGS[c.tag] || '') + '">' + esc(c.tag) + '</span>'
        + '<h3 style="font-size:17px;">' + esc(c.title) + '</h3>'
        + '<div class="case-metrics">'
        + '<span>周期 <b>' + esc(c.meta.durationWeeks) + ' 周</b></span>'
        + '<span>' + esc(c.meta.gender) + ' ' + esc(c.meta.age) + ' 岁</span>'
        + '</div>'
        + '<p class="muted small">' + esc(c.narrative.slice(0, 48)) + '…</p>'
        + '</div>';
    }).join('');
    listHost.querySelectorAll('.case-card').forEach(function (el) {
      el.addEventListener('click', function () { selectCase(el.getAttribute('data-id')); });
    });
  }

  function baselineHTML(c) {
    var b = c.baseline, h = [];
    h.push('<div class="kpi-row">');
    h.push('<div class="kpi"><b>' + esc(b.weightKg) + 'kg</b><span>起始体重</span></div>');
    if (b.bodyFatPct != null) h.push('<div class="kpi"><b>' + esc(b.bodyFatPct) + '%</b><span>起始体脂</span></div>');
    if (b.waistCm != null) h.push('<div class="kpi"><b>' + esc(b.waistCm) + 'cm</b><span>起始腰围</span></div>');
    h.push('<div class="kpi"><b>' + esc(b.bmi) + '</b><span>BMI</span></div>');
    h.push('</div>');
    h.push('<p class="muted small">' + esc(c.meta.gender) + ' / ' + esc(c.meta.age) + ' 岁 / ' + esc(b.heightCm) + 'cm / 目标「' + esc(b.goal) + '」/ 开始日期 ' + esc(b.startDate) + '</p>');
    return h.join('');
  }

  function planHTML(c) {
    var p = c.plan, h = [];
    h.push('<div class="why-box"><h5>策略</h5><p style="font-size:13.5px;">' + esc(p.strategy) + '</p></div>');
    (p.stages || []).forEach(function (s, i) {
      h.push('<div class="stage-card"><h4>阶段 ' + s.stage + ' <span class="wk">' + esc(s.weeks) + '</span></h4>');
      h.push('<p class="muted small">目标：' + esc(s.goal) + '</p><ul>');
      trainingLines(s).forEach(function (l) { h.push('<li>' + esc(l) + '</li>'); });
      nutritionLines(s).forEach(function (l) { h.push('<li>' + esc(l) + '</li>'); });
      h.push('</ul></div>');
    });
    if (p.why) { h.push('<div class="why-box"><h5>为什么这样安排</h5><ul>' + toList(p.why).map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul></div>'); }
    if (p.riskNotes) { h.push('<div class="risk-box"><h5>风险提示</h5><ul>' + toList(p.riskNotes).map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div>'); }
    return h.join('');
  }

  function processHTML(c) {
    var w = c.process.weeks || [], h = [];
    /* 体重曲线 */
    var weights = w.map(function (x) { return x.avgWeightKg != null ? x.avgWeightKg : x.weightKg; }).filter(function (v) { return v != null; });
    if (weights.length >= 2) {
      var min = Math.min.apply(null, weights), max = Math.max.apply(null, weights), span = (max - min) || 1;
      h.push('<div class="card" style="margin-bottom:14px;"><h4>体重变化曲线</h4><div class="bar-chart">');
      w.forEach(function (x) {
        var v = x.avgWeightKg != null ? x.avgWeightKg : x.weightKg;
        if (v == null) return;
        var ht = 20 + Math.round(((v - min) / span) * 80);
        h.push('<div class="bar" style="height:' + ht + '%;background:linear-gradient(180deg,var(--accent2),rgba(58,214,176,.35));"><span>W' + x.week + '</span></div>');
      });
      h.push('</div></div>');
    }
    /* 每周表 */
    h.push('<div class="card"><h4>每周过程数据 <span class="muted small">(' + esc(c.process.completion) + ')</span></h4>');
    h.push('<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:10px;">');
    h.push('<tr style="color:var(--muted);text-align:left;">');
    ['周', '体重', '体脂', '腰围', '完成率', '教练备注'].forEach(function (th) { h.push('<th style="padding:6px 8px;border-bottom:1px solid var(--border2);">' + th + '</th>'); });
    h.push('</tr>');
    w.forEach(function (x) {
      h.push('<tr style="border-bottom:1px solid var(--border);">');
      h.push('<td style="padding:6px 8px;">W' + x.week + '</td>');
      h.push('<td style="padding:6px 8px;">' + (x.avgWeightKg != null ? x.avgWeightKg : x.weightKg) + '</td>');
      h.push('<td style="padding:6px 8px;">' + (x.bodyFatPct != null ? x.bodyFatPct + '%' : '—') + '</td>');
      h.push('<td style="padding:6px 8px;">' + (x.waistCm != null ? x.waistCm + 'cm' : '—') + '</td>');
      h.push('<td style="padding:6px 8px;">' + esc(x.completion || '') + '</td>');
      h.push('<td style="padding:6px 8px;color:var(--muted);">' + esc(x.coachNote || '') + (x.adjustment ? ' <span class="badge warn">' + esc(x.adjustment) + '</span>' : '') + '</td>');
      h.push('</tr>');
    });
    h.push('</table></div></div>');
    return h.join('');
  }

  function resultHTML(c) {
    var r = c.result, h = [];
    h.push('<div class="kpi-row">');
    if (r.weightChangeKg != null) h.push('<div class="kpi"><b>' + (r.weightChangeKg > 0 ? '+' : '') + esc(r.weightChangeKg) + 'kg</b><span>体重变化</span></div>');
    if (r.bodyFatChangePp != null) h.push('<div class="kpi"><b>' + (r.bodyFatChangePp > 0 ? '+' : '') + esc(r.bodyFatChangePp) + 'pp</b><span>体脂变化</span></div>');
    if (r.waistChangeCm != null) h.push('<div class="kpi"><b>' + (r.waistChangeCm > 0 ? '+' : '') + esc(r.waistChangeCm) + 'cm</b><span>腰围变化</span></div>');
    if (r.muscleGainKg != null) h.push('<div class="kpi"><b>+' + esc(r.muscleGainKg) + 'kg</b><span>估算肌肉量</span></div>');
    h.push('</div>');
    if (r.strength) {
      h.push('<p class="muted small">力量：' + Object.keys(r.strength).map(function (k) { return esc(k) + ' ' + esc(r.strength[k]) + 'kg'; }).join(' · ') + '</p>');
    }
    h.push('<div class="why-box" style="margin-top:10px;"><p style="font-size:14px;">' + esc(r.summary) + '</p></div>');
    return h.join('');
  }

  function renderDetail(c) {
    var h = [];
    h.push('<div class="card result-panel" style="margin-bottom:18px;">');
    h.push('<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px;">');
    h.push('<span class="case-tag ' + (TAGS[c.tag] || '') + '">' + esc(c.tag) + '</span>');
    h.push('<h2 style="font-size:22px;">' + esc(c.title) + '</h2>');
    h.push('</div>');
    h.push('<p class="muted small" style="margin-bottom:6px;">' + esc(c.narrative) + '</p>');
    h.push('<p class="small" style="color:var(--warn);">' + esc(c.demoNote) + '</p>');
    h.push('</div>');

    h.push('<div class="timeline">');
    h.push('<div class="tl-item"><h4>① 基线 Before</h4>' + baselineHTML(c) + '</div>');
    h.push('<div class="tl-item"><h4>② 方案 Plan（点击回放）</h4><div class="replay-zone">' + planHTML(c) + '</div></div>');
    h.push('<div class="tl-item"><h4>③ 过程 Process</h4>' + processHTML(c) + '</div>');
    h.push('<div class="tl-item"><h4>④ 结果 After</h4>' + resultHTML(c) + '</div>');
    h.push('</div>');

    h.push('<div class="no-print" style="margin-top:22px;display:flex;gap:12px;flex-wrap:wrap;">');
    h.push('<button class="btn btn-primary" id="replayBtn">▶ 回放这份方案</button>');
    h.push('<button class="btn btn-ghost" onclick="window.print()">打印 / 另存为 PDF</button>');
    h.push('<a class="btn btn-ghost" href="planner.html">用我的数据生成一份 →</a>');
    h.push('</div>');

    detailHost.innerHTML = h.join('');
    detailHost.scrollIntoView({ behavior: 'smooth' });

    /* 回放动画：方案部分逐块显现 */
    var btn = document.getElementById('replayBtn');
    btn.addEventListener('click', function () {
      var zone = detailHost.querySelector('.replay-zone');
      var blocks = zone.querySelectorAll('.stage-card, .why-box, .risk-box');
      blocks.forEach(function (el) { el.style.opacity = '0.12'; el.style.transition = 'opacity .35s ease'; });
      var i = 0;
      blocks.forEach(function (el) {
        setTimeout(function () { el.style.opacity = '1'; }, 180 + i * 220);
        i++;
      });
      btn.textContent = '✅ 方案已回放（同参数 → 同方案）';
    });
  }

  function selectCase(id) {
    var c = CASES.find(function (x) { return x.id === id; });
    if (!c) return;
    try { history.replaceState(null, '', '?case=' + id); } catch (e) {}
    renderDetail(c);
    listHost.querySelectorAll('.case-card').forEach(function (el) {
      el.style.borderColor = el.getAttribute('data-id') === id ? 'var(--accent)' : '';
    });
  }

  renderCaseList();
  var fromUrl = new URLSearchParams(location.search).get('case');
  selectCase(fromUrl && CASES.some(function (c) { return c.id === fromUrl; }) ? fromUrl : CASES[0].id);
})();
