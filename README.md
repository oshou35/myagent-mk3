# myagent mk3 mock

Independent UI mock for `myagent mk3`.

- No connection to mk1 or mk2 code, APIs, data, queue, or dashboard.
- Static GitHub Pages-ready site.
- UI direction: simple top-down retro RPG office for growing an Agent company.
- Reference concepts: tile map, office/town facilities, small character sprites, stat popups, RPG message window, bottom command menu.
- mk2 learnings are mapped into independent mk3 concepts: workflows as work lines, procedures as manuals, verification as QA room, knowledge as library, queue as control room, and reports as accounting/news.
- No external CDN or image assets.
- Design notes: `docs/retro-office-design.md`
- mk2 learning map: `docs/mk2-learning-map.md`
- Verified screenshots: `screenshots/mobile.png`, `screenshots/desktop.png`

## Local preview

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`.
