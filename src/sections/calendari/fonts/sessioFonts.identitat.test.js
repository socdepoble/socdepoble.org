/**
 * Bucle adversarial (auditoria Codex 261002_0148, punt 10) · La versió de
 * sessió de cada compte canvia en connectar i en desconnectar, i la identitat
 * de l'amfitrió (`sdp:auth-change`) és la consumidora d'oblidaTot: si qui hi
 * ha canvia, o ix, els tokens d'abans s'obliden. Cada prova carrega el mòdul
 * de nou: la identitat que ha sentit és estat del mòdul.
 */
import { afterEach, beforeAll, expect, test, vi } from 'vitest';

const TOKEN = 'ya29.token-de-proves-0123456789';
const ORG = 'calendari@example.org';
const caduca = () => Date.now() + 600000;
const avisa = (detail) => window.dispatchEvent(new CustomEvent('sdp:auth-change', detail === undefined ? undefined : { detail }));

let sessio;
async function carrega() {
  vi.resetModules();
  sessio = await import('./sessioFonts.js');
  return sessio;
}
/* La primera importació transforma en fred tot l'arbre (targetesMur,
   calendariGlobal…): sola, amb la màquina carregada, passava dels 5 s de la
   primera prova. Ací, amb temps propi; cada prova continua carregant el mòdul
   de nou (carrega), ja transformat. */
beforeAll(async () => {
  await carrega();
  sessio.oblidaTot();
}, 60000);
afterEach(() => sessio?.oblidaTot());

test('cada connexió i cada desconnexió del compte és una versió nova, que no torna mai arrere', async () => {
  const { desaToken, estatDelCompte, instantania, oblidaToken } = await carrega();
  desaToken(ORG, { token: TOKEN, caduca: caduca() });
  const a = estatDelCompte(instantania(), ORG).versio;
  oblidaToken(ORG);
  const fora = estatDelCompte(instantania(), ORG);
  expect(fora).toMatchObject({ connectat: false, error: null });
  expect(fora.versio).toBeGreaterThan(a);
  desaToken(ORG, { token: `${TOKEN}-b`, caduca: caduca() });
  expect(estatDelCompte(instantania(), ORG).versio).toBeGreaterThan(fora.versio);
});

/* Oblidat per la identitat: desconnectat, i el compte diu per què. */
const oblidatPerIdentitat = (motiu) => ({
  connectat: false, connectant: false, error: { tipus: 'SENSE_AUTORITZACIO', missatge: motiu }
});

/* Revisió adversarial (regressio-01) · Abans d'esta revisió la prova esperava
   MOTIU_IDENTITAT, que diu «Ha canviat qui ha entrat»: fals quan l'avís és
   una renovació del JWT de la MATEIXA persona, que l'amfitrió envia a cada
   renovació (supabase/auth.js). L'oblit continua (fallada tancada); el que
   canvia és el motiu, neutre, perquè no se sap si ha canviat ningú. */
test('si en connectar no se sabia qui era, el primer avís de l’amfitrió ho oblida (fallada tancada) amb un motiu que no menteix', async () => {
  const { MOTIU_IDENTITAT, MOTIU_SEGURETAT, desaToken, estatDelCompte, instantania, tokenDe } = await carrega();
  expect(MOTIU_SEGURETAT).toBe('Per seguretat, torna a connectar el calendari.');
  desaToken('', { token: TOKEN, caduca: caduca() });
  avisa({ user: { id: 'persona-a' } });
  expect(tokenDe('')).toBeNull();
  expect(estatDelCompte(instantania(), '')).toMatchObject(oblidatPerIdentitat(MOTIU_SEGURETAT));
  expect(estatDelCompte(instantania(), '').error.missatge).not.toBe(MOTIU_IDENTITAT);
  expect(instantania().caselles).toEqual({});
});

test('identitat desconeguda en connectar i després ningú (o una connexió a mitges): el mateix motiu neutre', async () => {
  const { MOTIU_SEGURETAT, desaToken, estatDelCompte, iniciaConnexio, instantania, tokenDe } = await carrega();
  desaToken('', { token: TOKEN, caduca: caduca() });
  const intent = iniciaConnexio(ORG);
  avisa({ user: null });
  expect(tokenDe('')).toBeNull();
  expect(intent.signal.aborted).toBe(true);
  for (const compte of ['', ORG]) expect(estatDelCompte(instantania(), compte)).toMatchObject(oblidatPerIdentitat(MOTIU_SEGURETAT));
});

test('quan ja se sabia qui era, el canvi de persona continua dient-se amb MOTIU_IDENTITAT', async () => {
  const { MOTIU_IDENTITAT, desaToken, estatDelCompte, instantania } = await carrega();
  avisa({ user: { id: 'persona-a' } });
  desaToken('', { token: TOKEN, caduca: caduca() });
  avisa({ user: { id: 'persona-b' } });
  expect(estatDelCompte(instantania(), '')).toMatchObject(oblidatPerIdentitat(MOTIU_IDENTITAT));
});

test('la mateixa persona (una renovació, un canvi de nom) no toca res; una altra ho oblida tot', async () => {
  const { MOTIU_IDENTITAT, desaToken, estatDelCompte, instantania, posaCasella, tokenDe } = await carrega();
  avisa({ user: { id: 'persona-a' } });
  desaToken('', { token: TOKEN, caduca: caduca() });
  desaToken(ORG, { token: `${TOKEN}-org`, caduca: caduca() });
  posaCasella('privat', false);
  avisa({ user: { id: 'persona-a', user_metadata: { name: 'Nom nou' } } });
  expect(tokenDe('')).toBe(TOKEN);
  expect(estatDelCompte(instantania(), ORG).connectat).toBe(true);
  avisa({ user: { id: 'persona-b' } });
  expect(tokenDe('')).toBeNull();
  expect(tokenDe(ORG)).toBeNull();
  expect(instantania().caselles).toEqual({});
  for (const compte of ['', ORG]) expect(estatDelCompte(instantania(), compte)).toMatchObject(oblidatPerIdentitat(MOTIU_IDENTITAT));
  // La sessió nova ja és de la persona B: els seus avisos no la toquen.
  desaToken('', { token: `${TOKEN}-b`, caduca: caduca() });
  avisa({ user: { id: 'persona-b' } });
  expect(tokenDe('')).toBe(`${TOKEN}-b`);
});

test('eixir (user null) ho oblida tot, també una connexió a mitges', async () => {
  const { MOTIU_IDENTITAT, desaToken, estatDelCompte, iniciaConnexio, instantania, tokenDe } = await carrega();
  avisa({ user: { id: 'persona-a' } });
  desaToken('', { token: TOKEN, caduca: caduca() });
  const intent = iniciaConnexio(ORG);
  avisa({ user: null });
  expect(tokenDe('')).toBeNull();
  expect(intent.signal.aborted).toBe(true);
  for (const compte of ['', ORG]) expect(estatDelCompte(instantania(), compte)).toMatchObject(oblidatPerIdentitat(MOTIU_IDENTITAT));
});

test('un visitant sense sessió que connecta Google i continua sense sessió no perd res', async () => {
  const { desaToken, tokenDe } = await carrega();
  avisa({ user: null });
  desaToken('', { token: TOKEN, caduca: caduca() });
  avisa({ user: null });
  expect(tokenDe('')).toBe(TOKEN);
});

test('els avisos que no diuen qui hi ha («torna a llegir») no canvien res', async () => {
  const { desaToken, tokenDe } = await carrega();
  avisa({ user: { id: 'persona-a' } });
  desaToken('', { token: TOKEN, caduca: caduca() });
  avisa();
  avisa({ altra: 'cosa' });
  expect(tokenDe('')).toBe(TOKEN);
});

test('escoltaIdentitat escolta la finestra que se li dona i torna com deixar d’escoltar', async () => {
  const { AVIS_IDENTITAT, desaToken, escoltaIdentitat, tokenDe } = await carrega();
  const finestra = new EventTarget();
  const persona = (id) => new CustomEvent(AVIS_IDENTITAT, { detail: { user: { id } } });
  window.dispatchEvent(persona('persona-a'));
  desaToken('', { token: TOKEN, caduca: caduca() });
  const deixa = escoltaIdentitat(finestra);
  deixa();
  finestra.dispatchEvent(persona('persona-b'));
  expect(tokenDe('')).toBe(TOKEN);
  const deixaDeNou = escoltaIdentitat(finestra);
  finestra.dispatchEvent(persona('persona-b'));
  expect(tokenDe('')).toBeNull();
  deixaDeNou();
  expect(escoltaIdentitat(null)()).toBeUndefined();
});
