// @vitest-environment node
/**
 * IDEA-46 (B6-B1, marató 261101_2143) · El camp additiu `poble` de l'entrada
 * de l'índex (indexCerca.js · entrada): el poble llegible que la faceta
 * Pobles de l'espai de cerca pinta (facetesCerca.js). `poblePlegat`, el
 * rànquing i el text que es busca són els de sempre. Dades sintètiques.
 */
import { describe, expect, test } from 'vitest';
import {
  cercaEntrades, deActe, deAgent, deIdentitat, deMembre, deOrganitzacio, dePoble, deProducte, dePublicacio, fusionaPerClau, plega
} from './indexCerca.js';

const TORRE = 'La Torre de les Maçanes';

describe('el poble llegible a cada adaptador', () => {
  test('dePublicacio, deAgent, deProducte i dePoble porten el poble tal com s’escriu', () => {
    expect(dePublicacio({ id: 'p1', title: 'Festa de la Cirera', town_name: TORRE }).poble).toBe(TORRE);
    expect(deAgent({ id: 'x1', name: 'Pere Fictici', type: 'PERSON', town_name: 'Benifallim' }).poble).toBe('Benifallim');
    expect(deProducte({ id: 'm1', title: 'Mel de romer', population: 'Ul·ldecona' }).poble).toBe('Ul·ldecona');
    expect(dePoble({ id: 'benifallim', title: 'Benifallim', comarca: "l'Alcoià" }).poble).toBe('Benifallim');
  });

  test('també l’entitat del directori, l’entitat del padró i la persona de la sessió', () => {
    expect(deOrganitzacio({ id: 'o1', name: 'Cooperativa Fictícia', town_name: TORRE }).poble).toBe(TORRE);
    expect(deMembre({ usuari_id: 'o2', nom: 'Colla Fictícia', tipus: 'entitat', town_name: 'Benifallim' }).poble).toBe('Benifallim');
    expect(deMembre({ usuari_id: 'u1', nom: 'Rosa Fictícia', tipus: 'persona' }, { pobleDelPadro: TORRE }).poble).toBe(TORRE);
    expect(deIdentitat({ id: 'u2', nom: 'Joan Fictici', tipus: 'persona' }, { poble: 'Benifallim' }).poble).toBe('Benifallim');
  });

  test('poblePlegat no canvia: és el plegat del mateix poble', () => {
    const e = dePublicacio({ id: 'p1', title: 'Festa de la Cirera', town_name: TORRE });
    expect(e.poblePlegat).toBe('la torre de les macanes');
    expect(e.poblePlegat).toBe(plega(e.poble));
    expect(deProducte({ id: 'm1', title: 'Mel', population: 'Ul·ldecona' }).poblePlegat).toBe('ulldecona');
  });

  test('sense poble (o amb un valor que no és text), un text buit en tots els adaptadors', () => {
    expect(deActe({ id: 'a1', title: 'Concert al llavador', date: '2026-11-03' }).poble).toBe('');
    expect(dePublicacio({ id: 'p2', title: 'Sense poble' }).poble).toBe('');
    expect(dePublicacio({ id: 'p3', title: 'Poble nul', town_name: null }).poble).toBe('');
    expect(dePublicacio({ id: 'p4', title: 'Poble objecte', town_name: { nom: TORRE } }).poble).toBe('');
    expect(deMembre({ usuari_id: 'u3', nom: 'Anna Fictícia', tipus: 'persona' }).poble).toBe('');
  });
});

describe('el poble és text pla, curt i mai un correu', () => {
  test('les etiquetes HTML i els espais sobrers no hi passen', () => {
    expect(dePublicacio({ id: 'p1', title: 'T', town_name: '  <b>La Torre</b>   de les Maçanes ' }).poble).toBe(TORRE);
    expect(dePublicacio({ id: 'p2', title: 'T', town_name: '<script>x()</script>Benifallim' }).poble).toBe('Benifallim');
  });

  test('un poble amb forma de correu no és cap poble llegible (el plegat, el de sempre)', () => {
    const e = dePublicacio({ id: 'p1', title: 'T', town_name: 'veina@exemple.com' });
    expect(e.poble).toBe('');
    expect(e.poblePlegat).toBe(plega('veina@exemple.com'));
  });

  test('un correu tallat pel límit tampoc hi passa: el tros no porta mai cap arrova', () => {
    /* 110 + 1 + «veina@exemple.com»: el tall de 120 deixa «veina@ex», que ja no té forma de correu. */
    const tallat = dePublicacio({ id: 'p1', title: 'T', town_name: `${'A'.repeat(110)} veina@exemple.com` });
    expect(tallat.poble).toBe('');
    /* Un correu més enllà del límit no arriba al tros: el poble llegible es queda, sense arrova. */
    const lluny = dePublicacio({ id: 'p2', title: 'T', town_name: `Benifallim ${'x'.repeat(130)} veina@exemple.com` });
    expect(lluny.poble).toBe(`Benifallim ${'x'.repeat(109)}`);
    expect(lluny.poble.includes('@')).toBe(false);
  });

  test('un poble de milers de caràcters sense espais es talla abans de mirar-lo: cap retrocés quadràtic (ARB-B6B1-01)', () => {
    const llarg = 'a'.repeat(20_000);
    const inici = performance.now();
    const entrades = Array.from({ length: 20 }, (_, i) => [
      dePublicacio({ id: `p${i}`, title: 'Festa', town_name: llarg }),
      deAgent({ id: `x${i}`, name: 'Pere Fictici', type: 'PERSON', town_name: `${llarg}@` }),
      deProducte({ id: `m${i}`, title: 'Mel', population: llarg })
    ]).flat();
    /* Lineal, uns pocs mil·lisegons; amb esCorreu sobre el poble sencer eren uns 340 ms per entrada (més de 20 s). */
    expect(performance.now() - inici).toBeLessThan(750);
    expect(entrades[0].poble).toBe('a'.repeat(120));
    expect(entrades[1].poble).toBe('a'.repeat(120));
  });

  test('com a molt 120 caràcters, tallats per punts de codi (mai mig parell suplent)', () => {
    const llarg = `${'A'.repeat(119)}𝐅𝐅`;
    const e = dePublicacio({ id: 'p1', title: 'T', town_name: llarg });
    expect(e.poble).toBe(`${'A'.repeat(119)}𝐅`);
    expect(Array.from(e.poble)).toHaveLength(120);
    expect(e.poble.endsWith('\uD835')).toBe(false);
  });
});

describe('el rànquing i la cerca, els de sempre', () => {
  test('el poble actiu continua desempatant per poblePlegat', () => {
    const benifallim = dePublicacio({ id: 'b', title: 'Festa major', town_name: 'Benifallim', date: '2026-10-01' });
    const torre = dePublicacio({ id: 't', title: 'Festa major', town_name: TORRE, date: '2026-09-01' });
    const ordre = (pobleActiu) => cercaEntrades([benifallim, torre], 'festa', 'tot', { pobleActiu }).llista.map((e) => e.id);
    expect(ordre('')).toEqual(['b', 't']);
    expect(ordre('la torre de les maçanes')).toEqual(['t', 'b']);
  });

  test('el poble no s’afig al text que es busca: una persona del padró no es troba pel poble', () => {
    const veina = deMembre({ usuari_id: 'u1', nom: 'Rosa Fictícia', tipus: 'persona' }, { pobleDelPadro: 'Benifallim' });
    expect(veina.poble).toBe('Benifallim');
    expect(veina.text).not.toContain('benifallim');
    expect(cercaEntrades([veina], 'benifallim').total).toBe(0);
    expect(cercaEntrades([veina], 'rosa').total).toBe(1);
  });
});

describe('la fusió conserva el poble de la mateixa font que poblePlegat (ARB-B6B1-04)', () => {
  test('una persona sense poble al membre pren el de l’agent', () => {
    const [fusio] = fusionaPerClau([
      deMembre({ usuari_id: 'u1', nom: 'Rosa Fictícia', tipus: 'persona' }),
      deAgent({ id: 'u1', name: 'Rosa Fictícia', type: 'PERSON', town_name: 'Benifallim' })
    ]);
    expect(fusio.poble).toBe('Benifallim');
    expect(fusio.poblePlegat).toBe(plega('Benifallim'));
  });

  test('si la primera ja porta poble del padró, es queda el seu', () => {
    const [fusio] = fusionaPerClau([
      deMembre({ usuari_id: 'u1', nom: 'Rosa Fictícia', tipus: 'persona' }, { pobleDelPadro: 'Alcoi' }),
      deAgent({ id: 'u1', name: 'Rosa Fictícia', type: 'PERSON', town_name: 'Benifallim' })
    ]);
    expect(fusio.poble).toBe('Alcoi');
  });
});
