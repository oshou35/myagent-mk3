# myagent mk3 mock

Independent UI mock for `myagent mk3`.

- No connection to mk1 or mk2 code, APIs, data, queue, or dashboard.
- Static GitHub Pages-ready site.
- UI direction: Gather-style 16px-grid pixel virtual office for managing and growing agents.
- Reference concepts: 2D office map, Participants Panel, private areas, desks, status dots, bottom call controls, chat, locate/follow/wave actions.
- Build mode includes a small object library for placing desks, plants, sofas, boards, coolers, and tables on the map.
- Game layer uses Phaser 3.90.0 plus EasyStar.js for pixel sprite rendering, placed-object sprites, collision-aware grid setup, and double-click path movement.
- Canvas map remains as the static background/fallback if the game libraries cannot load.
- Research notes: `docs/gather-ui-research.md`
- Self-review checklist: `docs/gather-quality-review.md`
- Verified screenshots: `screenshots/mobile.png`, `screenshots/desktop.png`

## Local preview

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`.
