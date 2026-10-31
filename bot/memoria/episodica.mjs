// bot/memoria/episodica.mjs — Memòria episòdica segura (Pedra Seca)
// Resums estructurats · zero text literal · hash(JID) · TTL 90 dies · opt-in implícit per ús
// VERSIÓ APEDAÇADA (Seient Núm. 5, agost 2026). Canvis marcats [FIX-n].

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, unlink, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { RUTES } from '../arrels.mjs'; // [FIX-1]

// [FIX-7a] ABANS: les memòries personals dels veïns es guardaven barrejades amb
// els locks de runtime de Baileys (var/baileys-runtime) i penjaven de
// process.cwd(), que divergia de l'arrel d'estat d'index.mjs. ARA: directori
// propi (var/memoria) sota LA MATEIXA arrel d'estat que l'auth i el runtime.
const MEMORY_DIR = RUTES.memoria;
const TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 dies
const MAX_SUMMARY_CHARS = 420;
const MAX_TAGS = 8;

// [FIX-5] Model en un únic punt configurable (drift 2.5 vs 3.5 detectat entre fitxers).
const MODEL_MEMORIA = process.env.IAIA_MODEL_MEMORIA || 'gemini-3.5-flash-lite';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// [FIX-7b] ABANS: la purga només corria a l'arrencada; en mesos de uptime, les
// memòries caducades quedaven al disc (getMemory les esborrava en lectura, però
// un veí que no torna mai deixava el seu fitxer per sempre → incompliment del
// TTL promès). ARA: purga cada 24 h, unref() perquè no bloquege l'apagat.
const PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000;
let purgeTimer = null;
export function programaPurgaPeriodica() {
  if (purgeTimer) return;
  purgeTimer = setInterval(() => { void purgeExpired(); }, PURGE_INTERVAL_MS);
  purgeTimer.unref?.();
}

function hashJid(jid) {
  if (!jid || typeof jid !== 'string') return null;
  return createHash('sha256').update(jid.trim().toLowerCase()).digest('hex').slice(0, 24);
}

function memoryPath(hash) {
  return join(MEMORY_DIR, `memoria_episodica_${hash}.json`);
}

async function ensureDir() {
  await mkdir(MEMORY_DIR, { recursive: true });
}

export async function getMemory(jid) {
  const hash = hashJid(jid);
  if (!hash) return null;

  try {
    await ensureDir();
    const raw = await readFile(memoryPath(hash), 'utf8');
    const data = JSON.parse(raw);

    if (!data?.updatedAt || Date.now() - data.updatedAt > TTL_MS) {
      await unlink(memoryPath(hash)).catch(() => {});
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

// [FIX-7c] Dret a l'oblit executable (RGPD art. 17): fins ara no existia cap
// mecanisme perquè un veí demanara esborrar la seua memòria. Esta funció és el
// primitiu; el cervell pot exposar-la com a tool («IAIA, oblida'm») o el Mestre
// pot cridar-la manualment.
export async function forgetMemory(jid) {
  const hash = hashJid(jid);
  if (!hash) return false;
  try {
    await unlink(memoryPath(hash));
    return true;
  } catch {
    return false;
  }
}

export function formatMemoryForPrompt(memory) {
  if (!memory || !memory.summary) return '';

  const tags = Array.isArray(memory.tags) && memory.tags.length
    ? `Etiquetes: ${memory.tags.slice(0, MAX_TAGS).join(', ')}`
    : '';
  const loops = Array.isArray(memory.openLoops) && memory.openLoops.length
    ? `Coses pendents: ${memory.openLoops.slice(0, 3).join(' · ')}`
    : '';

  return `
[MEMÒRIA EPISÒDICA D'AQUEST VEÍ (resum abstracte, no literal)]
${memory.summary}
${tags}
${loops}
(Utilitza aquesta informació només per anticipar-te amb naturalitat. No digues mai "segons la meua memòria" ni reveles que tens fitxers.)
`.trim();
}

export async function updateMemory(jid, userText, iaiaText) {
  const hash = hashJid(jid);
  if (!hash || !userText?.trim()) return;

  try {
    await ensureDir();
    const existing = await getMemory(jid);

    const prompt = `
Ets un sistema de memòria episòdica per a una veïna digital d'un poble valencià.
Resumeix en 1-3 frases curtes (màxim 80 paraules) el que cal recordar d'aquesta interacció perquè la veïna puga anticipar-se la pròxima vegada.
Regles estrictes:
- Zero dades personals sensibles (números de telèfon, adreces exactes, noms de metges, etc.).
- Zero text literal de la conversa.
- Conserva només: tema principal, estat d'ànim aparent, lloc/esdeveniment si n'hi ha, i possibles "coses pendents".
- Si hi ha una cosa concreta que l'usuari ha demanat recordar (ex: "recorda'm demà..."), posa-la a openLoops.
- Respon NOMÉS amb JSON vàlid, sense markdown ni explicacions:

{
  "summary": "string d'1-3 frases",
  "tags": ["tag1", "tag2"],
  "openLoops": ["cosa pendent 1"]
}

CONVERSA ACTUAL:
Usuari: ${String(userText).slice(0, 1200)}
IAIA: ${String(iaiaText || '').slice(0, 800)}

MEMÒRIA ANTERIOR (si n'hi ha):
${existing ? JSON.stringify({ summary: existing.summary, tags: existing.tags, openLoops: existing.openLoops }) : 'cap'}
`.trim();

    const response = await ai.models.generateContent({
      model: MODEL_MEMORIA, // [FIX-5]
      contents: prompt,
      config: {
        temperature: 0.2,
        maxOutputTokens: 300,
      },
    });

    const raw = (response.text ?? '').trim();
    let parsed;
    try {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        summary: raw.slice(0, MAX_SUMMARY_CHARS) || 'Conversa recent sobre temes del poble.',
        tags: [],
        openLoops: [],
      };
    }

    const summary = String(parsed.summary || '').slice(0, MAX_SUMMARY_CHARS).trim();
    if (!summary) return;

    const record = {
      updatedAt: Date.now(),
      summary,
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.map((t) => String(t).slice(0, 40)).filter(Boolean).slice(0, MAX_TAGS)
        : [],
      openLoops: Array.isArray(parsed.openLoops)
        ? parsed.openLoops.map((t) => String(t).slice(0, 80)).filter(Boolean).slice(0, 5)
        : [],
      version: 1,
    };

    await writeFile(memoryPath(hash), JSON.stringify(record, null, 2), 'utf8');
  } catch (err) {
    console.error('[MEMORIA] Error actualitzant resum:', err?.message || err);
  }
}

export async function purgeExpired() {
  try {
    await ensureDir();
    const files = await readdir(MEMORY_DIR);
    const now = Date.now();
    for (const file of files) {
      if (!file.startsWith('memoria_episodica_') || !file.endsWith('.json')) continue;
      const full = join(MEMORY_DIR, file);
      try {
        const raw = await readFile(full, 'utf8');
        const data = JSON.parse(raw);
        if (!data?.updatedAt || now - data.updatedAt > TTL_MS) {
          await unlink(full);
        }
      } catch {
        await unlink(full).catch(() => {});
      }
    }
  } catch (err) {
    console.error('[MEMORIA] Error en purge:', err?.message || err);
  }
}
