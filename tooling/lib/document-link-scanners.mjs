/** Pure lexical scans. Each grammar keeps its own legacy closing rule. */

/** /\[\[([^\]]+)\]\]/g: a non-empty body ends at the first single `]`. */
export function* scanFlatWikiBodies(text) {
  let cursor = 0;
  while (cursor < text.length) {
    const start = text.indexOf('[[', cursor);
    if (start < 0) return;
    const close = text.indexOf(']', start + 2);
    if (close < 0) return;
    if (close > start + 2 && text[close + 1] === ']') {
      yield text.slice(start + 2, close);
      cursor = close + 2;
    } else {
      // Every opening before this first `]` has the same failing close.
      cursor = close + 1;
    }
  }
}

/** /\[[^\]]*\]\(([^)]+)\)/g: labels are flat and targets end at the first `)`. */
export function* scanFlatMarkdownDestinations(text) {
  let cursor = 0;
  while (cursor < text.length) {
    const start = text.indexOf('[', cursor);
    if (start < 0) return;
    const labelEnd = text.indexOf(']', start + 1);
    if (labelEnd < 0) return;
    if (text[labelEnd + 1] !== '(') {
      cursor = labelEnd + 1;
      continue;
    }
    const targetStart = labelEnd + 2;
    const close = text.indexOf(')', targetStart);
    if (close < 0) return;
    if (close > targetStart) yield text.slice(targetStart, close);
    cursor = close + 1;
  }
}

/** /(!?)\[\[(.*?)\]\]/gs: the first double close wins; empty/newline bodies stay. */
export function* scanDotallWikilinkSpans(text) {
  let cursor = 0;
  while (cursor < text.length) {
    const open = text.indexOf('[[', cursor);
    if (open < 0) return;
    const close = text.indexOf(']]', open + 2);
    if (close < 0) return;
    const start = open > cursor && text[open - 1] === '!' ? open - 1 : open;
    yield {raw: text.slice(start, close + 2), index: start};
    cursor = close + 2;
  }
}
