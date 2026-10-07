/**
 * Ordre del Mestre (261007) · «No vull cards inventades, vull cards de
 * veritat». La targeta incrustada es pinta amb les dades vives de l'original
 * (useOriginalDeConnexio) com la miniatura de la seua UniversalPage, en
 * lectura (CosAmbTargetes, p. ex. «Drets d'autor» dins de «Legal i
 * privacitat») i a l'editor (TargetaIncrustadaNodeView). Sense original, la
 * instantània de sempre.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, renderHook, waitFor } from '@testing-library/react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn(), t: (_, alternativa) => alternativa }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
/* El patró de detailRichText.test.jsx: Link com un <a> que conserva `to`. */
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children }) => React.createElement('div', { 'data-pagina': '' }, children)
}));
import TextSection from '../text/TextSection.jsx';
import { PAGE_COPY } from '../text/pageContent.js';
import { COPYRIGHT_SDP } from '../../components/universal/editorial.js';
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { TargetesIncrustades } from '../../components/universal/richText/extensions/targetes/targetesIncrustades.js';
import { TargetesIncrustadesContext } from '../../components/universal/richText/extensions/targetes/TargetesIncrustadesContext.js';
import { CosAmbTargetes } from '../../components/universal/richText/extensions/targetes/CosAmbTargetes.jsx';
import { segmentsAmbTargetes } from '../../components/universal/richText/extensions/targetes/formaDelGrup.js';
import { sanitizeHtml } from '../../utils/sanitize';
import { ProveidorSincronitzacioTargetes, origenDeTargeta, propsDeLOriginal, useDadesDeLOriginal } from './SincronitzacioTargetes.jsx';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const DRETS = { clau: 'pagina:drets-autor', ruta: '/page/drets-autor', titol: "Drets d'autor" };
const COMIC = '/assets/nano_cards/drets_autor_comic.jpg';

describe('origenDeTargeta: la secció i l’id de la clau, i la ruta', () => {
  test('un element d’una secció es resol per secció i id; una pàgina, per la ruta', () => {
    expect(origenDeTargeta({ clau: 'producte:9', ruta: '/mercat/9' })).toEqual({ sectionId: 'mercat', itemId: '9', ruta: '/mercat/9' });
    expect(origenDeTargeta({ clau: 'publicacio:p1', ruta: '/mur/p1' })).toEqual({ sectionId: 'mur', itemId: 'p1', ruta: '/mur/p1' });
    expect(origenDeTargeta(DRETS)).toEqual({ sectionId: null, itemId: null, ruta: '/page/drets-autor' });
  });

  test('sense clau vàlida no hi ha origen, i una ruta externa no passa', () => {
    expect(origenDeTargeta({ clau: 'nota:1', ruta: '/notes/1' })).toBeNull();
    expect(origenDeTargeta({ ruta: '/page/drets-autor' })).toBeNull();
    expect(origenDeTargeta({ clau: 'pagina:x', ruta: 'https://fora.example/x' })).toEqual({ sectionId: null, itemId: null, ruta: '' });
  });
});

describe('useDadesDeLOriginal: una pàgina, la miniatura de la seua UniversalPage', () => {
  const sincronitzada = (attrs) => renderHook(() => useDadesDeLOriginal(attrs)).result.current;

  test('«Drets d’autor»: tot el de la seua pàgina, de PAGE_COPY, i la boina de Sóc de Poble', () => {
    const pagina = PAGE_COPY['drets-autor'];
    expect(sincronitzada(DRETS)).toEqual({
      title: pagina.title,
      subtitle: pagina.subtitle,
      body: pagina.lead,
      imageUrl: COMIC,
      imageAlt: pagina.imageAlt,
      imatgePrivada: false,
      labels: [{ text: 'Sistema', className: 'sdp-badge-system' }],
      copyright: COPYRIGHT_SDP,
      time: '00:00',
      date: '30/01/26',
      dateTime: expect.stringMatching(/^2026-01-30/),
      author: 'Sóc de Poble',
      authorHref: '/projecte',
      avatarUrl: DEFAULT_AUTHOR.avatarUrl,
      location: 'La Torre de les Maçanes'
    });
  });

  test('una instantània vella no mana: el títol i la imatge són els de l’original', () => {
    const props = sincronitzada({ ...DRETS, titol: 'Títol vell', imatge: '/assets/vella.png', entradilla: 'Vella' });
    expect([props.title, props.imageUrl, props.body]).toEqual(["Drets d'autor", COMIC, PAGE_COPY['drets-autor'].lead]);
  });

  test('«El Xat» porta la seua acció gran, la mateixa porta de la targeta del Mur', () => {
    const props = sincronitzada({ clau: 'pagina:xat', ruta: '/page/xat', titol: 'El Xat' });
    expect(props.title).toBe(PAGE_COPY.xat.title);
    expect(props.accio.type).toBe(PortaDePagina);
    expect(props.accio.props.porta).toMatchObject({ id: expect.any(String), desti: '/xat', varietat: 'primari' });
  });

  test('una pàgina que no existix, una clau no vàlida o una secció sense dades: null (la instantània)', () => {
    expect(sincronitzada({ clau: 'pagina:no-hi-es', ruta: '/page/no-hi-es', titol: 'No' })).toBeNull();
    expect(sincronitzada({ clau: 'nota:1', ruta: '/notes/1', titol: 'Nota' })).toBeNull();
    // Sense proveïdor del Mur, la font encara carrega: cap invent.
    expect(sincronitzada({ clau: 'publicacio:p1', ruta: '/mur/p1', titol: 'Festa' })).toBeNull();
  });
});

describe('propsDeLOriginal: un element d’una secció, la miniatura de la seua pàgina de detall', () => {
  const MERCAT = {
    id: 'mercat',
    label: 'Mercat',
    getTitle: (item) => item.name,
    getSubtitle: () => 'Producte de proximitat',
    getImage: (item) => item.images[0]
  };

  test('amb autor propi: el seu nom, el seu poble i el seu avatar', () => {
    const item = { id: 'mel', name: 'Mel de romer', entradilla: 'Collita de setembre', images: ['/assets/mel.png'], author_name: 'Pep', author_location: 'Ador', author_avatar: '/assets/pep.png', created_at: '2026-05-01T10:00:00+02:00' };
    const props = propsDeLOriginal({ tipus: 'seccio', section: MERCAT, item }, mocks.t);
    expect(props).toMatchObject({
      title: 'Mel de romer',
      subtitle: 'Producte de proximitat',
      body: 'Collita de setembre',
      imageUrl: '/assets/mel.png',
      author: 'Pep',
      location: 'Ador',
      avatarUrl: '/assets/pep.png',
      labels: [{ text: 'Mercat', className: 'sdp-badge-system' }, { text: 'mel', className: 'sdp-badge-category' }],
      copyright: COPYRIGHT_SDP,
      time: '10:00'
    });
    // Un autor propi sense pàgina coneguda: cap enllaç inventat.
    expect(props.authorHref).toBeUndefined();
    expect(props.accio).toBeUndefined();
  });

  test('sense autor: signa Sóc de Poble, amb el seu avatar i el seu poble (la regla de la barra taronja)', () => {
    const item = { id: 'oli', name: 'Oli', images: ['/assets/oli.png'] };
    expect(propsDeLOriginal({ tipus: 'seccio', section: MERCAT, item }, mocks.t)).toMatchObject({
      author: 'Sóc de Poble', authorHref: '/projecte', avatarUrl: DEFAULT_AUTHOR.avatarUrl, location: 'La Torre de les Maçanes'
    });
  });

  test('sense original resolt, null', () => {
    expect(propsDeLOriginal(null, mocks.t)).toBeNull();
    expect(propsDeLOriginal({ tipus: null }, mocks.t)).toBeNull();
    expect(propsDeLOriginal({ tipus: 'seccio', section: MERCAT, item: null }, mocks.t)).toBeNull();
  });
});

describe('lectura: «Drets d’autor» dins de «Legal i privacitat», una targeta de veritat', () => {
  const cartaDe = (container) => container.querySelector('.sdp-targetes > .sdp-targeta > article.sp-card');

  test('amb el proveïdor de l’app: el còmic, l’avatar, el poble, el rellotge, «Sistema» i els drets', () => {
    const { container } = render(
      <ProveidorSincronitzacioTargetes>
        <TextSection page={PAGE_COPY.legal} pageKey="legal" />
      </ProveidorSincronitzacioTargetes>
    );
    const carta = cartaDe(container);
    expect(carta.querySelector('.sp-card-media-container img').getAttribute('src')).toBe(COMIC);
    expect(carta.querySelector('img.sp-card-avatar').getAttribute('src')).toBe(DEFAULT_AUTHOR.avatarUrl);
    expect(carta.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
    expect(carta.querySelector('.sp-card-author-location').textContent).toBe('La Torre de les Maçanes');
    expect(carta.querySelector('.sp-card-meta').textContent).toContain('00:00');
    expect(carta.querySelector('.sp-card-meta').textContent).toContain('30/01/26');
    expect([...carta.querySelectorAll('.sp-card-label')].map((etiqueta) => etiqueta.textContent)).toEqual(['Sistema']);
    expect(carta.querySelector('.sp-card-copyright').textContent).toBe(COPYRIGHT_SDP);
    // La targeta continua portant a la seua pàgina, i la boina al projecte.
    expect(carta.querySelector('a.sp-card-link-overlay').getAttribute('to')).toBe('/page/drets-autor');
    expect(carta.querySelector('.sp-card-header a.sp-card-author-link').getAttribute('to')).toBe('/projecte');
  });

  test('TextSection ja porta el proveïdor: «Legal» es pinta sincronitzada sense res més', () => {
    const carta = cartaDe(render(<TextSection page={PAGE_COPY.legal} pageKey="legal" />).container);
    expect(carta.querySelector('.sp-card-media-container img').getAttribute('src')).toBe(COMIC);
    expect(carta.querySelector('.sp-card-author-location').textContent).toBe('La Torre de les Maçanes');
  });

  test('sense proveïdor (un cos llegit fora de l’app): la instantània de l’HTML, com abans', () => {
    const segments = segmentsAmbTargetes(sanitizeHtml(PAGE_COPY.legal.html));
    const carta = cartaDe(render(<CosAmbTargetes segments={segments} className="cms-preview" />).container);
    expect(carta.querySelector('.sp-card-title').textContent).toBe("Drets d'autor");
    expect(carta.querySelector('.sp-card-media-container')).toBeNull();
    expect(carta.querySelector('.sp-card-author-location')).toBeNull();
  });
});

/* On es munta el proveïdor: als quatre llocs que pinten targetes
   incrustades, tots de càrrega tardana; mai a App.jsx (el paquet inicial) ni
   a detailRichText.jsx (cicle d'importacions). */
describe('els llocs del proveïdor', () => {
  const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
  const MUNTA = /<ProveidorSincronitzacioTargetes>/;
  const IMPORTA = /import \{ ProveidorSincronitzacioTargetes \} from '[^']*SincronitzacioTargetes\.jsx';/;

  test.each([
    'src/sections/text/TextSection.jsx',
    'src/sections/notes/NotesSection.jsx',
    'src/sections/detail/ItemDetailSection.jsx',
    'src/sections/profile/PerfilPublicSection.jsx'
  ])('%s l’importa i el munta', (ruta) => {
    const codi = llig(ruta);
    expect(codi).toMatch(IMPORTA);
    expect(codi).toMatch(MUNTA);
  });

  test('ni App.jsx (el paquet inicial) ni detailRichText.jsx (cicle) no el carreguen', () => {
    for (const ruta of ['src/app/App.jsx', 'src/sections/detail/detailRichText.jsx', 'src/sections/detail/detailSectionMeta.jsx']) {
      expect(llig(ruta), ruta).not.toMatch(/SincronitzacioTargetes/);
    }
  });
});

describe('editor: la previsualització també és la targeta de veritat', () => {
  const HTML = `<p>Intro</p><div data-sdp-targetes="" data-alineacio="dreta"><div data-sdp-targeta="pagina:drets-autor" data-ruta="/page/drets-autor" data-titol="Títol vell" data-entradilla="Vella"></div></div><p>Text</p>`;

  function Banc({ avisa }) {
    const editor = useEditor({ extensions: [StarterKit, TargetesIncrustades], content: HTML, immediatelyRender: true });
    return (
      <ProveidorSincronitzacioTargetes>
        <TargetesIncrustadesContext.Provider value={{ avisa, t: mocks.t }}>
          <EditorContent editor={editor} />
        </TargetesIncrustadesContext.Provider>
      </ProveidorSincronitzacioTargetes>
    );
  }

  test('les dades vives de la pàgina; l’HTML desat no canvia i els enllaços avisen sense navegar', async () => {
    const avisa = vi.fn();
    const { container } = render(<Banc avisa={avisa} />);
    await waitFor(() => expect(container.querySelector('.sdp-targeta .sp-card')).not.toBeNull());
    const carta = container.querySelector('.sdp-targeta article.sp-card');
    expect(carta.querySelector('.sp-card-title').textContent).toBe("Drets d'autor");
    expect(carta.querySelector('.sp-card-text').textContent).toBe(PAGE_COPY['drets-autor'].lead);
    expect(carta.querySelector('.sp-card-media-container img').getAttribute('src')).toBe(COMIC);
    expect(carta.querySelector('.sp-card-author-location').textContent).toBe('La Torre de les Maçanes');
    // En edició, la targeta sencera no navega (cap vel d'enllaç).
    expect(carta.querySelector('.sp-card-link-overlay')).toBeNull();
    // La instantània desada continua sent la reserva, intacta.
    const node = container.querySelector('.ProseMirror [data-sdp-targeta="pagina:drets-autor"]');
    expect(node).not.toBeNull();
    carta.querySelector('.sp-card-header a.sp-card-author-link').click();
    expect(avisa).toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
