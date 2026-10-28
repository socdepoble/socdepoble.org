/* P1-68 (2610282100) · L'identificador @usuari en seed i local: la fitxa de
   qui entra porta el de la persona pilot (reservat i seu), desaElMeuUsername
   té les regles de desa_el_meu_usuari (sessió, forma, baixa, reserva, ritme
   i ocupat amb -N) i el perfil públic només el dona d'una fitxa sencera, com
   perfil_public. Noms sintètics. */
import { expect, test } from 'vitest';
import { createLocalPerfilsAdapter } from './localPerfils.js';
import { PERSONA_PILOT } from './identitatsSeed.js';

const ANNA = { id: 'u-anna', user_metadata: { full_name: 'Anna Pérez Soler' } };
const PERE = { id: 'u-pere', user_metadata: { full_name: 'Pere Tarrés' } };

test('la fitxa naix amb l’identificador de la persona pilot, ja confirmat; CAMPS_PERFIL no l’escriu', () => {
  const perfils = createLocalPerfilsAdapter();
  const fila = perfils.getProfile(ANNA);
  expect(fila.username).toBe(PERSONA_PILOT.slug);
  expect(fila.username_confirmat_at).toBe(fila.created_at);
  expect(perfils.updateProfile(ANNA, { username: 'una-altra' }).username).toBe(PERSONA_PILOT.slug);
});

test('desa, confirma i torna la forma de la RPC; el reservat propi també es pot confirmar', () => {
  const perfils = createLocalPerfilsAdapter({ ara: () => new Date('2026-10-28T21:00:00Z') });
  expect(perfils.desaElMeuUsername(ANNA, PERSONA_PILOT.slug)).toEqual({ desat: true, usuari: PERSONA_PILOT.slug, confirmat_al: '2026-10-28T21:00:00.000Z' });
  expect(perfils.desaElMeuUsername(ANNA, '@Anna.Pérez')).toMatchObject({ desat: true, usuari: 'anna-perez' });
  expect(perfils.getProfile(ANNA).username).toBe('anna-perez');
});

test('ocupat per una altra fitxa: la proposta amb -2, -3…', () => {
  const perfils = createLocalPerfilsAdapter();
  perfils.desaElMeuUsername(ANNA, 'pepa');
  perfils.getProfile(PERE);
  expect(perfils.desaElMeuUsername(PERE, 'pepa')).toEqual({ desat: false, motiu: 'ocupat', proposta: 'pepa-2' });
});

/* Fixer (revisió de seguretat, troballa 1) · 'baixa' és reservat: abans,
   una segona fitxa que el demanava no eixia mai del bucle de -N. I una base
   amb 100 candidats ocupats acaba en 'veina-' i 8 xifres, com
   private.usuari_lliure. */
test('«baixa» i les còpies de la plataforma són reservats, i la proposta no passa de 100 candidats', () => {
  const perfils = createLocalPerfilsAdapter();
  for (const valor of ['baixa', 'Baixa', 'iaia-maria-2', 'socdepoble2']) {
    expect(() => perfils.desaElMeuUsername(PERE, valor), valor).toThrow(expect.objectContaining({ code: 'SDP-USER-002' }));
  }
  for (let n = 1; n <= 100; n += 1) {
    const veina = { id: `u-omple-${n}`, user_metadata: { full_name: 'Omple' } };
    expect(perfils.desaElMeuUsername(veina, n === 1 ? 'pepa' : `pepa-${n}`).desat).toBe(true);
  }
  expect(perfils.desaElMeuUsername(PERE, 'pepa')).toEqual({ desat: false, motiu: 'ocupat', proposta: expect.stringMatching(/^veina-[0-9a-f]{8}$/) });
});

test('sense sessió, forma, reserva i ritme: els codis de la RPC', () => {
  const perfils = createLocalPerfilsAdapter();
  expect(() => perfils.desaElMeuUsername(null, 'pepa')).toThrow(expect.objectContaining({ code: 'SDP-USER-000' }));
  expect(() => perfils.desaElMeuUsername(PERE, 'ab')).toThrow(expect.objectContaining({ code: 'SDP-USER-001' }));
  expect(() => perfils.desaElMeuUsername(PERE, 'consola')).toThrow(expect.objectContaining({ code: 'SDP-USER-002' }));
  for (let n = 0; n < 10; n += 1) perfils.desaElMeuUsername(PERE, `prova-${n}`);
  expect(() => perfils.desaElMeuUsername(PERE, 'una-mes')).toThrow(expect.objectContaining({ code: 'SDP-USER-003' }));
});

/* En local només es resol la fitxa pròpia (sencera): la porta, publicada o no.
   PerfilPublicSection només el pinta si és publicada. */
test('el perfil públic: l’identificador de la fitxa sencera', () => {
  const perfils = createLocalPerfilsAdapter();
  perfils.desaElMeuUsername(ANNA, 'annaperez');
  expect(perfils.loadPerfilPublic('u-anna', ANNA).usuari).toBe('annaperez');
  perfils.updateProfile(ANNA, { is_public: false });
  expect(perfils.loadPerfilPublic('u-anna', ANNA).usuari).toBe('annaperez');
  expect(perfils.loadPerfilPublic('u-anna', ANNA).publicat).toBe(false);
});
