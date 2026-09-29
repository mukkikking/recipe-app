// Dish candidates used by the suggestion engine.
//
// Fields:
//   n   : display name
//   k   : base search keyword (extra words such as "子供" are appended at runtime)
//   t   : 'main' | 'side' | 'rice'
//   g   : food group -> 'meat' | 'fish' | 'soy' | 'egg' | 'veg'
//   ing : ingredients used for stock matching (names should match the stock list)
//   m   : in-season months (omit = available all year)
//   h   : healthy (preferred on Mon/Tue)
//   o   : goes well with beer / sake (preferred on Fri/Sat)
//   f   : contains something Merumama likes
//   fb  : high in dietary fiber
//   s   : contains soy products
//   hv  : hint for hiding vegetables Merumama dislikes (chop / blend)
//
// Rules baked into this list:
//   - Beef: lean cuts only (Hahaue dislikes beef fat).
//   - No soba, no raw fish (Merumama has not tried them yet).

const SPRING = [3, 4, 5];
const SUMMER = [6, 7, 8];
const AUTUMN = [9, 10, 11];
const WINTER = [12, 1, 2];

const DISHES = [
  // ---------- main: chicken ----------
  { n: '鶏ももとブロッコリーの塩炒め', k: '鶏もも ブロッコリー 炒め', t: 'main', g: 'meat', ing: ['鶏もも', 'ブロッコリー'], f: 1, h: 1 },
  { n: '鶏ももの照り焼き', k: '鶏もも 照り焼き', t: 'main', g: 'meat', ing: ['鶏もも'], f: 1, o: 1 },
  { n: '鶏もものトマト煮', k: '鶏もも トマト煮', t: 'main', g: 'meat', ing: ['鶏もも', 'プチトマト'], hv: '玉ねぎは細かく刻んで煮込むと気づきにくい' },
  { n: '鶏ももときのこのクリーム煮', k: '鶏もも きのこ クリーム煮', t: 'main', g: 'meat', ing: ['鶏もも'], m: AUTUMN, fb: 1, f: 1 },
  { n: '鶏ももとなすの甘酢炒め', k: '鶏もも なす 甘酢', t: 'main', g: 'meat', ing: ['鶏もも'], m: [7, 8, 9], o: 1 },
  { n: '新じゃがと鶏の煮っころがし', k: '新じゃが 鶏肉 煮物', t: 'main', g: 'meat', ing: ['鶏もも', 'じゃがいも'], m: [4, 5, 6], f: 1 },
  { n: '鶏むねのピカタ', k: '鶏むね ピカタ', t: 'main', g: 'meat', ing: ['鶏むね', '卵'], h: 1, f: 1 },
  { n: '鶏むねとブロッコリーのチーズ焼き', k: '鶏むね ブロッコリー チーズ焼き', t: 'main', g: 'meat', ing: ['鶏むね', 'ブロッコリー', 'チーズ'], h: 1, f: 1 },
  { n: '春キャベツと鶏むねのレンジ蒸し', k: '春キャベツ 鶏むね 蒸し', t: 'main', g: 'meat', ing: ['鶏むね', 'キャベツ'], m: SPRING, h: 1 },
  { n: 'ささみのチーズ焼き', k: 'ささみ チーズ焼き', t: 'main', g: 'meat', ing: ['チーズ'], h: 1, f: 1 },
  { n: '手羽元のさっぱり煮', k: '手羽元 さっぱり煮', t: 'main', g: 'meat', ing: [], o: 1 },
  { n: '鶏団子鍋', k: '鶏団子 鍋', t: 'main', g: 'meat', ing: ['ひき肉'], m: WINTER, h: 1, fb: 1 },

  // ---------- main: minced meat ----------
  { n: '豆腐入り鶏つくね', k: '豆腐 鶏つくね', t: 'main', g: 'meat', ing: ['ひき肉', '豆腐'], h: 1, f: 1, s: 1 },
  { n: '豆腐ハンバーグ', k: '豆腐ハンバーグ', t: 'main', g: 'meat', ing: ['ひき肉', '豆腐'], h: 1, f: 1, s: 1 },
  { n: 'ひじき入りハンバーグ', k: 'ひじき ハンバーグ', t: 'main', g: 'meat', ing: ['ひき肉'], fb: 1, f: 1, hv: '玉ねぎ・にんじんはみじん切りにして混ぜ込む' },
  { n: 'とうもろこし入りつくね', k: 'とうもろこし つくね', t: 'main', g: 'meat', ing: ['ひき肉', 'とうもろこし'], m: [6, 7, 8, 9], f: 1 },
  { n: 'かぼちゃのそぼろ煮', k: 'かぼちゃ そぼろ煮', t: 'main', g: 'meat', ing: ['ひき肉', 'カボチャ'], m: [9, 10, 11, 12], f: 1, fb: 1 },
  { n: 'じゃがいものそぼろ煮', k: 'じゃがいも そぼろ煮', t: 'main', g: 'meat', ing: ['ひき肉', 'じゃがいも'], f: 1 },
  { n: '子供向け麻婆豆腐（辛くない）', k: '麻婆豆腐 辛くない', t: 'main', g: 'meat', ing: ['ひき肉', '豆腐'], o: 1, s: 1 },
  { n: 'れんこんのはさみ焼き', k: 'れんこん はさみ焼き', t: 'main', g: 'meat', ing: ['ひき肉'], m: [10, 11, 12, 1, 2], fb: 1, o: 1 },
  { n: '大豆入りミートソース', k: '大豆 ミートソース', t: 'main', g: 'meat', ing: ['ひき肉', 'プチトマト'], fb: 1, s: 1, hv: '玉ねぎ・にんじんはすりおろすかみじん切りに' },

  // ---------- main: pork ----------
  { n: '豚しゃぶサラダ', k: '豚しゃぶ サラダ', t: 'main', g: 'meat', ing: ['豚こま', 'きゅうり', 'プチトマト'], m: [6, 7, 8, 9], h: 1, o: 1 },
  { n: '豚の生姜焼き', k: '豚 生姜焼き', t: 'main', g: 'meat', ing: ['豚こま'], o: 1 },
  { n: '豚こまとさつまいもの甘辛炒め', k: '豚こま さつまいも 甘辛', t: 'main', g: 'meat', ing: ['豚こま', 'さつまいも'], m: [9, 10, 11, 12], f: 1, fb: 1 },
  { n: '豚肉とキャベツの味噌炒め', k: '豚肉 キャベツ 味噌炒め', t: 'main', g: 'meat', ing: ['豚こま', 'キャベツ'], o: 1 },
  { n: '豚バラと白菜のレンジ蒸し', k: '豚バラ 白菜 レンジ蒸し', t: 'main', g: 'meat', ing: [], m: [11, 12, 1, 2], h: 1 },
  { n: 'アスパラの肉巻き', k: 'アスパラ 肉巻き', t: 'main', g: 'meat', ing: ['豚こま'], m: [4, 5, 6], f: 1, o: 1 },
  { n: 'ジャーマンポテト', k: 'ジャーマンポテト ウインナー', t: 'main', g: 'meat', ing: ['じゃがいも', 'ウインナー'], f: 1, o: 1 },

  // ---------- main: beef (lean only) ----------
  { n: '牛ももとブロッコリーのオイスター炒め', k: '牛もも ブロッコリー オイスター', t: 'main', g: 'meat', ing: ['ブロッコリー'], o: 1 },
  { n: '牛赤身のステーキ', k: '牛赤身 ステーキ', t: 'main', g: 'meat', ing: [], o: 1 },

  // ---------- main: fish / seafood ----------
  { n: '鮭のムニエル', k: '鮭 ムニエル', t: 'main', g: 'fish', ing: ['鮭'], m: AUTUMN, f: 1 },
  { n: '鮭とブロッコリーのチーズ焼き', k: '鮭 ブロッコリー チーズ焼き', t: 'main', g: 'fish', ing: ['鮭', 'ブロッコリー', 'チーズ'], f: 1 },
  { n: '鮭のちゃんちゃん焼き', k: '鮭 ちゃんちゃん焼き フライパン', t: 'main', g: 'fish', ing: ['鮭', 'キャベツ'], m: AUTUMN, h: 1, o: 1 },
  { n: 'さばの味噌煮', k: 'さば 味噌煮', t: 'main', g: 'fish', ing: [], m: [10, 11, 12, 1, 2], o: 1 },
  { n: 'さばの竜田揚げ', k: 'さば 竜田揚げ', t: 'main', g: 'fish', ing: [], m: [10, 11, 12, 1, 2], f: 1, o: 1 },
  { n: 'さんまの蒲焼き', k: 'さんま 蒲焼き', t: 'main', g: 'fish', ing: [], m: [9, 10], f: 1, o: 1 },
  { n: 'ぶりの照り焼き', k: 'ぶり 照り焼き', t: 'main', g: 'fish', ing: [], m: WINTER, o: 1 },
  { n: 'たらのホイル焼き', k: 'たら ホイル焼き', t: 'main', g: 'fish', ing: [], m: WINTER, h: 1 },
  { n: 'かじきの照り焼き', k: 'かじき 照り焼き', t: 'main', g: 'fish', ing: [], f: 1 },
  { n: 'あじフライ', k: 'あじフライ', t: 'main', g: 'fish', ing: [], m: [5, 6, 7], o: 1 },
  { n: 'かつおの竜田揚げ', k: 'かつお 竜田揚げ', t: 'main', g: 'fish', ing: [], m: [4, 5, 9, 10], o: 1 },
  { n: '白身魚のチーズパン粉焼き', k: '白身魚 パン粉焼き チーズ', t: 'main', g: 'fish', ing: ['チーズ'], h: 1, f: 1 },
  { n: 'えびとブロッコリーの卵炒め', k: 'えび ブロッコリー 卵炒め', t: 'main', g: 'fish', ing: ['ブロッコリー', '卵'], f: 1, h: 1 },

  // ---------- main: soy / egg ----------
  { n: '厚揚げと豚肉の甘辛炒め', k: '厚揚げ 豚肉 甘辛', t: 'main', g: 'soy', ing: ['豚こま'], o: 1, s: 1 },
  { n: '豆腐チャンプルー', k: '豆腐チャンプルー', t: 'main', g: 'soy', ing: ['豆腐', '卵'], h: 1, o: 1, s: 1 },
  { n: '高野豆腐の卵とじ', k: '高野豆腐 卵とじ', t: 'main', g: 'soy', ing: ['卵'], h: 1, f: 1, s: 1 },
  { n: 'スパニッシュオムレツ', k: 'スパニッシュオムレツ', t: 'main', g: 'egg', ing: ['卵', 'じゃがいも', 'ブロッコリー'], f: 1 },
  { n: 'クリームシチュー', k: 'クリームシチュー ブロッコリー', t: 'main', g: 'meat', ing: ['鶏もも', 'ブロッコリー', 'じゃがいも'], m: [11, 12, 1, 2], f: 1, hv: '玉ねぎ・にんじんは小さく切って煮溶かす' },

  // ---------- side ----------
  { n: 'ブロッコリーのおかか和え', k: 'ブロッコリー おかか和え', t: 'side', g: 'veg', ing: ['ブロッコリー'], f: 1, h: 1 },
  { n: 'ブロッコリーのポタージュ', k: 'ブロッコリー ポタージュ', t: 'side', g: 'veg', ing: ['ブロッコリー'], f: 1, h: 1 },
  { n: 'きゅうりの塩昆布和え', k: 'きゅうり 塩昆布', t: 'side', g: 'veg', ing: ['きゅうり'], f: 1, o: 1, h: 1 },
  { n: 'もずく酢ときゅうり', k: 'もずく酢 きゅうり', t: 'side', g: 'veg', ing: ['きゅうり'], f: 1, fb: 1, h: 1 },
  { n: 'かぼちゃサラダ', k: 'かぼちゃサラダ', t: 'side', g: 'veg', ing: ['カボチャ'], f: 1, fb: 1 },
  { n: 'かぼちゃのポタージュ', k: 'かぼちゃ ポタージュ', t: 'side', g: 'veg', ing: ['カボチャ'], m: [9, 10, 11, 12], f: 1 },
  { n: 'ポテトサラダ（ハム・きゅうり）', k: 'ポテトサラダ ハム きゅうり', t: 'side', g: 'veg', ing: ['じゃがいも', 'きゅうり', 'ハム'], f: 1 },
  { n: 'コーンスープ', k: 'コーンスープ', t: 'side', g: 'veg', ing: ['とうもろこし'], m: SUMMER, f: 1 },
  { n: 'さつまいものレモン煮', k: 'さつまいも レモン煮', t: 'side', g: 'veg', ing: ['さつまいも'], m: AUTUMN, f: 1, fb: 1 },
  { n: 'さつまいもサラダ', k: 'さつまいも サラダ', t: 'side', g: 'veg', ing: ['さつまいも'], m: AUTUMN, f: 1, fb: 1 },
  { n: 'プチトマトのマリネ', k: 'ミニトマト マリネ', t: 'side', g: 'veg', ing: ['プチトマト'], f: 1, o: 1, h: 1 },
  { n: 'コールスロー', k: 'コールスロー', t: 'side', g: 'veg', ing: ['キャベツ', 'とうもろこし'], f: 1, h: 1 },
  { n: 'ほうれん草のポタージュ', k: 'ほうれん草 ポタージュ', t: 'side', g: 'veg', ing: [], m: [11, 12, 1, 2], hv: 'ミキサーにかければ食べやすい' },
  { n: '具だくさん豚汁', k: '具だくさん 豚汁', t: 'side', g: 'veg', ing: ['豚こま'], m: [10, 11, 12, 1, 2], fb: 1, hv: 'にんじん・玉ねぎは小さめに' },
  { n: 'ミネストローネ', k: 'ミネストローネ', t: 'side', g: 'veg', ing: ['プチトマト', 'じゃがいも'], fb: 1, hv: '玉ねぎ・にんじんは細かく刻む' },
  { n: 'ひじきの煮物', k: 'ひじき 煮物', t: 'side', g: 'veg', ing: [], fb: 1, s: 1, hv: 'にんじんは細切りに' },
  { n: 'きんぴらごぼう', k: 'きんぴらごぼう', t: 'side', g: 'veg', ing: [], m: [10, 11, 12, 1, 2], fb: 1, o: 1, hv: 'にんじんは細切りに' },
  { n: 'きのこのマリネ', k: 'きのこ マリネ', t: 'side', g: 'veg', ing: [], m: AUTUMN, fb: 1, o: 1, h: 1 },
  { n: 'オクラのおかか和え', k: 'オクラ おかか', t: 'side', g: 'veg', ing: [], m: [6, 7, 8, 9], fb: 1, h: 1 },
  { n: '枝豆', k: '枝豆 茹で方', t: 'side', g: 'soy', ing: [], m: [7, 8, 9], f: 1, o: 1, fb: 1, s: 1 },
  { n: '大根と鶏の煮物', k: '大根 鶏 煮物', t: 'side', g: 'veg', ing: ['鶏もも'], m: [11, 12, 1, 2], h: 1 },
  { n: '白菜のスープ', k: '白菜 スープ', t: 'side', g: 'veg', ing: [], m: [11, 12, 1, 2], h: 1 },
  { n: '豆腐とわかめの味噌汁', k: '豆腐 わかめ 味噌汁', t: 'side', g: 'soy', ing: ['豆腐'], h: 1, fb: 1, s: 1 },
  { n: '納豆の和え物', k: '納豆 和え物', t: 'side', g: 'soy', ing: ['納豆'], h: 1, fb: 1, s: 1 },
  { n: '冷奴（しらす・のり）', k: '冷奴 しらす', t: 'side', g: 'soy', ing: ['豆腐'], m: [6, 7, 8, 9], h: 1, o: 1, s: 1 },
  { n: 'かまぼこ入り茶碗蒸し', k: '茶碗蒸し かまぼこ', t: 'side', g: 'egg', ing: ['卵', 'かまぼこ'], f: 1, h: 1 },
  { n: 'ふわふわ卵スープ', k: '卵スープ', t: 'side', g: 'egg', ing: ['卵'], f: 1, h: 1 },

  // ---------- rice (Merumama does not eat plain white rice) ----------
  { n: 'さつまいもご飯', k: 'さつまいもご飯', t: 'rice', g: 'veg', ing: ['さつまいも'], m: AUTUMN, f: 1, fb: 1 },
  { n: '栗ご飯', k: '栗ご飯', t: 'rice', g: 'veg', ing: [], m: [9, 10], fb: 1 },
  { n: 'きのこの炊き込みご飯', k: 'きのこ 炊き込みご飯', t: 'rice', g: 'veg', ing: [], m: AUTUMN, fb: 1 },
  { n: 'とうもろこしご飯', k: 'とうもろこしご飯', t: 'rice', g: 'veg', ing: ['とうもろこし'], m: SUMMER, f: 1 },
  { n: '枝豆とじゃこのご飯', k: '枝豆 じゃこ ご飯', t: 'rice', g: 'soy', ing: [], m: [7, 8, 9], s: 1 },
  { n: '豆ご飯', k: '豆ご飯', t: 'rice', g: 'veg', ing: [], m: [4, 5], fb: 1 },
  { n: '鮭の混ぜご飯', k: '鮭 混ぜご飯', t: 'rice', g: 'fish', ing: ['鮭'], f: 1 },
  { n: 'ひじきの混ぜご飯', k: 'ひじき 混ぜご飯', t: 'rice', g: 'veg', ing: [], fb: 1 },
  { n: 'しらすと青のりのおにぎり', k: 'しらす 青のり おにぎり', t: 'rice', g: 'fish', ing: [], f: 1 },
  { n: 'もち麦おにぎり', k: 'もち麦 おにぎり', t: 'rice', g: 'veg', ing: [], fb: 1, h: 1 },
  { n: '鶏そぼろ丼', k: '鶏そぼろ丼', t: 'rice', g: 'meat', ing: ['ひき肉', '卵'], f: 1 },
  { n: 'ケチャップライス', k: 'ケチャップライス', t: 'rice', g: 'veg', ing: ['ウインナー'], f: 1, hv: '玉ねぎ・にんじんはみじん切りで' },
  { n: '手作りふりかけご飯', k: '手作り ふりかけ', t: 'rice', g: 'veg', ing: [], f: 1, fb: 1 },
  { n: '小松菜としらすのふりかけご飯', k: '小松菜 しらす ふりかけ', t: 'rice', g: 'veg', ing: [], m: [12, 1, 2], hv: '細かく刻んでふりかけにすると食べやすい' },
];

const GROUP_LABELS = { meat: '肉', fish: '魚', soy: '大豆', egg: '卵', veg: '野菜', other: 'その他' };
const TYPE_LABELS = { main: '主菜', side: '副菜', rice: 'ごはん' };

const DEFAULT_STOCK = [
  // Items listed as "usually in stock" in CLAUDE.md are on by default.
  { name: 'じゃがいも', on: true },
  { name: 'とうもろこし', on: true },
  { name: 'カボチャ', on: true },
  { name: 'ブロッコリー', on: true },
  { name: 'プチトマト', on: true },
  { name: 'きゅうり', on: true },
  { name: 'ひき肉', on: true },
  { name: '鶏もも', on: true },
  { name: '鶏むね', on: false },
  { name: '豚こま', on: false },
  { name: '鮭', on: false },
  { name: '卵', on: false },
  { name: '豆腐', on: false },
  { name: '納豆', on: false },
  { name: 'キャベツ', on: false },
  { name: 'さつまいも', on: false },
  { name: 'チーズ', on: false },
  { name: 'ハム', on: false },
  { name: 'ウインナー', on: false },
  { name: 'かまぼこ', on: false },
];
