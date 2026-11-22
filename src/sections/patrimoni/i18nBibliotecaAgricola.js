/**
 * Onada R32.38 · Lot 02 · Diccionari diferit complet en les 5 llengües oficials
 * (ca, es, en, eu, gl) per a la Biblioteca Agrícola (BancLlavorsWorkspaceSection)
 * i el Calendari Agrícola (CalendariAgricolaLlavorsView), destí canònic de DOL-38.
 * En valencià (ca) conserva caràcter a caràcter tots els literals originals.
 * Mòdul carregat només dins del tros diferit de Patrimoni (+0 B a pesDelNucli).
 * v1.2.22 · Gauntlet R2 (M5-02) · `llibreLlavors` és una funció del total de fitxes que calcula
 * BancLlavorsWorkspaceSection a partir de les dades (cap xifra escrita a mà). (M4-01) `empremtaDeclarada` i
 * `registreDocument` són els rètols d'una font sense extracte al repositori (EmpremtaFont i FitxaDeLaFont).
 */
export const CODIS_LLENGUA_BIBLIOTECA_AGRICOLA = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

export function codiLlenguaBibliotecaAgricola(language = 'ca') {
  const base = String(language || 'ca').toLowerCase().split('-')[0];
  return CODIS_LLENGUA_BIBLIOTECA_AGRICOLA.includes(base) ? base : 'ca';
}

const DICCIONARI_BIBLIOTECA_AGRICOLA = Object.freeze({
  ca: Object.freeze({
    llibreLlavors: (n) => `Catàleg del Banc de Llavors (${n} fitxes)`,
    llibreCalendari: 'Calendari Agrícola i Tomaques',
    llibreAnatomia: 'Anatomia Rural · Pou de la Neu 3D',
    laminaBotanicaNode0: 'làmina botànica Node 0',
    carregantCalendari: 'Carregant el calendari agrícola…',
    carregantPouNeu: 'Carregant el visor 3D del Pou de la Neu…',
    titolCalendari: 'Calendari agrícola de cultius i tomaques tradicionals',
    introAbansFont: 'Planificació mensual extreta literalment dels gràfics vectorials de 12 mesos del ',
    introDespresFont: (n) => ` (${n} varietats amb cicle verificat: sembra, trasplantament, recol·lecció i maduració de llavors).`,
    alertaTitol: 'Traçabilitat agronòmica sense invenció',
    alertaCos: 'Només s’hi mostren els mesos documentats oficialment al Catàleg valencià de varietats tradicionals d’interés agrari. Les entrades d’AVL Mallorca i de l’Atles català no inclouen diagrama mensual a la font i es consulten al llibre principal del catàleg.',
    grups: Object.freeze({
      tots: '🌾 Tots els cultius amb calendari',
      tomaques: '🍅 Tomaques tradicionals',
      'fruit-estiu': '🍆 Solanàcies, cucurbitàcies i fruit',
      'horta-fulla-bulb': '🥬 Fulles, bulbs, arrels i llegums',
    }),
    totesLesFases: 'Totes les fases',
    fases: Object.freeze({
      sembra: '🌱 Sembra / Sembra directa',
      sembraDirecta: '🌱 Sembra directa',
      plantacio: '🌿 Trasplantament',
      collita: '🧺 Recol·lecció',
      maduracioLlavors: '🌾 Maduració llavors',
    }),
    recompteDe: (f, total) => `${f} de ${total}`,
    recompteSufix: ' varietats tradicionals actives amb els filtres seleccionats.',
    filtreActiu: (g, f, m) => `Filtre actiu: ${g} · ${f} · ${m}`,
    veureVarietats: (n) => `Veure varietats (${n}) ↓`,
    restablirFiltres: 'Restablir filtres',
    totLAnyCurta: 'Tot l’any',
    totLAny12Mesos: 'Tot l’any (12 mesos)',
    mesos: Object.freeze([
      'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
      'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'
    ]),
    buitCombinacio: 'Cap varietat tradicional té activitat registrada amb esta combinació de mes i fase.',
    paginaPdf: (p) => ` · Pàgina ${p} del PDF`,
    obrirFitxaVarietat: 'Obrir fitxa de varietat',
    empremtaDeclarada: 'Empremta SHA-256 declarada del PDF, no contrastada al repositori',
    registreDocument: 'Registre del document',
  }),
  es: Object.freeze({
    llibreLlavors: (n) => `Catálogo del Banco de Semillas (${n} fichas)`,
    llibreCalendari: 'Calendario Agrícola y Tomates',
    llibreAnatomia: 'Anatomía Rural · Pozo de Nieve 3D',
    laminaBotanicaNode0: 'lámina botánica Nodo 0',
    carregantCalendari: 'Cargando el calendario agrícola…',
    carregantPouNeu: 'Cargando el visor 3D del Pozo de Nieve…',
    titolCalendari: 'Calendario agrícola de cultivos y tomates tradicionales',
    introAbansFont: 'Planificación mensual extraída literalmente de los gráficos vectoriales de 12 meses del ',
    introDespresFont: (n) => ` (${n} variedades con ciclo verificado: siembra, trasplante, recolección y maduración de semillas).`,
    alertaTitol: 'Trazabilidad agronómica sin invención',
    alertaCos: 'Solo se muestran los meses documentados oficialmente en el Catàleg valencià de varietats tradicionals d’interés agrari. Las entradas de AVL Mallorca y del Atlas catalán no incluyen diagrama mensual en la fuente y se consultan en el libro principal del catálogo.',
    grups: Object.freeze({
      tots: '🌾 Todos los cultivos con calendario',
      tomaques: '🍅 Tomates tradicionales',
      'fruit-estiu': '🍆 Solanáceas, cucurbitáceas y fruto',
      'horta-fulla-bulb': '🥬 Hojas, bulbos, raíces y legumbres',
    }),
    totesLesFases: 'Todas las fases',
    fases: Object.freeze({
      sembra: '🌱 Siembra / Siembra directa',
      sembraDirecta: '🌱 Siembra directa',
      plantacio: '🌿 Trasplante',
      collita: '🧺 Recolección',
      maduracioLlavors: '🌾 Maduración semillas',
    }),
    recompteDe: (f, total) => `${f} de ${total}`,
    recompteSufix: ' variedades tradicionales activas con los filtros seleccionados.',
    filtreActiu: (g, f, m) => `Filtro activo: ${g} · ${f} · ${m}`,
    veureVarietats: (n) => `Ver variedades (${n}) ↓`,
    restablirFiltres: 'Restablecer filtros',
    totLAnyCurta: 'Todo el año',
    totLAny12Mesos: 'Todo el año (12 meses)',
    mesos: Object.freeze([
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]),
    buitCombinacio: 'Ninguna variedad tradicional tiene actividad registrada con esta combinación de mes y fase.',
    paginaPdf: (p) => ` · Página ${p} del PDF`,
    obrirFitxaVarietat: 'Abrir ficha de variedad',
    empremtaDeclarada: 'Huella SHA-256 declarada del PDF, no contrastada en el repositorio',
    registreDocument: 'Registro del documento',
  }),
  en: Object.freeze({
    llibreLlavors: (n) => `Seed Bank Catalogue (${n} records)`,
    llibreCalendari: 'Agricultural Calendar & Tomatoes',
    llibreAnatomia: 'Rural Anatomy · 3D Icehouse',
    laminaBotanicaNode0: 'Node 0 botanical plate',
    carregantCalendari: 'Loading agricultural calendar…',
    carregantPouNeu: 'Loading 3D Icehouse viewer…',
    titolCalendari: 'Agricultural calendar of traditional crops and heirloom tomatoes',
    introAbansFont: 'Monthly schedule extracted verbatim from the 12-month vector charts of ',
    introDespresFont: (n) => ` (${n} varieties with verified cycle: sowing, transplanting, harvest, and seed maturation).`,
    alertaTitol: 'Zero-invention agronomic traceability',
    alertaCos: 'Only months officially documented in the Valencian Catalogue of Traditional Crop Varieties are shown. Entries from AVL Mallorca and the Catalan Atlas do not include a monthly chart in the source and can be browsed in the main catalogue book.',
    grups: Object.freeze({
      tots: '🌾 All crops with calendar',
      tomaques: '🍅 Heirloom tomatoes',
      'fruit-estiu': '🍆 Nightshades, cucurbits & fruiting crops',
      'horta-fulla-bulb': '🥬 Leafy greens, bulbs, roots & legumes',
    }),
    totesLesFases: 'All stages',
    fases: Object.freeze({
      sembra: '🌱 Sowing / Direct sowing',
      sembraDirecta: '🌱 Direct sowing',
      plantacio: '🌿 Transplanting',
      collita: '🧺 Harvest',
      maduracioLlavors: '🌾 Seed maturation',
    }),
    recompteDe: (f, total) => `${f} of ${total}`,
    recompteSufix: ' traditional varieties active with the selected filters.',
    filtreActiu: (g, f, m) => `Active filter: ${g} · ${f} · ${m}`,
    veureVarietats: (n) => `View varieties (${n}) ↓`,
    restablirFiltres: 'Reset filters',
    totLAnyCurta: 'All year',
    totLAny12Mesos: 'All year (12 months)',
    mesos: Object.freeze([
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]),
    buitCombinacio: 'No traditional variety has recorded activity for this month and stage combination.',
    paginaPdf: (p) => ` · PDF page ${p}`,
    obrirFitxaVarietat: 'Open variety record',
    empremtaDeclarada: 'Declared SHA-256 fingerprint of the PDF, not checked in the repository',
    registreDocument: 'Document record',
  }),
  eu: Object.freeze({
    llibreLlavors: (n) => `Hazi Bankuaren Katalogoa (${n} fitxa)`,
    llibreCalendari: 'Nekazaritza Egutegia eta Tomateak',
    llibreAnatomia: 'Landa Anatomia · 3D Elurzuloa',
    laminaBotanicaNode0: '0 Nodoko xafla botanikoa',
    carregantCalendari: 'Nekazaritza-egutegia kargatzen…',
    carregantPouNeu: '3D Elurzuloaren ikustailea kargatzen…',
    titolCalendari: 'Labore eta tomate tradizionalen nekazaritza-egutegia',
    introAbansFont: '12 hilabeteko grafiko bektorialetatik hitzez hitz ateratako hileko plangintza: ',
    introDespresFont: (n) => ` (ziklo egiaztatua duten ${n} barietate: ereitea, birlandatzea, uzta eta hazien heltzea).`,
    alertaTitol: 'Asmakizunik gabeko trazabilitate agronomikoa',
    alertaCos: 'Nekazaritza-intereseko barietate tradizionalen Valentziako Katalogoan ofizialki dokumentatutako hilabeteak bakarrik erakusten dira. Mallorcako AVLko eta Kataluniako Atlaseko sarrerek ez dute hileko diagramarik iturrian, eta katalogoko liburu nagusian kontsulta daitezke.',
    grups: Object.freeze({
      tots: '🌾 Egutegia duten labore guztiak',
      tomaques: '🍅 Tomate tradizionalak',
      'fruit-estiu': '🍆 Solanazeoak, kukurbitazeoak eta fruituak',
      'horta-fulla-bulb': '🥬 Hostoak, erraboilak, sustraiak eta lekaleak',
    }),
    totesLesFases: 'Fase guztiak',
    fases: Object.freeze({
      sembra: '🌱 Ereitea / Zuzeneko ereitea',
      sembraDirecta: '🌱 Zuzeneko ereitea',
      plantacio: '🌿 Birlandatzea',
      collita: '🧺 Uzta',
      maduracioLlavors: '🌾 Hazien heltzea',
    }),
    recompteDe: (f, total) => `${total}(e)tik ${f}`,
    recompteSufix: ' barietate tradizional aktibo hautatutako iragazkiekin.',
    filtreActiu: (g, f, m) => `Iragazki aktiboa: ${g} · ${f} · ${m}`,
    veureVarietats: (n) => `Ikusi barietateak (${n}) ↓`,
    restablirFiltres: 'Berrezarri iragazkiak',
    totLAnyCurta: 'Urte osoa',
    totLAny12Mesos: 'Urte osoa (12 hilabete)',
    mesos: Object.freeze([
      'Urtarrila', 'Otsaila', 'Martxoa', 'Apirila', 'Maiatza', 'Ekaina',
      'Uztaila', 'Abuztua', 'Iraila', 'Urria', 'Azaroa', 'Abendua'
    ]),
    buitCombinacio: 'Ez dago jarduera erregistraturik duen barietate tradizionalik hilabete eta fase konbinazio honekin.',
    paginaPdf: (p) => ` · PDFko ${p}. orrialdea`,
    obrirFitxaVarietat: 'Ireki barietatearen fitxa',
    empremtaDeclarada: 'PDFaren SHA-256 hatz marka adierazia, biltegian egiaztatu gabea',
    registreDocument: 'Dokumentuaren erregistroa',
  }),
  gl: Object.freeze({
    llibreLlavors: (n) => `Catálogo do Banco de Sementes (${n} fichas)`,
    llibreCalendari: 'Calendario Agrícola e Tomates',
    llibreAnatomia: 'Anatomía Rural · Pozo da Neve 3D',
    laminaBotanicaNode0: 'lámina botánica Nodo 0',
    carregantCalendari: 'Cargando o calendario agrícola…',
    carregantPouNeu: 'Cargando o visor 3D do Pozo da Neve…',
    titolCalendari: 'Calendario agrícola de cultivos e tomates tradicionais',
    introAbansFont: 'Planificación mensual extraída literalmente dos gráficos vectoriais de 12 meses do ',
    introDespresFont: (n) => ` (${n} variedades con ciclo verificado: sementeira, transplante, colleita e maduración de sementes).`,
    alertaTitol: 'Trazabilidade agronómica sen invención',
    alertaCos: 'Só se amosan os meses documentados oficialmente no Catàleg valencià de varietats tradicionals d’interés agrari. As entradas de AVL Mallorca e do Atlas catalán non inclúen diagrama mensual na fonte e consúltanse no libro principal do catálogo.',
    grups: Object.freeze({
      tots: '🌾 Todos os cultivos con calendario',
      tomaques: '🍅 Tomates tradicionais',
      'fruit-estiu': '🍆 Solanáceas, cucurbitáceas e froito',
      'horta-fulla-bulb': '🥬 Follas, bulbos, raíces e legumes',
    }),
    totesLesFases: 'Todas as fases',
    fases: Object.freeze({
      sembra: '🌱 Sementeira / Sementeira directa',
      sembraDirecta: '🌱 Sementeira directa',
      plantacio: '🌿 Transplante',
      collita: '🧺 Colleita',
      maduracioLlavors: '🌾 Maduración sementes',
    }),
    recompteDe: (f, total) => `${f} de ${total}`,
    recompteSufix: ' variedades tradicionais activas cos filtros seleccionados.',
    filtreActiu: (g, f, m) => `Filtro activo: ${g} · ${f} · ${m}`,
    veureVarietats: (n) => `Ver variedades (${n}) ↓`,
    restablirFiltres: 'Restablecer filtros',
    totLAnyCurta: 'Todo o ano',
    totLAny12Mesos: 'Todo o ano (12 meses)',
    mesos: Object.freeze([
      'Xaneiro', 'Febreiro', 'Marzo', 'Abril', 'Maio', 'Xuño',
      'Xullo', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Decembro'
    ]),
    buitCombinacio: 'Ningunha variedade tradicional ten actividade rexistrada con esta combinación de mes e fase.',
    paginaPdf: (p) => ` · Páxina ${p} do PDF`,
    obrirFitxaVarietat: 'Abrir ficha de variedade',
    empremtaDeclarada: 'Pegada SHA-256 declarada do PDF, non contrastada no repositorio',
    registreDocument: 'Rexistro do documento',
  }),
});

export function textosBibliotecaAgricola(language = 'ca') {
  return DICCIONARI_BIBLIOTECA_AGRICOLA[codiLlenguaBibliotecaAgricola(language)];
}
