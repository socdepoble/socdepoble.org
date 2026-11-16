---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-11-11T20:26:24.418Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** c07f78b83

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 2026-11-11T21:21:00+01:00 · MarIA · torn_90b4b884-028e-4b28-95f0-7a5f958f0064 · Onada R20 Nocturna convocada (Zero Deute Tècnic, Commit Unificat R18+R19 i Fortificació 10/10)

- **Configuració d'Autenticació i Mur en Producció completada amb el Mestre (`18:45 – 21:05 CET`):**
  - Activats a Supabase (`adjlvwtxhpclgmnsvwpm`) **Sign in with Apple** (`org.socdepoble.app`) i **Google OAuth** multi-client (`Web` + `iOS 970656428687-lvtv78prb6b85fnmbi0gkbm2srr81jsi` + `Android SHA-1 AC:5F:98...`), actualitzat `ios/App/App/Info.plist` (`CFBundleURLSchemes`) i sincronitzats `ios/` i `android/` (`221.188 B` gzip-9).
  - Aplicada en producció `supabase/migrations/2611112005_mur_lectura_publica_foraster.sql` (`tractor-rls.mjs` `0` infraccions): lectura pública del `/mur` oberta per a visitants sense sessió (`Foraster`) i altres pobles; diagnosticat que les 2 notes de Damià Llorens Jordà a `/notes` estaven en mode `Privat` (`notes_publicades: 0, notes_totals: 2`).
- **Higiene d'Escriptori (`porta-olivera.mjs` `EXIT 0`, sediment `299 <= 300` línies):** Arxivats amb `handoff` a `90_arxiu_historic/` els 7 documents consumits d'`R18/R19`; conservades les 3 auditories finals d'`R19` (`1741` Claude, `1822` Codex, `1951` Carbon) vinculades al Pla `R20`.
- **Convocatòria Ortogonal `Onada R20` (`261111_2112`):** Creats i validats el Pla [[../_wiki_de_poble/90_arxiu_historic/261111_2112_pla_implementacio_onada_r20_zero_deute_commit_unificat_i_fortificacio|261111_2112_pla_implementacio_onada_r20_zero_deute_commit_unificat_i_fortificacio]] i els 3 prompts locals (**Carril 1 Claude**: correccions `P1-ALERGENS-02`/`FITA_R19`/`natiu-build`, assimilació Kits `R19`, Frontissa i `COMMIT R18+R19` + neteja `/app/*` i Vitest; **Carril 2 Codex**: `copublicacio-postgres.test.mjs` real sense `skip`, oblit individual títols IAIA, 7 apps del Panell i lots Vitest; **Carril 3 Gemini Carbon**: UX Pedra Seca «Publicar al Mur» a `/notes`, auditoria CDP `280/375/768/1440px` i tancament 100% òptic Commons).

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.

## Vincles

- [[00_index]]
