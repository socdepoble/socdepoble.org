/**
 * useSkillsPubliques.js — D4 Opció B (v1.2.26 · Lectura diferida de skills).
 *
 * Consumix el contracte públic segellat per C26-4 (`public/md/skills/index.json`):
 *   { generatedAt, total, skills: [{ name, title, description, tags, core, url, bytes }] }
 * Zero pes al bundle WP d'arrencada i degradació silenciosa si el fitxer no és
 * disponible.
 */
import { useEffect, useState } from 'react';
import { resolveAsset } from '../../config/assetResolver.js';

export const RUTA_INDEX_SKILLS = '/md/skills/index.json';
export const CARPETA_SKILLS_ID = 'folder:skills';
export const PREFIX_ID_SKILL = 'skill:';

const ESTAT_INICIAL = Object.freeze({
  estat: 'idle',
  skills: Object.freeze([]),
  total: 0,
  generatedAt: null,
  error: null
});

let cauMemoria = null;
let promesaEnCurs = null;

export function resetSkillsPubliquesCachePerTests() {
  cauMemoria = null;
  promesaEnCurs = null;
}

export function esUrlSkillSegura(url) {
  if (typeof url !== 'string') return false;
  const net = url.trim();
  if (!net.startsWith('/md/skills/') || !net.endsWith('.md')) return false;
  if (net.includes('..') || net.includes('\\') || /\s/.test(net)) return false;
  return /^\/md\/skills\/[a-z0-9._-]+\.md$/i.test(net);
}

export function normalitzaSkillPublica(entrada) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) return null;
  const name = typeof entrada.name === 'string' ? entrada.name.trim() : '';
  if (!name || !/^[a-z0-9._-]+$/i.test(name)) return null;
  const url = esUrlSkillSegura(entrada.url) ? entrada.url.trim() : `/md/skills/${name}.md`;
  const title = typeof entrada.title === 'string' && entrada.title.trim() ? entrada.title.trim() : name;
  const description = typeof entrada.description === 'string' ? entrada.description.trim() : '';
  const tags = Array.isArray(entrada.tags)
    ? entrada.tags.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim())
    : [];
  const bytes = Number.isSafeInteger(entrada.bytes) && entrada.bytes >= 0 ? entrada.bytes : 0;
  return Object.freeze({
    name,
    title,
    description,
    tags: Object.freeze(tags),
    core: entrada.core === true,
    url,
    bytes,
    esborrany: entrada.esborrany === true
  });
}

export function normalitzaIndexSkills(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { generatedAt: null, total: 0, skills: [] };
  }
  const llista = Array.isArray(payload.skills)
    ? payload.skills.map(normalitzaSkillPublica).filter(Boolean)
    : [];
  return {
    generatedAt: typeof payload.generatedAt === 'string' ? payload.generatedAt : null,
    total: Number.isSafeInteger(payload.total) && payload.total >= llista.length ? payload.total : llista.length,
    skills: llista
  };
}

export function grupDeSkill(nom) {
  const n = String(nom || '').trim().toLowerCase();
  if (n.startsWith('core-')) return 'folder:skills/core';
  if (n.startsWith('sdp-')) return 'folder:skills/sdp';
  if (n.startsWith('wiki-')) return 'folder:skills/wiki';
  return 'folder:skills/altres';
}

export function itemsICategoriesDeSkills(skills, tx) {
  const llista = Array.isArray(skills) ? skills : [];
  const subcarpetes = [
    { id: 'folder:skills/core', parentId: CARPETA_SKILLS_ID, label: tx.wikidepobleSkillsGrupNucli, icon: '🧠' },
    { id: 'folder:skills/sdp', parentId: CARPETA_SKILLS_ID, label: tx.wikidepobleSkillsGrupProducte, icon: '🧱' },
    { id: 'folder:skills/wiki', parentId: CARPETA_SKILLS_ID, label: tx.wikidepobleSkillsGrupWiki, icon: '📚' },
    { id: 'folder:skills/altres', parentId: CARPETA_SKILLS_ID, label: tx.wikidepobleSkillsGrupAltres, icon: '⚙️' }
  ];
  const presents = new Set(llista.map((s) => grupDeSkill(s.name)));
  const categories = llista.length > 0
    ? [
      { id: CARPETA_SKILLS_ID, label: tx.wikidepobleSkillsCarpeta, icon: '🚜' },
      ...subcarpetes.filter((c) => presents.has(c.id))
    ]
    : [];
  const items = llista.map((skill) => {
    const grup = grupDeSkill(skill.name);
    return {
      id: `${PREFIX_ID_SKILL}${skill.name}`,
      icon: skill.core ? '🧠' : '🚜',
      title: skill.title,
      subtitle: skill.name,
      lead: skill.description,
      categoryId: grup,
      categoryIds: [CARPETA_SKILLS_ID, grup],
      tags: skill.tags,
      esborrany: skill.esborrany === true,
      noindex: skill.esborrany === true,
      skill,
      attributes: {
        type: 'Skill',
        status: skill.esborrany ? 'esborrany' : 'canonic',
        description: skill.description
      },
      content: ''
    };
  });
  return { categories, items };
}

export async function carregaIndexSkillsPubliques(fetchImpl = globalThis.fetch) {
  if (cauMemoria) return cauMemoria;
  if (promesaEnCurs) return promesaEnCurs;
  if (typeof fetchImpl !== 'function') {
    return { estat: 'error', skills: [], total: 0, generatedAt: null, error: 'fetch_no_disponible' };
  }
  promesaEnCurs = (async () => {
    try {
      const resposta = await fetchImpl(resolveAsset(RUTA_INDEX_SKILLS), { headers: { Accept: 'application/json' }, credentials: 'omit', redirect: 'error' });
      if (!resposta || !resposta.ok) {
        return { estat: 'error', skills: [], total: 0, generatedAt: null, error: `http_${resposta?.status ?? 0}` };
      }
      const dades = await resposta.json();
      const normalitzat = normalitzaIndexSkills(dades);
      cauMemoria = { estat: 'ready', ...normalitzat, error: null };
      return cauMemoria;
    } catch (err) {
      return { estat: 'error', skills: [], total: 0, generatedAt: null, error: err?.message || 'error_xarxa' };
    } finally {
      promesaEnCurs = null;
    }
  })();
  return promesaEnCurs;
}

export function useSkillsPubliques({ actiu = true } = {}) {
  const [estat, setEstat] = useState(() => (cauMemoria ?? (actiu ? { ...ESTAT_INICIAL, estat: 'loading' } : ESTAT_INICIAL)));

  useEffect(() => {
    if (!actiu) return undefined;
    if (cauMemoria) {
      setEstat(cauMemoria);
      return undefined;
    }
    let viu = true;
    carregaIndexSkillsPubliques().then((resultat) => {
      if (viu) setEstat(resultat);
    });
    return () => { viu = false; };
  }, [actiu]);

  return estat;
}
