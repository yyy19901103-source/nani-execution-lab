/**
 * generals_data.js — 副将マスタデータ
 * キャラクターの静的定義。保存データには含まれない。
 * imagePath: assets/characters/{id}.png を置くと自動的にAI生成画像に差し替わる。
 */
const GENERALS_DATA = {

  // ─── SSR ──────────────────────────────────────────────────────────────────

  seraphina: {
    id: 'seraphina',
    name: 'セラフィナ',
    title: '星の守護者',
    rarity: 'SSR',
    type: 'attacker',
    typeName: '攻撃',
    element: '光',
    emoji: '✨',
    gradient: 'linear-gradient(160deg, #fff9e6 0%, #ffe082 60%, #ffca28 100%)',
    borderColor: '#ffd700',
    description: '星の加護を受けし聖剣士。その剣は光を宿し、闇を祓う。',
    baseStats: { hp: 8000, atk: 800, def: 300, spd: 120 },
    statGrowth: { hp: 200, atk: 25, def: 8,  spd: 0.5 },
    skills: [
      { name: '星光斬',   sp: 3, type: 'damage_single', power: 2.5, description: '単体に強烈な光属性ダメージ' },
      { name: '星降る夜', sp: 8, type: 'damage_all',    power: 1.2, description: '全体に光の雨を降らせる' }
    ]
  },

  shadow: {
    id: 'shadow',
    name: 'シャドウ',
    title: '闇を刻む者',
    rarity: 'SSR',
    type: 'assassin',
    typeName: '刺客',
    element: '闇',
    emoji: '🌑',
    gradient: 'linear-gradient(160deg, #f3e5f5 0%, #ce93d8 60%, #ab47bc 100%)',
    borderColor: '#9c27b0',
    description: '闇から生まれた暗殺者。誰も気づかぬうちに仕留める。',
    baseStats: { hp: 6000, atk: 950, def: 200, spd: 160 },
    statGrowth: { hp: 150, atk: 30, def: 5,  spd: 1.0 },
    skills: [
      { name: '暗殺刃',  sp: 2, type: 'damage_single', power: 3.2, description: '先制して単体に致命的ダメージ' },
      { name: '夜霧',    sp: 7, type: 'damage_all',    power: 1.0, description: '霧に紛れて全体を奇襲する' }
    ]
  },

  aquaria: {
    id: 'aquaria',
    name: 'アクアリア',
    title: '癒しの水精',
    rarity: 'SSR',
    type: 'healer',
    typeName: '支援',
    element: '水',
    emoji: '💧',
    gradient: 'linear-gradient(160deg, #e3f2fd 0%, #90caf9 60%, #42a5f5 100%)',
    borderColor: '#2196f3',
    description: '水の精霊と契約した治癒術士。仲間の傷を優しく癒す。',
    baseStats: { hp: 7500, atk: 500, def: 420, spd: 100 },
    statGrowth: { hp: 250, atk: 15, def: 13, spd: 0.3 },
    skills: [
      { name: '水の加護',   sp: 3, type: 'heal_single', power: 1.8, description: 'HPが最も低い仲間を大きく回復' },
      { name: '聖水の雨', sp: 7, type: 'heal_all',    power: 0.9, description: '全体のHPを回復する' }
    ]
  },

  // ─── SR ───────────────────────────────────────────────────────────────────

  flame: {
    id: 'flame',
    name: 'フレイム',
    title: '炎の剣士',
    rarity: 'SR',
    type: 'attacker',
    typeName: '攻撃',
    element: '火',
    emoji: '🔥',
    gradient: 'linear-gradient(160deg, #fff3e0 0%, #ffb74d 60%, #ff7043 100%)',
    borderColor: '#ff5722',
    description: '炎を操る若き剣士。情熱と勢いで敵を圧倒する。',
    baseStats: { hp: 5500, atk: 650, def: 250, spd: 110 },
    statGrowth: { hp: 140, atk: 20, def: 7,  spd: 0.4 },
    skills: [
      { name: '炎剣',    sp: 3, type: 'damage_single', power: 2.0, description: '炎をまとった強力な一撃' },
      { name: '爆炎斬', sp: 7, type: 'damage_all',    power: 0.9, description: '爆発的な炎で全体攻撃' }
    ]
  },

  terra: {
    id: 'terra',
    name: 'テラ',
    title: '大地の守護者',
    rarity: 'SR',
    type: 'tank',
    typeName: '防御',
    element: '土',
    emoji: '🌿',
    gradient: 'linear-gradient(160deg, #e8f5e9 0%, #a5d6a7 60%, #4caf50 100%)',
    borderColor: '#4caf50',
    description: '大地の力を纏う堅牢な守護者。仲間の盾となる。',
    baseStats: { hp: 14000, atk: 400, def: 600, spd: 70 },
    statGrowth: { hp:  380, atk: 12, def: 18, spd: 0.2 },
    skills: [
      { name: '大地の盾', sp: 4, type: 'shield_all',    power: 0.5, description: '全体にダメージを吸収するシールドを付与' },
      { name: '岩砕き',  sp: 6, type: 'damage_single', power: 1.8, description: '防御力を無視する強撃' }
    ]
  },

  windel: {
    id: 'windel',
    name: 'ウィンデル',
    title: '疾風の踊り子',
    rarity: 'SR',
    type: 'speedster',
    typeName: '速攻',
    element: '風',
    emoji: '🌀',
    gradient: 'linear-gradient(160deg, #e0f7fa 0%, #80deea 60%, #00bcd4 100%)',
    borderColor: '#00bcd4',
    description: '風と共に舞う踊り子。素早い連撃が得意。',
    baseStats: { hp: 5000, atk: 600, def: 200, spd: 185 },
    statGrowth: { hp: 120, atk: 18, def: 6,  spd: 1.5 },
    skills: [
      { name: '旋風連斬', sp: 2, type: 'damage_multi',  power: 0.8, hits: 3, description: '3回連続攻撃を繰り出す' },
      { name: '嵐の踏込', sp: 6, type: 'damage_single', power: 2.2, description: '全力で切り込む一撃' }
    ]
  },

  // ─── R ────────────────────────────────────────────────────────────────────

  arca: {
    id: 'arca',
    name: 'アルカ',
    title: '見習い魔術士',
    rarity: 'R',
    type: 'mage',
    typeName: '魔法',
    element: '光',
    emoji: '⭐',
    gradient: 'linear-gradient(160deg, #fff8e1 0%, #ffe082 60%, #ffc107 100%)',
    borderColor: '#ffc107',
    description: '魔術の修行中の少女。負けず嫌いで向上心が強い。',
    baseStats: { hp: 4000, atk: 520, def: 180, spd: 95 },
    statGrowth: { hp: 100, atk: 16, def: 5,  spd: 0.3 },
    skills: [
      { name: '魔法の矢', sp: 2, type: 'damage_single', power: 1.6, description: '魔法弾で攻撃する' },
      { name: '光の渦',  sp: 6, type: 'damage_all',    power: 0.7, description: '光の渦で全体攻撃' }
    ]
  },

  rockus: {
    id: 'rockus',
    name: 'ロックス',
    title: '岩鎧の戦士',
    rarity: 'R',
    type: 'tank',
    typeName: '防御',
    element: '土',
    emoji: '🪨',
    gradient: 'linear-gradient(160deg, #efebe9 0%, #bcaaa4 60%, #8d6e63 100%)',
    borderColor: '#795548',
    description: '岩のような体を持つ頑丈な戦士。頼りになる。',
    baseStats: { hp: 10000, atk: 350, def: 520, spd: 60 },
    statGrowth: { hp: 280,  atk: 10, def: 15, spd: 0.1 },
    skills: [
      { name: '鉄壁',   sp: 3, type: 'defense_buff',  power: 0.4, description: '自身の防御力を一時的に上げる' },
      { name: '地割れ', sp: 7, type: 'damage_all',    power: 0.8, description: '大地を揺らして全体攻撃' }
    ]
  },

  // ─── 追加SSR ──────────────────────────────────────────────────────────────

  lucifer: {
    id: 'lucifer',
    name: 'ルシファー',
    title: '堕天の魔王',
    rarity: 'SSR',
    type: 'mage',
    typeName: '魔法',
    element: '闇',
    emoji: '😈',
    gradient: 'linear-gradient(160deg, #212121 0%, #7b1fa2 60%, #4a148c 100%)',
    borderColor: '#9c27b0',
    description: '天界から堕ちし魔王。絶大な闇魔法で世界を塗り替える。',
    baseStats: { hp: 7000, atk: 1000, def: 250, spd: 105 },
    statGrowth: { hp: 180, atk: 32,  def: 7,  spd: 0.4 },
    skills: [
      { name: '暗黒魔弾',   sp: 3, type: 'damage_single', power: 2.8, description: '闇の魔弾で単体に壊滅的ダメージ' },
      { name: '魔王の咆哮', sp: 9, type: 'damage_all',    power: 1.5, description: '全体を圧倒する闇のブレス' }
    ]
  },

  // ─── 追加SR ───────────────────────────────────────────────────────────────

  aria: {
    id: 'aria',
    name: 'アリア',
    title: '炎の歌姫',
    rarity: 'SR',
    type: 'healer',
    typeName: '支援',
    element: '火',
    emoji: '🎵',
    gradient: 'linear-gradient(160deg, #fce4ec 0%, #f48fb1 60%, #e91e63 100%)',
    borderColor: '#e91e63',
    description: '炎の歌声で仲間を鼓舞する歌姫。癒しと攻撃を両立する。',
    baseStats: { hp: 6000, atk: 550, def: 300, spd: 115 },
    statGrowth: { hp: 160, atk: 17, def: 9,  spd: 0.5 },
    skills: [
      { name: '炎の讃歌',   sp: 4, type: 'heal_all',      power: 0.7, description: '歌声で全体のHPを回復' },
      { name: 'バーニング♪', sp: 7, type: 'damage_all',   power: 1.0, description: '炎のメロディーで全体攻撃' }
    ]
  },

  // ─── 追加R ────────────────────────────────────────────────────────────────

  blaze: {
    id: 'blaze',
    name: 'ブレイズ',
    title: '爆炎の少年',
    rarity: 'R',
    type: 'speedster',
    typeName: '速攻',
    element: '火',
    emoji: '💥',
    gradient: 'linear-gradient(160deg, #fff8e1 0%, #ffcc02 60%, #ff6f00 100%)',
    borderColor: '#ff6f00',
    description: '炎を身にまとって突撃する無鉄砲な少年。速さが命。',
    baseStats: { hp: 3800, atk: 480, def: 170, spd: 175 },
    statGrowth: { hp: 95,  atk: 15, def: 5,  spd: 1.2 },
    skills: [
      { name: '炎突',   sp: 2, type: 'damage_single', power: 1.7, description: '炎をまとって突撃する' },
      { name: '烈炎斬', sp: 5, type: 'damage_multi',  power: 0.7, hits: 2, description: '2連続の炎斬り' }
    ]
  },

  frost: {
    id: 'frost',
    name: 'フロスト',
    title: '氷壁の衛士',
    rarity: 'R',
    type: 'tank',
    typeName: '防御',
    element: '水',
    emoji: '❄️',
    gradient: 'linear-gradient(160deg, #e3f2fd 0%, #b3e5fc 60%, #0288d1 100%)',
    borderColor: '#0288d1',
    description: '氷の鎧を纏う冷静な衛士。敵の攻撃を全て受け止める。',
    baseStats: { hp: 9000, atk: 320, def: 580, spd: 65 },
    statGrowth: { hp: 260, atk: 9,  def: 17, spd: 0.1 },
    skills: [
      { name: '氷盾',   sp: 3, type: 'shield_all',    power: 0.45, description: '全体に氷のシールドを付与' },
      { name: '吹雪',   sp: 6, type: 'damage_all',    power: 0.75, description: '凍てつく吹雪で全体攻撃' }
    ]
  }
};

/**
 * ガチャ排出テーブル
 * weight が高いほど排出されやすい
 */
const GACHA_POOL = [
  // SSR (各4%, 合計16%)
  { id: 'seraphina', weight: 4 },
  { id: 'shadow',    weight: 4 },
  { id: 'aquaria',   weight: 4 },
  { id: 'lucifer',   weight: 4 },
  // SR (各10%, 合計30%)
  { id: 'flame',     weight: 10 },
  { id: 'terra',     weight: 10 },
  { id: 'windel',    weight: 10 },
  { id: 'aria',      weight: 10 },
  // R (各10.5%, 合計42%)  ※端数調整で合計100%相当
  { id: 'arca',      weight: 11 },
  { id: 'rockus',    weight: 11 },
  { id: 'blaze',     weight: 10 },
  { id: 'frost',     weight: 10 }
];
