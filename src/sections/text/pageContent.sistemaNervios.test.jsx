import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PAGE_COPY } from './pageContent.js';
import { wikiManifest } from '../../data/wikiManifest.js';
import { auditaSkills } from '../../../tooling/brain/fronteres-skills.mjs';
import { preparaCapitolsWiki } from '../../data/wikiAlMur.js';
import { esVisibleAlMur } from '../../data/visibilitatMur.js';
import { extreuEditorial } from '../wiki-de-poble/parseMarkdown.js';

import { resolvePageSlugPath } from '../../config/navigation.js';

/* L0-01 (Gauntlet v1.2.6) · Llicències llegides el 17-11-2026 amb
   `curl -s https://api.github.com/repos/<repo>/license` i, quan l'API diu NOASSERTION o en remet
   dues, amb el LICENSE cru: awesome-selfhosted «CC-BY-SA-3.0»; Cap AGPLv3 llevat de les crates
   cap-camera* i scap-* (MIT); craft-anything «MIT OR Apache-2.0» (Cargo.toml i README);
   chatwoot MIT llevat de la carpeta enterprise/. Si una llicència canvia, cal tornar-la a llegir. */
const LLICENCIES_PAGINA = [
  ['affaan-m/everything-claude-code', 'MIT'],
  ['storytold/craft-anything', 'MIT OR Apache-2.0'],
  ['every-app/open-seo', 'MIT'],
  ['awesome-selfhosted/awesome-selfhosted', 'CC-BY-SA-3.0'],
  ['calcom/cal.diy', 'MIT'],
  ['Flomp/wanderer', 'AGPL-3.0'],
  ['debpalash/VoiceStudio', 'AGPL-3.0'],
  ['OpenWhispr/openwhispr', 'MIT'],
  ['CapSoftware/Cap', 'AGPL-3.0'],
];
const LLICENCIES_WIKI = [
  ...LLICENCIES_PAGINA,
  ['AppFlowy-IO/AppFlowy', 'AGPL-3.0'],
  ['opf/openproject', 'GPL-3.0'],
  ['chatwoot/chatwoot', 'MIT'],
];
const escapa = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const fitxaWiki = (id) => {
  const item = wikiManifest.items.find((i) => i.id === id);
  expect(item, `${id} és al manifest compilat de la Wiki`).toBeDefined();
  return item.content;
};

/** Classificació real de les 43 skills segons el camp `motors:` (la mateixa de la porta F2). */
const classificacioReal = () => {
  const r = auditaSkills(process.cwd());
  const motors = new Map(r.skills.map((s) => [s.id, new Set(s.motors.map((m) => path.posix.basename(m)))]));
  const ambMotor = r.skills.filter((s) => s.classe === 'procediment_amb_motor').length;
  return { motors, ambMotor, procedimentals: r.total - ambMotor, total: r.total };
};

describe('R32.9 · sistema nerviós canònic a la Wiki', () => {
  it('retira el duplicat i conserva una adreça antiga que redirigix a un únic document', () => {
    expect(PAGE_COPY['sistema-nervios']).toBeUndefined();
    expect(resolvePageSlugPath('sistema-nervios')).toBe('/wikidepoble?item=sistema_nervios_skills_i_repositoris');
    expect(existsSync(path.join(process.cwd(), 'src/sections/text/pageContent.sistemaNervios.js'))).toBe(false);
  });
  /* P0-ANDROID-PUSH (v1.2.16) · B6 (prompt 261121_0216, T2.2; blueprint [VA2-4]) · Fora la
     maquinària interna del Mur: el capítol passa a `mur: false` (versió 1.2.1, `updated` amb l'hora
     de `date`) i ja no es projecta al Mur (wikiAlMur.js); el llibre i la foto es queden. */
  it('conserva foto, dates i totes les fonts originals, i ja no es projecta al Mur (B6, v1.2.16)', () => {
    const item = wikiManifest.items.find((i) => i.id === 'sistema_nervios_skills_i_repositoris');
    expect(item.image).toBe('/assets/ui/plugins/sistema_nervios_vinyeta.jpg');
    expect(item.imageAlt.length).toBeGreaterThan(40);
    expect(item.attributes.date).toBe('2026-11-17T00:14:00+01:00');
    expect(item.attributes.updated).toBe('2026-11-21T03:48:00+01:00');
    expect(item.attributes.version).toBe('1.2.1');
    expect(item.attributes.mur).toBe(false);
    expect(item.mur).toBe(false);
    expect(wikiManifest.items.filter((i) => i.mur === true || i.attributes?.mur === true).map((i) => i.id)).toEqual([]);
    expect(item.content).not.toMatch(/^\| /m);
    for (const url of ['https://github.com/github/spec-kit',
      'https://github.com/google/elephant-goldfish-model',
      'https://github.com/rizinorg/rizin', 'https://github.com/frida/frida',
      'https://wordpress.org/plugins/vigilante/', '/consola/inventari',
      '/page/node-zero', '/consola', '/page/rutes-de-poble']) expect(item.content, url).toContain(url);
    for (const id of ['sdp-workflow_SKILL', 'core-tecniques-investigacio_SKILL', 'core-gauntlet-loop_SKILL', 'sdp-vigilant-tellado_SKILL']) {
      const slug = id.replace(/_SKILL$/, '');
      expect(item.content).toContain(`(/consola/explorador?peca=${encodeURIComponent(`skill:${slug}`)})`);
      expect(existsSync(path.join(process.cwd(), '.agents/skills', slug, 'SKILL.md')), id).toBe(true);
      expect(wikiManifest.items.some((i) => i.id === id), 'cap skill executiva publicada com a capítol').toBe(false);
    }
    expect(item.content.replaceAll('**', '')).toContain('Al servidor de Sóc de Poble');
    expect(item.content).not.toContain('servidor del poble');
    expect(item.content).not.toContain('2506.13651');
  });
});

describe('P0-ANDROID-PUSH (v1.2.16) · B6 · el Mur, sense la maquinària interna', () => {
  it('la projecció de la Wiki al Mur (wikiAlMur.js) conserva el capítol com a candidat ocult i no en pinta cap', () => {
    const files = preparaCapitolsWiki(wikiManifest.items, extreuEditorial);
    const fila = files.find((f) => f.wikiId === 'sistema_nervios_skills_i_repositoris');
    // Candidat ocult: el superadmin el pot tornar a activar des de la Wiki sense recàrrega.
    expect(fila, 'el capítol continua al catàleg de candidats').toBeDefined();
    expect(fila.mostrarAlMur).toBe(false);
    expect(esVisibleAlMur(fila)).toBe(false);
    expect(files.filter(esVisibleAlMur).map((f) => f.wikiId)).toEqual([]);
  });
});

describe('Llei 0 · Wiki compilada, inventari de skills i README (Gauntlet v1.2.6)', () => {
  it('L0-01: la fitxa sistema_nervios_skills_i_repositoris cita les llicències verificades', () => {
    const md = fitxaWiki('sistema_nervios_skills_i_repositoris');
    for (const [repo, llicencia] of LLICENCIES_WIKI) {
      expect(md, repo).toMatch(new RegExp(`\\[${escapa(repo)}\\]\\(https://github\\.com/${escapa(repo)}\\) \\(\`${escapa(llicencia)}\`[;,)]`));
    }
    expect(md).toContain('(`AGPL-3.0`; crates `cap-camera*` i `scap-*` sota `MIT`)');
    expect(md).toContain('(`MIT`, excepte la carpeta `enterprise/`, amb llicència pròpia)');
    expect(md).not.toContain('CC-BY-SA-4.0');
    expect(md).not.toContain('`MIT` escriptori');
  });

  it('L0-02: cada motor atribuït a una família és un motor declarat a `motors:` per la skill que nomena, i la resta es diu procedimental', () => {
    const { motors, ambMotor, procedimentals, total } = classificacioReal();
    expect(total).toBe(44);
    const md = fitxaWiki('sistema_nervios_skills_i_repositoris');
    const inici = md.indexOf('### 3.1');
    const blocs = md.slice(inici, md.indexOf('### 3.2')).split(/\n(?=#### )/).slice(1);
    const families = blocs
      .map((b) => {
        const liniaInc = b.split('\n').find((l) => l.includes('**Incorporació real:**')) || '';
        return {
          skills: [...b.matchAll(/`((?:core|sdp|wiki)-[a-z-]+)`/g)].map((m) => m[1]),
          incorporacio: liniaInc,
        };
      })
      .filter((f) => f.skills.length);
    expect(families.length).toBe(8);
    expect(families.flatMap((f) => f.skills).sort()).toEqual([...motors.keys()].sort());
    for (const { skills, incorporacio } of families) {
      const atribucions = [...incorporacio.matchAll(/((?:`[\w.-]+\.mjs`(?:, | i )?)+) \(([^)]+)\)/g)];
      const atribuits = new Set();
      for (const [, scripts, quines] of atribucions) {
        const noms = quines.split(/, | i /);
        for (const nom of noms) {
          expect(skills, `${nom} és de la família`).toContain(nom);
          atribuits.add(nom);
          for (const [, script] of scripts.matchAll(/`([\w.-]+\.mjs)`/g)) {
            expect([...motors.get(nom)], `${script} és motor declarat de ${nom}`).toContain(script);
          }
        }
      }
      const totsElsScripts = [...incorporacio.matchAll(/`([\w.-]+\.mjs)`/g)].length;
      const ambSkill = atribucions.reduce((n, [, scripts]) => n + [...scripts.matchAll(/`[\w.-]+\.mjs`/g)].length, 0);
      expect(ambSkill, `cap motor sense skill a «${incorporacio}»`).toBe(totsElsScripts);
      for (const id of skills) {
        if (motors.get(id).size) expect(atribuits.has(id), `${id} té motor i la cel·la el nomena`).toBe(true);
      }
      if (skills.some((id) => !motors.get(id).size)) expect(incorporacio).toMatch(/procedimental/);
    }
    expect(md).toContain(`(\`${ambMotor}\` connectades a motors propis declarats al camp \`motors:\` del seu frontmatter i \`${procedimentals}\` procedimentals`);
  });

  it('GOV-04: l’inventari de la Consola dona el cens de motors que torna fronteres-skills.mjs', () => {
    const { ambMotor, procedimentals } = classificacioReal();
    const md = fitxaWiki('03_inventari_skills');
    expect(md).toContain(`De les 44 skills actives, ${ambMotor} declaren motors propis al camp \`motors:\``);
    expect(md).toContain(`i ${procedimentals} són procedimentals o de governança cognitiva`);
    expect(md).toContain('`node tooling/brain/fronteres-skills.mjs`');
  });

  it('I18N-03: la fitxa wiki nova usa les formes valencianes en -ix', () => {
    const md = fitxaWiki('sistema_nervios_skills_i_repositoris');
    for (const vella of ['Distingeix', 'divideix', 'exigeixen', 'Defineixen']) expect(md).not.toContain(vella);
    for (const nova of ['Distinguix', 'dividix', 'exigixen', 'Definixen']) expect(md).toContain(nova);
  });

  it('L0-03: el README no anuncia auditories NGI ni Fediversity que no existixen', () => {
    const readme = readFileSync(path.join(process.cwd(), 'README.md'), 'utf8');
    const linia = readme.split('\n').find((l) => l.includes('Este README és per a'));
    expect(linia).toContain('(Sollutia, auditories de seguretat o de programari lliure)');
    expect(linia).not.toMatch(/NGI|Fediversity/);
  });
});
