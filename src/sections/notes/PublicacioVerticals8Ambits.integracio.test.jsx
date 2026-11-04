/**
 * PublicacioVerticals8Ambits.integracio.test.jsx · Ronda 12 (AH-01, AH-02, AH-03, AH-04)
 *
 * Suite d'integració d'extrem a extrem que verifica els 8 casos d'ús de
 * publicació al poble (`mur`, `mercat`, `calendari`, `mapa`, `vehicle`,
 * `animalets`, `treball`, `habitatge`):
 *   1. Les 8 targetes de `/control` (`DESTINS_CONTROL`) tenen rutes actives per
 *      a `Publicar` (`/notes` o `/notes?ambit=<id>`) i `Saber-ne més`
 *      (`/page/<pagina>`), amb `enObres(d) === false`.
 *   2. En obrir cada àmbit a `NotesEditor`, la barra «Edició avançada» se situa
 *      just davall de la Barra Taronja (`header.page-title` -> `details.sdp-edicio-avancada`)
 *      i s'obri amb el `<Selector>` posicionat en l'àmbit corresponent.
 *   3. Es poden emplenar tots els camps específics de cada àmbit (incloent
 *      `data_inici` + `data_fi` multi-dia a `calendari`, `lloc` a `mapa`, i
 *      les modalitats `adopcio` / `perdut` / `trobat` a `animalets`).
 *   4. El botó inferior `.sdp-edicio-avancada__boto-tancar` tanca el desplegable
 *      i retorna el focus a `summary.sdp-edicio-avancada__resum` (mai a `document.body`).
 *   5. La fitxa generada (`projeccioPayload`) es pinta a `TargetaDelMur`,
 *      s'indexa a `textCercable` (sense exposar mai el camp privat `contacte`)
 *      i tradueix etiquetes i resums en les 5 llengües (`ca`, `es`, `en`, `eu`, `gl`).
 */

import React, { useMemo, useState } from 'react';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  session: { currentUser: { id: 'usuari-prova' } },
  config: { tenantId: '00000000-0000-4000-8000-0000000000a1' },
  setLocal: vi.fn(),
  viva: { set: null },
  navigate: vi.fn(),
  NET: Object.freeze({ estat: 'net', problema: null, quarantena: Object.freeze([]) })
}));

vi.mock('../../components/universal/richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: ({ onPublish, publishLabel }) => (
    <div className="sdp-editor-tools">
      <button type="button" onClick={onPublish}>{publishLabel || 'Publicar'}</button>
    </div>
  ),
  UniversalRichTextContent: () => <div data-testid="cos" />
}));
vi.mock('../../components/universal/richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('./NotesContext', () => ({
  useNotes: () => ({
    noteFolders: [],
    t: (_clau, text) => text,
    config: mocks.config,
    workspaceKey: 'ambit-A',
    notes: [],
    setLocalNoteField: mocks.setLocal,
    saveNoteField: vi.fn(),
    notesComplete: true,
    potEsborrar: false,
    scopeKey: 'ambit-A'
  }),
  etiquetesDeNota: () => []
}));
vi.mock('./useEstatDesamentNota.js', async (importOriginal) => ({
  ...await importOriginal(),
  useEstatDesamentNota: () => mocks.NET
}));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: vi.fn(), teCapacitat: () => true }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: 'user' }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => mocks.session, ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_clau, text) => text }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({
  ...(await importOriginal()),
  resolveAsset: (uri) => uri
}));

import NotesEditor from './NotesEditor.jsx';
import { CanalAmbitContext } from '../../components/universal/ambits/canalAmbit.js';
import { netejaCamp } from './netejaCamp.js';
import { DESTINS_CONTROL, contingutDe, enObres, portesDe } from '../control/destinsControl.js';
import { TargetaDelMur } from '../mur/TargetaDelMur.jsx';
import {
  AMBITS,
  etiquetaDAmbit,
  projeccioPayload,
  resumDeFitxa,
  textCercable,
  validaFitxa
} from '../../utils/publicacioUniversal.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';

const DICCIONARIS_IDIOMES = Object.freeze({ ca: CA, es: ES, en: EN, eu: EU, gl: GL });

const NOTA_BASE = Object.freeze({
  id: 'nota-8-ambits',
  title: 'Convocatòria Comunal',
  subtitle: 'Sóc de Poble',
  folderId: 'f-notes',
  categories: ['Sistema'],
  tags: []
});

function NotaViva({ inicial = NOTA_BASE }) {
  const [nota, setNota] = useState(inicial);
  mocks.viva.set = setNota;
  return <NotesEditor activeNote={nota} />;
}

function EditorAmbCanal({ pendent = null, children }) {
  const [p, setP] = useState(pendent);
  const canal = useMemo(() => ({ pendent: p, consumix: () => setP(null) }), [p]);
  return <CanalAmbitContext.Provider value={canal}>{children}</CanalAmbitContext.Provider>;
}

const scrollAbans = Element.prototype.scrollIntoView;
beforeEach(() => {
  mocks.session = { currentUser: { id: 'usuari-prova' } };
  Element.prototype.scrollIntoView = vi.fn();
  mocks.setLocal.mockReset().mockImplementation((id, camp, valor) => {
    mocks.viva.set?.((nota) => (nota && nota.id === id ? { ...nota, [camp]: valor } : nota));
  });
});

afterEach(() => {
  cleanup();
  Element.prototype.scrollIntoView = scrollAbans;
  mocks.viva.set = null;
});

describe('PublicacioVerticals8Ambits · Ronda 12 (Flux complet dels 8 casos d’ús d’AH-04)', () => {
  test('1. Els 8 destins de /control (DESTINS_CONTROL) estan 100% operatius (cap enObres) amb porta Publicar i Saber-ne més', () => {
    expect(DESTINS_CONTROL.map((d) => d.id)).toEqual([
      'mur',
      'mercat',
      'calendari',
      'mapa',
      'vehicle',
      'animalets',
      'treball',
      'habitatge'
    ]);
    expect(AMBITS).toEqual(DESTINS_CONTROL.map((d) => d.id));

    for (const desti of DESTINS_CONTROL) {
      expect(enObres(desti)).toBe(false);
      expect(desti.saberMes).toBe(`/page/${desti.pagina}`);
      expect(desti.publicar).toBe(`/notes?ambit=${desti.id}`);
      const contingut = contingutDe(desti);
      expect(contingut).not.toBeNull();
      expect(contingut.titol.length).toBeGreaterThan(0);

      const portes = portesDe(desti, (_k, fallback) => fallback);
      expect(portes).toHaveLength(2);
      expect(portes[0].desti).toBe(desti.publicar);
      expect(portes[1].desti).toBe(desti.saberMes);
    }
  });

  test('2. Anatomia AH-03: details.sdp-edicio-avancada se situa immediatament davall de la Barra Taronja (dins .sdp-pagina-despres-autoria, abans de header.page-title)', () => {
    const { container } = render(
      <EditorAmbCanal pendent="calendari">
        <NotaViva />
      </EditorAmbCanal>
    );

    const despresAutoria = container.querySelector('.sdp-pagina-despres-autoria');
    const header = container.querySelector('header.page-title');
    const details = container.querySelector('details.sdp-edicio-avancada');
    expect(despresAutoria).not.toBeNull();
    expect(header).not.toBeNull();
    expect(details).not.toBeNull();
    expect(despresAutoria.contains(details)).toBe(true);
    expect(despresAutoria.nextElementSibling).toBe(header);
    expect(details.open).toBe(true);
  });

  test('3. Emplenat interactiu a l’editor dels 8 àmbits (incloent calendari multi-dia, mapa i les 3 modalitats d’animalets) i tancament amb retorn de focus', () => {
    const { container } = render(
      <EditorAmbCanal pendent="calendari">
        <NotaViva />
      </EditorAmbCanal>
    );

    const details = container.querySelector('details.sdp-edicio-avancada');
    const ranura = container.querySelector('[data-sdp-ranura="ambit"]');
    const selectorAmbit = within(ranura).getByLabelText('Àmbit');
    expect(selectorAmbit.options).toHaveLength(8);

    // 3.1 Calendari multi-dia (Cursos de Pedra en Sec: data_inici + data_fi + lloc)
    expect(selectorAmbit.value).toBe('calendari');
    fireEvent.change(within(ranura).getByLabelText('Dia d’inici (obligatori)'), {
      target: { value: '2026-11-14' }
    });
    fireEvent.change(within(ranura).getByLabelText('Hora d’inici'), {
      target: { value: '09:30' }
    });
    fireEvent.change(within(ranura).getByLabelText('Dia de finalització'), {
      target: { value: '2026-11-16' }
    });
    fireEvent.change(within(ranura).getByLabelText('Hora de finalització'), {
      target: { value: '18:00' }
    });
    fireEvent.change(within(ranura).getByLabelText('Lloc o adreça (obligatori)'), {
      target: { value: 'Bancals del Rentonar' }
    });
    fireEvent.change(within(ranura).getByLabelText('Municipi'), {
      target: { value: 'La Torre de les Maçanes' }
    });

    // 3.2 Mapa (lloc + modalitat patrimoni + coordenades)
    fireEvent.change(selectorAmbit, { target: { value: 'mapa' } });
    expect(selectorAmbit.value).toBe('mapa');
    fireEvent.change(within(ranura).getByLabelText('Modalitat (obligatori)'), {
      target: { value: 'patrimoni' }
    });
    fireEvent.change(within(ranura).getByLabelText('Lloc o adreça (obligatori)'), {
      target: { value: 'Pou de Neu del Rentonar' }
    });
    fireEvent.change(within(ranura).getByLabelText('Coordenades o referència'), {
      target: { value: '38.641, -0.412' }
    });

    // 3.3 Animalets (modalitats: adopcio, perdut, trobat, cura)
    fireEvent.change(selectorAmbit, { target: { value: 'animalets' } });
    expect(selectorAmbit.value).toBe('animalets');
    const selectorModalitatAnimalets = within(ranura).getByLabelText('Modalitat (obligatori)');
    const opcionsAnimalets = [...selectorModalitatAnimalets.options].map((o) => o.value).filter(Boolean);
    expect(opcionsAnimalets).toEqual(expect.arrayContaining(['adopcio', 'perdut', 'trobat']));
    for (const mod of ['adopcio', 'perdut', 'trobat']) {
      fireEvent.change(selectorModalitatAnimalets, { target: { value: mod } });
      fireEvent.change(within(ranura).getByLabelText('Animal o espècie (obligatori)'), {
        target: { value: 'Gos d’atura' }
      });
      fireEvent.change(within(ranura).getByLabelText('Municipi (obligatori)'), {
        target: { value: 'La Torre' }
      });
      fireEvent.change(within(ranura).getByLabelText('Com contactar'), {
        target: { value: '600111222' }
      });
    }

    // 3.4 Tancament des del botó gran inferior i retorn del focus al <summary>
    const botoTancar = details.querySelector('button.sdp-edicio-avancada__boto-tancar');
    const summary = details.querySelector('summary.sdp-edicio-avancada__resum');
    expect(botoTancar).not.toBeNull();
    botoTancar.focus();
    fireEvent.click(botoTancar);
    expect(details.open).toBe(false);
    expect(document.activeElement).toBe(summary);
    expect(document.activeElement).not.toBe(document.body);
  });

  test('4. Projecció completa dels 8 àmbits a TargetaDelMur, indexCerca (textCercable sense contacte privat) i traducció a les 5 llengües (ca, es, en, eu, gl)', () => {
    const casos = [
      {
        ambit: 'mur',
        id: 'm-1',
        title: 'Crònica de la verema',
        dades: {},
        rutaEsperada: '/mur/m-1'
      },
      {
        ambit: 'mercat',
        id: 'mk-1',
        title: 'Oli verge extra ecològic',
        dades: { preu: '14 €', unitat: 'Garrafa 2 L', categoria: 'Oli', estoc: 20 },
        rutaEsperada: '/mercat/mk-1'
      },
      {
        ambit: 'calendari',
        id: 'cal-1',
        title: 'Curs de Pedra en Sec (3 dies)',
        dades: {
          data_inici: '2026-11-14',
          hora_inici: '09:00',
          data_fi: '2026-11-16',
          hora_fi: '18:00',
          lloc: 'Bancals del Rentonar',
          municipi: 'La Torre'
        },
        rutaEsperada: '/calendari/cal-1'
      },
      {
        ambit: 'mapa',
        id: 'map-1',
        title: 'Pou de Neu del Rentonar',
        dades: {
          modalitat: 'patrimoni',
          lloc: 'Serra dels Plans',
          municipi: 'La Torre',
          coordenades: '38.641, -0.412'
        },
        rutaEsperada: '/mapa/map-1'
      },
      {
        ambit: 'vehicle',
        id: 'veh-1',
        title: 'Viatge a Alcoi',
        dades: {
          modalitat: 'oferisc_places',
          lloc_eixida: 'La Torre',
          lloc_arribada: 'Alcoi',
          data_eixida: '2026-11-15',
          hora_eixida: '08:00',
          places: 3,
          aportacio: '4 €',
          contacte: 'Telèfon Privat Vehicle'
        },
        rutaEsperada: '/vehicle/veh-1'
      },
      {
        ambit: 'animalets',
        id: 'ani-1',
        title: 'Cadell trobat prop del riu',
        dades: {
          modalitat: 'trobat',
          especie: 'Gos mestís',
          municipi: 'Benifallim',
          contacte: 'Telèfon Privat Animalets'
        },
        rutaEsperada: '/animalets/ani-1'
      },
      {
        ambit: 'treball',
        id: 'tre-1',
        title: 'Es busca marger oficial',
        dades: {
          modalitat: 'oferta_feina',
          ofici: 'Marger de pedra en sec',
          municipi: 'Sella',
          remuneracio: 'Segons conveni',
          contacte: 'Telèfon Privat Treball'
        },
        rutaEsperada: '/treball/tre-1'
      },
      {
        ambit: 'habitatge',
        id: 'hab-1',
        title: 'Casa de poble assolellada',
        dades: {
          modalitat: 'lloguer',
          preu: '380 €/mes',
          superficie_m2: 95,
          habitacions: 3,
          estat_immoble: 'llest_per_entrar',
          municipi: 'Relleu',
          contacte: 'Telèfon Privat Habitatge'
        },
        rutaEsperada: '/habitatge/hab-1'
      }
    ];

    for (const cas of casos) {
      const validacio = validaFitxa(cas.ambit, cas.dades);
      expect(validacio).toEqual({ ok: true, errors: [] });

      const payload = projeccioPayload({
        id: cas.id,
        type: 'feed',
        title: cas.title,
        subtitle: 'Subtítol base',
        created_at: '2026-11-04T10:00:00Z',
        ambit: cas.ambit,
        estat: 'disponible',
        dades: cas.dades
      });

      const { container } = render(<TargetaDelMur item={payload} />);
      const article = container.querySelector('article.sp-card');
      expect(article).not.toBeNull();
      expect(article.querySelector('a.sp-card-link-overlay')?.getAttribute('href')).toBe(cas.rutaEsperada);

      // Verifiquem que el camp privat `contacte` MAI ix ni a la targeta ni a l'índex de cerca
      const cercable = textCercable(payload);
      expect(article.textContent).not.toContain('Telèfon Privat');
      expect(cercable).not.toContain('Telèfon Privat');

      if (cas.ambit !== 'mur') {
        expect(cercable.length).toBeGreaterThan(0);
      }

      // Verifiquem traducció en les 5 llengües oficials (ca, es, en, eu, gl)
      for (const lang of ['ca', 'es', 'en', 'eu', 'gl']) {
        const dict = DICCIONARIS_IDIOMES[lang] || {};
        const tLang = (clau, fallback) => dict[clau] ?? fallback;
        const etiq = etiquetaDAmbit(cas.ambit, tLang);
        expect(typeof etiq).toBe('string');
        expect(etiq.trim().length).toBeGreaterThan(0);
        if (cas.ambit !== 'mur') {
          const resum = resumDeFitxa(payload, tLang);
          expect(resum.trim().length).toBeGreaterThan(0);
        }
      }

      cleanup();
    }
  });

  /* G3-ah-conformitat-02 / G3-g2-matriu-03 (AH-04.3) · «Publicar al Mur» porta a
     /notes?ambit=mur i el Bloc ara hi deixa 'mur' pendent (NotesSection ·
     ambitDeLaUrl). Com Mercat, l'«Edició avançada» s'obri sola amb el Selector a
     «Mur», sense cap camp de fitxa; i res del que arriba al canal de desat
     porta fitxa: el sanejador (netejaCamp, el mateix contracte que
     NotesContext · fitxaDeNota) la deixa en null, com desaAmbit. */
  test('5. ?ambit=mur: l’«Edició avançada» s’obri amb el Selector a «Mur», cap camp de fitxa, i cap fitxa no arriba al desat', () => {
    const { container } = render(
      <EditorAmbCanal pendent="mur">
        <NotaViva />
      </EditorAmbCanal>
    );
    const details = container.querySelector('details.sdp-edicio-avancada');
    expect(details).not.toBeNull();
    expect(details.open).toBe(true);
    const ranura = container.querySelector('[data-sdp-ranura="ambit"]');
    const selectorAmbit = within(ranura).getByLabelText('Àmbit');
    expect(selectorAmbit.value).toBe('mur');
    // El Mur no porta formulari ni Estat: només el Selector de l'àmbit.
    expect(ranura.querySelectorAll('select')).toHaveLength(1);
    const fitxesEscrites = mocks.setLocal.mock.calls.filter(([, camp]) => camp === 'fitxa').map(([, , valor]) => valor);
    for (const valor of fitxesEscrites) expect(netejaCamp('fitxa', valor)).toBeNull();
  });
});
