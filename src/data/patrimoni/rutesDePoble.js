/** IDEA-113 (Onada R9, carril C5) · Rutes de poble: una forma de dades reutilitzable i els 6 itineraris reals de La Torre.
 *
 * Font: «Itineraris per La Torre de les Maçanes», Gent de La Torre · El Diari de La Torre de les Maçanes
 * (gentdelatorre.net), revisió 2021-04-28. Els 6 eixos (SOM PA, SOM OLI · SOM VINCLES · SOM AIGUA · SOM TERRA ·
 * SOM POBLE · SOM PAISATGE) són els títols de les pàgines 4 a 14 de la font. Tot és literal (també les errates)
 * i porta línia; ho contrasta patrimoniR9.fonts.test.js. Les fitxes d'establiments (forns, carnisseries, restaurants)
 * no copien noms ni telèfons de 2021, que poden haver canviat.
 * La plantilla no porta dades de cap altre poble: cada poble hi posa les seues amb la seua font (G9-02).
 */
const congela = (valor) => {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    for (const fill of Object.values(valor)) congela(fill);
    Object.freeze(valor);
  }
  return valor;
};

export const VERSIO_RUTES_DE_POBLE = '1.0.0';

/** La forma buida: un poble nou copia esta estructura i l'ompli amb la seua font. */
export const PLANTILLA_RUTES_DE_POBLE = congela({
  poble: '',
  comarca: '',
  font: { titol: '', editor: '', web: '', revisio: '', document: '', sha256: '', pagines: 0, linies: {} },
  rutes: [],
  recursos: []
});

const text = (v) => typeof v === 'string' && v.trim().length > 0;

/** Valida un conjunt de rutes contra la forma. Torna la llista d'errors (buida si és vàlid). */
export function validaRutesDePoble(conjunt) {
  const errors = [];
  if (!conjunt || typeof conjunt !== 'object') return ['el conjunt no és un objecte'];
  if (!text(conjunt.poble)) errors.push('poble: buit');
  const font = conjunt.font ?? {};
  for (const camp of ['titol', 'editor', 'document']) if (!text(font[camp])) errors.push(`font.${camp}: buit`);
  if (!/^[a-f0-9]{64}$/.test(font.sha256 ?? '')) errors.push('font.sha256: no és una empremta SHA-256');
  if (!Array.isArray(conjunt.rutes) || conjunt.rutes.length === 0) errors.push('rutes: cap ruta');
  for (const [i, ruta] of (conjunt.rutes ?? []).entries()) {
    for (const camp of ['eix', 'temps', 'distancia']) if (!text(ruta?.[camp])) errors.push(`rutes[${i}].${camp}: buit`);
    if (!Number.isInteger(ruta?.pagina) || ruta.pagina < 1) errors.push(`rutes[${i}].pagina: sense pàgina de la font`);
    if (!Array.isArray(ruta?.parades) || ruta.parades.length === 0) errors.push(`rutes[${i}].parades: cap parada`);
    for (const [j, parada] of (ruta?.parades ?? []).entries()) {
      if (!/^\d{1,2}:\d{2}$/.test(parada?.hora ?? '')) errors.push(`rutes[${i}].parades[${j}].hora: no és HH:MM`);
      if (!text(parada?.titol)) errors.push(`rutes[${i}].parades[${j}].titol: buit`);
    }
  }
  for (const [i, recurs] of (conjunt.recursos ?? []).entries()) {
    if (!text(recurs?.nom)) errors.push(`recursos[${i}].nom: buit`);
    if (!Number.isInteger(recurs?.pagina) || recurs.pagina < 1) errors.push(`recursos[${i}].pagina: sense pàgina de la font`);
  }
  return errors;
}

/** Els itineraris de La Torre de les Maçanes, tal com són a la font. */
export const RUTES_LA_TORRE = congela({
 "poble": "La Torre de les Maçanes",
 "comarca": "l’Alacantí",
 "font": {
  "titol": "Itineraris per La Torre de les Maçanes",
  "editor": "Gent de La Torre · El Diari de La Torre de les Maçanes",
  "web": "https://gentdelatorre.net",
  "revisio": "2021‐04‐28 17:46:27",
  "document": "_cultura_de_poble/rutes_i_recursos_de_la_torre/corpus_text/01_recursos-de-la-torre-itineraris.md",
  "sha256": "6c423110a5dd97ce97aa99e79e25d91a0a41d334d731b0ebd2a11709d61a9d47",
  "pagines": 33,
  "linies": {
   "revisio": 6,
   "titol": 7,
   "editor": [
    8,
    9
   ],
   "web": 17,
   "pobleComarca": 120
  }
 },
 "rutes": [
  {
   "numero": 1,
   "eix": "SOM PA, SOM OLI",
   "lema": "Coneixent l'essència del poble.",
   "temps": "4 h",
   "distancia": "1,3 km",
   "pagina": 4,
   "programa": "La visita s'inicia al forn de pa. Veurem el procés de cocció mentre el forner ens parla dels productes i receptes locals. Després d'un xicotet passeig, arribarem a l'almàssera, on coneixerem la importància que tenen l'oliva i l'oli per a La Torre, i les seues implicacions culturals i econòmiques. Seguidament, es realitzarà una degustació d'oli i productes típics, amb explicació sobre la seua elaboració. Després de l'esmorzar es visitarà el molí fariner hidràulic, explicarem la seua història. I per finalitzar la visita, anirem al molí fariner elèctric, on es pot apreciar l'evolució tècnica en la construcció entre aquest i l'anterior.",
   "parades": [
    {
     "hora": "10:00",
     "titol": "Visita als Forns de llenya",
     "explicacio": "Veurem com es cou el pa, mentre parlem amb el forner.",
     "linies": [
      85,
      87
     ]
    },
    {
     "hora": "10:30",
     "titol": "Visita a l'Almàssera",
     "explicacio": "Explicació del procés d'extracció d'oli. Amb material audiovisual.",
     "linies": [
      88,
      90
     ]
    },
    {
     "hora": "11:30",
     "titol": "Esmorzar",
     "explicacio": "Degustació gastronòmica: Pa i oli, pericana, embotit ...",
     "linies": [
      91,
      93
     ]
    },
    {
     "hora": "12:30",
     "titol": "Visita al Molí fariner hidràulic",
     "explicacio": "Explicació sobre el funcionament i exposició del procés d'elaboració.",
     "linies": [
      94,
      96
     ]
    },
    {
     "hora": "13:00",
     "titol": "Visita al Molí fariner elèctric",
     "explicacio": "Explicació sobre el seu funcionament i les innovacions tècniques amb l'arribada de l'electricitat a poble.",
     "linies": [
      97,
      100
     ]
    }
   ],
   "linies": {
    "eix": 84,
    "lema": 139,
    "programa": [
     140,
     155
    ],
    "mida": 120
   }
  },
  {
   "numero": 2,
   "eix": "SOM VINCLES",
   "lema": null,
   "temps": "4 h",
   "distancia": "1,5 km",
   "pagina": 6,
   "programa": "Farem un recorregut pel patrimoni arquitectònic més significatiu del poble. Començarem per l’Església de Santa Anna i l’entorn del casc antic. Recorrem els carrers fins arribar a l’edifici més emblemàtic, el que dona nom i identitat al poble: La Casa Alta, on podrem comprendre millor aspectes històrics i etnogràfics. Passarem també per La Foia de Cortès, mas fortificat amb elements interessants. En arribar a la part nova del poble farem una parada per esmorzar i gaudir dels productes típics. Desprès anirem a visitar l’Almàssera per endinsar-nos en el procès de producció de l’oli i conéixer les seves instal·lacions.",
   "parades": [
    {
     "hora": "10:20",
     "titol": "Visita a l’Esglèsia de Santa Anna",
     "explicacio": "Visita a l'església i explicació. Arquitectura històrica.",
     "linies": [
      192,
      194
     ]
    },
    {
     "hora": "10:50",
     "titol": "Visita al Museu de la Casa Alta",
     "explicacio": "Visita al museu i vídeo explicatiu.",
     "linies": [
      195,
      196
     ]
    },
    {
     "hora": "11:40",
     "titol": "Visita a la Foia de Cortés",
     "explicacio": "Explicació del mas fortificat. Natura de l’entorn.",
     "linies": [
      197,
      199
     ]
    },
    {
     "hora": "12:00",
     "titol": "Esmorzar",
     "explicacio": "Degustació gastronòmica: Pa, oli, pericana, embotit ...",
     "linies": [
      200,
      202
     ]
    },
    {
     "hora": "13:00",
     "titol": "Visita a l'Almàssera",
     "explicacio": "Explicació del procés d'extracció d'oli. Amb material audiovisual.",
     "linies": [
      203,
      205
     ]
    }
   ],
   "linies": {
    "eix": 191,
    "lema": null,
    "programa": [
     242,
     256
    ],
    "mida": 257
   }
  },
  {
   "numero": 3,
   "eix": "SOM AIGUA",
   "lema": "Camins d’aigua.",
   "temps": "4 h",
   "distancia": "2 km",
   "pagina": 8,
   "programa": "Començem visitant l’Almàssera per endinsar-nos en el procès de producció de l’oli coneixent les seues instal·lacions. Després tastarem els productes típics del poble: oli, pa, embutits, pericana ... Coneixerem els recursos creats al llarg del temps per a l’aprofitament de les aigües. Per la font del poble i el llavador passejarem cap al riu per veure el bassi, la font major i el malecó i algunes restes d’infrastructures hidràuliques. Finalment visitarem el molí hidràulic.",
   "parades": [
    {
     "hora": "10:00",
     "titol": "Visita a l'Almàssera",
     "explicacio": "Explicació del procés d'extracció d'oli. Amb material audiovisual.",
     "linies": [
      313,
      315
     ]
    },
    {
     "hora": "11:00",
     "titol": "Esmorzar",
     "explicacio": "Degustació gastronòmica: Pa i oli, pericana, embotit ...",
     "linies": [
      316,
      318
     ]
    },
    {
     "hora": "12:00",
     "titol": "Visita a l'antic Llavador del poble",
     "explicacio": "El Bassi. Explicació. Naturalesa, història, arquitectura.",
     "linies": [
      319,
      321
     ]
    },
    {
     "hora": "12:30",
     "titol": "Passeig cap a l'antic Llavador del riu",
     "explicacio": "Explicació. Naturalesa, història, arquitectura.",
     "linies": [
      322,
      324
     ]
    },
    {
     "hora": "13:00",
     "titol": "Passeig a la Font Major i al Malecó",
     "explicacio": "Explicació. Arquitectura tant de la font com de les cases.",
     "linies": [
      325,
      327
     ]
    },
    {
     "hora": "13:30",
     "titol": "Visita al Molí fariner hidràulic",
     "explicacio": "Explicació sobre el funcionament i exposició del procés d'elaboració.",
     "linies": [
      328,
      330
     ]
    }
   ],
   "linies": {
    "eix": 312,
    "lema": 351,
    "programa": [
     352,
     362
    ],
    "mida": 363
   }
  },
  {
   "numero": 4,
   "eix": "SOM TERRA",
   "lema": "Sabors de la terra.",
   "temps": "4 h",
   "distancia": "2 km",
   "pagina": 10,
   "programa": "Comença la visita a l’olivar. La cura del camp, la collita, el paisatge. Després, anirem a visitar l’almàssera del mas de La Canaleta on se’ns explicarà com es feia l’extracció de l’oli antigament. Farem una parada per esmorzar i podrem gaudir dels productes típics del poble amb l’oli, que és l’essència de la visita. En acabar, coneixerem les instal·lacions de l’almàssera per veure el seu funcionament i com s’elabora l’oli de La Torre.",
   "parades": [
    {
     "hora": "10:20",
     "titol": "Visita a l’Olivar",
     "explicacio": "Explicació sobre la cura de l'olivar, la collita i el paisatge.",
     "linies": [
      439,
      441
     ]
    },
    {
     "hora": "11:00",
     "titol": "Visita a l'Almàssera del mas de la Canaleta",
     "explicacio": "Explicació del procés d'extracció d'oli. Amb material audiovisual.",
     "linies": [
      442,
      444
     ]
    },
    {
     "hora": "12:00",
     "titol": "Esmorzar",
     "explicacio": "Degustació gastronòmica: Pa i oli, pericana, embotit ...",
     "linies": [
      445,
      447
     ]
    },
    {
     "hora": "13:00",
     "titol": "Visita a l'Almàssera de la Cooperativa",
     "explicacio": "Explicació del procés d'extracció d'oli. Amb material audiovisual.",
     "linies": [
      448,
      450
     ]
    }
   ],
   "linies": {
    "eix": 438,
    "lema": 413,
    "programa": [
     414,
     424
    ],
    "mida": 455
   }
  },
  {
   "numero": 5,
   "eix": "SOM POBLE",
   "lema": "Tastar el poble.",
   "temps": "8 h",
   "distancia": "2 km",
   "pagina": 12,
   "programa": "Comencem la visita a la Plaça Major on es troben alguns dels comerços tradicionals del poble. Visitarem els forns de llenya i les carnisseries en les quals s’elaboren els embotits artesans. Després farem un passeig pel poble antic que acabarà a les eres de batre des d’on podrem contemplar el paisatge de la vall. A l’hora de dinar tindrem l’oportunitat de tastar alguns dels productes típics de la gastronomia local i acabarem visitant l’Almàssera de la cooperativa on ens explicaran el procés d’elaboració de l’oli de La Torre.",
   "parades": [
    {
     "hora": "10:00",
     "titol": "Visita als Forns de llenya",
     "explicacio": "Veurem com es cou el pa, mentre parlem amb el forner.",
     "linies": [
      508,
      510
     ]
    },
    {
     "hora": "11:00",
     "titol": "Visita a les Carnisseries",
     "explicacio": "Explicació de l'procés d'elaboració d'embotit típic.",
     "linies": [
      511,
      513
     ]
    },
    {
     "hora": "12:00",
     "titol": "Passeig fins les Eres de batre",
     "explicacio": "Explicació del procés de treball amb les eines tradicionals.",
     "linies": [
      514,
      516
     ]
    },
    {
     "hora": "14:00",
     "titol": "Dinar",
     "explicacio": "Degustació gastronòmica: Pa i oli, pericana, embotit ...",
     "linies": [
      517,
      519
     ]
    },
    {
     "hora": "16:00",
     "titol": "Visita a l'Almàssera",
     "explicacio": "Explicació del procés d'extracció d'oli. Amb material audiovisual.",
     "linies": [
      520,
      522
     ]
    }
   ],
   "linies": {
    "eix": 507,
    "lema": 544,
    "programa": [
     545,
     557
    ],
    "mida": 558
   }
  },
  {
   "numero": 6,
   "eix": "SOM PAISATGE",
   "lema": "Sabors de natura.",
   "temps": "8 h",
   "distancia": "6 km",
   "pagina": 14,
   "programa": "Comença la visita a l’olivar. La cura del camp, la collita, el paisatge. Des del camp anirem a fer la ruta de senderisme que recorre la serra de El Rentonar fins al pou de la neu. En acabar la ruta de muntanya, anirem a visitar l’almàssera del mas de La Canaleta on se’ns explicarà com es feia l’extracció de l’oli antigament. Farem una parada per dinar i podrem gaudir dels productes típics del poble amb l’oli, que és l’essència de la visita. En acabar el dinar coneixerem les instal·lacions de l’almàssera per veure el seu funcionament i com s’elabora l’oli de La Torre.",
   "parades": [
    {
     "hora": "10:20",
     "titol": "Visita a l’Olivar",
     "explicacio": "Explicació sobre la cura de l'olivar, la collita i el paisatge.",
     "linies": [
      597,
      599
     ]
    },
    {
     "hora": "11:00",
     "titol": "Excursió al Pou de la Neu",
     "explicacio": "Es visitarà tant el paratge natural del Rentonar com el Pou de la Neu.",
     "linies": [
      600,
      602
     ]
    },
    {
     "hora": "13:00",
     "titol": "Visita a l'Almàssera del mas de la Canaleta",
     "explicacio": "Explicació del procés d'extracció d'oli. Amb material audiovisual.",
     "linies": [
      603,
      605
     ]
    },
    {
     "hora": "14:00",
     "titol": "Dinar",
     "explicacio": "Degustació gastronòmica: Pa i oli, pericana, embotit ...",
     "linies": [
      606,
      608
     ]
    },
    {
     "hora": "16:00",
     "titol": "Visita a l'Almàssera de la Cooperativa",
     "explicacio": "Explicació del procés d'extracció d'oli. Amb material audiovisual.",
     "linies": [
      609,
      611
     ]
    }
   ],
   "linies": {
    "eix": 596,
    "lema": 648,
    "programa": [
     649,
     663
    ],
    "mida": 665
   }
  }
 ],
 "recursos": [
  {
   "pagina": 15,
   "id": "recurs-15-el-poble",
   "nom": "El Poble",
   "adreca": "La Torre de les Maçanes, l’Alacantí",
   "establiments": false,
   "linies": {
    "nom": 697,
    "adreca": 711
   }
  },
  {
   "pagina": 16,
   "id": "recurs-16-la-casa-alta",
   "nom": "La Casa Alta",
   "adreca": "Carrer del Castell, La Torre de les Maçanes, l’Alacantí",
   "establiments": false,
   "linies": {
    "nom": 732,
    "adreca": 762
   }
  },
  {
   "pagina": 17,
   "id": "recurs-17-la-foia-de-cortes",
   "nom": "La Foia de Cortés",
   "adreca": "Carrer de l’Abadia, La Torre de les Maçanes, l’Alacantí",
   "establiments": false,
   "linies": {
    "nom": 787,
    "adreca": 821
   }
  },
  {
   "pagina": 18,
   "id": "recurs-18-esglesia-de-santa-anna",
   "nom": "Església de Santa Anna",
   "adreca": "Plaça de l’Església, La Torre de les Maçanes, l’Alacantí",
   "establiments": false,
   "linies": {
    "nom": 846,
    "adreca": 880
   }
  },
  {
   "pagina": 19,
   "id": "recurs-19-la-font-del-poble",
   "nom": "La Font del poble",
   "adreca": "Av. d’Espanya, La Torre de les Maçanes, l’Alacantí",
   "establiments": false,
   "linies": {
    "nom": 902,
    "adreca": 933
   }
  },
  {
   "pagina": 20,
   "id": "recurs-20-llavador-municipal-el-bassi",
   "nom": "Llavador municipal. El Bassi",
   "adreca": "Av. d’Espanya, La Torre de les Maçanes, l’Alacantí",
   "establiments": false,
   "linies": {
    "nom": 954,
    "adreca": 984
   }
  },
  {
   "pagina": 21,
   "id": "recurs-21-llavador-del-riu",
   "nom": "Llavador del riu",
   "adreca": "Riu de La Torre, prop del Parc Municipal, La Torre de les Maçanes, l’Alacantí",
   "establiments": false,
   "linies": {
    "nom": 1007,
    "adreca": 1039
   }
  },
  {
   "pagina": 22,
   "id": "recurs-22-la-font-major-i-el-maleco",
   "nom": "La Font Major i el Malecó",
   "adreca": "Parc Municipal, la Font Major, el Malecó i l’antic llavador. La Torre de les Maçanes, l’Alacantí",
   "establiments": false,
   "linies": {
    "nom": 1061,
    "adreca": 1092
   }
  },
  {
   "pagina": 23,
   "id": "recurs-23-pou-de-la-neu-del-rentonar",
   "nom": "Pou de la Neu del Rentonar",
   "adreca": "Pou de la Neu de La Torre de les Maçanes, l’Alacantí",
   "establiments": false,
   "linies": {
    "nom": 1117,
    "adreca": 1152
   }
  },
  {
   "pagina": 24,
   "id": "recurs-24-les-eres-de-batre",
   "nom": "Les eres de batre",
   "adreca": "Eres de batre comunals a La Torre de les Maçanes, l’Alacantí",
   "establiments": false,
   "linies": {
    "nom": 1176,
    "adreca": 1209
   }
  },
  {
   "pagina": 25,
   "id": "recurs-25-moli-fariner-electric",
   "nom": "Molí Fariner Elèctric",
   "adreca": "Av. d’Espanya, 34 - La Torre de les Maçanes, l’Alacantí",
   "establiments": false,
   "linies": {
    "nom": 1231,
    "adreca": 1262
   }
  },
  {
   "pagina": 26,
   "id": "recurs-26-moli-fariner-hidraulic",
   "nom": "Molí Fariner Hidràulic",
   "adreca": "Camí de Xixona - La Torre de les Maçanes, l’Alacantí",
   "establiments": false,
   "linies": {
    "nom": 1282,
    "adreca": 1311
   }
  },
  {
   "pagina": 27,
   "id": "recurs-27-olivars-de-la-torre",
   "nom": "Olivars de La Torre",
   "adreca": "Cultiu de l'olivera en bancals amb marges de pedra seca, La Torre de les Maçanes, l’Alacantí",
   "establiments": false,
   "linies": {
    "nom": 1335,
    "adreca": 1368
   }
  },
  {
   "pagina": 28,
   "id": "recurs-28-almassera-oli-de-la-torre",
   "nom": "Almàssera - OLI DE LA TORRE",
   "adreca": "Almàssera de La Torre, Coop. V. - Carrer Sant Isidre Llaurador, 18",
   "establiments": false,
   "linies": {
    "nom": 1389,
    "adreca": 1419
   }
  },
  {
   "pagina": 29,
   "id": "recurs-29-almassera-de-la-canaleta",
   "nom": "Almàssera de La Canaleta",
   "adreca": "Mas de La Canaleta - Ctra. Benifallim, km 8,5",
   "establiments": false,
   "linies": {
    "nom": 1440,
    "adreca": 1470
   }
  },
  {
   "pagina": 30,
   "id": "recurs-30-mas-de-la-canaleta",
   "nom": "Mas de La Canaleta",
   "adreca": "Mas de La Canaleta - Ctra. Benifallim, km 8,5",
   "establiments": false,
   "linies": {
    "nom": 1490,
    "adreca": 1519
   }
  },
  {
   "pagina": 31,
   "id": "recurs-31-els-forns-de-pa",
   "nom": "Els Forns de pa",
   "adreca": null,
   "establiments": true,
   "linies": {
    "nom": 1540,
    "adreca": null
   }
  },
  {
   "pagina": 32,
   "id": "recurs-32-les-carnisseries",
   "nom": "Les Carnisseries",
   "adreca": null,
   "establiments": true,
   "linies": {
    "nom": 1595,
    "adreca": null
   }
  },
  {
   "pagina": 33,
   "id": "recurs-33-els-restaurants",
   "nom": "Els Restaurants",
   "adreca": null,
   "establiments": true,
   "linies": {
    "nom": 1643,
    "adreca": null
   }
  }
 ]
});
