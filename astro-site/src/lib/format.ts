export function formatDateJP(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

export function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildExcerpt(value: string, length = 84) {
  const plain = stripHtml(value);
  if (plain.length <= length) {
    return plain;
  }
  return `${plain.slice(0, length).trim()}…`;
}

export function absoluteUrl(pathname: string, siteUrl: string) {
  return new URL(pathname, siteUrl).toString();
}
