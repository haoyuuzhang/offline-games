# Offline Arcade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained offline retro arcade with five playable canvas games.

**Architecture:** `index.html` provides the UI shell and canvas. `arcade.js` contains browser wiring, shared rendering helpers, and game factories. `tests/arcade.test.js` verifies reusable logic with Node's built-in `assert`.

**Tech Stack:** HTML, CSS, browser Canvas 2D, vanilla JavaScript, Node built-in test runner style via plain `assert`.

## Global Constraints

- No network access or external dependencies.
- Must work from local files.
- Must include keyboard controls and touch buttons.
- Keep visuals retro, readable, and responsive.
- Keep core game logic testable without a browser.

---

### Task 1: Core Logic Tests

**Files:**
- Create: `tests/arcade.test.js`

**Interfaces:**
- Consumes: `createSnakeGame`, `createTetrisGame`, `createGameRegistry` from `arcade.js`
- Produces: Failing tests that describe the logic contract.

- [x] **Step 1: Write failing tests**

Create tests for game registry, snake food pickup, snake collision, and Tetris line clear.

- [x] **Step 2: Run tests to verify failure**

Run: `node tests/arcade.test.js`
Expected: fails because `arcade.js` does not exist yet.

### Task 2: Offline Arcade Implementation

**Files:**
- Create: `index.html`
- Create: `arcade.js`

**Interfaces:**
- Consumes: Browser canvas, keyboard events, touch button events.
- Produces: `window.Arcade` and CommonJS exports for tests.

- [ ] **Step 1: Implement logic factories**

Implement `createSnakeGame`, `createTetrisGame`, `createPongGame`, `createBreakoutGame`, `createDodgerGame`, and `createGameRegistry`.

- [ ] **Step 2: Implement browser UI shell**

Render the game list, status strip, canvas drawing loop, action buttons, and touch controls.

- [ ] **Step 3: Run tests**

Run: `node tests/arcade.test.js`
Expected: all tests pass.

### Task 3: Static Verification

**Files:**
- Read: `index.html`
- Read: `arcade.js`

**Interfaces:**
- Consumes: completed files.
- Produces: evidence that expected hooks and exports are present.

- [ ] **Step 1: Check files exist**

Run: `Get-ChildItem index.html, arcade.js, tests/arcade.test.js`
Expected: all three files listed.

- [ ] **Step 2: Check page hooks**

Run: `Select-String -Path index.html -Pattern "gameCanvas|arcade.js|touchPad"`
Expected: all hooks are found.

## Self-Review

The plan covers the approved design: offline page, five games, shared logic, touch controls, and verification. No placeholders remain. Function names are consistent between tests and implementation.
