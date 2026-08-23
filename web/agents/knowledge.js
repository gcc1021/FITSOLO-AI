/* ============================================================
 * FITSOLO 教练知识库 —— 规则与素材
 * 纯 JS，无依赖；浏览器（window）与 Node（globalThis）通用
 * 这是"真实可复现"的根本：AI 的自由发挥被约束在你验证过的方法之内
 * ============================================================ */
(function (root) {
  'use strict';

  const KNOWLEDGE = {
    version: '0.2.0',

    /* BMI 分级 */
    bmiLevels(weightKg, heightCm) {
      const h = heightCm / 100;
      const bmi = weightKg / (h * h);
      if (bmi < 18.5) return { bmi: +bmi.toFixed(1), level: '偏瘦', advice: '以增肌/健康增重为主，避免过度节食。' };
      if (bmi < 24) return { bmi: +bmi.toFixed(1), level: '正常', advice: '以塑形、体态与体脂优化为主。' };
      if (bmi < 28) return { bmi: +bmi.toFixed(1), level: '超重', advice: '以减脂为主，制造温和热量缺口。' };
      return { bmi: +bmi.toFixed(1), level: '肥胖', advice: '建议先咨询专业人士，采用温和低冲击方案。' };
    },

    /* Mifflin-St Jeor 基础代谢 */
    bmr(gender, weightKg, heightCm, age) {
      return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + (gender === '男' ? 5 : -161));
    },

    activityFactor(days) {
      if (days <= 2) return 1.375;
      if (days <= 4) return 1.55;
      return 1.725;
    },

    /* 目标预设 */
    goals: {
      '减脂': { deficit: 400, proteinPerKg: 1.8, fatPct: 0.25, minCal: 1200 },
      '瘦身': { deficit: 300, proteinPerKg: 1.6, fatPct: 0.25, minCal: 1200 },
      '塑形': { deficit: 250, proteinPerKg: 1.6, fatPct: 0.25, minCal: 1200 },
      '增肌': { surplus: 300, proteinPerKg: 2.0, fatPct: 0.25, minCal: 1500 }
    },

    /* 健身房动作库（按分化） */
    gymSplits: {
      '推日': ['杠铃卧推 4×6-8', '坐姿肩推 3×8-10', '哑铃飞鸟 3×12', '三头下压 3×12'],
      '拉日': ['引体向上/高位下拉 4×8-10', '杠铃划船 4×10', '面拉 3×15', '二头弯举 3×12'],
      '腿日': ['杠铃深蹲 4×6-8', '罗马尼亚硬拉 3×8', '腿举 3×10', '提踵 3×15'],
      '全身日': ['深蹲 3×10', '卧推 3×10', '划船 3×10', '平板支撑 3×30s']
    },
    gymWeeklyByDays(days) {
      if (days >= 5) return { freq: '每周 5 次', order: ['推日', '拉日', '腿日', '上肢日', '下肢日'] };
      if (days === 4) return { freq: '每周 4 次', order: ['推日', '拉日', '腿日', '全身日'] };
      if (days === 3) return { freq: '每周 3 次', order: ['全身日', '推日', '腿日'] };
      return { freq: '每周 2 次', order: ['全身日', '腿日'] };
    },

    /* 居家动作库 */
    homeWorkouts: {
      hiit: ['开合跳 30s×4', '高抬腿 30s×4', '登山跑 30s×4', '波比跳（可退阶）12×4'],
      core: ['平板支撑 30-60s×3', '卷腹 15×3', '死虫式 12×3', '侧支撑 30s×3'],
      band: ['弹力带深蹲 15×3', '弹力带划船 15×3', '臀桥 15×3', '弹力带推胸 15×3']
    },

    /* 代餐 / 补剂用法 */
    supplements: {
      '蛋白粉': { when: '训练后 30 分钟内', dose: '1-1.5 勺（约 25-35g 蛋白）', note: '配合温水/牛奶冲调；它是蛋白质补充，不是正餐替代。' },
      '代餐奶昔': { when: '替代早餐或晚餐（建议每周 ≤ 5 次）', dose: '1 份（约 200-250 kcal）', note: '仅作部分替代，正餐仍需蔬果与蛋白质。' },
      '不用补剂': { when: '—', dose: '—', note: '不依赖补剂，通过正餐保证蛋白质即可。' }
    },

    /* 调整规则表（Coach 用） */
    adjustmentRules: {
      R12: { trigger: '平台期：连续 2 周体重无明显变化且打卡完成率 ≥ 70%', change: '热量 -100 kcal 或增加 1 次有氧（二选一，避免同时改）' },
      R02: { trigger: '连续 3 天未打卡', change: '主动关心 + 临时简化方案（减 1 个动作 / 训练缩短 10 分钟）' },
      R03: { trigger: '连续 3 天精力 ≤ 4/10', change: '本周减 1 次训练，增加睡眠与恢复建议' },
      R04: { trigger: '用户报告关节/腰部等不适', change: '替换对应动作 + 提醒就医，停止加重建议' },
      R05: { trigger: '体重下降过快（周均 > 1kg 且持续 2 周）', change: '上调热量 100 kcal，放缓减重速度' }
    },

    /* 医疗边界（必须展示） */
    boundaries: [
      'AI 方案仅供参考，不构成医疗诊断或治疗建议，结果因人而异。',
      '如有慢性病、伤病、孕期等情况，请遵医嘱并在专业人士指导下训练。',
      '训练中出现头晕、心悸、胸痛等不适，请立即停止并就医。'
    ]
  };

  root.FITSOLO = root.FITSOLO || {};
  root.FITSOLO.knowledge = KNOWLEDGE;
})(typeof window !== 'undefined' ? window : globalThis);
