import { describe, expect, it, vi } from 'vitest';
import { ajudaDePublicacioIAIA } from './iaiaPublicacions.js';
import { SUGGERIMENTS_RAPIDS_IAIA, extreuAccionsDeRespostaIAIA, respostaDeLaIAIA } from './iaiaLocal.js';
import { SECTIONS } from '../config/sections.js';
import { segmentaRutesDeLaWiki } from '../sections/xat/enllacos.js';

describe('guia i esborranys locals de la IAIA', () => {
  it.each([
    ['Com publique un anunci al Mur?', '/mur'], ['Com publicar un producte al Mercat?', '/mercat'],
    ['Vull publicar un viatge en cotxe', '/vehicle'], ['Com publique una oferta de treball?', '/treball'],
    ['Com publicar un pis de lloguer?', '/habitatge'], ['Com publique un acte al calendari?', '/calendari']
  ])('%s: guia immediata, navegable, sense carregar Wiki', async (pregunta, ruta) => {
    const carrega = vi.fn(() => new Promise(() => {}));
    const resposta = await respostaDeLaIAIA(pregunta, { carrega });
    expect(resposta).toContain(ruta); expect(resposta).toContain('jo no l’he publicada');
    expect(segmentaRutesDeLaWiki([{ tipus: 'text', text: resposta }]).some((p) => p.ruta === ruta)).toBe(true);
    expect(carrega).not.toHaveBeenCalled();
  });
  /* D3-xat-iaia-e2ee-01 · Les guies de vehicle, treball i habitatge porten a la
     secció vertical (on hi ha «Publicar»), no a la pàgina de «Saber-ne més», i
     el botó d'acció du el títol i l'adreça de la mateixa secció. */
  it.each([
    ['vehicle', 'Vull publicar un viatge en cotxe'],
    ['treball', 'Com publique una oferta de treball?'],
    ['habitatge', 'Com puc publicar un lloguer de pis?']
  ])('%s: la ruta de la guia és la de la secció vertical de SECTIONS', async (id, pregunta) => {
    const seccio = SECTIONS.find((s) => s.id === id);
    expect(seccio).toMatchObject({ kind: 'vertical' });
    const resposta = await respostaDeLaIAIA(pregunta, { carrega: vi.fn() });
    expect(resposta).toContain(`Obri ${seccio.path} per a consultar la secció`);
    expect(resposta).not.toContain('/page/');
    expect(extreuAccionsDeRespostaIAIA(resposta).map((a) => a.ruta)).toContain(seccio.path);
  });
  /* D3-xat-iaia-e2ee-02 · On diu la persona que vol publicar mana sobre les
     paraules del contingut; si en diu dues, la IAIA respon les dues. */
  it.each([
    ['Com publique al Mur un avís de la Casa de la Cultura?', ['/mur'], ['Habitatge']],
    ['Com publique al Mercat la venda del meu cotxe vell?', ['/mercat'], ['Compartir cotxe']],
    ['Vull publicar al calendari la festa de la casa del poble', ['/calendari'], ['Habitatge']],
    [SUGGERIMENTS_RAPIDS_IAIA[0].pregunta, ['/vehicle', '/mercat'], ['Habitatge', 'Calendari']]
  ])('%s: la guia de la secció que nomena', (pregunta, rutes, mai) => {
    const text = ajudaDePublicacioIAIA(pregunta);
    for (const ruta of rutes) expect(text).toContain(`Obri ${ruta} per a consultar la secció`);
    expect(text.match(/Obri \/\S+ per a consultar/g)).toHaveLength(rutes.length);
    for (const nom of mai) expect(text).not.toContain(`Per a ${nom},`);
    expect(text.match(/jo no l’he publicada/g)).toHaveLength(1);
    expect(text.match(/Bloc de Notes/g)).toHaveLength(1);
  });
  it('sense cap destí explícit, la primera guia que casa: anar al treball en cotxe és Compartir cotxe', () => {
    const text = ajudaDePublicacioIAIA('Com publique que vaig al treball en cotxe?');
    expect(text).toContain('Per a Compartir cotxe,');
    expect(text).toContain('Obri /vehicle per a consultar la secció');
    expect(text).not.toContain('/treball');
  });
  it('dos destins i demana redacció: el missatge genèric, sense triar cap plantilla', () => {
    expect(ajudaDePublicacioIAIA('Redacta un anunci al Mercat i per Compartir cotxe')).toContain('Digues si és');
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
