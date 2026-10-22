/**
 * emoticonesXat.js — les emoticones del compositor del xat, sense React
 * (pla 261022_1425: «Emojis grans i paritat WhatsApp»).
 *
 *   · inserixAlCursor: el text que queda en triar una emoticona, com a
 *     WhatsApp: on era el cursor (o en lloc del tros seleccionat) i el cursor
 *     just darrere de l'emoticona. Comptat en unitats UTF-16, com
 *     selectionStart: 🍅 en són dues.
 *   · EMOTICONES_DEL_POBLE: la primera pestanya del selector, la tria rural
 *     del pla (cares, gestos i cors, horta, animals i natura, poble i festes).
 *     Cada emoticona és la mateixa entrada del catàleg Emojis XL
 *     ([codi, glif, nom oficial en anglès]: el nom accessible de la graella
 *     universal) i la prova ho comprova: res no se n'aparta. Totes són
 *     d'Emoji 12.0 o anteriors: emojiSol mira les dades d'Unicode del motor,
 *     no la font, i Windows 10 (Segoe UI Emoji) i els Android fins al 10 no
 *     pinten les d'Emoji 13 (l'oliva, el pebrot, el poal, l'acordió): eixes
 *     queden a les famílies del catàleg.
 *   · Recents: les últimes triades, primer la més nova. Com els esborranys
 *     (esborranys.js), només en memòria: no toquen cap emmagatzematge
 *     persistent, recarregar les oblida i XatContext les buida quan canvia la
 *     persona (una tauleta compartida no diu què ha triat l'anterior).
 */

/** Quantes recents es recorden: tres files de la graella gran. */
export const MAXIM_RECENTS = 18;

/**
 * El text amb `glif` inserit entre `inici` i `fi` (el tros seleccionat se'n
 * va) i la posició del cursor darrere. Sense posició vàlida, al final. Torna
 * null si el resultat passaria de `limit` (el maxLength del textarea no
 * frena els canvis fets pel codi).
 */
export function inserixAlCursor(valor, glif, inici, fi, limit = Infinity) {
  const text = String(valor ?? '');
  const emoticona = String(glif ?? '');
  if (!emoticona) return null;
  const vora = (n) => (Number.isInteger(n) ? Math.min(Math.max(n, 0), text.length) : text.length);
  const desde = vora(inici);
  const fins = Math.max(desde, vora(Number.isInteger(fi) ? fi : inici));
  const nou = text.slice(0, desde) + emoticona + text.slice(fins);
  if (nou.length > limit) return null;
  return { valor: nou, cursor: desde + emoticona.length };
}

export const EMOTICONES_DEL_POBLE = Object.freeze([
  Object.freeze({
    id: 'cares',
    nom: 'Cares i emocions',
    emojis: Object.freeze([
      ['1F60A', '😊', 'smiling face with smiling eyes'],
      ['1F602', '😂', 'face with tears of joy'],
      ['1F970', '🥰', 'smiling face with hearts'],
      ['1F60D', '😍', 'smiling face with heart-eyes'],
      ['1F618', '😘', 'face blowing a kiss'],
      ['1F609', '😉', 'winking face'],
      ['1F642', '🙂', 'slightly smiling face'],
      ['1F62E', '😮', 'face with open mouth'],
      ['1F622', '😢', 'crying face'],
      ['1F62D', '😭', 'loudly crying face'],
      ['1F621', '😡', 'enraged face'],
      ['1F914', '🤔', 'thinking face'],
      ['1F634', '😴', 'sleeping face'],
      ['1F973', '🥳', 'partying face'],
      ['1F607', '😇', 'smiling face with halo'],
      ['1F917', '🤗', 'smiling face with open hands'],
      ['1F605', '😅', 'grinning face with sweat'],
      ['1F643', '🙃', 'upside-down face']
    ])
  }),
  Object.freeze({
    id: 'gestos',
    nom: 'Gestos i cors',
    emojis: Object.freeze([
      ['1F44D', '👍', 'thumbs up'],
      ['1F44F', '👏', 'clapping hands'],
      ['1F64F', '🙏', 'folded hands'],
      ['1F44B', '👋', 'waving hand'],
      ['1F91D', '🤝', 'handshake'],
      ['1F4AA', '💪', 'flexed biceps'],
      ['270C FE0F', '✌️', 'victory hand'],
      ['1F44C', '👌', 'OK hand'],
      ['2764 FE0F', '❤️', 'red heart'],
      ['1F9E1', '🧡', 'orange heart'],
      ['1F49B', '💛', 'yellow heart'],
      ['1F49A', '💚', 'green heart'],
      ['1F499', '💙', 'blue heart'],
      ['1F49C', '💜', 'purple heart'],
      ['1F4AF', '💯', 'hundred points'],
      ['2705', '✅', 'check mark button'],
      ['1F440', '👀', 'eyes']
    ])
  }),
  Object.freeze({
    id: 'horta',
    nom: 'Horta, camp i menjar',
    emojis: Object.freeze([
      ['1F345', '🍅', 'tomato'],
      ['1F34A', '🍊', 'tangerine'],
      ['1F34B', '🍋', 'lemon'],
      ['1F351', '🍑', 'peach'],
      ['1F347', '🍇', 'grapes'],
      ['1F352', '🍒', 'cherries'],
      ['1F349', '🍉', 'watermelon'],
      ['1F34E', '🍎', 'red apple'],
      ['1F954', '🥔', 'potato'],
      ['1F9C5', '🧅', 'onion'],
      ['1F9C4', '🧄', 'garlic'],
      ['1F33D', '🌽', 'ear of corn'],
      ['1F955', '🥕', 'carrot'],
      ['1F346', '🍆', 'eggplant'],
      ['1F96C', '🥬', 'leafy green'],
      ['1F35E', '🍞', 'bread'],
      ['1F956', '🥖', 'baguette bread'],
      ['1F9C0', '🧀', 'cheese wedge'],
      ['1F95A', '🥚', 'egg'],
      ['1F36F', '🍯', 'honey pot'],
      ['1F330', '🌰', 'chestnut'],
      ['1F377', '🍷', 'wine glass']
    ])
  }),
  Object.freeze({
    id: 'natura',
    nom: 'Animals i natura',
    emojis: Object.freeze([
      ['1F436', '🐶', 'dog face'],
      ['1F431', '🐱', 'cat face'],
      ['1F413', '🐓', 'rooster'],
      ['1F414', '🐔', 'chicken'],
      ['1F423', '🐣', 'hatching chick'],
      ['1F410', '🐐', 'goat'],
      ['1F411', '🐑', 'ewe'],
      ['1F404', '🐄', 'cow'],
      ['1F416', '🐖', 'pig'],
      ['1F434', '🐴', 'horse face'],
      ['1F407', '🐇', 'rabbit'],
      ['1F41D', '🐝', 'honeybee'],
      ['1F98B', '🦋', 'butterfly'],
      ['1F426', '🐦', 'bird'],
      ['1F989', '🦉', 'owl'],
      ['1F417', '🐗', 'boar'],
      ['1F333', '🌳', 'deciduous tree'],
      ['1F332', '🌲', 'evergreen tree'],
      ['1F33F', '🌿', 'herb'],
      ['1F33E', '🌾', 'sheaf of rice'],
      ['1F33B', '🌻', 'sunflower'],
      ['1F338', '🌸', 'cherry blossom'],
      ['2600 FE0F', '☀️', 'sun'],
      ['1F327 FE0F', '🌧️', 'cloud with rain'],
      ['26C8 FE0F', '⛈️', 'cloud with lightning and rain'],
      ['2744 FE0F', '❄️', 'snowflake'],
      ['1F308', '🌈', 'rainbow'],
      ['1F319', '🌙', 'crescent moon'],
      ['1F4A7', '💧', 'droplet'],
      ['1F525', '🔥', 'fire']
    ])
  }),
  Object.freeze({
    id: 'festes',
    nom: 'Poble, eines i festes',
    emojis: Object.freeze([
      ['1F514', '🔔', 'bell'],
      ['1F69C', '🚜', 'tractor'],
      ['1F511', '🔑', 'key'],
      ['26EA', '⛪', 'church'],
      ['1F3E1', '🏡', 'house with garden'],
      ['1F3D8 FE0F', '🏘️', 'houses'],
      ['26F2', '⛲', 'fountain'],
      ['1F9FA', '🧺', 'basket'],
      ['1FA93', '🪓', 'axe'],
      ['26CF FE0F', '⛏️', 'pick'],
      ['1F528', '🔨', 'hammer'],
      ['1F9F9', '🧹', 'broom'],
      ['1F6B2', '🚲', 'bicycle'],
      ['1F4FB', '📻', 'radio'],
      ['1F4DE', '📞', 'telephone receiver'],
      ['1F3B8', '🎸', 'guitar'],
      ['1F3BA', '🎺', 'trumpet'],
      ['1F941', '🥁', 'drum'],
      ['1F3B6', '🎶', 'musical notes'],
      ['1F483', '💃', 'woman dancing'],
      ['1F57A', '🕺', 'man dancing'],
      ['1F389', '🎉', 'party popper'],
      ['1F38A', '🎊', 'confetti ball'],
      ['1F386', '🎆', 'fireworks'],
      ['1F382', '🎂', 'birthday cake'],
      ['1F381', '🎁', 'wrapped gift'],
      ['26BD', '⚽', 'soccer ball'],
      ['1F3B2', '🎲', 'game die']
    ])
  })
]);

let recents = Object.freeze([]);

/** Les recents ([codi, glif, nom], primer la més nova). */
export function llegixRecents() {
  return recents;
}

/** El codi d'un glif amb la forma del catàleg: «2764 FE0F» per a ❤️. */
export function codiDe(glif) {
  return Array.from(String(glif ?? ''), (c) => c.codePointAt(0).toString(16).toUpperCase()).join(' ');
}

/** Recorda la triada (el que dona la graella: glif i nom) com la més nova; una repetida puja davant. */
export function recordaRecent(glif, nom) {
  if (typeof glif !== 'string' || !glif) return recents;
  recents = Object.freeze([
    Object.freeze([codiDe(glif), glif, typeof nom === 'string' && nom ? nom : glif]),
    ...recents.filter(([, altre]) => altre !== glif)
  ].slice(0, MAXIM_RECENTS));
  return recents;
}

/** Oblida les recents (XatContext, quan canvia la persona; i les proves). */
export function buidaRecents() {
  recents = Object.freeze([]);
}
