/* P1-06 · El calaix d'emoticones del xat no ensenya les que el tipus de lletra
   no sap pintar: un punt de codi que el motor coneix però que es veu com un
   quadre buit (el tofu), o una seqüència que es partix en dos glifs. El
   detector del navegador es substituïx per un de mesures fixes (cap canvas de
   jsdom): les amplades del banc de Chrome 156 a macOS (261030), un emoji 32 i
   el tofu 20,28. */
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../../../utils/emojiPintable.js', async (importOriginal) => {
  const real = await importOriginal();
  const AMPLES = new Map([['\u{1FFFD}', 20.28], ['\u{1F600}‍\u{1F600}', 64], ['\u{1F33D}', 20.28], ['\u{1F426}‍\u{1F525}', 64]]);
  const detector = real.creaDetectorDePintat((text) => AMPLES.get(text) ?? 32);
  return { ...real, detectorDePintat: () => detector };
});

const { default: SelectorEmoticones } = await import('./SelectorEmoticones.jsx');
const { buidaRecents, recordaRecent } = await import('../emoticonesXat.js');

afterEach(() => { cleanup(); buidaRecents(); });

const t = (_, alternativa) => alternativa;
const GRUPS = Object.freeze([
  { id: 'menjar-beguda', nom: 'Menjar i beguda', emojis: [['1F345', '🍅', 'tomato'], ['1F33D', '🌽', 'ear of corn (tofu en este sistema)']] },
  { id: 'animals-natura', nom: 'Animals sintètics', emojis: [['1F426 200D 1F525', '\u{1F426}‍\u{1F525}', 'phoenix (partit)']] }
]);

test('P1-06 · fora el tofu i les seqüències partides; una família que es queda buida no porta pestanya', async () => {
  const carregaCataleg = vi.fn(async () => ({ GRUPS_EMOJIS: GRUPS }));
  render(<SelectorEmoticones id="prova-pintat" t={t} onTria={vi.fn()} onTanca={vi.fn()} carregaCataleg={carregaCataleg} />);
  await waitFor(() => expect(screen.getAllByRole('tab').map((p) => p.getAttribute('aria-label'))).toEqual(['Del poble', 'Menjar']));
  screen.getByRole('tab', { name: 'Menjar' }).click();
  const panell = await screen.findByRole('tabpanel');
  await waitFor(() => expect(within(panell).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['tomato']));
  expect(screen.queryByRole('button', { name: /ear of corn/ })).toBeNull();
  expect(screen.queryByRole('tab', { name: 'Animals sintètics' })).toBeNull();
});

/* Cicle 4 (auditoria matinal 261030_1224, MITJÀ-C9) · «Del poble» (la
   pestanya inicial) i «Recents» passen pel mateix filtre que el catàleg: 🌽
   (de «Horta, camp i menjar») és tofu en este sistema i no es veu enlloc, i
   una secció que es queda buida no porta ni el títol. */
test('C9 · «Del poble» i les recents també amaguen el tofu; una secció buida no es pinta', async () => {
  const carregaCataleg = vi.fn(async () => ({ GRUPS_EMOJIS: GRUPS }));
  const etiquetes = (arrel) => within(arrel).getAllByRole('button').map((b) => b.getAttribute('aria-label'));
  const seccio = (titol) => within(screen.getByRole('tabpanel')).queryByRole('heading', { name: titol })?.closest('section') ?? null;

  recordaRecent('\u{1F33D}', 'ear of corn');
  const vista = render(<SelectorEmoticones id="prova-poble" t={t} onTria={vi.fn()} onTanca={vi.fn()} carregaCataleg={carregaCataleg} />);
  expect(screen.getByRole('tab', { name: 'Del poble' }).getAttribute('aria-selected')).toBe('true');
  expect(seccio('Recents')).toBeNull();
  const horta = seccio('Horta, camp i menjar');
  expect(etiquetes(horta)).toContain('tomato');
  expect(etiquetes(horta)).not.toContain('ear of corn');
  expect(within(screen.getByRole('tabpanel')).queryByRole('button', { name: 'ear of corn' })).toBeNull();
  await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(2));
  vista.unmount();

  recordaRecent('\u{1F345}', 'tomato');
  render(<SelectorEmoticones id="prova-poble-2" t={t} onTria={vi.fn()} onTanca={vi.fn()} carregaCataleg={carregaCataleg} />);
  expect(etiquetes(seccio('Recents'))).toEqual(['tomato']);
  await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(2));
});
