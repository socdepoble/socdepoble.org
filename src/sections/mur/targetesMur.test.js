/* Ordre del Mestre, 261001 · Les targetes del Mur, pures: les pàgines del
   sistema, l'instant de cada targeta i l'ordre. Les compartixen el Mur i la
   pàgina /calendari. */
import { describe, expect, test, vi } from 'vitest';
import { clauDeLaTargeta, momentDeLaTargeta, momentEditorial, perMomentDescendent, targetesDeSistema } from './targetesMur.js';
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

/* R51 (P0-49 / IDEA-180) · L'instant editorial del Mur: publish_date i, si és
   absent, null o buit, created_at. updated_at no puja cap peça. Un valor
   present però invàlid no cau a created_at: va al final. Empat per la clau
   `${type}-${id}`, en ordre de codi. */
describe('R51 · momentEditorial i l’empat per clau', () => {
  test('publish_date mana sobre created_at, i updated_at no hi compta', () => {
    const item = { id: 'p', type: 'feed', publish_date: '2026-06-01T09:00:00.000Z', created_at: '2026-07-01T10:00:00Z', updated_at: '2099-01-01T00:00:00Z' };
    expect(momentEditorial(item)).toBe(Date.parse('2026-06-01T09:00:00.000Z'));
    expect(momentDeLaTargeta(item, null)).toBe(Date.parse('2026-06-01T09:00:00.000Z'));
    expect(momentEditorial({ created_at: '2026-08-01T10:00:00.000Z', updated_at: '2026-09-10T10:00:00.000Z' })).toBe(Date.parse('2026-08-01T10:00:00.000Z'));
  });

  test.each([undefined, null, ''])('publish_date absent (%j): la de creació', (publish_date) => {
    expect(momentEditorial({ publish_date, created_at: '2026-01-01T10:00:00Z' })).toBe(Date.parse('2026-01-01T10:00:00Z'));
  });

  test('els sis decimals de PostgREST es retallen als mil·lisegons; un Date vàlid és el seu instant', () => {
    expect(momentEditorial({ created_at: '2026-07-01T10:00:00.183412+00:00' })).toBe(Date.parse('2026-07-01T10:00:00.183Z'));
    expect(momentEditorial({ publish_date: new Date(Date.UTC(2026, 6, 1, 10)) })).toBe(Date.UTC(2026, 6, 1, 10));
  });

  /* R51V-05 · El retall és només per a created_at (la columna del servidor):
     un publish_date de quatre decimals és invàlid, com diu el contracte, i no
     cau a created_at. */
  test('un publish_date amb més de tres decimals no es retalla: invàlid, al final', () => {
    const avisa = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(momentEditorial({ id: 'q', type: 'feed', publish_date: '2026-11-07T10:00:00.1234Z', created_at: '2026-01-01T10:00:00Z' })).toBeNull();
      expect(momentEditorial({ id: 'q2', type: 'feed', publish_date: '2026-11-07T10:00:00.123Z', created_at: '2026-01-01T10:00:00.123456+00:00' }))
        .toBe(Date.parse('2026-11-07T10:00:00.123Z'));
    } finally {
      avisa.mockRestore();
    }
  });

  test('un valor present però invàlid no cau a created_at i no llança: null, al final', () => {
    const avisa = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      for (const publish_date of ['demà', '2026-10-05', '2026-09-01T09:00:00', '2026-02-30T10:00Z', 42, {}, [], new Date('x')]) {
        expect(momentEditorial({ id: 'x', type: 'feed', publish_date, created_at: '2026-01-01T10:00:00Z' }), String(publish_date)).toBeNull();
      }
      expect(momentEditorial({ created_at: 'demà' })).toBeNull();
      expect(avisa).toHaveBeenCalled();
      expect(String(avisa.mock.calls[0][0])).toContain('R51_PUBLICATION_DATE_INVALID');
    } finally {
      avisa.mockRestore();
    }
    for (const brossa of [null, undefined, 0, 'text', true]) expect(momentEditorial(brossa)).toBeNull();
    expect(momentEditorial({})).toBeNull();
  });

  test('un acte continua amb el seu inici; un acte amb la boina de publicació, amb l’instant editorial', () => {
    const acte = { id: 'a', type: 'event', title: 'Aplec', date: '2026-10-03', time: '18:00', created_at: '2026-09-01T10:00:00Z' };
    expect(momentDeLaTargeta(acte, acteAEsdeveniment(acte))).toBe(new Date(2026, 9, 3, 18, 0).getTime());
    const ambBoina = { ...acte, boinaDataPublicacio: true, publish_date: '2026-09-15T08:00:00.000Z' };
    expect(momentDeLaTargeta(ambBoina, acteAEsdeveniment(ambBoina))).toBe(Date.parse('2026-09-15T08:00:00.000Z'));
  });

  test('empat: per clau ascendent en ordre de codi, també entre les que no porten data; sense clau, estable', () => {
    const entrades = [
      { clau: 'sistema-rutes-de-poble', moment: 5 }, { clau: 'sistema-banc-de-llavors', moment: 5 },
      { clau: 'feed-z', moment: null }, { clau: 'sistema-arbres-monumentals', moment: 5 },
      { clau: 'feed-B', moment: null }, { clau: 'feed-a', moment: 9 }
    ];
    expect([...entrades].sort(perMomentDescendent).map((e) => e.clau)).toEqual([
      'feed-a', 'sistema-arbres-monumentals', 'sistema-banc-de-llavors', 'sistema-rutes-de-poble', 'feed-B', 'feed-z'
    ]);
    const senseClau = [{ id: 'y', moment: 1 }, { id: 'x', moment: 1 }];
    expect([...senseClau].sort(perMomentDescendent).map((e) => e.id)).toEqual(['y', 'x']);
    expect(clauDeLaTargeta({ type: 'sistema', id: 'herbari' })).toBe('sistema-herbari');
  });

  test('l’ordre del Mur amb publish_date i created_at barrejats: la data triada mana, l’edició no', () => {
    const items = [
      { id: 'vella', type: 'feed', created_at: '2026-08-15T10:00:00Z' },
      { id: 'editada', type: 'feed', created_at: '2026-08-01T10:00:00Z', updated_at: '2026-09-10T10:00:00Z' },
      { id: 'triada', type: 'feed', created_at: '2026-06-01T10:00:00Z', publish_date: '2026-10-05T08:30:00.000Z' },
      { id: 'sense', type: 'feed' },
      { id: 'dolenta', type: 'feed', publish_date: '2026-10-05', created_at: '2026-12-01T10:00:00Z' }
    ];
    const avisa = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const ordre = items.map((item) => ({ item, clau: clauDeLaTargeta(item), moment: momentDeLaTargeta(item, null) }))
        .sort(perMomentDescendent).map(({ item }) => item.id);
      expect(ordre).toEqual(['triada', 'vella', 'editada', 'dolenta', 'sense']);
    } finally {
      avisa.mockRestore();
    }
  });
});
