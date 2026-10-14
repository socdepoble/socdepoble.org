import {render,fireEvent,screen,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,expect,test,vi} from 'vitest';
const mocks=vi.hoisted(()=>({navigate:vi.fn(),identitat:{actorId:null},session:{currentUser:null}}));
vi.mock('../../app/contexts/IdentitatContext.jsx',()=>({useIdentitat:()=>mocks.identitat}));
vi.mock('../../app/contexts/CoreContentContext.jsx',()=>({useCoreContent:()=>({agents:[]})}));
vi.mock('../../app/contexts/SessionContext.jsx',()=>({useSession:()=>mocks.session}));
/* Onada 8 (261009, revisió) · La boina de la targeta viva és un Link quan se sap qui signa. */
vi.mock('../../app/contexts/RouterContext',()=>({useNavigate:()=>mocks.navigate,Link:({to,children,...rest})=><a href={to} {...rest}>{children}</a>}));
vi.mock('../../components/universal/NotificationContext.jsx',()=>({useToast:()=>({showToast:vi.fn()})}));
import {NotaFitxa} from './NotaFitxa.jsx';
import {ID_NOTA_BENVINGUDA,autoriaDeNota,signaturaDeNota} from './autoriaNota.js';
import {RUTA_PERFIL_PROJECTE} from '../../config/navigation.js';
import {AVISOS_TARGETA_VIVA} from '../../components/universal/TargetaViva.jsx';
import {CLAU_APAGADA,ESDEVENIMENT_DOM} from '../../data/telemetria.js';
import {DEFAULT_AUTHOR} from '../../components/universal/UniversalUtils.js';
import {ENTITAT_PILOT_SLUG} from '../../data/identitatsSeed.js';
/* `window.umami` d'amfitrió: el Connectar compta sense backend i cap prova toca la xarxa. */
let vistos;
const escolta=(event)=>vistos.push(event.detail);
beforeEach(()=>{vistos=[];mocks.identitat={actorId:null};mocks.session={currentUser:null};window.localStorage.removeItem(CLAU_APAGADA);window.umami={track:vi.fn()};window.addEventListener(ESDEVENIMENT_DOM,escolta);});
afterEach(()=>{cleanup();vi.clearAllMocks();window.removeEventListener(ESDEVENIMENT_DOM,escolta);delete window.umami;});

/* L'element de la llista com el fa NotesSection (toWorkspaceNote): `data` és la nota crua. */
const nota=(data,extra={})=>({id:data.id,title:data.title||'',subtitle:data.formattedDate,updatedAt:data.updatedAt,data,...extra});
const PROVA=nota({id:'n7',title:'Prova',formattedDate:'02/01/26',formattedTime:'09:37',updatedAt:'2026-01-02T08:37:00Z'});

/* T50 · Sense «(i)» a la caputxa (sdp-universal-page §1.C): l'avís ix en clicar una acció. */
for(const label of [/Data i hora:/,/Traduir Prova/,/Comentar Prova/,/Compartir Prova/,/CONNECTAR amb Prova/])test(`previsualització ${label} obri avís sense navegar`,()=>{
  const alert=vi.spyOn(window,'alert');
  render(<NotaFitxa active item={PROVA} onSelect={vi.fn()}/>);
  fireEvent.click(screen.getByRole('button',{name:label}));
  expect(screen.getByRole('dialog').open).toBe(true);
  expect(screen.getByRole('heading',{name:'Això és una previsualització'})).toBeTruthy();
  expect(mocks.navigate).not.toHaveBeenCalled();expect(alert).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Tancar'}));
  expect(document.querySelector('dialog').open).toBe(false);
  alert.mockRestore();
});

test('T50 · la targeta activa ja no porta el botó «(i)» d’informació a la caputxa', () => {
  const { container } = render(<NotaFitxa active item={PROVA} onSelect={vi.fn()} />);
  expect(screen.queryByRole('button', { name: /Informació de previsualització/ })).toBeNull();
  expect(container.querySelector('.sp-card-header .btn-icon-orange')).toBeNull();
  expect(container.querySelector('article.sp-card--pla.sdp-nota-fitxa-viva')).not.toBeNull();
});

test('CONNECTAR de la previsualització compta un event marcat com a previsualització i obri el diàleg igual', () => {
  window.history.replaceState(null, '', '/notes');
  render(<NotaFitxa active item={PROVA} onSelect={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /CONNECTAR amb Prova/ }));
  expect(screen.getByRole('dialog').open).toBe(true);
  const connectars = vistos.filter((intent) => intent.nom === 'connectar');
  expect(connectars).toHaveLength(1);
  expect(connectars[0].dades).toEqual({ seccio: 'notes', origen: 'targeta', mode: 'previsualitzacio' });
  expect(window.umami.track).toHaveBeenCalledWith('connectar', { seccio: 'notes', origen: 'targeta', mode: 'previsualitzacio' });
  expect(JSON.stringify(connectars[0])).not.toContain('Prova');
  expect(mocks.navigate).not.toHaveBeenCalled();
});

test('els altres botons de la previsualització no compten com a Connectar', () => {
  render(<NotaFitxa active item={nota({ id: 'n7', title: 'Prova' })} onSelect={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Comentar Prova/ }));
  expect(screen.getByRole('dialog').open).toBe(true);
  expect(vistos.filter((intent) => intent.nom === 'connectar')).toHaveLength(0);
});

test('una nota buida ensenya a la targeta els mateixos textos de llavor que l’editor', async () => {
  const { TEXTOS_LLAVOR } = await import('../../components/universal/textosLlavor.js');
  const buida = { ...nota({ id: 'n9', title: '', formattedDate: '25/09/26', updatedAt: '2026-09-25T09:00:00Z' }), excerpt: '' };
  render(<NotaFitxa item={buida} onSelect={vi.fn()} />);
  expect(screen.getByText(TEXTOS_LLAVOR.titol)).toBeTruthy();
  expect(screen.getByText(TEXTOS_LLAVOR.entradilla)).toBeTruthy();
  cleanup();
  render(<NotaFitxa active item={buida} onSelect={vi.fn()} />);
  expect(screen.getByText(TEXTOS_LLAVOR.subtitol)).toBeTruthy();
  expect(screen.getByText(TEXTOS_LLAVOR.entradilla)).toBeTruthy();
});

/* T51 · La targeta viva és una previsualització d'EDICIÓ: sense data triada,
   la d'ara (rellotge fals; només Date), MAI la de l'última edició de la nota. */
test('la preview usa labels, data/hora i copyright del mateix model, sense hardcodes de n1', () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 28, 10, 7));
  try {
    const item = nota(
      { id: 'n1', title: 'Prova', formattedDate: '02/01/26', formattedTime: '09:37', updatedAt: '2026-01-02T08:37:00Z', copyright: '© Sóc de Poble / Fet per la IAIA i Nano Banana' },
      { labels: [{ text: 'Sistema', className: 'sdp-badge-category' }, { text: 'Etiqueta nova', className: 'sdp-badge-tag' }] }
    );
    render(<NotaFitxa active item={item} onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Data i hora: 10:07: 28/09/26' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /02\/01\/26/ })).toBeNull();
    expect(screen.getByText('Sistema')).toBeTruthy();
    expect(screen.getByText('Etiqueta nova')).toBeTruthy();
    expect(screen.queryByText('Tutorial')).toBeNull();
    expect(screen.getByText('© Sóc de Poble / Fet per la IAIA i Nano Banana')).toBeTruthy();
  } finally { vi.useRealTimers(); }
});

/* ── T50 · els defectes de la previsualització d'abans (D1–D4) ─────────── */
test('D1 · subtítol i entradilla es pinten en text pla: res de &nbsp; ni <b> literals', () => {
  const item = nota({ id: 'n7', title: '<p>Prova</p>', subtitle: 'Del&nbsp;<b>Mas</b>', lead: '<p><b>Hola</b>&nbsp;món</p>' });
  const { container } = render(<NotaFitxa active item={item} onSelect={vi.fn()} />);
  expect(container.querySelector('.sp-card-title').textContent).toBe('Prova');
  expect(container.querySelector('.sp-card-subtitle').textContent).toBe('Del Mas');
  expect(container.querySelector('.sp-card-text').textContent).toBe('Hola món');
  expect(container.textContent).not.toMatch(/&nbsp;|<b>/);
});

test('D2 · amb una entitat activa, la targeta signa com la barra taronja de l’editor (l’entitat, mai la persona)', () => {
  mocks.session = { currentUser: { id: 'U', user_metadata: { name: 'Pepa', avatar_url: 'https://exemple.org/pepa.png', town_name: 'Benifallim' } } };
  mocks.identitat = { actorId: 'O', actor: { tipus: 'entitat', id: 'O', nom: 'Forn & Cia', avatar: 'https://exemple.org/forn.png' } };
  const { container } = render(<NotaFitxa active item={PROVA} onSelect={vi.fn()} />);
  const esperat = autoriaDeNota({ notaId: 'n7', actor: mocks.identitat.actor, actorId: 'O', agents: [], currentUser: mocks.session.currentUser });
  expect(esperat).toEqual({ nom: 'Forn & Cia', avatar: 'https://exemple.org/forn.png', poble: '' });
  expect(container.querySelector('.sp-card-author-name').textContent).toBe('Forn & Cia');
  expect(container.querySelector('img.sp-card-avatar').getAttribute('src')).toBe('https://exemple.org/forn.png');
  expect(container.querySelector('.sp-card-author-location')).toBeNull();
  expect(container.textContent).not.toContain('Pepa');
});

/* Onada 8 (261009, revisió) · La boina de la targeta viva porta on la barra
   taronja de l'editor (signaturaDeNota): l'entitat activa, a la seua fitxa;
   la benvinguda, al perfil de Sóc de Poble; el Foraster, cap enllaç. */
test('Onada 8 · la boina de la targeta viva porta a la pàgina de qui signa, la mateixa de la barra taronja', () => {
  mocks.session = { currentUser: { id: 'U', user_metadata: { name: 'Pepa' } } };
  mocks.identitat = { actorId: 'O', actor: { tipus: 'entitat', id: 'O', nom: 'Forn & Cia' } };
  const { container, unmount } = render(<NotaFitxa active item={PROVA} onSelect={vi.fn()} />);
  const ruta = signaturaDeNota({ notaId: 'n7', actor: mocks.identitat.actor, actorId: 'O', agents: [], currentUser: mocks.session.currentUser }).ruta;
  expect(ruta).toBe('/empresa/O');
  expect(container.querySelector('.sp-card-header a.sp-card-author-link').getAttribute('href')).toBe(ruta);
  unmount();
  const benvinguda = render(<NotaFitxa active item={nota({ id: ID_NOTA_BENVINGUDA, title: 'Benvinguda' })} onSelect={vi.fn()} />);
  expect(benvinguda.container.querySelector('.sp-card-header a.sp-card-author-link').getAttribute('href')).toBe(RUTA_PERFIL_PROJECTE);
  benvinguda.unmount();
  mocks.session = { currentUser: null };
  mocks.identitat = { actorId: null };
  const foraster = render(<NotaFitxa active item={PROVA} onSelect={vi.fn()} />);
  expect(foraster.container.querySelector('.sp-card-header a.sp-card-author-link')).toBeNull();
});

/* Prompt 261014_0400 (ordre del Mestre, tasca 4) · La boina de la targeta viva
   signa com la barra taronja de l'editor: actuant com a Sóc de Poble (el slug
   declarat de la fila, amb un id UUID) i sense logo a la fila, el PNG verd
   oficial, el seu nom, el seu poble i el seu perfil; mai la silueta. */
test('prompt 261014_0400 · actuant com a Sóc de Poble sense logo, la boina porta el PNG verd oficial i cap silueta', () => {
  const uuid = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  mocks.session = { currentUser: { id: 'U', user_metadata: { name: 'Pepa', avatar_url: 'https://exemple.org/pepa.png', town_name: 'Benifallim' } } };
  mocks.identitat = { actorId: uuid, actor: { tipus: 'entitat', id: uuid, slug: ENTITAT_PILOT_SLUG, nom: 'Sóc de Poble', avatar: null, rol: 'owner' } };
  const { container } = render(<NotaFitxa active item={PROVA} onSelect={vi.fn()} />);
  const boina = container.querySelector('.sp-card-header');
  expect(DEFAULT_AUTHOR.avatarUrl).toBe('/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png');
  expect(boina.querySelector('img.sp-card-avatar').getAttribute('src')).toBe(DEFAULT_AUTHOR.avatarUrl);
  expect(boina.querySelector('.sp-card-avatar--fallback')).toBeNull();
  expect(boina.querySelector('svg.lucide-user-round')).toBeNull();
  expect(boina.querySelector('.sp-card-author-name').textContent).toBe(DEFAULT_AUTHOR.name);
  expect(boina.querySelector('.sp-card-author-location').textContent).toBe(DEFAULT_AUTHOR.location);
  expect(boina.querySelector('a.sp-card-author-link').getAttribute('href')).toBe(RUTA_PERFIL_PROJECTE);
  expect(container.textContent).not.toContain('Pepa');
});

test('D3 · la data de la targeta és la de publicació triada (T40), no la d’última edició', () => {
  const publicacio = new Date(2026, 9, 3, 18, 30);
  const item = nota({ id: 'n7', title: 'Prova', formattedDate: '02/01/26', formattedTime: '09:37', updatedAt: '2026-01-02T08:37:00Z', publishDate: publicacio.toISOString() });
  render(<NotaFitxa active item={item} onSelect={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Data i hora: 18:30: 03/10/26' })).toBeTruthy();
});

test('D4 · només l’emoticona triada (camp cru) va al centre de la caputxa; mai la 🪶 de la llista', () => {
  const triada = nota({ id: 'n7', title: 'Prova', icon: '🍅' }, { icon: '🍅' });
  const { container, unmount } = render(<NotaFitxa active item={triada} onSelect={vi.fn()} />);
  expect(container.querySelector('.sp-card-header--amb-emoticona .sdp-emoticona-barra').textContent).toBe('🍅');
  unmount();
  // El model de vista porta la ploma per defecte (T34), però la nota no té emoticona.
  const perDefecte = nota({ id: 'n8', title: 'Prova' }, { icon: '🪶' });
  const altra = render(<NotaFitxa active item={perDefecte} onSelect={vi.fn()} />);
  expect(altra.container.querySelector('.sdp-emoticona-barra')).toBeNull();
  expect(altra.container.querySelector('.sp-card-header--amb-emoticona')).toBeNull();
  expect(altra.container.textContent).not.toContain('🪶');
});

/* ── Poliment T50 (revisió: D1 i D5) ───────────────────────────────────── */
test('D1 · l’avís de la targeta del Bloc parla de la publicació al Mur', () => {
  render(<NotaFitxa active item={PROVA} onSelect={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Comentar Prova/ }));
  const avis = screen.getByRole('dialog', { name: 'Això és una previsualització' });
  expect(avis.textContent).toContain(AVISOS_TARGETA_VIVA.notes.descripcio);
  expect(avis.textContent).toContain('una vegada publicada al Mur');
});

test('D5 · la targeta viva exposa que és la fitxa triada (aria-current="true"), com la compacta', () => {
  const onSelect = vi.fn();
  const { container } = render(<NotaFitxa active item={PROVA} onSelect={onSelect} />);
  const principal = screen.getByRole('button', { name: 'Prova' });
  expect(principal.getAttribute('aria-current')).toBe('true');
  expect(container.querySelectorAll('[aria-current]')).toHaveLength(1);
  fireEvent.click(principal);
  expect(onSelect).toHaveBeenCalledTimes(1);
  cleanup();
  const inactiva = render(<NotaFitxa item={PROVA} onSelect={vi.fn()} />);
  expect(inactiva.container.querySelectorAll('[aria-current]')).toHaveLength(0);
});

/* Ordre del Mestre (261007) · L'emoji XL ocupa el buit de la imatge: a la
   targeta viva, el quadrat (squareBadge) amb la classe del catàleg; a la
   fitxa compacta, el quadrat de la fitxa. Amb imatge, cap insígnia. */
test('261007 · sense imatge, l’emoticona triada ocupa el quadrat de la targeta viva en XL; amb imatge, cap insígnia', () => {
  const triada = nota({ id: 'n7', title: 'Prova', icon: '🍅' }, { icon: '🍅' });
  const { container, unmount } = render(<NotaFitxa active item={triada} onSelect={vi.fn()} />);
  const quadrat = container.querySelector('.sp-card-body.has-aside > .sp-card-calendar-badge');
  /* Revisió del 261007 (M2-08) · El títol ja el diu la targeta: el quadrat
     és decoratiu (amagat, sense nom que el repetisca). */
  expect(quadrat.getAttribute('aria-hidden')).toBe('true');
  expect(quadrat.hasAttribute('aria-label')).toBe(false);
  const emoji = quadrat.querySelector('.sp-card-calendar-badge__emoji');
  expect([emoji.textContent, emoji.getAttribute('aria-hidden')]).toEqual(['🍅', 'true']);
  // La caputxa conserva l'emoticona triada (Pedra Seca §10).
  expect(container.querySelector('.sp-card-header--amb-emoticona .sdp-emoticona-barra').textContent).toBe('🍅');
  unmount();
  // Amb imatge (la de la llista, coverImage || heroImage), la imatge i cap quadrat.
  const ambImatge = render(<NotaFitxa active item={{ ...triada, image: '/assets/portada.webp' }} onSelect={vi.fn()} />);
  expect(ambImatge.container.querySelector('img.sp-card-media')).not.toBeNull();
  expect(ambImatge.container.querySelector('.sp-card-calendar-badge')).toBeNull();
  ambImatge.unmount();
  // Sense emoticona triada (la 🪶 és la reserva de la llista): cap quadrat.
  const perDefecte = render(<NotaFitxa active item={nota({ id: 'n8', title: 'Prova' }, { icon: '🪶' })} onSelect={vi.fn()} />);
  expect(perDefecte.container.querySelector('.sp-card-calendar-badge')).toBeNull();
});

test('261007 · la fitxa compacta sense imatge pinta l’emoji en XL', () => {
  const { container } = render(<NotaFitxa item={nota({ id: 'n7', title: 'Prova', icon: '🍅' }, { icon: '🍅' })} onSelect={vi.fn()} />);
  const glif = container.querySelector('.sdp-gestor-fitxa__media .sdp-gestor-fitxa__inicial');
  expect([glif.textContent, glif.className]).toEqual(['🍅', 'sdp-gestor-fitxa__inicial sdp-fitxa-emoji-xl']);
});

test('la fitxa inactiva continua sent la compacta de sempre', () => {
  const { container } = render(<NotaFitxa item={{ ...PROVA, excerpt: 'Resum' }} onSelect={vi.fn()} />);
  const fitxa = container.querySelector('button.sdp-gestor-fitxa');
  expect(fitxa).not.toBeNull();
  expect(container.querySelector('.sp-card')).toBeNull();
  expect(fitxa.querySelector('.sdp-gestor-fitxa__titol').textContent).toBe('Prova');
  expect(fitxa.querySelector('time.sdp-nota-fitxa__data').textContent).toBe('02/01/26');
});
