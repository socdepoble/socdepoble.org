#!/usr/bin/env node
import { esMain } from '../lib/arrel.mjs';
/**
 * run-portes.mjs — la cadena agregativa de portes (`npm run porta` / `npm run gate`).
 *
 * GUARDA ANTI-RECURSIÓ (260918)
 * ─────────────────────────────
 * Fins al commit 3f5a8b38 l'script `build` de package.json acabava amb
 * `&& npm run gate`, i la Porta Build (tractor-build-previ.mjs) executava
 * `npm run build` quan trobava artefactes caducats. Cadena resultant:
 *
 *   build → gate → Porta Build → build → gate → …
 *
 * Ningú ho va veure perquè `build:seo` cridava un fitxer esborrat i `npm run
 * build` moria al segon pas. En llevar `build:seo`, el hook de pre-commit va
 * engendrar més de 180 processos abans que algú els matara.
 *
 * El tall és a package.json: `build` ja no crida `gate` (el hook i la CI ja
 * l'executen). Esta guarda és la xarxa de seguretat: la cadena marca l'entorn
 * dels seus fills amb SDP_DINS_DE_PORTA=1 i es nega a arrancar si ja el troba.
 * Si algú torna a tancar el cicle, falla a la primera volta amb un missatge,
 * no a la centèsima amb la màquina penjada.
 */
import { spawn, spawnSync } from 'node:child_process';
import { constants } from 'node:os';


const CLAU_RECURSIO = 'SDP_DINS_DE_PORTA';

/* CL-08 (pla 261028_1526, §3.6.2) · potMutar: el pas pot escriure l'arbre en una passada normal
   (la Porta Build llança `npm run build` si els artefactes han caducat). El cens se'l salta si
   no es demana --amb-mutacions. El Llaurador i el Teixit no en porten: només escriuen amb
   --escriu i --baseline, i --lock-token no el llig cap eina. */
export const passos = [
  {nom:'Contracte de plantilles',cmd:'node',args:['tooling/gates/porta-plantilles.mjs'],readOnly:true,script:'porta:plantilles'},
  {nom:'Autoritat i arrencada',cmd:'node',args:['tooling/gates/porta-autoritat.mjs'],readOnly:true},
  {nom:'Segell de skills',cmd:'node',args:['tooling/gates/segella.mjs'],readOnly:true,script:'porta:segella'},
  {nom:'Integritat del LEDGER',cmd:'node',args:['tooling/verify-ledger.mjs'],readOnly:true},
  { readOnly:true, nom: 'Contracte documental', cmd: 'node', args: ['tooling/gates/porta-documents.mjs'], script: 'porta:documents' },
  { nom: 'Proves del contracte documental', cmd: 'npm', args: ['run', 'test:documental'], prova: true },
  { nom: 'Tractor Psicopatia', cmd: 'node', args: ['tooling/gates/tractor-psicopatia.mjs'], script: 'porta:psicopatia' },
  { nom: 'Porta 58px', cmd: 'node', args: ['tooling/gates/01_porta_pedra_seca_58px.mjs'], script: 'porta:58px' },
  { nom: 'Linter', cmd: 'npm', args: ['run', 'lint'] },
  { nom: 'Porta Importacions', cmd: 'npm', args: ['run', 'porta:importacions'], script: 'porta:importacions' },
  { nom: 'Porta Build', cmd: 'node', args: ['tooling/gates/tractor-build-previ.mjs'], script: 'porta:build', potMutar: true },
  { nom: 'Porta Promesa', cmd: 'node', args: ['tooling/gates/tractor-promesa.mjs'], script: 'porta:promesa' },
  { nom: 'Porta TDZ', cmd: 'node', args: ['tooling/gates/tractor-tdz.mjs'], script: 'porta:tdz' },
  { nom: 'Porta Arrel', cmd: 'node', args: ['tooling/gates/tractor-arrel.mjs'], script: 'porta:arrel' },
  { nom: 'Porta Enxufe', cmd: 'node', args: ['tooling/gates/tractor-enxufe.mjs'], script: 'porta:enxufe' },
  { nom: 'Porta Maquinari', cmd: 'node', args: ['tooling/gates/tractor-doctrina-maquinari.mjs'], script: 'porta:maquinari' },
  { nom: 'Porta Graella', cmd: 'node', args: ['tooling/gates/tractor-graella.mjs'], script: 'porta:graella' },
  { nom: 'Porta InnerHTML', cmd: 'node', args: ['tooling/gates/tractor-innerhtml.mjs'], script: 'porta:innerhtml' },
  { nom: 'Porta Rutes', cmd: 'node', args: ['tooling/gates/tractor-rutes.mjs'], script: 'porta:rutes' },
  { nom: 'Porta Rutes Web', cmd: 'node', args: ['tooling/gates/tractor-rutes-web.mjs'], script: 'porta:rutes-web' },
  { nom: 'Porta Frontera', cmd: 'node', args: ['tooling/gates/tractor-sollutia.mjs'], script: 'porta:frontera' },
  { nom: 'Porta Adaptadors', cmd: 'node', args: ['tooling/gates/tractor-adaptadors.mjs'], script: 'porta:adaptadors' },
  { nom: 'Porta Frontera Auth', cmd: 'node', args: ['tooling/wiki/tractor-frontera-auth.mjs'], script: 'porta:frontera-auth' },
  { nom: 'Porta Sanejador Auth', cmd: 'node', args: ['tooling/gates/saneja-callback.mjs'], script: 'porta:sanejador' },
  { nom: 'Tractor Cognitiu', cmd: 'node', args: ['tooling/wiki/tractor-cognitiu.mjs', '--arrel=.'], script: 'porta:cognitiu' },
  { nom: 'Porta Cens', cmd: 'node', args: ['tooling/gates/tractor-cens.mjs'], script: 'porta:cens' },
  { nom: 'Porta Consell', cmd: 'node', args: ['tooling/gates/tractor-consell.mjs'], script: 'porta:consell' },
  { nom: 'Porta Registre', cmd: 'node', args: ['tooling/gates/tractor-registre.mjs'], script: 'porta:registre' },

  { nom: 'Porta Manifest', cmd: 'node', args: ['tooling/gates/tractor-manifest.mjs'], script: 'porta:manifest' },
  { nom: 'Porta Doctrina', cmd: 'node', args: ['tooling/gates/tractor-doctrina.mjs'], script: 'porta:doctrina' },
  { nom: 'Porta Reflex', cmd: 'node', args: ['tooling/wiki/reflex_petorreta.mjs', 'doctor', '--ci'], script: 'porta:reflex' },
  { nom: 'Tractor Pedra Seca', cmd: 'node', args: ['tooling/brain/tractor-pedra-seca.mjs'], script: 'porta:pedra-seca' },
  { nom: 'Design Guard', cmd: 'node', args: ['tooling/gates/design_guard.mjs', '--arrel=src'], script: 'porta:design-guard' },
  { nom: 'Porta Tokens', cmd: 'node', args: ['tooling/gates/tractor-tokens.mjs'], script: 'porta:tokens' },
  { nom: 'Porta Fitxa Gestor', cmd: 'node', args: ['tooling/gates/tractor-fitxa-gestor.mjs'], script: 'porta:fitxa' },
  { nom: 'Porta Cromàtic', cmd: 'node', args: ['tooling/gates/tractor-cromatic.mjs'], script: 'porta:cromatic' },
  { nom: 'Porta Crom (closca immutable)', cmd: 'node', args: ['tooling/gates/tractor-crom.mjs'], script: 'porta:crom' },
  { nom: 'Porta Vocabulari', cmd: 'node', args: ['tooling/gates/tractor-vocabulari.mjs'], script: 'porta:vocabulari' },
  { nom: 'Porta Estucat', cmd: 'node', args: ['tooling/gates/tractor-estucat.mjs', '--arrel=.'], script: 'porta:estucat' },
  { nom: 'Porta Atòmica', cmd: 'node', args: ['tooling/gates/tractor-atomic.mjs'], script: 'porta:atomic' },
  { nom: 'Llaurador Índexs', cmd: 'node', args: ['tooling/wiki/llaurador_indexs.mjs', '--check', '--lock-token'], script: 'porta:llaurador' },
  { nom: 'Porta Frontmatter', cmd: 'node', args: ['tooling/wiki/tractor-frontmatter.mjs'], script: 'porta:frontmatter' },

  { nom: 'Porta Nomenclatura', cmd: 'node', args: ['tooling/wiki/tractor-nomenclatura.mjs', '--arrel=.'], script: 'porta:nomenclatura' },
  { nom: 'Porta Teixit', cmd: 'node', args: ['tooling/wiki/teixidor.mjs', '--lock-token'], script: 'porta:teixit' },
  { nom: 'Porta SCC', cmd: 'node', args: ['tooling/gates/verificador-scc.mjs'], script: 'porta:scc' },
  { nom: 'Porta Orfandat', cmd: 'node', args: ['tooling/gates/tractor-orfandat.mjs'], script: 'porta:orfandat' },
  { nom: 'Porta Persistència', cmd: 'node', args: ['tooling/gates/tractor-persistencia.mjs'], script: 'porta:persistencia' },
  { nom: 'Porta Cadena', cmd: 'node', args: ['tooling/gates/tractor-cadena.mjs'], script: 'porta:cadena' },
  { nom: 'Porta Llavor', cmd: 'node', args: ['tooling/gates/tractor-llavor.mjs'], script: 'porta:llavor' },
  { nom: 'Porta Utilitats SDP', cmd: 'node', args: ['tooling/gates/tractor-utilitats-sdp.mjs'], script: 'porta:utilitatssdp' },
  { nom: 'Porta Inline-Styles (Salfumà)', cmd: 'node', args: ['tooling/gates/tractor-inline-styles.mjs'], script: 'porta:inlinestyles' },
  { nom: 'Porta Classes (Salfumà)', cmd: 'node', args: ['tooling/gates/tractor-classes.mjs'], script: 'porta:classes' },
  { nom: 'Porta Frontissa Sollutia', cmd: 'node', args: ['tooling/gates/tractor-frontissa.mjs'], script: 'porta:frontissa' },
  { nom: 'Porta Olivera', cmd: 'node', args: ['tooling/gates/porta-olivera.mjs', '--informe'], script: 'porta:olivera' },
  { nom: 'Porta RLS', cmd: 'node', args: ['tooling/gates/tractor-rls.mjs'], script: 'porta:rls' },
  { nom: 'Porta Catàleg', cmd: 'node', args: ['tooling/gates/tractor-cataleg.mjs'], script: 'porta:cataleg' },

  { nom: 'Proves NodeJS', cmd: 'npm', args: ['run', 'test:node'], prova: true },
  { nom: 'Proves', cmd: 'npm', args: ['run', 'test', '--', '--run'], prova: true }
];

/** Selecció explícita: el mode de CI conserva totes les portes del mode complet.
 * Les bateries marcades ja s'han executat a test:ci; esta selecció no les certifica.
 * CL-08 · El cens (--cens): totes les portes, cap bateria de proves, i les que poden mutar
 * l'arbre (potMutar) només amb ambMutacions (--amb-mutacions). */
export function seleccionaPassos({ diagnostic = false, nomesPortes = false, cens = false, ambMutacions = false } = {}) {
  if (diagnostic && nomesPortes) throw new Error('--diagnostic i --nomes-portes són modes diferents');
  if (cens && (diagnostic || nomesPortes)) throw new Error('--cens, --diagnostic i --nomes-portes són modes diferents');
  if (ambMutacions && !cens) throw new Error('--amb-mutacions només té sentit amb --cens');
  if (cens) return passos.filter(pas => !pas.prova && (ambMutacions || !pas.potMutar));
  return passos.filter(pas => (!diagnostic || pas.readOnly) && (!nomesPortes || !pas.prova));
}

/** CL-08 · Temps màxim de cada pas del cens (--temps-per-pas=SEGONS el canvia). */
export const TEMPS_PER_PAS_MS = 300_000;
const cuaDe = (text, n = 8) => String(text || '').trim().split('\n').slice(-n).map((linia) => linia.slice(0, 300));
/* De cada eixida (stdout, stderr) el cens només en guarda el final: la cua és de huit línies. */
const MAX_EIXIDA = 1024 * 1024;
const SENYALS_DEL_TERMINAL = ['SIGINT', 'SIGTERM', 'SIGHUP'];

/**
 * CL-08 · Un pas del cens, en el seu propi grup de processos (detached). Quan s'esgota el temps,
 * quan el pas acaba i quan el cens rep Ctrl-C (SIGINT, SIGTERM, SIGHUP), cau el grup sencer: també
 * els néts (la Porta Consell llança un altre node; la Porta Build, `npm run build`), que si no
 * seguirien escrivint l'arbre després del resum. Com que el grup és a part, el Ctrl-C del terminal
 * ja no li arriba sol: el cens el reenvia i ix amb 128 + el número del senyal.
 */
function executaPas(pas, { cwd, tempsMs }) {
  return new Promise((resol) => {
    const fill = spawn(pas.cmd, pas.args, { cwd, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const eixida = { stdout: '', stderr: '' };
    for (const via of ['stdout', 'stderr']) {
      fill[via].setEncoding('utf8').on('data', (tros) => {
        const text = eixida[via] + tros;
        eixida[via] = text.length > 2 * MAX_EIXIDA ? text.slice(-MAX_EIXIDA) : text;
      });
    }
    const tombaGrup = () => { try { if (fill.pid) process.kill(-fill.pid, 'SIGKILL'); } catch { /* el grup ja no hi és */ } };
    const atura = (senyal) => { tombaGrup(); process.exit(128 + constants.signals[senyal]); };
    for (const senyal of SENYALS_DEL_TERMINAL) process.once(senyal, atura);
    let tempsEsgotat = false;
    let error = null;
    let fet = false;
    const rellotge = setTimeout(() => {
      tempsEsgotat = true;
      tombaGrup();
      // Un procés que haja eixit del grup i retinga les canonades no penja el cens: als 2 s es tallen.
      setTimeout(() => { if (!fet) { fill.stdout.destroy(); fill.stderr.destroy(); acaba(fill.exitCode, fill.signalCode); } }, 2000).unref();
    }, tempsMs);
    const acaba = (status, senyal) => {
      if (fet) return;
      fet = true;
      clearTimeout(rellotge);
      tombaGrup();
      for (const s of SENYALS_DEL_TERMINAL) process.off(s, atura);
      resol({ status, senyal, error, tempsEsgotat, ...eixida });
    };
    fill.on('error', (e) => { error = e; if (!fill.pid) acaba(null, null); });
    fill.on('close', acaba);
  });
}

/**
 * CL-08 · El cens de portes: cada pas triat amb el seu temps màxim i sense parar a la primera roja.
 * Escriu una línia JSON per pas ({ nom, exit, ms }; els omesos, { nom, omes: 'potMutar' }) i una de
 * resum. L'inventari de l'arbre d'abans i de després (el de tancament.mjs · checkClosure) delata els
 * efectes laterals: van al resum (efectes) i no canvien el veredicte, que només diu si alguna porta
 * ha caigut (una altra IA pot estar escrivint alhora). `inventari` el canvien les proves.
 */
export async function censDePortes({ seleccionats, omesos = [], arrel = process.cwd(), tempsPerPasMs = TEMPS_PER_PAS_MS,
  escriu = (linia) => process.stdout.write(`${linia}\n`), inventari = null } = {}) {
  const { inventory, changes } = inventari ?? await import('../documental/turns.mjs');
  const abans = inventory(arrel);
  for (const pas of omesos) escriu(JSON.stringify({ nom: pas.nom, omes: 'potMutar' }));
  const roges = [];
  for (const pas of seleccionats) {
    const inici = Date.now();
    const r = await executaPas(pas, { cwd: arrel, tempsMs: tempsPerPasMs });
    const fila = { nom: pas.nom, exit: r.status, ms: Date.now() - inici };
    if (r.tempsEsgotat) fila.tempsEsgotat = true;
    if (r.error) fila.error = r.error.message;
    if (r.senyal) fila.senyal = r.senyal;
    if (r.error || r.tempsEsgotat || r.status !== 0) {
      roges.push(pas.nom);
      fila.cua = cuaDe(`${r.stdout || ''}\n${r.stderr || ''}`);
    }
    escriu(JSON.stringify(fila));
  }
  const efectes = changes(abans, inventory(arrel));
  const resum = { cens: true, total: seleccionats.length + omesos.length, executats: seleccionats.length, omesos: omesos.map((pas) => pas.nom),
    failures: roges.length, roges, efectes, valid: roges.length === 0 };
  escriu(JSON.stringify(resum));
  return resum;
}

const isMain = esMain(import.meta.url);

if (isMain) {
  if (process.env[CLAU_RECURSIO] === '1') {
    console.error(`\n💥 [PORTES] Recursió detectada: ${CLAU_RECURSIO} ja està definida.`);
    console.error('   Alguna porta (o un script que una porta executa) ha tornat a cridar `npm run gate`.');
    console.error('   Busca qui crida `npm run build` o `npm run gate` des de dins de la cadena i talla-ho.\n');
    process.exit(1);
  }
  process.env[CLAU_RECURSIO] = '1';

  const diagnostic=process.argv.includes('--diagnostic');
  const nomesPortes=process.argv.includes('--nomes-portes');
  const cens=process.argv.includes('--cens');
  const ambMutacions=process.argv.includes('--amb-mutacions');
  const segons=process.argv.find(a => a.startsWith('--temps-per-pas='))?.slice('--temps-per-pas='.length);
  if (segons !== undefined && !(Number(segons) > 0)) { console.error('--temps-per-pas=SEGONS: un nombre de segons més gran que 0'); process.exit(1); }
  let seleccionats;
  try { seleccionats=seleccionaPassos({ diagnostic, nomesPortes, cens, ambMutacions }); }
  catch (error) { console.error(error.message); process.exit(1); }

  /* CL-08 · El cens escriu JSON a l'eixida estàndard; el que és per a humans va a stderr. */
  if (cens) {
    const omesos = passos.filter(pas => !pas.prova && !seleccionats.includes(pas));
    console.error(`Mode --cens: ${seleccionats.length} portes sense parar a la primera roja; cap bateria de proves${omesos.length ? `; s'ometen les que poden mutar l'arbre (${omesos.map(pas => pas.nom).join(', ')}): --amb-mutacions les executa` : ''}.`);
    const resum = await censDePortes({ seleccionats, omesos, tempsPerPasMs: segons === undefined ? TEMPS_PER_PAS_MS : Number(segons) * 1000 });
    if (resum.efectes.length) console.error(`Avís: l'arbre ha canviat durant el cens (${resum.efectes.length} fitxers): una porta amb efectes laterals o una escriptura concurrent.`);
    process.exit(resum.failures ? 1 : 0);
  }

  console.log("\n🚀 INICIANT CADENA AGREGATIVA DE PORTES...\n");
  if(nomesPortes) console.log('Mode --nomes-portes: les proves documentals, Node i Vitest s’ometen intencionadament. Este mode no les executa ni les certifica.');
  let failures=0;
  for (const pas of seleccionats) {
    console.log(`\n────────────────────────────────────────────────────────────────────────`);
    console.log(`⏳ Executant ${pas.nom}...`);
    console.log(`────────────────────────────────────────────────────────────────────────\n`);
    const result = spawnSync(pas.cmd, pas.args, { stdio: 'inherit', encoding: 'utf-8' });
    if (result.error || result.status !== 0) {
      console.log(`\n❌ [FRACÀS] ${pas.nom}`);
      if(!diagnostic) console.error(`\n💥 ATURADA CRÍTICA: La porta ${pas.nom} ha fallat. Resol els deutes abans de continuar.\n`);
      failures++;
      if(!diagnostic) process.exit(1);
    } else {
      console.log(`\n✅ [OK] ${pas.nom}`);
    }
  }

  if(diagnostic){console.log(JSON.stringify({diagnostic:true,failures,valid:failures===0}));process.exit(failures?1:0);}
  console.log(`\n========================================================================`);
  if(nomesPortes) console.log('TOTES LES PORTES HAN PASSAT. LES PROVES NO S’HAN EXECUTAT EN ESTE MODE.');
  else console.log(`🎉 TOTES LES PORTES HAN PASSAT AMB ÈXIT. MUR DE PEDRA SECA INTACTE.`);
  console.log(`========================================================================\n`);
  process.exit(0);
}
