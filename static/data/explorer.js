/* Shared interactive explorer for the TGOV and TCS datasets.
 *
 * Expects two globals to be defined before this file loads:
 *   window.DATASET  -- written by R/export_data_explorers.R
 *   window.VIZ_CONFIG -- per-page defaults (default selection, unit noun)
 *
 * No external dependencies; renders inline SVG.
 */
(function () {
  'use strict';

  var D = window.DATASET;
  var CFG = window.VIZ_CONFIG || {};
  if (!D) return;

  var MAX_SERIES = 5;
  // Not every row is a sovereign country (TGOV has Kosovo and Puerto Rico; TCS
  // adds Northern Ireland and Taiwan), so the noun is configurable per dataset.
  var UNIT  = CFG.unit  || 'country';
  var UNITS = CFG.units || 'countries';
  var SLOTS = ['--series-1', '--series-2', '--series-3', '--series-4', '--series-5'];

  // ---- index the data -------------------------------------------------

  // byCountry[i] = array of {year, mean, sd, lo, hi} sorted by year
  var byCountry = D.countries.map(function () { return []; });
  D.rows.forEach(function (r) {
    byCountry[r[0]].push({ year: r[1], mean: r[2], sd: r[3], lo: r[4], hi: r[5] });
  });
  byCountry.forEach(function (a) { a.sort(function (x, y) { return x.year - y.year; }); });

  // ---- state ----------------------------------------------------------

  // selected: [{idx, slot}] -- slot is pinned to the entity so that removing
  // one country never repaints the survivors.
  var state = {
    selected: [],
    yearMin: D.yearMin,
    yearMax: D.yearMax,
    showBands: true,
    showTable: false,
    query: ''
  };

  function freeSlot() {
    var used = state.selected.map(function (s) { return s.slot; });
    for (var i = 0; i < SLOTS.length; i++) {
      if (used.indexOf(i) === -1) return i;
    }
    return -1;
  }

  function isSelected(idx) {
    return state.selected.some(function (s) { return s.idx === idx; });
  }

  function addCountry(idx) {
    if (isSelected(idx) || state.selected.length >= MAX_SERIES) return;
    state.selected.push({ idx: idx, slot: freeSlot() });
    render();
  }

  function removeCountry(idx) {
    state.selected = state.selected.filter(function (s) { return s.idx !== idx; });
    render();
  }

  function colorOf(slot) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(SLOTS[slot]).trim() || '#2a78d6';
  }

  // ---- DOM refs -------------------------------------------------------

  var el = {
    search: document.getElementById('viz-search'),
    results: document.getElementById('viz-results'),
    chips: document.getElementById('viz-chips'),
    yMin: document.getElementById('viz-year-min'),
    yMax: document.getElementById('viz-year-max'),
    bands: document.getElementById('viz-bands'),
    table: document.getElementById('viz-table-toggle'),
    card: document.getElementById('viz-card'),
    svg: document.getElementById('viz-chart'),
    tooltip: document.getElementById('viz-tooltip'),
    tablewrap: document.getElementById('viz-tablewrap'),
    download: document.getElementById('viz-download-selection')
  };

  // ---- scales & helpers ----------------------------------------------

  var M = { top: 18, right: 116, bottom: 42, left: 56 };
  var W = 900, H = 440;

  function seriesData(idx) {
    return byCountry[idx].filter(function (d) {
      return d.year >= state.yearMin && d.year <= state.yearMax;
    });
  }

  function niceTicks(lo, hi, count) {
    var span = hi - lo;
    if (span <= 0) return [lo];
    var raw = span / count;
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var norm = raw / mag;
    var step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
    var out = [];
    for (var v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) {
      out.push(Math.round(v * 1e6) / 1e6);
    }
    return out;
  }

  function fmt(v) { return v.toFixed(2); }

  // ---- render ---------------------------------------------------------

  function render() {
    renderResults();
    renderChips();
    renderChart();
    renderTable();
    syncDownload();
  }

  function renderResults() {
    var q = state.query.trim().toLowerCase();
    var matches = [];
    for (var i = 0; i < D.countries.length; i++) {
      if (!q || D.countries[i].toLowerCase().indexOf(q) !== -1) matches.push(i);
      if (matches.length >= 200) break;
    }
    el.results.innerHTML = '';
    if (!matches.length) {
      var none = document.createElement('div');
      none.className = 'viz-empty';
      none.textContent = 'No ' + UNITS + ' match "' + state.query + '".';
      el.results.appendChild(none);
      return;
    }
    var full = state.selected.length >= MAX_SERIES;
    matches.forEach(function (i) {
      var b = document.createElement('button');
      b.type = 'button';
      var sel = isSelected(i);
      b.textContent = (sel ? '✓ ' : '') + D.countries[i];
      b.disabled = sel || full;
      if (sel) {
        b.disabled = false;
        b.onclick = function () { removeCountry(i); };
      } else {
        b.onclick = function () { addCountry(i); };
      }
      el.results.appendChild(b);
    });
  }

  function renderChips() {
    el.chips.innerHTML = '';
    if (!state.selected.length) {
      var hint = document.createElement('span');
      hint.className = 'viz-hint';
      hint.textContent = 'Search above to add up to ' + MAX_SERIES + ' ' + UNITS + '.';
      el.chips.appendChild(hint);
      return;
    }
    state.selected.forEach(function (s) {
      var chip = document.createElement('span');
      chip.className = 'viz-chip';

      var sw = document.createElement('span');
      sw.className = 'viz-swatch';
      sw.style.background = colorOf(s.slot);
      chip.appendChild(sw);

      chip.appendChild(document.createTextNode(D.countries[s.idx]));

      var x = document.createElement('button');
      x.type = 'button';
      x.setAttribute('aria-label', 'Remove ' + D.countries[s.idx]);
      x.textContent = '×';
      x.onclick = function () { removeCountry(s.idx); };
      chip.appendChild(x);

      el.chips.appendChild(chip);
    });
    if (state.selected.length >= MAX_SERIES) {
      var cap = document.createElement('span');
      cap.className = 'viz-hint';
      cap.textContent = 'Maximum ' + MAX_SERIES + ' — remove one to add another.';
      el.chips.appendChild(cap);
    }
  }

  var plot = null; // geometry cached for the hover layer

  function renderChart() {
    var svg = el.svg;
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('role', 'img');

    var active = state.selected
      .map(function (s) { return { s: s, data: seriesData(s.idx) }; })
      .filter(function (o) { return o.data.length > 0; });

    if (!active.length) {
      plot = null;
      svg.style.display = 'none';
      var ph = el.card.querySelector('.viz-empty-state');
      if (!ph) {
        ph = document.createElement('div');
        ph.className = 'viz-empty-state';
        el.card.appendChild(ph);
      }
      ph.textContent = state.selected.length
        ? 'No observations in ' + state.yearMin + '–' + state.yearMax + ' for the selected ' + UNITS + '.'
        : 'Select one or more ' + UNITS + ' to plot their estimates.';
      return;
    }
    var ph2 = el.card.querySelector('.viz-empty-state');
    if (ph2) ph2.remove();
    svg.style.display = '';

    svg.setAttribute('aria-label',
      D.label + ' estimates, ' + state.yearMin + ' to ' + state.yearMax + ', for ' +
      active.map(function (o) { return D.countries[o.s.idx]; }).join(', ') +
      '. The same values are listed in the table below.');

    // y domain across whatever is drawn (band-inclusive when bands are shown)
    var lo = Infinity, hi = -Infinity;
    active.forEach(function (o) {
      o.data.forEach(function (d) {
        var a = state.showBands ? d.lo : d.mean;
        var b = state.showBands ? d.hi : d.mean;
        if (a < lo) lo = a;
        if (b > hi) hi = b;
      });
    });
    var pad = (hi - lo) * 0.08 || 0.05;
    lo = Math.max(0, lo - pad);
    hi = Math.min(1, hi + pad);
    if (hi - lo < 1e-6) { lo = Math.max(0, lo - 0.05); hi = Math.min(1, hi + 0.05); }

    var xLo = state.yearMin, xHi = state.yearMax;
    if (xHi === xLo) { xHi = xLo + 1; }

    var iw = W - M.left - M.right, ih = H - M.top - M.bottom;
    var X = function (yr) { return M.left + (yr - xLo) / (xHi - xLo) * iw; };
    var Y = function (v) { return M.top + (hi - v) / (hi - lo) * ih; };
    plot = { X: X, Y: Y, xLo: xLo, xHi: xHi, active: active, iw: iw, ih: ih };

    var NS = 'http://www.w3.org/2000/svg';
    function mk(tag, attrs) {
      var n = document.createElementNS(NS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    }

    // gridlines (solid hairlines, one shade off the surface)
    var yTicks = niceTicks(lo, hi, 5);
    var g = mk('g', { 'class': 'viz-grid' });
    yTicks.forEach(function (t) {
      g.appendChild(mk('line', { x1: M.left, x2: M.left + iw, y1: Y(t), y2: Y(t) }));
    });
    svg.appendChild(g);

    // axes
    var ax = mk('g', { 'class': 'viz-axis' });
    ax.appendChild(mk('line', { x1: M.left, x2: M.left + iw, y1: M.top + ih, y2: M.top + ih }));
    yTicks.forEach(function (t) {
      var lab = mk('text', { x: M.left - 9, y: Y(t) + 4, 'text-anchor': 'end' });
      lab.textContent = fmt(t);
      ax.appendChild(lab);
    });
    var xTicks = niceTicks(xLo, xHi, 7).filter(function (t) {
      return t >= xLo && t <= xHi && Math.abs(t - Math.round(t)) < 1e-9;
    });
    xTicks.forEach(function (t) {
      var lab = mk('text', { x: X(t), y: M.top + ih + 20, 'text-anchor': 'middle' });
      lab.textContent = String(t);
      ax.appendChild(lab);
    });
    var yt = mk('text', {
      'class': 'viz-axis-title',
      transform: 'rotate(-90)',
      x: -(M.top + ih / 2),
      y: 15,
      'text-anchor': 'middle'
    });
    yt.textContent = D.unit + ' (0–1 scale)';
    ax.appendChild(yt);
    svg.appendChild(ax);

    // uncertainty bands beneath the lines
    if (state.showBands) {
      active.forEach(function (o) {
        var up = o.data.map(function (d) { return X(d.year) + ',' + Y(d.hi); });
        var dn = o.data.slice().reverse().map(function (d) { return X(d.year) + ',' + Y(d.lo); });
        svg.appendChild(mk('polygon', {
          'class': 'viz-band',
          fill: colorOf(o.s.slot),
          points: up.concat(dn).join(' ')
        }));
      });
    }

    // lines
    active.forEach(function (o) {
      var pts = o.data.map(function (d, i) {
        return (i ? 'L' : 'M') + X(d.year) + ',' + Y(d.mean);
      }).join(' ');
      svg.appendChild(mk('path', {
        'class': 'viz-line', d: pts, stroke: colorOf(o.s.slot)
      }));
    });

    // selective direct labels at the line ends, de-collided vertically.
    // These also satisfy the relief rule for the sub-3:1 palette slots.
    var labels = active.map(function (o) {
      var last = o.data[o.data.length - 1];
      return { y: Y(last.mean), x: X(last.year), text: D.countries[o.s.idx], slot: o.s.slot };
    }).sort(function (a, b) { return a.y - b.y; });

    for (var i = 1; i < labels.length; i++) {
      if (labels[i].y - labels[i - 1].y < 14) labels[i].y = labels[i - 1].y + 14;
    }
    var overflow = labels.length ? labels[labels.length - 1].y - (M.top + ih) : 0;
    if (overflow > 0) labels.forEach(function (l) { l.y -= overflow; });

    labels.forEach(function (l) {
      var t = mk('text', {
        'class': 'viz-endlabel',
        x: Math.min(l.x, M.left + iw) + 8,
        y: l.y + 4,
        fill: colorOf(l.slot)
      });
      t.textContent = l.text;
      svg.appendChild(t);
    });

    // hover layer
    var hover = mk('g', { 'class': 'viz-hover' });
    hover.style.display = 'none';
    hover.appendChild(mk('line', {
      'class': 'viz-crosshair', y1: M.top, y2: M.top + ih, x1: 0, x2: 0
    }));
    svg.appendChild(hover);
    plot.hover = hover;

    var capture = mk('rect', {
      x: M.left, y: M.top, width: iw, height: ih,
      fill: 'transparent', style: 'cursor:crosshair'
    });
    svg.appendChild(capture);
    capture.addEventListener('mousemove', onHover);
    capture.addEventListener('mouseleave', offHover);
    capture.addEventListener('touchmove', function (e) {
      if (e.touches[0]) onHover(e.touches[0]);
    }, { passive: true });
    capture.addEventListener('touchend', offHover);
  }

  function onHover(evt) {
    if (!plot) return;
    var rect = el.svg.getBoundingClientRect();
    var scale = W / rect.width;
    var px = (evt.clientX - rect.left) * scale;
    var yr = Math.round(plot.xLo + (px - M.left) / plot.iw * (plot.xHi - plot.xLo));
    yr = Math.max(plot.xLo, Math.min(plot.xHi, yr));

    var rows = [];
    plot.active.forEach(function (o) {
      var best = null, bd = Infinity;
      o.data.forEach(function (d) {
        var dist = Math.abs(d.year - yr);
        if (dist < bd) { bd = dist; best = d; }
      });
      if (best && bd <= 1) {
        rows.push({ name: D.countries[o.s.idx], slot: o.s.slot, d: best });
      }
    });

    if (!rows.length) { offHover(); return; }

    var NS = 'http://www.w3.org/2000/svg';
    plot.hover.style.display = '';
    var line = plot.hover.querySelector('.viz-crosshair');
    line.setAttribute('x1', plot.X(yr));
    line.setAttribute('x2', plot.X(yr));

    // redraw dots
    Array.prototype.slice.call(plot.hover.querySelectorAll('.viz-dot'))
      .forEach(function (n) { n.remove(); });
    rows.forEach(function (r) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', 'viz-dot');
      c.setAttribute('cx', plot.X(r.d.year));
      c.setAttribute('cy', plot.Y(r.d.mean));
      c.setAttribute('r', 4.5);
      c.setAttribute('fill', colorOf(r.slot));
      plot.hover.appendChild(c);
    });

    var tip = el.tooltip;
    tip.innerHTML = '';
    var head = document.createElement('div');
    head.className = 'viz-tooltip-year';
    head.textContent = rows[0].d.year;
    tip.appendChild(head);
    rows.sort(function (a, b) { return b.d.mean - a.d.mean; });
    rows.forEach(function (r) {
      var row = document.createElement('div');
      row.className = 'viz-tooltip-row';
      var sw = document.createElement('span');
      sw.className = 'viz-swatch';
      sw.style.background = colorOf(r.slot);
      row.appendChild(sw);
      row.appendChild(document.createTextNode(r.name));
      var v = document.createElement('span');
      v.className = 'viz-val';
      v.textContent = fmt(r.d.mean);
      row.appendChild(v);
      tip.appendChild(row);

      var ci = document.createElement('div');
      ci.className = 'viz-tooltip-row viz-ci';
      ci.style.paddingLeft = '1.35rem';
      ci.textContent = '80% CI ' + fmt(r.d.lo) + '–' + fmt(r.d.hi);
      tip.appendChild(ci);
    });

    tip.classList.add('is-on');
    var cardRect = el.card.getBoundingClientRect();
    var left = evt.clientX - cardRect.left + 14;
    if (left + tip.offsetWidth > cardRect.width) {
      left = evt.clientX - cardRect.left - tip.offsetWidth - 14;
    }
    tip.style.left = Math.max(4, left) + 'px';
    tip.style.top = Math.max(4, evt.clientY - cardRect.top - 10) + 'px';
  }

  function offHover() {
    if (plot && plot.hover) plot.hover.style.display = 'none';
    el.tooltip.classList.remove('is-on');
  }

  // ---- table view -----------------------------------------------------

  function renderTable() {
    el.tablewrap.innerHTML = '';
    el.tablewrap.style.display = state.showTable ? '' : 'none';
    if (!state.showTable || !state.selected.length) return;

    var years = [];
    for (var y = state.yearMin; y <= state.yearMax; y++) years.push(y);

    var lookup = state.selected.map(function (s) {
      var m = {};
      seriesData(s.idx).forEach(function (d) { m[d.year] = d; });
      return { name: D.countries[s.idx], slot: s.slot, m: m };
    });

    years = years.filter(function (y) {
      return lookup.some(function (l) { return l.m[y]; });
    });

    var t = document.createElement('table');
    t.className = 'viz-table';
    var cap = document.createElement('caption');
    cap.textContent = D.label + ' posterior means with 80% credible intervals in brackets.';
    t.appendChild(cap);

    var thead = document.createElement('thead');
    var hr = document.createElement('tr');
    hr.appendChild(th('Year'));
    lookup.forEach(function (l) { hr.appendChild(th(l.name)); });
    thead.appendChild(hr);
    t.appendChild(thead);

    var tb = document.createElement('tbody');
    years.forEach(function (y) {
      var tr = document.createElement('tr');
      var yd = document.createElement('td');
      yd.textContent = y;
      tr.appendChild(yd);
      lookup.forEach(function (l) {
        var td = document.createElement('td');
        var d = l.m[y];
        td.textContent = d ? fmt(d.mean) + ' [' + fmt(d.lo) + ', ' + fmt(d.hi) + ']' : '—';
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    el.tablewrap.appendChild(t);

    function th(s) { var n = document.createElement('th'); n.textContent = s; return n; }
  }

  // ---- download the current selection ---------------------------------

  function syncDownload() {
    el.download.disabled = state.selected.length === 0;
  }

  function downloadSelection() {
    var lines = ['country,year,mean,sd,q10,q90'];
    state.selected.forEach(function (s) {
      seriesData(s.idx).forEach(function (d) {
        lines.push('"' + D.countries[s.idx].replace(/"/g, '""') + '",' +
          d.year + ',' + d.mean + ',' + d.sd + ',' + d.lo + ',' + d.hi);
      });
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = D.name + '_selection_' + state.yearMin + '-' + state.yearMax + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  // ---- wire up --------------------------------------------------------

  el.search.addEventListener('input', function () {
    state.query = el.search.value;
    renderResults();
  });

  function clampYears() {
    var a = parseInt(el.yMin.value, 10);
    var b = parseInt(el.yMax.value, 10);
    if (isNaN(a)) a = D.yearMin;
    if (isNaN(b)) b = D.yearMax;
    a = Math.max(D.yearMin, Math.min(D.yearMax, a));
    b = Math.max(D.yearMin, Math.min(D.yearMax, b));
    if (a > b) { var t = a; a = b; b = t; }
    state.yearMin = a; state.yearMax = b;
    el.yMin.value = a; el.yMax.value = b;
    render();
  }
  el.yMin.addEventListener('change', clampYears);
  el.yMax.addEventListener('change', clampYears);

  el.bands.addEventListener('change', function () {
    state.showBands = el.bands.checked;
    renderChart();
  });
  el.table.addEventListener('change', function () {
    state.showTable = el.table.checked;
    renderTable();
  });
  el.download.addEventListener('click', downloadSelection);
  window.addEventListener('resize', function () { offHover(); });

  // ---- initial state --------------------------------------------------

  el.yMin.min = el.yMax.min = D.yearMin;
  el.yMin.max = el.yMax.max = D.yearMax;
  el.yMin.value = D.yearMin;
  el.yMax.value = D.yearMax;
  el.bands.checked = state.showBands;

  (CFG.defaultCountries || []).forEach(function (name) {
    var i = D.countries.indexOf(name);
    if (i !== -1 && state.selected.length < MAX_SERIES) {
      state.selected.push({ idx: i, slot: freeSlot() });
    }
  });

  render();
})();
