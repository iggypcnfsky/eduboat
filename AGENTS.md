## Learned User Preferences

- Do not edit plan files when implementing attached plans.
- When implementing plans, use existing to-dos (mark in progress); do not recreate them.
- Avoid scrollbars in main simulator UI — layout panels so content is visible without scrolling.
- Simulator panels should fill all available space, not stay compressed in a small area.
- Navigation lights must follow COLREGS: port (left) = red, starboard (right) = green, stern = white.
- 3D boat must sit on the water surface; waves should not pass below the hull (no levitation look).
- Hotspots: icon-only by default, full label on hover; inactive state when device is off.
- Initial Stability schematic: letter-only point labels (G, B, M, K); show full names on hover, not inline.
- Schematic zoom must not scale label size or stroke width.
- Do not auto-refit schematic camera when hull geometry or parameters change.
- Schematic water and background grid must fill the panel at any zoom/pan (no horizontal clipping).
- Equation and control help: per-field Lucide info-icon popovers; avoid inline explanation blocks or section toggles.

## Learned Workspace Facts

- EduBoat is an interactive educational app for boating procedures and naval-architecture tools.
- Stack: React 19, Vite, TypeScript, Three.js (@react-three/fiber, drei), Zustand.
- Navigation flow: Hub → Category → Simulator via `App.tsx`; procedures registered in `src/procedures/registry.ts`.
- Categories: `electric-systems` (Night at Anchor), `yacht-design` (Initial Stability).
- Each procedure is a self-contained module under `src/procedures/<name>/`.
- Night at Anchor 3D boat model: `/models/boat-1/boat-1.gltf` (Beneteau).
- Night at Anchor timeline lives in top navigation alongside 3D/Schematic/Source/Lessons controls.
- Initial Stability: analytical 2D hydrostatics (no Rapier); fixed upright metacenter M; G, B, K, and displacement computed from hull geometry (not manually draggable).
- Total weight slider is total boat mass (kg), independent of draft/hull shape params.
- Hull presets: choose hull type, then optional boat-class template (beam/draft/weight) applied to that type.
- GitHub repo: `eduboat`; deployed on Railway.
