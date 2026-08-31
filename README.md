# MBTI Blind Test · 情境式盲测

一个手机优先、纯前端、无需服务器的 48 题 MBTI 四维偏好测试。它不是官方 MBTI 量表，也不是心理诊断工具，目标是减少重复做熟悉题目时的“猜题”和自我标签效应，更适合观察不同时期的偏好变化。

## 功能

- 48 个跨工作、关系、旅行、学习、冲突、决策等情境的问题
- 每次新测试随机打乱题序，并随机交换 A/B 位置
- 逐题移动端交互，选择后自动下一题，可返回修改
- 自动保存未完成进度
- E/I、S/N、T/F、J/P 四条连续轴评分
- 维度方向一致性、中间答案比例、结果质量指标
- 本地保存最多 20 次完成结果，并自动与上一次比较
- 数据仅存浏览器 `localStorage`，无后端、无追踪脚本
- 可作为 GitHub Pages 静态站点部署

## GitHub Pages

推荐使用 GitHub Actions 自动部署。仓库内置 `.github/workflows/pages.yml`，首次只需在：

`Settings → Pages → Build and deployment → Source`

选择 **GitHub Actions**。之后每次推送到 `main` 都会自动部署。

站点地址：

`https://oboahs.github.io/mbti-blind-test/`

## 计分说明

每题 1～5：

- 1 = 明显更像 A
- 2 = 稍微更像 A
- 3 = 两边相近
- 4 = 稍微更像 B
- 5 = 明显更像 B

系统先将回答转换到统一的四条轴方向，再对每轴 12 题取平均。百分比表示本轮回答在对应偏好轴上的相对位置，不表示“人格成分占比”。

“一致性”衡量同一维度在不同情境中是否持续偏向同一方向；它低并不等于答错，更可能说明该维度具有较强的情境依赖。

## 文件结构

- `index.html`：页面结构
- `styles.css`：移动端优先样式
- `questions.js`：48 道题及隐藏计分键
- `app.js`：随机化、答题状态、评分、历史比较
- `manifest.webmanifest`：移动端 Web App 元数据
- `icon.svg`：站点图标
- `.github/workflows/pages.yml`：GitHub Pages 自动部署
