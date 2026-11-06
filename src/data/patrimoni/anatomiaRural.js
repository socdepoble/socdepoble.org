/**
 * anatomiaRural.js — Les dades de l'Anatomia d'Enginyeria Tradicional Rural
 * (IDEA-109, onada R7). Tres estructures, cada una amb les seues peces
 * ordenades de baix a dalt.
 *
 * Regles (R7G-13, límits de l'àrbitre):
 *  · Els TERMES són els que ha donat el Mestre, tal qual. Cap terme nou.
 *  · La DEFINICIÓ només diu allò que el Mestre ha dit. On la funció exacta
 *    d'una peça no és segura (p. ex. «palla» al pou de neu, «àrguens» a
 *    l'almàssera), la peça porta `pendent: true` i el visor ho diu. No
 *    s'inventa res.
 *  · Cada estructura porta `font`: la referència on contrastar-la. Només
 *    l'almàssera té font (El lèxic de l'oli al Comtat); el pou de neu i el
 *    forn de calç porten FONT_PENDENT. Les definicions que afirmaven més del
 *    que va donar el Mestre s'han rebaixat a una fórmula prudent (A-02, A-03).
 *  · El dibuix és un esquema il·lustratiu: la posició i la forma de cada peça
 *    són orientatives (el visor ho avisa). `forma` descriu la peça per a
 *    l'SVG isomètric (anatomiaRuralGeometria.js); les coordenades són
 *    unitats de l'esquema, no mesures.
 *  · `documental.videoId` és null fins que hi haja un identificador real
 *    d'un vídeo d'Eugenio Monesma. No s'inventa cap identificador.
 *
 * Les peces de `lateral` no s'apilen: se separen cap als costats (accessoris
 * o conceptes que no formen part de la pila). Les de tipus `marcador` no són
 * cap objecte: són conceptes (un transport, una cocció) i es dibuixen com un
 * punt amb un símbol.
 */

export const CANAL_MONESMA = 'https://www.youtube.com/@eugeniomonesma-documentales';

/** Marca de «sense font encara»: no s'inventa cap referència. */
export const FONT_PENDENT = 'font pendent';
export const FONT_OLI = 'El lèxic de l’oli al Comtat';

const DOCUMENTAL = Object.freeze({ canal: CANAL_MONESMA, autor: 'Eugenio Monesma', videoId: null });

export const ESTRUCTURES = Object.freeze([
  {
    id: 'pou-de-neu',
    nom: 'Pou de neu o cava',
    font: FONT_PENDENT,
    resum: 'Cúpula de pedra en sec on s’emmagatzemava la neu, capa a capa.',
    documental: { ...DOCUMENTAL },
    peces: [
      {
        id: 'pouet-drenatge', terme: 'pouet de drenatge',
        definicio: 'Pou xicotet de drenatge: l’aigua s’hi escorre.',
        pendent: false, classe: 'pedra',
        forma: { tipus: 'cilindre', cx: 0, cy: 0, r: 22, z: 0, h: 26 }
      },
      {
        id: 'neu-piconada', terme: 'capes de neu piconada amb maces',
        definicio: 'Capes de neu piconada amb maces.',
        pendent: false, classe: 'neu',
        forma: { tipus: 'cilindre', cx: 0, cy: 0, r: 70, z: 26, h: 60 }
      },
      {
        id: 'palla', terme: 'palla',
        definicio: 'Terme indicat pel Mestre. Funció pendent de contrastar amb la font.',
        pendent: true, classe: 'palla',
        forma: { tipus: 'cilindre', cx: 0, cy: 0, r: 70, z: 86, h: 10 }
      },
      {
        id: 'cupula', terme: 'cúpula de pedra en sec',
        definicio: 'Coberta de la cava, de pedra en sec (sense morter).',
        pendent: false, classe: 'pedra',
        forma: { tipus: 'cupula', cx: 0, cy: 0, r: 78, z: 96, h: 70, fileres: 3 }
      },
      {
        id: 'boca', terme: 'boca d’entrada',
        definicio: 'Boca d’entrada de la cava.',
        pendent: false, classe: 'pedra',
        forma: { tipus: 'prisma', x: -15, y: -15, w: 30, d: 30, z: 166, h: 24 }
      },
      {
        id: 'sarries', terme: 'sàrries',
        definicio: 'Terme indicat pel Mestre. Funció pendent de contrastar amb la font.',
        pendent: true, classe: 'fusta', lateral: { dx: 120, dy: 10 },
        forma: { tipus: 'prisma', x: 70, y: 30, w: 26, d: 18, z: 0, h: 22 }
      },
      {
        id: 'transport-nocturn', terme: 'transport nocturn amb matxos',
        definicio: 'Transport de la neu de nit, amb matxos.',
        pendent: false, classe: 'marcador', lateral: { dx: -130, dy: -20 },
        forma: { tipus: 'marcador', x: -60, y: 40, z: 20, glif: '☾' }
      }
    ]
  },
  {
    id: 'almassera',
    nom: 'Almàssera o tafona d’oli',
    font: FONT_OLI,
    resum: 'La instal·lació tradicional on es mol l’oliva i se’n premsa l’oli.',
    documental: { ...DOCUMENTAL },
    peces: [
      {
        id: 'bassons', terme: 'bassons de decantació',
        definicio: 'Bassons per a la decantació.',
        pendent: false, classe: 'pedra',
        forma: { tipus: 'prisma', x: -60, y: -20, w: 120, d: 40, z: 0, h: 18, fileres: 2 }
      },
      {
        id: 'bassa', terme: 'bassa',
        definicio: 'Terme indicat pel Mestre. Funció pendent de contrastar amb la font.',
        pendent: true, classe: 'pedra',
        forma: { tipus: 'cilindre', cx: 0, cy: 0, r: 75, z: 18, h: 14 }
      },
      {
        id: 'rull', terme: 'rull troncocònic de pedra',
        definicio: 'Rull de pedra de forma troncocònica.',
        pendent: false, classe: 'pedra',
        forma: { tipus: 'con', cx: 0, cy: 0, r1: 36, r2: 26, z: 32, h: 44 }
      },
      {
        id: 'tramuja', terme: 'tramuja',
        definicio: 'Terme indicat pel Mestre. Funció pendent de contrastar amb la font.',
        pendent: true, classe: 'fusta',
        forma: { tipus: 'con', cx: 0, cy: 0, r1: 14, r2: 34, z: 76, h: 26 }
      },
      {
        id: 'esportins', terme: 'esportins d’espart',
        definicio: 'Terme indicat pel Mestre. Funció pendent de contrastar amb la font.',
        pendent: true, classe: 'palla',
        forma: { tipus: 'cilindre', cx: 0, cy: 0, r: 26, z: 102, h: 14, fileres: 3 }
      },
      {
        id: 'premsa', terme: 'premsa de biga i quintar',
        definicio: 'Terme indicat pel Mestre. Funció pendent de contrastar amb la font.',
        pendent: true, classe: 'fusta',
        forma: { tipus: 'prisma', x: -75, y: -8, w: 150, d: 16, z: 116, h: 14 }
      },
      {
        id: 'escalda', terme: 'escaldà',
        definicio: 'Terme indicat pel Mestre. Funció pendent de contrastar amb la font.',
        pendent: true, classe: 'marcador', lateral: { dx: 130, dy: 0 },
        forma: { tipus: 'marcador', x: 80, y: 60, z: 20, glif: '?' }
      },
      {
        id: 'arguens', terme: 'àrguens',
        definicio: 'Terme indicat pel Mestre. Funció pendent de contrastar amb la font.',
        pendent: true, classe: 'marcador', lateral: { dx: -130, dy: 0 },
        forma: { tipus: 'marcador', x: -80, y: 60, z: 20, glif: '?' }
      }
    ]
  },
  {
    id: 'forn-de-calc',
    nom: 'Forn de calç',
    font: FONT_PENDENT,
    resum: 'El forn on la pedra calcària es coïa per a obtindre calç.',
    documental: { ...DOCUMENTAL },
    peces: [
      {
        id: 'boquera', terme: 'boquera',
        definicio: 'Terme indicat pel Mestre. Funció pendent de contrastar amb la font.',
        pendent: true, classe: 'pedra',
        forma: { tipus: 'prisma', x: -25, y: -15, w: 50, d: 30, z: 0, h: 30 }
      },
      {
        id: 'bancada', terme: 'bancada o seti',
        definicio: 'Terme indicat pel Mestre. Funció pendent de contrastar amb la font.',
        pendent: true, classe: 'pedra',
        forma: { tipus: 'cilindre', cx: 0, cy: 0, r: 60, z: 30, h: 14 }
      },
      {
        id: 'olla', terme: 'olla',
        definicio: 'Terme indicat pel Mestre. Funció pendent de contrastar amb la font.',
        pendent: true, classe: 'pedra',
        forma: { tipus: 'cilindre', cx: 0, cy: 0, r: 54, z: 44, h: 70, fileres: 4 }
      },
      {
        id: 'volta', terme: 'volta de pedra viva calcària',
        definicio: 'Volta de pedra viva calcària.',
        pendent: false, classe: 'pedra',
        forma: { tipus: 'cupula', cx: 0, cy: 0, r: 54, z: 114, h: 44, fileres: 2 }
      },
      {
        id: 'carrega', terme: 'càrrega i cocció a uns 1.000 °C',
        definicio: 'Càrrega del forn i cocció a uns 1.000 °C.',
        pendent: false, classe: 'calc',
        forma: { tipus: 'cilindre', cx: 0, cy: 0, r: 38, z: 158, h: 30 }
      },
      {
        id: 'argilagues', terme: 'argilagues',
        definicio: 'Terme indicat pel Mestre. Funció pendent de contrastar amb la font.',
        pendent: true, classe: 'palla', lateral: { dx: 130, dy: 10 },
        forma: { tipus: 'prisma', x: 80, y: 30, w: 30, d: 20, z: 0, h: 20 }
      }
    ]
  }
]);

export const IDS_ESTRUCTURES = Object.freeze(ESTRUCTURES.map((estructura) => estructura.id));

/** L'estructura amb eixe id; sense coincidència, la primera. */
export function estructuraPerId(id) {
  return ESTRUCTURES.find((estructura) => estructura.id === id) || ESTRUCTURES[0];
}
