/* Plataforma d'Apps Enxufables · les fronteres: el que no ha d'eixir d'una app.
   Telemetria (només /app/*, mai quina app ni on), cerca global (no indexa cap
   app), traducció de pàgina (cap app la munta) i el criteri d'«ama del
   document» de la guarda de salut, que ha de ser el de RouteTelemetria. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { _reiniciaTelemetria, darrersEnviaments, declaraEncastada, registraVisita } from '../../data/telemetria.js';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else if (/\.jsx?$/.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}

const esProva = (f) => /\.test\.jsx?$/.test(f) || f.includes('/__fixtures__/');
const APPS = fitxersDe('src/apps').filter((f) => !esProva(f));
const especificadors = (codi) => [...codi.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);

describe('telemetria', () => {
  beforeEach(() => { _reiniciaTelemetria(); declaraEncastada(false); });
  afterEach(() => { _reiniciaTelemetria(); });

  test.each([
    ['/app/salut/diari/2026-10-02', '/app/*'],
    ['/app/salut', '/app/*'],
    ['/app/bar/caixa/t-3?filtre=obert', '/app/*'],
    ['/app', '/app']
  ])('%s viatja com a %s', (ruta, esperada) => {
    registraVisita(ruta);
    const [intent] = darrersEnviaments();
    expect(intent.url).toBe(esperada);
    /* El moment és l'hora de l'intent (no és de la ruta): la resta no diu quina app ni on. */
    const resta = { ...intent };
    delete resta.moment;
    expect(JSON.stringify(resta)).not.toMatch(/salut|bar|diari|caixa|t-3|filtre|2026/);
  });
});

describe('cerca global i traducció', () => {
  test('la cerca global no importa res de les apps', () => {
    for (const fitxer of ['src/sections/search/indexCerca.js', 'src/sections/search/useCercaGlobal.js']) {
      expect(especificadors(llig(fitxer)).filter((e) => e.includes('/apps/')), fitxer).toEqual([]);
    }
  });

  test('cap fitxer de src/apps munta la traducció de pàgina, la Pàgina Universal ni la telemetria', () => {
    const vetats = /useTraduccioPagina|UniversalPage|PageFrame|UniversalEditorShell|data\/telemetria/;
    const trobats = APPS.flatMap((fitxer) => especificadors(llig(fitxer)).filter((e) => vetats.test(e)).map((e) => `${fitxer}: ${e}`));
    expect(trobats).toEqual([]);
  });

  test('cap app importa la Gestoria ni els Tractors (D3)', () => {
    const trobats = APPS.flatMap((fitxer) => especificadors(llig(fitxer))
      .filter((e) => /sections\/(?:gestoria|tractors)\//.test(e)).map((e) => `${fitxer}: ${e}`));
    expect(trobats).toEqual([]);
  });
});

describe('guarda de salut', () => {
  test('el criteri d’ama del document és el de RouteTelemetria (cap divergència)', () => {
    const telemetria = llig('src/hooks/RouteTelemetria.jsx');
    expect(telemetria).toContain("externalConfig?.manageDocumentHead !== true || window.__SDP_EMBEDDED__");
    expect(telemetria).toContain('window.self === window.top');
    const propi = llig('src/apps/plataforma/interruptors.js');
    expect(propi).toContain("externalConfig?.manageDocumentHead !== true || finestra.__SDP_EMBEDDED__");
    expect(propi).toContain('finestra.self === finestra.top');
  });
});
