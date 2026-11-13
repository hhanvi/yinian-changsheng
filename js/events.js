/*
 * 一念长生 · 宗门篇 · 山门事件
 * 事件文案与选项均为原创。选项效果由 engine 统一结算。
 */
(function (global) {
  'use strict';

  var E = [];

  E.push({
    id: 'first_caravan', title: '山下来客', art: 'merchant', weight: 0,
    minDay: 4, cooldown: 999, once: true, priority: true,
    text: '一辆骡车停在山门外。车上的老商人姓胡，说听说青崖山新立了山门，特意绕路来看看。他掀开车帘，里面是盐、铁器和几捆旧书。',
    choices: [
      {
        label: '请他进山喝碗热茶', hint: '花 10 灵石，换来一批灵草与坊市行情',
        cost: { stones: 10 },
        effects: { herbs: 5, insight: 5, renown: 2, marketRefresh: true, moodAll: 2 },
        result: '胡商人喝了茶，留下五株灵草和一册旧账本。他说，做生意和修行一样，讲究一个“信”字。'
      },
      {
        label: '买下那几捆旧书', hint: '花 35 灵石，得到 18 悟道',
        cost: { stones: 35 },
        effects: { insight: 18, renown: 1 },
        result: '旧书纸张发黄，却有前人批注。你翻了半宿，竟从几句眉批里悟出些道理。'
      },
      {
        label: '寒暄几句，送他下山', hint: '稳妥，声望 +1',
        effects: { renown: 1, moodAll: 1 },
        result: '胡商人也不恼，笑着拱手：“山高水长，改日再来讨茶。”'
      }
    ]
  });

  E.push({
    id: 'refugee', title: '流民叩山', art: 'mountain', weight: 10,
    minDay: 8, cooldown: 45,
    text: '山门外来了七八个衣衫褴褛的流民。领头的是个半大少年，跪在石阶下说，山下闹了妖患，村子里只剩他们几个。',
    choices: [
      {
        label: '收下这个少年', hint: '消耗 8 食物，获得一名外门弟子',
        cost: { food: 8 },
        effects: { recruit: 'outer', renown: 1, moodAll: 2 },
        result: '少年磕了三个头，说自己叫阿石。你让他先吃碗饭，再领去弟子居。'
      },
      {
        label: '施粥送粮', hint: '消耗 5 食物，声望 +3，心境 +4',
        cost: { food: 5 },
        effects: { renown: 3, moodAll: 4 },
        result: '流民们捧着粥碗，千恩万谢地下山了。山门里的弟子看着，腰杆似乎都直了些。'
      },
      {
        label: '闭门不见', hint: '省下粮食，但弟子们会有些失落',
        effects: { moodAll: -4 },
        result: '山门关上了。夜里风很大，你听见门外有孩子在哭，后来就听不见了。'
      }
    ]
  });

  E.push({
    id: 'spirit_rain', title: '灵雨入山', art: 'rain', weight: 9,
    minDay: 12, cooldown: 60,
    text: '后半夜起了雨，雨丝落在青石上，竟泛着淡淡的银光。灵田里的禾苗一夜之间拔高半寸，连井水都清亮了几分。',
    choices: [
      {
        label: '让弟子们趁雨吐纳', hint: '五日内修炼速度 +35%',
        effects: { buff: { id: 'spirit_rain', name: '灵雨', days: 5, cult: 1.35 }, moodAll: 3 },
        result: '雨中灵气极盛，弟子们散坐廊下，连平时最坐不住的那个都入定了。'
      },
      {
        label: '引雨水入灵田', hint: '灵草 +8，食物 +6',
        effects: { herbs: 8, food: 6, renown: 1 },
        result: '灵田喝饱了水，叶片绿得发亮。这几日不必再挑水浇地了。'
      }
    ]
  });

  E.push({
    id: 'wolf_raid', title: '夜半狼嚎', art: 'beast', weight: 8,
    minDay: 16, cooldown: 50,
    text: '月上中天，山门外忽然响起一声长嚎。守夜的弟子敲响铜锣：十几双幽绿的眼睛正从林子里逼近，为首是一头铁背狼妖。',
    choices: [
      {
        label: '率内门弟子迎战', hint: '战斗 · 危险 1 · 胜则得妖骨与声望',
        effects: {
          battle: { danger: 1, name: '铁背狼妖', power: 58, glyph: '狼' }
        },
        result: '你提剑走出山门，内门弟子紧随其后。'
      },
      {
        label: '闭门守阵', hint: '损失 10 食物，声望 -1，但无人受伤',
        effects: { food: -10, renown: -1, moodAll: -2 },
        result: '山门紧闭，狼群在门外刨了半夜土，叼走晾在檐下的几串肉干。'
      },
      {
        label: '点起火把，敲锣驱赶', hint: '消耗 3 木材，声望 +1',
        cost: { wood: 3 },
        effects: { renown: 1, moodAll: 1 },
        result: '火光连成一片，锣声震山。狼群退进林子，再没回头。'
      }
    ]
  });

  E.push({
    id: 'disciple_insight', title: '松下顿悟', art: 'moon', weight: 7,
    minDay: 20, cooldown: 55,
    text: '一名弟子在松下打坐时，忽然睁眼，说听见了风从叶缝里穿过的声音。他描述得乱七八糟，但你听懂了：那是“气”的走向。',
    choices: [
      {
        label: '让他说下去', hint: '该弟子修为 +60，悟道 +10',
        effects: { expOne: 60, insight: 10, moodAll: 2 },
        result: '弟子说了半个时辰，越说越顺。你让人把他的话记下来，或许日后有用。'
      },
      {
        label: '让他自己去悟', hint: '该弟子修为 +100，心境 +8',
        effects: { expOne: 100, moodOne: 8 },
        result: '你没有打断他。他坐在松下，从日出坐到日落，起身时眼神清亮了许多。'
      }
    ]
  });

  E.push({
    id: 'herb_thief', title: '药圃失窃', art: 'moon', weight: 6,
    minDay: 24, cooldown: 70,
    text: '药圃少了一小片灵草，泥地上留着两行浅浅的脚印，一直延伸到后山。守夜的弟子说，看见一个瘦小的影子翻墙出去了。',
    choices: [
      {
        label: '追上去看看', hint: '或有隐情，可能收得一名弟子',
        effects: { recruit: 'outer', renown: 1, moodAll: -1, herbs: -2 },
        result: '你在后山洞口找到一个面黄肌瘦的少年，正把灵草嚼碎了喂给病重的妹妹。你叹了口气，把人带回了山门。'
      },
      {
        label: '加强巡夜，不再追究', hint: '消耗 5 木材，心境 +2',
        cost: { wood: 5 },
        effects: { moodAll: 2, renown: 1 },
        result: '你让人修高了篱笆，又在药圃边立了盏灯。丢掉的灵草，就当结个善缘。'
      },
      {
        label: '按门规责罚守夜弟子', hint: '心境 -4，但门规更严',
        effects: { moodAll: -4, renown: 2, discipleMoodOne: -10 },
        result: '守夜弟子在祠堂前跪了一夜。第二日，山门里的规矩明显严了，话却少了。'
      }
    ]
  });

  E.push({
    id: 'wandering_cultivator', title: '散修借宿', art: 'mountain', weight: 7,
    minDay: 18, cooldown: 55,
    text: '一个背着旧剑的散修在山门外借宿。他自称姓顾，筑基多年，却始终未能结丹。夜里他坐在廊下，望着山里的灯火发呆。',
    choices: [
      {
        label: '请他指点弟子', hint: '全体弟子修为 +30，悟道 +8',
        effects: { expAll: 30, insight: 8, moodAll: 2, renown: 1 },
        result: '顾修士话不多，只在演武场比划了几个剑式。弟子们练了半宿，竟都不觉得累。'
      },
      {
        label: '赠他一枚聚气丹', hint: '消耗聚气丹 ×1，声望 +4，获得破境丹',
        require: { pill: 'juqi' },
        effects: { consumePill: 'juqi', renown: 4, pills: { pojing: 1 }, moodAll: 3 },
        result: '顾修士捏着丹药看了很久，最后郑重收下。临走时，他留下一枚破境丹，说：“山不转水转。”'
      },
      {
        label: '留他住一夜，天明送客', hint: '声望 +1',
        effects: { renown: 1 },
        result: '天亮时，廊下已经空了。石桌上放着一片竹叶，叶脉里有淡淡的剑意。'
      }
    ]
  });

  E.push({
    id: 'plague', title: '山门疫气', art: 'plague', weight: 5,
    minDay: 35, cooldown: 90,
    text: '先是膳堂的杂役咳，接着是两个外门弟子发热。药庐里的老参用完了，山下的郎中摇头说，这是时气，得靠养。',
    choices: [
      {
        label: '隔离病患，集中医治', hint: '消耗 8 灵草，损失少量精力，避免扩散',
        cost: { herbs: 8 },
        effects: { healthAll: -4, moodAll: -2, renown: 1 },
        result: '你把病患挪进药庐，亲自守着煎药。几天后热退了，山门里没人再倒下。'
      },
      {
        label: '照常劳作，硬扛过去', hint: '全体气血 -10，心境 -6',
        effects: { healthAll: -10, moodAll: -6, injuryAll: 5 },
        result: '疫气拖了半个月。活是没耽误，可弟子们一个个瘦了一圈。'
      }
    ]
  });

  E.push({
    id: 'spirit_vein', title: '地脉异动', art: 'mountain', weight: 5,
    minDay: 30, cooldown: 85,
    text: '后山传来一阵闷响，像是有什么东西在地底翻了个身。你带人去看，发现一处石缝里渗出淡淡的青光，周围的草木都比别处精神。',
    choices: [
      {
        label: '在此立阵，引气入山', hint: '消耗 40 灵石，灵气永久 +2',
        cost: { stones: 40 },
        effects: { aura: 2, renown: 2, moodAll: 3 },
        result: '阵旗插下，青光顺着石缝游走，最后汇入山门。那一夜，连厨房的灶火都旺了几分。'
      },
      {
        label: '采些灵石便走', hint: '灵石 +60，但灵气散了些',
        effects: { stones: 60, aura: -1, renown: 1 },
        result: '你凿下几块蕴灵石，石缝里的青光很快暗了。下山时，你总觉得少了点什么。'
      }
    ]
  });

  E.push({
    id: 'disciple_quarrel', title: '同门争执', art: 'moon', weight: 6,
    minDay: 26, cooldown: 65,
    text: '两个弟子在演武场打了起来，一个说对方偷了自己的木剑，一个说那把剑本来就是自己的。围观的人不少，却没人敢劝。',
    choices: [
      {
        label: '各打三十大板，再各罚一月杂役', hint: '心境 -3，门规 +2 声望',
        effects: { moodAll: -3, renown: 2, injuryAll: 2 },
        result: '两人都被罚去挑水。半个月后，有人看见他们一起蹲在井边啃馒头，算是和好了。'
      },
      {
        label: '把两把剑都收了，让他们自己去做新的', hint: '消耗 5 木材，心境 +3',
        cost: { wood: 5 },
        effects: { moodAll: 3, renown: 1 },
        result: '两人闷头做了三天木剑。新剑丑是丑了点，倒再没听说谁偷谁的。'
      }
    ]
  });

  E.push({
    id: 'crane_herb', title: '仙鹤衔芝', art: 'crane', weight: 4,
    minDay: 40, cooldown: 120,
    text: '一只白鹤落在静室檐上，嘴里衔着一株紫芝。它不怕人，只是歪着头看你。你想起旧宗典籍里的一句话：鹤来，山有灵。',
    choices: [
      {
        label: '收下紫芝，向鹤行礼', hint: '灵草 +12，全体心境 +5',
        effects: { herbs: 12, moodAll: 5, renown: 1 },
        result: '白鹤放下紫芝，振翅去了。那株紫芝入药，竟比寻常灵草多出几分清气。'
      },
      {
        label: '不取，任它留下', hint: '灵气 +1，声望 +2',
        effects: { aura: 1, renown: 2, moodAll: 3 },
        result: '白鹤在檐上歇了一夜，天亮时飞走。此后每年春天，它都会回来一次。'
      }
    ]
  });

  E.push({
    id: 'rogue_tribute', title: '黑风索贡', art: 'sword', weight: 6,
    minDay: 45, cooldown: 80,
    text: '三个黑风寨的修士堵在山门外，说青崖山新立门户，按规矩该交一份“平安钱”。为首的光头修士把刀往石阶上一插，笑得露出一口黄牙。',
    choices: [
      {
        label: '拔剑，让他们知道山门朝哪开', hint: '战斗 · 危险 2',
        effects: { battle: { danger: 2, name: '黑风寨修士', power: 160, glyph: '匪' } },
        result: '你握住了剑柄。身后传来弟子们抽剑的声音。'
      },
      {
        label: '破财消灾', hint: '损失 60 灵石，声望 -2',
        cost: { stones: 60 },
        effects: { renown: -2, moodAll: -4 },
        result: '灵石装进布袋，光头掂了掂，笑着走了。你站在山门口，很久没说话。'
      },
      {
        label: '闭门不出，任他们叫骂', hint: '声望 -1，心境 -3',
        effects: { renown: -1, moodAll: -3 },
        result: '骂声持续到天黑。弟子们躲在屋里，没人敢出去。'
      }
    ]
  });

  E.push({
    id: 'bloodblade', title: '血刀门寻仇', art: 'sword', weight: 0,
    minRenown: 80, minDay: 50, once: true, priority: true, cooldown: 999,
    text: '一队穿红衣的人马踏破山门外的石阶。为首者提着一柄血色长刀，说青崖宗占了他们看中的灵脉，今日要讨个说法。血刀门，山下最大的邪修势力。',
    choices: [
      {
        label: '率内门弟子死战', hint: '战斗 · 危险 3 · 胜则声望大涨',
        effects: { battle: { danger: 3, name: '血刀门主', power: 420, glyph: '血' } },
        result: '你把旧钟敲响。钟声在山谷里滚了很久。'
      },
      {
        label: '献上灵石，暂避锋芒', hint: '损失 150 灵石，声望 -8',
        cost: { stones: 150 },
        effects: { renown: -8, moodAll: -8, flag: 'bloodblade_paid' },
        result: '血刀门的人走了，山门外留着一串马蹄印。你知道，这事没完。'
      }
    ]
  });

  E.push({
    id: 'demon_tide', title: '魔潮围山', art: 'beast', weight: 0,
    minRenown: 240, minDay: 100, once: true, priority: true, cooldown: 999,
    text: '天边压来一片黑云，云下是数不清的妖影。山下的村子已经空了，逃难的百姓挤在山门外。远处，一尊三头魔将正缓缓抬起手臂。',
    choices: [
      {
        label: '开山门，护百姓，迎战魔潮', hint: '战斗 · 危险 4 · 声望与民心',
        effects: { battle: { danger: 4, name: '三头魔将', power: 1100, glyph: '魔' }, renown: 6, moodAll: 6 },
        result: '山门大开。弟子们把百姓护在身后，剑光亮成一片。'
      },
      {
        label: '闭门守阵，只求自保', hint: '声望 -12，心境 -10，但减少伤亡',
        effects: { renown: -12, moodAll: -10, injuryAll: 4 },
        result: '阵光挡住了魔潮，也挡住了门外的哭声。'
      }
    ]
  });

  E.push({
    id: 'grand_assembly', title: '仙门大比', art: 'assembly', weight: 0,
    minRenown: 420, minDay: 160, once: true, priority: true, cooldown: 999,
    text: '十年一度的仙门大比在落霞山开幕。帖子上写着青崖宗的名字，字迹很客气。山下的修士说，这次大比，是天下宗门排座次的时候。',
    choices: [
      {
        label: '派最强弟子赴会', hint: '以宗门战力论胜负 · 声望与机缘',
        effects: { assembly: true },
        result: '你挑了一匹好马，把宗门的剑交到弟子手里。'
      },
      {
        label: '称病不去', hint: '声望 -6，但避开风险',
        effects: { renown: -6, moodAll: -2 },
        result: '帖子被压在书案下。大比那几日，山门里安静得有些过分。'
      }
    ]
  });

  global.SectEvents = E;
  if (typeof module !== 'undefined' && module.exports) module.exports = E;
})(typeof window !== 'undefined' ? window : globalThis);
