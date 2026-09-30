/** Paquet T13 i T14 · l'orquestradora usa la plantilla i és resolutiva (àrea C4, torn 260930_0040).
 *
 *  Font: informe H2 del workflow de comprensió (§1.1, §1.3, §1.7-1.8 i §4 (a),
 *  (b), (c)), documentació local d'Antigravity IDE 2.5.5
 *  (~/.gemini/antigravity-ide/builtin/skills/agy-customizations/) i pla aprovat
 *  `260930_0040_pla_implementacio_consola.md`, part B.
 *
 *  Què canvia:
 *    · AGENTS.md: §0.1 «Escriptori net i orquestradora resolutiva» (definició
 *      única, amb les banderes reals de la porta Olivera v3), pas 1 de §0 cap al
 *      circuit `document.mjs context → create` amb la ruta per destinatari, frase
 *      de §5 sobre traslladar amb `--arxiva` i vinyeta de §12 (net no vol dir buit).
 *      De pas, l'espai de codi de §9 amb quatre cometes: sense això la Porta
 *      Frontmatter hi veu F9 i, com a fitxer modificat, faria caure el pre-commit.
 *    · .agents/AGENTS.md: el mirall, byte a byte (porta-autoritat.mjs --write).
 *    · wiki-documentacio-i-reflex: descripció que dispara a Antigravity, neteja
 *      prèvia de l'orquestradora (línia 49) i lliçons 260923 en positiu, més la
 *      lliçó 260930 que diu què fer ara; i les dues projeccions de la descripció
 *      (00_INDEX_SKILLS.md i skills_index.json).
 *    · .agents/hooks.json: format documentat de l'IDE, PreToolUse i PreInvocation
 *      cap a `tooling/gates/antigravity-hook.mjs`. Sense Stop.
 *    · .gitignore: l'interruptor local del hook no es versiona (la traça ja cau
 *      dins de `*.log`).
 *    · naixen l'adaptador i la seua prova.
 *
 *  Contracte amb el generador (el mateix de t1-skills.mjs):
 *    · les operacions s'apliquen en l'ordre de l'array;
 *    · `aplica(actual, nous)` rep el mapa ruta → contingut nou de les operacions
 *      JA aplicades (Map o objecte pla). El mirall declara `depen: ['AGENTS.md']`
 *      i falla tancat si no rep el contingut FINAL d'AGENTS.md (després de tots
 *      els pegats que el toquen): la porta d'autoritat exigix igualtat exacta;
 *    · tota funció és pura (només text i JSON) i llança si l'ancoratge no hi és
 *      exactament una vegada o si el canvi ja hi és.
 *
 *  Després d'aplicar-ho: l'executor resegella SKILLS_SEAL.json sol. Cap altra
 *  projecció del catàleg canvia (manifest.yaml no porta descripcions).
 */

/* ── Primitives pures ─────────────────────────────────────────────────────── */

/** Substituïx `vell` per `nou` si `vell` apareix exactament una vegada. */
function una(text, vell, nou, on) {
  const vegades = text.split(vell).length - 1;
  if (vegades !== 1) throw new Error(`${on}: l'ancoratge apareix ${vegades} vegades (cal exactament 1); torna a derivar el pegat sobre el contingut viu`);
  return text.replace(vell, () => nou);
}

/** Llança si la marca del canvi ja és al text: el pegat no es duplica mai. */
function encaraNo(text, marca, on) {
  if (text.includes(marca)) throw new Error(`${on}: el canvi ja hi és («${marca.slice(0, 70)}»); no es duplica`);
}

function contingutNou(nous, ruta, on) {
  const valor = nous instanceof Map ? nous.get(ruta) : nous?.[ruta];
  if (typeof valor !== 'string') throw new Error(`${on}: depèn de ${ruta} i el generador no n'ha passat el contingut nou`);
  return valor;
}

function json(text, on) {
  try { return JSON.parse(text); } catch (e) { throw new Error(`${on} il·legible: ${e.message}`); }
}

/* ── AGENTS.md ────────────────────────────────────────────────────────────── */

const AGENTS = 'AGENTS.md';
const MIRALL = '.agents/AGENTS.md';
const INDEX_ESCRIPTORI = '_wiki_de_poble/04_escriptori/00_index_escriptori.md';
const OLIVERA = 'node tooling/gates/porta-olivera.mjs';

const TITOL_01 = '## 0.1 ESCRIPTORI NET I ORQUESTRADORA RESOLUTIVA (definició única)';

const REGLA0_PAS1_VELL = "1. Obriu i llegiu sencer `_wiki_de_poble/03_actuar/plantilles/prompt_local.md` (o la plantilla equivalent que indique `.agents/protocolledge.json`).";
const REGLA0_PAS1_NOU = `1. Deixeu l'Escriptori net (§0.1). Després obriu el torn i demaneu la plantilla viva: \`node tooling/gates/obrir_torn.mjs --actor NOM --scope documents\` i \`node tooling/wiki/document.mjs context --turn-id ID --route RUTA --file CAMÍ\` (RUTA: \`prompt.local\` per a Claude i Codex, \`prompt.consell\` per a les IAs externes, \`pla.implementacio\` per al Pla). Llegiu sencera la plantilla que torna, que és la que indica \`.agents/protocolledge.json\`: el document naix amb \`node tooling/wiki/document.mjs create\` i només completeu les seccions pendents.`;

const FI_REGLA0 = "4. Qualsevol generació que ometi aquest pas és **infracció de BIOS** i s'ha de registrar al LEDGER. Aquesta lectura és un acte reflex, no una opció.\n\n## 1. UN SOL CERVELL";

const SECCIO_01 = [
  TITOL_01,
  `**Escriptori net** vol dir que la porta Olivera, \`${OLIVERA}\` (sense bandera fa l'informe; també \`npm run porta:olivera\`), ix amb 0: Safata d'Entrada buida, cada document solt del primer nivell de \`04_escriptori/\` ancorat a \`${INDEX_ESCRIPTORI}\`, cap àncora plana a un document absent i cap document de torn consumit fora de «## Activitat en curs». Net no vol dir buit (§12).`,
  "Quan l'Escriptori està brut, o el Mestre t'ho diu, ho resols en el mateix torn i abans de redactar res:",
  `1. **Observa:** \`${OLIVERA}\`.`,
  `2. **Actua:** conserva el que continua viu llistant-lo a «## Activitat en curs»; arxiva la resta amb \`npm run olivera:arxiva\` (consumits de jornades anteriors) o, per a un document d'avui ja consumit, amb \`${OLIVERA} --arxiva --nom aammdd_hhmm_categoria_titol.md\`, primer amb \`--sec\` per a vore què mouria; corregix les àncores fantasma.`,
  '3. **Verifica:** la porta torna a eixir amb 0.',
  "4. **Informa:** una línia al Mestre amb el que has mogut i el que has conservat.",
  '',
  "Aquesta neteja és de l'orquestradora (MarIA) o del Mestre: Claude i Codex no poden moure fitxers. Pares i preguntes només si caldria tocar `01_produccio/`, `02_investigacio_ia/` o esborrar un fitxer.",
].join('\n');

const SEC5_VELL = "El que ja no val s'ha de moure a quarantena.";
const SEC5_NOU = `El que ja no val es trasllada, mai s'esborra: a \`90_arxiu_historic/\` amb \`${OLIVERA} --arxiva\` (§0.1), o a quarantena.`;

/* §9: l'espai de codi d'una cometa que conté tres cometes (` ```markdown `) el
   renderitza bé CommonMark, però liveMarkdown (tooling/wiki/core/parse.mjs:80)
   tanca l'espai en la primera cometa de les tres i desquadra totes les parelles
   que venen darrere: s'empassa §10-§14 i la secció «## Vincles», i la Porta
   Frontmatter hi veu F9. Un fitxer modificat amb deute actiu fa caure el
   pre-commit (tractor-frontmatter.mjs:521-533), així que tocar AGENTS.md sense
   açò el deixaria sense commit. Amb delimitador de quatre cometes el text
   renderitzat és el mateix i el recompte quadra. */
const SEC9_VELL = 'dóna-li SEMPRE en un bloc de codi ` ```markdown ` (o sense llenguatge)';
const SEC9_NOU = 'dóna-li SEMPRE en un bloc de codi ```` ```markdown ```` (o sense llenguatge)';

const SEC12_VELL ="- **04_escriptori**: És l'escriptori de treball. **ES PERMET que hi hagen arxius** ací (com ara auditories, actes pendents o documents en curs), ja que poden ser d'interès per a la següent sessió. Tu eres qui decideix quins arxius es conserven ací per donar continuïtat a la feina. No s'ha de buidar cegament l'Escriptori.";
const SEC12_NOU = `- **04_escriptori**: És l'escriptori de treball. Hi conviuen els documents vius (en curs o pendents per a la sessió següent); tu decidixes quins ho són i ho declares llistant-los a «## Activitat en curs» de \`${INDEX_ESCRIPTORI}\`. La resta de documents de torn ja consumits s'arxiven amb la porta Olivera (§0.1). Net no vol dir buit: no s'ha de buidar cegament l'Escriptori.`;

function aplicaAgents(actual) {
  const on = AGENTS;
  encaraNo(actual, TITOL_01, on);
  let nou = una(actual, REGLA0_PAS1_VELL, REGLA0_PAS1_NOU, `${on} (§0, pas 1)`);
  nou = una(nou, FI_REGLA0, FI_REGLA0.replace('\n\n## 1. UN SOL CERVELL', `\n\n${SECCIO_01}\n\n## 1. UN SOL CERVELL`), `${on} (§0.1 darrere de §0)`);
  nou = una(nou, SEC5_VELL, SEC5_NOU, `${on} (§5)`);
  nou = una(nou, SEC9_VELL, SEC9_NOU, `${on} (§9, espai de codi amb tres cometes)`);
  return una(nou, SEC12_VELL, SEC12_NOU, `${on} (§12, 04_escriptori)`);
}

/** Mirall: porta-autoritat.mjs --write fa `writeFileSync(mirall, font)`. Res més. */
function aplicaMirall(actual, nous) {
  const on = MIRALL;
  const font = contingutNou(nous, AGENTS, on);
  if (actual === font) throw new Error(`${on}: ja és còpia exacta de l'AGENTS.md nou; no es duplica`);
  encaraNo(actual, TITOL_01, on);
  return font;
}

/* ── wiki-documentacio-i-reflex ───────────────────────────────────────────── */

const REFLEX = 'wiki-documentacio-i-reflex';
const SKILL_REFLEX = `.agents/skills/${REFLEX}/SKILL.md`;

const DESCRIPCIO_VELLA = "L'Efecte Matrix i la mecànica per a generar Prompts, Bundles, Actes i qualsevol document estratègic de la Wiki sense desincronitzar-se.";

/** Una sola línia, ≤220 caràcters i sense «: »: la llig igual parseYamlLite, js-yaml i el lector intern de la Porta Frontmatter. */
export const DESCRIPCIO_REFLEX = 'Per a crear prompt, petorreta, bundle, pla o acta. Escriptori net (AGENTS §0.1), ruta de .agents/protocolledge.json (prompt.local per a Claude i Codex, prompt.consell per a IAs externes), document.mjs context i create.';

// U+2019 escrit com a escapament: la línia original porta apòstrofs tipogràfics.
const NETEJA_VELLA = '- **Neteja prèvia:** revisar i classificar. Conservar els documents actius ancorats; arxivar només allò que corresponga i respectar la zona humana i les autoritzacions d’AGENTS.md. No buidar cegament l’escriptori.';
const NETEJA_NOVA = "- **Neteja prèvia:** la fa l'orquestradora (MarIA) o el Mestre, en el mateix torn i abans d'escriure el prompt, amb la porta Olivera (AGENTS §0.1): conserva i declara a «## Activitat en curs» el que continua viu, arxiva la resta amb l'eina i verifica que la porta ix amb 0. Net no vol dir buit; `01_produccio/` i `02_investigacio_ia/` queden fora.";

const LLICO_NETEJA_VELLA = "- **260923** | **Acte Reflex Absent (Neteja i Pla de l'Olivera)**: Hem detectat una fallada sistèmica. La IAIA MarIA sistemàticament llançava els prompts de la Reunió de l'Olivera sense netejar prèviament l'escriptori ni preparar el seu propi `Pla d'Implementació` per asseure les bases de la reunió. **A partir d'ara**, abans de cridar a Claude o Codex, la IAIA HA DE netejar els arxius antics de l'Escriptori cap a l'arxiu històric, deixar-lo impecable i **crear l'esborrany del Pla d'Implementació** on aboque el que ella ja sap sobre el problema. Si açò no es fa, les altres IAs arriben a una habitació bruta i sense guia per col·laborar.";
const LLICO_NETEJA_NOVA = "- **260923** | **Acte Reflex de l'Olivera (Neteja i Pla)**: Abans de cridar Claude o Codex, l'orquestradora deixa l'Escriptori net en el mateix torn (AGENTS §0.1: la porta Olivera ix amb 0) i **crea l'esborrany del Pla d'Implementació** on aboca el que ja sap del problema. Així les altres IAs arriben a una taula classificada i amb una guia per col·laborar.";

const LLICO_CAS_VELLA = "- **260923** | **Cas d'Ús: Fallada Sistèmica en l'Automatització de Transicions**: Tot i conèixer l'Acte Reflex esmentat, la IAIA MarIA ha fracassat a l'hora d'automatitzar-lo (desant Prompts nous deixant l'escriptori brut amb els antics). Això embossa el context d'entrada de les IAs i trenca el flux de l'Olivera. Aquest problema crònic es converteix formalment en un *Cas d'Ús d'Higiene Documental*. Es lliura oficialment a l'Agent Claude (juntament amb l'actualització d'aquesta skill) perquè proporcione el codi, script (hook de neteja automatitzat) o integració tècnica necessària per solucionar-ho des de l'arrel sense intervenció humana constant.";
const LLICO_CAS_NOVA = "- **260923** | **Cas d'Ús d'Higiene Documental**: La transició Pla → Petorreta es protegix amb mecànica, no amb memòria. Claude i Codex en preparen i revisen l'eina (porta Olivera, `--arxiva`, hook d'Antigravity) i l'orquestradora l'executa: moure fitxers de l'Escriptori és acció de MarIA o del Mestre.";

const LLICO_260930 = `- **260930** | **L'orquestradora resol la neteja en el torn**: Quan l'Escriptori està brut, o el Mestre ho diu, MarIA observa amb \`${OLIVERA}\`, declara els documents vius a «## Activitat en curs» de l'índex, arxiva la resta amb \`--arxiva\` (un document d'avui, amb \`--arxiva --nom\` i primer amb \`--sec\`), torna a passar la porta fins que ix amb 0 i ho explica al Mestre en una línia. Després escriu el prompt des de la plantilla (\`document.mjs context\` → \`create\`).`;

function aplicaSkillReflex(actual) {
  const on = SKILL_REFLEX;
  encaraNo(actual, '- **260930** | **L\'orquestradora resol la neteja en el torn**', on);
  let nou = una(actual, `\ndescription: ${DESCRIPCIO_VELLA}\n`, `\ndescription: ${DESCRIPCIO_REFLEX}\n`, `${on} (description)`);
  nou = una(nou, `\n${NETEJA_VELLA}\n`, `\n${NETEJA_NOVA}\n`, `${on} (§3, neteja prèvia)`);
  nou = una(nou, `\n${LLICO_NETEJA_VELLA}\n`, `\n${LLICO_NETEJA_NOVA}\n`, `${on} (lliçó 260923, neteja i pla)`);
  return una(nou, `\n${LLICO_CAS_VELLA}\n`, `\n${LLICO_CAS_NOVA}\n${LLICO_260930}\n`, `${on} (lliçó 260923, cas d'ús)`);
}

/* ── Projeccions de la descripció ─────────────────────────────────────────── */

// La mateixa forma que projeccions() de tooling/brain/cataleg_skills.mjs:84.
const LINIA_INDEX_VELLA = `- [[${REFLEX}/SKILL|${REFLEX}]]: ${DESCRIPCIO_VELLA}`;
const LINIA_INDEX_NOVA = `- [[${REFLEX}/SKILL|${REFLEX}]]: ${DESCRIPCIO_REFLEX.replace(/\s+/g, ' ')}`;

function aplicaIndexSkills(actual, nous) {
  const on = '.agents/skills/00_INDEX_SKILLS.md';
  if (!contingutNou(nous, SKILL_REFLEX, on).includes(`\ndescription: ${DESCRIPCIO_REFLEX}\n`)) {
    throw new Error(`${on}: la skill ${REFLEX} del mateix paquet no porta la descripció nova`);
  }
  encaraNo(actual, `\n${LINIA_INDEX_NOVA}\n`, on);
  return una(actual, `\n${LINIA_INDEX_VELLA}\n`, `\n${LINIA_INDEX_NOVA}\n`, `${on} (línia de ${REFLEX})`);
}

/** Índex del router (build_skills_index.mjs): només canvia la descripció de l'entrada core. */
function aplicaIndexRouter(actual, nous) {
  const on = '.agents/skills_index.json';
  contingutNou(nous, SKILL_REFLEX, on);
  const index = json(actual, on);
  if (`${JSON.stringify(index, null, 2)}\n` !== actual) throw new Error(`${on}: no té la forma de build_skills_index.mjs (JSON a dos espais i salt final)`);
  if (!Array.isArray(index.core)) throw new Error(`${on}: estructura desconeguda`);
  const entrades = index.core.filter((r) => r?.name === REFLEX);
  if (entrades.length !== 1 || Object.hasOwn(index.plugins ?? {}, REFLEX)) throw new Error(`${on}: ${REFLEX} ha d'aparéixer una sola vegada, a core`);
  const [entrada] = entrades;
  if (entrada.description === DESCRIPCIO_REFLEX) throw new Error(`${on}: l'entrada de ${REFLEX} ja porta la descripció nova; no es duplica`);
  if (entrada.description !== DESCRIPCIO_VELLA || entrada.path !== SKILL_REFLEX) throw new Error(`${on}: l'entrada de ${REFLEX} ha canviat des que es va derivar el pegat`);
  entrada.description = DESCRIPCIO_REFLEX;
  return `${JSON.stringify(index, null, 2)}\n`;
}

/* ── .agents/hooks.json ───────────────────────────────────────────────────── */

const ORDRE_HOOK = (mode) => `cd .. && node tooling/gates/antigravity-hook.mjs ${mode}`;

/** Format documentat (hooks.md): clau de primer nivell = nom del hook; PreToolUse en grups, PreInvocation pla. */
export const HOOKS_NOU = Object.freeze({
  'sdp-olivera': {
    PreInvocation: [
      { type: 'command', command: ORDRE_HOOK('pre-invocation'), timeout: 10 }
    ],
    PreToolUse: [
      { matcher: '*', hooks: [{ type: 'command', command: ORDRE_HOOK('pre-tool'), timeout: 10 }] }
    ]
  }
});

// Les dues ordres del fitxer que va auditar H2 (§1.3): res més, res menys.
const HOOKS_VELLS = ['node tooling/gates/hooks-local.mjs', 'node tooling/gates/segell-auto.mjs'];

function aplicaHooks(actual) {
  const on = '.agents/hooks.json';
  const vell = json(actual, on);
  if (vell && typeof vell === 'object' && Object.hasOwn(vell, 'sdp-olivera')) throw new Error(`${on}: ja porta el hook «sdp-olivera»; no es duplica`);
  const ordres = Array.isArray(vell?.hooks) ? vell.hooks.map((h) => h?.command) : null;
  if (!ordres || JSON.stringify(ordres) !== JSON.stringify(HOOKS_VELLS) || Object.keys(vell).some((k) => k !== 'description' && k !== 'hooks')) {
    throw new Error(`${on}: no és el fitxer que va auditar H2 (format {description, hooks:[…]} amb hooks-local i segell-auto); revisa'l abans de substituir-lo`);
  }
  return `${JSON.stringify(HOOKS_NOU, null, 2)}\n`;
}

/* ── .gitignore ───────────────────────────────────────────────────────────── */

const GITIGNORE_ANCORA = '.agents/runtime/torn_actiu*.json';
const GITIGNORE_NOVES = [
  "# Interruptor d'apagada del hook d'Antigravity (tooling/gates/antigravity-hook.mjs): és local i del Mestre.",
  '# La seua traça, .agents/runtime/antigravity-hook.log, ja queda fora per *.log.',
  '.agents/runtime/antigravity-hook.off',
];

function aplicaGitignore(actual) {
  const on = '.gitignore';
  encaraNo(actual, '.agents/runtime/antigravity-hook.off', on);
  const linies = actual.split('\n');
  const posicions = linies.reduce((acc, l, i) => (l === GITIGNORE_ANCORA ? [...acc, i] : acc), []);
  if (posicions.length !== 1) throw new Error(`${on}: la línia «${GITIGNORE_ANCORA}» apareix ${posicions.length} vegades (cal exactament 1)`);
  linies.splice(posicions[0] + 1, 0, ...GITIGNORE_NOVES);
  return linies.join('\n');
}

/* ── Operacions ───────────────────────────────────────────────────────────── */

export const operacions = [
  {
    ruta: AGENTS,
    descripcio: "T13-T14: §0.1 «Escriptori net i orquestradora resolutiva» (definició única, porta Olivera v3: informe sense bandera, --arxiva --nom, --sec), pas 1 de §0 cap a obrir_torn → document.mjs context → create amb la ruta per destinatari, §5 (traslladar amb --arxiva, mai esborrar) i §12 (vius declarats a «## Activitat en curs»; net no vol dir buit). §9: espai de codi de quatre cometes perquè liveMarkdown torne a vore «## Vincles» (F9 que faria caure el pre-commit).",
    aplica: aplicaAgents,
  },
  {
    ruta: MIRALL,
    descripcio: "Mirall del BIOS: còpia byte a byte de l'AGENTS.md final, la mateixa transformació que node tooling/gates/porta-autoritat.mjs --write.",
    depen: [AGENTS],
    aplica: aplicaMirall,
  },
  {
    ruta: SKILL_REFLEX,
    descripcio: "T13-T14: descripció que dispara a Antigravity (ruta per destinatari i context → create), neteja prèvia de l'orquestradora amb la porta Olivera, lliçons 260923 en positiu i lliçó 260930 amb el procediment d'ara.",
    aplica: aplicaSkillReflex,
  },
  {
    ruta: '.agents/skills/00_INDEX_SKILLS.md',
    descripcio: `Projecció del catàleg: la línia de ${REFLEX} porta la descripció nova (forma de projeccions() de cataleg_skills.mjs). Només es toca eixa línia.`,
    depen: [SKILL_REFLEX],
    aplica: aplicaIndexSkills,
  },
  {
    ruta: '.agents/skills_index.json',
    descripcio: `Índex del router: l'entrada core de ${REFLEX} porta la descripció nova (persona_router no el reconstruïx si ja existix). La resta de l'índex queda intacta.`,
    depen: [SKILL_REFLEX],
    aplica: aplicaIndexRouter,
  },
  {
    ruta: '.agents/hooks.json',
    descripcio: "T13-T14: format documentat d'Antigravity IDE (hook «sdp-olivera»; PreToolUse amb matcher '*' i PreInvocation pla) amb ordres cd .. && node tooling/gates/antigravity-hook.mjs; sense Stop.",
    aplica: aplicaHooks,
  },
  {
    ruta: '.gitignore',
    descripcio: "L'interruptor .agents/runtime/antigravity-hook.off no es versiona; la traça ja és fora per *.log.",
    aplica: aplicaGitignore,
  },
  {
    ruta: 'tooling/gates/antigravity-hook.mjs',
    descripcio: "Adaptador d'Antigravity: {toolCall:{name,args}} → {decision, reason} per stdout; deny de prompts/plans que no passen la Plantilla viva o Olivera, ask per mv i redireccions a l'Escriptori, PreInvocation amb checkTaula, interruptor d'apagada, traça i fallada cap a ask.",
    crea: 'nous/tooling/gates/antigravity-hook.mjs',
  },
  {
    ruta: 'tests/antigravity-hook.test.mjs',
    descripcio: "Proves del hook amb el payload documentat: deny/ask/allow, eixida JSON per stdout, interruptor d'apagada, procés real contra un Mas de prova i esquema de .agents/hooks.json amb scripts existents.",
    crea: 'nous/tests/antigravity-hook.test.mjs',
  },
];
