/* Hashgacha single-page site — tabs, filtering, business modal. */
(function () {
  'use strict';

  var businesses = window.BUSINESSES || [];
  var byId = {};
  businesses.forEach(function (b) { byId[b.id] = b; });

  /* ---------- sticky top bar ---------- */

  var topbar = document.getElementById('topbar');
  function onScroll() {
    topbar.classList.toggle('is-stuck', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */

  var tabsNav = document.getElementById('tabs');
  var navToggle = document.getElementById('navToggle');

  navToggle.addEventListener('click', function () {
    var open = tabsNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  /* ---------- active tab tracking ---------- */

  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var indicator = document.querySelector('.tab-indicator');
  var sections = tabs
    .map(function (t) { return document.querySelector(t.getAttribute('href')); })
    .filter(Boolean);

  function moveIndicator(tab) {
    if (!indicator || !tab || window.innerWidth <= 760) { return; }
    indicator.style.width = tab.offsetWidth + 'px';
    indicator.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
    indicator.classList.add('is-on');
  }

  function setActive(id) {
    var match = null;
    tabs.forEach(function (t) {
      var on = t.getAttribute('href') === '#' + id;
      t.classList.toggle('is-active', on);
      if (on) { match = t; }
    });
    if (match) { moveIndicator(match); }
    else if (indicator) { indicator.classList.remove('is-on'); }
  }

  if ('IntersectionObserver' in window && sections.length) {
    var visible = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });
      var bestId = null, bestRatio = 0;
      Object.keys(visible).forEach(function (id) {
        if (visible[id] > bestRatio) { bestRatio = visible[id]; bestId = id; }
      });
      if (bestId) { setActive(bestId); }
    }, {
      rootMargin: '-45% 0px -45% 0px',
      threshold: [0, 0.01, 0.25, 0.5, 1]
    });
    sections.forEach(function (sec) { observer.observe(sec); });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabsNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      setActive(tab.getAttribute('href').slice(1));
    });
  });

  window.addEventListener('resize', function () {
    var current = document.querySelector('.tab.is-active');
    if (current) { moveIndicator(current); }
  });

  /* ---------- search + category filter ---------- */

  var grid = document.getElementById('bizGrid');
  var search = document.getElementById('bizSearch');
  var noResults = document.getElementById('noResults');
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var activeCat = '';

  function applyFilters() {
    if (!grid) { return; }
    var term = (search ? search.value : '').trim().toLowerCase();
    var shown = 0;

    Array.prototype.forEach.call(grid.children, function (item) {
      var name = item.getAttribute('data-name') || '';
      var cat = item.getAttribute('data-cat') || '';
      var hit = (term === '' || name.indexOf(term) !== -1) &&
                (activeCat === '' || cat === activeCat);
      item.hidden = !hit;
      if (hit) { shown++; }
    });

    if (noResults) { noResults.hidden = shown !== 0; }
  }

  if (search) {
    search.addEventListener('input', applyFilters);
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('is-active'); });
      chip.classList.add('is-active');
      activeCat = chip.getAttribute('data-cat') || '';
      applyFilters();
    });
  });

  /* ---------- business modal ---------- */

  var modal = document.getElementById('modal');
  var modalLogo = document.getElementById('modalLogo');
  var modalName = document.getElementById('modalName');
  var modalCat = document.getElementById('modalCat');
  var modalDesc = document.getElementById('modalDesc');
  var modalDetails = document.getElementById('modalDetails');
  var lastFocused = null;

  var ICONS = {
    phone: '<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.6a1 1 0 0 1-.25 1z"/>',
    whatsapp: '<path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.26A10 10 0 1 0 12 2zm5.1 13.9c-.22.6-1.3 1.18-1.8 1.22-.46.05-1.05.07-1.7-.1a15.4 15.4 0 0 1-6.6-5.5c-.5-.75-.83-1.6-.83-2.4 0-.8.42-1.2.57-1.36a.86.86 0 0 1 .62-.28h.44c.14 0 .33-.05.52.4l.7 1.7c.06.12.1.27.02.43l-.28.44-.4.44c-.13.13-.27.27-.12.53.15.25.66 1.1 1.42 1.77.97.87 1.8 1.14 2.05 1.27.26.13.4.1.55-.06l.8-.93c.18-.22.34-.17.56-.1l1.6.76c.24.1.4.16.46.25.06.1.06.55-.16 1.15z"/>',
    email: '<path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4.6 7H4v1l8 5.6L20 8V7h-.6z"/>',
    website: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 9h-3a15.6 15.6 0 0 0-1.2-5.4A8 8 0 0 1 18.9 11zM12 4.1c.8 1.2 1.6 3.4 1.8 6.9h-3.6c.2-3.5 1-5.7 1.8-6.9zM4.3 13h3c.1 2 .5 3.9 1.2 5.4A8 8 0 0 1 4.3 13zm3-2h-3a8 8 0 0 1 4.2-5.4A15.6 15.6 0 0 0 7.3 11zM12 19.9c-.8-1.2-1.6-3.4-1.8-6.9h3.6c-.2 3.5-1 5.7-1.8 6.9zm2.7-1.5c.7-1.5 1.1-3.4 1.2-5.4h3a8 8 0 0 1-4.2 5.4z"/>',
    address: '<path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>'
  };

  var ARROW = '<svg class="detail-arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M11 3v2h2.6l-6.3 6.3 1.4 1.4L15 6.4V9h2V3z"/><path d="M15 15H5V5h4V3H3v14h14v-6h-2z"/></svg>';

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function detailRow(opts) {
    var tag = opts.href ? 'a' : 'div';
    var attrs = opts.href
      ? ' href="' + escapeHtml(opts.href) + '"' + (opts.external ? ' target="_blank" rel="noopener"' : '')
      : '';
    var iconClass = 'detail-icon' + (opts.wa ? ' is-wa' : '');

    return '<li><' + tag + ' class="detail-row"' + attrs + '>' +
      '<span class="' + iconClass + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[opts.icon] + '</svg></span>' +
      '<span class="detail-body">' +
        '<span class="detail-label">' + escapeHtml(opts.label) + '</span>' +
        '<span class="detail-value">' + escapeHtml(opts.value) + '</span>' +
      '</span>' +
      (opts.href ? ARROW : '') +
      '</' + tag + '></li>';
  }

  function openModal(id) {
    var b = byId[id];
    if (!b) { return; }

    lastFocused = document.activeElement;

    modalLogo.innerHTML = b.logo
      ? '<img src="' + escapeHtml(b.logo) + '" alt="' + escapeHtml(b.name) + ' logo">'
      : '<span class="logo-fallback">' + escapeHtml(b.initials) + '</span>';

    modalName.textContent = b.name;

    modalCat.textContent = b.category;
    modalCat.hidden = !b.category;

    modalDesc.textContent = b.description;
    modalDesc.hidden = !b.description;

    var rows = '';
    if (b.phone) {
      rows += detailRow({ icon: 'phone', label: 'Phone', value: b.phone, href: b.phoneHref });
    }
    if (b.whatsapp) {
      rows += detailRow({ icon: 'whatsapp', label: 'WhatsApp', value: b.whatsapp, href: b.whatsappHref, external: true, wa: true });
    }
    if (b.email) {
      rows += detailRow({ icon: 'email', label: 'Email', value: b.email, href: b.emailHref });
    }
    if (b.website) {
      rows += detailRow({ icon: 'website', label: 'Website', value: b.website, href: b.websiteHref, external: true });
    }
    if (b.address) {
      rows += detailRow({ icon: 'address', label: 'Address', value: b.address });
    }
    modalDetails.innerHTML = rows ||
      '<li><div class="detail-row"><span class="detail-body"><span class="detail-value">No contact details listed.</span></span></div></li>';

    modal.hidden = false;
    document.body.classList.add('no-scroll');
    modal.querySelector('.modal-close').focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('no-scroll');
    if (lastFocused) { lastFocused.focus(); }
  }

  if (grid) {
    grid.addEventListener('click', function (event) {
      var card = event.target.closest('.card');
      if (card) { openModal(parseInt(card.getAttribute('data-id'), 10)); }
    });
  }

  modal.addEventListener('click', function (event) {
    if (event.target.closest('[data-close]')) { closeModal(); }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !modal.hidden) { closeModal(); }
  });

  /* Keep focus inside the modal while it is open. */
  modal.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab') { return; }
    var focusable = modal.querySelectorAll('a[href], button:not([disabled])');
    if (!focusable.length) { return; }
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
})();
