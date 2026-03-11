import ceoImage from "../assets/images/CEO-image.webp";
import csoImage from "../assets/images/CSO-image.webp";
import livaponCard from "../assets/images/service_livapon_card.webp";
import snsCard from "../assets/images/service_sns_card.webp";
import kosolifeCard from "../assets/images/service_kosolife.webp";
import type { NewsArticle } from "../lib/types";
import { buildExcerpt } from "../lib/format";

const tanaka = {
  title: "代表取締役",
  name: "田中 透",
  bio: "地域事業者と市場の間にある情報の非対称をなくし、価値が届く導線を設計しています。",
  image: ceoImage
};

const mikura = {
  title: "CSO",
  name: "三倉 信人",
  bio: "官公庁から民間企業まで横断し、地域価値の事業化に向けた戦略設計を担っています。",
  image: csoImage
};

function article(
  partial: Omit<NewsArticle, "excerpt">
): NewsArticle {
  return {
    ...partial,
    excerpt: buildExcerpt(partial.description || partial.contentHtml, 70)
  };
}

export const mockNews: NewsArticle[] = [
  article({
    id: "japan-festival-canada-2026",
    slug: "japan-festival-canada-2026",
    title: "Japan Festival CANADA 2026 公式スポンサー参画予定のお知らせ",
    description:
      "CHAIRMANは、2026年8月14日から16日に開催予定の Japan Festival CANADA 2026 に公式スポンサーとして参画予定です。",
    publishedAt: "2026-03-05T09:00:00.000Z",
    categories: [
      { id: "global", name: "海外連携" },
      { id: "regional", name: "地域連携" }
    ],
    eyecatch: livaponCard,
    author: tanaka,
    contentHtml: `
      <p>株式会社CHAIRMANは、2026年8月14日から16日に開催予定の Japan Festival CANADA 2026 に、公式スポンサーとして参画予定です。</p>
      <p>日本の文化・技・商品価値を海外市場へ接続する実践のひとつとして、現地での接点づくりと発信設計を進めています。</p>
      <p>自治体、地域事業者、ブランドと連携しながら、作り手の背景まで伝わる国際発信のあり方をかたちにしていきます。</p>
    `
  }),
  article({
    id: "livapon-market-access",
    slug: "livapon-market-access",
    title: "LIVAPONを軸に、地域産品を市場へつなぐ導線設計を強化",
    description:
      "越境EC事業 LIVAPON を中心に、地域産品の魅力が国内外で伝わる販売導線の整備を進めています。",
    publishedAt: "2026-02-18T09:00:00.000Z",
    categories: [
      { id: "livapon", name: "LIVAPON" },
      { id: "cross-border", name: "越境EC" }
    ],
    eyecatch: livaponCard,
    author: mikura,
    contentHtml: `
      <p>CHAIRMANは、LIVAPONを軸に、地域産品や工芸品が国内外の市場で継続的に売れる状態をつくるための導線設計を強化しています。</p>
      <p>単発の露出ではなく、ブランド整理、販売ページ、配信企画、運用体制までを一体で整えることにより、価値の伝達精度を高めています。</p>
    `
  }),
  article({
    id: "sns-film-support",
    slug: "sns-film-support",
    title: "SNS運用と映像制作の支援体制を再編し、事業文脈の伝達力を強化",
    description:
      "発信だけではなく、何をどう伝えるかの設計まで踏み込む支援体制へ整理しました。",
    publishedAt: "2026-01-28T09:00:00.000Z",
    categories: [
      { id: "sns", name: "SNS運用" },
      { id: "movie", name: "映像制作" }
    ],
    eyecatch: snsCard,
    author: tanaka,
    contentHtml: `
      <p>支援実績140件以上で得た知見をもとに、SNS運用と映像制作の支援体制を再編しました。</p>
      <p>認知獲得だけではなく、自治体や地域事業者の文脈が正しく伝わる表現設計と、運用が続く仕組みづくりに重心を置いています。</p>
    `
  }),
  article({
    id: "kosolife-brand-update",
    slug: "kosolife-brand-update",
    title: "KOSOLIFEのブランド運営知見を、他事業の改善にも還元",
    description:
      "自社ブランド運営で得た販売、発信、改善の知見を、クライアント支援にも活かしています。",
    publishedAt: "2026-01-12T09:00:00.000Z",
    categories: [
      { id: "brand", name: "自社ブランド" },
      { id: "wellness", name: "健康食品" }
    ],
    eyecatch: kosolifeCard,
    author: tanaka,
    contentHtml: `
      <p>KOSOLIFEは、CHAIRMANにとって自社で検証を重ねる実証事業でもあります。</p>
      <p>商品設計、販売導線、SNS運用、顧客接点の改善を自ら行うことで、机上ではない運用知見を蓄積しています。</p>
    `
  }),
  article({
    id: "regional-demand-design",
    slug: "regional-demand-design",
    title: "地域価値を市場へつなぐための需要設計フレームを公開",
    description:
      "Public / Regional、Demand Design、Global Connection の3つの観点で、地域連携の支援設計を整理しました。",
    publishedAt: "2025-12-18T09:00:00.000Z",
    categories: [
      { id: "regional", name: "地域連携" },
      { id: "strategy", name: "戦略設計" }
    ],
    eyecatch: livaponCard,
    author: mikura,
    contentHtml: `
      <p>価値があるのに届かない。その状態を解消するために、CHAIRMANでは需要設計のフレームを整理しています。</p>
      <p>自治体、地域事業者、民間企業が同じ方向を向いて進めるよう、役割と成果地点を明確にした支援を行います。</p>
    `
  }),
  article({
    id: "media-network-growth",
    slug: "media-network-growth",
    title: "国内共感と海外認知を支えるメディアネットワークを拡充",
    description:
      "旅んちゅLife、Mr.Tokyo などのネットワークを通じ、内需外需の両面に対応する発信基盤を整えています。",
    publishedAt: "2025-11-06T09:00:00.000Z",
    categories: [
      { id: "media", name: "メディア" },
      { id: "sns", name: "SNS運用" }
    ],
    eyecatch: snsCard,
    author: mikura,
    contentHtml: `
      <p>国内の共感形成と海外への認知拡張を両立するため、メディアネットワークの整理と連携体制の拡充を進めています。</p>
      <p>単なる露出拡大ではなく、事業目的と整合した発信の設計を重視しています。</p>
    `
  })
];
