# BharatVerse – The Living Legend

> 🎮 **Play now:** https://lk0024709-ux.github.io/Asoda-o23om/ — no install needed, works in any modern browser (desktop + mobile). Deployed automatically to GitHub Pages on every merge to `main` via `.github/workflows/pages.yml`.

A 3D Open-World Indian Heritage Adventure & Exploration game built in **Three.js** (WebGL + PWA / Android WebView ready) using a clean **7-Layer Modular Architecture**, spanning **12 realized Indian city hubs** connected by drivable highways and fast travel.

## 7-Layer Modular Architecture

```text
├── index.html                                  # Main shell, Three.js importmap, Rangoli HUD, Map, Journal, Photo Mode & Hearing UI
├── manifest.json / sw.js                       # PWA / Android WebView offline cache manifest & Service Worker
├── css/bharatverse.css                         # Teak-wood, antique brass & rangoli-motif responsive UI + mobile dual-stick styles
└── src/
    ├── main.js                                 # 7-Layer orchestrator & main requestAnimationFrame loop
    ├── layer1_core/
    │   ├── core_engine.js                      # Three.js ACESFilmic renderer, UnrealBloom + FXAA EffectComposer, device-tier auto-detect, celestial day/night
    │   ├── pbr_assets.js                       # Procedural PBR texture factory (albedo/bump/roughness) + GLTF/Draco loader hook
    │   ├── shaders.js                          # Custom GLSL Indian water shader, desert highway heat-haze shader & Aravalli dust particles
    │   └── input_manager.js                    # Desktop (WASD, Mouse look, Shift, E, F, M, J, V, T) + Auto-detect Mobile Dual-Stick Touch
    ├── layer2_world/
    │   ├── pan_india_data.js                   # 12 City Hubs (Ratanpur, Jaipur, Udaipur, Ahmedabad, Varanasi, Khajuraho, Orchha, Gwalior, Hampi, Madurai, Mysore, Kochi)
    │   ├── landmark_builders.js                # Handcrafted PBR 3D Indian monuments with THREE.LOD & THREE.InstancedMesh + Desi ambient street details
    │   └── world_streamer.js                   # Seamless chunk/hub streaming, collision AABBs, festival light choreography & clean GPU disposal
    ├── layer3_physics/
    │   └── physics_interaction.js              # Aarav cloth-sway scarf, Auto-Rickshaw, Royal Enfield Bullet 350, Wooden Boat, Stamina & Teekha Spice risk, Shoes-Off mechanic
    ├── layer4_ai/
    │   └── npc_crowd_system.js                 # 24-min = 24-hr routine clock, Hinglish/regional NPCs, InstancedMesh crowds, cows, monkeys & street dogs
    ├── layer5_narrative/
    │   └── quest_story_system.js               # "The Lost Ledger of Mewar" 5-Act Campaign, 6 Regional Side Quests, Conservation Journal, Samman & 3 Public Hearing Endings
    ├── layer6_ui/
    │   └── ui_manager.js                       # Minimalist Rangoli HUD, Interactive Pan-India Map, Bahi-Khata Journal, Dialogue, Photo Mode (PNG download) & Hearing Finale
    ├── layer7_persistence/
    │   └── save_manager.js                     # IndexedDB ("BharatVerseDB") persistent save/load with localStorage fallback & quality profiles
    └── audio/
        └── bharat_audio.js                     # Procedural Web Audio API Indian Ragas (Sitar/Bansuri), temple bells, Auto horn & Royal Enfield thump
```

> Note: The earlier Babylon.js Udaipur Voxel Open World build is preserved cleanly inside `legacy-udaipur-voxel/`.

## Controls

| Action | Desktop | Mobile |
| :--- | :--- | :--- |
| Move / Drive / Sail | `W A S D` / Arrows | Left Virtual Joystick |
| Look / Orbit Camera | Click & Drag | Right Virtual Joystick |
| Sprint | `Shift` | Push Left Stick Far |
| Interact (Talk, Bells, Food, Clues, Shoes) | `E` | `E · ACT` Button |
| Switch Transport (`Foot / Auto / Enfield / Boat`) | `V` | `RIDE` Button |
| Jump / Vehicle Horn / Bullet Thump | `Space` | — |
| Photo Mode & PNG Postcard Export | `F` | `📷` Button |
| Pan-India Fast Travel Map | `M` | `🗺` Button |
| Bahi-Khata Conservation Journal | `J` | Toolbar Button |
| Shift Time (Dawn / Noon / Golden Hour / Festival Night) | `T` | Toolbar Button |
