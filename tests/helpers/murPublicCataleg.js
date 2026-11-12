/* D1 Opció A (decisió del Mestre, 261112) · Diu, llegint el catàleg de
   migracions, si el Mur ja es servix al públic com una versió filtrada.
   Ho és només quan, després de l'última concessió a anon de la fila crua de
   public.section_submissions, una migració revoca a anon el SELECT de taula
   i el de columnes (el REVOKE de taula no retira els GRANT de columna de
   2611112005) i crea la RPC public.llig_mur_public. De sèrie, Supabase
   concedix a anon el SELECT de les taules de public: es parteix de fila crua
   llegible. És una guarda de text sobre el catàleg, no una prova de base de
   dades: la prova de veres és la del carril SQL.
   Sense expressions amb retrocés: separa sentències per «;» i compara text
   net en minúscules. Pur sobre una llista [nom, sql] ordenada;
   murPublicDelCataleg() la llig de supabase/migrations. */
import { readdirSync, readFileSync } from 'node:fs';

const DIR = new URL('../../supabase/migrations/', import.meta.url);
const TAULA = ' public.section_submissions ';

const sentencies = (sql) => String(sql).replace(/--[^\n]*/g, ' ').toLowerCase().split(';')
  .map((s) => ` ${s.replace(/\s+/g, ' ').trim()} `);
const ambAnon = (rols) => /\banon\b/.test(rols);
const rolsDespres = (s, separador) => {
  const on = s.indexOf(` on table${TAULA}${separador} `) >= 0 ? s.indexOf(` on table${TAULA}${separador} `) : s.indexOf(` on${TAULA}${separador} `);
  return on < 0 ? null : s.slice(on);
};

export function estatMurPublic(migracions) {
  let taula = true;
  let columnes = false;
  let projeccio = false;
  for (const [, sql] of migracions) {
    for (const s of sentencies(sql)) {
      if (s.startsWith(' create or replace function public.llig_mur_public(') || s.startsWith(' create function public.llig_mur_public(')) projeccio = true;
      if (s.startsWith(' grant ')) {
        const rols = rolsDespres(s, 'to');
        if (rols && ambAnon(rols)) {
          if (s.startsWith(' grant select (')) {
            if (s.includes('owner_user_id') || s.includes('payload')) columnes = true;
          } else if (s.startsWith(' grant select ') || s.startsWith(' grant all ')) {
            taula = true;
          }
        }
      }
      /* També dins d'un execute format('revoke select (%I) …'), sense espai davant. */
      const inici = s.indexOf('revoke ');
      if (inici >= 0) {
        const revoca = ` ${s.slice(inici)}`;
        const rols = rolsDespres(revoca, 'from');
        if (rols && ambAnon(rols)) {
          if (revoca.startsWith(' revoke select on ') || revoca.startsWith(' revoke all on ')) taula = false;
          if (revoca.startsWith(' revoke select (%i) ') || (revoca.startsWith(' revoke select (') && revoca.includes('owner_user_id') && revoca.includes('payload'))) columnes = false;
        }
      }
    }
  }
  return Object.freeze({ filaCrua: taula || columnes, projeccio, filtrat: projeccio && !taula && !columnes });
}

export function murPublicDelCataleg() {
  const fitxers = readdirSync(DIR).filter((nom) => /^\d{10}_[a-z0-9_]+\.sql$/.test(nom)).sort();
  return estatMurPublic(fitxers.map((nom) => [nom, readFileSync(new URL(nom, DIR), 'utf8')]));
}
