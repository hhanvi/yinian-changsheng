/* 宗门长卷与四时委托：纯逻辑，查询不修改存档。 */
(function (global) {
  'use strict';
  var E = global.SectEngine || require('./engine.js');
  function records(state, key) {
    return state.chronicle && Array.isArray(state.chronicle[key]) ? state.chronicle[key] : [];
  }
  function record(state, key, id) {
    if (!state.chronicle || typeof state.chronicle !== 'object') state.chronicle = {};
    ['chapters', 'commissions'].forEach(function (k) {
      if (!Array.isArray(state.chronicle[k])) state.chronicle[k] = [];
    });
    state.chronicle[key].push(id);
  }
  function goal(text, current, target, tab, affairs) {
    return { text: text, current: current, target: target, done: current >= target, tab: tab, affairs: affairs || '' };
  }
  function rewards(state, reward) {
    Object.keys(reward).forEach(function (key) {
      if (key === 'insight') state.insight += reward[key];
      else state.resources[key] = (state.resources[key] || 0) + reward[key];
    });
  }
  E.journey = function (state) {
    var st = E.sectStats(state), s = state.stats, claimed = records(state, 'chapters');
    var staffed = ['farm', 'herb', 'kitchen'].filter(function (type) {
      return state.buildings.some(function (b) { return b.type === type && !b.construction && b.workers.length > 0; });
    }).length;
    var bestRealm = E.disciples(state).reduce(function (max, d) { return Math.max(max, d.realm || 0); }, 0);
    var chapters = [
      { id: 'hearth', title: '初燃炉火', subtitle: '让一座山门，先有烟火。', story: '膳堂的第一缕炊烟升起来时，弟子们终于相信，这里会成为一个家。', reward: { stones: 30, food: 20 }, goals: [goal('灵田、药圃与膳堂有人当值', staffed, 3, 'disciples'), goal('储备至少七日口粮', st.foodDays, 7, 'market')] },
      { id: 'settle', title: '安居立业', subtitle: '添一方屋檐，留一盏归灯。', story: '新屋落在松林边，山门外又多了一双等候叩门的脚。', reward: { stones: 70, wood: 30, stone: 20 }, goals: [goal('累计营造两座建筑', s.built || 0, 2, 'build'), goal('新招一名弟子', s.recruited || 0, 1, 'disciples')] },
      { id: 'trail', title: '弟子出山', subtitle: '山下的路，终须自己走。', story: '你把一枚平安符放进弟子的行囊。山外有风雨，也有他们的机缘。', reward: { stones: 100, herbs: 25, renown: 10 }, goals: [goal('派遣一次山下历练', s.missions || 0, 1, 'affairs', 'mission'), goal('晋升一名内门弟子', s.promoted || 0, 1, 'disciples'), goal('累计成功突破三次', s.breakthroughs || 0, 3, 'disciples')] },
      { id: 'legacy', title: '丹书传道', subtitle: '丹火不熄，薪火相传。', story: '药香飘过藏经阁的窗。残经上的空白，被年轻的字迹一点点补全。', reward: { stones: 150, insight: 35, herbs: 35 }, goals: [goal('累计炼成五枚丹药', s.pillsMade || 0, 5, 'affairs', 'alchemy'), goal('完成一项参研', Object.keys(state.research.nodes).filter(function (k) { return !!state.research.nodes[k]; }).length, 1, 'affairs', 'study')] },
      { id: 'guardian', title: '守山立威', subtitle: '护住山门，也护住人间。', story: '来犯者退去后，山脚的百姓送来一面匾。上面没有仙字，只写着平安。', reward: { stones: 220, food: 80, renown: 20 }, goals: [goal('赢得一场战斗', s.battlesWon || 0, 1, 'affairs', 'mission'), goal('宗门声望达到九十', Math.floor(state.resources.renown), 90, 'sect'), goal('宗门灵气达到二十', st.aura, 20, 'build')] },
      { id: 'fame', title: '名动九州', subtitle: '青崖钟响，四海闻名。', story: '曾经无人识得的山路，如今满是慕名而来的修士。你还记得最初的三间茅屋。', reward: { stones: 360, insight: 80, renown: 30 }, goals: [goal('宗门声望达到二百二十', Math.floor(state.resources.renown), 220, 'sect'), goal('培养一名金丹修士', bestRealm >= 2 ? 1 : 0, 1, 'disciples')] },
      { id: 'eternal', title: '一念长生', subtitle: '有人登仙，有灯长明。', story: '云海让开了一条路。你回头看去，青崖山的灯还亮着。长生从来不只属于一人。', reward: { stones: 1000, renown: 100 }, goals: [goal('培养一位飞升真仙', bestRealm >= 9 ? 1 : 0, 1, 'disciples')] }
    ];
    return chapters.map(function (c, i) {
      c.number = i + 1;
      c.claimed = claimed.indexOf(c.id) >= 0;
      c.locked = i > 0 && claimed.indexOf(chapters[i - 1].id) < 0;
      c.ready = !c.claimed && !c.locked && c.goals.every(function (g) { return g.done; });
      c.progress = Math.round(c.goals.reduce(function (sum, g) { return sum + Math.min(1, g.current / g.target); }, 0) / c.goals.length * 100);
      return c;
    });
  };
  E.claimChapter = function (state, id) {
    var chapter = E.journey(state).find(function (c) { return c.id === id; });
    if (!chapter || !chapter.ready) return { ok: false, msg: chapter && chapter.claimed ? '此章馈赠已领取。' : '先完成本章条件与前章，再来领取。' };
    record(state, 'chapters', id);
    rewards(state, chapter.reward);
    E.log(state, '宗门长卷「' + chapter.title + '」落笔。' + chapter.story, 'good');
    return { ok: true, msg: '「' + chapter.title + '」馈赠已入库。' };
  };
  var commissions = [
    { title: '春山采药', text: '山下医馆来信，想向药圃订一批春生灵草。', cost: { herbs: 12 }, reward: { stones: 50, food: 12, renown: 3 } },
    { title: '长夏施粥', text: '渡口暑气正盛，粥棚正缺一批灵谷。', cost: { food: 35 }, reward: { stones: 60, herbs: 8, renown: 4 } },
    { title: '秋收修桥', text: '秋汛损了山脚小桥，乡人盼仙门相助。', cost: { food: 50, wood: 10 }, reward: { stones: 80, stone: 30, renown: 5 } },
    { title: '寒夜送暖', text: '雪封山路，给守山人送些柴薪与药草。', cost: { herbs: 15, wood: 20 }, reward: { food: 70, stones: 50, renown: 5 } }
  ];
  E.commission = function (state) {
    var d = E.getDate(state), period = Math.floor((state.day - 1) / 90);
    var base = commissions[d.seasonIndex], id = 'season-' + period;
    return { id: id, title: base.title, text: base.text, cost: base.cost, reward: base.reward,
      season: d.season.name, year: d.year, daysLeft: 90 - (state.day - 1) % 90,
      claimed: records(state, 'commissions').indexOf(id) >= 0, affordable: E.canAfford(state, base.cost) };
  };
  E.fulfillCommission = function (state, id) {
    var c = E.commission(state);
    if (id !== c.id || c.claimed) return { ok: false, msg: '这份委托已结清或已经换季。' };
    if (!c.affordable) return { ok: false, msg: '交付物资还不足，先补齐再来。' };
    Object.keys(c.cost).forEach(function (key) { state.resources[key] -= c.cost[key]; });
    rewards(state, c.reward);
    record(state, 'commissions', id);
    E.log(state, '四时委托「' + c.title + '」完成。山上山下，又多了一份照应。', 'good');
    return { ok: true, msg: '委托完成，回礼已送入库房。' };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = E;
})(typeof window !== 'undefined' ? window : globalThis);
