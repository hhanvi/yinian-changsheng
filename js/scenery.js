(function (global) {
  'use strict';

  function roof(cx, y, w, h, tone) {
    var ew = 18;
    var rw = w * 0.27;
    var ridgeY = y - h;
    var eaveY = y - 10;
    var fill = tone === 'red' ? 'url(#scRoofRed)' : tone === 'jade' ? 'url(#scRoofJade)' : 'url(#scRoof)';
    var d = 'M' + (cx - w / 2 - ew) + ' ' + eaveY +
      ' Q' + (cx - w / 2 - 2) + ' ' + (eaveY + 6) + ' ' + (cx - w / 2 + 6) + ' ' + (eaveY - 18) +
      ' L' + (cx - rw) + ' ' + (ridgeY + 8) +
      ' Q' + cx + ' ' + (ridgeY - 4) + ' ' + (cx + rw) + ' ' + (ridgeY + 8) +
      ' L' + (cx + w / 2 - 6) + ' ' + (eaveY - 18) +
      ' Q' + (cx + w / 2 + 2) + ' ' + (eaveY + 6) + ' ' + (cx + w / 2 + ew) + ' ' + eaveY +
      ' L' + (cx + w / 2 - 4) + ' ' + (eaveY - 28) +
      ' Q' + cx + ' ' + (eaveY - 40) + ' ' + (cx - w / 2 + 4) + ' ' + (eaveY - 28) + ' Z';

    var tiles = '';
    for (var i = -3; i <= 3; i++) {
      var t = i / 3;
      var x1 = cx + t * rw;
      var x2 = cx + t * (w / 2 - 6);
      var mx = cx + t * (w / 2 - 24);
      tiles += '<path d="M' + x1 + ' ' + (ridgeY + 8) + ' Q' + mx + ' ' + (y - h / 2) + ' ' + x2 + ' ' + (eaveY - 28) + '" fill="none" stroke="#1d3229" stroke-opacity=".3" stroke-width="1.1"/>';
    }

    var brackets = '';
    for (var b = -4; b <= 4; b++) {
      var bx = cx + b * (w / 9);
      var by = eaveY - 30 + Math.abs(b) * 1.7;
      brackets += '<rect x="' + (bx - 1.6) + '" y="' + (by - 4) + '" width="3.2" height="5.5" fill="#c9a45c" opacity=".52"/>';
    }

    return '<g class="sc-roof">' +
      '<path d="' + d + '" fill="' + fill + '" stroke="#1d3329" stroke-width="1.5" stroke-linejoin="round"/>' +
      tiles +
      brackets +
      '<path d="M' + (cx - w / 2 - 10) + ' ' + (eaveY - 4) + ' Q' + cx + ' ' + (eaveY - 42) + ' ' + (cx + w / 2 + 10) + ' ' + (eaveY - 4) + '" fill="none" stroke="#d8b56a" stroke-width="1.3" stroke-opacity=".7"/>' +
      '<path d="M' + (cx - rw) + ' ' + (ridgeY + 8) + ' Q' + cx + ' ' + (ridgeY - 4) + ' ' + (cx + rw) + ' ' + (ridgeY + 8) + '" fill="none" stroke="#d8b56a" stroke-width="1.5" stroke-opacity=".8"/>' +
      '<path d="M' + (cx - rw) + ' ' + (ridgeY + 8) + ' q-7 -1 -10 -9" fill="none" stroke="#d8b56a" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="M' + (cx + rw) + ' ' + (ridgeY + 8) + ' q7 -1 10 -9" fill="none" stroke="#d8b56a" stroke-width="1.8" stroke-linecap="round"/>' +
      '<circle cx="' + (cx - rw) + '" cy="' + (ridgeY + 8) + '" r="2.2" fill="#d8b56a"/>' +
      '<circle cx="' + (cx + rw) + '" cy="' + (ridgeY + 8) + '" r="2.2" fill="#d8b56a"/>' +
      '<path d="M' + (cx - 6) + ' ' + (ridgeY - 2) + ' L' + cx + ' ' + (ridgeY - 15) + ' L' + (cx + 6) + ' ' + (ridgeY - 2) + ' Z" fill="#d8b56a"/>' +
      '<line x1="' + (cx - w / 2 - ew + 2) + '" y1="' + (eaveY - 2) + '" x2="' + (cx - w / 2 - ew + 2) + '" y2="' + (eaveY + 5) + '" stroke="#6b4c34" stroke-width="1"/>' +
      '<circle cx="' + (cx - w / 2 - ew + 2) + '" cy="' + (eaveY + 6) + '" r="1.6" fill="#d8b56a"/>' +
      '<line x1="' + (cx + w / 2 + ew - 2) + '" y1="' + (eaveY - 2) + '" x2="' + (cx + w / 2 + ew - 2) + '" y2="' + (eaveY + 5) + '" stroke="#6b4c34" stroke-width="1"/>' +
      '<circle cx="' + (cx + w / 2 + ew - 2) + '" cy="' + (eaveY + 6) + '" r="1.6" fill="#d8b56a"/>' +
      '</g>';
  }

  function lantern(x, y, s) {
    return '<g class="sc-lantern">' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + (10 * s) + '" fill="#e7a35c" opacity=".28" filter="url(#scGlow)"/>' +
      '<line x1="' + x + '" y1="' + (y - 13 * s) + '" x2="' + x + '" y2="' + (y - 6 * s) + '" stroke="#6b4c34" stroke-width="1"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + (5.4 * s) + '" fill="#c4563c"/>' +
      '<circle cx="' + x + '" cy="' + (y - 2 * s) + '" r="' + (2.2 * s) + '" fill="#ffe3a3"/>' +
      '</g>';
  }

  function grass(x, y, s) {
    var out = '<g class="sc-grass">';
    for (var i = 0; i < 5; i++) {
      var dx = (i - 2) * 3.2 * s;
      var h = (7 + (i % 3) * 3) * s;
      out += '<path d="M' + (x + dx) + ' ' + y + ' Q' + (x + dx - 2.5 * s) + ' ' + (y - h * 0.55) + ' ' + (x + dx - 1.2 * s) + ' ' + (y - h) + '" fill="none" stroke="#587548" stroke-width="' + (1.1 * s) + '" stroke-linecap="round" opacity=".78"/>';
    }
    out += '</g>';
    return out;
  }

  function stoneLantern(x, y, s) {
    return '<g class="sc-stone-lantern">' +
      '<ellipse cx="' + x + '" cy="' + (y + 1) + '" rx="' + (9 * s) + '" ry="' + (2.5 * s) + '" fill="#1c3026" opacity=".18"/>' +
      '<rect x="' + (x - 3.5 * s) + '" y="' + (y - 13 * s) + '" width="' + (7 * s) + '" height="' + (13 * s) + '" fill="#a99a7b" stroke="#6f6048" stroke-width=".8"/>' +
      '<rect x="' + (x - 7 * s) + '" y="' + (y - 23 * s) + '" width="' + (14 * s) + '" height="' + (10 * s) + '" fill="#d3c29c" stroke="#6f6048" stroke-width=".8"/>' +
      '<rect x="' + (x - 5 * s) + '" y="' + (y - 21 * s) + '" width="' + (10 * s) + '" height="' + (6 * s) + '" fill="#f4d79a" opacity=".85" filter="url(#scGlow)"/>' +
      '<path d="M' + (x - 9 * s) + ' ' + (y - 23 * s) + ' L' + x + ' ' + (y - 30 * s) + ' L' + (x + 9 * s) + ' ' + (y - 23 * s) + ' Z" fill="#7f8c70" stroke="#5d6a52" stroke-width=".8"/>' +
      '</g>';
  }

  function hall(cx, groundY, w, wallH, roofH, opts) {
    opts = opts || {};
    var y = groundY - wallH;
    var gate = !!opts.gate;
    var tone = opts.tone || 'jade';
    var s = '';

    s += '<ellipse cx="' + cx + '" cy="' + (groundY + 8) + '" rx="' + (w * 0.62) + '" ry="10" fill="#1c3026" opacity=".18" filter="url(#scBlurSoft)"/>';
    s += '<path d="M' + (cx - w / 2 - 12) + ' ' + (groundY - 6) + ' L' + (cx + w / 2 + 12) + ' ' + (groundY - 6) + ' L' + (cx + w / 2 + 4) + ' ' + (groundY + 8) + ' L' + (cx - w / 2 - 4) + ' ' + (groundY + 8) + ' Z" fill="url(#scStone)" stroke="#6d5d45" stroke-width="1"/>';
    s += '<rect x="' + (cx - w / 2) + '" y="' + y + '" width="' + w + '" height="' + wallH + '" fill="url(#scWall)" stroke="#77634a" stroke-width="1"/>';
    s += '<rect x="' + (cx - w / 2) + '" y="' + y + '" width="' + w + '" height="6" fill="#6b563e" opacity=".5"/>';

    var cols = gate ? [cx - w / 2 + 12, cx + w / 2 - 19] : [cx - w / 2 + 8, cx - w / 2 + 24, cx + w / 2 - 29, cx + w / 2 - 13];
    for (var i = 0; i < cols.length; i++) {
      s += '<rect x="' + cols[i] + '" y="' + (y + 4) + '" width="6" height="' + (wallH - 4) + '" fill="#7c4b36" stroke="#553426" stroke-width=".6"/>';
      s += '<rect x="' + (cols[i] - 1) + '" y="' + (y + 8) + '" width="8" height="3" fill="#c9a45c" opacity=".7"/>';
    }

    var doorW = gate ? w * 0.44 : Math.min(44, w * 0.24);
    var doorH = gate ? wallH * 0.82 : Math.min(50, wallH * 0.64);
    var dx = cx - doorW / 2;
    var dy = groundY - doorH;
    s += '<rect x="' + dx + '" y="' + dy + '" width="' + doorW + '" height="' + doorH + '" fill="#2c2620" stroke="#a77b45" stroke-width="1.3"/>';
    s += '<path d="M' + (dx + 4) + ' ' + (dy + 6) + ' L' + (dx + doorW - 4) + ' ' + (dy + 6) + '" stroke="#c9a45c" stroke-opacity=".55" stroke-width="1"/>';

    var studs = '';
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 2; c++) {
        studs += '<circle cx="' + (cx - doorW * 0.22 + c * doorW * 0.44) + '" cy="' + (dy + 14 + r * 10) + '" r="1.5" fill="#d8b56a" opacity=".75"/>';
      }
    }
    s += studs;

    if (!gate) {
      var wy = y + wallH * 0.34;
      var wx = [cx - w / 2 + 20, cx + w / 2 - 48];
      for (var j = 0; j < wx.length; j++) {
        s += '<rect x="' + wx[j] + '" y="' + wy + '" width="28" height="22" fill="#6f8c7d" stroke="#594833" stroke-width="1"/>';
        s += '<path d="M' + (wx[j] + 7) + ' ' + wy + ' L' + (wx[j] + 7) + ' ' + (wy + 22) + ' M' + (wx[j] + 14) + ' ' + wy + ' L' + (wx[j] + 14) + ' ' + (wy + 22) + ' M' + (wx[j] + 21) + ' ' + wy + ' L' + (wx[j] + 21) + ' ' + (wy + 22) + '" stroke="#4e6459" stroke-width=".8" opacity=".8"/>';
      }
    }

    s += '<rect x="' + (cx - 27) + '" y="' + (y + 12) + '" width="54" height="17" fill="#345348" stroke="#c9a45c" stroke-width="1"/>';
    s += '<path d="M' + cx + ' ' + (y + 15) + ' L' + (cx + 5) + ' ' + (y + 20) + ' L' + cx + ' ' + (y + 25) + ' L' + (cx - 5) + ' ' + (y + 20) + ' Z" fill="#d8b56a"/>';

    s += roof(cx, y, w + 14, roofH, tone);

    if (gate) {
      s += '<path d="M' + (cx - 28) + ' ' + (groundY + 8) + ' L' + (cx + 28) + ' ' + (groundY + 8) + ' L' + (cx + 38) + ' ' + (groundY + 20) + ' L' + (cx - 38) + ' ' + (groundY + 20) + ' Z" fill="url(#scStone)" stroke="#7d6b50"/>';
      s += '<path d="M' + (cx - 22) + ' ' + (groundY + 8) + ' L' + (cx - 30) + ' ' + (groundY + 20) + ' M' + (cx + 22) + ' ' + (groundY + 8) + ' L' + (cx + 30) + ' ' + (groundY + 20) + '" stroke="#8d7a5c" stroke-width="1"/>';
    }

    s += lantern(cx - w / 2 + 18, groundY - 52, 1);
    s += lantern(cx + w / 2 - 18, groundY - 52, 1);
    return s;
  }

  function tower(cx, groundY, w, levels) {
    var s = '';
    var base = groundY;
    for (var i = 0; i < levels; i++) {
      var ww = w - i * 16;
      var wallH = 30;
      var roofH = 26;
      var y = base - wallH;
      s += '<rect x="' + (cx - ww / 2 - 8) + '" y="' + (base - 5) + '" width="' + (ww + 16) + '" height="5" fill="#8a7554" stroke="#5d4b35" stroke-width=".6"/>';
      s += '<rect x="' + (cx - ww / 2) + '" y="' + y + '" width="' + ww + '" height="' + wallH + '" fill="url(#scWall)" stroke="#77634a" stroke-width="1"/>';
      s += '<rect x="' + (cx - 9) + '" y="' + (y + 8) + '" width="18" height="' + (wallH - 10) + '" fill="#2f2a22" stroke="#a77b45" stroke-width="1"/>';
      s += roof(cx, y, ww + 10, roofH, 'jade');
      base = y - roofH + 7;
    }
    s += '<path d="M' + cx + ' ' + (base - 18) + ' L' + (cx + 4) + ' ' + (base - 4) + ' L' + cx + ' ' + (base + 4) + ' L' + (cx - 4) + ' ' + (base - 4) + ' Z" fill="#d8b56a"/>';
    return s;
  }

  function pine(x, groundY, s, extraClass) {
    var h = 96 * s;
    var out = '<g class="sc-pine ' + (extraClass || '') + '">';
    out += '<path d="M' + (x - 3 * s) + ' ' + groundY + ' Q' + (x - 2 * s) + ' ' + (groundY - h * 0.55) + ' ' + (x - 7 * s) + ' ' + (groundY - h) + ' L' + (x + 2 * s) + ' ' + (groundY - h * 0.9) + ' Q' + (x + 2 * s) + ' ' + (groundY - h * 0.45) + ' ' + (x + 4 * s) + ' ' + groundY + ' Z" fill="url(#scTrunk)"/>';

    var clusters = [
      [0, -0.96, 30, 11],
      [-18, -0.82, 34, 12],
      [17, -0.76, 32, 11],
      [-11, -0.62, 40, 13],
      [12, -0.54, 38, 12],
      [-2, -0.42, 46, 14]
    ];
    for (var i = 0; i < clusters.length; i++) {
      var c = clusters[i];
      var cx = x + c[0] * s;
      var cy = groundY + c[1] * h;
      var rx = c[2] * s;
      var ry = c[3] * s;
      out += '<path d="M' + (cx - rx) + ' ' + cy + ' Q' + (cx - rx * 0.45) + ' ' + (cy - ry * 1.7) + ' ' + cx + ' ' + (cy - ry) + ' Q' + (cx + rx * 0.5) + ' ' + (cy - ry * 1.6) + ' ' + (cx + rx) + ' ' + cy + ' Q' + (cx + rx * 0.35) + ' ' + (cy + ry * 0.55) + ' ' + cx + ' ' + (cy + ry * 0.2) + ' Q' + (cx - rx * 0.4) + ' ' + (cy + ry * 0.6) + ' ' + (cx - rx) + ' ' + cy + ' Z" fill="#31503f"/>';
      out += '<path d="M' + (cx - rx * 0.75) + ' ' + (cy - ry * 0.15) + ' Q' + (cx - rx * 0.2) + ' ' + (cy - ry * 1.2) + ' ' + (cx + rx * 0.2) + ' ' + (cy - ry * 0.7) + '" fill="none" stroke="#66835e" stroke-width="1.2" opacity=".55"/>';
    }
    out += '</g>';
    return out;
  }

  function rock(x, groundY, s) {
    var w = 58 * s;
    var h = 32 * s;
    return '<g class="sc-rock">' +
      '<path d="M' + (x - w / 2) + ' ' + groundY + ' L' + (x - w * 0.34) + ' ' + (groundY - h * 0.78) + ' L' + (x - w * 0.08) + ' ' + (groundY - h) + ' L' + (x + w * 0.2) + ' ' + (groundY - h * 0.86) + ' L' + (x + w * 0.42) + ' ' + (groundY - h * 0.38) + ' L' + (x + w / 2) + ' ' + groundY + ' Z" fill="url(#scRock)" stroke="#4d5848" stroke-width="1"/>' +
      '<path d="M' + (x - w * 0.28) + ' ' + (groundY - h * 0.7) + ' Q' + (x - w * 0.05) + ' ' + (groundY - h * 0.95) + ' ' + (x + w * 0.18) + ' ' + (groundY - h * 0.78) + '" fill="none" stroke="#c4c6ad" stroke-width="1.2" opacity=".5"/>' +
      '<path d="M' + (x - w * 0.35) + ' ' + (groundY - h * 0.1) + ' Q' + (x - w * 0.1) + ' ' + (groundY - h * 0.28) + ' ' + (x + w * 0.15) + ' ' + (groundY - h * 0.12) + '" fill="none" stroke="#70865c" stroke-width="2" opacity=".7"/>' +
      '</g>';
  }

  function bamboo(x, groundY, s) {
    var out = '<g class="sc-bamboo">';
    for (var i = 0; i < 3; i++) {
      var bx = x + i * 8 * s;
      var h = (78 + i * 13) * s;
      out += '<path d="M' + bx + ' ' + groundY + ' Q' + (bx - 4 * s) + ' ' + (groundY - h * 0.5) + ' ' + (bx + 3 * s) + ' ' + (groundY - h) + '" fill="none" stroke="#5f7d4f" stroke-width="' + (2.3 * s) + '"/>';
      for (var j = 1; j <= 3; j++) {
        var ly = groundY - h * (j / 3.4);
        out += '<path d="M' + bx + ' ' + ly + ' Q' + (bx + 14 * s) + ' ' + (ly - 8 * s) + ' ' + (bx + 24 * s) + ' ' + (ly - 2 * s) + ' Q' + (bx + 13 * s) + ' ' + (ly + 2 * s) + ' ' + bx + ' ' + ly + ' Z" fill="#6f8d55" opacity=".85"/>';
        out += '<path d="M' + bx + ' ' + (ly + 2) + ' Q' + (bx - 13 * s) + ' ' + (ly - 7 * s) + ' ' + (bx - 22 * s) + ' ' + (ly - 1 * s) + ' Q' + (bx - 12 * s) + ' ' + (ly + 3 * s) + ' ' + bx + ' ' + (ly + 2) + ' Z" fill="#7e9a62" opacity=".75"/>';
      }
    }
    out += '</g>';
    return out;
  }

  function bridge(x, y, s) {
    return '<g class="sc-bridge">' +
      '<path d="M' + (x - 42 * s) + ' ' + y + ' Q' + x + ' ' + (y - 30 * s) + ' ' + (x + 42 * s) + ' ' + y + '" fill="none" stroke="#876844" stroke-width="' + (8 * s) + '"/>' +
      '<path d="M' + (x - 42 * s) + ' ' + (y - 7 * s) + ' Q' + x + ' ' + (y - 38 * s) + ' ' + (x + 42 * s) + ' ' + (y - 7 * s) + '" fill="none" stroke="#b08b5c" stroke-width="' + (2 * s) + '"/>' +
      '<path d="M' + (x - 36 * s) + ' ' + (y - 2 * s) + ' L' + (x - 36 * s) + ' ' + (y - 22 * s) + ' M' + (x + 36 * s) + ' ' + (y - 2 * s) + ' L' + (x + 36 * s) + ' ' + (y - 22 * s) + '" stroke="#6f5438" stroke-width="' + (2 * s) + '"/>' +
      '<path d="M' + (x - 36 * s) + ' ' + (y - 22 * s) + ' L' + (x + 36 * s) + ' ' + (y - 22 * s) + '" stroke="#6f5438" stroke-width="' + (1.6 * s) + '"/>' +
      '</g>';
  }

  function cloud(x, y, rx, ry, opacity, cls) {
    return '<ellipse class="' + (cls || '') + '" cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="url(#scMist)" opacity="' + opacity + '" filter="url(#scBlur)"/>';
  }

  function crane(x, y, s, delay) {
    return '<g class="sc-crane" style="animation-delay:-' + delay + 's"><g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="M-16 0 Q-5 -8 7 0 Q-5 4 -16 0 Z" fill="#f7f1dd"/>' +
      '<path d="M7 0 Q15 -11 24 -4" fill="none" stroke="#f7f1dd" stroke-width="2.2"/>' +
      '<path d="M24 -4 L31 -7" fill="none" stroke="#c9a45c" stroke-width="1.6"/>' +
      '<path d="M-2 -2 Q-9 -15 -20 -10" fill="none" stroke="#f7f1dd" stroke-width="2.1"/>' +
      '<path d="M-2 -2 Q4 -16 14 -11" fill="none" stroke="#e8e1ca" stroke-width="1.8"/>' +
      '</g></g>';
  }

  function petal(x, y, s, delay) {
    return '<ellipse class="sc-petal" cx="' + x + '" cy="' + y + '" rx="' + (3.4 * s) + '" ry="' + (1.6 * s) + '" fill="#e7b4a0" opacity=".72" style="animation-delay:-' + delay + 's"/>';
  }

  function render() {
    var s = '';
    s += '<svg class="scenery-svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" role="img" aria-label="云海中的青崖山门，层叠殿宇、石阶、松林与瀑布">';
    s += '<defs>';
    s += '<linearGradient id="scSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8eed6"/><stop offset=".34" stop-color="#ece8cf"/><stop offset=".64" stop-color="#cfdcc6"/><stop offset="1" stop-color="#a6bea9"/></linearGradient>';
    s += '<radialGradient id="scSunHalo"><stop offset="0" stop-color="#fff8dd" stop-opacity=".95"/><stop offset=".45" stop-color="#f4d89c" stop-opacity=".32"/><stop offset="1" stop-color="#f4d89c" stop-opacity="0"/></radialGradient>';
    s += '<linearGradient id="scFar1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a4b8a6"/><stop offset="1" stop-color="#718b7b"/></linearGradient>';
    s += '<linearGradient id="scFar2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d9988"/><stop offset="1" stop-color="#4e6c5f"/></linearGradient>';
    s += '<linearGradient id="scMid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b7a68"/><stop offset="1" stop-color="#345247"/></linearGradient>';
    s += '<linearGradient id="scCliff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d9a78"/><stop offset=".55" stop-color="#4b5d4b"/><stop offset="1" stop-color="#2c4036"/></linearGradient>';
    s += '<linearGradient id="scMoss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9bb181"/><stop offset="1" stop-color="#6e8a63"/></linearGradient>';
    s += '<linearGradient id="scStone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d3c29c"/><stop offset="1" stop-color="#9c8965"/></linearGradient>';
    s += '<linearGradient id="scWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b7d8d1"/><stop offset="1" stop-color="#6fa09a"/></linearGradient>';
    s += '<linearGradient id="scWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2e7cf"/><stop offset="1" stop-color="#d9c9a9"/></linearGradient>';
    s += '<linearGradient id="scRoof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#476354"/><stop offset="1" stop-color="#22382f"/></linearGradient>';
    s += '<linearGradient id="scRoofRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a3543b"/><stop offset="1" stop-color="#6e3025"/></linearGradient>';
    s += '<linearGradient id="scRoofJade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f5f52"/><stop offset="1" stop-color="#1e352c"/></linearGradient>';
    s += '<linearGradient id="scTrunk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b4634"/><stop offset="1" stop-color="#2f251d"/></linearGradient>';
    s += '<linearGradient id="scRock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a9b86"/><stop offset="1" stop-color="#5d6253"/></linearGradient>';
    s += '<radialGradient id="scMist"><stop offset="0" stop-color="#fbf7e8" stop-opacity=".8"/><stop offset=".55" stop-color="#eef0dd" stop-opacity=".38"/><stop offset="1" stop-color="#eef0dd" stop-opacity="0"/></radialGradient>';
    s += '<filter id="scPaper"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="2" seed="8"/><feColorMatrix values=".3 0 0 0 .55 .3 0 0 0 .53 .3 0 0 0 .43 0 0 0 .11 0"/></filter>';
    s += '<filter id="scBlur" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="16"/></filter>';
    s += '<filter id="scBlurSoft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>';
    s += '<filter id="scGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
    s += '</defs>';

    s += '<rect width="1200" height="800" fill="url(#scSky)"/>';

    s += '<g class="sc-sun">';
    s += '<circle cx="930" cy="125" r="96" fill="url(#scSunHalo)"/>';
    s += '<circle cx="930" cy="125" r="34" fill="#fff7dc"/>';
    s += '<circle cx="930" cy="125" r="34" fill="none" stroke="#fffdf2" stroke-width="1.4" opacity=".7"/>';
    s += '<path d="M846 132 Q890 120 930 127 T1014 130" fill="none" stroke="#f4ecd4" stroke-width="5" opacity=".28"/>';
    s += '</g>';

    s += '<g class="sc-mobile-sun">';
    s += '<circle cx="760" cy="120" r="76" fill="url(#scSunHalo)"/>';
    s += '<circle cx="760" cy="120" r="25" fill="#fff7dc"/>';
    s += '<circle cx="760" cy="120" r="25" fill="none" stroke="#fffdf2" stroke-width="1.2" opacity=".7"/>';
    s += '</g>';

    s += '<g class="sc-far">';
    s += '<path d="M0 438 L70 378 L120 398 L190 332 L250 378 L320 348 L390 402 L460 356 L530 398 L610 338 L680 386 L750 350 L820 392 L890 342 L960 384 L1030 352 L1100 396 L1160 368 L1200 402 L1200 800 L0 800 Z" fill="url(#scFar1)" opacity=".62"/>';
    s += '<path d="M0 486 L60 444 L120 462 L190 408 L250 448 L330 414 L400 462 L480 420 L550 458 L630 410 L700 456 L780 424 L850 466 L930 420 L1000 458 L1080 432 L1140 466 L1200 438 L1200 800 L0 800 Z" fill="url(#scFar2)" opacity=".78"/>';
    s += '<path d="M0 464 Q120 414 206 438 T420 450 M520 454 Q655 409 770 442 T982 444 M1000 470 Q1094 430 1200 460" fill="none" stroke="#d9e0c9" stroke-width="3" opacity=".22"/>';
    s += '<path d="M190 332 L250 378 L320 348" fill="none" stroke="#e8efe1" stroke-width="1.2" opacity=".45"/>';
    s += '<path d="M610 338 L680 386 L750 350" fill="none" stroke="#e8efe1" stroke-width="1.2" opacity=".4"/>';
    s += '<path d="M890 342 L960 384 L1030 352" fill="none" stroke="#e8efe1" stroke-width="1.1" opacity=".35"/>';
    s += '</g>';

    s += '<g class="sc-peak">';
    s += '<path d="M470 520 L520 360 L555 260 L590 300 L625 210 L660 300 L700 260 L740 360 L790 520 Z" fill="url(#scMid)"/>';
    s += '<path d="M590 300 L625 210 L660 300 L640 336 Z" fill="#e4ebdb" opacity=".32"/>';
    s += '<path d="M520 360 L555 260 L590 300 L570 382 Z" fill="#f2f4e7" opacity=".18"/>';
    s += '<path d="M555 260 L590 300 L570 382 M625 210 L660 300 L640 336 M700 260 L740 360 L710 430" fill="none" stroke="#2f4a3f" stroke-width="1.1" opacity=".28"/>';
    s += '</g>';

    s += '<g class="sc-clouds">';
    s += cloud(280, 470, 230, 42, .55, 'sc-cloud-a');
    s += cloud(720, 505, 300, 48, .5, 'sc-cloud-b');
    s += cloud(1000, 458, 190, 36, .42, 'sc-cloud-c');
    s += cloud(460, 430, 150, 28, .35, '');
    s += '</g>';

    s += '<g class="sc-cranes">';
    s += crane(300, 220, .9, 2);
    s += crane(360, 188, .7, 6);
    s += crane(860, 250, .8, 9);
    s += '</g>';

    s += '<ellipse cx="600" cy="700" rx="450" ry="52" fill="#1b2f25" opacity=".22" filter="url(#scBlur)"/>';
    s += '<path d="M150 650 Q180 610 250 600 L950 600 Q1020 610 1050 650 L1010 770 Q980 795 900 798 L300 798 Q220 795 190 770 Z" fill="url(#scCliff)" stroke="#3f5142" stroke-width="1.5"/>';
    s += '<path d="M180 642 Q220 610 280 606 L920 606 Q980 610 1020 642 Q900 676 600 680 Q300 676 180 642 Z" fill="url(#scMoss)" stroke="#5f7a58" stroke-width="1.4"/>';
    s += '<path d="M196 644 Q300 620 422 632 M586 613 Q754 606 924 632 M220 678 Q372 690 486 680 M714 681 Q862 689 986 670" fill="none" stroke="#d2d2a2" stroke-width="1.1" opacity=".4"/>';
    s += '<path d="M220 704 Q600 676 980 704 M240 736 Q600 710 960 736" fill="none" stroke="#2e4337" stroke-width="1.4" opacity=".38"/>';
    s += '<path d="M230 660 Q238 700 232 742 M270 658 Q276 690 272 724 M960 660 Q952 700 958 736" fill="none" stroke="#6d8a5b" stroke-width="2" opacity=".65"/>';

    s += '<g class="sc-waterfall">';
    s += '<path d="M245 585 C260 625 250 665 275 700 C295 730 340 755 375 800" fill="none" stroke="url(#scWater)" stroke-width="26" opacity=".92"/>';
    s += '<path d="M245 585 C260 625 250 665 275 700 C295 730 340 755 375 800" fill="none" stroke="#d9eee7" stroke-width="3" opacity=".72" class="sc-water"/>';
    s += '<path d="M225 540 C235 590 230 640 245 690" fill="none" stroke="#e2f3ec" stroke-width="8" opacity=".76" class="sc-water"/>';
    s += '<path d="M232 548 C242 596 238 642 251 688" fill="none" stroke="#ffffff" stroke-width="2.2" opacity=".65" class="sc-water"/>';
    s += '<ellipse cx="270" cy="700" rx="40" ry="12" fill="#cfe6df" opacity=".55"/>';
    s += '<ellipse cx="272" cy="700" rx="24" ry="6" fill="#eef8f1" opacity=".4" class="sc-water"/>';
    s += '</g>';

    s += '<path d="M260 665 Q600 640 940 665 L920 690 Q600 715 280 690 Z" fill="#9caf86" stroke="#6f825f" stroke-width="1.1"/>';
    s += '<path d="M300 630 Q600 610 900 630 L880 650 Q600 670 320 650 Z" fill="#a9ba91" stroke="#748760" stroke-width="1"/>';
    s += '<path d="M280 690 Q600 716 920 690 M320 650 Q600 672 880 650" fill="none" stroke="#6f825f" stroke-width="1.2" opacity=".7"/>';

    s += '<path d="M545 800 L565 700 L635 700 L655 800 Z" fill="url(#scStone)" stroke="#7d6b50" stroke-width="1.2"/>';
    s += '<path d="M552 780 L648 780 M557 760 L643 760 M562 740 L638 740 M567 720 L633 720" fill="none" stroke="#8c7959" stroke-width="2" opacity=".7"/>';

    s += '<g class="sc-courtyard">';
    s += '<path d="M300 680 L300 656 Q300 649 308 649 L492 649 L492 680 Z" fill="url(#scWall)" stroke="#7a664c" stroke-width="1"/>';
    s += '<path d="M708 680 L708 649 L892 649 Q900 649 900 656 L900 680 Z" fill="url(#scWall)" stroke="#7a664c" stroke-width="1"/>';
    s += '<path d="M294 652 L498 652 M702 652 L906 652" fill="none" stroke="#345348" stroke-width="4"/>';
    s += '</g>';

    s += '<g class="sc-paving">';
    for (var px = 318; px <= 482; px += 28) {
      s += '<rect x="' + px + '" y="682" width="23" height="7" rx="2" fill="#c9b78d" opacity=".17"/>';
    }
    for (var px2 = 718; px2 <= 882; px2 += 28) {
      s += '<rect x="' + px2 + '" y="682" width="23" height="7" rx="2" fill="#c9b78d" opacity=".17"/>';
    }
    s += '</g>';

    s += '<g class="sc-buildings">';
    s += tower(900, 640, 92, 3);
    s += hall(380, 650, 118, 50, 42, { tone: 'jade' });
    s += hall(820, 650, 128, 52, 44, { tone: 'jade' });
    s += hall(610, 630, 250, 86, 64, { tone: 'jade' });
    s += hall(600, 705, 180, 64, 48, { tone: 'red', gate: true });
    s += '</g>';

    s += '<g class="sc-lions">';
    s += '<path d="M505 714 l-8 0 -3 12 6 0 1 -5 3 5 6 0 z" fill="#b6a27c" opacity=".9"/>';
    s += '<path d="M695 714 l8 0 3 12 -6 0 -1 -5 -3 5 -6 0 z" fill="#b6a27c" opacity=".9"/>';
    s += '</g>';

    s += bridge(315, 720, 1);

    s += '<g class="sc-foreground">';
    s += rock(230, 790, 1.1);
    s += rock(980, 790, 1);
    s += bamboo(1000, 730, .95);
    s += pine(160, 760, 1.25);
    s += pine(1040, 750, 1.15);
    s += pine(420, 790, .78);
    s += pine(760, 790, .72);
    s += '</g>';

    s += '<g class="sc-grass">';
    var tufts = [[210, 738, .9], [282, 756, .8], [360, 748, .75], [455, 742, .8], [720, 746, .8], [798, 758, .85], [884, 744, .75], [958, 762, .9]];
    for (var g = 0; g < tufts.length; g++) {
      s += grass(tufts[g][0], tufts[g][1], tufts[g][2]);
    }
    s += '</g>';
    s += stoneLantern(525, 742, .95);
    s += stoneLantern(675, 742, .95);

    s += '<rect width="1200" height="800" fill="#eadfc3" opacity=".16" filter="url(#scPaper)" pointer-events="none"/>';

    s += '<g class="sc-mobile">';
    s += pine(350, 800, .7);
    s += pine(850, 800, .65);
    s += rock(330, 800, .8);
    s += rock(870, 800, .75);
    s += '</g>';

    s += '<g class="sc-mist-bands">';
    s += '<ellipse class="sc-mist sc-mist-a" cx="420" cy="720" rx="360" ry="24" fill="#f7f2df" opacity=".2" filter="url(#scBlur)"/>';
    s += '<ellipse class="sc-mist sc-mist-b" cx="760" cy="690" rx="300" ry="20" fill="#f7f2df" opacity=".16" filter="url(#scBlur)"/>';
    s += '<ellipse class="sc-mist sc-mist-c" cx="600" cy="660" rx="380" ry="18" fill="#f7f2df" opacity=".12" filter="url(#scBlur)"/>';
    s += '</g>';

    s += '<g class="sc-petals">';
    s += petal(320, 560, 1, 1);
    s += petal(690, 520, .9, 4);
    s += petal(820, 610, 1.1, 7);
    s += petal(470, 660, .8, 3);
    s += petal(960, 560, .9, 9);
    s += petal(560, 480, .7, 6);
    s += '</g>';

    s += '</svg>';
    return s;
  }

  global.SectScenery = { render: render };
})(window);
