# Gather quality self-review

Date: 2026-07-18

## Reference observations

- Japanese Gather homepage emphasizes looking around a virtual office, seeing who is free/focused/in meetings, waving people over, hearing nearby conversations, and joining in a click.
- Gather Features emphasizes Simplified View, status/availability, integrated meetings/chat, screen share, emoji reactions, templates, object placement, and Gather Studio.
- Participants Panel documentation defines the right-side model: Current Area, Pinned Members, Active Areas, Members, Guests, Offline Members, status dots, Message, Locate, Follow, and Request to Lead.
- Movement documentation defines pan/zoom, show my location, desk shortcuts, double-click movement, Locate, Follow, and Walk Over.
- Mobile documentation says mobile is conversation/Participants-oriented, showing Active Areas, Members/Guests, statuses, and join/start conversation options.

## Review against current mk3

- Pixel art office map: rebuilt around a 16px-grid low-resolution canvas with `image-rendering: pixelated`.
- Spatial density: includes outdoor strip, trees, meeting rooms, focus pods, product team desks, cafe, lobby, studio, water coolers, bookshelves, vending machines, plants, windows, whiteboards, walls, labels, speech bubbles, and small progress popups.
- Avatar readability: DOM avatars are the single interactive source for named Agents; background NPCs are non-interactive flavor only.
- Gather-style UI shell: left rail, top room/search/status bar, compact video tiles, bottom call controls, right Participants Panel, and mobile Participants sheet.
- Core interactions: People panel open/close, Message, Locate, Follow, double-click walk target, Build/Studio toggle, Simplified View, status toggle, chat send.
- Mobile initial state: map-first, no default profile card, no video overlay, Participants opens through People.

## Verification evidence

- `node --check script.js` passes.
- Desktop screenshot: `screenshots/desktop.png`
- Mobile screenshot: `screenshots/mobile.png`

## Remaining difference from Gather

- This is still an original mock, not Gather's proprietary asset set. It does not copy Gather sprites, object library, logo, or exact screenshots.
- Gather's official pixel assets still have more polished sprite animation, object variety, and per-tile collision semantics than this static prototype.
- This version is acceptable as a stronger high-fidelity direction mock. It is not a production-quality Gather clone.

## Completion threshold used

The mock can be considered complete for this iteration only if:

- It reads as a retro pixel-art virtual office before reading any text.
- The map has enough object density to imply a living office, not a flat grid.
- The Participants and movement interactions still work after the visual rewrite.
- Mobile shows the map first, with Participants available as a sheet.

Current judgment: passes for this iteration. Does not pass as "same as Gather" in a literal/proprietary asset sense.
