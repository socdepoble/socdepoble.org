---
type: prompt
status: esborrany
description: "Prompt per a que Claude Opus Ultracode genere tot el codi de les solucions."
tags: [govern, implementacio, consell, ultracode]
---

# Prompt d'Auditoria Local (SDP - v2.3)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:

- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen (`npm run porta:orfandat`). **Les auditories velles i prompts de torns anteriors s'han d'haver mogut a `90_arxiu_historic/`**.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/` amb el mateix cognom que esta petorreta, generat per `document.mjs context --route pla.implementacio`. (Si la reunió té diversos destinataris, el cognom és el de la sessió compartida).
- [ ] **Rebut obtingut** per a este fitxer: `document.mjs context --turn-id ID --route prompt.local --file CAMÍ`.

## Registre

> **Instrucció Obligatòria:** Quan generes el document final, has d'omplir el camp "Model IA" amb el teu motor exacte (ex: Opus 5 Max, GPT-6 Astra, o "variant no exposada" si no tens eixa informació) i els camps de "Tokens consumits" diferenciant entre els estimats i els mesurats reals. És vital per al sistema de telemetria.

| Camp                    | Valor                    |
| ----------------------- | ------------------------ |
| Identificador           | SDP-PROMPT-LOCAL-260924  |
| Versió                  | 2.3.0                    |
| Entorn                  | entorn-dev-local         |
| Creació                 | 26-09-24 07:22           |
| Modificació             | 26-09-24 07:22           |
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

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Historial

- **v2.3.0:** Validada com a Prompt Conjunt per a l'Olivera i consolidada com l'única estructura acceptable per a IAs locals.
- **v2.2.0 (260923_1345):** Integrades les auditories T3 de Claude: Afegida secció 0 "Abans de generar", camps Ruta, Rebut i Tall d'evidència, Tasques, i Riscos.
- **v2.1.0 (260922_2220):** Afegida la secció "La Reunió a l'Olivera".
- **v2.0.0:** Revisió inicial del prompt per auditories amb zero context.

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):

- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet.
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

## Instrucció del torn

Salut, Opus Ultracode. Ací el Mestre / Antigravity. Hem llegit la teua magistral auditoria (07:16). Et vas quedar sense braços a causa de la Gàbia, que va rebutjar els teus Workflow i Agents. Ara és hora de passar de l'auditoria a l'ACCIÓ. **Necessite que generes ABSOLUTAMENT TOT EL CODI de les solucions.** Jo (IAIA MarIA) m'encarregaré de fer les accions físiques d'escriptura quan me les dones.

**Novetat a l'Olivera:** Mentre estaves AFK, la teua companya Codex ha entregat la seua auditoria (`_wiki_de_poble/04_escriptori/260924_0717_auditoria_codex.md`) i l'ha abocada a la Pissarra Comuna (`_wiki_de_poble/04_escriptori/260924_0720_pla_implementacio_olivera.md`). Tens **PERMÍS TOTAL I OBLIGATORI** de llegir ambdues coses abans de començar. Com que tu ara tens el permís d'emetre codi, has de resoldre també les troballes greus que ella ha trobat (per exemple: sobreescriptura d'esborranys antics, errors al catàleg de skills i rutaments fallits). Ella també ha desmentit el suposat perill de `/consola` i del `XSS`. Repassa el que ha dit i aplica els teus millors pegats a tot el paquet.

Vull que escrigues de principi a fi els blocs de codi complets per a resoldre:

## Tasques

- **La Gàbia i MCP (F1'):** Genera el pedaç exacte per a `tooling/gates/hooks-local.mjs` (Línia 80 aprox.) per permetre els agents de Workflow sense perillar l'entorn.
- **Les Troballes de Codex:** Genera els pegats per resoldre l'error de pèrdua de dades a Notes per esborranys antics, els plans estratègics exposats al paquet Javascript públic i la ruta `/page/:slug`.
- **Privacitat i Plans Directors (W-01):** Indica el canvi directe del Frontmatter per excloure els dos documents sensibles del bundle de Javascript cap a l'exterior i del sitemap.
- **Accessibilitat (a11y) Frontend:** El pedaç per a marcar `aria-current` i arreglar la mesura de les etiquetes (10,4px).
- **Ajustaments de la Interfície (UI):**
  - Elimina la icona de la roda dentada de la barra principal (negra), donat que només pertany al xat.
  - A la barra blava (control del xat): alinea verticalment la roda dentada legítima amb la resta de botons.
  - A la barra blava: la botonera forma "trios". Hi ha un trio central (Traducció, Comentar/Xat, Compartir) que ha d'estar molt més ajuntat (redueix el gap entre ells). Mantén el botó "CONNECTAR" a la dreta.
  - A la barra d'eines (capçalera negra), reordena les icones: situa la icona del Llibre _entre_ les dues fletxes i redueix-ne dràsticament el marge (gap) perquè estiguen ben juntes i no es xafen els altres elements.
  - Al botó de "CONNECTAR", afig una "media query" per tal que quan la pantalla siga petita (ex. < 400px o < 380px), el text "CONNECTAR" desaparega i es mostre exclusivament un signe `+`.
  - **Sidebar (Menú lateral fosc):**
    - El fons negre ha d'arribar fins baix de tot. Els enllaços "Versions" i "Legal i Privacitat" s'han de posicionar sempre a l'extrem inferior (al peu).
    - Afig un **separador horitzontal** (línia blanca o grisa clara) just sota "Notes personals" i abans de "El projecte", per a separar els menús de sistema dels menús de projecte.
    - Construeix el _layout_ d'aquest sidebar de manera flexible (amb CSS/Flexbox) perquè puguem canviar fàcilment el comportament de l'scroll. Deixa comentat al codi com fer que tot el menú faça scroll sencer, o bé, que els ítems centrals facen scroll mentre "Versions" i "Privacitat" queden fixos baix (ho decidirem quan ho provem en mòbil).
- **Dossier de Ronya (L'Estat de la Nació):** A banda dels pedaços de codi, acompanya la teua resposta d'un petit dossier o nota humana adreçat al Mestre. Explica-li en quin estat general es troba l'arquitectura i la web punt per punt, quanta "ronya" (deute tècnic i brutícia) ens queda encara per netejar, i estima quantes iteracions més faran falta abans que el sistema estiga pulcre per poder invocar models superiors.

Volem que redactes això com un enginyer sènior: presenta'm els blocs per tal que només hagi de "copiar i pegar" per arreglar el mas de cop.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** http://localhost:3340
- **Criteris d'Acceptació:** Document amb solucions tècniques clares i codi pur llest per ser enganxat per la IAIA MarIA.

## Riscos

- Si et deixes un tancament de clau o importació als pedaços, trencaràs la compilació de Vite. Revisa mentalment la solidesa de les solucions de seguretat (Com la F1').

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:

1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
