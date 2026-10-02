/**
 * auditoria.js — avisos d'un trimestre: factures que falten, duplicats i dubtes.
 *
 * Creua les factures del trimestre amb el registre de proveïdors (historial i
 * catàleg), els documents de la carpeta i, si n'hi ha, els resums del correu.
 * Els avisos són indicis per a revisar, no veredictes: mai no es declara el
 * trimestre «complet». Només importa nuclis compartits pels dos tractors
 * (classifica.js i correus.js no): els documents i els correus arriben ja
 * classificats i resumits. JS pur: sense DOM ni React.
 *
 * Correus: els resums de resumCorreu. Un correu compta com de factura si no
 * porta esFactura === false (passa esFactura amb esCorreuDeFactura, o passa
 * només els de factura); tots compten per a la cobertura.
 * Documents: { ruta, mida?, sha256?, tipus, proveidor? (clau), import? (cèntims) }.
 */
import {
  comparaDates, diesEntre, dinsDeRang, esDataValida, formatData, mesosDelTrimestre, nomMes, rangTrimestre
} from './dates.js';
import { formatImport } from './diners.js';
import { clauDuplicat, validaFactura } from './model.js';
import { normalitzaNif } from './nif.js';
import { aprenProveidors, clauMes, identificaProveidor, indexMes } from './proveidors.js';

export const SEVERITATS = Object.freeze(['alta', 'mitjana', 'baixa', 'info']);
const DIES_CORREU = 7;
const MISSATGE_CORREU_NO_REVISAT = "Correu no revisat: la detecció de factures absents es basa només en la carpeta i l'historial.";

const nomDeFitxer = (ruta) => String(ruta ?? '').split(/[\\/]/).pop();
/* «de» o «d'» davant d'un nom: d'abril, d'Adobe, però de iogurt (vocals amb accent incloses). */
const VOCAL = '[aeiou\\u00e0\\u00e8\\u00e9\\u00ed\\u00f2\\u00f3\\u00fa]';
const AMB_APOSTROF = new RegExp(`^h?${VOCAL}`, 'i');
const SEMIVOCAL = new RegExp(`^h?[iu]${VOCAL}`, 'i');
const de = (text) => (AMB_APOSTROF.test(text) && !SEMIVOCAL.test(text) ? `d'${text}` : `de ${text}`);
const indexDe = (a, m) => a * 12 + m - 1;

function sumaDies(d, n) {
  const x = new Date(Date.UTC(d.a, d.m - 1, d.d + n));
  return { a: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate() };
}

/* Índexs de mes ordenats i sense repetir d'unes claus 'aaaa-mm'. */
const indexsDe = (claus) => [...new Set(claus.map(indexMes).filter((i) => i !== null))].sort((x, y) => x - y);

/* Cert si els mesos vistos cobrixen els tres mesos d'algun trimestre anterior a `trimestre`. */
function trimestreSencerAbans(mesosVistos, trimestre) {
  const perTrimestre = new Map();
  for (const i of indexsDe(mesosVistos ?? [])) {
    const q = Math.floor(i / 3);
    if (q < trimestre) perTrimestre.set(q, (perTrimestre.get(q) ?? 0) + 1);
  }
  return [...perTrimestre.values()].some((n) => n >= 3);
}

/* El millor proveïdor d'un correu: pel domini, el nom del remitent i cada adjunt. */
function proveidorDelCorreu(correu, registre) {
  let millor = null;
  for (const nomFitxer of [undefined, ...(correu.adjunts ?? [])]) {
    const r = identificaProveidor({ domini: correu.domini || correu.de, nom: correu.nomRemitent, nomFitxer }, registre);
    if (r && (!millor || r.puntuacio > millor.puntuacio)) millor = r;
  }
  return millor?.proveidor ?? null;
}

/**
 * Audita un trimestre.
 * @param {object} p
 * @param {number} p.any
 * @param {number} p.t trimestre (1-4)
 * @param {object[]} p.factures les Factures del trimestre
 * @param {object[]} [p.documents] els documents classificats de la carpeta del trimestre
 * @param {object[]} [p.proveidors] el registre d'aprenProveidors (sense: només el catàleg)
 * @param {object[]|null} [p.correus] resums de resumCorreu, o null si no s'ha revisat el correu
 * @param {string[]} [p.nifsPropis] els NIF del titular
 * @param {{a:number,m:number,d:number}|null} [p.avui] sense avisos de mesos que encara no han arribat
 * @param {Array<{ motiu: string, documents: object[] }>|null} [p.duplicats] els grups de detectaDuplicats;
 *   sense, només es comparen els sha256 dels documents
 * @returns {{ incidencies: object[], cobertura: object, resum: object }}
 */
export function auditaTrimestre({
  any, t, factures = [], documents = [], proveidors = null, correus = null, nifsPropis = [], avui = null, duplicats = null
} = {}) {
  const rang = rangTrimestre(any, t);
  if (!rang) throw new RangeError(`Trimestre no vàlid: ${any} ${t}T`);
  const registre = Array.isArray(proveidors) ? proveidors : aprenProveidors([]);
  const llista = (factures ?? []).filter(Boolean);
  const docs = (documents ?? []).filter((d) => d && typeof d.ruta === 'string');
  const propis = new Set((nifsPropis ?? []).map(normalitzaNif).filter(Boolean));
  const ambAvui = esDataValida(avui);
  const mesFutur = (a, m) => ambAvui && indexDe(a, m) > indexDe(avui.a, avui.m);
  const incidencies = [];
  const afig = (incidencia) => incidencies.push(incidencia);

  for (const f of llista) incidencies.push(...validaFactura(f, { rang }));

  for (const f of llista) {
    if (!propis.has(normalitzaNif(f.nif))) continue;
    afig({
      codi: 'NIF_PROPI',
      severitat: 'alta',
      missatge: f.tipus === 'ingres'
        ? 'El NIF del client és el teu: revisa si la factura és emesa o rebuda.'
        : "El NIF del proveïdor és el teu: segurament s'ha llegit el NIF del destinatari en lloc del de l'emissor.",
      ...(f.origen?.fitxer ? { fitxer: f.origen.fitxer } : {}),
      ...(f.id ? { facturaId: f.id } : {})
    });
  }

  /* Duplicats de factures: el mateix NIF (o nom) i el mateix número. */
  const perClau = new Map();
  for (const f of llista) {
    const clau = clauDuplicat(f);
    const [qui, num] = clau.split('|');
    if (!qui || !num) continue;
    const grup = perClau.get(`${f.tipus}|${clau}`) ?? [];
    grup.push(f);
    perClau.set(`${f.tipus}|${clau}`, grup);
  }
  for (const grup of perClau.values()) {
    const [primera, ...repetides] = grup;
    for (const f of repetides) {
      const on = primera.origen?.fitxer ? ` (també a «${nomDeFitxer(primera.origen.fitxer)}»)` : '';
      afig({
        codi: 'DUPLICAT',
        severitat: 'mitjana',
        missatge: `Possible duplicat: la factura «${f.num}»${f.contrapart ? ` ${de(f.contrapart)}` : ''} apareix més d'una vegada${on}.`,
        ...(f.origen?.fitxer ? { fitxer: f.origen.fitxer } : {}),
        ...(f.id ? { facturaId: f.id } : {})
      });
    }
  }

  /* Duplicats de documents: els grups de detectaDuplicats o, si no n'hi ha, el mateix sha256. */
  let grupsDocs = duplicats;
  if (!Array.isArray(grupsDocs)) {
    const perSha = new Map();
    for (const d of docs) if (d.sha256) perSha.set(d.sha256, [...(perSha.get(d.sha256) ?? []), d]);
    grupsDocs = [...perSha.values()].filter((g) => g.length > 1).map((g) => ({ motiu: 'contingut', documents: g }));
  }
  for (const grup of grupsDocs) {
    const [original, ...copies] = grup?.documents ?? [];
    for (const d of copies) {
      const relacio = grup.motiu === 'contingut' ? 'té el mateix contingut que' : 'pareix una còpia de';
      afig({
        codi: 'DUPLICAT',
        severitat: 'mitjana',
        missatge: `Document duplicat: «${nomDeFitxer(d.ruta)}» ${relacio} «${nomDeFitxer(original.ruta)}».`,
        fitxer: d.ruta
      });
    }
  }

  /* Les despeses del trimestre, per proveïdor. */
  const despeses = llista.filter((f) => f.tipus === 'despesa');
  const proveidorDe = new Map();
  const perProveidor = new Map();
  for (const f of despeses) {
    const nif = propis.has(normalitzaNif(f.nif)) ? '' : f.nif;
    const p = identificaProveidor({ nif, nom: f.contrapart, nomFitxer: f.origen?.fitxer }, registre)?.proveidor ?? null;
    proveidorDe.set(f, p);
    if (p) perProveidor.set(p.clau, [...(perProveidor.get(p.clau) ?? []), f]);
  }

  const mesos = mesosDelTrimestre(t);
  const indexInici = indexDe(any, mesos[0]);
  const trimestreActual = Math.floor(indexInici / 3);

  /* FALTA_MENSUAL: proveïdors que facturen cada mes i que han facturat el trimestre anterior o este.
     Alta només si l'historial els ha vist els tres mesos d'algun trimestre anterior; si no, mitjana. */
  for (const p of registre) {
    if (p?.cadencia !== 'mensual') continue;
    const propies = perProveidor.get(p.clau) ?? [];
    const presents = new Set(propies.map((f) => clauMes(f.data)).filter(Boolean));
    const vistos = [...(p.mesosVistos ?? []), ...presents].map(indexMes).filter((i) => i !== null);
    if (!vistos.some((i) => i >= indexInici - 3 && i <= indexInici + 2)) continue;
    const primer = Math.min(...vistos);
    const senseData = propies.filter((f) => !esDataValida(f.data)).length;
    const severitat = trimestreSencerAbans(p.mesosVistos, trimestreActual) ? 'alta' : 'mitjana';
    for (const m of mesos) {
      if (indexDe(any, m) < primer || mesFutur(any, m) || presents.has(clauMes({ a: any, m, d: 1 }))) continue;
      const nota = senseData > 0 ? ` Hi ha ${senseData === 1 ? 'una factura seua' : `${senseData} factures seues`} sense data: revisa-la.` : '';
      afig({
        codi: 'FALTA_MENSUAL',
        severitat,
        missatge: `Falta la factura ${de(nomMes(m))} de ${any} ${de(p.nom)}, que factura cada mes.${nota}`,
        proveidor: p.clau,
        mes: clauMes({ a: any, m, d: 1 })
      });
    }
  }

  /* Els bimestrals: la factura s'espera dos mesos després de l'última vista (o un mes
     abans o després, si la data s'ha mogut). Una que falta és un indici (FALTA_HABITUAL). */
  for (const p of registre) {
    if (p?.cadencia !== 'bimestral') continue;
    const propies = perProveidor.get(p.clau) ?? [];
    const vistos = indexsDe([...(p.mesosVistos ?? []), ...propies.map((f) => clauMes(f.data)).filter(Boolean)]);
    if (!vistos.some((i) => i >= indexInici - 4 && i <= indexInici + 2)) continue;
    const anteriors = vistos.filter((i) => i < indexInici);
    let ancora = anteriors.length > 0 ? anteriors[anteriors.length - 1] : vistos[0];
    for (let esperat = ancora + 2; esperat <= indexInici + 2; esperat = ancora + 2) {
      const trobat = [esperat, esperat - 1, esperat + 1].find((i) => vistos.includes(i));
      ancora = trobat ?? esperat;
      const m = (esperat % 12) + 1;
      if (trobat !== undefined || esperat < indexInici || mesFutur(any, m)) continue;
      afig({
        codi: 'FALTA_HABITUAL',
        severitat: 'mitjana',
        missatge: `Indici: falta la factura ${de(nomMes(m))} de ${any} ${de(p.nom)}, que factura cada dos mesos. Pot ser normal; revisa-ho.`,
        proveidor: p.clau,
        mes: clauMes({ a: any, m, d: 1 })
      });
    }
  }

  /* FALTA_HABITUAL: proveïdors no mensuals ni bimestrals que s'esperaven i no hi són. És un indici. */
  const trimestreAcabat = !ambAvui || comparaDates(avui, rang.fi) > 0;
  for (const p of registre) {
    if (!p || p.cadencia === 'mensual' || p.cadencia === 'bimestral' || perProveidor.has(p.clau)) continue;
    const anteriors = (p.mesosVistos ?? []).map(indexMes).filter((i) => i !== null && i < indexInici);
    if (anteriors.length === 0) continue;
    const trimestres = new Set(anteriors.map((i) => Math.floor(i / 3)));
    let motiu = null;
    if (p.cadencia === 'anual') {
      const esperats = anteriors.filter((i) => Math.floor(i / 3) === trimestreActual - 4).map((i) => (i % 12) + 1);
      if (esperats.length > 0 && esperats.some((m) => !mesFutur(any, m))) motiu = "va facturar en este trimestre l'any passat";
    } else if (trimestreAcabat && trimestres.has(trimestreActual - 1)) {
      if (p.cadencia === 'trimestral') motiu = 'va facturar el trimestre anterior';
      else if (trimestres.size >= 2) motiu = "ha facturat en diversos trimestres anteriors, també en l'últim";
    }
    if (!motiu) continue;
    afig({
      codi: 'FALTA_HABITUAL',
      severitat: 'mitjana',
      missatge: `Indici: ${p.nom} ${motiu} i en este no hi ha cap factura seua. Pot ser normal; revisa-ho.`,
      proveidor: p.clau
    });
  }

  /* REBUT_SENSE_FACTURA: un rebut de pagament demana la factura del mateix proveïdor i import. */
  for (const d of docs) {
    if (d.tipus !== 'rebut') continue;
    const nom = nomDeFitxer(d.ruta);
    const p = (d.proveidor && registre.find((x) => x?.clau === d.proveidor))
      || identificaProveidor({ nomFitxer: nom }, registre)?.proveidor || null;
    const imp = Number.isSafeInteger(d.import) ? d.import : null;
    if (p || imp !== null) {
      const casa = despeses.some((f) => (!p || proveidorDe.get(f)?.clau === p.clau)
        && (imp === null || (Number.isSafeInteger(f.total) && Math.abs(f.total - imp) <= 1)));
      if (casa) continue;
    }
    let detall;
    if (p && imp !== null) detall = `${de(p.nom)} per ${formatImport(imp)} sense cap factura seua d'eixe import`;
    else if (p) detall = `${de(p.nom)} sense cap factura d'eixe proveïdor al trimestre`;
    else if (imp !== null) detall = `per ${formatImport(imp)} sense cap factura d'eixe import`;
    else detall = "sense factura relacionada: no se n'ha pogut saber el proveïdor ni l'import";
    afig({
      codi: 'REBUT_SENSE_FACTURA',
      severitat: 'mitjana',
      missatge: `Rebut «${nom}» ${detall}. Un rebut de pagament no substituïx la factura.`,
      fitxer: d.ruta,
      ...(p ? { proveidor: p.clau } : {})
    });
  }

  /* Correu: cobertura i correus de factura sense document. */
  let cobertura = { carpeta: 'revisada', correu: 'no-revisat', correusRevisats: 0, periodeCorreu: null };
  if (!Array.isArray(correus)) {
    afig({ codi: 'CORREU_NO_REVISAT', severitat: 'info', missatge: MISSATGE_CORREU_NO_REVISAT });
  } else {
    const dates = correus.map((c) => c?.data).filter(esDataValida).sort(comparaDates);
    const periodeCorreu = dates.length > 0 ? { inici: dates[0], fi: dates[dates.length - 1] } : null;
    cobertura = { carpeta: 'revisada', correu: 'revisat', correusRevisats: correus.length, periodeCorreu };
    if (!periodeCorreu) {
      afig({ codi: 'CORREU_PARCIAL', severitat: 'info', missatge: 'El correu revisat no té cap missatge amb data: no cobrix el trimestre.' });
    } else if (comparaDates(periodeCorreu.inici, rang.inici) > 0 || comparaDates(periodeCorreu.fi, rang.fi) < 0) {
      afig({
        codi: 'CORREU_PARCIAL',
        severitat: 'info',
        missatge: `El correu revisat va del ${formatData(periodeCorreu.inici)} al ${formatData(periodeCorreu.fi)}: no cobrix tot el trimestre.`
      });
    }

    const senseDocument = new Map();
    for (const c of correus) {
      if (!c || c.esFactura === false || !dinsDeRang(c.data, rang)) continue;
      const p = proveidorDelCorreu(c, registre);
      if (!p) continue;
      const casa = (perProveidor.get(p.clau) ?? []).some((f) => esDataValida(f.data)
        && (Math.abs(diesEntre(f.data, c.data)) <= DIES_CORREU || (f.data.a === c.data.a && f.data.m === c.data.m)));
      /* Una factura de just abans o just després del trimestre ja és a l'historial d'eixe mes. */
      const fora = [sumaDies(c.data, -DIES_CORREU), sumaDies(c.data, DIES_CORREU)]
        .filter((d) => !dinsDeRang(d, rang))
        .some((d) => (p.mesosVistos ?? []).includes(clauMes(d)));
      if (casa || fora) continue;
      const clau = `${p.clau}|${clauMes(c.data)}`;
      const grup = senseDocument.get(clau) ?? { p, mes: clauMes(c.data), dates: [] };
      grup.dates.push(c.data);
      senseDocument.set(clau, grup);
    }
    for (const { p, mes, dates: diesCorreu } of senseDocument.values()) {
      const quins = diesCorreu.length === 1 ? 'Un correu' : `${diesCorreu.length} correus`;
      afig({
        codi: 'CORREU_SENSE_DOCUMENT',
        severitat: 'alta',
        missatge: `${quins} de factura ${de(p.nom)} (${diesCorreu.map((d) => formatData(d)).join(', ')}) sense cap factura seua a la carpeta en ±${DIES_CORREU} dies ni en el mateix mes.`,
        proveidor: p.clau,
        mes
      });
    }
  }

  const pes = (s) => {
    const i = SEVERITATS.indexOf(s);
    return i < 0 ? SEVERITATS.length : i;
  };
  incidencies.sort((x, y) => pes(x.severitat) - pes(y.severitat));
  const completes = llista.filter((f) => f.estat === 'completa').length;
  return {
    incidencies,
    cobertura,
    resum: {
      factures: llista.length,
      completes,
      pendents: llista.length - completes,
      ingressos: llista.filter((f) => f.tipus === 'ingres').length,
      despeses: despeses.length
    }
  };
}
