import { describe, expect, it } from 'vitest';
import {
  construeixMapa, scriptsDeOrdre, npmDeOrdre, disparadorsDecoratius, disparadorsAmples, nodeDeRuta, dataLedger, PROVA_MAPA
} from './construeixMapa.js';
import { normalitzaMapa } from './mapaContent.js';
import { capesActors } from './actorsMapa.js';

const ARA = Date.parse('2026-09-24T12:00:00Z');
const existeix = (ruta) => ruta !== 'tooling/wiki/core/reflex_daemon.mjs';

/* Un Mas en miniatura amb cada cas que la Consola ha de saber pintar. */
function fontsBase() {
  return {
    generat: '2026-09-24T12:00:00.000Z',
    tall: { branca: 'backup-notes-publish', commit: '57ec5684', arbre_net: false },
    protocolledge: { rutes: [{
      id: 'auditoria', tipus: 'informe', version: '2.0.0',
      plantilla: '_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md',
      skill: '.agents/skills/wiki-documentacio-i-reflex/SKILL.md',
      lectures: [], destins: ['_wiki_de_poble/04_escriptori']
    }] },
    claudeImports: ['.agents/skills/sdp-workflow/SKILL.md'],
    cervell: { entrada: ['AGENTS.md'] },
    settings: { hooks: { PreToolUse: [{ hooks: [{ type: 'command', command: 'node "${CLAUDE_PROJECT_DIR}/tooling/gates/hooks-local.mjs"' }] }] } },
    hooksAntigravity: { hooks: [{ event: 'PreToolUse', command: 'node tooling/gates/hooks-local.mjs' }] },
    packageJson: { scripts: {
      'porta:segella': 'node tooling/gates/segella.mjs',
      gate: 'npm run porta',
      porta: 'node tooling/gates/run-portes.mjs'
    } },
    skillsIndex: {
      core: [{ name: 'sdp-workflow', triggers_on: ['workflow', 'ui'] }],
      plugins: {
        'wiki-cicle-de-vida': { name: 'wiki-cicle-de-vida', triggers_on: ['skill cicle de vida'] },
        'skill-perduda': { name: 'skill-perduda', triggers_on: ['perduda'] }
      }
    },
    skillsDisc: [
      { nom: 'sdp-workflow', frontmatter: { name: 'sdp-workflow', status: 'canonic' }, errorsFrontmatter: [],
        paraules: 500, llicons: 3, sha256: 'a'.repeat(64), mencions: ['wiki-cicle-de-vida', 'core-inexistent'] },
      { nom: 'wiki-cicle-de-vida', frontmatter: { name: 'wiki-cicle-de-vida' }, errorsFrontmatter: [],
        paraules: 4000, llicons: 0, sha256: 'b'.repeat(64), mencions: [] },
      { nom: 'wiki-documentacio-i-reflex', frontmatter: { name: 'wiki-documentacio-i-reflex' }, errorsFrontmatter: [],
        paraules: 100, llicons: 5, sha256: 'c'.repeat(64), mencions: [] },
      { nom: 'core-taxonomia-estricta', frontmatter: { name: 'core-taxonomia-estricta' }, errorsFrontmatter: ['frontmatter: falta type'],
        paraules: 200, llicons: 0, sha256: 'd'.repeat(64), mencions: [] }
    ],
    skillsClaude: ['sdp-workflow', 'wiki-cicle-de-vida', 'wiki-documentacio-i-reflex'],
    segell: { manifest: {
      '.agents/skills/sdp-workflow/SKILL.md': 'a'.repeat(64),
      '.agents/skills/wiki-cicle-de-vida/SKILL.md': 'f'.repeat(64),
      '.agents/skills/wiki-documentacio-i-reflex/SKILL.md': 'c'.repeat(64)
    } },
    registreTasques: { plaquetes: [{ id: 'higiene-basica', nivell: 'L0' }] },
    llancadors: [
      { etiqueta: 'com.socdepoble.reflex_daemon', fitxer: '~/Library/LaunchAgents/com.socdepoble.reflex_daemon.plist',
        script: 'tooling/wiki/core/reflex_daemon.mjs', keepAlive: true },
      { etiqueta: 'org.socdepoble.plaquetes', fitxer: '~/Library/LaunchAgents/org.socdepoble.plaquetes.plist',
        script: 'scripts/immunitari/plaquetes.mjs', interval: 3600, enArrencar: true, activitat: '2026-09-24T11:30:00Z' }
    ]
  };
}

const mapa = () => construeixMapa(fontsBase(), { existeix, ara: ARA });
const avisosDe = (m, node) => m.avisos.filter((a) => a.node === node).map((a) => a.codi).sort();
const te = (m, de, a, tipus, confianca) =>
  m.arestes.some((x) => x.de === de && x.a === a && x.tipus === tipus && x.confianca === confianca);
const metrica = (m, nom) => m.salut.find((s) => s.metrica === nom);

describe('construeixMapa · peces d’anàlisi', () => {
  it('extrau els scripts del repositori de qualsevol forma d’ordre', () => {
    expect(scriptsDeOrdre('cd "${CLAUDE_PROJECT_DIR}" && node tooling/gates/segell-auto.mjs')).toEqual(['tooling/gates/segell-auto.mjs']);
    expect(scriptsDeOrdre('node "${CLAUDE_PROJECT_DIR}/tooling/gates/hooks-local.mjs"')).toEqual(['tooling/gates/hooks-local.mjs']);
    expect(scriptsDeOrdre("node -e \"import('./tooling/wiki/core/build_rag_index.mjs').then(m => m.run({root: '.'}))\""))
      .toEqual(['tooling/wiki/core/build_rag_index.mjs']);
    expect(scriptsDeOrdre('node --test tooling/gates/tractor-psicopatia.test.mjs')).toEqual(['tooling/gates/tractor-psicopatia.test.mjs']);
    expect(scriptsDeOrdre('vite build -c vite.standalone.config.js')).toEqual([]);
    expect(scriptsDeOrdre(undefined)).toEqual([]);
  });

  it('extrau les ordres npm encadenades', () => {
    expect(npmDeOrdre('npm run build:tokens && npm run rag:build')).toEqual(['build:tokens', 'rag:build']);
  });

  it('distingix el disparador decoratiu del que salta sol', () => {
    expect(disparadorsDecoratius([])).toBe(true);
    expect(disparadorsDecoratius(undefined)).toBe(true);
    expect(disparadorsDecoratius(['skill memoria historica'])).toBe(true);
    expect(disparadorsDecoratius(['restaura', 'skill restauracio'])).toBe(false);
  });

  it('marca els disparadors que casen dins de paraules corrents', () => {
    expect(disparadorsAmples(['ui', 'css', 'disseny', 'error'])).toEqual(['ui', 'css', 'error']);
  });

  it('classifica les rutes per tipus de node', () => {
    expect(nodeDeRuta('.agents/skills/sdp-workflow/SKILL.md')).toEqual({ id: 'skill:sdp-workflow', tipus: 'skill' });
    expect(nodeDeRuta('_wiki_de_poble/03_actuar/plantilles/acta.md').tipus).toBe('plantilla');
    expect(nodeDeRuta('tooling/gates/segella.mjs').tipus).toBe('script');
    expect(nodeDeRuta('AGENTS.md').tipus).toBe('document');
  });
});

describe('construeixMapa · arestes declarades i derivades', () => {
  it('pinta ruta → plantilla i ruta → skill encara que la plantilla visca fora de plantilles/', () => {
    const m = mapa();
    expect(te(m, 'ruta:auditoria', 'plantilla:_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md', 'encamina', 'declarat')).toBe(true);
    expect(te(m, 'ruta:auditoria', 'skill:wiki-documentacio-i-reflex', 'governa', 'declarat')).toBe(true);
    expect(te(m, 'ruta:auditoria', 'document:_wiki_de_poble/04_escriptori', 'escriu', 'declarat')).toBe(true);
  });

  it('deriva l’script d’un hook i avisa del hook d’Antigravity sense consumidor', () => {
    const m = mapa();
    expect(te(m, 'hook:claude:PreToolUse', 'script:tooling/gates/hooks-local.mjs', 'dispara', 'derivat')).toBe(true);
    expect(avisosDe(m, 'hook:antigravity:PreToolUse')).toEqual(['hook-sense-consumidor']);
    expect(m.nodes.find((n) => n.id === 'hook:antigravity:PreToolUse').atributs.consumidor_acreditat).toBe(false);
  });

  it('llig el format documentat d’Antigravity IDE: hook amb nom, entrades directes i grups amb matcher (T13-T14)', () => {
    const ordre = (mode) => `cd .. && node tooling/gates/antigravity-hook.mjs ${mode}`;
    const f = fontsBase();
    f.hooksAntigravity = { 'sdp-olivera': {
      PreInvocation: [{ type: 'command', command: ordre('pre-invocation'), timeout: 10 }],
      PreToolUse: [{ matcher: '*', hooks: [{ type: 'command', command: ordre('pre-tool'), timeout: 10 }] }]
    } };
    const m = construeixMapa(f, { existeix, ara: ARA });
    expect(() => normalitzaMapa(m)).not.toThrow();
    for (const esdeveniment of ['PreInvocation', 'PreToolUse']) {
      const id = `hook:antigravity:${esdeveniment}`;
      const hook = m.nodes.find((n) => n.id === id);
      expect(hook.atributs).toMatchObject({ arnes: 'Antigravity', hook: 'sdp-olivera', esdeveniment, consumidor_acreditat: null });
      expect(te(m, 'agent:antigravity', id, 'dispara', 'declarat')).toBe(true);
      expect(te(m, id, 'script:tooling/gates/antigravity-hook.mjs', 'dispara', 'derivat')).toBe(true);
      // Format que l'IDE llig: ja no és el «sense consumidor» del format antic.
      expect(avisosDe(m, id)).not.toContain('hook-sense-consumidor');
    }
    const antigravity = capesActors(m).arnesos.find((a) => a.node.id === 'agent:antigravity');
    expect(antigravity).toMatchObject({ candats: 2, acreditats: 0, desconeguts: 2 });
  });

  it('encadena les ordres npm i els seus scripts', () => {
    const m = mapa();
    expect(te(m, 'script:npm:gate', 'script:npm:porta', 'crida', 'declarat')).toBe(true);
    expect(te(m, 'script:npm:porta:segella', 'script:tooling/gates/segella.mjs', 'crida', 'declarat')).toBe(true);
  });

  it('una menció de prosa és inferida i mai crea una skill que no existix', () => {
    const m = mapa();
    expect(te(m, 'skill:sdp-workflow', 'skill:wiki-cicle-de-vida', 'crida', 'inferit')).toBe(true);
    expect(m.nodes.some((n) => n.id === 'skill:core-inexistent')).toBe(false);
    expect(avisosDe(m, 'skill:sdp-workflow')).toEqual(['crida-inexistent', 'disparador-ample']);
  });
});

describe('construeixMapa · semàfor de skills', () => {
  it('una skill només amb mencions inferides és orfe i el disparador decoratiu no la salva', () => {
    const m = mapa();
    expect(avisosDe(m, 'skill:wiki-cicle-de-vida')).toEqual(['disparador-decoratiu', 'orfe', 'pes', 'segell-divergent']);
  });

  it('una skill fora de tots els cens ho diu cens a cens', () => {
    const m = mapa();
    expect(avisosDe(m, 'skill:core-taxonomia-estricta'))
      .toEqual(['fora-cataleg-claude', 'fora-index', 'fora-segell', 'frontmatter-invalid', 'orfe']);
  });

  it('una skill de l’índex que no és al disc és un fantasma, no un orfe', () => {
    const m = mapa();
    expect(avisosDe(m, 'skill:skill-perduda')).toEqual(['skill-fantasma']);
    expect(m.nodes.find((n) => n.id === 'skill:skill-perduda').atributs.al_disc).toBe(false);
  });

  it('les skills carregades per CLAUDE.md o governades per una ruta no són orfes', () => {
    const m = mapa();
    expect(avisosDe(m, 'skill:sdp-workflow')).not.toContain('orfe');
    expect(avisosDe(m, 'skill:wiki-documentacio-i-reflex')).not.toContain('orfe');
  });
});

describe('construeixMapa · tasques', () => {
  it('distingix viu, mort, sense llançador i sense declaració', () => {
    const m = mapa();
    const estat = Object.fromEntries(m.tasques.map((t) => [t.id, t.estat]));
    expect(estat).toEqual({
      'higiene-basica': 'declarat-sense-llancador',
      'launchd:com.socdepoble.reflex_daemon': 'mort',
      'launchd:org.socdepoble.plaquetes': 'viu'
    });
    expect(avisosDe(m, 'tasca:launchd:com.socdepoble.reflex_daemon')).toEqual(['llancador-sense-declaracio', 'tasca-morta']);
    expect(avisosDe(m, 'tasca:higiene-basica')).toEqual(['tasca-sense-llancador']);
  });

  it('sense rellotge no jutja l’activitat: desconegut, no viu', () => {
    const m = construeixMapa(fontsBase(), { existeix });
    expect(m.tasques.find((t) => t.id === 'launchd:org.socdepoble.plaquetes').estat).toBe('desconegut');
    expect(metrica(m, 'vigilants-vius').valor).toBe('N/A');
  });

  /* Les cinc tasques d'higiene no tenen plist propi: les executa el diagnòstic
     horari de Plaquetes. Declarar-ho («la llança la tasca X») és el que fa que
     el Calendari deixe de dir «sense llançador» i que hereten la cadència. */
  it('una subtasca hereta l’estat i la cadència de la tasca que la llança', () => {
    const fonts = fontsBase();
    fonts.registreTasques = {
      plaquetes: [{ id: 'higiene-basica', nivell: 'L0', llancador: { tipus: 'tasca', tasca: 'plaquetes-diagnostic' } }],
      tasques: [{
        id: 'plaquetes-diagnostic', nivell: 'L0', script: 'scripts/immunitari/plaquetes.mjs',
        llancador: { tipus: 'launchd', etiqueta: 'org.socdepoble.plaquetes' },
        cadencia: { cada_segons: 3600, en_arrencar: true }
      }]
    };
    const m = construeixMapa(fonts, { existeix, ara: ARA });
    const higiene = m.tasques.find((t) => t.id === 'higiene-basica');
    expect(higiene.estat).toBe('viu');
    expect(higiene.cadencia).toEqual({ cada_segons: 3600, en_arrencar: true });
    expect(higiene.llancador).toEqual({ tipus: 'tasca', tasca: 'plaquetes-diagnostic' });
    expect(te(m, 'tasca:plaquetes-diagnostic', 'tasca:higiene-basica', 'dispara', 'declarat')).toBe(true);
    expect(avisosDe(m, 'tasca:higiene-basica')).toEqual([]);
    // Només els llançadors de launchd compten com a vigilants: la subtasca no en suma cap.
    expect(metrica(m, 'vigilants-vius')).toMatchObject({ numerador: 1, denominador: 2 });
    expect(() => normalitzaMapa(m)).not.toThrow();
  });

  it('una subtasca amb la mare absent, o en cicle, queda sense llançador i no penja el compilador', () => {
    const fonts = fontsBase();
    fonts.registreTasques = { tasques: [
      { id: 'orfena', llancador: { tipus: 'tasca', tasca: 'no-existix' } },
      { id: 'a', llancador: { tipus: 'tasca', tasca: 'b' } },
      { id: 'b', llancador: { tipus: 'tasca', tasca: 'a' } },
      { id: 'sola', llancador: { tipus: 'tasca', tasca: 'sola' } }
    ] };
    const m = construeixMapa(fonts, { existeix, ara: ARA });
    for (const id of ['orfena', 'a', 'b', 'sola']) {
      expect(m.tasques.find((t) => t.id === id).estat).toBe('declarat-sense-llancador');
      expect(avisosDe(m, `tasca:${id}`)).toEqual(['tasca-sense-llancador']);
    }
  });

  /* Un hook de git no té horari, però sí un text: si el hook instal·lat cita
     l'script, la tasca és viva; si el hook existix i no el cita, és morta. */
  it('una tasca git-hook es jutja pel text del hook instal·lat, i sense font continua desconeguda', () => {
    const tasques = [
      { id: 'frontissa-contingut', script: 'tooling/gates/frontissa-contingut.mjs', llancador: { tipus: 'git-hook', esdeveniment: 'pre-commit' } },
      { id: 'porta-oblidada', script: 'tooling/gates/porta-oblidada.mjs', llancador: { tipus: 'git-hook', esdeveniment: 'pre-commit' } },
      { id: 'post', script: 'tooling/wiki/reflex_petorreta.mjs', llancador: { tipus: 'git-hook', esdeveniment: 'post-commit' } }
    ];
    const senseFont = construeixMapa({ ...fontsBase(), registreTasques: { tasques } }, { existeix, ara: ARA });
    expect(senseFont.tasques.map((t) => [t.id, t.estat])).toEqual(expect.arrayContaining([
      ['frontissa-contingut', 'desconegut'], ['porta-oblidada', 'desconegut'], ['post', 'desconegut']
    ]));
    const ambFont = construeixMapa({
      ...fontsBase(), registreTasques: { tasques },
      hooksGit: { 'pre-commit': 'node tooling/gates/frontissa-contingut.mjs || exit 1\nexec node tooling/gates/git-staged.mjs\n' }
    }, { existeix, ara: ARA });
    const estat = Object.fromEntries(ambFont.tasques.map((t) => [t.id, t.estat]));
    expect(estat['frontissa-contingut']).toBe('viu');
    expect(estat['porta-oblidada']).toBe('mort');
    expect(estat.post).toBe('desconegut');   // .husky/post-commit no s'ha llegit
    expect(te(ambFont, 'hook:git:pre-commit', 'tasca:frontissa-contingut', 'dispara', 'derivat')).toBe(true);
    expect(avisosDe(ambFont, 'tasca:porta-oblidada')).toEqual(['tasca-morta']);
    expect(() => normalitzaMapa(ambFont)).not.toThrow();
  });

  /* L'script que falta porta el seu propi avís, com els dels hooks i de
     package.json: sense ell, el detall de l'script el diria net. */
  it('l’script d’una tasca del registre que no és al disc porta script-absent; una ruta que no és script no inventa cap node', () => {
    const fonts = fontsBase();
    fonts.registreTasques = { tasques: [
      { id: 'perduda', script: 'tooling/gates/no-hi-es.mjs', llancador: { tipus: 'manual' } },
      { id: 'present', script: 'tooling/gates/frontissa-contingut.mjs', llancador: { tipus: 'manual' } },
      { id: 'sense-script', script: 'docs/no-hi-es.md', llancador: { tipus: 'manual' } }
    ] };
    const noHiSon = new Set(['tooling/gates/no-hi-es.mjs', 'docs/no-hi-es.md']);
    const m = construeixMapa(fonts, { existeix: (r) => existeix(r) && !noHiSon.has(r), ara: ARA });
    expect(avisosDe(m, 'script:tooling/gates/no-hi-es.mjs')).toEqual(['script-absent']);
    expect(m.avisos.find((x) => x.node === 'script:tooling/gates/no-hi-es.mjs').evidencia).toBe('.agents/cron/registre_tasques.json');
    expect(avisosDe(m, 'script:tooling/gates/frontissa-contingut.mjs')).toEqual([]);
    expect(avisosDe(m, 'tasca:perduda')).toEqual(['tasca-morta']);
    expect(m.nodes.some((x) => x.id === 'script:docs/no-hi-es.md')).toBe(false);
    expect(() => normalitzaMapa(m)).not.toThrow();
  });
});

describe('construeixMapa · funció de salut', () => {
  it('cada valor porta numerador, denominador i prova; el que falta és N/A', () => {
    const m = mapa();
    expect(metrica(m, 'disparadors-utils')).toMatchObject({ numerador: 2, denominador: 3, valor: 0.667 });
    expect(metrica(m, 'cens-skills-coherent')).toMatchObject({ numerador: 2, denominador: 5, valor: 0.4 });
    expect(metrica(m, 'vigilants-vius')).toMatchObject({ numerador: 1, denominador: 2, valor: 0.5 });
    // T12: el segell i el frontmatter es mesuren amb les fonts que ja arriben.
    expect(metrica(m, 'segell-skills-coherent')).toMatchObject({ numerador: 2, denominador: 4, valor: 0.5, prova: PROVA_MAPA });
    expect(metrica(m, 'frontmatter-skills-valid')).toMatchObject({ numerador: 3, denominador: 4, valor: 0.75, prova: PROVA_MAPA });
    for (const nom of ['integritat-contingut', 'frescor-instantania', 'conformitat-documental', 'cadena-portes',
      // T12: el segell de la fixture no porta data, i les fonts de vigilància encara no arriben.
      'antiguitat-segell', 'torns-caducats-oberts', 'torns-tancats', 'escriptori-ancorat', 'escriptori-amb-rebut',
      'safata-entrada', 'recaigudes-ledger', 'integritat-ledger', 'frescor-relleu-estat']) {
      expect(metrica(m, nom)).toMatchObject({ valor: 'N/A', numerador: null, denominador: null, prova: null });
    }
  });

  it('la frescor de la instantània es mesura en minuts des de l’última', () => {
    const m = construeixMapa({ ...fontsBase(), timeMachine: { ultima: '2026-09-24T11:15:00Z' } }, { existeix, ara: ARA });
    expect(metrica(m, 'frescor-instantania')).toMatchObject({ valor: 45, unitat: 'minuts' });
  });

  it('sense fonts no hi ha cap verd: només avisos i N/A', () => {
    const m = construeixMapa({ absents: [{ ruta: '.agents/protocolledge.json', motiu: 'ENOENT' }] });
    expect(avisosDe(m, 'document:.agents/protocolledge.json')).toEqual(['font-absent']);
    expect(m.salut.every((s) => s.valor === 'N/A')).toBe(true);
    expect(() => normalitzaMapa(m)).not.toThrow();
  });
});

describe('construeixMapa · contracte', () => {
  it('l’eixida compleix el contracte que llig la interfície', () => {
    expect(() => normalitzaMapa(mapa())).not.toThrow();
  });

  it('és determinista: mateixes fonts, mateix JSON', () => {
    expect(JSON.stringify(mapa())).toBe(JSON.stringify(mapa()));
  });

  it('una script absent referenciada per un hook dóna avís alt', () => {
    const fonts = fontsBase();
    const m = construeixMapa(fonts, { existeix: (r) => r !== 'tooling/gates/hooks-local.mjs', ara: ARA });
    expect(avisosDe(m, 'script:tooling/gates/hooks-local.mjs')).toEqual(['script-absent']);
  });
});

/* T10 (ordre del Mestre, 260930) · Codex: .codex/hooks.json té el format de
   .claude/settings.json; les ordres porten `$(git rev-parse --show-toplevel)`. */
const ORDRE_CODEX = (script) => `node "$(git rev-parse --show-toplevel)/${script}"`;
const HOOKS_CODEX = Object.freeze({ hooks: {
  SessionStart: [{ hooks: [
    { type: 'command', command: ORDRE_CODEX('tooling/brain/context-local.mjs') },
    { type: 'command', command: ORDRE_CODEX('tooling/brain/despertar.mjs') }
  ] }],
  PreToolUse: [{ hooks: [{ type: 'command', command: ORDRE_CODEX('tooling/gates/hooks-local.mjs') }] }],
  PostToolUse: [{ hooks: [{ type: 'command', command: 'cd "$(git rev-parse --show-toplevel)" && node tooling/gates/segell-auto.mjs' }] }]
} });
const FONTS_ARRENCADA = ['AGENTS.md', '.agents/BOOTSTRAP.md', '_wiki_de_poble/01_ser/02_genotip.md', '_wiki_de_poble/00_index.md'];
const ARRENCADA = Object.freeze({ script: 'tooling/brain/context-local.mjs', fonts: FONTS_ARRENCADA });
/* Claude també dispara context-local.mjs en arrencar (.claude/settings.json). */
const ambSessioClaude = (fonts) => ({ ...fonts, settings: { hooks: {
  ...fonts.settings.hooks,
  SessionStart: [{ hooks: [{ type: 'command', command: 'node "${CLAUDE_PROJECT_DIR}/tooling/brain/context-local.mjs"' }] }]
} } });
const ambCodex = (extra = {}) => ({ ...fontsBase(), hooksCodex: HOOKS_CODEX, agentsMd: true, contextArrencada: ARRENCADA, ...extra });

describe('construeixMapa · Codex', () => {
  it('trau l’script de les ordres de Codex', () => {
    expect(scriptsDeOrdre(ORDRE_CODEX('tooling/brain/context-local.mjs'))).toEqual(['tooling/brain/context-local.mjs']);
    expect(scriptsDeOrdre('cd "$(git rev-parse --show-toplevel)" && node tooling/gates/segell-auto.mjs')).toEqual(['tooling/gates/segell-auto.mjs']);
  });

  it('naix de .codex/hooks.json amb tres candats per acreditar, sense cap avís', () => {
    const m = construeixMapa(ambCodex(), { existeix, ara: ARA });
    expect(m.nodes.find((x) => x.id === 'agent:codex')).toMatchObject({ tipus: 'agent', font: '.codex/hooks.json', atributs: { arnes: 'Codex' } });
    for (const esdeveniment of ['SessionStart', 'PreToolUse', 'PostToolUse']) {
      const id = `hook:codex:${esdeveniment}`;
      expect(m.nodes.find((x) => x.id === id).atributs).toEqual({ arnes: 'Codex', esdeveniment, consumidor_acreditat: null });
      expect(te(m, 'agent:codex', id, 'dispara', 'declarat')).toBe(true);
      expect(avisosDe(m, id)).toEqual([]);
    }
    expect(te(m, 'hook:codex:SessionStart', 'script:tooling/brain/despertar.mjs', 'dispara', 'derivat')).toBe(true);
    expect(te(m, 'hook:codex:PostToolUse', 'script:tooling/gates/segell-auto.mjs', 'dispara', 'derivat')).toBe(true);
    expect(() => normalitzaMapa(m)).not.toThrow();
  });

  it('carrega AGENTS.md per convenció i les fonts de context-local per derivació, i res de despertar', () => {
    const m = construeixMapa(ambCodex(), { existeix, ara: ARA });
    expect(te(m, 'agent:codex', 'document:AGENTS.md', 'carrega', 'declarat')).toBe(true);
    expect(te(m, 'agent:codex', 'script:tooling/brain/context-local.mjs', 'carrega', 'derivat')).toBe(true);
    for (const ruta of FONTS_ARRENCADA) {
      expect(te(m, 'script:tooling/brain/context-local.mjs', nodeDeRuta(ruta).id, 'carrega', 'derivat')).toBe(true);
    }
    expect(m.arestes.some((x) => x.de === 'script:tooling/brain/despertar.mjs' && x.tipus === 'carrega')).toBe(false);
    // La targeta d'Actors: quatre documents (AGENTS.md una sola vegada) i cap skill.
    const codex = capesActors(normalitzaMapa(m)).arnesos.find((x) => x.node.id === 'agent:codex');
    expect(codex).toMatchObject({ candats: 3, acreditats: 0, desconeguts: 3 });
    expect(codex.arrencada.documents.map((x) => x.id).sort()).toEqual(FONTS_ARRENCADA.map((r) => nodeDeRuta(r).id).sort());
    expect(codex.arrencada.skills).toEqual([]);
  });

  it('sense AGENTS.md no declara la lectura nativa, però conserva la derivada', () => {
    const m = construeixMapa(ambCodex({ agentsMd: false }), { existeix, ara: ARA });
    expect(te(m, 'agent:codex', 'document:AGENTS.md', 'carrega', 'declarat')).toBe(false);
    expect(te(m, 'agent:codex', 'script:tooling/brain/context-local.mjs', 'carrega', 'derivat')).toBe(true);
  });

  it('la targeta de Claude no canvia: mateixos nodes i arestes amb Codex i sense, i cap càrrega per hook', () => {
    const claude = (m) => JSON.stringify({
      nodes: m.nodes.filter((x) => x.id === 'agent:claude-code' || x.id.startsWith('hook:claude:')),
      arestes: m.arestes.filter((x) => x.de === 'agent:claude-code' || x.de.startsWith('hook:claude:'))
    });
    const sense = construeixMapa(ambSessioClaude(fontsBase()), { existeix, ara: ARA });
    const amb = construeixMapa(ambSessioClaude(ambCodex()), { existeix, ara: ARA });
    expect(claude(amb)).toBe(claude(sense));
    // Claude dispara el mateix context-local.mjs, però la seua càrrega no es deriva (decisió del pla).
    expect(te(amb, 'hook:claude:SessionStart', 'script:tooling/brain/context-local.mjs', 'dispara', 'derivat')).toBe(true);
    expect(amb.arestes.some((x) => x.de === 'agent:claude-code' && x.a.startsWith('script:'))).toBe(false);
    expect(amb.nodes.find((x) => x.id === 'hook:claude:PreToolUse')).toEqual({
      id: 'hook:claude:PreToolUse', tipus: 'hook', font: '.claude/settings.json',
      atributs: { arnes: 'Claude Code', esdeveniment: 'PreToolUse', consumidor_acreditat: true }
    });
  });

  it('sense .codex/hooks.json no hi ha arnés Codex, encara que arriben AGENTS.md i les fonts d’arrencada', () => {
    const m = construeixMapa({ ...fontsBase(), agentsMd: true, contextArrencada: ARRENCADA }, { existeix, ara: ARA });
    expect(m.nodes.some((x) => x.id === 'agent:codex')).toBe(false);
    expect(m.arestes.some((x) => x.tipus === 'carrega' && x.de === 'script:tooling/brain/context-local.mjs')).toBe(false);
    const malformat = construeixMapa({ ...fontsBase(), hooksCodex: { hooks: [] } }, { existeix, ara: ARA });
    expect(malformat.nodes.some((x) => x.id === 'agent:codex')).toBe(false);
  });

  it('un grup amb `hooks` que no és llista no tomba el Mapa: el candat queda sense script', () => {
    const fonts = { ...fontsBase(), hooksCodex: { hooks: { SessionStart: [{ hooks: { command: 'node tooling/brain/despertar.mjs' } }, 'text'] } } };
    let m;
    expect(() => { m = construeixMapa(fonts, { existeix, ara: ARA }); }).not.toThrow();
    expect(m.nodes.some((x) => x.id === 'hook:codex:SessionStart')).toBe(true);
    expect(m.arestes.some((x) => x.de === 'hook:codex:SessionStart')).toBe(false);
    expect(() => normalitzaMapa(m)).not.toThrow();
  });
});

/* T1 (ordre del Mestre, 260930) · `contracte.llig`: clau plana del frontmatter. */
describe('construeixMapa · contracte declarat de les skills', () => {
  const ambContracte = (llig) => {
    const fonts = fontsBase();
    fonts.skillsDisc[0] = { ...fonts.skillsDisc[0], frontmatter: { ...fonts.skillsDisc[0].frontmatter, 'contracte.llig': llig } };
    return fonts;
  };
  const LLIG = ['.agents/skills/wiki-cicle-de-vida/SKILL.md', '_wiki_de_poble/02_saber/memoria_aprenentatges.md', 'tooling/no-hi-es.md'];
  const existeixContracte = (ruta) => existeix(ruta) && ruta !== 'tooling/no-hi-es.md';

  it('cada ruta és una aresta llig declarada, i una ruta que no existix és un contracte trencat', () => {
    const m = construeixMapa(ambContracte(LLIG), { existeix: existeixContracte, ara: ARA });
    expect(te(m, 'skill:sdp-workflow', 'skill:wiki-cicle-de-vida', 'llig', 'declarat')).toBe(true);
    expect(te(m, 'skill:sdp-workflow', 'document:_wiki_de_poble/02_saber/memoria_aprenentatges.md', 'llig', 'declarat')).toBe(true);
    expect(avisosDe(m, 'skill:sdp-workflow')).toEqual(['contracte-absent', 'crida-inexistent', 'disparador-ample']);
    expect(m.avisos.find((x) => x.codi === 'contracte-absent').evidencia).toBe('.agents/skills/sdp-workflow/SKILL.md → tooling/no-hi-es.md');
    expect(() => normalitzaMapa(m)).not.toThrow();
  });

  /* El contracte trencat s'avisa a la skill; el fitxer que falta, al seu
     node, perquè el detall del document no el diga net ni l'oferisca a l'editor. */
  it('el fitxer declarat que no existix porta fitxer-absent al seu node, i els presents cap', () => {
    const m = construeixMapa(ambContracte(LLIG), { existeix: existeixContracte, ara: ARA });
    expect(avisosDe(m, 'document:tooling/no-hi-es.md')).toEqual(['fitxer-absent']);
    expect(m.avisos.find((x) => x.codi === 'fitxer-absent'))
      .toMatchObject({ severitat: 'alta', evidencia: '.agents/skills/sdp-workflow/SKILL.md → tooling/no-hi-es.md' });
    expect(avisosDe(m, 'document:_wiki_de_poble/02_saber/memoria_aprenentatges.md')).toEqual([]);
    expect(() => normalitzaMapa(m)).not.toThrow();
    const senseJutge = construeixMapa(ambContracte(LLIG), { ara: ARA });
    expect(avisosDe(senseJutge, 'document:tooling/no-hi-es.md')).toEqual([]);
  });

  it('una skill absent declarada al contracte ja és un fantasma: cap segon avís d’absència', () => {
    const absent = '.agents/skills/no-hi-es/SKILL.md';
    const m = construeixMapa(ambContracte([absent]), { existeix: (r) => existeix(r) && r !== absent, ara: ARA });
    expect(avisosDe(m, 'skill:sdp-workflow')).toContain('contracte-absent');
    expect(avisosDe(m, 'skill:no-hi-es')).toEqual(['skill-fantasma']);
    expect(() => normalitzaMapa(m)).not.toThrow();
  });

  it('la lectura declarada substituïx el suggeriment de la prosa i salva l’orfe', () => {
    const m = construeixMapa(ambContracte(LLIG), { existeix: existeixContracte, ara: ARA });
    expect(te(m, 'skill:sdp-workflow', 'skill:wiki-cicle-de-vida', 'crida', 'inferit')).toBe(false);
    expect(avisosDe(m, 'skill:wiki-cicle-de-vida')).not.toContain('orfe');
  });

  it('sense comprovador de rutes no jutja, i un valor que no és llista no fa contracte', () => {
    const senseJutge = construeixMapa(ambContracte(LLIG), { ara: ARA });
    expect(avisosDe(senseJutge, 'skill:sdp-workflow')).not.toContain('contracte-absent');
    const text = construeixMapa(ambContracte('.agents/skills/wiki-cicle-de-vida/SKILL.md'), { existeix, ara: ARA });
    expect(te(text, 'skill:sdp-workflow', 'skill:wiki-cicle-de-vida', 'llig', 'declarat')).toBe(false);
    expect(te(text, 'skill:sdp-workflow', 'skill:wiki-cicle-de-vida', 'crida', 'inferit')).toBe(true);
  });

  it('una skill que es declara a si mateixa no es llig: continua sent orfe', () => {
    const fonts = fontsBase();
    const propia = '.agents/skills/wiki-cicle-de-vida/SKILL.md';
    fonts.skillsDisc[1] = { ...fonts.skillsDisc[1], frontmatter: { ...fonts.skillsDisc[1].frontmatter, 'contracte.llig': [propia] } };
    const m = construeixMapa(fonts, { existeix, ara: ARA });
    expect(m.arestes.some((x) => x.de === 'skill:wiki-cicle-de-vida' && x.a === 'skill:wiki-cicle-de-vida')).toBe(false);
    expect(avisosDe(m, 'skill:wiki-cicle-de-vida')).toContain('orfe');
  });
});

/* T12 (ordre del Mestre, 260930) · Mètriques de salut noves. */
describe('construeixMapa · segell i frontmatter de les skills', () => {
  it('el segell trencat és una mètrica i un avís alt sobre el seu document', () => {
    const m = mapa();
    expect(avisosDe(m, 'document:.agents/SKILLS_SEAL.json')).toEqual(['segell-trencat']);
    const avis = m.avisos.find((x) => x.codi === 'segell-trencat');
    expect(avis.severitat).toBe('alta');
    expect(avis.evidencia).toMatch(/^2 de 4 skills fora del segell o divergents/);
    // El segell cobrix també 00_INDEX_SKILLS.md, que no arriba: la mesura ho diu.
    expect(avis.evidencia).toContain('només SKILL.md');
    expect(avis.evidencia).toContain('node tooling/gates/segella.mjs');
    expect(metrica(m, 'segell-skills-coherent').font).toBe('.agents/SKILLS_SEAL.json (només SKILL.md) · disc');
  });

  it('amb el segell coherent no hi ha avís ni node', () => {
    const fonts = fontsBase();
    fonts.segell = { manifest: Object.fromEntries(fonts.skillsDisc.map((s) => [`.agents/skills/${s.nom}/SKILL.md`, s.sha256])) };
    const m = construeixMapa(fonts, { existeix, ara: ARA });
    expect(metrica(m, 'segell-skills-coherent')).toMatchObject({ numerador: 4, denominador: 4, valor: 1 });
    expect(m.nodes.some((x) => x.id === 'document:.agents/SKILLS_SEAL.json')).toBe(false);
  });

  it('l’antiguitat del segell es compta en hores; sense rellotge, N/A', () => {
    const fonts = { ...fontsBase(), segell: { ...fontsBase().segell, timestamp: '2026-09-23T10:00:00.000Z' } };
    expect(metrica(construeixMapa(fonts, { existeix, ara: ARA }), 'antiguitat-segell'))
      .toMatchObject({ valor: 26, unitat: 'hores', prova: PROVA_MAPA });
    expect(metrica(construeixMapa(fonts, { existeix }), 'antiguitat-segell').valor).toBe('N/A');
  });

  it('sense esquema, el frontmatter no es pot jutjar: N/A, mai un verd', () => {
    const fonts = { ...fontsBase(), absents: [{ ruta: 'tooling/wiki/schema.json', motiu: 'absent' }] };
    expect(metrica(construeixMapa(fonts, { existeix, ara: ARA }), 'frontmatter-skills-valid').valor).toBe('N/A');
  });
});

describe('construeixMapa · vigilància (fonts noves de la closca)', () => {
  const torn = (id, state, expiresAt) => ({ id, actor: 'claude', scope: 'code', state, createdAt: '2026-09-20T00:00:00Z', expiresAt, rebuts: 0, ambPla: false });
  const VIGILANCIA = Object.freeze({
    torns: [
      torn('t1', 'closed', '2026-09-20T00:00:00Z'),          // caducat però tancat: no compta
      torn('t2', 'context_loaded', '2026-09-23T00:00:00Z'),  // caducat sense tancar
      torn('t3', 'context_loaded', '2026-09-25T00:00:00Z'),  // encara viu
      torn('t4', 'context_loaded', 'sense data')              // obert sense caducitat llegible: caducat (turns.mjs)
    ],
    escriptori: {
      documents: [
        { nom: '260930_0040_auditoria_claude.md', ancorat: true, ambRebut: true },
        { nom: '260929_2346_prompt_claude_consola.md', ancorat: false, ambRebut: false },
        { nom: '260929_2346_pla_implementacio_consola.md', ancorat: false, ambRebut: true }
      ],
      safata: 0,
      limitSafata: 20
    },
    ledger: {
      valid: false,
      entrades: [
        { data: '260923', tipus: 'recaiguda', skill: 'wiki-cicle-de-vida', resum: 'arxiu sense preguntar' },
        { data: '260917', tipus: 'recaiguda', skill: 'sdp-workflow', resum: 'fora de la finestra' },
        { data: '260924', tipus: 'Recaiguda', skill: 'skill-que-no-existix', resum: 'compta, però no té node' },
        { data: '260922', tipus: 'correccio', skill: 'sdp-workflow', resum: 'no és recaiguda' },
        { data: '26-09-2', tipus: 'recaiguda', skill: 'sdp-workflow', resum: 'data mal formada' }
      ],
      fossils: 8,
      malformades: 2
    },
    estat: { data: '2026-09-24T09:00:00.000Z', bytes: 176883 }
  });
  const vigilat = (opcions = { existeix, ara: ARA }) => construeixMapa({ ...fontsBase(), ...VIGILANCIA }, opcions);

  it('llig la data AAMMDD del LEDGER i rebutja la que no ho és', () => {
    expect(dataLedger('260930')).toBe(Date.UTC(2026, 8, 30));
    for (const dolenta of ['26-09-21', '261332', '260231', '', null]) expect(dataLedger(dolenta)).toBeNaN();
  });

  it('torns: caducats sense tancar i tancats sobre el total, amb un avís agregat', () => {
    const m = vigilat();
    // t2 (vençut) i t4 (sense data llegible): el mateix criteri que readTurn de turns.mjs.
    expect(metrica(m, 'torns-caducats-oberts')).toMatchObject({ numerador: 2, denominador: 4, valor: 0.5, prova: PROVA_MAPA });
    expect(metrica(m, 'torns-tancats')).toMatchObject({ numerador: 1, denominador: 4, prova: PROVA_MAPA });
    expect(avisosDe(m, 'document:.agents/runtime/turns')).toEqual(['torns-caducats']);
    expect(m.avisos.find((x) => x.codi === 'torns-caducats')).toMatchObject({ severitat: 'mitjana', evidencia: '2 de 4 torns caducats sense tancar' });
  });

  it('un torn obert sense caducitat (null o absent) és caducat; un de tancat, mai', () => {
    const torns = [torn('a', 'planned', null), { id: 'b', state: 'opened' }, torn('c', 'closed', null)];
    const m = construeixMapa({ ...fontsBase(), torns }, { existeix, ara: ARA });
    expect(metrica(m, 'torns-caducats-oberts')).toMatchObject({ numerador: 2, denominador: 3 });
  });

  it('Escriptori: ancoratge, rebut i safata; un avís baix per document sense àncora', () => {
    const m = vigilat();
    expect(metrica(m, 'escriptori-ancorat')).toMatchObject({ numerador: 1, denominador: 3 });
    expect(metrica(m, 'escriptori-amb-rebut')).toMatchObject({ numerador: 2, denominador: 3 });
    expect(metrica(m, 'safata-entrada')).toMatchObject({ numerador: 0, denominador: 20, valor: 0, prova: PROVA_MAPA });
    const prompt = 'document:_wiki_de_poble/04_escriptori/260929_2346_prompt_claude_consola.md';
    const pla = 'document:_wiki_de_poble/04_escriptori/260929_2346_pla_implementacio_consola.md';
    expect(avisosDe(m, prompt)).toEqual(['escriptori-sense-ancora']);
    expect(m.avisos.find((x) => x.node === prompt)).toMatchObject({ severitat: 'baixa', evidencia: 'sense enllaç a 00_index_escriptori.md ni rebut de cap torn' });
    expect(m.avisos.find((x) => x.node === pla).evidencia).toBe('sense enllaç a 00_index_escriptori.md');
    expect(m.nodes.some((x) => x.id === 'document:_wiki_de_poble/04_escriptori/260930_0040_auditoria_claude.md')).toBe(false);
  });

  it('LEDGER: recaigudes dels set últims dies, integritat i avisos només sobre nodes que existixen', () => {
    const m = vigilat();
    expect(metrica(m, 'recaigudes-ledger')).toMatchObject({ valor: 2, unitat: 'recaigudes', prova: PROVA_MAPA });
    // La signatura es reproduïx amb la porta del pas 0, no només amb el Mapa.
    expect(metrica(m, 'integritat-ledger')).toMatchObject({ numerador: 0, denominador: 1, valor: 0, prova: 'node tooling/verify-ledger.mjs' });
    expect(avisosDe(m, 'document:.agents/LEDGER.md')).toEqual(['ledger-invalid']);
    expect(m.avisos.find((x) => x.codi === 'ledger-invalid')).toMatchObject({
      severitat: 'alta',
      evidencia: 'signatura del LEDGER no vàlida · 8 segells fòssils · 2 línies mal formades · node tooling/verify-ledger.mjs'
    });
    expect(avisosDe(m, 'skill:wiki-cicle-de-vida')).toContain('recaiguda-recent');
    expect(m.avisos.find((x) => x.codi === 'recaiguda-recent')).toMatchObject({ severitat: 'mitjana', evidencia: '.agents/LEDGER.md · 260923 · arxiu sense preguntar' });
    expect(avisosDe(m, 'skill:sdp-workflow')).not.toContain('recaiguda-recent');
    expect(m.nodes.some((x) => x.id === 'skill:skill-que-no-existix')).toBe(false);
  });

  it('un LEDGER vàlid és 1/1 i no avisa', () => {
    const m = construeixMapa({ ...fontsBase(), ledger: { ...VIGILANCIA.ledger, valid: true } }, { existeix, ara: ARA });
    expect(metrica(m, 'integritat-ledger')).toMatchObject({ numerador: 1, denominador: 1, valor: 1 });
    expect(m.nodes.some((x) => x.id === 'document:.agents/LEDGER.md')).toBe(false);
  });

  it('el relleu d’ESTAT es data en hores', () => {
    expect(metrica(vigilat(), 'frescor-relleu-estat')).toMatchObject({ valor: 3, unitat: 'hores', prova: PROVA_MAPA });
  });

  it('sense rellotge, el que depén de l’hora és N/A i el que no, es mesura', () => {
    const m = vigilat({ existeix });
    for (const nom of ['torns-caducats-oberts', 'recaigudes-ledger', 'frescor-relleu-estat']) expect(metrica(m, nom).valor).toBe('N/A');
    expect(metrica(m, 'torns-tancats').valor).toBe(0.25);
    expect(avisosDe(m, 'document:.agents/runtime/turns')).toEqual([]);
  });

  it('l’eixida amb totes les fonts compleix el contracte i cada valor porta prova', () => {
    const m = vigilat();
    expect(() => normalitzaMapa(m)).not.toThrow();
    expect(m.salut.filter((s) => s.valor !== 'N/A').every((s) => typeof s.prova === 'string' && s.prova)).toBe(true);
  });

  it('sense les fonts noves no hi ha cap avís de vigilància', () => {
    const codis = new Set(mapa().avisos.map((x) => x.codi));
    for (const codi of ['torns-caducats', 'escriptori-sense-ancora', 'ledger-invalid', 'recaiguda-recent']) expect(codis.has(codi)).toBe(false);
  });
});
