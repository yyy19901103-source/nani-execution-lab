/**
 * generals_data.js — 副将マスタデータ
 * キャラクターの静的定義。保存データには含まれない。
 * imagePath: assets/characters/{id}.png を置くと自動的にAI生成画像に差し替わる。
 */
const GENERALS_DATA = {

  // ─── LR (Legendary Rare) ──────────────────────────────────────────────────

  arcana: {
    id: 'arcana',
    name: '天帝アルカナ',
    title: '創造神の化身',
    rarity: 'LR',
    faction: '神代の存在',
    type: 'attacker',
    typeName: '攻撃',
    element: '光',
    emoji: '⚜️',
    gradient: 'linear-gradient(135deg, #fff 0%, #ffd700 15%, #ff69b4 30%, #87cefa 45%, #90ee90 60%, #ffd700 75%, #ff69b4 90%, #fff 100%)',
    borderColor: '#ff00aa',
    description: '世界を創りし女神の化身。金の光輪を纏う白い長衣が星明かりに溶け、ただそこに立つだけで時が止まる。その瞳が宿す光は無限の慈愛と裁きを同時に宿し、見る者の魂を貫く。',
    lore: '五百年前、虚無の帝の侵攻に際し天帝アルカナは己の神体を砕いて封印を完成させた。その欠片は世界中の英雄たちの魂に宿り、アルカナ大陸の守護を受け継いだ。今また封印が緩み始め、神の意思を継ぐ者たちが立ち上がろうとしている。アルカナそのものは姿を持たぬ存在となったが、選ばれし者の中に瞬く光として今も生き続ける。',
    quote: '「世界を創ることよりも、守ることの方が尊い」',
    relations: [
      { id: 'nyx',       type: 'rival',           desc: '世界誕生の瞬間から続く宿命のライバル。創造と混沌、相対する二つの極' },
      { id: 'seraphina', type: 'protege',          desc: '星の加護を与えし守護者。その魂に神の欠片が最も強く宿る' },
      { id: 'lucifer',   type: 'former_subordinate', desc: '天界で最も信頼していた天使長。堕落した今も、その行く末を案じ続ける' }
    ],
    baseStats: { hp: 25000, atk: 2200, def: 900, spd: 148 },
    statGrowth: { hp: 600, atk: 60, def: 22, spd: 1.0 },
    skills: [
      { name: '創世光波',  sp: 4, type: 'damage_single', power: 5.5, description: '神の力を一点に集中させた究極の一撃' },
      { name: '天地創造',  sp: 15, type: 'damage_all',   power: 3.5, description: '全てを創り直すほどの光で全体を蹂躙' }
    ]
  },

  // ─── MR (Mythic Rare) ─────────────────────────────────────────────────────

  nyx: {
    id: 'nyx',
    name: '混沌ニュクス',
    title: '虚空の支配者',
    rarity: 'MR',
    faction: '神代の存在',
    type: 'assassin',
    typeName: '刺客',
    element: '闇',
    emoji: '🌌',
    gradient: 'linear-gradient(160deg, #060010 0%, #3d0066 40%, #6600aa 70%, #9900dd 100%)',
    borderColor: '#cc00ff',
    description: '宇宙の混沌そのものが女の形をとった存在。漆黒のドレスの裾が星屑のように広がり、その白い指先が触れたものは全て虚無へと還る。声もなく微笑む唇が、最も恐ろしい。',
    lore: '世界が生まれる前から存在する混沌の化身。アルカナが秩序と創造の神であるなら、ニュクスは無秩序と消滅の神だ。二者は永遠に相克しながらも、どちらか一方だけでは宇宙の均衡が保てないという矛盾を抱える。ルシファーの孤独と絶望を見抜いており、その魂の深部に秘かに語りかけていると言われるが、真意は謎に包まれている。',
    quote: '「始まりがあれば終わりもある。私はその終わりを司る者」',
    relations: [
      { id: 'arcana',  type: 'rival',     desc: '宿命のライバル。創造と混沌は相容れないが、均衡がなければ世界は滅ぶ' },
      { id: 'lucifer', type: 'mysterious', desc: 'ルシファーの孤独の深さを誰より知る謎の存在。その縁の正体は不明' }
    ],
    baseStats: { hp: 17000, atk: 1950, def: 680, spd: 170 },
    statGrowth: { hp: 420, atk: 55, def: 18, spd: 1.5 },
    skills: [
      { name: '虚空葬',   sp: 3, type: 'damage_single', power: 4.5, description: '存在を虚無に葬る必殺の一撃' },
      { name: '混沌解放', sp: 12, type: 'damage_all',   power: 3.0, description: '混沌の力を解き放ち全てを蹂躙する' }
    ]
  },

  // ─── UR (Ultra Rare) ──────────────────────────────────────────────────────

  fafnir: {
    id: 'fafnir',
    name: '竜王ファフナー',
    title: '原初の竜神',
    rarity: 'UR',
    faction: '中立',
    type: 'attacker',
    typeName: '攻撃',
    element: '炎',
    emoji: '🐉',
    gradient: 'linear-gradient(160deg, #1a0000 0%, #7b0000 40%, #c62828 70%, #ff8f00 100%)',
    borderColor: '#ff6600',
    description: '太古より眠る最古の竜神が女の姿で目覚めた。金色の鱗を思わせる鎧が全身を覆い、業火の息吹と共に赤い長髪がなびく。その眼光に見つめられると、大地でさえも身を竦める。',
    lore: '三百年前、怒りに狂ったファフナーは北方の氷の王国を業火で焼き尽くした。その罪の重さに耐えかね、自ら封印の眠りについた竜王だ。今の彼の最大の望みは、氷姫シルフィアに罪を認めて和解することにある。ヴォルカンとは互いの力を認め合う義兄弟の契りを結んでおり、その豪胆さを竜王として最高の称賛で讃える。',
    quote: '「炎は破壊するためでなく、道を照らすためにある——今ならそれがわかる」',
    relations: [
      { id: 'sylphia', type: 'enemy_turned_ally', desc: '三百年前に氷の王国を焼いた宿縁。和解への道を歩んでいる' },
      { id: 'volkhan', type: 'sworn_brother',     desc: '力を認め合った義兄弟。互いの豪胆さを最大の称賛で讃える' }
    ],
    baseStats: { hp: 12500, atk: 1380, def: 550, spd: 130 },
    statGrowth: { hp: 320, atk: 42, def: 15, spd: 0.8 },
    skills: [
      { name: '竜炎爪',   sp: 3, type: 'damage_single', power: 3.8, description: '灼熱の爪で単体を引き裂く' },
      { name: '覇竜烈火', sp: 9, type: 'damage_all',    power: 2.4, description: '竜王の咆哮と共に業火が全体を呑む' }
    ]
  },

  // ─── SSR ──────────────────────────────────────────────────────────────────

  seraphina: {
    id: 'seraphina',
    name: 'セラフィナ',
    title: '星の守護者',
    rarity: 'SSR',
    faction: '聖ルシウス王国',
    type: 'attacker',
    typeName: '攻撃',
    element: '光',
    emoji: '✨',
    gradient: 'linear-gradient(160deg, #fff9e6 0%, #ffe082 60%, #ffca28 100%)',
    borderColor: '#ffd700',
    description: '金色の長髪を風になびかせ、白銀の聖鎧を纏う気高き剣士。引き締まった体躯に宿る星の加護が淡く輝き、剣を構える姿は息を呑むほど美しい。その瞳の奥に宿る強さが、見る者の心を射抜く。',
    lore: '奈落の廃都にあった孤児院でシャドウと共に育った過去を持つ。ある日アルカナの加護が宿ったことで聖剣士への道を歩み始め、今は聖ルシウス王国の守護者として名を馳せる。アイリスとは親友であり、剣と祈りで互いを補い合う。ルシファーとはかつての因縁があり、今も宿命のライバルとして刃を交える。',
    quote: '「星は消えても、その光は永遠に届き続ける」',
    relations: [
      { id: 'shadow',  type: 'childhood_friend', desc: '孤児院育ちの幼馴染。遠くから守られていることに、薄々気づき始めている' },
      { id: 'iris',    type: 'best_friend',       desc: '無二の親友。剣士と聖女、二つの力が合わさって初めて完璧になる' },
      { id: 'arcana',  type: 'mysterious',        desc: '天帝アルカナの加護を受ける特別な存在。その使命の重さを背負う' },
      { id: 'lucifer', type: 'rival',             desc: '宿命のライバル。光と闇、二人は引き合いながら反発し続ける' }
    ],
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
    faction: '奈落（元）',
    type: 'assassin',
    typeName: '刺客',
    element: '闇',
    emoji: '🌑',
    gradient: 'linear-gradient(160deg, #f3e5f5 0%, #ce93d8 60%, #ab47bc 100%)',
    borderColor: '#9c27b0',
    description: '闇から生まれた暗殺者。漆黒のフードの下に宿る紫の瞳だけが暗がりに光り、次の瞬間には標的の傍にいる。その細身の体躯に秘めた力は、誰も気づかぬうちに全てを終わらせる。',
    lore: 'セラフィナと同じ孤児院で育った幼馴染だが、ある日奈落の暗殺組織にスカウトされ姿を消した。組織の命令でセラフィナに近づいたが、その純粋さに触れ組織を裏切った。今は影から密かにセラフィナを守護する存在となっている。自分の過去を明かせば彼女を傷つけると知りながら、それでも傍にいることをやめられない。',
    quote: '「影は光があるから生まれる。俺はお前の影でいい」',
    relations: [
      { id: 'seraphina', type: 'childhood_friend', desc: '幼馴染。裏切り者の汚名を着ながらも、影から守り続ける' }
    ],
    baseStats: { hp: 6000, atk: 950, def: 200, spd: 160 },
    statGrowth: { hp: 150, atk: 30, def: 5,  spd: 1.0 },
    skills: [
      { name: '暗殺刃',  sp: 2, type: 'damage_single', power: 3.2, description: '先制して単体に致命的ダメージ' },
      { name: '夜霧',    sp: 7, type: 'damage_all',    power: 1.0, description: '霧に紛れて全体を奇襲する' }
    ]
  },

  sylphia: {
    id: 'sylphia',
    name: '氷姫シルフィア',
    title: '永久氷原の姫君',
    rarity: 'SSR',
    faction: '聖ルシウス王国',
    type: 'mage',
    typeName: '魔法',
    element: '水',
    emoji: '❄️',
    gradient: 'linear-gradient(160deg, #e3f2fd 0%, #b3e5fc 45%, #80deea 75%, #e0f7fa 100%)',
    borderColor: '#26c6da',
    description: '白銀の髪と透き通るような青い瞳を持つ、永久氷原の姫君。薄氷を思わせるドレスから覗く白磁の肌は触れれば溶けそうで、しかし近づく者を寄せ付けない冷気を纏う。月明かりの下で踊る姿は、見る者全ての時間を凍らせる。',
    lore: '三百年前にファフナーの業火で滅ぼされた氷の王国の最後の姫君。氷魔法で身を守りながらその時代から生き延びた。アクアリアとは水の扱い方を巡る哲学的なライバル関係を持ち、氷と流水のどちらが真の水の形かを常に争い続ける。フロストは彼女への忠誠を誓う衛士だ。',
    quote: '「氷は固く、冷たく——しかしどこまでも澄んでいる」',
    relations: [
      { id: 'fafnir',  type: 'enemy_turned_ally', desc: '王国を焼いた竜王との因縁。怒りを超えて和解への道を歩んでいる' },
      { id: 'aquaria', type: 'rival',             desc: '水の扱い方を巡る永遠のライバル。氷と流水、どちらが水の本質か' },
      { id: 'frost',   type: 'ally',              desc: '時代を超えて仕え続ける忠実な衛士。その無言の忠誠が最も信頼できる盾となる' }
    ],
    baseStats: { hp: 7200, atk: 900, def: 350, spd: 140 },
    statGrowth: { hp: 180, atk: 28, def: 10, spd: 0.7 },
    skills: [
      { name: '氷結剣',   sp: 3, type: 'damage_single', power: 3.0, description: '氷の刃で単体を凍てつかせる' },
      { name: '吹雪の舞', sp: 8, type: 'damage_all',    power: 1.6, description: '吹雪の舞で全体を凍り付かせる' }
    ]
  },

  aquaria: {
    id: 'aquaria',
    name: 'アクアリア',
    title: '癒しの水精',
    rarity: 'SSR',
    faction: '碧海同盟',
    type: 'healer',
    typeName: '支援',
    element: '水',
    emoji: '💧',
    gradient: 'linear-gradient(160deg, #e3f2fd 0%, #90caf9 60%, #42a5f5 100%)',
    borderColor: '#2196f3',
    description: '蒼い長髪を波のように揺らし、精霊の衣を纏う知性と美貌を兼ね備えた術士。切れ長の瞳には深海のような知性が宿り、その柔らかな微笑みは激しい戦場においても見る者の心を安らかにする。',
    lore: '碧海同盟の碧水の島に生まれた水の賢者。精霊との対話を通じて水の全属性を操れる稀有な術士だ。コーラルを弟子として迎え、人魚の直感と自分の理論を融合させることで新たな治癒術を開拓している。シルフィアとは水を巡る哲学が根本から異なるため、常に議論を繰り返す間柄だ。',
    quote: '「水は争わず、しかし全てを包み込む——それが私の答えです」',
    relations: [
      { id: 'sylphia', type: 'rival',   desc: '氷と流水の哲学を巡る宿命のライバル' },
      { id: 'coral',   type: 'mentor',  desc: 'コーラルの師匠。人魚の天性の感性を理論で補強している' }
    ],
    baseStats: { hp: 7500, atk: 500, def: 420, spd: 100 },
    statGrowth: { hp: 250, atk: 15, def: 13, spd: 0.3 },
    skills: [
      { name: '水の加護',   sp: 3, type: 'heal_single', power: 1.8, description: 'HPが最も低い仲間を大きく回復' },
      { name: '聖水の雨',   sp: 7, type: 'heal_all',    power: 0.9, description: '全体のHPを回復する' }
    ]
  },

  lucifer: {
    id: 'lucifer',
    name: 'ルシファー',
    title: '堕天の魔王',
    rarity: 'SSR',
    faction: '奈落（元）',
    type: 'mage',
    typeName: '魔法',
    element: '闇',
    emoji: '😈',
    gradient: 'linear-gradient(160deg, #212121 0%, #7b1fa2 60%, #4a148c 100%)',
    borderColor: '#9c27b0',
    description: '天界から堕ちた魔王。かつて最も美しかった天使の面影を残す横顔に、今は深い絶望と怒りが宿る。漆黒の翼をゆっくりと広げるとき、その妖艶な美しさが見る者を恐怖と魅了の狭間に縛りつける。',
    lore: '天帝アルカナに仕えた天使長の中でも最も優秀だった存在。しかしアルカナが神体を砕いて封印に使ったことへの怒りと絶望が、ルシファーを堕天させた。奈落の廃都に居を構え自らを「廃都の主」と名乗るが、ニュクスとの謎の絆を持ち、その本心は誰にも計り知れない。セラフィナを最大のライバルとして認め、いつか決着をつけようとしている。',
    quote: '「神に反逆した私を、いまさら英雄と呼ぶのか？笑わせるな」',
    relations: [
      { id: 'arcana',    type: 'former_subordinate', desc: 'かつての主君。神体を砕いた決断への怒りが、今の自分を作った' },
      { id: 'nyx',       type: 'mysterious',         desc: 'ニュクスとの謎の絆。混沌の神が孤独なルシファーに何を語りかけるのか' },
      { id: 'seraphina', type: 'rival',              desc: '宿命のライバル。光の聖剣士と闇の魔王、互いに最強の敵を認め合う' }
    ],
    baseStats: { hp: 7000, atk: 1000, def: 250, spd: 105 },
    statGrowth: { hp: 180, atk: 32,  def: 7,  spd: 0.4 },
    skills: [
      { name: '暗黒魔弾',   sp: 3, type: 'damage_single', power: 2.8, description: '闇の魔弾で単体に壊滅的ダメージ' },
      { name: '魔王の咆哮', sp: 9, type: 'damage_all',    power: 1.5, description: '全体を圧倒する闇のブレス' }
    ]
  },

  luna: {
    id: 'luna',
    name: 'ルナ',
    title: '月夜の魔女',
    rarity: 'SSR',
    faction: '中立',
    type: 'mage',
    typeName: '魔法',
    element: '月',
    emoji: '🌙',
    gradient: 'linear-gradient(160deg, #e8eaf6 0%, #b39ddb 60%, #4527a0 100%)',
    borderColor: '#7c4dff',
    description: '月光のような銀髪を肩に流し、大人びた色香と少女のような愛らしさを同時に持つ謎めいた魔女。うさぎ耳の飾りが妖艶な笑みを引き立て、その細い指先から放たれる魔力は夜空を塗り替えるほど。何百年も生きてきた者だけが持つ、抗いがたい魅力がある。',
    lore: '三大勢力のどこにも属さず、月の光の下で世界の歴史を記録し続ける神秘の魔女。その年齢は不明だが、五百年前のアルカナの封印の儀式を目撃したと言われる数少ない存在の一人だ。アルカを弟子に迎え、魔法の才能をゆっくりと育てている。中立を貫くのは、歴史の証人として偏りなく全てを見届けるためだ。',
    quote: '「月は全てを見ている。記録する者は、判断せず、ただ見つめるのみ」',
    relations: [
      { id: 'arca', type: 'mentor', desc: 'アルカの師匠。その眠れる才能に月の加護が宿ることを見抜いた' }
    ],
    baseStats: { hp: 7200, atk: 920, def: 280, spd: 115 },
    statGrowth: { hp: 185, atk: 29, def: 8, spd: 0.45 },
    skills: [
      { name: '月光魔弾',   sp: 3, type: 'damage_single', power: 2.7, description: '月光の魔力を込めた圧倒的な一撃' },
      { name: '星の海',     sp: 8, type: 'damage_all',    power: 1.3, description: '無数の星光が敵全体を包み込む' }
    ]
  },

  volkhan: {
    id: 'volkhan',
    name: 'ヴォルカン',
    title: '炎神の化身',
    rarity: 'SSR',
    faction: '紅炎帝国',
    type: 'attacker',
    typeName: '攻撃',
    element: '炎',
    emoji: '🔱',
    gradient: 'linear-gradient(160deg, #1a0000 0%, #b71c1c 55%, #ff6d00 100%)',
    borderColor: '#ff3d00',
    description: '炎の神が人の女に降臨した姿。赤い瞳と揺れる銀髪に炎が絡まり、圧倒的な存在感が周囲の空気を焼く。鎧の隙間から漏れる熱気が、この女が人ではないことを静かに告げている。',
    lore: '紅炎帝国の将軍にして炎神の化身と呼ばれる戦士。帝国内での地位は皇帝に次ぐほどで、その豪胆さと強さで兵たちを引き付ける。ファフナーとは力を認め合い義兄弟の誓いを結んだ。グリモワールを右腕として帝国の拡大を進めてきたが、虚無の帝の脅威には誰より敏感に反応し、三大勢力の壁を越えた協力の必要性を感じている。',
    quote: '「炎は向かい風でも消えない。それが真の炎だ」',
    relations: [
      { id: 'fafnir',   type: 'sworn_brother',     desc: '竜王との義兄弟の誓い。互いの豪胆さを最大の敬意で讃え合う' },
      { id: 'flame',    type: 'mentor',             desc: '若き炎剣士の上官。その成長を黙って見守っている' },
      { id: 'blaze',    type: 'mentor',             desc: '遠くから自分を憧れる少年。いずれ認めてやろうと思っている' },
      { id: 'grimoire', type: 'ally',               desc: '最も信頼する軍師。その知略なくして帝国の覇道はなかった' }
    ],
    baseStats: { hp: 6800, atk: 1050, def: 240, spd: 130 },
    statGrowth: { hp: 170, atk: 34, def: 6, spd: 0.6 },
    skills: [
      { name: '神炎の刃',   sp: 3, type: 'damage_single', power: 3.0, description: '炎神の力を込めた絶対の一撃' },
      { name: '炎神の怒り', sp: 9, type: 'damage_all',    power: 1.6, description: '全てを焼き尽くす神の炎' }
    ]
  },

  // ─── NEW SSR ──────────────────────────────────────────────────────────────

  grimoire: {
    id: 'grimoire',
    name: 'グリモワール',
    title: '赤壁の軍師',
    rarity: 'SSR',
    faction: '紅炎帝国',
    type: 'support',
    typeName: '支援',
    element: '炎',
    emoji: '📜',
    gradient: 'linear-gradient(160deg, #1a0a00 0%, #8b4513 50%, #ffa500 100%)',
    borderColor: '#ff8c00',
    description: '紅炎帝国最高の女軍師。羽扇を優雅に揺らしながら戦局を読み解く姿は、戦場に似合わぬ艶やかさだ。薄く笑みを浮かべたまま敵将の心理を解体する知略は、刃よりも鋭く急所を突く。',
    lore: '紅炎帝国最高の軍師。羽扇一本で戦局を読み解き、敵将の心理を見抜く知略の権化。ヴォルカンの右腕として帝国拡大を支えてきたが、その真の忠誠は「アルカナ大陸の平和」にある。虚無の帝の脅威を最初に察知し、極秘でセラフィナに情報を流した影の功労者。',
    quote: '「戦とは、始まる前に終わらせるものだ」',
    relations: [
      { id: 'volkhan', type: 'ally',   desc: '主君にして最も信頼する武将。その豪胆さを誰より尊重する' },
      { id: 'flame',   type: 'mentor', desc: '若き炎剣士の潜在能力を見抜き、密かに成長を見守る' }
    ],
    baseStats: { hp: 7000, atk: 700, def: 320, spd: 110 },
    statGrowth: { hp: 178, atk: 22, def: 10, spd: 0.45 },
    skills: [
      { name: '火攻の策',  sp: 4, type: 'atk_buff',    power: 0.5, description: '炎の兵法書を開き、自身の攻撃力を大幅強化して敵将を翻弄する' },
      { name: '赤壁の炎',  sp: 9, type: 'damage_all',  power: 1.4, description: '伝説の赤壁の戦術を再現する全体炎攻撃' }
    ]
  },

  iris: {
    id: 'iris',
    name: 'アイリス',
    title: '聖教会の聖女',
    rarity: 'SSR',
    faction: '聖ルシウス王国',
    type: 'healer',
    typeName: '支援',
    element: '光',
    emoji: '🌺',
    gradient: 'linear-gradient(160deg, #fff0f5 0%, #ffb6c1 50%, #ff69b4 100%)',
    borderColor: '#ff1493',
    description: '栗色の巻き髪と清らかな緑の瞳を持つ、奇跡を体現する聖女。純白の司祭服に包まれた細い肢体から溢れ出す光は、傷ついた者を無条件に引き寄せる。祈りを捧げる横顔はあまりにも神々しく、その姿を見た者は思わず膝をつくという。',
    lore: '聖ルシウス王国の聖教会が生んだ奇跡の聖女。五歳の時に神の声を聞き、その日から治癒の奇跡を起こし続けている。セラフィナとは幼い頃からの大親友で、剣と祈りで互いを補い合う関係だ。虚無の帝の復活を聞いた時、「神は沈黙している」と感じた——その意味を問い続けながら戦場に立つ。',
    quote: '「神が沈黙する時、人が祈り続けることにこそ意味がある」',
    relations: [
      { id: 'seraphina', type: 'best_friend', desc: '幼い頃からの大親友。セラフィナの剣と自分の祈りが合わさって初めて完璧になると信じる' },
      { id: 'lancelot',  type: 'ally',        desc: '白十字騎士団長として常に守ってくれる頼もしい存在' }
    ],
    baseStats: { hp: 8000, atk: 480, def: 450, spd: 105 },
    statGrowth: { hp: 220, atk: 14, def: 14, spd: 0.4 },
    skills: [
      { name: '聖なる癒し',  sp: 3, type: 'heal_all',  power: 1.1, description: '神の奇跡で全体のHPを大きく回復' },
      { name: '聖光の守護',  sp: 8, type: 'heal_all',  power: 0.8, description: '神聖な光が仲間全体を包み込み、大きくHPを回復する' }
    ]
  },

  // ─── SR ───────────────────────────────────────────────────────────────────

  flame: {
    id: 'flame',
    name: 'フレイム',
    title: '炎の剣士',
    rarity: 'SR',
    faction: '紅炎帝国',
    type: 'attacker',
    typeName: '攻撃',
    element: '炎',
    emoji: '🔥',
    gradient: 'linear-gradient(160deg, #fff3e0 0%, #ffb74d 60%, #ff7043 100%)',
    borderColor: '#ff5722',
    description: '炎を操る若き女剣士。赤みがかった髪が風になびくたびに炎が舞い散り、細身でありながらその一撃は岩をも砕く。情熱を隠そうともしない瞳が、仲間の心に火をつける。',
    lore: 'ヴォルカン将軍に憧れて紅炎帝国に入隊した若き剣士。粗削りだが誰よりも熱い炎の才能を持つ。ブレイズの兄貴分として面倒を見ており、グリモワールに潜在能力を密かに認められている。将軍のような偉大な戦士になることを夢見て、日々鍛錬を欠かさない。',
    quote: '「この炎が消えない限り、俺は諦めない！」',
    relations: [
      { id: 'volkhan',  type: 'ally',    desc: '憧れの上官。その背中を追いかけて剣を磨き続ける' },
      { id: 'blaze',    type: 'ally',    desc: '弟分のブレイズ。無鉄砲な突撃を止めるのが毎回の仕事だ' },
      { id: 'grimoire', type: 'protege', desc: '軍師に才能を見込まれている。本人はまだ知らない' }
    ],
    baseStats: { hp: 5500, atk: 650, def: 250, spd: 110 },
    statGrowth: { hp: 140, atk: 20, def: 7,  spd: 0.4 },
    skills: [
      { name: '炎剣',    sp: 3, type: 'damage_single', power: 2.0, description: '炎をまとった強力な一撃' },
      { name: '爆炎斬',  sp: 7, type: 'damage_all',    power: 0.9, description: '爆発的な炎で全体攻撃' }
    ]
  },

  terra: {
    id: 'terra',
    name: 'テラ',
    title: '大地の守護者',
    rarity: 'SR',
    faction: '聖ルシウス王国',
    type: 'tank',
    typeName: '防御',
    element: '土',
    emoji: '🌿',
    gradient: 'linear-gradient(160deg, #e8f5e9 0%, #a5d6a7 60%, #4caf50 100%)',
    borderColor: '#4caf50',
    description: '大地の力を纏う堅牢な女騎士。厚い鎧に包まれながらも、その立ち姿は大木のように静かで美しい。「盾になる」と言い切るその声に、仲間は迷わず背中を預ける。',
    lore: '聖ルシウス王国で長年王都を守り続けてきたベテランの守護騎士。ランスロットの師匠として騎士道の全てを教えた。ガルドとは長年の戦友であり、言葉を交わさずとも互いの動きを完全に読み合える境地に達している。年老いても衰えない大地の加護は、若い騎士たちの精神的支柱となっている。',
    quote: '「盾は攻撃のためにある。仲間が全力で戦えるよう、俺が全てを受け止める」',
    relations: [
      { id: 'lancelot', type: 'mentor', desc: '白十字騎士団長ランスロットの師匠。その防御の極意を受け継がせた' },
      { id: 'galdo',    type: 'ally',   desc: '長年の戦友。言葉不要で動きを合わせられる唯一の相棒' }
    ],
    baseStats: { hp: 14000, atk: 400, def: 600, spd: 70 },
    statGrowth: { hp:  380, atk: 12, def: 18, spd: 0.2 },
    skills: [
      { name: '大地の盾', sp: 4, type: 'shield_all',    power: 0.5, description: '全体にダメージを吸収するシールドを付与' },
      { name: '岩砕き',   sp: 6, type: 'damage_single', power: 1.8, description: '防御力を無視する強撃' }
    ]
  },

  windel: {
    id: 'windel',
    name: 'ウィンデル',
    title: '疾風の踊り子',
    rarity: 'SR',
    faction: '碧海同盟',
    type: 'speedster',
    typeName: '速攻',
    element: '風',
    emoji: '🌀',
    gradient: 'linear-gradient(160deg, #e0f7fa 0%, #80deea 60%, #00bcd4 100%)',
    borderColor: '#00bcd4',
    description: '露出の多い異国衣装に細い金の飾りをまとい、裸足で嵐の甲板を踊るように駆ける。褐色の肌に風が当たるたびに長い黒髪が波打ち、目を離せない。踊りと剣技の境界が溶けた動きは、敵さえも見惚れさせる一瞬を生む。',
    lore: '碧海同盟の踊り子でありながら、嵐の海で鍛えた実戦的な格闘術を持つ。ロン・ジャンとは旧知の仲で、彼の船に乗り込んで各地を旅した。ゼファーとはかつて同じ船の仲間だったが、訳ある事情で離別した。その事情は二人の間の沈黙が全てを物語っており、いまも心の傷が癒えていない。',
    quote: '「風が吹く方へ踊れ。人生も戦いも同じことよ」',
    relations: [
      { id: 'longjan', type: 'ally',   desc: 'ロン・ジャンとは旧知の仲。嵐の中で命を救われた借りを今も返し続ける' },
      { id: 'zephyr',  type: 'rival',  desc: 'かつて同じ船の仲間だった剣豪。訳ある離別の傷は今も癒えていない' }
    ],
    baseStats: { hp: 5000, atk: 600, def: 200, spd: 185 },
    statGrowth: { hp: 120, atk: 18, def: 6,  spd: 1.5 },
    skills: [
      { name: '旋風連斬', sp: 2, type: 'damage_multi',  power: 0.8, hits: 3, description: '3回連続攻撃を繰り出す' },
      { name: '嵐の踏込', sp: 6, type: 'damage_single', power: 2.2, description: '全力で切り込む一撃' }
    ]
  },

  aria: {
    id: 'aria',
    name: 'アリア',
    title: '炎の歌姫',
    rarity: 'SR',
    faction: '中立',
    type: 'healer',
    typeName: '支援',
    element: '炎',
    emoji: '🎵',
    gradient: 'linear-gradient(160deg, #fce4ec 0%, #f48fb1 60%, #e91e63 100%)',
    borderColor: '#e91e63',
    description: '炎の紅を差したような深紅のドレスの裾をひらめかせながら歌う、大陸三国を渡り歩く花形歌姫。歌うたびに胸元の宝石が揺れ、聴衆の視線を釘付けにする。声と体、どちらが武器かと問われれば――両方だと笑って答える。',
    lore: '三大国を渡り歩く吟遊詩人。どの勢力にも属さず、歌で各地の人々の心を繋げることを生業とする。リリィは自分が見つけて仲間に引き入れた存在で、二人で旅することも多い。その歌声には不思議な魔力が宿り、聞いた者の心に眠る勇気を呼び覚ます。三大勢力の間でも唯一自由に行き来できる稀有な存在だ。',
    quote: '「歌はどんな壁も越えていく。剣よりも強く、魔法よりも遠くまで」',
    relations: [
      { id: 'lily', type: 'ally', desc: '花園で発見した妖精の少女。旅の仲間として共に世界を歌って回っている' }
    ],
    baseStats: { hp: 6000, atk: 550, def: 300, spd: 115 },
    statGrowth: { hp: 160, atk: 17, def: 9,  spd: 0.5 },
    skills: [
      { name: '炎の讃歌',   sp: 4, type: 'heal_all',    power: 0.7, description: '歌声で全体のHPを回復' },
      { name: 'バーニング♪', sp: 7, type: 'damage_all', power: 1.0, description: '炎のメロディーで全体攻撃' }
    ]
  },

  coral: {
    id: 'coral',
    name: 'コーラル',
    title: '珊瑚の人魚姫',
    rarity: 'SR',
    faction: '碧海同盟',
    type: 'healer',
    typeName: '支援',
    element: '水',
    emoji: '🐚',
    gradient: 'linear-gradient(160deg, #e0f7fa 0%, #f48fb1 50%, #26c6da 100%)',
    borderColor: '#00acc1',
    description: '珊瑚色の長髪を海風になびかせ、貝殻と海草で編んだ衣を身に着けた人魚の娘。海から陸に上がると素足に変わる二本の脚はほっそりと白く、揺れる髪と明るい笑顔が波の泡のように周囲を輝かせる。',
    lore: '碧海同盟の沿岸に住む人魚族の娘。ロン・ジャンとは幼馴染で、彼が海賊王を目指すと言った時から共に旅をしている。アクアリアに弟子入りし治癒術の理論を学んでいるが、自身の直感的な治癒センスは師匠でさえ驚くほど高い。明るく前向きな性格が仲間の支えになっている。',
    quote: '「笑顔は最高の魔法！みんなを癒すのが私の使命だよ！」',
    relations: [
      { id: 'aquaria', type: 'protege',       desc: 'アクアリアの弟子。師匠の理論と自分の直感を融合させようとしている' },
      { id: 'longjan', type: 'childhood_friend', desc: '幼馴染の海賊王。彼の笑顔のために一番の治癒師になると誓った' }
    ],
    baseStats: { hp: 6500, atk: 480, def: 380, spd: 105 },
    statGrowth: { hp: 170, atk: 14, def: 12, spd: 0.4 },
    skills: [
      { name: '珊瑚の癒し', sp: 3, type: 'heal_single', power: 2.0, description: 'HPが最も低い仲間をたっぷり回復' },
      { name: '人魚の歌',   sp: 7, type: 'heal_all',    power: 1.0, description: '歌声で全体のHPをじんわり回復' }
    ]
  },

  zephyr: {
    id: 'zephyr',
    name: 'ゼファー',
    title: '嵐の剣豪',
    rarity: 'SR',
    faction: '中立',
    type: 'assassin',
    typeName: '刺客',
    element: '風',
    emoji: '⚡',
    gradient: 'linear-gradient(160deg, #0d1117 0%, #1565c0 60%, #90a4ae 100%)',
    borderColor: '#546e7a',
    description: '嵐を纏う寡黙な女剣豪。黒髪に青い眼帯、その細い体のどこにあの剣速が宿るのか誰も知らない。気づいた時にはもう決着がついており、立ち去る背中だけが嵐の残り香を漂わせる。',
    lore: '元碧海海軍の剣豪。ある事件をきっかけに海軍を去り浪人となった。ウィンデルとはかつて同じ船に乗り命を預け合った仲だったが、例の事件で訣別した。今も互いへの複雑な感情を抱えており、戦場で顔を合わせると言葉の代わりに剣が語る。碧海最速を巡ってロン・ジャンを永遠のライバルとして認識している。',
    quote: '「風は過去に吹かない。俺の剣も、前だけを向く」',
    relations: [
      { id: 'windel',  type: 'rival',  desc: 'かつて同じ船の仲間。訳ある離別の後も、互いを気にかけていることは確かだ' },
      { id: 'longjan', type: 'rival',  desc: '碧海最速を巡る永遠のライバル。互いの実力を認め合っている' }
    ],
    baseStats: { hp: 5800, atk: 780, def: 220, spd: 170 },
    statGrowth: { hp: 145, atk: 25, def: 6, spd: 1.3 },
    skills: [
      { name: '烈風刃',   sp: 2, type: 'damage_single', power: 2.8, description: '嵐の速度で繰り出す必殺の一刀' },
      { name: '嵐の連撃', sp: 6, type: 'damage_multi',  power: 0.9, hits: 3, description: '嵐のごとく3連続斬り' }
    ]
  },

  popo: {
    id: 'popo',
    name: 'ポポ',
    title: 'もふもふ魔法使い',
    rarity: 'SR',
    faction: '聖ルシウス王国',
    type: 'support',
    typeName: '支援',
    element: '光',
    emoji: '🧸',
    gradient: 'linear-gradient(160deg, #fff9c4 0%, #ffccbc 60%, #f8bbd0 100%)',
    borderColor: '#f06292',
    description: '色とりどりのポンポンが揺れる大きなもふもふ帽子が特徴の、ちびっ子魔法使い。帽子の陰からのぞく丸い目がくりっと輝いていて、お腹から出る大声と応援魔法で仲間全員を元気にする。',
    lore: '聖ルシウス王国の農村出身の見習い魔法使い。魔法学院でアルカと同じクラスになり、以来なんでもライバル視するような仲になった。本人は「ライバル」と言い張るが、実は一番仲がいい相棒だ。大きなもふもふ帽子は田舎の祖母が編んでくれたもので、絶対に脱がない理由がある。',
    quote: '「アルカには絶対負けないんだから！……でも一緒にいると楽しいのは認める」',
    relations: [
      { id: 'arca', type: 'rival', desc: '魔法学院のクラスメート。なんでもライバル視するが、実は一番の仲良し' }
    ],
    baseStats: { hp: 5500, atk: 420, def: 350, spd: 120 },
    statGrowth: { hp: 145, atk: 13, def: 11, spd: 0.5 },
    skills: [
      { name: 'もふもふパワー',  sp: 3, type: 'atk_buff', power: 0.4, description: 'もふもふの魔力で仲間の攻撃を上げる' },
      { name: 'みんなへのエール', sp: 6, type: 'heal_all', power: 0.85, description: '全員に元気をわけてあげる' }
    ]
  },

  // ─── NEW SR ───────────────────────────────────────────────────────────────

  lancelot: {
    id: 'lancelot',
    name: 'ランスロット',
    title: '白十字騎士団長',
    rarity: 'SR',
    faction: '聖ルシウス王国',
    type: 'tank',
    typeName: '防御',
    element: '光',
    emoji: '⚔️',
    gradient: 'linear-gradient(160deg, #f0f8ff 0%, #c0c0c0 50%, #4682b4 100%)',
    borderColor: '#1e90ff',
    description: '銀の鎧に純白のマントをなびかせ戦場を駆ける、白十字騎士団長。完璧な武芸と強靭な精神力を持つが、笑顔だけは不器用なままだ。アイリスの前でだけ自然と表情が和らぐと言われているが、本人は猛否定している。',
    lore: '聖ルシウス王国が誇る白十字騎士団を率いる騎士団長。テラを師と仰ぎ、その背中を見て育った。完璧な武芸と強靭な精神力を持つが、実は笑顔が苦手な不器用な男。アイリスの笑顔にだけは自然と笑えると言われているが、本人は猛否定している。',
    quote: '「騎士とは盾である。剣となるのは最後の手段だ」',
    relations: [
      { id: 'terra',  type: 'mentor', desc: '騎士の道を教えてくれた師匠。その重厚な防御の構えを完全習得するのが目標' },
      { id: 'iris',   type: 'ally',   desc: '聖女を守ることが騎士の本分。……決してそれ以上の感情ではない（と本人は言う）' },
      { id: 'galdo',  type: 'ally',   desc: '同じ騎士道を歩む戦友。口数は少ないが、戦場では最高の相棒' }
    ],
    baseStats: { hp: 13000, atk: 450, def: 580, spd: 85 },
    statGrowth: { hp: 360, atk: 14, def: 17, spd: 0.3 },
    skills: [
      { name: '鉄壁の構え',   sp: 4, type: 'shield_all',    power: 0.55, description: '全体に強固なシールドを展開する' },
      { name: '聖騎士の突撃', sp: 7, type: 'damage_single', power: 2.3,  description: '全力の突撃で単体に強烈なダメージ' }
    ]
  },

  longjan: {
    id: 'longjan',
    name: 'ロン・ジャン',
    title: '碧海の海賊王',
    rarity: 'SR',
    faction: '碧海同盟',
    type: 'speedster',
    typeName: '速攻',
    element: '風',
    emoji: '⚓',
    gradient: 'linear-gradient(160deg, #001a33 0%, #0066cc 50%, #00ccff 100%)',
    borderColor: '#00bfff',
    description: '碧海同盟の若き女海賊王。日焼けした褐色の肌に白い歯がきらめき、豪快な笑声は嵐の中でも波を越える。自由と仲間を何より大切にするその熱さが、荒くれ者たちを束ねる。',
    lore: '碧海同盟の若き海賊王。自由と仲間を何より大切にし、権力や権威には真っ向から逆らう熱血漢。コーラルとは幼馴染で、ウィンデルとは海で出会った旅の仲間だ。「世界中の海を自分の庭にする」という夢を持ち、その豪快な笑声は嵐の中でも聞こえると言われる。虚無の帝が海を侵食すると知り、「俺の海に手を出すな」と参戦した。',
    quote: '「自由の風は止められねぇ。俺もな！」',
    relations: [
      { id: 'coral',  type: 'childhood_friend', desc: '幼馴染の人魚姫。彼女の笑顔のために海賊王になると誓った（本人は別の理由と言い張る）' },
      { id: 'windel', type: 'ally',             desc: '嵐の中で出会った踊り子。その身のこなしで命を救われた借りがある' },
      { id: 'zephyr', type: 'rival',            desc: '碧海最速を巡る永遠のライバル。互いの実力を認め合っている' }
    ],
    baseStats: { hp: 6000, atk: 720, def: 230, spd: 175 },
    statGrowth: { hp: 152, atk: 23, def: 7, spd: 1.3 },
    skills: [
      { name: '嵐の一刀',  sp: 2, type: 'damage_single', power: 2.6,              description: '海の嵐を纏った速度の極みの一撃' },
      { name: '碧海の覇道', sp: 7, type: 'damage_multi', power: 0.85, hits: 3, description: '三連続の海風斬りで全てを薙ぐ' }
    ]
  },

  // ─── R ────────────────────────────────────────────────────────────────────

  arca: {
    id: 'arca',
    name: 'アルカ',
    title: '見習い魔術士',
    rarity: 'R',
    faction: '聖ルシウス王国',
    type: 'mage',
    typeName: '魔法',
    element: '光',
    emoji: '⭐',
    gradient: 'linear-gradient(160deg, #fff8e1 0%, #ffe082 60%, #ffc107 100%)',
    borderColor: '#ffc107',
    description: '癖のある短い金髪と大きな瞳が特徴の見習い魔術士。ちょっとほこりだらけの魔法書を抱えて今日も全力で走っている。負けず嫌いの瞳の奥には、世界を変えるくらいの意志が宿っている。',
    lore: 'ルナ師匠のもとで魔法を修行中の見習い魔法士。ポポとは魔法学院で同じクラスになり、なんでも張り合うライバル兼友人だ。実はルナが「天帝の光の欠片が宿る子」と密かに評しており、その才能は本人が思う以上に大きい。負けず嫌いな性格が成長を加速させる原動力となっている。',
    quote: '「見習いだって、本気でやれば世界を変えられる！」',
    relations: [
      { id: 'luna', type: 'protege', desc: 'ルナの弟子。師匠の真の評価をまだ知らない' },
      { id: 'popo', type: 'rival',   desc: 'クラスメート兼ライバル。なんでも張り合うが、二人でいると最強の相棒になる' }
    ],
    baseStats: { hp: 4000, atk: 520, def: 180, spd: 95 },
    statGrowth: { hp: 100, atk: 16, def: 5,  spd: 0.3 },
    skills: [
      { name: '魔法の矢', sp: 2, type: 'damage_single', power: 1.6, description: '魔法弾で攻撃する' },
      { name: '光の渦',   sp: 6, type: 'damage_all',    power: 0.7, description: '光の渦で全体攻撃' }
    ]
  },

  rockus: {
    id: 'rockus',
    name: 'ロックス',
    title: '岩鎧の戦士',
    rarity: 'R',
    faction: '紅炎帝国',
    type: 'tank',
    typeName: '防御',
    element: '土',
    emoji: '🪨',
    gradient: 'linear-gradient(160deg, #efebe9 0%, #bcaaa4 60%, #8d6e63 100%)',
    borderColor: '#795548',
    description: '岩のような鎧を纏う無口な女戦士。無駄のない立ち姿と朴訥な眼差しが静かな安心感を生む。「岩は動かない」という信念のもと、何があっても持ち場を離れない。',
    lore: '紅炎帝国の岩山を守る守備兵として長年勤めた朴訥な戦士。出世欲もなく、ただひたすら自分の持ち場を守り続けることに誇りを持つ。口数が少なく取っつきにくいが、一度信頼した仲間のためなら岩になって盾になる男だ。農村出身で大地への愛着が強く、炎の属性を持つ帝国の中では珍しく土の力を使う。',
    quote: '「岩は動かない。それが俺の誇りだ」',
    relations: [],
    baseStats: { hp: 10000, atk: 350, def: 520, spd: 60 },
    statGrowth: { hp: 280,  atk: 10, def: 15, spd: 0.1 },
    skills: [
      { name: '鉄壁',   sp: 3, type: 'defense_buff', power: 0.4, description: '自身の防御力を一時的に上げる' },
      { name: '地割れ', sp: 7, type: 'damage_all',   power: 0.8, description: '大地を揺らして全体攻撃' }
    ]
  },

  blaze: {
    id: 'blaze',
    name: 'ブレイズ',
    title: '爆炎の少年',
    rarity: 'R',
    faction: '紅炎帝国',
    type: 'speedster',
    typeName: '速攻',
    element: '炎',
    emoji: '💥',
    gradient: 'linear-gradient(160deg, #fff8e1 0%, #ffcc02 60%, #ff6f00 100%)',
    borderColor: '#ff6f00',
    description: '炎を身にまとって突撃する無鉄砲な少女。短い赤髪をなびかせながら突っ込む姿に、敵も仲間も思わず見惚れる。速さと元気だけなら誰にも負けないと、今日も全力で走っている。',
    lore: 'フレイムの子分を自称する見習い戦士の少年。ヴォルカン将軍を遠くから憧れ、いつか隣に立てる戦士になることを夢見ている。グリモワールが自分に目をつけているとは露知らず、無鉄砲な突撃を繰り返している。フレイムの兄貴分としての叱責さえも糧にして成長しようとする健気な姿がある。',
    quote: '「将軍みたいになりたい！そのためなら何度倒れても立ち上がる！」',
    relations: [
      { id: 'flame',   type: 'ally',    desc: 'フレイムの子分。兄貴分の叱責も全部糧にして成長しようとしている' },
      { id: 'volkhan', type: 'ally',    desc: '遠くから憧れる将軍。いつかその隣に立つことが夢だ' }
    ],
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
    faction: '聖ルシウス王国',
    type: 'tank',
    typeName: '防御',
    element: '水',
    emoji: '❄️',
    gradient: 'linear-gradient(160deg, #e3f2fd 0%, #b3e5fc 60%, #0288d1 100%)',
    borderColor: '#0288d1',
    description: '氷の鎧を纏う冷静な女衛士。感情を表に出さない無表情の下に、姫様への揺るぎない忠誠心が宿る。その細い体が前に立てば、どんな攻撃も届かないと仲間は知っている。',
    lore: 'シルフィア姫に仕える氷の衛士。姫が氷の王国の歴史と共に時を超えて生きてきた間も、ずっと傍に仕え続けた忠誠の騎士だ。寡黙で感情を表に出さないが、シルフィア姫への忠誠心は誰よりも深く、その命を守るためならどんな強敵とも立ちはだかる。',
    quote: '「姫様をお守りすることが、この命の全てだ」',
    relations: [
      { id: 'sylphia', type: 'ally', desc: 'シルフィア姫の忠実な衛士。時代を超えた忠誠心は鋼鉄よりも硬い' }
    ],
    baseStats: { hp: 9000, atk: 320, def: 580, spd: 65 },
    statGrowth: { hp: 260, atk: 9,  def: 17, spd: 0.1 },
    skills: [
      { name: '氷盾', sp: 3, type: 'shield_all', power: 0.45, description: '全体に氷のシールドを付与' },
      { name: '吹雪', sp: 6, type: 'damage_all', power: 0.75, description: '凍てつく吹雪で全体攻撃' }
    ]
  },

  lily: {
    id: 'lily',
    name: 'リリィ',
    title: '花園の妖精',
    rarity: 'R',
    faction: '中立',
    type: 'healer',
    typeName: '支援',
    element: '光',
    emoji: '🌸',
    gradient: 'linear-gradient(160deg, #fce4ec 0%, #c8e6c9 60%, #f9fbe7 100%)',
    borderColor: '#66bb6a',
    description: '花々を編んだ冠と小さな翼を持つ、手のひらサイズの妖精。花びら色の髪がひらりと揺れるたびに辺りに甘い香りが漂い、戦場でも笑顔を忘れないその姿が仲間の心をそっと温める。',
    lore: '聖ルシウス王国郊外の花園に住んでいた小さな妖精。旅の吟遊詩人アリアに発見され、外の世界への興味から共に旅立つことを決めた。何百年も花園で暮らしてきたため戦いの知識は乏しいが、癒しの力と花の魔法は本物だ。無邪気な性格で周囲を和ませる天才。',
    quote: '「花が咲く場所には、必ず笑顔も咲くの！」',
    relations: [
      { id: 'aria', type: 'ally', desc: 'アリアに見つけてもらった恩人。旅に連れて行ってもらえることが嬉しくてたまらない' }
    ],
    baseStats: { hp: 4200, atk: 380, def: 220, spd: 150 },
    statGrowth: { hp: 105, atk: 12, def: 6, spd: 0.8 },
    skills: [
      { name: '花びら癒し', sp: 2, type: 'heal_single', power: 1.5, description: '花びらで傷をふわっと癒す' },
      { name: '花吹雪',     sp: 5, type: 'damage_all',  power: 0.65, description: '花びらの渦で全体攻撃' }
    ]
  },

  choco: {
    id: 'choco',
    name: 'チョコ',
    title: 'お菓子の魔法使い',
    rarity: 'R',
    faction: '碧海同盟',
    type: 'mage',
    typeName: '魔法',
    element: '炎',
    emoji: '🍫',
    gradient: 'linear-gradient(160deg, #4e342e 0%, #a1887f 60%, #f8bbd0 100%)',
    borderColor: '#8d6e63',
    description: 'キャンディの杖を振り回す甘党の魔法使い。チョコレート色の瞳と頬についたお菓子のかけらが愛嬌たっぷりで、見た目はほっこりかわいいが爆発魔法の威力は本物だ。誰とでも仲良くなれる笑顔が最大の武器。',
    lore: '碧海同盟の港町出身の甘党魔法使い。お菓子の調合と魔法の融合という独自のスタイルを確立しており、見た目はかわいいのに威力は本物だ。港町では「お菓子屋のチョコ」として慕われており、冒険に出ていない時は町の子供たちにお菓子を配っている。誰とでも仲良くなれる天真爛漫な性格。',
    quote: '「甘いものは世界を救う。これ、本当のことだよ？」',
    relations: [],
    baseStats: { hp: 3900, atk: 510, def: 160, spd: 115 },
    statGrowth: { hp: 98, atk: 16, def: 5, spd: 0.4 },
    skills: [
      { name: 'チョコ魔法',   sp: 2, type: 'damage_single', power: 1.8, description: 'チョコレート色の魔弾で攻撃' },
      { name: 'お菓子の爆弾', sp: 5, type: 'damage_all',    power: 0.7, description: 'ポップな爆弾で全体攻撃' }
    ]
  },

  galdo: {
    id: 'galdo',
    name: 'ガルド',
    title: '鋼鉄の騎士',
    rarity: 'R',
    faction: '聖ルシウス王国',
    type: 'tank',
    typeName: '防御',
    element: '土',
    emoji: '⚙️',
    gradient: 'linear-gradient(160deg, #263238 0%, #546e7a 60%, #b0bec5 100%)',
    borderColor: '#455a64',
    description: '全身を鋼鉄の鎧で覆った女騎士。言葉は要らない、鎧が全てを語るという生き方を貫く。無口でクールな佇まいの中に、仲間への深い愛情が静かに燃えている。',
    lore: '聖ルシウス王国の鋼鉄騎士。テラの長年の戦友であり、同じ戦場を何十年も共に歩んできた。ランスロットとは騎士道を共に歩む同志として認め合っている。口数が極めて少なく、何を考えているか分からないと言われるが、仲間を想う心の深さは誰よりも大きい。',
    quote: '「言葉は要らない。鎧が全てを語る」',
    relations: [
      { id: 'terra',    type: 'ally', desc: 'テラの長年の戦友。言葉不要で動きを合わせられる唯一の相棒' },
      { id: 'lancelot', type: 'ally', desc: '騎士道を共に歩む同志。口数は少ないが、戦場では最高の相棒' }
    ],
    baseStats: { hp: 10500, atk: 360, def: 560, spd: 55 },
    statGrowth: { hp: 295, atk: 11, def: 16, spd: 0.1 },
    skills: [
      { name: '鋼の意志', sp: 3, type: 'defense_buff',  power: 0.4, description: '鋼鉄の鎧を展開し防御力を大幅強化' },
      { name: '鉄槌',     sp: 6, type: 'damage_single', power: 2.0, description: '巨大な鉄の拳を叩き込む' }
    ]
  }
};

/**
 * ガチャ排出テーブル
 * weight が高いほど排出されやすい
 * 合計 weight = 201
 * LR: 1/201 ≈ 0.5%  MR: 2/201 ≈ 1.0%  UR: 3/201 ≈ 1.5%
 * SSR: 37/201 ≈ 18.4%  SR: 64/201 ≈ 31.8%  R: 90/201 ≈ 44.8%
 */
const GACHA_POOL = [
  // LR (最高レア)
  { id: 'arcana',    weight: 1 },
  // MR
  { id: 'nyx',       weight: 2 },
  // UR
  { id: 'fafnir',    weight: 3 },
  // SSR (各3〜4)
  { id: 'seraphina', weight: 4 },
  { id: 'shadow',    weight: 4 },
  { id: 'aquaria',   weight: 4 },
  { id: 'lucifer',   weight: 4 },
  { id: 'luna',      weight: 3 },
  { id: 'volkhan',   weight: 3 },
  { id: 'sylphia',   weight: 4 },
  { id: 'grimoire',  weight: 3 },
  { id: 'iris',      weight: 4 },
  // SR (各7〜8)
  { id: 'flame',     weight: 8 },
  { id: 'terra',     weight: 8 },
  { id: 'windel',    weight: 8 },
  { id: 'aria',      weight: 8 },
  { id: 'coral',     weight: 8 },
  { id: 'zephyr',    weight: 8 },
  { id: 'popo',      weight: 8 },
  { id: 'lancelot',  weight: 8 },
  { id: 'longjan',   weight: 8 },
  // R (各10〜13)
  { id: 'arca',      weight: 13 },
  { id: 'rockus',    weight: 13 },
  { id: 'blaze',     weight: 13 },
  { id: 'frost',     weight: 13 },
  { id: 'lily',      weight: 12 },
  { id: 'choco',     weight: 13 },
  { id: 'galdo',     weight: 13 }
];
