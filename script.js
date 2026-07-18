const agents = {
  mika: { name: "ミカ", role: "Planner Agent", status: "available", plan: 72, build: 48, qa: 64 },
  ren: { name: "レン", role: "Builder Agent", status: "focus", plan: 38, build: 86, qa: 52 },
  sora: { name: "ソラ", role: "QA Agent", status: "review", plan: 55, build: 44, qa: 91 },
  nagi: { name: "ナギ", role: "Ops Agent", status: "available", plan: 46, build: 62, qa: 70 }
};

const state = {
  selected: "mika",
  panel: "staff",
  funds: 12480,
  trust: 82,
  progress: 42,
  delivered: 0,
  trained: 0,
  hired: 0,
  turn: 0
};

const messages = [
  "新規案件「仕様整理」が届きました",
  "レンが実装に集中しています",
  "ソラが品質確認を待っています",
  "ナレッジ資料室に改善メモが追加されました"
];

const statusLabel = {
  available: "空き",
  focus: "集中",
  review: "確認待ち"
};

const q = (selector) => document.querySelector(selector);
const qa = (selector) => [...document.querySelectorAll(selector)];

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function selectedAgent() {
  return agents[state.selected];
}

function updateCounts() {
  const counts = { available: 0, focus: 0, review: 0 };
  Object.values(agents).forEach((agent) => {
    counts[agent.status] += 1;
  });
  q("#availableCount").textContent = counts.available;
  q("#focusCount").textContent = counts.focus;
  q("#reviewCount").textContent = counts.review;
}

function updateHud() {
  q("#fundsLabel").textContent = state.funds.toLocaleString("ja-JP");
  q("#trustLabel").textContent = state.trust;
  q("#qualityLabel").textContent = state.trust >= 90 ? "S" : state.trust >= 78 ? "A" : "B";
  q("#turnLabel").textContent = ["朝", "昼", "夕方", "夜"][state.turn % 4];
  q("#summaryLine").textContent = `納品 ${state.delivered} / 研修 ${state.trained} / 採用 ${state.hired}`;
}

function setTicker(text) {
  const ticker = q("#ticker");
  ticker.textContent = text;
  ticker.animate(
    [{ transform: "translateY(0)" }, { transform: "translateY(-3px)" }, { transform: "translateY(0)" }],
    { duration: 260, easing: "ease-out" }
  );
}

function updatePanel() {
  const agent = selectedAgent();
  q("#panelKind").textContent = state.panel === "staff" ? "社員" :
    state.panel === "projects" ? "案件" :
    state.panel === "research" ? "研究" : "設備";
  q("#panelTitle").textContent = state.panel === "staff" ? agent.name :
    state.panel === "projects" ? "受注ボード" :
    state.panel === "research" ? "研究室" : "オフィス";

  q("#staffCard").classList.toggle("hidden", state.panel === "projects");
  q("#projectCard").classList.toggle("hidden", state.panel !== "projects");

  q("#roleLabel").textContent = `${agent.role} / ${statusLabel[agent.status]}`;
  q("#planValue").textContent = agent.plan;
  q("#buildValue").textContent = agent.build;
  q("#qaValue").textContent = agent.qa;
  q("#planMeter").value = agent.plan;
  q("#buildMeter").value = agent.build;
  q("#qaMeter").value = agent.qa;

  const portrait = q("#portrait");
  portrait.className = `portrait ${agent.status}`;

  q("#projectFill").style.width = `${state.progress}%`;
  q("#projectPercent").textContent = `${state.progress}%`;
  q("#riskLabel").textContent = state.progress > 78 ? "低" : state.trust < 70 ? "中" : "低";
}

function updateAvatars() {
  qa(".avatar").forEach((avatar) => {
    const key = avatar.dataset.agent;
    const agent = agents[key];
    avatar.classList.toggle("active", key === state.selected);
    avatar.classList.toggle("available", agent.status === "available");
    avatar.classList.toggle("focus", agent.status === "focus");
    avatar.classList.toggle("review", agent.status === "review");
  });
}

function render() {
  updateCounts();
  updateHud();
  updatePanel();
  updateAvatars();
}

function selectAgent(key) {
  state.selected = key;
  state.panel = "staff";
  qa(".menu-btn").forEach((button) => button.classList.toggle("active", button.dataset.panel === "staff"));
  setTicker(`${agents[key].name}のデスクを表示しました`);
  render();
}

function setPanel(panel) {
  state.panel = panel;
  qa(".menu-btn").forEach((button) => button.classList.toggle("active", button.dataset.panel === panel));
  if (panel === "projects") setTicker("受注案件の進捗を確認しています");
  if (panel === "research") setTicker("研究室で新しい業務マニュアルを検討中");
  if (panel === "office") setTicker("設備投資で作業効率を上げられます");
  render();
}

function pulse(selector) {
  const el = q(selector);
  el.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }],
    { duration: 320, easing: "ease-out" }
  );
}

function trainAgent() {
  const agent = selectedAgent();
  agent.plan = clamp(agent.plan + 4);
  agent.build = clamp(agent.build + 3);
  agent.qa = clamp(agent.qa + 2);
  state.funds = Math.max(0, state.funds - 280);
  state.trained += 1;
  setTicker(`${agent.name}が研修で成長しました 企画+4 実装+3`);
  pulse(".g1");
  render();
}

function startProject() {
  const agent = selectedAgent();
  agent.status = "focus";
  state.panel = "projects";
  state.progress = clamp(state.progress + Math.round((agent.plan + agent.build) / 24), 0, 100);
  if (state.progress >= 100) {
    state.progress = 18;
    state.trust = clamp(state.trust + 4);
    state.funds += 1560;
    state.delivered += 1;
    setTicker("案件を納品しました 信頼+4 資金+1,560");
    pulse(".big-copy");
  } else {
    setTicker(`${agent.name}が案件を進めました 進捗 ${state.progress}%`);
    pulse(".g3");
  }
  qa(".menu-btn").forEach((button) => button.classList.toggle("active", button.dataset.panel === "projects"));
  render();
}

function reviewQuality() {
  const agent = selectedAgent();
  agent.status = "review";
  state.trust = clamp(state.trust + Math.round(agent.qa / 30));
  state.funds = Math.max(0, state.funds - 120);
  setTicker(`${agent.name}が品質確認に入りました 信頼が上昇`);
  pulse(".b2");
  render();
}

function hireAgent() {
  state.hired += 1;
  state.funds = Math.max(0, state.funds - 800);
  state.trust = clamp(state.trust + 1);
  setTicker("新しいAgent候補を面談しました");
  pulse(".presence");
  render();
}

function walkToDesk() {
  const agent = selectedAgent();
  agent.status = "available";
  setTicker(`${agent.name}が自席に戻りました`);
  pulse(`.avatar[data-agent="${state.selected}"]`);
  render();
}

function tick() {
  state.turn += 1;
  const pool = Object.keys(agents);
  const agent = agents[pool[state.turn % pool.length]];
  if (state.turn % 3 === 0 && agent.status !== "review") agent.status = "focus";
  if (state.turn % 5 === 0) agent.status = "available";
  setTicker(messages[state.turn % messages.length]);
  render();
}

qa(".avatar, .desk").forEach((el) => {
  el.addEventListener("click", () => selectAgent(el.dataset.agent));
});

qa(".menu-btn").forEach((button) => {
  button.addEventListener("click", () => setPanel(button.dataset.panel));
});

q("#trainBtn").addEventListener("click", trainAgent);
q("#projectBtn").addEventListener("click", startProject);
q("#reviewBtn").addEventListener("click", reviewQuality);
q("#hireBtn").addEventListener("click", hireAgent);
q("#walkBtn").addEventListener("click", walkToDesk);

render();
window.setInterval(tick, 9000);
