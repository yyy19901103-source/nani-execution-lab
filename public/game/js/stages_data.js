/**
 * stages_data.js — ステージ・装備・素材マスタデータ
 * 静的定義。保存データには含まれない。
 */

// ─── ステージデータ ──────────────────────────────────────────────────────────

const STAGES_DATA = [
  {
    chapter: 1,
    name: '第一章: 魔の森',
    storyIntro: '封印の亀裂から溢れ出す魔物たちが魔の森に巣食い始めた。天帝の化身が目覚めた報せを聞き、英雄たちは各地から集まり始める。',
    stages: [
      {
        id: '1-1', name: '迷いの森', isBoss: false,
        enemies: [
          { name: 'スライム', emoji: '🟢', hp: 600,  atk: 80,  def: 30,  spd: 50, element: '水' },
          { name: 'スライム', emoji: '🟢', hp: 600,  atk: 80,  def: 30,  spd: 50, element: '水' }
        ],
        rewards: { coins: [80, 150], exp: [30, 60],
          material: { id: 'herb', chance: 0.5 },
          equipIds: [{ id: 'sword_r', chance: 0.15 }, { id: 'armor_r', chance: 0.15 }]
        },
        firstClear: { crystals: 10 }
      },
      {
        id: '1-2', name: '暗い茂み', isBoss: false,
        enemies: [
          { name: 'スライム',  emoji: '🟢', hp: 600,  atk: 80,  def: 30,  spd: 50 },
          { name: 'ゴブリン',  emoji: '👺', hp: 1200, atk: 130, def: 60,  spd: 75 }
        ],
        rewards: { coins: [120, 200], exp: [50, 90],
          material: { id: 'fang', chance: 0.45 },
          equipIds: [{ id: 'sword_r', chance: 0.18 }, { id: 'ring_r', chance: 0.15 }]
        },
        firstClear: { crystals: 10 }
      },
      {
        id: '1-3', name: '森の奥地', isBoss: false,
        enemies: [
          { name: 'ゴブリン', emoji: '👺', hp: 1200, atk: 130, def: 60,  spd: 75, element: '土' },
          { name: 'ゴブリン', emoji: '👺', hp: 1200, atk: 130, def: 60,  spd: 75, element: '土' },
          { name: 'ゴブリン', emoji: '👺', hp: 1200, atk: 130, def: 60,  spd: 75, element: '土' }
        ],
        rewards: { coins: [160, 260], exp: [70, 110],
          material: { id: 'fang', chance: 0.55 },
          equipIds: [{ id: 'armor_r', chance: 0.20 }, { id: 'ring_r', chance: 0.20 }]
        },
        firstClear: { crystals: 15 }
      },
      {
        id: '1-4', name: '狼の縄張り', isBoss: false,
        enemies: [
          { name: 'オオカミ', emoji: '🐺', hp: 1800, atk: 200, def: 80,  spd: 130, element: '風' },
          { name: 'オオカミ', emoji: '🐺', hp: 1800, atk: 200, def: 80,  spd: 130, element: '風' },
          { name: 'オオカミ', emoji: '🐺', hp: 1800, atk: 200, def: 80,  spd: 130, element: '風' }
        ],
        rewards: { coins: [200, 320], exp: [90, 140],
          material: { id: 'pelt', chance: 0.6 },
          equipIds: [{ id: 'sword_sr', chance: 0.08 }, { id: 'armor_r', chance: 0.22 }]
        },
        firstClear: { crystals: 15 }
      },
      {
        id: '1-5', name: '【BOSS】古樹の精', isBoss: true,
        enemies: [
          { name: '古樹の精', emoji: '🌳', hp: 12000, atk: 320, def: 220, spd: 45, element: '森',
            skills: [
              { name: '根の縛り', sp: 4, type: 'atk_down',  power: 0.2, description: '蔓で縛り敵の攻撃を下げる' },
              { name: '古樹の怒り', sp: 7, type: 'damage_all', power: 0.9, description: '枝で全体を薙ぎ払う' }
            ]
          }
        ],
        rewards: { coins: [400, 650], exp: [160, 240],
          material: { id: 'bark', chance: 1.0 },
          equipIds: [{ id: 'sword_sr', chance: 0.18 }, { id: 'armor_sr', chance: 0.18 }]
        },
        firstClear: { crystals: 30 }
      }
    ]
  },
  {
    chapter: 2,
    name: '第二章: 魔王の城',
    storyIntro: '古の魔王が残した城が再び力を取り戻しつつある。虚無の帝の尖兵がその城を拠点に勢力を拡大している。',
    stages: [
      {
        id: '2-1', name: '城下の荒野', isBoss: false,
        enemies: [
          { name: '鎧ゴブリン', emoji: '⚔️', hp: 2500,  atk: 260, def: 180, spd: 70 },
          { name: '鎧ゴブリン', emoji: '⚔️', hp: 2500,  atk: 260, def: 180, spd: 70 }
        ],
        rewards: { coins: [300, 480], exp: [120, 180],
          material: { id: 'iron', chance: 0.5 },
          equipIds: [{ id: 'sword_sr', chance: 0.15 }, { id: 'ring_sr', chance: 0.12 }]
        },
        firstClear: { crystals: 15 }
      },
      {
        id: '2-2', name: '城の城門', isBoss: false,
        enemies: [
          { name: '闇の騎士', emoji: '🗡️', hp: 4000, atk: 380, def: 280, spd: 95 },
          { name: '闇の騎士', emoji: '🗡️', hp: 4000, atk: 380, def: 280, spd: 95 }
        ],
        rewards: { coins: [400, 620], exp: [150, 220],
          material: { id: 'iron', chance: 0.6 },
          equipIds: [{ id: 'armor_sr', chance: 0.15 }, { id: 'ring_sr', chance: 0.15 }]
        },
        firstClear: { crystals: 20 }
      },
      {
        id: '2-3', name: '【BOSS】魔王', isBoss: true,
        enemies: [
          { name: '魔王', emoji: '👿', hp: 30000, atk: 550, def: 380, spd: 110, element: '闇',
            skills: [
              { name: '魔王の威圧', sp: 3, type: 'atk_down',     power: 0.25, description: '全体の戦意を砕く' },
              { name: '闇の爆撃',   sp: 6, type: 'damage_all',   power: 1.1,  description: '闇の力で全体を爆撃' },
              { name: '魔力吸収',   sp: 9, type: 'drain',        power: 1.8,  description: '敵のHPを奪い取る' }
            ]
          }
        ],
        rewards: { coins: [900, 1400], exp: [350, 500],
          material: { id: 'darkstone', chance: 1.0 },
          equipIds: [{ id: 'sword_sr', chance: 0.25 }, { id: 'armor_sr', chance: 0.25 }, { id: 'ring_sr', chance: 0.20 }]
        },
        firstClear: { crystals: 50 }
      }
    ]
  },

  // ─── 第三章 ─────────────────────────────────────────────────────────────

  {
    chapter: 3,
    name: '第三章: 妖精の神殿',
    storyIntro: '三大国が覇権を争った古の戦場には、今も怨念が渦巻いている。英雄たちは歴史の傷跡を超えて先へ進まなければならない。',
    stages: [
      {
        id: '3-1', name: '神殿の入口', isBoss: false,
        enemies: [
          { name: '森の妖精', emoji: '🧚', hp: 5000, atk: 450, def: 300, spd: 140 },
          { name: '森の妖精', emoji: '🧚', hp: 5000, atk: 450, def: 300, spd: 140 }
        ],
        rewards: { coins: [500, 750], exp: [200, 300],
          material: { id: 'crystaldust', chance: 0.5 },
          equipIds: [{ id: 'sword_sr', chance: 0.20 }, { id: 'armor_sr', chance: 0.20 }]
        },
        firstClear: { crystals: 20 }
      },
      {
        id: '3-2', name: '祭壇の回廊', isBoss: false,
        enemies: [
          { name: '石像兵', emoji: '🗿', hp: 8000, atk: 500, def: 450, spd: 60 },
          { name: '石像兵', emoji: '🗿', hp: 8000, atk: 500, def: 450, spd: 60 },
          { name: '森の妖精', emoji: '🧚', hp: 5000, atk: 450, def: 300, spd: 140 }
        ],
        rewards: { coins: [600, 900], exp: [240, 360],
          material: { id: 'crystaldust', chance: 0.55 },
          equipIds: [{ id: 'ring_sr', chance: 0.20 }, { id: 'sword_ssr', chance: 0.05 }]
        },
        firstClear: { crystals: 20 }
      },
      {
        id: '3-3', name: '封印の間', isBoss: false,
        enemies: [
          { name: '封印の守護者', emoji: '🔮', hp: 12000, atk: 580, def: 420, spd: 100 },
          { name: '封印の守護者', emoji: '🔮', hp: 12000, atk: 580, def: 420, spd: 100 }
        ],
        rewards: { coins: [700, 1050], exp: [280, 420],
          material: { id: 'crystaldust', chance: 0.6 },
          equipIds: [{ id: 'armor_ssr', chance: 0.05 }, { id: 'armor_sr', chance: 0.25 }]
        },
        firstClear: { crystals: 25 }
      },
      {
        id: '3-4', name: '光の試練', isBoss: false,
        enemies: [
          { name: '光の精霊', emoji: '✨', hp: 10000, atk: 620, def: 380, spd: 160 },
          { name: '光の精霊', emoji: '✨', hp: 10000, atk: 620, def: 380, spd: 160 },
          { name: '光の精霊', emoji: '✨', hp: 10000, atk: 620, def: 380, spd: 160 }
        ],
        rewards: { coins: [800, 1200], exp: [320, 480],
          material: { id: 'crystaldust', chance: 0.65 },
          equipIds: [{ id: 'sword_ssr', chance: 0.06 }, { id: 'ring_sr', chance: 0.25 }]
        },
        firstClear: { crystals: 25 }
      },
      {
        id: '3-5', name: '神殿の深部', isBoss: false,
        enemies: [
          { name: '大妖精', emoji: '🧝', hp: 20000, atk: 680, def: 500, spd: 130 },
          { name: '石像兵', emoji: '🗿', hp: 8000, atk: 500, def: 450, spd: 60 },
          { name: '石像兵', emoji: '🗿', hp: 8000, atk: 500, def: 450, spd: 60 }
        ],
        rewards: { coins: [900, 1350], exp: [360, 540],
          material: { id: 'crystaldust', chance: 0.7 },
          equipIds: [{ id: 'sword_ssr', chance: 0.07 }, { id: 'armor_ssr', chance: 0.07 }]
        },
        firstClear: { crystals: 30 }
      },
      {
        id: '3-6', name: '【BOSS】古の女神', isBoss: true,
        enemies: [
          { name: '古の女神', emoji: '🌸', hp: 80000, atk: 780, def: 600, spd: 120, element: '光',
            skills: [
              { name: '聖なる裁き', sp: 4, type: 'damage_all',   power: 1.2, description: '神の裁きが全体に降り注ぐ' },
              { name: '女神の癒し', sp: 6, type: 'heal_single',  power: 2.0, description: '自身のHPを大回復' },
              { name: '神罰',       sp: 8, type: 'damage_single', power: 3.5, description: '選ばれし者に神の罰を下す' }
            ]
          }
        ],
        rewards: { coins: [1500, 2200], exp: [600, 900],
          material: { id: 'goddessfeather', chance: 1.0 },
          equipIds: [{ id: 'sword_ssr', chance: 0.20 }, { id: 'armor_ssr', chance: 0.20 }, { id: 'ring_ssr', chance: 0.15 }]
        },
        firstClear: { crystals: 80 }
      }
    ]
  },

  // ─── 第四章 ─────────────────────────────────────────────────────────────

  {
    chapter: 4,
    name: '第四章: 竜の巣窟',
    storyIntro: '竜神の霊峰には、ファフナーが眠り続けた三百年の秘密が眠っている。',
    stages: [
      {
        id: '4-1', name: '溶岩の渓谷', isBoss: false,
        enemies: [
          { name: 'ワイバーン', emoji: '🦎', hp: 15000, atk: 800, def: 550, spd: 110, element: '炎' },
          { name: 'ワイバーン', emoji: '🦎', hp: 15000, atk: 800, def: 550, spd: 110, element: '炎' }
        ],
        rewards: { coins: [1000, 1500], exp: [400, 600],
          material: { id: 'dragonscale', chance: 0.5 },
          equipIds: [{ id: 'armor_ssr', chance: 0.10 }, { id: 'sword_ssr', chance: 0.10 }]
        },
        firstClear: { crystals: 25 }
      },
      {
        id: '4-2', name: '炎の洞窟', isBoss: false,
        enemies: [
          { name: 'ファイアドレイク', emoji: '🔥', hp: 20000, atk: 900, def: 600, spd: 95 },
          { name: 'ワイバーン',       emoji: '🦎', hp: 15000, atk: 800, def: 550, spd: 110 }
        ],
        rewards: { coins: [1200, 1800], exp: [480, 720],
          material: { id: 'dragonscale', chance: 0.55 },
          equipIds: [{ id: 'ring_ssr', chance: 0.10 }, { id: 'sword_ssr', chance: 0.12 }]
        },
        firstClear: { crystals: 25 }
      },
      {
        id: '4-3', name: '竜の眠る丘', isBoss: false,
        enemies: [
          { name: '古竜', emoji: '🐉', hp: 35000, atk: 950, def: 700, spd: 80, element: '炎' },
          { name: 'ワイバーン', emoji: '🦎', hp: 15000, atk: 800, def: 550, spd: 110, element: '炎' }
        ],
        rewards: { coins: [1400, 2100], exp: [560, 840],
          material: { id: 'dragonscale', chance: 0.6 },
          equipIds: [{ id: 'armor_ssr', chance: 0.12 }, { id: 'ring_ssr', chance: 0.12 }]
        },
        firstClear: { crystals: 30 }
      },
      {
        id: '4-4', name: '禁断の炎窟', isBoss: false,
        enemies: [
          { name: '爆炎竜', emoji: '💥', hp: 28000, atk: 1050, def: 680, spd: 120 },
          { name: '爆炎竜', emoji: '💥', hp: 28000, atk: 1050, def: 680, spd: 120 }
        ],
        rewards: { coins: [1600, 2400], exp: [640, 960],
          material: { id: 'dragonscale', chance: 0.65 },
          equipIds: [{ id: 'sword_ssr', chance: 0.15 }, { id: 'armor_ssr', chance: 0.15 }]
        },
        firstClear: { crystals: 30 }
      },
      {
        id: '4-5', name: '竜王の間', isBoss: false,
        enemies: [
          { name: '竜王の近衛', emoji: '🛡️', hp: 40000, atk: 900, def: 900, spd: 70 },
          { name: '竜王の近衛', emoji: '🛡️', hp: 40000, atk: 900, def: 900, spd: 70 },
          { name: '古竜',       emoji: '🐉', hp: 35000, atk: 950, def: 700, spd: 80 }
        ],
        rewards: { coins: [1800, 2700], exp: [720, 1080],
          material: { id: 'dragonscale', chance: 0.7 },
          equipIds: [{ id: 'ring_ssr', chance: 0.15 }, { id: 'sword_ssr', chance: 0.18 }]
        },
        firstClear: { crystals: 35 }
      },
      {
        id: '4-6', name: '【BOSS】竜王ヴァルグ', isBoss: true,
        enemies: [
          { name: '竜王ヴァルグ', emoji: '🐲', hp: 150000, atk: 2600, def: 1100, spd: 140, element: '炎',
            skills: [
              { name: '竜の咆哮',   sp: 3, type: 'atk_down',    power: 0.3,  description: '雄叫びで全体の攻撃力を下げる' },
              { name: '業火の息',   sp: 5, type: 'damage_all',  power: 1.3,  description: '炎のブレスで全体を焼き尽くす' },
              { name: '竜王の爪',   sp: 7, type: 'damage_single', power: 4.0, description: '巨大な爪で単体を引き裂く' },
              { name: '竜鱗の鎧',   sp: 9, type: 'defense_buff', power: 0.5, description: '鱗を逆立て防御力を大幅強化' }
            ]
          }
        ],
        rewards: { coins: [3000, 4500], exp: [1200, 1800],
          material: { id: 'dragonscale', chance: 1.0 },
          equipIds: [{ id: 'sword_ssr', chance: 0.30 }, { id: 'armor_ssr', chance: 0.30 }, { id: 'ring_ssr', chance: 0.25 }]
        },
        firstClear: { crystals: 120 }
      }
    ]
  },

  // ─── 第五章 ─────────────────────────────────────────────────────────────

  {
    chapter: 5,
    name: '第五章: 天空の聖域',
    storyIntro: '神々の領域、天空の聖域。ここで天帝アルカナは虚無の帝を封じた——その真実が明かされる。',
    stages: [
      {
        id: '5-1', name: '雲上の道', isBoss: false,
        enemies: [
          { name: '天空騎士', emoji: '⚔️', hp: 25000, atk: 1100, def: 800, spd: 130 },
          { name: '天空騎士', emoji: '⚔️', hp: 25000, atk: 1100, def: 800, spd: 130 }
        ],
        rewards: { coins: [2000, 3000], exp: [800, 1200],
          material: { id: 'holywater', chance: 0.5 },
          equipIds: [{ id: 'sword_ssr', chance: 0.18 }, { id: 'armor_ssr', chance: 0.18 }]
        },
        firstClear: { crystals: 30 }
      },
      {
        id: '5-2', name: '光の神殿', isBoss: false,
        enemies: [
          { name: '浄化天使', emoji: '👼', hp: 30000, atk: 1000, def: 850, spd: 150 },
          { name: '浄化天使', emoji: '👼', hp: 30000, atk: 1000, def: 850, spd: 150 },
          { name: '天空騎士', emoji: '⚔️', hp: 25000, atk: 1100, def: 800, spd: 130 }
        ],
        rewards: { coins: [2400, 3600], exp: [960, 1440],
          material: { id: 'holywater', chance: 0.55 },
          equipIds: [{ id: 'ring_ssr', chance: 0.18 }, { id: 'sword_ssr', chance: 0.20 }]
        },
        firstClear: { crystals: 30 }
      },
      {
        id: '5-3', name: '堕天の回廊', isBoss: false,
        enemies: [
          { name: '堕天使', emoji: '😈', hp: 45000, atk: 1300, def: 900, spd: 145 },
          { name: '堕天使', emoji: '😈', hp: 45000, atk: 1300, def: 900, spd: 145 }
        ],
        rewards: { coins: [2800, 4200], exp: [1120, 1680],
          material: { id: 'holywater', chance: 0.6 },
          equipIds: [{ id: 'armor_ssr', chance: 0.22 }, { id: 'ring_ssr', chance: 0.20 }]
        },
        firstClear: { crystals: 35 }
      },
      {
        id: '5-4', name: '聖域の守護陣', isBoss: false,
        enemies: [
          { name: '大天使', emoji: '🌟', hp: 60000, atk: 1400, def: 1000, spd: 120 },
          { name: '堕天使', emoji: '😈', hp: 45000, atk: 1300, def: 900,  spd: 145 }
        ],
        rewards: { coins: [3200, 4800], exp: [1280, 1920],
          material: { id: 'holywater', chance: 0.65 },
          equipIds: [{ id: 'sword_ssr', chance: 0.25 }, { id: 'armor_ssr', chance: 0.25 }]
        },
        firstClear: { crystals: 40 }
      },
      {
        id: '5-5', name: '【最終BOSS】天空の守護神', isBoss: true,
        enemies: [
          { name: '天空の守護神', emoji: '⚡', hp: 380000, atk: 3200, def: 1500, spd: 165, element: '雷',
            skills: [
              { name: '天罰',       sp: 2, type: 'damage_single', power: 3.5,  description: '神の裁きを一点に集中させる' },
              { name: '神聖波動',   sp: 5, type: 'damage_all',    power: 1.5,  description: '聖なる衝撃波で全体を薙ぎ払う' },
              { name: '天空回生',   sp: 7, type: 'heal_single',   power: 3.0,  description: '天の力で大回復する' },
              { name: '天地崩壊',   sp: 10, type: 'damage_all',   power: 2.5,  description: '全てを消し去る究極の大技' },
              { name: '加護の光',   sp: 4, type: 'atk_buff',      power: 0.4,  description: '天の加護で攻撃力が大幅上昇' }
            ]
          }
        ],
        rewards: { coins: [6000, 9000], exp: [2400, 3600],
          material: { id: 'holywater', chance: 1.0 },
          equipIds: [{ id: 'sword_ssr', chance: 0.40 }, { id: 'armor_ssr', chance: 0.40 }, { id: 'ring_ssr', chance: 0.35 }]
        },
        firstClear: { crystals: 200 }
      }
    ]
  },

  // ─── 第六章 ─────────────────────────────────────────────────────────────
  {
    chapter: 6,
    name: '第六章: 幻夢の回廊',
    storyIntro: '幻と記憶が交差する迷宮。英雄たちは自らの心の闇と向き合いながら最深部を目指す。',
    stages: [
      {
        id: '6-1', name: '夢の入口', isBoss: false,
        enemies: [
          { name: 'ゆめスライム', emoji: '🌈', hp: 35000, atk: 1200, def: 900,  spd: 140 },
          { name: 'ゆめスライム', emoji: '🌈', hp: 35000, atk: 1200, def: 900,  spd: 140 },
          { name: 'ほしくまさん', emoji: '🐻', hp: 28000, atk: 1100, def: 800,  spd: 100 }
        ],
        rewards: { coins: [3000, 4500], exp: [1200, 1800],
          material: { id: 'dreamdust', chance: 0.5 },
          equipIds: [{ id: 'sword_ssr', chance: 0.22 }, { id: 'armor_ssr', chance: 0.22 }]
        },
        firstClear: { crystals: 40 }
      },
      {
        id: '6-2', name: '菓子の迷宮', isBoss: false,
        enemies: [
          { name: 'キャンディゴースト', emoji: '👻', hp: 40000, atk: 1300, def: 950, spd: 160 },
          { name: 'キャンディゴースト', emoji: '👻', hp: 40000, atk: 1300, def: 950, spd: 160 },
          { name: 'ふわっち',           emoji: '☁️', hp: 50000, atk: 1000, def: 1100, spd: 80 }
        ],
        rewards: { coins: [3600, 5400], exp: [1440, 2160],
          material: { id: 'dreamdust', chance: 0.55 },
          equipIds: [{ id: 'ring_ssr', chance: 0.22 }, { id: 'sword_ssr', chance: 0.25 }]
        },
        firstClear: { crystals: 40 }
      },
      {
        id: '6-3', name: '影の戦場', isBoss: false,
        enemies: [
          { name: 'デスナイト',   emoji: '☠️', hp: 60000, atk: 1600, def: 1100, spd: 120 },
          { name: 'デスナイト',   emoji: '☠️', hp: 60000, atk: 1600, def: 1100, spd: 120 },
          { name: '影狼王',       emoji: '🐺', hp: 55000, atk: 1800, def: 800,  spd: 200 }
        ],
        rewards: { coins: [4200, 6300], exp: [1680, 2520],
          material: { id: 'dreamdust', chance: 0.6 },
          equipIds: [{ id: 'armor_ssr', chance: 0.28 }, { id: 'ring_ssr', chance: 0.25 }]
        },
        firstClear: { crystals: 45 }
      },
      {
        id: '6-4', name: '幻の庭園', isBoss: false,
        enemies: [
          { name: 'のろわれた人形', emoji: '🪆', hp: 45000, atk: 1700, def: 1000, spd: 150 },
          { name: 'のろわれた人形', emoji: '🪆', hp: 45000, atk: 1700, def: 1000, spd: 150 },
          { name: '幻影の剣士',     emoji: '⚔️', hp: 80000, atk: 1900, def: 1200, spd: 170 }
        ],
        rewards: { coins: [4800, 7200], exp: [1920, 2880],
          material: { id: 'dreamdust', chance: 0.65 },
          equipIds: [{ id: 'sword_ssr', chance: 0.30 }, { id: 'armor_ssr', chance: 0.30 }]
        },
        firstClear: { crystals: 50 }
      },
      {
        id: '6-5', name: '深淵の霧', isBoss: false,
        enemies: [
          { name: '夢喰い',       emoji: '👁️', hp: 90000, atk: 2000, def: 1300, spd: 160 },
          { name: '深淵の守護者', emoji: '🌑', hp: 100000, atk: 1800, def: 1500, spd: 90 },
          { name: 'デスナイト',   emoji: '☠️', hp: 60000,  atk: 1600, def: 1100, spd: 120 }
        ],
        rewards: { coins: [5500, 8200], exp: [2200, 3300],
          material: { id: 'dreamdust', chance: 0.7 },
          equipIds: [{ id: 'ring_ssr', chance: 0.32 }, { id: 'sword_ssr', chance: 0.32 }]
        },
        firstClear: { crystals: 55 }
      },
      {
        id: '6-6', name: '【最終BOSS】夢魔女王リリス', isBoss: true,
        enemies: [
          { name: '夢魔女王リリス', emoji: '🦋', hp: 580000, atk: 5200, def: 2100, spd: 225, element: '夢',
            skills: [
              { name: '夢の誘惑',     sp: 2, type: 'atk_down',    power: 0.35, description: '甘い夢で全体の攻撃力を下げる' },
              { name: '蝶の乱舞',     sp: 4, type: 'damage_all',  power: 1.4,  description: '無数の蝶が全体を切り裂く' },
              { name: '幻夢回復',     sp: 6, type: 'heal_single', power: 3.5,  description: '夢の力で大回復' },
              { name: '深淵の叫び',   sp: 7, type: 'damage_single', power: 4.5, description: '選ばれし者に全力の一撃' },
              { name: '夢世界の崩壊', sp: 10, type: 'damage_all', power: 2.8,  description: '夢ごと全てを消し去る究極技' }
            ]
          }
        ],
        rewards: { coins: [9000, 13000], exp: [3600, 5400],
          material: { id: 'dreamdust', chance: 1.0 },
          equipIds: [{ id: 'sword_ssr', chance: 0.50 }, { id: 'armor_ssr', chance: 0.50 }, { id: 'ring_ssr', chance: 0.45 }]
        },
        firstClear: { crystals: 300 }
      }
    ]
  },

  // ─── 第七章 ─────────────────────────────────────────────────────────────
  {
    chapter: 7,
    name: '第七章: 紅炎帝国',
    storyIntro: '三国志の覇者・紅炎帝国の首都へ。軍師グリモワールの密書により、帝国皇帝が虚無の帝に操られていることが判明した。英雄たちは帝国の内部へと乗り込む。',
    stages: [
      {
        id: '7-1', name: '大陸の関所', isBoss: false,
        enemies: [
          { name: '帝国衛兵',   emoji: '🛡️', hp: 70000,  atk: 1940, def: 1400, spd: 120, element: '炎' },
          { name: '帝国衛兵',   emoji: '🛡️', hp: 70000,  atk: 1940, def: 1400, spd: 120, element: '炎' },
          { name: '帝国衛兵長', emoji: '⚔️', hp: 90000,  atk: 2200, def: 1600, spd: 110, element: '土' }
        ],
        rewards: { coins: [5000, 7500], exp: [2000, 3000],
          material: { id: 'imperialstone', chance: 0.5 },
          equipIds: [{ id: 'sword_ssr', chance: 0.25 }, { id: 'armor_ssr', chance: 0.25 }]
        },
        firstClear: { crystals: 50 }
      },
      {
        id: '7-2', name: '帝国の首都', isBoss: false,
        enemies: [
          { name: '帝国精鋭騎士', emoji: '⚔️', hp: 85000,  atk: 2110, def: 1500, spd: 130, element: '炎' },
          { name: '帝国精鋭騎士', emoji: '⚔️', hp: 85000,  atk: 2110, def: 1500, spd: 130, element: '炎' },
          { name: '炎の将軍',     emoji: '🔥', hp: 120000, atk: 2460, def: 1700, spd: 105 }
        ],
        rewards: { coins: [6000, 9000], exp: [2400, 3600],
          material: { id: 'imperialstone', chance: 0.55 },
          equipIds: [{ id: 'spear_ssr', chance: 0.22 }, { id: 'armor_ssr', chance: 0.25 }]
        },
        firstClear: { crystals: 55 }
      },
      {
        id: '7-3', name: '赤壁の古戦場', isBoss: false,
        enemies: [
          { name: '赤壁の亡霊', emoji: '👻', hp: 80000, atk: 2290, def: 1300, spd: 140, element: '炎' },
          { name: '赤壁の亡霊', emoji: '👻', hp: 80000, atk: 2290, def: 1300, spd: 140, element: '炎' },
          { name: '赤壁の亡霊', emoji: '👻', hp: 80000, atk: 2290, def: 1300, spd: 140, element: '炎' }
        ],
        rewards: { coins: [7000, 10500], exp: [2800, 4200],
          material: { id: 'imperialstone', chance: 0.6 },
          equipIds: [{ id: 'axe_ssr', chance: 0.22 }, { id: 'ring_ssr', chance: 0.25 }]
        },
        firstClear: { crystals: 60 }
      },
      {
        id: '7-4', name: '天帝神殿の遺跡', isBoss: false,
        enemies: [
          { name: '遺跡の守護像', emoji: '🗿', hp: 100000, atk: 2380, def: 2000, spd: 80,  element: '土' },
          { name: '遺跡の守護像', emoji: '🗿', hp: 100000, atk: 2380, def: 2000, spd: 80,  element: '土' },
          { name: '古代ゴーレム', emoji: '🪨', hp: 150000, atk: 2640, def: 2200, spd: 60,  element: '土' }
        ],
        rewards: { coins: [8000, 12000], exp: [3200, 4800],
          material: { id: 'imperialstone', chance: 0.65 },
          equipIds: [{ id: 'sword_ssr', chance: 0.30 }, { id: 'armor_ssr', chance: 0.30 }]
        },
        firstClear: { crystals: 65 }
      },
      {
        id: '7-5', name: '操られし皇帝の玉座', isBoss: false,
        enemies: [
          { name: '帝国近衛騎士', emoji: '⚔️', hp: 110000, atk: 2550, def: 1900, spd: 135, element: '炎' },
          { name: '帝国近衛騎士', emoji: '⚔️', hp: 110000, atk: 2550, def: 1900, spd: 135, element: '炎' },
          { name: '堕ちた将軍',   emoji: '😈', hp: 160000, atk: 2820, def: 1800, spd: 120, element: '闇' }
        ],
        rewards: { coins: [9000, 13500], exp: [3600, 5400],
          material: { id: 'imperialstone', chance: 0.7 },
          equipIds: [{ id: 'trident_ssr', chance: 0.28 }, { id: 'robe_ssr', chance: 0.28 }]
        },
        firstClear: { crystals: 70 }
      },
      {
        id: '7-6', name: '【BOSS】虚無に堕ちし紅炎皇帝', isBoss: true,
        enemies: [
          { name: '虚無に堕ちし紅炎皇帝', emoji: '👑', hp: 690000, atk: 5100, def: 2500, spd: 200, element: '闇',
            skills: [
              { name: '虚無の炎',    sp: 3,  type: 'damage_single', power: 4.2, description: '虚無の力で強化された炎が単体を焼く' },
              { name: '覇道の咆哮',  sp: 5,  type: 'damage_all',    power: 1.8, description: '皇帝の怒りが全体を揺さぶる' },
              { name: '帝国回生',    sp: 7,  type: 'heal_single',   power: 4.0, description: '虚無の力で大回復' },
              { name: '天地崩壊・改', sp: 10, type: 'damage_all',   power: 3.2, description: '全てを消し去る虚無強化版' },
              { name: '虚無の支配',  sp: 6,  type: 'atk_down',      power: 0.4, description: '虚無のオーラで全体の攻撃を弱める' }
            ]
          }
        ],
        rewards: { coins: [12000, 18000], exp: [4800, 7200],
          material: { id: 'imperialstone', chance: 1.0 },
          equipIds: [{ id: 'sword_ur', chance: 0.20 }, { id: 'armor_ur', chance: 0.20 }, { id: 'ring_ur', chance: 0.18 }]
        },
        firstClear: { crystals: 400 }
      }
    ]
  },

  // ─── 第八章 ─────────────────────────────────────────────────────────────
  {
    chapter: 8,
    name: '第八章: 碧海の嵐',
    storyIntro: '虚無の帝の力が大海を侵食し始めた。碧海同盟の海賊王ロン・ジャンの導きで、英雄たちは嵐の海へと乗り出す。深海に眠る古代文明の秘密が、最終決戦の鍵を握っている。',
    stages: [
      {
        id: '8-1', name: '嵐の海峡', isBoss: false,
        enemies: [
          { name: '海賊ゴースト', emoji: '👻', hp: 70400,  atk: 2300, def: 1230, spd: 160, element: '風' },
          { name: '海賊ゴースト', emoji: '👻', hp: 70400,  atk: 2300, def: 1230, spd: 160, element: '風' },
          { name: '嵐の精霊',     emoji: '🌪️', hp: 61600,  atk: 2600, def: 1060, spd: 200, element: '風' }
        ],
        rewards: { coins: [6000, 9000], exp: [2400, 3600],
          material: { id: 'seagem', chance: 0.5 },
          equipIds: [{ id: 'blade_sr', chance: 0.25 }, { id: 'boots_ssr', chance: 0.20 }]
        },
        firstClear: { crystals: 55 }
      },
      {
        id: '8-2', name: '沈没船の墓場', isBoss: false,
        enemies: [
          { name: '骸骨海賊', emoji: '☠️', hp: 66000, atk: 2500, def: 1140, spd: 145, element: '闇' },
          { name: '骸骨海賊', emoji: '☠️', hp: 66000, atk: 2500, def: 1140, spd: 145, element: '闇' },
          { name: '骸骨海賊', emoji: '☠️', hp: 66000, atk: 2500, def: 1140, spd: 145, element: '闇' }
        ],
        rewards: { coins: [7000, 10500], exp: [2800, 4200],
          material: { id: 'seagem', chance: 0.55 },
          equipIds: [{ id: 'trident_ssr', chance: 0.25 }, { id: 'robe_ssr', chance: 0.22 }]
        },
        firstClear: { crystals: 60 }
      },
      {
        id: '8-3', name: '海賊の楽園', isBoss: false,
        enemies: [
          { name: '凶悪海賊',   emoji: '🏴‍☠️', hp: 79200,  atk: 2700, def: 1320, spd: 155, element: '風' },
          { name: '凶悪海賊',   emoji: '🏴‍☠️', hp: 79200,  atk: 2700, def: 1320, spd: 155, element: '風' },
          { name: '海賊船長',   emoji: '⚓',   hp: 114400, atk: 3000, def: 1410, spd: 140, element: '水' }
        ],
        rewards: { coins: [8000, 12000], exp: [3200, 4800],
          material: { id: 'seagem', chance: 0.6 },
          equipIds: [{ id: 'bow_ssr', chance: 0.25 }, { id: 'earring_ssr', chance: 0.22 }]
        },
        firstClear: { crystals: 65 }
      },
      {
        id: '8-4', name: '深海の古代都市', isBoss: false,
        enemies: [
          { name: '深海の番人',   emoji: '🦑', hp: 96800,  atk: 2900, def: 1760, spd: 100, element: '水' },
          { name: '深海の番人',   emoji: '🦑', hp: 96800,  atk: 2900, def: 1760, spd: 100, element: '水' },
          { name: '古代機械兵',   emoji: '🤖', hp: 140800, atk: 3200, def: 2020, spd: 75,  element: '土' }
        ],
        rewards: { coins: [9000, 13500], exp: [3600, 5400],
          material: { id: 'seagem', chance: 0.65 },
          equipIds: [{ id: 'staff_ssr', chance: 0.28 }, { id: 'necklace_ssr', chance: 0.25 }]
        },
        firstClear: { crystals: 70 }
      },
      {
        id: '8-5', name: '海王類の縄張り', isBoss: false,
        enemies: [
          { name: '巨大海王類', emoji: '🐋', hp: 176000, atk: 3500, def: 1850, spd: 120, element: '水' },
          { name: '海王類の子', emoji: '🐬', hp: 79200,  atk: 2800, def: 1410, spd: 145, element: '水' },
          { name: '海王類の子', emoji: '🐬', hp: 79200,  atk: 2800, def: 1410, spd: 145, element: '水' }
        ],
        rewards: { coins: [10000, 15000], exp: [4000, 6000],
          material: { id: 'seagem', chance: 0.7 },
          equipIds: [{ id: 'trident_ssr', chance: 0.30 }, { id: 'boots_ssr', chance: 0.28 }]
        },
        firstClear: { crystals: 75 }
      },
      {
        id: '8-6', name: '【BOSS】海神リヴァイアサン', isBoss: true,
        enemies: [
          { name: '海神リヴァイアサン', emoji: '🌊', hp: 780000, atk: 6500, def: 2500, spd: 180, element: '水',
            skills: [
              { name: '深海の咆哮',  sp: 2,  type: 'damage_all',    power: 1.6, description: '海底から響く咆哮が全体を揺さぶる' },
              { name: '大波の一撃',  sp: 4,  type: 'damage_single', power: 5.0, description: '巨大な波と共に単体を叩き潰す' },
              { name: '海神回生',    sp: 7,  type: 'heal_single',   power: 3.4, description: '深海の力で大回復' },
              { name: '海嵐乱舞',    sp: 8,  type: 'damage_all',    power: 2.5, description: '嵐と波が入り乱れる全体攻撃' },
              { name: '潮流の支配',  sp: 5,  type: 'atk_down',      power: 0.45, description: '潮の流れを変え全体の動きを鈍らせる' },
              { name: '深淵の波動',  sp: 12, type: 'damage_all',    power: 2.9, description: '深海の全エネルギーを解放する究極技' }
            ]
          }
        ],
        rewards: { coins: [15000, 22000], exp: [6000, 9000],
          material: { id: 'seagem', chance: 1.0 },
          equipIds: [{ id: 'sword_ur', chance: 0.22 }, { id: 'armor_ur', chance: 0.22 }, { id: 'ring_ur', chance: 0.20 }, { id: 'staff_ur', chance: 0.18 }]
        },
        firstClear: { crystals: 500 }
      }
    ]
  }
];

// ─── 装備マスタ ──────────────────────────────────────────────────────────────

const EQUIPMENT_DATA = {

  // ── 武器 R ────────────────────────────────────────────────────────────────
  sword_r: {
    id: 'sword_r', name: '鉄の剣', type: 'weapon', emoji: '⚔️',
    rarity: 'R', stats: { atk: 80 },
    desc: '鉄を打って鍛えた素朴な直剣。見習い冒険者の定番装備。'
  },
  staff_r: {
    id: 'staff_r', name: '見習いの杖', type: 'weapon', emoji: '🪄',
    rarity: 'R', stats: { atk: 60, spd: 10 },
    desc: '魔法学院入学時支給の木製杖。魔力の通りが良い。'
  },
  spear_r: {
    id: 'spear_r', name: '鉄の槍', type: 'weapon', emoji: '🗡️',
    rarity: 'R', stats: { atk: 70, def: 20 },
    desc: '先端に鉄穂をつけた標準的な槍。リーチで相手を制する。'
  },
  axe_r: {
    id: 'axe_r', name: '木こりの斧', type: 'weapon', emoji: '🪓',
    rarity: 'R', stats: { atk: 90 },
    desc: '木を切るための斧を戦場へ。荒削りだが威力は高い。'
  },

  // ── 武器 SR ───────────────────────────────────────────────────────────────
  sword_sr: {
    id: 'sword_sr', name: '銀の剣', type: 'weapon', emoji: '🗡️',
    rarity: 'SR', stats: { atk: 200 },
    desc: '純銀を混ぜた魔物に有効な剣。聖ルシウス王国騎士の標準装備。'
  },
  staff_sr: {
    id: 'staff_sr', name: '魔術師の青杖', type: 'weapon', emoji: '🔮',
    rarity: 'SR', stats: { atk: 170, spd: 25 },
    desc: '青水晶を頂点に据えた杖。魔力の流れを大幅増幅する。'
  },
  blade_sr: {
    id: 'blade_sr', name: '碧海の曲刀', type: 'weapon', emoji: '⚡',
    rarity: 'SR', stats: { atk: 185, spd: 20 },
    desc: '海塩と魚骨の特殊製法で作った曲刀。速さが命。'
  },
  spear_sr: {
    id: 'spear_sr', name: '紅炎の長槍', type: 'weapon', emoji: '🔱',
    rarity: 'SR', stats: { atk: 210, def: 40 },
    desc: '紅炎帝国精鋭の炎紋刻んだ長槍。重厚な一撃。'
  },
  sword_holy_sr: {
    id: 'sword_holy_sr', name: '聖騎士の剣', type: 'weapon', emoji: '✨',
    rarity: 'SR', stats: { atk: 190, hp: 800 },
    desc: '騎士叙任式で授けられる聖別済みの剣。加護を与える。'
  },

  // ── 武器 SSR ──────────────────────────────────────────────────────────────
  sword_ssr: {
    id: 'sword_ssr', name: '真聖剣エクスカリバー', type: 'weapon', emoji: '⚡',
    rarity: 'SSR', stats: { atk: 450, hp: 2000 },
    desc: '岩に刺さること五百年、真の王者のみが引き抜ける光の聖剣。'
  },
  staff_ssr: {
    id: 'staff_ssr', name: '混沌の魔杖', type: 'weapon', emoji: '🌌',
    rarity: 'SSR', stats: { atk: 400, spd: 50 },
    desc: '混沌の力を封じた深紫の杖。使うたびに術者の魂を喰らうと言われる。'
  },
  trident_ssr: {
    id: 'trident_ssr', name: '碧海の三叉槍', type: 'weapon', emoji: '🔱',
    rarity: 'SSR', stats: { atk: 420, def: 80 },
    desc: '海の古神が持つとされる三叉槍。碧海同盟の象徴。'
  },
  axe_ssr: {
    id: 'axe_ssr', name: '業火の戦斧', type: 'weapon', emoji: '🪓',
    rarity: 'SSR', stats: { atk: 480 },
    desc: '竜神の業火を吸収した漆黒の戦斧。一振りで大地を焼く。'
  },
  bow_ssr: {
    id: 'bow_ssr', name: '月弓アルテミス', type: 'weapon', emoji: '🏹',
    rarity: 'SSR', stats: { atk: 380, spd: 80 },
    desc: '月の女神に捧げられた銀の弓。放てば必ず弱点を射抜く。'
  },
  spear_ssr: {
    id: 'spear_ssr', name: '帝国の覇槍', type: 'weapon', emoji: '🔱',
    rarity: 'SSR', stats: { atk: 440, def: 60 },
    desc: '紅炎帝国の覇気を宿した黄金の槍。振るうたびに炎が迸る。'
  },

  // ── 武器 UR ───────────────────────────────────────────────────────────────
  sword_ur: {
    id: 'sword_ur', name: '神滅の剣', type: 'weapon', emoji: '💫',
    rarity: 'UR', stats: { atk: 700, spd: 60 },
    desc: '神をも屠ると伝わる禁断の剣。古の大戦で封印された世界最強の破壊兵器。'
  },
  staff_ur: {
    id: 'staff_ur', name: '虚空の魔杖', type: 'weapon', emoji: '🌑',
    rarity: 'UR', stats: { atk: 650, spd: 100 },
    desc: '虚無を結晶化した魔杖。使うたびに現実が歪む。混沌ニュクスが過去に使用。'
  },

  // ── 武器 LR ───────────────────────────────────────────────────────────────
  sword_lr: {
    id: 'sword_lr', name: '天帝の聖剣', type: 'weapon', emoji: '🌟',
    rarity: 'LR', stats: { atk: 1000, hp: 5000, spd: 80 },
    desc: '天帝アルカナが世界を創った際に振るった原初の聖剣。宇宙の全ての力が宿る。'
  },

  // ── 防具 R ────────────────────────────────────────────────────────────────
  armor_r: {
    id: 'armor_r', name: '革の鎧', type: 'armor', emoji: '🛡️',
    rarity: 'R', stats: { def: 60, hp: 500 },
    desc: '獣の皮を加工した軽装鎧。初心者に最適。'
  },
  robe_r: {
    id: 'robe_r', name: '見習いローブ', type: 'armor', emoji: '👘',
    rarity: 'R', stats: { def: 40, hp: 400, spd: 8 },
    desc: '魔法学院の見習いに支給される薄手のローブ。'
  },
  cloak_r: {
    id: 'cloak_r', name: '漁師の外套', type: 'armor', emoji: '🧥',
    rarity: 'R', stats: { def: 50, hp: 600 },
    desc: '碧海の漁師が潮風から身を守る厚手の外套。'
  },

  // ── 防具 SR ───────────────────────────────────────────────────────────────
  armor_sr: {
    id: 'armor_sr', name: '鋼の鎧', type: 'armor', emoji: '🔰',
    rarity: 'SR', stats: { def: 150, hp: 1500 },
    desc: '頑丈な鋼の騎士鎧。聖ルシウス王国正規騎士に支給。'
  },
  robe_sr: {
    id: 'robe_sr', name: '魔法師のローブ', type: 'armor', emoji: '🌙',
    rarity: 'SR', stats: { def: 110, hp: 1200, spd: 20 },
    desc: '月夜色に染められた高級ローブ。魔力を増幅する縫い目入り。'
  },
  coat_sr: {
    id: 'coat_sr', name: '海賊のコート', type: 'armor', emoji: '⚓',
    rarity: 'SR', stats: { def: 130, hp: 1400, spd: 15 },
    desc: '碧海の海賊が好む深紺のコート。自由と冒険の象徴。'
  },
  mantle_sr: {
    id: 'mantle_sr', name: '覇者の外套', type: 'armor', emoji: '🔥',
    rarity: 'SR', stats: { def: 140, hp: 1600 },
    desc: '紅炎帝国の将軍が纏う深紅の外套。これを纏う者の前では敵が気圧される。'
  },

  // ── 防具 SSR ──────────────────────────────────────────────────────────────
  armor_ssr: {
    id: 'armor_ssr', name: '天空の鎧', type: 'armor', emoji: '🌟',
    rarity: 'SSR', stats: { def: 380, hp: 4000 },
    desc: '天空の聖域で神が鍛えた守護鎧。着込むと神の加護が宿る。'
  },
  robe_ssr: {
    id: 'robe_ssr', name: '月の法衣', type: 'armor', emoji: '🌌',
    rarity: 'SSR', stats: { def: 320, hp: 3500, spd: 40 },
    desc: '月の女神が織ったとされる法衣。夜に星のように輝き、魔力を極限まで引き出す。'
  },
  dragonscale_armor_ssr: {
    id: 'dragonscale_armor_ssr', name: '竜鱗の鎧', type: 'armor', emoji: '🐉',
    rarity: 'SSR', stats: { def: 420, hp: 4500 },
    desc: '竜王ファフナーの脱皮鱗で鍛えた鎧。炎を完全無効化。'
  },

  // ── 防具 UR ───────────────────────────────────────────────────────────────
  armor_ur: {
    id: 'armor_ur', name: '聖王の胸甲', type: 'armor', emoji: '⚜️',
    rarity: 'UR', stats: { def: 600, hp: 7000 },
    desc: '伝説の聖王が着用した黄金の胸甲。不死の守護が宿る。'
  },
  robe_ur: {
    id: 'robe_ur', name: '虚空の法衣', type: 'armor', emoji: '🌑',
    rarity: 'UR', stats: { def: 520, hp: 6000, spd: 60 },
    desc: 'あらゆる魔法を半減させる加護が宿る漆黒の法衣。'
  },

  // ── 防具 LR ───────────────────────────────────────────────────────────────
  armor_lr: {
    id: 'armor_lr', name: '天帝の光衣', type: 'armor', emoji: '☀️',
    rarity: 'LR', stats: { def: 900, hp: 12000, spd: 50 },
    desc: '天帝アルカナが纏っていた原初の光の衣。宇宙の全ダメージを吸収する究極防具。'
  },

  // ── アクセサリー R ────────────────────────────────────────────────────────
  ring_r: {
    id: 'ring_r', name: '速さの指輪', type: 'accessory', emoji: '💍',
    rarity: 'R', stats: { spd: 20 },
    desc: '風の魔法が宿る指輪。着けると体が軽くなる。'
  },
  necklace_r: {
    id: 'necklace_r', name: '護符のペンダント', type: 'accessory', emoji: '🧿',
    rarity: 'R', stats: { hp: 800, def: 30 },
    desc: '旅商人から買える一般的な護符。魔物の爪から身を守る。'
  },
  boots_r: {
    id: 'boots_r', name: '軽革の靴', type: 'accessory', emoji: '👟',
    rarity: 'R', stats: { spd: 25, hp: 300 },
    desc: '軽革製の靴。長距離移動も疲れにくく、機動力を高める。'
  },

  // ── アクセサリー SR ───────────────────────────────────────────────────────
  ring_sr: {
    id: 'ring_sr', name: '魔法の指輪', type: 'accessory', emoji: '✨',
    rarity: 'SR', stats: { atk: 100, spd: 30 },
    desc: '複数の魔力結晶が嵌まった指輪。術師と剣士どちらの力も引き出す。'
  },
  necklace_sr: {
    id: 'necklace_sr', name: '竜眼のネックレス', type: 'accessory', emoji: '🔮',
    rarity: 'SR', stats: { atk: 120, hp: 1500 },
    desc: '竜の眼球を模した宝石のネックレス。竜の視力を宿す。'
  },
  helmet_sr: {
    id: 'helmet_sr', name: '銀の兜', type: 'accessory', emoji: '⛑️',
    rarity: 'SR', stats: { def: 120, hp: 1800 },
    desc: '銀細工の精緻な兜。致命打を防ぐ加護紋が刻まれている。'
  },
  boots_sr: {
    id: 'boots_sr', name: '風の靴', type: 'accessory', emoji: '💨',
    rarity: 'SR', stats: { spd: 55, hp: 800 },
    desc: '風精霊が宿る靴。地面を蹴るたびに瞬間加速が可能。'
  },
  orb_sr: {
    id: 'orb_sr', name: '魔力の宝珠', type: 'accessory', emoji: '🔵',
    rarity: 'SR', stats: { atk: 130, spd: 20 },
    desc: '純粋な魔力を結晶化した宝珠。術師の威力を大幅増加。'
  },
  earring_sr: {
    id: 'earring_sr', name: '嵐の耳飾り', type: 'accessory', emoji: '💧',
    rarity: 'SR', stats: { atk: 110, spd: 40 },
    desc: '碧海の嵐の力を宿した耳飾り。体が電気を帯びたように鋭くなる。'
  },
  belt_sr: {
    id: 'belt_sr', name: '力の腰帯', type: 'accessory', emoji: '🟤',
    rarity: 'SR', stats: { atk: 140, def: 60 },
    desc: '紅炎帝国武人が好む革製の腰帯。締めると戦意が高まる。'
  },

  // ── アクセサリー SSR ──────────────────────────────────────────────────────
  ring_ssr: {
    id: 'ring_ssr', name: '竜王の指輪', type: 'accessory', emoji: '💫',
    rarity: 'SSR', stats: { atk: 200, spd: 60 },
    desc: '竜王ファフナーの力が結晶。着けた瞬間体の奥底から炎が湧き上がる。'
  },
  necklace_ssr: {
    id: 'necklace_ssr', name: '女神の守護印', type: 'accessory', emoji: '🌟',
    rarity: 'SSR', stats: { hp: 5000, def: 200 },
    desc: '古の女神が残した神聖な印章。死の瀬戸際で一度だけ命を救うと言われる。'
  },
  helmet_ssr: {
    id: 'helmet_ssr', name: '聖騎士の兜', type: 'accessory', emoji: '🏆',
    rarity: 'SSR', stats: { def: 250, hp: 3500 },
    desc: '白十字騎士団最精鋭に与えられる純銀の兜。不敗の加護を持つ。'
  },
  boots_ssr: {
    id: 'boots_ssr', name: '碧海の霊靴', type: 'accessory', emoji: '🌊',
    rarity: 'SSR', stats: { spd: 90, hp: 2000 },
    desc: '碧海の精霊が宿る神秘の靴。水面を走ることさえ可能にする。'
  },
  orb_ssr: {
    id: 'orb_ssr', name: '混沌の宝珠', type: 'accessory', emoji: '🌑',
    rarity: 'SSR', stats: { atk: 260, spd: 50 },
    desc: '混沌ニュクスの力の欠片が宿る漆黒の宝珠。次元の歪みを感じる禁断の宝具。'
  },
  earring_ssr: {
    id: 'earring_ssr', name: '星の耳飾り', type: 'accessory', emoji: '⭐',
    rarity: 'SSR', stats: { atk: 220, hp: 2500 },
    desc: '夜空の星から力を集めた耳飾り。夜の戦場で輝きが増す。'
  },
  bracelet_ssr: {
    id: 'bracelet_ssr', name: '竜骨の腕輪', type: 'accessory', emoji: '🐲',
    rarity: 'SSR', stats: { atk: 240, def: 100 },
    desc: '竜王の骨を加工した腕輪。竜の不滅の魂が宿り戦意を最大に引き出す。'
  },
  belt_ssr: {
    id: 'belt_ssr', name: '竜王の腰帯', type: 'accessory', emoji: '🔥',
    rarity: 'SSR', stats: { atk: 230, def: 120, hp: 2000 },
    desc: '竜王の鱗を編んだ腰帯。炎の加護が体中を巡り全攻撃の威力を高める。'
  },

  // ── アクセサリー UR ───────────────────────────────────────────────────────
  ring_ur: {
    id: 'ring_ur', name: '神代の指輪', type: 'accessory', emoji: '🌙',
    rarity: 'UR', stats: { atk: 350, spd: 100 },
    desc: '神代時代に鍛えられた七つの指輪の一つ。宇宙の法則を書き換える力が宿る。'
  },
  necklace_ur: {
    id: 'necklace_ur', name: '天帝の首飾り', type: 'accessory', emoji: '☀️',
    rarity: 'UR', stats: { hp: 9000, def: 350 },
    desc: '天帝アルカナが封印の儀式に使った首飾り。世界の均衡を保つ力が宿る。'
  },

  // ── アクセサリー LR ───────────────────────────────────────────────────────
  ring_lr: {
    id: 'ring_lr', name: '創世の指輪', type: 'accessory', emoji: '🌈',
    rarity: 'LR', stats: { atk: 500, spd: 150, hp: 8000 },
    desc: '天帝アルカナが世界を創った際に用いた究極の指輪。現実を書き換える力が宿る最強の装飾品。'
  }
};

// ─── 素材マスタ ──────────────────────────────────────────────────────────────

const MATERIALS_DATA = {
  herb:          { id: 'herb',          name: '薬草',             emoji: '🌿', desc: '基本的な回復素材' },
  fang:          { id: 'fang',          name: 'キバ',             emoji: '🦷', desc: '魔物の牙' },
  pelt:          { id: 'pelt',          name: '毛皮',             emoji: '🐾', desc: '上質な毛皮' },
  bark:          { id: 'bark',          name: '樹皮',             emoji: '🪵', desc: '古樹の樹皮' },
  iron:          { id: 'iron',          name: '鉄片',             emoji: '🔩', desc: '精錬用の鉄片' },
  darkstone:     { id: 'darkstone',     name: '闇石',             emoji: '🌑', desc: '魔王城の希少石' },
  crystaldust:   { id: 'crystaldust',   name: 'クリスタルダスト', emoji: '💠', desc: '神殿で採れる輝く粉末' },
  goddessfeather:{ id: 'goddessfeather',name: '女神の羽',         emoji: '🪶', desc: '古の女神が残した羽根' },
  dragonscale:   { id: 'dragonscale',   name: '竜鱗',             emoji: '🐲', desc: '竜王の強靭な鱗' },
  holywater:     { id: 'holywater',     name: '聖水',             emoji: '💧', desc: '天空の聖域に湧く聖水' },
  dreamdust:     { id: 'dreamdust',     name: '夢の塵',           emoji: '🌟', desc: '幻夢の回廊に漂う神秘の輝き' },
  shard_s:       { id: 'shard_s',       name: '試練の欠片',       emoji: '🔷', desc: '日課ボスから得られる欠片' },
  imperialstone: { id: 'imperialstone', name: '帝国石',           emoji: '🏯', desc: '紅炎帝国で採れる深紅の鉱石。帝国の意志が宿る。' },
  seagem:        { id: 'seagem',        name: '碧海の宝珠',       emoji: '🌊', desc: '碧海の深海に沈んだ古代遺跡で採れる神秘的な宝石。' }
};

// ─── ユーティリティ ──────────────────────────────────────────────────────────

/** 全ステージIDを順番に返す */
function getAllStageIds() {
  const ids = [];
  STAGES_DATA.forEach(ch => ch.stages.forEach(s => ids.push(s.id)));
  return ids;
}

/** ステージIDからステージ定義を返す */
function findStageDef(stageId) {
  for (const ch of STAGES_DATA) {
    const s = ch.stages.find(s => s.id === stageId);
    if (s) return s;
  }
  return null;
}

// ─── 日課ボスデータ ───────────────────────────────────────────────────────────

const DAILY_BOSS_DATA = [
  {
    id: 'boss_easy', name: '試練の番人', difficulty: 'easy', label: '易',
    emoji: '🛡️',
    enemies: [
      { name: '試練の番人', emoji: '🛡️', hp: 50000, atk: 600, def: 400, spd: 80 }
    ],
    rewards: { coins: [2000, 3000], crystals: 20, material: 'shard_s', materialCount: 2 }
  },
  {
    id: 'boss_normal', name: '試練の番人・強', difficulty: 'normal', label: '普',
    emoji: '⚔️',
    enemies: [
      { name: '試練の番人・強', emoji: '⚔️', hp: 150000, atk: 1000, def: 700, spd: 100 }
    ],
    rewards: { coins: [4000, 6000], crystals: 40, material: 'shard_s', materialCount: 5 }
  },
  {
    id: 'boss_hard', name: '試練の番人・極', difficulty: 'hard', label: '難',
    emoji: '💀',
    enemies: [
      { name: '試練の番人・極', emoji: '💀', hp: 400000, atk: 1500, def: 1000, spd: 120 }
    ],
    rewards: { coins: [8000, 12000], crystals: 80, material: 'shard_s', materialCount: 10 }
  }
];
