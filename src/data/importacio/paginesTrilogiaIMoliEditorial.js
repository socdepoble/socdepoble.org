import {sanitizeHtml} from '../../utils/sanitize.js';
import {reescriuEnllacosHtmlSocDePobleNet} from './mapaEnllacosInternsWp.js';
import {MITJANS_WP_LOCALS} from './paginesTrilogiaIMoliWp.mitjans.js';
import {carregaPaginesTrilogiaIMoliWp, FONT_PAGINES_WP_SHA256} from './paginesTrilogiaIMoliWp.js';

const HTTPS = raw=>{
  try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port?u:null;}catch{return null;}
};
const ID=/^[A-Za-z0-9_-]{11}$/;
// Only the association's own public contact address may survive in a draft; a third party's address is never copied.
const CORREUS_INSTITUCIONALS=new Set(['socdepoblecom@gmail.com']);
// Bounded linear pattern without lookbehind (Safari 16.0 BASELINE) to prevent super-linear backtracking on untrusted drafts.
const CORREU=/(^|[^A-Za-z0-9._%+-])([A-Za-z0-9._%+-]{1,64}@(?:[A-Za-z0-9-]{1,63}\.){1,8}[A-Za-z]{2,24})(?![A-Za-z0-9_-])/g;
const localImage=url=>{
  const local=MITJANS_WP_LOCALS[url];
  return local&&/^\/assets\/importacio-wp\/[A-Za-z0-9][A-Za-z0-9._-]*\.(?:webp|avif|png|jpe?g)$/i.test(local.path)&&/^[a-f0-9]{64}$/.test(local.sha256)?local:null;
};
function videoId(raw){
  const u=HTTPS(raw);if(!u)return null;
  if(['www.youtube.com','youtube.com','www.youtube-nocookie.com','youtube-nocookie.com'].includes(u.hostname)){
    const match=/^\/embed\/([A-Za-z0-9_-]{11})$/.exec(u.pathname);
    const id=match?.[1]??(u.pathname==='/watch'?u.searchParams.get('v'):null);return ID.test(id??'')?id:null;
  }
  if(u.hostname==='youtu.be'&&ID.test(u.pathname.slice(1)))return u.pathname.slice(1);
  return null;
}
export function transformaPaginaTrilogiaIMoliWp(page){
  if(typeof DOMParser==='undefined')throw new Error('WP_DOM_REQUIRED');
  const doc=new DOMParser().parseFromString(`<template>${page.contentHtml}</template>`,'text/html');
  const body=doc.querySelector('template').content;
  body.querySelectorAll('script,style,object,embed,form,input,svg,math,meta,link,base,noscript').forEach(n=>n.remove());
  const images=new Set([...(page.images??[]),page.featured_image].map(raw=>HTTPS(raw)?.href).filter(Boolean));
  const pending=new Set([...images].filter(url=>!localImage(url))),videos=new Set(),seenImages=new Set();
  const link=(url,label)=>{const a=doc.createElement('a');a.setAttribute('href',url);a.setAttribute('target','_blank');a.setAttribute('rel','noopener noreferrer');a.textContent=label;return a;};
  for(const img of [...body.querySelectorAll('img')]){
    const u=HTTPS(img.getAttribute('data-src')||img.getAttribute('src'));
    const known=u&&images.has(u.href),local=known?localImage(u.href):null;
    if(known)seenImages.add(u.href);
    if(local){
      img.setAttribute('src',local.path);img.removeAttribute('data-src');img.removeAttribute('srcset');img.setAttribute('loading','lazy');img.setAttribute('referrerpolicy','no-referrer');
    }else if(known){
      pending.add(u.href);
      const replacement=link(u.href,img.getAttribute('alt')||'Obri la imatge original');
      // A thumbnail is often already wrapped in an anchor. Do not create
      // nested links (the HTML parser would relocate the source caption).
      const anchor=img.closest('a');
      if(anchor){
        const span=doc.createElement('span');
        anchor.replaceWith(span);span.append(...anchor.childNodes);img.replaceWith(replacement);
      }else img.replaceWith(replacement);
    }else img.remove();
  }
  const missing=[...images].filter(url=>!seenImages.has(url));
  if(missing.length){
    const list=doc.createElement('ul');
    for(const url of missing){const li=doc.createElement('li'),local=localImage(url);
      if(local){const img=doc.createElement('img');img.src=local.path;img.alt='Imatge de la font original';li.append(img);}
      else li.append(link(url,'Obri la imatge original pendent de còpia'));
      list.append(li);
    }
    body.append(list);
  }
  const marker=id=>{
    const div=doc.createElement('div');div.setAttribute('data-sdp-youtube',id);div.setAttribute('data-titol',page.title);
    div.append(link(`https://www.youtube.com/watch?v=${id}`,'Obri el vídeo original'));return div;
  };
  for(const frame of [...body.querySelectorAll('iframe')]){
    const raw=frame.getAttribute('src')||frame.getAttribute('data-src'),id=videoId(raw),u=HTTPS(raw);
    if(id){if(videos.has(id))frame.remove();else{videos.add(id);frame.replaceWith(marker(id));}}
    else if(u)frame.replaceWith(link(u.href,'Obri el document o contingut original'));else frame.remove();
  }
  // WordPress may preserve an oEmbed only as a plain anchor.
  for(const anchor of [...body.querySelectorAll('a[href]')]){
    if(anchor.closest('[data-sdp-youtube]'))continue;
    const id=videoId(anchor.getAttribute('href'));
    if(id&&!videos.has(id)){videos.add(id);anchor.parentNode.insertBefore(marker(id),anchor.nextSibling);}
  }
  for(const h of [...body.querySelectorAll('h1,h2')]){const next=doc.createElement('h3');next.append(...h.childNodes);h.replaceWith(next);}
  for(const a of [...body.querySelectorAll('a[href]')]){
    const href=a.getAttribute('href')||'';
    if(/^mailto:/i.test(href)&&!CORREUS_INSTITUCIONALS.has(decodeURIComponent(href.slice(7).split('?')[0]).toLowerCase()))a.replaceWith(...a.childNodes);
  }
  const holder=doc.createElement('div');holder.append(body);
  const senseCorreusDeTercers=holder.innerHTML.replace(CORREU,(_m,prefix,correu)=>`${prefix}${CORREUS_INSTITUCIONALS.has(correu.toLowerCase())?correu:'correu de contacte'}`);
  const rewritten=reescriuEnllacosHtmlSocDePobleNet(senseCorreusDeTercers).html;
  const citation=doc.createElement('p');citation.append('Font original: ',link(page.link,'socdepoble.net'),` · WP #${page.id} · Data original: ${page.date} (hora local de WordPress; fus no declarat).`);
  const htmlNet=sanitizeHtml(rewritten+citation.outerHTML,{imatgesPropies:true});
  return Object.freeze({id:page.slug,slug:page.slug,wp_id:page.id,title:page.title,created_at:page.date,
    source_url:page.link,source_sha256:FONT_PAGINES_WP_SHA256,source_date_timezone:'wordpress-local-unqualified',
    content:htmlNet,htmlNet,estat_revisio:'pendent_admin',esImportatWp:true,quarantena:true,
    num_imatges:images.size,imatgesPendents:Object.freeze([...pending]),videos:Object.freeze([...videos]),
    revisioPrivada:true,publicable:pending.size===0});
}

/** R18 · La portada demanada reutilitza l’únic registre WP #619 verificat.
 * Les altres pàgines conserven el seu circuit privat de revisió. */
export async function carregaPortadaImportadaPublica(wpId, { signal } = {}) {
  if (wpId !== 619) return null;
  const pages = await carregaPaginesTrilogiaIMoliWp({ signal });
  const original = pages.find(page => page.id === wpId);
  if (!original) return null;
  const pagina = transformaPaginaTrilogiaIMoliWp(original);
  if (!pagina.publicable || pagina.imatgesPendents.length) throw new Error('WP_MITJANS_PENDENTS');
  return Object.freeze({ ...pagina, quarantena: false, revisioPrivada: false,
    destinacio_workspace: 'arbres-monumentals', estat_revisio: 'portada_canonica' });
}
