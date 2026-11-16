/*
 * 一念长生 · 宗门篇 · 引擎测试
 * 运行：npm test
 */
'use strict';

var assert = require('assert');
var D = require('../js/data.js');
var EV = require('../js/events.js');
var E = require('../js/engine.js');

var passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok  ' + name);
  } catch (err) {
    console.error('  FAIL ' + name);
    console.error(err.stack || err);
    process.exitCode = 1;
  }
}

function newState(seed) {
  return E.newGame({ seed: seed || 42, sectName: '青崖宗', playerName: '沈未央', origin: 'clan', root: 'water' });
}

function clearPending(state) {
  state.pendingEvent = null;
  state.pendingResult = null;
  state.pendingReport = null;
  state.reportQueue = [];
}

function withStorage(fn) {
  var store = {};
  global.localStorage = {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
  };
  try { fn(store); } finally { delete global.localStorage; }
}

console.log('\n一念长生 · 引擎测试\n');

test('地图尺寸与地形数据完整', function () {
  assert.strictEqual(D.MAP.length, D.MAP_H);
  D.MAP.forEach(function (row) { assert.strictEqual(row.length, D.MAP_W); });
  assert.ok(D.MAP.join('').indexOf('S') >= 0, '应有灵脉');
});

test('新游戏生成宗门、掌门与外门弟子', function () {
  var s = newState();
  assert.strictEqual(s.version, 2);
  assert.strictEqual(s.sectName, '青崖宗');
  assert.strictEqual(s.disciples.length, 4);
  assert.strictEqual(s.buildings.length, 7);
  assert.strictEqual(E.player(s).role, 'inner');
  assert.strictEqual(E.outerDisciples(s).length, 3);
  assert.ok(s.resources.food > 0);
  assert.ok(E.sectStats(s).aura > 0);
});

test('日期按 360 日一年推进，季节正确', function () {
  var s = newState();
  var d = E.getDate(s);
  assert.strictEqual(d.year, 1);
  assert.strictEqual(d.month, 1);
  assert.strictEqual(d.season.key, 'spring');
  s.day = 100;
  assert.strictEqual(E.getDate(s).month, 4);
  assert.strictEqual(E.getDate(s).season.key, 'summer');
  s.day = 361;
  assert.strictEqual(E.getDate(s).year, 2);
});

test('时间推进带来生产、消耗与修炼', function () {
  var s = newState();
  var food0 = s.resources.food;
  var exp0 = E.player(s).exp;
  E.tick(s);
  assert.strictEqual(s.day, 2);
  assert.ok(s.resources.food !== food0);
  assert.ok(E.player(s).exp >= exp0);
  assert.ok(s.resources.herbs > 0);
});

test('灵田无人当值时停止产出', function () {
  var s = newState();
  var farm = s.buildings.find(function (b) { return b.type === 'farm'; });
  var d = E.discipleById(s, farm.workers[0]);
  E.assign(s, d.id, null);
  assert.strictEqual(farm.workers.length, 0);
  var before = s.resources.food;
  E.tick(s);
  // 仍会消耗食物，但不会增加灵田产出
  assert.ok(s.resources.food < before);
});

test('建造建筑、扣费与落成', function () {
  var s = newState();
  var wood = s.resources.wood;
  var res = E.build(s, 'library', 8, 2);
  assert.ok(res.ok);
  assert.ok(s.resources.wood < wood);
  assert.ok(res.building.construction > 0);
  clearPending(s);
  for (var i = 0; i < 5; i++) { E.tick(s); clearPending(s); }
  assert.strictEqual(res.building.construction, 0);
});

test('不能重叠建造，也不能在不可建地形建造', function () {
  var s = newState();
  assert.strictEqual(E.build(s, 'dorm', 3, 5).ok, false);
  assert.strictEqual(E.build(s, 'dorm', 0, 0).ok, false);
});

test('身份决定可去的工种，晋升后可做低阶差事', function () {
  var s = newState();
  var outer = E.outerDisciples(s)[0];
  var med = s.buildings.find(function (b) { return b.type === 'meditation'; });
  assert.strictEqual(E.assign(s, outer.id, med.id).ok, false);
  outer.realm = 0;
  outer.layer = 6;
  outer.aptitude = Math.max(3, outer.aptitude);
  s.resources.stones = 200;
  assert.strictEqual(E.promote(s, outer.id).ok, true);
  var farm = s.buildings.find(function (b) { return b.type === 'farm'; });
  assert.strictEqual(E.assign(s, outer.id, farm.id).ok, true);
});

test('外门弟子达到炼气六层可晋升内门', function () {
  var s = newState();
  var d = E.outerDisciples(s)[0];
  d.realm = 0;
  d.layer = 6;
  d.aptitude = Math.max(3, d.aptitude);
  s.resources.stones = 200;
  var before = s.resources.stones;
  var res = E.promote(s, d.id);
  assert.ok(res.ok);
  assert.strictEqual(d.rank, 'inner');
  assert.strictEqual(d.role, 'inner');
  assert.ok(s.resources.stones < before);
  assert.strictEqual(s.stats.promoted, 1);
});

test('境界需求、突破概率与战力计算', function () {
  var s = newState();
  var d = E.player(s);
  assert.ok(E.expNeed(d) > 0);
  assert.ok(E.breakChance(d, s) > 0 && E.breakChance(d, s) <= 1);
  assert.ok(E.power(d, s) > 0);
  d.realm = 2;
  d.layer = 1;
  assert.ok(E.power(d, s) > 100);
  assert.ok(E.lifespanOf(d) > 100);
});

test('修为足够时自动突破会推进层数或记录失败', function () {
  var s = newState();
  var d = E.player(s);
  d.mood = 100;
  d.exp = E.expNeed(d);
  var before = { realm: d.realm, layer: d.layer };
  clearPending(s);
  E.tick(s);
  assert.ok(d.realm > before.realm || d.layer > before.layer || d.exp < E.expNeed(d));
});

test('参研消耗悟道并解锁聚灵阵', function () {
  var s = newState();
  s.insight = 300;
  assert.ok(E.researchNode(s, 'lingzhi').ok);
  assert.ok(E.researchNode(s, 'zhenfa').ok);
  assert.ok(E.hasResearch(s, 'zhenfa'));
  assert.ok(s.insight < 300);
  var res = E.build(s, 'array', 8, 2);
  assert.ok(res.ok);
});

test('聚灵阵未参研时不可建造', function () {
  var s = newState();
  var res = E.build(s, 'array', 8, 2);
  assert.strictEqual(res.ok, false);
});

test('坊市买卖与库存变化', function () {
  var s = newState();
  s.resources.stones = 1000;
  var idx = s.market.stock.findIndex(function (it) { return it.kind === 'resource'; });
  assert.ok(idx >= 0);
  var item = s.market.stock[idx];
  var before = s.resources[item.id] || 0;
  var res = E.marketBuy(s, idx, 1);
  assert.ok(res.ok);
  assert.strictEqual(s.resources[item.id], before + 1);
  var sold = E.marketSell(s, 'wood', 5);
  assert.ok(sold.ok);
});

test('坊市可以一次买下全部库存', function () {
  var s = newState();
  s.market.stock = [
    { kind: 'resource', id: 'food', qty: 5, price: 4 },
    { kind: 'pill', id: 'huichun', qty: 2, price: 18 }
  ];
  s.resources.stones = 100;
  var food = s.resources.food;
  var pills = s.pills.huichun || 0;
  var r = E.marketBuyAll(s);
  assert.ok(r.ok);
  assert.strictEqual(r.total, 56);
  assert.strictEqual(s.resources.stones, 44);
  assert.strictEqual(s.resources.food, food + 5);
  assert.strictEqual(s.pills.huichun, pills + 2);
  assert.strictEqual(s.market.stock.length, 0);
});

test('全部购买灵石不足时不会扣库存', function () {
  var s = newState();
  s.market.stock = [{ kind: 'resource', id: 'food', qty: 5, price: 4 }];
  s.resources.stones = 10;
  var r = E.marketBuyAll(s);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(s.resources.stones, 10);
  assert.strictEqual(s.market.stock.length, 1);
});

test('坊市停留时不会换货', function () {
  var s = newState(21);
  s.market.hold = true;
  s.market.restockDay = s.day;
  var day = s.day;
  var stock = s.market.stock.length;
  E.tick(s);
  assert.strictEqual(s.market.restockDay, day);
  assert.strictEqual(s.market.stock.length, stock);
  s.market.hold = false;
  E.tick(s);
  assert.ok(s.market.restockDay > day);
});

test('招徒候选与入门', function () {
  var s = newState();
  s.resources.stones = 100;
  var r = E.recruitCandidates(s);
  assert.ok(r.ok);
  assert.ok(r.candidates.length >= 2);
  var d = r.candidates[0];
  assert.strictEqual(d.rank, 'menial');
  var n = s.disciples.length;
  assert.ok(E.chooseRecruit(s, d.id).ok);
  assert.strictEqual(s.disciples.length, n + 1);
  assert.strictEqual(s.stats.recruited, 1);
});

test('丹药服用生效', function () {
  var s = newState();
  var d = E.player(s);
  d.health = 40;
  d.injury = 30;
  var n = s.pills.huichun;
  var res = E.usePill(s, d.id, 'huichun');
  assert.ok(res.ok);
  assert.ok(d.health > 40);
  assert.strictEqual(s.pills.huichun, n - 1);
});

test('历练派遣与归来报告', function () {
  var s = newState();
  var d = E.outerDisciples(s)[0];
  var res = E.startMission(s, 'backhill', [d.id]);
  assert.ok(res.ok);
  assert.ok(d.missionId);
  clearPending(s);
  E.tick(s);
  E.tick(s);
  E.tick(s);
  assert.ok(s.pendingReport || s.reportQueue.length > 0, '应生成历练报告');
  if (s.pendingReport) {
    assert.strictEqual(s.pendingReport.type, 'mission');
    E.closeReport(s);
  }
  assert.strictEqual(d.missionId, null);
});

test('事件选项结算与资源变化', function () {
  var s = newState();
  s.pendingEvent = 'first_caravan';
  var before = s.resources.renown;
  var res = E.resolveEvent(s, 2);
  assert.ok(res.ok);
  assert.strictEqual(s.pendingEvent, null);
  assert.ok(s.pendingResult);
  assert.ok(s.resources.renown >= before);
  E.closeResult(s);
  assert.strictEqual(s.pendingResult, null);
});

test('战斗模拟生成战报与奖励', function () {
  var s = newState();
  var rep = E.simulateBattle(s, { danger: 1, name: '测试妖狼', power: 20 });
  assert.ok(rep);
  assert.ok(rep.lines.length > 0);
  assert.ok(rep.type === 'battle');
  assert.ok(rep.rewards);
});

test('宗门统计与风水评分', function () {
  var s = newState();
  var st = E.sectStats(s);
  assert.ok(st.aura >= 1);
  assert.ok(st.fengShui >= 0 && st.fengShui <= 100);
  assert.ok(['大吉', '吉', '平', '凶', '大凶'].indexOf(st.fsGrade) >= 0);
  assert.ok(st.housing >= 4);
});

test('功法与同门关系已建立', function () {
  var s = newState();
  var d = E.player(s);
  assert.ok(E.techniqueOf(d).name);
  assert.ok(Object.keys(d.relations).length >= 3);
  var before = Object.assign({}, d.relations);
  E.tick(s);
  assert.ok(Object.keys(d.relations).length >= 3);
  assert.ok(Object.keys(d.relations).some(function (id) { return d.relations[id] !== before[id]; }));
});

test('断粮会消耗饱食并损伤气血', function () {
  var s = newState();
  s.resources.food = 0;
  s.buildings.forEach(function (b) { b.workers = []; });
  s.disciples.forEach(function (d) { d.job = null; d.jobMode = 'manual'; d.preferredJob = null; });
  var d = E.player(s);
  var hunger = d.hunger;
  E.tick(s);
  assert.ok(d.hunger < hunger);
  assert.ok(s.resources.food === 0);
});

test('导出的存档可以重新导入', function () {
  var s = newState();
  var json = E.exportState(s);
  var loaded = E.importState(json);
  assert.ok(loaded);
  assert.strictEqual(loaded.sectName, s.sectName);
  assert.strictEqual(loaded.disciples.length, s.disciples.length);
  assert.strictEqual(E.importState('not json'), null);
});

test('初始引导任务与警讯', function () {
  var s = newState();
  var tasks = E.guideTasks(s);
  assert.ok(tasks.length >= 4);
  assert.ok(tasks[0].done);
  var alerts = E.alerts(s);
  assert.ok(Array.isArray(alerts));
});

test('旧版存档会补齐字段并升到当前版本', function () {
  var s = newState();
  var json = JSON.stringify(Object.assign({}, s, { version: 1 }));
  var loaded = E.importState(json);
  assert.ok(loaded);
  assert.strictEqual(loaded.version, D.VERSION);
  assert.strictEqual(loaded.sectName, s.sectName);
  assert.ok(Array.isArray(loaded.missionOrders));
});

test('营造会自动择地、扣费并落在空地上', function () {
  var s = newState();
  var wood = s.resources.wood;
  var res = E.buildAuto(s, 'dorm');
  assert.ok(res.ok);
  assert.ok(res.building.x >= 0 && res.building.y >= 0);
  assert.strictEqual(E.buildingAt(s, res.building.x, res.building.y), res.building);
  assert.ok(s.resources.wood < wood);
  assert.ok(res.spot);
});

test('缺料时可以用灵石补足建造，单价比坊市略贵', function () {
  var s = newState();
  s.resources.wood = 0;
  s.resources.stone = 0;
  s.resources.stones = 500;
  var quote = E.buildQuote(s, D.BUILDINGS.dorm.cost);
  assert.strictEqual(quote.ok, true);
  assert.strictEqual(quote.extra, 180);
  assert.ok(quote.extra > 30 * 3 + 15 * 3);
  var res = E.buildAuto(s, 'dorm', { buyout: true });
  assert.ok(res.ok);
  assert.strictEqual(s.resources.stones, 320);
  assert.strictEqual(s.resources.wood, 0);
  assert.strictEqual(s.resources.stone, 0);
});

test('灵石不足时不会用补足方式扣掉材料', function () {
  var s = newState();
  s.resources.wood = 0;
  s.resources.stone = 0;
  s.resources.stones = 100;
  var before = s.buildings.length;
  var res = E.buildAuto(s, 'dorm', { buyout: true });
  assert.strictEqual(res.ok, false);
  assert.strictEqual(s.resources.stones, 100);
  assert.strictEqual(s.buildings.length, before);
});

test('扩建也可以用灵石补足材料', function () {
  var s = newState();
  var dorm = s.buildings.find(function (b) { return b.type === 'dorm'; });
  s.resources.wood = 0;
  s.resources.stone = 0;
  s.resources.stones = 500;
  var res = E.upgrade(s, dorm.id, { buyout: true });
  assert.ok(res.ok);
  assert.strictEqual(dorm.level, 2);
  assert.strictEqual(s.resources.stones, 200);
  assert.strictEqual(s.resources.wood, 0);
  assert.strictEqual(s.resources.stone, 0);
});

test('自动安排会为弟子选择合适差事', function () {
  var s = newState();
  var d = E.outerDisciples(s)[0];
  E.assign(s, d.id, null);
  var recommended = E.recommendedJob(s, d);
  assert.ok(recommended);
  var res = E.autoAssign(s, d.id);
  assert.ok(res.ok);
  assert.strictEqual(d.job, recommended.id);
});

test('一键补位会填满建筑的空缺', function () {
  var s = newState();
  s.disciples.forEach(function (d) { d.job = null; });
  s.buildings.forEach(function (b) { b.workers = []; });
  var farm = s.buildings.find(function (b) { return b.type === 'farm'; });
  var res = E.autoStaff(s, farm.id);
  assert.ok(res.ok);
  assert.ok(res.count > 0);
  assert.ok(farm.workers.length > 0);
});

test('山门事件之间有冷却，不会连日弹窗', function () {
  var s = newState();
  s.day = 4;
  clearPending(s);
  E.tick(s);
  assert.strictEqual(s.pendingEvent, 'first_caravan');
  assert.strictEqual(s.lastEventDay, s.day);
  E.closeEvent(s);
  s.flags.evt_first_caravan = true;
  var day = s.day;
  for (var i = 0; i < 13; i++) { E.tick(s); clearPending(s); }
  assert.strictEqual(s.day, day + 13);
  assert.strictEqual(s.pendingEvent, null);
});

test('存档会写入并读回最新进度', function () {
  withStorage(function () {
    var s = newState(11);
    s.resources.food = 321;
    assert.strictEqual(E.save(s), true);
    var loaded = E.load();
    assert.ok(loaded);
    assert.strictEqual(loaded.resources.food, 321);
    assert.ok(loaded.lastSaved > 0);
  });
});

test('主存档损坏时会回退到备份', function () {
  withStorage(function () {
    var s = newState(12);
    s.resources.food = 111;
    assert.strictEqual(E.save(s), true);
    s.resources.food = 222;
    assert.strictEqual(E.save(s), true);
    localStorage.setItem(D.SAVE_KEY, '{broken');
    var loaded = E.load();
    assert.ok(loaded);
    assert.strictEqual(loaded.resources.food, 111);
  });
});

test('旧页面不能覆盖较新的存档', function () {
  withStorage(function () {
    var newer = newState(13);
    newer.resources.food = 777;
    assert.strictEqual(E.save(newer), true);
    var savedAt = newer.lastSaved;
    var older = newState(14);
    older.lastSaved = savedAt - 1000;
    assert.strictEqual(E.save(older), false);
    assert.strictEqual(E.load().resources.food, 777);
  });
});

test('新存档只写 v3，旧缓存页写 v2 也盖不掉新进度', function () {
  withStorage(function () {
    var current = newState(16);
    current.resources.food = 888;
    assert.strictEqual(E.save(current), true);
    assert.ok(localStorage.getItem(D.SAVE_KEY), '应写入 v3 主存档');
    assert.strictEqual(localStorage.getItem('yinian_sect_save_v2'), null, '不应再写 v2');

    var staleTab = newState(17);
    staleTab.resources.food = 1;
    staleTab.lastSaved = Date.now() + 60000;
    localStorage.setItem('yinian_sect_save_v2', JSON.stringify(staleTab));

    var loaded = E.load();
    assert.ok(loaded);
    assert.strictEqual(loaded.resources.food, 888);
  });
});

test('旧 v2 存档会自动迁移到 v3', function () {
  withStorage(function () {
    var legacy = newState(18);
    legacy.resources.food = 456;
    legacy.lastSaved = Date.now() - 5000;
    localStorage.setItem('yinian_sect_save_v2', JSON.stringify(legacy));

    var loaded = E.load();
    assert.ok(loaded);
    assert.strictEqual(loaded.resources.food, 456);
    var migrated = JSON.parse(localStorage.getItem(D.SAVE_KEY));
    assert.ok(migrated, '迁移后应写入 v3');
    assert.strictEqual(migrated.resources.food, 456);
  });
});

test('常驻历练会归来自动再出发并可叫停', function () {
  var s = newState(15);
  s.lastEventDay = 9999;
  var d = E.outerDisciples(s)[0];
  var res = E.startMission(s, 'backhill', [d.id], { repeat: true });
  assert.ok(res.ok);
  assert.strictEqual(s.missionOrders.length, 1);
  var orderId = res.mission.orderId;
  var dup = E.startMission(s, 'backhill', [E.outerDisciples(s)[1].id], { repeat: true });
  assert.strictEqual(dup.ok, false);
  for (var i = 0; i < 4; i++) { clearPending(s); E.tick(s); }
  assert.strictEqual(s.missionOrders.length, 1);
  assert.strictEqual(s.missions.length, 1);
  assert.strictEqual(s.missions[0].orderId, orderId);
  assert.strictEqual(E.stopMissionOrder(s, orderId).ok, true);
  assert.strictEqual(s.missionOrders.length, 0);
  assert.strictEqual(s.missions[0].orderId, null);
});

test('历练归来会自动补上合适差事', function () {
  var s = newState(16);
  s.lastEventDay = 9999;
  var d = E.outerDisciples(s)[0];
  E.assign(s, d.id, null);
  assert.strictEqual(d.jobMode, 'manual');
  assert.ok(E.startMission(s, 'backhill', [d.id]).ok);
  for (var i = 0; i < 3; i++) { clearPending(s); E.tick(s); }
  assert.strictEqual(d.missionId, null);
  assert.ok(d.job);
});

test('手动待命不会被每日自动安排覆盖', function () {
  var s = newState(17);
  var d = E.outerDisciples(s)[0];
  E.assign(s, d.id, null);
  assert.strictEqual(d.jobMode, 'manual');
  E.tick(s);
  assert.strictEqual(d.job, null);
});

test('坊市可以卖丹药，并按自定义数量结算', function () {
  var s = newState(18);
  s.resources.stones = 0;
  s.pills.huichun = 3;
  assert.strictEqual(E.sellPriceOf('huichun'), Math.round(D.PILLS.huichun.price * 0.5));
  var sold = E.marketSell(s, 'huichun', 2);
  assert.ok(sold.ok);
  assert.strictEqual(s.pills.huichun, 1);
  assert.strictEqual(s.resources.stones, E.sellPriceOf('huichun') * 2);

  s.resources.stones = 1000;
  var idx = s.market.stock.findIndex(function (it) { return it.kind === 'resource' && it.qty >= 3; });
  assert.ok(idx >= 0);
  var item = s.market.stock[idx];
  var before = item.qty;
  var bought = E.marketBuy(s, idx, 3);
  assert.ok(bought.ok);
  assert.strictEqual(item.qty, before - 3);
});

test('掌门可以领差事，也可以随队历练', function () {
  var s = newState(19);
  var master = E.player(s);
  var farm = s.buildings.find(function (b) { return b.type === 'farm'; });
  assert.ok(E.assign(s, master.id, farm.id).ok);
  assert.strictEqual(master.job, farm.id);
  assert.ok(E.eligibleJobs(s, master).length > 0);
  assert.ok(E.autoAssign(s, master.id).ok);
  var mission = E.startMission(s, 'backhill', [master.id]);
  assert.ok(mission.ok);
  assert.ok(master.missionId);
});

test('飞升后不再领差事，但仍可外派历练', function () {
  var s = newState(22);
  var d = E.outerDisciples(s)[0];
  d.realm = 8;
  d.layer = D.REALMS[8].layers - 1;
  d.aptitude = 10;
  d.health = 100;
  d.mood = 100;
  var res = null;
  for (var i = 0; i < 30; i++) {
    d.exp = E.expNeed(d);
    d.breakthroughBonus = 10;
    res = E.tryBreakthrough(s, d.id, false);
    if (res.ascended) break;
  }
  assert.ok(res && res.ascended, '应成功飞升');
  assert.strictEqual(s.ending, null, '飞升不应结束游戏');
  assert.ok(d.ascended);
  assert.strictEqual(d.job, null);
  assert.strictEqual(E.isAscended(d), true);
  var farm = s.buildings.find(function (b) { return b.type === 'farm'; });
  assert.strictEqual(E.assign(s, d.id, farm.id).ok, false);
  assert.strictEqual(E.eligibleJobs(s, d).length, 0);
  assert.strictEqual(E.autoAssign(s, d.id).ok, false);
  var mission = E.startMission(s, 'luoxia', [d.id]);
  assert.ok(mission.ok, mission.msg);
  assert.ok(d.missionId);
});

test('旧版飞升结局会转为继续游戏', function () {
  var s = newState(23);
  var d = E.player(s);
  d.realm = 9;
  d.layer = 0;
  s.ending = { type: 'ascension', title: '飞升', discipleId: d.id, day: s.day };
  E.normalizeState(s);
  assert.strictEqual(s.ending, null);
  assert.ok(d.ascended);
  assert.strictEqual(d.state, 'ascended');
  assert.strictEqual(d.job, null);
});

test('掌门阵亡后需要手动另立，不会自动继任', function () {
  var s = newState(20);
  var master = E.player(s);
  master.dead = true;
  master.health = 0;
  E.normalizeState(s);
  assert.strictEqual(s.playerId, null);
  assert.strictEqual(s.pendingSuccession, true);
  var heir = E.successors(s)[0];
  assert.ok(heir);
  assert.ok(E.chooseMaster(s, heir.id).ok);
  assert.strictEqual(s.playerId, heir.id);
  assert.strictEqual(s.pendingSuccession, false);
  assert.strictEqual(heir.job, null);
});

test('掌门领的差事读档后不会丢', function () {
  var s = newState(21);
  var master = E.player(s);
  var farm = s.buildings.find(function (b) { return b.type === 'farm'; });
  assert.ok(E.assign(s, master.id, farm.id).ok);
  E.normalizeState(s);
  assert.strictEqual(master.job, farm.id);
  assert.ok(farm.workers.indexOf(master.id) >= 0);
});

test('伐木场与采石场会按工人产出木材和石料', function () {
  var s = newState(24);
  s.lastEventDay = 9999;
  var ly = E.buildAuto(s, 'lumberyard');
  var q = E.buildAuto(s, 'quarry');
  assert.ok(ly.ok, ly.msg);
  assert.ok(q.ok, q.msg);
  for (var i = 0; i < 2; i++) { clearPending(s); E.tick(s); }
  var workers = E.outerDisciples(s);
  assert.ok(E.assign(s, workers[0].id, ly.building.id).ok);
  assert.ok(E.assign(s, workers[1].id, q.building.id).ok);
  var wood = s.resources.wood;
  var stone = s.resources.stone;
  clearPending(s);
  E.tick(s);
  assert.ok(s.resources.wood > wood, '伐木场应产出木材');
  assert.ok(s.resources.stone > stone, '采石场应产出石料');
});

test('宗门等级会放大敌方战力', function () {
  var s = newState(25);
  var low = E.simulateBattle(s, { danger: 2, power: 100, name: '测试敌人' });
  assert.ok(low.lines[0].indexOf('100') >= 0);
  s.resources.renown = 220;
  assert.strictEqual(E.enemyScale(s), 1 + 3 * 0.35);
  var high = E.simulateBattle(s, { danger: 2, power: 100, name: '测试敌人' });
  assert.ok(high.lines[0].indexOf('205') >= 0, high.lines[0]);
});

test('宗门等级提升会增加历练队伍上限', function () {
  var s = newState(26);
  assert.strictEqual(E.maxMissionTeams(s), 3);
  s.resources.renown = 220;
  assert.strictEqual(E.maxMissionTeams(s), 4);
  s.resources.renown = 800;
  assert.strictEqual(E.maxMissionTeams(s), 5);
  assert.strictEqual(D.MISSIONS.length, 10);
  assert.strictEqual(D.MISSIONS.find(function (m) { return m.id === 'tianwai'; }).minRank, 'elder');
});

test('真传晋升长老受席位限制', function () {
  var s = newState(27);
  var list = E.outerDisciples(s);
  var a = list[0], b = list[1];
  [a, b].forEach(function (d) {
    d.rank = 'core';
    d.role = 'inner';
    d.title = '真传弟子';
    d.realm = 2;
    d.layer = 0;
    d.aptitude = 4;
  });
  s.resources.stones = 2000;
  assert.strictEqual(E.maxElders(s), 1);
  assert.ok(E.promote(s, a.id).ok);
  assert.strictEqual(a.rank, 'elder');
  var quote = E.promotionQuote(s, b);
  assert.strictEqual(quote.ok, false);
  assert.ok(quote.missing.some(function (m) { return m.indexOf('长老席位') >= 0; }));
});

test('参研树必须按支线前置逐级解锁', function () {
  var s = newState(28);
  s.insight = 1000;
  assert.strictEqual(E.researchNode(s, 'wanmu').ok, false);
  assert.ok(E.researchNode(s, 'lingzhi').ok);
  assert.ok(E.researchNode(s, 'fengrao').ok);
  assert.ok(E.researchNode(s, 'yaowang').ok);
  assert.ok(E.researchNode(s, 'wanmu').ok);
  assert.strictEqual(E.researchNode(s, 'dadian').ok, false);
});

test('旧存档会迁移身份等级', function () {
  var s = newState(29);
  var outer = E.outerDisciples(s)[0];
  delete outer.rank;
  outer.role = 'outer';
  outer.title = '外门弟子';
  var master = E.player(s);
  delete master.rank;
  master.role = 'inner';
  master.title = '掌门';
  E.normalizeState(s);
  assert.strictEqual(outer.rank, 'outer');
  assert.strictEqual(master.rank, 'master');
});

console.log('\n' + passed + ' 项测试通过。\n');
