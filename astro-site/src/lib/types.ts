import type { ImageMetadata } from "astro";

export type ArticleImage = ImageMetadata | string | null;

export interface NewsCategory {
  id: string;
  name: string;
}

export interface NewsAuthor {
  title: string;
  name: string;
  bio: string;
  image?: ArticleImage;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  publishedAt: string;
  categories: NewsCategory[];
  eyecatch: ArticleImage;
  contentHtml: string;
  author: NewsAuthor;
}

export interface Officer {
  name: string;
  role: string;
  roleDetail?: string;
  image: ImageMetadata;
  imageClass?: string;
  details: string[];
  noteUrl?: string;
  noteLabel?: string;
  noteStatus?: string;
}

export interface MediaProfile {
  name: string;
  role: string;
  image: ImageMetadata;
  href: string;
}

export interface TeamMember {
  name: string;
  role: string;
  image: ImageMetadata;
}
