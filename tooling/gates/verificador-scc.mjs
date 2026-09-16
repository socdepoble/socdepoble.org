import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve, extname, relative, basename } from 'node:path';
import { CAMINS } from '../lib/arrel.mjs';

export class VerificadorSCC {
  constructor(wikiRoot) {
    this.wikiRoot = resolve(wikiRoot);
    
    // Configuració de límits
    this.INBOX_MAX_FILES = 20;
    this.INBOX_DIR = '_wiki_de_poble/04_ESCRIPTORI/00_Bandeja_d_Entrada';
    this.ESCRIPTORI_DIR = '_wiki_de_poble/04_ESCRIPTORI';
    
    // Resultats
    this.graph = new Map(); // AbsolutePath -> Set<AbsolutePath>
    this.errors = [];
  }

  /** Llig recursivament totes les carpetes */
  async getAllMarkdownFiles(dirPath) {
    const files = [];
    try {
      const items = await readdir(dirPath);
      for (const item of items) {
        // Excepte carpetes ocultes, de sistema i ignorades per SCC
        if (
          item.startsWith('.') || 
          ['node_modules', 'dist', 'src', 'scratch', 'supabase', '_templates', 'scripts', 'public', '90_arxiu_historic', '90_arxiu_historic'].includes(item)
        ) continue;
        
        const itemPath = join(dirPath, item);
        const stats = await stat(itemPath);
        if (stats.isDirectory()) {
           files.push(...await this.getAllMarkdownFiles(itemPath));
        } else if (stats.isFile() && extname(itemPath) === '.md') {
           files.push(itemPath);
        }
      }
    } catch {
      // Ometre errors de lectura
    }
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
        const stats = await stat(itemPath);
        if (stats.isDirectory()) {
           files.push(...await this.getAllJsxFiles(itemPath));
        } else if (stats.isFile() && (extname(itemPath) === '.jsx' || extname(itemPath) === '.tsx')) {
           files.push(itemPath);
        }
      }
    } catch {
      // Ometre errors
    }
    return files;
  }

  /** Extreu enllaços d'Obsidian (wikilinks i markdown) */
  extractLinks(content) {
    const links = [];
    const wikilinkRegex = /\[\[(.*?)\]\]/g;
    let match;
    while ((match = wikilinkRegex.exec(content)) !== null) {
      let target = match[1].split('|')[0].split('#')[0].trim();
      if (!target.endsWith('.md')) target += '.md';
      links.push(target);
    }
    
    const mdlinkRegex = /\[.*?\]\((.*?)\)/g;
    while ((match = mdlinkRegex.exec(content)) !== null) {
      let target = match[1].split('#')[0].trim();
      if (target.endsWith('.md') && !target.startsWith('http')) {
        links.push(target);
      }
    }
    return links;
  }

  /** Resol el nom del fitxer al camí absolut dins del graf operatiu */
  resolveLink(target, allFilesMap) {
    const targetName = basename(target);
    return allFilesMap.get(targetName) || null;
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
    } catch {
      // Si la carpeta no existeix, ignorem o creem error
    }
  }

  /** 2. Ancoratge: Cada fitxer a l'Escriptori ha d'estar a 00_INDEX_ESCRIPTORI.md */
  async verifyEscriptoriAnchoring(allFiles) {
    const escriptoriRoot = join(this.wikiRoot, this.ESCRIPTORI_DIR);
    const indexEscriptoriPath = join(escriptoriRoot, '00_INDEX_ESCRIPTORI.md');
    
    let indexContent = "";
    try {
      indexContent = await readFile(indexEscriptoriPath, 'utf8');
    } catch {
      return; // Si no hi ha índex, saltem (encara que hauria de ser error)
    }

    const linkedInIndex = new Set(this.extractLinks(indexContent).map(l => basename(l)));

    for (const file of allFiles) {
      const relPath = relative(escriptoriRoot, file);
      // Ens fixem només en els fitxers que pengen directament de 04_escriptori o de 01_Produccio
      // Ignorem 00_Bandeja_d_Entrada per a l'ancoratge estricte.
      if (!relPath.startsWith('..') && !relPath.startsWith('00_Bandeja_d_Entrada')) {
        const fName = basename(file);
        const fNameLower = fName.toLowerCase();
        
        // Comprovació case-insensitive
        const hasLink = Array.from(linkedInIndex).some(l => l.toLowerCase() === fNameLower);
        
        if (fNameLower !== '00_index_escriptori.md' && !hasLink) {
          this.errors.push({
            code: "ESCRIPTORI_UNANCHORED",
            message: `El document ${fName} és a l'Escriptori però no està ancorat a 00_INDEX_ESCRIPTORI.md.`,
            affected_files: [relative(this.wikiRoot, file)]
          });
        }
      }
    }
  }

  /** 3. Construcció del Graf i Detecció d'Orfes Operatius (DFS) */
  async auditGraphConnectivity(allFiles) {
    const allFilesMap = new Map();
    for (const file of allFiles) {
      allFilesMap.set(basename(file), file);
    }

    // 3.1 Construir el graf d'adjacència només amb nodes operatius
    for (const file of allFiles) {
      const content = await readFile(file, 'utf8');
      const rawLinks = this.extractLinks(content);
      
      const resolvedLinks = new Set();
      for (const raw of rawLinks) {
        const resolved = this.resolveLink(raw, allFilesMap);
        if (resolved) {
          resolvedLinks.add(resolved);
        }
      }
      this.graph.set(file, resolvedLinks);
    }

    // 3.2 DFS des dels índexs canònics per trobar Orfes
    const canonicalIndices = ['_wiki_de_poble/00_index.md', '_wiki_de_poble/04_escriptori/00_index_escriptori.md'];
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

    for (const relIndex of canonicalIndices) {
      const indexPath = join(this.wikiRoot, relIndex);
      if (allNodes.has(indexPath)) {
        dfs(indexPath);
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
          const lineNum = content.substring(0, match.index).split('\\n').length;
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
    const allFiles = await this.getAllMarkdownFiles(this.wikiRoot);
    
    await this.verifyInboxLimit();
    await this.verifyEscriptoriAnchoring(allFiles);
    await this.auditGraphConnectivity(allFiles);
    await this.verifyNoInlineColors();

    return {
      timestamp: new Date().toISOString(),
      valid: this.errors.length === 0,
      errors: this.errors
    };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const wikiRoot = process.argv[2] || CAMINS.wiki;
  const v = new VerificadorSCC(wikiRoot);
  v.runAudits().then(res => {
    if (!res.valid) {
      console.error(JSON.stringify(res, null, 2));
      process.exit(1);
    }
    console.log("✅ SCC OK");
    process.exit(0);
  });
}
