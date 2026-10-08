// @vitest-environment node
/* Auditoria 261007 (B) · Neteja d'App.jsx, per text (el Routes propi es
   queda amb el primer fill que casa: les rutes mortes no es poden provar per
   comportament, perquè cap URL hi arriba).
   · ActorRoutes ja no porta les còpies de «/» i «/control» que AppRoutes
     resol abans del comodí, ni la funció ActorRedirect que només usava «/».
   · toggleSidebar és estable (useCallback), perquè el memo() de
     SidebarContent servisca. Les rutes reals de /control i les barres les
     cobrix App.test.jsx (T3 i T61). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';

/* El text tal qual: llevar comentaris amb una expressió regular es menjaria
   el codi (el comodí `path="/*"` obri un fals comentari). Els comentaris
   d'App.jsx no porten cap `<Route path=` ni el nom de la funció llevada. */
const codi = readFileSync(path.join(process.cwd(), 'src/app/App.jsx'), 'utf8');

const blocDe = (nom) => {
  const inici = codi.indexOf(`function ${nom}(`);
  const fi = codi.indexOf('\n}\n', inici);
  expect(inici).toBeGreaterThanOrEqual(0);
  return codi.slice(inici, fi);
};

test('ActorRoutes no repetix «/» ni «/control», que AppRoutes resol abans del comodí', () => {
  const rutesApp = blocDe('AppRoutes');
  const rutesActor = blocDe('ActorRoutes');
  expect(rutesApp).toContain('<Route path="/" ');
  expect(rutesApp).toContain('<Route path="/control" ');
  expect(rutesApp).toContain('<Route path="/*" element={<ActorRoutes');
  expect(rutesActor).not.toMatch(/<Route path="\/?"/);
  expect(rutesActor).not.toMatch(/<Route path="\/?control"/);
  expect(codi).not.toContain('ActorRedirect');
});

test('toggleSidebar és estable entre pintats d’AppShell', () => {
  expect(codi).toMatch(/const toggleSidebar = useCallback\(\(\) => \{[\s\S]*?\}, \[isCompact\]\);/);
});
