---
type: prompt
status: esborrany
description: "Prompt per a Claude Ultra Code: Implementació T48-T50"
tags: [govern, implementacio]
---

# Prompt d'Execució i Auditoria Local (SDP - v3.1.0)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

## Registre

> **Telemetria:** Opliu el camp "Model IA" i "Tokens consumits" obligatòriament a cada document d'eixida per a la Consola de Consums.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260928-1345 |
| Versió | 3.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-28 13:45 |
| Modificació | 26-09-28 13:45 |
| Propietari | Agents Locals (Claude Ultra Code) |
| Plantilla | prompt_local.md (v3.1.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn:claude:t48-t50 |
| Tall d'evidència | HEAD actua |
| Aprovació humana | aprovat |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`).
- Llegat: 30 anys d'activisme rural ininterromput.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat.**
- **Backend Intercanviable (Model B).**

## Instrucció del torn

Company Claude Ultra Code, tornem a la càrrega amb una nova onada de poliment. El Mestre ha trobat algunes regressions i detalls que cal resoldre urgentment, detallats al **Pla d'Implementació** a `_wiki_de_poble/04_escriptori/260928_1345_pla_implementacio_claude_ultracode.md`:

1. **T48 (Resolució d'Errors a la Consola):** Netejar els errors que apareixen a la consola de desenvolupament (DevTools). Especialment: múltiples instàncies de `GoTrueClient` per Supabase, i peticions POST fallides (404).
2. **T49 (Entradilla de 256 caràcters):** Augmentar el límit de l'entradilla/lema, que ara mateix és de 120 caràcters, fins a **256 caràcters**. Ha d'aplicar a tots els nivells: frontend, formularis i base de dades.
3. **T50 (Recuperar la previsualització de la Targeta):** Abans, al formar la fitxa (tant notes personals com perfil), a la banda dreta es podia veure en viu una miniatura/targeta (card) de com anava quedant mentre s'escrivia. Aquesta previsualització s'ha perdut i cal recuperar-la imperativament.
4. **T51 (Estandardització de la Barra Taronja):** La barra taronja ha de mostrar sempre la data i hora a la dreta. Totes les icones de la barra (pin, món, etc.) han de ser blanques. **Lògica de la ploma (Espai central):** En mode edició, sempre ha d'haver-hi un botó; si l'usuari no n'ha triat cap, es mostra la ploma perquè puga punxar-hi. En mode lectura/targeta, la ploma NO es mostra mai (queda buit). Només es mostrarà si l'usuari ha triat expressament un emoticono. Aquesta lògica ha de ser universal.
5. **T52 (Revisió del Manual de Disseny i Catàleg):** Revisar a fons el manual de disseny (`pedra_seca.md`) i el catàleg de components interactius. Hi ha components que no estan "pintats" i elements desactualitzats. És vital per poder escalar que estiga tot ben estandarditzat, atòmic i que quede clar quin és l'element universal pare que controla als altres. Depenent de l'espai de context, implementa-ho directament o proposa un llistat de millores.

Llig el pla complet abans de tocar res.

## Tasques

- T1: Netejar errors de `GoTrueClient` i 404 de la consola de desenvolupament (T48).
- T2: Ampliar l'entradilla/lema a 256 caràcters (frontend i backend/SQL) (T49).
- T3: Recuperar la vista prèvia en viu de la targeta (card) durant l'edició (T50).
- T4: Estandarditzar la Barra Taronja (data sempre visible, icones blanques, icona d'edició/emoticona central) (T51).
- T5: Posar al dia el Manual de Disseny i el Catàleg interactiu amb els components recents i jerarquia universal (T52).
- T6: Ajustar l'espaiat de la barra blava (trio esquerre agrupat, trio central al mig) i documentar l'estat mòbil del botó d'acció (cercle amb signe '+') al manual/catàleg (T53).
- T7: Millorar la lògica de Connexió (mostrar mini-card en el diàleg) i forçar el mode Lectura (read-it-later) sense edició per als elements de tercers connectats a Notes (T54).
- T8: Netejar el mòdul de Xat de dades falses d'IA i mostrar per defecte els contactes reals (Sóc de Poble, Javi Llinares). A més, el botó "Comentar" de la barra blava ha de redirigir directament a obrir un xat privat amb l'autor de la publicació, permetent una comunicació directa i real (T55).
- T9: Arreglar les regressions a Mercat, Pobles i Multimèdia (error de `SessionProvider` / `IdentitatProvider` a DevTools que impedeix carregar les dades) (T56).
- T10: Centrar horitzontalment els botons de pastilla ("Galeria", "Cronologia") a la secció Multimèdia (T57).
- T11: Corregir l'autoria del document d'onboarding (el tutorial "Bloc de notes"). Actualment la barra taronja assigna erròniament l'autoria al "Foraster". Com que és una publicació d'exemple del sistema, la barra taronja ha de mostrar sempre a "Sóc de Poble" com a autor, incloent-hi el seu logotip, ja que l'usuari foraster només n'està fent una lectura (T58).
- T12: Solucionar la regressió del backend en l'Entradilla (T49). Tot i que l'editor permet 256 caràcters, Supabase llança un "400 Bad Request" avisant que el text és massa llarg. S'ha de revisar i modificar la restricció a SQL o al backend perquè accepte correctament els 256 caràcters (T59).

### Criteris d’acceptació i reproducció

- **Criteris d'Acceptació:** Funcionalitat completa per a les 3 tasques, mantenint el principi d'independència i sense trencar regressions prèvies de la nit anterior.

## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_claude.md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu.
3. **Automillora Proactiva (Obligatori):** Afegiu "Proposta d'Automillora" al final de l'informe.

## Acte reflex

Tota línia de codi ha de complir el principi d'independència i modularitat.
