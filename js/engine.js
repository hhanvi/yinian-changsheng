/*
 * 一念长生 · 游戏引擎
 * 纯数据逻辑，不接触 DOM，便于测试。
 */
(function () {
  'use strict';

  var D = (typeof window !== 'undefined' && window.XianData) ? window.XianData : require('./data.js');

  var E = {};

  /* ------------------------------------------------------------------ */
  /* 基础工具                                                            */
  /* ------------------------------------------------------------------ */

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function rnd() { return Math.random(); }
  function randInt(lo, hi) { return Math.floor(rnd() * (hi - lo + 1)) + lo; }
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function round(v) { return Math.round(v); }
  function chance(p) { return rnd() < p; }
  function deepCopy(obj) { return JSON.parse(JSON.stringify(obj)); }

  function mergeMods(target, source) {
    if (!source) return target;
    Object.keys(source).forEach(function (k) {
      if (typeof source[k] === 'number') {
        target[k] = (target[k] || 0) + source[k];
      }
    });
    return target;
  }

  function hashString(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  E.util = {
    clamp: clamp, rnd: rnd, randInt: randInt, pick: pick, round: round, chance: chance,
    mergeMods: mergeMods, hashString: hashString, mulberry32: mulberry32
  };

  /* ------------------------------------------------------------------ */
  /* 境界与属性                                                          */
  /* ------------------------------------------------------------------ */

  E.stageInfo = function (state) {
    var p = state.player;
    var realm = D.REALMS[p.realm] || D.REALMS[D.REALMS.length - 1];
    var labels = D.LAYER_LABELS[realm.layers] || [''];
    var layerLabel = labels[p.layer] || '';
    var idx = 0;
    for (var i = 0; i < p.realm; i++) idx += D.REALMS[i].layers;
    idx += p.layer;
    var total = 0;
    D.REALMS.forEach(function (r) { total += r.layers; });
    return {
      realmIndex: p.realm,
      layer: p.layer,
      realm: realm,
      layerLabel: layerLabel,
      name: realm.name + layerLabel,
      short: realm.short,
      stage: idx,
      totalStages: total,
      isMajor: p.realm > 0 && p.layer === 0,
      isFinalLayer: p.realm === 8 && p.layer === 3,
      isMax: p.realm === D.REALMS.length - 1
    };
  };

  E.expNeed = function (state) {
    var p = state.player;
    var realm = D.REALMS[p.realm];
    if (!realm || p.realm >= D.REALMS.length - 1) return 1;
    return Math.max(1, Math.round(realm.baseNeed * (1 + p.layer * 0.30)));
  };

  E.derived = function (state) {
    var p = state.player;
    var mods = {};
    mergeMods(mods, p.mods);
    var tech = D.TECHNIQUES[p.technique] || D.TECHNIQUES.yinqi;
    mergeMods(mods, tech.mods);
    mods.cult = (mods.cult || 0) + (tech.cult || 0);
    ['weapon', 'armor', 'accessory'].forEach(function (slot) {
      var id = p.equipment[slot];
      if (id && D.ITEMS[id]) mergeMods(mods, D.ITEMS[id].mods);
    });

    var base = p.base;
    var hpMax = Math.max(1, round(base.hp * (1 + (mods.hpPct || 0)) + (mods.hp || 0)));
    var mpMax = Math.max(1, round(base.mp * (1 + (mods.mpPct || 0)) + (mods.mp || 0)));
    var atk = Math.max(1, round(base.atk * (1 + (mods.atkPct || 0)) + (mods.atk || 0)));
    var def = Math.max(0, round(base.def * (1 + (mods.defPct || 0)) + (mods.def || 0)));
    var sense = Math.max(1, round(base.sense * (1 + (mods.sensePct || 0)) + (mods.sense || 0)));
    var comp = Math.max(1, round(base.comp * (1 + (mods.compPct || 0)) + (mods.comp || 0)));
    var luck = Math.max(0, round(base.luck * (1 + (mods.luckPct || 0)) + (mods.luck || 0)));
    var rate = clamp(0.15 + comp * 0.004 + (mods.cult || 0), 0.12, 0.62);
    var crit = clamp(0.05 + (mods.crit || 0) + luck * 0.0025, 0, 0.65);

    var skill = tech.skill ? D.SKILLS[tech.skill] : null;

    return {
      hpMax: hpMax,
      mpMax: mpMax,
      atk: atk,
      def: def,
      sense: sense,
      comp: comp,
      luck: luck,
      rate: rate,
      crit: crit,
      heal: mods.heal || 0,
      battleReward: mods.battleReward || 0,
      alchemy: mods.alchemy || 0,
      mods: mods,
      technique: tech,
      skill: skill
    };
  };

  E.clampVitals = function (state) {
    var p = state.player;
    var d = E.derived(state);
    p.hp = clamp(round(p.hp), 0, d.hpMax);
    p.mp = clamp(round(p.mp), 0, d.mpMax);
    return d;
  };

  E.dateInfo = function (state) {
    var base = 16 * 12;
    var elapsed = Math.max(0, state.player.ageMonths - base);
    return {
      year: Math.floor(elapsed / 12) + 1,
      month: (elapsed % 12) + 1,
      label: '天元' + (Math.floor(elapsed / 12) + 1) + '年 · ' + ((elapsed % 12) + 1) + '月'
    };
  };

  E.age = function (state) {
    return Math.floor(state.player.ageMonths / 12);
  };

  /* ------------------------------------------------------------------ */
  /* 新游戏                                                              */
  /* ------------------------------------------------------------------ */

  E.randomName = function () {
    return pick(D.SURNAMES) + pick(D.GIVEN_NAMES);
  };

  E.getMeta = function () {
    try {
      var raw = localStorage.getItem(D.META_KEY);
      if (!raw) return { ascensions: 0, bestRealm: 0, lastName: '' };
      var m = JSON.parse(raw);
      return { ascensions: m.ascensions || 0, bestRealm: m.bestRealm || 0, lastName: m.lastName || '' };
    } catch (e) {
      return { ascensions: 0, bestRealm: 0, lastName: '' };
    }
  };

  E.saveMeta = function (meta) {
    try { localStorage.setItem(D.META_KEY, JSON.stringify(meta)); } catch (e) { /* ignore */ }
  };

  E.newGame = function (opts) {
    opts = opts || {};
    var root = D.ROOTS[opts.root] || D.ROOTS.fire;
    var origin = D.ORIGINS[opts.origin] || D.ORIGINS.orphan;
    var daoheart = D.DAOHEARTS[opts.daoheart] || D.DAOHEARTS.longevity;
    var meta = E.getMeta();
    var legacy = Math.min(9, meta.ascensions || 0);

    var p = {
      name: (opts.name || E.randomName()).slice(0, 8),
      root: root.key,
      origin: origin.key,
      daoheart: daoheart.key,
      realm: 0,
      layer: 0,
      exp: 0,
      ageMonths: 16 * 12,
      lifespan: 80,
      base: { hp: 100, mp: 50, atk: 14, def: 7, sense: 6, comp: 6, luck: 5 },
      hp: 1,
      mp: 1,
      stones: 0,
      mods: {},
      learned: ['yinqi'],
      technique: 'yinqi',
      equipment: { weapon: null, armor: null, accessory: null },
      inventory: [],
      breakthroughBuff: 0,
      ascended: false,
      dead: false,
      flags: {}
    };

    /* 灵根、出身、道心 */
    [root, origin, daoheart].forEach(function (src) {
      E.applyPermanentMods(p, src.mods, true);
    });

    /* 轮回印记 */
    if (legacy > 0) {
      p.base.comp += legacy;
      p.base.luck += legacy;
      p.stones += 50 * legacy;
    }
    p.stones += origin.stones || 0;

    (origin.items || []).forEach(function (it) { E.addItemTo(p, it.id, it.qty); });

    var state = {
      version: D.VERSION,
      createdAt: Date.now(),
      seed: String(Date.now()) + '-' + Math.floor(rnd() * 1e9),
      player: p,
      world: {
        marketBucket: -1,
        marketSeed: 0,
        stock: [],
        recentEvents: [],
        currentRegion: 'luoxia'
      },
      stats: {
        meditations: 0, closed: 0, explorations: 0, battles: 0, wins: 0,
        defeats: 0, breakthroughs: 0, events: 0, crafts: 0, itemsUsed: 0, ascensions: 0
      },
      achievements: {},
      journal: [],
      ended: null
    };

    var d = E.clampVitals(state);
    p.hp = d.hpMax;
    p.mp = d.mpMax;

    E.log(state, '你自凡尘中醒来，灵根初显，仙途始于今日。', 'system');
    E.ensureMarket(state);
    E.checkAchievements(state);
    return state;
  };

  E.applyPermanentMods = function (p, mods, storePct) {
    if (!mods) return;
    ['hp', 'mp', 'atk', 'def', 'sense', 'comp', 'luck'].forEach(function (k) {
      if (mods[k]) p.base[k] += mods[k];
    });
    if (mods.life) p.lifespan += mods.life;
    if (storePct) {
      Object.keys(mods).forEach(function (k) {
        if (['hp', 'mp', 'atk', 'def', 'sense', 'comp', 'luck', 'life'].indexOf(k) === -1) {
          p.mods[k] = (p.mods[k] || 0) + mods[k];
        }
      });
    }
  };

  /* ------------------------------------------------------------------ */
  /* 物品                                                                */
  /* ------------------------------------------------------------------ */

  E.countItem = function (state, id) {
    var n = 0;
    state.player.inventory.forEach(function (it) { if (it.id === id) n += it.qty; });
    return n;
  };

  E.addItemTo = function (p, id, qty) {
    if (!D.ITEMS[id]) return;
    qty = qty || 1;
    var entry = p.inventory.find(function (it) { return it.id === id; });
    if (entry) entry.qty += qty;
    else p.inventory.push({ id: id, qty: qty });
  };

  E.addItem = function (state, id, qty) {
    E.addItemTo(state.player, id, qty || 1);
  };

  E.removeItem = function (state, id, qty) {
    qty = qty || 1;
    if (E.countItem(state, id) < qty) return false;
    var left = qty;
    for (var i = state.player.inventory.length - 1; i >= 0; i--) {
      var it = state.player.inventory[i];
      if (it.id !== id) continue;
      var take = Math.min(left, it.qty);
      it.qty -= take;
      left -= take;
      if (it.qty <= 0) state.player.inventory.splice(i, 1);
      if (left <= 0) break;
    }
    return true;
  };

  E.marketPrice = function (state, item) {
    var mult = Math.pow(1.6, state.player.realm);
    return Math.max(1, Math.round(item.price * mult));
  };

  E.sellPrice = function (state, item) {
    return Math.max(1, Math.round(E.marketPrice(state, item) * 0.35));
  };

  E.useItem = function (state, id) {
    var p = state.player;
    if (state.ended) return { ok: false, error: '此身已了，万事皆空。' };
    var item = D.ITEMS[id];
    if (!item || item.type !== 'pill') return { ok: false, error: '此物不可服用。' };
    if (E.countItem(state, id) < 1) return { ok: false, error: '行囊中没有此物。' };

    var d = E.derived(state);
    var eff = item.effect || {};
    var text = '';
    if (eff.type === 'exp' && p.exp >= E.expNeed(state)) {
      return { ok: false, error: '修为已满，先冲关吧。' };
    }
    if (eff.type === 'exp') {
      var gain = Math.round(E.expNeed(state) * eff.value);
      var added = E.addExp(state, gain);
      text = '药力化开，修为增加 ' + added + ' 点。';
    } else if (eff.type === 'heal') {
      var heal = Math.round(d.hpMax * eff.value * (1 + d.heal));
      var before = p.hp;
      p.hp = Math.min(d.hpMax, p.hp + heal);
      text = '气血恢复了 ' + (p.hp - before) + ' 点。';
    } else if (eff.type === 'mana') {
      var mana = Math.round(d.mpMax * eff.value);
      var beforeMp = p.mp;
      p.mp = Math.min(d.mpMax, p.mp + mana);
      text = '灵力恢复了 ' + (p.mp - beforeMp) + ' 点。';
    } else if (eff.type === 'perm') {
      p.base[eff.stat] = (p.base[eff.stat] || 0) + eff.value;
      text = '你只觉筋骨一轻，' + ({ comp: '悟性', sense: '神识', luck: '气运', hp: '根骨' }[eff.stat] || '根基') + ' 永久增加了 ' + eff.value + ' 点。';
      E.clampVitals(state);
    } else if (eff.type === 'breakthrough') {
      p.breakthroughBuff += eff.value;
      text = '一股锋锐之气沉入丹田，下次突破成功率增加了 ' + Math.round(eff.value * 100) + '%。';
    } else if (eff.type === 'fullHeal') {
      p.hp = d.hpMax;
      p.mp = Math.min(d.mpMax, p.mp + Math.round(d.mpMax * eff.value));
      text = '生死人肉白骨，你只觉四肢百骸重新充满了力气。';
    }

    E.removeItem(state, id, 1);
    state.stats.itemsUsed += 1;
    E.log(state, '你服下了「' + item.name + '」。' + text, 'loot');
    var unlocked = E.checkAchievements(state);
    return { ok: true, text: text, achievements: unlocked };
  };

  E.equipItem = function (state, id) {
    var p = state.player;
    if (state.ended) return { ok: false, error: '仙途已断。' };
    var item = D.ITEMS[id];
    if (!item || item.type !== 'equip') return { ok: false, error: '此物不可装备。' };
    if (E.countItem(state, id) < 1) return { ok: false, error: '行囊中没有此物。' };
    var slot = item.slot;
    var old = p.equipment[slot];
    E.removeItem(state, id, 1);
    if (old) E.addItem(state, old, 1);
    p.equipment[slot] = id;
    E.clampVitals(state);
    E.log(state, '你装上了「' + item.name + '」。', 'system');
    return { ok: true, old: old };
  };

  E.unequipItem = function (state, slot) {
    var p = state.player;
    if (state.ended) return { ok: false, error: '仙途已断。' };
    var id = p.equipment[slot];
    if (!id) return { ok: false, error: '该位置没有装备。' };
    p.equipment[slot] = null;
    E.addItem(state, id, 1);
    E.clampVitals(state);
    E.log(state, '你取下了「' + D.ITEMS[id].name + '」。', 'system');
    return { ok: true };
  };

  E.equipTechnique = function (state, id) {
    var p = state.player;
    if (state.ended) return { ok: false, error: '仙途已断。' };
    if (p.learned.indexOf(id) === -1) return { ok: false, error: '你尚未参悟这门功法。' };
    p.technique = id;
    E.clampVitals(state);
    E.log(state, '你改修「' + D.TECHNIQUES[id].name + '」。', 'system');
    return { ok: true };
  };

  /* ------------------------------------------------------------------ */
  /* 修为与时间                                                          */
  /* ------------------------------------------------------------------ */

  E.addExp = function (state, amount) {
    var p = state.player;
    var need = E.expNeed(state);
    var before = p.exp;
    p.exp = clamp(p.exp + amount, 0, need);
    return Math.round(p.exp - before);
  };

  E.advanceTime = function (state, months) {
    var p = state.player;
    if (state.ended) return false;
    p.ageMonths += months;
    if (p.ageMonths >= p.lifespan * 12) {
      p.dead = true;
      state.ended = 'death';
      E.log(state, '油尽灯枯。你在蒲团上缓缓闭上眼，这一世的长生路，到此为止。', 'system');
      return true;
    }
    return false;
  };

  E.log = function (state, text, type) {
    state.journal.unshift({
      date: E.dateInfo(state).label,
      text: text,
      type: type || 'system',
      ts: Date.now()
    });
    if (state.journal.length > 120) state.journal.length = 120;
  };

  E.meditate = function (state) {
    var p = state.player;
    if (state.ended) return { ok: false, error: '仙途已断。' };
    if (p.exp >= E.expNeed(state)) return { ok: false, error: '修为已满，先冲关吧。' };
    var d = E.derived(state);
    var need = E.expNeed(state);
    var gain = Math.round(need * d.rate);
    var special = '';
    var extra = 0;

    if (chance(0.06)) {
      gain = Math.round(gain * 1.8);
      special = '你忽然心有所感，仿佛听见天地间一声轻鸣。';
    } else if (chance(0.035)) {
      gain = Math.round(gain * 0.45);
      var hurt = Math.round(d.hpMax * 0.10);
      p.hp = Math.max(1, p.hp - hurt);
      special = '灵气行至岔脉，你眼前浮现出许多故人面孔。你咬破舌尖，强行收功，仍受了些伤。';
    }

    var added = E.addExp(state, gain);
    state.stats.meditations += 1;
    E.advanceTime(state, 1);

    E.log(state, '你在静室中打坐一月，修为增加 ' + added + ' 点。' + special, 'cultivate');
    var unlocked = E.checkAchievements(state);
    return { ok: true, gain: added, need: need, special: special, achievements: unlocked, ended: state.ended };
  };

  E.closedCultivation = function (state) {
    var p = state.player;
    if (state.ended) return { ok: false, error: '仙途已断。' };
    if (p.exp >= E.expNeed(state)) return { ok: false, error: '修为已满，先冲关吧。' };
    var d = E.derived(state);
    var need = E.expNeed(state);
    var gain = Math.round(need * d.rate * 6 * 0.72);
    var special = '';
    var risk = clamp(0.22 - d.comp * 0.004, 0.05, 0.22);

    if (chance(risk)) {
      gain = Math.round(gain * 0.30);
      var hurt = Math.round(d.hpMax * 0.22);
      p.hp = Math.max(1, p.hp - hurt);
      special = '闭关至第三月，心魔骤起。你在幻境中厮杀许久，醒来时浑身冷汗，经脉隐隐作痛。';
    } else {
      special = '你封门闭户，静坐六月。再睁眼时，窗外已是另一季。';
    }

    var added = E.addExp(state, gain);
    state.stats.closed += 1;
    E.advanceTime(state, 6);

    E.log(state, '你闭关六月，修为增加 ' + added + ' 点。' + special, 'cultivate');
    var unlocked = E.checkAchievements(state);
    return { ok: true, gain: added, need: need, special: special, achievements: unlocked, ended: state.ended };
  };

  E.breakthroughChance = function (state, usePill) {
    var p = state.player;
    var d = E.derived(state);
    var info = E.stageInfo(state);
    var c = 0.82 - p.realm * 0.022 - (info.isMajor ? 0.06 : 0) + d.comp * 0.0035 + d.luck * 0.0025 + p.breakthroughBuff;
    if (usePill && E.countItem(state, 'pojing') > 0) c += 0.25;
    return clamp(c, 0.25, 0.95);
  };

  E.breakthrough = function (state, usePill) {
    var p = state.player;
    if (state.ended) return { ok: false, error: '仙途已断。' };
    var need = E.expNeed(state);
    if (p.exp < need) return { ok: false, error: '修为尚未圆满，不可强行突破。' };
    var info = E.stageInfo(state);
    if (info.isMax) return { ok: false, error: '你已身在仙界。' };

    var usedPill = false;
    var finalChance = E.breakthroughChance(state, false);
    if (usePill && E.countItem(state, 'pojing') > 0) {
      E.removeItem(state, 'pojing', 1);
      usedPill = true;
      finalChance = clamp(finalChance + 0.25, 0.25, 0.95);
    }

    if (E.advanceTime(state, 1)) {
      return { ok: false, error: '寿元已尽，你再也没有睁开眼。', ended: true };
    }
    var roll = rnd();
    var success = roll < finalChance;

    if (!success) {
      p.exp = Math.max(0, Math.round(p.exp * 0.72));
      p.hp = Math.max(1, Math.round(p.hp * 0.80));
      p.breakthroughBuff = Math.min(0.3, p.breakthroughBuff + 0.05);
      var failText = '你冲关失败。气机反噬，经脉受损，修为倒退了一截。但你隐约摸到了那层壁障的脉络。';
      E.log(state, failText, 'breakthrough');
      var unlockedFail = E.checkAchievements(state);
      return { ok: true, success: false, chance: finalChance, text: failText, usedPill: usedPill, achievements: unlockedFail };
    }

    p.breakthroughBuff = 0;
    state.stats.breakthroughs += 1;

    if (info.isFinalLayer) {
      /* 渡劫飞升：先迎天劫 */
      var trib = E.startBattle(state, 'tianjie', 'jiuyou', { tribulation: true, noElite: true });
      var tribText = '你的气息终于触到了那层天幕。乌云自四方汇聚，雷声在云层深处滚动。你抬头望去，一道由雷光凝成的人形正缓缓下降。';
      E.log(state, tribText, 'breakthrough');
      return { ok: true, success: true, chance: finalChance, text: tribText, usedPill: usedPill, tribulation: true, battle: trib };
    }

    var lifeBefore = p.lifespan;
    E.advanceStage(state);
    var lifeGain = Math.max(0, Math.round(p.lifespan - lifeBefore));
    var newInfo = E.stageInfo(state);
    var successText = '壁障应声而碎。你周身气息暴涨，正式踏入「' + newInfo.name + '」。寿元增加了 ' + lifeGain + ' 年。';
    E.log(state, successText, 'breakthrough');
    var unlocked = E.checkAchievements(state);
    return {
      ok: true, success: true, chance: finalChance, text: successText,
      usedPill: usedPill, stage: newInfo, achievements: unlocked
    };
  };

  E.advanceStage = function (state) {
    var p = state.player;
    var oldRealm = D.REALMS[p.realm];
    if (p.layer < oldRealm.layers - 1) {
      p.layer += 1;
      p.base.hp *= 1.05;
      p.base.mp *= 1.05;
      p.base.atk *= 1.045;
      p.base.def *= 1.04;
      p.base.sense *= 1.03;
      p.base.comp *= 1.01;
      p.lifespan += 2;
    } else {
      p.realm += 1;
      p.layer = 0;
      var newRealm = D.REALMS[p.realm];
      var mult = newRealm.mult || 1.5;
      ['hp', 'mp', 'atk', 'def', 'sense', 'comp'].forEach(function (k) {
        p.base[k] *= mult;
      });
      ['hp', 'mp', 'atk', 'def', 'sense', 'comp'].forEach(function (k) {
        p.base[k] += newRealm.flat[k] || 0;
      });
      p.lifespan += newRealm.life || 0;
    }
    p.exp = 0;
    var d = E.derived(state);
    p.hp = d.hpMax;
    p.mp = d.mpMax;
  };

  E.ascend = function (state) {
    var p = state.player;
    if (p.ascended) return;
    p.realm = D.REALMS.length - 1;
    p.layer = 0;
    p.exp = 0;
    p.ascended = true;
    state.ended = 'ascended';
    state.stats.ascensions += 1;
    var d = E.derived(state);
    p.hp = d.hpMax;
    p.mp = d.mpMax;
    E.log(state, '九霄雷散，天门洞开。你踏碎最后一道壁障，衣袂在云海中猎猎作响。从此人间少了一个修士，天上多了一位仙人。', 'system');
    var meta = E.getMeta();
    meta.ascensions = (meta.ascensions || 0) + 1;
    meta.bestRealm = 9;
    meta.lastName = p.name;
    E.saveMeta(meta);
    E.checkAchievements(state);
  };

  /* ------------------------------------------------------------------ */
  /* 历练与事件                                                          */
  /* ------------------------------------------------------------------ */

  E.availableRegions = function (state) {
    return D.REGIONS.filter(function (r) { return state.player.realm >= r.unlockRealm; });
  };

  E.pickEvent = function (state, regionId) {
    var recent = state.world.recentEvents || [];
    var regionEvents = D.EVENTS.filter(function (ev) {
      return ev.region === regionId;
    });
    var anyEvents = D.EVENTS.filter(function (ev) { return ev.region === 'any'; });
    var pool = chance(0.22) && anyEvents.length ? anyEvents : regionEvents;
    var weighted = pool.map(function (ev) {
      var w = ev.weight || 8;
      if (recent.indexOf(ev.id) !== -1) w *= 0.35;
      return { ev: ev, w: w };
    });
    var total = weighted.reduce(function (s, x) { return s + x.w; }, 0);
    var roll = rnd() * total;
    var chosen = weighted[0] ? weighted[0].ev : D.EVENTS[0];
    for (var i = 0; i < weighted.length; i++) {
      roll -= weighted[i].w;
      if (roll <= 0) { chosen = weighted[i].ev; break; }
    }
    return chosen;
  };

  E.explore = function (state, regionId) {
    var p = state.player;
    if (state.ended) return { ok: false, error: '仙途已断。' };
    var region = D.REGIONS.find(function (r) { return r.id === regionId; });
    if (!region) return { ok: false, error: '此地不存在。' };
    if (p.realm < region.unlockRealm) return { ok: false, error: '修为不足，贸然前往恐有性命之忧。' };

    state.world.currentRegion = regionId;
    E.advanceTime(state, region.cost);
    if (state.ended) return { ok: false, error: '岁月不饶人。', ended: state.ended };

    state.stats.explorations += 1;
    state.stats.events += 1;
    var ev = E.pickEvent(state, regionId);
    state.world.recentEvents = [ev.id].concat(state.world.recentEvents || []).slice(0, 6);
    E.log(state, '你前往「' + region.name + '」历练。' + region.flavor, 'explore');
    return { ok: true, event: ev, region: region };
  };

  E.choiceAvailability = function (state, choice) {
    if (!choice.req) return { ok: true };
    if (choice.req.item) {
      var have = E.countItem(state, choice.req.item);
      if (have < (choice.req.qty || 1)) {
        return { ok: false, reason: '缺少「' + D.ITEMS[choice.req.item].name + '」×' + (choice.req.qty || 1) };
      }
    }
    if (choice.req.stones && state.player.stones < choice.req.stones) {
      return { ok: false, reason: '灵石不足' };
    }
    return { ok: true };
  };

  E.checkChance = function (state, check) {
    var d = E.derived(state);
    var val = d[check.stat] || 0;
    var c = 0.70 + (val - check.dc) * 0.05 + d.luck * 0.005;
    return clamp(c, 0.20, 0.95);
  };

  E.resolveChoice = function (state, event, choiceIndex) {
    if (state.ended) return { ok: false, error: '仙途已断。' };
    var choice = event.choices[choiceIndex];
    if (!choice) return { ok: false, error: '此路不通。' };
    var avail = E.choiceAvailability(state, choice);
    if (!avail.ok) return { ok: false, error: avail.reason };

    var outcome = choice.outcome;
    var checked = null;
    var success = null;
    var chanceValue = null;
    if (choice.check) {
      chanceValue = E.checkChance(state, choice.check);
      success = rnd() < chanceValue;
      outcome = success ? choice.success : choice.fail;
      checked = choice.check;
    }
    if (!outcome) return { ok: false, error: '无事发生。' };

    var result = E.applyOutcome(state, outcome, event);
    E.checkAchievements(state);
    return {
      ok: true,
      text: result.text,
      gains: result.gains,
      combat: result.combat,
      success: success,
      chance: chanceValue,
      checked: checked
    };
  };

  E.applyOutcome = function (state, outcome, event) {
    var p = state.player;
    var d = E.derived(state);
    var gains = [];
    var text = outcome.text || '';

    if (outcome.consume) {
      outcome.consume.forEach(function (c) { E.removeItem(state, c.id, c.qty || 1); });
    }
    if (outcome.exp) {
      var amount = outcome.exp > 0 ? Math.round(E.expNeed(state) * outcome.exp) : outcome.exp;
      if (amount > 0) {
        var added = E.addExp(state, amount);
        if (added) gains.push('修为 +' + added);
      } else {
        var lost = E.addExp(state, amount);
        if (lost) gains.push('修为 ' + lost);
      }
    }
    if (outcome.stones) {
      var stones = Math.round(outcome.stones * Math.pow(1.9, p.realm));
      if (stones >= 0) {
        p.stones += stones;
        gains.push('灵石 +' + stones);
      } else {
        var loss = Math.min(p.stones, -stones);
        p.stones -= loss;
        gains.push('灵石 -' + loss);
      }
    }
    if (outcome.stonesPct) {
      var delta = Math.round(p.stones * outcome.stonesPct);
      if (delta >= 0) { p.stones += delta; gains.push('灵石 +' + delta); }
      else { var take = Math.min(p.stones, -delta); p.stones -= take; gains.push('灵石 -' + take); }
    }
    if (outcome.hp) {
      var hpDelta = Math.round(d.hpMax * outcome.hp);
      if (hpDelta >= 0) {
        var before = p.hp;
        p.hp = Math.min(d.hpMax, p.hp + hpDelta);
        if (p.hp > before) gains.push('气血 +' + (p.hp - before));
      } else {
        p.hp = Math.max(1, p.hp + hpDelta);
        gains.push('气血 ' + hpDelta);
      }
    }
    if (outcome.mp) {
      var mpDelta = Math.round(d.mpMax * outcome.mp);
      if (mpDelta >= 0) {
        var beforeMp = p.mp;
        p.mp = Math.min(d.mpMax, p.mp + mpDelta);
        if (p.mp > beforeMp) gains.push('灵力 +' + (p.mp - beforeMp));
      } else {
        p.mp = Math.max(0, p.mp + mpDelta);
        gains.push('灵力 ' + mpDelta);
      }
    }
    if (outcome.items) {
      outcome.items.forEach(function (it) {
        E.addItem(state, it.id, it.qty || 1);
        gains.push('获得「' + D.ITEMS[it.id].name + '」×' + (it.qty || 1));
      });
    }
    if (outcome.stats) {
      Object.keys(outcome.stats).forEach(function (k) {
        var v = outcome.stats[k];
        p.base[k] = (p.base[k] || 0) + v;
        if (k === 'hp') p.hp += v;
        gains.push(({ comp: '悟性', sense: '神识', luck: '气运', hp: '根骨', atk: '攻击', def: '防御' }[k] || k) + (v > 0 ? ' +' : ' ') + v);
      });
      E.clampVitals(state);
    }
    if (outcome.mods) {
      E.applyPermanentMods(p, outcome.mods, true);
      E.clampVitals(state);
      var modLabels = { hpPct: '气血上限', mpPct: '灵力上限', atkPct: '攻击', defPct: '防御', sensePct: '神识', compPct: '悟性', cult: '修炼速度', crit: '暴击', heal: '疗伤' };
      Object.keys(outcome.mods).forEach(function (k) {
        var v = outcome.mods[k];
        gains.push((modLabels[k] || k) + ' +' + Math.round(v * 100) + '%');
      });
    }
    if (outcome.lifespan) {
      p.lifespan += outcome.lifespan;
      gains.push('寿元 +' + outcome.lifespan);
    }
    if (outcome.technique) {
      if (p.learned.indexOf(outcome.technique) === -1) {
        p.learned.push(outcome.technique);
        var tech = D.TECHNIQUES[outcome.technique];
        gains.push('参悟「' + tech.name + '」');
        if (tech.cult > (D.TECHNIQUES[p.technique] || {}).cult) {
          p.technique = outcome.technique;
          gains.push('已转修此功法');
        }
        E.clampVitals(state);
      } else {
        var expGain = Math.round(E.expNeed(state) * 0.2);
        E.addExp(state, expGain);
        gains.push('修为 +' + expGain);
      }
    }
    if (outcome.flag) p.flags[outcome.flag] = true;

    var combat = null;
    if (outcome.combat) {
      combat = E.startBattle(state, outcome.combat, state.world.currentRegion || 'luoxia');
    }

    if (text) E.log(state, '【' + (event ? event.name : '奇遇') + '】' + text, 'explore');
    return { text: text, gains: gains, combat: combat };
  };

  /* ------------------------------------------------------------------ */
  /* 战斗                                                                */
  /* ------------------------------------------------------------------ */

  E.startBattle = function (state, enemyId, regionId, opts) {
    opts = opts || {};
    var p = state.player;
    var d = E.derived(state);
    var base = D.ENEMIES[enemyId];
    if (!base) return null;
    var region = D.REGIONS.find(function (r) { return r.id === regionId; }) || D.REGIONS[0];
    var overLevel = Math.max(0, p.realm - region.tier);
    var scale = Math.pow(0.78, overLevel);
    var elite = !opts.noElite && !base.boss && chance(0.10);
    var eliteMul = elite ? 1.28 : 1;

    var enemy = {
      id: enemyId,
      name: (elite ? '精英·' : '') + base.name,
      baseName: base.name,
      glyph: base.glyph,
      desc: base.desc,
      hp: Math.max(1, round(d.hpMax * base.hp * scale * eliteMul)),
      atk: Math.max(1, round(d.atk * base.atk * scale * eliteMul)),
      def: Math.max(0, round(d.atk * base.def * scale * eliteMul)),
      elite: elite,
      boss: !!base.boss,
      tribulation: !!base.tribulation,
      rewardExp: base.exp,
      rewardStones: base.stones,
      drops: base.drops || []
    };
    enemy.hpMax = enemy.hp;

    state.battle = {
      enemy: enemy,
      regionId: regionId,
      shield: 0,
      turn: 1,
      over: false,
      result: null,
      rewards: null,
      log: [
        { text: '你遭遇了「' + enemy.name + '」。' + enemy.desc, type: 'system' }
      ]
    };
    state.stats.battles += 1;
    E.log(state, '你与「' + enemy.name + '」交上了手。', 'battle');
    return state.battle;
  };

  E.battle = function (state) {
    return state.battle || null;
  };

  function pushBattleLog(battle, text, type) {
    battle.log.push({ text: text, type: type || 'system' });
    if (battle.log.length > 40) battle.log.splice(0, battle.log.length - 40);
  }

  function damageCalc(atk, power, targetDef, critChance) {
    var raw = atk * power * (0.90 + rnd() * 0.20);
    raw *= 1 - targetDef / (targetDef + atk * 1.8);
    var crit = rnd() < critChance;
    if (crit) raw *= 1.65;
    return { damage: Math.max(1, round(raw)), crit: crit };
  }

  E.battleAction = function (state, action, payload) {
    var b = state.battle;
    var p = state.player;
    if (!b || b.over) return { ok: false, error: '战斗已经结束。' };
    var d = E.derived(state);
    var enemy = b.enemy;

    /* 每回合恢复少量灵力 */
    p.mp = Math.min(d.mpMax, p.mp + Math.max(1, round(d.mpMax * 0.02)));

    var text = '';
    if (action === 'attack') {
      var r = damageCalc(d.atk, 1.0, enemy.def, d.crit);
      enemy.hp = Math.max(0, enemy.hp - r.damage);
      pushBattleLog(b, pick(D.BATTLE_FLAVOR.playerAttack) + '造成 ' + r.damage + ' 点伤害。', 'player');
      if (r.crit) pushBattleLog(b, pick(D.BATTLE_FLAVOR.crit), 'crit');
    } else if (action === 'skill') {
      var skill = d.skill;
      if (!skill) return { ok: false, error: '你没有可用的术法。' };
      if (p.mp < skill.cost) return { ok: false, error: '灵力不足。' };
      p.mp -= skill.cost;
      if (skill.type === 'damage') {
        var rs = damageCalc(d.atk, skill.power, enemy.def, d.crit + (skill.crit || 0));
        enemy.hp = Math.max(0, enemy.hp - rs.damage);
        pushBattleLog(b, '你施展「' + skill.name + '」，造成 ' + rs.damage + ' 点伤害。', 'player');
        if (rs.crit) pushBattleLog(b, pick(D.BATTLE_FLAVOR.crit), 'crit');
      } else if (skill.type === 'heal') {
        var heal = Math.round(d.hpMax * skill.power * (1 + d.heal));
        var before = p.hp;
        p.hp = Math.min(d.hpMax, p.hp + heal);
        pushBattleLog(b, '你施展「' + skill.name + '」，恢复了 ' + (p.hp - before) + ' 点气血。', 'player');
      } else if (skill.type === 'shield') {
        var shield = Math.round(d.hpMax * skill.power);
        b.shield = Math.max(b.shield, shield);
        pushBattleLog(b, '你施展「' + skill.name + '」，周身凝起 ' + shield + ' 点护体灵光。', 'player');
      }
    } else if (action === 'pill') {
      var item = D.ITEMS[payload];
      if (!item || item.type !== 'pill') return { ok: false, error: '此物不可服用。' };
      if (E.countItem(state, payload) < 1) return { ok: false, error: '行囊中没有此物。' };
      var eff = item.effect || {};
      if (eff.type === 'heal' || eff.type === 'fullHeal') {
        var amount = eff.type === 'fullHeal' ? d.hpMax : Math.round(d.hpMax * eff.value * (1 + d.heal));
        var hpBefore = p.hp;
        p.hp = Math.min(d.hpMax, p.hp + amount);
        pushBattleLog(b, '你服下「' + item.name + '」，气血恢复了 ' + (p.hp - hpBefore) + ' 点。', 'player');
      } else if (eff.type === 'mana') {
        var mpBefore = p.mp;
        p.mp = Math.min(d.mpMax, p.mp + Math.round(d.mpMax * eff.value));
        pushBattleLog(b, '你服下「' + item.name + '」，灵力恢复了 ' + (p.mp - mpBefore) + ' 点。', 'player');
      } else {
        return { ok: false, error: '此丹在战斗中无用。' };
      }
      E.removeItem(state, payload, 1);
      state.stats.itemsUsed += 1;
    } else if (action === 'flee') {
      var fleeChance = clamp(0.50 + d.luck * 0.01, 0.30, 0.90);
      if (enemy.tribulation) fleeChance = 0.35;
      if (chance(fleeChance)) {
        b.over = true;
        b.result = 'flee';
        pushBattleLog(b, '你虚晃一招，转身遁入山林。', 'system');
        E.log(state, '你从「' + enemy.name + '」手中脱身。', 'battle');
        return { ok: true, fled: true, ended: true };
      }
      pushBattleLog(b, '你试图脱身，却被对方拦了回来。', 'system');
    } else {
      return { ok: false, error: '未知的动作。' };
    }

    /* 敌人反击 */
    if (enemy.hp <= 0) {
      E.battleVictory(state);
      return { ok: true, ended: true, result: 'win' };
    }

    if (rnd() < 0.05 + d.luck * 0.002) {
      pushBattleLog(b, pick(D.BATTLE_FLAVOR.dodge), 'enemy');
    } else {
      var er = damageCalc(enemy.atk, 1.0, d.def, 0.05);
      var incoming = er.damage;
      var absorbed = Math.min(b.shield, incoming);
      b.shield -= absorbed;
      incoming -= absorbed;
      var hpBeforeHit = p.hp;
      p.hp = Math.max(0, p.hp - incoming);
      pushBattleLog(b, pick(D.BATTLE_FLAVOR.enemyAttack) + '造成 ' + er.damage + ' 点伤害。' + (absorbed > 0 ? '护体灵光挡下了 ' + absorbed + ' 点。' : ''), 'enemy');
      if (er.crit) pushBattleLog(b, '这一击格外沉重，你几乎站不稳。', 'crit');
      if (p.hp < hpBeforeHit && p.hp > 0) {
        /* 仅用于叙事，避免日志过长 */
      }
    }

    if (p.hp <= 0) {
      E.battleDefeat(state);
      return { ok: true, ended: true, result: 'lose' };
    }

    b.turn += 1;
    return { ok: true, ended: false };
  };

  E.battleVictory = function (state) {
    var b = state.battle;
    var p = state.player;
    var d = E.derived(state);
    if (!b || b.over) return;
    var enemy = b.enemy;
    b.over = true;
    b.result = 'win';
    state.stats.wins += 1;
    pushBattleLog(b, pick(D.BATTLE_FLAVOR.victory), 'system');

    if (enemy.tribulation) {
      E.ascend(state);
      b.result = 'ascension';
      b.rewards = { ascension: true };
      pushBattleLog(b, '最后一道天雷在你掌中碎成流光。云海裂开，天门就在眼前。', 'system');
      return;
    }

    var rewardMul = (enemy.elite ? 1.5 : 1) * (1 + d.battleReward);
    var expGain = Math.round(E.expNeed(state) * enemy.rewardExp * rewardMul);
    var stones = Math.round(enemy.rewardStones * Math.pow(1.9, p.realm) * rewardMul);
    var addedExp = E.addExp(state, expGain);
    p.stones += stones;

    var drops = [];
    enemy.drops.forEach(function (drop) {
      if (chance(drop.chance * (enemy.elite ? 1.2 : 1))) {
        E.addItem(state, drop.id, 1);
        drops.push({ id: drop.id, name: D.ITEMS[drop.id].name, qty: 1 });
      }
    });

    b.rewards = { exp: addedExp, stones: stones, drops: drops };
    pushBattleLog(b, '你获得了 ' + addedExp + ' 点修为与 ' + stones + ' 块灵石。', 'loot');
    if (drops.length) {
      pushBattleLog(b, '拾取：' + drops.map(function (x) { return '「' + x.name + '」'; }).join('、') + '。', 'loot');
    }
    E.log(state, '你击败了「' + enemy.name + '」，获得 ' + addedExp + ' 修为、' + stones + ' 灵石。', 'battle');
    E.checkAchievements(state);
  };

  E.battleDefeat = function (state) {
    var b = state.battle;
    var p = state.player;
    if (!b || b.over) return;
    var d = E.derived(state);
    b.over = true;
    b.result = 'lose';
    var lostExp = Math.round(p.exp * 0.15);
    var lostStones = Math.round(p.stones * 0.10);
    p.exp = Math.max(0, p.exp - lostExp);
    p.stones = Math.max(0, p.stones - lostStones);
    p.hp = Math.max(1, round(d.hpMax * 0.30));
    p.mp = Math.round(d.mpMax * 0.30);
    state.stats.defeats += 1;
    b.rewards = { lostExp: lostExp, lostStones: lostStones };
    pushBattleLog(b, pick(D.BATTLE_FLAVOR.defeat), 'system');
    pushBattleLog(b, '你失去了 ' + lostExp + ' 点修为与 ' + lostStones + ' 块灵石。', 'loot');
    E.log(state, '你败给了「' + b.enemy.name + '」，勉强保住性命，修为与灵石皆有损失。', 'battle');
    E.checkAchievements(state);
  };

  E.endBattle = function (state) {
    state.battle = null;
  };

  /* ------------------------------------------------------------------ */
  /* 坊市                                                                */
  /* ------------------------------------------------------------------ */

  E.ensureMarket = function (state) {
    var bucket = Math.floor(state.player.ageMonths / 3);
    if (state.world.marketBucket !== bucket) {
      state.world.marketBucket = bucket;
      E.generateStock(state);
    }
  };

  E.generateStock = function (state) {
    var p = state.player;
    var rng = mulberry32(hashString(state.seed + ':' + state.world.marketSeed + ':' + state.world.marketBucket));
    var all = Object.keys(D.ITEMS).map(function (id) { return D.ITEMS[id]; });

    var pills = all.filter(function (it) { return it.type === 'pill' && it.rarity <= p.realm + 2; });
    var equips = all.filter(function (it) { return it.type === 'equip' && it.rarity <= p.realm + 1; });
    var techs = Object.keys(D.TECHNIQUES).map(function (id) { return D.TECHNIQUES[id]; }).filter(function (t) {
      return p.learned.indexOf(t.id) === -1 && t.rarity <= p.realm + 1;
    });
    var materials = all.filter(function (it) { return it.type === 'material' && it.rarity <= p.realm + 2; });

    function take(pool, used) {
      var avail = pool.filter(function (x) { return used.indexOf(x.id) === -1; });
      if (!avail.length) return null;
      var item;
      if (avail.length === 1) item = avail[0];
      else item = avail[Math.floor(rng() * avail.length)];
      used.push(item.id);
      return item;
    }

    var used = [];
    var stock = [];
    function addItemEntry(item, kind) {
      if (!item) return;
      var price = E.marketPrice(state, item);
      stock.push({ itemId: item.id, kind: kind || 'item', price: price, sold: false });
    }

    addItemEntry(take(pills, used), 'item');
    addItemEntry(take(pills, used), 'item');
    addItemEntry(take(equips, used), 'item');
    var tech = take(techs, used);
    if (tech) addItemEntry(tech, 'tech');
    addItemEntry(take(materials, used), 'item');
    addItemEntry(take(all.filter(function (x) {
      return (x.type === 'pill' || x.type === 'equip') && x.rarity <= p.realm + 2;
    }), used), 'item');
    addItemEntry(take(all.filter(function (x) {
      return (x.type === 'pill' || x.type === 'material') && x.rarity <= p.realm + 2;
    }), used), 'item');

    state.world.stock = stock.filter(Boolean).slice(0, 7);
  };

  E.refreshMarket = function (state, paid) {
    if (state.ended) return { ok: false, error: '仙途已断。' };
    if (paid) {
      var cost = Math.round(30 * Math.pow(1.6, state.player.realm));
      if (state.player.stones < cost) return { ok: false, error: '灵石不足，刷新货架需要 ' + cost + ' 灵石。' };
      state.player.stones -= cost;
    }
    state.world.marketSeed += 1;
    state.world.marketBucket = Math.floor(state.player.ageMonths / 3);
    E.generateStock(state);
    return { ok: true, cost: paid ? Math.round(30 * Math.pow(1.6, state.player.realm)) : 0 };
  };

  E.buyStock = function (state, index) {
    if (state.ended) return { ok: false, error: '仙途已断。' };
    var entry = state.world.stock[index];
    if (!entry || entry.sold) return { ok: false, error: '这件货物已经售出。' };
    if (state.player.stones < entry.price) return { ok: false, error: '灵石不足。' };

    var p = state.player;
    p.stones -= entry.price;
    entry.sold = true;

    if (entry.kind === 'tech') {
      var tech = D.TECHNIQUES[entry.itemId];
      if (p.learned.indexOf(entry.itemId) === -1) p.learned.push(entry.itemId);
      var old = D.TECHNIQUES[p.technique];
      if (!old || tech.cult > old.cult) p.technique = entry.itemId;
      E.clampVitals(state);
      E.log(state, '你在坊市购得功法「' + tech.name + '」，已收入识海。', 'loot');
      return { ok: true, type: 'tech', text: '习得「' + tech.name + '」' };
    }

    E.addItem(state, entry.itemId, 1);
    E.log(state, '你花费 ' + entry.price + ' 灵石，购得「' + D.ITEMS[entry.itemId].name + '」。', 'loot');
    return { ok: true, type: 'item', text: '获得「' + D.ITEMS[entry.itemId].name + '」' };
  };

  E.sellItem = function (state, id, qty) {
    if (state.ended) return { ok: false, error: '仙途已断。' };
    var item = D.ITEMS[id];
    qty = qty || 1;
    if (!item || item.type === 'tech') return { ok: false, error: '此物不可出售。' };
    if (E.countItem(state, id) < qty) return { ok: false, error: '数量不足。' };
    var unit = E.sellPrice(state, item);
    var total = unit * qty;
    E.removeItem(state, id, qty);
    state.player.stones += total;
    E.log(state, '你出售了「' + item.name + '」×' + qty + '，得到 ' + total + ' 灵石。', 'loot');
    return { ok: true, stones: total };
  };

  /* ------------------------------------------------------------------ */
  /* 炼丹                                                                */
  /* ------------------------------------------------------------------ */

  E.craftChance = function (state, recipe) {
    var d = E.derived(state);
    var c = 0.55 + d.comp * 0.02 + d.alchemy - recipe.dc * 0.02;
    return clamp(c, 0.15, 0.95);
  };

  E.craft = function (state, recipeId) {
    var p = state.player;
    if (state.ended) return { ok: false, error: '仙途已断。' };
    var recipe = D.RECIPES.find(function (r) { return r.id === recipeId; });
    if (!recipe) return { ok: false, error: '丹方不存在。' };
    var missing = [];
    Object.keys(recipe.mats).forEach(function (id) {
      if (E.countItem(state, id) < recipe.mats[id]) missing.push(D.ITEMS[id].name + '×' + recipe.mats[id]);
    });
    if (missing.length) return { ok: false, error: '缺少材料：' + missing.join('、') };

    var chanceValue = E.craftChance(state, recipe);
    Object.keys(recipe.mats).forEach(function (id) { E.removeItem(state, id, recipe.mats[id]); });
    if (E.advanceTime(state, 1)) {
      return { ok: false, error: '丹火未熄，人已坐化。', ended: true };
    }
    if (chance(chanceValue)) {
      E.addItem(state, recipe.out.id, recipe.out.qty);
      state.stats.crafts += 1;
      E.log(state, '丹炉轻鸣，一炉「' + D.ITEMS[recipe.out.id].name + '」成了。', 'loot');
      E.checkAchievements(state);
      return { ok: true, success: true, chance: chanceValue, text: '丹成！获得「' + D.ITEMS[recipe.out.id].name + '」×' + recipe.out.qty + '。' };
    }
    var hurt = Math.round(E.derived(state).hpMax * 0.08);
    p.hp = Math.max(1, p.hp - hurt);
    E.log(state, '丹炉炸开，你被气浪掀翻在地。材料尽毁。', 'loot');
    return { ok: true, success: false, chance: chanceValue, text: '炸炉了。材料尽毁，你受了些伤。' };
  };

  /* ------------------------------------------------------------------ */
  /* 成就                                                                */
  /* ------------------------------------------------------------------ */

  E.checkAchievements = function (state) {
    var unlocked = [];
    D.ACHIEVEMENTS.forEach(function (a) {
      if (state.achievements[a.id]) return;
      var got = false;
      try { got = a.check(state); } catch (e) { got = false; }
      if (!got) return;
      state.achievements[a.id] = true;
      var rewardText = [];
      if (a.reward) {
        if (a.reward.stones) {
          var stones = Math.round(a.reward.stones * (1 + state.player.realm * 0.35));
          state.player.stones += stones;
          rewardText.push(stones + ' 灵石');
        }
        if (a.reward.item) {
          E.addItem(state, a.reward.item, a.reward.qty || 1);
          rewardText.push('「' + D.ITEMS[a.reward.item].name + '」×' + (a.reward.qty || 1));
        }
      }
      E.log(state, '达成成就「' + a.name + '」' + (rewardText.length ? '，获得 ' + rewardText.join('、') + '。' : '。'), 'system');
      unlocked.push({ id: a.id, name: a.name, desc: a.desc, reward: rewardText.join('、') });
    });
    return unlocked;
  };

  /* ------------------------------------------------------------------ */
  /* 存档                                                                */
  /* ------------------------------------------------------------------ */

  E.save = function (state) {
    try {
      localStorage.setItem(D.SAVE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  };

  E.hasSave = function () {
    try { return !!localStorage.getItem(D.SAVE_KEY); } catch (e) { return false; }
  };

  E.load = function () {
    try {
      var raw = localStorage.getItem(D.SAVE_KEY);
      if (!raw) return null;
      var state = JSON.parse(raw);
      if (!state || !state.player || state.version !== D.VERSION) return null;
      state.world = state.world || {};
      state.stats = state.stats || {};
      state.achievements = state.achievements || {};
      state.journal = state.journal || [];
      state.world.recentEvents = state.world.recentEvents || [];
      state.world.stock = state.world.stock || [];
      state.world.marketBucket = typeof state.world.marketBucket === 'number' ? state.world.marketBucket : -1;
      state.player.mods = state.player.mods || {};
      state.player.flags = state.player.flags || {};
      state.player.inventory = state.player.inventory || [];
      state.player.learned = state.player.learned || ['yinqi'];
      state.battle = state.battle || null;
      state.ended = state.ended || null;
      E.ensureMarket(state);
      return state;
    } catch (e) {
      return null;
    }
  };

  E.deleteSave = function () {
    try { localStorage.removeItem(D.SAVE_KEY); } catch (e) { /* ignore */ }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = E;
  } else {
    window.XianEngine = E;
  }
})();
