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
  { id: "cafe", name: "Cafe", count: 2, detail: "雑談と運用相談 / Open Area" },
  { id: "client", name: "Client Room", count: 1, detail: "外部相談 / Locked soon" }
];

const objectCatalog = [
  { id: "desk", name: "Desk Pod", swatch: "#e9b26e" },
  { id: "plant", name: "Plant", swatch: "#58d887" },
  { id: "sofa", name: "Sofa", swatch: "#638bc0" },
  { id: "board", name: "Board", swatch: "#f8f2dc" },
  { id: "cooler", name: "Cooler", swatch: "#8dddf2" },
  { id: "table", name: "Table", swatch: "#e6b36d" }
];

const spriteAtlas = {
  agentIdle: {
    colors: {
      h: "#2f2738",
      f: "#e8b27f",
      s: "#4aa3bd",
      d: "#263047",
      e: "#20263b"
    },
    rows: [
      ".....hhhh.....",
      "...hhhhhhhh...",
      "..hhffffffh..",
      "..hffeffefh..",
      "..hffffffhh..",
      "...ffffff....",
      "....ssss.....",
      "...ssssss....",
      "..dssssssd...",
      "..dssssssd...",
      "...ssssss....",
      "....s..s.....",
      "...dd..dd...."
    ]
  },
  sparkle: {
    colors: { y: "#ffe06d", w: "#fff6c7" },
    rows: [
      "..y..",
      ".yyy.",
      "yywyy",
      ".yyy.",
      "..y.."
    ]
  }
};

const statusText = {
  available: "Available",
  focus: "Focus",
  meeting: "In meeting",
  away: "Away"
};

function readPlacedObjects() {
  try {
    const raw = localStorage.getItem("mk3PlacedObjects");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => objectCatalog.some((object) => object.id === item.type)) : [];
  } catch {
    return [];
  }
}

const state = {
  selected: "mika",
  selfStatus: "available",
  peopleOpen: window.innerWidth > 820,
  profileOpen: false,
  simplified: false,
  studio: false,
  activeObject: "desk",
  placedObjects: readPlacedObjects(),
  mic: true,
  cam: false,
  screen: false,
  reactions: 0,
  taskRuns: 0
};

const q = (selector) => document.querySelector(selector);
const qa = (selector) => [...document.querySelectorAll(selector)];
let walkTimer = null;
let mapEngine = null;

function savePlacedObjects() {
  try {
    localStorage.setItem("mk3PlacedObjects", JSON.stringify(state.placedObjects.slice(-40)));
  } catch {
    // Local storage can be unavailable in privacy-restricted contexts.
  }
}

function drawAtlasSprite(ctx, key, x, y, scale = 2, overrides = {}) {
  const sprite = spriteAtlas[key];
  if (!sprite) return;
  sprite.rows.forEach((row, rowIndex) => {
    [...row].forEach((token, colIndex) => {
      if (token === ".") return;
      ctx.fillStyle = overrides[token] || sprite.colors[token];
      ctx.fillRect(x + colIndex * scale, y + rowIndex * scale, scale, scale);
    });
  });
}

function drawPixelMap() {
  const canvas = q("#pixelMap");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const T = 16;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, w, h);

  const solid = (x, y, width, height, fill) => {
    ctx.fillStyle = fill;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  };

  const rect = (x, y, width, height, fill, stroke = "#273049", inset = 4) => {
    solid(x, y, width, height, stroke);
    solid(x + inset, y + inset, width - inset * 2, height - inset * 2, fill);
  };

  const tileFloor = (x, y, cols, rows, colors, grout = "#d5bea0") => {
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const px = x + col * T;
        const py = y + row * T;
        solid(px, py, T, T, colors[(row + col) % colors.length]);
        solid(px, py, T, 1, grout);
        solid(px, py, 1, T, grout);
        if ((row * 3 + col) % 7 === 0) solid(px + 11, py + 10, 3, 2, "rgba(58, 47, 38, .12)");
        if ((row + col * 2) % 11 === 0) solid(px + 4, py + 4, 2, 2, "rgba(255, 255, 255, .16)");
      }
    }
  };

  const label = (text, x, y, width) => {
    solid(x + 3, y + 3, width, 18, "rgba(27, 31, 48, .36)");
    rect(x, y, width, 18, "#fffaf0", "#384158", 2);
    solid(x + 4, y + 14, width - 8, 2, "#d9c7a2");
    ctx.fillStyle = "#46506c";
    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(text, x + 7, y + 12);
  };

  const dashRect = (x, y, width, height, color) => {
    for (let i = 0; i < width; i += T) {
      solid(x + i, y, 10, 3, color);
      solid(x + i, y + height - 3, 10, 3, color);
    }
    for (let i = 0; i < height; i += T) {
      solid(x, y + i, 3, 10, color);
      solid(x + width - 3, y + i, 3, 10, color);
    }
  };

  const brickWall = (x, y, width, height, wall = "#8f6670") => {
    solid(x, y, width, height, "#2c3449");
    solid(x + 2, y + 2, width - 4, height - 4, wall);
    for (let yy = y + 4; yy < y + height - 4; yy += 8) {
      for (let xx = x + 4 + ((yy / 8) % 2) * 8; xx < x + width - 6; xx += T) {
        solid(xx, yy, 9, 2, "rgba(255,255,255,.16)");
      }
    }
    solid(x + 2, y + height - 5, width - 4, 3, "rgba(35, 42, 60, .36)");
  };

  const room = ({ name, x, y, cols, rows, floor, grout, wall = "#936977", labelWidth = 88, doors = [] }) => {
    const width = cols * T;
    const height = rows * T;
    solid(x + 8, y + 8, width, height, "rgba(24, 27, 43, .28)");
    brickWall(x, y, width, height, wall);
    tileFloor(x + T, y + T, cols - 2, rows - 2, floor, grout);
    doors.forEach(({ side, at, span = 2 }) => {
      if (side === "top") tileFloor(x + at * T, y, span, 1, floor, grout);
      if (side === "bottom") tileFloor(x + at * T, y + height - T, span, 1, floor, grout);
      if (side === "left") tileFloor(x, y + at * T, 1, span, floor, grout);
      if (side === "right") tileFloor(x + width - T, y + at * T, 1, span, floor, grout);
    });
    label(name, x + T + 4, y + T + 6, labelWidth);
  };

  const windowBlock = (x, y, width = 44) => {
    rect(x, y, width, 25, "#87d8ec", "#334158", 3);
    solid(x + 4, y + 4, width - 8, 4, "#ccf7ff");
    solid(x + width / 2 - 1, y + 3, 2, 19, "#334158");
    solid(x + 3, y + 12, width - 6, 2, "#334158");
  };

  const shadow = (x, y, width, height) => solid(x + 4, y + height - 2, width - 4, 6, "rgba(22, 25, 39, .22)");

  const desk = (x, y, color = "#e6c18a", screen = "#49b7d7") => {
    shadow(x, y, 66, 42);
    rect(x, y, 66, 32, color, "#4c4050", 3);
    solid(x + 3, y + 26, 60, 4, "#b8794f");
    rect(x + 9, y - 13, 22, 15, screen, "#223048", 3);
    solid(x + 14, y - 9, 11, 4, "#b9f4ff");
    rect(x + 39, y - 10, 17, 12, "#5b84d7", "#223048", 2);
    solid(x + 8, y + 12, 18, 4, "#30466f");
    solid(x + 30, y + 13, 20, 3, "#fff3d3");
    solid(x + 54, y + 8, 6, 10, "#61c97b");
    solid(x + 55, y + 6, 5, 3, "#a4f2a4");
  };

  const officeChair = (x, y, color = "#30324d") => {
    rect(x, y, 18, 19, color, "#22283d", 2);
    solid(x + 4, y + 18, 10, 7, "#22283d");
    solid(x + 6, y + 25, 4, 5, "#22283d");
    solid(x + 13, y + 25, 4, 5, "#22283d");
  };

  const plant = (x, y) => {
    shadow(x, y, 38, 48);
    rect(x + 11, y + 27, 17, 20, "#c97850", "#714735", 2);
    solid(x + 4, y + 13, 27, 16, "#2fa861");
    solid(x + 16, y + 2, 28, 17, "#64d887");
    solid(x + 20, y + 20, 21, 14, "#43bd73");
    solid(x, y + 23, 19, 12, "#58d887");
    solid(x + 24, y + 7, 9, 5, "#a9f1a8");
  };

  const bookshelf = (x, y, width = 52, height = 38) => {
    shadow(x, y, width, height);
    rect(x, y, width, height, "#5b4c61", "#2f3a50", 3);
    for (let row = 0; row < 3; row += 1) {
      solid(x + 5, y + 8 + row * 9, width - 10, 2, "#2b3042");
      for (let col = 0; col < 8; col += 1) {
        const colors = ["#4e7cd8", "#f0c35b", "#d86c78", "#59bd7d", "#ded7ca", "#7b64d8"];
        solid(x + 7 + col * 5, y + 4 + row * 9, 3, 8, colors[(row + col) % colors.length]);
      }
    }
  };

  const couch = (x, y, width = 72, color = "#ebb88d") => {
    shadow(x, y, width, 34);
    rect(x, y, width, 34, color, "#72495c", 3);
    solid(x + 6, y + 7, width - 12, 4, "#f1c6a2");
    solid(x + 6, y + 26, width - 12, 6, "#bc765b");
  };

  const roundTable = (x, y) => {
    shadow(x, y, 54, 38);
    solid(x + 13, y + 5, 30, 4, "#865b36");
    rect(x, y, 54, 36, "#e6b36d", "#8b5d3c", 3);
    solid(x + 24, y + 13, 9, 9, "#8458b8");
    solid(x + 19, y + 23, 16, 3, "#fff3d3");
  };

  const conferenceTable = (x, y, width = 132) => {
    shadow(x, y, width, 50);
    rect(x, y, width, 44, "#d59a5a", "#56364a", 4);
    solid(x + 8, y + 10, width - 16, 5, "#f0c184");
    solid(x + 16, y + 23, 26, 5, "#fff5d8");
    solid(x + 54, y + 23, 22, 5, "#fff5d8");
    solid(x + 88, y + 23, 26, 5, "#fff5d8");
  };

  const meetingChair = (x, y, color = "#aebbd4") => {
    rect(x, y, 20, 18, color, "#263047", 2);
  };

  const waterCooler = (x, y) => {
    shadow(x, y, 26, 46);
    rect(x + 2, y + 18, 22, 28, "#4d5a6e", "#31384a", 2);
    rect(x + 4, y, 18, 21, "#8dddf2", "#53606e", 2);
    solid(x + 8, y + 3, 9, 5, "#d6fbff");
  };

  const avatar = (x, y, shirt, hair = "#2b2637") => {
    solid(x + 5, y + 27, 24, 5, "rgba(23, 26, 42, .2)");
    drawAtlasSprite(ctx, "agentIdle", x, y, 2, { s: shirt, h: hair });
  };

  const tree = (x, y) => {
    solid(x + 26, y + 50, 16, 32, "#8d6339");
    solid(x + 10, y + 20, 44, 32, "#5ebf73");
    solid(x + 24, y, 48, 38, "#75d987");
    solid(x, y + 38, 38, 29, "#4fb66a");
    solid(x + 42, y + 38, 38, 29, "#63c97b");
    solid(x + 30, y + 24, 22, 15, "#a4efa5");
  };

  const vending = (x, y, color = "#d95756") => {
    shadow(x, y, 34, 58);
    rect(x, y, 34, 58, color, "#31384a", 3);
    solid(x + 7, y + 7, 20, 12, "#bff4ff");
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        solid(x + 7 + col * 7, y + 24 + row * 6, 4, 4, ["#fff0b0", "#75d880", "#74a9ff", "#f29393"][(row + col) % 4]);
      }
    }
    solid(x + 25, y + 40, 4, 10, "#23283c");
  };

  const whiteboard = (x, y, width = 96, height = 48) => {
    shadow(x, y, width, height);
    rect(x, y, width, height, "#f8f2dc", "#5b6477", 4);
    solid(x + 12, y + 13, width - 24, 3, "#5e7dcc");
    solid(x + 12, y + 23, Math.floor(width * .42), 3, "#e8786f");
    solid(x + 12, y + 33, Math.floor(width * .58), 3, "#57b878");
  };

  const counter = (x, y, width = 124) => {
    shadow(x, y, width, 44);
    rect(x, y, width, 38, "#d89b5f", "#4d3543", 4);
    solid(x + 8, y + 9, width - 16, 4, "#f4c084");
    solid(x + 12, y + 22, 20, 5, "#2c5178");
    solid(x + 44, y + 22, 22, 5, "#6f4d83");
    solid(x + width - 28, y + 15, 13, 13, "#7ad480");
  };

  const rug = (x, y, width, height, color = "#736ac0") => {
    for (let yy = y; yy < y + height; yy += T) {
      for (let xx = x; xx < x + width; xx += T) {
        solid(xx, yy, T, T, (xx / T + yy / T) % 2 ? color : "#887bd0");
      }
    }
    dashRect(x, y, width, height, "rgba(255,255,255,.55)");
  };

  const speech = (text, x, y, width = 56) => {
    rect(x, y, width, 18, "#fffdf6", "#3b405a", 2);
    solid(x + 11, y + 18, 10, 4, "#3b405a");
    solid(x + 13, y + 18, 6, 2, "#fffdf6");
    ctx.fillStyle = "#2e3957";
    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(text, x + 7, y + 12);
  };

  const spark = (x, y, text, color = "#ffe06d") => {
    drawAtlasSprite(ctx, "sparkle", x, y + 1, 2, { y: color });
    ctx.fillStyle = "#fffaf0";
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(text, x + 22, y + 17);
  };

  const catalogObject = (type, x, y) => {
    if (type === "desk") desk(x, y, "#e9b26e", "#59bfd8");
    if (type === "plant") plant(x, y);
    if (type === "sofa") couch(x, y, 78, "#638bc0");
    if (type === "board") whiteboard(x, y, 88, 44);
    if (type === "cooler") waterCooler(x, y);
    if (type === "table") roundTable(x, y);
  };

  tileFloor(0, 0, 60, 40, ["#8fce88", "#84c782", "#9bd795"], "#77b873");
  tileFloor(16, 496, 16, 8, ["#e8d5ad", "#dcc292"], "#c6a976");
  tileFloor(848, 80, 7, 28, ["#e8d5ad", "#dcc292"], "#c6a976");
  tree(10, 34);
  tree(42, 178);
  tree(8, 370);
  tree(884, 28);
  tree(876, 436);
  vending(36, 266, "#5e7bd9");

  solid(72, 48, 832, 544, "#bfc8d2");
  solid(80, 56, 816, 528, "#f2dfbe");

  room({ name: "Focus Pods", x: 96, y: 80, cols: 17, rows: 13, floor: ["#b8daa0", "#c5e3ad"], grout: "#9ec286", wall: "#8996a5", labelWidth: 92, doors: [{ side: "bottom", at: 8, span: 3 }] });
  room({ name: "Lobby", x: 96, y: 320, cols: 14, rows: 14, floor: ["#c8dadd", "#dbe7e6"], grout: "#a9c0c4", wall: "#8e9baa", labelWidth: 58, doors: [{ side: "right", at: 5, span: 3 }, { side: "top", at: 4, span: 2 }] });
  room({ name: "Review Pods", x: 384, y: 96, cols: 19, rows: 15, floor: ["#cbd2dc", "#dbe1e8"], grout: "#aab3c0", wall: "#929eae", labelWidth: 98, doors: [{ side: "bottom", at: 7, span: 3 }, { side: "left", at: 8, span: 2 }] });
  room({ name: "Client Room", x: 704, y: 96, cols: 10, rows: 11, floor: ["#e8b772", "#dc9f61"], grout: "#c8844c", wall: "#929eae", labelWidth: 94, doors: [{ side: "bottom", at: 3, span: 3 }] });
  room({ name: "Agent Studio", x: 384, y: 352, cols: 19, rows: 12, floor: ["#aaa6de", "#bab5e9"], grout: "#8f8ac0", wall: "#8d94aa", labelWidth: 102, doors: [{ side: "top", at: 5, span: 3 }, { side: "right", at: 9, span: 2 }] });
  room({ name: "Cafe", x: 704, y: 320, cols: 10, rows: 14, floor: ["#b7d28e", "#c6dda0"], grout: "#94ad73", wall: "#8d9aaa", labelWidth: 58, doors: [{ side: "left", at: 5, span: 3 }, { side: "top", at: 3, span: 2 }] });

  tileFloor(320, 304, 24, 4, ["#ead9ba", "#dfcba9"], "#c8b28f");
  brickWall(320, 288, 384, 16, "#9aa5b3");
  brickWall(320, 368, 64, 16, "#9aa5b3");
  brickWall(656, 368, 48, 16, "#9aa5b3");
  label("Main Hall", 430, 316, 82);

  windowBlock(128, 80, 58);
  windowBlock(204, 80, 58);
  windowBlock(432, 96, 58);
  windowBlock(512, 96, 58);
  windowBlock(736, 96, 58);
  windowBlock(112, 528, 74);
  windowBlock(210, 528, 74);
  windowBlock(432, 528, 70);
  windowBlock(520, 528, 70);
  windowBlock(736, 528, 58);

  rug(416, 144, 224, 128, "#6970b9");
  rug(128, 128, 192, 104, "#7fb176");
  dashRect(416, 144, 224, 128, "rgba(255, 255, 255, .72)");
  dashRect(128, 128, 192, 104, "rgba(255, 255, 255, .72)");
  dashRect(720, 352, 128, 128, "rgba(255, 255, 255, .58)");

  desk(128, 150, "#e8c692", "#57b7d8");
  desk(224, 150, "#e8c692", "#6e8be8");
  desk(128, 230, "#e8c692", "#4dbd93");
  desk(224, 230, "#e8c692", "#d76e88");
  officeChair(148, 188);
  officeChair(244, 188);
  officeChair(148, 268);
  officeChair(244, 268);
  bookshelf(304, 130, 48, 72);
  whiteboard(292, 226, 62, 52);

  desk(424, 170, "#e8e2d0", "#61c6db");
  desk(520, 170, "#e8e2d0", "#6d8cff");
  desk(424, 232, "#e8e2d0", "#5bc782");
  desk(520, 232, "#e8e2d0", "#d76c82");
  officeChair(444, 208, "#444e6e");
  officeChair(540, 208, "#444e6e");
  officeChair(444, 270, "#444e6e");
  officeChair(540, 270, "#444e6e");
  whiteboard(584, 128, 76, 54);
  bookshelf(642, 200, 42, 72);

  conferenceTable(724, 164, 120);
  meetingChair(736, 142, "#cbd5e7");
  meetingChair(784, 142, "#cbd5e7");
  meetingChair(824, 192, "#cbd5e7");
  plant(848, 112);
  whiteboard(724, 240, 112, 40);

  counter(128, 398, 124);
  couch(136, 468, 82, "#638bc0");
  roundTable(240, 458);
  bookshelf(104, 352, 68, 42);
  vending(268, 368, "#d95756");
  plant(302, 488);

  desk(416, 406, "#e9b26e", "#59bfd8");
  desk(512, 406, "#e9b26e", "#6e8be8");
  desk(608, 406, "#e9b26e", "#4fc486");
  desk(416, 486, "#e9b26e", "#df727e");
  desk(512, 486, "#e9b26e", "#59bfd8");
  desk(608, 486, "#e9b26e", "#6e8be8");
  officeChair(436, 444);
  officeChair(532, 444);
  officeChair(628, 444);
  officeChair(436, 524);
  officeChair(532, 524);
  officeChair(628, 524);
  whiteboard(392, 560, 104, 32);
  waterCooler(660, 524);

  counter(720, 384, 120);
  couch(728, 472, 96, "#dfaa72");
  roundTable(792, 432);
  waterCooler(852, 346);
  bookshelf(844, 438, 42, 78);
  plant(720, 336);
  plant(850, 506);

  if (!window.Phaser || !window.EasyStar) {
    state.placedObjects.forEach((object) => catalogObject(object.type, object.x, object.y));
  }

  avatar(184, 250, "#4aa3bd", "#382c28");
  avatar(456, 302, "#e3b047", "#7f573e");
  avatar(596, 302, "#d86c78", "#2f2738");
  avatar(764, 438, "#44a778", "#3c2f2a");
  avatar(260, 430, "#7768c8", "#22283d");

  speech("open", 184, 122, 58);
  speech("review", 560, 116, 72);
  speech("ship?", 732, 362, 64);
  spark(332, 180, "XP+3");
  spark(620, 288, "QA+2", "#9cf28c");
  spark(820, 408, "$+5", "#ffe06d");

  solid(80, 56, 816, 4, "rgba(255,255,255,.14)");
  solid(80, 580, 816, 4, "rgba(18, 22, 34, .32)");
}

function bootMapEngine() {
  if (!window.Phaser || !window.EasyStar || !q("#phaserMount")) return null;

  const engine = {
    scene: null,
    you: null,
    placedGroup: null,
    pathfinder: null,
    grid: null,
    tileSize: 16,
    width: 960,
    height: 640,
    objectSizes: {
      desk: { width: 66, height: 36 },
      plant: { width: 38, height: 48 },
      sofa: { width: 78, height: 34 },
      board: { width: 88, height: 44 },
      cooler: { width: 26, height: 46 },
      table: { width: 54, height: 36 }
    },
    placeObject(type, x, y) {
      if (!this.scene || !this.placedGroup) return false;
      this.addObjectSprite(type, x, y);
      this.markObjectCollision(type, x, y);
      this.configurePathfinder();
      return true;
    },
    moveToPercent(left, top) {
      if (!this.scene || !this.you || !this.pathfinder) return false;
      const targetX = Math.round((left / 100) * this.width);
      const targetY = Math.round((top / 100) * this.height);
      this.moveToPoint(targetX, targetY);
      return true;
    },
    moveToPoint(targetX, targetY) {
      const start = this.toTile(this.you.x, this.you.y);
      const target = this.findNearestWalkable(this.toTile(targetX, targetY));
      this.pathfinder.findPath(start.x, start.y, target.x, target.y, (path) => {
        if (!path || path.length < 2) {
          this.tweenDirect(target.x * this.tileSize + 8, target.y * this.tileSize + 10);
          return;
        }
        this.followPath(path);
      });
      this.pathfinder.calculate();
    },
    toTile(x, y) {
      return {
        x: Math.max(0, Math.min(59, Math.floor(x / this.tileSize))),
        y: Math.max(0, Math.min(39, Math.floor(y / this.tileSize)))
      };
    },
    isWalkable(tile) {
      return this.grid?.[tile.y]?.[tile.x] === 0;
    },
    findNearestWalkable(tile) {
      if (this.isWalkable(tile)) return tile;
      for (let radius = 1; radius < 8; radius += 1) {
        for (let y = tile.y - radius; y <= tile.y + radius; y += 1) {
          for (let x = tile.x - radius; x <= tile.x + radius; x += 1) {
            const candidate = { x, y };
            if (x >= 0 && y >= 0 && x < 60 && y < 40 && this.isWalkable(candidate)) return candidate;
          }
        }
      }
      return tile;
    },
    followPath(path) {
      const points = path.slice(1).map((point) => ({
        x: point.x * this.tileSize + 8,
        y: point.y * this.tileSize + 10
      }));
      this.you.play("you-walk", true);
      const step = (index) => {
        if (index >= points.length) {
          this.you.stop();
          this.you.setTexture("you-idle");
          return;
        }
        this.scene.tweens.add({
          targets: this.you,
          x: points[index].x,
          y: points[index].y,
          duration: 72,
          ease: "Linear",
          onComplete: () => step(index + 1)
        });
      };
      step(0);
    },
    tweenDirect(x, y) {
      this.you.play("you-walk", true);
      this.scene.tweens.add({
        targets: this.you,
        x,
        y,
        duration: 520,
        ease: "Linear",
        onComplete: () => {
          this.you.stop();
          this.you.setTexture("you-idle");
        }
      });
    },
    configurePathfinder() {
      this.pathfinder = new window.EasyStar.js();
      this.pathfinder.setGrid(this.grid);
      this.pathfinder.setAcceptableTiles([0]);
      this.pathfinder.enableDiagonals();
      this.pathfinder.disableCornerCutting();
    },
    markRectCollision(x, y, width, height) {
      const start = this.toTile(x, y);
      const end = this.toTile(x + width, y + height);
      for (let row = start.y; row <= end.y; row += 1) {
        for (let col = start.x; col <= end.x; col += 1) {
          if (this.grid[row] && typeof this.grid[row][col] !== "undefined") this.grid[row][col] = 1;
        }
      }
    },
    markObjectCollision(type, x, y) {
      const size = this.objectSizes[type] || { width: 32, height: 32 };
      this.markRectCollision(x, y, size.width, size.height);
    },
    addObjectSprite(type, x, y) {
      const key = `obj-${type}`;
      const sprite = this.scene.add.image(x, y, key).setOrigin(0, 0).setDepth(2);
      this.placedGroup.add(sprite);
    }
  };

  const config = {
    type: window.Phaser.CANVAS,
    parent: "phaserMount",
    width: engine.width,
    height: engine.height,
    transparent: true,
    pixelArt: true,
    scene: {
      create() {
        engine.scene = this;
        createEngineTextures(this);
        engine.grid = createEngineGrid(engine);
        engine.configurePathfinder();
        engine.placedGroup = this.add.group();
        state.placedObjects.forEach((object) => {
          engine.addObjectSprite(object.type, object.x, object.y);
          engine.markObjectCollision(object.type, object.x, object.y);
        });
        engine.configurePathfinder();
        engine.you = this.add.sprite(536, 446, "you-idle").setOrigin(.5, 1).setDepth(5);
        this.anims.create({
          key: "you-walk",
          frames: [{ key: "you-walk-0" }, { key: "you-walk-1" }],
          frameRate: 7,
          repeat: -1
        });
      }
    }
  };

  try {
    engine.game = new window.Phaser.Game(config);
    q("#mapSurface").classList.add("game-engine-on");
    return engine;
  } catch (error) {
    console.warn("Phaser map engine failed to start", error);
    return null;
  }
}

function createEngineGrid(engine) {
  const grid = Array.from({ length: 40 }, () => Array(60).fill(0));
  const mark = (x, y, width, height) => {
    const start = engine.toTile(x, y);
    const end = engine.toTile(x + width, y + height);
    for (let row = start.y; row <= end.y; row += 1) {
      for (let col = start.x; col <= end.x; col += 1) {
        if (grid[row] && typeof grid[row][col] !== "undefined") grid[row][col] = 1;
      }
    }
  };

  [
    [72, 48, 832, 32],
    [72, 584, 832, 24],
    [72, 48, 24, 544],
    [896, 48, 24, 544],
    [96, 80, 272, 16],
    [96, 288, 272, 16],
    [384, 96, 304, 16],
    [384, 336, 304, 16],
    [704, 96, 160, 16],
    [704, 272, 160, 16],
    [96, 320, 224, 16],
    [96, 544, 224, 16],
    [384, 352, 304, 16],
    [384, 544, 304, 16],
    [704, 320, 160, 16],
    [704, 544, 160, 16]
  ].forEach(([x, y, width, height]) => mark(x, y, width, height));

  [
    [128, 150, 66, 36],
    [224, 150, 66, 36],
    [424, 170, 66, 36],
    [520, 170, 66, 36],
    [416, 406, 66, 36],
    [512, 406, 66, 36],
    [608, 406, 66, 36],
    [724, 164, 120, 44],
    [128, 398, 124, 38],
    [720, 384, 120, 38]
  ].forEach(([x, y, width, height]) => mark(x, y, width, height));

  return grid;
}

function createEngineTextures(scene) {
  const drawTexture = (key, width, height, draw) => {
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, width, height);
    const ctx = texture.getContext();
    ctx.imageSmoothingEnabled = false;
    draw(ctx);
    texture.refresh();
  };
  const fill = (ctx, x, y, width, height, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  };
  const rect = (ctx, x, y, width, height, fillColor, stroke = "#263047", inset = 2) => {
    fill(ctx, x, y, width, height, stroke);
    fill(ctx, x + inset, y + inset, width - inset * 2, height - inset * 2, fillColor);
  };

  drawTexture("you-idle", 20, 30, (ctx) => {
    fill(ctx, 7, 0, 8, 3, "#7a4d36");
    fill(ctx, 5, 3, 12, 8, "#e8b27f");
    fill(ctx, 4, 5, 3, 7, "#7a4d36");
    fill(ctx, 16, 5, 3, 7, "#7a4d36");
    fill(ctx, 6, 12, 12, 12, "#2f54bd");
    fill(ctx, 3, 14, 4, 9, "#263047");
    fill(ctx, 17, 14, 4, 9, "#263047");
    fill(ctx, 7, 24, 4, 5, "#263047");
    fill(ctx, 14, 24, 4, 5, "#263047");
  });
  drawTexture("you-walk-0", 20, 30, (ctx) => {
    fill(ctx, 7, 0, 8, 3, "#7a4d36");
    fill(ctx, 5, 3, 12, 8, "#e8b27f");
    fill(ctx, 4, 5, 3, 7, "#7a4d36");
    fill(ctx, 16, 5, 3, 7, "#7a4d36");
    fill(ctx, 6, 12, 12, 12, "#2f54bd");
    fill(ctx, 2, 14, 4, 9, "#263047");
    fill(ctx, 18, 14, 4, 9, "#263047");
    fill(ctx, 5, 24, 4, 5, "#263047");
    fill(ctx, 15, 24, 4, 5, "#263047");
  });
  drawTexture("you-walk-1", 20, 30, (ctx) => {
    fill(ctx, 7, 0, 8, 3, "#7a4d36");
    fill(ctx, 5, 3, 12, 8, "#e8b27f");
    fill(ctx, 4, 5, 3, 7, "#7a4d36");
    fill(ctx, 16, 5, 3, 7, "#7a4d36");
    fill(ctx, 6, 12, 12, 12, "#2f54bd");
    fill(ctx, 4, 14, 4, 9, "#263047");
    fill(ctx, 16, 14, 4, 9, "#263047");
    fill(ctx, 8, 24, 4, 5, "#263047");
    fill(ctx, 12, 24, 4, 5, "#263047");
  });
  drawTexture("obj-desk", 66, 36, (ctx) => {
    rect(ctx, 0, 10, 66, 26, "#e9b26e", "#4c4050", 3);
    rect(ctx, 9, 0, 22, 14, "#59bfd8", "#223048", 2);
    rect(ctx, 39, 3, 17, 11, "#6e8be8", "#223048", 2);
    fill(ctx, 8, 22, 18, 4, "#30466f");
    fill(ctx, 30, 23, 20, 3, "#fff3d3");
    fill(ctx, 54, 18, 6, 9, "#61c97b");
  });
  drawTexture("obj-plant", 38, 48, (ctx) => {
    rect(ctx, 12, 28, 16, 18, "#c97850", "#714735", 2);
    fill(ctx, 4, 14, 26, 16, "#2fa861");
    fill(ctx, 16, 2, 22, 17, "#64d887");
    fill(ctx, 20, 21, 18, 12, "#43bd73");
    fill(ctx, 0, 24, 18, 12, "#58d887");
  });
  drawTexture("obj-sofa", 78, 34, (ctx) => {
    rect(ctx, 0, 0, 78, 34, "#638bc0", "#72495c", 3);
    fill(ctx, 6, 7, 66, 4, "#93bee5");
    fill(ctx, 6, 26, 66, 6, "#4f6d9b");
  });
  drawTexture("obj-board", 88, 44, (ctx) => {
    rect(ctx, 0, 0, 88, 44, "#f8f2dc", "#5b6477", 4);
    fill(ctx, 12, 13, 58, 3, "#5e7dcc");
    fill(ctx, 12, 23, 36, 3, "#e8786f");
    fill(ctx, 12, 33, 50, 3, "#57b878");
  });
  drawTexture("obj-cooler", 26, 46, (ctx) => {
    rect(ctx, 2, 18, 22, 28, "#4d5a6e", "#31384a", 2);
    rect(ctx, 4, 0, 18, 21, "#8dddf2", "#53606e", 2);
    fill(ctx, 8, 3, 9, 5, "#d6fbff");
  });
  drawTexture("obj-table", 54, 36, (ctx) => {
    rect(ctx, 0, 0, 54, 36, "#e6b36d", "#8b5d3c", 3);
    fill(ctx, 24, 13, 9, 9, "#8458b8");
    fill(ctx, 19, 23, 16, 3, "#fff3d3");
  });
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

function renderObjectLibrary() {
  const list = q("#objectLibrary");
  if (!list) return;
  list.replaceChildren();
  objectCatalog.forEach((object) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `palette-item ${object.id === state.activeObject ? "active" : ""}`;
    button.dataset.objectType = object.id;
    button.style.setProperty("--swatch", object.swatch);
    button.innerHTML = `<span class="palette-swatch"></span><span>${object.name}</span>`;
    button.addEventListener("click", () => {
      state.activeObject = object.id;
      q("#activeObjectLabel").textContent = object.name;
      renderObjectLibrary();
      setToast(`${object.name} を選択しました。Buildモードで地図をダブルクリックして配置できます`);
    });
    list.append(button);
  });
  const active = objectCatalog.find((object) => object.id === state.activeObject);
  q("#activeObjectLabel").textContent = active?.name || "Object";
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
  q("#mapSurface").classList.toggle("profile-open", state.profileOpen);
  q("#statusBtn").classList.toggle("focus", state.selfStatus === "focus");
  q("#statusBtn").textContent = state.selfStatus === "focus" ? "Focus mode" : "Available";
  q("#selfStatus").textContent = `${statusText[state.selfStatus]} in Agent HQ`;
}

function render() {
  renderProfile();
  renderMembers();
  renderAreas();
  renderObjectLibrary();
  renderAvatars();
  renderControls();
}

function selectAgent(id, source = "map") {
  state.selected = id;
  state.profileOpen = true;
  const agent = selectedAgent();
  setToast(source === "panel" ? `${agent.name} をParticipantsから選択しました` : `${agent.name} のプロフィールを開きました`);
  render();
}

function toggleControl(key, label) {
  state[key] = !state[key];
  setToast(`${label}: ${state[key] ? "on" : "off"}`);
  renderControls();
}

function mapPointFromEvent(event) {
  const surface = q("#mapSurface");
  const canvas = q("#pixelMap");
  const rect = surface.getBoundingClientRect();
  const left = ((event.clientX - rect.left) / rect.width) * 100;
  const top = ((event.clientY - rect.top) / rect.height) * 100;
  return {
    left,
    top,
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height
  };
}

function moveYouTo(left, top) {
  const you = q("#youAvatar");
  clearTimeout(walkTimer);
  if (mapEngine?.moveToPercent(left, top)) {
    you.style.left = `${Math.max(6, Math.min(90, left))}%`;
    you.style.top = `${Math.max(8, Math.min(86, top))}%`;
    return;
  }
  you.classList.add("walking");
  you.style.left = `${Math.max(6, Math.min(90, left))}%`;
  you.style.top = `${Math.max(8, Math.min(86, top))}%`;
  walkTimer = setTimeout(() => you.classList.remove("walking"), 620);
}

function placeSelectedObject(event) {
  const active = objectCatalog.find((object) => object.id === state.activeObject) || objectCatalog[0];
  const point = mapPointFromEvent(event);
  const x = Math.max(96, Math.min(832, Math.round(point.x / 16) * 16));
  const y = Math.max(96, Math.min(544, Math.round(point.y / 16) * 16));
  state.placedObjects.push({ type: active.id, x, y });
  state.placedObjects = state.placedObjects.slice(-40);
  savePlacedObjects();
  if (!mapEngine?.placeObject(active.id, x, y)) drawPixelMap();
  setToast(`${active.name} を配置しました`);
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
    if (button.dataset.view === "studio") {
      state.studio = !state.studio;
      state.profileOpen = false;
    } else {
      state.studio = false;
    }
    const active = objectCatalog.find((object) => object.id === state.activeObject);
    setToast(button.dataset.view === "studio" ? `Build mode: ${active?.name || "Object"} を配置できます` : `${button.textContent} view`);
    renderControls();
  });
});

q("#peopleBtn").addEventListener("click", () => {
  state.peopleOpen = !state.peopleOpen;
  if (state.peopleOpen) state.profileOpen = false;
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
  moveYouTo(53, 68);
  state.profileOpen = false;
  setToast("自分の位置に戻りました");
  renderControls();
});

q("#zoomIn").addEventListener("click", () => setToast("Zoom in"));
q("#zoomOut").addEventListener("click", () => setToast("Zoom out"));
q("#inviteBtn").addEventListener("click", () => setToast("Invite linkをコピーしました"));
q("#lockBtn").addEventListener("click", () => setToast("Review Podsをロックしました"));
q("#clearObjectsBtn").addEventListener("click", () => {
  state.placedObjects = [];
  savePlacedObjects();
  if (mapEngine?.game) {
    mapEngine.game.destroy(true);
    q("#phaserMount").replaceChildren();
    q("#mapSurface").classList.remove("game-engine-on");
    mapEngine = bootMapEngine();
  } else {
    drawPixelMap();
  }
  setToast("配置したオブジェクトをクリアしました");
});

q("#mapSurface").addEventListener("dblclick", (event) => {
  if (event.target.closest(".studio-palette")) return;
  const point = mapPointFromEvent(event);
  state.profileOpen = false;
  if (state.studio) {
    placeSelectedObject(event);
    renderControls();
    return;
  }
  moveYouTo(point.left, point.top);
  setToast("Double-clickした場所へ移動しました");
  renderControls();
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
mapEngine = bootMapEngine();
render();
