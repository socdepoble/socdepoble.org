/**
 * Onada R32.30b · Lot 02 · Diccionari diferit d'accessibilitat (aria-label) per a
 * Patrimoni (Banc de Llavors, Calendari Agrícola, Arbres Singulars i Receptes)
 * en les 5 llengües oficials (ca, es, en, eu, gl).
 * Conserva byte a byte el valencià (ca) i no toca src/config/idiomes/*.js (0 B al nucli).
 */
const DICCIONARI_PATRIMONI_A11Y = Object.freeze({
  ca: Object.freeze({
    llibresBibliotecaAgricolaAria: 'Llibres de la Biblioteca Agrícola i Banc de Llavors',
    catalegs: 'Catàlegs',
    varietats: 'Varietats',
    totsElsCatalegs: 'Tots els catàlegs',
    calendariAgricolaAria: 'Calendari agrícola anual de varietats tradicionals i tomaques',
    filtreFamiliaCultiuAria: 'Filtre per família de cultiu',
    filtreFaseAgronomicaAria: 'Filtre per fase agronòmica',
    filtreMesAnyAria: 'Filtre per mes de l’any',
    intercanviDadesArbresAria: 'Intercanvi de dades d’arbres',
    cotesDendrometriquesAria: 'Cotes dendromètriques i estat longitudinal',
    seccionsFitxaArbreAria: 'Seccions de la fitxa d’arbre singular',
    intervalRevisioAria: 'Interval de revisió periòdica en anys',
    fitaTemporalCiefAria: 'Fita temporal projectada a la fitxa CIEF',
    confirmacioBaixaCampanyaAria: 'Confirmació de baixa de campanya',
    escandallConnexionsReceptaAria: 'Escandall i connexions de la recepta',
    preparaCompraReceptaAria: 'Prepara una compra amb esta recepta',
    calculaIPreparaCompra: 'Calcula i prepara la compra',
  }),
  es: Object.freeze({
    llibresBibliotecaAgricolaAria: 'Libros de la Biblioteca Agrícola y Banco de Semillas',
    catalegs: 'Catálogos',
    varietats: 'Variedades',
    totsElsCatalegs: 'Todos los catálogos',
    calendariAgricolaAria: 'Calendario agrícola anual de variedades tradicionales y tomates',
    filtreFamiliaCultiuAria: 'Filtro por familia de cultivo',
    filtreFaseAgronomicaAria: 'Filtro por fase agronómica',
    filtreMesAnyAria: 'Filtro por mes del año',
    intercanviDadesArbresAria: 'Intercambio de datos de árboles',
    cotesDendrometriquesAria: 'Cotas dendrométricas y estado longitudinal',
    seccionsFitxaArbreAria: 'Secciones de la ficha de árbol singular',
    intervalRevisioAria: 'Intervalo de revisión periódica en años',
    fitaTemporalCiefAria: 'Hito temporal proyectado en la ficha CIEF',
    confirmacioBaixaCampanyaAria: 'Confirmación de borrado de campaña',
    escandallConnexionsReceptaAria: 'Escandallo y conexiones de la receta',
    preparaCompraReceptaAria: 'Prepara una compra con esta receta',
    calculaIPreparaCompra: 'Calcula y prepara la compra',
  }),
  en: Object.freeze({
    llibresBibliotecaAgricolaAria: 'Agricultural Library and Seed Bank books',
    catalegs: 'Catalogues',
    varietats: 'Varieties',
    totsElsCatalegs: 'All catalogues',
    calendariAgricolaAria: 'Annual agricultural calendar of heirloom varieties and tomatoes',
    filtreFamiliaCultiuAria: 'Filter by crop family',
    filtreFaseAgronomicaAria: 'Filter by agronomic phase',
    filtreMesAnyAria: 'Filter by month of the year',
    intercanviDadesArbresAria: 'Tree data exchange',
    cotesDendrometriquesAria: 'Dendrometric measurements and longitudinal status',
    seccionsFitxaArbreAria: 'Remarkable tree record sections',
    intervalRevisioAria: 'Periodic review interval in years',
    fitaTemporalCiefAria: 'Timeline milestone projected onto CIEF record',
    confirmacioBaixaCampanyaAria: 'Campaign deletion confirmation',
    escandallConnexionsReceptaAria: 'Recipe costing and heritage links',
    preparaCompraReceptaAria: 'Prepare a shopping list from this recipe',
    calculaIPreparaCompra: 'Calculate and prepare shopping list',
  }),
  eu: Object.freeze({
    llibresBibliotecaAgricolaAria: 'Nekazaritza Liburutegiko eta Hazi Bankuko liburuak',
    catalegs: 'Katalogoak',
    varietats: 'Barietateak',
    totsElsCatalegs: 'Katalogo guztiak',
    calendariAgricolaAria: 'Barietate tradizionalen eta tomateen urteko nekazaritza-egutegia',
    filtreFamiliaCultiuAria: 'Labore-familiaren araberako iragazkia',
    filtreFaseAgronomicaAria: 'Fase agronomikoaren araberako iragazkia',
    filtreMesAnyAria: 'Urteko hilabetearen araberako iragazkia',
    intercanviDadesArbresAria: 'Zuhaitzen datu-trukea',
    cotesDendrometriquesAria: 'Neurri dendrometrikoak eta luzetarako egoera',
    seccionsFitxaArbreAria: 'Zuhaitz apartekoaren fitxako atalak',
    intervalRevisioAria: 'Aldizkako berrikuspen-tartea urtetan',
    fitaTemporalCiefAria: 'CIEF fitxan proiektatutako denbora-mugarria',
    confirmacioBaixaCampanyaAria: 'Kanpaina ezabatzeko baieztapena',
    escandallConnexionsReceptaAria: 'Errezetaren kostu-kalkulua eta loturak',
    preparaCompraReceptaAria: 'Prestatu erosketa bat errezeta honekin',
    calculaIPreparaCompra: 'Kalkulatu eta prestatu erosketa',
  }),
  gl: Object.freeze({
    llibresBibliotecaAgricolaAria: 'Libros da Biblioteca Agrícola e Banco de Sementes',
    catalegs: 'Catálogos',
    varietats: 'Variedades',
    totsElsCatalegs: 'Todos os catálogos',
    calendariAgricolaAria: 'Calendario agrícola anual de variedades tradicionais e tomates',
    filtreFamiliaCultiuAria: 'Filtro por familia de cultivo',
    filtreFaseAgronomicaAria: 'Filtro por fase agronómica',
    filtreMesAnyAria: 'Filtro por mes do ano',
    intercanviDadesArbresAria: 'Intercambio de datos de árbores',
    cotesDendrometriquesAria: 'Cotas dendrométricas e estado lonxitudinal',
    seccionsFitxaArbreAria: 'Seccións da ficha de árbore singular',
    intervalRevisioAria: 'Intervalo de revisión periódica en anos',
    fitaTemporalCiefAria: 'Fito temporal proxectado na ficha CIEF',
    confirmacioBaixaCampanyaAria: 'Confirmación de borrado de campaña',
    escandallConnexionsReceptaAria: 'Escandallo e conexións da receita',
    preparaCompraReceptaAria: 'Prepara unha compra con esta receita',
    calculaIPreparaCompra: 'Calcula e prepara a compra',
  }),
});

export function codiLlenguaPatrimoni(language = 'ca') {
  const base = String(language || 'ca').toLowerCase().split('-')[0];
  return Object.hasOwn(DICCIONARI_PATRIMONI_A11Y, base) ? base : 'ca';
}

export function textosPatrimoniA11y(language = 'ca') {
  return DICCIONARI_PATRIMONI_A11Y[codiLlenguaPatrimoni(language)];
}
