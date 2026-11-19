/** Legacy inline Markdown grammar, indexed once without suffix retries. Pure ESM. */
const whitespace = char => char !== undefined && /\s/.test(char);

export function scanMarkdownDestination(raw) {
  const value = raw.trim();
  if (value[0] === '<') {
    const end = value.indexOf('>', 1);
    if (end > 1) return value.slice(1, end);
  }
  const last = value.length - 1, closing = value[last];
  let opening = -1;
  if (closing === '"' || closing === "'") {
    const candidate = value.lastIndexOf(closing, last - 1);
    if (candidate > 0 && whitespace(value[candidate - 1])) opening = candidate;
  } else if (closing === ')') {
    for (let i = last - 1; i >= 0 && value[i] !== ')'; i--) {
      if (value[i] === '(' && i > 0 && whitespace(value[i - 1])) opening = i;
    }
  }
  return opening < 0 ? value : value.slice(0, opening).trim();
}

export function scanInlineMarkdownLinks(text) {
  const length = text.length;
  if (!length || (typeof text === 'string' && !text.includes('['))) return [];
  // Each table means: the first unmatched closing delimiter from this offset
  // under the named initial state, or -1. All dependencies point rightward.
  const labels = new Int32Array(length + 2);
  const normal = new Int32Array(length + 2);
  const single = new Int32Array(length + 2);
  const double = new Int32Array(length + 2);
  const angle = new Int32Array(length + 2);
  for (const table of [labels, normal, single, double, angle]) table[length] = table[length + 1] = -1;
  for (let i = length - 1; i >= 0; i--) {
    const char = text[i];
    if (char === '\\') {
      labels[i] = labels[i + 2];
      normal[i] = normal[i + 2];
      single[i] = single[i + 2];
      double[i] = double[i + 2];
      angle[i] = angle[i + 2];
      continue;
    }
    if (char === ']') labels[i] = i;
    else if (char === '[') {
      const end = labels[i + 1];
      labels[i] = end < 0 ? -1 : labels[end + 1];
    } else labels[i] = labels[i + 1];

    single[i] = char === "'" ? normal[i + 1] : single[i + 1];
    double[i] = char === '"' ? normal[i + 1] : double[i + 1];
    angle[i] = char === '>' ? normal[i + 1] : angle[i + 1];
    if (char === ')') normal[i] = i;
    else if (char === '(') {
      const end = normal[i + 1];
      normal[i] = end < 0 ? -1 : normal[end + 1];
    } else if (char === '<') normal[i] = angle[i + 1];
    else if ((char === "'" || char === '"') && whitespace(text[i - 1])) normal[i] = char === "'" ? single[i + 1] : double[i + 1];
    else normal[i] = normal[i + 1];
  }
  const links = [];
  for (let i = 0; i < length; i++) {
    const embed = text[i] === '!' && text[i + 1] === '[';
    const bracket = embed ? i + 1 : i;
    if (text[bracket] !== '[' || text[bracket + 1] === '[') continue;
    const labelEnd = labels[bracket + 1];
    if (labelEnd < 0 || text[labelEnd + 1] !== '(') continue;
    const end = normal[labelEnd + 2];
    if (end < 0) continue;
    links.push({kind: 'markdown', raw: text.slice(i, end + 1), target: scanMarkdownDestination(text.slice(labelEnd + 2, end)), embed});
    i = end;
  }
  return links;
}
