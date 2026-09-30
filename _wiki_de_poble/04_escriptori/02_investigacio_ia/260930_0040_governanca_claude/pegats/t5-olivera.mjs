/** Paquet T5 · porta Olivera v3 i skill d'higiene de l'Escriptori (àrea C3, torn 260930_0040).
 *
 *  Font: informe H2 del workflow de comprensió (§1.2, §1.4-1.6 i §4 (c) i (d)) i
 *  pla aprovat `260930_0040_pla_implementacio_consola.md`, part B.
 *
 *  Què canvia:
 *    · tooling/gates/porta-olivera.mjs (substitució sencera, amb base): viu per
 *      declaració a «## Activitat en curs»; `checkTaula()` separat de
 *      `checkOlivera()`; secció 0 amb «Abans de generar» o «Preflight»; `--arxiva
 *      --nom` (repetible) i `--sec`; mode hook només amb `--hook`; informe que
 *      llista els vius i diu que els fantasmes fan caure la porta.
 *    · la skill `core-higiene-escriptori`, reescrita sencera, i les dues
 *      projeccions que en copien la descripció i els disparadors
 *      (`00_INDEX_SKILLS.md` i `skills_index.json`), pegades per ancoratge.
 *    · les proves que entren amb el codi: `tractor-fortification` passa `--hook` i
 *      naix `porta-olivera-v3`.
 *
 *  Contracte del laboratori: cap import relatiu del repo; cada `aplica` és pura,
 *  falla tancada si l'ancoratge no hi és exactament una vegada i llança si el canvi
 *  ja hi és, en compte de duplicar-lo.
 */
import { createHash } from 'node:crypto';

const sha = (text) => createHash('sha256').update(text).digest('hex');

/** Substituïx `vell` per `nou` si `vell` apareix exactament una vegada. */
function una(text, vell, nou, on) {
  const vegades = text.split(vell).length - 1;
  if (vegades !== 1) throw new Error(`${on}: l'ancoratge apareix ${vegades} vegades (cal exactament 1); torna a derivar el pegat sobre el contingut viu`);
  return text.replace(vell, () => nou);
}

/* ── Skill ────────────────────────────────────────────────────────────────── */

const SKILL = 'core-higiene-escriptori';

/** sha256 de la skill instal·lada de la qual es deriva la reescriptura (la mateixa que segella SKILLS_SEAL). */
const SKILL_BASE = '4bdae3f8bb66d36c628b78e33fbb5224d68c53dcbe9b2cccc197b7f4bf2a749b';

const DESCRIPCIO_VELLA = "Tractor cognitiu que obliga a mantindre l'Escriptori (04_escriptori) net abans d'iniciar noves tasques o petorretes.";
const DISPARADORS_VELLS = ['classificacio de documents de treball'];

/** Una sola línia i ≤220 caràcters: la llig igual parseYamlLite, js-yaml i el parser mínim de la Consola. */
const DESCRIPCIO = "Usa-la abans de crear un prompt, una petorreta, un pla o una auditoria, i quan l'Escriptori estiga brut o el Mestre demane netejar-lo. L'orquestradora el neteja en el mateix torn amb la porta Olivera.";

const DISPARADORS = Object.freeze([
  'petorreta',
  'prompt per a',
  'crear prompt',
  "pla d'implementació",
  'escriptori brut',
  'escriptori net',
  "neteja l'escriptori",
  'higiene',
  'classificacio de documents de treball'
]);

const SKILL_NOVA = [
  '---',
  'type: skill',
  `name: ${SKILL}`,
  `description: ${DESCRIPCIO}`,
  'status: actiu',
  'tags: [govern]',
  'triggers_on:',
  ...DISPARADORS.map((d) => `  - ${d}`),
  'version: 3.1.0',
  '---',
  '',
  "# Higiene de l'Escriptori",
  '',
  "Definició única (AGENTS §0.1): l'Escriptori està net quan `npm run porta:olivera` ix amb 0. Vol dir Safata d'Entrada buida, cada document solt del primer nivell ancorat a `00_index_escriptori.md`, cap àncora a un document absent i cap document de torn consumit fora de «## Activitat en curs». Net no vol dir buit (AGENTS §12).",
  '',
  '## Qui la fa',
  '',
  "L'orquestradora (MarIA) o el Mestre. Claude i Codex no poden moure fitxers. La neteja es fa abans d'escriure el prompt o el pla, no dins del prompt.",
  '',
  '## Procediment: observa → actua → verifica → informa',
  '',
  '1. **Observa:** `npm run porta:olivera`. És el mode informe: no llig stdin ni mou res. El mode hook necessita `--hook` i un payload.',
  "2. **Decidix el que viu:** tot document que ha de continuar s'ancora a `00_index_escriptori.md` davall d'una capçalera `## Activitat en curs`. La porta el conserva siga del dia que siga, i l'informe llista els declarats vius.",
  '3. **Actua:**',
  '   - Consumits de jornades anteriors: `npm run olivera:arxiva`.',
  "   - Consumits d'avui: `node tooling/gates/porta-olivera.mjs --arxiva --nom FITXER.md`, primer amb `--sec` per a vore què mouria. Per nom només ixen documents solts del primer nivell amb categoria de torn.",
  '   - Amb rebut de torn: després del trasllat, `node tooling/wiki/document.mjs handoff --turn-id ID --file ORIGEN --to DESTÍ`.',
  "   - Àncores a documents absents (`- [[nom]]` sense `/` que no és a la taula): si el document és a l'arxiu, lleva la línia; si viu en una subcarpeta, escriu `[[02_investigacio_ia/nom]]`; si és una acta, `[[../10_actes/nom]]`.",
  "   - Safata d'Entrada: classifica o arxiva cada element fins que quede buida.",
  '4. **Verifica:** `npm run porta:olivera` ix amb 0 i `npm run porta:orfandat` no puja orfes.',
  '5. **Informa:** una línia al Mestre amb el que has mogut, el que has conservat i per què.',
  '',
  '## Límits',
  '',
  "`01_produccio/` i `02_investigacio_ia/` queden fora: la porta només veu el primer nivell de l'Escriptori. `--arxiva` trasllada i mai sobreescriu ni esborra. Pares i preguntes al Mestre només si caldria tocar `01_produccio/` o `02_investigacio_ia/`, esborrar un fitxer, o si la mateixa acció falla dues vegades (AGENTS §10).",
  '',
  '## Lliçons del Mestre',
  '',
  "- **260929 · La neteja és acció de l'orquestradora.** Quan l'Escriptori està brut, MarIA l'arxiva amb la porta, verifica el verd i després escriu el prompt.",
  "- **260924 · Arxivar i despenjar l'àncora són un sol acte.** `--arxiva` fa les dues coses en la mateixa passada.",
  "- **260924 · Una àncora pot ser l'únic fil que sosté un document.** Abans de llevar-la, mira on viu el fitxer.",
  '',
  '## Vincles',
  '- [[00_INDEX_SKILLS]]',
  ''
].join('\n');

/* ── Projeccions de la descripció ─────────────────────────────────────────── */

// La mateixa forma que `projeccions()` de tooling/brain/cataleg_skills.mjs.
const LINIA_INDEX_VELLA = `- [[${SKILL}/SKILL|${SKILL}]]: ${DESCRIPCIO_VELLA}`;
const LINIA_INDEX_NOVA = `- [[${SKILL}/SKILL|${SKILL}]]: ${DESCRIPCIO.replace(/\s+/g, ' ')}`;

/* ── Proves que entren amb el codi ────────────────────────────────────────── */

const FORTIFICACIO_VELLA = "const run=spawnSync(process.execPath,[path.join(REPO,'tooling/gates/porta-olivera.mjs')],{cwd:root,env:{...process.env,SDP_ARREL:root},input:'{',encoding:'utf8'});";
const FORTIFICACIO_NOVA = "const run=spawnSync(process.execPath,[path.join(REPO,'tooling/gates/porta-olivera.mjs'),'--hook'],{cwd:root,env:{...process.env,SDP_ARREL:root},input:'{',encoding:'utf8'});";

/* ── Operacions ───────────────────────────────────────────────────────────── */

export const operacions = [
  {
    ruta: 'tooling/gates/porta-olivera.mjs',
    descripcio: "Porta Olivera v3: viu per declaració a «## Activitat en curs», checkTaula() separat de checkOlivera(), secció 0 «Abans de generar» o «Preflight», --arxiva --nom/--sec amb rebuig de subcarpetes i categories no transitòries, mode hook només amb --hook i informe que llista els vius i jutja la taula.",
    substituix: 'nous/tooling/gates/porta-olivera.mjs',
    base: '09fc4ffc57405f5696e5916c758b5384e32f08a03d0475239c48f6c33665a5f5'
  },
  {
    ruta: 'tests/porta-olivera-v3.test.mjs',
    descripcio: 'Proves de la porta v3: viu declarat, informe sense pla de hui, Safata, --arxiva --nom --sec, rebuigs, banderes, «0. Preflight», stdin obert sense bandera, --hook fail-closed i API conservada.',
    crea: 'nous/tests/porta-olivera-v3.test.mjs'
  },
  {
    ruta: 'tests/tractor-fortification.test.mjs',
    descripcio: "La invocació del binari amb payload corrupte passa --hook: sense bandera la porta ja no llig stdin. Pegat d'una línia per ancoratge perquè altres àrees poden tocar el mateix fitxer.",
    aplica: (actual) => {
      if (actual.includes(FORTIFICACIO_NOVA)) throw new Error('tests/tractor-fortification.test.mjs: la invocació ja passa --hook; no es duplica');
      return una(actual, FORTIFICACIO_VELLA, FORTIFICACIO_NOVA, 'tests/tractor-fortification.test.mjs (invocació en mode hook)');
    }
  },
  {
    ruta: `.agents/skills/${SKILL}/SKILL.md`,
    descripcio: "Skill d'higiene v3.1.0: descripció que dispara amb prompt, petorreta, pla i Escriptori brut; triggers_on nous; procediment observa → actua → verifica → informa amb la porta v3; qui la fa (l'orquestradora o el Mestre); lliçó 260929 en positiu.",
    aplica: (actual) => {
      if (actual === SKILL_NOVA) throw new Error(`${SKILL}/SKILL.md: la reescriptura ja hi és aplicada; no es duplica`);
      const viu = sha(actual);
      if (viu !== SKILL_BASE) {
        throw new Error(`${SKILL}/SKILL.md ha canviat des que es va derivar el pegat (sha ${viu.slice(0, 12)}… en lloc de ${SKILL_BASE.slice(0, 12)}…). És una reescriptura sencera i no fusiona a cegues: torna a derivar-la sobre el contingut viu.`);
      }
      return SKILL_NOVA;
    }
  },
  {
    ruta: '.agents/skills/00_INDEX_SKILLS.md',
    descripcio: 'Projecció del catàleg: la línia de core-higiene-escriptori porta la descripció nova (mateixa forma que projeccions() de cataleg_skills.mjs). Només es toca eixa línia.',
    aplica: (actual) => {
      if (actual.includes(`\n${LINIA_INDEX_NOVA}\n`)) throw new Error('00_INDEX_SKILLS.md: la línia nova de core-higiene-escriptori ja hi és; no es duplica');
      return una(actual, `\n${LINIA_INDEX_VELLA}\n`, `\n${LINIA_INDEX_NOVA}\n`, '00_INDEX_SKILLS.md (línia de core-higiene-escriptori)');
    }
  },
  {
    ruta: '.agents/skills_index.json',
    descripcio: "Índex del router: l'entrada de core-higiene-escriptori porta la descripció i els disparadors nous (persona_router no el reconstruïx si ja existix). La resta de l'índex queda intacta.",
    aplica: (actual) => {
      let index;
      try { index = JSON.parse(actual); } catch (e) { throw new Error(`.agents/skills_index.json il·legible: ${e.message}`); }
      if (`${JSON.stringify(index, null, 2)}\n` !== actual) {
        throw new Error('.agents/skills_index.json no té la forma de build_skills_index.mjs (JSON a dos espais i salt final): no es reescriu per no tocar res més');
      }
      if ((index.core || []).some((s) => s?.name === SKILL)) throw new Error(`.agents/skills_index.json: ${SKILL} apareix a core; no es pega a cegues`);
      const entrada = index.plugins?.[SKILL];
      if (!entrada) throw new Error(`.agents/skills_index.json: falta plugins['${SKILL}']`);
      const disparadors = JSON.stringify(entrada.triggers_on);
      if (entrada.description === DESCRIPCIO && disparadors === JSON.stringify(DISPARADORS)) {
        throw new Error(`.agents/skills_index.json: l'entrada de ${SKILL} ja porta la descripció i els disparadors nous; no es duplica`);
      }
      if (entrada.description !== DESCRIPCIO_VELLA || disparadors !== JSON.stringify(DISPARADORS_VELLS)) {
        throw new Error(`.agents/skills_index.json: l'entrada de ${SKILL} ha canviat des que es va derivar el pegat; torna a derivar-lo`);
      }
      index.plugins[SKILL] = { name: entrada.name, path: entrada.path, description: DESCRIPCIO, triggers_on: [...DISPARADORS] };
      return `${JSON.stringify(index, null, 2)}\n`;
    }
  }
];
