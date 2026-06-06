export function chunkText(
  text: string,
  chunkSize = 350,
  overlap = 50
): string[] {
  const words = text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  const chunks: string[] = [];

  for (
    let start = 0;
    start < words.length;
    start += Math.max(1, chunkSize - overlap)
  ) {
    const chunk = words.slice(start, start + chunkSize).join(" ").trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (start + chunkSize >= words.length) {
      break;
    }
  }

  return chunks;
}
