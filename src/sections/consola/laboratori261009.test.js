// @vitest-environment node
/* Correcció de l'Onada 6 (revisió adversarial: «prepara-pla.mjs no té cap
   prova») · El paquet de laboratori 261009_0400_consola_claude prepara el pla
   de governança que porta la Consola cap a zero avisos. Ací es proven les seues
   peces pures i la coherència del paquet, sense executar res sobre .agents/:
   cap ordre del Reflex ni de l'executor, cap escriptura fora d'os.tmpdir().
   El laboratori viu a l'Escriptori i s'arxivarà: quan no hi siga, la prova se
   salta sola. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const LAB = path.resolve(process.cwd(), '_wiki_de_poble/04_escriptori/02_investigacio_ia/261009_0400_consola_claude');
const HI_ES = fs.existsSync(path.join(LAB, 'prepara-pla.mjs'));

describe.skipIf(!HI_ES)('laboratori 261009_0400 · prepara-pla.mjs', () => {
  let lab;
  let tmp;
  beforeAll(async () => {
    lab = await import(/* @vite-ignore */ pathToFileURL(path.join(LAB, 'prepara-pla.mjs')).href);
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-lab-261009-'));
  });
  afterAll(() => {
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('el paquet és el que diu el LLEGIU_PRIMER: quatre SKILL.md, cada una amb canvis exactes', () => {
    const fitxers = lab.substitucions();
    expect(fitxers.map((f) => f.ruta)).toEqual([
      '.agents/skills/core-llegibilitat-text/SKILL.md', '.agents/skills/core-higiene-escriptori/SKILL.md',
      '.agents/skills/sdp-clon-loiverse/SKILL.md', '.agents/skills/core-maquetacio-markdown/SKILL.md'
    ]);
    for (const f of fitxers) {
      for (const c of f.canvis) {
        expect(c.abans, f.ruta).not.toBe(c.despres);
        expect(lab.sensibles(c.despres), f.ruta).toEqual([]);
      }
    }
  });

  test('cada SKILL.md té la seua còpia de lectura a nous/, amb tots els canvis fets i cap per fer', () => {
    for (const f of lab.substitucions()) {
      const copia = path.join(lab.NOUS, `${f.ruta}.txt`);
      expect(fs.existsSync(copia), copia).toBe(true);
      const text = fs.readFileSync(copia, 'utf8');
      for (const c of f.canvis) {
        expect(lab.ocurrencies(text, c.despres), `${f.ruta}: despres`).toBe(1);
        expect(lab.ocurrencies(text, c.abans), `${f.ruta}: abans`).toBe(0);
      }
      // La regla R9 de core-maquetacio-markdown: cap línia acaba en espai.
      expect(text.split('\n').filter((l) => / $/.test(l)), f.ruta).toEqual([]);
      expect(text.endsWith('\n'), f.ruta).toBe(true);
    }
  });

  test('ocurrencies i aplicaCanvis: pendent, ja aplicat, o deriva sense forçar res', () => {
    expect(lab.ocurrencies('a-a-a', 'a')).toBe(3);
    expect(lab.ocurrencies('aaaa', 'aa')).toBe(2);
    expect(lab.ocurrencies('abc', 'x')).toBe(0);
    const canvis = [{ abans: 'vell\n', despres: 'nou\n' }];
    expect(lab.aplicaCanvis('x', 'a\nvell\nb\n', canvis)).toEqual({ contingut: 'a\nnou\nb\n', aplicats: 0, pendents: 1 });
    expect(lab.aplicaCanvis('x', 'a\nnou\nb\n', canvis)).toEqual({ contingut: 'a\nnou\nb\n', aplicats: 1, pendents: 0 });
    // Dues vegades, o cap ni l'una ni l'altra: deriva, mai una substitució a l'atzar.
    expect(() => lab.aplicaCanvis('x', 'vell\nvell\n', canvis)).toThrow(/2 vegades/);
    expect(() => lab.aplicaCanvis('x', 'altra cosa\n', canvis)).toThrow(/refeu el paquet/);
    // El «$» del text nou no es llig com a patró de replace.
    expect(lab.aplicaCanvis('x', 'vell\n', [{ abans: 'vell', despres: '$& $1' }]).contingut).toBe('$& $1\n');
  });

  test('estat() només llig: diu pendent, aplicat o deriva i si la còpia coincidix', () => {
    const nous = path.join(tmp, 'nous');
    const ruta = '.agents/skills/prova-lab/SKILL.md';
    fs.mkdirSync(path.join(tmp, '.agents/skills/prova-lab'), { recursive: true });
    fs.mkdirSync(path.join(nous, '.agents/skills/prova-lab'), { recursive: true });
    fs.writeFileSync(path.join(nous, 'substitucions.json'), JSON.stringify({
      schema: 'sdp.consola.substitucions.v1',
      fitxers: [{ ruta, avisos: ['orfe (mitjana)'], canvis: [{ abans: 'vell\n', despres: 'nou\n' }] }]
    }));
    const disc = path.join(tmp, ruta);
    fs.writeFileSync(disc, '---\nvell\n');
    fs.writeFileSync(path.join(nous, `${ruta}.txt`), '---\nnou\n');
    const [pendent] = lab.estat(tmp, { nous });
    expect(pendent).toMatchObject({ ruta, estat: 'pendent', contingut: '---\nnou\n', nous: 'coincidix', avisos: ['orfe (mitjana)'] });
    expect(pendent.before).toBe(lab.sha(Buffer.from('---\nvell\n')));
    // estat() no escriu: el disc continua com era.
    expect(fs.readFileSync(disc, 'utf8')).toBe('---\nvell\n');
    fs.writeFileSync(path.join(nous, `${ruta}.txt`), '---\naltre\n');
    expect(lab.estat(tmp, { nous })[0].nous).toBe('DIFERIX');
    fs.writeFileSync(disc, '---\nnou\n');
    expect(lab.estat(tmp, { nous })[0].estat).toBe('aplicat');
    fs.writeFileSync(disc, '---\nun altre canvi\n');
    expect(lab.estat(tmp, { nous })[0]).toMatchObject({ estat: 'deriva' });
    fs.rmSync(disc);
    expect(lab.estat(tmp, { nous })[0]).toEqual({ ruta, estat: 'deriva', motiu: 'el fitxer no és al disc' });
  });

  /* El contrast amb el disc real (les quatre SKILL.md pendents i les quatre
     còpies coincidents) es va fer el 261009 a les 05:08 i consta al
     LLEGIU_PRIMER (§6). No es deixa com a prova fixa: el front de neteja pot
     reescriure core-higiene-escriptori, i aleshores el que mana és
     `prepara-pla.mjs comprova`, que diu deriva i no força res. */
});
