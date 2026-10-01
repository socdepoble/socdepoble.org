import React, { useState } from 'react';
import { act, render, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
// La closca sencera pinta una UniversalPage: fora el router, els avisos i el
// resolutor d'assets.
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri, resolRecursPropi: (valor) => valor }));
import { EditableField, UniversalEditorShell } from './UniversalEditorShell.jsx';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { FORASTER } from './UniversalUtils.js';

afterEach(cleanup);

const EINES = <div className="sdp-editor-tools" role="group" aria-label="Eines de l'editor" />;
const closca = (props) => render(
  <UniversalEditorShell id="d1" titleHtml="Títol" subtitleHtml="" leadHtml="" {...props}>
    <div data-testid="cos" />
  </UniversalEditorShell>
);
const classesDe = (el) => [...el.children].map((e) => e.className || e.dataset.testid);

test('D13 · per defecte («dalt») les eines són la primera fila de la closca, fora del document', () => {
  const { container } = closca({ topBar: EINES });
  expect(classesDe(container.querySelector('.sdp-editor-shell-atomic'))).toEqual(['sdp-editor-tools', 'sdp-editor-document']);
  expect(container.querySelector('.sdp-editor-eines')).toBeNull();
});

test('D13 · «davall-entradilla»: les eines entren a l’article, entre l’entradilla i el cos', () => {
  const { container } = closca({ topBar: EINES, posicioEines: 'davall-entradilla' });
  expect(classesDe(container.querySelector('.sdp-editor-shell-atomic'))).toEqual(['sdp-editor-document']);
  expect(container.querySelector('.sdp-universal-page-container').firstElementChild.className).toBe('bar-blue');
  expect(classesDe(container.querySelector('article.content-wrapper'))).toEqual(['page-intro', 'sdp-editor-eines', 'cos']);
  expect(container.querySelectorAll('.sdp-editor-tools')).toHaveLength(1);
});

test('D13 · sense barra d’eines, «davall-entradilla» no pinta cap embolcall buit', () => {
  const { container } = closca({ posicioEines: 'davall-entradilla' });
  expect(container.querySelector('.sdp-editor-eines')).toBeNull();
  expect(classesDe(container.querySelector('article.content-wrapper'))).toEqual(['page-intro', 'cos']);
});

test('barra taronja: una cadena buida explícita no s’omple amb el poble del Foraster; sense la prop, sí', () => {
  const ambBuit = closca({ barAuthorLocation: '' });
  expect(ambBuit.container.textContent).not.toContain(FORASTER.location);
  cleanup();
  const senseProp = closca({});
  expect(senseProp.container.textContent).toContain(FORASTER.location);
  cleanup();
  expect(closca({ barAuthorLocation: 'La Torre' }).container.textContent).toContain('La Torre');
});

/* T22 · el nom i el poble del Foraster van junts: sense props ni config, la
   barra taronja pinta els dos literals de FORASTER, no un de cada casa. */
test('T22 · sense sessió, la barra taronja diu «Foraster» i «Poble de la persona forastera» alhora', () => {
  const { container } = closca({});
  expect(container.querySelector('.sp-card-author-name').textContent).toBe(FORASTER.name);
  expect(container.querySelector('.sp-card-author-location').textContent).toBe(FORASTER.location);
  expect(FORASTER.location).toBe('Poble de la persona forastera');
});

test('T35 · sense onHeroEdit, el botó de la capçalera diu «Editar capçalera» i l’ajuda de sempre', () => {
  const { getByRole, container } = closca({});
  expect(getByRole('button', { name: 'Editar capçalera' })).toBeTruthy();
  expect(container.querySelector('.hero-image .sdp-camp__ajuda').textContent).toBe("Pots pujar qualsevol tipus d'imatge o arxiu multimèdia.");
});

test('T35 · amb onHeroEdit, el botó porta l’etiqueta del pare i li passa «acaba», que torna a la imatge', () => {
  const onHeroEdit = vi.fn();
  const { container, getByRole } = closca({ heroImage: '/assets/h.webp', heroEditLabel: 'Editar capçalera i avatar', heroEditHelp: 'Ajuda', onHeroEdit });
  fireEvent.click(container.querySelector('img.sdp-hero__imatge'));
  fireEvent.click(getByRole('button', { name: 'Editar capçalera i avatar' }));
  expect(container.querySelector('.hero-image .sdp-camp__ajuda').textContent).toBe('Ajuda');
  expect(onHeroEdit).toHaveBeenCalledWith({ acaba: expect.any(Function) });
  act(() => onHeroEdit.mock.calls[0][0].acaba());
  expect(container.querySelector('img.sdp-hero__imatge')).not.toBeNull();
});

/* Simula una tecla: el navegador ja ha escrit al DOM quan arriba l'«input».
   Passa pel sanejador per complir la porta tractor-innerhtml (també als tests). */
function tecleja(camp, html) {
  camp.innerHTML = sanitizeHtml(html);
  fireEvent.input(camp);
}

test('A2 · amb el focus al camp, el valor que torna del pare no reescriu el DOM', () => {
  const onChange = vi.fn();
  const { container, rerender } = render(<EditableField html="" onChange={onChange} className="camp" />);
  const camp = container.querySelector('.camp');
  fireEvent.focus(camp);

  tecleja(camp, 'H');
  const nodeTeclejat = camp.firstChild;
  expect(onChange).toHaveBeenLastCalledWith('H');
  // El pare desa el valor i el torna com a prop: el node de text ha de ser el
  // mateix, perquè reescriure'l torna el cursor a l'inici («Hola» → «aloH»).
  rerender(<EditableField html="H" onChange={onChange} className="camp" />);
  expect(camp.firstChild).toBe(nodeTeclejat);

  tecleja(camp, 'Hola');
  // Un valor endarrerit (desat asíncron) tampoc no trepitja el que s'escriu.
  rerender(<EditableField html="Hol" onChange={onChange} className="camp" />);
  expect(camp.textContent).toBe('Hola');
});

test('A2 · en perdre el focus es pinta el valor desat', () => {
  const onBlur = vi.fn();
  const { container, rerender } = render(<EditableField html="Vell" onBlur={onBlur} className="camp" />);
  const camp = container.querySelector('.camp');
  fireEvent.focus(camp);
  tecleja(camp, 'Nou');
  fireEvent.blur(camp);
  expect(onBlur).toHaveBeenLastCalledWith('Nou');
  rerender(<EditableField html="Nou desat" onBlur={onBlur} className="camp" />);
  expect(camp.textContent).toBe('Nou desat');
});

test('A2 · els hooks no depenen del return null: el camp pot aparéixer després', () => {
  const { container, rerender } = render(<EditableField html={null} className="camp" />);
  expect(container.querySelector('.camp')).toBeNull();
  rerender(<EditableField html="Títol" className="camp" />);
  expect(container.querySelector('.camp').textContent).toBe('Títol');
  rerender(<EditableField html={null} className="camp" />);
  expect(container.querySelector('.camp')).toBeNull();
});

test('A3 · un camp buidat es desa com a cadena buida, no com a <br>, salts o espais', () => {
  const onChange = vi.fn();
  const onBlur = vi.fn();
  const { container } = render(<EditableField html="Hola" onChange={onChange} onBlur={onBlur} className="camp" />);
  const camp = container.querySelector('.camp');
  fireEvent.focus(camp);
  for (const buit of ['<br>', '\n\n', ' ', '&nbsp;', '<div><br></div>', '<p><br></p>']) {
    tecleja(camp, buit);
    expect(onChange).toHaveBeenLastCalledWith('');
  }
  fireEvent.blur(camp);
  expect(onBlur).toHaveBeenLastCalledWith('');
});

test('A3 · un camp buidat queda realment buit en perdre el focus (placeholder sense :has())', () => {
  const onChange = vi.fn();
  const { container, rerender } = render(<EditableField html="" onChange={onChange} className="camp" />);
  const camp = container.querySelector('.camp');
  fireEvent.focus(camp);
  tecleja(camp, 'H');
  rerender(<EditableField html="H" onChange={onChange} className="camp" />);
  tecleja(camp, '<br>');
  rerender(<EditableField html="" onChange={onChange} className="camp" />);
  fireEvent.blur(camp);
  expect(camp.childNodes).toHaveLength(0);
});

/* ── T40–T41 (ordre del Mestre, 260928) · la barra taronja ─────────────── */
test('T40 · sense onPublishDateChange la data és el <time> de sempre; amb, un botó que obri el calendari', () => ambAra(() => {
  const sense = closca({ formattedTime: '10:00', formattedDate: '01/01/26' });
  expect(sense.container.querySelector('.bar-orange .btn-date-time').tagName).toBe('TIME');
  cleanup();
  const onPublishDateChange = vi.fn();
  const { container, getByRole } = closca({ formattedTime: '10:00', formattedDate: '01/01/26', publishDate: null, onPublishDateChange });
  const pastilla = container.querySelector('.bar-orange .btn-date-time');
  expect(pastilla.tagName).toBe('BUTTON');
  expect(pastilla.getAttribute('aria-haspopup')).toBe('dialog');
  // T51 · Sense data triada, la d'ara: la de l'última edició (10:00 01/01/26) no hi entra.
  expect(pastilla.textContent).toBe('10:0728/09/26');
  act(() => { fireEvent.click(pastilla); });
  const dialeg = getByRole('dialog', { name: 'Data de publicació' });
  act(() => { fireEvent.click(dialeg.querySelector('.sdp-calendari__dia')); });
  expect(onPublishDateChange).toHaveBeenCalledTimes(1);
  const triada = new Date(onPublishDateChange.mock.calls[0][0]);
  expect([triada.getFullYear(), triada.getMonth(), triada.getDate()]).toEqual([2026, 8, 1]);
}));

test('T40 · la barra taronja no pinta cap selector d’identitat (viu a la barra negra)', () => {
  const { container } = closca({ identityActions: <div className="perfil-selector">Qui</div>, onObriVisibilitat: vi.fn() });
  expect(container.querySelector('.bar-orange .perfil-selector')).toBeNull();
  expect(container.querySelector('.perfil-selector')).toBeNull();
});

test('T41 · la bola del món és un <button> real amb nom que obri el selector; sense Dropdown ni interactius niats', () => {
  const onObriVisibilitat = vi.fn();
  const { container } = closca({ isPublished: true, onObriVisibilitat, etiquetaVisibilitat: 'Publicada al Mur: canviar la visibilitat' });
  const bola = container.querySelector('.bar-orange button.btn-icon-orange');
  expect(bola.getAttribute('aria-haspopup')).toBe('dialog');
  expect(bola.getAttribute('aria-label')).toBe('Publicada al Mur: canviar la visibilitat');
  expect(bola.getAttribute('aria-expanded')).toBe('false');
  expect(bola.querySelector('svg.lucide-globe')).not.toBeNull();
  expect(container.querySelector('.sp-dropdown-wrapper')).toBeNull();
  expect(container.querySelector('[role="button"] button')).toBeNull();
  expect(container.querySelector('.published')).toBeNull();
  act(() => { fireEvent.click(bola); });
  expect(onObriVisibilitat).toHaveBeenCalledTimes(1);
  cleanup();
  const privada = closca({ isPublished: false, onObriVisibilitat, etiquetaVisibilitat: 'Privada' });
  expect(privada.container.querySelector('.bar-orange button.btn-icon-orange svg.lucide-lock')).not.toBeNull();
});

test('T41 · sense onObriVisibilitat, cap botó d’estat que no fa res', () => {
  const { container } = closca({});
  expect(container.querySelector('.btn-icon-orange')).toBeNull();
});

/* ── T51 (ordre del Mestre, 260928) · espai central i data en edició ──── */
const fillsBarra = (container) => [...container.querySelector('section.bar-orange').children].map((e) => e.className);
const ARA = new Date(2026, 8, 28, 10, 7);
/* Només es falseja el rellotge (Date): els temporitzadors continuen de veres. */
const ambAra = (prova) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(ARA);
  try { prova(); } finally { vi.useRealTimers(); }
};

test('T51 · la barra taronja té tres fills: autoria, espai central i accions', () => {
  const { container } = closca({});
  expect(fillsBarra(container)).toEqual(['sp-card-author', 'sdp-emoticona-barra sdp-emoticona-barra--buida', 'bar-actions']);
});

test('T51 · amb onObriEmoticona, l’espai central és un botó amb la ploma blanca; amb emoticona, l’emoticona', () => {
  const onObriEmoticona = vi.fn();
  const { container } = closca({ onObriEmoticona });
  const boto = container.querySelector('.bar-orange > button.sdp-emoticona-barra--boto');
  expect(boto.getAttribute('aria-haspopup')).toBe('dialog');
  expect(boto.getAttribute('aria-label')).toBe('Triar l’emoticona del document');
  expect(boto.querySelector('svg.lucide-feather.icon')).not.toBeNull();
  act(() => { fireEvent.click(boto); });
  expect(onObriEmoticona).toHaveBeenCalledTimes(1);
  cleanup();
  const amb = closca({ onObriEmoticona, emoticona: '🍅' });
  const botoAmb = amb.container.querySelector('.bar-orange > .sdp-emoticona-barra--boto');
  expect(botoAmb.textContent).toBe('🍅');
  expect(botoAmb.querySelector('svg')).toBeNull();
  expect(botoAmb.getAttribute('aria-label')).toBe('Emoticona del document: 🍅. Canviar-la');
  // El botó d'emoticona té classe pròpia: .btn-icon-orange continua sent la bola del món.
  expect(amb.container.querySelector('.btn-icon-orange')).toBeNull();
});

test('T51 · sense onObriEmoticona (fitxes d’organització i d’agent, sense columna), cap botó ni ploma: la cel·la de lectura', () => {
  const { container } = closca({ emoticona: '🍅' });
  expect(container.querySelector('.bar-orange button.sdp-emoticona-barra--boto')).toBeNull();
  expect(container.querySelector('.bar-orange svg.lucide-feather')).toBeNull();
  expect(container.querySelector('.bar-orange .sdp-emoticona-barra--glif').getAttribute('aria-label')).toBe('Emoticona del document: 🍅');
});

/* T66b · «Tornar al que hi ha desat» a l'avís «Emoticona» (la columna icon en
   quarantena): el botó premut desapareix amb l'avís i el focus torna al botó
   d'emoticona de la barra taronja, no al body. Sense botó (lectura), al títol. */
function AmbAvisEmoticona(props) {
  const [avisos, setAvisos] = useState({
    icon: { error: { missatge: 'Este camp encara no té columna.', accions: [{ text: 'Tornar al que hi ha desat', onClick: () => setAvisos(null) }] } },
  });
  return (
    <UniversalEditorShell id="d1" titleHtml="Títol" subtitleHtml="" leadHtml="" avisosCamps={avisos} {...props}>
      <div data-testid="cos" />
    </UniversalEditorShell>
  );
}
const tornaAlDesat = (container) => {
  const alerta = container.querySelector('.sdp-avisos-camps [role="alert"]');
  expect(alerta.textContent).toContain('Emoticona');
  const boto = [...alerta.querySelectorAll('button')].find((b) => b.textContent === 'Tornar al que hi ha desat');
  boto.focus();
  act(() => { fireEvent.click(boto); });
  expect(container.querySelector('.sdp-avisos-camps')).toBeNull();
};

test('T66b · després de «Tornar al que hi ha desat» a l’avís «Emoticona», el focus torna al botó de la barra taronja', () => {
  const { container } = render(<AmbAvisEmoticona emoticona="🍅" onObriEmoticona={vi.fn()} />);
  tornaAlDesat(container);
  const botoEmoticona = container.querySelector('section.bar-orange > button.sdp-emoticona-barra--boto');
  expect(botoEmoticona).not.toBeNull();
  expect(document.activeElement).toBe(botoEmoticona);
});

test('T66b · sense botó d’emoticona (lectura), el focus de l’avís «Emoticona» va al títol, mai al body', () => {
  const { container } = render(<AmbAvisEmoticona emoticona="🍅" />);
  tornaAlDesat(container);
  expect(document.activeElement).toBe(container.querySelector('.editor-title-input'));
});

test('T51 · sense data al document (el Perfil), la pastilla porta la data i l’hora d’ara amb un dateTime vàlid', () => ambAra(() => {
  const { container } = closca({});
  const pastilla = container.querySelector('.bar-orange .btn-date-time');
  expect(pastilla.tagName).toBe('TIME');
  expect([...pastilla.querySelectorAll('span')].map((s) => s.textContent)).toEqual(['10:07', '28/09/26']);
  expect(pastilla.getAttribute('datetime')).toBe('2026-09-28T10:07');
}));

/* T51 · Regla d'EDICIÓ del Mestre: MAI la data de l'última edició. Una nota
   vella oberta no passa per una nota d'aquell dia. */
test('T51 · amb la data d’última edició del document (formatted*), la pastilla diu la d’ara, amb el seu dateTime', () => ambAra(() => {
  const { container } = closca({ formattedTime: '09:37', formattedDate: '02/01/26' });
  const pastilla = container.querySelector('.bar-orange .btn-date-time');
  expect(pastilla.textContent).toBe('10:0728/09/26');
  expect(pastilla.getAttribute('datetime')).toBe('2026-09-28T10:07');
  expect(container.querySelector('.bar-orange').textContent).not.toContain('02/01/26');
}));

test('T51 · sense calendari (DateTimeControl), una data de publicació triada mana sobre la d’ara i la d’última edició', () => ambAra(() => {
  const publicacio = new Date(2026, 9, 3, 18, 30).toISOString();
  const { container } = closca({ formattedTime: '09:37', formattedDate: '02/01/26', publishDate: publicacio });
  const pastilla = container.querySelector('.bar-orange .btn-date-time');
  expect(pastilla.tagName).toBe('TIME');
  expect(pastilla.textContent).toBe('18:3003/10/26');
  expect(pastilla.getAttribute('datetime')).toBe('2026-10-03T18:30');
}));

test('T51 · amb el calendari i sense data (la còpia del Foraster), la pastilla diu la d’ara, mai «Data»', () => ambAra(() => {
  const { container } = closca({ publishDate: null, onPublishDateChange: vi.fn() });
  const pastilla = container.querySelector('.bar-orange .btn-date-time');
  expect(pastilla.tagName).toBe('BUTTON');
  expect(pastilla.textContent).toBe('10:0728/09/26');
  expect(pastilla.getAttribute('aria-label')).toContain('ara es mostra la data i l’hora d’ara (10:07 28/09/26)');
}));

test('A3 · el text i les imatges pròpies es conserven', () => {
  const onChange = vi.fn();
  const { container } = render(<EditableField html="" onChange={onChange} className="camp" />);
  const camp = container.querySelector('.camp');
  fireEvent.focus(camp);
  tecleja(camp, 'Hola <strong>món</strong>');
  expect(onChange).toHaveBeenLastCalledWith('Hola <strong>món</strong>');
  tecleja(camp, '<img src="/assets/a.png" alt="">');
  expect(onChange.mock.lastCall[0]).toMatch(/^<img\b/);
});
