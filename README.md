# Lake Peigneur — The Lake That Swallowed a Drilling Rig

A roughly 60-second vertical animated short built with **Remotion + Three.js + React Three Fiber**. The story is an original reenactment of the November 20, 1980 Lake Peigneur disaster in Louisiana.

## Render on GitHub Actions — ZIP upload workflow

This project is prepared for the ZIP-first workflow: **upload `LakePeigneur-Short.zip` itself to the repository root; do not manually extract it.** GitHub Actions will extract it in the runner, generate the narration and soundtrack, render the MP4, and upload a downloadable artifact.

1. Upload `LakePeigneur-Short.zip` to the root of your GitHub repository.
2. Make sure the repository has the companion ZIP-upload workflow at `.github/workflows/render.yml`. The companion file is supplied separately as `RENDER_WORKFLOW_ZIP_ROOT.yml` because GitHub cannot execute a workflow that exists only inside a ZIP that has not yet been extracted.
3. Commit both files to the `main` branch, or open **Actions → Render Lake Peigneur Short (ZIP upload) → Run workflow**.
4. Wait for the workflow to finish, open the successful run, and download the `lake-peigneur-mp4` artifact.
5. Extract the artifact ZIP to get `lake-peigneur.mp4`.

The default output is 1080 × 1920, 30 FPS, H.264. The workflow has a 300-minute job timeout because software WebGL rendering can take a while on GitHub-hosted runners. A longer timeout provides more time; it does not make rendering faster.

For a quick low-resolution run, use scale `0.5`. For a higher-resolution 1440 × 2560 export, use `1.3333`.

### Alternative: upload the extracted project

If you prefer to extract the project yourself, upload the folder contents (including `.github/workflows/render.yml`) to the repository root. That workflow runs on pushes to `main` and can also be started from the Actions tab.

## Local commands (optional)

```bash
npm install
python -m pip install edge-tts numpy
# Install ffmpeg and espeak-ng on your operating system.
npm run audio
npm run dev
npm run render
```

## Project structure

```text
.github/workflows/render.yml      Cloud rendering + MP4 artifact upload
scripts/make_audio.py             Narration, original music/SFX mix, shot timing
public/                           Generated audio and timing are created here in CI
src/index.ts                      Remotion entry point
src/Root.tsx                      Composition registration and dynamic duration
src/videos/lakepeigneur/
  LakePeigneur.tsx                Main Remotion composition and camera rig
  story.ts                        Shot plan, camera path, transitions and timing helpers
  world.ts / world-scene.tsx      3D environment and animated disaster set pieces
  build.ts                        Shared low-poly geometry helpers
  toon.ts                         Original hand-drawn character texture generator
  cast.ts / cast-cards.tsx        Lit 2D character billboards in the 3D world
  lights.ts                       Day, storm and golden-hour lighting presets
  shade.ts                        Shared palette
  ink.ts / grade.ts               Outline material and final color grade
  lensblur.ts                     Thin-lens depth-of-field passes
```

## Production notes

- No captions or on-screen labels; narration carries the story.
- The characters and environments are original stylized reenactments, not archival footage.
- The story uses shot timing generated from the actual narration clips, so visual beats follow the voice.
- The audio generator uses an online neural voice when available and falls back to `espeak-ng` if it cannot connect.
- The composition is designed for a vertical 9:16 frame and uses smooth camera glides, dutch tilts, a brief impact flash, atmospheric fog, warm/cool lighting shifts, animated water, the drilling platform, barges, an underground mine cross-section, thin-lens depth of field, and restrained emissive bloom.

## Research and factual notes

The short is based on historical accounts from the University of Louisiana at Lafayette Special Collections, the Mine Safety and Health Administration's Jefferson Island mine inundation report, and contemporary 1980 reporting. The exact cause and responsibility were disputed in contemporary reporting; the script describes the physical sequence without assigning blame.

Sources:
- University of Louisiana at Lafayette, Special Collections: https://library.louisiana.edu/node/2548
- MSHA, *Report of Mine Inundation* (Jefferson Island, 1980): https://usminedisasters.miningquiz.com/saxsewell/1980_jefferson_island.pdf
- UPI Archives, November 21, 1980: https://www.upi.com/Archives/1980/11/21/Drilling-rig-breaks-into-salt-mine-cavity-draining-lake/6665343630800/
- UPI Archives, November 28, 1980: https://www.upi.com/Archives/1980/11/28/Gas-well-flame-goes-out-at-salt-dome-site/4517344235600/

## Rendering policy

The source project and GitHub Actions workflow are provided. The video is not rendered or exported in this workspace; GitHub Actions creates the MP4 artifact after the project is uploaded.
