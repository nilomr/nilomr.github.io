/* ================================================================
   NILO MERINO RECALDE — Site Interactions
   ================================================================ */

(function () {
  'use strict';

  // ── Work item expand/collapse ──────────────────────────────────

  function initWorkItems() {
    var headers = document.querySelectorAll('.work-header');

    headers.forEach(function (header) {
      header.addEventListener('click', function () {
        toggle(header);
      });

      header.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle(header);
        }
      });
    });
  }

  function toggle(header) {
    var isExpanded = header.getAttribute('aria-expanded') === 'true';
    var body = header.nextElementSibling;

    // Close all others
    document.querySelectorAll('.work-header').forEach(function (h) {
      if (h !== header) {
        h.setAttribute('aria-expanded', 'false');
        h.nextElementSibling.setAttribute('aria-hidden', 'true');
        h.nextElementSibling.classList.remove('open');
      }
    });

    // Toggle current
    header.setAttribute('aria-expanded', String(!isExpanded));
    body.setAttribute('aria-hidden', String(isExpanded));
    body.classList.toggle('open', !isExpanded);
  }

  // ── Scroll reveal ──────────────────────────────────────────────

  function initScrollReveal() {
    var targets = document.querySelectorAll('.work-item, .contact');

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    targets.forEach(function (el) { observer.observe(el); });
  }

  // ── Init ───────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    initWorkItems();
    initScrollReveal();
  });
})();
