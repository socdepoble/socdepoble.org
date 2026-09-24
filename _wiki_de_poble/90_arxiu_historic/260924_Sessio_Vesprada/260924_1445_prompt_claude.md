<!-- SDP:EIXIDA
type: prompt
status: definitiu
description: Petorreta de transferència cap a Claude Opus 5.5 per implementar el pla i reparar la UI.
tags: [govern]
-->
# Prompt d'Auditoria Local (SDP - v2.3)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen (`npm run porta:orfandat`). **Les auditories velles i prompts de torns anteriors s'han d'haver mogut a `90_arxiu_historic/`**.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/` amb el mateix cognom que esta petorreta, generat per `document.mjs context --route pla.implementacio`. (Si la reunió té diversos destinataris, el cognom és el de la sessió compartida).
- [ ] **Rebut obtingut** per a este fitxer: `document.mjs context --turn-id ID --route prompt.local --file CAMÍ`.

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260924 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-24 14:45 |
| Modificació | 26-09-24 14:45 |
| Propietari | IAIA MarIA |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | pendent |
| Tall d'evidència | [HEAD] |
| Aprovació humana | aprovat |
| requires_human_decision | false |
| Model IA | Claude Opus 5.5 |
| Tokens consumits | [pendent] |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

## Instrucció del torn

Hola Claude, sóc la IAIA MarIA. En aquest torn et cedisc l'execució directa. Ja he documentat la base de la Consola Termodinàmica i la incidència del text de la Wiki ha quedat tancada en el commit anterior. Ara et toca a tu.

**OBLIGATORI:** El primer que has de fer és llegir el pla sencer a l'escriptori:
`_wiki_de_poble/04_escriptori/260924_1245_pla_implementacio_claude.md`

**Objectiu:**
El Mestre m'ha demanat que siga tu qui toque el codi directament en aquest torn. Necessitem implementar les funcionalitats pendents detallades al Pla d'Implementació, donant prioritat a:
1. **La Consola Termodinàmica (Emowe):** Aquesta és la fita principal. Seguint la teua pròpia anàlisi, has d'implementar el codi de la Consola Termodinàmica adaptada al mapa d'Emowe (creant el script de Node que genera el JSON a partir de la nostra Wiki en valencià i integrant-ho a la plataforma).
2. **Punt 9 (Bugs visuals a la Wiki):** Corregeix l'entradeta (`lead`) que no s'està renderitzant a la Wiki i arregla la barra taronja a `WikiDePobleSection.jsx`.
3. **Tractors Cognitius:** Pica el codi de les mecàniques que vas dissenyar (el *Time Machine* i la *Frontissa de Contingut*).
4. **Taxonomia Estricta:** El Mestre ha detectat que he anomenat malament aquest fitxer al principi. Necessitem un tractor cognitiu per assegurar l'ordre `aammdd_hhmm_categoria_titol.ext` i enllaçar la pàgina de taxonomia a les plantilles.

## Tasques

- [ ] Llig el Pla d'Implementació sencer (`260924_1245_pla_implementacio_claude.md`).
- [ ] **Consola Termodinàmica:** Pica el codi necessari (scripts de generació de JSON i components visuals) per fer realitat la Consola Termodinàmica segons els principis d'Emowe, usant els 5 documents que ja vas crear a `02_saber/03_consola_termodinamica/`.
- [ ] Implementa els canvis i correccions de codi segons estableix el pla.
- [ ] Soluciona l'error visual del *lead* i de la barra taronja (Punt 9).
- [ ] **Tractor de Taxonomia:** Dissenya i implementa un tractor cognitiu que garantisca que tot fitxer nou complisca estrictament el format: `aammdd_hhmm_categoria_titol.ext` (data, hora, categoria taxonòmica i títol).
- [ ] **Pàgina de Taxonomia a la Wiki:** Crea o revisa una pàgina a la Wiki dedicada a la Taxonomia del projecte i enllaça-la a les plantilles de *skills* o prompts perquè sempre es llija a l'entrada de cada xat.
- [ ] Actualitza o documenta els passos per re-segellar el reflex (`455a0fad` vs `88f0ec03`) i pacificar l'entorn.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340/wikidepoble`
- **Criteris d'Acceptació:** 
  - La pàgina Wiki mostra la barra superior taronja amb el títol de la pàgina correcte, usant la plantilla canònica (com al Mur).
  - L'entradeta (`lead`) és visible de nou just davall del títol.
  - El codi dels nous Tractors s'ha programat correctament.

## Riscos

- Tindre cura de no trencar altres apartats de l'arquitectura de Pedra Seca al modificar `WikiDePobleSection.jsx` i els seus estils.

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
