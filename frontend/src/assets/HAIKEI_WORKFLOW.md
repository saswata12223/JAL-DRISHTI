# Haikei SVG Asset Integration Workflow for Jal Drishti

Haikei (https://haikei.app) generates clean, resolution-independent SVG backgrounds, waves, blobs, grids, and layered waves.

### How to Add Haikei SVG Assets to Jal Drishti:

#### Method 1: Component Inline SVGs (Recommended for dynamic styling / Yale Blue theme)
1. Generate SVG in Haikei (e.g., Layered Waves, Blob Scene, Topographic Grids).
2. Save/Export the `.svg` file into `frontend/src/assets/svg/<graphic-name>.svg`.
3. Import into React components:
   ```jsx
   import WaveBackground from '../assets/svg/layered-waves.svg?react';
   // OR import as raw URL:
   import waveUrl from '../assets/svg/layered-waves.svg';
   ```

#### Method 2: Public Static Assets (Recommended for CSS `background-image`)
1. Export the `.svg` file into `frontend/public/assets/svg/<graphic-name>.svg`.
2. Reference directly in CSS or JSX:
   ```jsx
   <div className="bg-[url('/assets/svg/layered-waves.svg')] bg-cover bg-no-repeat" />
   ```

### Color Palette for Haikei Generation:
- **Primary / Dominant**: `#0F4C81` (Yale Blue)
- **Background**: `#F8FAFC` (Snow White)
- **Accent**: `#8FD3E8` (Aqua Blue)
- **Subtle Linework / Overlays**: `rgba(15, 76, 129, 0.05)` to `rgba(15, 76, 129, 0.15)`
