/* =============================================================================
   jack.js  –  Jack logo hover animation (top-left of the header)
   Hover  → plays the "spin" animation
   Leave  → plays the "unspin" animation
   ============================================================================= */
(function () {
  'use strict';

  const jack = document.getElementById('jack');
  if (!jack) return;

  // Pre-load both animations so there's no delay on first hover
  ['jack-spin-alpha.webp', 'jack-unspin-alpha.webp'].forEach(src => { new Image().src = src; });

  // The ?timestamp forces the browser to restart the animated image from frame 1
  jack.addEventListener('pointerenter', () => jack.src = 'jack-spin-alpha.webp?'   + Date.now());
  jack.addEventListener('pointerleave', () => jack.src = 'jack-unspin-alpha.webp?' + Date.now());
})();
