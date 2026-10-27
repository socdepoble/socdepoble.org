/* Ordre del Mestre, 261001 · Les targetes del Mur, pures: les pàgines del
   sistema, l'instant de cada targeta i l'ordre. Les compartixen el Mur i la
   pàgina /calendari. */
import { describe, expect, test, vi } from 'vitest';
import { momentDeLaTargeta, perMomentDescendent, targetesDeSistema } from './targetesMur.js';
import { acteAEsdeveniment } from './agendaMur.js';
import { SYSTEM_PAGES } from '../../config/systemPages.js';

describe('targetesDeSistema', () => {
  test('cada pàgina del copy és una targeta del sistema amb la data de CREACIÓ, mai com a dia d’acte', () => {
    const [primera] = targetesDeSistema({ projecte: { title: 'El projecte', date: '2026-08-20T00:00:00.000Z' } });
    expect(primera).toMatchObject({
      title: 'El projecte', created_at: '2026-08-20T00:00:00.000Z', id: 'projecte', isSystem: true,
      mainHref: '/projecte', type: 'sistema'
    });
    expect(primera.date).toBeUndefined();
  });

  test('una pàgina declarada i absent no es pinta i ho diu a qui la demana', () => {
    const quanFalta = vi.fn();
    expect(targetesDeSistema({}, { quanFalta })).toEqual([]);
    expect(quanFalta.mock.calls.map(([clau]) => clau)).toEqual(SYSTEM_PAGES.map((p) => p.key));
    expect(targetesDeSistema(undefined)).toEqual([]);
  });

  /* Ordre del Mestre (261027; auditoria Gauntlet R5, G1-01 i G5-01) · Dins de
     l'app nativa, «Descàrregues i Aplicacions» no és cap targeta: ni al Mur, ni
     al Calendari, ni a usePaginesDelSistema, que passen tots per ací. No falta:
     no avisa. Per defecte ho decidix el pont de Capacitor (esAppNativa). */
  test('dins de l’app nativa, Descàrregues no és cap targeta, i no falta', () => {
    const copy = { descarregues: { title: 'Descàrregues i Aplicacions' }, projecte: { title: 'El projecte' } };
    const claus = (llista) => llista.map((targeta) => targeta.id);
    expect(claus(targetesDeSistema(copy))).toEqual(['projecte', 'descarregues']);
    const quanFalta = vi.fn();
    expect(claus(targetesDeSistema(copy, { quanFalta, nativa: true }))).toEqual(['projecte']);
    expect(quanFalta.mock.calls.map(([clau]) => clau)).not.toContain('descarregues');
    window.Capacitor = { isNativePlatform: () => true };
    try {
      expect(claus(targetesDeSistema(copy))).toEqual(['projecte']);
    } finally {
      delete window.Capacitor;
    }
  });

  /* Pla 261027_0845 (Guarda Nocturna), T1-06 · Dins de l'app nativa, el copy
     de la targeta passa per paginaPerAppNativa: la frase que nomena una altra
     plataforma mòbil se'n va i la resta es queda. A la web, el mateix text. */
  test('dins de l’app nativa, la targeta no nomena cap altra plataforma mòbil; a la web, el text tal qual', () => {
    const lead = 'Baixa-la de Google Play. La web, sempre.';
    const copy = { projecte: { title: 'El projecte', lead } };
    const [web] = targetesDeSistema(copy, { nativa: false });
    expect(web.lead).toBe(lead);
    const [nativa] = targetesDeSistema(copy, { nativa: true });
    expect(nativa).toMatchObject({ id: 'projecte', title: 'El projecte', lead: 'La web, sempre.' });
  });
});

describe('momentDeLaTargeta i perMomentDescendent', () => {
  test('un acte s’ordena pel seu inici (el de la pastilla), no per la publicació', () => {
    const item = { id: 'a', type: 'event', title: 'Aplec', date: '2026-10-03', time: '18:00', created_at: '2026-09-01T10:00:00Z' };
    expect(momentDeLaTargeta(item, acteAEsdeveniment(item))).toBe(new Date(2026, 9, 3, 18, 0).getTime());
  });

  test('la resta, per la data de la seua pastilla; sense cap data real, null', () => {
    expect(momentDeLaTargeta({ id: 'p', created_at: '2026-09-29T10:00:00.000Z' }, null)).toBe(Date.parse('2026-09-29T10:00:00.000Z'));
    expect(momentDeLaTargeta({ id: 'p' }, null)).toBeNull();
  });

  test('de més nova a més vella; les que no tenen data, al final i en l’ordre en què han arribat', () => {
    const llista = [
      { id: 'x', moment: null }, { id: 'a', moment: 1 }, { id: 'y', moment: null }, { id: 'b', moment: 3 }, { id: 'c', moment: 2 }
    ];
    expect([...llista].sort(perMomentDescendent).map((e) => e.id)).toEqual(['b', 'c', 'a', 'x', 'y']);
  });
});
