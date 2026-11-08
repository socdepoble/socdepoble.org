/**
 * fitxaDidactica.js — P0-59 / IDEA-190 · la fitxa del Banc de Llavors desplegada a la pàgina (sense finestra
 * emergent): la barra dels 12 mesos (G F M A M J J A S O N D) i els valors nutricionals de referència.
 * JS pur, sense dependències: el pinta BancLlavorsSection.jsx.
 *
 * LA BARRA. Rep el `calendari` d'una varietat ({ sembra, plantacio, collita, maduracioLlavors }, mesos 1..12,
 * i `sembraDirecta` on la llegenda del PDF ho diu) i torna els dotze mesos amb les fases de cadascun. Sense
 * calendari, cap mes actiu: la secció no la pinta. Les etiquetes són les de la llegenda del Catàleg valencià
 * (Sembra o Sembra directa, Trasplantament, Recol·lecció, Maduració llavors): les posa BancLlavorsSection amb tr().
 *
 * LA NUTRICIÓ. Valors de REFERÈNCIA per 100 g d'un aliment de l'USDA FoodData Central (SR Legacy), copiats
 * literalment del registre FDC que diu cada perfil, no de la font del catàleg. Es casa NOMÉS pel nom científic
 * binomial (gènere + espècie) de la font, mai per paraules del nom. Una espècie que no és a
 * ESPECIES_AMB_REFERENCIA no porta cap bloc de nutrició.
 */

export const MESOS_CURTS_CA = Object.freeze(['G', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']);

export const NOMS_MESOS_CA = Object.freeze([
  'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
  'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'
]);

/* La collita porta un símbol neutre, el mateix per a tots els cultius. */
export const FASES_CALENDARI = Object.freeze([
  Object.freeze({ id: 'sembra', simbol: '🌱' }),
  Object.freeze({ id: 'plantacio', simbol: '🌿' }),
  Object.freeze({ id: 'collita', simbol: '🧺' }),
  Object.freeze({ id: 'maduracioLlavors', simbol: '🌾' })
]);

const congela = (valor) => {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    for (const fill of Object.values(valor)) congela(fill);
    Object.freeze(valor);
  }
  return valor;
};

/* Perfils per 100 g: literals dels registres USDA FoodData Central SR Legacy (`fdc`, `aliment` = descripció del
   registre). Cap altre aliment ni cap altra xifra. */
export const TAULA_NUTRICIONAL = congela({
  alberginia: {
    fdc: 169228, aliment: 'Eggplant, raw', kcal100g: 25, aiguaG: 92.3, fibraG: 3,
    vitaminesMinerals: 'Potassi (229 mg), vitamina B6 (0,084 mg), vitamina C (2,2 mg), folats (22 µg)'
  },
  tomaca: {
    fdc: 170457, aliment: 'Tomatoes, red, ripe, raw, year round average', kcal100g: 18, aiguaG: 94.52, fibraG: 1.2,
    vitaminesMinerals: 'Vitamina C (13,7 mg), vitamina A (42 µg), potassi (237 mg), vitamina K (7,9 µg)'
  },
  sindria: {
    fdc: 167765, aliment: 'Watermelon, raw', kcal100g: 30, aiguaG: 91.45, fibraG: 0.4,
    vitaminesMinerals: 'Vitamina C (8,1 mg), vitamina A (28 µg), potassi (112 mg)'
  },
  ceba: {
    fdc: 170000, aliment: 'Onions, raw', kcal100g: 40, aiguaG: 89.11, fibraG: 1.7,
    vitaminesMinerals: 'Vitamina C (7,4 mg), vitamina B6 (0,12 mg), potassi (146 mg)'
  },
  encisam: {
    fdc: 169249, aliment: 'Lettuce, green leaf, raw', kcal100g: 15, aiguaG: 94.98, fibraG: 1.3,
    vitaminesMinerals: 'Vitamina K (126,3 µg), vitamina A (370 µg), folats (38 µg)'
  },
  pastanaga: {
    fdc: 170393, aliment: 'Carrots, raw', kcal100g: 41, aiguaG: 88.29, fibraG: 2.8,
    vitaminesMinerals: 'Vitamina A (835 µg), vitamina K (13,2 µg), potassi (320 mg)'
  }
});

/* Espècie (gènere + espècie, en minúscules i sense autor) → perfil de referència. Res més casa. */
export const ESPECIES_AMB_REFERENCIA = Object.freeze({
  'solanum melongena': 'alberginia',
  'solanum lycopersicum': 'tomaca',
  'lycopersicon esculentum': 'tomaca',
  'citrullus lanatus': 'sindria',
  'allium cepa': 'ceba',
  'lactuca sativa': 'encisam',
  'daucus carota': 'pastanaga'
});

/** El binomi d'un nom científic: «Lycopersicon esculentum Mill.» → «lycopersicon esculentum». */
export function binomiDe(nomCientific) {
  const paraules = String(nomCientific || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  return paraules.length >= 2 ? `${paraules[0]} ${paraules[1]}` : '';
}

/** Els valors de referència d'una entrada (pel seu nom científic), o null si l'espècie no en té. */
export function nutricioDe(entrada) {
  const clau = ESPECIES_AMB_REFERENCIA[binomiDe(entrada?.nomCientific)];
  return clau ? TAULA_NUTRICIONAL[clau] : null;
}

const netejaMesos = (llista) =>
  Array.isArray(llista)
    ? [...new Set(llista.map(Number).filter((m) => Number.isInteger(m) && m >= 1 && m <= 12))]
    : [];

/** Els dotze mesos (1..12) amb les fases actives, per a pintar la barra G..D d'un colp d'ull. */
export function barra12MesosDe(calendari = null) {
  const fases = FASES_CALENDARI.map((fase) => [fase.id, new Set(netejaMesos(calendari?.[fase.id]))]);
  return congela(MESOS_CURTS_CA.map((inicial, idx) => {
    const mes = idx + 1;
    const actives = fases.filter(([, mesos]) => mesos.has(mes)).map(([id]) => id);
    return { mes, inicial, nomMes: NOMS_MESOS_CA[idx], fases: actives, actiu: actives.length > 0 };
  }));
}

/** Les fases que porten algun mes al calendari, en l'ordre de FASES_CALENDARI (la llegenda de la varietat). */
export function fasesAmbMesos(calendari = null) {
  return FASES_CALENDARI.filter((fase) => netejaMesos(calendari?.[fase.id]).length > 0);
}

/** Un decimal amb coma: 94.5 → «94,5». */
export const ambComa = (valor) => String(valor).replace('.', ',');
