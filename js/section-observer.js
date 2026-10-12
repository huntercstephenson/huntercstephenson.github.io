/* =============================================================================
   section-observer.js  –  scroll-driven page theming
   As each section crosses the middle of the screen this script:
     1. fades the <body> background to that section's colour (data-bg)
     2. shows the name/title next to Jack only while on the hero
     3. highlights the matching link in the top nav
   ============================================================================= */
(function () {
  'use strict';

  const viewport      = document.getElementById('viewport');       // the scroll container
  const sections      = document.querySelectorAll('.snap-section');
  const navDots       = document.querySelectorAll('.nav-dot');
  const heroBrandText = document.getElementById('hero-brand-text');

  // Every background class the body can have (so we only swap these and
  // leave any other body classes alone)
  const BG_CLASSES = ['bg-heroBg', 'bg-proj1', 'bg-proj2', 'bg-proj3', 'bg-proj4', 'bg-proj5'];

  /* A section counts as "active" while it overlaps the horizontal centre line
     of the screen (rootMargin trims 50% off the top and bottom).
     This works for the tall photography section too – a plain 50%-visible
     threshold could never be reached by something taller than the screen. */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      // 1. Background colour
      document.body.classList.remove(...BG_CLASSES);
      document.body.classList.add(entry.target.getAttribute('data-bg'));

      // 2. Hero-only brand text
      if (entry.target.id === 'hero') {
        heroBrandText.classList.remove('opacity-0', 'pointer-events-none');
        heroBrandText.classList.add('opacity-100');
      } else {
        heroBrandText.classList.remove('opacity-100');
        heroBrandText.classList.add('opacity-0', 'pointer-events-none');
      }

      // 3. Active nav link
      const index = Array.from(sections).indexOf(entry.target);
      navDots.forEach((dot, i) => {
        dot.classList.toggle('text-blue-500', i === index);
        dot.classList.toggle('font-bold',     i === index);
      });
    });
  }, {
    root: viewport,
    rootMargin: '-50% 0px -50% 0px',
    threshold: 0
  });

  sections.forEach(section => observer.observe(section));
})();
