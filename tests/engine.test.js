/* 引擎逻辑测试：不依赖浏览器，可在 Node 中直接运行。 */
'use strict';

var assert = require('assert');
var path = require('path');

/* localStorage stub */
var store = {};
global.localStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
  setItem: function (k, v) { store[k] = String(v); },
  removeItem: function (k) { delete store[k]; }
};

var D = require(path.join(__dirname, '..', 'js', 'data.js'));
var E = require(path.join(__dirname, '..', 'js', 'engine.js'));

var passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok  ' + name);
  } catch (err) {
    console.error('FAIL  ' + name);
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 1;
  }
}

function newState(overrides) {
  var s = E.newGame({
    name: '测试者',
    root: 'fire',
    origin: 'clan',
    daoheart: 'sword'
  });
  if (overrides) Object.keys(overrides).forEach(function (k) { s[k] = overrides[k]; });
  return s;
}

console.log('\n== 数据完整性 ==');

test('事件引用的物品与敌人存在', function () {
  var stats = ['comp', 'sense', 'luck'];
  D.EVENTS.forEach(function (ev) {
    assert(ev.id && ev.name && ev.text, '事件缺少字段: ' + ev.id);
    assert(ev.region === 'any' || D.REGIONS.some(function (r) { return r.id === ev.region; }), '未知区域: ' + ev.id);
    assert(ev.choices && ev.choices.length >= 2, '事件选项不足: ' + ev.id);
    ev.choices.forEach(function (c, i) {
      assert(c.label, ev.id + ' 选项缺少文案');
      if (c.check) {
        assert(stats.indexOf(c.check.stat) !== -1, ev.id + ' 检定属性非法');
        assert(c.success && c.fail, ev.id + ' 检定缺少结果');
      } else {
        assert(c.outcome, ev.id + ' 选项缺少 outcome');
      }
      [c.outcome, c.success, c.fail].filter(Boolean).forEach(function (o) {
        if (o.combat) assert(D.ENEMIES[o.combat], ev.id + ' 未知敌人: ' + o.combat);
        if (o.items) o.items.forEach(function (it) { assert(D.ITEMS[it.id], ev.id + ' 未知物品: ' + it.id); });
        if (o.consume) o.consume.forEach(function (it) { assert(D.ITEMS[it.id], ev.id + ' 未知消耗品: ' + it.id); });
        if (o.technique) assert(D.TECHNIQUES[o.technique], ev.id + ' 未知功法');
        if (o.req) assert(o.req.item ? D.ITEMS[o.req.item] : true, ev.id + ' 需求物品不存在');
      });
      if (c.req && c.req.item) assert(D.ITEMS[c.req.item], ev.id + ' req 物品不存在');
    });
  });
});

test('丹方材料与产出存在', function () {
  D.RECIPES.forEach(function (r) {
    assert(D.ITEMS[r.out.id], r.id + ' 产出不存在');
    Object.keys(r.mats).forEach(function (id) { assert(D.ITEMS[id], r.id + ' 材料不存在: ' + id); });
  });
});

test('所有功法技能存在', function () {
  Object.keys(D.TECHNIQUES).forEach(function (id) {
    var t = D.TECHNIQUES[id];
    assert(D.SKILLS[t.skill], id + ' 技能不存在');
  });
});

console.log('\n== 角色与属性 ==');

test('新游戏初始化', function () {
  var s = newState();
  assert(s.player.name === '测试者');
  assert(s.player.realm === 0 && s.player.layer === 0);
  assert(s.player.hp === E.derived(s).hpMax, '气血未满');
  assert(s.player.mp === E.derived(s).mpMax, '灵力未满');
  assert(s.player.inventory.length > 0, '初始物品为空');
  assert(s.player.stones > 0);
  assert(E.expNeed(s) > 0);
});

test('不同灵根与出身产生不同属性', function () {
  var fire = E.newGame({ name: '火', root: 'fire', origin: 'clan', daoheart: 'sword' });
  var earth = E.newGame({ name: '土', root: 'earth', origin: 'orphan', daoheart: 'mercy' });
  var df = E.derived(fire);
  var de = E.derived(earth);
  assert(df.atk > de.atk, '火灵根攻击应更高');
  assert(de.hpMax > 0 && df.hpMax > 0);
  assert(fire.player.stones !== earth.player.stones);
});

test('装备与卸下不丢失物品，并生效属性', function () {
  var s = newState();
  E.addItem(s, 'qingfeng', 1);
  var before = E.countItem(s, 'qingfeng');
  var atkBefore = E.derived(s).atk;
  E.equipItem(s, 'qingfeng');
  assert(s.player.equipment.weapon === 'qingfeng');
  assert(E.countItem(s, 'qingfeng') === before - 1);
  assert(E.derived(s).atk > atkBefore, '装备后攻击应提升');
  E.unequipItem(s, 'weapon');
  assert(s.player.equipment.weapon === null);
  assert(E.countItem(s, 'qingfeng') === before);
  assert(E.derived(s).atk === atkBefore, '卸下后攻击应还原');
});

test('轮回印记提供初始加成', function () {
  localStorage.removeItem(D.META_KEY);
  var plain = E.newGame({ name: '甲', root: 'fire', origin: 'herb', daoheart: 'sword' });
  localStorage.setItem(D.META_KEY, JSON.stringify({ ascensions: 3, bestRealm: 9, lastName: '旧人' }));
  var legacy = E.newGame({ name: '乙', root: 'fire', origin: 'herb', daoheart: 'sword' });
  assert(legacy.player.base.comp === plain.player.base.comp + 3);
  assert(legacy.player.base.luck === plain.player.base.luck + 3);
  assert(legacy.player.stones === plain.player.stones + 150);
  localStorage.removeItem(D.META_KEY);
});

test('功法切换提升修炼效率', function () {
  var s = newState();
  var r1 = E.derived(s).rate;
  s.player.learned.push('fenyu');
  E.equipTechnique(s, 'fenyu');
  var r2 = E.derived(s).rate;
  assert(r2 > r1, '换功法后修炼速度应提升');
});

console.log('\n== 修炼与突破 ==');

test('打坐增加修为并消耗时间', function () {
  var s = newState();
  var age = s.player.ageMonths;
  var res = E.meditate(s);
  assert(res.ok && res.gain > 0);
  assert(s.player.ageMonths === age + 1);
  assert(s.player.exp === res.gain);
  assert(s.stats.meditations === 1);
});

test('突破成功提升境界并重置修为', function () {
  var s = newState();
  var savedRandom = Math.random;
  Math.random = function () { return 0; }; // 必成
  s.player.exp = E.expNeed(s);
  var res = E.breakthrough(s, false);
  Math.random = savedRandom;
  assert(res.ok && res.success);
  assert(s.player.layer === 1);
  assert(s.player.exp === 0);
  assert(s.player.hp === E.derived(s).hpMax);
  assert(s.stats.breakthroughs === 1);
});

test('修为已满时不能再打坐浪费时光', function () {
  var s = newState();
  s.player.exp = E.expNeed(s);
  var res = E.meditate(s);
  assert(!res.ok);
  var res2 = E.closedCultivation(s);
  assert(!res2.ok);
});

test('突破失败损失修为', function () {
  var s = newState();
  var savedRandom = Math.random;
  Math.random = function () { return 0.999; }; // 必败
  s.player.exp = E.expNeed(s);
  var res = E.breakthrough(s, false);
  Math.random = savedRandom;
  assert(res.ok && !res.success);
  assert(s.player.exp < E.expNeed(s));
  assert(s.player.breakthroughBuff > 0);
});

test('破境丹提升成功率并被消耗', function () {
  var s = newState();
  E.addItem(s, 'pojing', 1);
  var c1 = E.breakthroughChance(s, false);
  var c2 = E.breakthroughChance(s, true);
  assert(c2 > c1, '服用破境丹后成功率应提升');
  assert(Math.abs(c2 - Math.min(0.95, c1 + 0.25)) < 1e-9, '概率加成不正确');
  s.player.exp = E.expNeed(s);
  var savedRandom = Math.random;
  Math.random = function () { return 0; };
  var res = E.breakthrough(s, true);
  Math.random = savedRandom;
  assert(res.usedPill);
  assert(E.countItem(s, 'pojing') === 0);
});

test('完整突破路线可抵达飞升', function () {
  var s = newState();
  s.player.hp = E.derived(s).hpMax;
  var guard = 0;
  while (!s.player.ascended && guard++ < 80) {
    s.player.hp = E.derived(s).hpMax;
    s.player.mp = E.derived(s).mpMax;
    s.player.exp = E.expNeed(s);
    var savedRandom = Math.random;
    Math.random = function () { return 0; };
    var res = E.breakthrough(s, false);
    Math.random = savedRandom;
    assert(res.ok, '突破失败: ' + JSON.stringify(res));
    if (res.tribulation) {
      assert(s.battle, '未触发天劫战斗');
      assert(s.battle.enemy.tribulation);
      s.battle.enemy.hp = 1;
      var saved2 = Math.random;
      Math.random = function () { return 0; };
      E.battleAction(s, 'attack');
      Math.random = saved2;
      assert(s.player.ascended, '渡过天劫后应飞升');
      assert(s.ended === 'ascended');
      E.endBattle(s);
    }
  }
  assert(s.player.ascended, '未能飞升');
  assert(s.player.realm === D.REALMS.length - 1);
  assert(s.achievements.ascend, '飞升成就未解锁');
  assert(guard < 80);
});

test('年龄超过寿元会坐化', function () {
  var s = newState();
  s.player.ageMonths = s.player.lifespan * 12 - 1;
  E.advanceTime(s, 2);
  assert(s.ended === 'death');
  assert(s.player.dead);
});

console.log('\n== 历练与战斗 ==');

test('历练返回合法事件并消耗时间', function () {
  var s = newState();
  var before = s.player.ageMonths;
  var res = E.explore(s, 'luoxia');
  assert(res.ok && res.event);
  assert(s.player.ageMonths >= before + 1);
  assert(s.world.recentEvents[0] === res.event.id);
});

test('未解锁区域不可进入', function () {
  var s = newState();
  var res = E.explore(s, 'jiuyou');
  assert(!res.ok);
});

test('所有事件选项均可结算', function () {
  var s = newState();
  s.player.realm = 3;
  s.player.layer = 0;
  s.player.stones = 5000;
  D.EVENTS.forEach(function (ev) {
    ev.choices.forEach(function (c, i) {
      /* 保证需求物品存在 */
      if (c.req && c.req.item) E.addItem(s, c.req.item, 5);
      if (c.consume) c.consume.forEach(function (x) { E.addItem(s, x.id, 5); });
      var savedRandom = Math.random;
      Math.random = function () { return 0.5; };
      s.world.currentRegion = ev.region === 'any' ? 'luoxia' : ev.region;
      var r = E.resolveChoice(s, ev, i);
      Math.random = savedRandom;
      assert(r.ok, ev.id + ' 选项 ' + i + ' 结算失败: ' + (r.error || ''));
      if (s.battle) { s.battle = null; }
      if (s.ended) { s.ended = null; }
    });
  });
});

test('战斗胜利给予奖励', function () {
  var s = newState();
  s.world.currentRegion = 'luoxia';
  var b = E.startBattle(s, 'wolf', 'luoxia', { noElite: true });
  b.enemy.hp = 1;
  var saved = Math.random;
  Math.random = function () { return 0; };
  var res = E.battleAction(s, 'attack');
  Math.random = saved;
  assert(res.result === 'win');
  assert(b.rewards.exp > 0 && b.rewards.stones > 0);
  assert(s.stats.wins === 1);
  E.endBattle(s);
});

test('战败不会死亡，损失部分修为与灵石', function () {
  var s = newState();
  s.player.exp = 10;
  s.player.stones = 100;
  s.world.currentRegion = 'luoxia';
  var b = E.startBattle(s, 'wolf', 'luoxia', { noElite: true });
  s.player.hp = 1;
  b.enemy.atk = 100000;
  E.battleAction(s, 'flee');
  if (!b.over) {
    /* flee 成功则再打一场强制失败 */
    E.endBattle(s);
    b = E.startBattle(s, 'wolf', 'luoxia', { noElite: true });
    s.player.hp = 1;
    b.enemy.atk = 100000;
    E.battleAction(s, 'attack');
  }
  if (b.result === 'lose') {
    assert(!s.player.dead);
    assert(s.player.stones < 100);
    assert(s.player.hp > 0);
    assert(s.stats.defeats === 1);
  }
  E.endBattle(s);
});

test('修为已满时不能服用聚气丹', function () {
  var s = newState();
  E.addItem(s, 'juqi', 1);
  var before = E.countItem(s, 'juqi');
  s.player.exp = E.expNeed(s);
  var res = E.useItem(s, 'juqi');
  assert(!res.ok);
  assert(E.countItem(s, 'juqi') === before, '丹药不应被消耗');
});

test('小境界突破增加两年寿元', function () {
  var s = newState();
  var life = s.player.lifespan;
  s.player.exp = E.expNeed(s);
  var saved = Math.random;
  Math.random = function () { return 0; };
  var res = E.breakthrough(s, false);
  Math.random = saved;
  assert(res.success);
  assert(s.player.lifespan === life + 2, '小境界应增加两年寿元');
});

test('丹药可在战斗中使用', function () {
  var s = newState();
  s.world.currentRegion = 'luoxia';
  E.addItem(s, 'huichun', 1);
  var b = E.startBattle(s, 'wolf', 'luoxia', { noElite: true });
  s.player.hp = 10;
  var res = E.battleAction(s, 'pill', 'huichun');
  assert(res.ok);
  assert(s.player.hp > 10);
  assert(E.countItem(s, 'huichun') === 0);
  E.endBattle(s);
});

console.log('\n== 坊市与炼丹 ==');

test('坊市生成货物、买入与卖出', function () {
  var s = newState();
  s.player.stones = 10000;
  assert(s.world.stock.length > 0);
  var entry = s.world.stock.find(function (x) { return !x.sold; });
  assert(entry);
  var res = E.buyStock(s, s.world.stock.indexOf(entry));
  assert(res.ok);
  assert(entry.sold);
  if (res.type === 'item') {
    assert(E.countItem(s, entry.itemId) >= 1);
    var sell = E.sellItem(s, entry.itemId, 1);
    assert(sell.ok && sell.stones > 0);
  }
});

test('低境界坊市不会出现离谱的高阶货', function () {
  var s = newState();
  s.world.marketSeed = 3;
  s.world.marketBucket = -1;
  E.ensureMarket(s);
  s.world.stock.forEach(function (entry) {
    var it = entry.kind === 'tech' ? D.TECHNIQUES[entry.itemId] : D.ITEMS[entry.itemId];
    assert(it, '货架物品不存在');
    assert(it.rarity <= 2, '低境界货架出现高阶物品: ' + it.name);
  });
});

test('坊市刷新消耗灵石', function () {
  var s = newState();
  s.player.stones = 10000;
  var before = s.player.stones;
  var res = E.refreshMarket(s, true);
  assert(res.ok);
  assert(s.player.stones < before);
  assert(s.world.stock.length > 0);
});

test('炼丹消耗材料并按成功率产出', function () {
  var s = newState();
  E.addItem(s, 'lingcao', 4);
  var saved = Math.random;
  Math.random = function () { return 0; };
  var res = E.craft(s, 'craft_huichun');
  Math.random = saved;
  assert(res.ok);
  assert(res.success);
  assert(E.countItem(s, 'huichun') >= 1);
  assert(s.stats.crafts === 1);
});

console.log('\n== 成就与存档 ==');

test('成就解锁并发放奖励', function () {
  var s = newState();
  var before = s.player.stones;
  E.meditate(s);
  var unlocked = E.checkAchievements(s);
  assert(s.achievements.first_step);
  assert(s.player.stones > before);
});

test('存档、读档往返一致', function () {
  var s = newState();
  E.meditate(s);
  assert(E.save(s));
  var loaded = E.load();
  assert(loaded);
  assert(loaded.player.name === s.player.name);
  assert(loaded.player.exp === s.player.exp);
  assert(loaded.stats.meditations === s.stats.meditations);
  assert(loaded.journal.length === s.journal.length);
  E.deleteSave();
});

console.log('\n' + passed + ' tests passed');
if (process.exitCode) {
  console.error('Some tests failed.');
} else {
  console.log('All tests passed.');
}
