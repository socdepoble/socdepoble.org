/**
 * tooling/patrimoni/que-dinem-correccions.mjs
 *
 * Correccions literals del receptari «Què dinem?», transcrites del PDF del llibre allà on el text del kit falla.
 * Totes passen per la verificació lletra a lletra de genera-que-dinem.mjs contra les pàgines de la recepta.
 * Els títols de bloc són les capçaleres del llibre (impreses en majúscules) passades a minúscula de frase.
 */
export const CORRECCIONS = {
  7: {
    motiu: 'preparació buida al kit (p. 15)',
    preparacio: [{
      titol: null,
      linies: [
        'En primer lloc, poseu en una safa, un poal o un recipient gran les tomaques madures. Al mateix temps, poseu a calfar aigua i, en estar bullint, escaldeu les tomaques; és a dir, afegiu l’aigua bullint a la safa, al poal o al recipient gran que heu triat. Seguidament, peleu les tomaques i lleveu-ne la cueta i a continuació, poseu els trossos de tomaca en pots de vidre i tanqueu-los ben tancats. Paral·lelament, prepareu un perol ben gran per poder introduir-hi els pots de vidre. En tindre tots els pots de vidre plens de tomaca, poseu-los dins del perol i ompliu-lo d’aigua fins tapar els pots. Enceneu el foc, a mitja flama, i deixeu-lo bullir 2 hores i ja estarà la conserva feta.'
      ]
    }]
  },
  15: {
    motiu: 'preparació buida al kit (p. 23)',
    preparacio: [{
      titol: null,
      linies: [
        'Primerament, agafeu els alls secs i aixafeu-los. Seguidament, agafeu una paella i poseu-hi l’oli, un poc d’aigua, un pessic de sal, els xampinyons rentats i trossejats i els alls aixafats. Finalment, enceneu el foc, a una flama moderada, i col·loqueu la paella al damunt durant mig hora.'
      ]
    }]
  },
  18: {
    motiu: 'preparació buida al kit (p. 26)',
    preparacio: [{
      titol: null,
      linies: [
        'En primer lloc, poseu el forn a calfar a 200 graus. Mentre el forn es calfa, agafeu els cacaus banyeu-los amb aigua i col·loqueu-los en una llanda per al forn. A continuació, afegiu-hi sal per damunt i com estan banyats, s’enganxarà als cacaus. Finalment, introduïu la llanda al forn, mitja hora aproximadament, i vigileu que no es cremen, ja que la mateixa calentor residual del cacau farà que es puga cremar. Paga la pena traure’ls un poc abans d’estar bons, perquè s’acaben de fer mentre es refreden.'
      ]
    }]
  },
  21: {
    motiu: 'el kit perd la nota al peu 12 (p. 29)',
    notes: [
      'N’hi ha moltes variants de preparació. La fotografia il·lustra una forma de preparar-les diferent: estan cuites en una cassola amb diverses verduretes, com ara carlotetes, etc.'
    ]
  },
  43: {
    motiu: 'preparació buida al kit (p. 51)',
    preparacio: [{
      titol: null,
      linies: [
        'Primerament, agafeu una font gran o un plat de grans proporcions i col·loqueu-hi el cuixot tallat a rodanxes. Seguidament, talleu el formatge curat a rodanxes i poseu-les per damunt del cuixot. Finalment, afegiu-hi oli d’oliva generosament per tota la font o el plat gran. N’hi ha qui fa dibuixos geomètrics amb els ingredients o no. Ho deixem al vostre criteri.'
      ]
    }]
  },
  62: {
    motiu: 'tres ingredients fusionats al kit, part com a pas de preparació (p. 71)',
    ingredients: [{
      titol: null,
      linies: [
        'Creïlles trossejades',
        'Bajoquetes del filet',
        'Trossets de carlota, (es pot afegir una varietat de verdures a elegir)',
        'Julivert i una cabeça d’all, tot ben picat',
        '3 fulles de llorer tendres',
        'Un pot de tomaca crua desfeta',
        '4-5 cuixes de pollastre i/o aletes',
        'Una mesura d’oli d’oliva i aigua (per a omplir la cassola)',
        'Safrà (colorant)',
        'Sal'
      ]
    }],
    preparacio: [{
      titol: null,
      linies: [
        'Prepareu les verdures i creïlles (crues) degudament trossejades i afegiu-les a la cassola. Afegiu-hi, també, un pot de tomaca crua desfeta, el julivert picat i els alls també picats. A continuació, afegiu-hi l’aigua amb una mesura d’oli, el safrà i un poc de sal. Finalment, poseu-hi les cuixetes de pollastre. Seguidament, poseu la cassola al foc a viu fins que trenque el bull i després lleveu el foc a la meitat. Manteniu el foc així 1 hora i mitja o 2 hores, aproximadament, i a dinar.'
      ]
    }]
  },
  74: {
    motiu: 'el kit perd la capçalera «Variant» (p. 83)',
    preparacio: [
      {
        titol: null,
        linies: [
          'Primerament, agafeu una rostidora i poseu-hi les bajoques. Afegiu-hi bona cosa d’oli d’oliva per damunt i fiqueu la rostidora al forn durant 1 hora, aproximadament, a 200 graus. En passar aquest temps, traieu-les del forn, espereu que es refreden una mica i peleu-les, a tiretes. En la presentació, afegiu-hi un rall abundant d’oli i sal al gust i els allets trossejats, si és el cas.'
        ]
      },
      {
        titol: 'Variant',
        linies: [
          'Si no voleu torrar les bajoques al forn, ho podeu fer al foc: agafeu una llanda i poseu-la damunt del foguer i poseu al damunt les bajoques banyades en oli. En estar les bajoques negres, ja estaran bones. Seguidament, poseu-les en una bossa de plàstic, perquè suen i així quan es refreden serà més fàcil pelar-les i preparar-les.'
        ]
      }
    ]
  },
  79: {
    motiu: 'capçalera convertida en pas i blocs d’ingredients barrejats al kit (p. 88-89)',
    ingredients: [
      {
        titol: 'Ingredients de la verdura',
        linies: ['3 naps', 'Cigrons', '2 trossets d’api', '1 porro', '2 Carlotes', '2 xirivies', 'Mitja ceba', '1 tomaca', 'Penques (si no és la temporada, bajoquetes)', 'Creïlles', 'Arròs', 'Fideus']
      },
      {
        titol: 'Ingredients de la carn',
        linies: ['1 cuixa i l’anca de pollastre de camp', '2 peuets de porc, partits per la meitat', '1 os de pota de vedella', '1 os mollut de vedella', '4 botifarres de carn', '1 tros de vedella, que es diu “peixet”', '2 o 4 pilotes de carn', '2 pastilles d’Avecrem de carn', 'Safrà', 'Sal']
      },
      {
        titol: 'Ingredients de les pilotes',
        linies: ['Carn capolada de porc i de vedella', 'Julivert', 'Pinyonets', '2 ous', 'Canella', 'Sal']
      }
    ],
    preparacio: [
      {
        titol: 'Preparació de les pilotes',
        linies: ['Agafeu carn capolada, picada, mesclada de porc i de vedella i afegiu-li julivert, pinyonets, 2 ous, canella i sal i pasteu-ho tot, tot donant-li forma redona.']
      },
      {
        titol: 'Preparació general',
        linies: [
          'En primer lloc, peleu, talleu i renteu tota la verdura i bulliu les penques per a traure-les l’amargor. Seguidament, agafeu una olla gran i col.loqueu tots els ingredients (tant els de la verdura com els de la carn, tret de les creïlles). Els cigrons, com també els naps, xirivies, etc., seran col.locats en una escorredora al fons de l’olla, perquè no es perden pel perol. Ompliu el perol d’aigua fins els botons i afegiu-hi el safrà i la sal. A continuació, enceneu el foc al màxim i poseu a bullir l’olla i en bullir l’aigua, rebaixeu el foc. 2 hores després, ja tindreu el caldo fet i els ingredients cuits. Tot seguit, traieu caldo per a fer l’arròs o els fideus i hi afegiu les creïlles (les creïlles són posades les últimes, abans de dinar, perquè es desfarien per dins del perol) i torneu a afegir aigua a l’olla (més o menys la que heu tret per a l’arròs) i lleveu-li força al foc.',
          'Per a fer l’arròs , agafeu una cassola i afegiu-hi una mesura d’oli i mitjà ceba picada; ho sofregiu tot i seguidament, hi afegiu l’arròs i el caldo del putxero. En uns 20 minuts, el caldo s’haurà eixugat i l’arròs estarà bo. Si feu fideus, agafeu una cassola, poseu a bullir el caldo del putxero i hi afegiu els fideus, quan bulla el caldo. En pocs minuts els fideus estaran fets.'
        ]
      }
    ]
  },
  80: {
    motiu: 'capçalera convertida en pas i blocs d’ingredients barrejats al kit (p. 90)',
    ingredients: [
      {
        titol: null,
        linies: ['Un manoll de penques', '1 pot de fesols cuits catalans', '1 xirivia sencera', '1 nap a trossos', '1 creïlla', 'Mitja ceba', 'Trossos de porc: morret, costelletes', '2 botifarres de carn a trossos', '1 cabeça d’alls secs', 'Oli d’oliva', 'Safrà (colorant)', 'Sal', 'Una pastilla de caldo de verdura']
      },
      {
        titol: 'Ingredients de les pilotes',
        linies: ['Farina de dacsa', '2 ous', 'Aigua tèbia', 'Un rall d’oli d’oliva', 'Sal']
      }
    ],
    preparacio: [
      {
        titol: 'Preparació de les pilotes',
        linies: ['En una safa, poseu la farina de dacsa, els 2 ous, el ratllet d’oli d’oliva i la sal i pasteu-ho tot amb aigua tèbia, tot donant-li forma redona.']
      },
      {
        titol: 'Preparació general',
        linies: ['En primer lloc, peleu, talleu i renteu tota la verdura i bulliu les penques per a traure’ls l’amargor. Seguidament, agafeu una olla gran a pressió i col.loqueu tots els ingredients (tant els de la verdura com els de la carn, tret de les pilotes de facedura). Ompliu el perol d’aigua fins els botons i afegiu-hi la mesura d’oli, el safrà, la sal i la pastilla de caldo de verdura. A continuació, enceneu el foc al màxim i poseu a bullir l’olla i en bullir l’aigua, rebaixeu el foc al mínim. 3 hores després, més o menys, tindreu l’olleta feta. Tot seguit, afegiu-hi les pilotes de dacsa (es posen les últimes, tot just abans de dinar, perquè es desfarien per dins del perol), i deixeu-les allí, bullint a foc mínim, fins que s’acaben de fer.']
      }
    ]
  },
  115: {
    motiu: 'capçaleres convertides en passos i blocs d’ingredients barrejats al kit (p. 126-127)',
    ingredients: [
      { titol: 'Ingredients per a la pasta', linies: ['1 got de llet', '1 got de cervesa o de vi blanc', '1 got d’oli d’oliva', 'Farina, la que admeta'] },
      { titol: 'Farciment de tomaca', linies: ['1 pot de tomaca crua', 'Un poc de sucre per a corregir', '2 pots de tonyina', 'Oli d’oliva', 'Sal'] },
      { titol: 'Variant', linies: ['1 tassa d’oli d’oliva', '1 tassa d’aigua', 'Un ratllet de vinagre', '1 ou', 'Un poquet de sucre', 'Farina que admeta'] },
      { titol: 'Farciment de verdura', linies: ['2 bloquets d’espinacs i bledes', 'Allets secs trossejats', 'Pinyonets', 'Oli d’oliva', 'Sal'] }
    ],
    preparacio: [
      {
        titol: 'Preparació de la pasta',
        linies: ['En primer lloc, agafeu una safa i afegiu-hi l’oli d’oliva i tots els ingredients i pasteu. En estar la pasta bona, passeu-li el corró (el rodillo) i feu-la ben fina. Seguidament, agafeu un got per tallar la pasta i donar la forma del pastisset.']
      },
      {
        titol: 'Preparació del farciment de tomaca',
        linies: ['Primerament, agafeu una paella i sofregiu la tomaca, tot fent servir l’oli d’oliva, el sucre per a corregir-ne l’acidesa i la sal. En estar tot sofregit, retireu-ho de la paella i afegiu a la tomaca la tonyina i remeneu-ho tot.']
      },
      {
        titol: 'Preparació del farciment de verdura',
        linies: ['Poseu a bullir els espinacs i les bledes i, en estar bullides, sofregiu-les en una paella amb l’oli d’oliva, els allets secs, que ja haureu trossejat, els pinyonets i la sal.']
      },
      {
        titol: 'Preparació',
        linies: ['Una vegada feta la pasta i donada la forma del cocotet, afegiu-hi la tomaca fregida o la verdura i tanqueu el pastisset amb una forqueta. En tenir-los preparats, pinteu amb el rovell de l’ou els lloms dels pastissets i introduïu-los al forn, a 200 graus, mitja hora, més o menys i estaran bons. Vigileu perquè no es cremen.']
      }
    ]
  },
  118: {
    motiu: 'capçalera convertida en pas i ingredients de l’almívar barrejats al kit (p. 130)',
    ingredients: [
      { titol: null, linies: ['1/4 de quilo de coco', '1/4 de quilo de sucre', '8 ous', 'Un poc de sagí (mantega de porc per untar el motle)'] },
      { titol: 'Ingredients per l’almívar', linies: ['1/2 de quilo de sucre', '1/4 de litre d’aigua', '100 grams de farina', 'Un rall d’herbero'] }
    ],
    preparacio: [{
      titol: null,
      linies: [
        'En primer lloc, agafeu una safa i alceu al punt de neu les clares dels ous. A continuació, afegiu-hi els 8 rovells dels ous i remeneu-ho tot. Tot seguit, afegiu-hi el sucre, remeneu bona i cosa i finalment, afegiu-hi el coco. En tenir la pasta preparada, reserveu-la i agafeu un motle i unteu-li una mica de sagí (mantega de porc), perquè no s’enganxe la base, es creme i no isca del motle, en traure’l del forn. Una vegada untat el motle, afegiu-hi la pasta de coco i repartiu-la uniformement per tot el motle. Tot seguit, enceneu el forn a 150 graus, durant tres quarts d’hora, aproximadament, i deixeu que es faça. En la presentació, punxeu el pastís amb una forqueta i caleu-ho ben calat; és a dir, afegiu-hi l’almívar per sobre el pastís i procureu que l’almívar n’entre ben endins. Finalment, escampeu per damunt del pastís un poc de coco molt, per a decorar i serviu-lo.',
        'Per a fer l’almívar, agafeu tots els ingredients i afegiu-los a una cassola i poseu-la al foc lent. Remeneu-ho tot, a poc a poc, fins que es faça.'
      ]
    }]
  }
};

/**
 * Onada R14, arreglos de la verificació de fidelitat · Retocs puntuals de signes que la comparació lletra a lletra no
 * veu (ignora guionets, punts i espais): cada parell [kit, llibre] s'aplica a les línies del kit d'una recepta i ha
 * de casar exactament una vegada, o el generador falla.
 *   #66, p. 75: el kit escriu «col. loqueu-los» i el llibre imprimix «col.loqueu-los», sense espai.
 *   #135, p. 147: el llibre parteix «traieu-los-» / «en» a final de línia; el kit va llevar el guionet, que era real.
 */
export const SUBSTITUCIONS = {
  66: [['col. loqueu-los', 'col.loqueu-los']],
  135: [['traieu-losen', 'traieu-los-en']]
};
