/**
 * T61 (decisió del Mestre, 260928) · Contracte de les `subrutes` de T27.
 * NavLink encén una entrada quan la ruta actual és igual a la ruta declarada o
 * hi comença seguida de '/' (app/contexts/RouterContext.jsx, NavLink). Per això
 * la dada mana: una ruta declarada ací s'encén a la barra lateral i a la mòbil.
 */
import { expect, test } from 'vitest';
import { SECTIONS, SECTION_ORDER } from './sections.js';

const PINTADES = SECTIONS.filter((section) => SECTION_ORDER.includes(section.id));
const subrutes = (section) => section.subrutes || [];

test('el perfil propi no penja de cap secció: a /el-meu-perfil no s’encén cap entrada', () => {
  const delPerfilPropi = (ruta) => ruta === '/el-meu-perfil' || ruta.startsWith('/el-meu-perfil/');
  const declarades = [
    ...SECTIONS.flatMap((section) => subrutes(section).map((ruta) => [section.id, ruta])),
    ...PINTADES.map((section) => [section.id, section.path]),
  ];
  expect(declarades.filter(([, ruta]) => delPerfilPropi(ruta))).toEqual([]);
});

/* La frontera de NavLink («ruta + '/'») només és certa amb rutes absolutes,
   sense barra final i sense query: la query no forma part de la ruta actual,
   i una ruta buida o acabada en '/' encendria rutes que no són filles. */
test('cada subruta és una ruta absoluta, sense barra final, query ni ancoratge', () => {
  const malformades = SECTIONS.flatMap((section) => subrutes(section)
    .filter((ruta) => typeof ruta !== 'string' || !/^\/[^/?#]+(\/[^/?#]+)*$/.test(ruta))
    .map((ruta) => `${section.id} → ${String(ruta)}`));
  expect(malformades).toEqual([]);
});

/* Una ruta que declaren dues entrades pintades les encén totes dues alhora:
   seria un altre fals actiu. */
test('cap ruta declarada encén dues entrades de la barra alhora', () => {
  const propietaris = new Map();
  for (const section of PINTADES) {
    for (const ruta of [section.path, ...subrutes(section)]) {
      propietaris.set(ruta, [...(propietaris.get(ruta) || []), section.id]);
    }
  }
  const repetides = [...propietaris].filter(([, ids]) => ids.length > 1).map(([ruta, ids]) => `${ruta}: ${ids.join(', ')}`);
  expect(repetides).toEqual([]);
});
