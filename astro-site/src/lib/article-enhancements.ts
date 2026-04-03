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
      alt: "CHAIRMAN と Japan Expo Canada Inc. のロゴを組み合わせたヘッダー画像"
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

function normalizeRichTextFigureClasses(html: string) {
  return html.replace(/<figure\b([^>]*)>/g, (match, rawAttributes = "") => {
    const classAttribute = rawAttributes.match(/\bclass=(["'])(.*?)\1/i);

    if (!classAttribute) {
      return `<figure class="rich-text__figure"${rawAttributes}>`;
    }

    const quote = classAttribute[1];
    const existingClasses = classAttribute[2]
      .split(/\s+/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (existingClasses.includes("rich-text__figure")) {
      return match;
    }

    const nextClasses = `rich-text__figure ${existingClasses.join(" ")}`;
    return `<figure${rawAttributes.replace(
      classAttribute[0],
      `class=${quote}${nextClasses}${quote}`
    )}>`;
  });
}

export function getArticleHeroImage(article: NewsArticle): ResolvedArticleImage | null {
  const enhancement = articleEnhancements[article.slug];
  if (enhancement?.heroImage) {
    return mapStaticImage(enhancement.heroImage.image, enhancement.heroImage.alt);
  }

  return getArticleListImage(article);
}

export function getArticleListImage(article: NewsArticle): ResolvedArticleImage | null {
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
    return normalizeRichTextFigureClasses(article.contentHtml);
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

  return normalizeRichTextFigureClasses(article.contentHtml.replace(headingPattern, `$1${figureHtml}`));
}
