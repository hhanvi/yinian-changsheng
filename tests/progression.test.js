'use strict';
var assert = require('assert');
var E = require('../js/engine.js');
try { require('../js/progression.js'); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; }
var passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { process.exitCode = 1; console.error('  FAIL ' + name + '\n' + e.stack); }
}
function state() { return E.newGame({ seed: 42, origin: 'clan' }); }
console.log('\n宗门长卷与四时委托\n');

test('初燃炉火满足后奖励真实入库，并阻止重复领取', function () {
  var s = state(), before = s.resources.stones;
  assert.strictEqual(E.journey(s)[0].ready, true);
  assert.strictEqual(E.claimChapter(s, 'hearth').ok, true);
  assert.strictEqual(s.resources.stones, before + 30);
  assert.strictEqual(E.claimChapter(s, 'hearth').ok, false);
  assert.strictEqual(s.resources.stones, before + 30);
});
test('达标也不能跳过前章领取，未知章节不改变状态', function () {
  var s = state(); s.stats.built = 2; s.stats.recruited = 1;
  var before = JSON.stringify(s);
  assert.strictEqual(E.claimChapter(s, 'settle').ok, false);
  assert.strictEqual(E.claimChapter(s, 'unknown').ok, false);
  assert.strictEqual(JSON.stringify(s), before);
});
test('条件不足显示进度且不可领取', function () {
  var s = state(); E.claimChapter(s, 'hearth');
  var chapter = E.journey(s)[1];
  assert.strictEqual(chapter.locked, false);
  assert.strictEqual(chapter.ready, false);
  assert.strictEqual(chapter.goals[0].current, 0);
  assert.strictEqual(E.claimChapter(s, 'settle').ok, false);
});
test('旧档缺少长卷字段时查询保持只读，领取和升版均兼容', function () {
  var s = state(); delete s.chronicle;
  var before = JSON.stringify(s); E.journey(s); E.commission(s);
  assert.strictEqual(JSON.stringify(s), before);
  var restored = E.importState(before);
  assert.deepStrictEqual(restored.chronicle.chapters, []);
  assert.deepStrictEqual(restored.chronicle.commissions, []);
  assert.strictEqual(E.claimChapter(s, 'hearth').ok, true);
});
test('已达标老玩家可以连续领取符合条件的前两章', function () {
  var s = state(); s.stats.built = 2; s.stats.recruited = 1;
  assert.ok(E.claimChapter(s, 'hearth').ok);
  assert.ok(E.claimChapter(s, 'settle').ok);
  assert.strictEqual(E.journey(s)[2].locked, false);
});
test('委托资源不足时没有任何部分扣款或奖励', function () {
  var s = state(); s.day = 271; s.resources.wood = 100; s.resources.herbs = 0;
  var id = E.commission(s).id, before = JSON.stringify(s);
  assert.strictEqual(E.fulfillCommission(s, id).ok, false);
  assert.strictEqual(JSON.stringify(s), before);
});
test('春日交付扣除十二灵草，获得五十灵石和十二食物，仅限一次', function () {
  var s = state(); s.resources.herbs = 20;
  var stones = s.resources.stones, food = s.resources.food;
  var id = E.commission(s).id;
  assert.strictEqual(E.fulfillCommission(s, id).ok, true);
  assert.strictEqual(s.resources.herbs, 8);
  assert.strictEqual(s.resources.stones, stones + 50);
  assert.strictEqual(s.resources.food, food + 12);
  assert.strictEqual(E.fulfillCommission(s, id).ok, false);
});
test('九十日季节边界和跨年生成独立委托，过期委托不能结算', function () {
  var s = state(); s.day = 90; var spring = E.commission(s).id;
  s.day = 91; var summer = E.commission(s).id;
  assert.notStrictEqual(spring, summer);
  var before = JSON.stringify(s);
  assert.strictEqual(E.fulfillCommission(s, spring).ok, false);
  assert.strictEqual(JSON.stringify(s), before);
  s.day = 361;
  assert.notStrictEqual(E.commission(s).id, spring);
  assert.strictEqual(E.commission(s).season, '春');
});
test('领取记录导入导出后保留，已领章节和当季委托不可再领', function () {
  var s = state(); s.resources.herbs = 30;
  E.claimChapter(s, 'hearth'); var id = E.commission(s).id; E.fulfillCommission(s, id);
  var restored = E.importState(E.exportState(s));
  assert.strictEqual(E.claimChapter(restored, 'hearth').ok, false);
  assert.strictEqual(E.fulfillCommission(restored, id).ok, false);
  assert.strictEqual(E.journey(restored)[0].claimed, true);
});
test('成长记录异常字段安全归一化', function () {
  var s = state(); s.chronicle = { chapters: 'bad', commissions: null };
  var restored = E.importState(JSON.stringify(s));
  assert.deepStrictEqual(restored.chronicle, { chapters: [], commissions: [] });
});
test('夏秋冬交付精确扣费与入库，来年春日可重新完成', function () {
  [
    { day: 91, want: { food: 165, wood: 200, herbs: 208, stones: 260, stone: 200, renown: 14 } },
    { day: 181, want: { food: 150, wood: 190, herbs: 200, stones: 280, stone: 230, renown: 15 } },
    { day: 271, want: { food: 270, wood: 180, herbs: 185, stones: 250, stone: 200, renown: 15 } }
  ].forEach(function (row) {
    var s = state(); s.day = row.day;
    s.resources = { food: 200, wood: 200, herbs: 200, stones: 200, stone: 200, renown: 10 };
    assert.ok(E.fulfillCommission(s, E.commission(s).id).ok);
    assert.deepStrictEqual(s.resources, row.want);
  });
  var s = state(); s.resources.herbs = 100;
  assert.ok(E.fulfillCommission(s, E.commission(s).id).ok);
  s.day = 361;
  assert.ok(E.fulfillCommission(s, E.commission(s).id).ok);
  assert.strictEqual(s.resources.herbs, 76);
});
test('后期存档能顺序完成七章，首章已领后断粮不会锁死后续章节', function () {
  var s = state();
  assert.ok(E.claimChapter(s, 'hearth').ok);
  s.resources.food = 0; s.resources.renown = 900;
  s.stats.built = 2; s.stats.recruited = 1; s.stats.missions = 1;
  s.stats.promoted = 1; s.stats.breakthroughs = 3; s.stats.pillsMade = 5; s.stats.battlesWon = 1;
  s.research.nodes.lingzhi = true; s.flags.auraBonus = 100;
  E.player(s).realm = 9;
  ['settle', 'trail', 'legacy', 'guardian', 'fame', 'eternal'].forEach(function (id) {
    assert.ok(E.claimChapter(s, id).ok, id);
  });
  assert.strictEqual(E.journey(s).filter(function (c) { return c.claimed; }).length, 7);
});
test('三座灵田不能替代灵田药圃膳堂各一座的开局目标', function () {
  var s = state();
  s.buildings.forEach(function (b) { if (b.type === 'herb' || b.type === 'kitchen') b.type = 'farm'; });
  assert.strictEqual(E.journey(s)[0].goals[0].current, 1);
  assert.strictEqual(E.claimChapter(s, 'hearth').ok, false);
});
console.log('\n' + passed + ' 项成长测试通过。\n');
