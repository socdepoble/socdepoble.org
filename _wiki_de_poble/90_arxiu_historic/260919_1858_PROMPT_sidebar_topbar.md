---
type: prompt
status: esborrany
description: Prompt per a Claude/Codex sobre la correcció de Sidebar i definició de TopBar atòmica.
tags:
  - disseny
  - arquitectura
---

# Petorreta — Sidebar i TopBar Atòmics

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260919 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 18:58 |
| Modificació | 26-09-19 18:58 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[pedra_seca]]
- [[agents-app-grid-shell]]

## Entrades

*(Sense bundle. Teniu accés natiu a l'entorn local.)*

## Consell convocat

Claude, Codex

## Contracte de realitat

1. Entorn tancat. Teniu accés a l'entorn local. L'única font de veritat és l'entorn.
2. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar, no s'afirma.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre Sistema de Disseny (Design System / UI Kit).
4. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI I EVITAR "CONFIRMAR CANVIS"):** Encara que tingues capacitat i permisos per editar l'entorn de treball local, tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. El teu rol és única i exclusivament d'auditor i analista. Genereu l'informe amb els defectes trobats i el disseny ideal. **IMPORTANT:** Tens PROHIBIT emetre artefactes o blocs de codi que disparen la interfície de "Confirmar Canvis" del teu client. No vull donar-li a cap botó; l'agent central (IAIA MarIA) serà qui faça el treball dur de modificar el codi. Dona'm les solucions en blocs de text clar i pla.

## Context Històric i Identitat (Qui som i Per a què treballem)

**L'Ànima del Projecte:** Treballem per a construir una plataforma de desenvolupament rural, un refugi digital, des de La Torre de les Maçanes. Aquest projecte és Sóc de Poble.

**Visió Open-Source i "Estil Obsidian":** Tot el que construïm ací no només és per a nosaltres; la nostra voluntat és regalar-ho a la comunitat global, al pur estil Obsidian (basat en l'Escriptori, arxius Markdown, portable i lliure de tancaments). 

**La Política de Codi Pur ("Zero brossa"):** Com que l'objectiu final és regalar l'arquitectura, l'exigència tècnica és implacable. No volem deixar nyaps, espagueti-code ni "mierda". Calen solucions estructurals elegants, testades i impecables. Volem codi "Pedra Seca" de veritat.

## L'Encàrrec del Mestre

Necessitem fixar dos elements atòmics de l'AppGridShell perquè tinguen un comportament previsible, robust i immortal, evitant regressions futures (actuant a `layout.css`, `App.jsx` i definint-ho a les SKILLs / `pedra_seca.md`).

1. **La Barra Lateral (SideBar):** Actualment, en resolució d'escriptori, la `SideBar` (`nav.app-sidebar`) s'encavalca i tapa el contingut (com es veu a les imatges de depuració recents) en comptes d'empényer-lo per compartir l'ample. El Mestre vol que es restaure el comportament on s'amagava i apareixia segons la grandària de la pantalla, però sobretot **que quede fixat de manera atòmica i a prova de bombes** en el sistema de disseny (`layout.css` / Flexbox general) perquè no es torne a trencar en un futur. La Sidebar ha d'empényer la pàgina central i viure al mateix nivell que el `app-main` i l'`AppGridShell`.
2. **La TopBar (Barra Negra Superior):** Cal garantir la seua estructura immutable de 5 icones a la part dreta (`src/app/App.jsx`):
   - Icona d'Idioma del Sistema (substituir el logo Google Translate per un `Globe` genèric que no induïsca a error respecte a Google).
   - Icona d'Interacció IA (`IaiaIcon` amb la llumeta): En fer clic, NO ha d'anar a `/ia`, sinó que **ha d'obrir un selector d'interacció** (on l'usuari puga triar "No vull res", "IAIA MarIA", i en el futur els 15 agents inactius). El Mestre indica explícitament de recuperar aquest selector de versions antigues o dissenyar el component si no es troba fàcilment. (Per ara un component senzill i atòmic).
   - Icona de Cerca.
   - Icona de Tema (Fosc/Clar).
   - Icona de Perfil.
   - A més, la URL per defecte de la vista completa "L'ànima de la IAIA" ha de canviar-se oficialment a `/iaia`.

## Objectiu de l'Auditoria

Analitzeu els estils i l'estructura (especialment `src/css/layout.css`, `src/css/base.css` i l'esquelet `AppShell` a `src/app/App.jsx`). Detalleu la solució CSS (sense estils inline) i JSX definitiva. Jo (IAIA MarIA) m'encarregaré de picar el codi i actualitzar la pàgina de disseny i les skills corresponents (ex. `agents-app-grid-shell.md`), però primer necessite la vostra anàlisi profunda sobre el CSS atòmic i el JSX.
