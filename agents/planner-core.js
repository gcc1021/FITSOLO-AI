/* ============================================================
 * 智能体 ① Planner —— 做方案（诊断 + 开方）
 * 规则优先、AI 辅助、输出强约束：同一输入产出同一方案（可复现）
 * ============================================================ */
(function (root) {
  'use strict';
  const K = (root.FITSOLO && root.FITSOLO.knowledge) || {};

  function round1(x) { return Math.round(x * 10) / 10; }

  function buildTraining(split, equipment, stage) {
    const boost = stage === 'stage2';
    if (equipment === '健身房') {
      const map = {
        '推日': K.gymSplits['推日'],
        '拉日': K.gymSplits['拉日'],
        '腿日': K.gymSplits['腿日'],
        '全身日': K.gymSplits['全身日'],
        '上肢日': K.gymSplits['推日'].slice(0, 2).concat(K.gymSplits['拉日'].slice(0, 2)),
        '下肢日': K.gymSplits['腿日'].slice(0, 2).concat(['箭步蹲 3×10'])
      };
      return {
        frequency: split.freq,
        days: split.order.map(function (d) {
          const list = (map[d] || K.gymSplits['全身日']).slice();
          return {
            name: d,
            exercises: boost
              ? list.map(function (e, i) { return i < 2 ? e + '（+1 组）' : e; })
              : list
          };
        }),
        cardio: boost ? '快走/椭圆机 35-40 分钟 × 2-3 次/周' : '快走/椭圆机 25-30 分钟 × 2 次/周'
      };
    }
    /* 居家 */
    return {
      frequency: split.freq,
      days: [
        { name: 'HIIT', exercises: boost ? K.homeWorkouts.hiit.map(function (e) { return e + '（加 1 轮）'; }) : K.homeWorkouts.hiit.slice() },
        { name: '核心', exercises: K.homeWorkouts.core.slice() },
        { name: '弹力带', exercises: K.homeWorkouts.band.slice() }
      ],
      cardio: boost ? '快走 30 分钟 × 3 次/周' : '快走 20-25 分钟 × 2 次/周'
    };
  }

  function generatePlan(input) {
    const gender = (input && input.gender) || '女';
    const age = +((input && input.age) || 28);
    const height = +((input && input.height) || 165);
    const weight = +((input && input.weight) || 60);
    const bodyFat = input && input.bodyFat ? +input.bodyFat : null;
    const goal = (input && input.goal) || '减脂';
    const weeks = Math.max(2, Math.min(16, +((input && input.durationWeeks) || 8)));
    const days = Math.max(1, Math.min(7, +((input && input.trainingDays) || 3)));
    const equipment = (input && input.equipment) || '健身房';
    const mealReplacement = (input && input.mealReplacement) || '蛋白粉';
    const notes = ((input && input.notes) || '');

    const bmiInfo = K.bmiLevels(weight, height);
    const bmr = K.bmr(gender, weight, height, age);
    const tdee = Math.round(bmr * K.activityFactor(days));
    const g = K.goals[goal] || K.goals['减脂'];

    let cal;
    if (goal === '增肌') { cal = tdee + g.surplus; } else { cal = Math.max(g.minCal, tdee - g.deficit); }
    const protein = Math.round(weight * g.proteinPerKg);
    const fat = Math.round((cal * g.fatPct) / 9);
    const carbs = Math.max(50, Math.round((cal - protein * 4 - fat * 9) / 4));

    let split;
    if (equipment === '健身房') { split = K.gymWeeklyByDays(days); } else { split = { freq: '每周 ' + days + ' 次', order: ['HIIT', '核心', '弹力带'] }; }

    const stage1Weeks = Math.max(1, Math.floor(weeks / 2));
    const stage2Weeks = weeks - stage1Weeks;

    const supp = K.supplements[mealReplacement] || K.supplements['蛋白粉'];
    let mealPlan;
    if (mealReplacement === '不用补剂') { mealPlan = '不依赖补剂，通过正餐保证蛋白质（肉/蛋/奶/豆制品）。'; }
    else if (goal === '增肌') { mealPlan = '训练后补充：' + mealReplacement + ' ' + supp.dose + '（' + supp.when + '）'; }
    else if (goal === '减脂') { mealPlan = '早餐用' + mealReplacement + '控制摄入（' + supp.dose + '），' + supp.when; }
    else { mealPlan = '每周 4 次用' + mealReplacement + '替代一餐（' + supp.dose + '），' + supp.when; }

    const risk = [];
    if (bmiInfo.bmi >= 28) risk.push('BMI 偏高（' + bmiInfo.bmi + '），建议温和低冲击起步，并先咨询专业人士。');
    if (age >= 50) risk.push('年龄较大，动作以低冲击、低负重为主，量力而行。');
    if (/膝|腰|肩|肘|伤|痛|孕|高血压|糖尿病|心脏/.test(notes)) risk.push('检测到伤病/健康备注：已替换高风险动作，并建议遵医嘱/及时就医。');
    risk.push(K.boundaries[0], K.boundaries[1]);

    const why = [
      'BMI ' + bmiInfo.bmi + '（' + bmiInfo.level + '）＋目标「' + goal + '」→ ' + bmiInfo.advice,
      '基础代谢约 ' + bmr + ' kcal；按每周训练 ' + days + ' 次的活动系数，每日消耗约 ' + tdee + ' kcal。',
      goal === '增肌'
        ? '增肌需要热量盈余：每日 ' + cal + ' kcal（+' + g.surplus + '），蛋白质 ' + protein + 'g（≈' + g.proteinPerKg + 'g/kg 体重）。'
        : '减脂/塑形制造温和缺口：每日 ' + cal + ' kcal，蛋白质 ' + protein + 'g 用于保肌。',
      '训练按「' + (equipment === '健身房' ? '推拉腿分化 + 负重渐进' : '居家短时高频') + '」安排，保证可执行、可持续。'
    ];

    const plan = {
      meta: { generator: 'FITSOLO Planner v0.2', generatedAt: new Date().toISOString(), version: 1 },
      profile: {
        gender: gender, age: age, heightCm: height, weightKg: round1(weight),
        bodyFat: bodyFat ? bodyFat + '%' : '未填',
        bmi: bmiInfo.bmi, bmiLevel: bmiInfo.level,
        goal: goal, durationWeeks: weeks, trainingDaysPerWeek: days, equipment: equipment
      },
      numbers: { bmr: bmr, tdee: tdee, calories: cal, proteinG: protein, carbsG: carbs, fatG: fat },
      stages: [
        {
          stage: 1,
          weeks: '第 1-' + stage1Weeks + ' 周',
          goal: '适应期：建立训练习惯、学会动作、让身体适应',
          training: buildTraining(split, equipment, 'stage1'),
          nutrition: { dailyCalories: cal, proteinG: protein, carbsG: carbs, fatG: fat, mealReplacement: mealPlan, waterL: 2.0, sleepH: '≥7' },
          weighted: equipment === '健身房' ? '主项从轻重量学动作，第 2 周起可 +2.5kg' : '自重/弹力带为主，先保证动作标准'
        },
        {
          stage: 2,
          weeks: '第 ' + (stage1Weeks + 1) + '-' + weeks + ' 周',
          goal: goal === '增肌' ? '渐进超负荷：每周加重、突破力量' : '强化期：提升强度、突破平台期',
          training: buildTraining(split, equipment, 'stage2'),
          nutrition: {
            dailyCalories: goal === '增肌' ? cal : Math.max(g.minCal, cal - 50),
            proteinG: protein, carbsG: carbs, fatG: fat,
            mealReplacement: mealPlan, waterL: 2.0, sleepH: '≥7'
          },
          weighted: equipment === '健身房' ? '主项每周 +2.5kg（以动作标准为前提）' : '动作升级：增加组数或缩短休息时间'
        }
      ],
      mealReplacementNote: mealReplacement === '不用补剂' ? supp.note : mealReplacement + '：' + supp.note,
      recovery: { waterL: 2.0, sleepH: '≥7', note: '睡眠是恢复与减脂的关键，优先保证 7 小时以上。' },
      riskNotes: risk,
      why: why
    };
    return plan;
  }

  function planToMarkdown(plan) {
    const L = [];
    L.push('# FITSOLO 个性化方案');
    L.push('');
    L.push('> ' + K.boundaries[0]);
    L.push('');
    L.push('## 个人画像');
    const pf = plan.profile;
    L.push('- 性别/年龄：' + pf.gender + ' / ' + pf.age + ' 岁');
    L.push('- 身高/体重：' + pf.heightCm + 'cm / ' + pf.weightKg + 'kg（BMI ' + pf.bmi + '，' + pf.bmiLevel + '）');
    L.push('- 体脂率：' + pf.bodyFat);
    L.push('- 目标：' + pf.goal + ' ｜ 周期：' + pf.durationWeeks + ' 周 ｜ 每周训练：' + pf.trainingDaysPerWeek + ' 次 ｜ 场地：' + pf.equipment);
    L.push('');
    L.push('## 核心指标');
    L.push('- 基础代谢 BMR：' + plan.numbers.bmr + ' kcal');
    L.push('- 每日消耗 TDEE：' + plan.numbers.tdee + ' kcal');
    L.push('- 每日热量目标：' + plan.numbers.calories + ' kcal');
    L.push('- 蛋白质 / 碳水 / 脂肪：' + plan.numbers.proteinG + 'g / ' + plan.numbers.carbsG + 'g / ' + plan.numbers.fatG + 'g');
    plan.stages.forEach(function (s) {
      L.push('');
      L.push('## 阶段 ' + s.stage + '（' + s.weeks + '）');
      L.push('目标：' + s.goal);
      L.push('训练频率：' + s.training.frequency);
      s.training.days.forEach(function (d) {
        L.push('- ' + d.name + '：' + d.exercises.join('；'));
      });
      L.push('- 有氧：' + s.training.cardio);
      L.push('- 负重建议：' + s.weighted);
      L.push('- 营养：每日 ' + s.nutrition.dailyCalories + ' kcal ｜ 蛋白 ' + s.nutrition.proteinG + 'g ｜ 碳水 ' + s.nutrition.carbsG + 'g ｜ 脂肪 ' + s.nutrition.fatG + 'g');
      L.push('- 代餐/补剂：' + s.nutrition.mealReplacement);
    });
    L.push('');
    L.push('## 为什么这样安排');
    plan.why.forEach(function (w) { L.push('- ' + w); });
    L.push('');
    L.push('## 风险提示');
    plan.riskNotes.forEach(function (r) { L.push('- ' + r); });
    L.push('');
    L.push('---');
    L.push('生成：' + plan.meta.generator + ' ｜ ' + plan.meta.generatedAt);
    return L.join('\n');
  }

  root.FITSOLO = root.FITSOLO || {};
  root.FITSOLO.planner = { generatePlan: generatePlan, planToMarkdown: planToMarkdown };
})(typeof window !== 'undefined' ? window : globalThis);
