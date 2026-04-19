/**
 * stages_data.js — ステージ・装備・素材マスタデータ
 * 静的定義。保存データには含まれない。
 */

// ─── ステージデータ ──────────────────────────────────────────────────────────

const STAGES_DATA = [
  {
    chapter: 1,
    name: '第一章: 魔の森',
    stages: [
      {
        id: '1-1', name: '迷いの森', isBoss: false,
        enemies: [
          { name: 'スライム', emoji: '🟢', hp: 600,  atk: 80,  def: 30,  spd: 50 },
          { name: 'スライム', emoji: '🟢', hp: 600,  atk: 80,  def: 30,  spd: 50 }
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
          { name: 'ゴブリン', emoji: '👺', hp: 1200, atk: 130, def: 60,  spd: 75 },
          { name: 'ゴブリン', emoji: '👺', hp: 1200, atk: 130, def: 60,  spd: 75 },
          { name: 'ゴブリン', emoji: '👺', hp: 1200, atk: 130, def: 60,  spd: 75 }
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
          { name: 'オオカミ', emoji: '🐺', hp: 1800, atk: 200, def: 80,  spd: 130 },
          { name: 'オオカミ', emoji: '🐺', hp: 1800, atk: 200, def: 80,  spd: 130 },
          { name: 'オオカミ', emoji: '🐺', hp: 1800, atk: 200, def: 80,  spd: 130 }
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
          { name: '古樹の精', emoji: '🌳', hp: 12000, atk: 320, def: 220, spd: 45,
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
          { name: '魔王', emoji: '👿', hp: 30000, atk: 550, def: 380, spd: 110,
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
          { name: '古の女神', emoji: '🌸', hp: 80000, atk: 780, def: 600, spd: 120,
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
    stages: [
      {
        id: '4-1', name: '溶岩の渓谷', isBoss: false,
        enemies: [
          { name: 'ワイバーン', emoji: '🦎', hp: 15000, atk: 800, def: 550, spd: 110 },
          { name: 'ワイバーン', emoji: '🦎', hp: 15000, atk: 800, def: 550, spd: 110 }
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
          { name: '古竜', emoji: '🐉', hp: 35000, atk: 950, def: 700, spd: 80 },
          { name: 'ワイバーン', emoji: '🦎', hp: 15000, atk: 800, def: 550, spd: 110 }
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
          { name: '竜王ヴァルグ', emoji: '🐲', hp: 200000, atk: 1200, def: 900, spd: 100,
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
          { name: '天空の守護神', emoji: '⚡', hp: 500000, atk: 1800, def: 1200, spd: 140,
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
  }
];

// ─── 装備マスタ ──────────────────────────────────────────────────────────────

const EQUIPMENT_DATA = {
  sword_r: {
    id: 'sword_r', name: '鉄の剣',      type: 'weapon',    emoji: '⚔️',
    rarity: 'R',  stats: { atk: 80 },                      desc: '素朴な鉄製の剣'
  },
  armor_r: {
    id: 'armor_r', name: '革の鎧',      type: 'armor',     emoji: '🛡️',
    rarity: 'R',  stats: { def: 60, hp: 500 },              desc: '軽くて動きやすい革鎧'
  },
  ring_r: {
    id: 'ring_r',  name: '速さの指輪',  type: 'accessory', emoji: '💍',
    rarity: 'R',  stats: { spd: 20 },                      desc: '風の魔法が宿る指輪'
  },
  sword_sr: {
    id: 'sword_sr', name: '銀の剣',     type: 'weapon',    emoji: '🗡️',
    rarity: 'SR', stats: { atk: 200 },                     desc: '銀の輝きを持つ剣'
  },
  armor_sr: {
    id: 'armor_sr', name: '鋼の鎧',     type: 'armor',     emoji: '🔰',
    rarity: 'SR', stats: { def: 150, hp: 1500 },           desc: '頑丈な鋼で作られた鎧'
  },
  ring_sr: {
    id: 'ring_sr',  name: '魔法の指輪', type: 'accessory', emoji: '✨',
    rarity: 'SR', stats: { atk: 100, spd: 30 },            desc: '複数の魔力が宿る指輪'
  },
  sword_ssr: {
    id: 'sword_ssr', name: '聖剣エクスカリバー', type: 'weapon',    emoji: '⚡',
    rarity: 'SSR', stats: { atk: 450 },                    desc: '伝説の聖剣。光の力が宿る'
  },
  armor_ssr: {
    id: 'armor_ssr', name: '天空の鎧',           type: 'armor',     emoji: '🌟',
    rarity: 'SSR', stats: { def: 380, hp: 4000 },          desc: '天空の神が鍛えた守護鎧'
  },
  ring_ssr: {
    id: 'ring_ssr',  name: '竜王の指輪',         type: 'accessory', emoji: '💫',
    rarity: 'SSR', stats: { atk: 200, spd: 60 },           desc: '竜王の力が結晶した指輪'
  }
};

// ─── 素材マスタ ──────────────────────────────────────────────────────────────

const MATERIALS_DATA = {
  herb:      { id: 'herb',      name: '薬草',     emoji: '🌿', desc: '基本的な回復素材' },
  fang:      { id: 'fang',      name: 'キバ',     emoji: '🦷', desc: '魔物の牙' },
  pelt:      { id: 'pelt',      name: '毛皮',     emoji: '🐾', desc: '上質な毛皮' },
  bark:      { id: 'bark',      name: '樹皮',     emoji: '🪵', desc: '古樹の樹皮' },
  iron:      { id: 'iron',      name: '鉄片',     emoji: '🔩', desc: '精錬用の鉄片' },
  darkstone:      { id: 'darkstone',      name: '闇石',             emoji: '🌑', desc: '魔王城の希少石' },
  crystaldust:    { id: 'crystaldust',    name: 'クリスタルダスト', emoji: '💠', desc: '神殿で採れる輝く粉末' },
  goddessfeather: { id: 'goddessfeather', name: '女神の羽',         emoji: '🪶', desc: '古の女神が残した羽根' },
  dragonscale:    { id: 'dragonscale',    name: '竜鱗',             emoji: '🐲', desc: '竜王の強靭な鱗' },
  holywater:      { id: 'holywater',      name: '聖水',             emoji: '💧', desc: '天空の聖域に湧く聖水' },
  shard_s:        { id: 'shard_s',        name: '試練の欠片',       emoji: '🔷', desc: '日課ボスから得られる欠片' }
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
