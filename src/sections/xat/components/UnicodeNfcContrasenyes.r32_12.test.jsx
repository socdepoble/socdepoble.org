import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import {
  MAX_MARQUES_COMBINANTS_SEGUIDES,
  normalitzaNfcSeguraUi,
  plegaParaulaCerimoniaSegura,
  superaPressupostMarques,
} from '../../../utils/normalitzaEntradaUi.js';
import { CosCopiaSeguretatXat } from './PaginaCopiaSeguretatXat.jsx';
import CerimoniesXat from './CerimoniesXat.jsx';
import { ProvaCorreuAmbContrasenya } from '../../../../tests/fixtures/ProvaCorreuAmbContrasenya.jsx';
import { ContrasenyaNovaStep } from '../../onboarding/RecuperacioSteps.jsx';
import { proposaUsername, validaContrasenyaNova, validateRegistration } from '../../onboarding/onboardingModel.js';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { RegistrationStep } from '../../onboarding/OnboardingSteps.jsx';

const BOMBA_MARQUES_64K = `aa${'\u0315'.repeat(16_383)}${'\u0300'.repeat(16_384)}`;
const CLAU_NFC = 'c\u00e0nter-olivera-2026';
const CLAU_NFD = 'ca\u0300nter-olivera-2026';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Onada R32.12 · Lot 03 · Normalització Unicode NFC amb pressupost O(n) de marques combinants en JSX UI', () => {
  test('unitats pures: normalitzaNfcSeguraUi i plegaParaulaCerimoniaSegura accepten <= 64 marques i rebutgen > 64 sense invocar .normalize()', () => {
    expect(CLAU_NFC).not.toBe(CLAU_NFD);
    expect(normalitzaNfcSeguraUi(CLAU_NFD)).toBe(CLAU_NFC);
    expect(superaPressupostMarques(`a${'\u0300'.repeat(MAX_MARQUES_COMBINANTS_SEGUIDES)}`)).toBe(false);
    expect(superaPressupostMarques(`a${'\u0300'.repeat(MAX_MARQUES_COMBINANTS_SEGUIDES + 1)}`)).toBe(true);
    expect(superaPressupostMarques('abc\ud800def')).toBe(true);

    expect(plegaParaulaCerimoniaSegura('ca\u0300nter')).toBe('canter');
    expect(plegaParaulaCerimoniaSegura('c\u00e0nter')).toBe('canter');
    expect(plegaParaulaCerimoniaSegura('col·legi')).toBe('collegi');
    expect(plegaParaulaCerimoniaSegura('col.legi')).toBe('collegi');
    expect(plegaParaulaCerimoniaSegura('co\u0140legi')).toBe('collegi');

    const espia = vi.spyOn(String.prototype, 'normalize');
    expect(normalitzaNfcSeguraUi(BOMBA_MARQUES_64K)).toBeNull();
    expect(plegaParaulaCerimoniaSegura(BOMBA_MARQUES_64K)).toBeNull();
    expect(espia).not.toHaveBeenCalled();
  });

  test('PaginaCopiaSeguretatXat: accepta NFD === NFC en desa i rebutja bomba de 64 KiB tant en contrasenya com en repeticio sense cridar .normalize() sobre la bomba', async () => {
    const motor = {
      exporta: vi.fn(async ({ contrasenya }) => ({ text: JSON.stringify({ ok: true, contrasenya }) })),
      desa: vi.fn(),
      llegix: vi.fn(),
      descriu: vi.fn(),
      importa: vi.fn(),
    };
    const abast = { usuariId: '0b6a1f5e-6a2c-4f3e-9d1a-2b3c4d5e6f70', tenantId: '2d8c3b70-8c4e-4b50-9f3c-4d5e6f708192' };
    const contingut = { fils: [{ id: 'f1' }], missatges: [{ id: 'm1', seq: 1 }], filsAmbMissatges: 1 };

    render(
      <CosCopiaSeguretatXat
        accio="desa"
        abast={abast}
        contingut={contingut}
        motor={motor}
      />
    );

    const camp1 = screen.getByLabelText('Contrasenya de la còpia');
    const camp2 = screen.getByLabelText('Repetix la contrasenya');
    const botoPrepara = screen.getByRole('button', { name: 'Prepara la còpia' });

    const cridesHostils = [];
    const originalNormalize = String.prototype.normalize;
    vi.spyOn(String.prototype, 'normalize').mockImplementation(function espiaNormalize(forma) {
      const str = String(this);
      if (str.length > 1024) cridesHostils.push(str.length);
      return originalNormalize.call(this, forma);
    });

    // Cas 1 (handoff Codex): contrasenya vàlida + bomba de 64 KiB en repeticio
    fireEvent.change(camp1, { target: { value: CLAU_NFD } });
    fireEvent.change(camp2, { target: { value: BOMBA_MARQUES_64K } });
    fireEvent.click(botoPrepara);
    expect(motor.exporta).not.toHaveBeenCalled();
    expect(cridesHostils).toEqual([]);

    // Cas 2: bomba de 64 KiB en contrasenya principal
    fireEvent.change(camp1, { target: { value: BOMBA_MARQUES_64K } });
    fireEvent.change(camp2, { target: { value: BOMBA_MARQUES_64K } });
    fireEvent.click(botoPrepara);
    expect(motor.exporta).not.toHaveBeenCalled();
    expect(cridesHostils).toEqual([]);

    // Cas 3: contrasenya en NFD (macOS/iOS) i repetició en NFC coincideixen. v1.2.10 · El motor rep el secret tal com
    // s'ha admés (NFD) i és ell qui el passa a NFC per a la clau (copiaSeguretatPortatil.js · bytesContrasenya).
    // Contracte de Codex R32.11 (copiaSeguretatXat.unicode.r3211.test.js): la interfície no transforma secrets.
    fireEvent.change(camp1, { target: { value: CLAU_NFD } });
    fireEvent.change(camp2, { target: { value: CLAU_NFC } });
    fireEvent.click(botoPrepara);

    await waitFor(() => expect(motor.exporta).toHaveBeenCalledTimes(1));
    expect(motor.exporta.mock.calls[0][0].contrasenya).toBe(CLAU_NFD);
    expect(cridesHostils).toEqual([]);
  });

  test('CerimoniesXat: accepta accents NFD i ela geminada (l·l / l.l / ŀ) i rebutja bomba de 64 KiB en comprovacio i frase sense .normalize()', async () => {
    let resolAlta = null;
    const control = {
      potRecuperarSocial: false,
      alta: vi.fn(async (mostraIConfirma) => {
        // Índexs deterministes de 6 paraules reals de xifratXatParaules (0,1,2,3,4,5)
        resolAlta = await mostraIConfirma(new Uint16Array([0, 1, 2, 3, 4, 5]));
      }),
      restauraFrase: vi.fn(async () => {}),
    };

    const { container } = render(<CerimoniesXat control={control} />);

    fireEvent.click(screen.getByRole('button', { name: /Crea les claus/i }));
    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(6);
    const p1 = items[0].textContent;
    const p3 = items[2].textContent;
    const p6 = items[5].textContent;

    const cridesHostils = [];
    const originalNormalize = String.prototype.normalize;
    vi.spyOn(String.prototype, 'normalize').mockImplementation(function espiaNormalize(forma) {
      const str = String(this);
      if (str.length > 2048) cridesHostils.push(str.length);
      return originalNormalize.call(this, forma);
    });

    const inputs = container.querySelectorAll('input[type="password"]');
    expect(inputs.length).toBe(4); // 3 de comprovació + 1 de frase

    // Bomba de 64 KiB en comprovació no crida .normalize() i manté Confirmar desactivat
    fireEvent.change(inputs[0], { target: { value: BOMBA_MARQUES_64K } });
    fireEvent.change(inputs[1], { target: { value: p3 } });
    fireEvent.change(inputs[2], { target: { value: p6 } });
    const botoConfirma = screen.getByRole('button', { name: 'Confirmar' });
    expect(botoConfirma.disabled).toBe(true);
    expect(cridesHostils).toEqual([]);

    // Entrada descomposta en NFD i amb ela geminada alternativa habilita Confirmar
    const p1Nfd = originalNormalize.call(p1, 'NFD').replace(/l·l/g, 'l.l');
    const p3Nfd = originalNormalize.call(p3, 'NFD').replace(/l·l/g, '\u0140l');
    const p6Nfd = originalNormalize.call(p6, 'NFD');
    fireEvent.change(inputs[0], { target: { value: p1Nfd } });
    fireEvent.change(inputs[1], { target: { value: p3Nfd } });
    fireEvent.change(inputs[2], { target: { value: p6Nfd } });
    expect(botoConfirma.disabled).toBe(false);
    fireEvent.click(botoConfirma);
    await waitFor(() => expect(resolAlta).toBe(true));

    // Bomba de 64 KiB al camp frase es rebutja sense invocar .normalize() ni restauraFrase
    const campFrase = container.querySelector('input[type="password"]');
    fireEvent.change(campFrase, { target: { value: BOMBA_MARQUES_64K } });
    fireEvent.click(screen.getByRole('button', { name: /Recupera amb la frase/i }));
    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toMatch(/No s’ha pogut completar/i);
    });
    expect(control.restauraFrase).not.toHaveBeenCalled();
    expect(cridesHostils).toEqual([]);
  });

  test('ProvaCorreuAmbContrasenya: NFD i NFC coincideixen i lliuren NFC; bomba de 64 KiB falla sense .normalize()', async () => {
    const onConfirma = vi.fn(async () => ({ login_required: true, password_changed: true }));
    const { container } = render(
      <ProvaCorreuAmbContrasenya token="tok-123" mode="reset-password" requiresConsent={false} onConfirma={onConfirma} />
    );

    const cridesHostils = [];
    const originalNormalize = String.prototype.normalize;
    vi.spyOn(String.prototype, 'normalize').mockImplementation(function espiaNormalize(forma) {
      const str = String(this);
      if (str.length > 256) cridesHostils.push(str.length);
      return originalNormalize.call(this, forma);
    });

    const [pwdInput, againInput] = container.querySelectorAll('input[type="password"]');
    fireEvent.change(pwdInput, { target: { value: CLAU_NFD } });
    fireEvent.change(againInput, { target: { value: BOMBA_MARQUES_64K } });
    fireEvent.submit(container.querySelector('form'));
    expect(onConfirma).not.toHaveBeenCalled();
    expect(cridesHostils).toEqual([]);

    fireEvent.change(pwdInput, { target: { value: CLAU_NFD } });
    fireEvent.change(againInput, { target: { value: CLAU_NFC } });
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(onConfirma).toHaveBeenCalledTimes(1));
    expect(onConfirma.mock.calls[0][1]).toBe(CLAU_NFC);
    expect(cridesHostils).toEqual([]);
  });

  test('onboardingModel, RegistrationStep i ContrasenyaNovaStep: NFD === NFC i protecció contra bomba de marques', async () => {
    expect(validaContrasenyaNova({ password: CLAU_NFD, confirmPassword: CLAU_NFC })).toEqual({});

    const cridesHostils = [];
    const originalNormalize = String.prototype.normalize;
    vi.spyOn(String.prototype, 'normalize').mockImplementation(function espiaNormalize(forma) {
      const str = String(this);
      if (str.length > 512) cridesHostils.push(str.length);
      return originalNormalize.call(this, forma);
    });

    expect(validaContrasenyaNova({ password: CLAU_NFD, confirmPassword: BOMBA_MARQUES_64K }).confirmPassword).toBeTruthy();
    expect(validateRegistration({ name: 'Anna Climent', email: 'anna@example.org', password: BOMBA_MARQUES_64K }).password).toBeTruthy();
    expect(proposaUsername(BOMBA_MARQUES_64K)).toBe('veina');
    expect(cridesHostils).toEqual([]);

    // ContrasenyaNovaStep envia la contrasenya normalitzada en NFC
    const onDesa = vi.fn(async () => {});
    const vistaNova = render(
      <MemoryRouter>
        <ContrasenyaNovaStep onDesa={onDesa} />
      </MemoryRouter>
    );
    const campsNova = vistaNova.container.querySelectorAll('input[type="password"]');
    fireEvent.change(campsNova[0], { target: { value: CLAU_NFD } });
    fireEvent.change(campsNova[1], { target: { value: CLAU_NFC } });
    fireEvent.submit(vistaNova.container.querySelector('form'));
    await waitFor(() => expect(onDesa).toHaveBeenCalledWith(CLAU_NFC));
    vistaNova.unmount();

    // RegistrationStep registra amb la contrasenya normalitzada en NFC quan l'entrada arriba en NFD
    const onRegister = vi.fn(async () => {});
    const vistaReg = render(
      <MemoryRouter>
        <RegistrationStep modeInicial="crear" onRegister={onRegister} onLogin={vi.fn()} />
      </MemoryRouter>
    );
    fireEvent.change(vistaReg.container.querySelector('#reg-name'), { target: { value: 'Anna Climent' } });
    fireEvent.change(vistaReg.container.querySelector('input[type="email"]'), { target: { value: 'anna@example.org' } });
    const [regPwd, regConfirm] = vistaReg.container.querySelectorAll('input[type="password"]');
    fireEvent.change(regPwd, { target: { value: CLAU_NFD } });
    fireEvent.change(regConfirm, { target: { value: CLAU_NFC } });
    fireEvent.click(vistaReg.container.querySelector('input[type="checkbox"]'));
    fireEvent.submit(vistaReg.container.querySelector('form'));
    await waitFor(() => expect(onRegister).toHaveBeenCalledTimes(1));
    expect(onRegister.mock.calls[0][0].password).toBe(CLAU_NFC);
    expect(cridesHostils).toEqual([]);
  });
});
