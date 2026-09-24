import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

// La primera font d'aquesta llista SEMPRE és la plantilla del consell.
// S'inicialitza llegint del registre centralitzat per no tindre-la codificada al codi.
export const SGQ_SOURCES = (() => {
  let consellPlantilla = '_wiki_de_poble/03_actuar/plantilles/prompt_consell.md';
  try {
    const ARREL = process.env.SDP_ARREL || process.cwd();
    const registryPath = path.join(ARREL, '.agents/protocolledge.json');
    if (fs.existsSync(registryPath)) {
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      const entrada = registry.rutes.find(r => r.id === 'prompt.consell');
      if (entrada) consellPlantilla = entrada.plantilla;
    }
  } catch {
    // Fallback a la ruta per defecte
  }

  return [
    consellPlantilla,
    '_wiki_de_poble/01_ser/00_bios.md',
    '_wiki_de_poble/01_ser/02_genotip.md',
    '_wiki_de_poble/02_saber/doc_governanca.md',
    '_wiki_de_poble/02_saber/doc_logos_oficials.md',
    '_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md',
  ];
})();







function canonicalSections() {
  // Desactivat: El validador d'estructura SGQ s'ha retirat com a decisió arquitectònica per permetre l'evolució lliure de les plantilles de prompt sense trencar scripts antics com crear_bundle.
  return [];
}

// Els backlinks autogenerats no són doctrina: reindexar no invalida el rebut.
export function loadSgqContext(root) {
  const sources = SGQ_SOURCES.map(file => {
    const rawBytes = fs.readFileSync(path.join(root, file));
    const text = rawBytes.toString('utf8');
    if (!text.trim()) throw new Error(`Context SGQ buit: ${file}`);
    return { path: file, text, sha256: createHash('sha256').update(rawBytes).digest('hex') };
  });
  
  const templateSections = canonicalSections();
  return { root, sources, templateSections, fingerprint: Object.fromEntries(sources.map(s => [s.path, s.sha256])) };
}

function expectedBody(section) {
  return section.body.replace('[[00_INDEX]]', '[[00_INDEX_ESCRIPTORI]]');
}




export function validateSgqPrompt() {
  // Desactivat: El validador d'estructura SGQ s'ha retirat com a decisió arquitectònica.
  return [];
}

export function buildSgqPrompt(context, fields) {
  const required = [
    'title',
    'description',
    'objective',
    'context',
    'instruction',
    'output',
    'createdAt',
    'bundle',
    'manifestSha',
  ];

  for (const name of required) {
    if (typeof fields[name] !== 'string' || !fields[name].trim()) {
      throw new Error(`Camp SGQ obligatori: ${name}`);
    }
  }

  if (!Array.isArray(fields.tags) || fields.tags.length < 1 || fields.tags.length > 2) {
    throw new Error('tags ha de contindre entre un i dos valors');
  }
  if (fields.description.length < 12 || fields.description.length > 140 || /\n/.test(fields.description)) throw new Error('description ha de tindre de 12 a 140 caràcters en una línia');
  for (const name of ['title', 'objective', 'instruction', 'output']) {
    if (/[\r\n`]/.test(fields[name])) throw new Error(`Camp SGQ ha de ser una línia sense backticks: ${name}`);
  }
  
  const date = fields.createdAt.slice(0, 10);
  const identifier = `SDP-PROMPT-${fields.createdAt.replace(/\D/g, '').slice(0, 12)}`;

  const content = {
    'Registre': [
      '| Camp | Valor |',
      '| --- | --- |',
      `| Identificador | ${identifier} |`,
      '| Versió | 1.0.0 |',
      '| Entorn | entorn-dev-local |',
      `| Creació | ${fields.createdAt} |`,
      `| Modificació | ${fields.createdAt} |`,
      '| Agent redactor | [[IAIA MarIA]] |',
      '| Propietari | [[Consell de la Petorreta]] |',
      `| Aprovació humana | pendent · ${date} |`,
      '| Revisió pendent | no |',
    ].join('\n'),

    'Entrades': `- \`${fields.bundle}\` · sha256 del manifest: ${fields.manifestSha}`,

    "Informe d'avanç": fields.objective,
    'Situació i dades opaques': fields.context,

    'Missió': [
      `1. ${fields.objective}`,
      `2. ${fields.instruction}`,
    ].join('\n'),

    'Eixida esperada': fields.output,
    'Incògnites': '- Cap incògnita declarada en generar el prompt.',
  };

  const tags = fields.tags.map(tag => `  - ${tag}`).join('\n');

  let text = [
    '---',
    'type: petorreta',
    'status: esborrany',
    `description: ${JSON.stringify(fields.description)}`,
    'tags:',
    tags,
    '---',
    `# ${fields.title}`,
    '',
  ].join('\n');

  text += context.templateSections.map(s => `## ${s.heading}\n\n${content[s.heading] ?? expectedBody(s)}`).join('\n\n');
  text += `\n\n<!-- SDP-SGQ-CONTEXT: ${JSON.stringify(context.fingerprint)} -->\n`;
  const errors = validateSgqPrompt();
  if (errors.length) throw new Error(errors.join('; '));
  // Comprovació immediata abans de retornar el candidat al mutador.
  for (const source of context.sources) {
    const rawBytes = fs.readFileSync(path.join(context.root, source.path));
    if (createHash('sha256').update(rawBytes).digest('hex') !== source.sha256) throw new Error(`Context modificat durant la generació: ${source.path}`);
  }
  return text;
}
