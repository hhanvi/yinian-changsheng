/*
 * 一念长生 · 游戏数据
 * 所有文案、数值与事件均原创编写；玩法参考了开源文字修仙游戏的常见设计。
 */
(function () {
  'use strict';

  var Data = {};

  Data.VERSION = 1;
  Data.SAVE_KEY = 'yinian_changsheng_save_v1';
  Data.META_KEY = 'yinian_changsheng_meta_v1';

  Data.TITLE = '一念长生';
  Data.SUBTITLE = '一念起，万水千山';
  Data.TAGLINE = '一款写在掌心里的文字修仙游戏';

  Data.QUOTES = [
    '大道无形，生育天地；大道无情，运行日月。',
    '朝闻道，夕死可矣。',
    '心若冰清，天塌不惊。',
    '我命由我不由天。',
    '凡有所相，皆是虚妄。',
    '长生路远，且行且悟。'
  ];

  Data.SURNAMES = ['沈', '顾', '陆', '苏', '谢', '云', '叶', '林', '楚', '江', '温', '裴', '萧', '白', '秦', '姜', '许', '宋', '闻', '宁'];
  Data.GIVEN_NAMES = ['未央', '长风', '问道', '听雪', '归尘', '青玄', '照夜', '星河', '无咎', '怀瑾', '渡舟', '知微', '含章', '望舒', '拾光', '澄心', '一苇', '子墨', '昭昭', '行止'];

  Data.ROOTS = {
    metal: {
      key: 'metal', name: '金灵根', glyph: '金', element: '金',
      desc: '庚金锐利，天生适合杀伐之道。剑修多出于此。',
      bonusText: '攻击 +6% · 暴击 +3% · 修炼 +2%',
      mods: { atkPct: 0.06, crit: 0.03, cult: 0.02 }
    },
    wood: {
      key: 'wood', name: '木灵根', glyph: '木', element: '木',
      desc: '乙木生生不息，气血绵长，最善疗愈与持久。',
      bonusText: '气血 +8% · 疗伤 +15% · 修炼 +3%',
      mods: { hpPct: 0.08, heal: 0.15, cult: 0.03 }
    },
    water: {
      key: 'water', name: '水灵根', glyph: '水', element: '水',
      desc: '上善若水，神识澄澈，修行时更容易入定。',
      bonusText: '灵力 +12% · 神识 +8% · 修炼 +4%',
      mods: { mpPct: 0.12, sensePct: 0.08, cult: 0.04 }
    },
    fire: {
      key: 'fire', name: '火灵根', glyph: '火', element: '火',
      desc: '离火焚天，性烈而直。于丹道一途别有天赋。',
      bonusText: '攻击 +5% · 炼丹 +15% · 修炼 +4%',
      mods: { atkPct: 0.05, alchemy: 0.15, cult: 0.04 }
    },
    earth: {
      key: 'earth', name: '土灵根', glyph: '土', element: '土',
      desc: '厚土载物，根基沉稳，最不易走火入魔。',
      bonusText: '防御 +10% · 气血 +6% · 修炼 +2%',
      mods: { defPct: 0.10, hpPct: 0.06, cult: 0.02 }
    }
  };

  Data.ORIGINS = {
    orphan: {
      key: 'orphan', name: '山野遗孤', glyph: '孤',
      desc: '你在山野间长大，风餐露宿，却也因此筋骨强健、心性坚韧。',
      bonusText: '气血 +20 · 气运 +3 · 初始灵石 20',
      mods: { hp: 20, luck: 3, cult: 0.02 },
      stones: 20,
      items: [{ id: 'huichun', qty: 1 }]
    },
    clan: {
      key: 'clan', name: '没落世家', glyph: '家',
      desc: '祖上曾出过金丹修士，如今家道中落，只余几卷残书与一口旧剑。',
      bonusText: '悟性 +2 · 初始灵石 150 · 聚气丹 ×2',
      mods: { comp: 2, atk: 1 },
      stones: 150,
      items: [{ id: 'juqi', qty: 2 }]
    },
    herb: {
      key: 'herb', name: '药庐学徒', glyph: '药',
      desc: '你自幼在药炉边长大，识得百草，也见过太多生死。',
      bonusText: '悟性 +1 · 疗伤 +10% · 回春丹 ×3 · 灵草 ×2',
      mods: { comp: 1, heal: 0.1 },
      stones: 60,
      items: [{ id: 'huichun', qty: 3 }, { id: 'lingcao', qty: 2 }]
    }
  };

  Data.DAOHEARTS = {
    longevity: {
      key: 'longevity', name: '求道长生', glyph: '道',
      desc: '你只求活得久些，走得远些。寿元与修为，便是全部。',
      bonusText: '寿元 +25 年 · 修炼 +4%',
      mods: { life: 25, cult: 0.04 }
    },
    sword: {
      key: 'sword', name: '问剑于心', glyph: '剑',
      desc: '世间不平事，一剑破之。你信奉力量，也享受战斗。',
      bonusText: '攻击 +8% · 暴击 +4% · 战斗奖励 +10%',
      mods: { atkPct: 0.08, crit: 0.04, battleReward: 0.1 }
    },
    mercy: {
      key: 'mercy', name: '济世苍生', glyph: '仁',
      desc: '修行不是离群索居。你愿意为陌生人停一停脚步。',
      bonusText: '气运 +4 · 疗伤 +20%',
      mods: { luck: 4, heal: 0.2 }
    }
  };

  /*
   * 境界：每个大境界的层数与基础需求。
   * mult 为大境界突破时的属性乘数，life 为增加的寿元。
   */
  Data.REALMS = [
    { name: '炼气期', short: '炼气', layers: 9, baseNeed: 60, mult: 1.00, life: 6, flat: { hp: 8, mp: 4, atk: 1, def: 0.6, sense: 0.5, comp: 0.2 } },
    { name: '筑基期', short: '筑基', layers: 4, baseNeed: 360, mult: 1.48, life: 30, flat: { hp: 35, mp: 18, atk: 4, def: 2.5, sense: 2.5, comp: 0.8 } },
    { name: '金丹期', short: '金丹', layers: 4, baseNeed: 1600, mult: 1.54, life: 80, flat: { hp: 120, mp: 60, atk: 12, def: 8, sense: 8, comp: 1.5 } },
    { name: '元婴期', short: '元婴', layers: 4, baseNeed: 7200, mult: 1.60, life: 200, flat: { hp: 420, mp: 200, atk: 38, def: 24, sense: 24, comp: 2.5 } },
    { name: '化神期', short: '化神', layers: 4, baseNeed: 30000, mult: 1.66, life: 500, flat: { hp: 1400, mp: 650, atk: 120, def: 75, sense: 75, comp: 4 } },
    { name: '炼虚期', short: '炼虚', layers: 4, baseNeed: 120000, mult: 1.72, life: 1000, flat: { hp: 4600, mp: 2100, atk: 380, def: 240, sense: 240, comp: 6 } },
    { name: '合体期', short: '合体', layers: 4, baseNeed: 450000, mult: 1.78, life: 2000, flat: { hp: 15000, mp: 6800, atk: 1200, def: 760, sense: 760, comp: 9 } },
    { name: '大乘期', short: '大乘', layers: 4, baseNeed: 1600000, mult: 1.84, life: 5000, flat: { hp: 48000, mp: 22000, atk: 3800, def: 2400, sense: 2400, comp: 13 } },
    { name: '渡劫期', short: '渡劫', layers: 4, baseNeed: 5200000, mult: 1.92, life: 10000, flat: { hp: 150000, mp: 70000, atk: 12000, def: 7600, sense: 7600, comp: 18 } },
    { name: '飞升', short: '飞升', layers: 1, baseNeed: 1, mult: 1, life: 0, flat: { hp: 0, mp: 0, atk: 0, def: 0, sense: 0, comp: 0 } }
  ];

  Data.LAYER_LABELS = {
    9: ['一层', '二层', '三层', '四层', '五层', '六层', '七层', '八层', '九层'],
    4: ['初期', '中期', '后期', '圆满'],
    1: ['']
  };

  Data.ITEMS = {
    /* ---------- 丹药 ---------- */
    juqi: {
      id: 'juqi', name: '聚气丹', type: 'pill', rarity: 1, price: 45, glyph: '气',
      desc: '服用后获得当前境界 25% 修为。',
      effect: { type: 'exp', value: 0.25 }
    },
    huichun: {
      id: 'huichun', name: '回春丹', type: 'pill', rarity: 1, price: 30, glyph: '春',
      desc: '恢复 35% 气血。战斗中亦可服用。',
      effect: { type: 'heal', value: 0.35 }
    },
    huiling: {
      id: 'huiling', name: '回灵丹', type: 'pill', rarity: 1, price: 35, glyph: '灵',
      desc: '恢复 50% 灵力。',
      effect: { type: 'mana', value: 0.5 }
    },
    ningshen: {
      id: 'ningshen', name: '凝神丹', type: 'pill', rarity: 2, price: 480, glyph: '神',
      desc: '永久增加 1 点神识。神识越高，术法越强，也越容易看破虚妄。',
      effect: { type: 'perm', stat: 'sense', value: 1 }
    },
    pojing: {
      id: 'pojing', name: '破境丹', type: 'pill', rarity: 2, price: 240, glyph: '破',
      desc: '下一次突破成功率 +25%。',
      effect: { type: 'breakthrough', value: 0.25 }
    },
    xisui: {
      id: 'xisui', name: '洗髓丹', type: 'pill', rarity: 3, price: 1200, glyph: '髓',
      desc: '洗经伐髓，永久增加 1 点悟性。',
      effect: { type: 'perm', stat: 'comp', value: 1 }
    },
    huiyuan: {
      id: 'huiyuan', name: '培元丹', type: 'pill', rarity: 3, price: 1400, glyph: '元',
      desc: '固本培元，永久增加 1 点气运。',
      effect: { type: 'perm', stat: 'luck', value: 1 }
    },
    dahuandan: {
      id: 'dahuandan', name: '大还丹', type: 'pill', rarity: 3, price: 320, glyph: '还',
      desc: '恢复全部气血与一半灵力。生死关头的一线生机。',
      effect: { type: 'fullHeal', value: 0.5 }
    },

    /* ---------- 材料 ---------- */
    lingcao: { id: 'lingcao', name: '灵草', type: 'material', rarity: 1, price: 18, glyph: '草', desc: '山野间常见的炼丹材料，叶脉中藏着一丝灵气。' },
    lingquan: { id: 'lingquan', name: '灵泉水', type: 'material', rarity: 1, price: 30, glyph: '泉', desc: '蕴含灵气的泉水，可入丹，也可直接饮用。' },
    fulu: { id: 'fulu', name: '符纸', type: 'material', rarity: 1, price: 45, glyph: '符', desc: '画着粗浅符文的黄纸，驱邪避瘴有些用处。' },
    leijimu: { id: 'leijimu', name: '雷击木', type: 'material', rarity: 2, price: 160, glyph: '雷', desc: '被天雷劈中却未成灰的古木，内里仍藏着雷意。' },
    jiaolin: { id: 'jiaolin', name: '蛟鳞', type: 'material', rarity: 3, price: 320, glyph: '鳞', desc: '蛟龙褪下的鳞片，坚硬如铁，隐有云气。' },
    qinglian: { id: 'qinglian', name: '青莲', type: 'material', rarity: 3, price: 400, glyph: '莲', desc: '并蒂而生的青莲，清香可安神定魄。' },
    yaodan: { id: 'yaodan', name: '妖丹', type: 'material', rarity: 3, price: 500, glyph: '丹', desc: '大妖毕生精华所凝，腥甜中藏着磅礴妖力。' },
    yaogu: { id: 'yaogu', name: '妖骨', type: 'material', rarity: 2, price: 220, glyph: '骨', desc: '妖兽遗骨，质地温润，是炼器与炼丹的好材料。' },
    mihunhua: { id: 'mihunhua', name: '迷魂花', type: 'material', rarity: 2, price: 260, glyph: '花', desc: '紫瓣黄蕊，香气能勾动心底最深的执念。' },
    xueteng: { id: 'xueteng', name: '血藤', type: 'material', rarity: 2, price: 180, glyph: '藤', desc: '以精血为食的妖藤，断口处仍有暗红汁液。' },
    tongling: { id: 'tongling', name: '古铜铃', type: 'material', rarity: 1, price: 90, glyph: '铃', desc: '锈迹斑斑的铜铃，摇动时声音却清越异常。' },
    yinhundeng: { id: 'yinhundeng', name: '引魂灯', type: 'material', rarity: 2, price: 150, glyph: '灯', desc: '灯芯是幽蓝色的冷火，照不亮活人的路。' },
    yujian: { id: 'yujian', name: '古玉简', type: 'material', rarity: 3, price: 300, glyph: '简', desc: '一枚温润玉简，里面似乎封存着某位前辈的只言片语。' },

    /* ---------- 兵器 ---------- */
    qingfeng: { id: 'qingfeng', name: '青锋剑', type: 'equip', slot: 'weapon', rarity: 1, price: 180, glyph: '剑', desc: '凡铁所铸，剑身泛着淡淡青光。', mods: { atkPct: 0.10 } },
    xuantie: { id: 'xuantie', name: '玄铁重剑', type: 'equip', slot: 'weapon', rarity: 2, price: 700, glyph: '剑', desc: '重逾百斤，无锋无刃，却能压碎一切花哨。', mods: { atkPct: 0.20, defPct: 0.05 } },
    chixiao: { id: 'chixiao', name: '赤霄剑', type: 'equip', slot: 'weapon', rarity: 3, price: 2600, glyph: '剑', desc: '剑出如赤霞贯日，剑身上有细密雷纹。', mods: { atkPct: 0.34, crit: 0.05 } },
    zhuxian: { id: 'zhuxian', name: '诛仙古剑', type: 'equip', slot: 'weapon', rarity: 4, price: 12000, glyph: '剑', desc: '不知斩过多少仙神，剑意至今未散。', mods: { atkPct: 0.52, crit: 0.08 } },
    duanjian: { id: 'duanjian', name: '无锋断剑', type: 'equip', slot: 'weapon', rarity: 2, price: 900, glyph: '剑', desc: '一柄断去半截的古剑，剑意却比许多完整的名剑更盛。', mods: { atkPct: 0.18, compPct: 0.08 } },

    /* ---------- 护身 ---------- */
    bufu: { id: 'bufu', name: '粗布道袍', type: 'equip', slot: 'armor', rarity: 1, price: 140, glyph: '衣', desc: '浆洗得发白的旧道袍，胜在轻便。', mods: { defPct: 0.08, hpPct: 0.05 } },
    xuangui: { id: 'xuangui', name: '玄龟甲', type: 'equip', slot: 'armor', rarity: 2, price: 600, glyph: '甲', desc: '以玄龟背甲打磨而成，沉重却可靠。', mods: { defPct: 0.16, hpPct: 0.12 } },
    yunwen: { id: 'yunwen', name: '云纹法衣', type: 'equip', slot: 'armor', rarity: 3, price: 2400, glyph: '衣', desc: '云锦织就，水火不侵，行走时衣袂间有云气流转。', mods: { defPct: 0.26, mpPct: 0.18 } },
    xingchen: { id: 'xingchen', name: '星辰战甲', type: 'equip', slot: 'armor', rarity: 4, price: 11000, glyph: '甲', desc: '甲片上嵌着真正的星砂，夜里会自行发亮。', mods: { defPct: 0.42, hpPct: 0.35 } },

    /* ---------- 灵饰 ---------- */
    qingxin: { id: 'qingxin', name: '清心玉佩', type: 'equip', slot: 'accessory', rarity: 1, price: 200, glyph: '玉', desc: '触手生凉，佩之心神安定。', mods: { compPct: 0.10, cult: 0.03 } },
    juling: { id: 'juling', name: '聚灵珠', type: 'equip', slot: 'accessory', rarity: 2, price: 800, glyph: '珠', desc: '珠内自成一方小天地，日夜汇聚灵气。', mods: { cult: 0.07, mpPct: 0.10 } },
    taiyin: { id: 'taiyin', name: '太阴珠', type: 'equip', slot: 'accessory', rarity: 3, price: 2800, glyph: '月', desc: '月华凝成的珠子，握在手中能听见潮汐。', mods: { sensePct: 0.22, mpPct: 0.15 } },
    qiankun: { id: 'qiankun', name: '乾坤戒', type: 'equip', slot: 'accessory', rarity: 4, price: 13000, glyph: '戒', desc: '戒中藏着一方残破的小世界，气运自生。', mods: { cult: 0.10, luck: 8 } }
  };

  Data.TECHNIQUES = {
    yinqi: {
      id: 'yinqi', name: '引气诀', rarity: 0, price: 0, glyph: '引',
      desc: '最粗浅的吐纳法门，却是万法之基。',
      cult: 0.05, mods: {}, skill: 'jianqi'
    },
    qingmu: {
      id: 'qingmu', name: '青木长生功', rarity: 1, price: 500, glyph: '木',
      desc: '以木行灵气温养经脉，气血悠长，疗伤事半功倍。',
      cult: 0.12, mods: { hpPct: 0.08, heal: 0.10 }, skill: 'huichun'
    },
    xuanshui: {
      id: 'xuanshui', name: '玄水凝神篇', rarity: 1, price: 520, glyph: '水',
      desc: '心若止水，神识澄明，最能看破幻术。',
      cult: 0.14, mods: { mpPct: 0.12, sensePct: 0.06 }, skill: 'shuimu'
    },
    fenyu: {
      id: 'fenyu', name: '焚天赤炎诀', rarity: 1, price: 550, glyph: '火',
      desc: '以心火引动真火，攻伐凌厉，却也最耗灵力。',
      cult: 0.16, mods: { atkPct: 0.10 }, skill: 'lieyan'
    },
    houtu: {
      id: 'houtu', name: '厚土不动经', rarity: 1, price: 480, glyph: '土',
      desc: '如山如岳，八风不动，最善守御。',
      cult: 0.12, mods: { defPct: 0.14, hpPct: 0.08 }, skill: 'jingang'
    },
    taixu: {
      id: 'taixu', name: '太虚剑典', rarity: 2, price: 2600, glyph: '剑',
      desc: '剑意不在剑上，而在天地之间。一剑既出，万法皆空。',
      cult: 0.26, mods: { atkPct: 0.16, sensePct: 0.10, crit: 0.03 }, skill: 'taixu'
    },
    jiuzhuan: {
      id: 'jiuzhuan', name: '九转金丹诀', rarity: 2, price: 2800, glyph: '丹',
      desc: '九转成丹，肉身与神魂同修，是极正统的金丹大道。',
      cult: 0.28, mods: { hpPct: 0.22, compPct: 0.10 }, skill: 'jiuzhuan'
    },
    daxu: {
      id: 'daxu', name: '大衍神通', rarity: 3, price: 12000, glyph: '衍',
      desc: '推演天机，衍化万法。传说修至极致，可改天换命。',
      cult: 0.42, mods: { atkPct: 0.15, defPct: 0.15, hpPct: 0.15, mpPct: 0.15, sensePct: 0.15 }, skill: 'daxu'
    }
  };

  Data.SKILLS = {
    jianqi: { name: '剑气斩', cost: 12, type: 'damage', power: 1.7, desc: '凝气成刃，斩向敌人。' },
    huichun: { name: '回春术', cost: 16, type: 'heal', power: 0.30, desc: '木行灵气流转，恢复三成气血。' },
    shuimu: { name: '水幕天华', cost: 14, type: 'shield', power: 0.35, desc: '化水为幕，抵挡下一次伤害。' },
    lieyan: { name: '烈焰焚天', cost: 20, type: 'damage', power: 2.3, desc: '真火自掌心涌出，焚尽眼前之敌。' },
    jingang: { name: '金刚护体', cost: 16, type: 'shield', power: 0.45, desc: '土行灵气覆体，坚如磐石。' },
    taixu: { name: '太虚剑意', cost: 26, type: 'damage', power: 2.8, crit: 0.15, desc: '剑意无形，直斩神魂。' },
    jiuzhuan: { name: '九转还丹', cost: 30, type: 'heal', power: 0.50, desc: '金丹转动，生死人肉白骨。' },
    daxu: { name: '大衍灭', cost: 40, type: 'damage', power: 3.6, desc: '一指点出，万法归寂。' }
  };

  /* 敌人系数均相对于玩家当前属性，保证任何境界都有来有回。 */
  Data.ENEMIES = {
    bat: { name: '赤目蝠妖', glyph: '蝠', hp: 0.35, atk: 0.66, def: 0.10, exp: 0.20, stones: 12, desc: '双目赤红，翼展如席，喜食人血。', drops: [{ id: 'lingcao', chance: 0.2 }] },
    wolf: { name: '灰背妖狼', glyph: '狼', hp: 0.45, atk: 0.78, def: 0.15, exp: 0.26, stones: 20, desc: '背毛如针，獠牙间挂着涎水。', drops: [{ id: 'lingcao', chance: 0.3 }] },
    snake: { name: '青鳞蛇妖', glyph: '蛇', hp: 0.40, atk: 0.85, def: 0.12, exp: 0.25, stones: 22, desc: '鳞片泛着幽光，吐信声细如耳语。', drops: [{ id: 'lingcao', chance: 0.35 }] },
    rogue: { name: '黑风邪修', glyph: '邪', hp: 0.52, atk: 0.80, def: 0.20, exp: 0.30, stones: 30, desc: '满身血腥气，眼中只剩贪婪。', drops: [{ id: 'fulu', chance: 0.3 }] },
    swordsman: { name: '游方剑客', glyph: '客', hp: 0.45, atk: 0.92, def: 0.25, exp: 0.30, stones: 28, desc: '剑法轻灵，出手却极有分寸。', drops: [] },
    hunter: { name: '猎妖人', glyph: '猎', hp: 0.62, atk: 0.92, def: 0.28, exp: 0.40, stones: 55, desc: '腰间挂满妖丹与锁链，眼神比刀还冷。', drops: [{ id: 'yaogu', chance: 0.3 }] },
    waterghost: { name: '水鬼', glyph: '鬼', hp: 0.55, atk: 0.86, def: 0.20, exp: 0.32, stones: 35, desc: '湿漉漉的长发遮住脸，指甲泛着青黑。', drops: [{ id: 'lingquan', chance: 0.35 }] },
    eel: { name: '电鳗妖', glyph: '鳗', hp: 0.50, atk: 1.00, def: 0.15, exp: 0.35, stones: 40, desc: '周身电光噼啪作响，水中快如闪电。', drops: [{ id: 'lingquan', chance: 0.3 }] },
    croc: { name: '铁甲鳄', glyph: '鳄', hp: 0.78, atk: 0.86, def: 0.42, exp: 0.42, stones: 55, desc: '甲皮刀枪难入，一张口便是腥风。', drops: [{ id: 'jiaolin', chance: 0.08 }] },
    tiger: { name: '黑风虎妖', glyph: '虎', hp: 0.80, atk: 1.05, def: 0.30, exp: 0.48, stones: 70, desc: '金瞳如灯，一啸便卷起满地碎石。', drops: [{ id: 'yaogu', chance: 0.35 }] },
    boademon: { name: '披甲妖将', glyph: '妖', hp: 0.72, atk: 0.96, def: 0.36, exp: 0.45, stones: 65, desc: '不知名的妖将，甲胄下露出森森白骨。', drops: [{ id: 'yaodan', chance: 0.15 }, { id: 'yaogu', chance: 0.3 }] },
    foxdemon: { name: '媚狐', glyph: '狐', hp: 0.55, atk: 0.90, def: 0.20, exp: 0.40, stones: 60, desc: '九条尾巴在身后轻轻摆动，笑意不达眼底。', drops: [{ id: 'mihunhua', chance: 0.4 }] },
    corpse: { name: '九幽尸傀', glyph: '尸', hp: 0.92, atk: 1.00, def: 0.45, exp: 0.60, stones: 90, desc: '皮肉干枯，动作却快得不可思议。', drops: [{ id: 'yinhundeng', chance: 0.25 }] },
    demon: { name: '血袍魔修', glyph: '魔', hp: 1.00, atk: 1.15, def: 0.40, exp: 0.70, stones: 120, desc: '血袍无风自动，脚下影子比常人多出一截。', drops: [{ id: 'yaodan', chance: 0.4 }, { id: 'xisui', chance: 0.08 }] },
    dragon: { name: '幽冥蛟', glyph: '蛟', hp: 1.40, atk: 1.20, def: 0.55, exp: 0.90, stones: 180, desc: '半龙半蛇，周身缠绕着九幽寒气。', drops: [{ id: 'jiaolin', chance: 0.8 }], boss: true },
    tianjie: { name: '九霄雷劫', glyph: '劫', hp: 1.35, atk: 1.10, def: 0.35, exp: 0, stones: 0, desc: '九重天雷化作人形，雷光中似有天道无情地俯视着你。', drops: [], boss: true, tribulation: true }
  };

  Data.REGIONS = [
    {
      id: 'luoxia', name: '落霞山', tier: 0, unlockRealm: 0, cost: 1, danger: 1,
      glyph: '霞', desc: '晚霞栖于群峰，山中有灵草，也有饿狼与散修。',
      flavor: '山道湿滑，林间偶有鸟鸣。'
    },
    {
      id: 'yunmeng', name: '云梦泽', tier: 1, unlockRealm: 1, cost: 2, danger: 2,
      glyph: '泽', desc: '八百里水泽，雾起时连天光都透不下来。',
      flavor: '水面浮着一层薄雾，远处有渔火明灭。'
    },
    {
      id: 'wanyao', name: '万妖岭', tier: 2, unlockRealm: 2, cost: 2, danger: 3,
      glyph: '妖', desc: '妖气冲天，人族修士若无筑基修为，入岭便是死路。',
      flavor: '风中带着野兽的气味，远处的虎啸震得人胸口发闷。'
    },
    {
      id: 'jiuyou', name: '九幽墟', tier: 3, unlockRealm: 3, cost: 3, danger: 4,
      glyph: '幽', desc: '上古大战留下的废墟，阴气凝而不散，机缘与凶险并存。',
      flavor: '天色永远是灰的，脚下的土地冷得像一块铁。'
    }
  ];

  /*
   * 事件结构：
   * choices[].outcome 直接结算；choices[].check 为属性检定，分 success / fail。
   * outcome 字段：text, exp(当前所需修为比例), stones(按境界缩放), stonesPct,
   * hp/mp(最大値比例), items, stats(永久基础属性), mods(永久百分比),
   * combat(敌人id), technique(习得功法), flag。
   */
  Data.EVENTS = [
    /* ================= 落霞山 ================= */
    {
      id: 'luoxia_rain', region: 'luoxia', name: '山雨欲来', weight: 10,
      text: '暮色压山，急雨敲叶。你躲进崖壁下一处藤蔓遮掩的浅洞，洞内腥风若有若无，深处似有赤光一闪。',
      choices: [
        { label: '循着赤光入洞', hint: '或有凶险，也可能有收获', outcome: { text: '你拨开藤蔓，惊起一片赤目蝠妖。', combat: 'bat' } },
        { label: '在洞口打坐避雨', hint: '稳妥', outcome: { text: '雨声渐密，你收束心神，竟比平日更快入定。', exp: 0.16, hp: 0.12 } },
        { label: '冒雨赶路', outcome: { text: '你顶着山雨走了半夜，虽狼狈，却在泥泞中捡到几块碎灵石。', stones: 6, hp: -0.04 } }
      ]
    },
    {
      id: 'luoxia_herb', region: 'luoxia', name: '崖畔灵草', weight: 11,
      text: '一株三叶灵草生在崖缝里，叶脉泛着银光。你正要伸手，草丛中传来细碎的鳞响。',
      choices: [
        {
          label: '连根采下', hint: '神识检定', check: { stat: 'sense', dc: 8 },
          success: { text: '你看准时机，在蛇妖扑出前将灵草连根拔起，顺势退开三步。', items: [{ id: 'lingcao', qty: 2 }], exp: 0.15 },
          fail: { text: '指尖刚碰到草叶，一条青鳞蛇妖便从石缝中弹射而出。', hp: -0.12, combat: 'snake' }
        },
        { label: '只摘两片叶子', outcome: { text: '你只取了两片叶尖，留下根茎。草木有灵，来年或还能再长。', items: [{ id: 'lingcao', qty: 1 }], exp: 0.08 } },
        { label: '记下位置，不动它', outcome: { text: '你记下此处方位，转身离去。有些机缘，急不得。', exp: 0.12 } }
      ]
    },
    {
      id: 'luoxia_fox', region: 'luoxia', name: '白狐求救', weight: 8,
      text: '一只白狐被兽夹咬住后腿，见你靠近，眼中竟有几分人色。它没有挣扎，只是安静地看着你。',
      choices: [
        { label: '替它解开兽夹，敷上药', outcome: { text: '白狐舔了舔你的手背，一瘸一拐地没入林中。你忽然觉得，今日的山风都柔和了些。', stats: { luck: 1 }, hp: -0.04, flag: 'fox_friend' } },
        { label: '剥下狐皮', outcome: { text: '你得到一张完整的白狐皮。下山时，你总觉得背后有视线跟着。', stones: 55, stats: { luck: -1 } } },
        { label: '转身离开', outcome: { text: '你走出很远，仍能听见身后细弱的呜咽。', hp: -0.01 } }
      ]
    },
    {
      id: 'luoxia_rogue', region: 'luoxia', name: '黑风邪修', weight: 10,
      text: '山道转折处，一个面色青灰的散修拦住去路。他袖口沾着未干的血，目光在你腰间储物袋上停了停。',
      choices: [
        { label: '拔剑', hint: '一场恶战', outcome: { text: '你没有废话，剑锋出鞘的瞬间，对方也祭出了一面黑幡。', combat: 'rogue' } },
        { label: '破财消灾', outcome: { text: '你丢出一袋灵石，对方掂了掂，冷笑着让开路。', stonesPct: -0.18 } },
        {
          label: '自称宗门执事，诈他一诈', hint: '悟性检定', check: { stat: 'comp', dc: 9 },
          success: { text: '你负手而立，随口报出一个大宗名号。对方脸色数变，终究拱手退去。', exp: 0.12 },
          fail: { text: '对方眯眼看了你片刻，忽然狞笑：“执事大人，怎的连护身法器都没有？”', stonesPct: -0.15, hp: -0.08, combat: 'rogue' }
        }
      ]
    },
    {
      id: 'luoxia_temple', region: 'luoxia', name: '荒庙残壁', weight: 9,
      text: '雨雾中一座荒废道观，殿内三清像早已斑驳。壁画上有一道人挥剑斩开云海的残影，剑意隔着岁月仍觉锋锐。',
      choices: [
        {
          label: '静心参悟壁画', hint: '悟性检定', check: { stat: 'comp', dc: 9 },
          success: { text: '你盯着那道剑痕，忽觉识海一声轻响，仿佛有什么东西松动了。', exp: 0.55 },
          fail: { text: '你越看越觉得那剑意深不可测，心神被牵动，喉头一甜。', hp: -0.10, exp: 0.12 }
        },
        { label: '搜寻香案', outcome: { text: '香案下压着几张符纸，虽已泛黄，符文倒还完整。', stones: 30, items: [{ id: 'fulu', qty: 1 }] } },
        { label: '上香一拜', outcome: { text: '你点燃三炷残香，郑重一拜。殿内阴冷的气息似乎散了些。', hp: 0.18, exp: 0.10 } }
      ]
    },
    {
      id: 'luoxia_hunter', region: 'luoxia', name: '樵夫呼救', weight: 9,
      text: '林间传来呼救。一个樵夫拖着伤腿，身后跟着一头灰背妖狼。他看见你，眼里迸出光来。',
      choices: [
        { label: '挡在樵夫身前', outcome: { text: '你横剑而立。妖狼围着你转了两圈，猛地扑了上来。', combat: 'wolf' } },
        {
          label: '抱起樵夫就跑', hint: '神识检定', check: { stat: 'sense', dc: 8 },
          success: { text: '你熟悉山路，专挑狭窄处钻，妖狼追了半里便放弃了。樵夫千恩万谢，硬塞给你一袋灵石。', hp: -0.05, stones: 25, exp: 0.12 },
          fail: { text: '你脚下一滑，妖狼扑上来撕开你的肩头。你忍痛把樵夫推下山道，回身拔剑。', hp: -0.14, combat: 'wolf' }
        },
        { label: '悄悄退走', outcome: { text: '你退入林中，呼救声很快被风声吞没。', hp: 0 } }
      ]
    },
    {
      id: 'luoxia_spring', region: 'luoxia', name: '石隙清泉', weight: 8,
      text: '一汪清泉从石隙里涌出来，水面浮着淡淡灵气，映出你的脸。泉边生着几丛不知名的野花。',
      choices: [
        { label: '掬水而饮', outcome: { text: '泉水入喉，一股清凉游遍四肢百骸，连日赶路的疲惫一扫而空。', hp: 0.35, mp: 0.25 } },
        { label: '用玉瓶盛满', outcome: { text: '你灌满一瓶灵泉，又洗了把脸，才依依不舍地离开。', items: [{ id: 'lingquan', qty: 1 }] } },
        { label: '在泉边磨剑', outcome: { text: '你以泉水磨剑，剑身上的锈迹一点点褪去。心念也随之澄明。', exp: 0.14, mp: 0.15 } }
      ]
    },
    {
      id: 'luoxia_thunder', region: 'luoxia', name: '雷击古木', weight: 6,
      text: '一截焦黑古木横在山脊上，断口处仍有细密雷光游走。附近草木皆枯，唯独它没有化成灰。',
      choices: [
        {
          label: '伸手取木', hint: '气运检定', check: { stat: 'luck', dc: 10 },
          success: { text: '雷光在你掌心炸开，却只留下一点酥麻。你掰下一块木心，里面竟有紫色纹路。', items: [{ id: 'leijimu', qty: 1 }], exp: 0.18 },
          fail: { text: '一股残留的雷意顺着手臂窜上心脉，你半边身子都麻了。', hp: -0.24, exp: 0.05 }
        },
        {
          label: '以剑气削下一块', hint: '神识检定', check: { stat: 'sense', dc: 9 },
          success: { text: '你退开数步，以剑气细细削下一块木心，雷光未及上身。', items: [{ id: 'leijimu', qty: 1 }] },
          fail: { text: '剑气引动残雷，古木轰然炸开，你被气浪掀翻在地。', hp: -0.12 }
        },
        { label: '远远绕开', outcome: { text: '你绕开山脊，回头看了一眼。那截古木在暮色里像一截烧断的骨头。', exp: 0.05 } }
      ]
    },
    {
      id: 'luoxia_mist', region: 'luoxia', name: '山雾迷途', weight: 8,
      text: '雾从谷底漫上来，来路与去路都失了轮廓。你走了半个时辰，脚下仍是同一块青石。',
      choices: [
        {
          label: '闭目凭直觉走', hint: '气运检定', check: { stat: 'luck', dc: 9 },
          success: { text: '你索性不看路，只跟着心里那点微光走。雾散时，你竟站在一条从未走过的小径上，脚边有前人遗落的储物袋。', exp: 0.22, stones: 18 },
          fail: { text: '你一脚踩空，滚下半坡，起身时浑身是泥。', hp: -0.08, exp: 0.05 }
        },
        {
          label: '登高望远', hint: '神识检定', check: { stat: 'sense', dc: 8 },
          success: { text: '你攀上最近的山脊，借云隙间一线天光辨清了方向。', exp: 0.18 },
          fail: { text: '山脊上雾更浓，你险些失足滑落。', hp: -0.06 }
        },
        { label: '原地打坐等雾散', outcome: { text: '你盘膝坐下，听着雾里水滴落地的声音。不知过了多久，天光乍破。', exp: 0.16, mp: 0.20 } }
      ]
    },
    {
      id: 'luoxia_swordsman', region: 'luoxia', name: '游方剑客', weight: 7,
      text: '古松下坐着个背剑的年轻人，见你便笑：“道友，可愿论剑？”他面前摆着两只粗陶碗，酒还是温的。',
      choices: [
        { label: '拔剑切磋', outcome: { text: '年轻人起身还礼，剑未出鞘，气势已如松涛压来。', combat: 'swordsman' } },
        { label: '坐下论道', outcome: { text: '你们从剑法聊到长生，从山下聊到天上。临别时，他留下一句：“剑是死的，人是活的。”', exp: 0.25 } },
        { label: '拱手告辞', outcome: { text: '你拱手离去，走出很远，还听见他在身后轻轻斟酒。', exp: 0.04 } }
      ]
    },

    /* ================= 云梦泽 ================= */
    {
      id: 'yunmeng_lantern', region: 'yunmeng', name: '雾中渔火', weight: 10,
      text: '夜雾锁湖，一点渔火忽明忽灭。你循光走去，却见一条无人的乌篷船泊在芦苇间，船头挂着一盏白灯。',
      choices: [
        { label: '登船查看', outcome: { text: '你刚踏上船板，灯火骤然转绿。一只湿淋淋的手从舱里伸了出来。', combat: 'waterghost' } },
        {
          label: '扬声询问', hint: '神识检定', check: { stat: 'sense', dc: 9 },
          success: { text: '舱里没有回应，却飘出一缕灵气。你循着灵气在船底找到一小瓶灵泉。', items: [{ id: 'lingquan', qty: 1 }], exp: 0.18 },
          fail: { text: '你的声音在雾里散开，白灯灭了。下一刻，冰冷的手掐住了你的脚踝。', hp: -0.12, combat: 'waterghost' }
        },
        { label: '转身离开', outcome: { text: '你退回岸上，那盏灯在你身后亮了很久，直到雾把它吞没。', exp: 0.04 } }
      ]
    },
    {
      id: 'yunmeng_boy', region: 'yunmeng', name: '溺水少年', weight: 9,
      text: '湖面漂着一截断木，一个少年死死抱着它，脸色青白。他看见你，嘴唇动了动，却发不出声音。',
      choices: [
        { label: '跃入水中救人', outcome: { text: '湖水冷得刺骨。你把少年拖上岸时，他已昏了过去，怀里还紧紧抱着一只湿透的布包。', hp: -0.12, items: [{ id: 'lingcao', qty: 2 }], stats: { luck: 1 } } },
        { label: '以灵力托起他', outcome: { text: '你隔空以灵力托住少年，将他缓缓送上岸。醒来后，他向你磕了三个头。', mp: -0.30, stones: 30, stats: { luck: 1 } } },
        { label: '视而不见', outcome: { text: '你转过身去。身后很快没了声音，只剩湖水一遍遍拍岸。', hp: 0, stats: { luck: -1 } } }
      ]
    },
    {
      id: 'yunmeng_wreck', region: 'yunmeng', name: '沉船遗宝', weight: 9,
      text: '退潮后，湖底露出一艘断成两截的古船，船舱里有微光。船身上缠满水草，不知沉了多少年。',
      choices: [
        {
          label: '潜水搜寻', hint: '神识检定', check: { stat: 'sense', dc: 10 },
          success: { text: '你在一只朽坏的木箱里摸到几块灵石和一瓶封蜡完好的丹药。', stones: 80, items: [{ id: 'juqi', qty: 1 }], exp: 0.12 },
          fail: { text: '你刚钻进船舱，一条电鳗妖便从阴影里窜出，电光在水下炸开。', hp: -0.18, combat: 'eel' }
        },
        { label: '只在船头拾取', outcome: { text: '你在船头捡到几块被水冲松的灵石，见好就收。', stones: 30, exp: 0.08 } },
        { label: '记下位置离开', outcome: { text: '你在岸边做了记号，打算等修为再高些再来。', exp: 0.10 } }
      ]
    },
    {
      id: 'yunmeng_dragon', region: 'yunmeng', name: '蛟龙渡劫', weight: 6,
      text: '乌云压湖，一条青蛟在雷光中翻腾。它每受一道雷，鳞片便碎落几片，飘向岸边。雷声震得你脚下发麻。',
      choices: [
        {
          label: '远观悟道', hint: '悟性检定', check: { stat: 'comp', dc: 10 },
          success: { text: '你看它迎雷而上，又看它被劈落，忽然明白了什么叫“逆天而行”。', exp: 0.78 },
          fail: { text: '雷光太盛，你只看了一眼便双目刺痛，心神震荡。', hp: -0.15, exp: 0.18 }
        },
        {
          label: '冒险拾取蛟鳞', hint: '气运检定', check: { stat: 'luck', dc: 11 },
          success: { text: '你贴着岸边飞掠，在下一道雷落下前抢到一片完整的青鳞。', items: [{ id: 'jiaolin', qty: 1 }], exp: 0.10 },
          fail: { text: '一道余雷劈在岸边，你被气浪掀进湖里，浑身焦黑。', hp: -0.32 }
        },
        { label: '立刻退走', outcome: { text: '你头也不回地离开。身后雷声持续了整整一夜。', exp: 0.08 } }
      ]
    },
    {
      id: 'yunmeng_spring', region: 'yunmeng', name: '湖心灵泉', weight: 7,
      text: '湖心小岛有一眼灵泉，泉底铺着温润的白石。四周无人，只有水鸟在芦苇间起落。',
      choices: [
        { label: '入泉浸泡', outcome: { text: '泉水漫过胸口，温热的灵气从毛孔渗入经脉。你闭上眼，仿佛回到母胎之中。', hp: 0.50, mp: 0.50, mods: { hpPct: 0.02 } } },
        { label: '取泉水', outcome: { text: '你灌满两只玉瓶，又在泉边打坐片刻。', items: [{ id: 'lingquan', qty: 2 }] } },
        { label: '在泉边修炼', outcome: { text: '灵泉氤氲，你在此处入定，修为涨得比平日快了许多。', exp: 0.34 } }
      ]
    },
    {
      id: 'yunmeng_market', region: 'yunmeng', name: '水上夜市', weight: 8,
      text: '数十条小船首尾相连，灯火通明。戴斗笠的修士们低声交易，不问来历，也不问去处。',
      choices: [
        { label: '买一枚来路不明的丹药', outcome: { text: '摊主收下灵石，推给你一只蜡封小瓶，转眼便消失在人群里。', stones: -45, items: [{ id: 'ningshen', qty: 1 }] } },
        { label: '出售草药', req: { item: 'lingcao', qty: 1 }, outcome: { text: '药贩子捏了捏灵草，爽快地数出一袋灵石。', stones: 45, consume: [{ id: 'lingcao', qty: 1 }] } },
        { label: '逛一圈，听听消息', outcome: { text: '你听到不少真真假假的传闻：湖底有龙宫，九幽墟有仙人遗蜕，万妖岭的虎妖最近在换牙。', exp: 0.08 } }
      ]
    },
    {
      id: 'yunmeng_lotus', region: 'yunmeng', name: '并蒂青莲', weight: 8,
      text: '沼泽深处开着一朵并蒂青莲，莲香醉人。花下水面漆黑如墨，偶尔有气泡浮上来。',
      choices: [
        { label: '踏水摘莲', outcome: { text: '你足尖点水掠向青莲，水面轰然炸开，一条电鳗妖缠上了你的小腿。', combat: 'eel' } },
        { label: '盘坐莲台修炼', outcome: { text: '你不敢妄动青莲，只在旁边寻了块干石盘坐。莲香入鼻，心境格外澄明。', exp: 0.40, mp: 0.20 } },
        {
          label: '只采一片花瓣', hint: '神识检定', check: { stat: 'sense', dc: 9 },
          success: { text: '你以剑气削下一片花瓣，未惊动水下之物。', items: [{ id: 'qinglian', qty: 1 }] },
          fail: { text: '花瓣落水的瞬间，水面炸开，一条电鳗妖破水而出。', hp: -0.12, combat: 'eel' }
        }
      ]
    },
    {
      id: 'yunmeng_woman', region: 'yunmeng', name: '白衣女子', weight: 7,
      text: '白衣女子立在浅滩上，赤足不沾水。她问你：“可曾见过一条青蛟？”声音很轻，却像直接响在你识海里。',
      choices: [
        { label: '如实相告', outcome: { text: '她听完，向你微微颔首，袖中飞出一枚丹药落在你掌心，人已不见。', items: [{ id: 'ningshen', qty: 1 }], exp: 0.18 } },
        {
          label: '反问她来历', hint: '悟性检定', check: { stat: 'comp', dc: 10 },
          success: { text: '她看了你很久，忽然笑了：“胆子不小。”随后告诉你一段关于云梦泽的旧事，令你受益匪浅。', exp: 0.40, stones: 40 },
          fail: { text: '她脸上的笑意淡了：“不该问的，别问。”你只觉胸口一闷，嘴角溢出血丝。', hp: -0.10 }
        },
        { label: '拔剑试探', outcome: { text: '剑锋穿过她的身体，像穿过一团雾。她低头看着胸口的剑，眼神冷了下来。', combat: 'waterghost' } },
        { label: '转身离开', outcome: { text: '你走出很远再回头，浅滩上已空无一人。', exp: 0.03 } }
      ]
    },
    {
      id: 'yunmeng_ghostwall', region: 'yunmeng', name: '鬼打墙', weight: 7,
      text: '你在芦苇荡里走了半个时辰，又回到同一棵歪脖子柳树前。雾里传来若有若无的桨声，却始终不见船。',
      choices: [
        { label: '咬破指尖，以血破障', outcome: { text: '血珠落在泥里，雾气像被烫到一般退开。你终于看见了真正的路。', hp: -0.08, exp: 0.28 } },
        {
          label: '静心听水声辨位', hint: '神识检定', check: { stat: 'sense', dc: 9 },
          success: { text: '你闭上眼，循着水声最清的方向走，雾气不知不觉散了。', exp: 0.28, stones: 20 },
          fail: { text: '水声忽左忽右，你越走越偏，最后跌进一片齐腰深的冷水。', hp: -0.10, mp: -0.20 }
        },
        { label: '点起一张符纸', req: { item: 'fulu', qty: 1 }, outcome: { text: '符纸燃起青烟，雾气中传来一声尖啸。你趁势冲出芦苇荡。', consume: [{ id: 'fulu', qty: 1 }], exp: 0.35, items: [{ id: 'lingquan', qty: 1 }] } }
      ]
    },
    {
      id: 'yunmeng_fisher', region: 'yunmeng', name: '老渔夫', weight: 7,
      text: '老渔夫收了网，网里没有鱼，只有一只锈迹斑斑的铜铃。他叹了口气：“这湖里的东西，越来越怪了。”',
      choices: [
        { label: '用灵石买下铜铃', outcome: { text: '老渔夫摆摆手：“拿去吧，这玩意儿夜里会自己响，我留着害怕。”', stones: -50, items: [{ id: 'tongling', qty: 1 }] } },
        { label: '帮他修补渔网', outcome: { text: '你替他补好渔网，他硬塞给你几条灵鱼，又絮絮说了半宿湖上的怪事。', exp: 0.16, stones: 15, hp: 0.10 } },
        { label: '问他湖上怪事', outcome: { text: '他说起沉船、水鬼和一条会下雨的青蛟。你听得出神，对这片水域多了几分了解。', exp: 0.24 } }
      ]
    },

    /* ================= 万妖岭 ================= */
    {
      id: 'wanyao_tiger', region: 'wanyao', name: '虎啸山林', weight: 10,
      text: '虎啸震得树叶簌簌而落。一头黑风虎妖从巨石后踱出，金瞳盯着你，尾巴一下一下地扫着地面。',
      choices: [
        { label: '迎战', outcome: { text: '你握紧兵刃。虎妖伏低身子，下一刻便化作一道黑风扑来。', combat: 'tiger' } },
        {
          label: '屏息后退', hint: '神识检定', check: { stat: 'sense', dc: 10 },
          success: { text: '你借着一阵山风掩住气息，缓缓退出了虎妖的领地。', exp: 0.15 },
          fail: { text: '你踩断了一根枯枝。虎妖的头颅瞬间转了过来。', hp: -0.18, combat: 'tiger' }
        },
        { label: '抛出干粮引开', outcome: { text: '虎妖低头嗅了嗅干粮，嫌弃地打了个响鼻，但到底没有追来。', stones: -10, exp: 0.10 } }
      ]
    },
    {
      id: 'wanyao_market', region: 'wanyao', name: '妖族夜市', weight: 9,
      text: '山谷里搭着兽皮帐篷，狐妖、蛇妖与人修混坐饮酒。摊上摆着妖丹和不知名的骨器，叫卖声此起彼伏。',
      choices: [
        { label: '买一枚妖丹', outcome: { text: '摊主是只独眼老狼，收下灵石后把妖丹抛给你，又咧嘴笑了笑。', stones: -120, items: [{ id: 'yaodan', qty: 1 }] } },
        { label: '以灵草换骨器', req: { item: 'lingcao', qty: 2 }, outcome: { text: '蛇妖摊主收下灵草，递给你一截打磨光滑的妖骨。', consume: [{ id: 'lingcao', qty: 2 }], items: [{ id: 'yaogu', qty: 1 }] } },
        { label: '打听消息', outcome: { text: '你请一桌妖修喝了坛酒，听来不少万妖岭的秘闻与禁忌。', exp: 0.20, stones: -20 } },
        { label: '掀桌动手', outcome: { text: '酒碗落地，四周忽然安静下来。一头披甲妖将缓缓站起身。', combat: 'boademon' } }
      ]
    },
    {
      id: 'wanyao_field', region: 'wanyao', name: '古战场', weight: 8,
      text: '荒草间半埋着断裂的兵刃与白骨，风一过，仿佛有万人低语。这里的土是暗红色的。',
      choices: [
        {
          label: '搜寻残兵', hint: '气运检定', check: { stat: 'luck', dc: 10 },
          success: { text: '你在一具披甲骸骨下摸到一截妖骨，质地温润，竟未被岁月腐蚀。', items: [{ id: 'yaogu', qty: 1 }], stones: 60 },
          fail: { text: '你刚翻动白骨，一具披甲妖将便从土里坐了起来。', combat: 'boademon' }
        },
        { label: '祭拜亡魂', outcome: { text: '你点了三炷香，向这片无名坟场深深一拜。风停了，耳边的低语也散了。', exp: 0.44, hp: 0.10 } },
        { label: '匆匆离开', outcome: { text: '你加快脚步穿过战场，直到回头看不见白骨才松口气。', exp: 0.04 } }
      ]
    },
    {
      id: 'wanyao_vine', region: 'wanyao', name: '血藤缠身', weight: 8,
      text: '一株通体血红的藤蔓缠上你的脚踝，尖刺扎进皮肉，贪婪地吸取精血。越挣扎，缠得越紧。',
      choices: [
        { label: '运功震断', outcome: { text: '你闷哼一声，灵力鼓荡，将血藤寸寸震裂。断口处流出暗红的汁液。', hp: -0.12, items: [{ id: 'xueteng', qty: 1 }], exp: 0.18 } },
        {
          label: '以火术烧尽', hint: '悟性检定', check: { stat: 'comp', dc: 8 },
          success: { text: '一缕真火顺着藤蔓烧过去，血藤发出尖细的嘶鸣，很快蜷缩成灰。', exp: 0.15 },
          fail: { text: '火势顺着藤蔓反扑上来，你慌忙收功，手臂已被灼伤。', hp: -0.20 }
        },
        { label: '任由它吸食', outcome: { text: '你强忍剧痛，任血藤吸食精血。奇怪的是，藤蔓饱足后竟主动松开，还在你脚边留下一枚血色果实。', hp: -0.30, exp: 0.48, items: [{ id: 'xueteng', qty: 1 }] } }
      ]
    },
    {
      id: 'wanyao_flower', region: 'wanyao', name: '迷魂花', weight: 8,
      text: '林间开着大片紫花，香气甜腻。你忽然听见有人在叫你的名字，声音很熟，却想不起是谁。',
      choices: [
        {
          label: '闭气穿过', hint: '悟性检定', check: { stat: 'comp', dc: 10 },
          success: { text: '你守住灵台一点清明，闭气从花海中穿了过去。身后呼唤声渐渐远去。', exp: 0.28 },
          fail: { text: '你忍不住应了一声。四周的花海忽然化作无数张熟悉的脸，你抱头跪倒在地。', hp: -0.18, exp: -0.08 }
        },
        {
          label: '采一朵带走', hint: '气运检定', check: { stat: 'luck', dc: 9 },
          success: { text: '你用布帛裹住口鼻，小心地摘下一朵完整的迷魂花。', items: [{ id: 'mihunhua', qty: 1 }] },
          fail: { text: '指尖触到花瓣的瞬间，幻象如潮水般涌来。你醒来时，天已经黑了。', hp: -0.20, exp: -0.10 }
        },
        { label: '绕路', outcome: { text: '你远远绕开那片花海，多走了半日山路。', exp: 0.05 } }
      ]
    },
    {
      id: 'wanyao_territory', region: 'wanyao', name: '两妖相争', weight: 7,
      text: '一头熊妖与一条蛇妖为争地盘厮打，山谷被撞得碎石纷飞。两妖都已见血，却谁也不肯退。',
      choices: [
        { label: '等它们两败俱伤再出手', outcome: { text: '你藏身暗处，等两妖都喘着粗气趴下，才提剑走了出去。', combat: 'boademon' } },
        { label: '帮蛇妖', outcome: { text: '你一道剑气劈向熊妖后腿。蛇妖嘶鸣一声，趁势缠了上去。', combat: 'tiger' } },
        { label: '悄悄绕开', outcome: { text: '你贴着山壁绕行，回头看见两妖仍纠缠在一起，把半座山谷都掀翻了。', exp: 0.06 } }
      ]
    },
    {
      id: 'wanyao_fox', region: 'wanyao', name: '狐妖求助', weight: 7,
      text: '一只媚狐被猎妖人的锁妖索困住，见你走近，化作人形跪地：“求道友救我。”她身后拖着九条尾巴，其中一条已经断了。',
      choices: [
        { label: '斩断锁链', outcome: { text: '你一剑斩断锁链。媚狐还没来得及道谢，猎妖人已经追了上来。', combat: 'hunter' } },
        { label: '向猎妖人买下她', outcome: { text: '猎妖人掂了掂灵石，吹了声口哨：“道友心善，可别后悔。”', stones: -150, stats: { luck: 1 } } },
        { label: '趁机擒下她', outcome: { text: '你伸手扣住她的手腕。媚狐眼中的哀求瞬间化作寒意。', combat: 'foxdemon' } },
        { label: '不予理会', outcome: { text: '你从她身边走过。身后传来锁链拖地的声音，越来越远。', exp: 0.03 } }
      ]
    },
    {
      id: 'wanyao_cave', region: 'wanyao', name: '妖丹洞窟', weight: 8,
      text: '山洞深处堆着白骨，中央石台上悬着一枚拳头大的妖丹，周围盘着一条巨蟒。蟒身粗如水缸，鳞片在暗处泛着冷光。',
      choices: [
        {
          label: '潜行取丹', hint: '神识检定', check: { stat: 'sense', dc: 11 },
          success: { text: '你贴地潜行，在巨蟒睁眼的瞬间抓起妖丹，翻身滚出洞外。', items: [{ id: 'yaodan', qty: 2 }], exp: 0.25 },
          fail: { text: '你刚碰到妖丹，巨蟒的竖瞳便转了过来。', combat: 'snake' }
        },
        { label: '强攻', outcome: { text: '你不再遮掩气息，一剑劈向巨蟒七寸。', combat: 'snake' } },
        { label: '退走', outcome: { text: '你悄无声息地退出洞窟。那枚妖丹，还是留给有缘人吧。', exp: 0.04 } }
      ]
    },
    {
      id: 'wanyao_elder', region: 'wanyao', name: '守山老猿', weight: 6,
      text: '一头白毛老猿坐在断崖上，怀里抱着一柄断剑，目光浑浊却深不可测。它看了你一眼，没有动。',
      choices: [
        {
          label: '行礼请教', hint: '悟性检定', check: { stat: 'comp', dc: 11 },
          success: { text: '老猿伸出一根指头，在你眉心轻轻一点。你眼前闪过无数剑招，又迅速忘却，只余一点剑意。', exp: 0.62, items: [{ id: 'yaogu', qty: 1 }] },
          fail: { text: '老猿摇了摇头，把断剑往怀里拢了拢，闭上了眼。', exp: 0.10 }
        },
        { label: '以灵石换断剑', outcome: { text: '老猿盯着灵石看了很久，终于把断剑递给你，又指了指山下。', stones: -200, items: [{ id: 'duanjian', qty: 1 }] } },
        { label: '悄悄离开', outcome: { text: '你退下山崖，老猿始终没有再看你一眼。', exp: 0.04 } }
      ]
    },

    /* ================= 九幽墟 ================= */
    {
      id: 'jiuyou_ghostmarket', region: 'jiuyou', name: '鬼市', weight: 10,
      text: '子时，荒原上凭空出现一条长街。摊主们都罩着黑袍，摊上摆着不该存在的东西：会眨眼的面具、装着哭声的瓷瓶、写着活人名字的牌位。',
      choices: [
        { label: '买一只蒙尘木盒', outcome: { text: '摊主伸出枯瘦的手收了灵石。木盒里躺着一枚温润的丹药，药香扑鼻。', stones: -180, items: [{ id: 'xisui', qty: 1 }] } },
        { label: '买一盏引魂灯', outcome: { text: '黑袍摊主把灯递给你时，你很确定他在笑。灯火幽蓝，照得影子往反方向走。', stones: -90, items: [{ id: 'yinhundeng', qty: 1 }] } },
        { label: '只看不买', outcome: { text: '你沿着长街走了一遍，把那些货物的模样记在心里。', exp: 0.16 } },
        { label: '掀开最近的黑袍', outcome: { text: '黑袍下没有脸，只有一团蠕动的黑影。整条长街的灯火同时灭了。', combat: 'corpse' } }
      ]
    },
    {
      id: 'jiuyou_stele', region: 'jiuyou', name: '无字古碑', weight: 9,
      text: '一块三人高的黑碑立在乱石中，碑上无字，却让你的神识隐隐作痛。碑脚堆着几枚风化的头骨。',
      choices: [
        {
          label: '以神识触碰古碑', hint: '悟性检定', check: { stat: 'comp', dc: 12 },
          success: { text: '无字碑中涌出无数金色篆字，灌入你的识海。你盘膝坐下，不知过了多久才睁眼。', exp: 0.95 },
          fail: { text: '一股庞大的意志顺着神识反冲回来，你七窍渗血，几乎昏厥。', hp: -0.24, exp: 0.18 }
        },
        {
          label: '临摹碑文', hint: '神识检定', check: { stat: 'sense', dc: 10 },
          success: { text: '你祭出空白符纸，将碑上无形的纹路一寸寸拓下。', stones: 100, exp: 0.20 },
          fail: { text: '你越看越觉得碑在看你，心神失守，灵力乱窜。', mp: -0.35 }
        },
        { label: '绕碑而行', outcome: { text: '你绕开古碑，走出很远还觉得背后有人站着。', exp: 0.08 } }
      ]
    },
    {
      id: 'jiuyou_bloodmoon', region: 'jiuyou', name: '血月当空', weight: 9,
      text: '血月升起，荒原上的影子都活了过来。一股精纯而暴戾的月华自天灵灌入你体内，经脉隐隐作痛。',
      choices: [
        { label: '运功吸纳', outcome: { text: '你放开经脉，任月华冲刷。痛楚之后，修为竟涨了一大截。', hp: -0.20, exp: 0.66 } },
        { label: '藏身石缝', outcome: { text: '你缩在石缝里，看那些影子在荒原上游荡了一整夜。', exp: 0.14, mp: 0.20 } },
        {
          label: '以剑指月', hint: '悟性检定', check: { stat: 'comp', dc: 11 },
          success: { text: '你举剑指月，剑尖凝起一点清光。血月仿佛被刺了一下，微微黯淡。', exp: 0.48 },
          fail: { text: '剑光刚起便被月华压灭，你闷哼一声，单膝跪地。', hp: -0.20 }
        }
      ]
    },
    {
      id: 'jiuyou_cave', region: 'jiuyou', name: '魔修洞府', weight: 8,
      text: '山腹被凿成一座洞府，石门半开，里面传来低沉的诵经声，带着血腥气。门口挂着两盏人皮灯笼。',
      choices: [
        {
          label: '潜入', hint: '神识检定', check: { stat: 'sense', dc: 11 },
          success: { text: '你贴着阴影潜入，趁魔修入定，取走了他案上的丹药与灵石，又悄无声息地退了出来。', stones: 180, items: [{ id: 'xisui', qty: 1 }] },
          fail: { text: '你刚碰到案上的玉瓶，诵经声停了。血袍魔修睁开眼，冲你笑了笑。', combat: 'demon' }
        },
        { label: '直接破门', outcome: { text: '你一脚踹开石门。血袍魔修缓缓起身，脚下的影子多出一截。', combat: 'demon' } },
        { label: '转身离开', outcome: { text: '你悄悄退走。那诵经声跟了你很远，直到天边泛白才消失。', exp: 0.04 } }
      ]
    },
    {
      id: 'jiuyou_well', region: 'jiuyou', name: '轮回井', weight: 8,
      text: '一口古井，井沿刻满名字。你探头望去，井底映出的却不是你的脸，而是一个穿着粗布衣裳、正在田里直起腰来的少年。',
      choices: [
        {
          label: '凝视井底', hint: '悟性检定', check: { stat: 'comp', dc: 12 },
          success: { text: '井底的人冲你笑了笑，转身走进一片雾里。你忽然记起许多不属于此生的事，识海一片澄明。', exp: 0.76, stats: { comp: 1 } },
          fail: { text: '井底的脸忽然扭曲，无数只手臂从井里伸出来。你猛地后退，仍被扯下一缕神魂。', hp: -0.28 }
        },
        { label: '投一枚灵石', outcome: { text: '灵石落水，没有声音。井沿上多出一个模糊的名字，很快又淡去。', stones: -20, exp: 0.18 } },
        { label: '离开', outcome: { text: '你退出古井，再回头时，井口已被荒草遮住。', exp: 0.05 } }
      ]
    },
    {
      id: 'jiuyou_thunderpool', region: 'jiuyou', name: '天雷池', weight: 8,
      text: '山谷中雷浆如瀑，池边焦骨堆积。传说雷池能淬炼肉身，也能把人劈成飞灰。',
      choices: [
        {
          label: '入池淬体', hint: '悟性检定', check: { stat: 'comp', dc: 11 },
          success: { text: '你踏入雷池，雷浆没过膝盖。剧痛中，你听见自己骨骼重塑的声音。', mods: { hpPct: 0.04 }, exp: 0.30, hp: -0.10 },
          fail: { text: '一道雷浆炸开，你被掀出池外，半边身子焦黑。', hp: -0.38 }
        },
        { label: '以雷池水炼器', req: { item: 'yaogu', qty: 1 }, outcome: { text: '妖骨在雷浆中沉浮，杂质一点点褪去，变得如玉般温润。你把它卖给路过的器师，换了一笔灵石。', consume: [{ id: 'yaogu', qty: 1 }], stones: 150, exp: 0.12 } },
        { label: '在池边观雷', outcome: { text: '你坐在池边，看雷浆起落，慢慢体会其中毁灭与新生之意。', exp: 0.26 } }
      ]
    },
    {
      id: 'jiuyou_remains', region: 'jiuyou', name: '散仙遗蜕', weight: 7,
      text: '一具盘坐的枯骨不知已坐了多少年，指骨间夹着一枚玉简，周身仍有淡淡威压。枯骨面前的石台上刻着两个字：莫贪。',
      choices: [
        { label: '取走玉简', outcome: { text: '你刚碰到玉简，枯骨忽然抬头，空洞的眼窝里亮起两点幽光。', combat: 'corpse' } },
        { label: '叩首参拜', outcome: { text: '你恭恭敬敬磕了三个头，把身上最后一点灵泉洒在枯骨前。起身时，玉简自行飞入你手中。', exp: 0.48, technique: 'taixu' } },
        {
          label: '搜刮遗蜕', hint: '气运检定', check: { stat: 'luck', dc: 11 },
          success: { text: '你在枯骨座下摸到一只暗格，里面整整齐齐码着灵石与丹药。', stones: 260, items: [{ id: 'xisui', qty: 1 }] },
          fail: { text: '暗格一开，一道残存的剑意破空而来。你勉强避开要害，枯骨也站了起来。', hp: -0.28, combat: 'corpse' }
        }
      ]
    },
    {
      id: 'jiuyou_bridge', region: 'jiuyou', name: '断魂桥', weight: 7,
      text: '一座石桥横在黑色河面上，桥头立着个撑伞的老妪。她问你：“可要过桥？”伞下没有脸，只有一片浓得化不开的阴影。',
      choices: [
        {
          label: '过桥', hint: '气运检定', check: { stat: 'luck', dc: 11 },
          success: { text: '你目不斜视地走过石桥。桥下传来无数叹息，却没有一只手伸上来。对岸的月光格外明亮。', exp: 0.92 },
          fail: { text: '走到桥心，你忍不住低头看了一眼。河水里全是向上伸的手。', hp: -0.28, exp: 0.18 }
        },
        { label: '问桥通向何处', outcome: { text: '老妪沉默了很久，说：“通向你想去的地方。”你忽然不想过桥了。', exp: 0.28 } },
        { label: '转身离开', outcome: { text: '你转身离开。身后传来老妪的一声轻笑，像枯叶落地。', exp: 0.04 } }
      ]
    },

    /* ================= 通用 ================= */
    {
      id: 'common_caravan', region: 'any', name: '行商车队', weight: 7,
      text: '一队驮着货物的灵驼从山道下来，领队的老者招呼你：“道友，看看货？都是走南闯北收来的稀罕物。”',
      choices: [
        { label: '买两瓶回春丹', outcome: { text: '老者麻利地包好丹药，又塞给你一小包灵草。', stones: -35, items: [{ id: 'huichun', qty: 2 }, { id: 'lingcao', qty: 1 }] } },
        { label: '卖些灵草', req: { item: 'lingcao', qty: 1 }, outcome: { text: '老者看了看成色，给了一个还算公道的价钱。', consume: [{ id: 'lingcao', qty: 1 }], stones: 35 } },
        { label: '打听前方消息', outcome: { text: '老者说了不少路上的见闻，临走还提醒你：“九幽墟那地方，能不去就别去。”', exp: 0.12 } }
      ]
    },
    {
      id: 'common_pouch', region: 'any', name: '无主储物袋', weight: 6,
      text: '路边草丛里躺着一只染血的储物袋，袋口禁制未散。附近没有脚印，也没有尸体。',
      choices: [
        {
          label: '以灵力破禁', hint: '神识检定', check: { stat: 'sense', dc: 9 },
          success: { text: '禁制应声而开。袋里有一小袋灵石和一瓶丹药。', stones: 45, items: [{ id: 'juqi', qty: 1 }] },
          fail: { text: '禁制忽然反噬，你被震得倒退几步，储物袋也化成了灰。', hp: -0.10 }
        },
        {
          label: '用剑挑开', hint: '气运检定', check: { stat: 'luck', dc: 9 },
          success: { text: '剑尖一挑，袋口自己开了。你谨慎地倒出里面的东西，收获还算不错。', stones: 35 },
          fail: { text: '剑尖刚碰到袋口，一道阴冷的印记便缠上了你的手腕。', hp: -0.16 }
        },
        { label: '原样放回', outcome: { text: '你把储物袋放回原处，退后三步离开。不知为何，心里反而踏实了些。', exp: 0.10 } }
      ]
    },
    {
      id: 'common_injured', region: 'any', name: '受伤修士', weight: 7,
      text: '一个修士靠在树下，胸口血迹斑斑，见你过来，艰难地抬手：“道友……救命……”他腰间还挂着一只鼓鼓的储物袋。',
      choices: [
        { label: '喂他一颗回春丹', req: { item: 'huichun', qty: 1 }, outcome: { text: '药力化开，他的脸色好了些，从储物袋里摸出一块玉牌塞给你：“日后若有缘……”', consume: [{ id: 'huichun', qty: 1 }], exp: 0.26, stats: { luck: 1 } } },
        { label: '以灵力为他疗伤', outcome: { text: '你渡过去一缕灵力，他喘匀了气，郑重向你道谢。', mp: -0.35, exp: 0.30, stones: 20 } },
        { label: '搜走他的储物袋', outcome: { text: '他没有反抗，只是看着你，眼神慢慢暗下去。你拿到不少灵石，手心却一直发凉。', stones: 90, stats: { luck: -1 } } },
        { label: '离开', outcome: { text: '你走出很远，还能听见他微弱的呼吸声。', hp: 0 } }
      ]
    },
    {
      id: 'common_dream', region: 'any', name: '黄粱一梦', weight: 6,
      text: '夜宿破庙，你梦见自己已经飞升，站在云海之上俯瞰人间。醒来时，枕边多了一枚温热的玉片。',
      choices: [
        {
          label: '握住玉片参悟', hint: '悟性检定', check: { stat: 'comp', dc: 10 },
          success: { text: '玉片里封着一缕极淡的道意，像是有人把一生的感悟压缩成了一瞬。', exp: 0.48 },
          fail: { text: '道意太深，你只看了一眼便头痛欲裂。', hp: -0.08, exp: 0.12 }
        },
        { label: '把梦讲给泥像听', outcome: { text: '你絮絮叨叨说了半宿，泥像自然不会回答。但说完之后，心里轻快了许多。', exp: 0.18, mp: 0.15 } },
        { label: '继续睡', outcome: { text: '你翻了个身，很快又睡着了。这一觉睡得很沉，醒来时天已大亮。', hp: 0.25 } }
      ]
    }
  ];

  /* 炼丹：材料来自历练，成丹率与悟性、火灵根相关。 */
  Data.RECIPES = [
    { id: 'craft_huichun', name: '回春丹', out: { id: 'huichun', qty: 1 }, mats: { lingcao: 2 }, dc: 6, desc: '两株灵草，文火慢炼。' },
    { id: 'craft_juqi', name: '聚气丹', out: { id: 'juqi', qty: 1 }, mats: { lingcao: 1, lingquan: 1 }, dc: 7, desc: '灵草为引，灵泉为底。' },
    { id: 'craft_huiling', name: '回灵丹', out: { id: 'huiling', qty: 1 }, mats: { lingquan: 2 }, dc: 7, desc: '以灵泉凝练，最是养神。' },
    { id: 'craft_ningshen', name: '凝神丹', out: { id: 'ningshen', qty: 1 }, mats: { lingcao: 2, yaodan: 1 }, dc: 11, desc: '妖丹入药，需以神识压制妖气。' },
    { id: 'craft_pojing', name: '破境丹', out: { id: 'pojing', qty: 1 }, mats: { leijimu: 1, yaodan: 1 }, dc: 12, desc: '雷意与妖力相冲，火候差一线便会炸炉。' },
    { id: 'craft_xisui', name: '洗髓丹', out: { id: 'xisui', qty: 1 }, mats: { qinglian: 1, yaodan: 2 }, dc: 14, desc: '青莲安神，妖丹洗髓，非金丹修士不能炼。' }
  ];

  Data.ACHIEVEMENTS = [
    { id: 'first_step', name: '初入仙途', desc: '完成第一次打坐。', reward: { stones: 30 }, check: function (s) { return s.stats.meditations >= 1; } },
    { id: 'lianqi_full', name: '炼气圆满', desc: '将炼气期修至九层。', reward: { stones: 80 }, check: function (s) { return s.player.realm >= 1 || (s.player.realm === 0 && s.player.layer === 8); } },
    { id: 'foundation', name: '筑基有成', desc: '突破至筑基期。', reward: { stones: 150 }, check: function (s) { return s.player.realm >= 1; } },
    { id: 'core', name: '金丹大道', desc: '凝结金丹。', reward: { stones: 300 }, check: function (s) { return s.player.realm >= 2; } },
    { id: 'nascent', name: '元婴出窍', desc: '修成元婴。', reward: { stones: 600 }, check: function (s) { return s.player.realm >= 3; } },
    { id: 'spirit', name: '化神一念', desc: '踏入化神期。', reward: { stones: 1200 }, check: function (s) { return s.player.realm >= 4; } },
    { id: 'ascend', name: '羽化飞升', desc: '渡过天劫，飞升成仙。', reward: { stones: 10000 }, check: function (s) { return s.player.ascended === true; } },
    { id: 'meditate_100', name: '百炼成钢', desc: '累计打坐一百次。', reward: { stones: 500 }, check: function (s) { return s.stats.meditations >= 100; } },
    { id: 'hunter', name: '降妖除魔', desc: '赢得十场战斗。', reward: { stones: 260 }, check: function (s) { return s.stats.wins >= 10; } },
    { id: 'rich', name: '富甲一方', desc: '持有灵石超过一千。', reward: { item: 'pojing', qty: 1 }, check: function (s) { return s.player.stones >= 1000; } },
    { id: 'scholar', name: '博览群书', desc: '习得四门功法。', reward: { stones: 600 }, check: function (s) { return s.player.learned.length >= 4; } },
    { id: 'explorer', name: '踏遍山河', desc: '历练三十次。', reward: { stones: 400 }, check: function (s) { return s.stats.explorations >= 30; } },
    { id: 'first_loss', name: '胜败乃常事', desc: '第一次在战斗中落败。', reward: { item: 'huichun', qty: 2 }, check: function (s) { return s.stats.defeats >= 1; } },
    { id: 'century', name: '山中无甲子', desc: '活到一百岁。', reward: { stones: 700 }, check: function (s) { return s.player.ageMonths >= 100 * 12; } },
    { id: 'alchemist', name: '丹道初成', desc: '成功炼制十枚丹药。', reward: { stones: 500 }, check: function (s) { return s.stats.crafts >= 10; } }
  ];

  Data.BATTLE_FLAVOR = {
    playerAttack: ['你侧身进步，一剑递出。', '你沉腕发力，兵刃破空。', '你踏前一步，招式朴实却狠辣。', '你抓住空隙，全力一击。', '你气沉丹田，一击轰出。'],
    crit: ['这一击正中要害，血光迸现！', '你听见了骨骼碎裂的声音。', '对手的护体灵气被你一击洞穿！'],
    enemyAttack: ['对手狞笑着扑上来。', '寒光一闪，对手已欺近身前。', '对手不退反进，攻势如潮。', '你只觉劲风扑面，来不及多想。'],
    playerHurt: ['你闷哼一声，后退半步。', '你咬紧牙关，硬吃下这一击。', '衣袍裂开，血珠飞溅。', '你脚下踉跄，险些跌倒。'],
    dodge: ['你身形一转，堪堪避开。', '你早有防备，侧身让过。', '这一击擦着你的衣角落空。'],
    victory: ['对手晃了晃，重重倒了下去。', '最后一击落下，四周忽然安静。', '尘埃落定，你收剑而立。'],
    defeat: ['你眼前一黑，再也支撑不住。', '你倒在地上，耳边只剩自己的心跳。', '你咬着牙想站起来，四肢却已不听使唤。']
  };

  Data.UI = {
    nav: [
      { id: 'cultivate', label: '修炼', icon: 'lotus' },
      { id: 'explore', label: '历练', icon: 'compass' },
      { id: 'character', label: '人物', icon: 'person' },
      { id: 'inventory', label: '行囊', icon: 'bag' },
      { id: 'market', label: '坊市', icon: 'shop' }
    ]
  };

  /* 供 Node 测试使用 */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Data;
  } else {
    window.XianData = Data;
  }
})();
