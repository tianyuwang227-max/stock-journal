const STORAGE_KEY = "stock-journal-v1";
const API_URL = "/api/state";
const CURRENT_STATE_VERSION = 2;
const DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

const researchPrompts = [
  ["background", "公司背景", "它是谁，主营业务是什么，处在什么发展阶段？"],
  ["financing", "融资逻辑", "为什么上市/融资，资金主要流向哪里？"],
  ["revenue", "靠什么赚钱", "收入来源、客户、毛利、成本结构是什么？"],
  ["position", "行业地位", "龙头、二线、细分玩家？竞争对手是谁？"],
  ["upside", "上涨逻辑", "业绩、政策、周期、估值、资金、题材分别怎么影响？"],
  ["risk", "风险", "财务、政策、估值、竞争、管理层、周期有哪些风险？"],
  ["summary", "一句话理解", "我现在是否真的理解这家公司？"]
];

const researchQuestionBank = [
  "这家公司最关键的三项财务指标是什么？",
  "如果行业景气度下降，它的利润会先从哪里受影响？",
  "市场现在买它，真正买的是业绩、周期、政策还是题材？",
  "和同行业公司相比，它的优势能持续多久？",
  "我还缺哪一条证据，才敢形成判断？"
];

const decisionPromptBank = [
  ["reason", "为什么我现在关注它？"],
  ["evidence", "支持这个判断的事实证据有哪些？"],
  ["doubt", "我最可能看错的地方是什么？"],
  ["risk", "如果下跌，最可能是哪条逻辑被证伪？"],
  ["buyCondition", "什么条件出现才考虑买？"],
  ["dropCondition", "什么信号出现就停止研究？"]
];

const decisionQualityRules = [
  ["stock", "标的", "先写清楚股票名称或代码", "stock"],
  ["reason", "理由", "补一句为什么现在关注它", "reason"],
  ["evidence", "证据", "补充至少一条事实证据", "evidence"],
  ["risk", "风险", "写清最大风险和可能触发点", "risk"],
  ["buyCondition", "买入条件", "把买入条件写成可验证信号", "buyCondition"],
  ["dropCondition", "放弃条件", "写清什么情况停止研究", "dropCondition"],
  ["reviewDate", "复盘日期", "设置下次回头看的日期", "reviewDate"]
];

const lifePromptBank = [
  "今天我最稳定的一件事是什么？",
  "今天让我分心的东西是什么？",
  "今天学习股票时，我真正理解了什么？",
  "明天最小的一步是什么？"
];

function createEmptyDailyReview() {
  return {
    marketRead: "",
    decisionReview: "",
    mistake: "",
    tomorrow: "",
    summary: ""
  };
}

const decisionChecklistItems = [
  ["understood", "我理解公司靠什么赚钱"],
  ["evidence", "关键证据已经写清楚"],
  ["risk", "最大风险已经写清楚"],
  ["buyCondition", "买入条件具体"],
  ["dropCondition", "放弃条件具体"],
  ["reviewDate", "设置了下次复盘日期"]
];

const emptyDecisionChecklist = Object.fromEntries(decisionChecklistItems.map(([key]) => [key, false]));

const defaultState = {
  schemaVersion: CURRENT_STATE_VERSION,
  updatedAt: "",
  quickNote: "",
  marketNote: "",
  marketQuestion: "",
  lifeJournal: "",
  activeJournalDay: 0,
  dailyJournals: ["", "", "", "", "", "", ""],
  dailyReviews: Array.from({ length: 7 }, () => createEmptyDailyReview()),
  weekTitle: "",
  weekGoal: "",
  weekReflection: "",
  weekSummary: "",
  weeklyHistory: [],
  activeCompanyId: "catl",
  activeDecisionId: null,
  decisionStatus: "观察",
  marketPulse: {
    mood: "震荡观察",
    strength: 42,
    strongest: "半导体",
    weakest: "医药",
    volume: "缩量"
  },
  indexes: [
    { name: "上证指数", value: "手动记录", change: "待观察", trend: "flat" },
    { name: "深证成指", value: "手动记录", change: "待观察", trend: "flat" },
    { name: "创业板指", value: "手动记录", change: "待观察", trend: "flat" },
    { name: "北证50", value: "手动记录", change: "待观察", trend: "flat" }
  ],
  sectors: [
    { name: "半导体", heat: "观察", trend: "up" },
    { name: "新能源", heat: "等待拐点", trend: "flat" },
    { name: "消费", heat: "防守", trend: "up" },
    { name: "医药", heat: "分化", trend: "down" }
  ],
  marketRows: [
    { stock: "宁德时代", status: "观察", change: "手动", trigger: "业绩确认 / 估值回落", risk: "价格战" },
    { stock: "比亚迪", status: "重点观察", change: "手动", trigger: "销量与利润率改善", risk: "竞争加剧" }
  ],
  companies: [
    {
      id: "catl",
      name: "宁德时代",
      code: "300750",
      industry: "动力电池",
      updatedAt: "今天",
      stage: "研究中",
      sources: "",
      fields: {
        background: "全球动力电池龙头，业务覆盖动力电池、储能和材料体系。",
        financing: "",
        revenue: "",
        position: "行业龙头，需要继续比较市占率、毛利率和海外扩张。",
        upside: "关注储能增长、海外订单、盈利能力修复。",
        risk: "价格战、原材料波动、海外政策与估值压力。",
        summary: "核心问题是增长确定性和估值是否匹配。"
      },
      customQuestions: [
        { q: "如果行业继续降价，它还能保持利润率吗？", a: "" }
      ]
    },
    {
      id: "byd",
      name: "比亚迪",
      code: "002594",
      industry: "新能源汽车",
      updatedAt: "昨天",
      stage: "观察中",
      sources: "",
      fields: {
        background: "整车、电池和供应链一体化公司。",
        financing: "",
        revenue: "",
        position: "新能源车头部公司。",
        upside: "销量、出海和高端化。",
        risk: "竞争激烈、利润率承压。",
        summary: "重点看规模优势能否转化为持续利润。"
      },
      customQuestions: []
    }
  ],
  decisions: [
    {
      id: "d1",
      stock: "宁德时代",
      status: "观察",
      confidence: 3,
      reason: "长期逻辑清楚，但需要等待估值和盈利确认。",
      evidence: "公司研究卡初步结论，后续需要补财报和行业数据。",
      doubt: "储能和海外业务能否抵消价格战影响。",
      risk: "行业竞争导致利润率下滑。",
      buyCondition: "业绩趋势确认，估值进入可接受区间。",
      dropCondition: "核心盈利能力持续恶化。",
      reviewDate: "",
      resultReview: "",
      checklist: {
        understood: true,
        evidence: true,
        risk: true,
        buyCondition: true,
        dropCondition: true,
        reviewDate: false
      }
    }
  ],
  draftDecision: {
    stock: "",
    confidence: 3,
    reason: "",
    evidence: "",
    doubt: "",
    risk: "",
    buyCondition: "",
    dropCondition: "",
    reviewDate: "",
    resultReview: "",
    checklist: { ...emptyDecisionChecklist }
  },
  tasks: [
    { id: "t1", title: "写每日笔记", target: "5 天", priority: "高", checks: [true, true, false, true, false, false, false] },
    { id: "t2", title: "研究 2 家公司", target: "2 次", priority: "高", checks: [false, true, false, false, false, false, false] },
    { id: "t3", title: "复盘 1 个判断", target: "1 次", priority: "中", checks: [false, false, false, false, false, false, false] }
  ]
};

let state = structuredClone(defaultState);
let storageMode = "本地模式";
let saveStatus = "未保存";
let saveStatusTone = "idle";
let hasUnsavedChanges = false;
let backupTimer = null;
let filters = {
  companyQuery: "",
  decisionQuery: "",
  decisionStatus: "全部"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function loadState() {
  try {
    const response = await fetch(API_URL, { headers: { Accept: "application/json" } });
    if (response.ok) {
      const remote = await response.json();
      state = prepareState(remote);
      normalizeState();
      storageMode = storageLabel(response.headers.get("X-Stock-Journal-Storage"));
      return;
    }
  } catch {
    storageMode = "本地模式";
  }

  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      state = prepareState(JSON.parse(local));
    } catch {
      state = clone(defaultState);
      saveStatus = "本地数据读取失败";
      saveStatusTone = "warning";
    }
  }
  normalizeState();
}

function storageLabel(value) {
  if (value === "local-api") return "本地接口";
  if (value === "d1") return "D1 模式";
  return "D1 模式";
}

function prepareState(input) {
  if (!isPlainObject(input)) return clone(defaultState);
  const migrated = { ...clone(defaultState), ...input };
  migrated.schemaVersion = CURRENT_STATE_VERSION;
  return migrated;
}

function validateImportedState(input) {
  if (!isPlainObject(input)) return "导入文件不是有效的手账 JSON";
  const hasRecognizedData = [
    "companies",
    "decisions",
    "tasks",
    "marketRows",
    "dailyJournals",
    "dailyReviews",
    "weeklyHistory"
  ].some((key) => Object.hasOwn(input, key));
  if (!hasRecognizedData) return "没有识别到手账数据";
  if (input.companies && !Array.isArray(input.companies)) return "公司研究数据格式不对";
  if (input.decisions && !Array.isArray(input.decisions)) return "反思判断数据格式不对";
  if (input.tasks && !Array.isArray(input.tasks)) return "打卡任务数据格式不对";
  if (input.marketRows && !Array.isArray(input.marketRows)) return "行情观察数据格式不对";
  if (input.dailyJournals && !Array.isArray(input.dailyJournals)) return "生活日记数据格式不对";
  if (input.dailyReviews && !Array.isArray(input.dailyReviews)) return "每日复盘数据格式不对";
  return "";
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeState() {
  state.schemaVersion = CURRENT_STATE_VERSION;
  state.dailyJournals = Array.isArray(state.dailyJournals) ? state.dailyJournals : Array(7).fill("");
  while (state.dailyJournals.length < 7) state.dailyJournals.push("");
  state.dailyJournals = state.dailyJournals.slice(0, 7);
  if (state.lifeJournal && !state.dailyJournals.some(Boolean)) {
    state.dailyJournals[0] = state.lifeJournal;
  }
  state.dailyReviews = Array.isArray(state.dailyReviews) ? state.dailyReviews : [];
  while (state.dailyReviews.length < 7) state.dailyReviews.push(createEmptyDailyReview());
  state.dailyReviews = state.dailyReviews.slice(0, 7).map((review) => ({
    ...createEmptyDailyReview(),
    ...(review || {})
  }));
  state.activeJournalDay = Number.isInteger(state.activeJournalDay) ? state.activeJournalDay : 0;
  state.activeJournalDay = Math.min(6, Math.max(0, state.activeJournalDay));
  state.activeDecisionId = state.activeDecisionId || null;
  state.weeklyHistory = Array.isArray(state.weeklyHistory) ? state.weeklyHistory : [];
  state.draftDecision = { ...clone(defaultState.draftDecision), ...(state.draftDecision || {}) };
  state.draftDecision.checklist = { ...emptyDecisionChecklist, ...(state.draftDecision.checklist || {}) };
  state.decisions = (state.decisions || []).map((decision) => ({
    ...clone(defaultState.draftDecision),
    status: "观察",
    ...decision,
    checklist: { ...emptyDecisionChecklist, ...(decision.checklist || {}) }
  }));
  state.marketPulse = { ...clone(defaultState.marketPulse), ...(state.marketPulse || {}) };
  state.tasks = (state.tasks || []).map((task) => ({
    ...task,
    checks: Array.isArray(task.checks) ? [...task.checks, ...Array(7).fill(false)].slice(0, 7) : Array(7).fill(false)
  }));
}

async function persistState(showToast = true, skipCollect = false) {
  if (!skipCollect) collectFormState();
  hasUnsavedChanges = false;
  window.clearTimeout(backupTimer);
  saveStatus = "保存中...";
  saveStatusTone = "saving";
  updateSaveStatus();

  state.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    saveStatus = "本地保存失败";
    saveStatusTone = "error";
    updateSaveStatus();
    if (showToast) showToastMessage("本地保存失败", "error");
    return;
  }

  if (usesApiStorage()) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state)
      });
      if (!response.ok) throw new Error("Remote save failed");
    } catch {
      const failedMode = storageMode;
      storageMode = "本地模式";
      saveStatus = `${failedMode}失败，已转本地`;
      saveStatusTone = "warning";
      $("#storageMode").textContent = storageMode;
      updateSaveStatus();
      if (showToast) showToastMessage(saveStatus, "warning");
      render();
      return;
    }
  }

  $("#storageMode").textContent = storageMode;
  saveStatus = `已保存 ${formatSaveTime(state.updatedAt)}`;
  saveStatusTone = "saved";
  updateSaveStatus();
  if (showToast) showToastMessage("已保存", "saved");
  render();
}

function usesApiStorage() {
  return storageMode === "D1 模式" || storageMode === "本地接口";
}

function showSaved() {
  showToastMessage("已保存", "saved");
}

function markDirty() {
  if (hasUnsavedChanges || saveStatusTone === "saving") return;
  hasUnsavedChanges = true;
  saveStatus = "有未保存更改";
  saveStatusTone = "dirty";
  updateSaveStatus();
  scheduleLocalBackup();
}

function scheduleLocalBackup() {
  window.clearTimeout(backupTimer);
  backupTimer = window.setTimeout(() => {
    localBackup();
  }, 1400);
}

function localBackup() {
  if (!hasUnsavedChanges || saveStatusTone === "saving") return;
  collectFormState();
  state.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    saveStatus = `已自动备份 ${formatSaveTime(state.updatedAt)}`;
    saveStatusTone = "backup";
  } catch {
    saveStatus = "自动备份失败";
    saveStatusTone = "error";
  }
  updateSaveStatus();
}

function showToastMessage(message = "已保存", tone = "saved") {
  const toast = $("#toast");
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1300);
}

function updateSaveStatus() {
  const node = $("#saveStatus");
  if (!node) return;
  node.textContent = saveStatus;
  node.dataset.tone = saveStatusTone;
}

function formatSaveTime(value) {
  if (!value) return "刚刚";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚";
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function switchSheet(id) {
  $$(".nav-item").forEach((button) => {
    const active = button.dataset.sheet === id;
    button.classList.toggle("active", active);
    if (active) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
  $$(".sheet").forEach((sheet) => sheet.classList.toggle("active", sheet.id === id));
  const active = $(`.nav-item[data-sheet="${id}"]`);
  $("#sheetTitle").textContent = active ? active.childNodes[2].textContent.trim() : "总览";
}

function activeCompany() {
  return state.companies.find((company) => company.id === state.activeCompanyId) || state.companies[0];
}

function companyCompletion(company) {
  if (!company) return 0;
  const fields = company.fields || {};
  const filled = researchPrompts.filter(([key]) => String(fields[key] || "").trim().length > 0).length;
  return Math.round((filled / researchPrompts.length) * 100);
}

function taskStats() {
  const total = state.tasks.length * DAYS.length;
  const done = state.tasks.reduce((sum, task) => sum + task.checks.filter(Boolean).length, 0);
  return { done, total, rate: total ? Math.round((done / total) * 100) : 0 };
}

function todayIndex() {
  return (new Date().getDay() + 6) % 7;
}

function todayISO() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function checklistStats(checklist = {}) {
  const done = decisionChecklistItems.filter(([key]) => checklist[key]).length;
  return { done, total: decisionChecklistItems.length };
}

function textReady(value, minLength = 4) {
  return String(value || "").trim().length >= minLength;
}

function decisionQuality(decision = state.draftDecision) {
  const checks = {
    stock: textReady(decision.stock, 2),
    reason: textReady(decision.reason, 6),
    evidence: textReady(decision.evidence, 8),
    risk: textReady(decision.risk, 6),
    buyCondition: textReady(decision.buyCondition, 6),
    dropCondition: textReady(decision.dropCondition, 6),
    reviewDate: textReady(decision.reviewDate, 4)
  };
  const done = decisionQualityRules.filter(([key]) => checks[key]).length;
  const score = Math.round((done / decisionQualityRules.length) * 100);
  const gaps = decisionQualityRules
    .filter(([key]) => !checks[key])
    .map(([key, label, message, target]) => ({ key, label, message, target }));
  return { checks, done, total: decisionQualityRules.length, score, gaps };
}

function decisionQualityTitle(score) {
  if (score >= 86) return "记录很完整";
  if (score >= 58) return "可以进入观察";
  return "先补关键证据";
}

function dailyReviewReady(review = {}) {
  return Boolean(
    textReady(review.summary, 8) ||
    textReady(review.marketRead, 6) ||
    textReady(review.decisionReview, 6) ||
    textReady(review.mistake, 6) ||
    textReady(review.tomorrow, 6)
  );
}

function streak() {
  let count = 0;
  for (let day = 0; day < DAYS.length; day += 1) {
    const dayDone = state.tasks.length > 0 && state.tasks.every((task) => task.checks[day]);
    if (dayDone) count += 1;
  }
  return count;
}

function render() {
  $("#storageMode").textContent = storageMode;
  if (state.updatedAt && saveStatus === "未保存") {
    saveStatus = `上次保存 ${formatSaveTime(state.updatedAt)}`;
    saveStatusTone = "idle";
  }
  updateSaveStatus();
  renderOverview();
  renderMarket();
  renderResearch();
  renderDecision();
  renderPlan();
  renderCheckin();
  syncInputs();
}

function renderOverview() {
  const stats = taskStats();
  $("#weeklyDone").textContent = `${stats.done} / ${stats.total}`;
  $("#weeklyRate").textContent = `${stats.rate}%`;
  $("#weeklyProgress").style.width = `${stats.rate}%`;
  $("#streakCount").textContent = `${streak()} 天 ↑`;
  $("#quickNote").value = state.quickNote || "";
  $("#todayLabel").textContent = DAYS[todayIndex()];

  $("#todayActions").innerHTML = state.tasks.length ? state.tasks.map((task, index) => {
    const done = task.checks[todayIndex()];
    return `
      <div class="today-row">
        <span>${task.title || "未命名任务"}</span>
        <button class="${done ? "done" : ""}" data-overview-check="${index}" type="button" aria-label="${done ? "取消完成" : "完成"}今日任务：${escapeAttr(task.title || "未命名任务")}" title="${done ? "取消完成" : "完成"}今日任务">✓</button>
      </div>
    `;
  }).join("") : `<div class="today-row"><span class="meta">还没有本周任务</span></div>`;

  $("#weekCalendar").innerHTML = DAYS.map((day, index) => {
    const taskTotal = state.tasks.length;
    const taskDone = state.tasks.filter((task) => task.checks[index]).length;
    const taskRate = taskTotal ? Math.round((taskDone / taskTotal) * 100) : 0;
    const hasJournal = textReady(state.dailyJournals[index], 4);
    const hasReview = dailyReviewReady(state.dailyReviews[index]);
    const isToday = index === todayIndex();
    return `
      <button class="calendar-day ${isToday ? "today" : ""}" data-open-day="${index}" type="button" aria-label="打开${day}打卡和复盘" title="打开${day}打卡和复盘">
        <span class="calendar-name">${day}</span>
        <strong>${taskRate}%</strong>
        <div class="mini-progress"><span style="width: ${taskRate}%"></span></div>
        <div class="calendar-tags">
          <i class="${hasJournal ? "done" : ""}">日记</i>
          <i class="${hasReview ? "done" : ""}">复盘</i>
        </div>
      </button>
    `;
  }).join("");

  $("#recentCompanies").innerHTML = state.companies.slice(0, 4).map((company) => `
    <button class="mini-card company-jump" data-id="${company.id}" type="button" aria-label="打开公司研究：${escapeAttr(company.name || "未命名公司")}" title="打开公司研究">
      <strong>${company.name} <span class="meta">${company.code}</span></strong>
      <span class="tag">${company.industry || "未分类"}</span>
      <span class="tag">${company.stage || "研究中"}</span>
      <p>${company.fields?.summary || "还没有一句话理解。"}</p>
      <div class="mini-progress"><span style="width: ${companyCompletion(company)}%"></span></div>
    </button>
  `).join("");

  $("#watchStocks").innerHTML = state.marketRows.slice(0, 5).map((row) => `
    <div class="watch-row">
      <strong>${row.stock || "未命名股票"}</strong>
      <span class="tag">${row.status || "观察"}</span>
      <span class="tag risk">${row.risk || "风险待补充"}</span>
      <p>${row.trigger || "等待触发条件。"}</p>
      <button class="text-button" data-watch-to-company="${escapeAttr(row.stock || "")}" type="button" aria-label="为${escapeAttr(row.stock || "观察股票")}建立研究卡" title="建立研究卡">建研究卡</button>
    </div>
  `).join("");

  const today = todayISO();
  const dueReviews = state.decisions
    .filter((item) => item.reviewDate && item.reviewDate <= today && !item.resultReview)
    .slice(0, 4);
  $("#dueReviews").innerHTML = dueReviews.length ? dueReviews.map((item) => `
    <div class="review-row">
      <strong>${item.stock || "未命名判断"}</strong>
      <span class="tag">${item.status || "观察"}</span>
      <span class="tag risk">复盘 ${item.reviewDate}</span>
      <p>${item.reason || "等待回头验证。"}</p>
      <button class="text-button" data-review-decision="${item.id}" type="button" aria-label="载入${escapeAttr(item.stock || "未命名判断")}复盘" title="载入复盘">载入复盘</button>
    </div>
  `).join("") : `<div class="review-row"><strong>暂无到期复盘</strong><p class="meta">给判断设置下次复盘日期后，这里会自动出现。</p></div>`;

  const stageCounts = state.companies.reduce((acc, company) => {
    const stage = company.stage || "未设置";
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});
  const maxStage = Math.max(1, ...Object.values(stageCounts));
  $("#stageList").innerHTML = Object.entries(stageCounts).map(([stage, count]) => `
    <div class="stage-row">
      <span>${stage}</span>
      <div class="stage-bar"><span style="width: ${(count / maxStage) * 100}%"></span></div>
      <strong>${count}</strong>
    </div>
  `).join("");

  $$(".company-jump").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeCompanyId = button.dataset.id;
      switchSheet("research");
      renderResearch();
    });
  });
}

function renderMarket() {
  $("#marketNote").value = state.marketNote || "";
  $("#marketQuestion").value = state.marketQuestion || "";
  $("#marketMood").value = state.marketPulse?.mood || "";
  $("#marketStrength").value = state.marketPulse?.strength ?? 42;
  $("#pulseValue").textContent = state.marketPulse?.strength ?? 42;
  $("#strongestSector").value = state.marketPulse?.strongest || "";
  $("#weakestSector").value = state.marketPulse?.weakest || "";
  $("#volumeSignal").value = state.marketPulse?.volume || "";

  $("#indexGrid").innerHTML = state.indexes.map((item, index) => `
    <div class="index-card">
      <span class="meta">${item.name}</span>
      <input data-index="${index}" data-field="value" value="${escapeAttr(item.value)}" />
      <input data-index="${index}" data-field="change" value="${escapeAttr(item.change)}" />
    </div>
  `).join("");

  $("#sectorGrid").innerHTML = state.sectors.map((item, index) => `
    <div class="sector-card">
      <input data-sector="${index}" data-field="name" value="${escapeAttr(item.name)}" />
      <input data-sector="${index}" data-field="heat" value="${escapeAttr(item.heat)}" />
    </div>
  `).join("");

  $("#marketRows").innerHTML = state.marketRows.map((row, index) => `
    <tr>
      <td><input data-market="${index}" data-field="stock" value="${escapeAttr(row.stock)}" /></td>
      <td><input data-market="${index}" data-field="status" value="${escapeAttr(row.status)}" /></td>
      <td><input data-market="${index}" data-field="change" value="${escapeAttr(row.change)}" /></td>
      <td><input data-market="${index}" data-field="trigger" value="${escapeAttr(row.trigger)}" /></td>
      <td><input data-market="${index}" data-field="risk" value="${escapeAttr(row.risk)}" /></td>
      <td>
        <div class="table-actions">
          <button class="text-button" data-market-to-company="${index}" type="button" aria-label="为${escapeAttr(row.stock || "观察股票")}建立公司研究卡" title="建立公司研究卡">建卡</button>
          <button class="danger-button" data-delete-market="${index}" type="button" aria-label="删除${escapeAttr(row.stock || "观察股票")}行情记录" title="删除行情记录">删除</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderResearch() {
  const company = activeCompany();
  if (!company) return;
  const companyQuery = filters.companyQuery.trim().toLowerCase();
  const filteredCompanies = state.companies.filter((item) => {
    const haystack = [item.name, item.code, item.industry, item.stage, item.fields?.summary]
      .join(" ")
      .toLowerCase();
    return !companyQuery || haystack.includes(companyQuery);
  });

  $("#companySearch").value = filters.companyQuery;

  $("#companyList").innerHTML = filteredCompanies.length ? filteredCompanies.map((item) => `
    <button class="company-item ${item.id === company.id ? "active" : ""}" data-id="${item.id}" type="button" aria-label="打开公司研究：${escapeAttr(item.name || "未命名公司")}" title="打开公司研究">
      <strong>${item.name || "未命名公司"}</strong>
      <span class="meta">${item.code || "未填代码"} · ${item.industry || "未分类"}</span>
      <div class="mini-progress"><span style="width: ${companyCompletion(item)}%"></span></div>
    </button>
  `).join("") : `<div class="company-item"><strong>没有匹配的公司</strong><span class="meta">换个关键词试试</span></div>`;

  $("#companyName").value = company.name || "";
  $("#companyCode").value = company.code || "";
  $("#companyIndustry").value = company.industry || "";
  $("#companyStage").value = company.stage || "";
  $("#companySources").value = company.sources || "";
  $("#companyReport").value = company.report || "";
  $("#researchRate").textContent = `${companyCompletion(company)}%`;
  $("#researchProgress").style.width = `${companyCompletion(company)}%`;

  $("#researchFields").innerHTML = researchPrompts.map(([key, title, placeholder], index) => `
    <details class="accordion" ${index < 2 ? "open" : ""}>
      <summary>${title}</summary>
      <textarea data-research-field="${key}" placeholder="${placeholder}">${company.fields?.[key] || ""}</textarea>
    </details>
  `).join("");

  $("#researchPromptBank").innerHTML = researchQuestionBank.map((item, index) => `
    <button class="prompt-chip" data-research-prompt="${index}" type="button" title="追加到自定义问题">${item}</button>
  `).join("");

  $("#customQuestions").innerHTML = (company.customQuestions || []).map((item, index) => `
    <div class="source-item">
      <label>问题<input data-question="${index}" data-field="q" value="${escapeAttr(item.q)}" /></label>
      <label>回答<textarea data-question="${index}" data-field="a">${item.a || ""}</textarea></label>
      <button class="danger-button" data-delete-question="${index}" type="button" aria-label="删除自定义问题：${escapeAttr(item.q || "新问题")}" title="删除自定义问题">删除问题</button>
    </div>
  `).join("");

  $$(".company-item").forEach((button) => {
    button.addEventListener("click", () => {
      collectCompanyState();
      state.activeCompanyId = button.dataset.id;
      renderResearch();
    });
  });
}

function renderDecision() {
  $("#decisionStock").value = state.draftDecision.stock || "";
  $("#confidence").value = state.draftDecision.confidence || 3;
  $("#reviewDate").value = state.draftDecision.reviewDate || "";
  $("#decisionReason").value = state.draftDecision.reason || "";
  $("#decisionEvidence").value = state.draftDecision.evidence || "";
  $("#decisionDoubt").value = state.draftDecision.doubt || "";
  $("#decisionRisk").value = state.draftDecision.risk || "";
  $("#buyCondition").value = state.draftDecision.buyCondition || "";
  $("#dropCondition").value = state.draftDecision.dropCondition || "";
  $("#resultReview").value = state.draftDecision.resultReview || "";

  $$("#decisionSegment button").forEach((button) => {
    button.classList.toggle("active", button.dataset.value === state.decisionStatus);
  });

  const quality = decisionQuality(state.draftDecision);
  $("#decisionQualityScore").textContent = quality.score;
  $("#decisionQualityTitle").textContent = decisionQualityTitle(quality.score);
  $("#decisionQualityHint").textContent = `${quality.done}/${quality.total} 项已完成，只提醒记录完整度。`;
  $("#decisionQualityBars").innerHTML = decisionQualityRules.map(([key, label]) => `
    <div class="quality-bar ${quality.checks[key] ? "done" : ""}">
      <span>${label}</span>
      <i></i>
    </div>
  `).join("");
  $("#decisionGaps").innerHTML = quality.gaps.length ? quality.gaps.slice(0, 3).map((gap) => `
    <button class="gap-item" data-fill-gap="${gap.target}" type="button" title="补充${gap.label}">
      <strong>${gap.label}</strong>
      <span>${gap.message}</span>
    </button>
  `).join("") : `<div class="gap-item complete"><strong>暂时没有明显缺口</strong><span>保存前再看一遍证据和风险。</span></div>`;

  const checklist = { ...emptyDecisionChecklist, ...(state.draftDecision.checklist || {}) };
  const checklistCount = checklistStats(checklist);
  $("#decisionChecklistRate").textContent = `${checklistCount.done} / ${checklistCount.total}`;
  $("#decisionChecklist").innerHTML = decisionChecklistItems.map(([key, label]) => `
    <label class="checklist-item">
      <input type="checkbox" data-decision-check="${key}" ${checklist[key] ? "checked" : ""} />
      <span>${label}</span>
    </label>
  `).join("");

  $("#decisionPromptBank").innerHTML = decisionPromptBank.map(([field, label], index) => `
    <button class="prompt-chip" data-decision-prompt="${index}" data-field="${field}" type="button" title="填入判断草稿">${label}</button>
  `).join("");

  const decisionQuery = filters.decisionQuery.trim().toLowerCase();
  const filteredDecisions = state.decisions.filter((item) => {
    const statusMatch = filters.decisionStatus === "全部" || item.status === filters.decisionStatus;
    const haystack = [
      item.stock,
      item.status,
      item.reason,
      item.evidence,
      item.doubt,
      item.risk,
      item.buyCondition,
      item.dropCondition,
      item.resultReview
    ].join(" ").toLowerCase();
    return statusMatch && (!decisionQuery || haystack.includes(decisionQuery));
  });

  $("#decisionSearch").value = filters.decisionQuery;
  $("#decisionCount").textContent = `${filteredDecisions.length} 条`;
  $$("#decisionFilter button").forEach((button) => {
    button.classList.toggle("active", button.dataset.decisionFilter === filters.decisionStatus);
  });

  $("#decisionList").innerHTML = filteredDecisions.length ? filteredDecisions.map((item) => `
    <div class="decision-card ${item.id === state.activeDecisionId ? "active-record" : ""}">
      <strong>${item.stock || "未命名判断"}</strong>
      <span class="tag">${item.status}</span>
      <span class="tag">信心 ${item.confidence}/5</span>
      <span class="tag">检查 ${checklistStats(item.checklist).done}/${checklistStats(item.checklist).total}</span>
      ${item.reviewDate ? `<span class="tag">复盘 ${item.reviewDate}</span>` : ""}
      <p>${item.reason || "还没有写理由。"}</p>
      ${item.resultReview ? `<p><b>验证：</b>${item.resultReview}</p>` : ""}
      <div class="decision-card-actions">
        <button class="text-button" data-load-decision="${item.id}" type="button" aria-label="载入判断记录：${escapeAttr(item.stock || "未命名判断")}" title="载入判断记录">载入</button>
        <button class="danger-button" data-delete-decision="${item.id}" type="button" aria-label="删除判断记录：${escapeAttr(item.stock || "未命名判断")}" title="删除判断记录">删除</button>
      </div>
    </div>
  `).join("") : `<div class="decision-card"><strong>没有匹配的判断</strong><p>调整关键词或筛选状态。</p></div>`;
}

function renderPlan() {
  $("#weekTitle").value = state.weekTitle || "";
  $("#weekGoal").value = state.weekGoal || "";
  $("#weekReflection").value = state.weekReflection || "";
  $("#weekSummary").value = state.weekSummary || "";
  $("#weeklyHistoryCount").textContent = `${state.weeklyHistory.length} 条`;

  $("#taskList").innerHTML = state.tasks.map((task, index) => `
    <div class="task-row">
      <input data-task="${index}" data-field="title" value="${escapeAttr(task.title)}" placeholder="任务名称" />
      <input data-task="${index}" data-field="target" value="${escapeAttr(task.target)}" placeholder="目标" />
      <input data-task="${index}" data-field="priority" value="${escapeAttr(task.priority)}" placeholder="优先级" />
      <button class="danger-button" data-delete-task="${index}" type="button" aria-label="删除任务：${escapeAttr(task.title || "未命名任务")}" title="删除任务">删除</button>
    </div>
  `).join("");

  $("#weeklyHistory").innerHTML = state.weeklyHistory.length ? state.weeklyHistory.slice(0, 8).map((item) => `
    <details class="history-card">
      <summary>${escapeHtml(item.title || "未命名周报")} · ${escapeHtml(item.archivedAt || "")}</summary>
      <pre>${escapeHtml(item.summary || "暂无摘要")}</pre>
    </details>
  `).join("") : `<div class="history-card"><strong>还没有历史周报</strong><p class="meta">归档本周后会出现在这里。</p></div>`;
}

function renderCheckin() {
  const headers = ["任务", ...DAYS, "完成率"];
  const head = headers.map((item) => `<div class="checkin-cell checkin-head">${item}</div>`).join("");
  const rows = state.tasks.map((task, taskIndex) => {
    const done = task.checks.filter(Boolean).length;
    const cells = DAYS.map((day, dayIndex) => `
      <div class="checkin-cell">
        <button class="check-button ${task.checks[dayIndex] ? "done" : ""}" data-task-check="${taskIndex}" data-day="${dayIndex}" type="button" aria-label="${task.checks[dayIndex] ? "取消" : "完成"}${DAYS[dayIndex]}任务：${escapeAttr(task.title || "未命名任务")}" title="${task.checks[dayIndex] ? "取消完成" : "完成任务"}">✓</button>
      </div>
    `).join("");
    return `
      <div class="checkin-cell"><strong>${task.title}</strong><br><span class="meta">${task.target || ""}</span></div>
      ${cells}
      <div class="checkin-cell">${Math.round((done / DAYS.length) * 100)}%</div>
    `;
  }).join("");

  $("#checkinTable").innerHTML = `<div class="checkin-grid">${head}${rows}</div>`;
  $("#journalPrompt").textContent = `${DAYS[state.activeJournalDay]}复盘`;
  $("#journalDayTabs").innerHTML = DAYS.map((day, index) => `
    <button class="journal-tab ${index === state.activeJournalDay ? "active" : ""}" data-journal-day="${index}" type="button" title="打开${day}日记和复盘">${day}</button>
  `).join("");
  $("#lifePromptBank").innerHTML = lifePromptBank.map((item, index) => `
    <button class="prompt-chip" data-life-prompt="${index}" type="button" title="追加到生活日记">${item}</button>
  `).join("");
  $("#lifeJournal").value = state.dailyJournals[state.activeJournalDay] || "";
  const review = state.dailyReviews[state.activeJournalDay] || createEmptyDailyReview();
  $("#dailyMarketRead").value = review.marketRead || "";
  $("#dailyDecisionReview").value = review.decisionReview || "";
  $("#dailyMistake").value = review.mistake || "";
  $("#dailyTomorrow").value = review.tomorrow || "";
  $("#dailySummary").value = review.summary || "";

  const lit = Math.min(3, streak());
  $$("#rewardStage span").forEach((node, index) => node.classList.toggle("lit", index < lit));
}

function syncInputs() {
  bindAutoCollect();
}

function bindAutoCollect() {
  $$("input[data-market], input[data-index], input[data-sector], input[data-task], textarea[data-research-field], input[data-question], textarea[data-question], textarea[data-daily-review]").forEach((node) => {
    node.onchange = () => {
      collectFormState();
      markDirty();
      localBackup();
    };
  });
}

function collectFormState() {
  state.quickNote = readValue("#quickNote", state.quickNote);
  state.marketNote = readValue("#marketNote", state.marketNote);
  state.marketQuestion = readValue("#marketQuestion", state.marketQuestion);
  state.lifeJournal = readValue("#lifeJournal", state.lifeJournal);
  if ($("#lifeJournal")) {
    state.dailyJournals[state.activeJournalDay] = $("#lifeJournal").value;
  }
  collectDailyReview();
  state.weekTitle = readValue("#weekTitle", state.weekTitle);
  state.weekGoal = readValue("#weekGoal", state.weekGoal);
  state.weekReflection = readValue("#weekReflection", state.weekReflection);
  state.weekSummary = readValue("#weekSummary", state.weekSummary);
  collectMarketPulse();
  collectCompanyState();
  collectDecisionDraft();
  collectIndexes();
  collectSectors();
  collectMarketRows();
  collectTasks();
}

function readValue(selector, fallback) {
  const node = $(selector);
  return node ? node.value : fallback;
}

function collectMarketPulse() {
  if (!$("#marketMood")) return;
  state.marketPulse = {
    mood: $("#marketMood").value,
    strength: Number($("#marketStrength").value),
    strongest: $("#strongestSector").value,
    weakest: $("#weakestSector").value,
    volume: $("#volumeSignal").value
  };
}

function collectDailyReview() {
  if (!$("#dailyMarketRead")) return;
  const current = state.dailyReviews[state.activeJournalDay] || createEmptyDailyReview();
  state.dailyReviews[state.activeJournalDay] = {
    ...current,
    marketRead: $("#dailyMarketRead").value,
    decisionReview: $("#dailyDecisionReview").value,
    mistake: $("#dailyMistake").value,
    tomorrow: $("#dailyTomorrow").value,
    summary: $("#dailySummary").value
  };
}

function collectCompanyState() {
  const company = activeCompany();
  if (!company || !$("#companyName")) return;

  company.name = $("#companyName").value;
  company.code = $("#companyCode").value;
  company.industry = $("#companyIndustry").value;
  company.stage = $("#companyStage").value;
  company.sources = $("#companySources").value;
  company.report = $("#companyReport").value;
  company.updatedAt = "刚刚";
  company.fields = company.fields || {};

  $$("textarea[data-research-field]").forEach((textarea) => {
    company.fields[textarea.dataset.researchField] = textarea.value;
  });

  company.customQuestions = $$("[data-question][data-field='q']").map((input) => {
    const index = Number(input.dataset.question);
    const answer = $(`[data-question="${index}"][data-field="a"]`);
    return { q: input.value, a: answer ? answer.value : "" };
  });
}

function collectDecisionDraft() {
  if (!$("#decisionStock")) return;
  state.draftDecision = {
    stock: $("#decisionStock").value,
    confidence: Number($("#confidence").value),
    reviewDate: $("#reviewDate").value,
    reason: $("#decisionReason").value,
    evidence: $("#decisionEvidence").value,
    doubt: $("#decisionDoubt").value,
    risk: $("#decisionRisk").value,
    buyCondition: $("#buyCondition").value,
    dropCondition: $("#dropCondition").value,
    resultReview: $("#resultReview").value,
    checklist: Object.fromEntries(
      decisionChecklistItems.map(([key]) => [key, Boolean($(`[data-decision-check="${key}"]`)?.checked)])
    )
  };
}

function collectMarketRows() {
  $$("input[data-market]").forEach((input) => {
    const row = state.marketRows[Number(input.dataset.market)];
    if (row) row[input.dataset.field] = input.value;
  });
}

function collectIndexes() {
  $$("input[data-index]").forEach((input) => {
    const index = state.indexes[Number(input.dataset.index)];
    if (index) index[input.dataset.field] = input.value;
  });
}

function collectSectors() {
  $$("input[data-sector]").forEach((input) => {
    const sector = state.sectors[Number(input.dataset.sector)];
    if (sector) sector[input.dataset.field] = input.value;
  });
}

function collectTasks() {
  $$("input[data-task]").forEach((input) => {
    const task = state.tasks[Number(input.dataset.task)];
    if (task) task[input.dataset.field] = input.value;
  });
}

function createCompany() {
  collectCompanyState();
  const id = `company-${Date.now()}`;
  state.companies.unshift({
    id,
    name: "新公司",
    code: "",
    industry: "",
    updatedAt: "刚刚",
    stage: "刚开始",
    sources: "",
    report: "",
    fields: Object.fromEntries(researchPrompts.map(([key]) => [key, ""])),
    customQuestions: []
  });
  state.activeCompanyId = id;
  renderResearch();
  markDirty();
}

function createCompanyFromMarketRow(row) {
  if (!row) return;
  collectFormState();
  const stockText = row.stock || "新观察股票";
  const codeMatch = stockText.match(/\b\d{6}\b/);
  const code = codeMatch ? codeMatch[0] : "";
  const name = stockText.replace(code, "").trim() || stockText;
  const existing = state.companies.find((company) => {
    return (code && company.code === code) || company.name === name || company.name === stockText;
  });

  if (existing) {
    state.activeCompanyId = existing.id;
  } else {
    const id = `company-${Date.now()}`;
    state.companies.unshift({
      id,
      name,
      code,
      industry: "",
      updatedAt: "刚刚",
      stage: "刚开始",
      sources: "",
      report: "",
      fields: {
        background: "",
        financing: "",
        revenue: "",
        position: "",
        upside: row.trigger || "",
        risk: row.risk || "",
        summary: `${stockText}：${row.status || "观察"}`
      },
      customQuestions: [
        { q: "这只股票当前被市场关注的核心原因是什么？", a: row.trigger || "" }
      ]
    });
    state.activeCompanyId = id;
  }

  switchSheet("research");
  renderResearch();
  persistState(false, true);
}

function createCompanyFromStockText(stockText) {
  const row = state.marketRows.find((item) => item.stock === stockText) || { stock: stockText };
  createCompanyFromMarketRow(row);
}

function deleteActiveCompany() {
  const company = activeCompany();
  if (!company) return;
  if (!confirmAction(`确认删除公司研究卡：${company.name || "未命名公司"}？`)) return;
  if (state.companies.length <= 1) {
    company.name = "新公司";
    company.code = "";
    company.industry = "";
    company.stage = "刚开始";
    company.sources = "";
    company.report = "";
    company.fields = Object.fromEntries(researchPrompts.map(([key]) => [key, ""]));
    company.customQuestions = [];
    persistState(false, true);
    return;
  }

  state.companies = state.companies.filter((company) => company.id !== state.activeCompanyId);
  state.activeCompanyId = state.companies[0]?.id;
  persistState(false, true);
}

function draftDecisionFromCompany() {
  collectCompanyState();
  const company = activeCompany();
  if (!company) return;
  state.activeDecisionId = null;
  state.decisionStatus = "观察";
  state.draftDecision = {
    ...clone(defaultState.draftDecision),
    stock: `${company.name || "未命名公司"}${company.code ? ` ${company.code}` : ""}`,
    confidence: Math.max(2, Math.round(companyCompletion(company) / 25)),
    reason: [company.fields?.summary, company.fields?.upside].filter(Boolean).join("\n\n"),
    evidence: [company.report, company.sources].filter(Boolean).join("\n\n"),
    risk: company.fields?.risk || "",
    doubt: "还有哪些关键变量没有验证？",
    buyCondition: "上涨逻辑被数据验证，风险可控。",
    dropCondition: "核心逻辑被证伪，或风险超过可承受范围。",
    checklist: {
      understood: Boolean(company.fields?.summary || company.fields?.revenue),
      evidence: Boolean(company.report || company.sources),
      risk: Boolean(company.fields?.risk),
      buyCondition: true,
      dropCondition: true,
      reviewDate: false
    }
  };
  switchSheet("decision");
  renderDecision();
  markDirty();
}

function addQuestion() {
  const company = activeCompany();
  if (!company) return;
  collectCompanyState();
  company.customQuestions.push({ q: "新问题", a: "" });
  renderResearch();
  markDirty();
}

function addResearchPrompt(index) {
  const company = activeCompany();
  const question = researchQuestionBank[index];
  if (!company || !question) return;
  collectCompanyState();
  company.customQuestions.push({ q: question, a: "" });
  renderResearch();
  persistState(false, true);
}

function addDecisionPrompt(index) {
  const item = decisionPromptBank[index];
  if (!item) return;
  collectDecisionDraft();
  const [field, label] = item;
  state.draftDecision[field] = appendBlock(state.draftDecision[field], label);
  renderDecision();
  persistState(false, true);
}

function fillDecisionGap(field) {
  collectDecisionDraft();
  const promptIndex = decisionPromptBank.findIndex(([target]) => target === field);
  if (promptIndex >= 0) {
    addDecisionPrompt(promptIndex);
    return;
  }
  if (field === "stock" && !state.draftDecision.stock) {
    state.draftDecision.stock = "待研究股票";
  }
  if (field === "reviewDate" && !state.draftDecision.reviewDate) {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    state.draftDecision.reviewDate = date.toISOString().slice(0, 10);
    state.draftDecision.checklist = { ...emptyDecisionChecklist, ...(state.draftDecision.checklist || {}), reviewDate: true };
  }
  renderDecision();
  persistState(false, true);
}

function addLifePrompt(index) {
  const prompt = lifePromptBank[index];
  if (!prompt) return;
  collectFormState();
  state.dailyJournals[state.activeJournalDay] = appendBlock(state.dailyJournals[state.activeJournalDay], prompt);
  renderCheckin();
  persistState(false, true);
}

function generateDailyReview() {
  collectFormState();
  const day = state.activeJournalDay;
  const review = state.dailyReviews[day] || createEmptyDailyReview();
  const journal = state.dailyJournals[day] || "";
  review.summary = [
    `# ${DAYS[day]}每日复盘`,
    "",
    `生活日记：${journal || "未记录"}`,
    `市场理解：${review.marketRead || "未记录"}`,
    `判断反思：${review.decisionReview || "未记录"}`,
    `错误 / 偏差：${review.mistake || "未记录"}`,
    `明日行动：${review.tomorrow || "未记录"}`
  ].join("\n");
  state.dailyReviews[day] = review;
  renderCheckin();
  persistState(true, true);
}

function appendBlock(current = "", text = "") {
  const value = String(current || "").trim();
  return value ? `${value}\n\n${text}` : text;
}

function generateCompanyReport() {
  collectCompanyState();
  const company = activeCompany();
  if (!company) return;
  const fields = company.fields || {};
  const questions = (company.customQuestions || [])
    .filter((item) => item.q || item.a)
    .map((item) => `- ${item.q || "未命名问题"}：${item.a || "待回答"}`)
    .join("\n");

  company.report = [
    `# ${company.name || "未命名公司"}${company.code ? ` ${company.code}` : ""}`,
    "",
    `行业：${company.industry || "未填写"}`,
    `研究阶段：${company.stage || "未设置"}`,
    `研究完成度：${companyCompletion(company)}%`,
    "",
    "## 一句话理解",
    fields.summary || "待补充",
    "",
    "## 公司背景",
    fields.background || "待补充",
    "",
    "## 融资逻辑",
    fields.financing || "待补充",
    "",
    "## 靠什么赚钱",
    fields.revenue || "待补充",
    "",
    "## 行业地位",
    fields.position || "待补充",
    "",
    "## 上涨逻辑",
    fields.upside || "待补充",
    "",
    "## 风险",
    fields.risk || "待补充",
    "",
    "## 自定义问题",
    questions || "- 暂无自定义问题",
    "",
    "## 资料来源",
    company.sources || "待补充"
  ].join("\n");

  renderResearch();
  persistState(true, true);
}

function copyCompanyReport() {
  collectCompanyState();
  const report = activeCompany()?.report || "";
  if (!report.trim()) {
    showToastMessage("先生成报告", "warning");
    return;
  }
  copyText(report, "已复制报告");
}

function addTask() {
  collectTasks();
  state.tasks.push({
    id: `task-${Date.now()}`,
    title: "新任务",
    target: "本周",
    priority: "中",
    checks: Array(7).fill(false)
  });
  render();
  markDirty();
}

function addMarketRow() {
  collectMarketRows();
  state.marketRows.push({ stock: "新观察股票", status: "观察", change: "手动", trigger: "", risk: "" });
  renderMarket();
  markDirty();
}

async function generateWeekSummary() {
  collectFormState();
  const stats = taskStats();
  const completedTasks = state.tasks
    .map((task) => {
      const done = task.checks.filter(Boolean).length;
      return `- ${task.title || "未命名任务"}：${done}/7 天，目标 ${task.target || "未设置"}`;
    })
    .join("\n");
  const companies = state.companies
    .slice(0, 5)
    .map((company) => `- ${company.name || "未命名公司"} ${company.code || ""}：${company.stage || "未设置阶段"}，完成度 ${companyCompletion(company)}%`)
    .join("\n");
  const decisions = state.decisions
    .slice(0, 5)
    .map((decision) => `- ${decision.stock || "未命名判断"}：${decision.status || "观察"}，信心 ${decision.confidence || 3}/5${decision.reviewDate ? `，复盘 ${decision.reviewDate}` : ""}`)
    .join("\n");
  const journals = state.dailyJournals
    .map((entry, index) => (entry.trim() ? `- ${DAYS[index]}：${entry.trim()}` : ""))
    .filter(Boolean)
    .join("\n");
  const dailyReviews = state.dailyReviews
    .map((review, index) => {
      const summary = String(review.summary || "").trim();
      if (summary) return `- ${DAYS[index]}：${summary.replace(/\n+/g, " / ")}`;
      const parts = [review.marketRead, review.decisionReview, review.mistake, review.tomorrow].filter(Boolean);
      return parts.length ? `- ${DAYS[index]}：${parts.join(" / ")}` : "";
    })
    .filter(Boolean)
    .join("\n");

  state.weekSummary = [
    `# ${state.weekTitle || "本周复盘"}`,
    "",
    `本周目标：${state.weekGoal || "未设置"}`,
    `任务完成：${stats.done}/${stats.total}，完成率 ${stats.rate}%`,
    "",
    "## 任务打卡",
    completedTasks || "- 暂无任务",
    "",
    "## 公司研究",
    companies || "- 暂无公司研究",
    "",
    "## 反思判断",
    decisions || "- 暂无判断记录",
    "",
    "## 市场记录",
    `市场情绪：${state.marketPulse?.mood || "未记录"}，情绪分 ${state.marketPulse?.strength ?? 0}`,
    `今日市场笔记：${state.marketNote || "未记录"}`,
    `今日问题：${state.marketQuestion || "未记录"}`,
    "",
    "## 生活日记",
    journals || "- 暂无生活日记",
    "",
    "## 每日复盘",
    dailyReviews || "- 暂无每日复盘",
    "",
    "## 我的反思",
    state.weekReflection || "还没有写本周反思。"
  ].join("\n");

  renderPlan();
  await persistState(true, true);
}

function copyWeekSummary() {
  collectFormState();
  if (!String(state.weekSummary || "").trim()) {
    showToastMessage("先生成摘要", "warning");
    return;
  }
  copyText(state.weekSummary, "已复制周报");
}

async function copyText(text, successMessage) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      fallbackCopyText(text);
    }
    showToastMessage(successMessage, "saved");
  } catch {
    showToastMessage("复制失败", "error");
  }
}

function fallbackCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Copy failed");
}

function confirmAction(message) {
  return window.confirm(message);
}

async function archiveCurrentWeek(askConfirm = true) {
  if (askConfirm && !confirmAction("确认归档本周吗？当前任务、日记、判断和公司研究会保存到历史周报。")) return;
  collectFormState();
  if (!state.weekSummary) {
    await generateWeekSummary();
    collectFormState();
  }

  const stats = taskStats();
  state.weeklyHistory.unshift({
    id: `week-${Date.now()}`,
    title: state.weekTitle || "本周复盘",
    goal: state.weekGoal || "",
    summary: state.weekSummary || "",
    reflection: state.weekReflection || "",
    archivedAt: todayISO(),
    taskRate: stats.rate,
    tasks: clone(state.tasks),
    dailyJournals: clone(state.dailyJournals),
    dailyReviews: clone(state.dailyReviews),
    decisions: clone(state.decisions.slice(0, 8)),
    companies: clone(state.companies.slice(0, 8))
  });

  renderPlan();
  await persistState(true, true);
}

async function startNewWeek() {
  if (!confirmAction("确认开启新周吗？当前周会先归档，然后清空本周日记和打卡状态。")) return;
  await archiveCurrentWeek(false);
  const nextNumber = state.weeklyHistory.length + 1;
  state.weekTitle = `第 ${nextNumber} 周`;
  state.weekGoal = "";
  state.weekReflection = "";
  state.weekSummary = "";
  state.dailyJournals = Array(7).fill("");
  state.dailyReviews = Array.from({ length: 7 }, () => createEmptyDailyReview());
  state.activeJournalDay = 0;
  state.tasks = state.tasks.map((task) => ({ ...task, checks: Array(7).fill(false) }));
  render();
  await persistState(true, true);
}

function saveDecision() {
  collectDecisionDraft();
  if (!state.draftDecision.stock && !state.draftDecision.reason && !state.draftDecision.resultReview) {
    showSaved();
    return;
  }

  const payload = {
    id: state.activeDecisionId || `decision-${Date.now()}`,
    status: state.decisionStatus,
    updatedAt: new Date().toISOString(),
    ...state.draftDecision
  };

  if (state.activeDecisionId) {
    state.decisions = state.decisions.map((item) => (item.id === state.activeDecisionId ? payload : item));
  } else {
    state.decisions.unshift(payload);
  }

  clearDecisionDraft(false);
  persistState();
}

function loadDecision(id) {
  const decision = state.decisions.find((item) => item.id === id);
  if (!decision) return;
  state.activeDecisionId = id;
  state.decisionStatus = decision.status || "观察";
  state.draftDecision = { ...clone(defaultState.draftDecision), ...decision };
  renderDecision();
}

function clearDecisionDraft(shouldRender = true) {
  if (shouldRender && !confirmAction("确认清空当前判断草稿吗？")) return;
  state.activeDecisionId = null;
  state.decisionStatus = "观察";
  state.draftDecision = clone(defaultState.draftDecision);
  if (shouldRender) renderDecision();
  markDirty();
}

async function seedData() {
  if (!confirmAction("确认填充示例数据吗？这会覆盖当前浏览器里的手账内容。")) return;
  state = clone(defaultState);
  normalizeState();
  hasUnsavedChanges = false;
  render();
  await persistState(false, true);
  showToastMessage("已重置示例", "saved");
}

function exportState() {
  collectFormState();
  downloadText(`stock-journal-${dateStamp()}.json`, JSON.stringify(state, null, 2), "application/json");
}

function exportMarkdown() {
  collectFormState();
  const stats = taskStats();
  const taskLines = state.tasks.map((task) => {
    const done = task.checks.filter(Boolean).length;
    return `- ${task.title || "未命名任务"}：${done}/7，目标 ${task.target || "未设置"}，优先级 ${task.priority || "未设置"}`;
  });
  const companyLines = state.companies.map((company) => [
    `### ${company.name || "未命名公司"}${company.code ? ` ${company.code}` : ""}`,
    `- 行业：${company.industry || "未填写"}`,
    `- 阶段：${company.stage || "未设置"}`,
    `- 完成度：${companyCompletion(company)}%`,
    `- 一句话理解：${company.fields?.summary || "未记录"}`,
    `- 上涨逻辑：${company.fields?.upside || "未记录"}`,
    `- 风险：${company.fields?.risk || "未记录"}`,
    company.report ? `\n${company.report}` : ""
  ].filter(Boolean).join("\n"));
  const decisionLines = state.decisions.map((decision) => [
    `### ${decision.stock || "未命名判断"}`,
    `- 状态：${decision.status || "观察"}`,
    `- 信心：${decision.confidence || 3}/5`,
    `- 下次复盘：${decision.reviewDate || "未设置"}`,
    `- 为什么：${decision.reason || "未记录"}`,
    `- 关键证据：${decision.evidence || "未记录"}`,
    `- 最大风险：${decision.risk || "未记录"}`,
    `- 买入条件：${decision.buyCondition || "未记录"}`,
    `- 放弃条件：${decision.dropCondition || "未记录"}`,
    `- 验证结果：${decision.resultReview || "未记录"}`
  ].join("\n"));
  const marketRows = state.marketRows.map((row) => {
    return `- ${row.stock || "未命名股票"}：${row.status || "观察"}，涨跌 ${row.change || "未记录"}，触发 ${row.trigger || "未记录"}，风险 ${row.risk || "未记录"}`;
  });
  const dailyReviewLines = DAYS.map((day, index) => {
    const review = state.dailyReviews[index] || createEmptyDailyReview();
    const parts = [
      state.dailyJournals[index] ? `生活日记：${state.dailyJournals[index]}` : "",
      review.marketRead ? `市场理解：${review.marketRead}` : "",
      review.decisionReview ? `判断反思：${review.decisionReview}` : "",
      review.mistake ? `错误/偏差：${review.mistake}` : "",
      review.tomorrow ? `明日行动：${review.tomorrow}` : "",
      review.summary ? `摘要：${review.summary.replace(/\n+/g, " / ")}` : ""
    ].filter(Boolean);
    return parts.length ? `### ${day}\n${parts.map((item) => `- ${item}`).join("\n")}` : "";
  }).filter(Boolean);

  const markdown = [
    `# A 股研究手账导出 ${todayISO()}`,
    "",
    `存储模式：${storageMode}`,
    `本周标题：${state.weekTitle || "未设置"}`,
    `本周目标：${state.weekGoal || "未设置"}`,
    `任务完成：${stats.done}/${stats.total}，完成率 ${stats.rate}%`,
    "",
    "## 本周任务",
    taskLines.join("\n") || "- 暂无任务",
    "",
    "## 行情大屏",
    `- 市场情绪：${state.marketPulse?.mood || "未记录"}`,
    `- 情绪分：${state.marketPulse?.strength ?? 0}`,
    `- 最强方向：${state.marketPulse?.strongest || "未记录"}`,
    `- 最弱方向：${state.marketPulse?.weakest || "未记录"}`,
    `- 量能状态：${state.marketPulse?.volume || "未记录"}`,
    `- 今日市场笔记：${state.marketNote || "未记录"}`,
    `- 今日问题：${state.marketQuestion || "未记录"}`,
    "",
    "### 重点观察股票",
    marketRows.join("\n") || "- 暂无观察股票",
    "",
    "## 公司研究",
    companyLines.join("\n\n") || "- 暂无公司研究",
    "",
    "## 反思判断",
    decisionLines.join("\n\n") || "- 暂无判断记录",
    "",
    "## 每日复盘",
    dailyReviewLines.join("\n\n") || "- 暂无每日复盘",
    "",
    "## 本周反思",
    state.weekReflection || "未记录",
    "",
    "## 本周复盘摘要",
    state.weekSummary || "未生成"
  ].join("\n");

  downloadText(`stock-journal-${dateStamp()}.md`, markdown, "text/markdown");
  showToastMessage("已导出 MD", "saved");
}

function downloadText(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function importState(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      const validationError = validateImportedState(imported);
      if (validationError) {
        showToastMessage(validationError, "error");
        return;
      }
      state = prepareState(imported);
      normalizeState();
      hasUnsavedChanges = false;
      persistState(true, true);
    } catch {
      showToastMessage("导入失败", "error");
    }
  };
  reader.readAsText(file);
}

function escapeAttr(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function bindEvents() {
  $$(".nav-item").forEach((button) => button.addEventListener("click", () => switchSheet(button.dataset.sheet)));
  $$("[data-jump]").forEach((button) => button.addEventListener("click", () => switchSheet(button.dataset.jump)));

  $("#saveButton").addEventListener("click", () => persistState());
  $("#exportButton").addEventListener("click", exportState);
  $("#exportMarkdownButton").addEventListener("click", exportMarkdown);
  $("#importButton").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) importState(file);
    event.target.value = "";
  });
  $("#seedButton").addEventListener("click", seedData);
  $("#addCompany").addEventListener("click", createCompany);
  $("#deleteCompany").addEventListener("click", deleteActiveCompany);
  $("#draftDecisionFromCompany").addEventListener("click", draftDecisionFromCompany);
  $("#generateCompanyReport").addEventListener("click", generateCompanyReport);
  $("#copyCompanyReport").addEventListener("click", copyCompanyReport);
  $("#addQuestion").addEventListener("click", addQuestion);
  $("#addTask").addEventListener("click", addTask);
  $("#generateWeekSummary").addEventListener("click", generateWeekSummary);
  $("#copyWeekSummary").addEventListener("click", copyWeekSummary);
  $("#generateDailyReview").addEventListener("click", generateDailyReview);
  $("#archiveWeek").addEventListener("click", archiveCurrentWeek);
  $("#startNewWeek").addEventListener("click", startNewWeek);
  $("#addMarketRow").addEventListener("click", addMarketRow);
  $("#newDecision").addEventListener("click", saveDecision);
  $("#clearDecision").addEventListener("click", () => clearDecisionDraft());

  $("#marketStrength").addEventListener("input", () => {
    $("#pulseValue").textContent = $("#marketStrength").value;
  });

  $("#companySearch").addEventListener("input", (event) => {
    filters.companyQuery = event.target.value;
    renderResearch();
  });

  $("#decisionSearch").addEventListener("input", (event) => {
    filters.decisionQuery = event.target.value;
    renderDecision();
  });

  $("#decisionFilter").addEventListener("click", (event) => {
    const button = event.target.closest("[data-decision-filter]");
    if (!button) return;
    filters.decisionStatus = button.dataset.decisionFilter;
    renderDecision();
  });

  $("#decisionSegment").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    state.decisionStatus = button.dataset.value;
    renderDecision();
    markDirty();
  });

  window.addEventListener("keydown", (event) => {
    const isSaveShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s";
    if (!isSaveShortcut) return;
    event.preventDefault();
    persistState();
  });

  window.addEventListener("beforeunload", (event) => {
    if (!hasUnsavedChanges) return;
    event.preventDefault();
    event.returnValue = "";
  });

  document.body.addEventListener("input", (event) => {
    const field = event.target.closest("input, textarea");
    if (!field) return;
    if (field.matches("#companySearch, #decisionSearch, #marketStrength, #confidence, #importFile")) return;
    markDirty();
  });

  document.body.addEventListener("click", (event) => {
    const decisionCheck = event.target.closest("[data-decision-check]");
    if (decisionCheck) {
      collectDecisionDraft();
      const stats = checklistStats(state.draftDecision.checklist);
      $("#decisionChecklistRate").textContent = `${stats.done} / ${stats.total}`;
      return;
    }

    const journalDay = event.target.closest("[data-journal-day]");
    if (journalDay) {
      collectFormState();
      state.activeJournalDay = Number(journalDay.dataset.journalDay);
      renderCheckin();
      return;
    }

    const deleteMarket = event.target.closest("[data-delete-market]");
    if (deleteMarket) {
      const index = Number(deleteMarket.dataset.deleteMarket);
      const row = state.marketRows[index];
      if (!confirmAction(`确认删除行情记录：${row?.stock || "观察股票"}？`)) return;
      state.marketRows.splice(index, 1);
      persistState(false, true);
      return;
    }

    const deleteTask = event.target.closest("[data-delete-task]");
    if (deleteTask) {
      const index = Number(deleteTask.dataset.deleteTask);
      const task = state.tasks[index];
      if (!confirmAction(`确认删除任务：${task?.title || "未命名任务"}？`)) return;
      state.tasks.splice(index, 1);
      persistState(false, true);
      return;
    }

    const deleteQuestion = event.target.closest("[data-delete-question]");
    if (deleteQuestion) {
      const company = activeCompany();
      const index = Number(deleteQuestion.dataset.deleteQuestion);
      const question = company?.customQuestions?.[index];
      if (!confirmAction(`确认删除问题：${question?.q || "自定义问题"}？`)) return;
      if (company) company.customQuestions.splice(index, 1);
      persistState(false, true);
      return;
    }

    const deleteDecision = event.target.closest("[data-delete-decision]");
    if (deleteDecision) {
      const decision = state.decisions.find((item) => item.id === deleteDecision.dataset.deleteDecision);
      if (!confirmAction(`确认删除判断记录：${decision?.stock || "未命名判断"}？`)) return;
      state.decisions = state.decisions.filter((item) => item.id !== deleteDecision.dataset.deleteDecision);
      if (state.activeDecisionId === deleteDecision.dataset.deleteDecision) clearDecisionDraft(false);
      persistState(false, true);
      return;
    }

    const loadDecisionButton = event.target.closest("[data-load-decision]");
    if (loadDecisionButton) {
      loadDecision(loadDecisionButton.dataset.loadDecision);
      return;
    }

    const reviewDecisionButton = event.target.closest("[data-review-decision]");
    if (reviewDecisionButton) {
      loadDecision(reviewDecisionButton.dataset.reviewDecision);
      switchSheet("decision");
      return;
    }

    const marketToCompany = event.target.closest("[data-market-to-company]");
    if (marketToCompany) {
      const row = state.marketRows[Number(marketToCompany.dataset.marketToCompany)];
      createCompanyFromMarketRow(row);
      return;
    }

    const watchToCompany = event.target.closest("[data-watch-to-company]");
    if (watchToCompany) {
      createCompanyFromStockText(watchToCompany.dataset.watchToCompany);
      return;
    }

    const overviewCheck = event.target.closest("[data-overview-check]");
    if (overviewCheck) {
      const task = state.tasks[Number(overviewCheck.dataset.overviewCheck)];
      if (task) task.checks[todayIndex()] = !task.checks[todayIndex()];
      persistState(false, true);
      return;
    }

    const openDay = event.target.closest("[data-open-day]");
    if (openDay) {
      collectFormState();
      state.activeJournalDay = Number(openDay.dataset.openDay);
      switchSheet("checkin");
      renderCheckin();
      persistState(false, true);
      return;
    }

    const researchPrompt = event.target.closest("[data-research-prompt]");
    if (researchPrompt) {
      addResearchPrompt(Number(researchPrompt.dataset.researchPrompt));
      return;
    }

    const decisionPrompt = event.target.closest("[data-decision-prompt]");
    if (decisionPrompt) {
      addDecisionPrompt(Number(decisionPrompt.dataset.decisionPrompt));
      return;
    }

    const fillGap = event.target.closest("[data-fill-gap]");
    if (fillGap) {
      fillDecisionGap(fillGap.dataset.fillGap);
      return;
    }

    const lifePrompt = event.target.closest("[data-life-prompt]");
    if (lifePrompt) {
      addLifePrompt(Number(lifePrompt.dataset.lifePrompt));
      return;
    }

    const check = event.target.closest("[data-task-check]");
    if (!check) return;
    const task = state.tasks[Number(check.dataset.taskCheck)];
    const day = Number(check.dataset.day);
    task.checks[day] = !task.checks[day];
    persistState(false);
  });
}

function startParticles() {
  const canvas = $("#particleCanvas");
  const context = canvas.getContext("2d");
  const particles = Array.from({ length: 70 }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: 1 + Math.random() * 2.2,
    speed: 0.12 + Math.random() * 0.38,
    alpha: 0.18 + Math.random() * 0.44
  }));

  function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
  }

  function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((particle) => {
      particle.y -= particle.speed / 1000;
      particle.x += Math.sin(Date.now() / 1800 + particle.y * 8) * 0.00012;
      if (particle.y < -0.04) {
        particle.y = 1.04;
        particle.x = Math.random();
      }

      const x = particle.x * canvas.width;
      const y = particle.y * canvas.height;
      context.beginPath();
      context.fillStyle = `rgba(73, 215, 159, ${particle.alpha})`;
      context.arc(x, y, particle.size * window.devicePixelRatio, 0, Math.PI * 2);
      context.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
}

async function init() {
  await loadState();
  bindEvents();
  render();
  startParticles();
}

init();
