/**
 * diccionari.js — la FONT ÚNICA de les dades de Salut (nucli pur).
 *
 * D'ací ixen:
 *   · la validació de cada apunt (validaApunt) i la llista blanca del magatzem;
 *   · els formularis d'apuntar (cada camp diu quin control li toca);
 *   · la vista Diccionari, perquè la família sàpia què apunta i per què;
 *   · la fulla «Diccionari» de l'XLSX, perquè el metge entenga cada columna.
 *
 * Cada camp: { clau, etiqueta, tipus, unitat?, valors?|grups?|min?|max?,
 *   obligatori, perDefecte?, condicio?, avisa?, maxLlargada?, definicio,
 *   perQueImporta, columna? }
 *   tipus  enter · decimes (enter en dècimes: 378 = 37,8) · escala (enter
 *          amb etiquetes) · opcio · multiopcio · boolea · text
 *   condicio  { clau, valors }: el camp només existix si un altre camp val
 *             un d'eixos valors (el motiu, només si s'ha despertat)
 *   avisa  { sobre, text }: un valor possible però poc versemblant, que es
 *          desa igual i demana revisar-lo
 *   columna   el títol de la columna de l'exportació que el porta
 *
 * Paraules planeres: el diccionari descriu, no etiqueta ningú. La base
 * clínica (diari de 3 dies, terminologia ICS de la nit, escala de Bristol,
 * registre ABC) és pràctica coneguda; els textos són propis.
 */
import { esData, esMoment, esOfset } from './hores.js';

const valors = (...parells) => Object.freeze(parells.map(([valor, etiqueta, ajuda]) => Object.freeze(
  ajuda ? { valor, etiqueta, ajuda } : { valor, etiqueta }
)));
const camp = (definicio) => Object.freeze(definicio);

/* Els tipus que es poden apuntar; els quatre últims només descriuen (moments, hores, dates i mesures calculades). */
export const TIPUS_CAMP = Object.freeze(['enter', 'decimes', 'escala', 'opcio', 'multiopcio', 'boolea', 'text', 'moment', 'hora', 'data', 'decimal']);
export const MAX_NOTA = 120;
const PATRO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/* Cap control ni HTML dins d'un text lliure. */
const TEXT_PROHIBIT = /[<>\u0000-\u001F\u007F-\u009F]/;

/* ── Camps comuns a tots els apunts ────────────────────────────────────── */

export const CAMPS_COMUNS = Object.freeze([
  camp({
    clau: 'moment', etiqueta: 'Dia i hora', tipus: 'moment', obligatori: true,
    definicio: 'quan ha passat, amb l’hora del rellotge de casa',
    perQueImporta: 'ordena el dia i separa el dia de la nit; amb el canvi d’hora es guarda també la diferència amb l’hora universal',
    columna: 'Data'
  }),
  camp({
    clau: 'nota', etiqueta: 'Nota', tipus: 'text', maxLlargada: MAX_NOTA, obligatori: false,
    definicio: 'una nota curta, escrita amb respecte',
    perQueImporta: 'el que no cap en cap altre camp i el metge ha de saber',
    columna: 'Notes'
  })
]);
const CAMP_NOTA = CAMPS_COMUNS.find((c) => c.clau === 'nota');

/* ── Els tipus d'apunt ─────────────────────────────────────────────────── */

const MICCIO = Object.freeze({
  id: 'miccio', nom: 'Micció', boto: 'Ha orinat', icona: 'Toilet',
  definicio: 'cada vegada que orina, al vàter, a l’orinal o a la cunya',
  camps: Object.freeze([
    camp({
      clau: 'volumMl', etiqueta: 'Quant (ml)', tipus: 'enter', unitat: 'ml', min: 0, max: 1500, obligatori: false,
      avisa: Object.freeze({ sobre: 800, text: 'Més de 800 ml d’una vegada és poc habitual: revisa la xifra.' }),
      definicio: 'quant ha orinat, mesurat amb una gerra graduada o una ampolla',
      perQueImporta: 'el volum total, el de la nit i el de cada vegada són la base del diari',
      columna: 'Orina (ml)'
    }),
    camp({
      clau: 'mesura', etiqueta: 'Com s’ha mesurat', tipus: 'opcio', obligatori: true, perDefecte: 'no-mesurat',
      valors: valors(['mesurat', 'Mesurat'], ['estimat', 'A ull'], ['no-mesurat', 'No s’ha mesurat']),
      definicio: 'si el volum s’ha mesurat, s’ha calculat a ull o no se sap',
      perQueImporta: 'sense mesura no es calculen volums; ho diu la cobertura del dia',
      columna: 'Mesura'
    }),
    camp({
      clau: 'lloc', etiqueta: 'On', tipus: 'opcio', obligatori: true, perDefecte: 'vater',
      valors: valors(['vater', 'Vàter'], ['orinal-de-ma', 'Orinal de mà'], ['cunya', 'Cunya'], ['cadira-vater', 'Cadira vàter']),
      definicio: 'on ha orinat',
      perQueImporta: 'ajuda a entendre quanta autonomia té i el risc de caure'
    }),
    camp({
      clau: 'urgencia', etiqueta: 'Ganes', tipus: 'escala', min: 0, max: 4, obligatori: false,
      valors: valors([0, '0 · Cap'], [1, '1 · Lleus'], [2, '2 · Moderades'], [3, '3 · Intenses'], [4, '4 · Se li ha escapat de pressa']),
      definicio: 'com de fortes eren les ganes d’orinar (escala de 0 a 4)',
      perQueImporta: 'unes ganes fortes i sovint són una cosa que el metge vol saber',
      columna: 'Urgència (0–4)'
    }),
    camp({
      clau: 'ajuda', etiqueta: 'Ajuda', tipus: 'opcio', obligatori: false,
      valors: valors(['sol', 'Ha anat sol'], ['amb-ajuda', 'Amb ajuda'], ['oferit-per-horari', 'Li l’hem oferit per horari']),
      definicio: 'si ha anat tot sol o se li ha oferit',
      perQueImporta: 'mostra si oferir el vàter a hores fixes funciona'
    }),
    camp({
      clau: 'molesties', etiqueta: 'Molèsties', tipus: 'multiopcio', obligatori: false, exclusiu: 'cap',
      valors: valors(['cap', 'Cap'], ['cremor', 'Cremor'], ['dolor', 'Dolor'], ['costa-comencar', 'Li costa començar'], ['raig-fluix', 'Raig fluix']),
      definicio: 'què ha notat en orinar',
      perQueImporta: 'el cremor o el dolor són un motiu per a parlar-ne amb el metge'
    }),
    camp({
      clau: 'aspecte', etiqueta: 'Com era', tipus: 'multiopcio', obligatori: false, exclusiu: 'normal',
      valors: valors(['normal', 'Normal'], ['clara', 'Clara'], ['fosca', 'Fosca'], ['terbola', 'Tèrbola'], ['sang-visible', 'Sang visible'], ['olor-forta', 'Olor forta']),
      definicio: 'com era l’orina a simple vista',
      perQueImporta: 'la sang visible o un canvi brusc són un motiu per a consultar'
    })
  ])
});

const INGESTA = Object.freeze({
  id: 'ingesta', nom: 'Beguda', boto: 'Ha begut', icona: 'GlassWater',
  definicio: 'cada vegada que beu (o se li oferix beure)',
  camps: Object.freeze([
    camp({
      clau: 'volumMl', etiqueta: 'Quant (ml)', tipus: 'enter', unitat: 'ml', min: 0, max: 1500, obligatori: true, perDefecte: 200,
      definicio: 'quant ha begut; un got normal són uns 200 ml',
      perQueImporta: 'sense saber què entra no s’entén el que ix',
      columna: 'Begut (ml)'
    }),
    camp({
      clau: 'beguda', etiqueta: 'Què', tipus: 'opcio', obligatori: true, perDefecte: 'aigua',
      valors: valors(['aigua', 'Aigua'], ['cafe', 'Cafè'], ['te', 'Te'], ['infusio', 'Infusió'], ['llet', 'Llet'], ['suc', 'Suc'],
        ['refresc', 'Refresc'], ['refresc-cafeina', 'Refresc amb cafeïna'], ['alcohol', 'Alcohol'], ['brou-sopa', 'Brou o sopa'],
        ['postres-liquides', 'Postres líquides'], ['espessida', 'Beguda espessida'], ['altra', 'Una altra']),
      definicio: 'què ha begut',
      perQueImporta: 'la cafeïna i l’alcohol fan orinar més; les begudes espessides compten igual',
      columna: 'Beguda'
    }),
    camp({
      clau: 'estimat', etiqueta: 'Calculat a ull', tipus: 'boolea', obligatori: false, perDefecte: false,
      definicio: 'el volum no s’ha mesurat, s’ha calculat a ull',
      perQueImporta: 'per a saber quant ens podem refiar del total'
    }),
    camp({
      clau: 'rebutjada', etiqueta: 'Li l’hem oferida i no l’ha volguda', tipus: 'boolea', obligatori: false, perDefecte: false,
      definicio: 'se li ha oferit beure i no ha volgut',
      perQueImporta: 'si en rebutja molt, pot beure massa poc'
    })
  ])
});

const ESCAPAMENT = Object.freeze({
  id: 'escapament', nom: 'Escapament', boto: 'Escapament', icona: 'Droplets',
  definicio: 'orina que s’escapa sense voler',
  camps: Object.freeze([
    camp({
      clau: 'quantitat', etiqueta: 'Quant', tipus: 'opcio', obligatori: true, perDefecte: 'humit',
      valors: valors(['gotes', 'Unes gotes'], ['humit', 'Humit'], ['xopat', 'Xopat']),
      definicio: 'quant s’ha escapat',
      perQueImporta: 'la quantitat i les vegades ajuden a entendre de quina mena d’escapament es tracta',
      columna: 'Escapament'
    }),
    camp({
      clau: 'circumstancia', etiqueta: 'Quan ha passat', tipus: 'opcio', obligatori: true, perDefecte: 'no-se-sap',
      valors: valors(['amb-urgencia', 'Amb ganes urgents'], ['en-esforc', 'En un esforç (tos, alçar-se)'],
        ['sense-avisar', 'Sense adonar-se’n'], ['no-se-sap', 'No se sap']),
      definicio: 'què passava quan s’ha escapat',
      perQueImporta: 'no és el mateix escapar-se en un esforç, amb ganes urgents o sense adonar-se’n'
    }),
    camp({
      clau: 'pesAbsorbentG', etiqueta: 'Pes de l’absorbent mullat (g)', tipus: 'enter', unitat: 'g', min: 0, max: 3000, obligatori: false,
      definicio: 'el pes de l’absorbent mullat, si hi ha balança',
      perQueImporta: 'el pes menys el pes en sec són, més o menys, els ml que s’han escapat'
    })
  ])
});

const ABSORBENT = Object.freeze({
  id: 'absorbent', nom: 'Canvi d’absorbent', boto: 'Absorbent', icona: 'Layers',
  definicio: 'cada canvi d’absorbent',
  camps: Object.freeze([
    camp({
      clau: 'estat', etiqueta: 'Com estava', tipus: 'opcio', obligatori: true, perDefecte: 'humit',
      valors: valors(['sec', 'Sec'], ['humit', 'Humit'], ['mullat', 'Mullat'], ['xopat', 'Xopat'], ['amb-femta', 'Amb femta']),
      definicio: 'com estava l’absorbent que s’ha llevat',
      perQueImporta: 'el nombre de canvis i com estaven diuen quant s’escapa',
      columna: 'Absorbent'
    }),
    camp({
      clau: 'pesG', etiqueta: 'Pes (g)', tipus: 'enter', unitat: 'g', min: 0, max: 3000, obligatori: false,
      definicio: 'el pes de l’absorbent llevat, si hi ha balança',
      perQueImporta: 'amb el pes en sec, dona una idea dels ml'
    }),
    camp({
      clau: 'pell', etiqueta: 'La pell', tipus: 'opcio', obligatori: true, perDefecte: 'be',
      valors: valors(['be', 'Bé'], ['envermellida', 'Envermellida'], ['ferida', 'Ferida']),
      definicio: 'com està la pell de la zona',
      perQueImporta: 'la pell ferida és un motiu per a consultar amb infermeria'
    })
  ])
});

const DEPOSICIO = Object.freeze({
  id: 'deposicio', nom: 'Deposició', boto: 'Ha fet de ventre', icona: 'CircleDot',
  definicio: 'cada vegada que fa de ventre',
  camps: Object.freeze([
    camp({
      clau: 'bristol', etiqueta: 'Com era (escala de Bristol)', tipus: 'escala', min: 1, max: 7, obligatori: true,
      valors: valors([1, '1 · Boletes dures i separades'], [2, '2 · Dura i grumollosa'], [3, '3 · Allargada, amb clivelles'],
        [4, '4 · Llisa i tova'], [5, '5 · Trossos tous'], [6, '6 · Pastosa, de vores irregulars'], [7, '7 · Líquida']),
      definicio: 'la forma de la femta, de l’1 (molt dura) al 7 (líquida)',
      perQueImporta: 'el restrenyiment pot fer que estiga més inquiet i que orine pitjor; la femta líquida fa perdre aigua',
      columna: 'Deposició (Bristol)'
    }),
    camp({
      clau: 'quantitat', etiqueta: 'Quant', tipus: 'opcio', obligatori: true, perDefecte: 'normal',
      valors: valors(['poca', 'Poca'], ['normal', 'Normal'], ['molta', 'Molta']),
      definicio: 'quanta quantitat, a ull',
      perQueImporta: 'una quantitat petita i dura acompanya sovint els dies sense fer de ventre'
    }),
    camp({
      clau: 'esforcDolor', etiqueta: 'Amb esforç o dolor', tipus: 'boolea', obligatori: false, perDefecte: false,
      definicio: 'li ha costat o li ha fet mal', perQueImporta: 'és un senyal de restrenyiment'
    }),
    camp({
      clau: 'escapament', etiqueta: 'Se li ha escapat', tipus: 'boolea', obligatori: false, perDefecte: false,
      definicio: 'no ha arribat a temps', perQueImporta: 'el metge ho vol saber'
    }),
    camp({
      clau: 'sangVisible', etiqueta: 'Sang visible', tipus: 'boolea', obligatori: false, perDefecte: false,
      definicio: 's’hi veu sang', perQueImporta: 'és un motiu per a consultar'
    })
  ])
});

const SON = Object.freeze({
  id: 'son', nom: 'Son', boto: 'Son', icona: 'Bed',
  definicio: 'quan es gita, s’adorm, es desperta de nit o s’alça',
  camps: Object.freeze([
    camp({
      clau: 'event', etiqueta: 'Què', tipus: 'opcio', obligatori: true, perDefecte: 'despertar',
      valors: valors(['gitar-se', 'Se’n va al llit'], ['adormir-se', 'S’adorm'], ['despertar', 'Es desperta de nit'],
        ['alcar-se', 'S’alça (comença el dia)'], ['migdiada-inici', 'Comença la migdiada'], ['migdiada-fi', 'Acaba la migdiada']),
      definicio: 'el moment del son que s’apunta',
      perQueImporta: 'adormir-se i alçar-se marquen què és la nit per a comptar les vegades que s’alça a orinar'
    }),
    camp({
      clau: 'motiu', etiqueta: 'Per què s’ha despertat', tipus: 'opcio', obligatori: false,
      condicio: Object.freeze({ clau: 'event', valors: Object.freeze(['despertar']) }),
      valors: valors(['orinar', 'Per a orinar'], ['dolor', 'Dolor'], ['confusio-agitacio', 'Confusió o inquietud'], ['soroll', 'Soroll'], ['no-se-sap', 'No se sap']),
      definicio: 'el motiu del despertar, si se sap',
      perQueImporta: 'les nits dolentes solen anar amb dies més inquiets'
    })
  ])
});

const MEDICACIO = Object.freeze({
  id: 'medicacio', nom: 'Medicació', boto: 'Medicació', icona: 'Pill',
  definicio: 'cada presa de medicació, tal com la diu la família',
  camps: Object.freeze([
    camp({
      clau: 'nom', etiqueta: 'Nom (com li dieu a casa)', tipus: 'text', maxLlargada: 60, obligatori: true,
      definicio: 'el nom que li doneu a casa; val «la pastilla de la pressió»',
      perQueImporta: 'el metge vol veure l’hora de les preses al costat de la resta del dia',
      columna: 'Medicació'
    }),
    camp({
      clau: 'dosi', etiqueta: 'Quantitat', tipus: 'text', maxLlargada: 30, obligatori: false,
      definicio: 'la quantitat, tal com diu la recepta o la caixa',
      perQueImporta: 'per a saber què s’ha pres de veritat'
    }),
    camp({
      clau: 'pauta', etiqueta: 'Pauta', tipus: 'opcio', obligatori: true, perDefecte: 'fixa',
      valors: valors(['fixa', 'A hora fixa'], ['si-cal', 'Només si cal']),
      definicio: 'si es pren a hores fixes o només quan cal',
      perQueImporta: 'les preses «si cal» diuen quan ha fet falta'
    }),
    camp({
      clau: 'estat', etiqueta: 'Què ha passat', tipus: 'opcio', obligatori: true, perDefecte: 'presa',
      valors: valors(['presa', 'Presa'], ['rebutjada', 'No l’ha volguda'], ['oblidada', 'Oblidada'], ['vomitada', 'L’ha tornada']),
      definicio: 'si s’ha pres o no',
      perQueImporta: 'les preses que falten s’han de parlar amb el metge abans de canviar res'
    }),
    camp({
      clau: 'etiqueta', etiqueta: 'Per a què és (ho trieu vosaltres)', tipus: 'opcio', obligatori: false,
      valors: valors(['diuretic', 'Per a orinar'], ['per-dormir', 'Per a dormir'], ['per-a-l-agitacio', 'Per a la inquietud'],
        ['laxant', 'Per a fer de ventre'], ['per-al-dolor', 'Per al dolor'], ['altra', 'Una altra']),
      definicio: 'una etiqueta que posa la família; l’app no classifica medicaments',
      perQueImporta: 'ajuda a llegir el full: una pastilla per a orinar a la vesprada es nota a la nit'
    })
  ])
});

/* Les conductes, en quatre grups observables. Textos propis, inspirats en
   l'estructura dels instruments clínics (no en copien cap ítem). */
const GRUPS_CONDUCTA = Object.freeze([
  Object.freeze({ id: 'fisica-risc', etiqueta: 'Física, amb risc', valors: valors(['colpejar', 'Colpejar'], ['empentar', 'Empentar'],
    ['esgarrapar', 'Esgarrapar'], ['mossegar', 'Mossegar'], ['llancar-coses', 'Llançar coses']) }),
  Object.freeze({ id: 'fisica-sense-risc', etiqueta: 'Física, sense risc', valors: valors(['caminar-sense-parar', 'Caminar sense parar'],
    ['no-parar-quiet', 'No parar quiet'], ['vestir-se-fora-de-lloc', 'Vestir-se o despullar-se fora de lloc'], ['voler-anar-se-n', 'Voler anar-se’n'],
    ['tocar-desmuntar', 'Tocar o desmuntar coses'], ['amagar-coses', 'Amagar coses']) }),
  Object.freeze({ id: 'verbal', etiqueta: 'Verbal', valors: valors(['cridar', 'Cridar'], ['queixar-se-sense-parar', 'Demanar o queixar-se sense parar'],
    ['preguntar-el-mateix', 'Preguntar el mateix'], ['insultar', 'Insultar'], ['fer-sorolls', 'Fer sorolls']) }),
  Object.freeze({ id: 'altres', etiqueta: 'Altres', valors: valors(['plorar', 'Plorar'], ['por-angoixa', 'Por o angoixa'],
    ['veure-coses', 'Veure o sentir coses que no hi són (aparentment)'], ['rebutjar-higiene', 'Rebutjar la higiene'],
    ['rebutjar-medicacio', 'Rebutjar la medicació'], ['rebutjar-menjar', 'Rebutjar el menjar']) })
]);

const CONDUCTA = Object.freeze({
  id: 'conducta', nom: 'Episodi de conducta', boto: 'Conducta', icona: 'HandHeart',
  definicio: 'un moment d’inquietud o de conducta difícil, apuntat en tres passos: què ha fet, què passava abans i què hem fet',
  camps: Object.freeze([
    camp({
      clau: 'conductes', etiqueta: 'Què ha fet', tipus: 'multiopcio', obligatori: true, grups: GRUPS_CONDUCTA, pas: 'a',
      definicio: 'què ha fet, de manera concreta i que es puga veure o sentir',
      perQueImporta: 'descriure bé és el primer pas per a entendre-ho'
    }),
    camp({
      clau: 'intensitat', etiqueta: 'Com de fort', tipus: 'escala', min: 1, max: 3, obligatori: true, pas: 'a',
      valors: valors([1, 'Lleu'], [2, 'Moderat'], [3, 'Fort']),
      definicio: 'com de fort ha sigut', perQueImporta: 'per a veure si va a més o a menys',
      columna: 'Conducta'
    }),
    camp({
      clau: 'duradaMin', etiqueta: 'Quant ha durat (minuts)', tipus: 'enter', unitat: 'min', min: 1, max: 600, obligatori: false, pas: 'a',
      definicio: 'els minuts que ha durat, més o menys', perQueImporta: 'per a veure si va a més o a menys'
    }),
    camp({
      clau: 'antecedents', etiqueta: 'Què passava abans', tipus: 'multiopcio', obligatori: false, pas: 'b',
      valors: valors(['ganes-vater', 'Ganes d’orinar o de fer de ventre'], ['absorbent-mullat', 'Absorbent mullat'], ['dolor-aparent', 'Dolor aparent'],
        ['set-fam', 'Set o fam'], ['fred-calor', 'Fred o calor'], ['cansament', 'Cansament o son'], ['soroll-gent', 'Soroll o molta gent'],
        ['canvi-rutina', 'Canvi de rutina o de lloc'], ['higiene', 'El moment de la higiene'], ['visita', 'Una visita'],
        ['vesprada-foscor', 'La vesprada o la foscor'], ['despres-medicacio', 'Després d’una medicació'], ['no-se-sap', 'No se sap']),
      definicio: 'què passava just abans',
      perQueImporta: 'moltes vegades la inquietud ve d’una necessitat que no s’ha cobert'
    }),
    camp({
      clau: 'antecedentsAltre', etiqueta: 'Una altra cosa que passava', tipus: 'text', maxLlargada: MAX_NOTA, obligatori: false, pas: 'b',
      definicio: 'el que passava abans, si no és a la llista', perQueImporta: 'per a no perdre cap pista'
    }),
    camp({
      clau: 'accions', etiqueta: 'Què hem fet', tipus: 'multiopcio', obligatori: false, pas: 'c',
      valors: valors(['acompanyar-vater', 'Acompanyar-lo al vàter'], ['canviar-absorbent', 'Canviar l’absorbent'],
        ['oferir-beguda-menjar', 'Oferir beguda o menjar'], ['calmar-parlant', 'Calmar-lo parlant'], ['distraure', 'Distraure o fer una activitat'],
        ['deixar-espai', 'Deixar-li espai'], ['medicacio-si-cal', 'Medicació «si cal»'], ['altra', 'Una altra cosa']),
      definicio: 'què hem fet per a ajudar', perQueImporta: 'per a saber què funciona'
    }),
    camp({
      clau: 'resultat', etiqueta: 'Com ha acabat', tipus: 'opcio', obligatori: true, pas: 'c',
      valors: valors(['es-calma-prompte', 'Es calma prompte'], ['es-calma-a-poc-a-poc', 'Es calma a poc a poc'], ['no-es-calma', 'No es calma'], ['empitjora', 'Va a pitjor']),
      definicio: 'com ha acabat', perQueImporta: 'per a saber quina manera d’ajudar funciona millor'
    }),
    camp({
      clau: 'risc', etiqueta: 'Hi ha hagut perill', tipus: 'multiopcio', obligatori: false, pas: 'c',
      valors: valors(['caiguda', 'Una caiguda'], ['ferida', 'Una ferida'], ['perill-per-a-altres', 'Perill per a altres']),
      definicio: 'si hi ha hagut perill per a ell o per a altres',
      perQueImporta: 'si hi ha perill, cal ajuda: el 112 ara mateix o l’equip que el porta'
    })
  ])
});

const OBSERVACIO = Object.freeze({
  id: 'observacio', nom: 'Observació', boto: 'Altres', icona: 'Eye',
  definicio: 'altres coses que es veuen: temperatura, una caiguda, que menja poc o que està diferent',
  camps: Object.freeze([
    camp({
      clau: 'que', etiqueta: 'Què', tipus: 'opcio', obligatori: true,
      valors: valors(['temperatura', 'Temperatura'], ['caiguda', 'Una caiguda'], ['menja-poc', 'Menja poc'],
        ['canvi-brusc', 'Està diferent de sempre, de colp'], ['altra', 'Una altra cosa']),
      definicio: 'què s’ha observat',
      perQueImporta: 'un canvi de colp pot tindre una causa física que cal mirar'
    }),
    camp({
      clau: 'temperaturaDecimes', etiqueta: 'Temperatura (°C)', tipus: 'decimes', unitat: '°C', min: 340, max: 420, obligatori: true,
      condicio: Object.freeze({ clau: 'que', valors: Object.freeze(['temperatura']) }),
      definicio: 'la temperatura, amb un decimal (37,8)',
      perQueImporta: 'en persones grans, una temperatura no gaire alta ja pot ser important'
    })
  ])
});

/** Els tipus d'apunt, en l'ordre de la botonera. */
export const TIPUS_APUNT = Object.freeze([MICCIO, INGESTA, ESCAPAMENT, ABSORBENT, DEPOSICIO, CONDUCTA, MEDICACIO, SON, OBSERVACIO]);
export const IDS_TIPUS = Object.freeze(TIPUS_APUNT.map((tipus) => tipus.id));
/* Els interruptors de l'app (manifest.interruptors) que amaguen un tipus. */
export const INTERRUPTOR_DE_TIPUS = Object.freeze({ conducta: 'agitacio', medicacio: 'medicacio', deposicio: 'deposicions' });

/* ── Les altres entitats (per al diccionari i la validació) ────────────── */

export const CAMPS_PERSONA = Object.freeze([
  camp({ clau: 'alias', etiqueta: 'Com li dieu', tipus: 'text', maxLlargada: 40, obligatori: true, perDefecte: 'el pare',
    definicio: 'un àlies; no cal el nom', perQueImporta: 'només es veu ací; el fitxer exportat no el porta si no ho demaneu' }),
  camp({ clau: 'majorDe65', etiqueta: 'Té més de 65 anys', tipus: 'boolea', obligatori: false, perDefecte: true,
    definicio: 'si té més de 65 anys', perQueImporta: 'canvia la referència de la part de l’orina feta de nit' }),
  camp({ clau: 'pesKg', etiqueta: 'Pes (kg)', tipus: 'enter', unitat: 'kg', min: 20, max: 250, obligatori: false,
    definicio: 'el pes, si se sap', perQueImporta: 'permet comparar l’orina d’un dia amb el pes' }),
  camp({ clau: 'limitLiquidsMl', etiqueta: 'Límit de líquids que ha dit el metge (ml al dia)', tipus: 'enter', unitat: 'ml', min: 300, max: 5000, obligatori: false,
    definicio: 'només si el metge ha pautat un límit', perQueImporta: 'si n’hi ha, l’app no avisa de beure poc' }),
  camp({ clau: 'usaAbsorbent', etiqueta: 'Fa servir absorbent', tipus: 'boolea', obligatori: false, perDefecte: false,
    definicio: 'si porta absorbent', perQueImporta: 'per a apuntar els canvis' }),
  camp({ clau: 'pesAbsorbentSecG', etiqueta: 'Pes de l’absorbent sec (g)', tipus: 'enter', unitat: 'g', min: 0, max: 500, obligatori: false,
    definicio: 'el pes d’un absorbent sense usar', perQueImporta: 'per a calcular, a partir del pes, quant s’ha escapat' }),
  camp({ clau: 'horaAlcarHabitual', etiqueta: 'Hora d’alçar-se habitual', tipus: 'hora', obligatori: true, perDefecte: '07:00',
    definicio: 'a quina hora s’alça normalment', perQueImporta: 'si no s’apunta, marca on comença el dia' }),
  camp({ clau: 'horaGitarHabitual', etiqueta: 'Hora de gitar-se habitual', tipus: 'hora', obligatori: true, perDefecte: '22:00',
    definicio: 'a quina hora es gita normalment', perQueImporta: 'si no s’apunta, marca on comença la nit' }),
  camp({ clau: 'tempHabitualDecimes', etiqueta: 'Temperatura habitual (°C)', tipus: 'decimes', unitat: '°C', min: 340, max: 380, obligatori: false,
    definicio: 'la temperatura que té normalment', perQueImporta: 'una pujada d’un grau sobre la seua habitual ja és un avís' })
]);

export const CAMPS_JORNADA = Object.freeze([
  camp({ clau: 'data', etiqueta: 'Jornada', tipus: 'data', obligatori: true,
    definicio: 'el dia que comença quan s’alça; la nit és de la jornada d’abans d’alçar-se', perQueImporta: 'agrupa la nit amb el dia que la precedix' }),
  camp({ clau: 'completa', etiqueta: 'He apuntat tot el dia', tipus: 'boolea', obligatori: false, perDefecte: false,
    definicio: 'la família diu que no s’ha deixat res', perQueImporta: 'sense això no es calcula cap mitjana ni cap índex' }),
  camp({ clau: 'notes', etiqueta: 'Notes del dia', tipus: 'text', maxLlargada: 300, obligatori: false,
    definicio: 'el que va passar eixe dia', perQueImporta: 'context per a llegir el full' })
]);

/* Les mesures que calcula l'app, amb paraules del diari de 3 dies (ICS 2019). */
export const METRIQUES = Object.freeze([
  camp({ clau: 'frequenciaDiurna', etiqueta: 'Vegades de dia', tipus: 'enter', columna: 'Vegades de dia',
    definicio: 'miccions de quan s’alça fins que s’adorm, la primera i l’última incloses', perQueImporta: 'diu cada quant orina' }),
  camp({ clau: 'nicturia', etiqueta: 'Vegades de nit', tipus: 'enter', columna: 'Vegades de nit',
    definicio: 'miccions entre adormir-se i alçar-se, sense la primera del matí', perQueImporta: 'cada vegada que s’alça de nit hi ha risc de caure' }),
  camp({ clau: 'volum24h', etiqueta: 'Orina en 24 h (ml)', tipus: 'enter', unitat: 'ml', columna: 'Orina 24 h (ml)',
    definicio: 'des de després de la primera micció del matí fins a la primera de l’endemà, inclosa', perQueImporta: 'el total d’un dia sencer' }),
  camp({ clau: 'volumNocturn', etiqueta: 'Orina de nit (ml)', tipus: 'enter', unitat: 'ml', columna: 'Orina de nit (ml)',
    definicio: 'les miccions de la nit més la primera del matí següent', perQueImporta: 'compara la nit amb el dia' }),
  camp({ clau: 'indexPoliuriaNocturna', etiqueta: 'Part de l’orina feta de nit (NPi, %)', tipus: 'decimal', unitat: '%', columna: 'Part de nit (%)',
    definicio: 'l’orina de nit dividida per la de 24 hores; com a referència, més del 33 % en persones grans (20 % en joves)', perQueImporta: 'diu si la nit pesa més del que tocaria' }),
  camp({ clau: 'indexNicturia', etiqueta: 'Índex de nit (Ni)', tipus: 'decimal', columna: 'Índex de nit (Ni)',
    definicio: 'l’orina de nit dividida per la micció més gran; si passa d’1,5, la nit no cap a la bufeta', perQueImporta: 'ajuda el metge a llegir les nits' }),
  camp({ clau: 'volumMaxim', etiqueta: 'Micció més gran (ml)', tipus: 'enter', unitat: 'ml', columna: 'Màxim (ml)',
    definicio: 'la micció mesurada més gran', perQueImporta: 'dona una idea de quant aguanta la bufeta' }),
  camp({ clau: 'volumMitja', etiqueta: 'Micció mitjana (ml)', tipus: 'enter', unitat: 'ml', columna: 'Mitjana (ml)',
    definicio: 'la mitjana de les miccions mesurades', perQueImporta: 'una mitjana baixa amb moltes vegades és un patró conegut' }),
  camp({ clau: 'ingestaTotal', etiqueta: 'Begut (ml)', tipus: 'enter', unitat: 'ml', columna: 'Begut (ml)',
    definicio: 'tot el que ha begut (sense les begudes rebutjades)', perQueImporta: 'sense saber què entra no s’entén el que ix' }),
  camp({ clau: 'cobertura', etiqueta: 'Cobertura', tipus: 'text', columna: 'Cobertura',
    definicio: 'les miccions mesurades sobre totes les miccions del dia', perQueImporta: 'si no és del 100 %, no es calcula cap volum ni cap índex' })
]);

/* Les dades que no s'apunten: les calcula l'app per a l'exportació. */
export const DERIVATS = Object.freeze([
  camp({ clau: 'periode', etiqueta: 'Dia o nit', tipus: 'text', columna: 'Dia o nit',
    definicio: 'nit és entre adormir-se i alçar-se; si no s’ha apuntat, es fan servir les hores habituals. «Matí següent» és la primera micció de l’endemà de l’últim dia, que tanca la nit',
    perQueImporta: 'separa les miccions de nit' }),
  camp({ clau: 'hora', etiqueta: 'Hora', tipus: 'hora', columna: 'Hora',
    definicio: 'l’hora del rellotge de casa', perQueImporta: 'ordena el dia' })
]);

/* Valoració setmanal (opcional): l'estructura dels instruments, amb textos propis. */
export const DOMINIS_VALORACIO = valors(['idees', 'Idees que no són certes'], ['percepcions', 'Veure o sentir coses que no hi són'],
  ['agitacio', 'Inquietud o agressivitat'], ['tristesa', 'Tristesa'], ['ansietat', 'Nervis o por'], ['euforia', 'Alegria fora de lloc'],
  ['apatia', 'Desgana'], ['desinhibicio', 'Fer o dir coses fora de lloc'], ['irritabilitat', 'Irritabilitat'],
  ['repeticio', 'Moviments o accions que es repetixen'], ['son-nit', 'Son i nit'], ['apetit', 'Gana i menjar']);
export const FREQUENCIES_VALORACIO = valors([1, '1 · Mai'], [2, '2 · Menys d’una vegada per setmana'], [3, '3 · Una o dos vegades per setmana'],
  [4, '4 · Diverses vegades per setmana'], [5, '5 · Una o dos vegades al dia'], [6, '6 · Diverses vegades al dia'], [7, '7 · Diverses vegades per hora']);
export const INSTRUMENTS_OFICIALS = Object.freeze(['CMAI', 'NPI-Q']);
export const AVIS_VALORACIO = 'Inspirada en instruments clínics; no és cap escala validada.';

/** Les entitats que mostra la vista Diccionari, en ordre. */
export const ENTITATS = Object.freeze([
  ...TIPUS_APUNT.map((tipus) => Object.freeze({ id: tipus.id, nom: tipus.nom, definicio: tipus.definicio, camps: Object.freeze([...CAMPS_COMUNS, ...tipus.camps]) })),
  Object.freeze({ id: 'persona', nom: 'Persona', definicio: 'a qui cuidem; una sola en este dispositiu', camps: CAMPS_PERSONA }),
  Object.freeze({ id: 'jornada', nom: 'Jornada', definicio: 'un dia, de quan s’alça a quan s’alça l’endemà', camps: CAMPS_JORNADA }),
  Object.freeze({ id: 'metriques', nom: 'Mesures calculades', definicio: 'el que calcula l’app amb els apunts d’una jornada completa', camps: METRIQUES }),
  Object.freeze({ id: 'derivats', nom: 'Columnes calculades', definicio: 'columnes de l’exportació que no s’apunten', camps: DERIVATS })
]);
export const IDS_ENTITATS = Object.freeze(ENTITATS.map((entitat) => entitat.id));

/* ── Consulta ──────────────────────────────────────────────────────────── */

/** La definició d'un tipus d'apunt, o null. */
export const tipusDe = (id) => TIPUS_APUNT.find((tipus) => tipus.id === id) || null;

/** Un camp d'un tipus d'apunt (o comú), o null. */
export function campDe(tipus, clau) {
  return tipusDe(tipus)?.camps.find((c) => c.clau === clau) || CAMPS_COMUNS.find((c) => c.clau === clau) || null;
}

/** Totes les opcions d'un camp (també les dels grups). */
export const opcionsDe = (definicio) => (definicio?.grups ? definicio.grups.flatMap((grup) => grup.valors) : definicio?.valors || []);

/** L'etiqueta d'un valor d'un camp ('mullat' → 'Mullat'); el valor tal qual si no en té. */
export function etiquetaValor(definicio, valor) {
  const opcio = opcionsDe(definicio).find((o) => o.valor === valor);
  return opcio ? opcio.etiqueta : String(valor ?? '');
}

/** Si el camp existix per a eixe apunt (la condició es complix). */
export function campActiu(definicio, apunt) {
  if (!definicio.condicio) return true;
  return definicio.condicio.valors.includes(apunt?.[definicio.condicio.clau]);
}

/** Els camps propis d'un tipus que valen per a eixe apunt. */
export const campsActius = (tipus, apunt) => (tipusDe(tipus)?.camps || []).filter((c) => campActiu(c, apunt));

/** Els valors per defecte d'un apunt nou d'un tipus. */
export function valorsPerDefecte(tipus) {
  const resultat = {};
  for (const c of tipusDe(tipus)?.camps || []) {
    if (c.perDefecte !== undefined) resultat[c.clau] = c.perDefecte;
    else if (c.tipus === 'multiopcio') resultat[c.clau] = [];
  }
  return resultat;
}

/* ── Validació ─────────────────────────────────────────────────────────── */

const esBuit = (valor) => valor === undefined || valor === null || valor === '' || (Array.isArray(valor) && valor.length === 0);

/** Text de decimes: 378 → «37,8». */
export const textDecimes = (valor) => `${Math.trunc(valor / 10)},${Math.abs(valor % 10)}`;

/** «37,8» o «37.8» → 378; null si no és un nombre amb un decimal com a màxim. */
export function llegixDecimes(text) {
  const m = /^\s*(\d{1,3})(?:[.,](\d))?\s*$/.exec(String(text ?? ''));
  return m ? Number(m[1]) * 10 + Number(m[2] ?? 0) : null;
}

/**
 * Comprova un valor contra el seu camp. Torna { valor } normalitzat, o
 * { error } amb un text que diu com arreglar-ho, i { avis } si és possible
 * però poc versemblant.
 */
export function validaCamp(definicio, cru) {
  const { tipus, etiqueta } = definicio;
  if (esBuit(cru)) {
    return definicio.obligatori ? { error: `Falta «${etiqueta}».` } : { valor: undefined };
  }
  switch (tipus) {
    case 'enter':
    case 'decimes':
    case 'escala': {
      const valor = typeof cru === 'string' && tipus !== 'decimes' ? Number(cru) : cru;
      if (!Number.isSafeInteger(valor)) return { error: `«${etiqueta}» ha de ser un nombre sencer.` };
      if (valor < definicio.min || valor > definicio.max) {
        const rang = tipus === 'decimes' ? `${textDecimes(definicio.min)} i ${textDecimes(definicio.max)}` : `${definicio.min} i ${definicio.max}`;
        return { error: `«${etiqueta}» ha d’estar entre ${rang}.` };
      }
      if (tipus === 'escala' && definicio.valors && !definicio.valors.some((o) => o.valor === valor)) return { error: `Tria una opció de «${etiqueta}».` };
      const avis = definicio.avisa && valor > definicio.avisa.sobre ? definicio.avisa.text : undefined;
      return avis ? { valor, avis } : { valor };
    }
    case 'opcio':
      return definicio.valors.some((o) => o.valor === cru) ? { valor: cru } : { error: `Tria una opció de «${etiqueta}».` };
    case 'multiopcio': {
      if (!Array.isArray(cru)) return { error: `«${etiqueta}» és una llista d’opcions.` };
      const admesos = new Set(opcionsDe(definicio).map((o) => o.valor));
      if (!cru.every((v) => admesos.has(v))) return { error: `Hi ha una opció desconeguda a «${etiqueta}».` };
      const unics = [...new Set(cru)];
      if (definicio.exclusiu && unics.includes(definicio.exclusiu) && unics.length > 1) {
        return { error: `«${etiquetaValor(definicio, definicio.exclusiu)}» no es pot triar amb altres opcions de «${etiqueta}».` };
      }
      return { valor: Object.freeze(unics) };
    }
    case 'boolea':
      return typeof cru === 'boolean' ? { valor: cru } : { error: `«${etiqueta}» és sí o no.` };
    case 'text': {
      if (typeof cru !== 'string') return { error: `«${etiqueta}» ha de ser un text.` };
      const net = cru.trim();
      if (net.length > definicio.maxLlargada) return { error: `«${etiqueta}» pot tindre com a màxim ${definicio.maxLlargada} caràcters.` };
      if (TEXT_PROHIBIT.test(net)) return { error: `«${etiqueta}» porta caràcters que no s’admeten (< > o de control).` };
      return net === '' ? (definicio.obligatori ? { error: `Falta «${etiqueta}».` } : { valor: undefined }) : { valor: net };
    }
    case 'hora':
      return typeof cru === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(cru) ? { valor: cru } : { error: `«${etiqueta}» ha de ser una hora (HH:MM).` };
    case 'data':
      return esData(cru) ? { valor: cru } : { error: `«${etiqueta}» ha de ser una data.` };
    default:
      return { error: `Tipus de camp desconegut: ${tipus}.` };
  }
}

const esInstantIso = (valor) => typeof valor === 'string' && valor.length <= 30 && !Number.isNaN(Date.parse(valor))
  && new Date(valor).toISOString() === valor;

/**
 * Valida un apunt. Les claus que no són del diccionari es descarten (llista
 * blanca) i els camps amb una condició que no es complix també.
 * @param {object} cru
 * @param {{ ambId?: boolean }} [opcions] ambId: l'id (UUID) és obligatori (el que es desa)
 * @returns {{ ok: boolean, errors: Record<string,string>, avisos: Record<string,string>, apunt: object|null }}
 */
export function validaApunt(cru, { ambId = false } = {}) {
  const errors = {};
  const avisos = {};
  if (!cru || typeof cru !== 'object' || Array.isArray(cru)) return { ok: false, errors: { apunt: 'Apunt no vàlid.' }, avisos, apunt: null };
  const definicio = tipusDe(cru.tipus);
  if (!definicio) return { ok: false, errors: { tipus: 'Tipus d’apunt desconegut.' }, avisos, apunt: null };
  const net = { tipus: definicio.id };
  if (cru.id !== undefined || ambId) {
    if (typeof cru.id === 'string' && PATRO_UUID.test(cru.id)) net.id = cru.id;
    else errors.id = 'L’apunt no té un identificador vàlid.';
  }
  if (esMoment(cru.moment)) net.moment = cru.moment;
  else errors.moment = 'Falta el dia i l’hora, o no són vàlids.';
  if (esOfset(cru.ofsetMin)) net.ofsetMin = cru.ofsetMin;
  else errors.ofsetMin = 'Falta la diferència horària del moment.';
  if (cru.jornada !== undefined) {
    if (esData(cru.jornada)) net.jornada = cru.jornada;
    else errors.jornada = 'La jornada no és una data vàlida.';
  }
  for (const marca of ['creat', 'modificat']) {
    if (cru[marca] === undefined) continue;
    if (esInstantIso(cru[marca])) net[marca] = cru[marca];
    else errors[marca] = 'Marca de temps no vàlida.';
  }
  for (const c of [CAMP_NOTA, ...definicio.camps]) {
    if (!campActiu(c, cru)) continue;
    const resultat = validaCamp(c, cru[c.clau]);
    if (resultat.error) errors[c.clau] = resultat.error;
    else if (resultat.valor !== undefined) net[c.clau] = resultat.valor;
    if (resultat.avis) avisos[c.clau] = resultat.avis;
  }
  /* Regles entre camps: la mesura i el volum han de dir el mateix. */
  if (definicio.id === 'miccio' && !errors.mesura && !errors.volumMl) {
    if (net.mesura === 'no-mesurat' && net.volumMl !== undefined) errors.volumMl = 'Si no s’ha mesurat, deixa el volum en blanc o tria «Mesurat».';
    if (net.mesura !== 'no-mesurat' && net.volumMl === undefined) errors.volumMl = 'Escriu el volum o tria «No s’ha mesurat».';
  }
  const ok = Object.keys(errors).length === 0;
  return { ok, errors, avisos, apunt: ok ? Object.freeze(net) : null };
}

/**
 * La llista blanca del magatzem: torna l'apunt net (amb id) o llança un
 * TypeError. El que no és del diccionari no arriba mai al disc.
 */
export function netejaApunt(cru) {
  const { ok, errors, apunt } = validaApunt(cru, { ambId: true });
  if (!ok) throw new TypeError(`Apunt no vàlid: ${Object.keys(errors).join(', ')}`);
  return { ...apunt };
}

/** La persona amb els valors per defecte; els camps no vàlids es descarten (i es diuen). */
export function validaPersona(cru = {}) {
  const errors = {};
  const persona = {};
  for (const c of CAMPS_PERSONA) {
    const resultat = validaCamp({ ...c, obligatori: false }, cru?.[c.clau]);
    if (resultat.error) errors[c.clau] = resultat.error;
    else if (resultat.valor !== undefined) persona[c.clau] = resultat.valor;
    else if (c.perDefecte !== undefined) persona[c.clau] = c.perDefecte;
  }
  return { ok: Object.keys(errors).length === 0, errors, persona: Object.freeze(persona) };
}

/** Una jornada neta { data, completa, notes? } o un TypeError. */
export function netejaJornada(cru) {
  if (!esData(cru?.data)) throw new TypeError('Jornada sense data vàlida.');
  const notes = validaCamp(CAMPS_JORNADA[2], cru.notes);
  if (notes.error) throw new TypeError(notes.error);
  return { data: cru.data, completa: cru.completa === true, ...(notes.valor ? { notes: notes.valor } : {}) };
}

/** Un període net { id, inici, dies, estat } o un TypeError. */
export function netejaPeriode(cru) {
  if (typeof cru?.id !== 'string' || !PATRO_UUID.test(cru.id)) throw new TypeError('Període sense id vàlid.');
  if (!esData(cru.inici)) throw new TypeError('Període sense data d’inici.');
  if (!Number.isSafeInteger(cru.dies) || cru.dies < 1 || cru.dies > 14) throw new TypeError('Un període dura d’1 a 14 dies.');
  if (!['en-curs', 'acabat'].includes(cru.estat)) throw new TypeError('Estat de període desconegut.');
  return { id: cru.id, inici: cru.inici, dies: cru.dies, estat: cru.estat };
}

/** Una valoració setmanal neta o un TypeError. */
export function netejaValoracio(cru) {
  if (typeof cru?.id !== 'string' || !PATRO_UUID.test(cru.id)) throw new TypeError('Valoració sense id vàlid.');
  if (!esData(cru.setmanaInici)) throw new TypeError('Valoració sense setmana.');
  const conductesFreq = {};
  for (const grup of GRUPS_CONDUCTA) {
    const valor = cru.conductesFreq?.[grup.id];
    if (valor === undefined || valor === null) continue;
    if (!Number.isSafeInteger(valor) || valor < 1 || valor > 7) throw new TypeError(`Freqüència no vàlida a «${grup.etiqueta}».`);
    conductesFreq[grup.id] = valor;
  }
  const dominis = {};
  for (const domini of DOMINIS_VALORACIO) {
    const d = cru.dominis?.[domini.valor];
    if (!d) continue;
    const gravetat = d.gravetat ?? 0;
    const angoixa = d.angoixa ?? 0;
    if (!Number.isSafeInteger(gravetat) || gravetat < 0 || gravetat > 3) throw new TypeError(`Gravetat no vàlida a «${domini.etiqueta}».`);
    if (!Number.isSafeInteger(angoixa) || angoixa < 0 || angoixa > 5) throw new TypeError(`Angoixa no vàlida a «${domini.etiqueta}».`);
    dominis[domini.valor] = { gravetat, angoixa };
  }
  const net = { id: cru.id, setmanaInici: cru.setmanaInici, conductesFreq, dominis };
  if (cru.oficial) {
    const { instrument, total, data } = cru.oficial;
    if (!INSTRUMENTS_OFICIALS.includes(instrument) || !Number.isSafeInteger(total) || total < 0 || total > 999 || !esData(data)) {
      throw new TypeError('Puntuació oficial no vàlida.');
    }
    net.oficial = { instrument, total, data, perProfessional: true };
  }
  return net;
}

export { GRUPS_CONDUCTA };

/* ── Resum en una línia (línia del temps, full) ─────────────────────────── */

const ml = (valor) => `${valor} ml`;

/** Una línia curta i neutra per a la línia del temps: «Ha orinat · 250 ml». */
export function resumApunt(apunt) {
  const definicio = tipusDe(apunt?.tipus);
  if (!definicio) return '';
  const e = (clau) => etiquetaValor(campDe(apunt.tipus, clau), apunt[clau]);
  const parts = [definicio.boto];
  switch (apunt.tipus) {
    case 'miccio':
      parts.push(apunt.volumMl !== undefined ? `${ml(apunt.volumMl)}${apunt.mesura === 'estimat' ? ' a ull' : ''}` : 'sense mesurar');
      if (apunt.urgencia !== undefined) parts.push(`ganes ${apunt.urgencia}`);
      break;
    case 'ingesta':
      parts.push(`${e('beguda').toLocaleLowerCase('ca')} ${ml(apunt.volumMl)}`);
      if (apunt.rebutjada) parts.push('no l’ha volguda');
      break;
    case 'escapament': parts.push(e('quantitat').toLocaleLowerCase('ca')); break;
    case 'absorbent': parts.push(e('estat').toLocaleLowerCase('ca')); break;
    case 'deposicio': parts.push(`tipus ${apunt.bristol}`); break;
    case 'son': parts.push(e('event').toLocaleLowerCase('ca')); break;
    case 'medicacio': parts.push(apunt.nom, e('estat').toLocaleLowerCase('ca')); break;
    case 'conducta': parts.push(e('intensitat').toLocaleLowerCase('ca'), ...(apunt.duradaMin ? [`${apunt.duradaMin} min`] : [])); break;
    case 'observacio':
      parts.push(apunt.que === 'temperatura' && apunt.temperaturaDecimes !== undefined ? `${textDecimes(apunt.temperaturaDecimes)} °C` : e('que').toLocaleLowerCase('ca'));
      break;
    default: break;
  }
  return parts.filter(Boolean).join(' · ');
}
