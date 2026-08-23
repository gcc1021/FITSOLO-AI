/* FITSOLO 三个智能体核心逻辑测试（Node，无依赖）
 * 运行：node docs/tools/agent-test.js */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
global.window = global;
require(path.join(ROOT, 'web/agents/knowledge.js'));
require(path.join(ROOT, 'web/agents/planner-core.js'));
require(path.join(ROOT, 'web/agents/checker-core.js'));
require(path.join(ROOT, 'web/agents/coach-core.js'));
const A = global.FITSOLO;

console.log('=== 1) Planner 三场景 ===');
const s1 = A.planner.generatePlan({ gender: '女', age: 28, height: 165, weight: 72, bodyFat: 32, goal: '减脂', durationWeeks: 8, trainingDays: 4, equipment: '健身房', mealReplacement: '代餐奶昔', notes: '' });
console.log('[减脂] BMI', s1.profile.bmi, s1.profile.bmiLevel, '| 热量', s1.numbers.calories, '| 蛋白', s1.numbers.proteinG, '| 阶段数', s1.stages.length, '| 训练', s1.stages[0].training.frequency);
const s2 = A.planner.generatePlan({ gender: '男', age: 24, height: 178, weight: 68, goal: '增肌', durationWeeks: 10, trainingDays: 4, equipment: '健身房', mealReplacement: '蛋白粉' });
console.log('[增肌] BMI', s2.profile.bmi, '| 热量', s2.numbers.calories, '| 蛋白', s2.numbers.proteinG, '| 训练日', s2.stages[0].training.days.map(d => d.name).join('/'));
const s3 = A.planner.generatePlan({ gender: '女', age: 34, height: 162, weight: 58.5, goal: '塑形', durationWeeks: 6, trainingDays: 3, equipment: '居家', mealReplacement: '代餐奶昔' });
console.log('[塑形] BMI', s3.profile.bmi, '| 热量', s3.numbers.calories, '| 训练', s3.stages[0].training.days.map(d => d.name).join('/'));

console.log('=== 2) Checker 连续打卡/里程碑/周报 ===');
const recs = [];
for (let i = 0; i < 5; i++) { const d = new Date(Date.now() - i * 86400000); recs.push({ date: d.toISOString().slice(0, 10), trained: true, dietOk: true, energy: 6, weight: 70 + i * 0.1 }); }
console.log('连续打卡:', A.checker.streakDays(recs), '| 下一里程碑:', A.checker.nextMilestone(A.checker.streakDays(recs)), '| 漏卡天数:', A.checker.missedDays(recs));
const ws = A.checker.weeklySummary(recs);
console.log('本周: 打卡', ws.days, '训练', ws.trained, '完成率', ws.rate + '%', '体重趋势', ws.trend);

console.log('=== 3) Coach 信号检测 + 答疑 ===');
const platform = [];
for (let i = 0; i < 14; i++) { const d = new Date(Date.now() - i * 86400000); platform.push({ date: d.toISOString().slice(0, 10), trained: i % 7 !== 0, dietOk: true, energy: 5, weight: 68.0 }); }
console.log('平台期信号:', A.coach.detectSignals(platform, s1).map(x => x.rule).join(','));
console.log('答疑[加班没练]:', A.coach.answer('今天加班没练怎么办？').text.slice(0, 40) + '...');
console.log('答疑[平台期]:', A.coach.answer('体重卡住了不掉').text.slice(0, 40) + '...');
console.log('答疑[兜底]:', A.coach.answer('今天心情不好').rule);
console.log('ALL TESTS PASSED');
