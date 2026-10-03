// @vitest-environment node
/* La Nevera de Casa · l'importador de productes de botiga: el CSV, la llista
   blanca de columnes, la neteja, el mapatge de seccions i els ids. Un full
   sintètic amb la forma del de la botiga (BOM, CRLF, cometes) i, a les
   columnes que no s'han de llegir mai, una ruta de disc i un enllaç falsos.
   Els patrons vetats es componen a trossos perquè les portes que llegixen
   src/ no els troben ací. */
import { describe, expect, test } from 'vitest';
import { MAPA_SECCIONS, centimsEs, importaProductes, nombreEs, seccioDe, slug } from './importador.js';
import { CATEGORIES, ID_PROPIS } from './nucli/index.js';

const RUTA_FALSA = ['/Us', 'ers/persona-inventada/Fotos/Llista/CATEGORIA.png'].join('');
const URL_FALSA = ['ht', 'tps:', '//botiga.invalid/imatges/ab12.jpg?fit=crop&h=600&w=600'].join('');
const CAPCALERA = ['Categoria', 'Imatge', 'Marca', 'Producte', 'Envàs', 'Quant', 'g-l', 'Preu', 'PreuU', 'U', '/', 'kg-l', 'ImgUrl', 'TitolCat'];
/* Les columnes que no es lligen porten valors que no han d'aparéixer mai en el resultat. */
const producte = (categoria, marca, nom, envas, quant, unitat, preu) => [
  categoria, 'IMATGE-SECRETA', marca, nom, envas, quant, unitat, preu, 'PREUU-SECRET', 'U-SECRET', '/', 'KGL-SECRET', URL_FALSA, 'TITOL-SECRET'
];
const capcaleraDeCategoria = (categoria, titol) => [categoria, '', '', '', '', '', '', '', '', '', '', '', RUTA_FALSA, titol];

const FILES = [
  CAPCALERA,
  capcaleraDeCategoria('Aceite, especias y salsas', 'ACEITE, ESPECIAS Y SALSAS'),
  producte('Aceite, especias y salsas', 'Marca Blanca', 'Ketchup', 'Bote', '600', 'g', '1,30 €'),
  producte('Aceite, especias y salsas', 'Marca "Bona"', 'Salsa "casolana", suau', 'Tarro', '290', 'g', '1,50 €'),
  capcaleraDeCategoria('', 'BODEGA'),
  producte('Bodega', 'Celler', 'Cerveza rubia', '12 latas de 33 cl', '3,96', 'l', '3,72 €'),
  producte('Charcutería y quesos', 'Formatgeria', 'Queso tierno de vaca', 'Pieza', '1.540', 'g', '14,48 €'),
  producte('Charcutería y quesos', 'Carnisseria', 'Salchichas Viena queso pollo', '2 paquetes x 200 g', '400', 'g', '1,40 €'),
  producte('Charcutería y quesos', 'Formatgeria', 'Requesón mezcla', 'Tarrina', '200', 'g', '1,00 €'),
  producte('Conservas, caldos y cremas', 'Marca Blanca', 'Tomate frito', 'Bote', '400', 'g', '0,72 €'),
  producte('Conservas, caldos y cremas', 'Marca Blanca', 'Tomate  frito ', '3 bricks x 400 g', '1.200', 'g', '1,40 €'),
  Array(14).fill(''),
  producte('Pizzas y platos preparados', 'Marca Blanca', 'PRECIO MEDIO PIZZAS: 6 -7 €', 'Bandeja', '550', 'g', '3,50 €'),
  producte('Pizzas y platos preparados', 'Marca Blanca', 'Chili  con carne (en Aceite, especias y salsas) ', 'Bote', '420', 'g', '2,65 €'),
  producte('Huevos, leche y mantequilla', 'Granja', 'Llet', 'Brik', '1', 'l', '0,95 €'),
  producte('Fruta y verdura', 'Hort', 'Sandía', 'Pieza', '7.110', 'g', '15,57 €'),
  producte('Fruta y verdura', 'Hort', 'Peras', 'Bandeja', '1500', 'g', '1.234,50 €'),
  producte('Ferretería', 'Ferro', 'Martell', 'Caixa', '1', 'u', '9,99 €')
];

const ESPERATS = [
  ['mer-ketchup', 'Ketchup', 'ingredients-especies', 'Marca Blanca', 'Bote', 600, 'g', 130],
  ['mer-salsa-casolana-suau', 'Salsa "casolana", suau', 'ingredients-especies', 'Marca "Bona"', 'Tarro', 290, 'g', 150],
  ['mer-cerveza-rubia', 'Cerveza rubia', 'begudes', 'Celler', '12 latas de 33 cl', 3.96, 'l', 372],
  ['mer-queso-tierno-de-vaca', 'Queso tierno de vaca', 'llet-formatge', 'Formatgeria', 'Pieza', 1540, 'g', 1448],
  ['mer-salchichas-viena-queso-pollo', 'Salchichas Viena queso pollo', 'carn-peix', 'Carnisseria', '2 paquetes x 200 g', 400, 'g', 140],
  ['mer-requeson-mezcla', 'Requesón mezcla', 'llet-formatge', 'Formatgeria', 'Tarrina', 200, 'g', 100],
  ['mer-tomate-frito-400-g', 'Tomate frito · 400 g', 'ingredients-especies', 'Marca Blanca', 'Bote', 400, 'g', 72],
  ['mer-tomate-frito-1200-g', 'Tomate frito · 1200 g', 'ingredients-especies', 'Marca Blanca', '3 bricks x 400 g', 1200, 'g', 140],
  ['mer-chili-con-carne', 'Chili con carne', 'congelats', 'Marca Blanca', 'Bote', 420, 'g', 265],
  ['mer-llet-1-l', 'Llet · 1 l', 'llet-formatge', 'Granja', 'Brik', 1, 'l', 95],
  ['mer-sandia', 'Sandía', 'fruita-verdura', 'Hort', 'Pieza', 7110, 'g', 1557],
  ['mer-peras', 'Peras', 'fruita-verdura', 'Hort', 'Bandeja', 1500, 'g', 123450]
];
const AVISOS = [
  'Fila 13: «PRECIO MEDIO PIZZAS: 6 -7 €» és una nota, no un producte: no s’importa.',
  'Fila 18: la categoria «Ferretería» no té secció a la Nevera: «Martell» no s’importa.'
];

/* Un CSV RFC 4180: entre cometes (doblades) el camp que porta el separador, cometes o salts. */
function csvDe(files, { separador = ',', salt = '\r\n', bom = true } = {}) {
  const camp = (valor) => (/[",;\r\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor);
  return `${bom ? '\u{FEFF}' : ''}${files.map((fila) => fila.map(camp).join(separador)).join(salt)}${salt}`;
}

describe('importaProductes sobre un full sintètic', () => {
  test('BOM, CRLF, cometes i comes: llig la llista blanca, salta capçaleres i files buides, i avisa de la nota i de la categoria desconeguda', () => {
    expect(importaProductes(csvDe(FILES))).toEqual({ productes: ESPERATS, avisos: AVISOS });
  });

  test('privacitat: cap ruta de disc, cap enllaç i cap valor de les columnes que no es lligen', () => {
    const serialitzat = JSON.stringify(importaProductes(csvDe(FILES)));
    for (const vetat of [['/Us', 'ers/'].join(''), ['ht', 'tp'].join(''), '.invalid', '.png', '.jpg', 'SECRET', '/']) {
      expect(serialitzat.includes(vetat), vetat).toBe(false);
    }
  });

  test('busca les columnes pel nom: l’ordre de les columnes no canvia res', () => {
    const ordre = CAPCALERA.map((_, i) => i).reverse();
    const girades = FILES.map((fila) => ordre.map((i) => fila[i] ?? ''));
    expect(importaProductes(csvDe(girades)).productes).toEqual(ESPERATS);
  });

  test('també el CSV d’un full en castellà (punt i coma, LF, sense BOM) i els bytes del fitxer', () => {
    expect(importaProductes(csvDe(FILES, { separador: ';', salt: '\n', bom: false })).productes).toEqual(ESPERATS);
    const bytes = new TextEncoder().encode(csvDe(FILES));
    const copia = bytes.slice();
    expect(importaProductes(bytes).productes).toEqual(ESPERATS);
    expect(bytes).toEqual(copia);
  });

  test('determinista: dues passades donen el mateix', () => {
    expect(importaProductes(csvDe(FILES))).toEqual(importaProductes(csvDe(FILES)));
  });

  test('ids: prefix, patró de la URL, 64 caràcters com a molt i únics encara que el slug coincidisca', () => {
    const llarg = 'Nom de producte molt llarg amb moltes paraules que no acaben mai i encara més';
    const unic = 'Un altre nom de producte molt llarg que passa de seixanta caràcters de llarg';
    const files = [
      CAPCALERA,
      producte('Zumos', 'Font', 'Pa-Pa', 'Brik', '1', 'l', '1,00 €'),
      producte('Zumos', 'Font', 'Pa Pa', 'Brik', '1', 'l', '1,00 €'),
      producte('Zumos', 'Font', llarg, 'Brik', '1', 'l', '1,00 €'),
      producte('Zumos', 'Font', `${llarg} bis`, 'Brik', '1', 'l', '1,00 €'),
      producte('Zumos', 'Font', '¡¡!!', 'Brik', '1', 'l', '1,00 €'),
      producte('Zumos', 'Font', unic, 'Brik', '1', 'l', '1,00 €')
    ];
    const { productes } = importaProductes(csvDe(files));
    const ids = productes.map(([id]) => id);
    expect(ids.slice(0, 2)).toEqual(['mer-pa-pa', 'mer-pa-pa-2']);
    expect(ids[4]).toBe('mer-producte');
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id, id).toMatch(/^[a-z0-9][a-z0-9_-]{0,63}$/);
      expect(id.startsWith('mer-'), id).toBe(true);
    }
    expect(ids[5]).toHaveLength(64);
    /* Un nom llarg es retalla a 60; dos que llavors coincidixen porten la quantitat i, si cal, un número. */
    expect(productes[5][1]).toBe('Un altre nom de producte molt llarg que passa de seixanta ca');
    expect(productes[2][1]).toBe('Nom de producte molt llarg amb moltes paraules que no · 1 l');
    expect(productes[3][1]).toBe('Nom de producte molt llarg amb moltes paraules que · 1 l · 2');
    expect(importaProductes(csvDe(files), { prefix: 'bot' }).productes[0][0]).toBe('bot-pa-pa');
  });

  test('mai llança: una entrada que no s’entén torna cap producte i un avís', () => {
    for (const entrada of [null, undefined, 42, {}, [], '', 'brossa sense capçalera', 'Marca,Preu\nX,1']) {
      const resultat = importaProductes(entrada);
      expect(resultat.productes, String(entrada)).toEqual([]);
      expect(resultat.avisos, String(entrada)).toHaveLength(1);
    }
    expect(importaProductes(csvDe([CAPCALERA]))).toEqual({ productes: [], avisos: [] });
    expect(importaProductes(csvDe(FILES), { prefix: 'Mer!' }).productes).toEqual([]);
    expect(importaProductes(csvDe(FILES), null).productes).toEqual(ESPERATS);
  });

  test('un preu o una quantitat que no s’entenen: el producte es guarda sense ells i se n’avisa', () => {
    const { productes, avisos } = importaProductes(csvDe([CAPCALERA, producte('Zumos', 'Font', 'Suc', 'Brik', 'molt', 'l', 'barat')]));
    expect(productes).toEqual([['mer-suc', 'Suc', 'begudes', 'Font', 'Brik', null, 'l', null]]);
    expect(avisos).toEqual([
      'Fila 2: la quantitat de «Suc» no s’entén: es guarda sense quantitat.',
      'Fila 2: el preu de «Suc» no s’entén: es guarda sense preu.'
    ]);
  });
});

describe('regenerar un tall: els ids publicats no canvien mai', () => {
  const sensePublicats = (avisos) => avisos.filter((avis) => !avis.includes('publicat'));

  test('el mateix full sobre el tall publicat dona el mateix, sense cap avís més', () => {
    expect(importaProductes(csvDe(FILES), { publicats: ESPERATS })).toEqual({ productes: ESPERATS, avisos: AVISOS });
  });

  test('un homònim nou (davant al full) no reanomena el publicat: conserva l’id i el nou va darrere', () => {
    const ambHomonim = [FILES[0], producte('Aceite, especias y salsas', 'Altra', 'Ketchup', 'Bote', '1', 'kg', '2,10 €'), ...FILES.slice(1)];
    /* Sense el tall publicat, el Ketchup d'abans canviaria d'id: és el que s'evita. */
    expect(importaProductes(csvDe(ambHomonim)).productes.slice(0, 2).map(([id]) => id)).toEqual(['mer-ketchup-1-kg', 'mer-ketchup-600-g']);
    const { productes, avisos } = importaProductes(csvDe(ambHomonim), { publicats: ESPERATS });
    expect(productes.map(([id]) => id)).toEqual([...ESPERATS.map(([id]) => id), 'mer-ketchup-1-kg']);
    expect(productes[0]).toEqual(['mer-ketchup', 'Ketchup · 600 g', 'ingredients-especies', 'Marca Blanca', 'Bote', 600, 'g', 130]);
    expect(productes.slice(1, ESPERATS.length)).toEqual(ESPERATS.slice(1));
    expect(productes[ESPERATS.length]).toEqual(['mer-ketchup-1-kg', 'Ketchup · 1 kg', 'ingredients-especies', 'Altra', 'Bote', 1, 'kg', 210]);
    expect(avisos).toEqual(sensePublicats(avisos));
  });

  test('un article de base nou amb el nom d’un producte: el nom porta sufix, l’id no canvia', () => {
    /* Un tall d'abans que la base tinguera «Llet». */
    const publicats = ESPERATS.map((fila) => (fila[0] === 'mer-llet-1-l' ? ['mer-llet', 'Llet', ...fila.slice(2)] : fila));
    const { productes } = importaProductes(csvDe(FILES), { publicats });
    expect(productes.map(([id]) => id)).toEqual(publicats.map(([id]) => id));
    expect(productes.find(([id]) => id === 'mer-llet')[1]).toBe('Llet · 1 l');
  });

  test('l’ordre de les files del full no canvia ni els ids ni l’ordre dels publicats', () => {
    const girat = [FILES[0], ...FILES.slice(1).reverse()];
    expect(importaProductes(csvDe(girat), { publicats: ESPERATS }).productes).toEqual(ESPERATS);
  });

  test('dos homònims exactes (mateix nom i quantitat): la marca desfà l’empat, i un canvi de marca no canvia l’id', () => {
    const parell = (primera, segona) => [
      CAPCALERA, producte('Zumos', primera, 'Suc', 'Brik', '1', 'l', '1,00 €'), producte('Zumos', segona, 'Suc', 'Brik', '1', 'l', '1,20 €')
    ];
    const idIMarca = (productes) => productes.map(([id, , , marca]) => [id, marca]);
    const abans = importaProductes(csvDe(parell('Font A', 'Font B'))).productes;
    expect(idIMarca(abans)).toEqual([['mer-suc-1-l', 'Font A'], ['mer-suc-1-l-2', 'Font B']]);
    /* Sense el tall publicat, les files girades s'intercanviarien els ids. */
    expect(idIMarca(importaProductes(csvDe(parell('Font B', 'Font A'))).productes)).toEqual([['mer-suc-1-l', 'Font B'], ['mer-suc-1-l-2', 'Font A']]);
    expect(idIMarca(importaProductes(csvDe(parell('Font B', 'Font A')), { publicats: abans }).productes))
      .toEqual([['mer-suc-1-l', 'Font A'], ['mer-suc-1-l-2', 'Font B']]);
    const marcaNova = [CAPCALERA, ...FILES.slice(1).map((fila) => (fila[3] === 'Ketchup' ? producte('Aceite, especias y salsas', 'Marca Nova', 'Ketchup', 'Bote', '600', 'g', '1,40 €') : fila))];
    expect(importaProductes(csvDe(marcaNova), { publicats: ESPERATS }).productes[0]).toEqual(
      ['mer-ketchup', 'Ketchup', 'ingredients-especies', 'Marca Nova', 'Bote', 600, 'g', 140]
    );
  });

  test('un publicat que ix del full no es conserva: se n’avisa, i cap producte nou n’hereta l’id', () => {
    const full = [...FILES.filter((fila) => fila[3] !== 'Sandía' && fila[3] !== 'Peras'), producte('Fruta y verdura', 'Hort', 'Peras', 'Bandeja', '1', 'kg', '1,99 €')];
    const { productes, avisos } = importaProductes(csvDe(full), { publicats: ESPERATS });
    expect(avisos.filter((avis) => avis.includes('publicat'))).toEqual([
      'El producte publicat «Sandía» (mer-sandia) ja no és al full: les llistes que el porten el perdrien.',
      'El producte publicat «Peras» (mer-peras) ja no és al full: les llistes que el porten el perdrien.'
    ]);
    expect(productes.map(([id]) => id)).toEqual([...ESPERATS.slice(0, -2).map(([id]) => id), 'mer-peras-2']);
  });

  test('un tall publicat que no s’entén s’ignora fila a fila, i mai llança', () => {
    for (const publicats of ['brossa', 42, {}, [null, 7, ['NO VÀLID', 'x'], ['mer-sense-nom'], [['mer-x'], 'x']]]) {
      expect(importaProductes(csvDe(FILES), { publicats }), JSON.stringify(publicats)).toEqual({ productes: ESPERATS, avisos: AVISOS });
    }
    /* Un id repetit al tall publicat només compta la primera vegada: cap id ix dues voltes
       (sense això, la salsa i el ketchup eixirien tots dos amb 'mer-ketchup'). */
    const repetit = [['mer-ketchup', 'Salsa "casolana", suau', 'ingredients-especies', 'Marca "Bona"', 'Tarro', 290, 'g', 150], ...ESPERATS];
    const { productes, avisos } = importaProductes(csvDe(FILES), { publicats: repetit });
    const ids = productes.map(([id]) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(productes.find(([, nom]) => nom === 'Ketchup')[0]).toBe('mer-ketchup-2');
    expect(avisos.filter((avis) => avis.includes('publicat'))).toHaveLength(1);
  });
});

describe('el delimitador', () => {
  test('explícit, el full no depén de la detecció; un delimitador que no és dels admesos no llança', () => {
    const ambPuntIComa = csvDe(FILES, { separador: ';' });
    expect(importaProductes(ambPuntIComa, { delimitador: ';' }).productes).toEqual(ESPERATS);
    expect(importaProductes(csvDe(FILES), { delimitador: ',' }).productes).toEqual(ESPERATS);
    expect(importaProductes(ambPuntIComa, { delimitador: ',' })).toEqual({ productes: [], avisos: ['Falta la columna «Categoria» o «Producte»: cap producte importat.'] });
    expect(importaProductes(csvDe(FILES), { delimitador: '|' })).toEqual({
      productes: [], avisos: ['El delimitador ha de ser «auto», la coma, el punt i coma o el tabulador: cap producte importat.']
    });
  });
});

describe('les peces', () => {
  test('nombreEs: el format espanyol, sense confondre el punt de milers', () => {
    expect([nombreEs('290'), nombreEs('1.540'), nombreEs('7.110'), nombreEs('1500'), nombreEs('3,96'), nombreEs('78,6'), nombreEs(' 1,25 ')])
      .toEqual([290, 1540, 7110, 1500, 3.96, 78.6, 1.25]);
    for (const brossa of ['', '1.5', '1,2,3', 'u', '-3', null, 7]) expect(nombreEs(brossa), String(brossa)).toBeNull();
  });

  test('centimsEs: cèntims exactes, sense coma flotant', () => {
    expect([centimsEs('1,50 €'), centimsEs('0,95 €'), centimsEs('15,57 €'), centimsEs('19,30 €'), centimsEs('1.234,50 €'), centimsEs('2,5'), centimsEs('3 €')])
      .toEqual([150, 95, 1557, 1930, 123450, 250, 300]);
    for (const brossa of ['', 'gratis', '1,505 €', '€', null]) expect(centimsEs(brossa), String(brossa)).toBeNull();
  });

  test('slug: sense accents, minúscules i guionets', () => {
    expect(slug('Salsa de tomate boloñesa')).toBe('salsa-de-tomate-bolonesa');
    expect(slug('Aceite de girasol refinado 0,2º')).toBe('aceite-de-girasol-refinado-0-2o');
    expect(slug('Guacamole 95% aguacate fresco · 500 g')).toBe('guacamole-95-aguacate-fresco-500-g');
    expect(slug('Ensalada de pasta, atún, huevo, surimi, ...')).toBe('ensalada-de-pasta-atun-huevo-surimi');
  });

  test('MAPA_SECCIONS: les 24 categories de la botiga van a seccions que ja existixen', () => {
    const seccions = new Set(CATEGORIES.map((categoria) => categoria.id));
    expect(Object.keys(MAPA_SECCIONS)).toHaveLength(24);
    for (const [categoria, seccio] of Object.entries(MAPA_SECCIONS)) {
      expect(seccions.has(seccio), categoria).toBe(true);
      expect(seccio, categoria).not.toBe(ID_PROPIS);
    }
    expect(MAPA_SECCIONS['Pizzas y platos preparados']).toBe('congelats');
  });

  test('seccioDe: «Charcutería y quesos» es partix pels formatges; la categoria es reconeix sense accents ni majúscules', () => {
    expect(seccioDe('Charcutería y quesos', 'Mousse de queso de vaca')).toBe('llet-formatge');
    expect(seccioDe('Charcutería y quesos', 'Mozzarella fresca de vaca')).toBe('llet-formatge');
    expect(seccioDe('Charcutería y quesos', 'Salchichas Viena queso pollo')).toBe('carn-peix');
    expect(seccioDe('CHARCUTERIA Y QUESOS', 'Queso fresco')).toBe('llet-formatge');
    expect(seccioDe('Fruta y verdura', 'Queso')).toBe('fruita-verdura');
    expect(seccioDe('Ferretería', 'Martell')).toBeNull();
  });

  test('seccioDe: azúcar i harina van amb «Sucre» i «Farina», i galletas amb «Galetes»; la resta de la categoria, no', () => {
    expect(seccioDe('Azúcar, caramelos y chocolate', 'Azúcar moreno')).toBe('ingredients-especies');
    expect(seccioDe('Azúcar, caramelos y chocolate', 'Caramelos de menta')).toBe('picar-dolcos');
    expect(seccioDe('Panadería y pastelería', 'Harina de trigo')).toBe('ingredients-especies');
    expect(seccioDe('Panadería y pastelería', 'Pan de molde')).toBe('pa-pastissos');
    expect(seccioDe('Cereales y galletas', 'Galletas de avena')).toBe('picar-dolcos');
    expect(seccioDe('Cereales y galletas', 'Copos de avena')).toBe('cereals-pasta');
    expect(seccioDe('Fruta y verdura', 'Harina de castaña')).toBe('fruita-verdura');
  });
});
