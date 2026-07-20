const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const TILE = 32;
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const colors = {
  ink: "#161018",
  grass: "#68d15b",
  grassDark: "#3aa256",
  grassLight: "#8be070",
  path: "#f3dfaa",
  pathDark: "#d2b678",
  water: "#39b8e6",
  waterDark: "#2178b5",
  wall: "#b35e34",
  wallDark: "#623222",
  floor: "#cfe8ed",
  floorDot: "#9ecad3",
  wood: "#db9c4a",
  woodDark: "#8e5432",
  carpet: "#b7439a",
  carpetDark: "#7f2b75",
  white: "#fff8df",
  gray: "#8b91a0",
  grayDark: "#4b5160",
  blue: "#2878d5",
  green: "#30bf64",
  yellow: "#f6d44c",
  red: "#e64b45",
  frameDark: "#15142a"
};

const agents = [
  {
    id: "mika",
    name: "Mika",
    role: "Planner",
    x: 206,
    y: 438,
    hair: "#2b2b45",
    clothes: "#2f8fed",
    message: "要件を案件札に分解します。mk2の run plan first を、社内の受付フローに変えました。",
    stats: ["整理+3", "見積+2", "未決を可視化"]
  },
  {
    id: "ren",
    name: "Ren",
    role: "Builder",
    x: 474,
    y: 250,
    hair: "#75462d",
    clothes: "#32b766",
    message: "workflowを作業ラインとして回します。実装は小さく刻んで、検証室へ流します。",
    stats: ["実装+4", "速度+2", "Codex委託"]
  },
  {
    id: "sora",
    name: "Sora",
    role: "QA",
    x: 706,
    y: 246,
    hair: "#b94835",
    clothes: "#f08a32",
    message: "verificationを品質検査室にしました。完走証拠がない案件は納品箱に入れません。",
    stats: ["品質+4", "安全+2", "証拠確認"]
  },
  {
    id: "nagi",
    name: "Nagi",
    role: "Archivist",
    x: 290,
    y: 216,
    hair: "#5a4d90",
    clothes: "#5f72d8",
    message: "knowledgeは資料室で増やします。使い捨ての知見を、再利用できる本棚へ昇格します。",
    stats: ["知識+4", "検索+2", "昇格候補"]
  }
];

const facilities = [
  {
    id: "board",
    name: "案件掲示板",
    x: 70,
    y: 354,
    w: 126,
    h: 80,
    message: "mk2の tasks/queue を、受注待ち・作業中・社長確認・納品済みの案件札に置き換えます。",
    stats: ["未対応3", "社長確認1", "炎上0"]
  },
  {
    id: "library",
    name: "資料室",
    x: 122,
    y: 118,
    w: 208,
    h: 136,
    message: "knowledgeとreportsを本棚にします。product knowledge不足は、空き棚として見せます。",
    stats: ["原則8", "日報17", "週報2"]
  },
  {
    id: "dev",
    name: "作業ライン",
    x: 386,
    y: 118,
    w: 256,
    h: 184,
    message: "workflow 17本を部署のラインとして表現します。collect → design → implement → verify を部屋の流れにします。",
    stats: ["workflow17", "procedure40", "稼働2"]
  },
  {
    id: "qa",
    name: "品質検査室",
    x: 690,
    y: 118,
    w: 202,
    h: 184,
    message: "verificationは最後の関所です。テスト・lint・ブラウザ確認を通った案件だけが納品になります。",
    stats: ["検査中1", "差戻し0", "証跡あり"]
  },
  {
    id: "control",
    name: "管制室",
    x: 350,
    y: 374,
    w: 254,
    h: 148,
    message: "queue runnerを管制盤として見せます。止まっている時は赤ランプ、動いている時はベルトが流れます。",
    stats: ["pending0", "running0", "hold0"]
  },
  {
    id: "president",
    name: "社長室",
    x: 662,
    y: 370,
    w: 224,
    h: 152,
    message: "外部影響・push・投稿・本番操作は社長確認に止めます。ゲーム化しても安全情報は隠しません。",
    stats: ["承認待ち", "安全+5", "信頼B+"]
  }
];

const commandMessages = {
  hq: {
    title: "本社フロア",
    text: "mk3はmk2に接続せず、学びだけを独立データモデルに変換します。社員・案件・施設・決算でAgent会社を育てます。",
    stats: ["独立運用", "接続なし", "RPG画面"]
  },
  jobs: {
    title: "案件モード",
    text: "タスクは案件札になります。状態は受注待ち、作業中、社長確認、炎上対応、納品済みで表します。",
    stats: ["未対応3", "作業中2", "納品5"]
  },
  agents: {
    title: "社員育成",
    text: "Agentは速度・品質・調査力・安全意識・知識量を持つ社員です。作業とレビューで経験値が入ります。",
    stats: ["速度", "品質", "安全"]
  },
  facilities: {
    title: "施設強化",
    text: "workflowは作業ライン、procedureはマニュアル棚、verificationは品質検査室、knowledgeは資料室として育てます。",
    stats: ["設備Lv1", "資料棚+1", "検査室+1"]
  },
  reports: {
    title: "決算レポート",
    text: "daily/weekly/monthly reportsは決算室で読みます。繰り返す失敗は改善クエストとして掲示板に戻します。",
    stats: ["日報17", "週報2", "月報1"]
  }
};

const hero = { x: 540, y: 430 };
const popups = [
  { x: 512, y: 186, text: "実装+4", life: 150 },
  { x: 730, y: 188, text: "品質+2", life: 120 },
  { x: 260, y: 162, text: "知識+1", life: 180 }
];
let selectedId = "hq";
let tick = 0;

function fill(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function stroke(x, y, w, h, color = colors.ink, size = 4) {
  fill(x, y, w, size, color);
  fill(x, y + h - size, w, size, color);
  fill(x, y, size, h, color);
  fill(x + w - size, y, size, h, color);
}

function label(text, x, y, bg = colors.white) {
  ctx.font = "bold 14px monospace";
  const width = Math.ceil(ctx.measureText(text).width) + 14;
  fill(x, y, width, 24, colors.ink);
  fill(x + 3, y + 3, width - 6, 18, bg);
  ctx.fillStyle = colors.ink;
  ctx.fillText(text, x + 7, y + 17);
}

function tileGrass(x, y) {
  fill(x, y, TILE, TILE, colors.grass);
  fill(x + 7, y + 7, 4, 4, colors.grassDark);
  fill(x + 23, y + 15, 3, 3, colors.grassDark);
  fill(x + 15, y + 25, 3, 3, colors.grassLight);
}

function tilePath(x, y) {
  fill(x, y, TILE, TILE, colors.path);
  fill(x + 2, y + 9, 14, 3, colors.pathDark);
  fill(x + 18, y + 20, 12, 3, colors.pathDark);
  fill(x + 4, y + 28, 10, 2, colors.pathDark);
}

function tileFloor(x, y) {
  fill(x, y, TILE, TILE, colors.floor);
  fill(x + 8, y + 8, 4, 4, colors.floorDot);
  fill(x + 23, y + 21, 4, 4, colors.floorDot);
}

function tileWood(x, y) {
  fill(x, y, TILE, TILE, colors.wood);
  fill(x, y + 13, TILE, 3, colors.woodDark);
  fill(x + 15, y, 3, TILE, colors.woodDark);
}

function tileCarpet(x, y) {
  fill(x, y, TILE, TILE, colors.carpet);
  fill(x + 4, y + 4, 4, 4, colors.carpetDark);
  fill(x + 18, y + 14, 4, 4, "#d159b0");
  fill(x + 10, y + 25, 5, 4, colors.carpetDark);
}

function drawGround() {
  for (let y = 0; y < HEIGHT; y += TILE) {
    for (let x = 0; x < WIDTH; x += TILE) tileGrass(x, y);
  }

  for (let x = 0; x < WIDTH; x += TILE) tilePath(x, 320);
  for (let y = 0; y < HEIGHT; y += TILE) tilePath(320, y);
  for (let y = 256; y < 608; y += TILE) tilePath(608, y);

  for (let y = 96; y < 544; y += TILE) {
    for (let x = 64; x < 896; x += TILE) tileFloor(x, y);
  }
  for (let y = 128; y < 288; y += TILE) {
    for (let x = 384; x < 640; x += TILE) tileCarpet(x, y);
  }
  for (let y = 352; y < 544; y += TILE) {
    for (let x = 640; x < 896; x += TILE) tileWood(x, y);
  }
}

function drawBrickWall(x, y, w, h) {
  fill(x, y, w, h, colors.wall);
  for (let yy = y; yy < y + h; yy += 16) {
    fill(x, yy + 13, w, 3, colors.wallDark);
    for (let xx = x + ((yy / 16) % 2 ? 0 : 16); xx < x + w; xx += 32) {
      fill(xx, yy, 3, 16, colors.wallDark);
    }
  }
  stroke(x, y, w, h, colors.ink, 3);
}

function drawRoom(x, y, w, h, name, floorType = "floor") {
  const tile = floorType === "wood" ? tileWood : floorType === "carpet" ? tileCarpet : tileFloor;
  drawBrickWall(x - 10, y - 34, w + 20, 38);
  stroke(x - 12, y - 36, w + 24, h + 48, colors.ink, 4);
  for (let yy = y; yy < y + h; yy += TILE) {
    for (let xx = x; xx < x + w; xx += TILE) tile(xx, yy);
  }
  label(name, x + 8, y - 27, colors.path);
}

function drawTree(x, y) {
  fill(x + 12, y + 34, 12, 18, colors.woodDark);
  fill(x, y + 12, 42, 28, colors.grassDark);
  fill(x + 6, y, 32, 24, colors.grassLight);
  stroke(x, y + 12, 42, 28, colors.ink, 3);
}

function drawDesk(x, y, monitor = true) {
  fill(x, y + 18, 78, 34, colors.ink);
  fill(x + 5, y + 23, 68, 24, "#efb45f");
  fill(x + 18, y + 47, 10, 20, colors.grayDark);
  fill(x + 52, y + 47, 10, 20, colors.grayDark);
  if (monitor) {
    fill(x + 12, y, 30, 22, colors.ink);
    fill(x + 17, y + 5, 20, 12, "#65d7f2");
    fill(x + 46, y + 9, 18, 10, "#597ed8");
  }
  fill(x + 55, y + 30, 8, 10, colors.green);
}

function drawBookshelf(x, y) {
  fill(x, y, 80, 58, colors.ink);
  fill(x + 5, y + 5, 70, 48, "#6d4355");
  for (let i = 0; i < 8; i += 1) {
    fill(x + 10 + i * 8, y + 10, 5, 34, ["#f6d44c", "#2c96d1", "#e64b45", "#31bd65"][i % 4]);
  }
  fill(x + 8, y + 28, 64, 4, colors.ink);
}

function drawBoard(x, y) {
  fill(x, y, 112, 76, colors.ink);
  fill(x + 6, y + 6, 100, 64, "#f6d575");
  fill(x + 14, y + 18, 32, 12, colors.red);
  fill(x + 54, y + 18, 34, 12, colors.blue);
  fill(x + 14, y + 42, 72, 9, colors.green);
}

function drawMachine(x, y) {
  fill(x, y, 88, 80, colors.ink);
  fill(x + 6, y + 6, 76, 68, colors.gray);
  fill(x + 14, y + 14, 32, 22, "#65d7f2");
  fill(x + 52, y + 16, 18, 18, colors.red);
  fill(x + 18, y + 48, 50, 8, colors.frameDark);
  fill(x + 14, y + 62, 14, 8, colors.green);
  fill(x + 34, y + 62, 14, 8, colors.yellow);
  fill(x + 54, y + 62, 14, 8, colors.red);
}

function drawChest(x, y) {
  fill(x, y + 12, 56, 36, colors.ink);
  fill(x + 5, y + 17, 46, 26, colors.red);
  fill(x + 5, y + 17, 46, 9, colors.yellow);
  fill(x + 23, y + 25, 10, 10, colors.white);
}

function drawFurniture() {
  drawRoom(96, 128, 242, 146, "資料室");
  drawRoom(382, 128, 274, 178, "作業ライン", "carpet");
  drawRoom(684, 128, 214, 178, "品質検査");
  drawRoom(64, 380, 214, 162, "受付");
  drawRoom(352, 386, 258, 142, "管制室");
  drawRoom(660, 384, 236, 150, "社長室", "wood");

  drawBookshelf(130, 158);
  drawBookshelf(222, 158);
  drawDesk(414, 174);
  drawDesk(524, 174);
  drawDesk(414, 242);
  drawDesk(524, 242);
  drawDesk(716, 174);
  drawBoard(76, 400);
  drawMachine(406, 420);
  drawMachine(506, 420);
  drawDesk(710, 438, false);
  drawChest(808, 438);

  drawTree(18, 34);
  drawTree(70, 34);
  drawTree(850, 36);
  drawTree(26, 552);
  drawTree(876, 548);

  label("社長確認", 708, 388, colors.white);
  label("queue", 430, 390, colors.white);
  label("jobs", 84, 374, colors.white);
}

function drawAgent(agent) {
  const walk = Math.floor(tick / 24) % 2;
  fill(agent.x - 13, agent.y - 24, 26, 8, colors.ink);
  fill(agent.x - 11, agent.y - 28, 22, 16, agent.hair);
  fill(agent.x - 12, agent.y - 16, 24, 18, "#f2b27a");
  fill(agent.x - 15, agent.y + 1, 30, 26, colors.ink);
  fill(agent.x - 11, agent.y + 5, 22, 18, agent.clothes);
  fill(agent.x - 17, agent.y + 8, 7, 14, "#f2b27a");
  fill(agent.x + 10, agent.y + 8, 7, 14, "#f2b27a");
  fill(agent.x - 10, agent.y + 27, 7, 13 + walk * 3, colors.ink);
  fill(agent.x + 3, agent.y + 27, 7, 13 - walk * 3, colors.ink);
  label(agent.name, agent.x - 24, agent.y + 42, colors.white);
}

function drawHero() {
  const bob = Math.floor(tick / 20) % 2;
  fill(hero.x - 14, hero.y - 28, 28, 16, "#4c342f");
  fill(hero.x - 12, hero.y - 18, 24, 18, "#f0b27d");
  fill(hero.x - 15, hero.y, 30, 26, colors.ink);
  fill(hero.x - 10, hero.y + 4, 20, 18, "#2f7fe8");
  fill(hero.x - 10, hero.y + 26, 8, 13 + bob * 2, colors.ink);
  fill(hero.x + 2, hero.y + 26, 8, 13 - bob * 2, colors.ink);
  label("社長", hero.x - 24, hero.y + 42, colors.yellow);
}

function drawSpeech(x, y, text) {
  ctx.font = "bold 15px monospace";
  const w = Math.ceil(ctx.measureText(text).width) + 18;
  fill(x, y, w, 28, colors.ink);
  fill(x + 3, y + 3, w - 6, 20, colors.white);
  fill(x + 16, y + 24, 8, 8, colors.white);
  ctx.fillStyle = colors.ink;
  ctx.fillText(text, x + 9, y + 19);
}

function drawPopups() {
  popups.forEach((popup) => {
    const lift = (180 - popup.life) * 0.08;
    ctx.font = "bold 18px monospace";
    const w = Math.ceil(ctx.measureText(popup.text).width) + 10;
    fill(popup.x, popup.y - lift, w, 24, colors.ink);
    fill(popup.x + 3, popup.y + 3 - lift, w - 6, 18, colors.yellow);
    ctx.fillStyle = colors.blue;
    ctx.fillText(popup.text, popup.x + 6, popup.y + 18 - lift);
    popup.life -= 1;
    if (popup.life <= 0) popup.life = 180;
  });
}

function drawPortrait(color = "#2f7fe8", hair = "#4c342f") {
  const portrait = document.querySelector("#portrait");
  portrait.style.background = `
    linear-gradient(transparent 0 100%),
    ${colors.grass}
  `;
  portrait.innerHTML = "";
  const art = document.createElement("div");
  art.className = "portrait-art";
  art.style.cssText = `
    width:100%;height:100%;image-rendering:pixelated;
    background:
      linear-gradient(${hair}, ${hair}) 23px 10px / 26px 16px no-repeat,
      linear-gradient(#f0b27d, #f0b27d) 20px 24px / 32px 18px no-repeat,
      linear-gradient(${colors.ink}, ${colors.ink}) 17px 42px / 38px 24px no-repeat,
      linear-gradient(${color}, ${color}) 22px 46px / 28px 16px no-repeat;
  `;
  portrait.appendChild(art);
}

function drawSelection() {
  const hot = [...facilities, ...agents].find((item) => item.id === selectedId);
  if (!hot) return;
  const x = hot.w ? hot.x - 6 : hot.x - 34;
  const y = hot.w ? hot.y - 6 : hot.y - 52;
  const w = hot.w ? hot.w + 12 : 68;
  const h = hot.w ? hot.h + 12 : 116;
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = colors.white;
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
}

function renderMap() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawGround();
  drawFurniture();
  drawSpeech(448, 110, "作業中");
  drawSpeech(705, 108, "検査OK");
  drawSpeech(90, 344, "新規3件");
  agents.forEach(drawAgent);
  drawHero();
  drawSelection();
  drawPopups();
  tick += 1;
  requestAnimationFrame(renderMap);
}

function setDialog({ title, text, stats }, portraitColor, hairColor) {
  document.querySelector("#dialogTitle").textContent = title;
  document.querySelector("#dialogText").textContent = text;
  const statLine = document.querySelector("#statLine");
  statLine.replaceChildren(...stats.map((stat) => {
    const span = document.createElement("span");
    span.textContent = stat;
    return span;
  }));
  drawPortrait(portraitColor, hairColor);
}

function selectAgent(agent) {
  selectedId = agent.id;
  setDialog({
    title: `${agent.name} / ${agent.role}`,
    text: agent.message,
    stats: agent.stats
  }, agent.clothes, agent.hair);
  popups.push({ x: agent.x + 22, y: agent.y - 44, text: "相談", life: 130 });
}

function selectFacility(facility) {
  selectedId = facility.id;
  setDialog({
    title: facility.name,
    text: facility.message,
    stats: facility.stats
  }, "#f6d44c", "#4c342f");
  popups.push({ x: facility.x + 24, y: facility.y - 16, text: "確認", life: 140 });
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const source = event.touches?.[0] || event;
  return {
    x: ((source.clientX - rect.left) / rect.width) * WIDTH,
    y: ((source.clientY - rect.top) / rect.height) * HEIGHT
  };
}

function hitTest(point) {
  const agent = agents.find((item) => Math.abs(point.x - item.x) < 36 && Math.abs(point.y - item.y) < 64);
  if (agent) return { type: "agent", item: agent };
  const facility = facilities.find((item) => (
    point.x >= item.x && point.x <= item.x + item.w && point.y >= item.y && point.y <= item.y + item.h
  ));
  if (facility) return { type: "facility", item: facility };
  return null;
}

function handleField(event) {
  const point = canvasPoint(event);
  const hit = hitTest(point);
  if (hit?.type === "agent") {
    selectAgent(hit.item);
    return;
  }
  if (hit?.type === "facility") {
    selectFacility(hit.item);
    return;
  }
  hero.x = Math.max(40, Math.min(WIDTH - 40, point.x));
  hero.y = Math.max(80, Math.min(HEIGHT - 80, point.y));
  selectedId = "";
  setDialog({
    title: "社長が移動しました",
    text: "空き床をクリックすると社長キャラが移動します。次は施設や社員をクリックして、mk2の学びをゲーム内概念として確認できます。",
    stats: ["移動", "探索", "マップ確認"]
  }, "#2f7fe8", "#4c342f");
}

document.querySelectorAll(".command").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".command").forEach((node) => node.classList.toggle("active", node === button));
    selectedId = button.dataset.command;
    const message = commandMessages[button.dataset.command];
    setDialog({
      title: message.title,
      text: message.text,
      stats: message.stats
    }, "#2f7fe8", "#4c342f");
  });
});

canvas.addEventListener("click", handleField);
canvas.addEventListener("touchstart", (event) => {
  event.preventDefault();
  handleField(event);
}, { passive: false });

drawPortrait();
renderMap();
