/* T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · La boina taronja
   d'autor enllaça SEMPRE a la pàgina de qui signa: Sóc de Poble, a la pàgina
   del projecte; el Javi i qualsevol altra persona o entitat, al seu perfil. Es
   resol per identificador (id, slug o àlies de la llavor), mai pel nom.
   Onada 8 (261009) · Derogat el /projecte de la boina: Sóc de Poble també
   porta al seu perfil públic, RUTA_PERFIL_PROJECTE ('/empresa/socdepoble').
   /projecte continua sent la pàgina editorial (RUTA_PROJECTE). Les proves de
   la boina lligen la constant. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  oblidaEntitatDelProjecte, registraEntitatDelProjecte, resolEntitatDelProjecte, RUTA_PERFIL_PROJECTE, RUTA_PROJECTE, rutaDAutoria,
  rutaDePerfil, rutaDePerfilDAutor, resolvePageSlugPath, subscriuEntitatDelProjecte, versioEntitatDelProjecte
} from './navigation.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, ENTITATS_SEED, PERSONA_PILOT } from '../data/identitatsSeed.js';
import { DEFAULT_AUTHOR, esRutaDelProjecte, rutaDAutorSegura } from '../components/universal/UniversalUtils.js';

describe('la ruta del projecte', () => {
  test('RUTA_PROJECTE és la ruta canònica de la pàgina del projecte', () => {
    expect(RUTA_PROJECTE).toBe('/projecte');
    expect(resolvePageSlugPath('projecte')).toBe(RUTA_PROJECTE);
  });

  /* Onada 8 (261009) · La boina de Sóc de Poble és el seu perfil, pel slug
     declarat; DEFAULT_AUTHOR l'escriu en literal i ací se'n fixa la igualtat. */
  test('Onada 8 · RUTA_PERFIL_PROJECTE és el perfil de l’entitat pel slug declarat, i DEFAULT_AUTHOR hi porta', () => {
    expect(RUTA_PERFIL_PROJECTE).toBe('/empresa/socdepoble');
    expect(RUTA_PERFIL_PROJECTE).toBe(rutaDePerfil('entitat', ENTITAT_PILOT_SLUG));
    expect(DEFAULT_AUTHOR.href).toBe(RUTA_PERFIL_PROJECTE);
    expect(RUTA_PERFIL_PROJECTE).not.toBe(RUTA_PROJECTE);
  });

  test('Onada 8 · esRutaDelProjecte accepta la ruta nova i la vella (HTML desat), i res més', () => {
    expect(esRutaDelProjecte(RUTA_PERFIL_PROJECTE)).toBe(true);
    expect(esRutaDelProjecte(RUTA_PROJECTE)).toBe(true);
    for (const ruta of ['/empresa/forn', '/gent/socdepoble', '/grup/socdepoble', '/xat?amb=socdepoble', '/projecte/', '', null, undefined]) {
      expect([ruta, esRutaDelProjecte(ruta)]).toEqual([ruta, false]);
    }
  });

  test('Onada 8 · cap autoria no torna /projecte ni el xat: tothom, al seu perfil', () => {
    for (const autor of [
      { tipus: 'entitat', id: ENTITAT_PILOT_ID }, { tipus: 'entitat', id: 'soc-de-poble_official' }, { id: ENTITAT_PILOT_SLUG },
      { tipus: 'persona', id: 'pepa' }, { tipus: 'grup', id: 'colla' }, { tipus: 'ia', id: 'iaia' }, { tipus: 'entitat', id: 'forn' }
    ]) {
      const ruta = rutaDAutoria(autor);
      expect([autor, ruta === RUTA_PROJECTE, ruta.startsWith('/xat')]).toEqual([autor, false, false]);
      expect([autor, /^\/(empresa|gent|grup|perfil)\//.test(ruta)]).toEqual([autor, true]);
    }
  });

  test('Onada 8 · una boina amb la ruta vella /projecte enllaça al perfil, mai a /projecte', () => {
    expect(rutaDAutorSegura(RUTA_PROJECTE)).toBe(RUTA_PERFIL_PROJECTE);
    expect(rutaDAutorSegura(RUTA_PERFIL_PROJECTE)).toBe(RUTA_PERFIL_PROJECTE);
    expect(rutaDAutorSegura('/gent/pepa')).toBe('/gent/pepa');
  });
});

describe('rutaDAutoria', () => {
  test('l’entitat pilot va al seu perfil (Onada 8) per l’id, l’slug o qualsevol dels seus àlies', () => {
    const [pilot] = ENTITATS_SEED.filter((entitat) => entitat.id === ENTITAT_PILOT_ID);
    const ids = new Set([ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, ...pilot.alies]);
    /* Ordre del Mestre (261007) · El slug declarat és 'socdepoble', el mateix
       text que l'id de la llavor: id i slug són una sola entrada, i queda
       l'àlies amb què la llavor signa la samarreta. Abans, tres. */
    /* Ordre del Mestre (261007) · A producció l'entitat és 'socdepoble',
       sense guions. La resta de proves llig la constant: esta en fixa el
       literal, i un retorn a 'soc-de-poble' es veu ací. */
    expect(ENTITAT_PILOT_SLUG).toBe('socdepoble');
    expect(ids.size).toBeGreaterThanOrEqual(2);
    expect(ids.has('soc-de-poble_official')).toBe(true);
    /* Cap àlies repetit a la llavor, i cap identificador perdut. */
    expect(pilot.alies).toHaveLength(new Set(pilot.alies).size);
    expect(pilot.alies).toEqual(expect.arrayContaining([ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG]));
    for (const id of ids) {
      expect([id, rutaDAutoria({ tipus: 'entitat', id })]).toEqual([id, RUTA_PERFIL_PROJECTE]);
      expect([id, rutaDAutoria({ tipus: 'empresa', id })]).toEqual([id, RUTA_PERFIL_PROJECTE]);
      /* Qui no diu el tipus també: l'àlies ja és de l'entitat. */
      expect([id, rutaDAutoria({ id })]).toEqual([id, RUTA_PERFIL_PROJECTE]);
    }
  });

  test('el Javi (persona pilot) va al seu perfil, i cap dels seus àlies porta al projecte', () => {
    expect(rutaDAutoria({ tipus: 'persona', id: 'javillinares' })).toBe('/gent/javillinares');
    for (const alies of PERSONA_PILOT.alies) {
      expect(rutaDAutoria({ tipus: 'persona', id: alies })).toBe(rutaDePerfil('persona', alies));
    }
  });

  test('qualsevol altra entitat o persona, al seu perfil; un grup o una IA, al seu', () => {
    expect(rutaDAutoria({ tipus: 'entitat', id: 'forn' })).toBe('/empresa/forn');
    expect(rutaDAutoria({ tipus: 'persona', id: 'pepa' })).toBe('/gent/pepa');
    expect(rutaDAutoria({ tipus: 'grup', id: 'colla' })).toBe('/grup/colla');
    expect(rutaDAutoria({ tipus: 'ia', id: 'iaia' })).toBe('/perfil/iaia');
  });

  test('una persona, un grup o una IA amb un id igual a un àlies de l’entitat no és l’entitat', () => {
    expect(rutaDAutoria({ tipus: 'persona', id: ENTITAT_PILOT_ID })).toBe(`/gent/${ENTITAT_PILOT_ID}`);
    expect(rutaDAutoria({ tipus: 'grup', id: ENTITAT_PILOT_SLUG })).toBe(`/grup/${ENTITAT_PILOT_SLUG}`);
    expect(rutaDAutoria({ tipus: 'ia', id: ENTITAT_PILOT_ID })).toBe(`/perfil/${ENTITAT_PILOT_ID}`);
  });

  test('mai pel nom que es veu: «Sóc de Poble» com a id no és cap identificador del projecte', () => {
    expect(rutaDAutoria({ tipus: 'entitat', id: 'Sóc de Poble' })).toBe('/empresa/S%C3%B3c%20de%20Poble');
    expect(rutaDAutoria({ tipus: 'entitat', id: 'xyz', nom: 'Sóc de Poble' })).toBe('/empresa/xyz');
  });

  test('sense qui signa, cap ruta', () => {
    for (const autor of [null, undefined, {}, { tipus: 'entitat' }, { tipus: 'persona', id: '' }, { id: null }]) {
      expect(rutaDAutoria(autor)).toBeNull();
    }
  });
});

describe('rutaDePerfilDAutor passa per rutaDAutoria', () => {
  test('una publicació signada per l’entitat pilot porta al seu perfil; una del Javi, al seu', () => {
    expect(rutaDePerfilDAutor({ author_org_id: 'soc-de-poble_official' })).toBe(RUTA_PERFIL_PROJECTE);
    expect(rutaDePerfilDAutor({ authorOrgId: ENTITAT_PILOT_ID })).toBe(RUTA_PERFIL_PROJECTE);
    expect(rutaDePerfilDAutor({ ownerUserId: 'javillinares' })).toBe('/gent/javillinares');
    expect(rutaDePerfilDAutor({ author_entity_id: 'forn' })).toBe('/empresa/forn');
  });

  test('sense autor conegut, cap ruta (no s’endevina pel nom)', () => {
    expect(rutaDePerfilDAutor(null)).toBeNull();
    expect(rutaDePerfilDAutor({ author_name: 'Sóc de Poble' })).toBeNull();
  });
});

/* T6 en remot (revisió del front «nucli», 261004) · Al servidor, l'entitat
   pilot signa amb l'id del proveïdor (un UUID a Supabase), que la llavor no
   sap. Es reconeix pel slug declarat que torna el backend, mai pel nom. Els
   UUID són sintètics. */
describe('T6 en remot: l’entitat pilot pel seu id de servidor', () => {
  const UUID_PILOT = '0b1c2d3e-4f50-4a61-8b72-93a4b5c6d7e8';
  const UUID_ALTRA = '9f8e7d6c-5b4a-4392-8170-6f5e4d3c2b1a';
  const PERFIL_PILOT = Object.freeze({ tipus: 'entitat', id: UUID_PILOT, slug: ENTITAT_PILOT_SLUG, nom: 'Sóc de Poble' });
  const ABAST = 'backend:["supabase","https://node.exemple.test",null,"remote"]';
  const portAmb = (perfil, capacitats = ['directori']) => ({
    teCapacitat: vi.fn((capacitat) => capacitats.includes(capacitat)),
    loadPerfilPublic: vi.fn(async () => perfil)
  });

  afterEach(() => { oblidaEntitatDelProjecte(); });

  test('abans de saber-lo, el UUID del pilot és una entitat qualsevol; després, porta al perfil pel slug', () => {
    expect(rutaDAutoria({ tipus: 'entitat', id: UUID_PILOT })).toBe(`/empresa/${UUID_PILOT}`);
    expect(rutaDePerfilDAutor({ author_org_id: UUID_PILOT })).toBe(`/empresa/${UUID_PILOT}`);
    expect(registraEntitatDelProjecte(PERFIL_PILOT)).toBe(true);
    expect(rutaDAutoria({ tipus: 'entitat', id: UUID_PILOT })).toBe(RUTA_PERFIL_PROJECTE);
    expect(rutaDePerfilDAutor({ author_org_id: UUID_PILOT })).toBe(RUTA_PERFIL_PROJECTE);
    expect(rutaDePerfilDAutor({ authorOrgId: UUID_PILOT })).toBe(RUTA_PERFIL_PROJECTE);
    /* Una altra entitat del servidor, al seu perfil; una persona amb el mateix id, a la seua fitxa. */
    expect(rutaDePerfilDAutor({ author_org_id: UUID_ALTRA })).toBe(`/empresa/${UUID_ALTRA}`);
    expect(rutaDAutoria({ tipus: 'persona', id: UUID_PILOT })).toBe(`/gent/${UUID_PILOT}`);
    /* Els ids de la llavor continuen valent. */
    expect(rutaDePerfilDAutor({ author_entity_id: ENTITAT_PILOT_ID })).toBe(RUTA_PERFIL_PROJECTE);
  });

  test('només una entitat amb el slug declarat: mai pel nom, mai una persona ni un grup', () => {
    expect(registraEntitatDelProjecte({ tipus: 'entitat', id: UUID_ALTRA, slug: 'forn', nom: 'Sóc de Poble' })).toBe(false);
    expect(registraEntitatDelProjecte({ tipus: 'persona', id: UUID_ALTRA, slug: ENTITAT_PILOT_SLUG })).toBe(false);
    expect(registraEntitatDelProjecte({ tipus: 'grup', id: UUID_ALTRA, slug: ENTITAT_PILOT_SLUG })).toBe(false);
    expect(registraEntitatDelProjecte({ tipus: 'entitat', id: '', slug: ENTITAT_PILOT_SLUG })).toBe(false);
    for (const res of [null, undefined, {}]) expect(registraEntitatDelProjecte(res)).toBe(false);
    expect(rutaDePerfilDAutor({ author_org_id: UUID_ALTRA })).toBe(`/empresa/${UUID_ALTRA}`);
  });

  test('qui escolta s’assabenta quan arriba l’id, una sola vegada', () => {
    const escolta = vi.fn();
    const deixa = subscriuEntitatDelProjecte(escolta);
    const abans = versioEntitatDelProjecte();
    registraEntitatDelProjecte(PERFIL_PILOT);
    registraEntitatDelProjecte(PERFIL_PILOT);
    expect(escolta).toHaveBeenCalledTimes(1);
    expect(versioEntitatDelProjecte()).toBe(abans + 1);
    deixa();
    oblidaEntitatDelProjecte();
    expect(escolta).toHaveBeenCalledTimes(1);
  });

  test('resolEntitatDelProjecte: pel port, amb el slug declarat, una sola crida per abast', async () => {
    const port = portAmb(PERFIL_PILOT);
    const config = { dataMode: 'remote' };
    const primera = resolEntitatDelProjecte({ abast: ABAST, dataMode: 'remote', port, config });
    expect(resolEntitatDelProjecte({ abast: ABAST, dataMode: 'remote', port, config })).toBe(primera);
    await expect(primera).resolves.toBe(true);
    expect(port.loadPerfilPublic).toHaveBeenCalledTimes(1);
    expect(port.loadPerfilPublic).toHaveBeenCalledWith(ENTITAT_PILOT_SLUG, config);
    expect(rutaDePerfilDAutor({ author_org_id: UUID_PILOT })).toBe(RUTA_PERFIL_PROJECTE);
  });

  test('en llavor, sense abast o sense la capacitat, cap crida (i sense la capacitat, ho torna a provar)', async () => {
    const port = portAmb(PERFIL_PILOT);
    expect(resolEntitatDelProjecte({ abast: ABAST, dataMode: 'seed', port })).toBeNull();
    expect(resolEntitatDelProjecte({ abast: ABAST, dataMode: 'local', port })).toBeNull();
    expect(resolEntitatDelProjecte({ abast: null, dataMode: 'remote', port })).toBeNull();
    const senseDirectori = portAmb(PERFIL_PILOT, []);
    expect(resolEntitatDelProjecte({ abast: ABAST, dataMode: 'remote', port: senseDirectori })).toBeNull();
    const queFalla = { teCapacitat: () => { throw new Error('sense backend'); }, loadPerfilPublic: vi.fn() };
    expect(resolEntitatDelProjecte({ abast: ABAST, dataMode: 'remote', port: queFalla })).toBeNull();
    expect(port.loadPerfilPublic).not.toHaveBeenCalled();
    expect(senseDirectori.loadPerfilPublic).not.toHaveBeenCalled();
    /* Quan la capacitat arriba, la crida es fa. */
    await resolEntitatDelProjecte({ abast: ABAST, dataMode: 'remote', port });
    expect(port.loadPerfilPublic).toHaveBeenCalledTimes(1);
  });

  test('un perfil que no és el pilot, absent o amb error: cap id nou i cap error', async () => {
    const altra = portAmb({ tipus: 'entitat', id: UUID_ALTRA, slug: 'forn' });
    await expect(resolEntitatDelProjecte({ abast: ABAST, dataMode: 'remote', port: altra })).resolves.toBe(false);
    oblidaEntitatDelProjecte();
    await expect(resolEntitatDelProjecte({ abast: ABAST, dataMode: 'remote', port: portAmb(null) })).resolves.toBe(false);
    oblidaEntitatDelProjecte();
    const error = { teCapacitat: () => true, loadPerfilPublic: vi.fn(async () => { throw new Error('500'); }) };
    await expect(resolEntitatDelProjecte({ abast: ABAST, dataMode: 'remote', port: error })).resolves.toBe(false);
    expect(rutaDePerfilDAutor({ author_org_id: UUID_ALTRA })).toBe(`/empresa/${UUID_ALTRA}`);
  });

  /* Higiene d'amfitrió (ordre del Mestre, 261004) · Només l'èxit es guarda
     per a sempre. Una fallada esborra la resolució i apunta l'hora: durant
     60 s no es torna a cridar el port, i després sí, sense que ningú haja de
     cridar oblidaEntitatDelProjecte. Abans, la fallada valia fins a canviar
     d'abast (recarregar). */
  describe('una fallada es torna a provar passat el temps', () => {
    const ara = (hora) => vi.setSystemTime(new Date(`2026-10-04T${hora}Z`));
    beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); });
    afterEach(() => { vi.useRealTimers(); });

    test('el port falla, després respon el pilot: la segona crida passat el temps torna true', async () => {
      ara('10:00:00');
      const port = { teCapacitat: () => true, loadPerfilPublic: vi.fn(async () => { throw new Error('xarxa'); }) };
      await expect(resolEntitatDelProjecte({ abast: ABAST, dataMode: 'remote', port })).resolves.toBe(false);
      port.loadPerfilPublic.mockImplementation(async () => PERFIL_PILOT);
      // Dins de l'espera, cap crida nova: null, com sense la capacitat.
      ara('10:00:59');
      expect(resolEntitatDelProjecte({ abast: ABAST, dataMode: 'remote', port })).toBeNull();
      expect(port.loadPerfilPublic).toHaveBeenCalledTimes(1);
      // Passats 60 s, es torna a provar, i ara el pilot respon.
      ara('10:01:00');
      await expect(resolEntitatDelProjecte({ abast: ABAST, dataMode: 'remote', port })).resolves.toBe(true);
      expect(port.loadPerfilPublic).toHaveBeenCalledTimes(2);
      expect(rutaDePerfilDAutor({ author_org_id: UUID_PILOT })).toBe(RUTA_PERFIL_PROJECTE);
      // L'èxit sí que es guarda: ni una hora després es torna a cridar.
      ara('11:01:00');
      await expect(resolEntitatDelProjecte({ abast: ABAST, dataMode: 'remote', port })).resolves.toBe(true);
      expect(port.loadPerfilPublic).toHaveBeenCalledTimes(2);
    });

    test('un perfil null o que no és el pilot també és una fallada que es torna a provar', async () => {
      ara('10:00:00');
      const port = portAmb(null);
      await expect(resolEntitatDelProjecte({ abast: ABAST, dataMode: 'remote', port })).resolves.toBe(false);
      port.loadPerfilPublic.mockImplementation(async () => ({ tipus: 'entitat', id: UUID_ALTRA, slug: 'forn' }));
      ara('10:01:00');
      await expect(resolEntitatDelProjecte({ abast: ABAST, dataMode: 'remote', port })).resolves.toBe(false);
      ara('10:01:30');
      expect(resolEntitatDelProjecte({ abast: ABAST, dataMode: 'remote', port })).toBeNull();
      expect(port.loadPerfilPublic).toHaveBeenCalledTimes(2);
    });

    test('oblidaEntitatDelProjecte també oblida l’hora de la fallada', async () => {
      ara('10:00:00');
      const port = portAmb(null);
      await resolEntitatDelProjecte({ abast: ABAST, dataMode: 'remote', port });
      oblidaEntitatDelProjecte();
      port.loadPerfilPublic.mockImplementation(async () => PERFIL_PILOT);
      await expect(resolEntitatDelProjecte({ abast: ABAST, dataMode: 'remote', port })).resolves.toBe(true);
      expect(port.loadPerfilPublic).toHaveBeenCalledTimes(2);
    });
  });
});
