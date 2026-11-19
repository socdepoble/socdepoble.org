/** Legacy date grammar only: pure UTF-16 cursors, no calendar validation or I/O. */
const lower = code => code >= 65 && code <= 90 ? code + 32 : code === 199 ? 231 : code;
const digit = code => code >= 48 && code <= 57;
const word = code => digit(code) || code >= 65 && code <= 90 || code >= 97 && code <= 122 || code === 95;
const white = code => code >= 9 && code <= 13 || code === 32 || code === 160 || code === 5760
  || code >= 8192 && code <= 8202 || code === 8232 || code === 8233 || code === 8239
  || code === 8287 || code === 12288 || code === 65279;

/** Exactly <[^>]*> -> space, then ECMAScript whitespace runs -> one ASCII space. */
export function normalizeDateText(text) {
  const out = [];
  let previousSpace = false;
  let noClosingAngle = false;
  for (let i = 0; i < text.length; i++) {
    let char = text[i];
    if (char === '<' && !noClosingAngle) {
      const close = text.indexOf('>', i + 1);
      if (close >= 0) { i = close; char = ' '; }
      else noClosingAngle = true;
    }
    if (white(char.charCodeAt(0))) {
      if (!previousSpace) out.push(' ');
      previousSpace = true;
    } else {
      out.push(char);
      previousSpace = false;
    }
  }
  return out.join('');
}

const months = Object.freeze({
  97: [['abril', 4], ['agost', 8]],
  100: [['desembre', 12]],
  102: [['febrer', 2]],
  103: [['gener', 1]],
  106: [['juny', 6], ['juliol', 7]],
  109: [['març', 3], ['marc', 3], ['maig', 5]],
  110: [['novembre', 11]],
  111: [['octubre', 10]],
  115: [['setembre', 9]]
});
const equalAt = (text, at, token) => {
  for (let j = 0; j < token.length; j++) if (lower(text.charCodeAt(at + j)) !== token.charCodeAt(j)) return false;
  return true;
};
const dayEnd = (text, at) => {
  if (!digit(text.charCodeAt(at)) || word(text.charCodeAt(at - 1))) return -1;
  let end = at + 1;
  if (digit(text.charCodeAt(end))) end++;
  return word(text.charCodeAt(end)) ? -1 : end;
};
const separatorEnd = (text, end) => {
  let at = end;
  if (text.charCodeAt(at) === 32) at++;
  const code = lower(text.charCodeAt(at));
  if (code === 44 || code === 45 || code === 8211 || code === 105 || code === 121) at++;
  else if (code === 97) at += lower(text.charCodeAt(at + 1)) === 108 ? 2 : 1;
  else return -1;
  if (text.charCodeAt(at) === 32) at++;
  return at;
};
function monthTail(text, at) {
  if (text.charCodeAt(at) === 32) at++;
  if (lower(text.charCodeAt(at)) === 100) {
    if (lower(text.charCodeAt(at + 1)) === 101 && text.charCodeAt(at + 2) === 32) at += 3;
    else if (text[at + 1] === "'" || text[at + 1] === '’') at += 2;
  }
  const choices = months[lower(text.charCodeAt(at))];
  if (!choices) return null;
  for (const [name, month] of choices) {
    if (!equalAt(text, at, name)) continue;
    let end = at + name.length;
    let yearAt = -1;
    if (text.charCodeAt(end) === 32) {
      let year = end + 1;
      if (lower(text.charCodeAt(year)) === 100 && lower(text.charCodeAt(year + 1)) === 101) {
        if (text.charCodeAt(year + 2) === 32) year += 3;
        else if (lower(text.charCodeAt(year + 2)) === 108 && text.charCodeAt(year + 3) === 32) year += 4;
      }
      if (text[year] === '2' && text[year + 1] === '0' && digit(text.charCodeAt(year + 2)) && digit(text.charCodeAt(year + 3))) {
        yearAt = year;
        end = year + 4;
      }
    }
    return { month, yearAt, end };
  }
  return null;
}

/**
 * Equivalent leftmost/greedy matches of the legacy day-list/month expression.
 * The normalized input has at most one ASCII space per whitespace run. A day
 * and optional separator have a unique next-day edge. Resolve that edge once,
 * right to left, so a failed list is never retried from each of its days.
 * Only successful, globally disjoint captures are walked to emit valid days;
 * this also preserves year coercions and non-overlapping match consumption.
 */
export function lastLetterDate(text, defaultYear) {
  const length = text.length;
  const ends = new Uint32Array(length + 1);
  const lastDays = new Uint32Array(length + 1);
  const monthNumbers = new Uint8Array(length + 1);
  const years = new Int32Array(length + 1);
  years.fill(-1);
  for (let at = length - 1; at >= 0; at--) {
    const end = dayEnd(text, at);
    if (end < 0) continue;
    const afterSeparator = separatorEnd(text, end);
    if (afterSeparator >= 0 && ends[afterSeparator]) {
      ends[at] = ends[afterSeparator];
      lastDays[at] = lastDays[afterSeparator];
      monthNumbers[at] = monthNumbers[afterSeparator];
      years[at] = years[afterSeparator];
      continue;
    }
    const tail = (afterSeparator >= 0 && monthTail(text, afterSeparator)) || monthTail(text, end);
    if (tail) {
      ends[at] = tail.end;
      lastDays[at] = at;
      monthNumbers[at] = tail.month;
      years[at] = tail.yearAt;
    }
  }
  let latest = null;
  for (let at = 0; at < length;) {
    if (!ends[at]) { at++; continue; }
    const year = years[at] < 0 ? defaultYear : text.slice(years[at], years[at] + 4);
    if (year) {
      const month = String(monthNumbers[at]).padStart(2, '0');
      let dayAt = at;
      for (;;) {
        const end = dayEnd(text, dayAt);
        const day = Number(text.slice(dayAt, end));
        if (day >= 1 && day <= 31) {
          const date = `${year}-${month}-${String(day).padStart(2, '0')}`;
          if (latest === null || date > latest) latest = date;
        }
        if (dayAt === lastDays[at]) break;
        dayAt = separatorEnd(text, end);
      }
    }
    at = ends[at];
  }
  return latest;
}
