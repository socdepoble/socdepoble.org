/* Arbre Genealògic · la llavor privada (P0-114b) i la detecció del format.
   Només llavors SINTÈTIQUES amb noms inventats: cap dada real entra mai a les
   proves. Les adreces es componen a trossos (patró de privacitat.test.js). */
import { describe, expect, test } from 'vitest';
import { MAX_PERSONES, MIDA_MAXIMA_IMPORTACIO, esPersonaViva, filtraVius, numeraSosa } from '../nucli/index.js';
import { creaCopiaJson } from './copiaJson.js';
import { escriuGedcom } from './escriuGedcom.js';
import { llegeixGedcom } from './llegeixGedcom.js';
import { ESQUEMA_LLAVOR, MAX_PISTES, llegeixFitxerArbre, llegeixLlavorPrivada } from './llavorPrivada.js';

const ANY = 2026;
const ARA = '2026-11-11T09:30:00.000Z';
const S = ['https', '://'].join('');
const comptador = () => {
  let n = 0;
  return () => {
    n += 1;
    return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  };
};
const opcions = (extra = {}) => ({ nouId: comptador(), ara: ARA, anyActual: ANY, titol: 'Arbre de prova', ...extra });

/* Una llavor sintètica amb la forma de 'sdp.genealogia.privat.v1'. */
function llavor() {
  return {
    schema: ESQUEMA_LLAVOR,
    privadesa_estricta: 'Només en este ordinador.',
    actualitzat_cet: '2026-11-11T04:27:00+01:00',
    poble_arrel: { municipi_oficial: 'Poble Inventat', codi_ine: '00000', comarca: 'Comarca Inventada' },
    persones_confirmades_pel_mestre: [
      {
        id: 'ind_1', ahnentafel: 1, generacio: 'G4', rol: 'titular', nom: 'Pere', primer_cognom: 'Exemple', segon_cognom: 'Prova',
        variants_documentals: ['Pedro Ejemplo Prueba'], estat_vital: 'viu', estat_epistemologic: 'CONFIRMAT', poble: 'Poble Inventat',
        pare_id: 'ind_2', mare_id: 'ind_3',
        fonts_verificades: [{ titol: 'Memorial inventat, p. 3', url: `${S}exemple.org/memorial.pdf#page=3`, tipus: 'primaria_institucional', verificada: true }]
      },
      {
        id: 'ind_2', ahnentafel: 2, generacio: 'G3', rol: 'pare', nom: 'Joan', primer_cognom: 'Exemple', segon_cognom: 'Mostra',
        naixement: '1950', estat_epistemologic: 'CONFIRMAT',
        fonts_verificades: [{ titol: 'Testimoni inventat', url: ['http', '://exemple.org/no-segura'].join(''), tipus: 'oral' }]
      },
      { id: 'ind_3', ahnentafel: 3, generacio: 'G3', rol: 'mare', nom: 'Maria', primer_cognom: 'Prova', segon_cognom: 'Ficticia', estat_epistemologic: 'APROXIMAT' },
      {
        id: 'ind_4', ahnentafel: 4, generacio: 'G2', rol: 'avi_patern', nom: '[Pendent de confirmar nom de pila]', primer_cognom: 'Exemple',
        segon_cognom: '', estat_epistemologic: 'APROXIMAT', estat_vital: 'mort', naixement: '1910', nota_genealogica: 'Deduït del primer cognom.'
      },
      { id: 'ind_5', ahnentafel: 5, rol: 'avia_paterna', nom: 'Remei', primer_cognom: 'Mostra', estat_epistemologic: '[CONTRADICCIÓ]', naixement: '~1915' }
    ],
    pistes_col_laterals_fan_club_pendents_confirmar: [
      {
        grup: 'Coincidència de cognoms «Exemple Prova» (Cognom ≠ Parentiu)', estat_epistemologic: 'FALTA CONFIRMAR',
        font_url: `${S}exemple.org/memorial.pdf#page=3`, persones: ['Anna Exemple Prova', 'Lluís Exemple Prova']
      },
      {
        grup: 'Fites històriques inventades', estat_epistemologic: 'FALTA CONFIRMAR', nota_onomastica: 'Pista onomàstica inventada.',
        registres: [
          { persona: 'Vicent Exemple Antic', epoca: '~1900', lloc: 'Partida Inventada', detall: 'Registre inventat.', url: `${S}exemple.org/registre.pdf` },
          { persona: 'Tomàs Prova i Clara Mostra (pares de Berta Prova)', epoca: 'Segle XIX', url: `${S}exemple.org/` }
        ]
      }
    ]
  };
}

const llig = (dades, extra) => llegeixLlavorPrivada(JSON.stringify(dades), opcions(extra));
const perNom = (complet, nom) => complet.persones.find((p) => p.nom === nom);

describe('llegeixLlavorPrivada · persones confirmades', () => {
  test('persones, estats, vius, fonts segures i l’arbre del poble', () => {
    const r = llig(llavor());
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
    const { arbre, persones, relacions, entrevista } = r.complet;
    expect(entrevista).toBeNull();
    expect(arbre).toMatchObject({ titol: 'Arbre de prova', poble: 'Poble Inventat' });
    expect(r.recompte).toEqual({ persones: 9, candidates: 4, relacions: 4 });
    expect(persones).toHaveLength(9);
    expect(relacions).toHaveLength(4);

    const pere = perNom(r.complet, 'Pere');
    expect(arbre.arrelId).toBe(pere.id);
    expect(pere).toMatchObject({ cognom1: 'Exemple', cognom2: 'Prova', viva: 'si', estat: 'confirmat', generacio: 'G4', lloc: 'Poble Inventat', origen: 'llavor' });
    expect(pere.notes).toContain('≈ Pedro Ejemplo Prueba');
    expect(pere.fonts).toHaveLength(1);
    expect(pere.fonts[0]).toMatchObject({ tipus: 'altra', titol: 'Memorial inventat, p. 3', url: `${S}exemple.org/memorial.pdf#page=3` });

    const joan = perNom(r.complet, 'Joan');
    expect(joan).toMatchObject({ estat: 'confirmat', viva: 'desconegut', sexe: 'M' });
    expect(joan.naixement).toMatchObject({ precisio: 'exacta', any: 1950 });
    /* La font es conserva, però l'adreça que no és https no hi entra. */
    expect(joan.fonts).toEqual([expect.objectContaining({ tipus: 'oral', titol: 'Testimoni inventat', url: '' })]);
    expect(r.avisos).toContain('url-descartada:1');

    expect(perNom(r.complet, 'Maria')).toMatchObject({ estat: 'aproximat', sexe: 'F' });
    /* Un nom entre claudàtors és un forat, no un nom. */
    const avi = persones.find((p) => p.cognom1 === 'Exemple' && p.generacio === 'G2');
    expect(avi).toMatchObject({ nom: '', viva: 'no', estat: 'aproximat', sexe: 'M', notes: 'Deduït del primer cognom.' });
    /* Sense generació a la llavor, la dona l'ahnentafel (5 → G2); l'estat amb claudàtors i accent es reconeix. */
    expect(perNom(r.complet, 'Remei')).toMatchObject({ estat: 'contradiccio', sexe: 'F', generacio: 'G2' });

    /* Cap id del fitxer es reaprofita. */
    expect(persones.every((p) => /^00000000-0000-4000-8000-\d{12}$/.test(p.id) && p.arbreId === arbre.id)).toBe(true);
    expect(JSON.stringify(r.complet)).not.toMatch(/ind_\d/);
  });

  test('vincles de progenitor pels ids i per l’ahnentafel, amb l’estat més feble de les dues persones', () => {
    const { complet } = llig(llavor());
    const id = (nom) => perNom(complet, nom).id;
    const avi = complet.persones.find((p) => p.cognom1 === 'Exemple' && p.generacio === 'G2').id;
    const vincles = complet.relacions.map((r) => [r.tipus, r.de, r.a, r.estat]).sort();
    expect(vincles).toEqual([
      ['progenitor', id('Joan'), id('Pere'), 'confirmat'],
      ['progenitor', id('Maria'), id('Pere'), 'aproximat'],
      ['progenitor', avi, id('Joan'), 'aproximat'],
      ['progenitor', id('Remei'), id('Joan'), 'contradiccio']
    ].sort());
    expect(complet.relacions.find((r) => r.estat === 'confirmat').evidencia).toEqual({ fontEscrita: true, memoriaOral: false, vincleExplicit: true });
    /* La numeració Sosa surt de l'arbre llegit: 1 Pere, 2 Joan, 3 Maria, 4 l'avi, 5 Remei. */
    const { files } = numeraSosa(complet, complet.arbre.arrelId);
    expect(files.slice(0, 5).map((f) => f.personaId)).toEqual([id('Pere'), id('Joan'), id('Maria'), avi, id('Remei')]);
    expect(files.slice(5).every((f) => f.personaId === null)).toBe(true);
  });

  test('només l’ahnentafel (sense pare_id ni mare_id) també fa l’arbre', () => {
    const dades = llavor();
    for (const p of dades.persones_confirmades_pel_mestre) {
      delete p.pare_id;
      delete p.mare_id;
    }
    const { complet, avisos } = llig(dades);
    expect(complet.relacions).toHaveLength(4);
    expect(avisos.filter((a) => !a.startsWith('url-descartada'))).toEqual([]);
  });

  test('el declarat mana sobre l’ahnentafel, i una referència trencada cau a l’ahnentafel', () => {
    const dades = llavor();
    dades.persones_confirmades_pel_mestre[0].pare_id = 'ind_4';
    dades.persones_confirmades_pel_mestre[0].mare_id = 'ningu';
    const { complet, avisos } = llig(dades);
    expect(avisos).toEqual(expect.arrayContaining(['ahnentafel-discordant:0', 'referencia-trencada:0']));
    const pere = perNom(complet, 'Pere').id;
    const pares = complet.relacions.filter((r) => r.a === pere).map((r) => complet.persones.find((p) => p.id === r.de).cognom1).sort();
    expect(pares).toEqual(['Exemple', 'Prova']);
    expect(complet.relacions.some((r) => r.a === pere && r.de === perNom(complet, 'Joan').id)).toBe(false);
  });

  test('ahnentafel repetit o no vàlid, estat desconegut i registres no vàlids: avís i la resta continua', () => {
    const dades = llavor();
    dades.persones_confirmades_pel_mestre.push(
      { id: 'ind_6', ahnentafel: 2, nom: 'Repetit', primer_cognom: 'Exemple', estat_epistemologic: 'QUI SAP' },
      { id: 'ind_7', ahnentafel: 'dos', nom: 'Sense', primer_cognom: 'Numero' },
      { id: 'ind_8', nom: { cru: 'objecte' } },
      'no és una persona',
      { id: 'ind_1', nom: 'Id repetit' }
    );
    const r = llig(dades);
    expect(r.ok).toBe(true);
    expect(r.avisos).toEqual(expect.arrayContaining([
      'ahnentafel-repetit:5', 'estat-desconegut:5', 'ahnentafel-invalid:6', 'persona-invalida:7', 'persona-invalida:8', 'persona-invalida:9'
    ]));
    expect(perNom(r.complet, 'Repetit')).toMatchObject({ estat: 'falta-confirmar', generacio: null });
    expect(perNom(r.complet, 'Id repetit')).toBeUndefined();
    /* El repetit no xafa el pare de l'ahnentafel. */
    expect(r.complet.relacions).toHaveLength(4);
  });
});

describe('llegeixLlavorPrivada · pistes col·laterals (Cognom ≠ Parentiu)', () => {
  test('entren com a candidates [FALTA CONFIRMAR] sense cap vincle, encara que compartisquen cognoms', () => {
    const { complet } = llig(llavor());
    const candidates = complet.persones.filter((p) => p.origen === 'llavor:pista');
    expect(candidates).toHaveLength(4);
    expect(candidates.every((p) => p.estat === 'falta-confirmar' && p.viva === 'desconegut' && p.generacio === null)).toBe(true);
    const ids = new Set(candidates.map((p) => p.id));
    expect(complet.relacions.filter((r) => ids.has(r.de) || ids.has(r.a))).toEqual([]);

    expect(perNom(complet, 'Anna')).toMatchObject({ cognom1: 'Exemple', cognom2: 'Prova' });
    expect(perNom(complet, 'Anna').notes).toContain('Cognom ≠ Parentiu');
    expect(perNom(complet, 'Anna').fonts.map((f) => f.url)).toEqual([`${S}exemple.org/memorial.pdf#page=3`]);
    const vicent = perNom(complet, 'Vicent');
    expect(vicent).toMatchObject({ cognom1: 'Exemple', cognom2: 'Antic' });
    expect(vicent.notes).toEqual(expect.stringContaining('Partida Inventada'));
    expect(vicent.notes).toEqual(expect.stringContaining('Pista onomàstica inventada.'));
    /* Un text que no té forma de nom (dues persones, parèntesis) es queda sencer: no s'inventa cap parentiu. */
    const compost = candidates.find((p) => p.nom.startsWith('Tomàs'));
    expect(compost).toMatchObject({ cognom1: '', cognom2: '' });
    expect(compost.notes).toContain('(pares de Berta Prova)');
  });

  test('una pista mal formada es descarta amb un avís', () => {
    const dades = llavor();
    dades.pistes_col_laterals_fan_club_pendents_confirmar.push(42, { grup: 'Sense llista', persones: 'Anna Exemple' }, { grup: 'Nom objecte', persones: [{ nom: 'x' }] });
    const r = llig(dades);
    expect(r.ok).toBe(true);
    expect(r.avisos).toEqual(expect.arrayContaining(['pista-invalida:2', 'pista-invalida:3', 'pista-invalida:4']));
    expect(r.complet.persones.filter((p) => p.origen === 'llavor:pista')).toHaveLength(4);
  });
});

describe('llegeixLlavorPrivada · les vives no ixen', () => {
  test('a la còpia JSON i al GEDCOM, el titular viu i les candidates sense dades van anonimitzats', () => {
    const { complet } = llig(llavor());
    expect(esPersonaViva(perNom(complet, 'Pere'), complet, { anyActual: ANY })).toBe(true);
    expect(esPersonaViva(perNom(complet, 'Anna'), complet, { anyActual: ANY })).toBe(true);
    const { idsOcults } = filtraVius(complet, { anyActual: ANY });
    expect(idsOcults).toEqual(expect.arrayContaining([perNom(complet, 'Pere').id, perNom(complet, 'Anna').id]));

    const { text: json, ocultes } = creaCopiaJson(complet, { anyActual: ANY, ara: ARA });
    const { text: ged } = escriuGedcom(complet, { versio: '7.0', anyActual: ANY, ara: ARA });
    expect(ocultes).toBeGreaterThan(0);
    for (const eixida of [json, ged]) {
      for (const nom of ['Pere', 'Pedro Ejemplo', 'Anna', 'Lluís', 'Memorial inventat']) expect(eixida, nom).not.toContain(nom);
    }
    /* L'avi, mort, sí que ix. */
    expect(ged).toContain('Exemple');
  });
});

describe('llegeixLlavorPrivada · fitxers malformats o massa grans', () => {
  test.each([
    ['no és JSON', '{ esto no', 'json'],
    ['clau perillosa', `{"schema":"${ESQUEMA_LLAVOR}","__proto__":{"x":1},"persones_confirmades_pel_mestre":[]}`, 'clau-perillosa'],
    ['un altre esquema', '{"schema":"un.altre.v1","persones_confirmades_pel_mestre":[]}', 'esquema'],
    ['persones que no són una llista', `{"schema":"${ESQUEMA_LLAVOR}","persones_confirmades_pel_mestre":{}}`, 'esquema'],
    ['pistes que no són una llista', `{"schema":"${ESQUEMA_LLAVOR}","pistes_col_laterals_fan_club_pendents_confirmar":"x"}`, 'esquema'],
    ['un poble que no és un objecte', `{"schema":"${ESQUEMA_LLAVOR}","poble_arrel":"x"}`, 'esquema'],
    ['buit', '   ', 'buit']
  ])('%s → %s', (_que, text, codi) => {
    const r = llegeixLlavorPrivada(text, opcions());
    expect(r).toMatchObject({ ok: false, errors: [codi], complet: null });
  });

  test('massa gran, massa persones o massa pistes: no es llig', () => {
    expect(llegeixLlavorPrivada('x'.repeat(MIDA_MAXIMA_IMPORTACIO + 1), opcions()).errors).toEqual(['mida']);
    const moltes = { schema: ESQUEMA_LLAVOR, persones_confirmades_pel_mestre: Array.from({ length: MAX_PERSONES + 1 }, () => ({})) };
    expect(llig(moltes).errors).toEqual(['limit']);
    const pistes = { schema: ESQUEMA_LLAVOR, pistes_col_laterals_fan_club_pendents_confirmar: Array.from({ length: MAX_PISTES + 1 }, () => ({})) };
    expect(llig(pistes).errors).toEqual(['limit']);
    expect(llegeixLlavorPrivada(42, opcions()).errors).toEqual(['tipus']);
  });

  test('una llavor buida és vàlida però avisa; sense nouId, ara o anyActual no es llig', () => {
    const r = llig({ schema: ESQUEMA_LLAVOR });
    expect(r).toMatchObject({ ok: true, avisos: ['sense-persones'] });
    expect(r.complet.persones).toEqual([]);
    expect(() => llegeixLlavorPrivada('{}', { ara: ARA, anyActual: ANY })).toThrow(TypeError);
    expect(() => llegeixLlavorPrivada('{}', { nouId: comptador(), anyActual: ANY })).toThrow(TypeError);
    expect(() => llegeixLlavorPrivada('{}', { nouId: comptador(), ara: ARA })).toThrow(TypeError);
  });
});

describe('llegeixFitxerArbre · el format pel contingut', () => {
  const GED = [
    '0 HEAD', '1 GEDC', '2 VERS 7.0',
    '0 @I1@ INDI', '1 NAME Pere /Exemple Prova/', '1 SEX M', '1 FAMC @F1@', '1 NOTE [CONFIRMAT] Font inventada, p. 3.',
    '0 @I2@ INDI', '1 NAME Joan /Exemple Mostra/', '1 SEX M', '1 FAMS @F1@', '1 NOTE [APROXIMAT] Deduït de la memòria.',
    '0 @I3@ INDI', '1 NAME Maria /Prova/', '1 SEX F', '1 FAMS @F1@', '1 NOTE Una nota sense etiqueta.',
    '0 @F1@ FAM', '1 HUSB @I2@', '1 WIFE @I3@', '1 CHIL @I1@',
    '0 TRLR'
  ].join('\n');

  test('la llavor, amb BOM o sense, i espais davant', () => {
    const text = JSON.stringify(llavor());
    for (const variant of [text, `${String.fromCharCode(0xfeff)}${text}`, `\n  ${text}`]) {
      const r = llegeixFitxerArbre(variant, opcions());
      expect(r).toMatchObject({ format: 'llavor', ok: true, versio: 'JSON' });
      expect(r.complet.persones).toHaveLength(9);
    }
  });

  test('una còpia de l’app es llig com a còpia', () => {
    const { complet } = llig(llavor());
    const { text } = creaCopiaJson(complet, { incloureVius: true, anyActual: ANY, ara: ARA });
    const r = llegeixFitxerArbre(text, opcions());
    expect(r).toMatchObject({ format: 'copia', ok: true, versio: 'JSON' });
    expect(r.complet.persones).toHaveLength(9);
  });

  test('un GEDCOM: les NOTE que comencen per [CONFIRMAT] o [APROXIMAT] conserven l’estat', () => {
    const r = llegeixFitxerArbre(GED, opcions());
    expect(r).toMatchObject({ format: 'gedcom', ok: true, versio: '7.0' });
    const { complet } = r;
    expect(perNom(complet, 'Pere')).toMatchObject({ estat: 'confirmat', notes: 'Font inventada, p. 3.' });
    expect(perNom(complet, 'Joan')).toMatchObject({ estat: 'aproximat', notes: 'Deduït de la memòria.' });
    expect(perNom(complet, 'Maria')).toMatchObject({ estat: 'falta-confirmar', notes: 'Una nota sense etiqueta.' });
    /* El mateix resultat que el lector directe (la detecció no canvia res). */
    const directe = llegeixGedcom(GED, opcions());
    expect(directe.complet.persones.map((p) => p.estat)).toEqual(complet.persones.map((p) => p.estat));
    expect(numeraSosa(complet, perNom(complet, 'Pere').id).files.slice(0, 3).map((f) => f.personaId))
      .toEqual([perNom(complet, 'Pere').id, perNom(complet, 'Joan').id, perNom(complet, 'Maria').id]);
  });

  test('malformats: JSON trencat, clau perillosa, text sense capçalera, massa gran o res', () => {
    expect(llegeixFitxerArbre('{ trencat', opcions())).toMatchObject({ ok: false, errors: ['json'], complet: null });
    expect(llegeixFitxerArbre('{"__proto__":{}}', opcions())).toMatchObject({ ok: false, errors: ['clau-perillosa'] });
    expect(llegeixFitxerArbre('{"schema":"un.altre.v1"}', opcions())).toMatchObject({ format: 'copia', ok: false, errors: ['esquema'] });
    expect(llegeixFitxerArbre('Hola, això no és cap arbre', opcions())).toMatchObject({ format: 'gedcom', ok: false, errors: ['capcalera'] });
    expect(llegeixFitxerArbre('x'.repeat(MIDA_MAXIMA_IMPORTACIO + 1), opcions())).toMatchObject({ format: null, errors: ['mida'] });
    expect(llegeixFitxerArbre('', opcions())).toMatchObject({ format: null, errors: ['buit'] });
    expect(llegeixFitxerArbre(null, opcions())).toMatchObject({ format: null, errors: ['buit'] });
  });
});
