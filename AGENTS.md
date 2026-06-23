## Learned User Preferences

- Do not edit plan files when implementing attached plans.
- When implementing plans, use existing to-dos (mark in progress); do not recreate them.
- Avoid scrollbars in main simulator UI — layout panels so content is visible without scrolling.
- Simulator panels should fill all available space, not stay compressed in a small area.
- Navigation lights must follow COLREGS: port (left) = red, starboard (right) = green, stern = white.
- 3D boat must sit on the water surface; waves should not pass below the hull (no levitation look).
- Hotspots: icon-only by default, full label on hover; inactive state when device is off.

## Learned Workspace Facts

- EduBoat is an interactive educational app for boating procedures and naval-architecture tools.
- Stack: React 19, Vite, TypeScript, Three.js (@react-three/fiber, drei), Zustand.
- Navigation flow: Hub → Category → Simulator via `App.tsx`; procedures registered in `src/procedures/registry.ts`.
- Categories: `electric-systems` (Night at Anchor), `yacht-design` (Initial Stability).
- Each procedure is a self-contained module under `src/procedures/<name>/`.
- Night at Anchor 3D boat model: `/models/boat-1/boat-1.gltf` (Beneteau).
- Night at Anchor timeline lives in top navigation alongside 3D/Schematic/Source/Lessons controls.
- Initial Stability: hull cross-section simulator; G, B, M, K derived from hull geometry (G/B/K not manually draggable).
- GitHub repo: `eduboat`; deployed on Railway.
