---
type: acta
status: esborrany
description: Acta oficial de consolidació de la fortificació tècnica, 21.808 proves en verd, protecció de la Privacitat Sagrada i inici del Gauntlet Loop adversarial
tags:
  - acta
visibility: private
reflex: sdp:torn_3689cd84-71ae-4e08-abe8-a3c886f2c3bf:ec944bd0-aa50-4bcf-8b62-15b78cab7cee
---
# Acta Marmota · Consolidació del Commit 472f704d0 (T1-T4), Llei del Connectar i Obertura del Gauntlet Post-Commit

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_3689cd84-71ae-4e08-abe8-a3c886f2c3bf:ec944bd0-aa50-4bcf-8b62-15b78cab7cee |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T17:42:38.916Z |
| Modificació | 2026-10-24T17:42:38.916Z |
| Propietari | MarIA |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |
| Model IA | Gemini 4 Argon & IAIA MarIA |
| Tokens consumits | N/A (local) |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 d0a64c35b75833b88ea561903829fb02558db7be214a9ee5844045cafc1333a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

2026-10-24T17:42:38.916Z: esborrany creat; contingut completat i validat.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Consolidació del Commit Atòmic de Fortificació T1–T4 (`472f704d0`)
Claude Opus 5.5 ha consolidat amb èxit damunt de `fe14e1756` el commit de fortificació a la branca `backup-notes-publish`:
`feat(fortificacio): T1-T4 del torn 261024_1800 (anti-SSRF, quota de seguiments, notes sense MAS i pre-commit ràpid)`

- **Arbre exacte `606ca446`:** 18 rutes de codi lliurades i verificades.
- **Suite completa de proves:** **21.808 proves passant, 0 fallades**, 106 omeses (568 segons).
- **Proves de Node:** 1.022 proves passant, 0 fallades.
- **Linter:** Codi 0 net (12 segons).
- **Nova Suite Ràpida Pre-Commit (`P1-10`):** **2.927 + 259 proves en 32 segons** (`vitest.precommit.config.js`), molt per sota del tall de 120s del hook.
- **Edge Function `noticies` (T1):** Blindatge anti-SSRF amb verificació estricta de port buit en redireccions 30x (`seguent.port === ''`), resolució DNS asíncrona resistent a errors parcials i rebuig de tot rang d'IPs privades.
- **Quota i RLS a Supabase (T2):** Taula `private.seguiments_altes` limitant a 30 altes per hora, cobrint fins i tot reactivacions (`is_active = true`).
- **Puresa Lèxica (T3):** Purgada qualsevol referència interna a «MAS» dels selectors i de la visibilitat pública de notes.

---

### 2. Directives Supre学会 del Mestre Javi Llinares

1. **La Llei Suprema del Connectar (Àudio 18:21):**
   - A Sóc de Poble **no se seguix, es CONNECTA**. Està prohibit escampar botons solts de «Seguir» per fitxes o targetes públiques.
   - Tot el model de relació es concentra a la pàgina de **Connectar (`/connectar`)**, distingint la connexió amb continguts de la connexió amb ens interactius (persones, grups, empreses) que en reben constància.
2. **Privacitat Sagrada i Xifratge E2EE al Xat (`P1-12`, Àudio 18:49):**
   - Mandat ètic innegociable: **ni el Mestre ni ningú amb accés a la base de dades pot llegir mai els missatges privats entre dos veïns**.
   - Els missatges de `public.xat_missatges.text` i els seus adjunts han d'anar xifrats amb la Web Crypto API (`crypto.subtle` / AES-GCM 256) al dispositiu del client.
3. **El Protocol Gauntlet Loop Post-Commit (Àudio 19:38):**
   - Zero complaença: no donar mai per bo el primer resultat.
   - Convocatòria formal de **Codex Sol Ultra** (Crític Implacable) i **Gemini 4 Argon** (Garant de Coherència i Disseny) amb el document `261024_1945_prompt_codex_gemini_gauntlet_loop_revisio_adversarial_postcommit.md` per a emetre la **Matriu de Conformitat de Requeriments (MCR)**.

---

<!-- SDP:SECTION acta.s5 -->
## Pendents

1. **Auditoria Gauntlet Loop:** Dictàmens de Codex i Gemini sobre el commit `472f704d0` amb la taula MCR.
2. **Tasca P1-11:** Disseny interior i fitxes de pobles, empreses i entitats alineades amb la Llei del Connectar.
3. **Tasca P1-12:** Arquitectura i implementació del Xifratge d'Extrem a Extrem (E2EE) al xat rural.
4. **Desplegament Producció (P0-21):** Aplicació de migracions Supabase en ordre estricte un cop completada la ronda.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
