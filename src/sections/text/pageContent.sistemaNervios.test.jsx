import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PAGE_COPY } from './pageContent.js';
import { localitzaPagina } from './pageContent.r10.js';
import { paginaPerAppNativa, nomenaPlataformaAliena } from './perAppNativa.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { wikiManifest } from '../../data/wikiManifest.js';
import { auditaSkills } from '../../../tooling/brain/fronteres-skills.mjs';

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];

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

describe('pageContent.sistemaNervios · /page/sistema-nervios en 5 llengües', () => {
  it('exposa la pàgina sistema-nervios classificada i amb paritat completa en ca, es, en, eu i gl', () => {
    const base = PAGE_COPY['sistema-nervios'];
    expect(base).toBeDefined();
    expect(base.labels?.length).toBeGreaterThanOrEqual(3);

    for (const lang of LLENGUES) {
      const loc = localitzaPagina(base, lang, 'sistema-nervios');
      expect(loc.title?.length, `title ${lang}`).toBeGreaterThan(10);
      expect(loc.subtitle?.length, `subtitle ${lang}`).toBeGreaterThan(15);
      expect(loc.lead?.length, `lead ${lang}`).toBeGreaterThan(40);
      expect(loc.imageAlt?.length, `imageAlt ${lang}`).toBeGreaterThan(20);

      const htmlNet = sanitizeHtml(loc.html);
      expect(htmlNet, `3 taules en ${lang}`).toContain('<div class="sdp-taula-prosa"><table>');
      expect((htmlNet.match(/<table>/g) || []).length, `nombre de taules en ${lang}`).toBe(3);
      expect((htmlNet.match(/<caption>/g) || []).length, `captions en ${lang}`).toBe(3);
      expect(htmlNet).toContain('scope="col"');

      // Enllaços clicables als repositoris estudiats i del Node 0
      expect(htmlNet).toContain('https://github.com/affaan-m/everything-claude-code');
      expect(htmlNet).toContain('https://github.com/storytold/craft-anything');
      expect(htmlNet).toContain('https://github.com/every-app/open-seo');
      expect(htmlNet).toContain('https://github.com/awesome-selfhosted/awesome-selfhosted');
      expect(htmlNet).toContain('https://github.com/calcom/cal.diy');
      expect(htmlNet).toContain('https://github.com/Flomp/wanderer');
      expect(htmlNet).toContain('https://github.com/debpalash/VoiceStudio');
      expect(htmlNet).toContain('https://github.com/OpenWhispr/openwhispr');
      expect(htmlNet).toContain('https://github.com/CapSoftware/Cap');
      expect(htmlNet).toContain('https://github.com/wide-trace/open-higgsfield');

      // CTAs finals vius
      expect(htmlNet).toContain('href="/wikidepoble?item=sistema_nervios_skills_i_repositoris"');
      expect(htmlNet).toContain('href="/consola"');

      // Regla 2.3.10 d'App Store: cap menció a plataformes mòbils alienes ni pèrdua de contingut
      expect(nomenaPlataformaAliena(loc.html), `sense plataforma aliena en ${lang}`).toBe(false);
      expect(paginaPerAppNativa(loc).html).toBe(loc.html);
    }
  });
});

describe('Llei 0 · /page/sistema-nervios no afirma res que no siga verificat (Gauntlet v1.2.6)', () => {
  it('L0-01: cada repositori porta la seua llicència verificada, en les 5 llengües', () => {
    const base = PAGE_COPY['sistema-nervios'];
    for (const lang of LLENGUES) {
      const html = localitzaPagina(base, lang, 'sistema-nervios').html;
      for (const [repo, llicencia] of LLICENCIES_PAGINA) {
        expect(html, `${repo} en ${lang}`).toMatch(new RegExp(`${escapa(repo)}</a> \\(<code>${escapa(llicencia)}</code>[;)]`));
      }
      expect(html, `Cap en ${lang}: crates MIT`).toMatch(/CapSoftware\/Cap<\/a> \(<code>AGPL-3\.0<\/code>;[^)]*<code>cap-camera\*<\/code>[^)]*<code>scap-\*<\/code>[^)]*<code>MIT<\/code>[^)]*\)/);
      expect(html, `cap CC-BY-SA-4.0 en ${lang}`).not.toContain('CC-BY-SA-4.0');
      expect(html, `cap «MIT / AGPL» compartit en ${lang}`).not.toContain('<code>MIT</code> / <code>AGPL-3.0</code>');
    }
  });

  it('L0-02: la fila de skills sdp-* diu on s’escriuen i on s’apliquen, sense presentar-les com a actives a les pantalles', () => {
    const base = PAGE_COPY['sistema-nervios'];
    for (const lang of LLENGUES) {
      const html = localitzaPagina(base, lang, 'sistema-nervios').html;
      const fila = html.split('<tr>').find((f) => f.includes('<code>sdp-*</code>'));
      expect(fila, `fila sdp-* en ${lang}`).toBeDefined();
      const estat = fila.split('<td>').pop();
      expect(estat, `estat sdp-* en ${lang}`).toContain('<code>.agents/skills/</code>');
      expect(estat, `estat sdp-* en ${lang}`).toContain('<code>src/</code>');
      expect(estat, `estat sdp-* en ${lang}`).not.toMatch(/Actiu|Activo|Active|aktibo/);
    }
  });

  it('I18N-03: «xat familiar» és «family chat» en anglés i «familia-txata» en basc; el valencià nou usa -ix', () => {
    const base = PAGE_COPY['sistema-nervios'];
    const en = localitzaPagina(base, 'en', 'sistema-nervios').html;
    const eu = localitzaPagina(base, 'eu', 'sistema-nervios').html;
    const ca = localitzaPagina(base, 'ca', 'sistema-nervios').html;
    expect(en).toContain('family chat');
    expect(en).not.toContain('familiar chat');
    expect(eu).toContain('familia-txata');
    expect(eu).not.toContain('txat ezaguna');
    expect(ca).toContain('Definixen');
    expect(ca).not.toContain('Defineixen');
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
    expect(total).toBe(43);
    const md = fitxaWiki('sistema_nervios_skills_i_repositoris');
    const inici = md.indexOf('### 3.1');
    const taula = md.slice(inici, md.indexOf('### 3.2')).split('\n').filter((l) => l.startsWith('| **'));
    const families = taula
      .map((l) => l.split('|').map((c) => c.trim()))
      .map((c) => ({ skills: [...c[1].matchAll(/`((?:core|sdp|wiki)-[a-z-]+)`/g)].map((m) => m[1]), incorporacio: c[4] }))
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
    expect(md).toContain(`De les 43 skills actives, ${ambMotor} declaren motors propis al camp \`motors:\``);
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
