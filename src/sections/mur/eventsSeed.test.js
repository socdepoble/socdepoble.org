/* Verificació del front «autoria» (261004) · L'acte de la llavor «2n Aplec
   pel Territori» signa amb l'id de l'entitat pilot (author_entity_id). Es
   declara a eventsSeed.js i ací es fixa: l'Aplec és de l'entitat, amb els
   mateixos efectes que la samarreta de marketSeed.js.
     · La boina porta al projecte per l'id (rutaDePerfilDAutor), mai pel nom.
     · En llavor, qui actua com l'entitat el veu al seu MAS, a «Esdeveniments»;
       la persona pilot i el convidat, no.
     · Connectar l'acte es connecta amb l'entitat (targetUserId i autorTipus).
   Funcions pures, sense React (l'entorn és el de DOM perquè navigation.js
   arrossega el sanejador, que necessita DOMPurify). */
import { describe, expect, test } from 'vitest';
import { CALENDAR_EVENTS } from './eventsSeed.js';
import { EVENTS } from './eventsContent.js';
import { MOCK_MARKET_ITEMS } from '../mercat/marketSeed.js';
import { autorDe, objecteDe, rutaConnectarObjecte, rutaDePerfilDAutor, RUTA_PROJECTE } from '../../config/navigation.js';
import { CARPETA_PER_SECCIO, itemsPublicatsDe, pertanyALActor } from '../notes/masDeLUsuari.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, PERSONA_PILOT, aliesDeLActor, autoriaSeed } from '../../data/identitatsSeed.js';

const APLEC = CALENDAR_EVENTS.find((acte) => acte.id === 'aplec-2023');
const SAMARRETA = MOCK_MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');

const ENTITAT = { tipus: 'entitat', id: ENTITAT_PILOT_ID, slug: ENTITAT_PILOT_SLUG };
const PERSONA = { tipus: 'persona', id: '11111111-2222-4333-8444-555555555555', rol: 'membre' };
const CONVIDAT = { tipus: 'persona', id: 'convidat-local', rol: 'convidat' };
const aliesEnLlavor = (actor) => aliesDeLActor(actor, { dataMode: 'seed' });

describe('l’Aplec és de l’entitat pilot', () => {
  test('signa per identificador amb l’entitat pilot, com la samarreta', () => {
    expect(APLEC).toBeDefined();
    expect(APLEC.author_entity_id).toBe(ENTITAT_PILOT_ID);
    expect(autorDe(APLEC)).toEqual({ tipus: 'entitat', id: ENTITAT_PILOT_ID });
    expect(autoriaSeed(APLEC)).toMatchObject({ tipus: 'entitat', nom: 'Sóc de Poble' });
    // La samarreta, el precedent: la mateixa entitat, el mateix camí.
    expect(autorDe(SAMARRETA)?.id).toBe(autorDe(APLEC).id);
  });

  test('la boina porta al projecte per l’id; sense id, el nom sol no porta enlloc', () => {
    expect(rutaDePerfilDAutor(APLEC)).toBe(RUTA_PROJECTE);
    expect(rutaDePerfilDAutor({ ...APLEC, author_entity_id: undefined })).toBeNull();
  });

  test('l’acte del Mur (eventsContent) conserva l’autoria de la llavor', () => {
    const acte = EVENTS.find((item) => item.id === APLEC.id);
    expect(acte.author_entity_id).toBe(ENTITAT_PILOT_ID);
    expect(rutaDePerfilDAutor(acte)).toBe(RUTA_PROJECTE);
  });
});

describe('efectes declarats', () => {
  test('MAS: qui actua com l’entitat el veu a «Esdeveniments»', () => {
    const alies = aliesEnLlavor(ENTITAT);
    expect(pertanyALActor(APLEC, alies)).toBe(true);
    const publicats = itemsPublicatsDe({ events: CALENDAR_EVENTS }, alies);
    expect(publicats.map((p) => [p.id, p.categoryIds])).toEqual([[`publicacio:events:${APLEC.id}`, [CARPETA_PER_SECCIO.events]]]);
  });

  test('MAS: la persona pilot i el convidat no el veuen (no és seu)', () => {
    for (const actor of [PERSONA, CONVIDAT]) {
      const alies = aliesEnLlavor(actor);
      expect(pertanyALActor(APLEC, alies), actor.id).toBe(false);
      expect(itemsPublicatsDe({ events: CALENDAR_EVENTS }, alies), actor.id).toEqual([]);
    }
    // Ni encara que la persona pilot porte tots els seus àlies.
    expect(pertanyALActor(APLEC, new Set(PERSONA_PILOT.alies))).toBe(false);
  });

  test('Connectar l’acte es connecta amb l’entitat (targetUserId i autorTipus)', () => {
    const consulta = new URLSearchParams(rutaConnectarObjecte(objecteDe(APLEC, 'events')).split('?')[1]);
    expect(consulta.get('targetUserId')).toBe(ENTITAT_PILOT_ID);
    expect(consulta.get('autorTipus')).toBe('entitat');
    expect(consulta.get('author')).toBe('Sóc de Poble');
    expect(consulta.get('item_id')).toBe(APLEC.id);
  });
});
