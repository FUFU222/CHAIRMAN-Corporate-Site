import ceoImage from "../assets/images/CEO-image.webp";
import cooImage from "../assets/images/COO-image.webp";
import csoImage from "../assets/images/CSO-image.webp";
import travelImage from "../assets/images/teamMemberImage1.jpg";
import mrTokyoImage from "../assets/images/mr_tokyo_image.webp";
import marketerOne from "../assets/images/teamMemberImage2.jpg";
import marketerTwo from "../assets/images/teamMemberImage3.jpg";
import creatorOne from "../assets/images/teamMemberImage5.jpg";
import creatorTwo from "../assets/images/teamMemberImage6.jpg";
import creatorThree from "../assets/images/teamMemberImage7.jpg";
import creatorFour from "../assets/images/teamMemberImage8.jpg";
import type { MediaProfile, Officer, TeamMember } from "../lib/types";

export const officers: Officer[] = [
  {
    name: "田中 透",
    role: "代表取締役",
    image: ceoImage,
    summary: "地域や事業者の価値を、市場に届く事業へ整理し前進させます。",
    details: [
      "地方行政での実務経験を土台に、地域や事業者の価値を市場へ届けるプロジェクトを推進。",
      "発信設計、ブランド整理、販路づくりまでを横断し、KOSOLIFEのリブランディングも主導しています。"
    ]
  },
  {
    name: "若狭 輝行",
    role: "COO",
    roleDetail: "最高執行責任者",
    image: cooImage,
    summary: "海外との接点づくりとプロジェクト運営を担います。",
    details: [
      "オーストラリア、カナダで経済・ビジネス・経営学を学び、国際的な事業環境でキャリアを積んできました。",
      "文化イベントや国際連携の実務に強く、海外との接点づくりと運営の要を担っています。"
    ]
  },
  {
    name: "三倉 信人",
    role: "CSO",
    roleDetail: "最高戦略責任者",
    image: csoImage,
    summary: "地域価値の事業化に向けた戦略設計を担います。",
    details: [
      "ソフトバンクグループで営業、社長室、新規事業開発を経験後に独立。",
      "大企業から地方企業、官公庁まで横断して、事業戦略と組織づくりを支援しています。"
    ],
    noteUrl: "https://note.com/n_mikura"
  }
];

export const mediaProfiles: MediaProfile[] = [
  {
    name: "旅んちゅLife",
    role: "インフルエンサー",
    image: travelImage,
    href: "https://www.instagram.com/travel_lifeman/"
  },
  {
    name: "Mr.Tokyo",
    role: "インフルエンサー",
    image: mrTokyoImage,
    href: "https://www.instagram.com/mr.tokyo.adventures/"
  }
];

export const projectTeam: TeamMember[] = [
  { name: "本間 大嗣", role: "SNSマーケター", image: marketerOne },
  { name: "田中 彰", role: "SNSマーケター", image: marketerTwo },
  { name: "石井 克樹", role: "映像クリエイター", image: creatorOne },
  { name: "金 優樹", role: "映像クリエイター", image: creatorTwo },
  { name: "杉本 雅", role: "映像クリエイター", image: creatorThree },
  { name: "藤元 翼", role: "映像クリエイター", image: creatorFour }
];
