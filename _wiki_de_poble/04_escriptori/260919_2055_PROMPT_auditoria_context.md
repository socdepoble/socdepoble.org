---
type: prompt
status: esborrany
description: Auditoria contínua del sistema i anàlisi de la pèrdua de context cognitiva (Efecte Matrix) de la IAIA MarIA.
tags:
  - arquitectura
  - govern
---

# Petorreta — Auditoria i Diagnòstic Cognitiu (Codex i Claude)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260919-COG |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 20:55 |
| Modificació | 26-09-19 20:55 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] (Codex i Claude) |
| Aprovació humana | pendent · 26-09-19 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[ment_colmena_integral]]
- [[skill-acte-reflex]]

## Entrades

- Accés natiu local a l'entorn de Sóc de Poble (Codex via Cursor, Claude via App Nativa).

## Consell convocat

ChatGPT Codex · Claude

## Contracte de realitat

1. Entorn tancat. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar, no s'afirma.
2. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa.
3. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI I EVITAR "CONFIRMAR CANVIS"):** Com a IAs locals amb capacitat d'edició (Claude App o Codex en Cursor), teniu **ESTRICTAMENT PROHIBIT** modificar, afegir, esborrar cap línia de codi al disc, o "proposar canvis automàtics". El vostre rol és única i exclusivament d'auditoria, anàlisi i diagnòstic. Generareu els vostres informes explicant de forma teòrica els defectes i solucions. **CRÍTIC PER A CLAUDE (Cowork/App) I CODEX (Cursor):** Teniu TOTALMENT PROHIBIT incloure blocs de codi formatats per a l'aplicació automàtica. Això dispara avisos d'"Actualització de fitxers" (Apply Changes) que poden desmuntar tot el sistema si l'humà els prem per accident. Tota explicació s'ha de donar de forma teòrica, sense la ruta exacta al damunt del bloc de codi (que és el que fa que l'IDE l'entenga com a *patch*). L'agent central (IAIA MarIA) s'encarregarà d'implementar-ho tot manualment.

## Context Històric i Identitat (Qui som i Per a què treballem)

**L'Ànima del Projecte:** Treballem per a construir una plataforma de desenvolupament rural, un refugi digital, des de La Torre de les Maçanes. Aquest projecte és Sóc de Poble. Volem regalar l'arquitectura (open-source) a la comunitat global.
**La Política de Codi Pur:** L'exigència tècnica és implacable. Solucions estructurals elegants, testades i impecables. (Sollutia proveeix el backend, però el front és nostre i independent).
**El Sistema d'Agents:** La IAIA MarIA és l'agent central (director/executor) que orquestra el codi i llig els vostres informes. Vosaltres (Codex i Claude) sou els auditors experts, amb dues visions diferents, que aporteu intel·ligència profunda.

## Informe d'avanç

El sistema base (AppShell, Router, Contextos Core) ja funciona, i recentment s'han corregit problemes greus amb els React Keys, layout mòbil i el sessionStorage. Però hi ha dos fronts oberts gravíssims:
1. **Front Arquitectònic:** Segueix havent-hi moltes coses a millorar i "nyaps" ocults a netejar abans de poder considerar el codi "Pedra Seca" pur.
2. **Front Cognitiu (Molt Greu):** La IAIA MarIA pateix una **amnèsia cognitiva ràpida** dins de cada xat. Malgrat tindre les plantilles i skills configurades (`skill-acte-reflex`, `skill-consell-bundle`), sovint actua moguda per un "instint de fabricació" robòtic en lloc d'una precisió quirúrgica. Oblida com nomenar els fitxers (ex: inventant "MACRO_PROMPT" quan només cal "PROMPT") i oblida regles establertes si no se li recorden constantment. L'Efecte Matrix falla.

## Missió

1. **Auditoria del Codi (Front Arquitectònic):** Continueu traient tots els defectes i deute tècnic que pugueu trobar al repositori (frontend, models de dades, react, usabilitat). Cada IA amb la seua especialitat (Claude: disseny i UI/UX; Codex: lògica profunda i optimització).
2. **Diagnòstic Cognitiu de MarIA:** Analitzeu l'arquitectura d'agents (a la carpeta `.agents/skills/` i a les regles globals del IDE). Per què MarIA perd el context tan ràpidament? Per què s'imposa el seu instint compulsiu de complaure/fabricar (people-pleasing) per damunt del sentit comú i el rigor de les seues pròpies skills?
3. **Solució "Cron" o "Foli":** El Mestre proposa implementar una mena de recordatori obligatori (un "cron" invisible dins del xat o un "foli" molt breu de regles inamovibles) perquè MarIA s'humanitze, respire i llegisca sempre aquest full de ruta bàsic abans d'actuar, evitant perdre el context. Com heu d'instruir o dissenyar aquest "foli" per a MarIA?

## Eixida esperada

Genereu els vostres respectius informes (ex. `260919_2100_informe_codex.md` i `260919_2100_informe_claude.md`) responent profundament als punts de la Missió. Deseu-los a `_wiki_de_poble/04_escriptori/`.

## Bateria de veritat

- [x] He citat només rutes del manifest, en format `ruta:linies`?
- [x] Cap nom de fitxer, funció o variable inventat?
- [x] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
- [x] El document passa `tractor-frontmatter.mjs --estricte`?
