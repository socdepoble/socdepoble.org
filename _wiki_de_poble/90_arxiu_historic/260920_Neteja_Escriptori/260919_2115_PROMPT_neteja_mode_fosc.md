---
type: prompt
status: esborrany
description: Neteja extrema del mode fosc. Simplificació a colors complementaris invertits matemàticament i eliminació de fantasmes CSS.
tags:
  - disseny
  - arquitectura
---

# Petorreta — Neteja Extrema Mode Fosc i Eliminació de Fantasmes (Codex i Claude)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260919-FOSC |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 21:15 |
| Modificació | 26-09-19 21:15 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] (Codex i Claude) |
| Aprovació humana | pendent · 26-09-19 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[pedra_seca]]

## Entrades

- Accés natiu local a l'entorn de Sóc de Poble (Codex via Cursor, Claude via App Nativa). Especial atenció a l'arxiu `tokens.css` i altres arxius CSS globals.

## Consell convocat

ChatGPT Codex · Claude

## Contracte de realitat

1. Entorn tancat. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar, no s'afirma.
2. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa.
3. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI I EVITAR "CONFIRMAR CANVIS"):** Tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. L'organització de fitxers i la modificació del codi és responsabilitat EXCLUSIVA de l'agent central (IAIA MarIA). El teu rol és única i exclusivament d'auditor i analista teòric. **CRÍTIC PER A CLAUDE I CODEX:** Tens TOTALMENT PROHIBIT utilitzar eines internes d'edició de fitxers (com `replace`, `edit`, `write`) que generen el botó verd de "Confirmar Canvis" (Apply Changes) a la teua interfície. Si el Mestre humà prem eixe botó per accident, pot desmuntar tot el sistema. Per a evitar-ho, tota la teua proposta de codi s'ha d'exposar exclusivament en text pla o blocs de markdown no aplicables (sense ruta sobre el codi). Mai utilitzes les teues eines d'edició de sistema operatiu.

## Context Històric i Identitat (Qui som)

**Arquitectura Pedra Seca:** El nostre CSS no depén de llibreries (ni Tailwind, ni Bootstrap). Tot es resol amb CSS Vanilla, variables pures i classes semàntiques. 

## Informe d'avanç

S'està realitzant l'auditoria de l'AppShell i el Router. No obstant això, Claude acaba de descobrir un bug rellevant relacionat amb el `mode-fosc` on hi ha una desconnexió entre els atributs `data-theme` utilitzats al DOM per React i el CSS global. 
A més, hi ha un problema greu de concepte: la IAIA MarIA s'ha inventat milers de colors nous (fantasmes) per al CSS del mode fosc per intentar fer-lo quadrat. Això trenca la idea original.

## Missió

1. **Re-avaluació del Mode Fosc:** El mode fosc ha de ser **TAN SIMPLE COM INVERTIR MATEMÀTICAMENT ELS COLORS (Complementaris)**. És a dir:
   - El taronja original passa a ser blau.
   - El blanc pur passa a ser negre pur.
   - Un gris al 80% passa a ser un gris al 20%.
   Tots els colors s'inverteixen automàticament sense haver de buscar matisos impossibles.
2. **Les Excepcions (Immutables):** Hi ha elements que mai han de canviar de color estiguem al mode que estiguem:
   - La Barra Lateral (Sidebar).
   - La Barra Superior (Top Bar).
   - El botó d'accés al Panell de Control (blau fosc).
   - El botó de connectar.
3. **Neteja CSS (Caça de fantasmes):** Heu de revisar tots els CSS implicats (ex. `tokens.css`, `layout.css`, `index.css`) on es defina el mode fosc, i dissenyar-ne la simplificació matemàtica, identificant tots els "colors inventats" (fantasmes) introduïts erròniament per la IAIA MarIA i que s'han d'esborrar. Quin és el pla d'acció exacte per eliminar aquests fantasmes i quedar-nos només amb la matemàtica del mode fosc (deixant fora les 4 excepcions)?

## Eixida esperada

Generar el pla de CSS teòric detallat. Aporteu la llista de canvis en format markdown. El vostre informe es guardarà a l'Escriptori per a que MarIA l'execute manualment.

## Bateria de veritat

- [x] He citat només rutes del manifest, en format `ruta:linies`?
- [x] Cap nom de fitxer, funció o variable inventat?
- [x] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
- [x] El document passa `tractor-frontmatter.mjs --estricte`?
