// @vitest-environment node
/* D-5 (pla 261101_1246, assalt 10/10; IDEA-49 del Llibre Mestre) · Els àlies
   de poble al detector dels relats i al selector de la fitxa, i les etiquetes
   lliures de la revisió humana. Els relats estan escrits per a esta prova: no
   són el testimoni de cap persona real. */
import { describe, expect, test } from 'vitest';
import { CORE_SCHEMA, load } from 'js-yaml';
import {
  MAX_ETIQUETA_LLIURE, MAX_ETIQUETES_LLIURES, MAX_ETIQUETES_REVISADES, MAX_TEXT_POBLE, MIN_ETIQUETA_LLIURE,
  ACTOR_ESTRUCTURADOR, etiquetaDeText, etiquetaNova, estructuraMemoriaOral, marcaRevisioHumana, normalitzaEtiquetaLliure,
  resolPobleDeText, validaFitxaOkf
} from './memoriaOral.js';
import * as porta from './proposaCard.js';
import { catalegDePobles } from '../pobles/aliesDePobles.js';

const ARA = '2026-11-01T03:00:00Z';
const DESPRES = '2026-11-01T03:10:00Z';
const municipi = (text, opcions) => estructuraMemoriaOral(text, opcions).municipi?.id ?? null;

function parteix(markdown) {
  const fi = markdown.indexOf('\n---\n', 4);
  return { yaml: markdown.slice(4, fi), cos: markdown.slice(fi + 5) };
}
const seccio = (cos, nom) => {
  const inici = cos.indexOf(`\n# ${nom}\n`);
  return cos.slice(inici, cos.indexOf('\n# ', inici + 3));
};

describe('el detector dels relats coneix els àlies', () => {
  test('noms bilingües: Jijona, Torremanzanas, Orcheta i Alcolecha', () => {
    expect(municipi('Vaig nàixer a Jijona l’any cinquanta.')).toBe('xixona');
    const r = estructuraMemoriaOral('De Torremanzanas a Xixona hi havia dues hores amb la mula, i a Jijona veníem el torró.');
    expect(r.candidats.map((c) => [c.id, c.mencions])).toEqual([['xixona', 2], ['la-torre-de-les-macanes', 1]]);
    expect(municipi('Ma mare era d’Orcheta.')).toBe('orxeta');
    expect(municipi('Pujàvem a Alcolecha per la serra.')).toBe('alcoleja');
  });

  test('«la Torre» només amb la T majúscula, també a l’inici de la frase', () => {
    expect(municipi('Vivíem a la Torre i baixàvem a vendre al mercat.')).toBe('la-torre-de-les-macanes');
    expect(municipi('Vivíem a La Torre i baixàvem a vendre al mercat.')).toBe('la-torre-de-les-macanes');
    expect(municipi('A LA TORRE HI HAVIA NEU TOT L’HIVERN.')).toBe('la-torre-de-les-macanes');
    // Minúscula: una torre qualsevol, a mitjan frase o a l'inici.
    expect(municipi('Pujàvem a la torre de l’església a tocar les campanes.')).toBeNull();
    expect(municipi('La torre de l’església tenia dues campanes.')).toBeNull();
    /* Gauntlet D-05 · A l'inici de la frase, la majúscula que compta és la de
       «Torre», no la de «La»: el mateix que a mitjan frase. */
    expect(municipi('La Torre era un poble de pastors i de llauradors.')).toBe('la-torre-de-les-macanes');
    expect(municipi('Deien que la Torre era alta i es veia des del camí.')).toBe('la-torre-de-les-macanes');
    expect(municipi('La Torre era alta i es veia des del camí.')).toBe('la-torre-de-les-macanes');
    // Tota en majúscules, sense cap preposició de lloc davant, no diu res.
    expect(municipi('LA TORRE ERA ALTA.')).toBeNull();
    // El nom sencer guanya l'àlies: una sola menció.
    expect(estructuraMemoriaOral('Vaig nàixer a la Torre de les Maçanes.').candidats.map((c) => c.mencions)).toEqual([1]);
    // Risc acceptat (D-5): un «Forn de la Torre» amb majúscula també ho és; la persona ho corregix en revisar.
    expect(municipi('Compràvem el pa al Forn de la Torre.')).toBe('la-torre-de-les-macanes');
  });

  test('Alcoy i Alicante només si el poble és a la llista de l’aplicació; Alcoi i Ibi mai amb la llavor', () => {
    expect(municipi('Treballava a Alcoy en una fàbrica.')).toBeNull();
    expect(municipi('Treballava a Alcoi i a Ibi.')).toBeNull();
    const pobles = [{ id: 'alcoi', title: 'Alcoi', comarca: "L'Alcoià", provincia: 'Alacant' }];
    expect(municipi('Treballava a Alcoy en una fàbrica.', { pobles })).toBe('alcoi');
    // Els àlies que porta la fitxa del poble, sense codi.
    expect(municipi('Anàvem a Benimantel a peu.', { pobles: [{ id: 'benimantell', title: 'Benimantell', alies: ['Benimantel'] }] })).toBe('benimantell');
    const ambMajuscula = [{ id: 'el-barri', title: 'El Barri Alt', alies: [{ forma: 'el Barri', ambMajuscula: true, majusculaEn: 1 }] }];
    expect(municipi('Vivíem al carrer del Barri.', { pobles: ambMajuscula })).toBeNull();
    expect(municipi('Vivíem a el Barri, dalt del tot.', { pobles: ambMajuscula })).toBe('el-barri');
    expect(municipi('Vivíem a el barri, dalt del tot.', { pobles: ambMajuscula })).toBeNull();
  });
});

describe('resolPobleDeText: el selector de la fitxa', () => {
  test('cada poble, com el diu la gent, cap al seu id', () => {
    const casos = [
      ['Jijona', 'xixona'], ['JIJONA', 'xixona'], ['Torremanzanas', 'la-torre-de-les-macanes'], ['la Torre', 'la-torre-de-les-macanes'],
      ['la torre', 'la-torre-de-les-macanes'], ['Torre de les Maçanes', 'la-torre-de-les-macanes'], ['  la   Torre de les Macanes ', 'la-torre-de-les-macanes'],
      ['Ibi', 'ibi'], ['Tibi', 'tibi'], ['Castalla', 'castalla'], ['Onil', 'onil'], ['Biar', 'biar'], ['Alcoi', 'alcoi'], ['Alcoy', 'alcoi'],
      ['Alacant', 'alacant'], ['Alicante', 'alacant'], ['València', 'valencia'], ['Valencia', 'valencia'], ['Penáguila', 'penaguila']
    ];
    for (const [text, id] of casos) {
      const r = resolPobleDeText(text);
      expect([text, r.estat, r.poble?.id]).toEqual([text, 'trobat', id]);
    }
    expect(resolPobleDeText('Alcoy').poble).toEqual({ id: 'alcoi', nom: 'Alcoi', comarca: "L'Alcoià", provincia: 'Alacant' });
    expect(Object.isFrozen(resolPobleDeText('Alcoy'))).toBe(true);
  });

  test('buit, cap, massa llarg i ambigu', () => {
    expect(resolPobleDeText('')).toEqual({ estat: 'buit' });
    expect(resolPobleDeText('   ')).toEqual({ estat: 'buit' });
    expect(resolPobleDeText(undefined)).toEqual({ estat: 'buit' });
    expect(resolPobleDeText('Madrid')).toEqual({ estat: 'cap' });
    expect(resolPobleDeText('Xixona i Tibi')).toEqual({ estat: 'cap' });
    expect(resolPobleDeText('a'.repeat(MAX_TEXT_POBLE + 1))).toEqual({ estat: 'cap' });
    // Gauntlet T6a-G03 · Massa llarg encara que hi haja un poble: sense el límit seria «trobat».
    expect(resolPobleDeText(`Tibi${'!'.repeat(MAX_TEXT_POBLE)}`)).toEqual({ estat: 'cap' });
    expect(resolPobleDeText(`  ${'Tibi'.padEnd(MAX_TEXT_POBLE, ' ')}`).poble.id).toBe('tibi');
    const pobles = [{ id: 'sant-joan-a', title: 'Sant Joan A', alies: ['Sant Joan'] }, { id: 'sant-joan-b', title: 'Sant Joan B', alies: ['Sant Joan'] }];
    expect(resolPobleDeText('sant joan', { pobles })).toEqual({ estat: 'ambigu', pobles: [expect.objectContaining({ id: 'sant-joan-a' }), expect.objectContaining({ id: 'sant-joan-b' })] });
    // Un nom oficial mana sobre l'àlies d'un altre poble.
    const oficial = [{ id: 'sella', title: 'Sella' }, { id: 'altre', title: 'Altre', alies: ['Sella'] }];
    expect(resolPobleDeText('Sella', { pobles: oficial }).poble.id).toBe('sella');
    expect(() => resolPobleDeText('Tibi', { pobles: 'Tibi' })).toThrow(TypeError);
  });

  test('amb una llista pròpia, només els seus pobles', () => {
    const pobles = [{ id: 'xixona', title: 'Xixona' }];
    expect(resolPobleDeText('Jijona', { pobles }).poble.id).toBe('xixona');
    expect(resolPobleDeText('Alcoi', { pobles })).toEqual({ estat: 'cap' });
    expect(resolPobleDeText('Alcoi', { pobles: catalegDePobles(pobles) }).poble.id).toBe('alcoi');
  });
});

describe('etiquetes lliures', () => {
  test('normalitzaEtiquetaLliure: neta, en minúscules i de 2 a 40 caràcters', () => {
    expect([MIN_ETIQUETA_LLIURE, MAX_ETIQUETA_LLIURE, MAX_ETIQUETES_LLIURES, MAX_ETIQUETES_REVISADES]).toEqual([2, 40, 5, 10]);
    expect(normalitzaEtiquetaLliure('#Pansa')).toBe('pansa');
    expect(normalitzaEtiquetaLliure('##  Pansa')).toBe('pansa');
    expect(normalitzaEtiquetaLliure(' Collita  d’ametles ')).toBe("collita d'ametles");
    expect(normalitzaEtiquetaLliure('Col‧lecta!')).toBe('col·lecta');
    expect(normalitzaEtiquetaLliure('--«Riu Sec»--')).toBe('riu sec');
    expect(normalitzaEtiquetaLliure('ÀVIA')).toBe('àvia');
    expect(normalitzaEtiquetaLliure('A'.normalize('NFD') + '̀via')).toBe('àvia');
    expect(normalitzaEtiquetaLliure('1936')).toBe('1936');
    expect(normalitzaEtiquetaLliure('x'.repeat(MAX_ETIQUETA_LLIURE))).toHaveLength(MAX_ETIQUETA_LLIURE);
    for (const dolenta of ['a', '!!!', '##', "'-·", 'x'.repeat(MAX_ETIQUETA_LLIURE + 1), '', null, 42, ['pansa'], '́́']) {
      expect(normalitzaEtiquetaLliure(dolenta), JSON.stringify(dolenta)).toBeNull();
    }
    // Lineal: un text molt llarg ni es mira.
    expect(normalitzaEtiquetaLliure(`${'-'.repeat(100_000)}a`)).toBeNull();
    // Gauntlet T6a-G03 · Massa llarg encara que, sense els «#», quedara una etiqueta bona.
    expect(normalitzaEtiquetaLliure(`${'#'.repeat(4 * MAX_ETIQUETA_LLIURE)}pansa`)).toBeNull();
  });

  test('etiquetaDeText: el vocabulari pel seu id, el seu nom o el seu títol; si no, lliure', () => {
    for (const text of ['Festes', 'festes i tradicions', 'Les festes', '#FESTES']) {
      expect(etiquetaDeText(text), text).toEqual({ id: 'festes', nom: 'Festes i tradicions', lliure: false, clau: 'festes' });
    }
    expect(etiquetaDeText('Cançons').id).toBe('cancons');
    expect(etiquetaDeText('L’aigua').id).toBe('aigua');
    expect(etiquetaDeText('#Pansa')).toEqual({ id: 'pansa', nom: 'pansa', lliure: true, clau: 'pansa' });
    expect(etiquetaDeText(' Collita  d’ametles ')).toEqual({ id: "collita d'ametles", nom: "collita d'ametles", lliure: true, clau: "collita d'ametles" });
    expect(etiquetaDeText('a')).toBeNull();
  });

  test('etiquetaNova: invàlida, repetida (sense accents ni majúscules), massa o bona', () => {
    expect(etiquetaNova('a')).toEqual({ estat: 'invalida' });
    expect(etiquetaNova('!!!', [])).toEqual({ estat: 'invalida' });
    expect(etiquetaNova('x'.repeat(41), [])).toEqual({ estat: 'invalida' });
    expect(etiquetaNova('Pansá', ['pansa'])).toEqual({ estat: 'repetida', etiqueta: expect.objectContaining({ id: 'pansá' }) });
    expect(etiquetaNova('Festes i tradicions', ['festes']).estat).toBe('repetida');
    const deu = ['festes', 'aigua', 'collita', 'oficis', 'cancons', 'guerra', 'pansa', 'figues', 'riu sec', 'era'];
    expect(etiquetaNova('Infància', deu)).toEqual({ estat: 'massa', maxim: MAX_ETIQUETES_REVISADES });
    const cincLliures = ['pansa', 'figues', 'riu sec', 'era', 'barri'];
    expect(etiquetaNova('torró de casa', cincLliures)).toEqual({ estat: 'massa', maxim: MAX_ETIQUETES_LLIURES, lliures: true });
    // Una del vocabulari encara hi cap.
    expect(etiquetaNova('guerra', cincLliures).estat).toBe('ok');
    expect(etiquetaNova('pansa')).toEqual({ estat: 'ok', etiqueta: { id: 'pansa', nom: 'pansa', lliure: true, clau: 'pansa' } });
    expect(etiquetaNova('pansa', 'no és cap llista').estat).toBe('ok');
  });
});

describe('marcaRevisioHumana amb etiquetes lliures i un poble que no és candidat', () => {
  const RELAT = 'Mon pare treballava a Alcoi i a Ibi, en una fàbrica de joguets. A l’estiu segàvem el blat i collíem les olives al camp.';
  const fitxa = estructuraMemoriaOral(RELAT, { ara: ARA });
  const vocabulari = fitxa.etiquetes.map((e) => e.id);

  test('les lliures van darrere de les del vocabulari, al frontmatter, al YAML i al cos; el títol i la descripció no les nomenen', () => {
    expect([fitxa.municipi, fitxa.candidats, vocabulari]).toEqual([null, [], ['collita', 'oficis']]);
    const revisada = marcaRevisioHumana(fitxa, { persona: 'javi', ara: DESPRES, etiquetesLliures: ['#Pansa', 'Festes', ' Collita  d’ametles ', 'pansá'] });
    const fm = revisada.okf.frontmatter;
    expect(fm.tags).toEqual(['collita', 'oficis', 'festes', 'pansa', "collita d'ametles"]);
    expect(validaFitxaOkf(fm)).toEqual({ valida: true, errors: [] });
    expect(load(parteix(revisada.okf.markdown).yaml, { schema: CORE_SCHEMA })).toEqual(fm);
    expect(revisada.okf.markdown).toContain(`tags: [collita, oficis, festes, pansa, "collita d'ametles"]\n`);
    const etiquetes = seccio(revisada.okf.cos, 'Etiquetes');
    expect(etiquetes).toContain('* **pansa**: etiqueta lliure, afegida en la revisió humana.');
    expect(etiquetes).toContain("* **collita d'ametles**: etiqueta lliure, afegida en la revisió humana.");
    expect(etiquetes).toMatch(/^\* \*\*Festes i tradicions\*\* \(`festes`\): .+ Afegida en la revisió humana\.$/m);
    expect(fm.title).toBe('La collita i els oficis');
    expect(fm.description).toBe('Relat de memòria oral sobre la collita, els oficis i les festes.');
    expect(revisada.etiquetes.filter((e) => e.lliure).map((e) => e.id)).toEqual(['pansa', "collita d'ametles"]);
    expect(revisada.okf.cos).toContain("En la revisió humana s'han corregit les etiquetes.");
    // L'esborrany no canvia.
    expect(fitxa.okf.frontmatter.tags).toEqual(vocabulari);
    // Només lliures: el títol i la descripció tornen als del relat, sense cap etiqueta.
    const nomesLliures = marcaRevisioHumana(fitxa, { persona: 'javi', ara: DESPRES, etiquetes: [], etiquetesLliures: ['pansa'] });
    expect(nomesLliures.okf.frontmatter.tags).toEqual(['pansa']);
    expect(nomesLliures.okf.frontmatter.title).toBe(fitxa.titolDelText);
    expect(nomesLliures.okf.frontmatter.description).toBe('Relat de memòria oral.');
    expect(seccio(nomesLliures.okf.cos, 'Etiquetes')).toContain('Descartades en la revisió: Collita i camp, Oficis i treballs.');
  });

  test('el text de la persona no fa marca al cos ni trenca el YAML', () => {
    const revisada = marcaRevisioHumana(fitxa, { persona: 'javi', ara: DESPRES, etiquetesLliures: ['no', 'true', '*negreta*', '[^relat]', 'l’era'] });
    const fm = revisada.okf.frontmatter;
    expect(fm.tags.slice(2)).toEqual(['no', 'true', 'negreta', 'relat', "l'era"]);
    expect(load(parteix(revisada.okf.markdown).yaml, { schema: CORE_SCHEMA })).toEqual(fm);
    expect(revisada.okf.markdown).toContain('"no", "true", negreta, relat, "l\'era"]');
  });

  test('un poble del catàleg que no és candidat: municipi, camí, descripció i cos', () => {
    const revisada = marcaRevisioHumana(fitxa, { persona: 'javi', ara: DESPRES, municipi: 'alcoi', poblesConeguts: catalegDePobles() });
    const fm = revisada.okf.frontmatter;
    expect(fm.municipi).toBe('alcoi');
    expect(revisada.municipi).toEqual({ id: 'alcoi', nom: 'Alcoi', comarca: "L'Alcoià", provincia: 'Alacant', mencions: 0 });
    expect(revisada.okf.cami).toMatch(/^memoria-oral\/alcoi\/la-collita-i-els-oficis-a-alcoi-[0-9a-f]{8}\.md$/);
    expect(fm.description).toBe('Relat de memòria oral sobre la collita i els oficis (poble: Alcoi).');
    const poble = seccio(revisada.okf.cos, 'Poble');
    expect(poble).toContain('Cap poble de la llista de Sóc de Poble no hi apareix.');
    expect(poble).toContain('Poble triat en la revisió: Alcoi.');
    expect(validaFitxaOkf(fm).valida).toBe(true);
    // Una segona revisió conserva el poble triat i les lliures, sense tornar a donar el catàleg.
    const ambLliure = marcaRevisioHumana(fitxa, { persona: 'javi', ara: DESPRES, municipi: 'alcoi', poblesConeguts: catalegDePobles(), etiquetesLliures: ['pansa'] });
    const segona = marcaRevisioHumana(ambLliure, { persona: 'maria', ara: '2026-11-02T10:00:00Z', municipi: 'alcoi', etiquetes: ['collita'] });
    expect([segona.okf.frontmatter.municipi, segona.okf.frontmatter.tags]).toEqual(['alcoi', ['collita', 'pansa']]);
    expect(segona.okf.frontmatter.verified.map((v) => v.by)).toEqual(['human:javi', 'human:maria']);
    // Amb un candidat, el triat es diu darrere de la llista dels candidats.
    const ambCandidat = estructuraMemoriaOral('Vaig nàixer a Tibi i ens en vam anar a viure lluny.', { ara: ARA });
    const triat = marcaRevisioHumana(ambCandidat, { persona: 'javi', ara: DESPRES, municipi: 'valencia', poblesConeguts: catalegDePobles() });
    expect(seccio(triat.okf.cos, 'Poble')).toMatch(/\* Tibi \(L'Alcoià, Alacant\): 1 menció\.\n\nPoble triat en la revisió: València\./);
  });

  test('sense poblesConeguts, «alcoi» continua sent TypeError; les formes dolentes, també', () => {
    const casos = [
      { municipi: 'alcoi' },
      { municipi: 'madrid', poblesConeguts: catalegDePobles() },
      { poblesConeguts: 'x' },
      { etiquetesLliures: 'pansa' },
      { etiquetesLliures: [''] },
      { etiquetesLliures: [42] },
      { etiquetesLliures: ['aa', 'bb', 'cc', 'dd', 'ee', 'ff'] },
      { etiquetes: ['festes', 'aigua', 'collita', 'oficis', 'cancons', 'guerra'], etiquetesLliures: ['aa', 'bb', 'cc', 'dd', 'ee'] }
    ];
    for (const opcions of casos) {
      expect(() => marcaRevisioHumana(fitxa, { persona: 'javi', ara: DESPRES, ...opcions }), JSON.stringify(opcions)).toThrow(TypeError);
    }
    // Deu en total sí que hi caben.
    const deu = marcaRevisioHumana(fitxa, { persona: 'javi', ara: DESPRES, etiquetes: ['festes', 'aigua', 'collita', 'oficis', 'cancons'], etiquetesLliures: ['aa', 'bb', 'cc', 'dd', 'ee'] });
    expect(deu.okf.frontmatter.tags).toHaveLength(MAX_ETIQUETES_REVISADES);
  });

  test('Gauntlet T6a-G06 · un poble colat en una fitxa rehidratada no passa sense el catàleg', () => {
    // Un esborrany (draft) amb un municipi que no és candidat: TypeError, com sense la fitxa.
    const colat = JSON.parse(JSON.stringify(fitxa));
    colat.municipi = { id: 'madrid', nom: 'Madrid' };
    expect(() => marcaRevisioHumana(colat, { persona: 'javi', ara: DESPRES, municipi: 'madrid', etiquetes: ['collita'] })).toThrow(TypeError);
    /* Gauntlet T6a-V01 · El mateix esborrany amb el poble colat alhora a la
       fitxa i al frontmatter: «el mateix municipi» ja hi és, i el que el para
       és que no està signat (status draft). */
    const colatAlsDos = JSON.parse(JSON.stringify(fitxa));
    colatAlsDos.municipi = { id: 'madrid', nom: 'Madrid' };
    colatAlsDos.okf.frontmatter.municipi = 'madrid';
    expect([colatAlsDos.okf.frontmatter.status, validaFitxaOkf(colatAlsDos.okf.frontmatter).valida]).toEqual(['draft', true]);
    for (const opcions of [{ municipi: 'madrid' }, { municipi: 'madrid', etiquetes: ['collita'] }]) {
      const revisa = () => marcaRevisioHumana(colatAlsDos, { persona: 'javi', ara: DESPRES, ...opcions });
      expect(revisa, JSON.stringify(opcions)).toThrow(TypeError);
      expect(revisa, JSON.stringify(opcions)).toThrow(/«municipi» ha de ser un dels pobles candidats/);
    }
    // Una fitxa revisada amb un altre municipi que el que va signar: tampoc.
    const signada = marcaRevisioHumana(fitxa, { persona: 'javi', ara: DESPRES, municipi: 'alcoi', poblesConeguts: catalegDePobles() });
    const canviada = JSON.parse(JSON.stringify(signada));
    canviada.municipi = { id: 'madrid', nom: 'Madrid' };
    expect(() => marcaRevisioHumana(canviada, { persona: 'maria', ara: '2026-11-02T10:00:00Z', municipi: 'madrid' })).toThrow(TypeError);
    // La signada, rehidratada, conserva el seu sense el catàleg.
    const rehidratada = JSON.parse(JSON.stringify(signada));
    const segona = marcaRevisioHumana(rehidratada, { persona: 'maria', ara: '2026-11-02T10:00:00Z', municipi: 'alcoi', etiquetes: ['collita'] });
    expect([segona.okf.frontmatter.municipi, segona.municipi.nom]).toEqual(['alcoi', 'Alcoi']);
  });

  test('una fitxa rehidratada amb una «lliure» colada no la porta al fitxer', () => {
    const ambLliure = marcaRevisioHumana(fitxa, { persona: 'javi', ara: DESPRES, etiquetesLliures: ['pansa'] });
    const colada = JSON.parse(JSON.stringify(ambLliure));
    colada.etiquetes.push({ id: 'x\ny: 1', nom: 'x', lliure: true }, { id: 'Festes', lliure: true });
    const segona = marcaRevisioHumana(colada, { persona: 'maria', ara: '2026-11-02T10:00:00Z', municipi: null, etiquetes: ['collita'] });
    expect(segona.okf.frontmatter.tags).toEqual(['collita', 'pansa']);
  });

  test('la porta única (proposaCard.js) reexporta el selector i les etiquetes noves; la versió del motor puja', () => {
    expect(porta.resolPobleDeText).toBe(resolPobleDeText);
    expect(porta.etiquetaNova).toBe(etiquetaNova);
    expect(ACTOR_ESTRUCTURADOR).toBe('socdepoble-memoria-oral/1.1.0');
  });
});
