/**
 * P0-86 (Onada R17 · Carril 3) · Model Longitudinal de Revisions Periòdiques
 * i Projecció de la Fitxa Oficial d'Inventari i Inspecció CIEF (Versió 232).
 *
 * Basat en la fitxa d'inventari i inspecció del Centre per a la Investigació i
 * l'Experimentació Forestal (CIEF · Generalitat Valenciana, versió 232), amb la
 * Llei 4/2006 de Patrimoni Arbori Monumental de la Comunitat Valenciana com a
 * marc, i en les campanyes documentades per l'Associació Cultural i
 * Mediambiental El Rentonar (2007, 2020 i 2024).
 */
import { CATEGORIES_CANONIQUES_BASE } from '../taxonomia/vocabulariCanonic.js';
import { ARBRES_MONUMENTALS_2020, LLICENCIA_CATALEG_ARBRES } from './arbresMonumentals2020.js';

const congela = (valor) => {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    for (const fill of Object.values(valor)) congela(fill);
    Object.freeze(valor);
  }
  return valor;
};

/** Escala oficial d'afectació del camp 20 de la Fitxa CIEF v232. */
export const ESCALA_AFECTACIO_CIEF = Object.freeze(['NO', 'LLEU', 'MODERADA', 'GREU']);

/** Intervals configurables de revisió periòdica de salut arbòria (en anys). */
export const INTERVALS_REVISIO_ANYS = Object.freeze([5, 10, 15, 25]);

export const INTERVAL_REVISIO_PER_DEFECTE = 10;

const PES_AFECTACIO = Object.freeze({
  NO: 0,
  LLEU: 1,
  MODERADA: 2,
  GREU: 3
});

/** Els 24 camps numerats oficials de la Fitxa d'Inventari - Inspecció CIEF v232. */
export const CAMPS_OFICIALS_CIEF_V232 = congela([
  { numero: 1, clau: 'ipa', titol: '1. IPA (Índex de Patrimoni Arbori)', obligatori: false },
  { numero: 2, clau: 'especie', titol: '2. *Espècie (nom científic)', obligatori: true },
  { numero: 3, clau: 'nomPopular', titol: '3. Nom popular i denominació local', obligatori: false },
  { numero: 4, clau: 'coordenadesUtm', titol: '4. *Coordenades UTM ETRS89 fus 30 (X, Y, Z)', obligatori: true },
  { numero: 5, clau: 'municipi', titol: '5. Municipi', obligatori: false },
  { numero: 6, clau: 'paratge', titol: '6. Paratge', obligatori: false },
  { numero: 7, clau: 'cadastre', titol: '7. Dades cadastrals (polígon, parcel·la, àmbit)', obligatori: false },
  { numero: 8, clau: 'titularitat', titol: '8. Titularitat i règim d’accés', obligatori: false },
  { numero: 9, clau: 'dataPresaDades', titol: '9. *Data de presa de dades', obligatori: true },
  { numero: 10, clau: 'observador', titol: '10. *Observador responsable', obligatori: true },
  { numero: 11, clau: 'contacteObservador', titol: '11. Entitat observadora (contacte institucional)', obligatori: false },
  { numero: 12, clau: 'numPeus', titol: '12. *Núm. de peus o braços per sota d’1,30 m', obligatori: true },
  { numero: 13, clau: 'perimetreTroncCm', titol: '13. *Perímetre/s de tronc a 1,30 m (cm)', obligatori: true },
  { numero: 14, clau: 'alcadaTotalM', titol: '14. *Alçada total / estípit (m)', obligatori: true },
  { numero: 15, clau: 'copaDiametreMajorM', titol: '15. *Diàmetre major de copa (m)', obligatori: true },
  { numero: 16, clau: 'copaPerpendicularM', titol: '16. Diàmetre perpendicular de copa (m)', obligatori: false },
  { numero: 17, clau: 'anyNaixencaOEdat', titol: '17. Any de naixença / plantació o edat estimada', obligatori: false },
  { numero: 18, clau: 'metodeDatacio', titol: '18. Font o mètode de datació', obligatori: false },
  { numero: 19, clau: 'altresValors', titol: '19. Altres valors (històric, cultural, paisatgístic, ecològic)', obligatori: false },
  { numero: 20, clau: 'inspeccioIAfectacio', titol: '20. Inspecció visual i afectació (Vitalitat · Sanitat · Estructura)', obligatori: true },
  { numero: 21, clau: 'amenaces', titol: '21. Amenaces detectades (risc, símptomes i causes)', obligatori: false },
  { numero: 22, clau: 'mesuresConservacio', titol: '22. Mesures de conservació propostes', obligatori: false },
  { numero: 23, clau: 'mortODesaparicio', titol: '23. Cas de mort o desaparició (data, evidències, causa)', obligatori: false },
  { numero: 24, clau: 'notesDeCamp', titol: '24. Notes de camp i observacions', obligatori: false }
]);

const NOTES_SEGUIMENT_2020_PER_ID = Object.freeze({
  'arbre-01-albers-blancs-del-pont': 'Seguiment visual i fotogràfic de camp (08/05/2020): es mantenen els dos exemplars a l’entrada del pont amb capçada vigorosa de primavera.',
  'arbre-11-oms-de-la-placa-de-l-esglesia': 'Seguiment visual i fotogràfic de camp (08/05/2020): fullatge primaveral actiu sense col·lapse per grafiosi i convivència amb la façana parroquial.',
  'arbre-14-pi-del-pla-verd': 'Seguiment visual i fotogràfic de camp (29/02/2020): conserva la silueta recorbada històrica davant l’era del Mas del Pla Verd; cal mantenir vigilància estructural dels braços pesants.',
  'arbre-17-xiprer-de-la-foia': 'Seguiment visual i fotogràfic de camp (08/05/2020): port columnar íntegre junt a l’antiga bassa de la circumval·lació.',
  'arbre-18-xiprers-del-calvari': 'Seguiment visual i fotogràfic de camp (08/05/2020): continuïtat paisatgística de la doble alineació de xiprers vells i joves al passeig del Calvari.',
  'arbre-19-xiprers-del-cementeri': 'Seguiment visual i fotogràfic de camp (08/05/2020): es conserva l’alineació central del recinte funerari; resta pendent l’amidament dendromètric instrumental individualitzat.'
});

function construeixHistorialArbre(arbre) {
  const llista = [
    {
      idRevisio: `${arbre.id}-rev-2007`,
      any: 2007,
      data: '2007-05-19',
      tipus: 'Catalogació tècnica base (Ple 07/09/2007)',
      observador: 'Pedro Ferrer Rodríguez (Enginyer Tècnic Forestal i Biòleg) · Associació El Rentonar',
      modalitatInspeccio: 'Inspecció visual des del sòl i amidament dendromètric base',
      dimensions: arbre.dimensions2007,
      afectacio: null,
      resum: arbre.conservacio2007.estatSalut,
      amenaces: arbre.conservacio2007.amenaces,
      mesures: arbre.conservacio2007.mesuresPropostes,
      fotoEvidencia: arbre.fotos.foto2007
    }
  ];

  if (arbre.fotos.foto2020 && arbre.fotos.dataFoto2020) {
    llista.push({
      idRevisio: `${arbre.id}-rev-2020`,
      any: 2020,
      data: arbre.fotos.dataFoto2020,
      tipus: 'Revisió fotogràfica i edició documental 2020',
      observador: 'Associació Cultural i Mediambiental El Rentonar',
      modalitatInspeccio: 'Documentació fotogràfica de l’edició 2020',
      dimensions: null,
      afectacio: null,
      resum: NOTES_SEGUIMENT_2020_PER_ID[arbre.id] || 'Seguiment fotogràfic incorporat a l’edició 2020 del catàleg.',
      amenaces: arbre.conservacio2007.amenaces,
      mesures: arbre.conservacio2007.mesuresPropostes,
      fotoEvidencia: arbre.fotos.foto2020
    });
  }

  if (arbre.id === 'arbre-02-alborc-del-xipreret') {
    llista.push({
      idRevisio: `${arbre.id}-rev-2024-xylella`,
      any: 2024,
      data: '2024-09-22',
      tipus: 'Avís fitosanitari documentat el 2024',
      observador: 'Associació Cultural i Mediambiental El Rentonar',
      modalitatInspeccio: 'Crònica documental de l’Associació El Rentonar',
      dimensions: null,
      afectacio: null,
      /* R19 · La crònica només acredita el contagi i el tractament: amenaces i mesures sense dada verificada. */
      resum: 'Contagi de Xylella fastidiosa comunicat per El Rentonar el 22/09/2024 (crònica «La Xilella arriba al Cipreret»); en la data de la crònica estava en tractament amb productes fitosanitaris.',
      amenaces: null,
      mesures: null,
      fotoEvidencia: arbre.fotos.fotoDetall2007
    });
  }

  return llista;
}

export const REVISIONS_ARBRES_LA_TORRE = congela(
  Object.fromEntries(
    ARBRES_MONUMENTALS_2020.map((arbre) => [arbre.id, construeixHistorialArbre(arbre)])
  )
);

export function revisionsDeLArbre(arbreOId) {
  const id = typeof arbreOId === 'string' ? arbreOId : arbreOId?.id;
  return (id && REVISIONS_ARBRES_LA_TORRE[id]) ? REVISIONS_ARBRES_LA_TORRE[id] : [];
}

function afectacioMaxima(afectacio) {
  const nivells = [afectacio?.vitalitat, afectacio?.sanitat, afectacio?.estructura]
    .filter((v) => Object.hasOwn(PES_AFECTACIO, v));
  if (!nivells.length) return null;
  return nivells.reduce((millor, actual) => (
    PES_AFECTACIO[actual] > PES_AFECTACIO[millor] ? actual : millor
  ), 'NO');
}

/**
 * Calcula la síntesi longitudinal (2007 -> 2020 -> anyReferencia) i la pròxima
 * revisió programada segons l'interval periòdic triat (5 | 10 | 15 | 25 anys).
 */
export function calculaDeltaLongitudinalArbre(
  arbre,
  intervalAnys = INTERVAL_REVISIO_PER_DEFECTE,
  anyReferencia = 2026
) {
  const intervalNet = INTERVALS_REVISIO_ANYS.includes(Number(intervalAnys))
    ? Number(intervalAnys)
    : INTERVAL_REVISIO_PER_DEFECTE;
  const historial = revisionsDeLArbre(arbre);
  const primera = historial[0] || null;
  const ultima = historial[historial.length - 1] || null;
  const anyBase = primera?.any ?? 2007;
  const ultimaMesura = historial.filter(revisio => revisio.dimensions !== null).at(-1);
  const anyUltima = ultimaMesura?.any ?? anyBase;
  const anyProximaRevisio = anyUltima + intervalNet;
  const anysTranscorregutsBase = Math.max(0, anyReferencia - anyBase);
  const anysDesDUltimaRevisio = Math.max(0, anyReferencia - anyUltima);
  const margeAnys = anyProximaRevisio - anyReferencia;

  const nivellInicial = afectacioMaxima(primera?.afectacio);
  const nivellActual = afectacioMaxima(ultima?.afectacio);
  const deltaGravetat = nivellInicial && nivellActual ? PES_AFECTACIO[nivellActual] - PES_AFECTACIO[nivellInicial] : null;

  let estatCalendari = 'AL_DIA';
  if (arbre?.id === 'arbre-02-alborc-del-xipreret' || nivellActual === 'GREU') {
    estatCalendari = 'ALERTA_FITOSANITARIA';
  } else if (margeAnys < 0) {
    estatCalendari = 'VENCUDA';
  } else if (margeAnys <= 1) {
    estatCalendari = 'PROPERA';
  }

  let tendeciaText = 'Qualificació CIEF i comparativa sanitària pendents de campanya documentada';
  if (deltaGravetat !== null && deltaGravetat > 0) {
    tendeciaText = ` Increment d’afectació CIEF (${nivellInicial} → ${nivellActual}): requerix vigilància prioritària`;
  } else if (nivellActual === 'GREU') {
    tendeciaText = 'Estat crític ja consignat a la línia base 2007: requerix inspecció de supervivència in situ';
  }

  return {
    intervalAnys: intervalNet,
    anyBase,
    anyUltimaRevisio: anyUltima,
    anyReferencia,
    anyProximaRevisio,
    anysTranscorregutsBase,
    anysDesDUltimaRevisio,
    margeAnys,
    totalRevisions: historial.length,
    fitesAnys: historial.map((r) => r.any),
    nivellInicial,
    nivellActual,
    deltaGravetat,
    estatCalendari,
    teComparativa2020: Boolean(arbre?.fotos?.foto2020),
    tendeciaText: tendeciaText.trim()
  };
}

function formataValorCota(valor, sufix = '') {
  if (valor === null || valor === undefined || valor === '') {
    return 'Pendent de mesura instrumental CIEF («?» al catàleg)';
  }
  return `${valor}${sufix}`;
}

/**
 * Projecta els 24 camps oficials de la Fitxa CIEF Versió 232 per a un arbre i
 * una revisió concreta (per defecte, l'última disponible).
 */
export function projectaFitxaCiefV232(arbre, revisioSeleccionada = null) {
  if (!arbre) return [];
  const historial = revisionsDeLArbre(arbre);
  const revisio = revisioSeleccionada || historial[historial.length - 1] || null;
  const dims = revisio ? revisio.dimensions : arbre.dimensions2007;
  const afectacio = revisio?.afectacio;
  const cadastreParts = [
    arbre.cadastre?.poligon ? `Polígon ${arbre.cadastre.poligon}` : 'Polígon s/d (urbà)',
    arbre.cadastre?.parcella ? `Parcel·la ${arbre.cadastre.parcella}` : 'Parcel·la s/d',
    arbre.cadastre?.ambit || null
  ].filter(Boolean).join(' · ');

  const altitudText = arbre.utmEtrs89?.altitudM != null ? `${arbre.utmEtrs89.altitudM} m` : 'Z pendent («? m»)';
  const perimetreText = dims?.perimetreNormalCm != null
    ? `${dims.perimetreNormalCm} cm a 1,30 m (diàmetre eq. ${dims.diametreEquivalentCm} cm)${dims.perimetreBasalCm ? ` · Perímetre basal del cep: ${dims.perimetreBasalCm} cm` : ''}`
    : 'Pendent de mesura instrumental CIEF («?» al catàleg 2007/2020)';

  const valorsPerClau = {
    ipa: arbre.monumental
      ? 'Exemplar monumental segons el catàleg. IPA oficial pendent de verificació registral'
      : 'Catàleg Municipal d’Interés Local (Ple 07/09/2007). IPA oficial pendent de verificació registral',
    especie: arbre.especieCientifica,
    nomPopular: `${arbre.nom} (${arbre.nomComu})`,
    coordenadesUtm: `ETRS89 Fus ${arbre.utmEtrs89.fus} · X ${arbre.utmEtrs89.x} · Y ${arbre.utmEtrs89.y} · Altitud ${altitudText}`,
    municipi: 'La Torre de les Maçanes (Alacant)',
    paratge: arbre.paratge,
    cadastre: cadastreParts,
    titularitat: `${arbre.titularitatCief} (${arbre.propietari ?? 'Pendent d’acreditar'}) · Accés lliure: ${arbre.accesLliure ? 'Sí' : 'No'}`,
    dataPresaDades: dims ? revisio?.data || '2007-05-19' : `Amidament pendent. Documentació datada el ${revisio?.data || '—'}`,
    observador: revisio?.observador || 'Pedro Ferrer Rodríguez · Associació El Rentonar',
    contacteObservador: 'Associació Cultural i Mediambiental El Rentonar (GVA núm. 4444 · La Torre de les Maçanes · sense dades personals privades)',
    numPeus: formataValorCota(dims?.peusMenys130m, dims?.peusMenys130m === 1 ? ' peu' : ' peus / exemplars del conjunt'),
    perimetreTroncCm: perimetreText,
    alcadaTotalM: formataValorCota(dims?.alcadaM, ' m'),
    copaDiametreMajorM: formataValorCota(dims?.diametreCapcadaM, ' m'),
    copaPerpendicularM: 'No consignat per separat al catàleg 2007/2020 (pendent d’amidament creuat CIEF)',
    anyNaixencaOEdat: dims?.edatEstimada || 'Pendent de campanya',
    metodeDatacio: 'Mètode de datació pendent de documentació específica',
    altresValors: arbre.valorCulturalHistoric || arbre.descripcio,
    inspeccioIAfectacio: `${revisio?.modalitatInspeccio || 'Modalitat pendent'} · Vitalitat: ${afectacio?.vitalitat || 'Pendent'} | Sanitat: ${afectacio?.sanitat || 'Pendent'} | Estructura: ${afectacio?.estructura || 'Pendent'}`,
    amenaces: revisio?.amenaces || arbre.conservacio2007.amenaces,
    mesuresConservacio: revisio?.mesures || arbre.conservacio2007.mesuresPropostes,
    mortODesaparicio: 'Estat actual i eventual baixa pendents de comprovació de camp i registral',
    notesDeCamp: [
      revisio?.resum,
      arbre.observacions,
      arbre.utmEtrs89?.notaEdicio2020,
      dims?.notaDendrometrica
    ].filter(Boolean).join(' — ')
  };

  return CAMPS_OFICIALS_CIEF_V232.map((camp) => ({
    ...camp,
    valor: valorsPerClau[camp.clau] || '—'
  }));
}

function escapaHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Construeix l'entrada canònica per a crear una nova fitxa d'inspecció d'arbre
 * al Bloc de Notes (`/notes`), amb estructura H3/H4/llistes compatible amb
 * TipTap i taxonomia canònica de Sóc de Poble.
 */
export function construeixPlantillaNotaArbre(arbre, intervalAnys = INTERVAL_REVISIO_PER_DEFECTE) {
  const delta = calculaDeltaLongitudinalArbre(arbre, intervalAnys);
  const perimetreBase = arbre?.dimensions2007?.perimetreNormalCm != null
    ? `${arbre.dimensions2007.perimetreNormalCm} cm`
    : 'Pendent («?») ';
  const alcadaBase = arbre?.dimensions2007?.alcadaM != null
    ? `${arbre.dimensions2007.alcadaM} m`
    : 'Pendent («?»)';
  const capcadaBase = arbre?.dimensions2007?.diametreCapcadaM != null
    ? `${arbre.dimensions2007.diametreCapcadaM} m`
    : 'Pendent («?»)';

  const content = [
    `<h3>Identificació i localització CIEF v232</h3>`,
    `<ul>`,
    `<li><p><strong>Exemplar (#${escapaHtml(arbre.ordre)}):</strong> ${escapaHtml(arbre.nom)} — <em>${escapaHtml(arbre.especieCientifica)}</em> (${escapaHtml(arbre.nomComu)})</p></li>`,
    `<li><p><strong>Categoria de protecció:</strong> ${escapaHtml(arbre.categoria)} (Acord Plenari 07/09/2007 · Ordenança Municipal 01/01/2005)</p></li>`,
    `<li><p><strong>UTM ETRS89 (Fus 30):</strong> X ${escapaHtml(arbre.utmEtrs89.x)} · Y ${escapaHtml(arbre.utmEtrs89.y)} · Altitud ${escapaHtml(arbre.utmEtrs89.altitudM ?? '?')} m</p></li>`,
    `<li><p><strong>Paratge i titularitat:</strong> ${escapaHtml(arbre.paratge)} · ${escapaHtml(arbre.titularitatCief)}</p></li>`,
    `</ul>`,
    `<h3>Comparativa dendromètrica (Base 2007 vs. Nova revisió de camp)</h3>`,
    `<ul>`,
    `<li><p><strong>Perímetre de tronc a 1,30 m:</strong> Base 2007: ${escapaHtml(perimetreBase)} → Mesura actual (cm): </p></li>`,
    `<li><p><strong>Alçària total:</strong> Base 2007: ${escapaHtml(alcadaBase)} → Mesura actual (m): </p></li>`,
    `<li><p><strong>Diàmetre major / perpendicular de capçada:</strong> Base 2007: ${escapaHtml(capcadaBase)} → Mesura actual (m): </p></li>`,
    `</ul>`,
    `<h4>Avaluació d’afectació oficial CIEF v232 (NO | LLEU | MODERADA | GREU)</h4>`,
    `<ul>`,
    `<li><p><strong>Vitalitat:</strong> Pendent de qualificació de camp: </p></li>`,
    `<li><p><strong>Sanitat vegetal (plagues / Xylella / grafiosi / xancre):</strong> </p></li>`,
    `<li><p><strong>Estructura biomecànica (soc, creu, branques mestres, marge de pedra seca):</strong> </p></li>`,
    `<li><p><strong>Cicle de revisió periòdica triat:</strong> cada ${escapaHtml(delta.intervalAnys)} anys (pròxima fita prevista: ${escapaHtml(delta.anyProximaRevisio)})</p></li>`,
    `</ul>`,
    `<h4>Observacions de camp i actuacions recomanades</h4>`,
    `<p>Anota ací les evidències visuals observades a peu d’arbre i adjunta fotografies actualitzades. Font base: ${escapaHtml(LLICENCIA_CATALEG_ARBRES)}.</p>`
  ].join('\n');

  return {
    folderId: 'f-pobles',
    icon: '🌳',
    title: `Fitxa CIEF · #${arbre.ordre} ${arbre.nom}`,
    subtitle: `${arbre.especieCientifica} · Revisió longitudinal (${delta.intervalAnys} anys)`,
    lead: `Full d’inspecció de camp basat en la Fitxa Oficial CIEF v232 i el Catàleg d’Arbres Singulars de La Torre de les Maçanes (2007–2020).`,
    content,
    categories: [CATEGORIES_CANONIQUES_BASE['natura-excursions']],
    tags: ['Arbres Monumentals', 'El Rentonar', 'Patrimoni']
  };
}
