import { buildExcerpt } from "./format";
import type { NewsArticle, NewsCategory } from "./types";

const serviceDomain = import.meta.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = import.meta.env.MICROCMS_API_KEY;
const endpoint = import.meta.env.MICROCMS_ENDPOINT || "blog";
const processEnv =
  typeof globalThis === "object" && "process" in globalThis
    ? (globalThis as typeof globalThis & {
        process?: { env?: Record<string, string | undefined> };
      }).process?.env ?? {}
    : {};
const isStrictMicrocmsBuild =
  processEnv.CI === "true" || processEnv.MICROCMS_STRICT === "true";
const microcmsFixturePath = processEnv.MICROCMS_FIXTURE_PATH;

function sanitizeContentId(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

function sanitizeRichText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+="[^"]*"/gi, "")
    .replace(/\son[a-z]+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function normalizeCategories(input: unknown): NewsCategory[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((value): value is Record<string, unknown> => Boolean(value) && typeof value === "object")
    .map((value) => ({
      id: String(value.id ?? ""),
      name: String(value.name ?? "")
    }))
    .filter((value) => value.id && value.name);
}

function mapArticle(item: Record<string, unknown>): NewsArticle {
  const author = typeof item.author === "object" && item.author ? (item.author as Record<string, unknown>) : {};
  const contentHtml = sanitizeRichText(String(item.content ?? ""));
  const slug = sanitizeContentId(String(item.slug ?? item.id ?? ""));

  return {
    id: String(item.id ?? slug),
    slug,
    title: String(item.title ?? ""),
    description: String(item.description ?? ""),
    excerpt: buildExcerpt(String(item.description ?? contentHtml), 72),
    publishedAt: String(item.publishedAt ?? ""),
    categories: normalizeCategories(item.category ?? []),
    eyecatch:
      typeof item.eyecatch === "object" && item.eyecatch
        ? String((item.eyecatch as Record<string, unknown>).url ?? "")
        : null,
    contentHtml,
    author: {
      title: String(author["author-title"] ?? ""),
      name: String(author["author-name"] ?? ""),
      bio: String(author["author-bio"] ?? ""),
      image:
        typeof author["author-image"] === "object" && author["author-image"]
          ? String(((author["author-image"] as Record<string, unknown>).url as string) ?? "")
          : null
    }
  };
}

async function fetchMicrocmsArticles() {
  if (microcmsFixturePath) {
    const { readFile } = await import("node:fs/promises");
    const raw = await readFile(microcmsFixturePath, "utf8");
    const data = JSON.parse(raw) as { contents?: Record<string, unknown>[] };
    return (data.contents ?? []).map(mapArticle).filter((article) => article.slug);
  }

  if (!serviceDomain || !apiKey) {
    if (isStrictMicrocmsBuild) {
      throw new Error("microCMS credentials are required for this build");
    }
    return null;
  }

  const url = new URL(`https://${serviceDomain}.microcms.io/api/v1/${endpoint}`);
  url.searchParams.set("limit", "100");
  url.searchParams.set("orders", "-publishedAt");
  url.searchParams.set("depth", "2");

  const response = await fetch(url, {
    headers: {
      "X-MICROCMS-API-KEY": apiKey,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`microCMS request failed: ${response.status}`);
  }

  const data = (await response.json()) as { contents?: Record<string, unknown>[] };
  return (data.contents ?? []).map(mapArticle).filter((article) => article.slug);
}

export async function getMicrocmsArticles() {
  try {
    const articles = await fetchMicrocmsArticles();
    return articles ?? [];
  } catch (error) {
    if (isStrictMicrocmsBuild) {
      throw error;
    }
    console.warn("[microcms] failed to fetch articles", error);
  }

  return [];
}
