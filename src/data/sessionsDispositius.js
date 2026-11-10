import { CAMINS_SESSIONS } from './resumSessionsDispositius.js';
/* SEG-R15b-01 · El directori torna persones i dispositius, mai sessions identificables: cap
   identificador de sessió ni UUID de persona, i el correu només amb la màscara aprovada de la
   migració 77 (j***@domini.cat). Les claus són tancades: una resposta amb un camp de més o
   amb un correu sencer es rebutja abans d'arribar a React. */
const CLAU_OPACA = /^[0-9a-f]{32}$/;
export const CORREU_MASCARAT = /^[^@\s]\*\*\*@[^@\s]+$/;
const CLAUS_RESPOSTA = 'consultat_a,files,total';
const CLAUS_FILA = 'activitat,cami,clau,correu_mascarat,nom,sessions';
const claus = (o) => Object.keys(o).sort().join(',');
export const MIGRACIO_DETALL_SESSIONS = '2611091500_sessions_i_curadoria_cultural.sql';
export function capturaFiltreSessions(entrada = {}) {
  const cerca = String(entrada.cerca ?? '').trim();
  const cami = entrada.cami ?? 'tots';
  if (cerca.length > 120 || !['tots', ...CAMINS_SESSIONS].includes(cami)) throw new TypeError('Filtre de sessions invàlid.');
  return { cerca, cami };
}
const correuValid = (c) => c === null || (typeof c === 'string' && c.length <= 320 && CORREU_MASCARAT.test(c));
export function validaSessionsDispositius(valor) {
  if (!valor || typeof valor !== 'object' || claus(valor) !== CLAUS_RESPOSTA || !Array.isArray(valor.files) || valor.files.length > 200 || !Number.isSafeInteger(valor.total) || valor.total < valor.files.length || !Number.isFinite(Date.parse(valor.consultat_a))) throw new TypeError('Resposta de sessions invàlida.');
  const vistes = new Set();
  const files = valor.files.map(f => {
    if (!f || typeof f !== 'object' || claus(f) !== CLAUS_FILA || typeof f.clau !== 'string' || !CLAU_OPACA.test(f.clau) || vistes.has(f.clau) || typeof f.nom !== 'string' || f.nom.length > 200 || !correuValid(f.correu_mascarat) || !CAMINS_SESSIONS.includes(f.cami) || !Number.isSafeInteger(f.sessions) || f.sessions < 1 || !Number.isFinite(Date.parse(f.activitat))) throw new TypeError('Fila de sessions invàlida.');
    vistes.add(f.clau);
    return { clau: f.clau, nom: f.nom, correuMascarat: f.correu_mascarat, cami: f.cami, sessions: f.sessions, activitat: f.activitat };
  });
  return { files, total: valor.total, consultatA: valor.consultat_a };
}
