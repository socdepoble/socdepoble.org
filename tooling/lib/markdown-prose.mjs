/** Prosa documental compartida, amb offsets UTF-16 i salts de línia intactes.
 * Emmascara comentaris HTML, fences i spans de backticks; no interpreta ni resol
 * enllaços. Una fence curta o d'una altra família no tanca el bloc vigent.
 * preserveInlineCode conserva directives escrites com a spans quan el consumidor
 * ho demana; per defecte continuen emmascarades.
 * Sense imports: els consumidors documental/Olivera/SCC no formen cap cicle.
 */
export function markdownProse(text, { preserveInlineCode = false } = {}) {
  if (typeof preserveInlineCode !== 'boolean') throw new TypeError('preserveInlineCode must be boolean');
  const output = text.split('');
  const mask = (start, end) => {
    for (let i = start; i < end; i++) if (text[i] !== '\n' && text[i] !== '\r') output[i] = ' ';
  };
  const lines = [];
  let offset = 0;
  for (const raw of text.split(/(?<=\n)/)) {
    const body = raw.replace(/[\r\n]+$/, '');
    const mark = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(body);
    lines.push({ start: offset, end: offset + raw.length, body, mark });
    offset += raw.length;
  }
  // Els spans inline no travessen un nou bloc ni un paràgraf buit.
  let boundary = text.length;
  for (let i = lines.length - 1; i >= 0; i--) {
    lines[i].boundary = boundary;
    if (!lines[i].body.trim() || (lines[i].mark && (lines[i].mark[1][0] !== '`' || !lines[i].mark[2].includes('`')))) boundary = lines[i].start;
  }
  const ticks = new Map();
  for (const match of text.matchAll(/`+/g)) {
    const length = match[0].length;
    if (!ticks.has(length)) ticks.set(length, []);
    ticks.get(length).push(match.index);
  }
  const nextTick = (start, length) => {
    const positions = ticks.get(length) || [];
    let low = 0, high = positions.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (positions[middle] <= start) low = middle + 1; else high = middle;
    }
    return positions[low];
  };
  let fence = null, opaqueUntil = 0, opaqueKind = null;
  for (const line of lines) {
    if (fence) {
      mask(line.start, line.end);
      if (line.mark && line.mark[1][0] === fence[0] && line.mark[1].length >= fence.length && !line.mark[2].trim()) fence = null;
      continue;
    }
    const startsOpaque = opaqueUntil > line.start;
    if (!startsOpaque && line.mark && (line.mark[1][0] !== '`' || !line.mark[2].includes('`'))) {
      fence = line.mark[1]; mask(line.start, line.end); continue;
    }
    let i = line.start;
    while (i < line.end) {
      if (i < opaqueUntil) {
        const end = Math.min(line.end, opaqueUntil);
        if (opaqueKind !== 'inline' || !preserveInlineCode) mask(i, end);
        i = end;
        continue;
      }
      // L'escapament literal no inicia sintaxi de codi/comentari/enllaç.
      if (text[i] === '\\' && i + 1 < line.end && /[\\[\]`<]/.test(text[i + 1])) {
        if (text[i + 1] !== '\\') mask(i + 1, i + 2);
        i += 2; continue;
      }
      if (text.startsWith('<!--', i)) {
        const end = text.indexOf('-->', i + 4);
        opaqueUntil = end < 0 ? text.length : end + 3;
        opaqueKind = 'comment';
        continue;
      }
      if (text[i] === '`') {
        let end = i + 1;
        while (text[end] === '`') end++;
        const length = end - i, close = nextTick(i, length);
        if (close !== undefined && close < line.boundary) {
          opaqueUntil = close + length;
          opaqueKind = 'inline';
          continue;
        }
        i = end; continue;
      }
      i++;
    }
  }
  return output.join('');
}
