/**
 * T51 · Prova de contracte de la barra taronja en MODE LECTURA.
 *
 * Regla del Mestre (28-09-2026), vinculant: «Cap document existeix sense
 * data.» En lectura la pastilla mostra la data de creació, o la de l'última
 * modificació o versió si és posterior (editorial.js · dataDeDocument). Mai
 * buida, mai guionets, mai inventada.
 *
 * Recorre les pàgines de lectura principals amb la UniversalPage i el
 * PageFrame de veres i exigix, a cada una, la pastilla amb el dia «dd/mm/aa»
 * i l'hora «hh:mm». Quan la FONT és un dia sol (un `date` de frontmatter
 * sense hora, un acte de tot el dia), la pastilla porta el dia sol: l'hora no
 * s'inventa. El copy de les pàgines (mitjanit UTC exacta) és un instant i
 * porta hora (T4 del prompt 1140, ordre del Mestre 261001; abans, D5, era un
 * dia sol). Cada pàgina declara quina de les dues formes li toca. DateTimeControl no canvia de contracte (sense data no pinta
 * res): és esta prova la que detecta una pàgina que no en passa cap.
 *
 * Correcció W3A D2 · La forma no basta: una pàgina que pintara la data d'ara
 * també té «hh:mm dd/mm/aa». Per això cada pàgina es compara amb el VALOR
 * que dona la regla sobre les dates de la seua font (dataHoraDeBarra), el
 * rellotge de la prova és fals i llunyà (ARA_DE_LA_PROVA) i el servidor local
 * naix amb un rellotge injectat (NAIXEMENT_SEED): cap font no pot coincidir
 * amb «ara», i una pàgina de lectura que el pintara faria fallar la prova.
 *
 * Les fonts arriben pels camins de veres: els mapejadors de
 * supabase/perfils.js, el servidor local de localPerfils.js, el wikiManifest
 * generat i aplicacions.js. Les pàgines que HUI no tenen cap font real són a
 * PENDENTS, i cada pendent fixa la FONT (no una pàgina amb dades escrites a
 * mà): quan la font porte data, la prova falla i obliga a passar la pàgina a
 * la llista de les que en porten.
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* Objectes estables (hoisted): un valor nou a cada render entraria als deps
   de l'efecte de càrrega del perfil públic i el faria girar sense parar. */
const estat = vi.hoisted(() => {
  const t = (_, alternativa) => alternativa;
  return {
    itemId: null, search: '', params: {}, preloadedItem: null, capacitats: new Set(), perfil: null,
    accionsUI: { t, resolveAsset: (uri) => uri },
    estatUI: { externalConfig: {}, locale: 'ca-ES', language: 'ca' },
    identitat: { memberships: [], actor: null, setActor: () => {} }
  };
});

vi.mock('../../app/contexts/RouterContext', async () => {
  const { createElement } = await import('react');
  return {
    useNavigate: () => () => {},
    useParams: () => estat.params,
    useLocation: () => ({ pathname: '/', search: estat.search, state: estat.preloadedItem ? { preloadedItem: estat.preloadedItem } : null }),
    useSearchParams: () => [new URLSearchParams(estat.search), () => {}],
    Navigate: () => null,
    Link: ({ to, children, ...rest }) => createElement('a', { href: to, ...rest }, children)
  };
});
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => estat.accionsUI,
  useUIState: () => estat.estatUI
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => estat.identitat }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ logout: () => {}, currentUser: null }),
  useSessioOpcional: () => null
}));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (capacitat) => estat.capacitats.has(capacitat),
  loadPerfilPublic: async () => estat.perfil
}));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
vi.mock('../../sections/mur/MurContext', () => ({ useMur: () => ({ status: 'ready', events: [], feedPosts: [], marketItems: [] }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: [] }) }));
vi.mock('../../sections/notes/NotesDataContext', () => ({ useNotesData: () => ({ notes: [] }) }));
vi.mock('../../sections/multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ status: 'ready', mediaItems: [] }) }));
/* Els dos espais de treball (Wiki i Disseny) pinten el detall de l'element triat. */
vi.mock('../../components/universal/workspace/UniversalWorkspace.jsx', () => ({
  UniversalWorkspace: ({ model, renderDetail }) => renderDetail({ item: model.items.find((item) => item.id === estat.itemId) })
}));
vi.mock('../../sections/consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => null }));
vi.mock('../../sections/disseny/cataleg/detailRegistry', () => ({ CATALOG_DETAIL_LOADERS: { 'fonaments/contracte': () => null } }));
/* El manifest de la Wiki és el GENERAT, sencer, més tres documents de mostra
   de les formes de data que el lector sap llegir. */
vi.mock('../../data/wikiManifest.js', async (importOriginal) => {
  const { wikiManifest: real } = await importOriginal();
  const mostra = (id, attributes) => ({ id, title: id, subtitle: id, categoryId: 'folder:02_saber', tags: [], attributes, content: 'Text.' });
  return {
    wikiManifest: {
      categories: real.categories,
      items: [
        mostra('260913_0635_arquitectura_perfil', {}),
        mostra('doc_frontmatter', { date: '2026-09-20T18:00' }),
        mostra('doc_dia_sol', { date: '2026-09-21' }),
        ...real.items
      ]
    }
  };
});

import { PublicacioDetall } from '../../sections/notes/PublicacioDetall.jsx';
import PerfilPublicSection from '../../sections/profile/PerfilPublicSection.jsx';
import { DetallCompte } from '../../sections/profile/DetallCompte.jsx';
import { DetallPrivacitat } from '../../sections/profile/DetallPrivacitat.jsx';
import { DetallAplicacio, DetallSenseOrganitzacions } from '../../sections/profile/DetallEspai.jsx';
import { APLICACIONS, aplicacionsValides } from '../../sections/profile/aplicacions.js';
import WikiDePobleSection, { dataDeDocumentWiki } from '../../sections/wiki-de-poble/WikiDePobleSection.jsx';
import DesignSection from '../../sections/disseny/DesignSection.jsx';
import TextSection from '../../sections/text/TextSection.jsx';
import ItemDetailSection from '../../sections/detail/ItemDetailSection.jsx';
import { PAGE_COPY } from '../../sections/text/pageContent.js';
import { perfilDOrganitzacio, perfilDePersona } from './perfils.js';
import { createLocalPerfilsAdapter } from '../../data/localPerfils.js';
import { ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { COVER_PAGE_KEYS } from '../../config/systemPages';
import { VERSIO_CATALEG } from '../../sections/disseny/cataleg/versio.js';

/* ── Rellotges (W3A D2) ──────────────────────────────────────────────────
   ARA_DE_LA_PROVA: el «ara» fals de cada prova, anys després de qualsevol
   font. NAIXEMENT_SEED: el moment en què naix el servidor local (injectat),
   que és la data de creació de les seues fitxes. Només es falseja Date. */
const ARA_DE_LA_PROVA = new Date(2030, 0, 2, 3, 4);
const NAIXEMENT_SEED = new Date(2026, 6, 15, 8, 20);

/* La pastilla que la regla de LECTURA dona a unes fonts: [hora, dia], o
   només [dia] si la font és un dia sol. */
const pastillaDe = (fonts) => {
  const { time, date } = dataHoraDeBarra(fonts);
  return [time, date].filter(Boolean);
};
const PASTILLA_D_ARA = pastillaDe({ creat: ARA_DE_LA_PROVA });

/* ── Fonts de veres ──────────────────────────────────────────────────────
   REMOT: files com les torna PostgREST, passades pels mapejadors del port.
   SEED: el servidor local (localPerfils), que data les fitxes en crear-les. */
const FILA = { created_at: '2026-08-01T09:00:00.123456+00:00', updated_at: '2026-09-27T17:30:00.654321+00:00' };
const DE_LA_FILA = pastillaDe({ creat: FILA.created_at, modificat: FILA.updated_at });
const DEL_SEED = pastillaDe({ creat: NAIXEMENT_SEED.toISOString(), modificat: NAIXEMENT_SEED.toISOString() });
const ORG_DIRECTORI = { id: 'o1', slug: 'forn', name: 'Forn de la Torre', kind: 'company', lema: 'Pa de llenya', description: 'Cada matí', ...FILA };
const USUARI_REMOT = { id: '11111111-1a1a-4000-8000-000000000000' };
const FILA_PROFILES = { id: USUARI_REMOT.id, full_name: 'Pepa', town_name: 'La Torre', is_public: true, ...FILA };
const PERSONA = { id: 'jo', mena: 'persona', nom: 'Pep', avatar: '', dades: { full_name: 'Pep', email: 'pep@poble.test', is_public: false, town_name: 'La Torre', ...FILA } };

const USUARI_SEED = { id: 'jo-seed', email: 'pep@poble.test', user_metadata: { full_name: 'Pep de la llavor' } };
let seed;
/* La identitat del Perfil tal com la munta PerfilContext a partir del port. */
const personaSeed = () => ({ id: 'jo', mena: 'persona', nom: 'Pep de la llavor', avatar: '', dades: { ...seed.getProfile(USUARI_SEED), email: USUARI_SEED.email } });
const empresaSeed = () => {
  const org = seed.listMyOrganizations(USUARI_SEED)[0];
  return { id: org.id, mena: 'empresa', nom: org.name, avatar: '', dades: org };
};

/* La pastilla de la barra taronja: els seus textos, o null si no n'hi ha. */
function pastilla(arrel) {
  const control = arrel.querySelector('section.bar-orange .btn-date-time');
  return control ? [...control.querySelectorAll('span')].map((span) => span.textContent) : null;
}

const perfilPublic = (perfil, nom) => async () => {
  estat.capacitats = new Set(['directori']);
  estat.params = { agentId: perfil.id };
  estat.perfil = perfil;
  const vista = render(<PerfilPublicSection />);
  await screen.findByRole('heading', { level: 1, name: nom });
  return vista;
};

const AMB_HORA = 'amb hora';
const DIA_SOL = 'dia sol';

/* [pàgina, forma que li toca segons la seua font, pastilla que li toca (la
   regla sobre les dates de la seua font), pinta] */
const PAGINES = [
  ['PublicacioDetall (publicació del MAS)', AMB_HORA, pastillaDe({ creat: '2026-09-20T09:15:00Z' }), () => render(<PublicacioDetall item={{
    title: 'Recepta de coca', labels: [],
    data: { seccio: 'mur', ruta: '/mur/p1', item: { id: 'p1', title: 'Recepta de coca', content: '<p>Farina.</p>', created_at: '2026-09-20T09:15:00Z' } }
  }} />)],
  ['PerfilPublicSection · organització del directori (perfils.js)', AMB_HORA, DE_LA_FILA, () => perfilPublic(perfilDOrganitzacio(ORG_DIRECTORI), 'Forn de la Torre')()],
  ['PerfilPublicSection · fitxa pròpia de profiles (perfils.js)', AMB_HORA, DE_LA_FILA, () => perfilPublic(perfilDePersona(FILA_PROFILES, USUARI_REMOT), 'Pepa')()],
  ['PerfilPublicSection · entitat pilot en seed (localPerfils.js)', AMB_HORA, DEL_SEED, () => perfilPublic(seed.loadPerfilPublic(ENTITAT_PILOT_SLUG, USUARI_SEED), 'Sóc de Poble')()],
  ['PerfilPublicSection · persona en seed (localPerfils.js)', AMB_HORA, DEL_SEED, () => perfilPublic(seed.loadPerfilPublic(USUARI_SEED.id, USUARI_SEED), 'Pep de la llavor')()],
  ['DetallCompte (el compte, remot)', AMB_HORA, DE_LA_FILA, () => render(<DetallCompte identitat={PERSONA} guardarAjust={async () => {}} pujaMitja={() => {}} />)],
  ['DetallCompte (el compte, seed)', AMB_HORA, DEL_SEED, () => render(<DetallCompte identitat={personaSeed()} guardarAjust={async () => {}} pujaMitja={() => {}} />)],
  ['DetallCompte (compte de l’entitat, seed)', AMB_HORA, DEL_SEED, () => render(<DetallCompte identitat={empresaSeed()} guardarAjust={async () => {}} pujaMitja={() => {}} />)],
  ['DetallPrivacitat (privacitat i dades, remot)', AMB_HORA, DE_LA_FILA, () => render(<DetallPrivacitat identitat={PERSONA} />)],
  ['DetallPrivacitat (privacitat i dades, seed)', AMB_HORA, DEL_SEED, () => render(<DetallPrivacitat identitat={personaSeed()} />)],
  ['DetallSenseOrganitzacions (grups i empreses, seed)', AMB_HORA, DEL_SEED, () => render(<DetallSenseOrganitzacions persona={personaSeed()} />)],
  ['Wiki · portada (copy: instant)', AMB_HORA, pastillaDe({ creat: PAGE_COPY[COVER_PAGE_KEYS.wiki]?.date }),
    () => { estat.itemId = '__intro'; return render(<WikiDePobleSection />); }],
  ['Wiki · Consola incrustada (copy: instant)', AMB_HORA, pastillaDe({ creat: PAGE_COPY[COVER_PAGE_KEYS.consola]?.date }),
    () => { estat.itemId = 'consola_termodinamica'; return render(<WikiDePobleSection />); }],
  ['Wiki · document amb segell aammdd_hhmm', AMB_HORA, pastillaDe({ creat: '2026-09-13T06:35' }), () => {
    estat.itemId = '260913_0635_arquitectura_perfil';
    estat.search = `?item=${estat.itemId}`;
    return render(<WikiDePobleSection />);
  }],
  ['Wiki · document amb `date` i hora al frontmatter', AMB_HORA, pastillaDe({ creat: '2026-09-20T18:00' }), () => {
    estat.itemId = 'doc_frontmatter';
    estat.search = `?item=${estat.itemId}`;
    return render(<WikiDePobleSection />);
  }],
  ['Wiki · document amb `date` de només dia al frontmatter', DIA_SOL, ['21/09/26'], () => {
    estat.itemId = 'doc_dia_sol';
    estat.search = `?item=${estat.itemId}`;
    return render(<WikiDePobleSection />);
  }],
  ['Disseny · portada (copy: instant)', AMB_HORA, pastillaDe({ creat: PAGE_COPY.disseny.date }),
    () => { estat.itemId = '__intro'; return render(<DesignSection />); }],
  ['Disseny · espècimen del catàleg (versió del catàleg)', AMB_HORA, pastillaDe({ modificat: VERSIO_CATALEG }), () => {
    estat.itemId = 'fonaments-contracte';
    estat.search = 'item=fonaments-contracte';
    return render(<DesignSection />);
  }],
  ['TextSection (pàgina de text; copy: instant)', AMB_HORA, pastillaDe({ creat: PAGE_COPY.projecte.date }),
    () => render(<TextSection page={PAGE_COPY.projecte} pageKey="projecte" />)],
  ['ItemDetailSection (detall d’un element)', AMB_HORA, pastillaDe({ creat: '2026-08-15T10:00:00Z' }), () => {
    estat.params = { sectionId: 'mur', itemId: 'p2' };
    estat.preloadedItem = { id: 'p2', type: 'feed', title: 'Crònica', created_at: '2026-08-15T10:00:00Z' };
    window.scrollTo = () => {};
    return render(<ItemDetailSection />);
  }],
  ['ItemDetailSection (acte de tot el dia)', DIA_SOL, ['05/10/26'], () => {
    estat.params = { sectionId: 'mur', itemId: 'a1' };
    estat.preloadedItem = { id: 'a1', type: 'feed', title: 'Fira', date: '2026-10-05', time: 'Tot el dia' };
    window.scrollTo = () => {};
    return render(<ItemDetailSection />);
  }]
];

/* Els documents del manifest GENERAT sense cap data real (ni `date` ni segell). */
async function wikiSenseData() {
  const { wikiManifest: real } = await vi.importActual('../../data/wikiManifest.js');
  const sense = real.items.filter((item) => !dataDeDocumentWiki(item).date);
  return { sense, total: real.items.length };
}

/* Deutes de DADES coneguts: la pàgina ja llig la font, però la font encara
   no porta cap data real. [pàgina, motiu i qui el resol, font sense data
   (quantes entrades en falten), pinta amb la font de veres]. */
const PENDENTS = [
  ['DetallAplicacio (utilitat del node)', 'aplicacions.js no declara cap data per utilitat (i aplicacionsValides no en deixaria passar cap)',
    async () => aplicacionsValides(APLICACIONS).filter((a) => !['creat', 'modificat', 'created_at', 'updated_at'].some((camp) => camp in a)).length,
    () => render(<DetallAplicacio aplicacio={aplicacionsValides(APLICACIONS)[0]} />)],
  ['Wiki · document del manifest generat sense `date` ni segell', 'el generador (tooling/wiki/compile-wiki-to-app.mjs) no posa cap data al manifest (hui, 73 de 74 documents)',
    async () => (await wikiSenseData()).sense.length,
    async () => {
      const { sense } = await wikiSenseData();
      estat.itemId = sense[0].id;
      estat.search = `?item=${encodeURIComponent(estat.itemId)}`;
      return render(<WikiDePobleSection />);
    }]
];

beforeEach(() => {
  estat.itemId = null; estat.search = ''; estat.params = {}; estat.preloadedItem = null;
  estat.capacitats = new Set(); estat.perfil = null;
  /* Només Date: els temporitzadors (findByRole, efectes) continuen de veres. */
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(ARA_DE_LA_PROVA);
  seed = createLocalPerfilsAdapter({ ara: () => new Date(NAIXEMENT_SEED.getTime()) });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('T51 · barra taronja en lectura: data i hora sempre (el dia sol, si la font no té hora)', () => {
  test.each(PAGINES)('%s: pastilla %s, la de la seua font', async (_, forma, esperada, pinta) => {
    const { container } = await pinta();
    const textos = pastilla(container) ?? [];
    if (forma === AMB_HORA) {
      expect(textos).toEqual([expect.stringMatching(/^\d{2}:\d{2}$/), expect.stringMatching(/^\d{2}\/\d{2}\/\d{2}$/)]);
    } else {
      expect(textos).toEqual([expect.stringMatching(/^\d{2}\/\d{2}\/\d{2}$/)]);
    }
    // W3A D2 · El valor exacte de la seua font; mai la d'ara del rellotge fals.
    expect(textos).toEqual(esperada);
    expect(textos).not.toEqual(PASTILLA_D_ARA);
  });

  /* W3A D2 · Perquè la comparació detecte «ara», cap font pot coincidir amb
     el rellotge fals, i el servidor local ha de dur el naixement injectat
     (no el rellotge de qui executa la prova). */
  test('D2 · cap pastilla esperada és la d’ara, i el seed data les fitxes amb el rellotge injectat', async () => {
    for (const [nom, , esperada] of PAGINES) {
      expect(esperada, nom).not.toEqual(PASTILLA_D_ARA);
      expect(esperada.length, nom).toBeGreaterThan(0);
    }
    const naix = NAIXEMENT_SEED.toISOString();
    const persona = await seed.loadPerfilPublic(USUARI_SEED.id, USUARI_SEED);
    const entitat = await seed.loadPerfilPublic(ENTITAT_PILOT_SLUG, USUARI_SEED);
    expect([persona.creat, persona.modificat, entitat.creat, entitat.modificat]).toEqual([naix, naix, naix, naix]);
    expect(seed.getProfile(USUARI_SEED)).toMatchObject({ created_at: naix, updated_at: naix });
  });

  /* T4 del prompt 1140 (ordre del Mestre, 261001: la pastilla completa, Data
     + Hora, a totes les targetes) · Substituïx D5: el copy de les pàgines
     (mitjanit UTC exacta) és un instant i es pinta amb l'hora i el dia
     locals. El projecte encara no té hora de publicació coneguda (capçalera
     de pageContent.js): a València, «02:00» fins que el Mestre la diga. */
  test('T4 · el copy de les pàgines (mitjanit UTC exacta) pinta la pastilla sencera, en hora local', async () => {
    const { container } = render(<TextSection page={PAGE_COPY.projecte} pageKey="projecte" />);
    const d = new Date(PAGE_COPY.projecte.date);
    const dos = (n) => String(n).padStart(2, '0');
    expect(pastilla(container)).toEqual([
      `${dos(d.getHours())}:${dos(d.getMinutes())}`,
      `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`
    ]);
  });

  test.each(PENDENTS)('pendent · %s: %s (la font encara no en porta; la pàgina, sense pastilla i mai la d’ara)', async (_, __, fontSenseData, pinta) => {
    expect(await fontSenseData()).toBeGreaterThan(0);
    const { container } = await pinta();
    expect(pastilla(container)).toBeNull();
  });
});
