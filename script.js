const agents = {
  mika: {
    id: "mika",
    name: "Mika",
    role: "Planner Agent",
    status: "available",
    area: "Focus Pods",
    task: "次の仕様整理を待機中",
    color: "mika"
  },
  ren: {
    id: "ren",
    name: "Ren",
    role: "Builder Agent",
    status: "focus",
    area: "Review Pods",
    task: "Agent育成UIの実装に集中",
    color: "ren"
  },
  sora: {
    id: "sora",
    name: "Sora",
    role: "QA Agent",
    status: "meeting",
    area: "Review Pods",
    task: "品質レビューで確認待ち",
    color: "sora"
  },
  nagi: {
    id: "nagi",
    name: "Nagi",
    role: "Ops Agent",
    status: "available",
    area: "Cafe",
    task: "運用手順を整理中",
    color: "nagi"
  }
};

const areas = [
  { id: "review", name: "Review Pods", count: 3, detail: "仕様レビュー中 / Private Area" },
  { id: "focus", name: "Focus Pods", count: 2, detail: "深い作業中 / Team desks" },
  { id: "client", name: "Client Room", count: 1, detail: "外部相談 / Locked soon" }
];

const statusText = {
  available: "Available",
  focus: "Focus",
  meeting: "In meeting",
  away: "Away"
};

const state = {
  selected: "mika",
  selfStatus: "available",
  peopleOpen: true,
  simplified: false,
  studio: false,
  mic: true,
  cam: false,
  screen: false,
  reactions: 0,
  taskRuns: 0
};

const q = (selector) => document.querySelector(selector);
const qa = (selector) => [...document.querySelectorAll(selector)];

function selectedAgent() {
  return agents[state.selected];
}

function setToast(message) {
  q("#mapToast").textContent = message;
}

function addMessage(author, text) {
  const p = document.createElement("p");
  const b = document.createElement("b");
  b.textContent = author;
  p.append(b, ` ${text}`);
  q("#messages").append(p);
  q("#messages").scrollTop = q("#messages").scrollHeight;
}

function messageAgent(id) {
  const agent = agents[id];
  state.peopleOpen = true;
  addMessage("You", `${agent.name} にDM: 次のタスクを相談したいです`);
  setToast(`${agent.name} にメッセージしました`);
}

function locateAgent(id) {
  const agent = agents[id];
  setToast(`${agent.name} をマップ上でLocateしました`);
}

function followAgent(id) {
  const agent = agents[id];
  setToast(`${agent.name} をFollow中。移動に追従します`);
}

function renderProfile() {
  const agent = selectedAgent();
  q("#profileName").textContent = agent.name;
  q("#profileMeta").textContent = `${agent.role} / ${statusText[agent.status]}`;
  q("#profileTask").textContent = agent.task;
  q("#profileAvatar").className = `profile-avatar ${agent.status}`;
  q("#roomLabel").textContent = `Agent HQ / ${agent.area}`;
}

function renderMembers() {
  const term = q("#memberSearch").value.trim().toLowerCase();
  const globalTerm = q("#globalSearch").value.trim().toLowerCase();
  const filter = term || globalTerm;
  const list = q("#memberList");
  list.replaceChildren();

  Object.values(agents)
    .filter((agent) => {
      const haystack = `${agent.name} ${agent.role} ${agent.area} ${agent.task}`.toLowerCase();
      return !filter || haystack.includes(filter);
    })
    .forEach((agent) => {
      const row = document.createElement("article");
      row.className = `member-row ${agent.id === state.selected ? "active" : ""}`;
      row.dataset.agent = agent.id;
      row.innerHTML = `
        <button class="member-main" type="button">
          <span class="mini-face ${agent.color}"></span>
          <span><b>${agent.name}</b><small>${agent.role} / ${agent.area}</small></span>
          <i class="status-dot ${agent.status}"></i>
        </button>
        ${agent.id === state.selected ? `
          <div class="row-actions">
            <button type="button" data-member-action="message">Message</button>
            <button type="button" data-member-action="locate">Locate</button>
            <button type="button" data-member-action="follow">Follow</button>
          </div>
        ` : ""}
      `;
      row.querySelector(".member-main").addEventListener("click", () => selectAgent(agent.id, "panel"));
      row.querySelectorAll("[data-member-action]").forEach((button) => {
        button.addEventListener("click", () => {
          if (button.dataset.memberAction === "message") messageAgent(agent.id);
          if (button.dataset.memberAction === "locate") locateAgent(agent.id);
          if (button.dataset.memberAction === "follow") followAgent(agent.id);
          renderControls();
        });
      });
      list.append(row);
    });

  q("#memberCount").textContent = Object.keys(agents).length;
  q("#peopleCount").textContent = Object.values(agents).filter((agent) => agent.status !== "away").length;
  q("#onlineLabel").textContent = `${q("#peopleCount").textContent} online`;
}

function renderAreas() {
  const list = q("#activeAreaList");
  list.replaceChildren();
  areas.forEach((area) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "active-area";
    row.dataset.area = area.name;
    row.innerHTML = `
      <span class="area-icon"></span>
      <span><b>${area.name}</b><small>${area.detail}</small></span>
      <strong>${area.count}</strong>
    `;
    row.addEventListener("click", () => {
      q("#roomLabel").textContent = `Agent HQ / ${area.name}`;
      qa(".area").forEach((node) => node.classList.toggle("active", node.dataset.area === area.name));
      setToast(`${area.name} にカメラを移動しました`);
    });
    list.append(row);
  });
  q("#areaCount").textContent = areas.length;
}

function renderAvatars() {
  qa(".agent-avatar[data-agent]").forEach((avatar) => {
    const id = avatar.dataset.agent;
    const agent = agents[id];
    avatar.classList.toggle("active", id === state.selected);
    avatar.classList.toggle("available", agent.status === "available");
    avatar.classList.toggle("focus", agent.status === "focus");
    avatar.classList.toggle("meeting", agent.status === "meeting");
    avatar.classList.toggle("away", agent.status === "away");
  });
}

function renderControls() {
  q(".app-shell").classList.toggle("people-open", state.peopleOpen);
  q("#participantsPanel").classList.toggle("open", state.peopleOpen);
  q("#peopleBtn").classList.toggle("active", state.peopleOpen);
  q("#micBtn").classList.toggle("active", state.mic);
  q("#camBtn").classList.toggle("active", state.cam);
  q("#screenBtn").classList.toggle("active", state.screen);
  q("#mapSurface").classList.toggle("simplified", state.simplified);
  q("#mapSurface").classList.toggle("studio", state.studio);
  q("#statusBtn").classList.toggle("focus", state.selfStatus === "focus");
  q("#statusBtn").textContent = state.selfStatus === "focus" ? "Focus mode" : "Available";
  q("#selfStatus").textContent = `${statusText[state.selfStatus]} in Agent HQ`;
}

function render() {
  renderProfile();
  renderMembers();
  renderAreas();
  renderAvatars();
  renderControls();
}

function selectAgent(id, source = "map") {
  state.selected = id;
  const agent = selectedAgent();
  setToast(source === "panel" ? `${agent.name} をParticipantsから選択しました` : `${agent.name} のプロフィールを開きました`);
  render();
}

function toggleControl(key, label) {
  state[key] = !state[key];
  setToast(`${label}: ${state[key] ? "on" : "off"}`);
  renderControls();
}

qa(".agent-avatar[data-agent], .desk[data-agent]").forEach((node) => {
  node.addEventListener("click", () => selectAgent(node.dataset.agent));
});

qa(".area").forEach((node) => {
  node.addEventListener("click", () => {
    qa(".area").forEach((area) => area.classList.toggle("active", area === node));
    q("#roomLabel").textContent = `Agent HQ / ${node.dataset.area}`;
    setToast(`${node.dataset.area} を表示しています`);
  });
});

qa(".rail-btn").forEach((button) => {
  button.addEventListener("click", () => {
    qa(".rail-btn").forEach((node) => node.classList.toggle("active", node === button));
    if (button.dataset.view === "chat") state.peopleOpen = true;
    if (button.dataset.view === "studio") state.studio = !state.studio;
    setToast(button.dataset.view === "studio" ? "Build mode: deskや家具を編集できます" : `${button.textContent} view`);
    renderControls();
  });
});

q("#peopleBtn").addEventListener("click", () => {
  state.peopleOpen = !state.peopleOpen;
  setToast(state.peopleOpen ? "Participants Panelを開きました" : "Participants Panelを閉じました");
  renderControls();
});

q("#closePanelBtn").addEventListener("click", () => {
  state.peopleOpen = false;
  renderControls();
});

q("#statusBtn").addEventListener("click", () => {
  state.selfStatus = state.selfStatus === "available" ? "focus" : "available";
  setToast(`Status: ${statusText[state.selfStatus]}`);
  renderControls();
});

q("#simplifyBtn").addEventListener("click", () => {
  state.simplified = !state.simplified;
  setToast(state.simplified ? "Simplified viewで人を見やすくしました" : "Map detailsを表示しました");
  renderControls();
});

q("#micBtn").addEventListener("click", () => toggleControl("mic", "Mic"));
q("#camBtn").addEventListener("click", () => toggleControl("cam", "Cam"));
q("#screenBtn").addEventListener("click", () => toggleControl("screen", "Screen share"));

q("#emojiBtn").addEventListener("click", () => {
  state.reactions += 1;
  setToast(`Reaction sent (${state.reactions})`);
  addMessage("You", "リアクションを送りました");
});

q("#messageBtn").addEventListener("click", () => {
  messageAgent(state.selected);
  renderControls();
});

q("#locateBtn").addEventListener("click", () => {
  locateAgent(state.selected);
});

q("#followBtn").addEventListener("click", () => {
  followAgent(state.selected);
});

q("#waveBtn").addEventListener("click", () => {
  const agent = selectedAgent();
  setToast(`${agent.name} にWave overしました`);
  addMessage("System", `${agent.name} にWaveを送信`);
});

q("#taskBtn").addEventListener("click", () => {
  const agent = selectedAgent();
  state.taskRuns += 1;
  agent.status = "focus";
  agent.task = `タスク#${state.taskRuns} を実行中`;
  setToast(`${agent.name} がタスクを開始しました`);
  render();
});

q("#homeBtn").addEventListener("click", () => {
  q("#youAvatar").style.left = "52%";
  q("#youAvatar").style.top = "50%";
  setToast("自分の位置に戻りました");
});

q("#zoomIn").addEventListener("click", () => setToast("Zoom in"));
q("#zoomOut").addEventListener("click", () => setToast("Zoom out"));
q("#inviteBtn").addEventListener("click", () => setToast("Invite linkをコピーしました"));
q("#lockBtn").addEventListener("click", () => setToast("Review Podsをロックしました"));

q("#mapSurface").addEventListener("dblclick", (event) => {
  const rect = q("#mapSurface").getBoundingClientRect();
  const left = ((event.clientX - rect.left) / rect.width) * 100;
  const top = ((event.clientY - rect.top) / rect.height) * 100;
  q("#youAvatar").style.left = `${Math.max(6, Math.min(90, left))}%`;
  q("#youAvatar").style.top = `${Math.max(8, Math.min(86, top))}%`;
  setToast("Double-clickした場所へ移動しました");
});

q("#memberSearch").addEventListener("input", renderMembers);
q("#globalSearch").addEventListener("input", renderMembers);

q("#composer").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = q("#chatInput");
  const text = input.value.trim();
  if (!text) return;
  addMessage("You", text);
  input.value = "";
  setToast("Room chatに送信しました");
});

render();
