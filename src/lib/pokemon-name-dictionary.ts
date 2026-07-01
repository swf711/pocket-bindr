/**
 * 產生檔，勿手改。重跑 `pnpm tsx scripts/gen-pokemon-name-dictionary.ts` 更新。
 * 來源：PokéAPI pokemon-species（zh-Hant / ja / en names）。
 */
import type { Language } from '@prisma/client'

export const POKEMON_NAMES: Record<number, { en: string; ja: string; zhHant: string }> = {
  "1": {
    "en": "Bulbasaur",
    "ja": "フシギダネ",
    "zhHant": "妙蛙種子"
  },
  "2": {
    "en": "Ivysaur",
    "ja": "フシギソウ",
    "zhHant": "妙蛙草"
  },
  "3": {
    "en": "Venusaur",
    "ja": "フシギバナ",
    "zhHant": "妙蛙花"
  },
  "4": {
    "en": "Charmander",
    "ja": "ヒトカゲ",
    "zhHant": "小火龍"
  },
  "5": {
    "en": "Charmeleon",
    "ja": "リザード",
    "zhHant": "火恐龍"
  },
  "6": {
    "en": "Charizard",
    "ja": "リザードン",
    "zhHant": "噴火龍"
  },
  "7": {
    "en": "Squirtle",
    "ja": "ゼニガメ",
    "zhHant": "傑尼龜"
  },
  "8": {
    "en": "Wartortle",
    "ja": "カメール",
    "zhHant": "卡咪龜"
  },
  "9": {
    "en": "Blastoise",
    "ja": "カメックス",
    "zhHant": "水箭龜"
  },
  "10": {
    "en": "Caterpie",
    "ja": "キャタピー",
    "zhHant": "綠毛蟲"
  },
  "11": {
    "en": "Metapod",
    "ja": "トランセル",
    "zhHant": "鐵甲蛹"
  },
  "12": {
    "en": "Butterfree",
    "ja": "バタフリー",
    "zhHant": "巴大蝶"
  },
  "13": {
    "en": "Weedle",
    "ja": "ビードル",
    "zhHant": "獨角蟲"
  },
  "14": {
    "en": "Kakuna",
    "ja": "コクーン",
    "zhHant": "鐵殼蛹"
  },
  "15": {
    "en": "Beedrill",
    "ja": "スピアー",
    "zhHant": "大針蜂"
  },
  "16": {
    "en": "Pidgey",
    "ja": "ポッポ",
    "zhHant": "波波"
  },
  "17": {
    "en": "Pidgeotto",
    "ja": "ピジョン",
    "zhHant": "比比鳥"
  },
  "18": {
    "en": "Pidgeot",
    "ja": "ピジョット",
    "zhHant": "大比鳥"
  },
  "19": {
    "en": "Rattata",
    "ja": "コラッタ",
    "zhHant": "小拉達"
  },
  "20": {
    "en": "Raticate",
    "ja": "ラッタ",
    "zhHant": "拉達"
  },
  "21": {
    "en": "Spearow",
    "ja": "オニスズメ",
    "zhHant": "烈雀"
  },
  "22": {
    "en": "Fearow",
    "ja": "オニドリル",
    "zhHant": "大嘴雀"
  },
  "23": {
    "en": "Ekans",
    "ja": "アーボ",
    "zhHant": "阿柏蛇"
  },
  "24": {
    "en": "Arbok",
    "ja": "アーボック",
    "zhHant": "阿柏怪"
  },
  "25": {
    "en": "Pikachu",
    "ja": "ピカチュウ",
    "zhHant": "皮卡丘"
  },
  "26": {
    "en": "Raichu",
    "ja": "ライチュウ",
    "zhHant": "雷丘"
  },
  "27": {
    "en": "Sandshrew",
    "ja": "サンド",
    "zhHant": "穿山鼠"
  },
  "28": {
    "en": "Sandslash",
    "ja": "サンドパン",
    "zhHant": "穿山王"
  },
  "29": {
    "en": "Nidoran♀",
    "ja": "ニドラン♀",
    "zhHant": "尼多蘭"
  },
  "30": {
    "en": "Nidorina",
    "ja": "ニドリーナ",
    "zhHant": "尼多娜"
  },
  "31": {
    "en": "Nidoqueen",
    "ja": "ニドクイン",
    "zhHant": "尼多后"
  },
  "32": {
    "en": "Nidoran♂",
    "ja": "ニドラン♂",
    "zhHant": "尼多朗"
  },
  "33": {
    "en": "Nidorino",
    "ja": "ニドリーノ",
    "zhHant": "尼多力諾"
  },
  "34": {
    "en": "Nidoking",
    "ja": "ニドキング",
    "zhHant": "尼多王"
  },
  "35": {
    "en": "Clefairy",
    "ja": "ピッピ",
    "zhHant": "皮皮"
  },
  "36": {
    "en": "Clefable",
    "ja": "ピクシー",
    "zhHant": "皮可西"
  },
  "37": {
    "en": "Vulpix",
    "ja": "ロコン",
    "zhHant": "六尾"
  },
  "38": {
    "en": "Ninetales",
    "ja": "キュウコン",
    "zhHant": "九尾"
  },
  "39": {
    "en": "Jigglypuff",
    "ja": "プリン",
    "zhHant": "胖丁"
  },
  "40": {
    "en": "Wigglytuff",
    "ja": "プクリン",
    "zhHant": "胖可丁"
  },
  "41": {
    "en": "Zubat",
    "ja": "ズバット",
    "zhHant": "超音蝠"
  },
  "42": {
    "en": "Golbat",
    "ja": "ゴルバット",
    "zhHant": "大嘴蝠"
  },
  "43": {
    "en": "Oddish",
    "ja": "ナゾノクサ",
    "zhHant": "走路草"
  },
  "44": {
    "en": "Gloom",
    "ja": "クサイハナ",
    "zhHant": "臭臭花"
  },
  "45": {
    "en": "Vileplume",
    "ja": "ラフレシア",
    "zhHant": "霸王花"
  },
  "46": {
    "en": "Paras",
    "ja": "パラス",
    "zhHant": "派拉斯"
  },
  "47": {
    "en": "Parasect",
    "ja": "パラセクト",
    "zhHant": "派拉斯特"
  },
  "48": {
    "en": "Venonat",
    "ja": "コンパン",
    "zhHant": "毛球"
  },
  "49": {
    "en": "Venomoth",
    "ja": "モルフォン",
    "zhHant": "摩魯蛾"
  },
  "50": {
    "en": "Diglett",
    "ja": "ディグダ",
    "zhHant": "地鼠"
  },
  "51": {
    "en": "Dugtrio",
    "ja": "ダグトリオ",
    "zhHant": "三地鼠"
  },
  "52": {
    "en": "Meowth",
    "ja": "ニャース",
    "zhHant": "喵喵"
  },
  "53": {
    "en": "Persian",
    "ja": "ペルシアン",
    "zhHant": "貓老大"
  },
  "54": {
    "en": "Psyduck",
    "ja": "コダック",
    "zhHant": "可達鴨"
  },
  "55": {
    "en": "Golduck",
    "ja": "ゴルダック",
    "zhHant": "哥達鴨"
  },
  "56": {
    "en": "Mankey",
    "ja": "マンキー",
    "zhHant": "猴怪"
  },
  "57": {
    "en": "Primeape",
    "ja": "オコリザル",
    "zhHant": "火爆猴"
  },
  "58": {
    "en": "Growlithe",
    "ja": "ガーディ",
    "zhHant": "卡蒂狗"
  },
  "59": {
    "en": "Arcanine",
    "ja": "ウインディ",
    "zhHant": "風速狗"
  },
  "60": {
    "en": "Poliwag",
    "ja": "ニョロモ",
    "zhHant": "蚊香蝌蚪"
  },
  "61": {
    "en": "Poliwhirl",
    "ja": "ニョロゾ",
    "zhHant": "蚊香君"
  },
  "62": {
    "en": "Poliwrath",
    "ja": "ニョロボン",
    "zhHant": "蚊香泳士"
  },
  "63": {
    "en": "Abra",
    "ja": "ケーシィ",
    "zhHant": "凱西"
  },
  "64": {
    "en": "Kadabra",
    "ja": "ユンゲラー",
    "zhHant": "勇基拉"
  },
  "65": {
    "en": "Alakazam",
    "ja": "フーディン",
    "zhHant": "胡地"
  },
  "66": {
    "en": "Machop",
    "ja": "ワンリキー",
    "zhHant": "腕力"
  },
  "67": {
    "en": "Machoke",
    "ja": "ゴーリキー",
    "zhHant": "豪力"
  },
  "68": {
    "en": "Machamp",
    "ja": "カイリキー",
    "zhHant": "怪力"
  },
  "69": {
    "en": "Bellsprout",
    "ja": "マダツボミ",
    "zhHant": "喇叭芽"
  },
  "70": {
    "en": "Weepinbell",
    "ja": "ウツドン",
    "zhHant": "口呆花"
  },
  "71": {
    "en": "Victreebel",
    "ja": "ウツボット",
    "zhHant": "大食花"
  },
  "72": {
    "en": "Tentacool",
    "ja": "メノクラゲ",
    "zhHant": "瑪瑙水母"
  },
  "73": {
    "en": "Tentacruel",
    "ja": "ドククラゲ",
    "zhHant": "毒刺水母"
  },
  "74": {
    "en": "Geodude",
    "ja": "イシツブテ",
    "zhHant": "小拳石"
  },
  "75": {
    "en": "Graveler",
    "ja": "ゴローン",
    "zhHant": "隆隆石"
  },
  "76": {
    "en": "Golem",
    "ja": "ゴローニャ",
    "zhHant": "隆隆岩"
  },
  "77": {
    "en": "Ponyta",
    "ja": "ポニータ",
    "zhHant": "小火馬"
  },
  "78": {
    "en": "Rapidash",
    "ja": "ギャロップ",
    "zhHant": "烈焰馬"
  },
  "79": {
    "en": "Slowpoke",
    "ja": "ヤドン",
    "zhHant": "呆呆獸"
  },
  "80": {
    "en": "Slowbro",
    "ja": "ヤドラン",
    "zhHant": "呆殼獸"
  },
  "81": {
    "en": "Magnemite",
    "ja": "コイル",
    "zhHant": "小磁怪"
  },
  "82": {
    "en": "Magneton",
    "ja": "レアコイル",
    "zhHant": "三合一磁怪"
  },
  "83": {
    "en": "Farfetch’d",
    "ja": "カモネギ",
    "zhHant": "大蔥鴨"
  },
  "84": {
    "en": "Doduo",
    "ja": "ドードー",
    "zhHant": "嘟嘟"
  },
  "85": {
    "en": "Dodrio",
    "ja": "ドードリオ",
    "zhHant": "嘟嘟利"
  },
  "86": {
    "en": "Seel",
    "ja": "パウワウ",
    "zhHant": "小海獅"
  },
  "87": {
    "en": "Dewgong",
    "ja": "ジュゴン",
    "zhHant": "白海獅"
  },
  "88": {
    "en": "Grimer",
    "ja": "ベトベター",
    "zhHant": "臭泥"
  },
  "89": {
    "en": "Muk",
    "ja": "ベトベトン",
    "zhHant": "臭臭泥"
  },
  "90": {
    "en": "Shellder",
    "ja": "シェルダー",
    "zhHant": "大舌貝"
  },
  "91": {
    "en": "Cloyster",
    "ja": "パルシェン",
    "zhHant": "刺甲貝"
  },
  "92": {
    "en": "Gastly",
    "ja": "ゴース",
    "zhHant": "鬼斯"
  },
  "93": {
    "en": "Haunter",
    "ja": "ゴースト",
    "zhHant": "鬼斯通"
  },
  "94": {
    "en": "Gengar",
    "ja": "ゲンガー",
    "zhHant": "耿鬼"
  },
  "95": {
    "en": "Onix",
    "ja": "イワーク",
    "zhHant": "大岩蛇"
  },
  "96": {
    "en": "Drowzee",
    "ja": "スリープ",
    "zhHant": "催眠貘"
  },
  "97": {
    "en": "Hypno",
    "ja": "スリーパー",
    "zhHant": "引夢貘人"
  },
  "98": {
    "en": "Krabby",
    "ja": "クラブ",
    "zhHant": "大鉗蟹"
  },
  "99": {
    "en": "Kingler",
    "ja": "キングラー",
    "zhHant": "巨鉗蟹"
  },
  "100": {
    "en": "Voltorb",
    "ja": "ビリリダマ",
    "zhHant": "霹靂電球"
  },
  "101": {
    "en": "Electrode",
    "ja": "マルマイン",
    "zhHant": "頑皮雷彈"
  },
  "102": {
    "en": "Exeggcute",
    "ja": "タマタマ",
    "zhHant": "蛋蛋"
  },
  "103": {
    "en": "Exeggutor",
    "ja": "ナッシー",
    "zhHant": "椰蛋樹"
  },
  "104": {
    "en": "Cubone",
    "ja": "カラカラ",
    "zhHant": "卡拉卡拉"
  },
  "105": {
    "en": "Marowak",
    "ja": "ガラガラ",
    "zhHant": "嘎啦嘎啦"
  },
  "106": {
    "en": "Hitmonlee",
    "ja": "サワムラー",
    "zhHant": "飛腿郎"
  },
  "107": {
    "en": "Hitmonchan",
    "ja": "エビワラー",
    "zhHant": "快拳郎"
  },
  "108": {
    "en": "Lickitung",
    "ja": "ベロリンガ",
    "zhHant": "大舌頭"
  },
  "109": {
    "en": "Koffing",
    "ja": "ドガース",
    "zhHant": "瓦斯彈"
  },
  "110": {
    "en": "Weezing",
    "ja": "マタドガス",
    "zhHant": "雙彈瓦斯"
  },
  "111": {
    "en": "Rhyhorn",
    "ja": "サイホーン",
    "zhHant": "獨角犀牛"
  },
  "112": {
    "en": "Rhydon",
    "ja": "サイドン",
    "zhHant": "鑽角犀獸"
  },
  "113": {
    "en": "Chansey",
    "ja": "ラッキー",
    "zhHant": "吉利蛋"
  },
  "114": {
    "en": "Tangela",
    "ja": "モンジャラ",
    "zhHant": "蔓藤怪"
  },
  "115": {
    "en": "Kangaskhan",
    "ja": "ガルーラ",
    "zhHant": "袋獸"
  },
  "116": {
    "en": "Horsea",
    "ja": "タッツー",
    "zhHant": "墨海馬"
  },
  "117": {
    "en": "Seadra",
    "ja": "シードラ",
    "zhHant": "海刺龍"
  },
  "118": {
    "en": "Goldeen",
    "ja": "トサキント",
    "zhHant": "角金魚"
  },
  "119": {
    "en": "Seaking",
    "ja": "アズマオウ",
    "zhHant": "金魚王"
  },
  "120": {
    "en": "Staryu",
    "ja": "ヒトデマン",
    "zhHant": "海星星"
  },
  "121": {
    "en": "Starmie",
    "ja": "スターミー",
    "zhHant": "寶石海星"
  },
  "122": {
    "en": "Mr. Mime",
    "ja": "バリヤード",
    "zhHant": "魔牆人偶"
  },
  "123": {
    "en": "Scyther",
    "ja": "ストライク",
    "zhHant": "飛天螳螂"
  },
  "124": {
    "en": "Jynx",
    "ja": "ルージュラ",
    "zhHant": "迷唇姐"
  },
  "125": {
    "en": "Electabuzz",
    "ja": "エレブー",
    "zhHant": "電擊獸"
  },
  "126": {
    "en": "Magmar",
    "ja": "ブーバー",
    "zhHant": "鴨嘴火獸"
  },
  "127": {
    "en": "Pinsir",
    "ja": "カイロス",
    "zhHant": "凱羅斯"
  },
  "128": {
    "en": "Tauros",
    "ja": "ケンタロス",
    "zhHant": "肯泰羅"
  },
  "129": {
    "en": "Magikarp",
    "ja": "コイキング",
    "zhHant": "鯉魚王"
  },
  "130": {
    "en": "Gyarados",
    "ja": "ギャラドス",
    "zhHant": "暴鯉龍"
  },
  "131": {
    "en": "Lapras",
    "ja": "ラプラス",
    "zhHant": "拉普拉斯"
  },
  "132": {
    "en": "Ditto",
    "ja": "メタモン",
    "zhHant": "百變怪"
  },
  "133": {
    "en": "Eevee",
    "ja": "イーブイ",
    "zhHant": "伊布"
  },
  "134": {
    "en": "Vaporeon",
    "ja": "シャワーズ",
    "zhHant": "水伊布"
  },
  "135": {
    "en": "Jolteon",
    "ja": "サンダース",
    "zhHant": "雷伊布"
  },
  "136": {
    "en": "Flareon",
    "ja": "ブースター",
    "zhHant": "火伊布"
  },
  "137": {
    "en": "Porygon",
    "ja": "ポリゴン",
    "zhHant": "多邊獸"
  },
  "138": {
    "en": "Omanyte",
    "ja": "オムナイト",
    "zhHant": "菊石獸"
  },
  "139": {
    "en": "Omastar",
    "ja": "オムスター",
    "zhHant": "多刺菊石獸"
  },
  "140": {
    "en": "Kabuto",
    "ja": "カブト",
    "zhHant": "化石盔"
  },
  "141": {
    "en": "Kabutops",
    "ja": "カブトプス",
    "zhHant": "鐮刀盔"
  },
  "142": {
    "en": "Aerodactyl",
    "ja": "プテラ",
    "zhHant": "化石翼龍"
  },
  "143": {
    "en": "Snorlax",
    "ja": "カビゴン",
    "zhHant": "卡比獸"
  },
  "144": {
    "en": "Articuno",
    "ja": "フリーザー",
    "zhHant": "急凍鳥"
  },
  "145": {
    "en": "Zapdos",
    "ja": "サンダー",
    "zhHant": "閃電鳥"
  },
  "146": {
    "en": "Moltres",
    "ja": "ファイヤー",
    "zhHant": "火焰鳥"
  },
  "147": {
    "en": "Dratini",
    "ja": "ミニリュウ",
    "zhHant": "迷你龍"
  },
  "148": {
    "en": "Dragonair",
    "ja": "ハクリュー",
    "zhHant": "哈克龍"
  },
  "149": {
    "en": "Dragonite",
    "ja": "カイリュー",
    "zhHant": "快龍"
  },
  "150": {
    "en": "Mewtwo",
    "ja": "ミュウツー",
    "zhHant": "超夢"
  },
  "151": {
    "en": "Mew",
    "ja": "ミュウ",
    "zhHant": "夢幻"
  },
  "152": {
    "en": "Chikorita",
    "ja": "チコリータ",
    "zhHant": "菊草葉"
  },
  "153": {
    "en": "Bayleef",
    "ja": "ベイリーフ",
    "zhHant": "月桂葉"
  },
  "154": {
    "en": "Meganium",
    "ja": "メガニウム",
    "zhHant": "大竺葵"
  },
  "155": {
    "en": "Cyndaquil",
    "ja": "ヒノアラシ",
    "zhHant": "火球鼠"
  },
  "156": {
    "en": "Quilava",
    "ja": "マグマラシ",
    "zhHant": "火岩鼠"
  },
  "157": {
    "en": "Typhlosion",
    "ja": "バクフーン",
    "zhHant": "火爆獸"
  },
  "158": {
    "en": "Totodile",
    "ja": "ワニノコ",
    "zhHant": "小鋸鱷"
  },
  "159": {
    "en": "Croconaw",
    "ja": "アリゲイツ",
    "zhHant": "藍鱷"
  },
  "160": {
    "en": "Feraligatr",
    "ja": "オーダイル",
    "zhHant": "大力鱷"
  },
  "161": {
    "en": "Sentret",
    "ja": "オタチ",
    "zhHant": "尾立"
  },
  "162": {
    "en": "Furret",
    "ja": "オオタチ",
    "zhHant": "大尾立"
  },
  "163": {
    "en": "Hoothoot",
    "ja": "ホーホー",
    "zhHant": "咕咕"
  },
  "164": {
    "en": "Noctowl",
    "ja": "ヨルノズク",
    "zhHant": "貓頭夜鷹"
  },
  "165": {
    "en": "Ledyba",
    "ja": "レディバ",
    "zhHant": "芭瓢蟲"
  },
  "166": {
    "en": "Ledian",
    "ja": "レディアン",
    "zhHant": "安瓢蟲"
  },
  "167": {
    "en": "Spinarak",
    "ja": "イトマル",
    "zhHant": "圓絲蛛"
  },
  "168": {
    "en": "Ariados",
    "ja": "アリアドス",
    "zhHant": "阿利多斯"
  },
  "169": {
    "en": "Crobat",
    "ja": "クロバット",
    "zhHant": "叉字蝠"
  },
  "170": {
    "en": "Chinchou",
    "ja": "チョンチー",
    "zhHant": "燈籠魚"
  },
  "171": {
    "en": "Lanturn",
    "ja": "ランターン",
    "zhHant": "電燈怪"
  },
  "172": {
    "en": "Pichu",
    "ja": "ピチュー",
    "zhHant": "皮丘"
  },
  "173": {
    "en": "Cleffa",
    "ja": "ピィ",
    "zhHant": "皮寶寶"
  },
  "174": {
    "en": "Igglybuff",
    "ja": "ププリン",
    "zhHant": "寶寶丁"
  },
  "175": {
    "en": "Togepi",
    "ja": "トゲピー",
    "zhHant": "波克比"
  },
  "176": {
    "en": "Togetic",
    "ja": "トゲチック",
    "zhHant": "波克基古"
  },
  "177": {
    "en": "Natu",
    "ja": "ネイティ",
    "zhHant": "天然雀"
  },
  "178": {
    "en": "Xatu",
    "ja": "ネイティオ",
    "zhHant": "天然鳥"
  },
  "179": {
    "en": "Mareep",
    "ja": "メリープ",
    "zhHant": "咩利羊"
  },
  "180": {
    "en": "Flaaffy",
    "ja": "モココ",
    "zhHant": "茸茸羊"
  },
  "181": {
    "en": "Ampharos",
    "ja": "デンリュウ",
    "zhHant": "電龍"
  },
  "182": {
    "en": "Bellossom",
    "ja": "キレイハナ",
    "zhHant": "美麗花"
  },
  "183": {
    "en": "Marill",
    "ja": "マリル",
    "zhHant": "瑪力露"
  },
  "184": {
    "en": "Azumarill",
    "ja": "マリルリ",
    "zhHant": "瑪力露麗"
  },
  "185": {
    "en": "Sudowoodo",
    "ja": "ウソッキー",
    "zhHant": "樹才怪"
  },
  "186": {
    "en": "Politoed",
    "ja": "ニョロトノ",
    "zhHant": "蚊香蛙皇"
  },
  "187": {
    "en": "Hoppip",
    "ja": "ハネッコ",
    "zhHant": "毽子草"
  },
  "188": {
    "en": "Skiploom",
    "ja": "ポポッコ",
    "zhHant": "毽子花"
  },
  "189": {
    "en": "Jumpluff",
    "ja": "ワタッコ",
    "zhHant": "毽子棉"
  },
  "190": {
    "en": "Aipom",
    "ja": "エイパム",
    "zhHant": "長尾怪手"
  },
  "191": {
    "en": "Sunkern",
    "ja": "ヒマナッツ",
    "zhHant": "向日種子"
  },
  "192": {
    "en": "Sunflora",
    "ja": "キマワリ",
    "zhHant": "向日花怪"
  },
  "193": {
    "en": "Yanma",
    "ja": "ヤンヤンマ",
    "zhHant": "蜻蜻蜓"
  },
  "194": {
    "en": "Wooper",
    "ja": "ウパー",
    "zhHant": "烏波"
  },
  "195": {
    "en": "Quagsire",
    "ja": "ヌオー",
    "zhHant": "沼王"
  },
  "196": {
    "en": "Espeon",
    "ja": "エーフィ",
    "zhHant": "太陽伊布"
  },
  "197": {
    "en": "Umbreon",
    "ja": "ブラッキー",
    "zhHant": "月亮伊布"
  },
  "198": {
    "en": "Murkrow",
    "ja": "ヤミカラス",
    "zhHant": "黑暗鴉"
  },
  "199": {
    "en": "Slowking",
    "ja": "ヤドキング",
    "zhHant": "呆呆王"
  },
  "200": {
    "en": "Misdreavus",
    "ja": "ムウマ",
    "zhHant": "夢妖"
  },
  "201": {
    "en": "Unown",
    "ja": "アンノーン",
    "zhHant": "未知圖騰"
  },
  "202": {
    "en": "Wobbuffet",
    "ja": "ソーナンス",
    "zhHant": "果然翁"
  },
  "203": {
    "en": "Girafarig",
    "ja": "キリンリキ",
    "zhHant": "麒麟奇"
  },
  "204": {
    "en": "Pineco",
    "ja": "クヌギダマ",
    "zhHant": "榛果球"
  },
  "205": {
    "en": "Forretress",
    "ja": "フォレトス",
    "zhHant": "佛烈托斯"
  },
  "206": {
    "en": "Dunsparce",
    "ja": "ノコッチ",
    "zhHant": "土龍弟弟"
  },
  "207": {
    "en": "Gligar",
    "ja": "グライガー",
    "zhHant": "天蠍"
  },
  "208": {
    "en": "Steelix",
    "ja": "ハガネール",
    "zhHant": "大鋼蛇"
  },
  "209": {
    "en": "Snubbull",
    "ja": "ブルー",
    "zhHant": "布魯"
  },
  "210": {
    "en": "Granbull",
    "ja": "グランブル",
    "zhHant": "布魯皇"
  },
  "211": {
    "en": "Qwilfish",
    "ja": "ハリーセン",
    "zhHant": "千針魚"
  },
  "212": {
    "en": "Scizor",
    "ja": "ハッサム",
    "zhHant": "巨鉗螳螂"
  },
  "213": {
    "en": "Shuckle",
    "ja": "ツボツボ",
    "zhHant": "壺壺"
  },
  "214": {
    "en": "Heracross",
    "ja": "ヘラクロス",
    "zhHant": "赫拉克羅斯"
  },
  "215": {
    "en": "Sneasel",
    "ja": "ニューラ",
    "zhHant": "狃拉"
  },
  "216": {
    "en": "Teddiursa",
    "ja": "ヒメグマ",
    "zhHant": "熊寶寶"
  },
  "217": {
    "en": "Ursaring",
    "ja": "リングマ",
    "zhHant": "圈圈熊"
  },
  "218": {
    "en": "Slugma",
    "ja": "マグマッグ",
    "zhHant": "熔岩蟲"
  },
  "219": {
    "en": "Magcargo",
    "ja": "マグカルゴ",
    "zhHant": "熔岩蝸牛"
  },
  "220": {
    "en": "Swinub",
    "ja": "ウリムー",
    "zhHant": "小山豬"
  },
  "221": {
    "en": "Piloswine",
    "ja": "イノムー",
    "zhHant": "長毛豬"
  },
  "222": {
    "en": "Corsola",
    "ja": "サニーゴ",
    "zhHant": "太陽珊瑚"
  },
  "223": {
    "en": "Remoraid",
    "ja": "テッポウオ",
    "zhHant": "鐵炮魚"
  },
  "224": {
    "en": "Octillery",
    "ja": "オクタン",
    "zhHant": "章魚桶"
  },
  "225": {
    "en": "Delibird",
    "ja": "デリバード",
    "zhHant": "信使鳥"
  },
  "226": {
    "en": "Mantine",
    "ja": "マンタイン",
    "zhHant": "巨翅飛魚"
  },
  "227": {
    "en": "Skarmory",
    "ja": "エアームド",
    "zhHant": "盔甲鳥"
  },
  "228": {
    "en": "Houndour",
    "ja": "デルビル",
    "zhHant": "戴魯比"
  },
  "229": {
    "en": "Houndoom",
    "ja": "ヘルガー",
    "zhHant": "黑魯加"
  },
  "230": {
    "en": "Kingdra",
    "ja": "キングドラ",
    "zhHant": "刺龍王"
  },
  "231": {
    "en": "Phanpy",
    "ja": "ゴマゾウ",
    "zhHant": "小小象"
  },
  "232": {
    "en": "Donphan",
    "ja": "ドンファン",
    "zhHant": "頓甲"
  },
  "233": {
    "en": "Porygon2",
    "ja": "ポリゴン２",
    "zhHant": "多邊獸Ⅱ"
  },
  "234": {
    "en": "Stantler",
    "ja": "オドシシ",
    "zhHant": "驚角鹿"
  },
  "235": {
    "en": "Smeargle",
    "ja": "ドーブル",
    "zhHant": "圖圖犬"
  },
  "236": {
    "en": "Tyrogue",
    "ja": "バルキー",
    "zhHant": "無畏小子"
  },
  "237": {
    "en": "Hitmontop",
    "ja": "カポエラー",
    "zhHant": "戰舞郎"
  },
  "238": {
    "en": "Smoochum",
    "ja": "ムチュール",
    "zhHant": "迷唇娃"
  },
  "239": {
    "en": "Elekid",
    "ja": "エレキッド",
    "zhHant": "電擊怪"
  },
  "240": {
    "en": "Magby",
    "ja": "ブビィ",
    "zhHant": "鴨嘴寶寶"
  },
  "241": {
    "en": "Miltank",
    "ja": "ミルタンク",
    "zhHant": "大奶罐"
  },
  "242": {
    "en": "Blissey",
    "ja": "ハピナス",
    "zhHant": "幸福蛋"
  },
  "243": {
    "en": "Raikou",
    "ja": "ライコウ",
    "zhHant": "雷公"
  },
  "244": {
    "en": "Entei",
    "ja": "エンテイ",
    "zhHant": "炎帝"
  },
  "245": {
    "en": "Suicune",
    "ja": "スイクン",
    "zhHant": "水君"
  },
  "246": {
    "en": "Larvitar",
    "ja": "ヨーギラス",
    "zhHant": "幼基拉斯"
  },
  "247": {
    "en": "Pupitar",
    "ja": "サナギラス",
    "zhHant": "沙基拉斯"
  },
  "248": {
    "en": "Tyranitar",
    "ja": "バンギラス",
    "zhHant": "班基拉斯"
  },
  "249": {
    "en": "Lugia",
    "ja": "ルギア",
    "zhHant": "洛奇亞"
  },
  "250": {
    "en": "Ho-Oh",
    "ja": "ホウオウ",
    "zhHant": "鳳王"
  },
  "251": {
    "en": "Celebi",
    "ja": "セレビィ",
    "zhHant": "時拉比"
  },
  "252": {
    "en": "Treecko",
    "ja": "キモリ",
    "zhHant": "木守宮"
  },
  "253": {
    "en": "Grovyle",
    "ja": "ジュプトル",
    "zhHant": "森林蜥蜴"
  },
  "254": {
    "en": "Sceptile",
    "ja": "ジュカイン",
    "zhHant": "蜥蜴王"
  },
  "255": {
    "en": "Torchic",
    "ja": "アチャモ",
    "zhHant": "火稚雞"
  },
  "256": {
    "en": "Combusken",
    "ja": "ワカシャモ",
    "zhHant": "力壯雞"
  },
  "257": {
    "en": "Blaziken",
    "ja": "バシャーモ",
    "zhHant": "火焰雞"
  },
  "258": {
    "en": "Mudkip",
    "ja": "ミズゴロウ",
    "zhHant": "水躍魚"
  },
  "259": {
    "en": "Marshtomp",
    "ja": "ヌマクロー",
    "zhHant": "沼躍魚"
  },
  "260": {
    "en": "Swampert",
    "ja": "ラグラージ",
    "zhHant": "巨沼怪"
  },
  "261": {
    "en": "Poochyena",
    "ja": "ポチエナ",
    "zhHant": "土狼犬"
  },
  "262": {
    "en": "Mightyena",
    "ja": "グラエナ",
    "zhHant": "大狼犬"
  },
  "263": {
    "en": "Zigzagoon",
    "ja": "ジグザグマ",
    "zhHant": "蛇紋熊"
  },
  "264": {
    "en": "Linoone",
    "ja": "マッスグマ",
    "zhHant": "直衝熊"
  },
  "265": {
    "en": "Wurmple",
    "ja": "ケムッソ",
    "zhHant": "刺尾蟲"
  },
  "266": {
    "en": "Silcoon",
    "ja": "カラサリス",
    "zhHant": "甲殼繭"
  },
  "267": {
    "en": "Beautifly",
    "ja": "アゲハント",
    "zhHant": "狩獵鳳蝶"
  },
  "268": {
    "en": "Cascoon",
    "ja": "マユルド",
    "zhHant": "盾甲繭"
  },
  "269": {
    "en": "Dustox",
    "ja": "ドクケイル",
    "zhHant": "毒粉蛾"
  },
  "270": {
    "en": "Lotad",
    "ja": "ハスボー",
    "zhHant": "蓮葉童子"
  },
  "271": {
    "en": "Lombre",
    "ja": "ハスブレロ",
    "zhHant": "蓮帽小童"
  },
  "272": {
    "en": "Ludicolo",
    "ja": "ルンパッパ",
    "zhHant": "樂天河童"
  },
  "273": {
    "en": "Seedot",
    "ja": "タネボー",
    "zhHant": "橡實果"
  },
  "274": {
    "en": "Nuzleaf",
    "ja": "コノハナ",
    "zhHant": "長鼻葉"
  },
  "275": {
    "en": "Shiftry",
    "ja": "ダーテング",
    "zhHant": "狡猾天狗"
  },
  "276": {
    "en": "Taillow",
    "ja": "スバメ",
    "zhHant": "傲骨燕"
  },
  "277": {
    "en": "Swellow",
    "ja": "オオスバメ",
    "zhHant": "大王燕"
  },
  "278": {
    "en": "Wingull",
    "ja": "キャモメ",
    "zhHant": "長翅鷗"
  },
  "279": {
    "en": "Pelipper",
    "ja": "ペリッパー",
    "zhHant": "大嘴鷗"
  },
  "280": {
    "en": "Ralts",
    "ja": "ラルトス",
    "zhHant": "拉魯拉絲"
  },
  "281": {
    "en": "Kirlia",
    "ja": "キルリア",
    "zhHant": "奇魯莉安"
  },
  "282": {
    "en": "Gardevoir",
    "ja": "サーナイト",
    "zhHant": "沙奈朵"
  },
  "283": {
    "en": "Surskit",
    "ja": "アメタマ",
    "zhHant": "溜溜糖球"
  },
  "284": {
    "en": "Masquerain",
    "ja": "アメモース",
    "zhHant": "雨翅蛾"
  },
  "285": {
    "en": "Shroomish",
    "ja": "キノココ",
    "zhHant": "蘑蘑菇"
  },
  "286": {
    "en": "Breloom",
    "ja": "キノガッサ",
    "zhHant": "斗笠菇"
  },
  "287": {
    "en": "Slakoth",
    "ja": "ナマケロ",
    "zhHant": "懶人獺"
  },
  "288": {
    "en": "Vigoroth",
    "ja": "ヤルキモノ",
    "zhHant": "過動猿"
  },
  "289": {
    "en": "Slaking",
    "ja": "ケッキング",
    "zhHant": "請假王"
  },
  "290": {
    "en": "Nincada",
    "ja": "ツチニン",
    "zhHant": "土居忍士"
  },
  "291": {
    "en": "Ninjask",
    "ja": "テッカニン",
    "zhHant": "鐵面忍者"
  },
  "292": {
    "en": "Shedinja",
    "ja": "ヌケニン",
    "zhHant": "脫殼忍者"
  },
  "293": {
    "en": "Whismur",
    "ja": "ゴニョニョ",
    "zhHant": "咕妞妞"
  },
  "294": {
    "en": "Loudred",
    "ja": "ドゴーム",
    "zhHant": "吼爆彈"
  },
  "295": {
    "en": "Exploud",
    "ja": "バクオング",
    "zhHant": "爆音怪"
  },
  "296": {
    "en": "Makuhita",
    "ja": "マクノシタ",
    "zhHant": "幕下力士"
  },
  "297": {
    "en": "Hariyama",
    "ja": "ハリテヤマ",
    "zhHant": "鐵掌力士"
  },
  "298": {
    "en": "Azurill",
    "ja": "ルリリ",
    "zhHant": "露力麗"
  },
  "299": {
    "en": "Nosepass",
    "ja": "ノズパス",
    "zhHant": "朝北鼻"
  },
  "300": {
    "en": "Skitty",
    "ja": "エネコ",
    "zhHant": "向尾喵"
  },
  "301": {
    "en": "Delcatty",
    "ja": "エネコロロ",
    "zhHant": "優雅貓"
  },
  "302": {
    "en": "Sableye",
    "ja": "ヤミラミ",
    "zhHant": "勾魂眼"
  },
  "303": {
    "en": "Mawile",
    "ja": "クチート",
    "zhHant": "大嘴娃"
  },
  "304": {
    "en": "Aron",
    "ja": "ココドラ",
    "zhHant": "可可多拉"
  },
  "305": {
    "en": "Lairon",
    "ja": "コドラ",
    "zhHant": "可多拉"
  },
  "306": {
    "en": "Aggron",
    "ja": "ボスゴドラ",
    "zhHant": "波士可多拉"
  },
  "307": {
    "en": "Meditite",
    "ja": "アサナン",
    "zhHant": "瑪沙那"
  },
  "308": {
    "en": "Medicham",
    "ja": "チャーレム",
    "zhHant": "恰雷姆"
  },
  "309": {
    "en": "Electrike",
    "ja": "ラクライ",
    "zhHant": "落雷獸"
  },
  "310": {
    "en": "Manectric",
    "ja": "ライボルト",
    "zhHant": "雷電獸"
  },
  "311": {
    "en": "Plusle",
    "ja": "プラスル",
    "zhHant": "正電拍拍"
  },
  "312": {
    "en": "Minun",
    "ja": "マイナン",
    "zhHant": "負電拍拍"
  },
  "313": {
    "en": "Volbeat",
    "ja": "バルビート",
    "zhHant": "電螢蟲"
  },
  "314": {
    "en": "Illumise",
    "ja": "イルミーゼ",
    "zhHant": "甜甜螢"
  },
  "315": {
    "en": "Roselia",
    "ja": "ロゼリア",
    "zhHant": "毒薔薇"
  },
  "316": {
    "en": "Gulpin",
    "ja": "ゴクリン",
    "zhHant": "溶食獸"
  },
  "317": {
    "en": "Swalot",
    "ja": "マルノーム",
    "zhHant": "吞食獸"
  },
  "318": {
    "en": "Carvanha",
    "ja": "キバニア",
    "zhHant": "利牙魚"
  },
  "319": {
    "en": "Sharpedo",
    "ja": "サメハダー",
    "zhHant": "巨牙鯊"
  },
  "320": {
    "en": "Wailmer",
    "ja": "ホエルコ",
    "zhHant": "吼吼鯨"
  },
  "321": {
    "en": "Wailord",
    "ja": "ホエルオー",
    "zhHant": "吼鯨王"
  },
  "322": {
    "en": "Numel",
    "ja": "ドンメル",
    "zhHant": "呆火駝"
  },
  "323": {
    "en": "Camerupt",
    "ja": "バクーダ",
    "zhHant": "噴火駝"
  },
  "324": {
    "en": "Torkoal",
    "ja": "コータス",
    "zhHant": "煤炭龜"
  },
  "325": {
    "en": "Spoink",
    "ja": "バネブー",
    "zhHant": "跳跳豬"
  },
  "326": {
    "en": "Grumpig",
    "ja": "ブーピッグ",
    "zhHant": "噗噗豬"
  },
  "327": {
    "en": "Spinda",
    "ja": "パッチール",
    "zhHant": "晃晃斑"
  },
  "328": {
    "en": "Trapinch",
    "ja": "ナックラー",
    "zhHant": "大顎蟻"
  },
  "329": {
    "en": "Vibrava",
    "ja": "ビブラーバ",
    "zhHant": "超音波幼蟲"
  },
  "330": {
    "en": "Flygon",
    "ja": "フライゴン",
    "zhHant": "沙漠蜻蜓"
  },
  "331": {
    "en": "Cacnea",
    "ja": "サボネア",
    "zhHant": "刺球仙人掌"
  },
  "332": {
    "en": "Cacturne",
    "ja": "ノクタス",
    "zhHant": "夢歌仙人掌"
  },
  "333": {
    "en": "Swablu",
    "ja": "チルット",
    "zhHant": "青綿鳥"
  },
  "334": {
    "en": "Altaria",
    "ja": "チルタリス",
    "zhHant": "七夕青鳥"
  },
  "335": {
    "en": "Zangoose",
    "ja": "ザングース",
    "zhHant": "貓鼬斬"
  },
  "336": {
    "en": "Seviper",
    "ja": "ハブネーク",
    "zhHant": "飯匙蛇"
  },
  "337": {
    "en": "Lunatone",
    "ja": "ルナトーン",
    "zhHant": "月石"
  },
  "338": {
    "en": "Solrock",
    "ja": "ソルロック",
    "zhHant": "太陽岩"
  },
  "339": {
    "en": "Barboach",
    "ja": "ドジョッチ",
    "zhHant": "泥泥鰍"
  },
  "340": {
    "en": "Whiscash",
    "ja": "ナマズン",
    "zhHant": "鯰魚王"
  },
  "341": {
    "en": "Corphish",
    "ja": "ヘイガニ",
    "zhHant": "龍蝦小兵"
  },
  "342": {
    "en": "Crawdaunt",
    "ja": "シザリガー",
    "zhHant": "鐵螯龍蝦"
  },
  "343": {
    "en": "Baltoy",
    "ja": "ヤジロン",
    "zhHant": "天秤偶"
  },
  "344": {
    "en": "Claydol",
    "ja": "ネンドール",
    "zhHant": "念力土偶"
  },
  "345": {
    "en": "Lileep",
    "ja": "リリーラ",
    "zhHant": "觸手百合"
  },
  "346": {
    "en": "Cradily",
    "ja": "ユレイドル",
    "zhHant": "搖籃百合"
  },
  "347": {
    "en": "Anorith",
    "ja": "アノプス",
    "zhHant": "太古羽蟲"
  },
  "348": {
    "en": "Armaldo",
    "ja": "アーマルド",
    "zhHant": "太古盔甲"
  },
  "349": {
    "en": "Feebas",
    "ja": "ヒンバス",
    "zhHant": "醜醜魚"
  },
  "350": {
    "en": "Milotic",
    "ja": "ミロカロス",
    "zhHant": "美納斯"
  },
  "351": {
    "en": "Castform",
    "ja": "ポワルン",
    "zhHant": "飄浮泡泡"
  },
  "352": {
    "en": "Kecleon",
    "ja": "カクレオン",
    "zhHant": "變隱龍"
  },
  "353": {
    "en": "Shuppet",
    "ja": "カゲボウズ",
    "zhHant": "怨影娃娃"
  },
  "354": {
    "en": "Banette",
    "ja": "ジュペッタ",
    "zhHant": "詛咒娃娃"
  },
  "355": {
    "en": "Duskull",
    "ja": "ヨマワル",
    "zhHant": "夜巡靈"
  },
  "356": {
    "en": "Dusclops",
    "ja": "サマヨール",
    "zhHant": "彷徨夜靈"
  },
  "357": {
    "en": "Tropius",
    "ja": "トロピウス",
    "zhHant": "熱帶龍"
  },
  "358": {
    "en": "Chimecho",
    "ja": "チリーン",
    "zhHant": "風鈴鈴"
  },
  "359": {
    "en": "Absol",
    "ja": "アブソル",
    "zhHant": "阿勃梭魯"
  },
  "360": {
    "en": "Wynaut",
    "ja": "ソーナノ",
    "zhHant": "小果然"
  },
  "361": {
    "en": "Snorunt",
    "ja": "ユキワラシ",
    "zhHant": "雪童子"
  },
  "362": {
    "en": "Glalie",
    "ja": "オニゴーリ",
    "zhHant": "冰鬼護"
  },
  "363": {
    "en": "Spheal",
    "ja": "タマザラシ",
    "zhHant": "海豹球"
  },
  "364": {
    "en": "Sealeo",
    "ja": "トドグラー",
    "zhHant": "海魔獅"
  },
  "365": {
    "en": "Walrein",
    "ja": "トドゼルガ",
    "zhHant": "帝牙海獅"
  },
  "366": {
    "en": "Clamperl",
    "ja": "パールル",
    "zhHant": "珍珠貝"
  },
  "367": {
    "en": "Huntail",
    "ja": "ハンテール",
    "zhHant": "獵斑魚"
  },
  "368": {
    "en": "Gorebyss",
    "ja": "サクラビス",
    "zhHant": "櫻花魚"
  },
  "369": {
    "en": "Relicanth",
    "ja": "ジーランス",
    "zhHant": "古空棘魚"
  },
  "370": {
    "en": "Luvdisc",
    "ja": "ラブカス",
    "zhHant": "愛心魚"
  },
  "371": {
    "en": "Bagon",
    "ja": "タツベイ",
    "zhHant": "寶貝龍"
  },
  "372": {
    "en": "Shelgon",
    "ja": "コモルー",
    "zhHant": "甲殼龍"
  },
  "373": {
    "en": "Salamence",
    "ja": "ボーマンダ",
    "zhHant": "暴飛龍"
  },
  "374": {
    "en": "Beldum",
    "ja": "ダンバル",
    "zhHant": "鐵啞鈴"
  },
  "375": {
    "en": "Metang",
    "ja": "メタング",
    "zhHant": "金屬怪"
  },
  "376": {
    "en": "Metagross",
    "ja": "メタグロス",
    "zhHant": "巨金怪"
  },
  "377": {
    "en": "Regirock",
    "ja": "レジロック",
    "zhHant": "雷吉洛克"
  },
  "378": {
    "en": "Regice",
    "ja": "レジアイス",
    "zhHant": "雷吉艾斯"
  },
  "379": {
    "en": "Registeel",
    "ja": "レジスチル",
    "zhHant": "雷吉斯奇魯"
  },
  "380": {
    "en": "Latias",
    "ja": "ラティアス",
    "zhHant": "拉帝亞斯"
  },
  "381": {
    "en": "Latios",
    "ja": "ラティオス",
    "zhHant": "拉帝歐斯"
  },
  "382": {
    "en": "Kyogre",
    "ja": "カイオーガ",
    "zhHant": "蓋歐卡"
  },
  "383": {
    "en": "Groudon",
    "ja": "グラードン",
    "zhHant": "固拉多"
  },
  "384": {
    "en": "Rayquaza",
    "ja": "レックウザ",
    "zhHant": "烈空坐"
  },
  "385": {
    "en": "Jirachi",
    "ja": "ジラーチ",
    "zhHant": "基拉祈"
  },
  "386": {
    "en": "Deoxys",
    "ja": "デオキシス",
    "zhHant": "代歐奇希斯"
  },
  "387": {
    "en": "Turtwig",
    "ja": "ナエトル",
    "zhHant": "草苗龜"
  },
  "388": {
    "en": "Grotle",
    "ja": "ハヤシガメ",
    "zhHant": "樹林龜"
  },
  "389": {
    "en": "Torterra",
    "ja": "ドダイトス",
    "zhHant": "土台龜"
  },
  "390": {
    "en": "Chimchar",
    "ja": "ヒコザル",
    "zhHant": "小火焰猴"
  },
  "391": {
    "en": "Monferno",
    "ja": "モウカザル",
    "zhHant": "猛火猴"
  },
  "392": {
    "en": "Infernape",
    "ja": "ゴウカザル",
    "zhHant": "烈焰猴"
  },
  "393": {
    "en": "Piplup",
    "ja": "ポッチャマ",
    "zhHant": "波加曼"
  },
  "394": {
    "en": "Prinplup",
    "ja": "ポッタイシ",
    "zhHant": "波皇子"
  },
  "395": {
    "en": "Empoleon",
    "ja": "エンペルト",
    "zhHant": "帝王拿波"
  },
  "396": {
    "en": "Starly",
    "ja": "ムックル",
    "zhHant": "姆克兒"
  },
  "397": {
    "en": "Staravia",
    "ja": "ムクバード",
    "zhHant": "姆克鳥"
  },
  "398": {
    "en": "Staraptor",
    "ja": "ムクホーク",
    "zhHant": "姆克鷹"
  },
  "399": {
    "en": "Bidoof",
    "ja": "ビッパ",
    "zhHant": "大牙狸"
  },
  "400": {
    "en": "Bibarel",
    "ja": "ビーダル",
    "zhHant": "大尾狸"
  },
  "401": {
    "en": "Kricketot",
    "ja": "コロボーシ",
    "zhHant": "圓法師"
  },
  "402": {
    "en": "Kricketune",
    "ja": "コロトック",
    "zhHant": "音箱蟀"
  },
  "403": {
    "en": "Shinx",
    "ja": "コリンク",
    "zhHant": "小貓怪"
  },
  "404": {
    "en": "Luxio",
    "ja": "ルクシオ",
    "zhHant": "勒克貓"
  },
  "405": {
    "en": "Luxray",
    "ja": "レントラー",
    "zhHant": "倫琴貓"
  },
  "406": {
    "en": "Budew",
    "ja": "スボミー",
    "zhHant": "含羞苞"
  },
  "407": {
    "en": "Roserade",
    "ja": "ロズレイド",
    "zhHant": "羅絲雷朵"
  },
  "408": {
    "en": "Cranidos",
    "ja": "ズガイドス",
    "zhHant": "頭蓋龍"
  },
  "409": {
    "en": "Rampardos",
    "ja": "ラムパルド",
    "zhHant": "戰槌龍"
  },
  "410": {
    "en": "Shieldon",
    "ja": "タテトプス",
    "zhHant": "盾甲龍"
  },
  "411": {
    "en": "Bastiodon",
    "ja": "トリデプス",
    "zhHant": "護城龍"
  },
  "412": {
    "en": "Burmy",
    "ja": "ミノムッチ",
    "zhHant": "結草兒"
  },
  "413": {
    "en": "Wormadam",
    "ja": "ミノマダム",
    "zhHant": "結草貴婦"
  },
  "414": {
    "en": "Mothim",
    "ja": "ガーメイル",
    "zhHant": "紳士蛾"
  },
  "415": {
    "en": "Combee",
    "ja": "ミツハニー",
    "zhHant": "三蜜蜂"
  },
  "416": {
    "en": "Vespiquen",
    "ja": "ビークイン",
    "zhHant": "蜂女王"
  },
  "417": {
    "en": "Pachirisu",
    "ja": "パチリス",
    "zhHant": "帕奇利茲"
  },
  "418": {
    "en": "Buizel",
    "ja": "ブイゼル",
    "zhHant": "泳圈鼬"
  },
  "419": {
    "en": "Floatzel",
    "ja": "フローゼル",
    "zhHant": "浮潛鼬"
  },
  "420": {
    "en": "Cherubi",
    "ja": "チェリンボ",
    "zhHant": "櫻花寶"
  },
  "421": {
    "en": "Cherrim",
    "ja": "チェリム",
    "zhHant": "櫻花兒"
  },
  "422": {
    "en": "Shellos",
    "ja": "カラナクシ",
    "zhHant": "無殼海兔"
  },
  "423": {
    "en": "Gastrodon",
    "ja": "トリトドン",
    "zhHant": "海兔獸"
  },
  "424": {
    "en": "Ambipom",
    "ja": "エテボース",
    "zhHant": "雙尾怪手"
  },
  "425": {
    "en": "Drifloon",
    "ja": "フワンテ",
    "zhHant": "飄飄球"
  },
  "426": {
    "en": "Drifblim",
    "ja": "フワライド",
    "zhHant": "隨風球"
  },
  "427": {
    "en": "Buneary",
    "ja": "ミミロル",
    "zhHant": "捲捲耳"
  },
  "428": {
    "en": "Lopunny",
    "ja": "ミミロップ",
    "zhHant": "長耳兔"
  },
  "429": {
    "en": "Mismagius",
    "ja": "ムウマージ",
    "zhHant": "夢妖魔"
  },
  "430": {
    "en": "Honchkrow",
    "ja": "ドンカラス",
    "zhHant": "烏鴉頭頭"
  },
  "431": {
    "en": "Glameow",
    "ja": "ニャルマー",
    "zhHant": "魅力喵"
  },
  "432": {
    "en": "Purugly",
    "ja": "ブニャット",
    "zhHant": "東施喵"
  },
  "433": {
    "en": "Chingling",
    "ja": "リーシャン",
    "zhHant": "鈴鐺響"
  },
  "434": {
    "en": "Stunky",
    "ja": "スカンプー",
    "zhHant": "臭鼬噗"
  },
  "435": {
    "en": "Skuntank",
    "ja": "スカタンク",
    "zhHant": "坦克臭鼬"
  },
  "436": {
    "en": "Bronzor",
    "ja": "ドーミラー",
    "zhHant": "銅鏡怪"
  },
  "437": {
    "en": "Bronzong",
    "ja": "ドータクン",
    "zhHant": "青銅鐘"
  },
  "438": {
    "en": "Bonsly",
    "ja": "ウソハチ",
    "zhHant": "盆才怪"
  },
  "439": {
    "en": "Mime Jr.",
    "ja": "マネネ",
    "zhHant": "魔尼尼"
  },
  "440": {
    "en": "Happiny",
    "ja": "ピンプク",
    "zhHant": "小福蛋"
  },
  "441": {
    "en": "Chatot",
    "ja": "ペラップ",
    "zhHant": "聒噪鳥"
  },
  "442": {
    "en": "Spiritomb",
    "ja": "ミカルゲ",
    "zhHant": "花岩怪"
  },
  "443": {
    "en": "Gible",
    "ja": "フカマル",
    "zhHant": "圓陸鯊"
  },
  "444": {
    "en": "Gabite",
    "ja": "ガバイト",
    "zhHant": "尖牙陸鯊"
  },
  "445": {
    "en": "Garchomp",
    "ja": "ガブリアス",
    "zhHant": "烈咬陸鯊"
  },
  "446": {
    "en": "Munchlax",
    "ja": "ゴンベ",
    "zhHant": "小卡比獸"
  },
  "447": {
    "en": "Riolu",
    "ja": "リオル",
    "zhHant": "利歐路"
  },
  "448": {
    "en": "Lucario",
    "ja": "ルカリオ",
    "zhHant": "路卡利歐"
  },
  "449": {
    "en": "Hippopotas",
    "ja": "ヒポポタス",
    "zhHant": "沙河馬"
  },
  "450": {
    "en": "Hippowdon",
    "ja": "カバルドン",
    "zhHant": "河馬獸"
  },
  "451": {
    "en": "Skorupi",
    "ja": "スコルピ",
    "zhHant": "鉗尾蠍"
  },
  "452": {
    "en": "Drapion",
    "ja": "ドラピオン",
    "zhHant": "龍王蠍"
  },
  "453": {
    "en": "Croagunk",
    "ja": "グレッグル",
    "zhHant": "不良蛙"
  },
  "454": {
    "en": "Toxicroak",
    "ja": "ドクロッグ",
    "zhHant": "毒骷蛙"
  },
  "455": {
    "en": "Carnivine",
    "ja": "マスキッパ",
    "zhHant": "尖牙籠"
  },
  "456": {
    "en": "Finneon",
    "ja": "ケイコウオ",
    "zhHant": "螢光魚"
  },
  "457": {
    "en": "Lumineon",
    "ja": "ネオラント",
    "zhHant": "霓虹魚"
  },
  "458": {
    "en": "Mantyke",
    "ja": "タマンタ",
    "zhHant": "小球飛魚"
  },
  "459": {
    "en": "Snover",
    "ja": "ユキカブリ",
    "zhHant": "雪笠怪"
  },
  "460": {
    "en": "Abomasnow",
    "ja": "ユキノオー",
    "zhHant": "暴雪王"
  },
  "461": {
    "en": "Weavile",
    "ja": "マニューラ",
    "zhHant": "瑪狃拉"
  },
  "462": {
    "en": "Magnezone",
    "ja": "ジバコイル",
    "zhHant": "自爆磁怪"
  },
  "463": {
    "en": "Lickilicky",
    "ja": "ベロベルト",
    "zhHant": "大舌舔"
  },
  "464": {
    "en": "Rhyperior",
    "ja": "ドサイドン",
    "zhHant": "超甲狂犀"
  },
  "465": {
    "en": "Tangrowth",
    "ja": "モジャンボ",
    "zhHant": "巨蔓藤"
  },
  "466": {
    "en": "Electivire",
    "ja": "エレキブル",
    "zhHant": "電擊魔獸"
  },
  "467": {
    "en": "Magmortar",
    "ja": "ブーバーン",
    "zhHant": "鴨嘴炎獸"
  },
  "468": {
    "en": "Togekiss",
    "ja": "トゲキッス",
    "zhHant": "波克基斯"
  },
  "469": {
    "en": "Yanmega",
    "ja": "メガヤンマ",
    "zhHant": "遠古巨蜓"
  },
  "470": {
    "en": "Leafeon",
    "ja": "リーフィア",
    "zhHant": "葉伊布"
  },
  "471": {
    "en": "Glaceon",
    "ja": "グレイシア",
    "zhHant": "冰伊布"
  },
  "472": {
    "en": "Gliscor",
    "ja": "グライオン",
    "zhHant": "天蠍王"
  },
  "473": {
    "en": "Mamoswine",
    "ja": "マンムー",
    "zhHant": "象牙豬"
  },
  "474": {
    "en": "Porygon-Z",
    "ja": "ポリゴンＺ",
    "zhHant": "多邊獸Ｚ"
  },
  "475": {
    "en": "Gallade",
    "ja": "エルレイド",
    "zhHant": "艾路雷朵"
  },
  "476": {
    "en": "Probopass",
    "ja": "ダイノーズ",
    "zhHant": "大朝北鼻"
  },
  "477": {
    "en": "Dusknoir",
    "ja": "ヨノワール",
    "zhHant": "黑夜魔靈"
  },
  "478": {
    "en": "Froslass",
    "ja": "ユキメノコ",
    "zhHant": "雪妖女"
  },
  "479": {
    "en": "Rotom",
    "ja": "ロトム",
    "zhHant": "洛托姆"
  },
  "480": {
    "en": "Uxie",
    "ja": "ユクシー",
    "zhHant": "由克希"
  },
  "481": {
    "en": "Mesprit",
    "ja": "エムリット",
    "zhHant": "艾姆利多"
  },
  "482": {
    "en": "Azelf",
    "ja": "アグノム",
    "zhHant": "亞克諾姆"
  },
  "483": {
    "en": "Dialga",
    "ja": "ディアルガ",
    "zhHant": "帝牙盧卡"
  },
  "484": {
    "en": "Palkia",
    "ja": "パルキア",
    "zhHant": "帕路奇亞"
  },
  "485": {
    "en": "Heatran",
    "ja": "ヒードラン",
    "zhHant": "席多藍恩"
  },
  "486": {
    "en": "Regigigas",
    "ja": "レジギガス",
    "zhHant": "雷吉奇卡斯"
  },
  "487": {
    "en": "Giratina",
    "ja": "ギラティナ",
    "zhHant": "騎拉帝納"
  },
  "488": {
    "en": "Cresselia",
    "ja": "クレセリア",
    "zhHant": "克雷色利亞"
  },
  "489": {
    "en": "Phione",
    "ja": "フィオネ",
    "zhHant": "霏歐納"
  },
  "490": {
    "en": "Manaphy",
    "ja": "マナフィ",
    "zhHant": "瑪納霏"
  },
  "491": {
    "en": "Darkrai",
    "ja": "ダークライ",
    "zhHant": "達克萊伊"
  },
  "492": {
    "en": "Shaymin",
    "ja": "シェイミ",
    "zhHant": "謝米"
  },
  "493": {
    "en": "Arceus",
    "ja": "アルセウス",
    "zhHant": "阿爾宙斯"
  },
  "494": {
    "en": "Victini",
    "ja": "ビクティニ",
    "zhHant": "比克提尼"
  },
  "495": {
    "en": "Snivy",
    "ja": "ツタージャ",
    "zhHant": "藤藤蛇"
  },
  "496": {
    "en": "Servine",
    "ja": "ジャノビー",
    "zhHant": "青藤蛇"
  },
  "497": {
    "en": "Serperior",
    "ja": "ジャローダ",
    "zhHant": "君主蛇"
  },
  "498": {
    "en": "Tepig",
    "ja": "ポカブ",
    "zhHant": "暖暖豬"
  },
  "499": {
    "en": "Pignite",
    "ja": "チャオブー",
    "zhHant": "炒炒豬"
  },
  "500": {
    "en": "Emboar",
    "ja": "エンブオー",
    "zhHant": "炎武王"
  },
  "501": {
    "en": "Oshawott",
    "ja": "ミジュマル",
    "zhHant": "水水獺"
  },
  "502": {
    "en": "Dewott",
    "ja": "フタチマル",
    "zhHant": "雙刃丸"
  },
  "503": {
    "en": "Samurott",
    "ja": "ダイケンキ",
    "zhHant": "大劍鬼"
  },
  "504": {
    "en": "Patrat",
    "ja": "ミネズミ",
    "zhHant": "探探鼠"
  },
  "505": {
    "en": "Watchog",
    "ja": "ミルホッグ",
    "zhHant": "步哨鼠"
  },
  "506": {
    "en": "Lillipup",
    "ja": "ヨーテリー",
    "zhHant": "小約克"
  },
  "507": {
    "en": "Herdier",
    "ja": "ハーデリア",
    "zhHant": "哈約克"
  },
  "508": {
    "en": "Stoutland",
    "ja": "ムーランド",
    "zhHant": "長毛狗"
  },
  "509": {
    "en": "Purrloin",
    "ja": "チョロネコ",
    "zhHant": "扒手貓"
  },
  "510": {
    "en": "Liepard",
    "ja": "レパルダス",
    "zhHant": "酷豹"
  },
  "511": {
    "en": "Pansage",
    "ja": "ヤナップ",
    "zhHant": "花椰猴"
  },
  "512": {
    "en": "Simisage",
    "ja": "ヤナッキー",
    "zhHant": "花椰猿"
  },
  "513": {
    "en": "Pansear",
    "ja": "バオップ",
    "zhHant": "爆香猴"
  },
  "514": {
    "en": "Simisear",
    "ja": "バオッキー",
    "zhHant": "爆香猿"
  },
  "515": {
    "en": "Panpour",
    "ja": "ヒヤップ",
    "zhHant": "冷水猴"
  },
  "516": {
    "en": "Simipour",
    "ja": "ヒヤッキー",
    "zhHant": "冷水猿"
  },
  "517": {
    "en": "Munna",
    "ja": "ムンナ",
    "zhHant": "食夢夢"
  },
  "518": {
    "en": "Musharna",
    "ja": "ムシャーナ",
    "zhHant": "夢夢蝕"
  },
  "519": {
    "en": "Pidove",
    "ja": "マメパト",
    "zhHant": "豆豆鴿"
  },
  "520": {
    "en": "Tranquill",
    "ja": "ハトーボー",
    "zhHant": "咕咕鴿"
  },
  "521": {
    "en": "Unfezant",
    "ja": "ケンホロウ",
    "zhHant": "高傲雉雞"
  },
  "522": {
    "en": "Blitzle",
    "ja": "シママ",
    "zhHant": "斑斑馬"
  },
  "523": {
    "en": "Zebstrika",
    "ja": "ゼブライカ",
    "zhHant": "雷電斑馬"
  },
  "524": {
    "en": "Roggenrola",
    "ja": "ダンゴロ",
    "zhHant": "石丸子"
  },
  "525": {
    "en": "Boldore",
    "ja": "ガントル",
    "zhHant": "地幔岩"
  },
  "526": {
    "en": "Gigalith",
    "ja": "ギガイアス",
    "zhHant": "龐岩怪"
  },
  "527": {
    "en": "Woobat",
    "ja": "コロモリ",
    "zhHant": "滾滾蝙蝠"
  },
  "528": {
    "en": "Swoobat",
    "ja": "ココロモリ",
    "zhHant": "心蝙蝠"
  },
  "529": {
    "en": "Drilbur",
    "ja": "モグリュー",
    "zhHant": "螺釘地鼠"
  },
  "530": {
    "en": "Excadrill",
    "ja": "ドリュウズ",
    "zhHant": "龍頭地鼠"
  },
  "531": {
    "en": "Audino",
    "ja": "タブンネ",
    "zhHant": "差不多娃娃"
  },
  "532": {
    "en": "Timburr",
    "ja": "ドッコラー",
    "zhHant": "搬運小匠"
  },
  "533": {
    "en": "Gurdurr",
    "ja": "ドテッコツ",
    "zhHant": "鐵骨土人"
  },
  "534": {
    "en": "Conkeldurr",
    "ja": "ローブシン",
    "zhHant": "修建老匠"
  },
  "535": {
    "en": "Tympole",
    "ja": "オタマロ",
    "zhHant": "圓蝌蚪"
  },
  "536": {
    "en": "Palpitoad",
    "ja": "ガマガル",
    "zhHant": "藍蟾蜍"
  },
  "537": {
    "en": "Seismitoad",
    "ja": "ガマゲロゲ",
    "zhHant": "蟾蜍王"
  },
  "538": {
    "en": "Throh",
    "ja": "ナゲキ",
    "zhHant": "投摔鬼"
  },
  "539": {
    "en": "Sawk",
    "ja": "ダゲキ",
    "zhHant": "打擊鬼"
  },
  "540": {
    "en": "Sewaddle",
    "ja": "クルミル",
    "zhHant": "蟲寶包"
  },
  "541": {
    "en": "Swadloon",
    "ja": "クルマユ",
    "zhHant": "寶包繭"
  },
  "542": {
    "en": "Leavanny",
    "ja": "ハハコモリ",
    "zhHant": "保母蟲"
  },
  "543": {
    "en": "Venipede",
    "ja": "フシデ",
    "zhHant": "百足蜈蚣"
  },
  "544": {
    "en": "Whirlipede",
    "ja": "ホイーガ",
    "zhHant": "車輪毬"
  },
  "545": {
    "en": "Scolipede",
    "ja": "ペンドラー",
    "zhHant": "蜈蚣王"
  },
  "546": {
    "en": "Cottonee",
    "ja": "モンメン",
    "zhHant": "木棉球"
  },
  "547": {
    "en": "Whimsicott",
    "ja": "エルフーン",
    "zhHant": "風妖精"
  },
  "548": {
    "en": "Petilil",
    "ja": "チュリネ",
    "zhHant": "百合根娃娃"
  },
  "549": {
    "en": "Lilligant",
    "ja": "ドレディア",
    "zhHant": "裙兒小姐"
  },
  "550": {
    "en": "Basculin",
    "ja": "バスラオ",
    "zhHant": "野蠻鱸魚"
  },
  "551": {
    "en": "Sandile",
    "ja": "メグロコ",
    "zhHant": "黑眼鱷"
  },
  "552": {
    "en": "Krokorok",
    "ja": "ワルビル",
    "zhHant": "混混鱷"
  },
  "553": {
    "en": "Krookodile",
    "ja": "ワルビアル",
    "zhHant": "流氓鱷"
  },
  "554": {
    "en": "Darumaka",
    "ja": "ダルマッカ",
    "zhHant": "火紅不倒翁"
  },
  "555": {
    "en": "Darmanitan",
    "ja": "ヒヒダルマ",
    "zhHant": "達摩狒狒"
  },
  "556": {
    "en": "Maractus",
    "ja": "マラカッチ",
    "zhHant": "沙鈴仙人掌"
  },
  "557": {
    "en": "Dwebble",
    "ja": "イシズマイ",
    "zhHant": "石居蟹"
  },
  "558": {
    "en": "Crustle",
    "ja": "イワパレス",
    "zhHant": "岩殿居蟹"
  },
  "559": {
    "en": "Scraggy",
    "ja": "ズルッグ",
    "zhHant": "滑滑小子"
  },
  "560": {
    "en": "Scrafty",
    "ja": "ズルズキン",
    "zhHant": "頭巾混混"
  },
  "561": {
    "en": "Sigilyph",
    "ja": "シンボラー",
    "zhHant": "象徵鳥"
  },
  "562": {
    "en": "Yamask",
    "ja": "デスマス",
    "zhHant": "哭哭面具"
  },
  "563": {
    "en": "Cofagrigus",
    "ja": "デスカーン",
    "zhHant": "死神棺"
  },
  "564": {
    "en": "Tirtouga",
    "ja": "プロトーガ",
    "zhHant": "原蓋海龜"
  },
  "565": {
    "en": "Carracosta",
    "ja": "アバゴーラ",
    "zhHant": "肋骨海龜"
  },
  "566": {
    "en": "Archen",
    "ja": "アーケン",
    "zhHant": "始祖小鳥"
  },
  "567": {
    "en": "Archeops",
    "ja": "アーケオス",
    "zhHant": "始祖大鳥"
  },
  "568": {
    "en": "Trubbish",
    "ja": "ヤブクロン",
    "zhHant": "破破袋"
  },
  "569": {
    "en": "Garbodor",
    "ja": "ダストダス",
    "zhHant": "灰塵山"
  },
  "570": {
    "en": "Zorua",
    "ja": "ゾロア",
    "zhHant": "索羅亞"
  },
  "571": {
    "en": "Zoroark",
    "ja": "ゾロアーク",
    "zhHant": "索羅亞克"
  },
  "572": {
    "en": "Minccino",
    "ja": "チラーミィ",
    "zhHant": "泡沫栗鼠"
  },
  "573": {
    "en": "Cinccino",
    "ja": "チラチーノ",
    "zhHant": "奇諾栗鼠"
  },
  "574": {
    "en": "Gothita",
    "ja": "ゴチム",
    "zhHant": "哥德寶寶"
  },
  "575": {
    "en": "Gothorita",
    "ja": "ゴチミル",
    "zhHant": "哥德小童"
  },
  "576": {
    "en": "Gothitelle",
    "ja": "ゴチルゼル",
    "zhHant": "哥德小姐"
  },
  "577": {
    "en": "Solosis",
    "ja": "ユニラン",
    "zhHant": "單卵細胞球"
  },
  "578": {
    "en": "Duosion",
    "ja": "ダブラン",
    "zhHant": "雙卵細胞球"
  },
  "579": {
    "en": "Reuniclus",
    "ja": "ランクルス",
    "zhHant": "人造細胞卵"
  },
  "580": {
    "en": "Ducklett",
    "ja": "コアルヒー",
    "zhHant": "鴨寶寶"
  },
  "581": {
    "en": "Swanna",
    "ja": "スワンナ",
    "zhHant": "舞天鵝"
  },
  "582": {
    "en": "Vanillite",
    "ja": "バニプッチ",
    "zhHant": "迷你冰"
  },
  "583": {
    "en": "Vanillish",
    "ja": "バニリッチ",
    "zhHant": "多多冰"
  },
  "584": {
    "en": "Vanilluxe",
    "ja": "バイバニラ",
    "zhHant": "雙倍多多冰"
  },
  "585": {
    "en": "Deerling",
    "ja": "シキジカ",
    "zhHant": "四季鹿"
  },
  "586": {
    "en": "Sawsbuck",
    "ja": "メブキジカ",
    "zhHant": "萌芽鹿"
  },
  "587": {
    "en": "Emolga",
    "ja": "エモンガ",
    "zhHant": "電飛鼠"
  },
  "588": {
    "en": "Karrablast",
    "ja": "カブルモ",
    "zhHant": "蓋蓋蟲"
  },
  "589": {
    "en": "Escavalier",
    "ja": "シュバルゴ",
    "zhHant": "騎士蝸牛"
  },
  "590": {
    "en": "Foongus",
    "ja": "タマゲタケ",
    "zhHant": "哎呀球菇"
  },
  "591": {
    "en": "Amoonguss",
    "ja": "モロバレル",
    "zhHant": "敗露球菇"
  },
  "592": {
    "en": "Frillish",
    "ja": "プルリル",
    "zhHant": "輕飄飄"
  },
  "593": {
    "en": "Jellicent",
    "ja": "ブルンゲル",
    "zhHant": "胖嘟嘟"
  },
  "594": {
    "en": "Alomomola",
    "ja": "ママンボウ",
    "zhHant": "保母曼波"
  },
  "595": {
    "en": "Joltik",
    "ja": "バチュル",
    "zhHant": "電電蟲"
  },
  "596": {
    "en": "Galvantula",
    "ja": "デンチュラ",
    "zhHant": "電蜘蛛"
  },
  "597": {
    "en": "Ferroseed",
    "ja": "テッシード",
    "zhHant": "種子鐵球"
  },
  "598": {
    "en": "Ferrothorn",
    "ja": "ナットレイ",
    "zhHant": "堅果啞鈴"
  },
  "599": {
    "en": "Klink",
    "ja": "ギアル",
    "zhHant": "齒輪兒"
  },
  "600": {
    "en": "Klang",
    "ja": "ギギアル",
    "zhHant": "齒輪組"
  },
  "601": {
    "en": "Klinklang",
    "ja": "ギギギアル",
    "zhHant": "齒輪怪"
  },
  "602": {
    "en": "Tynamo",
    "ja": "シビシラス",
    "zhHant": "麻麻小魚"
  },
  "603": {
    "en": "Eelektrik",
    "ja": "シビビール",
    "zhHant": "麻麻鰻"
  },
  "604": {
    "en": "Eelektross",
    "ja": "シビルドン",
    "zhHant": "麻麻鰻魚王"
  },
  "605": {
    "en": "Elgyem",
    "ja": "リグレー",
    "zhHant": "小灰怪"
  },
  "606": {
    "en": "Beheeyem",
    "ja": "オーベム",
    "zhHant": "大宇怪"
  },
  "607": {
    "en": "Litwick",
    "ja": "ヒトモシ",
    "zhHant": "燭光靈"
  },
  "608": {
    "en": "Lampent",
    "ja": "ランプラー",
    "zhHant": "燈火幽靈"
  },
  "609": {
    "en": "Chandelure",
    "ja": "シャンデラ",
    "zhHant": "水晶燈火靈"
  },
  "610": {
    "en": "Axew",
    "ja": "キバゴ",
    "zhHant": "牙牙"
  },
  "611": {
    "en": "Fraxure",
    "ja": "オノンド",
    "zhHant": "斧牙龍"
  },
  "612": {
    "en": "Haxorus",
    "ja": "オノノクス",
    "zhHant": "雙斧戰龍"
  },
  "613": {
    "en": "Cubchoo",
    "ja": "クマシュン",
    "zhHant": "噴嚏熊"
  },
  "614": {
    "en": "Beartic",
    "ja": "ツンベアー",
    "zhHant": "凍原熊"
  },
  "615": {
    "en": "Cryogonal",
    "ja": "フリージオ",
    "zhHant": "幾何雪花"
  },
  "616": {
    "en": "Shelmet",
    "ja": "チョボマキ",
    "zhHant": "小嘴蝸"
  },
  "617": {
    "en": "Accelgor",
    "ja": "アギルダー",
    "zhHant": "敏捷蟲"
  },
  "618": {
    "en": "Stunfisk",
    "ja": "マッギョ",
    "zhHant": "泥巴魚"
  },
  "619": {
    "en": "Mienfoo",
    "ja": "コジョフー",
    "zhHant": "功夫鼬"
  },
  "620": {
    "en": "Mienshao",
    "ja": "コジョンド",
    "zhHant": "師父鼬"
  },
  "621": {
    "en": "Druddigon",
    "ja": "クリムガン",
    "zhHant": "赤面龍"
  },
  "622": {
    "en": "Golett",
    "ja": "ゴビット",
    "zhHant": "泥偶小人"
  },
  "623": {
    "en": "Golurk",
    "ja": "ゴルーグ",
    "zhHant": "泥偶巨人"
  },
  "624": {
    "en": "Pawniard",
    "ja": "コマタナ",
    "zhHant": "駒刀小兵"
  },
  "625": {
    "en": "Bisharp",
    "ja": "キリキザン",
    "zhHant": "劈斬司令"
  },
  "626": {
    "en": "Bouffalant",
    "ja": "バッフロン",
    "zhHant": "爆炸頭水牛"
  },
  "627": {
    "en": "Rufflet",
    "ja": "ワシボン",
    "zhHant": "毛頭小鷹"
  },
  "628": {
    "en": "Braviary",
    "ja": "ウォーグル",
    "zhHant": "勇士雄鷹"
  },
  "629": {
    "en": "Vullaby",
    "ja": "バルチャイ",
    "zhHant": "禿鷹丫頭"
  },
  "630": {
    "en": "Mandibuzz",
    "ja": "バルジーナ",
    "zhHant": "禿鷹娜"
  },
  "631": {
    "en": "Heatmor",
    "ja": "クイタラン",
    "zhHant": "熔蟻獸"
  },
  "632": {
    "en": "Durant",
    "ja": "アイアント",
    "zhHant": "鐵蟻"
  },
  "633": {
    "en": "Deino",
    "ja": "モノズ",
    "zhHant": "單首龍"
  },
  "634": {
    "en": "Zweilous",
    "ja": "ジヘッド",
    "zhHant": "雙首暴龍"
  },
  "635": {
    "en": "Hydreigon",
    "ja": "サザンドラ",
    "zhHant": "三首惡龍"
  },
  "636": {
    "en": "Larvesta",
    "ja": "メラルバ",
    "zhHant": "燃燒蟲"
  },
  "637": {
    "en": "Volcarona",
    "ja": "ウルガモス",
    "zhHant": "火神蛾"
  },
  "638": {
    "en": "Cobalion",
    "ja": "コバルオン",
    "zhHant": "勾帕路翁"
  },
  "639": {
    "en": "Terrakion",
    "ja": "テラキオン",
    "zhHant": "代拉基翁"
  },
  "640": {
    "en": "Virizion",
    "ja": "ビリジオン",
    "zhHant": "畢力吉翁"
  },
  "641": {
    "en": "Tornadus",
    "ja": "トルネロス",
    "zhHant": "龍捲雲"
  },
  "642": {
    "en": "Thundurus",
    "ja": "ボルトロス",
    "zhHant": "雷電雲"
  },
  "643": {
    "en": "Reshiram",
    "ja": "レシラム",
    "zhHant": "萊希拉姆"
  },
  "644": {
    "en": "Zekrom",
    "ja": "ゼクロム",
    "zhHant": "捷克羅姆"
  },
  "645": {
    "en": "Landorus",
    "ja": "ランドロス",
    "zhHant": "土地雲"
  },
  "646": {
    "en": "Kyurem",
    "ja": "キュレム",
    "zhHant": "酋雷姆"
  },
  "647": {
    "en": "Keldeo",
    "ja": "ケルディオ",
    "zhHant": "凱路迪歐"
  },
  "648": {
    "en": "Meloetta",
    "ja": "メロエッタ",
    "zhHant": "美洛耶塔"
  },
  "649": {
    "en": "Genesect",
    "ja": "ゲノセクト",
    "zhHant": "蓋諾賽克特"
  },
  "650": {
    "en": "Chespin",
    "ja": "ハリマロン",
    "zhHant": "哈力栗"
  },
  "651": {
    "en": "Quilladin",
    "ja": "ハリボーグ",
    "zhHant": "胖胖哈力"
  },
  "652": {
    "en": "Chesnaught",
    "ja": "ブリガロン",
    "zhHant": "布里卡隆"
  },
  "653": {
    "en": "Fennekin",
    "ja": "フォッコ",
    "zhHant": "火狐狸"
  },
  "654": {
    "en": "Braixen",
    "ja": "テールナー",
    "zhHant": "長尾火狐"
  },
  "655": {
    "en": "Delphox",
    "ja": "マフォクシー",
    "zhHant": "妖火紅狐"
  },
  "656": {
    "en": "Froakie",
    "ja": "ケロマツ",
    "zhHant": "呱呱泡蛙"
  },
  "657": {
    "en": "Frogadier",
    "ja": "ゲコガシラ",
    "zhHant": "呱頭蛙"
  },
  "658": {
    "en": "Greninja",
    "ja": "ゲッコウガ",
    "zhHant": "甲賀忍蛙"
  },
  "659": {
    "en": "Bunnelby",
    "ja": "ホルビー",
    "zhHant": "掘掘兔"
  },
  "660": {
    "en": "Diggersby",
    "ja": "ホルード",
    "zhHant": "掘地兔"
  },
  "661": {
    "en": "Fletchling",
    "ja": "ヤヤコマ",
    "zhHant": "小箭雀"
  },
  "662": {
    "en": "Fletchinder",
    "ja": "ヒノヤコマ",
    "zhHant": "火箭雀"
  },
  "663": {
    "en": "Talonflame",
    "ja": "ファイアロー",
    "zhHant": "烈箭鷹"
  },
  "664": {
    "en": "Scatterbug",
    "ja": "コフキムシ",
    "zhHant": "粉蝶蟲"
  },
  "665": {
    "en": "Spewpa",
    "ja": "コフーライ",
    "zhHant": "粉蝶蛹"
  },
  "666": {
    "en": "Vivillon",
    "ja": "ビビヨン",
    "zhHant": "彩粉蝶"
  },
  "667": {
    "en": "Litleo",
    "ja": "シシコ",
    "zhHant": "小獅獅"
  },
  "668": {
    "en": "Pyroar",
    "ja": "カエンジシ",
    "zhHant": "火炎獅"
  },
  "669": {
    "en": "Flabébé",
    "ja": "フラベベ",
    "zhHant": "花蓓蓓"
  },
  "670": {
    "en": "Floette",
    "ja": "フラエッテ",
    "zhHant": "花葉蒂"
  },
  "671": {
    "en": "Florges",
    "ja": "フラージェス",
    "zhHant": "花潔夫人"
  },
  "672": {
    "en": "Skiddo",
    "ja": "メェークル",
    "zhHant": "坐騎小羊"
  },
  "673": {
    "en": "Gogoat",
    "ja": "ゴーゴート",
    "zhHant": "坐騎山羊"
  },
  "674": {
    "en": "Pancham",
    "ja": "ヤンチャム",
    "zhHant": "頑皮熊貓"
  },
  "675": {
    "en": "Pangoro",
    "ja": "ゴロンダ",
    "zhHant": "流氓熊貓"
  },
  "676": {
    "en": "Furfrou",
    "ja": "トリミアン",
    "zhHant": "多麗米亞"
  },
  "677": {
    "en": "Espurr",
    "ja": "ニャスパー",
    "zhHant": "妙喵"
  },
  "678": {
    "en": "Meowstic",
    "ja": "ニャオニクス",
    "zhHant": "超能妙喵"
  },
  "679": {
    "en": "Honedge",
    "ja": "ヒトツキ",
    "zhHant": "獨劍鞘"
  },
  "680": {
    "en": "Doublade",
    "ja": "ニダンギル",
    "zhHant": "雙劍鞘"
  },
  "681": {
    "en": "Aegislash",
    "ja": "ギルガルド",
    "zhHant": "堅盾劍怪"
  },
  "682": {
    "en": "Spritzee",
    "ja": "シュシュプ",
    "zhHant": "粉香香"
  },
  "683": {
    "en": "Aromatisse",
    "ja": "フレフワン",
    "zhHant": "芳香精"
  },
  "684": {
    "en": "Swirlix",
    "ja": "ペロッパフ",
    "zhHant": "綿綿泡芙"
  },
  "685": {
    "en": "Slurpuff",
    "ja": "ペロリーム",
    "zhHant": "胖甜妮"
  },
  "686": {
    "en": "Inkay",
    "ja": "マーイーカ",
    "zhHant": "好啦魷"
  },
  "687": {
    "en": "Malamar",
    "ja": "カラマネロ",
    "zhHant": "烏賊王"
  },
  "688": {
    "en": "Binacle",
    "ja": "カメテテ",
    "zhHant": "龜腳腳"
  },
  "689": {
    "en": "Barbaracle",
    "ja": "ガメノデス",
    "zhHant": "龜足巨鎧"
  },
  "690": {
    "en": "Skrelp",
    "ja": "クズモー",
    "zhHant": "垃垃藻"
  },
  "691": {
    "en": "Dragalge",
    "ja": "ドラミドロ",
    "zhHant": "毒藻龍"
  },
  "692": {
    "en": "Clauncher",
    "ja": "ウデッポウ",
    "zhHant": "鐵臂槍蝦"
  },
  "693": {
    "en": "Clawitzer",
    "ja": "ブロスター",
    "zhHant": "鋼炮臂蝦"
  },
  "694": {
    "en": "Helioptile",
    "ja": "エリキテル",
    "zhHant": "傘電蜥"
  },
  "695": {
    "en": "Heliolisk",
    "ja": "エレザード",
    "zhHant": "光電傘蜥"
  },
  "696": {
    "en": "Tyrunt",
    "ja": "チゴラス",
    "zhHant": "寶寶暴龍"
  },
  "697": {
    "en": "Tyrantrum",
    "ja": "ガチゴラス",
    "zhHant": "怪顎龍"
  },
  "698": {
    "en": "Amaura",
    "ja": "アマルス",
    "zhHant": "冰雪龍"
  },
  "699": {
    "en": "Aurorus",
    "ja": "アマルルガ",
    "zhHant": "冰雪巨龍"
  },
  "700": {
    "en": "Sylveon",
    "ja": "ニンフィア",
    "zhHant": "仙子伊布"
  },
  "701": {
    "en": "Hawlucha",
    "ja": "ルチャブル",
    "zhHant": "摔角鷹人"
  },
  "702": {
    "en": "Dedenne",
    "ja": "デデンネ",
    "zhHant": "咚咚鼠"
  },
  "703": {
    "en": "Carbink",
    "ja": "メレシー",
    "zhHant": "小碎鑽"
  },
  "704": {
    "en": "Goomy",
    "ja": "ヌメラ",
    "zhHant": "黏黏寶"
  },
  "705": {
    "en": "Sliggoo",
    "ja": "ヌメイル",
    "zhHant": "黏美兒"
  },
  "706": {
    "en": "Goodra",
    "ja": "ヌメルゴン",
    "zhHant": "黏美龍"
  },
  "707": {
    "en": "Klefki",
    "ja": "クレッフィ",
    "zhHant": "鑰圈兒"
  },
  "708": {
    "en": "Phantump",
    "ja": "ボクレー",
    "zhHant": "小木靈"
  },
  "709": {
    "en": "Trevenant",
    "ja": "オーロット",
    "zhHant": "朽木妖"
  },
  "710": {
    "en": "Pumpkaboo",
    "ja": "バケッチャ",
    "zhHant": "南瓜精"
  },
  "711": {
    "en": "Gourgeist",
    "ja": "パンプジン",
    "zhHant": "南瓜怪人"
  },
  "712": {
    "en": "Bergmite",
    "ja": "カチコール",
    "zhHant": "冰寶"
  },
  "713": {
    "en": "Avalugg",
    "ja": "クレベース",
    "zhHant": "冰岩怪"
  },
  "714": {
    "en": "Noibat",
    "ja": "オンバット",
    "zhHant": "嗡蝠"
  },
  "715": {
    "en": "Noivern",
    "ja": "オンバーン",
    "zhHant": "音波龍"
  },
  "716": {
    "en": "Xerneas",
    "ja": "ゼルネアス",
    "zhHant": "哲爾尼亞斯"
  },
  "717": {
    "en": "Yveltal",
    "ja": "イベルタル",
    "zhHant": "伊裴爾塔爾"
  },
  "718": {
    "en": "Zygarde",
    "ja": "ジガルデ",
    "zhHant": "基格爾德"
  },
  "719": {
    "en": "Diancie",
    "ja": "ディアンシー",
    "zhHant": "蒂安希"
  },
  "720": {
    "en": "Hoopa",
    "ja": "フーパ",
    "zhHant": "胡帕"
  },
  "721": {
    "en": "Volcanion",
    "ja": "ボルケニオン",
    "zhHant": "波爾凱尼恩"
  },
  "722": {
    "en": "Rowlet",
    "ja": "モクロー",
    "zhHant": "木木梟"
  },
  "723": {
    "en": "Dartrix",
    "ja": "フクスロー",
    "zhHant": "投羽梟"
  },
  "724": {
    "en": "Decidueye",
    "ja": "ジュナイパー",
    "zhHant": "狙射樹梟"
  },
  "725": {
    "en": "Litten",
    "ja": "ニャビー",
    "zhHant": "火斑喵"
  },
  "726": {
    "en": "Torracat",
    "ja": "ニャヒート",
    "zhHant": "炎熱喵"
  },
  "727": {
    "en": "Incineroar",
    "ja": "ガオガエン",
    "zhHant": "熾焰咆哮虎"
  },
  "728": {
    "en": "Popplio",
    "ja": "アシマリ",
    "zhHant": "球球海獅"
  },
  "729": {
    "en": "Brionne",
    "ja": "オシャマリ",
    "zhHant": "花漾海獅"
  },
  "730": {
    "en": "Primarina",
    "ja": "アシレーヌ",
    "zhHant": "西獅海壬"
  },
  "731": {
    "en": "Pikipek",
    "ja": "ツツケラ",
    "zhHant": "小篤兒"
  },
  "732": {
    "en": "Trumbeak",
    "ja": "ケララッパ",
    "zhHant": "喇叭啄鳥"
  },
  "733": {
    "en": "Toucannon",
    "ja": "ドデカバシ",
    "zhHant": "銃嘴大鳥"
  },
  "734": {
    "en": "Yungoos",
    "ja": "ヤングース",
    "zhHant": "貓鼬少"
  },
  "735": {
    "en": "Gumshoos",
    "ja": "デカグース",
    "zhHant": "貓鼬探長"
  },
  "736": {
    "en": "Grubbin",
    "ja": "アゴジムシ",
    "zhHant": "強顎雞母蟲"
  },
  "737": {
    "en": "Charjabug",
    "ja": "デンヂムシ",
    "zhHant": "蟲電寶"
  },
  "738": {
    "en": "Vikavolt",
    "ja": "クワガノン",
    "zhHant": "鍬農炮蟲"
  },
  "739": {
    "en": "Crabrawler",
    "ja": "マケンカニ",
    "zhHant": "好勝蟹"
  },
  "740": {
    "en": "Crabominable",
    "ja": "ケケンカニ",
    "zhHant": "好勝毛蟹"
  },
  "741": {
    "en": "Oricorio",
    "ja": "オドリドリ",
    "zhHant": "花舞鳥"
  },
  "742": {
    "en": "Cutiefly",
    "ja": "アブリー",
    "zhHant": "萌虻"
  },
  "743": {
    "en": "Ribombee",
    "ja": "アブリボン",
    "zhHant": "蝶結萌虻"
  },
  "744": {
    "en": "Rockruff",
    "ja": "イワンコ",
    "zhHant": "岩狗狗"
  },
  "745": {
    "en": "Lycanroc",
    "ja": "ルガルガン",
    "zhHant": "鬃岩狼人"
  },
  "746": {
    "en": "Wishiwashi",
    "ja": "ヨワシ",
    "zhHant": "弱丁魚"
  },
  "747": {
    "en": "Mareanie",
    "ja": "ヒドイデ",
    "zhHant": "好壞星"
  },
  "748": {
    "en": "Toxapex",
    "ja": "ドヒドイデ",
    "zhHant": "超壞星"
  },
  "749": {
    "en": "Mudbray",
    "ja": "ドロバンコ",
    "zhHant": "泥驢仔"
  },
  "750": {
    "en": "Mudsdale",
    "ja": "バンバドロ",
    "zhHant": "重泥挽馬"
  },
  "751": {
    "en": "Dewpider",
    "ja": "シズクモ",
    "zhHant": "滴蛛"
  },
  "752": {
    "en": "Araquanid",
    "ja": "オニシズクモ",
    "zhHant": "滴蛛霸"
  },
  "753": {
    "en": "Fomantis",
    "ja": "カリキリ",
    "zhHant": "偽螳草"
  },
  "754": {
    "en": "Lurantis",
    "ja": "ラランテス",
    "zhHant": "蘭螳花"
  },
  "755": {
    "en": "Morelull",
    "ja": "ネマシュ",
    "zhHant": "睡睡菇"
  },
  "756": {
    "en": "Shiinotic",
    "ja": "マシェード",
    "zhHant": "燈罩夜菇"
  },
  "757": {
    "en": "Salandit",
    "ja": "ヤトウモリ",
    "zhHant": "夜盜火蜥"
  },
  "758": {
    "en": "Salazzle",
    "ja": "エンニュート",
    "zhHant": "焰后蜥"
  },
  "759": {
    "en": "Stufful",
    "ja": "ヌイコグマ",
    "zhHant": "童偶熊"
  },
  "760": {
    "en": "Bewear",
    "ja": "キテルグマ",
    "zhHant": "穿著熊"
  },
  "761": {
    "en": "Bounsweet",
    "ja": "アマカジ",
    "zhHant": "甜竹竹"
  },
  "762": {
    "en": "Steenee",
    "ja": "アママイコ",
    "zhHant": "甜舞妮"
  },
  "763": {
    "en": "Tsareena",
    "ja": "アマージョ",
    "zhHant": "甜冷美后"
  },
  "764": {
    "en": "Comfey",
    "ja": "キュワワー",
    "zhHant": "花療環環"
  },
  "765": {
    "en": "Oranguru",
    "ja": "ヤレユータン",
    "zhHant": "智揮猩"
  },
  "766": {
    "en": "Passimian",
    "ja": "ナゲツケサル",
    "zhHant": "投擲猴"
  },
  "767": {
    "en": "Wimpod",
    "ja": "コソクムシ",
    "zhHant": "膽小蟲"
  },
  "768": {
    "en": "Golisopod",
    "ja": "グソクムシャ",
    "zhHant": "具甲武者"
  },
  "769": {
    "en": "Sandygast",
    "ja": "スナバァ",
    "zhHant": "沙丘娃"
  },
  "770": {
    "en": "Palossand",
    "ja": "シロデスナ",
    "zhHant": "噬沙堡爺"
  },
  "771": {
    "en": "Pyukumuku",
    "ja": "ナマコブシ",
    "zhHant": "拳海參"
  },
  "772": {
    "en": "Type: Null",
    "ja": "タイプ：ヌル",
    "zhHant": "屬性：空"
  },
  "773": {
    "en": "Silvally",
    "ja": "シルヴァディ",
    "zhHant": "銀伴戰獸"
  },
  "774": {
    "en": "Minior",
    "ja": "メテノ",
    "zhHant": "小隕星"
  },
  "775": {
    "en": "Komala",
    "ja": "ネッコアラ",
    "zhHant": "樹枕尾熊"
  },
  "776": {
    "en": "Turtonator",
    "ja": "バクガメス",
    "zhHant": "爆焰龜獸"
  },
  "777": {
    "en": "Togedemaru",
    "ja": "トゲデマル",
    "zhHant": "托戈德瑪爾"
  },
  "778": {
    "en": "Mimikyu",
    "ja": "ミミッキュ",
    "zhHant": "謎擬Ｑ"
  },
  "779": {
    "en": "Bruxish",
    "ja": "ハギギシリ",
    "zhHant": "磨牙彩皮魚"
  },
  "780": {
    "en": "Drampa",
    "ja": "ジジーロン",
    "zhHant": "老翁龍"
  },
  "781": {
    "en": "Dhelmise",
    "ja": "ダダリン",
    "zhHant": "破破舵輪"
  },
  "782": {
    "en": "Jangmo-o",
    "ja": "ジャラコ",
    "zhHant": "心鱗寶"
  },
  "783": {
    "en": "Hakamo-o",
    "ja": "ジャランゴ",
    "zhHant": "鱗甲龍"
  },
  "784": {
    "en": "Kommo-o",
    "ja": "ジャラランガ",
    "zhHant": "杖尾鱗甲龍"
  },
  "785": {
    "en": "Tapu Koko",
    "ja": "カプ・コケコ",
    "zhHant": "卡璞・鳴鳴"
  },
  "786": {
    "en": "Tapu Lele",
    "ja": "カプ・テテフ",
    "zhHant": "卡璞・蝶蝶"
  },
  "787": {
    "en": "Tapu Bulu",
    "ja": "カプ・ブルル",
    "zhHant": "卡璞・哞哞"
  },
  "788": {
    "en": "Tapu Fini",
    "ja": "カプ・レヒレ",
    "zhHant": "卡璞・鰭鰭"
  },
  "789": {
    "en": "Cosmog",
    "ja": "コスモッグ",
    "zhHant": "科斯莫古"
  },
  "790": {
    "en": "Cosmoem",
    "ja": "コスモウム",
    "zhHant": "科斯莫姆"
  },
  "791": {
    "en": "Solgaleo",
    "ja": "ソルガレオ",
    "zhHant": "索爾迦雷歐"
  },
  "792": {
    "en": "Lunala",
    "ja": "ルナアーラ",
    "zhHant": "露奈雅拉"
  },
  "793": {
    "en": "Nihilego",
    "ja": "ウツロイド",
    "zhHant": "虛吾伊德"
  },
  "794": {
    "en": "Buzzwole",
    "ja": "マッシブーン",
    "zhHant": "爆肌蚊"
  },
  "795": {
    "en": "Pheromosa",
    "ja": "フェローチェ",
    "zhHant": "費洛美螂"
  },
  "796": {
    "en": "Xurkitree",
    "ja": "デンジュモク",
    "zhHant": "電束木"
  },
  "797": {
    "en": "Celesteela",
    "ja": "テッカグヤ",
    "zhHant": "鐵火輝夜"
  },
  "798": {
    "en": "Kartana",
    "ja": "カミツルギ",
    "zhHant": "紙御劍"
  },
  "799": {
    "en": "Guzzlord",
    "ja": "アクジキング",
    "zhHant": "惡食大王"
  },
  "800": {
    "en": "Necrozma",
    "ja": "ネクロズマ",
    "zhHant": "奈克洛茲瑪"
  },
  "801": {
    "en": "Magearna",
    "ja": "マギアナ",
    "zhHant": "瑪機雅娜"
  },
  "802": {
    "en": "Marshadow",
    "ja": "マーシャドー",
    "zhHant": "瑪夏多"
  },
  "803": {
    "en": "Poipole",
    "ja": "ベベノム",
    "zhHant": "毒貝比"
  },
  "804": {
    "en": "Naganadel",
    "ja": "アーゴヨン",
    "zhHant": "四顎針龍"
  },
  "805": {
    "en": "Stakataka",
    "ja": "ツンデツンデ",
    "zhHant": "壘磊石"
  },
  "806": {
    "en": "Blacephalon",
    "ja": "ズガドーン",
    "zhHant": "砰頭小丑"
  },
  "807": {
    "en": "Zeraora",
    "ja": "ゼラオラ",
    "zhHant": "捷拉奧拉"
  },
  "808": {
    "en": "Meltan",
    "ja": "メルタン",
    "zhHant": "美錄坦"
  },
  "809": {
    "en": "Melmetal",
    "ja": "メルメタル",
    "zhHant": "美錄梅塔"
  },
  "810": {
    "en": "Grookey",
    "ja": "サルノリ",
    "zhHant": "敲音猴"
  },
  "811": {
    "en": "Thwackey",
    "ja": "バチンキー",
    "zhHant": "啪咚猴"
  },
  "812": {
    "en": "Rillaboom",
    "ja": "ゴリランダー",
    "zhHant": "轟擂金剛猩"
  },
  "813": {
    "en": "Scorbunny",
    "ja": "ヒバニー",
    "zhHant": "炎兔兒"
  },
  "814": {
    "en": "Raboot",
    "ja": "ラビフット",
    "zhHant": "騰蹴小將"
  },
  "815": {
    "en": "Cinderace",
    "ja": "エースバーン",
    "zhHant": "閃焰王牌"
  },
  "816": {
    "en": "Sobble",
    "ja": "メッソン",
    "zhHant": "淚眼蜥"
  },
  "817": {
    "en": "Drizzile",
    "ja": "ジメレオン",
    "zhHant": "變澀蜥"
  },
  "818": {
    "en": "Inteleon",
    "ja": "インテレオン",
    "zhHant": "千面避役"
  },
  "819": {
    "en": "Skwovet",
    "ja": "ホシガリス",
    "zhHant": "貪心栗鼠"
  },
  "820": {
    "en": "Greedent",
    "ja": "ヨクバリス",
    "zhHant": "藏飽栗鼠"
  },
  "821": {
    "en": "Rookidee",
    "ja": "ココガラ",
    "zhHant": "稚山雀"
  },
  "822": {
    "en": "Corvisquire",
    "ja": "アオガラス",
    "zhHant": "藍鴉"
  },
  "823": {
    "en": "Corviknight",
    "ja": "アーマーガア",
    "zhHant": "鋼鎧鴉"
  },
  "824": {
    "en": "Blipbug",
    "ja": "サッチムシ",
    "zhHant": "索偵蟲"
  },
  "825": {
    "en": "Dottler",
    "ja": "レドームシ",
    "zhHant": "天罩蟲"
  },
  "826": {
    "en": "Orbeetle",
    "ja": "イオルブ",
    "zhHant": "以歐路普"
  },
  "827": {
    "en": "Nickit",
    "ja": "クスネ",
    "zhHant": "偷兒狐"
  },
  "828": {
    "en": "Thievul",
    "ja": "フォクスライ",
    "zhHant": "狐大盜"
  },
  "829": {
    "en": "Gossifleur",
    "ja": "ヒメンカ",
    "zhHant": "幼棉棉"
  },
  "830": {
    "en": "Eldegoss",
    "ja": "ワタシラガ",
    "zhHant": "白蓬蓬"
  },
  "831": {
    "en": "Wooloo",
    "ja": "ウールー",
    "zhHant": "毛辮羊"
  },
  "832": {
    "en": "Dubwool",
    "ja": "バイウールー",
    "zhHant": "毛毛角羊"
  },
  "833": {
    "en": "Chewtle",
    "ja": "カムカメ",
    "zhHant": "咬咬龜"
  },
  "834": {
    "en": "Drednaw",
    "ja": "カジリガメ",
    "zhHant": "暴噬龜"
  },
  "835": {
    "en": "Yamper",
    "ja": "ワンパチ",
    "zhHant": "來電汪"
  },
  "836": {
    "en": "Boltund",
    "ja": "パルスワン",
    "zhHant": "逐電犬"
  },
  "837": {
    "en": "Rolycoly",
    "ja": "タンドン",
    "zhHant": "小炭仔"
  },
  "838": {
    "en": "Carkol",
    "ja": "トロッゴン",
    "zhHant": "大炭車"
  },
  "839": {
    "en": "Coalossal",
    "ja": "セキタンザン",
    "zhHant": "巨炭山"
  },
  "840": {
    "en": "Applin",
    "ja": "カジッチュ",
    "zhHant": "啃果蟲"
  },
  "841": {
    "en": "Flapple",
    "ja": "アップリュー",
    "zhHant": "蘋裹龍"
  },
  "842": {
    "en": "Appletun",
    "ja": "タルップル",
    "zhHant": "豐蜜龍"
  },
  "843": {
    "en": "Silicobra",
    "ja": "スナヘビ",
    "zhHant": "沙包蛇"
  },
  "844": {
    "en": "Sandaconda",
    "ja": "サダイジャ",
    "zhHant": "沙螺蟒"
  },
  "845": {
    "en": "Cramorant",
    "ja": "ウッウ",
    "zhHant": "古月鳥"
  },
  "846": {
    "en": "Arrokuda",
    "ja": "サシカマス",
    "zhHant": "刺梭魚"
  },
  "847": {
    "en": "Barraskewda",
    "ja": "カマスジョー",
    "zhHant": "戽斗尖梭"
  },
  "848": {
    "en": "Toxel",
    "ja": "エレズン",
    "zhHant": "毒電嬰"
  },
  "849": {
    "en": "Toxtricity",
    "ja": "ストリンダー",
    "zhHant": "顫弦蠑螈"
  },
  "850": {
    "en": "Sizzlipede",
    "ja": "ヤクデ",
    "zhHant": "燒火蚣"
  },
  "851": {
    "en": "Centiskorch",
    "ja": "マルヤクデ",
    "zhHant": "焚焰蚣"
  },
  "852": {
    "en": "Clobbopus",
    "ja": "タタッコ",
    "zhHant": "拳拳蛸"
  },
  "853": {
    "en": "Grapploct",
    "ja": "オトスパス",
    "zhHant": "八爪武師"
  },
  "854": {
    "en": "Sinistea",
    "ja": "ヤバチャ",
    "zhHant": "來悲茶"
  },
  "855": {
    "en": "Polteageist",
    "ja": "ポットデス",
    "zhHant": "怖思壺"
  },
  "856": {
    "en": "Hatenna",
    "ja": "ミブリム",
    "zhHant": "迷布莉姆"
  },
  "857": {
    "en": "Hattrem",
    "ja": "テブリム",
    "zhHant": "提布莉姆"
  },
  "858": {
    "en": "Hatterene",
    "ja": "ブリムオン",
    "zhHant": "布莉姆溫"
  },
  "859": {
    "en": "Impidimp",
    "ja": "ベロバー",
    "zhHant": "搗蛋小妖"
  },
  "860": {
    "en": "Morgrem",
    "ja": "ギモー",
    "zhHant": "詐唬魔"
  },
  "861": {
    "en": "Grimmsnarl",
    "ja": "オーロンゲ",
    "zhHant": "長毛巨魔"
  },
  "862": {
    "en": "Obstagoon",
    "ja": "タチフサグマ",
    "zhHant": "堵攔熊"
  },
  "863": {
    "en": "Perrserker",
    "ja": "ニャイキング",
    "zhHant": "喵頭目"
  },
  "864": {
    "en": "Cursola",
    "ja": "サニゴーン",
    "zhHant": "魔靈珊瑚"
  },
  "865": {
    "en": "Sirfetch’d",
    "ja": "ネギガナイト",
    "zhHant": "蔥遊兵"
  },
  "866": {
    "en": "Mr. Rime",
    "ja": "バリコオル",
    "zhHant": "踏冰人偶"
  },
  "867": {
    "en": "Runerigus",
    "ja": "デスバーン",
    "zhHant": "死神板"
  },
  "868": {
    "en": "Milcery",
    "ja": "マホミル",
    "zhHant": "小仙奶"
  },
  "869": {
    "en": "Alcremie",
    "ja": "マホイップ",
    "zhHant": "霜奶仙"
  },
  "870": {
    "en": "Falinks",
    "ja": "タイレーツ",
    "zhHant": "列陣兵"
  },
  "871": {
    "en": "Pincurchin",
    "ja": "バチンウニ",
    "zhHant": "啪嚓海膽"
  },
  "872": {
    "en": "Snom",
    "ja": "ユキハミ",
    "zhHant": "雪吞蟲"
  },
  "873": {
    "en": "Frosmoth",
    "ja": "モスノウ",
    "zhHant": "雪絨蛾"
  },
  "874": {
    "en": "Stonjourner",
    "ja": "イシヘンジン",
    "zhHant": "巨石丁"
  },
  "875": {
    "en": "Eiscue",
    "ja": "コオリッポ",
    "zhHant": "冰砌鵝"
  },
  "876": {
    "en": "Indeedee",
    "ja": "イエッサン",
    "zhHant": "愛管侍"
  },
  "877": {
    "en": "Morpeko",
    "ja": "モルペコ",
    "zhHant": "莫魯貝可"
  },
  "878": {
    "en": "Cufant",
    "ja": "ゾウドウ",
    "zhHant": "銅象"
  },
  "879": {
    "en": "Copperajah",
    "ja": "ダイオウドウ",
    "zhHant": "大王銅象"
  },
  "880": {
    "en": "Dracozolt",
    "ja": "パッチラゴン",
    "zhHant": "雷鳥龍"
  },
  "881": {
    "en": "Arctozolt",
    "ja": "パッチルドン",
    "zhHant": "雷鳥海獸"
  },
  "882": {
    "en": "Dracovish",
    "ja": "ウオノラゴン",
    "zhHant": "鰓魚龍"
  },
  "883": {
    "en": "Arctovish",
    "ja": "ウオチルドン",
    "zhHant": "鰓魚海獸"
  },
  "884": {
    "en": "Duraludon",
    "ja": "ジュラルドン",
    "zhHant": "鋁鋼龍"
  },
  "885": {
    "en": "Dreepy",
    "ja": "ドラメシヤ",
    "zhHant": "多龍梅西亞"
  },
  "886": {
    "en": "Drakloak",
    "ja": "ドロンチ",
    "zhHant": "多龍奇"
  },
  "887": {
    "en": "Dragapult",
    "ja": "ドラパルト",
    "zhHant": "多龍巴魯托"
  },
  "888": {
    "en": "Zacian",
    "ja": "ザシアン",
    "zhHant": "蒼響"
  },
  "889": {
    "en": "Zamazenta",
    "ja": "ザマゼンタ",
    "zhHant": "藏瑪然特"
  },
  "890": {
    "en": "Eternatus",
    "ja": "ムゲンダイナ",
    "zhHant": "無極汰那"
  },
  "891": {
    "en": "Kubfu",
    "ja": "ダクマ",
    "zhHant": "熊徒弟"
  },
  "892": {
    "en": "Urshifu",
    "ja": "ウーラオス",
    "zhHant": "武道熊師"
  },
  "893": {
    "en": "Zarude",
    "ja": "ザルード",
    "zhHant": "薩戮德"
  },
  "894": {
    "en": "Regieleki",
    "ja": "レジエレキ",
    "zhHant": "雷吉艾勒奇"
  },
  "895": {
    "en": "Regidrago",
    "ja": "レジドラゴ",
    "zhHant": "雷吉鐸拉戈"
  },
  "896": {
    "en": "Glastrier",
    "ja": "ブリザポス",
    "zhHant": "雪暴馬"
  },
  "897": {
    "en": "Spectrier",
    "ja": "レイスポス",
    "zhHant": "靈幽馬"
  },
  "898": {
    "en": "Calyrex",
    "ja": "バドレックス",
    "zhHant": "蕾冠王"
  },
  "899": {
    "en": "Wyrdeer",
    "ja": "アヤシシ",
    "zhHant": "詭角鹿"
  },
  "900": {
    "en": "Kleavor",
    "ja": "バサギリ",
    "zhHant": "劈斧螳螂"
  },
  "901": {
    "en": "Ursaluna",
    "ja": "ガチグマ",
    "zhHant": "月月熊"
  },
  "902": {
    "en": "Basculegion",
    "ja": "イダイトウ",
    "zhHant": "幽尾玄魚"
  },
  "903": {
    "en": "Sneasler",
    "ja": "オオニューラ",
    "zhHant": "大狃拉"
  },
  "904": {
    "en": "Overqwil",
    "ja": "ハリーマン",
    "zhHant": "萬針魚"
  },
  "905": {
    "en": "Enamorus",
    "ja": "ラブトロス",
    "zhHant": "眷戀雲"
  },
  "906": {
    "en": "Sprigatito",
    "ja": "ニャオハ",
    "zhHant": "新葉喵"
  },
  "907": {
    "en": "Floragato",
    "ja": "ニャローテ",
    "zhHant": "蒂蕾喵"
  },
  "908": {
    "en": "Meowscarada",
    "ja": "マスカーニャ",
    "zhHant": "魔幻假面喵"
  },
  "909": {
    "en": "Fuecoco",
    "ja": "ホゲータ",
    "zhHant": "呆火鱷"
  },
  "910": {
    "en": "Crocalor",
    "ja": "アチゲータ",
    "zhHant": "炙燙鱷"
  },
  "911": {
    "en": "Skeledirge",
    "ja": "ラウドボーン",
    "zhHant": "骨紋巨聲鱷"
  },
  "912": {
    "en": "Quaxly",
    "ja": "クワッス",
    "zhHant": "潤水鴨"
  },
  "913": {
    "en": "Quaxwell",
    "ja": "ウェルカモ",
    "zhHant": "湧躍鴨"
  },
  "914": {
    "en": "Quaquaval",
    "ja": "ウェーニバル",
    "zhHant": "狂歡浪舞鴨"
  },
  "915": {
    "en": "Lechonk",
    "ja": "グルトン",
    "zhHant": "愛吃豚"
  },
  "916": {
    "en": "Oinkologne",
    "ja": "パフュートン",
    "zhHant": "飄香豚"
  },
  "917": {
    "en": "Tarountula",
    "ja": "タマンチュラ",
    "zhHant": "團珠蛛"
  },
  "918": {
    "en": "Spidops",
    "ja": "ワナイダー",
    "zhHant": "操陷蛛"
  },
  "919": {
    "en": "Nymble",
    "ja": "マメバッタ",
    "zhHant": "豆蟋蟀"
  },
  "920": {
    "en": "Lokix",
    "ja": "エクスレッグ",
    "zhHant": "烈腿蝗"
  },
  "921": {
    "en": "Pawmi",
    "ja": "パモ",
    "zhHant": "布撥"
  },
  "922": {
    "en": "Pawmo",
    "ja": "パモット",
    "zhHant": "布土撥"
  },
  "923": {
    "en": "Pawmot",
    "ja": "パーモット",
    "zhHant": "巴布土撥"
  },
  "924": {
    "en": "Tandemaus",
    "ja": "ワッカネズミ",
    "zhHant": "一對鼠"
  },
  "925": {
    "en": "Maushold",
    "ja": "イッカネズミ",
    "zhHant": "一家鼠"
  },
  "926": {
    "en": "Fidough",
    "ja": "パピモッチ",
    "zhHant": "狗仔包"
  },
  "927": {
    "en": "Dachsbun",
    "ja": "バウッツェル",
    "zhHant": "麻花犬"
  },
  "928": {
    "en": "Smoliv",
    "ja": "ミニーブ",
    "zhHant": "迷你芙"
  },
  "929": {
    "en": "Dolliv",
    "ja": "オリーニョ",
    "zhHant": "奧利紐"
  },
  "930": {
    "en": "Arboliva",
    "ja": "オリーヴァ",
    "zhHant": "奧利瓦"
  },
  "931": {
    "en": "Squawkabilly",
    "ja": "イキリンコ",
    "zhHant": "怒鸚哥"
  },
  "932": {
    "en": "Nacli",
    "ja": "コジオ",
    "zhHant": "鹽石寶"
  },
  "933": {
    "en": "Naclstack",
    "ja": "ジオヅム",
    "zhHant": "鹽石壘"
  },
  "934": {
    "en": "Garganacl",
    "ja": "キョジオーン",
    "zhHant": "鹽石巨靈"
  },
  "935": {
    "en": "Charcadet",
    "ja": "カルボウ",
    "zhHant": "炭小侍"
  },
  "936": {
    "en": "Armarouge",
    "ja": "グレンアルマ",
    "zhHant": "紅蓮鎧騎"
  },
  "937": {
    "en": "Ceruledge",
    "ja": "ソウブレイズ",
    "zhHant": "蒼炎刃鬼"
  },
  "938": {
    "en": "Tadbulb",
    "ja": "ズピカ",
    "zhHant": "光蚪仔"
  },
  "939": {
    "en": "Bellibolt",
    "ja": "ハラバリー",
    "zhHant": "電肚蛙"
  },
  "940": {
    "en": "Wattrel",
    "ja": "カイデン",
    "zhHant": "電海燕"
  },
  "941": {
    "en": "Kilowattrel",
    "ja": "タイカイデン",
    "zhHant": "大電海燕"
  },
  "942": {
    "en": "Maschiff",
    "ja": "オラチフ",
    "zhHant": "偶叫獒"
  },
  "943": {
    "en": "Mabosstiff",
    "ja": "マフィティフ",
    "zhHant": "獒教父"
  },
  "944": {
    "en": "Shroodle",
    "ja": "シルシュルー",
    "zhHant": "滋汁鼴"
  },
  "945": {
    "en": "Grafaiai",
    "ja": "タギングル",
    "zhHant": "塗標客"
  },
  "946": {
    "en": "Bramblin",
    "ja": "アノクサ",
    "zhHant": "納噬草"
  },
  "947": {
    "en": "Brambleghast",
    "ja": "アノホラグサ",
    "zhHant": "怖納噬草"
  },
  "948": {
    "en": "Toedscool",
    "ja": "ノノクラゲ",
    "zhHant": "原野水母"
  },
  "949": {
    "en": "Toedscruel",
    "ja": "リククラゲ",
    "zhHant": "陸地水母"
  },
  "950": {
    "en": "Klawf",
    "ja": "ガケガニ",
    "zhHant": "毛崖蟹"
  },
  "951": {
    "en": "Capsakid",
    "ja": "カプサイジ",
    "zhHant": "熱辣娃"
  },
  "952": {
    "en": "Scovillain",
    "ja": "スコヴィラン",
    "zhHant": "狠辣椒"
  },
  "953": {
    "en": "Rellor",
    "ja": "シガロコ",
    "zhHant": "蟲滾泥"
  },
  "954": {
    "en": "Rabsca",
    "ja": "ベラカス",
    "zhHant": "蟲甲聖"
  },
  "955": {
    "en": "Flittle",
    "ja": "ヒラヒナ",
    "zhHant": "飄飄雛"
  },
  "956": {
    "en": "Espathra",
    "ja": "クエスパトラ",
    "zhHant": "超能艷鴕"
  },
  "957": {
    "en": "Tinkatink",
    "ja": "カヌチャン",
    "zhHant": "小鍛匠"
  },
  "958": {
    "en": "Tinkatuff",
    "ja": "ナカヌチャン",
    "zhHant": "巧鍛匠"
  },
  "959": {
    "en": "Tinkaton",
    "ja": "デカヌチャン",
    "zhHant": "巨鍛匠"
  },
  "960": {
    "en": "Wiglett",
    "ja": "ウミディグダ",
    "zhHant": "海地鼠"
  },
  "961": {
    "en": "Wugtrio",
    "ja": "ウミトリオ",
    "zhHant": "三海地鼠"
  },
  "962": {
    "en": "Bombirdier",
    "ja": "オトシドリ",
    "zhHant": "下石鳥"
  },
  "963": {
    "en": "Finizen",
    "ja": "ナミイルカ",
    "zhHant": "波普海豚"
  },
  "964": {
    "en": "Palafin",
    "ja": "イルカマン",
    "zhHant": "海豚俠"
  },
  "965": {
    "en": "Varoom",
    "ja": "ブロロン",
    "zhHant": "噗隆隆"
  },
  "966": {
    "en": "Revavroom",
    "ja": "ブロロローム",
    "zhHant": "普隆隆姆"
  },
  "967": {
    "en": "Cyclizar",
    "ja": "モトトカゲ",
    "zhHant": "摩托蜥"
  },
  "968": {
    "en": "Orthworm",
    "ja": "ミミズズ",
    "zhHant": "拖拖蚓"
  },
  "969": {
    "en": "Glimmet",
    "ja": "キラーメ",
    "zhHant": "晶光芽"
  },
  "970": {
    "en": "Glimmora",
    "ja": "キラフロル",
    "zhHant": "晶光花"
  },
  "971": {
    "en": "Greavard",
    "ja": "ボチ",
    "zhHant": "墓仔狗"
  },
  "972": {
    "en": "Houndstone",
    "ja": "ハカドッグ",
    "zhHant": "墓揚犬"
  },
  "973": {
    "en": "Flamigo",
    "ja": "カラミンゴ",
    "zhHant": "纏紅鶴"
  },
  "974": {
    "en": "Cetoddle",
    "ja": "アルクジラ",
    "zhHant": "走鯨"
  },
  "975": {
    "en": "Cetitan",
    "ja": "ハルクジラ",
    "zhHant": "浩大鯨"
  },
  "976": {
    "en": "Veluza",
    "ja": "ミガルーサ",
    "zhHant": "輕身鱈"
  },
  "977": {
    "en": "Dondozo",
    "ja": "ヘイラッシャ",
    "zhHant": "吃吼霸"
  },
  "978": {
    "en": "Tatsugiri",
    "ja": "シャリタツ",
    "zhHant": "米立龍"
  },
  "979": {
    "en": "Annihilape",
    "ja": "コノヨザル",
    "zhHant": "棄世猴"
  },
  "980": {
    "en": "Clodsire",
    "ja": "ドオー",
    "zhHant": "土王"
  },
  "981": {
    "en": "Farigiraf",
    "ja": "リキキリン",
    "zhHant": "奇麒麟"
  },
  "982": {
    "en": "Dudunsparce",
    "ja": "ノココッチ",
    "zhHant": "土龍節節"
  },
  "983": {
    "en": "Kingambit",
    "ja": "ドドゲザン",
    "zhHant": "仆刀將軍"
  },
  "984": {
    "en": "Great Tusk",
    "ja": "イダイナキバ",
    "zhHant": "雄偉牙"
  },
  "985": {
    "en": "Scream Tail",
    "ja": "サケブシッポ",
    "zhHant": "吼叫尾"
  },
  "986": {
    "en": "Brute Bonnet",
    "ja": "アラブルタケ",
    "zhHant": "猛惡菇"
  },
  "987": {
    "en": "Flutter Mane",
    "ja": "ハバタクカミ",
    "zhHant": "振翼髮"
  },
  "988": {
    "en": "Slither Wing",
    "ja": "チヲハウハネ",
    "zhHant": "爬地翅"
  },
  "989": {
    "en": "Sandy Shocks",
    "ja": "スナノケガワ",
    "zhHant": "沙鐵皮"
  },
  "990": {
    "en": "Iron Treads",
    "ja": "テツノワダチ",
    "zhHant": "鐵轍跡"
  },
  "991": {
    "en": "Iron Bundle",
    "ja": "テツノツツミ",
    "zhHant": "鐵包袱"
  },
  "992": {
    "en": "Iron Hands",
    "ja": "テツノカイナ",
    "zhHant": "鐵臂膀"
  },
  "993": {
    "en": "Iron Jugulis",
    "ja": "テツノコウベ",
    "zhHant": "鐵脖頸"
  },
  "994": {
    "en": "Iron Moth",
    "ja": "テツノドクガ",
    "zhHant": "鐵毒蛾"
  },
  "995": {
    "en": "Iron Thorns",
    "ja": "テツノイバラ",
    "zhHant": "鐵荊棘"
  },
  "996": {
    "en": "Frigibax",
    "ja": "セビエ",
    "zhHant": "涼脊龍"
  },
  "997": {
    "en": "Arctibax",
    "ja": "セゴール",
    "zhHant": "凍脊龍"
  },
  "998": {
    "en": "Baxcalibur",
    "ja": "セグレイブ",
    "zhHant": "戟脊龍"
  },
  "999": {
    "en": "Gimmighoul",
    "ja": "コレクレー",
    "zhHant": "索財靈"
  },
  "1000": {
    "en": "Gholdengo",
    "ja": "サーフゴー",
    "zhHant": "賽富豪"
  },
  "1001": {
    "en": "Wo-Chien",
    "ja": "チオンジェン",
    "zhHant": "古簡蝸"
  },
  "1002": {
    "en": "Chien-Pao",
    "ja": "パオジアン",
    "zhHant": "古劍豹"
  },
  "1003": {
    "en": "Ting-Lu",
    "ja": "ディンルー",
    "zhHant": "古鼎鹿"
  },
  "1004": {
    "en": "Chi-Yu",
    "ja": "イーユイ",
    "zhHant": "古玉魚"
  },
  "1005": {
    "en": "Roaring Moon",
    "ja": "トドロクツキ",
    "zhHant": "轟鳴月"
  },
  "1006": {
    "en": "Iron Valiant",
    "ja": "テツノブジン",
    "zhHant": "鐵武者"
  },
  "1007": {
    "en": "Koraidon",
    "ja": "コライドン",
    "zhHant": "故勒頓"
  },
  "1008": {
    "en": "Miraidon",
    "ja": "ミライドン",
    "zhHant": "密勒頓"
  },
  "1009": {
    "en": "Walking Wake",
    "ja": "ウネルミナモ",
    "zhHant": "波盪水"
  },
  "1010": {
    "en": "Iron Leaves",
    "ja": "テツノイサハ",
    "zhHant": "鐵斑葉"
  },
  "1011": {
    "en": "Dipplin",
    "ja": "カミッチュ",
    "zhHant": "裹蜜蟲"
  },
  "1012": {
    "en": "Poltchageist",
    "ja": "チャデス",
    "zhHant": "斯魔茶"
  },
  "1013": {
    "en": "Sinistcha",
    "ja": "ヤバソチャ",
    "zhHant": "來悲粗茶"
  },
  "1014": {
    "en": "Okidogi",
    "ja": "イイネイヌ",
    "zhHant": "夠讚狗"
  },
  "1015": {
    "en": "Munkidori",
    "ja": "マシマシラ",
    "zhHant": "願增猿"
  },
  "1016": {
    "en": "Fezandipiti",
    "ja": "キチキギス",
    "zhHant": "吉雉雞"
  },
  "1017": {
    "en": "Ogerpon",
    "ja": "オーガポン",
    "zhHant": "厄鬼椪"
  },
  "1018": {
    "en": "Archaludon",
    "ja": "ブリジュラス",
    "zhHant": "鋁鋼橋龍"
  },
  "1019": {
    "en": "Hydrapple",
    "ja": "カミツオロチ",
    "zhHant": "蜜集大蛇"
  },
  "1020": {
    "en": "Gouging Fire",
    "ja": "ウガツホムラ",
    "zhHant": "破空焰"
  },
  "1021": {
    "en": "Raging Bolt",
    "ja": "タケルライコ",
    "zhHant": "猛雷鼓"
  },
  "1022": {
    "en": "Iron Boulder",
    "ja": "テツノイワオ",
    "zhHant": "铁磐岩"
  },
  "1023": {
    "en": "Iron Crown",
    "ja": "テツノカシラ",
    "zhHant": "铁头壳"
  },
  "1024": {
    "en": "Terapagos",
    "ja": "テラパゴス",
    "zhHant": "太樂巴戈斯"
  },
  "1025": {
    "en": "Pecharunt",
    "ja": "モモワロウ",
    "zhHant": "桃歹郎"
  }
}

export const POKEMON_NAME_INDEX: Record<string, number[]> = {
  "bulbasaur": [
    1
  ],
  "フシギダネ": [
    1
  ],
  "妙蛙種子": [
    1
  ],
  "ivysaur": [
    2
  ],
  "フシギソウ": [
    2
  ],
  "妙蛙草": [
    2
  ],
  "venusaur": [
    3
  ],
  "フシギバナ": [
    3
  ],
  "妙蛙花": [
    3
  ],
  "charmander": [
    4
  ],
  "ヒトカゲ": [
    4
  ],
  "小火龍": [
    4
  ],
  "charmeleon": [
    5
  ],
  "リザード": [
    5
  ],
  "火恐龍": [
    5
  ],
  "charizard": [
    6
  ],
  "リザードン": [
    6
  ],
  "噴火龍": [
    6
  ],
  "squirtle": [
    7
  ],
  "ゼニガメ": [
    7
  ],
  "傑尼龜": [
    7
  ],
  "wartortle": [
    8
  ],
  "カメール": [
    8
  ],
  "卡咪龜": [
    8
  ],
  "blastoise": [
    9
  ],
  "カメックス": [
    9
  ],
  "水箭龜": [
    9
  ],
  "caterpie": [
    10
  ],
  "キャタピー": [
    10
  ],
  "綠毛蟲": [
    10
  ],
  "metapod": [
    11
  ],
  "トランセル": [
    11
  ],
  "鐵甲蛹": [
    11
  ],
  "butterfree": [
    12
  ],
  "バタフリー": [
    12
  ],
  "巴大蝶": [
    12
  ],
  "weedle": [
    13
  ],
  "ビードル": [
    13
  ],
  "獨角蟲": [
    13
  ],
  "kakuna": [
    14
  ],
  "コクーン": [
    14
  ],
  "鐵殼蛹": [
    14
  ],
  "beedrill": [
    15
  ],
  "スピアー": [
    15
  ],
  "大針蜂": [
    15
  ],
  "pidgey": [
    16
  ],
  "ポッポ": [
    16
  ],
  "波波": [
    16
  ],
  "pidgeotto": [
    17
  ],
  "ピジョン": [
    17
  ],
  "比比鳥": [
    17
  ],
  "pidgeot": [
    18
  ],
  "ピジョット": [
    18
  ],
  "大比鳥": [
    18
  ],
  "rattata": [
    19
  ],
  "コラッタ": [
    19
  ],
  "小拉達": [
    19
  ],
  "raticate": [
    20
  ],
  "ラッタ": [
    20
  ],
  "拉達": [
    20
  ],
  "spearow": [
    21
  ],
  "オニスズメ": [
    21
  ],
  "烈雀": [
    21
  ],
  "fearow": [
    22
  ],
  "オニドリル": [
    22
  ],
  "大嘴雀": [
    22
  ],
  "ekans": [
    23
  ],
  "アーボ": [
    23
  ],
  "阿柏蛇": [
    23
  ],
  "arbok": [
    24
  ],
  "アーボック": [
    24
  ],
  "阿柏怪": [
    24
  ],
  "pikachu": [
    25
  ],
  "ピカチュウ": [
    25
  ],
  "皮卡丘": [
    25
  ],
  "raichu": [
    26
  ],
  "ライチュウ": [
    26
  ],
  "雷丘": [
    26
  ],
  "sandshrew": [
    27
  ],
  "サンド": [
    27
  ],
  "穿山鼠": [
    27
  ],
  "sandslash": [
    28
  ],
  "サンドパン": [
    28
  ],
  "穿山王": [
    28
  ],
  "nidoran♀": [
    29
  ],
  "ニドラン♀": [
    29
  ],
  "尼多蘭": [
    29
  ],
  "nidorina": [
    30
  ],
  "ニドリーナ": [
    30
  ],
  "尼多娜": [
    30
  ],
  "nidoqueen": [
    31
  ],
  "ニドクイン": [
    31
  ],
  "尼多后": [
    31
  ],
  "nidoran♂": [
    32
  ],
  "ニドラン♂": [
    32
  ],
  "尼多朗": [
    32
  ],
  "nidorino": [
    33
  ],
  "ニドリーノ": [
    33
  ],
  "尼多力諾": [
    33
  ],
  "nidoking": [
    34
  ],
  "ニドキング": [
    34
  ],
  "尼多王": [
    34
  ],
  "clefairy": [
    35
  ],
  "ピッピ": [
    35
  ],
  "皮皮": [
    35
  ],
  "clefable": [
    36
  ],
  "ピクシー": [
    36
  ],
  "皮可西": [
    36
  ],
  "vulpix": [
    37
  ],
  "ロコン": [
    37
  ],
  "六尾": [
    37
  ],
  "ninetales": [
    38
  ],
  "キュウコン": [
    38
  ],
  "九尾": [
    38
  ],
  "jigglypuff": [
    39
  ],
  "プリン": [
    39
  ],
  "胖丁": [
    39
  ],
  "wigglytuff": [
    40
  ],
  "プクリン": [
    40
  ],
  "胖可丁": [
    40
  ],
  "zubat": [
    41
  ],
  "ズバット": [
    41
  ],
  "超音蝠": [
    41
  ],
  "golbat": [
    42
  ],
  "ゴルバット": [
    42
  ],
  "大嘴蝠": [
    42
  ],
  "oddish": [
    43
  ],
  "ナゾノクサ": [
    43
  ],
  "走路草": [
    43
  ],
  "gloom": [
    44
  ],
  "クサイハナ": [
    44
  ],
  "臭臭花": [
    44
  ],
  "vileplume": [
    45
  ],
  "ラフレシア": [
    45
  ],
  "霸王花": [
    45
  ],
  "paras": [
    46
  ],
  "パラス": [
    46
  ],
  "派拉斯": [
    46
  ],
  "parasect": [
    47
  ],
  "パラセクト": [
    47
  ],
  "派拉斯特": [
    47
  ],
  "venonat": [
    48
  ],
  "コンパン": [
    48
  ],
  "毛球": [
    48
  ],
  "venomoth": [
    49
  ],
  "モルフォン": [
    49
  ],
  "摩魯蛾": [
    49
  ],
  "diglett": [
    50
  ],
  "ディグダ": [
    50
  ],
  "地鼠": [
    50
  ],
  "dugtrio": [
    51
  ],
  "ダグトリオ": [
    51
  ],
  "三地鼠": [
    51
  ],
  "meowth": [
    52
  ],
  "ニャース": [
    52
  ],
  "喵喵": [
    52
  ],
  "persian": [
    53
  ],
  "ペルシアン": [
    53
  ],
  "貓老大": [
    53
  ],
  "psyduck": [
    54
  ],
  "コダック": [
    54
  ],
  "可達鴨": [
    54
  ],
  "golduck": [
    55
  ],
  "ゴルダック": [
    55
  ],
  "哥達鴨": [
    55
  ],
  "mankey": [
    56
  ],
  "マンキー": [
    56
  ],
  "猴怪": [
    56
  ],
  "primeape": [
    57
  ],
  "オコリザル": [
    57
  ],
  "火爆猴": [
    57
  ],
  "growlithe": [
    58
  ],
  "ガーディ": [
    58
  ],
  "卡蒂狗": [
    58
  ],
  "arcanine": [
    59
  ],
  "ウインディ": [
    59
  ],
  "風速狗": [
    59
  ],
  "poliwag": [
    60
  ],
  "ニョロモ": [
    60
  ],
  "蚊香蝌蚪": [
    60
  ],
  "poliwhirl": [
    61
  ],
  "ニョロゾ": [
    61
  ],
  "蚊香君": [
    61
  ],
  "poliwrath": [
    62
  ],
  "ニョロボン": [
    62
  ],
  "蚊香泳士": [
    62
  ],
  "abra": [
    63
  ],
  "ケーシィ": [
    63
  ],
  "凱西": [
    63
  ],
  "kadabra": [
    64
  ],
  "ユンゲラー": [
    64
  ],
  "勇基拉": [
    64
  ],
  "alakazam": [
    65
  ],
  "フーディン": [
    65
  ],
  "胡地": [
    65
  ],
  "machop": [
    66
  ],
  "ワンリキー": [
    66
  ],
  "腕力": [
    66
  ],
  "machoke": [
    67
  ],
  "ゴーリキー": [
    67
  ],
  "豪力": [
    67
  ],
  "machamp": [
    68
  ],
  "カイリキー": [
    68
  ],
  "怪力": [
    68
  ],
  "bellsprout": [
    69
  ],
  "マダツボミ": [
    69
  ],
  "喇叭芽": [
    69
  ],
  "weepinbell": [
    70
  ],
  "ウツドン": [
    70
  ],
  "口呆花": [
    70
  ],
  "victreebel": [
    71
  ],
  "ウツボット": [
    71
  ],
  "大食花": [
    71
  ],
  "tentacool": [
    72
  ],
  "メノクラゲ": [
    72
  ],
  "瑪瑙水母": [
    72
  ],
  "tentacruel": [
    73
  ],
  "ドククラゲ": [
    73
  ],
  "毒刺水母": [
    73
  ],
  "geodude": [
    74
  ],
  "イシツブテ": [
    74
  ],
  "小拳石": [
    74
  ],
  "graveler": [
    75
  ],
  "ゴローン": [
    75
  ],
  "隆隆石": [
    75
  ],
  "golem": [
    76
  ],
  "ゴローニャ": [
    76
  ],
  "隆隆岩": [
    76
  ],
  "ponyta": [
    77
  ],
  "ポニータ": [
    77
  ],
  "小火馬": [
    77
  ],
  "rapidash": [
    78
  ],
  "ギャロップ": [
    78
  ],
  "烈焰馬": [
    78
  ],
  "slowpoke": [
    79
  ],
  "ヤドン": [
    79
  ],
  "呆呆獸": [
    79
  ],
  "slowbro": [
    80
  ],
  "ヤドラン": [
    80
  ],
  "呆殼獸": [
    80
  ],
  "magnemite": [
    81
  ],
  "コイル": [
    81
  ],
  "小磁怪": [
    81
  ],
  "magneton": [
    82
  ],
  "レアコイル": [
    82
  ],
  "三合一磁怪": [
    82
  ],
  "farfetch’d": [
    83
  ],
  "カモネギ": [
    83
  ],
  "大蔥鴨": [
    83
  ],
  "doduo": [
    84
  ],
  "ドードー": [
    84
  ],
  "嘟嘟": [
    84
  ],
  "dodrio": [
    85
  ],
  "ドードリオ": [
    85
  ],
  "嘟嘟利": [
    85
  ],
  "seel": [
    86
  ],
  "パウワウ": [
    86
  ],
  "小海獅": [
    86
  ],
  "dewgong": [
    87
  ],
  "ジュゴン": [
    87
  ],
  "白海獅": [
    87
  ],
  "grimer": [
    88
  ],
  "ベトベター": [
    88
  ],
  "臭泥": [
    88
  ],
  "muk": [
    89
  ],
  "ベトベトン": [
    89
  ],
  "臭臭泥": [
    89
  ],
  "shellder": [
    90
  ],
  "シェルダー": [
    90
  ],
  "大舌貝": [
    90
  ],
  "cloyster": [
    91
  ],
  "パルシェン": [
    91
  ],
  "刺甲貝": [
    91
  ],
  "gastly": [
    92
  ],
  "ゴース": [
    92
  ],
  "鬼斯": [
    92
  ],
  "haunter": [
    93
  ],
  "ゴースト": [
    93
  ],
  "鬼斯通": [
    93
  ],
  "gengar": [
    94
  ],
  "ゲンガー": [
    94
  ],
  "耿鬼": [
    94
  ],
  "onix": [
    95
  ],
  "イワーク": [
    95
  ],
  "大岩蛇": [
    95
  ],
  "drowzee": [
    96
  ],
  "スリープ": [
    96
  ],
  "催眠貘": [
    96
  ],
  "hypno": [
    97
  ],
  "スリーパー": [
    97
  ],
  "引夢貘人": [
    97
  ],
  "krabby": [
    98
  ],
  "クラブ": [
    98
  ],
  "大鉗蟹": [
    98
  ],
  "kingler": [
    99
  ],
  "キングラー": [
    99
  ],
  "巨鉗蟹": [
    99
  ],
  "voltorb": [
    100
  ],
  "ビリリダマ": [
    100
  ],
  "霹靂電球": [
    100
  ],
  "electrode": [
    101
  ],
  "マルマイン": [
    101
  ],
  "頑皮雷彈": [
    101
  ],
  "exeggcute": [
    102
  ],
  "タマタマ": [
    102
  ],
  "蛋蛋": [
    102
  ],
  "exeggutor": [
    103
  ],
  "ナッシー": [
    103
  ],
  "椰蛋樹": [
    103
  ],
  "cubone": [
    104
  ],
  "カラカラ": [
    104
  ],
  "卡拉卡拉": [
    104
  ],
  "marowak": [
    105
  ],
  "ガラガラ": [
    105
  ],
  "嘎啦嘎啦": [
    105
  ],
  "hitmonlee": [
    106
  ],
  "サワムラー": [
    106
  ],
  "飛腿郎": [
    106
  ],
  "hitmonchan": [
    107
  ],
  "エビワラー": [
    107
  ],
  "快拳郎": [
    107
  ],
  "lickitung": [
    108
  ],
  "ベロリンガ": [
    108
  ],
  "大舌頭": [
    108
  ],
  "koffing": [
    109
  ],
  "ドガース": [
    109
  ],
  "瓦斯彈": [
    109
  ],
  "weezing": [
    110
  ],
  "マタドガス": [
    110
  ],
  "雙彈瓦斯": [
    110
  ],
  "rhyhorn": [
    111
  ],
  "サイホーン": [
    111
  ],
  "獨角犀牛": [
    111
  ],
  "rhydon": [
    112
  ],
  "サイドン": [
    112
  ],
  "鑽角犀獸": [
    112
  ],
  "chansey": [
    113
  ],
  "ラッキー": [
    113
  ],
  "吉利蛋": [
    113
  ],
  "tangela": [
    114
  ],
  "モンジャラ": [
    114
  ],
  "蔓藤怪": [
    114
  ],
  "kangaskhan": [
    115
  ],
  "ガルーラ": [
    115
  ],
  "袋獸": [
    115
  ],
  "horsea": [
    116
  ],
  "タッツー": [
    116
  ],
  "墨海馬": [
    116
  ],
  "seadra": [
    117
  ],
  "シードラ": [
    117
  ],
  "海刺龍": [
    117
  ],
  "goldeen": [
    118
  ],
  "トサキント": [
    118
  ],
  "角金魚": [
    118
  ],
  "seaking": [
    119
  ],
  "アズマオウ": [
    119
  ],
  "金魚王": [
    119
  ],
  "staryu": [
    120
  ],
  "ヒトデマン": [
    120
  ],
  "海星星": [
    120
  ],
  "starmie": [
    121
  ],
  "スターミー": [
    121
  ],
  "寶石海星": [
    121
  ],
  "mr. mime": [
    122
  ],
  "バリヤード": [
    122
  ],
  "魔牆人偶": [
    122
  ],
  "scyther": [
    123
  ],
  "ストライク": [
    123
  ],
  "飛天螳螂": [
    123
  ],
  "jynx": [
    124
  ],
  "ルージュラ": [
    124
  ],
  "迷唇姐": [
    124
  ],
  "electabuzz": [
    125
  ],
  "エレブー": [
    125
  ],
  "電擊獸": [
    125
  ],
  "magmar": [
    126
  ],
  "ブーバー": [
    126
  ],
  "鴨嘴火獸": [
    126
  ],
  "pinsir": [
    127
  ],
  "カイロス": [
    127
  ],
  "凱羅斯": [
    127
  ],
  "tauros": [
    128
  ],
  "ケンタロス": [
    128
  ],
  "肯泰羅": [
    128
  ],
  "magikarp": [
    129
  ],
  "コイキング": [
    129
  ],
  "鯉魚王": [
    129
  ],
  "gyarados": [
    130
  ],
  "ギャラドス": [
    130
  ],
  "暴鯉龍": [
    130
  ],
  "lapras": [
    131
  ],
  "ラプラス": [
    131
  ],
  "拉普拉斯": [
    131
  ],
  "ditto": [
    132
  ],
  "メタモン": [
    132
  ],
  "百變怪": [
    132
  ],
  "eevee": [
    133
  ],
  "イーブイ": [
    133
  ],
  "伊布": [
    133
  ],
  "vaporeon": [
    134
  ],
  "シャワーズ": [
    134
  ],
  "水伊布": [
    134
  ],
  "jolteon": [
    135
  ],
  "サンダース": [
    135
  ],
  "雷伊布": [
    135
  ],
  "flareon": [
    136
  ],
  "ブースター": [
    136
  ],
  "火伊布": [
    136
  ],
  "porygon": [
    137
  ],
  "ポリゴン": [
    137
  ],
  "多邊獸": [
    137
  ],
  "omanyte": [
    138
  ],
  "オムナイト": [
    138
  ],
  "菊石獸": [
    138
  ],
  "omastar": [
    139
  ],
  "オムスター": [
    139
  ],
  "多刺菊石獸": [
    139
  ],
  "kabuto": [
    140
  ],
  "カブト": [
    140
  ],
  "化石盔": [
    140
  ],
  "kabutops": [
    141
  ],
  "カブトプス": [
    141
  ],
  "鐮刀盔": [
    141
  ],
  "aerodactyl": [
    142
  ],
  "プテラ": [
    142
  ],
  "化石翼龍": [
    142
  ],
  "snorlax": [
    143
  ],
  "カビゴン": [
    143
  ],
  "卡比獸": [
    143
  ],
  "articuno": [
    144
  ],
  "フリーザー": [
    144
  ],
  "急凍鳥": [
    144
  ],
  "zapdos": [
    145
  ],
  "サンダー": [
    145
  ],
  "閃電鳥": [
    145
  ],
  "moltres": [
    146
  ],
  "ファイヤー": [
    146
  ],
  "火焰鳥": [
    146
  ],
  "dratini": [
    147
  ],
  "ミニリュウ": [
    147
  ],
  "迷你龍": [
    147
  ],
  "dragonair": [
    148
  ],
  "ハクリュー": [
    148
  ],
  "哈克龍": [
    148
  ],
  "dragonite": [
    149
  ],
  "カイリュー": [
    149
  ],
  "快龍": [
    149
  ],
  "mewtwo": [
    150
  ],
  "ミュウツー": [
    150
  ],
  "超夢": [
    150
  ],
  "mew": [
    151
  ],
  "ミュウ": [
    151
  ],
  "夢幻": [
    151
  ],
  "chikorita": [
    152
  ],
  "チコリータ": [
    152
  ],
  "菊草葉": [
    152
  ],
  "bayleef": [
    153
  ],
  "ベイリーフ": [
    153
  ],
  "月桂葉": [
    153
  ],
  "meganium": [
    154
  ],
  "メガニウム": [
    154
  ],
  "大竺葵": [
    154
  ],
  "cyndaquil": [
    155
  ],
  "ヒノアラシ": [
    155
  ],
  "火球鼠": [
    155
  ],
  "quilava": [
    156
  ],
  "マグマラシ": [
    156
  ],
  "火岩鼠": [
    156
  ],
  "typhlosion": [
    157
  ],
  "バクフーン": [
    157
  ],
  "火爆獸": [
    157
  ],
  "totodile": [
    158
  ],
  "ワニノコ": [
    158
  ],
  "小鋸鱷": [
    158
  ],
  "croconaw": [
    159
  ],
  "アリゲイツ": [
    159
  ],
  "藍鱷": [
    159
  ],
  "feraligatr": [
    160
  ],
  "オーダイル": [
    160
  ],
  "大力鱷": [
    160
  ],
  "sentret": [
    161
  ],
  "オタチ": [
    161
  ],
  "尾立": [
    161
  ],
  "furret": [
    162
  ],
  "オオタチ": [
    162
  ],
  "大尾立": [
    162
  ],
  "hoothoot": [
    163
  ],
  "ホーホー": [
    163
  ],
  "咕咕": [
    163
  ],
  "noctowl": [
    164
  ],
  "ヨルノズク": [
    164
  ],
  "貓頭夜鷹": [
    164
  ],
  "ledyba": [
    165
  ],
  "レディバ": [
    165
  ],
  "芭瓢蟲": [
    165
  ],
  "ledian": [
    166
  ],
  "レディアン": [
    166
  ],
  "安瓢蟲": [
    166
  ],
  "spinarak": [
    167
  ],
  "イトマル": [
    167
  ],
  "圓絲蛛": [
    167
  ],
  "ariados": [
    168
  ],
  "アリアドス": [
    168
  ],
  "阿利多斯": [
    168
  ],
  "crobat": [
    169
  ],
  "クロバット": [
    169
  ],
  "叉字蝠": [
    169
  ],
  "chinchou": [
    170
  ],
  "チョンチー": [
    170
  ],
  "燈籠魚": [
    170
  ],
  "lanturn": [
    171
  ],
  "ランターン": [
    171
  ],
  "電燈怪": [
    171
  ],
  "pichu": [
    172
  ],
  "ピチュー": [
    172
  ],
  "皮丘": [
    172
  ],
  "cleffa": [
    173
  ],
  "ピィ": [
    173
  ],
  "皮寶寶": [
    173
  ],
  "igglybuff": [
    174
  ],
  "ププリン": [
    174
  ],
  "寶寶丁": [
    174
  ],
  "togepi": [
    175
  ],
  "トゲピー": [
    175
  ],
  "波克比": [
    175
  ],
  "togetic": [
    176
  ],
  "トゲチック": [
    176
  ],
  "波克基古": [
    176
  ],
  "natu": [
    177
  ],
  "ネイティ": [
    177
  ],
  "天然雀": [
    177
  ],
  "xatu": [
    178
  ],
  "ネイティオ": [
    178
  ],
  "天然鳥": [
    178
  ],
  "mareep": [
    179
  ],
  "メリープ": [
    179
  ],
  "咩利羊": [
    179
  ],
  "flaaffy": [
    180
  ],
  "モココ": [
    180
  ],
  "茸茸羊": [
    180
  ],
  "ampharos": [
    181
  ],
  "デンリュウ": [
    181
  ],
  "電龍": [
    181
  ],
  "bellossom": [
    182
  ],
  "キレイハナ": [
    182
  ],
  "美麗花": [
    182
  ],
  "marill": [
    183
  ],
  "マリル": [
    183
  ],
  "瑪力露": [
    183
  ],
  "azumarill": [
    184
  ],
  "マリルリ": [
    184
  ],
  "瑪力露麗": [
    184
  ],
  "sudowoodo": [
    185
  ],
  "ウソッキー": [
    185
  ],
  "樹才怪": [
    185
  ],
  "politoed": [
    186
  ],
  "ニョロトノ": [
    186
  ],
  "蚊香蛙皇": [
    186
  ],
  "hoppip": [
    187
  ],
  "ハネッコ": [
    187
  ],
  "毽子草": [
    187
  ],
  "skiploom": [
    188
  ],
  "ポポッコ": [
    188
  ],
  "毽子花": [
    188
  ],
  "jumpluff": [
    189
  ],
  "ワタッコ": [
    189
  ],
  "毽子棉": [
    189
  ],
  "aipom": [
    190
  ],
  "エイパム": [
    190
  ],
  "長尾怪手": [
    190
  ],
  "sunkern": [
    191
  ],
  "ヒマナッツ": [
    191
  ],
  "向日種子": [
    191
  ],
  "sunflora": [
    192
  ],
  "キマワリ": [
    192
  ],
  "向日花怪": [
    192
  ],
  "yanma": [
    193
  ],
  "ヤンヤンマ": [
    193
  ],
  "蜻蜻蜓": [
    193
  ],
  "wooper": [
    194
  ],
  "ウパー": [
    194
  ],
  "烏波": [
    194
  ],
  "quagsire": [
    195
  ],
  "ヌオー": [
    195
  ],
  "沼王": [
    195
  ],
  "espeon": [
    196
  ],
  "エーフィ": [
    196
  ],
  "太陽伊布": [
    196
  ],
  "umbreon": [
    197
  ],
  "ブラッキー": [
    197
  ],
  "月亮伊布": [
    197
  ],
  "murkrow": [
    198
  ],
  "ヤミカラス": [
    198
  ],
  "黑暗鴉": [
    198
  ],
  "slowking": [
    199
  ],
  "ヤドキング": [
    199
  ],
  "呆呆王": [
    199
  ],
  "misdreavus": [
    200
  ],
  "ムウマ": [
    200
  ],
  "夢妖": [
    200
  ],
  "unown": [
    201
  ],
  "アンノーン": [
    201
  ],
  "未知圖騰": [
    201
  ],
  "wobbuffet": [
    202
  ],
  "ソーナンス": [
    202
  ],
  "果然翁": [
    202
  ],
  "girafarig": [
    203
  ],
  "キリンリキ": [
    203
  ],
  "麒麟奇": [
    203
  ],
  "pineco": [
    204
  ],
  "クヌギダマ": [
    204
  ],
  "榛果球": [
    204
  ],
  "forretress": [
    205
  ],
  "フォレトス": [
    205
  ],
  "佛烈托斯": [
    205
  ],
  "dunsparce": [
    206
  ],
  "ノコッチ": [
    206
  ],
  "土龍弟弟": [
    206
  ],
  "gligar": [
    207
  ],
  "グライガー": [
    207
  ],
  "天蠍": [
    207
  ],
  "steelix": [
    208
  ],
  "ハガネール": [
    208
  ],
  "大鋼蛇": [
    208
  ],
  "snubbull": [
    209
  ],
  "ブルー": [
    209
  ],
  "布魯": [
    209
  ],
  "granbull": [
    210
  ],
  "グランブル": [
    210
  ],
  "布魯皇": [
    210
  ],
  "qwilfish": [
    211
  ],
  "ハリーセン": [
    211
  ],
  "千針魚": [
    211
  ],
  "scizor": [
    212
  ],
  "ハッサム": [
    212
  ],
  "巨鉗螳螂": [
    212
  ],
  "shuckle": [
    213
  ],
  "ツボツボ": [
    213
  ],
  "壺壺": [
    213
  ],
  "heracross": [
    214
  ],
  "ヘラクロス": [
    214
  ],
  "赫拉克羅斯": [
    214
  ],
  "sneasel": [
    215
  ],
  "ニューラ": [
    215
  ],
  "狃拉": [
    215
  ],
  "teddiursa": [
    216
  ],
  "ヒメグマ": [
    216
  ],
  "熊寶寶": [
    216
  ],
  "ursaring": [
    217
  ],
  "リングマ": [
    217
  ],
  "圈圈熊": [
    217
  ],
  "slugma": [
    218
  ],
  "マグマッグ": [
    218
  ],
  "熔岩蟲": [
    218
  ],
  "magcargo": [
    219
  ],
  "マグカルゴ": [
    219
  ],
  "熔岩蝸牛": [
    219
  ],
  "swinub": [
    220
  ],
  "ウリムー": [
    220
  ],
  "小山豬": [
    220
  ],
  "piloswine": [
    221
  ],
  "イノムー": [
    221
  ],
  "長毛豬": [
    221
  ],
  "corsola": [
    222
  ],
  "サニーゴ": [
    222
  ],
  "太陽珊瑚": [
    222
  ],
  "remoraid": [
    223
  ],
  "テッポウオ": [
    223
  ],
  "鐵炮魚": [
    223
  ],
  "octillery": [
    224
  ],
  "オクタン": [
    224
  ],
  "章魚桶": [
    224
  ],
  "delibird": [
    225
  ],
  "デリバード": [
    225
  ],
  "信使鳥": [
    225
  ],
  "mantine": [
    226
  ],
  "マンタイン": [
    226
  ],
  "巨翅飛魚": [
    226
  ],
  "skarmory": [
    227
  ],
  "エアームド": [
    227
  ],
  "盔甲鳥": [
    227
  ],
  "houndour": [
    228
  ],
  "デルビル": [
    228
  ],
  "戴魯比": [
    228
  ],
  "houndoom": [
    229
  ],
  "ヘルガー": [
    229
  ],
  "黑魯加": [
    229
  ],
  "kingdra": [
    230
  ],
  "キングドラ": [
    230
  ],
  "刺龍王": [
    230
  ],
  "phanpy": [
    231
  ],
  "ゴマゾウ": [
    231
  ],
  "小小象": [
    231
  ],
  "donphan": [
    232
  ],
  "ドンファン": [
    232
  ],
  "頓甲": [
    232
  ],
  "porygon2": [
    233
  ],
  "ポリゴン２": [
    233
  ],
  "多邊獸ⅱ": [
    233
  ],
  "stantler": [
    234
  ],
  "オドシシ": [
    234
  ],
  "驚角鹿": [
    234
  ],
  "smeargle": [
    235
  ],
  "ドーブル": [
    235
  ],
  "圖圖犬": [
    235
  ],
  "tyrogue": [
    236
  ],
  "バルキー": [
    236
  ],
  "無畏小子": [
    236
  ],
  "hitmontop": [
    237
  ],
  "カポエラー": [
    237
  ],
  "戰舞郎": [
    237
  ],
  "smoochum": [
    238
  ],
  "ムチュール": [
    238
  ],
  "迷唇娃": [
    238
  ],
  "elekid": [
    239
  ],
  "エレキッド": [
    239
  ],
  "電擊怪": [
    239
  ],
  "magby": [
    240
  ],
  "ブビィ": [
    240
  ],
  "鴨嘴寶寶": [
    240
  ],
  "miltank": [
    241
  ],
  "ミルタンク": [
    241
  ],
  "大奶罐": [
    241
  ],
  "blissey": [
    242
  ],
  "ハピナス": [
    242
  ],
  "幸福蛋": [
    242
  ],
  "raikou": [
    243
  ],
  "ライコウ": [
    243
  ],
  "雷公": [
    243
  ],
  "entei": [
    244
  ],
  "エンテイ": [
    244
  ],
  "炎帝": [
    244
  ],
  "suicune": [
    245
  ],
  "スイクン": [
    245
  ],
  "水君": [
    245
  ],
  "larvitar": [
    246
  ],
  "ヨーギラス": [
    246
  ],
  "幼基拉斯": [
    246
  ],
  "pupitar": [
    247
  ],
  "サナギラス": [
    247
  ],
  "沙基拉斯": [
    247
  ],
  "tyranitar": [
    248
  ],
  "バンギラス": [
    248
  ],
  "班基拉斯": [
    248
  ],
  "lugia": [
    249
  ],
  "ルギア": [
    249
  ],
  "洛奇亞": [
    249
  ],
  "ho-oh": [
    250
  ],
  "ホウオウ": [
    250
  ],
  "鳳王": [
    250
  ],
  "celebi": [
    251
  ],
  "セレビィ": [
    251
  ],
  "時拉比": [
    251
  ],
  "treecko": [
    252
  ],
  "キモリ": [
    252
  ],
  "木守宮": [
    252
  ],
  "grovyle": [
    253
  ],
  "ジュプトル": [
    253
  ],
  "森林蜥蜴": [
    253
  ],
  "sceptile": [
    254
  ],
  "ジュカイン": [
    254
  ],
  "蜥蜴王": [
    254
  ],
  "torchic": [
    255
  ],
  "アチャモ": [
    255
  ],
  "火稚雞": [
    255
  ],
  "combusken": [
    256
  ],
  "ワカシャモ": [
    256
  ],
  "力壯雞": [
    256
  ],
  "blaziken": [
    257
  ],
  "バシャーモ": [
    257
  ],
  "火焰雞": [
    257
  ],
  "mudkip": [
    258
  ],
  "ミズゴロウ": [
    258
  ],
  "水躍魚": [
    258
  ],
  "marshtomp": [
    259
  ],
  "ヌマクロー": [
    259
  ],
  "沼躍魚": [
    259
  ],
  "swampert": [
    260
  ],
  "ラグラージ": [
    260
  ],
  "巨沼怪": [
    260
  ],
  "poochyena": [
    261
  ],
  "ポチエナ": [
    261
  ],
  "土狼犬": [
    261
  ],
  "mightyena": [
    262
  ],
  "グラエナ": [
    262
  ],
  "大狼犬": [
    262
  ],
  "zigzagoon": [
    263
  ],
  "ジグザグマ": [
    263
  ],
  "蛇紋熊": [
    263
  ],
  "linoone": [
    264
  ],
  "マッスグマ": [
    264
  ],
  "直衝熊": [
    264
  ],
  "wurmple": [
    265
  ],
  "ケムッソ": [
    265
  ],
  "刺尾蟲": [
    265
  ],
  "silcoon": [
    266
  ],
  "カラサリス": [
    266
  ],
  "甲殼繭": [
    266
  ],
  "beautifly": [
    267
  ],
  "アゲハント": [
    267
  ],
  "狩獵鳳蝶": [
    267
  ],
  "cascoon": [
    268
  ],
  "マユルド": [
    268
  ],
  "盾甲繭": [
    268
  ],
  "dustox": [
    269
  ],
  "ドクケイル": [
    269
  ],
  "毒粉蛾": [
    269
  ],
  "lotad": [
    270
  ],
  "ハスボー": [
    270
  ],
  "蓮葉童子": [
    270
  ],
  "lombre": [
    271
  ],
  "ハスブレロ": [
    271
  ],
  "蓮帽小童": [
    271
  ],
  "ludicolo": [
    272
  ],
  "ルンパッパ": [
    272
  ],
  "樂天河童": [
    272
  ],
  "seedot": [
    273
  ],
  "タネボー": [
    273
  ],
  "橡實果": [
    273
  ],
  "nuzleaf": [
    274
  ],
  "コノハナ": [
    274
  ],
  "長鼻葉": [
    274
  ],
  "shiftry": [
    275
  ],
  "ダーテング": [
    275
  ],
  "狡猾天狗": [
    275
  ],
  "taillow": [
    276
  ],
  "スバメ": [
    276
  ],
  "傲骨燕": [
    276
  ],
  "swellow": [
    277
  ],
  "オオスバメ": [
    277
  ],
  "大王燕": [
    277
  ],
  "wingull": [
    278
  ],
  "キャモメ": [
    278
  ],
  "長翅鷗": [
    278
  ],
  "pelipper": [
    279
  ],
  "ペリッパー": [
    279
  ],
  "大嘴鷗": [
    279
  ],
  "ralts": [
    280
  ],
  "ラルトス": [
    280
  ],
  "拉魯拉絲": [
    280
  ],
  "kirlia": [
    281
  ],
  "キルリア": [
    281
  ],
  "奇魯莉安": [
    281
  ],
  "gardevoir": [
    282
  ],
  "サーナイト": [
    282
  ],
  "沙奈朵": [
    282
  ],
  "surskit": [
    283
  ],
  "アメタマ": [
    283
  ],
  "溜溜糖球": [
    283
  ],
  "masquerain": [
    284
  ],
  "アメモース": [
    284
  ],
  "雨翅蛾": [
    284
  ],
  "shroomish": [
    285
  ],
  "キノココ": [
    285
  ],
  "蘑蘑菇": [
    285
  ],
  "breloom": [
    286
  ],
  "キノガッサ": [
    286
  ],
  "斗笠菇": [
    286
  ],
  "slakoth": [
    287
  ],
  "ナマケロ": [
    287
  ],
  "懶人獺": [
    287
  ],
  "vigoroth": [
    288
  ],
  "ヤルキモノ": [
    288
  ],
  "過動猿": [
    288
  ],
  "slaking": [
    289
  ],
  "ケッキング": [
    289
  ],
  "請假王": [
    289
  ],
  "nincada": [
    290
  ],
  "ツチニン": [
    290
  ],
  "土居忍士": [
    290
  ],
  "ninjask": [
    291
  ],
  "テッカニン": [
    291
  ],
  "鐵面忍者": [
    291
  ],
  "shedinja": [
    292
  ],
  "ヌケニン": [
    292
  ],
  "脫殼忍者": [
    292
  ],
  "whismur": [
    293
  ],
  "ゴニョニョ": [
    293
  ],
  "咕妞妞": [
    293
  ],
  "loudred": [
    294
  ],
  "ドゴーム": [
    294
  ],
  "吼爆彈": [
    294
  ],
  "exploud": [
    295
  ],
  "バクオング": [
    295
  ],
  "爆音怪": [
    295
  ],
  "makuhita": [
    296
  ],
  "マクノシタ": [
    296
  ],
  "幕下力士": [
    296
  ],
  "hariyama": [
    297
  ],
  "ハリテヤマ": [
    297
  ],
  "鐵掌力士": [
    297
  ],
  "azurill": [
    298
  ],
  "ルリリ": [
    298
  ],
  "露力麗": [
    298
  ],
  "nosepass": [
    299
  ],
  "ノズパス": [
    299
  ],
  "朝北鼻": [
    299
  ],
  "skitty": [
    300
  ],
  "エネコ": [
    300
  ],
  "向尾喵": [
    300
  ],
  "delcatty": [
    301
  ],
  "エネコロロ": [
    301
  ],
  "優雅貓": [
    301
  ],
  "sableye": [
    302
  ],
  "ヤミラミ": [
    302
  ],
  "勾魂眼": [
    302
  ],
  "mawile": [
    303
  ],
  "クチート": [
    303
  ],
  "大嘴娃": [
    303
  ],
  "aron": [
    304
  ],
  "ココドラ": [
    304
  ],
  "可可多拉": [
    304
  ],
  "lairon": [
    305
  ],
  "コドラ": [
    305
  ],
  "可多拉": [
    305
  ],
  "aggron": [
    306
  ],
  "ボスゴドラ": [
    306
  ],
  "波士可多拉": [
    306
  ],
  "meditite": [
    307
  ],
  "アサナン": [
    307
  ],
  "瑪沙那": [
    307
  ],
  "medicham": [
    308
  ],
  "チャーレム": [
    308
  ],
  "恰雷姆": [
    308
  ],
  "electrike": [
    309
  ],
  "ラクライ": [
    309
  ],
  "落雷獸": [
    309
  ],
  "manectric": [
    310
  ],
  "ライボルト": [
    310
  ],
  "雷電獸": [
    310
  ],
  "plusle": [
    311
  ],
  "プラスル": [
    311
  ],
  "正電拍拍": [
    311
  ],
  "minun": [
    312
  ],
  "マイナン": [
    312
  ],
  "負電拍拍": [
    312
  ],
  "volbeat": [
    313
  ],
  "バルビート": [
    313
  ],
  "電螢蟲": [
    313
  ],
  "illumise": [
    314
  ],
  "イルミーゼ": [
    314
  ],
  "甜甜螢": [
    314
  ],
  "roselia": [
    315
  ],
  "ロゼリア": [
    315
  ],
  "毒薔薇": [
    315
  ],
  "gulpin": [
    316
  ],
  "ゴクリン": [
    316
  ],
  "溶食獸": [
    316
  ],
  "swalot": [
    317
  ],
  "マルノーム": [
    317
  ],
  "吞食獸": [
    317
  ],
  "carvanha": [
    318
  ],
  "キバニア": [
    318
  ],
  "利牙魚": [
    318
  ],
  "sharpedo": [
    319
  ],
  "サメハダー": [
    319
  ],
  "巨牙鯊": [
    319
  ],
  "wailmer": [
    320
  ],
  "ホエルコ": [
    320
  ],
  "吼吼鯨": [
    320
  ],
  "wailord": [
    321
  ],
  "ホエルオー": [
    321
  ],
  "吼鯨王": [
    321
  ],
  "numel": [
    322
  ],
  "ドンメル": [
    322
  ],
  "呆火駝": [
    322
  ],
  "camerupt": [
    323
  ],
  "バクーダ": [
    323
  ],
  "噴火駝": [
    323
  ],
  "torkoal": [
    324
  ],
  "コータス": [
    324
  ],
  "煤炭龜": [
    324
  ],
  "spoink": [
    325
  ],
  "バネブー": [
    325
  ],
  "跳跳豬": [
    325
  ],
  "grumpig": [
    326
  ],
  "ブーピッグ": [
    326
  ],
  "噗噗豬": [
    326
  ],
  "spinda": [
    327
  ],
  "パッチール": [
    327
  ],
  "晃晃斑": [
    327
  ],
  "trapinch": [
    328
  ],
  "ナックラー": [
    328
  ],
  "大顎蟻": [
    328
  ],
  "vibrava": [
    329
  ],
  "ビブラーバ": [
    329
  ],
  "超音波幼蟲": [
    329
  ],
  "flygon": [
    330
  ],
  "フライゴン": [
    330
  ],
  "沙漠蜻蜓": [
    330
  ],
  "cacnea": [
    331
  ],
  "サボネア": [
    331
  ],
  "刺球仙人掌": [
    331
  ],
  "cacturne": [
    332
  ],
  "ノクタス": [
    332
  ],
  "夢歌仙人掌": [
    332
  ],
  "swablu": [
    333
  ],
  "チルット": [
    333
  ],
  "青綿鳥": [
    333
  ],
  "altaria": [
    334
  ],
  "チルタリス": [
    334
  ],
  "七夕青鳥": [
    334
  ],
  "zangoose": [
    335
  ],
  "ザングース": [
    335
  ],
  "貓鼬斬": [
    335
  ],
  "seviper": [
    336
  ],
  "ハブネーク": [
    336
  ],
  "飯匙蛇": [
    336
  ],
  "lunatone": [
    337
  ],
  "ルナトーン": [
    337
  ],
  "月石": [
    337
  ],
  "solrock": [
    338
  ],
  "ソルロック": [
    338
  ],
  "太陽岩": [
    338
  ],
  "barboach": [
    339
  ],
  "ドジョッチ": [
    339
  ],
  "泥泥鰍": [
    339
  ],
  "whiscash": [
    340
  ],
  "ナマズン": [
    340
  ],
  "鯰魚王": [
    340
  ],
  "corphish": [
    341
  ],
  "ヘイガニ": [
    341
  ],
  "龍蝦小兵": [
    341
  ],
  "crawdaunt": [
    342
  ],
  "シザリガー": [
    342
  ],
  "鐵螯龍蝦": [
    342
  ],
  "baltoy": [
    343
  ],
  "ヤジロン": [
    343
  ],
  "天秤偶": [
    343
  ],
  "claydol": [
    344
  ],
  "ネンドール": [
    344
  ],
  "念力土偶": [
    344
  ],
  "lileep": [
    345
  ],
  "リリーラ": [
    345
  ],
  "觸手百合": [
    345
  ],
  "cradily": [
    346
  ],
  "ユレイドル": [
    346
  ],
  "搖籃百合": [
    346
  ],
  "anorith": [
    347
  ],
  "アノプス": [
    347
  ],
  "太古羽蟲": [
    347
  ],
  "armaldo": [
    348
  ],
  "アーマルド": [
    348
  ],
  "太古盔甲": [
    348
  ],
  "feebas": [
    349
  ],
  "ヒンバス": [
    349
  ],
  "醜醜魚": [
    349
  ],
  "milotic": [
    350
  ],
  "ミロカロス": [
    350
  ],
  "美納斯": [
    350
  ],
  "castform": [
    351
  ],
  "ポワルン": [
    351
  ],
  "飄浮泡泡": [
    351
  ],
  "kecleon": [
    352
  ],
  "カクレオン": [
    352
  ],
  "變隱龍": [
    352
  ],
  "shuppet": [
    353
  ],
  "カゲボウズ": [
    353
  ],
  "怨影娃娃": [
    353
  ],
  "banette": [
    354
  ],
  "ジュペッタ": [
    354
  ],
  "詛咒娃娃": [
    354
  ],
  "duskull": [
    355
  ],
  "ヨマワル": [
    355
  ],
  "夜巡靈": [
    355
  ],
  "dusclops": [
    356
  ],
  "サマヨール": [
    356
  ],
  "彷徨夜靈": [
    356
  ],
  "tropius": [
    357
  ],
  "トロピウス": [
    357
  ],
  "熱帶龍": [
    357
  ],
  "chimecho": [
    358
  ],
  "チリーン": [
    358
  ],
  "風鈴鈴": [
    358
  ],
  "absol": [
    359
  ],
  "アブソル": [
    359
  ],
  "阿勃梭魯": [
    359
  ],
  "wynaut": [
    360
  ],
  "ソーナノ": [
    360
  ],
  "小果然": [
    360
  ],
  "snorunt": [
    361
  ],
  "ユキワラシ": [
    361
  ],
  "雪童子": [
    361
  ],
  "glalie": [
    362
  ],
  "オニゴーリ": [
    362
  ],
  "冰鬼護": [
    362
  ],
  "spheal": [
    363
  ],
  "タマザラシ": [
    363
  ],
  "海豹球": [
    363
  ],
  "sealeo": [
    364
  ],
  "トドグラー": [
    364
  ],
  "海魔獅": [
    364
  ],
  "walrein": [
    365
  ],
  "トドゼルガ": [
    365
  ],
  "帝牙海獅": [
    365
  ],
  "clamperl": [
    366
  ],
  "パールル": [
    366
  ],
  "珍珠貝": [
    366
  ],
  "huntail": [
    367
  ],
  "ハンテール": [
    367
  ],
  "獵斑魚": [
    367
  ],
  "gorebyss": [
    368
  ],
  "サクラビス": [
    368
  ],
  "櫻花魚": [
    368
  ],
  "relicanth": [
    369
  ],
  "ジーランス": [
    369
  ],
  "古空棘魚": [
    369
  ],
  "luvdisc": [
    370
  ],
  "ラブカス": [
    370
  ],
  "愛心魚": [
    370
  ],
  "bagon": [
    371
  ],
  "タツベイ": [
    371
  ],
  "寶貝龍": [
    371
  ],
  "shelgon": [
    372
  ],
  "コモルー": [
    372
  ],
  "甲殼龍": [
    372
  ],
  "salamence": [
    373
  ],
  "ボーマンダ": [
    373
  ],
  "暴飛龍": [
    373
  ],
  "beldum": [
    374
  ],
  "ダンバル": [
    374
  ],
  "鐵啞鈴": [
    374
  ],
  "metang": [
    375
  ],
  "メタング": [
    375
  ],
  "金屬怪": [
    375
  ],
  "metagross": [
    376
  ],
  "メタグロス": [
    376
  ],
  "巨金怪": [
    376
  ],
  "regirock": [
    377
  ],
  "レジロック": [
    377
  ],
  "雷吉洛克": [
    377
  ],
  "regice": [
    378
  ],
  "レジアイス": [
    378
  ],
  "雷吉艾斯": [
    378
  ],
  "registeel": [
    379
  ],
  "レジスチル": [
    379
  ],
  "雷吉斯奇魯": [
    379
  ],
  "latias": [
    380
  ],
  "ラティアス": [
    380
  ],
  "拉帝亞斯": [
    380
  ],
  "latios": [
    381
  ],
  "ラティオス": [
    381
  ],
  "拉帝歐斯": [
    381
  ],
  "kyogre": [
    382
  ],
  "カイオーガ": [
    382
  ],
  "蓋歐卡": [
    382
  ],
  "groudon": [
    383
  ],
  "グラードン": [
    383
  ],
  "固拉多": [
    383
  ],
  "rayquaza": [
    384
  ],
  "レックウザ": [
    384
  ],
  "烈空坐": [
    384
  ],
  "jirachi": [
    385
  ],
  "ジラーチ": [
    385
  ],
  "基拉祈": [
    385
  ],
  "deoxys": [
    386
  ],
  "デオキシス": [
    386
  ],
  "代歐奇希斯": [
    386
  ],
  "turtwig": [
    387
  ],
  "ナエトル": [
    387
  ],
  "草苗龜": [
    387
  ],
  "grotle": [
    388
  ],
  "ハヤシガメ": [
    388
  ],
  "樹林龜": [
    388
  ],
  "torterra": [
    389
  ],
  "ドダイトス": [
    389
  ],
  "土台龜": [
    389
  ],
  "chimchar": [
    390
  ],
  "ヒコザル": [
    390
  ],
  "小火焰猴": [
    390
  ],
  "monferno": [
    391
  ],
  "モウカザル": [
    391
  ],
  "猛火猴": [
    391
  ],
  "infernape": [
    392
  ],
  "ゴウカザル": [
    392
  ],
  "烈焰猴": [
    392
  ],
  "piplup": [
    393
  ],
  "ポッチャマ": [
    393
  ],
  "波加曼": [
    393
  ],
  "prinplup": [
    394
  ],
  "ポッタイシ": [
    394
  ],
  "波皇子": [
    394
  ],
  "empoleon": [
    395
  ],
  "エンペルト": [
    395
  ],
  "帝王拿波": [
    395
  ],
  "starly": [
    396
  ],
  "ムックル": [
    396
  ],
  "姆克兒": [
    396
  ],
  "staravia": [
    397
  ],
  "ムクバード": [
    397
  ],
  "姆克鳥": [
    397
  ],
  "staraptor": [
    398
  ],
  "ムクホーク": [
    398
  ],
  "姆克鷹": [
    398
  ],
  "bidoof": [
    399
  ],
  "ビッパ": [
    399
  ],
  "大牙狸": [
    399
  ],
  "bibarel": [
    400
  ],
  "ビーダル": [
    400
  ],
  "大尾狸": [
    400
  ],
  "kricketot": [
    401
  ],
  "コロボーシ": [
    401
  ],
  "圓法師": [
    401
  ],
  "kricketune": [
    402
  ],
  "コロトック": [
    402
  ],
  "音箱蟀": [
    402
  ],
  "shinx": [
    403
  ],
  "コリンク": [
    403
  ],
  "小貓怪": [
    403
  ],
  "luxio": [
    404
  ],
  "ルクシオ": [
    404
  ],
  "勒克貓": [
    404
  ],
  "luxray": [
    405
  ],
  "レントラー": [
    405
  ],
  "倫琴貓": [
    405
  ],
  "budew": [
    406
  ],
  "スボミー": [
    406
  ],
  "含羞苞": [
    406
  ],
  "roserade": [
    407
  ],
  "ロズレイド": [
    407
  ],
  "羅絲雷朵": [
    407
  ],
  "cranidos": [
    408
  ],
  "ズガイドス": [
    408
  ],
  "頭蓋龍": [
    408
  ],
  "rampardos": [
    409
  ],
  "ラムパルド": [
    409
  ],
  "戰槌龍": [
    409
  ],
  "shieldon": [
    410
  ],
  "タテトプス": [
    410
  ],
  "盾甲龍": [
    410
  ],
  "bastiodon": [
    411
  ],
  "トリデプス": [
    411
  ],
  "護城龍": [
    411
  ],
  "burmy": [
    412
  ],
  "ミノムッチ": [
    412
  ],
  "結草兒": [
    412
  ],
  "wormadam": [
    413
  ],
  "ミノマダム": [
    413
  ],
  "結草貴婦": [
    413
  ],
  "mothim": [
    414
  ],
  "ガーメイル": [
    414
  ],
  "紳士蛾": [
    414
  ],
  "combee": [
    415
  ],
  "ミツハニー": [
    415
  ],
  "三蜜蜂": [
    415
  ],
  "vespiquen": [
    416
  ],
  "ビークイン": [
    416
  ],
  "蜂女王": [
    416
  ],
  "pachirisu": [
    417
  ],
  "パチリス": [
    417
  ],
  "帕奇利茲": [
    417
  ],
  "buizel": [
    418
  ],
  "ブイゼル": [
    418
  ],
  "泳圈鼬": [
    418
  ],
  "floatzel": [
    419
  ],
  "フローゼル": [
    419
  ],
  "浮潛鼬": [
    419
  ],
  "cherubi": [
    420
  ],
  "チェリンボ": [
    420
  ],
  "櫻花寶": [
    420
  ],
  "cherrim": [
    421
  ],
  "チェリム": [
    421
  ],
  "櫻花兒": [
    421
  ],
  "shellos": [
    422
  ],
  "カラナクシ": [
    422
  ],
  "無殼海兔": [
    422
  ],
  "gastrodon": [
    423
  ],
  "トリトドン": [
    423
  ],
  "海兔獸": [
    423
  ],
  "ambipom": [
    424
  ],
  "エテボース": [
    424
  ],
  "雙尾怪手": [
    424
  ],
  "drifloon": [
    425
  ],
  "フワンテ": [
    425
  ],
  "飄飄球": [
    425
  ],
  "drifblim": [
    426
  ],
  "フワライド": [
    426
  ],
  "隨風球": [
    426
  ],
  "buneary": [
    427
  ],
  "ミミロル": [
    427
  ],
  "捲捲耳": [
    427
  ],
  "lopunny": [
    428
  ],
  "ミミロップ": [
    428
  ],
  "長耳兔": [
    428
  ],
  "mismagius": [
    429
  ],
  "ムウマージ": [
    429
  ],
  "夢妖魔": [
    429
  ],
  "honchkrow": [
    430
  ],
  "ドンカラス": [
    430
  ],
  "烏鴉頭頭": [
    430
  ],
  "glameow": [
    431
  ],
  "ニャルマー": [
    431
  ],
  "魅力喵": [
    431
  ],
  "purugly": [
    432
  ],
  "ブニャット": [
    432
  ],
  "東施喵": [
    432
  ],
  "chingling": [
    433
  ],
  "リーシャン": [
    433
  ],
  "鈴鐺響": [
    433
  ],
  "stunky": [
    434
  ],
  "スカンプー": [
    434
  ],
  "臭鼬噗": [
    434
  ],
  "skuntank": [
    435
  ],
  "スカタンク": [
    435
  ],
  "坦克臭鼬": [
    435
  ],
  "bronzor": [
    436
  ],
  "ドーミラー": [
    436
  ],
  "銅鏡怪": [
    436
  ],
  "bronzong": [
    437
  ],
  "ドータクン": [
    437
  ],
  "青銅鐘": [
    437
  ],
  "bonsly": [
    438
  ],
  "ウソハチ": [
    438
  ],
  "盆才怪": [
    438
  ],
  "mime jr.": [
    439
  ],
  "マネネ": [
    439
  ],
  "魔尼尼": [
    439
  ],
  "happiny": [
    440
  ],
  "ピンプク": [
    440
  ],
  "小福蛋": [
    440
  ],
  "chatot": [
    441
  ],
  "ペラップ": [
    441
  ],
  "聒噪鳥": [
    441
  ],
  "spiritomb": [
    442
  ],
  "ミカルゲ": [
    442
  ],
  "花岩怪": [
    442
  ],
  "gible": [
    443
  ],
  "フカマル": [
    443
  ],
  "圓陸鯊": [
    443
  ],
  "gabite": [
    444
  ],
  "ガバイト": [
    444
  ],
  "尖牙陸鯊": [
    444
  ],
  "garchomp": [
    445
  ],
  "ガブリアス": [
    445
  ],
  "烈咬陸鯊": [
    445
  ],
  "munchlax": [
    446
  ],
  "ゴンベ": [
    446
  ],
  "小卡比獸": [
    446
  ],
  "riolu": [
    447
  ],
  "リオル": [
    447
  ],
  "利歐路": [
    447
  ],
  "lucario": [
    448
  ],
  "ルカリオ": [
    448
  ],
  "路卡利歐": [
    448
  ],
  "hippopotas": [
    449
  ],
  "ヒポポタス": [
    449
  ],
  "沙河馬": [
    449
  ],
  "hippowdon": [
    450
  ],
  "カバルドン": [
    450
  ],
  "河馬獸": [
    450
  ],
  "skorupi": [
    451
  ],
  "スコルピ": [
    451
  ],
  "鉗尾蠍": [
    451
  ],
  "drapion": [
    452
  ],
  "ドラピオン": [
    452
  ],
  "龍王蠍": [
    452
  ],
  "croagunk": [
    453
  ],
  "グレッグル": [
    453
  ],
  "不良蛙": [
    453
  ],
  "toxicroak": [
    454
  ],
  "ドクロッグ": [
    454
  ],
  "毒骷蛙": [
    454
  ],
  "carnivine": [
    455
  ],
  "マスキッパ": [
    455
  ],
  "尖牙籠": [
    455
  ],
  "finneon": [
    456
  ],
  "ケイコウオ": [
    456
  ],
  "螢光魚": [
    456
  ],
  "lumineon": [
    457
  ],
  "ネオラント": [
    457
  ],
  "霓虹魚": [
    457
  ],
  "mantyke": [
    458
  ],
  "タマンタ": [
    458
  ],
  "小球飛魚": [
    458
  ],
  "snover": [
    459
  ],
  "ユキカブリ": [
    459
  ],
  "雪笠怪": [
    459
  ],
  "abomasnow": [
    460
  ],
  "ユキノオー": [
    460
  ],
  "暴雪王": [
    460
  ],
  "weavile": [
    461
  ],
  "マニューラ": [
    461
  ],
  "瑪狃拉": [
    461
  ],
  "magnezone": [
    462
  ],
  "ジバコイル": [
    462
  ],
  "自爆磁怪": [
    462
  ],
  "lickilicky": [
    463
  ],
  "ベロベルト": [
    463
  ],
  "大舌舔": [
    463
  ],
  "rhyperior": [
    464
  ],
  "ドサイドン": [
    464
  ],
  "超甲狂犀": [
    464
  ],
  "tangrowth": [
    465
  ],
  "モジャンボ": [
    465
  ],
  "巨蔓藤": [
    465
  ],
  "electivire": [
    466
  ],
  "エレキブル": [
    466
  ],
  "電擊魔獸": [
    466
  ],
  "magmortar": [
    467
  ],
  "ブーバーン": [
    467
  ],
  "鴨嘴炎獸": [
    467
  ],
  "togekiss": [
    468
  ],
  "トゲキッス": [
    468
  ],
  "波克基斯": [
    468
  ],
  "yanmega": [
    469
  ],
  "メガヤンマ": [
    469
  ],
  "遠古巨蜓": [
    469
  ],
  "leafeon": [
    470
  ],
  "リーフィア": [
    470
  ],
  "葉伊布": [
    470
  ],
  "glaceon": [
    471
  ],
  "グレイシア": [
    471
  ],
  "冰伊布": [
    471
  ],
  "gliscor": [
    472
  ],
  "グライオン": [
    472
  ],
  "天蠍王": [
    472
  ],
  "mamoswine": [
    473
  ],
  "マンムー": [
    473
  ],
  "象牙豬": [
    473
  ],
  "porygon-z": [
    474
  ],
  "ポリゴンｚ": [
    474
  ],
  "多邊獸ｚ": [
    474
  ],
  "gallade": [
    475
  ],
  "エルレイド": [
    475
  ],
  "艾路雷朵": [
    475
  ],
  "probopass": [
    476
  ],
  "ダイノーズ": [
    476
  ],
  "大朝北鼻": [
    476
  ],
  "dusknoir": [
    477
  ],
  "ヨノワール": [
    477
  ],
  "黑夜魔靈": [
    477
  ],
  "froslass": [
    478
  ],
  "ユキメノコ": [
    478
  ],
  "雪妖女": [
    478
  ],
  "rotom": [
    479
  ],
  "ロトム": [
    479
  ],
  "洛托姆": [
    479
  ],
  "uxie": [
    480
  ],
  "ユクシー": [
    480
  ],
  "由克希": [
    480
  ],
  "mesprit": [
    481
  ],
  "エムリット": [
    481
  ],
  "艾姆利多": [
    481
  ],
  "azelf": [
    482
  ],
  "アグノム": [
    482
  ],
  "亞克諾姆": [
    482
  ],
  "dialga": [
    483
  ],
  "ディアルガ": [
    483
  ],
  "帝牙盧卡": [
    483
  ],
  "palkia": [
    484
  ],
  "パルキア": [
    484
  ],
  "帕路奇亞": [
    484
  ],
  "heatran": [
    485
  ],
  "ヒードラン": [
    485
  ],
  "席多藍恩": [
    485
  ],
  "regigigas": [
    486
  ],
  "レジギガス": [
    486
  ],
  "雷吉奇卡斯": [
    486
  ],
  "giratina": [
    487
  ],
  "ギラティナ": [
    487
  ],
  "騎拉帝納": [
    487
  ],
  "cresselia": [
    488
  ],
  "クレセリア": [
    488
  ],
  "克雷色利亞": [
    488
  ],
  "phione": [
    489
  ],
  "フィオネ": [
    489
  ],
  "霏歐納": [
    489
  ],
  "manaphy": [
    490
  ],
  "マナフィ": [
    490
  ],
  "瑪納霏": [
    490
  ],
  "darkrai": [
    491
  ],
  "ダークライ": [
    491
  ],
  "達克萊伊": [
    491
  ],
  "shaymin": [
    492
  ],
  "シェイミ": [
    492
  ],
  "謝米": [
    492
  ],
  "arceus": [
    493
  ],
  "アルセウス": [
    493
  ],
  "阿爾宙斯": [
    493
  ],
  "victini": [
    494
  ],
  "ビクティニ": [
    494
  ],
  "比克提尼": [
    494
  ],
  "snivy": [
    495
  ],
  "ツタージャ": [
    495
  ],
  "藤藤蛇": [
    495
  ],
  "servine": [
    496
  ],
  "ジャノビー": [
    496
  ],
  "青藤蛇": [
    496
  ],
  "serperior": [
    497
  ],
  "ジャローダ": [
    497
  ],
  "君主蛇": [
    497
  ],
  "tepig": [
    498
  ],
  "ポカブ": [
    498
  ],
  "暖暖豬": [
    498
  ],
  "pignite": [
    499
  ],
  "チャオブー": [
    499
  ],
  "炒炒豬": [
    499
  ],
  "emboar": [
    500
  ],
  "エンブオー": [
    500
  ],
  "炎武王": [
    500
  ],
  "oshawott": [
    501
  ],
  "ミジュマル": [
    501
  ],
  "水水獺": [
    501
  ],
  "dewott": [
    502
  ],
  "フタチマル": [
    502
  ],
  "雙刃丸": [
    502
  ],
  "samurott": [
    503
  ],
  "ダイケンキ": [
    503
  ],
  "大劍鬼": [
    503
  ],
  "patrat": [
    504
  ],
  "ミネズミ": [
    504
  ],
  "探探鼠": [
    504
  ],
  "watchog": [
    505
  ],
  "ミルホッグ": [
    505
  ],
  "步哨鼠": [
    505
  ],
  "lillipup": [
    506
  ],
  "ヨーテリー": [
    506
  ],
  "小約克": [
    506
  ],
  "herdier": [
    507
  ],
  "ハーデリア": [
    507
  ],
  "哈約克": [
    507
  ],
  "stoutland": [
    508
  ],
  "ムーランド": [
    508
  ],
  "長毛狗": [
    508
  ],
  "purrloin": [
    509
  ],
  "チョロネコ": [
    509
  ],
  "扒手貓": [
    509
  ],
  "liepard": [
    510
  ],
  "レパルダス": [
    510
  ],
  "酷豹": [
    510
  ],
  "pansage": [
    511
  ],
  "ヤナップ": [
    511
  ],
  "花椰猴": [
    511
  ],
  "simisage": [
    512
  ],
  "ヤナッキー": [
    512
  ],
  "花椰猿": [
    512
  ],
  "pansear": [
    513
  ],
  "バオップ": [
    513
  ],
  "爆香猴": [
    513
  ],
  "simisear": [
    514
  ],
  "バオッキー": [
    514
  ],
  "爆香猿": [
    514
  ],
  "panpour": [
    515
  ],
  "ヒヤップ": [
    515
  ],
  "冷水猴": [
    515
  ],
  "simipour": [
    516
  ],
  "ヒヤッキー": [
    516
  ],
  "冷水猿": [
    516
  ],
  "munna": [
    517
  ],
  "ムンナ": [
    517
  ],
  "食夢夢": [
    517
  ],
  "musharna": [
    518
  ],
  "ムシャーナ": [
    518
  ],
  "夢夢蝕": [
    518
  ],
  "pidove": [
    519
  ],
  "マメパト": [
    519
  ],
  "豆豆鴿": [
    519
  ],
  "tranquill": [
    520
  ],
  "ハトーボー": [
    520
  ],
  "咕咕鴿": [
    520
  ],
  "unfezant": [
    521
  ],
  "ケンホロウ": [
    521
  ],
  "高傲雉雞": [
    521
  ],
  "blitzle": [
    522
  ],
  "シママ": [
    522
  ],
  "斑斑馬": [
    522
  ],
  "zebstrika": [
    523
  ],
  "ゼブライカ": [
    523
  ],
  "雷電斑馬": [
    523
  ],
  "roggenrola": [
    524
  ],
  "ダンゴロ": [
    524
  ],
  "石丸子": [
    524
  ],
  "boldore": [
    525
  ],
  "ガントル": [
    525
  ],
  "地幔岩": [
    525
  ],
  "gigalith": [
    526
  ],
  "ギガイアス": [
    526
  ],
  "龐岩怪": [
    526
  ],
  "woobat": [
    527
  ],
  "コロモリ": [
    527
  ],
  "滾滾蝙蝠": [
    527
  ],
  "swoobat": [
    528
  ],
  "ココロモリ": [
    528
  ],
  "心蝙蝠": [
    528
  ],
  "drilbur": [
    529
  ],
  "モグリュー": [
    529
  ],
  "螺釘地鼠": [
    529
  ],
  "excadrill": [
    530
  ],
  "ドリュウズ": [
    530
  ],
  "龍頭地鼠": [
    530
  ],
  "audino": [
    531
  ],
  "タブンネ": [
    531
  ],
  "差不多娃娃": [
    531
  ],
  "timburr": [
    532
  ],
  "ドッコラー": [
    532
  ],
  "搬運小匠": [
    532
  ],
  "gurdurr": [
    533
  ],
  "ドテッコツ": [
    533
  ],
  "鐵骨土人": [
    533
  ],
  "conkeldurr": [
    534
  ],
  "ローブシン": [
    534
  ],
  "修建老匠": [
    534
  ],
  "tympole": [
    535
  ],
  "オタマロ": [
    535
  ],
  "圓蝌蚪": [
    535
  ],
  "palpitoad": [
    536
  ],
  "ガマガル": [
    536
  ],
  "藍蟾蜍": [
    536
  ],
  "seismitoad": [
    537
  ],
  "ガマゲロゲ": [
    537
  ],
  "蟾蜍王": [
    537
  ],
  "throh": [
    538
  ],
  "ナゲキ": [
    538
  ],
  "投摔鬼": [
    538
  ],
  "sawk": [
    539
  ],
  "ダゲキ": [
    539
  ],
  "打擊鬼": [
    539
  ],
  "sewaddle": [
    540
  ],
  "クルミル": [
    540
  ],
  "蟲寶包": [
    540
  ],
  "swadloon": [
    541
  ],
  "クルマユ": [
    541
  ],
  "寶包繭": [
    541
  ],
  "leavanny": [
    542
  ],
  "ハハコモリ": [
    542
  ],
  "保母蟲": [
    542
  ],
  "venipede": [
    543
  ],
  "フシデ": [
    543
  ],
  "百足蜈蚣": [
    543
  ],
  "whirlipede": [
    544
  ],
  "ホイーガ": [
    544
  ],
  "車輪毬": [
    544
  ],
  "scolipede": [
    545
  ],
  "ペンドラー": [
    545
  ],
  "蜈蚣王": [
    545
  ],
  "cottonee": [
    546
  ],
  "モンメン": [
    546
  ],
  "木棉球": [
    546
  ],
  "whimsicott": [
    547
  ],
  "エルフーン": [
    547
  ],
  "風妖精": [
    547
  ],
  "petilil": [
    548
  ],
  "チュリネ": [
    548
  ],
  "百合根娃娃": [
    548
  ],
  "lilligant": [
    549
  ],
  "ドレディア": [
    549
  ],
  "裙兒小姐": [
    549
  ],
  "basculin": [
    550
  ],
  "バスラオ": [
    550
  ],
  "野蠻鱸魚": [
    550
  ],
  "sandile": [
    551
  ],
  "メグロコ": [
    551
  ],
  "黑眼鱷": [
    551
  ],
  "krokorok": [
    552
  ],
  "ワルビル": [
    552
  ],
  "混混鱷": [
    552
  ],
  "krookodile": [
    553
  ],
  "ワルビアル": [
    553
  ],
  "流氓鱷": [
    553
  ],
  "darumaka": [
    554
  ],
  "ダルマッカ": [
    554
  ],
  "火紅不倒翁": [
    554
  ],
  "darmanitan": [
    555
  ],
  "ヒヒダルマ": [
    555
  ],
  "達摩狒狒": [
    555
  ],
  "maractus": [
    556
  ],
  "マラカッチ": [
    556
  ],
  "沙鈴仙人掌": [
    556
  ],
  "dwebble": [
    557
  ],
  "イシズマイ": [
    557
  ],
  "石居蟹": [
    557
  ],
  "crustle": [
    558
  ],
  "イワパレス": [
    558
  ],
  "岩殿居蟹": [
    558
  ],
  "scraggy": [
    559
  ],
  "ズルッグ": [
    559
  ],
  "滑滑小子": [
    559
  ],
  "scrafty": [
    560
  ],
  "ズルズキン": [
    560
  ],
  "頭巾混混": [
    560
  ],
  "sigilyph": [
    561
  ],
  "シンボラー": [
    561
  ],
  "象徵鳥": [
    561
  ],
  "yamask": [
    562
  ],
  "デスマス": [
    562
  ],
  "哭哭面具": [
    562
  ],
  "cofagrigus": [
    563
  ],
  "デスカーン": [
    563
  ],
  "死神棺": [
    563
  ],
  "tirtouga": [
    564
  ],
  "プロトーガ": [
    564
  ],
  "原蓋海龜": [
    564
  ],
  "carracosta": [
    565
  ],
  "アバゴーラ": [
    565
  ],
  "肋骨海龜": [
    565
  ],
  "archen": [
    566
  ],
  "アーケン": [
    566
  ],
  "始祖小鳥": [
    566
  ],
  "archeops": [
    567
  ],
  "アーケオス": [
    567
  ],
  "始祖大鳥": [
    567
  ],
  "trubbish": [
    568
  ],
  "ヤブクロン": [
    568
  ],
  "破破袋": [
    568
  ],
  "garbodor": [
    569
  ],
  "ダストダス": [
    569
  ],
  "灰塵山": [
    569
  ],
  "zorua": [
    570
  ],
  "ゾロア": [
    570
  ],
  "索羅亞": [
    570
  ],
  "zoroark": [
    571
  ],
  "ゾロアーク": [
    571
  ],
  "索羅亞克": [
    571
  ],
  "minccino": [
    572
  ],
  "チラーミィ": [
    572
  ],
  "泡沫栗鼠": [
    572
  ],
  "cinccino": [
    573
  ],
  "チラチーノ": [
    573
  ],
  "奇諾栗鼠": [
    573
  ],
  "gothita": [
    574
  ],
  "ゴチム": [
    574
  ],
  "哥德寶寶": [
    574
  ],
  "gothorita": [
    575
  ],
  "ゴチミル": [
    575
  ],
  "哥德小童": [
    575
  ],
  "gothitelle": [
    576
  ],
  "ゴチルゼル": [
    576
  ],
  "哥德小姐": [
    576
  ],
  "solosis": [
    577
  ],
  "ユニラン": [
    577
  ],
  "單卵細胞球": [
    577
  ],
  "duosion": [
    578
  ],
  "ダブラン": [
    578
  ],
  "雙卵細胞球": [
    578
  ],
  "reuniclus": [
    579
  ],
  "ランクルス": [
    579
  ],
  "人造細胞卵": [
    579
  ],
  "ducklett": [
    580
  ],
  "コアルヒー": [
    580
  ],
  "鴨寶寶": [
    580
  ],
  "swanna": [
    581
  ],
  "スワンナ": [
    581
  ],
  "舞天鵝": [
    581
  ],
  "vanillite": [
    582
  ],
  "バニプッチ": [
    582
  ],
  "迷你冰": [
    582
  ],
  "vanillish": [
    583
  ],
  "バニリッチ": [
    583
  ],
  "多多冰": [
    583
  ],
  "vanilluxe": [
    584
  ],
  "バイバニラ": [
    584
  ],
  "雙倍多多冰": [
    584
  ],
  "deerling": [
    585
  ],
  "シキジカ": [
    585
  ],
  "四季鹿": [
    585
  ],
  "sawsbuck": [
    586
  ],
  "メブキジカ": [
    586
  ],
  "萌芽鹿": [
    586
  ],
  "emolga": [
    587
  ],
  "エモンガ": [
    587
  ],
  "電飛鼠": [
    587
  ],
  "karrablast": [
    588
  ],
  "カブルモ": [
    588
  ],
  "蓋蓋蟲": [
    588
  ],
  "escavalier": [
    589
  ],
  "シュバルゴ": [
    589
  ],
  "騎士蝸牛": [
    589
  ],
  "foongus": [
    590
  ],
  "タマゲタケ": [
    590
  ],
  "哎呀球菇": [
    590
  ],
  "amoonguss": [
    591
  ],
  "モロバレル": [
    591
  ],
  "敗露球菇": [
    591
  ],
  "frillish": [
    592
  ],
  "プルリル": [
    592
  ],
  "輕飄飄": [
    592
  ],
  "jellicent": [
    593
  ],
  "ブルンゲル": [
    593
  ],
  "胖嘟嘟": [
    593
  ],
  "alomomola": [
    594
  ],
  "ママンボウ": [
    594
  ],
  "保母曼波": [
    594
  ],
  "joltik": [
    595
  ],
  "バチュル": [
    595
  ],
  "電電蟲": [
    595
  ],
  "galvantula": [
    596
  ],
  "デンチュラ": [
    596
  ],
  "電蜘蛛": [
    596
  ],
  "ferroseed": [
    597
  ],
  "テッシード": [
    597
  ],
  "種子鐵球": [
    597
  ],
  "ferrothorn": [
    598
  ],
  "ナットレイ": [
    598
  ],
  "堅果啞鈴": [
    598
  ],
  "klink": [
    599
  ],
  "ギアル": [
    599
  ],
  "齒輪兒": [
    599
  ],
  "klang": [
    600
  ],
  "ギギアル": [
    600
  ],
  "齒輪組": [
    600
  ],
  "klinklang": [
    601
  ],
  "ギギギアル": [
    601
  ],
  "齒輪怪": [
    601
  ],
  "tynamo": [
    602
  ],
  "シビシラス": [
    602
  ],
  "麻麻小魚": [
    602
  ],
  "eelektrik": [
    603
  ],
  "シビビール": [
    603
  ],
  "麻麻鰻": [
    603
  ],
  "eelektross": [
    604
  ],
  "シビルドン": [
    604
  ],
  "麻麻鰻魚王": [
    604
  ],
  "elgyem": [
    605
  ],
  "リグレー": [
    605
  ],
  "小灰怪": [
    605
  ],
  "beheeyem": [
    606
  ],
  "オーベム": [
    606
  ],
  "大宇怪": [
    606
  ],
  "litwick": [
    607
  ],
  "ヒトモシ": [
    607
  ],
  "燭光靈": [
    607
  ],
  "lampent": [
    608
  ],
  "ランプラー": [
    608
  ],
  "燈火幽靈": [
    608
  ],
  "chandelure": [
    609
  ],
  "シャンデラ": [
    609
  ],
  "水晶燈火靈": [
    609
  ],
  "axew": [
    610
  ],
  "キバゴ": [
    610
  ],
  "牙牙": [
    610
  ],
  "fraxure": [
    611
  ],
  "オノンド": [
    611
  ],
  "斧牙龍": [
    611
  ],
  "haxorus": [
    612
  ],
  "オノノクス": [
    612
  ],
  "雙斧戰龍": [
    612
  ],
  "cubchoo": [
    613
  ],
  "クマシュン": [
    613
  ],
  "噴嚏熊": [
    613
  ],
  "beartic": [
    614
  ],
  "ツンベアー": [
    614
  ],
  "凍原熊": [
    614
  ],
  "cryogonal": [
    615
  ],
  "フリージオ": [
    615
  ],
  "幾何雪花": [
    615
  ],
  "shelmet": [
    616
  ],
  "チョボマキ": [
    616
  ],
  "小嘴蝸": [
    616
  ],
  "accelgor": [
    617
  ],
  "アギルダー": [
    617
  ],
  "敏捷蟲": [
    617
  ],
  "stunfisk": [
    618
  ],
  "マッギョ": [
    618
  ],
  "泥巴魚": [
    618
  ],
  "mienfoo": [
    619
  ],
  "コジョフー": [
    619
  ],
  "功夫鼬": [
    619
  ],
  "mienshao": [
    620
  ],
  "コジョンド": [
    620
  ],
  "師父鼬": [
    620
  ],
  "druddigon": [
    621
  ],
  "クリムガン": [
    621
  ],
  "赤面龍": [
    621
  ],
  "golett": [
    622
  ],
  "ゴビット": [
    622
  ],
  "泥偶小人": [
    622
  ],
  "golurk": [
    623
  ],
  "ゴルーグ": [
    623
  ],
  "泥偶巨人": [
    623
  ],
  "pawniard": [
    624
  ],
  "コマタナ": [
    624
  ],
  "駒刀小兵": [
    624
  ],
  "bisharp": [
    625
  ],
  "キリキザン": [
    625
  ],
  "劈斬司令": [
    625
  ],
  "bouffalant": [
    626
  ],
  "バッフロン": [
    626
  ],
  "爆炸頭水牛": [
    626
  ],
  "rufflet": [
    627
  ],
  "ワシボン": [
    627
  ],
  "毛頭小鷹": [
    627
  ],
  "braviary": [
    628
  ],
  "ウォーグル": [
    628
  ],
  "勇士雄鷹": [
    628
  ],
  "vullaby": [
    629
  ],
  "バルチャイ": [
    629
  ],
  "禿鷹丫頭": [
    629
  ],
  "mandibuzz": [
    630
  ],
  "バルジーナ": [
    630
  ],
  "禿鷹娜": [
    630
  ],
  "heatmor": [
    631
  ],
  "クイタラン": [
    631
  ],
  "熔蟻獸": [
    631
  ],
  "durant": [
    632
  ],
  "アイアント": [
    632
  ],
  "鐵蟻": [
    632
  ],
  "deino": [
    633
  ],
  "モノズ": [
    633
  ],
  "單首龍": [
    633
  ],
  "zweilous": [
    634
  ],
  "ジヘッド": [
    634
  ],
  "雙首暴龍": [
    634
  ],
  "hydreigon": [
    635
  ],
  "サザンドラ": [
    635
  ],
  "三首惡龍": [
    635
  ],
  "larvesta": [
    636
  ],
  "メラルバ": [
    636
  ],
  "燃燒蟲": [
    636
  ],
  "volcarona": [
    637
  ],
  "ウルガモス": [
    637
  ],
  "火神蛾": [
    637
  ],
  "cobalion": [
    638
  ],
  "コバルオン": [
    638
  ],
  "勾帕路翁": [
    638
  ],
  "terrakion": [
    639
  ],
  "テラキオン": [
    639
  ],
  "代拉基翁": [
    639
  ],
  "virizion": [
    640
  ],
  "ビリジオン": [
    640
  ],
  "畢力吉翁": [
    640
  ],
  "tornadus": [
    641
  ],
  "トルネロス": [
    641
  ],
  "龍捲雲": [
    641
  ],
  "thundurus": [
    642
  ],
  "ボルトロス": [
    642
  ],
  "雷電雲": [
    642
  ],
  "reshiram": [
    643
  ],
  "レシラム": [
    643
  ],
  "萊希拉姆": [
    643
  ],
  "zekrom": [
    644
  ],
  "ゼクロム": [
    644
  ],
  "捷克羅姆": [
    644
  ],
  "landorus": [
    645
  ],
  "ランドロス": [
    645
  ],
  "土地雲": [
    645
  ],
  "kyurem": [
    646
  ],
  "キュレム": [
    646
  ],
  "酋雷姆": [
    646
  ],
  "keldeo": [
    647
  ],
  "ケルディオ": [
    647
  ],
  "凱路迪歐": [
    647
  ],
  "meloetta": [
    648
  ],
  "メロエッタ": [
    648
  ],
  "美洛耶塔": [
    648
  ],
  "genesect": [
    649
  ],
  "ゲノセクト": [
    649
  ],
  "蓋諾賽克特": [
    649
  ],
  "chespin": [
    650
  ],
  "ハリマロン": [
    650
  ],
  "哈力栗": [
    650
  ],
  "quilladin": [
    651
  ],
  "ハリボーグ": [
    651
  ],
  "胖胖哈力": [
    651
  ],
  "chesnaught": [
    652
  ],
  "ブリガロン": [
    652
  ],
  "布里卡隆": [
    652
  ],
  "fennekin": [
    653
  ],
  "フォッコ": [
    653
  ],
  "火狐狸": [
    653
  ],
  "braixen": [
    654
  ],
  "テールナー": [
    654
  ],
  "長尾火狐": [
    654
  ],
  "delphox": [
    655
  ],
  "マフォクシー": [
    655
  ],
  "妖火紅狐": [
    655
  ],
  "froakie": [
    656
  ],
  "ケロマツ": [
    656
  ],
  "呱呱泡蛙": [
    656
  ],
  "frogadier": [
    657
  ],
  "ゲコガシラ": [
    657
  ],
  "呱頭蛙": [
    657
  ],
  "greninja": [
    658
  ],
  "ゲッコウガ": [
    658
  ],
  "甲賀忍蛙": [
    658
  ],
  "bunnelby": [
    659
  ],
  "ホルビー": [
    659
  ],
  "掘掘兔": [
    659
  ],
  "diggersby": [
    660
  ],
  "ホルード": [
    660
  ],
  "掘地兔": [
    660
  ],
  "fletchling": [
    661
  ],
  "ヤヤコマ": [
    661
  ],
  "小箭雀": [
    661
  ],
  "fletchinder": [
    662
  ],
  "ヒノヤコマ": [
    662
  ],
  "火箭雀": [
    662
  ],
  "talonflame": [
    663
  ],
  "ファイアロー": [
    663
  ],
  "烈箭鷹": [
    663
  ],
  "scatterbug": [
    664
  ],
  "コフキムシ": [
    664
  ],
  "粉蝶蟲": [
    664
  ],
  "spewpa": [
    665
  ],
  "コフーライ": [
    665
  ],
  "粉蝶蛹": [
    665
  ],
  "vivillon": [
    666
  ],
  "ビビヨン": [
    666
  ],
  "彩粉蝶": [
    666
  ],
  "litleo": [
    667
  ],
  "シシコ": [
    667
  ],
  "小獅獅": [
    667
  ],
  "pyroar": [
    668
  ],
  "カエンジシ": [
    668
  ],
  "火炎獅": [
    668
  ],
  "flabébé": [
    669
  ],
  "フラベベ": [
    669
  ],
  "花蓓蓓": [
    669
  ],
  "floette": [
    670
  ],
  "フラエッテ": [
    670
  ],
  "花葉蒂": [
    670
  ],
  "florges": [
    671
  ],
  "フラージェス": [
    671
  ],
  "花潔夫人": [
    671
  ],
  "skiddo": [
    672
  ],
  "メェークル": [
    672
  ],
  "坐騎小羊": [
    672
  ],
  "gogoat": [
    673
  ],
  "ゴーゴート": [
    673
  ],
  "坐騎山羊": [
    673
  ],
  "pancham": [
    674
  ],
  "ヤンチャム": [
    674
  ],
  "頑皮熊貓": [
    674
  ],
  "pangoro": [
    675
  ],
  "ゴロンダ": [
    675
  ],
  "流氓熊貓": [
    675
  ],
  "furfrou": [
    676
  ],
  "トリミアン": [
    676
  ],
  "多麗米亞": [
    676
  ],
  "espurr": [
    677
  ],
  "ニャスパー": [
    677
  ],
  "妙喵": [
    677
  ],
  "meowstic": [
    678
  ],
  "ニャオニクス": [
    678
  ],
  "超能妙喵": [
    678
  ],
  "honedge": [
    679
  ],
  "ヒトツキ": [
    679
  ],
  "獨劍鞘": [
    679
  ],
  "doublade": [
    680
  ],
  "ニダンギル": [
    680
  ],
  "雙劍鞘": [
    680
  ],
  "aegislash": [
    681
  ],
  "ギルガルド": [
    681
  ],
  "堅盾劍怪": [
    681
  ],
  "spritzee": [
    682
  ],
  "シュシュプ": [
    682
  ],
  "粉香香": [
    682
  ],
  "aromatisse": [
    683
  ],
  "フレフワン": [
    683
  ],
  "芳香精": [
    683
  ],
  "swirlix": [
    684
  ],
  "ペロッパフ": [
    684
  ],
  "綿綿泡芙": [
    684
  ],
  "slurpuff": [
    685
  ],
  "ペロリーム": [
    685
  ],
  "胖甜妮": [
    685
  ],
  "inkay": [
    686
  ],
  "マーイーカ": [
    686
  ],
  "好啦魷": [
    686
  ],
  "malamar": [
    687
  ],
  "カラマネロ": [
    687
  ],
  "烏賊王": [
    687
  ],
  "binacle": [
    688
  ],
  "カメテテ": [
    688
  ],
  "龜腳腳": [
    688
  ],
  "barbaracle": [
    689
  ],
  "ガメノデス": [
    689
  ],
  "龜足巨鎧": [
    689
  ],
  "skrelp": [
    690
  ],
  "クズモー": [
    690
  ],
  "垃垃藻": [
    690
  ],
  "dragalge": [
    691
  ],
  "ドラミドロ": [
    691
  ],
  "毒藻龍": [
    691
  ],
  "clauncher": [
    692
  ],
  "ウデッポウ": [
    692
  ],
  "鐵臂槍蝦": [
    692
  ],
  "clawitzer": [
    693
  ],
  "ブロスター": [
    693
  ],
  "鋼炮臂蝦": [
    693
  ],
  "helioptile": [
    694
  ],
  "エリキテル": [
    694
  ],
  "傘電蜥": [
    694
  ],
  "heliolisk": [
    695
  ],
  "エレザード": [
    695
  ],
  "光電傘蜥": [
    695
  ],
  "tyrunt": [
    696
  ],
  "チゴラス": [
    696
  ],
  "寶寶暴龍": [
    696
  ],
  "tyrantrum": [
    697
  ],
  "ガチゴラス": [
    697
  ],
  "怪顎龍": [
    697
  ],
  "amaura": [
    698
  ],
  "アマルス": [
    698
  ],
  "冰雪龍": [
    698
  ],
  "aurorus": [
    699
  ],
  "アマルルガ": [
    699
  ],
  "冰雪巨龍": [
    699
  ],
  "sylveon": [
    700
  ],
  "ニンフィア": [
    700
  ],
  "仙子伊布": [
    700
  ],
  "hawlucha": [
    701
  ],
  "ルチャブル": [
    701
  ],
  "摔角鷹人": [
    701
  ],
  "dedenne": [
    702
  ],
  "デデンネ": [
    702
  ],
  "咚咚鼠": [
    702
  ],
  "carbink": [
    703
  ],
  "メレシー": [
    703
  ],
  "小碎鑽": [
    703
  ],
  "goomy": [
    704
  ],
  "ヌメラ": [
    704
  ],
  "黏黏寶": [
    704
  ],
  "sliggoo": [
    705
  ],
  "ヌメイル": [
    705
  ],
  "黏美兒": [
    705
  ],
  "goodra": [
    706
  ],
  "ヌメルゴン": [
    706
  ],
  "黏美龍": [
    706
  ],
  "klefki": [
    707
  ],
  "クレッフィ": [
    707
  ],
  "鑰圈兒": [
    707
  ],
  "phantump": [
    708
  ],
  "ボクレー": [
    708
  ],
  "小木靈": [
    708
  ],
  "trevenant": [
    709
  ],
  "オーロット": [
    709
  ],
  "朽木妖": [
    709
  ],
  "pumpkaboo": [
    710
  ],
  "バケッチャ": [
    710
  ],
  "南瓜精": [
    710
  ],
  "gourgeist": [
    711
  ],
  "パンプジン": [
    711
  ],
  "南瓜怪人": [
    711
  ],
  "bergmite": [
    712
  ],
  "カチコール": [
    712
  ],
  "冰寶": [
    712
  ],
  "avalugg": [
    713
  ],
  "クレベース": [
    713
  ],
  "冰岩怪": [
    713
  ],
  "noibat": [
    714
  ],
  "オンバット": [
    714
  ],
  "嗡蝠": [
    714
  ],
  "noivern": [
    715
  ],
  "オンバーン": [
    715
  ],
  "音波龍": [
    715
  ],
  "xerneas": [
    716
  ],
  "ゼルネアス": [
    716
  ],
  "哲爾尼亞斯": [
    716
  ],
  "yveltal": [
    717
  ],
  "イベルタル": [
    717
  ],
  "伊裴爾塔爾": [
    717
  ],
  "zygarde": [
    718
  ],
  "ジガルデ": [
    718
  ],
  "基格爾德": [
    718
  ],
  "diancie": [
    719
  ],
  "ディアンシー": [
    719
  ],
  "蒂安希": [
    719
  ],
  "hoopa": [
    720
  ],
  "フーパ": [
    720
  ],
  "胡帕": [
    720
  ],
  "volcanion": [
    721
  ],
  "ボルケニオン": [
    721
  ],
  "波爾凱尼恩": [
    721
  ],
  "rowlet": [
    722
  ],
  "モクロー": [
    722
  ],
  "木木梟": [
    722
  ],
  "dartrix": [
    723
  ],
  "フクスロー": [
    723
  ],
  "投羽梟": [
    723
  ],
  "decidueye": [
    724
  ],
  "ジュナイパー": [
    724
  ],
  "狙射樹梟": [
    724
  ],
  "litten": [
    725
  ],
  "ニャビー": [
    725
  ],
  "火斑喵": [
    725
  ],
  "torracat": [
    726
  ],
  "ニャヒート": [
    726
  ],
  "炎熱喵": [
    726
  ],
  "incineroar": [
    727
  ],
  "ガオガエン": [
    727
  ],
  "熾焰咆哮虎": [
    727
  ],
  "popplio": [
    728
  ],
  "アシマリ": [
    728
  ],
  "球球海獅": [
    728
  ],
  "brionne": [
    729
  ],
  "オシャマリ": [
    729
  ],
  "花漾海獅": [
    729
  ],
  "primarina": [
    730
  ],
  "アシレーヌ": [
    730
  ],
  "西獅海壬": [
    730
  ],
  "pikipek": [
    731
  ],
  "ツツケラ": [
    731
  ],
  "小篤兒": [
    731
  ],
  "trumbeak": [
    732
  ],
  "ケララッパ": [
    732
  ],
  "喇叭啄鳥": [
    732
  ],
  "toucannon": [
    733
  ],
  "ドデカバシ": [
    733
  ],
  "銃嘴大鳥": [
    733
  ],
  "yungoos": [
    734
  ],
  "ヤングース": [
    734
  ],
  "貓鼬少": [
    734
  ],
  "gumshoos": [
    735
  ],
  "デカグース": [
    735
  ],
  "貓鼬探長": [
    735
  ],
  "grubbin": [
    736
  ],
  "アゴジムシ": [
    736
  ],
  "強顎雞母蟲": [
    736
  ],
  "charjabug": [
    737
  ],
  "デンヂムシ": [
    737
  ],
  "蟲電寶": [
    737
  ],
  "vikavolt": [
    738
  ],
  "クワガノン": [
    738
  ],
  "鍬農炮蟲": [
    738
  ],
  "crabrawler": [
    739
  ],
  "マケンカニ": [
    739
  ],
  "好勝蟹": [
    739
  ],
  "crabominable": [
    740
  ],
  "ケケンカニ": [
    740
  ],
  "好勝毛蟹": [
    740
  ],
  "oricorio": [
    741
  ],
  "オドリドリ": [
    741
  ],
  "花舞鳥": [
    741
  ],
  "cutiefly": [
    742
  ],
  "アブリー": [
    742
  ],
  "萌虻": [
    742
  ],
  "ribombee": [
    743
  ],
  "アブリボン": [
    743
  ],
  "蝶結萌虻": [
    743
  ],
  "rockruff": [
    744
  ],
  "イワンコ": [
    744
  ],
  "岩狗狗": [
    744
  ],
  "lycanroc": [
    745
  ],
  "ルガルガン": [
    745
  ],
  "鬃岩狼人": [
    745
  ],
  "wishiwashi": [
    746
  ],
  "ヨワシ": [
    746
  ],
  "弱丁魚": [
    746
  ],
  "mareanie": [
    747
  ],
  "ヒドイデ": [
    747
  ],
  "好壞星": [
    747
  ],
  "toxapex": [
    748
  ],
  "ドヒドイデ": [
    748
  ],
  "超壞星": [
    748
  ],
  "mudbray": [
    749
  ],
  "ドロバンコ": [
    749
  ],
  "泥驢仔": [
    749
  ],
  "mudsdale": [
    750
  ],
  "バンバドロ": [
    750
  ],
  "重泥挽馬": [
    750
  ],
  "dewpider": [
    751
  ],
  "シズクモ": [
    751
  ],
  "滴蛛": [
    751
  ],
  "araquanid": [
    752
  ],
  "オニシズクモ": [
    752
  ],
  "滴蛛霸": [
    752
  ],
  "fomantis": [
    753
  ],
  "カリキリ": [
    753
  ],
  "偽螳草": [
    753
  ],
  "lurantis": [
    754
  ],
  "ラランテス": [
    754
  ],
  "蘭螳花": [
    754
  ],
  "morelull": [
    755
  ],
  "ネマシュ": [
    755
  ],
  "睡睡菇": [
    755
  ],
  "shiinotic": [
    756
  ],
  "マシェード": [
    756
  ],
  "燈罩夜菇": [
    756
  ],
  "salandit": [
    757
  ],
  "ヤトウモリ": [
    757
  ],
  "夜盜火蜥": [
    757
  ],
  "salazzle": [
    758
  ],
  "エンニュート": [
    758
  ],
  "焰后蜥": [
    758
  ],
  "stufful": [
    759
  ],
  "ヌイコグマ": [
    759
  ],
  "童偶熊": [
    759
  ],
  "bewear": [
    760
  ],
  "キテルグマ": [
    760
  ],
  "穿著熊": [
    760
  ],
  "bounsweet": [
    761
  ],
  "アマカジ": [
    761
  ],
  "甜竹竹": [
    761
  ],
  "steenee": [
    762
  ],
  "アママイコ": [
    762
  ],
  "甜舞妮": [
    762
  ],
  "tsareena": [
    763
  ],
  "アマージョ": [
    763
  ],
  "甜冷美后": [
    763
  ],
  "comfey": [
    764
  ],
  "キュワワー": [
    764
  ],
  "花療環環": [
    764
  ],
  "oranguru": [
    765
  ],
  "ヤレユータン": [
    765
  ],
  "智揮猩": [
    765
  ],
  "passimian": [
    766
  ],
  "ナゲツケサル": [
    766
  ],
  "投擲猴": [
    766
  ],
  "wimpod": [
    767
  ],
  "コソクムシ": [
    767
  ],
  "膽小蟲": [
    767
  ],
  "golisopod": [
    768
  ],
  "グソクムシャ": [
    768
  ],
  "具甲武者": [
    768
  ],
  "sandygast": [
    769
  ],
  "スナバァ": [
    769
  ],
  "沙丘娃": [
    769
  ],
  "palossand": [
    770
  ],
  "シロデスナ": [
    770
  ],
  "噬沙堡爺": [
    770
  ],
  "pyukumuku": [
    771
  ],
  "ナマコブシ": [
    771
  ],
  "拳海參": [
    771
  ],
  "type: null": [
    772
  ],
  "タイプ：ヌル": [
    772
  ],
  "屬性：空": [
    772
  ],
  "silvally": [
    773
  ],
  "シルヴァディ": [
    773
  ],
  "銀伴戰獸": [
    773
  ],
  "minior": [
    774
  ],
  "メテノ": [
    774
  ],
  "小隕星": [
    774
  ],
  "komala": [
    775
  ],
  "ネッコアラ": [
    775
  ],
  "樹枕尾熊": [
    775
  ],
  "turtonator": [
    776
  ],
  "バクガメス": [
    776
  ],
  "爆焰龜獸": [
    776
  ],
  "togedemaru": [
    777
  ],
  "トゲデマル": [
    777
  ],
  "托戈德瑪爾": [
    777
  ],
  "mimikyu": [
    778
  ],
  "ミミッキュ": [
    778
  ],
  "謎擬ｑ": [
    778
  ],
  "bruxish": [
    779
  ],
  "ハギギシリ": [
    779
  ],
  "磨牙彩皮魚": [
    779
  ],
  "drampa": [
    780
  ],
  "ジジーロン": [
    780
  ],
  "老翁龍": [
    780
  ],
  "dhelmise": [
    781
  ],
  "ダダリン": [
    781
  ],
  "破破舵輪": [
    781
  ],
  "jangmo-o": [
    782
  ],
  "ジャラコ": [
    782
  ],
  "心鱗寶": [
    782
  ],
  "hakamo-o": [
    783
  ],
  "ジャランゴ": [
    783
  ],
  "鱗甲龍": [
    783
  ],
  "kommo-o": [
    784
  ],
  "ジャラランガ": [
    784
  ],
  "杖尾鱗甲龍": [
    784
  ],
  "tapu koko": [
    785
  ],
  "カプ・コケコ": [
    785
  ],
  "卡璞・鳴鳴": [
    785
  ],
  "tapu lele": [
    786
  ],
  "カプ・テテフ": [
    786
  ],
  "卡璞・蝶蝶": [
    786
  ],
  "tapu bulu": [
    787
  ],
  "カプ・ブルル": [
    787
  ],
  "卡璞・哞哞": [
    787
  ],
  "tapu fini": [
    788
  ],
  "カプ・レヒレ": [
    788
  ],
  "卡璞・鰭鰭": [
    788
  ],
  "cosmog": [
    789
  ],
  "コスモッグ": [
    789
  ],
  "科斯莫古": [
    789
  ],
  "cosmoem": [
    790
  ],
  "コスモウム": [
    790
  ],
  "科斯莫姆": [
    790
  ],
  "solgaleo": [
    791
  ],
  "ソルガレオ": [
    791
  ],
  "索爾迦雷歐": [
    791
  ],
  "lunala": [
    792
  ],
  "ルナアーラ": [
    792
  ],
  "露奈雅拉": [
    792
  ],
  "nihilego": [
    793
  ],
  "ウツロイド": [
    793
  ],
  "虛吾伊德": [
    793
  ],
  "buzzwole": [
    794
  ],
  "マッシブーン": [
    794
  ],
  "爆肌蚊": [
    794
  ],
  "pheromosa": [
    795
  ],
  "フェローチェ": [
    795
  ],
  "費洛美螂": [
    795
  ],
  "xurkitree": [
    796
  ],
  "デンジュモク": [
    796
  ],
  "電束木": [
    796
  ],
  "celesteela": [
    797
  ],
  "テッカグヤ": [
    797
  ],
  "鐵火輝夜": [
    797
  ],
  "kartana": [
    798
  ],
  "カミツルギ": [
    798
  ],
  "紙御劍": [
    798
  ],
  "guzzlord": [
    799
  ],
  "アクジキング": [
    799
  ],
  "惡食大王": [
    799
  ],
  "necrozma": [
    800
  ],
  "ネクロズマ": [
    800
  ],
  "奈克洛茲瑪": [
    800
  ],
  "magearna": [
    801
  ],
  "マギアナ": [
    801
  ],
  "瑪機雅娜": [
    801
  ],
  "marshadow": [
    802
  ],
  "マーシャドー": [
    802
  ],
  "瑪夏多": [
    802
  ],
  "poipole": [
    803
  ],
  "ベベノム": [
    803
  ],
  "毒貝比": [
    803
  ],
  "naganadel": [
    804
  ],
  "アーゴヨン": [
    804
  ],
  "四顎針龍": [
    804
  ],
  "stakataka": [
    805
  ],
  "ツンデツンデ": [
    805
  ],
  "壘磊石": [
    805
  ],
  "blacephalon": [
    806
  ],
  "ズガドーン": [
    806
  ],
  "砰頭小丑": [
    806
  ],
  "zeraora": [
    807
  ],
  "ゼラオラ": [
    807
  ],
  "捷拉奧拉": [
    807
  ],
  "meltan": [
    808
  ],
  "メルタン": [
    808
  ],
  "美錄坦": [
    808
  ],
  "melmetal": [
    809
  ],
  "メルメタル": [
    809
  ],
  "美錄梅塔": [
    809
  ],
  "grookey": [
    810
  ],
  "サルノリ": [
    810
  ],
  "敲音猴": [
    810
  ],
  "thwackey": [
    811
  ],
  "バチンキー": [
    811
  ],
  "啪咚猴": [
    811
  ],
  "rillaboom": [
    812
  ],
  "ゴリランダー": [
    812
  ],
  "轟擂金剛猩": [
    812
  ],
  "scorbunny": [
    813
  ],
  "ヒバニー": [
    813
  ],
  "炎兔兒": [
    813
  ],
  "raboot": [
    814
  ],
  "ラビフット": [
    814
  ],
  "騰蹴小將": [
    814
  ],
  "cinderace": [
    815
  ],
  "エースバーン": [
    815
  ],
  "閃焰王牌": [
    815
  ],
  "sobble": [
    816
  ],
  "メッソン": [
    816
  ],
  "淚眼蜥": [
    816
  ],
  "drizzile": [
    817
  ],
  "ジメレオン": [
    817
  ],
  "變澀蜥": [
    817
  ],
  "inteleon": [
    818
  ],
  "インテレオン": [
    818
  ],
  "千面避役": [
    818
  ],
  "skwovet": [
    819
  ],
  "ホシガリス": [
    819
  ],
  "貪心栗鼠": [
    819
  ],
  "greedent": [
    820
  ],
  "ヨクバリス": [
    820
  ],
  "藏飽栗鼠": [
    820
  ],
  "rookidee": [
    821
  ],
  "ココガラ": [
    821
  ],
  "稚山雀": [
    821
  ],
  "corvisquire": [
    822
  ],
  "アオガラス": [
    822
  ],
  "藍鴉": [
    822
  ],
  "corviknight": [
    823
  ],
  "アーマーガア": [
    823
  ],
  "鋼鎧鴉": [
    823
  ],
  "blipbug": [
    824
  ],
  "サッチムシ": [
    824
  ],
  "索偵蟲": [
    824
  ],
  "dottler": [
    825
  ],
  "レドームシ": [
    825
  ],
  "天罩蟲": [
    825
  ],
  "orbeetle": [
    826
  ],
  "イオルブ": [
    826
  ],
  "以歐路普": [
    826
  ],
  "nickit": [
    827
  ],
  "クスネ": [
    827
  ],
  "偷兒狐": [
    827
  ],
  "thievul": [
    828
  ],
  "フォクスライ": [
    828
  ],
  "狐大盜": [
    828
  ],
  "gossifleur": [
    829
  ],
  "ヒメンカ": [
    829
  ],
  "幼棉棉": [
    829
  ],
  "eldegoss": [
    830
  ],
  "ワタシラガ": [
    830
  ],
  "白蓬蓬": [
    830
  ],
  "wooloo": [
    831
  ],
  "ウールー": [
    831
  ],
  "毛辮羊": [
    831
  ],
  "dubwool": [
    832
  ],
  "バイウールー": [
    832
  ],
  "毛毛角羊": [
    832
  ],
  "chewtle": [
    833
  ],
  "カムカメ": [
    833
  ],
  "咬咬龜": [
    833
  ],
  "drednaw": [
    834
  ],
  "カジリガメ": [
    834
  ],
  "暴噬龜": [
    834
  ],
  "yamper": [
    835
  ],
  "ワンパチ": [
    835
  ],
  "來電汪": [
    835
  ],
  "boltund": [
    836
  ],
  "パルスワン": [
    836
  ],
  "逐電犬": [
    836
  ],
  "rolycoly": [
    837
  ],
  "タンドン": [
    837
  ],
  "小炭仔": [
    837
  ],
  "carkol": [
    838
  ],
  "トロッゴン": [
    838
  ],
  "大炭車": [
    838
  ],
  "coalossal": [
    839
  ],
  "セキタンザン": [
    839
  ],
  "巨炭山": [
    839
  ],
  "applin": [
    840
  ],
  "カジッチュ": [
    840
  ],
  "啃果蟲": [
    840
  ],
  "flapple": [
    841
  ],
  "アップリュー": [
    841
  ],
  "蘋裹龍": [
    841
  ],
  "appletun": [
    842
  ],
  "タルップル": [
    842
  ],
  "豐蜜龍": [
    842
  ],
  "silicobra": [
    843
  ],
  "スナヘビ": [
    843
  ],
  "沙包蛇": [
    843
  ],
  "sandaconda": [
    844
  ],
  "サダイジャ": [
    844
  ],
  "沙螺蟒": [
    844
  ],
  "cramorant": [
    845
  ],
  "ウッウ": [
    845
  ],
  "古月鳥": [
    845
  ],
  "arrokuda": [
    846
  ],
  "サシカマス": [
    846
  ],
  "刺梭魚": [
    846
  ],
  "barraskewda": [
    847
  ],
  "カマスジョー": [
    847
  ],
  "戽斗尖梭": [
    847
  ],
  "toxel": [
    848
  ],
  "エレズン": [
    848
  ],
  "毒電嬰": [
    848
  ],
  "toxtricity": [
    849
  ],
  "ストリンダー": [
    849
  ],
  "顫弦蠑螈": [
    849
  ],
  "sizzlipede": [
    850
  ],
  "ヤクデ": [
    850
  ],
  "燒火蚣": [
    850
  ],
  "centiskorch": [
    851
  ],
  "マルヤクデ": [
    851
  ],
  "焚焰蚣": [
    851
  ],
  "clobbopus": [
    852
  ],
  "タタッコ": [
    852
  ],
  "拳拳蛸": [
    852
  ],
  "grapploct": [
    853
  ],
  "オトスパス": [
    853
  ],
  "八爪武師": [
    853
  ],
  "sinistea": [
    854
  ],
  "ヤバチャ": [
    854
  ],
  "來悲茶": [
    854
  ],
  "polteageist": [
    855
  ],
  "ポットデス": [
    855
  ],
  "怖思壺": [
    855
  ],
  "hatenna": [
    856
  ],
  "ミブリム": [
    856
  ],
  "迷布莉姆": [
    856
  ],
  "hattrem": [
    857
  ],
  "テブリム": [
    857
  ],
  "提布莉姆": [
    857
  ],
  "hatterene": [
    858
  ],
  "ブリムオン": [
    858
  ],
  "布莉姆溫": [
    858
  ],
  "impidimp": [
    859
  ],
  "ベロバー": [
    859
  ],
  "搗蛋小妖": [
    859
  ],
  "morgrem": [
    860
  ],
  "ギモー": [
    860
  ],
  "詐唬魔": [
    860
  ],
  "grimmsnarl": [
    861
  ],
  "オーロンゲ": [
    861
  ],
  "長毛巨魔": [
    861
  ],
  "obstagoon": [
    862
  ],
  "タチフサグマ": [
    862
  ],
  "堵攔熊": [
    862
  ],
  "perrserker": [
    863
  ],
  "ニャイキング": [
    863
  ],
  "喵頭目": [
    863
  ],
  "cursola": [
    864
  ],
  "サニゴーン": [
    864
  ],
  "魔靈珊瑚": [
    864
  ],
  "sirfetch’d": [
    865
  ],
  "ネギガナイト": [
    865
  ],
  "蔥遊兵": [
    865
  ],
  "mr. rime": [
    866
  ],
  "バリコオル": [
    866
  ],
  "踏冰人偶": [
    866
  ],
  "runerigus": [
    867
  ],
  "デスバーン": [
    867
  ],
  "死神板": [
    867
  ],
  "milcery": [
    868
  ],
  "マホミル": [
    868
  ],
  "小仙奶": [
    868
  ],
  "alcremie": [
    869
  ],
  "マホイップ": [
    869
  ],
  "霜奶仙": [
    869
  ],
  "falinks": [
    870
  ],
  "タイレーツ": [
    870
  ],
  "列陣兵": [
    870
  ],
  "pincurchin": [
    871
  ],
  "バチンウニ": [
    871
  ],
  "啪嚓海膽": [
    871
  ],
  "snom": [
    872
  ],
  "ユキハミ": [
    872
  ],
  "雪吞蟲": [
    872
  ],
  "frosmoth": [
    873
  ],
  "モスノウ": [
    873
  ],
  "雪絨蛾": [
    873
  ],
  "stonjourner": [
    874
  ],
  "イシヘンジン": [
    874
  ],
  "巨石丁": [
    874
  ],
  "eiscue": [
    875
  ],
  "コオリッポ": [
    875
  ],
  "冰砌鵝": [
    875
  ],
  "indeedee": [
    876
  ],
  "イエッサン": [
    876
  ],
  "愛管侍": [
    876
  ],
  "morpeko": [
    877
  ],
  "モルペコ": [
    877
  ],
  "莫魯貝可": [
    877
  ],
  "cufant": [
    878
  ],
  "ゾウドウ": [
    878
  ],
  "銅象": [
    878
  ],
  "copperajah": [
    879
  ],
  "ダイオウドウ": [
    879
  ],
  "大王銅象": [
    879
  ],
  "dracozolt": [
    880
  ],
  "パッチラゴン": [
    880
  ],
  "雷鳥龍": [
    880
  ],
  "arctozolt": [
    881
  ],
  "パッチルドン": [
    881
  ],
  "雷鳥海獸": [
    881
  ],
  "dracovish": [
    882
  ],
  "ウオノラゴン": [
    882
  ],
  "鰓魚龍": [
    882
  ],
  "arctovish": [
    883
  ],
  "ウオチルドン": [
    883
  ],
  "鰓魚海獸": [
    883
  ],
  "duraludon": [
    884
  ],
  "ジュラルドン": [
    884
  ],
  "鋁鋼龍": [
    884
  ],
  "dreepy": [
    885
  ],
  "ドラメシヤ": [
    885
  ],
  "多龍梅西亞": [
    885
  ],
  "drakloak": [
    886
  ],
  "ドロンチ": [
    886
  ],
  "多龍奇": [
    886
  ],
  "dragapult": [
    887
  ],
  "ドラパルト": [
    887
  ],
  "多龍巴魯托": [
    887
  ],
  "zacian": [
    888
  ],
  "ザシアン": [
    888
  ],
  "蒼響": [
    888
  ],
  "zamazenta": [
    889
  ],
  "ザマゼンタ": [
    889
  ],
  "藏瑪然特": [
    889
  ],
  "eternatus": [
    890
  ],
  "ムゲンダイナ": [
    890
  ],
  "無極汰那": [
    890
  ],
  "kubfu": [
    891
  ],
  "ダクマ": [
    891
  ],
  "熊徒弟": [
    891
  ],
  "urshifu": [
    892
  ],
  "ウーラオス": [
    892
  ],
  "武道熊師": [
    892
  ],
  "zarude": [
    893
  ],
  "ザルード": [
    893
  ],
  "薩戮德": [
    893
  ],
  "regieleki": [
    894
  ],
  "レジエレキ": [
    894
  ],
  "雷吉艾勒奇": [
    894
  ],
  "regidrago": [
    895
  ],
  "レジドラゴ": [
    895
  ],
  "雷吉鐸拉戈": [
    895
  ],
  "glastrier": [
    896
  ],
  "ブリザポス": [
    896
  ],
  "雪暴馬": [
    896
  ],
  "spectrier": [
    897
  ],
  "レイスポス": [
    897
  ],
  "靈幽馬": [
    897
  ],
  "calyrex": [
    898
  ],
  "バドレックス": [
    898
  ],
  "蕾冠王": [
    898
  ],
  "wyrdeer": [
    899
  ],
  "アヤシシ": [
    899
  ],
  "詭角鹿": [
    899
  ],
  "kleavor": [
    900
  ],
  "バサギリ": [
    900
  ],
  "劈斧螳螂": [
    900
  ],
  "ursaluna": [
    901
  ],
  "ガチグマ": [
    901
  ],
  "月月熊": [
    901
  ],
  "basculegion": [
    902
  ],
  "イダイトウ": [
    902
  ],
  "幽尾玄魚": [
    902
  ],
  "sneasler": [
    903
  ],
  "オオニューラ": [
    903
  ],
  "大狃拉": [
    903
  ],
  "overqwil": [
    904
  ],
  "ハリーマン": [
    904
  ],
  "萬針魚": [
    904
  ],
  "enamorus": [
    905
  ],
  "ラブトロス": [
    905
  ],
  "眷戀雲": [
    905
  ],
  "sprigatito": [
    906
  ],
  "ニャオハ": [
    906
  ],
  "新葉喵": [
    906
  ],
  "floragato": [
    907
  ],
  "ニャローテ": [
    907
  ],
  "蒂蕾喵": [
    907
  ],
  "meowscarada": [
    908
  ],
  "マスカーニャ": [
    908
  ],
  "魔幻假面喵": [
    908
  ],
  "fuecoco": [
    909
  ],
  "ホゲータ": [
    909
  ],
  "呆火鱷": [
    909
  ],
  "crocalor": [
    910
  ],
  "アチゲータ": [
    910
  ],
  "炙燙鱷": [
    910
  ],
  "skeledirge": [
    911
  ],
  "ラウドボーン": [
    911
  ],
  "骨紋巨聲鱷": [
    911
  ],
  "quaxly": [
    912
  ],
  "クワッス": [
    912
  ],
  "潤水鴨": [
    912
  ],
  "quaxwell": [
    913
  ],
  "ウェルカモ": [
    913
  ],
  "湧躍鴨": [
    913
  ],
  "quaquaval": [
    914
  ],
  "ウェーニバル": [
    914
  ],
  "狂歡浪舞鴨": [
    914
  ],
  "lechonk": [
    915
  ],
  "グルトン": [
    915
  ],
  "愛吃豚": [
    915
  ],
  "oinkologne": [
    916
  ],
  "パフュートン": [
    916
  ],
  "飄香豚": [
    916
  ],
  "tarountula": [
    917
  ],
  "タマンチュラ": [
    917
  ],
  "團珠蛛": [
    917
  ],
  "spidops": [
    918
  ],
  "ワナイダー": [
    918
  ],
  "操陷蛛": [
    918
  ],
  "nymble": [
    919
  ],
  "マメバッタ": [
    919
  ],
  "豆蟋蟀": [
    919
  ],
  "lokix": [
    920
  ],
  "エクスレッグ": [
    920
  ],
  "烈腿蝗": [
    920
  ],
  "pawmi": [
    921
  ],
  "パモ": [
    921
  ],
  "布撥": [
    921
  ],
  "pawmo": [
    922
  ],
  "パモット": [
    922
  ],
  "布土撥": [
    922
  ],
  "pawmot": [
    923
  ],
  "パーモット": [
    923
  ],
  "巴布土撥": [
    923
  ],
  "tandemaus": [
    924
  ],
  "ワッカネズミ": [
    924
  ],
  "一對鼠": [
    924
  ],
  "maushold": [
    925
  ],
  "イッカネズミ": [
    925
  ],
  "一家鼠": [
    925
  ],
  "fidough": [
    926
  ],
  "パピモッチ": [
    926
  ],
  "狗仔包": [
    926
  ],
  "dachsbun": [
    927
  ],
  "バウッツェル": [
    927
  ],
  "麻花犬": [
    927
  ],
  "smoliv": [
    928
  ],
  "ミニーブ": [
    928
  ],
  "迷你芙": [
    928
  ],
  "dolliv": [
    929
  ],
  "オリーニョ": [
    929
  ],
  "奧利紐": [
    929
  ],
  "arboliva": [
    930
  ],
  "オリーヴァ": [
    930
  ],
  "奧利瓦": [
    930
  ],
  "squawkabilly": [
    931
  ],
  "イキリンコ": [
    931
  ],
  "怒鸚哥": [
    931
  ],
  "nacli": [
    932
  ],
  "コジオ": [
    932
  ],
  "鹽石寶": [
    932
  ],
  "naclstack": [
    933
  ],
  "ジオヅム": [
    933
  ],
  "鹽石壘": [
    933
  ],
  "garganacl": [
    934
  ],
  "キョジオーン": [
    934
  ],
  "鹽石巨靈": [
    934
  ],
  "charcadet": [
    935
  ],
  "カルボウ": [
    935
  ],
  "炭小侍": [
    935
  ],
  "armarouge": [
    936
  ],
  "グレンアルマ": [
    936
  ],
  "紅蓮鎧騎": [
    936
  ],
  "ceruledge": [
    937
  ],
  "ソウブレイズ": [
    937
  ],
  "蒼炎刃鬼": [
    937
  ],
  "tadbulb": [
    938
  ],
  "ズピカ": [
    938
  ],
  "光蚪仔": [
    938
  ],
  "bellibolt": [
    939
  ],
  "ハラバリー": [
    939
  ],
  "電肚蛙": [
    939
  ],
  "wattrel": [
    940
  ],
  "カイデン": [
    940
  ],
  "電海燕": [
    940
  ],
  "kilowattrel": [
    941
  ],
  "タイカイデン": [
    941
  ],
  "大電海燕": [
    941
  ],
  "maschiff": [
    942
  ],
  "オラチフ": [
    942
  ],
  "偶叫獒": [
    942
  ],
  "mabosstiff": [
    943
  ],
  "マフィティフ": [
    943
  ],
  "獒教父": [
    943
  ],
  "shroodle": [
    944
  ],
  "シルシュルー": [
    944
  ],
  "滋汁鼴": [
    944
  ],
  "grafaiai": [
    945
  ],
  "タギングル": [
    945
  ],
  "塗標客": [
    945
  ],
  "bramblin": [
    946
  ],
  "アノクサ": [
    946
  ],
  "納噬草": [
    946
  ],
  "brambleghast": [
    947
  ],
  "アノホラグサ": [
    947
  ],
  "怖納噬草": [
    947
  ],
  "toedscool": [
    948
  ],
  "ノノクラゲ": [
    948
  ],
  "原野水母": [
    948
  ],
  "toedscruel": [
    949
  ],
  "リククラゲ": [
    949
  ],
  "陸地水母": [
    949
  ],
  "klawf": [
    950
  ],
  "ガケガニ": [
    950
  ],
  "毛崖蟹": [
    950
  ],
  "capsakid": [
    951
  ],
  "カプサイジ": [
    951
  ],
  "熱辣娃": [
    951
  ],
  "scovillain": [
    952
  ],
  "スコヴィラン": [
    952
  ],
  "狠辣椒": [
    952
  ],
  "rellor": [
    953
  ],
  "シガロコ": [
    953
  ],
  "蟲滾泥": [
    953
  ],
  "rabsca": [
    954
  ],
  "ベラカス": [
    954
  ],
  "蟲甲聖": [
    954
  ],
  "flittle": [
    955
  ],
  "ヒラヒナ": [
    955
  ],
  "飄飄雛": [
    955
  ],
  "espathra": [
    956
  ],
  "クエスパトラ": [
    956
  ],
  "超能艷鴕": [
    956
  ],
  "tinkatink": [
    957
  ],
  "カヌチャン": [
    957
  ],
  "小鍛匠": [
    957
  ],
  "tinkatuff": [
    958
  ],
  "ナカヌチャン": [
    958
  ],
  "巧鍛匠": [
    958
  ],
  "tinkaton": [
    959
  ],
  "デカヌチャン": [
    959
  ],
  "巨鍛匠": [
    959
  ],
  "wiglett": [
    960
  ],
  "ウミディグダ": [
    960
  ],
  "海地鼠": [
    960
  ],
  "wugtrio": [
    961
  ],
  "ウミトリオ": [
    961
  ],
  "三海地鼠": [
    961
  ],
  "bombirdier": [
    962
  ],
  "オトシドリ": [
    962
  ],
  "下石鳥": [
    962
  ],
  "finizen": [
    963
  ],
  "ナミイルカ": [
    963
  ],
  "波普海豚": [
    963
  ],
  "palafin": [
    964
  ],
  "イルカマン": [
    964
  ],
  "海豚俠": [
    964
  ],
  "varoom": [
    965
  ],
  "ブロロン": [
    965
  ],
  "噗隆隆": [
    965
  ],
  "revavroom": [
    966
  ],
  "ブロロローム": [
    966
  ],
  "普隆隆姆": [
    966
  ],
  "cyclizar": [
    967
  ],
  "モトトカゲ": [
    967
  ],
  "摩托蜥": [
    967
  ],
  "orthworm": [
    968
  ],
  "ミミズズ": [
    968
  ],
  "拖拖蚓": [
    968
  ],
  "glimmet": [
    969
  ],
  "キラーメ": [
    969
  ],
  "晶光芽": [
    969
  ],
  "glimmora": [
    970
  ],
  "キラフロル": [
    970
  ],
  "晶光花": [
    970
  ],
  "greavard": [
    971
  ],
  "ボチ": [
    971
  ],
  "墓仔狗": [
    971
  ],
  "houndstone": [
    972
  ],
  "ハカドッグ": [
    972
  ],
  "墓揚犬": [
    972
  ],
  "flamigo": [
    973
  ],
  "カラミンゴ": [
    973
  ],
  "纏紅鶴": [
    973
  ],
  "cetoddle": [
    974
  ],
  "アルクジラ": [
    974
  ],
  "走鯨": [
    974
  ],
  "cetitan": [
    975
  ],
  "ハルクジラ": [
    975
  ],
  "浩大鯨": [
    975
  ],
  "veluza": [
    976
  ],
  "ミガルーサ": [
    976
  ],
  "輕身鱈": [
    976
  ],
  "dondozo": [
    977
  ],
  "ヘイラッシャ": [
    977
  ],
  "吃吼霸": [
    977
  ],
  "tatsugiri": [
    978
  ],
  "シャリタツ": [
    978
  ],
  "米立龍": [
    978
  ],
  "annihilape": [
    979
  ],
  "コノヨザル": [
    979
  ],
  "棄世猴": [
    979
  ],
  "clodsire": [
    980
  ],
  "ドオー": [
    980
  ],
  "土王": [
    980
  ],
  "farigiraf": [
    981
  ],
  "リキキリン": [
    981
  ],
  "奇麒麟": [
    981
  ],
  "dudunsparce": [
    982
  ],
  "ノココッチ": [
    982
  ],
  "土龍節節": [
    982
  ],
  "kingambit": [
    983
  ],
  "ドドゲザン": [
    983
  ],
  "仆刀將軍": [
    983
  ],
  "great tusk": [
    984
  ],
  "イダイナキバ": [
    984
  ],
  "雄偉牙": [
    984
  ],
  "scream tail": [
    985
  ],
  "サケブシッポ": [
    985
  ],
  "吼叫尾": [
    985
  ],
  "brute bonnet": [
    986
  ],
  "アラブルタケ": [
    986
  ],
  "猛惡菇": [
    986
  ],
  "flutter mane": [
    987
  ],
  "ハバタクカミ": [
    987
  ],
  "振翼髮": [
    987
  ],
  "slither wing": [
    988
  ],
  "チヲハウハネ": [
    988
  ],
  "爬地翅": [
    988
  ],
  "sandy shocks": [
    989
  ],
  "スナノケガワ": [
    989
  ],
  "沙鐵皮": [
    989
  ],
  "iron treads": [
    990
  ],
  "テツノワダチ": [
    990
  ],
  "鐵轍跡": [
    990
  ],
  "iron bundle": [
    991
  ],
  "テツノツツミ": [
    991
  ],
  "鐵包袱": [
    991
  ],
  "iron hands": [
    992
  ],
  "テツノカイナ": [
    992
  ],
  "鐵臂膀": [
    992
  ],
  "iron jugulis": [
    993
  ],
  "テツノコウベ": [
    993
  ],
  "鐵脖頸": [
    993
  ],
  "iron moth": [
    994
  ],
  "テツノドクガ": [
    994
  ],
  "鐵毒蛾": [
    994
  ],
  "iron thorns": [
    995
  ],
  "テツノイバラ": [
    995
  ],
  "鐵荊棘": [
    995
  ],
  "frigibax": [
    996
  ],
  "セビエ": [
    996
  ],
  "涼脊龍": [
    996
  ],
  "arctibax": [
    997
  ],
  "セゴール": [
    997
  ],
  "凍脊龍": [
    997
  ],
  "baxcalibur": [
    998
  ],
  "セグレイブ": [
    998
  ],
  "戟脊龍": [
    998
  ],
  "gimmighoul": [
    999
  ],
  "コレクレー": [
    999
  ],
  "索財靈": [
    999
  ],
  "gholdengo": [
    1000
  ],
  "サーフゴー": [
    1000
  ],
  "賽富豪": [
    1000
  ],
  "wo-chien": [
    1001
  ],
  "チオンジェン": [
    1001
  ],
  "古簡蝸": [
    1001
  ],
  "chien-pao": [
    1002
  ],
  "パオジアン": [
    1002
  ],
  "古劍豹": [
    1002
  ],
  "ting-lu": [
    1003
  ],
  "ディンルー": [
    1003
  ],
  "古鼎鹿": [
    1003
  ],
  "chi-yu": [
    1004
  ],
  "イーユイ": [
    1004
  ],
  "古玉魚": [
    1004
  ],
  "roaring moon": [
    1005
  ],
  "トドロクツキ": [
    1005
  ],
  "轟鳴月": [
    1005
  ],
  "iron valiant": [
    1006
  ],
  "テツノブジン": [
    1006
  ],
  "鐵武者": [
    1006
  ],
  "koraidon": [
    1007
  ],
  "コライドン": [
    1007
  ],
  "故勒頓": [
    1007
  ],
  "miraidon": [
    1008
  ],
  "ミライドン": [
    1008
  ],
  "密勒頓": [
    1008
  ],
  "walking wake": [
    1009
  ],
  "ウネルミナモ": [
    1009
  ],
  "波盪水": [
    1009
  ],
  "iron leaves": [
    1010
  ],
  "テツノイサハ": [
    1010
  ],
  "鐵斑葉": [
    1010
  ],
  "dipplin": [
    1011
  ],
  "カミッチュ": [
    1011
  ],
  "裹蜜蟲": [
    1011
  ],
  "poltchageist": [
    1012
  ],
  "チャデス": [
    1012
  ],
  "斯魔茶": [
    1012
  ],
  "sinistcha": [
    1013
  ],
  "ヤバソチャ": [
    1013
  ],
  "來悲粗茶": [
    1013
  ],
  "okidogi": [
    1014
  ],
  "イイネイヌ": [
    1014
  ],
  "夠讚狗": [
    1014
  ],
  "munkidori": [
    1015
  ],
  "マシマシラ": [
    1015
  ],
  "願增猿": [
    1015
  ],
  "fezandipiti": [
    1016
  ],
  "キチキギス": [
    1016
  ],
  "吉雉雞": [
    1016
  ],
  "ogerpon": [
    1017
  ],
  "オーガポン": [
    1017
  ],
  "厄鬼椪": [
    1017
  ],
  "archaludon": [
    1018
  ],
  "ブリジュラス": [
    1018
  ],
  "鋁鋼橋龍": [
    1018
  ],
  "hydrapple": [
    1019
  ],
  "カミツオロチ": [
    1019
  ],
  "蜜集大蛇": [
    1019
  ],
  "gouging fire": [
    1020
  ],
  "ウガツホムラ": [
    1020
  ],
  "破空焰": [
    1020
  ],
  "raging bolt": [
    1021
  ],
  "タケルライコ": [
    1021
  ],
  "猛雷鼓": [
    1021
  ],
  "iron boulder": [
    1022
  ],
  "テツノイワオ": [
    1022
  ],
  "铁磐岩": [
    1022
  ],
  "iron crown": [
    1023
  ],
  "テツノカシラ": [
    1023
  ],
  "铁头壳": [
    1023
  ],
  "terapagos": [
    1024
  ],
  "テラパゴス": [
    1024
  ],
  "太樂巴戈斯": [
    1024
  ],
  "pecharunt": [
    1025
  ],
  "モモワロウ": [
    1025
  ],
  "桃歹郎": [
    1025
  ]
}

const LANGUAGE_FIELD: Record<Language, keyof (typeof POKEMON_NAMES)[number] | null> = {
  EN: 'en',
  JA: 'ja',
  ZH_TW: 'zhHant',
}

/**
 * 輸入詞若完整匹配某語言的物種名，展開為選定語言的物種名（去重、排除與原 q 相同者）。
 * 非完整匹配（如僅部分字、非物種詞）回傳 []，呼叫端應退回字面搜尋。
 */
export function expandPokemonNameTerms(q: string, lang: Language): string[] {
  const field = LANGUAGE_FIELD[lang]
  if (!field) return []

  const dexIds = POKEMON_NAME_INDEX[q.toLowerCase()]
  if (!dexIds) return []

  const qLower = q.toLowerCase()
  const terms = new Set<string>()
  for (const dex of dexIds) {
    const term = POKEMON_NAMES[dex]?.[field]
    if (term && term.toLowerCase() !== qLower) terms.add(term)
  }
  return [...terms]
}
