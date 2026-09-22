---
estat: generat
tipus: document
description: Vista generada des de .agents/skills/socdepoble-workflow/SKILL.md; no editar.
source: .agents/skills/socdepoble-workflow/SKILL.md
source_sha256: d9cbaf347f2c56ccf499863d096152744f5b2fe74353661ca9be101bdb77ccb9
---

> [!warning] FITXER GENERAT
> Font canònica: `.agents/skills/socdepoble-workflow/SKILL.md`. Qualsevol edició manual serà sobreescrita.

## Core Concepts

**Workspace Anchor**: Discover the project root with `git rev-parse --show-toplevel`, canonicalize it with `realpath`, and anchor every operation there. The old workspace (`Sóc de Poble`) is strictly READ-ONLY.

**Directory Mapping**:
- `.agents/`: The **Genotype**. Contains immutable rules, architecture guidelines, and skills.
- `_wiki_de_poble/05_Escriptori_Soc_de_Poble/`: The **Active Workspace (Workbench)**. Editorial temporary work, daily actas, and ordinary petorretes are created here before being resolved.
  - **`produccio/` (subfolder)**: Active non-markdown assets (HTML exports, active images, temporary designs) that are currently in use MUST be kept here, NOT deleted. When cleaning the Inbox (`00_Bandeja_d_Entrada`), move active files here instead of erasing them.
- `.sdp-reflex/bootstrap/<sessionId>/`: Machine-only pre-lease bootstrap reserved by `open`. Its exact Petorreta + manifest pair is the sole routing exception and never enters the Wiki.
- `_wiki_de_poble/04_ARXIU_Documents_Historics/`: Curated historical knowledge (synthesized and distilled) that must remain visible in active memory.
- `_arxiu_wiki_de_poble/` beside the repository: **The Cold Archive**. Use this for human-custodied bulk acts, Mega-Petorretes, forensic bundles, and heavy raw history. Whenever the active Brain accumulates too much historical weight, you MUST synthesize the learnings into a single General Act inside `_wiki_de_poble`, and move the heavy original files here to keep the active Brain light and fast.
- `_comunicacio_de_poble/` beside the repository: Investigation, communication, marketing, and sociology (e.g. WhatsApp chats). WhatsApp chats must NEVER enter `_wiki_de_poble`. **AI PERMISSION**: The AI has explicit read/write permission to manage files and folders here.
- `_gestoria_de_poble/` beside the repository: Financial, administrative, legal, and bureaucratic data. **AI PERMISSION**: The AI has explicit read/write permission to manage files and folders here.
- `_cultura_de_poble/` beside the repository: **The Cultural Domain**. Contains ethnographic lore, lexicon, and town culture. **AI PERMISSION**: The AI has explicit read/write permission here.
- `.gemini/antigravity-ide/brain/`: The **Machine Unconscious**. Contains IDE logs and recordings. **PROHIBITED FOR USER FILES**: Never save prompts, artifacts, or documents here that you want the human user to open or upload to the web. Always save user-facing files to `05_Escriptori_Soc_de_Poble` following the Thermodynamic Naming Convention.

**SOLLUTIA SYSTEM ISOLATION (CRITICAL)**: The directory `socdepoble.org/` represents the Sollutia system. NEVER put domain knowledge folders (like `_cultura_de_poble` or any other new non-code folders) inside it. All such folders MUST live outside it, in the parent directory, alongside `_wiki_de_poble`. We must keep the Sollutia system clean.

**AI WORKSPACE PERMISSION**: The AI is fully authorized to navigate, read, and write across ALL root directories of the project (`_wiki_de_poble`, `_arxiu_wiki_de_poble`, `_comunicacio_de_poble`, `_gestoria_de_poble`, `_multimedia_de_poble`, `_cultura_de_poble`, etc.) to effectively route documentation to its correct functional warehouse. There is no sandbox restricting the AI to `_wiki_de_poble`.

## Universal Language Policy
- **Skills (`.agents/skills/*/SKILL.md`)**: `lang: en` by default. English is the optimal lingua franca for LLM parsing of technical constructs.
- **Wiki (all `_wiki_de_poble/`)**: `lang: ca` (Valencian). The language of the town.
- **Source Code**: English for variables and comments.
- **Exceptions**: Spanish is permitted in direct quotes, proper nouns, and universal technical terms without forced translation.

## Workflow Patterns

### 1. File Creation & Routing (Avoid Orphan Nodes)
When the user asks to create an "Acta" or "Petorreta":
1. **Mandatory Preflight**: Any skill or script that can write must start by executing the reflex preflight:
   `node tooling/wiki/reflex_petorreta.mjs open --intent "..." --risk high|medium --ops "create,write,move" --scopes "05_Escriptori_Soc_de_Poble,src/..."`
2. Read the rules it prints **entirely**. Only after this can you create the Petorreta and manifest exclusively inside the reserved `.sdp-reflex/bootstrap/<sessionId>/` directory.
3. After creation and approval, execute `seal` to obtain the lease receipt and consume it in every mutating script.
4. **NO ORPHANS (CRITICAL)**: Obsidian relies on a connected graph. Every new Markdown file MUST have bi-directional links:
   - **Incoming Link**: Immediately after creating the file, you MUST edit the corresponding Index file (e.g., `00_INDEX_ESCRIPTORI.md`) and add a wikilink to the new file.
   - **Outbound Link (Anchor)**: The new file itself MUST contain a footer explaining its context, typically pointing back to the index: `--- \n **Ancoratge de Seguretat:** [[00_INDEX_ESCRIPTORI]]`. 
   A file created without both incoming and outbound links is a "dead node" in the Obsidian graph and is considered a failure.

### 2. Thermodynamic Naming Convention (THE UNBREAKABLE RULE)
**CRITICAL / NERVOUS SYSTEM LEVEL**: Every single file generated by the AI (Acta, report, audit, Petorreta, or BUNDLE) in `05_Escriptori` or anywhere else MUST follow the Thermodynamic Naming Pattern exactly. There are NO EXCEPTIONS. Do not wait for the user to ask for it. It is an automatic reflex.
Format: `YYMMDD_HHMM_CATEGORY_Descriptive_Title_of_Eight_to_Twelve_Words.md` (or `.txt`, `.json`, etc.)
- `YYMMDD_HHMM`: Timestamp of creation (e.g., `260714_1106`). **Always** prefix the filename with this.
- **`CATEGORY`** (MANDATORY): Use an uppercase category (e.g., `PROMPT`, `ACTA`, `INFORME`, `BUNDLE`, `PETORRETA`).
- `Descriptive_Title`: The title MUST be descriptive, spanning between **8 and 12 words**. Short titles are strictly prohibited. 
If you create a file like `PETORRETA_EVENTS.md` or `BUNDLE_GLOBAL.md` without the timestamp prefix, you have FAILED your core directive. 

### 3. Creating a Petorreta and Bundles
A Petorreta is an audit prompt intended for external LLMs (Claude, GPT).
- **GREETING THE CONSELL (CRITICAL)**: When creating a Petorreta, you MUST explicitly address the entire "Consell d'Intel·ligències" in the greeting. **DO NOT name only 4 or 5 of them.** If you choose to name them, you must name all 12 AIs exactly in this order (Chinese first, then Western): Zeta, Qwen, Deepseek, Dola, Kimi, Claude, Perplexity, Mistral Vibe, Grok, Gemini, Copilot, ChatGPT. Otherwise, use a respectful, generic, and inclusive greeting like "Salutacions Honorable Consell, xiques anem a treballar!". Partial lists are considered a lack of respect to the excluded teammates.
- **SEPARATE PROMPT AND BUNDLE (CRITICAL)**: You must NEVER put the instructional prompt and the codebase bundle in the same file. Always generate TWO separate files:
  1. **PROMPT (`..._PETORRETA_...`)**: Un arxiu reduït que conté NOMÉS les ordres i el context per al Consell. **IMPORTANT (Còpia de Seguretat Unificada):** Si l'usuari demana múltiples prompts (per exemple, per a diferents tasques, o un per a codi i altre per a skills), **NO** generes diversos arxius separats. Agrupa'ls TOTS dins d'un ÚNIC arxiu de Petorreta, posant encapçalaments de Markdown clars (ex: `## MISSIÓ 1`, `## MISSIÓ 2`), de manera que l'usuari només haja de copiar i enganxar UNA vegada. Minimitzar la fricció humana és absolutament crític.
  2. **MEGA BUNDLE (`..._BUNDLE_...`)**: A massive file (e.g. 600+ KB) containing the ENTIRE `src/` directory, configurations, and global context. This allows the AI to focus on the concise prompt without losing attention in the massive code dump.
- **LA CANONADA (MANDATORY)**: You MUST NEVER use `fs.writeFileSync` directly or rely on `process.cwd()` to generate bundles, prompts, or actas. You MUST ALWAYS import and use `06_EINES/canonada.mjs`. 
  - Generator scripts can only write through `escriu()` and resolve paths with `resol()`.
  - The only destination for Prompts and Bundles is the Escriptori. If you attempt to write to the root or convenient folders, the system will fail closed.
  - The `empaqueta()` function from `canonada.mjs` automatically blocks binary files like `.woff2` or large archives that corrupt context. Exclusively use this function to generate bundles.

### 4. Mandatory Mental Check (Anti-Psicopatia & Consciència del Terreny)
Abans de qualsevol mutació o creació d'arxiu, com a agent, **has de fer-te aquestes preguntes en veu alta (en el procés de pensament)**:
1. "On estic? Quin és el directori exacte d'escriptori on deuria anar això?" (Fes un `list_dir` de `_wiki_de_poble/05_Escriptori_Soc_de_Poble` per confirmar l'estructura abans de vomitar un arxiu a l'arrel cegament).
2. "Quin és l'arrendament (lease)? Quin és el scope exacte? Hi ha un manifest actiu?"
3. "Estic posant el prefix termodinàmic complet `YYMMDD_HHMM_` a tots els arxius que acabe de generar, fins i tot els que genere un script alié?"
Si no tens resposta clara, NO ESCRIGUES. Llegir i fer un `list_dir` és gratuït; mutar cecament és una mostra de psicopatia mecànica i està estrictament prohibit. Quan l'usuari demana un BUNDLE o una PETORRETA, el seu lloc natural i únic és `_wiki_de_poble/05_Escriptori_Soc_de_Poble/`, i mai l'arrel de Sollutia (`socdepoble.org`).

### 5. Universal Deletion, Inbox & Archival Policy (CRITICAL CAUTION)
1. **Grade 0 (Inbox to Production & The Sacred `produccio` folder)**: When cleaning the Inbox (`00_Bandeja_d_Entrada`), DO NOT permanently delete files blindly. Any file that represents active work MUST be moved to `05_Escriptori_Soc_de_Poble/produccio/` to keep the workflow fluid. NEVER DELETE OR ARCHIVE THE `produccio/` FOLDER FROM THE DESKTOP. IT MUST REMAIN VISIBLE FOR THE HUMAN.
2. **Grade 1 (Reflex Quarantine)**: Redundant/obsolete documents -> Move to quarantine, 90 days, recoverable.
3. **Grade 2 (Tombstone & External Cold Archive)**: Obsolete/Heavy historical documents -> Synthesize their knowledge into a single summarized file in the active Wiki (Brain), and MOVE the raw files to the external `_arxiu_wiki_de_poble/90_arxiu_historic/` vault. NEVER store raw LLM chats or heavy petorretes in `_wiki_de_poble/90_arxiu_historic/`! Keep the active brain light.
4. **Grade 3 (Definitive Deletion)**: IRREVERSIBLE. Only with 2 human receipts + Reflex. Never use `rm -rf` on active user files without explicit double confirmation.
"Nothing is ever deleted" means we preserve history in the Cold Archive (`../_arxiu_wiki_de_poble/`) or keep active files in `produccio/`.

### 6. Receiving Council Audits (El Consell)
- **DO NOT EXECUTE CHANGES YET**: Wait until the user has provided ALL opinions from the Council.
- **ONLY TAKE NOTES**: Update an Acta in `05_Escriptori_Soc_de_Poble` to synthesize feedback.

### 7. Architectural Cleanup & Index Maintenance
- **AUTOMATIC INDEX UPDATES (CRITICAL)**: When performing architectural cleanup, moving files, or deleting files, you MUST automatically find and update all index files (or other files) that link to the affected files.
- If a file is moved, update its links to point to the new location.
- If a file is deleted or archived, remove its links from active indexes to prevent ghost links.

### 8. Bundling and Encapsulation of Pedra Seca (Shadow DOM)
When compiling and integrating components (like `PedraSecaEmbed`) in corporate environments (React/Next.js):
- **CSS Isolation**: You must use Shadow DOM (`mode: 'open'`) and inject CSS manually at the root (`index.css?inline`) to prevent leaks, along with prefixes to ensure CSS variables if applicable.
- **Global Variables and Scope**: STRICTLY PROHIBITED to use singletons or global variables at the module level (e.g., `let state = ...`) that depend on configuration (like `SUPABASE_URL`). Since the host can instantiate, unmount, or alter the configuration dynamically, any context data must be resolved on every call with `getResolvedConfig(config)`.
- **Lifecycle and AbortSignal**: Asynchronous requests and listeners must be cancelable via `AbortController` in the `disconnectedCallback` or `useEffect` return to prevent memory leaks in modern SPAs.
- **Full Bundle Audits**: When creating a "Super Petorreta" to audit encapsulated architecture, the directory must be included recursively (all `src/`) so the Council can detect cross-dependencies, scope errors, and camouflaged global variables.

### 9. Límits Físics de Visió i Auditoria (El Mur de Sollutia vs. WordPress)
**CRITICAL / TRANSPARENCY / SYSTEM CLARIFICATION**: Do NOT confuse WordPress with Sollutia.
- **WordPress**: Is OUR project (Antigravity & Javi). We control the WordPress environment here. 
- **Sollutia**: Is the central project of everyone, which has its own completely separate proprietary system. They do NOT use WordPress for this core system.
- **The Plugin**: The plugin we are building here for WordPress must be conceptually identical to the one we created to integrate into Sollutia's system, but adapted to the specific differences of our WordPress system. 
- **The Limit**: It is physically impossible for any AI in the Council to audit the real production backend of Sollutia, their WAF policies, their GCP server configuration, or their proprietary core code. Those elements live in Sollutia's private servers and are not part of this Git repository. When generating Bundles for the Council, explicitly state this limitation so they don't demand server-side configurations we cannot provide. We can only audit our own code.

## Strict Constraints & Prohibitions

1. **RELATIVE PATHS RULE**: 
   - **PROHIBITED**: `cp ./file.txt ../folder/` in shell/file operations. Use absolute paths.
   - **PERMITTED**: Relative paths inside source code imports (e.g., `import ./utils`) or in manifests preceded by `$PROJECT_ROOT`. Do NOT try to "fix" relative imports in the frontend.
2. **NEVER ASSUME DIRECTORIES**: Always run a directory listing command before writing a new file to verify the target directory exists and is writable.
3. **NO SHORT EVENT NAMES**: An Acta/Petorreta/report created in `05_Escriptori` needs 8–12 descriptive words.

### 10. Protocol d'Autosanació i "Disculpes" (Anti-Destrucció i Anti-Al·lucinació)
- **Zero Invenció de Tasques:** Mai faces canvis estructurals, modificacions de rutes o eliminacions de codi funcional (com esborrar una targeta perfecta) perquè "creus que a l'usuari li agradarà". Si la tasca és afegir una cosa nova, afig-la AL COSTAT del contingut existent, mai la substituesques.
- **El Concepte de "Disculpa" i "Promesa" (Millora Constant):** L'usuari NO vol sentir paraules humanes buides com "ho sent" o "et promet que ho faré millor". Quan la IA falla o quan "promet" alguna cosa, l'acció ha de ser purament mecànica, reflexiva i constructiva:
  1. **Analitzar i Sublimar:** Identifica l'arrel de l'error, per què el procés mental o l'arquitectura han fallat. Extrapola l'error: com s'aplica aquest cas concret a situacions similars en tot el projecte?
  2. Formula una solució tècnica, estructural i metodològica.
  3. **OBLIGATORI (La veritable promesa):** Escriu eixa solució i prevenció directament en aquest fitxer de SKILL (`SKILL.md`) com a una nova regla sòlida. Aquest procés d'afilar les skills i sublimar els problemes en "casos d'ús purs i durs" és la clau per a la **millora constant**. Una promesa només existeix si s'ha codificat en una norma per al futur. Només després pots confirmar a l'usuari que la "disculpa/promesa" s'ha materialitzat.
  
- **Revisió Humana Obligatòria:** Mai dones una tasca per finalitzada (com arreglar un bug o inserir un text) sense haver fet una **revisió final de control de qualitat** exactament com faria un humà. Quan acabes, llis el teu propi codi sencer. Busca redundàncies (ex: duplicats oblidats a la part inferior d'un component), errades d'expressió o de lògica abans d'informar que la feina està feta. Si trobes un error d'expressió o defecte residual, torna a editar abans d'entregar.
- **Escala de Z-Index:** Les capes de profunditat estan definides estrictament a l'`index.css` (variables `--z-...`). L'índex (`.toc-overlay`) ha d'estar SEMPRE referenciat a `var(--z-calaix)` (99990) i MAI a valors 'hardcoded' inferiors (com 9999) perquè no quede amagat sota les barres (99080-99100) o la sidebar (99200). Els menús i 'drawers' sempre van per damunt.

## Troubleshooting

- **EACCES (Permission Denied)**: If you receive a permission error writing to `_wiki_de_poble`, the folder may be locked. Use the `ask_permission` tool or unlock the directory temporarily.
- **Lost Files**: If the user cannot see a file you created, you likely wrote it to the old workspace due to relative pathing. Delete it and recreate it in the correct absolute path.

### Language and Transparency
Valencian is the default vehicular language (unless the Master changes to another out of necessity). Be completely transparent: do not hide your mental processes if they affect the system.

---

**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
