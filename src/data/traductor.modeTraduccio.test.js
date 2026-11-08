/* R51 (P0-46; auditoria R11, defensa en profunditat) · tradueixTot refusa un
   translation_mode protegit ('curated_5_langs', 'none' o invàlid) amb
   NO_DISPONIBLE ABANS del pressupost (comprovaPagina) i de cap petició: el
   doble del transport no rep cap crida. Sense mode, amb undefined, null o
   'on_the_fly', traduïx com sempre. */
import { describe, expect, it, vi } from 'vitest';
import { CODI_TRADUCCIO, tradueixTot } from './traductor.js';

const transport = () => ({
  disponible: true,
  comprovaPagina: vi.fn(),
  tradueix: vi.fn(async (textos, desti) => ({ traduccions: textos.map((text) => `[${desti}] ${text}`), desti, cache: false }))
});

describe('R51 · tradueixTot i el translation_mode de l’element', () => {
  it.each([
    ['none', 'none'],
    ['la revisada', 'curated_5_langs'],
    ['un mode que no existix', 'auto'],
    ['un mode en majúscules', 'ON_THE_FLY'],
    ['un mode buit', '']
  ])('%s: es refusa sense cap crida al transport (ni pressupost ni petició)', async (_, translation_mode) => {
    const motor = transport();
    const enOriginal = vi.fn();
    await expect(tradueixTot(motor, ['Crònica de la festa', 'Entradeta'], 'ES', { translation_mode, enOriginal }))
      .rejects.toMatchObject({ name: 'ErrorTraductor', codi: CODI_TRADUCCIO.NO_DISPONIBLE });
    expect(motor.comprovaPagina).toHaveBeenCalledTimes(0);
    expect(motor.tradueix).toHaveBeenCalledTimes(0);
    expect(enOriginal).not.toHaveBeenCalled();
  });

  /* Troballa D1 · Un mode heretat (opcions fetes amb Object.create) passava la
     comprovació d'«hi ha mode» però el predicat només llegia propietats pròpies
     i el deixava passar. Ara el valor es llig una vegada i es jutja tal qual. */
  it.each([
    ['none heretat', 'none'],
    ['la revisada heretada', 'curated_5_langs'],
    ['un mode invàlid heretat', 'auto']
  ])('%s (Object.create): també es refusa sense cap crida al transport', async (_, translation_mode) => {
    const motor = transport();
    await expect(tradueixTot(motor, ['Crònica de la festa'], 'ES', Object.create({ translation_mode })))
      .rejects.toMatchObject({ name: 'ErrorTraductor', codi: CODI_TRADUCCIO.NO_DISPONIBLE });
    expect(motor.comprovaPagina).toHaveBeenCalledTimes(0);
    expect(motor.tradueix).toHaveBeenCalledTimes(0);
  });

  it.each([
    ['sense l’opció', {}],
    ['amb undefined', { translation_mode: undefined }],
    ['amb null (la regla general)', { translation_mode: null }],
    ['amb l’automàtica', { translation_mode: 'on_the_fly' }]
  ])('%s: traduïx com sempre', async (_, opcions) => {
    const motor = transport();
    await expect(tradueixTot(motor, ['Crònica de la festa'], 'ES', opcions)).resolves.toEqual(['[ES] Crònica de la festa']);
    expect(motor.comprovaPagina).toHaveBeenCalledTimes(1);
    expect(motor.tradueix).toHaveBeenCalledTimes(1);
  });
});
