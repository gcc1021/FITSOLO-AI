/* FITSOLO Planner 页面逻辑 */
(function () {
  'use strict';
  var S = window.FITSOLO_STORE, P = window.FITSOLO.planner;
  var form = document.getElementById('planForm');
  var result = document.getElementById('result');
  if (!form || !result) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
    });
  }

  /* 恢复已保存档案 */
  var saved = S.profile();
  if (saved) {
    try {
      var q = form.querySelector.bind(form);
      if (saved.gender) { var g = q('input[name="gender"][value="' + saved.gender + '"]'); if (g) g.checked = true; }
      if (saved.goal) { var go = q('input[name="goal"][value="' + saved.goal + '"]'); if (go) go.checked = true; }
      if (saved.equipment) { var eq = q('input[name="equipment"][value="' + saved.equipment + '"]'); if (eq) eq.checked = true; }
      if (saved.mealReplacement) { var mr = q('input[name="mealReplacement"][value="' + saved.mealReplacement + '"]'); if (mr) mr.checked = true; }
      if (saved.age) form.age.value = saved.age;
      if (saved.height) form.height.value = saved.height;
      if (saved.weight) form.weight.value = saved.weight;
      if (saved.bodyFat) form.bodyFat.value = saved.bodyFat;
      if (saved.waist) form.waist.value = saved.waist;
      if (saved.durationWeeks) form.durationWeeks.value = saved.durationWeeks;
      if (saved.trainingDays) form.trainingDays.value = saved.trainingDays;
      if (saved.notes) form.notes.value = saved.notes;
    } catch (e) {}
  }

  function readForm() {
    return {
      gender: (form.querySelector('input[name="gender"]:checked') || {}).value || '男',
      age: form.age.value, height: form.height.value, weight: form.weight.value,
      bodyFat: form.bodyFat.value || '', waist: form.waist.value || '',
      goal: (form.querySelector('input[name="goal"]:checked') || {}).value || '减脂',
      durationWeeks: form.durationWeeks.value, trainingDays: form.trainingDays.value,
      equipment: (form.querySelector('input[name="equipment"]:checked') || {}).value || '健身房',
      mealReplacement: (form.querySelector('input[name="mealReplacement"]:checked') || {}).value || '蛋白粉',
      notes: form.notes.value
    };
  }

  function render(plan) {
    var pf = plan.profile, n = plan.numbers, h = [];
    h.push('<div class="card" style="margin-top:26px;">');
    h.push('<div class="center" style="margin-bottom:4px;"><span class="badge ok">方案已生成 · 规则引擎可复现</span></div>');
    h.push('<h2 class="center" style="font-size:24px;margin:6px 0 2px;">你的 ' + esc(pf.goal) + ' · ' + esc(pf.durationWeeks) + ' 周方案</h2>');
    h.push('<p class="muted center small">' + esc(pf.gender) + ' / ' + esc(pf.age) + ' 岁 / ' + esc(pf.heightCm) + 'cm / ' + esc(pf.weightKg) + 'kg / 体脂 ' + esc(pf.bodyFat) + ' / ' + esc(pf.equipment) + '</p>');

    h.push('<div class="kpi-row">');
    h.push('<div class="kpi"><b>' + esc(pf.bmi) + '</b><span>BMI（' + esc(pf.bmiLevel) + '）</span></div>');
    h.push('<div class="kpi"><b>' + esc(n.calories) + '</b><span>每日热量 kcal</span></div>');
    h.push('<div class="kpi"><b>' + esc(n.proteinG) + 'g</b><span>每日蛋白质</span></div>');
    h.push('<div class="kpi"><b>' + esc(pf.durationWeeks) + ' 周</b><span>方案周期</span></div>');
    h.push('</div>');
    h.push('<p class="muted small">BMR ' + esc(n.bmr) + ' kcal · TDEE ' + esc(n.tdee) + ' kcal · 碳水 ' + esc(n.carbsG) + 'g · 脂肪 ' + esc(n.fatG) + 'g</p>');

    plan.stages.forEach(function (s) {
      h.push('<div class="stage-card">');
      h.push('<h4>阶段 ' + s.stage + ' <span class="wk">' + esc(s.weeks) + '</span></h4>');
      h.push('<p class="muted small">目标：' + esc(s.goal) + '</p>');
      h.push('<ul>');
      h.push('<li><b>训练频率：</b>' + esc(s.training.frequency) + ' ｜ 有氧：' + esc(s.training.cardio) + '</li>');
      s.training.days.forEach(function (d) {
        h.push('<li><b>' + esc(d.name) + '：</b>' + esc(d.exercises.join('；')) + '</li>');
      });
      h.push('<li><b>负重建议：</b>' + esc(s.weighted) + '</li>');
      h.push('<li><b>营养：</b>每日 ' + esc(s.nutrition.dailyCalories) + ' kcal ｜ 蛋白 ' + esc(s.nutrition.proteinG) + 'g ｜ 碳水 ' + esc(s.nutrition.carbsG) + 'g ｜ 脂肪 ' + esc(s.nutrition.fatG) + 'g</li>');
      h.push('<li><b>代餐/补剂：</b>' + esc(s.nutrition.mealReplacement) + '</li>');
      h.push('</ul></div>');
    });

    h.push('<div class="card" style="margin-bottom:14px;"><h4 style="margin-bottom:6px;">恢复与补剂</h4>');
    h.push('<p class="muted small">💧 饮水 ' + esc(plan.recovery.waterL) + 'L/天 ｜ 😴 睡眠 ' + esc(plan.recovery.sleepH) + 'h ｜ ' + esc(plan.recovery.note) + '</p>');
    h.push('<p class="muted small">' + esc(plan.mealReplacementNote) + '</p></div>');

    h.push('<div class="why-box"><h5>为什么这样安排（可复现的推理）</h5><ul>');
    plan.why.forEach(function (w) { h.push('<li>' + esc(w) + '</li>'); });
    h.push('</ul></div>');

    h.push('<div class="risk-box"><h5>风险提示</h5><ul>');
    plan.riskNotes.forEach(function (r) { h.push('<li>' + esc(r) + '</li>'); });
    h.push('</ul></div>');

    h.push('<div class="no-print" style="display:flex;gap:12px;flex-wrap:wrap;margin-top:18px;">');
    h.push('<button class="btn btn-primary" onclick="window.__fitsoloSave()">保存并去打卡 →</button>');
    h.push('<button class="btn btn-ghost" onclick="window.__fitsoloDownload()">下载方案 (.md)</button>');
    h.push('<button class="btn btn-ghost" onclick="window.print()">打印 / 另存为 PDF</button>');
    h.push('</div>');
    h.push('</div>');

    result.innerHTML = h.join('');
    result.style.display = '';
    window.__fitsoloDownload = function () {
      var md = P.planToMarkdown(plan);
      var blob = new Blob(['\ufeff' + md], { type: 'text/markdown;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'FITSOLO-方案-' + pf.goal + '-' + pf.durationWeeks + '周.md';
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    };
    window.__fitsoloSave = function () { location.href = 'checker.html'; };
    form.classList.add('no-print');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var input = readForm();
    if (!input.weight || !input.height || +input.weight < 30 || +input.height < 120) {
      alert('请填写有效的身高与体重（kg / cm）。');
      return;
    }
    var plan = P.generatePlan(input);
    S.set('profile', input);
    S.set('plan', plan);
    render(plan);
    result.scrollIntoView({ behavior: 'smooth' });
  });

  /* 已有方案时直接展示 */
  var existing = S.plan();
  if (existing && existing.profile) { render(existing); }
})();
