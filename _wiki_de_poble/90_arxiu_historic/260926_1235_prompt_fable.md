---
type: prompt
status: esborrany
description: Prompt per a Fable Medio per implementar la lògica d'usuari i la UI de xat tipus WhatsApp
tags:
  - govern
visibility: private
reflex: sdp:torn_72024433-78cb-475a-8ba5-a10b6360c6e4:bbd13717-1d8e-46ed-b82e-b2be2f41062e
---
# Implementació Identitat Dual i WhatsApp UI

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Abans de generar (per a l'autor, no per al destinatari)

- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen (`npm run porta:orfandat`). **Les auditories velles i prompts de torns anteriors s'han d'haver mogut a `90_arxiu_historic/`**.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/` amb el mateix cognom que esta petorreta, generat per `document.mjs context --route pla.implementacio`. (Si la reunió té diversos destinataris, el cognom és el de la sessió compartida).
- [x] **Rebut obtingut** per a este fitxer: `document.mjs context --turn-id ID --route prompt.local --file CAMÍ`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_72024433-78cb-475a-8ba5-a10b6360c6e4:bbd13717-1d8e-46ed-b82e-b2be2f41062e |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-26T10:32:30.984Z |
| Modificació | 2026-09-26T10:32:30.984Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v2.2.0) |
| Model IA | Fable Máximo (Claude) |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 e0d4d366d2eb965381a5ecc3dd14f33a9bc6b4c0350bcf1e474faab2c5cdfb43. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s3 -->
## Historial

2026-09-26T10:32:30.984Z: esborrany creat; contingut i verificació pendents.
2026-09-26: Instrucció detallada afegida per al Xat i la Identitat Dual.

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

Salutacions, Fable. Després de netejar l'arquitectura base i solucionar els problemes amb l'OS, et demanem que et centres completament en **la part d'usuari i la Identitat Dual**.

**La Visió d'Infraestructura (Xarxa Social Federada):** És vital que tingues clar que aquest sistema naix per a ser una **mini xarxa social hipermodular**. Està dissenyat perquè qualsevol comunitat puga agafar el projecte Creative Commons i muntar el seu propi node (siga basc, català, xinès, etc). En un futur, aquests nodes s'han de poder comunicar entre ells tipus fedivers. L'usuari tindrà un panell de control per decidir quins nodes o persones vol seguir. Per tant, encara que nosaltres estiguem connectats a Supabase/Sollutia, un altre node pot estar en un WordPress o ser un sistema local offline-first. Tota la teua feina d'arquitectura (l'IdentitatContext, el Mur, el Xat) ha d'estar acoblada de forma neta i modular pensant que en el futur aquestes peces suportaran aquesta connexió entre nodes. Mai no faces un codi monolític i preveu aquesta hipermodularitat!

L'objectiu principal és:
1. **Lògica d'usuari per darrere (Funda els tokens ací):** Implementar tot el flux d'inici de sessió, l'enregistrament i la gestió de la "Identitat Dual" (Autor Org vs. Autor Publicador) a través de Supabase (`IdentitatContext`). Aquesta lògica ha de ser completa i 100% interactiva per a l'usuari. Si et sobren tokens, no et talles a gastar-los tots per deixar el registre perfectament esmicolat i llest per funcionar sense pors de perdre dades.
   - **Molt important:** Dins d'aquesta lògica ha d'haver-hi operatius des del primer moment dos mecanismes crítics: (a) la recuperació/exportació completa de les dades de l'usuari, i (b) l'opció de **borrat complet del sistema**. Si un usuari es borra, a nivell de la base de dades s'ha de respectar el que marque la llei (per exemple, "soft delete" o quarantena per seguretat legal durant X temps abans del borrat definitiu), però de cara a l'usuari ha de quedar completament inactiu i hauria de poder tornar a registrar-se des de zero amb el mateix correu. Proposa el patró legal/tècnic més adient.
2. **UI del Xat (El Gran Clon de WhatsApp):** Investiga a fons el funcionament bàsic de WhatsApp i replica'l mil·limètricament al nostre sistema (integrat a l'AppGridShell). L'estratègia és que la gent major del poble veja açò i pense: "però si açò és igual que el WhatsApp!". Necessitem que siga tan familiar, ràpid i fluid com l'original. Has de preparar l'estructura bàsica i les previsions de menús (com els de WhatsApp, però adaptats). NOTA IMPORTANT: No necessitem replicar els "Grups" de WhatsApp (ja que funcionem d'altra manera amb el Mur i les Píndoles), centra't en l'experiència base de missatgeria directa o navegació que coneix l'usuari mitjà.
3. **Redisseny de l'Explorador del Cervell (Graf):** Hem detectat greus problemes d'usabilitat a `ExploradorMapa.jsx`. Necessitem que proposis un redisseny complet amb aquestes premisses:
   - El panell esquerre actual (on ixen els detalls i relacions del node) és "fatal". Inventa't una alternativa molt més usable.
   - El camp de "Filtra per nom" actual ocupa un espai enorme; canvia'l per una lupa de buscar senzilla (una icona que òbriga la cerca) que no gaste tota una fila.
   - Tots els controls inferiors (els filtres, densitat, fletxes, botó refrescar, etc.) s'han de moure a la PART SUPERIOR, formant un "quadre de comandament" visualment fàcil i homogeni.
   - Elimina completament el text "fantasma" de la llegenda que hi ha davall ("Cada punt és una peça del Mas...").
   - El graf interactiu ha de quedar exclusivament a la part inferior de la pàgina, just davall d'aquest nou quadre de comandament.

Volem que preparis la teua auditoria proposant l'estructura, l'arquitectura i el codi necessari per a aconseguir-ho de la manera més expansiva possible. Usa tota la teua potència i funde els tokens per lliurar un codi robust i definitiu. Reflexiona el just i passa a l'acció massiva per muntar aquestes peces.

<!-- SDP:SECTION prompt.local.s5 -->
## Tasques

1. **Lògica de Backend i Identitat:** Analitzar els scripts SQL i components de context per muntar l'estructura d'inici de sessió de Supabase i com suportar la "Identitat Dual".
2. **UI Xat (Clon de WhatsApp):** Proposar els components React/CSS necessaris per replicar el *layout* i fluxos del Xat de WhatsApp, integrats en l'AppGridShell.
3. **Redisseny ExploradorMapa:** Proposar la refactorització de la vista del graf, movent els filtres a dalt, millorant el panell de detalls del node i posant el llenç a baix.
4. **Pla d'acció:** Enumerar els passos d'execució necessaris per implementar aquestes peces de manera progressiva i testable.

<!-- SDP:SECTION prompt.local.s6 -->
## Riscos

- **Col·lisió d'Estils CSS:** El Xat podria trencar variables del disseny general o fer un mal ús dels tokens Pedra Seca. Cal ser rigorosos amb l'ús de `--app-grid-*` i l'estructura flexible.
- **Rendiment en Xat en Temps Real:** Si enfoquem mal la càrrega inicial del context, podem tindre problemes de memòria o "re-renders" continus al Workspace.
- **Acoblament (Vendor Lock-in):** Ens hem d'assegurar que la capa de Supabase i el proveïdor no envaisca excessivament els components de presentació de React.

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
