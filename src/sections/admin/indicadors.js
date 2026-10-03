/**
 * indicadors.js — els recomptes del bloc «Indicadors» del Tauler
 * d'administració, en funcions pures (decisió del Mestre 261003, «Graphfy»:
 * principis de dashboards i UI de dades als gràfics del panell).
 *
 * Entren les files que ja tornen adminListUsers i adminListOrganizations
 * (src/data/backendPort.js; a Supabase, 2609121600_admin_panel.sql i
 * 2609150000_seguretat_profunda_deepseek.sql) i ixen recomptes, mai persones.
 * Només es lligen tres camps: created_at i last_sign_in_at de cada persona i
 * kind de cada entitat. Cap funció llig el correu ni l'identificador.
 *
 * Una pregunta per gràfic (les formes, segons l'esborrany de la skill
 * sdp-grafics-dades, encara pendent d'aprovació del Mestre):
 *   altesPerMes        Quantes persones s'han donat d'alta cada mes?
 *   darrerAcces        Quan van entrar per última vegada?
 *   entitatsPerTipus   De quin tipus són les entitats?
 *
 * Privacitat (Llei 05, llei_05_privacitat): un grup de persones d'1 a 4 ix
 * com «menys de 5», sense la xifra; zero sí que es mostra, perquè no
 * assenyala ningú. Amagar el grup no basta: qui mira el panell pot saber el
 * total d'una sèrie (l'altra sèrie el dona sencer, l'avís de sostre diu que
 * n'hi ha 500 i el superadmin el sap), i restant trauria la xifra. Per això
 * cada sèrie de persones es protegix suposant que el seu total se sap
 * (protegixSerie): si cal, s'amaguen també altres grups («xifra protegida»)
 * fins que, amb tot el que es veu, d'un grup «menys de 5» només se'n puga
 * saber que té d'1 a 4 persones. Si no s'hi arriba, la sèrie sencera queda
 * protegida. Les entitats no passen pel llindar (vegeu entitatsPerTipus).
 *
 * Determinisme: «ara» entra sempre com a paràmetre i cap funció llig el
 * rellotge. Els mesos es tallen en una zona explícita (per defecte, la del
 * poble), no en la del navegador: el mateix instant cau sempre al mateix mes.
 */
import { ZONA_PER_DEFECTE } from '../../utils/esdeveniment.js';

/** Per davall d'este recompte, un grup de persones no es pinta amb la xifra. */
export const LLINDAR_GRUP_PETIT = 5;
export const MESOS_PER_DEFECTE = 12;
/** El text d'un grup que s'amaga per a protegir-ne un altre, o tota la sèrie. */
export const TEXT_PROTEGIT = 'xifra protegida';

const MS_DIA = 24 * 60 * 60 * 1000;
const NOMBRES = new Intl.NumberFormat('ca-ES');

const NOMS_MESOS = Object.freeze([
  'gener', 'febrer', 'març', 'abril', 'maig', 'juny',
  'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'
]);
const ABREVIATURES_MESOS = Object.freeze([
  'gen.', 'febr.', 'març', 'abr.', 'maig', 'juny',
  'jul.', 'ag.', 'set.', 'oct.', 'nov.', 'des.'
]);

/* Les columnes d'un any no tenen amplada per a dotze noms: es marca l'inici
   de cada trimestre (gener, abril, juliol i octubre), com l'Histograma de la
   Salut marca una hora de cada tres, i el mes en curs, que sempre porta el
   seu nom. La marca del mes d'abans del mes en curs es lleva perquè les dos
   no se solapen en una columna estreta. El nom sencer el té el lector de
   pantalla i la Taula. */
function marcaDelMes(mes, enCurs, abansDelMesEnCurs) {
  if (enCurs) return ABREVIATURES_MESOS[mes - 1];
  if (abansDelMesEnCurs || mes % 3 !== 1) return '';
  return ABREVIATURES_MESOS[mes - 1];
}

/* Trams de l'última entrada, en ordre de temps (no per recompte: són una
   escala, no categories soltes). `finsDies` tanca el tram per dalt. */
const TRAMS_ACCES = Object.freeze([
  Object.freeze({ clau: 'fins-30-dies', etiqueta: 'Fa 30 dies o menys', marca: '0–30 d', finsDies: 30 }),
  Object.freeze({ clau: 'fins-90-dies', etiqueta: 'Fa de 31 a 90 dies', marca: '31–90 d', finsDies: 90 }),
  Object.freeze({ clau: 'fins-365-dies', etiqueta: 'Fa de 91 a 365 dies', marca: '91–365 d', finsDies: 365 }),
  Object.freeze({ clau: 'mes-d-un-any', etiqueta: 'Fa més d’un any', marca: '+1 any', finsDies: Infinity })
]);
const TRAM_MAI = Object.freeze({ clau: 'mai', etiqueta: 'No han entrat mai', marca: 'Mai' });

/* Els tipus del CHECK de public.organizations (2609080000_initial_schema.sql),
   en este ordre quan empaten. «Empresa o negoci» i «Grup» són els noms del
   Perfil (DialegNovaOrganitzacio.jsx), en plural. */
const TIPUS_ENTITAT = Object.freeze([
  Object.freeze({ clau: 'company', etiqueta: 'Empreses o negocis', marca: 'Empreses' }),
  Object.freeze({ clau: 'group', etiqueta: 'Grups', marca: 'Grups' }),
  Object.freeze({ clau: 'entity', etiqueta: 'Entitats', marca: 'Entitats' }),
  Object.freeze({ clau: 'city_hall', etiqueta: 'Ajuntaments', marca: 'Ajuntaments' })
]);
const TIPUS_ALTRES = Object.freeze({ clau: 'altres', etiqueta: 'Altres tipus', marca: 'Altres' });

/** Un enter amb el separador de milers valencià («1.234»). */
export function formatNombre(n) {
  return NOMBRES.format(n);
}

/**
 * El recompte d'un grup de persones, a punt per a pintar. D'1 a llindar−1
 * ix com «menys de N» i sense la xifra: `recompte` és null, de manera que la
 * xifra exacta d'un grup petit no ix mai d'ací.
 * @param {number} n  enter no negatiu
 * @returns {{ recompte: number|null, text: string, petit: boolean }}
 */
export function protegixRecompte(n, llindar = LLINDAR_GRUP_PETIT) {
  if (!Number.isSafeInteger(n) || n < 0) throw new TypeError(`indicadors: recompte invàlid (${n})`);
  if (n > 0 && n < llindar) return { recompte: null, text: `menys de ${llindar}`, petit: true };
  return { recompte: n, text: formatNombre(n), petit: false };
}

const PROTEGIT = Object.freeze({ recompte: null, text: TEXT_PROTEGIT, petit: false, amagat: true });

/*
 * Amb el total d'una sèrie sabut, la suma dels grups amagats també se sap.
 * cobrix() diu si, amb eixa suma, cada grup petit encara pot valdre
 * qualsevol xifra d'1 a llindar−1: els altres petits sumen entre
 * altresPetits i altresPetits·(llindar−1), i els protegits, que mai són
 * petits ni buits, almenys llindar cadascun i sense sostre.
 */
function cobrix(suma, altresPetits, protegits, llindar) {
  const minim = altresPetits + protegits * llindar;
  const maxim = protegits > 0 ? Infinity : altresPetits * (llindar - 1);
  return suma - (llindar - 1) >= minim && suma - 1 <= maxim;
}

/**
 * Els recomptes d'una sèrie de persones, protegits suposant que el total de
 * la sèrie se sap. Un grup d'1 a llindar−1 ix «menys de N» (`petit`). Si,
 * restant del total, se'n podria saber més, s'amaguen també altres grups no
 * buits (`amagat`, «xifra protegida»): primer els més pròxims a un grup
 * petit i, si empaten, el primer. L'ordre depén de la posició i no del
 * valor, perquè la tria no diga res de la xifra que amaga. Si ni amagant-los
 * tots n'hi ha prou, la sèrie sencera queda protegida (`protegida`) i cap
 * grup porta xifra ni marca de petit.
 * @param {number[]} recomptes  enters no negatius, en l'ordre de la sèrie
 * @returns {{ grups: { recompte: number|null, text: string, petit: boolean, amagat: boolean }[], protegida: boolean }}
 */
export function protegixSerie(recomptes, llindar = LLINDAR_GRUP_PETIT) {
  const grups = recomptes.map((n) => ({ ...protegixRecompte(n, llindar), amagat: false }));
  const petits = grups.flatMap((g, i) => (g.petit ? [i] : []));
  if (!petits.length) return { grups, protegida: false };
  const distancia = (i) => Math.min(...petits.map((p) => Math.abs(p - i)));
  const candidats = grups.flatMap((g, i) => (!g.petit && g.recompte > 0 ? [i] : []))
    .sort((a, b) => distancia(a) - distancia(b) || a - b);
  let suma = petits.reduce((total, i) => total + recomptes[i], 0);
  let protegits = 0;
  while (!cobrix(suma, petits.length - 1, protegits, llindar)) {
    if (protegits === candidats.length) return { grups: grups.map(() => ({ ...PROTEGIT })), protegida: true };
    suma += recomptes[candidats[protegits]];
    protegits += 1;
  }
  for (const i of candidats.slice(0, protegits)) grups[i] = { ...PROTEGIT };
  return { grups, protegida: false };
}

/* Un total permetria traure per resta la xifra d'un grup amagat (total menys
   la resta de grups): amb algun grup amagat, la sèrie no en porta. */
function totalSegur(grups, recomptes, etiqueta, llindar) {
  if (grups.some((g) => g.petit || g.amagat)) return null;
  return { etiqueta, ...protegixRecompte(recomptes.reduce((a, b) => a + b, 0), llindar) };
}

/**
 * Un instant a partir d'un Date, d'uns mil·lisegons o d'un text ISO, o null.
 * Postgres torna els timestamptz amb microsegons («…00.123456+00:00»), que
 * l'ECMAScript no garantix: es retallen a mil·lisegons abans de llegir-los.
 */
function instantDe(valor) {
  let data = null;
  if (valor instanceof Date) data = new Date(valor.getTime());
  else if (typeof valor === 'number') data = new Date(valor);
  else if (typeof valor === 'string' && valor.trim()) data = new Date(valor.trim().replace(/(\.\d{3})\d+/, '$1'));
  return data && Number.isFinite(data.getTime()) ? data : null;
}

function exigixAra(ara) {
  const instant = instantDe(ara);
  if (!instant) throw new TypeError('indicadors: «ara» ha de ser una data vàlida');
  return instant;
}

const FORMATADORS_MES = new Map();
/** { any, mes } d'un instant en una zona IANA; mes d'1 a 12. */
function mesDe(instant, zona) {
  let formatador = FORMATADORS_MES.get(zona);
  if (!formatador) {
    formatador = new Intl.DateTimeFormat('en-US', { timeZone: zona, year: 'numeric', month: 'numeric' });
    FORMATADORS_MES.set(zona, formatador);
  }
  const parts = formatador.formatToParts(instant);
  return {
    any: Number(parts.find((p) => p.type === 'year').value),
    mes: Number(parts.find((p) => p.type === 'month').value)
  };
}

const clauMes = (any, mes) => `${any}-${String(mes).padStart(2, '0')}`;
const files = (llista) => (Array.isArray(llista) ? llista.filter((f) => f && typeof f === 'object') : []);

/**
 * Quantes persones s'han donat d'alta cada mes, dels `mesos` últims
 * (el mes d'«ara» inclòs, marcat «mes en curs, parcial» perquè encara no ha
 * acabat). Una alta posterior a la finestra (un rellotge avançat) no es
 * compta; una data il·legible tampoc, i es diu a `descartades`. Els mesos i
 * les descartades formen una sola sèrie protegida (protegixSerie).
 * @returns {{ mesos: object[], total: object|null, descartades: object, buit: boolean, protegida: boolean }}
 */
export function altesPerMes(persones, { ara, mesos = MESOS_PER_DEFECTE, zona = ZONA_PER_DEFECTE, llindar = LLINDAR_GRUP_PETIT } = {}) {
  const instant = exigixAra(ara);
  if (!Number.isSafeInteger(mesos) || mesos < 1 || mesos > 120) throw new TypeError('indicadors: «mesos» ha de ser un enter d’1 a 120');
  const actual = mesDe(instant, zona);
  const finestra = [];
  for (let enrere = mesos - 1; enrere >= 0; enrere -= 1) {
    const index = actual.any * 12 + (actual.mes - 1) - enrere;
    finestra.push({ any: Math.floor(index / 12), mes: (index % 12) + 1, enCurs: enrere === 0, abansDelMesEnCurs: enrere === 1 });
  }
  const recomptes = new Map(finestra.map((m) => [clauMes(m.any, m.mes), 0]));
  const llista = files(persones);
  let descartades = 0;
  for (const persona of llista) {
    const alta = instantDe(persona.created_at);
    if (!alta) { descartades += 1; continue; }
    const { any, mes } = mesDe(alta, zona);
    const clau = clauMes(any, mes);
    if (recomptes.has(clau)) recomptes.set(clau, recomptes.get(clau) + 1);
  }
  const serie = protegixSerie([...recomptes.values(), descartades], llindar);
  const grups = finestra.map(({ any, mes, enCurs, abansDelMesEnCurs }, i) => ({
    clau: clauMes(any, mes),
    etiqueta: `${NOMS_MESOS[mes - 1]} de ${any}${enCurs ? ' (mes en curs, parcial)' : ''}`,
    marca: marcaDelMes(mes, enCurs, abansDelMesEnCurs),
    enCurs,
    ...serie.grups[i]
  }));
  return {
    mesos: grups,
    total: totalSegur(serie.grups, [...recomptes.values()], `Total dels ${mesos} mesos`, llindar),
    descartades: serie.grups[serie.grups.length - 1],
    buit: llista.length === 0,
    protegida: serie.protegida
  };
}

/**
 * Quan van entrar per última vegada: quantes persones hi ha a cada tram de
 * TRAMS_ACCES i quantes no han entrat mai (last_sign_in_at buit). Una entrada
 * posterior a «ara» compta al primer tram; una data il·legible no compta
 * enlloc i es diu a `descartades`. Els trams i les descartades formen una
 * sola sèrie protegida (protegixSerie).
 * @returns {{ trams: object[], total: object|null, descartades: object, buit: boolean, protegida: boolean }}
 */
export function darrerAcces(persones, { ara, llindar = LLINDAR_GRUP_PETIT } = {}) {
  const instant = exigixAra(ara);
  const trams = [...TRAMS_ACCES, TRAM_MAI];
  const recomptes = new Map(trams.map((t) => [t.clau, 0]));
  const llista = files(persones);
  let descartades = 0;
  for (const persona of llista) {
    const brut = persona.last_sign_in_at;
    if (brut === null || brut === undefined || (typeof brut === 'string' && !brut.trim())) {
      recomptes.set(TRAM_MAI.clau, recomptes.get(TRAM_MAI.clau) + 1);
      continue;
    }
    const entrada = instantDe(brut);
    if (!entrada) { descartades += 1; continue; }
    const dies = (instant.getTime() - entrada.getTime()) / MS_DIA;
    const tram = TRAMS_ACCES.find((t) => dies <= t.finsDies);
    recomptes.set(tram.clau, recomptes.get(tram.clau) + 1);
  }
  const serie = protegixSerie([...recomptes.values(), descartades], llindar);
  const grups = trams.map(({ clau, etiqueta, marca }, i) => ({ clau, etiqueta, marca, ...serie.grups[i] }));
  return {
    trams: grups,
    total: totalSegur(serie.grups, [...recomptes.values()], 'Total', llindar),
    descartades: serie.grups[serie.grups.length - 1],
    buit: llista.length === 0,
    protegida: serie.protegida
  };
}

/**
 * De quin tipus són les entitats: els quatre tipus del CHECK, ordenats de
 * més a menys (com un pastís, però en barres que es poden comparar), i
 * «Altres tipus» només si n'hi ha cap fora del CHECK.
 *
 * El recompte va exacte, sense llindar. Compte: no totes les entitats són
 * públiques. organizations.visibility pot ser 'members'
 * (2609080000_initial_schema.sql) i admin_list_organizations no la torna, de
 * manera que el recompte inclou entitats només per a membres que el client
 * no pot distingir. Si s'hi aplica també el llindar, ho decidix el Mestre.
 * @returns {{ tipus: object[], total: object, buit: boolean }}
 */
export function entitatsPerTipus(entitats) {
  const recomptes = new Map([...TIPUS_ENTITAT, TIPUS_ALTRES].map((t) => [t.clau, 0]));
  const llista = files(entitats);
  for (const entitat of llista) {
    const clau = recomptes.has(entitat.kind) && entitat.kind !== TIPUS_ALTRES.clau ? entitat.kind : TIPUS_ALTRES.clau;
    recomptes.set(clau, recomptes.get(clau) + 1);
  }
  const tipus = [...TIPUS_ENTITAT, TIPUS_ALTRES]
    .filter((t) => t !== TIPUS_ALTRES || recomptes.get(t.clau) > 0)
    .map(({ clau, etiqueta, marca }) => {
      const n = recomptes.get(clau);
      return { clau, etiqueta, marca, recompte: n, text: formatNombre(n), petit: false, amagat: false };
    })
    /* sort és estable (ES2019): els empats conserven l'ordre del CHECK. */
    .sort((a, b) => b.recompte - a.recompte);
  return {
    tipus,
    total: { etiqueta: 'Total', recompte: llista.length, text: formatNombre(llista.length), petit: false },
    buit: llista.length === 0
  };
}

/* Un grup protegit es dibuixa a la mateixa alçada que un de petit: amb un
   màxim enter, cap nivell de l'Histograma (de 10 en 10 %) els separa. Per al
   formatador, en canvi, són dos valors diferents. */
const DIFERENCIA_PROTEGIT = 0.01;

/**
 * Els grups d'una sèrie, en la forma de l'Histograma de Pedra Seca. Un grup
 * petit es dibuixa a mitja alçada del llindar (llindar/2, el punt mig dels
 * valors amagats) i el seu text és «menys de N»; un grup protegit, a la
 * mateixa alçada, i el seu text és «xifra protegida». En una sèrie de
 * persones amb grups amagats, cap recompte visible cau entre 0 i el llindar,
 * de manera que el formatador reconeix els dos dibuixos sense ambigüitat.
 * Amb algun grup amagat, l'escala arriba com a mínim al llindar i només la
 * fixen les xifres visibles: tot de grups amagats no omplin cap barra.
 * `unitat` ([singular, plural]) va dins del text, i no a la prop `unitat`
 * de l'Histograma, perquè concorde: «1 entitat», «0 entitats».
 * @returns {{ barres: object[], maxim: number|undefined, formatValor: (valor: number) => string }}
 */
export function barresHistograma(grups, { llindar = LLINDAR_GRUP_PETIT, unitat = null } = {}) {
  const dibuixPetit = llindar / 2;
  const dibuixProtegit = dibuixPetit + DIFERENCIA_PROTEGIT;
  const algunAmagat = grups.some((g) => g.petit || g.amagat);
  const visibles = grups.filter((g) => !g.petit && !g.amagat).map((g) => g.recompte);
  const ambUnitat = (text, n) => (unitat ? `${text} ${n === 1 ? unitat[0] : unitat[1]}` : text);
  const dibuix = (g) => {
    if (g.petit) return dibuixPetit;
    return g.amagat ? dibuixProtegit : g.recompte;
  };
  return {
    barres: grups.map((g) => ({ id: g.clau, etiqueta: g.etiqueta, marca: g.marca, valor: dibuix(g) })),
    maxim: algunAmagat ? Math.max(llindar, ...visibles) : undefined,
    formatValor: (valor) => {
      if (algunAmagat && valor === dibuixPetit) return ambUnitat(`menys de ${llindar}`, llindar);
      if (algunAmagat && valor === dibuixProtegit) return TEXT_PROTEGIT;
      return ambUnitat(formatNombre(valor), valor);
    }
  };
}
