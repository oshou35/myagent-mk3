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
  peopleOpen: window.innerWidth > 820,
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

function drawPixelMap() {
  const canvas = q("#pixelMap");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, w, h);

  const solid = (x, y, width, height, fill) => {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, width, height);
  };
  const rect = (x, y, width, height, fill, stroke = "#5e6f7c", inset = 4) => {
    ctx.fillStyle = stroke;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = fill;
    ctx.fillRect(x + inset, y + inset, width - inset * 2, height - inset * 2);
  };
  const label = (text, x, y, width) => {
    solid(x, y, width, 16, "rgba(255,255,255,.78)");
    solid(x + 2, y + 14, width - 4, 2, "rgba(210,210,210,.8)");
    ctx.fillStyle = "#7d8494";
    ctx.font = "10px sans-serif";
    ctx.fillText(text, x + 8, y + 11);
  };
  const dashRect = (x, y, width, height, color) => {
    ctx.fillStyle = color;
    for (let i = 0; i < width; i += 14) {
      ctx.fillRect(x + i, y, 8, 3);
      ctx.fillRect(x + i, y + height - 3, 8, 3);
    }
    for (let i = 0; i < height; i += 14) {
      ctx.fillRect(x, y + i, 3, 8);
      ctx.fillRect(x + width - 3, y + i, 3, 8);
    }
  };
  const floor = (x, y, width, height, a, b, line = "#e8cfae") => {
    for (let yy = y; yy < y + height; yy += 12) {
      for (let xx = x; xx < x + width; xx += 24) {
        ctx.fillStyle = ((xx - x) / 24 + (yy - y) / 12) % 2 ? a : b;
        ctx.fillRect(xx, yy, 24, 12);
      }
    }
    ctx.fillStyle = line;
    for (let yy = y; yy < y + height; yy += 12) ctx.fillRect(x, yy, width, 1);
    for (let xx = x; xx < x + width; xx += 24) ctx.fillRect(xx, y, 1, height);
  };
  const wall = (x, y, width, height, fill = "#9a737f") => {
    solid(x, y, width, height, "#61717e");
    solid(x + 2, y + 2, width - 4, height - 4, fill);
    solid(x + 2, y + height - 4, width - 4, 2, "#50606b");
  };
  const windowBlock = (x, y, width = 44) => {
    rect(x, y, width, 24, "#8fd9f2", "#50606b", 3);
    solid(x + width / 2 - 1, y + 3, 2, 18, "#50606b");
    solid(x + 3, y + 11, width - 6, 2, "#50606b");
    solid(x + 5, y + 4, 9, 5, "#d3f6ff");
  };
  const desk = (x, y, color = "#f8f7ef") => {
    rect(x, y, 72, 34, color, "#6b7480", 3);
    solid(x + 3, y + 29, 66, 3, "#d9d8d2");
    rect(x + 12, y - 15, 22, 15, "#2d9cc2", "#253148", 3);
    rect(x + 41, y - 12, 18, 12, "#4a86c8", "#253148", 2);
    solid(x + 8, y + 12, 18, 5, "#2f5c84");
    solid(x + 30, y + 13, 22, 4, "#837b6b");
    solid(x + 56, y + 10, 7, 10, "#6bc37a");
  };
  const chair = (x, y, color = "#aebbd4") => rect(x, y, 15, 13, color, "#253148");
  const officeChair = (x, y, color = "#30324d") => {
    rect(x, y, 16, 18, color, "#25283a", 2);
    solid(x + 3, y + 16, 10, 7, "#25283a");
  };
  const plant = (x, y) => {
    rect(x + 9, y + 25, 14, 18, "#c97754", "#7a4d35", 2);
    solid(x + 4, y + 10, 25, 14, "#2fbf68");
    solid(x + 13, y + 1, 25, 16, "#62df92");
    solid(x + 18, y + 17, 18, 14, "#45c577");
    solid(x, y + 19, 16, 12, "#58d887");
  };
  const bookshelf = (x, y, width = 52, height = 38) => {
    rect(x, y, width, height, "#5c4e5f", "#445161", 3);
    for (let row = 0; row < 3; row += 1) {
      solid(x + 5, y + 8 + row * 9, width - 10, 2, "#2b3042");
      for (let col = 0; col < 8; col += 1) {
        const colors = ["#4e7cd8", "#f0c35b", "#d86c78", "#59bd7d", "#ded7ca"];
        solid(x + 7 + col * 5, y + 4 + row * 9, 3, 8, colors[(row + col) % colors.length]);
      }
    }
  };
  const couch = (x, y, width = 72, color = "#ebb88d") => {
    rect(x, y, width, 28, color, "#b67b62", 3);
    solid(x + 6, y + 7, width - 12, 4, "#f1c6a2");
    solid(x + 6, y + 23, width - 12, 6, "#bc765b");
  };
  const roundTable = (x, y) => {
    solid(x + 12, y + 6, 30, 4, "#865b36");
    rect(x, y, 52, 32, "#e5b478", "#9b653f", 3);
    solid(x + 23, y + 12, 8, 8, "#8d57b8");
  };
  const waterCooler = (x, y) => {
    rect(x, y + 16, 18, 26, "#4d5a6e", "#31384a", 2);
    rect(x + 2, y, 14, 18, "#8dddf2", "#53606e", 2);
  };
  const avatar = (x, y, shirt, hair = "#2b2637") => {
    solid(x + 6, y + 1, 14, 5, hair);
    solid(x + 4, y + 6, 18, 14, "#e7b37f");
    solid(x + 2, y + 8, 4, 11, hair);
    solid(x + 20, y + 8, 4, 11, hair);
    solid(x + 6, y + 20, 16, 20, shirt);
    solid(x + 3, y + 24, 4, 12, "#2b3045");
    solid(x + 22, y + 24, 4, 12, "#2b3045");
    solid(x + 7, y + 40, 5, 5, "#2b3045");
    solid(x + 18, y + 40, 5, 5, "#2b3045");
  };
  const tree = (x, y) => {
    solid(x + 22, y + 44, 14, 28, "#8d6339");
    solid(x + 7, y + 18, 42, 30, "#6ed081");
    solid(x + 20, y, 45, 36, "#7fda8d");
    solid(x, y + 34, 34, 26, "#5fc477");
    solid(x + 34, y + 34, 34, 26, "#62c97a");
    solid(x + 28, y + 24, 20, 14, "#98ec9e");
  };

  floor(0, 0, w, h, "#f5dfbf", "#f1d6ae", "#e4c498");
  solid(0, 0, 78, h, "#d5ecd2");
  tree(0, 22);
  tree(12, 340);
  tree(8, 232);
  solid(78, 0, 8, h, "#7f8e78");

  rect(84, 24, 214, 150, "#8fac74", "#68785d", 5);
  rect(84, 190, 154, 142, "#a6bbc0", "#657181", 5);
  rect(84, 346, 184, 126, "#9a91c9", "#706da0", 5);
  rect(304, 80, 244, 150, "#a6aeb4", "#6e7883", 5);
  rect(560, 92, 94, 134, "#d0a05f", "#8c5b38", 5);
  rect(472, 286, 166, 116, "#91aa68", "#657946", 5);
  rect(318, 288, 132, 108, "#9f91d0", "#756ca7", 5);
  rect(356, 406, 176, 70, "#d7e4ed", "#8795a2", 5);

  wall(82, 0, 452, 14, "#9a737f");
  wall(82, 172, 468, 12, "#9a737f");
  wall(296, 0, 12, 184, "#9a737f");
  wall(548, 78, 12, 154, "#9a737f");
  wall(452, 230, 12, 246, "#9a737f");
  wall(82, 332, 188, 12, "#9a737f");
  wall(238, 332, 12, 148, "#9a737f");
  wall(532, 402, 12, 78, "#9a737f");

  windowBlock(108, 428, 74);
  windowBlock(190, 428, 58);
  windowBlock(590, 118, 48);
  windowBlock(374, 422, 60);
  label("Product team", 356, 70, 100);
  label("Focus Pods", 112, 48, 92);
  label("Lobby", 108, 202, 50);
  label("CX team", 552, 236, 78);
  label("Agent Studio", 334, 276, 94);

  dashRect(104, 70, 176, 88, "rgba(255,255,255,.78)");
  dashRect(324, 104, 196, 102, "rgba(255,255,255,.78)");
  dashRect(488, 302, 130, 80, "rgba(255,255,255,.78)");

  desk(336, 118);
  desk(414, 118);
  desk(318, 168);
  desk(402, 168);
  desk(498, 312);
  desk(560, 312);
  desk(122, 88, "#f5eee1");
  desk(196, 88, "#f5eee1");
  desk(126, 258, "#d89b5f");
  officeChair(352, 152);
  officeChair(430, 152);
  officeChair(330, 202);
  officeChair(414, 202);
  officeChair(515, 345);
  officeChair(575, 345);
  officeChair(150, 122);
  officeChair(224, 122);

  rect(126, 214, 68, 28, "#345f97", "#253148", 3);
  roundTable(174, 222);
  couch(572, 250, 64);
  roundTable(600, 286);
  couch(328, 330, 78, "#efb575");
  couch(382, 348, 70, "#eaa96e");
  rect(492, 346, 92, 30, "#7168b0", "#253148", 3);
  rect(358, 436, 94, 26, "#59b1c8", "#253148", 3);
  rect(466, 430, 52, 32, "#f5f2e5", "#687382", 3);
  solid(478, 445, 30, 3, "#253148");

  bookshelf(104, 268, 52, 42);
  bookshelf(588, 150, 44, 42);
  waterCooler(520, 420);
  waterCooler(602, 42);
  rect(516, 38, 32, 32, "#647080", "#424d5b", 3);
  rect(478, 40, 34, 28, "#6a596f", "#424d5b", 3);
  rect(300, 32, 40, 44, "#48606e", "#33404b", 3);
  rect(96, 18, 58, 30, "#d49a60", "#9b653f", 3);
  rect(168, 22, 38, 42, "#606c9a", "#445161", 3);
  rect(240, 352, 50, 36, "#40495a", "#2b3140", 3);
  rect(288, 356, 48, 36, "#b78555", "#694631", 3);
  rect(362, 246, 78, 28, "#f5f2e5", "#687382", 3);
  solid(374, 258, 52, 4, "#253148");

  plant(72, 52);
  plant(446, 96);
  plant(472, 248);
  plant(620, 180);
  plant(310, 322);
  plant(524, 262);
  plant(610, 24);

  avatar(594, 336, "#e3b047", "#805b38");
  avatar(128, 284, "#4aa3bd");

  solid(246, 206, 28, 7, "rgba(36, 39, 68, .25)");
  solid(384, 228, 38, 8, "rgba(36, 39, 68, .22)");
  solid(526, 382, 42, 8, "rgba(36, 39, 68, .22)");
}

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

drawPixelMap();
render();
