export function withBase(pathname: string, base: string) {
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = pathname.replace(/^\//, "");

  if (!normalizedPath) {
    return normalizedBase;
  }

  return `${normalizedBase}${normalizedPath}`.replace(/\/{2,}/g, "/");
}
