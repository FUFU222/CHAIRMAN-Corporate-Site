import type { ImageMetadata } from "astro";
import jfcHeaderImage from "../assets/images/JFC_CH.webp";
import jfcStageImage from "../assets/images/JFC_stage_image.webp";
import type { NewsArticle } from "./types";

interface StaticArticleImage {
  image: ImageMetadata;
  alt: string;
}

interface ArticleEnhancement {
  heroImage?: StaticArticleImage;
  inlineImage?: StaticArticleImage & { caption?: string };
  insertAfterHeading?: string;
}

interface ResolvedArticleImage {
  src: string;
  width: number;
  height: number;
  alt: string;
}

const articleEnhancements: Record<string, ArticleEnhancement> = {
  "japan-expo-canada-partnership": {
    heroImage: {
      image: jfcHeaderImage,
      alt: "Japan Festival CANADA と CHAIRMAN のロゴビジュアル"
    },
    insertAfterHeading: "Japan Festival CANADAについて",
    inlineImage: {
      image: jfcStageImage,
      alt: "Japan Festival CANADA のステージ全景",
      caption: "Japan Festival CANADA の会場ステージの様子"
    }
  }
};

function mapStaticImage(image: ImageMetadata, alt: string): ResolvedArticleImage {
  return {
    src: image.src,
    width: image.width,
    height: image.height,
    alt
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getArticleHeroImage(article: NewsArticle): ResolvedArticleImage | null {
  const overrideImage = articleEnhancements[article.slug]?.heroImage;
  if (overrideImage) {
    return mapStaticImage(overrideImage.image, overrideImage.alt);
  }

  if (!article.eyecatch) {
    return null;
  }

  if (typeof article.eyecatch === "string") {
    return {
      src: article.eyecatch,
      width: 1600,
      height: 900,
      alt: article.title
    };
  }

  return mapStaticImage(article.eyecatch, article.title);
}

export function getEnhancedArticleContentHtml(article: NewsArticle) {
  const enhancement = articleEnhancements[article.slug];
  if (!enhancement?.inlineImage || !enhancement.insertAfterHeading) {
    return article.contentHtml;
  }

  const headingPattern = new RegExp(
    `(<h2>\\s*${escapeRegExp(enhancement.insertAfterHeading)}\\s*<\\/h2>)`
  );

  if (!headingPattern.test(article.contentHtml)) {
    return article.contentHtml;
  }

  const figureHtml = [
    '<figure class="rich-text__figure">',
    `<img src="${enhancement.inlineImage.image.src}" alt="${escapeHtml(
      enhancement.inlineImage.alt
    )}" width="${enhancement.inlineImage.image.width}" height="${
      enhancement.inlineImage.image.height
    }" loading="lazy" decoding="async" />`,
    enhancement.inlineImage.caption
      ? `<figcaption>${escapeHtml(enhancement.inlineImage.caption)}</figcaption>`
      : "",
    "</figure>"
  ].join("");

  return article.contentHtml.replace(headingPattern, `$1${figureHtml}`);
}
