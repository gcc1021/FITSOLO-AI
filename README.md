# FITSOLO — AI × OPC 智能私教平台

> 从"卖时间的私教"到"一家 AI 驱动的私人教练公司"。
> 三个智能体复刻顶级教练的一天：**做方案 → 打卡监督 → 智能指导**。
> 方案数据驱动，结果真实可复现。

## 项目状态

- ✅ Phase 0：方案书（[`docs/AI-OPC-平台方案书.md`](docs/AI-OPC-平台方案书.md) · [`PDF`](output/pdf/AI-OPC-平台方案书.pdf)）
- ✅ Phase 1：网站原型（本仓库）——官网 + 3 智能体 Demo + 案例回放
- ✅ Phase 2：入口体验优化——全屏引导页 + 毛玻璃注册/登录页 + 原官网功能串联
- ✅ Phase 3：登录流程优化——双向返回 + 验证码/密码登录 + 协议校验 + OAuth 预留

详细版本改动见 [`CHANGELOG.md`](CHANGELOG.md)。

## 故事主线（五幕）

1. **起点**：一个教练，20 万粉丝，上千名真实学员——信任与真实数据。
2. **痛点**：真人私教贵、不可规模化；健身 App 只有模板，没人盯执行。
3. **解法**：AI + OPC，三个智能体 24 小时在线：先体检开方、再盯执行、按数据调整。
4. **证据**：学员数据四件套（基线 → 方案 → 过程 → 结果）全程留痕，可回放、可复现。
5. **愿景**：人人请得起的 AI 私教，方案不是拍脑袋，而是数据驱动。

## 功能

| 页面 | 智能体 | 说明 |
|---|---|---|
| `planner.html` | ① 做方案 | 填身体参数 → 生成个性化方案（减脂/塑形/瘦身/增肌），含营养代餐、负重训练、风险提示与"为什么"，可下载/打印为 PDF |
| `checker.html` | ② 打卡监督 | 每日 1 分钟打卡，连续天数/里程碑/周报/体重趋势，漏卡 3 天自动提醒 |
| `coach.html` | ③ 智能指导 | 基于打卡数据检测平台期/疲劳/漏卡并给调整；离线规则库答疑 |
| `replay.html` | 案例回放 | 3 个脱敏演示案例（减脂/增肌/塑形），四件套 + 方案回放 |

## 快速开始

无需安装任何依赖，两种方式任选：

**方式一（最简）**：直接用 Chrome / Edge 打开 `web/index.html`。

**方式二（推荐，体验完整）**：双击 `start-web.bat`，然后浏览器访问 <http://localhost:8000>。

网站访问流程：`index.html` 引导页 ↔ 验证码/密码登录界面 → `home.html` 官网主页 → 各智能体功能页。

命令行方式：

```bash
python -m http.server 8000 --directory web
# 浏览器打开 http://localhost:8000
```

> 数据保存在浏览器 localStorage（仅本机），不上传任何服务器。

## 目录结构

```
fitsolo-ai/
├─ docs/                    # 方案书 + 教练知识库 + 工具脚本
│  ├─ AI-OPC-平台方案书.md
│  └─ tools/                # md_to_pdf.py / build-cases-data.js / agent-test.js
├─ data/cases/              # 3 个脱敏演示案例（案例回放数据源）
├─ output/pdf/              # 方案书 PDF
├─ web/
│  ├─ agents/               # 三个智能体核心逻辑（纯 JS，无依赖）
│  │  ├─ knowledge.js       #   教练知识库（规则/动作库/营养库/边界）
│  │  ├─ planner-core.js    #   ① 做方案（确定性规则引擎）
│  │  ├─ checker-core.js    #   ② 打卡（连续/里程碑/周报）
│  │  └─ coach-core.js      #   ③ 智能指导（信号检测 + FAQ）
│  ├─ js/                   # 页面交互 + localStorage + 内嵌案例数据
│  ├─ css/styles.css         # 原官网与智能体功能页样式
│  ├─ css/auth.css           # 引导页与注册/登录页样式
│  ├─ js/auth.js             # 页面切换、模式切换与表单校验
│  ├─ index.html             # 全屏引导页 + 验证码/密码登录入口
│  ├─ home.html              # 官网主页（故事五幕 + 三智能体 + 案例）
│  ├─ legal.html             # 用户协议与隐私政策占位页
│  ├─ oauth-callback.html    # 第三方 OAuth 回调占位页
│  ├─ planner.html / checker.html / coach.html / replay.html
└─ start-web.bat            # 一键启动本地预览
```

## 技术说明

- **零依赖静态站**：纯 HTML/CSS/JS，双击即运行，可直接托管 GitHub Pages / Vercel / 任意静态空间。
- **可复现设计**：三个智能体是"规则优先、AI 辅助、输出强约束"——同一输入产出同一方案（`agent-test.js` 可验证）。
- **数据流**：`data/cases/*.json` → `web/js/cases-data.js`（用 `node docs/tools/build-cases-data.js` 重新生成）。
- **后续迁移**：agents 为纯 JS 模块，可平滑迁入 Next.js；`coach-core.js` 预留 LLM 钩子，配置 API Key 后回答更灵活。

## 测试

```bash
node docs/tools/agent-test.js
```

覆盖：Planner 三场景（减脂/增肌/塑形）、Checker 连续打卡/里程碑/周报、Coach 平台期信号检测与 FAQ 答疑。

## 上传 GitHub

1. 在 GitHub 新建仓库（如 `fitsolo-ai`，可选 Private）。
2. 本地初始化并提交（本仓库已就绪）：
   ```bash
   git init
   git add .
   git commit -m "FITSOLO: AI × OPC 智能私教平台 - 方案书 + Phase1 网站原型"
   ```
3. 关联远程仓库并推送：
   ```bash
   git remote add origin https://github.com/<你的用户名>/fitsolo-ai.git
   git branch -M main
   git push -u origin main
   ```
> 如果推送时报 `! [rejected] ... fetch first`（说明远端已有初始提交，比如 GitHub 自动生成的 README）：
> ```bash
> git pull origin main --allow-unrelated-histories --no-rebase
> # 若 README.md 冲突：保留我们的完整 README
> git add README.md
> git commit -m "merge: 整合 GitHub 初始提交"
> git push -u origin main
> ```
4. 开启 GitHub Pages（Settings → Pages → 选择 `main` 分支 + `/docs` 或根目录），即可得到公开访问链接；也可以把 `web/` 单独部署到 Vercel。

> ⚠️本仓库所有案例均为**模拟脱敏样例**。

## 合规提示

涉及用户身体数据（敏感个人信息），须遵循《个人信息保护法》：最小化收集、加密存储、单独同意、可导出可删除。详见方案书第 8 章。

