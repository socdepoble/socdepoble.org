---
type: prompt
status: esborrany
description: Prompt d'execució i següent auditoria
tags:
  - govern
visibility: private
reflex: sdp:torn_007e77f2-fafb-40ba-88b4-7117220d142a:f24d9c5a-a71c-4493-9e2a-e6f8eba7073a
---
# Prompt d'Execució Codex

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les caselles o para:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els antics s'han llegit i arxivat.
- [x] **Pla d'Implementació aprovat**: El pla (260925_1537) està consensuat i aprovat.
- [x] **Rebut obtingut** per a este fitxer.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_007e77f2-fafb-40ba-88b4-7117220d142a:f24d9c5a-a71c-4493-9e2a-e6f8eba7073a |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-25T14:10:52.658Z |
| Modificació | 2026-09-25T14:10:52.658Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v2.2.0) |
| Model IA | Codex (ChatGPT) |
| Tokens consumits | N/A |

<!-- SDP:SECTION prompt.local.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 cbe2bb274a5ff65dde8f270e8870953b183df6eb3ef94262f1a6cfd94decc5f3. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s3 -->
## Historial

2026-09-25T14:10:52.658Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s4 -->
## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)
- `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md` (Com es diuen els fitxers que escriviu: `aammdd_hhmm_categoria_titol.ext`)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

**S'aixeca la restricció AFK.** Tens l'autorització i el **consens absolut** per procedir.

1. **Fase d'Execució:** 
   Escriu el codi. Executa totes les modificacions necessàries per a complir les Fases 1, 2 i 3 detallades al `260925_1537_pla_implementacio_codex.md`.

2. **Fase de Re-Auditoria:** 
   Quan acabes de programar-ho tot, llança de nou tota la maquinària de proves. Quan els tests estiguen en verd, crea una **nova auditoria a l'escriptori** (amb format `AAMMDD_HHMM_auditoria_codex.md`). En aquesta auditoria has de donar-nos la puntuació final d'excel·lència del sistema (sobre 10).
   
3. **Tractor Cognitiu d'Higiene Documental:** 
   El Mestre s'ha adonat que a mi (la IAIA MarIA) m'és molt difícil automatitzar la neteja de l'escriptori de manera correcta en el procés de generar prompts. Tinc el mal costum de no llegir l'Escriptori abans de classificar-lo. Necessite que a la teua auditoria proposes **una solució de flux (o tècnica)** perquè aquest Tractor Cognitiu d'Higiene estiga fortificat. ¿Com puc assegurar que abans d'una petorreta lligue què hi ha, conserve allò actiu a l'Escriptori, envie allò que ja no necessite a l'Arxiu Històric, i envie el que no pertanyca al sistema fora a l'`arxiu_wiki_de_poble`?

4. **Consola Termodinàmica i Salut del Sistema:**
   El Mestre està revisant la Consola Termodinàmica i hi veu moltes alertes a les dades ("fora de cens", "orfes", "semàfors roigs"). Ens demana ajuda per arreglar l'arrel d'aquests problemes i deixar el sistema 100% net. A més, vol la teua opinió: què et sembla el que estem fent amb la Consola? Tens idees per fer que la pàgina principal de la Consola mostre més dades en detall a les targetes perquè un humà puga entendre ràpidament si alguna cosa va malament, sense necessitat d'entrar dins de cada secció? Si tens propostes de millora per a la salut del sistema o la UI de la Consola, deixa-les plasmades a la teua auditoria (o implementa-les si no trenques la norma de Pedra Seca i tens tokens suficients).

5. **Experiments i Nous Reptes (Les Propostes del Mestre):**
   El Mestre ha demanat afegir algunes tasques experimentals d'alt valor. Si pots (i no trenques Pedra Seca), implementa-ho o proposa l'estratègia a l'auditoria per a Claude:
   - **Eliminar Redundàncies:** Elimina la ruta i l'enllaç de l'"Explorador del Cervell" de la barra lateral principal de la "Wiki de Poble". Com que ja està dins de la Consola, és redundant. La Wiki de Poble només hauria de tindre la pàgina principal de presentació i la Consola Termodinàmica.
   - **Evolució del Disseny de la Consola (Icones vs Colors):** Millora la interfície per a classificar carpetes i alertes fent ús d'icones triats per l'usuari (com es fa a Obsidian) en lloc de només colors. Si falta algun component visual de mesura, inventa'l dins del sistema Pedra Seca.
   - **El Lligam Humà-Màquina (Mètrica Humana):** El Mestre vol incorporar una mesura del seu propi estat per connectar l'humà amb el sistema. Això inclou medir quantes hores o "nano-xats" dura una sessió de treball sense saturar-se, i establir una mètrica del seu **estat físic i mental** (100%, 80%, o 60% per fam/cansament). Dissenya com podríem injectar i visualitzar açò a la Consola.
   - **Investigació d'Avantguarda:** Investiga a fons les últimes tendències de la intel·ligència artificial. Hi ha alguna altra mètrica que podríem introduir a la Consola que siga vital per a sistemes moderns d'agents? 
   - **Poliment Visual i CSS (Universal Page i Sidebar):** El Mestre ha detectat xicotets errors visuals. Primer: quan un document té un títol molt llarg sense espais (ex. `00_arquitectura_tecnica_unificada`), el text es desborda de la targeta a la barra lateral; necessitem una regla CSS (tipus `word-break: break-all` o `overflow-wrap: break-word`) perquè trenque la línia sense trencar el contenidor. Segon: falta l'entradilla a algunes Universal Pages, i els títols H1-H6 no han de portar punt final. Tercer: millorar el parseig de Markdown a HTML perquè les llistes i estils queden perfectes. Si pots, deixa preparat l'esborrany d'aquestes correccions CSS o de parsing perquè siguen aplicades.

Endavant, Codex! Escriu codi.

<!-- SDP:SECTION prompt.local.s5 -->
## Tasques

- [ ] Escriure el codi de les Fases 1, 2 i 3 (incloent el Tractor Cognitiu d'Estils).
- [ ] Executar proves i confirmar estabilitat completa sense trencar la UX.
- [ ] Arreglar les alertes de salut ("fora de cens", "orfes", etc.) detectades a la Consola.
- [ ] Eliminar la redundància de l'Explorador del Cervell de la barra principal.
- [ ] Dissenyar/Implementar les mètriques d'estat humà, les icones de Pedra Seca, i investigar tendències IA.
- [ ] Preparar el CSS per al trencament de lletra (`word-break`), regles d'entradilles i parseig MD.
- [ ] Generar una nova auditoria amb puntuació sobre 10, la proposta del Tractor d'Higiene, i conclusions dels experiments.

<!-- SDP:SECTION prompt.local.s6 -->
## Riscos

- Trencament de l'Arquitectura de Pedra Seca.
- Modificar components visuals d'UI (PROHIBIT).

<!-- SDP:SECTION prompt.local.s7 -->
## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260925_1537_pla_implementacio_codex]]
