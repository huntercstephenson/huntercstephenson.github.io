/* =============================================================================
   photo-scroll.js  –  Photography section
   -----------------------------------------------------------------------------
   WHAT IT DOES
   1. Finds your photos automatically:  imagescroll/1.png, 2.png, 3.png …
      (stops at the first number that doesn't exist – no gaps allowed)
      plus the Instagram profile header:  imagescroll/igheader.png
   2. Builds an Instagram-style page (header + 3-column square grid).
   3. Shows it INSIDE the iPhone's screen, with the phone popping out of the
      top of the placeholder box and cropped at the bottom.
   4. As you scroll (two phases):
        PHASE A – "expand": the phone fades away while the sheared grid
                  magnifies and straightens until it fills the box's width
                  and the full screen height.
        PHASE B – "browse": the grid scrolls upward through all the photos.
      The whole thing is scroll-linked, so scrolling back up reverses it.

   HOW THE "PINNED" EFFECT WORKS
   The section is made very tall; inside it, #photo-stage is position:sticky
   so it stays on screen while we use the extra scroll distance to drive the
   animation. This script calculates that distance and sets the section height.

   WHERE TO TWEAK  →  the CONFIG block directly below.
   ============================================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------------
     CONFIG  (safe to edit)
     --------------------------------------------------------------------------- */
  const CONFIG = {
    // --- Image discovery ---
    imageFolder:     'imagescroll',   // folder that holds the photos
    imageExt:        'png',           // 1.png, 2.png, …
    headerFile:      'igheader.png',  // Instagram profile screenshot (any size)
    maxImages:       300,             // safety cap on how many numbers to probe
    probeBatchSize:  12,              // how many numbers to check at once
    placeholderTiles: 12,             // grey tiles shown if NO images are found

    // --- Phone placement relative to the placeholder box ---
    phoneHeightRatio: 1.25,  // phone height  ÷ box height (bigger = bigger phone)
    phoneTopOutRatio: 0.20,  // how far the phone sticks OUT of the box top (÷ box height)
                             // The bottom crop = heightRatio − topOutRatio − 1  (≈ 0.05)

    // --- Scroll feel ---
    expandScreens:   0.9,    // Phase A length, in screen heights of scrolling
    phoneFadeStart:  0.04,   // phone starts fading at this Phase-A progress (0–1)
    phoneFadeEnd:    0.40,   // …and is fully gone by this point

    // --- Header nav ---
    hideNavWhileGridActive: true  // fade the top nav pill so it doesn't cover the IG header
  };

  /* ---------------------------------------------------------------------------
     PHONE IMAGE MEASUREMENTS  (in pixels of assets/iphone-clay.png)
     The screen of the PNG is a transparent parallelogram. These numbers were
     measured from the file; only change them if you swap in a different phone.
     --------------------------------------------------------------------------- */
  const PHONE = {
    width:  1344,                // full PNG size
    height: 1350,
    screenTL: [646.6,   30],     // screen top-left corner
    screenTR: [1297.3,  30],     // screen top-right corner
    screenBL: [3.8,   1254],     // screen bottom-left corner
    bleed: 1,                    // grow the grid slightly under the bezel to hide edge seams
    screenAspect: 2622 / 1206,   // real iPhone 16 Pro screen height ÷ width
    cornerRadius: 0.13           // screen corner rounding, as a fraction of screen width
  };

  /* ---------------------------------------------------------------------------
     ELEMENTS
     --------------------------------------------------------------------------- */
  const viewport = document.getElementById('viewport');      // scroll container
  const section  = document.getElementById('photography');   // tall section
  const stage    = document.getElementById('photo-stage');   // sticky 100vh stage
  const box      = document.getElementById('photo-box');     // the placeholder box
  const fx       = document.getElementById('photo-fx');      // overlay (clips the bottom)
  const layer    = document.getElementById('photo-layer');   // the "screen" (transformed)
  const content  = document.getElementById('photo-content'); // scrolls inside the layer
  const phone    = document.getElementById('photo-phone');   // iPhone PNG
  const nav      = document.getElementById('main-nav');      // top nav pill
  if (!section || !stage || !box) return;

  /* ---------------------------------------------------------------------------
     SMALL MATH HELPERS
     --------------------------------------------------------------------------- */
  const clamp  = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const lerp   = (a, b, t)   => a + (b - a) * t;
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const easeInOutCubic = t   => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  /* ---------------------------------------------------------------------------
     1. BUILD THE INSTAGRAM PAGE
     --------------------------------------------------------------------------- */

  // Resolves true/false depending on whether an image URL loads
  function probe(url) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload  = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  // Looks for 1.png, 2.png … in batches and returns the list of URLs that exist
  async function discoverImages() {
    const urls = [];
    const { imageFolder, imageExt, maxImages, probeBatchSize } = CONFIG;
    for (let start = 1; start <= maxImages; start += probeBatchSize) {
      const batch   = Array.from({ length: probeBatchSize }, (_, i) => `${imageFolder}/${start + i}.${imageExt}`);
      const results = await Promise.all(batch.map(probe));
      const miss    = results.indexOf(false);
      if (miss === -1) { urls.push(...batch); }
      else             { urls.push(...batch.slice(0, miss)); break; }   // first gap = end of the list
    }
    return urls;
  }

  // Creates the header image + grid inside #photo-content
  async function buildContent() {
    // --- Profile header (natural size, full width, never cropped) ---
    const header = document.createElement('img');
    header.id = 'ig-header';
    header.alt = 'Instagram profile';
    header.draggable = false;
    header.src = `${CONFIG.imageFolder}/${CONFIG.headerFile}`;
    header.onerror = () => {                       // missing file → friendly placeholder
      const ph = document.createElement('div');
      ph.className = 'ig-header-placeholder';
      ph.textContent = `${CONFIG.imageFolder}/${CONFIG.headerFile}`;
      header.replaceWith(ph);
    };
    content.appendChild(header);

    // --- Photo grid ---
    const grid = document.createElement('div');
    grid.id = 'photo-grid';
    content.appendChild(grid);

    const urls = await discoverImages();
    if (urls.length) {
      urls.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = `Photo ${i + 1}`;
        img.decoding = 'async';
        img.draggable = false;
        grid.appendChild(img);
      });
    } else {
      for (let i = 1; i <= CONFIG.placeholderTiles; i++) {   // no images yet → preview tiles
        const tile = document.createElement('div');
        tile.className = 'tile-placeholder';
        tile.textContent = i;
        grid.appendChild(tile);
      }
    }
  }

  /* ---------------------------------------------------------------------------
     2. GEOMETRY  (recalculated on load / resize / content size change)
     All coordinates are relative to the top-left of #photo-stage.
     --------------------------------------------------------------------------- */
  const g = {};  // holds the latest measurements

  function measure() {
    const s = stage.getBoundingClientRect();
    const b = box.getBoundingClientRect();

    // Placeholder box
    g.stageH = s.height;
    g.bx = b.left - s.left;
    g.by = b.top  - s.top;
    g.bw = b.width;
    g.bh = b.height;

    // Phone: sticks out of the box top, cropped at the bottom, centred horizontally
    g.ph = g.bh * CONFIG.phoneHeightRatio;
    g.pw = g.ph * (PHONE.width / PHONE.height);
    g.px = g.bx + (g.bw - g.pw) / 2;
    g.py = g.by - g.bh * CONFIG.phoneTopOutRatio;

    // The grid layer's final size: box width × full screen height.
    // Its start size = the phone screen's real proportions (so photos look square on the phone).
    g.screenH = g.bw * PHONE.screenAspect;           // layer height needed to fill the phone screen
    g.layerH  = Math.max(g.screenH, g.stageH);

    // Screen quad in stage coordinates (grown by `bleed`, then scaled image→stage)
    const m   = g.pw / PHONE.width;                  // image px → stage px
    const bl  = PHONE.bleed;
    const tl  = PHONE.screenTL, tr = PHONE.screenTR, bt = PHONE.screenBL;
    const w   = tr[0] - tl[0];                       // screen width in image px
    const h   = bt[1] - tl[1];                       // screen height in image px
    const k   = (bt[0] - tl[0]) / h;                 // shear: x shift per px of y
    const TLx = tl[0] - bl - k * bl, TLy = tl[1] - bl;
    const W2  = w + 2 * bl,          H2  = h + 2 * bl;

    // Affine matrix that maps the layer (bw × screenH) onto that quad
    g.m0 = {
      a: (W2 * m) / g.bw,   b: 0,
      c: (k * H2 * m) / g.screenH,  d: (H2 * m) / g.screenH,
      e: g.px + TLx * m - g.bx,     f: g.py + TLy * m
    };

    // Scroll lengths
    g.contentH = content.offsetHeight;
    g.A = Math.max(1, CONFIG.expandScreens * g.stageH);        // Phase A (expand)
    g.B = Math.max(0, g.contentH - g.stageH);                   // Phase B (browse)
  }

  // Applies the static (non-scroll) sizes/positions
  function place() {
    phone.style.width  = g.pw + 'px';
    phone.style.height = g.ph + 'px';
    phone.style.left   = g.px + 'px';
    phone.style.top    = g.py + 'px';

    layer.style.left   = g.bx + 'px';
    layer.style.width  = g.bw + 'px';
    layer.style.height = g.layerH + 'px';

    // Section height = one pinned screen + total scroll distance
    section.style.height = (g.stageH + g.A + g.B) + 'px';
  }

  /* ---------------------------------------------------------------------------
     3. SCROLL-DRIVEN RENDER  (runs once per animation frame while scrolling)
     --------------------------------------------------------------------------- */
  function render() {
    // How far (px) the pinned stage has been scrolled into the section
    const scrolled = clamp(
      viewport.getBoundingClientRect().top - section.getBoundingClientRect().top,
      0, g.A + g.B
    );

    const pA = clamp(scrolled / g.A, 0, 1);   // Phase A progress (linear)
    const t  = easeInOutCubic(pA);            // Phase A progress (eased)
    const m0 = g.m0;

    // Grid layer: blend from "sheared in phone" → identity (flat, full size)
    layer.style.transform =
      `matrix(${lerp(m0.a, 1, t)}, ${lerp(m0.b, 0, t)}, ${lerp(m0.c, 0, t)}, ` +
      `${lerp(m0.d, 1, t)}, ${lerp(m0.e, 0, t)}, ${lerp(m0.f, 0, t)})`;

    // Layer height window: phone-screen height → full screen height
    // (rounded corners match the phone's screen at the start and square off as it expands)
    layer.style.clipPath =
      `inset(0 0 ${lerp(g.layerH - g.screenH, g.layerH - g.stageH, t)}px 0 round ${lerp(g.bw * PHONE.cornerRadius, 0, t)}px)`;

    // Overlay crop line: starts at the box bottom (phone cropped), opens to the screen bottom
    const cropStart = Math.max(0, g.stageH - (g.by + g.bh));
    fx.style.clipPath = `inset(0 0 ${lerp(cropStart, 0, t)}px 0)`;

    // Phone fades out early in Phase A
    phone.style.opacity = 1 - smooth(CONFIG.phoneFadeStart, CONFIG.phoneFadeEnd, pA);

    // Phase B: scroll the content upward
    const offset = clamp(scrolled - g.A, 0, g.B);
    content.style.transform = `translate3d(0, ${-offset}px, 0)`;

    // Hide the top nav pill while the grid column is open
    if (nav && CONFIG.hideNavWhileGridActive) {
      nav.classList.toggle('nav-hidden', pA > 0.2);
    }
  }

  /* ---------------------------------------------------------------------------
     4. WIRING
     --------------------------------------------------------------------------- */
  let ticking = false;
  function onScroll() {                       // throttle to one render per frame
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; render(); });
  }

  function layout() {
    // Skip until the box has a real size (Tailwind's CDN styles can arrive a moment after this script)
    const b = box.getBoundingClientRect();
    if (b.width < 1 || b.height < 1) return;
    measure(); place(); render();
  }

  viewport.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);

  // Re-measure whenever the grid's height changes (images/header finishing loading)
  // or the box changes size (styles arriving, window resizing, fonts loading)
  const ro = new ResizeObserver(layout);
  ro.observe(content);
  ro.observe(box);

  // Go!
  layout();
  buildContent().then(layout);
})();
