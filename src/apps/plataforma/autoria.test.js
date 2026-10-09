/* Plataforma d'Apps Enxufables · l'autoria de les targetes d'una app (REGLA
   D'OR 1, ordre del Mestre del 261004): la boina de l'entitat del projecte,
   resolta per identificador, i cap autor inventat.
   Onada 8 (261009) · La boina porta al perfil de l'entitat
   (RUTA_PERFIL_PROJECTE), ja no a la pàgina del projecte. */
import { describe, expect, test } from 'vitest';
import { RUTA_PERFIL_PROJECTE, rutaDAutoria } from '../../config/navigation.js';
import { ENTITAT_PROJECTE, autoriaDe } from './index.js';
import { ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';

describe('autoriaDe', () => {
  test('l’entitat del projecte: «Sóc de Poble», el seu poble i el seu logo, i porta al seu perfil', () => {
    const boina = autoriaDe(ENTITAT_PROJECTE);
    expect(boina).toEqual({
      nom: 'Sóc de Poble',
      poble: 'La Torre de les Maçanes',
      // Onada 8 (261009) · El logo és el PNG de 256x256 (abans, l'SVG).
      avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
      href: RUTA_PERFIL_PROJECTE
    });
    expect(boina.href).toBe('/empresa/socdepoble');
    /* La ruta és la de rutaDAutoria per a eixe identificador: una sola font per a tot Sóc de Poble. */
    expect(boina.href).toBe(rutaDAutoria(ENTITAT_PROJECTE));
    expect(Object.isFrozen(boina)).toBe(true);
    expect(Object.isFrozen(ENTITAT_PROJECTE)).toBe(true);
  });

  test('es resol per identificador (també per l’slug), mai pel nom que es veu', () => {
    /* Ordre del Mestre (261007) · El slug declarat és 'socdepoble', el mateix
       text que l'id de la llavor. */
    expect(autoriaDe({ tipus: 'entitat', id: ENTITAT_PILOT_SLUG })?.href).toBe(RUTA_PERFIL_PROJECTE);
    expect(autoriaDe({ tipus: 'entitat', id: 'Sóc de Poble' })).toBeNull();
  });

  test('cap autor inventat: una persona, una entitat desconeguda o res tornen null', () => {
    for (const autor of [
      { tipus: 'persona', id: ENTITAT_PROJECTE.id },
      { tipus: 'entitat', id: 'una-altra-entitat' },
      { tipus: 'entitat' },
      { tipus: 'grup', id: ENTITAT_PROJECTE.id },
      null,
      undefined
    ]) {
      expect(autoriaDe(autor), JSON.stringify(autor)).toBeNull();
    }
  });
});
