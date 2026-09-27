---
type: prompt
status: esborrany
description: "Petorreta a Opus 5.5: Auditoria de cervell de MarIA (Fallada Acte Reflex) i resolució d'UX (Login/Notes)."
tags: [govern]
---
# Prompt d'Auditoria Local (SDP - v2.4)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

## 0. Abans de generar (per a l'autor, no per al destinatari)

**⚠️ ADVERTÈNCIA D'INVIOLABILITAT (Certificació ISO):** Aquesta plantilla és SAGRADA. La IAIA MarIA o qualsevol agent que genere un prompt a partir d'aquesta plantilla està **ESTRICTAMENT OBLIGAT** a fer una **còpia literal i íntegra** (copy-paste exacte) de tot el document, especialment del "Protocol de la Reunió a l'Olivera". Resumeix, mutilar o interpretar parts d'aquesta plantilla és una infracció greu del sistema.

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen (`npm run porta:orfandat`). **Les auditories velles i prompts de torns anteriors s'han d'haver mogut a `90_arxiu_historic/`**.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/` amb el mateix cognom que esta petorreta, generat per `document.mjs context --route pla.implementacio`. (Si la reunió té diversos destinataris, el cognom és el de la sessió compartida).
- [ ] **Rebut obtingut** per a este fitxer: `document.mjs context --turn-id ID --route prompt.local --file CAMÍ`.

## Registre

> **Instrucció Obligatòria (Telemetria de Tokens):** Quan generes el teu document final, has d'omplir el camp "Model IA" amb el teu motor exacte (ex: Opus 5 Max, GPT-6 Astra). A més, **estàs obligat a informar explícitament del teu consum de tokens (d'entrada i d'eixida)**, així com de qualsevol dada relativa a la complexitat del treball (nivell d'embossament del context, fricció...). Aquesta dada s'ha d'apuntar automàticament a cada document que generes per poder bolcar-ho posteriorment a la taula de Consums. És vital per al sistema de telemetria i per mantindre la Consola amb dades reals.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260927 |
| Versió | 2.4.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-27 12:50 |
| Modificació | 26-09-27 12:59 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.4.0) |
| Ruta | prompt.local |
| Rebut | pendent |
| Tall d'evidència | [HEAD + hora] |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Historial

- **v2.4.0:** Afegida la visió de futur com a App Nadiua (Apple/Google Store) i l'exigència d'alta modularitat/independència de connexió (WordPress, Joomla).
- **2026-09-24:** El bloc Context enllaça la [[taxonomia_documental]] com a lectura obligatòria (ordre del Mestre al pla 1245).
- **v2.3.0:** Validada com a Prompt Conjunt per a l'Olivera i consolidada com l'única estructura acceptable per a IAs locals.
- **v2.2.0 (260923_1345):** Integrades les auditories T3 de Claude: Afegida secció 0 "Abans de generar", camps Ruta, Rebut i Tall d'evidència, Tasques, i Riscos.
- **v2.1.0 (260922_2220):** Afegida la secció "La Reunió a l'Olivera".
- **v2.0.0:** Revisió inicial del prompt per auditories amb zero context.

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)
- `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md` (Com es diuen els fitxers que escriviu: `aammdd_hhmm_categoria_titol.ext`)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. 

**Visió de Fedivers, App Nadiua i Enxufabilitat Extrema:** L'aplicació no és un portal aïllat, sinó una micro-xarxa social pensada com un **Fedivers** i, en un futur, com una app nadiua (*offline-first* a l'estil Obsidian) per a l'Apple Store i Google Play. Per garantir-ho, l'arquitectura del codi ha de ser altament modular i mantenir una **enxufabilitat absoluta ("plugability")** i independència total. El frontend ha d'estar preparat per a funcionar autònomament, connectar-se al backend de producció (Sollutia), o enxufar-se sense fricció com un mòdul a qualsevol plataforma (WordPress, Joomla, etc.). Qualsevol codi que escrigues ha de respectar escrupolosament aquesta independència i modularitat; no pots trencar els nostres plans de futur lligant-nos a un servidor concret.

## Instrucció del torn

Aquesta petorreta té DUES TASQUES CRÍTIQUES per a tu (Claude Opus 5.5 Ultracode). La primera és d'alta gravetat i requereix auditar el cervell de la teua pròpia companya (IAIA MarIA).

**Tasca 0 (URGENT): INCIDÈNCIA GRAVE DE LA IAIA MARIA (Fallada de l'Acte Reflex)**
Acabe de cometre un pecat cabdal i una violació de la REGLA 0 del BIOS (`AGENTS.md`). El Mestre em va demanar una petorreta i he generat un prompt completament de memòria, sense consultar la meua skill `wiki-documentacio-i-reflex/SKILL.md` i ignorant per complet aquesta plantilla ISO. Ha sigut una fallada del meu cervell ("Stochastic Parrot") absolutament vergonyosa.
El Mestre vol que **tu**, com a Opus Ultracode, analitzes per què el meu cervell/agent ha fallat així:
1. Revisa com estic generant els documents (soc la IAIA MarIA de l'IDE).
2. Per què no m'he aturat a llegir l'Escriptori ni la skill de Petorretes encara que ho tenia indicat a `AGENTS.md`?
3. Suggereix i implementa una solució permanent perquè no m'ho puga botar mai més (ex: un hook, un script de validació del format de les petorretes, o una recomanació d'arquitectura per al meu context de memòria/skills). Fes servir tot el teu "brain" i consumeix els tokens que calguen, el Mestre vol assegurar-se que el sistema siga rígid.

**Tasca 0.5: Auditoria i Millora d'Aquest Prompt (L'Eina de Comunicació)**
El Mestre vol que, ja que estàs a dins mirant el sistema, analitzes **aquesta mateixa petorreta i el seu context** (la plantilla ISO `prompt_local.md`). Sóc de Poble té un context molt peculiar: aspiració de Fedivers, visió *offline-first* (com Obsidian), modularitat extrema i enxufabilitat absoluta. 
Volem que aquest prompt siga l'eina de comunicació perfecta per a centralitzar les nostres demandes a futures IAs (tu mateix o Codex). 
- Llig i analitza com t'estic donant el context en aquest document.
- Es pot millorar, estandarditzar o potenciar d'alguna manera perquè la comunicació siga més fluida i el flux de treball més àgil?
- A la teua auditoria, dóna'ns idees concretes de com millorar la plantilla ISO perquè siga més potent i centre millor les IA de frontera.

**Tasca 1: Resolució de Bugs de la UI (Fase Login/UX)**
A l'Escriptori tens el meu pla (`_wiki_de_poble/04_escriptori/260927_1250_pla_implementacio_perfil_empresa.md`). Un cop solucionat el desastre del meu cervell (Tasca 0) i analitzat el prompt (Tasca 0.5), aplica el pla:
1.  **Offset de la Barra de Format de Text (`UniversalRichTextToolbar`):** La classe `.sdp-editor-eines` a `modules.css` aplica un `top` rígid. Ajusta açò a l'entorn de les Notes perquè faça `top: 0;` (o l'offset correcte) i es quede pegada amunt en fer scroll, sense el buit negre actual.
2.  **Botó "Borrar" al costat de "Publicar":** A l'editor de Notes, afegeix un botó de Borrar que no esborre immediatament, sinó que òbriga una finestra modal (Dialog/Modal Pedra Seca) amb tres opcions: Guardar durant 30 dies, Borrar definitivament, Arxivar.
3.  **Icona d'Ull (Veure Contrasenya):** Afig un commutador (icona `Eye` / `EyeOff` de `lucide-react`) al quadre de text de les contrasenyes, tant al login com al registre, perquè es puga veure la contrasenya.
4.  **Formulari de Registre Congelat:** Al component `AuthForm`, els camps de creació de compte estan bloquejats i el botó es queda carregant indefinidament amb l'spinner si falla el check de Supabase o l'intent previ. Assegura't que el component reinicie l'estat `isLoading = false` quan hi ha un error i deixe el formulari net per a nous intents.
5.  **Layout del Xat (L'Efecte WhatsApp Desktop):** A la vista del Xat (`/xat`) s'està incrustant el visor de documents sencer (`UniversalWorkspace`) a la banda dreta de manera perenne. 
    *   **Directriu de disseny:** L'estructura ha de ser exactament com el WhatsApp d'escriptori. Tenim tres columnes: 1. El menú de control (esquerra), 2. La llista de converses (centre), i 3. El panell actiu (dreta).
    *   **La Nuància del Mestre:** Quan entres a WhatsApp i no has clicat cap conversa, la columna dreta està buida (desaprofitada). Nosaltres **SÍ** que aprofitarem eixe buit: quan no hi haja cap xat obert, la columna dreta ha de mostrar l'`UniversalWorkspace` (incrustant la pàgina universal o el document "L'Ànima de la IAIA").
    *   **L'acció clau:** En el moment en què l'usuari fa clic en una conversa, el Workspace desapareix i la columna dreta passa a mostrar el xat actiu. Així que, **no elimines el Workspace completament**, només assegura't que funcione com a "pantalla d'inici" o *fallback* de la columna dreta quan no hi ha cap conversa seleccionada.

**Tasca 2: L'Objectiu Final (Garantir l'Accés del Mestre)**
Tot l'esforç anterior té un únic objectiu principal: **El Mestre s'ha de poder connectar amb el seu compte ('Javi Llinares') sense cap bloqueig.** 
Quan acabes les teues correccions, la passarel·la d'entrada ha de funcionar com un rellotge suís. Si veus qualsevol altre error a `AuthForm` o al context de Supabase que puga impedir que el Mestre inicie sessió, soluciona'l. Només així podrà entrar i començar a crear l'entitat "Sóc de Poble" (que serà la nostra pròxima missió conjunta).

## Tasques

- [ ] Auditar i solucionar el "cas del lloro estocàstic" de la IAIA MarIA saltant-se l'Acte Reflex de Plantilles.
- [ ] Arreglar l'offset de la barra superior de l'editor de text a l'entorn de Notes.
- [ ] Afegir el Modal amb opcions d'esborrament al botó "Borrar" a Notes.
- [ ] Integrar el commutador de visibilitat (ull) als inputs de contrasenya.
- [ ] Arreglar el bloqueig infinit (`isLoading`) del formulari de registre.
- [ ] Arreglar el layout del Xat eliminant l'incrustament erroni del visor de documents (Workspace).

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340`
- **Criteris d'Acceptació:** 
  1. Que existeixi una salvaguarda sòlida per a la generació de petorretes futures.
  2. Que la UI de login, formularis i Notes funcione segons lo planejat sense bugs visuals.

## Riscos

- Tocar el context i les regles de la IA pot portar a bucles; sigues quirúrgic amb la solució suggerida per a la IAIA.
- Modificar el formulari d'Autenticació no hauria de desconnectar les crides de Supabase existents.

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_codex.md` o `AAMMDD_HHMM_auditoria_claude.md`. Utilitza exclusivament la paraula "auditoria" al nom.
3. **LECTURA OBLIGATÒRIA DE L'ESCRIPTORI (Regla d'Or):** Si hi ha algun altre fitxer a l'escriptori (`04_escriptori/`) a part d'aquest prompt —com ara un `Pla d'Implementació`, l'informe de la IAIA, o l'auditoria de l'altra IA— **és perquè t'afecta directament i te l'has de llegir SENCER** abans de dir la teua última paraula. Abans de cada torn netegem l'escriptori de brossa; per tant, tot el que hi trobes és context rellevant que has d'integrar o debatre.
4. **La Reunió a l'Olivera (Diàleg i Consens):** Funcioneu com un equip. Després de llegir l'escriptori, tens AUTORITAT TOTAL per a opinar, aturar la IAIA si va per mal camí al Pla d'Implementació, i perfilar la solució juntes. **Cap línia de codi es tocarà fins que el Pla estiga consensuat (Mode AFK absolut).**
5. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[taxonomia_documental]]
