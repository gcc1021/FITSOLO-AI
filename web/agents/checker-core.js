/* ============================================================
 * 智能体 ② Checker —— 打卡监督（盯执行）
 * 纯规则：打卡 → 连续天数 / 里程碑 / 周报 / 漏卡预警
 * ============================================================ */
(function (root) {
  'use strict';

  function dateStr(d) { return d.toISOString().slice(0, 10); }
  function todayStr() { return dateStr(new Date()); }
  /* 纯 UTC 日期运算，避免本地时区导致跳天 */
  function addDays(str, n) { const p = str.split('-').map(Number); const d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)); return dateStr(d); }

  const MILESTONES = [7, 14, 21, 30];

  /* 连续打卡天数：从今天（或昨天，宽限）往前数 */
  function streakDays(records) {
    const have = {};
    (records || []).forEach(function (r) { if (r && r.date) have[r.date] = true; });
    let cur = todayStr();
    if (!have[cur]) cur = addDays(cur, -1);
    let n = 0;
    while (have[cur]) { n += 1; cur = addDays(cur, -1); }
    return n;
  }

  function nextMilestone(streak) {
    for (let i = 0; i < MILESTONES.length; i++) { if (streak < MILESTONES[i]) return MILESTONES[i]; }
    return null;
  }

  /* 本周（周一为起点）完成情况 */
  function weeklySummary(records) {
    const now = new Date();
    const day = (now.getDay() + 6) % 7; /* 周一=0 */
    const monday = addDays(todayStr(), -day);
    const week = (records || []).filter(function (r) { return r && r.date >= monday && r.date <= todayStr(); });
    const trained = week.filter(function (r) { return r.trained; }).length;
    const rate = week.length ? Math.round((trained / week.length) * 100) : 0;
    const weights = week.filter(function (r) { return r.weight; }).map(function (r) { return r.weight; });
    let trend = null;
    if (weights.length >= 2) {
      const first = weights[0], last = weights[weights.length - 1];
      trend = Math.round((last - first) * 10) / 10;
    }
    return { days: week.length, trained: trained, rate: rate, trend: trend, monday: monday };
  }

  /* 漏卡预警：最近是否连续 3 天没有记录 */
  function missedDays(records) {
    const have = {};
    (records || []).forEach(function (r) { if (r && r.date) have[r.date] = true; });
    let cur = addDays(todayStr(), -1);
    let n = 0;
    while (!have[cur] && n < 10) { n += 1; cur = addDays(cur, -1); }
    return n;
  }

  /* 提交一次打卡（前端在调用前已合并日期） */
  function evaluateCheckin(input) {
    const trained = !!input.trained;
    const dietOk = !!input.dietOk;
    const energy = +input.energy || 5;
    let score = 0;
    if (trained) score += 1;
    if (dietOk) score += 1;
    return { score: score, trained: trained, dietOk: dietOk, energy: energy };
  }

  root.FITSOLO = root.FITSOLO || {};
  root.FITSOLO.checker = {
    MILESTONES: MILESTONES,
    streakDays: streakDays,
    nextMilestone: nextMilestone,
    weeklySummary: weeklySummary,
    missedDays: missedDays,
    evaluateCheckin: evaluateCheckin
  };
})(typeof window !== 'undefined' ? window : globalThis);

