#!/usr/bin/env node
import { esMain } from '../lib/arrel.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_DIR, ESCRIPTORI_DIR } from '../wiki/lib/project_paths.mjs';
import { ROOT, options } from '../documental/cli.mjs';

const FITXER_GUARDA = '.agents/runtime/guarda_nocturna.json';

/**
 * Gestor mecànic del cicle de vida de la Guàrdia Nocturna i Co-working d'IAs.
 * Evita crons zombi i assegura que quan Claude o l'Auditoria acaben,
 * TOTES les IAs i temporitzadors s'aturen immediatament.
 */

export function obrirGuarda(root, { onada = 'guarda-nocturna', maxHores = 6, objectiu = '', modeTancament = 'legacy' } = {}) {
  if (!['legacy', 'desconvocatoria'].includes(modeTancament)) throw new Error('Mode de tancament desconegut');
  if (modeTancament === 'desconvocatoria' && (
    typeof onada !== 'string' || !onada.trim() || !Number.isFinite(maxHores) || maxHores <= 0 || maxHores > 6
  )) throw new Error('La desconvocatòria requerix una onada identificada i un TTL positiu de com a màxim 6 hores');
  const ruta = path.join(root, FITXER_GUARDA);
  const ara = new Date();
  const expira = new Date(ara.getTime() + maxHores * 60 * 60 * 1000);

  const dada = {
    activa: true,
    onada,
    objectiu,
    inici: ara.toISOString(),
    expira: expira.toISOString(),
    maxHores,
    estat_claude: 'pendent',
    estat_auditoria: 'pendent',
    ultim_check: ara.toISOString(),
    finalitzada: false,
    motiu_finalitzacio: null,
    ...(modeTancament === 'desconvocatoria' ? { modeTancament } : {}),
  };

  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, JSON.stringify(dada, null, 2), 'utf8');
  return dada;
}

export function aturarGuarda(root, motiu = 'Aturada manualment', { onada } = {}) {
  const ruta = path.join(root, FITXER_GUARDA);
  let dada = { activa: false, finalitzada: true };
  if (fs.existsSync(ruta)) {
    try {
      dada = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    } catch {
      // Ignorar lectura corrupta
    }
  }
  // Una ordre antiga no pot tancar una altra onada que haja ocupat el mateix fitxer.
  if (dada.modeTancament === 'desconvocatoria' && (!onada || onada !== dada.onada)) {
    throw new Error('Cal indicar la mateixa onada de la guàrdia per a desconvocar-la');
  }
  dada.activa = false;
  dada.finalitzada = true;
  dada.motiu_finalitzacio = motiu;
  dada.tancat_a = new Date().toISOString();

  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, JSON.stringify(dada, null, 2), 'utf8');
  return dada;
}

const dataValida = (valor) => typeof valor === 'string' && Number.isFinite(Date.parse(valor));

/* Estat de la guàrdia tal com està al disc. «existix» i «llegible» van
   separats: un fitxer present però corrupte, a mig escriure o que no és un
   objecte no es confon mai amb l'absència de guàrdia. */
function llegirEstat(ruta) {
  if (!fs.existsSync(ruta)) return { existix: false, llegible: false, dada: null };
  try {
    const dada = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    if (dada && typeof dada === 'object' && !Array.isArray(dada)) return { existix: true, llegible: true, dada };
  } catch {
    // Il·legible: la resposta és el retorn de baix, que falla tancat.
  }
  return { existix: true, llegible: false, dada: null };
}

/* Llig i data l'evidència des del mateix descriptor: el contingut avaluat és
   el que porta l'mtime comprovat, també si el nom és un enllaç simbòlic.
   O_NONBLOCK evita que un FIFO amb nom d'informe penge la consulta del cron;
   el fstat el descarta després perquè no és un fitxer regular. */
function llegirEvidencia(fullPath) {
  const fd = fs.openSync(fullPath, fs.constants.O_RDONLY | (fs.constants.O_NONBLOCK ?? 0));
  try {
    const estat = fs.fstatSync(fd);
    if (!estat.isFile()) return null;
    return { contingut: fs.readFileSync(fd, 'utf8'), mtimeMs: estat.mtimeMs };
  } finally {
    fs.closeSync(fd);
  }
}

export function comprovarGuarda(root) {
  const ruta = path.join(root, FITXER_GUARDA);
  const ara = new Date();

  const estatDisc = llegirEstat(ruta);
  const dada = estatDisc.dada;

  /* R32 · troballa del Node 0 (tanda R31, core-direccio-autonoma): amb fitxer
     d'estat, una evidència de l'Escriptori només compta si es va modificar
     després de l'inici d'esta guàrdia (mtime > inici; «inici» és el
     «startedAt» de la troballa). Sense un inici vàlid cap evidència compta:
     falla tancat i no inventa consens amb informes d'onades anteriors. Sense
     fitxer d'estat no hi ha inici de referència i es conserva el
     reconeixement històric. */
  const iniciMs = !estatDisc.existix ? null : (dataValida(dada?.inici) ? Date.parse(dada.inici) : NaN);
  const esRecent = (mtimeMs) => iniciMs === null || (Number.isFinite(iniciMs) && mtimeMs > iniciMs);
  const motiuDescart = Number.isFinite(iniciMs)
    ? `modificada abans de l'inici de la guàrdia (${dada.inici})`
    : "l'estat de la guàrdia no té cap inici vàlid";

  // Comprovar fitxers a l'escriptori per determinar si l'Onada ha acabat
  const dirEscriptori = path.resolve(root) === path.resolve(PROJECT_DIR) ? ESCRIPTORI_DIR : path.join(root, path.relative(PROJECT_DIR, ESCRIPTORI_DIR));
  let hiHaAuditoriaAprovada = false;
  let hiHaInformeClaudeTancat = false;
  const detalls = [];
  const evidenciesDescartades = [];

  /* Gauntlet 261022: opt-in explícit. La prosa no és cap rebut d'aprovació:
     pot citar un dictamen anterior o un commit històric. En este mode només
     una desconvocatòria acotada a l'onada o el TTL tanquen la guàrdia.
     Sense opt-in es conserva el protocol històric, sense reinterpretar-lo,
     llevat de dos SHA fixos d'octubre que ja no són cap rebut (R32). */
  if (dada?.modeTancament !== 'desconvocatoria' && fs.existsSync(dirEscriptori)) {
    const fitxers = fs.readdirSync(dirEscriptori).sort();
    for (const f of fitxers) {
      if (!f.endsWith('.md')) continue;
      let evidencia = null;
      try {
        evidencia = llegirEvidencia(path.join(dirEscriptori, f));
      } catch (error) {
        // No aporta cap evidència, però un candidat il·legible queda declarat.
        if (/auditoria_(gemini|codex|claude)|informe_claude/.test(f)) {
          evidenciesDescartades.push(`${f}: no s'ha pogut llegir (${error?.code || error?.message || error})`);
        }
      }
      if (!evidencia) continue;
      const { contingut } = evidencia;
      const auditoria = (f.includes('auditoria_gemini') || f.includes('auditoria_codex')) && (
        contingut.includes("DICTAMEN D'APROVACIÓ TOTAL") ||
        contingut.includes('100% en verd') ||
        (contingut.includes('status: canonic') && contingut.includes('APROVAT'))
      );
      const informe = (f.includes('auditoria_claude') || f.includes('informe_claude')) && (
        contingut.includes('Commit consolidat') ||
        contingut.includes('feat(llancament)')
      );
      if (!auditoria && !informe) continue;
      if (!esRecent(evidencia.mtimeMs)) {
        evidenciesDescartades.push(`${f}: ${motiuDescart}`);
        continue;
      }
      if (auditoria) {
        hiHaAuditoriaAprovada = true;
        detalls.push(`Auditoria aprovada trobada: ${f}`);
      }
      if (informe) {
        hiHaInformeClaudeTancat = true;
        detalls.push(`Informe Claude tancat trobat: ${f}`);
      }
    }
  }

  // Comprovar si el temps ha expirat
  let tempsExpirat = false;
  if (dada && dada.expira) {
    tempsExpirat = ara.getTime() > new Date(dada.expira).getTime();
  }

  /* Falla tancat també per al TTL: un fitxer d'estat il·legible, o una guàrdia
     activa sense termini vàlid, no pot acreditar el límit de sis hores i no
     autoritza cap cron a continuar. */
  const estatSenseTermini = estatDisc.existix && (!estatDisc.llegible || (Boolean(dada.activa) && !dataValida(dada.expira)));

  const deuriaParar = Boolean(
    (hiHaAuditoriaAprovada && hiHaInformeClaudeTancat) ||
    tempsExpirat ||
    (dada && !dada.activa) ||
    estatSenseTermini
  );

  let motiu = null;
  if (hiHaAuditoriaAprovada && hiHaInformeClaudeTancat) {
    motiu = "Tasca i auditoria completades amb èxit (100% verd i commit segellat). S'HAN D'ATURAR TOTES LES IAS.";
  } else if (tempsExpirat) {
    motiu = "Temps màxim de guàrdia assolit (TTL expirat). S'han d'aturar els crons per seguretat.";
  } else if (dada && !dada.activa) {
    motiu = dada.motiu_finalitzacio || "La guàrdia ja està marcada com a inactiva.";
  } else if (estatSenseTermini) {
    motiu = "Estat de la guàrdia il·legible o sense termini vàlid: no es pot acreditar el TTL. S'han d'aturar els crons per seguretat.";
  }

  if (deuriaParar && dada && dada.activa) {
    dada.activa = false;
    dada.finalitzada = true;
    dada.motiu_finalitzacio = motiu;
    dada.tancat_a = ara.toISOString();
    fs.writeFileSync(ruta, JSON.stringify(dada, null, 2), 'utf8');
  }

  return {
    activa: dada ? dada.activa : false,
    finalitzada: deuriaParar,
    deuriaParar,
    motiu,
    hiHaAuditoriaAprovada,
    hiHaInformeClaudeTancat,
    detalls,
    evidenciesDescartades,
    dadaGuarda: dada,
  };
}

async function main() {
  const o = options();
  const root = path.resolve(o.arrel || ROOT);

  if (o.inici) {
    const res = obrirGuarda(root, {
      onada: o.onada || 'guarda-nocturna',
      maxHores: Number(o['max-hores'] || 6),
      objectiu: o.objectiu || '',
      modeTancament: o['mode-tancament'] || 'legacy',
    });
    console.log(JSON.stringify({ valid: true, accio: 'inici', guarda: res }, null, 2));
    return;
  }

  if (o.aturar || o.stop) {
    const res = aturarGuarda(root, o.motiu || 'Aturada expressa via CLI', { onada: o.onada });
    console.log(JSON.stringify({ valid: true, accio: 'aturar', guarda: res }, null, 2));
    return;
  }

  const estat = comprovarGuarda(root);
  console.log(JSON.stringify({ valid: true, accio: 'estat', estat }, null, 2));
  if (estat.deuriaParar) {
    process.exitCode = 0; // 0 significa que deuria parar o està finalitzada
  } else {
    process.exitCode = 2; // 2 significa que encara continua en curs
  }
}

if (esMain(import.meta.url)) {
  main().catch((e) => {
    console.error(JSON.stringify({ valid: false, error: e.message }));
    process.exitCode = 1;
  });
}
