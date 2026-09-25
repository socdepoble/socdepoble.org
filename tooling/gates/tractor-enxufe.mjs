#!/usr/bin/env node
/**
 * tractor-enxufe.mjs — LA LLEI DE L'ENXUFABILITAT, MECANITZADA
 *
 * L'AGENTS.md §8 diu que el Frontend s'ha d'escriure per a integrar-se
 * pacíficament a la plataforma de Sollutia i separar-se sense trauma. Fins
 * ara això era prosa: cap porta ho comprovava, i l'auditoria 260830 va trobar
 * que la llei era literalment inassolible (el port no s'exposava enlloc i el
 * pany es tancava abans que ningú poguera injectar res).
 *
 * Aquesta porta converteix la llei en una comprovació.
 *
 *   E1 · Cap mòdul importa `supabaseBackend.js` fora del port
 *   E2 · El contracte de `host.js` i els exports del port no divergixen
 *   E3 · El segellat NO viu dins del cicle de vida del Custom Element
 *   E4 · Una sola superfície global, i declarada
 *
 * Zero dependències. Anàlisi estàtica: no cal navegador ni node_modules.
 *
 * ÚS
 *   node tooling/gates/tractor-enxufe.mjs [--json] [--arrel=/ruta]
 */

import fs from 'node:fs';
import path from 'node:path';
import { R, rel, CAMINS, EXCLOSOS, arrelSegura, diagnostic, ErrorArrel } from '../lib/arrel.mjs';

const JSON_OUT = process.argv.includes('--json');

const PORT = 'src/data/backendPort.js';
const HOST = 'src/host.js';
const EMBED = 'src/PedraSecaEmbed.jsx';

const infraccions = [];
const anota = (llei, fitxer, detall, pista) => infraccions.push({ llei, fitxer, detall, pista });

function fonts() {
  const eixida = [];
  (function camina(d) {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (EXCLOSOS.has(e.name)) continue;
      const c = path.join(d, e.name);
      if (e.isDirectory()) camina(c);
      else if (/\.(js|jsx|mjs)$/.test(e.name)) eixida.push(c);
    }
  }(R(CAMINS.src)));
  return eixida;
}

const llegeix = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const senseComentaris = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .split('\n').map((l) => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1')).join('\n');

/* ═══════════════════════ E1 · El port és l'única porta ═══════════════════════ */

function permetImport(origen, desti) {
  if (!desti.startsWith('src/data/supabase/')) return true;

  return origen.startsWith('src/data/supabase/')
    || (
      origen === 'src/host.js'
      && desti === 'src/data/supabase/index.js'
    );
}

for (const abs of fonts()) {
  const r = rel(abs).replace(/\\/g, '/');
  if (r === PORT) continue;
  
  const text = senseComentaris(llegeix(abs) ?? '');
  
  // Buscar imports (dinàmics o estàtics) i reexports
  const importsReg = /(?:import|export)\s+(?:[^'"`]*?from\s+)?['"`]([^'"`]+)['"`]|import\(['"`]([^'"`]+)['"`]\)/g;
  const matches = [...text.matchAll(importsReg)];
  
  for (const match of matches) {
    const importStr = match[1] || match[2];
    if (!importStr) continue;
    
    // Simplificació ràpida de resolució, assumint que no usem àlies absoluts cap a data/supabase fora de host
    // Opcionalment si inclou supabase
    if (importStr.includes('supabase')) {
      const dirAbs = path.dirname(abs);
      let targetAbs = null;
      
      try {
        if (importStr.startsWith('.')) {
          targetAbs = path.resolve(dirAbs, importStr);
        } else if (importStr.startsWith('@/')) {
          targetAbs = path.resolve(R('src'), importStr.slice(2));
        } else {
          continue; // Paquets node_modules no són supabaseBackend nostre
        }
        
        let targetRel = rel(targetAbs).replace(/\\/g, '/');
        
        // Assegurar extensió si és directori index.js (aproximació per a E1)
        if (!targetRel.endsWith('.js') && !targetRel.endsWith('.mjs') && !targetRel.endsWith('.jsx')) {
          if (fs.existsSync(R(targetRel + '.js'))) targetRel += '.js';
          else if (fs.existsSync(R(targetRel + '/index.js'))) targetRel += '/index.js';
        }

        if (!permetImport(r, targetRel)) {
          anota('E1', r, `importa directament ${targetRel} saltant-se el port`,
            `Importa de '${PORT}' o a través de l'API host.`);
        }
      } catch {
        // Ignorar errors de resolució ací
      }
    }
  }
}

/* ═══════════════════════ E2 · Contracte sincronitzat ═══════════════════════ */

const portText = llegeix(R(PORT));
const hostText = llegeix(R(HOST));

if (!portText) {
  anota('E2', PORT, 'no existix', 'sense port no hi ha enxufabilitat possible');
} else if (!hostText) {
  anota('E2', HOST, 'no existix: el port no té superfície pública',
    'sense host.js, `setBackendImplementation` no és abastable des de fora del bundle');
} else {
  const contracteText = llegeix(R('src/data/contracte.js'));
  if (!contracteText) {
    anota('E2', 'src/data/contracte.js', 'no existix', 'Cal per a llistar les capacitats.');
  } else {
    const alPort = [...portText.matchAll(/^export const (\w+) = /gm)].map((m) => m[1]).filter(k => k !== 'APP_SNAPSHOT_STORAGE_KEY' && k !== 'DATA_SYNC_CHANNEL_NAME' && k !== 'SECTION_SUBMISSIONS_STORAGE_KEY');
    
    const mNucli = /CONTRACTE_NUCLI = Object\.freeze\(\[([\s\S]*?)\]\)/.exec(senseComentaris(contracteText));
    const mCapacitats = /CAPACITATS = Object\.freeze\(\{([\s\S]*?)\}\)/.exec(senseComentaris(contracteText));
    
    let alContracte = mNucli ? [...mNucli[1].matchAll(/'(\w+)'/g)].map((x) => x[1]) : [];
    if (mCapacitats) {
      alContracte.push(...[...mCapacitats[1].matchAll(/'(\w+)'/g)].map((x) => x[1]));
    }

    for (const k of alPort.filter((x) => !alContracte.includes(x))) {
      anota('E2', HOST, `"${k}" es delega al port però no és al CONTRACTE_BACKEND`,
        'un host que implemente el contracte sencer es trobarà aquest mètode encara apuntant a Supabase');
    }
    for (const k of alContracte.filter((x) => !alPort.includes(x))) {
      anota('E2', HOST, `"${k}" és al CONTRACTE_BACKEND però el port no el delega`,
        'un host l\'implementarà i mai serà cridat: fallada muda');
    }
  }
}

/* ═══════════════════════ E3 · El segellat fora del cicle de vida ═══════════════════════ */

const embedText = llegeix(R(EMBED));
if (!embedText) {
  anota('E3', EMBED, 'no existix', 'no es pot verificar on es tanca el pany');
} else {
  const net = senseComentaris(embedText);
  if (/freezeImplementation\s*\(/.test(net)) {
    anota('E3', EMBED, 'crida freezeImplementation() dins del component',
      `el pany s'ha de tancar a ${HOST}:arrenca(). Dins de connectedCallback la finestra `
      + "d'injecció és de zero mil·lisegons: customElements.define() dispara el callback "
      + "síncronament quan l'etiqueta ja és al DOM, que és el cas de WordPress");
  }
  if (hostText && !/freezeImplementation\s*\(\)/.test(senseComentaris(hostText))) {
    anota('E3', HOST, 'arrenca() no congela el backend',
      'sense segellat, una injecció tardana és un vector d\'atac');
  }
}

/* ═══════════════════════ E4 · Una sola superfície global ═══════════════════════ */

const PERMESOS_GLOBAL = /__SDP_(?:REACT_MOUNTED|GLOBAL_ERRORS_BOUND|OUTBOX_QUARANTINED)__/;

for (const abs of fonts()) {
  const r = rel(abs);
  if (r === HOST || /(?:^|\/)(?:__tests__|__mocks__)(?:\/|$)|\.(?:test|spec)\.[cm]?[jt]sx?$/.test(r)) continue;
  const text = senseComentaris(llegeix(abs) ?? '');
  for (const m of text.matchAll(/\b(?:window|globalThis)(?:\.([A-Za-z_$][\w$]*)|\[['"`]([A-Za-z_$][\w$]*)['"`]\])\s*=(?!=)/g)) {
    const prop = m[1] || m[2];
    if (PERMESOS_GLOBAL.test(prop)) continue;
    anota('E4', r, `assigna window.${prop} fora de ${HOST}`,
      `declara-ho a ${HOST}:exposaGlobal() perquè l'API pública siga un sol lloc auditable`);
  }
  for (const m of text.matchAll(/Object\.defineProperty\(\s*(?:window|globalThis)\s*,\s*['"`]([A-Za-z_$][\w$]*)['"`]/g)) {
    const prop = m[1];
    if (PERMESOS_GLOBAL.test(prop)) continue;
    anota('E4', r, `assigna window.${prop} (via defineProperty) fora de ${HOST}`,
      `declara-ho a ${HOST}:exposaGlobal() perquè l'API pública siga un sol lloc auditable`);
  }
}

/* ═══════════════════════ Informe ═══════════════════════ */

const LLEIS = {
  E1: "El port és l'única porta cap al backend",
  E2: 'Contracte del host sincronitzat amb el port',
  E3: 'El segellat viu fora del cicle de vida del component',
  E4: 'Una sola superfície global, i declarada',
};

function informe() {
  if (JSON_OUT) {
    console.log(JSON.stringify({ ok: !infraccions.length, arrel: arrelSegura(), infraccions }, null, 2));
    return infraccions.length ? 1 : 0;
  }
  console.log("\n🔌 TRACTOR D'ENXUFE — Llei de l'Enxufabilitat (AGENTS.md §8)");
  console.log(`   Arrel: ${arrelSegura()}`);
  console.log('─'.repeat(72));
  for (const [codi, nom] of Object.entries(LLEIS)) {
    const meues = infraccions.filter((i) => i.llei === codi);
    if (!meues.length) { console.log(`  ✅ ${codi} · ${nom}`); continue; }
    console.log(`  ❌ ${codi} · ${nom}  (${meues.length})`);
    for (const i of meues.slice(0, 6)) {
      console.log(`       ${i.fitxer}`);
      console.log(`         · ${i.detall}`);
      if (i.pista) console.log(`           ↳ ${i.pista}`);
    }
    if (meues.length > 6) console.log(`       · … i ${meues.length - 6} més`);
  }
  console.log('─'.repeat(72));
  if (infraccions.length) {
    console.error(`\n❌ ${infraccions.length} infracció(ns). El dia de separar Frontend i Backend,`);
    console.error('   cadascuna serà una hora de dolor.\n');
    return 1;
  }
  console.log("\n✅ El port és abastable, el contracte quadra i el pany es tanca on toca.\n");
  return 0;
}

try {
  const d = diagnostic();
  if (d.error) { console.error(d.error.informe()); process.exit(2); }
  process.exit(informe());
} catch (err) {
  if (err instanceof ErrorArrel) { console.error(err.informe()); process.exit(2); }
  console.error(`\n❌ [TRACTOR-ENXUFE] Error inesperat: ${err.message}\n`);
  process.exit(2);
}
