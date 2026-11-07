/* IDEA-133 (Onada R10, ordre del Mestre del 261106, B2-03) · A /registre, quan
   l'avís és CODI_ENTRADA.COMPTE_EXISTENT o CODI_ENTRADA.CREDENCIALS i hi ha
   recuperació (`onRecupera`, potRecuperar), l'Alerta porta un botó d'1 clic:
   «Entraves amb Google o no tens contrasenya? Rep un enllaç al correu», en
   les cinc llengües. El botó passa a la vista de recuperació amb el correu
   escrit. Sense recuperació, o amb un altre codi, l'Alerta de sempre. El
   correu és inventat.
   Gauntlet R10 (B2V-02) · Mentre s'envia (isBusy) o amb el formulari
   bloquejat, el botó de l'avís està desactivat i un clic no canvia de vista;
   quan acaba, torna a estar actiu. */
import { cleanup, fireEvent, render as pintaSol, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { RegistrationStep } from './OnboardingSteps.jsx';
import { CODI_ENTRADA } from '../../data/errorsBackend.js';
import '../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../config/i18n.js';

const CORREU = 'maria.prova@example.org';
const BOTO = {
  ca: 'Entraves amb Google o no tens contrasenya? Rep un enllaç al correu',
  es: '¿Entrabas con Google o no tienes contraseña? Recibe un enlace en tu correo',
  en: 'Used Google to sign in, or have no password? Get a link by email',
  eu: 'Google-rekin sartzen zinen edo ez duzu pasahitzik? Jaso esteka bat posta elektronikoan',
  gl: 'Entrabas con Google ou non tes contrasinal? Recibe unha ligazón no correo'
};
const AVIS = 'Ja hi ha un compte amb este correu.';

afterEach(cleanup);
// UniversalCard (la pastilla de la data) vol un router.
const render = (node) => pintaSol(<MemoryRouter>{node}</MemoryRouter>);

function pinta({ codiError, modeInicial = 'crear', onRecupera = vi.fn(async () => {}), t, accionsError = null, ...extra } = {}) {
  const onClearError = vi.fn();
  const vista = render(
    <RegistrationStep modeInicial={modeInicial} error={AVIS} codiError={codiError} accionsError={accionsError}
      onRegister={vi.fn()} onLogin={vi.fn()} onClearError={onClearError} onRecupera={onRecupera} {...(t ? { t } : {})} {...extra} />
  );
  return { ...vista, onClearError };
}
const escriuCorreu = () => fireEvent.change(screen.getByLabelText('Correu electrònic'), { target: { name: 'email', value: CORREU } });

test.each([
  ['COMPTE_EXISTENT', CODI_ENTRADA.COMPTE_EXISTENT, 'crear'],
  ['CREDENCIALS', CODI_ENTRADA.CREDENCIALS, 'entrar']
])('B2-03 · %s amb recuperació: un clic a l’avís obri «Recupera la contrasenya» amb el correu escrit', (_nom, codiError, modeInicial) => {
  const { onClearError } = pinta({ codiError, modeInicial });
  escriuCorreu();
  const avis = screen.getByText(AVIS).closest('.sdp-alerta');
  const boto = within(avis).getByRole('button', { name: BOTO.ca });
  expect(boto.closest('.sdp-alerta__accions')).toBeTruthy();
  // El Boto fantasma i ple de Pedra Seca (com «Has oblidat la contrasenya?»): a 360 px el text llarg ocupa l'amplada de l'avís.
  expect(boto.className).toBe('sdp-boto sdp-boto--fantasma sdp-boto--ple');
  fireEvent.click(boto);
  expect(screen.getByRole('heading', { name: 'Recupera la contrasenya' })).toBeTruthy();
  expect(screen.getByLabelText('Correu electrònic').value).toBe(CORREU);
  expect(screen.queryByText(AVIS)).toBeNull();
  expect(onClearError).toHaveBeenCalled();
});

test.each([
  ['COMPTE_EXISTENT', CODI_ENTRADA.COMPTE_EXISTENT],
  ['CREDENCIALS', CODI_ENTRADA.CREDENCIALS]
])('B2-03 · %s sense recuperació (potRecuperar false): l’Alerta de sempre, sense el botó', (_nom, codiError) => {
  pinta({ codiError, onRecupera: null });
  const avis = screen.getByText(AVIS).closest('.sdp-alerta');
  expect(within(avis).queryByRole('button')).toBeNull();
  expect(avis.querySelector('.sdp-alerta__accions')).toBeNull();
});

test('B2-03 · un altre codi (massa intents, servidor inabastable): cap botó d’enllaç; les accions d’abans continuen', () => {
  pinta({ codiError: CODI_ENTRADA.MASSA_INTENTS });
  expect(within(screen.getByText(AVIS).closest('.sdp-alerta')).queryByRole('button')).toBeNull();
  cleanup();
  pinta({ codiError: CODI_ENTRADA.SERVIDOR_INABASTABLE, accionsError: <button type="button">Tornar al mode de proves</button> });
  const avis = screen.getByText(AVIS).closest('.sdp-alerta');
  expect(within(avis).getAllByRole('button').map((b) => b.textContent)).toEqual(['Tornar al mode de proves']);
});

test('B2-03 · amb les accions d’abans i un dels dos codis, les dues: primer les d’abans, després l’enllaç', () => {
  pinta({ codiError: CODI_ENTRADA.CREDENCIALS, modeInicial: 'entrar', accionsError: <button type="button">Una altra acció</button> });
  const avis = screen.getByText(AVIS).closest('.sdp-alerta');
  expect(within(avis).getAllByRole('button').map((b) => b.textContent)).toEqual(['Una altra acció', BOTO.ca]);
});

test.each([
  ['isBusy (s’està enviant)', { isBusy: true }],
  ['bloquejat', { bloquejat: true }]
])('B2V-02 · amb %s, el botó de l’avís està desactivat i un clic no canvia de vista; quan acaba, torna a estar actiu', (_nom, estat) => {
  const { onClearError } = pinta({ codiError: CODI_ENTRADA.COMPTE_EXISTENT, ...estat });
  const avis = () => screen.getByText(AVIS).closest('.sdp-alerta');
  const boto = within(avis()).getByRole('button', { name: BOTO.ca });
  expect(boto.disabled).toBe(true);
  fireEvent.click(boto);
  expect(screen.queryByRole('heading', { name: 'Recupera la contrasenya' })).toBeNull();
  expect(screen.getByText(AVIS)).toBeTruthy();
  expect(onClearError).not.toHaveBeenCalled();
  cleanup();
  /* Ja no s'envia res: el mateix botó torna a obrir la recuperació. */
  pinta({ codiError: CODI_ENTRADA.COMPTE_EXISTENT });
  const actiu = within(avis()).getByRole('button', { name: BOTO.ca });
  expect(actiu.disabled).toBe(false);
  fireEvent.click(actiu);
  expect(screen.getByRole('heading', { name: 'Recupera la contrasenya' })).toBeTruthy();
});

test('B2-03 · les cinc llengües: el text de la clau i el botó de l’avís', () => {
  for (const [codi, text] of Object.entries(BOTO)) {
    const t = createTranslator(codi);
    expect([codi, t('section.login.registre.recuperaAmbEnllac')]).toEqual([codi, text]);
    pinta({ codiError: CODI_ENTRADA.COMPTE_EXISTENT, t });
    expect([codi, within(screen.getByText(AVIS).closest('.sdp-alerta')).getByRole('button').textContent]).toEqual([codi, text]);
    cleanup();
  }
});
