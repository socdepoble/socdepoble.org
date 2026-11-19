import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {markdownProse} from '../lib/markdown-prose.mjs';
import {extractInlineMarkdownLinks, parseMarkdownDestination} from '../wiki/core/parse.mjs';
import {sourceSections, sections} from '../documental/core.mjs';
const evidenceRoot = process.env.LOT12_EVIDENCE_DIR || null;
// Frozen pre-Lot12 references, exercised only on bounded strings.
function legacyDestination(raw) {
  let value = raw.trim();
  const angle = /^<([^>]+)>/.exec(value);
  if (angle) return angle[1];
  const quotedTitle = /\s+(?:"[^"]*"|'[^']*'|\([^)]*\))\s*$/.exec(value);
  if (quotedTitle) value = value.slice(0, quotedTitle.index).trim();
  return value;
}

function legacyInline(text) {
  const links = [];
  for (let i = 0; i < text.length; i++) {
    const embed = text[i] === '!' && text[i + 1] === '[';
    const bracket = embed ? i + 1 : i;
    if (text[bracket] !== '[' || text[bracket + 1] === '[') continue;
    let depth = 1;
    let escaped = false;
    let labelEnd = -1;
    for (let j = bracket + 1; j < text.length; j++) {
      const char = text[j];
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (char === '[') depth++;
      else if (char === ']' && --depth === 0) { labelEnd = j; break; }
    }
    if (labelEnd < 0 || text[labelEnd + 1] !== '(') continue;

    let parens = 1;
    let quote = '';
    let angle = false;
    escaped = false;
    let end = -1;
    for (let j = labelEnd + 2; j < text.length; j++) {
      const char = text[j];
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (!quote && char === '<') { angle = true; continue; }
      if (angle && char === '>') { angle = false; continue; }
      if (!angle && (char === '"' || char === "'")) {
        if (quote === char) quote = '';
        else if (!quote && /\s/.test(text[j - 1] || '')) quote = char;
        continue;
      }
      if (angle || quote) continue;
      if (char === '(') parens++;
      else if (char === ')' && --parens === 0) { end = j; break; }
    }
    if (end < 0) continue;
    links.push({
      kind: 'markdown',
      raw: text.slice(i, end + 1),
      target: legacyDestination(text.slice(labelEnd + 2, end)),
      embed,
    });
    i = end;
  }
  return links;
}

function legacySections(body) {
  const clean = markdownProse(body);
  const chunks = [...clean.matchAll(/^##\s+(.+)\r?\n([\s\S]*?)(?=^##\s|$(?![\s\S]))/gm)];
  return new Map(chunks.map(m => [m[1].trim(), m[2].trim()]));
}
// Detecta capçaleres en prosa (mai dins de codi), però copia els bytes de la
// font. Emmascarar la prosa també en el resultat mutilava rutes i ordres.
function legacySourceSections(body) {
  const clean = markdownProse(body);
  const chunks = [...clean.matchAll(/^##\s+(.+)\r?\n([\s\S]*?)(?=^##\s|$(?![\s\S]))/gm)];
  return new Map(chunks.map(m => {
    const start = m.index + m[0].length - m[2].length;
    const value = body.slice(start, start + m[2].length)
      // La marca de la secció següent és estructura del generador, no text.
      .replace(/\s*<!-- SDP:SECTION [a-zA-Z0-9._-]+ -->\s*$/, '').trim();
    return [m[1].trim(), value];
  }));
}
const same = (input, label) => {
  assert.deepEqual(extractInlineMarkdownLinks(input), legacyInline(input), `inline ${label}`);
  assert.equal(parseMarkdownDestination(input), legacyDestination(input), `destination ${label}`);
};
const sameSections = (input, label) => {
  assert.deepEqual([...sections(input)], [...legacySections(input)], `sections ${label}`);
  assert.deepEqual([...sourceSections(input)], [...legacySourceSections(input)], `source ${label}`);
};

test('legacy contracts, malformed recovery and source-byte values', () => {
  for (const fixture of [{"id": 6, "api": "extractInlineMarkdownLinks", "input": "\\[x](y) [[a](b)", "extraArguments": [], "return": [{"kind": "markdown", "raw": "[x](y)", "target": "y", "embed": false}, {"kind": "markdown", "raw": "[a](b)", "target": "b", "embed": false}]}, {"id": 7, "api": "extractInlineMarkdownLinks", "input": "[a](\"unclosed [b](c)", "extraArguments": [], "return": [{"kind": "markdown", "raw": "[b](c)", "target": "c", "embed": false}]}, {"id": 8, "api": "extractInlineMarkdownLinks", "input": "[a](<x ( y)> \"t\") ![b](one\\)two)", "extraArguments": [], "return": [{"kind": "markdown", "raw": "[a](<x ( y)> \"t\")", "target": "x ( y)", "embed": false}, {"kind": "markdown", "raw": "![b](one\\)two)", "target": "one\\)two", "embed": true}]}, {"id": 9, "api": "parseMarkdownDestination", "input": "<>", "extraArguments": [], "return": "<>"}, {"id": 10, "api": "parseMarkdownDestination", "input": "<a b> rest", "extraArguments": [], "return": "a b"}, {"id": 11, "api": "parseMarkdownDestination", "input": "a (b (c)", "extraArguments": [], "return": "a"}, {"id": 12, "api": "parseMarkdownDestination", "input": "a\"b\"", "extraArguments": [], "return": "a\"b\""}, {"id": 13, "api": "parseMarkdownDestination", "input": "a \t\"x\"", "extraArguments": [], "return": "a"}, {"id": 19, "api": "sourceSections", "input": "## A\r\nText\r\n## B\r\nCos\r\n", "extraArguments": [], "return": [["A", "Text"], ["B", "Cos"]]}, {"id": 20, "api": "sourceSections", "input": "## A\nx\n## B\ny\n## A\nz\n", "extraArguments": [], "return": [["A", "z"], ["B", "y"]]}, {"id": 21, "api": "sourceSections", "input": "## A\nx\n<!-- SDP:SECTION a.b-1_2 -->\n## B\ny", "extraArguments": [], "return": [["A", "x"], ["B", "y"]]}, {"id": 22, "api": "sourceSections", "input": "## A\nx\n<!-- SDP:SECTION bad/name -->\n## B\ny", "extraArguments": [], "return": [["A", "x\n<!-- SDP:SECTION bad/name -->"], ["B", "y"]]}, {"id": 23, "api": "sourceSections", "input": "## \nTitol\nCos", "extraArguments": [], "return": [["Titol", "Cos"]]}, {"id": 24, "api": "sourceSections", "input": "## \n \n", "extraArguments": [], "return": [["", ""]]}, {"id": 25, "api": "sourceSections", "input": "## A", "extraArguments": [], "return": []}, {"id": 26, "api": "sourceSections", "input": "## A\nbody\n## B", "extraArguments": [], "return": [["A", "body"]]}]) {
    const fn = {extractInlineMarkdownLinks,parseMarkdownDestination,sourceSections}[fixture.api];
    if (!fn) continue;
    const value = fn(fixture.input,...fixture.extraArguments);
    assert.deepEqual(value instanceof Map ? [...value] : value, fixture.return, `${fixture.api} #${fixture.id}`);
  }
  for (const input of ['"','\'','a (b (c)','[a]("bad [b](c)','[[a](b)','\\[x](y)','![a](one\\)two)','[x](<a\n(b)> "title")','a\n(x)']) same(input,input);
  for (const input of ['## A\nbody\n## B','## \nTitol\nCos','## \n \n','## \r\n \r\n','## \n\t\r\nx','## A\u2028x\n## B\nbody','## A\n```\n## masked\n```\nText `code`\n<!-- SDP:SECTION a -->\n## B\ny']) sameSections(input,input);
});

test('exhaustive short delimiter strings and deterministic Unicode fuzz', () => {
  const alphabet = ['[',']','(',')','\\',' '];
  let exhaustive = 0;
  function visit(prefix, remaining) {same(prefix,`exhaustive ${exhaustive++}`);if(remaining)for(const c of alphabet)visit(prefix+c,remaining-1);}
  visit('',6);
  let state=0x261118;
  const next=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state;};
  const tokens=['[',']','(',')','\\','!','<','>','"',"'",' ','\t','\n','\r','\u2028','\u00a0','a','è','🧑'];
  for(let i=0;i<50000;i++) {let text='';const count=next()%90;for(let j=0;j<count;j++)text+=tokens[next()%tokens.length];same(text,`fuzz ${i}`);}
  const headings=['## ','##\t','##\n','## \n','##  \r\n','x\n## ','\u2028## '];
  for(let i=0;i<30000;i++) {
    let text=headings[next()%headings.length];const count=next()%90;
    for(let j=0;j<count;j++)text+=tokens[next()%tokens.length];
    text+='\n## B\n'+(i%2?'```\n## literal\n```':'body')+'\n<!-- SDP:SECTION a.b -->';
    sameSections(text,`section fuzz ${i}`);
  }
  if (evidenceRoot) fs.writeFileSync(path.join(evidenceRoot,'inline_sections_fuzz.json'),JSON.stringify({exhaustive,inlineFuzz:50000,sectionFuzz:30000,seed:0x261118,pass:true},null,2)+'\n');
});

test('64KiB incomplete delimiters use a bounded process and exact return contracts', () => {
  const parseUrl = new URL('../wiki/core/parse.mjs', import.meta.url).href;
  const coreUrl = new URL('../documental/core.mjs', import.meta.url).href;
  const script = `
    import assert from 'node:assert/strict';
    import {performance} from 'node:perf_hooks';
    import {extractInlineMarkdownLinks,parseMarkdownDestination} from ${JSON.stringify(parseUrl)};
    import {sourceSections} from ${JSON.stringify(coreUrl)};
    const n=65536,gap='a'+' '.repeat(n-2)+'(';
    const vectors=[['inline label','[a'.repeat(n/2),extractInlineMarkdownLinks,[]],['inline destination','[x]('.repeat(n/4),extractInlineMarkdownLinks,[]],['destination title gap',gap,parseMarkdownDestination,gap],['heading missing LF','## '+' '.repeat(n-4)+'x',sourceSections,new Map()],['marker tail','## A\\nx'+' '.repeat(n-7)+'!',sourceSections,new Map([['A','x'+' '.repeat(n-7)+'!']])]];
    const rows=[];
    for(const [id,input,fn,expected] of vectors){
      const elapsedMs=[];
      for(let i=0;i<5;i++){const start=performance.now();const actual=fn(input);elapsedMs.push(performance.now()-start);assert.deepEqual(actual,expected);}
      const medianMs=[...elapsedMs].sort((a,b)=>a-b)[2];
      assert.ok(medianMs<25,id+' '+medianMs+'ms');
      rows.push({id,bytes:Buffer.byteLength(input),elapsedMs,medianMs});
    }
    process.stdout.write(JSON.stringify(rows));
  `;
  const result=spawnSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8',timeout:5000,maxBuffer:1024*1024});
  assert.equal(result.error?.code,undefined,result.error?.message);
  assert.equal(result.status,0,result.stderr);
  const rows=JSON.parse(result.stdout);
  assert.equal(rows.length,5);
  if (evidenceRoot) fs.writeFileSync(path.join(evidenceRoot,'inline_sections_64k.json'),JSON.stringify(rows,null,2)+'\n');
});
