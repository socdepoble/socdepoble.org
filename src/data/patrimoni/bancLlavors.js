/** IDEA-112 (Onada R9, carril C5) · Banc de llavors: consulta de tres catàlegs publicats de varietats tradicionals.
 *
 * Totes les dades són literals de les fonts del disc (camí, SHA-256 i línies a cada fitxa). La procedència es
 * reproduïx amb la prova patrimoniR9.fonts.test.js, que les contrasta lletra a lletra amb els extractes de
 * tests/fixtures/patrimoni/ (i amb la font sencera quan és a ../_cultura_de_poble).
 * No és cap banc d'intercanvi: cap custodi, cap lot, cap formulari, cap registre. Les descripcions en prosa dels
 * catàlegs no es copien; el calendari de sembra és un gràfic a les fonts i no s'ha transcrit.
 * Rebutjos que no s'han de repetir: G9-03 (AVL no és l'Acadèmia), G9-04 (fitxes inventades), G9-05 (lots i custodis).
 */
const congela = (valor) => {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    for (const fill of Object.values(valor)) congela(fill);
    Object.freeze(valor);
  }
  return valor;
};

export const VERSIO_BANC_LLAVORS = '1.1.0';

/** Les tres fonts, amb l'atribució que diu el document mateix (línies citades a `cites`). */
export const FONTS_BANC_LLAVORS = congela([
 {
  "id": "cataleg-valencia",
  "titol": "Catàleg valencià de varietats tradicionals d’interés agrari",
  "autoria": "Pla de diversitat agrària valenciana",
  "ambit": "Terres valencianes",
  "document": "_cultura_de_poble/intercanvi_de_llavors_i_varietats_tradicionals/corpus_text/03_Cataleg_Valencia_Varietats_Tradicionals_Interes_Agrari.md",
  "sha256": "8fbc0537689b381a7777ad23492eea4741e9a86871234c794020e91037debfc2",
  "pagines": 49,
  "cites": {
   "titol": [
    3,
    8
   ],
   "ambit": [
    25,
    25
   ],
   "marc": [
    29,
    30
   ],
   "cataleg": [
    43,
    44
   ],
   "llavors": [
    63,
    66
   ]
  },
  "nota": "El catàleg es presenta com una eina del Pla de diversitat agrària valenciana. Segons el mateix text, les llavors estan a disposició dels productors i productores que les sol·liciten a les estacions experimentals agràries d’Elx, Vila-real i Carcaixent.",
  "discrepancies": [
   "L’índex de la pàgina 3 del PDF escriu quatre noms d’una altra manera que la fitxa: es mostren tots dos."
  ]
 },
 {
  "id": "avl-mallorca",
  "titol": "Catàleg de llavors 2020",
  "autoria": "Associació de Varietats Locals (AVL), de Mallorca",
  "ambit": "Mallorca",
  "document": "_cultura_de_poble/intercanvi_de_llavors_i_varietats_tradicionals/corpus_text/01_AVL_Cataleg_de_Llavors_2020.md",
  "sha256": "77e2002fb982d31f37d08793c6e3658d7a94f3d122c8543b5cf6130c6b6c0bef",
  "pagines": 32,
  "web": "https://www.varietatslocals.org",
  "cites": {
   "titol": [
    5,
    6
   ],
   "autoria": [
    19,
    22
   ],
   "web": [
    30,
    30
   ],
   "capcaleraCorpus": [
    1,
    1
   ]
  },
  "nota": "AVL vol dir ací Associació de Varietats Locals, una entitat de Mallorca: no és l’Acadèmia Valenciana de la Llengua.",
  "discrepancies": [
   "L’encapçalament del fitxer de corpus (línia 1) l’atribuïx a l’«Acadèmia Valenciana de la Llengua»; la pàgina 3 del PDF del catàleg diu «L’Associació de Varietats Locals (AVL en endavant)», de Mallorca. Mana el document."
  ]
 },
 {
  "id": "atles-catalunya",
  "titol": "Atles de les varietats hortícoles locals catalanes · Catàleg de varietats locals d’interès agrari de Catalunya",
  "autoria": "Fundació Miquel Agustí",
  "ambit": "Catalunya",
  "document": "_cultura_de_poble/intercanvi_de_llavors_i_varietats_tradicionals/corpus_text/02_Atles_Varietats_Agricoles_PPP.md",
  "sha256": "00096126ab51d2ad225cf33a52128530c06eb8521bcf1e4ba204f5f3e805b124",
  "pagines": 70,
  "pdf": {
   "document": "_cultura_de_poble/intercanvi_de_llavors_i_varietats_tradicionals/02_Atles_Varietats_Agricoles_PPP.pdf",
   "sha256": "ac68b36d4b41ca6b4f1bf6926f747958c04d88c7fd4dc6e238f05cf88d8e3964"
  },
  "cites": {
   "titol": [
    5,
    6
   ],
   "autoria": [
    60,
    63
   ],
   "capcaleraCorpus": [
    1,
    1
   ]
  },
  "nota": "És la «Primera proposta» de l’Atles. El corpus de text només conté 15 fitxes d’espècie (de la pàgina 14 a la 65 del PDF), no l’atles sencer.",
  "discrepancies": [
   "L’encapçalament del fitxer de corpus (línia 1) l’anomena «Atles de les Varietats Locals i Patrimoni Agrícola»; el document es titula «Atles de les varietats hortícoles locals catalanes»."
  ]
 }
]);

/** Catàleg valencià: les 45 fitxes (pàgines 4 a 48). `camps` = el bloc «Informació tècnica», línia lògica a línia lògica. */
export const VARIETATS_CATALEG_VALENCIA = congela([
 {
  "id": "cv-04-alberginia-blanca",
  "pagina": 4,
  "nom": "Albergínia blanca",
  "nomCientific": "Solanum melongena L.",
  "familia": "Solanàcies",
  "camps": [
   {
    "clau": "Forma del fruit",
    "valor": "ovoide",
    "linies": [
     168,
     168
    ]
   },
   {
    "clau": "Color exterior",
    "valor": "blanc lletós mat",
    "linies": [
     169,
     169
    ]
   },
   {
    "clau": "Color de la carn",
    "valor": "blanca",
    "linies": [
     170,
     170
    ]
   },
   {
    "clau": "Longitud relativa del calze",
    "valor": "curta",
    "linies": [
     171,
     171
    ]
   },
   {
    "clau": "Espines al calze",
    "valor": "poques",
    "linies": [
     172,
     172
    ]
   },
   {
    "clau": "Uniformitat de calibre",
    "valor": "bona",
    "linies": [
     173,
     173
    ]
   },
   {
    "clau": "Pes",
    "valor": "230 – 415 g",
    "linies": [
     174,
     174
    ]
   },
   {
    "clau": "Longitud",
    "valor": "9 – 12 cm",
    "linies": [
     175,
     175
    ]
   },
   {
    "clau": "Amplària",
    "valor": "7,5 – 9,5 cm",
    "linies": [
     176,
     176
    ]
   }
  ],
  "linies": {
   "nom": [
    177,
    178
   ],
   "cientific": [
    179,
    179
   ],
   "familia": 180
  }
 },
 {
  "id": "cv-05-alberginia-llistada-de-gandia",
  "pagina": 5,
  "nom": "Albergínia llistada de Gandia",
  "nomCientific": "Solanum melongena L.",
  "familia": "Solanàcies",
  "camps": [
   {
    "clau": "Forma del fruit",
    "valor": "obovat",
    "linies": [
     214,
     214
    ]
   },
   {
    "clau": "Color del fruit",
    "valor": "porpra amb ratlles blanques",
    "linies": [
     215,
     216
    ]
   },
   {
    "clau": "Color de la carn",
    "valor": "blanca",
    "linies": [
     217,
     217
    ]
   },
   {
    "clau": "Longitud relativa del calze",
    "valor": "curt",
    "linies": [
     218,
     218
    ]
   },
   {
    "clau": "Espines al calze",
    "valor": "abundants",
    "linies": [
     219,
     219
    ]
   },
   {
    "clau": "Uniformitat de calibre",
    "valor": "bona",
    "linies": [
     220,
     220
    ]
   },
   {
    "clau": "Pes",
    "valor": "250 – 350 g",
    "linies": [
     221,
     221
    ]
   },
   {
    "clau": "Longitud",
    "valor": "15 – 20 cm",
    "linies": [
     222,
     222
    ]
   },
   {
    "clau": "Amplària",
    "valor": "7 – 8,5 cm",
    "linies": [
     223,
     223
    ]
   }
  ],
  "linies": {
   "nom": [
    224,
    226
   ],
   "cientific": [
    227,
    227
   ],
   "familia": 228
  }
 },
 {
  "id": "cv-06-alberginia-roja-de-gandia",
  "pagina": 6,
  "nom": "Albergínia roja de Gandia",
  "nomCientific": "Solanum melongena L.",
  "familia": "Solanàcies",
  "camps": [
   {
    "clau": "Forma del fruit",
    "valor": "allargat amb curvatura",
    "linies": [
     264,
     265
    ]
   },
   {
    "clau": "Color exterior del fruit",
    "valor": "roig moradenc",
    "linies": [
     266,
     266
    ]
   },
   {
    "clau": "Color de la carn",
    "valor": "blanca",
    "linies": [
     267,
     267
    ]
   },
   {
    "clau": "Longitud relativa del calze",
    "valor": "intermitja",
    "linies": [
     268,
     268
    ]
   },
   {
    "clau": "Espines al calze",
    "valor": "poques",
    "linies": [
     269,
     269
    ]
   },
   {
    "clau": "Uniformitat de calibre",
    "valor": "bona",
    "linies": [
     270,
     270
    ]
   },
   {
    "clau": "Pes",
    "valor": "170 – 250 g",
    "linies": [
     271,
     271
    ]
   },
   {
    "clau": "Longitud",
    "valor": "20 – 25 cm",
    "linies": [
     272,
     272
    ]
   },
   {
    "clau": "Amplària",
    "valor": "4,5 – 5,5 cm",
    "linies": [
     273,
     273
    ]
   }
  ],
  "linies": {
   "nom": [
    274,
    276
   ],
   "cientific": [
    277,
    277
   ],
   "familia": 278
  }
 },
 {
  "id": "cv-07-pimento-del-cuerno",
  "pagina": 7,
  "nom": "Pimentó “del cuerno”",
  "nomCientific": "Capsicum annuum L.",
  "familia": "Solanàcies",
  "camps": [
   {
    "clau": "Alçària de la planta",
    "valor": "mitjana (65 – 75 cm)",
    "linies": [
     314,
     315
    ]
   },
   {
    "clau": "Forma del fruit",
    "valor": "forma de banya",
    "linies": [
     316,
     316
    ]
   },
   {
    "clau": "Color del fruit abans la maduresa",
    "valor": "verd",
    "linies": [
     317,
     319
    ]
   },
   {
    "clau": "Color del fruit madur",
    "valor": "roig",
    "linies": [
     320,
     320
    ]
   },
   {
    "clau": "Forma secció transversal",
    "valor": "triangular",
    "linies": [
     321,
     321
    ]
   },
   {
    "clau": "Nombre de lòculs",
    "valor": "predominantment 3",
    "linies": [
     322,
     323
    ]
   },
   {
    "clau": "Pes del fruit",
    "valor": "80 – 120 g",
    "linies": [
     324,
     324
    ]
   },
   {
    "clau": "Longitud del fruit",
    "valor": "13 – 16,5 cm",
    "linies": [
     325,
     325
    ]
   },
   {
    "clau": "Amplària del fruit",
    "valor": "5 – 5,5 cm",
    "linies": [
     326,
     326
    ]
   },
   {
    "clau": "Gruix de la carn",
    "valor": "4 – 5,5 mm",
    "linies": [
     327,
     327
    ]
   }
  ],
  "linies": {
   "nom": [
    328,
    329
   ],
   "cientific": [
    330,
    330
   ],
   "familia": 331
  }
 },
 {
  "id": "cv-08-pimento-quatre-morros",
  "pagina": 8,
  "nom": "Pimentó quatre morros",
  "nomCientific": "Capsicum annuum L.",
  "familia": "Solanàcies",
  "camps": [
   {
    "clau": "Alçària de la planta",
    "valor": "mitjana (50 – 85 cm)",
    "linies": [
     359,
     360
    ]
   },
   {
    "clau": "Forma del fruit",
    "valor": "rectangular",
    "linies": [
     361,
     361
    ]
   },
   {
    "clau": "Color del fruit abans la maduresa",
    "valor": "verd fosc",
    "linies": [
     362,
     364
    ]
   },
   {
    "clau": "Color del fruit madur",
    "valor": "roig fosc",
    "linies": [
     365,
     365
    ]
   },
   {
    "clau": "Forma secció transversal",
    "valor": "triangular/ quadrangular",
    "linies": [
     366,
     367
    ]
   },
   {
    "clau": "Nombre de lòculs",
    "valor": "igualment 3 i 4",
    "linies": [
     368,
     368
    ]
   },
   {
    "clau": "Pes del fruit",
    "valor": "180 – 250 g",
    "linies": [
     369,
     369
    ]
   },
   {
    "clau": "Longitud del fruit",
    "valor": "12 – 16 cm",
    "linies": [
     370,
     370
    ]
   },
   {
    "clau": "Amplària del fruit",
    "valor": "7 – 9 cm",
    "linies": [
     371,
     371
    ]
   },
   {
    "clau": "Gruix de la carn",
    "valor": "6 – 7,5 mm",
    "linies": [
     372,
     372
    ]
   }
  ],
  "linies": {
   "nom": [
    373,
    375
   ],
   "cientific": [
    376,
    376
   ],
   "familia": 377
  }
 },
 {
  "id": "cv-09-pimento-valencia",
  "pagina": 9,
  "nom": "Pimentó valencià",
  "nomCientific": "Capsicum annuum L.",
  "familia": "Solanàcies",
  "camps": [
   {
    "clau": "Alçària de la planta",
    "valor": "mitjana (50 – 85 cm)",
    "linies": [
     406,
     407
    ]
   },
   {
    "clau": "Forma del fruit",
    "valor": "trapezoïdal",
    "linies": [
     408,
     408
    ]
   },
   {
    "clau": "Color del fruit abans la maduresa",
    "valor": "verd",
    "linies": [
     409,
     411
    ]
   },
   {
    "clau": "Color del fruit madur",
    "valor": "roig",
    "linies": [
     412,
     412
    ]
   },
   {
    "clau": "Forma secció transversal",
    "valor": "triangular/irregular",
    "linies": [
     413,
     413
    ]
   },
   {
    "clau": "Nombre de lòculs",
    "valor": "3",
    "linies": [
     414,
     414
    ]
   },
   {
    "clau": "Pes del fruit",
    "valor": "150 – 220 g",
    "linies": [
     415,
     415
    ]
   },
   {
    "clau": "Longitud del fruit",
    "valor": "13 – 17 cm",
    "linies": [
     416,
     416
    ]
   },
   {
    "clau": "Amplària del fruit",
    "valor": "6 – 8 cm",
    "linies": [
     417,
     417
    ]
   },
   {
    "clau": "Gruix de la carn",
    "valor": "5,5 – 7 mm",
    "linies": [
     418,
     418
    ]
   }
  ],
  "linies": {
   "nom": [
    419,
    420
   ],
   "cientific": [
    421,
    421
   ],
   "familia": 422
  }
 },
 {
  "id": "cv-10-pimento-nyora",
  "pagina": 10,
  "nom": "Pimentó nyora",
  "nomCientific": "Capsicum annuum L.",
  "familia": "Solanàcies",
  "camps": [
   {
    "clau": "Alçària de la planta",
    "valor": "mitjana (65 – 75 cm)",
    "linies": [
     459,
     460
    ]
   },
   {
    "clau": "Forma del fruit",
    "valor": "aplanada",
    "linies": [
     461,
     461
    ]
   },
   {
    "clau": "Color del fruit abans la maduresa",
    "valor": "verd",
    "linies": [
     462,
     464
    ]
   },
   {
    "clau": "Color del fruit madur",
    "valor": "roig",
    "linies": [
     465,
     465
    ]
   },
   {
    "clau": "Forma secció transversal",
    "valor": "arredonida",
    "linies": [
     466,
     466
    ]
   },
   {
    "clau": "Nombre de lòculs",
    "valor": "igualment 3 i 4",
    "linies": [
     467,
     467
    ]
   },
   {
    "clau": "Pes del fruit",
    "valor": "35 – 45 g",
    "linies": [
     468,
     468
    ]
   },
   {
    "clau": "Longitud del fruit",
    "valor": "3,2 – 3,6 cm",
    "linies": [
     469,
     469
    ]
   },
   {
    "clau": "Amplària del fruit",
    "valor": "5 – 6 cm",
    "linies": [
     470,
     470
    ]
   },
   {
    "clau": "Gruix de la carn",
    "valor": "4 – 5 mm",
    "linies": [
     471,
     471
    ]
   }
  ],
  "linies": {
   "nom": [
    472,
    473
   ],
   "cientific": [
    474,
    474
   ],
   "familia": 475
  }
 },
 {
  "id": "cv-11-tomaca-mutxamel",
  "pagina": 11,
  "nom": "Tomaca mutxamel",
  "nomCientific": "Lycopersicon esculentum Mill.",
  "familia": null,
  "camps": [
   {
    "clau": "Forma predominant del fruit",
    "valor": "lleugerament aplanat",
    "linies": [
     505,
     508
    ]
   },
   {
    "clau": "Pes mitjà del fruit",
    "valor": "180 – 275 g",
    "linies": [
     509,
     509
    ]
   },
   {
    "clau": "Homogeneïtat del fruit",
    "valor": "alta",
    "linies": [
     510,
     510
    ]
   },
   {
    "clau": "Color exterior del fruit",
    "valor": "roig",
    "linies": [
     511,
     511
    ]
   },
   {
    "clau": "Muscles verds",
    "valor": "presents i forts",
    "linies": [
     512,
     512
    ]
   },
   {
    "clau": "Clevillat",
    "valor": "lleuger",
    "linies": [
     513,
     513
    ]
   },
   {
    "clau": "Seqüència de quallat",
    "valor": "molt bona",
    "linies": [
     514,
     514
    ]
   },
   {
    "clau": "Nivell de productivitat",
    "valor": "molt alt",
    "linies": [
     515,
     515
    ]
   }
  ],
  "linies": {
   "nom": [
    516,
    517
   ],
   "cientific": [
    518,
    519
   ],
   "familia": null
  }
 },
 {
  "id": "cv-12-tomaca-del-pebre",
  "pagina": 12,
  "nom": "Tomaca del pebre",
  "nomCientific": "Lycopersicon esculentum Mill.",
  "familia": null,
  "camps": [
   {
    "clau": "Forma predominant del fruit",
    "valor": "cilíndric allargat",
    "linies": [
     554,
     556
    ]
   },
   {
    "clau": "Pes mitjà del fruit",
    "valor": "175 – 250 g",
    "linies": [
     557,
     557
    ]
   },
   {
    "clau": "Homogeneïtat del fruit",
    "valor": "alta",
    "linies": [
     558,
     558
    ]
   },
   {
    "clau": "Color exterior del fruit",
    "valor": "roig",
    "linies": [
     559,
     559
    ]
   },
   {
    "clau": "Muscles verds",
    "valor": "presents i mitjans",
    "linies": [
     560,
     560
    ]
   },
   {
    "clau": "Clevillat",
    "valor": "intens",
    "linies": [
     561,
     561
    ]
   },
   {
    "clau": "Seqüència de quallat",
    "valor": "regular",
    "linies": [
     562,
     562
    ]
   },
   {
    "clau": "Nivell de productivitat",
    "valor": "baix",
    "linies": [
     563,
     563
    ]
   }
  ],
  "linies": {
   "nom": [
    564,
    565
   ],
   "cientific": [
    566,
    567
   ],
   "familia": null
  }
 },
 {
  "id": "cv-13-tomaca-de-pera",
  "pagina": 13,
  "nom": "Tomaca de pera",
  "nomCientific": "Lycopersicon esculentum Mill.",
  "familia": null,
  "camps": [
   {
    "clau": "Forma predominant del fruit",
    "valor": "el·lipsoide",
    "linies": [
     599,
     601
    ]
   },
   {
    "clau": "Pes mitjà del fruit",
    "valor": "80 – 100 g",
    "linies": [
     602,
     602
    ]
   },
   {
    "clau": "Homogeneïtat del fruit",
    "valor": "molt alta",
    "linies": [
     603,
     603
    ]
   },
   {
    "clau": "Color exterior del fruit",
    "valor": "roig",
    "linies": [
     604,
     604
    ]
   },
   {
    "clau": "Muscles verds",
    "valor": "absents",
    "linies": [
     605,
     605
    ]
   },
   {
    "clau": "Clevillat",
    "valor": "absent",
    "linies": [
     606,
     606
    ]
   },
   {
    "clau": "Seqüència de quallat",
    "valor": "molt bona",
    "linies": [
     607,
     607
    ]
   },
   {
    "clau": "Nivell de productivitat",
    "valor": "molt alt",
    "linies": [
     608,
     608
    ]
   }
  ],
  "linies": {
   "nom": [
    609,
    610
   ],
   "cientific": [
    611,
    612
   ],
   "familia": null
  }
 },
 {
  "id": "cv-14-tomaca-quarantena",
  "pagina": 14,
  "nom": "Tomaca quarantena",
  "nomCientific": "Lycopersicon esculentum Mill.",
  "familia": null,
  "camps": [
   {
    "clau": "Forma predominant del fruit",
    "valor": "aplanat",
    "linies": [
     643,
     645
    ]
   },
   {
    "clau": "Pes mitjà del fruit",
    "valor": "180 – 220 g",
    "linies": [
     646,
     646
    ]
   },
   {
    "clau": "Homogeneïtat del fruit",
    "valor": "alta",
    "linies": [
     647,
     647
    ]
   },
   {
    "clau": "Color exterior del fruit",
    "valor": "roig ataronjat",
    "linies": [
     648,
     648
    ]
   },
   {
    "clau": "Muscles verds",
    "valor": "presents lleugerament",
    "linies": [
     649,
     650
    ]
   },
   {
    "clau": "Clevillat",
    "valor": "absent",
    "linies": [
     651,
     651
    ]
   },
   {
    "clau": "Seqüència de quallat",
    "valor": "molt bona",
    "linies": [
     652,
     652
    ]
   },
   {
    "clau": "Nivell de productivitat",
    "valor": "alt",
    "linies": [
     653,
     653
    ]
   }
  ],
  "linies": {
   "nom": [
    654,
    655
   ],
   "cientific": [
    656,
    657
   ],
   "familia": null
  },
  "nomIndex": {
   "text": "Tomaca quarentena",
   "linia": 97
  }
 },
 {
  "id": "cv-15-tomaca-rosada-d-altea",
  "pagina": 15,
  "nom": "Tomaca rosada d’Altea",
  "nomCientific": "Lycopersicon esculentum Mill.",
  "familia": null,
  "camps": [
   {
    "clau": "Forma predominant del fruit",
    "valor": "lleugerament aplanat",
    "linies": [
     684,
     687
    ]
   },
   {
    "clau": "Pes mitjà del fruit",
    "valor": "350 – 550 g",
    "linies": [
     688,
     688
    ]
   },
   {
    "clau": "Homogeneïtat del fruit",
    "valor": "mitjana",
    "linies": [
     689,
     689
    ]
   },
   {
    "clau": "Color exterior del fruit",
    "valor": "rosa",
    "linies": [
     690,
     690
    ]
   },
   {
    "clau": "Muscles verds",
    "valor": "presents",
    "linies": [
     691,
     691
    ]
   },
   {
    "clau": "Clevillat",
    "valor": "lleuger",
    "linies": [
     692,
     692
    ]
   },
   {
    "clau": "Seqüència de quallat",
    "valor": "alta",
    "linies": [
     693,
     693
    ]
   },
   {
    "clau": "Nivell de productivitat",
    "valor": "alt",
    "linies": [
     694,
     694
    ]
   }
  ],
  "linies": {
   "nom": [
    695,
    697
   ],
   "cientific": [
    698,
    699
   ],
   "familia": null
  }
 },
 {
  "id": "cv-16-tomaca-valenciana-blanca",
  "pagina": 16,
  "nom": "Tomaca valenciana blanca",
  "nomCientific": "Lycopersicon esculentum Mill.",
  "familia": null,
  "camps": [
   {
    "clau": "Forma predominant del fruit",
    "valor": "cor apuntat moderat",
    "linies": [
     733,
     736
    ]
   },
   {
    "clau": "Pes mitjà del fruit",
    "valor": "200 – 350 g",
    "linies": [
     737,
     737
    ]
   },
   {
    "clau": "Homogeneïtat del fruit",
    "valor": "baixa",
    "linies": [
     738,
     738
    ]
   },
   {
    "clau": "Color exterior del fruit",
    "valor": "roig",
    "linies": [
     739,
     739
    ]
   },
   {
    "clau": "Muscles verds",
    "valor": "presents i mitjans",
    "linies": [
     740,
     740
    ]
   },
   {
    "clau": "Clevillat",
    "valor": "lleuger",
    "linies": [
     741,
     741
    ]
   },
   {
    "clau": "Seqüència de quallat",
    "valor": "mitjana",
    "linies": [
     742,
     742
    ]
   },
   {
    "clau": "Nivell de productivitat",
    "valor": "mitjà",
    "linies": [
     743,
     743
    ]
   }
  ],
  "linies": {
   "nom": [
    744,
    746
   ],
   "cientific": [
    747,
    748
   ],
   "familia": null
  }
 },
 {
  "id": "cv-17-tomaca-valenciana-masclet",
  "pagina": 17,
  "nom": "Tomaca valenciana masclet",
  "nomCientific": "Lycopersicon esculentum Mill.",
  "familia": null,
  "camps": [
   {
    "clau": "Forma predominant del fruit",
    "valor": "cor apuntat",
    "linies": [
     780,
     782
    ]
   },
   {
    "clau": "Pes mitjà del fruit",
    "valor": "150 – 350 g",
    "linies": [
     783,
     783
    ]
   },
   {
    "clau": "Homogeneïtat del fruit",
    "valor": "mitjana",
    "linies": [
     784,
     784
    ]
   },
   {
    "clau": "Color exterior del fruit",
    "valor": "roig",
    "linies": [
     785,
     785
    ]
   },
   {
    "clau": "Muscles verds",
    "valor": "presents i forts",
    "linies": [
     786,
     786
    ]
   },
   {
    "clau": "Clevillat",
    "valor": "lleuger",
    "linies": [
     787,
     787
    ]
   },
   {
    "clau": "Seqüència de quallat",
    "valor": "bona",
    "linies": [
     788,
     788
    ]
   },
   {
    "clau": "Nivell de productivitat",
    "valor": "mitjà-alt",
    "linies": [
     789,
     789
    ]
   }
  ],
  "linies": {
   "nom": [
    790,
    792
   ],
   "cientific": [
    793,
    794
   ],
   "familia": null
  }
 },
 {
  "id": "cv-18-garrofo-pintat",
  "pagina": 18,
  "nom": "Garrofó pintat",
  "nomCientific": "Phaseolus lunatus L.",
  "familia": "Lleguminoses",
  "camps": [
   {
    "clau": "Alçària de la planta",
    "valor": "alta (> 2 m)",
    "linies": [
     829,
     829
    ]
   },
   {
    "clau": "Longitud de la baina",
    "valor": "14 – 18 cm",
    "linies": [
     830,
     830
    ]
   },
   {
    "clau": "Grans per baina",
    "valor": "3 – 4",
    "linies": [
     831,
     831
    ]
   },
   {
    "clau": "Color del fesol",
    "valor": "Blanc cremós tacat en roig o morat",
    "linies": [
     832,
     834
    ]
   },
   {
    "clau": "Longitud del fesol",
    "valor": "24 – 28 cm",
    "linies": [
     835,
     835
    ]
   },
   {
    "clau": "Amplària del fesol",
    "valor": "17 – 18,5 mm",
    "linies": [
     836,
     836
    ]
   },
   {
    "clau": "Grossor del fesol",
    "valor": "5 – 6 mm",
    "linies": [
     837,
     837
    ]
   },
   {
    "clau": "Pes de 100 grans",
    "valor": "~ 53 g",
    "linies": [
     838,
     838
    ]
   }
  ],
  "linies": {
   "nom": [
    839,
    840
   ],
   "cientific": [
    841,
    841
   ],
   "familia": 842
  }
 },
 {
  "id": "cv-19-bajoca-de-ferradura",
  "pagina": 19,
  "nom": "Bajoca de ferradura",
  "nomCientific": "Phaseolus vulgaris L.",
  "familia": "Lleguminoses",
  "camps": [
   {
    "clau": "Alçària de la planta",
    "valor": "mata alta (>130 cm)",
    "linies": [
     867,
     868
    ]
   },
   {
    "clau": "Color de la baina",
    "valor": "verd",
    "linies": [
     869,
     869
    ]
   },
   {
    "clau": "Presència de fil",
    "valor": "baixa",
    "linies": [
     870,
     870
    ]
   },
   {
    "clau": "Curvatura de la baina",
    "valor": "moderada",
    "linies": [
     871,
     871
    ]
   },
   {
    "clau": "Forma del fesol",
    "valor": "arrenyonat",
    "linies": [
     872,
     872
    ]
   },
   {
    "clau": "Color del fesol",
    "valor": "crema",
    "linies": [
     873,
     873
    ]
   },
   {
    "clau": "Grans per baina",
    "valor": "6 – 8",
    "linies": [
     874,
     874
    ]
   },
   {
    "clau": "Quallat en planta",
    "valor": "homogeni",
    "linies": [
     875,
     875
    ]
   },
   {
    "clau": "Pes de 100 grans",
    "valor": "~170 g",
    "linies": [
     876,
     876
    ]
   }
  ],
  "linies": {
   "nom": [
    877,
    878
   ],
   "cientific": [
    879,
    879
   ],
   "familia": 880
  }
 },
 {
  "id": "cv-20-bajoca-de-la-mantega",
  "pagina": 20,
  "nom": "Bajoca de la mantega",
  "nomCientific": "Phaseolus vulgaris L.",
  "familia": "Lleguminoses",
  "camps": [
   {
    "clau": "Alçària de la planta",
    "valor": "mata alta (>130 cm)",
    "linies": [
     909,
     910
    ]
   },
   {
    "clau": "Color de la baina",
    "valor": "groc pàl·lid",
    "linies": [
     911,
     911
    ]
   },
   {
    "clau": "Presència de fil",
    "valor": "baixa",
    "linies": [
     912,
     912
    ]
   },
   {
    "clau": "Curvatura de la baina",
    "valor": "moderada",
    "linies": [
     913,
     913
    ]
   },
   {
    "clau": "Forma del fesol",
    "valor": "arrenyonada",
    "linies": [
     914,
     914
    ]
   },
   {
    "clau": "Color del fesol",
    "valor": "marró",
    "linies": [
     915,
     915
    ]
   },
   {
    "clau": "Grans per baina",
    "valor": "5 – 7",
    "linies": [
     916,
     916
    ]
   },
   {
    "clau": "Quallat en planta",
    "valor": "homogeni",
    "linies": [
     917,
     917
    ]
   },
   {
    "clau": "Pes de 100 grans",
    "valor": "~150 g",
    "linies": [
     918,
     918
    ]
   }
  ],
  "linies": {
   "nom": [
    919,
    920
   ],
   "cientific": [
    921,
    921
   ],
   "familia": 922
  },
  "nomIndex": {
   "text": "Bajoca mantega",
   "linia": 104
  }
 },
 {
  "id": "cv-21-bajoca-roget",
  "pagina": 21,
  "nom": "Bajoca roget",
  "nomCientific": "Phaseolus vulgaris L.",
  "familia": "Lleguminoses",
  "camps": [
   {
    "clau": "Alçària de la planta",
    "valor": "mata alta (>130 cm)",
    "linies": [
     950,
     951
    ]
   },
   {
    "clau": "Color de la baina",
    "valor": "verd amb taques roges",
    "linies": [
     952,
     953
    ]
   },
   {
    "clau": "Presència de fil",
    "valor": "baixa",
    "linies": [
     954,
     954
    ]
   },
   {
    "clau": "Curvatura de la baina",
    "valor": "lleugerament corvada",
    "linies": [
     955,
     956
    ]
   },
   {
    "clau": "Forma del fesol",
    "valor": "arrenyonada",
    "linies": [
     957,
     957
    ]
   },
   {
    "clau": "Color del fesol",
    "valor": "marró amb taques fosques",
    "linies": [
     958,
     959
    ]
   },
   {
    "clau": "Grans per baina",
    "valor": "5 – 8",
    "linies": [
     960,
     960
    ]
   },
   {
    "clau": "Quallat en planta",
    "valor": "homogeni",
    "linies": [
     961,
     961
    ]
   },
   {
    "clau": "Pes de 100 grans",
    "valor": "~ 215 g",
    "linies": [
     962,
     962
    ]
   }
  ],
  "linies": {
   "nom": [
    963,
    964
   ],
   "cientific": [
    965,
    965
   ],
   "familia": 966
  }
 },
 {
  "id": "cv-22-bajoca-de-careta-curta",
  "pagina": 22,
  "nom": "Bajoca de careta curta",
  "nomCientific": "Vigna unguiculata (L.) Walp.",
  "familia": "Lleguminoses",
  "camps": [
   {
    "clau": "Alçària de la planta",
    "valor": "mata alta (>130 cm)",
    "linies": [
     1003,
     1004
    ]
   },
   {
    "clau": "Color de la baina",
    "valor": "verd fosc",
    "linies": [
     1005,
     1005
    ]
   },
   {
    "clau": "Presència de fil",
    "valor": "baixa",
    "linies": [
     1006,
     1006
    ]
   },
   {
    "clau": "Curvatura de la baina",
    "valor": "molt baixa",
    "linies": [
     1007,
     1007
    ]
   },
   {
    "clau": "Forma del fesol",
    "valor": "arrenyonada",
    "linies": [
     1008,
     1008
    ]
   },
   {
    "clau": "Color del fesol",
    "valor": "marró amb taca negra",
    "linies": [
     1009,
     1010
    ]
   },
   {
    "clau": "Grans per baina",
    "valor": "7 — 14",
    "linies": [
     1011,
     1011
    ]
   },
   {
    "clau": "Quallat en planta",
    "valor": "homogeni",
    "linies": [
     1012,
     1012
    ]
   },
   {
    "clau": "Pes de 100 llavors",
    "valor": "60 g",
    "linies": [
     1013,
     1013
    ]
   }
  ],
  "linies": {
   "nom": [
    1014,
    1016
   ],
   "cientific": [
    1017,
    1018
   ],
   "familia": 1019
  }
 },
 {
  "id": "cv-23-pesol-de-trencar",
  "pagina": 23,
  "nom": "Pésol de trencar",
  "nomCientific": "Pisum sativum L. subsp. sativum var. sativum",
  "familia": "Lleguminoses",
  "camps": [
   {
    "clau": "Alçària de la planta",
    "valor": "mig enrame (70 – 95 cm)",
    "linies": [
     1064,
     1065
    ]
   },
   {
    "clau": "Color de la flor",
    "valor": "blanca",
    "linies": [
     1066,
     1066
    ]
   },
   {
    "clau": "Flors per nus",
    "valor": "2",
    "linies": [
     1067,
     1067
    ]
   },
   {
    "clau": "Color de la baina",
    "valor": "verd fosc",
    "linies": [
     1068,
     1068
    ]
   },
   {
    "clau": "Longitud de la baina",
    "valor": "9 – 11 cm",
    "linies": [
     1069,
     1069
    ]
   },
   {
    "clau": "Amplària de la baina",
    "valor": "1,6 – 1,9 cm",
    "linies": [
     1070,
     1070
    ]
   },
   {
    "clau": "Forma del gra sec",
    "valor": "esfèric i llis",
    "linies": [
     1071,
     1071
    ]
   },
   {
    "clau": "Color del gra sec",
    "valor": "blanc i verd clar",
    "linies": [
     1072,
     1072
    ]
   },
   {
    "clau": "Grans per baina",
    "valor": "7 – 10",
    "linies": [
     1073,
     1073
    ]
   },
   {
    "clau": "Pes de 100 grans frescos",
    "valor": "45 g",
    "linies": [
     1074,
     1074
    ]
   },
   {
    "clau": "Cicle",
    "valor": "mitjà",
    "linies": [
     1075,
     1075
    ]
   }
  ],
  "linies": {
   "nom": [
    1052,
    1053
   ],
   "cientific": [
    1054,
    1056
   ],
   "familia": 1057
  }
 },
 {
  "id": "cv-24-pesol-fi",
  "pagina": 24,
  "nom": "Pésol fi",
  "nomCientific": "Pisum sativum L. subsp. sativum var. arvense (L.) Poir",
  "familia": "Lleguminoses",
  "camps": [
   {
    "clau": "Alçària de la planta",
    "valor": "mata alta (>130 cm)",
    "linies": [
     1109,
     1110
    ]
   },
   {
    "clau": "Color de la flor",
    "valor": "lila i blava",
    "linies": [
     1111,
     1111
    ]
   },
   {
    "clau": "Flors per nus",
    "valor": "2",
    "linies": [
     1112,
     1112
    ]
   },
   {
    "clau": "Color de la baina",
    "valor": "verd clar i brillant",
    "linies": [
     1113,
     1113
    ]
   },
   {
    "clau": "Longitud de la baina",
    "valor": "9 – 11 cm",
    "linies": [
     1114,
     1114
    ]
   },
   {
    "clau": "Amplària de la baina",
    "valor": "1,9 – 2,2 cm",
    "linies": [
     1115,
     1115
    ]
   },
   {
    "clau": "Forma del gra sec",
    "valor": "esfèric i llis",
    "linies": [
     1116,
     1116
    ]
   },
   {
    "clau": "Color del gra sec",
    "valor": "marró clar",
    "linies": [
     1117,
     1117
    ]
   },
   {
    "clau": "Cicle",
    "valor": "primerenc",
    "linies": [
     1118,
     1118
    ]
   }
  ],
  "linies": {
   "nom": [
    1119,
    1119
   ],
   "cientific": [
    1120,
    1122
   ],
   "familia": 1123
  }
 },
 {
  "id": "cv-25-fava-de-betera",
  "pagina": 25,
  "nom": "Fava de Bétera",
  "nomCientific": "Vicia faba L.",
  "familia": "Lleguminoses",
  "camps": [
   {
    "clau": "Alçària de la mata",
    "valor": "120 – 130 cm",
    "linies": [
     1165,
     1165
    ]
   },
   {
    "clau": "Alçària de les baines més baixes",
    "valor": "60 – 70 cm",
    "linies": [
     1166,
     1168
    ]
   },
   {
    "clau": "Color de la baina",
    "valor": "Verd clar brillant",
    "linies": [
     1169,
     1169
    ]
   },
   {
    "clau": "Longitud de la baina",
    "valor": "28 – 32 cm",
    "linies": [
     1170,
     1170
    ]
   },
   {
    "clau": "Grans per baina",
    "valor": "6 – 8",
    "linies": [
     1171,
     1171
    ]
   },
   {
    "clau": "Pes de 100 llavors seques",
    "valor": "~ 180 g",
    "linies": [
     1172,
     1172
    ]
   }
  ],
  "linies": {
   "nom": [
    1173,
    1174
   ],
   "cientific": [
    1175,
    1175
   ],
   "familia": 1176
  }
 },
 {
  "id": "cv-26-cacau-del-collaret",
  "pagina": 26,
  "nom": "Cacau del collaret",
  "nomCientific": "Arachis hypogaea L.",
  "familia": "Lleguminoses",
  "camps": [
   {
    "clau": "Port de la mata",
    "valor": "semierecte",
    "linies": [
     1217,
     1217
    ]
   },
   {
    "clau": "Rugositat de la superfície de la corfa",
    "valor": "mitjana",
    "linies": [
     1218,
     1220
    ]
   },
   {
    "clau": "Color de la corfa madura",
    "valor": "marró",
    "linies": [
     1221,
     1221
    ]
   },
   {
    "clau": "Longitud de la baina",
    "valor": "13 – 16 cm",
    "linies": [
     1222,
     1222
    ]
   },
   {
    "clau": "Grossor de la baina",
    "valor": "8,5 –10 cm",
    "linies": [
     1223,
     1223
    ]
   },
   {
    "clau": "Pes de la baina",
    "valor": "1,5 – 2 g",
    "linies": [
     1224,
     1224
    ]
   },
   {
    "clau": "Grans per baina",
    "valor": "2",
    "linies": [
     1225,
     1225
    ]
   },
   {
    "clau": "Forma del gra",
    "valor": "cilíndric",
    "linies": [
     1226,
     1226
    ]
   },
   {
    "clau": "Pes del gra",
    "valor": "0,6 – 0,8 g",
    "linies": [
     1227,
     1227
    ]
   },
   {
    "clau": "Percentatge de corfa",
    "valor": "50 – 65%",
    "linies": [
     1228,
     1228
    ]
   },
   {
    "clau": "Època de maduració",
    "valor": "mitjana",
    "linies": [
     1229,
     1229
    ]
   }
  ],
  "linies": {
   "nom": [
    1230,
    1231
   ],
   "cientific": [
    1232,
    1232
   ],
   "familia": 1233
  }
 },
 {
  "id": "cv-27-carabassa-xata-de-torrar",
  "pagina": 27,
  "nom": "Carabassa xata de torrar",
  "nomCientific": "Cucurbita maxima Duchesne",
  "familia": "Cucurbitàcies",
  "camps": [
   {
    "clau": "Forma del fruit",
    "valor": "el·líptic transversal ample",
    "linies": [
     1275,
     1276
    ]
   },
   {
    "clau": "Color principal de la pell",
    "valor": "gris",
    "linies": [
     1277,
     1277
    ]
   },
   {
    "clau": "Color secundari de la pell",
    "valor": "taronja",
    "linies": [
     1278,
     1278
    ]
   },
   {
    "clau": "Textura de la pell",
    "valor": "granulosa",
    "linies": [
     1279,
     1279
    ]
   },
   {
    "clau": "Costelles",
    "valor": "marcades",
    "linies": [
     1280,
     1280
    ]
   },
   {
    "clau": "Color de la polpa",
    "valor": "taronja",
    "linies": [
     1281,
     1281
    ]
   },
   {
    "clau": "Pes",
    "valor": "2 – 3,5 kg",
    "linies": [
     1282,
     1282
    ]
   },
   {
    "clau": "Longitud",
    "valor": "7 – 11 cm",
    "linies": [
     1283,
     1283
    ]
   },
   {
    "clau": "Diàmetre",
    "valor": "20 – 25 cm",
    "linies": [
     1284,
     1284
    ]
   },
   {
    "clau": "Gruix de la carn",
    "valor": "3,5 – 5 cm",
    "linies": [
     1285,
     1285
    ]
   },
   {
    "clau": "Homogeneïtat del fruit",
    "valor": "alta",
    "linies": [
     1286,
     1286
    ]
   }
  ],
  "linies": {
   "nom": [
    1287,
    1288
   ],
   "cientific": [
    1289,
    1290
   ],
   "familia": 1291
  }
 },
 {
  "id": "cv-28-carabassa-de-cacauet",
  "pagina": 28,
  "nom": "Carabassa de cacauet",
  "nomCientific": "Cucurbita moschata Duchesne",
  "familia": "Cucurbitàcies",
  "camps": [
   {
    "clau": "Forma del fruit",
    "valor": "forma de pera",
    "linies": [
     1325,
     1325
    ]
   },
   {
    "clau": "Color principal de la pell",
    "valor": "taronja",
    "linies": [
     1326,
     1326
    ]
   },
   {
    "clau": "Color secundari de la pell",
    "valor": "crema",
    "linies": [
     1327,
     1327
    ]
   },
   {
    "clau": "Textura de la pell",
    "valor": "llisa i suau",
    "linies": [
     1328,
     1328
    ]
   },
   {
    "clau": "Costelles",
    "valor": "molt lleugeres",
    "linies": [
     1329,
     1329
    ]
   },
   {
    "clau": "Color de la polpa",
    "valor": "taronja intens",
    "linies": [
     1330,
     1330
    ]
   },
   {
    "clau": "Pes",
    "valor": "600 – 900 g",
    "linies": [
     1331,
     1331
    ]
   },
   {
    "clau": "Longitud",
    "valor": "16 – 22 cm",
    "linies": [
     1332,
     1332
    ]
   },
   {
    "clau": "Diàmetre",
    "valor": "9 – 13 cm",
    "linies": [
     1333,
     1333
    ]
   },
   {
    "clau": "Gruix de la carn",
    "valor": "2 – 2,5 cm",
    "linies": [
     1334,
     1334
    ]
   },
   {
    "clau": "Homogeneïtat del fruit",
    "valor": "mitjana",
    "linies": [
     1335,
     1335
    ]
   }
  ],
  "linies": {
   "nom": [
    1336,
    1337
   ],
   "cientific": [
    1338,
    1340
   ],
   "familia": 1341
  },
  "nomIndex": {
   "text": "Carabassa de cacahuet",
   "linia": 113
  }
 },
 {
  "id": "cv-29-carabasseta-blanca",
  "pagina": 29,
  "nom": "Carabasseta blanca",
  "nomCientific": "Cucurbita pepo L.",
  "familia": "Cucurbitàcies",
  "camps": [
   {
    "clau": "Hàbit de creixement de la planta",
    "valor": "semicompacta",
    "linies": [
     1377,
     1379
    ]
   },
   {
    "clau": "Forma del fruit",
    "valor": "cilíndrica",
    "linies": [
     1380,
     1380
    ]
   },
   {
    "clau": "Color",
    "valor": "blanc i verd amb ratlles fosques",
    "linies": [
     1381,
     1382
    ]
   },
   {
    "clau": "Longitud",
    "valor": "15 – 25 cm",
    "linies": [
     1383,
     1383
    ]
   },
   {
    "clau": "Diàmetre",
    "valor": "4 – 7 cm",
    "linies": [
     1384,
     1384
    ]
   },
   {
    "clau": "Pes",
    "valor": "300 – 500 g",
    "linies": [
     1385,
     1385
    ]
   }
  ],
  "linies": {
   "nom": [
    1386,
    1387
   ],
   "cientific": [
    1388,
    1388
   ],
   "familia": 1389
  }
 },
 {
  "id": "cv-30-carabasseta-d-utiel",
  "pagina": 30,
  "nom": "Carabasseta d’Utiel",
  "nomCientific": "Cucurbita pepo L.",
  "familia": "Cucurbitàcies",
  "camps": [
   {
    "clau": "Hàbit de creixement de la planta",
    "valor": "reptant",
    "linies": [
     1420,
     1422
    ]
   },
   {
    "clau": "Forma del fruit",
    "valor": "maça",
    "linies": [
     1423,
     1423
    ]
   },
   {
    "clau": "Color",
    "valor": "verd clar blanquinós homogeni",
    "linies": [
     1424,
     1426
    ]
   },
   {
    "clau": "Longitud",
    "valor": "20 – 24 cm",
    "linies": [
     1427,
     1427
    ]
   },
   {
    "clau": "Diàmetre",
    "valor": "6 – 8 cm",
    "linies": [
     1428,
     1428
    ]
   },
   {
    "clau": "Pes",
    "valor": "400 – 650 cm",
    "linies": [
     1429,
     1429
    ]
   }
  ],
  "linies": {
   "nom": [
    1430,
    1431
   ],
   "cientific": [
    1432,
    1432
   ],
   "familia": 1433
  },
  "avisos": [
   "unitat-pes-cm"
  ]
 },
 {
  "id": "cv-31-cogombre-curt-de-vinagre",
  "pagina": 31,
  "nom": "Cogombre curt de vinagre",
  "nomCientific": "Cucumis sativus L.",
  "familia": "Cucurbitàcies",
  "camps": [
   {
    "clau": "Hàbit de creixement de la planta",
    "valor": "enfiladís",
    "linies": [
     1469,
     1471
    ]
   },
   {
    "clau": "Forma del fruit",
    "valor": "curt i ample",
    "linies": [
     1472,
     1472
    ]
   },
   {
    "clau": "Color de la pell",
    "valor": "verd mitjà",
    "linies": [
     1473,
     1473
    ]
   },
   {
    "clau": "Espines",
    "valor": "abundància mitjana i grans",
    "linies": [
     1474,
     1475
    ]
   },
   {
    "clau": "Textura de la pell",
    "valor": "berrugosa",
    "linies": [
     1476,
     1476
    ]
   },
   {
    "clau": "Puntejat de la pell",
    "valor": "alt",
    "linies": [
     1477,
     1477
    ]
   },
   {
    "clau": "Forma de la secció transversal",
    "valor": "angular",
    "linies": [
     1478,
     1480
    ]
   },
   {
    "clau": "Amargor del fruit",
    "valor": "absent",
    "linies": [
     1481,
     1481
    ]
   },
   {
    "clau": "Longitud",
    "valor": "15 – 17 cm",
    "linies": [
     1482,
     1482
    ]
   },
   {
    "clau": "Diàmetre",
    "valor": "4,5 – 6 cm",
    "linies": [
     1483,
     1483
    ]
   },
   {
    "clau": "Pes",
    "valor": "200 – 300 g",
    "linies": [
     1484,
     1484
    ]
   }
  ],
  "linies": {
   "nom": [
    1485,
    1487
   ],
   "cientific": [
    1488,
    1488
   ],
   "familia": 1489
  }
 },
 {
  "id": "cv-32-cogombre-de-la-nucia",
  "pagina": 32,
  "nom": "Cogombre de la Nucia",
  "nomCientific": "Cucumis sativus L.",
  "familia": "Cucurbitàcies",
  "camps": [
   {
    "clau": "Hàbit de creixement",
    "valor": "rastrer",
    "linies": [
     1521,
     1521
    ]
   },
   {
    "clau": "Forma del fruit",
    "valor": "curt i ample",
    "linies": [
     1522,
     1522
    ]
   },
   {
    "clau": "Color de la pell",
    "valor": "verd blanquinós",
    "linies": [
     1523,
     1523
    ]
   },
   {
    "clau": "Espines",
    "valor": "Abundància mitjana i grans",
    "linies": [
     1524,
     1525
    ]
   },
   {
    "clau": "Textura de la pell",
    "valor": "berrugosa",
    "linies": [
     1526,
     1526
    ]
   },
   {
    "clau": "Puntejat de la pell",
    "valor": "alt",
    "linies": [
     1527,
     1527
    ]
   },
   {
    "clau": "Forma de la secció transversal",
    "valor": "angular",
    "linies": [
     1528,
     1530
    ]
   },
   {
    "clau": "Amargor del fruit",
    "valor": "absent",
    "linies": [
     1531,
     1531
    ]
   },
   {
    "clau": "Longitud",
    "valor": "15 – 18 cm",
    "linies": [
     1532,
     1532
    ]
   },
   {
    "clau": "Diàmetre",
    "valor": "5 – 6 cm",
    "linies": [
     1533,
     1533
    ]
   },
   {
    "clau": "Pes",
    "valor": "200 – 300 g",
    "linies": [
     1534,
     1534
    ]
   }
  ],
  "linies": {
   "nom": [
    1535,
    1536
   ],
   "cientific": [
    1537,
    1537
   ],
   "familia": 1538
  }
 },
 {
  "id": "cv-33-melo-d-alger-pipa-roja",
  "pagina": 33,
  "nom": "Meló d’Alger pipa roja",
  "nomCientific": "Citrullus lanatus (Thunb.) Matsum. & Nakai",
  "familia": "Cucurbitàcies",
  "camps": [
   {
    "clau": "Lobulat de la fulla",
    "valor": "mitjà",
    "linies": [
     1573,
     1573
    ]
   },
   {
    "clau": "Forma del fruit",
    "valor": "circular",
    "linies": [
     1574,
     1574
    ]
   },
   {
    "clau": "Solcs",
    "valor": "presents",
    "linies": [
     1575,
     1575
    ]
   },
   {
    "clau": "Color de la polpa",
    "valor": "rosa intens",
    "linies": [
     1576,
     1576
    ]
   },
   {
    "clau": "Color exterior",
    "valor": "verd mitjà",
    "linies": [
     1577,
     1577
    ]
   },
   {
    "clau": "Ratlles",
    "valor": "estretes",
    "linies": [
     1578,
     1578
    ]
   },
   {
    "clau": "Diàmetre",
    "valor": "21 – 23 cm",
    "linies": [
     1579,
     1579
    ]
   },
   {
    "clau": "Pes",
    "valor": "5 – 6 kg",
    "linies": [
     1580,
     1580
    ]
   },
   {
    "clau": "Llavor",
    "valor": "roja i menuda",
    "linies": [
     1581,
     1581
    ]
   },
   {
    "clau": "Cicle",
    "valor": "90 dies",
    "linies": [
     1582,
     1582
    ]
   }
  ],
  "linies": {
   "nom": [
    1583,
    1584
   ],
   "cientific": [
    1585,
    1587
   ],
   "familia": 1588
  }
 },
 {
  "id": "cv-34-melo-d-alger-sang-de-bou",
  "pagina": 34,
  "nom": "Meló d’Alger sang de bou",
  "nomCientific": "Citrullus lanatus (Thunb.) Matsum. & Nakai",
  "familia": "Cucurbitàcies",
  "camps": [
   {
    "clau": "Lobulat de la fulla",
    "valor": "dèbil",
    "linies": [
     1619,
     1619
    ]
   },
   {
    "clau": "Forma del fruit",
    "valor": "el·líptica ampla",
    "linies": [
     1620,
     1620
    ]
   },
   {
    "clau": "Solcs",
    "valor": "presents en la zona apical",
    "linies": [
     1621,
     1622
    ]
   },
   {
    "clau": "Color de la polpa",
    "valor": "roig",
    "linies": [
     1623,
     1623
    ]
   },
   {
    "clau": "Color exterior",
    "valor": "verd fosc",
    "linies": [
     1624,
     1624
    ]
   },
   {
    "clau": "Ratlles",
    "valor": "estretes",
    "linies": [
     1625,
     1625
    ]
   },
   {
    "clau": "Diàmetre",
    "valor": "22 – 26 cm",
    "linies": [
     1626,
     1626
    ]
   },
   {
    "clau": "Pes",
    "valor": "5 – 7 kg",
    "linies": [
     1627,
     1627
    ]
   },
   {
    "clau": "Llavor",
    "valor": "negra",
    "linies": [
     1628,
     1628
    ]
   },
   {
    "clau": "Cicle",
    "valor": "70 dies",
    "linies": [
     1629,
     1629
    ]
   }
  ],
  "linies": {
   "nom": [
    1630,
    1631
   ],
   "cientific": [
    1632,
    1634
   ],
   "familia": 1635
  }
 },
 {
  "id": "cv-35-melona",
  "pagina": 35,
  "nom": "Melona",
  "nomCientific": "Citrullus lanatus (Thunb.) Matsum. & Nakai",
  "familia": "Cucurbitàcies",
  "camps": [
   {
    "clau": "Forma lobulada de la fulla",
    "valor": "forta",
    "linies": [
     1663,
     1663
    ]
   },
   {
    "clau": "Forma del fruit",
    "valor": "el·líptica estreta",
    "linies": [
     1664,
     1664
    ]
   },
   {
    "clau": "Solcs",
    "valor": "absents",
    "linies": [
     1665,
     1665
    ]
   },
   {
    "clau": "Color de la polpa",
    "valor": "roig",
    "linies": [
     1666,
     1666
    ]
   },
   {
    "clau": "Color exterior",
    "valor": "verd clar amb ratlles fosques",
    "linies": [
     1667,
     1668
    ]
   },
   {
    "clau": "Ratlles",
    "valor": "intermèdies",
    "linies": [
     1669,
     1669
    ]
   },
   {
    "clau": "Longitud",
    "valor": "36 – 40 cm",
    "linies": [
     1670,
     1670
    ]
   },
   {
    "clau": "Diàmetre",
    "valor": "18 – 21 cm",
    "linies": [
     1671,
     1671
    ]
   },
   {
    "clau": "Pes",
    "valor": "6 – 8 kg",
    "linies": [
     1672,
     1672
    ]
   },
   {
    "clau": "Llavor",
    "valor": "marró jaspiada i gran",
    "linies": [
     1673,
     1674
    ]
   },
   {
    "clau": "Cicle",
    "valor": "90 – 120 dies",
    "linies": [
     1675,
     1675
    ]
   }
  ],
  "linies": {
   "nom": [
    1676,
    1676
   ],
   "cientific": [
    1677,
    1679
   ],
   "familia": 1680
  }
 },
 {
  "id": "cv-36-melo-blanc-ratllat",
  "pagina": 36,
  "nom": "Meló blanc ratllat",
  "nomCientific": "Cucumis melo L.",
  "familia": "Cucurbitàcies",
  "camps": [
   {
    "clau": "Forma del meló",
    "valor": "el·líptic ample",
    "linies": [
     1709,
     1709
    ]
   },
   {
    "clau": "Diàmetre",
    "valor": "17 – 20 cm",
    "linies": [
     1710,
     1710
    ]
   },
   {
    "clau": "Longitud",
    "valor": "20 – 25 cm",
    "linies": [
     1711,
     1711
    ]
   },
   {
    "clau": "Pes",
    "valor": "3 – 4 kg",
    "linies": [
     1712,
     1712
    ]
   },
   {
    "clau": "Color predominant",
    "valor": "crema",
    "linies": [
     1713,
     1713
    ]
   },
   {
    "clau": "Color secundari",
    "valor": "verd fosc",
    "linies": [
     1714,
     1714
    ]
   },
   {
    "clau": "Patró del color secundari",
    "valor": "ratlles del peduncle a la base",
    "linies": [
     1715,
     1716
    ]
   },
   {
    "clau": "Color de la polpa",
    "valor": "blanc groguenc - ataronjat",
    "linies": [
     1717,
     1718
    ]
   },
   {
    "clau": "Solcs",
    "valor": "dèbils",
    "linies": [
     1719,
     1719
    ]
   },
   {
    "clau": "Conservació",
    "valor": "mitjana",
    "linies": [
     1720,
     1720
    ]
   },
   {
    "clau": "Temps de maduració",
    "valor": "70 – 90 dies",
    "linies": [
     1721,
     1721
    ]
   },
   {
    "clau": "Forma de la llavor",
    "valor": "plana",
    "linies": [
     1722,
     1722
    ]
   }
  ],
  "linies": {
   "nom": [
    1723,
    1724
   ],
   "cientific": [
    1725,
    1725
   ],
   "familia": 1726
  }
 },
 {
  "id": "cv-37-melo-tendral-negre",
  "pagina": 37,
  "nom": "Meló tendral negre",
  "nomCientific": "Cucumis melo L.",
  "familia": "Cucurbitàcies",
  "camps": [
   {
    "clau": "Forma del meló",
    "valor": "el·líptic estret",
    "linies": [
     1756,
     1756
    ]
   },
   {
    "clau": "Diàmetre",
    "valor": "13 – 17 cm",
    "linies": [
     1757,
     1757
    ]
   },
   {
    "clau": "Longitud",
    "valor": "20 – 25 cm",
    "linies": [
     1758,
     1758
    ]
   },
   {
    "clau": "Pes",
    "valor": "2 – 3 kg",
    "linies": [
     1759,
     1759
    ]
   },
   {
    "clau": "Color predominant",
    "valor": "ver fosc",
    "linies": [
     1760,
     1760
    ]
   },
   {
    "clau": "Color secundari",
    "valor": "negre verdós",
    "linies": [
     1761,
     1761
    ]
   },
   {
    "clau": "Patró del color secundari",
    "valor": "sense patró",
    "linies": [
     1762,
     1762
    ]
   },
   {
    "clau": "Color de la polpa",
    "valor": "blanc",
    "linies": [
     1763,
     1763
    ]
   },
   {
    "clau": "Solcs",
    "valor": "forts",
    "linies": [
     1764,
     1764
    ]
   },
   {
    "clau": "Conservació",
    "valor": "molt llarga",
    "linies": [
     1765,
     1765
    ]
   },
   {
    "clau": "Temps de maduració",
    "valor": "120 – 150 dies",
    "linies": [
     1766,
     1766
    ]
   },
   {
    "clau": "Forma de la llavor",
    "valor": "plana",
    "linies": [
     1767,
     1767
    ]
   }
  ],
  "linies": {
   "nom": [
    1768,
    1769
   ],
   "cientific": [
    1770,
    1770
   ],
   "familia": 1771
  }
 },
 {
  "id": "cv-38-safanoria-morada",
  "pagina": 38,
  "nom": "Safanòria morada",
  "nomCientific": "Daucus carota subsp. sativus (Hoffm.) Arcang.",
  "familia": "Umbel.líferes",
  "camps": [
   {
    "clau": "Color exterior",
    "valor": "morat",
    "linies": [
     1808,
     1808
    ]
   },
   {
    "clau": "Color interior",
    "valor": "blanc",
    "linies": [
     1809,
     1809
    ]
   },
   {
    "clau": "Longitud",
    "valor": "13 – 15 cm",
    "linies": [
     1810,
     1810
    ]
   },
   {
    "clau": "Grossor",
    "valor": "2,5 – 3,5 cm",
    "linies": [
     1811,
     1811
    ]
   },
   {
    "clau": "Pes",
    "valor": "60 – 100 g",
    "linies": [
     1812,
     1812
    ]
   },
   {
    "clau": "Forma",
    "valor": "triangular estreta",
    "linies": [
     1813,
     1813
    ]
   },
   {
    "clau": "Cicle",
    "valor": "llarg (90 – 120 dies)",
    "linies": [
     1814,
     1815
    ]
   }
  ],
  "linies": {
   "nom": [
    1816,
    1817
   ],
   "cientific": [
    1818,
    1820
   ],
   "familia": 1821
  }
 },
 {
  "id": "cv-39-col-de-xativa",
  "pagina": 39,
  "nom": "Col de Xàtiva",
  "nomCientific": "Brassica oleracea var. capitata L.",
  "familia": "Crucíferes",
  "camps": [
   {
    "clau": "Abollonat de la fulla",
    "valor": "dèbil",
    "linies": [
     1861,
     1861
    ]
   },
   {
    "clau": "Diàmetre de la planta",
    "valor": "85 – 105 cm",
    "linies": [
     1862,
     1862
    ]
   },
   {
    "clau": "Diàmetre del cabdell",
    "valor": "30 – 40 cm",
    "linies": [
     1863,
     1863
    ]
   },
   {
    "clau": "Longitud del cabdell",
    "valor": "22 – 26 cm",
    "linies": [
     1864,
     1864
    ]
   },
   {
    "clau": null,
    "valor": "Pes del cabdell 3 – 5,5 kg",
    "linies": [
     1865,
     1865
    ]
   },
   {
    "clau": "Densitat del cabdell",
    "valor": "laxa",
    "linies": [
     1866,
     1866
    ]
   },
   {
    "clau": "Cobertura del cabdell",
    "valor": "ben cobert",
    "linies": [
     1867,
     1867
    ]
   },
   {
    "clau": "Forma del cabdell",
    "valor": "el·líptic transversal",
    "linies": [
     1868,
     1868
    ]
   }
  ],
  "linies": {
   "nom": [
    1869,
    1870
   ],
   "cientific": [
    1871,
    1872
   ],
   "familia": 1873
  }
 },
 {
  "id": "cv-40-rave-roig",
  "pagina": 40,
  "nom": "Rave roig",
  "nomCientific": "Raphanus sativus L.",
  "familia": "Crucíferes",
  "camps": [
   {
    "clau": "Forma de l’arrel",
    "valor": "triangular",
    "linies": [
     1911,
     1911
    ]
   },
   {
    "clau": "Color de l’arrel",
    "valor": "roig fosc",
    "linies": [
     1912,
     1912
    ]
   },
   {
    "clau": "Longitud de l’arrel",
    "valor": "15 – 18 cm",
    "linies": [
     1913,
     1913
    ]
   },
   {
    "clau": "Diàmetre de l’arrel",
    "valor": "3,2 – 3,6 cm",
    "linies": [
     1914,
     1914
    ]
   },
   {
    "clau": "Pes de l’arrel",
    "valor": "80 – 120 g",
    "linies": [
     1915,
     1915
    ]
   }
  ],
  "linies": {
   "nom": [
    1916,
    1917
   ],
   "cientific": [
    1918,
    1918
   ],
   "familia": 1919
  }
 },
 {
  "id": "cv-41-ceba-bavosa",
  "pagina": 41,
  "nom": "Ceba bavosa",
  "nomCientific": "Allium cepa L.",
  "familia": "Liliàcies",
  "camps": [
   {
    "clau": "Diàmetre de la ceba",
    "valor": "7,5 – 8,5 cm",
    "linies": [
     1950,
     1950
    ]
   },
   {
    "clau": "Forma de l’àpex de la ceba",
    "valor": "lleugerament prominent",
    "linies": [
     1951,
     1954
    ]
   },
   {
    "clau": "Alçària de la ceba",
    "valor": "mitjana (7 – 8 cm)",
    "linies": [
     1955,
     1955
    ]
   },
   {
    "clau": "Forma de la ceba",
    "valor": "esfèrica (bavosa) i esfèrica - punta (monquelina)",
    "linies": [
     1956,
     1958
    ]
   },
   {
    "clau": "Color de la pell",
    "valor": "groc - marró clar",
    "linies": [
     1959,
     1959
    ]
   },
   {
    "clau": "Color de la polpa",
    "valor": "verd - blanc",
    "linies": [
     1960,
     1960
    ]
   },
   {
    "clau": "Grossària de la pell",
    "valor": "fina",
    "linies": [
     1961,
     1961
    ]
   },
   {
    "clau": "Pes",
    "valor": "mitjà (~260 g)",
    "linies": [
     1962,
     1962
    ]
   },
   {
    "clau": "Cicle",
    "valor": "primerenc",
    "linies": [
     1963,
     1963
    ]
   }
  ],
  "linies": {
   "nom": [
    1964,
    1965
   ],
   "cientific": [
    1966,
    1966
   ],
   "familia": 1967
  }
 },
 {
  "id": "cv-42-ceba-de-mig-gra",
  "pagina": 42,
  "nom": "Ceba de mig gra",
  "nomCientific": "Allium cepa L.",
  "familia": "Liliàcies",
  "camps": [
   {
    "clau": "Diàmetre de la ceba",
    "valor": "7,5 cm",
    "linies": [
     1998,
     1998
    ]
   },
   {
    "clau": "Forma de l’àpex de la ceba",
    "valor": "arredonit",
    "linies": [
     1999,
     2001
    ]
   },
   {
    "clau": "Alçària de la ceba",
    "valor": "mitjana (7 – 8 cm)",
    "linies": [
     2002,
     2002
    ]
   },
   {
    "clau": "Forma de la ceba",
    "valor": "esfèrica",
    "linies": [
     2003,
     2003
    ]
   },
   {
    "clau": "Color de la pell",
    "valor": "marró clar",
    "linies": [
     2004,
     2004
    ]
   },
   {
    "clau": "Color de la polpa",
    "valor": "verd - blanc",
    "linies": [
     2005,
     2005
    ]
   },
   {
    "clau": "Grossària de la pell",
    "valor": "fina",
    "linies": [
     2006,
     2006
    ]
   },
   {
    "clau": "Pes",
    "valor": "mitjà (~240 g)",
    "linies": [
     2007,
     2007
    ]
   },
   {
    "clau": "Cicle",
    "valor": "intermedi",
    "linies": [
     2008,
     2008
    ]
   }
  ],
  "linies": {
   "nom": [
    2009,
    2010
   ],
   "cientific": [
    2011,
    2011
   ],
   "familia": 2012
  }
 },
 {
  "id": "cv-43-ceba-de-gra",
  "pagina": 43,
  "nom": "Ceba de gra",
  "nomCientific": "Allium cepa L.",
  "familia": "Liliàcies",
  "camps": [
   {
    "clau": "Diàmetre de la ceba",
    "valor": "9 cm",
    "linies": [
     2045,
     2045
    ]
   },
   {
    "clau": "Forma de l’àpex de la ceba",
    "valor": "lleugerament prominent i arredonit",
    "linies": [
     2046,
     2050
    ]
   },
   {
    "clau": "Alçària de la ceba",
    "valor": "mitjana (8 – 9 cm)",
    "linies": [
     2051,
     2051
    ]
   },
   {
    "clau": "Forma de la ceba",
    "valor": "ovoide ampla esfèrica",
    "linies": [
     2052,
     2053
    ]
   },
   {
    "clau": "Color de la pell",
    "valor": "marró",
    "linies": [
     2054,
     2054
    ]
   },
   {
    "clau": "Color de la polpa",
    "valor": "blanc amb alguna tonalitat verda",
    "linies": [
     2055,
     2056
    ]
   },
   {
    "clau": "Grossària de la pell",
    "valor": "intermèdia",
    "linies": [
     2057,
     2057
    ]
   },
   {
    "clau": "Pes",
    "valor": "gran (>300 g)",
    "linies": [
     2058,
     2058
    ]
   },
   {
    "clau": "Cicle",
    "valor": "tardà",
    "linies": [
     2059,
     2059
    ]
   }
  ],
  "linies": {
   "nom": [
    2060,
    2061
   ],
   "cientific": [
    2062,
    2062
   ],
   "familia": 2063
  }
 },
 {
  "id": "cv-44-encisam-mantegos-d-ademus",
  "pagina": 44,
  "nom": "Encisam mantegós d’Ademús",
  "nomCientific": "Lactuca sativa L.",
  "familia": "Compostes",
  "camps": [
   {
    "clau": "Tipus varietal",
    "valor": "mantegós",
    "linies": [
     2100,
     2100
    ]
   },
   {
    "clau": "Cabdell",
    "valor": "sí",
    "linies": [
     2101,
     2101
    ]
   },
   {
    "clau": "Diàmetre en camp",
    "valor": "15 - 20 cm",
    "linies": [
     2102,
     2102
    ]
   },
   {
    "clau": "Pes",
    "valor": "300 – 450 g",
    "linies": [
     2103,
     2103
    ]
   },
   {
    "clau": "Color de la llavor",
    "valor": "negra",
    "linies": [
     2104,
     2104
    ]
   },
   {
    "clau": "Cicle",
    "valor": "80 – 100 dies",
    "linies": [
     2105,
     2105
    ]
   },
   {
    "clau": "Període de cultiu",
    "valor": "tardor / hivern",
    "linies": [
     2106,
     2106
    ]
   }
  ],
  "linies": {
   "nom": [
    2107,
    2109
   ],
   "cientific": [
    2110,
    2110
   ],
   "familia": 2111
  }
 },
 {
  "id": "cv-45-encisam-morat-de-morella",
  "pagina": 45,
  "nom": "Encisam morat de Morella",
  "nomCientific": "Lactuca sativa L.",
  "familia": "Compostes",
  "camps": [
   {
    "clau": "Tipus varietal",
    "valor": "romà",
    "linies": [
     2148,
     2148
    ]
   },
   {
    "clau": "Cabdell",
    "valor": "sí",
    "linies": [
     2149,
     2149
    ]
   },
   {
    "clau": "Diàmetre en camp",
    "valor": "40 – 55 cm",
    "linies": [
     2150,
     2150
    ]
   },
   {
    "clau": "Pes",
    "valor": "750 – 1000 g",
    "linies": [
     2151,
     2151
    ]
   },
   {
    "clau": "Color de la llavor",
    "valor": "negra",
    "linies": [
     2152,
     2152
    ]
   },
   {
    "clau": "Cicle",
    "valor": "80 – 100 dies",
    "linies": [
     2153,
     2153
    ]
   },
   {
    "clau": "Període de cultiu",
    "valor": "tardor / hivern",
    "linies": [
     2154,
     2154
    ]
   }
  ],
  "linies": {
   "nom": [
    2155,
    2157
   ],
   "cientific": [
    2158,
    2158
   ],
   "familia": 2159
  }
 },
 {
  "id": "cv-46-encisam-meravella-d-espada",
  "pagina": 46,
  "nom": "Encisam meravella d’Espadà",
  "nomCientific": "Lactuca sativa L.",
  "familia": "Compostes",
  "camps": [
   {
    "clau": "Tipus varietal",
    "valor": "meravella",
    "linies": [
     2190,
     2190
    ]
   },
   {
    "clau": "Cabdell",
    "valor": "sí (en funció de l’estació)",
    "linies": [
     2191,
     2192
    ]
   },
   {
    "clau": "Diàmetre en camp",
    "valor": "30 – 35 cm",
    "linies": [
     2193,
     2193
    ]
   },
   {
    "clau": "Pes",
    "valor": "450 – 750 g",
    "linies": [
     2194,
     2194
    ]
   },
   {
    "clau": "Color de la llavor",
    "valor": "blanca",
    "linies": [
     2195,
     2195
    ]
   },
   {
    "clau": "Cicle",
    "valor": "60 dies",
    "linies": [
     2196,
     2196
    ]
   },
   {
    "clau": "Període de cultiu",
    "valor": "primavera / estiu",
    "linies": [
     2197,
     2197
    ]
   }
  ],
  "linies": {
   "nom": [
    2198,
    2200
   ],
   "cientific": [
    2201,
    2201
   ],
   "familia": 2202
  },
  "nomIndex": {
   "text": "Encisam maravilla d’Espadà",
   "linia": 131
  }
 },
 {
  "id": "cv-47-encisam-orella-de-burro",
  "pagina": 47,
  "nom": "Encisam “orella de burro”",
  "nomCientific": "Lactuca sativa L.",
  "familia": "Compostes",
  "camps": [
   {
    "clau": "Tipus varietal",
    "valor": "romà",
    "linies": [
     2237,
     2237
    ]
   },
   {
    "clau": "Cabdell",
    "valor": "sí",
    "linies": [
     2238,
     2238
    ]
   },
   {
    "clau": "Diàmetre en camp",
    "valor": "10 – 15 cm",
    "linies": [
     2239,
     2239
    ]
   },
   {
    "clau": "Pes",
    "valor": "500 – 750 g",
    "linies": [
     2240,
     2240
    ]
   },
   {
    "clau": "Color de la llavor",
    "valor": "negra",
    "linies": [
     2241,
     2241
    ]
   },
   {
    "clau": "Cicle",
    "valor": "100 – 120 dies",
    "linies": [
     2242,
     2242
    ]
   },
   {
    "clau": "Període de cultiu",
    "valor": "tardor / hivern",
    "linies": [
     2243,
     2243
    ]
   }
  ],
  "linies": {
   "nom": [
    2244,
    2246
   ],
   "cientific": [
    2247,
    2247
   ],
   "familia": 2248
  }
 },
 {
  "id": "cv-48-bleda-d-eslida",
  "pagina": 48,
  "nom": "Bleda d’Eslida",
  "nomCientific": "Beta vulgaris var. cicla",
  "familia": "Quenopodiàcies",
  "camps": [
   {
    "clau": "Forma de la fulla",
    "valor": "ovalada",
    "linies": [
     2287,
     2287
    ]
   },
   {
    "clau": "Posició de la fulla",
    "valor": "erecta",
    "linies": [
     2288,
     2288
    ]
   },
   {
    "clau": "Longitud de la fulla",
    "valor": "38 – 44 cm",
    "linies": [
     2289,
     2289
    ]
   },
   {
    "clau": "Amplària de la fulla",
    "valor": "27 – 33 cm",
    "linies": [
     2290,
     2290
    ]
   },
   {
    "clau": "Color de la fulla",
    "valor": "Verd fosc",
    "linies": [
     2291,
     2291
    ]
   },
   {
    "clau": "Color de la penca",
    "valor": "blanca",
    "linies": [
     2292,
     2292
    ]
   },
   {
    "clau": "Amplària de la penca",
    "valor": "3,5 – 5,5 cm",
    "linies": [
     2293,
     2293
    ]
   },
   {
    "clau": "Longitud de la penca",
    "valor": "20 – 27 cm",
    "linies": [
     2294,
     2294
    ]
   },
   {
    "clau": "Forma de la penca",
    "valor": "Forma de U",
    "linies": [
     2295,
     2295
    ]
   }
  ],
  "linies": {
   "nom": [
    2296,
    2297
   ],
   "cientific": [
    2298,
    2299
   ],
   "familia": 2300
  }
 }
]);

/** Associació de Varietats Locals (Mallorca), Catàleg de llavors 2020: les 65 varietats amb nom, nom científic i origen. */
export const VARIETATS_AVL_MALLORCA = congela([
 {
  "id": "avl-11-alfabeguera-de-fulla-verda",
  "pagina": 11,
  "temporada": "estiu",
  "nom": "Alfabeguera de fulla verda",
  "nomCientific": "Ocimum basilicum",
  "origen": "Can Nicolau, Sant Joan, Mallorca",
  "linies": {
   "nom": 244,
   "cientific": 245,
   "origen": [
    246,
    246
   ]
  }
 },
 {
  "id": "avl-11-alberginia-morada",
  "pagina": 11,
  "temporada": "estiu",
  "nom": "Albergínia morada",
  "nomCientific": "Solanum melongena",
  "origen": "Son Fortuny, Sant Joan, Mallorca",
  "linies": {
   "nom": 249,
   "cientific": 250,
   "origen": [
    251,
    251
   ]
  }
 },
 {
  "id": "avl-11-alfabeguera-de-fulla-morada",
  "pagina": 11,
  "temporada": "estiu",
  "nom": "Alfabeguera de fulla morada",
  "nomCientific": "Ocimum basilicum",
  "origen": "Can Nicolau, Sant Joan, Mallorca",
  "linies": {
   "nom": 256,
   "cientific": 257,
   "origen": [
    258,
    258
   ]
  }
 },
 {
  "id": "avl-11-blat-de-les-indies",
  "pagina": 11,
  "temporada": "estiu",
  "nom": "Blat de les Índies",
  "nomCientific": "Zea mays L.",
  "origen": "Prospectada a Sa Pobla, Mallorca, pel CRF",
  "linies": {
   "nom": 263,
   "cientific": 264,
   "origen": [
    265,
    265
   ]
  }
 },
 {
  "id": "avl-12-carabassa-d-encarabassat",
  "pagina": 12,
  "temporada": "estiu",
  "nom": "Carabassa d’encarabassat",
  "nomCientific": "Citrullus lanatus",
  "origen": "Ca Na Justa, Porreres, Mallorca",
  "linies": {
   "nom": 280,
   "cientific": 281,
   "origen": [
    282,
    282
   ]
  }
 },
 {
  "id": "avl-12-carabassa-de-cabell-d-angel",
  "pagina": 12,
  "temporada": "estiu",
  "nom": "Carabassa de cabell d’àngel",
  "nomCientific": "Cucurbita ficifolia",
  "origen": "Manacor, Mallorca",
  "linies": {
   "nom": 290,
   "cientific": 291,
   "origen": [
    292,
    292
   ]
  }
 },
 {
  "id": "avl-12-carabassa-de-fregall",
  "pagina": 12,
  "temporada": "estiu",
  "nom": "Carabassa de fregall",
  "nomCientific": "Luffa cylindrica",
  "origen": "Ses Pedreres, Manacor, Mallorca",
  "linies": {
   "nom": 296,
   "cientific": 297,
   "origen": [
    298,
    298
   ]
  }
 },
 {
  "id": "avl-12-carabassa-llarga",
  "pagina": 12,
  "temporada": "estiu",
  "nom": "Carabassa llarga",
  "nomCientific": "Cucurbita moschata",
  "origen": "Son Ripoll, Montuïri, Mallorca",
  "linies": {
   "nom": 305,
   "cientific": 306,
   "origen": [
    307,
    307
   ]
  }
 },
 {
  "id": "avl-13-fesol",
  "pagina": 13,
  "temporada": "estiu",
  "nom": "Fesol",
  "nomCientific": "Vigna unguiculata",
  "origen": "Prospectada a Mallorca pel Centro de Recursos Fitogenéticos",
  "linies": {
   "nom": 325,
   "cientific": 326,
   "origen": [
    327,
    328
   ]
  }
 },
 {
  "id": "avl-13-carabassa-petita",
  "pagina": 13,
  "temporada": "estiu",
  "nom": "Carabassa petita",
  "nomCientific": "Cucurbita moschata",
  "origen": "Montuïri, Mallorca",
  "linies": {
   "nom": 335,
   "cientific": 336,
   "origen": [
    337,
    337
   ]
  }
 },
 {
  "id": "avl-13-enciam-de-tres-ulls",
  "pagina": 13,
  "temporada": "estiu",
  "nom": "Enciam de tres ulls",
  "nomCientific": "Lactuca sativa",
  "origen": "Ca na Justa, Porreres, Mallorca",
  "linies": {
   "nom": 341,
   "cientific": 342,
   "origen": [
    343,
    343
   ]
  }
 },
 {
  "id": "avl-13-fesol-llarg-o-de-metro",
  "pagina": 13,
  "temporada": "estiu",
  "nom": "Fesol llarg o de metro",
  "nomCientific": "Phaseolus vulgaris",
  "origen": "Ses Pedreres, Manacor, Mallorca",
  "linies": {
   "nom": 348,
   "cientific": 349,
   "origen": [
    350,
    350
   ]
  }
 },
 {
  "id": "avl-14-melo-fei-rodo",
  "pagina": 14,
  "temporada": "estiu",
  "nom": "Meló fei rodó",
  "nomCientific": "Cucumis melo",
  "origen": "Son Ajaume Nou, Palma, Mallorca",
  "linies": {
   "nom": 369,
   "cientific": 370,
   "origen": [
    371,
    371
   ]
  }
 },
 {
  "id": "avl-14-melo-des-clot-des-pou",
  "pagina": 14,
  "temporada": "estiu",
  "nom": "Meló des clot des pou",
  "nomCientific": "Cucumis melo",
  "origen": "S’Horta, Felanitx, Mallorca",
  "linies": {
   "nom": 379,
   "cientific": 380,
   "origen": [
    381,
    381
   ]
  }
 },
 {
  "id": "avl-14-melo-erico",
  "pagina": 14,
  "temporada": "estiu",
  "nom": "Meló eriçó",
  "nomCientific": "Cucumis melo",
  "origen": "Son Amadora, Vilafranca, Mallorca",
  "linies": {
   "nom": 385,
   "cientific": 386,
   "origen": [
    387,
    387
   ]
  }
 },
 {
  "id": "avl-14-melo-manto-del-senyor",
  "pagina": 14,
  "temporada": "estiu",
  "nom": "Meló manto del Senyor",
  "nomCientific": "Cucumis melo",
  "origen": "Felanitx, Mallorca",
  "linies": {
   "nom": 394,
   "cientific": 395,
   "origen": [
    396,
    396
   ]
  }
 },
 {
  "id": "avl-15-mongeta-negra",
  "pagina": 15,
  "temporada": "estiu",
  "nom": "Mongeta negra",
  "nomCientific": "Phaseolus vulgaris",
  "origen": "Prospectada a Mallorca pel Centro de Recursos Fitogenéticos",
  "linies": {
   "nom": 417,
   "cientific": 418,
   "origen": [
    419,
    420
   ]
  }
 },
 {
  "id": "avl-15-mongeta-blanca",
  "pagina": 15,
  "temporada": "estiu",
  "nom": "Mongeta blanca",
  "nomCientific": "Phaseolus vulgaris",
  "origen": "Prospectada a Mallorca pel Centro de Recursos Fitogenéticos",
  "linies": {
   "nom": 426,
   "cientific": 427,
   "origen": [
    428,
    429
   ]
  }
 },
 {
  "id": "avl-15-mongeta-de-careta",
  "pagina": 15,
  "temporada": "estiu",
  "nom": "Mongeta de careta",
  "nomCientific": "Phaseolus vulgaris",
  "origen": "Prospectada a Mallorca pel Centro de Recursos Fitogenéticos",
  "linies": {
   "nom": 433,
   "cientific": 434,
   "origen": [
    435,
    436
   ]
  }
 },
 {
  "id": "avl-15-mongeta-tendra-blanca",
  "pagina": 15,
  "temporada": "estiu",
  "nom": "Mongeta tendra blanca",
  "nomCientific": "Phaseolus vulgaris",
  "origen": "Sos Fulles, Artà, Mallorca",
  "linies": {
   "nom": 440,
   "cientific": 441,
   "origen": [
    442,
    442
   ]
  }
 },
 {
  "id": "avl-16-pebre-de-padron",
  "pagina": 16,
  "temporada": "estiu",
  "nom": "Pebre de Padrón",
  "nomCientific": "Capsicum annuum",
  "origen": "Son Fortuny, Sant Joan, Mallorca",
  "linies": {
   "nom": 462,
   "cientific": 463,
   "origen": [
    464,
    464
   ]
  }
 },
 {
  "id": "avl-16-pebre-de-banya-de-cabra",
  "pagina": 16,
  "temporada": "estiu",
  "nom": "Pebre de banya de cabra",
  "nomCientific": "Capsicum annuum",
  "origen": "Son Fortuny, Sant Joan, Mallorca",
  "linies": {
   "nom": 468,
   "cientific": 469,
   "origen": [
    470,
    470
   ]
  }
 },
 {
  "id": "avl-16-pebre-de-fulla-d-olivera",
  "pagina": 16,
  "temporada": "estiu",
  "nom": "Pebre de fulla d’olivera",
  "nomCientific": "Capsicum annuum",
  "origen": "Can Pou, Sant Jordi, Mallorca",
  "linies": {
   "nom": 473,
   "cientific": 474,
   "origen": [
    475,
    475
   ]
  }
 },
 {
  "id": "avl-16-pebre-de-tap-de-corti",
  "pagina": 16,
  "temporada": "estiu",
  "nom": "Pebre de tap de cortí",
  "nomCientific": "Capsicum annuum",
  "origen": "Sa Teulera, Manacor, Mallorca",
  "linies": {
   "nom": 482,
   "cientific": 483,
   "origen": [
    484,
    484
   ]
  }
 },
 {
  "id": "avl-17-pebre-ros-gruixat",
  "pagina": 17,
  "temporada": "estiu",
  "nom": "Pebre ros gruixat",
  "nomCientific": "Capsicum annuum",
  "origen": "Muro, Mallorca",
  "linies": {
   "nom": 503,
   "cientific": 504,
   "origen": [
    505,
    505
   ]
  }
 },
 {
  "id": "avl-17-pebre-d-envinagrar",
  "pagina": 17,
  "temporada": "estiu",
  "nom": "Pebre d’envinagrar",
  "nomCientific": "Capsicum annuum",
  "origen": "Son Fortuny, Sant Joan, Mallorca",
  "linies": {
   "nom": 508,
   "cientific": 509,
   "origen": [
    510,
    510
   ]
  }
 },
 {
  "id": "avl-17-pebre-ros",
  "pagina": 17,
  "temporada": "estiu",
  "nom": "Pebre ros",
  "nomCientific": "Capsicum annuum",
  "origen": "Sant Jordi, Mallorca",
  "linies": {
   "nom": 513,
   "cientific": 514,
   "origen": [
    515,
    515
   ]
  }
 },
 {
  "id": "avl-17-sindria-blanca-i-allargada",
  "pagina": 17,
  "temporada": "estiu",
  "nom": "Síndria blanca i allargada",
  "nomCientific": "Citrullus lanatus",
  "origen": "Son Vell, Son Macià, Mallorca",
  "linies": {
   "nom": 518,
   "cientific": 519,
   "origen": [
    520,
    520
   ]
  }
 },
 {
  "id": "avl-18-tomatiga-de-bombilla",
  "pagina": 18,
  "temporada": "estiu",
  "nom": "Tomàtiga de bombilla",
  "nomCientific": "Solanum lycopersicum",
  "origen": "Manacor, Mallorca",
  "linies": {
   "nom": 543,
   "cientific": 544,
   "origen": [
    545,
    545
   ]
  }
 },
 {
  "id": "avl-18-sindria-de-pinyol-blanc",
  "pagina": 18,
  "temporada": "estiu",
  "nom": "Síndria de pinyol blanc",
  "nomCientific": "Citrullus lanatus",
  "origen": "Sant Joan, Mallorca",
  "linies": {
   "nom": 550,
   "cientific": 551,
   "origen": [
    552,
    552
   ]
  }
 },
 {
  "id": "avl-18-sindria-de-pinyol-vermell",
  "pagina": 18,
  "temporada": "estiu",
  "nom": "Síndria de pinyol vermell",
  "nomCientific": "Citrullus lanatus",
  "origen": "Jardí Botànic de Sóller, Mallorca",
  "linies": {
   "nom": 555,
   "cientific": 556,
   "origen": [
    557,
    557
   ]
  }
 },
 {
  "id": "avl-18-tomatiga-de-cor-de-bou",
  "pagina": 18,
  "temporada": "estiu",
  "nom": "Tomàtiga de cor de bou",
  "nomCientific": "Solanum lycopersicum",
  "origen": "S’Hostalet, Sant Joan, Mallorca",
  "linies": {
   "nom": 561,
   "cientific": 562,
   "origen": [
    563,
    563
   ]
  }
 },
 {
  "id": "avl-19-tomatiga-de-ramellet-de-canyisset",
  "pagina": 19,
  "temporada": "estiu",
  "nom": "Tomàtiga de ramellet de canyisset",
  "nomCientific": "Solanum lycopersicum",
  "origen": "Son Macià, Mallorca",
  "linies": {
   "nom": 586,
   "cientific": 587,
   "origen": [
    588,
    588
   ]
  }
 },
 {
  "id": "avl-19-tomatiga-de-mutxamel",
  "pagina": 19,
  "temporada": "estiu",
  "nom": "Tomàtiga de Mutxamel",
  "nomCientific": "Solanum lycopersicum",
  "origen": "Son Juny, Sant Joan, Mallorca",
  "linies": {
   "nom": 593,
   "cientific": 594,
   "origen": [
    595,
    595
   ]
  }
 },
 {
  "id": "avl-19-tomatiga-de-pera",
  "pagina": 19,
  "temporada": "estiu",
  "nom": "Tomàtiga de pera",
  "nomCientific": "Solanum lycopersicum",
  "origen": "Ca Na Justa, Porreres, Mallorca",
  "linies": {
   "nom": 603,
   "cientific": 604,
   "origen": [
    605,
    605
   ]
  }
 },
 {
  "id": "avl-19-tomatiga-de-ramellet-de-ferro",
  "pagina": 19,
  "temporada": "estiu",
  "nom": "Tomàtiga de ramellet de ferro",
  "nomCientific": "Solanum lycopersicum",
  "origen": "Son Fortuny, Sant Joan, Mallorca",
  "linies": {
   "nom": 610,
   "cientific": 611,
   "origen": [
    612,
    612
   ]
  }
 },
 {
  "id": "avl-20-tomatiga-de-valldemossa",
  "pagina": 20,
  "temporada": "estiu",
  "nom": "Tomàtiga de Valldemossa",
  "nomCientific": "Solanum lycopersicum",
  "origen": "Jardí botànic de Sóller, Mallorca",
  "linies": {
   "nom": 640,
   "cientific": 641,
   "origen": [
    642,
    642
   ]
  }
 },
 {
  "id": "avl-20-tomatiga-de-ramellet-de-mateta",
  "pagina": 20,
  "temporada": "estiu",
  "nom": "Tomàtiga de ramellet de mateta",
  "nomCientific": "Solanum lycopersicum",
  "origen": "Son Fortuny, Sant Joan, Mallorca",
  "linies": {
   "nom": 646,
   "cientific": 647,
   "origen": [
    648,
    648
   ]
  }
 },
 {
  "id": "avl-20-tomatiga-de-ramellet-de-na-solereta",
  "pagina": 20,
  "temporada": "estiu",
  "nom": "Tomàtiga de ramellet de na Solereta",
  "nomCientific": "Solanum lycopersicum",
  "origen": "Son Negre, Felanitx, Mallorca",
  "linies": {
   "nom": 658,
   "cientific": 659,
   "origen": [
    660,
    660
   ]
  }
 },
 {
  "id": "avl-20-tomatiga-negra",
  "pagina": 20,
  "temporada": "estiu",
  "nom": "Tomàtiga negra",
  "nomCientific": "Solanum lycopersicum",
  "origen": "Manacor, Mallorca",
  "linies": {
   "nom": 665,
   "cientific": 666,
   "origen": [
    667,
    667
   ]
  }
 },
 {
  "id": "avl-22-ciuro-mallorqui",
  "pagina": 22,
  "temporada": "hivern",
  "nom": "Ciuró mallorquí",
  "nomCientific": "Cicer arietinum",
  "origen": "Son Ajaume Nou, Palma, Mallorca",
  "linies": {
   "nom": 700,
   "cientific": 701,
   "origen": [
    702,
    702
   ]
  }
 },
 {
  "id": "avl-22-ceba-blanca-mallorquina",
  "pagina": 22,
  "temporada": "hivern",
  "nom": "Ceba blanca mallorquina",
  "nomCientific": "Allium cepa",
  "origen": "Horteta, Sant Joan, Mallorca",
  "linies": {
   "nom": 708,
   "cientific": 709,
   "origen": [
    710,
    710
   ]
  }
 },
 {
  "id": "avl-22-ceba-vermella-d-andratx",
  "pagina": 22,
  "temporada": "hivern",
  "nom": "Ceba vermella d’Andratx",
  "nomCientific": "Allium cepa",
  "origen": "Estellencs, Mallorca",
  "linies": {
   "nom": 716,
   "cientific": 717,
   "origen": [
    718,
    718
   ]
  }
 },
 {
  "id": "avl-22-col-borratxona",
  "pagina": 22,
  "temporada": "hivern",
  "nom": "Col borratxona",
  "nomCientific": "Brassica oleracea",
  "origen": "Muro, Mallorca",
  "linies": {
   "nom": 721,
   "cientific": 722,
   "origen": [
    723,
    723
   ]
  }
 },
 {
  "id": "avl-23-col-de-cabdell",
  "pagina": 23,
  "temporada": "hivern",
  "nom": "Col de cabdell",
  "nomCientific": "Brassica oleracea capitata L.",
  "origen": "Muro, Mallorca",
  "linies": {
   "nom": 743,
   "cientific": 744,
   "origen": [
    745,
    745
   ]
  }
 },
 {
  "id": "avl-23-col-borratxona-petita-o-de-7-setmanes",
  "pagina": 23,
  "temporada": "hivern",
  "nom": "Col borratxona petita (o de 7 setmanes)",
  "nomCientific": "Brassica oleracea",
  "origen": "Muro, Mallorca",
  "linies": {
   "nom": 749,
   "cientific": 750,
   "origen": [
    751,
    751
   ]
  }
 },
 {
  "id": "avl-23-col-caputxina",
  "pagina": 23,
  "temporada": "hivern",
  "nom": "Col caputxina",
  "nomCientific": "Brassica oleracea",
  "origen": "Ca na Justa, Porreres, Mallorca",
  "linies": {
   "nom": 754,
   "cientific": 755,
   "origen": [
    756,
    756
   ]
  }
 },
 {
  "id": "avl-23-colflori-de-fulla-d-espasa",
  "pagina": 23,
  "temporada": "hivern",
  "nom": "Colflori de fulla d’espasa",
  "nomCientific": "Brassica oleracea capitata L.",
  "origen": "Alcúdia, Mallorca",
  "linies": {
   "nom": 760,
   "cientific": 761,
   "origen": [
    762,
    762
   ]
  }
 },
 {
  "id": "avl-24-colflori-de-sant-antoni",
  "pagina": 24,
  "temporada": "hivern",
  "nom": "Colflori de Sant Antoni",
  "nomCientific": "Brassica oleracea botrytis L.",
  "origen": "Alcúdia, Mallorca",
  "linies": {
   "nom": 816,
   "cientific": 817,
   "origen": [
    818,
    818
   ]
  }
 },
 {
  "id": "avl-24-colflori-de-la-purissima",
  "pagina": 24,
  "temporada": "hivern",
  "nom": "Colflori de la Puríssima",
  "nomCientific": "Brassica oleracea botrytis L.",
  "origen": "Alcúdia, Mallorca",
  "linies": {
   "nom": 820,
   "cientific": 821,
   "origen": [
    822,
    822
   ]
  }
 },
 {
  "id": "avl-24-colflori-de-nadal",
  "pagina": 24,
  "temporada": "hivern",
  "nom": "Colflori de Nadal",
  "nomCientific": "Brassica oleracea botrytis L.",
  "origen": "Alcúdia, Mallorca",
  "linies": {
   "nom": 828,
   "cientific": 829,
   "origen": [
    830,
    830
   ]
  }
 },
 {
  "id": "avl-24-colflori-de-sant-josep",
  "pagina": 24,
  "temporada": "hivern",
  "nom": "Colflori de Sant Josep",
  "nomCientific": "Brassica oleracea botrytis L.",
  "origen": "Alcúdia, Mallorca",
  "linies": {
   "nom": 832,
   "cientific": 833,
   "origen": [
    834,
    834
   ]
  }
 },
 {
  "id": "avl-25-colflori-d-orella-d-ase",
  "pagina": 25,
  "temporada": "hivern",
  "nom": "Colflori d’orella d’ase",
  "nomCientific": "Brassica oleracea botrytis L.",
  "origen": "Alcúdia, Mallorca",
  "linies": {
   "nom": 868,
   "cientific": 869,
   "origen": [
    870,
    870
   ]
  }
 },
 {
  "id": "avl-25-colflori-de-tots-sants",
  "pagina": 25,
  "temporada": "hivern",
  "nom": "Colflori de Tots Sants",
  "nomCientific": "Brassica oleracea botrytis L.",
  "origen": "Alcúdia, Mallorca",
  "linies": {
   "nom": 873,
   "cientific": 874,
   "origen": [
    875,
    875
   ]
  }
 },
 {
  "id": "avl-25-colflori-de-ram-o-de-pasqua",
  "pagina": 25,
  "temporada": "hivern",
  "nom": "Colflori de Ram o de Pasqua",
  "nomCientific": "Brassica oleracea botrytis L.",
  "origen": "Alcúdia, Mallorca",
  "linies": {
   "nom": 880,
   "cientific": 881,
   "origen": [
    882,
    882
   ]
  }
 },
 {
  "id": "avl-25-enciam-negre",
  "pagina": 25,
  "temporada": "hivern",
  "nom": "Enciam negre",
  "nomCientific": "Lactuca sativa",
  "origen": "Prospectada a Sant Llorenç de Balàfia, Eivissa, pel CITA",
  "linies": {
   "nom": 885,
   "cientific": 886,
   "origen": [
    887,
    888
   ]
  }
 },
 {
  "id": "avl-26-fava-negra",
  "pagina": 26,
  "temporada": "hivern",
  "nom": "Fava negra",
  "nomCientific": "Vicia faba",
  "origen": "Es Maiol, Artà, Mallorca",
  "linies": {
   "nom": 937,
   "cientific": 938,
   "origen": [
    939,
    939
   ]
  }
 },
 {
  "id": "avl-26-enciam-revull-blanc",
  "pagina": 26,
  "temporada": "hivern",
  "nom": "Enciam revull blanc",
  "nomCientific": "Lactuca sativa",
  "origen": "Ca na Justa, Porreres, Mallorca",
  "linies": {
   "nom": 944,
   "cientific": 945,
   "origen": [
    946,
    946
   ]
  }
 },
 {
  "id": "avl-26-fava-mallorquina",
  "pagina": 26,
  "temporada": "hivern",
  "nom": "Fava mallorquina",
  "nomCientific": "Vicia faba",
  "origen": "Son Vell, Son Macià, Mallorca",
  "linies": {
   "nom": 953,
   "cientific": 954,
   "origen": [
    955,
    955
   ]
  }
 },
 {
  "id": "avl-26-julivert-mallorqui",
  "pagina": 26,
  "temporada": "hivern",
  "nom": "Julivert mallorquí",
  "nomCientific": "Petroselinum crispum",
  "origen": "Es Maiol, Artà, Mallorca",
  "linies": {
   "nom": 961,
   "cientific": 962,
   "origen": [
    963,
    963
   ]
  }
 },
 {
  "id": "avl-27-pesol-de-bullir",
  "pagina": 27,
  "temporada": "hivern",
  "nom": "Pèsol de bullir",
  "nomCientific": "Pisum sativum",
  "origen": "Es Maiol, Artà, Mallorca",
  "linies": {
   "nom": 977,
   "cientific": 978,
   "origen": [
    979,
    979
   ]
  }
 },
 {
  "id": "avl-27-lletuga-murtera",
  "pagina": 27,
  "temporada": "hivern",
  "nom": "Lletuga murtera",
  "nomCientific": "Lactuca sativa",
  "origen": "Prospectada a Eivissa pel Centro de Recursos Fitogenéticos",
  "linies": {
   "nom": 983,
   "cientific": 984,
   "origen": [
    985,
    986
   ]
  }
 },
 {
  "id": "avl-27-pastanaga-morada",
  "pagina": 27,
  "temporada": "hivern",
  "nom": "Pastanaga morada",
  "nomCientific": "Daucus carota",
  "origen": "Es Moradet, Montuïri, Mallorca",
  "linies": {
   "nom": 992,
   "cientific": 993,
   "origen": [
    994,
    994
   ]
  }
 },
 {
  "id": "avl-27-pesol-d-esclovellar",
  "pagina": 27,
  "temporada": "hivern",
  "nom": "Pèsol d’esclovellar",
  "nomCientific": "Pisum sativum",
  "origen": "Centro de Recursos Fitogenéticos, INIA",
  "linies": {
   "nom": 998,
   "cientific": 999,
   "origen": [
    1000,
    1000
   ]
  }
 },
 {
  "id": "avl-28-rave-mallorqui",
  "pagina": 28,
  "temporada": "hivern",
  "nom": "Rave mallorquí",
  "nomCientific": "Raphanus sativus L.",
  "origen": "S’Hort des Pla, Sant Jordi, Mall0rca",
  "linies": {
   "nom": 1032,
   "cientific": 1033,
   "origen": [
    1034,
    1034
   ]
  }
 }
]);

/** Fundació Miquel Agustí, Atles (primera proposta): les 15 fitxes d'espècie que conté el corpus. Llistes literals.
 * `particions`: les 5 línies del corpus que ajunten dues varietats, partides com les separa el PDF (pàgines 24, 34,
 * 42, 44 i 59: un requadre i un mapa per varietat). Els trossos units amb un espai tornen la línia literal. */
export const ESPECIES_ATLES_CATALUNYA = congela([
 {
  "id": "atles-14-all",
  "pagina": 14,
  "especie": "All",
  "nomCientific": "Allium sativum L.",
  "llista": [
   "All de Banyoles"
  ],
  "altres": [
   "All de Belltall, all porro"
  ],
  "sinonimies": [],
  "particions": [],
  "linies": {
   "especie": 308,
   "llista": [
    310
   ],
   "altres": [
    312
   ],
   "sinonimies": [
    314
   ]
  }
 },
 {
  "id": "atles-24-carbasso",
  "pagina": 24,
  "especie": "Carbassó",
  "nomCientific": "Cucurbita pepo L.",
  "llista": [
   "Carbassó comú o del país Carbassó blanc"
  ],
  "altres": [],
  "sinonimies": [],
  "particions": [
   {
    "linia": 323,
    "trossos": [
     "Carbassó comú o del país",
     "Carbassó blanc"
    ]
   }
  ],
  "linies": {
   "especie": 321,
   "llista": [
    323
   ],
   "altres": [
    325
   ],
   "sinonimies": [
    327
   ]
  }
 },
 {
  "id": "atles-28-cigro",
  "pagina": 28,
  "especie": "Cigró",
  "nomCientific": "Cicer arietinum L.",
  "llista": [
   "Cigronet"
  ],
  "altres": [
   "Cigró d’Oristà, cigró bossa de ruc, cigró de Marganell."
  ],
  "sinonimies": [
   "Cigronet – cigró menut, cigronet de l’Alta Anoia"
  ],
  "particions": [],
  "linies": {
   "especie": 334,
   "llista": [
    336
   ],
   "altres": [
    338
   ],
   "sinonimies": [
    340
   ]
  }
 },
 {
  "id": "atles-30-cogombre",
  "pagina": 30,
  "especie": "Cogombre",
  "nomCientific": "Cucumis sativus L.",
  "llista": [
   "Cogombre blanc o del país"
  ],
  "altres": [
   "Cogombre llarg o de corda."
  ],
  "sinonimies": [],
  "particions": [],
  "linies": {
   "especie": 347,
   "llista": [
    349
   ],
   "altres": [
    351
   ],
   "sinonimies": [
    353
   ]
  }
 },
 {
  "id": "atles-34-col-de-cabdell",
  "pagina": 34,
  "especie": "Col de cabdell",
  "nomCientific": "Brassica oleracea L. var. capitata / sabauda",
  "llista": [
   "Col pell de galàpet (B.oleracea var. sabauda) Col de cabdell país o comú (B.oleracea var. capitata)"
  ],
  "altres": [
   "Col fuada, col trapellada, col arrissada d’hivern."
  ],
  "sinonimies": [],
  "particions": [
   {
    "linia": 362,
    "trossos": [
     "Col pell de galàpet (B.oleracea var. sabauda)",
     "Col de cabdell país o comú (B.oleracea var. capitata)"
    ]
   }
  ],
  "linies": {
   "especie": 360,
   "llista": [
    362
   ],
   "altres": [
    364
   ],
   "sinonimies": [
    366
   ]
  }
 },
 {
  "id": "atles-38-escarola",
  "pagina": 38,
  "especie": "Escarola",
  "nomCientific": "Cichorium endivia L.",
  "llista": [
   "Escarola cabell d’àngel"
  ],
  "altres": [
   "Escarola santa coloma, escarola perruqueta del Prat, escarola arrullada."
  ],
  "sinonimies": [],
  "particions": [],
  "linies": {
   "especie": 373,
   "llista": [
    375
   ],
   "altres": [
    377
   ],
   "sinonimies": [
    379
   ]
  }
 },
 {
  "id": "atles-40-fajol",
  "pagina": 40,
  "especie": "Fajol",
  "nomCientific": "Fagopyrum esculentum Moench.",
  "llista": [
   "Fajol de la Garrotxa"
  ],
  "altres": [],
  "sinonimies": [],
  "particions": [],
  "linies": {
   "especie": 386,
   "llista": [
    388
   ],
   "altres": [
    390
   ],
   "sinonimies": [
    392
   ]
  }
 },
 {
  "id": "atles-42-fava",
  "pagina": 42,
  "especie": "Fava",
  "nomCientific": "Vicia faba L.",
  "llista": [
   "Fava muchamiel Fava reina mora"
  ],
  "altres": [
   "Fava aiguamúrcia, fava comú o del país, fava de tija curta, fava de la Val d’Aro."
  ],
  "sinonimies": [],
  "particions": [
   {
    "linia": 401,
    "trossos": [
     "Fava muchamiel",
     "Fava reina mora"
    ]
   }
  ],
  "linies": {
   "especie": 399,
   "llista": [
    401
   ],
   "altres": [
    403
   ],
   "sinonimies": [
    405
   ]
  }
 },
 {
  "id": "atles-44-fesolet",
  "pagina": 44,
  "especie": "Fesolet",
  "nomCientific": "Vigna unguiculata L. Walp.",
  "llista": [
   "Fesolet de l’ull ros Fesolet de l’ull negre o del país"
  ],
  "altres": [],
  "sinonimies": [
   "Fesolet - monget"
  ],
  "particions": [
   {
    "linia": 414,
    "trossos": [
     "Fesolet de l’ull ros",
     "Fesolet de l’ull negre o del país"
    ]
   }
  ],
  "linies": {
   "especie": 412,
   "llista": [
    414
   ],
   "altres": [
    416
   ],
   "sinonimies": [
    418
   ]
  }
 },
 {
  "id": "atles-46-guixes",
  "pagina": 46,
  "especie": "Guixes",
  "nomCientific": "Lathyrus sativus L.",
  "llista": [
   "Guixera comú"
  ],
  "altres": [],
  "sinonimies": [],
  "particions": [],
  "linies": {
   "especie": 425,
   "llista": [
    427
   ],
   "altres": [
    429
   ],
   "sinonimies": [
    431
   ]
  }
 },
 {
  "id": "atles-55-pastanaga",
  "pagina": 55,
  "especie": "Pastanaga",
  "nomCientific": "Daucus carota L.",
  "llista": [
   "Pastanaga morada"
  ],
  "altres": [],
  "sinonimies": [
   "Pastanaga morada – safranòria de ponent"
  ],
  "particions": [],
  "linies": {
   "especie": 438,
   "llista": [
    440
   ],
   "altres": [
    442
   ],
   "sinonimies": [
    444
   ]
  }
 },
 {
  "id": "atles-59-pesol",
  "pagina": 59,
  "especie": "Pèsol",
  "nomCientific": "Pisum sativum L.",
  "llista": [
   "Pèsol negre Pèsol de la floreta"
  ],
  "altres": [
   "Estirabec (Pisum sativum L. var. macrocarpum), pèsol d’olor, pèsol de set setmanes."
  ],
  "sinonimies": [
   "Pèsol de la floreta – pèsol de Llavaneres, pèsol garrofal"
  ],
  "particions": [
   {
    "linia": 453,
    "trossos": [
     "Pèsol negre",
     "Pèsol de la floreta"
    ]
   }
  ],
  "linies": {
   "especie": 451,
   "llista": [
    453
   ],
   "altres": [
    455
   ],
   "sinonimies": [
    457
   ]
  }
 },
 {
  "id": "atles-61-porro",
  "pagina": 61,
  "especie": "Porro",
  "nomCientific": "Allium porrum L.",
  "llista": [
   "Porro comú o del país"
  ],
  "altres": [
   "All-porro."
  ],
  "sinonimies": [],
  "particions": [],
  "linies": {
   "especie": 464,
   "llista": [
    466
   ],
   "altres": [
    468
   ],
   "sinonimies": []
  }
 },
 {
  "id": "atles-63-salsifi",
  "pagina": 63,
  "especie": "Salsifí",
  "nomCientific": "Tragopogon porrifolius L.",
  "llista": [
   "Salsifí blanc"
  ],
  "altres": [
   "Salsifí negre (Scorzonera hispanica L.)"
  ],
  "sinonimies": [
   "Salsifí blanc – salsifí comú, barba de cabra."
  ],
  "particions": [],
  "linies": {
   "especie": 476,
   "llista": [
    478
   ],
   "altres": [
    480
   ],
   "sinonimies": [
    482
   ]
  }
 },
 {
  "id": "atles-65-sindria",
  "pagina": 65,
  "especie": "Síndria",
  "nomCientific": "Citrullus lanatus (Thunb.) Matsum. & Nakai",
  "llista": [
   "Síndria del país o comú"
  ],
  "altres": [
   "Síndria blanca, síndria ratllada, síndria de pell doble, síndria de pell fina."
  ],
  "sinonimies": [],
  "particions": [],
  "linies": {
   "especie": 489,
   "llista": [
    491
   ],
   "altres": [
    493
   ],
   "sinonimies": [
    495
   ]
  }
 }
]);

const pla = (text) => String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').replace(/[·.]/g, '').toLowerCase();

/** Les entrades d'un catàleg en una forma comuna per a la llista; la cerca no distingix accents ni el punt volat. */
export function entradesDelCataleg(idFont) {
  if (idFont === 'cataleg-valencia') return VARIETATS_CATALEG_VALENCIA.map((v) => ({ id: v.id, nom: v.nom, nomCientific: v.nomCientific, pagina: v.pagina, dada: v }));
  if (idFont === 'avl-mallorca') return VARIETATS_AVL_MALLORCA.map((v) => ({ id: v.id, nom: v.nom, nomCientific: v.nomCientific, pagina: v.pagina, dada: v }));
  if (idFont === 'atles-catalunya') return ESPECIES_ATLES_CATALUNYA.map((e) => ({ id: e.id, nom: e.especie, nomCientific: e.nomCientific, pagina: e.pagina, dada: e }));
  return [];
}

export function filtraEntrades(entrades, cerca = '') {
  const q = pla(cerca).trim();
  if (!q) return entrades;
  return entrades.filter((e) => {
    const text = pla([e.nom, e.nomCientific, e.dada?.nomIndex?.text, e.dada?.origen, ...(e.dada?.llista ?? []), ...(e.dada?.altres ?? [])].join(' '));
    return q.split(/\s+/).every((tros) => text.includes(tros));
  });
}
