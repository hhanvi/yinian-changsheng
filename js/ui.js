/*
 * 一念长生 · 界面
 */
(function () {
  'use strict';

  var D = window.XianData;
  var E = window.XianEngine;
  var app = document.getElementById('app');
  var modalRoot = document.getElementById('modal-root');
  var toastRoot = document.getElementById('toast-root');

  var UI = {
    state: null,
    creation: null,
    screen: 'cultivate',
    charTab: 'stats',
    invTab: 'items',
    invFilter: 'all',
    modal: null,
    battlePillOpen: false,
    settings: { theme: 'night', motion: true, usePill: true }
  };
  window.XianUI = UI;

  /* ------------------------------------------------------------------ */
  /* 小工具                                                              */
  /* ------------------------------------------------------------------ */

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmt(n) {
    if (n == null || isNaN(n)) return '0';
    n = Math.round(n);
    if (Math.abs(n) >= 100000000) return (n / 100000000).toFixed(n >= 1e9 ? 0 : 1) + '亿';
    if (Math.abs(n) >= 10000) return (n / 10000).toFixed(n >= 1e6 ? 0 : 1) + '万';
    return n.toLocaleString('zh-CN');
  }

  function pct(v) {
    if (!isFinite(v)) return 0;
    return Math.max(0, Math.min(100, Math.round(v * 100)));
  }

  function statName(k) {
    return ({
      hp: '气血', mp: '灵力', atk: '攻击', def: '防御', sense: '神识',
      comp: '悟性', luck: '气运', cult: '修炼', crit: '暴击', heal: '疗伤',
      battleReward: '战利', alchemy: '丹道', life: '寿元'
    })[k] || k;
  }

  function modsText(mods, opts) {
    if (!mods) return '';
    var parts = [];
    Object.keys(mods).forEach(function (k) {
      var v = mods[k];
      if (!v) return;
      if (['hpPct', 'mpPct', 'atkPct', 'defPct', 'sensePct', 'compPct', 'luckPct'].indexOf(k) !== -1) {
        parts.push(statName(k.replace('Pct', '')) + ' +' + Math.round(v * 100) + '%');
      } else if (['cult', 'crit', 'heal', 'battleReward', 'alchemy'].indexOf(k) !== -1) {
        parts.push(statName(k) + ' +' + Math.round(v * 100) + '%');
      } else if (['hp', 'mp', 'atk', 'def', 'sense', 'comp', 'luck'].indexOf(k) !== -1) {
        parts.push(statName(k) + ' +' + v);
      }
    });
    return parts.join(' · ');
  }

  function rarityName(r) {
    return ['凡品', '灵品', '宝品', '仙品', '神品'][r] || '凡品';
  }

  function barRow(label, value, max, cls) {
    var p = max > 0 ? pct(value / max) : 0;
    return '<div class="bar-row">' +
      '<div class="bar-label"><span>' + esc(label) + '</span><span>' + fmt(value) + ' / ' + fmt(max) + '</span></div>' +
      '<div class="bar ' + cls + '" role="progressbar" aria-label="' + esc(label) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '"><i style="width:' + p + '%"></i></div>' +
      '</div>';
  }

  function chip(text, tone) {
    return '<span class="chip chip-' + (tone || 'plain') + '">' + text + '</span>';
  }

  function dangerDots(n) {
    var out = '<span class="danger" aria-label="危险程度 ' + n + '">';
    for (var i = 0; i < 4; i++) out += '<i class="' + (i < n ? 'on' : '') + '"></i>';
    out += '</span>';
    return out;
  }

  function icon(name) {
    var paths = {
      lotus: '<path d="M12 20c-4.2 0-7-2.4-7-5.5 1.8 0 3.2.6 4.2 1.7C8.4 13.4 8 11 8.8 8.8c1.3 1 2.3 2.6 2.7 4.5.3-2.6 1.2-4.8 2.7-6.6 1 1.7 1.4 3.8 1.1 6.1 1-1.3 2.3-2 4-2 0 3.1-2.8 5.5-7 5.5Z"/><path d="M5 20h14"/>',
      compass: '<circle cx="12" cy="12" r="8"/><path d="m14.8 9.2-1.5 4.1-4.1 1.5 1.5-4.1 4.1-1.5Z"/>',
      person: '<circle cx="12" cy="8" r="3.2"/><path d="M5.5 19.2c.7-3.5 3.2-5.3 6.5-5.3s5.8 1.8 6.5 5.3"/>',
      bag: '<path d="M6.5 8.5h11l1 10.5h-13l1-10.5Z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>',
      shop: '<path d="M4 10h16l-2-5H6l-2 5Z"/><path d="M5 10v9h14v-9"/><path d="M9 19v-5h6v5"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>',
      arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
      check: '<path d="m5 12.5 4.2 4L19 6.5"/>',
      sword: '<path d="m14 4 6 6-8.5 8.5-6-6L14 4Z"/><path d="m6.5 13.5-2 6 6-2"/><path d="m12 8 4 4"/>',
      coin: '<circle cx="12" cy="12" r="7.5"/><path d="M9 9h6v6H9z"/>',
      calendar: '<rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 10h16M8 3.5v4M16 3.5v4"/>',
      spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
      heart: '<path d="M12 20s-7-4.4-7-9.2C5 8 7 6 9.4 6c1.2 0 2.1.5 2.6 1.2C12.5 6.5 13.4 6 14.6 6 17 6 19 8 19 10.8 19 15.6 12 20 12 20Z"/>',
      drop: '<path d="M12 3s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10Z"/>'
    };
    var p = paths[name] || paths.spark;
    return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  function inkArt(variant) {
    if (variant === 'landing') {
      return '<svg class="ink-art" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
        '<circle class="ink-sun" cx="700" cy="172" r="62"/>' +
        '<path class="range range-3" d="M0 706 148 596 274 664 396 538 540 656 674 586 812 682 952 598 1082 668 1200 610V900H0Z"/>' +
        '<path class="range range-2" d="M0 786 164 704 306 764 448 674 590 766 734 702 872 782 1022 712 1140 774 1200 742V900H0Z"/>' +
        '<path class="range range-1" d="M0 852 184 802 364 844 524 792 706 852 866 812 1046 862 1200 822V900H0Z"/>' +
        '<g class="mist"><ellipse cx="280" cy="760" rx="230" ry="24"/><ellipse cx="790" cy="812" rx="300" ry="26"/><ellipse cx="610" cy="690" rx="180" ry="13"/></g>' +
        '<g class="birds"><path d="M470 250c8-7 14-7 22 0M508 232c8-7 14-7 22 0M446 286c6-5 10-5 16 0"/></g>' +
        '</svg>';
    }
    return '<svg class="ink-art" viewBox="0 0 900 340" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      '<circle class="ink-sun" cx="620" cy="78" r="36"/>' +
      '<path class="range range-3" d="M0 286 108 216 172 246 262 172 324 214 412 142 505 232 596 180 690 242 790 190 900 252V340H0Z"/>' +
      '<path class="range range-2" d="M0 312 90 260 168 286 258 222 338 274 430 214 512 272 612 226 712 284 810 244 900 292V340H0Z"/>' +
      '<path class="range range-1" d="M0 330 132 300 230 318 356 286 468 316 592 292 704 320 824 298 900 318V340H0Z"/>' +
      '<g class="mist"><ellipse cx="170" cy="270" rx="150" ry="16"/><ellipse cx="640" cy="292" rx="190" ry="18"/><ellipse cx="450" cy="244" rx="120" ry="10"/></g>' +
      '<g class="birds"><path d="M604 112c6-5 10-5 16 0M626 104c6-5 10-5 16 0M570 96c5-4 8-4 13 0"/></g>' +
      '</svg>';
  }

  function screenHead(eyebrow, title, sub, glyph) {
    return '<header class="screen-head">' +
      '<div><p class="eyebrow">' + esc(eyebrow) + '</p><h1>' + esc(title) + '</h1>' +
      (sub ? '<p class="screen-sub">' + esc(sub) + '</p>' : '') + '</div>' +
      (glyph ? '<div class="head-glyph" aria-hidden="true">' + esc(glyph) + '</div>' : '') +
      '</header>';
  }

  function nextStageName(state) {
    var p = state.player;
    var info = E.stageInfo(state);
    if (info.isMax) return '大道尽头';
    if (info.isFinalLayer) return '飞升 · 需渡九霄雷劫';
    var realm = D.REALMS[p.realm];
    var labels = D.LAYER_LABELS[realm.layers];
    if (p.layer < realm.layers - 1) return realm.name + labels[p.layer + 1];
    var next = D.REALMS[p.realm + 1];
    if (!next) return '大道尽头';
    var nextLabels = D.LAYER_LABELS[next.layers];
    return next.name + nextLabels[0];
  }

  function currentQuote(state) {
    return D.QUOTES[state.stats.meditations % D.QUOTES.length];
  }

  /* ------------------------------------------------------------------ */
  /* 设置与主题                                                          */
  /* ------------------------------------------------------------------ */

  function applySettings() {
    var theme = UI.settings.theme === 'paper' ? 'paper' : 'night';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('reduce-motion', !UI.settings.motion);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'paper' ? '#efe7d5' : '#0b1210');
  }

  function loadSettings() {
    try {
      var raw = localStorage.getItem('yinian_ui_v1');
      if (raw) {
        var s = JSON.parse(raw);
        if (s.theme) UI.settings.theme = s.theme;
        if (typeof s.motion === 'boolean') UI.settings.motion = s.motion;
        if (typeof s.usePill === 'boolean') UI.settings.usePill = s.usePill;
      }
    } catch (e) { /* ignore */ }
    applySettings();
  }

  function saveSettings() {
    try { localStorage.setItem('yinian_ui_v1', JSON.stringify(UI.settings)); } catch (e) { /* ignore */ }
  }

  /* ------------------------------------------------------------------ */
  /* 提示                                                                */
  /* ------------------------------------------------------------------ */

  UI._toastTimers = [];
  UI._notifiedAchievements = {};

  UI.clearToasts = function () {
    UI._toastTimers.forEach(function (t) { clearTimeout(t); });
    UI._toastTimers = [];
    UI._notifiedAchievements = {};
    if (toastRoot) toastRoot.innerHTML = '';
  };

  UI.toast = function (text, tone) {
    if (!toastRoot) return;
    var el = document.createElement('div');
    el.className = 'toast' + (tone ? ' toast-' + tone : '');
    el.innerHTML = '<span class="toast-dot"></span><span>' + text + '</span>';
    toastRoot.appendChild(el);
    var removeTimer = setTimeout(function () {
      el.classList.add('out');
      var t = setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
      UI._toastTimers.push(t);
    }, tone === 'achievement' ? 4200 : 2800);
    UI._toastTimers.push(removeTimer);
    while (toastRoot.children.length > 2) toastRoot.removeChild(toastRoot.firstChild);
  };

  UI.notifyAchievements = function (before) {
    var s = UI.state;
    if (!s) return;
    var list = D.ACHIEVEMENTS.filter(function (a) {
      return s.achievements[a.id] && !before[a.id] && !UI._notifiedAchievements[a.id];
    });
    if (!list.length) return;
    list.forEach(function (a) { UI._notifiedAchievements[a.id] = true; });
    if (list.length > 2) {
      UI.toast('达成 ' + list.length + ' 项成就 · ' + list.slice(0, 2).map(function (a) { return esc(a.name); }).join('、') + ' 等', 'achievement');
      return;
    }
    list.forEach(function (a, i) {
      var t = setTimeout(function () {
        UI.toast('成就 · ' + esc(a.name), 'achievement');
      }, i * 450);
      UI._toastTimers.push(t);
    });
  };

  /* ------------------------------------------------------------------ */
  /* 标题页                                                              */
  /* ------------------------------------------------------------------ */

  function renderLanding() {
    var meta = E.getMeta();
    var hasSave = E.hasSave();
    var legacy = meta.ascensions > 0 ? '<div class="legacy-line">轮回印记 ×' + meta.ascensions + (meta.lastName ? ' · 前世道号「' + esc(meta.lastName) + '」' : '') + '</div>' : '';
    return '<div class="landing">' +
      '<div class="landing-art">' + inkArt('landing') + '</div>' +
      '<div class="landing-inner">' +
      '<div class="landing-seal" aria-hidden="true"><span>念</span></div>' +
      '<p class="landing-kicker">文字修仙 · 问道长生</p>' +
      '<h1 class="landing-title">一念长生</h1>' +
      '<p class="landing-sub">' + esc(D.SUBTITLE) + '</p>' +
      '<p class="landing-quote">' + esc(D.QUOTES[0]) + '</p>' +
      legacy +
      '<div class="landing-actions">' +
      (hasSave ? '<button class="btn btn-primary btn-lg" data-action="continue">' + icon('arrow') + '继续修行</button>' : '') +
      '<button class="btn ' + (hasSave ? 'btn-ghost' : 'btn-primary') + ' btn-lg" data-action="new-game">' + (hasSave ? '重入轮回' : '踏入仙途') + '</button>' +
      '</div>' +
      '<div class="landing-features">' +
      '<span>打坐炼气</span><i></i><span>历练奇遇</span><i></i><span>突破境界</span><i></i><span>羽化飞升</span>' +
      '</div>' +
      '<p class="landing-foot">本地存档 · 无需联网 · 适配手机</p>' +
      '</div>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* 角色创建                                                            */
  /* ------------------------------------------------------------------ */

  UI.newCreation = function () {
    return {
      step: 0,
      name: E.randomName(),
      root: 'fire',
      origin: 'orphan',
      daoheart: 'longevity'
    };
  };

  function creationDots(step) {
    var out = '<div class="step-dots" aria-label="第 ' + (step + 1) + ' 步，共 3 步">';
    for (var i = 0; i < 3; i++) out += '<i class="' + (i === step ? 'on' : (i < step ? 'done' : '')) + '"></i>';
    return out + '</div>';
  }

  function optionCard(kind, value, selected, glyph, name, desc, bonus) {
    return '<button class="option-card' + (selected ? ' selected' : '') + '" data-action="select-' + kind + '" data-value="' + esc(value) + '" aria-pressed="' + (selected ? 'true' : 'false') + '">' +
      '<span class="option-glyph">' + esc(glyph) + '</span>' +
      '<span class="option-body"><b>' + esc(name) + '</b><small>' + esc(desc) + '</small>' +
      '<em>' + esc(bonus) + '</em></span>' +
      '<span class="option-check">' + (selected ? icon('check') : '') + '</span>' +
      '</button>';
  }

  function renderCreation() {
    var c = UI.creation;
    var meta = E.getMeta();
    var body = '';
    if (c.step === 0) {
      body = '<div class="form-block">' +
        '<label class="field-label" for="daohao">道号</label>' +
        '<div class="name-row"><input id="daohao" class="name-input" data-name-input maxlength="8" autocomplete="off" value="' + esc(c.name) + '" placeholder="取一个道号">' +
        '<button class="btn btn-ghost btn-sm" data-action="random-name">换一个</button></div>' +
        '<p class="field-hint">最多八字。名字只是一个称呼，路要自己走。</p>' +
        '</div>' +
        '<div class="form-block"><span class="field-label">出身</span><div class="option-list">' +
        Object.keys(D.ORIGINS).map(function (k) {
          var o = D.ORIGINS[k];
          return optionCard('origin', k, c.origin === k, o.glyph, o.name, o.desc, o.bonusText);
        }).join('') + '</div></div>';
    } else if (c.step === 1) {
      body = '<div class="form-block"><span class="field-label">灵根</span>' +
        '<p class="field-hint">灵根决定你与哪一种天地灵气的亲和。五行无高下，只有合不合你。</p>' +
        '<div class="option-list root-list">' +
        ['metal', 'wood', 'water', 'fire', 'earth'].map(function (k) {
          var o = D.ROOTS[k];
          return optionCard('root', k, c.root === k, o.glyph, o.name, o.desc, o.bonusText);
        }).join('') + '</div></div>';
    } else {
      var root = D.ROOTS[c.root], origin = D.ORIGINS[c.origin], heart = D.DAOHEARTS[c.daoheart];
      body = '<div class="form-block"><span class="field-label">道心</span>' +
        '<p class="field-hint">你为何修行？这个答案会在很多个关口替你做决定。</p>' +
        '<div class="option-list">' +
        Object.keys(D.DAOHEARTS).map(function (k) {
          var o = D.DAOHEARTS[k];
          return optionCard('daoheart', k, c.daoheart === k, o.glyph, o.name, o.desc, o.bonusText);
        }).join('') + '</div></div>' +
        '<div class="creation-summary panel">' +
        '<div class="summary-head"><span class="summary-seal">' + esc((c.name || '无名').charAt(0)) + '</span><div><b>' + esc(c.name || '无名') + '</b><small>' + esc(root.name) + ' · ' + esc(origin.name) + ' · ' + esc(heart.name) + '</small></div></div>' +
        '<div class="summary-grid">' +
        '<div><span>灵根</span><b>' + esc(root.name) + '</b></div>' +
        '<div><span>出身</span><b>' + esc(origin.name) + '</b></div>' +
        '<div><span>道心</span><b>' + esc(heart.name) + '</b></div>' +
        '<div><span>初始寿元</span><b>' + (80 + (heart.mods.life || 0)) + ' 年</b></div>' +
        '</div>' +
        (meta.ascensions > 0 ? '<p class="legacy-note">轮回印记：悟性 +' + Math.min(9, meta.ascensions) + ' · 气运 +' + Math.min(9, meta.ascensions) + ' · 灵石 +' + (50 * Math.min(9, meta.ascensions)) + '</p>' : '') +
        '</div>';
    }

    return '<div class="creation-screen">' +
      '<div class="creation-art">' + inkArt('landing') + '</div>' +
      '<div class="creation-inner">' +
      '<header class="creation-head">' +
      '<button class="btn btn-quiet btn-sm" data-action="creation-back">' + (c.step === 0 ? '返回标题' : '上一步') + '</button>' +
      creationDots(c.step) +
      '<span class="creation-step">' + ['出身', '灵根', '道心'][c.step] + '</span>' +
      '</header>' +
      '<div class="creation-title"><p class="eyebrow">问心 · 第一步</p><h1>' + ['你是谁', '你从何处来', '你往何处去'][c.step] + '</h1></div>' +
      '<div class="creation-body">' + body + '</div>' +
      '<footer class="creation-actions">' +
      (c.step < 2
        ? '<button class="btn btn-primary btn-wide" data-action="creation-next">下一步 ' + icon('arrow') + '</button>'
        : '<button class="btn btn-primary btn-wide" data-action="start-game">' + icon('spark') + '踏入仙途</button>') +
      '</footer>' +
      '</div>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* 游戏主界面                                                          */
  /* ------------------------------------------------------------------ */

  function navButton(item, active) {
    return '<button class="nav-btn' + (active ? ' active' : '') + '" data-action="nav" data-screen="' + item.id + '"' +
      (active ? ' aria-current="page"' : '') + '>' + icon(item.icon) + '<span>' + item.label + '</span></button>';
  }

  function renderTopbar() {
    var s = UI.state;
    var date = E.dateInfo(s);
    return '<header class="topbar"><div class="topbar-inner">' +
      '<div class="brand"><span class="brand-seal">念</span><span class="brand-text"><b>一念长生</b><small>文字修仙</small></span></div>' +
      '<div class="top-meta">' +
      '<span class="chip chip-date">' + icon('calendar') + esc(date.label) + '</span>' +
      '<span class="chip chip-stone">' + icon('coin') + '<b>' + fmt(s.player.stones) + '</b> 灵石</span>' +
      '<button class="icon-btn" data-action="settings" aria-label="设置">' + icon('settings') + '</button>' +
      '</div></div></header>';
  }

  function renderCharacterPanel() {
    var s = UI.state;
    var p = s.player;
    var d = E.derived(s);
    var need = E.expNeed(s);
    var info = E.stageInfo(s);
    var root = D.ROOTS[p.root] || D.ROOTS.fire;
    var origin = D.ORIGINS[p.origin] || D.ORIGINS.orphan;
    var full = p.exp >= need;
    return '<aside class="sidebar">' +
      '<section class="panel char-card">' +
      '<div class="char-head">' +
      '<div class="avatar" aria-hidden="true"><span>' + esc(p.name.charAt(0)) + '</span><i>' + esc(root.glyph) + '</i></div>' +
      '<div class="char-id"><h2>' + esc(p.name) + '</h2>' +
      '<p class="realm-line">' + esc(info.name) + (full ? ' <span class="ready-mark">可突破</span>' : '') + '</p>' +
      '<p class="char-sub">寿 ' + E.age(s) + '/' + fmt(p.lifespan) + ' · ' + esc(root.name) + ' · ' + esc(origin.name) + '</p></div>' +
      '</div>' +
      '<div class="vitals">' +
      barRow('修为', p.exp, need, 'exp') +
      barRow('气血', p.hp, d.hpMax, 'hp') +
      barRow('灵力', p.mp, d.mpMax, 'mp') +
      '</div>' +
      '<div class="stat-grid">' +
      '<div><span>攻击</span><b>' + fmt(d.atk) + '</b></div>' +
      '<div><span>防御</span><b>' + fmt(d.def) + '</b></div>' +
      '<div><span>神识</span><b>' + fmt(d.sense) + '</b></div>' +
      '<div><span>悟性</span><b>' + fmt(d.comp) + '</b></div>' +
      '<div><span>气运</span><b>' + fmt(d.luck) + '</b></div>' +
      '<div><span>寿元</span><b>' + E.age(s) + '/' + fmt(p.lifespan) + '</b></div>' +
      '</div>' +
      '<div class="char-foot"><span>' + icon('spark') + '修炼速度 ' + pct(d.rate) + '% / 月</span><span>' + icon('heart') + '疗伤 +' + pct(d.heal) + '%</span></div>' +
      '</section>' +
      '<nav class="side-nav" aria-label="主导航">' + D.UI.nav.map(function (n) { return navButton(n, UI.screen === n.id); }).join('') + '</nav>' +
      '</aside>';
  }

  function renderBottomNav() {
    return '<nav class="bottom-nav" aria-label="主导航">' +
      D.UI.nav.map(function (n) { return navButton(n, UI.screen === n.id); }).join('') +
      '</nav>';
  }

  /* ------------------------------------------------------------------ */
  /* 修炼                                                                */
  /* ------------------------------------------------------------------ */

  function renderEndedScreen() {
    var s = UI.state;
    var ascended = s.ended === 'ascended';
    return '<div class="screen">' +
      screenHead(ascended ? '此世 · 圆满' : '此世 · 终章', ascended ? '羽化飞升' : '坐化', ascended ? '云海之上，再无归途。' : '尘缘已尽，道途止于此。', ascended ? '仙' : '寂') +
      '<section class="panel ended-panel">' +
      '<p class="ended-text">' + (ascended
        ? '你已渡过九霄雷劫，踏碎最后一道壁障。人间从此少了一个修士，天上多了一位仙人。'
        : '你在蒲团上闭上眼，这一世的长生路到此为止。留下的，只有山中一段传闻。') + '</p>' +
      '<div class="modal-actions">' +
      '<button class="btn btn-primary" data-action="show-ending">回望此生</button>' +
      '<button class="btn btn-ghost" data-action="reincarnate">转世重修</button>' +
      '</div></section></div>';
  }

  function renderCultivate() {
    var s = UI.state;
    if (s.ended) return renderEndedScreen();
    var p = s.player;
    var d = E.derived(s);
    var need = E.expNeed(s);
    var info = E.stageInfo(s);
    var full = p.exp >= need;
    var gain = Math.max(1, Math.round(need * d.rate));
    var closedGain = Math.max(1, Math.round(need * d.rate * 6 * 0.72));
    var chance = E.breakthroughChance(s, UI.settings.usePill);
    var pillCount = E.countItem(s, 'pojing');
    var tech = d.technique;
    var skill = d.skill;

    var headHtml = screenHead('静室 · 吐纳', '修行', '山中无甲子，寒尽不知年。', '修');
    var heroPanel = '<section class="panel hero">' + inkArt() +
      '<div class="hero-content"><p class="eyebrow">' + esc(info.realm.name) + ' · ' + esc(info.layerLabel || '圆满') + '</p>' +
      '<h2>' + (full ? '气机圆满，壁障在前' : '呼吸之间，天地渐宽') + '</h2>' +
      '<p class="hero-quote">' + esc(currentQuote(s)) + '</p>' +
      '<div class="hero-meta"><span>修为 ' + fmt(p.exp) + ' / ' + fmt(need) + '</span><span>下一次突破 · ' + esc(nextStageName(s)) + '</span></div></div>' +
      '</section>';

    var actionsHtml = '<div class="action-grid">' +
      '<button class="action-btn primary" data-action="meditate"' + (full ? ' disabled' : '') + '>' +
      '<span class="action-icon">' + icon('lotus') + '</span>' +
      '<span class="action-body"><b>打坐一月</b><small>' + (full ? '修为已满，先冲关' : '收束心神，吐纳灵气') + '</small></span>' +
      '<span class="action-meta">' + (full ? '—' : '+' + fmt(gain) + ' 修为') + '<i>耗时 1 月</i></span>' +
      '</button>' +
      '<button class="action-btn" data-action="closed"' + (full ? ' disabled' : '') + '>' +
      '<span class="action-icon">' + icon('spark') + '</span>' +
      '<span class="action-body"><b>闭关六月</b><small>' + (full ? '修为已满，先冲关' : '封门静修，进境更快，亦有心魔') + '</small></span>' +
      '<span class="action-meta">' + (full ? '—' : '+' + fmt(closedGain) + ' 修为') + '<i>耗时 6 月</i></span>' +
      '</button>' +
      '</div>';

    var breakHtml = '<section class="panel break-card' + (full ? ' ready' : '') + '" id="breakthrough-card">' +
      '<div class="panel-head"><div><p class="eyebrow">冲关</p><h3>突破壁障</h3></div>' + (full ? '<span class="badge badge-gold">时机已至</span>' : '<span class="badge">修为未满</span>') + '</div>' +
      '<p class="panel-text">' + (full
        ? (info.isFinalLayer ? '你已站在渡劫期的尽头。头顶雷云汇聚，天门若隐若现。' : '丹田中的灵气已经满溢，只差最后一步，便能踏入「' + esc(nextStageName(s)) + '」。')
        : '再积攒 ' + fmt(need - p.exp) + ' 点修为，便可尝试冲关。') + '</p>' +
      (full ? '' : '<div class="break-progress">' + barRow('修为进度', p.exp, need, 'exp') + '</div>') +
      (full ? '<div class="break-row">' +
        '<div class="chance-box"><span>成功率</span><b>' + pct(chance) + '%</b>' + (p.breakthroughBuff > 0 ? '<small>（含失败心得 +' + pct(p.breakthroughBuff) + '%）</small>' : '') + '</div>' +
        (pillCount > 0 ? '<label class="check-line"><input type="checkbox" data-action="toggle-pill" ' + (UI.settings.usePill ? 'checked' : '') + '> 服用破境丹 <em>+25% · 余 ' + pillCount + '</em></label>' : '<span class="muted-note">坊市有售破境丹，可提升成功率。</span>') +
        '<button class="btn btn-primary" data-action="breakthrough">' + (info.isFinalLayer ? '渡劫飞升' : '冲关突破') + '</button>' +
        '</div>' : '') +
      '</section>';

    var restHtml = '<div class="grid-2">' +
      '<section class="panel compact">' +
      '<div class="panel-head"><div><p class="eyebrow">功法</p><h3>' + esc(tech.name) + '</h3></div><span class="glyph-badge">' + esc(tech.glyph) + '</span></div>' +
      '<p class="panel-text">' + esc(tech.desc) + '</p>' +
      '<div class="mini-list"><span>修炼速度 <b>+' + pct(tech.cult) + '%</b></span>' + (modsText(tech.mods) ? '<span>' + esc(modsText(tech.mods)) + '</span>' : '') + '</div>' +
      (skill ? '<div class="skill-line"><span>' + icon('sword') + ' ' + esc(skill.name) + '</span><span>灵力 ' + skill.cost + '</span></div>' : '') +
      '<button class="btn btn-ghost btn-sm" data-action="nav" data-screen="character" data-tab="skills">查看功法</button>' +
      '</section>' +
      '<section class="panel compact">' +
      '<div class="panel-head"><div><p class="eyebrow">道基</p><h3>此身根本</h3></div><span class="glyph-badge">' + esc(D.ROOTS[p.root].glyph) + '</span></div>' +
      '<div class="detail-rows">' +
      '<div><span>灵根</span><b>' + esc(D.ROOTS[p.root].name) + '</b></div>' +
      '<div><span>道心</span><b>' + esc(D.DAOHEARTS[p.daoheart].name) + '</b></div>' +
      '<div><span>年岁</span><b>' + E.age(s) + ' / ' + fmt(p.lifespan) + ' 岁</b></div>' +
      '<div><span>暴击</span><b>' + pct(d.crit) + '%</b></div>' +
      '</div>' +
      '<button class="btn btn-ghost btn-sm" data-action="nav" data-screen="character">查看详情</button>' +
      '</section>' +
      '</div>' +
      '<section class="panel">' +
      '<div class="panel-head"><div><p class="eyebrow">近事</p><h3>山中纪事</h3></div><button class="text-btn" data-action="nav" data-screen="character" data-tab="journal">全部</button></div>' +
      renderLog(5) +
      '</section>';

    return '<div class="screen">' + headHtml +
      (full ? breakHtml + heroPanel + actionsHtml : heroPanel + actionsHtml + breakHtml) +
      restHtml + '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* 历练                                                                */
  /* ------------------------------------------------------------------ */

  function renderExplore() {
    var s = UI.state;
    var p = s.player;
    var regions = D.REGIONS;
    var cards = regions.map(function (r) {
      var locked = p.realm < r.unlockRealm;
      var unlockName = D.REALMS[r.unlockRealm].name;
      return '<article class="region-card' + (locked ? ' locked' : '') + '">' +
        '<span class="region-glyph" aria-hidden="true">' + esc(r.glyph) + '</span>' +
        '<div class="region-top"><div><h3>' + esc(r.name) + '</h3><p class="region-sub">' + dangerDots(r.danger) + '<span>危险 ' + r.danger + ' / 4</span></p></div>' +
        (locked ? '<span class="badge">' + esc(unlockName) + '解锁</span>' : '<span class="badge badge-jade">可前往</span>') + '</div>' +
        '<p class="region-desc">' + esc(r.desc) + '</p>' +
        '<div class="region-foot"><span>耗时 ' + r.cost + ' 月</span>' +
        (locked ? '<button class="btn btn-ghost btn-sm" disabled>修为不足</button>' : '<button class="btn btn-primary btn-sm" data-action="explore" data-region="' + r.id + '">前往历练</button>') + '</div>' +
        '</article>';
    }).join('');

    return '<div class="screen">' +
      screenHead('山河 · 机缘', '历练', '山高水长，机缘与凶险往往结伴而行。', '历') +
      '<section class="panel intro-panel"><p class="panel-text">每一次历练都会消耗时间，也可能遇见奇遇、妖物或故人。修为越高，能去的地方越远。</p>' +
      '<div class="legend-row"><span>' + dangerDots(1) + ' 安稳</span><span>' + dangerDots(2) + ' 有险</span><span>' + dangerDots(3) + ' 凶险</span><span>' + dangerDots(4) + ' 九死一生</span></div></section>' +
      '<div class="region-grid">' + cards + '</div>' +
      '<section class="panel">' +
      '<div class="panel-head"><div><p class="eyebrow">见闻</p><h3>近来行迹</h3></div><button class="text-btn" data-action="nav" data-screen="character" data-tab="journal">全部</button></div>' +
      renderLog(8) +
      '</section>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* 人物                                                                */
  /* ------------------------------------------------------------------ */

  function renderCharacter() {
    var s = UI.state;
    var p = s.player;
    var d = E.derived(s);
    var info = E.stageInfo(s);
    var tabs = [['stats', '属性'], ['skills', '功法'], ['achievements', '成就'], ['journal', '见闻']];
    var tabBar = '<div class="tabs" role="tablist">' + tabs.map(function (t) {
      return '<button role="tab" aria-selected="' + (UI.charTab === t[0]) + '" class="' + (UI.charTab === t[0] ? 'on' : '') + '" data-action="char-tab" data-tab="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div>';

    var body = '';
    if (UI.charTab === 'stats') {
      var slots = [['weapon', '兵器'], ['armor', '护身'], ['accessory', '灵饰']];
      body = '<div class="grid-2">' +
        '<section class="panel"><div class="panel-head"><div><p class="eyebrow">根骨</p><h3>属性</h3></div><span class="badge badge-gold">' + esc(info.name) + '</span></div>' +
        '<div class="stat-cards">' +
        '<div><span>气血</span><b>' + fmt(p.hp) + '<small> / ' + fmt(d.hpMax) + '</small></b></div>' +
        '<div><span>灵力</span><b>' + fmt(p.mp) + '<small> / ' + fmt(d.mpMax) + '</small></b></div>' +
        '<div><span>攻击</span><b>' + fmt(d.atk) + '</b></div>' +
        '<div><span>防御</span><b>' + fmt(d.def) + '</b></div>' +
        '<div><span>神识</span><b>' + fmt(d.sense) + '</b></div>' +
        '<div><span>悟性</span><b>' + fmt(d.comp) + '</b></div>' +
        '<div><span>气运</span><b>' + fmt(d.luck) + '</b></div>' +
        '<div><span>暴击</span><b>' + pct(d.crit) + '%</b></div>' +
        '</div></section>' +
        '<section class="panel"><div class="panel-head"><div><p class="eyebrow">来处</p><h3>此身</h3></div></div>' +
        '<div class="detail-rows">' +
        '<div><span>灵根</span><b>' + esc(D.ROOTS[p.root].name) + '</b></div>' +
        '<div><span>出身</span><b>' + esc(D.ORIGINS[p.origin].name) + '</b></div>' +
        '<div><span>道心</span><b>' + esc(D.DAOHEARTS[p.daoheart].name) + '</b></div>' +
        '<div><span>年岁 / 寿元</span><b>' + E.age(s) + ' / ' + fmt(p.lifespan) + '</b></div>' +
        '<div><span>修炼速度</span><b>' + pct(d.rate) + '% / 月</b></div>' +
        '<div><span>疗伤加成</span><b>+' + pct(d.heal) + '%</b></div>' +
        '<div><span>战斗收益</span><b>+' + pct(d.battleReward) + '%</b></div>' +
        '<div><span>炼丹加成</span><b>+' + pct(d.alchemy) + '%</b></div>' +
        '</div></section>' +
        '</div>' +
        '<section class="panel"><div class="panel-head"><div><p class="eyebrow">法器</p><h3>随身之物</h3></div></div>' +
        '<div class="equip-grid">' +
        slots.map(function (sl) {
          var id = p.equipment[sl[0]];
          if (!id) return '<div class="equip-slot empty"><span class="slot-label">' + sl[1] + '</span><b>空</b><small>可在行囊中装备</small></div>';
          var item = D.ITEMS[id];
          return '<div class="equip-slot r' + item.rarity + '"><span class="slot-label">' + sl[1] + '</span><div class="equip-line"><span class="item-glyph">' + esc(item.glyph) + '</span><div><b>' + esc(item.name) + '</b><small>' + esc(modsText(item.mods)) + '</small></div></div><button class="text-btn" data-action="unequip" data-slot="' + sl[0] + '">取下</button></div>';
        }).join('') + '</div></section>';
    } else if (UI.charTab === 'skills') {
      var learned = p.learned.map(function (id) {
        var t = D.TECHNIQUES[id];
        var sk = D.SKILLS[t.skill];
        var equipped = p.technique === id;
        return '<div class="tech-card' + (equipped ? ' equipped' : '') + '">' +
          '<span class="tech-glyph">' + esc(t.glyph) + '</span>' +
          '<div class="tech-body"><div class="tech-top"><b>' + esc(t.name) + '</b><span class="rarity r' + t.rarity + '">' + rarityName(t.rarity) + '</span>' + (equipped ? '<span class="badge badge-gold">修习中</span>' : '') + '</div>' +
          '<p>' + esc(t.desc) + '</p>' +
          '<div class="tech-meta"><span>修炼 +' + pct(t.cult) + '%</span>' + (modsText(t.mods) ? '<span>' + esc(modsText(t.mods)) + '</span>' : '') + '<span>术法「' + esc(sk.name) + '」</span></div></div>' +
          (equipped ? '<span class="equipped-mark">' + icon('check') + '</span>' : '<button class="btn btn-ghost btn-sm" data-action="equip-tech" data-id="' + id + '">修习</button>') +
          '</div>';
      }).join('');
      body = '<section class="panel"><div class="panel-head"><div><p class="eyebrow">法门</p><h3>已悟功法</h3></div><span class="badge">' + p.learned.length + ' 门</span></div>' +
        '<p class="panel-text">同一时间只能修习一门功法，但所学皆在。坊市中常有前人遗落的法门出售。</p>' +
        '<div class="tech-list">' + learned + '</div></section>';
    } else if (UI.charTab === 'achievements') {
      var unlocked = Object.keys(s.achievements).length;
      body = '<section class="panel"><div class="panel-head"><div><p class="eyebrow">道途</p><h3>成就</h3></div><span class="badge badge-gold">' + unlocked + ' / ' + D.ACHIEVEMENTS.length + '</span></div>' +
        '<p class="panel-text">这些不是终点，只是路上留下的记号。</p>' +
        '<div class="ach-grid">' + D.ACHIEVEMENTS.map(function (a) {
          var on = !!s.achievements[a.id];
          return '<div class="ach-card' + (on ? ' on' : '') + '"><span class="ach-mark">' + (on ? icon('check') : '·') + '</span><div><b>' + esc(a.name) + '</b><p>' + esc(a.desc) + '</p>' + (on ? '<small class="ach-reward">已达成</small>' : '<small>未达成</small>') + '</div></div>';
        }).join('') + '</div></section>';
    } else {
      body = '<section class="panel"><div class="panel-head"><div><p class="eyebrow">行迹</p><h3>见闻录</h3></div><span class="badge">' + s.journal.length + ' 条</span></div>' +
        renderLog(80, true) + '</section>';
    }

    return '<div class="screen">' + screenHead('此身 · 此心', '人物', '修行先修心，知己方能知天地。', '人') + tabBar + body + '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* 行囊                                                                */
  /* ------------------------------------------------------------------ */

  function renderInventory() {
    var s = UI.state;
    var p = s.player;
    var tabs = '<div class="tabs">' +
      '<button class="' + (UI.invTab === 'items' ? 'on' : '') + '" data-action="inv-tab" data-tab="items">物品</button>' +
      '<button class="' + (UI.invTab === 'alchemy' ? 'on' : '') + '" data-action="inv-tab" data-tab="alchemy">炼丹</button>' +
      '</div>';

    if (UI.invTab === 'alchemy') {
      var recipes = D.RECIPES.map(function (r) {
        var missing = false;
        var mats = Object.keys(r.mats).map(function (id) {
          var have = E.countItem(s, id);
          if (have < r.mats[id]) missing = true;
          return '<span class="' + (have >= r.mats[id] ? 'have' : 'lack') + '">' + esc(D.ITEMS[id].name) + ' ' + have + '/' + r.mats[id] + '</span>';
        }).join('');
        return '<div class="recipe-card' + (missing ? ' missing' : '') + '">' +
          '<div class="recipe-top"><div><b>' + esc(r.name) + '</b><small>' + esc(r.desc) + '</small></div><span class="chance-chip">成功率 ' + pct(E.craftChance(s, r)) + '%</span></div>' +
          '<div class="recipe-mats">' + mats + '</div>' +
          '<div class="recipe-foot"><span>耗时 1 月 · 失败会炸炉</span><button class="btn btn-ghost btn-sm" data-action="craft" data-id="' + r.id + '" ' + (missing ? 'disabled' : '') + '>开炉炼丹</button></div>' +
          '</div>';
      }).join('');
      return '<div class="screen">' + screenHead('丹炉 · 火候', '炼丹', '药有君臣佐使，火有文武先后。', '丹') + tabs +
        '<section class="panel"><div class="panel-head"><div><p class="eyebrow">丹方</p><h3>炉中乾坤</h3></div><span class="badge">' + s.stats.crafts + ' 炉已成</span></div>' +
        '<p class="panel-text">材料多从历练中得来。悟性越高、火灵根越纯，成丹率越高。</p>' +
        '<div class="recipe-list">' + recipes + '</div></section></div>';
    }

    var filters = [['all', '全部'], ['pill', '丹药'], ['material', '材料'], ['equip', '装备']];
    var filterBar = '<div class="filter-row">' + filters.map(function (f) {
      return '<button class="filter-chip' + (UI.invFilter === f[0] ? ' on' : '') + '" data-action="inv-filter" data-filter="' + f[0] + '">' + f[1] + '</button>';
    }).join('') + '</div>';

    var slots = [['weapon', '兵器'], ['armor', '护身'], ['accessory', '灵饰']];
    var equipped = '<div class="equipped-row">' + slots.map(function (sl) {
      var id = p.equipment[sl[0]];
      if (!id) return '<div class="equipped-mini empty"><span>' + sl[1] + '</span><b>空</b></div>';
      var item = D.ITEMS[id];
      return '<div class="equipped-mini r' + item.rarity + '"><span>' + sl[1] + '</span><b>' + esc(item.name) + '</b><button class="text-btn" data-action="unequip" data-slot="' + sl[0] + '">取下</button></div>';
    }).join('') + '</div>';

    var items = p.inventory.filter(function (entry) {
      if (UI.invFilter === 'all') return true;
      var it = D.ITEMS[entry.id];
      return it && it.type === UI.invFilter;
    });

    items.sort(function (a, b) {
      var ia = D.ITEMS[a.id], ib = D.ITEMS[b.id];
      if (ia.type !== ib.type) return ia.type.localeCompare(ib.type);
      return ib.rarity - ia.rarity;
    });

    var itemList = items.length ? items.map(function (entry, idx) {
      var it = D.ITEMS[entry.id];
      if (!it) return '';
      var actions = '';
      if (it.type === 'pill') actions += '<button class="btn btn-primary btn-xs" data-action="use-item" data-id="' + it.id + '">服用</button>';
      if (it.type === 'equip') actions += '<button class="btn btn-primary btn-xs" data-action="equip-item" data-id="' + it.id + '">装备</button>';
      actions += '<button class="btn btn-ghost btn-xs" data-action="sell-item" data-id="' + it.id + '">出售 ' + fmt(E.sellPrice(s, it)) + '</button>';
      return '<div class="item-card r' + it.rarity + '">' +
        '<span class="item-glyph">' + esc(it.glyph) + '</span>' +
        '<div class="item-body"><div class="item-top"><b>' + esc(it.name) + '</b><span class="rarity r' + it.rarity + '">' + rarityName(it.rarity) + '</span><span class="qty">×' + entry.qty + '</span></div>' +
        '<p>' + esc(it.desc || '') + '</p>' +
        (it.mods ? '<small class="mods-line">' + esc(modsText(it.mods)) + '</small>' : '') +
        '<div class="item-actions">' + actions + '</div></div></div>';
    }).join('') : '<div class="empty-state">行囊空空。去山里走走吧。<br><button class="btn btn-ghost btn-sm" data-action="nav" data-screen="explore">前往历练</button></div>';

    return '<div class="screen">' + screenHead('行囊 · 器物', '行囊', '一饮一啄，皆是机缘。', '囊') + tabs +
      '<section class="panel"><div class="panel-head"><div><p class="eyebrow">随身</p><h3>已装备</h3></div></div>' + equipped + '</section>' +
      '<section class="panel"><div class="panel-head"><div><p class="eyebrow">百物</p><h3>行囊</h3></div><span class="badge">' + p.inventory.length + ' 种</span></div>' +
      filterBar + '<div class="item-list">' + itemList + '</div></section></div>';
  }

  /* ------------------------------------------------------------------ */
  /* 坊市                                                                */
  /* ------------------------------------------------------------------ */

  function renderMarket() {
    var s = UI.state;
    var p = s.player;
    E.ensureMarket(s);
    var refreshCost = Math.round(30 * Math.pow(1.6, p.realm));
    var stock = s.world.stock.map(function (entry, idx) {
      var isTech = entry.kind === 'tech';
      var it = isTech ? D.TECHNIQUES[entry.itemId] : D.ITEMS[entry.itemId];
      if (!it) return '';
      var rarity = it.rarity || 0;
      var kindLabel = isTech ? '功法' : (it.type === 'pill' ? '丹药' : it.type === 'equip' ? '法器' : '材料');
      var desc = isTech ? it.desc : it.desc;
      var sub = isTech ? '修炼 +' + pct(it.cult) + '%' : (it.mods ? modsText(it.mods) : '');
      return '<div class="market-card r' + rarity + (entry.sold ? ' sold' : '') + '">' +
        '<span class="item-glyph">' + esc(it.glyph) + '</span>' +
        '<div class="market-body"><div class="item-top"><b>' + esc(it.name) + '</b><span class="rarity r' + rarity + '">' + rarityName(rarity) + '</span><span class="kind-chip">' + kindLabel + '</span></div>' +
        '<p>' + esc(desc || '') + '</p>' +
        (sub ? '<small class="mods-line">' + esc(sub) + '</small>' : '') +
        '</div>' +
        '<div class="market-buy"><span class="price">' + icon('coin') + fmt(entry.price) + '</span>' +
        (entry.sold ? '<span class="sold-mark">已售出</span>' : '<button class="btn btn-primary btn-xs" data-action="buy" data-index="' + idx + '">购入</button>') + '</div>' +
        '</div>';
    }).join('');

    return '<div class="screen">' + screenHead('坊市 · 交易', '坊市', '人来人往，买的是货，卖的是命。', '市') +
      '<section class="panel market-head"><div><p class="eyebrow">山脚坊市</p><h3>今日货架</h3><p class="panel-text">每过三月自动换一批货。价格随境界水涨船高，卖价约为售价的三成五。</p></div>' +
      '<div class="market-actions"><span class="stone-balance">' + icon('coin') + '<b>' + fmt(p.stones) + '</b> 灵石</span>' +
      '<button class="btn btn-ghost btn-sm" data-action="refresh-market">刷新货架 · ' + fmt(refreshCost) + ' 灵石</button></div></section>' +
      '<div class="market-list">' + stock + '</div>' +
      '<section class="panel market-foot"><p class="panel-text">想出售行囊中的材料与旧物？回到行囊，每件物品下方都有出售按钮。</p>' +
      '<button class="btn btn-ghost btn-sm" data-action="nav" data-screen="inventory">打开行囊</button></section></div>';
  }

  /* ------------------------------------------------------------------ */
  /* 日志                                                                */
  /* ------------------------------------------------------------------ */

  function renderLog(limit, full) {
    var s = UI.state;
    var entries = s.journal.slice(0, limit || 5);
    if (!entries.length) return '<div class="empty-state">尚无记载。</div>';
    return '<div class="log' + (full ? ' log-full' : '') + '">' + entries.map(function (e) {
      return '<div class="log-item log-' + esc(e.type) + '"><div class="log-date">' + esc(e.date) + '</div><p>' + esc(e.text) + '</p></div>';
    }).join('') + '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* 主渲染                                                              */
  /* ------------------------------------------------------------------ */

  function renderGame() {
    var s = UI.state;
    if (s.ended) UI.screen = 'cultivate';
    var endedBanner = s.ended ? '<div class="ended-banner"><span>' + (s.ended === 'ascended' ? '此世已羽化飞升。' : '此世已尽，尘缘已了。') + '</span><button class="btn btn-primary btn-sm" data-action="show-ending">回望此生</button><button class="btn btn-ghost btn-sm" data-action="reincarnate">转世重修</button></div>' : '';
    return '<div class="game">' + renderTopbar() + endedBanner +
      '<div class="shell">' + renderCharacterPanel() +
      '<main id="screen">' + renderScreen() + '</main></div>' +
      renderBottomNav() + '</div>';
  }

  function renderScreen() {
    if (UI.state.ended) return renderEndedScreen();
    if (UI.screen === 'explore') return renderExplore();
    if (UI.screen === 'character') return renderCharacter();
    if (UI.screen === 'inventory') return renderInventory();
    if (UI.screen === 'market') return renderMarket();
    return renderCultivate();
  }

  UI.render = function () {
    if (UI.creation) {
      app.innerHTML = renderCreation();
      document.body.classList.add('is-landing');
    } else if (UI.state) {
      app.innerHTML = renderGame();
      document.body.classList.remove('is-landing');
      document.title = (D.UI.nav.find(function (n) { return n.id === UI.screen; }) || { label: '' }).label + ' · 一念长生';
    } else {
      app.innerHTML = renderLanding();
      document.body.classList.add('is-landing');
      document.title = '一念长生 · 文字修仙';
    }
    UI.renderModal();
  };

  UI.renderModal = function () { /* 由下方实现覆盖 */ };

  UI.showLanding = function () {
    UI.clearToasts();
    UI.state = null;
    UI.creation = null;
    UI.modal = null;
    UI.screen = 'cultivate';
    UI.render();
  };

  UI.persist = function (before) {
    if (!UI.state) return;
    var snapshot = before || Object.assign({}, UI.state.achievements);
    E.checkAchievements(UI.state);
    if (!E.save(UI.state)) UI.toast('存档失败：浏览器可能禁用了本地存储。', 'danger');
    UI.notifyAchievements(snapshot);
  };

  /* ------------------------------------------------------------------ */
  /* 弹窗基础                                                            */
  /* ------------------------------------------------------------------ */

  function modalHead(kicker, title, closable, extra) {
    return '<header class="modal-head"><div><p class="eyebrow">' + esc(kicker || '') + '</p><h2>' + esc(title) + '</h2></div>' +
      '<div class="modal-head-side">' + (extra || '') + (closable ? '<button class="icon-btn" data-action="close-modal" aria-label="关闭">' + icon('close') + '</button>' : '') + '</div></header>';
  }

  function modalFrame(cls, inner, opts) {
    opts = opts || {};
    return '<div class="modal-root">' +
      '<div class="modal-backdrop"' + (opts.closable ? ' data-action="close-modal"' : '') + '></div>' +
      '<div class="modal ' + (cls || '') + '" role="dialog" aria-modal="true" aria-label="' + esc(opts.label || '对话框') + '">' + inner + '</div>' +
      '</div>';
  }

  function statLabel(k) {
    return ({ comp: '悟性', sense: '神识', luck: '气运' })[k] || k;
  }

  /* ------------------------------------------------------------------ */
  /* 事件弹窗                                                            */
  /* ------------------------------------------------------------------ */

  function renderEventModal(m) {
    var s = UI.state;
    var ev = m.event;
    var region = m.region || {};
    var choices = ev.choices.map(function (c, i) {
      var avail = E.choiceAvailability(s, c);
      var chanceText = c.check ? statLabel(c.check.stat) + '检定 · ' + pct(E.checkChance(s, c.check)) + '%' : '';
      var hint = c.hint || '';
      return '<button class="choice" data-action="choose" data-index="' + i + '"' + (avail.ok ? '' : ' disabled') + '>' +
        '<span class="choice-main"><b>' + esc(c.label) + '</b>' +
        (hint ? '<small>' + esc(hint) + '</small>' : '') +
        (avail.ok ? '' : '<small class="choice-req">' + esc(avail.reason) + '</small>') +
        '</span>' +
        (chanceText ? '<span class="chance-chip">' + chanceText + '</span>' : '') +
        '<span class="choice-arrow">' + icon('arrow') + '</span>' +
        '</button>';
    }).join('');

    return modalFrame('event-modal', modalHead('奇遇 · ' + (region.name || '山野'), ev.name, true,
      '<span class="danger-chip">' + dangerDots(region.danger || 1) + '</span>') +
      '<div class="modal-body">' +
      '<p class="event-text">' + esc(ev.text) + '</p>' +
      '<div class="choice-list">' + choices + '</div>' +
      '<p class="modal-note">每一次选择都会留下痕迹。</p>' +
      '</div>', { closable: true, label: ev.name });
  }

  function renderEventResultModal(m) {
    var res = m.result;
    var checked = '';
    if (res.checked) {
      checked = '<span class="check-result ' + (res.success ? 'ok' : 'bad') + '">' + (res.success ? '检定成功' : '检定失败') + ' · ' + pct(res.chance) + '%</span>';
    }
    var gains = (res.gains && res.gains.length)
      ? '<div class="gains">' + res.gains.map(function (g) { return '<span class="gain-chip">' + esc(g) + '</span>'; }).join('') + '</div>'
      : '';
    var action = res.combat
      ? '<button class="btn btn-primary btn-wide" data-action="to-battle">' + icon('sword') + '拔剑迎战</button>'
      : '<button class="btn btn-primary btn-wide" data-action="close-modal">继续前行</button>';
    return modalFrame('result-modal', modalHead('奇遇 · ' + (m.region && m.region.name ? m.region.name : '山野'), m.event.name, false, checked) +
      '<div class="modal-body">' +
      '<p class="event-text result-text">' + esc(res.text || '风过林梢，什么也没有发生。') + '</p>' +
      gains +
      '<div class="modal-actions">' + action + '</div>' +
      '</div>', { label: m.event.name });
  }

  /* ------------------------------------------------------------------ */
  /* 战斗弹窗                                                            */
  /* ------------------------------------------------------------------ */

  function renderBattleModal() {
    var s = UI.state;
    var b = s.battle;
    if (!b) return '';
    var d = E.derived(s);
    var e = b.enemy;
    var hpPct = pct(e.hp / e.hpMax);
    var isOver = b.over;
    var title = e.tribulation ? '九霄雷劫' : (e.elite ? '强敌当前' : '狭路相逢');
    var kicker = e.tribulation ? '渡劫 · 天门之前' : '战斗 · ' + (D.REGIONS.find(function (r) { return r.id === b.regionId; }) || { name: '山野' }).name;

    var log = b.log.slice(-14).map(function (l) {
      return '<p class="battle-log-line ' + esc(l.type) + '">' + esc(l.text) + '</p>';
    }).join('');

    var actions = '';
    if (!isOver) {
      var skill = d.skill;
      var canSkill = skill && s.player.mp >= skill.cost;
      actions = '<div class="battle-actions">' +
        '<button class="battle-btn" data-action="battle-act" data-act="attack">' + icon('sword') + '<span><b>普通攻击</b><small>不耗灵力</small></span></button>' +
        (skill ? '<button class="battle-btn" data-action="battle-act" data-act="skill" ' + (canSkill ? '' : 'disabled') + '>' + icon('spark') + '<span><b>' + esc(skill.name) + '</b><small>灵力 ' + skill.cost + (canSkill ? '' : ' · 不足') + '</small></span></button>' :
          '<button class="battle-btn" disabled>' + icon('spark') + '<span><b>术法</b><small>未习得</small></span></button>') +
        '<button class="battle-btn" data-action="battle-pill-menu">' + icon('heart') + '<span><b>服丹</b><small>恢复气血 / 灵力</small></span></button>' +
        '<button class="battle-btn danger" data-action="battle-act" data-act="flee">' + icon('arrow') + '<span><b>遁走</b><small>并非每次都能脱身</small></span></button>' +
        '</div>';
      if (UI.battlePillOpen) {
        var pills = s.player.inventory.filter(function (entry) {
          var it = D.ITEMS[entry.id];
          return it && it.type === 'pill' && ['heal', 'fullHeal', 'mana'].indexOf(it.effect.type) !== -1;
        });
        actions += '<div class="battle-pill-panel"><div class="battle-pill-title">选择丹药</div>' +
          (pills.length ? pills.map(function (entry) {
            var it = D.ITEMS[entry.id];
            return '<button class="battle-pill" data-action="battle-pill" data-id="' + it.id + '">' + esc(it.glyph) + ' <b>' + esc(it.name) + '</b><span>×' + entry.qty + '</span></button>';
          }).join('') : '<p class="modal-note">行囊中没有可在战斗中服用的丹药。</p>') +
          '<button class="text-btn" data-action="battle-pill-close">收起</button></div>';
      }
    } else {
      var rewardHtml = '';
      if (b.result === 'win' && b.rewards) {
        rewardHtml = '<div class="gains">' +
          '<span class="gain-chip">修为 +' + fmt(b.rewards.exp) + '</span>' +
          '<span class="gain-chip">灵石 +' + fmt(b.rewards.stones) + '</span>' +
          (b.rewards.drops || []).map(function (x) { return '<span class="gain-chip">' + esc(x.name) + ' ×' + x.qty + '</span>'; }).join('') +
          '</div>';
      } else if (b.result === 'lose' && b.rewards) {
        rewardHtml = '<div class="gains">' +
          '<span class="gain-chip loss">修为 -' + fmt(b.rewards.lostExp) + '</span>' +
          '<span class="gain-chip loss">灵石 -' + fmt(b.rewards.lostStones) + '</span>' +
          '</div>';
      } else if (b.result === 'ascension') {
        rewardHtml = '<p class="ascend-line">九霄雷散，天门洞开。</p>';
      }
      var resultLabel = b.result === 'win' ? '胜' : b.result === 'lose' ? '败' : b.result === 'flee' ? '遁' : '仙';
      var resultTitle = b.result === 'win' ? '尘埃落定' : b.result === 'lose' ? '败退' : b.result === 'flee' ? '脱身' : '羽化飞升';
      actions = '<div class="battle-result">' +
        '<div class="result-seal ' + esc(b.result) + '">' + resultLabel + '</div>' +
        '<h3>' + resultTitle + '</h3>' + rewardHtml +
        '<button class="btn btn-primary btn-wide" data-action="close-battle">' + (b.result === 'ascension' ? '迎接天门' : '收功') + '</button>' +
        '</div>';
    }

    return modalFrame('battle-modal', modalHead(kicker, title, false,
      '<span class="battle-turn">第 ' + b.turn + ' 回合</span>') +
      '<div class="modal-body battle-body">' +
      '<div class="enemy-plate">' +
      '<div class="enemy-id"><span class="enemy-glyph">' + esc(e.glyph) + '</span><div><b>' + esc(e.name) + '</b><p>' + esc(e.desc) + '</p></div></div>' +
      '<div class="bar-row"><div class="bar-label"><span>敌方气血</span><span>' + fmt(e.hp) + ' / ' + fmt(e.hpMax) + '</span></div><div class="bar enemy" role="progressbar" aria-valuenow="' + hpPct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + hpPct + '%"></i></div></div>' +
      '</div>' +
      '<div class="battle-stage"><div class="battle-log" id="battle-log">' + log + '</div></div>' +
      '<div class="battle-player">' +
      '<div class="battle-vitals">' + barRow('气血', s.player.hp, d.hpMax, 'hp') + barRow('灵力', s.player.mp, d.mpMax, 'mp') + '</div>' +
      '<div class="battle-numbers"><span>攻 ' + fmt(d.atk) + '</span><span>防 ' + fmt(d.def) + '</span><span>暴击 ' + pct(d.crit) + '%</span>' + (b.shield > 0 ? '<span class="shield">护体 ' + fmt(b.shield) + '</span>' : '') + '</div>' +
      '</div>' +
      actions +
      '</div>', { label: '战斗' });
  }

  /* ------------------------------------------------------------------ */
  /* 结果 / 结局 / 设置 / 确认 / 引导                                    */
  /* ------------------------------------------------------------------ */

  function renderResultModal(m) {
    var tone = m.tone || 'info';
    var checked = m.chance != null ? '<span class="check-result ' + (m.success ? 'ok' : 'bad') + '">成功率 ' + pct(m.chance) + '%</span>' : '';
    var next = m.next === 'battle'
      ? '<button class="btn btn-primary btn-wide" data-action="to-battle">' + icon('sword') + '迎接天劫</button>'
      : '<button class="btn btn-primary btn-wide" data-action="close-modal">继续</button>';
    return modalFrame('result-modal', modalHead(m.kicker || '修行', m.title || '结果', false, checked) +
      '<div class="modal-body"><p class="event-text result-text ' + esc(tone) + '">' + esc(m.text || '') + '</p>' +
      (m.detail ? '<p class="modal-note">' + esc(m.detail) + '</p>' : '') +
      '<div class="modal-actions">' + next + '</div></div>', { label: m.title || '结果' });
  }

  function renderEndingModal() {
    var s = UI.state;
    var p = s.player;
    var ascended = s.ended === 'ascended';
    var meta = E.getMeta();
    var achCount = Object.keys(s.achievements).length;
    var title = ascended ? '羽化飞升' : '坐化';
    var kicker = ascended ? '此世 · 圆满' : '此世 · 终章';
    var text = ascended
      ? '你踏碎最后一道天雷，衣袂在云海之上猎猎作响。回望人间，山河如芥，故人如尘。长生路已至尽头，又或者，只是另一段路的开始。'
      : '你在蒲团上缓缓闭上眼。这一世，你见过山雨、妖火、故人的笑，也见过自己的怯懦与不甘。修行一场，终究没能走到最后。';
    var quote = ascended ? '「一朝得道，万古长青。」' : '「大道无情，生死一梦。」';
    return modalFrame('ending-modal ' + (ascended ? 'ascended' : 'death'),
      '<div class="ending-inner">' +
      '<div class="ending-seal">' + (ascended ? '仙' : '寂') + '</div>' +
      '<p class="eyebrow">' + kicker + '</p>' +
      '<h2>' + title + '</h2>' +
      '<p class="ending-text">' + text + '</p>' +
      '<p class="ending-quote">' + quote + '</p>' +
      '<div class="ending-stats">' +
      '<div><span>道号</span><b>' + esc(p.name) + '</b></div>' +
      '<div><span>境界</span><b>' + esc(E.stageInfo(s).name) + '</b></div>' +
      '<div><span>享年</span><b>' + E.age(s) + ' 岁</b></div>' +
      '<div><span>历练</span><b>' + s.stats.explorations + ' 次</b></div>' +
      '<div><span>胜战</span><b>' + s.stats.wins + ' 场</b></div>' +
      '<div><span>成就</span><b>' + achCount + ' / ' + D.ACHIEVEMENTS.length + '</b></div>' +
      '</div>' +
      (ascended ? '<p class="legacy-note">轮回印记 +1 · 累计飞升 ' + meta.ascensions + ' 次</p>' : '') +
      '<div class="ending-actions">' +
      '<button class="btn btn-primary" data-action="reincarnate">转世重修</button>' +
      '<button class="btn btn-ghost" data-action="ending-close">回望此生</button>' +
      '</div></div>', { label: title });
  }

  function renderSettingsModal() {
    var s = UI.state;
    var exportData = '';
    if (s) {
      try { exportData = JSON.stringify(s, null, 2); } catch (e) { exportData = ''; }
    }
    return modalFrame('settings-modal', modalHead('洞府 · 杂务', '设置', true) +
      '<div class="modal-body">' +
      '<div class="setting-row"><div><b>界面主题</b><small>夜墨沉静，宣纸温和。</small></div><div class="segmented">' +
      '<button class="' + (UI.settings.theme === 'night' ? 'on' : '') + '" data-action="theme" data-value="night">夜墨</button>' +
      '<button class="' + (UI.settings.theme === 'paper' ? 'on' : '') + '" data-action="theme" data-value="paper">宣纸</button>' +
      '</div></div>' +
      '<div class="setting-row"><div><b>动画效果</b><small>关闭后减少移动与过渡。</small></div><button class="switch ' + (UI.settings.motion ? 'on' : '') + '" data-action="toggle-motion" role="switch" aria-checked="' + UI.settings.motion + '"><i></i></button></div>' +
      '<div class="setting-row"><div><b>自动使用破境丹</b><small>仅在冲关前可手动更改。</small></div><button class="switch ' + (UI.settings.usePill ? 'on' : '') + '" data-action="toggle-pill" role="switch" aria-checked="' + UI.settings.usePill + '"><i></i></button></div>' +
      '<div class="settings-divider"></div>' +
      (s ? '<div class="save-block"><div class="panel-head"><div><b>存档</b><small>保存在当前浏览器中，换设备请复制下方内容。</small></div><button class="text-btn" data-action="copy-save">复制存档</button></div>' +
        '<textarea class="save-area" id="save-data" readonly>' + esc(exportData) + '</textarea></div>' +
        '<div class="save-block"><b>导入存档</b><textarea class="save-area" id="import-data" placeholder="粘贴存档 JSON 后点击导入"></textarea>' +
        '<div class="modal-actions inline"><button class="btn btn-ghost btn-sm" data-action="import-save">导入存档</button>' +
        '<button class="btn btn-danger-ghost btn-sm" data-action="restart">重新开始</button></div></div>' :
        '<p class="modal-note">尚未开始游戏。</p>') +
      '<div class="settings-divider"></div>' +
      '<div class="about-block"><b>关于</b><p class="modal-note">《一念长生》是一款原创文字修仙小游戏。玩法参考了开源项目 <a href="https://github.com/setube/vue-xiuxiangame" target="_blank" rel="noopener">vue-xiuxiangame</a> 与 <a href="https://github.com/JeasonLoop/react-xiuxian-game" target="_blank" rel="noopener">react-xiuxian-game</a> 的公开设计思路，文案、数值与代码均为本作原创。</p>' +
      '<p class="modal-note">版本 ' + D.VERSION + '.0 · 本地存档 · 无内购</p></div>' +
      '<div class="modal-actions"><button class="btn btn-ghost btn-sm" data-action="back-title">回到标题</button><button class="btn btn-primary btn-sm" data-action="close-modal">关闭</button></div>' +
      '</div>', { closable: true, label: '设置' });
  }

  function renderConfirmModal(m) {
    return modalFrame('confirm-modal', modalHead('确认', m.title || '确认', false) +
      '<div class="modal-body"><p class="event-text">' + esc(m.text || '') + '</p>' +
      '<div class="modal-actions"><button class="btn btn-primary" data-action="confirm" data-confirm="' + esc(m.confirmAction) + '">' + esc(m.confirmLabel || '确认') + '</button>' +
      '<button class="btn btn-ghost" data-action="close-modal">再想想</button></div></div>', { label: m.title || '确认' });
  }

  function renderIntroModal() {
    var s = UI.state;
    var root = D.ROOTS[s.player.root];
    return modalFrame('intro-modal', modalHead('仙途 · 开篇', '你醒了', false) +
      '<div class="modal-body">' +
      '<p class="event-text">你叫' + esc(s.player.name) + '，今年十六岁。测灵碑上亮起「' + esc(root.name) + '」的光，老道人说，你有仙缘。</p>' +
      '<div class="intro-tips">' +
      '<div><span>一</span><p><b>打坐</b>积累修为。修为满后，在修炼页冲关突破。</p></div>' +
      '<div><span>二</span><p><b>历练</b>能得灵石、丹药与功法，也会遇见妖物。打不过就跑。</p></div>' +
      '<div><span>三</span><p><b>坊市</b>里可买法器丹药，<b>行囊</b>里能炼丹、卖材料。</p></div>' +
      '</div>' +
      '<p class="modal-note">从炼气一层到羽化飞升，这条路很长。慢慢走。</p>' +
      '<div class="modal-actions"><button class="btn btn-primary btn-wide" data-action="close-modal">开始修行</button></div>' +
      '</div>', { label: '开篇' });
  }

  UI.renderModal = function () {
    if (!UI.modal) {
      modalRoot.innerHTML = '';
      if (app) app.inert = false;
      document.body.classList.remove('modal-open');
      return;
    }
    var m = UI.modal;
    var html = '';
    if (m.type === 'event') html = renderEventModal(m);
    else if (m.type === 'event-result') html = renderEventResultModal(m);
    else if (m.type === 'battle') html = renderBattleModal();
    else if (m.type === 'result') html = renderResultModal(m);
    else if (m.type === 'ending') html = renderEndingModal();
    else if (m.type === 'settings') html = renderSettingsModal();
    else if (m.type === 'confirm') html = renderConfirmModal(m);
    else if (m.type === 'intro') html = renderIntroModal();
    modalRoot.innerHTML = html;
    if (app) app.inert = !!html;
    document.body.classList.toggle('modal-open', !!html);
    var logEl = document.getElementById('battle-log');
    if (logEl) logEl.scrollTop = logEl.scrollHeight;
    if (html && m.type !== 'battle') {
      var focusTarget = m.type === 'event' ? modalRoot.querySelector('.choice:not(:disabled)') : null;
      if (!focusTarget) focusTarget = modalRoot.querySelector('.modal-head button');
      if (!focusTarget) focusTarget = modalRoot.querySelector('.btn:not(:disabled)');
      if (focusTarget) {
        setTimeout(function () {
          try { focusTarget.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
        }, 40);
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* 流程                                                                */
  /* ------------------------------------------------------------------ */

  function enterGame(state, showIntro) {
    UI.clearToasts();
    UI.state = state;
    UI.creation = null;
    UI.screen = 'cultivate';
    UI.charTab = 'stats';
    UI.invTab = 'items';
    UI.battlePillOpen = false;
    if (showIntro) UI.modal = { type: 'intro' };
    else if (state.battle) UI.modal = { type: 'battle' };
    else if (state.ended) UI.modal = { type: 'ending' };
    else UI.modal = null;
    UI.render();
  }

  function startCreation() {
    UI.clearToasts();
    UI.state = null;
    UI.creation = UI.newCreation();
    UI.modal = null;
    UI.screen = 'cultivate';
    UI.render();
    window.scrollTo(0, 0);
  }

  function startGame() {
    var c = UI.creation;
    var name = (c.name || '').trim();
    if (!name) { UI.toast('给自己取一个道号吧。', 'danger'); return; }
    c.name = name;
    var s = E.newGame(c);
    E.save(s);
    enterGame(s, true);
    window.scrollTo(0, 0);
  }

  function reincarnate() {
    E.deleteSave();
    startCreation();
  }

  /* ------------------------------------------------------------------ */
  /* 事件处理                                                            */
  /* ------------------------------------------------------------------ */

  function onAction(action, el) {
    var s = UI.state;
    switch (action) {

      /* ---------- 标题与创建 ---------- */
      case 'continue': {
        var loaded = E.load();
        if (!loaded) { UI.toast('存档读取失败，可能已损坏。', 'danger'); return; }
        enterGame(loaded, false);
        return;
      }
      case 'new-game': {
        if (E.hasSave()) {
          UI.modal = {
            type: 'confirm', title: '重入轮回',
            text: '开始新的一世会覆盖当前存档。旧存档中的一切都会散去，确定吗？',
            confirmAction: 'new', confirmLabel: '开始新的一世'
          };
          UI.renderModal();
        } else {
          startCreation();
        }
        return;
      }
      case 'confirm': {
        var which = el.dataset.confirm;
        UI.modal = null;
        if (which === 'restart') {
          E.deleteSave();
          startCreation();
        } else if (which === 'new') {
          startCreation();
        }
        return;
      }
      case 'select-origin': UI.creation.origin = el.dataset.value; UI.render(); return;
      case 'select-root': UI.creation.root = el.dataset.value; UI.render(); return;
      case 'select-daoheart': UI.creation.daoheart = el.dataset.value; UI.render(); return;
      case 'random-name': UI.creation.name = E.randomName(); UI.render(); return;
      case 'creation-next': {
        if (UI.creation.step === 0 && !(UI.creation.name || '').trim()) {
          UI.toast('先取一个道号吧。', 'danger'); return;
        }
        UI.creation.step = Math.min(2, UI.creation.step + 1);
        UI.render(); window.scrollTo(0, 0); return;
      }
      case 'creation-back': {
        if (UI.creation.step === 0) { UI.showLanding(); return; }
        UI.creation.step -= 1;
        UI.render(); window.scrollTo(0, 0); return;
      }
      case 'start-game': startGame(); return;
      case 'reincarnate': reincarnate(); return;

      /* ---------- 导航 ---------- */
      case 'nav': {
        if (!s) return;
        UI.screen = el.dataset.screen || 'cultivate';
        if (el.dataset.tab) UI.charTab = el.dataset.tab;
        UI.modal = null;
        UI.battlePillOpen = false;
        UI.render();
        window.scrollTo({ top: 0, behavior: UI.settings.motion ? 'smooth' : 'auto' });
        return;
      }
      case 'char-tab': UI.charTab = el.dataset.tab; UI.render(); return;
      case 'inv-tab': UI.invTab = el.dataset.tab; UI.render(); return;
      case 'inv-filter': UI.invFilter = el.dataset.filter; UI.render(); return;

      /* ---------- 修炼 ---------- */
      case 'meditate': {
        if (!s) return;
        var beforeM = Object.assign({}, s.achievements);
        var res = E.meditate(s);
        if (!res.ok) { UI.toast(res.error, 'danger'); return; }
        UI.modal = s.ended ? { type: 'ending' } : null;
        UI.persist(beforeM);
        UI.render();
        UI.toast('修为 +' + fmt(res.gain), 'success');
        if (res.special) UI.toast(esc(res.special), 'info');
        if (!s.ended && s.player.exp >= E.expNeed(s)) UI.toast('修为已满，可尝试突破。', 'gold');
        return;
      }
      case 'closed': {
        if (!s) return;
        var beforeC = Object.assign({}, s.achievements);
        var rc = E.closedCultivation(s);
        if (!rc.ok) { UI.toast(rc.error, 'danger'); return; }
        UI.modal = s.ended ? { type: 'ending' } : null;
        UI.persist(beforeC);
        UI.render();
        UI.toast('闭关结束 · 修为 +' + fmt(rc.gain), 'success');
        if (rc.special) UI.toast(esc(rc.special), 'info');
        return;
      }
      case 'toggle-pill': {
        UI.settings.usePill = !UI.settings.usePill;
        saveSettings();
        UI.render();
        return;
      }
      case 'breakthrough': {
        if (!s) return;
        var beforeB = Object.assign({}, s.achievements);
        var rb = E.breakthrough(s, UI.settings.usePill);
        if (!rb.ok) {
          if (s.ended) { UI.persist(beforeB); UI.modal = { type: 'ending' }; UI.render(); }
          else UI.toast(rb.error, 'danger');
          return;
        }
        UI.persist(beforeB);
        if (rb.tribulation) {
          UI.modal = {
            type: 'result', kicker: '渡劫 · 天门', title: '天劫将至',
            text: rb.text, tone: 'gold', success: true, chance: rb.chance, next: 'battle',
            detail: '渡过此劫，便可羽化飞升。若败，尚可卷土重来。'
          };
        } else {
          UI.modal = {
            type: 'result', kicker: '冲关', title: rb.success ? '破境成功' : '冲关失败',
            text: rb.text, tone: rb.success ? 'success' : 'danger', success: rb.success, chance: rb.chance,
            detail: rb.success ? '新的境界带来新的寿元与力量。' : '失败会留下心得，下次成功率提高 5%。'
          };
        }
        UI.render();
        return;
      }

      /* ---------- 历练 ---------- */
      case 'explore': {
        if (!s) return;
        var rExp = E.explore(s, el.dataset.region);
        if (!rExp.ok) {
          if (s.ended) { UI.modal = { type: 'ending' }; UI.render(); }
          else UI.toast(rExp.error, 'danger');
          return;
        }
        UI.modal = { type: 'event', event: rExp.event, region: rExp.region };
        UI.persist();
        UI.render();
        return;
      }
      case 'choose': {
        if (!s || !UI.modal || UI.modal.type !== 'event') return;
        var ev = UI.modal.event;
        var region = UI.modal.region;
        var beforeCh = Object.assign({}, s.achievements);
        var rr = E.resolveChoice(s, ev, Number(el.dataset.index));
        if (!rr.ok) { UI.toast(rr.error, 'danger'); return; }
        UI.modal = { type: 'event-result', event: ev, region: region, result: rr };
        UI.persist(beforeCh);
        UI.render();
        return;
      }
      case 'to-battle': {
        if (!s || !s.battle) { UI.modal = null; UI.render(); return; }
        UI.modal = { type: 'battle' };
        UI.battlePillOpen = false;
        UI.render();
        return;
      }

      /* ---------- 战斗 ---------- */
      case 'battle-act': {
        if (!s || !s.battle) return;
        var beforeBat = Object.assign({}, s.achievements);
        var rb2 = E.battleAction(s, el.dataset.act);
        if (!rb2.ok) { UI.toast(rb2.error, 'danger'); return; }
        UI.battlePillOpen = false;
        UI.persist(beforeBat);
        UI.render();
        return;
      }
      case 'battle-pill-menu': UI.battlePillOpen = true; UI.renderModal(); return;
      case 'battle-pill-close': UI.battlePillOpen = false; UI.renderModal(); return;
      case 'battle-pill': {
        if (!s || !s.battle) return;
        var beforeP = Object.assign({}, s.achievements);
        var rp = E.battleAction(s, 'pill', el.dataset.id);
        if (!rp.ok) { UI.toast(rp.error, 'danger'); return; }
        UI.battlePillOpen = false;
        UI.persist(beforeP);
        UI.render();
        return;
      }
      case 'close-battle': {
        if (!s || !s.battle) return;
        E.endBattle(s);
        UI.modal = s.ended ? { type: 'ending' } : null;
        UI.persist();
        UI.render();
        return;
      }

      /* ---------- 物品 ---------- */
      case 'use-item': {
        if (!s) return;
        var beforeU = Object.assign({}, s.achievements);
        var ru = E.useItem(s, el.dataset.id);
        if (!ru.ok) { UI.toast(ru.error, 'danger'); return; }
        UI.persist(beforeU);
        UI.render();
        UI.toast(esc(ru.text), 'success');
        return;
      }
      case 'equip-item': {
        if (!s) return;
        var re = E.equipItem(s, el.dataset.id);
        if (!re.ok) { UI.toast(re.error, 'danger'); return; }
        UI.persist(); UI.render();
        UI.toast('已装备「' + esc(D.ITEMS[el.dataset.id].name) + '」', 'success');
        return;
      }
      case 'unequip': {
        if (!s) return;
        var rv = E.unequipItem(s, el.dataset.slot);
        if (!rv.ok) { UI.toast(rv.error, 'danger'); return; }
        UI.persist(); UI.render();
        UI.toast('已取下装备', 'info');
        return;
      }
      case 'sell-item': {
        if (!s) return;
        var rs = E.sellItem(s, el.dataset.id, 1);
        if (!rs.ok) { UI.toast(rs.error, 'danger'); return; }
        UI.persist(); UI.render();
        UI.toast('出售成功 · 灵石 +' + fmt(rs.stones), 'gold');
        return;
      }
      case 'equip-tech': {
        if (!s) return;
        var rt = E.equipTechnique(s, el.dataset.id);
        if (!rt.ok) { UI.toast(rt.error, 'danger'); return; }
        UI.persist(); UI.render();
        UI.toast('已改修「' + esc(D.TECHNIQUES[el.dataset.id].name) + '」', 'success');
        return;
      }

      /* ---------- 坊市与炼丹 ---------- */
      case 'buy': {
        if (!s) return;
        var rbuy = E.buyStock(s, Number(el.dataset.index));
        if (!rbuy.ok) { UI.toast(rbuy.error, 'danger'); return; }
        UI.persist(); UI.render();
        UI.toast('购得' + esc(rbuy.text) + '。', 'success');
        return;
      }
      case 'refresh-market': {
        if (!s) return;
        var rrf = E.refreshMarket(s, true);
        if (!rrf.ok) { UI.toast(rrf.error, 'danger'); return; }
        UI.persist(); UI.render();
        UI.toast('货架已换新 · 灵石 -' + fmt(rrf.cost), 'info');
        return;
      }
      case 'craft': {
        if (!s) return;
        var beforeCr = Object.assign({}, s.achievements);
        var rcr = E.craft(s, el.dataset.id);
        if (!rcr.ok) {
          if (s.ended) { UI.persist(beforeCr); UI.modal = { type: 'ending' }; UI.render(); }
          else UI.toast(rcr.error, 'danger');
          return;
        }
        UI.modal = s.ended ? { type: 'ending' } : null;
        UI.persist(beforeCr); UI.render();
        UI.toast(esc(rcr.text), rcr.success ? 'success' : 'danger');
        return;
      }

      /* ---------- 通用 ---------- */
      case 'settings': UI.modal = { type: 'settings' }; UI.renderModal(); return;
      case 'theme': {
        var theme = el.dataset.value;
        if (theme !== UI.settings.theme) {
          UI.settings.theme = theme;
          saveSettings(); applySettings(); UI.render();
        }
        return;
      }
      case 'toggle-motion': {
        UI.settings.motion = !UI.settings.motion;
        saveSettings(); applySettings(); UI.render();
        return;
      }
      case 'copy-save': {
        var area = document.getElementById('save-data');
        if (!area) return;
        area.select();
        var okCopy = false;
        try { okCopy = document.execCommand('copy'); } catch (e) { okCopy = false; }
        if (!okCopy && navigator.clipboard) {
          navigator.clipboard.writeText(area.value).then(function () { UI.toast('存档已复制', 'success'); });
        } else if (okCopy) {
          UI.toast('存档已复制', 'success');
        } else {
          UI.toast('复制失败，请手动选择文本复制。', 'danger');
        }
        return;
      }
      case 'import-save': {
        var imp = document.getElementById('import-data');
        if (!imp || !imp.value.trim()) { UI.toast('请先粘贴存档内容。', 'danger'); return; }
        var oldRaw = null;
        try { oldRaw = localStorage.getItem(D.SAVE_KEY); } catch (e) { oldRaw = null; }
        try {
          var parsed = JSON.parse(imp.value.trim());
          if (!parsed || !parsed.player || !parsed.player.base || parsed.version !== D.VERSION) throw new Error('bad save');
          E.save(parsed);
          var loaded2 = E.load();
          if (!loaded2) throw new Error('load failed');
          UI.toast('存档导入成功。', 'success');
          enterGame(loaded2, false);
        } catch (e) {
          try {
            if (oldRaw) localStorage.setItem(D.SAVE_KEY, oldRaw);
            else E.deleteSave();
          } catch (err) { /* ignore */ }
          UI.toast('存档格式不正确，无法导入。', 'danger');
        }
        return;
      }
      case 'restart': {
        UI.modal = {
          type: 'confirm', title: '重新开始',
          text: '这会删除当前存档，从问心开始新的一世。轮回印记会保留。确定吗？',
          confirmAction: 'restart', confirmLabel: '斩断此世'
        };
        UI.renderModal();
        return;
      }
      case 'back-title': {
        if (s) UI.persist();
        UI.showLanding();
        return;
      }
      case 'show-ending': UI.modal = { type: 'ending' }; UI.renderModal(); return;
      case 'ending-close': UI.modal = null; UI.render(); return;
      case 'close-modal': {
        if (s && s.battle && !s.battle.over) return;
        UI.modal = null;
        UI.battlePillOpen = false;
        UI.renderModal();
        return;
      }
      case 'close-intro': UI.modal = null; UI.render(); return;
      default: return;
    }
  }

  function onClick(e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var action = el.dataset.action;
    if (!action) return;
    /* 复选框的默认行为需要先发生 */
    onAction(action, el);
  }

  function onInput(e) {
    if (e.target && e.target.matches('[data-name-input]') && UI.creation) {
      UI.creation.name = e.target.value;
    }
  }

  function onKeydown(e) {
    if (e.isComposing) return;
    if (e.key === 'Enter' && e.target && e.target.matches && e.target.matches('[data-name-input]') && UI.creation) {
      onAction('creation-next', { dataset: {} });
      return;
    }
    if (e.key === 'Escape') {
      var closeable = ['settings', 'confirm', 'intro', 'event'];
      if (UI.modal && closeable.indexOf(UI.modal.type) !== -1) {
        UI.modal = null;
        UI.battlePillOpen = false;
        UI.renderModal();
      }
    }
  }

  UI.init = function () {
    loadSettings();
    if (location.protocol !== 'file:' && !document.querySelector('link[rel="manifest"]')) {
      var manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = 'manifest.webmanifest';
      document.head.appendChild(manifestLink);
    }
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('keydown', onKeydown);
    UI.render();
  };
})();
