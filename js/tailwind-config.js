/* =============================================================================
   tailwind-config.js
   Custom Tailwind theme (Play CDN). Must load AFTER the Tailwind <script> tag.
   Each colour here is a section background that the scroll observer swaps to.
   ============================================================================= */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        heroBg: '#F5F5F7', // Hero / intro
        proj1:  '#1C2541', // OneConnect
        proj2:  '#0B3C5D', // Diagnostics
        proj3:  '#2E1C2B', // Connected App
        proj4:  '#1A1D20', // System Arch
        proj5:  '#16211E', // Photography
      }
    }
  }
};
