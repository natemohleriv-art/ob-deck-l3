# OB Deck L3 — LED Previsualization

A local React / TypeScript / Three.js application for previewing motion content on the observation deck's floor, ceiling and segmented core-side wall.

## Public website and GitHub updates

An automatic GitHub Pages deployment workflow is included. Once the repository
is connected and Pages is enabled, pushes to its default branch run tests, build,
and deploy the public website. See [GitHub Pages setup](docs/github-pages.md).

## Run

Requires Node.js 22.12+ (tested with Node 24).

```powershell
npm install
npm run dev -- --port 5174
```

Open http://127.0.0.1:5174. The development server binds only to loopback. For a production build, run `npm run build`; serve the generated `dist` directory using a static HTTP server. Do not open index.html using a file URL.

```powershell
npm test
npm run build
```

## First session

1. Open **Media**. Upload individual floor, ceiling and wall MP4 files, or choose **Unified canvas** for a single source. H.264 MP4 is recommended. Drag-and-drop and file-picker loading use browser object URLs; user media is never sent to a server.
2. **Load motion test** loads an included, generated 8-second H.264 calibration clip. This is useful for verifying all surfaces before loading client content.
3. Use Play/Pause, Restart, the timeline, loop, mute and speed. Space toggles playback when a form control does not have focus. The longest active clip sets the timeline. With loop enabled, shorter clips repeat independently.
4. Use **Mapping** to select a surface and edit the source rectangle in normalized UVs or source pixels. Coordinates originate at the source's top left. Reduce width/height before moving a full-frame crop. Flip, rotate, offset, scale and brightness are independent per surface.
5. Continuous wall mode maps one virtual image across the full wall and crops it around physical openings. Independent wall-section mode supports a separate file for each section. Unified mode always uses one shared HTMLVideoElement and continuous wall mapping, regardless of the previously selected independent-wall mode.
6. Choose a camera preset, orbit with left-drag, pan with right-drag and zoom with the wheel. In Walk mode click the prompt, then use WASD and Shift. Mouse look uses pointer lock where supported; embedded browsers can instead use viewport drag. Escape releases walking and restores presentation controls. Walking stays above the floor and within the gallery bounding rectangle; this is not a full collision/egress simulator.
7. The eye icon hides UI for presentation. Escape restores it. The camera icon saves the current viewpoint.
8. **Architecture** exposes dimensions, wall segments, reference overlays, model import, measurement provenance and calibration helpers. Select a named object for move/rotate/scale gizmos. Transform changes commit when the gizmo is released. Undo retains the last 30 edits; reset restores initial geometry and mapping.
9. Export scene JSON or mapping JSON to keep edits. Import validates numerical dimensions, transforms and mapping rectangles. Scene JSON includes saved cameras. Camera-only JSON is an export for external use. Media files, reference images, imported models and lighting/UI session preferences are not embedded in JSON and must be reloaded/set in a new browser session.

## Direction 1 — Color Echoes

The default **Flowing gradients** preview animates blue, white and black gradients with a restrained pink accent across wall, floor and ceiling. No silhouettes or footprints are shown. **Pause gradients** freezes the animation. Choose **Uploaded media / atmosphere** to return to the video and calibration workflow.

## Direction 2 — Hidden Worlds

Choose **Direction 2 / Hidden Worlds** in the toolbar to map an animated flashlight-reveal concept onto the room. Blue contour ribbons animate on floor, ceiling and wall. Three warm-edged circular masks reveal steel framing with moving elevators, an animated city, and turning clockwork. These are generated LED pixels, with no flashlight beam or spotlight illuminating the architecture. Door apertures remain excluded from the LED imagery.

**Auto demo** simulates three tracked aiming positions. **Aim with pointer** raycasts the cursor onto the actual LED wall; the reveal disappears over doors/windows and cycles hidden scenes every ten seconds. Orbit rotation/panning is disabled while aiming; use camera presets or return to Auto demo to reposition. Pause reveals freezes the animation while keeping aiming active. Direction 1 restores the normal media/pattern workflow. This is a live procedural previsualization, not exported video or a hardware tracking integration. The reference image is not distributed with the site.

## Architectural basis

All five supplied PDF sheets were visually reviewed and their text extracted. No drawing pixel distances were used as measurements. The user’s concept images guide materials and viewing direction, not dimensions. Neither image is baked into a surface.

| Feature | Default | Drawing source |
| --- | --- | --- |
| Floor | 22 ft × 100 ft (6.7056 × 30.48 m) | p1: SEA_1269_GA_4_133 H; p4: 4_290 E |
| Ceiling | 22 ft 2 in × 100 ft 1 in (6.7564 × 30.5054 m) | p5: 4_633 J; p2–4 sections |
| Main ceiling face datum | 22 ft 6 in AFFL (6.858 m), provisional visual interpretation | p2–5 |
| Lower soffit | 21 ft 6 in AFFL (6.5532 m) | p2–5 |
| Core-side upper wall zone | 50 ft 10 in (15.494 m) | p4 section B, user-selected basis |
| Conflicting newer wall extent | 53 ft 8 in (16.3576 m) | p5 RCP dated 2025-10-29 |
| Solid wall lengths between openings | 21 ft 8 in; 14 ft 3 in; 5 ft 3 in | p1 plan |
| Wall build-up | 16 in (0.4064 m) | p1, p2, p5 |
| Wall / floor diffuser gap | 2 in (0.0508 m) | p1, p4 |
| Perimeter diffuser | 1 ft (0.3048 m) | p1, p2, p5 |
| Floor assembly | 15 3/4 in (0.40005 m) | p2–4 |
| Ceiling assembly | 7 7/8 in (0.200025 m) | p2–4 |

The printed floor length is **100 ft**, correcting the brief's tentative 100 ft 1 in. Only the ceiling uses 100 ft 1 in.

The central LED wall is on X-negative, with exterior glazing opposite at X-positive; Z is the gallery length and Y is vertical. The floor datum is Y=0. The model's local axes are not registered to survey north.

The LED side has a continuous opaque building core, recessed solid doors and a supporting tower below the deck. Glazing is limited to the opposite long side and the two ends. A procedural New York-style city surrounds those three views, with masonry setbacks, glass towers, spires and illuminated windows that respond to day/dusk/night settings. The three City camera presets inspect each glazed side. Building positions, core depth and the approximate 290 m deck elevation are illustrative context, not surveyed geometry. Supplied RFP imagery is not bundled in the public site.

**Coordination required:** The newer RCP and older wall elevation conflict. The user selected the older 50 ft 10 in wall elevation on 2026-11-02. Its absolute Z placement is estimated. Two placeholder opening widths (1.3144 m and 1.632 m) divide the remaining 2.9464 m in approximately the prior ratio; these widths are estimates, not recovered dimensions. Opening height uses the 9 ft 7 in section callout provisionally. The LED ceiling face uses 22 ft 6 in AFFL without subtracting the assembly twice; final assembly/finished-face datums need coordination. Columns, mullions, surrounding floor depth, stairs and facade profiles are procedural approximations. The skyline is illustrative, not a registered New York panorama. All of these limitations are recorded in `src/config/scene.ts` and shown in Architecture → Drawing measurements & confidence.

Wall headers and solid sections are separate meshes. There is no LED geometry in the two doorway apertures. Changes to individual section boundaries can deliberately change those gaps.

## Implementation

- `src/config/scene.ts`: dimension defaults, provenance, camera presets, import validation.
- `src/stores/scene.ts`: editable configuration, undo history and session UI state.
- `src/stores/media.ts`: video lifecycle, master transport, active sources, drift correction and cleanup.
- `src/utils/mapping.ts`: crop/rotation/flip math and continuous wall coordinates.
- `src/utils/patterns.ts`: generated labeled calibration grid and default atmospheric artwork.
- `src/components/Scene.tsx`: procedural architecture, LED meshes, camera navigation, transforms, environment and model rendering.
- `src/App.tsx`: client controls, local imports and exports.

VideoTexture objects are shared between wall meshes using the same source. Per-mesh UV buffers prevent changing one texture's crop from unintentionally changing another surface. Videos use unlit materials. Bloom and light spill are approximate; no physically accurate indirect illumination or real-time reflection tracing is performed. Pixel aspect ratio is assumed square; source content is fitted according to the user’s mapping.

GLB and self-contained glTF imports preserve the imported hierarchy under Imported_Model. External-resource glTF bundles are not supported by the single-file picker. Disable Procedural architecture to use an imported architectural model while retaining the independent LED layer. Imported nested meshes retain names but the UI transforms the imported model as a group. Models are assumed to use meters.

## Verification

- TypeScript and production Vite build passed.
- 11 automated tests cover UV cropping, top-left coordinate conversion, mirroring, rotation, offset, continuous wall coordinates, configuration round-trip, invalid dimensions, printed dimensions and doorway coverage.
- Browser verified: local MP4 picker loading, metadata, three simultaneous independent textures, unified source playback, crop/flip controls, looping, pause/restart, presentation/Escape, height edit/undo, transform selection and walking fallback.
- Local HTTP response: 200. Desktop 1440×900 layout and narrow embedded panel inspected.
- Dependency audit after updates: zero reported vulnerabilities.
- GLB imports, reference-image alignment, large production-resolution videos, arbitrary codecs and GPU-specific performance require project-specific validation. Independent video timing is best effort, not frame-accurate. Frame rates are intentionally not guessed from unreliable browser metadata.

A desktop GPU/browser with WebGL2 is recommended. The production bundle is approximately 1.36 MB before compression, primarily the 3D renderer and controls. Rendering resolution is capped at 1.5 device-pixel ratio to limit GPU load.

Architecture includes a drawing-baseline audit and **Restore LED drawing dimensions**. It detects edited dimensions and LED object transforms; restoration preserves content mappings and has Undo support. Matching this baseline does not resolve the documented wall/doorway and finished-face uncertainties.

## Exterior building form

The BuildingShell follows the supplied tower references with a broad podium, stepped lower wings, shoulder, slender upper shaft and enlarged observation crown with terraces and a magenta collar. Use **Building / Full Tower** and **Building / Crown** camera presets. Exterior heights, offsets and facade details are visual approximations; the LED floor, ceiling and selected wall dimensions are unchanged.
