import livaponCard from "../assets/images/service_livapon_card.webp";
import snsCard from "../assets/images/service_sns_card.webp";
import kosolifeCard from "../assets/images/service_kosolife.webp";

export const site = {
  name: "株式会社CHAIRMAN",
  shortName: "CHAIRMAN",
  description:
    "日本の文化・技・商品価値を、地域から国内外の市場へ接続する事業会社。自治体、地域事業者、ブランドとともに、価値の発見から発信、販売までを設計します。",
  siteUrl: "https://chairman-official.com",
  themeColor: "#8d0820",
  representativeNote: {
    title: "代表の備忘録",
    description:
      "地域の価値をどう整理し、どの市場へどう接続していくか。CHAIRMANの視点を、代表の備忘録として少しずつ整理していくための場所です。",
    statusLabel: "公開準備中",
    href: ""
  }
};

export const navigation = [
  { href: "/about-us/", label: "私たちについて" },
  { href: "/#business", label: "事業紹介" },
  { href: "/news/", label: "新着情報" },
  { href: "/contact/", label: "お問い合わせ" }
] as const;

export const homeRoles = [
  {
    label: "Discover",
    title: "地域や日本の価値を発見する",
    body:
      "自治体、地域事業者、ブランドが持つ文化・技・商品価値を、事業として前に進めるために整理します。"
  },
  {
    label: "Shape",
    title: "価値が伝わる形に整える",
    body:
      "発信設計、ブランド設計、映像制作、販売導線の設計までを横断し、価値が正しく伝わる状態をつくります。"
  },
  {
    label: "Connect",
    title: "国内外の市場につなぐ",
    body:
      "LIVAPON、SNS運用、映像制作、自社ブランド運営を通じて、地域の価値を継続的な需要へ接続します。"
  }
];

export const businesses = [
  {
    label: "Cross-border Commerce",
    title: "LIVAPON",
    summary:
      "日本のものづくりと地域産品を、国内外の生活者へ届ける越境EC事業。228の国と地域へ届ける接点づくりを進めています。",
    href: "https://sell.livapon.com/",
    linkLabel: "サービス概要を見る",
    image: livaponCard
  },
  {
    label: "Communication Design",
    title: "SNS運用・映像制作",
    summary:
      "支援実績140件以上。SNS運用、映像制作、運用体制づくりを通じて、価値が届く状態を継続的に支えます。",
    href: "https://service.chairman-official.com/",
    linkLabel: "SNS・映像制作の支援内容を見る",
    image: snsCard
  },
  {
    label: "Own Brand",
    title: "KOSOLIFE",
    summary:
      "自社でもブランドを運営し、商品設計、販売導線、運用改善までを実証しながら知見を蓄積しています。",
    href: "https://sunskosolife.com/",
    linkLabel: "KOSOLIFE のECを見る",
    image: kosolifeCard
  }
];

export const companyFacts = [
  { label: "屋号", value: "CHAIR MAN" },
  { label: "設立", value: "2022年6月10日" },
  { label: "所在地", value: "〒107-0062 東京都港区南青山2-2-15" },
  { label: "代表者", value: "田中 透" },
  { label: "資本金", value: "1,000,000円" },
  { label: "酵素玄米製造工場", value: "〒329-2216 栃木県塩谷郡塩谷町大字上寺島1618番地4" }
];

export const contactCategories = [
  "SNSマーケティングについて",
  "動画制作について",
  "イベント事業について",
  "酵素玄米などの健康食品について",
  "その他"
] as const;

export const livaponStatements = {
  mission: [
    "日本のものづくりを、LIVEで世界へ。",
    "売り切るだけではなく、作り手の背景と熱量ごと届けるための越境ECを育てています。"
  ],
  belief: [
    "作り手の想いが正しく届く世界をつくる。",
    "地域に眠る価値を、ただ情報として並べるのではなく、物語と信頼のある接点に変える。"
  ],
  credibility: [
    "LIVAPONは株式会社CHAIRMANが企画・運営しています。",
    "越境EC支援の推進、品質管理、パートナー連携まで、当社の責任のもとで実装します。"
  ]
};
