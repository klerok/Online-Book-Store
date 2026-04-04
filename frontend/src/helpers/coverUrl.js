export function coverUrlFromDoc(doc) {
  return doc.cover_i
    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
    : null;
}
