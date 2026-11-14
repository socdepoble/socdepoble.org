/* R24 · Gauntlet Loop, ronda 2 (G-client-3) · Prova de regressió permanent · una fila per persona i el silenci.
   El plegat (unaFilaPerPersona.js) suma els no llegits de TOTS els canals,
   també els silenciats, i la fila pren el silenci del canal que la representa
   (el més recent). El comptador global (sumaNoLlegits) deixa fora els
   silenciats. Resultat: la llista i el comptador diuen coses diferents, i un
   canal d'entitat NO silenciat amb missatges nous es pinta com a silenciat. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import FilaConversa from './components/FilaConversa.jsx';
import { mapejaFil, sumaNoLlegits } from './missatges.js';
import { unaFilaPerPersona } from './unaFilaPerPersona.js';

const t = (_, alternativa) => alternativa;
afterEach(cleanup);

const DEMA = new Date(Date.now() + 86400000).toISOString();
const DAMIA = { id: 'damia', nom: 'Damià Llorens', tipus: 'persona' };

/* Javi: el directe personal amb Damià (silenciat, el més recent, 3 sense llegir)
   i el canal privat de Sóc de Poble amb Damià (NO silenciat, 2 sense llegir). */
const personal = mapejaFil({
  id: 'd-damia', tipus: 'directe', altres: [DAMIA], altresNoms: [DAMIA.nom],
  ultimText: 'Ja ho parlarem', ultimAl: '2026-11-14T05:00:00Z', ultimAutorId: 'damia', ultimSeq: 3, llegitFinsSeq: 0, noLlegits: 3,
  silenciatFinsAl: DEMA
});
const canal = mapejaFil({
  id: 'c-damia', tipus: 'directe', altres: [DAMIA], altresNoms: [DAMIA.nom],
  entitatId: 'org-sdp', entitatNom: 'Sóc de Poble', comEntitat: true,
  ultimText: 'Vull donar-me de baixa', ultimAl: '2026-11-14T04:00:00Z', ultimAutorId: 'damia', ultimSeq: 2, llegitFinsSeq: 0, noLlegits: 2
});
const fila = (fil) => ({ clau: String(fil.id), tipus: 'fil', fil, fixat: false, instant: Date.parse(fil.ultimAl) });

test('G-client-3 · la fila plegada compta el mateix que el comptador global (sense silenciats)', () => {
  const [plegada] = unaFilaPerPersona([fila(personal), fila(canal)]);
  expect(plegada.canals).toHaveLength(2);
  expect(sumaNoLlegits([personal, canal])).toBe(2);
  expect(plegada.fil.noLlegits, 'la fila suma també els 3 del canal silenciat').toBe(2);
});

test('G-client-3 · un canal d’entitat NO silenciat amb novetats no es pinta com a silenciat dins de la fila plegada', () => {
  const [plegada] = unaFilaPerPersona([fila(personal), fila(canal)]);
  render(<FilaConversa fil={plegada.fil} canals={plegada.canals} onSelect={() => {}} t={t} locale="ca-ES" />);
  const boto = screen.getByRole('button', { name: /Damià Llorens/ });
  expect(boto.textContent, 'la fila diu «Silenciada»').not.toContain('Silenciada');
  expect(boto.classList.contains('sdp-xat-fila--nova'), 'la fila no es ressalta tot i 2 missatges nous NO silenciats').toBe(true);
});

/* ── Atacs que la implementació SOBREVIU (cobertura per a l'integrador) ── */
import { estatDeLUltim, filsPerEntregar } from './missatges.js';
import { clauDePersona, identitatsDeLaFila } from './unaFilaPerPersona.js';

const U = (n) => `24000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const conv = (n, extra = {}) => ({ id: U(n), tipus: 'directe', ultimSeq: 5, rebutFinsSeq: 0, ultimAutorId: 'altra', ultimAl: `2026-11-14T0${n % 10}:00:00Z`, ...extra });

test('sobreviu · filsPerEntregar: bloquejat, E2EE, visitant, obert, propi, ajuda i llavor fora; com a molt 5', () => {
  const fils = [
    conv(1, { ultimAutorId: 'bloquejada' }), conv(2, { e2ee: true }), conv(3, { participant: false }), conv(4), conv(5, { esPropi: true }),
    conv(6, { perDefecte: 'javi' }), { ...conv(7), id: 'seed-1' }, conv(8), conv(9), ...[10, 11, 12, 13, 14].map((n) => conv(n))
  ];
  const tria = filsPerEntregar(fils, { actiuId: U(4), bloquejat: (id) => id === 'bloquejada' }).map((f) => f.id);
  expect(tria).toHaveLength(5);
  for (const fora of [U(1), U(2), U(3), U(4), U(5), U(6), 'seed-1']) expect(tria).not.toContain(fora);
});

test('sobreviu · un servidor sense rebut_pels_altres_fins_seq no pinta mai ✓✓', () => {
  const vell = mapejaFil({ id: U(1), tipus: 'directe', ultimSeq: 7, llegitPelsAltresFinsSeq: 0, ultimAutorId: 'jo', ultimText: 'x' });
  expect(vell.rebutsConeguts).toBe(false);
  expect(estatDeLUltim(vell, 'jo')).toBe('enviat');
});

test('sobreviu · homònims no es pleguen; una clienta d’entitat (altres = [entitat]) no té clau de persona', () => {
  const a = mapejaFil({ id: 'h1', tipus: 'directe', altres: [{ id: 'p1', nom: 'Maria', tipus: 'persona' }], ultimSeq: 1, ultimText: 'a' });
  const b = mapejaFil({ id: 'h2', tipus: 'directe', altres: [{ id: 'p2', nom: 'Maria', tipus: 'persona' }], ultimSeq: 1, ultimText: 'b' });
  expect(clauDePersona(a)).not.toBe(clauDePersona(b));
  expect(unaFilaPerPersona([fila({ ...a, ultimAl: '2026-11-14T01:00:00Z' }), fila({ ...b, ultimAl: '2026-11-14T00:00:00Z' })])).toHaveLength(2);
  const clienta = mapejaFil({ id: 'e1', tipus: 'directe', altres: [{ id: 'org', nom: 'Sóc de Poble', tipus: 'entitat' }], entitatId: 'org', entitatNom: 'Sóc de Poble' });
  expect(clauDePersona(clienta)).toBeNull();
  /* Dues entitats + personal: tres identitats, ordre fix. */
  const ids = identitatsDeLaFila([
    { id: 'x', comEntitat: true, entitatId: 'o2', entitatNom: 'Zeta' }, { id: 'y' }, { id: 'z', comEntitat: true, entitatId: 'o1', entitatNom: 'Alfa' }
  ]).map((i) => i.nom || 'Personal');
  expect(ids).toEqual(['Personal', 'Alfa', 'Zeta']);
});
