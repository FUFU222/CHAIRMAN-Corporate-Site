import ceoImage from "../assets/images/CEO-image.webp";
import jfcStageImage from "../assets/images/JFC_stage_image.webp";
import bitekiCoverImage from "../assets/images/news/biteki-2026-06-koso-life/cover.jpg";
import livaponOpenImage from "../assets/images/news/livapon-online-store-launch/cover.svg";
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
    id: "livapon-online-store-launch",
    slug: "livapon-online-store-launch",
    title: "オンラインストア LIVAPONをオープンしました",
    description:
      "株式会社CHAIRMANは、日本各地で生まれたこだわりの商品を世界中のお客様へ届けるオンラインストア「LIVAPON」をオープンしました。",
    publishedAt: "2026-05-16T00:00:00.000Z",
    categories: [{ id: "livapon", name: "LIVAPON" }],
    eyecatch: livaponOpenImage,
    author: tanaka,
    contentHtml: `
      <p>株式会社CHAIRMANは、日本各地で生まれたこだわりの商品を世界中のお客様へ届けるオンラインストア「LIVAPON」をオープンしました。</p>
      <h2>取り扱いジャンル</h2>
      <p>LIVAPONでは、工芸品、陶磁器、食品、飲料、アパレル、生活雑貨、化粧品など、さまざまなジャンルの商品を取り扱ってまいります。</p>
      <h2>LIVAPONが目指すもの</h2>
      <p>当サイトでは、単に商品を販売するだけではなく、作り手の背景や、地域に根づく技術・文化も含めて紹介し、日本の商品が持つ魅力を海外へ届けることを目指しています。</p>
      <h2>今後の展開</h2>
      <p>今後は、商品ラインナップの拡充に加え、作り手のストーリーやブランドの背景を伝えるコンテンツも順次公開していく予定です。</p>
      <p>株式会社CHAIRMANでは、LIVAPONを通じて、日本の作り手と世界中のお客様をつなぐ取り組みを進めてまいります。</p>
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
