# 青崖山改版 Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for inline implementation. Steps use checkbox syntax for tracking.

**Goal:** 完成精美青绿山水视觉、章节目标与四时委托。
**Architecture:** 现有引擎保留；新 progression.js 为 SectEngine 补充纯逻辑 API；UI 消费 API，art.css 负责新视觉。
**Tech Stack:** 原生 JavaScript、CSS、SVG、Node assert、Playwright。
**Spec:** docs/superpowers/specs/2026-11-16-qingya-design.md

## Global Constraints
- v3 主键和 v2 迁移保持；不发布远端。
- 原有地图操作与手机、夜色、减少动态支持保留。
- 现有目录内实施，工作区干净，git 基线 2c8b154 可恢复。

## Review Focus
- 重复或越级领取不能发奖励。
- 旧存档缺成长字段能安全读取及导出。
- 季节跨年正确，资源不足不部分扣费。
- 每日重绘不丢失表单焦点。
- 手机横向不溢出，夜色文字可读，地图仍可点击。

### Task 1: 成长逻辑
**Files:** js/progression.js, js/engine.js, tests/progression.test.js, package.json
**Interfaces:** E.journey(state), E.claimChapter(state,id), E.commission(state), E.fulfillCommission(state,id)。操作返回 {ok,msg}；查询不修改状态。
- [x] 编写实测：首章可领且只领一次、越级阻止、条件进度、旧档补字段、已达标旧档、资源原子结算、每季一次、跨季跨年、过期单拒绝、保存读取。
- [x] 运行新增测试确认失败，原因是 API 缺失。
- [x] 实现七章条件、奖励和四时交付，补充规范化字段；更新 npm test。
- [x] 运行 npm test，确认全通过。

### Task 2: 山门画面与交互
**Files:** assets/qingya-panorama.jpg, assets/art-direction.md, css/art.css, js/ui.js, index.html
**Consumes:** Task 1 API；查询只读、领取后存档并刷新。
- [x] 保存原创生成插画及提示词；重做开场、山水横卷、地图地台和地形层次。
- [x] 在首页展示当前章节、完整长卷弹窗与四时委托；按钮直达对应页面。
- [x] 本地服务器与真实浏览器验证新建、章节、委托、地图、弟子操作、营造和旧档续玩；截图检查桌面/手机和夜色。

### Task 3: 回归与说明
**Files:** README.md, package.json, index.html
- [x] 核对改动及资源引用、运行语法检查与完整测试。
- [x] 更新版本和改版说明，保存预览图。
- [x] 独立审查整体改动，修复影响使用的问题。

## 验收记录

- 全部 50 项 Node 测试通过（原 37 项 + 新增 13 项）。
- Playwright + Edge：桌面、新建、七章弹窗、章节领奖、季节交付、地图点击、三种速度下差事自动暂停、实际营造、五页导航、刷新续玩、390/320 手机、夜色、减少动态、v2 迁移与本地 file 启动通过，无页面异常或 HTTP 错误。
- 独立审查发现首章条件把重复灵田计成三类建筑，已用回归测试复现 3 !== 1 后修复；再次运行全套通过。
- 实施取舍：保留原生零构建架构，Astryx 仅作设计参考；原目录直接修改，不合并、不推送、不部署。
- 自然飞升全周期的长期数值平衡未在本轮模拟；后期章节由达标存档验证贯通。
