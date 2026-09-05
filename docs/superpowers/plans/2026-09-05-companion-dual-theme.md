# Companion Dual Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完善陪玩清单与详情页的参考图布局，并使浅色主题成为完整、协调、可访问的月白紫金版本。

**Architecture:** 继续使用现有 Vue 页面结构和 `companion-club.css` 外观层，在 `.club-skin` 内建立语义化主题变量，将页面表面、媒体叠层和控件状态分开。页面逻辑与 API 不变，只修正详情页 landmark，并通过主题契约测试与 Nuxt 验证保护改动。

**Tech Stack:** Nuxt 4、Vue 3、TypeScript、CSS custom properties、Node test runner

**Spec:** `docs/superpowers/specs/2026-09-05-companion-dual-theme.md`

## Global Constraints

- 只修改 `D:\MyDevelop\Mystikos\Mystikos`。
- 保留当前未提交的陪玩模块改动并在其上增量实现。
- 不修改搜索、筛选、收藏、分页、登录跳转和预约 API 行为。
- 不增加运行时依赖。

---

### Task 1: 双主题样式契约

**Files:**
- Modify: `test/companion-directory-style.test.mjs`
- Modify: `app/assets/css/companion-club.css`

**Interfaces:**
- Consumes: `.site-shell[data-theme="light"]` 与 `.club-skin` 主题作用域。
- Produces: `--club-surface-*`、`--club-on-media-*`、`--club-control-*` 语义变量及完整浅色覆盖。

- [x] **Step 1: Write the failing test**

增加独立断言，要求浅色主题覆盖普通目录卡、媒体外信息、收藏按钮、状态、筛选按钮、焦点、表单、语音与视频卡片，并要求语义化 on-media 变量存在。

- [x] **Step 2: Run test to verify it fails**

Run: `node --test test/companion-directory-style.test.mjs`

Expected: FAIL，因为当前仅覆盖 compact 卡片与部分详情控件。

- [x] **Step 3: Write minimal implementation**

在 `companion-club.css` 中定义并使用如下主题接口：

```css
.club-skin {
  --club-surface-page: #0d0e24;
  --club-surface-panel: #151630;
  --club-on-media: #fff;
  --club-control-surface: rgba(8, 9, 28, .72);
}

.site-shell[data-theme="light"] .club-skin {
  --club-surface-page: #f4f0e9;
  --club-surface-panel: #fffdf9;
  --club-control-surface: #faf7fc;
}
```

补齐所有页面外层、非媒体卡片、控件和反馈状态的浅色规则；媒体叠层继续使用 `--club-on-media`。

- [x] **Step 4: Run test to verify it passes**

Run: `node --test test/companion-directory-style.test.mjs`

Expected: PASS。

### Task 2: 清单页响应式与交互完善

**Files:**
- Modify: `test/companion-directory-style.test.mjs`
- Modify: `app/assets/css/companion-club.css`

**Interfaces:**
- Consumes: 当前 `.directory-*` DOM 与主题变量。
- Produces: 桌面三列、平板两列、手机一列布局，以及无需 hover 的触屏可见反馈。

- [x] **Step 1: Write the failing test**

断言目录搜索、筛选、收藏、分页具有 `focus-visible`，并断言 `hover: none` 环境不依赖悬浮动作。

- [x] **Step 2: Run test to verify it fails**

Run: `node --test test/companion-directory-style.test.mjs`

Expected: FAIL，因为当前没有完整焦点与触屏媒体查询。

- [x] **Step 3: Write minimal implementation**

增加统一焦点环、按钮状态、触屏卡片反馈和窄屏间距；保留当前筛选和收藏事件。

- [x] **Step 4: Run test to verify it passes**

Run: `node --test test/companion-directory-style.test.mjs`

Expected: PASS。

### Task 3: 详情页结构与内容面板完善

**Files:**
- Modify: `test/companion-directory-style.test.mjs`
- Modify: `app/pages/companions/[slug].vue`
- Modify: `app/assets/css/companion-club.css`

**Interfaces:**
- Consumes: 现有详情加载、画廊与预约方法。
- Produces: 单一 `main` landmark、统一的三栏详情与下方信息面板。

- [x] **Step 1: Write the failing test**

断言详情页根节点使用 `div.public-companion-profile`，预约/相册控件具有可访问焦点与浅色覆盖。

- [x] **Step 2: Run test to verify it fails**

Run: `node --test test/companion-directory-style.test.mjs`

Expected: FAIL，因为页面当前嵌套 `<main>`。

- [x] **Step 3: Write minimal implementation**

将详情根节点由 `main` 改为 `div`，并补齐画廊按钮、时长按钮、主要操作、媒体卡片和状态反馈的主题样式。

- [x] **Step 4: Run test to verify it passes**

Run: `node --test test/companion-directory-style.test.mjs`

Expected: PASS。

### Task 4: 回归验证

**Files:**
- Verify: all changed files

**Interfaces:**
- Consumes: Tasks 1–3 输出。
- Produces: 可构建的双主题陪玩模块。

- [x] **Step 1: Run companion tests**

Run: `node --test test/companion-style.test.mjs test/companion-directory-style.test.mjs`

- [x] **Step 2: Run full tests**

Run: `npm test`

- [x] **Step 3: Run type validation**

Run: `npm run typecheck`

- [x] **Step 4: Run production build**

Run: `npm run build`

- [x] **Step 5: Review final diff**

确认未修改业务方法、API 参数与项目外文件，且用户原有改动均被保留。
