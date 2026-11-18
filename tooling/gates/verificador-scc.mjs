import { CAMINS, MARCADOR, esMain } from '../lib/arrel.mjs';
import { extractDocumentLinks, resolveDocumentLink, prepareDocumentWebLinks } from '../lib/document-links.mjs';
import { canonical, inside } from '../documental/core.mjs';
import { lstatSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { readdir, readFile, stat, lstat } from 'node:fs/promises';
import { join, resolve, extname, relative, basename, dirname, isAbsolute, sep } from 'node:path';

/* ── D-R30-14 (aprovada pel Mestre el 16-11-2026 a les 14:32) · Enllaços vius cap a l'arxiu històric ──
   Des de D-R27-4, CAMINS.arxiuHistoric no es versiona (.gitignore) i els documents vius l'enllacen
   (l'índex de l'Escriptori, el Llibre Mestre, les actes, els enllaços que reescriu la porta Olivera).
   Fora del hook, el resolutor ja els troba al disc. Dins del hook, git-staged.mjs materialitza l'índex
   en un temporal (read-tree) que només porta l'arxiu versionat abans de D-R27-4: la resta hi falta.
   Regla: un enllaç a l'arxiu és vàlid si el seu destí existix al disc local; dins de l'arbre preparat,
   eixe disc és el de l'ARREL VIVA, que no s'accepta per una variable sola, sinó per procedència:
     · només amb SDP_PRE_COMMIT=1 (el marca git-staged.mjs);
     · l'arbre preparat manlleva el magatzem d'objectes de l'arrel viva: la línia única del seu
       .git/objects/info/alternates (l'escriu git-staged.mjs) és el directori d'objectes comú del
       repositori viu (.git carpeta, o fitxer «gitdir:» de worktree més commondir);
     · l'arrel viva porta el marcador del Mas (MARCADOR) i no és l'arbre preparat mateix.
   L'arrel viva és SDP_ARREL_VIVA si existix (absoluta; la mateixa prova de procedència) i, si no, l'arbre
   principal d'eixe magatzem (el pare de «.git/objects»). Del destí només es mira l'existència: lstat de
   fitxer regular, sense symlink final i amb el camí canònic dins de l'arxiu viu. No s'obri cap document
   ni es llista cap carpeta de l'arxiu (AGENTS §5): un nom sol sense camí no es busca mai a l'arxiu, i un
   destí absent, ambigu o fora de l'arxiu continua sent LINK_INVALID, ara amb el motiu. */
const ALTERNATES = '.git/objects/info/alternates';
/* R32 · D-R30-14-bis · La mateixa regla per a l'altra zona local ignorada per Git: la zona humana
   01_produccio de l'Escriptori (ignorada des de D-R27-4). Del destí només es mira l'existència al disc de
   l'arrel viva; mai no s'obri ni es llista res de la zona humana. */
const ZONES_LOCALS = Object.freeze([CAMINS.arxiuHistoric, `${CAMINS.escriptori}/01_produccio`]);
const zonaLocalDe = (rel) => ZONES_LOCALS.find((zona) => rel.startsWith(`${zona}/`)) ?? null;

const esFitxer = (abs) => { try { return statSync(abs).isFile(); } catch { return false; } };
const posix = (rel) => rel.split(sep).join('/');

/** Directori d'objectes comú (canònic) del repositori Git de `arrel`, o null si no se'n pot acreditar cap. */
export function magatzemGit(arrel) {
  const punt = join(arrel, '.git');
  let gitdir;
  try {
    const st = lstatSync(punt);
    if (st.isDirectory()) gitdir = punt;
    else if (st.isFile()) {
      const m = /^gitdir:[ \t]*(.+?)[ \t]*$/m.exec(readFileSync(punt, 'utf8'));
      if (!m) return null;
      gitdir = resolve(arrel, m[1]);
    } else return null;
  } catch { return null; }
  let comu = gitdir;
  try { comu = resolve(gitdir, readFileSync(join(gitdir, 'commondir'), 'utf8').trim()); }
  catch (e) { if (e.code !== 'ENOENT') return null; }
  try { return realpathSync(join(comu, 'objects')); } catch { return null; }
}

/** L'arrel viva de l'arbre preparat del hook: { cami, motiu }. Sense procedència acreditada, cami és null i motiu diu per què. */
export function arrelVivaDelHook(arrel, env = process.env) {
  const no = (motiu) => ({ cami: null, motiu });
  if (env.SDP_PRE_COMMIT !== '1') return no("fora de l'arbre preparat del pre-commit (SDP_PRE_COMMIT no és 1)");
  let linies;
  try { linies = readFileSync(join(arrel, ALTERNATES), 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')); }
  catch { return no(`l'arbre preparat no porta ${ALTERNATES}`); }
  if (linies.length !== 1) return no(`${ALTERNATES} ha de tindre una sola línia i en té ${linies.length}`);
  let objectes;
  try { objectes = realpathSync(resolve(arrel, '.git/objects', linies[0])); }
  catch { return no(`el magatzem d'objectes de ${ALTERNATES} no existix`); }
  const demanada = env.SDP_ARREL_VIVA;
  if (demanada && !isAbsolute(demanada)) return no('SDP_ARREL_VIVA ha de ser un camí absolut');
  const candidata = demanada || (basename(dirname(objectes)) === '.git' ? dirname(dirname(objectes)) : null);
  if (!candidata) return no("el magatzem d'objectes no és el d'un arbre de treball (.git/objects) i no hi ha SDP_ARREL_VIVA");
  let viva;
  try { viva = realpathSync(candidata); } catch { return no(`l'arrel viva ${candidata} no existix`); }
  let preparada;
  try { preparada = canonical(arrel); } catch { return no("no es pot canonicalitzar l'arbre preparat"); }
  if (viva === preparada) return no("l'arrel viva és l'arbre preparat mateix");
  try { const st = lstatSync(join(viva, MARCADOR)); if (!st.isFile() || st.isSymbolicLink()) throw new Error('no regular'); }
  catch { return no(`${viva} no porta el marcador ${MARCADOR}`); }
  const propi = magatzemGit(viva);
  if (propi !== objectes) return no(`l'arbre preparat no manlleva el magatzem d'objectes de ${viva} (${propi ?? 'il·legible'} ≠ ${objectes})`);
  return { cami: viva, motiu: null };
}

export class VerificadorSCC {
  constructor(wikiRoot, { env = process.env } = {}) {
    this.wikiRoot = resolve(wikiRoot);
    this.env = env;

    // Configuració de límits
    this.INBOX_MAX_FILES = 20;
    this.INBOX_DIR = '_wiki_de_poble/04_escriptori/00_bandeja_d_entrada';
    this.ESCRIPTORI_DIR = '_wiki_de_poble/04_escriptori';

    // Resultats
    this.graph = new Map(); // AbsolutePath -> Set<AbsolutePath>
    this.errors = [];
    // D-R30-14: arrel viva (memo per auditoria) i enllaços a l'arxiu acceptats des d'ella.
    this.viva = null;
    this.arxiuAcceptats = 0;
    this.webLinks = null;
  }

  /** D-R30-14 · L'arrel viva, calculada una sola vegada per auditoria. */
  arrelViva() {
    this.viva ??= arrelVivaDelHook(this.wikiRoot, this.env);
    return this.viva;
  }

  /** D-R30-14 · `abs` (dins de l'arbre auditat) cau a l'arxiu històric i hi existix al disc de l'arrel viva. */
  fitxerArxivatViu(abs) {
    const rel = posix(relative(this.wikiRoot, abs));
    const zona = zonaLocalDe(rel);
    if (!zona) return false;
    const { cami } = this.arrelViva();
    if (!cami) return false;
    const desti = join(cami, rel);
    try {
      const st = lstatSync(desti);
      if (!st.isFile() || st.isSymbolicLink()) return false;
      return inside(realpathSync(join(cami, zona)), realpathSync(desti));
    } catch { return false; }
  }

  /**
   * D-R30-14 · El resolutor de sempre amb l'arxiu de l'arrel viva superposat (només comprova existència).
   * null: l'enllaç no toca l'arxiu i l'error és el de sempre · { cami }: acceptat · { motiu, ambigu? }: toca l'arxiu i no
   * s'accepta (ambigu: més d'un destí, com el veuria el resolutor amb l'arxiu present). Replica les regles de camí de
   * resolveDocumentLink; els noms sols (sense carpeta) no es busquen mai a l'arxiu.
   */
  destiArxiuHistoric(link, source) {
    let t;
    try { t = decodeURIComponent(link.target); } catch { return null; }
    const root = this.wikiRoot;
    // Fora de l'arrel (també per symlink): l'error de sempre, sense rescat ni cap consulta al disc.
    const dinsDeLArrel = (abs) => { try { return inside(root, abs) && inside(canonical(root), canonical(abs)); } catch { return false; } };
    const existeix = (abs) => esFitxer(abs) || this.fitxerArxivatViu(abs);
    const relatiu = t.startsWith('./') || t.startsWith('../');
    if (link.kind === 'wiki' && !extname(t)) {
      const exacte = relatiu ? resolve(dirname(source), t) : null;
      if (exacte && !dinsDeLArrel(exacte)) return null;
      if (!(exacte && existeix(exacte))) t += '.md';
    }
    let candidats;
    if (link.kind === 'markdown' || relatiu) candidats = [resolve(dirname(source), t)];
    else if (t.includes('/')) candidats = [...new Set([resolve(root, t), resolve(root, CAMINS.wiki, t), resolve(dirname(source), t)])];
    else return null;
    if (!candidats.some((abs) => zonaLocalDe(posix(relative(root, abs))))) return null;
    if (!candidats.every(dinsDeLArrel)) return null;
    const trobats = candidats.filter(existeix);
    if (trobats.length > 1) return { ambigu: true, desti: t, motiu: "més d'un destí comptant l'arxiu del disc local" };
    // Un sol destí a l'arbre auditat ja l'hauria trobat el resolutor: ací només es rescata el de l'arrel viva.
    if (trobats.length === 1) return !esFitxer(trobats[0]) && this.fitxerArxivatViu(trobats[0]) ? { cami: trobats[0] } : null;
    if (this.env.SDP_PRE_COMMIT !== '1') return { motiu: "el destí no existix a l'arxiu del disc local" };
    const viva = this.arrelViva();
    if (!viva.cami) return { motiu: `arrel viva no acreditada (${viva.motiu})` };
    return { motiu: `el destí no és cap fitxer regular (sense symlink) de l'arxiu de l'arrel viva ${viva.cami}` };
  }

  /** Llig recursivament totes les carpetes */
  async getAllMarkdownFiles(dirPath) {
    const files = [];
    try {
      const items = await readdir(dirPath);
      for (const item of items) {
        // Excepte carpetes ocultes, de sistema i ignorades per SCC
        if (
          item.startsWith('.') || (dirPath === this.wikiRoot && ['var', 'dist-natiu'].includes(item)) || 
          ['node_modules', 'dist', 'src', 'scratch', 'supabase', '_templates', 'scripts', 'public', '90_arxiu_historic', '90_arxiu_historic'].includes(item)
        ) continue;
        
        const itemPath = join(dirPath, item);
        const stats = await lstat(itemPath);
        if (stats.isSymbolicLink()) { this.errors.push({code:'SCC_SYMLINK',message:'Symlink no auditat',affected_files:[relative(this.wikiRoot,itemPath)]}); continue; }
        if (stats.isDirectory()) {
           files.push(...await this.getAllMarkdownFiles(itemPath));
        } else if (stats.isFile() && extname(itemPath) === '.md') {
           files.push(itemPath);
        }
      }
    } catch (e) { this.errors.push({code:'SCC_IO',message:e.message,affected_files:[relative(this.wikiRoot,dirPath)]}); }
    return files;
  }

  /** Llig recursivament els fitxers JSX de la carpeta src/ */
  async getAllJsxFiles(dirPath) {
    const files = [];
    try {
      const items = await readdir(dirPath);
      for (const item of items) {
        if (item.startsWith('.') || ['node_modules', 'dist'].includes(item)) continue;
        
        const itemPath = join(dirPath, item);
        const stats = await lstat(itemPath);
        if (stats.isSymbolicLink()) { this.errors.push({code:'SCC_SYMLINK',message:'Symlink no auditat',affected_files:[relative(this.wikiRoot,itemPath)]}); continue; }
        if (stats.isDirectory()) {
           files.push(...await this.getAllJsxFiles(itemPath));
        } else if (stats.isFile() && (extname(itemPath) === '.jsx' || extname(itemPath) === '.tsx')) {
           files.push(itemPath);
        }
      }
    } catch (e) { if (e.code !== 'ENOENT') this.errors.push({code:'SCC_IO',message:e.message,affected_files:[relative(this.wikiRoot,dirPath)]}); }
    return files;
  }

  /** Extreu enllaços d'Obsidian (wikilinks i markdown) ignorant blocs de codi */
  extractLinks(content) {
    return extractDocumentLinks(content);
  }

  resolveLink(link, allFiles, source) {
    const invalid = (message) => { this.errors.push({code:'LINK_INVALID', message, affected_files:[relative(this.wikiRoot,source)]}); return null; };
    const ambigu = (arxiu) => invalid(`Enllaç ambigu: ${arxiu.desti} · arxiu històric (D-R30-14): ${arxiu.motiu}`);
    let trobat;
    try { trobat = resolveDocumentLink(link, source, allFiles, this.wikiRoot, { webLinks: this.webLinks }); }
    catch (e) {
      // D-R30-14: un destí de l'arxiu històric que existix al disc de l'arrel viva és vàlid (només existència).
      const arxiu = this.destiArxiuHistoric(link, source);
      if (arxiu?.cami) { this.arxiuAcceptats += 1; return arxiu.cami; }
      if (arxiu?.ambigu) return ambigu(arxiu);
      return invalid(arxiu?.motiu ? `${e.message} · arxiu històric (D-R30-14): ${arxiu.motiu}` : e.message);
    }
    // D-R30-14: dins del hook, un homònim que només és a l'arxiu viu fa ambigu l'enllaç, com el veuria el resolutor fora del hook.
    if (this.env.SDP_PRE_COMMIT === '1') {
      const arxiu = this.destiArxiuHistoric(link, source);
      if (arxiu?.ambigu) return ambigu(arxiu);
    }
    return trobat;
  }

  /** 1. Escriptori Zero: Límit absolut de la Bandeja d'Entrada */
  async verifyInboxLimit() {
    const inboxPath = join(this.wikiRoot, this.INBOX_DIR);
    try {
      const items = await readdir(inboxPath);
      let fileCount = 0;
      for (const item of items) {
        if (item.startsWith('.')) continue;
        const s = await stat(join(inboxPath, item));
        if (s.isFile()) fileCount++;
      }
      
      if (fileCount > this.INBOX_MAX_FILES) {
        this.errors.push({
          code: "INBOX_LIMIT_EXCEEDED",
          message: `La safata d'entrada conté ${fileCount} fitxers, superant el límit estricte de ${this.INBOX_MAX_FILES}.`,
          current_count: fileCount,
          limit: this.INBOX_MAX_FILES,
          affected_files: [this.INBOX_DIR]
        });
      }
    } catch (e) { if (e.code !== 'ENOENT') this.errors.push({code:'SCC_IO',message:e.message,affected_files:[this.INBOX_DIR]}); }
  }

  /** 2. Ancoratge: Cada fitxer a l'Escriptori ha d'estar a 00_index_escriptori.md */
  async verifyEscriptoriAnchoring(allFiles) {
    const escriptoriRoot = join(this.wikiRoot, this.ESCRIPTORI_DIR);
    const indexEscriptoriPath = join(escriptoriRoot, '00_index_escriptori.md');
    
    let indexContent = "";
    try {
      indexContent = await readFile(indexEscriptoriPath, 'utf8');
    } catch (e) { this.errors.push({code:'INDEX_NOT_FOUND',message:e.message,affected_files:[indexEscriptoriPath]}); return; }

    const linkedInIndex = new Set(this.extractLinks(indexContent).map(l => this.resolveLink(l, allFiles, indexEscriptoriPath)).filter(Boolean));

    for (const file of allFiles) {
      const relPath = relative(escriptoriRoot, file);
      // Ens fixem només en els fitxers que pengen directament de 04_escriptori o de 01_produccio
      // Ignorem 00_bandeja_d_entrada per a l'ancoratge estricte.
      if (!relPath.startsWith('..') && !relPath.startsWith('00_bandeja_d_entrada')) {
        const fName = basename(file);
        const fNameLower = fName.toLowerCase();
        
        // Comprovació case-insensitive
        const hasLink = linkedInIndex.has(file);
        
        if (fNameLower !== '00_index_escriptori.md' && !hasLink) {
          this.errors.push({
            code: "ESCRIPTORI_UNANCHORED",
            message: `El document ${fName} és a l'Escriptori però no està ancorat a 00_index_escriptori.md.`,
            affected_files: [relative(this.wikiRoot, file)]
          });
        }
      }
    }
  }

  /** 3. Construcció del Graf i Detecció d'Orfes Operatius (DFS) */
  async auditGraphConnectivity(allFiles) {
    const allFilesMap = allFiles;

    // 3.1 Construir el graf d'adjacència només amb nodes operatius
    for (const file of allFiles) {
      const content = await readFile(file, 'utf8');
      const rawLinks = this.extractLinks(content);
      
      const resolvedLinks = new Set();
      for (const raw of rawLinks) {
        const resolved = this.resolveLink(raw, allFilesMap, file);
        if (resolved) {
          resolvedLinks.add(resolved);
        }
      }
      this.graph.set(file, resolvedLinks);
    }

    // 3.2 DFS des dels índexs canònics per trobar Orfes
    const canonicalIndices = [
      resolve(this.wikiRoot, '_wiki_de_poble', '00_index.md'), 
      resolve(this.wikiRoot, '_wiki_de_poble', '04_escriptori', '00_index_escriptori.md')
    ];
    const visited = new Set();
    const allNodes = new Set(this.graph.keys());

    const dfs = (node) => {
      if (visited.has(node)) return;
      visited.add(node);
      const neighbors = this.graph.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (allNodes.has(neighbor)) {
          dfs(neighbor);
        }
      }
    };

    for (const indexPath of canonicalIndices) {
      if (allNodes.has(indexPath)) {
        dfs(indexPath);
      } else {
        this.errors.push({
          code: "INDEX_NOT_FOUND",
          message: `L'índex canònic obligatori no existeix o no és accessible: ${indexPath}`,
          affected_files: [relative(this.wikiRoot, indexPath)]
        });
      }
    }

    // Tots els nodes operatius no visitats són ORFES OPERATIUS
      for (const node of allNodes) {
      if (!visited.has(node)) {
        // Ignorem l'índex arrel si per casualitat no hi és (no hauria de passar)
        if (basename(node) === '00_INDEX.md' || basename(node) === 'README.md') continue;
        
        // Excepcions lògiques: les plantilles no cal que estiguen enllaçades al graf principal per a no embrutar.
        const relNode = relative(this.wikiRoot, node);
        if (relNode.includes('/07_plantilles/') || relNode.includes('/90_arxiu_historic/') || relNode.includes('/90_arxiu_historic/')) continue;

        this.errors.push({
          code: "ORPHAN_OPERATIVE",
          message: `El document és un satèl·lit orfe. Està a la zona operativa però no hi ha cap camí actiu des de 00_INDEX.md per arribar-hi.`,
          affected_files: [relative(this.wikiRoot, node)]
        });
      }
    }
  }

  /** 4. Verifica la Llei de Pedra Seca: Cap JSX pot tenir style={{...color...}} */
  async verifyNoInlineColors() {
    const srcPath = join(this.wikiRoot, 'src');
    const jsxFiles = await this.getAllJsxFiles(srcPath);
    
    const styleBlockRegex = /style=\{\{([\s\S]*?)\}\}/gi;

    for (const file of jsxFiles) {
      const content = await readFile(file, 'utf8');
      let match;
      while ((match = styleBlockRegex.exec(content)) !== null) {
        const styleContent = match[1].toLowerCase();
        if (styleContent.includes('color') || styleContent.includes('background') || styleContent.includes('font')) {
          const lineNum = content.substring(0, match.index).split('\n').length;
          this.errors.push({
            code: "PEDRA_SECA_INLINE_STYLE",
            message: `Violació de la Llei de Pedra Seca. S'ha trobat un estil ad-hoc en línia ('color', 'background' o 'font') a la línia ${lineNum}. Cal utilitzar tokens semàntics via classes CSS indexades.`,
            affected_files: [relative(this.wikiRoot, file)]
          });
        }
      }
    }
  }

  async runAudits() {
    this.errors = []; this.graph.clear(); this.viva = null; this.arxiuAcceptats = 0; this.webLinks = null;
    const allFiles = await this.getAllMarkdownFiles(this.wikiRoot);
    
    if (allFiles.length === 0) {
      this.errors.push({
        code: "SCC_EMPTY",
        message: `El verificador SCC no ha trobat cap fitxer Markdown per auditar a ${this.wikiRoot}. Això indica un error greu en la ruta o el sistema de fitxers.`,
        affected_files: [this.wikiRoot]
      });
      return {
        timestamp: new Date().toISOString(),
        valid: false,
        errors: this.errors
      };
    }

    const links = (await Promise.all(allFiles.map(file => readFile(file, 'utf8')))).flatMap(extractDocumentLinks);
    this.webLinks = await prepareDocumentWebLinks(this.wikiRoot, links);
    await this.verifyInboxLimit();
    const deskFiles = [];
    const walkDesk = async dir => {
      try {
        for (const entry of await readdir(dir, {withFileTypes:true})) {
          if (entry.name.startsWith('.')) continue;
          const file = join(dir, entry.name);
          if (entry.isSymbolicLink()) { this.errors.push({code:'SCC_SYMLINK',message:'Symlink a l’escriptori',affected_files:[file]}); continue; }
          if (entry.isDirectory()) await walkDesk(file); else if (entry.isFile()) deskFiles.push(file);
        }
      } catch(e) { this.errors.push({code:'SCC_IO',message:e.message,affected_files:[dir]}); }
    };
    await walkDesk(join(this.wikiRoot, this.ESCRIPTORI_DIR));
    await this.verifyEscriptoriAnchoring([...new Set([...allFiles, ...deskFiles])]);
    await this.auditGraphConnectivity(allFiles);
    await this.verifyNoInlineColors();

    return {
      timestamp: new Date().toISOString(),
      filesChecked: allFiles.length, controlsExecuted: ['inbox','anchoring','graph','inline-styles'],
      // D-R30-14: quants enllaços a l'arxiu s'han acceptat pel disc de l'arrel viva, i quina (o per què cap).
      arxiuHistoric: { acceptatsDesDeLArrelViva: this.arxiuAcceptats, arrelViva: this.arrelViva().cami, motiu: this.arrelViva().motiu },
      valid: this.errors.length === 0,
      errors: this.errors
    };
  }
}

if (esMain(import.meta.url)) {
  const repoRoot = process.argv[2] || process.cwd();
  const v = new VerificadorSCC(repoRoot);
  v.runAudits().then(res => {
    if (!res.valid) {
      console.error(JSON.stringify(res, null, 2));
      process.exit(1);
    }
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  }).catch(e => { console.error(JSON.stringify({valid:false,errors:[{code:'SCC_IO',message:e.message}]})); process.exitCode=1; });
}
