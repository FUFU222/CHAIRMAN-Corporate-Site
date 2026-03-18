import ceoImage from "../assets/images/CEO-image.webp";
import jfcStageImage from "../assets/images/JFC_stage_image.webp";
import type { NewsArticle } from "../lib/types";
import { buildExcerpt } from "../lib/format";

const tanaka = {
  title: "代表取締役",
  name: "田中 透",
  bio: "地域事業者と市場の間にある情報の非対称をなくし、価値が届く導線を設計しています。",
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
    id: "japan-expo-canada-partnership",
    slug: "japan-expo-canada-partnership",
    title:
      "【北米展開を加速】CHAIRMAN、Japan Expo Canada Inc.との戦略的パートナーシップ契約を締結。日本工芸・文化の北米市場独占供給ルートを構築",
    description:
      "CHAIRMANは、Japan Festival CANADAを主催するJapan Expo Canada Inc.との戦略的パートナーシップ契約を締結しました。",
    publishedAt: "2026-03-11T00:00:00.000Z",
    categories: [
      { id: "partnership", name: "パートナーシップ" },
      { id: "livapon", name: "LIVAPON" },
      { id: "north-america", name: "北米展開" }
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
