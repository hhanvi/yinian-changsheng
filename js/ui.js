/*
 * 一念长生 · 宗门篇 · 界面
 * 原生 DOM + 内联 SVG；无构建步骤。
 */
(function (global) {
  'use strict';

  var D = global.SectData;
  var E = global.SectEngine;
  var EV = global.SectEvents;

  var UI = {
    game: null,
    tab: 'sect',
    filter: 'all',
    buildType: null,
    buildCat: 'all',
    affairsTab: 'mission',
    marketQty: 1,
    selectedBuilding: null,
    missionPick: null,
    recruitOpen: false,
    modalOpen: false,
    modalKey: '',
    paused: false,
    autoPaused: false,
    speed: 1,
    acc: 0,
    timer: null,
    lastSaveDay: 0,
    settings: { theme: 'paper', speed: 1, autoPause: true },
    create: { origin: 'orphan', root: 'water', sectName: '青崖宗', playerName: '沈未央' },
    mapZoom: 1,
    tile: null,
    uid: 0,
    suppressClick: false,
    saveFailed: false,
    remoteSaveNotified: false,
    lastSaveAt: 0
  };

  var TILE_W = 64, TILE_H = 32, ORIGIN_X = 326, ORIGIN_Y = 98;
  var MAP_BASE = { x: 8, y: 24, w: 764, h: 468 };

  /* ------------------------------------------------------------------ */
  /* 工具                                                               */
  /* ------------------------------------------------------------------ */
  function h(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function fmt(n) {
    n = Number(n) || 0;
    if (Math.abs(n) >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万';
    return Math.floor(n).toLocaleString('zh-CN');
  }
  function fmt1(n) { return (Math.round((Number(n) || 0) * 10) / 10).toFixed(1).replace(/\.0$/, ''); }
  function pct(v) { return Math.max(0, Math.min(100, Math.round(v || 0))); }
  function signed(n) { return (n > 0 ? '+' : '') + n; }
  function hashStr(s) {
    var hsh = 2166136261 >>> 0;
    s = String(s);
    for (var i = 0; i < s.length; i++) { hsh ^= s.charCodeAt(i); hsh = Math.imul(hsh, 16777619); }
    return hsh >>> 0;
  }
  function seeded(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function iso(x, y) {
    return { x: ORIGIN_X + (x - y) * TILE_W / 2, y: ORIGIN_Y + (x + y) * TILE_H / 2 };
  }
  function rootOf(d) { return D.ROOTS[d.root] || D.ROOTS.water; }
  function roleBadge(d) {
    if (d.id === UI.game.playerId) return '<span class="badge badge-player">掌门</span>';
    return d.role === 'inner'
      ? '<span class="badge badge-inner">内门</span>'
      : '<span class="badge badge-outer">外门</span>';
  }
  function stage(d) { return E.stageName(d); }
  function date(state) { return E.getDate(state); }
  function stats() { return E.sectStats(UI.game); }
  function player() { return E.player(UI.game); }
  function dot(color) { return '<span class="dot" style="background:' + color + '"></span>'; }
  function seal(glyph, cls) { return '<span class="seal ' + (cls || '') + '">' + h(glyph) + '</span>'; }
  function bar(value, cls) {
    return '<div class="bar ' + (cls || '') + '"><i style="width:' + pct(value) + '%"></i></div>';
  }
  function needBar(label, value, cls) {
    return '<div class="need-row"><span>' + h(label) + '</span>' + bar(value, cls) + '<b>' + pct(value) + '</b></div>';
  }
  function dateShort(state) {
    var d = date(state);
    return d.year + '年' + d.month + '月';
  }
  function weather() {
    return D.WEATHER.find(function (w) { return w.id === UI.game.weather; }) || D.WEATHER[0];
  }
  function todoText(n) { return n > 0 ? '<span class="todo-count">' + n + '</span>' : ''; }

  function toast(msg, type) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.innerHTML = '<span class="toast-mark">' + (type === 'good' ? '善' : type === 'warn' ? '警' : '告') + '</span><span>' + h(msg) + '</span>';
    root.appendChild(el);
    setTimeout(function () { el.classList.add('out'); }, 2600);
    setTimeout(function () { el.remove(); }, 3200);
  }

  function saveSettings() {
    try { localStorage.setItem(D.SETTINGS_KEY, JSON.stringify(UI.settings)); } catch (e) {}
  }
  function loadSettings() {
    try {
      var raw = localStorage.getItem(D.SETTINGS_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (s && s.theme) UI.settings = Object.assign(UI.settings, s);
      }
    } catch (e) {}
    UI.speed = UI.settings.speed || 1;
    applyTheme(UI.settings.theme);
  }
  function applyTheme(theme) {
    UI.settings.theme = theme === 'night' ? 'night' : 'paper';
    document.documentElement.setAttribute('data-theme', UI.settings.theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', UI.settings.theme === 'night' ? '#142822' : '#e4ebe0');
  }

  function saveNow(force) {
    if (!UI.game) return false;
    var ok = E.save(UI.game, !!force);
    if (ok) {
      UI.lastSaveDay = UI.game.day;
      UI.lastSaveAt = UI.game.lastSaved || Date.now();
      UI.saveFailed = false;
      return true;
    }
    if (!UI.saveFailed) {
      UI.saveFailed = true;
      var msg = E.lastSaveError === 'stale'
        ? '另一页面已写入更新的存档，本页暂停保存。请刷新后再继续。'
        : E.lastSaveError === 'quota'
          ? '浏览器存储空间不足，存档失败。请先导出存档备份。'
          : '浏览器存储不可用，存档失败。请先导出存档备份。';
      toast(msg, 'warn');
    }
    return false;
  }

  /* ------------------------------------------------------------------ */
  /* 头像                                                               */
  /* ------------------------------------------------------------------ */
  function avatarSvg(d, size) {
    var seed = d.avatarSeed || hashStr(d.name);
    var r = seeded(seed);
    var root = rootOf(d);
    var bg1 = root.color;
    var bg2 = '#f2e6d0';
    var skin = ['#e8c9a8', '#dfbb93', '#f0d3b2', '#d8b28c'][seed % 4];
    var hair = ['#2c2823', '#3b3028', '#242322', '#4b3b2d'][Math.floor(r() * 4)];
    var robe = root.color;
    var hairType = Math.floor(r() * 4);
    var female = d.gender === 'f';
    var uid = 'av' + (++UI.uid);
    var sz = size || 100;
    var hairPath = [
      'M-18,-14 Q-22,4 -13,12 L-9,2 Q-14,-8 -6,-20 Q4,-29 16,-17 Q23,-7 16,4 L20,13 Q26,-5 17,-22 Q4,-35 -12,-25 Q-20,-20 -18,-14 Z',
      'M-19,-12 Q-25,2 -14,12 L-8,4 Q-15,-6 -8,-18 Q3,-30 17,-18 Q22,-8 17,2 L22,12 Q27,-4 18,-21 Q2,-36 -13,-24 Z',
      'M-20,-18 Q-9,-32 10,-27 Q25,-20 20,-2 L16,10 L10,1 Q16,-10 7,-18 Q-2,-24 -10,-15 L-16,8 L-22,-2 Z',
      'M-18,-15 Q-20,3 -10,13 L-5,1 Q-12,-8 -4,-19 Q7,-30 17,-16 Q22,-4 14,6 L19,14 Q27,-5 17,-22 Q1,-36 -13,-26 Z'
    ][hairType];
    return '<svg class="avatar-svg" viewBox="0 0 100 100" width="' + sz + '" height="' + sz + '" aria-hidden="true">' +
      '<defs><radialGradient id="' + uid + 'g" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="' + bg2 + '"/><stop offset="1" stop-color="' + bg1 + '"/></radialGradient>' +
      '<clipPath id="' + uid + 'c"><circle cx="50" cy="50" r="47"/></clipPath></defs>' +
      '<circle cx="50" cy="50" r="48" fill="url(#' + uid + 'g)"/>' +
      '<g clip-path="url(#' + uid + 'c)">' +
      '<path d="M8 96 Q16 67 50 63 Q84 67 92 96 Z" fill="' + robe + '" opacity=".92"/>' +
      '<path d="M25 95 Q30 72 50 68 Q70 72 75 95" fill="#f4e9d4" opacity=".38"/>' +
      '<path d="' + hairPath + '" transform="translate(50,48) scale(.98)" fill="' + hair + '" opacity=".94"/>' +
      '<ellipse cx="50" cy="55" rx="15" ry="20" fill="' + skin + '"/>' +
      '<path d="M35 44 Q34 33 50 31 Q66 33 65 45 Q58 39 50 41 Q42 39 35 44 Z" fill="' + hair + '"/>' +
      '<path d="M38 55 Q42 53 46 55" stroke="#3b2f28" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
      '<path d="M54 55 Q58 53 62 55" stroke="#3b2f28" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
      '<path d="M45 65 Q50 68 55 65" stroke="#a35b4a" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
      (female ? '<circle cx="33" cy="47" r="2.4" fill="#b86a57"/><circle cx="67" cy="47" r="2.4" fill="#b86a57"/>' : '') +
      '<path d="M30 38 L50 34 L70 38" stroke="#d8b96b" stroke-width="1.2" fill="none" opacity=".8"/>' +
      (d.role === 'inner' ? '<path d="M62 35 L67 25 L72 35" fill="none" stroke="#e0c47b" stroke-width="1.4"/>' : '') +
      (d.role === 'inner' ? '<circle cx="60" cy="61" r="1.2" fill="#d8b96b"/>' : '') +
      '</g><circle cx="50" cy="50" r="47" fill="none" stroke="rgba(60,40,25,.18)" stroke-width="1.5"/></svg>';
  }

  /* ------------------------------------------------------------------ */
  /* 地图：地形与建筑                                                   */
  /* ------------------------------------------------------------------ */
  var PALETTE = {
    gate: { roof: '#6d4a3c', roof2: '#865846', wall: '#e4d4b7', wall2: '#cbb897', trim: '#a33b2a', sign: '门' },
    dorm: { roof: '#4f6570', roof2: '#647b84', wall: '#e7d9bf', wall2: '#d1bf9e', trim: '#8f6a43', sign: '舍' },
    meditation: { roof: '#3f5d56', roof2: '#55756b', wall: '#ebe0ca', wall2: '#d5c5a8', trim: '#b08a4a', sign: '静' },
    kitchen: { roof: '#795841', roof2: '#916b4e', wall: '#eadcc2', wall2: '#d5c09f', trim: '#a35b4a', sign: '膳' },
    alchemy: { roof: '#654b3b', roof2: '#7d5d48', wall: '#e4d2b5', wall2: '#c9b18e', trim: '#b25d48', sign: '丹' },
    library: { roof: '#4a5f5a', roof2: '#5e7770', wall: '#e9ddc6', wall2: '#d1c1a2', trim: '#b08a4a', sign: '经' },
    shrine: { roof: '#70453c', roof2: '#8a5849', wall: '#e6d4b5', wall2: '#c9b18d', trim: '#a33b2a', sign: '祠' },
    guest: { roof: '#596a62', roof2: '#6f8177', wall: '#e8dbc2', wall2: '#d1bf9e', trim: '#a9854e', sign: '客' },
    infirmary: { roof: '#5d6650', roof2: '#727a61', wall: '#e9ddc5', wall2: '#d3c1a1', trim: '#7b8f55', sign: '庐' },
    storage: { roof: '#655c4e', roof2: '#7c705f', wall: '#dfd0b5', wall2: '#c6b394', trim: '#8b6a45', sign: '库' }
  };

  function tilePoly(sx, sy, inset) {
    inset = inset || 0;
    var w = 32 - inset, hh = 16 - inset / 2;
    return (sx) + ',' + (sy - hh) + ' ' + (sx + w) + ',' + sy + ' ' + sx + ',' + (sy + hh) + ' ' + (sx - w) + ',' + sy;
  }

  function treeSvg(sx, sy, seed, scale) {
    var r = seeded(seed);
    var s = scale || 1;
    var hue = 92 + Math.floor(r() * 30);
    var fill = 'hsl(' + hue + ',26%,' + (34 + Math.floor(r() * 10)) + '%)';
    var fill2 = 'hsl(' + (hue - 8) + ',24%,' + (27 + Math.floor(r() * 8)) + '%)';
    var hgt = 15 + Math.floor(r() * 8);
    return '<g class="tree" transform="translate(' + sx + ',' + sy + ') scale(' + s + ')">' +
      '<ellipse cx="0" cy="3" rx="9" ry="3" fill="rgba(30,40,25,.16)"/>' +
      '<path d="M0 2 L-1 -' + hgt + '" stroke="#5e4b37" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M-1 -' + (hgt * .55) + ' L-7 -' + (hgt * .85) + '" stroke="#5e4b37" stroke-width="1.4"/>' +
      '<circle cx="-5" cy="-' + (hgt * .9) + '" r="7" fill="' + fill2 + '"/>' +
      '<circle cx="5" cy="-' + (hgt * .82) + '" r="6" fill="' + fill + '"/>' +
      '<circle cx="0" cy="-' + (hgt * 1.12) + '" r="6.5" fill="' + fill + '"/>' +
      '</g>';
  }

  function rockSvg(sx, sy, seed, scale) {
    var r = seeded(seed);
    var s = scale || 1;
    var w = 10 + Math.floor(r() * 10);
    return '<g class="rock" transform="translate(' + sx + ',' + sy + ') scale(' + s + ')">' +
      '<ellipse cx="0" cy="4" rx="' + (w + 3) + '" ry="4" fill="rgba(30,30,25,.12)"/>' +
      '<path d="M-' + w + ' 2 L-' + (w - 3) + ' -8 L-' + (w * .2) + ' -14 L' + (w * .65) + ' -5 L' + w + ' 2 Z" fill="#8f8a7c"/>' +
      '<path d="M-' + (w - 3) + ' -8 L-' + (w * .2) + ' -14 L0 -4 L-' + (w * .4) + ' 2 Z" fill="#a6a092" opacity=".75"/>' +
      '<path d="M0 -4 L' + (w * .65) + ' -5 L' + w + ' 2 L' + (w * .2) + ' 3 Z" fill="#78746a" opacity=".7"/>' +
      '</g>';
  }

  function decorSvg(item) {
    var p = iso(item.x, item.y);
    if (E.buildingAt(UI.game, item.x, item.y)) return '';
    if (item.type === 'lantern') {
      return '<g class="decor lantern" transform="translate(' + p.x + ',' + p.y + ')"><ellipse cx="0" cy="4" rx="7" ry="3" fill="rgba(40,30,20,.12)"/><path d="M0 3 L0 -13" stroke="#6d573d" stroke-width="1.4"/><circle cx="0" cy="-12" r="8" fill="rgba(222,160,70,.16)"/><path d="M-3 -15 L3 -15 L4 -8 L-4 -8 Z" fill="#b34a35"/><circle cx="0" cy="-7" r="1.3" fill="#e8c46b"/></g>';
    }
    if (item.type === 'bamboo') {
      return '<g class="decor bamboo" transform="translate(' + p.x + ',' + p.y + ')"><ellipse cx="0" cy="4" rx="9" ry="3" fill="rgba(40,30,20,.1)"/><path d="M-5 3 L-7 -22 M2 3 L1 -27 M7 3 L9 -17" stroke="#55714f" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M-7 -12 q-7 -4 -9 2 q7 2 9 -2 M1 -18 q8 -5 10 1 q-7 2 -10 -1 M9 -8 q7 -3 9 3 q-7 1 -9 -3" fill="#6f8f5e"/></g>';
    }
    if (item.type === 'table') {
      return '<g class="decor table" transform="translate(' + p.x + ',' + p.y + ')"><ellipse cx="0" cy="5" rx="12" ry="4" fill="rgba(40,30,20,.12)"/><ellipse cx="0" cy="-1" rx="9" ry="4.5" fill="#b8a887"/><path d="M-6 0 L-6 6 M6 0 L6 6" stroke="#8f7b5e" stroke-width="1.4"/><circle cx="-11" cy="2" r="3" fill="#a89676"/><circle cx="11" cy="2" r="3" fill="#a89676"/></g>';
    }
    if (item.type === 'flag') {
      return '<g class="decor flag" transform="translate(' + p.x + ',' + p.y + ')"><ellipse cx="0" cy="4" rx="6" ry="2.5" fill="rgba(40,30,20,.1)"/><path d="M0 3 L0 -28" stroke="#6d573d" stroke-width="1.6"/><path d="M0 -27 q14 4 18 0 l-4 12 q-10 3 -14 0 Z" fill="#a33b2a"/><path d="M7 -24 l2 6" stroke="#e8d6b0" stroke-width="1"/></g>';
    }
    return treeSvg(p.x, p.y, hashStr('decor' + item.x + ':' + item.y), 0.8);
  }

  function waterRipple(sx, sy, seed) {
    var r = seeded(seed);
    var lines = '';
    for (var i = 0; i < 3; i++) {
      var dx = -10 + r() * 20, dy = -5 + r() * 10;
      lines += '<path class="ripple" style="animation-delay:' + (r() * 3).toFixed(2) + 's" d="M' + (sx + dx - 8) + ' ' + (sy + dy) + ' q8 -3 16 0" stroke="#e7f2ec" stroke-width="1" fill="none" opacity=".55"/>';
    }
    return lines;
  }

  function houseSvg(pal, opts) {
    opts = opts || {};
    var half = opts.half || 21;
    var peak = opts.peak || 37;
    var wallTop = opts.wallTop || -22;
    var sign = pal.sign || '舍';
    var lantern = opts.lantern ? '<g class="lantern"><circle cx="' + (half + 2) + '" cy="-10" r="9" fill="rgba(220,150,60,.18)"/><circle cx="' + (half + 2) + '" cy="-10" r="3" fill="#d89a4c"/></g>' : '';
    var smoke = opts.smoke ? '<g class="smoke"><circle cx="' + (-half + 6) + '" cy="' + (wallTop - 4) + '" r="4" fill="#ded4c3" opacity=".46"/><circle cx="' + (-half + 2) + '" cy="' + (wallTop - 14) + '" r="6" fill="#ded4c3" opacity=".3"/><circle cx="' + (-half + 9) + '" cy="' + (wallTop - 24) + '" r="8" fill="#ded4c3" opacity=".18"/></g>' : '';
    return '' +
      '<ellipse class="b-shadow" cx="0" cy="9" rx="' + (half + 7) + '" ry="9" fill="rgba(35,30,20,.18)"/>' +
      '<polygon class="b-base" points="0,-12 ' + half + ',0 0,12 -' + half + ',0" fill="#c9b58e"/>' +
      '<polygon class="b-wall-left" points="-' + half + ',0 0,12 0,-10 -' + half + ',' + wallTop + '" fill="' + pal.wall + '"/>' +
      '<polygon class="b-wall-right" points="' + half + ',0 0,12 0,-10 ' + half + ',' + wallTop + '" fill="' + pal.wall2 + '"/>' +
      '<path class="b-door" d="M6,-1 L14,3 L14,-11 L6,-15 Z" fill="' + pal.trim + '" opacity=".9"/>' +
      '<path class="b-window" d="M-14,-2 L-6,2 L-6,-10 L-14,-14 Z" fill="#f0d79b" opacity=".72"/>' +
      '<polygon class="b-roof-left" points="-' + (half + 6) + ',' + (wallTop + 2) + ' 0,-' + peak + ' 0,-6" fill="' + pal.roof + '"/>' +
      '<polygon class="b-roof-right" points="' + (half + 6) + ',' + (wallTop + 2) + ' 0,-' + peak + ' 0,-6" fill="' + pal.roof2 + '"/>' +
      '<path class="b-ridge" d="M-' + (half + 4) + ',' + (wallTop + 4) + ' Q0,-' + (peak + 2) + ' ' + (half + 4) + ',' + (wallTop + 4) + '" fill="none" stroke="' + pal.trim + '" stroke-width="1.4" opacity=".8"/>' +
      '<path class="b-eave" d="M-' + (half + 7) + ',' + (wallTop + 3) + ' L0,-4 L' + (half + 7) + ',' + (wallTop + 3) + '" fill="none" stroke="#3d352b" stroke-width="1.2" opacity=".55"/>' +
      '<g class="b-sign"><rect x="-7" y="' + (wallTop + 2) + '" width="14" height="7" rx="1" fill="#a33b2a"/><text x="0" y="' + (wallTop + 7.5) + '" text-anchor="middle" font-size="5.5" fill="#f3e7cf">' + sign + '</text></g>' +
      lantern + smoke;
  }

  function buildingGroup(b, opts) {
    opts = opts || {};
    var def = D.BUILDINGS[b.type] || {};
    var p = opts.noIso ? { x: 0, y: 0 } : iso(b.x, b.y);
    var pal = PALETTE[b.type] || PALETTE.dorm;
    var inner = '';
    if (b.construction > 0) {
      inner = '<g class="construction">' +
        '<ellipse cx="0" cy="8" rx="28" ry="10" fill="rgba(35,30,20,.16)"/>' +
        '<polygon points="0,-12 26,0 0,12 -26,0" fill="#c7b691" opacity=".55"/>' +
        '<path d="M-18,0 L-18,-18 M0,10 L0,-26 M18,0 L18,-18 M-18,-18 L18,-18" stroke="#8b6a45" stroke-width="2" fill="none"/>' +
        '<path d="M-18,-12 L18,-12 M-9,-24 L-9,8 M9,-24 L9,8" stroke="#8b6a45" stroke-width="1.2" fill="none" opacity=".7"/>' +
        '<text x="0" y="-34" text-anchor="middle" class="b-progress">' + (E.def(b) ? E.def(b).name : '营造') + ' · ' + Math.ceil(b.construction) + '日</text>' +
        '</g>';
    } else if (b.type === 'farm') {
      inner = '<ellipse cx="0" cy="8" rx="29" ry="11" fill="rgba(35,30,20,.14)"/>' +
        '<polygon points="0,-14 29,-1 0,13 -29,-1" fill="#8fa06d"/>' +
        '<path d="M-20,-2 Q0,3 20,-2 M-18,3 Q0,8 18,3 M-13,8 Q0,12 13,8" stroke="#637b4e" stroke-width="2" fill="none" opacity=".7"/>' +
        '<path d="M-18,-2 q2 -5 4 0 M-9,1 q2 -5 4 0 M1,2 q2 -4 4 0 M11,1 q2 -4 4 0 M-12,6 q2 -4 4 0 M-2,7 q2 -4 4 0 M8,6 q2 -4 4 0" stroke="#d4c36a" stroke-width="1.2" fill="none"/>' +
        '<g transform="translate(17,-7) scale(.55)">' + houseSvg({ roof: '#6d5a40', roof2: '#826b4c', wall: '#d9c7a4', wall2: '#c3ad89', trim: '#8f6a43', sign: '田' }, { half: 13, peak: 22, wallTop: -13 }) + '</g>';
    } else if (b.type === 'herb') {
      inner = '<ellipse cx="0" cy="8" rx="28" ry="10" fill="rgba(35,30,20,.14)"/>' +
        '<polygon points="0,-14 29,-1 0,13 -29,-1" fill="#849568"/>' +
        '<path d="M-20,-3 L20,-3 M-18,2 L18,2 M-15,7 L15,7" stroke="#b6ab77" stroke-width="1" opacity=".7"/>' +
        '<path d="M-18,-3 q3 -8 6 0 M-8,0 q3 -8 6 0 M3,-1 q3 -8 6 0 M13,0 q3 -8 6 0 M-12,5 q3 -7 6 0 M0,7 q3 -7 6 0 M12,5 q3 -7 6 0" stroke="#7d9a5f" stroke-width="1.6" fill="none"/>' +
        '<circle cx="-13" cy="-6" r="2" fill="#d6df92" opacity=".8"/><circle cx="7" cy="-4" r="2" fill="#d6df92" opacity=".8"/>' +
        '<path d="M-22,-10 L22,-10 M-22,-10 L-26,-18 M22,-10 L26,-18" stroke="#8f6a43" stroke-width="1.4" fill="none"/>';
    } else if (b.type === 'array') {
      inner = '<ellipse cx="0" cy="1" rx="28" ry="15" fill="rgba(73,128,119,.18)"/>' +
        '<ellipse cx="0" cy="1" rx="22" ry="11" fill="none" stroke="#6fa99b" stroke-width="1.4" stroke-dasharray="4 3" class="array-ring"/>' +
        '<ellipse cx="0" cy="1" rx="13" ry="6.5" fill="none" stroke="#b8d5c7" stroke-width="1" opacity=".8"/>' +
        '<path d="M0,-10 L4,-2 L12,0 L4,3 L0,10 L-4,3 L-12,0 L-4,-2 Z" fill="#8bc0ae" opacity=".8" class="array-core"/>' +
        '<circle cx="-19" cy="0" r="2" fill="#e7d7a2"/><circle cx="19" cy="0" r="2" fill="#e7d7a2"/><circle cx="0" cy="-9" r="2" fill="#e7d7a2"/><circle cx="0" cy="10" r="2" fill="#e7d7a2"/>';
    } else if (b.type === 'well') {
      inner = '<ellipse cx="0" cy="8" rx="24" ry="10" fill="rgba(35,30,20,.14)"/>' +
        '<ellipse cx="0" cy="1" rx="16" ry="8" fill="#8f8a7c"/>' +
        '<ellipse cx="0" cy="-1" rx="12" ry="6" fill="#4f7d7c"/>' +
        '<path d="M-14,-1 L-14,-18 M14,-1 L14,-18 M-18,-18 L18,-18" stroke="#7a654a" stroke-width="2" fill="none"/>' +
        '<path d="M-17,-18 Q0,-27 17,-18" fill="none" stroke="#6d5a40" stroke-width="3"/>' +
        '<path d="M0,-19 L0,-10" stroke="#b8a37e" stroke-width="1.2"/><circle cx="0" cy="-8" r="2.2" fill="#c8b58d"/>' +
        '<path d="M-9,4 q9 3 18 0" stroke="#d5e4de" stroke-width="1" fill="none" opacity=".6"/>';
    } else if (b.type === 'pavilion') {
      inner = '<ellipse cx="0" cy="8" rx="26" ry="10" fill="rgba(35,30,20,.14)"/>' +
        '<polygon points="0,-12 24,0 0,12 -24,0" fill="#c9b58e"/>' +
        '<path d="M-17,0 L-17,-19 M17,0 L17,-19 M-8,9 L-8,-22 M8,9 L8,-22" stroke="#7b6144" stroke-width="2" fill="none"/>' +
        '<polygon points="-27,-20 0,-38 27,-20 0,-7" fill="#4f6a5e"/>' +
        '<polygon points="-27,-20 0,-38 0,-7" fill="#3f5a50"/>' +
        '<path d="M-22,-22 Q0,-31 22,-22" stroke="#b08a4a" stroke-width="1" fill="none"/>' +
        '<path d="M-12,4 L12,4" stroke="#8f6a43" stroke-width="2"/>';
    } else if (b.type === 'arena') {
      inner = '<ellipse cx="0" cy="8" rx="27" ry="11" fill="rgba(35,30,20,.14)"/>' +
        '<ellipse cx="0" cy="1" rx="25" ry="12" fill="none" stroke="#9b8763" stroke-width="2" stroke-dasharray="4 3"/>' +
        '<path d="M-17,3 L-17,-14 M-19,-14 L-15,-19 M17,3 L17,-14 M15,-14 L19,-19" stroke="#7a654a" stroke-width="2"/>' +
        '<path d="M-10,5 L-15,-8 M-15,-8 L-12,-4 M-15,-8 L-18,-5" stroke="#8d877b" stroke-width="1.4"/>' +
        '<path d="M8,5 L12,-6 M12,-6 L15,-4" stroke="#8d877b" stroke-width="1.4"/>' +
        '<circle cx="0" cy="-2" r="2" fill="#b08a4a"/>';
    } else if (b.type === 'gate') {
      inner = '<ellipse cx="0" cy="9" rx="31" ry="10" fill="rgba(35,30,20,.16)"/>' +
        '<polygon points="0,-12 28,0 0,12 -28,0" fill="#c9b58e"/>' +
        '<path d="M-17,2 L-17,-26 L-12,-26 L-12,2 M17,2 L17,-26 L12,-26 L12,2" fill="#8f4a3b"/>' +
        '<path d="M-23,-24 L0,-40 L23,-24 L0,-17 Z" fill="#6d4a3c"/>' +
        '<path d="M-23,-24 L0,-40 L0,-17 Z" fill="#593b30"/>' +
        '<path d="M-24,-24 Q0,-33 24,-24" stroke="#b08a4a" stroke-width="1.2" fill="none"/>' +
        '<rect x="-8" y="-22" width="16" height="8" rx="1" fill="#a33b2a"/><text x="0" y="-16.3" text-anchor="middle" font-size="5.6" fill="#f3e7cf">山门</text>' +
        '<path d="M-14,-22 L-14,-9 M14,-22 L14,-9" stroke="#d8b96b" stroke-width="1" opacity=".5"/>';
    } else if (b.type === 'shrine') {
      inner = houseSvg(pal, { half: 22, peak: 40, wallTop: -24, lantern: true }) +
        '<path d="M-22,-3 L-22,-18 M22,-3 L22,-18" stroke="#8a3b2c" stroke-width="1.6"/>' +
        '<path d="M-14,-24 L0,-32 L14,-24" fill="none" stroke="#b08a4a" stroke-width="1.2"/>';
    } else if (b.type === 'library') {
      inner = houseSvg(pal, { half: 23, peak: 44, wallTop: -27, lantern: true }) +
        '<path d="M-18,-2 L-18,-15 M18,-2 L18,-15" stroke="#b08a4a" stroke-width="1" opacity=".6"/>' +
        '<path d="M-8,-16 L8,-16 M-8,-13 L8,-13" stroke="#d8b96b" stroke-width="1" opacity=".85"/>';
    } else if (b.type === 'alchemy') {
      inner = houseSvg(pal, { half: 21, peak: 37, wallTop: -22, smoke: true }) +
        '<circle cx="0" cy="-3" r="8" fill="#b25d48" opacity=".2" class="furnace-glow"/><path d="M-4,2 L4,2 L3,-4 L-3,-4 Z" fill="#6e4f3d"/><path d="M-2,-4 q2 -5 4 0" stroke="#d89a4c" stroke-width="1.4" fill="none"/>';
    } else if (b.type === 'kitchen') {
      inner = houseSvg(pal, { half: 22, peak: 38, wallTop: -23, smoke: true, lantern: true });
    } else if (b.type === 'infirmary') {
      inner = houseSvg(pal, { half: 21, peak: 36, wallTop: -21, lantern: true }) +
        '<path d="M-12,-11 L-8,-17 M-8,-17 L-4,-12" stroke="#7b8f55" stroke-width="1.2" fill="none"/><circle cx="-8" cy="-18" r="2" fill="#a8b86a"/>';
    } else if (b.type === 'guest') {
      inner = houseSvg(pal, { half: 21, peak: 36, wallTop: -21, lantern: true }) +
        '<path d="M18,-6 L25,-12 L25,-2 Z" fill="#a33b2a" opacity=".85"/>';
    } else if (b.type === 'storage') {
      inner = houseSvg(pal, { half: 23, peak: 34, wallTop: -20 }) +
        '<rect x="-15" y="-1" width="6" height="5" fill="#8f6a43"/><rect x="8" y="1" width="6" height="5" fill="#8f6a43"/>';
    } else {
      inner = houseSvg(pal, { half: 22, peak: 38, wallTop: -23, lantern: b.type === 'dorm' });
    }
    var level = b.level > 1 && !opts.hideLevel ? '<text class="b-level" x="0" y="-44" text-anchor="middle">' + '·'.repeat(b.level - 1) + '</text>' : '';
    var decorative = !!opts.decorative;
    var selected = !decorative && UI.selectedBuilding === b.id ? ' selected' : '';
    return '<g class="building type-' + b.type + selected + (decorative ? ' decorative' : '') + '" transform="translate(' + p.x + ',' + p.y + ')"' + (decorative ? ' aria-hidden="true"' : ' data-building="' + b.id + '"') + '>' +
      (decorative ? '' : '<title>' + h(def.name || '建筑') + ' · ' + (b.construction > 0 ? '营造中' : 'Lv.' + (b.level || 1)) + '</title>') +
      inner + level + '</g>';
  }

  function unitPosition(d) {
    if (!UI.game) return iso(6, 6);
    if (d.job) {
      var b = E.buildingById(UI.game, d.job);
      if (b) {
        var base = iso(b.x, b.y);
        var idx = Math.max(0, b.workers.indexOf(d.id));
        return { x: base.x + (idx - (b.workers.length - 1) / 2) * 13, y: base.y + 14 + (idx % 2) * 3 };
      }
    }
    if (d.state === 'sleep') {
      var dorm = UI.game.buildings.find(function (b) { return b.type === 'dorm' && !b.construction; });
      if (dorm) { var dp = iso(dorm.x, dorm.y); return { x: dp.x + 2, y: dp.y + 16 }; }
    }
    if (d.state === 'rest') {
      var inf = UI.game.buildings.find(function (b) { return b.type === 'infirmary' && !b.construction; });
      if (inf) { var ip = iso(inf.x, inf.y); return { x: ip.x, y: ip.y + 16 }; }
    }
    var center = iso(6, 6);
    var seed = seeded(d.avatarSeed || 7);
    return { x: center.x + (seed() * 90 - 45), y: center.y + (seed() * 26 - 13) };
  }

  function tokenSvg(d) {
    if (!d || d.missionId) return '';
    var pos = unitPosition(d);
    var root = rootOf(d);
    var stateGlyph = { meditate: '静', work: '作', sleep: '眠', rest: '伤', train: '武', idle: '闲', mission: '外' }[d.state] || '闲';
    var stateColor = d.state === 'rest' ? '#a35b4a' : d.state === 'work' ? '#8f6a43' : d.state === 'meditate' ? '#4e7c78' : d.state === 'sleep' ? '#5e6577' : '#7d7565';
    var isPlayer = d.id === UI.game.playerId;
    var selected = UI.selectedDisciple === d.id ? ' selected' : '';
    return '<g class="disciple-token' + (isPlayer ? ' is-player' : '') + selected + '" transform="translate(' + pos.x + ',' + pos.y + ')" data-disciple="' + d.id + '">' +
      '<title>' + h(d.name + ' · ' + stage(d) + ' · ' + d.stateLabel) + '</title>' +
      '<ellipse class="t-shadow" cx="0" cy="2" rx="7" ry="3" fill="rgba(30,25,18,.22)"/>' +
      '<path class="t-robe" d="M-5,1 L-4,-11 L4,-11 L5,1 Z" fill="' + root.color + '"/>' +
      '<path d="M-4,-10 L0,-6 L4,-10" fill="#f2e6d1" opacity=".65"/>' +
      '<circle class="t-head" cx="0" cy="-15" r="4.2" fill="#e7c7a3"/>' +
      '<path d="M-4,-16 Q-5,-21 0,-22 Q5,-21 4,-16 Q2,-18 0,-17 Q-2,-18 -4,-16 Z" fill="#3a3028"/>' +
      '<circle class="t-status" cx="7" cy="-20" r="5" fill="' + stateColor + '"/><text x="7" y="-18" text-anchor="middle" font-size="5.6" fill="#fff8e9">' + stateGlyph + '</text>' +
      (isPlayer ? '<path d="M-8,-23 L0,-27 L8,-23" fill="none" stroke="#d8b96b" stroke-width="1.2"/>' : '') +
      '<text class="token-name" x="0" y="9" text-anchor="middle">' + h(d.name) + '</text>' +
      '</g>';
  }

  function mapSvg() {
    var state = UI.game;
    if (!state) return '';
    var zoom = UI.mapZoom || 1;
    var vw = MAP_BASE.w / zoom, vh = MAP_BASE.h / zoom;
    var vx = MAP_BASE.x + (MAP_BASE.w - vw) / 2, vy = MAP_BASE.y + (MAP_BASE.h - vh) / 2;
    var viewBox = vx + ' ' + vy + ' ' + vw + ' ' + vh;
    var parts = [];
    parts.push('<svg class="map-svg" viewBox="' + viewBox + '" role="img" aria-label="青崖山宗门舆图">');
    parts.push('<defs>' +
      '<linearGradient id="mapSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--map-sky-a)"/><stop offset="1" style="stop-color:var(--map-sky-b)"/></linearGradient>' +
      '<radialGradient id="spiritGlow"><stop offset="0" stop-color="#b9e0cf" stop-opacity=".8"/><stop offset="1" stop-color="#b9e0cf" stop-opacity="0"/></radialGradient>' +
      '<filter id="softGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '</defs>');
    parts.push('<rect x="0" y="0" width="780" height="520" fill="url(#mapSky)"/>');
    parts.push('<image class="map-distant-painting" href="assets/qingya-panorama.jpg" x="0" y="-5" width="780" height="520" preserveAspectRatio="xMidYMid slice" opacity=".45"/>');
    // 远山
    parts.push('<path d="M-40 500 L-40 145 Q55 85 120 165 L180 82 250 190 330 144 410 225 530 120 615 205 750 95 830 165 830 500 Z" fill="var(--map-hill-a)" opacity=".24"/>');
    // 石台侧壁与投影，把舆图托成云海中的一座山台。
    parts.push('<ellipse cx="390" cy="402" rx="310" ry="28" fill="#183e38" opacity=".13"/>');
    parts.push('<path d="M38 242 L326 98 742 306 454 450 38 242 L38 267 454 480 742 336 742 306 454 450 38 242" fill="#406659" stroke="#57766a" stroke-width="1"/>');
    parts.push('<path d="M38 252 L454 462 742 318 M90 284 l15 30 M180 330 l8 29 M280 382 l12 30 M390 438 l10 28 M530 422 l-4 28 M630 372 l-8 24" fill="none" stroke="#96b6a1" stroke-width="2" opacity=".4"/>');
    // 地块
    var rows = state.map || [];
    for (var y = 0; y < rows.length; y++) {
      for (var x = 0; x < rows[y].length; x++) {
        var t = rows[y][x];
        var p = iso(x, y);
        var cls = { G: 'grass', F: 'forest', M: 'mountain', W: 'water', S: 'spirit' }[t] || 'grass';
        var selected = UI.tile && UI.tile.x === x && UI.tile.y === y ? ' tile-selected' : '';
        parts.push('<g class="tile tile-' + cls + selected + '" data-tile="' + x + ',' + y + '">' +
          '<polygon points="' + tilePoly(p.x, p.y, 0) + '"/>' +
          '<polygon class="tile-edge" points="' + tilePoly(p.x, p.y, 0) + '"/>' +
          (t === 'G' || t === 'F' ? '<path class="terrain-brush" d="M' + (p.x - 19) + ',' + (p.y + 1) + ' l16,7 m0,-12 l18,8" fill="none" stroke="' + ((x + y) % 2 ? '#cee0b2' : '#365d41') + '" opacity=".1" stroke-width="4"/>' : '') +
          '</g>');
      }
    }
    // 小径
    (state.paths || []).forEach(function (pt) {
      var p = iso(pt[0], pt[1]);
      parts.push('<polygon class="path-tile" points="' + tilePoly(p.x, p.y, 5) + '"/>');
      parts.push('<circle cx="' + (p.x - 7) + '" cy="' + (p.y + 1) + '" r="1" fill="#9e8a68" opacity=".55"/><circle cx="' + (p.x + 5) + '" cy="' + (p.y + 3) + '" r="1" fill="#9e8a68" opacity=".4"/>');
    });
    // 装饰
    rows.forEach(function (row, yy) {
      row.forEach(function (t, xx) {
        var p = iso(xx, yy);
        var seed = hashStr(xx + ':' + yy + ':' + state.sectName);
        if (t === 'F') {
          parts.push(treeSvg(p.x - 8, p.y + 2, seed, 0.9 + (seed % 4) * 0.08));
          if (seed % 3 === 0) parts.push(treeSvg(p.x + 10, p.y - 3, seed + 7, 0.7));
        } else if (t === 'M') {
          parts.push(rockSvg(p.x, p.y, seed, 0.9 + (seed % 3) * 0.12));
        } else if (t === 'W') {
          parts.push(waterRipple(p.x, p.y, seed));
        } else if (t === 'S') {
          parts.push('<circle cx="' + p.x + '" cy="' + p.y + '" r="26" fill="url(#spiritGlow)"/><circle cx="' + p.x + '" cy="' + p.y + '" r="9" fill="none" stroke="#8bc0ae" stroke-width="1" stroke-dasharray="3 4" class="array-ring"/>');
        } else if (t === 'G' && seed % 9 === 0 && !E.buildingAt(state, xx, yy)) {
          parts.push('<path d="M' + (p.x - 4) + ' ' + (p.y + 2) + ' q3 -5 6 0" stroke="#7e9a5e" stroke-width="1" fill="none" opacity=".7"/><circle cx="' + (p.x + 2) + '" cy="' + (p.y - 1) + '" r="1.3" fill="#d6c27c" opacity=".8"/>');
        }
      });
    });
    // 山门小景
    (D.DECOR || []).forEach(function (item) { parts.push(decorSvg(item)); });
    // 建筑（按等距深度排序）
    state.buildings.slice().sort(function (a, b) { return (a.x + a.y) - (b.x + b.y) || a.x - b.x; }).forEach(function (b) {
      parts.push(buildingGroup(b));
    });
    // 弟子
    state.disciples.filter(function (d) { return !d.dead && !d.missionId; }).sort(function (a, b) {
      return unitPosition(a).y - unitPosition(b).y;
    }).forEach(function (d) { parts.push(tokenSvg(d)); });
    // 云影
    parts.push('<g class="cloud-shadows"><ellipse cx="180" cy="250" rx="130" ry="34" fill="#fff" opacity=".13"/><ellipse cx="560" cy="345" rx="160" ry="40" fill="#fff" opacity=".11"/><ellipse cx="420" cy="130" rx="100" ry="24" fill="#fff" opacity=".1"/></g>');
    parts.push('<g class="mountain-cranes" fill="none" stroke="#31554e" stroke-width="1.3" opacity=".65"><path d="M560 100 q5 -5 10 0 q5 -5 10 0 M590 88 q4 -4 8 0 q4 -4 8 0 M610 108 q3 -3 6 0 q3 -3 6 0"/></g>');
    parts.push('</svg>');
    return parts.join('');
  }

  function weatherLayer() {
    var w = weather();
    var n = w.id === 'rain' ? 26 : w.id === 'snow' ? 30 : w.id === 'fog' ? 3 : 12;
    var items = '';
    for (var i = 0; i < n; i++) {
      var seed = hashStr(i + ':' + w.id + ':' + UI.game.day);
      var left = seed % 100;
      var delay = ((seed >> 8) % 100) / 10;
      var dur = 3 + ((seed >> 12) % 40) / 10;
      var size = 2 + ((seed >> 16) % 4);
      var cls = w.id === 'rain' ? 'rain' : w.id === 'snow' ? 'snow' : w.id === 'fog' ? 'fog' : 'petal';
      items += '<i class="' + cls + '" style="left:' + left + '%;animation-delay:-' + delay + 's;animation-duration:' + dur + 's;--s:' + size + 'px"></i>';
    }
    return '<div class="weather-layer weather-' + w.id + '" aria-hidden="true">' + items + '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* 氛围图                                                             */
  /* ------------------------------------------------------------------ */
  function landingArt() {
    return '<svg class="landing-svg" viewBox="0 0 720 780" aria-hidden="true">' +
      '<defs><linearGradient id="lgSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe6d1"/><stop offset=".62" stop-color="#e3dcc6"/><stop offset="1" stop-color="#cdd4bf"/></linearGradient>' +
      '<linearGradient id="lgM1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cac99"/><stop offset="1" stop-color="#6f887a"/></linearGradient>' +
      '<linearGradient id="lgM2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#708879"/><stop offset="1" stop-color="#475f57"/></linearGradient>' +
      '<linearGradient id="lgM3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f675d"/><stop offset="1" stop-color="#2f443f"/></linearGradient>' +
      '<radialGradient id="lgMoon"><stop offset="0" stop-color="#fff8dc"/><stop offset="1" stop-color="#ead9a9"/></radialGradient>' +
      '<clipPath id="lgCardClip"><rect x="1" y="1" width="718" height="778" rx="26"/></clipPath></defs>' +
      '<g clip-path="url(#lgCardClip)">' +
      '<rect x="1" y="1" width="718" height="778" rx="26" fill="url(#lgSky)" opacity=".62"/>' +
      '<circle cx="524" cy="154" r="63" fill="url(#lgMoon)" opacity=".9"/>' +
      '<circle cx="524" cy="154" r="96" fill="none" stroke="#d8c99e" stroke-width=".7" opacity=".5"/>' +
      '<g class="landing-cloud c1"><ellipse cx="190" cy="180" rx="130" ry="20" fill="#f7f0df" opacity=".55"/><ellipse cx="280" cy="168" rx="90" ry="14" fill="#f7f0df" opacity=".4"/></g>' +
      '<g class="landing-cloud c2"><ellipse cx="560" cy="300" rx="150" ry="18" fill="#f7f0df" opacity=".4"/></g>' +
      '<path d="M-20 500 Q90 350 190 420 Q260 470 330 390 Q420 290 500 410 Q570 500 740 430 L740 780 L-20 780 Z" fill="url(#lgM1)" opacity=".75"/>' +
      '<path d="M-20 590 Q120 440 230 520 Q320 580 400 500 Q480 420 560 520 Q640 600 740 540 L740 780 L-20 780 Z" fill="url(#lgM2)" opacity=".88"/>' +
      '<path d="M-20 700 Q100 570 220 640 Q300 690 380 610 Q470 520 560 630 Q640 710 740 650 L740 780 L-20 780 Z" fill="url(#lgM3)"/>' +
      '<path d="M0 610 Q160 560 320 600 T720 575" stroke="#f5eddb" stroke-width="26" fill="none" opacity=".24"/>' +
      '<path d="M0 676 Q180 640 350 675 T720 650" stroke="#f5eddb" stroke-width="18" fill="none" opacity=".18"/>' +
      // 松树
      '<g fill="#314941">' +
      '<path d="M158 612 l-18 46 h10 l-12 28 h40 l-12 -28 h10 z"/><path d="M130 674 l8 16 M186 674 l-8 16" stroke="#314941" stroke-width="6"/>' +
      '<path d="M592 590 l-16 42 h9 l-11 26 h36 l-11 -26 h9 z"/><path d="M570 650 l7 14 M614 650 l-7 14" stroke="#314941" stroke-width="5"/>' +
      '</g>' +
      // 山门
      '<g transform="translate(394,586)" class="landing-gate">' +
      '<path d="M-54 60 L54 60 L44 72 L-44 72 Z" fill="#3f5148"/>' +
      '<path d="M-40 58 L-40 -30 L-31 -30 L-31 58 M40 58 L40 -30 L31 -30 L31 58" fill="#7e4539"/>' +
      '<path d="M-54 -28 L0 -58 L54 -28 L0 -14 Z" fill="#4a332b"/>' +
      '<path d="M-54 -28 L0 -58 L0 -14 Z" fill="#3a2721"/>' +
      '<rect x="-16" y="-27" width="32" height="12" rx="1.5" fill="#a33b2a"/><text x="0" y="-18" text-anchor="middle" font-size="8" fill="#f1e4cb" font-family="serif">青崖</text>' +
      '<circle cx="0" cy="18" r="28" fill="#e6bd6a" opacity=".12"/><rect x="-6" y="8" width="12" height="18" fill="#d8a75a" opacity=".85"/>' +
      '</g>' +
      '<g class="landing-birds" fill="none" stroke="#48594f" stroke-width="2" stroke-linecap="round"><path d="M250 250 q8 -8 16 0 q8 -8 16 0"/><path d="M300 225 q6 -6 12 0 q6 -6 12 0"/><path d="M210 300 q5 -5 10 0 q5 -5 10 0"/></g>' +
      '<g class="landing-mist"><ellipse cx="350" cy="610" rx="300" ry="26" fill="#f4ecdb" opacity=".35"/><ellipse cx="470" cy="555" rx="220" ry="18" fill="#f4ecdb" opacity=".25"/></g>' +
      '</g>' +
      '<rect x="1" y="1" width="718" height="778" rx="26" fill="none" stroke="rgba(120,98,66,.2)" stroke-width="1.5"/>' +
      '</svg>';
  }

  function eventArt(type) {
    var base = '<svg class="event-scene" viewBox="0 0 800 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><linearGradient id="eaSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9e0ca"/><stop offset="1" stop-color="#c8d2c1"/></linearGradient></defs>' +
      '<rect width="800" height="220" fill="url(#eaSky)"/>' +
      '<circle cx="650" cy="66" r="38" fill="#f7edcb" opacity=".9"/>' +
      '<path d="M-20 178 Q110 88 230 150 T470 130 T820 158 L820 240 L-20 240 Z" fill="#9caf9c" opacity=".7"/>' +
      '<path d="M-20 200 Q130 128 280 180 T540 160 T820 188 L820 240 L-20 240 Z" fill="#5a7468" opacity=".75"/>' +
      '<path d="M-20 225 Q180 180 380 212 T820 198 L820 240 L-20 240 Z" fill="#31463f"/>';
    var extra = '';
    if (type === 'rain') {
      extra = '<g stroke="#d7e5e0" stroke-width="1.4" opacity=".6">' + Array.from({ length: 24 }, function (_, i) {
        var x = (i * 97) % 800, y = (i * 43) % 180;
        return '<path d="M' + x + ' ' + y + ' l-8 18"/>';
      }).join('') + '</g>';
    } else if (type === 'beast') {
      extra = '<g fill="#2f3c34"><path d="M120 195 q10 -50 34 -58 q24 8 34 58 z"/><path d="M150 142 l-10 -18 l20 8 z M172 140 l12 -18 l-4 21 z"/><circle cx="152" cy="157" r="2.5" fill="#d9a64e"/><circle cx="172" cy="157" r="2.5" fill="#d9a64e"/></g><g fill="#e8c46b"><circle cx="152" cy="157" r="1" /><circle cx="172" cy="157" r="1"/></g>';
    } else if (type === 'merchant') {
      extra = '<g transform="translate(120,154)" fill="#4f3b2d"><rect x="0" y="-18" width="96" height="26" rx="3"/><path d="M8 8 L4 24 M88 8 L92 24" stroke="#4f3b2d" stroke-width="3"/><circle cx="22" cy="28" r="10" fill="none" stroke="#4f3b2d" stroke-width="3"/><circle cx="74" cy="28" r="10" fill="none" stroke="#4f3b2d" stroke-width="3"/><path d="M-8 -18 Q48 -42 104 -18" fill="none" stroke="#8f6a43" stroke-width="2"/></g><g fill="#6f5a42"><rect x="140" y="130" width="18" height="18"/><rect x="164" y="136" width="14" height="12"/></g>';
    } else if (type === 'sword') {
      extra = '<g transform="translate(600,170) rotate(-18)" stroke="#f1e7d2" stroke-width="3"><path d="M0 0 L0 -120" /><path d="M-18 -12 L18 -12" /><path d="M0 0 L0 28" stroke="#a33b2a" stroke-width="5"/></g><path d="M560 180 q30 -40 70 -54" stroke="#f1e7d2" stroke-width="2" opacity=".3" fill="none"/>';
    } else if (type === 'plague') {
      extra = '<g fill="#ded4c2" opacity=".55"><circle cx="160" cy="160" r="28"/><circle cx="205" cy="130" r="38"/><circle cx="260" cy="162" r="24"/><circle cx="620" cy="150" r="24"/><circle cx="665" cy="125" r="32"/></g>';
    } else if (type === 'crane') {
      extra = '<g transform="translate(520,120)" fill="#f4eddc" stroke="#5d6f64" stroke-width="1.4"><path d="M0 0 q20 -28 48 -20 q22 8 20 28 q-4 18 -26 18 q-26 0 -42 -26 z"/><path d="M46 -18 q12 -8 20 -2 l-10 10" fill="none"/><path d="M10 22 l-4 34 M28 22 l4 34" stroke="#5d6f64"/><circle cx="62" cy="-13" r="2" fill="#a33b2a"/></g>';
    } else if (type === 'assembly') {
      extra = '<g transform="translate(600,170)"><path d="M0 0 L0 -70" stroke="#5d4a36" stroke-width="3"/><path d="M0 -70 q28 10 48 0 l-10 28 q-20 8 -38 0 z" fill="#a33b2a"/></g><g transform="translate(680,180)"><path d="M0 0 L0 -52" stroke="#5d4a36" stroke-width="2"/><path d="M0 -52 q22 8 38 0 l-8 22 q-16 6 -30 0 z" fill="#b08a4a"/></g>';
    } else if (type === 'moon') {
      extra = '<circle cx="650" cy="66" r="58" fill="none" stroke="#f7edcb" stroke-width="1" opacity=".5"/><path d="M120 190 q18 -42 38 0" stroke="#31463f" stroke-width="3" fill="none"/><path d="M138 176 l-2 -20 M150 176 l4 -18" stroke="#31463f" stroke-width="2"/>';
    } else {
      extra = '<path d="M120 198 q20 -80 46 -80 q26 0 46 80" fill="#31463f" opacity=".75"/><path d="M150 158 l-8 -18 l16 8 z M174 156 l10 -18 l0 20 z" fill="#31463f"/>';
    }
    return base + extra + '</svg>';
  }

  /* ------------------------------------------------------------------ */
  /* 落地页 / 建号                                                      */
  /* ------------------------------------------------------------------ */
  function renderLanding() {
    stopTimer();
    UI.game = null;
    UI.modalOpen = false;
    var hasSave = E.hasSave();
    var app = document.getElementById('app');
    app.innerHTML = '<div class="landing">' +
      '<div class="landing-grain"></div>' +
      '<div class="landing-inner">' +
      '<section class="landing-copy">' +
      '<div class="landing-brand"><span class="brand-seal large">念</span><span>青崖山 · 宗门纪</span></div>' +
      '<p class="landing-edition">青绿山水卷 · 宗门经营</p>' +
      '<h1>一念长生</h1>' +
      '<p class="landing-sub">从三间茅屋，到一座仙门。</p>' +
      '<p class="landing-intro">半卷残经，几名弟子，一座等你点亮的山门。<br>春耕秋藏，炼丹问道，在人间烟火里，走一段长生路。</p>' +
      '<div class="landing-actions">' +
      (hasSave ? '<button class="btn btn-primary btn-lg" data-action="continue">继续前缘</button><button class="btn btn-ghost btn-lg" data-action="new-game">重开山门</button>' : '<button class="btn btn-primary btn-lg" data-action="new-game">开宗立派</button><button class="btn btn-ghost btn-lg" data-action="help">玩法说明</button>') +
      '</div>' +
      '<div class="landing-features">' +
      '<div><b>经营山门</b><span>建房、布局、风水与四时生产</span></div>' +
      '<div><b>培养弟子</b><span>内外门弟子、差事安排与破境飞升</span></div>' +
      '<div><b>应对江湖</b><span>历练、商队、兽潮与仙门大比</span></div>' +
      '</div>' +
      '<p class="landing-foot">原创网页作品 · 适配手机 · 存档保存在本机 · 无需安装</p>' +
      '</section>' +
      '<div class="landscape-inscription" aria-hidden="true">山中无甲子<br>一念即长生<span>青崖山记</span></div>' +
      '</div></div>';
  }

  function renderCreation() {
    var app = document.getElementById('app');
    var origins = Object.keys(D.ORIGINS).map(function (k) {
      var o = D.ORIGINS[k];
      return '<button class="choice-card ' + (UI.create.origin === k ? 'active' : '') + '" data-action="choose-origin" data-value="' + k + '">' +
        '<span class="choice-glyph">' + h(o.glyph) + '</span><b>' + h(o.name) + '</b><small>' + h(o.bonusText) + '</small><span class="choice-desc">' + h(o.desc) + '</span></button>';
    }).join('');
    var roots = Object.keys(D.ROOTS).map(function (k) {
      var r = D.ROOTS[k];
      return '<button class="root-card ' + (UI.create.root === k ? 'active' : '') + '" data-action="choose-root" data-value="' + k + '" style="--root:' + r.color + '">' +
        '<span class="choice-glyph">' + h(r.glyph) + '</span><b>' + h(r.name) + '</b><small>' + h(r.desc) + '</small></button>';
    }).join('');
    app.innerHTML = '<div class="creation">' +
      '<div class="creation-panel panel">' +
      '<div class="creation-head"><div><p class="eyebrow">BEGIN A NEW SECT</p><h2>重立山门</h2><p>青崖山很大，先给山门起个名字。</p></div><button class="btn btn-ghost btn-sm" data-action="back-landing">返回</button></div>' +
      '<div class="form-row"><label>宗门名</label><input id="sect-name" maxlength="10" value="' + h(UI.create.sectName) + '"></div>' +
      '<div class="form-row"><label>掌门名</label><input id="player-name" maxlength="8" value="' + h(UI.create.playerName) + '"></div>' +
      '<div class="form-block"><div class="form-label"><span>出身</span><small>影响开局资源与一点天赋</small></div><div class="choice-grid">' + origins + '</div></div>' +
      '<div class="form-block"><div class="form-label"><span>灵根</span><small>影响修行速度与擅长之事</small></div><div class="root-grid">' + roots + '</div></div>' +
      '<div class="creation-tip">' + seal('记') + '<p>外门弟子负责劳作，内门弟子专注修炼。开局有三名外门弟子，分别照看灵田、药圃与膳堂；掌门坐镇山门，也可以与弟子一同领差事。先让山门转起来，再谈长生。</p></div>' +
      '<div class="creation-actions"><button class="btn btn-primary btn-lg" data-action="start-game">立下山门</button><button class="btn btn-ghost" data-action="help">先看玩法</button></div>' +
      '</div></div>';
  }

  function captureCreateFields() {
    var sn = document.getElementById('sect-name');
    var pn = document.getElementById('player-name');
    if (sn) UI.create.sectName = sn.value.trim() || '青崖宗';
    if (pn) UI.create.playerName = pn.value.trim() || '沈未央';
  }

  function startGame() {
    captureCreateFields();
    var sectName = UI.create.sectName;
    var playerName = UI.create.playerName;
    UI.game = E.newGame({
      sectName: sectName || '青崖宗',
      playerName: playerName || '沈未央',
      origin: UI.create.origin,
      root: UI.create.root
    });
    UI.settings.speed = 1;
    UI.speed = 1;
    UI.tab = 'sect';
    UI.filter = 'all';
    UI.selectedBuilding = null;
    UI.modalOpen = false;
    UI.modalKey = '';
    document.getElementById('app').innerHTML = shellHtml();
    renderAll();
    saveNow();
    startTimer();
    openIntro();
  }

  function continueGame() {
    var s = E.load();
    if (!s) { toast('没有找到可用的存档。', 'warn'); renderLanding(); return; }
    UI.game = s;
    UI.tab = 'sect';
    UI.modalOpen = false;
    document.getElementById('app').innerHTML = shellHtml();
    renderAll();
    startTimer();
  }

  /* ------------------------------------------------------------------ */
  /* 主壳                                                               */
  /* ------------------------------------------------------------------ */
  function shellHtml() {
    return '<div class="game-shell">' +
      '<div class="topbar-wrap" id="topbar-wrap"></div>' +
      '<main class="game-main" id="game-main"><div id="view"></div></main>' +
      '<nav class="bottom-nav" id="bottom-nav" aria-label="主导航"></nav>' +
      '</div>';
  }

  function renderHeader() {
    if (!UI.game) return;
    var st = stats();
    var d = date(UI.game);
    var w = weather();
    var chips = [
      { id: 'stones', val: UI.game.resources.stones },
      { id: 'food', val: UI.game.resources.food, delta: signed(fmt1(E.dailyRates(UI.game).food - st.dailyFood)) + '/日' },
      { id: 'wood', val: UI.game.resources.wood },
      { id: 'stone', val: UI.game.resources.stone },
      { id: 'herbs', val: UI.game.resources.herbs },
      { id: 'insight', val: UI.game.insight, name: '悟道', glyph: '道', color: '#7b5f84' },
      { id: 'renown', val: UI.game.resources.renown }
    ];
    var html = '<header class="topbar">' +
      '<div class="brand"><button class="brand-seal" data-action="settings" aria-label="打开设置">念</button><div class="brand-text"><h1>' + h(D.TITLE) + '</h1><p>' + h(UI.game.sectName) + ' · ' + h(st.grade.name) + '</p></div></div>' +
      '<div class="topbar-right">' +
      '<div class="date-block"><span class="season-glyph" style="color:' + d.season.color + '">' + d.season.glyph + '</span><div><b>' + d.month + '月' + d.dayOfMonth + '日</b><small>青历 ' + d.year + ' 年 · ' + w.name + (UI.paused ? (UI.autoPaused ? ' · 已暂停 · 安排中' : ' · 已暂停') : '') + '</small></div></div>' +
      '<div class="speed-control" role="group" aria-label="时间速度">' +
      '<button class="speed-btn ' + (UI.paused ? 'active' : '') + '" data-action="pause" aria-label="暂停">Ⅱ</button>' +
      '<button class="speed-btn ' + (!UI.paused && UI.speed === 1 ? 'active' : '') + '" data-action="speed" data-value="1">1×</button>' +
      '<button class="speed-btn ' + (!UI.paused && UI.speed === 2 ? 'active' : '') + '" data-action="speed" data-value="2">2×</button>' +
      '<button class="speed-btn ' + (!UI.paused && UI.speed === 4 ? 'active' : '') + '" data-action="speed" data-value="4">4×</button>' +
      '</div>' +
      '<div class="mobile-speed">' +
      '<button class="icon-btn" data-action="pause" aria-label="' + (UI.paused ? '继续' : '暂停') + '">' + (UI.paused ? '▶' : 'Ⅱ') + '</button>' +
      '<button class="icon-btn speed-cycle" data-action="speed-cycle" aria-label="切换速度">' + UI.speed + '×</button>' +
      '</div>' +
      '<button class="icon-btn alert-btn" data-action="alerts" aria-label="山门警讯">讯' + (E.alerts(UI.game).length ? '<i>' + E.alerts(UI.game).length + '</i>' : '') + '</button>' +
      '<button class="icon-btn" data-action="settings" aria-label="设置">设</button>' +
      '</div></header>' +
      '<div class="resource-strip">' +
      chips.map(function (c) {
        var meta = c.id === 'insight' ? { name: c.name, glyph: c.glyph, color: c.color } : D.RESOURCES[c.id];
        var label = meta ? meta.name : c.id;
        var glyph = meta ? meta.glyph : '?';
        var color = meta ? meta.color : '#7d7565';
        var delta = '';
        if (c.id === 'food') delta = '<small class="res-delta">' + c.delta + '</small>';
        if (c.id === 'renown' && st.nextGrade) delta = '<small class="res-delta">→ ' + st.nextGrade.name + '</small>';
        return '<button class="res-chip" data-action="nav" data-tab="' + (c.id === 'renown' ? 'sect' : c.id === 'insight' ? 'affairs' : 'market') + '" title="' + h(label) + '">' +
          '<span class="res-glyph" style="--rc:' + color + '">' + h(glyph) + '</span><span class="res-main"><b>' + fmt(c.val) + '</b><small>' + h(label) + '</small></span>' + delta + '</button>';
      }).join('') +
      '</div>';
    document.getElementById('topbar-wrap').innerHTML = html;
  }

  function renderNav() {
    var st = stats();
    var badges = {
      sect: (UI.game.pendingEvent ? 1 : 0) + (st.foodDays <= 3 ? 1 : 0),
      disciples: E.aliveDisciples(UI.game).filter(function (d) { return d.exp >= E.expNeed(d) && d.realm < 9; }).length,
      build: 0,
      market: 0
    };
    document.getElementById('bottom-nav').innerHTML = D.UI.nav.map(function (n) {
      return '<button class="nav-btn ' + (UI.tab === n.id ? 'active' : '') + '" data-action="nav" data-tab="' + n.id + '" aria-label="' + n.label + '">' +
        '<span class="nav-glyph">' + n.glyph + (badges[n.id] ? '<i>' + badges[n.id] + '</i>' : '') + '</span><span>' + n.label + '</span></button>';
    }).join('');
  }

  function renderAll() {
    if (!UI.game) return;
    renderHeader();
    renderNav();
    renderView();
    syncAutoModals();
  }

  function renderView() {
    if (!UI.game) return;
    if (UI.game.ending) { renderEnding(); return; }
    var scroll = window.scrollY;
    if (UI.tab === 'sect') renderSect();
    else if (UI.tab === 'disciples') renderDisciples();
    else if (UI.tab === 'build') renderBuild();
    else if (UI.tab === 'affairs') renderAffairs();
    else if (UI.tab === 'market') renderMarket();
    window.scrollTo(0, scroll);
  }

  /* ------------------------------------------------------------------ */
  /* 宗门视图                                                           */
  /* ------------------------------------------------------------------ */
  function resourceText(items) {
    return Object.keys(items).map(function (key) {
      return (D.RESOURCES[key] ? D.RESOURCES[key].name : key === 'insight' ? '悟道' : key) + ' ' + items[key];
    }).join(' · ');
  }

  function chapterGoals(chapter) {
    return '<div class="chapter-goals">' + chapter.goals.map(function (g) {
      return '<button class="chapter-goal ' + (g.done ? 'done' : '') + '" data-action="journey-go" data-tab="' + g.tab + '" data-affairs="' + g.affairs + '"><span class="goal-tick">' + (g.done ? '✓' : '○') + '</span><span>' + h(g.text) + '</span><small>' + Math.min(g.current, g.target) + '/' + g.target + '</small></button>';
    }).join('') + '</div>';
  }

  function journeyCard() {
    var chapters = E.journey(UI.game), current = chapters.find(function (c) { return !c.claimed; });
    if (!current) return '<section class="panel journey-card"><span class="chapter-label">宗门长卷 · 七章已成</span><h3>长生有期，山门长明。</h3><p>回望青崖，一草一木皆是来路。</p><button class="text-btn" data-action="open-journey">回看宗门长卷 ›</button></section>';
    return '<section class="panel journey-card"><div class="chapter-top"><span class="chapter-label">宗门长卷 · 第' + '一二三四五六七'.charAt(current.number - 1) + '章</span><button class="text-btn" data-action="open-journey">全卷 ›</button></div><h3>' + h(current.title) + '</h3><p class="chapter-subtitle">' + h(current.subtitle) + '</p>' + chapterGoals(current) + '<div class="chapter-reward"><small>本章馈赠</small><span>' + h(resourceText(current.reward)) + '</span></div><button class="btn ' + (current.ready ? 'btn-primary' : 'btn-ghost') + ' claim-button" data-action="claim-chapter" data-id="' + current.id + '"' + (current.ready ? '' : ' disabled') + '>' + (current.ready ? '领取本章馈赠' : '达成条件后领取 · ' + current.progress + '%') + '</button></section>';
  }

  function commissionCard() {
    var c = E.commission(UI.game);
    return '<section class="panel commission-card"><div class="chapter-top"><span class="chapter-label">四时委托 · ' + c.season + '</span><span class="small muted">' + c.daysLeft + ' 日后换季</span></div><h3>' + h(c.title) + '</h3><p class="commission-text">' + h(c.text) + '</p><div class="commission-exchange"><div><small>交付物资</small><b>' + h(resourceText(c.cost)) + '</b></div><span aria-hidden="true">⇢</span><div><small>山下回礼</small><b>' + h(resourceText(c.reward)) + '</b></div></div><button class="btn btn-ghost claim-button" data-action="fulfill-commission" data-id="' + c.id + '"' + (c.claimed || !c.affordable ? ' disabled' : '') + '>' + (c.claimed ? '本季已结清' : c.affordable ? '交付物资，收取回礼' : '物资不足，待备齐后交付') + '</button><p class="commission-note">每个游戏季节可完成一次</p></section>';
  }

  function openJourney() {
    var chapters = E.journey(UI.game);
    openModal('<div class="modal-head"><div><p class="chapter-label">青崖山记</p><h2>宗门长卷</h2><p class="muted">从一缕炊烟，到万家灯火。每一章，都有山门的来路。</p></div><button class="modal-close" data-action="close-modal" aria-label="关闭">×</button></div><div class="journey-scroll">' + chapters.map(function (c) {
      return '<section class="journey-entry ' + (c.claimed ? 'is-claimed' : c.locked ? 'is-locked' : 'is-current') + '"><div class="journey-number">' + '一二三四五六七'.charAt(c.number - 1) + '</div><div class="journey-entry-body"><div class="chapter-top"><h3>' + h(c.title) + '</h3><span class="badge">' + (c.claimed ? '已落笔' : c.locked ? '前章未完' : c.ready ? '可领取' : '进行中') + '</span></div><p>' + h(c.claimed ? c.story : c.subtitle) + '</p>' + chapterGoals(c) + '<small class="muted">馈赠：' + h(resourceText(c.reward)) + '</small>' + (c.ready ? '<button class="btn btn-primary btn-sm" data-action="claim-chapter" data-id="' + c.id + '">领取馈赠</button>' : '') + '</div></section>';
    }).join('') + '</div>', { key: 'journey', class: 'journey-modal' });
  }

  function renderSect() {
    if (!UI.game) return;
    var st = stats();
    var d = date(UI.game);
    var view = document.getElementById('view');
    var selected = UI.selectedBuilding ? E.buildingById(UI.game, UI.selectedBuilding) : null;
    var tasks = [];
    if (st.foodDays <= 4) tasks.push({ text: '存粮仅够 ' + st.foodDays + ' 日，去坊市买粮或加派灵田人手。', tab: 'market', label: '去坊市' });
    var bottleneck = E.aliveDisciples(UI.game).filter(function (x) { return x.exp >= E.expNeed(x) && x.realm < 9 && !x.autoBreakthrough; })[0];
    if (bottleneck) tasks.push({ text: bottleneck.name + '已至瓶颈，可助其突破。', tab: 'disciples', label: '查看弟子', discipleId: bottleneck.id });
    var idle = UI.game.buildings.find(function (b) {
      var def = E.def(b);
      return def && def.slots > 0 && b.type !== 'meditation' && !b.construction && !b.workers.length;
    });
    if (idle) tasks.push({ text: E.def(idle).name + '无人值守，产出停摆。', tab: 'sect', label: '查看建筑', buildingId: idle.id });
    if (!tasks.length) tasks.push({ text: '山门安稳。当前目标是晋为' + (st.nextGrade ? st.nextGrade.name : '仙道圣地') + '。', tab: 'affairs', label: '安排事务' });
    var topDisciples = E.aliveDisciples(UI.game).sort(function (a, b) { return E.power(b, UI.game) - E.power(a, UI.game); }).slice(0, 3);

    view.innerHTML = '<section class="scenic-header" aria-label="青崖山水"><div class="scenic-copy"><span class="scenic-kicker">青崖山 · ' + d.season.full + '</span><h2>山有归处，心向长生。</h2><p>' + h(d.season.desc) + '</p><button class="scenic-link" data-action="open-journey">展开宗门长卷 <span>七章仙途 ›</span></button></div><div class="scenic-seal" aria-hidden="true">青崖<br>山居</div></section><div class="sect-layout"><div class="mountain-column">' +
      '<section class="map-panel panel">' +
      '<div class="map-head"><div><p class="eyebrow">一山一门 · 一草一木</p><h2>' + h(UI.game.sectName) + ' · 山门舆图</h2></div><div class="map-head-right"><span class="weather-chip">' + h(weather().glyph) + ' · ' + h(d.season.full) + '</span><span class="badge badge-grade" style="--grade:' + st.grade.color + '">' + h(st.grade.name) + '</span></div></div>' +
      '<div class="map-frame" id="map-frame" data-season="' + d.season.key + '">' +
      mapSvg() +
      weatherLayer() +
      '<div class="map-plaque"><b>青崖山</b><span>云深不知处</span></div>' +
      '<div class="map-side-tools">' +
      '<button class="map-tool" data-action="map-zoom-in" aria-label="放大">＋</button>' +
      '<button class="map-tool" data-action="map-zoom-out" aria-label="缩小">−</button>' +
      '<button class="map-tool" data-action="map-reset" aria-label="复位">回</button>' +
      '</div>' +
      '</div>' +
      '<div class="map-foot"><div class="map-legend"><span>' + dot('#8f6a43') + '宗门建筑</span><span>' + dot('#4e7c78') + '内门弟子</span><span>' + dot('#b08a4a') + '外门弟子</span><span>' + dot('#7fa3a2') + '水泽</span><span>' + dot('#b9d6c6') + '灵脉</span></div><span class="map-hint">点击建筑或弟子查看详情</span></div>' +
      '</section><div class="activity-grid">' + journeyCard() + commissionCard() + '</div></div>' +

      '<aside class="side-column">' +
      (selected ? selectedBuildingCard(selected) : '') +
      '<div class="panel sect-status">' +
      '<div class="panel-head"><h3>宗门气象</h3><span class="panel-mark">' + st.fsGrade + '</span></div>' +
      '<div class="grade-line"><span class="badge badge-grade" style="--grade:' + st.grade.color + '">' + h(st.grade.name) + '</span><span>' + h(st.grade.desc) + '</span></div>' +
      '<div class="renown-line"><span>声望 ' + fmt(UI.game.resources.renown) + (st.nextGrade ? ' / ' + st.nextGrade.min : '') + '</span><div class="bar bar-renown"><i style="width:' + (st.nextGrade ? pct((UI.game.resources.renown - st.grade.min) / (st.nextGrade.min - st.grade.min) * 100) : 100) + '%"></i></div></div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><small>灵气</small><b>' + st.aura + '</b><span>修炼加成</span></div>' +
      '<div class="stat"><small>风水</small><b>' + st.fengShui + '</b><span>' + st.fsGrade + '</span></div>' +
      '<div class="stat"><small>弟子</small><b>' + st.innerCount + '<em>内</em> / ' + st.outerCount + '<em>外</em></b><span>床位 ' + st.housing + '</span></div>' +
      '<div class="stat"><small>存粮</small><b>' + st.foodDays + '<em>日</em></b><span>每日 ' + st.dailyFood + '</span></div>' +
      '<div class="stat"><small>内门战力</small><b>' + fmt(st.power) + '</b><span>山门守备</span></div>' +
      '<div class="stat"><small>空地</small><b>' + countBuildable() + '</b><span>可营造</span></div>' +
      '</div>' +
      '<div class="fs-track"><div class="fs-track-head"><span>风水格局</span><span>' + st.fsGrade + '</span></div>' + bar(st.fengShui, 'bar-jade') + '</div>' +
      (st.layoutNotes.length ? '<div class="layout-notes">' + st.layoutNotes.slice(0, 3).map(function (n) { return '<span class="mini-chip">' + h(n) + '</span>'; }).join('') + '</div>' : '') +
      '</div>' +

      '<div class="panel objective-panel">' +
      '<div class="panel-head"><h3>当前要务</h3><span class="panel-mark">令</span></div>' +
      tasks.slice(0, 2).map(function (t) {
        return '<div class="objective"><span class="objective-dot"></span><p>' + h(t.text) + '</p><button class="btn btn-ghost btn-sm" data-action="task-go" data-tab="' + t.tab + '" data-disciple="' + (t.discipleId || '') + '" data-building="' + (t.buildingId || '') + '">' + h(t.label) + '</button></div>';
      }).join('') +
      '</div>' +

      '<div class="panel disciples-snapshot"><div class="panel-head"><h3>山中弟子</h3><button class="text-btn" data-action="nav" data-tab="disciples">全部 ›</button></div>' +
      topDisciples.map(function (d) {
        return '<button class="snapshot-row" data-action="open-disciple" data-id="' + d.id + '">' + avatarSvg(d, 40) +
          '<span class="snapshot-main"><b>' + h(d.name) + '</b><small>' + h(stage(d)) + ' · ' + h(d.stateLabel) + '</small></span>' +
          '<span class="snapshot-mood">' + moodGlyph(d.mood) + '</span></button>';
      }).join('') + '</div>' +

      '<div class="panel news-panel"><div class="panel-head"><h3>山门纪要</h3><button class="text-btn" data-action="open-log">全部 ›</button></div>' +
      logList(6) + '</div>' +
      '</aside></div>';
  }

  function selectedBuildingCard(b) {
    var def = E.def(b);
    if (!def) return '';
    return '<div class="panel selected-building"><div class="panel-head"><h3>' + h(def.name) + '</h3><button class="text-btn" data-action="open-building" data-id="' + b.id + '">详情 ›</button></div>' +
      '<div class="selected-building-main">' + seal(def.glyph) + '<div><b>Lv.' + b.level + '</b><p>' + h(def.effect) + '</p><small>' + (b.construction > 0 ? '营造中 · 还需 ' + Math.ceil(b.construction) + ' 日' : b.workers.length + ' / ' + E.slotsOf(b) + ' 人当值') + '</small></div></div></div>';
  }

  function moodGlyph(m) {
    if (m >= 75) return '<span class="mood-face good">喜</span>';
    if (m >= 50) return '<span class="mood-face">平</span>';
    if (m >= 30) return '<span class="mood-face warn">忧</span>';
    return '<span class="mood-face bad">苦</span>';
  }

  function logList(limit) {
    var list = (UI.game.log || []).slice(0, limit);
    if (!list.length) return '<p class="muted">山中无大事。</p>';
    return '<div class="log-list">' + list.map(function (l) {
      return '<div class="log-item log-' + l.type + '"><span class="log-date">' + h(l.date) + '</span><span class="log-dot"></span><p>' + h(l.text) + '</p></div>';
    }).join('') + '</div>';
  }

  function countBuildable() {
    var n = 0;
    for (var y = 0; y < UI.game.map.length; y++) {
      for (var x = 0; x < UI.game.map[y].length; x++) if (E.isBuildable(UI.game, x, y)) n++;
    }
    return n;
  }

  /* ------------------------------------------------------------------ */
  /* 弟子视图                                                           */
  /* ------------------------------------------------------------------ */
  function renderDisciples() {
    var list = E.aliveDisciples(UI.game).slice().sort(function (a, b) {
      if (a.role !== b.role) return a.role === 'inner' ? -1 : 1;
      return (b.realm - a.realm) || (b.layer - a.layer) || a.name.localeCompare(b.name, 'zh');
    });
    if (UI.filter === 'inner') list = list.filter(function (d) { return d.role === 'inner'; });
    if (UI.filter === 'outer') list = list.filter(function (d) { return d.role === 'outer'; });
    if (UI.filter === 'idle') list = list.filter(function (d) { return !d.job && !d.missionId; });
    if (UI.filter === 'hurt') list = list.filter(function (d) { return d.injury > 20 || d.health < 70; });
    if (UI.filter === 'mission') list = list.filter(function (d) { return d.missionId; });
    var filters = [['all', '全部'], ['inner', '内门'], ['outer', '外门'], ['idle', '空闲'], ['hurt', '受伤'], ['mission', '在外']];
    var st = stats();
    document.getElementById('view').innerHTML = '<div class="view-page">' +
      '<div class="view-head"><div><p class="eyebrow">DISCIPLES OF THE SECT</p><h2>山中弟子</h2><p>外门劳作，内门修行。人各有命，也各有各的心事。</p></div>' +
      '<div class="view-head-actions"><span class="capacity-note">床位 ' + st.housing + ' · 弟子 ' + (st.innerCount + st.outerCount) + '</span><button class="btn btn-primary" data-action="recruit">招收外门 <small>20 灵石</small></button></div></div>' +
      '<div class="filter-tabs">' + filters.map(function (f) {
        return '<button class="filter-chip ' + (UI.filter === f[0] ? 'active' : '') + '" data-action="filter" data-value="' + f[0] + '">' + f[1] + '<small>' + (f[0] === 'all' ? E.aliveDisciples(UI.game).length : listCount(f[0])) + '</small></button>';
      }).join('') + '</div>' +
      '<div class="disciple-grid">' + list.map(discipleCard).join('') + '</div>' +
      (list.length ? '' : '<div class="empty-state">' + seal('静') + '<h3>这里暂时没有人</h3><p>换个筛选，或者去山门外招几个弟子。</p><button class="btn btn-ghost" data-action="recruit">招收外门</button></div>') +
      '</div>';
  }

  function listCount(filter) {
    var list = E.aliveDisciples(UI.game);
    if (filter === 'inner') return list.filter(function (d) { return d.role === 'inner'; }).length;
    if (filter === 'outer') return list.filter(function (d) { return d.role === 'outer'; }).length;
    if (filter === 'idle') return list.filter(function (d) { return !d.job && !d.missionId; }).length;
    if (filter === 'hurt') return list.filter(function (d) { return d.injury > 20 || d.health < 70; }).length;
    if (filter === 'mission') return list.filter(function (d) { return d.missionId; }).length;
    return list.length;
  }

  function jobChoices(d) {
    var jobs = E.eligibleJobs(UI.game, d).slice();
    if (d.job) {
      var cur = E.buildingById(UI.game, d.job);
      if (cur && !jobs.some(function (b) { return b.id === cur.id; })) jobs.unshift(cur);
    }
    return jobs;
  }

  function jobSelectHtml(d, extraClass, label) {
    if (d.missionId) return '<span class="job-quick job-quick-static ' + (extraClass || '') + '"><span>' + (label || '差事') + '</span><b>在外历练</b></span>';
    var options = '<option value="">待命</option><option value="auto">自动安排</option>';
    jobChoices(d).forEach(function (b) {
      var def = E.def(b);
      var full = b.workers.length >= E.slotsOf(b) && d.job !== b.id;
      options += '<option value="' + b.id + '" ' + (d.job === b.id ? 'selected' : '') + (full ? ' disabled' : '') + '>' +
        h(def.name) + ' · ' + b.workers.length + '/' + E.slotsOf(b) + '</option>';
    });
    return '<label class="job-quick ' + (extraClass || '') + '"><span>' + (label || '差事') + '</span><select class="job-select" data-action="assign-select" data-id="' + d.id + '" aria-label="为' + h(d.name) + '安排差事">' + options + '</select></label>';
  }

  function discipleCard(d) {
    var pr = E.stageProgress(d);
    var need = pr.need;
    var isBottleneck = d.exp >= need && d.realm < 9;
    var job = d.job ? E.buildingById(UI.game, d.job) : null;
    var jobName = d.missionId ? '在外历练' : job ? E.def(job).name : '闲居';
    return '<article class="disciple-card ' + (d.id === UI.game.playerId ? 'is-player' : '') + '">' +
      '<div class="dc-head">' + avatarSvg(d, 58) + '<div class="dc-title"><div><h3>' + h(d.name) + '</h3><span class="dc-role">' + roleBadge(d) + '<span class="realm-text">' + h(stage(d)) + '</span></span></div><small>' + h(d.origin) + ' · ' + d.age + '岁</small></div></div>' +
      '<div class="dc-cult"><div class="dc-cult-head"><span>' + (isBottleneck ? '瓶颈' : '修为') + '</span><b>' + Math.floor(d.exp) + ' / ' + need + '</b></div>' + bar(pr.pct, isBottleneck ? 'bar-gold' : 'bar-jade') + '</div>' +
      '<div class="dc-meta">' + jobSelectHtml(d, 'dc-job') + '<span class="power-chip">战力 ' + fmt(E.power(d, UI.game)) + '</span></div>' +
      '<div class="dc-traits">' + (d.traits || []).slice(0, 3).map(function (t) { return '<span class="mini-chip">' + h(D.TRAITS[t] ? D.TRAITS[t].name : t) + '</span>'; }).join('') + '</div>' +
      '<div class="dc-actions"><button class="btn btn-ghost btn-sm" data-action="open-disciple" data-id="' + d.id + '">详情</button>' +
      (isBottleneck ? '<button class="btn btn-primary btn-sm" data-action="breakthrough" data-id="' + d.id + '">助其突破</button>' : '') +
      (d.role === 'outer' && d.realm === 0 && d.layer >= 2 ? '<button class="btn btn-jade btn-sm" data-action="promote" data-id="' + d.id + '">晋升内门</button>' : '') +
      '</div></article>';
  }

  function openDisciple(id) {
    var d = E.discipleById(UI.game, id);
    if (!d) return;
    UI.selectedDisciple = id;
    var pr = E.stageProgress(d);
    var isBottleneck = d.exp >= pr.need && d.realm < 9;
    var job = d.job ? E.buildingById(UI.game, d.job) : null;
    var pillHtml = Object.keys(D.PILLS).filter(function (p) { return (UI.game.pills[p] || 0) > 0; }).map(function (p) {
      var pill = D.PILLS[p];
      return '<button class="pill-use" data-action="use-pill" data-id="' + d.id + '" data-pill="' + p + '">' + seal(pill.glyph) + '<span><b>' + h(pill.name) + '</b><small>' + h(pill.desc) + '</small></span><em>×' + UI.game.pills[p] + '</em></button>';
    }).join('');
    var promoteReq = d.role === 'outer' && d.realm === 0 && d.layer >= 2 && E.aptitude(d) >= 2;
    var content = '<div class="modal-head detail-head"><div class="detail-hero">' + avatarSvg(d, 92) + '<div><p class="eyebrow">' + (d.id === UI.game.playerId ? 'SECT MASTER' : d.role === 'inner' ? 'INNER DISCIPLE' : 'OUTER DISCIPLE') + '</p><h2>' + h(d.name) + '</h2><div class="detail-sub">' + roleBadge(d) + '<span>' + h(stage(d)) + '</span><span>' + d.age + ' / ' + E.lifespanOf(d) + ' 岁</span><span>' + h(d.origin) + '</span></div></div></div><button class="modal-close" data-action="close-modal" aria-label="关闭">×</button></div>' +
      '<div class="detail-body">' +
      '<div class="detail-bio">' + h(d.bio || '山中岁月长，来日方长。') + '</div>' +
      (UI.settings.autoPause ? '<div class="pause-note">时间已暂停 · 可安心安排差事</div>' : '') +
      '<div class="detail-cols">' +
      '<div class="detail-col"><h4>修行</h4><div class="detail-big">' + h(stage(d)) + '<small>' + Math.floor(d.exp) + ' / ' + pr.need + ' 修为</small></div>' + bar(pr.pct, isBottleneck ? 'bar-gold' : 'bar-jade') +
      '<div class="stat-pills"><span>资质 <b>' + E.aptitude(d) + '</b></span><span>战力 <b>' + fmt(E.power(d, UI.game)) + '</b></span><span>灵根 <b>' + h(rootOf(d).name) + '</b></span><span title="' + h(E.techniqueOf(d).desc) + '">功法 <b>' + h(E.techniqueOf(d).name) + '</b></span></div>' +
      '<p class="tech-note">' + h(E.techniqueOf(d).desc) + '</p>' +
      (isBottleneck ? '<div class="bottleneck-box">' + seal('破') + '<div><b>已至瓶颈</b><p>突破成功率 ' + Math.round(E.breakChance(d, UI.game) * 100) + '%</p></div></div><div class="detail-actions"><button class="btn btn-primary" data-action="breakthrough" data-id="' + d.id + '">尝试突破</button>' + ((UI.game.pills.pojing || 0) > 0 ? '<button class="btn btn-jade" data-action="breakthrough-pill" data-id="' + d.id + '">服破境丹突破</button>' : '') + '</div>' : '') +
      (promoteReq ? '<div class="detail-actions"><button class="btn btn-jade" data-action="promote" data-id="' + d.id + '">晋升内门 · 50 灵石</button></div>' : '') +
      '</div>' +
      '<div class="detail-col"><h4>状态</h4><div class="need-list">' + needBar('气血', d.health, d.health < 50 ? 'bar-red' : 'bar-jade') + needBar('筋骨', 100 - d.injury, d.injury > 30 ? 'bar-red' : 'bar-jade') + '</div>' +
      '<div class="trait-row">' + (d.traits || []).map(function (t) { var tr = D.TRAITS[t]; return tr ? '<span class="trait-chip ' + (tr.rarity === '天' ? 'trait-heaven' : tr.rarity === '地' ? 'trait-earth' : '') + '" title="' + h(tr.desc) + '">' + h(tr.name) + '</span>' : ''; }).join('') + '</div>' +
      '</div></div>' +
      relationSection(d) +
      '<div class="detail-section"><div class="detail-section-head"><h4>差事</h4><span>' + (d.missionId ? '在外历练' : job ? '当前：' + h(E.def(job).name) : '闲居') + '</span></div>' +
      (d.missionId ? '<p class="muted">弟子正在外，归来后才可另行安排。</p>' : '<div class="job-quick-row">' + jobSelectHtml(d, 'detail-job', '安排') +
        '<button class="btn btn-jade btn-sm" data-action="auto-assign" data-id="' + d.id + '">自动安排</button>' +
        (d.job ? '<button class="btn btn-ghost btn-sm" data-action="assign" data-id="' + d.id + '" data-building="">解除差事</button>' : '') + '</div>' +
        '<p class="job-hint">选好差事即刻生效；安排时山门时间会自动暂停。</p>') +
      '</div>' +
      '<div class="detail-section"><h4>丹药</h4>' + (pillHtml || '<p class="muted">丹房里还没有存药。灵草可在药圃种植，丹方在参研中解锁。</p>') + '</div>' +
      '</div>';
    openModal(content, { class: 'detail-modal', dismissible: true, key: 'disciple:' + d.id });
  }

  function relationSection(d) {
    var rows = Object.keys(d.relations || {}).map(function (id) {
      var other = E.discipleById(UI.game, id);
      return other && !other.dead ? { d: other, bond: d.relations[id] } : null;
    }).filter(Boolean).sort(function (a, b) { return b.bond - a.bond; }).slice(0, 4);
    if (!rows.length) return '';
    return '<div class="detail-section"><div class="detail-section-head"><h4>同门</h4><span>日久见人心</span></div><div class="relation-list">' +
      rows.map(function (r) {
        var label = r.bond >= 70 ? '知己' : r.bond >= 55 ? '友善' : r.bond >= 35 ? '平常' : r.bond >= 20 ? '疏远' : '不和';
        var cls = r.bond >= 70 ? 'good' : r.bond >= 55 ? 'warm' : r.bond < 20 ? 'bad' : '';
        return '<div class="relation-row">' + avatarSvg(r.d, 28) + '<span class="relation-name">' + h(r.d.name) + '</span><span class="relation-bar"><i class="' + cls + '" style="width:' + pct(r.bond) + '%"></i></span><em class="' + cls + '">' + label + '</em></div>';
      }).join('') + '</div></div>';
  }

  /* ------------------------------------------------------------------ */
  /* 营造视图                                                           */
  /* ------------------------------------------------------------------ */
  function renderBuild() {
    var cats = D.BUILD_CATEGORIES;
    var list = D.BUILD_ORDER.map(function (id) { return D.BUILDINGS[id]; }).filter(function (def) {
      if (UI.buildCat !== 'all' && def.category !== UI.buildCat) return false;
      return true;
    });
    var st = stats();
    document.getElementById('view').innerHTML = '<div class="view-page">' +
      '<div class="view-head"><div><p class="eyebrow">BUILD &amp; ARRANGE</p><h2>营造山门</h2><p>选好图样，山门会依山势自动择地开工。木石有价，风水无形。</p></div><div class="view-head-actions"><span class="capacity-note">空地 ' + countBuildable() + ' · 风水 ' + st.fengShui + ' ' + st.fsGrade + '</span></div></div>' +
      '<div class="build-layout"><section><div class="cat-tabs">' + cats.map(function (c) {
        return '<button class="filter-chip ' + (UI.buildCat === c.id ? 'active' : '') + '" data-action="build-cat" data-value="' + c.id + '">' + c.name + '</button>';
      }).join('') + '</div><div class="build-grid">' + list.map(buildingCatalogCard).join('') + '</div></section>' +
      '<aside class="build-aside"><div class="panel"><div class="panel-head"><h3>山中营造</h3><span class="panel-mark">' + UI.game.buildings.length + '</span></div>' +
      UI.game.buildings.slice().sort(function (a, b) { return (a.y + a.x) - (b.y + b.x); }).map(function (b) {
        var def = E.def(b);
        return '<button class="built-row" data-action="open-building" data-id="' + b.id + '"><span class="built-glyph">' + def.glyph + '</span><span><b>' + h(def.name) + '</b><small>Lv.' + b.level + (b.construction > 0 ? ' · 营造中' : ' · ' + b.workers.length + ' 人') + '</small></span><em>' + (b.construction > 0 ? '…' : '›') + '</em></button>';
      }).join('') + '</div>' +
      '<div class="panel build-note"><div class="panel-head"><h3>风水小记</h3><span class="panel-mark">诀</span></div><p>' + h(st.grade.desc) + '</p><ul><li>静室靠近聚灵阵，灵气更盛。</li><li>丹房靠近药圃，取药更顺手。</li><li>弟子居靠近灵井，起居更清爽。</li><li>灵田与药圃受季节影响，冬天前要囤粮。</li></ul></div></aside></div></div>';
  }

  function buildingCatalogCard(def) {
    var built = UI.game.buildings.some(function (b) { return b.type === def.id; });
    var locked = def.unlock && !E.hasResearch(UI.game, def.unlock);
    var can = E.canAfford(UI.game, def.cost);
    var uniqueBlocked = def.unique && built;
    var cost = Object.keys(def.cost).length ? Object.keys(def.cost).map(function (k) {
      return '<span class="cost-chip ' + ((UI.game.resources[k] || 0) < def.cost[k] ? 'lack' : '') + '">' + (D.RESOURCES[k] ? D.RESOURCES[k].glyph : k) + ' ' + def.cost[k] + '</span>';
    }).join('') : '<span class="cost-chip">初始建筑</span>';
    return '<article class="build-card ' + (locked ? 'locked' : '') + ' ' + (uniqueBlocked ? 'built' : '') + '">' +
      '<div class="build-card-head"><span class="build-glyph">' + h(def.glyph) + '</span><div><h3>' + h(def.name) + '</h3><small>' + (D.BUILD_CATEGORIES.find(function (c) { return c.id === def.category; }) || {}).name + '</small></div>' + (built && def.unique ? '<span class="badge">已建</span>' : '') + '</div>' +
      '<p class="build-desc">' + h(def.desc) + '</p>' +
      '<div class="build-effect">' + h(def.effect) + '</div>' +
      '<div class="cost-row">' + cost + '</div>' +
      '<button class="btn ' + (locked || uniqueBlocked || !can ? 'btn-ghost' : 'btn-primary') + ' btn-sm btn-block" data-action="select-build" data-type="' + def.id + '" ' + (locked || uniqueBlocked || !can ? 'disabled' : '') + '>' + (locked ? '需参研' : uniqueBlocked ? '已建成' : !can ? '材料不足' : '择地营造') + '</button>' +
      '</article>';
  }

  /* ------------------------------------------------------------------ */
  /* 事务视图                                                           */
  /* ------------------------------------------------------------------ */
  function renderAffairs() {
    var tabs = [['mission', '历练'], ['alchemy', '丹房'], ['study', '参研']];
    var body = UI.affairsTab === 'mission' ? missionView() : UI.affairsTab === 'alchemy' ? alchemyView() : studyView();
    document.getElementById('view').innerHTML = '<div class="view-page">' +
      '<div class="view-head"><div><p class="eyebrow">AFFAIRS OF THE SECT</p><h2>山门事务</h2><p>派人下山，开炉炼丹，或者去藏经阁里坐一坐。</p></div><div class="view-head-actions"><span class="capacity-note">悟道 ' + fmt(UI.game.insight) + '</span></div></div>' +
      '<div class="sub-tabs">' + tabs.map(function (t) { return '<button class="filter-chip ' + (UI.affairsTab === t[0] ? 'active' : '') + '" data-action="affairs-tab" data-value="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      body + '</div>';
  }

  function missionView() {
    var day = UI.game.day;
    var orders = UI.game.missionOrders || [];
    var activeOrderIds = {};
    var active = UI.game.missions.map(function (m) {
      var region = D.MISSIONS.find(function (x) { return x.id === m.missionId; });
      var names = m.discipleIds.map(function (id) { var d = E.discipleById(UI.game, id); return d ? d.name : '？'; }).join('、');
      if (m.orderId) activeOrderIds[m.orderId] = true;
      return '<div class="active-mission panel' + (m.orderId ? ' is-order' : '') + '"><div class="panel-head"><h3>' + h(region ? region.name : '在外') + '</h3><div class="mission-head-badges">' + (m.orderId ? '<span class="badge badge-inner">常驻</span>' : '') + '<span class="badge badge-warn">' + m.daysLeft + ' 日</span></div></div><p>' + h(names) + ' 正在外历练。</p><div class="bar bar-gold"><i style="width:' + pct((m.days - m.daysLeft) / m.days * 100) + '%"></i></div><div class="mission-active-foot"><small class="muted">队伍战力 ' + fmt(m.teamPower) + '</small>' + (m.orderId ? '<button class="btn btn-ghost btn-sm" data-action="mission-stop" data-id="' + m.orderId + '">停止常驻</button>' : '') + '</div></div>';
    }).join('');
    var waiting = orders.filter(function (o) { return !activeOrderIds[o.id]; }).map(function (o) {
      var region = D.MISSIONS.find(function (x) { return x.id === o.missionId; });
      var names = o.discipleIds.map(function (id) { var d = E.discipleById(UI.game, id); return d ? d.name : '？'; }).join('、');
      var wait = Math.max(0, (o.nextTryDay || day) - day);
      return '<div class="mission-order panel"><div class="panel-head"><h3>' + h(region ? region.name : '在外') + ' · 常驻</h3><span class="badge badge-inner">休整中</span></div><p>' + h(names) + (wait > 0 ? ' 将在 ' + wait + ' 日后再次启程。' : ' 今日将再次启程。') + '</p><small class="muted">' + (o.lastError ? h(o.lastError) : '归来休整，补足干粮后自动再出发。') + '</small><div class="mission-order-actions"><button class="btn btn-ghost btn-sm" data-action="mission-stop" data-id="' + o.id + '">停止常驻</button></div></div>';
    }).join('');
    var cards = D.MISSIONS.map(function (m) {
      var reached = E.missionReachable(UI.game, m);
      var order = orders.find(function (o) { return o.missionId === m.id; });
      var req = m.danger === 0 ? '外门可去' : '需内门 · ' + D.REALMS[m.minRealm].short;
      var reward = [];
      if (m.rewards.food) reward.push('食物');
      if (m.rewards.herbs) reward.push('灵草');
      if (m.rewards.stones) reward.push('灵石');
      if (m.rewards.pills) reward.push('丹药');
      return '<article class="mission-card panel ' + (!reached ? 'locked' : '') + (order ? ' repeating' : '') + '">' +
        '<div class="mission-card-head"><span class="mission-glyph" style="--mc:' + m.color + '">' + m.glyph + '</span><div><h3>' + h(m.name) + '</h3><small>危险 ' + '◆'.repeat(m.danger || 0) + (m.danger ? '' : '◇') + ' · ' + m.days + ' 日</small></div></div>' +
        '<p>' + h(m.desc) + '</p><div class="mission-req"><span>' + req + '</span><span>建议战力 ' + fmt(m.minPower || 0) + '</span></div>' +
        '<div class="mission-reward">' + reward.map(function (r) { return '<span class="mini-chip">' + r + '</span>'; }).join('') + (order ? '<span class="mini-chip mini-chip-jade">常驻</span>' : '') + '</div>' +
        '<button class="btn btn-ghost btn-sm btn-block" data-action="mission-open" data-id="' + m.id + '" ' + (!reached || order ? 'disabled' : '') + '>' + (order ? '常驻中' : reached ? '安排历练' : '声望不足') + '</button>' +
        '</article>';
    }).join('');
    return '<div class="mission-layout">' + (active ? '<div class="active-missions">' + active + '</div>' : '') + (waiting ? '<div class="mission-orders">' + waiting + '</div>' : '') + '<div class="mission-grid">' + cards + '</div></div>';
  }

  function alchemyView() {
    var buildings = UI.game.buildings.filter(function (b) { return b.type === 'alchemy'; });
    if (!buildings.length) return '<div class="empty-state">' + seal('丹') + '<h3>还没有丹房</h3><p>去营造一座丹房，把药圃里的灵草炼成丹药。</p><button class="btn btn-primary" data-action="nav" data-tab="build">去营造</button></div>';
    var html = buildings.map(function (b) {
      var worker = b.workers.length ? E.discipleById(UI.game, b.workers[0]) : null;
      var recipes = D.RECIPES.filter(function (r) { return E.recipeUnlocked(UI.game, r); });
      var current = D.RECIPES.find(function (r) { return r.id === b.recipe; });
      var batch = b.batch;
      return '<div class="alchemy-card panel"><div class="panel-head"><h3>' + h(E.def(b).name) + ' · Lv.' + b.level + '</h3><span class="panel-mark">' + (b.construction ? '建' : worker ? '炼' : '空') + '</span></div>' +
        '<p class="muted">' + (b.construction ? '营造中，还需 ' + Math.ceil(b.construction) + ' 日。' : worker ? worker.name + ' 在炉前当值。' : '无人看火，丹炉是冷的。') + '</p>' +
        (batch ? '<div class="batch"><div class="batch-head"><b>' + h((D.RECIPES.find(function (r) { return r.id === batch.recipe; }) || {}).name || '丹药') + '</b><span>' + Math.floor(batch.progress) + ' / ' + batch.days + ' 日</span></div>' + bar(batch.progress / batch.days * 100, 'bar-gold') + '</div>' : '') +
        '<div class="recipe-list">' + recipes.map(function (r) {
          var pill = D.PILLS[r.out];
          var has = Object.keys(r.mats).every(function (k) { return (UI.game.resources[k] || 0) >= r.mats[k]; });
          return '<button class="recipe-option ' + (b.recipe === r.id ? 'active' : '') + '" data-action="recipe" data-building="' + b.id + '" data-recipe="' + r.id + '"><span class="recipe-glyph">' + pill.glyph + '</span><span><b>' + h(r.name) + '</b><small>' + Object.keys(r.mats).map(function (k) { return (D.RESOURCES[k] ? D.RESOURCES[k].name : k) + ' ' + r.mats[k]; }).join(' · ') + (has ? '' : ' · 材料不足') + '</small></span></button>';
        }).join('') + '</div>' +
        (!worker ? '<button class="btn btn-ghost btn-sm" data-action="open-building" data-id="' + b.id + '">安排丹师</button>' : '') +
        '</div>';
    }).join('');
    var inventory = Object.keys(D.PILLS).filter(function (p) { return (UI.game.pills[p] || 0) > 0; }).map(function (p) {
      return '<div class="pill-inventory"><span class="pill-glyph">' + D.PILLS[p].glyph + '</span><div><b>' + h(D.PILLS[p].name) + '</b><small>' + h(D.PILLS[p].desc) + '</small></div><em>×' + UI.game.pills[p] + '</em></div>';
    }).join('');
    return '<div class="alchemy-layout">' + html + '<div class="panel"><div class="panel-head"><h3>药匣</h3><span class="panel-mark">丹</span></div>' + (inventory || '<p class="muted">尚无存药。</p>') + '<p class="muted small">丹药可在弟子详情中服用。</p></div></div>';
  }

  function studyView() {
    var nodes = D.RESEARCH.map(function (n) {
      var done = E.hasResearch(UI.game, n.id);
      var canReq = (n.requires || []).every(function (r) { return E.hasResearch(UI.game, r); });
      var can = !done && canReq && (UI.game.insight || 0) >= n.cost;
      return '<article class="research-card panel ' + (done ? 'done' : '') + '">' +
        '<div class="research-head"><span class="research-glyph">' + n.glyph + '</span><div><h3>' + h(n.name) + '</h3><small>' + (done ? '已参研' : '需悟道 ' + n.cost) + '</small></div></div>' +
        '<p>' + h(n.desc) + '</p><div class="research-effect">' + h(n.effect) + '</div>' +
        (n.requires.length ? '<div class="research-req">前置：' + n.requires.map(function (r) { var x = D.RESEARCH.find(function (q) { return q.id === r; }); return x ? x.name : r; }).join('、') + '</div>' : '') +
        '<button class="btn ' + (done ? 'btn-ghost' : can ? 'btn-primary' : 'btn-ghost') + ' btn-sm btn-block" data-action="research" data-id="' + n.id + '" ' + (!can ? 'disabled' : '') + '>' + (done ? '已参研' : canReq ? '参研' : '前置未成') + '</button>' +
        '</article>';
    }).join('');
    return '<div class="study-top"><div class="panel insight-panel"><div><p class="eyebrow">INSIGHT</p><h3>' + fmt(UI.game.insight) + '</h3><span>悟道点 · 藏经阁每日产出</span></div>' + seal('道') + '</div><div class="panel small-panel"><b>参研之道</b><p>藏经阁有人当值时，会持续产出悟道。参研可解锁新的建筑、丹方与宗门加成。</p></div></div><div class="research-grid">' + nodes + '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* 坊市视图                                                           */
  /* ------------------------------------------------------------------ */
  function renderMarket() {
    var stock = UI.game.market.stock || [];
    var restock = Math.max(0, UI.game.market.restockDay - UI.game.day);
    var sellItems = ['food', 'wood', 'stone', 'herbs'].map(function (id) {
      var r = D.RESOURCES[id];
      return { id: id, kind: 'resource', name: r.name, glyph: r.glyph, color: r.color, stock: UI.game.resources[id] || 0, price: E.sellPriceOf(id) };
    }).concat(Object.keys(D.PILLS).filter(function (id) { return (UI.game.pills[id] || 0) > 0; }).map(function (id) {
      var p = D.PILLS[id];
      return { id: id, kind: 'pill', name: p.name, glyph: p.glyph, color: p.color || '#b08a4a', stock: UI.game.pills[id] || 0, price: E.sellPriceOf(id) };
    }));
    document.getElementById('view').innerHTML = '<div class="view-page">' +
      '<div class="view-head"><div><p class="eyebrow">MOUNTAIN MARKET</p><h2>山下坊市</h2><p>胡商的车马每月来两次。灵石带够，话别说太满。</p></div><div class="view-head-actions"><span class="capacity-note">' + restock + ' 日后换货</span><span class="capacity-note">灵石 ' + fmt(UI.game.resources.stones) + '</span></div></div>' +
      '<div class="market-layout"><section class="panel"><div class="panel-head"><h3>今日货单</h3><span class="panel-mark">买</span></div><div class="market-grid">' +
      (stock.length ? stock.map(function (it, i) {
        var meta = it.kind === 'pill' ? D.PILLS[it.id] : D.RESOURCES[it.id];
        var name = meta ? meta.name : it.id;
        var glyph = meta ? meta.glyph : '货';
        var color = meta && meta.color ? meta.color : '#8f6a43';
        var custom = it.gift ? '' : '<span class="qty-control"><input class="qty-input" type="number" inputmode="numeric" min="1" max="' + it.qty + '" value="1" data-buy-index="' + i + '" aria-label="购买' + h(name) + '数量"><button class="btn btn-ghost btn-xs" data-action="buy-custom" data-index="' + i + '">购</button></span>';
        return '<article class="market-item"><span class="market-glyph" style="--mc:' + color + '">' + glyph + '</span><div class="market-item-main"><b>' + h(name) + '</b><small>' + (it.gift ? '行商相赠' : it.kind === 'pill' ? '丹药' : '材料') + ' · 余 ' + it.qty + '</small></div><div class="market-price">' + (it.gift ? '赠' : it.price + ' 石') + '</div>' +
          '<div class="market-actions"><button class="btn btn-ghost btn-xs" data-action="buy" data-index="' + i + '" data-qty="1">购 1</button>' + (it.qty >= 5 ? '<button class="btn btn-ghost btn-xs" data-action="buy" data-index="' + i + '" data-qty="5">购 5</button>' : '') + custom + '</div></article>';
      }).join('') : '<p class="muted">货架空了，等下一班商队。</p>') +
      '</div></section>' +
      '<aside class="panel"><div class="panel-head"><h3>卖出</h3><span class="panel-mark">卖</span></div>' +
      sellItems.map(function (it) {
        return '<div class="sell-row"><span class="sell-glyph" style="--rc:' + it.color + '">' + it.glyph + '</span><div><b>' + h(it.name) + '</b><small>存 ' + fmt(it.stock) + ' · ' + it.price + ' 石/份' + (it.kind === 'pill' ? ' · 丹药' : '') + '</small></div>' +
          '<div class="sell-actions"><span class="qty-control"><input class="qty-input" type="number" inputmode="numeric" min="1" max="' + Math.max(1, it.stock) + '" value="1" data-sell-id="' + it.id + '" aria-label="卖出' + h(it.name) + '数量"><button class="btn btn-ghost btn-xs" data-action="sell-custom" data-id="' + it.id + '" ' + (it.stock < 1 ? 'disabled' : '') + '>卖</button></span>' +
          '<button class="btn btn-ghost btn-xs" data-action="sell" data-id="' + it.id + '" data-qty="5" ' + (it.stock < 5 ? 'disabled' : '') + '>卖 5</button></div></div>';
      }).join('') +
      '<div class="market-note">' + seal('商') + '<p>材料与丹药都可出手。声望越高，行商给的面子越大；参研天机推演还能再压一压价。</p></div></aside></div></div>';
  }

  /* ------------------------------------------------------------------ */
  /* 弹窗基础                                                           */
  /* ------------------------------------------------------------------ */
  function openModal(content, opts) {
    opts = opts || {};
    if (UI.settings.autoPause && UI.game && !UI.paused) {
      UI.paused = true;
      UI.autoPaused = true;
      renderHeader();
    }
    var root = document.getElementById('modal-root');
    root.innerHTML = '<div class="modal-backdrop" data-action="' + (opts.dismissible === false ? 'noop' : 'backdrop-close') + '"><div class="modal ' + (opts.class || '') + '" role="dialog" aria-modal="true">' + content + '</div></div>';
    document.body.classList.add('modal-open');
    UI.modalOpen = true;
    if (!opts.keepKey) UI.modalKey = opts.key || '';
    setTimeout(function () {
      var btn = root.querySelector('.modal-close');
      if (btn) btn.focus();
    }, 30);
  }

  function closeModal() {
    document.getElementById('modal-root').innerHTML = '';
    document.body.classList.remove('modal-open');
    UI.modalOpen = false;
    UI.modalKey = '';
    if (UI.autoPaused) {
      UI.autoPaused = false;
      UI.paused = false;
    }
    if (UI.game) { renderHeader(); renderNav(); if (UI.tab !== 'sect' || !UI.game.pendingEvent) renderView(); }
  }

  function openSuccessionModal() {
    var candidates = E.successors(UI.game);
    var content = '<div class="succession-modal"><div class="modal-head"><div><p class="eyebrow">THE SEAT IS EMPTY</p><h2>山门无主</h2><p class="detail-sub">掌门已坐化。请从弟子中另立掌门，山门才能继续运转。</p></div></div><div class="detail-body">' +
      '<p class="detail-bio">掌门之位空悬，弟子们都在等一个名字。选定之后，新掌门将接掌山门，与同门一同修行做事。</p>' +
      (candidates.length ? '<div class="successor-list">' + candidates.map(function (d) {
        return '<article class="successor-card"><div class="successor-head">' + avatarSvg(d, 54) + '<div><h3>' + h(d.name) + '</h3><small>' + roleBadge(d) + ' ' + h(stage(d)) + ' · ' + h(rootOf(d).name) + '</small></div></div>' +
          '<div class="successor-facts"><span>资质 <b>' + E.aptitude(d) + '</b></span><span>战力 <b>' + fmt(E.power(d, UI.game)) + '</b></span></div>' +
          '<p class="successor-bio">' + h(d.bio || '山中岁月长，来日方长。') + '</p>' +
          '<button class="btn btn-primary btn-sm" data-action="choose-master" data-id="' + d.id + '">立为掌门</button></article>';
      }).join('') + '</div>' : '<div class="empty-state small"><h3>无人可继</h3><p>山门已经走到尽头。</p></div>') +
      '</div></div>';
    openModal(content, { class: 'succession-modal-wrap', dismissible: false, key: 'succession' });
  }

  function syncAutoModals() {
    if (!UI.game) return;
    if (UI.game.ending) {
      if (UI.modalKey !== 'ending') renderEnding();
      return;
    }
    if (UI.game.pendingSuccession) {
      if (UI.modalKey !== 'succession') openSuccessionModal();
      return;
    }
    if (UI.game.pendingEvent) {
      var key = 'event:' + UI.game.pendingEvent;
      if (UI.modalKey !== key) openEventModal(UI.game.pendingEvent);
      return;
    }
    if (UI.game.pendingResult) {
      var rkey = 'result:' + (UI.game.pendingResult.title || '') + ':' + UI.game.day;
      if (UI.modalKey !== rkey) openResultModal(UI.game.pendingResult);
      return;
    }
    if (UI.game.pendingReport) {
      var repKey = 'report:' + (UI.game.pendingReport.title || '') + ':' + UI.game.day + ':' + (UI.game.pendingReport.lines || []).length;
      if (UI.modalKey !== repKey) openReportModal(UI.game.pendingReport);
      return;
    }
  }

  function openEventModal(id) {
    var ev = E.getEvent(id);
    if (!ev) { UI.game.pendingEvent = null; return; }
    var choices = E.eventChoices(UI.game, id);
    var content = '<div class="event-modal">' + eventArt(ev.art) +
      '<div class="event-content"><p class="eyebrow">AN EVENT AT THE GATE</p><h2>' + h(ev.title) + '</h2><p class="event-text">' + h(ev.text) + '</p>' +
      '<div class="choice-list">' + choices.map(function (c) {
        return '<button class="choice-btn" data-action="event-choice" data-index="' + c.index + '" ' + (!c.available ? 'disabled' : '') + '><span class="choice-mark">' + (c.index + 1) + '</span><span><b>' + h(c.label) + '</b><small>' + h(c.available ? c.hint : c.reason) + '</small></span><em>›</em></button>';
      }).join('') + '</div></div></div>';
    openModal(content, { class: 'event-modal-wrap', dismissible: false, key: 'event:' + id });
  }

  function openResultModal(res) {
    var content = '<div class="result-modal"><div class="result-head"><p class="eyebrow">THE MATTER IS SETTLED</p><h2>' + h(res.title) + '</h2></div><div class="result-body"><p>' + h(res.text) + '</p>' +
      (res.details && res.details.length ? '<div class="result-details">' + res.details.map(function (d) { return '<span class="reward-chip">' + h(d) + '</span>'; }).join('') + '</div>' : '') +
      (res.battle ? '<div class="battle-log">' + res.battle.lines.map(function (l) { return '<p>' + h(l) + '</p>'; }).join('') + (res.battle.rewards ? '<div class="result-details">' + rewardChips(res.battle.rewards) + '</div>' : '') + '</div>' : '') +
      '</div><div class="modal-actions"><button class="btn btn-primary" data-action="close-result">知道了</button></div></div>';
    openModal(content, { class: 'result-modal-wrap', dismissible: false, key: 'result:' + (res.title || '') + ':' + UI.game.day });
  }

  function rewardChips(rewards) {
    if (!rewards) return '';
    var out = [];
    Object.keys(rewards).forEach(function (k) {
      if (k === 'pills' && rewards[k] && rewards[k].length) out.push((D.PILLS[rewards[k][0]] || {}).name + ' +1');
      else if (typeof rewards[k] === 'number' && rewards[k] !== 0) out.push((D.RESOURCES[k] ? D.RESOURCES[k].name : k) + ' ' + signed(rewards[k]));
    });
    return out.map(function (x) { return '<span class="reward-chip">' + h(x) + '</span>'; }).join('');
  }

  function openReportModal(rep) {
    var content = '<div class="report-modal"><div class="result-head"><p class="eyebrow">' + (rep.type === 'battle' ? 'A BATTLE AT THE GATE' : 'RETURN FROM THE WILD') + '</p><h2>' + h(rep.title) + '</h2></div><div class="result-body">' +
      (rep.team && rep.team.length ? '<p class="muted">同行：' + h(rep.team.join('、')) + '</p>' : '') +
      (rep.lines || []).map(function (l) { return '<p class="report-line">' + h(l) + '</p>'; }).join('') +
      (rep.rewards ? '<div class="result-details">' + rewardChips(rep.rewards) + '</div>' : '') +
      '</div><div class="modal-actions"><button class="btn btn-primary" data-action="close-report">收下</button></div></div>';
    openModal(content, { class: 'report-modal-wrap', dismissible: false, key: 'report:' + (rep.title || '') + ':' + UI.game.day + ':' + (rep.lines || []).length });
  }

  function openIntro() {
    var content = '<div class="intro-modal"><div class="intro-art"><img src="assets/qingya-panorama.jpg" alt="云海中的青崖山门"></div><div class="intro-body"><p class="eyebrow">THE FIRST DAY</p><h2>青崖山，山门初立</h2><p>' + h(D.STORY.start) + '</p><div class="intro-list"><div><b>先看差事</b><span>三名外门弟子已在灵田、药圃、膳堂当值。掌门在静室修炼。</span></div><div><b>再修房子</b><span>弟子居床位有限，灵田与药圃受季节影响。缺什么就去营造。</span></div><div><b>别忘了山下</b><span>历练能带回灵石与声望。声望越高，宗门品阶越高。</span></div></div><div class="modal-actions"><button class="btn btn-primary" data-action="close-modal">开始经营</button><button class="btn btn-ghost" data-action="help">详细玩法</button></div></div></div>';
    openModal(content, { class: 'intro-modal-wrap', dismissible: true, key: 'intro' });
  }

  function openSettings() {
    var content = '<div class="settings-modal"><div class="modal-head"><div><p class="eyebrow">SETTINGS</p><h2>山中杂记</h2></div><button class="modal-close" data-action="close-modal" aria-label="关闭">×</button></div><div class="settings-body">' +
      '<div class="settings-row"><div><b>纸色 / 夜色</b><small>白日是宣纸，夜里是松烟。</small></div><div class="theme-toggle"><button class="filter-chip ' + (UI.settings.theme === 'paper' ? 'active' : '') + '" data-action="theme" data-value="paper">宣纸</button><button class="filter-chip ' + (UI.settings.theme === 'night' ? 'active' : '') + '" data-action="theme" data-value="night">夜色</button></div></div>' +
      '<div class="settings-row"><div><b>时间速度</b><small>事件发生时会自动暂停。</small></div><div class="theme-toggle"><button class="filter-chip ' + (UI.speed === 1 ? 'active' : '') + '" data-action="speed" data-value="1">1×</button><button class="filter-chip ' + (UI.speed === 2 ? 'active' : '') + '" data-action="speed" data-value="2">2×</button><button class="filter-chip ' + (UI.speed === 4 ? 'active' : '') + '" data-action="speed" data-value="4">4×</button></div></div>' +
      '<div class="settings-row"><div><b>存档</b><small>保存在本机浏览器中。换设备请导出。</small></div><div class="settings-actions"><button class="btn btn-ghost btn-sm" data-action="save-now">立即存档</button><button class="btn btn-ghost btn-sm" data-action="export-save">导出</button><button class="btn btn-ghost btn-sm" data-action="import-save">导入</button></div></div>' +
      '<div class="settings-row"><div><b>山门</b><small>重开一局会覆盖当前存档。</small></div><div class="settings-actions"><button class="btn btn-ghost btn-sm" data-action="help">玩法说明</button><button class="btn btn-ghost btn-sm" data-action="new-game">重开山门</button></div></div>' +
      '<div class="settings-note"><b>关于</b><p>《一念长生 · 宗门篇》是一款原创网页修仙经营游戏。玩法气质参考《了不起的修仙模拟器》等宗门模拟作品；代码、文案与全部图形均为原创，未使用任何游戏素材。</p><p>存档只保存在你的浏览器里。清除网站数据会失去存档。</p></div>' +
      '</div></div>';
    openModal(content, { class: 'settings-modal-wrap', dismissible: true, key: 'settings' });
  }

  function openHelp() {
    var content = '<div class="help-modal"><div class="modal-head"><div><p class="eyebrow">HOW TO PLAY</p><h2>宗门入门</h2></div><button class="modal-close" data-action="close-modal" aria-label="关闭">×</button></div><div class="help-body">' +
      '<div class="help-block"><h3>一、外门与内门</h3><p>外门弟子负责灵田、药圃、膳堂等劳作；内门弟子专注修炼，也可守丹房、藏经阁与演武场。外门弟子修到炼气三层，可花 50 灵石晋升内门。</p></div>' +
      '<div class="help-block"><h3>二、四时与吃穿</h3><p>灵田和药圃受季节影响，冬天近乎绝收。弟子每天消耗粮食；膳堂有人当值可减少消耗。床位不足、饥饿和受伤都会拖慢修行。</p></div>' +
      '<div class="help-block"><h3>三、风水与修炼</h3><p>静室、聚灵阵和灵脉提升灵气；建筑相邻会产生风水加成。灵气与风水越高，弟子修炼越快，突破也越稳。内门弟子会优先进入有空位的静室。</p></div>' +
      '<div class="help-block"><h3>四、事务</h3><p>藏经阁产出悟道，用于参研。丹房把灵草炼成丹药。历练可派弟子下山，带回灵石、灵草、丹药与声望；受伤的弟子需要药庐休养。</p></div>' +
      '<div class="help-block"><h3>五、掌门与传承</h3><p>掌门是固定身份，与普通弟子一样可以领差事、随队历练。掌门若遭遇不测，山门会暂停，需要你从弟子中另立掌门后才能继续。选掌门时优先看资质与境界。</p></div>' +
      '<div class="help-block"><h3>六、目标</h3><p>提升声望，让宗门从荒山小门一路晋为仙道圣地；同时培养弟子渡劫飞升。</p></div>' +
      '<div class="settings-note"><b>提示</b><p>' + D.TIPS.map(function (t) { return '· ' + h(t); }).join('<br>') + '</p></div>' +
      '</div></div>';
    openModal(content, { class: 'help-modal-wrap', dismissible: true, key: 'help' });
  }

  function openAlerts() {
    var alerts = E.alerts(UI.game);
    var content = '<div class="alerts-modal"><div class="modal-head"><div><p class="eyebrow">WARNINGS</p><h2>山门警讯</h2></div><button class="modal-close" data-action="close-modal" aria-label="关闭">×</button></div><div class="alert-list">' +
      (alerts.length ? alerts.map(function (a) {
        return '<div class="alert-row alert-' + a.type + '"><span class="alert-mark">' + (a.type === 'food' ? '粮' : a.type === 'event' ? '事' : a.type === 'bottleneck' ? '破' : '警') + '</span><p>' + h(a.text) + '</p>' + (a.discipleId ? '<button class="btn btn-ghost btn-xs" data-action="open-disciple" data-id="' + a.discipleId + '">查看</button>' : '') + '</div>';
      }).join('') : '<div class="empty-state small"><h3>山门无事</h3><p>弟子各安其位，炉火正旺。</p></div>') +
      '</div></div>';
    openModal(content, { class: 'alerts-modal-wrap', dismissible: true, key: 'alerts' });
  }

  function openBuilding(id) {
    var b = E.buildingById(UI.game, id);
    if (!b) return;
    UI.selectedBuilding = id;
    var def = E.def(b);
    var workers = b.workers.map(function (id) { return E.discipleById(UI.game, id); }).filter(Boolean);
    var eligible = E.aliveDisciples(UI.game).filter(function (d) {
      if (d.missionId) return false;
      var allowed = { meditation: ['inner'], library: ['inner', 'outer'], alchemy: ['inner', 'outer'], arena: ['inner'], farm: ['outer'], herb: ['outer'], kitchen: ['outer'], infirmary: ['outer', 'inner'] }[b.type];
      return (!allowed || allowed.indexOf(d.role) >= 0);
    });
    var cost = {};
    var base = def.upgradeCost || def.cost || {};
    Object.keys(base).forEach(function (k) { cost[k] = Math.round(base[k] * (1 + ((b.level || 1) - 1) * 0.8)); });
    var content = '<div class="modal-head building-modal-head"><div><p class="eyebrow">BUILDING</p><h2>' + h(def.name) + ' · Lv.' + b.level + '</h2><p class="detail-sub">' + h(def.effect) + '</p></div><button class="modal-close" data-action="close-modal" aria-label="关闭">×</button></div>' +
      '<div class="building-portrait" aria-hidden="true">' + buildingPortrait(b.type, b.level) + '</div>' +
      '<div class="detail-body"><p class="detail-bio">' + h(def.desc) + '</p>' +
      (UI.settings.autoPause ? '<div class="pause-note">时间已暂停 · 可安心安排人手</div>' : '') +
      '<div class="building-facts"><span>灵气 <b>+' + ((def.aura || 0) * b.level) + '</b></span><span>风水 <b>+' + ((def.fengShui || 0) * b.level) + '</b></span><span>当值 <b>' + workers.length + ' / ' + E.slotsOf(b) + '</b></span>' + (def.capacity ? '<span>可住 <b>' + E.capacityOf(b) + '</b></span>' : '') + '</div>' +
      '<div class="detail-section"><div class="detail-section-head"><h4>当值弟子</h4><span>' + (b.construction > 0 ? '营造中 · 还需 ' + Math.ceil(b.construction) + ' 日' : '') + '</span></div>' +
      (b.construction > 0 ? '<p class="muted">建筑尚未落成。</p>' : (workers.length ? '<div class="worker-list">' + workers.map(function (d) { return '<button class="worker-chip" data-action="open-disciple" data-id="' + d.id + '">' + avatarSvg(d, 30) + '<span>' + h(d.name) + '</span><em>查看</em></button>'; }).join('') + '</div>' : '<p class="muted">此处还没有人当值。</p>')) +
      (b.construction <= 0 && E.slotsOf(b) > 0 && workers.length < E.slotsOf(b) ? '<button class="btn btn-jade btn-sm" data-action="auto-staff" data-id="' + b.id + '">一键补位 · 自动挑选空闲弟子</button><div class="assign-list"><h4>也可手动安排</h4>' + eligible.filter(function (d) { return b.workers.indexOf(d.id) < 0; }).map(function (d) { return '<button class="assign-chip" data-action="assign" data-id="' + d.id + '" data-building="' + b.id + '">' + avatarSvg(d, 28) + '<span>' + h(d.name) + '</span><small>' + h(stage(d)) + '</small></button>'; }).join('') + '</div>' : '') +
      '</div>' +
      (b.type === 'alchemy' ? '<div class="detail-section"><div class="detail-section-head"><h4>当前丹方</h4></div><div class="recipe-options inline">' + D.RECIPES.filter(function (r) { return E.recipeUnlocked(UI.game, r); }).map(function (r) { return '<button class="recipe-option ' + (b.recipe === r.id ? 'active' : '') + '" data-action="recipe" data-building="' + b.id + '" data-recipe="' + r.id + '">' + D.PILLS[r.out].glyph + ' ' + h(r.name) + '</button>'; }).join('') + '</div></div>' : '') +
      '<div class="building-actions">' +
      (b.level < def.maxLevel ? '<button class="btn btn-primary" data-action="upgrade" data-id="' + b.id + '" ' + (b.construction > 0 ? 'disabled' : '') + '>' + (b.construction > 0 ? '落成后可扩建' : '扩建至 Lv.' + (b.level + 1) + ' <small>' + Object.keys(cost).map(function (k) { return (D.RESOURCES[k] ? D.RESOURCES[k].glyph : k) + ' ' + cost[k]; }).join(' · ') + '</small>') + '</button>' : '<span class="badge">已至最高等级</span>') +
      (b.type !== 'gate' ? '<button class="btn btn-ghost" data-action="demolish" data-id="' + b.id + '">拆除</button>' : '') +
      '</div></div></div>';
    openModal(content, { class: 'building-modal-wrap', dismissible: true, key: 'building:' + id });
  }

  function portraitExtras(type) {
    if (type === 'alchemy') {
      return '<g class="portrait-extra"><circle cx="45" cy="4" r="16" fill="#d89a4c" opacity=".18"/><circle cx="45" cy="4" r="7" fill="#d89a4c" opacity=".22"/><path d="M38,-10 q8 -12 2 -22 q-5 -9 3 -16" stroke="#cbb9a0" stroke-width="2" fill="none" opacity=".5"/><path d="M54,-6 q-6 -10 1 -18" stroke="#cbb9a0" stroke-width="1.4" fill="none" opacity=".4"/><circle cx="39" cy="-16" r="1.2" fill="#e4b168" opacity=".8"/><circle cx="49" cy="-28" r="1" fill="#e4b168" opacity=".7"/></g>';
    }
    if (type === 'array') {
      return '<g class="portrait-extra"><ellipse cx="0" cy="18" rx="86" ry="24" fill="none" stroke="#8bc0ae" stroke-width="1" stroke-dasharray="5 6" opacity=".6"/><ellipse cx="0" cy="18" rx="62" ry="17" fill="none" stroke="#b8d5c7" stroke-width=".8" opacity=".55"/><path d="M-78,18 L-70,12 M78,18 L70,12 M0,-7 L0,3" stroke="#e7d7a2" stroke-width="1.2" opacity=".8"/><circle cx="-78" cy="18" r="2" fill="#e7d7a2"/><circle cx="78" cy="18" r="2" fill="#e7d7a2"/><circle cx="0" cy="-7" r="2" fill="#e7d7a2"/></g>';
    }
    if (type === 'library') {
      return '<g class="portrait-extra"><g transform="translate(86,-30) rotate(-8)"><rect x="-14" y="-8" width="28" height="16" rx="1" fill="#efe2c5" opacity=".9"/><path d="M-14,-8 L0,-13 L14,-8 M-14,8 L0,3 L14,8" fill="none" stroke="#b08a4a" stroke-width=".8" opacity=".8"/></g><g transform="translate(104,-58) rotate(9)"><rect x="-10" y="-6" width="20" height="12" rx="1" fill="#efe2c5" opacity=".75"/></g><circle cx="98" cy="-44" r="1.4" fill="#d8b96b" opacity=".8"/></g>';
    }
    if (type === 'shrine') {
      return '<g class="portrait-extra"><path d="M-38,-2 q-6 -16 2 -30 q5 -9 0 -18" stroke="#d8c9ae" stroke-width="2" fill="none" opacity=".45"/><path d="M38,-2 q6 -14 -1 -27 q-5 -9 1 -16" stroke="#d8c9ae" stroke-width="1.6" fill="none" opacity=".4"/><path d="M-48,0 L-48,-26 M48,0 L48,-26" stroke="#8f4a3b" stroke-width="1.2" opacity=".8"/><circle cx="-48" cy="-27" r="3" fill="#d8b96b" opacity=".8"/><circle cx="48" cy="-27" r="3" fill="#d8b96b" opacity=".8"/></g>';
    }
    if (type === 'farm' || type === 'herb') {
      return '<g class="portrait-extra"><path d="M-92,20 q8 -7 16 0 M-70,24 q7 -6 14 0 M-46,26 q7 -6 14 0 M54,24 q7 -6 14 0 M78,20 q8 -7 16 0" stroke="#7d9a5f" stroke-width="1.4" fill="none" opacity=".7"/><circle cx="-74" cy="8" r="1.5" fill="#d6df92" opacity=".85"/><circle cx="-30" cy="14" r="1.2" fill="#d6df92" opacity=".7"/><circle cx="62" cy="10" r="1.4" fill="#d6df92" opacity=".75"/></g>';
    }
    if (type === 'well') {
      return '<g class="portrait-extra"><ellipse cx="0" cy="28" rx="44" ry="10" fill="none" stroke="#8bc0ae" stroke-width="1" opacity=".45"/><ellipse cx="0" cy="28" rx="28" ry="6" fill="none" stroke="#b8d5c7" stroke-width=".8" opacity=".4"/><path d="M-20,26 q20 4 40 0" stroke="#d5e4de" stroke-width="1" fill="none" opacity=".5"/></g>';
    }
    if (type === 'gate') {
      return '<g class="portrait-extra"><circle cx="-48" cy="-4" r="4" fill="#d8b96b" opacity=".85"/><circle cx="48" cy="-4" r="4" fill="#d8b96b" opacity=".85"/><path d="M-48,-8 L-48,-16 M48,-8 L48,-16" stroke="#8f4a3b" stroke-width="1.2"/><path d="M-53,-1 q5 5 10 0 M43,-1 q5 5 10 0" stroke="#a33b2a" stroke-width="1.4" fill="none" opacity=".6"/></g>';
    }
    if (type === 'dorm' || type === 'kitchen' || type === 'guest' || type === 'infirmary') {
      return '<g class="portrait-extra"><path d="M-44,-6 L-44,-16 M44,-6 L44,-16" stroke="#8f4a3b" stroke-width="1" opacity=".85"/><circle cx="-44" cy="-4" r="3" fill="#d8b96b" opacity=".9"/><circle cx="44" cy="-4" r="3" fill="#d8b96b" opacity=".9"/><path d="M-48,0 q4 4 8 0 M40,0 q4 4 8 0" stroke="#a33b2a" stroke-width="1.2" fill="none" opacity=".6"/><path d="M-58,26 q8 -4 16 0 M42,26 q8 -4 16 0" stroke="#7d6a4e" stroke-width=".9" fill="none" opacity=".45"/></g>';
    }
    if (type === 'pavilion') {
      return '<g class="portrait-extra"><path d="M-64,-36 q6 -5 12 0 q6 -5 12 0 M54,-48 q5 -4 10 0 q5 -4 10 0" stroke="#5e6577" stroke-width="1.2" fill="none" opacity=".55"/><path d="M-44,26 q22 8 44 0" stroke="#8f6a43" stroke-width="1" fill="none" opacity=".4"/></g>';
    }
    return '';
  }

  function buildingPortrait(type, level) {
    var fake = { id: 'portrait', type: type, x: 0, y: 0, level: level || 1, construction: 0, workers: [] };
    var def = D.BUILDINGS[type] || { name: '屋舍' };
    var uid = 'bp' + (UI.uid++);
    var lv = level || 1;
    var chars = '青崖山营造图'.split('').map(function (ch, i) {
      return '<tspan x="606" dy="' + (i ? 18 : 0) + '">' + ch + '</tspan>';
    }).join('');
    return '<svg viewBox="0 0 640 300" class="portrait-svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + h(def.name) + '营造图">' +
      '<defs>' +
      '<linearGradient id="' + uid + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--portrait-sky-a)"/><stop offset=".7" style="stop-color:var(--portrait-sky-b)"/><stop offset="1" style="stop-color:var(--portrait-ground)"/></linearGradient>' +
      '<linearGradient id="' + uid + 'mist" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--portrait-mist);stop-opacity:0"/><stop offset=".5" style="stop-color:var(--portrait-mist);stop-opacity:.55"/><stop offset="1" style="stop-color:var(--portrait-mist);stop-opacity:0"/></linearGradient>' +
      '<radialGradient id="' + uid + 'sun"><stop offset="0" stop-color="#fff9e5"/><stop offset=".55" stop-color="#f3e1b8" stop-opacity=".7"/><stop offset="1" stop-color="#f3e1b8" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + uid + 'path" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--portrait-stone)" stop-opacity=".9"/><stop offset="1" stop-color="var(--portrait-stone)" stop-opacity=".42"/></linearGradient>' +
      '<radialGradient id="' + uid + 'vig" cx=".5" cy=".46" r=".74"><stop offset=".58" stop-color="var(--ink)" stop-opacity="0"/><stop offset="1" stop-color="var(--ink)" stop-opacity=".24"/></radialGradient>' +
      '<filter id="' + uid + 'blur"><feGaussianBlur stdDeviation="6"/></filter>' +
      '</defs>' +
      '<rect width="640" height="300" fill="url(#' + uid + 'sky)"/>' +
      '<circle cx="508" cy="66" r="78" fill="url(#' + uid + 'sun)" opacity=".85"/>' +
      '<circle cx="508" cy="66" r="27" fill="#f9edcf" opacity=".82"/>' +
      '<circle cx="508" cy="66" r="45" fill="none" stroke="#e2cfa1" stroke-width=".7" opacity=".32"/>' +
      '<path d="M382 82 q7 -6 14 0 q7 -6 14 0 M416 96 q5 -4 10 0 q5 -4 10 0" stroke="var(--portrait-near)" stroke-width="1.1" fill="none" opacity=".42"/>' +
      '<path d="M-30 190 L26 146 L58 162 L94 108 L124 136 L164 92 L198 142 L238 118 L282 164 L326 136 L366 172 L410 124 L446 158 L486 112 L520 150 L560 132 L602 174 L670 146 L670 300 L-30 300 Z" fill="var(--portrait-far)" opacity=".42"/>' +
      '<path d="M282 300 L334 214 L364 230 L408 150 L432 174 L458 112 L486 154 L516 138 L552 190 L590 172 L640 232 L670 218 L670 300 Z" fill="var(--portrait-mid)" opacity=".58"/>' +
      '<path d="M282 300 L334 214 L364 230 L408 150 L432 174 L458 112 L486 154 L516 138 L552 190 L590 172 L640 232 L670 218" stroke="var(--portrait-near)" stroke-width="1.8" fill="none" opacity=".22"/>' +
      '<path d="M410 218 Q424 194 432 176 M456 206 Q466 178 480 156 M516 204 Q528 180 540 160" stroke="var(--portrait-near)" stroke-width="1" fill="none" opacity=".16"/>' +
      '<path d="M458 112 L486 154 L470 190 L444 210 L420 248 L458 248 L486 196 L516 160 L486 154 Z" fill="var(--portrait-far)" opacity=".28"/>' +
      '<g filter="url(#' + uid + 'blur)" opacity=".46"><ellipse cx="160" cy="262" rx="150" ry="18" fill="url(#' + uid + 'mist)"/><ellipse cx="486" cy="270" rx="184" ry="22" fill="url(#' + uid + 'mist)"/><ellipse cx="328" cy="238" rx="124" ry="12" fill="url(#' + uid + 'mist)"/></g>' +
      '<ellipse cx="320" cy="190" rx="146" ry="58" fill="#fff8e9" opacity=".14" filter="url(#' + uid + 'blur)"/>' +
      '<g transform="translate(320,180)">' +
      '<path d="M-180 0 Q-142 -16 -104 -12 Q-56 -22 -8 -16 Q40 -24 88 -14 Q136 -18 180 0 Q142 18 96 24 Q38 34 -10 30 Q-58 36 -106 24 Q-144 16 -180 0 Z" fill="var(--portrait-ground)" opacity=".98"/>' +
      '<path d="M-180 0 Q-142 18 -104 24 Q-56 36 -8 30 Q38 34 96 24 Q142 18 180 0 L154 32 Q116 54 70 64 Q24 74 -22 68 Q-66 62 -112 48 Q-148 34 -180 0 Z" fill="var(--portrait-near)" opacity=".95"/>' +
      '<path d="M-152 24 Q-104 44 -56 54 Q0 68 56 52 Q104 40 152 28 L128 52 Q82 72 26 82 Q-28 86 -76 68 Q-116 52 -152 24 Z" fill="var(--portrait-stone-dark)" opacity=".62"/>' +
      '<path d="M-94 64 Q-66 80 -18 88 Q28 92 76 76 L58 92 Q20 104 -18 102 Q-56 96 -94 78 Z" fill="var(--portrait-near)" opacity=".82"/>' +
      '<path d="M-180 0 Q-132 -14 -84 -10 Q-38 -20 8 -14 Q56 -20 104 -10 Q142 -14 180 0" stroke="var(--portrait-ground)" stroke-width="7" fill="none" opacity=".55"/>' +
      '<path d="M-58 96 q-4 12 3 20 M38 100 q5 10 -2 18 M-2 104 q-3 9 2 15" stroke="var(--portrait-near)" stroke-width="1.6" fill="none" opacity=".55"/>' +
      '<path d="M-198 146 q18 -10 34 0 M190 132 q16 -8 30 2" stroke="var(--portrait-mist)" stroke-width="1" fill="none" opacity=".35"/>' +
      '<path d="M-132 34 q40 18 80 24 M-70 64 q30 8 60 6 M16 66 q34 -4 66 -18" stroke="var(--portrait-stone-dark)" stroke-width=".9" fill="none" opacity=".28"/>' +
      '</g>' +
      '<g filter="url(#' + uid + 'blur)" opacity=".66"><ellipse cx="206" cy="272" rx="96" ry="18" fill="var(--portrait-mist)"/><ellipse cx="430" cy="282" rx="112" ry="22" fill="var(--portrait-mist)"/></g>' +
      '<ellipse cx="320" cy="288" rx="162" ry="16" fill="var(--portrait-stone-dark)" opacity=".18" filter="url(#' + uid + 'blur)"/>' +
      '<g opacity=".72"><path d="M468 190 C464 214 460 238 454 268 L470 268 C472 240 474 216 480 190 Z" fill="#a9c9bc"/><path d="M470 194 C467 218 464 240 460 262" stroke="#edf6ee" stroke-width="1.8" fill="none" opacity=".7"/><g filter="url(#' + uid + 'blur)" opacity=".7"><ellipse cx="462" cy="270" rx="32" ry="9" fill="#d9ebe0"/></g></g>' +
      '<g filter="url(#' + uid + 'blur)" opacity=".5"><ellipse cx="196" cy="286" rx="74" ry="12" fill="var(--portrait-mist)"/><ellipse cx="452" cy="292" rx="92" ry="15" fill="var(--portrait-mist)"/></g>' +
      '<g fill="var(--portrait-near)" opacity=".9">' +
      '<g transform="translate(158,182) scale(1.0)"><rect x="-2.6" y="-20" width="5.2" height="22" fill="#5b4734"/><path d="M0,-96 L-27,-44 L-12,-44 L-38,-10 L-15,-10 L-45,28 L45,28 L15,-10 L38,-10 L12,-44 L27,-44 Z"/></g>' +
      '<g transform="translate(478,184) scale(.82)"><rect x="-2.6" y="-20" width="5.2" height="22" fill="#5b4734"/><path d="M0,-96 L-27,-44 L-12,-44 L-38,-10 L-15,-10 L-45,28 L45,28 L15,-10 L38,-10 L12,-44 L27,-44 Z"/></g>' +
      '</g>' +
      '<g transform="translate(252,210)" fill="var(--portrait-near)" opacity=".72"><circle cx="0" cy="-17" r="3.2"/><path d="M0,-14 q-5 7 -3 15 h6 q2 -8 -3 -15"/><path d="M-3,-2 l-3 8 M3,-2 l3 8" stroke="var(--portrait-near)" stroke-width="1.1" fill="none"/><path d="M6,-20 l0 22" stroke="var(--portrait-near)" stroke-width="1" fill="none"/></g>' +
      '<g fill="var(--portrait-stone-dark)" opacity=".55"><path d="M104 228 l12 -8 l10 8 l-10 8 Z"/><path d="M522 216 l14 -9 l12 10 l-12 8 Z"/><path d="M76 252 l9 -6 l8 7 l-8 6 Z"/></g>' +
      '<g transform="translate(320,190)">' +
      '<ellipse cx="0" cy="24" rx="174" ry="34" fill="rgba(35,30,20,.22)"/>' +
      '<polygon points="0,-20 164,19 0,58 -164,19" fill="var(--portrait-stone-dark)" opacity=".55"/>' +
      '<polygon points="0,-10 140,18 0,48 -140,18" fill="var(--portrait-stone)" opacity=".96"/>' +
      '<path d="M-140,18 L0,48 L140,18" stroke="var(--portrait-stone-dark)" stroke-width="1" fill="none" opacity=".42"/>' +
      '<path d="M-98,12 L-24,32 M-62,6 L16,30 M-26,2 L54,26" stroke="var(--portrait-stone-dark)" stroke-width=".8" fill="none" opacity=".22"/>' +
      '<path d="M-58,48 L-42,48 L-34,70 L-67,70 Z M36,48 L52,48 L60,70 L27,70 Z" fill="var(--portrait-stone-dark)" opacity=".62"/>' +
      '<path d="M-7,54 L7,54 L9,76 L-9,76 Z" fill="var(--portrait-stone-dark)" opacity=".5"/>' +
      '<g stroke="var(--portrait-stone-dark)" stroke-width="1.3" fill="none" opacity=".52">' +
      '<path d="M-150,10 L-150,-6 M-126,15 L-126,-1 M-102,20 L-102,4 M102,20 L102,4 M126,15 L126,-1 M150,10 L150,-6"/>' +
      '<path d="M-150,-6 Q-126,-11 -102,4 M102,4 Q126,-11 150,-6"/>' +
      '</g>' +
      '<g transform="translate(0,-18) scale(2.5)">' + buildingGroup(fake, { noIso: true, decorative: true, hideLevel: true }) + '</g>' +
      '<g transform="translate(0,-2) scale(2.0)">' + portraitExtras(type) + '</g>' +
      '</g>' +
      '<g transform="translate(246,208)"><rect x="-5" y="-3" width="10" height="4" fill="var(--portrait-stone-dark)" opacity=".75"/><rect x="-1.5" y="-10" width="3" height="8" fill="var(--portrait-stone-dark)" opacity=".7"/><rect x="-4" y="-17" width="8" height="7" rx="1" fill="var(--portrait-stone)" opacity=".9"/><path d="M-6,-17 L6,-17 L4,-21 L-4,-21 Z" fill="var(--portrait-stone-dark)" opacity=".8"/><circle cx="0" cy="-13.5" r="1.5" fill="#e8c982" opacity=".95"/></g>' +
      '<g transform="translate(394,210)"><rect x="-5" y="-3" width="10" height="4" fill="var(--portrait-stone-dark)" opacity=".75"/><rect x="-1.5" y="-10" width="3" height="8" fill="var(--portrait-stone-dark)" opacity=".7"/><rect x="-4" y="-17" width="8" height="7" rx="1" fill="var(--portrait-stone)" opacity=".9"/><path d="M-6,-17 L6,-17 L4,-21 L-4,-21 Z" fill="var(--portrait-stone-dark)" opacity=".8"/><circle cx="0" cy="-13.5" r="1.5" fill="#e8c982" opacity=".95"/></g>' +
      '<g fill="var(--portrait-near)" opacity=".55"><path d="M32 292 l4 -14 h-2 l4 -10 l4 10 h-2 l4 14 z"/><path d="M54 296 l3 -11 h-2 l3 -8 l3 8 h-2 l3 11 z"/><path d="M582 294 l4 -13 h-2 l4 -10 l4 10 h-2 l4 13 z"/></g>' +
      '<g fill="var(--portrait-stone-dark)" opacity=".32"><ellipse cx="92" cy="288" rx="22" ry="7"/><ellipse cx="540" cy="290" rx="26" ry="8"/></g>' +
      '<rect width="640" height="300" fill="url(#' + uid + 'vig)" opacity=".8" pointer-events="none"/>' +
      '<g class="portrait-inscription" fill="var(--ink)" opacity=".72" font-family="Noto Serif SC, Songti SC, STSong, serif" font-size="12.5" letter-spacing="2"><text x="606" y="52">' + chars + '</text></g>' +
      '<g class="portrait-seal" transform="translate(590,222)"><rect width="27" height="27" rx="2" fill="var(--cinnabar)" opacity=".88"/><text x="13.5" y="11" text-anchor="middle" font-size="8" fill="#f8efd7">一</text><text x="13.5" y="21" text-anchor="middle" font-size="8" fill="#f8efd7">念</text></g>' +
      '</svg>';
  }

  function openLog() {
    var logs = UI.game.log || [];
    openModal('<div class="modal-head"><div><p class="eyebrow">SECT CHRONICLE</p><h2>山门纪要</h2></div><button class="modal-close" data-action="close-modal" aria-label="关闭">×</button></div><div class="log-full">' + (logs.length ? logs.map(function (l) { return '<div class="log-item log-' + l.type + '"><span class="log-date">' + h(l.date) + '</span><span class="log-dot"></span><p>' + h(l.text) + '</p></div>'; }).join('') : '<p class="muted">尚无记载。</p>') + '</div>', { class: 'log-modal-wrap', dismissible: true, key: 'log' });
  }

  /* ------------------------------------------------------------------ */
  /* 招募 / 任务 / 结局                                                 */
  /* ------------------------------------------------------------------ */
  function openRecruit() {
    var r = E.recruitCandidates(UI.game);
    if (!r.ok) { toast(r.msg, 'warn'); return; }
    saveNow();
    renderAll();
    openRecruitModal();
  }

  function openRecruitModal() {
    var list = UI.game.recruitCandidates;
    if (!list) return;
    var content = '<div class="modal-head"><div><p class="eyebrow">AT THE GATE</p><h2>山门招徒</h2><p class="detail-sub">挑一个顺眼的。剩下的，给份干粮送下山。</p></div><button class="modal-close" data-action="close-modal" aria-label="关闭">×</button></div><div class="candidate-grid">' +
      list.map(function (d) {
        return '<article class="candidate-card"><div class="candidate-head">' + avatarSvg(d, 70) + '<div><h3>' + h(d.name) + '</h3><span>' + h(rootOf(d).name) + ' · ' + h(d.origin) + '</span></div></div><p class="candidate-bio">' + h(rootOf(d).desc) + '</p><div class="candidate-stats"><span>资质 <b>' + E.aptitude(d) + '</b></span><span>年龄 <b>' + d.age + '</b></span><span>修为 <b>' + h(stage(d)) + '</b></span></div><div class="trait-row">' + (d.traits || []).map(function (t) { return '<span class="trait-chip">' + h(D.TRAITS[t] ? D.TRAITS[t].name : t) + '</span>'; }).join('') + '</div><button class="btn btn-primary btn-sm btn-block" data-action="choose-recruit" data-id="' + d.id + '">收入门下</button></article>';
      }).join('') + '</div>';
    openModal(content, { class: 'recruit-modal-wrap', dismissible: true, key: 'recruit' });
  }

  function openMissionPicker(missionId) {
    var m = D.MISSIONS.find(function (x) { return x.id === missionId; });
    if (!m) return;
    UI.missionPick = { missionId: missionId, ids: [], repeat: true };
    openMissionModal();
  }

  function openMissionModal() {
    var m = D.MISSIONS.find(function (x) { return x.id === UI.missionPick.missionId; });
    if (!m) return;
    var repeat = UI.missionPick.repeat !== false;
    var reserved = {};
    (UI.game.missionOrders || []).forEach(function (o) {
      (o.discipleIds || []).forEach(function (id) { reserved[id] = true; });
    });
    var list = E.aliveDisciples(UI.game).filter(function (d) { return !d.missionId && !reserved[d.id]; });
    var selected = UI.missionPick.ids;
    var power = selected.reduce(function (s, id) { var d = E.discipleById(UI.game, id); return s + (d ? E.power(d, UI.game) : 0); }, 0);
    var content = '<div class="modal-head"><div><p class="eyebrow">EXPEDITION</p><h2>' + h(m.name) + '</h2><p class="detail-sub">危险 ' + (m.danger || 0) + ' · ' + m.days + ' 日 · 建议战力 ' + fmt(m.minPower || 0) + '</p></div><button class="modal-close" data-action="close-modal" aria-label="关闭">×</button></div><div class="detail-body"><p class="detail-bio">' + h(m.desc) + ' ' + h(m.flavor) + '</p>' +
      '<div class="mission-pick-summary"><span>已选 <b>' + selected.length + '</b> / 2</span><span>队伍战力 <b>' + fmt(power) + '</b></span></div>' +
      '<button class="repeat-toggle ' + (repeat ? 'active' : '') + '" data-action="mission-repeat"><span class="repeat-mark">∞</span><span><b>常驻历练</b><small>归来休整两日后自动再出发，直到你叫停。</small></span><em>' + (repeat ? '已开启' : '关闭') + '</em></button>' +
      '<div class="pick-list">' + (list.length ? list.map(function (d) {
        var roleOk = m.allowOuter || d.role === 'inner';
        var realmOk = d.realm >= (m.minRealm || 0);
        var healthOk = d.health >= 30;
        var disabled = !roleOk || !realmOk || !healthOk || (selected.length >= 2 && selected.indexOf(d.id) < 0);
        var reason = !roleOk ? '需内门' : !realmOk ? '境界不足' : !healthOk ? '伤势未愈' : '';
        return '<button class="pick-card ' + (selected.indexOf(d.id) >= 0 ? 'active' : '') + '" data-action="mission-pick" data-id="' + d.id + '" ' + (disabled ? 'disabled' : '') + '>' + avatarSvg(d, 38) + '<span><b>' + h(d.name) + '</b><small>' + roleBadge(d) + ' ' + h(stage(d)) + ' · 战力 ' + fmt(E.power(d, UI.game)) + (reason ? ' · ' + reason : '') + '</small></span><em>' + (selected.indexOf(d.id) >= 0 ? '✓' : '') + '</em></button>';
      }).join('') : '<p class="muted mission-empty">暂无空闲弟子。常驻队伍归来休整时也会留在此处。</p>') + '</div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" data-action="close-modal">再想想</button><button class="btn btn-primary" data-action="launch-mission" ' + (selected.length ? '' : 'disabled') + '>' + (repeat ? '常驻启程' : '启程') + ' · 食物 ' + (3 * selected.length) + '</button></div></div>';
    openModal(content, { class: 'mission-modal-wrap', dismissible: true, key: 'mission:' + m.id });
  }

  function renderEnding() {
    var end = UI.game.ending;
    if (!end) return;
    var content = '<div class="ending-modal"><div class="ending-art">' + eventArt(end.type === 'ascension' ? 'moon' : 'sword') + '</div><div class="ending-body"><p class="eyebrow">' + (end.type === 'ascension' ? 'THE WAY IS OPEN' : 'THE LAMP GOES OUT') + '</p><h2>' + h(end.title) + '</h2><p>' + h(end.text) + '</p><div class="ending-stats"><div><b>' + date(UI.game).year + '</b><span>年</span></div><div><b>' + fmt(UI.game.resources.renown) + '</b><span>声望</span></div><div><b>' + E.aliveDisciples(UI.game).length + '</b><span>弟子</span></div><div><b>' + (UI.game.stats.breakthroughs || 0) + '</b><span>破境</span></div></div><div class="modal-actions">' + (end.type === 'ascension' ? '<button class="btn btn-ghost" data-action="ending-continue">继续守望山门</button>' : '') + '<button class="btn btn-primary" data-action="new-game">再开一局</button></div></div></div>';
    openModal(content, { class: 'ending-modal-wrap', dismissible: false, key: 'ending' });
  }

  /* ------------------------------------------------------------------ */
  /* 时间循环                                                           */
  /* ------------------------------------------------------------------ */
  function startTimer() {
    stopTimer();
    UI.acc = 0;
    UI.timer = setInterval(loop, 250);
  }
  function stopTimer() {
    if (UI.timer) clearInterval(UI.timer);
    UI.timer = null;
  }
  function loop() {
    if (!UI.game || UI.paused || UI.modalOpen || document.hidden || UI.game.ending) return;
    UI.acc += 0.25;
    var interval = 2.8 / UI.speed;
    if (UI.acc < interval) return;
    UI.acc = 0;
    E.tick(UI.game);
    afterTick();
  }

  function afterTick() {
    if (!UI.game) return;
    if (UI.game.day !== UI.lastSaveDay) saveNow();
    renderAll();
    if (UI.game.ending) { renderEnding(); return; }
    syncAutoModals();
  }

  /* ------------------------------------------------------------------ */
  /* 事件处理                                                           */
  /* ------------------------------------------------------------------ */
  function refreshAssignmentModal() {
    var key = UI.modalKey || '';
    if (key.indexOf('disciple:') === 0) openDisciple(key.slice(9));
    else if (key.indexOf('building:') === 0) openBuilding(key.slice(9));
  }

  function handleAction(el) {
    var action = el.getAttribute('data-action');
    if (!action || action === 'noop') return;
    var id = el.getAttribute('data-id');
    var value = el.getAttribute('data-value');
    var tab = el.getAttribute('data-tab');
    switch (action) {
      case 'continue': continueGame(); break;
      case 'new-game':
        if (UI.game) { UI.confirmNew = true; openNewConfirm(); }
        else { renderCreation(); }
        break;
      case 'back-landing': renderLanding(); break;
      case 'choose-origin': captureCreateFields(); UI.create.origin = value; renderCreation(); break;
      case 'choose-root': captureCreateFields(); UI.create.root = value; renderCreation(); break;
      case 'start-game': startGame(); break;
      case 'open-journey': if (UI.game) openJourney(); break;
      case 'journey-go':
        if (UI.game) { closeModal(); UI.tab = tab || 'sect'; if (el.getAttribute('data-affairs')) UI.affairsTab = el.getAttribute('data-affairs'); renderAll(); }
        break;
      case 'claim-chapter': {
        var chapterResult = E.claimChapter(UI.game, id);
        var inJourney = UI.modalKey === 'journey';
        if (chapterResult.ok) { saveNow(); renderAll(); if (inJourney) openJourney(); }
        toast(chapterResult.msg, chapterResult.ok ? 'good' : 'warn');
        break;
      }
      case 'fulfill-commission': {
        var commissionResult = E.fulfillCommission(UI.game, id);
        if (commissionResult.ok) { saveNow(); renderAll(); }
        toast(commissionResult.msg, commissionResult.ok ? 'good' : 'warn');
        break;
      }
      case 'nav': if (UI.game) { UI.tab = tab || 'sect'; UI.buildType = null; closeModal(); renderAll(); } break;
      case 'task-go':
        if (id === '') { /* noop */ }
        if (el.getAttribute('data-disciple')) { UI.tab = 'disciples'; renderAll(); openDisciple(el.getAttribute('data-disciple')); }
        else if (el.getAttribute('data-building')) { openBuilding(el.getAttribute('data-building')); }
        else { UI.tab = tab || 'sect'; renderAll(); }
        break;
      case 'pause':
        UI.paused = !UI.paused;
        if (!UI.paused) UI.autoPaused = false;
        renderHeader();
        break;
      case 'speed': UI.paused = false; UI.autoPaused = false; UI.speed = Number(value); UI.settings.speed = UI.speed; saveSettings(); renderHeader(); break;
      case 'speed-cycle': {
        var seq = [1, 2, 4];
        UI.speed = seq[(seq.indexOf(UI.speed) + 1) % seq.length];
        UI.paused = false;
        UI.autoPaused = false;
        UI.settings.speed = UI.speed;
        saveSettings();
        renderHeader();
        break;
      }
      case 'settings': openSettings(); break;
      case 'alerts': openAlerts(); break;
      case 'help': openHelp(); break;
      case 'close-modal': closeModal(); break;
      case 'backdrop-close': if (el === el.parentElement || el.classList.contains('modal-backdrop')) closeModal(); break;
      case 'filter': UI.filter = value; renderDisciples(); break;
      case 'open-disciple': UI.tab = 'disciples'; renderAll(); openDisciple(id); break;
      case 'open-building': UI.tab = 'sect'; renderAll(); openBuilding(id); break;
      case 'assign': {
        var res = E.assign(UI.game, id, el.getAttribute('data-building') || null);
        if (!res.ok) toast(res.msg, 'warn');
        else {
          saveNow();
          renderAll();
          refreshAssignmentModal();
          toast(res.msg || '差事已定。', 'good');
        }
        break;
      }
      case 'assign-select': {
        var picked = el.value;
        var ar = picked === 'auto' ? E.autoAssign(UI.game, id) : E.assign(UI.game, id, picked || null);
        if (!UI.modalOpen && UI.autoPaused) { UI.autoPaused = false; UI.paused = false; }
        if (!ar.ok) toast(ar.msg, 'warn');
        else {
          saveNow();
          renderAll();
          refreshAssignmentModal();
          toast(ar.msg || '差事已定。', 'good');
        }
        break;
      }
      case 'auto-assign': {
        var aa = E.autoAssign(UI.game, id);
        if (!aa.ok) toast(aa.msg, 'warn');
        else {
          saveNow();
          renderAll();
          refreshAssignmentModal();
          toast(aa.msg || '已择定差事。', 'good');
        }
        break;
      }
      case 'auto-staff': {
        var as = E.autoStaff(UI.game, id);
        if (!as.ok) toast(as.msg, 'warn');
        else {
          saveNow();
          renderAll();
          refreshAssignmentModal();
          toast(as.count ? '补入 ' + as.count + ' 名弟子。' : '暂无空闲弟子可补位。', as.count ? 'good' : 'warn');
        }
        break;
      }
      case 'promote':
        var pr = E.promote(UI.game, id);
        if (!pr.ok) toast(pr.msg, 'warn'); else { saveNow(); closeModal(); renderAll(); toast('晋升内门。', 'good'); }
        break;
      case 'choose-master': {
        var cm = E.chooseMaster(UI.game, id);
        if (!cm.ok) toast(cm.msg, 'warn');
        else { saveNow(); closeModal(); renderAll(); toast(cm.master.name + '接任掌门。', 'good'); }
        break;
      }
      case 'breakthrough':
        var br = E.tryBreakthrough(UI.game, id, false);
        if (!br.ok) toast(br.msg || '突破失败。', 'warn'); else toast(br.ascended ? '飞升！' : '破境成功。', 'good');
        saveNow(); closeModal(); renderAll(); syncAutoModals(); break;
      case 'breakthrough-pill':
        var bp = E.tryBreakthrough(UI.game, id, true);
        if (!bp.ok) toast(bp.msg || '突破失败。', 'warn'); else toast(bp.ascended ? '飞升！' : '破境成功。', 'good');
        saveNow(); closeModal(); renderAll(); syncAutoModals(); break;
      case 'use-pill':
        var up = E.usePill(UI.game, id, el.getAttribute('data-pill'));
        if (!up.ok) toast(up.msg, 'warn'); else { saveNow(); closeModal(); renderAll(); openDisciple(id); toast('药力化开。', 'good'); }
        break;
      case 'build-cat': UI.buildCat = value; renderBuild(); break;
      case 'select-build': {
        var buildType = el.getAttribute('data-type') || value;
        var def = D.BUILDINGS[buildType];
        if (!def) break;
        var built = E.buildAuto(UI.game, buildType);
        if (!built.ok) { toast(built.msg, 'warn'); break; }
        UI.buildType = null;
        UI.tab = 'sect';
        UI.selectedBuilding = built.building.id;
        saveNow();
        renderAll();
        toast(def.name + '已在山中择地开工。', 'good');
        break;
      }
      case 'cancel-build': UI.buildType = null; renderAll(); break;
      case 'upgrade':
        var upg = E.upgrade(UI.game, id);
        if (!upg.ok) toast(upg.msg, 'warn'); else { saveNow(); closeModal(); renderAll(); openBuilding(id); toast('扩建完成。', 'good'); }
        break;
      case 'demolish':
        if (!confirm('确定拆除这座建筑？返还一半木石。')) break;
        var dem = E.demolish(UI.game, id);
        if (!dem.ok) toast(dem.msg, 'warn'); else { saveNow(); closeModal(); renderAll(); toast('建筑已拆除。'); }
        break;
      case 'affairs-tab': UI.affairsTab = value; renderAffairs(); break;
      case 'mission-open': openMissionPicker(el.getAttribute('data-id')); break;
      case 'mission-pick':
        var pick = UI.missionPick;
        if (!pick) break;
        var idx = pick.ids.indexOf(id);
        if (idx >= 0) pick.ids.splice(idx, 1);
        else if (pick.ids.length < 2) pick.ids.push(id);
        openMissionModal();
        break;
      case 'mission-repeat':
        if (!UI.missionPick) break;
        UI.missionPick.repeat = UI.missionPick.repeat === false;
        openMissionModal();
        break;
      case 'mission-stop':
        var stopped = E.stopMissionOrder(UI.game, id);
        if (!stopped.ok) toast(stopped.msg, 'warn');
        else { saveNow(); renderAll(); toast('常驻历练已停止，本次行程结束后队伍回山。', 'good'); }
        break;
      case 'launch-mission':
        if (!UI.missionPick) break;
        var ms = E.startMission(UI.game, UI.missionPick.missionId, UI.missionPick.ids, { repeat: UI.missionPick.repeat !== false });
        if (!ms.ok) toast(ms.msg, 'warn');
        else {
          var wasRepeat = UI.missionPick.repeat !== false;
          UI.missionPick = null;
          saveNow();
          closeModal();
          renderAll();
          toast(wasRepeat ? '弟子启程，将常驻此地历练。' : '弟子启程下山。', 'good');
        }
        break;
      case 'recipe':
        var b = E.buildingById(UI.game, el.getAttribute('data-building'));
        var rid = el.getAttribute('data-recipe');
        if (b) {
          var recipe = D.RECIPES.find(function (r) { return r.id === rid; });
          if (recipe && E.recipeUnlocked(UI.game, recipe)) { b.recipe = rid; b.progress = 0; b.batch = null; saveNow(); closeModal(); renderAll(); toast('丹方已换为' + recipe.name + '。'); }
        }
        break;
      case 'research':
        var rr = E.researchNode(UI.game, id);
        if (!rr.ok) toast(rr.msg, 'warn'); else { saveNow(); renderAll(); toast('参研有成。', 'good'); }
        break;
      case 'buy':
        var buy = E.marketBuy(UI.game, Number(el.getAttribute('data-index')), Number(el.getAttribute('data-qty') || 1));
        if (!buy.ok) toast(buy.msg, 'warn'); else { saveNow(); renderAll(); }
        break;
      case 'buy-custom': {
        var buyIndex = Number(el.getAttribute('data-index'));
        var buyInput = document.querySelector('.qty-input[data-buy-index="' + buyIndex + '"]');
        var buyQty = buyInput ? Number(buyInput.value) : 1;
        var customBuy = E.marketBuy(UI.game, buyIndex, buyQty);
        if (!customBuy.ok) toast(customBuy.msg, 'warn'); else { saveNow(); renderAll(); }
        break;
      }
      case 'sell':
        var sell = E.marketSell(UI.game, el.getAttribute('data-id'), Number(el.getAttribute('data-qty') || 5));
        if (!sell.ok) toast(sell.msg, 'warn'); else { saveNow(); renderAll(); }
        break;
      case 'sell-custom': {
        var sellId = el.getAttribute('data-id');
        var sellInput = document.querySelector('.qty-input[data-sell-id="' + sellId + '"]');
        var sellQty = sellInput ? Number(sellInput.value) : 1;
        var customSell = E.marketSell(UI.game, sellId, sellQty);
        if (!customSell.ok) toast(customSell.msg, 'warn'); else { saveNow(); renderAll(); }
        break;
      }
      case 'recruit': openRecruit(); break;
      case 'choose-recruit':
        var cr = E.chooseRecruit(UI.game, id);
        if (!cr.ok) toast(cr.msg, 'warn'); else { saveNow(); closeModal(); renderAll(); toast(cr.disciple.name + '拜入山门。', 'good'); }
        break;
      case 'open-log': openLog(); break;
      case 'save-now': if (saveNow()) toast('已存档。', 'good'); break;
      case 'export-save':
        openExport(); break;
      case 'download-save':
        downloadSave(); break;
      case 'import-save': openImport(); break;
      case 'do-import':
        var ta = document.getElementById('import-json');
        var st = ta ? E.importState(ta.value) : null;
        if (!st) toast('存档格式不正确。', 'warn');
        else { UI.game = st; E.save(st, true); closeModal(); document.getElementById('app').innerHTML = shellHtml(); renderAll(); startTimer(); toast('存档已导入。', 'good'); }
        break;
      case 'theme': applyTheme(value); saveSettings(); openSettings(); break;
      case 'map-zoom-in': UI.mapZoom = Math.min(1.65, UI.mapZoom + 0.15); renderSect(); break;
      case 'map-zoom-out': UI.mapZoom = Math.max(0.8, UI.mapZoom - 0.15); renderSect(); break;
      case 'map-reset': UI.mapZoom = 1; renderSect(); break;
      case 'event-choice':
        var evr = E.resolveEvent(UI.game, Number(el.getAttribute('data-index')));
        if (!evr.ok) toast(evr.msg, 'warn'); else { saveNow(); UI.modalKey = ''; renderAll(); syncAutoModals(); }
        break;
      case 'close-result': E.closeResult(UI.game); UI.modalKey = ''; closeModal(); renderAll(); syncAutoModals(); break;
      case 'close-report': E.closeReport(UI.game); UI.modalKey = ''; closeModal(); renderAll(); syncAutoModals(); break;
      case 'ending-continue':
        UI.game.ending = null; UI.modalKey = ''; closeModal(); renderAll(); startTimer(); break;
      case 'new-confirm': startNewConfirmed(); break;
      default: break;
    }
  }

  function openNewConfirm() {
    var content = '<div class="confirm-modal"><div class="modal-head"><div><p class="eyebrow">A NEW BEGINNING</p><h2>重开山门？</h2></div><button class="modal-close" data-action="close-modal" aria-label="关闭">×</button></div><div class="detail-body"><p>当前存档会被覆盖。旧宗的故事，就留在这座山里了。</p><div class="modal-actions"><button class="btn btn-ghost" data-action="close-modal">再想想</button><button class="btn btn-primary" data-action="new-confirm">立新山门</button></div></div></div>';
    openModal(content, { class: 'confirm-modal-wrap', dismissible: true, key: 'confirm-new' });
  }

  function startNewConfirmed() {
    E.deleteSave();
    UI.game = null;
    closeModal();
    renderCreation();
  }

  function openExport() {
    var json = E.exportState(UI.game);
    var content = '<div class="modal-head"><div><p class="eyebrow">ARCHIVE</p><h2>导出台账</h2></div><button class="modal-close" data-action="close-modal" aria-label="关闭">×</button></div><div class="detail-body"><p class="muted">复制下面的文字，或下载为文件。</p><textarea class="save-textarea" readonly>' + h(json) + '</textarea><div class="modal-actions"><button class="btn btn-ghost" data-action="download-save">下载存档</button><button class="btn btn-primary" data-action="close-modal">关闭</button></div></div>';
    openModal(content, { class: 'export-modal-wrap', dismissible: true, key: 'export' });
  }

  function downloadSave() {
    try {
      var blob = new Blob([E.exportState(UI.game)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'yinian-sect-' + Date.now() + '.json';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    } catch (e) { toast('下载失败，请复制文本。', 'warn'); }
  }

  function openImport() {
    var content = '<div class="modal-head"><div><p class="eyebrow">RESTORE</p><h2>导入台账</h2></div><button class="modal-close" data-action="close-modal" aria-label="关闭">×</button></div><div class="detail-body"><p class="muted">把之前导出的存档内容粘贴到这里。</p><textarea id="import-json" class="save-textarea" placeholder="粘贴存档 JSON…"></textarea><div class="modal-actions"><button class="btn btn-primary" data-action="do-import">导入并继续</button><button class="btn btn-ghost" data-action="close-modal">取消</button></div></div>';
    openModal(content, { class: 'import-modal-wrap', dismissible: true, key: 'import' });
  }

  /* ------------------------------------------------------------------ */
  /* 绑定                                                               */
  /* ------------------------------------------------------------------ */
  function bind() {
    document.addEventListener('click', function (e) {
      if (UI.suppressClick) { UI.suppressClick = false; return; }
      var el = e.target.closest('[data-action]');
      if (!el) return;
      if (el.tagName === 'SELECT' && el.getAttribute('data-action') === 'assign-select') return;
      if (el.getAttribute('data-action') === 'backdrop-close' && e.target !== el) return;
      if (el.disabled) return;
      handleAction(el);
    });

    document.addEventListener('change', function (e) {
      var el = e.target.closest('[data-action="assign-select"]');
      if (el) handleAction(el);
    });

    document.addEventListener('focusin', function (e) {
      var el = e.target.closest('[data-action="assign-select"]');
      if (!el || UI.modalOpen) return;
      if (UI.settings.autoPause && UI.game && !UI.paused) {
        UI.paused = true;
        UI.autoPaused = true;
        renderHeader();
      }
    });

    document.addEventListener('focusout', function (e) {
      var el = e.target.closest('[data-action="assign-select"]');
      if (!el) return;
      setTimeout(function () {
        var active = document.activeElement;
        var stillPicking = active && active.closest && active.closest('[data-action="assign-select"]');
        if (UI.autoPaused && !UI.modalOpen && !stillPicking) {
          UI.autoPaused = false;
          UI.paused = false;
          renderHeader();
        }
      }, 100);
    });

    var lastTap = 0;
    var lastTapX = 0;
    var lastTapY = 0;
    document.addEventListener('touchend', function (e) {
      if (!e.changedTouches || !e.changedTouches.length) return;
      var target = e.target;
      if (target && target.closest && target.closest('input, textarea, select, [contenteditable="true"]')) return;
      var touch = e.changedTouches[0];
      var now = Date.now();
      if (now - lastTap < 320 && Math.abs(touch.clientX - lastTapX) < 30 && Math.abs(touch.clientY - lastTapY) < 30) {
        e.preventDefault();
      }
      lastTap = now;
      lastTapX = touch.clientX;
      lastTapY = touch.clientY;
    }, { passive: false });

    document.addEventListener('dblclick', function (e) {
      var target = e.target;
      if (target && target.closest && target.closest('input, textarea, select, [contenteditable="true"]')) return;
      e.preventDefault();
    }, { passive: false });

    // 地图点击：建筑 / 弟子 / 空地
    document.addEventListener('click', function (e) {
      if (!UI.game || UI.modalOpen) return;
      var frame = e.target.closest('#map-frame');
      if (!frame) return;
      var bEl = e.target.closest('[data-building]');
      if (bEl) { openBuilding(bEl.getAttribute('data-building')); return; }
      var dEl = e.target.closest('[data-disciple]');
      if (dEl) { openDisciple(dEl.getAttribute('data-disciple')); return; }
      var tEl = e.target.closest('[data-tile]');
      if (!tEl) return;
      var xy = tEl.getAttribute('data-tile').split(',').map(Number);
      UI.tile = { x: xy[0], y: xy[1] };
      var terrain = E.terrainAt(UI.game, xy[0], xy[1]);
      var names = { G: '草地', F: '林地', M: '山岩', W: '水泽', S: '灵脉' };
      toast((E.buildingAt(UI.game, xy[0], xy[1]) ? '此处已有建筑' : '此处是' + (names[terrain] || '空地') + (E.isBuildable(UI.game, xy[0], xy[1]) ? '，可以营造' : '')) + '。');
      renderSect();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && UI.modalOpen) {
        var close = document.querySelector('.modal-close');
        if (close && close.getAttribute('data-action') === 'close-modal') closeModal();
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && UI.game) {
        E.save(UI.game);
        UI.hiddenPause = true;
        UI.pausedBeforeHidden = UI.paused;
        UI.paused = true;
      } else if (!document.hidden && UI.game && UI.hiddenPause) {
        UI.paused = !!UI.pausedBeforeHidden;
        UI.hiddenPause = false;
        renderHeader();
      }
    });

    window.addEventListener('pagehide', function () {
      if (UI.game) E.save(UI.game);
    });

    window.addEventListener('storage', function (e) {
      if (e.key !== D.SAVE_KEY || !e.newValue || !UI.game || UI.remoteSaveNotified) return;
      try {
        var other = JSON.parse(e.newValue);
        if (other && other.lastSaved && other.lastSaved > (UI.game.lastSaved || 0)) {
          UI.remoteSaveNotified = true;
          UI.paused = true;
          UI.autoPaused = false;
          renderHeader();
          toast('另一页面已更新存档。请刷新页面，载入最新进度。', 'warn');
        }
      } catch (err) {}
    });
  }

  /* ------------------------------------------------------------------ */
  /* 启动                                                               */
  /* ------------------------------------------------------------------ */
  UI.init = function () {
    loadSettings();
    bind();
    var app = document.getElementById('app');
    var params = null;
    try { params = new URLSearchParams(location.search); } catch (e) {}
    if (params && params.get('preview') === '1' && app) {
      UI.game = E.newGame({ seed: 20261113, sectName: '青崖宗', playerName: '沈未央', origin: 'clan', root: 'water' });
      UI.tab = params.get('tab') || 'sect';
      app.innerHTML = shellHtml();
      renderAll();
      startTimer();
      if (params.get('modal') === 'disciple') openDisciple(UI.game.playerId);
      if (params.get('modal') === 'event') { UI.game.pendingEvent = 'first_caravan'; renderAll(); syncAutoModals(); }
      if (params.get('modal') === 'building') openBuilding(UI.game.buildings[1].id);
      if (params.get('modal') === 'settings') openSettings();
    } else if (app) {
      renderLanding();
    }
    // 计时器常驻，由 loop 判断是否有游戏
    setInterval(loop, 250);
  };

  global.SectUI = UI;
})(typeof window !== 'undefined' ? window : globalThis);
