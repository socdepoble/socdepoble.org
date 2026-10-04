/**
 * obligacions.js — el catàleg d'obligacions recurrents de Burocràcia i el
 * seu calendari per any.
 *
 * Cada obligació diu QUÈ és, A QUI s'aplica (una regla sobre el perfil del
 * titular), la FINESTRA de presentació, l'ORGANISME, la FONT oficial on es
 * comprova i QUI la presenta (la gestoria o el titular). Totes porten la
 * llegenda «a verificar amb la gestoria»: les dates són les habituals, no les
 * d'un any concret, i el programa diu «el teu termini», mai «t'ho presentem».
 *
 * Fail-closed: si al perfil li falta una dada per a decidir, l'obligació NO
 * desapareix: queda «cal-verificar». Les dates que dona un organisme (els
 * períodes de SUMA, la renovació de la demanda d'ocupació) es carreguen de
 * fora; el catàleg no se les inventa. El calendari d'inhàbils és el de
 * terminis.js, injectable; l'últim hàbil del mes (el RETA), sense festius,
 * és la data prudent i l'ocurrència ho diu a `prudencia`.
 *
 * El calendari d'un any són els venciments que cauen dins d'eixe any: el
 * gener porta el 4T i els resums de l'exercici anterior. La renovació d'una
 * marca hi és mentre la seua finestra o el seu període de gràcia toquen
 * l'any. JS pur: sense DOM, React ni xarxa.
 */
import { comprovaClaus, comprovaData, comprovaId, comprovaText, congela, esObjecte, llancaSiCal, VERIFICAR } from '../../identitat/nucli/guardes.js';
import { esTitular } from '../../identitat/nucli/titular.js';
import { calendariDe, dataIso, festiusCarregats, habilCapArrere, primerHabil, sumaMesos, ultimDiaDelMes } from './terminis.js';

export const PRESENTADORS = Object.freeze(['gestoria', 'titular']);
export const APLICA = Object.freeze(['si', 'no', 'cal-verificar']);
export const REGIMS_IVA = Object.freeze(['general', 'simplificat', 'recarrec', 'exempt']);
export const ESTIMACIONS_IRPF = Object.freeze(['directa', 'objectiva']);

const AEAT = 'Calendari del contribuent, a la seu electrònica de l’AEAT';
const obligacio = (dades) => Object.freeze({ ...dades, ambits: Object.freeze(dades.ambits), font: Object.freeze(dades.font), verificar: VERIFICAR });

export const OBLIGACIONS = Object.freeze([
  obligacio({
    id: 'aeat-303', model: '303', nom: 'IVA · autoliquidació', categoria: 'fiscal', organisme: 'AEAT', periodicitat: 'trimestral',
    ambits: ['ACTIVITAT', 'ENTITAT'],
    aQui: 'Qui fa una activitat subjecta a l’IVA en règim general o simplificat. No el presenta qui només fa operacions exemptes sense dret a deduir ni qui ven en recàrrec d’equivalència.',
    presentaPerDefecte: 'gestoria',
    font: { norma: 'Llei 37/1992 de l’IVA i el seu Reglament (RD 1624/1992)', consulta: AEAT },
    nota: 'Del 4T, fins al 30 de gener. Amb domiciliació, el termini tanca uns dies abans.'
  }),
  obligacio({
    id: 'aeat-130', model: '130', nom: 'IRPF · pagament fraccionat', categoria: 'fiscal', organisme: 'AEAT', periodicitat: 'trimestral',
    ambits: ['ACTIVITAT'],
    aQui: 'La persona autònoma en estimació directa. No el presenta la professional que l’any anterior va tindre retenció en almenys el 70 % dels ingressos; en mòduls, el model és el 131.',
    presentaPerDefecte: 'gestoria',
    font: { norma: 'Llei 35/2006 de l’IRPF i el seu Reglament (RD 439/2007), pagaments fraccionats', consulta: AEAT },
    nota: 'Del 4T, fins al 30 de gener. Amb domiciliació, el termini tanca uns dies abans.'
  }),
  obligacio({
    id: 'aeat-349', model: '349', nom: 'Declaració recapitulativa d’operacions intracomunitàries', categoria: 'fiscal', organisme: 'AEAT', periodicitat: 'trimestral',
    ambits: ['ACTIVITAT', 'ENTITAT'],
    aQui: 'Qui fa entregues, adquisicions o prestacions de servei amb empreses d’altres estats de la UE.',
    presentaPerDefecte: 'gestoria',
    font: { norma: 'Reglament de l’IVA (RD 1624/1992), declaració recapitulativa', consulta: AEAT },
    nota: 'Trimestral mentre les operacions no passen de 50.000 € per trimestre; si passen, és mensual i este calendari no la cobrix.'
  }),
  obligacio({
    id: 'aeat-390', model: '390', nom: 'IVA · resum anual', categoria: 'fiscal', organisme: 'AEAT', periodicitat: 'anual-gener',
    ambits: ['ACTIVITAT', 'ENTITAT'],
    aQui: 'Qui presenta el 303, llevat de les exoneracions (per exemple, qui porta el SII).',
    presentaPerDefecte: 'gestoria',
    font: { norma: 'Reglament de l’IVA (RD 1624/1992), resum anual', consulta: AEAT },
    nota: 'De l’exercici anterior, de l’1 al 30 de gener.'
  }),
  obligacio({
    id: 'aeat-347', model: '347', nom: 'Declaració anual d’operacions amb terceres persones', categoria: 'fiscal', organisme: 'AEAT', periodicitat: 'anual-febrer',
    ambits: ['ACTIVITAT', 'ENTITAT'],
    aQui: 'Qui ha fet operacions amb una mateixa persona o entitat per damunt de 3.005,06 € en l’any.',
    presentaPerDefecte: 'gestoria',
    font: { norma: 'Reglament general de gestió i inspecció tributària (RD 1065/2007)', consulta: AEAT },
    nota: 'De l’exercici anterior, durant el febrer.'
  }),
  obligacio({
    id: 'aeat-100', model: '100', nom: 'IRPF · declaració de la renda', categoria: 'fiscal', organisme: 'AEAT', periodicitat: 'renda',
    ambits: ['LLAR', 'ACTIVITAT'],
    aQui: 'La persona amb rendiments d’activitats econòmiques; la resta, segons els llindars de rendes de cada any.',
    presentaPerDefecte: 'gestoria',
    font: { norma: 'Llei 35/2006 de l’IRPF i l’orde anual de la campanya de la renda', consulta: AEAT },
    nota: 'De l’exercici anterior, fins al 30 de juny. L’inici de la campanya el fixa l’orde de cada any; amb domiciliació, tanca uns dies abans.'
  }),
  obligacio({
    id: 'tgss-reta', model: null, nom: 'Cotització del RETA', categoria: 'cotitzacio', organisme: 'TGSS', periodicitat: 'mensual',
    ambits: ['ACTIVITAT'],
    aQui: 'La persona donada d’alta en el règim especial de treball autònom.',
    presentaPerDefecte: 'titular',
    font: { norma: 'Llei general de la Seguretat Social (RDL 8/2015) i Reglament general de recaptació (RD 1415/2004)', consulta: 'Seu electrònica de la TGSS (Importass)' },
    nota: 'Es carrega per domiciliació l’últim dia hàbil del mes: cal saldo al compte.'
  }),
  obligacio({
    id: 'suma-tributs-locals', model: null, nom: 'Tributs locals (IBI, vehicles, IAE, taxes)', categoria: 'tributs-locals', organisme: 'SUMA', periodicitat: 'extern',
    ambits: ['LLAR', 'ACTIVITAT', 'ENTITAT'],
    aQui: 'Qui té béns, vehicles o activitat en un municipi que gestiona els tributs amb SUMA.',
    presentaPerDefecte: 'titular',
    font: { norma: 'Llei reguladora de les hisendes locals (RDL 2/2004) i les ordenances de cada municipi', consulta: 'Calendari fiscal anual de SUMA Gestió Tributària (Diputació d’Alacant)' },
    nota: 'Els períodes de cobrament els publica SUMA cada any i per municipi: es carreguen, no s’inventen.',
    carrega: 'Carrega el calendari fiscal de SUMA de l’any: cada municipi té els seus períodes de cobrament.'
  }),
  /* MAPA de l'empresa, §4 pas 4. La data de cada renovació la porta el
     document de la demanda: es carrega, i no es corre mai (correSiInhabil
     fals), perquè una data que dona l'organisme no es pot fer més tardana. */
  obligacio({
    id: 'ocupacio-renovacio-demanda', model: null, nom: 'Renovació de la demanda d’ocupació', categoria: 'administratiu', organisme: 'LABORA', periodicitat: 'extern',
    ambits: ['LLAR', 'ACTIVITAT'],
    aQui: 'La persona inscrita com a demandant d’ocupació, cobre o no una prestació.',
    presentaPerDefecte: 'titular',
    font: { norma: 'Llei 3/2023 d’ocupació i les normes del servei públic d’ocupació de cada comunitat', consulta: 'El document de la demanda (DARDE), amb la data de la pròxima renovació, i la seu electrònica de LABORA' },
    nota: 'A verificar: la data i la manera de renovar canvien amb cada renovació i amb cada servei d’ocupació. Si no es renova a temps, la demanda cau i es poden perdre la prestació i l’antiguitat.',
    carrega: 'Carrega la data de la pròxima renovació que porta el document de la demanda d’ocupació.',
    correSiInhabil: false
  }),
  obligacio({
    id: 'oepm-renovacio-marca', model: null, nom: 'Renovació de marca', categoria: 'propietat-industrial', organisme: 'OEPM', periodicitat: 'marca',
    ambits: ['ACTIVITAT', 'ENTITAT'],
    aQui: 'Qui és titular d’una marca registrada a l’OEPM.',
    presentaPerDefecte: 'titular',
    font: { norma: 'Llei 17/2001 de Marques (durada i renovació)', consulta: 'Seu electrònica de l’OEPM' },
    nota: 'La marca dura 10 anys des de la sol·licitud. La renovació es demana en els 6 mesos d’abans del venciment i, amb recàrrec, en els 6 de després.'
  })
]);

const PER_ID = new Map(OBLIGACIONS.map((ob) => [ob.id, ob]));

/* ── Les regles d'aplicació: (perfil) → [aplica, motiu] ─────────────────── */

const empresa = (perfil) => perfil.titular.ambit === 'ACTIVITAT' || perfil.titular.ambit === 'ENTITAT';
const perDada = (valor, si, no, falta) => (valor === true ? ['si', si] : valor === false ? ['no', no] : ['cal-verificar', falta]);

const REGLES = Object.freeze({
  'aeat-303': (perfil) => {
    if (!empresa(perfil)) return ['no', 'L’IVA és de l’activitat o de l’entitat, no de la llar.'];
    if (perfil.regimIva === 'general' || perfil.regimIva === 'simplificat') return ['si', 'Activitat subjecta a l’IVA.'];
    if (perfil.regimIva === 'exempt') return ['no', 'Activitat exempta sense dret a deduir: no presenta el 303.'];
    if (perfil.regimIva === 'recarrec') return ['no', 'En recàrrec d’equivalència no es presenta el 303 per eixa activitat.'];
    return ['cal-verificar', 'Falta el règim d’IVA del titular.'];
  },
  'aeat-130': (perfil) => {
    if (perfil.titular.ambit !== 'ACTIVITAT') return ['no', 'El 130 és de la persona autònoma.'];
    if (perfil.estimacioIrpf === 'objectiva') return ['no', 'En estimació objectiva (mòduls) el model és el 131, fora d’este catàleg.'];
    if (perfil.estimacioIrpf !== 'directa') return ['cal-verificar', 'Falta el mètode d’estimació de l’IRPF.'];
    return perDada(perfil.retencio70 == null ? null : !perfil.retencio70,
      'Estimació directa sense retenció en el 70 % dels ingressos.',
      'Professional amb retenció en almenys el 70 % dels ingressos de l’any anterior: no hi ha obligació.',
      'Falta saber si almenys el 70 % dels ingressos de l’any anterior van portar retenció.');
  },
  'aeat-349': (perfil) => (empresa(perfil)
    ? perDada(perfil.intracomunitari, 'Hi ha operacions intracomunitàries.', 'Sense operacions intracomunitàries.', 'Falta saber si hi ha operacions amb altres estats de la UE.')
    : ['no', 'És de l’activitat o de l’entitat, no de la llar.']),
  'aeat-390': (perfil) => {
    const [aplica] = REGLES['aeat-303'](perfil);
    if (aplica === 'si') return ['si', 'Qui presenta el 303 presenta el resum anual, llevat de les exoneracions.'];
    return aplica === 'no' ? ['no', 'No presenta el 303.'] : ['cal-verificar', 'Depén del 303, que encara cal verificar.'];
  },
  'aeat-347': (perfil) => (empresa(perfil)
    ? perDada(perfil.operacionsAmbTercers, 'Hi ha operacions amb terceres persones per damunt del llindar.', 'Cap operació amb una mateixa persona passa del llindar.', 'Falta saber si alguna operació amb una mateixa persona passa del llindar.')
    : ['no', 'És de l’activitat o de l’entitat, no de la llar.']),
  'aeat-100': (perfil) => {
    if (perfil.titular.tipus === 'entitat') return ['no', 'Les entitats no fan la renda; l’Impost sobre Societats és fora d’este catàleg.'];
    if (perfil.titular.ambit === 'ACTIVITAT') return ['si', 'Amb rendiments d’activitats econòmiques cal declarar.'];
    return ['cal-verificar', 'Depén dels llindars de rendes de cada any.'];
  },
  'tgss-reta': (perfil) => (perfil.titular.ambit === 'ACTIVITAT'
    ? perDada(perfil.reta, 'Alta al RETA.', 'Sense alta al RETA.', 'Falta saber si hi ha alta al RETA.')
    : ['no', 'El RETA és de la persona autònoma.']),
  'suma-tributs-locals': (perfil) => perDada(perfil.tributsLocals, 'Té tributs locals amb SUMA.', 'Cap tribut local amb SUMA.', 'Falta saber si té tributs locals amb SUMA.'),
  'ocupacio-renovacio-demanda': (perfil) => (perfil.titular.tipus === 'entitat'
    ? ['no', 'La demanda d’ocupació és d’una persona, no d’una entitat.']
    : perDada(perfil.demandaOcupacio, 'Inscrita com a demandant d’ocupació: cal renovar la demanda a temps.', 'Sense demanda d’ocupació.', 'Falta saber si hi ha una demanda d’ocupació inscrita.')),
  'oepm-renovacio-marca': (perfil) => {
    if (!empresa(perfil)) return ['no', 'Les marques són de l’activitat o de l’entitat.'];
    if (!Array.isArray(perfil.marques)) return ['cal-verificar', 'Falta la llista de marques, amb la data de sol·licitud.'];
    return perfil.marques.length ? ['si', 'Té marques registrades.'] : ['no', 'Cap marca registrada.'];
  }
});

/* ── El perfil del titular ───────────────────────────────────────────────── */

const CLAUS_PERFIL = Object.freeze([
  'titular', 'regimIva', 'estimacioIrpf', 'retencio70', 'intracomunitari', 'operacionsAmbTercers', 'reta', 'tributsLocals', 'demandaOcupacio', 'marques', 'quiPresenta'
]);
const BOOLEANS = Object.freeze(['retencio70', 'intracomunitari', 'operacionsAmbTercers', 'reta', 'tributsLocals', 'demandaOcupacio']);

/**
 * Els errors del perfil, sense llançar. El perfil porta el titular (creat
 * amb creaTitular) i els fets que decidixen què s'hi aplica; una dada que
 * falta (null o absent) no és un error: fa que l'obligació siga «cal-verificar».
 */
export function validaPerfil(perfil) {
  const errors = [];
  if (!esObjecte(perfil)) return [{ codi: 'PERFIL_INVALID', camp: 'perfil', missatge: 'El perfil ha de ser un objecte.' }];
  comprovaClaus(perfil, CLAUS_PERFIL, 'perfil', errors);
  if (!esTitular(perfil.titular)) errors.push({ codi: 'TITULAR_INVALID', camp: 'perfil.titular', missatge: 'El titular s’ha de crear amb creaTitular.' });
  if (perfil.regimIva != null && !REGIMS_IVA.includes(perfil.regimIva)) errors.push({ codi: 'VALOR_INVALID', camp: 'perfil.regimIva', missatge: `El règim d’IVA és un de: ${REGIMS_IVA.join(', ')}.` });
  if (perfil.estimacioIrpf != null && !ESTIMACIONS_IRPF.includes(perfil.estimacioIrpf)) {
    errors.push({ codi: 'VALOR_INVALID', camp: 'perfil.estimacioIrpf', missatge: `L’estimació és ${ESTIMACIONS_IRPF.join(' o ')}.` });
  }
  for (const camp of BOOLEANS) {
    if (perfil[camp] != null && typeof perfil[camp] !== 'boolean') errors.push({ codi: 'VALOR_INVALID', camp: `perfil.${camp}`, missatge: `${camp} és cert, fals o desconegut (null).` });
  }
  if (perfil.marques != null) {
    if (!Array.isArray(perfil.marques)) errors.push({ codi: 'VALOR_INVALID', camp: 'perfil.marques', missatge: 'Les marques són una llista de { id, sollicitud }.' });
    else {
      const ids = new Set();
      perfil.marques.forEach((marca, i) => {
        if (!esObjecte(marca)) {
          errors.push({ codi: 'VALOR_INVALID', camp: `perfil.marques[${i}]`, missatge: 'Cada marca és { id, sollicitud }.' });
          return;
        }
        comprovaClaus(marca, ['id', 'sollicitud'], `perfil.marques[${i}]`, errors);
        if (comprovaId(marca.id, `perfil.marques[${i}].id`, errors) && ids.has(marca.id)) {
          errors.push({ codi: 'ID_REPETIT', camp: `perfil.marques[${i}].id`, missatge: `La marca ${marca.id} es repetix.` });
        }
        ids.add(marca.id);
        comprovaData(marca.sollicitud, `perfil.marques[${i}].sollicitud`, errors, { obligatori: true });
      });
    }
  }
  if (perfil.quiPresenta != null) {
    if (!esObjecte(perfil.quiPresenta)) errors.push({ codi: 'VALOR_INVALID', camp: 'perfil.quiPresenta', missatge: 'quiPresenta és { idObligacio: gestoria o titular }.' });
    else {
      for (const [id, qui] of Object.entries(perfil.quiPresenta)) {
        if (!PER_ID.has(id)) errors.push({ codi: 'OBLIGACIO_DESCONEGUDA', camp: `perfil.quiPresenta.${id}`, missatge: `No hi ha cap obligació «${id}».` });
        if (!PRESENTADORS.includes(qui)) errors.push({ codi: 'VALOR_INVALID', camp: `perfil.quiPresenta.${id}`, missatge: 'La presenta la gestoria o el titular.' });
      }
    }
  }
  return errors;
}

const presentaDe = (ob, perfil) => perfil.quiPresenta?.[ob.id] ?? ob.presentaPerDefecte;

/**
 * Totes les obligacions del catàleg per a un perfil, amb si s'hi aplica i per què.
 * @returns {ReadonlyArray<{ obligacio: string, aplica: string, motiu: string, presenta: string }>}
 */
export function aplicabilitat(perfil) {
  llancaSiCal(validaPerfil(perfil), 'PERFIL_INVALID', 'El perfil no és vàlid');
  return congela(OBLIGACIONS.map((ob) => {
    const [aplica, motiu] = REGLES[ob.id](perfil);
    return { obligacio: ob.id, aplica, motiu, presenta: presentaDe(ob, perfil) };
  }));
}

/* ── Les finestres de presentació d'un any ───────────────────────────────── */

const TRIMESTRES = Object.freeze([
  Object.freeze({ periode: '4T', anterior: true, mes: 1, diaFi: 30 }),
  Object.freeze({ periode: '1T', anterior: false, mes: 4, diaFi: 20 }),
  Object.freeze({ periode: '2T', anterior: false, mes: 7, diaFi: 20 }),
  Object.freeze({ periode: '3T', anterior: false, mes: 10, diaFi: 20 })
]);

const ANYS_MARCA = 10;
const MESOS_FINESTRA_MARCA = 6;

function finestresDeMarques(any, marques) {
  const finestres = [];
  const fiDeLany = dataIso(any, 12, 31);
  const iniciDeLany = dataIso(any, 1, 1);
  for (const marca of marques) {
    for (let k = 1; k <= 100; k += 1) {
      const venciment = sumaMesos(marca.sollicitud, 12 * ANYS_MARCA * k);
      const inici = sumaMesos(venciment, -MESOS_FINESTRA_MARCA);
      const fiGracia = sumaMesos(venciment, MESOS_FINESTRA_MARCA);
      if (inici > fiDeLany) break;
      if (fiGracia < iniciDeLany) continue;
      finestres.push({ clau: `${marca.id}:${venciment}`, exercici: Number(venciment.slice(0, 4)), periode: `${ANYS_MARCA * k} anys`, inici, fi: venciment, fiGracia });
    }
  }
  return finestres;
}

const FINESTRES = Object.freeze({
  trimestral: (any) => TRIMESTRES.map(({ periode, anterior, mes, diaFi }) => {
    const exercici = anterior ? any - 1 : any;
    return { clau: `${exercici}:${periode}`, exercici, periode, inici: dataIso(any, mes, 1), fi: dataIso(any, mes, diaFi) };
  }),
  'anual-gener': (any) => [{ clau: `${any - 1}:anual`, exercici: any - 1, periode: 'anual', inici: dataIso(any, 1, 1), fi: dataIso(any, 1, 30) }],
  'anual-febrer': (any) => [{ clau: `${any - 1}:anual`, exercici: any - 1, periode: 'anual', inici: dataIso(any, 2, 1), fi: ultimDiaDelMes(any, 2) }],
  renda: (any) => [{ clau: `${any - 1}:anual`, exercici: any - 1, periode: 'anual', inici: null, fi: dataIso(any, 6, 30) }],
  mensual: (any) => Array.from({ length: 12 }, (_, i) => {
    const mes = String(i + 1).padStart(2, '0');
    return { clau: `${any}:${mes}`, exercici: any, periode: mes, inici: dataIso(any, i + 1, 1), fi: ultimDiaDelMes(any, i + 1), sentit: -1 };
  }),
  extern: (any, perfil, externes) => (externes ?? [])
    .filter((f) => f.fi.slice(0, 4) === String(any))
    .map((f, i) => ({ clau: `${any}:${i + 1}`, exercici: any, periode: f.periode.trim(), inici: f.inici ?? null, fi: f.fi })),
  marca: (any, perfil) => finestresDeMarques(any, Array.isArray(perfil.marques) ? perfil.marques : [])
});

/* Quan falten les dades per a saber les finestres, l'obligació no desapareix:
   queda una ocurrència sense venciment que diu què cal carregar (el text
   `carrega` de cada obligació amb calendari extern). */
const PENDENTS = Object.freeze({
  extern: (perfil, finestres, ob) => (finestres.length ? null : ob.carrega),
  marca: (perfil) => (Array.isArray(perfil.marques) ? null : 'Afig les marques amb la data de sol·licitud.')
});

function comprovaExternes(finestresExternes, errors) {
  if (finestresExternes === undefined) return;
  if (!esObjecte(finestresExternes)) {
    errors.push({ codi: 'EXTERNES_INVALIDES', camp: 'finestresExternes', missatge: 'Les finestres externes són { idObligacio: [{ periode, inici, fi }] }.' });
    return;
  }
  for (const [id, llista] of Object.entries(finestresExternes)) {
    if (PER_ID.get(id)?.periodicitat !== 'extern') {
      errors.push({ codi: 'OBLIGACIO_DESCONEGUDA', camp: `finestresExternes.${id}`, missatge: `«${id}» no és una obligació amb calendari extern.` });
      continue;
    }
    if (!Array.isArray(llista)) {
      errors.push({ codi: 'EXTERNES_INVALIDES', camp: `finestresExternes.${id}`, missatge: 'Cal una llista de finestres.' });
      continue;
    }
    llista.forEach((f, i) => {
      const camp = `finestresExternes.${id}[${i}]`;
      if (!esObjecte(f)) {
        errors.push({ codi: 'EXTERNES_INVALIDES', camp, missatge: 'Cada finestra és { periode, inici, fi }.' });
        return;
      }
      comprovaClaus(f, ['periode', 'inici', 'fi'], camp, errors);
      comprovaText(f.periode, `${camp}.periode`, errors, { obligatori: true, maxim: 40 });
      const inici = comprovaData(f.inici, `${camp}.inici`, errors);
      const fi = comprovaData(f.fi, `${camp}.fi`, errors, { obligatori: true });
      if (inici && fi && inici > fi) errors.push({ codi: 'DATES_INCOHERENTS', camp, missatge: 'La finestra comença després d’acabar.' });
    });
  }
}

/* El venciment d'una finestra i, si és la data prudent d'una cerca cap
   arrere sense festius, l'avís que ho diu. Una data que dona l'organisme i
   que no es corre (correSiInhabil fals) es queda tal qual. */
function vencimentDe(ob, finestra, cal) {
  if (!finestra.fi) return { venciment: null, prudencia: null };
  if (finestra.sentit === -1) {
    const { data, avis } = habilCapArrere(finestra.fi, { calendari: cal });
    return { venciment: data, prudencia: avis };
  }
  if (ob.correSiInhabil === false) return { venciment: finestra.fi, prudencia: null };
  return { venciment: primerHabil(finestra.fi, { calendari: cal }), prudencia: null };
}

function ocurrencia(ob, perfil, [aplica, motiu], finestra, cal) {
  const { venciment, prudencia } = vencimentDe(ob, finestra, cal);
  return {
    id: `${ob.id}:${finestra.clau}`,
    obligacio: ob.id,
    model: ob.model,
    nom: ob.nom,
    categoria: ob.categoria,
    organisme: ob.organisme,
    titular: perfil.titular.id,
    exercici: finestra.exercici,
    periode: finestra.periode,
    inici: finestra.inici,
    venciment,
    vencimentSenseCorrer: finestra.fi,
    corregut: venciment !== finestra.fi,
    prudencia,
    gracia: finestra.fiGracia ? { fins: primerHabil(finestra.fiGracia, { calendari: cal }), ambRecarrec: true } : null,
    pendent: finestra.pendent ?? null,
    aplica,
    motiu,
    presenta: presentaDe(ob, perfil),
    nota: ob.nota,
    font: ob.font,
    verificar: VERIFICAR
  };
}

const perVenciment = (x, y) => {
  if (x.venciment !== y.venciment) {
    if (x.venciment === null) return 1;
    if (y.venciment === null) return -1;
    return x.venciment < y.venciment ? -1 : 1;
  }
  return x.id < y.id ? -1 : x.id > y.id ? 1 : 0;
};

/**
 * El calendari d'obligacions d'un any per a un perfil: les ocurrències que
 * vencen dins de l'any (ordenades per venciment; les pendents de dades, al
 * final) i les obligacions descartades, amb el motiu.
 * @param {number} any
 * @param {object} perfil vegeu validaPerfil
 * @param {{ calendari?: object, finestresExternes?: object }} opcions
 */
export function calendariObligacions(any, perfil, { calendari, finestresExternes } = {}) {
  if (!Number.isInteger(any) || any < 2000 || any > 9998) throw new RangeError('L’any del calendari té quatre xifres.');
  const errors = validaPerfil(perfil);
  comprovaExternes(finestresExternes, errors);
  llancaSiCal(errors, 'PERFIL_INVALID', 'No es pot fer el calendari');
  const cal = calendariDe(calendari);
  const ocurrencies = [];
  const descartades = [];
  for (const ob of OBLIGACIONS) {
    const regla = REGLES[ob.id](perfil);
    if (regla[0] === 'no') {
      descartades.push({ obligacio: ob.id, motiu: regla[1] });
      continue;
    }
    const finestres = FINESTRES[ob.periodicitat](any, perfil, finestresExternes?.[ob.id]);
    const pendent = PENDENTS[ob.periodicitat]?.(perfil, finestres, ob) ?? null;
    if (pendent) finestres.push({ clau: `${any}:pendent`, exercici: any, periode: null, inici: null, fi: null, pendent });
    for (const finestra of finestres) ocurrencies.push(ocurrencia(ob, perfil, regla, finestra, cal));
  }
  return congela({
    any,
    titular: perfil.titular.id,
    festiusCarregats: festiusCarregats(cal),
    ocurrencies: ocurrencies.sort(perVenciment),
    descartades,
    verificar: VERIFICAR
  });
}
