import { describe, expect, test } from 'vitest';
import { itemsDePerfil } from './perfilModel.js';

/* Gauntlet 261016 (encàrrec D; pla, Onada 1.1.4: «han de beure exactament de
   la mateixa instància de dades») · La imatge de «La fitxa» de la llista
   central és la de la fitxa (avatarDeLaFitxa, fitxaDePerfil.js), la mateixa
   regla que l'editor, «Les vistes» i «El compte»: la columna de la fila
   (avatar_url o logo_url) i, sense cap, la reserva de la identitat. Este
   model és pur i no veu la cua d'autodesament: l'esborrany el posa qui pinta
   la fila (FitxaDePerfil, PerfilShell.jsx; PerfilShell.avatarFontUnica.test.jsx).
   La resta d'apartats no porten imatge. Dades sintètiques. */
const fitxaDe = (identitat) => itemsDePerfil([identitat]).find((item) => item.id === `${identitat.id}-fitxa`);

describe('Gauntlet 261016 (encàrrec D) · la imatge de «La fitxa» a la llista central', () => {
  test('la columna de la fila guanya a la reserva de la identitat (la foto de la sessió)', () => {
    const jo = { id: 'jo', mena: 'persona', nom: 'Pep', avatar: 'https://proveidor.example/foto.jpg', dades: { avatar_url: '/assets/pep.webp' } };
    expect(fitxaDe(jo).image).toBe('/assets/pep.webp');
    const forn = { id: 'O', mena: 'empresa', nom: 'Forn', avatar: '/assets/vell.webp', dades: { role: 'owner', logo_url: '/assets/forn.webp' } };
    expect(fitxaDe(forn).image).toBe('/assets/forn.webp');
    const iaia = { id: 'A', mena: 'agent', nom: 'IAIA', avatar: null, dades: { avatar_url: 'sdp-media://agents/iaia.webp' } };
    // Una referència opaca passa crua: ItemMedia la resol pel port.
    expect(fitxaDe(iaia).image).toBe('sdp-media://agents/iaia.webp');
  });

  test('sense columna, la reserva de la identitat; sense cap de les dues, cap imatge (la icona de la identitat)', () => {
    expect(fitxaDe({ id: 'jo', mena: 'persona', nom: 'Pep', avatar: 'a.webp', dades: {} }).image).toBe('a.webp');
    expect(fitxaDe({ id: 'jo', mena: 'persona', nom: 'Pep', avatar: null, dades: {} }).image).toBeUndefined();
    expect(fitxaDe({ id: 'G', mena: 'grup', nom: 'Colla', dades: { role: 'member' } }).image).toBeUndefined();
  });

  test('cap altre apartat porta imatge', () => {
    const jo = { id: 'jo', mena: 'persona', nom: 'Pep', avatar: 'a.webp', dades: { avatar_url: 'a.webp' } };
    const altres = itemsDePerfil([jo], { ambPrivacitat: true }).filter((item) => item.id !== 'jo-fitxa');
    expect(altres.map((item) => [item.id, item.image])).toEqual([
      ['jo-vistes', undefined], ['jo-compte', undefined], ['jo-privacitat', undefined], ['jo-nodes', undefined],
      ['sense-organitzacions-crear', undefined],
    ]);
  });
});
