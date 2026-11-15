/*
 * 一念长生 · 宗门篇 · 世界数据
 * 原创文案与数值。玩法为宗门经营 / 修仙模拟，参考同类作品的常见框架。
 */
(function (global) {
  'use strict';

  var D = {};

  D.VERSION = 2;
  D.SAVE_KEY = 'yinian_sect_save_v3';
  D.SAVE_BACKUP_KEY = 'yinian_sect_save_v3_backup';
  D.LEGACY_SAVE_KEYS = ['yinian_sect_save_v2', 'yinian_sect_save_v2_backup'];
  D.SETTINGS_KEY = 'yinian_sect_settings_v2';
  D.TITLE = '一念长生';
  D.SUBTITLE = '青崖山 · 宗门纪';
  D.TAGLINE = '从三间茅屋，到一座仙门。';
  D.INTRO = '旧宗一夜倾覆，你带着半卷残经与几名弟子，在青崖山重新立下山门。山风很冷，炉火却还亮着。';
  D.QUOTES = [
    '大道无形，生育天地；大道无情，运行日月。',
    '山不在高，有仙则名。',
    '一人得道，鸡犬升天。',
    '长生路远，且行且悟。',
    '炉中丹火未熄，山中岁月还长。'
  ];

  /* ------------------------------------------------------------------ */
  /* 地图                                                               */
  /* ------------------------------------------------------------------ */
  /*
   * G 草地 / F 林地 / M 山岩 / W 水泽 / S 灵脉
   * 地图手工布置，保证第一眼有山门、有水、有林，也留足扩建空间。
   */
  D.MAP_W = 13;
  D.MAP_H = 9;
  D.MAP = [
    'MMFGG FGGGFWWM'.replace(/ /g, ''),
    'MFGGSGGFGGWWM',
    'MFGGGGGGGGGWM',
    'MGGFGGGGFGGGM',
    'MGGGGGGGGGGGM',
    'MGFGGGGGGGFGM',
    'MGGGGGGGGGGGM',
    'MGGFGGGGGFGGM',
    'MMFGGGGGGWWMM'
  ];

  D.PATHS = [
    [6, 8], [6, 7], [6, 6], [5, 6], [7, 6], [6, 5], [5, 5], [7, 5],
    [4, 5], [8, 5], [6, 4], [5, 4], [7, 4], [3, 6], [9, 6], [3, 4], [9, 4]
  ];

  D.TILE_W = 64;
  D.TILE_H = 32;

  D.START_BUILDINGS = [
    { type: 'gate', x: 6, y: 8 },
    { type: 'dorm', x: 3, y: 5 },
    { type: 'meditation', x: 6, y: 5 },
    { type: 'kitchen', x: 8, y: 6 },
    { type: 'farm', x: 3, y: 2 },
    { type: 'herb', x: 4, y: 3 },
    { type: 'well', x: 7, y: 7 }
  ];

  D.START_WORKERS = ['farm', 'herb', 'kitchen'];

  D.DECOR = [
    { type: 'lantern', x: 5, y: 7 },
    { type: 'lantern', x: 7, y: 7 },
    { type: 'bamboo', x: 1, y: 4 },
    { type: 'bamboo', x: 10, y: 6 },
    { type: 'table', x: 2, y: 6 },
    { type: 'table', x: 9, y: 4 },
    { type: 'flag', x: 5, y: 8 },
    { type: 'flag', x: 7, y: 8 },
    { type: 'pine', x: 1, y: 2 },
    { type: 'pine', x: 11, y: 7 },
    { type: 'stele', x: 4, y: 6 },
    { type: 'stele', x: 8, y: 4 },
    { type: 'bridge', x: 9, y: 8 },
    { type: 'lotus', x: 11, y: 1 },
    { type: 'lotus', x: 10, y: 8 }
  ];

  /* ------------------------------------------------------------------ */
  /* 四时与天气                                                         */
  /* ------------------------------------------------------------------ */
  D.SEASONS = [
    {
      key: 'spring', name: '春', full: '暮春', glyph: '春', color: '#6f8f5e',
      farm: 1.15, herb: 1.3, food: 1, desc: '草木抽芽，灵田与药圃长势最好。'
    },
    {
      key: 'summer', name: '夏', full: '盛夏', glyph: '夏', color: '#b16a45',
      farm: 1.25, herb: 1.05, food: 1.05, desc: '日照充足，灵谷丰茂，但弟子更易疲惫。'
    },
    {
      key: 'autumn', name: '秋', full: '深秋', glyph: '秋', color: '#ad8a4c',
      farm: 1.4, herb: 0.9, food: 1, desc: '秋收时节，灵田产量最高，宜囤粮过冬。'
    },
    {
      key: 'winter', name: '冬', full: '寒冬', glyph: '冬', color: '#6d8796',
      farm: 0.22, herb: 0.25, food: 1.2, desc: '大雪封山，灵田近乎绝收，粮食消耗却更多。'
    }
  ];

  D.WEATHER = [
    { id: 'clear', name: '晴', glyph: '晴', farm: 1, mood: 1 },
    { id: 'cloudy', name: '阴', glyph: '阴', farm: 0.96, mood: 0 },
    { id: 'rain', name: '雨', glyph: '雨', farm: 1.15, mood: -1 },
    { id: 'fog', name: '雾', glyph: '雾', farm: 0.95, mood: 1 },
    { id: 'snow', name: '雪', glyph: '雪', farm: 0.5, mood: 0, winter: true },
    { id: 'wind', name: '风', glyph: '风', farm: 0.92, mood: -1 }
  ];

  /* ------------------------------------------------------------------ */
  /* 境界                                                               */
  /* ------------------------------------------------------------------ */
  /* need = base + layer * step。数值为“修为点”，按日结算。 */
  D.REALMS = [
    { key: 'qi', name: '炼气期', short: '炼气', layers: 9, base: 18, step: 8, life: 4, atk: 11, def: 5, hp: 70, color: '#647d6b' },
    { key: 'foundation', name: '筑基期', short: '筑基', layers: 4, base: 120, step: 60, life: 20, atk: 28, def: 13, hp: 160, color: '#4e7c78' },
    { key: 'core', name: '金丹期', short: '金丹', layers: 4, base: 420, step: 220, life: 60, atk: 70, def: 34, hp: 420, color: '#b18a42' },
    { key: 'nascent', name: '元婴期', short: '元婴', layers: 4, base: 1400, step: 700, life: 150, atk: 180, def: 90, hp: 1100, color: '#9b6a54' },
    { key: 'spirit', name: '化神期', short: '化神', layers: 4, base: 4000, step: 2000, life: 400, atk: 480, def: 240, hp: 3000, color: '#7b5f84' },
    { key: 'void', name: '炼虚期', short: '炼虚', layers: 4, base: 11000, step: 5500, life: 800, atk: 1300, def: 650, hp: 8000, color: '#4e6f8c' },
    { key: 'unity', name: '合体期', short: '合体', layers: 4, base: 30000, step: 15000, life: 1500, atk: 3500, def: 1700, hp: 22000, color: '#8d7440' },
    { key: 'mahayana', name: '大乘期', short: '大乘', layers: 4, base: 80000, step: 40000, life: 3000, atk: 9500, def: 4600, hp: 60000, color: '#a35b4a' },
    { key: 'tribulation', name: '渡劫期', short: '渡劫', layers: 4, base: 200000, step: 100000, life: 5000, atk: 26000, def: 12000, hp: 160000, color: '#5c536e' },
    { key: 'ascended', name: '飞升', short: '飞升', layers: 1, base: 1, step: 0, life: 0, atk: 0, def: 0, hp: 0, color: '#d8b96b' }
  ];

  D.LAYER_LABELS = {
    1: ['飞升'],
    4: ['初期', '中期', '后期', '圆满'],
    9: ['一层', '二层', '三层', '四层', '五层', '六层', '七层', '八层', '九层']
  };

  /* ------------------------------------------------------------------ */
  /* 灵根、出身、特质                                                   */
  /* ------------------------------------------------------------------ */
  D.ROOTS = {
    metal: {
      key: 'metal', name: '金灵根', glyph: '金', color: '#b49a54',
      desc: '庚金锐利，剑心天成。攻伐与破境都更占先机。',
      aptitude: 3, cult: 1.02, power: 1.08, alchemy: 0.95
    },
    wood: {
      key: 'wood', name: '木灵根', glyph: '木', color: '#6f8f5e',
      desc: '乙木生生不息，气血绵长，最宜灵植与疗伤。',
      aptitude: 3, cult: 1.04, power: 0.98, hp: 1.1, farm: 1.12, herb: 1.12
    },
    water: {
      key: 'water', name: '水灵根', glyph: '水', color: '#6d91a5',
      desc: '上善若水，神识澄澈，修行时更容易入定。',
      aptitude: 3, cult: 1.08, power: 0.96, insight: 1.1, mood: 1.04
    },
    fire: {
      key: 'fire', name: '火灵根', glyph: '火', color: '#b25d48',
      desc: '离火焚天，性烈而直，于丹道一途别有天赋。',
      aptitude: 3, cult: 1.05, power: 1.04, alchemy: 1.18
    },
    earth: {
      key: 'earth', name: '土灵根', glyph: '土', color: '#9a8259',
      desc: '厚土载物，根基沉稳，最不易走火入魔。',
      aptitude: 3, cult: 0.99, power: 1.0, def: 1.14, hp: 1.08
    }
  };

  D.TECHNIQUES = {
    yinqi: {
      id: 'yinqi', name: '青崖引气诀', glyph: '引', cult: 0.06,
      desc: '最平正的入门吐纳法。无甚奇处，却胜在根基稳当。'
    },
    jian: {
      id: 'jian', name: '青崖剑诀', glyph: '剑', cult: 0.02, power: 0.1,
      desc: '以气御剑，剑随心动。金灵根修之，锋芒最盛。'
    },
    qingmu: {
      id: 'qingmu', name: '青木长生功', glyph: '木', cult: 0.05, hp: 0.08, farm: 0.05,
      desc: '木气生生不息，气血绵长，久修可养身延年。'
    },
    shui: {
      id: 'shui', name: '玄水凝神篇', glyph: '水', cult: 0.04, insight: 0.08, mood: 0.04,
      desc: '心若止水，神识澄明。水灵根修之，参悟更快。'
    },
    dan: {
      id: 'dan', name: '青崖丹火诀', glyph: '火', cult: 0.02, alchemy: 0.12,
      desc: '以心火引动丹火，火候拿捏比旁人更准。'
    },
    tu: {
      id: 'tu', name: '厚土养元功', glyph: '土', cult: 0.03, hp: 0.1, def: 0.08,
      desc: '如山如岳，根基沉稳，最不易走火入魔。'
    }
  };

  D.ORIGINS = {
    orphan: {
      key: 'orphan', name: '山野遗孤', glyph: '野',
      desc: '你在山野间长大，风餐露宿，却也因此筋骨强健、心性坚韧。',
      bonusText: '气运 +1 · 食物 +10 · 灵石 +20',
      effects: { luck: 1 }, resources: { food: 10, stones: 20 }
    },
    clan: {
      key: 'clan', name: '没落世家', glyph: '世',
      desc: '祖上曾出过金丹修士，如今家道中落，只余几卷残书与一口旧剑。',
      bonusText: '灵石 +90 · 悟道 +10 · 攻击 +8%',
      effects: { power: 0.08 }, resources: { stones: 90 }, insight: 10
    },
    herb: {
      key: 'herb', name: '药庐学徒', glyph: '药',
      desc: '你自幼在药炉边长大，识得百草，也见过太多生死。',
      bonusText: '灵草 +10 · 炼丹 +15% · 回春丹 ×2',
      effects: { alchemy: 0.15 }, resources: { herbs: 10 }, pills: { huichun: 2 }
    },
    swordsman: {
      key: 'swordsman', name: '江湖剑客', glyph: '剑',
      desc: '你曾以一柄凡铁剑走过半个江湖。剑未入道，心已向道。',
      bonusText: '攻击 +12% · 声望 +5 · 灵石 +20',
      effects: { power: 0.12 }, resources: { stones: 20, renown: 5 }
    }
  };

  D.TRAITS = {
    heavenly: {
      id: 'heavenly', name: '天灵根', rarity: '天', glyph: '天',
      desc: '万中无一的修行资质，吐纳一日胜过旁人三日。',
      mods: { aptitude: 2, cult: 0.25 }
    },
    single: {
      id: 'single', name: '单灵根', rarity: '地', glyph: '单',
      desc: '灵根纯净，修行少有杂念。',
      mods: { cult: 0.12 }
    },
    dual: {
      id: 'dual', name: '双灵根', rarity: '玄', glyph: '双',
      desc: '两气并行，虽不纯粹，却胜在平稳。',
      mods: { cult: 0.05 }
    },
    swordheart: {
      id: 'swordheart', name: '剑心通明', rarity: '地', glyph: '剑',
      desc: '心中无尘，出剑无碍。',
      mods: { power: 0.18, breakthrough: 0.04 }
    },
    alchemy: {
      id: 'alchemy', name: '丹心天成', rarity: '地', glyph: '丹',
      desc: '一闻药香便知火候，天生适合守着丹炉。',
      mods: { alchemy: 0.35 }
    },
    shennong: {
      id: 'shennong', name: '神农之血', rarity: '玄', glyph: '农',
      desc: '撒下一把种子，便能让荒坡长出灵谷。',
      mods: { farm: 0.3, herb: 0.3 }
    },
    scholar: {
      id: 'scholar', name: '过目不忘', rarity: '玄', glyph: '文',
      desc: '经卷看一遍便能记住，参悟总比别人快些。',
      mods: { insight: 0.25 }
    },
    steadfast: {
      id: 'steadfast', name: '道心坚定', rarity: '玄', glyph: '定',
      desc: '外物难扰，破境时少一分心魔。',
      mods: { breakthrough: 0.08, moodTarget: 5 }
    },
    optimistic: {
      id: 'optimistic', name: '乐天知命', rarity: '凡', glyph: '乐',
      desc: '再苦的日子，也能从一碗热粥里尝出甜来。',
      mods: { moodTarget: 10, mood: 5 }
    },
    solitary: {
      id: 'solitary', name: '孤僻', rarity: '凡', glyph: '孤',
      desc: '不爱与人往来，独处时反而更能入定。',
      mods: { cult: 0.1, moodTarget: -5 }
    },
    lazy: {
      id: 'lazy', name: '懒散', rarity: '凡', glyph: '懒',
      desc: '能坐着绝不站着，能躺着绝不坐着。',
      mods: { work: -0.18, moodTarget: 4 }
    },
    diligent: {
      id: 'diligent', name: '勤勉', rarity: '凡', glyph: '勤',
      desc: '天不亮就起身，山门里的第一缕炊烟总是他点的。',
      mods: { work: 0.18, energyCost: 0.1 }
    },
    frail: {
      id: 'frail', name: '体弱', rarity: '凡', glyph: '弱',
      desc: '从小药不离口，受不得太多风霜。',
      mods: { hp: -0.15, injuryRisk: 0.15 }
    },
    ironbone: {
      id: 'ironbone', name: '铁骨', rarity: '玄', glyph: '骨',
      desc: '皮糙肉厚，挨上三两下也还能站着。',
      mods: { hp: 0.18, def: 0.12 }
    },
    lucky: {
      id: 'lucky', name: '福缘深厚', rarity: '地', glyph: '福',
      desc: '走路都能踢到灵石，遇险也总有转机。',
      mods: { luck: 2, eventGood: 0.08 }
    },
    unlucky: {
      id: 'unlucky', name: '霉运缠身', rarity: '凡', glyph: '霉',
      desc: '喝凉水都塞牙，偏偏还活着。',
      mods: { luck: -2, eventGood: -0.06 }
    },
    glutton: {
      id: 'glutton', name: '食量惊人', rarity: '凡', glyph: '食',
      desc: '一顿能吃三碗灵米饭，干起活来倒也不含糊。',
      mods: { food: 0.3, work: 0.05 }
    },
    clean: {
      id: 'clean', name: '洁癖', rarity: '凡', glyph: '净',
      desc: '见不得半点灰尘，住处附近有灵井才会舒心。',
      mods: { moodTarget: 3 }
    },
    merchant: {
      id: 'merchant', name: '商贾之后', rarity: '玄', glyph: '商',
      desc: '算盘打得比剑还快，最懂山下坊市的行情。',
      mods: { market: 0.06, renown: 0.05 }
    },
    vengeful: {
      id: 'vengeful', name: '血海深仇', rarity: '玄', glyph: '仇',
      desc: '心里压着一桩旧账，出手总比旁人多三分狠。',
      mods: { power: 0.1, moodTarget: -6 }
    },
    pure: {
      id: 'pure', name: '赤子之心', rarity: '玄', glyph: '赤',
      desc: '心思澄澈，不染尘埃，修行时心魔极少。',
      mods: { moodTarget: 8, breakthrough: 0.03 }
    }
  };

  D.BACKGROUNDS = [
    { name: '山野遗孤', rootBias: ['wood', 'earth'], traitBias: ['ironbone', 'lucky'] },
    { name: '药庐学徒', rootBias: ['wood', 'fire'], traitBias: ['alchemy', 'shennong'] },
    { name: '没落世家', rootBias: ['metal', 'water'], traitBias: ['scholar', 'steadfast'] },
    { name: '江湖剑客', rootBias: ['metal', 'fire'], traitBias: ['swordheart', 'vengeful'] },
    { name: '渔家少年', rootBias: ['water'], traitBias: ['optimistic', 'lucky'] },
    { name: '猎户之女', rootBias: ['earth', 'metal'], traitBias: ['ironbone', 'diligent'] },
    { name: '落魄书生', rootBias: ['water', 'wood'], traitBias: ['scholar', 'solitary'] },
    { name: '行商学徒', rootBias: ['metal', 'earth'], traitBias: ['merchant', 'diligent'] },
    { name: '守墓人', rootBias: ['earth', 'water'], traitBias: ['solitary', 'steadfast'] },
    { name: '采药人', rootBias: ['wood'], traitBias: ['shennong', 'frail'] }
  ];

  /* ------------------------------------------------------------------ */
  /* 建筑                                                               */
  /* ------------------------------------------------------------------ */
  D.BUILD_CATEGORIES = [
    { id: 'all', name: '全部' },
    { id: 'living', name: '起居' },
    { id: 'cultivate', name: '修炼' },
    { id: 'produce', name: '生产' },
    { id: 'sect', name: '宗门' }
  ];

  D.BUILDINGS = {
    gate: {
      id: 'gate', name: '山门', glyph: '门', category: 'sect', unique: true,
      desc: '一门之始。山门越气派，来访的散修与商队越多。',
      cost: {}, buildDays: 0, maxLevel: 3, slots: 0, aura: 1, fengShui: 2,
      effect: '声望 +0.1/日 · 山门气象',
      upgradeCost: { wood: 60, stone: 50, stones: 80 }
    },
    dorm: {
      id: 'dorm', name: '弟子居', glyph: '舍', category: 'living',
      desc: '供弟子歇息的木舍。床铺不够时，弟子只能将就着睡。',
      cost: { wood: 30, stone: 15 }, buildDays: 2, maxLevel: 3, slots: 0, capacity: 4,
      aura: 0, fengShui: 3, effect: '每级安顿 4 名弟子 · 精力恢复',
      upgradeCost: { wood: 45, stone: 30 }
    },
    meditation: {
      id: 'meditation', name: '静室', glyph: '静', category: 'cultivate',
      desc: '一方蒲团，一炉清香。内门弟子在此吐纳，事半功倍。',
      cost: { wood: 25, stone: 20, stones: 20 }, buildDays: 2, maxLevel: 3, slots: 2,
      aura: 2, fengShui: 4, effect: '内门弟子修炼 +25% · 灵气 +2/级',
      upgradeCost: { wood: 35, stone: 35, stones: 40 }
    },
    kitchen: {
      id: 'kitchen', name: '膳堂', glyph: '膳', category: 'living',
      desc: '一口大锅，几笼灵米饭。有人掌勺，弟子才吃得安稳。',
      cost: { wood: 25, stone: 20 }, buildDays: 2, maxLevel: 3, slots: 1,
      aura: 0, fengShui: 2, effect: '粮食消耗 -15% · 全体心境 +2/日',
      upgradeCost: { wood: 35, stone: 30 }
    },
    farm: {
      id: 'farm', name: '灵田', glyph: '田', category: 'produce',
      desc: '引山泉灌田，种下灵谷。春种秋收，是宗门最实在的底气。',
      cost: { wood: 12, stone: 6 }, buildDays: 1, maxLevel: 3, slots: 2,
      aura: 0, fengShui: 1, effect: '产出食物 · 受季节影响',
      upgradeCost: { wood: 20, stone: 12 }
    },
    herb: {
      id: 'herb', name: '药圃', glyph: '药', category: 'produce',
      desc: '灵草喜阴，需以竹架遮日。照料得好，一畦可抵半月采药。',
      cost: { wood: 18, stone: 10 }, buildDays: 1, maxLevel: 3, slots: 2,
      aura: 1, fengShui: 2, effect: '产出灵草 · 受季节影响',
      upgradeCost: { wood: 25, stone: 18 }
    },
    alchemy: {
      id: 'alchemy', name: '丹房', glyph: '丹', category: 'produce',
      desc: '丹炉一起，满山都是苦香。火候差一线，便是一炉废渣。',
      cost: { wood: 45, stone: 35, stones: 60 }, buildDays: 3, maxLevel: 3, slots: 1,
      aura: 1, fengShui: 3, effect: '炼制丹药 · 内门弟子效率更高',
      upgradeCost: { wood: 60, stone: 50, stones: 90 }
    },
    library: {
      id: 'library', name: '藏经阁', glyph: '经', category: 'sect',
      desc: '几排旧书架，几卷残经。宗门要走得远，不能只靠一双手。',
      cost: { wood: 55, stone: 45, stones: 80 }, buildDays: 4, maxLevel: 3, slots: 1,
      aura: 2, fengShui: 5, effect: '产出悟道 · 解锁参研',
      upgradeCost: { wood: 70, stone: 60, stones: 120 }
    },
    array: {
      id: 'array', name: '聚灵阵', glyph: '阵', category: 'cultivate',
      desc: '以灵石为眼，引地脉灵气入山。阵纹一亮，满院清风都带灵意。',
      cost: { stone: 30, stones: 120 }, buildDays: 2, maxLevel: 3, slots: 0,
      aura: 4, fengShui: 7, effect: '灵气 +4/级 · 修炼速度提升',
      unlock: 'zhenfa', upgradeCost: { stone: 50, stones: 180 }
    },
    well: {
      id: 'well', name: '灵井', glyph: '井', category: 'living',
      desc: '井水清冽，带一丝地脉凉意。洗衣、煮茶、浇药都用得上。',
      cost: { stone: 20 }, buildDays: 1, maxLevel: 3, slots: 0,
      aura: 1, fengShui: 3, effect: '全体心境 +2/日 · 疗伤',
      upgradeCost: { stone: 30, wood: 15 }
    },
    shrine: {
      id: 'shrine', name: '祠堂', glyph: '祠', category: 'sect',
      desc: '供奉旧宗牌位。香火不断，人心就不散。',
      cost: { wood: 35, stone: 25, stones: 50 }, buildDays: 2, maxLevel: 3, slots: 0,
      aura: 1, fengShui: 5, effect: '声望 +0.2/日 · 全体心境 +1/日',
      upgradeCost: { wood: 50, stone: 40, stones: 80 }
    },
    guest: {
      id: 'guest', name: '客舍', glyph: '客', category: 'sect',
      desc: '给来访散修一个落脚处。人来人往，山中才有人气。',
      cost: { wood: 30, stone: 25 }, buildDays: 2, maxLevel: 3, slots: 0,
      aura: 0, fengShui: 2, effect: '招徒资质提升 · 访客事件增加',
      upgradeCost: { wood: 40, stone: 35 }
    },
    infirmary: {
      id: 'infirmary', name: '药庐', glyph: '庐', category: 'sect',
      desc: '几张竹榻，一柜药材。受了伤的弟子，总得有个地方躺着。',
      cost: { wood: 30, stone: 25, stones: 30 }, buildDays: 2, maxLevel: 3, slots: 1,
      aura: 0, fengShui: 2, effect: '加速疗伤 · 降低重伤风险',
      upgradeCost: { wood: 40, stone: 35, stones: 45 }
    },
    storage: {
      id: 'storage', name: '库房', glyph: '库', category: 'sect',
      desc: '米粮、木石、灵石都堆在这里。门闩越厚，遇袭时损失越少。',
      cost: { wood: 30, stone: 30 }, buildDays: 2, maxLevel: 3, slots: 0,
      aura: 0, fengShui: 1, effect: '遇袭时保护 15% 资源/级',
      upgradeCost: { wood: 40, stone: 45 }
    },
    arena: {
      id: 'arena', name: '演武场', glyph: '武', category: 'cultivate',
      desc: '木桩、石锁与一排旧兵器。剑要磨，人也要磨。',
      cost: { wood: 40, stone: 20 }, buildDays: 2, maxLevel: 3, slots: 2,
      aura: 0, fengShui: 1, effect: '内门弟子战力 +4%/级 · 可在此习武',
      upgradeCost: { wood: 55, stone: 35 }
    },
    pavilion: {
      id: 'pavilion', name: '观景亭', glyph: '亭', category: 'living',
      desc: '几根竹柱，一张石桌。忙里偷闲，看云也是一种修行。',
      cost: { wood: 15, stone: 10 }, buildDays: 1, maxLevel: 3, slots: 0,
      aura: 0, fengShui: 6, effect: '风水 +6/级 · 全体心境 +1/日',
      upgradeCost: { wood: 20, stone: 15 }
    }
  };

  D.BUILD_ORDER = ['meditation', 'dorm', 'farm', 'herb', 'kitchen', 'well', 'alchemy', 'library', 'infirmary', 'arena', 'array', 'shrine', 'guest', 'storage', 'pavilion', 'gate'];

  /* ------------------------------------------------------------------ */
  /* 丹药与丹方                                                         */
  /* ------------------------------------------------------------------ */
  D.PILLS = {
    huichun: {
      id: 'huichun', name: '回春丹', glyph: '春', price: 36, rarity: 1,
      desc: '止血生肌，恢复 40 点气血并减轻伤势。',
      effect: { health: 40, injury: -25 }
    },
    juqi: {
      id: 'juqi', name: '聚气丹', glyph: '气', price: 72, rarity: 1,
      desc: '化开药力，获得当前境界所需修为的 35%。',
      effect: { expPct: 0.35 }
    },
    pojing: {
      id: 'pojing', name: '破境丹', glyph: '破', price: 190, rarity: 2,
      desc: '下一次突破成功率 +25%，失败则药力散去。',
      effect: { breakthrough: 0.25 }
    },
    ningshen: {
      id: 'ningshen', name: '凝神丹', glyph: '神', price: 130, rarity: 2,
      desc: '安神定魄，心境 +25，悟道 +8。',
      effect: { mood: 25, insight: 8 }
    },
    xisui: {
      id: 'xisui', name: '洗髓丹', glyph: '髓', price: 460, rarity: 3,
      desc: '洗经伐髓，永久增加 1 点资质（上限 5）。',
      effect: { aptitude: 1 }
    }
  };

  D.RECIPES = [
    {
      id: 'huichun', name: '回春丹', out: 'huichun', glyph: '春', days: 2,
      mats: { herbs: 2 }, unlock: null, desc: '两株灵草，文火慢炼。'
    },
    {
      id: 'juqi', name: '聚气丹', out: 'juqi', glyph: '气', days: 3,
      mats: { herbs: 2, stones: 10 }, unlock: 'dandao', desc: '灵草为引，灵石为底。'
    },
    {
      id: 'pojing', name: '破境丹', out: 'pojing', glyph: '破', days: 4,
      mats: { herbs: 4, stones: 30 }, unlock: 'dandao', desc: '药性猛烈，火候差一线便会炸炉。'
    },
    {
      id: 'ningshen', name: '凝神丹', out: 'ningshen', glyph: '神', days: 3,
      mats: { herbs: 3, stones: 20 }, unlock: 'yangshen', desc: '清心宁神，最宜突破前服用。'
    },
    {
      id: 'xisui', name: '洗髓丹', out: 'xisui', glyph: '髓', days: 5,
      mats: { herbs: 6, stones: 80 }, unlock: 'xisui', desc: '以灵草洗髓，非丹道高手不能成。'
    }
  ];

  /* ------------------------------------------------------------------ */
  /* 参研                                                               */
  /* ------------------------------------------------------------------ */
  D.RESEARCH = [
    {
      id: 'lingzhi', name: '灵植术', glyph: '植', cost: 25, requires: [],
      desc: '灵田与药圃产量 +20%。',
      effect: 'farm +20% · herb +20%'
    },
    {
      id: 'dandao', name: '丹道初解', glyph: '丹', cost: 45, requires: [],
      desc: '解锁聚气丹与破境丹的丹方。',
      effect: '解锁丹方'
    },
    {
      id: 'zhenfa', name: '聚灵阵图', glyph: '阵', cost: 60, requires: ['lingzhi'],
      desc: '解锁聚灵阵，引地脉灵气入山。',
      effect: '解锁建筑 · 聚灵阵'
    },
    {
      id: 'jianxin', name: '剑心初解', glyph: '剑', cost: 75, requires: ['dandao'],
      desc: '内门弟子战力 +10%。',
      effect: '战力 +10%'
    },
    {
      id: 'yangshen', name: '养神篇', glyph: '神', cost: 90, requires: ['dandao'],
      desc: '全体心境上限 +5，突破成功率 +4%。',
      effect: '心境 · 突破'
    },
    {
      id: 'xisui', name: '洗髓真解', glyph: '髓', cost: 130, requires: ['yangshen'],
      desc: '解锁洗髓丹，可提升弟子资质。',
      effect: '解锁丹方'
    },
    {
      id: 'tianji', name: '天机推演', glyph: '机', cost: 110, requires: ['zhenfa'],
      desc: '历练收益 +20%，坊市价格 -5%。',
      effect: '历练 · 坊市'
    },
    {
      id: 'dadian', name: '大衍道典', glyph: '衍', cost: 220, requires: ['jianxin', 'yangshen'],
      desc: '宗门修炼速度 +25%，可窥大道。',
      effect: '修炼 +25%'
    }
  ];

  /* ------------------------------------------------------------------ */
  /* 历练地点                                                           */
  /* ------------------------------------------------------------------ */
  D.MISSIONS = [
    {
      id: 'backhill', name: '青崖后山', glyph: '崖', danger: 0, days: 2,
      minRealm: 0, minPower: 0, allowOuter: true, color: '#6f8f5e',
      desc: '砍柴、采药、巡山。外门弟子也能去，收益不高，胜在安稳。',
      flavor: '山道熟悉，溪水声一路伴着。',
      rewards: { food: [6, 12], wood: [5, 10], herbs: [1, 3], stones: [0, 12], renown: [0, 1] }
    },
    {
      id: 'luoxia', name: '落霞山', glyph: '霞', danger: 1, days: 3,
      minRealm: 0, minPower: 40, allowOuter: false, color: '#b17a4e',
      desc: '晚霞栖于群峰，山中有灵草，也有饿狼与散修。',
      flavor: '山道湿滑，林间偶有鸟鸣。',
      rewards: { food: [0, 4], wood: [0, 5], herbs: [2, 5], stones: [10, 35], renown: [1, 3] }
    },
    {
      id: 'yunmeng', name: '云梦泽', glyph: '泽', danger: 2, days: 4,
      minRealm: 1, minPower: 110, allowOuter: false, color: '#5f8790',
      desc: '八百里水泽，雾起时连天光都透不下来。',
      flavor: '水面浮着一层薄雾，远处有渔火明灭。',
      rewards: { food: [2, 8], herbs: [4, 8], stones: [30, 70], renown: [2, 5] }
    },
    {
      id: 'wanyao', name: '万妖岭', glyph: '妖', danger: 3, days: 5,
      minRealm: 2, minPower: 280, allowOuter: false, color: '#8c5545',
      desc: '妖气冲天，人族修士若无金丹修为，入岭便是死路。',
      flavor: '风中带着野兽的气味，远处虎啸震得胸口发闷。',
      rewards: { herbs: [5, 10], stones: [60, 140], renown: [4, 8], pills: ['pojing'] }
    },
    {
      id: 'jiuyou', name: '九幽墟', glyph: '幽', danger: 4, days: 7,
      minRealm: 3, minPower: 650, allowOuter: false, color: '#5b526b',
      desc: '上古大战留下的废墟，阴气凝而不散，机缘与凶险并存。',
      flavor: '天色永远是灰的，脚下的土地冷得像一块铁。',
      rewards: { herbs: [8, 16], stones: [120, 260], renown: [7, 12], pills: ['xisui', 'pojing'] }
    }
  ];

  /* ------------------------------------------------------------------ */
  /* 宗门品阶 / 招募 / 杂项                                             */
  /* ------------------------------------------------------------------ */
  D.SECT_GRADES = [
    { name: '荒山小门', min: 0, color: '#7d7565', desc: '几间茅屋，一口旧钟。' },
    { name: '三流宗门', min: 30, color: '#6f8f5e', desc: '山下已有人知道青崖山的名号。' },
    { name: '二流宗门', min: 90, color: '#4e7c78', desc: '有客来访，有商队愿意绕路。' },
    { name: '一流宗门', min: 220, color: '#9b7a41', desc: '一方仙门，弟子出门也有人礼让三分。' },
    { name: '天下名门', min: 450, color: '#a35b4a', desc: '钟声响时，方圆百里的修士都听得见。' },
    { name: '仙道圣地', min: 800, color: '#7b5f84', desc: '云海之上，山门自开。' }
  ];

  D.SURNAMES = ['沈', '谢', '陆', '顾', '叶', '温', '苏', '江', '宁', '白', '段', '裴', '宋', '楚', '卫', '秦', '柳', '孟', '许', '韩'];
  D.GIVEN_NAMES = ['未央', '长风', '问道', '听雪', '归尘', '青玄', '照夜', '星河', '无咎', '怀瑾', '渡舟', '知微', '含章', '望舒', '拾光', '澄心', '一苇', '子墨', '昭昭', '行止', '阿禾', '小满', '石头', '青萝', '听澜', '不言', '云生', '半山', '见素', '南枝'];

  D.SECT_NAMES = ['青崖宗', '听雪门', '归云观', '问剑山', '长生谷', '栖霞宗', '不夜楼', '煮石斋'];
  D.SECT_SUFFIXES = ['宗', '门', '观', '谷', '山', '楼', '斋'];

  D.TIPS = [
    '外门弟子负责劳作，内门弟子专心修炼。资历够了，外门也可晋升内门。',
    '灵田与药圃受季节影响。冬天之前，记得多囤一些粮食。',
    '静室、聚灵阵与风水都会影响修炼速度。建筑不是越多越好，布局也重要。',
    '藏经阁产出悟道，可用于参研。丹房能把灵草炼成丹药。',
    '历练可以带回灵石、灵草与声望，但受伤的弟子需要药庐休养。',
    '声望决定宗门品阶。品阶越高，来访的散修与商队越多。',
    '弟子若长期饥饿、疲惫或受伤，会拖慢修炼。膳堂、灵井与观景亭都有帮助。',
    '掌门若遭遇不测，山门会暂停，需要你从弟子中手动另立掌门。'
  ];

  D.STORY = {
    start: '旧宗覆灭那夜，你只抢出半卷《青崖经》和一口旧钟。几个月后，你在青崖山立起山门，收了几个弟子。山下的路很长，山上的日子很慢。',
    grade: '山门初立，百废待兴。先让弟子们吃上一口热饭，再把修炼的地方收拾出来。',
    ascension: '钟声九响，云海让开一条路。你回头看了一眼青崖山，山门里的灯还亮着。'
  };

  D.BATTLE_FLAVOR = {
    win: ['剑光落下，山风忽然安静。', '最后一击之后，林中只剩鸟鸣。', '敌人退去，弟子们扶着剑，笑得有些狼狈。'],
    lose: ['阵脚一乱，众人且战且退。', '山门外留下一地血迹，好在人都还在。', '这一仗打得很苦，回去要好好养伤了。']
  };

  D.UI = {
    nav: [
      { id: 'sect', label: '宗门', glyph: '宗' },
      { id: 'disciples', label: '弟子', glyph: '徒' },
      { id: 'build', label: '营造', glyph: '造' },
      { id: 'affairs', label: '事务', glyph: '事' },
      { id: 'market', label: '坊市', glyph: '市' }
    ]
  };

  D.RESOURCES = {
    stones: { id: 'stones', name: '灵石', glyph: '石', color: '#6d8796' },
    food: { id: 'food', name: '食物', glyph: '食', color: '#a9854e' },
    wood: { id: 'wood', name: '木材', glyph: '木', color: '#6f8f5e' },
    stone: { id: 'stone', name: '石料', glyph: '岩', color: '#8a8478' },
    herbs: { id: 'herbs', name: '灵草', glyph: '草', color: '#7b8f55' },
    renown: { id: 'renown', name: '声望', glyph: '望', color: '#a35b4a' }
  };

  global.SectData = D;
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(typeof window !== 'undefined' ? window : globalThis);
