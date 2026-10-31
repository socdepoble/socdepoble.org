import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ navigate: vi.fn(), resol: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
/* El port resol les referències opaques: ací, una URL de CDN reconeixible. */
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: () => true,
  resolveAsset: (...args) => mocks.resol(...args),
}));
import { AVIS_PREVISUALITZACIO, AVISOS_TARGETA_VIVA, BotoTargetaViva, TargetaViva, useDocumentViu, usePublicaDocumentViu } from './TargetaViva.jsx';
import { llegixDocumentViu, publicaDocumentViu, subscriuDocumentViu } from './documentViu.js';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const DOC = {
  id: 'd1', title: '<p>Prova</p>', subtitle: 'Del&nbsp;Mas', lead: '<p><b>Hola</b></p>',
  formattedDate: '02/01/26', formattedTime: '09:37', updatedAt: '2026-01-02T08:37:00Z',
};
const AUTOR = { nom: 'Pep', avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg', poble: 'La Torre' };

/* T50 · Els botons de la targeta ensenyen les proporcions però no fan res:
   cada clic obri l'avís de previsualització, sense navegar ni alert(). */
for (const nom of [/Data i hora:/, /Traduir Prova/, /Comentar Prova/, /Compartir Prova/, /CONNECTAR amb Prova/]) {
  test(`T50 · ${nom} obri l’avís de previsualització i no navega`, () => {
    const alerta = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<TargetaViva document={DOC} autor={AUTOR} />);
    fireEvent.click(screen.getByRole('button', { name: nom }));
    expect(screen.getByRole('dialog').open).toBe(true);
    expect(screen.getByRole('heading', { name: AVIS_PREVISUALITZACIO.titol })).toBeTruthy();
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(alerta).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Entesos' }));
    expect(document.querySelector('dialog').open).toBe(false);
    alerta.mockRestore();
  });
}

/* T51 · La targeta viva és una previsualització d'EDICIÓ: sense data triada,
   la d'ara (rellotge fals), MAI la de l'última edició del document (DOC). */
test('T50 · cap «(i)» a la caputxa (sdp-universal-page §1.C): la targeta és text pla, amb autor, data i etiquetes', () => {
  /* Només es falseja el rellotge (Date): els temporitzadors continuen de veres. */
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 28, 10, 7));
  try {
    const { container } = render(<TargetaViva document={DOC} autor={AUTOR} etiquetes={[{ text: 'Sistema' }]} />);
    expect(screen.queryByRole('button', { name: /Informació/ })).toBeNull();
    expect(container.querySelector('.sp-card-header .btn-icon-orange')).toBeNull();
    const targeta = container.querySelector('article.sp-card.sp-card--pla.sdp-targeta-viva-carta');
    expect(targeta.querySelector('.sp-card-title').textContent).toBe('Prova');
    expect(targeta.querySelector('.sp-card-subtitle').textContent).toBe('Del Mas');
    expect(targeta.querySelector('.sp-card-text').textContent).toBe('Hola');
    expect(targeta.querySelector('.sp-card-author-name').textContent).toBe('Pep');
    expect(targeta.querySelector('.sp-card-author-location').textContent).toBe('La Torre');
    expect(screen.getByRole('button', { name: 'Data i hora: 10:07: 28/09/26' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /02\/01\/26/ })).toBeNull();
    expect(screen.getByText('Sistema')).toBeTruthy();
  } finally { vi.useRealTimers(); }
});

/* Onada 8 (261009, revisió) · «Un clic a QUALSEVOL boina taronja porta
   SEMPRE al perfil públic de qui signa»: amb `autor.ruta`, la boina és
   l'enllaç d'UniversalCard (no s'intercepta, com el dels drets), i el clic no
   torna a triar la fitxa. Sense ruta, text, com abans. */
test('Onada 8 · amb autor.ruta, la boina enllaça al perfil de qui signa i no obri l’avís; sense, és text', () => {
  const onMainClick = vi.fn();
  const { container, unmount } = render(<TargetaViva document={DOC} autor={{ ...AUTOR, ruta: '/gent/pep' }} onMainClick={onMainClick} />);
  const boina = container.querySelector('.sp-card-header a.sp-card-author-link');
  // El Link del router simulat és un <a> pla: la ruta queda a `to`.
  expect(boina.getAttribute('to')).toBe('/gent/pep');
  fireEvent.click(boina);
  expect(onMainClick).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')?.open ?? false).toBe(false);
  unmount();
  const senseRuta = render(<TargetaViva document={DOC} autor={AUTOR} />);
  expect(senseRuta.container.querySelector('.sp-card-header a.sp-card-author-link')).toBeNull();
  expect(senseRuta.container.querySelector('.sp-card-header span.sp-card-author-block')).not.toBeNull();
});

test('T50 · la targeta sense mainHref no navega en clicar-la; onMainClick (la fitxa de la llista) es crida', () => {
  const onMainClick = vi.fn();
  render(<TargetaViva document={DOC} autor={AUTOR} onMainClick={onMainClick} />);
  fireEvent.click(screen.getByRole('button', { name: 'Prova' }));
  expect(onMainClick).toHaveBeenCalledTimes(1);
  expect(mocks.navigate).not.toHaveBeenCalled();
});

test('T50 · una capçalera sdp-media:// es resol pel port abans de pintar-la; una URL normal passa tal qual', async () => {
  mocks.resol.mockImplementation(async (ref) => ref.replace('sdp-media://mitjans/', 'https://cdn.poble.test/'));
  const { container, rerender } = render(<TargetaViva document={{ ...DOC, heroImage: 'sdp-media://mitjans/capcalera.webp' }} autor={AUTOR} />);
  // Mentre es resol, cap <img> amb la referència opaca (UniversalCard no l'accepta).
  expect(container.querySelector('img.sp-card-media[src^="sdp-media"]')).toBeNull();
  await waitFor(() => expect(container.querySelector('img.sp-card-media')?.getAttribute('src')).toBe('https://cdn.poble.test/capcalera.webp'));
  expect(mocks.resol).toHaveBeenCalledWith('sdp-media://mitjans/capcalera.webp', expect.anything());
  mocks.resol.mockClear();
  rerender(<TargetaViva document={{ ...DOC, heroImage: '/assets/system/ui/capcalera.webp' }} autor={AUTOR} />);
  expect(container.querySelector('img.sp-card-media').getAttribute('src')).toBe('/assets/system/ui/capcalera.webp');
  expect(mocks.resol).not.toHaveBeenCalled();
});

test('T50 · un avatar sdp-media:// també es resol', async () => {
  mocks.resol.mockImplementation(async () => 'https://cdn.poble.test/pep.webp');
  const { container } = render(<TargetaViva document={DOC} autor={{ ...AUTOR, avatar: 'sdp-media://avatars/pep.webp' }} />);
  await waitFor(() => expect(container.querySelector('img.sp-card-avatar')?.getAttribute('src')).toBe('https://cdn.poble.test/pep.webp'));
});

test('T50 · el xip «Vista targeta» obri un diàleg amb la targeta, que només es munta obert', () => {
  const { container } = render(<BotoTargetaViva document={DOC} autor={AUTOR} etiquetes={[]} />);
  const xip = screen.getByRole('button', { name: 'Vista targeta' });
  /* Cicle 3 (261030, VD) · Només la classe de la família: la de sempre sense estil ha eixit. */
  expect(xip.className).toBe('sdp-classificacio-pindola');
  expect(xip.getAttribute('aria-haspopup')).toBe('dialog');
  expect(container.querySelector('.sp-card')).toBeNull();
  act(() => { fireEvent.click(xip); });
  const dialeg = screen.getByRole('dialog', { name: 'Vista targeta' });
  expect(dialeg.open).toBe(true);
  expect(within(dialeg).getByRole('heading', { level: 3, name: 'Prova' })).toBeTruthy();
  act(() => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Tancar' })); });
  expect(container.querySelector('.sp-card')).toBeNull();
});

/* Correcció D1 (revisió de T50) · El text d'avís, per consumidor: el Bloc de
   Notes parla del Mur; el Perfil i la reserva no prometen cap publicació. */
test('D1 · l’avís d’una acció diu el text del consumidor (avis), i sense, la reserva', () => {
  for (const [avis, esperat] of [
    [AVISOS_TARGETA_VIVA.notes, AVISOS_TARGETA_VIVA.notes.descripcio],
    [AVISOS_TARGETA_VIVA.perfil, AVISOS_TARGETA_VIVA.perfil.descripcio],
    [undefined, AVIS_PREVISUALITZACIO.descripcio],
  ]) {
    render(<TargetaViva document={DOC} autor={AUTOR} avis={avis} />);
    fireEvent.click(screen.getByRole('button', { name: /Comentar Prova/ }));
    expect(screen.getByRole('dialog').textContent).toContain(esperat);
    cleanup();
  }
  expect(AVISOS_TARGETA_VIVA.notes.descripcio).toContain('una vegada publicada al Mur');
  expect(AVISOS_TARGETA_VIVA.notes.vista).toContain('una vegada publicada al Mur');
  // Ni el Perfil ni la reserva (la de qui no passa `avis`; la feia servir l'aside de DocumentEditor,
  // retirat al Bloc 3.4 del Gauntlet, 261016) prometen publicació.
  for (const avis of [AVISOS_TARGETA_VIVA.perfil, AVIS_PREVISUALITZACIO]) {
    expect(`${avis.descripcio} ${avis.vista}`).not.toMatch(/publica/i);
  }
  expect(AVISOS_TARGETA_VIVA.perfil.vista).toBe('Així es veu esta fitxa en format targeta.');
  // Qui només llig la fitxa (sense permís d'edició) també la veu: cap «editant».
  expect(AVISOS_TARGETA_VIVA.perfil.descripcio).not.toMatch(/editant/);
});

test('D1 · el xip «Vista targeta» descriu el diàleg amb el text del consumidor i el passa a la targeta', () => {
  render(<BotoTargetaViva document={DOC} autor={AUTOR} etiquetes={[]} avis={AVISOS_TARGETA_VIVA.perfil} />);
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Vista targeta' })); });
  const vista = screen.getByRole('dialog', { name: 'Vista targeta' });
  expect(vista.textContent).toContain(AVISOS_TARGETA_VIVA.perfil.vista);
  expect(vista.textContent).not.toMatch(/publicada/);
  act(() => { fireEvent.click(within(vista).getByRole('button', { name: /Comentar Prova/ })); });
  const avis = screen.getByRole('dialog', { name: AVISOS_TARGETA_VIVA.perfil.titol });
  expect(avis.textContent).toContain(AVISOS_TARGETA_VIVA.perfil.descripcio);
});

test('D5 · `actual` arriba a la targeta: el botó principal porta aria-current="true"; sense, cap', () => {
  const { container } = render(<TargetaViva document={DOC} autor={AUTOR} onMainClick={() => {}} actual />);
  expect(container.querySelector('button.sp-card-link-overlay').getAttribute('aria-current')).toBe('true');
  cleanup();
  const senseActual = render(<TargetaViva document={DOC} autor={AUTOR} />);
  expect(senseActual.container.querySelectorAll('[aria-current]')).toHaveLength(0);
});

/* Ordre del Mestre (261007) · «Aplica a TargetaViva.jsx (quan actua com a ítem
   de llista)»: sense imatge i amb una emoticona triada, l'emoji XL ocupa el
   quadrat de la fitxa de la llista (la que porta `actual`), amb la insígnia del
   catàleg (insigniaEmojiXL). Amb imatge o sense emoticona, cap insígnia. */
const quadratDe = (arrel) => arrel.querySelector('.sp-card-body > .sp-card-calendar-badge');
const FITXA_DE_LLISTA = Object.freeze({ onMainClick: () => {}, actual: true });

test('261007 · a la fitxa de la llista, sense imatge, l’emoticona triada va al quadrat en XL; amb imatge o sense emoticona, cap insígnia', () => {
  const { container, unmount } = render(<TargetaViva document={{ ...DOC, icon: '🍅' }} autor={AUTOR} {...FITXA_DE_LLISTA} />);
  const emoji = quadratDe(container).querySelector('.sp-card-calendar-badge__emoji');
  expect([emoji.textContent, emoji.getAttribute('aria-hidden')]).toEqual(['🍅', 'true']);
  /* Revisió del 261007 (M2-08) · El títol ja el diu la targeta: el quadrat
     és decoratiu (amagat, sense nom que el repetisca). */
  expect(quadratDe(container).getAttribute('aria-hidden')).toBe('true');
  expect(quadratDe(container).hasAttribute('aria-label')).toBe(false);
  expect(container.querySelector('.sp-card-body').classList.contains('has-aside')).toBe(true);
  unmount();
  const ambImatge = render(<TargetaViva document={{ ...DOC, icon: '🍅', heroImage: '/assets/system/ui/capcalera.webp' }} autor={AUTOR} {...FITXA_DE_LLISTA} />);
  expect(ambImatge.container.querySelector('img.sp-card-media')).not.toBeNull();
  expect(quadratDe(ambImatge.container)).toBeNull();
  ambImatge.unmount();
  const senseEmoticona = render(<TargetaViva document={DOC} autor={AUTOR} {...FITXA_DE_LLISTA} />);
  expect(quadratDe(senseEmoticona.container)).toBeNull();
  expect(senseEmoticona.container.querySelector('.sp-card-body').classList.contains('has-aside')).toBe(false);
});

/* Llei del Píxel · La targeta en línia, sense `actual` («Les vistes» del
   Perfil, DetallVistes; abans també l'aside de l'editor, retirat al Bloc 3.4
   del Gauntlet, 261016), i el diàleg del xip «Vista targeta» no són ítems de
   llista: es queden sense quadrat, com abans, i l'emoticona continua al centre
   de la caputxa (Pedra Seca §10). */
test('261007 · la targeta en línia (sense `actual`) i el xip «Vista targeta» no porten l’emoji XL al quadrat; l’emoticona continua a la caputxa', () => {
  const enLinia = render(<TargetaViva document={{ ...DOC, icon: '🍅' }} autor={AUTOR} />);
  expect(quadratDe(enLinia.container)).toBeNull();
  expect(enLinia.container.querySelector('.sp-card-body').classList.contains('has-aside')).toBe(false);
  expect(enLinia.container.querySelector('.sp-card .sdp-emoticona-barra').textContent).toBe('🍅');
  enLinia.unmount();
  render(<BotoTargetaViva document={{ ...DOC, icon: '🍅' }} autor={AUTOR} etiquetes={[]} />);
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Vista targeta' })); });
  const vista = screen.getByRole('dialog', { name: 'Vista targeta' });
  expect(vista.querySelector('.sp-card')).not.toBeNull();
  expect(quadratDe(vista)).toBeNull();
  expect(vista.querySelector('.sp-card .sdp-emoticona-barra').textContent).toBe('🍅');
});

test('261007 · una capçalera sdp-media:// que encara es resol no fa aparéixer l’emoji del quadrat a la fitxa de la llista', () => {
  mocks.resol.mockImplementation(() => new Promise(() => {}));
  const { container } = render(<TargetaViva document={{ ...DOC, icon: '🍅', heroImage: 'sdp-media://mitjans/capcalera.webp' }} autor={AUTOR} {...FITXA_DE_LLISTA} />);
  expect(container.querySelector('img.sp-card-media')).toBeNull();
  expect(container.querySelector('.sp-card-calendar-badge')).toBeNull();
});

/* ── documentViu: el magatzem per id i els dos hooks ───────────────────── */
test('documentViu · publicar avisa qui escolta la clau; retirar només esborra la pròpia entrada', () => {
  const oient = vi.fn();
  const baixa = subscriuDocumentViu('jo', oient);
  const a = { document: { id: 'jo' } };
  const b = { document: { id: 'jo', title: 'B' } };
  const retiraA = publicaDocumentViu('jo', a);
  expect(llegixDocumentViu('jo')).toBe(a);
  const retiraB = publicaDocumentViu('jo', b);
  expect(oient).toHaveBeenCalledTimes(2);
  // Retirar A quan ja mana B no esborra B.
  retiraA();
  expect(llegixDocumentViu('jo')).toBe(b);
  retiraB();
  expect(llegixDocumentViu('jo')).toBeNull();
  expect(oient).toHaveBeenCalledTimes(3);
  baixa();
  publicaDocumentViu('jo', a)();
  expect(oient).toHaveBeenCalledTimes(3);
  // Sense clau, res.
  expect(llegixDocumentViu(null)).toBeNull();
  publicaDocumentViu(null, a)();
  expect(llegixDocumentViu('null')).toBeNull();
});

function Escriptor({ clau, titol }) {
  const entrada = React.useMemo(() => ({ document: { id: clau, title: titol }, autor: AUTOR, etiquetes: [] }), [clau, titol]);
  usePublicaDocumentViu(clau, entrada);
  return null;
}
function Lector({ clau }) {
  const viu = useDocumentViu(clau);
  return viu ? <TargetaViva {...viu} /> : <p>compacta</p>;
}
function Pantalla() {
  const [titol, setTitol] = useState('Primer');
  const [editor, setEditor] = useState(true);
  return (
    <>
      <Lector clau="O" />
      {editor ? <Escriptor clau="O" titol={titol} /> : null}
      <button type="button" onClick={() => setTitol('Segon')}>escriu</button>
      <button type="button" onClick={() => setEditor(false)}>tanca</button>
    </>
  );
}

test('usePublicaDocumentViu i useDocumentViu · la targeta de la llista segueix l’editor i torna a compacta quan es desmunta', () => {
  const { container } = render(<Pantalla />);
  expect(container.querySelector('.sp-card-title').textContent).toBe('Primer');
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'escriu' })); });
  expect(container.querySelector('.sp-card-title').textContent).toBe('Segon');
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'tanca' })); });
  expect(container.querySelector('.sp-card')).toBeNull();
  expect(screen.getByText('compacta')).toBeTruthy();
});
