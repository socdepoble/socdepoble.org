/* Onada 4 · T3 (RETALLADOR.txt §3, AV.txt §8) i retallador senzill (ordre del
 * Mestre, 261008) · Perfil › imatges, de punta a punta: cada botó obri el seu
 * selector i la mateixa finestra de retall (només canvien la proporció i la
 * màscara), i la foto ix per la pujada de sempre (useHeroImageHandler →
 * pujaMitja, el port del Perfil → 'sdp-media://mitjans/…'), amb UN sol
 * fitxer. Sense el diàleg intermedi «Capçalera i avatar». jsdom no té canvas:
 * la frontera amb el navegador (imatgeCanvas.js), compressImage i el fetch del
 * data URL se simulen. La resta és real. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ adapter: null, guardar: vi.fn(), puja: vi.fn(), toast: vi.fn(), recarrega: vi.fn(), identitats: [],
  autodesament: null, updateProfile: vi.fn(), updateOrganization: vi.fn(), updateAgent: vi.fn() }));
const dobles = vi.hoisted(() => ({ carregaImatge: vi.fn(), exportaRetall: vi.fn(), compressImage: vi.fn() }));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { m.adapter = adapter; return null; } }));
vi.mock('./PerfilContext.jsx', () => ({ usePerfil: () => ({ guardarCampPerfil: m.guardar, pujaMitja: m.puja, recarrega: m.recarrega,
  identitats: m.identitats, autodesament: m.autodesament }) }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getCurrentUser: () => ({ id: 'U' }),
  updateProfile: (...args) => m.updateProfile(...args),
  updateOrganization: (...args) => m.updateOrganization(...args),
  updateAgent: (...args) => m.updateAgent(...args),
}));
vi.mock('../../components/universal/enquadrament/imatgeCanvas.js', () => ({
  carregaImatge: dobles.carregaImatge,
  dibuixaVisor: () => true,
  exportaRetall: dobles.exportaRetall,
}));
vi.mock('../../utils/imageUtils.js', () => ({ compressImage: dobles.compressImage }));
import { PerfilEditor } from './PerfilEditor.jsx';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';

const CONFIG = Object.freeze({ tenantId: '00000000-0000-4000-8000-000000000000' });
/* Gauntlet 261016 (Bloc 3.5.4, verificació; ordre del Mestre) · Fixture
   actualitzada a propòsit: sense la foto de la sessió (abans, avatar:
   'a.webp'). Amb ella, l'avatar redó ja la pinta (avatarDeLaFitxa, la font de
   la barra i de la targeta) i la ranura no hi és; ací es prova el camí de la
   ranura «Avatar», el d'una persona sense cap foto. El cas de la foto de la
   sessió el prova PerfilEditor.test.jsx. */
const jo = { id: 'jo', mena: 'persona', nom: 'Pep', rol: 'Persona', avatar: null, dades: { full_name: 'Pep', is_public: false, town_name: 'La Torre' } };
const forn = { id: 'O', mena: 'empresa', nom: 'Forn', rol: 'Propietària', dades: { name: 'Forn', visibility: 'public', role: 'owner' } };
const CURT = 'data:image/webp;base64,AAAA';
const MITJA_AVATAR = 'sdp-media://mitjans/t/u/avatars/a.webp';

beforeEach(async () => {
  m.adapter = null; m.guardar.mockReset().mockResolvedValue(undefined); m.puja.mockReset(); m.toast.mockReset();
  m.recarrega.mockReset(); m.identitats = [];
  m.updateProfile.mockReset().mockImplementation(async (canvis) => ({ id: 'U', ...canvis }));
  m.updateOrganization.mockReset().mockImplementation(async (id, canvis) => ({ id, ...canvis }));
  m.updateAgent.mockReset().mockImplementation(async (id, canvis) => ({ id, ...canvis }));
  m.autodesament = { ambit: ambitDe(CONFIG, 'U'), context: CONFIG };
  await cuaDesament.reinicia();
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 1600, alcada: 1200, tipus: 'image/jpeg', element: {}, allibera: vi.fn() });
  dobles.exportaRetall.mockReset().mockResolvedValue(new File(['y'], 'enquadrament.jpg', { type: 'image/jpeg' }));
  dobles.compressImage.mockReset().mockResolvedValue(CURT);
  vi.stubGlobal('fetch', vi.fn(async () => ({ blob: async () => new Blob(['w'], { type: 'image/webp' }) })));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const foto = () => new File(['x'], 'foto.jpg', { type: 'image/jpeg' });
const selector = (camp) => document.querySelector(`input[type="file"][data-imatge-de-fitxa="${camp}"]`);

/** Pitja el botó de l'adaptador (la closca hi passa { acaba }) i tria la foto.
    Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 2) · L'avatar de la
    persona ja no té ranura («onLogoEdit»): el seu botó és el cercle
    (identitatEdicioAvancada, onCanvia amb l'esdeveniment del clic, sense
    `acaba`), que sense cap foto obri el mateix selector. */
async function triaFoto({ identitat = jo, boto = 'onLogoEdit', camp = 'logoImage', fitxer = foto() } = {}) {
  const acaba = vi.fn();
  render(<PerfilEditor identitat={identitat} />);
  const clic = vi.spyOn(selector(camp), 'click');
  if (boto === 'cercle') act(() => m.adapter.identitatEdicioAvancada.props.onCanvia({ type: 'click' }));
  else act(() => m.adapter[boto]({ acaba }));
  expect(clic).toHaveBeenCalledTimes(1);
  await act(async () => { fireEvent.change(selector(camp), { target: { files: [fitxer] } }); });
  await act(async () => {});
  return { acaba, fitxer };
}

/* Pla 2000 (punt 2) · La finestra de l'avatar desa amb «Guardar enquadre»; la
   capçalera i el logotip, amb «Guardar», com sempre. */
const guarda = (nom) => act(async () => {
  fireEvent.click(within(screen.getByRole('dialog', { name: nom })).getByRole('button', { name: nom === 'Retalla la foto' ? 'Guardar enquadre' : 'Guardar' }));
});

/* Pla 2000 (punt 2) · Expectativa actualitzada a propòsit: el cercle buit fa
   el que feia la ranura «Avatar» (el selector i el retall en cercle), sense
   cap `acaba` de la closca: el focus el porta el Perfil (onDesat). */
test('Onada 4 · «Avatar» de la persona: retall en cercle → UNA pujada pel port (carpeta avatars) amb el fitxer retallat → avatar_url', async () => {
  m.puja.mockResolvedValue(MITJA_AVATAR);
  const { acaba } = await triaFoto({ boto: 'cercle' });
  const retallador = screen.getByRole('dialog', { name: 'Retalla la foto' });
  expect(retallador.querySelector('.sdp-enquadrament__visor-caixa--cercle')).not.toBeNull();
  // Cap diàleg intermedi ni ràdios de destí o de forma.
  expect(within(retallador).queryByRole('radio')).toBeNull();
  expect(screen.queryByRole('dialog', { name: 'Capçalera i avatar' })).toBeNull();
  // Res no puja abans de guardar.
  expect(m.puja).not.toHaveBeenCalled();
  await guarda('Retalla la foto');
  /* 1600×1200 en quadrat: el quadrat central de 1200, que ix a 400 (Gauntlet
     261016, Bloc 1, Llei del Quadrat: abans 600, la mida del logotip). */
  expect(dobles.exportaRetall).toHaveBeenCalledTimes(1);
  expect(dobles.exportaRetall.mock.calls[0].slice(1)).toEqual([{ x: 200, y: 0, w: 1200, h: 1200 }, { amplada: 400, alcada: 400, tipus: 'image/jpeg' }]);
  const retallat = await dobles.exportaRetall.mock.results[0].value;
  // La compressió de l'avatar (400 px), sobre el fitxer RETALLAT.
  expect(dobles.compressImage).toHaveBeenCalledTimes(1);
  expect(dobles.compressImage.mock.calls[0][0]).toBe(retallat);
  expect(dobles.compressImage.mock.calls[0][1]).toEqual({ maxSize: 400, format: 'image/webp', quality: 0.8 });
  // Una sola pujada, un sol fitxer, a la carpeta de la persona.
  expect(m.puja).toHaveBeenCalledTimes(1);
  const [pujat, carpeta] = m.puja.mock.calls[0];
  expect(pujat).toBeInstanceOf(File);
  expect(pujat.name).toBe('logoImage.webp');
  expect(carpeta).toBe('avatars');
  // Desat per la cua de la fitxa, al camp de l'avatar i a cap altre.
  expect(m.updateProfile).toHaveBeenCalledTimes(1);
  expect(m.updateProfile).toHaveBeenCalledWith({ avatar_url: MITJA_AVATAR }, CONFIG);
  expect(acaba).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog', { name: 'Retalla la foto' })).toBeNull();
});

test('Onada 4 · cancel·lar el retall: cap pujada, l’avatar d’abans intacte i la closca no torna a la imatge', async () => {
  m.puja.mockResolvedValue(MITJA_AVATAR);
  const { acaba } = await triaFoto({ boto: 'cercle' });
  const retallador = screen.getByRole('dialog', { name: 'Retalla la foto' });
  await act(async () => { fireEvent.click(within(retallador).getByRole('button', { name: 'Cancel·lar' })); });
  expect(screen.queryByRole('dialog', { name: 'Retalla la foto' })).toBeNull();
  expect(dobles.exportaRetall).not.toHaveBeenCalled();
  expect(dobles.compressImage).not.toHaveBeenCalled();
  expect(m.puja).not.toHaveBeenCalled();
  expect(m.updateProfile).not.toHaveBeenCalled();
  expect(acaba).not.toHaveBeenCalled();
});

/* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · La capçalera deixa el 16:9 de
   l'ordre 261008 (1.200 × 675): és la mateixa imatge que la targeta, un
   quadrat de 1.200 × 1.200. */
test('Onada 4 · «Capçalera»: la mateixa finestra en quadrat → 1.200 × 1.200, comprimida a 1.200 i desada a hero_url', async () => {
  m.puja.mockResolvedValue('sdp-media://mitjans/t/u/avatars/hero.webp');
  const { acaba } = await triaFoto({ boto: 'onHeroEdit', camp: 'heroImage' });
  const retallador = screen.getByRole('dialog', { name: 'Retalla la capçalera' });
  expect(retallador.querySelector('.sdp-enquadrament__visor-caixa--cercle')).toBeNull();
  await guarda('Retalla la capçalera');
  // 1600×1200 en quadrat: tota l'alçada i el quadrat central de 1200.
  expect(dobles.exportaRetall.mock.calls[0].slice(1)).toEqual([{ x: 200, y: 0, w: 1200, h: 1200 }, { amplada: 1200, alcada: 1200, tipus: 'image/jpeg' }]);
  expect(dobles.compressImage.mock.calls.map(([, o]) => o.maxSize)).toEqual([1200]);
  expect(m.puja.mock.calls.map(([f, carpeta]) => [f.name, carpeta])).toEqual([['heroImage.webp', 'avatars']]);
  expect(m.updateProfile.mock.calls).toEqual([[{ hero_url: 'sdp-media://mitjans/t/u/avatars/hero.webp' }, CONFIG]]);
  expect(acaba).toHaveBeenCalledTimes(1);
});

test('Onada 4 · «Logotip» d’una organització: quadrat sense cercle, 600 × 600 exactes, carpeta organitzacions → logo_url', async () => {
  m.puja.mockResolvedValue('sdp-media://mitjans/t/o/organitzacions/logo.webp');
  await triaFoto({ identitat: forn, fitxer: new File(['x'], 'logo.png', { type: 'image/png' }) });
  const retallador = screen.getByRole('dialog', { name: 'Retalla el logotip' });
  expect(retallador.querySelector('.sdp-enquadrament__visor-caixa')).not.toBeNull();
  expect(retallador.querySelector('.sdp-enquadrament__visor-caixa--cercle')).toBeNull();
  await guarda('Retalla el logotip');
  expect(dobles.exportaRetall.mock.calls[0][2]).toEqual({ amplada: 600, alcada: 600, tipus: 'image/png' });
  expect(m.puja.mock.calls.map(([f, carpeta]) => [f.name, carpeta])).toEqual([['logoImage.webp', 'organitzacions']]);
  expect(m.updateOrganization).toHaveBeenCalledWith('O', { logo_url: 'sdp-media://mitjans/t/o/organitzacions/logo.webp' }, CONFIG);
});

test('Onada 4 · si la pujada falla, l’avís ix dins del retall (cap toast), res no es desa i la finestra continua oberta', async () => {
  m.puja.mockRejectedValueOnce(new Error('Sense xarxa.'));
  await triaFoto({ boto: 'cercle' });
  await guarda('Retalla la foto');
  const retallador = screen.getByRole('dialog', { name: 'Retalla la foto' });
  expect(within(retallador).getByRole('alert').textContent).toBe('Sense xarxa.');
  expect(m.toast).not.toHaveBeenCalled();
  expect(m.updateProfile).not.toHaveBeenCalled();
});
