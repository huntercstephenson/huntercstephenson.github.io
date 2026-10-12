/* =============================================================================
   modal.js  –  "View System Spec" pop-up
   openModal() / closeModal() are global because the buttons in index.html call
   them with inline onclick="" attributes.
   ============================================================================= */
(function () {
  'use strict';

  const modal      = document.getElementById('spec-modal');
  const modalCard  = document.getElementById('modal-card');
  const modalTitle = document.getElementById('modal-title');
  const modalBody  = document.getElementById('modal-body');

  // Fill in the text and fade/scale the card in
  window.openModal = function (title, description) {
    modalTitle.textContent = title;
    modalBody.textContent  = description;
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modalCard.classList.remove('scale-95');
    modalCard.classList.add('scale-100');
  };

  // Fade/scale the card out
  window.closeModal = function () {
    modal.classList.add('opacity-0', 'pointer-events-none');
    modalCard.classList.remove('scale-100');
    modalCard.classList.add('scale-95');
  };

  // Escape key closes the modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.closeModal();
  });
})();
