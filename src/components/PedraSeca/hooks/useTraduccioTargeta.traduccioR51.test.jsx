// @vitest-environment jsdom
/* R51 (P0-46; auditoria R11, peça latent) · useTraduccioTargeta, si mai el
   fa servir una vista, també respecta el translation_mode de la targeta: amb
   un mode protegit ('curated_5_langs', 'none' o invàlid) no està disponible i
   tradueixCampsTargeta es refusa (NO_DISPONIBLE) abans de la memòria cau i
   del motor, que no rep cap crida. Sense mode o amb l'automàtica, com
   sempre. */
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buidaCacheTraduccioTargetes, tradueixCampsTargeta, useTraduccioTargeta } from './useTraduccioTargeta.js';
import { fixaCarregadorLliure, fixaTraductorLliure } from '../../../data/traductorDelLloc.js';
import { CODI_TRADUCCIO } from '../../../data/traductor.js';

const motor = () => ({
  disponible: true,
  comprovaPagina: vi.fn(),
  tradueix: vi.fn(async (textos, desti) => ({ traduccions: textos.map((text) => `[${desti}] ${text}`), desti }))
});
const targeta = (extra) => ({ id: 't1', title: 'Fira de l’Oli', subtitle: 'Tast popular', ...extra });

describe('R51 · useTraduccioTargeta i el translation_mode', () => {
  beforeEach(() => {
    buidaCacheTraduccioTargetes();
    fixaTraductorLliure('apertium');
    fixaCarregadorLliure(null);
  });
  afterEach(() => {
    buidaCacheTraduccioTargetes();
    fixaTraductorLliure(null);
  });

  it.each([
    ['none', 'none'],
    ['la revisada', 'curated_5_langs'],
    ['un mode que no existix', 'auto']
  ])('amb %s: tradueixCampsTargeta es refusa sense cap crida al motor, encara que hi haja una traducció a la memòria cau', async (_, translation_mode) => {
    // La mateixa targeta, traduïda abans sense mode: la memòria cau ja en té l'entrada.
    const previ = motor();
    await tradueixCampsTargeta(targeta(), 'ES', { traductor: previ });
    expect(previ.tradueix).toHaveBeenCalledTimes(1);
    const traductor = motor();
    await expect(tradueixCampsTargeta(targeta({ translation_mode }), 'ES', { traductor }))
      .rejects.toMatchObject({ codi: CODI_TRADUCCIO.NO_DISPONIBLE });
    expect(traductor.tradueix).toHaveBeenCalledTimes(0);
    expect(traductor.comprovaPagina).toHaveBeenCalledTimes(0);
  });

  it.each([
    ['none', { translation_mode: 'none' }, false],
    ['la revisada', { translation_mode: 'curated_5_langs' }, false],
    ['un mode que no existix', { translation_mode: 'auto' }, false],
    /* Troballa DQ-01 · El veredicte del pla: l'automàtica sense llengua original de les cinc és un error. */
    ['l’automàtica sense llengua original', { translation_mode: 'on_the_fly' }, false],
    ['l’automàtica amb una llengua de fora de les cinc', { translation_mode: 'on_the_fly', source_language: 'fr' }, false],
    ['sense mode', {}, true],
    ['l’automàtica', { translation_mode: 'on_the_fly', source_language: 'ca' }, true]
  ])('%s: disponible del hook', (_, extra, esperat) => {
    const { result } = renderHook(() => useTraduccioTargeta(targeta(extra)));
    expect(result.current.disponible).toBe(esperat);
  });

  it('amb l’automàtica, tradueixCampsTargeta traduïx com sempre', async () => {
    const traductor = motor();
    const resultat = await tradueixCampsTargeta(targeta({ translation_mode: 'on_the_fly', source_language: 'ca' }), 'ES', { traductor, usarCache: false });
    expect(resultat.camps.title).toBe('[ES] Fira de l’Oli');
    expect(traductor.tradueix).toHaveBeenCalledTimes(1);
  });

  it('troballa DQ-01 · amb l’automàtica sense llengua original, tradueixCampsTargeta es refusa sense cap crida al motor', async () => {
    const traductor = motor();
    await expect(tradueixCampsTargeta(targeta({ translation_mode: 'on_the_fly' }), 'ES', { traductor, usarCache: false }))
      .rejects.toMatchObject({ codi: CODI_TRADUCCIO.NO_DISPONIBLE });
    expect(traductor.tradueix).toHaveBeenCalledTimes(0);
  });
});
