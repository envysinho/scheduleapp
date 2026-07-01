export function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function matchesSearchQuery(label, query) {
  const normalizedLabel = normalizeSearchText(label);
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return false;
  }

  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
  return queryWords.every((word) => normalizedLabel.includes(word));
}

export function filterSearchItems(items, query) {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }
  return items.filter((item) => matchesSearchQuery(item.label, trimmed));
}
