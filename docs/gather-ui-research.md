# Gather UI research notes

Date: 2026-07-20

## Sources

- Gather Virtual Office: https://www.gather.town/virtual-office
- Gather Japanese homepage: https://www.gather.town/ja/
- Gather Features: https://www.gather.town/features
- Participants Panel Overview: https://support.gather.town/articles/3602925011-participants-panel-overview
- Take a Tour of an Office on Gather: https://support.gather.town/articles/2958572750-take-a-tour-of-an-office-on-gather
- Looking & Moving Around the Office: https://support.gather.town/articles/1285650718-looking-moving-around-the-office
- Gather 1.0 Mobile App: https://support.gather.town/articles/7408975524-gather-1-0-mobile-app
- Phaser v3.90.0 release/download: https://phaser.io/download/release/v3.90.0
- Phaser Tilemap API: https://docs.phaser.io/api-documentation/class/tilemaps-tilemap
- EasyStar.js: https://easystarjs.com/
- Tiled JSON map format: https://doc.mapeditor.org/en/stable/reference/json-map-format/

## UI patterns reproduced in mk3

- 2D virtual office map with desks, meeting areas, private rings, furniture, status bubbles, and walk targets.
- High-density 16px-grid pixel office map with distinct team areas, walls, windows, desks, lounge objects, plants, vending machines, whiteboards, and decorative office items.
- Left workspace navigation rail.
- Top room/search/status bar.
- Bottom call controls for mic, camera, screen share, reactions, and people.
- Right Participants Panel with current area, active areas, members, offline members, and chat.
- Member profile card with Message, Locate, and Follow actions.
- Mobile layout where the map is visible first and Participants can open as a bottom sheet above call controls.
- Agent management semantics mapped onto Gather interactions: wave over, start task, build mode, focus status, and private review pods.
- Phaser-powered transparent game layer on top of the hand-drawn map, used for the local You sprite, object-placement sprites, and path movement.
- EasyStar.js grid pathfinding foundation, with explicit blocked tiles for room boundaries, desks, walls, and placed objects.

## Boundary

This mock copies interaction structure and layout conventions. It does not copy Gather branding, logos, proprietary art assets, screenshots, or exact product text. Visual parity means "same class of virtual-office pixel UI quality", not a literal asset clone.
