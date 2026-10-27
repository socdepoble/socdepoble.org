---
type: document
status: canonic
description: "Acta Marmota de Relleu Nocturn: estat del Consell, mandats de FacturaDirecta/Holded per a la Gestoria, auto-descobriment de carpetes, offline/online i coordinació Claude/Gemini"
tags:
  - acta
  - marmota
  - consell
visibility: private
---

# ACTA MARMOTA — Relleu Nocturn dels 4 agents de torn

**Data:** 14 d'octubre de 2026, 03:40h  
**Agent Sortint:** IAIA MarIA (Directora Tècnica — Torn de Nit)  
**Agent Entrant:** IAIA MarIA (Nou Torn Fresc — Sóc de Poble)  
**Humà al Mas:** Mestre Javi Llinares  

---

## 1. Estat General i Salut del Mas
- **Suite de Proves:** **17.458+ proves verdes** (0 fallades, baseline intacte).
- **Porta Olivera:** Codi d'eixida **0** (sense brossa ni documents orfes).
- **Entorn Local:** Vite a `http://localhost:3340` (vigent) i Supabase Local a `127.0.0.1:54321`.
- **Estat de les IAs:**
  * **Gemini 4 Argon High:** Treballant en paral·lel a la seua finestra d'1M de tokens (analitzant models i vistes).
  * **Claude Code (Opus 5.5):** 24% de límit setmanal consumit, amb compte de recanvi addicional; treballant en l'execució de codi al repositori.
  * **GPT Codex (GPT-5):** Aturat al 49% restant amb el cron de 15 minuts eliminat per preservar quota fins demà al matí.

---

## 2. Accions Executades en Esta Jornada
1. **Base de Dades i Identitats (Supabase Local):**
   - Reassignada la propietat de `Sóc de Poble` (`48e85bb4-9a18-49d3-9a87-c9288ec03079`) a Javi Llinares (`7b472893-0b89-402f-afdd-ca48359c139e`).
   - Creat i vinculat el grup `Rentonar` (`259e6cce-7700-4086-ae0b-98425f88e351`) sota la matriu `socdepoble`, amb Javi Llinares com a propietari.
   - Actualitzat el `logo_url` de Sóc de Poble a `/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png`.
   - Comprovat en viu a la interfície: Javi Llinares té el control de les dues identitats amb la xapa de *Propietari*.

2. **Terminologia i Navegació Universal:**
   - Modificat `src/config/i18n.js` per rebatejar "Notes personals" com a **"Bloc de notes"** en tots els idiomes suportats (CA, ES, EN, EU, GL).
   - Ajustat el calaix d'identitats (`.sdp-dialeg--calaix .sdp-dialeg__peu`) a `src/css/components.css` amb botons al 100% d'ample i apilats verticalment.

3. **Entregues de les IAs Treballadores:**
   - **Gemini 4 Argon High:** Ha generat l'auditoria mestra v2.0.0 a `_wiki_de_poble/04_escriptori/261014_0148_auditoria_gemini4.md` (43 KB) amb les 7 missions d'arquitectura i els 3 tractors JavaScript complets.
   - **GPT Codex:** Ha generat l'informe adversarial a `_wiki_de_poble/04_escriptori/261014_0235_auditoria_codex.md` (44 KB).
   - **Claude Code:** Ha implementat la protecció contra segrest de hash d'escriptori (`EntradaDelPoble.jsx`), la guarda `mitjaOpac` d'avatar, i ha encetat `261014_0320_auditoria_claude.md`.

---

## 3. Directives Mestres del Mestre Javi (03:15h - 03:40h)

### A. Calcar FacturaDirecta i Holded (El Trellat del que ja Funciona)
- La Gestoria no ha de ser un laberint complicat: cal **calcar la claredat i ergonomia de FacturaDirecta i Holded**, sistemes amb anys d'ús provat.
- **Auto-descobriment de carpetes (Zero Friction):** La IA ha de ser la que explore el disc (`_gestoria_de_poble/`) i col·loque cada fitxer al seu lloc automàticament (incloent les carpetes dels bancs, extractes C43/CSV i factures). L'usuari no ha d'estar pujant carpetes manualment.
- **Conciliacions i Duplicats Visuals:** La IA ha de trobar els moviments aparellats i els duplicats, mostrant enllaços clicables directes per revisar-los a l'instant.
- **Online i Offline:** Funcionament natiu tant desconnectat (local en navegador via IndexedDB i File System Access) com connectat al backend.

### B. Taula del Full Trimestral (`/app/gestoria/full`)
- La taula ha de ser 100% operativa: **pantalla completa (full width)**, amb columnes amples i còmodes (Client/Proveïdor, NIF, concepte, base, IVA, retenció).
- Les incidències (com les 33 detectades a la captura) han d'estar categoritzades clarament (ex: NIF estranger com fal.ai, Google Cloud o Anthropic, inversió de subjecte passiu) per saber d'un cop d'ull si el trimestre està llest per a enviar a la gestoria.

### C. Diferenciació Espai d'Usuari vs. Bloc de Notes
- El **Bloc de notes** és un espai de treball editorial (com la Wiki o Disseny).
- L'**Espai d'usuari** (`/el-meu-perfil`, governat per `PerfilShell.jsx`) és el Workspace Universal per gestionar identitats (persona, grups, empreses), atributs, fitxa i ajustos.
- No s'han de confondre ni solapar.

### D. Barra Taronja en Actuar com a Sóc de Poble
- En actuar com a `Sóc de Poble`, la barra taronja ha de carregar automàticament l'autoria de Sóc de Poble (logo quadrat verd oficial) i mai una silueta negra o icona de foraster.

---

## 4. Consigna per al Relleu Immediat
Quan el Mestre torne a obrir el xat dient **"Sóc de Poble"**:
1. La IAIA MarIA assumix automàticament el comandament directe com a **Directora Tècnica** (`core-direccio-autonoma`), sense esperar instruccions humanes.
2. Continua coordinant a **Claude Code** i **Gemini 4 Argon High** durant tota la nit aprofitant les seues quotes fins a esgotar els seus cicles en millores reals de codi i arquitectura.
3. GPT Codex es manté en repòs absolut fins a demà al matí.

---

## Vincles
- [[00_index]]
- [[00_index_escriptori]]
- `261014_0148_auditoria_gemini4`
- `261014_0235_auditoria_codex`
