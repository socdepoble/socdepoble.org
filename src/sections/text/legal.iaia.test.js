// @vitest-environment node
/* P1-24 (marató 261101_2143, B10-ESCOMBRADA) · Els apartats 11 i 14 de /legal
   diuen el que fa la IAIA MarIA de l'aplicació: respon al dispositiu amb el
   cervell local (src/data/iaiaLocal.js) i no envia el text a cap empresa
   d'intel·ligència artificial. Esta guarda va en els dos sentits. Llig el codi
   del client i de les funcions del servidor: si algú hi afig una crida a un
   model de fora (per URL o amb el SDK d'un proveïdor), la prova falla. I llig
   el text: si nomena una empresa d'IA, o posa una gran empresa al costat de la
   IAIA, sense que el codi la faça servir, també falla. En tots dos casos cal
   una versió nova del text (apartat 18) i ajustar esta prova alhora. També
   lliga els avisos push del xat (B8, bandera AVISOS_PUSH_XAT_ACTIUS de
   src/config/avisosPushXat.js) al text: encendre'ls sense dir-ho a /legal fa
   caure la prova. Límits: una URL muntada a trossos o un SDK carregat amb un
   especificador calculat no els veu cap guarda estàtica, i una frase falsa que
   no nomene cap empresa ni la IAIA tampoc. Que la resposta local no ix de la
   conversa ho prova pel comportament Conversa.iaiaLocal.test.jsx, que va a la
   bateria d'esta guarda. */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { legalContent } from './legalContent.js';
import { esXatDeLaIAIA } from '../../data/xatsPerDefecte.js';
import { IAIA_ID } from '../../data/identitatsSeed.js';

const ARREL = process.cwd();
const HTML = legalContent.html;
const pla = (tros) => tros.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const llig = (rel) => readFileSync(path.join(ARREL, rel), 'utf8');

function apartat(numero) {
  const inici = HTML.indexOf(`<h4>${numero}. `);
  const fi = HTML.indexOf(`<h4>${numero + 1}. `, inici);
  expect([numero, inici > 0, fi > inici]).toEqual([numero, true, true]);
  return HTML.slice(inici, fi);
}

/* Servicis de models de llenguatge de fora, com a URL (no com a nom: la Gestoria
   nomena fal.ai, OpenRouter o Hugging Face com a proveïdors de factures). Un sol
   quantificador, sense niar: cap retrocés exponencial. */
const MODELS_DE_FORA = /https?:\/\/[a-z0-9.-]*?(?:generativelanguage\.googleapis\.com|aiplatform\.googleapis\.com|api\.anthropic\.com|api\.openai\.com|api\.mistral\.ai|api\.groq\.com|api\.deepseek\.com|api\.together\.xyz|openrouter\.ai|api-inference\.huggingface\.co|router\.huggingface\.co|api\.cohere\.(?:com|ai)|api\.x\.ai|api\.perplexity\.ai|fal\.run|fal\.ai)\b/;
/* ARB-S2-01 · Els SDK dels proveïdors no porten cap URL al codi (bot/cervell.mjs
   fa servir @google/genai així). Com a especificador d'import (from, import,
   import() o require()), nu, amb versió o subcamí, o amb npm:, jsr: o un CDN.
   Cap és dependència de l'aplicació. Classes disjuntes, cap quantificador niat. */
const PAQUETS_IA = String.raw`@google\/genai|@google\/generative-ai|@google-cloud\/vertexai|@google-cloud\/aiplatform|openai|@anthropic-ai\/[a-z0-9-]+|@mistralai\/[a-z0-9-]+|groq-sdk|cohere-ai|@huggingface\/inference|@fal-ai\/[a-z0-9-]+|@ai-sdk\/[a-z0-9-]+|ai|@langchain\/[a-z0-9-]+|langchain|ollama|replicate|together-ai`;
const PREFIX_DE_PAQUET = String.raw`npm:|jsr:|https:\/\/(?:esm\.sh|esm\.run|cdn\.jsdelivr\.net\/npm|unpkg\.com|cdn\.skypack\.dev|deno\.land\/x)\/`;
const PAQUET_CITAT = String.raw`['"\x60](?:${PREFIX_DE_PAQUET})?(?:${PAQUETS_IA})(?:@[^'"\x60/]*)?(?:\/[^'"\x60]*)?['"\x60]`;
const SDK_IA = new RegExp(String.raw`(?:\bfrom|\bimport|\brequire)\s*(?:\(\s*)?${PAQUET_CITAT}`);
const NOM_DE_PAQUET_IA = new RegExp(String.raw`^(?:${PAQUETS_IA})$`);
const FUNCIO_IAIA = /\/functions\/v1\/[a-z0-9_-]*iaia/i;
const XARXA = /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|\brequest\s*\(/;

/* ARB-S2-02 · Empreses i models d'IA de fora, pel nom. L'apartat 23 (agraïments)
   en pot nomenar: no hi són destinatàries de res. */
const EMPRESES_IA = /\b(?:Gemini|Anthropic|OpenAI|ChatGPT|GPT-\d|Claude|Mistral|DeepSeek|Groq|Cohere|Hugging ?Face|fal\.ai|Perplexity|xAI|Grok|Llama|Copilot|Vertex|OpenRouter|Replicate|Ollama)\b/g;
const GRANS_EMPRESES = /\b(?:Google|Apple|Microsoft|Amazon|Meta)\b/;
const PARLA_D_IA = /IAIA|MarIA|[Aa]ssistent|[Ii]ntel·ligència artificial|[Mm]odels? de llenguatge/;

function fonts(dir, nomVal, eixida = []) {
  if (!existsSync(path.join(ARREL, dir))) return eixida;
  for (const nom of readdirSync(path.join(ARREL, dir))) {
    const rel = `${dir}/${nom}`;
    if (statSync(path.join(ARREL, rel)).isDirectory()) { if (nom !== 'node_modules') fonts(rel, nomVal, eixida); }
    else if (nomVal(nom) && rel !== 'src/data/wikiManifest.js') eixida.push(rel);
  }
  return eixida;
}
const esFont = (nom) => /\.(?:js|jsx|mjs|ts|tsx)$/.test(nom) && !/\.test\.|\.spec\./.test(nom);
const SRC = fonts('src', esFont);
const FUNCIONS = fonts('supabase/functions', esFont);
/* Els mapes d'imports de Deno i els package.json de les funcions: un àlies hi pot amagar el SDK. */
const MAPES = fonts('supabase/functions', (nom) => /^(?:deno\.jsonc?|import_map\.json|package\.json)$/.test(nom));

describe('P1-24 · la IAIA de /legal és la IAIA del codi', () => {
  test('cap font del client ni cap funció del servidor crida un model de llenguatge de fora (per URL o per SDK)', () => {
    expect(SRC.length).toBeGreaterThan(100);
    expect([...SRC, ...FUNCIONS].filter((rel) => MODELS_DE_FORA.test(llig(rel)))).toEqual([]);
    expect([...SRC, ...FUNCIONS].filter((rel) => SDK_IA.test(llig(rel)))).toEqual([]);
    expect(MAPES.filter((rel) => new RegExp(PAQUET_CITAT).test(llig(rel)))).toEqual([]);
    const paquet = JSON.parse(llig('package.json'));
    const dependencies = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'].flatMap((grup) => Object.keys(paquet[grup] ?? {}));
    expect(dependencies.length).toBeGreaterThan(10);
    expect(dependencies.filter((nom) => NOM_DE_PAQUET_IA.test(nom))).toEqual([]);
    expect(SRC.filter((rel) => FUNCIO_IAIA.test(llig(rel)))).toEqual([]);
    /* Sanejament R15 (B1/B2) · La funció R54 supabase/functions/iaia (model propi, NO desplegada)
       pot ser al repo, i només ella; el client no la crida sense VITE_SDP_IAIA_SERVIDOR==='1' (la
       prova «R15 · la IAIA amb servidor…» de baix). Les guardes d'URL i de SDK de dalt també la miren. */
    expect(['[]', '["iaia"]']).toContain(JSON.stringify(readdirSync(path.join(ARREL, 'supabase/functions')).filter((nom) => /iaia/i.test(nom))));
  });

  test('cap fitxer de la IAIA del client fa cap crida de xarxa', () => {
    const iaia = SRC.filter((rel) => /iaia/i.test(path.basename(rel)));
    expect(iaia).toContain('src/data/iaiaLocal.js');
    expect(iaia.filter((rel) => XARXA.test(llig(rel)))).toEqual([]);
  });

  /* Sanejament R15 (B1/B2 · P0-01, R15-REG-01, R15-REG-05, P1-01) · La 2.5 no descriu cap consulta
     privada a un model als nostres servidors. L'adaptador Supabase només exporta consultaIAIA amb
     la bandera de build literal, i la consulta directa espera el discover available===true.
     Encendre la bandera (en qualsevol fitxer d'entorn d'esta arrel) sense una versió del text
     posterior a la 2.5 que en parle fa caure la prova. */
  test('R15 · la IAIA amb servidor (functions/v1/iaia) no és al client sense la bandera de build; encendre-la demana un text posterior a la 2.5', () => {
    const adaptador = llig('src/data/supabase/index.js');
    expect(adaptador).toContain("export const consultaIAIA = import.meta.env.VITE_SDP_IAIA_SERVIDOR === '1' ? consultaIAIAAmbServidor : undefined;");
    expect(adaptador).not.toMatch(/export\s*\{[^}]*\bconsultaIAIA\b[^}]*\}/);
    expect(adaptador).not.toMatch(/export\s*\*\s*from\s*'\.\/iaia\.js'/);
    expect(llig('src/sections/xat/IAIAProvider.jsx')).toContain("if(teCapacitat('iaia')&&configuration.current?.available===true){");
    expect(llig('tooling/vite/banderes-de-capacitat.mjs')).toContain("'VITE_SDP_IAIA_SERVIDOR'");
    // Només es mira si la bandera hi és encesa; mai s'escriu cap valor d'un .env a l'eixida.
    const FITXERS_ENV = ['.env', '.env.local', '.env.production', '.env.production.local', '.env.natiu', '.env.natiu.local', '.env.botigues.local'];
    const encesa = FITXERS_ENV.some((fitxer) => { try { return /^\s*(?:export\s+)?VITE_SDP_IAIA_SERVIDOR\s*=\s*['"]?1['"]?\s*$/m.test(llig(fitxer)); } catch { return false; } });
    if (!encesa) {
      expect(pla(apartat(14))).not.toMatch(/model propi/);
      return;
    }
    expect(HTML).not.toMatch(/Versió 2\.[0-5] ·/);
    expect(pla(apartat(14))).toMatch(/model propi/);
  });

  test('l’apartat 11 no nomena cap proveïdor d’intel·ligència artificial com a encarregat, ni parla de la IAIA', () => {
    expect(pla(apartat(11))).not.toMatch(/Anthropic|OpenAI|IAIA|MarIA|[Aa]ssistent|[Ii]ntel·ligència artificial|[Mm]odels? de llenguatge/);
  });

  test('fora dels agraïments (23), /legal no nomena cap empresa d’IA ni posa cap gran empresa al costat de la IAIA', () => {
    const inici23 = HTML.indexOf('<h4>23. ');
    const fi23 = HTML.indexOf('<hr />', inici23);
    expect([inici23 > 0, fi23 > inici23]).toEqual([true, true]);
    const fora = HTML.slice(0, inici23) + HTML.slice(fi23);
    expect(pla(fora).match(EMPRESES_IA)).toBeNull();
    const blocs = fora.split(/<(?:li|p|h[1-6]|blockquote)\b[^>]*>/).map(pla);
    expect(blocs.length).toBeGreaterThan(100);
    expect(blocs.filter((bloc) => GRANS_EMPRESES.test(bloc) && PARLA_D_IA.test(bloc))).toEqual([]);
  });

  test('l’apartat 14 diu que la IAIA respon al dispositiu, on va la pregunta i què passa si canvia; ConsultaIAIA.jsx està eliminat (R21.3)', () => {
    const catorze = pla(apartat(14));
    expect(catorze).not.toMatch(/Anthropic|OpenAI|contracte d'encarregat/);
    expect(catorze).not.toMatch(GRANS_EMPRESES);
    expect(catorze).toMatch(/no envia el que li escrius a cap empresa d'intel·ligència artificial/);
    expect(catorze).toMatch(/xat públic de la pàgina de la IAIA/);
    expect(catorze).toMatch(/apartat 18/);
    expect(existsSync(path.join(ARREL, 'src/sections/xat/components/ConsultaIAIA.jsx'))).toBe(false);
    // Mentres el text segellat SDP-RGPD-021 siga la 2.5, la migració 2.6 ja en retira la menció a «Pregunta a la IAIA»; a partir de 2.6, no hi pot aparéixer.
    if (!/Versió 2\.5\b/.test(pla(HTML))) {
      expect(catorze).not.toMatch(/«Pregunta a la IAIA»/);
    }
  });

  test('l’assistent amb compte és local; el grup públic conserva la cortesia local', () => {
    // El grup compartit continua accessible expressament, separat de l'assistent.
    expect(esXatDeLaIAIA({ id: 'f-iaia', tipus: 'grup', altres: [], subjecte: { tipus: 'pagina', id: '/iaia' } })).toBe(true);
    expect(esXatDeLaIAIA({ id: 'f-grup', tipus: 'grup', altres: [{ id: IAIA_ID, tipus: 'ia' }], subjecte: null })).toBe(false);
    // La resposta local (cortesiaIAIA) només hi és en remot i amb sessió.
    expect(llig('src/sections/xat/XatSection.jsx')).toMatch(/cortesiaIAIA=\{modeDades === 'remote' && !senseSessio/);
    // ARB-S2-03 · Que la resposta no va al port ni al servidor ho prova el comportament
    // (Conversa.iaiaLocal.test.jsx, a la bateria): la pregunta hi va una sola vegada.
    const comportament = llig('src/sections/xat/components/Conversa.iaiaLocal.test.jsx');
    expect(comportament).toMatch(/expect\(props\.onSendMessage\)\.toHaveBeenCalledTimes\(1\)/);
    expect(comportament).toMatch(/expect\(respostaLocalIAIA\)\.toHaveBeenCalledWith\(/);
  });

  test('B8 · si els avisos push del xat s’encenen, /legal ho diu (apartats 8 i 11) en una versió posterior a la 2.3', () => {
    // La bandera de B8 ha de ser una constant literal (Rollup la plega): si no, esta guarda no podria saber si està encesa.
    const nomenen = SRC.filter((rel) => llig(rel).includes('AVISOS_PUSH_XAT_ACTIUS'));
    const declaren = SRC.filter((rel) => /export\s+const\s+AVISOS_PUSH_XAT_ACTIUS\s*=\s*(?:true|false)\s*;/.test(llig(rel)));
    if (nomenen.length > 0) expect(declaren.length).toBe(1);
    const encesos = SRC.filter((rel) => /export\s+const\s+AVISOS_PUSH_XAT_ACTIUS\s*=\s*true\b/.test(llig(rel)));
    if (encesos.length === 0) return; // apagats (o B8 encara no hi és): la 2.3 no en parla, i és cert
    expect(pla(apartat(8))).toMatch(/avisos/i);
    // Apple i Google, en una vinyeta o un paràgraf que parle dels avisos: «Google Workspace» (el correu) no hi compta.
    const blocsDAvisos = apartat(11).split(/<(?:li|p)>/).slice(1).map(pla).filter((b) => /avisos/i.test(b));
    expect(blocsDAvisos.some((b) => /Apple/.test(b))).toBe(true);
    expect(blocsDAvisos.some((b) => /Google/.test(b))).toBe(true);
    expect(HTML).not.toMatch(/Versió 2\.3 ·/);
  });
});
