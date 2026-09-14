import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const ISO_SOURCES = [
  '_wiki_de_poble/02_saber/07_plantilles/plantilla_iso_sdp.md',
  '_wiki_de_poble/01_ser/00_bios.md',
  '_wiki_de_poble/01_ser/02_genotip.md',
  '_wiki_de_poble/02_saber/doc_governanca.md',
  '_wiki_de_poble/02_saber/doc_logos_oficials.md',
  '_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md',
];
const stripAuto = text => text.replace(/\n## Sinapsis Entrants \(Autogenerat\)[\s\S]*?<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->/g, '').trim();
function sections(text) {
  // Només capçaleres Markdown reals, fora dels blocs de codi.
  const lines = text.split('\n');
  const result = [];
  let fence = null;
  let current = null;
  for (const line of lines) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
    }
    const heading = !fence && /^## (.+)$/.exec(line);
    if (heading) { current = { heading: heading[1], lines: [] }; result.push(current); }
    else if (current) current.lines.push(line);
  }
  return result.map(({ heading, lines }) => ({ heading, body: lines.join('\n').trim() }));
}

// Els backlinks autogenerats no són doctrina: reindexar no invalida el rebut.
export function loadIsoContext(root) {
  const sources = ISO_SOURCES.map(file => {
    const rawBytes = fs.readFileSync(path.join(root, file));
    const text = rawBytes.toString('utf8');
    if (!text.trim()) throw new Error(`Context ISO buit: ${file}`);
    return { path: file, text, sha256: createHash('sha256').update(rawBytes).digest('hex') };
  });
  const template = stripAuto(sources[0].text);
  const templateSections = sections(template).filter(s => s.heading !== 'Frontmatter Obligatori' && !s.heading.startsWith('[IF:'));
  const names = templateSections.map(s => s.heading);
  for (const required of ['Font de Logos', 'Bloc Fixe d’Identitat', 'Objectiu', 'Context Necessari', 'Instrucció Principal', 'Output Esperat', 'Tancament Obligatori', 'Sinapsis', 'Taxonomia']) {
    if (!names.includes(required)) throw new Error(`Plantilla ISO incompleta: ${required}`);
  }
  return { root, sources, templateSections, fingerprint: Object.fromEntries(sources.map(s => [s.path, s.sha256])) };
}

function expectedBody(section) {
  return section.body.replace('[[00_INDEX]]', '[[00_INDEX_ESCRIPTORI]]');
}
const editable = new Set(['Objectiu', 'Context Necessari', 'Instrucció Principal', 'Output Esperat']);
const receiptPattern = /\n<!-- SDP-ISO-CONTEXT: (\{[^\n]+\}) -->\s*$/;

export function validateIsoPrompt(context, text) {
  const errors = [];
  const header = /^---\ntipus: petorreta\nestat: esborrany\ndescription: ("[^\n]+")\n---\n# [^\n]+\n/.exec(text);
  if (!header) errors.push('Capçalera o frontmatter ISO invàlid');
  else {
    try {
      const description = JSON.parse(header[1]);
      if (description.length < 12 || description.length > 140 || /[\r\n]/.test(description)) errors.push('description fora del límit ISO');
    } catch { errors.push('description malformada'); }
  }
  const match = receiptPattern.exec(text);
  if (!match) errors.push('Falta el rebut de lectura del context ISO');
  else {
    try {
      const receipt = JSON.parse(match[1]);
      if (JSON.stringify(receipt) !== JSON.stringify(context.fingerprint)) errors.push('Context canviat: rellegix la Wiki i regenera el prompt');
    } catch { errors.push('Rebut ISO malformat'); }
  }
  const actual = sections(text.replace(receiptPattern, ''));
  if (JSON.stringify(actual.map(s => s.heading)) !== JSON.stringify(context.templateSections.map(s => s.heading))) errors.push('Seccions ISO absents, duplicades o fora d’ordre');
  for (const source of context.templateSections) {
    const section = actual.find(s => s.heading === source.heading);
    if (!section) continue;
    if (!editable.has(source.heading) && section.body !== expectedBody(source)) errors.push(`Bloc fix alterat: ${source.heading}`);
    if (editable.has(source.heading) && !section.body.trim()) errors.push(`Secció buida: ${source.heading}`);
  }
  for (const [heading, marker] of [['Objectiu', 'OBJECTIU'], ['Instrucció Principal', 'EXECUTA'], ['Output Esperat', 'FORMAT']]) {
    const body = actual.find(s => s.heading === heading)?.body || '';
    if (!new RegExp('^`' + marker + ': [^`\\n]+`$', 'm').test(body)) errors.push(`Falta ${marker} en ${heading}`);
  }
  if (/\{(?:text|context_\d+|accio concreta|markdown\|json|descripció)[^}]*\}|\[\.\.\.|\[IF:tipus=/.test(text)) errors.push('Queden placeholders de plantilla');
  return errors;
}

export function buildIsoPrompt(context, fields) {
  for (const name of ['title', 'description', 'objective', 'context', 'instruction', 'output']) {
    if (typeof fields[name] !== 'string' || !fields[name].trim()) throw new Error(`Camp ISO obligatori: ${name}`);
  }
  if (fields.description.length < 12 || fields.description.length > 140 || /\n/.test(fields.description)) throw new Error('description ha de tindre de 12 a 140 caràcters en una línia');
  for (const name of ['title', 'objective', 'instruction', 'output']) {
    if (/[\r\n`]/.test(fields[name])) throw new Error(`Camp ISO ha de ser una línia sense backticks: ${name}`);
  }
  const content = {
    'Objectiu': `${fields.objective}\n\n\`OBJECTIU: ${fields.objective}\``,
    'Context Necessari': fields.context,
    'Instrucció Principal': `${fields.instruction}\n\n\`EXECUTA: ${fields.instruction}\``,
    'Output Esperat': `\`FORMAT: ${fields.output}\``,
  };
  let text = `---\ntipus: petorreta\nestat: esborrany\ndescription: ${JSON.stringify(fields.description)}\n---\n# ${fields.title}\n\n`;
  text += context.templateSections.map(s => `## ${s.heading}\n\n${content[s.heading] ?? expectedBody(s)}`).join('\n\n');
  text += `\n\n<!-- SDP-ISO-CONTEXT: ${JSON.stringify(context.fingerprint)} -->\n`;
  const errors = validateIsoPrompt(context, text);
  if (errors.length) throw new Error(errors.join('; '));
  // Comprovació immediata abans de retornar el candidat al mutador.
  for (const source of context.sources) {
    const rawBytes = fs.readFileSync(path.join(context.root, source.path));
    if (createHash('sha256').update(rawBytes).digest('hex') !== source.sha256) throw new Error(`Context modificat durant la generació: ${source.path}`);
  }
  return text;
}
