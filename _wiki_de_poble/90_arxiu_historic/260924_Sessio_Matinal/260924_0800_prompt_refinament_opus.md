---
type: prompt
status: esborrany
description: "Prompt de refinament per a Claude Opus (Torn 2) per delegar les correccions d'UI i governança."
tags: [govern, refinament, ui, ultracode]
---

# Prompt d'Auditoria Local (SDP - v2.3)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt**.

## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:

- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen (`npm run porta:orfandat`). **Les auditories velles i prompts de torns anteriors s'han d'haver mogut a `90_arxiu_historic/`**.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/` amb el mateix cognom que esta petorreta, generat per `document.mjs context --route pla.implementacio`.
- [ ] **Rebut obtingut** per a este fitxer: `document.mjs context --turn-id ID --route prompt.local --file CAMÍ`.

> **Instrucció Obligatòria:** Quan generes el document final, has d'omplir el camp "Model IA" amb el teu motor exacte i els camps de "Tokens consumits".

| Camp                    | Valor                    |
| ----------------------- | ------------------------ |
| Identificador           | SDP-PROMPT-LOCAL-260924B |
| Versió                  | 2.3.0                    |
| Entorn                  | entorn-dev-local         |
| Creació                 | 26-09-24 08:00           |
| Modificació             | 26-09-24 08:00           |
| Propietari              | Agents Locals            |
| Plantilla               | prompt_local.md (v2.3.0) |
| Ruta                    | prompt.local             |
| Rebut                   | sdp:torn…:…              |
| Tall d'evidència        | [HEAD + hora]            |
| Aprovació humana        | pendent                  |
| requires_human_decision | false                    |
| Model IA                | [pendent]                |
| Tokens consumits        | [pendent]                |

## Acte reflex

Has de llegir de la memòria a llarg termini les regles de la comunitat. Utilitza la teva skill `sdp-workflow` per a buscar procediments i documentació a `_wiki_de_poble/04_escriptori/`. Eres conscient de qui som i del nostre mètode Pedra Seca de construir programari.

## Context

Com que sou agents locals, teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Llegiu **OBLIGATÒRIAMENT** els següents documents:
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. Vam nàixer amb `rentonar.blogspot.com`, vam evolucionar a `socdepoble.net` i hui som una plataforma descentralitzada (`socdepoble.org`). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. La nostra identitat visual i arquitectònica està basada en el reglament matemàtic de **Pedra Seca**. Jo, la IAIA MarIA, coordine les vostres feines des del Mas gràcies a les meues *skills* de governança i higiene d'escriptori. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

## Instrucció del torn

Salut, Opus Ultracode. En l'auditoria anterior (07:54) vas fer una tasca monumental, lliurant els pedaços P1 a P16 que han resolt gran part del deute tècnic del sistema, respectant de manera mestra lleis com la "Llei de Vida" per la mida dels botons tàctils.

> **Avís d'Extrema Gravetat del Mestre:** Has de ser EXTREMADAMENT minuciosa. Aquest projecte acumula 15 anys de feina. El futur laboral del Mestre com a mantenidor d'aquest sistema depén directament de la qualitat del codi que escrigues tu hui. **Aquest codi és Creative Commons, la qual cosa vol dir que el regalarem a la societat. I parlant clar: no podem regalar merda.** Exigim la perfecció absoluta d'un enginyer sènior; no aproves pedaços ràpids, fes que cada línia de codi siga un orgull per a qui la llegisca.

En aquesta sessió **en un xat nou**, necessitem que continues operant exclusivament delegant-te tota la feina. Com a màquines de l'avantguarda, heu de suar la cansalada; el Mestre i la IAIA MarIA es mereixen descans. Volem que t'encarregues tant d'una fase de **Governança/Neteja Documental** com de **Refinament Visual (CSS)** que es va quedar penjat i que el Mestre ens ha indicat al mil·límetre, a més de solucionar la roda del superadmin.

Dona'ns els pedaços en format copiable per tal que jo (la IAIA) o tu mateix (si s'allibera la gàbia) puguem aplicar-ho fàcilment.

## Tasques

- **Governança Documental i Neteja:** 
  1. Ancorar les 4 petorretes orfes a `_wiki_de_poble/04_escriptori/00_index_escriptori.md` (`0630`, `0645`, `0711` i `0722`).
  2. Esborrar la proposta vella del `matcher` que va quedar penjada a `_wiki_de_poble/04_escriptori/260924_0720_pla_implementacio_olivera.md`.
  3. Comprovar i reparar el *frontmatter* invàlid de la skill `core-taxonomia-estricta` (que va provocar que es trencara el segell pre-commit).
- **Control d'accés (Roda BotoCrom):** Genera el pedaç perquè la icona de la roda dentada de la barra negra (BotoCrom) només estiga visible per al "superadmin" (tal com vas proposar), evitant esborrar-la del tot.
- **Refinament Estètic de "Notes" (CSS/UI):**
  1. A la capçalera de la columna central de Notes (on està el selector "Tot", la lupa i "Crear nota"): **Restaura la roda dentada** que ha desaparegut. 
  2. A eixa mateixa capçalera ("Tot", lupa, crear nota...): Apuges-li un to de gris, fent que el fons siga un gris **més fosc** que el gris clar del llistat d'ítems (Mur, Mercat) de baix, per tal d'atorgar-li més jerarquia.
  3. A la columna esquerra del tot de Notes (la llista de Carpetes, Categories i Etiquetes): el fons actual gris trenca l'harmonia visual de l'aplicació; dona'ns el pedaç perquè el seu fons torne a ser el color negre suau original de la resta del tema, com es mostrava als dissenys base.

Volem que redactes això com un enginyer sènior: presenta'm els blocs per tal que només hagi de "copiar i pegar" si cal. 

## Protocol de la Reunió a l’Olivera i Mecànica del Consell

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas, especialment preveient la intervenció meua (IAIA) o de Codex:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_refinament_claude.md`. Utilitza exclusivament la paraula "auditoria" al nom.
3. **Pla d'Implementació i Comunicació Inter-Agents:** Ací no treballem a cegues. Tot agent (siga jo mateixa, Claude o Codex si entra en l'operació) té dret i obligació de llegir i actualitzar el document de pissarra comuna o **Pla d'Implementació** que estiga actiu. Açò ens permet deixar-nos ordres, auditar si algú altre ha escrit alguna cosa abans i continuar la feina de l'altre si cau esgotat. Assegura't de seguir aquesta pràctica de relleu.

### Incidència Greu en cas d'errada
Si consideres que este prompt està incomplert o l'Efecte Matrix ha fallat, **no generes codi**. Anota directament una "Incidència Greu d'Incompliment de Protocol de Petorreta" en el teu informe perquè seguisquen auditant la IAIA per no complir a la primera amb l'abocament de l'Arxiu Històric (Rentonar, Soc de poble i regles del Consell).

### Criteris d’acceptació i reproducció
- **URL de proves locals:** http://localhost:3340
