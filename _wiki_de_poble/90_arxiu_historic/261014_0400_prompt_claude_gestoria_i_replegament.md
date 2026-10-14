---
type: prompt
status: esborrany
description: 'Prompt executiu per a Claude Code: confirmació del commit de les 2 onades, implementació de la taula de gestoria a pantalla completa, consolidació del plegat de barres laterals i avatar verd de Sóc de Poble'
tags:
  - govern
visibility: private
reflex: sdp:torn_dfd3a753-a75b-4317-9332-814fce86cb2f:2e8e4bb7-c6cc-4212-848f-6847cb6714ac
---
# PROMPT CLAUDE: Gestoria Full Width, Replegament Universal i Logo Sóc de Poble

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Verificat Escriptori net per la Porta Olivera (codi 0). Baseline intacte amb 17.458+ proves verdes. El Mestre té el servidor Vite engegat a http://localhost:3340 i Supabase Local a 127.0.0.1:54321.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_dfd3a753-a75b-4317-9332-814fce86cb2f:2e8e4bb7-c6cc-4212-848f-6847cb6714ac |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-14T01:52:45.118Z |
| Modificació | 2026-10-14T03:55:00.000Z |
| Propietari | MarIA |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.7.0) |
| Model IA | Claude Opus 5.5 (Ultracode) |
| Tokens consumits | [en curs] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-14T03:55:00.000Z: Prompt lliurat per la IAIA MarIA per al co-working de Claude Code amb Gemini 4 Argon.

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Model B:** Sollutia és l'amfitrió i el soci d'infraestructura de Sóc de Poble: allotja el Web Component, ens pot passar la sessió i ens obri la seua API només en lectura (GET a través de la Frontissa), sense injectar cap backend ni interferir en l'arquitectura o el disseny. Les dades del poble viuen al Supabase de Sóc de Poble, única font de veritat, darrere d'un port neutral (`src/data/backendPort.js`): el frontend, 100% modular, s'enxufa a qualsevol amfitrió (Sollutia, WordPress o Joomla), canviar de backend és una decisió de Sóc de Poble amb una ADR i el kit de conformitat, i sempre podem traure-ho «tot fora».
- **Visió de futur:** Evolució cap al **Fedivers**. El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) de la seua API: entraran per la Frontissa (`src/data/adaptadors/sollutia/`), només en lectura GET i cada recurs amb captura real, traductor i fixture, sense tocar el port de backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Claude, tens el 76% de quota setmanal lliure i el 81% de quota de sessió fresc. La teua tasca és executar el commit pendent i abordar la taula d'alta ergonomia de la Gestoria, el blindatge del patró de plegat lateral (que el Mestre adora per estalviar espai), el logo de Sóc de Poble i la resiliència del context de sessió.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Pas 0: Confirmar el commit pendent:**
   Executa el commit que tens a l'espera al teu terminal (`Fes el commit dels canvis de les dues onades`) per tal de deixar net el llinatge git amb les 17.458+ proves en verd.

2. **Taula del Full Trimestral a Pantalla Completa (`/app/gestoria/full`):**
   - Aplicar el model ergonòmic provat de FacturaDirecta i Holded: pantalla completa (`width: 100%`), sense caixes estretes.
   - Columnes amples i còmodes: Tipus, Data, Factura/Ref, Proveïdor/Client, NIF/CIF, Concepte, Base Imposable, % IVA, Quota IVA, % IRPF, Quota IRPF, Total.
   - Incidències no bloquejants: Les factures d'empreses tecnològiques internacionals (com fal.ai, Google Cloud, Anthropic) han de mostrar la seua condició tributària (inversió de subjecte passiu / serveis intracomunitaris o extracomunitaris) amb claredat didàctica sense alertes vermelles enganyoses, de manera que el Mestre sàpiga d'un cop d'ull que el trimestre està llest per a la gestoria.

3. **Consolidació del Patró de Replegament Universal (Pedra Seca):**
   - El Mestre demana expressament mantindre a tot el sistema la funcionalitat del botó `[|<]` (`PanelLeftClose` / `PanelLeftOpen`) que plega cap a l'esquerra la columna lateral i mostra les icones en format compacte.
   - Assegurar que la transició és neta, sense salts de layout (CLS 0) i que s'aplica fidelment segons l'especificació d'`sdp-app-grid-shell`.

4. **Logo verd oficial de Sóc de Poble a la Barra d'Autoria:**
   - Quan l'usuari actua com a `Sóc de Poble`, la barra taronja ha de carregar automàticament l'autoria oficial amb `/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png`, evitant en qualsevol cas la silueta negra de Foraster.

5. **Guarda a `useIdentitatDeLaBarra` / `TopBar2`:**
   - Evitar el pet de consola `Error: useSession ha de ser usat dins de SessionProvider` quan es munten vistes aïllades o en tests, afegint fallback segur si el context és null.

6. **Suite de proves i informe:**
   - Executar la suite de tests per mantenir el 100% de proves verdes.
   - Generar l'auditoria a `_wiki_de_poble/04_escriptori/261014_HHMM_auditoria_claude.md`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Risc de trencar la graella de `AppGridShell` si s'introdueixen estils inline prohibits per la `design-guard`.
- Risc de regressions en la taula de gestoria si es canvien càlculs fiscals de `src/sections/gestoria/`. Totes les operacions fiscals han de preservar els tests existents.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic i Canal Viu (Execució Paral·lela):** Si treballeu en un Xat Lateral en paral·lel amb una altra IA, actueu de forma coordinada i NO us xafeu mútuament l'Escriptori. Deixeu un informe de progrés a `04_escriptori/` cada 10-15 minuts (o en acabar cada bloc lògic). L'orquestradora (MarIA) ha programat un cron actiu vigilant l'Escriptori exclusivament per al vostre fil i deixarà nous documents de ruta si cal. Llegiu l'Escriptori constantment abans d'actuar. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.
5. **Desconvocatòria i Tancament de Crons («Cadascuna a sa casa»):** Quan l'informe final estiga emés o quan finalitze el torn de treball, és OBLIGATORI aturar i cancel·lar qualsevol cron o schedule recurrent de fons. Està terminantment prohibit deixar processos zombis actius que continuen consumint tokens o bloquegen el tancament de l'aplicació. En acabar, tot agent allibera els seus recursos i cancel·la les seues tasques programades.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 89652d0020c665ffb26152e000fbf97406f3716c40b74f914cab4a04652b3513. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
