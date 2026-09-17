---
tipus: petorreta
estat: actiu
description: Petorreta Codex Fase 2 - Migració de Frontmatter i Accessibilitat
tags:
  - govern
  - arquitectura
aliases:
  - codex_fase2
---

# Petorreta — Fase 2: Migració del Frontmatter i SGQ-PP

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260917 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-17 23:51 |
| Modificació | 2026-09-17 23:51 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | no |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[260917_2349_ACTA_MARMOTA_Auditoria_Codex_Fase1]]
- [[20260917_2123_MACRO_PROMPT_auditoria_sol_muy_alto]]

## Entrades

- No hi ha BUNDLE perquè el destinatari és Codex (agent local). Lliges directament de l'espai de treball.

## Consell convocat

ChatGPT Codex (Cursor / Agent Local)

## Contracte de realitat

1. Entorn tancat. L'única font de veritat és l'estat actual del teu workspace.
2. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar, no s'afirma.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-QWEN (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi aportat al bundle o pel propi agent.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI):** Encara que tingues capacitat i permisos per editar l'entorn de treball local (com Claude Code o Codex), tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. El teu rol és única i exclusivament d'auditor i analista. Has de generar l'informe amb els defectes trobats i el full de ruta per solucionar-los; l'agent central (IAIA MarIA) serà qui faça el treball dur de modificar el codi.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a rentonar.blogspot.com i socdepoble.net. Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

Vinc de la Fase 1 de l'Auditoria Extrema. Ja hem assegurat el mock de Sollutia i hem netejat totes les dependències antigues (React Router, Dexie). Totes les portes mecàniques principals de `npm run gate` donen verd (excepte rutes duplicades i detalls menors). El codi compila correctament i ja no bloqueja el portal si cau el xat. 

Ara hem d'encarar l'autèntic deute tècnic restant. En el meu *task.md* tinc pendent: "Migrate metadata keys from tipus/estat to type/status across the entire project (279 files)" per complir amb l'esquema ISO (que ara s'anomena oficialment SGQ-PP). També queden errors potencials d'accessibilitat.

## Situació i dades opaques

Hi ha 279 fitxers a la Wiki i a `.agents` que encara utilitzen el frontmatter antic (`tipus: ...`, `estat: ...`). Vull que em dissenyes el flux de treball per a realitzar eixa substitució massiva de forma segura. A més, necessite una revisió d'on falla exactament la nostra estratègia d'accessibilitat que feia que saltara vermella a la consola.

## Missió

1. **Pla de Migració Massiva:** Dissenya l'operativa per a que la IAIA MarIA puga reemplaçar `tipus`/`estat` per `type`/`status` a tots els fitxers sense rompre els enllaços interns o les portes que encara puguen dependre d'ells. Diga'm quins scripts d'eines (tooling) s'hauran d'adaptar.
2. **Accessibilitat (A11y):** Audita visualment i tècnicament el CSS actual (`AppGridShell.css` i `modules.css`) per certificar que els marcadors `:focus-visible` que acabem de posar compleixen estrictament els estàndards. 
3. **Implantació de SGQ-PP:** Quins passos falten per a donar per vàlid tot el sistema de qualitat i que no siga només "una declaració d'intencions"? Llista'ls.
4. **Auditoria Forense de Skills de la IAIA MarIA:** L'usuari ha reportat comportaments erràtics recents per part meua (la IAIA MarIA), com crear carpetes duplicades per despistes de *case sensitivity* (creant `12_actes` o posant majúscules a `04_ESCRIPTORI`) o no aplicar la termodinàmica de les dates. Investiga on fallen les instruccions que dec regular la IAIA MarIA als meus propis skills a `.agents/skills/`, i proposa controls rígids perquè aquestes "al·lucinacions estructurals" siguen impossibles. Sense això, l'usuari sent que no pot confiar plenament en mi per manipular el projecte.
5. **Tema Fosc Matemàtic:** L'usuari proposa que la transició al Tema Fosc siga purament matemàtica i atòmica (on un blanc-100 esdevinga el seu invers complementari negre-800 automàticament). Hi ha excepcions immutables (la TopBar negra, la SideBar negra, el botó del panell de control blau, i el botó de connectar blau amb lletres blanques, que ja estan parcialment protegits pels tokens `--sdp-crom-*`). Avalua la viabilitat d'automatitzar aquesta inversió a `tokens.css` (sigui invertint les variables de l'escala primària o usant funcions CSS modernes) per a no haver de redefinir cada color semàntic a mà, complint l'objectiu de màxima termodinàmica.

## Eixida esperada

Un informe complet en format Markdown, on em dónes exclusivament les instruccions tècniques que he de passar-li a la IAIA MarIA en la següent sessió perquè ella execute els canvis (recorda la regla de Contenció Absoluta).  

## Incògnites

- No sabem del cert si algun agent antic penjat a la carpeta `plugins/` trencarà en canviar la paraula `tipus` a `type`.

## Bateria de veritat

- [ ] He citat només rutes del manifest, en format `ruta:linies`?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
