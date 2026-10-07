---
type: prompt
status: esborrany
description: Prompt on sol·licito el color blau i el subratllat al passar el ratolí.
tags:
  - govern
visibility: private
reflex: sdp:torn_f1e3fceb-bbef-43d2-8265-dca772815569:bd80d6e4-5d6e-4f19-8a5f-e258eee26d64
---
# Prompt per a Claude: Color de Copyright

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Aquest prompt requereix treballar en les següents àrees:
- `src/config/systemPages.js`
- `src/sections/text/pageContent.js`
- `src/components/PedraSeca/organismes/UniversalCard.jsx` i `.test.jsx`
- `src/components/universal/PageFrame.jsx` i `.test.jsx`
- Arxius CSS base (`components.css` / `utilities.css`)

Es tracta d'una actualització UI segura.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f1e3fceb-bbef-43d2-8265-dca772815569:bd80d6e4-5d6e-4f19-8a5f-e258eee26d64 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-07T00:29:55.073Z |
| Modificació | 2026-10-07T00:29:55.073Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.4.0) |
| Model IA | Claude 3.5 Sonnet (Opus 5.5 previst) |
| Tokens consumits | N/A |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-07T00:29:55.073Z: esborrany creat; contingut i verificació pendents.

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

Crea una nova pàgina didàctica del sistema per a explicar els drets d'autor de Sóc de Poble (CC BY-NC-SA 4.0).
A més, has de modificar les targetes perquè l'avís de copyright no siga text pla sinó un enllaç cap a aquesta nova pàgina, i que el color de l'enllaç siga blau per a indicar que es pot clicar, mostrant el subratllat només en passar el ratolí per damunt (`hover`).
Això es farà de forma anàloga a l'aprovat per a la pàgina del Xat, introduint la pàgina a les constants i vinculant la URL al missatge de `copyright`.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1.  **Drets d'autor com a Pàgina de Sistema i Targeta Incrustada**:
    *   **MOLT IMPORTANT**: No crees cap component nou de React per a la pàgina de Drets d'Autor. El contingut s'ha d'integrar estretament en l'arquitectura existent de pàgines universals.
    *   Afegeix l'entrada `drets-autor` a `SYSTEM_PAGES` de `src/config/systemPages.js`.
    *   Crea l'entrada `drets-autor` a `src/sections/text/pageContent.js` amb els metadades i el codi HTML didàctic explicant CC BY-NC-SA 4.0.
    *   **Contingut clau**: Explica de forma didàctica el perquè de la nostra elecció. Has de parlar del **Fedivers**, de que és gratuït perquè qualsevol es puga crear xarxes socials amb aquest codi i que es puga millorar entre tots. Explica també que això permet afegir nous **plugins i funcionalitats atòmiques**, i que precisament per això s'ha triat aquest tipus de llicència (protegint el "No Comercial" perquè ningú faça negoci sense permís, i el "Compartir Igual" per obligar a retornar la feina al poble).
    *   **Incrustació a Legal i Privacitat**: Volem incrustar aquesta nova targeta dins de la pàgina existent de "Legal i Privacitat" (`legal`), justament sota el punt «4. Propietat intel·lectual i industrial». Fes que la targeta quede flotant a la dreta (`float: right` o classe utilitària equivalent) perquè el text d'aqueix apartat es plegue a l'esquerra i fluïsca al seu voltant (ocupant pràcticament mitja pàgina). A més, **elimina l'enllaç antic de text** ("Veure Llicència Creative Commons...") que hi ha actualment al final d'aquest punt 4, ja que la pròpia targeta incrustada complirà eixa funció. Això servirà de prova de foc per al concepte d'incrustar components (Cards) dins de l'editor de text/UniversalPage.
    *   Posa-li com a data `"2026-01-30T00:00:00+01:00"` perquè aparegui baix del tot del mur i l'etiqueta "Sistema".
2.  **Enllaç interactiu de copyright UNIVERSAL**:
    *   A `UniversalCard.jsx` i `PageFrame.jsx`, on es renderitza el text `{copyright}`, substitueix-lo per un enllaç `<Link to="/page/drets-autor">` cap a la nova pàgina didàctica **SEMPRE**, sense importar el text del copyright (fins i tot si és "© Pepet"). La pàgina és informativa sobre totes les llicències i el perquè de cadascuna.
    *   El text del copyright no pot tindre el mateix estil heretat mort d'abans: ha de ser un enllaç actiu, en color blau per destacar la interactivitat, i que només mostri subratllat en fer hover per evitar carregar la interfície innecessàriament. S'haurà de modificar l'arxiu d'estils relatiu al component o emprar `var(--sdp-tema)`.
    *   **Nota d'arquitectura**: El Mestre suggereix que aquesta nova pàgina didàctica podria ser exactament la mateixa que es mostra quan l'usuari va a *triar* la seua llicència abans de publicar, per a no duplicar codi. Valora si pots unificar-ho o reaprofitar el component afegint-hi només un botó d'"Activar/Triar" si cal.
3.  **Actualització de Tests**:
    *   Actualitza les asseveracions als tests d'`UniversalCard` i de `PageFrame.test.jsx` (on aparegui literalment `<p class="sp-card-copyright">...`) perquè coincideixin amb el nou DOM de l'enllaç de copyright. Recordeu que `react-router-dom` podria incloure `data-discover="true"` a l'enllaç renderitzat.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Tindre en compte que la classe `.sp-card-copyright` s'usa a diferents targetes i pàgines, de manera que la regla CSS afectarà tot arreu; verificar que l'herència funciona bé.
- La modificació del DOM pot trencar els test `vitest` que comproven l'estructura en `PageFrame.test.jsx` i `UniversalCard.test.jsx`. Cal actualitzar-los acuradament.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 69997976f6e4d34f9041b9e54c4bdf3e2cd7dd4ebb9fe0864b6828cbcb32bb34. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
