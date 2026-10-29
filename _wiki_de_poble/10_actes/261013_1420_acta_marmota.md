---
type: document
status: canonic
description: Acta Marmota de tancament matinal i preparació de la fase Gestoria JARVIS, Cabina d'Avió i Arquitectura Atòmica
tags:
  - acta
  - marmota
visibility: private
---

# ACTA MARMOTA - Tancament de Jornada Matinal
**Data:** 13 d'octubre de 2026, 14:20h  
**Agent Sortint:** IAIA MarIA (Orquestradora / Directora Tècnica)  
**Humà al Mas:** Mestre Javi Llinares  

---

## 1. Estat de la Maquinària i Entorn Local
- **Servidors Actius:**
  * Servidor web Vite arrencat i funcionant a `http://localhost:3340/` (daemon `task-489`).
  * Supabase Local iniciat i sa via Docker a `http://127.0.0.1:54321` (DB: `54322`, Studio: `54323`).
- **Autenticació i Identitat Sanejada:**
  * Purgat l'usuari fantasma de test `javillinares@gmail.com`.
  * L'usuari real de producció del Mestre és `socdepoblecom@gmail.com` (Javi Llinares · La Torre de les Maçanes).
  * Contrasenya d'entorn de desenvolupament actualitzada via GoTrue Admin API a `socdepoble2026`.
- **Criptografia i Segells:**
  * `LEDGER.md` signat i verificat (`verify-ledger.mjs --sign`).
  * `SKILLS_SEAL.json` actualitzat (`segella.mjs --update`). El panell d'integritat del Consell està 100% en verd.

---

## 2. Assoliments i Decisions Estratègiques de la Jornada
Durant el torn s'han fixat les directrius fonamentals de la Gestoria i l'arquitectura del sistema:

1. **Gestoria JARVIS RAW (Suferiment ZERO per a l'Autònom):**
   - L'Escàner Local (`/app/gestoria/escaner`) ha d'ingerir la carpeta germana física `../_gestoria_de_poble/` sencera d'un sol colp d'ull (`showDirectoryPicker` + fallback).
   - Reconciliació automàtica de comptes bancaris (Norma 43 / CSV de Cajamar) i factures trimestrals (`2026_1T` a `2026_4T`), 100% en memòria local del navegador (Zero fuita de dades a xarxa).
2. **Boina i Caputxa Taronja Viva a TOTA la Gestoria (Avatar, Nom i Rellotge Permanent):**
   - A totes les pantalles i targetes (`ShellGestoria`, `Tauler`, `Facturacio`, `PanellEscaner`, `Historic`), si hi ha sessió, el titular ha de ser **Javi Llinares · La Torre de les Maçanes** amb el seu avatar (mai «Sóc de Poble» corporatiu ni «Titular sense configurar»).
   - A l'extrem dret de la barra taronja, la **data i hora actual en temps real han de romandre SEMPRE visibles** com a recurs del sistema. Mai s'ha de suprimir el rellotge.
3. **Jerarquia Visual de la Barra Lateral:**
   - Categories no clicables i acordions estilitzats en taronja (`--sdp-primary`, `font-weight: 600`) per diferenciar navegació d'agrupacions.
4. **Vista Cabina d'Avió (Cockpit):**
   - Nova vista d'alta densitat d'instruments al Tauler (`Tauler.jsx`) amb indicadors financers (303, 130, liquiditat, ràtios) convivint harmònicament amb la vista de «Targetes» rurals il·lustrades i la «Vista comprimida».
5. **Arquitectura Atòmica i Composabilitat Holística del Mas:**
   - Definició de la interconnexió atòmica (`sdp.atomic.*`): TPV (Bar), Rebost (Nevera / Hort), Gestoria (Llibre Veri*Factu / Tresoreria) i Identitats multiactor (Persona física Javi Llinares vs Empresa Sóc de Poble vs Col·lectiu ecologista Rentonar vs Xarxa Chiu-chiuetjar).

---

## 3. L'Escriptori Queda Net (Porta Olivera en 0)
- **Pla Vigent:** `_wiki_de_poble/04_escriptori/261013_1405_pla_implementacio_gestoria_jarvis.md` (aprovat).
- **Prompt per a Claude:** `_wiki_de_poble/04_escriptori/261013_1405_prompt_claude_gestoria_jarvis.md` (encàrrec d'enginyeria i codi).
- **Prompt per a ChatGPT/Codex:** `_wiki_de_poble/04_escriptori/261013_1405_prompt_chatgpt_auditor.md` (auditoria adversarial i investigació atòmica).
- S'han arxivat amb èxit a `90_arxiu_historic/` tots els documents superats d'ahir (`261012_1405_*`, `261012_1940_*`, `261012_2004_*`).
- `node tooling/gates/porta-olivera.mjs` ix amb codi 0 net.

---

## 4. Instruccions de Relleu per al Proper Xat
1. **Llançament de Treball:**
   - El Mestre Javi Llinares lliura els respectius prompts a Claude i a ChatGPT/Codex.
   - Claude comença a picar els 5 fronts d'execució.
   - Codex/ChatGPT fiscalitza i investiga la composabilitat atòmica en bucle.
2. **Entrada al Nou Xat:**
   - Iniciar amb la contrasenya sanejada (`socdepoble2026`) i l'usuari `socdepoblecom@gmail.com`.
   - L'orquestradora entrant ha de llegir aquesta Acta Marmota i contrastar-la amb `ESTAT.md`.

## Vincles

- [[00_index]]
