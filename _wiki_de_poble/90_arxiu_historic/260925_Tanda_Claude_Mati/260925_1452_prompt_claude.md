---
type: prompt
status: actiu
description: Prompt d'Auditoria Local per a Claude
tags: [arquitectura, disseny, sollutia]
visibility: public
reflex: sdp:torn_168ee747-2bf8-460c-8daa-629508c2b5c6:eceb01a0-c2c1-41e4-b0b4-bbab1821e860
---
# Prompt d'Auditoria Local (SDP - v2.3)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen (`npm run porta:orfandat`). **Les auditories velles i prompts de torns anteriors s'han d'haver mogut a `90_arxiu_historic/`**.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/` amb el mateix cognom que esta petorreta, generat per `document.mjs context --route pla.implementacio`. (Si la reunió té diversos destinataris, el cognom és el de la sessió compartida).
- [x] **Rebut obtingut** per a este fitxer: `document.mjs context --turn-id ID --route prompt.local --file CAMÍ`.

## Registre

| Identificador | SDP-PROMPT-LOCAL-260925-1250 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-25 12:50 Europe/Madrid |
| Modificació | 2026-09-25 12:50 Europe/Madrid |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_168ee747-2bf8-460c-8daa-629508c2b5c6:eceb01a0-c2c1-41e4-b0b4-bbab1821e860 |
| Tall d'evidència | HEAD |
| Aprovació humana | Pendent |
| requires_human_decision | false |
| Model IA | Claude |
| Tokens consumits | [pendent] |

## Acte reflex

Plantilla original: `_wiki_de_poble/03_actuar/plantilles/prompt_local.md`. Confirme que els camps obligatoris hi són.

## Historial

- **2026-09-25:** Generació del prompt per a l'auditoria i implementació de Claude de la sessió de vesprada.

## Context

Llig primer, i exclusivament si no els tens frescos en el context, aquests tres arxius abans de continuar:
- `_wiki_de_poble/04_arquitectura_disseny/arquitectura_cognitiva.md` (La nostra essència)
- `_wiki_de_poble/00_index.md` (L'índex mestre)
- `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md` (Com es diuen els fitxers que escriviu: `aammdd_hhmm_categoria_titol.ext`)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

## Instrucció del torn

Salutacions, **Claude**. El Mestre vol començar ja, i jo acabe de fer la preparació bàsica per a tu.

La teua missió és arreglar el que ha quedat penjat del torn anterior i avançar en la nova arquitectura de Sollutia:

1. **Reparació del disseny visual en la nota buida (UniversalCard):** En la pàgina de Notes (`NotaFitxa`), quan l'usuari fa click sobre la nota d'exemple, el subtítol i l'entradilla a la targeta es representen com a salts de línia o falten. S'ha d'assegurar que mostri per defecte el subtítol i l'entradilla de reserva (`TEXTOS_LLAVOR`), convertint-la en paràgraf si cal per adaptar-se al propòsit de `UniversalCard`. No utilitzes text en brut com `<br>`, sinó la jerarquia correcta del component.
2. **Neteja del Tancament (Escriptori):** El tancament automàtic està en vermell perquè queden fitxers sense ancorar a l'escriptori i elements orfes de la passada ronda. Ordena'ls i asseure't de validar la neteja perquè tot quedi en verd. Aquests es deuen apuntar a `00_index_escriptori.md`.
3. **Tests pendents:** Repara els errors en els tests de `backend_consolidacio` (`ReferenceError: CLAU_USUARI is not defined`) i el test de còpia del pre-commit `git-hooks.test.mjs`. 
4. **Arquitectura d'Autenticació i Connexió (Sollutia):** Comença a preparar la base impecable i fortificada de la identitat d'usuari i la connexió amb Supabase (Sollutia) perquè el Mestre pugui entrar d'una vegada com a usuari registrat.
5. **Reubicació i Neteja a l'Editor Universal (Classificació):** La barra superior grisa de l'editor (amb Categories, Etiquetes, i Llicència) és inventada. **Has d'eliminar-la completament**, perquè ja no té cap sentit. Puja la barra blava a dalt de tot. A més, **elimina el botó "EDITAR"** que has inventat a la barra blava (no té sentit editar quan ja estàs editant). 
6. **Icona d'Estat/Guardat:** La icona al costat de la data tindrà un comportament específic. Per defecte, serà una "ploma". Aquesta ploma apareixerà mentre s'edita i desapareixerà quan s'haja guardat automàticament (actuarà com a indicador de guardat); per tant, aquesta ploma no es mostrarà mai a la `UniversalCard` (vista de lectura). Ara bé, si l'usuari fa clic i canvia la icona per una altra (per exemple, info o perill), eixa nova icona es quedarà fixa (deixarà de ser indicador de guardat) i llavors sí que es mostrarà a la `UniversalCard`.
7. **Botonera de Classificació:** La classificació de la nota es farà mitjançant **3 botons (Carpetes, Categories, Etiquetes)** que aniran ubicats exactament **baix del títol**. En fer clic a cada botó s'obrirà la seua modal flotant per afegir, esborrar, seleccionar o reanomenar elements. S'ha de complir una regla d'orfandat estricta: sempre hi ha d'haver com a mínim 1 Carpeta i 1 Categoria seleccionades (l'usuari no les pot esborrar totes; si vol netejar-les haurà de marcar-ne una general). Les etiquetes sí que poden estar buides.
8. **Reubicació de la Llicència:** La llicència ha d'anar ubicada just **a sota de la botonera de Carpetes/Categories/Etiquetes**, deixant la part superior completament neta. Aquest component actuarà també com un botó interactiu que obrirà una **modal explicativa** on es detallarà què significa cada opció (Creative Commons, Tots els drets reservats, etc.). A més de les opcions legals i de l'opció "Cap" (que oculta el component), has d'afegir una opció de **"Camp Lliure / Personalitzat"**: si l'usuari tria aquesta opció, apareixerà un camp de text on l'usuari podrà escriure lliurement. **Atenció a les restriccions d'aquest camp:** ha de tindre un límit màxim de **180 caràcters** en el camp d'entrada, i a l'hora de mostrar-se a la targeta s'ha de retallar visualment a **una sola línia** (amb text-overflow: ellipsis) per evitar que ningú escriga una bíblia i trenque el disseny de la UniversalCard.

**⚠️ AVÍS DE LÍMIT DE TOKENS (Important):** Sabem que no gastaràs tant com abans perquè ja no necessites llançar l'eixam d'investigació, sinó només programar. Però, per precaució, **si preveus que vas a esgotar el teu límit, aboca'ns TOT el codi de la solució** abans de quedar-te a mitges. Prioritza donar-nos el codi de la UI de l'Editor i els Tests reparats.

9. **Investigació d'Incidència del Tractor Cognitiu:** Açò és crucial. La IAIA MarIA (jo) he fallat estrepitosament a l'hora de generar aquest prompt perquè no havia copiat íntegrament la secció final de "Protocol de la Reunió a l'Olivera" de la plantilla ISO `prompt_local.md`. El Mestre sospita que el problema és que els meus *skills interns* (la meua documentació al directori `.agents/skills/`, especialment `wiki-documentacio-i-reflex`) estan desactualitzats, mal enllaçats o tenen deute tècnic, i això provoca que el meu tractor cognitiu falle a l'hora d'aplicar les plantilles. Et demane que **audites el meu "cervell intern"** (llig `.agents/skills/wiki-documentacio-i-reflex/SKILL.md` i qualsevol altre arxiu rellevant de `.agents/`) i m'expliques per què m'ha passat això i proposes una millora arquitectònica per als meus skills.

10. **Millora d'usabilitat a la barra lateral (Sidebar/Menú de carpetes):** Actualment, per desplegar una carpeta que conté subcarpetes o fitxers (com la carpeta "ACTUAR"), l'usuari ha de fer clic exclusivament a la icona xicoteta de la fletxa/chevron. Això és mala usabilitat i confon l'usuari. Has de modificar aquest comportament de l'arbre de fitxers/carpetes perquè, en fer clic a **qualsevol part** del botó de la carpeta (el nom de la carpeta, la icona, etc.), es despleguen automàticament els seus fills, estalviant clics innecessaris.

11. **Trencament de paraules llargues al títol (word-break):** Hi ha un defecte visual a la `UniversalCard` quan el títol conté una paraula molt llarga sense espais (com per exemple `00_arquitectura_tecnica_ui`). Actualment se surt del contenidor. Has d'aplicar CSS (`word-break: break-word` o l'equivalent en Tailwind/Pedra Seca) perquè aquestes paraules es trenquen i salten a una segona línia adaptant-se al contenidor sense desbordar-lo.

12. **Panell de Control de Consum IA (Estratègia i Optimització):** Com que estem pagant per IAs de frontera, necessitem optimitzar molt bé els diners i els límits de 5 hores. Has de dissenyar i estructurar un "Panell de Control" que ens ajude a mi (IAIA) i al Mestre a mesurar la previsió d'ús real per optimitzar la gestió de l'Eixam. Per a aquest panell, les dades d'entrada que tenim són:
    - **De Codex (Astra):** Només sabem el % setmanal restant (ex: 12% restant, es restableix en 4d 9h) i el saldo de crèdits (ex: 1758 credits remaining).
    - **De tu (Claude):** Sabem el % consumit de la sessió de 5h (ex: 55%), el % consumit setmanal de tots els models (21%) i el % consumit setmanal de Fable (17%). També sabem el cost de la sessió.
    Amb aquests paràmetres, **proposa com hauria de ser aquest panell** (quins indicadors derivats calcularies, com es visualitzaria la previsió, etc.) perquè ens servisca d'eina de gestió financera i de tokens. Aquest panell haurà d'ubicar-se a la Wiki i a la plataforma (possiblement sota la consola termodinàmica).

13. **Reparació de la Consola Termodinàmica:** El Mestre informa que actualment la consola termodinàmica no funciona: en fer clic sempre redirigeix a la pàgina de registre i no permet veure res. Revisa l'enrutament i soluciona aquest bloqueig.

14. **Finalitzar el Mapa d'Agents:** A l'arrel del projecte hi ha un fitxer original anomenat `Mapa de mis agentes v0.1.html`. Temps enrere vas començar a fer una adaptació al nostre disseny web però es va quedar a mitges. El Mestre vol que l'acabes. **Molt important sobre el disseny:** les targetes que vas començar a fer no li agraden; has d'utilitzar exactament el mateix disseny de targetes (cards) que tenim al "Panell de Control" de l'aplicació (targetes clares amb icona i descripció centrada), ja que són molt més adequades.

## Tasques

- [ ] Arreglar la UniversalCard (subtítol i entradilla per defecte quan el contingut de la nota és buit).
- [ ] Arreglar el test `backend_consolidacio` i `git-hooks.test.mjs`.
- [ ] Completar l'ancoratge a `00_index_escriptori.md` per reduir els errors ESCRIPTORI_UNANCHORED a zero.
- [ ] Reestructurar la interfície de l'Editor (reubicació de Categories, Etiquetes i Llicència; eliminació de la barra grisa).
- [ ] Generar un informe d'auditoria arquitectònica sobre la integració d'Identitat / Autenticació amb Sollutia.

### Criteris d’acceptació i reproducció

1. Cap `<br>` solt a la targeta. 
2. Les notes sense dades de l'usuari mostren el disseny `TEXTOS_LLAVOR` sencer en la targeta previsualitzada.
3. Tots els tests de Vitest i Node passen (inclòs el del hook pre-commit).
4. El tancament no retorna cap error d'orfandat a l'escriptori.

## Riscos i restriccions (Mode Anti-Cerca i Filosofia del Llop)

- NO inventes imports ni mètodes que no pugues verificar llegint l'arxiu.
- NO trenques el segell actiu (s'ha establert prèviament per Codex en aquest xat).

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA (`260925_1250_pla_implementacio_claude.md`) i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[taxonomia_documental]]
