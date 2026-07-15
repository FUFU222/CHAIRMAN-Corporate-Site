import ceoImage from "../assets/images/CEO-image.webp";
import jfcStageImage from "../assets/images/JFC_stage_image.webp";
import bitekiCoverImage from "../assets/images/news/biteki-2026-06-koso-life/cover.jpg";
import livaponOpenImage from "../assets/images/news/livapon-online-store-launch/cover.svg";
import jfcaCoverImage from "../assets/images/news/livapon-japan-festival-canada-2026/cover.jpg";
import type { NewsArticle } from "../lib/types";
import { buildExcerpt } from "../lib/format";

const tanaka = {
  title: "代表取締役",
  name: "田中 透",
  bio: "",
  image: ceoImage
};

function article(partial: Omit<NewsArticle, "excerpt">): NewsArticle {
  return {
    ...partial,
    excerpt: buildExcerpt(partial.description || partial.contentHtml, 70)
  };
}

export const mockNews: NewsArticle[] = [
  article({
    id: "livapon-japan-festival-canada-2026",
    slug: "livapon-japan-festival-canada-2026",
    title: "LIVAPONが「Japan Festival CANADA」へ進出",
    description:
      "LIVAPONは、2026年8月15日〜16日にカナダ・トロントで開催される「Japan Festival CANADA2026」へ、Official Japanese Heritage Partnerとして参画し、日本の職人文化を世界へ発信します。",
    publishedAt: "2026-07-15T00:00:00.000Z",
    categories: [
      { id: "livapon", name: "LIVAPON" },
      { id: "overseas-expansion", name: "海外展開" }
    ],
    eyecatch: jfcaCoverImage,
    author: tanaka,
    contentHtml: `
      <p>当社が運営する「LIVAPON」は、2026年8月15日〜16日にカナダ・トロントで開催される日本文化イベント「Japan Festival CANADA2026」へ出展することが決定しました。あわせて、本イベントのOfficial Japanese Heritage Partnerとして参画します。</p>
      <h2>出展の背景</h2>
      <p>構想段階から日本各地の工房や生産地を訪れ、実際に商品を見て、触れ、職人との対話を通じて、その背景にある歴史や文化に触れてきました。大切な文化だからこそ、日本国内だけに留めるのではなく、世界中の日本を愛する人々に知ってもらいたい。Japan Festival CANADA2026への出展は、その実現に向けた大きな一歩です。</p>
      <h2>Japan Festival CANADA2026について</h2>
      <p>カナダ・トロントで開催される日本文化イベントで、LIVAPONは今回Official Japanese Heritage Partnerとして参画します。会場では、日本の職人技や文化的背景を紹介するとともに、LIVAPONが取り扱う商品や今後展開するサービスについても発信してまいります。</p>
      <h2>今後の展開</h2>
      <p>今後は、日本の伝統技術を職人から直接学び、技術や精神性を体得できる新たなサービスも近日発表予定です。</p>
      <p>LIVAPONは、Japan Festival CANADAのOfficial Japanese Heritage Partnerとして、日本と世界をつなぐ文化の架け橋を目指してまいります。</p>
      <p><a href="https://www.japanfestivalcanada.com/" target="_blank" rel="noopener noreferrer">Japan Festival CANADA公式サイトはこちら</a></p>
    `
  }),
  article({
    id: "livapon-project-release",
    slug: "livapon-project-release",
    title: "日本の伝統文化を世界へ届ける「LIVAPON」をリリースしました",
    description:
      "日本各地に受け継がれてきた伝統文化や職人の技術を、その背景にある歴史とともに世界へ届けるプロジェクト「LIVAPON」をリリースしました。",
    publishedAt: "2026-07-15T00:00:00.000Z",
    categories: [{ id: "livapon", name: "LIVAPON" }],
    eyecatch: livaponOpenImage,
    author: tanaka,
    contentHtml: `
      <p>日本各地に受け継がれてきた伝統文化や職人の技術を世界へ届ける新たなプロジェクト「LIVAPON」をリリースしました。</p>
      <p>LIVAPONは、日本の職人が手がける本物の商品を厳選し、その背景にある歴史や文化、作り手の哲学とともに紹介・販売するECサイトです。</p>
      <h2>取り組みの背景</h2>
      <p>日本には、長い年月をかけて磨かれてきた技術や、地域ごとに受け継がれてきた文化が数多く存在します。一方で、職人の高齢化や後継者不足、認知機会の減少などにより、その価値や歴史が次の世代へ十分に継承されていないという課題もあります。</p>
      <p>LIVAPONでは、単に商品を販売するのではなく、職人の技術、考え方、作品が生まれた土地の歴史まで含めて世界へ伝えることを目指します。</p>
      <h2>現地での取材を重ねて</h2>
      <p>構想以来、実際に日本各地へ足を運び、商品を見て、触れ、職人との対話を重ねてきました。その中で、日本の職人が持つ繊細な技術力や品質へのこだわりは、世界に誇ることのできる価値であると実感しています。</p>
      <h2>今後の展開</h2>
      <p>今後は商品の販売に加え、日本の職人から直接技術を学び、その技や考え方を体得できる新たなサービスも発表予定です。</p>
      <p>LIVAPONは、日本の文化を商品として消費するのではなく、その背景にある歴史や技術とともに未来へつなぐ存在を目指してまいります。</p>
      <p><a href="https://livapon.com/" target="_blank" rel="noopener noreferrer">LIVAPON公式サイトはこちら</a></p>
    `
  }),
  article({
    id: "biteki-2026-06-koso-life",
    slug: "biteki-2026-06-koso-life",
    title:
      "美容誌『美的スペシャル6月号増刊』にて「KOSOLIFE」の長岡式酵素玄米をご紹介いただきました",
    description:
      "株式会社小学館発行の美容誌『美的スペシャル6月号増刊』にて、弊社が運営する「KOSOLIFE」をタレントの指原莉乃様の美容習慣としてご紹介いただきました。",
    publishedAt: "2026-04-28T00:00:00.000Z",
    categories: [
      { id: "media-coverage", name: "メディア掲載" },
      { id: "koso-life", name: "KOSOLIFE" }
    ],
    eyecatch: bitekiCoverImage,
    author: tanaka,
    contentHtml: `
      <p>このたび、株式会社小学館より発行されている美容誌『美的スペシャル6月号増刊』にて、弊社が運営する「KOSOLIFE」をご紹介いただきましたので、お知らせいたします。</p>
      <h2>掲載概要</h2>
      <p>タレントの指原莉乃様が日頃の美容習慣のひとつとして、「KOSOLIFE」の長岡式酵素玄米を1年以上にわたり継続的にご愛用いただいていることを、誌面の特集にてご紹介いただきました。</p>
      <p>平素より弊社商品をご愛顧くださっている指原様、ならびに掲載の機会をいただきました『美的』編集部の皆さまに、心より御礼申し上げます。</p>
      <h2>弊社の今後の取り組み</h2>
      <p>株式会社CHAIRMANは、伝統的な長岡式酵素玄米の製法を守りながら、現代のライフスタイルに寄り添う食品ブランドとして「KOSOLIFE」を展開しております。今回のメディア掲載を励みに、より多くの方に本物の食を届けるべく、引き続き商品開発・品質向上に努めてまいります。</p>
      <h2>掲載誌情報</h2>
      <ul>
        <li>誌名：美的スペシャル6月号増刊</li>
        <li>発行：株式会社小学館</li>
        <li>発売日：2026年4月22日（水）</li>
        <li>表紙：SANA（TWICE）様</li>
      </ul>
      <p><small>※ 表紙画像は出版元より許諾を得て掲載しております。誌面の内容については本記事に転載しておりません。詳細は誌面をご覧ください。</small></p>
    `
  }),
  article({
    id: "japan-expo-canada-partnership",
    slug: "japan-expo-canada-partnership",
    title:
      "Japan Expo Canada Inc.との戦略的パートナーシップ契約を締結。",
    description:
      "CHAIRMANは、Japan Festival CANADAを主催するJapan Expo Canada Inc.との戦略的パートナーシップ契約を締結しました。",
    publishedAt: "2026-03-11T00:00:00.000Z",
    categories: [
      { id: "partnership", name: "パートナーシップ" },
      { id: "overseas-expansion", name: "海外展開" },
      { id: "livapon", name: "LIVAPON" }
    ],
    eyecatch: jfcStageImage,
    author: tanaka,
    contentHtml: `
      <p>CHAIRMANは、カナダ・トロントにて開催される日本文化の総合博覧会「Japan Festival CANADA（ジャパンフェスティバルカナダ）」を主催するJapan Expo Canada Inc.との間で、戦略的パートナーシップ契約を締結したことをお知らせいたします。</p>
      <h2>パートナーシップ締結の背景と目的</h2>
      <p>当社が推進する地方創生・工芸支援プロジェクト「LIVAPON」は、日本の優れた伝統工芸品や観光資源を世界へ届けるプラットフォームを目指しています。</p>
      <p>この度、北米市場へのゲートウェイとして、トロントを拠点に多大な影響力を持つJapan Expo Canada Inc.と提携いたしました。</p>
      <p>本提携により、Japan Expo Canada Inc.が持つネットワークを通じて、LIVAPONが厳選した日本各地の逸品を北米の富裕層および日本文化ファンへ直接届ける「最短かつ強固な架け橋」が完成します。</p>
      <h2>Japan Festival CANADAについて</h2>
      <p>カナダ・トロントにて開催される、アニメ、食、伝統工芸、技術など多岐にわたる日本文化を網羅した最大級のイベントです。</p>
      <p>現地カナダ人だけでなく、北米全域から多くの日本文化愛好家が集まります。</p>
      <p><a href="https://www.japanfestivalcanada.com/" target="_blank" rel="noopener noreferrer">https://www.japanfestivalcanada.com/</a></p>
    `
  })
];
