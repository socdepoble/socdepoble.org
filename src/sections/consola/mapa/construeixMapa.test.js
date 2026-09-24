import { describe, expect, it } from 'vitest';
import {
  construeixMapa, scriptsDeOrdre, npmDeOrdre, disparadorsDecoratius, disparadorsAmples, nodeDeRuta
} from './construeixMapa.js';
import { normalitzaMapa } from './mapaContent.js';

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
});

describe('construeixMapa · funció de salut', () => {
  it('cada valor porta numerador, denominador i prova; el que falta és N/A', () => {
    const m = mapa();
    expect(metrica(m, 'disparadors-utils')).toMatchObject({ numerador: 2, denominador: 3, valor: 0.667 });
    expect(metrica(m, 'cens-skills-coherent')).toMatchObject({ numerador: 2, denominador: 5, valor: 0.4 });
    expect(metrica(m, 'vigilants-vius')).toMatchObject({ numerador: 1, denominador: 2, valor: 0.5 });
    for (const nom of ['integritat-contingut', 'frescor-instantania', 'conformitat-documental', 'cadena-portes']) {
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
