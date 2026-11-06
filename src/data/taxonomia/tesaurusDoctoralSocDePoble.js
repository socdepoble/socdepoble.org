/**
 * tesaurusDoctoralSocDePoble.js — Estudi Doctoral de Biblioteconomia i Classificació
 *
 * Basat en:
 *   1. Classificació Facetada PMEST de S. R. Ranganathan (Personality, Matter, Energy, Space, Time)
 *   2. Estàndard Internacional de Tesaurus ISO 25964-1/2 i W3C SKOS (Simple Knowledge Organization System)
 *
 * Font empírica real:
 *   - 114 categories de socdepoble.net (113 geogràfiques en arbre de 4-5 nivells + 1 d'estat editorial)
 *   - 105 etiquetes reals de socdepoble.net (52 amb articles + 53 buides amb 0 articles)
 *   - 425 articles i 18 pàgines reals de socdepoble.net
 */

export const CLAU_STORAGE_TAXONOMIA_ADMIN = 'sdp_taxonomia_doctoral_admin_v1';

export const RESUM_AUDITORIA_BIBLIOTECONOMIA = Object.freeze({
  totalCategoriesWp: 114,
  categoriesGeografiquesWp: 113,
  categoriesEstatEditorialWp: 1,
  totalEtiquetesWp: 105,
  etiquetesAmbArticles: 52,
  etiquetesBuidesPodables: 53,
  sinonimsAbsorbitsSkos: 6,
  totalArticlesWp: 425,
  totalPaginesWp: 18,
  diagnosticRanganathan: "En socdepoble.net, el 99,1% de les categories (113 de 114) s'estaven usant per a representar la Faceta Geogràfica (Space = On), obligant les etiquetes (Tags) a barrejar temàtica, format multimèdia i esdeveniments. En Sóc de Poble, la geografia passa a ser nativa (poble_id + pobles_etiquetats), alliberant les Categories per a les 6 grans línies temàtiques i deixant el Tesaurus SKOS d'etiquetes net, sense duplicats ni etiquetes orfes.",
});

export const FACETA_1_CATEGORIES_GEOGRAFIQUES = Object.freeze([
  {
    "id": 423,
    "name": "Agost",
    "slug": "agost",
    "parent": 118,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alacantí → Agost",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alacantí",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 153,
    "name": "Agres",
    "slug": "agres",
    "parent": 121,
    "count": 6,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Agres",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 270,
    "name": "Aigües",
    "slug": "aigues",
    "parent": 118,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alacantí → Aigües",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alacantí",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 353,
    "name": "Alacant",
    "slug": "alacant",
    "parent": 118,
    "count": 4,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alacantí → Alacant",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alacantí",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 410,
    "name": "Alboraia",
    "slug": "alboraia",
    "parent": 409,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques de València → L'Horta Nord → Alboraia",
    "provincia": "Comarques de València",
    "comarca": "L'Horta Nord",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 426,
    "name": "Alcalà de la Jovada",
    "slug": "alcala-de-la-jovada",
    "parent": 424,
    "count": 0,
    "description": "",
    "depth": 5,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Alta → La Vall d'Alcalà → Alcalà de la Jovada",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Alta",
    "poblePare": "La Vall d'Alcalà",
    "isGeographic": true,
    "rolGeografic": "pedania",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 385,
    "name": "Alcira",
    "slug": "alcira",
    "parent": 384,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques de València → Ribera Alta → Alcira",
    "provincia": "Comarques de València",
    "comarca": "Ribera Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 71,
    "name": "Alcoi",
    "slug": "alcoi",
    "parent": 252,
    "count": 43,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alcoià → Alcoi",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alcoià",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 395,
    "name": "Alcoleja",
    "slug": "alcoleja",
    "parent": 121,
    "count": 2,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Alcoleja",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 341,
    "name": "Alfafara",
    "slug": "alfafara",
    "parent": 121,
    "count": 7,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Alfafara",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 401,
    "name": "Algemesí",
    "slug": "algemesi",
    "parent": 384,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques de València → Ribera Alta → Algemesí",
    "provincia": "Comarques de València",
    "comarca": "Ribera Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 366,
    "name": "Alt Maestrat",
    "slug": "alt-maestrat",
    "parent": 364,
    "count": 1,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques de Castelló → Alt Maestrat",
    "provincia": "Comarques de Castelló",
    "comarca": "Alt Maestrat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 374,
    "name": "Altea",
    "slug": "altea",
    "parent": 192,
    "count": 3,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Baixa → Altea",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Baixa",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 428,
    "name": "Balones",
    "slug": "balones",
    "parent": 121,
    "count": 2,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Balones",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 188,
    "name": "Banyeres de Mariola",
    "slug": "banyeres-de-mariola",
    "parent": 252,
    "count": 9,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alcoià → Banyeres de Mariola",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alcoià",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 337,
    "name": "Benasau",
    "slug": "benasau",
    "parent": 121,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Benasau",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 369,
    "name": "Beneixama",
    "slug": "beneixama",
    "parent": 354,
    "count": 4,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alt Vinalopó → Beneixama",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alt Vinalopó",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 425,
    "name": "Beniaia",
    "slug": "beniaia",
    "parent": 424,
    "count": 2,
    "description": "",
    "depth": 5,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Alta → La Vall d'Alcalà → Beniaia",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Alta",
    "poblePare": "La Vall d'Alcalà",
    "isGeographic": true,
    "rolGeografic": "pedania",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 430,
    "name": "Benialfaquí",
    "slug": "benialfaqui",
    "parent": 429,
    "count": 2,
    "description": "",
    "depth": 5,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Planes → Benialfaquí",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": "Planes",
    "isGeographic": true,
    "rolGeografic": "pedania",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 403,
    "name": "Benidorm",
    "slug": "benidorm",
    "parent": 192,
    "count": 3,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Baixa → Benidorm",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Baixa",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 161,
    "name": "Benifallim",
    "slug": "benifallim",
    "parent": 252,
    "count": 16,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alcoià → Benifallim",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alcoià",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 162,
    "name": "Benilloba",
    "slug": "benilloba",
    "parent": 121,
    "count": 8,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Benilloba",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 163,
    "name": "Benillup",
    "slug": "benillup",
    "parent": 121,
    "count": 7,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Benillup",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 360,
    "name": "Benimassot",
    "slug": "benimassot",
    "parent": 121,
    "count": 3,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Benimassot",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 376,
    "name": "Benissa",
    "slug": "benissa",
    "parent": 191,
    "count": 2,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Alta → Benissa",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 370,
    "name": "Bocairent",
    "slug": "bocairent",
    "parent": 52,
    "count": 4,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques de València → La Vall d'Albaida → Bocairent",
    "provincia": "Comarques de València",
    "comarca": "La Vall d'Albaida",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 386,
    "name": "Busot",
    "slug": "busot",
    "parent": 118,
    "count": 3,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alacantí → Busot",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alacantí",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 373,
    "name": "Callosa d'en Sarrià",
    "slug": "callosa-den-sarria",
    "parent": 192,
    "count": 4,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Baixa → Callosa d'en Sarrià",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Baixa",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 375,
    "name": "Calp",
    "slug": "calp",
    "parent": 191,
    "count": 2,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Alta → Calp",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 368,
    "name": "Camp de Mirra",
    "slug": "camp-de-mirra",
    "parent": 354,
    "count": 3,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alt Vinalopó → Camp de Mirra",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alt Vinalopó",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 387,
    "name": "Carrícola",
    "slug": "carricola",
    "parent": 52,
    "count": 3,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques de València → La Vall d'Albaida → Carrícola",
    "provincia": "Comarques de València",
    "comarca": "La Vall d'Albaida",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 356,
    "name": "Castalla",
    "slug": "castalla",
    "parent": 252,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alcoià → Castalla",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alcoià",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 398,
    "name": "Castell de Castells",
    "slug": "castell-de-castells",
    "parent": 191,
    "count": 4,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Alta → Castell de Castells",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 348,
    "name": "Castelló de Rugat",
    "slug": "castello-de-rugat",
    "parent": 52,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques de València → La Vall d'Albaida → Castelló de Rugat",
    "provincia": "Comarques de València",
    "comarca": "La Vall d'Albaida",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 431,
    "name": "Catamarruc",
    "slug": "catamarruc",
    "parent": 429,
    "count": 0,
    "description": "",
    "depth": 5,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Planes → Catamarruc",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": "Planes",
    "isGeographic": true,
    "rolGeografic": "pedania",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 173,
    "name": "Cocentaina",
    "slug": "cocentaina",
    "parent": 121,
    "count": 5,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Cocentaina",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 379,
    "name": "Cofrents",
    "slug": "cofrents",
    "parent": 378,
    "count": 4,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques de València → Vall de Cofrents-Aiora → Cofrents",
    "provincia": "Comarques de València",
    "comarca": "Vall de Cofrents-Aiora",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 29,
    "name": "Comarques d'Alacant",
    "slug": "comarques-d-alacant",
    "parent": 268,
    "count": 4,
    "description": "",
    "depth": 2,
    "path": "Xarxa de Pobles → Comarques d'Alacant",
    "provincia": "Comarques d'Alacant",
    "comarca": null,
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "demarcacio",
    "campDesti": "context_comarcal"
  },
  {
    "id": 364,
    "name": "Comarques de Castelló",
    "slug": "comarques-de-castello",
    "parent": 268,
    "count": 1,
    "description": "",
    "depth": 2,
    "path": "Xarxa de Pobles → Comarques de Castelló",
    "provincia": "Comarques de Castelló",
    "comarca": null,
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "demarcacio",
    "campDesti": "context_comarcal"
  },
  {
    "id": 390,
    "name": "Comarques de Catalunya",
    "slug": "comarques-de-catalunya",
    "parent": 268,
    "count": 0,
    "description": "",
    "depth": 2,
    "path": "Xarxa de Pobles → Comarques de Catalunya",
    "provincia": "Comarques de Catalunya",
    "comarca": null,
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "demarcacio",
    "campDesti": "context_comarcal"
  },
  {
    "id": 216,
    "name": "Comarques de València",
    "slug": "comarques-devalencia",
    "parent": 268,
    "count": 0,
    "description": "",
    "depth": 2,
    "path": "Xarxa de Pobles → Comarques de València",
    "provincia": "Comarques de València",
    "comarca": null,
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "demarcacio",
    "campDesti": "context_comarcal"
  },
  {
    "id": 392,
    "name": "Cornudella de Montsant",
    "slug": "cornudella-de-montsant",
    "parent": 391,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques de Catalunya → Priorat → Cornudella de Montsant",
    "provincia": "Comarques de Catalunya",
    "comarca": "Priorat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 383,
    "name": "Dénia",
    "slug": "denia",
    "parent": 191,
    "count": 3,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Alta → Dénia",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 361,
    "name": "El Baix Segura",
    "slug": "el-baix-segura",
    "parent": 29,
    "count": 1,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Baix Segura",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Baix Segura",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 411,
    "name": "El Baix Vinalopó",
    "slug": "el-baix-vinalopo",
    "parent": 29,
    "count": 1,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Baix Vinalopó",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Baix Vinalopó",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 347,
    "name": "El Campello",
    "slug": "el-campello",
    "parent": 118,
    "count": 2,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alacantí → El Campello",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alacantí",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 121,
    "name": "El Comtat",
    "slug": "el-comtat",
    "parent": 29,
    "count": 31,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 408,
    "name": "El Poble Nou de Benitatxell",
    "slug": "el-poble-nou-de-benitatxell",
    "parent": 191,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Alta → El Poble Nou de Benitatxell",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 357,
    "name": "Els Ports",
    "slug": "els-ports",
    "parent": 216,
    "count": 1,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques de València → Els Ports",
    "provincia": "Comarques de València",
    "comarca": "Els Ports",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 365,
    "name": "Els Ports",
    "slug": "els-ports-comarques-de-castello",
    "parent": 364,
    "count": 1,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques de Castelló → Els Ports",
    "provincia": "Comarques de Castelló",
    "comarca": "Els Ports",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 412,
    "name": "Elx",
    "slug": "elx",
    "parent": 411,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Baix Vinalopó → Elx",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Baix Vinalopó",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 389,
    "name": "Énguera",
    "slug": "enguera",
    "parent": 388,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques de València → La Canal de Navarrés → Énguera",
    "provincia": "Comarques de València",
    "comarca": "La Canal de Navarrés",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 363,
    "name": "Fageca",
    "slug": "fageca",
    "parent": 121,
    "count": 4,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Fageca",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 396,
    "name": "Famorca",
    "slug": "famorca",
    "parent": 121,
    "count": 3,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Famorca",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 438,
    "name": "Gaianes",
    "slug": "gaianes",
    "parent": 121,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Gaianes",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 382,
    "name": "Gata de Gorgos",
    "slug": "gata-de-gorgos",
    "parent": 191,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Alta → Gata de Gorgos",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 338,
    "name": "Gorga",
    "slug": "gorga",
    "parent": 121,
    "count": 4,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Gorga",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 183,
    "name": "Ibi",
    "slug": "ibi",
    "parent": 252,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alcoià → Ibi",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alcoià",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 118,
    "name": "L'Alacantí",
    "slug": "l-alacanti",
    "parent": 29,
    "count": 16,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alacantí",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alacantí",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 252,
    "name": "L'Alcoià",
    "slug": "l-alcoia",
    "parent": 29,
    "count": 15,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alcoià",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alcoià",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 358,
    "name": "L'Alt Maestrat",
    "slug": "lalt-maestrat",
    "parent": 216,
    "count": 1,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques de València → L'Alt Maestrat",
    "provincia": "Comarques de València",
    "comarca": "L'Alt Maestrat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 354,
    "name": "L'Alt Vinalopó",
    "slug": "lalt-vinalopo",
    "parent": 29,
    "count": 4,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alt Vinalopó",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alt Vinalopó",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 433,
    "name": "L'Atzúbia",
    "slug": "latzubia",
    "parent": 191,
    "count": 2,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Alta → L'Atzúbia",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 409,
    "name": "L'Horta Nord",
    "slug": "lhorta-nord",
    "parent": 216,
    "count": 1,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques de València → L'Horta Nord",
    "provincia": "Comarques de València",
    "comarca": "L'Horta Nord",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 351,
    "name": "L'Orxa",
    "slug": "lorxa",
    "parent": 121,
    "count": 2,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → L'Orxa",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 388,
    "name": "La Canal de Navarrés",
    "slug": "la-canal-de-navarres",
    "parent": 216,
    "count": 0,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques de València → La Canal de Navarrés",
    "provincia": "Comarques de València",
    "comarca": "La Canal de Navarrés",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 367,
    "name": "La Canyada",
    "slug": "la-canyada",
    "parent": 354,
    "count": 3,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alt Vinalopó → La Canyada",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alt Vinalopó",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 421,
    "name": "La Costera",
    "slug": "la-costera",
    "parent": 216,
    "count": 1,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques de València → La Costera",
    "provincia": "Comarques de València",
    "comarca": "La Costera",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 191,
    "name": "La Marina Alta",
    "slug": "la-marina-alta",
    "parent": 29,
    "count": 12,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Alta",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 192,
    "name": "La Marina Baixa",
    "slug": "la-marina-baixa",
    "parent": 29,
    "count": 15,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Baixa",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Baixa",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 349,
    "name": "La Pobla del Duc",
    "slug": "la-pobla-del-duc",
    "parent": 52,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques de València → La Vall d'Albaida → La Pobla del Duc",
    "provincia": "Comarques de València",
    "comarca": "La Vall d'Albaida",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 185,
    "name": "La Safor",
    "slug": "la-safor",
    "parent": 216,
    "count": 1,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques de València → La Safor",
    "provincia": "Comarques de València",
    "comarca": "La Safor",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 186,
    "name": "La Torre de les Maçanes",
    "slug": "la-torre-de-les-macanes",
    "parent": 118,
    "count": 226,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alacantí → La Torre de les Maçanes",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alacantí",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 52,
    "name": "La Vall d'Albaida",
    "slug": "la-vall-d-albaida",
    "parent": 216,
    "count": 2,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques de València → La Vall d'Albaida",
    "provincia": "Comarques de València",
    "comarca": "La Vall d'Albaida",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 424,
    "name": "La Vall d'Alcalà",
    "slug": "la-vall-d-alcala",
    "parent": 191,
    "count": 2,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Alta → La Vall d'Alcalà",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 187,
    "name": "La Vall de Gallinera",
    "slug": "la-vall-de-gallinera",
    "parent": 191,
    "count": 3,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Alta → La Vall de Gallinera",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 393,
    "name": "La Vila Joiosa",
    "slug": "la-vila-joiosa",
    "parent": 192,
    "count": 2,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Baixa → La Vila Joiosa",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Baixa",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 407,
    "name": "Llíber",
    "slug": "lliber",
    "parent": 191,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Alta → Llíber",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 432,
    "name": "Margarida",
    "slug": "margarida",
    "parent": 429,
    "count": 0,
    "description": "",
    "depth": 5,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Planes → Margarida",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": "Planes",
    "isGeographic": true,
    "rolGeografic": "pedania",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 427,
    "name": "Millena",
    "slug": "millena",
    "parent": 121,
    "count": 2,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Millena",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 274,
    "name": "Muro d'Alcoi",
    "slug": "muro-d-alcoi",
    "parent": 121,
    "count": 9,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Muro d'Alcoi",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 346,
    "name": "Mutxamel",
    "slug": "mutxamel",
    "parent": 118,
    "count": 3,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alacantí → Mutxamel",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alacantí",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 405,
    "name": "Onil",
    "slug": "onil",
    "parent": 252,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alcoià → Onil",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alcoià",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 381,
    "name": "Ontinyent",
    "slug": "ontinyent",
    "parent": 52,
    "count": 3,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques de València → La Vall d'Albaida → Ontinyent",
    "provincia": "Comarques de València",
    "comarca": "La Vall d'Albaida",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 362,
    "name": "Oriola",
    "slug": "oriola",
    "parent": 361,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Baix Segura → Oriola",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Baix Segura",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 394,
    "name": "Orxeta",
    "slug": "orxeta",
    "parent": 192,
    "count": 2,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Baixa → Orxeta",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Baixa",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 435,
    "name": "Pego",
    "slug": "pego",
    "parent": 191,
    "count": 2,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Alta → Pego",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 199,
    "name": "Penàguila",
    "slug": "penaguila",
    "parent": 252,
    "count": 14,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alcoià → Penàguila",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alcoià",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 429,
    "name": "Planes",
    "slug": "planes",
    "parent": 121,
    "count": 2,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Planes",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 344,
    "name": "Polop",
    "slug": "polop",
    "parent": 192,
    "count": 4,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Baixa → Polop",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Baixa",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 391,
    "name": "Priorat",
    "slug": "priorat",
    "parent": 390,
    "count": 0,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques de Catalunya → Priorat",
    "provincia": "Comarques de Catalunya",
    "comarca": "Priorat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 1,
    "name": "Publicacions per revisar",
    "slug": "en-revisio",
    "parent": 0,
    "count": 0,
    "description": "",
    "depth": 1,
    "path": "Publicacions per revisar",
    "provincia": null,
    "comarca": null,
    "poblePare": null,
    "isGeographic": false,
    "rolGeografic": "revisio",
    "campDesti": "estat_revisio"
  },
  {
    "id": 350,
    "name": "Quatretonda",
    "slug": "quatretonda",
    "parent": 52,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques de València → La Vall d'Albaida → Quatretonda",
    "provincia": "Comarques de València",
    "comarca": "La Vall d'Albaida",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 402,
    "name": "Quatretondeta",
    "slug": "quatretondeta",
    "parent": 121,
    "count": 4,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Quatretondeta",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 206,
    "name": "Relleu",
    "slug": "relleu",
    "parent": 192,
    "count": 9,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Baixa → Relleu",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Baixa",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 384,
    "name": "Ribera Alta",
    "slug": "ribera-alta",
    "parent": 216,
    "count": 0,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques de València → Ribera Alta",
    "provincia": "Comarques de València",
    "comarca": "Ribera Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 400,
    "name": "Sant Vicent del Raspeig",
    "slug": "sant-vicent-del-raspeig",
    "parent": 118,
    "count": 3,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alacantí → Sant Vicent del Raspeig",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alacantí",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 340,
    "name": "Sella",
    "slug": "sella",
    "parent": 192,
    "count": 2,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Baixa → Sella",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Baixa",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 406,
    "name": "Senija",
    "slug": "senija",
    "parent": 191,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Alta → Senija",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 336,
    "name": "Teulada - Moraira",
    "slug": "teulada-moraira",
    "parent": 191,
    "count": 3,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Alta → Teulada - Moraira",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 399,
    "name": "Tibi",
    "slug": "tibi",
    "parent": 252,
    "count": 2,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alcoià → Tibi",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alcoià",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 397,
    "name": "Tollos",
    "slug": "tollos",
    "parent": 121,
    "count": 4,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → El Comtat → Tollos",
    "provincia": "Comarques d'Alacant",
    "comarca": "El Comtat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 434,
    "name": "Tormos",
    "slug": "tormos",
    "parent": 191,
    "count": 2,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Alta → Tormos",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 372,
    "name": "València",
    "slug": "valencia",
    "parent": 216,
    "count": 3,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques de València → València",
    "provincia": "Comarques de València",
    "comarca": "València",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 378,
    "name": "Vall de Cofrents-Aiora",
    "slug": "vall-de-cofrents-aiora",
    "parent": 216,
    "count": 0,
    "description": "",
    "depth": 3,
    "path": "Xarxa de Pobles → Comarques de València → Vall de Cofrents-Aiora",
    "provincia": "Comarques de València",
    "comarca": "Vall de Cofrents-Aiora",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "comarca",
    "campDesti": "context_comarcal"
  },
  {
    "id": 359,
    "name": "Vilafranca",
    "slug": "vilafranca",
    "parent": 358,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques de València → L'Alt Maestrat → Vilafranca",
    "provincia": "Comarques de València",
    "comarca": "L'Alt Maestrat",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 352,
    "name": "Vilallonga",
    "slug": "vilallonga",
    "parent": 185,
    "count": 2,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques de València → La Safor → Vilallonga",
    "provincia": "Comarques de València",
    "comarca": "La Safor",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 355,
    "name": "Villena",
    "slug": "villena",
    "parent": 354,
    "count": 4,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alt Vinalopó → Villena",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alt Vinalopó",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 335,
    "name": "Xabia",
    "slug": "xabia",
    "parent": 191,
    "count": 5,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Alta → Xabia",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 380,
    "name": "Xalans",
    "slug": "xalans",
    "parent": 378,
    "count": 2,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques de València → Vall de Cofrents-Aiora → Xalans",
    "provincia": "Comarques de València",
    "comarca": "Vall de Cofrents-Aiora",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 377,
    "name": "Xaló",
    "slug": "xalo",
    "parent": 191,
    "count": 3,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → La Marina Alta → Xaló",
    "provincia": "Comarques d'Alacant",
    "comarca": "La Marina Alta",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 268,
    "name": "Xarxa de Pobles",
    "slug": "pobles-connectats",
    "parent": 0,
    "count": 57,
    "description": "PENSA EN GLOBAL, ACTUA A LOCAL. Entendre el Desenvolupament Sostenible és fonamental. Reflexions sobre la degradació de valors que patim com a societat i popostes de noves maneres de col·laboració des de la base social que coneixem i a la qual podem aportar el nostre compromís i experiència.",
    "depth": 1,
    "path": "Xarxa de Pobles",
    "provincia": null,
    "comarca": null,
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "arrel_xarxa",
    "campDesti": "context_comarcal"
  },
  {
    "id": 422,
    "name": "Xàtiva",
    "slug": "xativa",
    "parent": 421,
    "count": 1,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques de València → La Costera → Xàtiva",
    "provincia": "Comarques de València",
    "comarca": "La Costera",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  },
  {
    "id": 217,
    "name": "Xixona",
    "slug": "xixona",
    "parent": 118,
    "count": 26,
    "description": "",
    "depth": 4,
    "path": "Xarxa de Pobles → Comarques d'Alacant → L'Alacantí → Xixona",
    "provincia": "Comarques d'Alacant",
    "comarca": "L'Alacantí",
    "poblePare": null,
    "isGeographic": true,
    "rolGeografic": "poble",
    "campDesti": "poble_id + pobles_etiquetats"
  }
]);

export const FACETA_2_VERTICALS_SISTEMA = Object.freeze([
  {
    "id": "mur",
    "icona": "📰",
    "nom": "Mur",
    "ruta": "/mur",
    "descripcio": "Cròniques, comunicats, memòria col·lectiva i actualitat dels pobles."
  },
  {
    "id": "mercat",
    "icona": "🧺",
    "nom": "Mercat",
    "ruta": "/mercat",
    "descripcio": "Productes locals, oli, artesania, intercanvi i sobirania alimentària."
  },
  {
    "id": "calendari",
    "icona": "📅",
    "nom": "Calendari",
    "ruta": "/calendari",
    "descripcio": "Aplecs, excursions, festes majors, tallers i convocatòries."
  },
  {
    "id": "mapa",
    "icona": "🗺️",
    "nom": "Mapa",
    "ruta": "/pobles",
    "descripcio": "Cartografia del territori, patrimoni, fonts, arbres monumentals i rutes."
  },
  {
    "id": "vehicle",
    "icona": "🚗",
    "nom": "Vehicle",
    "ruta": "/vehicle",
    "descripcio": "Mobilitat rural compartida per anar a la comarca, al mercat o al metge."
  },
  {
    "id": "animalets",
    "icona": "🐾",
    "nom": "Animalets",
    "ruta": "/mur?categoria=animalets",
    "descripcio": "Custòdia, adopció responsable, ramaderia extensiva i avisos d’animals."
  },
  {
    "id": "treball",
    "icona": "🛠️",
    "nom": "Treball",
    "ruta": "/treball",
    "descripcio": "Oficis rurals, collita d’oliva, bioconstrucció i relleu generacional."
  },
  {
    "id": "habitatge",
    "icona": "🏡",
    "nom": "Habitatge",
    "ruta": "/habitatge",
    "descripcio": "Cases de poble, masos, rehabilitació en pedra seca i lloguer digne."
  }
]);

export const FACETA_3_CATEGORIES_MARES_IA = Object.freeze([
  {
    "id": "defensa-territori",
    "icona": "⚖️",
    "label": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "nomCurt": "Defensa del Territori i Ecologia",
    "skosNotation": "SDP.F3.01",
    "ranganathanFacet": "Energy + Personality (Acció reivindicativa sobre el medi)",
    "descripcio": "Salvem la terra davant macroprojectes eòlics i fotovoltaics especulatius, prevenció d’incendis forestals, custòdia del territori i mobilització comarcal (Aplec pel Territori).",
    "activaPerDefecte": true
  },
  {
    "id": "recursos-locals",
    "icona": "🌾",
    "label": "🌾 Recursos Locals, Agricultura i Sobirania",
    "nomCurt": "Recursos Locals i Agricultura",
    "skosNotation": "SDP.F3.02",
    "ranganathanFacet": "Matter + Energy (Producció primària, bancals i economia rural)",
    "descripcio": "Posada en valor de l’oli d’oliva, l’oliverar de muntanya, mercats de proximitat, bioconstrucció, gestió de l’aigua i sobirania alimentària i energètica.",
    "activaPerDefecte": true
  },
  {
    "id": "natura-excursions",
    "icona": "🥾",
    "label": "🥾 Natura, Excursions i Camins",
    "nomCurt": "Natura, Excursions i Camins",
    "skosNotation": "SDP.F3.03",
    "ranganathanFacet": "Space + Time (Itineraris, cims, arbres monumentals i paisatge)",
    "descripcio": "Rutes senderistes, Camí de Santiago, El Camí, arbres monumentals, fonts, parcs naturals (Font Roja, Serra de Mariola, Aitana, Puig Campana) i esport a la natura.",
    "activaPerDefecte": true
  },
  {
    "id": "patrimoni-cultura",
    "icona": "🏛️",
    "label": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "nomCurt": "Patrimoni, Cultura i Llengua",
    "skosNotation": "SDP.F3.04",
    "ranganathanFacet": "Personality (Memòria oral, patrimoni arquitectònic i cultura viva)",
    "descripcio": "Pous de neu, castells, pedra seca, Gent que Fa Música, llibres, Cims per la llengua, festes tradicionals i cròniques històriques dels nostres pobles.",
    "activaPerDefecte": true
  },
  {
    "id": "comunitat-rural",
    "icona": "🤝",
    "label": "🤝 Comunitat, Associacionisme i Món Rural",
    "nomCurt": "Comunitat i Associacionisme",
    "skosNotation": "SDP.F3.05",
    "ranganathanFacet": "Personality + Energy (Teixit veïnal, centres rurals i trobades)",
    "descripcio": "Vida comunitària, El Rentonar, El Planet, El Carreró, esdeveniments veïnals, memfotisme crític, opinió ciutadana i xarxes de suport mutu contra el despoblament.",
    "activaPerDefecte": true
  },
  {
    "id": "tecnologia-lliure",
    "icona": "💻",
    "label": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "nomCurt": "Tecnologia Lliure i Dades Obertes",
    "skosNotation": "SDP.F3.06",
    "ranganathanFacet": "Energy + Matter (Infraestructura digital sobirana i Fedivers)",
    "descripcio": "Projecte TIC, digitalització rural, Fedivers, Node 0, documentació tècnica, plànols, vídeos divulgatius i sobirania tecnològica per als municipis menuts.",
    "activaPerDefecte": true
  }
]);

export const FACETA_4_ETIQUETES_SKOS = Object.freeze([
  {
    "id": 68,
    "name": "Activitats",
    "slug": "activitats",
    "count": 10,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 69,
    "name": "Agricultura",
    "slug": "agricultura",
    "count": 0,
    "description": "",
    "broaderTermId": "recursos-locals",
    "broaderTermLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "relatedTerms": [
      "Posant en Valor els Recursos Locals",
      "Bioconstrucció",
      "Desenvolupament Sostenible"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 70,
    "name": "Ajuntament de La Torre",
    "slug": "ajuntament-de-la-torre",
    "count": 1,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 72,
    "name": "Animalets",
    "slug": "animalets",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 156,
    "name": "Aplec pel Territori",
    "slug": "aplec-pel-territori",
    "count": 26,
    "description": "",
    "broaderTermId": "defensa-territori",
    "broaderTermLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "relatedTerms": [
      "Reivindicant",
      "Incendis",
      "Pla Eòlic"
    ],
    "useFor": [
      "aplec-pel-territori-2",
      "Aplecs"
    ],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 439,
    "name": "Aplec pel Territori",
    "slug": "aplec-pel-territori-2",
    "count": 1,
    "description": "",
    "broaderTermId": "defensa-territori",
    "broaderTermLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "relatedTerms": [
      "Reivindicant",
      "Incendis",
      "Pla Eòlic"
    ],
    "useFor": [],
    "isDeprecatedSynonym": true,
    "isEmpty": false,
    "activaPerDefecte": false
  },
  {
    "id": 157,
    "name": "Aplecs",
    "slug": "aplecs",
    "count": 0,
    "description": "",
    "broaderTermId": "defensa-territori",
    "broaderTermLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "relatedTerms": [
      "Reivindicant",
      "Aplec pel Territori",
      "Incendis",
      "Pla Eòlic"
    ],
    "useFor": [],
    "isDeprecatedSynonym": true,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 260,
    "name": "Aqüífer del Molinar",
    "slug": "aquifer-del-molinar",
    "count": 0,
    "description": "",
    "broaderTermId": "recursos-locals",
    "broaderTermLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "relatedTerms": [
      "Posant en Valor els Recursos Locals",
      "Bioconstrucció",
      "Desenvolupament Sostenible"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 159,
    "name": "Arbres",
    "slug": "arbres",
    "count": 2,
    "description": "",
    "broaderTermId": "natura-excursions",
    "broaderTermLabel": "🥾 Natura, Excursions i Camins",
    "relatedTerms": [
      "Excursions",
      "Arbres Monumentals",
      "Font Roja",
      "El Camí"
    ],
    "useFor": [],
    "isDeprecatedSynonym": true,
    "isEmpty": false,
    "activaPerDefecte": false
  },
  {
    "id": 73,
    "name": "Arbres Monumentals",
    "slug": "arbres-monumentals",
    "count": 21,
    "description": "",
    "broaderTermId": "natura-excursions",
    "broaderTermLabel": "🥾 Natura, Excursions i Camins",
    "relatedTerms": [
      "Excursions",
      "Font Roja",
      "El Camí"
    ],
    "useFor": [
      "Arbres",
      "Monumentals",
      "arbres",
      "monumentals"
    ],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 30,
    "name": "Autoconsum",
    "slug": "autoconsum",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 31,
    "name": "Autogestió",
    "slug": "autogestio",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 32,
    "name": "Autoocupació",
    "slug": "autoocupacio",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 33,
    "name": "Banc de Terres",
    "slug": "banc-de-terres",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 34,
    "name": "Bioconstrucció",
    "slug": "bioconstruccio",
    "count": 15,
    "description": "",
    "broaderTermId": "recursos-locals",
    "broaderTermLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "relatedTerms": [
      "Posant en Valor els Recursos Locals",
      "Desenvolupament Sostenible"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 74,
    "name": "Brull Viu",
    "slug": "brull-viu",
    "count": 15,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 75,
    "name": "Camí de Santiago",
    "slug": "cami-de-santiago",
    "count": 1,
    "description": "",
    "broaderTermId": "natura-excursions",
    "broaderTermLabel": "🥾 Natura, Excursions i Camins",
    "relatedTerms": [
      "Excursions",
      "Arbres Monumentals",
      "Font Roja",
      "El Camí"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 343,
    "name": "Centre Rural d'Experimentació",
    "slug": "centre-rural-dexperimentacio",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 251,
    "name": "Cims per la llengua",
    "slug": "cims-per-la-llengua",
    "count": 2,
    "description": "",
    "broaderTermId": "patrimoni-cultura",
    "broaderTermLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "relatedTerms": [
      "Patrimoni",
      "Gent que Fa Música",
      "Llibres",
      "Festes dels Pobles"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 264,
    "name": "Colònia Agrícola dels Plans",
    "slug": "colonia-agricola-dels-plans",
    "count": 0,
    "description": "",
    "broaderTermId": "recursos-locals",
    "broaderTermLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "relatedTerms": [
      "Posant en Valor els Recursos Locals",
      "Bioconstrucció",
      "Desenvolupament Sostenible"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 218,
    "name": "Comunicant",
    "slug": "comunicant",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 35,
    "name": "Coneixement Compartit",
    "slug": "coneixement-compartit",
    "count": 0,
    "description": "",
    "broaderTermId": "patrimoni-cultura",
    "broaderTermLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "relatedTerms": [
      "Patrimoni",
      "Gent que Fa Música",
      "Llibres",
      "Festes dels Pobles"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 36,
    "name": "Cooperativisme",
    "slug": "cooperativisme",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 175,
    "name": "Coordinadora d'Estudis Eòlics del Comtat",
    "slug": "coordinadora-destudis-eolics-del-comtat",
    "count": 16,
    "description": "",
    "broaderTermId": "defensa-territori",
    "broaderTermLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "relatedTerms": [
      "Reivindicant",
      "Aplec pel Territori",
      "Incendis",
      "Pla Eòlic"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 37,
    "name": "Cultura Lliure",
    "slug": "cultura-lliure",
    "count": 0,
    "description": "",
    "broaderTermId": "patrimoni-cultura",
    "broaderTermLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "relatedTerms": [
      "Patrimoni",
      "Gent que Fa Música",
      "Llibres",
      "Festes dels Pobles"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 38,
    "name": "Dades Obertes",
    "slug": "dades-obertes",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 40,
    "name": "Decreixement",
    "slug": "decreixement",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 41,
    "name": "Desenvolupament Rural",
    "slug": "desenvolupament-rural",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 42,
    "name": "Desenvolupament Sostenible",
    "slug": "desenvolupament-sostenible",
    "count": 2,
    "description": "",
    "broaderTermId": "defensa-territori",
    "broaderTermLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "relatedTerms": [
      "Reivindicant",
      "Aplec pel Territori",
      "Incendis",
      "Pla Eòlic"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 224,
    "name": "Disseny Gràfic",
    "slug": "disseny-grafic",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 225,
    "name": "Disseny web",
    "slug": "disseny-web",
    "count": 0,
    "description": "",
    "broaderTermId": "tecnologia-lliure",
    "broaderTermLabel": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "relatedTerms": [
      "Projecte TIC",
      "Noves Tecnologies",
      "Vídeos",
      "Projecte Sóc de Poble"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 115,
    "name": "Documentació",
    "slug": "documentacio",
    "count": 1,
    "description": "",
    "broaderTermId": "tecnologia-lliure",
    "broaderTermLabel": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "relatedTerms": [
      "Projecte TIC",
      "Noves Tecnologies",
      "Vídeos",
      "Projecte Sóc de Poble"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 43,
    "name": "Ecoaldees",
    "slug": "ecoaldees",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 269,
    "name": "El Camí",
    "slug": "el-cami",
    "count": 6,
    "description": "",
    "broaderTermId": "natura-excursions",
    "broaderTermLabel": "🥾 Natura, Excursions i Camins",
    "relatedTerms": [
      "Excursions",
      "Arbres Monumentals",
      "Font Roja"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 179,
    "name": "El Carreró Centre Cultural i Tecnològic",
    "slug": "el-carrero",
    "count": 12,
    "description": "",
    "broaderTermId": "patrimoni-cultura",
    "broaderTermLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "relatedTerms": [
      "Patrimoni",
      "Gent que Fa Música",
      "Llibres",
      "Festes dels Pobles"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 78,
    "name": "El Deute",
    "slug": "el-deute",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 219,
    "name": "El Planet Centre Rural d'Experimentació",
    "slug": "el-planet",
    "count": 15,
    "description": "Un lloc on compartir coneixements, experiències, idees i nous projectes mitjançant cursos, tallers, xerrades, exposicions, actuacions, reunions, quedades, treballs col·laboratius i d’altres propostes d'utilitat social.",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 79,
    "name": "El Rentonar",
    "slug": "el-rentonar",
    "count": 1,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 180,
    "name": "Energia",
    "slug": "energia",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 263,
    "name": "Escalada",
    "slug": "escalada",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 271,
    "name": "Esdeveniments",
    "slug": "esdeveniments",
    "count": 71,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 80,
    "name": "Esports",
    "slug": "esports",
    "count": 6,
    "description": "",
    "broaderTermId": "natura-excursions",
    "broaderTermLabel": "🥾 Natura, Excursions i Camins",
    "relatedTerms": [
      "Excursions",
      "Arbres Monumentals",
      "Font Roja",
      "El Camí"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 182,
    "name": "Excursions",
    "slug": "excursions",
    "count": 98,
    "description": "",
    "broaderTermId": "natura-excursions",
    "broaderTermLabel": "🥾 Natura, Excursions i Camins",
    "relatedTerms": [
      "Arbres Monumentals",
      "Font Roja",
      "El Camí"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 82,
    "name": "Fadrins",
    "slug": "fadrins",
    "count": 1,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 83,
    "name": "Festes dels Pobles",
    "slug": "festes-dels-pobles",
    "count": 3,
    "description": "",
    "broaderTermId": "patrimoni-cultura",
    "broaderTermLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "relatedTerms": [
      "Patrimoni",
      "Gent que Fa Música",
      "Llibres"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 84,
    "name": "Font Roja",
    "slug": "font-roja",
    "count": 12,
    "description": "",
    "broaderTermId": "natura-excursions",
    "broaderTermLabel": "🥾 Natura, Excursions i Camins",
    "relatedTerms": [
      "Excursions",
      "Arbres Monumentals",
      "El Camí"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 124,
    "name": "Fotos",
    "slug": "fotos",
    "count": 8,
    "description": "",
    "broaderTermId": "tecnologia-lliure",
    "broaderTermLabel": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "relatedTerms": [
      "Projecte TIC",
      "Noves Tecnologies",
      "Vídeos",
      "Projecte Sóc de Poble"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 228,
    "name": "Fullets",
    "slug": "fullets",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 85,
    "name": "Gent d'Aigües",
    "slug": "gent-daigues",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 86,
    "name": "Gent d'Internet",
    "slug": "gent-dinternet",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 87,
    "name": "Gent de La Torre",
    "slug": "gent-de-la-torre",
    "count": 3,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 88,
    "name": "Gent que Fa Coses",
    "slug": "gent-que-fa-coses",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 89,
    "name": "Gent que Fa Música",
    "slug": "gent-que-fa-musica",
    "count": 16,
    "description": "",
    "broaderTermId": "patrimoni-cultura",
    "broaderTermLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "relatedTerms": [
      "Patrimoni",
      "Llibres",
      "Festes dels Pobles"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 90,
    "name": "Gent Sostenible",
    "slug": "gent-sostenible",
    "count": 3,
    "description": "",
    "broaderTermId": "defensa-territori",
    "broaderTermLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "relatedTerms": [
      "Reivindicant",
      "Aplec pel Territori",
      "Incendis",
      "Pla Eòlic"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 229,
    "name": "Grup de Treball",
    "slug": "grup-de-treball",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 230,
    "name": "Identitat",
    "slug": "identitat",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 91,
    "name": "Incendis",
    "slug": "incendis",
    "count": 24,
    "description": "",
    "broaderTermId": "defensa-territori",
    "broaderTermLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "relatedTerms": [
      "Reivindicant",
      "Aplec pel Territori",
      "Pla Eòlic"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 92,
    "name": "iPad",
    "slug": "ipad",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 266,
    "name": "LGTBI MARIola",
    "slug": "lgtbi-mariola",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 189,
    "name": "Llei de Montes",
    "slug": "llei-de-montes",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 190,
    "name": "Llibertat d'expressió",
    "slug": "llibertat-dexpressio",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 231,
    "name": "Llibres",
    "slug": "llibres",
    "count": 5,
    "description": "",
    "broaderTermId": "patrimoni-cultura",
    "broaderTermLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "relatedTerms": [
      "Patrimoni",
      "Gent que Fa Música",
      "Festes dels Pobles"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 232,
    "name": "Logotips",
    "slug": "logotips",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 345,
    "name": "Memfotisme",
    "slug": "memfotisme",
    "count": 90,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 193,
    "name": "Mercat",
    "slug": "mercat",
    "count": 0,
    "description": "",
    "broaderTermId": "recursos-locals",
    "broaderTermLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "relatedTerms": [
      "Posant en Valor els Recursos Locals",
      "Bioconstrucció",
      "Desenvolupament Sostenible"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 195,
    "name": "Monumentals",
    "slug": "monumentals",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": true,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 60,
    "name": "Noticies",
    "slug": "noticies",
    "count": 1,
    "description": "",
    "broaderTermId": "tecnologia-lliure",
    "broaderTermLabel": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "relatedTerms": [
      "Projecte TIC",
      "Noves Tecnologies",
      "Vídeos",
      "Projecte Sóc de Poble"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 44,
    "name": "Noves Tecnologies",
    "slug": "noves-tecnologies",
    "count": 3,
    "description": "",
    "broaderTermId": "tecnologia-lliure",
    "broaderTermLabel": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "relatedTerms": [
      "Projecte TIC",
      "Vídeos",
      "Projecte Sóc de Poble"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 196,
    "name": "Nuclears",
    "slug": "nuclears",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 94,
    "name": "Oficis Tradicionals",
    "slug": "oficis-tradicionals",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 95,
    "name": "Opinió",
    "slug": "opinio",
    "count": 4,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 197,
    "name": "Pa Beneït",
    "slug": "pa-beneit",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 261,
    "name": "Pantà de la Vila",
    "slug": "panta-de-la-vila",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 339,
    "name": "Patrimoni",
    "slug": "patrimoni",
    "count": 28,
    "description": "",
    "broaderTermId": "patrimoni-cultura",
    "broaderTermLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "relatedTerms": [
      "Gent que Fa Música",
      "Llibres",
      "Festes dels Pobles"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 45,
    "name": "Permacultura",
    "slug": "permacultura",
    "count": 0,
    "description": "",
    "broaderTermId": "patrimoni-cultura",
    "broaderTermLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "relatedTerms": [
      "Patrimoni",
      "Gent que Fa Música",
      "Llibres",
      "Festes dels Pobles"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 96,
    "name": "Pla Eòlic",
    "slug": "pla-eolic",
    "count": 13,
    "description": "",
    "broaderTermId": "defensa-territori",
    "broaderTermLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "relatedTerms": [
      "Reivindicant",
      "Aplec pel Territori",
      "Incendis"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 236,
    "name": "Plànols",
    "slug": "planols",
    "count": 1,
    "description": "",
    "broaderTermId": "tecnologia-lliure",
    "broaderTermLabel": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "relatedTerms": [
      "Projecte TIC",
      "Noves Tecnologies",
      "Vídeos",
      "Projecte Sóc de Poble"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 267,
    "name": "Plataforma FEM",
    "slug": "plataforma-fem",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 46,
    "name": "Posant en Valor els Recursos Locals",
    "slug": "posant-en-valor-els-recursos-locals",
    "count": 127,
    "description": "",
    "broaderTermId": "recursos-locals",
    "broaderTermLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "relatedTerms": [
      "Bioconstrucció",
      "Desenvolupament Sostenible"
    ],
    "useFor": [
      "Recursos Locals",
      "recursos-locals"
    ],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 249,
    "name": "Pou de neu",
    "slug": "pou-de-neu",
    "count": 1,
    "description": "",
    "broaderTermId": "patrimoni-cultura",
    "broaderTermLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "relatedTerms": [
      "Patrimoni",
      "Gent que Fa Música",
      "Llibres",
      "Festes dels Pobles"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 17,
    "name": "Projecte Sóc de Poble",
    "slug": "projecte-soc-de-poble",
    "count": 1,
    "description": "Un Projecte pel desenvolupament sostenible i tecnològic en entorns rurals",
    "broaderTermId": "tecnologia-lliure",
    "broaderTermLabel": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "relatedTerms": [
      "Projecte TIC",
      "Noves Tecnologies",
      "Vídeos"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 97,
    "name": "Projecte TIC",
    "slug": "projecte-tic",
    "count": 7,
    "description": "",
    "broaderTermId": "tecnologia-lliure",
    "broaderTermLabel": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "relatedTerms": [
      "Noves Tecnologies",
      "Vídeos",
      "Projecte Sóc de Poble"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 273,
    "name": "Projectes",
    "slug": "projectes",
    "count": 1,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 98,
    "name": "Propostes",
    "slug": "propostes",
    "count": 2,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 205,
    "name": "Radar No",
    "slug": "radar-no",
    "count": 1,
    "description": "",
    "broaderTermId": "defensa-territori",
    "broaderTermLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "relatedTerms": [
      "Reivindicant",
      "Aplec pel Territori",
      "Incendis",
      "Pla Eòlic"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 203,
    "name": "Recursos Locals",
    "slug": "recursos-locals",
    "count": 3,
    "description": "",
    "broaderTermId": "recursos-locals",
    "broaderTermLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "relatedTerms": [
      "Posant en Valor els Recursos Locals",
      "Bioconstrucció",
      "Desenvolupament Sostenible"
    ],
    "useFor": [],
    "isDeprecatedSynonym": true,
    "isEmpty": false,
    "activaPerDefecte": false
  },
  {
    "id": 371,
    "name": "Reivin",
    "slug": "reivin",
    "count": 0,
    "description": "",
    "broaderTermId": "defensa-territori",
    "broaderTermLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "relatedTerms": [
      "Reivindicant",
      "Aplec pel Territori",
      "Incendis",
      "Pla Eòlic"
    ],
    "useFor": [],
    "isDeprecatedSynonym": true,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 99,
    "name": "Reivindicant",
    "slug": "reivindicant",
    "count": 168,
    "description": "",
    "broaderTermId": "defensa-territori",
    "broaderTermLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "relatedTerms": [
      "Aplec pel Territori",
      "Incendis",
      "Pla Eòlic"
    ],
    "useFor": [
      "Reivin",
      "reivin"
    ],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 207,
    "name": "Rentonar Informa",
    "slug": "rentonar-informa",
    "count": 1,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 100,
    "name": "Replantacions",
    "slug": "replantacions",
    "count": 3,
    "description": "",
    "broaderTermId": "defensa-territori",
    "broaderTermLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "relatedTerms": [
      "Reivindicant",
      "Aplec pel Territori",
      "Incendis",
      "Pla Eòlic"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 101,
    "name": "Reunions",
    "slug": "reunions",
    "count": 1,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 102,
    "name": "Sant Gregori",
    "slug": "sant-gregori",
    "count": 1,
    "description": "",
    "broaderTermId": "patrimoni-cultura",
    "broaderTermLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "relatedTerms": [
      "Patrimoni",
      "Gent que Fa Música",
      "Llibres",
      "Festes dels Pobles"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 255,
    "name": "Serra d'Aitana",
    "slug": "serra-daitana",
    "count": 0,
    "description": "",
    "broaderTermId": "natura-excursions",
    "broaderTermLabel": "🥾 Natura, Excursions i Camins",
    "relatedTerms": [
      "Excursions",
      "Arbres Monumentals",
      "Font Roja",
      "El Camí"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 250,
    "name": "Serra dels Plans",
    "slug": "serra-dels-plans",
    "count": 1,
    "description": "",
    "broaderTermId": "natura-excursions",
    "broaderTermLabel": "🥾 Natura, Excursions i Camins",
    "relatedTerms": [
      "Excursions",
      "Arbres Monumentals",
      "Font Roja",
      "El Camí"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 256,
    "name": "Serra Gelada",
    "slug": "serra-gelada",
    "count": 0,
    "description": "",
    "broaderTermId": "natura-excursions",
    "broaderTermLabel": "🥾 Natura, Excursions i Camins",
    "relatedTerms": [
      "Excursions",
      "Arbres Monumentals",
      "Font Roja",
      "El Camí"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 258,
    "name": "Serra La Grana",
    "slug": "serra-la-grana",
    "count": 0,
    "description": "",
    "broaderTermId": "natura-excursions",
    "broaderTermLabel": "🥾 Natura, Excursions i Camins",
    "relatedTerms": [
      "Excursions",
      "Arbres Monumentals",
      "Font Roja",
      "El Camí"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 257,
    "name": "Serrella",
    "slug": "serrella",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 47,
    "name": "Software Lliure",
    "slug": "software-lliure",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 215,
    "name": "Solidaritat",
    "slug": "solidaritat",
    "count": 0,
    "description": "",
    "broaderTermId": "recursos-locals",
    "broaderTermLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "relatedTerms": [
      "Posant en Valor els Recursos Locals",
      "Bioconstrucció",
      "Desenvolupament Sostenible"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 241,
    "name": "Targetes",
    "slug": "targetes",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 104,
    "name": "Trobades",
    "slug": "trobades",
    "count": 3,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 105,
    "name": "Turballos",
    "slug": "turballos",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 243,
    "name": "UX-UI",
    "slug": "ux-ui",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  },
  {
    "id": 27,
    "name": "Vídeos",
    "slug": "videos",
    "count": 30,
    "description": "",
    "broaderTermId": "tecnologia-lliure",
    "broaderTermLabel": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "relatedTerms": [
      "Projecte TIC",
      "Noves Tecnologies",
      "Projecte Sóc de Poble"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": false,
    "activaPerDefecte": true
  },
  {
    "id": 106,
    "name": "Zepa",
    "slug": "zepa",
    "count": 0,
    "description": "",
    "broaderTermId": "comunitat-rural",
    "broaderTermLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "relatedTerms": [
      "Esdeveniments",
      "Memfotisme",
      "El Rentonar",
      "El Planet Centre Rural d'Experimentació"
    ],
    "useFor": [],
    "isDeprecatedSynonym": false,
    "isEmpty": true,
    "activaPerDefecte": false
  }
]);

export const ARTICLES_SIMULADOR_IA_425 = Object.freeze([
  {
    "id": 17360,
    "date": "2026-08-02T14:11:22",
    "slug": "el-mosaic-es-sempre-ha-sigut-la-solucio",
    "link": "https://socdepoble.net/2026/08/02/el-mosaic-es-sempre-ha-sigut-la-solucio/",
    "title": "El mosaic és (sempre ha sigut) la solució",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Arbres Monumentals",
      "Incendis",
      "Patrimoni",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Arbres Monumentals",
      "Incendis",
      "Patrimoni",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-mosaic-es-sempre-ha-sigut-la-solucio"
  },
  {
    "id": 17176,
    "date": "2024-08-07T02:46:54",
    "slug": "el-mosaic-mediterrani-la-proposta-de-pagar-1-000-e-als-maseros-per-llaurar-bancals-i-aixi-previndre-incendis",
    "link": "https://socdepoble.net/2024/08/07/el-mosaic-mediterrani-la-proposta-de-pagar-1-000-e-als-maseros-per-llaurar-bancals-i-aixi-previndre-incendis/",
    "title": "El mosaic mediterrani: La proposta de pagar 1.000 € als maseros per llaurar bancals i així previndre incendis",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Arbres Monumentals",
      "Incendis",
      "Patrimoni",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Arbres Monumentals",
      "Incendis",
      "Patrimoni",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-mosaic-mediterrani-la-proposta-de-pagar-1-000-e-als-maseros-per-llaurar-bancals-i-aixi-previndre-incendis"
  },
  {
    "id": 17122,
    "date": "2023-02-28T22:11:31",
    "slug": "recollida-de-signatures-no-tenim-anim-de-lucre-no-ens-cobreu-comissions",
    "link": "https://socdepoble.net/2023/02/28/recollida-de-signatures-no-tenim-anim-de-lucre-no-ens-cobreu-comissions/",
    "title": "Recollida de signatures: NO tenim ànim de lucre, NO ens cobreu comissions!",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/recollida-de-signatures-no-tenim-anim-de-lucre-no-ens-cobreu-comissions"
  },
  {
    "id": 17096,
    "date": "2023-02-28T16:59:25",
    "slug": "la-coordinadora-presenta-allegacions-contra-la-macroplanta-solar-de-benifallim",
    "link": "https://socdepoble.net/2023/02/28/la-coordinadora-presenta-allegacions-contra-la-macroplanta-solar-de-benifallim/",
    "title": "La Coordinadora presenta al·legacions contra la macroplanta solar de Benifallim",
    "poblesDetectats": [
      "Benifallim",
      "Gaianes",
      "Polop"
    ],
    "poblePrincipal": "Benifallim",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "pdf_drive_docs",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-coordinadora-presenta-allegacions-contra-la-macroplanta-solar-de-benifallim"
  },
  {
    "id": 16893,
    "date": "2022-11-17T23:50:00",
    "slug": "manifest-de-poble",
    "link": "https://socdepoble.net/2022/11/17/manifest-de-poble/",
    "title": "Manifest de Poble",
    "poblesDetectats": [
      "Balones",
      "Beniaia",
      "Benialfaquí",
      "Benillup",
      "Benimassot",
      "Callosa d'en Sarrià",
      "Castell de Castells",
      "Fageca",
      "Famorca",
      "Gorga",
      "L'Atzúbia",
      "La Torre de les Maçanes",
      "La Vall d'Alcalà",
      "La Vall de Gallinera",
      "Millena",
      "Muro d'Alcoi",
      "Pego",
      "Planes",
      "Quatretondeta",
      "Tollos",
      "Tormos"
    ],
    "poblePrincipal": "Balones",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "pdf_drive_docs",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/manifest-de-poble"
  },
  {
    "id": 16880,
    "date": "2022-11-17T21:03:41",
    "slug": "aplec-pel-territori-2023",
    "link": "https://socdepoble.net/2022/11/17/aplec-pel-territori-2023/",
    "title": "2n Aplec pel Territori",
    "poblesDetectats": [
      "Balones",
      "Beniaia",
      "Benialfaquí",
      "Benillup",
      "Benimassot",
      "Callosa d'en Sarrià",
      "Castell de Castells",
      "Fageca",
      "Famorca",
      "Gorga",
      "L'Atzúbia",
      "La Torre de les Maçanes",
      "La Vall d'Alcalà",
      "La Vall de Gallinera",
      "Millena",
      "Muro d'Alcoi",
      "Pego",
      "Planes",
      "Quatretondeta",
      "Tollos",
      "Tormos"
    ],
    "poblePrincipal": "Balones",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/aplec-pel-territori-2023"
  },
  {
    "id": 16839,
    "date": "2022-03-30T20:14:32",
    "slug": "la-trilogia-mediterrania-al-comtat",
    "link": "https://socdepoble.net/2022/03/30/la-trilogia-mediterrania-al-comtat/",
    "title": "La Trilogia Mediterrània al Comtat i a les comarques veïnes",
    "poblesDetectats": [
      "Comarques d'Alacant",
      "L'Alacantí",
      "L'Alcoià"
    ],
    "poblePrincipal": "Comarques d'Alacant",
    "comarquesDetectades": [
      "El Comtat",
      "L'Alt Vinalopó",
      "La Marina Alta",
      "La Marina Baixa"
    ],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Llibres",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Llibres",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-trilogia-mediterrania-al-comtat"
  },
  {
    "id": 16826,
    "date": "2022-03-25T21:52:02",
    "slug": "el-lexic-del-blat-al-comtat",
    "link": "https://socdepoble.net/2022/03/25/el-lexic-del-blat-al-comtat/",
    "title": "El lèxic del blat al Comtat",
    "poblesDetectats": [
      "Comarques d'Alacant",
      "L'Alacantí",
      "L'Alcoià"
    ],
    "poblePrincipal": "Comarques d'Alacant",
    "comarquesDetectades": [
      "El Comtat",
      "L'Alt Vinalopó",
      "La Marina Alta",
      "La Marina Baixa"
    ],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Llibres",
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Llibres",
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-lexic-del-blat-al-comtat"
  },
  {
    "id": 16810,
    "date": "2022-01-19T22:11:00",
    "slug": "lespeculacio-de-les-energies-netes",
    "link": "https://socdepoble.net/2022/01/19/lespeculacio-de-les-energies-netes/",
    "title": "L’especulació de les energies netes",
    "poblesDetectats": [
      "Busot",
      "L'Alacantí",
      "La Torre de les Maçanes",
      "Xixona"
    ],
    "poblePrincipal": "Busot",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/lespeculacio-de-les-energies-netes"
  },
  {
    "id": 16761,
    "date": "2021-12-25T19:39:00",
    "slug": "el-pou-de-neu-del-rentonar-front-a-ladministracio",
    "link": "https://socdepoble.net/2021/12/25/el-pou-de-neu-del-rentonar-front-a-ladministracio/",
    "title": "El Pou de Neu del Rentonar front a l’Administració",
    "poblesDetectats": [
      "L'Alacantí",
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "L'Alacantí",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Patrimoni",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Patrimoni",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-pou-de-neu-del-rentonar-front-a-ladministracio"
  },
  {
    "id": 16738,
    "date": "2021-12-25T14:15:00",
    "slug": "villa-edelmira-front-a-les-administracions",
    "link": "https://socdepoble.net/2021/12/25/villa-edelmira-front-a-les-administracions/",
    "title": "Villa Edelmira front a les Administracions",
    "poblesDetectats": [
      "L'Alacantí",
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "L'Alacantí",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Patrimoni",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Patrimoni",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/villa-edelmira-front-a-les-administracions"
  },
  {
    "id": 16728,
    "date": "2021-12-20T20:46:00",
    "slug": "amb-el-cami-de-petracos-a-tollos-pel-barranc-de-malafi",
    "link": "https://socdepoble.net/2021/12/20/amb-el-cami-de-petracos-a-tollos-pel-barranc-de-malafi/",
    "title": "Amb El Camí, de Petracos a Tollos pel Barranc de Malafí",
    "poblesDetectats": [
      "Castell de Castells",
      "Tollos"
    ],
    "poblePrincipal": "Castell de Castells",
    "comarquesDetectades": [
      "El Comtat",
      "La Marina Alta"
    ],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/amb-el-cami-de-petracos-a-tollos-pel-barranc-de-malafi"
  },
  {
    "id": 16714,
    "date": "2021-11-28T20:30:00",
    "slug": "caminada-per-lalacanti-dagost-a-sant-vicent-del-raspeig",
    "link": "https://socdepoble.net/2021/11/28/caminada-per-lalacanti-dagost-a-sant-vicent-del-raspeig/",
    "title": "Caminada per l’Alacantí. D’Agost a Sant Vicent del Raspeig",
    "poblesDetectats": [
      "Agost",
      "L'Alacantí",
      "Sant Vicent del Raspeig"
    ],
    "poblePrincipal": "Agost",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/caminada-per-lalacanti-dagost-a-sant-vicent-del-raspeig"
  },
  {
    "id": 16698,
    "date": "2021-10-26T19:42:00",
    "slug": "concentracio-pel-nostre-tren-pel-nostre-futur",
    "link": "https://socdepoble.net/2021/10/26/concentracio-pel-nostre-tren-pel-nostre-futur/",
    "title": "Concentració pel nostre tren, pel nostre futur",
    "poblesDetectats": [
      "Alcoi",
      "L'Alcoià",
      "València",
      "Xàtiva"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [
      "El Comtat",
      "La Costera"
    ],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Patrimoni",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Patrimoni",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/concentracio-pel-nostre-tren-pel-nostre-futur"
  },
  {
    "id": 16704,
    "date": "2021-09-07T20:54:00",
    "slug": "el-mas-de-la-foia-en-estat-demergencia",
    "link": "https://socdepoble.net/2021/09/07/el-mas-de-la-foia-en-estat-demergencia/",
    "title": "El Mas de la Foia en estat d’emergència",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Patrimoni",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Patrimoni",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-mas-de-la-foia-en-estat-demergencia"
  },
  {
    "id": 16668,
    "date": "2021-07-10T19:49:44",
    "slug": "el-lexic-del-raim-i-del-vi-al-comtat",
    "link": "https://socdepoble.net/2021/07/10/el-lexic-del-raim-i-del-vi-al-comtat/",
    "title": "El lèxic del raïm i del vi al Comtat",
    "poblesDetectats": [
      "Comarques d'Alacant",
      "L'Alacantí",
      "L'Alcoià"
    ],
    "poblePrincipal": "Comarques d'Alacant",
    "comarquesDetectades": [
      "El Comtat",
      "L'Alt Vinalopó",
      "La Marina Alta",
      "La Marina Baixa"
    ],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Llibres",
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Llibres",
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-lexic-del-raim-i-del-vi-al-comtat"
  },
  {
    "id": 16650,
    "date": "2021-04-11T14:00:00",
    "slug": "el-lexic-de-lolivera-loliva-i-loli-al-comtat",
    "link": "https://socdepoble.net/2021/04/11/el-lexic-de-lolivera-loliva-i-loli-al-comtat/",
    "title": "El lèxic de l’olivera, l’oliva i l’oli al Comtat",
    "poblesDetectats": [
      "Comarques d'Alacant",
      "L'Alacantí",
      "L'Alcoià"
    ],
    "poblePrincipal": "Comarques d'Alacant",
    "comarquesDetectades": [
      "El Comtat",
      "L'Alt Vinalopó",
      "La Marina Alta",
      "La Marina Baixa"
    ],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Llibres",
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Llibres",
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-lexic-de-lolivera-loliva-i-loli-al-comtat"
  },
  {
    "id": 14747,
    "date": "2021-02-25T20:51:00",
    "slug": "neteja-de-branques-seques-i-verdancs-de-larboc-del-cipreret",
    "link": "https://socdepoble.net/2021/02/25/neteja-de-branques-seques-i-verdancs-de-larboc-del-cipreret/",
    "title": "Neteja de branques seques i verdancs de l’arboç del Cipreret",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Memfotisme",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/neteja-de-branques-seques-i-verdancs-de-larboc-del-cipreret"
  },
  {
    "id": 14742,
    "date": "2020-11-10T20:28:00",
    "slug": "un-patrimoni-desprotegit-i-abandonat-a-la-seua-sort",
    "link": "https://socdepoble.net/2020/11/10/un-patrimoni-desprotegit-i-abandonat-a-la-seua-sort/",
    "title": "Un Patrimoni desprotegit i abandonat a la seua sort",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "patrimoni-cultura",
    "categoriaTematicaProposadaLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "etiquetesOriginals": [
      "Memfotisme",
      "Patrimoni"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Patrimoni"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/un-patrimoni-desprotegit-i-abandonat-a-la-seua-sort"
  },
  {
    "id": 3651,
    "date": "2020-11-09T22:10:00",
    "slug": "cims-per-la-llengua-els-plans",
    "link": "https://socdepoble.net/2020/11/09/cims-per-la-llengua-els-plans/",
    "title": "Cims per la llengua. Els Plans",
    "poblesDetectats": [
      "L'Alacantí",
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "L'Alacantí",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Cims per la llengua",
      "Esdeveniments",
      "Excursions"
    ],
    "etiquetesNetes": [
      "Cims per la llengua",
      "Esdeveniments",
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/cims-per-la-llengua-els-plans"
  },
  {
    "id": 3652,
    "date": "2020-10-30T19:12:00",
    "slug": "caminada-per-la-marina-alta-de-la-platja-de-la-granadella-a-moraira",
    "link": "https://socdepoble.net/2020/10/30/caminada-per-la-marina-alta-de-la-platja-de-la-granadella-a-moraira/",
    "title": "Caminada per la Marina Alta; de la platja de la Granadella a Moraira",
    "poblesDetectats": [
      "Teulada - Moraira",
      "Xabia"
    ],
    "poblePrincipal": "Teulada - Moraira",
    "comarquesDetectades": [
      "La Marina Alta"
    ],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "El Camí",
      "Esdeveniments",
      "Excursions"
    ],
    "etiquetesNetes": [
      "El Camí",
      "Esdeveniments",
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/caminada-per-la-marina-alta-de-la-platja-de-la-granadella-a-moraira"
  },
  {
    "id": 3653,
    "date": "2020-10-30T18:51:00",
    "slug": "la-fissura-del-sostre-del-pou-de-neu",
    "link": "https://socdepoble.net/2020/10/30/la-fissura-del-sostre-del-pou-de-neu/",
    "title": "La fissura del sostre del pou de neu",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-fissura-del-sostre-del-pou-de-neu"
  },
  {
    "id": 3654,
    "date": "2020-10-14T23:43:00",
    "slug": "nova-edicio-de-cims-per-la-llengua",
    "link": "https://socdepoble.net/2020/10/14/nova-edicio-de-cims-per-la-llengua/",
    "title": "Nova edició de Cims per la Llengua",
    "poblesDetectats": [
      "L'Alacantí"
    ],
    "poblePrincipal": "L'Alacantí",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Cims per la llengua",
      "Excursions"
    ],
    "etiquetesNetes": [
      "Cims per la llengua",
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/nova-edicio-de-cims-per-la-llengua"
  },
  {
    "id": 10,
    "date": "2020-10-14T21:22:00",
    "slug": "caminada-pel-comptat-de-benilloba-a-gorga",
    "link": "https://socdepoble.net/2020/10/14/caminada-pel-comptat-de-benilloba-a-gorga/",
    "title": "Caminada pel Comtat: de Benilloba a Gorga",
    "poblesDetectats": [
      "Benasau",
      "Benilloba",
      "Gorga",
      "Penàguila"
    ],
    "poblePrincipal": "Benasau",
    "comarquesDetectades": [
      "El Comtat"
    ],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "El Camí",
      "Esdeveniments",
      "Excursions"
    ],
    "etiquetesNetes": [
      "El Camí",
      "Esdeveniments",
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/caminada-pel-comptat-de-benilloba-a-gorga"
  },
  {
    "id": 2002,
    "date": "2020-06-18T20:18:41",
    "slug": "moli-fariner-electric-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2020/06/18/moli-fariner-electric-de-la-torre-de-les-macanes/",
    "title": "Molí Fariner Elèctric de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Llibres",
      "Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Llibres",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/moli-fariner-electric-de-la-torre-de-les-macanes"
  },
  {
    "id": 3656,
    "date": "2020-04-17T16:21:00",
    "slug": "el-pou-de-la-neu-del-rentonar",
    "link": "https://socdepoble.net/2020/04/17/el-pou-de-la-neu-del-rentonar/",
    "title": "El Pou de la neu del Rentonar",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Recursos Locals"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-pou-de-la-neu-del-rentonar"
  },
  {
    "id": 3657,
    "date": "2020-03-17T21:46:00",
    "slug": "quan-tot-era-buit-primer-acte",
    "link": "https://socdepoble.net/2020/03/17/quan-tot-era-buit-primer-acte/",
    "title": "Quan tot era buit. Primer Acte",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Opinió"
    ],
    "etiquetesNetes": [
      "Opinió"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/quan-tot-era-buit-primer-acte"
  },
  {
    "id": 3658,
    "date": "2020-03-07T21:59:00",
    "slug": "calcotada-popular-2020-a-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2020/03/07/calcotada-popular-2020-a-la-torre-de-les-macanes/",
    "title": "Calçotada Popular 2020 a La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/calcotada-popular-2020-a-la-torre-de-les-macanes"
  },
  {
    "id": 3446,
    "date": "2019-09-30T22:11:00",
    "slug": "festa-fi-del-pla-eolic-de-la-zona-14",
    "link": "https://socdepoble.net/2019/09/30/festa-fi-del-pla-eolic-de-la-zona-14/",
    "title": "Festa fi del pla eòlic de la zona 14",
    "poblesDetectats": [
      "Benillup"
    ],
    "poblePrincipal": "Benillup",
    "comarquesDetectades": [
      "El Comtat"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/festa-fi-del-pla-eolic-de-la-zona-14"
  },
  {
    "id": 3660,
    "date": "2019-07-13T18:10:00",
    "slug": "mercat-artesanal-la-torre-de-les-macanes-2019",
    "link": "https://socdepoble.net/2019/07/13/mercat-artesanal-la-torre-de-les-macanes-2019/",
    "title": "Mercat Artesanal La Torre de les Maçanes 2019",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/mercat-artesanal-la-torre-de-les-macanes-2019"
  },
  {
    "id": 3661,
    "date": "2019-03-23T19:30:00",
    "slug": "calcotada-popular-2019-a-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2019/03/23/calcotada-popular-2019-a-la-torre-de-les-macanes/",
    "title": "Calçotada Popular 2019 a La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/calcotada-popular-2019-a-la-torre-de-les-macanes"
  },
  {
    "id": 3662,
    "date": "2018-04-02T21:47:00",
    "slug": "mercaet-de-benilloba-2018",
    "link": "https://socdepoble.net/2018/04/02/mercaet-de-benilloba-2018/",
    "title": "Mercaet de Benilloba 2018",
    "poblesDetectats": [
      "Benilloba"
    ],
    "poblePrincipal": "Benilloba",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/mercaet-de-benilloba-2018"
  },
  {
    "id": 3663,
    "date": "2018-03-20T22:15:00",
    "slug": "el-cami-mutxamel-el-campello-alacanti",
    "link": "https://socdepoble.net/2018/03/20/el-cami-mutxamel-el-campello-alacanti/",
    "title": "El Camí. Mutxamel – El Campello. Alacantí",
    "poblesDetectats": [
      "El Campello",
      "L'Alacantí",
      "Mutxamel"
    ],
    "poblePrincipal": "El Campello",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "El Camí",
      "Esdeveniments",
      "Excursions"
    ],
    "etiquetesNetes": [
      "El Camí",
      "Esdeveniments",
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cami-mutxamel-el-campello-alacanti"
  },
  {
    "id": 3664,
    "date": "2018-02-17T20:47:00",
    "slug": "el-cami-castello-de-rugat-pobla-del-duc-quatretonda-vall-dalbaida",
    "link": "https://socdepoble.net/2018/02/17/el-cami-castello-de-rugat-pobla-del-duc-quatretonda-vall-dalbaida/",
    "title": "El Camí. Castelló de Rugat – Pobla del Duc – Quatretonda. Vall d’Albaida",
    "poblesDetectats": [
      "Castelló de Rugat",
      "La Pobla del Duc",
      "La Vall d'Albaida",
      "Quatretonda"
    ],
    "poblePrincipal": "Castelló de Rugat",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "El Camí",
      "Esdeveniments",
      "Excursions"
    ],
    "etiquetesNetes": [
      "El Camí",
      "Esdeveniments",
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cami-castello-de-rugat-pobla-del-duc-quatretonda-vall-dalbaida"
  },
  {
    "id": 3665,
    "date": "2018-01-06T19:22:00",
    "slug": "el-cami-lorxa-vilallonga-el-comtat-la-safor",
    "link": "https://socdepoble.net/2018/01/06/el-cami-lorxa-vilallonga-el-comtat-la-safor/",
    "title": "El Camí. L’Orxa – Vilallonga. El Comtat – La Safor",
    "poblesDetectats": [
      "L'Orxa",
      "Vilallonga"
    ],
    "poblePrincipal": "L'Orxa",
    "comarquesDetectades": [
      "El Comtat",
      "La Safor"
    ],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "El Camí",
      "Esdeveniments",
      "Excursions"
    ],
    "etiquetesNetes": [
      "El Camí",
      "Esdeveniments",
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cami-lorxa-vilallonga-el-comtat-la-safor"
  },
  {
    "id": 3666,
    "date": "2017-11-30T17:13:00",
    "slug": "el-cami-banyeres-de-mariola-alcoi-caminada-per-lalcoia",
    "link": "https://socdepoble.net/2017/11/30/el-cami-banyeres-de-mariola-alcoi-caminada-per-lalcoia/",
    "title": "El Camí. Banyeres de Mariola – Alcoi. Caminada per l’Alcoià",
    "poblesDetectats": [
      "Alcoi",
      "Banyeres de Mariola",
      "L'Alcoià"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "El Camí",
      "Esdeveniments",
      "Excursions"
    ],
    "etiquetesNetes": [
      "El Camí",
      "Esdeveniments",
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cami-banyeres-de-mariola-alcoi-caminada-per-lalcoia"
  },
  {
    "id": 3634,
    "date": "2017-11-19T14:00:00",
    "slug": "jornades-per-la-defensa-dels-camins-publics",
    "link": "https://socdepoble.net/2017/11/19/jornades-per-la-defensa-dels-camins-publics/",
    "title": "Jornades per la defensa dels camins públics",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "patrimoni-cultura",
    "categoriaTematicaProposadaLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "etiquetesOriginals": [
      "Patrimoni",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Patrimoni",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/jornades-per-la-defensa-dels-camins-publics"
  },
  {
    "id": 3635,
    "date": "2017-10-15T20:16:00",
    "slug": "penya-la-blasca-ruta-dels-molins-banyeres-de-mariola",
    "link": "https://socdepoble.net/2017/10/15/penya-la-blasca-ruta-dels-molins-banyeres-de-mariola/",
    "title": "Penya La Blasca. Ruta dels Molins. Banyeres de Mariola",
    "poblesDetectats": [
      "Banyeres de Mariola"
    ],
    "poblePrincipal": "Banyeres de Mariola",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "iframe_extern_substituit",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/penya-la-blasca-ruta-dels-molins-banyeres-de-mariola"
  },
  {
    "id": 3636,
    "date": "2017-10-15T19:26:00",
    "slug": "el-cami-de-xixona-a-mutxamel",
    "link": "https://socdepoble.net/2017/10/15/el-cami-de-xixona-a-mutxamel/",
    "title": "El Camí. De Xixona a Mutxamel",
    "poblesDetectats": [
      "L'Alacantí",
      "Mutxamel",
      "Xixona"
    ],
    "poblePrincipal": "L'Alacantí",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cami-de-xixona-a-mutxamel"
  },
  {
    "id": 3637,
    "date": "2017-09-16T19:34:00",
    "slug": "vi-aplec-ecologista-del-pais-valencia",
    "link": "https://socdepoble.net/2017/09/16/vi-aplec-ecologista-del-pais-valencia/",
    "title": "VI Aplec Ecologista del País Valencià",
    "poblesDetectats": [
      "Carrícola"
    ],
    "poblePrincipal": "Carrícola",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/vi-aplec-ecologista-del-pais-valencia"
  },
  {
    "id": 35,
    "date": "2017-08-12T17:57:00",
    "slug": "cinque-aniversari-de-l-incendi-de-2012-a-la-torre",
    "link": "https://socdepoble.net/2017/08/12/cinque-aniversari-de-l-incendi-de-2012-a-la-torre/",
    "title": "Cinquè aniversari de l’incendi de 2012 a La Torre",
    "poblesDetectats": [
      "Benifallim",
      "La Torre de les Maçanes",
      "Penàguila"
    ],
    "poblePrincipal": "Benifallim",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Incendis",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Incendis",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/cinque-aniversari-de-l-incendi-de-2012-a-la-torre"
  },
  {
    "id": 3638,
    "date": "2017-08-11T01:30:00",
    "slug": "monolit-a-la-casa-de-cultura-en-memoria-de-ernesto-i-emilio",
    "link": "https://socdepoble.net/2017/08/11/monolit-a-la-casa-de-cultura-en-memoria-de-ernesto-i-emilio/",
    "title": "Monòlit a la Casa de Cultura en memòria de Ernesto i Emilio",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Incendis",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Incendis",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/monolit-a-la-casa-de-cultura-en-memoria-de-ernesto-i-emilio"
  },
  {
    "id": 3639,
    "date": "2017-07-27T19:06:00",
    "slug": "mapa-del-terme-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2017/07/27/mapa-del-terme-de-la-torre-de-les-macanes/",
    "title": "Mapa del terme",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Activitats",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Activitats",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "iframe_extern_substituit",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/mapa-del-terme-de-la-torre-de-les-macanes"
  },
  {
    "id": 3640,
    "date": "2017-07-16T22:30:00",
    "slug": "mercat-artesanal-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2017/07/16/mercat-artesanal-de-la-torre-de-les-macanes/",
    "title": "Mercat Artesanal de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/mercat-artesanal-de-la-torre-de-les-macanes"
  },
  {
    "id": 3641,
    "date": "2017-07-15T13:07:00",
    "slug": "el-castellar-dalcoi-amb-el-museu-arqueologic-camil-visedo",
    "link": "https://socdepoble.net/2017/07/15/el-castellar-dalcoi-amb-el-museu-arqueologic-camil-visedo/",
    "title": "El Castellar d’Alcoi amb el Museu Arqueològic Camil Visedo",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-castellar-dalcoi-amb-el-museu-arqueologic-camil-visedo"
  },
  {
    "id": 3642,
    "date": "2017-06-12T20:00:00",
    "slug": "el-cami-alcoi-cocentaina",
    "link": "https://socdepoble.net/2017/06/12/el-cami-alcoi-cocentaina/",
    "title": "El Camí. Alcoi – Cocentaina",
    "poblesDetectats": [
      "Alcoi",
      "Cocentaina",
      "L'Alcoià"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [
      "El Comtat"
    ],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cami-alcoi-cocentaina"
  },
  {
    "id": 3643,
    "date": "2017-06-10T23:30:00",
    "slug": "ii-trobada-de-pobles-per-la-diversitat-benillup",
    "link": "https://socdepoble.net/2017/06/10/ii-trobada-de-pobles-per-la-diversitat-benillup/",
    "title": "II Trobada de Pobles per la Diversitat. Benillup",
    "poblesDetectats": [
      "Benillup"
    ],
    "poblePrincipal": "Benillup",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/ii-trobada-de-pobles-per-la-diversitat-benillup"
  },
  {
    "id": 42,
    "date": "2017-05-28T19:00:00",
    "slug": "xiv-marxa-per-la-desmilitaritzacio-de-la-serra-aitana",
    "link": "https://socdepoble.net/2017/05/28/xiv-marxa-per-la-desmilitaritzacio-de-la-serra-aitana/",
    "title": "XIV Marxa per la Desmilitarització de la Serra Aitana",
    "poblesDetectats": [
      "Alcoleja",
      "Penàguila",
      "Sella"
    ],
    "poblePrincipal": "Alcoleja",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/xiv-marxa-per-la-desmilitaritzacio-de-la-serra-aitana"
  },
  {
    "id": 44,
    "date": "2017-05-22T13:06:00",
    "slug": "la-grana-des-del-collao",
    "link": "https://socdepoble.net/2017/05/22/la-grana-des-del-collao/",
    "title": "La Grana des del Collao",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-grana-des-del-collao"
  },
  {
    "id": 3645,
    "date": "2017-05-18T12:22:00",
    "slug": "el-cami-la-foia-d-elx",
    "link": "https://socdepoble.net/2017/05/18/el-cami-la-foia-d-elx/",
    "title": "El Camí. La Foia d’Elx",
    "poblesDetectats": [
      "Elx"
    ],
    "poblePrincipal": "Elx",
    "comarquesDetectades": [
      "El Baix Vinalopó"
    ],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cami-la-foia-d-elx"
  },
  {
    "id": 3646,
    "date": "2017-04-25T19:26:00",
    "slug": "el-cami-valencia-el-cabanyal-alboraia",
    "link": "https://socdepoble.net/2017/04/25/el-cami-valencia-el-cabanyal-alboraia/",
    "title": "El Camí. València – El Cabanyal – Alboraia",
    "poblesDetectats": [
      "Alboraia",
      "València"
    ],
    "poblePrincipal": "Alboraia",
    "comarquesDetectades": [
      "L'Horta Nord"
    ],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cami-valencia-el-cabanyal-alboraia"
  },
  {
    "id": 3647,
    "date": "2017-04-18T19:38:00",
    "slug": "el-cami-mutxamel-alacant",
    "link": "https://socdepoble.net/2017/04/18/el-cami-mutxamel-alacant/",
    "title": "El Camí. Mutxamel – Alacant",
    "poblesDetectats": [
      "Alacant",
      "L'Alacantí",
      "Mutxamel"
    ],
    "poblePrincipal": "Alacant",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cami-mutxamel-alacant"
  },
  {
    "id": 3648,
    "date": "2017-04-14T22:30:00",
    "slug": "fireta-de-benilloba-2017",
    "link": "https://socdepoble.net/2017/04/14/fireta-de-benilloba-2017/",
    "title": "Fireta de Benilloba 2017",
    "poblesDetectats": [
      "Benilloba"
    ],
    "poblePrincipal": "Benilloba",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/fireta-de-benilloba-2017"
  },
  {
    "id": 619,
    "date": "2017-04-10T19:00:25",
    "slug": "cataleg-d-arbres-emblematics-i-monumentals-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2017/04/10/cataleg-d-arbres-emblematics-i-monumentals-de-la-torre-de-les-macanes/",
    "title": "Catàleg d’Arbres Emblemàtics i Monumentals de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Arbres Monumentals",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/cataleg-d-arbres-emblematics-i-monumentals-de-la-torre-de-les-macanes"
  },
  {
    "id": 3649,
    "date": "2017-03-23T22:09:00",
    "slug": "el-cami-teulada-poble-nou-de-benitatxell-xabia",
    "link": "https://socdepoble.net/2017/03/23/el-cami-teulada-poble-nou-de-benitatxell-xabia/",
    "title": "El Camí. Teulada – Poble Nou de Benitatxell – Xabia",
    "poblesDetectats": [
      "El Poble Nou de Benitatxell",
      "Teulada - Moraira",
      "Xabia"
    ],
    "poblePrincipal": "El Poble Nou de Benitatxell",
    "comarquesDetectades": [
      "La Marina Alta"
    ],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cami-teulada-poble-nou-de-benitatxell-xabia"
  },
  {
    "id": 3616,
    "date": "2017-03-06T21:11:00",
    "slug": "cartografia-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2017/03/06/cartografia-de-la-torre-de-les-macanes/",
    "title": "Cartografia de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/cartografia-de-la-torre-de-les-macanes"
  },
  {
    "id": 3617,
    "date": "2017-03-01T00:28:00",
    "slug": "els-xops-blancs-del-pont-amenacats",
    "link": "https://socdepoble.net/2017/03/01/els-xops-blancs-del-pont-amenacats/",
    "title": "Els xops blancs del pont amenaçats",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/els-xops-blancs-del-pont-amenacats"
  },
  {
    "id": 3618,
    "date": "2017-02-09T23:59:00",
    "slug": "el-cami-benidorm-la-vila-joiosa",
    "link": "https://socdepoble.net/2017/02/09/el-cami-benidorm-la-vila-joiosa/",
    "title": "El Camí. Benidorm – La Vila Joiosa",
    "poblesDetectats": [
      "Benidorm",
      "La Vila Joiosa"
    ],
    "poblePrincipal": "Benidorm",
    "comarquesDetectades": [
      "La Marina Baixa"
    ],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cami-benidorm-la-vila-joiosa"
  },
  {
    "id": 3619,
    "date": "2017-02-09T23:38:00",
    "slug": "el-cami-orxeta-relleu",
    "link": "https://socdepoble.net/2017/02/09/el-cami-orxeta-relleu/",
    "title": "El Camí. Orxeta – Relleu",
    "poblesDetectats": [
      "Orxeta",
      "Relleu"
    ],
    "poblePrincipal": "Orxeta",
    "comarquesDetectades": [
      "La Marina Baixa"
    ],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cami-orxeta-relleu"
  },
  {
    "id": 55,
    "date": "2017-02-02T11:48:00",
    "slug": "salvem-benillup",
    "link": "https://socdepoble.net/2017/02/02/salvem-benillup/",
    "title": "Salvem Benillup",
    "poblesDetectats": [
      "Benillup"
    ],
    "poblePrincipal": "Benillup",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/salvem-benillup"
  },
  {
    "id": 3620,
    "date": "2016-10-31T20:41:00",
    "slug": "colonia-agricola-dels-plans-2016",
    "link": "https://socdepoble.net/2016/10/31/colonia-agricola-dels-plans-2016/",
    "title": "Colònia Agrícola dels Plans, 2016",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/colonia-agricola-dels-plans-2016"
  },
  {
    "id": 3621,
    "date": "2016-10-16T00:49:00",
    "slug": "4t-aplec-de-la-mariola",
    "link": "https://socdepoble.net/2016/10/16/4t-aplec-de-la-mariola/",
    "title": "4t Aplec de la Mariola",
    "poblesDetectats": [
      "Ibi"
    ],
    "poblePrincipal": "Ibi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/4t-aplec-de-la-mariola"
  },
  {
    "id": 3622,
    "date": "2016-09-27T12:34:00",
    "slug": "8-doctubre-agres-cava-gran-montcabrer-agres",
    "link": "https://socdepoble.net/2016/09/27/8-doctubre-agres-cava-gran-montcabrer-agres/",
    "title": "8 d’octubre. Agres – Cava Gran – Montcabrer – Agres",
    "poblesDetectats": [
      "Agres"
    ],
    "poblePrincipal": "Agres",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/8-doctubre-agres-cava-gran-montcabrer-agres"
  },
  {
    "id": 3623,
    "date": "2016-09-21T12:24:00",
    "slug": "les-colonies-de-la-serra-els-plans",
    "link": "https://socdepoble.net/2016/09/21/les-colonies-de-la-serra-els-plans/",
    "title": "Les Colònies de la Serra els Plans",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/les-colonies-de-la-serra-els-plans"
  },
  {
    "id": 3624,
    "date": "2016-08-12T12:55:00",
    "slug": "homenatge-als-qui-han-donat-la-vida-en-la-lluita-contra-els-incendis-forestals",
    "link": "https://socdepoble.net/2016/08/12/homenatge-als-qui-han-donat-la-vida-en-la-lluita-contra-els-incendis-forestals/",
    "title": "Homenatge als qui han donat la vida en la lluita contra els Incendis Forestals",
    "poblesDetectats": [
      "Benifallim",
      "La Torre de les Maçanes",
      "Penàguila"
    ],
    "poblePrincipal": "Benifallim",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Incendis"
    ],
    "etiquetesNetes": [
      "Incendis"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/homenatge-als-qui-han-donat-la-vida-en-la-lluita-contra-els-incendis-forestals"
  },
  {
    "id": 3625,
    "date": "2016-08-08T22:13:00",
    "slug": "incendi-al-mas-del-xipreret",
    "link": "https://socdepoble.net/2016/08/08/incendi-al-mas-del-xipreret/",
    "title": "Incendi al mas del Xipreret",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Incendis"
    ],
    "etiquetesNetes": [
      "Incendis"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/incendi-al-mas-del-xipreret"
  },
  {
    "id": 3626,
    "date": "2016-07-12T10:09:00",
    "slug": "presentacio-del-llibre-el-robatori-de-benimassot",
    "link": "https://socdepoble.net/2016/07/12/presentacio-del-llibre-el-robatori-de-benimassot/",
    "title": "Presentació del llibre El robatori de Benimassot",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Activitats"
    ],
    "etiquetesNetes": [
      "Activitats"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/presentacio-del-llibre-el-robatori-de-benimassot"
  },
  {
    "id": 3627,
    "date": "2016-06-12T20:12:00",
    "slug": "trobada-de-pobles-per-la-diversitat",
    "link": "https://socdepoble.net/2016/06/12/trobada-de-pobles-per-la-diversitat/",
    "title": "Trobada de pobles per la diversitat",
    "poblesDetectats": [
      "Tibi"
    ],
    "poblePrincipal": "Tibi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/trobada-de-pobles-per-la-diversitat"
  },
  {
    "id": 3628,
    "date": "2016-04-12T15:20:00",
    "slug": "campanya-d-ajuda-als-refugiats-de-guerra",
    "link": "https://socdepoble.net/2016/04/12/campanya-d-ajuda-als-refugiats-de-guerra/",
    "title": "Campanya d’ajuda als refugiats de guerra",
    "poblesDetectats": [
      "La Torre de les Maçanes",
      "Onil",
      "Xixona"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Activitats"
    ],
    "etiquetesNetes": [
      "Activitats"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/campanya-d-ajuda-als-refugiats-de-guerra"
  },
  {
    "id": 65,
    "date": "2016-04-05T14:04:00",
    "slug": "el-cami-descobrim-el-cami-per-benissa-senija-lliber-i-xalo",
    "link": "https://socdepoble.net/2016/04/05/el-cami-descobrim-el-cami-per-benissa-senija-lliber-i-xalo/",
    "title": "El Camí. Descobrim El Camí per Benissa, Senija, Llíber i Xaló",
    "poblesDetectats": [
      "Benissa",
      "Llíber",
      "Senija",
      "Xaló"
    ],
    "poblePrincipal": "Benissa",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cami-descobrim-el-cami-per-benissa-senija-lliber-i-xalo"
  },
  {
    "id": 3629,
    "date": "2016-04-01T19:59:00",
    "slug": "ajuda-als-refugiats",
    "link": "https://socdepoble.net/2016/04/01/ajuda-als-refugiats/",
    "title": "Ajuda als refugiats",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Activitats"
    ],
    "etiquetesNetes": [
      "Activitats"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/ajuda-als-refugiats"
  },
  {
    "id": 3630,
    "date": "2016-03-29T23:30:00",
    "slug": "jornada-d-escalada-a-la-torre",
    "link": "https://socdepoble.net/2016/03/29/jornada-d-escalada-a-la-torre/",
    "title": "Jornada d’escalada a La Torre",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Activitats",
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Activitats",
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/jornada-d-escalada-a-la-torre"
  },
  {
    "id": 3632,
    "date": "2016-03-25T22:26:00",
    "slug": "fireta-de-benilloba-2016",
    "link": "https://socdepoble.net/2016/03/25/fireta-de-benilloba-2016/",
    "title": "Fireta de Benilloba 2016",
    "poblesDetectats": [
      "Benilloba"
    ],
    "poblePrincipal": "Benilloba",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/fireta-de-benilloba-2016"
  },
  {
    "id": 3633,
    "date": "2016-03-22T13:50:00",
    "slug": "el-cami-la-vall-de-gallinera-marina-alta-26-de-marc",
    "link": "https://socdepoble.net/2016/03/22/el-cami-la-vall-de-gallinera-marina-alta-26-de-marc/",
    "title": "El Camí. La Vall de Gallinera, Marina Alta",
    "poblesDetectats": [
      "La Vall de Gallinera"
    ],
    "poblePrincipal": "La Vall de Gallinera",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cami-la-vall-de-gallinera-marina-alta-26-de-marc"
  },
  {
    "id": 3599,
    "date": "2016-02-23T00:30:00",
    "slug": "el-cami-ha-arribat-a-la-comarca-de-lalacanti-per-la-marina",
    "link": "https://socdepoble.net/2016/02/23/el-cami-ha-arribat-a-la-comarca-de-lalacanti-per-la-marina/",
    "title": "El Camí ha arribat a la comarca de l’Alacantí per la Marina",
    "poblesDetectats": [
      "L'Alacantí",
      "La Torre de les Maçanes",
      "Relleu",
      "Xixona"
    ],
    "poblePrincipal": "L'Alacantí",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cami-ha-arribat-a-la-comarca-de-lalacanti-per-la-marina"
  },
  {
    "id": 72,
    "date": "2016-02-07T00:56:00",
    "slug": "el-cami-altea-serra-gelada-benidorm",
    "link": "https://socdepoble.net/2016/02/07/el-cami-altea-serra-gelada-benidorm/",
    "title": "El Camí. Altea – Serra Gelada – Benidorm",
    "poblesDetectats": [
      "Altea",
      "Benidorm"
    ],
    "poblePrincipal": "Altea",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cami-altea-serra-gelada-benidorm"
  },
  {
    "id": 3600,
    "date": "2016-02-02T10:43:00",
    "slug": "la-torre-xixona-diumenge-21-de-febrer",
    "link": "https://socdepoble.net/2016/02/02/la-torre-xixona-diumenge-21-de-febrer/",
    "title": "El Camí. Excursió La Torre – Xixona",
    "poblesDetectats": [
      "La Torre de les Maçanes",
      "Xixona"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-torre-xixona-diumenge-21-de-febrer"
  },
  {
    "id": 3601,
    "date": "2016-02-02T10:33:00",
    "slug": "el-cami-relleu-la-torre-dissabte-20-de-febrer",
    "link": "https://socdepoble.net/2016/02/02/el-cami-relleu-la-torre-dissabte-20-de-febrer/",
    "title": "El Camí. Excursió Relleu – La Torre",
    "poblesDetectats": [
      "La Torre de les Maçanes",
      "Relleu"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cami-relleu-la-torre-dissabte-20-de-febrer"
  },
  {
    "id": 3602,
    "date": "2016-02-01T10:23:00",
    "slug": "el-cami-descobrim-la-marina-6-i-7-de-febrer",
    "link": "https://socdepoble.net/2016/02/01/el-cami-descobrim-la-marina-6-i-7-de-febrer/",
    "title": "El Camí. Descobrim la Marina 6 i 7 de febrer",
    "poblesDetectats": [
      "Altea",
      "Benidorm",
      "Calp",
      "Teulada - Moraira"
    ],
    "poblePrincipal": "Altea",
    "comarquesDetectades": [
      "La Marina Alta",
      "La Marina Baixa"
    ],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cami-descobrim-la-marina-6-i-7-de-febrer"
  },
  {
    "id": 3603,
    "date": "2015-10-20T19:12:00",
    "slug": "assemblea-fi-del-pla-eolic-valencia-a-benillup",
    "link": "https://socdepoble.net/2015/10/20/assemblea-fi-del-pla-eolic-valencia-a-benillup/",
    "title": "Assemblea fi del Pla Eòlic Valencià a Benillup",
    "poblesDetectats": [
      "Benillup"
    ],
    "poblePrincipal": "Benillup",
    "comarquesDetectades": [
      "El Comtat"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Esdeveniments",
      "Pla Eòlic",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Esdeveniments",
      "Pla Eòlic",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/assemblea-fi-del-pla-eolic-valencia-a-benillup"
  },
  {
    "id": 3604,
    "date": "2015-10-15T18:10:00",
    "slug": "la-generalitat-possa-fi-al-pla-eolic-del-comtat",
    "link": "https://socdepoble.net/2015/10/15/la-generalitat-possa-fi-al-pla-eolic-del-comtat/",
    "title": "La Generalitat possa fi al Pla Eòlic del Comtat",
    "poblesDetectats": [
      "Benillup"
    ],
    "poblePrincipal": "Benillup",
    "comarquesDetectades": [
      "El Comtat"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Esdeveniments",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Esdeveniments",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-generalitat-possa-fi-al-pla-eolic-del-comtat"
  },
  {
    "id": 3605,
    "date": "2015-10-14T19:56:00",
    "slug": "serrella-per-quatretondeta",
    "link": "https://socdepoble.net/2015/10/14/serrella-per-quatretondeta/",
    "title": "Serrella per Quatretondeta",
    "poblesDetectats": [
      "Quatretondeta"
    ],
    "poblePrincipal": "Quatretondeta",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/serrella-per-quatretondeta"
  },
  {
    "id": 79,
    "date": "2015-10-05T20:08:00",
    "slug": "el-9-doctubre-passegem-per-la-font-roja",
    "link": "https://socdepoble.net/2015/10/05/el-9-doctubre-passegem-per-la-font-roja/",
    "title": "El 9 d’octubre passegem per La Font Roja",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-9-doctubre-passegem-per-la-font-roja"
  },
  {
    "id": 3606,
    "date": "2015-10-04T13:38:00",
    "slug": "3r-aplec-de-la-mariola-escola-rural-pobles-vius",
    "link": "https://socdepoble.net/2015/10/04/3r-aplec-de-la-mariola-escola-rural-pobles-vius/",
    "title": "3r Aplec de la Mariola. Escola rural, pobles vius",
    "poblesDetectats": [
      "Agres"
    ],
    "poblePrincipal": "Agres",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/3r-aplec-de-la-mariola-escola-rural-pobles-vius"
  },
  {
    "id": 3607,
    "date": "2015-08-31T14:46:00",
    "slug": "excursio-a-les-agulles-dels-frares-serrella",
    "link": "https://socdepoble.net/2015/08/31/excursio-a-les-agulles-dels-frares-serrella/",
    "title": "Excursió a les Agulles dels Frares, Serrella",
    "poblesDetectats": [
      "Quatretondeta"
    ],
    "poblePrincipal": "Quatretondeta",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-a-les-agulles-dels-frares-serrella"
  },
  {
    "id": 3608,
    "date": "2015-08-16T18:25:00",
    "slug": "la-nova-llei-de-montes",
    "link": "https://socdepoble.net/2015/08/16/la-nova-llei-de-montes/",
    "title": "La nova llei de montes",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-nova-llei-de-montes"
  },
  {
    "id": 3609,
    "date": "2015-08-10T18:32:00",
    "slug": "excursions-de-cims-per-la-llengua",
    "link": "https://socdepoble.net/2015/08/10/excursions-de-cims-per-la-llengua/",
    "title": "Excursions de Cims per la llengua",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "galeria_fotos",
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursions-de-cims-per-la-llengua"
  },
  {
    "id": 84,
    "date": "2015-08-02T12:37:00",
    "slug": "salvem-el-molinar-exposa-els-seus-arguments-per-oposar-se-al-projecte-dalcoinnova-a-la-canal-dalcoi",
    "link": "https://socdepoble.net/2015/08/02/salvem-el-molinar-exposa-els-seus-arguments-per-oposar-se-al-projecte-dalcoinnova-a-la-canal-dalcoi/",
    "title": "«Salvem el Molinar» exposa els seus arguments per oposar-se al projecte d’Alcoinnova a la Canal d’Alcoi",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/salvem-el-molinar-exposa-els-seus-arguments-per-oposar-se-al-projecte-dalcoinnova-a-la-canal-dalcoi"
  },
  {
    "id": 3610,
    "date": "2015-07-30T12:42:00",
    "slug": "la-nova-directora-general-denergia-es-reuneix-amb-la-coordinadora-destudis-eolics-del-comtat",
    "link": "https://socdepoble.net/2015/07/30/la-nova-directora-general-denergia-es-reuneix-amb-la-coordinadora-destudis-eolics-del-comtat/",
    "title": "La nova Directora General d’Energia es reuneix amb La Coordinadora d’Estudis Eòlics del Comtat",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [
      "El Comtat"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-nova-directora-general-denergia-es-reuneix-amb-la-coordinadora-destudis-eolics-del-comtat"
  },
  {
    "id": 3611,
    "date": "2015-07-21T23:21:00",
    "slug": "xixona-es-mobilitza-i-ho-aconsegueix",
    "link": "https://socdepoble.net/2015/07/21/xixona-es-mobilitza-i-ho-aconsegueix/",
    "title": "Xixona es mobilitza i ho aconsegueix",
    "poblesDetectats": [
      "Xixona"
    ],
    "poblePrincipal": "Xixona",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/xixona-es-mobilitza-i-ho-aconsegueix"
  },
  {
    "id": 3612,
    "date": "2015-07-19T14:53:00",
    "slug": "benilloba-diu-no-a-la-tala-de-sis-ciprers-del-calvari",
    "link": "https://socdepoble.net/2015/07/19/benilloba-diu-no-a-la-tala-de-sis-ciprers-del-calvari/",
    "title": "Benilloba diu no a la tala de sis ciprers del calvari",
    "poblesDetectats": [
      "Benilloba"
    ],
    "poblePrincipal": "Benilloba",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/benilloba-diu-no-a-la-tala-de-sis-ciprers-del-calvari"
  },
  {
    "id": 3613,
    "date": "2015-06-05T23:30:00",
    "slug": "cims-per-la-llengua-l-escobella",
    "link": "https://socdepoble.net/2015/06/05/cims-per-la-llengua-l-escobella/",
    "title": "Cims per la llengua – L’Escobella",
    "poblesDetectats": [
      "Sant Vicent del Raspeig"
    ],
    "poblePrincipal": "Sant Vicent del Raspeig",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/cims-per-la-llengua-l-escobella"
  },
  {
    "id": 3614,
    "date": "2015-05-19T12:51:00",
    "slug": "remarcant-el-cami-de-santiago-a-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2015/05/19/remarcant-el-cami-de-santiago-a-la-torre-de-les-macanes/",
    "title": "Remarcant el Camí de Santiago a La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/remarcant-el-cami-de-santiago-a-la-torre-de-les-macanes"
  },
  {
    "id": 1588,
    "date": "2015-05-12T16:45:38",
    "slug": "un-poble-de-cancons-komfusio",
    "link": "https://socdepoble.net/2015/05/12/un-poble-de-cancons-komfusio/",
    "title": "Un poble de cançons – Komfusió,  23 de maig",
    "poblesDetectats": [
      "Sella"
    ],
    "poblePrincipal": "Sella",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "patrimoni-cultura",
    "categoriaTematicaProposadaLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/un-poble-de-cancons-komfusio"
  },
  {
    "id": 3615,
    "date": "2015-05-03T13:50:00",
    "slug": "les-coses-que-ens-agrada-fer",
    "link": "https://socdepoble.net/2015/05/03/les-coses-que-ens-agrada-fer/",
    "title": "Les coses que ens agrada fer",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/les-coses-que-ens-agrada-fer"
  },
  {
    "id": 3581,
    "date": "2015-05-02T10:26:00",
    "slug": "pel-cami-del-tren-xixarra",
    "link": "https://socdepoble.net/2015/05/02/pel-cami-del-tren-xixarra/",
    "title": "Pel camí del tren Xixarra",
    "poblesDetectats": [
      "Alacant",
      "Alcoi",
      "Algemesí",
      "L'Orxa",
      "Vilallonga"
    ],
    "poblePrincipal": "Alacant",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/pel-cami-del-tren-xixarra"
  },
  {
    "id": 3582,
    "date": "2015-04-25T23:19:00",
    "slug": "25-dabril-a-sant-vicent-diada-del-pais-valencia",
    "link": "https://socdepoble.net/2015/04/25/25-dabril-a-sant-vicent-diada-del-pais-valencia/",
    "title": "25 d’abril a Sant Vicent – Diada del País Valencià",
    "poblesDetectats": [
      "Sant Vicent del Raspeig"
    ],
    "poblePrincipal": "Sant Vicent del Raspeig",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/25-dabril-a-sant-vicent-diada-del-pais-valencia"
  },
  {
    "id": 3583,
    "date": "2015-04-05T09:00:00",
    "slug": "cims-per-la-llengua-serra-la-grana",
    "link": "https://socdepoble.net/2015/04/05/cims-per-la-llengua-serra-la-grana/",
    "title": "Cims per la llengua. Serra La Grana",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/cims-per-la-llengua-serra-la-grana"
  },
  {
    "id": 3584,
    "date": "2015-04-03T22:54:00",
    "slug": "fireta-de-benilloba-2015",
    "link": "https://socdepoble.net/2015/04/03/fireta-de-benilloba-2015/",
    "title": "Fireta de Benilloba 2015",
    "poblesDetectats": [
      "Benilloba"
    ],
    "poblePrincipal": "Benilloba",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/fireta-de-benilloba-2015"
  },
  {
    "id": 96,
    "date": "2015-03-08T15:53:00",
    "slug": "el-cim-dels-plans-finalment-net",
    "link": "https://socdepoble.net/2015/03/08/el-cim-dels-plans-finalment-net/",
    "title": "El cim dels Plans… finalment net!",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cim-dels-plans-finalment-net"
  },
  {
    "id": 3586,
    "date": "2015-03-07T17:25:00",
    "slug": "cims-per-la-llengua-alt-de-la-martina",
    "link": "https://socdepoble.net/2015/03/07/cims-per-la-llengua-alt-de-la-martina/",
    "title": "Cims per la llengua. Alt de La Martina",
    "poblesDetectats": [
      "Xixona"
    ],
    "poblePrincipal": "Xixona",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/cims-per-la-llengua-alt-de-la-martina"
  },
  {
    "id": 3587,
    "date": "2015-02-15T15:48:00",
    "slug": "farts-de-paraules-mirem-els-fets",
    "link": "https://socdepoble.net/2015/02/15/farts-de-paraules-mirem-els-fets/",
    "title": "Farts de paraules. Mirem els fets",
    "poblesDetectats": [
      "Benifallim",
      "Benilloba",
      "L'Alcoià",
      "Penàguila"
    ],
    "poblePrincipal": "Benifallim",
    "comarquesDetectades": [
      "El Comtat"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/farts-de-paraules-mirem-els-fets"
  },
  {
    "id": 3461,
    "date": "2015-02-10T01:15:00",
    "slug": "no-a-la-planta-de-tractament-de-fangs-de-depuradora-de-penaguila",
    "link": "https://socdepoble.net/2015/02/10/no-a-la-planta-de-tractament-de-fangs-de-depuradora-de-penaguila/",
    "title": "NO a la Planta de tractament de fangs de depuradora de Penàguila",
    "poblesDetectats": [
      "Benilloba",
      "L'Alcoià",
      "Penàguila"
    ],
    "poblePrincipal": "Benilloba",
    "comarquesDetectades": [
      "El Comtat"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "pdf_drive_docs",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/no-a-la-planta-de-tractament-de-fangs-de-depuradora-de-penaguila"
  },
  {
    "id": 100,
    "date": "2015-01-08T21:50:00",
    "slug": "cims-per-la-llengua-cabeco-d-or",
    "link": "https://socdepoble.net/2015/01/08/cims-per-la-llengua-cabeco-d-or/",
    "title": "Cims per la llengua. Cabeçó d’Or",
    "poblesDetectats": [
      "Busot"
    ],
    "poblePrincipal": "Busot",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/cims-per-la-llengua-cabeco-d-or"
  },
  {
    "id": 3589,
    "date": "2014-12-10T01:49:00",
    "slug": "cims-per-la-llengua-el-maigmo",
    "link": "https://socdepoble.net/2014/12/10/cims-per-la-llengua-el-maigmo/",
    "title": "Cims per la llengua. El Maigmó",
    "poblesDetectats": [
      "Tibi"
    ],
    "poblePrincipal": "Tibi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/cims-per-la-llengua-el-maigmo"
  },
  {
    "id": 3590,
    "date": "2014-11-08T19:30:00",
    "slug": "cims-per-la-llengua-els-plans-2",
    "link": "https://socdepoble.net/2014/11/08/cims-per-la-llengua-els-plans-2/",
    "title": "Cims per la llengua. Els Plans",
    "poblesDetectats": [
      "Benifallim",
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "Benifallim",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/cims-per-la-llengua-els-plans-2"
  },
  {
    "id": 3130,
    "date": "2014-11-03T22:32:00",
    "slug": "daniel-climent-a-laplec-pel-territori-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2014/11/03/daniel-climent-a-laplec-pel-territori-de-la-torre-de-les-macanes/",
    "title": "Daniel Climent a l’Aplec pel Territori de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/daniel-climent-a-laplec-pel-territori-de-la-torre-de-les-macanes"
  },
  {
    "id": 3592,
    "date": "2014-10-25T10:42:00",
    "slug": "cims-per-la-llengua-la-carrasqueta",
    "link": "https://socdepoble.net/2014/10/25/cims-per-la-llengua-la-carrasqueta/",
    "title": "Cims per la llengua. La Carrasqueta",
    "poblesDetectats": [
      "Xixona"
    ],
    "poblePrincipal": "Xixona",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/cims-per-la-llengua-la-carrasqueta"
  },
  {
    "id": 3142,
    "date": "2014-10-21T00:31:00",
    "slug": "exit-apoteosic-de-laplec-pel-territori-aquest-cap-de-setmana-a-la-torre",
    "link": "https://socdepoble.net/2014/10/21/exit-apoteosic-de-laplec-pel-territori-aquest-cap-de-setmana-a-la-torre/",
    "title": "Èxit apoteòsic de l’Aplec pel Territori aquest cap de setmana a La Torre",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/exit-apoteosic-de-laplec-pel-territori-aquest-cap-de-setmana-a-la-torre"
  },
  {
    "id": 3595,
    "date": "2014-10-09T12:41:00",
    "slug": "exursio-9-doctubre",
    "link": "https://socdepoble.net/2014/10/09/exursio-9-doctubre/",
    "title": "Exursió 9 d’octubre",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/exursio-9-doctubre"
  },
  {
    "id": 3596,
    "date": "2014-10-07T19:01:00",
    "slug": "2n-aplec-de-la-mariola",
    "link": "https://socdepoble.net/2014/10/07/2n-aplec-de-la-mariola/",
    "title": "2n Aplec de la Mariola",
    "poblesDetectats": [
      "Banyeres de Mariola"
    ],
    "poblePrincipal": "Banyeres de Mariola",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/2n-aplec-de-la-mariola"
  },
  {
    "id": 3597,
    "date": "2014-10-05T11:54:00",
    "slug": "alfaro-tornara-a-estar-protegida-com-a-zepa",
    "link": "https://socdepoble.net/2014/10/05/alfaro-tornara-a-estar-protegida-com-a-zepa/",
    "title": "Alfaro tornarà a estar protegida com a ZEPA",
    "poblesDetectats": [
      "Castell de Castells",
      "Fageca",
      "Famorca",
      "Tollos"
    ],
    "poblePrincipal": "Castell de Castells",
    "comarquesDetectades": [
      "El Comtat",
      "La Marina Alta"
    ],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/alfaro-tornara-a-estar-protegida-com-a-zepa"
  },
  {
    "id": 3598,
    "date": "2014-10-02T21:58:00",
    "slug": "2n-aplec-de-la-mariola-banyeres-de-mariola",
    "link": "https://socdepoble.net/2014/10/02/2n-aplec-de-la-mariola-banyeres-de-mariola/",
    "title": "2n Aplec de la Mariola. Banyeres de Mariola",
    "poblesDetectats": [
      "Banyeres de Mariola"
    ],
    "poblePrincipal": "Banyeres de Mariola",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/2n-aplec-de-la-mariola-banyeres-de-mariola"
  },
  {
    "id": 3384,
    "date": "2014-09-26T17:08:00",
    "slug": "fullet-del-terme-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2014/09/26/fullet-del-terme-de-la-torre-de-les-macanes/",
    "title": "Fullet del Terme de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/fullet-del-terme-de-la-torre-de-les-macanes"
  },
  {
    "id": 3203,
    "date": "2014-09-25T03:14:00",
    "slug": "komfusio-a-laplec-pel-territori",
    "link": "https://socdepoble.net/2014/09/25/komfusio-a-laplec-pel-territori/",
    "title": "Komfusió a l’Aplec pel Territori",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/komfusio-a-laplec-pel-territori"
  },
  {
    "id": 3201,
    "date": "2014-09-24T03:11:00",
    "slug": "la-caixa-de-gel-a-laplec-pel-territori",
    "link": "https://socdepoble.net/2014/09/24/la-caixa-de-gel-a-laplec-pel-territori/",
    "title": "La Caixa de Gel a l’Aplec pel Territori",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/la-caixa-de-gel-a-laplec-pel-territori"
  },
  {
    "id": 3199,
    "date": "2014-09-23T03:08:00",
    "slug": "pelandruska-a-laplec-pel-territori",
    "link": "https://socdepoble.net/2014/09/23/pelandruska-a-laplec-pel-territori/",
    "title": "Pelandruska a l’Aplec pel Territori",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/pelandruska-a-laplec-pel-territori"
  },
  {
    "id": 3391,
    "date": "2014-09-22T17:31:00",
    "slug": "sac-de-fotos",
    "link": "https://socdepoble.net/2014/09/22/sac-de-fotos/",
    "title": "Sac de Fotos",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [
      "El Comtat"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Documentació",
      "Fotos"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Documentació",
      "Fotos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "pdf_drive_docs",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/sac-de-fotos"
  },
  {
    "id": 3197,
    "date": "2014-09-22T03:04:00",
    "slug": "soca-en-arrel-a-laplec-pel-territori",
    "link": "https://socdepoble.net/2014/09/22/soca-en-arrel-a-laplec-pel-territori/",
    "title": "Soca en Arrel a l’Aplec pel Territori",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/soca-en-arrel-a-laplec-pel-territori"
  },
  {
    "id": 3195,
    "date": "2014-09-21T03:01:00",
    "slug": "concert-a-laplec-pel-territori-amb-pelandruska-la-caixa-de-gel-i-komfusio",
    "link": "https://socdepoble.net/2014/09/21/concert-a-laplec-pel-territori-amb-pelandruska-la-caixa-de-gel-i-komfusio/",
    "title": "Concert a l’Aplec pel Territori, amb Pelandruska, La Caixa de Gel i Komfusió",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/concert-a-laplec-pel-territori-amb-pelandruska-la-caixa-de-gel-i-komfusio"
  },
  {
    "id": 3193,
    "date": "2014-09-20T02:56:00",
    "slug": "eugeni-alemany-a-laplec-pel-territori",
    "link": "https://socdepoble.net/2014/09/20/eugeni-alemany-a-laplec-pel-territori/",
    "title": "Eugeni Alemany a l’Aplec pel Territori",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/eugeni-alemany-a-laplec-pel-territori"
  },
  {
    "id": 3189,
    "date": "2014-09-19T02:43:00",
    "slug": "taula-rodona-a-laplec-pel-territori",
    "link": "https://socdepoble.net/2014/09/19/taula-rodona-a-laplec-pel-territori/",
    "title": "Taula Rodona a l’Aplec pel Territori",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "iframe_extern_substituit",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/taula-rodona-a-laplec-pel-territori"
  },
  {
    "id": 3191,
    "date": "2014-09-18T23:50:00",
    "slug": "exposicio-fotografica-a-laplec-pel-territori-paisatges-de-la-muntanya",
    "link": "https://socdepoble.net/2014/09/18/exposicio-fotografica-a-laplec-pel-territori-paisatges-de-la-muntanya/",
    "title": "Exposició Fotogràfica a l’Aplec pel Territori. Paisatges de la Muntanya",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/exposicio-fotografica-a-laplec-pel-territori-paisatges-de-la-muntanya"
  },
  {
    "id": 3160,
    "date": "2014-09-18T01:51:00",
    "slug": "excursio-etnobotanica-amb-dani-climent",
    "link": "https://socdepoble.net/2014/09/18/excursio-etnobotanica-amb-dani-climent/",
    "title": "Excursió Etnobotànica amb Dani Climent",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-etnobotanica-amb-dani-climent"
  },
  {
    "id": 3183,
    "date": "2014-09-18T00:15:00",
    "slug": "dinar-popular-al-parc-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2014/09/18/dinar-popular-al-parc-de-la-torre-de-les-macanes/",
    "title": "Dinar Popular al Parc de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/dinar-popular-al-parc-de-la-torre-de-les-macanes"
  },
  {
    "id": 3453,
    "date": "2014-09-17T23:59:00",
    "slug": "planol-de-situacio-de-laplec-pel-territori",
    "link": "https://socdepoble.net/2014/09/17/planol-de-situacio-de-laplec-pel-territori/",
    "title": "Plànol de situació de l’Aplec pel Territori",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/planol-de-situacio-de-laplec-pel-territori"
  },
  {
    "id": 3457,
    "date": "2014-09-17T23:55:00",
    "slug": "bus-de-la-marina-baixa-a-laplec-pel-territori",
    "link": "https://socdepoble.net/2014/09/17/bus-de-la-marina-baixa-a-laplec-pel-territori/",
    "title": "Bus de la Marina Baixa a l’Aplec pel Territori",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/bus-de-la-marina-baixa-a-laplec-pel-territori"
  },
  {
    "id": 3187,
    "date": "2014-09-17T23:45:00",
    "slug": "collaboradors-i-patrocinadors-de-laplec-pel-territori",
    "link": "https://socdepoble.net/2014/09/17/collaboradors-i-patrocinadors-de-laplec-pel-territori/",
    "title": "Col·laboradors i Patrocinadors de l’Aplec pel Territori",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/collaboradors-i-patrocinadors-de-laplec-pel-territori"
  },
  {
    "id": 3185,
    "date": "2014-09-17T23:30:00",
    "slug": "activitats-del-diumenge-a-laplec-pel-territori",
    "link": "https://socdepoble.net/2014/09/17/activitats-del-diumenge-a-laplec-pel-territori/",
    "title": "Activitats del diumenge a l’Aplec pel Territori",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/activitats-del-diumenge-a-laplec-pel-territori"
  },
  {
    "id": 3155,
    "date": "2014-09-17T01:44:00",
    "slug": "programacio-dactivitats-de-laplec-pel-territori",
    "link": "https://socdepoble.net/2014/09/17/programacio-dactivitats-de-laplec-pel-territori/",
    "title": "Programació d’Activitats de l’Aplec pel Territori",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "pdf_drive_docs",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/programacio-dactivitats-de-laplec-pel-territori"
  },
  {
    "id": 3369,
    "date": "2014-09-15T13:51:00",
    "slug": "estimem-la-nostra-terra-aplec-pel-territori",
    "link": "https://socdepoble.net/2014/09/15/estimem-la-nostra-terra-aplec-pel-territori/",
    "title": "Estimem la Nostra Terra! Aplec pel Territori",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Aplec pel Territori",
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/estimem-la-nostra-terra-aplec-pel-territori"
  },
  {
    "id": 1496,
    "date": "2014-09-14T13:44:45",
    "slug": "lhome-blanc-planta-molins-el-negoci-brut-de-les-eoliques",
    "link": "https://socdepoble.net/2014/09/14/lhome-blanc-planta-molins-el-negoci-brut-de-les-eoliques/",
    "title": "L’home blanc planta molins. El negoci brut de les eóliques",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Memfotisme",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Memfotisme",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/lhome-blanc-planta-molins-el-negoci-brut-de-les-eoliques"
  },
  {
    "id": 3564,
    "date": "2014-09-13T02:15:00",
    "slug": "el-pa-beneit-a-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2014/09/13/el-pa-beneit-a-la-torre-de-les-macanes/",
    "title": "El Pa Beneït, a La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-pa-beneit-a-la-torre-de-les-macanes"
  },
  {
    "id": 3568,
    "date": "2014-07-02T21:55:00",
    "slug": "escursio-raco-de-sant-bonaventura-canalons",
    "link": "https://socdepoble.net/2014/07/02/escursio-raco-de-sant-bonaventura-canalons/",
    "title": "Escursió Racó de Sant Bonaventura – Canalons",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/escursio-raco-de-sant-bonaventura-canalons"
  },
  {
    "id": 3569,
    "date": "2014-06-27T17:16:00",
    "slug": "definitivament-fulminada-lesperanca-de-lautoconsum-a-espanya",
    "link": "https://socdepoble.net/2014/06/27/definitivament-fulminada-lesperanca-de-lautoconsum-a-espanya/",
    "title": "Definitivament fulminada l’esperança de l’autoconsum a Espanya",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/definitivament-fulminada-lesperanca-de-lautoconsum-a-espanya"
  },
  {
    "id": 119,
    "date": "2014-06-26T18:39:00",
    "slug": "119-2",
    "link": "https://socdepoble.net/2014/06/26/119-2/",
    "title": "2n Aplec de la Mariola",
    "poblesDetectats": [
      "Banyeres de Mariola"
    ],
    "poblePrincipal": "Banyeres de Mariola",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/119-2"
  },
  {
    "id": 3570,
    "date": "2014-06-14T18:32:00",
    "slug": "el-consell-suplanta-els-funcionaris-en-els-controls-dimpacte-ambiental",
    "link": "https://socdepoble.net/2014/06/14/el-consell-suplanta-els-funcionaris-en-els-controls-dimpacte-ambiental/",
    "title": "El Consell suplanta els funcionaris en els controls d’impacte ambiental",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-consell-suplanta-els-funcionaris-en-els-controls-dimpacte-ambiental"
  },
  {
    "id": 3571,
    "date": "2014-05-16T22:11:00",
    "slug": "mou-te-ja-pel-tancament-de-la-central-nuclear-de-cofrents-diumenge-18-maig",
    "link": "https://socdepoble.net/2014/05/16/mou-te-ja-pel-tancament-de-la-central-nuclear-de-cofrents-diumenge-18-maig/",
    "title": "Mou-te ja pel tancament de la central nuclear de Cofrents! Diumenge 18 de maig",
    "poblesDetectats": [
      "Cofrents",
      "Xalans"
    ],
    "poblePrincipal": "Cofrents",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/mou-te-ja-pel-tancament-de-la-central-nuclear-de-cofrents-diumenge-18-maig"
  },
  {
    "id": 3572,
    "date": "2014-05-13T20:19:00",
    "slug": "el-pa-beneit-en-tramits-de-ser-declarat-be-dinteres-cultural-inmaterial",
    "link": "https://socdepoble.net/2014/05/13/el-pa-beneit-en-tramits-de-ser-declarat-be-dinteres-cultural-inmaterial/",
    "title": "El Pa Beneït en tramits de ser declarat Bé d’Interés Cultural Inmaterial",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-pa-beneit-en-tramits-de-ser-declarat-be-dinteres-cultural-inmaterial"
  },
  {
    "id": 3573,
    "date": "2014-05-12T17:06:00",
    "slug": "acte-reivindicatiu-contra-lallotjament-duna-incineradora-a-xixona",
    "link": "https://socdepoble.net/2014/05/12/acte-reivindicatiu-contra-lallotjament-duna-incineradora-a-xixona/",
    "title": "Acte reivindicatiu contra l’allotjament d’una incineradora a Xixona",
    "poblesDetectats": [
      "Xixona"
    ],
    "poblePrincipal": "Xixona",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/acte-reivindicatiu-contra-lallotjament-duna-incineradora-a-xixona"
  },
  {
    "id": 1149,
    "date": "2014-05-12T10:38:22",
    "slug": "aplicacions-de-productivitat",
    "link": "https://socdepoble.net/2014/05/12/aplicacions-de-productivitat/",
    "title": "Aplicacions de Productivitat",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "tecnologia-lliure",
    "categoriaTematicaProposadaLabel": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "etiquetesOriginals": [
      "Noves Tecnologies"
    ],
    "etiquetesNetes": [
      "Noves Tecnologies"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/aplicacions-de-productivitat"
  },
  {
    "id": 3574,
    "date": "2014-05-11T06:00:00",
    "slug": "xi-marxa-per-la-desmilitaritzacio-de-la-serra-daitana",
    "link": "https://socdepoble.net/2014/05/11/xi-marxa-per-la-desmilitaritzacio-de-la-serra-daitana/",
    "title": "XI Marxa per la desmilitarització de la Serra d’Aitana",
    "poblesDetectats": [
      "Alcoleja",
      "L'Alcoià",
      "Penàguila"
    ],
    "poblePrincipal": "Alcoleja",
    "comarquesDetectades": [
      "El Comtat"
    ],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/xi-marxa-per-la-desmilitaritzacio-de-la-serra-daitana"
  },
  {
    "id": 125,
    "date": "2014-05-10T14:58:00",
    "slug": "salvem-les-abelles",
    "link": "https://socdepoble.net/2014/05/10/salvem-les-abelles/",
    "title": "Salvem les abelles",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/salvem-les-abelles"
  },
  {
    "id": 3575,
    "date": "2014-03-31T07:51:00",
    "slug": "daniel-climent-etnobotanic-i-apassionat-per-la-terra",
    "link": "https://socdepoble.net/2014/03/31/daniel-climent-etnobotanic-i-apassionat-per-la-terra/",
    "title": "Daniel Climent, etnobotànic i apassionat per la terra",
    "poblesDetectats": [
      "La Vila Joiosa",
      "Orxeta"
    ],
    "poblePrincipal": "La Vila Joiosa",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/daniel-climent-etnobotanic-i-apassionat-per-la-terra"
  },
  {
    "id": 3576,
    "date": "2014-03-22T20:27:00",
    "slug": "l-escurrupenia",
    "link": "https://socdepoble.net/2014/03/22/l-escurrupenia/",
    "title": "L’Escurrupènia",
    "poblesDetectats": [
      "Cocentaina"
    ],
    "poblePrincipal": "Cocentaina",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/l-escurrupenia"
  },
  {
    "id": 3577,
    "date": "2014-03-15T17:55:00",
    "slug": "excursio-a-l-escurrupenia-el-22-de-marc",
    "link": "https://socdepoble.net/2014/03/15/excursio-a-l-escurrupenia-el-22-de-marc/",
    "title": "Excursió a l’escurrupènia el 22 de març",
    "poblesDetectats": [
      "Cocentaina",
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "Cocentaina",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-a-l-escurrupenia-el-22-de-marc"
  },
  {
    "id": 3578,
    "date": "2014-02-22T01:19:00",
    "slug": "excursio-relleu-la-torre",
    "link": "https://socdepoble.net/2014/02/22/excursio-relleu-la-torre/",
    "title": "Excursió Relleu – La Torre",
    "poblesDetectats": [
      "La Torre de les Maçanes",
      "Relleu"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-relleu-la-torre"
  },
  {
    "id": 3579,
    "date": "2014-02-09T22:18:00",
    "slug": "excursio-relleu-la-torre-per-al-16-de-febrer",
    "link": "https://socdepoble.net/2014/02/09/excursio-relleu-la-torre-per-al-16-de-febrer/",
    "title": "Excursió Relleu – La Torre per al 16 de febrer",
    "poblesDetectats": [
      "La Torre de les Maçanes",
      "Relleu"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Activitats",
      "Excursions"
    ],
    "etiquetesNetes": [
      "Activitats",
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-relleu-la-torre-per-al-16-de-febrer"
  },
  {
    "id": 685,
    "date": "2014-01-01T13:17:51",
    "slug": "llenya-d-aci-presentacio",
    "link": "https://socdepoble.net/2014/01/01/llenya-d-aci-presentacio/",
    "title": "Llenya d’Ací. Presentació",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Projectes"
    ],
    "etiquetesNetes": [
      "Projectes"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/llenya-d-aci-presentacio"
  },
  {
    "id": 1032,
    "date": "2013-12-24T14:55:12",
    "slug": "quin-es-el-futur-dun-poble-sense-escola",
    "link": "https://socdepoble.net/2013/12/24/quin-es-el-futur-dun-poble-sense-escola/",
    "title": "Quin és el futur d’un Poble sense Escola?",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Desenvolupament Sostenible",
      "Opinió"
    ],
    "etiquetesNetes": [
      "Desenvolupament Sostenible",
      "Opinió"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/quin-es-el-futur-dun-poble-sense-escola"
  },
  {
    "id": 972,
    "date": "2013-11-24T18:23:04",
    "slug": "el-rentonar-i-soc-de-poble-a-radio-aktiva-la-vall",
    "link": "https://socdepoble.net/2013/11/24/el-rentonar-i-soc-de-poble-a-radio-aktiva-la-vall/",
    "title": "El Rentonar i Sóc de Poble a Ràdio Aktiva La Vall",
    "poblesDetectats": [
      "Alfafara",
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "Alfafara",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Opinió",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Opinió",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-rentonar-i-soc-de-poble-a-radio-aktiva-la-vall"
  },
  {
    "id": 921,
    "date": "2013-11-03T16:39:26",
    "slug": "viatgers-al-tren",
    "link": "https://socdepoble.net/2013/11/03/viatgers-al-tren/",
    "title": "Viatgers al Tren",
    "poblesDetectats": [
      "Cocentaina"
    ],
    "poblePrincipal": "Cocentaina",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/viatgers-al-tren"
  },
  {
    "id": 918,
    "date": "2013-11-03T13:14:57",
    "slug": "fira-de-tots-sants-2013",
    "link": "https://socdepoble.net/2013/11/03/fira-de-tots-sants-2013/",
    "title": "Fira de Tots Sants 2013",
    "poblesDetectats": [
      "Cocentaina"
    ],
    "poblePrincipal": "Cocentaina",
    "comarquesDetectades": [
      "El Comtat"
    ],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/fira-de-tots-sants-2013"
  },
  {
    "id": 3549,
    "date": "2013-10-25T14:13:00",
    "slug": "les-corts-es-mobilitzen-per-la-serra-dalfaro",
    "link": "https://socdepoble.net/2013/10/25/les-corts-es-mobilitzen-per-la-serra-dalfaro/",
    "title": "Les Corts es mobilitzen per la serra d’Alfaro",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [
      "El Comtat"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/les-corts-es-mobilitzen-per-la-serra-dalfaro"
  },
  {
    "id": 3550,
    "date": "2013-10-25T13:37:00",
    "slug": "el-foc-protagonista-duna-conferencia-a-alfafara",
    "link": "https://socdepoble.net/2013/10/25/el-foc-protagonista-duna-conferencia-a-alfafara/",
    "title": "El foc, protagonista d’una conferència a Alfafara",
    "poblesDetectats": [
      "Alfafara"
    ],
    "poblePrincipal": "Alfafara",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Incendis",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Incendis",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-foc-protagonista-duna-conferencia-a-alfafara"
  },
  {
    "id": 3551,
    "date": "2013-10-12T00:10:00",
    "slug": "9-doctubre-a-la-serra-dels-plans",
    "link": "https://socdepoble.net/2013/10/12/9-doctubre-a-la-serra-dels-plans/",
    "title": "9 d’octubre a la Serra dels Plans",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/9-doctubre-a-la-serra-dels-plans"
  },
  {
    "id": 3552,
    "date": "2013-10-11T22:37:00",
    "slug": "soc-de-poble-i-el-rentonar-a-laplec-de-la-mariola",
    "link": "https://socdepoble.net/2013/10/11/soc-de-poble-i-el-rentonar-a-laplec-de-la-mariola/",
    "title": "Sóc de Poble i El Rentonar a l’Aplec de la Mariola",
    "poblesDetectats": [
      "Alfafara"
    ],
    "poblePrincipal": "Alfafara",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Incendis",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Incendis",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/soc-de-poble-i-el-rentonar-a-laplec-de-la-mariola"
  },
  {
    "id": 829,
    "date": "2013-10-04T03:09:22",
    "slug": "video-de-presentacio-del-projecte-soc-de-poble",
    "link": "https://socdepoble.net/2013/10/04/video-de-presentacio-del-projecte-soc-de-poble/",
    "title": "Vídeo de presentació del Projecte Sóc de Poble",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Desenvolupament Sostenible",
      "Noves Tecnologies",
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Desenvolupament Sostenible",
      "Noves Tecnologies",
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/video-de-presentacio-del-projecte-soc-de-poble"
  },
  {
    "id": 137,
    "date": "2013-10-01T20:01:00",
    "slug": "excursio-del-9-doctubre",
    "link": "https://socdepoble.net/2013/10/01/excursio-del-9-doctubre/",
    "title": "Excursió del 9 d’octubre",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Excursions",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Excursions",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-del-9-doctubre"
  },
  {
    "id": 862,
    "date": "2013-09-29T11:19:35",
    "slug": "estiu-al-planet",
    "link": "https://socdepoble.net/2013/09/29/estiu-al-planet/",
    "title": "Estiu al Planet",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació",
      "Fotos"
    ],
    "etiquetesNetes": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació",
      "Fotos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/estiu-al-planet"
  },
  {
    "id": 3553,
    "date": "2013-09-27T21:21:00",
    "slug": "i-aplec-de-la-mariola",
    "link": "https://socdepoble.net/2013/09/27/i-aplec-de-la-mariola/",
    "title": "I Aplec de la Mariola",
    "poblesDetectats": [
      "Alfafara",
      "L'Alcoià",
      "La Vall d'Albaida"
    ],
    "poblePrincipal": "Alfafara",
    "comarquesDetectades": [
      "El Comtat"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/i-aplec-de-la-mariola"
  },
  {
    "id": 128,
    "date": "2013-09-18T14:55:11",
    "slug": "tim-berners-lee-lany-en-que-les-dades-de-lliure-acces-es-van-globalitzar",
    "link": "https://socdepoble.net/2013/09/18/tim-berners-lee-lany-en-que-les-dades-de-lliure-acces-es-van-globalitzar/",
    "title": "Tim Berners-Lee: L’any en què les dades de lliure accés es van globalitzar",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "tecnologia-lliure",
    "categoriaTematicaProposadaLabel": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "etiquetesOriginals": [
      "Noves Tecnologies",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Noves Tecnologies",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/tim-berners-lee-lany-en-que-les-dades-de-lliure-acces-es-van-globalitzar"
  },
  {
    "id": 595,
    "date": "2013-09-17T12:57:52",
    "slug": "stop-rodant-el-canvi",
    "link": "https://socdepoble.net/2013/09/17/stop-rodant-el-canvi/",
    "title": "Stop! Rodant el canvi",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/stop-rodant-el-canvi"
  },
  {
    "id": 3554,
    "date": "2013-09-03T20:44:00",
    "slug": "radar-no-la-veu-dun-poble",
    "link": "https://socdepoble.net/2013/09/03/radar-no-la-veu-dun-poble/",
    "title": "Radar No!!!  La veu d’un poble",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/radar-no-la-veu-dun-poble"
  },
  {
    "id": 140,
    "date": "2013-09-01T14:19:00",
    "slug": "el-cim-de-la-serra-dels-plans-torna-a-formar-part-de-la-xarxa-muntanyes-netes",
    "link": "https://socdepoble.net/2013/09/01/el-cim-de-la-serra-dels-plans-torna-a-formar-part-de-la-xarxa-muntanyes-netes/",
    "title": "El cim de la serra dels Plans torna a formar part de la xarxa «Muntanyes Netes»",
    "poblesDetectats": [
      "Alcoi",
      "Benifallim",
      "La Torre de les Maçanes",
      "Xixona"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cim-de-la-serra-dels-plans-torna-a-formar-part-de-la-xarxa-muntanyes-netes"
  },
  {
    "id": 3555,
    "date": "2013-08-31T23:11:00",
    "slug": "homenatge-de-lajuntament-de-la-torre-a-les-victimes-de-lincendi-dagost-de-2012",
    "link": "https://socdepoble.net/2013/08/31/homenatge-de-lajuntament-de-la-torre-a-les-victimes-de-lincendi-dagost-de-2012/",
    "title": "Homenatge de l’Ajuntament de La Torre a les víctimes de l’incendi d’agost de 2012",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Incendis",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Incendis",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/homenatge-de-lajuntament-de-la-torre-a-les-victimes-de-lincendi-dagost-de-2012"
  },
  {
    "id": 759,
    "date": "2013-08-27T14:32:20",
    "slug": "aigua-es-vida-el-paisatge-retencio-daigua-de-tamera",
    "link": "https://socdepoble.net/2013/08/27/aigua-es-vida-el-paisatge-retencio-daigua-de-tamera/",
    "title": "Aigua és Vida – El Paisatge Retenció d’Aigua de Tamera",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/aigua-es-vida-el-paisatge-retencio-daigua-de-tamera"
  },
  {
    "id": 765,
    "date": "2013-08-25T14:55:37",
    "slug": "la-veu-del-vent-llavors-de-transicio",
    "link": "https://socdepoble.net/2013/08/25/la-veu-del-vent-llavors-de-transicio/",
    "title": "La veu del Vent. Llavors de transició",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-veu-del-vent-llavors-de-transicio"
  },
  {
    "id": 772,
    "date": "2013-08-24T19:52:43",
    "slug": "lakabe-poble-autosuficient",
    "link": "https://socdepoble.net/2013/08/24/lakabe-poble-autosuficient/",
    "title": "Lakabe, poble autosuficient",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/lakabe-poble-autosuficient"
  },
  {
    "id": 770,
    "date": "2013-08-23T19:11:24",
    "slug": "sepp-holzer-el-rebel-agrari",
    "link": "https://socdepoble.net/2013/08/23/sepp-holzer-el-rebel-agrari/",
    "title": "Sepp Holzer: El rebel agrari",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/sepp-holzer-el-rebel-agrari"
  },
  {
    "id": 775,
    "date": "2013-08-22T20:50:13",
    "slug": "institut-permacultura-montsant",
    "link": "https://socdepoble.net/2013/08/22/institut-permacultura-montsant/",
    "title": "Institut Permacultura Montsant",
    "poblesDetectats": [
      "Cornudella de Montsant"
    ],
    "poblePrincipal": "Cornudella de Montsant",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/institut-permacultura-montsant"
  },
  {
    "id": 3556,
    "date": "2013-08-12T09:49:00",
    "slug": "la-placa-plena",
    "link": "https://socdepoble.net/2013/08/12/la-placa-plena/",
    "title": "La Plaça plena",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Incendis",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Incendis",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-placa-plena"
  },
  {
    "id": 3557,
    "date": "2013-08-11T14:50:00",
    "slug": "la-tragedia-sigue-sin-aclararse-un-ano-despues",
    "link": "https://socdepoble.net/2013/08/11/la-tragedia-sigue-sin-aclararse-un-ano-despues/",
    "title": "La tragedia sigue sin aclararse un año después",
    "poblesDetectats": [
      "Benifallim",
      "La Torre de les Maçanes",
      "Penàguila"
    ],
    "poblePrincipal": "Benifallim",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Incendis",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Incendis",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-tragedia-sigue-sin-aclararse-un-ano-despues"
  },
  {
    "id": 144,
    "date": "2013-08-05T22:24:00",
    "slug": "actes-per-a-fer-memoria-de-lincendi-de-12-dagost-de-2012",
    "link": "https://socdepoble.net/2013/08/05/actes-per-a-fer-memoria-de-lincendi-de-12-dagost-de-2012/",
    "title": "Actes per a fer memòria de l’incendi de 12 d’agost de 2012",
    "poblesDetectats": [
      "Benifallim",
      "La Torre de les Maçanes",
      "Penàguila"
    ],
    "poblePrincipal": "Benifallim",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Incendis",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Incendis",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/actes-per-a-fer-memoria-de-lincendi-de-12-dagost-de-2012"
  },
  {
    "id": 145,
    "date": "2013-08-04T20:50:00",
    "slug": "brull-viu-2013",
    "link": "https://socdepoble.net/2013/08/04/brull-viu-2013/",
    "title": "Brull Viu! 2013",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Brull Viu"
    ],
    "etiquetesNetes": [
      "Brull Viu"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/brull-viu-2013"
  },
  {
    "id": 761,
    "date": "2013-08-02T14:41:43",
    "slug": "lestiu-mes-negre",
    "link": "https://socdepoble.net/2013/08/02/lestiu-mes-negre/",
    "title": "L’estiu Més Negre",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Memfotisme",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Memfotisme",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/lestiu-mes-negre"
  },
  {
    "id": 763,
    "date": "2013-07-14T14:43:53",
    "slug": "fotos-del-taller-de-panells-de-quincha",
    "link": "https://socdepoble.net/2013/07/14/fotos-del-taller-de-panells-de-quincha/",
    "title": "Fotos del Taller de Panells de Quincha",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació",
      "Fotos"
    ],
    "etiquetesNetes": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació",
      "Fotos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/fotos-del-taller-de-panells-de-quincha"
  },
  {
    "id": 3558,
    "date": "2013-07-13T12:07:00",
    "slug": "man-o-algunes-coses-que-fan-alguns-humans",
    "link": "https://socdepoble.net/2013/07/13/man-o-algunes-coses-que-fan-alguns-humans/",
    "title": "MAN… o algunes coses que fan alguns humans…",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Reivindicant",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Reivindicant",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/man-o-algunes-coses-que-fan-alguns-humans"
  },
  {
    "id": 3559,
    "date": "2013-06-08T21:46:00",
    "slug": "el-tsj-valencia-falla-en-contra-de-la-proteccio-de-zones-zepa-per-a-la-instal-lacio-de-parcs-eolics",
    "link": "https://socdepoble.net/2013/06/08/el-tsj-valencia-falla-en-contra-de-la-proteccio-de-zones-zepa-per-a-la-instal-lacio-de-parcs-eolics/",
    "title": "El TSJ valencià falla en contra de la protecció de zones ZEPA per a la instal·lació de parcs eòlics",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [
      "El Comtat"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Pla Eòlic",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Pla Eòlic",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-tsj-valencia-falla-en-contra-de-la-proteccio-de-zones-zepa-per-a-la-instal-lacio-de-parcs-eolics"
  },
  {
    "id": 589,
    "date": "2013-05-20T10:16:38",
    "slug": "jornada-constructiva-de-panells-de-quincha",
    "link": "https://socdepoble.net/2013/05/20/jornada-constructiva-de-panells-de-quincha/",
    "title": "Jornada Constructiva de Panells de Quincha",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació"
    ],
    "etiquetesNetes": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/jornada-constructiva-de-panells-de-quincha"
  },
  {
    "id": 788,
    "date": "2013-05-17T12:12:57",
    "slug": "taller-de-construccio-de-pergola-organica-2",
    "link": "https://socdepoble.net/2013/05/17/taller-de-construccio-de-pergola-organica-2/",
    "title": "Taller de Construcció de Pèrgola Orgànica – 2",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació",
      "Fotos"
    ],
    "etiquetesNetes": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació",
      "Fotos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/taller-de-construccio-de-pergola-organica-2"
  },
  {
    "id": 790,
    "date": "2013-05-01T12:22:59",
    "slug": "fotos-del-taller-de-bany-sec",
    "link": "https://socdepoble.net/2013/05/01/fotos-del-taller-de-bany-sec/",
    "title": "Fotos del Taller de Bany Sec",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació",
      "Fotos"
    ],
    "etiquetesNetes": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació",
      "Fotos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/fotos-del-taller-de-bany-sec"
  },
  {
    "id": 3560,
    "date": "2013-04-22T18:48:00",
    "slug": "tanquem-cofrents-i-totes-les-nuclears",
    "link": "https://socdepoble.net/2013/04/22/tanquem-cofrents-i-totes-les-nuclears/",
    "title": "Tanquem Cofrents i totes les nuclears!",
    "poblesDetectats": [
      "Cofrents"
    ],
    "poblePrincipal": "Cofrents",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/tanquem-cofrents-i-totes-les-nuclears"
  },
  {
    "id": 423,
    "date": "2013-04-16T13:02:51",
    "slug": "taller-de-construccio-de-bany-sec-de-compost",
    "link": "https://socdepoble.net/2013/04/16/taller-de-construccio-de-bany-sec-de-compost/",
    "title": "Taller de construcció de bany sec de compost",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació",
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació",
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/taller-de-construccio-de-bany-sec-de-compost"
  },
  {
    "id": 792,
    "date": "2013-04-07T12:27:33",
    "slug": "fotos-del-taller-de-construccio-de-pergola-organica",
    "link": "https://socdepoble.net/2013/04/07/fotos-del-taller-de-construccio-de-pergola-organica/",
    "title": "Fotos del Taller de Pèrgola Orgànica",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació",
      "Fotos"
    ],
    "etiquetesNetes": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació",
      "Fotos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/fotos-del-taller-de-construccio-de-pergola-organica"
  },
  {
    "id": 444,
    "date": "2013-04-04T12:57:12",
    "slug": "trobades-al-voltant-duna-solera-en-el-mas-del-planet",
    "link": "https://socdepoble.net/2013/04/04/trobades-al-voltant-duna-solera-en-el-mas-del-planet/",
    "title": "Trobades al voltant d’una solera en el Mas del Planet",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació",
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació",
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/trobades-al-voltant-duna-solera-en-el-mas-del-planet"
  },
  {
    "id": 427,
    "date": "2013-03-27T13:15:10",
    "slug": "taller-de-construccio-de-pergola-organica",
    "link": "https://socdepoble.net/2013/03/27/taller-de-construccio-de-pergola-organica/",
    "title": "Taller de Construcció de Pèrgola Orgànica",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació"
    ],
    "etiquetesNetes": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/taller-de-construccio-de-pergola-organica"
  },
  {
    "id": 3561,
    "date": "2013-03-19T15:09:00",
    "slug": "conferencia-sobre-el-foc-a-enguera",
    "link": "https://socdepoble.net/2013/03/19/conferencia-sobre-el-foc-a-enguera/",
    "title": "Conferència sobre el foc a Énguera",
    "poblesDetectats": [
      "Énguera",
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "Énguera",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Incendis",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Incendis",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/conferencia-sobre-el-foc-a-enguera"
  },
  {
    "id": 795,
    "date": "2013-03-06T12:34:41",
    "slug": "fotos-del-taller-de-solera-aillant",
    "link": "https://socdepoble.net/2013/03/06/fotos-del-taller-de-solera-aillant/",
    "title": "Fotos del Taller de Solera Aïllant",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació",
      "Fotos"
    ],
    "etiquetesNetes": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació",
      "Fotos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/fotos-del-taller-de-solera-aillant"
  },
  {
    "id": 376,
    "date": "2013-03-06T12:00:58",
    "slug": "taller-de-construccio-de-solera-aillant",
    "link": "https://socdepoble.net/2013/03/06/taller-de-construccio-de-solera-aillant/",
    "title": "Taller de construcció de Solera Aïllant",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació",
      "Esdeveniments"
    ],
    "etiquetesNetes": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació",
      "Esdeveniments"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/taller-de-construccio-de-solera-aillant"
  },
  {
    "id": 848,
    "date": "2013-03-05T22:26:48",
    "slug": "el-mas-del-planet-es-posa-en-marxa-amb-la-primera-jornada-constructiva-del-sistema-dinamo",
    "link": "https://socdepoble.net/2013/03/05/el-mas-del-planet-es-posa-en-marxa-amb-la-primera-jornada-constructiva-del-sistema-dinamo/",
    "title": "El Mas del Planet es posa en marxa amb la primera Jornada Constructiva del Sistema Dinamo",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació"
    ],
    "etiquetesNetes": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-mas-del-planet-es-posa-en-marxa-amb-la-primera-jornada-constructiva-del-sistema-dinamo"
  },
  {
    "id": 604,
    "date": "2013-02-04T13:35:58",
    "slug": "el-planet-qui-som",
    "link": "https://socdepoble.net/2013/02/04/el-planet-qui-som/",
    "title": "El Planet. Qui som",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació"
    ],
    "etiquetesNetes": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-planet-qui-som"
  },
  {
    "id": 609,
    "date": "2013-02-03T13:51:09",
    "slug": "experiencies",
    "link": "https://socdepoble.net/2013/02/03/experiencies/",
    "title": "Experiències",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació"
    ],
    "etiquetesNetes": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/experiencies"
  },
  {
    "id": 375,
    "date": "2013-02-02T21:42:23",
    "slug": "comencem-el-projecte",
    "link": "https://socdepoble.net/2013/02/02/comencem-el-projecte/",
    "title": "El Planet. Comencem el Projecte",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació"
    ],
    "etiquetesNetes": [
      "Bioconstrucció",
      "El Planet Centre Rural d'Experimentació"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/comencem-el-projecte"
  },
  {
    "id": 3562,
    "date": "2013-01-20T04:27:00",
    "slug": "excursio-a-les-penyes-de-roset-xixona",
    "link": "https://socdepoble.net/2013/01/20/excursio-a-les-penyes-de-roset-xixona/",
    "title": "Excursió a les Penyes de Roset (Xixona)",
    "poblesDetectats": [
      "La Torre de les Maçanes",
      "Xixona"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-a-les-penyes-de-roset-xixona"
  },
  {
    "id": 3563,
    "date": "2012-12-01T01:24:00",
    "slug": "els-propietaris-no-pagaran-per-lextincio-dels-incendis-forestals",
    "link": "https://socdepoble.net/2012/12/01/els-propietaris-no-pagaran-per-lextincio-dels-incendis-forestals/",
    "title": "Els propietaris no pagaran per l’extinció dels incendis forestals",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Incendis",
      "Reivindicant",
      "Rentonar Informa"
    ],
    "etiquetesNetes": [
      "Incendis",
      "Reivindicant",
      "Rentonar Informa"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/els-propietaris-no-pagaran-per-lextincio-dels-incendis-forestals"
  },
  {
    "id": 3528,
    "date": "2012-10-10T21:18:00",
    "slug": "el-foc-una-catastrofe-natural-2",
    "link": "https://socdepoble.net/2012/10/10/el-foc-una-catastrofe-natural-2/",
    "title": "El foc, una catàstrofe natural",
    "poblesDetectats": [
      "Benifallim",
      "La Torre de les Maçanes",
      "Penàguila"
    ],
    "poblePrincipal": "Benifallim",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Activitats",
      "Arbres",
      "Excursions",
      "Incendis",
      "Reivindicant",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Activitats",
      "Arbres Monumentals",
      "Excursions",
      "Incendis",
      "Reivindicant",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-foc-una-catastrofe-natural-2"
  },
  {
    "id": 3529,
    "date": "2012-10-08T23:07:00",
    "slug": "9-doctubre-el-nostre-entorn-es-el-nostre-futur",
    "link": "https://socdepoble.net/2012/10/08/9-doctubre-el-nostre-entorn-es-el-nostre-futur/",
    "title": "9 d’octubre. El nostre entorn és el Nostre futur",
    "poblesDetectats": [
      "Benifallim",
      "La Torre de les Maçanes",
      "Penàguila"
    ],
    "poblePrincipal": "Benifallim",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Excursions",
      "Incendis",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Incendis",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/9-doctubre-el-nostre-entorn-es-el-nostre-futur"
  },
  {
    "id": 3530,
    "date": "2012-09-26T20:59:00",
    "slug": "has-estat-a-carricola-ii-aplec-ecologista-2012",
    "link": "https://socdepoble.net/2012/09/26/has-estat-a-carricola-ii-aplec-ecologista-2012/",
    "title": "Has estat a Carrícola? II Aplec Ecologista 2012",
    "poblesDetectats": [
      "Carrícola"
    ],
    "poblePrincipal": "Carrícola",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/events/has-estat-a-carricola-ii-aplec-ecologista-2012"
  },
  {
    "id": 14496,
    "date": "2012-09-24T00:56:00",
    "slug": "la-torre-jazz-2012",
    "link": "https://socdepoble.net/2012/09/24/la-torre-jazz-2012/",
    "title": "La Torre Jazz 2012",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "patrimoni-cultura",
    "categoriaTematicaProposadaLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "etiquetesOriginals": [
      "El Carreró Centre Cultural i Tecnològic",
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "etiquetesNetes": [
      "El Carreró Centre Cultural i Tecnològic",
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-torre-jazz-2012"
  },
  {
    "id": 3531,
    "date": "2012-09-20T22:40:00",
    "slug": "assemblea-publica-conferencia-dissabte-6-doctubre",
    "link": "https://socdepoble.net/2012/09/20/assemblea-publica-conferencia-dissabte-6-doctubre/",
    "title": "Assemblea Pública – Conferència. Dissabte, 6 d’octubre",
    "poblesDetectats": [
      "Benifallim",
      "La Torre de les Maçanes",
      "Penàguila"
    ],
    "poblePrincipal": "Benifallim",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Incendis",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Incendis",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/assemblea-publica-conferencia-dissabte-6-doctubre"
  },
  {
    "id": 3532,
    "date": "2012-09-18T19:44:00",
    "slug": "excursio-7-d-octubre-la-torre-benifallim-penaguila",
    "link": "https://socdepoble.net/2012/09/18/excursio-7-d-octubre-la-torre-benifallim-penaguila/",
    "title": "Excursió 7 d’octubre. La Torre – Benifallim – Penàguila",
    "poblesDetectats": [
      "Benifallim",
      "La Torre de les Maçanes",
      "Penàguila"
    ],
    "poblePrincipal": "Benifallim",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Excursions",
      "Incendis",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Incendis",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-7-d-octubre-la-torre-benifallim-penaguila"
  },
  {
    "id": 3533,
    "date": "2012-09-13T02:00:00",
    "slug": "ii-aplec-ecologista-a-carricola-2012",
    "link": "https://socdepoble.net/2012/09/13/ii-aplec-ecologista-a-carricola-2012/",
    "title": "II Aplec ecologista a Carrícola 2012",
    "poblesDetectats": [
      "Carrícola"
    ],
    "poblePrincipal": "Carrícola",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/ii-aplec-ecologista-a-carricola-2012"
  },
  {
    "id": 3534,
    "date": "2012-09-03T01:19:00",
    "slug": "un-parc-eolic-amenaca-les-aus-de-monfrague-campanya-de-signatures",
    "link": "https://socdepoble.net/2012/09/03/un-parc-eolic-amenaca-les-aus-de-monfrague-campanya-de-signatures/",
    "title": "Un parc eòlic amenaça les aus de Monfragüe. Campanya de signatures",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Pla Eòlic",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Pla Eòlic",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/un-parc-eolic-amenaca-les-aus-de-monfrague-campanya-de-signatures"
  },
  {
    "id": 3535,
    "date": "2012-09-01T16:44:00",
    "slug": "assemblea-per-la-defensa-del-territori",
    "link": "https://socdepoble.net/2012/09/01/assemblea-per-la-defensa-del-territori/",
    "title": "Assemblea per la defensa del territori",
    "poblesDetectats": [
      "Muro d'Alcoi"
    ],
    "poblePrincipal": "Muro d'Alcoi",
    "comarquesDetectades": [
      "El Comtat"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Coordinadora d'Estudis Eòlics del Comtat"
    ],
    "etiquetesNetes": [
      "Coordinadora d'Estudis Eòlics del Comtat"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/assemblea-per-la-defensa-del-territori"
  },
  {
    "id": 3536,
    "date": "2012-08-30T19:49:00",
    "slug": "que-vinga-la-llum",
    "link": "https://socdepoble.net/2012/08/30/que-vinga-la-llum/",
    "title": "Que vinga la llum…!",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/que-vinga-la-llum"
  },
  {
    "id": 3537,
    "date": "2012-08-19T20:22:00",
    "slug": "plany-i-consciencia",
    "link": "https://socdepoble.net/2012/08/19/plany-i-consciencia/",
    "title": "Plany i consciència",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Incendis",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Incendis",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/plany-i-consciencia"
  },
  {
    "id": 2121,
    "date": "2012-08-14T00:16:37",
    "slug": "incendis-cronica-duna-mort-anunciada",
    "link": "https://socdepoble.net/2012/08/14/incendis-cronica-duna-mort-anunciada/",
    "title": "Incendis. Crònica d’una mort anunciada",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Incendis",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Incendis",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/incendis-cronica-duna-mort-anunciada"
  },
  {
    "id": 2120,
    "date": "2012-08-09T14:02:09",
    "slug": "jazz-polop-2012",
    "link": "https://socdepoble.net/2012/08/09/jazz-polop-2012/",
    "title": "Jazz Polop 2012",
    "poblesDetectats": [
      "Polop"
    ],
    "poblePrincipal": "Polop",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "patrimoni-cultura",
    "categoriaTematicaProposadaLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/jazz-polop-2012"
  },
  {
    "id": 3539,
    "date": "2012-08-06T12:04:00",
    "slug": "brull-viu-2012",
    "link": "https://socdepoble.net/2012/08/06/brull-viu-2012/",
    "title": "Brull Viu! 2012",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/brull-viu-2012"
  },
  {
    "id": 1650,
    "date": "2012-07-29T21:36:55",
    "slug": "visitant-als-amics-de-penaguila",
    "link": "https://socdepoble.net/2012/07/29/visitant-als-amics-de-penaguila/",
    "title": "Visitant als amics de Penàguila",
    "poblesDetectats": [
      "Penàguila"
    ],
    "poblePrincipal": "Penàguila",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "patrimoni-cultura",
    "categoriaTematicaProposadaLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "etiquetesOriginals": [
      "Gent que Fa Música",
      "Projecte Sóc de Poble"
    ],
    "etiquetesNetes": [
      "Gent que Fa Música",
      "Projecte Sóc de Poble"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/visitant-als-amics-de-penaguila"
  },
  {
    "id": 3540,
    "date": "2012-07-16T14:01:00",
    "slug": "iniciacio-a-lescalada-a-la-torre",
    "link": "https://socdepoble.net/2012/07/16/iniciacio-a-lescalada-a-la-torre/",
    "title": "Iniciació a l’escalada a La Torre",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Esports",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Esports",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/iniciacio-a-lescalada-a-la-torre"
  },
  {
    "id": 3541,
    "date": "2012-07-06T13:56:00",
    "slug": "el-pol-nord-un-lloc-que-ens-pertany-a-tots",
    "link": "https://socdepoble.net/2012/07/06/el-pol-nord-un-lloc-que-ens-pertany-a-tots/",
    "title": "El Pol Nord, un lloc que ens pertany a tots",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-pol-nord-un-lloc-que-ens-pertany-a-tots"
  },
  {
    "id": 3542,
    "date": "2012-06-24T02:12:00",
    "slug": "el-niu-de-laguila",
    "link": "https://socdepoble.net/2012/06/24/el-niu-de-laguila/",
    "title": "El niu de l’àguila",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-niu-de-laguila"
  },
  {
    "id": 1606,
    "date": "2012-06-07T20:04:09",
    "slug": "a-pagar-incendis",
    "link": "https://socdepoble.net/2012/06/07/a-pagar-incendis/",
    "title": "A Pagar Incendis",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Incendis",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Incendis",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/a-pagar-incendis"
  },
  {
    "id": 3544,
    "date": "2012-05-24T01:49:00",
    "slug": "excursio-a-la-serra-de-bernia",
    "link": "https://socdepoble.net/2012/05/24/excursio-a-la-serra-de-bernia/",
    "title": "Excursió a la Serra de Bèrnia",
    "poblesDetectats": [
      "Xaló"
    ],
    "poblePrincipal": "Xaló",
    "comarquesDetectades": [
      "La Marina Alta",
      "La Marina Baixa"
    ],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-a-la-serra-de-bernia"
  },
  {
    "id": 3545,
    "date": "2012-05-20T15:05:00",
    "slug": "fotos-excursio-al-montgo",
    "link": "https://socdepoble.net/2012/05/20/fotos-excursio-al-montgo/",
    "title": "Fotos de l’excursió al Montgó, 19 de maig de 2012",
    "poblesDetectats": [
      "Dénia",
      "Xabia"
    ],
    "poblePrincipal": "Dénia",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/fotos-excursio-al-montgo"
  },
  {
    "id": 1573,
    "date": "2012-05-01T18:47:31",
    "slug": "festes-de-sant-gregori-2012",
    "link": "https://socdepoble.net/2012/05/01/festes-de-sant-gregori-2012/",
    "title": "Festes de Sant Gregori 2012. La Torre de les Maçanes",
    "poblesDetectats": [
      "L'Alacantí",
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "L'Alacantí",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/festes-de-sant-gregori-2012"
  },
  {
    "id": 3546,
    "date": "2012-04-28T02:30:00",
    "slug": "excursio-a-la-serra-del-montgo-aplacem-lexcursio-al-dissabte-19-de-maig",
    "link": "https://socdepoble.net/2012/04/28/excursio-a-la-serra-del-montgo-aplacem-lexcursio-al-dissabte-19-de-maig/",
    "title": "Excursió a la Serra del Montgó. Aplacem  l’excursió al dissabte 19 de maig",
    "poblesDetectats": [
      "Dénia",
      "Xabia"
    ],
    "poblePrincipal": "Dénia",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-a-la-serra-del-montgo-aplacem-lexcursio-al-dissabte-19-de-maig"
  },
  {
    "id": 2119,
    "date": "2012-04-27T16:14:46",
    "slug": "paraules-de-festa",
    "link": "https://socdepoble.net/2012/04/27/paraules-de-festa/",
    "title": "Paraules de Festa",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "patrimoni-cultura",
    "categoriaTematicaProposadaLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "etiquetesOriginals": [
      "Festes dels Pobles",
      "Gent de La Torre",
      "Sant Gregori"
    ],
    "etiquetesNetes": [
      "Festes dels Pobles",
      "Gent de La Torre",
      "Sant Gregori"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/paraules-de-festa"
  },
  {
    "id": 3547,
    "date": "2012-04-08T23:30:00",
    "slug": "fotos-de-lexcursio-al-poblat-iber-de-la-serreta",
    "link": "https://socdepoble.net/2012/04/08/fotos-de-lexcursio-al-poblat-iber-de-la-serreta/",
    "title": "Fotos de l’excursió al poblat iber de La Serreta",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Propostes"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Propostes"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/fotos-de-lexcursio-al-poblat-iber-de-la-serreta"
  },
  {
    "id": 3514,
    "date": "2012-03-30T15:15:00",
    "slug": "excursio-al-poblat-iber-de-la-serreta",
    "link": "https://socdepoble.net/2012/03/30/excursio-al-poblat-iber-de-la-serreta/",
    "title": "Excursió al poblat iber de La Serreta",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-al-poblat-iber-de-la-serreta"
  },
  {
    "id": 1522,
    "date": "2011-10-14T07:14:39",
    "slug": "informe-sobre-letimologia-del-toponim-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2011/10/14/informe-sobre-letimologia-del-toponim-de-la-torre-de-les-macanes/",
    "title": "Informe sobre l’etimologia del topònim de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "pdf_drive_docs",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/informe-sobre-letimologia-del-toponim-de-la-torre-de-les-macanes"
  },
  {
    "id": 3515,
    "date": "2011-10-11T20:32:00",
    "slug": "9-doctubre-reivindicant-cultura-entorn-i-patrimoni",
    "link": "https://socdepoble.net/2011/10/11/9-doctubre-reivindicant-cultura-entorn-i-patrimoni/",
    "title": "9 d’octubre. Reivindicant cultura, entorn i patrimoni",
    "poblesDetectats": [
      "La Torre de les Maçanes",
      "Xixona"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Activitats",
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Activitats",
      "Excursions",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/9-doctubre-reivindicant-cultura-entorn-i-patrimoni"
  },
  {
    "id": 1486,
    "date": "2011-09-04T20:04:06",
    "slug": "9-doctubre-excursio-la-torre-xixona",
    "link": "https://socdepoble.net/2011/09/04/9-doctubre-excursio-la-torre-xixona/",
    "title": "9 d’octubre. Excursió La Torre – Xixona",
    "poblesDetectats": [
      "La Torre de les Maçanes",
      "Xixona"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/9-doctubre-excursio-la-torre-xixona"
  },
  {
    "id": 3517,
    "date": "2011-08-18T20:37:00",
    "slug": "coordinadora-contra-eolics-en-pobles-xicotets",
    "link": "https://socdepoble.net/2011/08/18/coordinadora-contra-eolics-en-pobles-xicotets/",
    "title": "La coordinadora contra los parques eólicos capta adhesiones en los pueblos pequeños",
    "poblesDetectats": [
      "Gorga"
    ],
    "poblePrincipal": "Gorga",
    "comarquesDetectades": [
      "El Comtat"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Pla Eòlic"
    ],
    "etiquetesNetes": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Pla Eòlic"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/coordinadora-contra-eolics-en-pobles-xicotets"
  },
  {
    "id": 3518,
    "date": "2011-08-12T16:25:00",
    "slug": "intrigues-politiques-aparten-a-tecnics-per-collocar-a-politics-sense-formacio-ambiental",
    "link": "https://socdepoble.net/2011/08/12/intrigues-politiques-aparten-a-tecnics-per-collocar-a-politics-sense-formacio-ambiental/",
    "title": "Intrigues polítiques aparten a tècnics, per col·locar a polítics sense formació ambiental",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/intrigues-politiques-aparten-a-tecnics-per-collocar-a-politics-sense-formacio-ambiental"
  },
  {
    "id": 3519,
    "date": "2011-08-08T19:39:00",
    "slug": "el-ayuntamiento-tramita-un-plan-en-la-sierra-de-bernia-anulado-por-el-tsj",
    "link": "https://socdepoble.net/2011/08/08/el-ayuntamiento-tramita-un-plan-en-la-sierra-de-bernia-anulado-por-el-tsj/",
    "title": "El Ayuntamiento tramita un plan en la Sierra de Bèrnia anulado por el TSJ",
    "poblesDetectats": [
      "Callosa d'en Sarrià"
    ],
    "poblePrincipal": "Callosa d'en Sarrià",
    "comarquesDetectades": [
      "La Marina Alta",
      "La Marina Baixa"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-ayuntamiento-tramita-un-plan-en-la-sierra-de-bernia-anulado-por-el-tsj"
  },
  {
    "id": 1459,
    "date": "2011-08-07T23:53:28",
    "slug": "samarretes-sant-gregori-2012",
    "link": "https://socdepoble.net/2011/08/07/samarretes-sant-gregori-2012/",
    "title": "Samarretes Sant Gregori 2012",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/samarretes-sant-gregori-2012"
  },
  {
    "id": 3520,
    "date": "2011-07-19T14:05:00",
    "slug": "marxa-en-defensa-del-cabeco-dor",
    "link": "https://socdepoble.net/2011/07/19/marxa-en-defensa-del-cabeco-dor/",
    "title": "Marxa en defensa del Cabeçó d’Or",
    "poblesDetectats": [
      "Busot"
    ],
    "poblePrincipal": "Busot",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/marxa-en-defensa-del-cabeco-dor"
  },
  {
    "id": 3521,
    "date": "2011-07-03T17:52:00",
    "slug": "hotel-fora-del-parc-natural-la-font-roja-tambe-es-nostra",
    "link": "https://socdepoble.net/2011/07/03/hotel-fora-del-parc-natural-la-font-roja-tambe-es-nostra/",
    "title": "Hotel fora del Parc Natural. La Font Roja també és nostra!",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/hotel-fora-del-parc-natural-la-font-roja-tambe-es-nostra"
  },
  {
    "id": 1443,
    "date": "2011-07-01T15:21:59",
    "slug": "jazz-polop-2011",
    "link": "https://socdepoble.net/2011/07/01/jazz-polop-2011/",
    "title": "Jazz Polop 2011",
    "poblesDetectats": [
      "Polop"
    ],
    "poblePrincipal": "Polop",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "patrimoni-cultura",
    "categoriaTematicaProposadaLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/jazz-polop-2011"
  },
  {
    "id": 3522,
    "date": "2011-06-25T02:46:00",
    "slug": "dissabte-2-de-juliol-a-ontinyent-manifestacio-contra-la-linia-dalta-tensio",
    "link": "https://socdepoble.net/2011/06/25/dissabte-2-de-juliol-a-ontinyent-manifestacio-contra-la-linia-dalta-tensio/",
    "title": "Dissabte 2 de juliol, a Ontinyent: manifestació contra la línia d’alta tensió",
    "poblesDetectats": [
      "Ontinyent"
    ],
    "poblePrincipal": "Ontinyent",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "pdf_drive_docs",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/dissabte-2-de-juliol-a-ontinyent-manifestacio-contra-la-linia-dalta-tensio"
  },
  {
    "id": 3523,
    "date": "2011-04-24T07:22:00",
    "slug": "pararge-natural-de-la-murta-i-la-casella",
    "link": "https://socdepoble.net/2011/04/24/pararge-natural-de-la-murta-i-la-casella/",
    "title": "Paratge Natural Municipal de la Murta i la Casella",
    "poblesDetectats": [
      "Alcira"
    ],
    "poblePrincipal": "Alcira",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/pararge-natural-de-la-murta-i-la-casella"
  },
  {
    "id": 3524,
    "date": "2011-04-16T14:10:00",
    "slug": "montgo-parc-natural",
    "link": "https://socdepoble.net/2011/04/16/montgo-parc-natural/",
    "title": "Montgó, Parc Natural",
    "poblesDetectats": [
      "Dénia",
      "Gata de Gorgos",
      "Xabia"
    ],
    "poblePrincipal": "Dénia",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/montgo-parc-natural"
  },
  {
    "id": 3525,
    "date": "2011-04-01T20:57:00",
    "slug": "els-agravis-comparatius",
    "link": "https://socdepoble.net/2011/04/01/els-agravis-comparatius/",
    "title": "El agravis comparatius",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/els-agravis-comparatius"
  },
  {
    "id": 3526,
    "date": "2011-03-28T05:06:00",
    "slug": "salvem-la-valleta-3a-marxa-reivindicativa",
    "link": "https://socdepoble.net/2011/03/28/salvem-la-valleta-3a-marxa-reivindicativa/",
    "title": "Salvem la Valleta, 3a Marxa Reivindicativa",
    "poblesDetectats": [
      "Agres",
      "Alfafara",
      "Banyeres de Mariola",
      "Beneixama",
      "Bocairent",
      "Camp de Mirra",
      "La Canyada",
      "Muro d'Alcoi",
      "Ontinyent",
      "Villena"
    ],
    "poblePrincipal": "Agres",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Excursions",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/salvem-la-valleta-3a-marxa-reivindicativa"
  },
  {
    "id": 186,
    "date": "2011-03-16T11:29:00",
    "slug": "fukushima-hores-desesperades",
    "link": "https://socdepoble.net/2011/03/16/fukushima-hores-desesperades/",
    "title": "Fukushima: hores desesperades",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/fukushima-hores-desesperades"
  },
  {
    "id": 187,
    "date": "2011-03-14T05:04:00",
    "slug": "prop-de-quatre-centes-persones-en-la-marxa-pel-tancament-de-la-nuclear-de-cofrents",
    "link": "https://socdepoble.net/2011/03/14/prop-de-quatre-centes-persones-en-la-marxa-pel-tancament-de-la-nuclear-de-cofrents/",
    "title": "Prop de quatre-centes persones en la marxa pel tancament de la nuclear de Cofrents",
    "poblesDetectats": [
      "Cofrents"
    ],
    "poblePrincipal": "Cofrents",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/prop-de-quatre-centes-persones-en-la-marxa-pel-tancament-de-la-nuclear-de-cofrents"
  },
  {
    "id": 1382,
    "date": "2011-03-12T00:43:45",
    "slug": "recollida-de-firmes-en-defensa-dels-assuts",
    "link": "https://socdepoble.net/2011/03/12/recollida-de-firmes-en-defensa-dels-assuts/",
    "title": "Recollida de firmes en Defensa dels Assuts",
    "poblesDetectats": [
      "Banyeres de Mariola",
      "Bocairent"
    ],
    "poblePrincipal": "Banyeres de Mariola",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/recollida-de-firmes-en-defensa-dels-assuts"
  },
  {
    "id": 1374,
    "date": "2011-03-11T23:12:21",
    "slug": "iii-marxa-reivindicativa-de-salvem-la-valleta",
    "link": "https://socdepoble.net/2011/03/11/iii-marxa-reivindicativa-de-salvem-la-valleta/",
    "title": "III Marxa Reivindicativa de Salvem La Valleta",
    "poblesDetectats": [
      "Agres",
      "Alfafara",
      "Banyeres de Mariola",
      "Beneixama",
      "Bocairent",
      "Camp de Mirra",
      "La Canyada",
      "Muro d'Alcoi",
      "Ontinyent",
      "Villena"
    ],
    "poblePrincipal": "Agres",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/iii-marxa-reivindicativa-de-salvem-la-valleta"
  },
  {
    "id": 1366,
    "date": "2011-03-10T13:01:22",
    "slug": "marxa-antinuclear-a-cofrents-2011",
    "link": "https://socdepoble.net/2011/03/10/marxa-antinuclear-a-cofrents-2011/",
    "title": "Marxa antinuclear a Cofrents",
    "poblesDetectats": [
      "Alcoi",
      "Cofrents",
      "Xalans"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/marxa-antinuclear-a-cofrents-2011"
  },
  {
    "id": 1359,
    "date": "2011-02-27T20:58:08",
    "slug": "ametllers-florits-la-torre-2011",
    "link": "https://socdepoble.net/2011/02/27/ametllers-florits-la-torre-2011/",
    "title": "Ametllers florits. La Torre 2011",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/ametllers-florits-la-torre-2011"
  },
  {
    "id": 1352,
    "date": "2011-02-26T23:46:47",
    "slug": "avancada-de-primavera-al-brull",
    "link": "https://socdepoble.net/2011/02/26/avancada-de-primavera-al-brull/",
    "title": "Avançada de primavera al Brull",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Brull Viu"
    ],
    "etiquetesNetes": [
      "Brull Viu"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/avancada-de-primavera-al-brull"
  },
  {
    "id": 1337,
    "date": "2011-02-22T13:09:59",
    "slug": "brull-viu-segueix-la-campanya",
    "link": "https://socdepoble.net/2011/02/22/brull-viu-segueix-la-campanya/",
    "title": "Brull Viu! segueix la campanya",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Brull Viu"
    ],
    "etiquetesNetes": [
      "Brull Viu"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/brull-viu-segueix-la-campanya"
  },
  {
    "id": 1331,
    "date": "2011-02-14T00:35:31",
    "slug": "lipad-com-a-eina-educativa",
    "link": "https://socdepoble.net/2011/02/14/lipad-com-a-eina-educativa/",
    "title": "L’iPad com a eina educativa",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "tecnologia-lliure",
    "categoriaTematicaProposadaLabel": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "etiquetesOriginals": [
      "Projecte TIC",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Projecte TIC",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/lipad-com-a-eina-educativa"
  },
  {
    "id": 2117,
    "date": "2011-02-13T12:39:16",
    "slug": "les-fonts-de-xixona",
    "link": "https://socdepoble.net/2011/02/13/les-fonts-de-xixona/",
    "title": "Les Fonts de Xixona",
    "poblesDetectats": [
      "Xixona"
    ],
    "poblePrincipal": "Xixona",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/les-fonts-de-xixona"
  },
  {
    "id": 2116,
    "date": "2011-02-12T11:31:30",
    "slug": "animalets",
    "link": "https://socdepoble.net/2011/02/12/animalets/",
    "title": "Animalets",
    "poblesDetectats": [
      "La Torre de les Maçanes",
      "Xixona"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "tecnologia-lliure",
    "categoriaTematicaProposadaLabel": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "etiquetesOriginals": [
      "Gent Sostenible",
      "Projecte TIC"
    ],
    "etiquetesNetes": [
      "Gent Sostenible",
      "Projecte TIC"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/animalets"
  },
  {
    "id": 195,
    "date": "2010-11-07T23:35:00",
    "slug": "no-paren",
    "link": "https://socdepoble.net/2010/11/07/no-paren/",
    "title": "No paren…",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/no-paren"
  },
  {
    "id": 196,
    "date": "2010-11-07T13:13:00",
    "slug": "la-plataforma-contra-el-hotel-de-la-font-roja-presenta-cinco-informes-sobre-su-inviabilidad",
    "link": "https://socdepoble.net/2010/11/07/la-plataforma-contra-el-hotel-de-la-font-roja-presenta-cinco-informes-sobre-su-inviabilidad/",
    "title": "La plataforma contra el hotel de la Font Roja presenta cinco informes sobre su inviabilidad",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "pdf_drive_docs",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-plataforma-contra-el-hotel-de-la-font-roja-presenta-cinco-informes-sobre-su-inviabilidad"
  },
  {
    "id": 15657,
    "date": "2010-10-14T22:25:00",
    "slug": "marxa-reivindicativa-a-la-serra-bernia",
    "link": "https://socdepoble.net/2010/10/14/marxa-reivindicativa-a-la-serra-bernia/",
    "title": "Marxa reivindicativa a la Serra Bèrnia",
    "poblesDetectats": [
      "Altea",
      "Benissa",
      "Callosa d'en Sarrià",
      "Calp",
      "Xaló"
    ],
    "poblePrincipal": "Altea",
    "comarquesDetectades": [
      "La Marina Alta",
      "La Marina Baixa"
    ],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/marxa-reivindicativa-a-la-serra-bernia"
  },
  {
    "id": 198,
    "date": "2010-10-14T13:56:00",
    "slug": "condenado-a-un-ano-de-carcel-por-construir-una-vivienda-ilegal-en-mariola",
    "link": "https://socdepoble.net/2010/10/14/condenado-a-un-ano-de-carcel-por-construir-una-vivienda-ilegal-en-mariola/",
    "title": "Condenado a un año de cárcel por construir una vivienda ilegal en Mariola",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/condenado-a-un-ano-de-carcel-por-construir-una-vivienda-ilegal-en-mariola"
  },
  {
    "id": 2115,
    "date": "2010-10-09T21:49:40",
    "slug": "curset-despart-al-carrero",
    "link": "https://socdepoble.net/2010/10/09/curset-despart-al-carrero/",
    "title": "Curset d’Espart al Carreró 2010",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "El Carreró Centre Cultural i Tecnològic"
    ],
    "etiquetesNetes": [
      "El Carreró Centre Cultural i Tecnològic"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/curset-despart-al-carrero"
  },
  {
    "id": 1163,
    "date": "2010-10-05T13:59:45",
    "slug": "anem-a-benifallim",
    "link": "https://socdepoble.net/2010/10/05/anem-a-benifallim/",
    "title": "Anem a Benifallim",
    "poblesDetectats": [
      "Benifallim",
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "Benifallim",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/anem-a-benifallim"
  },
  {
    "id": 1140,
    "date": "2010-08-23T00:59:01",
    "slug": "cicle-de-cine-ecologic-al-carrero",
    "link": "https://socdepoble.net/2010/08/23/cicle-de-cine-ecologic-al-carrero/",
    "title": "Cicle de Cine ecològic al Carreró",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "El Carreró Centre Cultural i Tecnològic"
    ],
    "etiquetesNetes": [
      "El Carreró Centre Cultural i Tecnològic"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/cicle-de-cine-ecologic-al-carrero"
  },
  {
    "id": 1129,
    "date": "2010-08-17T11:53:20",
    "slug": "aigua-i-mes-aigua-a-la-banya-de-la-torre",
    "link": "https://socdepoble.net/2010/08/17/aigua-i-mes-aigua-a-la-banya-de-la-torre/",
    "title": "Aigua i més aigua a la Banyà de la Torre",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/aigua-i-mes-aigua-a-la-banya-de-la-torre"
  },
  {
    "id": 201,
    "date": "2010-08-15T21:34:00",
    "slug": "xixona-inundada-por-el-agua-de-sus-fuentes",
    "link": "https://socdepoble.net/2010/08/15/xixona-inundada-por-el-agua-de-sus-fuentes/",
    "title": "Xixona, «inundada» por el agua de sus fuentes",
    "poblesDetectats": [
      "Xixona"
    ],
    "poblePrincipal": "Xixona",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/xixona-inundada-por-el-agua-de-sus-fuentes"
  },
  {
    "id": 202,
    "date": "2010-08-13T20:02:00",
    "slug": "el-brull-mes-viu-que-mai",
    "link": "https://socdepoble.net/2010/08/13/el-brull-mes-viu-que-mai/",
    "title": "El Brull més viu que mai!",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Brull Viu"
    ],
    "etiquetesNetes": [
      "Brull Viu"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-brull-mes-viu-que-mai"
  },
  {
    "id": 1092,
    "date": "2010-08-07T23:19:09",
    "slug": "la-electric-band-en-festes-dels-fadrins",
    "link": "https://socdepoble.net/2010/08/07/la-electric-band-en-festes-dels-fadrins/",
    "title": "La Senyal + Santi Campillo & The Electric Band en la Festa dels Fadrins!",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "patrimoni-cultura",
    "categoriaTematicaProposadaLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "etiquetesOriginals": [
      "Gent que Fa Música"
    ],
    "etiquetesNetes": [
      "Gent que Fa Música"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-electric-band-en-festes-dels-fadrins"
  },
  {
    "id": 203,
    "date": "2010-07-28T17:26:00",
    "slug": "brull-viu-dissabte-31-de-juliol-activitat-brull",
    "link": "https://socdepoble.net/2010/07/28/brull-viu-dissabte-31-de-juliol-activitat-brull/",
    "title": "Brull Viu! Dissabte 31 de juliol, activitat Brull",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Brull Viu",
      "Excursions"
    ],
    "etiquetesNetes": [
      "Brull Viu",
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/brull-viu-dissabte-31-de-juliol-activitat-brull"
  },
  {
    "id": 1062,
    "date": "2010-07-25T22:27:34",
    "slug": "nits-de-cinema-i-musica-2010",
    "link": "https://socdepoble.net/2010/07/25/nits-de-cinema-i-musica-2010/",
    "title": "Nits de Cinema i Música 2010",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "patrimoni-cultura",
    "categoriaTematicaProposadaLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "etiquetesOriginals": [
      "El Carreró Centre Cultural i Tecnològic",
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "etiquetesNetes": [
      "El Carreró Centre Cultural i Tecnològic",
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/nits-de-cinema-i-musica-2010"
  },
  {
    "id": 204,
    "date": "2010-06-30T16:49:00",
    "slug": "mesures-d-ordenacio-urbanistica-2",
    "link": "https://socdepoble.net/2010/06/30/mesures-d-ordenacio-urbanistica-2/",
    "title": "Mesures d’ordenació urbanística (2)",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/mesures-d-ordenacio-urbanistica-2"
  },
  {
    "id": 1020,
    "date": "2010-06-30T15:15:16",
    "slug": "bons-moments-a-la-torre-jazz-2010",
    "link": "https://socdepoble.net/2010/06/30/bons-moments-a-la-torre-jazz-2010/",
    "title": "Bons moments a La Torre Jazz 2010",
    "poblesDetectats": [
      "Alacant",
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "Alacant",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "patrimoni-cultura",
    "categoriaTematicaProposadaLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "etiquetesOriginals": [
      "El Carreró Centre Cultural i Tecnològic",
      "Gent que Fa Música",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "El Carreró Centre Cultural i Tecnològic",
      "Gent que Fa Música",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/bons-moments-a-la-torre-jazz-2010"
  },
  {
    "id": 1034,
    "date": "2010-06-27T20:41:32",
    "slug": "noves-tecnologies-i-responsabilitat-social-sense-eixir-del-poble",
    "link": "https://socdepoble.net/2010/06/27/noves-tecnologies-i-responsabilitat-social-sense-eixir-del-poble/",
    "title": "Noves tecnologies i responsabilitat social sense eixir del poble",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "tecnologia-lliure",
    "categoriaTematicaProposadaLabel": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "etiquetesOriginals": [
      "El Carreró Centre Cultural i Tecnològic",
      "Projecte TIC"
    ],
    "etiquetesNetes": [
      "El Carreró Centre Cultural i Tecnològic",
      "Projecte TIC"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/noves-tecnologies-i-responsabilitat-social-sense-eixir-del-poble"
  },
  {
    "id": 2114,
    "date": "2010-06-26T11:59:41",
    "slug": "jazz-polop-2010",
    "link": "https://socdepoble.net/2010/06/26/jazz-polop-2010/",
    "title": "Jazz Polop 2010",
    "poblesDetectats": [
      "Polop"
    ],
    "poblePrincipal": "Polop",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "patrimoni-cultura",
    "categoriaTematicaProposadaLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/jazz-polop-2010"
  },
  {
    "id": 205,
    "date": "2010-06-23T00:12:00",
    "slug": "mesures-d-ordenacio-urbanistica-1",
    "link": "https://socdepoble.net/2010/06/23/mesures-d-ordenacio-urbanistica-1/",
    "title": "Mesures d’ordenació urbanística (1)",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/mesures-d-ordenacio-urbanistica-1"
  },
  {
    "id": 1007,
    "date": "2010-06-18T19:14:03",
    "slug": "la-torre-jazz-2010",
    "link": "https://socdepoble.net/2010/06/18/la-torre-jazz-2010/",
    "title": "La Torre Jazz 2010",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "patrimoni-cultura",
    "categoriaTematicaProposadaLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "etiquetesOriginals": [
      "El Carreró Centre Cultural i Tecnològic",
      "Gent que Fa Música"
    ],
    "etiquetesNetes": [
      "El Carreró Centre Cultural i Tecnològic",
      "Gent que Fa Música"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-torre-jazz-2010"
  },
  {
    "id": 980,
    "date": "2010-06-08T13:06:45",
    "slug": "no-al-genocidi-solidaritat-amb-el-poble-palesti",
    "link": "https://socdepoble.net/2010/06/08/no-al-genocidi-solidaritat-amb-el-poble-palesti/",
    "title": "Aturem el genocidi contra poble palestí",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/no-al-genocidi-solidaritat-amb-el-poble-palesti"
  },
  {
    "id": 964,
    "date": "2010-06-05T12:38:47",
    "slug": "5-de-juny-dia-mundial-del-medi-ambient",
    "link": "https://socdepoble.net/2010/06/05/5-de-juny-dia-mundial-del-medi-ambient/",
    "title": "5 de juny. Dia Mundial del Medi Ambient",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Reivindicant",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Reivindicant",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/5-de-juny-dia-mundial-del-medi-ambient"
  },
  {
    "id": 1281,
    "date": "2010-05-07T08:41:22",
    "slug": "pla-de-viabilitat-economica-beta",
    "link": "https://socdepoble.net/2010/05/07/pla-de-viabilitat-economica-beta/",
    "title": "Pla de Viabilitat Econòmica (beta)",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "tecnologia-lliure",
    "categoriaTematicaProposadaLabel": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "etiquetesOriginals": [
      "Projecte TIC"
    ],
    "etiquetesNetes": [
      "Projecte TIC"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/pla-de-viabilitat-economica-beta"
  },
  {
    "id": 158,
    "date": "2010-05-06T01:32:00",
    "slug": "la-font-roja-tambe-es-nostra",
    "link": "https://socdepoble.net/2010/05/06/la-font-roja-tambe-es-nostra/",
    "title": "La Font Roja també es nostra",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-font-roja-tambe-es-nostra"
  },
  {
    "id": 1275,
    "date": "2010-05-05T08:19:31",
    "slug": "fitxa-dalumne-per-a-bandes-de-musica",
    "link": "https://socdepoble.net/2010/05/05/fitxa-dalumne-per-a-bandes-de-musica/",
    "title": "Fitxa d’Alumne per a bandes de música",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "tecnologia-lliure",
    "categoriaTematicaProposadaLabel": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "etiquetesOriginals": [
      "Projecte TIC"
    ],
    "etiquetesNetes": [
      "Projecte TIC"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/fitxa-dalumne-per-a-bandes-de-musica"
  },
  {
    "id": 156,
    "date": "2010-04-22T01:25:00",
    "slug": "22-dabril-dia-de-la-terra",
    "link": "https://socdepoble.net/2010/04/22/22-dabril-dia-de-la-terra/",
    "title": "22 d’abril. Dia de La Terra",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/22-dabril-dia-de-la-terra"
  },
  {
    "id": 155,
    "date": "2010-04-18T03:56:00",
    "slug": "milers-de-persones-es-manifesten-contra-els-transgenics",
    "link": "https://socdepoble.net/2010/04/18/milers-de-persones-es-manifesten-contra-els-transgenics/",
    "title": "Milers de persones es manifesten contra els transgènics",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pdf_drive_docs",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/milers-de-persones-es-manifesten-contra-els-transgenics"
  },
  {
    "id": 3513,
    "date": "2010-04-12T23:54:00",
    "slug": "salvem-la-valleta",
    "link": "https://socdepoble.net/2010/04/12/salvem-la-valleta/",
    "title": "Salvem la Valleta",
    "poblesDetectats": [
      "Agres",
      "Muro d'Alcoi"
    ],
    "poblePrincipal": "Agres",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/salvem-la-valleta"
  },
  {
    "id": 2113,
    "date": "2010-02-25T01:33:00",
    "slug": "un-espai-public-geolocalitzat-per-a-la-torre",
    "link": "https://socdepoble.net/2010/02/25/un-espai-public-geolocalitzat-per-a-la-torre/",
    "title": "Un espai public geolocalitzat per a La Torre",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "tecnologia-lliure",
    "categoriaTematicaProposadaLabel": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "etiquetesOriginals": [
      "Projecte TIC",
      "Propostes"
    ],
    "etiquetesNetes": [
      "Projecte TIC",
      "Propostes"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/un-espai-public-geolocalitzat-per-a-la-torre"
  },
  {
    "id": 153,
    "date": "2010-02-23T02:59:00",
    "slug": "trobada-dintercanvi-de-llavors-tradicionals",
    "link": "https://socdepoble.net/2010/02/23/trobada-dintercanvi-de-llavors-tradicionals/",
    "title": "Trobada d’Intercanvi de Llavors Tradicionals",
    "poblesDetectats": [
      "Muro d'Alcoi"
    ],
    "poblePrincipal": "Muro d'Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Trobades"
    ],
    "etiquetesNetes": [
      "Trobades"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/trobada-dintercanvi-de-llavors-tradicionals"
  },
  {
    "id": 152,
    "date": "2010-02-20T18:59:00",
    "slug": "remor-daigua-clara",
    "link": "https://socdepoble.net/2010/02/20/remor-daigua-clara/",
    "title": "Remor d’aigua clara",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Brull Viu"
    ],
    "etiquetesNetes": [
      "Brull Viu"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/remor-daigua-clara"
  },
  {
    "id": 151,
    "date": "2010-02-14T03:07:00",
    "slug": "la-neu-protagonista-de-la-primera-jornada-brull-viu",
    "link": "https://socdepoble.net/2010/02/14/la-neu-protagonista-de-la-primera-jornada-brull-viu/",
    "title": "La neu, protagonista de la primera jornada Brull Viu!",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Brull Viu"
    ],
    "etiquetesNetes": [
      "Brull Viu"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-neu-protagonista-de-la-primera-jornada-brull-viu"
  },
  {
    "id": 150,
    "date": "2010-02-07T19:23:00",
    "slug": "projecte-brull-viu-continuem",
    "link": "https://socdepoble.net/2010/02/07/projecte-brull-viu-continuem/",
    "title": "Projecte Brull Viu! Continuem",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Brull Viu"
    ],
    "etiquetesNetes": [
      "Brull Viu"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/projecte-brull-viu-continuem"
  },
  {
    "id": 149,
    "date": "2010-02-01T15:44:00",
    "slug": "pujada-atletica-en-defensa-de-la-font-roja",
    "link": "https://socdepoble.net/2010/02/01/pujada-atletica-en-defensa-de-la-font-roja/",
    "title": "Pujada atlètica en Defensa de La Font Roja",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Esports",
      "Memfotisme",
      "Reivindicant",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Esports",
      "Memfotisme",
      "Reivindicant",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/pujada-atletica-en-defensa-de-la-font-roja"
  },
  {
    "id": 2107,
    "date": "2010-02-01T11:28:00",
    "slug": "ultra-trail-muntanyes-dalacant",
    "link": "https://socdepoble.net/2010/02/01/ultra-trail-muntanyes-dalacant/",
    "title": "Ultra-Trail Muntanyes d’Alacant 2010",
    "poblesDetectats": [
      "L'Alacantí",
      "L'Alcoià",
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "L'Alacantí",
    "comarquesDetectades": [
      "El Comtat",
      "La Marina Baixa"
    ],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Esports"
    ],
    "etiquetesNetes": [
      "Esports"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/ultra-trail-muntanyes-dalacant"
  },
  {
    "id": 2111,
    "date": "2010-01-30T14:41:00",
    "slug": "dades-sobre-sant-gregori",
    "link": "https://socdepoble.net/2010/01/30/dades-sobre-sant-gregori/",
    "title": "Dades sobre Sant Gregori",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/dades-sobre-sant-gregori"
  },
  {
    "id": 2110,
    "date": "2010-01-30T14:21:00",
    "slug": "goigs-a-sant-gregori-bisbe-dostia",
    "link": "https://socdepoble.net/2010/01/30/goigs-a-sant-gregori-bisbe-dostia/",
    "title": "Goigs a Sant Gregori, Bisbe d’Òstia",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/goigs-a-sant-gregori-bisbe-dostia"
  },
  {
    "id": 21,
    "date": "2010-01-30T12:52:00",
    "slug": "llumeners-i-clavaries",
    "link": "https://socdepoble.net/2010/01/30/llumeners-i-clavaries/",
    "title": "Llumeners i Clavaries",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/llumeners-i-clavaries"
  },
  {
    "id": 148,
    "date": "2010-01-21T20:55:00",
    "slug": "el-dissabte-reunio-rentonar",
    "link": "https://socdepoble.net/2010/01/21/el-dissabte-reunio-rentonar/",
    "title": "El dissabte, reunió Rentonar",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Reunions"
    ],
    "etiquetesNetes": [
      "Reunions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-dissabte-reunio-rentonar"
  },
  {
    "id": 146,
    "date": "2010-01-20T12:13:00",
    "slug": "excursio-aigues-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2010/01/20/excursio-aigues-la-torre-de-les-macanes/",
    "title": "Excursió Aigües – La Torre de les Maçanes",
    "poblesDetectats": [
      "Aigües",
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "Aigües",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-aigues-la-torre-de-les-macanes"
  },
  {
    "id": 143,
    "date": "2009-11-28T20:56:00",
    "slug": "excursio-al-barranc-de-les-alcoies",
    "link": "https://socdepoble.net/2009/11/28/excursio-al-barranc-de-les-alcoies/",
    "title": "Excursió al Barranc de Les Alcoies",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-al-barranc-de-les-alcoies"
  },
  {
    "id": 142,
    "date": "2009-11-14T20:44:00",
    "slug": "brull-viu-un-projecte-a-llarg-termini",
    "link": "https://socdepoble.net/2009/11/14/brull-viu-un-projecte-a-llarg-termini/",
    "title": "Brull Viu! un projecte a llarg termini",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Brull Viu"
    ],
    "etiquetesNetes": [
      "Brull Viu"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/brull-viu-un-projecte-a-llarg-termini"
  },
  {
    "id": 141,
    "date": "2009-11-13T21:30:00",
    "slug": "sos-font-roja-ciberaccio-i-nous-materials",
    "link": "https://socdepoble.net/2009/11/13/sos-font-roja-ciberaccio-i-nous-materials/",
    "title": "SOS Font Roja: ciberacció i nous materials",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/sos-font-roja-ciberaccio-i-nous-materials"
  },
  {
    "id": 139,
    "date": "2009-11-08T22:04:00",
    "slug": "guia-deficiencia-energetica",
    "link": "https://socdepoble.net/2009/11/08/guia-deficiencia-energetica/",
    "title": "Guia d’eficiència energètica",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Gent Sostenible"
    ],
    "etiquetesNetes": [
      "Gent Sostenible"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/guia-deficiencia-energetica"
  },
  {
    "id": 138,
    "date": "2009-11-04T22:51:00",
    "slug": "excursio-per-xixona",
    "link": "https://socdepoble.net/2009/11/04/excursio-per-xixona/",
    "title": "Excursió per Xixona",
    "poblesDetectats": [
      "Xixona"
    ],
    "poblePrincipal": "Xixona",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-per-xixona"
  },
  {
    "id": 136,
    "date": "2009-10-21T19:56:00",
    "slug": "final-campanya-brull-viu-2009",
    "link": "https://socdepoble.net/2009/10/21/final-campanya-brull-viu-2009/",
    "title": "Final Campanya Brull Viu! 2009",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Brull Viu"
    ],
    "etiquetesNetes": [
      "Brull Viu"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/final-campanya-brull-viu-2009"
  },
  {
    "id": 2112,
    "date": "2009-10-19T23:07:00",
    "slug": "24-doctubre-la-torre-els-plans-la-torre",
    "link": "https://socdepoble.net/2009/10/19/24-doctubre-la-torre-els-plans-la-torre/",
    "title": "24 d’octubre – La Torre – Els Plans – La Torre",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/24-doctubre-la-torre-els-plans-la-torre"
  },
  {
    "id": 134,
    "date": "2009-10-15T11:45:00",
    "slug": "programacio-de-senderisme-2009-2010-1er-semestre",
    "link": "https://socdepoble.net/2009/10/15/programacio-de-senderisme-2009-2010-1er-semestre/",
    "title": "Programació de senderisme 2009 – 2010. 1er semestre",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "pdf_drive_docs",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/programacio-de-senderisme-2009-2010-1er-semestre"
  },
  {
    "id": 14492,
    "date": "2009-09-01T23:02:00",
    "slug": "la-torre-jazz-2009",
    "link": "https://socdepoble.net/2009/09/01/la-torre-jazz-2009/",
    "title": "La Torre Jazz 2009",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "patrimoni-cultura",
    "categoriaTematicaProposadaLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "etiquetesOriginals": [
      "El Carreró Centre Cultural i Tecnològic",
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "etiquetesNetes": [
      "El Carreró Centre Cultural i Tecnològic",
      "Esdeveniments",
      "Gent que Fa Música"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-torre-jazz-2009"
  },
  {
    "id": 133,
    "date": "2009-08-31T00:54:00",
    "slug": "brull-viu-grup-voluntaris-cam-diputacio",
    "link": "https://socdepoble.net/2009/08/31/brull-viu-grup-voluntaris-cam-diputacio/",
    "title": "Brull Viu! Grup Voluntaris CAM – Diputació",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Brull Viu"
    ],
    "etiquetesNetes": [
      "Brull Viu"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/brull-viu-grup-voluntaris-cam-diputacio"
  },
  {
    "id": 132,
    "date": "2009-08-28T19:07:00",
    "slug": "excursio-al-mas-del-raco-pel-cami-de-bugaia",
    "link": "https://socdepoble.net/2009/08/28/excursio-al-mas-del-raco-pel-cami-de-bugaia/",
    "title": "Excursió al Mas del Racó pel camí de Bugaia",
    "poblesDetectats": [
      "La Torre de les Maçanes",
      "Xixona"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-al-mas-del-raco-pel-cami-de-bugaia"
  },
  {
    "id": 131,
    "date": "2009-08-27T01:57:00",
    "slug": "brull-viu-el-grup-de-voluntariat-medi-ambiental-diputacio-cam-de-lestiu-vol-participar-en-el-brull",
    "link": "https://socdepoble.net/2009/08/27/brull-viu-el-grup-de-voluntariat-medi-ambiental-diputacio-cam-de-lestiu-vol-participar-en-el-brull/",
    "title": "Brull Viu! El grup de voluntariat medi ambiental Diputació – CAM de l’estiu, vol participar en el Brull",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Brull Viu"
    ],
    "etiquetesNetes": [
      "Brull Viu"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/brull-viu-el-grup-de-voluntariat-medi-ambiental-diputacio-cam-de-lestiu-vol-participar-en-el-brull"
  },
  {
    "id": 130,
    "date": "2009-08-25T15:28:00",
    "slug": "brull-viu-al-diari-informacion",
    "link": "https://socdepoble.net/2009/08/25/brull-viu-al-diari-informacion/",
    "title": "Brull Viu! al diari Información",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "El Rentonar"
    ],
    "etiquetesNetes": [
      "El Rentonar"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/brull-viu-al-diari-informacion"
  },
  {
    "id": 129,
    "date": "2009-08-25T00:38:00",
    "slug": "el-cami-de-bugaia",
    "link": "https://socdepoble.net/2009/08/25/el-cami-de-bugaia/",
    "title": "El camí de Bugaia",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-cami-de-bugaia"
  },
  {
    "id": 2105,
    "date": "2009-08-19T23:49:00",
    "slug": "foc-prop-del-mas-de-les-florencies",
    "link": "https://socdepoble.net/2009/08/19/foc-prop-del-mas-de-les-florencies/",
    "title": "Foc prop del mas de les Florencies",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Incendis"
    ],
    "etiquetesNetes": [
      "Incendis"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/foc-prop-del-mas-de-les-florencies"
  },
  {
    "id": 127,
    "date": "2009-08-14T00:04:00",
    "slug": "els-festers-de-sant-gregori-ens-regalen-una-pantalla-de-plasma",
    "link": "https://socdepoble.net/2009/08/14/els-festers-de-sant-gregori-ens-regalen-una-pantalla-de-plasma/",
    "title": "Els Festers de Sant Gregori ens regalen una pantalla de plasma",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "El Carreró Centre Cultural i Tecnològic"
    ],
    "etiquetesNetes": [
      "El Carreró Centre Cultural i Tecnològic"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/els-festers-de-sant-gregori-ens-regalen-una-pantalla-de-plasma"
  },
  {
    "id": 126,
    "date": "2009-08-13T23:46:00",
    "slug": "brull-viu-el-rentonar-regenera-el-brull-amb-la-collaboracio-de-la-cam",
    "link": "https://socdepoble.net/2009/08/13/brull-viu-el-rentonar-regenera-el-brull-amb-la-collaboracio-de-la-cam/",
    "title": "Brull Viu! El Rentonar regenera el Brull amb la col·laboracio de la CAM",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Brull Viu"
    ],
    "etiquetesNetes": [
      "Brull Viu"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/brull-viu-el-rentonar-regenera-el-brull-amb-la-collaboracio-de-la-cam"
  },
  {
    "id": 124,
    "date": "2009-07-09T15:59:00",
    "slug": "brull-viu-dissabte-11-de-juliol-tornem-altra-vegada",
    "link": "https://socdepoble.net/2009/07/09/brull-viu-dissabte-11-de-juliol-tornem-altra-vegada/",
    "title": "Brull Viu! Dissabte 11 de juliol, tornem altra vegada",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Brull Viu"
    ],
    "etiquetesNetes": [
      "Brull Viu"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/brull-viu-dissabte-11-de-juliol-tornem-altra-vegada"
  },
  {
    "id": 123,
    "date": "2009-06-27T01:55:00",
    "slug": "brull-viu-comencem-el-4-de-juliol",
    "link": "https://socdepoble.net/2009/06/27/brull-viu-comencem-el-4-de-juliol/",
    "title": "Brull Viu! Començem el 4 de juliol",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Brull Viu"
    ],
    "etiquetesNetes": [
      "Brull Viu"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/brull-viu-comencem-el-4-de-juliol"
  },
  {
    "id": 122,
    "date": "2009-06-26T09:06:00",
    "slug": "la-torre-de-les-macanes-ha-quedat-fora-de-lampliacio-de-zones-zepa",
    "link": "https://socdepoble.net/2009/06/26/la-torre-de-les-macanes-ha-quedat-fora-de-lampliacio-de-zones-zepa/",
    "title": "La Torre de les Maçanes ha quedat fora de l’ampliació de Zones Zepa",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-torre-de-les-macanes-ha-quedat-fora-de-lampliacio-de-zones-zepa"
  },
  {
    "id": 2104,
    "date": "2009-06-10T00:53:00",
    "slug": "jornades-forestals-de-primavera",
    "link": "https://socdepoble.net/2009/06/10/jornades-forestals-de-primavera/",
    "title": "Jornades forestals de primavera",
    "poblesDetectats": [
      "València"
    ],
    "poblePrincipal": "València",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Reivindicant",
      "Trobades"
    ],
    "etiquetesNetes": [
      "Reivindicant",
      "Trobades"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/jornades-forestals-de-primavera"
  },
  {
    "id": 120,
    "date": "2009-06-08T23:25:00",
    "slug": "el-consell-de-seguritat-nuclear-autoritza-la-continuitat-de-garona",
    "link": "https://socdepoble.net/2009/06/08/el-consell-de-seguritat-nuclear-autoritza-la-continuitat-de-garona/",
    "title": "El Consell de Seguritat Nuclear autoritza la continuïtat de Garoña",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-consell-de-seguritat-nuclear-autoritza-la-continuitat-de-garona"
  },
  {
    "id": 1284,
    "date": "2009-06-05T07:52:09",
    "slug": "wimax-a-la-torre-ja",
    "link": "https://socdepoble.net/2009/06/05/wimax-a-la-torre-ja/",
    "title": "WiMAX a La Torre … JA!!!",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "tecnologia-lliure",
    "categoriaTematicaProposadaLabel": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "etiquetesOriginals": [
      "Projecte TIC",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Projecte TIC",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/wimax-a-la-torre-ja"
  },
  {
    "id": 118,
    "date": "2009-06-02T02:17:00",
    "slug": "muntanyes-en-xarxa-2009-els-plans-1330m",
    "link": "https://socdepoble.net/2009/06/02/muntanyes-en-xarxa-2009-els-plans-1330m/",
    "title": "Muntanyes en Xarxa 2009 – Els Plans (1.330 m)",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/muntanyes-en-xarxa-2009-els-plans-1330m"
  },
  {
    "id": 117,
    "date": "2009-05-29T02:32:00",
    "slug": "muntanyes-en-xarxa",
    "link": "https://socdepoble.net/2009/05/29/muntanyes-en-xarxa/",
    "title": "Muntanyes en Xarxa",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/muntanyes-en-xarxa"
  },
  {
    "id": 116,
    "date": "2009-05-26T13:49:00",
    "slug": "brull-viu-projecte-de-restauracio-del-espai-degradat-del-toll-del-brull",
    "link": "https://socdepoble.net/2009/05/26/brull-viu-projecte-de-restauracio-del-espai-degradat-del-toll-del-brull/",
    "title": "Brull Viu! Projecte de Restauració del espai degradat del Toll del Brull",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Activitats"
    ],
    "etiquetesNetes": [
      "Activitats"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/brull-viu-projecte-de-restauracio-del-espai-degradat-del-toll-del-brull"
  },
  {
    "id": 115,
    "date": "2009-05-22T16:18:00",
    "slug": "grup-antimilitarista-tortuga",
    "link": "https://socdepoble.net/2009/05/22/grup-antimilitarista-tortuga/",
    "title": "Grup antimilitarista Tortuga",
    "poblesDetectats": [
      "L'Alcoià"
    ],
    "poblePrincipal": "L'Alcoià",
    "comarquesDetectades": [
      "El Comtat",
      "La Marina Baixa"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/grup-antimilitarista-tortuga"
  },
  {
    "id": 114,
    "date": "2009-05-21T13:25:00",
    "slug": "desmesura-i-contradiccio",
    "link": "https://socdepoble.net/2009/05/21/desmesura-i-contradiccio/",
    "title": "Desmesura i contradicció",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/desmesura-i-contradiccio"
  },
  {
    "id": 112,
    "date": "2009-04-17T23:10:00",
    "slug": "amics-pelegrins-bon-cami",
    "link": "https://socdepoble.net/2009/04/17/amics-pelegrins-bon-cami/",
    "title": "Amics Pelegrins,… bon camí!",
    "poblesDetectats": [
      "La Torre de les Maçanes",
      "Xixona"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/amics-pelegrins-bon-cami"
  },
  {
    "id": 111,
    "date": "2009-04-01T16:13:00",
    "slug": "la-torre-de-les-macanes-paradis-per-als-senderistes",
    "link": "https://socdepoble.net/2009/04/01/la-torre-de-les-macanes-paradis-per-als-senderistes/",
    "title": "La Torre de les Maçanes, paradís per als senderistes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-torre-de-les-macanes-paradis-per-als-senderistes"
  },
  {
    "id": 109,
    "date": "2009-03-09T14:05:00",
    "slug": "lexcursio-de-relleu",
    "link": "https://socdepoble.net/2009/03/09/lexcursio-de-relleu/",
    "title": "L’excursió de Relleu",
    "poblesDetectats": [
      "La Torre de les Maçanes",
      "Relleu"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/lexcursio-de-relleu"
  },
  {
    "id": 108,
    "date": "2009-03-04T13:10:00",
    "slug": "tobada-dintercanvi-de-llavors-tradicionals",
    "link": "https://socdepoble.net/2009/03/04/tobada-dintercanvi-de-llavors-tradicionals/",
    "title": "Tobada d’intercanvi de llavors tradicionals",
    "poblesDetectats": [
      "Muro d'Alcoi"
    ],
    "poblePrincipal": "Muro d'Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Trobades"
    ],
    "etiquetesNetes": [
      "Trobades"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/tobada-dintercanvi-de-llavors-tradicionals"
  },
  {
    "id": 107,
    "date": "2009-02-27T16:41:00",
    "slug": "excursio-la-torre-relleu-2009",
    "link": "https://socdepoble.net/2009/02/27/excursio-la-torre-relleu-2009/",
    "title": "Excursió La Torre – Relleu",
    "poblesDetectats": [
      "La Torre de les Maçanes",
      "Relleu"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-la-torre-relleu-2009"
  },
  {
    "id": 106,
    "date": "2009-02-27T16:30:00",
    "slug": "jerolific",
    "link": "https://socdepoble.net/2009/02/27/jerolific/",
    "title": "Jeroglífic",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "El Carreró Centre Cultural i Tecnològic",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "El Carreró Centre Cultural i Tecnològic",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/jerolific"
  },
  {
    "id": 3510,
    "date": "2009-02-27T14:24:00",
    "slug": "nova-seu-del-rentonar",
    "link": "https://socdepoble.net/2009/02/27/nova-seu-del-rentonar/",
    "title": "Nova seu del Rentonar",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "El Carreró Centre Cultural i Tecnològic"
    ],
    "etiquetesNetes": [
      "El Carreró Centre Cultural i Tecnològic"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/nova-seu-del-rentonar"
  },
  {
    "id": 104,
    "date": "2009-02-23T00:04:00",
    "slug": "les-coses-que-fem",
    "link": "https://socdepoble.net/2009/02/23/les-coses-que-fem/",
    "title": "Les coses que fem …",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Replantacions"
    ],
    "etiquetesNetes": [
      "Replantacions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/les-coses-que-fem"
  },
  {
    "id": 1135,
    "date": "2009-02-09T23:55:00",
    "slug": "el-carrero-centre-dimmersio-cultural-i-tecnologic",
    "link": "https://socdepoble.net/2009/02/09/el-carrero-centre-dimmersio-cultural-i-tecnologic/",
    "title": "El Carreró. Centre d’Immersió Cultural i Tecnològic",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "patrimoni-cultura",
    "categoriaTematicaProposadaLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "etiquetesOriginals": [
      "El Carreró Centre Cultural i Tecnològic",
      "Fotos",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "El Carreró Centre Cultural i Tecnològic",
      "Fotos",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-carrero-centre-dimmersio-cultural-i-tecnologic"
  },
  {
    "id": 103,
    "date": "2009-01-28T15:20:00",
    "slug": "energia-solar-el-comptes-son-senzills-i-els-beneficis-inmediats",
    "link": "https://socdepoble.net/2009/01/28/energia-solar-el-comptes-son-senzills-i-els-beneficis-inmediats/",
    "title": "Energia solar, el comptes són senzills i els beneficis inmediats",
    "poblesDetectats": [
      "Beneixama"
    ],
    "poblePrincipal": "Beneixama",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/energia-solar-el-comptes-son-senzills-i-els-beneficis-inmediats"
  },
  {
    "id": 102,
    "date": "2009-01-26T01:51:00",
    "slug": "esperem-amb-esperanca",
    "link": "https://socdepoble.net/2009/01/26/esperem-amb-esperanca/",
    "title": "Esperem amb esperança",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Radar No",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Radar No",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/esperem-amb-esperanca"
  },
  {
    "id": 18,
    "date": "2008-12-21T01:20:00",
    "slug": "llibre-de-festes-fadrins-2002-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2008/12/21/llibre-de-festes-fadrins-2002-la-torre-de-les-macanes/",
    "title": "Llibre de Festes dels Fadrins 2002 a La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "patrimoni-cultura",
    "categoriaTematicaProposadaLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "etiquetesOriginals": [
      "Fadrins",
      "Festes dels Pobles",
      "Gent de La Torre"
    ],
    "etiquetesNetes": [
      "Fadrins",
      "Festes dels Pobles",
      "Gent de La Torre"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/llibre-de-festes-fadrins-2002-la-torre-de-les-macanes"
  },
  {
    "id": 101,
    "date": "2008-12-19T05:48:00",
    "slug": "bon-nadal",
    "link": "https://socdepoble.net/2008/12/19/bon-nadal/",
    "title": "Bon Nadal",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Opinió"
    ],
    "etiquetesNetes": [
      "Opinió"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/bon-nadal"
  },
  {
    "id": 99,
    "date": "2008-11-24T21:04:00",
    "slug": "excursio-projecte-cims-nets-del-c-exc-d-alcoi",
    "link": "https://socdepoble.net/2008/11/24/excursio-projecte-cims-nets-del-c-exc-d-alcoi/",
    "title": "Excursió Projecte Cims Nets del C. Exc. d’Alcoi",
    "poblesDetectats": [
      "Alcoi",
      "Benifallim",
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-projecte-cims-nets-del-c-exc-d-alcoi"
  },
  {
    "id": 98,
    "date": "2008-11-24T19:48:00",
    "slug": "salvem-la-valleta-no-a-lautovia-villena-muro",
    "link": "https://socdepoble.net/2008/11/24/salvem-la-valleta-no-a-lautovia-villena-muro/",
    "title": "Salvem la Valleta. No a l’autovia Villena – Muro",
    "poblesDetectats": [
      "Agres",
      "Alfafara",
      "Banyeres de Mariola",
      "Beneixama",
      "Bocairent",
      "Camp de Mirra",
      "La Canyada",
      "Muro d'Alcoi",
      "Villena"
    ],
    "poblePrincipal": "Agres",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/salvem-la-valleta-no-a-lautovia-villena-muro"
  },
  {
    "id": 97,
    "date": "2008-11-21T00:26:00",
    "slug": "projecte-cims-nets-del-centre-excursionista-d-alcoi-cea",
    "link": "https://socdepoble.net/2008/11/21/projecte-cims-nets-del-centre-excursionista-d-alcoi-cea/",
    "title": "Projecte Cims Nets del Centre Excursionista d’Alcoi (CEA)",
    "poblesDetectats": [
      "Alcoi",
      "Benifallim",
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/projecte-cims-nets-del-centre-excursionista-d-alcoi-cea"
  },
  {
    "id": 269,
    "date": "2008-11-20T22:49:00",
    "slug": "els-vidres-de-naica",
    "link": "https://socdepoble.net/2008/11/20/els-vidres-de-naica/",
    "title": "Els vidres de Naica",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/els-vidres-de-naica"
  },
  {
    "id": 95,
    "date": "2008-10-31T15:36:00",
    "slug": "intervencio-denric-morera-en-les-corts-valencianes",
    "link": "https://socdepoble.net/2008/10/31/intervencio-denric-morera-en-les-corts-valencianes/",
    "title": "Intervenció d’Enric Morera en Les Corts Valencianes",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [
      "El Comtat"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Pla Eòlic",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Pla Eòlic",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/intervencio-denric-morera-en-les-corts-valencianes"
  },
  {
    "id": 2103,
    "date": "2008-10-27T15:31:00",
    "slug": "alpuente-regne-del-silenci",
    "link": "https://socdepoble.net/2008/10/27/alpuente-regne-del-silenci/",
    "title": "Alpuente, regne del silenci?",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Pla Eòlic"
    ],
    "etiquetesNetes": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Pla Eòlic"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/alpuente-regne-del-silenci"
  },
  {
    "id": 93,
    "date": "2008-10-22T13:44:00",
    "slug": "excursio-la-torre-relleu",
    "link": "https://socdepoble.net/2008/10/22/excursio-la-torre-relleu/",
    "title": "Excursió La Torre – Relleu",
    "poblesDetectats": [
      "La Torre de les Maçanes",
      "Relleu"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-la-torre-relleu"
  },
  {
    "id": 92,
    "date": "2008-10-22T13:23:00",
    "slug": "col%c2%b7labora-amb-greenpeace",
    "link": "https://socdepoble.net/2008/10/22/col%c2%b7labora-amb-greenpeace/",
    "title": "Col·labora amb Greenpeace",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/col%c2%b7labora-amb-greenpeace"
  },
  {
    "id": 91,
    "date": "2008-10-16T18:37:00",
    "slug": "la-coordinadora-destudis-eolics-del-comptat-destapa-irregularitats-comeses-en-el-pla-eolic",
    "link": "https://socdepoble.net/2008/10/16/la-coordinadora-destudis-eolics-del-comptat-destapa-irregularitats-comeses-en-el-pla-eolic/",
    "title": "La Coordinadora d’Estudis Eòlics del Comptat destapa irregularitats comeses en el Pla Eòlic",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Pla Eòlic",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Pla Eòlic",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-coordinadora-destudis-eolics-del-comptat-destapa-irregularitats-comeses-en-el-pla-eolic"
  },
  {
    "id": 90,
    "date": "2008-10-14T00:29:00",
    "slug": "adjudicacio-dempreses-per-a-lexecucio-del-pla-eolic-valencia",
    "link": "https://socdepoble.net/2008/10/14/adjudicacio-dempreses-per-a-lexecucio-del-pla-eolic-valencia/",
    "title": "Adjudicació d’empreses per a l’execució del Pla Eòlic valencià",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Pla Eòlic",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Pla Eòlic",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/adjudicacio-dempreses-per-a-lexecucio-del-pla-eolic-valencia"
  },
  {
    "id": 89,
    "date": "2008-10-08T18:12:00",
    "slug": "comunicat-de-premsa-de-lassemblea-celebrada-ahir",
    "link": "https://socdepoble.net/2008/10/08/comunicat-de-premsa-de-lassemblea-celebrada-ahir/",
    "title": "Comunicat de premsa de l’assemblea celebrada ahir",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/comunicat-de-premsa-de-lassemblea-celebrada-ahir"
  },
  {
    "id": 88,
    "date": "2008-10-07T17:33:00",
    "slug": "a-poc-a-poc-sabrem-com-sha-dissenyat-el-pla-eolic-del-pais-valencia",
    "link": "https://socdepoble.net/2008/10/07/a-poc-a-poc-sabrem-com-sha-dissenyat-el-pla-eolic-del-pais-valencia/",
    "title": "A poc a poc sabrem com s’ha dissenyat el Pla Eòlic del País Valencià",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [
      "Alt Maestrat",
      "Comarques de Castelló",
      "Els Ports"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Pla Eòlic",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Pla Eòlic",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/a-poc-a-poc-sabrem-com-sha-dissenyat-el-pla-eolic-del-pais-valencia"
  },
  {
    "id": 87,
    "date": "2008-10-04T17:06:00",
    "slug": "interessant-article-sobre-energia",
    "link": "https://socdepoble.net/2008/10/04/interessant-article-sobre-energia/",
    "title": "Interessant article sobre energia",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Pla Eòlic"
    ],
    "etiquetesNetes": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Pla Eòlic"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/interessant-article-sobre-energia"
  },
  {
    "id": 86,
    "date": "2008-10-04T09:52:00",
    "slug": "accio-greenpeace",
    "link": "https://socdepoble.net/2008/10/04/accio-greenpeace/",
    "title": "Acció Greenpeace",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/accio-greenpeace"
  },
  {
    "id": 85,
    "date": "2008-09-25T14:55:00",
    "slug": "un-projecte-de-mineria-extractiva-a-cel-obert-en-fageca",
    "link": "https://socdepoble.net/2008/09/25/un-projecte-de-mineria-extractiva-a-cel-obert-en-fageca/",
    "title": "Un projecte de mineria extractiva a cel obert en Fageca",
    "poblesDetectats": [
      "Fageca"
    ],
    "poblePrincipal": "Fageca",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/un-projecte-de-mineria-extractiva-a-cel-obert-en-fageca"
  },
  {
    "id": 82,
    "date": "2008-09-22T05:30:00",
    "slug": "serra-escalona-i-devesa-de-campoamor-en-greu-perill",
    "link": "https://socdepoble.net/2008/09/22/serra-escalona-i-devesa-de-campoamor-en-greu-perill/",
    "title": "Serra Escalona i Devesa de Campoamor, en greu perill",
    "poblesDetectats": [
      "Oriola"
    ],
    "poblePrincipal": "Oriola",
    "comarquesDetectades": [
      "El Baix Segura"
    ],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/serra-escalona-i-devesa-de-campoamor-en-greu-perill"
  },
  {
    "id": 81,
    "date": "2008-09-22T03:50:00",
    "slug": "11-000-signatures-no-son-prou",
    "link": "https://socdepoble.net/2008/09/22/11-000-signatures-no-son-prou/",
    "title": "11.000 signatures no són prou",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/11-000-signatures-no-son-prou"
  },
  {
    "id": 80,
    "date": "2008-09-22T00:30:00",
    "slug": "fuerte-rechazo-ciudadano",
    "link": "https://socdepoble.net/2008/09/22/fuerte-rechazo-ciudadano/",
    "title": "Fuerte rechazo ciudadano",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/fuerte-rechazo-ciudadano"
  },
  {
    "id": 78,
    "date": "2008-09-21T01:00:00",
    "slug": "el-concurs-de-lhotel-de-la-font-roja-queda-desert",
    "link": "https://socdepoble.net/2008/09/21/el-concurs-de-lhotel-de-la-font-roja-queda-desert/",
    "title": "El Concurs de l’hotel de la Font Roja queda desert",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-concurs-de-lhotel-de-la-font-roja-queda-desert"
  },
  {
    "id": 77,
    "date": "2008-09-17T22:48:00",
    "slug": "urbano-volia-reabilitar-el-sanatori-de-la-torre-amics-del-peixet",
    "link": "https://socdepoble.net/2008/09/17/urbano-volia-reabilitar-el-sanatori-de-la-torre-amics-del-peixet/",
    "title": "Urbano volia reabilitar el Sanatori de La Torre. Amics del Peixet!",
    "poblesDetectats": [
      "Alcoi",
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Ajuntament de La Torre",
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Ajuntament de La Torre",
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/urbano-volia-reabilitar-el-sanatori-de-la-torre-amics-del-peixet"
  },
  {
    "id": 76,
    "date": "2008-09-03T18:15:00",
    "slug": "recogidas-9-000-firmas-para-exigir-la-paralizacion-del-hotel-de-la-font-roja",
    "link": "https://socdepoble.net/2008/09/03/recogidas-9-000-firmas-para-exigir-la-paralizacion-del-hotel-de-la-font-roja/",
    "title": "Recogidas 9.000 firmas para exigir la paralización del hotel de la Font Roja",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/recogidas-9-000-firmas-para-exigir-la-paralizacion-del-hotel-de-la-font-roja"
  },
  {
    "id": 2102,
    "date": "2008-08-30T18:39:00",
    "slug": "la-plataforma-del-plan-eolico-insta-a-los-alcaldes-a-exigir-informacion-al-consell",
    "link": "https://socdepoble.net/2008/08/30/la-plataforma-del-plan-eolico-insta-a-los-alcaldes-a-exigir-informacion-al-consell/",
    "title": "La plataforma del plan eólico insta a los alcaldes a exigir información al Consell",
    "poblesDetectats": [
      "Benimassot"
    ],
    "poblePrincipal": "Benimassot",
    "comarquesDetectades": [
      "El Comtat"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Memfotisme",
      "Pla Eòlic",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Memfotisme",
      "Pla Eòlic",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-plataforma-del-plan-eolico-insta-a-los-alcaldes-a-exigir-informacion-al-consell"
  },
  {
    "id": 73,
    "date": "2008-08-17T23:28:00",
    "slug": "un-moment-emotiu-de-la-festa",
    "link": "https://socdepoble.net/2008/08/17/un-moment-emotiu-de-la-festa/",
    "title": "Un moment emotiu de la festa",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "patrimoni-cultura",
    "categoriaTematicaProposadaLabel": "🏛️ Patrimoni, Cultura, Música i Llengua",
    "etiquetesOriginals": [
      "Festes dels Pobles",
      "Gent de La Torre",
      "Noticies"
    ],
    "etiquetesNetes": [
      "Festes dels Pobles",
      "Gent de La Torre",
      "Noticies"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/un-moment-emotiu-de-la-festa"
  },
  {
    "id": 3502,
    "date": "2008-08-15T01:16:00",
    "slug": "evolucio-conversa-a-peu-de-paradeta-entre-una-pepera-i-un-ecologista",
    "link": "https://socdepoble.net/2008/08/15/evolucio-conversa-a-peu-de-paradeta-entre-una-pepera-i-un-ecologista/",
    "title": "Evolució. Conversa a peu de paradeta entre una pepera i un ecologista",
    "poblesDetectats": [
      "Alcoi",
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/evolucio-conversa-a-peu-de-paradeta-entre-una-pepera-i-un-ecologista"
  },
  {
    "id": 70,
    "date": "2008-08-15T01:03:00",
    "slug": "excursio-nocturna-2",
    "link": "https://socdepoble.net/2008/08/15/excursio-nocturna-2/",
    "title": "Excursió nocturna",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-nocturna-2"
  },
  {
    "id": 69,
    "date": "2008-08-12T00:21:00",
    "slug": "per-que-no-recuperem-la-vella-costum-danar-a-cagar-a-les-penyes",
    "link": "https://socdepoble.net/2008/08/12/per-que-no-recuperem-la-vella-costum-danar-a-cagar-a-les-penyes/",
    "title": "Per què no recuperem la vella costum d’anar a cagar a les penyes?",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/per-que-no-recuperem-la-vella-costum-danar-a-cagar-a-les-penyes"
  },
  {
    "id": 68,
    "date": "2008-08-11T11:47:00",
    "slug": "rentonar-al-carrer-i-tu-de-quin-planeta-eres",
    "link": "https://socdepoble.net/2008/08/11/rentonar-al-carrer-i-tu-de-quin-planeta-eres/",
    "title": "Rentonar al carrer. I tu, de quin planeta eres?",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/rentonar-al-carrer-i-tu-de-quin-planeta-eres"
  },
  {
    "id": 67,
    "date": "2008-08-07T23:46:00",
    "slug": "la-seccio-de-muntanya-rentonar-sen-va-als-alps",
    "link": "https://socdepoble.net/2008/08/07/la-seccio-de-muntanya-rentonar-sen-va-als-alps/",
    "title": "La Secció de Muntanya Rentonar sen va als Alps",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Esports"
    ],
    "etiquetesNetes": [
      "Esports"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-seccio-de-muntanya-rentonar-sen-va-als-alps"
  },
  {
    "id": 66,
    "date": "2008-08-07T00:26:00",
    "slug": "el-rentonar-entrega-les-signatures-arreplegades-fins-al-moment",
    "link": "https://socdepoble.net/2008/08/07/el-rentonar-entrega-les-signatures-arreplegades-fins-al-moment/",
    "title": "El Rentonar entrega les signatures arreplegades fins al moment",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-rentonar-entrega-les-signatures-arreplegades-fins-al-moment"
  },
  {
    "id": 64,
    "date": "2008-08-07T00:06:00",
    "slug": "presentat-recurs-per-falta-dinformacio-hotel-font-roja",
    "link": "https://socdepoble.net/2008/08/07/presentat-recurs-per-falta-dinformacio-hotel-font-roja/",
    "title": "Presentat recurs per falta d’informació. Hotel Font Roja",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/presentat-recurs-per-falta-dinformacio-hotel-font-roja"
  },
  {
    "id": 63,
    "date": "2008-08-04T11:24:00",
    "slug": "el-rentonar-tambe-en-competicions-esportives",
    "link": "https://socdepoble.net/2008/08/04/el-rentonar-tambe-en-competicions-esportives/",
    "title": "El Rentonar tambè en competicions esportives",
    "poblesDetectats": [
      "La Torre de les Maçanes",
      "Xixona"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Esports",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Esports",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-rentonar-tambe-en-competicions-esportives"
  },
  {
    "id": 62,
    "date": "2008-07-29T09:55:00",
    "slug": "concentracio-per-la-defensa-de-la-font-roja",
    "link": "https://socdepoble.net/2008/07/29/concentracio-per-la-defensa-de-la-font-roja/",
    "title": "Concentració per la defensa de la Font Roja",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/concentracio-per-la-defensa-de-la-font-roja"
  },
  {
    "id": 61,
    "date": "2008-07-24T00:19:00",
    "slug": "ajornament-de-la-concentracio-per-la-defensa-de-la-font-roja",
    "link": "https://socdepoble.net/2008/07/24/ajornament-de-la-concentracio-per-la-defensa-de-la-font-roja/",
    "title": "Ajornament de la concentració per la defensa de la Font Roja",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/ajornament-de-la-concentracio-per-la-defensa-de-la-font-roja"
  },
  {
    "id": 60,
    "date": "2008-07-22T23:02:00",
    "slug": "la-patagonia-amenacada-per-una-empresa-espanyola",
    "link": "https://socdepoble.net/2008/07/22/la-patagonia-amenacada-per-una-empresa-espanyola/",
    "title": "La Patagònia amenaçada per una empresa espanyola",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-patagonia-amenacada-per-una-empresa-espanyola"
  },
  {
    "id": 59,
    "date": "2008-07-22T22:17:00",
    "slug": "escaladors-de-greenpeace-en-endesa",
    "link": "https://socdepoble.net/2008/07/22/escaladors-de-greenpeace-en-endesa/",
    "title": "Escaladors de Greenpeace en Endesa",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant",
      "Vídeos"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant",
      "Vídeos"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "video_youtube_vimeo",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/escaladors-de-greenpeace-en-endesa"
  },
  {
    "id": 58,
    "date": "2008-07-21T22:34:00",
    "slug": "tota-pedra-fa-paret-participa",
    "link": "https://socdepoble.net/2008/07/21/tota-pedra-fa-paret-participa/",
    "title": "Tota pedra fa paret. Participa!",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/tota-pedra-fa-paret-participa"
  },
  {
    "id": 3684,
    "date": "2008-07-21T01:18:00",
    "slug": "camins-rurals-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2008/07/21/camins-rurals-de-la-torre-de-les-macanes/",
    "title": "Camins Rurals de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "tecnologia-lliure",
    "categoriaTematicaProposadaLabel": "💻 Tecnologia Lliure, Dades Obertes i Disseny",
    "etiquetesOriginals": [
      "Plànols"
    ],
    "etiquetesNetes": [
      "Plànols"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "pdf_drive_docs",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/camins-rurals-de-la-torre-de-les-macanes"
  },
  {
    "id": 57,
    "date": "2008-07-18T02:12:00",
    "slug": "recollida-de-signatures-font-roja-hotel-no",
    "link": "https://socdepoble.net/2008/07/18/recollida-de-signatures-font-roja-hotel-no/",
    "title": "Recollida de signatures",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/recollida-de-signatures-font-roja-hotel-no"
  },
  {
    "id": 56,
    "date": "2008-07-18T01:55:00",
    "slug": "polemica-en-alcoy",
    "link": "https://socdepoble.net/2008/07/18/polemica-en-alcoy/",
    "title": "Polémica en Alcoy",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Font Roja",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/polemica-en-alcoy"
  },
  {
    "id": 54,
    "date": "2008-06-23T12:33:00",
    "slug": "el-negoci-de-lenergia-eolica",
    "link": "https://socdepoble.net/2008/06/23/el-negoci-de-lenergia-eolica/",
    "title": "El negoci de l’Energia Eòlica",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Pla Eòlic",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Pla Eòlic",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-negoci-de-lenergia-eolica"
  },
  {
    "id": 53,
    "date": "2008-06-22T02:26:00",
    "slug": "volem-energies-netes-pero-no-a-qualsevol-preu",
    "link": "https://socdepoble.net/2008/06/22/volem-energies-netes-pero-no-a-qualsevol-preu/",
    "title": "Volem energies netes, però no a qualsevol preu",
    "poblesDetectats": [
      "Vilafranca"
    ],
    "poblePrincipal": "Vilafranca",
    "comarquesDetectades": [
      "Els Ports",
      "L'Alt Maestrat"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Pla Eòlic",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Pla Eòlic",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/volem-energies-netes-pero-no-a-qualsevol-preu"
  },
  {
    "id": 52,
    "date": "2008-06-21T17:36:00",
    "slug": "nou-radar-a-laitana",
    "link": "https://socdepoble.net/2008/06/21/nou-radar-a-laitana/",
    "title": "Nou Radar a l’Aitana",
    "poblesDetectats": [
      "L'Alcoià"
    ],
    "poblePrincipal": "L'Alcoià",
    "comarquesDetectades": [
      "El Comtat",
      "La Marina Baixa"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/nou-radar-a-laitana"
  },
  {
    "id": 51,
    "date": "2008-06-19T12:28:00",
    "slug": "excursio-nocturna",
    "link": "https://socdepoble.net/2008/06/19/excursio-nocturna/",
    "title": "Excursió nocturna",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-nocturna"
  },
  {
    "id": 50,
    "date": "2008-06-19T11:44:00",
    "slug": "el-rentonar-ens-quedem-sense-local",
    "link": "https://socdepoble.net/2008/06/19/el-rentonar-ens-quedem-sense-local/",
    "title": "Ens em quedat sense local. ¿Serà que els destorbem?",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-rentonar-ens-quedem-sense-local"
  },
  {
    "id": 47,
    "date": "2008-05-28T01:57:00",
    "slug": "carrera-de-muntanya-a-alcoi-excursio-pel-barranc-del-cinc",
    "link": "https://socdepoble.net/2008/05/28/carrera-de-muntanya-a-alcoi-excursio-pel-barranc-del-cinc/",
    "title": "Carrera de muntanya a Alcoi – Excursió pel barranc del Cinc",
    "poblesDetectats": [
      "Alcoi"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Esports",
      "Excursions"
    ],
    "etiquetesNetes": [
      "Esports",
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/carrera-de-muntanya-a-alcoi-excursio-pel-barranc-del-cinc"
  },
  {
    "id": 46,
    "date": "2008-05-28T00:28:00",
    "slug": "les-puntes-de-gosalvez-de-el-campello-novament-en-conflicte",
    "link": "https://socdepoble.net/2008/05/28/les-puntes-de-gosalvez-de-el-campello-novament-en-conflicte/",
    "title": "Les Puntes de Gosàlvez de El Campello, novament en conflicte",
    "poblesDetectats": [
      "El Campello"
    ],
    "poblePrincipal": "El Campello",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/les-puntes-de-gosalvez-de-el-campello-novament-en-conflicte"
  },
  {
    "id": 45,
    "date": "2008-05-28T00:05:00",
    "slug": "tala-darbres-a-castalla",
    "link": "https://socdepoble.net/2008/05/28/tala-darbres-a-castalla/",
    "title": "Tala d’arbres a Castalla",
    "poblesDetectats": [
      "Castalla"
    ],
    "poblePrincipal": "Castalla",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/tala-darbres-a-castalla"
  },
  {
    "id": 43,
    "date": "2008-05-27T01:34:00",
    "slug": "reivindicacio-de-la-carta-de-la-muntanya-a-la-serra-la-grana",
    "link": "https://socdepoble.net/2008/05/27/reivindicacio-de-la-carta-de-la-muntanya-a-la-serra-la-grana/",
    "title": "Reivindicació de la Carta de la Muntanya a la serra La Grana",
    "poblesDetectats": [
      "La Torre de les Maçanes",
      "Relleu",
      "Xixona"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/reivindicacio-de-la-carta-de-la-muntanya-a-la-serra-la-grana"
  },
  {
    "id": 41,
    "date": "2008-05-23T14:42:00",
    "slug": "els-ecologistes-questionen-la-necessitat-de-la-termica-de-xixona",
    "link": "https://socdepoble.net/2008/05/23/els-ecologistes-questionen-la-necessitat-de-la-termica-de-xixona/",
    "title": "Els ecologistes qüestionen la necessitat de la tèrmica de Xixona",
    "poblesDetectats": [
      "Xixona"
    ],
    "poblePrincipal": "Xixona",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/els-ecologistes-questionen-la-necessitat-de-la-termica-de-xixona"
  },
  {
    "id": 40,
    "date": "2008-05-23T14:12:00",
    "slug": "ens-ha-deixat-un-professional-de-la-muntanya",
    "link": "https://socdepoble.net/2008/05/23/ens-ha-deixat-un-professional-de-la-muntanya/",
    "title": "Ens ha deixat un professional de la muntanya",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Gent Sostenible"
    ],
    "etiquetesNetes": [
      "Gent Sostenible"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/ens-ha-deixat-un-professional-de-la-muntanya"
  },
  {
    "id": 39,
    "date": "2008-05-22T15:19:00",
    "slug": "el-rentonar-pujara-per-tercer-any-a-la-serra-dels-plans",
    "link": "https://socdepoble.net/2008/05/22/el-rentonar-pujara-per-tercer-any-a-la-serra-dels-plans/",
    "title": "El Rentonar pujarà per tercer any a la serra dels Plans",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/el-rentonar-pujara-per-tercer-any-a-la-serra-dels-plans"
  },
  {
    "id": 38,
    "date": "2008-05-22T15:12:00",
    "slug": "bai-que-animalaes",
    "link": "https://socdepoble.net/2008/05/22/bai-que-animalaes/",
    "title": "«Bai, que animalaes»",
    "poblesDetectats": [
      "La Torre de les Maçanes",
      "Xixona"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/bai-que-animalaes"
  },
  {
    "id": 37,
    "date": "2008-05-19T00:50:00",
    "slug": "l-aitana-una-serra-maltractada",
    "link": "https://socdepoble.net/2008/05/19/l-aitana-una-serra-maltractada/",
    "title": "L’Aitana, una serra maltractada",
    "poblesDetectats": [
      "L'Alcoià"
    ],
    "poblePrincipal": "L'Alcoià",
    "comarquesDetectades": [
      "El Comtat",
      "La Marina Baixa"
    ],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "pdf_drive_docs",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/l-aitana-una-serra-maltractada"
  },
  {
    "id": 2099,
    "date": "2008-05-16T02:38:00",
    "slug": "col-labora-a-frenar-la-tala-il-legal-d-arbres",
    "link": "https://socdepoble.net/2008/05/16/col-labora-a-frenar-la-tala-il-legal-d-arbres/",
    "title": "Col·labora a frenar la tala il·legal d’arbres",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/col-labora-a-frenar-la-tala-il-legal-d-arbres"
  },
  {
    "id": 34,
    "date": "2008-05-15T00:30:00",
    "slug": "villena-vendra-aigua-a-la-multinacional-danone",
    "link": "https://socdepoble.net/2008/05/15/villena-vendra-aigua-a-la-multinacional-danone/",
    "title": "Villena vendrà aigua a la multinacional Danone",
    "poblesDetectats": [
      "Villena"
    ],
    "poblePrincipal": "Villena",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/villena-vendra-aigua-a-la-multinacional-danone"
  },
  {
    "id": 2098,
    "date": "2008-05-12T12:06:00",
    "slug": "projecte-d-una-central-termica-de-gas-a-xixona",
    "link": "https://socdepoble.net/2008/05/12/projecte-d-una-central-termica-de-gas-a-xixona/",
    "title": "Projecte d’una central tèrmica de gas a Xixona",
    "poblesDetectats": [
      "Xixona"
    ],
    "poblePrincipal": "Xixona",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/projecte-d-una-central-termica-de-gas-a-xixona"
  },
  {
    "id": 32,
    "date": "2008-05-03T20:07:00",
    "slug": "la-ruta-sud-est-del-cami-de-santiago",
    "link": "https://socdepoble.net/2008/05/03/la-ruta-sud-est-del-cami-de-santiago/",
    "title": "La Ruta Sud-Est del Camí de Santiago",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Camí de Santiago",
      "Excursions"
    ],
    "etiquetesNetes": [
      "Camí de Santiago",
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "iframe_extern_substituit",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-ruta-sud-est-del-cami-de-santiago"
  },
  {
    "id": 335,
    "date": "2008-05-01T06:55:00",
    "slug": "historia-del-projecte-dinstallacio-de-lestacio-radar",
    "link": "https://socdepoble.net/2008/05/01/historia-del-projecte-dinstallacio-de-lestacio-radar/",
    "title": "Història del Projecte d’instal·lació de l’Estació Radar",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/historia-del-projecte-dinstallacio-de-lestacio-radar"
  },
  {
    "id": 30,
    "date": "2008-04-28T19:54:00",
    "slug": "proposta-per-a-tots-els-publics",
    "link": "https://socdepoble.net/2008/04/28/proposta-per-a-tots-els-publics/",
    "title": "Proposta per a tots els públics",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/proposta-per-a-tots-els-publics"
  },
  {
    "id": 2097,
    "date": "2008-04-24T01:21:00",
    "slug": "alacant-si-per-la-llibertat-dexpressio-salvem-tv3",
    "link": "https://socdepoble.net/2008/04/24/alacant-si-per-la-llibertat-dexpressio-salvem-tv3/",
    "title": "Alacant SÍ – Per la Llibertat d’Expressió salvem TV3",
    "poblesDetectats": [
      "Alacant"
    ],
    "poblePrincipal": "Alacant",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/alacant-si-per-la-llibertat-dexpressio-salvem-tv3"
  },
  {
    "id": 28,
    "date": "2008-04-23T22:06:00",
    "slug": "molinetes-per-a-tots",
    "link": "https://socdepoble.net/2008/04/23/molinetes-per-a-tots/",
    "title": "Molinetes per a tots",
    "poblesDetectats": [],
    "poblePrincipal": "Xarxa de Pobles",
    "comarquesDetectades": [
      "El Comtat"
    ],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Coordinadora d'Estudis Eòlics del Comtat",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/molinetes-per-a-tots"
  },
  {
    "id": 339,
    "date": "2008-04-20T02:33:00",
    "slug": "soterrament-de-laiguera-del-mas-de-praos",
    "link": "https://socdepoble.net/2008/04/20/soterrament-de-laiguera-del-mas-de-praos/",
    "title": "Soterrament de l’aigüera del Mas de Praos",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/soterrament-de-laiguera-del-mas-de-praos"
  },
  {
    "id": 26,
    "date": "2008-04-19T21:13:00",
    "slug": "no-a-l-oblit",
    "link": "https://socdepoble.net/2008/04/19/no-a-l-oblit/",
    "title": "No a l’oblit",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Incendis",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Incendis",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/no-a-l-oblit"
  },
  {
    "id": 25,
    "date": "2008-04-19T21:03:00",
    "slug": "replantacio-2008",
    "link": "https://socdepoble.net/2008/04/19/replantacio-2008/",
    "title": "Replantació 2008",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "comunitat-rural",
    "categoriaTematicaProposadaLabel": "🤝 Comunitat, Associacionisme i Món Rural",
    "etiquetesOriginals": [
      "Activitats",
      "Replantacions"
    ],
    "etiquetesNetes": [
      "Activitats",
      "Replantacions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/replantacio-2008"
  },
  {
    "id": 1786,
    "date": "2007-09-07T10:00:17",
    "slug": "albers-blancs-del-pont-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2007/09/07/albers-blancs-del-pont-de-la-torre-de-les-macanes/",
    "title": "Àlbers blancs del Pont de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/albers-blancs-del-pont-de-la-torre-de-les-macanes"
  },
  {
    "id": 1784,
    "date": "2007-09-07T09:30:29",
    "slug": "alborc-del-xipreret-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2007/09/07/alborc-del-xipreret-de-la-torre-de-les-macanes/",
    "title": "Àlborç del Xipreret de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/alborc-del-xipreret-de-la-torre-de-les-macanes"
  },
  {
    "id": 1782,
    "date": "2007-09-07T09:00:48",
    "slug": "carrasca-de-la-foia-blanca-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2007/09/07/carrasca-de-la-foia-blanca-de-la-torre-de-les-macanes/",
    "title": "Carrasca de la Foia Blanca de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/carrasca-de-la-foia-blanca-de-la-torre-de-les-macanes"
  },
  {
    "id": 1780,
    "date": "2007-09-07T08:30:55",
    "slug": "carrasca-de-la-zurca-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2007/09/07/carrasca-de-la-zurca-de-la-torre-de-les-macanes/",
    "title": "Carrasca de La Zurca de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/carrasca-de-la-zurca-de-la-torre-de-les-macanes"
  },
  {
    "id": 1778,
    "date": "2007-09-07T08:00:00",
    "slug": "carrasca-de-nofre-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2007/09/07/carrasca-de-nofre-de-la-torre-de-les-macanes/",
    "title": "Carrasca de Nofre de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/carrasca-de-nofre-de-la-torre-de-les-macanes"
  },
  {
    "id": 1776,
    "date": "2007-09-07T07:30:51",
    "slug": "carrasca-del-buitre-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2007/09/07/carrasca-del-buitre-de-la-torre-de-les-macanes/",
    "title": "Carrasca del Buitre de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/carrasca-del-buitre-de-la-torre-de-les-macanes"
  },
  {
    "id": 1774,
    "date": "2007-09-07T07:00:12",
    "slug": "carrasca-del-moral-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2007/09/07/carrasca-del-moral-de-la-torre-de-les-macanes/",
    "title": "Carrasca del Moral de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/carrasca-del-moral-de-la-torre-de-les-macanes"
  },
  {
    "id": 1772,
    "date": "2007-09-07T06:30:51",
    "slug": "fleixos-del-barranc-dhorta-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2007/09/07/fleixos-del-barranc-dhorta-de-la-torre-de-les-macanes/",
    "title": "Fleixos del Barranc d’Horta de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/fleixos-del-barranc-dhorta-de-la-torre-de-les-macanes"
  },
  {
    "id": 1770,
    "date": "2007-09-07T06:00:23",
    "slug": "ginebre-de-mitja-orella-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2007/09/07/ginebre-de-mitja-orella-de-la-torre-de-les-macanes/",
    "title": "Ginebre de Mitja Orella de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/ginebre-de-mitja-orella-de-la-torre-de-les-macanes"
  },
  {
    "id": 1768,
    "date": "2007-09-07T05:30:33",
    "slug": "llorer-de-villa-maria-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2007/09/07/llorer-de-villa-maria-de-la-torre-de-les-macanes/",
    "title": "Llorer de Villa María de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/llorer-de-villa-maria-de-la-torre-de-les-macanes"
  },
  {
    "id": 1766,
    "date": "2007-09-07T05:00:56",
    "slug": "oms-de-la-placa-de-lesglesia-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2007/09/07/oms-de-la-placa-de-lesglesia-de-la-torre-de-les-macanes/",
    "title": "Oms de la Plaça de l’Església de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/oms-de-la-placa-de-lesglesia-de-la-torre-de-les-macanes"
  },
  {
    "id": 1764,
    "date": "2007-09-07T04:30:02",
    "slug": "pi-de-la-foia-boix-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2007/09/07/pi-de-la-foia-boix-de-la-torre-de-les-macanes/",
    "title": "Pi de la Foia Boix de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/pi-de-la-foia-boix-de-la-torre-de-les-macanes"
  },
  {
    "id": 1762,
    "date": "2007-09-07T04:00:34",
    "slug": "pi-del-mas-de-pipa-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2007/09/07/pi-del-mas-de-pipa-de-la-torre-de-les-macanes/",
    "title": "Pi del Mas de Pipa de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/pi-del-mas-de-pipa-de-la-torre-de-les-macanes"
  },
  {
    "id": 1760,
    "date": "2007-09-07T03:30:29",
    "slug": "pi-del-pla-verd-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2007/09/07/pi-del-pla-verd-de-la-torre-de-les-macanes/",
    "title": "Pi del Pla Verd de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/pi-del-pla-verd-de-la-torre-de-les-macanes"
  },
  {
    "id": 1758,
    "date": "2007-09-07T03:00:49",
    "slug": "pi-dels-arrendaors-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2007/09/07/pi-dels-arrendaors-de-la-torre-de-les-macanes/",
    "title": "Pi dels Arrendaors de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/pi-dels-arrendaors-de-la-torre-de-les-macanes"
  },
  {
    "id": 1756,
    "date": "2007-09-07T02:30:01",
    "slug": "roures-de-nofre-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2007/09/07/roures-de-nofre-de-la-torre-de-les-macanes/",
    "title": "Roures de Nofre de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/roures-de-nofre-de-la-torre-de-les-macanes"
  },
  {
    "id": 1754,
    "date": "2007-09-07T02:00:17",
    "slug": "xiprer-de-la-foia-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2007/09/07/xiprer-de-la-foia-de-la-torre-de-les-macanes/",
    "title": "Xiprer de La Foia de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/xiprer-de-la-foia-de-la-torre-de-les-macanes"
  },
  {
    "id": 1751,
    "date": "2007-09-07T01:30:35",
    "slug": "xiprers-del-calvari-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2007/09/07/xiprers-del-calvari-de-la-torre-de-les-macanes/",
    "title": "Xiprers del Calvari de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/xiprers-del-calvari-de-la-torre-de-les-macanes"
  },
  {
    "id": 2014,
    "date": "2007-09-07T01:00:54",
    "slug": "xiprers-del-cementeri-de-la-torre-de-les-macanes",
    "link": "https://socdepoble.net/2007/09/07/xiprers-del-cementeri-de-la-torre-de-les-macanes/",
    "title": "Xiprers del Cementeri de La Torre de les Maçanes",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Patrimoni",
      "Posant en Valor els Recursos Locals"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/xiprers-del-cementeri-de-la-torre-de-les-macanes"
  },
  {
    "id": 342,
    "date": "2005-10-08T18:30:00",
    "slug": "excursio-a-la-serra-la-grana-octubre-2005",
    "link": "https://socdepoble.net/2005/10/08/excursio-a-la-serra-la-grana-octubre-2005/",
    "title": "Excursió a la Serra la Grana, octubre 2005",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Excursions",
      "Incendis",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Incendis",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-a-la-serra-la-grana-octubre-2005"
  },
  {
    "id": 343,
    "date": "2005-06-18T19:00:00",
    "slug": "excursio-a-la-serra-la-grana-juny-2005",
    "link": "https://socdepoble.net/2005/06/18/excursio-a-la-serra-la-grana-juny-2005/",
    "title": "Excursió a la Serra la Grana, juny 2005",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions"
    ],
    "etiquetesNetes": [
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-a-la-serra-la-grana-juny-2005"
  },
  {
    "id": 344,
    "date": "2004-10-09T20:00:00",
    "slug": "excursio-la-sarga-la-torre",
    "link": "https://socdepoble.net/2004/10/09/excursio-la-sarga-la-torre/",
    "title": "Excursió La Sarga – La Torre",
    "poblesDetectats": [
      "Alcoi",
      "La Torre de les Maçanes",
      "Xixona"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Excursions"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-la-sarga-la-torre"
  },
  {
    "id": 345,
    "date": "2004-09-12T18:30:00",
    "slug": "volta-ciclista-a-espanya-i-preparatius-radar-no",
    "link": "https://socdepoble.net/2004/09/12/volta-ciclista-a-espanya-i-preparatius-radar-no/",
    "title": "Volta Ciclista a Espanya i preparatius Radar NO",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/volta-ciclista-a-espanya-i-preparatius-radar-no"
  },
  {
    "id": 621,
    "date": "2004-08-22T16:19:00",
    "slug": "la-torre-de-les-macanes-especie-protegida",
    "link": "https://socdepoble.net/2004/08/22/la-torre-de-les-macanes-especie-protegida/",
    "title": "La Torre de les Maçanes, Espècie Protegida",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/la-torre-de-les-macanes-especie-protegida"
  },
  {
    "id": 3494,
    "date": "2004-06-05T18:00:00",
    "slug": "neteja-dels-voltants-de-la-casa-alta",
    "link": "https://socdepoble.net/2004/06/05/neteja-dels-voltants-de-la-casa-alta/",
    "title": "Neteja dels voltants de la Casa Alta",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/neteja-dels-voltants-de-la-casa-alta"
  },
  {
    "id": 3495,
    "date": "2004-05-26T18:00:00",
    "slug": "queixa-per-la-neteja-de-voreres-i-poda-de-carrasques-de-la-carretera",
    "link": "https://socdepoble.net/2004/05/26/queixa-per-la-neteja-de-voreres-i-poda-de-carrasques-de-la-carretera/",
    "title": "Queixa per la neteja de voreres i poda de carrasques de la carretera",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Arbres",
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Arbres Monumentals",
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/queixa-per-la-neteja-de-voreres-i-poda-de-carrasques-de-la-carretera"
  },
  {
    "id": 3496,
    "date": "2004-04-04T22:00:00",
    "slug": "iii-travessia-alcoi-la-torre-busot-el-campello",
    "link": "https://socdepoble.net/2004/04/04/iii-travessia-alcoi-la-torre-busot-el-campello/",
    "title": "III Travessia Alcoi – La Torre – Busot – El Campello",
    "poblesDetectats": [
      "Alcoi",
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [
      "La Marina Baixa"
    ],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Excursions"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/iii-travessia-alcoi-la-torre-busot-el-campello"
  },
  {
    "id": 3497,
    "date": "2004-03-20T23:00:00",
    "slug": "cova-la-mina-i-pou-de-neu-del-surdo",
    "link": "https://socdepoble.net/2004/03/20/cova-la-mina-i-pou-de-neu-del-surdo/",
    "title": "Cova La Mina i Pou de neu del Surdo",
    "poblesDetectats": [
      "La Torre de les Maçanes",
      "Xixona"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Excursions"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Excursions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/cova-la-mina-i-pou-de-neu-del-surdo"
  },
  {
    "id": 3498,
    "date": "2004-02-22T19:10:00",
    "slug": "per-la-vall-de-la-canal-i-la-serra-dels-plans",
    "link": "https://socdepoble.net/2004/02/22/per-la-vall-de-la-canal-i-la-serra-dels-plans/",
    "title": "Per la Vall de la Canal i la Serra dels Plans",
    "poblesDetectats": [
      "Alcoi",
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "Alcoi",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Esdeveniments",
      "Excursions",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Esdeveniments",
      "Excursions",
      "Posant en Valor els Recursos Locals",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/per-la-vall-de-la-canal-i-la-serra-dels-plans"
  },
  {
    "id": 3499,
    "date": "2004-02-14T20:46:00",
    "slug": "enamorats-del-medi-ambient",
    "link": "https://socdepoble.net/2004/02/14/enamorats-del-medi-ambient/",
    "title": "Enamorats del medi ambient. Replantació 2004",
    "poblesDetectats": [
      "Benifallim",
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "Benifallim",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "recursos-locals",
    "categoriaTematicaProposadaLabel": "🌾 Recursos Locals, Agricultura i Sobirania",
    "etiquetesOriginals": [
      "Posant en Valor els Recursos Locals",
      "Replantacions"
    ],
    "etiquetesNetes": [
      "Posant en Valor els Recursos Locals",
      "Replantacions"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/enamorats-del-medi-ambient"
  },
  {
    "id": 352,
    "date": "2003-11-30T20:30:00",
    "slug": "radar-no-manifest-a-la-serra-els-plans",
    "link": "https://socdepoble.net/2003/11/30/radar-no-manifest-a-la-serra-els-plans/",
    "title": "Radar No. Manifest a la Serra Els Plans",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "pdf_drive_docs",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/radar-no-manifest-a-la-serra-els-plans"
  },
  {
    "id": 353,
    "date": "2003-11-29T02:40:00",
    "slug": "campanya-publicitaria-radar-no",
    "link": "https://socdepoble.net/2003/11/29/campanya-publicitaria-radar-no/",
    "title": "Campanya publicitària Radar No",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "defensa-territori",
    "categoriaTematicaProposadaLabel": "⚖️ Defensa del Territori, Ecologia i Reivindicació",
    "etiquetesOriginals": [
      "Memfotisme",
      "Reivindicant"
    ],
    "etiquetesNetes": [
      "Memfotisme",
      "Reivindicant"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/campanya-publicitaria-radar-no"
  },
  {
    "id": 354,
    "date": "2003-10-09T19:00:00",
    "slug": "excursio-pou-de-neu-del-rentonar",
    "link": "https://socdepoble.net/2003/10/09/excursio-pou-de-neu-del-rentonar/",
    "title": "Excursió al Pou de Neu del Rentonar",
    "poblesDetectats": [
      "La Torre de les Maçanes"
    ],
    "poblePrincipal": "La Torre de les Maçanes",
    "comarquesDetectades": [],
    "categoriaTematicaProposadaId": "natura-excursions",
    "categoriaTematicaProposadaLabel": "🥾 Natura, Excursions i Camins",
    "etiquetesOriginals": [
      "Excursions",
      "Pou de neu",
      "Serra dels Plans"
    ],
    "etiquetesNetes": [
      "Excursions",
      "Pou de neu",
      "Serra dels Plans"
    ],
    "estat_revisio": "pendent_admin",
    "casosUsDetectats": [
      "pobles_etiquetats",
      "galeria_fotos",
      "enllacos_interns_reescrits"
    ],
    "rutaDestiCanonica": "/mur/excursio-pou-de-neu-del-rentonar"
  }
]);

export const PAGINES_WP_18 = Object.freeze([
  {
    "id": 17336,
    "date": "2026-06-30T13:22:40",
    "slug": "declaracion-de-accesibilidad",
    "link": "https://socdepoble.net/declaracion-de-accesibilidad/",
    "title": "Declaración de accesibilidad",
    "parent": 0,
    "estat_revisio": "pendent_admin",
    "rutaDestiCanonica": "/page/declaracion-de-accesibilidad",
    "casosUsDetectats": [
      "enllacos_interns_reescrits",
      "pagina_institucional"
    ]
  },
  {
    "id": 16585,
    "date": "2021-04-10T22:01:26",
    "slug": "la-gent",
    "link": "https://socdepoble.net/la-gent/",
    "title": "La Gent",
    "parent": 0,
    "estat_revisio": "pendent_admin",
    "rutaDestiCanonica": "/page/la-gent",
    "casosUsDetectats": [
      "enllacos_interns_reescrits",
      "pagina_institucional"
    ]
  },
  {
    "id": 16573,
    "date": "2021-04-07T01:48:49",
    "slug": "de-poble",
    "link": "https://socdepoble.net/de-poble/",
    "title": "De poble",
    "parent": 0,
    "estat_revisio": "pendent_admin",
    "rutaDestiCanonica": "/page/de-poble",
    "casosUsDetectats": [
      "enllacos_interns_reescrits",
      "pagina_institucional"
    ]
  },
  {
    "id": 13404,
    "date": "2021-01-29T17:25:21",
    "slug": "mur",
    "link": "https://socdepoble.net/mur/",
    "title": "Mur",
    "parent": 0,
    "estat_revisio": "pendent_admin",
    "rutaDestiCanonica": "/page/mur",
    "casosUsDetectats": [
      "enllacos_interns_reescrits",
      "pagina_institucional"
    ]
  },
  {
    "id": 8,
    "date": "2020-11-22T06:15:48",
    "slug": "el-meu-compte",
    "link": "https://socdepoble.net/el-meu-compte/",
    "title": "El meu compte",
    "parent": 0,
    "estat_revisio": "pendent_admin",
    "rutaDestiCanonica": "/page/el-meu-compte",
    "casosUsDetectats": [
      "enllacos_interns_reescrits",
      "pagina_institucional"
    ]
  },
  {
    "id": 7,
    "date": "2020-11-22T06:15:48",
    "slug": "finalitzar-comanda",
    "link": "https://socdepoble.net/finalitzar-comanda/",
    "title": "Finalitzar comanda",
    "parent": 0,
    "estat_revisio": "pendent_admin",
    "rutaDestiCanonica": "/page/finalitzar-comanda",
    "casosUsDetectats": [
      "enllacos_interns_reescrits",
      "pagina_institucional"
    ]
  },
  {
    "id": 6,
    "date": "2020-11-22T06:15:48",
    "slug": "cistella",
    "link": "https://socdepoble.net/cistella/",
    "title": "Cistella",
    "parent": 0,
    "estat_revisio": "pendent_admin",
    "rutaDestiCanonica": "/page/cistella",
    "casosUsDetectats": [
      "enllacos_interns_reescrits",
      "pagina_institucional"
    ]
  },
  {
    "id": 5,
    "date": "2020-11-22T06:15:48",
    "slug": "botiga",
    "link": "https://socdepoble.net/botiga/",
    "title": "Botiga",
    "parent": 0,
    "estat_revisio": "pendent_admin",
    "rutaDestiCanonica": "/page/botiga",
    "casosUsDetectats": [
      "enllacos_interns_reescrits",
      "pagina_institucional"
    ]
  },
  {
    "id": 3,
    "date": "2020-11-22T06:15:19",
    "slug": "privadesa-cookies-i-avis-legal",
    "link": "https://socdepoble.net/privadesa-cookies-i-avis-legal/",
    "title": "Política de Privadesa, Cookies i Avís legal",
    "parent": 0,
    "estat_revisio": "pendent_admin",
    "rutaDestiCanonica": "/page/privadesa-cookies-i-avis-legal",
    "casosUsDetectats": [
      "enllacos_interns_reescrits",
      "pagina_institucional"
    ]
  },
  {
    "id": 121,
    "date": "2013-08-30T13:01:01",
    "slug": "financem-soc-de-poble",
    "link": "https://socdepoble.net/col-labora-amb-el-projecte/financem-soc-de-poble/",
    "title": "Finançament del Projecte",
    "parent": 36,
    "estat_revisio": "pendent_admin",
    "rutaDestiCanonica": "/page/financem-soc-de-poble",
    "casosUsDetectats": [
      "enllacos_interns_reescrits",
      "pagina_institucional"
    ]
  },
  {
    "id": 94,
    "date": "2013-08-29T18:59:07",
    "slug": "recompenses-individuals",
    "link": "https://socdepoble.net/col-labora-amb-el-projecte/recompenses-individuals/",
    "title": "Recompenses Individuals",
    "parent": 36,
    "estat_revisio": "pendent_admin",
    "rutaDestiCanonica": "/page/recompenses-individuals",
    "casosUsDetectats": [
      "enllacos_interns_reescrits",
      "pagina_institucional"
    ]
  },
  {
    "id": 83,
    "date": "2013-08-29T18:54:08",
    "slug": "retorns-col-lectius",
    "link": "https://socdepoble.net/col-labora-amb-el-projecte/retorns-col-lectius/",
    "title": "Retorns Col·lectius",
    "parent": 36,
    "estat_revisio": "pendent_admin",
    "rutaDestiCanonica": "/page/retorns-col-lectius",
    "casosUsDetectats": [
      "enllacos_interns_reescrits",
      "pagina_institucional"
    ]
  },
  {
    "id": 74,
    "date": "2013-08-28T23:42:39",
    "slug": "viver-d-emprenedors-rurals",
    "link": "https://socdepoble.net/col-labora-amb-el-projecte/viver-d-emprenedors-rurals/",
    "title": "Viver d’Emprenedors Rurals",
    "parent": 36,
    "estat_revisio": "pendent_admin",
    "rutaDestiCanonica": "/page/viver-d-emprenedors-rurals",
    "casosUsDetectats": [
      "enllacos_interns_reescrits",
      "pagina_institucional"
    ]
  },
  {
    "id": 36,
    "date": "2013-08-24T15:46:32",
    "slug": "col-labora-amb-el-projecte",
    "link": "https://socdepoble.net/col-labora-amb-el-projecte/",
    "title": "Col·labora!",
    "parent": 0,
    "estat_revisio": "pendent_admin",
    "rutaDestiCanonica": "/page/col-labora-amb-el-projecte",
    "casosUsDetectats": [
      "enllacos_interns_reescrits",
      "pagina_institucional"
    ]
  },
  {
    "id": 29,
    "date": "2013-08-24T15:40:51",
    "slug": "qui-som-on-estem",
    "link": "https://socdepoble.net/col-labora-amb-el-projecte/qui-som-on-estem/",
    "title": "Qui som, on estem",
    "parent": 36,
    "estat_revisio": "pendent_admin",
    "rutaDestiCanonica": "/page/qui-som-on-estem",
    "casosUsDetectats": [
      "enllacos_interns_reescrits",
      "pagina_institucional"
    ]
  },
  {
    "id": 33,
    "date": "2013-08-24T15:40:04",
    "slug": "el-projecte",
    "link": "https://socdepoble.net/el-projecte/",
    "title": "El Projecte",
    "parent": 0,
    "estat_revisio": "pendent_admin",
    "rutaDestiCanonica": "/page/el-projecte",
    "casosUsDetectats": [
      "enllacos_interns_reescrits",
      "pagina_institucional"
    ]
  },
  {
    "id": 503,
    "date": "2010-05-19T00:19:15",
    "slug": "el-rentonar-natura-i-patrimoni",
    "link": "https://socdepoble.net/el-rentonar-natura-i-patrimoni/",
    "title": "El Rentonar. Natura i Patrimoni",
    "parent": 0,
    "estat_revisio": "pendent_admin",
    "rutaDestiCanonica": "/page/el-rentonar-natura-i-patrimoni",
    "casosUsDetectats": [
      "enllacos_interns_reescrits",
      "pagina_institucional"
    ]
  },
  {
    "id": 218,
    "date": "2010-05-09T15:07:29",
    "slug": "projecte-tic-rural",
    "link": "https://socdepoble.net/projecte-tic-rural/",
    "title": "Sóc de Poble. Projecte TIC Rural",
    "parent": 0,
    "estat_revisio": "pendent_admin",
    "rutaDestiCanonica": "/page/projecte-tic-rural",
    "casosUsDetectats": [
      "enllacos_interns_reescrits",
      "pagina_institucional"
    ]
  }
]);

export const CATEGORIES_DOCTORAL_MARES_6 = Object.freeze(
  FACETA_3_CATEGORIES_MARES_IA.map((cat) => cat.label)
);

export const ETIQUETES_DOCTORAL_SKOS_49 = Object.freeze(
  FACETA_4_ETIQUETES_SKOS
    .filter((tag) => !tag.isEmpty && !tag.isDeprecatedSynonym && Boolean(tag.activaPerDefecte))
    .map((tag) => tag.name)
);

export function estatInicialTaxonomiaAdmin() {
  const categoriesActives = Object.fromEntries(
    FACETA_3_CATEGORIES_MARES_IA.map((cat) => [cat.id, Boolean(cat.activaPerDefecte)])
  );
  const etiquetesActives = Object.fromEntries(
    FACETA_4_ETIQUETES_SKOS.map((tag) => [tag.slug, Boolean(tag.activaPerDefecte)])
  );
  return {
    categoriesActives,
    etiquetesActives,
    etiquetesBuidesPodades: true,
  };
}

export function llegeixEstatTaxonomiaAdmin(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  const base = estatInicialTaxonomiaAdmin();
  if (!storage) return base;
  try {
    const raw = storage.getItem(CLAU_STORAGE_TAXONOMIA_ADMIN);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    return {
      categoriesActives: { ...base.categoriesActives, ...(parsed?.categoriesActives || {}) },
      etiquetesActives: { ...base.etiquetesActives, ...(parsed?.etiquetesActives || {}) },
      etiquetesBuidesPodades: parsed?.etiquetesBuidesPodades !== undefined ? Boolean(parsed.etiquetesBuidesPodades) : true,
    };
  } catch {
    return base;
  }
}

export function desaEstatTaxonomiaAdmin(estat, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return;
  try {
    storage.setItem(CLAU_STORAGE_TAXONOMIA_ADMIN, JSON.stringify(estat));
  } catch {
    /* Ignora errors de quota en mode privat */
  }
}
