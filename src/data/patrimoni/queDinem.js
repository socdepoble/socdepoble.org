/* «Què dinem?» · receptari de l'Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta»
   (Muro, El Comtat, 2019; dipòsit legal A 373-2019). Text i làmines amb permís d'ús (el Llibre Mestre recull que
   el PDF arriba «amb tots els permisos d'ús de text i imatges», declaració del Mestre); vídeos del canal
   «Sangonereta Gastronomia».

   FITXER GENERAT per tooling/patrimoni/genera-que-dinem.mjs: no l'edites a mà, torna'l a generar.
   - 149 receptes, les de l'índex del llibre (p. 3-5), amb el títol i la pàgina de l'índex i l'apartat on les posa.
   - Ingredients, preparació i notes: text literal del PDF (cada línia hi és lletra a lletra a les pàgines de la
     recepta; el generador ho comprova). Les notes són les notes al peu, sense el número de crida ni la frase que
     remet al canal de YouTube (el vídeo va al camp youtubeId).
   - youtubeId: l'identificador que el PDF imprimix a la pàgina de la recepta. lamina: la WebP de la pàgina.
   - LAMINES_QUE_DINEM: la pàgina del llibre on és impresa cada làmina (no sempre la primera de la recepta) i les
     mides de la WebP (ample i alt, per a reservar-ne el lloc); laminaDeRecepta(recepta) les ajunta.
   - Cap camp per damunt del llibre: només el que el PDF dona per a cada recepta (text, vídeo i làmina).
   - ISBN: el que hi ha imprés té 14 dígits i no és vàlid; es conserva literal amb isbnValid: false.
   Empremtes: PDF 399d2f54abdba0fb4c75f0e4d1b60744f2b19ed0bdf781ae186e5758bc86fddd (SHA-256). */

/**
 * @typedef {{ titol: string|null, linies: string[] }} BlocDeRecepta
 * @typedef {{ numero: number, slug: string, titol: string, pagina: number, pagines: number[],
 *   apartat: 'entrades'|'plats'|'postres'|'licors', ingredients: BlocDeRecepta[], preparacio: BlocDeRecepta[],
 *   notes: string[], youtubeId: string|null, lamina: string|null }} ReceptaQueDinem
 */

const congela = (valor) => {
  if (valor && typeof valor === 'object') {
    Object.values(valor).forEach(congela);
    Object.freeze(valor);
  }
  return valor;
};

export const OBRA_QUE_DINEM = congela({
  "titol": "Què dinem?",
  "associacio": "Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta»",
  "lloc": "Muro, El Comtat",
  "any": 2019,
  "dipositLegal": "A 373-2019",
  "isbnImpres": "978 84 09 131910 1",
  "isbnValid": false,
  "pdf": "/assets/uploads/patrimoni/que-dinem/llibre-que-dinem.pdf",
  "pdfBytes": 7560366,
  "permis": "Text i làmines amb permís d’ús.",
  "canalVideos": "Sangonereta Gastronomia",
  "apartats": [
    {
      "id": "entrades",
      "titol": "Entrades, tares calentes i fredes, salses i condiments segons època de l’any",
      "pagina": 8
    },
    {
      "id": "plats",
      "titol": "Plats calents i freds de carn/peix, segons època de l’any",
      "pagina": 55
    },
    {
      "id": "postres",
      "titol": "Postres i pastes, segons època de l’any",
      "pagina": 115
    },
    {
      "id": "licors",
      "titol": "Licors, segons època de l’any",
      "pagina": 156
    }
  ]
});

/** @type {ReadonlyArray<ReceptaQueDinem>} */
export const RECEPTES_QUE_DINEM = congela([
  {
    "numero": 1,
    "slug": "pa-rustic",
    "titol": "Pa rústic",
    "pagina": 9,
    "pagines": [
      9
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 kg de farina de força",
          "700 mil·lilitres aigua tèbia",
          "25 grams de llevat fresc",
          "20 grams de sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, desfeu el llevat i barregeu-ho amb la farina. A continuació, afegiu-hi la farina i pasteu-ho tot ben pastat. Tot seguit, afegiu-hi l’aigua tèbia a la farina, a poc a poc, i pasteu-ho tot bona cosa fins que la farina i l’aigua estiguen ben lligades, tot formant una bona pasta. Pasteu-la, tot estirant-la, doblegueu-la, torneu-la a estirar i doblegar, uns 15 minuts, sense parar fins que la pasta no s’enganxe als dits. En tenir-la ben pastada, deixeu-la dins d’una safa i tapeu-la i deixeu-la reposar unes 2 hores, aproximadament, fins que es faça bona; és a dir, en tenir el doble de la seua grandària. En passar aquest temps, escampeu un poc de farina sobre el banc de la cuina i poseu-hi la pasta bona i escampeu-la i doneu-li una forma rectangular. Doblegueu la pasta per la meitat i després l’altra meitat i uniu les dos juntes i finalment feu redona la pasta fins donar-li la forma de pa tradicional. En tenir-ho tot llest, enceneu el forn a 250 graus, poseu-hi un recipient amb aigua i deixeu el pa dins del forn uns 10 minuts. No feu servir el ventilador. Després, rebaixeu el forn a 230 graus durant 35 minuts, aproximadament, retireu el recipient d’aigua i, finalment, apagueu el forn i deixeu la porta entreoberta, perquè el pa s’acabe de coure."
        ]
      }
    ],
    "notes": [
      "Amb el pa dur, també podeu fer Miques. Ingredients: pa dur; alls tendres o secs fregits; oli d’oliva i sal. Preparació: En primer lloc, partiu el pa dur a trossos i poseu-los a remulla en aigua i seguidament, deixeu que s’escórrega ben escorregut. A continuació, sofregiu els alls i afegiu-hi el pa escorregut i remeneu tots els ingredients fins que el pa quede solt i daurat i ja tindreu el plat preparat. També podeu afegir-hi trossos de llonganissa, cansalada, cuixot, etc. Cf. també les Sopetes, a les postres, ja que també es fan amb pa."
    ],
    "youtubeId": "Qcml4Zi8n8A",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p009.webp"
  },
  {
    "numero": 2,
    "slug": "caragols-amb-tomaca",
    "titol": "Caragols amb tomaca",
    "pagina": 10,
    "pagines": [
      10
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Caragols",
          "Tomaca",
          "Ceba",
          "Oli",
          "Herba-sana",
          "Pebre roig",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, enganyeu els caragols: poseu els caragols en un perol amb aigua calenta, perquè solten tots els seus excrements i que traguen la molla. Poseu-hi, també sal perquè solten els mocs i les baves. Feu-ho unes quantes vegades fins que estiguen ben nets. En tenir-los enganyats, poseu a sofregir l’oli amb la ceba trossejada i posteriorment hi afegiu la tomaca. Seguidament, el pebre roig, l’herba-sana i la sal i remeneu-ho tot. Deixeu-ho coure tot a foc lent, al llarg d’una hora, aproximadament."
        ]
      }
    ],
    "notes": [
      "Les receptes dels caragols presenten moltes variants, com ara la que us presentem tot seguit: en tenir-los enganyats i nets, bulliu-los, en una cassola, un parell d’hores amb una cabeça d’alls i un bon manoll de fenoll i en estar cuits afegiu-hi un sofregit de ceba, tomaca i una punta de pebre roig picant, que ja haureu preparat, i deixeu que s’acaben de fer. Finalment, afegiu-hi un pessic d’herba-sana, deixeu-ho reposar i escudelleu-los."
    ],
    "youtubeId": "xj3i3YcULw8",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p010.webp"
  },
  {
    "numero": 3,
    "slug": "espigues-torrades",
    "titol": "Espigues torrades",
    "pagina": 11,
    "pagines": [
      11
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Espigues de dacsa",
          "Oli",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, peleu les espigues; és a dir, lleveu-les els pallocs i poseu-les a torrar al foc o a les brases i en mascarar-se les espigues, retireu-les del foc o de les brases. Finalment, afegiu-hi oli i sal al gust i ja són bones de menjar."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p011.webp"
  },
  {
    "numero": 4,
    "slug": "dacsa-fregida",
    "titol": "Dacsa (panís) fregida",
    "pagina": 12,
    "pagines": [
      12
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Dacsa blanca o groga",
          "Oliva d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, poseu en una paella oli en abundància a calfar i en estar ben calent, afegiu-hi la dacsa blanca o groga. Vigileu-la i, en pocs minuts, la tindreu feta."
        ]
      }
    ],
    "notes": [
      "Hi ha dacsa groga (dolça) i dacsa blanca o panís. Totes dues poden ser fregides."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p012.webp"
  },
  {
    "numero": 5,
    "slug": "allioli",
    "titol": "Allioli (alls durs)",
    "pagina": 13,
    "pagines": [
      13
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "2 alls grossos (o 3 xicotets)",
          "1 ou",
          "1 got gran d’oli d’oliva o de gira-sol",
          "1 pessic de sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, poseu en un pitxer de la batedora el pessic de sal primer, davall de tot. Seguidament, poseu-hi la resta d’ingredients; és a dir, els dos alls pelats i trossejats, el got gran d’oli d’oliva o de gira-sol i l’ou. Poseu en marxa la batedora i en pocs minuts estarà feta la salsa d’allioli."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "8iEDAK02GRI",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p013.webp"
  },
  {
    "numero": 6,
    "slug": "amanida-de-tomaca-all-i-tonyina",
    "titol": "Amanida de tomaca, all i tonyina",
    "pagina": 14,
    "pagines": [
      14
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Tomaques",
          "All trossejat",
          "1 pot de tonyina",
          "Oli",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu les tomaques i talleu-les a trossos, afegiu-hi els alls trossejats, el pot de tonyina i oli i sal al gust. Finalment, disposeu tots els ingredients en un plat i serviu-lo."
        ]
      }
    ],
    "notes": [
      "Podeu fer amanides de qualsevol cosa: fulles d’encisam, ceba, trossos de carlotes, etc. Li afegiu vinagre, oli d’oliva i sal i llestos; o fer, com ara una amanida de carlotes i flors de lligabosc: ingredients: 4 cullerades d’oli d’oliva; 1 cullerada de vinagre; 1 all xafat; 1/4 de cullerada de mostassa; pebre molt; sal; carlotes; un poc de sucre; flors de lligabosc. Preparació: en primer lloc, prepareu l’adob amb l’oli d’oliva, el vinagre, l’all xafat, la cullerada de mostassa, el pebre molt i la sal i reserveu-ho tot. A continuació, feu bullir 5 minuts la carlota amb un poc de sucre, que ja haureu pelat i tallat a tiretes, i en estar bullides afegiu-hi l’adob. Finalment, deixeu-ho reposar tot unes quantes hores, perquè en prenguen el gust. En la presentació, afegiu-hi les flors de lligabosc que ja haureu preparat, tot tallant-les la part verda."
    ],
    "youtubeId": "5wbFXYfz1iQ",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p014.webp"
  },
  {
    "numero": 7,
    "slug": "conserva-de-tomaca",
    "titol": "Conserva de tomaca",
    "pagina": 15,
    "pagines": [
      15
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Tomaques madures",
          "Pots de vidre per a fer la conserva",
          "1 perol gran per a poder bullir els pots de tomaca"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, poseu en una safa, un poal o un recipient gran les tomaques madures. Al mateix temps, poseu a calfar aigua i, en estar bullint, escaldeu les tomaques; és a dir, afegiu l’aigua bullint a la safa, al poal o al recipient gran que heu triat. Seguidament, peleu les tomaques i lleveu-ne la cueta i a continuació, poseu els trossos de tomaca en pots de vidre i tanqueu-los ben tancats. Paral·lelament, prepareu un perol ben gran per poder introduir-hi els pots de vidre. En tindre tots els pots de vidre plens de tomaca, poseu-los dins del perol i ompliu-lo d’aigua fins tapar els pots. Enceneu el foc, a mitja flama, i deixeu-lo bullir 2 hores i ja estarà la conserva feta."
        ]
      }
    ],
    "notes": [
      "Tot seguint aquest procediment, podeu fer conserva de bajoquetes del filet o esclata-sangs, per exemple. Els fesols o els cigrons, per exemple, els heu de bullir primer i introduïu-los després en pots ben tancats i bulliu-los al perol, com ara la conserva de tomaca. Les bresquilles en almívar també segueixen aquest procediment: una vegada trossejada la bresquilla, poseu-la dins de pots de vidre amb aigua i sucre. Tanqueu els pots i a bullir, com ara la conserva de tomaca. Aquest dolç dura tot l’any."
    ],
    "youtubeId": "j7BFmZ2xlXY",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p015.webp"
  },
  {
    "numero": 8,
    "slug": "aigua-sal",
    "titol": "Aigua-sal (salmorra)",
    "pagina": 16,
    "pagines": [
      16
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Olives blanquetes o mançanelles",
          "Pebrella",
          "Llima",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "A finals de novembre o principis de desembre, poseu les olives blanquetes en un gerro, un recipient gran o un poal i afegiu-hi aigua de naixement i canvieu-la cada dos o tres dies. En notar que l’oliva es troba dolça, afegiu-hi la pebrella, la llima i la sal, per a amerar-les. Deixeu-ho reposar dos o tres mesos i ja seran bones de menjar."
        ]
      }
    ],
    "notes": [
      "També podeu fer aigua-sal de tàperes i taperots, de raïm de pastor, de cebes, de carlotes (safanòries), cogombrets, de vitets (visolets), etc., tot seguint el mateix procediment i ficant-hi vinagre a l’envàs final."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p016.webp"
  },
  {
    "numero": 9,
    "slug": "olives-blanquetes",
    "titol": "Olives blanquetes",
    "pagina": 17,
    "pagines": [
      17
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Olives blanquetes o mançanelles trencades",
          "Aigua de naixement",
          "Pebrella",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "A finals de novembre o principis de desembre, trenqueu les olives, tot fent sevir una pedra plana, una massa, etc., i deixeu-les en un gerro, un poal o un recipient gran i afegiu-hi aigua de naixement. Canvieu l’aigua cada dos o tres dies i en notar-les dolces, canvieu l’aigua i afegiu-hi la pebrella i la sal al gust. Dues setmanes després, ja seran bones de menjar."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p017.webp"
  },
  {
    "numero": 10,
    "slug": "olives-mancanelles-en-sosa",
    "titol": "Olives mançanelles en sosa",
    "pagina": 18,
    "pagines": [
      18
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Olives mançanelles en sosa",
          "Sosa",
          "Aigua sense clor",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Per novembre, poseu les olives mançanelles en un gerro o un recipient gran i afegiu-hi tant d’aigua per tant de sosa; és a dir, depenent de l’aigua que li afegiu al recipient, posareu el mateix de sosa. Deixeu reposar el recipient una setmana, i en trobar dolces les olives, canvieu l’aigua i afegiu-hi sal al gust."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p018.webp"
  },
  {
    "numero": 11,
    "slug": "olives-negretes-madures",
    "titol": "Olives negretes madures",
    "pagina": 19,
    "pagines": [
      19
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Olives negretes madures",
          "Aigua sense clor",
          "Llorer o timó",
          "Llima tallada",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "A finals de gener, i una vegada collida l’oliva, poseu les olives en un gerro, un poal o un recipient i afegiu-hi aigua sense clor, de naixement, i canvieu l’aigua cada dos dies fins el mes d’abril, aproximadament. Una vegada treta l’amargor, canvieu l’aigua i afegiu-hi les fulles de llorer (o el timó), les llimes tallades per la meitat i sal i deixeu-ho així un parell de mesos fins al juny, més o menys, que ja són bones de menjar."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p019.webp"
  },
  {
    "numero": 12,
    "slug": "creilles-al-forn",
    "titol": "Creïlles al forn",
    "pagina": 20,
    "pagines": [
      20
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Creïlles",
          "Oli d’oliva",
          "Orenga",
          "Pebre roig"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, talleu les creïlles per la meitat i ratlleu-les amb el ganivet. Seguidament, poseu-hi per damunt l’oli, l’orenga i el pebre roig. Enceneu el forn i poseu-lo a 200 graus i introduïu-hi les creïlles durant 30 minuts i ja seran bones de menjar. Aquest plat sol anar acompanyat de les aletes i cuixes de pollastre (cf.), explicades a la recepta següent."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p020.webp"
  },
  {
    "numero": 13,
    "slug": "aletes-i-cuixes-de-pollastre",
    "titol": "Aletes i cuixes de pollastre",
    "pagina": 21,
    "pagines": [
      21
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Aletes i cuixes de pollastre",
          "Vinagre",
          "2 mesures d’oli d’oliva",
          "1 gotet xicotet de vi",
          "1 culet d’aigua",
          "Pebre roig picant"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu una safata i poseu les aletes i les cuixes de pollastre amb vinagre, uns 15 minuts aproximadament. A continuació, agafeu una rostidora per al forn i afegiu-hi tots els ingredients; és a dir, les dues mesures d’oli d’oliva, el gotet xicotet de vi, el culet d’aigua i el pebre roig picant. En tenir-ho tot apunt, agafeu les aletes i les cuixes i refregueu-les amb tots els ingredients, ben refregades, i disposeu-les per la rostidora uniformement. Finalment, enceneu el forn, a 200 graus, unes dues hores, aproximadament, i, de tant en tant, mireu-les i menegeu-les, perquè no es cremen. Aquest plat sol anar acompanyat de les creïlles al forn (cf.), explicades a la recepta anterior."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p021.webp"
  },
  {
    "numero": 14,
    "slug": "esclata-sangs-torrats",
    "titol": "Esclata-sangs (rovellons) torrats",
    "pagina": 22,
    "pagines": [
      22
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Esclata-sangs",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu una paella i poseu-la a calfar. En estar calenta, poseu-hi els esclata-sangs i afegiu-hi oli per damunt. Vigileu-los, perquè no es cremen i en pocs minuts, estaran llestos per a menjar. En la presentació, poseu-hi sal al gust."
        ]
      }
    ],
    "notes": [
      "Podeu veure l’elaboració d’aquesta recepta, però al forn, en el nostre canal de Youtube:",
      "També n’hi ha qui posa esclata-sangs a la paella d’arròs, en companyia de la resta de les verdures, etc. Cf. Paella d’arròs. Un exemple: arròs caldós amb esclata-sangs. Ingredients: esclata-sangs trossejats; ceba trossejada; pebre roig; fesols tendres; un grapat d’arròs per persona; safrà; oli d’oliva; sal. Preparació: En primer lloc, sofregiu, en una cassola, la ceba, els esclata-sangs i finalment el pebre roig. A continuació, Afegiu-hi aigua fins els botons i deixeu que bulla. Tot seguit, rebaixeu el foc al mínim i afegiu-hi els fesols tendres, l’arròs, el safrà i saleu al vostre gust. Finalment, deixeu que s’acabe de fer."
    ],
    "youtubeId": "xBAv9FYHDUE",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p022.webp"
  },
  {
    "numero": 15,
    "slug": "xampinyons-fregits-amb-allets",
    "titol": "Xampinyons fregits amb allets",
    "pagina": 23,
    "pagines": [
      23
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Xampinyons",
          "Alls secs",
          "Oli d’oliva",
          "Sal",
          "Aigua"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu els alls secs i aixafeu-los. Seguidament, agafeu una paella i poseu-hi l’oli, un poc d’aigua, un pessic de sal, els xampinyons rentats i trossejats i els alls aixafats. Finalment, enceneu el foc, a una flama moderada, i col·loqueu la paella al damunt durant mig hora."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p023.webp"
  },
  {
    "numero": 16,
    "slug": "rubiols-fregits-amb-allets",
    "titol": "Rubiols (bolets de xop) fregits amb allets",
    "pagina": 24,
    "pagines": [
      24
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Rubiols (bolets de xop)",
          "Alls tendres",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, renteu els bolets i talleu els alls tendres en curt; és a dir, a trosses xicotets. A continuació, agafeu una paella i poseu a calfar l’oli d’oliva. En estar ben calent l’oli, afegiu-hi els bolets i tot seguit els alls tendres. Vigileu que no es cremen. Finalment, en la presentació, afegiu-hi sal al gust."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p024.webp"
  },
  {
    "numero": 17,
    "slug": "cacaus-fregits",
    "titol": "Cacaus fregits",
    "pagina": 25,
    "pagines": [
      25
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Cacaus",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, poseu a calfar oli d’oliva en una paella. En estar ben calent l’oli, afegiu-hi els cacaus i vigileu que no es cremen. Finalment, en la presentació afegiu-hi sal al gust."
        ]
      }
    ],
    "notes": [
      "Aquesta descripció correspon a cacaus amb pell, però també es poden fregir sense pell. Per a fregir-los sense pell, primer s’han d’escaldar (passeu-los aigua bullint per damunt) i una vegada escaldats, es frigen. El mateix plantejament val per a les ametles, tant fregides amb pell, com fregides escaldades."
    ],
    "youtubeId": "c0r0RBW5tqM",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p025.webp"
  },
  {
    "numero": 18,
    "slug": "cacaus-torrats",
    "titol": "Cacaus torrats",
    "pagina": 26,
    "pagines": [
      26
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Cacaus",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, poseu el forn a calfar a 200 graus. Mentre el forn es calfa, agafeu els cacaus banyeu-los amb aigua i col·loqueu-los en una llanda per al forn. A continuació, afegiu-hi sal per damunt i com estan banyats, s’enganxarà als cacaus. Finalment, introduïu la llanda al forn, mitja hora aproximadament, i vigileu que no es cremen, ja que la mateixa calentor residual del cacau farà que es puga cremar. Paga la pena traure’ls un poc abans d’estar bons, perquè s’acaben de fer mentre es refreden."
        ]
      }
    ],
    "notes": [
      "Aquesta descripció correspon a cacaus amb pell, però també es poden posar al forn sense pell. Primer s’han d’escaldar (passeu-los aigua bullint per damunt) i una vegada escaldats, es posen al forn. El mateix plantejament val per a les ametles, tant amb pell com escaldades. Es fan al forn seguint la mateixa manera que el cacau."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p026.webp"
  },
  {
    "numero": 19,
    "slug": "sang-amb-ceba",
    "titol": "Sang amb ceba",
    "pagina": 27,
    "pagines": [
      27
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Sang bullida",
          "Mig quilo de tomaca desfeta",
          "1 ceba grossa picada",
          "1 all sec picat",
          "Julivert tendre picat",
          "1 mesura d’oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, talleu la sang cuita a daus i sofregiu, en una paella, la ceba i la tomaca desfeta. Seguidament, afegiu-hi la sang i, quan l’aigua de la tomaca es consumesca, afegiu-hi l’all sec picat, el julivert tendre i picat i la sal al gust."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p027.webp"
  },
  {
    "numero": 20,
    "slug": "fetge-o-magre-fregit",
    "titol": "Fetge o magre fregit",
    "pagina": 28,
    "pagines": [
      28
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Fetge (o magre)",
          "Alls tendres (alls secs, opcional)",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, poseu oli d’oliva a calfar en una paella. Seguidament, agafeu el fetge o el magre, o tots dos, i talleu-lo a trossos xicotets. El mateix fareu amb els alls tendres, si és el cas. Si feu servir els alls secs, no cal pelar-los. En estar l’oli ben calent, afegiu-hi el fetge o el magre, els alls tendres o els alls secs, segons el cas i vigileu que no es creme res. Finalment, en la presentació, afegiu-hi sal al gust."
        ]
      }
    ],
    "notes": [
      "Aquest plat es pot presentar tot sol (fetge) o barrejat de magre i fetge."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p028.webp"
  },
  {
    "numero": 21,
    "slug": "mandonguilles-de-carn",
    "titol": "Mandonguilles de carn",
    "pagina": 29,
    "pagines": [
      29
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Carn picada de porc i de vedella",
          "Pinyonets",
          "Julivert",
          "All picat",
          "Oli d’oliva",
          "Ceba a trossets",
          "Tomaca desfeta",
          "Canella",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, pasteu la carn capolada amb els pinyonets, el julivert, l’all, que ja haureu picat, la canella i la sal al gust, tot fent pilotetes. A continuació, poseu a calfar l’oli i sofregiu la ceba i en estar sofregida, afegiu-hi les mandonguilles i una tomaca desfeta per damunt i rebaixeu el foc al mínim. Finalment, vigileu-les 15 o 20 minuts i estaran bones."
        ]
      }
    ],
    "notes": [
      "N’hi ha moltes variants de preparació. La fotografia il·lustra una forma de preparar-les diferent: estan cuites en una cassola amb diverses verduretes, com ara carlotetes, etc."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p029.webp"
  },
  {
    "numero": 22,
    "slug": "mandonguilles-de-bacalla",
    "titol": "Mandonguilles de bacallà",
    "pagina": 30,
    "pagines": [
      30
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Bacallà",
          "2 creïlles",
          "2 fulles de llorer",
          "2 Alls",
          "Julivert",
          "2 ous",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, haureu deixat 2 dies en remulla el bacallà, per a traure-li la sal (de tant en tant, canvieu l’aigua fins complir els 2 dies). El dia de la preparació, bulliu el bacallà i posteriorment, en una cassola, afegiu les 2 creïlles, que ja haureu rentat i pelat, les 2 fulles de llorer i ho deixeu bullir tot. En estar les creïlles bones, agafeu tots els ingredients i desfeu-los: lleveu les espines del bacallà, esclafeu les creïlles, (passeu pel morter els alls i el julivert i afegiu-ho a les creïlles desfetes) i pasteu-ho tot. A continuació, afegiu-hi 2 ous i formeu les pilotetes. Finalment, fregiu-les amb oli d’oliva ben calent a la fregidora i vigileu-les."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p030.webp"
  },
  {
    "numero": 23,
    "slug": "mandonguilles-d-aladroc",
    "titol": "Mandonguilles d’aladroc",
    "pagina": 31,
    "pagines": [
      31
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Aladroc",
          "2 creïlles",
          "2 fulles de llorer",
          "2 Alls",
          "Julivert",
          "2 ous",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, netegeu l’aladroc i li lleveu el cap i les espines i el bulliu en una cassola en companyia de 2 creïlles, que ja haureu rentat i pelat, i 2 fulles de llorer. En estar les creïlles bones, agafeu tots els ingredients i desfeu-los: l’aladroc, esclafeu les creïlles, (passeu pel morter els alls i el julivert i afegiu-ho a les creïlles desfetes) i pasteu-ho tot. A continuació, afegiu-hi 2 ous i formeu les pilotetes. Finalment, fregiu-les amb oli d’oliva ben calent a la fregidora i vigileu-les."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p031.webp"
  },
  {
    "numero": 24,
    "slug": "costelles-de-vedella",
    "titol": "Costelles de vedella",
    "pagina": 32,
    "pagines": [
      32
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Costelles de vedella",
          "Carlotetes (safanòries) o verdures al gust",
          "Oli d’oliva",
          "Espècies al gust",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu una llanda per al forn i poseu els trossos de vedella, les carlotes, alguna espècia, com ara orenga o pebre negre, espolsada per damunt i un rall d’oli per damunt de tots els ingredients. Seguidament, introduïu la llanda al forn calent, a 200 graus, uns ¾ d’hora aproximadament, i vigileu que no es creme. En la presentació, poseu-hi sal al gust."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p032.webp"
  },
  {
    "numero": 25,
    "slug": "calamars-arrebossats",
    "titol": "Calamars arrebossats",
    "pagina": 33,
    "pagines": [
      33
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Anelles de calamars",
          "Farina per a arrebossar",
          "Llimonada (gasosa)",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu les anelles de calamar i banyeu-les amb llimonada (gasosa); això es fa, perquè s’enganxe la farina al calamar. Seguidament, arrebosseu-les amb la farina d’arrebossar i fregiu-les amb oli d’oliva ben calent, a la fregidora. Finalment, vigileu-les, perquè no es cremen."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p033.webp"
  },
  {
    "numero": 26,
    "slug": "calamars-xicotets-arrebossats",
    "titol": "Calamars xicotets arrebossats",
    "pagina": 34,
    "pagines": [
      34
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Calamars xicotets",
          "Farina per a arrebossar",
          "Llimonada (gasosa)",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu els calamarets i banyeu-los amb llimonada (gasosa); això es fa, perquè s’enganxe la farina al calamaret. Seguidament, arrebosseu-los amb la farina d’arrebossar i fregiu-los amb oli d’oliva ben calent, a la fregidora. Finalment, vigileu-leo, perquè no es cremen. En la presentació, feu servir llima al gust."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p034.webp"
  },
  {
    "numero": 27,
    "slug": "sepia-torrada",
    "titol": "Sèpia torrada",
    "pagina": 35,
    "pagines": [
      35
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Sèpia",
          "Oli d’oliva",
          "Julivert",
          "Sal",
          "Llima"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, poseu a calfar una paella i a continuació afegiu-hi un rall d’oli d’oliva. En estar la paella calenta, poseu-hi la sèpia i deixeu que es torre, tot fent-li voltes. En estar feta, presenteu-la amb un ratllet d’oli d’oliva per damunt, julivert picat i sal al gust. En la presentació, acompanyeu-la amb una llima tallada per la meitat."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p035.webp"
  },
  {
    "numero": 28,
    "slug": "capella-torrat",
    "titol": "Capellà torrat",
    "pagina": 36,
    "pagines": [
      36
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Capellans",
          "Oli d’oliva"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu capellans i poseu-los damunt del foc, a un flama moderada o forta i vigileu que no es cremen. En estar daurats, estaran bons. A continuació, desfeu els capellans en molles i presenteu-los amb oli d’oliva abundant, perquè els reste el salat dels capellans i ja seran bons de menjar."
        ]
      }
    ],
    "notes": [
      "Aquest pla també és presentat amb tomaca tallada a trossos."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p036.webp"
  },
  {
    "numero": 29,
    "slug": "pericana",
    "titol": "Pericana",
    "pagina": 37,
    "pagines": [
      37
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Bajoca roja llarga, callosina, de banya (de pericana) seca",
          "Alls secs",
          "Bacallà sec en molles",
          "Oli d’oliva"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu la bajoca seca i lleveu-li el mugró i totes les llavoretes i torreu-la al foc damunt d’una llanda, perquè no es creme. Feu el mateix amb els alls secs i després amb les molles de bacallà. A continuació, i en estar freds els ingredients, desfeu la bajoca a trossets molt menuts dins un bol de test i afegiu-hi els alls trossejats i les molles de bacallà. Seguidament, ompliu fins dalt el bol de test amb oli d’oliva, ja que la bajoca se’l beurà i torneu-ne a posar, però aquesta vegada menys fins que ja no se’l bega."
        ]
      }
    ],
    "notes": [
      "Les bajoques per a pericana, se’n venen seques; però també les podeu assecar: en estar roges i granades al bancal, colliu-les, i enrastreu-les (feu un rastre) amb fil de cotó o de palomar, tot cosint-les, i pengeu-les al sol, o a un lloc on li pegue l’aire, un mes com a mínim i ja estaran bones per a torrar. Antigament, la pericana es menjava per a dinar o per a sopar."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p037.webp"
  },
  {
    "numero": 30,
    "slug": "tomaques-seques-fregides",
    "titol": "Tomaques seques fregides",
    "pagina": 38,
    "pagines": [
      38
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Tomaques seques",
          "Oli d’oliva"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una paella i afegiu-hi bona cosa d’oli d’oliva i enceneu el foc. En estar l’oli ben calent, afegiu-hi les tomaques seques i deixeu que es facen. Finalment, en la presentació, acompanyeu el plat amb pa."
        ]
      }
    ],
    "notes": [
      "Podeu comprar les tomaques seques o assecar-les vosaltres mateixos. Agafeu tomaques ben madures, afegiu-les sal i deixeu-les al sol i a l’aire un parell de setmanes, com a mínim, i ja estaran bones per a fregir. Antigament, les tomaques seques es menjaven per a dinar o per a sopar."
    ],
    "youtubeId": "ADIV7rdbGoc",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p038.webp"
  },
  {
    "numero": 31,
    "slug": "morro-fregit",
    "titol": "Morro fregit",
    "pagina": 39,
    "pagines": [
      39
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Careta, orelles de porc",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu una paella amb abundant oli d’oliva i poseu-la a calfar. Mentre es calfa l’oli, renteu i talleu la careta del porc i les seues orelles a trosses xicotets. En estar ben calent l’oli, poseu els trossos dins la paella i vigileu que no es cremen. N’hi ha qui li agrada ben fets i els trossos acaben secs i d’altres, però, que els volen més tendrets. En qualsevol cas, en la presentació afegiu-hi sal per damunt i feu servir paper secant davall del plat, perquè absorbesca l’excés d’oli."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p039.webp"
  },
  {
    "numero": 32,
    "slug": "faves-bullides",
    "titol": "Faves bullides",
    "pagina": 40,
    "pagines": [
      40
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Faves seques",
          "1 cabeça d’alls secs",
          "Vitets (visolets)",
          "2 fulles de llorer",
          "Pebre roig",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, heu d’haver deixat les faves seques a remulla un mínim de dos dies. En passar aquest temps, agafeu una cassola i poseu a bullir aigua i afegiu-hi un rall d’oli d’oliva, les faves seques, la cabeça d’alls secs, els vitets, les fulles de llorer, el pebre roig i la sal. Deixeu que es coga tot uns ¾ d’hora, aproximadament i estaran bones."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p040.webp"
  },
  {
    "numero": 33,
    "slug": "faves-fregides",
    "titol": "Faves fregides",
    "pagina": 41,
    "pagines": [
      41
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Faves tendres",
          "Alls tendres (opcional)",
          "Ceba (opcional)",
          "Carxofes (opcional)",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, poseu a calfar l’oli d’oliva en una paella. A continuació, talleu els alls tendres, la ceba o les carxofes a trossos xicotets i en estar ben calent l’oli, afegiu-hi les faves i la resta d’ingredients. En la presentació, afegiu-hi sal al gust."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p041.webp"
  },
  {
    "numero": 34,
    "slug": "ventre-de-vedella",
    "titol": "Ventre de vedella",
    "pagina": 42,
    "pagines": [
      42
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Ventre de vedella o de bou",
          "1 cabeça d’alls secs",
          "2 fulles de llorer",
          "Pebre roig",
          "Vitets (visolets)",
          "Trossos de xoriç",
          "Oli d’oliva (una cullerada o dos)",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu una olla a pressió i afegiu-hi aigua, i en estar bullint, afegiu-hi tots els ingredients: el ventre, que ja haureu rentat, els alls secs, les fulles de llorer, el pebre roig, els visolets, els trossos de xoriç, l’oli d’oliva i la sal. Poseu el foc al mínim, com a mínim una hora i, en xiular l’olla a pressió, el ventre estarà bo."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p042.webp"
  },
  {
    "numero": 35,
    "slug": "ventre-de-corder",
    "titol": "Ventre de corder (garronets)",
    "pagina": 43,
    "pagines": [
      43
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Ventre de corder",
          "Garronets de corder",
          "1 cabeça d’alls secs",
          "2 fulles de llorer",
          "Pebre roig",
          "Vitets (visolets)",
          "Trossos de xoriç",
          "Oli d’oliva (una cullerada o dos)",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una olla a pressió i afegiu-hi aigua. En bullir, afegiu-hi la resta d’ingredients; és a dir, el ventre rentat, els garronets, els alls secs, les fulles de llorer, el pebre roig, els visolets, els trossos de xoriç, l’oli d’oliva i la sal. Poseu el foc al mínim, com a mínim una hora i, en xiular l’olla a pressió, els garronets estaran bons."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p043.webp"
  },
  {
    "numero": 36,
    "slug": "anxoves",
    "titol": "Anxoves",
    "pagina": 44,
    "pagines": [
      44
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Anxoves",
          "Sal grossa",
          "Vinagre",
          "Oli d’oliva"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, netegeu les anxoves i lleveu-los el cap, les tripes i les espines. A continuació, agafeu una safata i arregleu-les l’un al costat de l’altre, afegiu-hi sal grossa per damunt i cobriu la safata amb vinagre i deixeu-la al congelador 24 hores. Açò és fa per a matar l’anisakis, ja que esteu cuinant un peix cru. A l’endemà, i una vegada descongelada la safata, llanceu el vinagre, renteu l’anxova i torneu-la a arreglar en una altra safata i cobriu-la per complet amb oli d’oliva."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p044.webp"
  },
  {
    "numero": 37,
    "slug": "carxofes-fregides",
    "titol": "Carxofes fregides (per a acompanyar)",
    "pagina": 45,
    "pagines": [
      45
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Carxofes",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu les carxofes i talleu-les a rodanxes. Seguidament, agafeu una paella i poseu a calfar oli d’oliva. En estar ben calent l’oli, afegiu-hi les carxofes i vigileu perquè no es cremen. En la presentació, afegiu-hi sal al gust."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p045.webp"
  },
  {
    "numero": 38,
    "slug": "clotxines-al-vapor",
    "titol": "Clòtxines al vapor",
    "pagina": 46,
    "pagines": [
      46
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Clòtxines",
          "Trossos de llima",
          "Oli d’oliva",
          "Sal",
          "Pebre en gra"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, renteu les clòtxines i en una cassola, afegiu trossos de llima, les clòtxines, una poca aigua, una mesura d’oli d’oliva, sal i el pebre en gra; tot això a foc viu fins que s’òbriguen les clòtxines; la qual cosa assenyala que ja estan bones."
        ]
      }
    ],
    "notes": [
      "Aquest mateix plantejament segueixen les petxines redones. Les petxines redones també es poden cuinar amb tomaca: en una paella, sofregiu la tomaca i afegiu-hi les petxines redones i un pessic de sal. En estar obertes, estaran bones."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p046.webp"
  },
  {
    "numero": 39,
    "slug": "petxines-fregides",
    "titol": "Petxines (tellines) fregides",
    "pagina": 47,
    "pagines": [
      47
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Petxines",
          "Julivert tendre picat",
          "Oli d’oliva",
          "Llima"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu les petxines i renteu-les. Seguidament, poseu a calfar oli d’oliva en una paella, a foc viu, i, en estar ben calent, poseu-hi les petxines i tapeu la paella. En estar obertes, estaran bones. En la presentació, afegiu-hi el julivert picat i la llima al gust."
        ]
      }
    ],
    "notes": [
      "També es poden cuinar amb tomaca; en una paella, sofregiu la tomaca i afegiu-hi les petxines i un pessic de sal. En estar obertes, estaran bones."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p047.webp"
  },
  {
    "numero": 40,
    "slug": "peixet-fregit",
    "titol": "Peixet fregit (tombabarcos)",
    "pagina": 48,
    "pagines": [
      48
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Peixet xicotet",
          "Farina",
          "Oli d’oliva",
          "Llima",
          "Sal al gust"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu els peixets i lleveu-los el cap i les tripes. Seguidament, enfarineu-los amb farina normal i afegiu-los a la paella amb oli ben calent. En pocs minuts estaran fets. Vigileu-los, perquè no es cremen. En la presentació, afegiu-hi sal al vostre gust, com també una llima escorreguda."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p048.webp"
  },
  {
    "numero": 41,
    "slug": "aladroc-fregit",
    "titol": "Aladroc fregit",
    "pagina": 49,
    "pagines": [
      49
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Aladroc",
          "Farina",
          "Oli d’oliva",
          "Sal al gust",
          "Llima"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu els aladrocs i lleveu-los el cap i les tripes. Seguidament, enfarineu-los amb farina normal i, com ja haureu posat oli d’oliva a calfar en una paella, en estar ben calent l’oli, afegiu-los a la paella. En pocs minuts estaran fets; per tant, vigileu-los, perquè no es cremen. En la presentació, afegiu-hi sal i llima al vostre gust."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p049.webp"
  },
  {
    "numero": 42,
    "slug": "aladroc-amb-vinagre",
    "titol": "Aladroc amb vinagre",
    "pagina": 50,
    "pagines": [
      50
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Aladroc",
          "Sal grossa",
          "Vinagre",
          "Julivert tendre",
          "1 cabeça d’alls picats",
          "Oli d’oliva"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, netegeu l’aladroc i lleveu-los el cap, les tripes i les espines. A continuació, agafeu una safata i arregleu-los l’un al costat de l’altre, afegiu-hi sal grossa per damunt i cobriu la safata amb vinagre i deixeu-la al congelador 24 hores. Açò és fa per a matar l’anisakis, ja que esteu cuinant un peix cru. A l’endemà, i una vegada descongelada la safata, llanceu el vinagre, renteu l’aladroc i torneu-lo a arreglar en una altra safata. Seguidament, afegiu-hi el julivert tendre, els alls picats i cobriu la safata per complet amb oli d’oliva."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "GbNXpky2ywA",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p050.webp"
  },
  {
    "numero": 43,
    "slug": "cuixot-i-formatge",
    "titol": "Cuixot i formatge",
    "pagina": 51,
    "pagines": [
      51
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Cuixot tallat a rodanxes",
          "Formatge curat tallat a rodanxes",
          "Oli d’oliva"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu una font gran o un plat de grans proporcions i col·loqueu-hi el cuixot tallat a rodanxes. Seguidament, talleu el formatge curat a rodanxes i poseu-les per damunt del cuixot. Finalment, afegiu-hi oli d’oliva generosament per tota la font o el plat gran. N’hi ha qui fa dibuixos geomètrics amb els ingredients o no. Ho deixem al vostre criteri."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p051.webp"
  },
  {
    "numero": 44,
    "slug": "amanida-russa",
    "titol": "Amanida (ensaladilla) russa",
    "pagina": 52,
    "pagines": [
      52
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Creïlles",
          "Ous",
          "Verdura xicoteta variada",
          "Bajoca roja torrada",
          "Olives farcides",
          "Tonyina",
          "Maonesa"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, heu de bullir les creïlles, els ous i la verdura xicoteta variada (bajoquetes, carlotetes, etc.). En tindre-ho tot ben bullit i preparat, agafeu un bol gran i afegiu tots els ingredients bullits i desfeu-los tots amb una forqueta. Seguidament, afegiu-hi la bajoca roja torrada, les olives farcides i la tonyina i pasteu-ho tot. Finalment, doneu-li forma a la pasta i afegiu-hi per damunt la maonesa. En la presentació, podeu fer servir rosquetes."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p052.webp"
  },
  {
    "numero": 45,
    "slug": "rosquetes-de-pa-al-forn",
    "titol": "Rosquetes de pa al forn",
    "pagina": 53,
    "pagines": [
      53
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Pa dur",
          "Herbes aromàtiques: julivert, orenga, sàlvia, etc.",
          "Oli d’oliva"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, talleu el pa dur a rosquetes i afegiu-hi per damunt pessics d’herbes aromàtiques que vulgueu: orenga, sàlvia, julivert, etc. Seguidament, afegiu-hi bona cosa d’oli i introduïu-les al forn, a 200 graus, i vigileu-les. En estar daurades, estaran bones."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p053.webp"
  },
  {
    "numero": 46,
    "slug": "formatge-blanquet",
    "titol": "Formatge blanquet",
    "pagina": 54,
    "pagines": [
      54
    ],
    "apartat": "entrades",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Llet",
          "Quall animal o vegetal",
          "Unes gotes de suc de llima (opcional)",
          "Sal",
          "Un drap blanc de tela fina molt porós"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una cassola, enceneu el foc, i afegiu-hi la llet i el quall animal o vegetal, que haureu comprat a la farmàcia. A continuació, deixeu que vaja calfant-se i aneu remenant fins que la llet qualle; també podeu posar-hi unes gotes de suc de llima, amb el mateix efecte. Tot seguit, i en veure que la llet s’ha fet una pasta, retireu la cassola del foc i agafeu un drap de tela fina molt porós i afegiu-hi la pasta de la llet. En tenir-la al drap, agafeu les quatre puntes del drap, enrotlleu-les i feu pressió, en redó, sobre la pasta de la llet i veureu que pels porus del drap ix el sèrum de la llet. Feu pressió, tot enrotllant el drap, a poc a poc, i traieu-lo tot del formatge. Feu-ho tantes vegades com sèrum hi puga quedar fins que ja no n’isca gens. Finalment, obriu el drap, retireu tota la pasta, afegiu un poc de sal i pasteu-la amb els dits, tot desfent-la ben desfeta. Per a finalitzar, torneu a agafar el drap i torneu a estrènyer la pasta, com heu fet anteriorment, i després retireu el drap del formatge, que tindrà forma del drap premsat, i deixeu el formatge dins d’una safa amb aigua i un poc de sal, perquè agafe bé el punt de sal, el temps que vulgueu, i ja es podrà menjar."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p054.webp"
  },
  {
    "numero": 47,
    "slug": "renyons-de-masero",
    "titol": "Renyons de masero",
    "pagina": 56,
    "pagines": [
      56
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Pits de pollastre (o xulles de corder, titot, etc.)",
          "Tomaques madures grans",
          "Julivert sec",
          "Pebre roig",
          "All",
          "Sal",
          "Oli d’oliva"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, i en una llanda per al forn, escampeu l’oli d’oliva, perquè no s’apeguen la carn i els renyons. Seguidament, poseu-hi per damunt els pits de pollastre, o la carn triada, i saleu-ho al gust. A continuació, talleu les tomaques madures per la meitat i poseu-les per damunt dels pits de pollastre. Saleu-les, afegiu-hi el julivert sec, el pebre roig i l’all a trossets. Remateu la preparació amb mig got d’oli d’oliva per damunt de les tomaques. Finalment, introduïu la llanda al forn, a 200 graus, unes 3 hores i llest."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "TR9o3LAN_YQ",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p056.webp"
  },
  {
    "numero": 48,
    "slug": "blat-picat",
    "titol": "Blat picat",
    "pagina": 57,
    "pagines": [
      57
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Blat pelat (un grapat per persona)",
          "Fesols (un grapat per persona)",
          "Naps (un parell)",
          "Carlotes (un parell)",
          "Creïlles (unes poques)",
          "1 pot de tomaca crua desfeta",
          "Costelles de porc (una per persona)",
          "Nyores picades (al gust)",
          "Penques (un manoll)",
          "2 o 3 cebes",
          "Oli d’oliva (per al sofregit)",
          "Sal al vostre gust"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Per a cuinar aquest plat, la nit anterior haureu posat el blat pelat a remulla; i al dia següent, a l’hora de cuinar-lo, agafeu una cassola i coeu els fesols i canvieu-los l’aigua i amb les penques, feu el mateix. A continuació, sofregiu, en una paella, la ceba, les costelles de porc i la tomaca crua desfeta. Tot seguit, agafeu una olla gran i afegiu-hi aigua fins els botons de l’olla, el blat pelat, els fesols i les penques (que ja haureu bullit i canviat l’aigua diverses vegades per a traure’ls l’amargor) i totes les verdures restants. Les creïlles, a trossos o senceres pelades, afegiu-les les últimes, perquè no es desfacen, com també la nyora picada i la sal al gust, i deixeu que bulla l’aigua de l’olla a foc viu. En bullir, rebaixeu el foc al mínim i de tant en tant, trenqueu el bull, i remeneu bé tot el menjar perquè es coga bé. Deixeu que es coga tot unes 3 hores, aproximadament, i remeneu-ho tot de tant en tant, perquè no s’enganxe i es creme a l’olla. Finalment, deixeu-ho reposar tot i serviu-ho."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "4mJJZ7nbnf4",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p057.webp"
  },
  {
    "numero": 49,
    "slug": "coca-de-batre",
    "titol": "Coca de batre",
    "pagina": 58,
    "pagines": [
      58
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Farina de blat o de dacsa",
          "Llevat",
          "Cansalada blanca o sardines",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, pasteu la farina amb el llevat i poseu-ho tot en un motle o llanda rectangular. Distribuïu-hi la cansalada blanca i/o les sardines i afegiu-hi un pessic de sal al gust. Fiqueu la llanda al forn i espereu fins que es coga. Una vegada cuita la coca, retireu-la del forn i ja es pot servir."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p058.webp"
  },
  {
    "numero": 50,
    "slug": "coca-de-tomaca",
    "titol": "Coca de tomaca",
    "pagina": 59,
    "pagines": [
      59
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Mig quilo de farina",
          "1 pastilla de llevat",
          "1 tasseta xicoteta d’oli d’oliva",
          "1 rall d’aigua",
          "1 pot de mig quilo de tomaca crua desfeta",
          "Mitja bajoca (pebrera) verda",
          "2 allets secs",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, pasteu la farina amb el llevat, l’oli i el rall d’aigua ben pastat i en estar bona, poseu la pasta a la llanda i estireu-la, allargueu-la, perquè ocupe tota la llanda. Seguidament, poseu al damunt de la llanda una tela i tapeu-la, perquè es faça bona; és a dir, s’infle, 30 minuts aproximadament. Mentre la pasta reposa, feu el sofregit de tomaca, la mitja bajoca, els alls secs i un pessic de sal. En estar el sofregit, col.loqueu-lo per damunt de la pasta, tot repartint-lo, que ja estarà bona, i poseu la llanda dins el forn, a 200 graus, tres quarts d’hora, aproximadament."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p059.webp"
  },
  {
    "numero": 51,
    "slug": "coca-de-farina",
    "titol": "Coca de farina",
    "pagina": 60,
    "pagines": [
      60
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "250 grams de farina",
          "1 tasseta d’oli d’oliva",
          "1 pastilleta de llevat",
          "1 got d’aigua",
          "Cansalada entreverada (opcional)",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, pasteu la farina amb el llevat, l’oli i l’aigua i poseu-ho tot en un motle o llanda rectangular i espereu que estiga bona; és a dir, que s’infle la pasta. Opcionalment, distribuïu-hi la cansalada entreverada i afegiu-hi un pessic de sal al gust. Fiqueu la llanda al forn, a 200 graus, durant tres quarts d’hora, i espereu fins que es coga."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p060.webp"
  },
  {
    "numero": 52,
    "slug": "arros-melos-de-peix",
    "titol": "Arròs melós de peix",
    "pagina": 61,
    "pagines": [
      61
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "2 tasses d’arròs bomba",
          "Sèpia",
          "Clòtxines",
          "Emperador",
          "Tonyina",
          "1 tomaca per a corregir",
          "2 nyores o bajoques seques de fer pericana",
          "2 alls",
          "Caldo de peix (4 tasses, segons es veu l’arròs)"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, i en una paella, sofregiu la nyora o bajoca amb uns allets, i retireu-la. Seguidament, sofregiu la sèpia, el peix i les gambes. A continuació, sofregiu la tomaca amb el peix. Tot seguit, afegiu-hi l’arròs i sofregiu-ho tot junt. Al mateix temps, calfeu el suquet de peix i desfeu les nyores o bajoques amb 1 all i el suquet de peix. Finalment, afegiu-hi el suquet a la paella i coleu-ho. Deixeu-ho reposar to uns 10 minuts i ja és bo de menjar."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "GjH7LEmBegE",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p061.webp"
  },
  {
    "numero": 53,
    "slug": "arros-al-forn",
    "titol": "Arròs al forn",
    "pagina": 62,
    "pagines": [
      62
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 cabeça d’alls secs",
          "Arròs",
          "Costelletes de porc",
          "Fesols catalans cuits",
          "2 botifarres de ceba",
          "1 bajoca (pebrera) roja",
          "2 creïlles",
          "Safrà (colorant)",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, peleu les creïlles i talleu-les a rodanxes, com també la bajoca roja que tallareu per la meitat. A continuació, sofregiu, amb una mesura d’oli, la cabeça d’alls secs, les creïlles, la bajoca i les costelles de porc. Tot seguit, agafeu una cassola de fang i poseu, en primer lloc, els fesols catalans cuits; a continuació, les costelletes, les creïlles, les botifarres, la cabeça d’alls secs al centre..., en fi, tot. Distribuïu-ho tot uniformement per la cassola i l’últim ingredient que hi afegireu és l’arròs, el safrà, la sal i l’aigua que farà de caldo. Si poseu una tassa gran d’arròs, d’aigua se’n posarà la mateixa o un poc més, però no el doble, perquè no farà l’arròs sec. Poseu el forn a 200 graus, durant 1 hora i un quart i tindreu l’arròs al forn fet."
        ]
      }
    ],
    "notes": [
      "N’hi ha qui fa l’arròs al forn amb les restes de l’olla de carn (Putxero valencià) (cf.): els cigrons, la botifarra de carn, la vedella..."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p062.webp"
  },
  {
    "numero": 54,
    "slug": "arros-amb-conill",
    "titol": "Arròs amb conill",
    "pagina": 63,
    "pagines": [
      63
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Arròs",
          "Trossos de conill (la part sangonosa, la “cistella” o qualsevol altre tros)",
          "1 tros de bajoca (pebrera) roja",
          "Pèsols (o fesols o bajoquetes)",
          "Tomaca crua desfeta",
          "Safrà (edulcorant)",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu un perol i afegiu-hi l’oli d’oliva i tots els ingredients, tret de l’arròs; açò és, els trossos de conill, la bajoca roja, els pèsols, la tomaca, el safrà (edulcorant), tot en cru, i ompliu la cassola d’aigua fins els botons i hi afegiu uns pessics de sal. Seguidament, enceneu el foc al màxim i, en bullir l’aigua, poseu la cassola al mínim un parell d’hores i tindreu el caldo fet. Val a dir, però, que la mida dels ingredients són grapats, a ull; és a dir: un grapat de pèsols, la tomaca que vulgueu, els trossos de conill que vulgueu, etc. Pel que fa a l’arròs, més o menys, mitja hora abans de dinar, afegiu a la cassola el grapat o grapats que vulgueu (un grapat per persona) i el foc al mínim i passat aquest temps tindreu un bon arròs amb conill."
        ]
      }
    ],
    "notes": [
      "Una altra recepta amb conill, pot ser conill amb ametles. Ingredients: trossos de conill; ametles picades; pa torrat; 1 got de vi blanc; 1 got d’aigua; romer triturat; oli d’oliva; sal. Preparació: en primer lloc, agafeu una paella i sofregiu els trossos de conill. Tot seguit, afegiu-hi l’ametla picada i el pa torrat, que ja haureu preparat abans. Seguidament, afegiu-hi el vi blanc i l’aigua i, en bullir, rebaixeu el foc al mínim. Finalment, saleu-ho al vostre gust i afegiu-hi el romer triturat."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p063.webp"
  },
  {
    "numero": 55,
    "slug": "arros-blanc",
    "titol": "Arròs blanc",
    "pagina": 64,
    "pagines": [
      64
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Arròs",
          "1 cabeça d’alls secs",
          "Oli d’oliva",
          "Sal",
          "Tomaca fregida",
          "1 ou (opcional)"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una cassola i aixafeu els alls secs. Seguidament, afegiu aigua a la cassola i bulliu els alls amb una mesura d’oli, a flama viva. A continuació, i en bullir l’aigua, afegiu-hi l’arròs i un pessic de sal i rebaixeu el foc al mínim. Finalment, 20 minuts després, i en haver-se acabat l’aigua, tindreu l’arròs preparat. En la presentació, afegiu-hi tomaca fregida per damunt, com també un ou fregit, si és del vostre gust."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p064.webp"
  },
  {
    "numero": 56,
    "slug": "arros-d-hivern",
    "titol": "Arròs d’hivern",
    "pagina": 65,
    "pagines": [
      65
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Arròs",
          "1 pot (250 grams) de fesols cuits blancs catalans",
          "Penques",
          "3 naps",
          "Espinacs (opcional, bledes)",
          "Safrà",
          "Sal",
          "2 mesures i mitja d’oli d’oliva"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu una cassola i poseu-hi tots els ingredients que ja haureu rentat i preparat (fesols cuits, els espinacs, els 3 naps pelats i a trossets i les 2 mesures i mitja d’oli d’oliva, si veieu que eixirà prou caldo), tret de l’arròs. Els fesols, podeu comprar-los cuits o, si són secs, podeu deixar-los la nit anterior a remulla. Abans de preparar-ho tot, les penques hauran estat bullides a part per a llevar-les l’amargor. Una vegada estan tots els ingredients dins la cassola, afegiu-hi el safrà i ompliu la cassola d’aigua fins els botons i enceneu el foc a flama viva i, en bullir, rebaixeu el foc al mínim, durant 3 quarts d’hora i ja tindreu el caldo llest. A continuació, agafeu una altra cassola i afegiu-hi el caldo amb tots els ingredients i feu que bulla el caldo. En bullir tot, afegiu-hi els grapats d’arròs que considereu i rebaixeu el foc al mínim. Finalment, 20 minuts després, tindreu l’arròs cuit."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "cx7g2LW3ayo",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p065.webp"
  },
  {
    "numero": 57,
    "slug": "arros-amb-ventre",
    "titol": "Arròs amb ventre",
    "pagina": 66,
    "pagines": [
      66
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 cabeça d’alls secs (per al ventre)",
          "Alls secs (uns quants)",
          "350 grams d’arròs",
          "200 grams de ventre i garronets de corder",
          "0,5 litre d’aigua o caldo de paella",
          "100 grams de cigrons",
          "Safrà (colorant)",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, renteu el ventre i els garronets de corder i poseu-los a bullir: en una cassola, afegiu-hi els ventre i els garronets, aigua, una cabeça d’alls i un pessic de sal i espereu que bulla. A continuació, sofregiu en una paella, amb una mesura d’oli i el foc viu, els alls secs, el ventre i els garronets, els cigrons i l’arròs i removeu tot el conjunt. Seguidament, afegiu-hi l’aigua o el caldo, el safrà i un pessic de sal. En bullir el caldo, rebaixeu el foc al mínim, tapeu la paella i espereu que s’acabe el caldo i tindreu una bona paella d’arròs amb ventre."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p066.webp"
  },
  {
    "numero": 58,
    "slug": "arros-negre",
    "titol": "Arròs negre",
    "pagina": 67,
    "pagines": [
      67
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "2 gots grans d’arròs",
          "4 gots grans de caldo de peix (el doble que d’arròs)",
          "Calamars",
          "Alls tendres o secs",
          "Tinta de calamar",
          "Colorant, opcional",
          "Sal",
          "Oli d’oliva"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, sofregiu, en una paella, a foc viu, el calamar i els alls tendres o secs. Seguidament, afegiu-hi l’arròs, el caldo de peix, la tinta i (opcional el colorant) i, en bullir, poseu el foc al mínim. Tapeu la paella amb paper vegetal o paper de plata i deixeu-ho coure uns 30 – 45 minuts. En la presentació, podeu acompanyar el plat amb allioli."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "VsxAAV3If5U",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p067.webp"
  },
  {
    "numero": 59,
    "slug": "paella-de-floricol",
    "titol": "Paella de floricol (amb bacallà, i alls tendres)",
    "pagina": 68,
    "pagines": [
      68
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "350 grams d’arròs",
          "0,5 litre de caldo de peix",
          "200 grams de bacallà dessalat",
          "2 garbes d’alls tendres",
          "2 tomaques xicotetes desfetes",
          "Mitja floricol",
          "Sal",
          "Oli d’oliva"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, sofregiu, en una paella, a foc viu, la floricol i els alls tendres fins que estiga tot daurat. A continuació, afegiu-hi la tomaca, el bacallà dessalat i l’arròs i removeu-ho tot. El bacallà es posa al final, abans d’afegir-li el caldo de peix, perquè es desfaria en la paella, en la sofregida. D’aquesta manera, es farà, en afegir-li el caldo de peix. En afegir-hi l’arròs, aboqueu-hi el caldo de peix, saleu al gust i removeu-ho tot una mica i espereu que bulla. En bullir, rebaixeu el foc al mínim, tapeu la paella i espereu que s’acabe el caldo i tindreu una bona paella de floricol amb bacallà i alls tendres."
        ]
      }
    ],
    "notes": [
      "Us presentem, tot seguit, una altra manera de fer aquesta paella. Ingredients:. floricol; bacallà a molletes; alls tendres o secs; trossos de bajoca roja; arròs; safrà al gust; caldo de la floricol bullida; oli d’oliva i sal. Preparació: en primer lloc, bulliu la floricol fins que estiga blaneta, però sense que es desfaça i reserveu l’aigua del bull. A continuació, agafeu una paella i sofregiu la bajoca roja i els alls. Tot seguit, afegiu-hi la floricol a molles i l’arròs i remeneu tots els ingredients. Després, afegiu-hi l’aigua bullida de la floricol. Afegiu-hi el doble de caldo que d’arròs. I finalment, afegiu-hi les molles de bacallà i poseu el foc al màxim, uns 20 minuts, fins que s’acabe el caldo. Per a acabar, tapeu la paella amb paper vegetal, rebaixeu el foc al mínim i deixeu que s’acabe de fer; és a dir, quan l’arròs estiga eixut."
    ],
    "youtubeId": "mHiYM03At-0",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p068.webp"
  },
  {
    "numero": 60,
    "slug": "paella-de-carxofes-i-faves",
    "titol": "Paella de carxofes i faves",
    "pagina": 69,
    "pagines": [
      69
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "2 carxofes",
          "1 mesura d’oli d’oliva",
          "Costelles de porc",
          "Alls tendres",
          "Mitja bajoca (pebrera) a trossos",
          "Mig quilo de faves",
          "1 got d’arròs",
          "2 gots d’aigua",
          "1 pastilla d’Avecrem",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, poseu a calfar l’oli, a foc viu, i sofregiu les costelles de porc. En estar sofregides, retireu-les de la paella i sofregiu tots els ingredients; és a dir, les carxofes (que ja haureu rentat i tallat), les faves, els alls tendres trossejats i la pebrera roja. En estar tot mig sofregit, afegiu-hi les costelles de porc, l’arròs i l’aigua (els 2 gots d’aigua amb una pastilla d’Avecrem) i tapeu la paella. Saleu al gust. Deixeu el foc viu fins que l’aigua es consumesca, més o menys, i rebaixeu el foc al mínim, uns 20 minuts. Vigileu, de tant en tant, perquè no es creme."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "uRZzvLV3gIE",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p069.webp"
  },
  {
    "numero": 61,
    "slug": "fideua",
    "titol": "Fideuà",
    "pagina": 70,
    "pagines": [
      70
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Calamars tallats en anelles",
          "Gambetes xicotetes pelades",
          "Clòtxines i tellines (petxines)",
          "1 got de ceba picada",
          "1 got de tomaca desfeta crua",
          "Caldo de peix",
          "2 cullerades de pebre roig o de nyora molta",
          "Fideus grossos per a fideuà (un grapat o un got per persona)",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, poseu a calfar l’oli, a foc viu en una paella, i sofregiu els calamars, les gambes, la ceba, i la tomaca. En estar sofregides, afegiu-hi els fideus, les clòtxines i les petxines i la resta d’ingredients, i, tot seguit, afegiu-hi el doble de caldo de peix que de fideus; és a dir, si poseu un got de fideus, heu de posar dos gots de caldo de peix. Rebaixeu el foc al mínim i tapeu la paella fins que s’acabe el caldo. En la presentació, acompanyeu el plat amb allioli."
        ]
      }
    ],
    "notes": [
      "L’arròs a banda es fa igual, tot fent servir grans d’all pelats i sofregits amb el marisc. En la presentació, també s’acompanya amb allioli. Aquests plats són mariners, però com han entrat tant en la nostra cuina autòctona, us els presentem com a plats de la nostra cuina valenciana."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p070.webp"
  },
  {
    "numero": 62,
    "slug": "guisat-de-verdures-i-pollastre",
    "titol": "Guisat de verdures i pollastre (guisao)",
    "pagina": 71,
    "pagines": [
      71
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Creïlles trossejades",
          "Bajoquetes del filet",
          "Trossets de carlota, (es pot afegir una varietat de verdures a elegir)",
          "Julivert i una cabeça d’all, tot ben picat",
          "3 fulles de llorer tendres",
          "Un pot de tomaca crua desfeta",
          "4-5 cuixes de pollastre i/o aletes",
          "Una mesura d’oli d’oliva i aigua (per a omplir la cassola)",
          "Safrà (colorant)",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Prepareu les verdures i creïlles (crues) degudament trossejades i afegiu-les a la cassola. Afegiu-hi, també, un pot de tomaca crua desfeta, el julivert picat i els alls també picats. A continuació, afegiu-hi l’aigua amb una mesura d’oli, el safrà i un poc de sal. Finalment, poseu-hi les cuixetes de pollastre. Seguidament, poseu la cassola al foc a viu fins que trenque el bull i després lleveu el foc a la meitat. Manteniu el foc així 1 hora i mitja o 2 hores, aproximadament, i a dinar."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "pkXqyFoJiUo",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p071.webp"
  },
  {
    "numero": 63,
    "slug": "bullit",
    "titol": "Bullit",
    "pagina": 72,
    "pagines": [
      72
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Creïlles partides per la meitat",
          "Bajoquetes del filet",
          "Ceba",
          "Carlota (opcional)"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, peleu i talleu les creïlles, la ceba i despunteu les bajoquetes del filet. Seguidament, ompliu un perol d’aigua i afegiu-hi tots els ingredients i poseu el foc viu fins que bulla. Una vegada bullint l’aigua, lleveu el foc fins al mínim i 30 minuts després, ja es pot menjar. Escudelleu-ho amb oli i sal al gust (n’hi ha qui li afig vinagre)."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "ZAF09BRZpU4",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p072.webp"
  },
  {
    "numero": 64,
    "slug": "escabetx-de-sardina",
    "titol": "Escabetx de sardina",
    "pagina": 73,
    "pagines": [
      73
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "0,5 kg de sardines grosses",
          "Alls tendres",
          "2 fulles de llorer",
          "Un pessic de sal",
          "Pebre roig",
          "1 mesureta d’oli d’oliva (1 tasseta de cafè xicoteta)",
          "1 got gran de vinagre"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, poseu en una cassola les sardines, els alls tendres, les 2 fulles de llorer, la mesura d’oli, el got gran de vinagre, el pebre roig i el pessic de sal, tot en cru i ompliu la cassola d’aigua fins a dalt. Enceneu el foc, a una flama mitjana, i coeu-ho 1 hora, més o menys. Deixeu que es refrede i estarà llest per a menjar."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p073.webp"
  },
  {
    "numero": 65,
    "slug": "canelons-de-pollastre",
    "titol": "Canelons de pollastre",
    "pagina": 74,
    "pagines": [
      74
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 cuixa i l’anca del pollastre",
          "1 pot de tomaca desfeta crua",
          "Ceba trossejada",
          "Oli d’oliva",
          "Sal al gust",
          "Pasta de canelons",
          "Formatge ratllat"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una paella i sofregiu la tomaca desfeta i la ceba. Al mateix temps, en un perol, bulliu la cuixa i l’anca del pollastre fins que estiga cuita. En refredar-se, desfeu-la amb els dits i després passeu les molles per la batedora. A continuació, afegiu la carn capolada a la paella on s’està sofregint la tomaca i la ceba. En acabar de sofregir-se tot, agafeu la pasta dels canelons i farciu-la amb el sofregit i dipositeu-los en una safata per al forn. El sofregit sobrant, afegiu-lo per damunt dels canelons, com també el formatge ratllat. A continuació, poseu el forn a 200 graus i en estar daurats, ço és, uns tres quarts d’hora, ja seran bon de menjar."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p074.webp"
  },
  {
    "numero": 66,
    "slug": "canelons-d-espinacs",
    "titol": "Canelons d’espinacs",
    "pagina": 75,
    "pagines": [
      75
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 bloc de 250 grams d’espinacs congelats",
          "1 lluç partit sense espines",
          "Beixamel (farina, oli, llet, nous moscades)",
          "Formatge ratllat",
          "Sal al gust",
          "Oli d’oliva",
          "Pasta de canelons",
          "Pinyons, opcional"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu el bloc congelat d’espinacs i poseu-lo a bullir en un perol, com també el lluç partit sense espines, tot junt. En estar bullit, lleveu la pell del lluç i sofregiu-lo amb els espinacs i sal, en una paella. En estar el sofregit, agafeu la pasta de canelons i farciu-los amb el sofregit i col.loqueu-los en una safata per al forn. Per damunt dels canelons, afegiu-hi la beixamel i el formatge ratllat. Poseu el forn a 200 graus, uns tres quarts d’hora, i en estar daurats, estaran bons de menjar. Per a fer la beixamel, feu sevir farina, 2 culleradetes, un rall d’oli i una poca llet i nous moscades. Removeu-ho tot fins que s’espessesca, com ara crema i ja la tindreu preparada."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p075.webp"
  },
  {
    "numero": 67,
    "slug": "floricol-bullida",
    "titol": "Floricol bullida",
    "pagina": 76,
    "pagines": [
      76
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 floricol",
          "Oli d’oliva",
          "Vinagre (opcional)",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu un perol i poseu-hi la floricol i ompliu-lo d’aigua. Enceneu el foc a una flama viva i en bullir l’aigua, reguleu-lo fins al mínim. En passar 30 minuts, ja estarà bona per a menjar. En la presentació, afegiu-hi oli cru i sal al gust. També n’hi ha qui li afig vinagre al gust."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p076.webp"
  },
  {
    "numero": 68,
    "slug": "potatge",
    "titol": "Potatge",
    "pagina": 77,
    "pagines": [
      77
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Cigrons",
          "2 ossos de cuixot serrats (pernil)",
          "Verdures: carlotes, julivert, nap, creïlles, bajoquetes de filet, penques",
          "Mandonguilles de carn o aletes del pollastre",
          "1 cabeça d’alls sencera",
          "Safrà",
          "1 mesura d’oli d’oliva",
          "1 pessic de sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "La nit anterior a la preparació del plat, haureu posat a remull el paquet de cigrons que utilitzareu. Abans de començar a cuinar el plat, bulliu els cigrons sols, a part, i en estar cuits, es bulliran amb la resta de les verdures que haureu triat: les carlotes, el julivert, el nap, les creïlles (que ja haureu pelat i trossejat), les bajoquetes del filet (que haureu rentat i despuntat) i les penques (que també haureu rentat i despuntat). També hi afegireu els ossos del cuixot, les mandonguilles de carn o les aletes del pollastre, el safrà, la cabeça d’alls sencera, una mesureta d’oli d’oliva i un pessic de sal. Deixeu-ho al foc mínim durant 1 hora i 3 quarts, aproximadament, i tindreu el dinar llest."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p077.webp"
  },
  {
    "numero": 69,
    "slug": "alberginies-al-forn",
    "titol": "Albergínies al forn",
    "pagina": 78,
    "pagines": [
      78
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "3 albergínies senceres (partides per la meitat, 6)",
          "Orenga",
          "Pebre roig dolç o picant",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, talleu les albergínies per la meitat i ratlleu-les. Afegiu-hi oli per damunt, ben banyades, i el pebre roig dolç o picant o l’orenga i fiqueu-les al forn en una safata. Enceneu el forn a 200 graus durant una hora i mitja, més o menys, i el dinar o sopar estarà fet."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p078.webp"
  },
  {
    "numero": 70,
    "slug": "alberginies-farcides-al-forn",
    "titol": "Albergínies farcides al forn",
    "pagina": 79,
    "pagines": [
      79
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "3 albergínies senceres (partides per la meitat, 6)",
          "Alls tendres xicotets",
          "Pinyonets",
          "1 ceba xicoteta",
          "Mig pot de tomaca",
          "3 pots de tonyina",
          "Gambetes xicotetes pelades congelades",
          "Herba-sana o herbes aromàtiques al gust",
          "Pebre roig al gust",
          "1 mesura d’oli d’oliva",
          "Sal al gust"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, talleu les albergínies per la meitat i buideu-ne el contingut. A continuació, agafeu una safa i poseu-hi la carn de l’albergínia i desfeu-la en trossos molts xicotets. Amb la resta dels ingredients, feu el mateix; és a dir, desfeu-ho tot en trossos molt xicotets i després, afegiu-los a la safa i pasteu-ho tot bona cosa. Finalment, agafeu una cullera i farciu les albergínies que heu buidat, poseu-les en una llanda per al forn i enceneu-lo a 200 graus durant mitja hora, més o menys, i el plat estarà llest."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p079.webp"
  },
  {
    "numero": 71,
    "slug": "alberginies-fregides",
    "titol": "Albergínies fregides",
    "pagina": 80,
    "pagines": [
      80
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Albergínies",
          "Farina",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, talleu les albergínies en talladetes, passeu-les per farina i deixeu-les en una safata, perquè suen, unes tres o quatre hores. A continuació, poseu oli en una paella i en ben estar calent, introduïu-les dins l’oli mitja hora, més o menys. En la presentació, saleu-les al gust."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "LivAt9NLagY",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p080.webp"
  },
  {
    "numero": 72,
    "slug": "alberginies-torrades",
    "titol": "Albergínies torrades",
    "pagina": 81,
    "pagines": [
      81
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Albergínies",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, poseu una paella a calfar i mentrestant, talleu les albergínies en talladetes. Afegiu a les tallades un rall d’oli i un pessic de sal i torreu-les a la paella. Poseu el foc fort uns 20 minuts, aproximadament, i en estar les tallades morenes, estaran bones."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p081.webp"
  },
  {
    "numero": 73,
    "slug": "macarrons-amb-tomaca",
    "titol": "Macarrons amb tomaca",
    "pagina": 82,
    "pagines": [
      82
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Un paquet de macarrons de 250 grams",
          "Un pot de tomaca crua desfeta",
          "Ceba a trossets",
          "Carn capolada",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, poseu a bullir aigua en un perol i espereu que bulla. En bullir, afegiu-hi el paquet de macarrons i poseu el foc al mínim. Paral.lelament, sofregiu la tomaca crua desfeta, la ceba trossejada i la carn capolada. En estar el sofregit fet, deixeu-lo reposar. En estar cuits els macarrons, passeu-los per un escorredor d’aigua per llançar l’aigua calenta del bull. Seguidament, agafeu un perol i mescleu el sofregit amb els macarrons cuits i el dinar estarà llest."
        ]
      }
    ],
    "notes": [
      "Aquesta recepta també és bona per als espaguetis i la pasta en general."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p082.webp"
  },
  {
    "numero": 74,
    "slug": "bajoca-torrada",
    "titol": "Bajoca (pebrera) torrada (espencat, escalivada)",
    "pagina": 83,
    "pagines": [
      83
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Bajoques (pebreres)",
          "Oli d’oliva",
          "Sal",
          "Alls a trossets (opcional)"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu una rostidora i poseu-hi les bajoques. Afegiu-hi bona cosa d’oli d’oliva per damunt i fiqueu la rostidora al forn durant 1 hora, aproximadament, a 200 graus. En passar aquest temps, traieu-les del forn, espereu que es refreden una mica i peleu-les, a tiretes. En la presentació, afegiu-hi un rall abundant d’oli i sal al gust i els allets trossejats, si és el cas."
        ]
      },
      {
        "titol": "Variant",
        "linies": [
          "Si no voleu torrar les bajoques al forn, ho podeu fer al foc: agafeu una llanda i poseu-la damunt del foguer i poseu al damunt les bajoques banyades en oli. En estar les bajoques negres, ja estaran bones. Seguidament, poseu-les en una bossa de plàstic, perquè suen i així quan es refreden serà més fàcil pelar-les i preparar-les."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p083.webp"
  },
  {
    "numero": 75,
    "slug": "espencat-de-tomaca",
    "titol": "Espencat (escalivada) de tomaca",
    "pagina": 84,
    "pagines": [
      84
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Tomaca crua desfeta",
          "Oli d’oliva",
          "Sal",
          "Olives sense pinyol",
          "Tonyina",
          "Ceba (opcional)"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu un plat i afegiu-hi la tomaca crua desfeta, l’oli d’oliva, les olives sense pinyol, la tonyina i saleu al gust. N’hi ha qui també hi afegeix ceba."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p084.webp"
  },
  {
    "numero": 76,
    "slug": "bajoques-farcides",
    "titol": "Bajoques (pebreres) farcides",
    "pagina": 85,
    "pagines": [
      85
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "2 grapats d’arròs",
          "Un grapat de ceba picada",
          "1 mesura d’oli d’oliva",
          "Carn picada",
          "Bajoques roges",
          "1 pot de tomaca crua desfeta",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu una paella i sofregiu la ceba picada, la carn capolada, la mesura d’oli d’oliva, el pot de tomaca crua desfeta, dos grapats d’arròs i un pessic de sal. Sofregiu-ho i menegeu-ho tot un poquet. Paral.lelament, heu rentat les bajoques roges i els heu tret totes les llavoretes de dins i les heu deixat llestes per a ser farcides. En estar el sofregit fet, agafeu una cullera gran i ompliu les bajoques amb tots els ingredients (l’arròs, la carn, etc.) i seguidament enceneu el forn a 200 graus. Les bajoques poden ser rotllades amb paper de plata, perquè així no es cremen per fora i també podran ser menjades. N’hi ha qui no fa servir el paper de plata i les posa directament al forn. Les bajoques es cremen per fora, però fan un arròs més sec; mentre que les rotllades amb paper de plata fan un arròs més melós. En qualsevol cas, poseu-les al forn durant 2 hores, més o menys i tindreu les bajoques llestes."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p085.webp"
  },
  {
    "numero": 77,
    "slug": "llentilles",
    "titol": "Llentilles",
    "pagina": 86,
    "pagines": [
      86
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Llentilles",
          "2 o 3 ossos de cuixot (pernil)",
          "1 cullerada de pebre roig",
          "1 cabeça d’alls secs, sencera",
          "1 creïlla grossa",
          "Bajoquetes del filet",
          "Carlotes, diverses verdures",
          "Herba-sana",
          "Mig pot de tomaca crua desfeta",
          "1 mesura d’oli d’oliva",
          "Uns pessics de sal, al gust",
          "Aigua per a bullir"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu una olla i afegiu-hi tots els ingredients, tot en cru, i ompliu l’olla d’aigua. Seguidament, enceneu el foc al màxim i en bullir, rebaixeu-lo al mínim i que vaja bullint. Finalment, deixeu-ho així un parell d’hores i tindreu el dinar fet."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p086.webp"
  },
  {
    "numero": 78,
    "slug": "borreta",
    "titol": "Borreta",
    "pagina": 87,
    "pagines": [
      87
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 bloquet d’espinacs",
          "1 bloquet de bledes",
          "1 cabeça d’alls",
          "4 ous",
          "2 bajoques (callosines o d’enrastrar, de pericana) seques",
          "2 mesures d’oli d’oliva",
          "Sal al gust",
          "Mitja ceba",
          "1 creïlla",
          "Molles o ganyes de bacallà",
          "Pebre roig dolç"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, poseu tots els ingredients en cru, tret dels ous, en un perol i ompliu-lo d’aigua. Seguidament, poseu la cassola al foc i deixeu el foc viu fins que bulla. En bullir, rebaixeu-lo al mínim durant 30 minuts o 45 minuts i abans de retirar la cassola del foc, afegiu-hi els ous. Tot seguit, deixeu que els ous quallen i finalment, apagueu el foc i escudelleu la borreta en plats fondos."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "DsEhUWicM3Q",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p087.webp"
  },
  {
    "numero": 79,
    "slug": "olla-de-carn",
    "titol": "Olla de carn (putxero valencià)",
    "pagina": 88,
    "pagines": [
      88,
      89
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": "Ingredients de la verdura",
        "linies": [
          "3 naps",
          "Cigrons",
          "2 trossets d’api",
          "1 porro",
          "2 Carlotes",
          "2 xirivies",
          "Mitja ceba",
          "1 tomaca",
          "Penques (si no és la temporada, bajoquetes)",
          "Creïlles",
          "Arròs",
          "Fideus"
        ]
      },
      {
        "titol": "Ingredients de la carn",
        "linies": [
          "1 cuixa i l’anca de pollastre de camp",
          "2 peuets de porc, partits per la meitat",
          "1 os de pota de vedella",
          "1 os mollut de vedella",
          "4 botifarres de carn",
          "1 tros de vedella, que es diu “peixet”",
          "2 o 4 pilotes de carn",
          "2 pastilles d’Avecrem de carn",
          "Safrà",
          "Sal"
        ]
      },
      {
        "titol": "Ingredients de les pilotes",
        "linies": [
          "Carn capolada de porc i de vedella",
          "Julivert",
          "Pinyonets",
          "2 ous",
          "Canella",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": "Preparació de les pilotes",
        "linies": [
          "Agafeu carn capolada, picada, mesclada de porc i de vedella i afegiu-li julivert, pinyonets, 2 ous, canella i sal i pasteu-ho tot, tot donant-li forma redona."
        ]
      },
      {
        "titol": "Preparació general",
        "linies": [
          "En primer lloc, peleu, talleu i renteu tota la verdura i bulliu les penques per a traure-les l’amargor. Seguidament, agafeu una olla gran i col.loqueu tots els ingredients (tant els de la verdura com els de la carn, tret de les creïlles). Els cigrons, com també els naps, xirivies, etc., seran col.locats en una escorredora al fons de l’olla, perquè no es perden pel perol. Ompliu el perol d’aigua fins els botons i afegiu-hi el safrà i la sal. A continuació, enceneu el foc al màxim i poseu a bullir l’olla i en bullir l’aigua, rebaixeu el foc. 2 hores després, ja tindreu el caldo fet i els ingredients cuits. Tot seguit, traieu caldo per a fer l’arròs o els fideus i hi afegiu les creïlles (les creïlles són posades les últimes, abans de dinar, perquè es desfarien per dins del perol) i torneu a afegir aigua a l’olla (més o menys la que heu tret per a l’arròs) i lleveu-li força al foc.",
          "Per a fer l’arròs , agafeu una cassola i afegiu-hi una mesura d’oli i mitjà ceba picada; ho sofregiu tot i seguidament, hi afegiu l’arròs i el caldo del putxero. En uns 20 minuts, el caldo s’haurà eixugat i l’arròs estarà bo. Si feu fideus, agafeu una cassola, poseu a bullir el caldo del putxero i hi afegiu els fideus, quan bulla el caldo. En pocs minuts els fideus estaran fets."
        ]
      }
    ],
    "notes": [
      "N’hi ha llocs on no fan l’arròs d’aquesta forma. Couen l’arròs com els fideus; és a dir, posen a bullir el caldo del putxero i a continuació hi afigen l’arròs i deixen que es coga. Es menja com un arròs caldós. Llocs com ara Xàtiva, Gandia, etc., couen l’arròs d’aquesta forma, encara que també ens han comentat que a Setla també n’hi havia aquest costum."
    ],
    "youtubeId": "jjiuqw1bqUU",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p089.webp"
  },
  {
    "numero": 80,
    "slug": "olleta-murera",
    "titol": "Olleta murera",
    "pagina": 90,
    "pagines": [
      90
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Un manoll de penques",
          "1 pot de fesols cuits catalans",
          "1 xirivia sencera",
          "1 nap a trossos",
          "1 creïlla",
          "Mitja ceba",
          "Trossos de porc: morret, costelletes",
          "2 botifarres de carn a trossos",
          "1 cabeça d’alls secs",
          "Oli d’oliva",
          "Safrà (colorant)",
          "Sal",
          "Una pastilla de caldo de verdura"
        ]
      },
      {
        "titol": "Ingredients de les pilotes",
        "linies": [
          "Farina de dacsa",
          "2 ous",
          "Aigua tèbia",
          "Un rall d’oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": "Preparació de les pilotes",
        "linies": [
          "En una safa, poseu la farina de dacsa, els 2 ous, el ratllet d’oli d’oliva i la sal i pasteu-ho tot amb aigua tèbia, tot donant-li forma redona."
        ]
      },
      {
        "titol": "Preparació general",
        "linies": [
          "En primer lloc, peleu, talleu i renteu tota la verdura i bulliu les penques per a traure’ls l’amargor. Seguidament, agafeu una olla gran a pressió i col.loqueu tots els ingredients (tant els de la verdura com els de la carn, tret de les pilotes de facedura). Ompliu el perol d’aigua fins els botons i afegiu-hi la mesura d’oli, el safrà, la sal i la pastilla de caldo de verdura. A continuació, enceneu el foc al màxim i poseu a bullir l’olla i en bullir l’aigua, rebaixeu el foc al mínim. 3 hores després, més o menys, tindreu l’olleta feta. Tot seguit, afegiu-hi les pilotes de dacsa (es posen les últimes, tot just abans de dinar, perquè es desfarien per dins del perol), i deixeu-les allí, bullint a foc mínim, fins que s’acaben de fer."
        ]
      }
    ],
    "notes": [
      "Diem que és olleta muerera, perquè hi ha llocs, com ara Cocentaina o Alcoi que també hi afigen arròs amb companyia dels fesols. A Muro, sembla que no."
    ],
    "youtubeId": "j1Qz8TSkvkA",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p090.webp"
  },
  {
    "numero": 81,
    "slug": "llucets-passats-per-farina-i-fregits",
    "titol": "Llucets passats per farina i fregits",
    "pagina": 91,
    "pagines": [
      91
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Llucets",
          "Farina normal",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, talleu les aletes dels llucets amb unes tisores, talleu-los el cap i netegeu-los les tripes. Seguidament, passeu-los per farina; és a dir, enfarineu-los i fregiu-los en una paella, en oli d’oliva ben calent. Poseu el foc a una flama viva, uns tres quarts d’hora i com més daurats es faran, més bons estaran."
        ]
      }
    ],
    "notes": [
      "També podeu fer, per exemple, anguila a la sàlvia: ingredients: trossos d’anguila; 40 grams de mantega; fulles de sàlvia; oli d’oliva; sal. Preparació: En primer lloc, renteu els trossos de l’anguila i saleu-la al vostre gust. A continuació, agafeu una cassola i sofregiu els trossos amb la mantega, les fulles de sàlvia i l’oli d’oliva i deixeu que es faça, tot removent, perquè no es creme. Tot seguit, poseu el foc al mínim mitja hora, aproximadament, i tapeu la cassola i que s’acabe de fer."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p091.webp"
  },
  {
    "numero": 82,
    "slug": "lluc-amb-gambes",
    "titol": "Lluç amb gambes",
    "pagina": 92,
    "pagines": [
      92
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Llucets",
          "Gambetes pelades",
          "Julivert",
          "Alls picats",
          "2 fulles de llorer",
          "1 gotet d’oli d’oliva",
          "1 gotet de vi",
          "Sal al gust"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una rostidora per al forn i poseu-hi la ceba picada, els alls picats i el julivert, també picat, les gambetes pelades, els llucets nets, el got d’oli d’oliva i el got de vi i saleu-ho tot al vostre gust. A continuació, enceneu el forn a 200 graus, durant 20 o 30 minuts, aproximadament, i tindreu el plat preparat."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p092.webp"
  },
  {
    "numero": 83,
    "slug": "conill-al-forn-amb-creilles",
    "titol": "Conill al forn amb creïlles",
    "pagina": 93,
    "pagines": [
      93
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Conill a trossos",
          "Oli d’oliva",
          "Creïlles a rodanxes",
          "2 cebes en juliana",
          "2 alls secs xafigats",
          "1 llima",
          "Orenga",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, poseu al fons de la rostidora oli d’oliva i les creïlles que ja haureu tallat a rodanxes. Poseu-hi, també, 2 cebes tallades en juliana i 2 alls secs xafigats, a les vores de la rostidora, una llima tallada per la meitat, l’orenga, la sal al gust, l’oli d’oliva, per damunt de tots els ingredients, i vi negre, vinagre o conyac, si és del vostre gust. Tapeu la rostidora amb paper de plata i introduïu-la al forn, a 200 graus, durant 2 hores, aproximadament."
        ]
      }
    ],
    "notes": [
      "Les carns es poden adobar, com ara amb una salsa de nous: ingredients: nous; caldo concentrat de carn; llet; sal. Preparació: en primer lloc, agafeu les nous i piqueu-les de forma molt fina. A continuació, enceneu el foc, agafeu una cassola, i afegiu-hi les nous i la llet i removeu-ho tot fins que aconseguiu un líquid espés. Tot seguit, afegiu-hi el caldo de carn concentrat i saleu-ho al vostre gust i remeneu-ho tot de tant en tant fins que s’acabe de fer. Acompanyeu-la amb plats de carn."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p093.webp"
  },
  {
    "numero": 84,
    "slug": "carxofes-al-forn",
    "titol": "Carxofes al forn",
    "pagina": 94,
    "pagines": [
      94
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Carxofes",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, renteu i talleu per la meitat les carxofes. A continuació, agafeu una rostidora i afegiu-hi oli d’oliva, en la base, i col.loqueu-hi les carxofes, afegiu-hi oli per damunt i poseu la rostidora dins el forn. Poseu el forn a 200 graus, durant 1 hora, més o menys, fins que s’acaben de coure. En la presentació, poseu un pessic de sal per damunt de les carxofes."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p094.webp"
  },
  {
    "numero": 85,
    "slug": "carxofes-torrades",
    "titol": "Carxofes torrades",
    "pagina": 95,
    "pagines": [
      95
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Carxofes",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu les carxofes i talleu-les per la meitat i renteu-les. A continuació, enceneu el foc i poseu les carxofes damunt la flama. Vigileu i aneu girant-les de tant en tant, perquè no es cremen. En la presentació, afegiu-hi oli d’oliva per damunt i un pessic de sal."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p095.webp"
  },
  {
    "numero": 86,
    "slug": "carxofes-arrebossades",
    "titol": "Carxofes arrebossades",
    "pagina": 96,
    "pagines": [
      96
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Carxofes",
          "2 ous",
          "Farina normal",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu les carxofes, renteu-les i talleu-les a rodanxes fines. A continuació, passeu-les per la farina i els ous ben repassades, 3 o 4 vegades (bateu els ous en un plat i en un altre, la farina i banyeu les carxofes amb l’ou i la farina). Seguidament, poseu oli d’oliva a calfar, en una paella, i en estar l’oli ben calent, fregiu les carxofes i en estar daurades, estaran bones."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p096.webp"
  },
  {
    "numero": 87,
    "slug": "carxofes-amb-gambes",
    "titol": "Carxofes amb gambes",
    "pagina": 97,
    "pagines": [
      97
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Carxofes netes i pelades tallades per la meitat",
          "Ceba picada",
          "Alls tendres picats",
          "Mitja llima escorreguda",
          "Gambes xicotetes pelades",
          "Pebre blanc",
          "Nous moltes",
          "1 mesura d’oli d’oliva",
          "Sal al gust"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu les carxofes, peleu-les la part més dura, renteu-les i talleu-les a rodanxes fines. A continuació, agafeu una cassola i afegiu la mitja llima escorreguda, la sal al vostre gust i bulliu les carxofes mitja hora, aproximadament. Seguidament, retireu les carxofes i deixeu que s’escórreguen en una escorredora, però no llanceu l’aigua de la cassola, i afegiu la mesura d’oli d’oliva, la ceba picada, les gambes xicotetes pelades i els alls tendres picats a la cassola on han bullit les carxofes. Deixeu que bulla tot una mica i afegiu-hi les carxofes reservades, el pebre blanc i les nous moltes, uns 20 minuts, aproximadament, a foc mínim, i tindreu el plat llest."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p097.webp"
  },
  {
    "numero": 88,
    "slug": "ou-de-tomaca",
    "titol": "Ou de tomaca (tomaca amb ou, mullador de tomaca)",
    "pagina": 98,
    "pagines": [
      98
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 pot de tomaca crua desfeta",
          "1 cullerada de sucre",
          "2 ous",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, en una paella, fregiu la tomaca crua desfeta i afegiu-hi una cullerada de sucre. A continuació, afegiu-hi 2 ous i saleu al gust i removeu-ho tot fins que s’acabe de fer el fregit."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "kUGJh6fWUVA",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p098.webp"
  },
  {
    "numero": 89,
    "slug": "fregit-de-tomaca-amb-conill",
    "titol": "Fregit de tomaca amb conill (fregit de conill)",
    "pagina": 99,
    "pagines": [
      99
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 pot de tomaca crua desfeta",
          "1 cullerada de sucre",
          "Trossos de conill",
          "Mitja bajoca (pebrera) a trossos",
          "Uns quants alls secs",
          "Oli d’oliva",
          "Sal",
          "Romer"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, en una paella, fregiu la tomaca crua desfeta amb un rall d’oli d’oliva i afegiu-hi una cullerada de sucre. A continuació, afegiu-hi els trossos de conill, els trossos de bajoca, els alls secs, el romer i saleu al gust i removeu-ho tot fins que s’acabe de fer el fregit."
        ]
      }
    ],
    "notes": [
      "Aquest plat presenta molts variants, ja que també es cuina la tomaca fregida amb llonganisses blanques (fregit de llonganisses blanques), amb bacallà fregit o amb llomellos. El procediment és com el descrit més amunt. Pel que fa a la tomaca crua, també es prepara amb un rall d’oli d’oliva i molles de bacallà dessalat, per exemple. De variants, n’hi ha molts. Cf l’Espencat de tomaca o Ou de tomaca."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p099.webp"
  },
  {
    "numero": 90,
    "slug": "fregit-de-tomaca-amb-bacallarets",
    "titol": "Fregit de tomaca amb bacallarets (maire)",
    "pagina": 100,
    "pagines": [
      100
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 pot de tomaca crua desfeta",
          "1 cullerada de sucre",
          "Farina normal",
          "Bacallarets (maire)",
          "Oli d’oliva",
          "Sal",
          "Alls secs"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, netegeu els bacallarets, enfarineu-los i fregiu-los poc en una paella, en oli d’oliva ben calent. Finalment, retireu-los del foc. Simultàniament, agafeu una paella, i fregiu la tomaca crua desfeta amb un rall d’oli d’oliva i afegiu-hi una cullerada de sucre. En estar la tomaca un poc sofregida, afegiu-hi els bacallarets sofregits, els alls secs i saleu al gust i removeu-ho tot fins que s’acabe de fer el fregit."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "0UGzAU_Euok",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p100.webp"
  },
  {
    "numero": 91,
    "slug": "bacallarets-fregits",
    "titol": "Bacallarets fregits (maire fregit)",
    "pagina": 101,
    "pagines": [
      101
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Bacallarets (maire)",
          "Farina normal",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, talleu les aletes dels bacallarets amb unes tisores, talleu-los el cap i netegeu-los les tripes. Seguidament, passeu-los per farina; és a dir, enfarineu-los i fregiu-los en una paella, en oli d’oliva ben calent. Poseu el foc a una flama viva, uns tres quarts d’hora i com més daurats es faran, més bons estaran."
        ]
      }
    ],
    "notes": [
      "També es poden fer arrebossats i fregits. Les sardines també es poden fer com la recepta descrita i també amerades amb llima escorreguda i fregides."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p101.webp"
  },
  {
    "numero": 92,
    "slug": "fregit-de-tomaca-amb-llomellos-i-llonganisses",
    "titol": "Fregit de tomaca amb llomellos i llonganisses",
    "pagina": 102,
    "pagines": [
      102
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 pot de tomaca crua desfeta",
          "1 cullerada de sucre",
          "Llomellos",
          "Llonganisses blanques",
          "Mitja bajoca verda (pebrera) a trossos",
          "Uns quants alls secs",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, en una paella, fregiu la tomaca crua desfeta amb un rall d’oli d’oliva i afegiu-hi una cullerada de sucre. A continuació, sofregiu una mica els llomellos i les llonganisses i en estar mig sofregit, afegiu-ho a la tomaca que estarà fregint-se. Afegiu-hi, també, els trossos de bajoca verda, els alls secs i saleu al gust i removeu-ho tot fins que s’acabe de fer el fregit."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "OagpIN80sRE",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p102.webp"
  },
  {
    "numero": 93,
    "slug": "truita-de-creilla",
    "titol": "Truita de creïlla",
    "pagina": 103,
    "pagines": [
      103
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Creïlles",
          "Ous",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, peleu les creïlles i talleu-les a quadrets. En estar tallades, agafeu una paella i poseu una mica d’oli d’oliva i sofregiu les creïlles, a foc lent. Mentre les creïlles se sofrigen, agafeu els ous i bateu-los bona cosa. Com més els batreu, més grossa serà la truita. A continuació, i en estar els ous batuts, afegiu-los a la paella amb les creïlles i disposeu uniformement el batut per tota la paella, perquè tape tots els trossos de creïlla i saleu al gust. Feu-li la volta a la paella, de tant en tant, perquè no es creme i finalment, escudelleu-la."
        ]
      }
    ],
    "notes": [
      "Les truites poden cuinar-se soles (ou, oli i sal) o es poden acompanyar de qualsevol cosa: formatge, cuixot, faves, carxofes, etc. Les combinacions són infinites."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p103.webp"
  },
  {
    "numero": 94,
    "slug": "bajoquins-al-forn",
    "titol": "Bajoquins al forn (pebrera de fregir al forn)",
    "pagina": 104,
    "pagines": [
      104
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Bajoquins (pebreres de fregir)",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu una llanda per al forn i poseu-hi els bajoquins amb un rall d’oli i sal al gust. A continuació, poseu a calfar el forn, a 200 graus, mitja hora o tres quarts, i seran bons de menjar."
        ]
      }
    ],
    "notes": [
      "Els bajoquins també es frigen amb oli ben calent i és una altra variant d’aquest plat més habitual."
    ],
    "youtubeId": "Nqa_4CYk_0M",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p104.webp"
  },
  {
    "numero": 95,
    "slug": "mullador-de-vedella",
    "titol": "Mullador de vedella",
    "pagina": 105,
    "pagines": [
      105
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Trossos de vedella",
          "1 mesura d’oli d’oliva",
          "6-7 tomaques madures",
          "3-4 cebes",
          "1 got de vi o de conyac",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, sofregiu la vedella i posteriorment, agafeu els trossos sofregits i poseu-los en una cassola amb les tomaques senceres i les cebes, també senceres, i un got de vi o de conyac i saleu-ho al vostre gust. A continuació, tapeu la cassola i poseu-la sobre el foc moderat i deixeu que es coga. En estar la tomaca desfeta, passeu-la per l’escorredora, com també la ceba, i feu servir el boix del morter i desfeu-ho tot. Poseu el desfet en una altra cassola amb els trossos de la vedella, enceneu el foc i deixeu que s’acabe de fer. Saleu-ho al vostre gust i en veure que s’espesseix el triturat, el mullador estarà bo."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p105.webp"
  },
  {
    "numero": 96,
    "slug": "espinacs-passats-per-la-paella",
    "titol": "Espinacs passats per la paella",
    "pagina": 106,
    "pagines": [
      106
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Espinacs",
          "Alls secs",
          "Pinyons",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, poseu a bullir els espinacs. Mentre s’hi bullen, agafeu els alls secs peleu-los i talleu-los a trossets menudets i reserveu-los. En estar els espinacs cuits, agafeu una paella, poseu-la a calfar i afegiu-hi una mesura d’oli, els espinacs, els alls trossejats i els pinyons i deixeu que se sofrija. En la presentació, afegiu-hi sal al gust."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p106.webp"
  },
  {
    "numero": 97,
    "slug": "polpets-amb-ceba-i-tomaca",
    "titol": "Polpets amb ceba i tomaca",
    "pagina": 107,
    "pagines": [
      107
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "2 polpets",
          "Ceba a trossos",
          "Mig pot de tomaca desfeta",
          "Creïlles a trossos",
          "2 fulles de llorer",
          "Un pessic de pebre roig",
          "1 got xicotet de vi",
          "Un poc d’aigua",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una cassola i poseu-hi tots els ingredients en cru. A continuació, enceneu el foc, a flama fluixa, i poseu-hi la cassola. Mireu de tant en tant i removeu, perquè no s’enganxe i en poc de temps tindreu fet el plat."
        ]
      }
    ],
    "notes": [
      "Aquest plat també es pot fer amb calamarets; és a dir, substituir els polpets per calamarets."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p107.webp"
  },
  {
    "numero": 98,
    "slug": "bajoques-al-chilindron",
    "titol": "Bajoques (pebreres) al Chilindrón",
    "pagina": 108,
    "pagines": [
      108
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "2 bajoques (pebreres) roges grans",
          "Alls secs a trossets",
          "Un grapat de ceba a trossets",
          "1 pot de tomaca desfeta",
          "Cuixot (pernil) a trossets xicotets (en daus)",
          "2 cullerades de pebre roig picant",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu les bajoques i poseu-les en una rostidora, amb un poc d’oli d’oliva, i al forn. En estar les bajoques, peleu-les i poseu-les, amb la resta dels ingredients, en una cassola; i a continuació, enceneu el foc, a foc lent, i poseu-hi la cassola. Remeneu-ho tot de tant en tant, perquè no es creme i en poc de temps tindreu el chilindrón fet."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p108.webp"
  },
  {
    "numero": 99,
    "slug": "mero-torrat",
    "titol": "Mero (nero) torrat",
    "pagina": 109,
    "pagines": [
      109
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Mero tallat",
          "Oli d’oliva",
          "Sal, opcional"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una paella i poseu-la a calfar. A continuació, poseu-hi un ratllet d’oli d’oliva i el mero i deixeu que es faça. Finalment, presenteu-lo amb un salseta picada de julivert, alls secs i oli d’oliva."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p109.webp"
  },
  {
    "numero": 100,
    "slug": "sopa-d-alls",
    "titol": "Sopa d’alls",
    "pagina": 110,
    "pagines": [
      110
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "4 o 5 alls secs",
          "Trossos de pa dur",
          "Daus de cuixot (opcional)",
          "Pebre roig",
          "Ous"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una cassola i poseu a bullir els alls. En bullir l’aigua, rebaixeu el foc al mínim i afegiu-hi el pa dur, els trossos de cuixot (opcional), el pebre roig i un poc de sal i deixeu que es faça. Finalment, abans d’escudellar, afegiu-hi tants ous trencats com plats escudellareu. Deixeu que es facen els ous i serviu els plats."
        ]
      }
    ],
    "notes": [
      "Podeu fer sopes de pràcticament qualsevol verdura: de carabassa, de carabassí, de diverses verdures, etc. Us en presentem un parell de sopes més: sopa de tomaca i romer: ingredients: ceba picada; un poc de mantega de porc (sagí); mig quilo de tomaques; 2 gots de caldo vegetal; un poc de sucre per a corregir; pebre molt; oli d’oliva; sal; branquillons de romer. Preparació: en primer lloc, agafeu una cassola i sofregiu la ceba picada i el sagí fins que estiga tova. A continuació, afegiu-hi les tomaques, que ja haureu pelat i trossejat, i els dos gots de caldo vegetal. En bullir, rebaixeu el foc al mínim i deixeu que es coga uns 20 minuts, aproximadament. Afegiu-hi també sal al gust, un poc de sucre per a corregir i un poc de pebre molt. Finalment, i en estar tot cuit, passeu-ho per la batedora i llestos. En la presentació, afegiu-hi per damunt uns branquillons de romer. Sopa de timonet: ingredients: 1 litre d’aigua; un manoll de timó; 2 rovells d’ou; vinagre; 2 cullerades d’oli d’oliva; sal. Preparació: En primer lloc, agafeu un perol i afegiu-hi l’aigua, el manoll de timó, sal al gust i dues cullerades d’oli d’oliva i poseu el perol al foc. En bullir, retireu el perol del foc i lleveu el manoll de timó i reserveu-ho tot. Mentrestant, agafeu una safa i barregeu els rovells dels ous i afegiu-hi un poc de vinagre, perquè no quallen i poseu-los dins l’olla i remeneu-ho tot, perquè la sopa lligue ben lligada. Finalment, deixeu-ho reposar tot. En la presentació, acompanyeu el plat amb pa."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p110.webp"
  },
  {
    "numero": 101,
    "slug": "mullador-de-pesols-amb-conill",
    "titol": "Mullador de pèsols amb conill",
    "pagina": 111,
    "pagines": [
      111
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Trossos de conill o de pollastre o de magre",
          "Fetge de conill (en dos trossos)",
          "2 grapats de pèsols",
          "3 alls grans secs",
          "3 ametles pelades",
          "Ous bullits (un per persona)",
          "Julivert",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, poseu a calfar l’oli en una cassola, a foc viu, i sofregiu la carn. Paral.lelament, poseu a bullir els ous en una altra cassola. En estar sofregida la carn, retireu-la de la cassola i sofregiu els tres alls, les ametles i el tros del fetge del conill restant. A continuació, agafeu el morter i afegiu-hi el fetge sofregit, els alls sofregits, les tres ametles, el julivert i un poquet d’aigua i desfeu-ho tot amb el boix. Al mateix temps, poseu la carn sofregida anteriorment i els pèsols, a la cassola, i afegiu-hi aigua i en bullir, rebaixeu el foc al mínim. Tot seguit, afegiu-hi el picat del morter i els ous bullits, que ja haureu pelat i tallat a trossos, i saleu al gust. Deixeu que es coga a foc lent mitja hora o tres quarts i el menjar estarà llest."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p111.webp"
  },
  {
    "numero": 102,
    "slug": "mongetes",
    "titol": "Mongetes",
    "pagina": 112,
    "pagines": [
      112
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Fesols catalans secs o en pot cuits",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, poseu a calfar aigua en una cassola, a foc viu, i en bullir, afegiu-hi els fesols. A continuació, i rebaixeu el foc al mínim i, de tant en tant, trenqueu el bull, tot remenant-lo i afegint-hi un poc d’aigua freda i deixeu que es coguen els fesols, pràcticament tot el matí. En veure que es desfan, els fesols estaran bons. Finalment, en la presentació, afegiu-hi oli d’oliva i sal al gust. Es poden menjar tant calents com freds. Si no voleu bullir els fesols secs, els podeu comprar ja cuits, els calfeu una mica i els presenteu amb oli d’oliva i sal al gust."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p112.webp"
  },
  {
    "numero": 103,
    "slug": "fesols-estofats",
    "titol": "Fesols estofats",
    "pagina": 113,
    "pagines": [
      113
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 pot gran de fesols cuits",
          "3 fulles de llorer",
          "Verdura variada: 2 carlotes, 1 ceba grossa picada, 1 creïlla a trossos, 1 api trossejat, bajoquetes del filet a trossets, 1 grapat de pèsols, La que us vinga de gust.",
          "3 trossos de xoriç picant",
          "3 ossos de cuixot salats",
          "3 aletes de pollastre",
          "4 pilotes de dacsa (de facedura)",
          "1 pot de tomaca crua desfeta",
          "Pebre roig dolç",
          "3 pastilles de caldo de carn",
          "1 mesura d’oli d’oliva",
          "Sal al gust"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una olla i ompliu-la d’aigua fins els botons i afegiu-hi tots els ingredients en cru, tret de les pilotes de facedura. A continuació, enceneu el foc al màxim i, en bullir, rebaixeu-lo al mínim, unes dues hores, aproximadament, o quan xiule l’olla. Finalment, apagueu el foc i afegiu-hi les pilotes de dacsa i, en passar 5 o 10 minuts, estaran bones, ja que es faran amb la calor residual. Es fa d’aquesta manera, perquè no es desfacen pel perol."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p113.webp"
  },
  {
    "numero": 104,
    "slug": "ous-farcits",
    "titol": "Ous farcits",
    "pagina": 114,
    "pagines": [
      114
    ],
    "apartat": "plats",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "6 ous bullits",
          "1 pot de tomaca crua desfeta per al sofregit",
          "1 grapat de ceba picada per al sofregit",
          "2 pots de tonyina",
          "1 rall de vinagre per a bullir els ous",
          "Maonesa, la que admeta",
          "Un poc de sucre per a corregir el sofregit",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, bulliu els ous en una cassola, a foc viu, tot afegint-hi un rall de vinagre, perquè els rovells es facen ben durs. A continuació, sofregiu la tomaca i la ceba picada en una paella, amb oli d’oliva i sal al gust. En estar el sofregit, afegiu-hi els 2 pots de tonyina i remeneu tot ben remenat. Quan els ous estiguen cuits, peleu-los i talleu-los per la meitat i buideu-los els rovells i reserveu-los. Tot seguit, disposeu una safata, col.loqueu els ous tallats per la meitat buits i farciu-los amb el sofregit de tomaca i tonyina, tot fent servir una cullera. En acabar de farcir-los tots, afegiu-hi maonesa i distribuïu-la uniformement per tota la safata. Finalment, afegiu-hi els rovells dels ous desfets a trossos ben menuts i ja tindreu la recepta preparada."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p114.webp"
  },
  {
    "numero": 105,
    "slug": "sopetes",
    "titol": "Sopetes",
    "pagina": 116,
    "pagines": [
      116
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Pa dur",
          "Café",
          "Llet condensada"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, poseu en un plat pa dur a pessics. A continuació, afegiu-hi café i remeneu. Seguidament, afegiu-hi la llet condensada i remeneu-ho tot i ja podeu esmorzar."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "hX17FkEzDzw",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p116.webp"
  },
  {
    "numero": 106,
    "slug": "roses-amb-mel",
    "titol": "Roses amb mel",
    "pagina": 117,
    "pagines": [
      117
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Roses",
          "Mel",
          "Oli",
          "Canella"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, i en una paella, poseu a calfar oli i mel i remeneu fins que es barrege tot. Seguidament, afegiu-hi la canella i remeneu. En bullir tota la barreja, afegiu-hi les roses i tapeu i sacseu la paella amb la tapadora, perquè les roses esclaten. Serviu-les i a menjar."
        ]
      }
    ],
    "notes": [
      "També n’hi ha les salades que es fan amb oli i sal."
    ],
    "youtubeId": "bkiLNneekaE",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p117.webp"
  },
  {
    "numero": 107,
    "slug": "figues-seques",
    "titol": "Figues seques",
    "pagina": 118,
    "pagines": [
      118
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Figues seques",
          "Aigua calenta (bullint)",
          "Farina"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Després de collir figues madures, poseu-les a assecar al sol o a l’aire un parell de setmanes, tot estrenyent-les pel borró cap al centre de la figa, perquè no es facen dures i que agafen una forma redona. Passat el temps, i en notar que estan toves, no seques del tot, escaldeu-les amb aigua calenta (bullint), per a matar algun cuc que hi poguera quedar i enfarineu-les, tot estrenyent-les i ja es poden menjar. Si hi introduïu alguna nou o ametla, menjareu panfígol. A gaudir-les!!!"
        ]
      }
    ],
    "notes": [],
    "youtubeId": "Q3QYEIKRjTs",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p118.webp"
  },
  {
    "numero": 108,
    "slug": "dolc-de-tomaca",
    "titol": "Dolç de tomaca",
    "pagina": 119,
    "pagines": [
      119
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1,5 kg de tomaca crua desfeta",
          "600 gr. de sucre"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, poseu en un perol la tomaca crua desfeta i el sucre; remeneu-ho tot i enceneu el foc amb una flama mitja i en bullir, deixeu el foc al mínim. 2 hores després, en haver-se consumit l’aigua de la tomaca, ja estarà elaborat el dolç de tomaca."
        ]
      }
    ],
    "notes": [
      "Podeu fer dolç de quasi qualsevol cosa: de figues, d’albercocs, etc. Per exemple, de mores i poma: ingredients: mig quilo de mores; mig quilo de pomes de torrar; mig quilo de sucre; llima ratllada i el suc. Preparació: en primer lloc, agafeu el mig quilo de pomes, peleu-lo i trossegeu-lo. A continuació, renteu les mores i afegiu totes dues fruites a una cassola on afegireu el sucre i ho remenareu tot. Tot seguit, afegiu-hi el suc de la llima i la corfa; enceneu el foc i poseu la cassola a bullir i no deixeu de remenar, perquè no creme per baix. En estar bona la melmelada, lleveu la corfa de la llima i envaseu la melmelada de mores i pomes en envasos de vidre esterilitzats del vostre gust. Finalment, agafeu tots els envasos i bulliu-los en una olla gran per a poder conservar-los tot l’any."
    ],
    "youtubeId": "2ARmuJR1Nv0",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p119.webp"
  },
  {
    "numero": 109,
    "slug": "codonyat",
    "titol": "Codonyat",
    "pagina": 120,
    "pagines": [
      120
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 kg de codonys",
          "1 kg de sucre",
          "1 gotet xicotet d’aigua"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, peleu els codonys i lleveu-los els pinyols. A continuació, tritureu-ho tot amb la batedora i afegiu el sucre a la pasta de codony. Seguidament, introduïu la pasta de codony en un perol gran i enceneu el foc, a flama viva, fins que bulla i poseu el foc al mínim. El temps de cocció és d’1 hora i 15 minuts i heu d’anar removent la pasta amb un cullerot tot el temps, perquè no s’enganxe i es creme."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "IaC_Kt0jRrE",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p120.webp"
  },
  {
    "numero": 110,
    "slug": "mones-de-pasqua",
    "titol": "Mones de Pasqua",
    "pagina": 121,
    "pagines": [
      121
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 kg de farina",
          "2 pastilles de llevat",
          "200 gr. de mantega (n’hi ha qui fa servir oli)",
          "250 gr. de sucre",
          "3 ous grossos i 1 ou més (aquest darrer per pintar les mones abans de ficar-les al forn)",
          "Raspat de llima",
          "Un polsim de canella",
          "1 tassa de llet (300 mil.lilitres aproximadament, però si cal més llet, afegiu-n’hi a poc a poc)",
          "Oli d’oliva per a rentar-se les mans i treballar millor les mones i que no s’enganxen"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, desfeu el llevat amb la llet tèbia i ablaniu la mantega fins obtenir un punt de crema. A continuació, juntament amb el sucre i els ous, barregeu-ho tot amb la farina i afegiu-hi el raspat de llima i la canella. Seguidament, deixeu reposar la pasta, ben tapada, 3 o 4 hores. Una vegada haja pujat i inflat la pasta, torneu a pastar-la i doneu forma a les mones i deixeu-les reposar fins que augmenten la seua grandària, el doble. Finalment, abans de posar-les al forn (que ja ha d’estar a 180º), pinteu-les amb l’ou que sobra i espolseu-les amb sucre per damunt. Poseu-les al forn durant uns 30 minuts i mireu-les, ja que depèn del forn (si és elèctric, de flama o de llenya). Deixeu-les reposar, i ja són bones de menjar."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p121.webp"
  },
  {
    "numero": 111,
    "slug": "rosquetes-de-pa",
    "titol": "Rosquetes de pa",
    "pagina": 122,
    "pagines": [
      122
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Pa dur",
          "Llet",
          "Ous",
          "Oli calent",
          "Sucre",
          "Canella"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu pa dur dels dies anteriors i talleu-lo en rodanxes. Seguidament, banyeu les rodanxes en llet, perquè es reblanesquen. Poseu l’oli a calfar en una paella i simultàniament, banyeu les rosquetes en ou, abans de fregir-les. En agafar un color daurat, retireu-les de la paella i deixeu que s’escorren en paper que eixuga. Una vegada escorregudes, esposeu-les per damunt amb sucre o canella i ja són bones de menjar."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "8KraFBG_Hj4",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p122.webp"
  },
  {
    "numero": 112,
    "slug": "carabassa-al-forn",
    "titol": "Carabassa al forn",
    "pagina": 123,
    "pagines": [
      123
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Una carabassa partida per la meitat"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una serra i talleu per la meitat la carabassa. Poseu el forn a calfar a 200º i en estar calent, poseu-hi la carabassa partida unes quatre hores. En passar aquest temps, deixeu que es refrede i ja és bona de menjar."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "NBDzGUNdzLA",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p123.webp"
  },
  {
    "numero": 113,
    "slug": "bunyols-de-carabassa",
    "titol": "Bunyols de carabassa",
    "pagina": 124,
    "pagines": [
      124
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1/4 de carabassa",
          "750 grams de farina de força",
          "2 pastilles de llevat",
          "Oli d’oliva (2,5 litres, com a mínim)",
          "1 perol",
          "Llibrell",
          "Bunyoleres"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, poseu a bullir la carabassa 30 minuts. A continuació, agafeu les dues pastilles de llevat i desfeu-les en un got d’aigua (de temperatura ambient) i remeneu-ho amb una cullera. En estar bullida la carabassa i desfet el llevat, pasteu: agafeu la farina de força i afegiu-hi la pasta de la carabassa bullida, que ja li haureu tret la pell amb una cullera. Pasteu-la en un llibrell de fora a dins i afegiu-hi aigua del bull de la carabassa, a poc a poc. Pasteu fins que aconseguiu una pasta espessida. Paral.lelament, haureu posat a calfar l’oli d’oliva en un perol i la bunyolera, l’haureu posada a dins. En estar l’oli ben calent i la pasta feta, procediu a omplir la bunyolera amb la pasta, tot fent servir un pitxer o un casset. No feu sevir bunyoleres escurades, perquè s’hi enganxarà la pasta i no fareu bunyols. Feu servir bunyoleres torcades amb oli i prou. Poseu la bunyolera dins l’oli calent del perol i espereu que la pasta se n’isca de la bunyolera i li feu la volta. Així successivament fins acabar tota la pasta del llibrell o del pitxer."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "87Ef4uPgjiI",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p124.webp"
  },
  {
    "numero": 114,
    "slug": "bunyols-de-vent-o-de-pessic",
    "titol": "Bunyols de vent o de pessic",
    "pagina": 125,
    "pagines": [
      125
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "250 grams de farina",
          "1 sobret de llevat",
          "1 got de llet, però no ple fins dalt",
          "1 ou",
          "1 llima ratllada",
          "Oli d’oliva",
          "Sucre o canella"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, pasteu la farina amb el llevat, el got de llet, l’ou i la llima ratllada fins que quede una pasta fina i poseu-la en un pitxer o casset. També podeu fer servir la batedora per a pastar. A continuació, poseu a calfar oli d’oliva en una paella fonda i en estar ben calent, poseu la pasta en una cullera sopera i introduïu-la dins l’oli a poc a poc i doneu a la pasta la forma redona. En la presentació, feu servir sucre i canella, segons el gust."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "pJBbOyegKDE",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p125.webp"
  },
  {
    "numero": 115,
    "slug": "cocotets-de-tomaca-o-de-verdura",
    "titol": "Cocotets (pastissos) de tomaca o de verdura (espinacs i bledes)",
    "pagina": 126,
    "pagines": [
      126,
      127
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": "Ingredients per a la pasta",
        "linies": [
          "1 got de llet",
          "1 got de cervesa o de vi blanc",
          "1 got d’oli d’oliva",
          "Farina, la que admeta"
        ]
      },
      {
        "titol": "Farciment de tomaca",
        "linies": [
          "1 pot de tomaca crua",
          "Un poc de sucre per a corregir",
          "2 pots de tonyina",
          "Oli d’oliva",
          "Sal"
        ]
      },
      {
        "titol": "Variant",
        "linies": [
          "1 tassa d’oli d’oliva",
          "1 tassa d’aigua",
          "Un ratllet de vinagre",
          "1 ou",
          "Un poquet de sucre",
          "Farina que admeta"
        ]
      },
      {
        "titol": "Farciment de verdura",
        "linies": [
          "2 bloquets d’espinacs i bledes",
          "Allets secs trossejats",
          "Pinyonets",
          "Oli d’oliva",
          "Sal"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": "Preparació de la pasta",
        "linies": [
          "En primer lloc, agafeu una safa i afegiu-hi l’oli d’oliva i tots els ingredients i pasteu. En estar la pasta bona, passeu-li el corró (el rodillo) i feu-la ben fina. Seguidament, agafeu un got per tallar la pasta i donar la forma del pastisset."
        ]
      },
      {
        "titol": "Preparació del farciment de tomaca",
        "linies": [
          "Primerament, agafeu una paella i sofregiu la tomaca, tot fent servir l’oli d’oliva, el sucre per a corregir-ne l’acidesa i la sal. En estar tot sofregit, retireu-ho de la paella i afegiu a la tomaca la tonyina i remeneu-ho tot."
        ]
      },
      {
        "titol": "Preparació del farciment de verdura",
        "linies": [
          "Poseu a bullir els espinacs i les bledes i, en estar bullides, sofregiu-les en una paella amb l’oli d’oliva, els allets secs, que ja haureu trossejat, els pinyonets i la sal."
        ]
      },
      {
        "titol": "Preparació",
        "linies": [
          "Una vegada feta la pasta i donada la forma del cocotet, afegiu-hi la tomaca fregida o la verdura i tanqueu el pastisset amb una forqueta. En tenir-los preparats, pinteu amb el rovell de l’ou els lloms dels pastissets i introduïu-los al forn, a 200 graus, mitja hora, més o menys i estaran bons. Vigileu perquè no es cremen."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p127.webp"
  },
  {
    "numero": 116,
    "slug": "crema-per-a-farcir",
    "titol": "Crema per a farcir",
    "pagina": 128,
    "pagines": [
      128
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "3 rovells d’ous",
          "Llima ratllada i canella al gust",
          "3 rovells de sucre",
          "1 got de llet",
          "1 cullerada de Maizena"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc agafeu un casset i afegiu-hi tots els ingredients. A continuació, enceneu el foc, al mínim, i poseu-hi el casset i aneu remenant-ho tot fins aconseguir un líquid espessit. En estar espessit, la crema pastissera estarà bona per a ser usada. Per a farcir els dolços o coronar-los, podeu fer servir una màniga pastissera o una bossa de plàstic neta en què li haureu fet un forat per una de les seues puntes i la fareu servir com a màniga pastissera."
        ]
      }
    ],
    "notes": [
      "També n’hi ha una variant amb gust d’ametla, els ingredients de la qual són els següents: 1/4 de quilo de sucre; 1/4 de quilo d’ametla molta; 2 gots de llet; 4 ous; canella i llima ratllada al gust. Pel que fa a la preparació, es fa igual que la crema per a farcir."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p128.webp"
  },
  {
    "numero": 117,
    "slug": "pastissos-de-fullada",
    "titol": "Pastissos de fullada",
    "pagina": 129,
    "pagines": [
      129
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Pasta fullada",
          "Crema per farcir pastissos"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, prepareu la crema per a farcir pastissos (cf), explicada a la pàgina anterior, i una vegada feta, agafeu la pasta fullada, talleu-la en porcions quadrades, afegiu-hi la crema pastissera i tapeu-los amb la mateixa pasta fullada. Poseu els pastissos en una llanda i poseu-los al forn a 170 graus, uns 15 o 20 minuts, aproximadament, o en estar daurats, i els pastissos estaran fets. En la presentació, afegiu-hi sucre molt per damunt. La pasta fullada, la podeu comprar feta o fer-la vosaltres mateixos. (cf) la nota 17 de la recepta dels pastissos de nadal, ja que s’explica com fer la pasta fullada a casa. El farcit també presenta variants i el podeu fer amb flam i llet."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p129.webp"
  },
  {
    "numero": 118,
    "slug": "fabiola-de-coco",
    "titol": "Fabiola de coco",
    "pagina": 130,
    "pagines": [
      130
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1/4 de quilo de coco",
          "1/4 de quilo de sucre",
          "8 ous",
          "Un poc de sagí (mantega de porc per untar el motle)"
        ]
      },
      {
        "titol": "Ingredients per l’almívar",
        "linies": [
          "1/2 de quilo de sucre",
          "1/4 de litre d’aigua",
          "100 grams de farina",
          "Un rall d’herbero"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una safa i alceu al punt de neu les clares dels ous. A continuació, afegiu-hi els 8 rovells dels ous i remeneu-ho tot. Tot seguit, afegiu-hi el sucre, remeneu bona i cosa i finalment, afegiu-hi el coco. En tenir la pasta preparada, reserveu-la i agafeu un motle i unteu-li una mica de sagí (mantega de porc), perquè no s’enganxe la base, es creme i no isca del motle, en traure’l del forn. Una vegada untat el motle, afegiu-hi la pasta de coco i repartiu-la uniformement per tot el motle. Tot seguit, enceneu el forn a 150 graus, durant tres quarts d’hora, aproximadament, i deixeu que es faça. En la presentació, punxeu el pastís amb una forqueta i caleu-ho ben calat; és a dir, afegiu-hi l’almívar per sobre el pastís i procureu que l’almívar n’entre ben endins. Finalment, escampeu per damunt del pastís un poc de coco molt, per a decorar i serviu-lo.",
          "Per a fer l’almívar, agafeu tots els ingredients i afegiu-los a una cassola i poseu-la al foc lent. Remeneu-ho tot, a poc a poc, fins que es faça."
        ]
      }
    ],
    "notes": [
      "La fabiola també presenta variants, ja que es pot fer amb nous, ametles i qualsevol fruit sec dels vostre gust. El procediment és el mateix que el presentat; només canvien els fruits secs i se li afig llima ratllada i canella al gust, en pastar. En la presentació, afegiu-hi l’almívar i espolseu per damunt el fruit sec elegit molt."
    ],
    "youtubeId": "7YHl3O2G1gY",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p130.webp"
  },
  {
    "numero": 119,
    "slug": "tortell-de-nous-i-ametles",
    "titol": "Tortell de nous i ametles",
    "pagina": 131,
    "pagines": [
      131
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "6 ous",
          "200 grams de farina",
          "250 grams d’ametla molta",
          "250 grams de nous moltes",
          "250 grams de sucre",
          "1 sobre de Royal",
          "Sagí (per a refregar el motle)",
          "Caramel líquid (per a refregar el motle)"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una safa i alceu al punt de neu les clares dels ous. A continuació, afegiu-hi el sucre i pasteu; després els rovells dels ous i pasteu; tot seguit, les ametles moltes i les nous moltes i pasteu; i finalment, afegiu-hi la farina i el sobre de Royal i pasteu-ho tot bona cosa. En tenir-ho tot ben pastat, agafeu un motle i refregueu-hi el sagí, perquè no s’enganxe i es creme el tortell, i el caramel líquid i tot seguit, afegiu-hi tot el pastat, uniformement, fins que el motle estiga ben ple. Finalment, enceneu el forn, a 150 graus, i introduïu-hi el motle 1 hora, aproximadament. En la presentació, hi podeu afegir sucre molt per damunt, crema pastissera, nata muntada, etc., tot decorant-la."
        ]
      }
    ],
    "notes": [
      "En podem trobar variants, com ara tortell d’ametla. Ingredients: 1 dotzena de rovells d’ous; 1 quarta i mitja de sucre; mig quilo d’ametló molt; 1 cullerada de farina; un pessic de canella. Preparació: en primer lloc, agafeu una safa i alceu al punt de neu les clares dels ous. A continuació, afegiu-hi el sucre i remeneu, els rovells i remeneu, l’ametló molt i remeneu, la farina i remeneu, i finalment, la canella i remeneu. Pasteu-ho tot uniformement i en veure que no se us enganxa als dits, agafeu una llanda per al forn, amb paper vegetal, i disposeu-hi la pasta uniformement. Finalment, enceneu el forn a 180 graus, i introduïu-hi la llanda 1 hora, aproximadament, o en veure que s’ha daurat. Tortell de nous: ingredients: 1/4 de quilo de nous, a trossets; 1/4 de quilo d’ametla molta; 1/4 de quilo de carabassat ratllat; 2 ous; i 1/4 de quilo de sucre. Preparació: com el tortell d’ametla."
    ],
    "youtubeId": "aqzDNz_guic",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p131.webp"
  },
  {
    "numero": 120,
    "slug": "mantegades",
    "titol": "Mantegades",
    "pagina": 132,
    "pagines": [
      132
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 tassa d’oli",
          "1 tassa de mantega de porc (sagí)",
          "2 rovells d’ous",
          "Llima ratllada, la que admeta",
          "Canella, la que admeta",
          "Farina, la que admeta",
          "1 tassa de sucre"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu una safa i afegiu-hi la tassa d’oli d’oliva, el got de sagí, els 2 ous, la llima ratllada, la canella i pasteu-ho tot. A continuació, afegiu-hi la farina que admeta, la tassa de sucre i pasteu-ho tot bona cosa. En estar tot ben pastat, doneu-li forma a la pasta i feu unes coquetes redones, primes, i passeu-les per les clares dels ous, pel sucre molt i la canella. Finalment, deixeu-les en una llanda per al forn, amb paper vegetal, i introduïu-la al forn, a 180 graus. En estar daurades, estaran bones. En la presentació, espolseu sucre molt per damunt de les mantegades."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p132.webp"
  },
  {
    "numero": 121,
    "slug": "magdalenes",
    "titol": "Magdalenes",
    "pagina": 133,
    "pagines": [
      133
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Mig quilo de farina",
          "Mig quilo de sucre",
          "4 ous",
          "2 sobrets de llimonada",
          "Llima ratllada i canella al gust",
          "3 mesures de llet",
          "3 mesures d’oli d’oliva"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu les clares dels ous i alceu-les al punt de neu. Seguidament, afegiu-hi els 4 rovells dels ous i remeneu-ho tot. A continuació, afegiu-hi el sucre, la canella, la llima ratllada, els 2 sobres de llimonada, la farina, les mesures d’oli i les mesures de la llet, tot això a poc a poc, mentre ho menegeu. Una vegada estiga tot pastat, poseu la pasta damunt de paper de forn que estarà preparat a la llanda i poseu la pasta de magdalena en els motles de magdalena; distribuïu les magdalenes per tota la llanda i fiqueu-la al forn, 3 quarts d’hora, aproximadament, a 150 graus."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p133.webp"
  },
  {
    "numero": 122,
    "slug": "bescuit-d-ametla",
    "titol": "Bescuit d’ametla",
    "pagina": 134,
    "pagines": [
      134
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "5 ous",
          "5 cullerades grans de sucre",
          "3 gots de llet",
          "1 got xicotet d’herbero o qualsevol altre licor",
          "250 grams d’ametla molta",
          "1 grapat d’ametla terrosa",
          "100 grams de margarina vegetal",
          "Sagí (per a refregar el motle)",
          "1 llima ratllada"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una safa i alceu al punt de neu les clares dels ous. A continuació, afegiu-hi dos cullerades de sucre i pasteu; després els rovells dels ous i pasteu; tot seguit, les tres cullerades de sucre que hi falten i pasteu; i finalment, afegiu-hi la llima ratllada i la resta d’ingredients i pasteu-ho tot bona cosa. En tenir-ho tot ben pastat, agafeu un motle i refregueu-hi el sagí, perquè no s’enganxe i es creme el bescuit i tot seguit, afegiu-hi tot el pastat, uniformement, fins que el motle estiga ben ple. Finalment, enceneu el forn, a 200 graus, i introduïu-hi el motle 10 minuts i després poseu-lo a 175 graus fins que s’acabe de fer el bescuit; ço és, 30 minuts, aproximadament. En la presentació, afegiu sucre molt per damunt."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "m0C-_8hciyk",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p134.webp"
  },
  {
    "numero": 123,
    "slug": "bambes",
    "titol": "Bambes (ensaïmades)",
    "pagina": 135,
    "pagines": [
      135
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 quilo de farina",
          "4 ous",
          "Mig litre de llet",
          "2 mesures d’oli d’oliva",
          "1/4 de quilo de sucre",
          "2 pastilles xicotetes de llevat"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu una safa i afegiu-hi la farina, els 4 ous, el mig litre de llet i les dues mesures d’oli d’oliva i pasteu-ho tot ben pastat. A continuació, afegiu-hi el mig quilo de sucre, pasteu i afegiu-hi les dues pastilles de llevat i pasteu bona cosa fins que la pasta estiga bona. A continuació, agafeu la pasta i doneu-li forma redona, com ara de xurros o rosquilletes i rotlleu-la de dins a fora fins a aconseguir una ensaïmada redona. En tenir-les enllestides, tapeu-les i deixeu-les reposar mitja hora o més, perquè s’inflen i es facen bones. En estar bones, introduïu-les al forn, a 180 graus, i vigileu-les. En estar daurades, estaran bones. En la presentació, espolseu-hi sucre molt."
        ]
      }
    ],
    "notes": [
      "També podeu fer servir el sucre de lligabosc: ingredients: 6-10 cullerades de pètals de flors de lligabosc; 350 grams de sucre. Preparació: en primer lloc, agafeu una safa i bateu les flors de lligabosc amb el sucre. A continuació, poseu-ho en un recipient, tapeu-lo i deixeu-lo reposar una setmana. En passar aquest temps, garbelleu el sucre i les flors i poseu el garbellat en un pot de vidre hermètic, i llest per a ser usat."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p135.webp"
  },
  {
    "numero": 124,
    "slug": "flam-d-ametla",
    "titol": "Flam d’ametla",
    "pagina": 136,
    "pagines": [
      136
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "6 ous",
          "2 gots de sucre",
          "3 gots de llet",
          "1 got d’ametla molta",
          "24 galetes Maria moltes",
          "Llima ratllada",
          "Canella en rama"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una safa i alceu al punt de neu les clares dels ous. A continuació, Afegiu-hi els rovells dels ous i pasteu; després el sucre i pasteu; tot seguit, afegiu-hi l’ametla molta i pasteu; després, les 24 galetes moltes i pasteu. Finalment, afegiu-hi la llet, que ja la tindreu calenta amb la llima ratllada i la canella en rama, i pasteu-ho tot bona cosa. En tenir-ho tot ben pastat, agafeu una llanda per al forn, poseu-hi aigua i a continuació, agafeu un motle i afegiu-hi tot el pastat i poseu el motle dins la llanda del forn amb aigua. Finalment, enceneu el forn, a 150 graus, i introduïu-hi la llanda amb el motle al bany de maria fins que qualle."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "tU6ZoSqp4wo",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p136.webp"
  },
  {
    "numero": 125,
    "slug": "carquinyols-de-bescuit",
    "titol": "Carquinyols de bescuit",
    "pagina": 137,
    "pagines": [
      137
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "6 ous",
          "Mig quilo de farina",
          "Mig quilo de sucre",
          "Mig quilo d’ametla",
          "1 llima ratllada"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, bateu els ous i en tenir-los batuts, pasteu-los amb el sucre, la farina, l’ametla i la llima ratllada, en una safa. En estar tot pastat, agafeu una llanda per al forn, col.loqueu-hi paper i disposeu-hi tot el pastat uniformement per la llanda. Finalment, enceneu el forn a 150 graus, mitja hora aproximadament, i retireu la llanda del forn. En la presentació, talleu el bescuit a trossos."
        ]
      }
    ],
    "notes": [
      "També hi ha els carquinyols durs, els ingredients dels quals són els següents: 700 grams de farina; 625 grams de sucre; 500 grams d’ametla torrada; 1 sobre de llimonada, sencera; lima ratllada i canella al gust; 4 ous. Pel que fa a la preparació, primerament, agafeu una safa i alceu al punt de neu els 4 ous i afegiu-hi el sucre i pasteu-ho tot bona cosa. A continuació, afegiu-hi la farina, l’ametla torrada, el sobre de llimonada, la llima ratllada i la canella i pasteu-ho tot ben pastat. En estar tot ben pastat, i doneu-li a la pasta una forma redona, com ara de rotllo llarg i talleu-lo a trossos de carquinyol i en tenir-los enllestits, introduïu-los al forn, a 180 graus, i vigileu-los. En estar daurats, estaran bons."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p137.webp"
  },
  {
    "numero": 126,
    "slug": "pastissos-de-nadal",
    "titol": "Pastissos de nadal (de moniato o de cabell d’àngel)",
    "pagina": 138,
    "pagines": [
      138
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 tassa de mantega de porc (sagí) o 1 tassa d’oli d’oliva",
          "1 tassa de sucre",
          "1 tassa d’aiguardent",
          "Farina, la que admeta",
          "2 rovells d’ous",
          "Les clares, apart",
          "Cabell d’àngel o moniato"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu una cassola i afegiu-hi l’oli (o el sagí), el sucre, els rovells dels ous, l’aiguardent i la farina i pasteu-ho tot. En veure que la pasta no s’enganxe als dits, traieu la pasta de la cassola i passeu-li el corró (el rodillo), tot fent la pasta fina. En estar fina, doneu-li la forma de pastissos (podeu fer servir la vora d’un got), farciu-lo de cabell d’àngel o de moniato i tanqueu el pastís. Seguidament, encareu-les; és a dir, unteu-ne el llom amb la clara i sucre i en tenir-los preparats, col.loqueu-los al forn, en una llanda amb paper, perquè no es cremen, a 150 graus, mitja hora, aproximadament o en veure’ls daurats."
        ]
      }
    ],
    "notes": [
      "El dolç de moniato es pot comprar o fer a casa: Ingredients: 2 kg de moniato; sucre; canella. Preparació: en primer lloc, peleu els moniatos i bulliu-los 10-15 minuts o torreu-los al forn. A continuació, peseu-los i el seu pes serà, un poc menys, la mesura de sucre que cal posar. Seguidament, agafeu una cassola i enceneu el foc i afegiu-hi la pasta de moniato, el sucre i la canella i un poc d’aigua i, en bullir tot, rebaixeu el foc al mínim i remeneu i, en veure que s’espesseix, mig hora més o menys, serà senyal que el dolç de moniato estarà bo. Guardeu-lo a la nevera fins a la seua utilització. Pel que fa al cabell d’àngel, es pot comprar o fer a casa, tot seguint el mateix procediment que el dolç de moniato, però fent servir una varietat molt específica de carabassa.",
      "La pasta de fullada també s’usa per a fer pastissets de Nadal. Heus ací la recepta. Ingredients; 6 rovells d’ous; 6 closques d’ou de mantega de porc; 6 closques d’ou plenes d’aigua; i farina, la que admeta. Preparació: en primer lloc, agafeu una safa i afegiu-hi els rovells dels ous, la mantega i l’aigua i pasteu-ho tot. A continuació, afegiu-hi la farina i pasteu-ho tot bona cosa fins que no se us enganxe als dits. Tot seguit, feu 3 pilots de pasta i agafeu el primer pilot, passeu li el corró (el rodillo), afegiu per damunt sagí tanqueu el pilot. Torneu a passar-li el corró i torneu a afegir-li el sagí. Així tres vegades per pilot; és a dir, tres vegades per cada pilot; total, nou. Com més pasteu i més li passeu el corró i hi afegiu sagí, més fullada eixirà la pasta."
    ],
    "youtubeId": "PtU2iBb-U4c",
    "lamina": null
  },
  {
    "numero": 127,
    "slug": "pastissos-d-aire",
    "titol": "Pastissos d’aire (de moniato o de cabell d’àngel)",
    "pagina": 139,
    "pagines": [
      139
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Mig quilo d’ametla molta",
          "Quarta i mitja de sucre",
          "2 cullerades de farina",
          "3 clares d’ous",
          "1 ou sencer",
          "8 neules"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu una safa i afegiu-hi l’ametla molta, el sucre, la farina, l’ou sencer i pasteu-ho tot. En veure que la pasta no s’enganxe als dits, traieu la pasta de la safa i passeu-li el corró (el rodillo), tot fent la pasta fina. En estar fina, doneu-li la forma de pastissos (podeu fer servir la vora d’un got), farciu-lo de cabell d’àngel o de moniato i tanqueu el pastís. Seguidament, encareu-les; és a dir, unteu-ne el llom amb les clares i en tenir-los preparats, poseu-los sobre les neules i deixeu-los en un lloc on córrega l’aire, almenys un dia."
        ]
      }
    ],
    "notes": [
      "El dolç de moniato i el cabell d’àngel s’expliquen a la recepta dels Pastissos de nadal (cf.), a la nota 17."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p139.webp"
  },
  {
    "numero": 128,
    "slug": "carinyitos",
    "titol": "Carinyitos",
    "pagina": 140,
    "pagines": [
      140
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "2 ous",
          "1/4 (250 grams) de sucre",
          "1/4 (250 grams) de coco molt (o d’ametla, d’avellanes, de nous, etc.)",
          "Motles de magdalena xicotets"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una safa i afegiu-hi els 2 ous i remeneu-los. A continuació, afegiu-hi el sucre i remeneu-ho tot. Finalment, afegiu-hi el coco i remeneu-ho tot ben remenat. En aconseguir una pasta, farciu els motles per a carinyitos i, en estar tots plens, poseu el forn a calfar, a 200 graus, 30 minuts aproximadament, i en estar daurats, estaran bons."
        ]
      }
    ],
    "notes": [
      "Aquesta descripció correspon a la recepta de coco molt; però se’n poden fer igualment d’ametles moltes, de nous moltes, d’avellanes moltes, etc. El procediment és exactament el mateix, pel que fa a mides i pesos. Només canvia el fruit sec."
    ],
    "youtubeId": "0DfRcq-Oxi8",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p140.webp"
  },
  {
    "numero": 129,
    "slug": "coca-de-nous",
    "titol": "Coca de nous",
    "pagina": 141,
    "pagines": [
      141
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "600 grams de sucre",
          "200 grams d’ametla molta a trossets",
          "200 grams de nous molts a trossos",
          "200 grams de farina",
          "7 ous al punt de neu",
          "1 got de llet (opcional)",
          "1 sobre de Royal",
          "Llima ratllada",
          "Canella",
          "Neula"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una safa i alceu al punt de neu les clares dels ous. A continuació, Afegiu-hi els rovells dels ous i pasteu; després el sucre i pasteu; tot seguit, afegiu-hi la llet (opcional) i la farina i pasteu; després, les nous i pasteu. Finalment, afegiu-hi la llima ratllada i la canella i pasteu-ho tot bona cosa. En tenir-ho tot ben pastat, agafeu una llanda per al forn, poseu-hi la neula per tota la base i afegiu-hi la pasta i distribuïu-la uniformement per tota la llanda. Tot seguit, afegiu per la damunt de la pasta l’ametla molta i distribuïu-la uniformement per tot l’escampat. Finalment, enceneu el forn, a 150 graus, i introduïu-hi la llanda, 1 hora, i la coca de nous estarà bona."
        ]
      }
    ],
    "notes": [
      "També trobem variants, com ara els pastissos cristines: ingredients: 8 ous al punt de neu; mig quilo de sucre; mig quilo d’ametla; 2 cullerades de farina; llima ratllada i canella al gust, neules i sucre fi per damunt. Preparació: com el descrit a la coca de nous. Un altra variant és el torró de gat: ingredients: 1 quilo de sucre; 1 quilo d’ametles torrades sense escaldar; llima ratllada; i neules. Preparació: en primer lloc, agafeu una cassola, enceneu el foc al mínim, i afegiu-hi el sucre i les ametles i la llima ratllada i remeneu-ho tot fins que es faça una pasta suau. Tot seguit, i en tenir la pasta feta, poseu cullerades de pasta d’ametla sobre trossets de neula, a manera de base, i tapeu-ho, també, amb un altre tros de neula. Finalment, i en tenir tots els trossos preparats, doneu-los un colp de foc per a calfar-los una mica i en assecar-se, estaran bons."
    ],
    "youtubeId": "NiMYLO26cp0",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p141.webp"
  },
  {
    "numero": 130,
    "slug": "coca-de-canonge",
    "titol": "Coca de canonge (o de llanda)",
    "pagina": 142,
    "pagines": [
      142
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Mig quilo de farina",
          "Mig quilo de sucre",
          "4 ous",
          "2 sobres de llimonada",
          "1 llima ratllada",
          "Canella",
          "4 mesures de llet",
          "3 mesures d’oli d’oliva"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu les clares dels ous i alceu-les al punt de neu. Seguidament, afegiu-hi els 4 rovells dels ous i remeneu-ho tot. A continuació, afegiu-hi el sucre, la canella, la llima ratllada, els 2 sobres de llimonada, la farina, les mesures d’oli i les mesures de la llet, tot això a poc a poc, mentre ho menegeu. Una vegada estiga tot pastat, poseu la pasta damunt de paper de forn que estarà preparat a la llanda i distribuïu-la per tota la llanda i fiqueu-la al forn, 3 quarts d’hora, aproximadament, a 150 graus. Per a la presentació, podeu posar per damunt de la coca sucre molt o el que us vinga de gust."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "wR-6GwTigM4",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p142.webp"
  },
  {
    "numero": 131,
    "slug": "coca-de-xocolate",
    "titol": "Coca de xocolate",
    "pagina": 143,
    "pagines": [
      143
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "6 ous al punt de neu",
          "2 envasos de iogurt natural",
          "1 envàs de iogurt natural ple d’oli d’oliva",
          "2 envasos de iogurt natural ple de sucre",
          "3 envasos de iogurt atural plens de farina",
          "2 envasos de iogurt natural plens de xocolate",
          "2 envasos de iogurt natural plens de Royal",
          "Mitja llima ratllada i canella al gust"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu una safa i alceu les clares al punt de neu, dels sis ous, i seguidament afegiu-n’hi els rovells. A continuació, removeu-ho tot i afegiu-hi els iogurts naturals i remeneu. Tot seguit, afegiu-hi les mides de xocolate, remeneu-ho, les mides de farina, remeneu-ho, i la mida de l’oli d’oliva. En tenir tots aquests ingredients afegits i remenats, afegiu-hi la llima ratlla, la canella al gust i la mida del Royal i torneu a remenar-ho tot, perquè no hi queden borronets a la pasta. Finalment, disposeu tota la pasta en una llanda per al forn, amb paper especial perquè no es creme la coca, i introduïu-la al forn, a 180 graus, mitja hora, aproximadament, i la coca estarà bona."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "YLvgEcMj4qE",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p143.webp"
  },
  {
    "numero": 132,
    "slug": "coca-de-perellons",
    "titol": "Coca de perellons",
    "pagina": 144,
    "pagines": [
      144
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "4 ous",
          "250 grams de farina",
          "250 grams de sucre",
          "1 got xicotet d’oli d’oliva",
          "1 Royal",
          "Mig quilo de perellons (pelats i trossejats)",
          "Llima ratllada i canella al gust"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una safa i alceu al punt de neu les clares dels ous. A continuació, afegiu-hi els ous i remeneu-ho tot. Tot seguit, afegiu-hi el sucre, pasteu i afegiu-hi la llima ratllada i la canella i remeneu-ho tot bona cosa. A continuació, afegiu-hi la farina, pasteu, i afegiu-hi els perellons pelats i trossejats i remeneu-ho tot amb gana. Finalment, afegiu-hi el gotet xicotet d’oli d’oliva i continueu pastant. Tot seguit, agafeu una llanda per al forn i col.loqueu-hi paper vegetal, perquè no es creme la pasta i repartiu-la uniformement per tota la llanda. Per acabar, enceneu el forn a 200 graus, durant una hora, aproximadament, i deixeu que es coga. En la presentació, afegiu-hi sucre molt per damunt i talleu-la en trossos quadrats i serviu-la."
        ]
      }
    ],
    "notes": [
      "Aquesta recepta presenta variants, ja que es poden fer servir pomes, peres, bresquilles, etc. El procediment és el mateix, pel que fa a mides i ingredients; només canvia la fruita utilitzada."
    ],
    "youtubeId": "rYPg0TGXgjQ",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p144.webp"
  },
  {
    "numero": 133,
    "slug": "coca-de-carabassa-de-tots-sants",
    "titol": "Coca de carabassa de Tots Sants",
    "pagina": 145,
    "pagines": [
      145
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "250 grams de carabassa al forn",
          "200 ml d’oli de gira-sol",
          "200 grams de sucre",
          "250 grams de farina",
          "3 sobrets de llimonada",
          "3 ous",
          "1 pell de taronja ratllada",
          "Canella"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, haureu posat la carabassa al forn, a 200 graus, durant 2 hores i mitja, per a aprofitar-ne la carn per a la fer la coca. Una vegada la carabassa cuita, agafeu un llilbrell i afegiu-hi els 3 ous, el sucre i bateu-ho tot. A continuació, afegiu-hi l’oli de gira-sol i bateu-ho tot fins que espumege. Tot seguit, agafeu el 250 grams de carabassa i esclafeu-la amb una forqueta i que quede, com ara un puré, afegiu-lo al llibrell i pasteu-ho tot amb la batedora. Seguidament, afegiu-hi la canella, els sobrets de llimonada i finalment la farina. Podeu passar-la per un colador, perquè no faça borrons en la pasta resultant. Agafeu una llanda i col.loqueu paper del forn a la base de la llanda, perquè no es creme la base de la futura coca i escampeu la pasta uniformement per la llanda. Poseu-hi per damunt un poc de sucre refinat, i al forn. El forn, poseu-lo a 200 graus i en ficar-li la llanda, rebaixeu-lo a 180 graus fins que s’acabe de fer. En la presentació, podeu fer un dibuix geomètric amb sucre refinat, tot fent servir un plantilla, si és el cas."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "NNYeov3B6Ww",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p145.webp"
  },
  {
    "numero": 134,
    "slug": "esparteros",
    "titol": "Esparteros",
    "pagina": 146,
    "pagines": [
      146
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 ou",
          "75 grams de mantega de porc (sagí)",
          "250 grams de farina",
          "1 mesura d’oli d’oliva",
          "1 got xicotet d’aigua (n’hi ha qui li posa 1 gotet de llet)",
          "1 pastilla de llevat",
          "75 grams de sucre",
          "Un pessic de sal",
          "Canella al gust"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una safa i afegiu-hi la farina, l’ou i l’oli d’oliva i pasteu. A continuació, afegiu-hi l’aigua, la pastilla de llevat, el sucre i el pessic de sal i pasteu-ho tot bona cosa. Finalment, en veure que no se us enganxa als dits, tapeu la pasta i deixeu-la reposar fins que es faça bona; és a dir, s’infle. Mentre s’infla, mescleu el sagí i la canella i barregeu-ho bé i reserveu-ho. Una vegada bona la pasta, agafeu un corró (rodillo) i feu la pasta fina i talleu-la de forma rectangular. A continuació, afegiu a la pasta rectangular la mescla del sagí i la canella i rotlleu-la, tanqueu-la i feu-li dos talls superficials amb un tallador (un cúter, fulletes d’afaitar, etc.) i poseu el forn a calfar a 180 graus. Poseu els esparteros en una llanda amb paper vegetal i en estar el forn calent, introduïu-los-hi i, en estar daurats, estaran bons. En la presentació, afegiu-los-hi sucre molt i canella al gust."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p146.webp"
  },
  {
    "numero": 135,
    "slug": "rollets-d-ou",
    "titol": "Rollets d’ou",
    "pagina": 147,
    "pagines": [
      147
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "200 grams de farina",
          "160 grams d’oli d’oliva",
          "1 got d’aigua",
          "8 ous",
          "400 grams de sucre",
          "Essència de vainilla"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, enceneu el foc i agafeu un casset i afegiu-hi l’aigua i l’oli i en trencar el bull, retireu-lo del foc i afegiu-hi la farina i remeneu tota la pasta, a poc a poc, fins que estiga tot ben mesclat. Finalment, deixeu que es refrede. Tot seguit, agafeu una safa i afegiu-hi la pasta i els 6 ous i pasteu bona cosa fins que no s’enganxen els dits. Seguidament, agafeu la pasta i aplaneu-la i doneu-li una forma redona i feu un forat al mig. En tindre tots els rotllets fets, deixeu-los reposar. Mentre reposen els rotllets, prepareu la merenga com segueix: alceu al punt de neu la clara dels dos ous restants i afegiu-hi essència de vainilla. En tenir-ho fet, poseu el forn a calfar a 180 graus i agafeu una llanda amb paper vegetal i poseu-hi els rotllets; introduïu la llanda al forn, mitja hora aproximadament, i en estar bons, traieu-los-en i afegiu-los-hi la merenga, tot fent servir una màniga pastissera, una bossa o una cullera gran i torneu-los a introduir al forn, perquè la merenga es faça dura, senyal que ja estaran bons."
        ]
      }
    ],
    "notes": [
      "N’hi de variants, com ara més menuts i sense merenga i l’elaboració és com segueix: ingredients: ous; 1 mesura d’oli d’oliva; 1/4 sucre; 1 llimonada (de sobre); farina, la que admeta. Preparació: agafeu una safa i barregeu tots els ingredients i pasteu-ho tot bona cosa fins que no s’enganxe als dits. Seguidament, doneu-li forma redona a la pasta i feu-los un forat al mig. Finalment, poseu-los en una llanda amb paper vegetal i introduïu-la al forn, a 180 graus, i, en estar daurats, estaran bons. També n’hi ha qui li posa llavoretes d’anís."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p147.webp"
  },
  {
    "numero": 136,
    "slug": "natilles",
    "titol": "Natilles",
    "pagina": 148,
    "pagines": [
      148
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Galetes passades per llet",
          "1 litre de llet",
          "1 sobre de flam de qualsevol marca",
          "2 cullerades de sucre",
          "Canella"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Primerament, agafeu una cassola i afegiu 2 cullerades de sucre i el litre de llet i enceneu el foc i feu que bulla. Mentre la llet bull, agafeu el sobre de flam i afegiu-lo a una tassa, com també un poc de llet, i remeneu fins que el flam es desfaça. En bullir la llet de la cassola, afegiu-li la tassa amb el flam i remeneu-ho tot fins que es mescle tot bé. Finalment, en la presentació, agafeu una font i disposeu de la manera que més us agrade les galetes, que ja haureu banyat amb ell, i afegiu-hi per damunt el flam de la cassola i la canella al vostre gust. Podeu posar les galetes damunt del flam o una capa de flam, una de galetes, de flam, de galetes, etc., fins omplir la font sencera."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p148.webp"
  },
  {
    "numero": 137,
    "slug": "panellets-de-tots-sants",
    "titol": "Panellets de Tots Sants",
    "pagina": 149,
    "pagines": [
      149
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "250 g d’ametla molta",
          "50 g de sucre",
          "1 ou (la clara per a mesclar i el rovell per a daurar)",
          "Un poc d’aigua",
          "Pinyons"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, poseu a calfar l’aigua amb el sucre i, en estar tèbia, deixeu-ho reposar uns pocs minuts, mentre remeneu el caldo resultant. A continuació, retireu la mescla del foc i aboqueu l’ametla molta, a poc a poc, mentre removeu la barreja. Seguidament, bateu la clara de l’ou una mica i afegiu-la a la mescla d’ametla. Pasteu-ho tot fins que tingueu una pasta que no s’enganxe als dits i guardeu-la a la nevera un parell d’hores. En passar aquest temps, traieu la pasta de la nevera i feu boles de pasta d’un 20 grams aproximadament i unteu-les amb el rovell de l’ou. Tot seguit, feu rodar les boles pels pinyons, tot arrebossant-los i introduïu-los al forn, 10 minuts, a 180 graus. Finalment, torneu-los a traure’ls, unteu-los de bell nou amb el rovell de l’ou i torneu-los a deixar al forn 5 minuts més o quan els vegeu daurats."
        ]
      }
    ],
    "notes": [
      "També se’n poden fer d’ametla, de coco, de xocolate, de cafè, de llima, de taronja, de mandarina i de codonyat. El procediment és com el descrit, de pinyons, però es fan servir el coco ratllat, el cacau en pols, el cafè molt, la pell ratllada fina de la llima, de la taronja i de la mandarina i el codonyat. Si és el cas, doneu-los una forma diferent, per a diferenciar-los. Amb una altra nomenclatura n’hi ha les pastes de nous i ametles: ingredients: 1 part de nous a trossets: 2 parts d’ametles moltes amb pell; 1 part de sucre; llima ratllada al gust; 2 ous. Preparació: en primer lloc, agafeu una safa i afegiu-hi l’ametla, les nous, el sucre, la llima ratllada i els ous i pasteu-ho tot bona cosa. En estar ben pastat i que no s’enganxe als dits, deixeu-ho reposar unes 12 hores, aproximadament, en un lloc fresc i, en passar aquest temps, torneu a pastar i feu boles, tantes com pasta n’hi ha. A continuació, espolseu sucre molt per damunt i poseu-les en una llanda, amb paper vegetal i introduïu-la al forn, a 180 graus, 15 minuts, aproximadament, o en estar daurades, i estaran bones."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p149.webp"
  },
  {
    "numero": 138,
    "slug": "arrop-i-talladetes",
    "titol": "Arrop i talladetes",
    "pagina": 150,
    "pagines": [
      150
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Most de raïm",
          "Carbassa",
          "Sucre"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, coeu el most de raïm en un perol de coure fins que quede reduït a la meitat el seu volum. Paral.lelament, prepareu les talladetes de carabassa; és a dir, carabassa tallada a rodanxes macerades en aigua amb calç, perquè prenguen consistència i en perden la part fibrosa, durant 24 hores. Una vegada ha passat aquest temps, i escorregudes i seques les tallades, uniu-les al xarop del most del raïm i coeu-ho to junt. Estarà cuit l’arrop i talladetes quan deixeu caure una gota de l’arrop en un got d’aigua i no es dissol i sume per la superfície de l’aigua."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p150.webp"
  },
  {
    "numero": 139,
    "slug": "arnadi",
    "titol": "Arnadí",
    "pagina": 151,
    "pagines": [
      151
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Carabassa",
          "Moniato",
          "Sucre (la meitat del pes de la pasta de carabassa)",
          "Ratlladura d’una llima",
          "Canella en pols",
          "Ametles",
          "Pinyons"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, i després de bullir el moniato i la carabassa per separat, poseu la pasta en un recipient, pasteu-la de forma suau i poseu-la en saquets de tela, que seran penjats, perquè gotege, tota una nit. Una vegada desaiguada la pasta, poseu-la en una cassola i afegiu-li sucre mentre pasteu, fins trobar la dolçor que voleu,. Per a finalitzar, afegiu-hi la ratlladura d’una llima i espolseu canella, o ametla molta, per damunt. En la presentació, afegiu tota la pasta en una cassola de test, formant caramull o al vostre gust, i adorneu-la amb ametles, pinyons i sucre. Finalment, poseu la cassola al forn, mitja hora aproximadament, a uns 150 graus i vigileu que no es cremen massa les ametles i els pinyons."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p151.webp"
  },
  {
    "numero": 140,
    "slug": "pastis-de-galetes",
    "titol": "Pastís de galetes",
    "pagina": 152,
    "pagines": [
      152
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Mig quilo de carlotes (safanòries, pastanagues)",
          "1/4 de sucre",
          "1/4 de coco",
          "1 sobre de Potax (per a fer flam)",
          "2 tasses de llet",
          "Un poc de sucre (per al flam)",
          "1 tassa de xocolate a la tassa",
          "2 paquets de galetes",
          "Café"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu un casset i bulliu la carlota i, en estar bullida, tritureu-la amb la batedora i mescleu-hi el sucre i el coco. A continuació, feu el flam: agafeu un casset i afegiu-hi les dues tasses de llet, el sobre de Potax i un poc de sucre i poseu-ho tot al foc. Remeneu i en bullir, el flam estarà fet. Tot seguit, agafeu una safata i disposeu les galetes, tot remullades en cafè, que ja haureu fet, l’una al costat de l’altra i, en fer una primera capa, afegiu-hi el flam. Després, feu una segona capa de galetes i afegiu-hi la carlota. Així successivament fins acabar les galetes i el flam i la carlota i crear una mena de torre de galetes. Finalment, agafeu el xocolate, que ja haureu calfat, i afegiu-lo per damunt de tot el conjunt de les galetes, tot cobrint-ho tot i el pastís de galetes estarà llest per a ser servit. En la presentació, hi podeu afegir nata muntada per damunt."
        ]
      }
    ],
    "notes": [],
    "youtubeId": "cq2a-rmwXBs",
    "lamina": "/assets/uploads/patrimoni/que-dinem/p152.webp"
  },
  {
    "numero": 141,
    "slug": "gelat-de-vainilla",
    "titol": "Gelat de vainilla",
    "pagina": 153,
    "pagines": [
      153
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "6 rovells d’ou",
          "1 litre de llet",
          "1/4 de sucre",
          "1 branqueta de canella en rama",
          "Llima ratllada"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu un casset i bulliu la llet amb el sucre, la canella i la llima ratllada i a continuació, coleu-ho tot. Tot seguit, agafeu els rovells dels ous i poseu-los en un recipient gran i col.loqueu el recipient al bany de maria; és a dir, agafeu una olla, afegiu-hi aigua i col.loqueu-hi dins el recipient amb els rovells dels ous; feu-ho quan l’aigua estiga tèbia i afegiu al recipient dels rovells, a poc a poc, la llet que heu bullit i remeneu-ho tot fins que s’espessesca. En espessir-se, apagueu el foc i no deixeu de remoure fins que es refrede. Finalment, i una vegada refredat, deixeu la pasta de vainilla al congelador i tindreu un bon gelat de vainilla."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p153.webp"
  },
  {
    "numero": 142,
    "slug": "xurros",
    "titol": "Xurros",
    "pagina": 154,
    "pagines": [
      154
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1/4 de farina",
          "1 tassa gran d’aigua bullint",
          "Oli d’oliva",
          "Aparell de fer xurros"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu un casset i bulliu la tassa gran d’aigua i a continuació, escaldeu la farina amb l’aigua bullint; és a dir, quan l’aigua faça bombes, afegiu-la a la farina, que ja tindreu en una safa, i que es mescle tot. Tot seguit, i en poder tocar la pasta, pasteu-la una mica i afegiu-la a l’aparell de fer xurros, tot embotint-la. En tenir-ho tot preparat, poseu a calfar abundant oli d’oliva en una paella fonda i en estar ben calent, feu servir la xurrera i deixeu caure, a poc a poc, la pasta del xurro dins la paella, tot fent cercles, en redó. Deixeu que es facen i en estar daurats, estaran bons. En la presentació, talleu-los a pams, amb unes tisores, i afegiu-los sucre per damunt i serviu-los."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p154.webp"
  },
  {
    "numero": 143,
    "slug": "coquetes-fregides",
    "titol": "Coquetes fregides",
    "pagina": 155,
    "pagines": [
      155
    ],
    "apartat": "postres",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "0,5 kg de farina de blat o la que admeta",
          "1 got gran d’aigua tèbia",
          "1 mesura o un gotet xicotet d’oli d’oliva",
          "1 culleradeta de llevat",
          "Sal al gust"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu una safa i afegiu-hi el llevat, l’aigua tèbia, l’oli d’oliva i pasteu-ho tot. Tot seguit, afegiu-hi la farina a poc a poc i la sal i pasteu-ho tot bona cosa fins que no s’enganxe als dits. A continuació, passeu-li el corró (el rodillo) i feu-la ben fina. Finalment, feu-ne un pilot i deixeu-la reposar una hora. En estar la pasta bona, torneu-la a pastar i passeu-li el corró de bell nou i feu-la redona; és a dir, la forma de les coquetes i reserveu-les. Finalment, agafeu una paella i poseu a calfar abundant oli d’oliva i en estar ben calent, afegiu-hi les coquetes. En estar daurades, estaran bones. En la presentació, afegiu-hi sucre per damunt, o canella o sal o qualsevol ingredient que us vinga de gust."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p155.webp"
  },
  {
    "numero": 144,
    "slug": "cafe-licor",
    "titol": "Café licor",
    "pagina": 157,
    "pagines": [
      157
    ],
    "apartat": "licors",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 paquet de cafè en gra de 250 grans",
          "6 litres d’aigua",
          "1 litre d’alcohol etílic",
          "1 cullerada gran de malta"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "Agafeu una olla gran de fer el putxero i afegiu-hi el 6 litres d’aigua, el litre d’alcohol etílic, la cullerada gran de malta i el paquet de cafè, semimolt, terrós, que ja haureu molt abans. Tapeu l’olla amb paper de plata i la seua tapadora. Tots els dies, durant un mes, haureu de destapar l’olla i remenar tot el caldo amb una cullera, unes quantes vegades. En passar aquest temps, coleu el contingut en botelles i ja es podrà beure. En aquesta mida, solen eixir 5 litres i mig, aproximadament, de cafè licor."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p157.webp"
  },
  {
    "numero": 145,
    "slug": "licor-de-salvia",
    "titol": "Licor de sàlvia",
    "pagina": 158,
    "pagines": [
      158
    ],
    "apartat": "licors",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1 litre d’alcohol etílic",
          "2 grapats de fulles de sàlvia (collides abans del mes de maig)",
          "Un pessic de fulles de menta",
          "Mig quilo de sucre"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, heu d’haver collit fulles de sàlvia abans del mes de maig. Tot tenint les fulles, heu d’amerar els grapats de sàlvia i les fulles de menta en un litre d’alcohol etílic i en passar 8 dies, filtreu la maceració en una cassola i afegiu-hi l’almívar, que ja haureu preparat abans de filtrar l’amerat: dissoleu mig quilo d’aigua en sucre. Finalment, ompliu el licor de sàlvia en ampolles del vostre gust."
        ]
      }
    ],
    "notes": [
      "Antigament, a qualsevol absenta o aiguardent dolç o sec que contenia herbes aromàtiques, se l’anomenava “herbero”. Per tant, podeu fer herbers de qualsevol herba aromàtica que us vinga de gust. Tan sols heu de tenir clar si el voleu dolç o sec. En un cas fareu servir absenta o alcohol etílic i les herbes; i en l’altre hi afegireu sucre i en el temps d’amerament rodareu les ampolles de tant en tant, perquè el sucre no es quede al cul de l’ampolla. Cf. també la recepta de l’Herbero."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p158.webp"
  },
  {
    "numero": 146,
    "slug": "vi-de-nous",
    "titol": "Vi de nous",
    "pagina": 159,
    "pagines": [
      159
    ],
    "apartat": "licors",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "7-8 nous tendres (collides abans de sant Joan)",
          "1 litre de vi negre",
          "Mig got d’alcohol etílic",
          "125 grams de sucre"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, heu d’haver collit les nous abans de sant Joan. Tot tenint les nous, heu d’amerar-les en un litre de vi negre i deixeu-lo reposar com a mínim 40 dies. Passat aquest temps, agafeu la maceració, filtreu-la, tot fent servir una gasa, i afegiu-hi 125 grams de sucre i mig got d’alcohol. Finalment, ompliu el vi de nous en ampolles del vostre gust."
        ]
      }
    ],
    "notes": [
      "També hi ha fruites que s’ameren amb aiguardent, com ara les cireres amb aiguardent: Ingredients: cireres grosses madures; aiguardent. Preparació: agafeu un grapat de cireres grosses madures, renteu-les i poseu-les dins d’un pot de vidre amb aiguardent. El pot ha de tancar hermèticament. Deixeu reposar el pot un parell de mesos i, en passar aquest temps, veureu que l’aiguardent ha agafat el color roig de la cirera. Passat aquest temps, ja es poden menjar les cireres. N’hi ha qui també es beu l’aiguardent, però en principi només es fa servir per a amerar les cireres o les fruites amerades."
    ],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p159.webp"
  },
  {
    "numero": 147,
    "slug": "vi-de-cirer",
    "titol": "Vi de cirer",
    "pagina": 160,
    "pagines": [
      160
    ],
    "apartat": "licors",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "50 fulles de cirer (collides després de la collita de la cirera)",
          "1 litre de vi negre",
          "2 gots d’aiguardent",
          "600 grams de sucre"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu les fulles de cirer, que ja haureu collit després de la collita de la cirera, renteu-les i poseu-les en un recipient amb el litre de vi negre. A continuació, deixeu-les amerar uns quinze dies, aproximadament, i, en passar aquest temps, filtreu el vi i afegiu-hi, en calent, el sucre. Finalment, i en estar freda la mescla, afegiu-hi els dos gots d’aiguardent i passeu el vi de cirer a ampolles del vostre gust."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p160.webp"
  },
  {
    "numero": 148,
    "slug": "patxaran",
    "titol": "Patxaran",
    "pagina": 161,
    "pagines": [
      161
    ],
    "apartat": "licors",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "1/4 de quilo d’aranyons madurs (s’han de collir en estar quasi negres)",
          "3 o 4 grans de café",
          "Mig litre de cassalla dolça",
          "Mig litre de cassalla seca"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu un recipient de vidre i amareu els aranyons, els granets de cafè en la cassalla dolça i la cassalla seca. Deixeu-ho macerar tot mig any en un lloc fresc i rodeu el pot de vidre de tant en tant. En passar aquest temps, coleu el patxaran i passeu-lo en una ampolla del vostre gust."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p161.webp"
  },
  {
    "numero": 149,
    "slug": "herbero",
    "titol": "Herbero",
    "pagina": 162,
    "pagines": [
      162
    ],
    "apartat": "licors",
    "ingredients": [
      {
        "titol": null,
        "linies": [
          "Aigua amb sucre (per a cristal.litzar)",
          "1 part d’alcohol",
          "2 parts o 2 parts i mitja d’aigua amb sucre",
          "Branquetes de poliol, timó, sàlvia, rabet de gat, camamil.la i timó reial"
        ]
      }
    ],
    "preparacio": [
      {
        "titol": null,
        "linies": [
          "En primer lloc, agafeu un recipient de vidre i barregeu aigua amb sucre i deixeu-la reposar molt de temps fins que cristal.litze. Passat aquest temps, mescleu una part d’alcohol per cada dues o dues i mitja d’aigua amb sucre. Tot seguit, agafeu una ampolla de vidre i poseu-hi un branquilló de poliol, un de timó, una altra de sàlvia, un branquilló de rabet de gat, una de camamil.la i una de timó reial. Després, aboqueu la barreja d’aigua i alcohol i ho deixeu una quarantena de dies i, en passar aquest, canvieu el líquid de l’ampolla i ja se’l podreu beure. També podeu fer servir la mescla d’anissos de la sàlvia en lloc de l’alcohol, més aigua amb sucre."
        ]
      }
    ],
    "notes": [],
    "youtubeId": null,
    "lamina": "/assets/uploads/patrimoni/que-dinem/p162.webp"
  }
]);

const PER_SLUG = new Map(RECEPTES_QUE_DINEM.map((recepta) => [recepta.slug, recepta]));

/** Cerca exacta per slug: un slug inexistent (o que no siga una cadena) torna null; mai no fa cerca difusa. */
export function receptaPerSlug(slug) {
  return typeof slug === 'string' && PER_SLUG.has(slug) ? PER_SLUG.get(slug) : null;
}

/** Totes les línies d'ingredients d'una recepta, en l'ordre del llibre. */
export const liniesIngredients = (recepta) => recepta.ingredients.flatMap((bloc) => bloc.linies);

/** Cada làmina: la pàgina del llibre on és impresa i les mides de la WebP, en píxels. */
export const LAMINES_QUE_DINEM = congela({
  "/assets/uploads/patrimoni/que-dinem/p009.webp": { "pagina": 9, "ample": 341, "alt": 221 },
  "/assets/uploads/patrimoni/que-dinem/p010.webp": { "pagina": 10, "ample": 345, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p011.webp": { "pagina": 11, "ample": 327, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p012.webp": { "pagina": 12, "ample": 324, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p013.webp": { "pagina": 13, "ample": 283, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p014.webp": { "pagina": 14, "ample": 341, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p015.webp": { "pagina": 15, "ample": 291, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p016.webp": { "pagina": 16, "ample": 360, "alt": 267 },
  "/assets/uploads/patrimoni/que-dinem/p017.webp": { "pagina": 17, "ample": 280, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p018.webp": { "pagina": 18, "ample": 317, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p019.webp": { "pagina": 19, "ample": 360, "alt": 267 },
  "/assets/uploads/patrimoni/que-dinem/p020.webp": { "pagina": 20, "ample": 360, "alt": 256 },
  "/assets/uploads/patrimoni/que-dinem/p021.webp": { "pagina": 21, "ample": 360, "alt": 255 },
  "/assets/uploads/patrimoni/que-dinem/p022.webp": { "pagina": 22, "ample": 339, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p023.webp": { "pagina": 23, "ample": 360, "alt": 238 },
  "/assets/uploads/patrimoni/que-dinem/p024.webp": { "pagina": 24, "ample": 303, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p025.webp": { "pagina": 25, "ample": 360, "alt": 271 },
  "/assets/uploads/patrimoni/que-dinem/p026.webp": { "pagina": 26, "ample": 360, "alt": 251 },
  "/assets/uploads/patrimoni/que-dinem/p027.webp": { "pagina": 27, "ample": 320, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p028.webp": { "pagina": 28, "ample": 360, "alt": 271 },
  "/assets/uploads/patrimoni/que-dinem/p029.webp": { "pagina": 29, "ample": 360, "alt": 252 },
  "/assets/uploads/patrimoni/que-dinem/p030.webp": { "pagina": 30, "ample": 360, "alt": 277 },
  "/assets/uploads/patrimoni/que-dinem/p031.webp": { "pagina": 31, "ample": 360, "alt": 263 },
  "/assets/uploads/patrimoni/que-dinem/p032.webp": { "pagina": 32, "ample": 360, "alt": 223 },
  "/assets/uploads/patrimoni/que-dinem/p033.webp": { "pagina": 33, "ample": 308, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p034.webp": { "pagina": 34, "ample": 360, "alt": 220 },
  "/assets/uploads/patrimoni/que-dinem/p035.webp": { "pagina": 35, "ample": 318, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p036.webp": { "pagina": 36, "ample": 339, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p037.webp": { "pagina": 37, "ample": 360, "alt": 267 },
  "/assets/uploads/patrimoni/que-dinem/p038.webp": { "pagina": 38, "ample": 317, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p039.webp": { "pagina": 39, "ample": 360, "alt": 277 },
  "/assets/uploads/patrimoni/que-dinem/p040.webp": { "pagina": 40, "ample": 360, "alt": 253 },
  "/assets/uploads/patrimoni/que-dinem/p041.webp": { "pagina": 41, "ample": 360, "alt": 222 },
  "/assets/uploads/patrimoni/que-dinem/p042.webp": { "pagina": 42, "ample": 360, "alt": 270 },
  "/assets/uploads/patrimoni/que-dinem/p043.webp": { "pagina": 43, "ample": 360, "alt": 256 },
  "/assets/uploads/patrimoni/que-dinem/p044.webp": { "pagina": 44, "ample": 352, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p045.webp": { "pagina": 45, "ample": 314, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p046.webp": { "pagina": 46, "ample": 346, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p047.webp": { "pagina": 47, "ample": 360, "alt": 261 },
  "/assets/uploads/patrimoni/que-dinem/p048.webp": { "pagina": 48, "ample": 360, "alt": 256 },
  "/assets/uploads/patrimoni/que-dinem/p049.webp": { "pagina": 49, "ample": 319, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p050.webp": { "pagina": 50, "ample": 360, "alt": 276 },
  "/assets/uploads/patrimoni/que-dinem/p051.webp": { "pagina": 51, "ample": 360, "alt": 227 },
  "/assets/uploads/patrimoni/que-dinem/p052.webp": { "pagina": 52, "ample": 360, "alt": 245 },
  "/assets/uploads/patrimoni/que-dinem/p053.webp": { "pagina": 53, "ample": 360, "alt": 248 },
  "/assets/uploads/patrimoni/que-dinem/p054.webp": { "pagina": 54, "ample": 360, "alt": 269 },
  "/assets/uploads/patrimoni/que-dinem/p056.webp": { "pagina": 56, "ample": 360, "alt": 262 },
  "/assets/uploads/patrimoni/que-dinem/p057.webp": { "pagina": 57, "ample": 297, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p058.webp": { "pagina": 58, "ample": 360, "alt": 256 },
  "/assets/uploads/patrimoni/que-dinem/p059.webp": { "pagina": 59, "ample": 360, "alt": 258 },
  "/assets/uploads/patrimoni/que-dinem/p060.webp": { "pagina": 60, "ample": 344, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p061.webp": { "pagina": 61, "ample": 360, "alt": 262 },
  "/assets/uploads/patrimoni/que-dinem/p062.webp": { "pagina": 62, "ample": 360, "alt": 261 },
  "/assets/uploads/patrimoni/que-dinem/p063.webp": { "pagina": 63, "ample": 360, "alt": 233 },
  "/assets/uploads/patrimoni/que-dinem/p064.webp": { "pagina": 64, "ample": 354, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p065.webp": { "pagina": 65, "ample": 360, "alt": 264 },
  "/assets/uploads/patrimoni/que-dinem/p066.webp": { "pagina": 66, "ample": 315, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p067.webp": { "pagina": 67, "ample": 360, "alt": 240 },
  "/assets/uploads/patrimoni/que-dinem/p068.webp": { "pagina": 68, "ample": 325, "alt": 253 },
  "/assets/uploads/patrimoni/que-dinem/p069.webp": { "pagina": 69, "ample": 360, "alt": 274 },
  "/assets/uploads/patrimoni/que-dinem/p070.webp": { "pagina": 70, "ample": 360, "alt": 269 },
  "/assets/uploads/patrimoni/que-dinem/p071.webp": { "pagina": 71, "ample": 322, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p072.webp": { "pagina": 72, "ample": 359, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p073.webp": { "pagina": 73, "ample": 347, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p074.webp": { "pagina": 74, "ample": 284, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p075.webp": { "pagina": 75, "ample": 360, "alt": 272 },
  "/assets/uploads/patrimoni/que-dinem/p076.webp": { "pagina": 76, "ample": 318, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p077.webp": { "pagina": 77, "ample": 331, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p078.webp": { "pagina": 78, "ample": 360, "alt": 208 },
  "/assets/uploads/patrimoni/que-dinem/p079.webp": { "pagina": 79, "ample": 360, "alt": 218 },
  "/assets/uploads/patrimoni/que-dinem/p080.webp": { "pagina": 80, "ample": 348, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p081.webp": { "pagina": 81, "ample": 316, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p082.webp": { "pagina": 82, "ample": 356, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p083.webp": { "pagina": 83, "ample": 360, "alt": 237 },
  "/assets/uploads/patrimoni/que-dinem/p084.webp": { "pagina": 84, "ample": 360, "alt": 233 },
  "/assets/uploads/patrimoni/que-dinem/p085.webp": { "pagina": 85, "ample": 336, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p086.webp": { "pagina": 86, "ample": 350, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p087.webp": { "pagina": 87, "ample": 344, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p089.webp": { "pagina": 89, "ample": 360, "alt": 243 },
  "/assets/uploads/patrimoni/que-dinem/p090.webp": { "pagina": 90, "ample": 347, "alt": 279 },
  "/assets/uploads/patrimoni/que-dinem/p091.webp": { "pagina": 91, "ample": 323, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p092.webp": { "pagina": 92, "ample": 360, "alt": 257 },
  "/assets/uploads/patrimoni/que-dinem/p093.webp": { "pagina": 93, "ample": 360, "alt": 240 },
  "/assets/uploads/patrimoni/que-dinem/p094.webp": { "pagina": 94, "ample": 360, "alt": 254 },
  "/assets/uploads/patrimoni/que-dinem/p095.webp": { "pagina": 95, "ample": 299, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p096.webp": { "pagina": 96, "ample": 313, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p097.webp": { "pagina": 97, "ample": 346, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p098.webp": { "pagina": 98, "ample": 305, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p099.webp": { "pagina": 99, "ample": 355, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p100.webp": { "pagina": 100, "ample": 360, "alt": 253 },
  "/assets/uploads/patrimoni/que-dinem/p101.webp": { "pagina": 101, "ample": 251, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p102.webp": { "pagina": 102, "ample": 360, "alt": 268 },
  "/assets/uploads/patrimoni/que-dinem/p103.webp": { "pagina": 103, "ample": 360, "alt": 232 },
  "/assets/uploads/patrimoni/que-dinem/p104.webp": { "pagina": 104, "ample": 360, "alt": 240 },
  "/assets/uploads/patrimoni/que-dinem/p105.webp": { "pagina": 105, "ample": 308, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p106.webp": { "pagina": 106, "ample": 305, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p107.webp": { "pagina": 107, "ample": 360, "alt": 230 },
  "/assets/uploads/patrimoni/que-dinem/p108.webp": { "pagina": 108, "ample": 310, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p109.webp": { "pagina": 109, "ample": 335, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p110.webp": { "pagina": 110, "ample": 360, "alt": 251 },
  "/assets/uploads/patrimoni/que-dinem/p111.webp": { "pagina": 111, "ample": 360, "alt": 272 },
  "/assets/uploads/patrimoni/que-dinem/p112.webp": { "pagina": 112, "ample": 344, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p113.webp": { "pagina": 113, "ample": 300, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p114.webp": { "pagina": 114, "ample": 360, "alt": 227 },
  "/assets/uploads/patrimoni/que-dinem/p116.webp": { "pagina": 116, "ample": 329, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p117.webp": { "pagina": 117, "ample": 360, "alt": 228 },
  "/assets/uploads/patrimoni/que-dinem/p118.webp": { "pagina": 118, "ample": 360, "alt": 276 },
  "/assets/uploads/patrimoni/que-dinem/p119.webp": { "pagina": 119, "ample": 337, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p120.webp": { "pagina": 120, "ample": 360, "alt": 230 },
  "/assets/uploads/patrimoni/que-dinem/p121.webp": { "pagina": 121, "ample": 360, "alt": 143 },
  "/assets/uploads/patrimoni/que-dinem/p122.webp": { "pagina": 122, "ample": 300, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p123.webp": { "pagina": 123, "ample": 323, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p124.webp": { "pagina": 124, "ample": 359, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p125.webp": { "pagina": 125, "ample": 343, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p127.webp": { "pagina": 127, "ample": 360, "alt": 257 },
  "/assets/uploads/patrimoni/que-dinem/p128.webp": { "pagina": 128, "ample": 360, "alt": 258 },
  "/assets/uploads/patrimoni/que-dinem/p129.webp": { "pagina": 129, "ample": 360, "alt": 241 },
  "/assets/uploads/patrimoni/que-dinem/p130.webp": { "pagina": 130, "ample": 312, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p131.webp": { "pagina": 131, "ample": 257, "alt": 211 },
  "/assets/uploads/patrimoni/que-dinem/p132.webp": { "pagina": 132, "ample": 360, "alt": 261 },
  "/assets/uploads/patrimoni/que-dinem/p133.webp": { "pagina": 133, "ample": 302, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p134.webp": { "pagina": 134, "ample": 360, "alt": 274 },
  "/assets/uploads/patrimoni/que-dinem/p135.webp": { "pagina": 135, "ample": 360, "alt": 252 },
  "/assets/uploads/patrimoni/que-dinem/p136.webp": { "pagina": 136, "ample": 312, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p137.webp": { "pagina": 137, "ample": 305, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p139.webp": { "pagina": 139, "ample": 323, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p140.webp": { "pagina": 140, "ample": 290, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p141.webp": { "pagina": 141, "ample": 290, "alt": 193 },
  "/assets/uploads/patrimoni/que-dinem/p142.webp": { "pagina": 142, "ample": 341, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p143.webp": { "pagina": 143, "ample": 360, "alt": 267 },
  "/assets/uploads/patrimoni/que-dinem/p144.webp": { "pagina": 144, "ample": 360, "alt": 230 },
  "/assets/uploads/patrimoni/que-dinem/p145.webp": { "pagina": 145, "ample": 360, "alt": 186 },
  "/assets/uploads/patrimoni/que-dinem/p146.webp": { "pagina": 146, "ample": 360, "alt": 216 },
  "/assets/uploads/patrimoni/que-dinem/p147.webp": { "pagina": 147, "ample": 319, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p148.webp": { "pagina": 148, "ample": 315, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p149.webp": { "pagina": 149, "ample": 282, "alt": 188 },
  "/assets/uploads/patrimoni/que-dinem/p150.webp": { "pagina": 150, "ample": 360, "alt": 188 },
  "/assets/uploads/patrimoni/que-dinem/p151.webp": { "pagina": 151, "ample": 360, "alt": 241 },
  "/assets/uploads/patrimoni/que-dinem/p152.webp": { "pagina": 152, "ample": 360, "alt": 168 },
  "/assets/uploads/patrimoni/que-dinem/p153.webp": { "pagina": 153, "ample": 344, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p154.webp": { "pagina": 154, "ample": 353, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p155.webp": { "pagina": 155, "ample": 353, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p157.webp": { "pagina": 157, "ample": 97, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p158.webp": { "pagina": 158, "ample": 90, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p159.webp": { "pagina": 159, "ample": 125, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p160.webp": { "pagina": 160, "ample": 84, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p161.webp": { "pagina": 161, "ample": 95, "alt": 280 },
  "/assets/uploads/patrimoni/que-dinem/p162.webp": { "pagina": 162, "ample": 96, "alt": 280 }
});

/** La làmina d'una recepta ({ src, pagina, ample, alt }), o null si no en té. */
export function laminaDeRecepta(recepta) {
  const src = recepta && typeof recepta.lamina === 'string' ? recepta.lamina : null;
  return src && Object.hasOwn(LAMINES_QUE_DINEM, src) ? { src, ...LAMINES_QUE_DINEM[src] } : null;
}

export const RECOMPTES_QUE_DINEM = congela({
  receptes: RECEPTES_QUE_DINEM.length,
  videos: new Set(RECEPTES_QUE_DINEM.map((r) => r.youtubeId).filter(Boolean)).size,
  receptesAmbVideo: RECEPTES_QUE_DINEM.filter((r) => r.youtubeId).length,
  lamines: new Set(RECEPTES_QUE_DINEM.map((r) => r.lamina).filter(Boolean)).size,
  perApartat: Object.fromEntries(OBRA_QUE_DINEM.apartats.map((a) => [a.id, RECEPTES_QUE_DINEM.filter((r) => r.apartat === a.id).length]))
});
