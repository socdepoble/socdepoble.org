/**
 * etiquetesMercat.js — sanejador lineal O(n) de text pla (sense HTML cru ni
 * risc de ReDoS) i formatador humà d'etiquetes/categories de pantalla per al
 * Mercat i el detall (Onada R21.9 · T2).
 *
 * Els slugs interns de filtratge (`item.category_slug`, `item.tag`, `item.id`)
 * no es muten mai a les dades: només es formata el text visible de la pastilla
 * o del resum de lectura.
 */

const ETIQUETES_PER_IDIOMA = Object.freeze({
  ca: Object.freeze({
    alimentacio: 'Alimentació',
    marxandatge: 'Marxandatge',
    roba: 'Roba',
    samarreta: 'Samarreta',
    'oli-verge-extra': 'Oli Verge Extra',
    'oli-verge': 'Oli Verge',
    'oli-sense-filtrar': 'Oli sense filtrar',
    'edicio-fundacional': 'Edició fundacional',
    'a-tornallom': 'A tornallom',
    artesania: 'Artesania',
    llibres: 'Llibres',
    musica: 'Música',
    begudes: 'Begudes',
    horta: 'Horta',
    forn: 'Forn',
    tecnologia: 'Tecnologia',
    ordinador: 'Ordinador'
  }),
  es: Object.freeze({
    alimentacio: 'Alimentación',
    marxandatge: 'Productos del proyecto',
    roba: 'Ropa',
    samarreta: 'Camiseta',
    'oli-verge-extra': 'Aceite Virgen Extra',
    'oli-verge': 'Aceite Virgen',
    'oli-sense-filtrar': 'Aceite sin filtrar',
    'edicio-fundacional': 'Edición fundacional',
    'a-tornallom': 'Trabajo en común',
    artesania: 'Artesanía',
    llibres: 'Libros',
    musica: 'Música',
    begudes: 'Bebidas',
    horta: 'Huerta',
    forn: 'Horno',
    tecnologia: 'Tecnología',
    ordinador: 'Ordenador'
  }),
  en: Object.freeze({
    alimentacio: 'Food',
    marxandatge: 'Project goods',
    roba: 'Apparel',
    samarreta: 'T-shirt',
    'oli-verge-extra': 'Extra Virgin Olive Oil',
    'oli-verge': 'Virgin Olive Oil',
    'oli-sense-filtrar': 'Unfiltered olive oil',
    'edicio-fundacional': 'Founding edition',
    'a-tornallom': 'Mutual aid',
    artesania: 'Crafts',
    llibres: 'Books',
    musica: 'Music',
    begudes: 'Drinks',
    horta: 'Market garden',
    forn: 'Bakery',
    tecnologia: 'Technology',
    ordinador: 'Computer'
  }),
  eu: Object.freeze({
    alimentacio: 'Elikagaiak',
    marxandatge: 'Proiektuko produktuak',
    roba: 'Arropa',
    samarreta: 'Kamiseta',
    'oli-verge-extra': 'Oliba-olio birjina estra',
    'oli-verge': 'Oliba-olio birjina',
    'oli-sense-filtrar': 'Iragazi gabeko olioa',
    'edicio-fundacional': 'Hasierako edizioa',
    'a-tornallom': 'Auzolanean',
    artesania: 'Eskulangintza',
    llibres: 'Liburuak',
    musica: 'Musika',
    begudes: 'Edariak',
    horta: 'Baratzea',
    forn: 'Okindegia',
    tecnologia: 'Teknologia',
    ordinador: 'Ordenagailua'
  }),
  gl: Object.freeze({
    alimentacio: 'Alimentación',
    marxandatge: 'Produtos do proxecto',
    roba: 'Roupa',
    samarreta: 'Camisola',
    'oli-verge-extra': 'Aceite Virxe Extra',
    'oli-verge': 'Aceite Virxe',
    'oli-sense-filtrar': 'Aceite sen filtrar',
    'edicio-fundacional': 'Edición fundacional',
    'a-tornallom': 'Traballo en común',
    artesania: 'Artesanía',
    llibres: 'Libros',
    musica: 'Música',
    begudes: 'Bebidas',
    horta: 'Horta',
    forn: 'Forno',
    tecnologia: 'Tecnoloxía',
    ordinador: 'Ordenador'
  })
});

const ENTITATS_HTML = Object.freeze({
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
  ndash: '–',
  mdash: '—',
  hellip: '…'
});

function descodificaEntitat(codi) {
  if (!codi) return '';
  const clau = codi.toLowerCase();
  if (Object.hasOwn(ENTITATS_HTML, clau)) return ENTITATS_HTML[clau];
  if (clau.startsWith('#x')) {
    const punt = Number.parseInt(clau.slice(2), 16);
    return Number.isInteger(punt) && punt > 0 && punt <= 0x10ffff ? String.fromCodePoint(punt) : '';
  }
  if (clau.startsWith('#')) {
    const punt = Number.parseInt(clau.slice(1), 10);
    return Number.isInteger(punt) && punt > 0 && punt <= 0x10ffff ? String.fromCodePoint(punt) : '';
  }
  return `&${codi};`;
}

/**
 * Extreu text pla net en temps lineal O(n) sense expressions regulars amb
 * retrocessos. Converteix tancaments de bloc i <br> en espais perquè dos
 * títols o cel·les consecutives (`<h3>A</h3><p>B</p>`) no queden enganxats.
 */
export function senseHtmlCru(entrada) {
  if (typeof entrada !== 'string' || !entrada) return '';
  if (!entrada.includes('<') && !entrada.includes('&')) return entrada.trim();

  const llarg = entrada.length;
  let brut = '';
  let i = 0;
  /* workspace-05 (Gauntlet R22) · Quan ja no queda cap «>», cada «<» que vinga
     és literal: no es torna a buscar el tancament. Sense esta marca, una cadena
     de «<» sense «>» recorria la cua per a cada «<» (quadràtic). Així cada
     caràcter es mira un nombre fitat de vegades: les cerques amb èxit cobrixen
     trams disjunts i la que falla es fa una sola vegada. */
  let senseTancament = false;

  while (i < llarg) {
    const ch = entrada[i];
    if (ch === '<') {
      const tancament = senseTancament ? -1 : entrada.indexOf('>', i + 1);
      if (tancament === -1) {
        senseTancament = true;
        brut += ch;
        i += 1;
        continue;
      }
      const contingutTag = entrada.slice(i + 1, tancament).trim().toLowerCase();
      if (
        contingutTag.startsWith('br')
        || contingutTag.startsWith('/p')
        || contingutTag.startsWith('/h')
        || contingutTag.startsWith('/li')
        || contingutTag.startsWith('/tr')
        || contingutTag.startsWith('/td')
        || contingutTag.startsWith('/th')
        || contingutTag.startsWith('/div')
      ) {
        brut += ' ';
      }
      i = tancament + 1;
      continue;
    }

    if (ch === '&') {
      const limit = Math.min(llarg, i + 14);
      let puntIComa = -1;
      for (let j = i + 1; j < limit; j += 1) {
        const c = entrada[j];
        if (c === ';') { puntIComa = j; break; }
        if (c === ' ' || c === '<' || c === '&' || c === '\n') break;
      }
      if (puntIComa > i + 1) {
        brut += descodificaEntitat(entrada.slice(i + 1, puntIComa));
        i = puntIComa + 1;
        continue;
      }
    }

    brut += ch;
    i += 1;
  }

  let eixida = '';
  let espaiPendent = false;
  for (let k = 0; k < brut.length; k += 1) {
    const codi = brut.charCodeAt(k);
    const esEspai = codi === 32 || codi === 9 || codi === 10 || codi === 13 || codi === 160;
    if (esEspai) {
      if (eixida.length > 0) espaiPendent = true;
    } else {
      if (espaiPendent) {
        eixida += ' ';
        espaiPendent = false;
      }
      eixida += brut[k];
    }
  }
  return eixida;
}

/**
 * Formata un slug tècnic (`alimentacio`, `oli-verge-extra`, `edicio-fundacional`)
 * com a etiqueta humana amb majúscula inicial i accents quan es coneix, deixant
 * intacta qualsevol etiqueta que ja porte majúscules o espais humans.
 */
export function formataEtiquetaHumana(valor, idioma = 'ca') {
  if (typeof valor !== 'string') return '';
  const net = valor.trim();
  if (!net) return '';
  const clau = net.toLowerCase();
  const codi = String(idioma || 'ca').trim().toLowerCase().split(/[-_]/)[0];
  const taula = Object.hasOwn(ETIQUETES_PER_IDIOMA, codi) ? ETIQUETES_PER_IDIOMA[codi] : ETIQUETES_PER_IDIOMA.ca;
  if (Object.hasOwn(taula, clau)) return taula[clau];
  if (net !== clau && !net.includes('-') && !net.includes('_')) return net;
  const separat = net.replace(/[-_]+/g, ' ').trim();
  if (!separat) return '';
  return separat.charAt(0).toUpperCase() + separat.slice(1);
}
