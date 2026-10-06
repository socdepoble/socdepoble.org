/**
 * EspecimenUniversalTPV.jsx — el TPV universal (ordre del Mestre, 261006:
 * prompt 261006_1215 i skill sdp-clon-loiverse). Pedra Seca §9: l'espècimen
 * abans de la producció. Dues demostracions de LA MATEIXA peça, amb dades
 * sintètiques i estat local: el Mode Bar («Cobra», amb tiquets oberts i la
 * tria d'una variant) i el Mode Rebost («Afig a la llista», sense preus).
 * Cap preu ni producte de cap establiment real, cap marca registrada, cap
 * persona: la intel·ligència de dades és un esbós de mostra.
 *
 * La peça ompli l'alçada del seu contenidor: ací el dona el marc
 * .sdp-tpv-marc (tpv.css). «Mòbil» l'estreny i la peça passa sola a una
 * columna amb pestanyes, perquè mesura la seua amplada, no la del viewport.
 *
 * «Sense connexió» (ordre del Mestre, 261006: capacitat offline prioritària)
 * és una demostració: l'app diu a l'avís que cada venda es desa en el
 * dispositiu, i l'Orxata porta una foto que falla a propòsit (una ruta dins
 * de /assets que no existix, cap adreça externa) per a vore l'alternativa:
 * la marca, sense imatge trencada. La venda continua igual.
 *
 * Els al·lèrgens (ordre del Mestre, 261006: «vital per a la Carta Digital i
 * el TPV»): uns quants productes en porten i la rajola pinta les icones del
 * Mestre a la cantonada de dalt a l'esquerra (IconesAlergens) i els diu al
 * nom. La Coca de llanda en porta cinc (3 icones i «+2») i la insígnia
 * «Nou»; el Tallat, a la comanda, la marca i la insígnia (les icones baixen
 * davall de la marca); la Llet del Rebost, a la llista sense insígnia.
 */
import { useState } from 'react';
import { Carrot, Coffee, CupSoda, Milk, Sandwich, ShoppingBasket, SprayCan } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { PillToggle, UniversalTPV } from '../../../../components/PedraSeca/index.js';
import { formatEuros } from '../../../../utils/diners.js';

const MIDES = [
  { valor: 'ample', text: 'Tauleta i escriptori' },
  { valor: 'estret', text: 'Mòbil' }
];
const SESSIONS = [
  { valor: 'amb', text: 'Amb sessió' },
  { valor: 'sense', text: 'Sense sessió' }
];
const CONNEXIONS = [
  { valor: 'amb', text: 'Amb connexió' },
  { valor: 'sense', text: 'Sense connexió' }
];
/* Una ruta dins de /assets que no existix: la foto falla sempre, amb xarxa o sense. */
const FOTO_QUE_FALLA = '/assets/mostra/sense-connexio/orxata.jpg';
const AVIS_SENSE_CONNEXIO = 'Sense connexió: cada venda es desa en este dispositiu.';
const textLinies = (n) => `${n} ${n === 1 ? 'línia' : 'línies'}`;
const textUnitats = (n) => `${n} ${n === 1 ? 'unitat' : 'unitats'}`;

/* ── MODE BAR ──────────────────────────────────────────────────────── */
const CATEGORIES_BAR = [
  { id: 'cafes', nom: 'Cafès', icona: Coffee, visible: true, ordre: 0 },
  { id: 'esmorzars', nom: 'Esmorzars', icona: Sandwich, visible: true, ordre: 1 },
  { id: 'begudes', nom: 'Begudes', icona: CupSoda, visible: true, ordre: 2 }
];

/* La primera variant és la per defecte. Amb més d'una, el toc obri la tria.
   Els al·lèrgens (ordre del Mestre, 261006) són de mostra, en ids de la llista
   canònica: la Coca en porta cinc per a vore el «+2», el Tallat és a la
   comanda amb insígnia i la resta de begudes no en porta. */
const PRODUCTES_BAR = [
  { id: 'cafe-sol', nom: 'Cafè sol', categoriaId: 'cafes', variants: [{ id: 'tassa', nom: 'Tassa', cents: 110 }] },
  { id: 'tallat', nom: 'Tallat', categoriaId: 'cafes', alergens: ['llet'], variants: [{ id: 'tassa', nom: 'Tassa', cents: 130 }] },
  { id: 'cafe-llet', nom: 'Cafè amb llet', categoriaId: 'cafes', alergens: ['llet'], variants: [
    { id: 'tassa', nom: 'Tassa', cents: 150 }, { id: 'got', nom: 'Got', cents: 160 }
  ] },
  { id: 'cigalo', nom: 'Cigaló', categoriaId: 'cafes', variants: [{ id: 'tassa', nom: 'Tassa', cents: 180 }] },
  { id: 'infusio', nom: 'Infusió de camamilla', categoriaId: 'cafes', variants: [{ id: 'tassa', nom: 'Tassa', cents: 120 }] },
  { id: 'torrada', nom: 'Torrada amb tomaca', categoriaId: 'esmorzars', alergens: ['gluten'], variants: [{ id: 'racio', nom: 'Ració', cents: 250 }] },
  { id: 'entrepa', nom: 'Entrepà de truita', categoriaId: 'esmorzars', alergens: ['gluten', 'ous'], variants: [{ id: 'barra', nom: 'Pa de barra', cents: 350 }] },
  { id: 'croissant', nom: 'Croissant', categoriaId: 'esmorzars', exhaurit: true, alergens: ['gluten', 'ous', 'llet'], variants: [{ id: 'unitat', nom: 'Unitat', cents: 140 }] },
  { id: 'coca', nom: 'Coca de llanda', categoriaId: 'esmorzars', nou: true, alergens: ['gluten', 'ous', 'llet', 'fruits-closca', 'sesam'], variants: [{ id: 'tros', nom: 'Tros', cents: 200 }] },
  { id: 'aigua', nom: 'Aigua', categoriaId: 'begudes', variants: [{ id: 'mitjana', nom: 'Mitjana', cents: 100 }] },
  { id: 'suc', nom: 'Suc de taronja', categoriaId: 'begudes', variants: [{ id: 'got', nom: 'Got', cents: 250 }] },
  { id: 'orxata', nom: 'Orxata', categoriaId: 'begudes', variants: [{ id: 'got', nom: 'Got', cents: 220 }] }
];
const PER_ID_BAR = new Map(PRODUCTES_BAR.map((p) => [p.id, p]));
const valorDe = (p) => (p.variants.length > 1 ? `${p.variants.length} variants` : formatEuros(p.variants[0].cents));

const TIQUETS = [
  { id: 'barra', nom: 'Barra' },
  { id: 'taula-3', nom: 'Taula 3' },
  { id: 'terrassa-2', nom: 'Terrassa 2' }
];
const COMANDES_INICIALS = {
  barra: [{ producteId: 'tallat', varianteId: 'tassa', quantitat: 2 }, { producteId: 'torrada', varianteId: 'racio', quantitat: 1 }],
  'taula-3': [{ producteId: 'cafe-llet', varianteId: 'got', quantitat: 2 }],
  'terrassa-2': []
};

/* Les línies d'una comanda amb la forma de l'esquelet comú, i els cèntims a part. */
function vestix(comanda) {
  return comanda.map((l) => {
    const producte = PER_ID_BAR.get(l.producteId);
    const variant = producte.variants.find((v) => v.id === l.varianteId);
    return {
      id: `${l.producteId}~${l.varianteId}`,
      articleId: producte.id,
      quantitat: l.quantitat,
      nom: producte.nom,
      detall: producte.variants.length > 1 ? variant.nom : undefined,
      valor: formatEuros(variant.cents * l.quantitat),
      cents: variant.cents * l.quantitat
    };
  });
}
const totalDe = (linies) => linies.reduce((suma, l) => suma + l.cents, 0);
const unitatsDe = (linies) => linies.reduce((suma, l) => suma + l.quantitat, 0);

function ModeBar({ marc }) {
  const [comandes, setComandes] = useState(COMANDES_INICIALS);
  const [actiu, setActiu] = useState('barra');
  const [sessio, setSessio] = useState('amb');
  const [connexio, setConnexio] = useState('amb');
  const [obertsObert, setObertsObert] = useState(false);
  const [triant, setTriant] = useState(null);
  const [avis, setAvis] = useState('Toca un producte: una unitat més. «Cafè amb llet» té dues variants i obri la tria.');
  const ambSessio = sessio === 'amb';
  const senseConnexio = connexio === 'sense';
  /* Per ordre d'importància: sense sessió no es ven; sense connexió, sí. */
  const avisos = [
    ambSessio ? null : <span key="sessio">Entra per a vendre.</span>,
    senseConnexio ? <span key="connexio">{AVIS_SENSE_CONNEXIO}</span> : null
  ];
  const linies = vestix(comandes[actiu] || []);
  const total = totalDe(linies);
  const quantitats = new Map();
  for (const l of linies) quantitats.set(l.articleId, (quantitats.get(l.articleId) || 0) + l.quantitat);

  const canvia = (producte, varianteId, delta) => setComandes((totes) => {
    const actuals = totes[actiu] || [];
    const existent = actuals.find((l) => l.producteId === producte.id && l.varianteId === varianteId);
    const noves = existent
      ? actuals.map((l) => (l === existent ? { ...l, quantitat: l.quantitat + delta } : l)).filter((l) => l.quantitat > 0)
      : [...actuals, { producteId: producte.id, varianteId, quantitat: delta }].filter((l) => l.quantitat > 0);
    return { ...totes, [actiu]: noves };
  });

  const articles = PRODUCTES_BAR.map((p) => {
    let estat = 'normal';
    if (p.exhaurit) estat = 'desactivat';
    else if (quantitats.has(p.id)) estat = 'en-colleccio';
    /* La insígnia numèrica porta el seu text per al lector; «Nou» ja es llig sol. */
    let insignia = null;
    if (quantitats.has(p.id)) insignia = { insignia: String(quantitats.get(p.id)), insigniaLector: `${textUnitats(quantitats.get(p.id))} al tiquet` };
    else if (p.nou) insignia = { insignia: 'Nou' };
    return {
      id: p.id,
      nom: p.nom,
      categoriaId: p.categoriaId,
      valor: valorDe(p),
      ...(senseConnexio && p.id === 'orxata' ? { imatge: FOTO_QUE_FALLA } : {}),
      ...(p.exhaurit ? { secundari: 'Esgotat' } : {}),
      ...(p.alergens ? { alergens: p.alergens } : {}),
      ...insignia,
      estat
    };
  });

  return (
    <div role="group" aria-label="Mode Bar">
      <PillToggle etiqueta="Sessió de mostra" valor={sessio} onCanvi={setSessio} opcions={SESSIONS} />
      <PillToggle etiqueta="Connexió de mostra" valor={connexio} onCanvi={setConnexio} opcions={CONNEXIONS} />
      <div className={marc}>
        <UniversalTPV
          etiqueta="TPV de mostra · Mode Bar"
          marca={{ nom: 'Bar de mostra' }}
          avis={avisos}
          tiquet={{
            titol: 'Tiquet',
            nom: TIQUETS.find((t) => t.id === actiu).nom,
            comptador: unitatsDe(linies),
            linies,
            total: linies.length ? { etiqueta: 'Total', valor: formatEuros(total) } : null,
            resum: linies.length ? [{ etiqueta: 'IVA inclòs (10 %)', valor: formatEuros(Math.round(total - total / 1.1)) }] : [],
            buit: { titol: 'El tiquet és buit', text: 'Toca un producte per a afegir-lo.' },
            /* Sense sessió no s'escriu: les línies no són botons, com al TPV del Bar. */
            ...(ambSessio ? {
              onEdita: (linia) => {
                const [producteId, varianteId] = linia.id.split('~');
                canvia(PER_ID_BAR.get(producteId), varianteId, -1);
                setAvis(`Una unitat menys: ${linia.nom}. En l’app, tocar una línia obri el detall (variant, nota, descompte).`);
              }
            } : {})
          }}
          accions={{
            secundaria: {
              text: 'Tiquets oberts',
              comptador: TIQUETS.filter((t) => (comandes[t.id] || []).length > 0).length,
              desactivada: !ambSessio,
              onClick: () => setObertsObert(true)
            },
            principal: {
              text: 'Cobra',
              valor: formatEuros(total),
              desactivada: !ambSessio || linies.length === 0,
              onClick: () => {
                setAvis(`Cobrament de mostra: ${formatEuros(total)}. No s’ha cobrat res.`);
                setComandes((totes) => ({ ...totes, [actiu]: [] }));
              }
            }
          }}
          cataleg={{
            titol: 'Productes',
            categories: CATEGORIES_BAR,
            articles,
            onTria: (article) => {
              const producte = PER_ID_BAR.get(article.id);
              if (producte.variants.length > 1) {
                setTriant(producte);
                return;
              }
              canvia(producte, producte.variants[0].id, 1);
              setAvis(`Una unitat més: ${producte.nom}.`);
            },
            onDetall: (article) => setAvis(`Detall de ${article.nom}: en l’app, el DetallArticle (variants, quantitat i nota).`),
            desactivat: !ambSessio,
            textosEstat: { 'en-colleccio': 'A la comanda' },
            buit: { titol: 'La carta és buida' }
          }}
          oberts={{
            obert: obertsObert,
            onTanca: () => setObertsObert(false),
            titol: 'Tiquets oberts',
            elements: TIQUETS.map((t) => {
              const delTiquet = vestix(comandes[t.id] || []);
              return { id: t.id, nom: t.nom, detall: textLinies(delTiquet.length), valor: formatEuros(totalDe(delTiquet)), actiu: t.id === actiu };
            }),
            onTria: (element) => {
              setActiu(element.id);
              setAvis(`Tiquet actiu: ${element.nom}.`);
            },
            nou: {
              text: 'Tiquet nou',
              onClick: () => {
                setObertsObert(false);
                setAvis('Tiquet nou: en l’app, una taula de la sala o «Per emportar».');
              }
            }
          }}
          tria={{
            obert: triant !== null,
            onTanca: () => setTriant(null),
            titol: triant ? triant.nom : '',
            descripcio: 'Un toc tria la variant, l’afig al tiquet i tanca.',
            opcions: triant ? triant.variants.map((v) => ({ id: v.id, nom: v.nom, valor: formatEuros(v.cents) })) : [],
            onTria: (opcio) => {
              canvia(triant, opcio.id, 1);
              setAvis(`Una unitat més: ${triant.nom} (${opcio.nom}).`);
            }
          }}
        />
      </div>
      <p role="status">{avis}</p>
    </div>
  );
}

/* ── MODE REBOST ───────────────────────────────────────────────────── */
const CATEGORIES_REBOST = [
  { id: 'fruita', nom: 'Fruita i verdura', icona: Carrot, visible: true, ordre: 0 },
  { id: 'lactics', nom: 'Làctics i ous', icona: Milk, visible: true, ordre: 1 },
  { id: 'neteja', nom: 'Neteja', icona: SprayCan, visible: true, ordre: 2 }
];

/* Sense preus: el valor és la presentació que es compra. A casa els al·lèrgens
   són opcionals: els làctics i els ous en porten (la Llet és a la llista: la
   marca de la comanda i les icones compartixen la cantonada). */
const PRODUCTES_REBOST = [
  { id: 'tomaques', nom: 'Tomaques', categoriaId: 'fruita', valor: '1 kg' },
  { id: 'creilles', nom: 'Creïlles', categoriaId: 'fruita', valor: '2 kg' },
  { id: 'cebes', nom: 'Cebes', categoriaId: 'fruita', valor: '1 kg' },
  { id: 'pomes', nom: 'Pomes', categoriaId: 'fruita', valor: '1 kg' },
  { id: 'llet', nom: 'Llet', categoriaId: 'lactics', valor: '6 u', alergens: ['llet'] },
  { id: 'iogurts', nom: 'Iogurts naturals', categoriaId: 'lactics', valor: '4 u', alergens: ['llet'] },
  { id: 'formatge', nom: 'Formatge fresc', categoriaId: 'lactics', valor: '250 g', alergens: ['llet'] },
  { id: 'ous', nom: 'Ous', categoriaId: 'lactics', valor: '12 u', alergens: ['ous'] },
  { id: 'sabo', nom: 'Sabó de rentar', categoriaId: 'neteja', valor: '1 u' },
  { id: 'paper', nom: 'Paper de cuina', categoriaId: 'neteja', valor: '2 u' }
];
const PER_ID_REBOST = new Map(PRODUCTES_REBOST.map((p) => [p.id, p]));

const LLISTES = [
  { id: 'casa', nom: 'Casa' },
  { id: 'mercat', nom: 'Mercat del dijous' },
  { id: 'rebost', nom: 'Rebost de l’hivern' }
];

function ModeRebost({ marc }) {
  const [seleccio, setSeleccio] = useState([{ id: 'llet', quantitat: 1 }]);
  const [llista, setLlista] = useState('casa');
  const [obertes, setObertes] = useState(false);
  const [avis, setAvis] = useState('Toca un article per a posar-lo a la llista; «Afig a la llista» l’hi desa.');
  const nomLlista = LLISTES.find((l) => l.id === llista).nom;
  const unitats = seleccio.reduce((suma, s) => suma + s.quantitat, 0);
  const canvia = (id, delta) => setSeleccio((actual) => {
    const existent = actual.find((s) => s.id === id);
    const nova = existent ? actual.map((s) => (s.id === id ? { ...s, quantitat: s.quantitat + delta } : s)) : [...actual, { id, quantitat: delta }];
    return nova.filter((s) => s.quantitat > 0);
  });
  const enLlista = new Map(seleccio.map((s) => [s.id, s.quantitat]));
  const articles = PRODUCTES_REBOST.map((p) => ({ ...p, estat: enLlista.has(p.id) ? 'en-colleccio' : 'normal' }));
  const linies = seleccio.map((s) => {
    const producte = PER_ID_REBOST.get(s.id);
    return { id: s.id, articleId: s.id, quantitat: s.quantitat, nom: producte.nom, valor: producte.valor };
  });

  return (
    <div role="group" aria-label="Mode Rebost">
      <div className={marc}>
        <UniversalTPV
          etiqueta="TPV de mostra · Mode Rebost"
          marca={{ nom: 'Casa de mostra' }}
          tiquet={{
            titol: 'Llista',
            nom: nomLlista,
            comptador: unitats,
            linies,
            resum: linies.length ? [{ etiqueta: 'Per a la llista', valor: nomLlista }, { etiqueta: 'Unitats', valor: String(unitats) }] : [],
            buit: { titol: 'La llista és buida', text: 'Toca un article del rebost per a afegir-lo.', icona: ShoppingBasket },
            onEdita: (linia) => {
              canvia(linia.id, -1);
              setAvis(`Una unitat menys: ${linia.nom}.`);
            }
          }}
          accions={{
            secundaria: { text: 'Llistes', comptador: LLISTES.length, onClick: () => setObertes(true) },
            principal: {
              text: 'Afig a la llista',
              desactivada: linies.length === 0,
              onClick: () => {
                setAvis(`Afegits ${textLinies(linies.length)} a la llista «${nomLlista}» (mostra): no s’ha desat res.`);
                setSeleccio([]);
              }
            }
          }}
          cataleg={{
            titol: 'Articles',
            categories: CATEGORIES_REBOST,
            articles,
            etiquetaCerca: 'Busca un article',
            onTria: (article) => {
              canvia(article.id, 1);
              setAvis(`A la llista: ${article.nom}.`);
            },
            textosEstat: { 'en-colleccio': 'A la llista' },
            buit: { titol: 'El rebost és buit' }
          }}
          oberts={{
            obert: obertes,
            onTanca: () => setObertes(false),
            titol: 'Llistes',
            elements: LLISTES.map((l) => ({ ...l, actiu: l.id === llista })),
            onTria: (element) => {
              setLlista(element.id);
              setAvis(`Llista activa: ${element.nom}.`);
            }
          }}
        />
      </div>
      <p role="status">{avis}</p>
    </div>
  );
}

export default function EspecimenUniversalTPV() {
  const [mida, setMida] = useState('ample');
  const marc = mida === 'estret' ? 'sdp-tpv-marc sdp-tpv-marc--estret' : 'sdp-tpv-marc';
  return (
    <Especimen id="universal-tpv" nom="UniversalTPV" fitxer="src/components/PedraSeca/organismes/UniversalTPV.jsx"
      descripcio="L’estructura de Loyverse amb la pell de Pedra Seca: el tiquet a l’esquerra (la marca, les línies, el resum, el total i la barra d’accions partida) i, a la dreta, les pastilles de categoria, la cerca i la graella densa de rajoles quadrades on mana la imatge. Una sola peça per a dues intel·ligències: el Bar cobra i el Rebost omple la llista. La peça mesura la seua amplada: per davall de 46em és una columna amb la barra dalt i les pestanyes «Productes» i «Tiquet». Només fan scroll les línies i la graella."
      contracte={[
        ['etiqueta', 'string', '—', 'Obligatori. El nom de la regió (p. ex. «TPV de La Parròquia»).'],
        ['marca', '{ nom, logotip? } | null', 'null', 'La capçalera del tiquet: el logotip 1:1 o, sense (o si no es pot carregar), les inicials sobre el taronja de marca.'],
        ['avis', 'node | node[] | null', 'null', 'La franja damunt del tiquet: sessió («Entra per a vendre»), torn, mode emportar… Una llista va per ordre d’importància: en el mòbil, només el primer va fora de les pestanyes; la resta, a la del tiquet.'],
        ['tiquet', '{ titol, nom?, comptador?, linies, total?, resum?, buit, onEdita?, textosEstat? }', '—', 'Les línies de l’esquelet comú. nom diu quin tiquet o quina llista és («Taula 3»); comptador, les unitats. Amb onEdita, cada línia és un botó; una d’anul·lada es ratlla i ho diu amb text.'],
        ['accions', '{ secundaria?: { text, comptador?, onClick, desactivada? }, principal: { text, valor?, onClick, desactivada? } }', '—', 'La barra partida 50/50: «Tiquets oberts» o «Llistes» | «Cobra» amb el total o «Afig a la llista».'],
        ['cataleg', '{ titol?, categories, articles, textTotes?, etiquetaCerca?, onTria, onDetall?, desactivat?, textosEstat?, buit, textCategoriaBuida? }', '—', 'El toc crida onTria; la pulsació llarga, el botó dret o Maj+F10, onDetall. La categoria i la cerca (sense accents) són estat de la peça. Una categoria sense articles ho diu (no és la carta buida). insigniaLector dona a la insígnia el seu text per al lector. La foto d’un article que no es pot carregar torna a la marca (icona i inicials). alergens (ids de la llista canònica) pinta les icones d’al·lèrgens a dalt a l’esquerra de la rajola, com a molt 4 peces (fins a 4 icones o 3 i «+N»), i el nom del botó hi afig «, conté …».'],
        ['oberts', '{ obert, onTanca, titol, elements, onTria, nou?, buit? } | null', 'null', 'El diàleg dels tiquets oberts o de les llistes: botons grans, l’actiu amb aria-current.'],
        ['tria', '{ obert, onTanca, titol, descripcio?, opcions, onTria } | null', 'null', 'El diàleg menut d’una sola tria (variants, modificador obligatori).'],
        ['onTanca(motiu)', "'tria' | 'esc' | 'vel' | 'boto'", '—', 'Als dos diàlegs, un toc tria i tanca: onTria(opció) i després onTanca(\'tria\'). La resta de motius cancel·len.']
      ]}
      a11y={[
        'Una regió amb nom; el tiquet i el catàleg també ho són. La graella és una llista i les línies, una llista ordenada.',
        'Cada rajola és un botó natiu amb el nom «Nom, valor» i l’estat en text («A la comanda»), mai només la vora de color. El detall s’obri també amb el botó dret o Maj+F10.',
        'Els al·lèrgens es diuen al nom de la rajola («Tallat, 1,30 €, A la comanda, conté llet»), tots, també els del «+N»; les icones de la cantonada són aria-hidden i no es lligen dues vegades.',
        'Cap control fa menys de --sdp-touch; el focus es veu amb --sdp-focus. El total és text llegible.',
        'Un missatge d’estat (role="status") anuncia les unitats del tiquet quan canvien, també amb la pestanya del tiquet amagada.',
        'Sense cap control actiu (sense sessió), la graella i les línies reben el focus per a fer scroll amb el teclat. La cerca és una fita amb nom.',
        'En el mòbil, les pestanyes són el patró WAI-ARIA de Pestanyes (fletxes, Inici i Fi).'
      ]}
      fes={[
        'Passar els articles, les categories i les línies ja vestits (articlesDeCarta, categoriesVestides, liniesVestides): la peça no sap de cèntims.',
        'Donar-li un contenidor amb alçada (la columna de l’Espai de Treball, o .sdp-tpv-marc fora d’ell).',
        'Decidir a l’app què fa cada toc: afegir una unitat, obrir la tria o el detall.',
        'Passar els al·lèrgens de cada producte (alergens, ids de la llista canònica) quan en té: la rajola els pinta i els diu. Sense, la rajola de sempre.',
        'Dir a l’avís que no hi ha xarxa («Sense connexió: cada venda es desa en este dispositiu.»): la peça no en sap res, però no en depén per a pintar. La foto o el logotip que no carreguen tornen sols a la marca o a les inicials, sense imatge trencada ni salt de disposició.'
      ]}
      noFacis={[
        'Copiar els colors de Loyverse: l’acció principal és el blau de control i la secundària, el taronja de marca.',
        'Fer una graella o un tiquet propis a l’app: és esta peça.',
        'Passar-li sessions, tokens o la persona: només rep el que pinta (la marca i si es pot vendre).'
      ]}>
      <PillToggle etiqueta="Mida de la mostra" valor={mida} onCanvi={setMida} opcions={MIDES} />
      <h4>Mode Bar</h4>
      <ModeBar marc={marc} />
      <h4>Mode Rebost</h4>
      <ModeRebost marc={marc} />
    </Especimen>
  );
}
