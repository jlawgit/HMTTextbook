/**
 * page-counter.js  —  SmartTextbook HMT (github.com/jlawgit/HMTTextbook)
 *
 * Tracks and displays per-page view counts.
 * Provider: MaayanLab CountAPI  (github.com/MaayanLab/countapi)
 *   Base URL : https://countapi.maayanlab.cloud
 *   Hit      : POST /rpc/hit   { "key": "<id>" }   → increments + returns count
 *   Read     : GET  /rpc/get?key=<id>              → returns current count
 *
 * Each page gets a unique key built from the site prefix + page filename.
 * Counts live on countapi.maayanlab.cloud's servers permanently and survive
 * any local file edits or GitHub Pages re-deployments.
 *
 * Fallback: if the API is unreachable the script increments a localStorage
 * estimate so a number is always displayed.
 */
(function () {
  'use strict';

  /* ── Configuration ──────────────────────────────────────────────── */
  var BASE_URL  = 'https://countapi.maayanlab.cloud';
  var KEY_PFX   = 'hmttextbook-jlawgit-';   // prefix; keep stable forever

  /** Short stable key from current page filename. */
  function pageKey() {
    var seg = window.location.pathname.split('/').pop();
    return KEY_PFX + ((seg ? seg.replace(/\.html$/i, '') : 'index') || 'index');
  }

  /**
   * Parse count out of whatever postgrest / countapi returns.
   * Handles:  42  |  "42"  |  {"value":42}  |  {"count":42}  |  [42]  |  [{"value":42}]
   */
  function parseCount(raw) {
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'string' && !isNaN(raw)) return Number(raw);
    if (Array.isArray(raw) && raw.length) return parseCount(raw[0]);
    if (raw && typeof raw === 'object') {
      if (raw.value != null) return Number(raw.value);
      if (raw.count != null) return Number(raw.count);
      if (raw.hits  != null) return Number(raw.hits);
      /* postgrest may wrap in first numeric key */
      var keys = Object.keys(raw);
      if (keys.length === 1) return Number(raw[keys[0]]);
    }
    return null;
  }

  /* ── Inject CSS once ────────────────────────────────────────────── */
  (function injectStyles() {
    if (document.getElementById('pvc-style')) return;
    var s = document.createElement('style');
    s.id = 'pvc-style';
    s.textContent = [
      '.pvc-bar{display:flex;align-items:center;justify-content:center;',
      'gap:.4rem;padding:.5rem 0 .25rem;font-size:.78rem;',
      'color:#9ca3af;letter-spacing:.03em}',
      '.pvc-bar .pvc-icon{font-size:.9rem}',
      '.pvc-bar .pvc-count{font-variant-numeric:tabular-nums;',
      'font-weight:600;color:#d4a017}',
      '.pvc-bar .pvc-offline{opacity:.55;font-style:italic}'
    ].join('');
    document.head.appendChild(s);
  })();

  /* ── Inject counter widget into footer ──────────────────────────── */
  function injectWidget() {
    if (document.getElementById('pvc-widget')) return;
    var footer = document.querySelector('footer.footer');
    if (!footer) return;
    var bar = document.createElement('div');
    bar.id        = 'pvc-widget';
    bar.className = 'pvc-bar';
    bar.innerHTML =
      '<span class="pvc-icon" aria-hidden="true">👁</span>' +
      '<span>Page views:&nbsp;' +
        '<span class="pvc-count" id="pvc-count">…</span>' +
      '</span>';
    footer.appendChild(bar);
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  function render(n, offline) {
    var el = document.getElementById('pvc-count');
    if (!el) return;
    el.textContent = Number(n).toLocaleString();
    if (offline) {
      el.classList.add('pvc-offline');
      el.title = 'Estimated locally — counter API temporarily unreachable';
    }
  }

  /* ── Main: hit API then display ─────────────────────────────────── */
  function track() {
    injectWidget();
    var key      = pageKey();
    var storeKey = 'pvc_' + key;

    fetch(BASE_URL + '/rpc/hit', {
      method  : 'POST',
      headers : { 'Content-Type': 'application/json' },
      body    : JSON.stringify({ key: key })
    })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      var n = parseCount(data);
      if (n == null) throw new Error('Unrecognised response');
      render(n, false);
      try { localStorage.setItem(storeKey, String(n)); } catch (e) {}
    })
    .catch(function () {
      /* Offline / API unavailable — bump local estimate */
      try {
        var prev  = parseInt(localStorage.getItem(storeKey) || '0', 10);
        var local = (isNaN(prev) ? 0 : prev) + 1;
        localStorage.setItem(storeKey, String(local));
        render(local, true);
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
