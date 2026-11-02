import { describe, expect, it, vi } from 'vitest';
import { ajudaDePublicacioIAIA } from './iaiaPublicacions.js';
import { respostaDeLaIAIA } from './iaiaLocal.js';
import { segmentaRutesDeLaWiki } from '../sections/xat/enllacos.js';

describe('guia i esborranys locals de la IAIA', () => {
  it.each([
    ['Com publique un anunci al Mur?', '/mur'], ['Com publicar un producte al Mercat?', '/mercat'],
    ['Vull publicar un viatge en cotxe', '/page/vehicle_compartit'], ['Com publique una oferta de treball?', '/page/treball'],
    ['Com publicar un pis de lloguer?', '/page/habitatge'], ['Com publique un acte al calendari?', '/calendari']
  ])('%s: guia immediata, navegable, sense carregar Wiki', async (pregunta, ruta) => {
    const carrega = vi.fn(() => new Promise(() => {}));
    const resposta = await respostaDeLaIAIA(pregunta, { carrega });
    expect(resposta).toContain(ruta); expect(resposta).toContain('jo no l’he publicada');
    expect(segmentaRutesDeLaWiki([{ tipus: 'text', text: resposta }]).some((p) => p.ruta === ruta)).toBe(true);
    expect(carrega).not.toHaveBeenCalled();
  });
  it('redacta una plantilla amb buits explícits, sense inventar preus, dates o dades del poble', () => {
    const text = ajudaDePublicacioIAIA('Redacta un anunci per a vendre al mercat');
    expect(text).toContain('Completa els camps entre claudàtors');
    expect(text).toContain('[Producte]'); expect(text).toContain('Proposa Card');
  });
  it('incorpora les dades explícites de la persona sense inventar camps', () => {
    const text = ajudaDePublicacioIAIA("Ajuda'm a redactar un anunci: venc una bicicleta roja per 60 euros a la Torre.");
    expect(text).toContain('venc una bicicleta roja per 60 euros a la Torre.');
    expect(text).not.toContain('[Producte]');
    expect(text).toContain('completa només la informació que falte');
    expect(text).toContain('jo no l’he publicada');
  });
  it('un horari no es confon amb el separador del relat', () => {
    const text = ajudaDePublicacioIAIA('Redacta un anunci de viatge en cotxe a les 17:30');
    expect(text).toContain('Completa els camps entre claudàtors');
    expect(text).not.toContain('Anunci per a');
  });
  it('demana les dades que falten, i no intercepta preguntes que no són de publicació', () => {
    expect(ajudaDePublicacioIAIA('Ajuda’m a redactar')).toContain('Digues si és');
    expect(ajudaDePublicacioIAIA('Què és el Mercat?')).toBeNull();
    expect(ajudaDePublicacioIAIA(null)).toBeNull();
    expect(ajudaDePublicacioIAIA('x'.repeat(2001))).toBeNull();
  });
});
