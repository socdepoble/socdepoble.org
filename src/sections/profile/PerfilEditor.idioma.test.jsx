import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';

/* ═══════════════════════════════════════════════════════════════════
   P1-22 (T5c, correcció G1 de l'assalt 261101) · ELS FORMATS ADMESOS DE LA
   CLOSCA DEL PERFIL, EN LA LLENGUA DE LA INTERFÍCIE

   La línia «PNG, JPEG o WebP, fins a 10 MB.» (AJUDA_FOTO) de la ranura del
   logotip i de la capçalera (heroEditHelp, ajudaAmbImatge, logoEditHelp) es
   pintava en valencià amb la interfície en anglés. De punta a punta, com
   PerfilEditor.logotip.test.jsx, amb el traductor anglés de veres.

   P1-22 (marató 261101_2143, B3-I18N §3.C) · LA RESTA DE LA FITXA: els avisos
   en línia dels camps (frases senceres amb {lloc}, «amb motiu» i «amb
   columna» com a claus pròpies), la ploma, «Edició avançada de la fitxa» i
   el seu resum per a cada mena, el cercle de l'avatar, la finestra i
   «Llevar l’avatar?», els `alt`, l'avís d'IA, la fila de reserva i el text
   fantasma del cos. De punta a punta (PerfilEditor → DocumentEditor →
   UniversalEditorShell → PageFrame), amb la cua d'autodesament de veres i el
   port simulat. Les frases esperades en anglés van escrites a mà: si una
   clau o el seu cablejat es perd, la prova ho veu. En valencià i sense
   traductor, el text de sempre, lletra per lletra (Llei del Píxel).
   ═══════════════════════════════════════════════════════════════════ */

const m = vi.hoisted(() => ({ perfil: null, llengua: 'en', t: null, adapter: null, updateProfile: null, showToast: null, finestra: null }));
const dobles = vi.hoisted(() => ({ carregaImatge: vi.fn(), exportaRetall: vi.fn(), compressImage: vi.fn(), dibuixaVisor: vi.fn(() => true) }));
vi.mock('../../hooks/useResolvedAsset.js', () => {
  /* El port resol un sdp-media:// a una adreça https: el cercle pot obrir la finestra amb la imatge. */
  const resol = (ref) => (typeof ref === 'string' && ref.startsWith('sdp-media://') ? 'https://mitjans.test/t/u/avatars/a.webp' : ref);
  return {
    useResolvedAsset: (ref) => resol(ref),
    useResolvedAssetState: (ref) => ({ url: resol(ref), status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} }),
  };
});
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: null, refresh: vi.fn() }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: null, estat: 'fora', generacio: 1 }) }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useRouter: () => ({ navigate: vi.fn(), location: { pathname: '/el-meu-perfil' } }),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/el-meu-perfil' }),
  useSearchParams: () => [new URLSearchParams()],
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));
/* m.llengua null: fora de l'App (useUIActionsOpcional torna null), la reserva valenciana.
   m.t: un traductor de prova que marca la clau de cada text. */
vi.mock('../../app/contexts/UIContext', async () => {
  const { createTranslator } = await import('../../config/i18n.js');
  const ambLlengua = () => (m.t ? { t: m.t } : m.llengua ? { t: createTranslator(m.llengua) } : null);
  return {
    useUI: () => ({ externalConfig: {} }),
    useUIActions: () => ambLlengua() ?? { t: (_clau, text) => text },
    useUIActionsOpcional: ambLlengua,
  };
});
vi.mock('../../components/universal/ContentProvider', () => ({ useContent: () => null }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.showToast }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: () => false,
  getCurrentUser: () => ({ id: 'U' }),
  updateProfile: (...args) => m.updateProfile(...args),
}));
vi.mock('./PerfilContext.jsx', () => ({ usePerfil: () => m.perfil }));
/* L'editor de veres, i l'adaptador a mà per a provocar un desat sense teclat. */
vi.mock('../../components/universal/DocumentEditor', async (importOriginal) => {
  const real = await importOriginal();
  const Real = real.DocumentEditor;
  return { ...real, DocumentEditor: (props) => { m.adapter = props.adapter; return <Real {...props} />; } };
});
/* La finestra de retall de veres; les seues props (els callbacks que li passa
   la fitxa), a mà: mentre desa, els seus botons són desactivats, i les guardes
   de pujada de la fitxa són la reserva per a un gest que arriba abans del
   render (correcció A-1 de l'àrbitre, marató 261101_2143). */
vi.mock('../../components/universal/enquadrament/DialegEnquadrament.jsx', async (importOriginal) => {
  const real = await importOriginal();
  const Real = real.DialegEnquadrament;
  return { ...real, DialegEnquadrament: (props) => { m.finestra = props; return <Real {...props} />; } };
});
vi.mock('../../components/universal/richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => null,
  UniversalRichTextContent: () => null,
}));
vi.mock('../../components/universal/richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('../../components/universal/DocumentPrintPreview.jsx', () => ({ default: () => null }));
vi.mock('../../components/universal/enquadrament/imatgeCanvas.js', () => ({
  carregaImatge: dobles.carregaImatge,
  dibuixaVisor: dobles.dibuixaVisor,
  exportaRetall: dobles.exportaRetall,
}));
vi.mock('../../utils/imageUtils.js', () => ({ compressImage: dobles.compressImage }));

import {
  AVIS_FITXA_IA, AVIS_SENSE_COLUMNA, ETIQUETA_AJUSTA_AVATAR, ETIQUETA_AVATAR, ETIQUETA_CAPCALERA, ETIQUETA_GUARDA_ENQUADRE, ETIQUETA_LLEVA_AVATAR,
  ETIQUETA_LLEVA_AVATAR_FINESTRA, ETIQUETA_LOGOTIP, ETIQUETA_POSA_AVATAR, PLACEHOLDER_COS_PERSONA, PerfilEditor, TEXTOS_EDITOR_FITXA,
  TITOL_EDICIO_AVANCADA, avisDeImatgeNoDesada, resumEdicioAvancadaDe,
} from './PerfilEditor.jsx';
import { ERROR_DESAT_IMATGE, PARELL_ERROR_DESAT_IMATGE } from './useImatgeDeFitxa.jsx';
import { oblidaEntitatDelProjecte } from '../../config/navigation.js';
import { AJUDA_FOTO } from '../../components/universal/enquadrament/useEnquadramentImatge.jsx';
import { createTranslator } from '../../config/i18n.js';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';
import { ErrorValidacio } from '../../data/autodesament/errors.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';

const CONFIG = Object.freeze({ tenantId: '00000000-0000-4000-8000-000000000000' });
const MITJA = 'sdp-media://mitjans/t/u/avatars/a.webp';
const org = { id: 'O', mena: 'empresa', nom: 'Forn', rol: 'Membre', dades: { name: 'Forn', visibility: 'public', role: 'owner' } };
const membre = { ...org, avatar: '/assets/forn.webp', dades: { ...org.dades, role: 'member', logo_url: '/assets/forn.webp' } };
const jo = { id: 'jo', mena: 'persona', nom: 'Pep', rol: 'Persona', dades: { id: 'U', full_name: 'Pep', town_name: 'La Torre' } };
const ambAvatar = { ...jo, avatar: MITJA, dades: { ...jo.dades, avatar_url: MITJA } };
const iaia = { id: 'A', mena: 'agent', nom: 'IAIA', rol: 'Agent IA', dades: { name: 'IAIA' } };
const deReserva = { ...jo, dades: { reserva: true, id: 'jo', full_name: 'Pep', avatar_url: '', town_name: 'La Torre' } };

beforeEach(async () => {
  m.updateProfile = vi.fn(async (canvis) => ({ id: 'U', ...canvis }));
  m.perfil = {
    identitats: [], guardarCampPerfil: vi.fn(), pujaMitja: vi.fn(), recarrega: vi.fn(),
    autodesament: { ambit: ambitDe(CONFIG, 'U'), context: CONFIG },
  };
  m.llengua = 'en';
  m.t = null;
  m.adapter = null;
  m.showToast = vi.fn();
  m.finestra = null;
  await cuaDesament.reinicia();
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 1600, alcada: 1200, tipus: 'image/webp', element: {}, allibera: vi.fn() });
});
afterEach(() => { cleanup(); oblidaEntitatDelProjecte(); });

const desplegable = () => document.querySelector('.sdp-editor-document details.sdp-edicio-avancada');
const obriEdicioAvancada = () => {
  const detalls = desplegable();
  if (!detalls.open) fireEvent.click(detalls.querySelector('summary.sdp-edicio-avancada__resum'));
  return detalls;
};
const resumDelDesplegable = () => desplegable().querySelector('summary.sdp-edicio-avancada__resum').textContent;
const ajudes = (ranura) => [...desplegable().querySelectorAll(`[data-sdp-ranura="${ranura}"] .sdp-camp__ajuda`)].map((p) => p.textContent);
const cercle = () => desplegable().querySelector('.sdp-edicio-avancada__identitat button.page-title-avatar--canvia');
const textDelDocument = () => document.body.textContent;

/** Un desat del camp per la cua de veres (la closca el fa en el blur): l'avís en línia, si n'hi ha. */
async function desa(camp, valor) {
  await act(() => m.adapter.saveRemote('jo', camp, valor));
  return m.adapter.avisosCamps?.[camp];
}

test('en: la ranura del logotip i la de la capçalera diuen els formats admesos en anglés', () => {
  m.perfil.autodesament = null;
  render(<PerfilEditor identitat={org} />);
  obriEdicioAvancada();
  expect(EN['editor.enquadrament.ajudaFoto']).toBe('PNG, JPEG or WebP, up to 10 MB.');
  expect(ajudes('logotip')).toContain(EN['editor.enquadrament.ajudaFoto']);
  expect(ajudes('capcalera')).toContain(EN['editor.enquadrament.ajudaFoto']);
  expect(desplegable().textContent).not.toContain(AJUDA_FOTO);
});

test('ca: el valencià de sempre, lletra per lletra', () => {
  m.llengua = 'ca';
  m.perfil.autodesament = null;
  render(<PerfilEditor identitat={org} />);
  obriEdicioAvancada();
  expect(ajudes('logotip')).toContain(AJUDA_FOTO);
  expect(ajudes('capcalera')).toContain(AJUDA_FOTO);
});

describe('P1-22 · els textos de la fitxa (B3-I18N §3.C)', () => {
  test('les 44 claus: la reserva és el valor valencià, hi són a les cinc llengües i l’anglés no és el valencià', () => {
    const parells = [...Object.values(TEXTOS_EDITOR_FITXA), PARELL_ERROR_DESAT_IMATGE];
    expect(parells).toHaveLength(44);
    expect(new Set(parells.map(([clau]) => clau)).size).toBe(44);
    for (const [clau, reserva] of parells) {
      expect(clau).toMatch(/^section\.perfil\.editor\./);
      expect([clau, CA[clau]]).toEqual([clau, reserva]);
      for (const [codi, dicc] of Object.entries({ es: ES, en: EN, eu: EU, gl: GL })) {
        expect([codi, clau, typeof dicc[clau]]).toEqual([codi, clau, 'string']);
      }
      if (reserva.split(/\s+/).length > 1) expect([clau, EN[clau]]).not.toEqual([clau, reserva]);
    }
    expect(Object.isFrozen(TEXTOS_EDITOR_FITXA)).toBe(true);
    expect(Object.values(TEXTOS_EDITOR_FITXA).every(Object.isFrozen)).toBe(true);
  });

  test('les constants exportades de sempre conserven el text, nascudes del parell', () => {
    expect(AVIS_SENSE_COLUMNA).toBe('Este camp encara no té columna al servidor');
    expect(TITOL_EDICIO_AVANCADA).toBe('Edició avançada de la fitxa');
    expect([ETIQUETA_CAPCALERA, ETIQUETA_AVATAR, ETIQUETA_LOGOTIP, ETIQUETA_LLEVA_AVATAR]).toEqual(['Capçalera', 'Avatar', 'Logotip', 'Llevar l’avatar']);
    expect([ETIQUETA_AJUSTA_AVATAR, ETIQUETA_POSA_AVATAR, ETIQUETA_LLEVA_AVATAR_FINESTRA, ETIQUETA_GUARDA_ENQUADRE])
      .toEqual(['Ajusta o canvia l’avatar', 'Posa un avatar', 'Llevar avatar', 'Guardar enquadre']);
    expect(AVIS_FITXA_IA).toBe('Esta fitxa és d’una intel·ligència artificial de Sóc de Poble. La mantenen les persones que administren l’entitat; el que hi escrigues és el que veurà tot el poble.');
    expect(PLACEHOLDER_COS_PERSONA).toBe('Este és el teu perfil personal. Si tens una empresa, un comerç, un taller o una associació, crea-la amb el botó NOVA ORG, dalt de la llista d’apartats, per a tindre logotip, lema i presència pública als pobles.');
    // D-2: l'apòstrof tipogràfic del Perfil, una clau diferent de la closca (recte).
    expect(ERROR_DESAT_IMATGE).toBe('No s’ha pogut desar la imatge.');
    expect(PARELL_ERROR_DESAT_IMATGE[0]).not.toBe('editor.closca.imatge.errorDesar');
  });

  test('en: massa llarg · la frase sencera amb el màxim i el lloc, «Trim to 256», el comptador i la ploma', async () => {
    render(<PerfilEditor identitat={jo} />);
    const avis = await desa('lead', 'x'.repeat(300));
    expect(avis.error.missatge).toBe('At most 256 characters. The text is kept in this tab until you shorten it or sign out.');
    expect(avis.error.accions.map((accio) => accio.text)).toEqual(['Trim to 256', 'Go back to the saved version']);
    expect(m.updateProfile).not.toHaveBeenCalled();
    // La closca el pinta en línia: l'alerta, el botó i el comptador, en anglés.
    const alerta = [...document.querySelectorAll('[role="alert"]')].find((n) => n.textContent.includes('At most 256 characters.'));
    expect(alerta).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Trim to 256' })).toBeTruthy();
    expect(textDelDocument()).toContain('300 of 256 characters');
    expect(m.adapter.estatDesament.detall)
      .toBe('There are changes the server does not have yet: check the document’s warnings. They are kept in this tab until you sign out.');
    expect(textDelDocument()).not.toMatch(/Com a màxim|es guarda en esta pestanya|Retallar a/);
  });

  test('en: una columna absent diu quina, en una sola frase, i no queda cap tros valencià', async () => {
    m.updateProfile.mockRejectedValue(new Error('Supabase 400: {"code":"PGRST204","message":"Could not find the \'lema\' column of \'profiles\' in the schema cache"}'));
    render(<PerfilEditor identitat={jo} />);
    const avis = await desa('lead', 'Del Mas');
    expect(avis.error.missatge)
      .toBe('This field has no column on the server yet (“lema”): the change is kept in this tab until the migration is applied or you sign out.');
    expect(avis.error.accions.map((accio) => accio.text)).toEqual(['Go back to the saved version']);
    expect(avis.error.missatge).not.toContain(AVIS_SENSE_COLUMNA);
  });

  test('en: el servidor rebutja amb un motiu: el motiu entra dins de la frase, sense el punt final, i «Try again»', async () => {
    m.updateProfile.mockRejectedValue(new Error('Policy check rejected the row.'));
    render(<PerfilEditor identitat={jo} />);
    const avis = await desa('lead', 'Del Mas');
    expect(avis.error.missatge).toBe('The server did not accept the change (Policy check rejected the row). The text is kept in this tab until you sign out.');
    expect(avis.error.accions.map((accio) => accio.text)).toEqual(['Try again', 'Go back to the saved version']);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  /* Correcció A-2 de l'àrbitre (marató 261101_2143) · Les branques que només
     tenien prova en valencià: el conflicte (la frase i «Conservar el meu») i la
     validació amb el seu {missatge}. */
  test('en: un conflicte diu la frase en anglés i ofereix «Keep mine»', async () => {
    m.updateProfile.mockRejectedValueOnce(Object.assign(new Error('Conflicte'), { status: 409 }));
    render(<PerfilEditor identitat={jo} />);
    const avis = await desa('lead', 'Del Mas');
    expect(avis.error.missatge).toBe('There is a newer version on the server. Your text is kept in this tab until you choose or sign out.');
    expect(avis.error.accions.map((accio) => accio.text)).toEqual(['Keep mine', 'Go back to the saved version']);
    expect(screen.getByRole('button', { name: 'Keep mine' })).toBeTruthy();
    expect(textDelDocument()).not.toMatch(/Hi ha una versió més nova|Conservar el meu/);
  });

  test('en: una validació posa el seu missatge davant de la frase anglesa', async () => {
    m.updateProfile.mockRejectedValueOnce(new ErrorValidacio('The motto cannot be accepted as it is.'));
    render(<PerfilEditor identitat={jo} />);
    const avis = await desa('lead', 'Del Mas');
    expect(avis.error.missatge).toBe('The motto cannot be accepted as it is. The text is kept in this tab until you correct it or sign out.');
    expect(avis.error.accions.map((accio) => accio.text)).toEqual(['Go back to the saved version']);
  });

  /* En les cinc llengües el motiu va just davant del primer punt: una frase
     cosida a partir de la clau «sense motiu» donaria el mateix text. Un
     traductor que marca la clau diu de quina clau surt cada frase. */
  test('cada frase surt de la seua clau sencera: «amb motiu» i «amb columna» no es cusen d’una altra (traductor marcador)', async () => {
    m.t = (clau, reserva) => (clau.startsWith('section.perfil.editor.') ? `⟦${clau.slice('section.perfil.editor.'.length)}⟧${reserva}` : reserva);
    m.updateProfile.mockRejectedValueOnce(new Error('Policy check rejected the row.'));
    render(<PerfilEditor identitat={jo} />);
    const avis = await desa('lead', 'Del Mas');
    expect(avis.error.missatge)
      .toBe('⟦error.servidorMotiu⟧El servidor no ha acceptat el canvi (Policy check rejected the row). El text es guarda ⟦lloc.pestanya⟧en esta pestanya fins que tanques la sessió.');
    expect(avis.error.accions.map((accio) => accio.text)).toEqual(['⟦accio.reintenta⟧Tornar a provar', '⟦accio.descarta⟧Tornar al que hi ha desat']);
    expect(avisDeImatgeNoDesada({ persistent: true, errors: { heroImage: { tipus: 'columna', columna: 'hero_url' } } }, 'heroImage', m.t))
      .toBe('⟦imatge.rebutjadaMotiu⟧El servidor no ha acceptat la imatge (⟦senseColumnaNom⟧Este camp encara no té columna al servidor «hero_url»). No s’ha desat: es guarda ⟦lloc.dispositiu⟧en este dispositiu fins que tanques la sessió, i la pots tornar a provar.');
    expect(avisDeImatgeNoDesada({ persistent: true, errors: { heroImage: { tipus: 'servidor' } } }, 'heroImage', m.t))
      .toBe('⟦imatge.rebutjada⟧El servidor no ha acceptat la imatge. No s’ha desat: es guarda ⟦lloc.dispositiu⟧en este dispositiu fins que tanques la sessió, i la pots tornar a provar.');
  });

  test('en: l’avís d’una imatge no desada (la finestra de retall): rebutjada amb la columna, temporal amb el motiu i pendent', () => {
    const t = createTranslator('en');
    expect(avisDeImatgeNoDesada({ persistent: false, errors: { heroImage: { tipus: 'columna', columna: 'hero_url' } } }, 'heroImage', t))
      .toBe('The server did not accept the image (This field has no “hero_url” column on the server yet). It has not been saved: it is kept in this tab until you sign out, and you can try again.');
    expect(avisDeImatgeNoDesada({ persistent: true, errors: {}, problema: { tipus: 'temporal', missatge: 'No network.' } }, 'logoImage', t))
      .toBe('The image could not be saved (No network). It will be retried automatically; meanwhile, it is kept on this device until you sign out.');
    expect(avisDeImatgeNoDesada({ persistent: true, errors: {}, problema: null }, 'logoImage', t))
      .toBe('The image has not been saved on the server yet. It is kept on this device until you sign out, and it will go out on its own when possible.');
    // Sense traductor, el valencià de sempre (el que ja comprova PerfilEditor.imatges.test.jsx).
    expect(avisDeImatgeNoDesada({ persistent: false, errors: { heroImage: { tipus: 'columna', columna: 'hero_url' } } }, 'heroImage'))
      .toBe('El servidor no ha acceptat la imatge (Este camp encara no té columna al servidor «hero_url»). No s’ha desat: es guarda en esta pestanya fins que tanques la sessió, i la pots tornar a provar.');
  });

  test('en: «Edició avançada de la fitxa» i el resum de la persona, de l’organització i de l’agent', () => {
    render(<PerfilEditor identitat={jo} />);
    expect(resumDelDesplegable()).toContain('Advanced profile editing');
    expect(resumDelDesplegable()).toContain('Change your avatar, add your header photo and manage your data');
    cleanup();
    render(<PerfilEditor identitat={org} />);
    expect(resumDelDesplegable()).toContain('Change the logo, add the header photo and manage the rights and the data');
    cleanup();
    render(<PerfilEditor identitat={iaia} />);
    expect(resumDelDesplegable()).toContain('Change the avatar, add the header photo and manage the rights and the data');
    expect(resumDelDesplegable()).not.toContain(TITOL_EDICIO_AVANCADA);
    expect(resumEdicioAvancadaDe('agent', createTranslator('en'))).toBe('Change the avatar, add the header photo and manage the rights and the data');
  });

  test('en: els rètols de les ranures («Header», «Logo») i el text fantasma del cos de la persona', () => {
    render(<PerfilEditor identitat={org} />);
    const d = obriEdicioAvancada();
    expect(within(d).getByRole('button', { name: 'Logo' }).closest('[data-sdp-ranura="logotip"]')).not.toBeNull();
    expect(within(d).getByRole('button', { name: 'Header' }).closest('[data-sdp-ranura="capcalera"]')).not.toBeNull();
    expect(within(d).queryByRole('button', { name: ETIQUETA_LOGOTIP })).toBeNull();
    cleanup();
    render(<PerfilEditor identitat={jo} />);
    expect(m.adapter.placeholderCos).toBe('This is your personal profile. If you have a business, a shop, a workshop or an association, create it with the NOVA ORG button, above the list of sections, to have a logo, a motto and a public presence in the towns.');
  });

  test('en: el cercle de l’avatar, la finestra («Remove avatar», «Save framing») i «Remove the avatar?»', async () => {
    render(<PerfilEditor identitat={jo} />);
    obriEdicioAvancada();
    expect(cercle().getAttribute('aria-label')).toBe('Add an avatar');
    cleanup();
    render(<PerfilEditor identitat={ambAvatar} />);
    obriEdicioAvancada();
    expect(cercle().getAttribute('aria-label')).toBe('Adjust or change the avatar');
    expect(cercle().querySelector('img').getAttribute('alt')).toBe('Avatar of Pep');
    cercle().focus();
    await act(async () => { fireEvent.click(cercle()); });
    await act(async () => {});
    const finestra = screen.getByRole('dialog', { name: EN['editor.enquadrament.titolFoto'] });
    expect(within(finestra).getByRole('button', { name: 'Remove avatar' })).toBeTruthy();
    expect([...finestra.querySelectorAll('.sdp-dialeg__peu button')].at(-1).textContent).toBe('Save framing');
    fireEvent.click(within(finestra).getByRole('button', { name: 'Remove avatar' }));
    const confirma = screen.getByRole('dialog', { name: 'Remove the avatar?' });
    expect(confirma.textContent).toContain('The profile will be left without a photo. You can add it back whenever you like.');
    expect(within(confirma).getByRole('button', { name: 'Remove the avatar' })).toBeTruthy();
    expect(confirma.textContent).not.toContain('La fitxa es quedarà sense foto.');
  });

  test('en: un membre veu el logotip de l’entitat amb l’alt en anglés', () => {
    render(<PerfilEditor identitat={membre} />);
    const logo = document.querySelector('.sdp-editor-document header.page-title img.page-title-logo--entitat');
    expect(logo.getAttribute('alt')).toBe('Logo of Forn');
  });

  test('en: la fitxa d’un agent IA porta l’avís en anglés', () => {
    render(<PerfilEditor identitat={iaia} />);
    expect(textDelDocument()).toContain('This profile belongs to an artificial intelligence of Sóc de Poble. It is maintained by the people who manage the organisation; what you write here is what the whole town will see.');
    expect(textDelDocument()).not.toContain(AVIS_FITXA_IA);
  });

  test('en: la fila de reserva diu en anglés que es mostra en lectura, i «Try again» torna a llegir', () => {
    render(<PerfilEditor identitat={deReserva} />);
    const alerta = document.querySelector('.sdp-alerta--error[role="alert"]');
    expect(alerta.querySelector('p').textContent)
      .toBe('The profile could not be read from the server. It is shown read-only so that no change overwrites what is already there.');
    fireEvent.click(within(alerta).getByRole('button', { name: 'Try again' }));
    expect(m.perfil.recarrega).toHaveBeenCalledTimes(1);
  });

  test.each([['ca'], [null]])('%s: el text de sempre, lletra per lletra (Llei del Píxel)', async (llengua) => {
    m.llengua = llengua;
    m.updateProfile.mockRejectedValue(new Error('Supabase 400: {"code":"PGRST204","message":"Could not find the \'lema\' column of \'profiles\' in the schema cache"}'));
    render(<PerfilEditor identitat={jo} />);
    expect(resumDelDesplegable()).toContain('Edició avançada de la fitxa');
    expect(resumDelDesplegable()).toContain('Canvia el teu avatar, afig la teua foto de capçalera i gestiona les dades');
    const avis = await desa('lead', 'Del Mas');
    expect(avis.error.missatge)
      .toBe('Este camp encara no té columna al servidor («lema»): el canvi es guarda en esta pestanya fins que s’aplique la migració o tanques la sessió.');
    expect(avis.error.accions.map((accio) => accio.text)).toEqual(['Tornar al que hi ha desat']);
    expect(m.adapter.placeholderCos).toBe(PLACEHOLDER_COS_PERSONA);
    expect(m.adapter.heroEditLabel).toBe('Capçalera');
    obriEdicioAvancada();
    expect(cercle().getAttribute('aria-label')).toBe('Posa un avatar');
    cleanup();
    render(<PerfilEditor identitat={iaia} />);
    expect(textDelDocument()).toContain(AVIS_FITXA_IA);
    cleanup();
    render(<PerfilEditor identitat={deReserva} />);
    expect(document.querySelector('.sdp-alerta--error[role="alert"] p').textContent)
      .toBe('No s’ha pogut llegir la fitxa del servidor. Es mostra en lectura perquè cap canvi trepitge el que ja hi ha.');
    expect(within(document.querySelector('.sdp-alerta--error')).getByRole('button').textContent).toBe('Tornar a provar');
    cleanup();
    render(<PerfilEditor identitat={membre} />);
    expect(document.querySelector('img.page-title-logo--entitat').getAttribute('alt')).toBe('Logotip de Forn');
  });
});

/* ═══════════════════════════════════════════════════════════════════
   Correcció A-1 i A-2 de l'àrbitre (marató 261101_2143) · LES IMATGES EN
   ANGLÉS: l'avís de pujada (TEXTOS_CLOSCA.imatgePujant) dels llocs que
   tornaven sense queixa a la forma valenciana pel nom (el cercle ocupat, el
   seu clic, «Remove avatar» mentre puja) i l'error de desat de la finestra
   sense cua (desaImatgeDeLaFinestra amb autodesament null). La frontera amb
   el navegador (canvas, compressImage, el fetch del data URL) se simula.
   ═══════════════════════════════════════════════════════════════════ */
describe('P1-22 · les imatges de la fitxa en anglés', () => {
  const PUJANT_EN = EN['editor.closca.imatge.pujant'];
  const finestraFoto = () => screen.queryByRole('dialog', { name: EN['editor.enquadrament.titolFoto'] });
  beforeEach(() => {
    dobles.exportaRetall.mockReset().mockResolvedValue(new File(['y'], 'enquadrament.jpg', { type: 'image/jpeg' }));
    dobles.compressImage.mockReset().mockResolvedValue('data:image/webp;base64,AAAA');
    vi.stubGlobal('fetch', vi.fn(async () => ({ blob: async () => new Blob(['w'], { type: 'image/webp' }) })));
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  test('en: mentre puja l’avatar, el cercle ho anuncia i el clic i «Remove avatar» ho avisen, en anglés', async () => {
    expect(PUJANT_EN).toBe('The image is still being saved. When it finishes, you can change it again.');
    let resol;
    m.perfil.pujaMitja = vi.fn(() => new Promise((r) => { resol = r; }));
    render(<PerfilEditor identitat={ambAvatar} />);
    obriEdicioAvancada();
    cercle().focus();
    await act(async () => { fireEvent.click(cercle()); });
    await act(async () => {});
    await act(async () => { fireEvent.click(within(finestraFoto()).getByRole('button', { name: 'Save framing' })); });
    await waitFor(() => expect(m.perfil.pujaMitja).toHaveBeenCalledTimes(1));
    // «Remove avatar» és desactivat mentre desa: la guarda d'obriLleva és la reserva d'un gest que arriba abans.
    await act(async () => { m.finestra.onLleva({ currentTarget: null }); });
    expect(screen.queryByRole('dialog', { name: 'Remove the avatar?' })).toBeNull();
    // Escape a mitja pujada: la finestra es tanca i la pujada continua.
    await act(async () => { fireEvent(finestraFoto(), new Event('cancel', { cancelable: true })); });
    expect(finestraFoto()).toBeNull();
    expect(cercle().getAttribute('aria-busy')).toBe('true');
    const estat = () => desplegable().querySelector('.sdp-edicio-avancada__identitat .sdp-sr-only[role="status"]');
    expect(estat().textContent).toBe(PUJANT_EN);
    await act(async () => { fireEvent.click(cercle()); });
    expect(finestraFoto()).toBeNull();
    expect(m.showToast.mock.calls).toEqual([[PUJANT_EN, 'info'], [PUJANT_EN, 'info']]);
    await act(async () => { resol(MITJA); });
    await waitFor(() => expect(cercle().hasAttribute('aria-busy')).toBe(false));
    expect(estat().textContent).toBe('');
    expect(textDelDocument()).not.toContain('Encara s’està desant');
  });

  test('en: sense cua (autodesament null), la finestra del logotip diu l’error de desat en anglés', async () => {
    m.perfil.autodesament = null;
    m.perfil.pujaMitja = vi.fn(async () => MITJA);
    render(<PerfilEditor identitat={org} />);
    obriEdicioAvancada();
    const selector = document.querySelector('input[data-imatge-de-fitxa="logoImage"]');
    await act(async () => { fireEvent.change(selector, { target: { files: [new File(['x'], 'logo.png', { type: 'image/png' })] } }); });
    await act(async () => {});
    const finestra = screen.getByRole('dialog', { name: EN['editor.enquadrament.titolLogotip'] });
    await act(async () => { fireEvent.click(within(finestra).getByRole('button', { name: EN['editor.enquadrament.guardar'] })); });
    await waitFor(() => expect(within(finestra).getByRole('alert').textContent).toBe('The image could not be saved.'));
    expect(m.perfil.pujaMitja).toHaveBeenCalledTimes(1);
    expect(m.updateProfile).not.toHaveBeenCalled();
  });
});
