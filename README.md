# Concept 051 interactive hero

An interactive automotive showroom with a pinned hero and design section, built with Vite, native CSS, Three.js, and Phosphor icons. FORMA is a working brand name for this prototype.

## Run

```sh
npm install
npm run dev
```

`npm run build` creates the production site in `dist`. `npm run preview` serves that build locally.

## Design

The supplied reference informs the centered copy, minimal navigation, dark studio, blue lighting, and dominant three-quarter car view. Design variance 4, motion intensity 5, visual density 3. The supplied real model is the hero asset. No generated substitute is used.

The 10–100% loading screen waits for both models and the first rendered frame before revealing the hero. Drag or use left/right arrow keys on the focused viewer to orbit. Pinch, Shift + scroll, or + / - zooms; Home resets the camera. Automatic rotation pauses during interaction and resumes after six seconds. Normal scrolling drives a longer pinned orbit and zoom sequence before the design section. The design section includes a pause-motion control. Reduced-motion preferences disable automatic rotation and the animated pinned sequence.

The car and room share one camera. A dark overlay keeps the headline and navigation readable over the environment. Header controls switch camera views, and the design link skips directly to the next section.

## Model

Source files are in `public/models/car`, including the original license. The source title says CC0, while the supplied license file identifies Sketchfab Standard; this project preserves that file rather than relabeling the asset. Credit: Unity Fan, https://sketchfab.com/unityfan777.

The supplied glTF and binary are approximately 13 MB including textures. They are served locally, without a Sketchfab embed. The original invisible shadow plane is excluded from framing calculations. A future deployment can compress geometry/textures for slower connections.

The user-supplied room is `public/models/environment.glb`. The tree's foliage and trunk meshes are hidden at runtime; the original asset is preserved. Baked shadows remain in the room texture. The car is aligned with the central platform.

## Validation

Production build passed. Desktop and 390px mobile room layouts were visually inspected. Loading-to-hero transition, rotation, zoom, section navigation, and disclosure controls were checked in browser. Lighthouse performance has not been measured. Publishing this repository does not deploy a live website.
