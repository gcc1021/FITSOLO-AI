/* 自动生成，勿手改。重新生成：node docs/tools/build-cases-data.js */
(function (root) { root.FITSOLO_CASES = [
  {
    "id": "case-01",
    "tag": "减脂",
    "title": "28 岁上班族 · 8 周减脂",
    "demoNote": "模拟脱敏样例（合成数据，非真实学员），用于案例回放 Demo；上线前替换为真实学员的授权脱敏数据。",
    "meta": {
      "gender": "女",
      "age": 28,
      "durationWeeks": 8,
      "trainingDaysPerWeek": 4,
      "equipment": "健身房",
      "scenario": "久坐上班族，此前基本无规律运动，无伤病"
    },
    "baseline": {
      "startDate": "2026-03-02",
      "heightCm": 165,
      "weightKg": 72,
      "bodyFatPct": 32,
      "waistCm": 82,
      "hipCm": 98,
      "bmi": 26.4,
      "goal": "减脂",
      "targetWeightKg": 65
    },
    "plan": {
      "version": 1,
      "strategy": "热量缺口 + 力量训练保肌 + 代餐降低执行难度",
      "why": "BMI 26.4、体脂 32%，以减脂为目标；每日制造 300-500 kcal 缺口，每周 4 练，用代餐奶昔降低早餐执行难度，训练后蛋白粉保肌。",
      "stages": [
        {
          "stage": 1,
          "weeks": "1-4",
          "goal": "适应期：建立训练习惯，制造热量缺口",
          "training": {
            "frequency": "每周 4 次",
            "strength": [
              "深蹲 3×12",
              "俯卧撑 3×10",
              "杠铃划船 3×12",
              "臀桥 3×15"
            ],
            "cardio": "快走/椭圆机 30 分钟 × 3 次/周",
            "weighted": "自重为主，第 3 周起深蹲手持 5kg 哑铃"
          },
          "nutrition": {
            "dailyCalories": 1700,
            "proteinG": 100,
            "mealReplacement": "早餐代餐奶昔 1 份；训练后蛋白粉 1 勺",
            "waterL": 2,
            "sleepH": "≥7"
          }
        },
        {
          "stage": 2,
          "weeks": "5-8",
          "goal": "强化期：提升强度，突破平台期",
          "training": {
            "frequency": "每周 4 次",
            "strength": [
              "深蹲（负重 5kg）4×10",
              "俯卧撑 4×10",
              "杠铃划船 4×12",
              "臀桥 4×15"
            ],
            "cardio": "快走/椭圆机 40 分钟 × 4 次/周",
            "weighted": "深蹲 5kg 哑铃/壶铃"
          },
          "nutrition": {
            "dailyCalories": 1650,
            "proteinG": 110,
            "mealReplacement": "早餐代餐奶昔 1 份；训练后蛋白粉 1 勺",
            "waterL": 2,
            "sleepH": "≥7"
          }
        }
      ],
      "riskNotes": [
        "若出现头晕/心悸请停止训练并就医",
        "代餐仅作部分替代，不替代正餐全部营养"
      ]
    },
    "process": {
      "completion": "49/56 次打卡（87.5%）",
      "weeks": [
        {
          "week": 1,
          "avgWeightKg": 71.4,
          "bodyFatPct": 31.6,
          "completion": "6/7",
          "coachNote": "适应期，动作以学会为主"
        },
        {
          "week": 2,
          "avgWeightKg": 70.5,
          "bodyFatPct": 31,
          "completion": "7/7",
          "coachNote": "执行良好，保持"
        },
        {
          "week": 3,
          "avgWeightKg": 69.6,
          "bodyFatPct": 30.2,
          "completion": "6/7",
          "coachNote": "体重稳定下降"
        },
        {
          "week": 4,
          "avgWeightKg": 68.9,
          "bodyFatPct": 29.4,
          "completion": "5/7",
          "coachNote": "出差漏卡 2 天，Coach 主动关心并简化任务"
        },
        {
          "week": 5,
          "avgWeightKg": 68.4,
          "bodyFatPct": 29,
          "completion": "6/7",
          "coachNote": "正常推进"
        },
        {
          "week": 6,
          "avgWeightKg": 68.3,
          "bodyFatPct": 28.9,
          "completion": "6/7",
          "coachNote": "平台期：Coach 调整热量 -100kcal、增加 1 次有氧",
          "adjustment": "R12 平台期应对"
        },
        {
          "week": 7,
          "avgWeightKg": 67.2,
          "bodyFatPct": 28,
          "completion": "7/7",
          "coachNote": "调整后体重重新下降"
        },
        {
          "week": 8,
          "avgWeightKg": 66.1,
          "bodyFatPct": 27.1,
          "completion": "6/7",
          "coachNote": "收官周，完成度高"
        }
      ]
    },
    "result": {
      "endDate": "2026-04-26",
      "weightKg": 66.1,
      "weightChangeKg": -5.9,
      "bodyFatPct": 27.1,
      "bodyFatChangePp": -4.9,
      "waistCm": 74,
      "waistChangeCm": -8,
      "summary": "8 周减重 5.9kg、体脂率下降 4.9 个百分点、腰围减少 8cm；完成率 87.5%。"
    },
    "narrative": "28 岁的久坐上班族小 A，从几乎不运动到每周 4 练：第 1-4 周用『力量 + 代餐 + 有氧』快速适应；第 6 周遇到平台期，Coach 只做了一个小调整（热量 -100、加一次有氧），体重重新开始下降。"
  },
  {
    "id": "case-02",
    "tag": "增肌",
    "title": "24 岁程序员 · 10 周增肌",
    "demoNote": "模拟脱敏样例（合成数据，非真实学员），用于案例回放 Demo；上线前替换为真实学员的授权脱敏数据。",
    "meta": {
      "gender": "男",
      "age": 24,
      "durationWeeks": 10,
      "trainingDaysPerWeek": 4,
      "equipment": "健身房",
      "scenario": "久坐程序员，体型偏瘦，希望系统增肌，无伤病"
    },
    "baseline": {
      "startDate": "2026-04-06",
      "heightCm": 178,
      "weightKg": 68,
      "bodyFatPct": 16,
      "waistCm": 80,
      "bmi": 21.5,
      "goal": "增肌",
      "targetWeightKg": 73,
      "strength": {
        "squatKg": 60,
        "benchKg": 45,
        "deadliftKg": 70
      }
    },
    "plan": {
      "version": 1,
      "strategy": "渐进超负荷 + 蛋白质充足 + 负重训练",
      "why": "BMI 21.5 偏瘦，以增肌为目标；采用推/拉/腿分化保证每周容量，蛋白质按 1.8-2.0g/kg 供给，训练后蛋白粉补齐缺口，主项每周渐进加重。",
      "stages": [
        {
          "stage": 1,
          "weeks": "1-4",
          "goal": "基础力量期：掌握动作，建立容量",
          "training": {
            "frequency": "每周 3-4 次",
            "split": [
              "推日：卧推/肩推/三头",
              "拉日：引体/划船/二头",
              "腿日：深蹲/硬拉/腿举"
            ],
            "weighted": "主项 3-4 组 × 5-8 次，组间休息 2-3 分钟"
          },
          "nutrition": {
            "dailyCalories": 2800,
            "proteinG": 135,
            "supplement": "训练后蛋白粉 1.5 勺（约 35g 蛋白）",
            "carbG": 320,
            "sleepH": "≥7.5"
          }
        },
        {
          "stage": 2,
          "weeks": "5-10",
          "goal": "渐进超负荷期：每周加重，突破力量",
          "training": {
            "frequency": "每周 4 次",
            "split": [
              "推/拉/腿/上肢 四分化"
            ],
            "weighted": "主项每周 +2.5kg；第 7 周安排 deload 减量 50%"
          },
          "nutrition": {
            "dailyCalories": 2900,
            "proteinG": 145,
            "supplement": "训练后蛋白粉 1.5 勺",
            "carbG": 350,
            "sleepH": "≥7.5"
          }
        }
      ],
      "riskNotes": [
        "加重以动作标准为前提，不牺牲姿势",
        "增肌期允许体重小幅上升，关注体脂不过度上涨"
      ]
    },
    "process": {
      "completion": "36/40 次训练（90.0%）",
      "weeks": [
        {
          "week": 1,
          "weightKg": 68.4,
          "bodyFatPct": 16,
          "completion": "3/4",
          "squatKg": 60,
          "coachNote": "动作学习期"
        },
        {
          "week": 2,
          "weightKg": 68.9,
          "bodyFatPct": 15.9,
          "completion": "4/4",
          "squatKg": 62.5,
          "coachNote": "执行良好"
        },
        {
          "week": 3,
          "weightKg": 69.2,
          "bodyFatPct": 15.9,
          "completion": "3/4",
          "squatKg": 62.5,
          "coachNote": "加班漏 1 次，已补"
        },
        {
          "week": 4,
          "weightKg": 69.6,
          "bodyFatPct": 15.8,
          "completion": "4/4",
          "squatKg": 65,
          "coachNote": "容量达标"
        },
        {
          "week": 5,
          "weightKg": 70.1,
          "bodyFatPct": 15.7,
          "completion": "4/4",
          "squatKg": 67.5,
          "coachNote": "进入强化期"
        },
        {
          "week": 6,
          "weightKg": 70.4,
          "bodyFatPct": 15.6,
          "completion": "3/4",
          "squatKg": 67.5,
          "coachNote": "睡眠略差，Coach 提醒作息"
        },
        {
          "week": 7,
          "weightKg": 70.8,
          "bodyFatPct": 15.5,
          "completion": "4/4",
          "squatKg": 72.5,
          "coachNote": "deload 周减量 50%"
        },
        {
          "week": 8,
          "weightKg": 71.3,
          "bodyFatPct": 15.4,
          "completion": "4/4",
          "squatKg": 75,
          "coachNote": "恢复后继续加重"
        },
        {
          "week": 9,
          "weightKg": 71.9,
          "bodyFatPct": 15.3,
          "completion": "3/4",
          "squatKg": 80,
          "coachNote": "状态回升"
        },
        {
          "week": 10,
          "weightKg": 72.6,
          "bodyFatPct": 15.2,
          "completion": "4/4",
          "squatKg": 85,
          "coachNote": "收官：三大项全面突破"
        }
      ]
    },
    "result": {
      "endDate": "2026-06-14",
      "weightKg": 72.6,
      "weightChangeKg": 4.6,
      "bodyFatPct": 15.2,
      "bodyFatChangePp": -0.8,
      "muscleGainKg": 2.8,
      "strength": {
        "squatKg": 85,
        "benchKg": 60,
        "deadliftKg": 95
      },
      "summary": "10 周体重 +4.6kg、体脂率基本持平（16.0%→15.2%）、估算肌肉量 +2.8kg；深蹲 60→85kg、卧推 45→60kg、硬拉 70→95kg；训练完成率 90%。"
    },
    "narrative": "24 岁的程序员小 B，从 68kg 的偏瘦体型开始增肌：以『蛋白粉 + 负重渐进超负荷』为核心，第 7 周安排 deload 后力量继续突破，10 周深蹲从 60kg 涨到 85kg，体重 +4.6kg 且体脂没明显上涨。"
  },
  {
    "id": "case-03",
    "tag": "塑形",
    "title": "34 岁宝妈 · 6 周居家塑形",
    "demoNote": "模拟脱敏样例（合成数据，非真实学员），用于案例回放 Demo；上线前替换为真实学员的授权脱敏数据。",
    "meta": {
      "gender": "女",
      "age": 34,
      "durationWeeks": 6,
      "trainingDaysPerWeek": 3,
      "equipment": "居家（弹力带/无器械）",
      "scenario": "宝妈，时间碎片化，去不了健身房，希望瘦腰、紧致塑形，无伤病"
    },
    "baseline": {
      "startDate": "2026-05-04",
      "heightCm": 162,
      "weightKg": 58.5,
      "bodyFatPct": 27.5,
      "waistCm": 78,
      "hipCm": 93,
      "bmi": 22.3,
      "goal": "塑形（瘦腰/紧致）",
      "targetWaistCm": 72
    },
    "plan": {
      "version": 1,
      "strategy": "居家高频训练 + 晚餐代餐控制摄入 + 核心塑形",
      "why": "BMI 22.3 属正常范围，重点在腰腹塑形与体脂下降；采用居家 HIIT + 核心/弹力带训练适应碎片化时间，晚餐用代餐奶昔替代控制全天热量。",
      "stages": [
        {
          "stage": 1,
          "weeks": "1-3",
          "goal": "适应期：建立居家训练习惯",
          "training": {
            "frequency": "每周 3 次训练 + 2 次快走",
            "workout": [
              "居家 HIIT 20 分钟（开合跳/高抬腿/登山跑）",
              "核心 15 分钟（平板支撑/卷腹/侧支撑）",
              "弹力带臀腿 15 分钟"
            ]
          },
          "nutrition": {
            "dailyCalories": 1500,
            "proteinG": 90,
            "mealReplacement": "晚餐代餐奶昔替代，每周 4 次",
            "waterL": 1.8,
            "sleepH": "≥7"
          }
        },
        {
          "stage": 2,
          "weeks": "4-6",
          "goal": "塑形期：增加强度，紧致腰腹",
          "training": {
            "frequency": "每周 3 次训练 + 3 次快走",
            "workout": [
              "居家 HIIT 25 分钟",
              "核心 20 分钟（进阶：死虫式/俄罗斯转体）",
              "弹力带臀腿 20 分钟"
            ]
          },
          "nutrition": {
            "dailyCalories": 1450,
            "proteinG": 95,
            "mealReplacement": "晚餐代餐奶昔替代，每周 4 次",
            "waterL": 1.8,
            "sleepH": "≥7"
          }
        }
      ],
      "riskNotes": [
        "产后训练以无跳跃/低冲击动作为主，如有不适立即停止",
        "代餐仅替代晚餐，不节食"
      ]
    },
    "process": {
      "completion": "33/42 次打卡（78.6%）",
      "weeks": [
        {
          "week": 1,
          "weightKg": 58.1,
          "bodyFatPct": 27,
          "waistCm": 77,
          "completion": "5/7",
          "coachNote": "适应期，时间碎片化按短课表执行"
        },
        {
          "week": 2,
          "weightKg": 57.4,
          "bodyFatPct": 26.4,
          "waistCm": 76,
          "completion": "6/7",
          "coachNote": "执行稳定"
        },
        {
          "week": 3,
          "weightKg": 56.9,
          "bodyFatPct": 25.8,
          "waistCm": 74.5,
          "completion": "5/7",
          "coachNote": "孩子生病漏卡 2 天，Coach 主动关心并给简化方案"
        },
        {
          "week": 4,
          "weightKg": 56.5,
          "bodyFatPct": 25.4,
          "waistCm": 73.5,
          "completion": "6/7",
          "coachNote": "恢复训练"
        },
        {
          "week": 5,
          "weightKg": 56,
          "bodyFatPct": 25,
          "waistCm": 72.5,
          "completion": "5/7",
          "coachNote": "腰围下降明显"
        },
        {
          "week": 6,
          "weightKg": 55.4,
          "bodyFatPct": 24.6,
          "waistCm": 71.5,
          "completion": "6/7",
          "coachNote": "收官：目标腰围达成"
        }
      ]
    },
    "result": {
      "endDate": "2026-06-14",
      "weightKg": 55.4,
      "weightChangeKg": -3.1,
      "bodyFatPct": 24.6,
      "bodyFatChangePp": -2.9,
      "waistCm": 71.5,
      "waistChangeCm": -6.5,
      "summary": "6 周体重 -3.1kg、体脂率 -2.9 个百分点、腰围 78→71.5cm（-6.5cm）；完成率 78.6%。"
    },
    "narrative": "34 岁的宝妈小 C，没有时间去健身房：用『居家 HIIT + 核心 + 晚餐代餐』的轻量方案，中途孩子生病差点中断，Coach 主动给了简化版，最终 6 周腰围从 78cm 瘦到 71.5cm。"
  }
]; })(typeof window !== 'undefined' ? window : globalThis);
