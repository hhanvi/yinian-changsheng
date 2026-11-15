/*
 * 一念长生 · 宗门篇 · 模拟引擎
 * 纯逻辑，不接触 DOM；可在 Node 中直接测试。
 */
(function (global) {
  'use strict';

  var D = (typeof window !== 'undefined' && window.SectData) ? window.SectData : require('./data.js');
  var EV = (typeof window !== 'undefined' && window.SectEvents) ? window.SectEvents : require('./events.js');

  var E = {};

  /* ------------------------------------------------------------------ */
  /* 基础工具                                                           */
  /* ------------------------------------------------------------------ */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function round(v) { return Math.round(v); }
  function deepCopy(o) { return JSON.parse(JSON.stringify(o)); }

  function nextRandom(state) {
    state.rngSeed = (state.rngSeed + 0x6D2B79F5) | 0;
    var t = state.rngSeed;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function rand(state) { return nextRandom(state); }
  function randInt(state, lo, hi) { return Math.floor(rand(state) * (hi - lo + 1)) + lo; }
  function pick(state, arr) { return arr[Math.floor(rand(state) * arr.length)]; }
  function chance(state, p) { return rand(state) < p; }

  function pickWeighted(state, entries) {
    var total = 0;
    entries.forEach(function (e) { total += Math.max(0, e.weight || 0); });
    if (total <= 0) return null;
    var roll = rand(state) * total;
    for (var i = 0; i < entries.length; i++) {
      roll -= Math.max(0, entries[i].weight || 0);
      if (roll <= 0) return entries[i];
    }
    return entries[entries.length - 1] || null;
  }

  E.util = { clamp: clamp, round: round, rand: rand, randInt: randInt, pick: pick, chance: chance, deepCopy: deepCopy };

  /* ------------------------------------------------------------------ */
  /* 日期                                                               */
  /* ------------------------------------------------------------------ */
  E.getDate = function (state) {
    var day = Math.max(1, state.day || 1);
    var year = Math.floor((day - 1) / 360) + 1;
    var rem = (day - 1) % 360;
    var month = Math.floor(rem / 30) + 1;
    var dom = rem % 30 + 1;
    var seasonIndex = Math.floor((month - 1) / 3);
    return {
      day: day, year: year, month: month, dayOfMonth: dom,
      seasonIndex: seasonIndex, season: D.SEASONS[seasonIndex],
      text: '青历 ' + year + ' 年 · ' + month + ' 月 ' + dom + ' 日',
      short: year + '年' + month + '月'
    };
  };

  E.dateText = function (state) { return E.getDate(state).text; };
  E.season = function (state) { return E.getDate(state).season; };

  E.log = function (state, text, type) {
    var d = E.getDate(state);
    state.log.unshift({
      day: state.day, date: d.short, text: text, type: type || 'system'
    });
    if (state.log.length > 120) state.log.length = 120;
  };

  /* ------------------------------------------------------------------ */
  /* 查询                                                               */
  /* ------------------------------------------------------------------ */
  E.buildingById = function (state, id) {
    for (var i = 0; i < state.buildings.length; i++) {
      if (state.buildings[i].id === id) return state.buildings[i];
    }
    return null;
  };

  E.buildingAt = function (state, x, y) {
    for (var i = 0; i < state.buildings.length; i++) {
      var b = state.buildings[i];
      if (b.x === x && b.y === y) return b;
    }
    return null;
  };

  E.def = function (b) { return D.BUILDINGS[b.type] || null; };

  var JOB_ROLES = {
    meditation: ['inner'], library: ['inner', 'outer'], alchemy: ['inner', 'outer'],
    arena: ['inner'], farm: ['outer'], herb: ['outer'], kitchen: ['outer'],
    infirmary: ['outer', 'inner']
  };

  function canWorkAt(b, d) {
    var roles = JOB_ROLES[b.type];
    return !roles || roles.indexOf(d.role) >= 0;
  }

  E.slotsOf = function (b) {
    var def = E.def(b);
    if (!def || !def.slots) return 0;
    return def.slots + (b.level || 1) - 1;
  };

  E.capacityOf = function (b) {
    var def = E.def(b);
    if (!def || !def.capacity) return 0;
    return def.capacity * (b.level || 1);
  };

  E.terrainAt = function (state, x, y) {
    if (!state.map || !state.map[y]) return 'M';
    return state.map[y][x] || 'M';
  };

  E.isBuildable = function (state, x, y) {
    var t = E.terrainAt(state, x, y);
    return (t === 'G') && !E.buildingAt(state, x, y);
  };

  E.disciples = function (state) { return state.disciples || []; };
  E.aliveDisciples = function (state) { return E.disciples(state).filter(function (d) { return !d.dead; }); };
  E.innerDisciples = function (state) { return E.aliveDisciples(state).filter(function (d) { return d.role === 'inner'; }); };
  E.outerDisciples = function (state) { return E.aliveDisciples(state).filter(function (d) { return d.role === 'outer'; }); };
  E.discipleById = function (state, id) {
    for (var i = 0; i < state.disciples.length; i++) if (state.disciples[i].id === id) return state.disciples[i];
    return null;
  };
  E.player = function (state) { return E.discipleById(state, state.playerId); };

  function techniqueForRoot(rootKey) {
    return ({ metal: 'jian', wood: 'qingmu', water: 'shui', fire: 'dan', earth: 'tu' })[rootKey] || 'yinqi';
  }

  E.techniqueOf = function (d) {
    return D.TECHNIQUES[d.technique] || D.TECHNIQUES.yinqi || { name: '青崖引气诀', cult: 0, desc: '' };
  };

  E.traitMod = function (d, key) {
    var total = 0;
    (d.traits || []).forEach(function (id) {
      var t = D.TRAITS[id];
      if (t && t.mods && typeof t.mods[key] === 'number') total += t.mods[key];
    });
    return total;
  };

  E.aptitude = function (d) {
    return clamp(Math.round((d.aptitude || 2) + E.traitMod(d, 'aptitude')), 1, 5);
  };

  E.realmInfo = function (d) {
    return D.REALMS[clamp(d.realm || 0, 0, D.REALMS.length - 1)];
  };

  E.stageName = function (d) {
    var r = E.realmInfo(d);
    if (!r) return '凡人';
    if (d.realm >= 9) return '飞升';
    var labels = D.LAYER_LABELS[r.layers] || [''];
    return r.name + (labels[d.layer] || '');
  };

  E.expNeed = function (d) {
    var r = E.realmInfo(d);
    if (!r || d.realm >= 9) return 1;
    return Math.max(1, Math.round(r.base + (d.layer || 0) * r.step));
  };

  E.cultPct = function (d) {
    var need = E.expNeed(d);
    return clamp((d.exp || 0) / need, 0, 1);
  };

  E.lifespanOf = function (d) {
    var base = 80;
    var life = 0;
    for (var i = 0; i <= clamp(d.realm || 0, 0, 9); i++) {
      var r = D.REALMS[i];
      if (i < (d.realm || 0)) life += r.life * r.layers;
      else if (i === (d.realm || 0)) life += r.life * ((d.layer || 0) + 1);
    }
    return base + life + (d.bonusLife || 0);
  };

  E.housing = function (state) {
    var cap = 0;
    state.buildings.forEach(function (b) {
      if (b.type === 'dorm' && !b.construction) cap += E.capacityOf(b);
    });
    return cap;
  };

  E.workEfficiency = function (d, state) {
    if (!d || d.dead) return 0;
    var mood = 0.62 + (d.mood || 50) / 145;
    var energy = 0.68 + (d.energy || 50) / 190;
    var injury = 1 - (d.injury || 0) / 230;
    var trait = 1 + E.traitMod(d, 'work');
    var root = 1;
    return clamp(mood * energy * injury * trait * root, 0.15, 1.8);
  };

  E.cultGain = function (d, state, mode) {
    if (!d || d.dead) return 0;
    var apt = E.aptitude(d);
    var root = D.ROOTS[d.root] || D.ROOTS.water;
    var base = 3.5 * (0.52 + apt * 0.19);
    var tech = E.techniqueOf(d);
    base *= (root.cult || 1);
    base *= (1 + (tech.cult || 0));
    base *= (1 + E.traitMod(d, 'cult'));
    var room = d.job ? E.buildingById(state, d.job) : null;
    if (mode === 'meditate') {
      base *= 1.18;
      if (room && room.type === 'meditation' && !room.construction) {
        base *= 1 + (E.def(room).aura || 0) * (room.level || 1) * 0.04 + 0.12;
      } else {
        base *= 0.82;
      }
    } else if (mode === 'train') {
      base *= 0.78;
    } else if (mode === 'work') {
      base *= 0.3;
    } else if (mode === 'idle') {
      base *= 0.46;
    } else {
      base *= 0.16;
    }
    var stats = E.sectStats(state);
    base *= 1 + stats.aura * 0.014;
    base *= 0.82 + stats.fengShui / 300;
    base *= 0.52 + (d.mood || 50) / 160;
    base *= 1 + (d.realm || 0) * 0.16;
    base *= 1 - Math.min(0.35, (d.injury || 0) / 260);
    if (E.hasResearch(state, 'dadian')) base *= 1.25;
    if (stats.buffs && stats.buffs.cult) base *= stats.buffs.cult;
    return Math.max(0.1, Math.round(base * 10) / 10);
  };

  E.power = function (d, state) {
    if (!d || d.dead) return 0;
    var r = E.realmInfo(d);
    var root = D.ROOTS[d.root] || {};
    var base = 16 + r.atk * 2 + r.def * 1.5 + r.hp * 0.06 + (d.layer || 0) * 6;
    var mult = 1;
    var tech = E.techniqueOf(d);
    mult *= 1 + (tech.power || 0);
    mult *= 1 + E.traitMod(d, 'power') + E.traitMod(d, 'hp') * 0.3 + E.traitMod(d, 'def') * 0.3;
    mult *= root.power || 1;
    mult *= 1 + (d.originPower || 0);
    if (E.hasResearch(state, 'jianxin') && d.role === 'inner') mult *= 1.1;
    if (d.role === 'inner') {
      state.buildings.forEach(function (b) {
        if (b.type === 'arena' && !b.construction) mult *= 1 + 0.04 * (b.level || 1);
      });
    }
    mult *= 1 - Math.min(0.3, (d.injury || 0) * 0.002);
    mult *= 0.9 + (d.mood || 50) / 500;
    return Math.round(base * mult);
  };

  E.breakChance = function (d, state) {
    var r = E.realmInfo(d);
    var fs = E.sectStats(state).fengShui;
    var p = 0.4 + E.aptitude(d) * 0.04 + (d.mood || 50) * 0.0015 + fs * 0.0012;
    p += E.traitMod(d, 'breakthrough');
    p += (E.traitMod(d, 'luck') + (d.originLuck || 0)) * 0.01;
    if (E.hasResearch(state, 'yangshen')) p += 0.04;
    if (d.breakthroughBonus) p += d.breakthroughBonus;
    if (d.role === 'outer') p -= 0.05;
    if (d.layer === r.layers - 1) p -= 0.12;
    if (d.realm >= 5) p -= 0.04;
    return clamp(p, 0.12, 0.95);
  };

  E.needs = function (d, state) {
    var housing = E.housing(state);
    var population = E.aliveDisciples(state).filter(function (x) { return !x.missionId; }).length;
    return {
      hungry: d.hunger < 25,
      tired: d.energy < 22,
      lowMood: d.mood < 32,
      injured: d.injury > 35 || d.health < 60,
      homeless: population > housing,
      job: d.job ? E.buildingById(state, d.job) : null
    };
  };

  E.hasResearch = function (state, id) {
    return !!(state.research && state.research.nodes && state.research.nodes[id]);
  };

  E.recipeUnlocked = function (state, recipe) {
    return !recipe.unlock || E.hasResearch(state, recipe.unlock);
  };

  /* ------------------------------------------------------------------ */
  /* 宗门总览                                                           */
  /* ------------------------------------------------------------------ */
  E.sectStats = function (state) {
    var aura = 1;
    var fengShui = 50;
    var completed = [];
    state.buildings.forEach(function (b) {
      if (b.construction > 0) return;
      var def = E.def(b);
      if (!def) return;
      completed.push(b);
      aura += (def.aura || 0) * (b.level || 1);
      fengShui += (def.fengShui || 0) * (b.level || 1);
    });
    // 灵脉地块
    (state.map || []).forEach(function (row) {
      row.forEach(function (t) { if (t === 'S') aura += 2; });
    });
    // 相邻布局加成
    var pairs = [
      ['meditation', 'array', 5, '静室引聚灵阵，灵气更盛'],
      ['alchemy', 'herb', 4, '丹房近药圃，取药方便'],
      ['kitchen', 'farm', 3, '膳堂近灵田，饭香菜热'],
      ['dorm', 'well', 3, '弟子居近灵井，起居清爽'],
      ['shrine', 'gate', 2, '祠堂守山门，香火安稳'],
      ['pavilion', 'well', 2, '亭台临水，心境舒畅']
    ];
    var notes = [];
    pairs.forEach(function (p) {
      completed.forEach(function (a) {
        if (a.type !== p[0]) return;
        completed.forEach(function (b) {
          if (b.type !== p[1]) return;
          if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 2) {
            fengShui += p[2];
            notes.push(p[3]);
          }
        });
      });
    });
    // 同类建筑过多会显得拥挤
    var counts = {};
    completed.forEach(function (b) { counts[b.type] = (counts[b.type] || 0) + 1; });
    Object.keys(counts).forEach(function (type) {
      if (counts[type] > 2 && ['farm', 'herb', 'dorm'].indexOf(type) >= 0) fengShui -= (counts[type] - 2) * 1.5;
    });
    if (completed.length > 16) fengShui -= (completed.length - 16) * 0.5;
    aura += state.flags.auraBonus || 0;
    aura = Math.round(aura);
    fengShui = Math.round(clamp(fengShui, 0, 100));

    var grade = D.SECT_GRADES[0];
    for (var i = 0; i < D.SECT_GRADES.length; i++) {
      if ((state.resources.renown || 0) >= D.SECT_GRADES[i].min) grade = D.SECT_GRADES[i];
    }
    var fsGrade = fengShui >= 85 ? '大吉' : fengShui >= 70 ? '吉' : fengShui >= 55 ? '平' : fengShui >= 40 ? '凶' : '大凶';

    var kitchen = completed.some(function (b) { return b.type === 'kitchen' && b.workers.length > 0; });
    var population = E.aliveDisciples(state).length;
    var dailyFood = 0;
    var seasonFood = D.SEASONS[E.getDate(state).seasonIndex].food || 1;
    E.aliveDisciples(state).forEach(function (d) {
      dailyFood += seasonFood * (1 + E.traitMod(d, 'food') * 0.12);
    });
    if (kitchen) dailyFood *= 0.85;
    dailyFood = Math.max(0.1, dailyFood);

    var inner = E.innerDisciples(state);
    var power = inner.reduce(function (sum, d) { return sum + E.power(d, state); }, 0);
    var buff = null;
    (state.buffs || []).forEach(function (b) { if (b.cult) buff = b; });

    return {
      aura: aura, fengShui: fengShui, fsGrade: fsGrade, layoutNotes: notes,
      grade: grade, gradeIndex: D.SECT_GRADES.indexOf(grade),
      kitchen: kitchen,
      housing: E.housing(state),
      population: population,
      innerCount: inner.length,
      outerCount: E.outerDisciples(state).length,
      dailyFood: Math.round(dailyFood * 10) / 10,
      foodDays: Math.floor((state.resources.food || 0) / dailyFood),
      power: power,
      completed: completed.length,
      buffs: buff,
      nextGrade: D.SECT_GRADES.find(function (g) { return g.min > (state.resources.renown || 0); }) || null
    };
  };

  E.alerts = function (state) {
    var out = [];
    var st = E.sectStats(state);
    if (st.foodDays <= 3) out.push({ type: 'food', text: '存粮只够 ' + st.foodDays + ' 日，尽快安排灵田或去坊市买粮。' });
    if (st.population > st.housing) out.push({ type: 'housing', text: '弟子居床位不足，弟子的精力恢复会变慢。' });
    if (!st.kitchen) out.push({ type: 'kitchen', text: '膳堂无人掌勺，粮食消耗增加，弟子心境也会受影响。' });
    state.buildings.forEach(function (b) {
      if (b.construction > 0) return;
      var def = E.def(b);
      if (def && def.slots > 0 && b.workers.length === 0 && b.type !== 'meditation') {
        out.push({ type: 'idle', text: def.name + '无人值守，暂时没有产出。' });
      }
    });
    E.aliveDisciples(state).forEach(function (d) {
      if (d.exp >= E.expNeed(d) && d.realm < 9 && !d.autoBreakthrough) {
        out.push({ type: 'bottleneck', text: d.name + '已到瓶颈，可助其突破。', discipleId: d.id });
      }
      if (d.mood < 30) out.push({ type: 'mood', text: d.name + '心境低落，需多加照看。', discipleId: d.id });
      if (d.hunger < 20) out.push({ type: 'food', text: d.name + '已饿得发昏，快补些粮食。', discipleId: d.id });
    });
    if (state.pendingEvent) out.unshift({ type: 'event', text: '山门外有事发生，等待你的决断。' });
    return out.slice(0, 6);
  };

  /* ------------------------------------------------------------------ */
  /* 建号                                                               */
  /* ------------------------------------------------------------------ */
  function randomName(state) {
    return pick(state, D.SURNAMES) + pick(state, D.GIVEN_NAMES);
  }

  function rootForBackground(state, bg) {
    if (bg && bg.rootBias && chance(state, 0.7)) return pick(state, bg.rootBias);
    var keys = Object.keys(D.ROOTS);
    return pick(state, keys);
  }

  function traitsForBackground(state, bg, count) {
    var out = [];
    if (bg && bg.traitBias && chance(state, 0.6)) out.push(pick(state, bg.traitBias));
    var keys = Object.keys(D.TRAITS);
    var guard = 0;
    while (out.length < count && guard++ < 30) {
      var id = pick(state, keys);
      if (out.indexOf(id) < 0) out.push(id);
    }
    return out;
  }

  function linkRelations(state, d) {
    if (!d) return;
    d.relations = d.relations || {};
    E.aliveDisciples(state).forEach(function (other) {
      if (other.id === d.id) return;
      var bond = randInt(state, 26, 62);
      d.relations[other.id] = bond;
      other.relations = other.relations || {};
      other.relations[d.id] = bond;
    });
  }

  E.linkRelations = linkRelations;

  E.generateDisciple = function (state, opts) {
    opts = opts || {};
    var bg = pick(state, D.BACKGROUNDS);
    var rootKey = opts.root || rootForBackground(state, bg);
    var root = D.ROOTS[rootKey];
    var traitCount = opts.traitCount == null ? (chance(state, 0.35) ? 2 : 1) : opts.traitCount;
    var traits = opts.traits ? opts.traits.slice() : traitsForBackground(state, bg, traitCount);
    var baseApt = opts.aptitude != null ? opts.aptitude : clamp((root.aptitude || 3) + randInt(state, -1, 1), 1, 4);
    var id = 'd' + (state.nextDiscipleId++);
    var d = {
      id: id,
      name: opts.name || randomName(state),
      gender: opts.gender || (chance(state, 0.5) ? 'f' : 'm'),
      role: opts.role || 'outer',
      title: opts.role === 'inner' ? '内门弟子' : '外门弟子',
      root: rootKey,
      origin: opts.origin || bg.name,
      traits: traits,
      aptitude: baseApt,
      realm: opts.realm || 0,
      layer: opts.layer || 0,
      exp: opts.exp || 0,
      age: opts.age || randInt(state, 16, 27),
      ageDays: 0,
      bonusLife: 0,
      health: 100,
      injury: 0,
      mood: opts.mood || randInt(state, 58, 78),
      hunger: randInt(state, 72, 92),
      energy: randInt(state, 72, 92),
      job: null,
      jobMode: opts.jobMode === 'manual' ? 'manual' : 'auto',
      preferredJob: null,
      state: 'idle',
      stateLabel: '闲居',
      missionId: null,
      breakthroughBonus: 0,
      autoBreakthrough: opts.autoBreakthrough !== false,
      avatarSeed: randInt(state, 1, 999999),
      technique: techniqueForRoot(rootKey),
      bio: opts.bio || '',
      relations: {},
      dead: false
    };
    d.lifespan = E.lifespanOf(d);
    d.mood = clamp(d.mood + E.traitMod(d, 'mood'), 0, 100);
    return d;
  };

  E.newGame = function (opts) {
    opts = opts || {};
    var seed = opts.seed != null ? (Number(opts.seed) | 0) : ((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) | 0);
    var state = {
      version: D.VERSION,
      day: 1,
      rngSeed: seed || 123456789,
      sectName: opts.sectName || '青崖宗',
      playerId: null,
      map: D.MAP.map(function (row) { return row.split(''); }),
      paths: D.PATHS.map(function (p) { return p.slice(); }),
      buildings: [],
      disciples: [],
      nextBuildingId: 1,
      nextDiscipleId: 1,
      resources: {
        stones: 180,
        food: 60,
        wood: 80,
        stone: 60,
        herbs: 15,
        renown: 10
      },
      insight: 0,
      pills: { juqi: 1, huichun: 2 },
      research: { nodes: {}, totalSpent: 0 },
      market: { stock: [], restockDay: 1, lastRefresh: 0 },
      missions: [],
      missionOrders: [],
      nextMissionOrderId: 1,
      log: [],
      eventLast: {},
      lastEventDay: 0,
      flags: {},
      buffs: [],
      pendingEvent: null,
      pendingResult: null,
      pendingReport: null,
      reportQueue: [],
      recruitCandidates: null,
      recruitCooldown: 0,
      weather: 'clear',
      ending: null,
      stats: {
        days: 0, battlesWon: 0, battlesLost: 0, recruited: 0, promoted: 0,
        missions: 0, pillsMade: 0, maxRenown: 10, breakthroughs: 0, built: 0
      },
      guide: { seen: false }
    };

    var origin = D.ORIGINS[opts.origin] || D.ORIGINS.orphan;
    var root = opts.root || 'water';
    var playerTraits = traitsForBackground(state, null, 1);
    var player = E.generateDisciple(state, {
      name: opts.playerName || '沈未央',
      role: 'inner',
      root: root,
      origin: origin.name,
      traits: playerTraits,
      aptitude: 3,
      realm: 0,
      layer: 1,
      age: 24,
      mood: 72,
      energy: 85,
      hunger: 86,
      autoBreakthrough: true
    });
    player.title = '掌门';
    player.bio = origin.desc;
    player.originKey = origin.key;
    player.originPower = origin.effects && origin.effects.power || 0;
    player.originLuck = origin.effects && origin.effects.luck || 0;
    state.playerId = player.id;
    state.disciples.push(player);
    if (origin.resources) Object.keys(origin.resources).forEach(function (k) { state.resources[k] = (state.resources[k] || 0) + origin.resources[k]; });
    if (origin.insight) state.insight += origin.insight;
    if (origin.pills) Object.keys(origin.pills).forEach(function (k) { state.pills[k] = (state.pills[k] || 0) + origin.pills[k]; });

    D.START_BUILDINGS.forEach(function (s) {
      var b = {
        id: 'b' + (state.nextBuildingId++), type: s.type, x: s.x, y: s.y,
        level: 1, construction: 0, workers: [], recipe: null, progress: 0, batch: null
      };
      if (s.type === 'alchemy') b.recipe = 'huichun';
      state.buildings.push(b);
    });

    for (var i = 0; i < 3; i++) {
      var d = E.generateDisciple(state, {
        role: 'outer',
        realm: 0,
        layer: i === 2 ? 1 : 0,
        exp: randInt(state, 0, 8),
        mood: randInt(state, 58, 76)
      });
      state.disciples.push(d);
      var targetType = D.START_WORKERS[i];
      var building = state.buildings.find(function (b) { return b.type === targetType; });
      if (building) {
        building.workers.push(d.id);
        d.job = building.id;
      }
    }

    // 掌门入静室
    var med = state.buildings.find(function (b) { return b.type === 'meditation'; });
    if (med) {
      med.workers.push(player.id);
      player.job = med.id;
    }

    state.weather = 'clear';
    E.aliveDisciples(state).forEach(function (d) {
      d.relations = {};
    });
    E.aliveDisciples(state).forEach(function (d) { linkRelations(state, d); });
    E.refreshMarket(state);
    E.log(state, '青崖山上立起山门。' + D.STORY.grade, 'good');
    E.log(state, '掌门' + player.name + '入静室闭关，三名外门弟子各自领了差事。', 'system');
    return state;
  };

  /* ------------------------------------------------------------------ */
  /* 生产与日常                                                         */
  /* ------------------------------------------------------------------ */
  function applyProduction(state) {
    var season = E.season(state);
    var fs = E.sectStats(state);
    state.buildings.forEach(function (b) {
      if (b.construction > 0 || !b.workers.length) return;
      var def = E.def(b);
      if (!def) return;
      var workers = b.workers.map(function (id) { return E.discipleById(state, id); }).filter(Boolean);
      var eff = 0;
      workers.forEach(function (d) { eff += E.workEfficiency(d, state); });
      eff = eff / Math.max(1, workers.length);

      if (b.type === 'farm') {
        var farmBonus = E.hasResearch(state, 'lingzhi') ? 1.2 : 1;
        var farmTrait = 1 + workers.reduce(function (sum, d) { return sum + E.traitMod(d, 'farm') + (D.ROOTS[d.root] && D.ROOTS[d.root].farm ? D.ROOTS[d.root].farm - 1 : 0); }, 0) / Math.max(1, workers.length);
        var amount = 5.2 * (1 + (b.level - 1) * 0.35) * season.farm * eff * farmBonus * farmTrait;
        state.resources.food += amount;
      } else if (b.type === 'herb') {
        var herbBonus = E.hasResearch(state, 'lingzhi') ? 1.2 : 1;
        var herbTrait = 1 + workers.reduce(function (sum, d) { return sum + E.traitMod(d, 'herb') + (D.ROOTS[d.root] && D.ROOTS[d.root].herb ? D.ROOTS[d.root].herb - 1 : 0); }, 0) / Math.max(1, workers.length);
        var herb = 1.45 * (1 + (b.level - 1) * 0.35) * season.herb * eff * herbBonus * herbTrait;
        state.resources.herbs += herb;
      } else if (b.type === 'kitchen') {
        // 膳堂效果在食物消耗与心境中结算
      } else if (b.type === 'library') {
        var libBonus = E.hasResearch(state, 'tianji') ? 1.1 : 1;
        var insight = (0.8 + (b.level - 1) * 0.35) * eff * libBonus;
        workers.forEach(function (d) {
          insight *= 1 + (D.ROOTS[d.root] && D.ROOTS[d.root].insight ? (D.ROOTS[d.root].insight - 1) : 0) * 0.5;
          insight *= 1 + E.traitMod(d, 'insight');
          insight *= 1 + (E.techniqueOf(d).insight || 0);
        });
        state.insight += insight;
      } else if (b.type === 'shrine') {
        state.resources.renown += 0.2 * (b.level || 1);
      } else if (b.type === 'alchemy') {
        processAlchemy(state, b);
      } else if (b.type === 'arena') {
        workers.forEach(function (d) {
          if (d.role === 'inner') d.exp += E.cultGain(d, state, 'train');
        });
      } else if (b.type === 'infirmary') {
        // 疗伤在弟子状态中结算
      }
    });
    return fs;
  }

  function processAlchemy(state, b) {
    var def = E.def(b);
    var worker = E.discipleById(state, b.workers[0]);
    if (!worker || b.construction > 0) return;
    if (!b.batch) {
      var recipe = D.RECIPES.find(function (r) { return r.id === (b.recipe || 'huichun'); });
      if (!recipe || !E.recipeUnlocked(state, recipe)) return;
      var can = true;
      Object.keys(recipe.mats).forEach(function (k) {
        if (k === 'stones') { if ((state.resources.stones || 0) < recipe.mats[k]) can = false; }
        else if (k === 'herbs') { if ((state.resources.herbs || 0) < recipe.mats[k]) can = false; }
        else if ((state.resources[k] || 0) < recipe.mats[k]) can = false;
      });
      if (!can) return;
      Object.keys(recipe.mats).forEach(function (k) { state.resources[k] -= recipe.mats[k]; });
      b.batch = { recipe: recipe.id, progress: 0, days: recipe.days };
      E.log(state, '丹房开炉，开始炼制' + recipe.name + '。', 'system');
    }
    var aptitude = E.aptitude(worker);
    var tech = E.techniqueOf(worker);
    var speed = 0.65 + (b.level - 1) * 0.2 + aptitude * 0.08 + E.traitMod(worker, 'alchemy') + (tech.alchemy || 0);
    if (worker.role === 'inner') speed += 0.15;
    b.batch.progress += speed;
    if (b.batch.progress >= b.batch.days) {
      var r = D.RECIPES.find(function (x) { return x.id === b.batch.recipe; });
      if (r) {
        state.pills[r.out] = (state.pills[r.out] || 0) + 1;
        state.stats.pillsMade++;
        E.log(state, '丹成！' + worker.name + '炼出一枚' + r.name + '。', 'good');
      }
      b.batch = null;
    }
  }

  function consumeFood(state) {
    var disciples = E.aliveDisciples(state);
    var kitchen = state.buildings.some(function (b) { return b.type === 'kitchen' && !b.construction && b.workers.length; });
    var need = 0;
    var seasonFood = E.season(state).food || 1;
    disciples.forEach(function (d) {
      need += seasonFood * (1 + E.traitMod(d, 'food') * 0.12);
    });
    if (kitchen) need *= 0.85;
    if ((state.resources.food || 0) >= need) {
      state.resources.food -= need;
      disciples.forEach(function (d) { d.hunger = Math.min(100, d.hunger + 13); });
      state._fed = true;
    } else {
      state.resources.food = 0;
      state._fed = false;
      E.log(state, '粮仓见底，弟子们只能饿着肚子。', 'warn');
    }
    return need;
  }

  function determineMode(state, d) {
    if (d.missionId) return 'mission';
    if (d.health < 25 || d.injury > 65) return 'rest';
    if (d.energy < 16) return 'sleep';
    if (d.job) {
      var b = E.buildingById(state, d.job);
      if (!b) { d.job = null; return d.role === 'inner' ? 'meditate' : 'idle'; }
      if (b.type === 'meditation') return d.role === 'inner' ? 'meditate' : 'idle';
      if (b.type === 'arena') return 'train';
      return 'work';
    }
    return d.role === 'inner' ? 'meditate' : 'idle';
  }

  function updateDisciple(state, d) {
    if (d.dead || d.missionId) return;
    var mode = determineMode(state, d);
    var fed = state._fed;
    var housing = E.housing(state);
    var stats = E.sectStats(state);
    var decay = { meditate: 7, work: 9, sleep: 5, idle: 6, rest: 4, train: 8, mission: 0 }[mode] || 7;
    if (!fed) decay += 8;
    d.hunger = clamp(d.hunger - decay + (fed ? 13 : 0), 0, 100);

    if (mode === 'sleep') d.energy += 34;
    else if (mode === 'rest') d.energy += 18;
    else if (mode === 'work') d.energy -= 9;
    else if (mode === 'meditate') d.energy -= 4;
    else if (mode === 'train') d.energy -= 8;
    else if (mode === 'idle') d.energy += 4;
    if (E.aliveDisciples(state).length > housing) d.energy -= 3;
    d.energy = clamp(d.energy, 0, 100);

    var kitchen = stats.kitchen;
    var hasWell = state.buildings.some(function (b) { return b.type === 'well' && !b.construction; });
    var hasShrine = state.buildings.some(function (b) { return b.type === 'shrine' && !b.construction; });
    var hasPavilion = state.buildings.some(function (b) { return b.type === 'pavilion' && !b.construction; });
    var target = 47 + stats.fengShui * 0.12 + (kitchen ? 4 : -4) + (hasWell ? 2 : 0) + (hasShrine ? 2 : 0) + (hasPavilion ? 1 : 0);
    target += E.traitMod(d, 'moodTarget');
    var bonds = Object.keys(d.relations || {}).map(function (id) { return d.relations[id]; });
    if (bonds.length) {
      var bestBond = Math.max.apply(null, bonds);
      var worstBond = Math.min.apply(null, bonds);
      if (bestBond >= 68) target += 2;
      if (worstBond <= 18) target -= 2;
    }
    if (d.hunger < 20) target -= 15;
    if (d.injury > 30) target -= 8;
    if (E.aliveDisciples(state).length > housing) target -= 4;
    if (!d.job && d.role === 'outer') target += 1;
    d.mood += clamp((target - d.mood) * 0.11, -4, 4);
    d.mood = clamp(d.mood, 0, 100);

    // 气血与伤势
    var infirmary = state.buildings.some(function (b) { return b.type === 'infirmary' && !b.construction; });
    if (d.injury > 0) d.injury = Math.max(0, d.injury - (infirmary ? 2.2 : 0.8));
    if (d.hunger <= 0) {
      d.health -= 3;
      d.starveDays = (d.starveDays || 0) + 1;
      if (d.starveDays >= 12 && chance(state, 0.12)) {
        killDisciple(state, d, d.name + '多日水米未进，倒在了' + (d.job ? (E.def(E.buildingById(state, d.job)) || { name: '山中' }).name : '山中') + '。');
        return;
      }
    } else {
      d.starveDays = 0;
      if (d.health < 100) d.health += infirmary ? 1.6 : 0.7;
    }
    if (d.injury > 0 && d.health < 35 && chance(state, 0.03)) {
      d.health = Math.max(1, d.health - 3);
    }
    d.health = clamp(d.health, 1, 100);

    // 修为
    if (mode !== 'sleep' && mode !== 'rest' && mode !== 'mission') {
      var gainMode = mode === 'work' ? 'work' : mode === 'train' ? 'train' : mode === 'idle' ? 'idle' : 'meditate';
      d.exp += E.cultGain(d, state, gainMode);
    }
    d.state = mode;
    d.stateLabel = mode === 'meditate' ? (d.role === 'inner' ? '入定' : '打坐')
      : mode === 'work' ? '当值'
      : mode === 'sleep' ? '安寝'
      : mode === 'rest' ? '养伤'
      : mode === 'train' ? '习武'
      : mode === 'mission' ? '在外'
      : '闲居';

    d.ageDays = (d.ageDays || 0) + 1;
    if (d.ageDays >= 360) {
      d.ageDays -= 360;
      d.age++;
      d.lifespan = E.lifespanOf(d);
      if (d.age > d.lifespan && chance(state, 0.35)) {
        killDisciple(state, d, '寿元耗尽，坐化于' + (d.job ? (E.def(E.buildingById(state, d.job)) || { name: '山中' }).name : '山中') + '。');
        return;
      }
    }

    if (d.exp >= E.expNeed(d) && d.realm < 9) {
      if (d.autoBreakthrough) {
        tryBreakthrough(state, d, false);
      } else {
        d.stateLabel = '瓶颈';
      }
    }
  }

  function updateRelations(state) {
    var list = E.aliveDisciples(state);
    for (var i = 0; i < list.length; i++) {
      for (var j = i + 1; j < list.length; j++) {
        var a = list[i], b = list[j];
        a.relations = a.relations || {};
        b.relations = b.relations || {};
        var current = a.relations[b.id] == null ? 40 : a.relations[b.id];
        var drift = 0.08 + ((a.mood + b.mood) - 105) * 0.006 + (rand(state) - 0.5) * 0.7;
        current = clamp(current + drift, 0, 100);
        a.relations[b.id] = current;
        b.relations[a.id] = current;
        var key = [a.id, b.id].sort().join('_');
        state.flags.relNotes = state.flags.relNotes || {};
        if (current >= 72 && !state.flags.relNotes[key + '_friend']) {
          state.flags.relNotes[key + '_friend'] = true;
          E.log(state, a.name + '与' + b.name + '成了知己，常在一处说话。', 'disciple');
        }
        if (current <= 16 && !state.flags.relNotes[key + '_rival']) {
          state.flags.relNotes[key + '_rival'] = true;
          E.log(state, a.name + '与' + b.name + '起了嫌隙，见面也不说话。', 'warn');
        }
      }
    }
  }

  function killDisciple(state, d, text) {
    d.dead = true;
    d.health = 0;
    d.state = 'dead';
    d.stateLabel = '已故';
    state.buildings.forEach(function (b) {
      var idx = b.workers.indexOf(d.id);
      if (idx >= 0) b.workers.splice(idx, 1);
    });
    E.log(state, text, 'warn');
    if (d.id === state.playerId) {
      var successor = E.innerDisciples(state).filter(function (x) { return x.id !== d.id && !x.dead; }).sort(function (a, b) { return E.power(b, state) - E.power(a, state); })[0];
      if (successor) {
        state.playerId = successor.id;
        successor.title = '掌门';
        E.log(state, successor.name + '在祠堂前接任掌门。山门不能一日无主。', 'good');
      } else {
        state.ending = { type: 'ruin', title: '薪火断绝', text: '掌门坐化，山中再无内门弟子。青崖宗的灯，灭了。', day: state.day };
        E.log(state, '青崖宗断了传承。', 'warn');
      }
    }
    if (E.aliveDisciples(state).length === 0) {
      state.ending = { type: 'ruin', title: '山门寂寂', text: '最后一个弟子也走了。山风穿过空荡荡的静室，炉火一点点冷下去。', day: state.day };
    }
  }

  function tryBreakthrough(state, d, manual) {
    var need = E.expNeed(d);
    if (d.exp < need || d.realm >= 9) return { ok: false, msg: '修为尚不足。' };
    var p = E.breakChance(d, state);
    d.breakthroughBonus = 0;
    d.exp = Math.min(d.exp, need);
    if (chance(state, p)) {
      var r = E.realmInfo(d);
      var major = d.layer >= r.layers - 1;
      if (major) {
        d.realm++;
        d.layer = 0;
        if (d.realm >= 9) {
          d.realm = 9;
          d.layer = 0;
          d.exp = 0;
          d.lifespan = E.lifespanOf(d);
          state.ending = { type: 'ascension', title: '飞升', text: D.STORY.ascension + '\\n\\n' + d.name + '于青历' + E.getDate(state).year + '年飞升。', day: state.day, discipleId: d.id };
          E.log(state, d.name + '渡过天劫，白日飞升！', 'good');
          return { ok: true, major: true, ascended: true };
        }
        E.log(state, d.name + '破境成功，踏入' + D.REALMS[d.realm].name + '！', 'good');
      } else {
        d.layer++;
        E.log(state, d.name + '修为精进，已至' + E.stageName(d) + '。', 'good');
      }
      d.exp = 0;
      d.mood = clamp(d.mood + 8, 0, 100);
      d.lifespan = E.lifespanOf(d);
      state.stats.breakthroughs++;
      return { ok: true, major: major };
    }
    d.exp = Math.min(need * 0.6, d.exp);
    d.mood = clamp(d.mood - 9, 0, 100);
    d.injury = clamp(d.injury + 7, 0, 100);
    d.health = clamp(d.health - 5, 1, 100);
    E.log(state, d.name + '冲击瓶颈失败，受了些内伤。', 'warn');
    return { ok: false, msg: '突破失败。' };
  }

  /* ------------------------------------------------------------------ */
  /* 每日推进                                                           */
  /* ------------------------------------------------------------------ */
  E.tick = function (state) {
    if (!state || state.ending) return state;
    if (state.pendingEvent || state.pendingResult || state.pendingReport) return state;
    state.day++;
    state.stats.days = (state.stats.days || 0) + 1;

    // 天气
    if (chance(state, 0.18)) {
      var season = E.season(state);
      var pool = D.WEATHER.filter(function (w) { return season.key === 'winter' ? true : !w.winter; });
      var w = pick(state, pool);
      if (w.id !== state.weather) {
        state.weather = w.id;
        E.log(state, '天色转' + w.name + '。', 'system');
      }
    }

    // 建造
    state.buildings.forEach(function (b) {
      if (b.construction > 0) {
        b.construction -= 1;
        if (b.construction <= 0) {
          b.construction = 0;
          E.log(state, (E.def(b) || { name: '建筑' }).name + '落成。', 'good');
        }
      }
    });

    // buff
    (state.buffs || []).forEach(function (b) { b.days--; });
    state.buffs = (state.buffs || []).filter(function (b) { return b.days > 0; });

    // 自动安排空闲弟子：按灵根、性情与空缺择最合适的差事
    E.aliveDisciples(state).forEach(function (d) {
      if (d.missionId || d.job || d.jobMode === 'manual') return;
      E.autoAssign(state, d.id);
    });

    var stats = applyProduction(state);
    var foodNeed = consumeFood(state);

    // 弟子日常
    E.aliveDisciples(state).forEach(function (d) {
      if (d.missionId) return;
      updateDisciple(state, d);
      if (state.ending) return;
    });

    updateRelations(state);

    // 任务
    state.missions.slice().forEach(function (m) {
      m.daysLeft--;
      if (m.daysLeft <= 0) resolveMission(state, m);
    });
    processMissionOrders(state);

    // 坊市补货
    if (state.day >= state.market.restockDay) {
      E.refreshMarket(state);
      E.log(state, '山下坊市换了新货。', 'system');
    }

    // 事件
    maybeEvent(state);

    // 宗门品阶提升
    var st = E.sectStats(state);
    if (st.gradeIndex > (state.flags.gradeIndex || 0)) {
      state.flags.gradeIndex = st.gradeIndex;
      E.log(state, '青崖宗晋为' + st.grade.name + '！山下开始有人谈论山门的名号。', 'good');
      state.resources.renown += 2;
    }
    state.stats.maxRenown = Math.max(state.stats.maxRenown || 0, state.resources.renown || 0);

    if (!state.log.length || state.log[0].day !== state.day) {
      // 每天至少留一条痕迹，避免日志断档
      var flavor = ['山雾在辰时散去。', '远处传来樵夫的歌声。', '灵田里有虫鸣。', '静室的香烧到了尽头。', '山风掠过檐角。'];
      if (state.day % 4 === 0) E.log(state, pick(state, flavor), 'system');
    }
    return state;
  };

  E.tickDays = function (state, days) {
    for (var i = 0; i < days; i++) {
      if (state.ending || state.pendingEvent || state.pendingResult || state.pendingReport) break;
      E.tick(state);
    }
    return state;
  };

  /* ------------------------------------------------------------------ */
  /* 建造 / 安排                                                        */
  /* ------------------------------------------------------------------ */
  E.canAfford = function (state, cost) {
    if (!cost) return true;
    var ok = true;
    Object.keys(cost).forEach(function (k) {
      if ((state.resources[k] || 0) < cost[k]) ok = false;
    });
    return ok;
  };

  E.pay = function (state, cost) {
    if (!E.canAfford(state, cost)) return false;
    Object.keys(cost).forEach(function (k) { state.resources[k] -= cost[k]; });
    return true;
  };

  E.build = function (state, type, x, y) {
    var def = D.BUILDINGS[type];
    if (!def) return { ok: false, msg: '未知建筑。' };
    if (def.unique && state.buildings.some(function (b) { return b.type === type; })) return { ok: false, msg: '此建筑只能有一座。' };
    if (def.unlock && !E.hasResearch(state, def.unlock)) return { ok: false, msg: '尚未参研出营造之法。' };
    if (!E.isBuildable(state, x, y)) return { ok: false, msg: '此处无法营造。' };
    if (!E.canAfford(state, def.cost)) return { ok: false, msg: '木石灵石不足。' };
    E.pay(state, def.cost);
    var b = {
      id: 'b' + (state.nextBuildingId++), type: type, x: x, y: y,
      level: 1, construction: def.buildDays > 0 ? def.buildDays : 0,
      workers: [], recipe: type === 'alchemy' ? 'huichun' : null, progress: 0, batch: null
    };
    state.buildings.push(b);
    state.stats.built = (state.stats.built || 0) + 1;
    E.log(state, '开始营造' + def.name + '。', 'build');
    return { ok: true, building: b };
  };

  /* 自动择地：靠近现有屋舍，但避开山道；同类建筑略有聚集。 */
  E.findBuildSpot = function (state, type) {
    var def = D.BUILDINGS[type];
    if (!def) return null;
    var buildings = state.buildings || [];
    var ax = D.MAP_W / 2, ay = D.MAP_H / 2;
    if (buildings.length) {
      ax = 0; ay = 0;
      buildings.forEach(function (b) { ax += b.x; ay += b.y; });
      ax /= buildings.length; ay /= buildings.length;
    }
    var prefer = {
      alchemy: ['herb', 'well'], meditation: ['array', 'shrine'], dorm: ['well', 'kitchen'],
      farm: ['well', 'herb'], herb: ['well', 'farm'], kitchen: ['farm', 'well'],
      library: ['shrine', 'meditation'], infirmary: ['herb'], arena: ['meditation'],
      guest: ['gate'], storage: ['gate', 'kitchen'], shrine: ['meditation'],
      array: ['meditation'], well: ['farm', 'herb', 'kitchen'], pavilion: ['well'],
      gate: ['pavilion']
    }[type] || [];
    var paths = state.paths || [];
    var best = null, bestScore = -Infinity;
    for (var y = 0; y < D.MAP_H; y++) {
      for (var x = 0; x < D.MAP_W; x++) {
        if (!E.isBuildable(state, x, y)) continue;
        var dist = Math.abs(x - ax) + Math.abs(y - ay);
        var adj = 0, pref = 0;
        buildings.forEach(function (b) {
          var dx = Math.abs(b.x - x), dy = Math.abs(b.y - y);
          if (Math.max(dx, dy) <= 1) adj++;
          if (dx + dy <= 2 && prefer.indexOf(b.type) >= 0) pref++;
        });
        var onPath = paths.some(function (p) { return p[0] === x && p[1] === y; });
        var edge = (x < 1 || y < 1 || x > D.MAP_W - 2 || y > D.MAP_H - 2) ? 2 : 0;
        var score = -dist * 1.35 + adj * 1.4 + pref * 2.8 - (onPath ? 7 : 0) - edge
          + ((x * 31 + y * 17) % 13) * 0.001;
        if (score > bestScore) { bestScore = score; best = { x: x, y: y }; }
      }
    }
    return best;
  };

  E.buildAuto = function (state, type) {
    var def = D.BUILDINGS[type];
    if (!def) return { ok: false, msg: '未知建筑。' };
    if (def.unique && state.buildings.some(function (b) { return b.type === type; })) return { ok: false, msg: '此建筑只能有一座。' };
    if (def.unlock && !E.hasResearch(state, def.unlock)) return { ok: false, msg: '尚未参研出营造之法。' };
    if (!E.canAfford(state, def.cost)) return { ok: false, msg: '木石灵石不足。' };
    var spot = E.findBuildSpot(state, type);
    if (!spot) return { ok: false, msg: '山中已无空地可营造。' };
    var res = E.build(state, type, spot.x, spot.y);
    if (res.ok) res.spot = spot;
    return res;
  };

  E.upgrade = function (state, buildingId) {
    var b = E.buildingById(state, buildingId);
    if (!b) return { ok: false, msg: '建筑不存在。' };
    var def = E.def(b);
    if (!def) return { ok: false, msg: '建筑不存在。' };
    if (b.construction > 0) return { ok: false, msg: '建筑尚未落成，无法扩建。' };
    if (b.level >= def.maxLevel) return { ok: false, msg: '已至最高等级。' };
    var cost = {};
    var base = def.upgradeCost || def.cost || {};
    Object.keys(base).forEach(function (k) { cost[k] = Math.round(base[k] * (1 + (b.level - 1) * 0.8)); });
    if (!E.pay(state, cost)) return { ok: false, msg: '资源不足。' };
    b.level++;
    E.log(state, def.name + '扩建至 ' + b.level + ' 级。', 'build');
    return { ok: true, cost: cost };
  };

  E.demolish = function (state, buildingId) {
    var b = E.buildingById(state, buildingId);
    if (!b) return { ok: false, msg: '建筑不存在。' };
    var def = E.def(b);
    if (b.type === 'gate') return { ok: false, msg: '山门不可拆除。' };
    b.workers.forEach(function (id) {
      var d = E.discipleById(state, id);
      if (d) d.job = null;
    });
    var refund = {};
    var cost = def.cost || {};
    Object.keys(cost).forEach(function (k) { refund[k] = Math.floor(cost[k] * 0.5); });
    Object.keys(refund).forEach(function (k) { state.resources[k] = (state.resources[k] || 0) + refund[k]; });
    state.buildings = state.buildings.filter(function (x) { return x.id !== buildingId; });
    E.log(state, '拆除了' + def.name + '。', 'build');
    return { ok: true };
  };

  E.assign = function (state, discipleId, buildingId, opts) {
    opts = opts || {};
    var auto = !!opts.auto;
    var d = E.discipleById(state, discipleId);
    if (!d || d.dead) return { ok: false, msg: '弟子不在山中。' };
    if (d.missionId) return { ok: false, msg: '弟子正在外历练。' };
    var b = null, def = null;
    if (buildingId) {
      b = E.buildingById(state, buildingId);
      if (!b) return { ok: false, msg: '建筑不存在。' };
      if (b.construction > 0) return { ok: false, msg: '建筑尚未落成。' };
      def = E.def(b);
      if (!def || !def.slots) return { ok: false, msg: '此处不需要人手。' };
      if (b.workers.length >= E.slotsOf(b) && b.workers.indexOf(d.id) < 0) return { ok: false, msg: '此处已满员。' };
      if (!canWorkAt(b, d)) {
        return { ok: false, msg: d.role === 'inner' ? '内门弟子不做这些粗活，可去静室、丹房、藏经阁或演武场。' : '外门弟子尚未筑基，不能入静室修炼。' };
      }
      if (d.job === b.id) {
        d.jobMode = auto ? 'auto' : 'manual';
        d.preferredJob = auto ? null : b.id;
        return { ok: true, msg: '已在此当值。' };
      }
    }
    // 新差事验证通过后，再移除旧差事
    if (d.job) {
      var old = E.buildingById(state, d.job);
      if (old) old.workers = old.workers.filter(function (id) { return id !== d.id; });
      d.job = null;
    }
    d.jobMode = auto ? 'auto' : 'manual';
    d.preferredJob = auto ? null : (buildingId || null);
    if (!buildingId) return { ok: true };
    b.workers.push(d.id);
    d.job = b.id;
    return { ok: true };
  };

  E.eligibleJobs = function (state, d) {
    if (!d || d.dead) return [];
    return state.buildings.filter(function (b) {
      var def = E.def(b);
      if (!def || !def.slots || b.construction > 0) return false;
      if (b.workers.length >= E.slotsOf(b)) return false;
      return canWorkAt(b, d);
    });
  };

  /* 给弟子挑一份最合适的差事：内门优先静室，外门按灵根与空缺补位。 */
  E.recommendedJob = function (state, d) {
    if (!d || d.dead) return null;
    var candidates = state.buildings.filter(function (b) {
      var def = E.def(b);
      if (!def || !def.slots || b.construction > 0) return false;
      if (!canWorkAt(b, d)) return false;
      return b.workers.length < E.slotsOf(b) || b.id === d.job;
    });
    if (!candidates.length) return null;
    var priorities = d.role === 'inner'
      ? { meditation: 100, library: 58, alchemy: 54, arena: 46, infirmary: 30 }
      : { farm: 58, herb: 56, kitchen: 52, infirmary: 42, library: 38, alchemy: 34 };
    var best = null, bestScore = -Infinity;
    candidates.forEach(function (b) {
      var def = E.def(b);
      var score = priorities[b.type] || 10;
      if (b.id === d.job) score += 8;
      score += (1 - b.workers.length / Math.max(1, E.slotsOf(b))) * 12;
      if (def.aura) score += def.aura;
      var traits = d.traits || [];
      if (b.type === 'farm' || b.type === 'herb') {
        if (traits.indexOf('shennong') >= 0) score += 32;
      }
      if (b.type === 'alchemy' && traits.indexOf('alchemy') >= 0) score += 36;
      if (b.type === 'library' && traits.indexOf('scholar') >= 0) score += 30;
      if (b.type === 'meditation') score += E.aptitude(d) * 2;
      if (traits.indexOf('diligent') >= 0) score += 5;
      if (traits.indexOf('lazy') >= 0) score -= 6;
      if (score > bestScore) { bestScore = score; best = b; }
    });
    return best;
  };

  E.autoAssign = function (state, discipleId) {
    var d = E.discipleById(state, discipleId);
    if (!d || d.dead) return { ok: false, msg: '弟子不在山中。' };
    if (d.missionId) return { ok: false, msg: '弟子正在外历练。' };
    var b = E.recommendedJob(state, d);
    if (!b) return { ok: false, msg: '山中暂无合适差事。' };
    var res = E.assign(state, d.id, b.id, { auto: true });
    if (res.ok) res.building = b;
    return res;
  };

  E.autoStaff = function (state, buildingId) {
    var b = E.buildingById(state, buildingId);
    if (!b) return { ok: false, msg: '建筑不存在。' };
    var def = E.def(b);
    if (!def || !def.slots) return { ok: false, msg: '此处不需要人手。' };
    if (b.construction > 0) return { ok: false, msg: '建筑尚未落成。' };
    var room = E.slotsOf(b) - b.workers.length;
    if (room <= 0) return { ok: false, msg: '此处已满员。' };
    var pool = E.aliveDisciples(state).filter(function (d) {
      return !d.missionId && !d.job && d.jobMode !== 'manual' && d.id !== b.workers[0] && canWorkAt(b, d);
    }).sort(function (a, c) {
      var sa = E.aptitude(a) + (a.traits || []).length * 0.2;
      var sc = E.aptitude(c) + (c.traits || []).length * 0.2;
      return sc - sa;
    });
    var added = 0;
    for (var i = 0; i < pool.length && added < room; i++) {
      if (E.assign(state, pool[i].id, b.id, { auto: true }).ok) added++;
    }
    if (!added) return { ok: false, msg: '暂无空闲弟子可补位。' };
    E.log(state, def.name + '补入 ' + added + ' 名弟子。', 'job');
    return { ok: true, count: added };
  };

  E.promote = function (state, discipleId) {
    var d = E.discipleById(state, discipleId);
    if (!d || d.dead) return { ok: false, msg: '弟子不在山中。' };
    if (d.role !== 'outer') return { ok: false, msg: '该弟子已是内门。' };
    if (d.realm < 1 && (d.realm < 0 || d.layer < 2)) return { ok: false, msg: '至少修至炼气三层，方可晋升内门。' };
    if (E.aptitude(d) < 2) return { ok: false, msg: '资质不足，强行筑基恐伤根基。' };
    if ((state.resources.stones || 0) < 50) return { ok: false, msg: '需 50 灵石为筑基之资。' };
    state.resources.stones -= 50;
    if (d.job) {
      var old = E.buildingById(state, d.job);
      if (old) old.workers = old.workers.filter(function (id) { return id !== d.id; });
    }
    d.job = null;
    d.role = 'inner';
    d.title = '内门弟子';
    d.mood = clamp(d.mood + 12, 0, 100);
    state.stats.promoted++;
    state.resources.renown += 3;
    var med = state.buildings.find(function (b) { return b.type === 'meditation' && !b.construction && b.workers.length < E.slotsOf(b); });
    if (med) { med.workers.push(d.id); d.job = med.id; }
    E.log(state, d.name + '筑基成功，晋升内门！', 'good');
    return { ok: true };
  };

  E.tryBreakthrough = function (state, discipleId, usePill) {
    var d = E.discipleById(state, discipleId);
    if (!d) return { ok: false, msg: '弟子不存在。' };
    if (d.exp < E.expNeed(d) || d.realm >= 9) return { ok: false, msg: '修为尚不足。' };
    if (usePill) {
      if (!state.pills.pojing) return { ok: false, msg: '没有破境丹。' };
      state.pills.pojing--;
      d.breakthroughBonus = (d.breakthroughBonus || 0) + 0.25;
    }
    return tryBreakthrough(state, d, true);
  };

  /* ------------------------------------------------------------------ */
  /* 丹药                                                               */
  /* ------------------------------------------------------------------ */
  E.usePill = function (state, discipleId, pillId) {
    var d = E.discipleById(state, discipleId);
    var p = D.PILLS[pillId];
    if (!d || d.dead) return { ok: false, msg: '弟子不在山中。' };
    if (!p) return { ok: false, msg: '没有这种丹药。' };
    if (!(state.pills[pillId] > 0)) return { ok: false, msg: '丹药不足。' };
    state.pills[pillId]--;
    var e = p.effect || {};
    var details = [];
    if (e.health) { d.health = clamp(d.health + e.health, 1, 100); details.push('气血 +' + e.health); }
    if (e.injury) { d.injury = clamp(d.injury + e.injury, 0, 100); details.push('伤势 -' + Math.abs(e.injury)); }
    if (e.mood) { d.mood = clamp(d.mood + e.mood, 0, 100); details.push('心境 +' + e.mood); }
    if (e.insight) { state.insight += e.insight; details.push('悟道 +' + e.insight); }
    if (e.expPct) { var add = Math.round(E.expNeed(d) * e.expPct); d.exp += add; details.push('修为 +' + add); }
    if (e.breakthrough) { d.breakthroughBonus = (d.breakthroughBonus || 0) + e.breakthrough; details.push('下次突破 +' + Math.round(e.breakthrough * 100) + '%'); }
    if (e.aptitude) {
      if (E.aptitude(d) >= 5) details.push('资质已至上限');
      else { d.aptitude += 1; details.push('资质 +1'); }
    }
    E.log(state, d.name + '服下' + p.name + '。' + (details.length ? details.join('，') : ''), 'disciple');
    return { ok: true, details: details };
  };

  /* ------------------------------------------------------------------ */
  /* 招徒                                                               */
  /* ------------------------------------------------------------------ */
  E.recruitCandidates = function (state) {
    if (state.recruitCooldown > state.day) return { ok: false, msg: '山门刚招过徒，过些日子再说。' };
    if ((state.resources.stones || 0) < 20) return { ok: false, msg: '需要 20 灵石置办招徒的文书与盘缠。' };
    state.resources.stones -= 20;
    state.recruitCooldown = state.day + 12;
    var guest = state.buildings.some(function (b) { return b.type === 'guest' && !b.construction; });
    var list = [];
    var count = 2 + (guest ? 1 : 0);
    for (var i = 0; i < count; i++) {
      var d = E.generateDisciple(state, {
        role: 'outer', realm: 0, layer: randInt(state, 0, 1),
        aptitude: clamp(randInt(state, guest ? 2 : 1, guest ? 4 : 3), 1, 4)
      });
      d.candidate = true;
      d.bio = d.origin;
      list.push(d);
    }
    state.recruitCandidates = list;
    return { ok: true, candidates: list };
  };

  E.chooseRecruit = function (state, id) {
    if (!state.recruitCandidates) return { ok: false, msg: '没有待选的弟子。' };
    var idx = state.recruitCandidates.findIndex(function (d) { return d.id === id; });
    if (idx < 0) return { ok: false, msg: '没有这名弟子。' };
    var d = state.recruitCandidates[idx];
    d.candidate = false;
    state.disciples.push(d);
    linkRelations(state, d);
    state.recruitCandidates = null;
    state.stats.recruited++;
    state.resources.renown += 1;
    E.log(state, d.name + '拜入山门，成为外门弟子。', 'good');
    return { ok: true, disciple: d };
  };

  E.closeRecruit = function (state) { state.recruitCandidates = null; };

  /* ------------------------------------------------------------------ */
  /* 参研                                                               */
  /* ------------------------------------------------------------------ */
  E.researchNode = function (state, id) {
    var node = D.RESEARCH.find(function (n) { return n.id === id; });
    if (!node) return { ok: false, msg: '没有这项参研。' };
    if (E.hasResearch(state, id)) return { ok: false, msg: '已经参研过了。' };
    if ((node.requires || []).some(function (r) { return !E.hasResearch(state, r); })) return { ok: false, msg: '前置参研尚未完成。' };
    if ((state.insight || 0) < node.cost) return { ok: false, msg: '悟道不足。' };
    state.insight -= node.cost;
    state.research.nodes[id] = true;
    state.research.totalSpent = (state.research.totalSpent || 0) + node.cost;
    E.log(state, '参研《' + node.name + '》有成。' + node.effect, 'good');
    return { ok: true };
  };

  /* ------------------------------------------------------------------ */
  /* 历练                                                               */
  /* ------------------------------------------------------------------ */
  E.missionReachable = function (state, mission) {
    return (state.resources.renown || 0) >= (mission.minRenown || 0);
  };

  E.startMission = function (state, missionId, discipleIds, opts) {
    opts = opts || {};
    var m = D.MISSIONS.find(function (x) { return x.id === missionId; });
    if (!m) return { ok: false, msg: '没有这个地方。' };
    if (!E.missionReachable(state, m)) return { ok: false, msg: '声望不足，尚无人知晓这条山路。' };
    if (!discipleIds || !discipleIds.length) return { ok: false, msg: '至少派一名弟子。' };
    if (discipleIds.length > 2) return { ok: false, msg: '一队最多两名弟子。' };
    if (state.missions.length >= 2) return { ok: false, msg: '已有两队弟子在外，山中人手不够了。' };
    var order = null;
    if (opts.orderId) {
      order = (state.missionOrders || []).find(function (o) { return o.id === opts.orderId && o.enabled; });
      if (!order) return { ok: false, msg: '常驻历练已停止。' };
    } else if (opts.repeat) {
      var existingOrder = (state.missionOrders || []).find(function (o) { return o.enabled && o.missionId === missionId; });
      if (existingOrder) return { ok: false, msg: '此地已有常驻队伍，先叫停原来的安排。' };
    }
    var team = [];
    for (var i = 0; i < discipleIds.length; i++) {
      var d = E.discipleById(state, discipleIds[i]);
      if (!d || d.dead) return { ok: false, msg: '弟子不在山中。' };
      if (d.missionId) return { ok: false, msg: '该弟子已经在外。' };
      if (d.health < 30) return { ok: false, msg: d.name + '伤势未愈，不宜远行。' };
      if (!m.allowOuter && d.role !== 'inner') return { ok: false, msg: '此地凶险，外门弟子去不得。' };
      if (d.realm < (m.minRealm || 0)) return { ok: false, msg: d.name + '境界不足。' };
      team.push(d);
    }
    var power = team.reduce(function (s, d) { return s + E.power(d, state); }, 0);
    if (power < (m.minPower || 0)) return { ok: false, msg: '队伍战力不足，去了恐怕回不来。' };
    var foodCost = 3 * team.length;
    if ((state.resources.food || 0) < foodCost) return { ok: false, msg: '干粮不够，至少需要 ' + foodCost + ' 食物。' };
    state.resources.food -= foodCost;
    if (!order && opts.repeat) {
      order = {
        id: 'o' + (state.nextMissionOrderId++),
        missionId: m.id,
        discipleIds: team.map(function (d) { return d.id; }),
        enabled: true,
        nextTryDay: state.day + m.days + 2,
        lastError: ''
      };
      state.missionOrders.push(order);
    }
    if (order) {
      order.discipleIds = team.map(function (d) { return d.id; });
      order.nextTryDay = state.day + m.days + 2;
      order.lastError = '';
    }
    var mission = {
      id: 'm' + (state.stats.missions + 1) + '_' + state.day,
      missionId: m.id, name: m.name, danger: m.danger,
      days: m.days, daysLeft: m.days, startDay: state.day,
      discipleIds: team.map(function (d) { return d.id; }),
      teamPower: power,
      orderId: order ? order.id : null,
      repeat: !!order
    };
    state.missions.push(mission);
    team.forEach(function (d) {
      if (d.job) {
        var b = E.buildingById(state, d.job);
        if (b) b.workers = b.workers.filter(function (id) { return id !== d.id; });
      }
      d.job = null;
      d.missionId = mission.id;
      d.state = 'mission';
      d.stateLabel = '在外';
    });
    state.stats.missions++;
    E.log(state, team.map(function (d) { return d.name; }).join('、') + '启程前往' + m.name + '。', 'event');
    return { ok: true, mission: mission };
  };

  E.stopMissionOrder = function (state, orderId) {
    var order = (state.missionOrders || []).find(function (o) { return o.id === orderId; });
    if (!order) return { ok: false, msg: '常驻历练不存在。' };
    state.missionOrders = state.missionOrders.filter(function (o) { return o.id !== orderId; });
    state.missions.forEach(function (m) {
      if (m.orderId === orderId) { m.orderId = null; m.repeat = false; }
    });
    E.log(state, '常驻历练已停止，队伍完成本次行程后回山。', 'system');
    return { ok: true };
  };

  function processMissionOrders(state) {
    if (state.missions.length >= 2) return;
    (state.missionOrders || []).slice().forEach(function (order) {
      if (!order.enabled || state.missions.length >= 2 || state.day < order.nextTryDay) return;
      var team = order.discipleIds.map(function (id) { return E.discipleById(state, id); }).filter(Boolean);
      if (team.length !== order.discipleIds.length || team.some(function (d) { return d.dead; })) {
        order.enabled = false;
        E.log(state, '常驻历练的队伍已散，行程中止。', 'warn');
        return;
      }
      if (team.some(function (d) { return d.missionId; })) return;
      var res = E.startMission(state, order.missionId, order.discipleIds, { orderId: order.id });
      if (res.ok) {
        order.lastError = '';
        order.nextTryDay = state.day + res.mission.days + 2;
      } else {
        order.lastError = res.msg;
        order.nextTryDay = state.day + 2;
      }
    });
    state.missionOrders = state.missionOrders.filter(function (o) { return o.enabled; });
  }

  function resolveMission(state, m) {
    var region = D.MISSIONS.find(function (x) { return x.id === m.missionId; });
    if (!region) return;
    var order = m.orderId ? (state.missionOrders || []).find(function (o) { return o.id === m.orderId; }) : null;
    state.missions = state.missions.filter(function (x) { return x.id !== m.id; });
    var team = m.discipleIds.map(function (id) { return E.discipleById(state, id); }).filter(Boolean);
    var enemyPower = 24 + region.danger * 72 + E.getDate(state).year * 16;
    var ratio = m.teamPower / Math.max(1, enemyPower);
    var teamLuck = team.reduce(function (sum, d) { return sum + E.traitMod(d, 'luck') + (d.originLuck || 0); }, 0) * 0.01;
    var successChance = clamp(0.38 + (ratio - 1) * 0.48 + (region.danger === 0 ? 0.3 : 0) + teamLuck, 0.12, 0.95);
    var success = chance(state, successChance);
    var lines = [];
    lines.push('队伍在' + region.name + '走了' + region.days + '日。' + region.flavor);
    if (success) {
      lines.push('一路虽有惊险，总算平安归来。');
    } else {
      lines.push('途中遭遇伏击，队伍且战且退，带伤返回。');
    }
    var rewards = {};
    Object.keys(region.rewards).forEach(function (k) {
      var range = region.rewards[k];
      if (!Array.isArray(range)) return;
      var amount = randInt(state, range[0], range[1]);
      if (!success) amount = Math.floor(amount * 0.45);
      if (k === 'renown') amount = Math.round(amount);
      if (k === 'pills') return;
      rewards[k] = (rewards[k] || 0) + amount;
      state.resources[k] = (state.resources[k] || 0) + amount;
    });
    if (region.rewards.pills && success) {
      var pill = pick(state, region.rewards.pills);
      state.pills[pill] = (state.pills[pill] || 0) + 1;
      rewards.pills = [pill];
    }
    var exp = 25 + region.danger * 45;
    team.forEach(function (d) {
      d.exp += success ? exp : Math.floor(exp * 0.45);
      d.hunger = clamp(d.hunger - 18, 0, 100);
      d.energy = clamp(d.energy - 20, 0, 100);
      d.injury = clamp(d.injury + (success ? randInt(state, 2, 10) : randInt(state, 12, 28)), 0, 100);
      d.health = clamp(d.health - (success ? randInt(state, 0, 5) : randInt(state, 8, 20)), 1, 100);
      d.missionId = null;
      d.state = 'idle';
      d.stateLabel = '归来';
      d.mood = clamp(d.mood + (success ? 6 : -8), 0, 100);
      if (d.health <= 1 && region.danger >= 4 && chance(state, 0.08)) {
        killDisciple(state, d, d.name + '在' + region.name + '重伤不治，没能回到山门。');
      }
    });
    if (order) order.nextTryDay = state.day + 2;
    team.forEach(function (d) {
      if (d.dead) return;
      if (d.jobMode === 'manual' && d.preferredJob) {
        var preferred = E.buildingById(state, d.preferredJob);
        if (preferred && E.assign(state, d.id, preferred.id).ok) return;
      }
      E.autoAssign(state, d.id);
    });
    if (!success) state.resources.renown = Math.max(0, state.resources.renown - 1);
    E.log(state, '历练归来：' + (success ? '收获颇丰' : '损兵折将') + '（' + region.name + '）。', success ? 'good' : 'warn');
    if (order) {
      var rewardText = Object.keys(rewards).map(function (k) {
        return (D.RESOURCES[k] ? D.RESOURCES[k].name : k) + ' ' + rewards[k];
      }).join('、');
      E.log(state, '常驻队伍回到山门，休整两日后再赴' + region.name + '。' + (rewardText ? '带回' + rewardText + '。' : ''), success ? 'good' : 'warn');
    } else {
      var report = {
        type: 'mission', title: region.name + ' · 历练归来',
        success: success, lines: lines, rewards: rewards, team: team.map(function (d) { return d.name; }),
        summary: success ? '此行顺利。' : '此行不利，弟子们需要休养。'
      };
      addReport(state, report);
    }
  }

  /* ------------------------------------------------------------------ */
  /* 战斗                                                               */
  /* ------------------------------------------------------------------ */
  function simulateBattle(state, opts) {
    opts = opts || {};
    var team = E.innerDisciples(state).filter(function (d) { return !d.missionId && d.health > 20; });
    if (!team.length) team = E.aliveDisciples(state).filter(function (d) { return d.health > 20; }).slice(0, 3);
    var enemyPower = opts.power || (45 + (opts.danger || 1) * 65 + E.getDate(state).year * 18);
    var teamPower = team.reduce(function (s, d) { return s + E.power(d, state); }, 0);
    var st = E.sectStats(state);
    teamPower *= 1 + st.aura / 500 + st.fengShui / 1000;
    var teamHp = Math.max(1, teamPower * 1.7);
    var enemyHp = Math.max(1, enemyPower * 2.0);
    var lines = [];
    lines.push('敌方：' + (opts.name || '来犯之敌') + '（战力 ' + Math.round(enemyPower) + '）');
    lines.push('我方：' + (team.length ? team.map(function (d) { return d.name; }).join('、') : '无人可战') + '（战力 ' + Math.round(teamPower) + '）');
    var win = false;
    if (!team.length) {
      lines.push('山门内没有能出战的内门弟子。');
    } else {
      for (var r = 1; r <= 6; r++) {
        var teamDmg = teamPower * (0.24 + rand(state) * 0.13);
        enemyHp -= teamDmg;
        if (enemyHp <= 0) { win = true; lines.push('第' + r + '合：' + team[randInt(state, 0, team.length - 1)].name + '一剑破敌，敌方溃散。'); break; }
        var enemyDmg = enemyPower * (0.18 + rand(state) * 0.12);
        teamHp -= enemyDmg;
        lines.push('第' + r + '合：我方攻势 ' + Math.round(teamDmg) + '，敌方反扑 ' + Math.round(enemyDmg) + '。');
        if (teamHp <= 0) { lines.push('阵线被冲散，众人退守山门。'); break; }
      }
      win = win || enemyHp <= 0;
    }
    var injuryBase = win ? 4 + (opts.danger || 1) * 4 : 12 + (opts.danger || 1) * 8;
    team.forEach(function (d) {
      var risk = 1 + E.traitMod(d, 'injuryRisk');
      d.injury = clamp(d.injury + Math.round(randInt(state, injuryBase - 2, injuryBase + 8) * risk), 0, 100);
      d.health = clamp(d.health - (win ? randInt(state, 0, 8) : randInt(state, 8, 22)), 1, 100);
      d.mood = clamp(d.mood + (win ? 5 : -8), 0, 100);
    });
    var rewards = {};
    if (win) {
      var stones = randInt(state, 18, 40) + (opts.danger || 1) * 20;
      var renown = 2 + (opts.danger || 1) * 2;
      var herbs = randInt(state, 1, 3 + (opts.danger || 1) * 2);
      state.resources.stones += stones;
      state.resources.renown += renown;
      state.resources.herbs += herbs;
      rewards.stones = stones; rewards.renown = renown; rewards.herbs = herbs;
      if (chance(state, 0.25 + (opts.danger || 1) * 0.05)) {
        var pill = pick(state, ['huichun', 'juqi', 'pojing']);
        state.pills[pill] = (state.pills[pill] || 0) + 1;
        rewards.pills = [pill];
      }
      state.stats.battlesWon++;
      lines.push(pick(state, D.BATTLE_FLAVOR.win));
    } else {
      var storage = state.buildings.filter(function (b) { return b.type === 'storage' && !b.construction; }).reduce(function (s, b) { return s + 0.15 * (b.level || 1); }, 0);
      var protectedRate = clamp(storage, 0, 0.5);
      var lostStones = Math.floor((state.resources.stones || 0) * 0.12 * (1 - protectedRate));
      var lostFood = Math.floor((state.resources.food || 0) * 0.12 * (1 - protectedRate));
      state.resources.stones = Math.max(0, state.resources.stones - lostStones);
      state.resources.food = Math.max(0, state.resources.food - lostFood);
      state.resources.renown = Math.max(0, state.resources.renown - 2);
      rewards.stones = -lostStones; rewards.food = -lostFood; rewards.renown = -2;
      state.stats.battlesLost++;
      lines.push(pick(state, D.BATTLE_FLAVOR.lose));
    }
    E.log(state, (win ? '击退' : '不敌') + (opts.name || '来犯之敌') + '。', win ? 'good' : 'warn');
    return {
      type: 'battle', title: win ? '山门捷报' : '山门败退', success: win,
      lines: lines, rewards: rewards, team: team.map(function (d) { return d.name; }),
      summary: win ? '来犯之敌已退。' : '弟子们带伤退回山门。'
    };
  }

  E.simulateBattle = simulateBattle;

  function addReport(state, report) {
    if (!state.pendingReport && !state.pendingResult) state.pendingReport = report;
    else state.reportQueue.push(report);
  }

  E.closeReport = function (state) {
    state.pendingReport = null;
    if (state.reportQueue.length) {
      state.pendingReport = state.reportQueue.shift();
    }
  };

  E.closeResult = function (state) {
    state.pendingResult = null;
    if (state.reportQueue.length && !state.pendingReport) {
      state.pendingReport = state.reportQueue.shift();
    }
  };

  /* ------------------------------------------------------------------ */
  /* 事件                                                               */
  /* ------------------------------------------------------------------ */
  E.getEvent = function (id) { return EV.find(function (e) { return e.id === id; }); };

  function eventEligible(state, ev) {
    if (ev.once && state.flags['evt_' + ev.id]) return false;
    if (ev.minDay && state.day < ev.minDay) return false;
    if (ev.minRenown && (state.resources.renown || 0) < ev.minRenown) return false;
    if (ev.cooldown && state.eventLast[ev.id] && state.day - state.eventLast[ev.id] < ev.cooldown) return false;
    return true;
  }

  function triggerEvent(state, ev) {
    state.pendingEvent = ev.id;
    state.eventLast[ev.id] = state.day;
    state.lastEventDay = state.day;
    if (ev.once) state.flags['evt_' + ev.id] = true;
    E.log(state, '山门有事：' + ev.title, 'event');
  }

  function maybeEvent(state) {
    if (state.pendingEvent || state.pendingResult || state.pendingReport) return;
    /* 两桩山门事之间至少隔半月，避免弹窗连番打断。 */
    if (state.lastEventDay && state.day - state.lastEventDay < 15) return;
    var eligible = EV.filter(function (e) { return eventEligible(state, e); });
    if (!eligible.length) return;
    var priority = eligible.filter(function (e) { return e.priority; });
    if (priority.length) {
      triggerEvent(state, priority[0]);
      return;
    }
    if (state.day < 8) return;
    var good = 0.025;
    if (chance(state, good)) {
      var ev = pickWeighted(state, eligible);
      if (ev) triggerEvent(state, ev);
    }
  }

  E.eventChoices = function (state, eventId) {
    var ev = E.getEvent(eventId);
    if (!ev) return [];
    return ev.choices.map(function (c, i) {
      var available = true, reason = '';
      if (c.cost) {
        Object.keys(c.cost).forEach(function (k) {
          if ((state.resources[k] || 0) < c.cost[k]) { available = false; reason = '资源不足'; }
        });
      }
      if (c.require && c.require.pill) {
        if (!(state.pills[c.require.pill] > 0)) { available = false; reason = '缺少' + D.PILLS[c.require.pill].name; }
      }
      return { index: i, label: c.label, hint: c.hint || '', available: available, reason: reason };
    });
  };

  E.resolveEvent = function (state, choiceIndex) {
    var ev = E.getEvent(state.pendingEvent);
    if (!ev) return { ok: false, msg: '事件已经结束。' };
    var choice = ev.choices[choiceIndex];
    if (!choice) return { ok: false, msg: '没有这个选择。' };
    var checks = E.eventChoices(state, ev.id);
    var available = checks[choiceIndex] && checks[choiceIndex].available;
    if (!available) return { ok: false, msg: (checks[choiceIndex] && checks[choiceIndex].reason) || '条件不足。' };
    if (choice.cost) {
      Object.keys(choice.cost).forEach(function (k) { state.resources[k] -= choice.cost[k]; });
    }
    if (choice.require && choice.require.pill) {
      state.pills[choice.require.pill] = Math.max(0, (state.pills[choice.require.pill] || 0) - 1);
    }
    var details = [];
    var eff = choice.effects || {};
    Object.keys(eff).forEach(function (k) {
      var v = eff[k];
      if (['renown', 'moodAll', 'healthAll', 'injuryAll', 'expAll', 'insight', 'aura', 'marketRefresh', 'recruit', 'battle', 'buff', 'assembly', 'expOne', 'moodOne', 'discipleMoodOne', 'pills', 'consumePill', 'flag'].indexOf(k) >= 0) return;
      if (typeof v === 'number' && state.resources[k] != null) {
        state.resources[k] = Math.max(0, state.resources[k] + v);
        details.push((D.RESOURCES[k] ? D.RESOURCES[k].name : k) + ' ' + (v > 0 ? '+' : '') + v);
      }
    });
    if (eff.renown) { state.resources.renown = Math.max(0, state.resources.renown + eff.renown); details.push('声望 ' + (eff.renown > 0 ? '+' : '') + eff.renown); }
    if (eff.insight) { state.insight += eff.insight; details.push('悟道 +' + eff.insight); }
    if (eff.aura) { state.flags.auraBonus = (state.flags.auraBonus || 0) + eff.aura; details.push('灵气 +' + eff.aura); }
    if (eff.pills) Object.keys(eff.pills).forEach(function (k) { state.pills[k] = (state.pills[k] || 0) + eff.pills[k]; details.push((D.PILLS[k] ? D.PILLS[k].name : k) + ' +' + eff.pills[k]); });
    if (eff.moodAll) {
      E.aliveDisciples(state).forEach(function (d) { d.mood = clamp(d.mood + eff.moodAll + randInt(state, -2, 2), 0, 100); });
      details.push('全体心境 ' + (eff.moodAll > 0 ? '+' : '') + eff.moodAll);
    }
    if (eff.healthAll) E.aliveDisciples(state).forEach(function (d) { d.health = clamp(d.health + eff.healthAll, 1, 100); });
    if (eff.injuryAll) E.aliveDisciples(state).forEach(function (d) { d.injury = clamp(d.injury + eff.injuryAll, 0, 100); });
    if (eff.expAll) E.aliveDisciples(state).forEach(function (d) { d.exp += eff.expAll; });
    if (eff.expOne) {
      var lucky = E.innerDisciples(state).sort(function (a, b) { return E.aptitude(b) - E.aptitude(a); })[0] || E.aliveDisciples(state)[0];
      if (lucky) { lucky.exp += eff.expOne; details.push(lucky.name + '修为 +' + eff.expOne); }
    }
    if (eff.moodOne) {
      var one = E.aliveDisciples(state)[0];
      if (one) { one.mood = clamp(one.mood + eff.moodOne, 0, 100); }
    }
    if (eff.discipleMoodOne) {
      var some = E.outerDisciples(state)[0];
      if (some) some.mood = clamp(some.mood + eff.discipleMoodOne, 0, 100);
    }
    if (eff.recruit) {
      var newD = E.generateDisciple(state, { role: 'outer', realm: 0, layer: 0, mood: 70 });
      state.disciples.push(newD);
      linkRelations(state, newD);
      state.stats.recruited++;
      details.push(newD.name + '拜入山门');
    }
    if (eff.buff) state.buffs.push(eff.buff);
    if (eff.marketRefresh) E.refreshMarket(state);
    if (eff.flag) state.flags[eff.flag] = true;
    if (eff.consumePill) state.pills[eff.consumePill] = Math.max(0, (state.pills[eff.consumePill] || 0) - 1);

    var result = {
      type: 'event', title: ev.title, text: choice.result || '',
      details: details, battle: null
    };
    if (eff.battle) {
      var rep = simulateBattle(state, eff.battle);
      result.battle = rep;
      result.text += ' ' + rep.summary;
      result.details = result.details.concat(detailsOfRewards(rep.rewards));
    }
    if (eff.assembly) {
      var hero = E.innerDisciples(state).sort(function (a, b) { return E.power(b, state) - E.power(a, state); })[0];
      if (!hero) {
        result.text = '山门中竟没有拿得出手的内门弟子。大比的名册上，青崖宗的名字被划掉了。';
        state.resources.renown = Math.max(0, state.resources.renown - 5);
      } else {
        var score = E.power(hero, state) * (0.9 + rand(state) * 0.2);
        var need = 420 + E.getDate(state).year * 35;
        if (score >= need) {
          state.resources.renown += 24;
          state.insight += 35;
          var prize = 'pojing';
          state.pills[prize] = (state.pills[prize] || 0) + 1;
          result.text = hero.name + '在仙门大比上连胜三场，青崖宗的名字第一次被天下人记住。';
          result.details = result.details.concat(['声望 +24', '悟道 +35', '破境丹 +1']);
        } else {
          state.resources.renown = Math.max(0, state.resources.renown - 4);
          hero.injury = clamp(hero.injury + 25, 0, 100);
          hero.health = clamp(hero.health - 18, 1, 100);
          result.text = hero.name + '在大比中败下阵来，带伤回山。山门的名号，还得再等等。';
          result.details = result.details.concat(['声望 -4', hero.name + '受伤']);
        }
      }
    }
    state.pendingEvent = null;
    state.pendingResult = result;
    E.log(state, '「' + ev.title + '」：' + (choice.result || '').slice(0, 34), 'event');
    return { ok: true, result: result };
  };

  function detailsOfRewards(rewards) {
    var out = [];
    if (!rewards) return out;
    Object.keys(rewards).forEach(function (k) {
      if (k === 'pills' && rewards[k] && rewards[k].length) {
        out.push(D.PILLS[rewards[k][0]] ? D.PILLS[rewards[k][0]].name + ' +1' : '丹药 +1');
      } else if (typeof rewards[k] === 'number' && rewards[k] !== 0) {
        out.push((D.RESOURCES[k] ? D.RESOURCES[k].name : k) + ' ' + (rewards[k] > 0 ? '+' : '') + rewards[k]);
      }
    });
    return out;
  }

  E.closeEvent = function (state) {
    state.pendingEvent = null;
    state.pendingResult = null;
  };

  /* ------------------------------------------------------------------ */
  /* 坊市                                                               */
  /* ------------------------------------------------------------------ */
  function marketMultiplier(state) {
    var discount = 1 - Math.min(0.18, (state.resources.renown || 0) / 5000);
    if (E.hasResearch(state, 'tianji')) discount *= 0.95;
    var merchant = E.player(state) ? E.traitMod(E.player(state), 'market') : 0;
    discount *= 1 - merchant;
    return discount;
  }

  E.refreshMarket = function (state) {
    var season = E.season(state);
    var discount = marketMultiplier(state);
    var stock = [];
    var resources = [
      { id: 'food', qty: randInt(state, 30, 60), base: 4 },
      { id: 'wood', qty: randInt(state, 20, 45), base: 3 },
      { id: 'stone', qty: randInt(state, 20, 45), base: 3 },
      { id: 'herbs', qty: randInt(state, 6, 16), base: 10 }
    ];
    resources.forEach(function (r) {
      var seasonal = r.id === 'food' && season.key === 'winter' ? 1.2 : 1;
      stock.push({ kind: 'resource', id: r.id, qty: r.qty, price: Math.max(1, Math.round(r.base * seasonal * discount)) });
    });
    var pills = ['huichun', 'juqi'];
    if (E.hasResearch(state, 'dandao')) pills.push('pojing');
    if (E.hasResearch(state, 'yangshen')) pills.push('ningshen');
    if (E.hasResearch(state, 'xisui')) pills.push('xisui');
    pills.forEach(function (p) {
      if (chance(state, 0.75)) {
        stock.push({ kind: 'pill', id: p, qty: p === 'xisui' ? 1 : randInt(state, 1, 3), price: Math.round(D.PILLS[p].price * discount) });
      }
    });
    if (chance(state, 0.5)) {
      stock.push({ kind: 'resource', id: 'stones', qty: 1, price: 0, gift: true });
      stock[stock.length - 1].qty = randInt(state, 5, 15);
    }
    state.market.stock = stock;
    state.market.restockDay = state.day + 15;
    state.market.lastRefresh = state.day;
  };

  E.marketBuy = function (state, index, qty) {
    var item = state.market.stock[index];
    if (!item) return { ok: false, msg: '货已经卖完了。' };
    qty = Math.max(1, Math.floor(qty || 1));
    if (item.gift) {
      state.resources.stones += item.qty;
      state.market.stock.splice(index, 1);
      return { ok: true, msg: '收下了行商赠送的灵石。' };
    }
    if (item.qty < qty) return { ok: false, msg: '库存不足。' };
    var total = item.price * qty;
    if ((state.resources.stones || 0) < total) return { ok: false, msg: '灵石不足。' };
    state.resources.stones -= total;
    item.qty -= qty;
    if (item.kind === 'pill') state.pills[item.id] = (state.pills[item.id] || 0) + qty;
    else state.resources[item.id] = (state.resources[item.id] || 0) + qty;
    if (item.qty <= 0) state.market.stock.splice(index, 1);
    return { ok: true };
  };

  E.sellPrices = { food: 2, wood: 2, stone: 2, herbs: 6 };
  E.marketSell = function (state, resourceId, qty) {
    var base = E.sellPrices[resourceId];
    if (!base) return { ok: false, msg: '这东西坊市不收。' };
    qty = Math.max(1, Math.floor(qty || 1));
    if ((state.resources[resourceId] || 0) < qty) return { ok: false, msg: '库存不足。' };
    var price = Math.round(base * qty);
    state.resources[resourceId] -= qty;
    state.resources.stones += price;
    return { ok: true, price: price };
  };

  /* ------------------------------------------------------------------ */
  /* 存档                                                               */
  /* ------------------------------------------------------------------ */
  E.lastSaveError = '';

  E.normalizeState = function (state) {
    if (!state || typeof state !== 'object' || !Array.isArray(state.disciples)) return null;
    if (state.version != null && state.version > D.VERSION) return null;
    state.version = D.VERSION;
    state.map = Array.isArray(state.map) && state.map.length ? state.map : D.MAP.map(function (row) { return row.split(''); });
    state.paths = Array.isArray(state.paths) ? state.paths : D.PATHS.map(function (p) { return p.slice(); });
    state.buildings = Array.isArray(state.buildings) ? state.buildings : [];
    state.missions = Array.isArray(state.missions) ? state.missions : [];
    state.missionOrders = Array.isArray(state.missionOrders) ? state.missionOrders : [];
    state.log = Array.isArray(state.log) ? state.log : [];
    state.buffs = Array.isArray(state.buffs) ? state.buffs : [];
    state.reportQueue = Array.isArray(state.reportQueue) ? state.reportQueue : [];
    state.eventLast = state.eventLast && typeof state.eventLast === 'object' ? state.eventLast : {};
    state.flags = state.flags && typeof state.flags === 'object' ? state.flags : {};
    state.pills = state.pills && typeof state.pills === 'object' ? state.pills : {};
    state.resources = state.resources && typeof state.resources === 'object' ? state.resources : {};
    ['stones', 'food', 'wood', 'stone', 'herbs', 'renown'].forEach(function (k) {
      if (typeof state.resources[k] !== 'number') state.resources[k] = 0;
    });
    state.research = state.research && typeof state.research === 'object' ? state.research : { nodes: {}, totalSpent: 0 };
    state.research.nodes = state.research.nodes && typeof state.research.nodes === 'object' ? state.research.nodes : {};
    state.market = state.market && typeof state.market === 'object' ? state.market : { stock: [], restockDay: 1, lastRefresh: 0 };
    state.market.stock = Array.isArray(state.market.stock) ? state.market.stock : [];
    state.stats = state.stats && typeof state.stats === 'object' ? state.stats : {};
    ['days', 'battlesWon', 'battlesLost', 'recruited', 'promoted', 'missions', 'pillsMade', 'maxRenown', 'breakthroughs', 'built'].forEach(function (k) {
      if (typeof state.stats[k] !== 'number') state.stats[k] = 0;
    });
    state.guide = state.guide && typeof state.guide === 'object' ? state.guide : { seen: false };
    state.lastEventDay = Number(state.lastEventDay) || 0;
    state.lastSaved = Number(state.lastSaved) || 0;
    state.day = Number(state.day) || 1;
    state.nextBuildingId = Number(state.nextBuildingId) || (state.buildings.length + 1);
    state.nextDiscipleId = Number(state.nextDiscipleId) || (state.disciples.length + 1);
    state.nextMissionOrderId = Number(state.nextMissionOrderId) || (state.missionOrders.length + 1);
    state.weather = state.weather || 'clear';
    state.ending = state.ending || null;
    state.pendingEvent = state.pendingEvent || null;
    state.pendingResult = state.pendingResult || null;
    state.pendingReport = state.pendingReport || null;
    state.recruitCandidates = state.recruitCandidates || null;
    state.recruitCooldown = Number(state.recruitCooldown) || 0;
    state.insight = Number(state.insight) || 0;

    state.buildings.forEach(function (b) {
      b.workers = Array.isArray(b.workers) ? b.workers : [];
      b.level = Number(b.level) || 1;
      b.construction = Number(b.construction) || 0;
    });
    state.disciples.forEach(function (d) {
      d.job = d.job || null;
      d.missionId = d.missionId || null;
      d.relations = d.relations && typeof d.relations === 'object' ? d.relations : {};
      d.traits = Array.isArray(d.traits) ? d.traits : [];
      d.jobMode = d.jobMode === 'manual' ? 'manual' : 'auto';
      if (d.preferredJob === undefined) d.preferredJob = d.jobMode === 'manual' ? d.job : null;
      d.dead = !!d.dead;
    });
    state.missionOrders.forEach(function (order) {
      order.discipleIds = Array.isArray(order.discipleIds) ? order.discipleIds : [];
      order.enabled = order.enabled !== false;
      order.nextTryDay = Number(order.nextTryDay) || 0;
    });
    if (!state.playerId && state.disciples.length) state.playerId = state.disciples[0].id;
    return state;
  };

  E.save = function (state, force) {
    E.lastSaveError = '';
    try {
      if (typeof localStorage === 'undefined') { E.lastSaveError = 'unavailable'; return false; }
      if (!state) { E.lastSaveError = 'empty'; return false; }
      var existingRaw = null;
      try { existingRaw = localStorage.getItem(D.SAVE_KEY); } catch (e) {}
      if (existingRaw && !force) {
        try {
          var existing = JSON.parse(existingRaw);
          if (existing && existing.lastSaved && state.lastSaved && existing.lastSaved > state.lastSaved) {
            E.lastSaveError = 'stale';
            return false;
          }
        } catch (e) {}
      }
      var previousSaved = state.lastSaved;
      state.lastSaved = Date.now();
      var json = JSON.stringify(state);
      try { if (existingRaw) localStorage.setItem(D.SAVE_BACKUP_KEY, existingRaw); } catch (e) {}
      try {
        localStorage.setItem(D.SAVE_KEY, json);
      } catch (e) {
        state.lastSaved = previousSaved;
        E.lastSaveError = 'quota';
        return false;
      }
      return true;
    } catch (e) {
      E.lastSaveError = 'error';
      return false;
    }
  };

  function parseSave(raw) {
    if (!raw) return null;
    try {
      var state = JSON.parse(raw);
      return E.normalizeState(state);
    } catch (e) { return null; }
  }

  E.load = function () {
    try {
      if (typeof localStorage === 'undefined') return null;
      var main = null;
      var backup = null;
      try { main = parseSave(localStorage.getItem(D.SAVE_KEY)); } catch (e) {}
      try { backup = parseSave(localStorage.getItem(D.SAVE_BACKUP_KEY)); } catch (e) {}
      if (main && backup) return (backup.lastSaved || 0) > (main.lastSaved || 0) ? backup : main;
      return main || backup;
    } catch (e) { return null; }
  };

  E.hasSave = function () {
    try {
      if (typeof localStorage === 'undefined') return false;
      return !!(localStorage.getItem(D.SAVE_KEY) || localStorage.getItem(D.SAVE_BACKUP_KEY));
    } catch (e) { return false; }
  };

  E.deleteSave = function () {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem(D.SAVE_KEY);
      localStorage.removeItem(D.SAVE_BACKUP_KEY);
    } catch (e) {}
  };

  E.exportState = function (state) {
    return JSON.stringify(state, null, 2);
  };

  E.importState = function (json) {
    try {
      return E.normalizeState(JSON.parse(json));
    } catch (e) { return null; }
  };

  /* ------------------------------------------------------------------ */
  /* 杂项                                                               */
  /* ------------------------------------------------------------------ */
  E.stageProgress = function (d) {
    return {
      pct: E.cultPct(d) * 100,
      need: E.expNeed(d),
      current: Math.floor(d.exp || 0)
    };
  };

  E.dailyRates = function (state) {
    var food = 0, herbs = 0;
    state.buildings.forEach(function (b) {
      if (b.construction || !b.workers.length) return;
      var eff = 0;
      b.workers.forEach(function (id) { eff += E.workEfficiency(E.discipleById(state, id), state); });
      eff = eff / Math.max(1, b.workers.length);
      if (b.type === 'farm') food += 5.2 * (1 + (b.level - 1) * 0.35) * E.season(state).farm * eff * (E.hasResearch(state, 'lingzhi') ? 1.2 : 1);
      if (b.type === 'herb') herbs += 1.45 * (1 + (b.level - 1) * 0.35) * E.season(state).herb * eff * (E.hasResearch(state, 'lingzhi') ? 1.2 : 1);
    });
    return { food: Math.round(food * 10) / 10, herbs: Math.round(herbs * 10) / 10 };
  };

  E.guideTasks = function (state) {
    var prodStaffed = state.buildings.some(function (b) {
      return ['farm', 'herb', 'kitchen', 'library', 'alchemy'].indexOf(b.type) >= 0 && b.workers.length > 0;
    });
    return [
      { id: 'staff', text: '安排弟子当值', done: prodStaffed },
      { id: 'build', text: '营造一座新建筑', done: (state.stats.built || 0) > 0 },
      { id: 'recruit', text: '招收一名外门弟子', done: (state.stats.recruited || 0) > 0 },
      { id: 'mission', text: '派遣一次历练', done: (state.stats.missions || 0) > 0 },
      { id: 'promote', text: '晋升一名内门弟子', done: (state.stats.promoted || 0) > 0 }
    ];
  };

  E.ENDING = function (state) { return state.ending; };

  global.SectEngine = E;
  if (typeof module !== 'undefined' && module.exports) module.exports = E;
})(typeof window !== 'undefined' ? window : globalThis);
