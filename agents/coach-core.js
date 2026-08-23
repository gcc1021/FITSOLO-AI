/* ============================================================
 * 智能体 ③ Coach —— 智能指导（动态调整 + 答疑）
 * 信号检测走规则（保证可复现）；自由提问走规则库
 * 可选 LLM 钩子：配置 window.FITSOLO_LLM 后自动启用
 * ============================================================ */
(function (root) {
  'use strict';
  const K = (root.FITSOLO && root.FITSOLO.knowledge) || {};
  const checker = (root.FITSOLO && root.FITSOLO.checker) || {};

  /* 从打卡记录检测需要调整的信号（规则表） */
  function detectSignals(records, plan) {
    const signals = [];
    const list = (records || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    if (list.length < 2) return signals;

    /* 平台期 R12：最近 14 天体重平均变化 < 0.2kg 且打卡完成率 ≥ 70% */
    const recent = list.slice(-14);
    const weights = recent.filter(function (r) { return r.weight; }).map(function (r) { return r.weight; });
    if (weights.length >= 4) {
      const first = weights[0], last = weights[weights.length - 1];
      const delta = Math.abs(last - first);
      const done = recent.filter(function (r) { return r.trained || r.dietOk; }).length;
      const rate = done / recent.length;
      if (delta < 0.2 && rate >= 0.7) signals.push({ rule: 'R12', ...K.adjustmentRules.R12 });
    }

    /* 漏卡 R02 */
    if (checker.missedDays && checker.missedDays(list) >= 3) signals.push({ rule: 'R02', ...K.adjustmentRules.R02 });

    /* 疲劳 R03：最近 3 次打卡精力 ≤ 4 */
    const recentE = list.slice(-3).filter(function (r) { return r.energy != null; });
    if (recentE.length === 3 && recentE.every(function (r) { return r.energy <= 4; })) signals.push({ rule: 'R03', ...K.adjustmentRules.R03 });

    /* 不适 R04 */
    const hasPain = list.slice(-7).some(function (r) { return r.note && /疼|痛|伤|扭|酸软过度/.test(r.note); });
    if (hasPain) signals.push({ rule: 'R04', ...K.adjustmentRules.R04 });

    /* 掉秤过快 R05 */
    if (plan && plan.profile && /减脂|瘦身/.test(plan.profile.goal || '')) {
      const weekly = [];
      for (let i = 6; i < list.length; i++) {
        const a = list[i - 6], b = list[i];
        if (a.weight && b.weight) weekly.push(b.weight - a.weight);
      }
      if (weekly.length >= 2 && weekly.slice(-2).every(function (d) { return d < -1; })) signals.push({ rule: 'R05', ...K.adjustmentRules.R05 });
    }
    return signals;
  }

  /* 规则库答疑（离线可用） */
  const FAQ = [
    { keys: ['加班', '没练', '没时间', '太忙', '今天不想'], answer: '偶尔漏练很正常，别自责。今晚如果只能挤出 15 分钟，就只做核心 3 个动作（平板支撑/卷腹/死虫式），保持习惯 > 追求完美；明天回归正轨即可。' },
    { keys: ['代餐', '奶昔', '蛋白粉', '补剂'], answer: '补剂只是方便工具：' + (K.supplements['蛋白粉'] ? '蛋白粉在训练后 30 分钟内 1-1.5 勺；代餐奶昔可替代早餐或晚餐（每周 ≤ 5 次）。' : '') + '关键还是全天蛋白质达标，正餐优先肉蛋奶豆。' },
    { keys: ['平台', '不掉', '卡住', '没变化', '瓶颈'], answer: '平台期先别慌，多数是身体适应了。按规则 R12 处理：热量 -100 kcal 或加 1 次有氧（二选一），再观察 1-2 周；同时检查睡眠和喝水。' },
    { keys: ['酸痛', '肌肉酸'], answer: '训练后 1-2 天酸痛（DOMS）是正常反应。保证蛋白质摄入、充足睡眠，可做低强度活动促进恢复；若超过 3 天或伴随剧烈疼痛，请及时就医。' },
    { keys: ['疼', '痛', '受伤', '扭'], answer: '身体不适请先停练对应部位，不硬撑。这属于边界问题：建议及时就医/咨询专业人士，我这边会同步替换你的高风险动作（规则 R04）。' },
    { keys: ['吃', '热量', '卡路里', '饮食', '饿'], answer: '按方案执行热量与蛋白质：饿了优先补蛋白质和蔬菜（鸡蛋/鸡胸/黄瓜），少碰精制糖和油炸；代餐用来降低执行难度，不是节食。' },
    { keys: ['有氧', '跑步', '快走'], answer: '有氧辅助减脂但别过量：按方案每周 2-3 次、每次 25-40 分钟即可，强度以能说话为准；力量训练才是保肌和塑形的关键。' },
    { keys: ['增肌', '练不大', '没效果', '长肌肉'], answer: '增肌三要素：热量盈余 + 蛋白质足量 + 渐进超负荷。检查三点：吃够了吗（每日 +300 kcal 左右）、蛋白够吗（≈2g/kg）、主项有在每周 +2.5kg 吗？' },
    { keys: ['睡觉', '失眠', '睡眠'], answer: '睡眠是恢复和减脂的隐藏杠杆：争取 7 小时以上，睡前一小时少看屏幕、规律作息；连续睡眠差时本周可减 1 次训练（规则 R03）。' }
  ];
  const DEFAULT_ANSWER = '收到！针对你的问题，我建议先按当前方案执行，并记录打卡数据——我会结合数据给你更准确的调整。如果涉及疼痛、疾病等健康问题，请及时就医，我不提供医疗诊断。';

  function answer(question, ctx) {
    const q = (question || '').replace(/\s+/g, '');
    for (let i = 0; i < FAQ.length; i++) {
      if (FAQ[i].keys.some(function (k) { return q.indexOf(k) >= 0; })) {
        return { text: FAQ[i].answer, rule: 'FAQ-' + i };
      }
    }
    /* 命中调整信号时，把最近的调整也带上 */
    const signals = ctx && ctx.signals;
    if (signals && signals.length) {
      return { text: '根据你最近的打卡数据，我检测到需要调整：' + signals.map(function (s) { return '（' + s.rule + '）' + s.change; }).join('；') + '。你先按这个调整执行，我们观察 1-2 周。', rule: signals.map(function (s) { return s.rule; }).join(',') };
    }
    return { text: DEFAULT_ANSWER, rule: 'fallback' };
  }

  root.FITSOLO = root.FITSOLO || {};
  root.FITSOLO.coach = { detectSignals: detectSignals, answer: answer };
})(typeof window !== 'undefined' ? window : globalThis);
