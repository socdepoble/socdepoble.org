/**
 * Esmena 3 del pla 261007_1645 · La fitxa d'un producte al MAS porta la seua
 * primera foto (fotoDeLaTargeta, la regla de les targetes del Mercat i del
 * Mur), no l'imageSrc que per a la Samarreta és el logotip quadrat de qui ven
 * (marketContent.js). Sense cap foto pròpia, la reserva de sempre. Les altres
 * seccions no canvien, i la ruta del lector continua sent la del producte.
 */
import { describe, expect, test } from 'vitest';
import { publicacioComANota } from './masDeLUsuari.js';
import { MARKET_ITEMS } from '../../data/sectionContent.js';

const XICA = '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png';
const QUADRAT_VERD = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';

describe('Esmena 3 · la foto de la fitxa d’un producte al MAS', () => {
  test('la Samarreta de la llavor: la xica, mai el quadrat verd de qui ven; la ruta, la del producte', () => {
    const samarreta = MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');
    // La sonda: la llavor porta el logotip a imageSrc, el que pintava la fitxa.
    expect(samarreta.imageSrc).toBe(QUADRAT_VERD);
    const nota = publicacioComANota(samarreta, 'mercat');
    expect(nota.image).toBe(XICA);
    expect(nota.data.ruta).toBe('/mercat/samarreta-socdepoble');
  });

  test('sense cap foto pròpia, un producte conserva la reserva d’abans', () => {
    expect(publicacioComANota({ id: 'cadira', imageSrc: QUADRAT_VERD, avatar_url: QUADRAT_VERD }, 'mercat').image).toBe(QUADRAT_VERD);
    expect(publicacioComANota({ id: 'buit' }, 'mercat').image).toBe('');
  });

  test('un producte amb fotos: la primera de `images`, encara que imageSrc en porte una altra', () => {
    expect(publicacioComANota({ id: 'mel', imageSrc: '/assets/logo.svg', avatar_url: '/assets/logo.svg', images: ['/assets/mel.png', '/assets/pot.png'] }, 'mercat').image)
      .toBe('/assets/mel.png');
  });

  test('les altres seccions no canvien: imageSrc primer, i el `src` només a Multimèdia', () => {
    const element = { id: 'x', imageSrc: '/assets/a.png', images: ['/assets/b.png'] };
    expect(publicacioComANota(element, 'mur').image).toBe('/assets/a.png');
    expect(publicacioComANota(element, 'events').image).toBe('/assets/a.png');
    expect(publicacioComANota({ id: 'm', src: '/assets/f.jpg', kind: 'image' }, 'multimedia').image).toBe('/assets/f.jpg');
    expect(publicacioComANota({ id: 'm', src: '/assets/f.jpg', kind: 'image' }, 'mur').image).toBe('');
  });
});
