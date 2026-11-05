/**
 * politicaRetencioIFiltresUsuari.js — Ronda 22 (Directiva AH-12 · Eixos 5 i 6 de l'Estudi Doctoral AH-10)
 *
 * 1) Motor pur de Filtres per Context amb Caducitat (`CustomFilter` v2 de Mastodon AGPLv3):
 *    superfícies `mur`, `notificacions`, `converses`, `perfils`, `fedivers`, coincidència
 *    sense ReDoS (`whole_word`) i accions `warn` / `hide`.
 * 2) Motor d'Oblit Saludable Rural (`StatusRetentionPolicy` adaptat a Sóc de Poble):
 *    caduca avisos efímers ja passats (ex. `vehicle` compartit d'una data vençuda), però
 *    blinda de manera inviolable (`maiEsborrar: true`) tota la memòria històrica i cròniques
 *    de Sóc de Poble, El Rentonar i Coordinadora d'Estudis Eòlics del Comtat, així com
 *    peces fixades (`pinned`) i marcadors (`bookmarked`).
 */

export const CONTEXTOS_FILTRE_USUARI = Object.freeze([
  'mur',
  'notificacions',
  'converses',
  'perfils',
  'fedivers'
]);

const AUTORS_MEMORIA_INVIOLABLE = new Set([
  'socdepoble',
  'soc-de-poble',
  'sóc de poble',
  'soc de poble',
  'rentonar',
  'el-rentonar',
  'el rentonar',
  'associació el rentonar',
  'coordinadora',
  'coordinadora-comtat',
  'coordinadora-estudis-eolics-comtat',
  "coordinadora d'estudis eòlics del comtat",
  'coordinadora d’estudis eòlics del comtat'
]);

const AMBITS_PATRIMONI_INVIOLABLES = new Set(['mapa', 'pobles', 'page']);

function normalitzaTextCerca(valor) {
  return String(valor ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function tokenitzaParaules(textNet) {
  return new Set(
    String(textNet ?? '')
      .split(/[^0-9a-zà-ÿ]+/i)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
  );
}

function dataIsoAMs(valor) {
  if (!valor) return null;
  const ms = Date.parse(String(valor));
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Avalua una peça contra la llista de filtres configurats per l'usuari per al context actiu.
 * Determinista i en temps lineal O(N * M) sense cap expressió regular dinàmica (zero ReDoS).
 */
export function avaluaFiltresContextuals(peca, filtres = [], contextActual = 'mur', araIso = null) {
  const ctx = normalitzaTextCerca(contextActual) || 'mur';
  if (!peca || typeof peca !== 'object' || !Array.isArray(filtres) || filtres.length === 0) {
    return Object.freeze({ accio: 'cap', oculta: false, avisos: Object.freeze([]) });
  }

  const araMs = dataIsoAMs(araIso) ?? Date.now();
  const textPeca = normalitzaTextCerca(
    [
      peca.title,
      peca.titol,
      peca.summary,
      peca.resum,
      peca.entradilla,
      peca.content,
      peca.text,
      peca.spoiler_text,
      Array.isArray(peca.tags) ? peca.tags.join(' ') : '',
      Array.isArray(peca.labels) ? peca.labels.join(' ') : ''
    ].join(' ')
  );

  if (!textPeca) {
    return Object.freeze({ accio: 'cap', oculta: false, avisos: Object.freeze([]) });
  }

  const paraulesPeca = tokenitzaParaules(textPeca);
  const avisos = [];
  let teHide = false;
  let teWarn = false;

  for (const filtre of filtres) {
    if (!filtre || typeof filtre !== 'object') continue;

    // 1) Comprova si el filtre ha caducat
    const expMs = dataIsoAMs(filtre.expires_at ?? filtre.expiresAt);
    if (expMs !== null && expMs <= araMs) continue;

    // 2) Comprova si aplica a la superfície/context actual
    const contextos = Array.isArray(filtre.context)
      ? filtre.context.map(normalitzaTextCerca)
      : [normalitzaTextCerca(filtre.context ?? 'mur')];
    if (!contextos.includes(ctx)) continue;

    // 3) Comprova les paraules clau del filtre
    const paraulesFiltre = Array.isArray(filtre.keywords)
      ? filtre.keywords
      : [filtre.phrase ?? filtre.paraula ?? ''];

    let coincideix = false;
    for (const entrada of paraulesFiltre) {
      const frase = normalitzaTextCerca(typeof entrada === 'string' ? entrada : entrada?.keyword);
      if (!frase) continue;
      const paraulaSencera = typeof entrada === 'object' && entrada !== null
        ? entrada.whole_word !== false
        : filtre.whole_word !== false;

      if (paraulaSencera && !frase.includes(' ')) {
        if (paraulesPeca.has(frase)) {
          coincideix = true;
          break;
        }
      } else if (textPeca.includes(frase)) {
        coincideix = true;
        break;
      }
    }

    if (!coincideix) continue;

    const accioFiltre = normalitzaTextCerca(filtre.filter_action ?? filtre.action) === 'hide' ? 'hide' : 'warn';
    const titolFiltre = String(filtre.title ?? filtre.titol ?? 'Filtre d’usuari').trim();
    avisos.push(titolFiltre);
    if (accioFiltre === 'hide') {
      teHide = true;
    } else {
      teWarn = true;
    }
  }

  const accioFinal = teHide ? 'hide' : (teWarn ? 'warn' : 'cap');
  return Object.freeze({
    accio: accioFinal,
    oculta: accioFinal === 'hide',
    avisos: Object.freeze(avisos)
  });
}

/**
 * Avalua la política d'Oblit Saludable Rural sobre una publicació:
 *   - Blinda de manera inviolable (`maiEsborrar: true`) totes les cròniques i memòria històrica
 *     de Sóc de Poble, El Rentonar i Coordinadora, el patrimoni i mapa, les peces fixades (`pinned`)
 *     i els marcadors (`bookmarked`).
 *   - Caduca i recomana arxivar (`caducada: true`) avisos efímers ja vençuts (ex. `vehicle` compartit
 *     d'una data ja passada o ofertes temporals vençudes).
 */
export function avaluaRetencioPublicacio(peca, politica = {}, araIso = null) {
  if (!peca || typeof peca !== 'object') {
    return Object.freeze({
      maiEsborrar: true,
      caducada: false,
      accioRecomanada: 'conserva',
      motiu: 'PECA_BUIDA_CONSERVADA_PER_SEGURETAT'
    });
  }

  // 1) Fixades i marcadors sempre protegits
  if (peca.pinned === true || peca.fixada === true || peca.bookmarked === true || peca.favourited === true) {
    return Object.freeze({
      maiEsborrar: true,
      caducada: false,
      accioRecomanada: 'conserva',
      motiu: 'PROTEGIDA_FIXADA_O_MARCADOR'
    });
  }

  // 2) Cròniques i publicacions de Sóc de Poble, El Rentonar i Coordinadora són memòria viva inviolable
  const candidatsAutor = [
    peca.author_entity_id,
    peca.author_id,
    peca.author_slug,
    peca.author_name,
    peca.author,
    peca.entityId
  ].map(normalitzaTextCerca);

  if (candidatsAutor.some((c) => c && AUTORS_MEMORIA_INVIOLABLE.has(c))) {
    return Object.freeze({
      maiEsborrar: true,
      caducada: false,
      accioRecomanada: 'conserva',
      motiu: 'MEMORIA_HISTÒRICA_EDITORIAL_INVIOLABLE'
    });
  }

  // 3) Àmbits de patrimoni, mapa i pàgines de poble mai caduquen
  const ambit = normalitzaTextCerca(peca.ambit ?? peca.fitxa?.ambit);
  if (AMBITS_PATRIMONI_INVIOLABLES.has(ambit) || peca.memoriaHistorica === true) {
    return Object.freeze({
      maiEsborrar: true,
      caducada: false,
      accioRecomanada: 'conserva',
      motiu: 'PATRIMONI_LOCAL_PERMANENT'
    });
  }

  const araMs = dataIsoAMs(araIso) ?? Date.now();

  // 4) Comprovació de caducitat d'un trajecte efímer de vehicle compartit o avís amb data de fi
  const dataFiRaw = peca.expires_at ?? peca.expiresAt ?? peca.data_viatge ?? peca.fitxa?.data_viatge ?? null;
  const dataFiMs = dataIsoAMs(dataFiRaw);
  if ((ambit === 'vehicle' || peca.efimera === true) && dataFiMs !== null && dataFiMs < araMs) {
    return Object.freeze({
      maiEsborrar: false,
      caducada: true,
      accioRecomanada: 'arxiva_efimer',
      motiu: 'AVIS_EFIMER_DATA_SUPERADA'
    });
  }

  // 5) Retenció per edat només si la peça és explícitament efímera
  const diesRetencio = typeof politica.diesRetencioEfimers === 'number' && politica.diesRetencioEfimers > 0
    ? politica.diesRetencioEfimers
    : 30;
  const creacioMs = dataIsoAMs(peca.created_at ?? peca.date ?? peca.publishedAt);
  if (
    peca.efimera === true
    && creacioMs !== null
    && araMs - creacioMs > diesRetencio * 86400000
  ) {
    return Object.freeze({
      maiEsborrar: false,
      caducada: true,
      accioRecomanada: 'arxiva_efimer',
      motiu: 'SUPERAT_PERIODE_RETENCIO_EFIMERA'
    });
  }

  return Object.freeze({
    maiEsborrar: false,
    caducada: false,
    accioRecomanada: 'conserva',
    motiu: 'VIGENT'
  });
}
