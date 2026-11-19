/** Legacy section grammar and original-source intervals. No I/O or root discovery. */
const whitespace = char => char !== undefined && /\s/.test(char);
const lineBreak = char => char === '\n' || char === '\r' || char === '\u2028' || char === '\u2029';

export function documentSectionRanges(clean) {
  const length = clean.length, prefixes = [];
  const nextBreak = new Int32Array(length + 1);
  nextBreak[length] = length;
  for (let i = length - 1; i >= 0; i--) nextBreak[i] = lineBreak(clean[i]) ? i : nextBreak[i + 1];
  for (let i = 0; i < length; i++) {
    if ((i === 0 || lineBreak(clean[i - 1])) && clean[i] === '#' && clean[i + 1] === '#' && whitespace(clean[i + 2])) prefixes.push(i);
  }
  const ranges = [];
  for (let k = 0; k < prefixes.length;) {
    const start = prefixes[k], first = start + 2;
    let title = first;
    while (title < length && whitespace(clean[title])) title++;
    let end = nextBreak[title];
    let after = end < length && clean[end] === '\n' ? end + 1
      : clean[end] === '\r' && clean[end + 1] === '\n' ? end + 2 : -1;
    if (title === length || after < 0) {
      // Greedy \s+ may retreat to the last whitespace-only title line.
      after = -1;
      for (let i = title - 1; i > first; i--) {
        if (lineBreak(clean[i])) continue;
        if (clean[i + 1] === '\n') {title = i; end = i + 1; after = i + 2; break;}
        if (clean[i + 1] === '\r' && clean[i + 2] === '\n') {title = i; end = i + 1; after = i + 3; break;}
      }
    }
    if (after < 0) {k++; continue;}
    let next = k + 1;
    while (next < prefixes.length && prefixes[next] < after) next++;
    const stop = next < prefixes.length ? prefixes[next] : length;
    ranges.push({name: clean.slice(title, end).trim(), start: after, end: stop});
    k = next;
  }
  return ranges;
}

export function stripTrailingSectionMarker(value) {
  const tail = value.trimEnd(), prefix = '<!-- SDP:SECTION ';
  if (!tail.endsWith(' -->')) return value;
  const start = tail.lastIndexOf(prefix);
  if (start < 0) return value;
  const tokenStart = start + prefix.length, tokenEnd = tail.length - 4;
  if (tokenStart >= tokenEnd) return value;
  for (let i = tokenStart; i < tokenEnd; i++) {
    const c = tail.charCodeAt(i);
    if (!(c >= 48 && c <= 57) && !(c >= 65 && c <= 90) && !(c >= 97 && c <= 122) && tail[i] !== '.' && tail[i] !== '_' && tail[i] !== '-') return value;
  }
  return value.slice(0, start).trimEnd();
}
