/* M02 (marató 261101_2143; P1-12, disseny E2EE §4.4, CS-01, D-05 a) · L'alerta de
   canvi de clau al fil. Primer el cos presentacional: cada estat amb el seu text,
   el seu rol i els seus botons (l'alarma de la clau pròpia i la manipulació, cap),
   {nom} omplit tal qual, el focus després d'acceptar i l'anglés amb el traductor
   de l'app. Després, la conversa amb la bandera encesa (una sonda del mòdul) i els
   canvis simulats: l'alerta davall de la capçalera i el compositor bloquejat amb
   la barra de només lectura de sempre, que torna a escriure quan ja no hi ha res
   pendent. La bandera es llig en carregar Conversa.jsx (les constants plegades):
   la sonda l'encén abans d'importar-la. */
import '../../../../tests/helpers/diccionaris.js';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createTranslator } from '../../../config/i18n.js';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import { estatXifratgeDelFil } from '../estatXifratgeFil.js';

const m = vi.hoisted(() => ({ encesa: true, canvis: null, opcions: [], estat: null, quotaXat: null }));
/* Corrector (P3-a) · Amb onSendMedia, ControlsAdjunt llig la quota del port: el fals
   diu que hi ha adjunts perquè la prova veja si el bloqueig els apaga. */
vi.mock('../../../data/backendPort.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    quotaXat: (...args) => m.quotaXat(...args),
    teCapacitat: (capacitat) => capacitat === 'xatMultimedia' || real.teCapacitat(capacitat)
  };
});
vi.mock('../../../config/xifratXat.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    get E2EE_ACTIU_PER_DEFECTE() { return m.encesa; }
  };
});
vi.mock('../useSeguretatDelFil.js', async (importOriginal) => ({
  ...(await importOriginal()),
  useEstatXifratgeDelFil: () => m.estat
}));
vi.mock('../useCanvisDeClau.js', async (importOriginal) => ({
  ...(await importOriginal()),
  useCanvisDeClau: (opcions) => {
    m.opcions.push(opcions);
    return m.canvis;
  }
}));

const { default: AvisClauCanviada } = await import('./AvisClauCanviada.jsx');
const { default: Conversa } = await import('./Conversa.jsx');

const ca = createTranslator('ca');
const PEPA = '22222222-2222-4222-8222-222222222222';
const TONI = '33333333-3333-4333-8333-333333333333';
const NOMS = { [PEPA]: 'Pepa', [TONI]: 'Toni' };
const nomDe = (usuari) => NOMS[usuari] ?? '';
const pendent = (extres = {}) => ({ usuari: PEPA, motiu: 'sense-continuitat', kidFixat: 'kid-vell', kidNou: 'kid-nou', ...extres });
const canvis = (extres = {}) => ({ pendents: [], suaus: [], alarmes: [], error: null, ...extres });
const FORTA_PEPA = 'Pepa té una clau de seguretat nova que la clau anterior no ha confirmat. Passa quan algú perd l’aparell i la frase, o si algú s’ha posat pel mig. Parla amb Pepa per a saber què ha passat.';

afterEach(cleanup);

describe('el cos presentacional', () => {
  test('canvi fort pendent en un directe: títol, text amb el nom, «He parlat amb Pepa: continua» (primari) i «Número de seguretat»', () => {
    const onAccepta = vi.fn(async () => true);
    const onObriNumero = vi.fn();
    const { container } = render(<AvisClauCanviada canvis={canvis({ pendents: [pendent()] })} nomDe={nomDe} onAccepta={onAccepta} onObriNumero={onObriNumero} t={ca} />);
    const alerta = screen.getByRole('status');
    expect(alerta.className).toContain('sdp-alerta--avis');
    expect(within(alerta).getByText('Clau nova sense confirmar').className).toBe('sdp-alerta__titol');
    expect(within(alerta).getByText(FORTA_PEPA)).toBeTruthy();
    const continua = within(alerta).getByRole('button', { name: 'He parlat amb Pepa: continua' });
    expect(continua.className).toContain('sdp-boto--primari');
    const numero = within(alerta).getByRole('button', { name: 'Número de seguretat' });
    expect(numero.className).toContain('sdp-boto--secundari');
    fireEvent.click(continua);
    expect(onAccepta).toHaveBeenCalledWith(PEPA, 'kid-nou');
    fireEvent.click(numero);
    expect(onObriNumero).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[style]')).toBeNull();
  });

  test('contacte verificat: «Havies verificat Pepa…» i també es pot acceptar expressament', () => {
    render(<AvisClauCanviada canvis={canvis({ pendents: [pendent({ motiu: 'verificat' })] })} nomDe={nomDe} onAccepta={vi.fn()} t={ca} />);
    expect(screen.getByText('Havies verificat Pepa i la seua clau ha canviat. Torna-la a verificar per a continuar.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'He parlat amb Pepa: continua' })).toBeTruthy();
    /* Sense onObriNumero (un grup), cap «Número de seguretat». */
    expect(screen.queryByRole('button', { name: 'Número de seguretat' })).toBeNull();
  });

  test('en un grup, una alerta per persona, cadascuna amb el seu nom i el seu kid', () => {
    const onAccepta = vi.fn();
    render(<AvisClauCanviada canvis={canvis({ pendents: [pendent(), pendent({ usuari: TONI, kidNou: 'kid-toni' })] })} nomDe={nomDe} onAccepta={onAccepta} t={ca} />);
    expect(screen.getAllByRole('status')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'He parlat amb Toni: continua' }));
    expect(onAccepta).toHaveBeenCalledWith(TONI, 'kid-toni');
  });

  test('un pendent sense clau nova (fora d’història) no té res a acceptar', () => {
    render(<AvisClauCanviada canvis={canvis({ pendents: [pendent({ kidNou: null, motiu: 'fora-d-historia' })] })} nomDe={nomDe} onAccepta={vi.fn()} t={ca} />);
    expect(screen.getByText(FORTA_PEPA)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('alarma de la clau pròpia: una alerta d’error, sense cap botó', () => {
    render(<AvisClauCanviada canvis={canvis({ alarmes: [{ tipus: 'clau-propia', kidActiu: null }] })} nomDe={nomDe} onAccepta={vi.fn()} onObriNumero={vi.fn()} t={ca} />);
    expect(screen.getByRole('alert').textContent).toBe('S’ha registrat una clau nova per al teu compte que no és d’este aparell. Si no has sigut tu, avisa’ns.');
    expect(screen.queryByRole('button')).toBeNull();
  });

  test.each(['bifurcacio', 'kid-no-quadra', 'historia-incoherent'])('manipulació (%s): l’alerta d’error, sense cap botó', (codi) => {
    render(<AvisClauCanviada canvis={canvis({ error: codi })} nomDe={nomDe} onAccepta={vi.fn()} onObriNumero={vi.fn()} t={ca} />);
    expect(screen.getByRole('alert').textContent).toBe('Les claus d’este xat no coincidixen entre aparells. Compareu el número de seguretat.');
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('l’acceptació ha fallat: l’alerta d’error davall del pendent', () => {
    render(<AvisClauCanviada canvis={canvis({ pendents: [pendent()], error: 'acceptacio' })} nomDe={nomDe} onAccepta={vi.fn()} t={ca} />);
    expect(screen.getByRole('alert').textContent).toBe('No s’ha pogut confirmar la clau nova. Torna-ho a provar.');
    expect(screen.getByRole('button', { name: 'He parlat amb Pepa: continua' })).toBeTruthy();
  });

  test('canvi suau: avís informatiu que es tanca amb la creu', () => {
    const onTancaSuau = vi.fn();
    render(<AvisClauCanviada canvis={canvis({ suaus: [{ usuari: PEPA, kidAnterior: 'kid-vell', kidNou: 'kid-nou' }] })} nomDe={nomDe} onTancaSuau={onTancaSuau} t={ca} />);
    const avis = screen.getByRole('status');
    expect(avis.className).toContain('sdp-alerta--info');
    expect(within(avis).getByText('La clau de seguretat de Pepa ha canviat i ho ha confirmat la seua clau anterior.')).toBeTruthy();
    fireEvent.click(within(avis).getByRole('button', { name: "Tancar l'avís" }));
    expect(onTancaSuau).toHaveBeenCalledWith(PEPA, 'kid-nou');
  });

  test('res a dir (net, lectura fallida o sense canvis): no pinta res', () => {
    for (const c of [null, canvis(), canvis({ error: 'lectura' })]) {
      const { container } = render(<AvisClauCanviada canvis={c} nomDe={nomDe} t={ca} />);
      expect(container.innerHTML).toBe('');
      cleanup();
    }
  });

  test('mentre s’accepta: «Treballant…» i desactivat', () => {
    render(<AvisClauCanviada canvis={canvis({ pendents: [pendent()] })} nomDe={nomDe} ocupat onAccepta={vi.fn()} t={ca} />);
    const boto = screen.getByRole('button');
    expect(boto.disabled).toBe(true);
    expect(boto.textContent).toBe('Treballant…');
  });

  test('un nom amb patrons de replace es pinta tal qual', () => {
    render(<AvisClauCanviada canvis={canvis({ pendents: [pendent()] })} nomDe={() => 'Bar $& Co'} onAccepta={vi.fn()} t={ca} />);
    expect(screen.getByRole('button', { name: 'He parlat amb Bar $& Co: continua' })).toBeTruthy();
  });

  test('acceptat: si el focus ha caigut al body, va al destí; si és en un altre lloc o no s’ha acceptat, no es mou', async () => {
    const desti = document.createElement('textarea');
    document.body.append(desti);
    const { rerender } = render(<AvisClauCanviada canvis={canvis({ pendents: [pendent()] })} nomDe={nomDe} onAccepta={async () => true} destiFocus={() => desti} t={ca} />);
    const boto = screen.getByRole('button', { name: 'He parlat amb Pepa: continua' });
    boto.focus();
    fireEvent.click(boto);
    /* L'alerta se'n va amb el seu botó: el focus cau al body. */
    rerender(<AvisClauCanviada canvis={canvis()} nomDe={nomDe} onAccepta={async () => true} destiFocus={() => desti} t={ca} />);
    await waitFor(() => expect(document.activeElement).toBe(desti));

    desti.blur();
    const fora = document.createElement('input');
    document.body.append(fora);
    rerender(<AvisClauCanviada canvis={canvis({ pendents: [pendent()] })} nomDe={nomDe} onAccepta={async () => true} destiFocus={() => desti} t={ca} />);
    fireEvent.click(screen.getByRole('button', { name: 'He parlat amb Pepa: continua' }));
    fora.focus();
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(document.activeElement).toBe(fora);

    fora.blur();
    rerender(<AvisClauCanviada canvis={canvis({ pendents: [pendent()] })} nomDe={nomDe} onAccepta={async () => false} destiFocus={() => desti} t={ca} />);
    fireEvent.click(screen.getByRole('button', { name: 'He parlat amb Pepa: continua' }));
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(document.activeElement).toBe(document.body);
    desti.remove();
    fora.remove();
  });

  test('en anglés, amb el traductor de l’app', () => {
    const en = createTranslator('en');
    render(<AvisClauCanviada canvis={canvis({ pendents: [pendent()], suaus: [{ usuari: TONI, kidNou: 'k' }] })} nomDe={nomDe} onAccepta={vi.fn()} onObriNumero={vi.fn()} t={en} />);
    expect(screen.getByText('New key not confirmed')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'I have talked to Pepa: continue' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Safety number' })).toBeTruthy();
    expect(screen.getByText('Toni’s security key has changed and their previous key has confirmed it.')).toBeTruthy();
  });
});

describe('la conversa amb la bandera encesa (sonda) i els canvis simulats', () => {
  const t = (_clau, alternativa) => alternativa;
  const FIL = { id: 'd-pepa', tipus: 'directe', name: 'Pepa', potEscriure: true, llegitFinsSeq: 0, ultimSeq: 0, altres: [{ id: PEPA, nom: 'Pepa', tipus: 'persona' }] };
  const CONFIG = Object.freeze({ backendId: 'supabase', tenantId: 'poble-a' });
  const DIRECTE = estatXifratgeDelFil({ actiu: true, abast: { xifrat: true, bloquejat: false, motiu: 'directe-persona', tipusFil: 'directe' }, entornSegur: true });
  const vist = (extres = {}) => ({
    estat: 'pendent', pendents: [pendent()], suaus: [], alarmes: [], error: null, ocupat: false, bloquejat: true, avis: true,
    accepta: m.accepta, refresca: vi.fn(), tancaSuau: vi.fn(), ...extres
  });
  const NET = () => vist({ estat: 'net', pendents: [], bloquejat: false, avis: false });

  beforeEach(() => {
    m.opcions = [];
    m.estat = DIRECTE;
    m.accepta = vi.fn(async () => true);
    m.quotaXat = vi.fn(async () => ({ usats: 0, limit: 20_000_000, pendents: [] }));
  });

  function pinta(extres = {}) {
    const props = {
      fil: FIL, messages: [], onSendMessage: vi.fn().mockResolvedValue(undefined), onBack: vi.fn(), onEnviaAlBloc: vi.fn(),
      onCopia: vi.fn(), hiHaMes: false, carregantMes: false, onCarregaMes: vi.fn(), onReintenta: vi.fn(), onDescarta: vi.fn(),
      onMarcaVist: vi.fn(), locale: 'ca-ES', t, configAdjunts: CONFIG, usuariAdjunts: 'jo-anna', ...extres
    };
    const arbre = () => (
      <MemoryRouter>
        <AppGridContext.Provider value={{ mida: 'ample' }}>
          <Conversa {...props} />
        </AppGridContext.Provider>
      </MemoryRouter>
    );
    const vista = render(arbre());
    return { ...vista, repinta: () => vista.rerender(arbre()) };
  }

  test('un canvi fort pendent: l’alerta davall de la capçalera, el compositor bloquejat i el hook amb la conversa xifrada', async () => {
    m.canvis = vist();
    const { container, repinta } = pinta();
    const continua = await screen.findByRole('button', { name: 'He parlat amb Pepa: continua' });
    expect(m.opcions.at(-1)).toMatchObject({ fil: FIL, config: CONFIG, actiu: true, ambit: 'jo-anna' });
    /* L'alerta va just després de la capçalera, abans de la llista. */
    const alerta = container.querySelector('.sdp-alerta--avis');
    expect(alerta.previousElementSibling.classList.contains('sdp-xat-capcalera')).toBe(true);
    /* Cap camp d'escriure: la barra de només lectura amb el motiu. */
    expect(screen.queryByRole('textbox', { name: 'Escriu un missatge' })).toBeNull();
    const barra = container.querySelector('.sdp-xat-compositor--avis');
    expect(barra.textContent).toBe('Clau nova sense confirmar');
    expect(barra.getAttribute('role')).toBe('status');
    fireEvent.click(continua);
    expect(m.accepta).toHaveBeenCalledWith(PEPA, 'kid-nou');

    /* Acceptat: cap alerta i el camp torna. */
    m.canvis = NET();
    repinta();
    expect(screen.getByRole('textbox', { name: 'Escriu un missatge' })).toBeTruthy();
    expect(container.querySelector('.sdp-alerta')).toBeNull();
    expect(container.querySelector('.sdp-xat-compositor--avis')).toBeNull();
  });

  test('«Número de seguretat» obri el diàleg del número', async () => {
    m.canvis = vist();
    pinta();
    fireEvent.click(await screen.findByRole('button', { name: 'Número de seguretat' }));
    await waitFor(() => expect(document.querySelector('dialog.sdp-xat-dialeg')?.open).toBe(true));
  });

  test('manipulació: el compositor diu que el xat ha canviat de manera inesperada; alarma pròpia: bloquejat també', async () => {
    m.canvis = vist({ estat: 'error', pendents: [], error: 'bifurcacio' });
    const { container, repinta } = pinta();
    await screen.findByRole('alert');
    expect(container.querySelector('.sdp-xat-compositor--avis').textContent).toBe('Este xat ha canviat al servidor de manera inesperada. Per seguretat, no s’hi pot escriure.');
    m.canvis = vist({ estat: 'alarma', pendents: [], alarmes: [{ tipus: 'clau-propia', kidActiu: null }] });
    repinta();
    expect(screen.queryByRole('textbox', { name: 'Escriu un missatge' })).toBeNull();
    expect(container.querySelector('.sdp-xat-compositor--avis').textContent).toBe('Clau nova sense confirmar');
  });

  /* Corrector (P3-a, mutant C3) · Sense això, un fitxer del menú «Compartir» es podia
     preparar a la safata d'un fil bloquejat: amb un pendent, ni quota ni safata ni +. */
  test('amb un canvi fort pendent els adjunts no s’activen (ni quota, ni safata, ni +); sense res pendent, tornen', async () => {
    m.canvis = vist();
    const { container, repinta } = pinta({ onSendMedia: vi.fn() });
    await screen.findByRole('button', { name: 'He parlat amb Pepa: continua' });
    await act(async () => {});
    expect(m.quotaXat).not.toHaveBeenCalled();
    expect(container.querySelector('.sdp-xat-adjunts')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Adjunta' })).toBeNull();

    /* Control: el mateix muntatge, ja sense res pendent, llig la quota i pinta el +. */
    m.canvis = NET();
    repinta();
    expect(await screen.findByRole('button', { name: 'Adjunta' })).toBeTruthy();
    expect(m.quotaXat).toHaveBeenCalled();
    expect(container.querySelector('.sdp-xat-adjunts')).not.toBeNull();
  });

  /* Corrector (P3-a, mutant C5) · El número de seguretat només existix en un directe
     (potVerificar): en un grup, «continua» sí, però cap «Número de seguretat». */
  test('en un grup xifrat, l’alerta ofereix «continua» però no «Número de seguretat»', async () => {
    m.estat = estatXifratgeDelFil({ actiu: true, abast: { xifrat: true, bloquejat: false, motiu: 'grup-privat', tipusFil: 'grup' }, entornSegur: true });
    expect(m.estat.potVerificar).toBe(false);
    m.canvis = vist({ pendents: [pendent({ usuari: TONI, kidNou: 'kid-toni' })] });
    const GRUP = { id: 'g-comissio', tipus: 'grup', name: 'Comissió', potEscriure: true, llegitFinsSeq: 0, ultimSeq: 0, altres: [{ id: PEPA, nom: 'Pepa', tipus: 'persona' }, { id: TONI, nom: 'Toni', tipus: 'persona' }] };
    pinta({ fil: GRUP });
    fireEvent.click(await screen.findByRole('button', { name: 'He parlat amb Toni: continua' }));
    expect(m.accepta).toHaveBeenCalledWith(TONI, 'kid-toni');
    expect(screen.queryByRole('button', { name: 'Número de seguretat' })).toBeNull();
  });

  test('un canvi suau no bloqueja: l’avís i el camp d’escriure', async () => {
    m.canvis = vist({ estat: 'suau', pendents: [], suaus: [{ usuari: PEPA, kidNou: 'kid-nou' }], bloquejat: false });
    pinta();
    expect(await screen.findByText('La clau de seguretat de Pepa ha canviat i ho ha confirmat la seua clau anterior.')).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Escriu un missatge' })).toBeTruthy();
  });

  test('una conversa que no és xifrada no demana res al hook', () => {
    m.estat = estatXifratgeDelFil({ actiu: true, abast: { xifrat: false, bloquejat: false, motiu: 'public', tipusFil: null }, entornSegur: true });
    m.canvis = NET();
    pinta();
    expect(m.opcions.at(-1)).toMatchObject({ actiu: false });
    expect(screen.getByRole('textbox', { name: 'Escriu un missatge' })).toBeTruthy();
  });
});
