import { coverUrlFromDoc } from "../helpers/coverUrl";

export async function searchBooks(query, limit = 10) {
  const response = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  if (!response.ok) return null;
  const data = await response.json()
  return data.docs.slice(0, limit)
}

export function mapDocToBook(doc) {
  return {
    id: doc.key,
    title: doc.title,
    author: doc.author_name?.[0] || "Unknown Author",
    coverSrc: coverUrlFromDoc(doc)
  }
}