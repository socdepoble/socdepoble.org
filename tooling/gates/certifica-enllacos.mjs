#!/usr/bin/env node
/**
 * certifica-enllacos.mjs — Porta de Doble Certificació d'Enllaços (Anti-404 SPA).
 *
 * Ordre del Mestre (02-11-2026):
 *   «Si pones un enlace tienes que saber que ese enlace va a llevar al sitio que
 *    tú dices que va a llevar y para eso has de comprobarlo siempre [...] hay que
 *    comprobar siempre la información dos veces y corroborar que es correcta.»
 *
 * Per què cal doble comprovació:
 *   En una Single Page Application (SPA), fer només `curl -I` sobre una ruta
 *   inexistent com `https://socdepoble.org/page/projecte-fediversity` retorna
 *   `HTTP 200` (perquè el servidor web servix `/index.html`), però el router
 *   React pinta `Error 404 — Ací no hi ha res`.
 *
 * Doble comprovació obligatòria per a cada enllaç:
 *   1. Comprovació Estàtica i del Router SPA (Arbre Físic):
 *      - `/page/:slug` → ha d'existir a `PAGE_COPY` (`src/sections/text/pageContent.js`)
 *        o tindre redirecció a `resolvePageSlugPath` (`src/config/navigation.js`).
 *      - `/opendata/:cami` → ha d'existir a `public/opendata/` i a `manifest.json`.
 *      - `/.well-known/*`, `/nodeinfo/*`, `/ap/*` → ha d'existir a `preparaFederacio()`
 *        o a les reescriptures explícites de `firebase.json`.
 *      - Rutes SPA (`/fediversity`, `/pobles/:slug`, `/notes`, etc.) → han d'estar
 *        declarades a `SECTIONS`, `SYSTEM_PAGES`, `RUTES_CANONIQUES` o `src/app/App.jsx`.
 *      - `/wikidepoble?item=ID` i `/wiki?item=ID` → l'ítem ha d'existir a
 *        `src/data/wikiManifest.js` (si no, `SPA_404_WIKI_ITEM`).
 *      - Sense arguments, el CLI llig els `href`, els `data-ruta` i els
 *        `data-autor-ruta` (targetes incrustades) de totes les claus de `PAGE_COPY`.
 *   2. Comprovació Remota (`--remot`):
 *      - Fa `fetch` real i verifica `HTTP 200`, `Content-Type` i que els endpoints
 *        de dades mai retornen `<!doctype html>`.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from '@babel/parser';
import { arrelSegura, esMain } from '../lib/arrel.mjs';

const ARREL_PER_DEFECTE = arrelSegura();
const HOSTS_PROPIS = new Set(['socdepoble.org', 'www.socdepoble.org', 'localhost', '127.0.0.1']);

/** Llig les declaracions JSX reals, mai una allowlist mantinguda a mà. */
function rutesDelRouter(text, constants) {
  const fixes=new Set(), dinamiques=[], comodins=[];
  const expressio=n=>{
    if(n?.type==='StringLiteral')return n.value;
    if(n?.type==='Identifier'&&typeof constants[n.name]==='string')return constants[n.name];
    if(n?.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.property.name==='slice') {
      const base=expressio(n.callee.object);if(typeof base==='string'&&n.arguments.every(a=>a.type==='NumericLiteral'))return base.slice(...n.arguments.map(a=>a.value));
    }
    return null;
  };
  const escapa=t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const patro=ruta=>ruta.split('/').map(t=>t.startsWith(':')?'[^/]+':escapa(t)).join('/');
  const visita=n=>{
    if(!n||typeof n!=='object')return;
    if(n.type==='JSXOpeningElement'&&n.name?.name==='Route') {
      const a=n.attributes.find(a=>a.type==='JSXAttribute'&&a.name.name==='path');
      const v=expressio(a?.value?.type==='JSXExpressionContainer'?a.value.expression:a?.value);
      if(v&&v!=='*'&&v!=='/*') {
        const ruta=v.startsWith('/')?v:`/${v}`;
        if(ruta.endsWith('/*')) {
          const prefix=ruta.slice(0,-2);if(!prefix.includes(':'))fixes.add(prefix);
          comodins.push(new RegExp('^'+patro(prefix)+'(?:/.*)?$'));
        } else if(!ruta.includes(':'))fixes.add(ruta);
        else if(!ruta.startsWith('/:'))dinamiques.push(new RegExp('^'+patro(ruta)+'$'));
      }
    }
    for(const value of Object.values(n)) {if(Array.isArray(value))value.forEach(visita);else if(value&&typeof value==='object')visita(value);}
  };
  visita(parse(text,{sourceType:'module',plugins:['jsx']}));
  return {fixes,dinamiques,comodins};
}

// La barra invertida talla la URL en tots dos modes (també sense `inclouRelatius`):
// en el codi font és l'inici d'una cometa escapada (`\"`) o d'una seqüència (`\n`),
// i Codex hi deixava una «\» final. Una URL amb «\» al mig queda tallada en eixe punt.
const REGEX_URL = /https?:\/\/[^\s)"'`\]}\\]+/g;

function netejaUrlFinal(bruta) {
  return bruta.replace(/[.,;:!?\\]+$/, '');
}

/**
 * Extrau URLs i rutes d'un text. Amb `inclouRelatius`, a més dels `href` llig
 * els `data-ruta` i `data-autor-ruta` de les targetes incrustades, admet les
 * cometes escapades del codi font (`href=\"/x\"`) i fa absoluta cada ruta
 * relativa (`/x` → `https://socdepoble.org/x`).
 */
export function extreuUrlsDeText(text, { inclouRelatius = false } = {}) {
  if (typeof text !== 'string') return [];
  if (text.length > 8 * 1024 * 1024) throw new Error('Document massa gran per certificar');
  const trobades = new Set();
  const desa = value => {
    let v = value.replaceAll('&amp;', '&');
    if (!v || v.startsWith('#') || v.includes('<') || v.includes('>') || v.includes('{') || v.includes('...')) return;
    // Cap omissió silenciosa: una ruta amb «$» també es valida (els literals de
    // plantilla ja queden fora pel filtre de «{»).
    if (inclouRelatius && v.startsWith('/') && !v.startsWith('//')) {
      v = `https://socdepoble.org${v}`;
    }
    trobades.add(v);
  };
  for (const m of text.matchAll(REGEX_URL)) desa(netejaUrlFinal(m[0]));
  // Escàner lineal d'atributs: conserva també rutes relatives i protocols no segurs
  // perquè el validador els rebutge, en lloc d'ometre'ls silenciosament.
  const lower = text.toLowerCase();
  const atributs = inclouRelatius ? ['href', 'data-ruta', 'data-autor-ruta'] : ['href'];
  const valors = [];
  for (const nom of atributs) {
    let i = 0;
    while ((i = lower.indexOf(nom, i)) !== -1) {
      const start = i; i += nom.length;
      if (start > 0 && /[a-z0-9_-]/i.test(text[start-1])) continue;
      let j = i; while (/\s/.test(text[j] || '') && j < text.length) j++;
      if (text[j++] !== '=') continue;
      while (j < text.length && /\s/.test(text[j])) j++;
      const escapada = inclouRelatius && text[j] === '\\';
      if (escapada) j++;
      const quote = text[j];
      if (quote !== '"' && quote !== "'") continue;
      const end = text.indexOf(quote, j+1); if (end === -1) break;
      const brut = text.slice(j+1,end);
      valors.push([start, escapada ? brut.replace(/\\$/, '') : brut]); i = end+1;
    }
  }
  // Ordre del document, encara que cada atribut s'escanege a part.
  for (const [, valor] of valors.sort((a, b) => a[0] - b[0])) desa(valor);
  let i = 0;
  while ((i = text.indexOf('](', i)) !== -1) {
    const start = i+2; let j=start, depth=0;
    for (; j<text.length; j++) {
      if (text[j] === '\\') {j++;continue;}
      if (text[j] === '(') {depth++;if(depth>64) break;}
      if (text[j] === ')') {if(!depth) break;depth--;}
      if (text[j] === '\n') break;
    }
    if (text[j] === ')' && depth === 0) desa(text.slice(start,j).trim().split(/\s+["']/)[0]);
    i = Math.max(start,j+1);
  }
  return [...trobades];
}

async function carregaContextArbre(arrel) {
  const { PAGE_COPY } = await import(pathToFileURL(path.join(arrel, 'src/sections/text/pageContent.js')).href);
  const navigation=await import(pathToFileURL(path.join(arrel,'src/config/navigation.js')).href);
  const {resolvePageSlugPath,RUTES_CANONIQUES}=navigation;
  const { SECTIONS } = await import(pathToFileURL(path.join(arrel, 'src/config/sections.js')).href);
  const { SYSTEM_PAGES } = await import(pathToFileURL(path.join(arrel, 'src/config/systemPages.js')).href);
  const { default: federacioIaia } = await import(
    pathToFileURL(path.join(arrel, 'tooling/vite/federacio-iaia.mjs')).href
  );

  const [, buildPlugin] = federacioIaia({ arrel });
  buildPlugin.configResolved({ root: arrel, env: {}, build: { ssr: false } });
  const federacioFitxers = new Map();
  await buildPlugin.generateBundle.call({
    emitFile: (fitxer) => federacioFitxers.set(fitxer.fileName, String(fitxer.source))
  });
  const firebase = JSON.parse(fs.readFileSync(path.join(arrel, 'firebase.json'), 'utf8'));
  const manifestOpendata = JSON.parse(fs.readFileSync(path.join(arrel, 'public/opendata/manifest.json'), 'utf8'));
  const recursosOpendata = new Set(['manifest.json', ...(manifestOpendata.resources ?? []).map((r) => r.path)]);
  const rewritesFirebase = (firebase.hosting?.rewrites ?? [])
    .filter((r) => r.destination && r.destination !== '/index.html')
    .map((r) => ({
      source: r.source ?? null,
      regex: r.regex ? new RegExp(r.regex.replace(/\(\?i:([^)]+)\)/g, '(?:$1)'), 'i') : null,
      destination: r.destination
    }));

  const router = rutesDelRouter(fs.readFileSync(path.join(arrel, 'src/app/App.jsx'), 'utf8'),navigation);
  const rutesSeccions = new Set([
    ...router.fixes,
    ...Object.values(RUTES_CANONIQUES ?? {}),
    // Les metadades de secció/pàgina no proven que App munte una ruta.
    ...SYSTEM_PAGES.map((p) => p.href).filter(p => router.fixes.has(p))
  ]);

  const [pagines,pols,govern,xifres]=await Promise.all(['consolaPagines.js','polsConsola.js','govern/governConsola.js','xifresMas.js'].map(f=>import(pathToFileURL(path.join(arrel,'src/sections/consola',f)).href)));
  // La declaració exportada és dades; importar el mòdul complet executaria
  // dependències del navegador (i JSON de package.json) alienes al gate Node.
  const paquetsAst=parse(fs.readFileSync(path.join(arrel,'src/sections/consola/empaquetats.js'),'utf8'),{sourceType:'module'});
  const declaracio=paquetsAst.program.body.filter(n=>n.type==='ExportNamedDeclaration').flatMap(n=>n.declaration?.declarations??[]).find(n=>n.id.name==='RUTA_EMPAQUETATS')?.init;
  const rutaPaquets=declaracio?.type==='TemplateLiteral'&&declaracio.expressions.length===1&&declaracio.expressions[0].name==='RUTA_CONSOLA'
    ? declaracio.quasis[0].value.cooked+pagines.RUTA_CONSOLA+declaracio.quasis[1].value.cooked : null;
  const resolConsola=cami=>{
    const ruta=cami.slice('/consola/'.length);
    const panel=pols.segmentPols(ruta);if(panel!==null)return !!pols.panellPols(panel);
    const pagina=govern.segmentGovern(ruta);if(pagina!==null)return !!govern.paginaGovern(pagina);
    if(ruta.startsWith('xifres/'))return xifres.SLUGS_FIXOS.includes(ruta.slice('xifres/'.length))?true:null;
    if(rutaPaquets!==null&&cami===rutaPaquets)return true;
    const id=pagines.segmentPagina(ruta);return id!==null&&!!pagines.paginaConsola(id);
  };
  // Només els ítems: les categories («folder:…») s'obrin amb ?categoria=, mai amb ?item=.
  const { wikiManifest } = await import(pathToFileURL(path.join(arrel, 'src/data/wikiManifest.js')).href);
  const wikiIds = new Set((wikiManifest?.items ?? []).map((item) => item?.id).filter((id) => typeof id === 'string'));
  return {
    arrel,
    PAGE_COPY,
    resolvePageSlugPath,
    rutesSeccions,
    federacioFitxers,
    rewritesFirebase,
    recursosOpendata,
    rutesDinamiques: router.dinamiques,
    rutesComodi:router.comodins,
    resolConsola,
    seccions: new Set(SECTIONS.map(s => s.id)),
    wikiIds
  };
}

/** Un recurs de public/ és regular i no travessa symlinks ni pares externs. */
function fitxerPublicSegur(arrel, file) {
  const base=path.resolve(arrel,'public'), rel=path.relative(base,file);
  if(!rel || rel==='..'||rel.startsWith(`..${path.sep}`)||path.isAbsolute(rel)) return false;
  let actual=base;
  try {
    if(fs.lstatSync(base).isSymbolicLink()) return false;
    for(const part of rel.split(path.sep)) {actual=path.join(actual,part);if(fs.lstatSync(actual).isSymbolicLink()) return false;}
    return fs.statSync(actual).isFile();
  } catch {return false;}
}

/**
 * Comprovació #1: Valida una URL o ruta contra el router SPA i l'arbre físic.
 */
export function verificaRutaContraArbre(urlORuta, ctx) {
  let parsed;
  if (typeof urlORuta !== 'string' || urlORuta.length > 8192 || /[\p{Cc}\p{Cf}]/u.test(urlORuta)) return {ok:false,codi:'URL_INVALIDA',motiu:'URL no textual, massa llarga o amb controls'};
  try {
    parsed = urlORuta.startsWith('/') ? new URL(urlORuta, 'https://socdepoble.org') : new URL(urlORuta);
  } catch {
    return { ok: false, codi: 'URL_INVALIDA', motiu: `URL mal formada: ${urlORuta}` };
  }

  if (!['https:', 'http:', 'mailto:', 'tel:'].includes(parsed.protocol) || parsed.username || parsed.password) return {ok:false,codi:'URL_INVALIDA',motiu:'Protocol o credencials no admissibles'};
  if (['mailto:', 'tel:'].includes(parsed.protocol)) return {ok:!!parsed.pathname,tipus:'contacte',cami:parsed.href,detall:'Contacte no HTTP; només sintaxi'};
  try { const decoded=decodeURIComponent(parsed.pathname); if (/[\p{Cc}\p{Cf}\\]/u.test(decoded) || /%2f|%5c/i.test(parsed.pathname)) throw new Error('Segment codificat ambigu'); } catch { return {ok:false,codi:'URL_INVALIDA',motiu:'Codificació de ruta invàlida'}; }

  if (!HOSTS_PROPIS.has(parsed.hostname)) {
    return { ok: true, tipus: 'externa', cami: parsed.href, detall: ` Domini extern (${parsed.hostname})` };
  }

  const cami = parsed.pathname.replace(/\/+$/, '') || '/';

  // 1. Rutes /page/:slug
  const matchPage = /^\/page\/([^/]+)$/.exec(cami);
  if (matchPage) {
    const slug = decodeURIComponent(matchPage[1]);
    const teCopy = Object.hasOwn(ctx.PAGE_COPY, slug);
    const canonica = ctx.resolvePageSlugPath(slug);
    if (!teCopy && !canonica) {
      const disponibles = Object.keys(ctx.PAGE_COPY).join(', ');
      return {
        ok: false,
        codi: 'SPA_404_PAGE_SLUG',
        cami,
        motiu: `La ruta ${cami} NO existeix a PAGE_COPY ni a PAGE_ROUTE_MAP (el router React pintaria «Error 404 — Ací no hi ha res»). Claus vàlides: ${disponibles}`
      };
    }
    return {
      ok: true,
      tipus: 'spa-page',
      cami,
      detall: teCopy ? `PAGE_COPY.${slug} («${ctx.PAGE_COPY[slug].title}»)` : `Redirecció canònica → ${canonica}`
    };
  }

  // 2. Rutes /opendata/*
  if (cami.startsWith('/opendata/')) {
    const rel = cami.slice('/opendata/'.length);
    const camiFisic = path.join(ctx.arrel, 'public/opendata', rel);
    if (!fitxerPublicSegur(ctx.arrel, camiFisic)) {
      return {
        ok: false,
        codi: 'OPENDATA_404',
        cami,
        motiu: `El recurs ${cami} no existeix físicament a public/opendata/${rel}`
      };
    }
    if (!ctx.recursosOpendata.has(rel)) {
      return {
        ok: false,
        codi: 'OPENDATA_FORA_MANIFEST',
        cami,
        motiu: `El recurs ${cami} existeix però no figura a public/opendata/manifest.json`
      };
    }
    return { ok: true, tipus: 'opendata', cami, detall: `public/opendata/${rel} verificat al manifest` };
  }

  // 3. Rutes de federació: /.well-known/*, /nodeinfo/*, /ap/*
  if (cami.startsWith('/.well-known/') || cami.startsWith('/nodeinfo/') || cami.startsWith('/ap/')) {
    const senseBarra = cami.slice(1);
    if (ctx.federacioFitxers.has(senseBarra)) {
      return { ok: true, tipus: 'federacio', cami, detall: `Emés per preparaFederacio (${senseBarra})` };
    }
    const reglaRewrite = ctx.rewritesFirebase.find(
      (r) => r.source === cami || (r.regex && r.regex.test(cami))
    );
    const reescrit = reglaRewrite?.destination;
    if (reescrit && ctx.federacioFitxers.has(reescrit.slice(1))) {
      return { ok: true, tipus: 'federacio-rewrite', cami, detall: `Rewrite firebase.json → ${reescrit}` };
    }
    return {
      ok: false,
      codi: 'FEDERACIO_404',
      cami,
      motiu: `L'endpoint de federació ${cami} no l'emet preparaFederacio ni té rewrite a firebase.json`
    };
  }

  // 4. Fitxers estàtics a public/
  const possiblePublic = path.join(ctx.arrel, 'public', cami.slice(1));
  if (cami !== '/' && fitxerPublicSegur(ctx.arrel, possiblePublic)) {
    return { ok: true, tipus: 'public-estatic', cami, detall: `Fitxer físic public${cami}` };
  }

  // Rutes muntades i subrouters amb resolutors purs reals.
  if(cami.startsWith('/consola/')&&ctx.resolConsola) {
    const coneguda=ctx.resolConsola(cami);
    if(coneguda===true)return {ok:true,tipus:'spa-ruta',cami,detall:'Subpàgina acreditada pel resolutor de Consola'};
    if(coneguda===null)return {ok:false,codi:'RUTA_PENDENT_RESOLUCIO',cami,motiu:'La peça de la Consola requerix dades del Mapa; no és una ruta 404 demostrada'};
    return {ok:false,codi:'SPA_404_SUBRUTA',cami,motiu:'El resolutor de Consola no reconeix esta subpàgina'};
  }
  if(ctx.rutesSeccions.has(cami)) {
    // Un enllaç a un ítem de la Wiki (?item=ID) exigix l'ítem al manifest compilat.
    const itemWiki = (cami === '/wikidepoble' || cami === '/wiki') ? parsed.searchParams.get('item') : null;
    if (itemWiki && ctx.wikiIds && !ctx.wikiIds.has(itemWiki)) {
      return {
        ok: false,
        codi: 'SPA_404_WIKI_ITEM',
        cami: `${cami}?item=${itemWiki}`,
        motiu: `L'ítem de la Wiki «${itemWiki}» no existeix a src/data/wikiManifest.js`
      };
    }
    if (itemWiki && ctx.wikiIds) return {ok:true,tipus:'spa-ruta',cami:`${cami}?item=${itemWiki}`,detall:`Ítem de la Wiki verificat (${itemWiki})`};
    return {ok:true,tipus:'spa-ruta',cami,detall:`Ruta declarada a App (${cami})`};
  }
  const item=/^\/([^/]+)\/([^/]+)$/.exec(cami);
  if((ctx.rutesDinamiques??[]).some(re=>re.test(cami))||(item&&ctx.seccions?.has(item[1])))return {ok:true,tipus:'spa-dinamica',cami,pendentDades:true,detall:'Patró del router existent; falta verificar identitat/dades del recurs'};
  if((ctx.rutesComodi??[]).some(re=>re.test(cami)))return {ok:false,codi:'RUTA_PENDENT_RESOLUCIO',cami,motiu:'Comodí muntat a App; la subruta exigix resolutor o comprovació de runtime, no un HTTP200'};

  return {
    ok: false,
    codi: 'SPA_404_RUTA_DESCONEGUDA',
    cami,
    motiu: `La ruta ${cami} no correspon a cap secció, pàgina ni recurs estàtic conegut (cauria en NotFoundPage 404)`
  };
}

/**
 * Comprovació #2: Verifica per xarxa (HTTP + Contingut) que la URL respon 200 i no és un fals positiu.
 */
export async function verificaUrlRemota(url, resultatArbre, { fetchImpl = globalThis.fetch } = {}) {
  try {
    const resposta = await fetchImpl(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'SocDePoble-LinkCertifier/1.0' }
    });
    if (!resposta.ok) {
      return { ok: false, status: resposta.status, motiu: `HTTP ${resposta.status} a ${url}` };
    }
    const contentType = resposta.headers.get('content-type') || '';
    const mime = contentType.split(';')[0].trim().toLowerCase();
    if (resposta.url && new URL(resposta.url).origin !== new URL(url).origin) return {ok:false,status:resposta.status,motiu:'Redirecció a un altre origen'};
    const maxim=8*1024*1024;
    if(Number(resposta.headers.get('content-length'))>maxim) return {ok:false,status:resposta.status,motiu:'Resposta massa gran per certificar'};
    let cos;
    if(resposta.body?.getReader) {
      const reader=resposta.body.getReader(), chunks=[]; let total=0;
      try {for(;;) {const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>maxim){await reader.cancel();return {ok:false,status:resposta.status,motiu:'Resposta massa gran per certificar'};}chunks.push(value);}}
      finally {reader.releaseLock();}
      cos=Buffer.concat(chunks).toString('utf8');
    } else cos=await resposta.text();
    if (cos.length > 8*1024*1024) return {ok:false,status:resposta.status,motiu:'Resposta massa gran per certificar'};
    const dades = ['opendata','federacio','federacio-rewrite'].includes(resultatArbre.tipus);
    if (dades) {
      if (/<!doctype\s+html|<html\b/i.test(cos) || mime === 'text/html') return {ok:false,status:resposta.status,motiu:"L'endpoint de dades ha retornat HTML de fallback o MIME HTML"};
      const pathname = new URL(url).pathname;
      const json = /\.(?:json|jsonld|geojson)$/.test(pathname) || /\/(?:nodeinfo|webfinger)(?:\/|$)/.test(pathname);
      if (json) {
        if (!/^application\/(?:[a-z0-9.+-]*\+)?json$/.test(mime)) return {ok:false,status:resposta.status,motiu:'MIME JSON incorrecte'};
        try { JSON.parse(cos); } catch { return {ok:false,status:resposta.status,motiu:'JSON invàlid'}; }
      } else if (pathname.endsWith('/host-meta') && !['application/xrd+xml','application/xml','text/xml'].includes(mime)) return {ok:false,status:resposta.status,motiu:'MIME XML incorrecte'};
    }
    if (resultatArbre.tipus?.startsWith('spa-')) {
      if (mime !== 'text/html') return {ok:false,status:resposta.status,motiu:'La ruta SPA no retorna HTML'};
      if (/<title>\s*404\b|<h[1-3][^>]{0,256}>\s*(?:Error\s*)?404\b/i.test(cos)) return {ok:false,status:resposta.status,motiu:'Pantalla NotFound amb HTTP 200'};
    }

    return {
      ok: true,
      status: resposta.status,
      contentType: contentType.split(';')[0].trim(),
      bytes: Buffer.byteLength(cos, 'utf8')
    };
  } catch (err) {
    return { ok: false, status: 0, motiu: `Error de xarxa a ${url}: ${err.message}` };
  }
}

export async function certificaEnllacos({
  arrel = ARREL_PER_DEFECTE,
  urls = [],
  fitxers = [],
  remot = false,
  fetchImpl = globalThis.fetch
} = {}) {
  const ctx = await carregaContextArbre(arrel);
  const conjunt = new Set(urls);
  for (const fitxer of fitxers) {
    const cami = path.isAbsolute(fitxer) ? fitxer : path.join(arrel, fitxer);
    const text = fs.readFileSync(cami, 'utf8');
    // Les fonts de contingut de l'app porten l'HTML dins de cadenes amb cometes escapades.
    const esFontApp = /\bpageContent\.js$|\blegalContent\.js$/.test(cami);
    for (const u of extreuUrlsDeText(text, { inclouRelatius: esFontApp })) conjunt.add(u);
  }

  const llista = [...conjunt];
  const resultats = [];
  for (const url of llista) {
    const arbre = verificaRutaContraArbre(url, ctx);
    let xarxa = null;
    if (arbre.ok && remot && !['contacte'].includes(arbre.tipus)) {
      const absoluta = new URL(url, 'https://socdepoble.org').href;
      xarxa = await verificaUrlRemota(absoluta, arbre, { fetchImpl });
    }
    const ok = arbre.ok && (xarxa === null || xarxa.ok);
    resultats.push({ url, ok, arbre, xarxa });
  }

  const falles = resultats.filter((r) => !r.ok);
  const resumJson = JSON.stringify(
    resultats.map((r) => ({ url: r.url, ok: r.ok, tipus: r.arbre.tipus, detall: r.arbre.detall, status: r.xarxa?.status ?? null }))
  );
  const segellSha256 = createHash('sha256').update(resumJson).digest('hex').slice(0, 16);

  return {
    ok: falles.length === 0,
    dobleCertificacio: llista.length > 0 && remot && resultats.every(r => r.ok && r.xarxa?.ok === true && !r.arbre.pendentDades),
    abast: 'Arbre/router i HTTP quan es demana; no certifica hidratació React, existència de dades dinàmiques ni permisos de sessió',
    total: resultats.length,
    verificats: resultats.length - falles.length,
    falles,
    resultats,
    segellSha256
  };
}

// CLI: opcions explícites; un fitxer absolut no és una ruta SPA.
export async function main(args = process.argv.slice(2)) {
  const urls=[], fitxers=[]; let remot=false, json=false, arrel=ARREL_PER_DEFECTE;
  for(let i=0;i<args.length;i++) {
    const a=args[i];
    if(a==='--remot') {remot=true;continue;}
    if(a==='--json') {json=true;continue;}
    // --arxiu i --arxius són àlies de --fitxer.
    const m=/^--(url|fitxer|arxiu|arxius|arrel)(?:=(.*))?$/.exec(a);
    if(m) {const value=m[2]??args[++i];if(!value || value.startsWith('--')) throw new Error('Falta valor de '+a);if(m[1]==='url')urls.push(value);else if(m[1]==='arrel')arrel=path.resolve(value);else fitxers.push(value);continue;}
    if(a.startsWith('--')) throw new Error('Opció desconeguda: '+a);
    if(/^https?:\/\//.test(a)||a.startsWith('/')) urls.push(a); else fitxers.push(a);
  }
  if(!urls.length&&!fitxers.length) {
    // Sense arguments: tots els enllaços i targetes incrustades de totes les claus de PAGE_COPY.
    const {PAGE_COPY}=await import(pathToFileURL(path.join(arrel,'src/sections/text/pageContent.js')).href);
    const htmls=Object.values(PAGE_COPY).map(p=>p?.html??'').join('\n');
    urls.push('/page/fediversity','/page/descarregues','/opendata/municipi.jsonld','/opendata/manifest.json','/opendata/llicencies.md',...extreuUrlsDeText(htmls,{inclouRelatius:true}));
  }
  const informe=await certificaEnllacos({arrel,urls:[...new Set(urls)],fitxers,remot});
  if(json) console.log(JSON.stringify(informe,null,2));
  else {
    console.log(`[Certificador] ${informe.verificats}/${informe.total} comprovats · ${informe.dobleCertificacio?'ARBRE + HTTP':'ARBRE; doble certificació pendent'}`);
    for(const r of informe.resultats) console.log(`${r.ok?'OK':'ERROR'} ${r.url} · ${r.arbre.detall??r.arbre.motiu} ${r.xarxa?.motiu??''}`);
    console.log(informe.abast);
  }
  if(!informe.ok) process.exitCode=1;
  return informe;
}
if(esMain(import.meta.url)) main().catch(e=>{console.error(e.message);process.exitCode=1;});
