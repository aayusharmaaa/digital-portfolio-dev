# Blender Export Guide — Lip Sync Setup

## Shape Keys Required
Your model needs these shape keys (morph targets) for lip sync to work.
The names must match exactly (or update Avatar3D.tsx to match yours):

| Shape Key       | Description              |
|-----------------|--------------------------|
| `mouthOpen`     | Jaw drop — main lip sync |
| `mouthSmile`    | Subtle resting smile     |
| `viseme_aa`     | "ah" sound               |
| `viseme_O`      | "oh" sound               |
| `viseme_PP`     | "p/b/m" sounds           |

You don't need all visemes — just `mouthOpen` is enough for amplitude-driven lip sync.

## Export Settings in Blender
1. File → Export → glTF 2.0 (.glb)
2. Include → Shape Keys ✅
3. Include → Animations ✅  
4. Transform → Y Up ✅
5. Save as `model.glb` → drop into `/public/model.glb`

## Morph Target Names
In Avatar3D.tsx, update these constants to match your Blender shape key names:
```ts
const MOUTH_OPEN = 'mouthOpen';   // your jaw shape key name
const MOUTH_SMILE = 'mouthSmile'; // your smile shape key name
```

## Camera / Scale
The model is positioned at y=-1.5, scale=1.8 — adjust in Avatar3D.tsx
to frame your model correctly (upper body / bust is ideal).
