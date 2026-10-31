#!/usr/bin/env node
/**
 * Execució atòmica de la Poda Històrica per Lots (Tasca 6)
 * Aprovada pel Mestre Javi Llinares el 18-10-2026.
 *
 * Mou:
 * 1. Lot 1C (reubicació): 261016_0035_acta_marmota_codex_gauntlet.md -> _wiki_de_poble/10_actes/
 * 2. Lot 1A: 134 fitxers de llast de 90_arxiu_historic/ -> ../_arxiu_wiki_de_poble/90_arxiu_historic_llast/
 * 3. Sub-lot 2A: 14 entrades de 04_escriptori/02_investigacio_ia/ -> ../_arxiu_wiki_de_poble/02_investigacio_ia/
 *
 * Registra tot el cens i empremtes a ../_arxiu_wiki_de_poble/00_manifest_arxiu_fred.json
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
/* Ordre del Mestre (30-10-2026) · les carpetes de la Wiki venen de la SSOT de rutes
   (Porta Rutes, R1). Mateixes cadenes; l'arxiu fred és una carpeta germana, fora de la SSOT. */
import { CAMINS } from '../lib/arrel.mjs';

const REPO_ROOT = process.cwd();
const ARXIU_FRED_ROOT = path.resolve(REPO_ROOT, '../_arxiu_wiki_de_poble');
const HISTORIC_DIR = path.join(REPO_ROOT, CAMINS.arxiuHistoric);
const INVESTIGACIO_DIR = path.join(REPO_ROOT, CAMINS.escriptori, '02_investigacio_ia');
const ACTES_DIR = path.join(REPO_ROOT, CAMINS.actes);

const MANIFEST_FILE = path.join(ARXIU_FRED_ROOT, '00_manifest_arxiu_fred.json');

// Sub-lot 2A (14 entrades)
const ENTRADES_2A = [
  '260922_0500_informe_idees_noves_skills.md',
  '261002_0150_investigacio_plugins_claude.md',
  '261002_1650_carboni_silici_fluxos.md',
  '261002_1655_tractor_fluxos.md',
  '261002_1730_eines_disseny_ia.md',
  '261003_1330_llicons_claude.txt',
  '261004_0045_mcp_prompts_chat.md',
  '261004_0045_skills_kowalski_impeccable.md',
  '261010_2200_tractor_ortografia_valenciana.md',
  '261014_1930_emowe_mapa_de_tu_viaje',
  'Planificador de mejora de flujos de trabajo · Claude Academy.webloc',
  'Todos los recursos · Claude Academy.webloc',
  'mapa-visual-agentes.zip',
  'vigilante'
];

// Lot 1B (29 fitxers amb wikilinks vius que no es mouen al Lot 1A)
const FITXERS_1B = new Set([
  '261006_0224_pla_implementacio_antigravity.md',
  '261007_1645_pla_implementacio_claude.md',
  '261007_2205_pla_implementacio_claude.md',
  '261008_1521_informe_progres_claude.md',
  '261008_1649_informe_progres_claude.md',
  '261008_2032_pla_implementacio_claude.md',
  '261008_2032_prompt_claude.md',
  '261009_0245_pla_implementacio_onada6.md',
  '261011_1314_pla_implementacio_ficiv.md',
  '261011_1314_prompt_claude_ficiv.md',
  '261011_1410_prompt_claude_maquetacio_ficiv.md',
  '261012_0025_pla_implementacio_informe_editorial.md',
  '261012_0025_prompt_claude_informe_complet_editorial.md',
  '261012_1633_auditoria_claude_gestoria.md',
  '261012_1940_pla_implementacio_gestoria_erp.md',
  '261012_1940_prompt_claude_gestoria_erp.md',
  '261012_2004_prompt_chatgpt_auditor.md',
  '261012_2148_peticio_registre_mestre.md',
  '261012_2245_prompt_claude_refinament.md',
  '261013_1405_prompt_chatgpt_auditor.md',
  '261013_2355_prompt_codex_sanejament_produccio_i_laboratori.md',
  '261014_0130_pla_implementacio_auditoria_gemini4.md',
  '261014_0130_prompt_gemini4_auditoria_adversarial_extrema.md',
  '261014_0210_pla_implementacio_reparacions_xat_i_consola.md',
  '261014_0210_prompt_claude_reparacions_xat_i_consola.md',
  '261014_0215_prompt_gemini4_fiscalitzacio_xat_i_consola.md',
  '261014_0420_auditoria_codex_reparacions_xat_i_consola.md',
  '261014_0425_pla_implementacio_gestoria_i_replegament.md',
  '261016_0015_prompt_gauntlet_claude_codex_gemini.md'
]);

// Lot 1C (2 fitxers protegits)
const FITXERS_1C = new Set([
  '261011_1410_pla_implementacio_maquetacio_ficiv.md',
  '261016_0035_acta_marmota_codex_gauntlet.md'
]);

// Llista dels 165 de l'Annex B
const FITXERS_ANNEX_B = [
  '2026/09/22/260922_0335_pla_implementacio_neteja_wiki.md',
  '2026/09/22/260922_0510_pla_implementacio_braingraph.md',
  '2026/09/22/260922_0510_prompt_braingraph.md',
  '260921_0941_prompt_auditoria_fortificacio_codex.md',
  '260921_0952_informe_auditoria_react_build.md',
  '260921_2001_pla_implementacio_brain.md',
  '260921_2144_petorreta_claudecodex.md',
  '260921_Sessio_Matinal/260921_0835_PROMPT_Auditoria_Fortificacio.md',
  '260921_Sessio_Matinal/260921_0845_PLA_IMPLEMENTACIO_Barreres_Arquitectoniques.md',
  '260921_Sessio_Matinal/260921_0850_PROMPT_Implementacio_Fortificacio.md',
  '260921_Sessio_Tancada/260921_0635_prompt_auditoria_seguretat.md',
  '260921_Sessio_Tancada/260921_0635_prompt_millora_arquitectura.md',
  '260921_Sessio_Tancada/260921_0635_prompt_millora_brain_fable.md',
  '260921_antic_cicle_auditoria/260921_0640_prompt_millora_brain.md',
  '260921_antic_cicle_auditoria/260921_0655_pla_implementacio_brain_maria.md',
  '260922_0005_pla_implementacio_marIA.md',
  '260922_0100_pla_implementacio_graf_maria.md',
  '260922_0150_petorreta_fortificacio.md',
  '260922_0205_prompt_unificacio_espai.md',
  '260922_auditoria_fortificacio/260922_0602_prompt_auditoria_formats.md',
  '260922_auditoria_fortificacio/260922_0650_pla_implementacio_maria.md',
  '260922_auditoria_fortificacio/260922_1719_pla_implementacio_codex.md',
  '260922_jornada_nit/260922_2104_pla_implementacio_manteniment_cervell.md',
  '260922_jornada_nit/260922_2104_prompt_manteniment_cervell.md',
  '260922_jornada_nit/260922_2335_pla_implementacio_llum_verda.md',
  '260922_jornada_nit/260922_2335_prompt_claude.md',
  '260922_jornada_nit/260922_2335_prompt_codex.md',
  '260922_resoltes/260922_2215_prompt_auditoria_claude.md',
  '260922_resoltes/260922_2215_prompt_auditoria_codex.md',
  '260923_1245_prompt_auditoria_codex.md',
  '260923_1615_prompt_implementacio_codex.md',
  '260923_1735_prompt_auditoria_brain_claude.md',
  '260923_1735_prompt_fortificacio_codex.md',
  '260923_1930_auditoria/260923_1930_prompt_claude.md',
  '260923_1930_auditoria/260923_1930_prompt_codex.md',
  '260923_1930_neteja/260923_1815_prompt_auditoria_brain_claude.md',
  '260923_1930_neteja/260923_1815_prompt_auditoria_sollutia_codex.md',
  '260923_1930_neteja/260923_1900_prompt_fortificacio_seguretat.md',
  '260923_2005_prompt_execucio_codex.md',
  '260923_2025_pla_implementacio_fortificacio.md',
  '260923_2113_pla_implementacio.md',
  '260923_Auditories_Editor_T4/260923_2225_prompt_codex.md',
  '260923_jornada_olivera/260923_1340_prompt_implementacio_codex.md',
  '260924_0124_prompt_codex_implementacio.md',
  '260924_0227_prompt_login_sollutia.md',
  '260924_0356_auditoria_claude.md',
  '260924_0357_auditoria_codex.md',
  '260924_0400_prompt_codex_astra_alto.md',
  '260924_1245_prompt_estudi_claude.md',
  '260924_Auditoria_Fable/260924_0545_prompt_fable.md',
  '260924_Auditoria_Olivera/260924_0645_pla_implementacio_opus.md',
  '260924_Auditoria_Olivera/260924_0711_prompt_fortificacio_codex.md',
  '260924_Auditories_Astra_Fable/260924_1540_pla_implementacio_claude.md',
  '260924_Auditories_Astra_Fable/260924_1705_auditoria_astra_alto.md',
  '260924_Auditories_Astra_Fable/260924_1706_pla_implementacio_codex.md',
  '260924_Sessio_Vesprada/260924_1445_prompt_claude.md',
  '260924_Sessio_Vesprada/260924_1500_auditoria_claude.md',
  '260924_Sessio_Vesprada/260924_1500_pla_implementacio_claude.md',
  '260924_Tanda_Codex_Vesprada/260924_1910_pla_implementacio_codex.md',
  '260924_Tanda_Umami/260924_1855_auditoria_claude.md',
  '260925_Tanda_Codex_Vesprada/260925_1650_pla_implementacio_codex.md',
  '260925_Tanda_Codex_Vesprada/260925_1650_prompt_execucio_codex.md',
  '260926_0130_prompt_auditoria_extrema.md',
  '260926_1030_prompt_auditoria_fase2_fable.md',
  '260926_1950_prompt_codex_auditoria_ui.md',
  '260926_2325_prompt_claude.md',
  '260927_1250_pla_implementacio_perfil_empresa.md',
  '260927_1720_pla_implementacio_claude.md',
  '260927_1720_prompt_claude.md',
  '260927_1850_pla_implementacio_claude.md',
  '260927_1925_prompt_logica_usuari.md',
  '260927_Claude_Sinergia_UI/260927_1645_deute_usabilitat_botons.md',
  '260927_Codex_Gov_Auth/260927_1650_pla_implementacio_codex.md',
  '260927_Xat_F0/260927_0050_informe_vistes_antigues.md',
  '260928/260928_0215_pla_implementacio_claude_ultracode.md',
  '260928/260928_0215_prompt_claude_ultracode.md',
  '260928_0155_pla_implementacio_t39.md',
  '260928_1345_prompt_claude_ultracode.md',
  '260928_1910_prompt_claude_onada_final.md',
  '260929_1145_pla_implementacio_codex.md',
  '260929_Tanda_Maria_Vesprada/260929_1839_prompt_claude_auditoria_visual.md',
  '260929_Tanda_Maria_Vesprada/260929_1955_pla_implementacio_auditoria.md',
  '260929_Tanda_Maria_Vesprada/260929_2145_pla_implementacio_plugin_wp.md',
  '260930_0320_pla_implementacio_maria.md',
  '260930_0320_prompt_claude.md',
  '260930_1312_pla_implementacio_codex.md',
  '260930_1350_prompt_claude.md',
  '260930_1404_auditoria_semantic.md',
  '260930_1404_pla_implementacio_semantic.md',
  '260930_1545_prompt_claude.md',
  '260930_1545_prompt_codex.md',
  '260930_1558_auditoria_codex.md',
  '260930_1625_prompt_codex_adversarial.md',
  '260930_1650_pla_implementacio_codex_adversarial.md',
  '260930_2130_pla_implementacio_claude.md',
  '260930_2130_prompt_claude.md',
  '2609_escriptori/260924_0045_prompt_arquitectura_codex.md',
  '261001_0400_pla_implementacio_claude.md',
  '261001_0400_prompt_claude.md',
  '261001_0445_prompt_claude_calendari.md',
  '261001_1140_pla_implementacio_claude.md',
  '261001_1140_prompt_claude.md',
  '261001_1310_pla_implementacio_codex.md',
  '261001_Sessio_Matinada/261001_0025_pla_implementacio_codex.md',
  '261001_Sessio_Matinada/261001_2050_pla_implementacio.md',
  '261001_Sessio_Matinada/261001_2110_pla_calendari_vistes.md',
  '261002_0155_auditoria_maria.md',
  '261002_0225_auditoria_maria_bucle_avancat.md',
  '261002_1245_pla_implementacio_alarma_fatiga.md',
  '261002_1650_pla_implementacio_massiva_claude.md',
  '261003_1250_pla_implementacio_maria.md',
  '261003_Onada_4_Tancament/261004_0014_pla_implementacio_maria.md',
  '261003_Onada_4_Tancament/261004_0050_prompt_claude_impeccable.md',
  '261004_1006_prompt_codex_auditoria.md',
  '261004_1037_prompt_local_reinici_servidor.md',
  '261004_1042_prompt_local_codex_resum.md',
  '261004_1106_prompt_local_claude_urgent_barres.md',
  '261004_1111_prompt_local_claude_urgent_pull_to_refresh.md',
  '261004_2045_prompt_marato_excelencia.md',
  '261004_2050_prompt_claude_refutacio.md',
  '261004_2057_prompt_auditoria_adversarial.md',
  '261004_Auditoria_Gestoria_Codex/261004_0655_instruccions_ux_ipad_claude.md',
  '261004_Auditoria_Gestoria_Codex/261004_0905_instruccions_triage_investigacio_claude.md',
  '261004_Auditoria_Gestoria_Codex/261004_1015_instruccions_claude_petorreta.md',
  '261004_Auditoria_Gestoria_Codex/261004_1948_pla_implementacio_local_codex_auditoria_adversarial.md',
  '261004_Auditoria_Gestoria_Codex/261004_2025_acta_marmota_codex.md',
  '261005_1155_prompt_fable.md',
  '261005_1215_auditoria_fable.md',
  '261005_1303_prompt_opus_local.md',
  '261006_0224_pla_implementacio_antigravity.md',
  '261007_1645_pla_implementacio_claude.md',
  '261007_2205_pla_implementacio_claude.md',
  '261008_1521_informe_progres_claude.md',
  '261008_1649_informe_progres_claude.md',
  '261008_2032_pla_implementacio_claude.md',
  '261008_2032_prompt_claude.md',
  '261009_0245_pla_implementacio_onada6.md',
  '261010_1121_prompt_claude_onada10.md',
  '261011_1314_pla_implementacio_ficiv.md',
  '261011_1314_prompt_claude_ficiv.md',
  '261011_1410_pla_implementacio_maquetacio_ficiv.md',
  '261011_1410_prompt_claude_maquetacio_ficiv.md',
  '261012_0025_pla_implementacio_informe_editorial.md',
  '261012_0025_prompt_claude_informe_complet_editorial.md',
  '261012_1143_pla_implementacio_auditoria.md',
  '261012_1405_prompt_claude_gestoria_v2.md',
  '261012_1633_auditoria_claude_gestoria.md',
  '261012_1940_pla_implementacio_gestoria_erp.md',
  '261012_1940_prompt_claude_gestoria_erp.md',
  '261012_2004_prompt_chatgpt_auditor.md',
  '261012_2148_peticio_registre_mestre.md',
  '261012_2245_prompt_claude_refinament.md',
  '261013_1405_prompt_chatgpt_auditor.md',
  '261013_2355_prompt_codex_sanejament_produccio_i_laboratori.md',
  '261014_0130_pla_implementacio_auditoria_gemini4.md',
  '261014_0130_prompt_gemini4_auditoria_adversarial_extrema.md',
  '261014_0210_pla_implementacio_reparacions_xat_i_consola.md',
  '261014_0210_prompt_claude_reparacions_xat_i_consola.md',
  '261014_0400_prompt_claude_gestoria_i_replegament.md',
  '261014_0400_prompt_gemini4_arquitectura_gestoria_i_replegament.md',
  '261014_0425_pla_implementacio_gestoria_i_replegament.md',
  '261016_0015_prompt_gauntlet_claude_codex_gemini.md',
  '261016_0035_acta_marmota_codex_gauntlet.md',
  '261016_1632_auditoria_codex_evidencies/rescat/article-ayudawp_extret.txt',
  '261016_1632_auditoria_codex_evidencies/rescat/lectura_integra.txt'
];

function sha256File(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function sha256Dir(dirPath) {
  const hash = crypto.createHash('sha256');
  const items = fs.readdirSync(dirPath, { recursive: true, withFileTypes: true })
    .filter(item => item.isFile())
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const item of items) {
    const fullPath = path.join(item.parentPath || item.path, item.name);
    hash.update(fs.readFileSync(fullPath));
  }
  return hash.digest('hex');
}

console.log('--- INICIANT EXECUCIÓ DE PODA PER LOTS ---');

const manifest = {
  data_execucio: new Date().toISOString(),
  autoritzat_per: 'Javi Llinares',
  desti_arxiu_fred: ARXIU_FRED_ROOT,
  reubicats: [],
  lot_1a_historic_llast: [],
  sublot_2a_investigacio_ia: []
};

// 1. Lot 1C: Reubicar l'Acta Marmota a 10_actes/
const actaMarmotaSrc = path.join(HISTORIC_DIR, '261016_0035_acta_marmota_codex_gauntlet.md');
const actaMarmotaDst = path.join(ACTES_DIR, '261016_0035_acta_marmota_codex_gauntlet.md');
if (fs.existsSync(actaMarmotaSrc)) {
  const sha = sha256File(actaMarmotaSrc);
  const size = fs.statSync(actaMarmotaSrc).size;
  fs.copyFileSync(actaMarmotaSrc, actaMarmotaDst);
  fs.unlinkSync(actaMarmotaSrc);
  console.log(`[LOT 1C REUBICAT] 261016_0035_acta_marmota_codex_gauntlet.md -> 10_actes/ (${size} B)`);
  manifest.reubicats.push({
    nom: '261016_0035_acta_marmota_codex_gauntlet.md',
    origen: `${CAMINS.arxiuHistoric}/`,
    desti: `${CAMINS.actes}/`,
    sha256: sha,
    bytes: size
  });
}

// 2. Sub-lot 2A: Moure les 14 entrades d'investigació IA
const dest2A = path.join(ARXIU_FRED_ROOT, '02_investigacio_ia');
fs.mkdirSync(dest2A, { recursive: true });

let totalBytes2A = 0;
for (const nom of ENTRADES_2A) {
  const src = path.join(INVESTIGACIO_DIR, nom);
  const dst = path.join(dest2A, nom);
  if (fs.existsSync(src)) {
    const stat = fs.statSync(src);
    let sha = '';
    let size = 0;
    if (stat.isDirectory()) {
      sha = sha256Dir(src);
      size = fs.readdirSync(src, { recursive: true }).reduce((acc, file) => {
        const p = path.join(src, file);
        return acc + (fs.statSync(p).isFile() ? fs.statSync(p).size : 0);
      }, 0);
    } else {
      sha = sha256File(src);
      size = stat.size;
    }
    fs.cpSync(src, dst, { recursive: true });
    fs.rmSync(src, { recursive: true, force: true });
    totalBytes2A += size;
    console.log(`[SUBLOT 2A EVACUAT] ${nom} (${size} B)`);
    manifest.sublot_2a_investigacio_ia.push({ nom, sha256: sha, bytes: size, es_directori: stat.isDirectory() });
  } else {
    console.warn(`[SUBLOT 2A AVÍS] No s'ha trobat: ${nom}`);
  }
}

// 3. Lot 1A: Moure els 134 fitxers de 90_arxiu_historic/
const dest1A = path.join(ARXIU_FRED_ROOT, '90_arxiu_historic_llast');
fs.mkdirSync(dest1A, { recursive: true });

let count1A = 0;
let totalBytes1A = 0;

for (const relPath of FITXERS_ANNEX_B) {
  // Ignorar els de 1B i 1C
  const baseName = path.basename(relPath);
  if (FITXERS_1B.has(baseName) || FITXERS_1C.has(baseName)) {
    continue;
  }

  const src = path.join(HISTORIC_DIR, relPath);
  const dst = path.join(dest1A, relPath);

  if (fs.existsSync(src)) {
    const size = fs.statSync(src).size;
    const sha = sha256File(src);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    fs.unlinkSync(src);
    count1A++;
    totalBytes1A += size;
    manifest.lot_1a_historic_llast.push({ relPath, sha256: sha, bytes: size });
  } else {
    console.warn(`[LOT 1A AVÍS] Ja no existia: ${relPath}`);
  }
}

// Escriure manifest agregat a l'arxiu fred
fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf-8');
console.log(`\n--- PODA EXECUTADA AMB ÈXIT ---`);
console.log(`- Lot 1A evacuat: ${count1A} fitxers (${totalBytes1A} Bytes)`);
console.log(`- Sub-lot 2A evacuat: ${manifest.sublot_2a_investigacio_ia.length} entrades (~${(totalBytes2A / (1024*1024)).toFixed(2)} MB)`);
console.log(`- Lot 1C reubicat: ${manifest.reubicats.length} actes a 10_actes/`);
console.log(`- Manifest de segellat registrat a: ${MANIFEST_FILE}`);
