/**
 * page-counter.js  —  SmartTextbook HMT (github.com/jlawgit/HMTTextbook)
 *
 * Tracks and displays per-page view counts using CountAPI.
 * Counts are stored externally on CountAPI's servers and survive any local
 * file edits or GitHub Pages deployments.
 *
 * If CountAPI is unreachable (offline / rate-limit), the script falls back
 * to a localStorage estimate so a number is always shown.
 *
 * To change counter provider: update COUNTER_URL() only.
 */
(function () {
  'use strict';

  /* ── Configuration ──────────────────────────────────────────────── */
  var NAMESPACE = 'hmttextbook-jlawgit-v1'; // unique to this site; never change

  /** Derive a short, stable key from the current page filename. */
  function pageKey() {
    var seg = window.location.pathname.split('/').pop();
    return (seg ? seg.replace(/\.html$/i, '') : 'index') || 'index';
  }

  /** CountAPI endpoint: increments counter and returns { value: N }. */
  function counterUrl(key) {
    return 'https://api.countapi.xyz/hit/' + NAMESPACE + '/' + key;
  }

  /* ── Inject CSS once ────────────────────────────────────────────── */
  (function injectStyles() {
    if (document.getElementById('pvc-style')) return;
    var style = document.createElement('style');
    style.id = 'pvc-style';
    style.textContent = [
      '.pvc-bar {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  gap: .4rem;',
      '  padding: .5rem 0 .25rem;',
      '  font-size: .78rem;',
      '  color: #9ca3af;',
      '  letter-spacing: .03em;',
      '}',
      '.pvc-bar .pvc-icon { font-size: .9rem; }',
      '.pvc-bar .pvc-count {',
      '  font-variant-numeric: tabular-nums;',
      '  font-weight: 600;',
      '  color: #d4a017;',        /* gold accent, matches textbook theme */
      '}',
      '.pvc-bar .pvc-offline { opacity:.55; font-style:italic; }'
    ].join('\n');
    document.head.appendChild(style);
  })();

  /* ── Inject counter widget into footer ──────────────────────────── */
  function injectWidget() {
    var footer = document.querySelector('footer.footer');
    if (!footer) return;                     // no footer found — skip
    if (document.getElementById('pvc-widget')) return; // already injected

    var bar = document.createElement('div');
    bar.id        = 'pvc-widget';
    bar.className = 'pvc-bar';
    bar.innerHTML =
      '<span class="pvc-icon" aria-hidden="true">👁</span>' +
      '<span>Page views:&nbsp;<span class="pvc-count" id="pvc-count">…</span></span>';
    footer.appendChild(bar);
  }

  /* ── Render count into widget ───────────────────────────────────── */
  function renderCount(n, offline) {
    var el = document.getElementById('pvc-count');
    if (!el) return;
    el.textContent = Number(n).toLocaleString();
    if (offline) {
      el.classList.add('pvc-offline');
      el.title = 'Estimated locally — counter API temporarily unreachable';
    }
  }

  /* ── Fetch + display ────────────────────────────────────────────── */
  function track() {
    injectWidget();

    var key        = pageKey();
    var localKey   = 'pvc_' + NAMESPACE + '_' + key;

    fetch(counterUrl(key))
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        var n = data && (data.value || data.count || data.hits);
        if (n == null) throw new Error('No count in response');
        renderCount(n, false);
        try { localStorage.setItem(localKey, String(n)); } catch (e) {}
      })
      .catch(function () {
        /* Offline / API down: bump local estimate and show it */
        try {
          var prev  = parseInt(localStorage.getItem(localKey) || '0', 10);
          var local = prev + 1;
          localStorage.setItem(localKey, String(local));
          renderCount(local, true);
        } catch (e) {}
      });
  }

  /* ── Boot ───────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', track);
  } else {
    track();
  }

})();
