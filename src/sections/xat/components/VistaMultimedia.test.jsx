/* Ordre del Mestre del 261004 (prompt 261004_0515, T5) · «Contingut
   multimèdia» (captura 19.41.58) ja és operativa: la mateixa fila de títol i
   el mateix control segmentat que quan era en construcció, ara amb
   aria-pressed de veres; Enllaços amb dos controls germans per fila (mai un
   <a> dins d'un <button>); Fitxers i Documents amb l'estat buit honest de F0;
   i sempre l'avís local. Abans, VistaEnConstruccio.test.jsx fixava esta
   vista com a inerta: derogat per l'ordre del Mestre del 261004 (prompt
   261004_0515). */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { Image } from 'lucide-react';
import VistaMultimedia, { TEXTOS_MULTIMEDIA } from './VistaMultimedia.jsx';
import VistaEnConstruccio from './VistaEnConstruccio.jsx';
import { PESTANYES_MULTIMEDIA } from '../multimediaXat.js';

const t = (_, alternativa) => alternativa;
afterEach(cleanup);

const FILS = [
  { id: 'f-festes', name: 'Comissió de Festes', tipus: 'grup' },
  { id: 'f-vicent', name: 'Vicent Ferris', tipus: 'directe' }
];
const MISSATGES = {
  'f-festes': [
    { id: 'm1', seq: 1, sender: 'other', author: 'Pepica', text: 'El programa: https://socdepoble.org/festes', creatAl: '2026-10-03T18:00:00Z' },
    { id: 'm2', seq: 2, sender: 'me', text: 'I el cartell https://socdepoble.org/cartell.', creatAl: '2026-09-20T18:00:00Z' }
  ],
  'f-vicent': [
    { id: 'm3', seq: 1, sender: 'other', author: 'Vicent', text: 'Mira: http://xn--pple-43d.com/entra', creatAl: '2026-10-04T08:00:00Z' }
  ]
};

function pinta(props = {}) {
  return render(
    <aside aria-label="Contingut multimèdia">
      <VistaMultimedia titol="Contingut multimèdia" icona={Image} fils={FILS} missatgesPerFil={MISSATGES} t={t} locale="ca-ES" {...props} />
    </aside>
  );
}

const segment = (nom) => within(screen.getByRole('group', { name: 'Tipus de contingut' })).getByRole('button', { name: nom });
const premuts = () => within(screen.getByRole('group', { name: 'Tipus de contingut' })).getAllByRole('button')
  .map((b) => [b.textContent, b.getAttribute('aria-pressed')]);

test('els textos són els de quan era en construcció, i les opcions van en l’ordre de les pestanyes', () => {
  expect(TEXTOS_MULTIMEDIA.icones.map(([clau, text]) => [clau, text])).toEqual([
    ['section.xat.vista.cerca', 'Cerca'],
    ['section.xat.vista.multimedia.ordena', 'Ordena'],
    ['section.xat.vista.multimedia.selecciona', 'Selecciona']
  ]);
  expect(TEXTOS_MULTIMEDIA.subtitol).toEqual(['section.xat.vista.multimedia.subtitol', 'Contingut multimèdia de totes les converses']);
  expect(TEXTOS_MULTIMEDIA.segments.opcions.map(([clau]) => clau.split('.').pop())).toEqual([...PESTANYES_MULTIMEDIA]);
});

/* Revisió 261004 (Relleus 4-12) · La Llei del Píxel es comparava amb ella
   mateixa: l'«abans» era la VistaEnConstruccio ja refactoritzada, que pinta
   amb les mateixes FilaDeTitolVista i FilaSegments i els mateixos
   TEXTOS_MULTIMEDIA. Ara l'«abans» és una instantània LITERAL del DOM que
   tenia Contingut multimèdia quan era en construcció (captura 19.41.58):
   la fila de títol amb la lupa, Ordena i Selecciona, i el control segmentat
   inert. Un canvi d'embolcall, de classe o d'icona la posa roja. */
const SVG_LUCIDE = (nom, cos) => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
  + ` stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-${nom}" aria-hidden="true" focusable="false">${cos}</svg>`;
const BOTO_ICONA_ABANS = (etiqueta, svg) => `<button type="button" class="sdp-xat-icona sdp-xat-inert" aria-label="${etiqueta}" title="${etiqueta}" aria-disabled="true">${svg}</button>`;
const CAPCALERA_ABANS = [
  '<div class="app-grid-col-header app-grid-col-header--dark">',
  '<div class="app-grid-col-header__plec app-grid-col-header__plec--fix">',
  SVG_LUCIDE('image', '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>'),
  '<span class="app-grid-col-header__titol">Contingut multimèdia</span>',
  '</div>',
  '<div class="app-grid-col-header__accions">',
  BOTO_ICONA_ABANS('Cerca', SVG_LUCIDE('search', '<path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle>')),
  BOTO_ICONA_ABANS('Ordena', SVG_LUCIDE('list-filter', '<path d="M2 5h20"></path><path d="M6 12h12"></path><path d="M9 19h6"></path>')),
  BOTO_ICONA_ABANS('Selecciona', SVG_LUCIDE('list-checks', '<path d="M13 5h8"></path><path d="M13 12h8"></path><path d="M13 19h8"></path><path d="m3 17 2 2 4-4"></path><path d="m3 7 2 2 4-4"></path>')),
  '</div>',
  '</div>'
].join('');
const FILA_SEGMENTS_ABANS = [
  '<div class="sdp-xat-vista__fila">',
  '<p class="sdp-xat-vista__subtitol">Contingut multimèdia de totes les converses</p>',
  '<div class="sdp-xat-segments" role="group" aria-label="Tipus de contingut">',
  '<button type="button" class="sdp-xat-segments__opcio sdp-xat-inert" aria-pressed="true" aria-disabled="true">Fitxers</button>',
  '<button type="button" class="sdp-xat-segments__opcio sdp-xat-inert" aria-pressed="false" aria-disabled="true">Enllaços</button>',
  '<button type="button" class="sdp-xat-segments__opcio sdp-xat-inert" aria-pressed="false" aria-disabled="true">Documents</button>',
  '</div>',
  '</div>'
].join('');

/* G1 (v1.2.25, ho demana el paquet) · Les tres accions de la fila de títol ja són vives: sense sdp-xat-inert ni
   aria-disabled, la lupa amb aria-expanded, i Ordena i Selecciona amb aria-pressed i el title del seu estat. La resta de
   la capçalera (plec, icona, títol i el SVG de cada acció) és byte a byte la d'abans. CR-03 (Gauntlet de la integració
   v1.2.25) · El kit havia canviat el DOM literal per un getByText del títol: la Llei del Píxel torna a fixar-lo sencer, i
   cada diferència amb el d'abans queda escrita ací. */
const CAPCALERA_V1225 = CAPCALERA_ABANS
  .replaceAll(' sdp-xat-inert', '')
  .replace('aria-label="Cerca" title="Cerca" aria-disabled="true"', 'aria-label="Cerca" title="Cerca" aria-expanded="false"')
  .replace('aria-label="Ordena" title="Ordena" aria-disabled="true"', 'aria-label="Ordena" title="Ordena: més recents primer" aria-pressed="false"')
  .replace('aria-label="Selecciona" title="Selecciona" aria-disabled="true"', 'aria-label="Selecciona" title="Selecciona elements" aria-pressed="false"');

test('Llei del Píxel · la fila de títol i el control segmentat pinten el DOM net amb controls actius (v1.2.25)', () => {
  expect(CAPCALERA_V1225).not.toContain('aria-disabled');
  const ara = pinta();
  const capcalera = ara.container.querySelector('.app-grid-col-header');
  expect(within(capcalera).getByText('Contingut multimèdia')).toBeTruthy();
  expect(capcalera.outerHTML).toBe(CAPCALERA_V1225);
  expect(ara.container.querySelector('.sdp-xat-vista__fila').outerHTML).toBe(
    FILA_SEGMENTS_ABANS.replaceAll(' sdp-xat-inert', '').replaceAll(' aria-disabled="true"', '')
  );
  /* Les tres icones de la fila de títol, en l'ordre de la captura, totes actives (sense sdp-xat-inert). */
  expect([...capcalera.querySelectorAll('.app-grid-col-header__accions svg')].map((svg) => svg.getAttribute('class')))
    .toEqual(['lucide lucide-search', 'lucide lucide-list-filter', 'lucide lucide-list-checks']);
  expect(capcalera.querySelectorAll('.sdp-xat-inert')).toHaveLength(0);
});

test('Llei del Píxel · la peça compartida pinta encara, inert, el DOM literal d’abans', () => {
  const tr = (parell) => t(parell[0], parell[1]);
  const textos = {
    icones: TEXTOS_MULTIMEDIA.icones.map(([clau, text, Icona]) => ({ etiqueta: t(clau, text), Icona })),
    subtitol: tr(TEXTOS_MULTIMEDIA.subtitol),
    segments: { etiqueta: tr(TEXTOS_MULTIMEDIA.segments.etiqueta), opcions: TEXTOS_MULTIMEDIA.segments.opcions.map(tr) }
  };
  const { container } = render(<aside><VistaEnConstruccio titol="Contingut multimèdia" icona={Image} {...textos} t={t} /></aside>);
  expect(container.querySelector('.app-grid-col-header').outerHTML).toBe(CAPCALERA_ABANS);
  expect(container.querySelector('.sdp-xat-vista__fila').outerHTML).toBe(FILA_SEGMENTS_ABANS);
});

test('el control segmentat i els 3 controls (Cerca, Ordena, Selecciona) són operatius', () => {
  pinta();
  expect(premuts()).toEqual([['Fitxers', 'true'], ['Enllaços', 'false'], ['Documents', 'false']]);
  for (const b of within(screen.getByRole('group', { name: 'Tipus de contingut' })).getAllByRole('button')) {
    expect(b.hasAttribute('aria-disabled')).toBe(false);
    expect(b.classList.contains('sdp-xat-inert')).toBe(false);
  }
  fireEvent.click(segment('Enllaços'));
  expect(premuts()).toEqual([['Fitxers', 'false'], ['Enllaços', 'true'], ['Documents', 'false']]);
  expect(screen.getByRole('region', { name: 'Enllaços' })).toBeTruthy();
  fireEvent.click(segment('Documents'));
  expect(premuts()).toEqual([['Fitxers', 'false'], ['Enllaços', 'false'], ['Documents', 'true']]);

  const icones = within(document.querySelector('.app-grid-col-header')).getAllByRole('button');
  expect(icones.map((b) => [b.getAttribute('aria-label'), b.hasAttribute('aria-disabled')]))
    .toEqual([['Cerca', false], ['Ordena', false], ['Selecciona', false]]);
  expect(screen.queryByRole('searchbox')).toBeNull();
  fireEvent.click(icones[0]);
  expect(screen.getByRole('searchbox', { name: 'Cerca' })).toBeTruthy();
  fireEvent.click(icones[1]);
  expect(icones[1].getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(icones[2]);
  expect(icones[2].getAttribute('aria-pressed')).toBe('true');
});

test('Enllaços: per mes, el domini, l’enllaç segur i el botó germà que obri la conversa', () => {
  const onObriFil = vi.fn();
  pinta({ onObriFil });
  fireEvent.click(segment('Enllaços'));
  const cos = screen.getByRole('region', { name: 'Enllaços' });
  /* Dos mesos, del més recent al més antic. */
  const mesos = within(cos).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
  expect(mesos).toHaveLength(2);
  expect(mesos[0]).toContain('2026');
  expect(mesos[0].toLocaleLowerCase('ca-ES')).toContain('octubre');
  expect(mesos[1].toLocaleLowerCase('ca-ES')).toContain('setembre');

  const enllacos = within(cos).getAllByRole('link');
  expect(enllacos.map((a) => a.getAttribute('href'))).toEqual([
    'http://xn--pple-43d.com/entra', 'https://socdepoble.org/festes', 'https://socdepoble.org/cartell'
  ]);
  for (const a of enllacos) {
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    expect(a.classList.contains('sdp-xat-enllac')).toBe(true);
    /* Mai un <a> dins d'un <button>, ni un botó dins d'un enllaç. */
    expect(a.closest('button')).toBeNull();
    expect(a.querySelector('button')).toBeNull();
  }
  /* El domini a cada fila, i l'avís de domini enganyós on toca. */
  const files = cos.querySelectorAll('.sdp-xat-multimedia__item');
  expect([...files].map((li) => li.querySelector('.sdp-xat-multimedia__host').textContent))
    .toEqual(['xn--pple-43d.com', 'socdepoble.org', 'socdepoble.org']);
  const avisos = within(cos).getAllByRole('note');
  expect(avisos).toHaveLength(1);
  expect(avisos[0].textContent).toContain('xn--pple-43d.com');

  /* El botó germà: avatar, nom (i qui l'ha compartit) i hora; obri la conversa.
     El seu nom accessible el fixa la prova de baix (WCAG 2.5.3). */
  const conversa = within(files[1]).getByRole('button');
  expect(conversa.textContent).toContain('Comissió de Festes · Pepica');
  expect(conversa.querySelector('time')).toBeTruthy();
  fireEvent.click(conversa);
  expect(onObriFil).toHaveBeenLastCalledWith('f-festes');
  expect(within(files[2]).getByRole('button').textContent).toContain('Comissió de Festes · Tu');
  fireEvent.click(within(files[0]).getByRole('button'));
  expect(onObriFil).toHaveBeenLastCalledWith('f-vicent');
  /* Cap previsualització: ni imatges ni peticions a tercers. */
  expect(cos.querySelector('img')).toBeNull();
});

/* Revisió 261004 (Relleus 4-12) · L'aria-label del botó de la conversa
   només deia «Obri la conversa de Comissió de Festes» i amagava qui l'ha
   compartit i quan, que sí que es veuen. Ara el nom accessible conté, sencer
   i en el mateix ordre, el que es veu (WCAG 2.5.3, Label in Name). */
test('el nom accessible del botó de la conversa conté el que es veu: nom, qui l’ha compartit i l’hora', () => {
  pinta();
  fireEvent.click(segment('Enllaços'));
  const botons = [...document.querySelectorAll('.sdp-xat-multimedia__conversa')];
  expect(botons).toHaveLength(3);
  for (const boto of botons) {
    const hora = boto.querySelector('time').textContent;
    expect(hora).not.toBe('');
    const vist = `${boto.querySelector('.sdp-xat-multimedia__nom').textContent} ${hora}`;
    expect(boto.getAttribute('aria-label')).toBe(`Obri la conversa de ${vist}`);
  }
  const [vicent, pepica, tu] = botons.map((b) => b.querySelector('time').textContent);
  expect(screen.getByRole('button', { name: `Obri la conversa de Comissió de Festes · Pepica ${pepica}` })).toBe(botons[1]);
  expect(screen.getByRole('button', { name: `Obri la conversa de Comissió de Festes · Tu ${tu}` })).toBe(botons[2]);
  expect(screen.getByRole('button', { name: `Obri la conversa de Vicent Ferris · Vicent ${vicent}` })).toBe(botons[0]);
});

/* Revisió 261004 (Relleus 4-12) · String.replace amb una cadena interpreta
   $&, $`, $' i $$: el nom d'un grup, que el posa la gent, arribava deformat
   al nom accessible. Amb una funció de reemplaçament arriba literal. */
test('un nom de grup amb «$&», «$$», «$`» o «$\'» arriba literal al nom accessible', () => {
  const nom = "Penya $& amics $$ i $` o $' fi";
  pinta({
    fils: [{ id: 'f-penya', name: nom, tipus: 'grup' }],
    missatgesPerFil: { 'f-penya': [{ id: 'p1', seq: 1, sender: 'other', author: 'Pepica', text: 'https://socdepoble.org/penya', creatAl: '2026-10-03T18:00:00Z' }] }
  });
  fireEvent.click(segment('Enllaços'));
  const boto = document.querySelector('.sdp-xat-multimedia__conversa');
  const hora = boto.querySelector('time').textContent;
  expect(boto.getAttribute('aria-label')).toBe(`Obri la conversa de ${nom} · Pepica ${hora}`);
});

/* v1.2.25 · Lot G1 · Fitxers, Documents i Enllaços usen EstatBuit + Alerta canònics de Pedra Seca 2.0,
   i l'avís ja inclou fotos, vídeos, notes de veu i documents. */
test('Fitxers, Documents i Enllaços buits: EstatBuit + Alerta canònics (sense construcció obsoleta)', () => {
  pinta({ missatgesPerFil: { 'f-festes': [{ id: 'x', seq: 1, text: 'Hola', creatAl: '2026-10-03T18:00:00Z' }] } });
  let regio = screen.getByRole('region', { name: 'Fitxers' });
  expect(regio.querySelector('.sdp-buit')).toBeTruthy();
  expect(regio.querySelector('.sdp-alerta').textContent).toContain('documents (PDF, CSV, ODT, DOCX, TXT)');
  expect(regio.textContent).toContain('les fotos i els vídeos');
  fireEvent.click(segment('Documents'));
  regio = screen.getByRole('region', { name: 'Documents' });
  expect(regio.querySelector('.sdp-buit')).toBeTruthy();
  expect(regio.querySelector('.sdp-alerta').textContent).toContain('documents (PDF, CSV, ODT, DOCX, TXT)');
  expect(regio.textContent).toContain('els documents');
  fireEvent.click(segment('Enllaços'));
  expect(screen.getByRole('status').textContent).toContain("Encara no s'ha compartit cap enllaç en les converses obertes.");
});

test('l’avís local és a totes les pestanyes', () => {
  pinta();
  for (const nom of ['Fitxers', 'Enllaços', 'Documents']) {
    fireEvent.click(segment(nom));
    expect(document.querySelector('.sdp-xat-resultats__avis').textContent)
      .toBe('Només es veu el contingut de les converses obertes en esta sessió.');
  }
});

test('si arriben adjunts, una fila per element amb la icona del tipus (sense miniatura si no té adjunt.id), que obri la conversa', () => {
  const onObriFil = vi.fn();
  pinta({
    onObriFil,
    missatgesPerFil: { 'f-vicent': [
      { id: 'i1', seq: 1, tipus: 'imatge', text: 'La plaça', creatAl: '2026-10-04T08:00:00Z' },
      { id: 'd1', seq: 2, tipus: 'document', text: 'acta.pdf', creatAl: '2026-10-04T09:00:00Z' }
    ] }
  });
  const fitxers = screen.getByRole('region', { name: 'Fitxers' });
  const fila = within(fitxers).getByRole('button');
  expect(fila.textContent).toContain('Vicent Ferris');
  expect(fila.textContent).toContain('Fotos · La plaça');
  expect(fila.querySelector('svg.lucide-camera')).toBeTruthy();
  expect(fila.className).toBe('sdp-xat-fila sdp-xat-fila--senzilla');
  expect(fila.querySelector(':scope > .sdp-xat-avatar-icona > svg').getAttribute('width')).toBe('24');
  expect(fitxers.querySelector('img')).toBeNull();
  fireEvent.click(fila);
  expect(onObriFil).toHaveBeenCalledWith('f-vicent');
  fireEvent.click(segment('Documents'));
  expect(within(screen.getByRole('region', { name: 'Documents' })).getByRole('button').textContent).toContain('Documents · acta.pdf');
});

test('tradueix amb la clau: el t de l’app rep les claus i18n', () => {
  const tr = vi.fn((clau) => `«${clau}»`);
  render(<VistaMultimedia titol="Contingut multimèdia" fils={FILS} missatgesPerFil={MISSATGES} t={tr} />);
  expect(screen.getByRole('group', { name: '«section.xat.vista.multimedia.tipus»' })).toBeTruthy();
  expect(document.querySelector('.sdp-xat-resultats__avis').textContent).toBe('«section.xat.vista.multimedia.avisLocal»');
  expect(document.querySelector('.sdp-buit')).toBeTruthy();
  /* CR-03 (Gauntlet de la integració v1.2.25) · L'avís dels adjunts torna a passar pel t de l'app amb la clau canònica
     (els cinc diccionaris), com abans de G1; el kit el pintava amb el diccionari paral·lel i la prova se n'havia oblidat. */
  expect(document.querySelector('.sdp-alerta').textContent).toBe('«section.xat.vista.multimedia.avisAdjunts»');
  expect(tr).toHaveBeenCalledWith('section.xat.vista.multimedia.avisAdjunts', TEXTOS_MULTIMEDIA.avisAdjunts[1]);
});
