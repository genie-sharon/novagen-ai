export function sanitizeFilename(name: string): string {
  const simpleName = name.replace(/^.*[/\\]/, "");

  const lastDot = simpleName.lastIndexOf(".");
  let base: string;
  let ext: string;

  if (lastDot >= 0) {
    base = simpleName.slice(0, lastDot);
    ext = simpleName.slice(lastDot + 1);
  } else {
    base = simpleName;
    ext = "";
  }

  const safeBase = base
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "");

  const finalBase = safeBase || "file";
  const finalExt = safeExt ? `.${safeExt}` : "";

  return `${finalBase}${finalExt}`;
}
