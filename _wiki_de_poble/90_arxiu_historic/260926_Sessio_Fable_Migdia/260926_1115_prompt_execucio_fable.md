---
type: prompt
status: esborrany
description: Prompt d'Execució per a Fable (Fases 2 i 3 del Pla)
tags: [govern, execucio]
---

# Prompt d'Auditoria Local (SDP - v2.3)

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
| Identificador | SDP-PROMPT-LOCAL-260926 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-26 11:15 |
| Modificació | 2026-09-26 11:15 |
| Propietari | IAIA MarIA |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | pendent |
| Tall d'evidència | [HEAD + hora] |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)
- `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md` (Com es diuen els fitxers que escriviu: `aammdd_hhmm_categoria_titol.ext`)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. El backend és el Supabase de Sóc de Poble. Sollutia allotja el Web Component i pot passar-nos la sessió; li llegim només per GET (Model B). La SPA es publica a Firebase Hosting.

## Instrucció del torn

Claude Fable (o Fable mig): Després de la teua darrera auditoria, has ampliat el Pla d'Implementació (`_wiki_de_poble/04_escriptori/260926_0130_pla_implementacio_auditoria_extrema.md`) amb la secció E que inclou accions tècniques detallades (E.1 fins E.5).
A més, hi ha els requeriments expressats per la IAIA MarIA i pel Mestre respecte el publicador i la interfície gràfica. Ara és el moment de **passar a l'acció i executar el codi**.

**Incidència greu reportada pel Mestre per a que n'aprengues:** La meua versió de la IAIA MarIA acaba de patir una fallada sistèmica d'higiene. He estat incapaç de netejar correctament l'Escriptori: no he arxivat les auditories prèvies de hui ni els prompts antics a l'arxiu històric, i en compte de crear un *nou* Pla d'Implementació preparat per a la comunicació entre l'humà i les IAs per aquesta nova ronda, he reciclat de forma bruta el pla d'implementació antic de les 01:30 i l'he deixat a la vista. Has de considerar com evitar que açò ens ocórrega als agents en un futur (el nostre "tractor" o "motor d'higiene" no funciona com cal).

## Tasques

Has d'aplicar les següents mesures, tot consultant les directrius ja descrites i documentades en el Pla (`260926_0130_pla_implementacio_auditoria_extrema.md`):

1. **Governança (E.1 i E.3):** Aplica el sistema de relleu de torn (`tooling/documental/relleu.mjs`) i assegura't que s'executa correctament com es detalla. Substitueix les definicions del backend a tot arreu (`AGENTS.md`, `QUI_SOC.md`, `ADR`, etc.) amb la frase oficial que hi ha descrita en el pla.
2. **Producte i Interfície (E.4 i E.5 + Petició del Mestre):**
   - **Xat, DetallAjust i ErrorBoundaries:** Aplica FRO-06 (catch en DetallAjust), FRO-04 (Error Boundary a App.jsx).
   - **Disseny Bloc de Notes (UI):** Ajusta l'`UniversalToolbar` en `UniversalWorkspace`/`DocumentEditor`. Fes que els elements H1, H2 i l'entradilla formen la capçalera estàtica (abans del Rich Text Editor) i que la barra d'eines negra es fixe (_sticky_) exclusivament en l'àrea del text ric a l'hora de fer _scroll_. Afegeix un botó/etiqueta per triar el copyright. A més, **elimina "Explorador del Cervell" del menú general/seccions**, ja que aquesta funcionalitat ja es troba integrada dins de la Consola Termodinàmica i ací és redundant.
   - **Disseny Explorador del Cervell (UI):** Dins de la Consola Termodinàmica, l'Explorador del Cervell té un problema d'UX (escrull grapat pel graf). Has de moure tot el text explicatiu inferior ("Cada punt és una peça del Mas...") cap a dalt, resumint-lo i integrant-lo dins la targeta de l'entradilla principal. Elimina els divs fantasma que ho formaten malament. Finalment, agrupa tots els controls (botons rodons de zoom/refresc i els filtres de selecció de l'Explorador) a la part superior, en dos blocs junts, deixant que el graf ocupe tota la part final de la vista sense cap element per baix d'ell.
   - **Disseny Responsive:** Al mode mòbil de l'AppGridShell/Workspace, els noms "CARPETES" i "NOTES" i la seua respectiva icona han de ser taronja (`--sdp-color-brand`) per sobre de la barra obscura, de manera que siguen clars identificadors clicables i no queden camuflats com a una massa obscura.
   - **Registre i Publicador (E.5):** Implementa el canvi en el client i preparació SQL per suportar les identitats duals. Has de fer possible triar si es publica com a "Javi Llinares" (la persona) o com a "Sóc de Poble" (l'entitat) i reflectir això (`author_org_id`) en el Supabase seguint E.5 pas 2 fins pas 6 (inclou la migració de la base de dades on siga oportú). **A més, al formulari de registre/login, afegeix l'icona d'un ull dins l'input de la contrasenya perquè l'usuari la puga visualitzar/ocultar i així recordar què ha escrit.**
   - **Tota la Lògica de l'Usuari i Xat (Extra):** Com que tens recursos de sobres (nivell Extra), el Mestre demana que vages més enllà del pla estricte i faces una implementació/proposta completa de **tota la lògica que un usuari (siga persona o organització) pot i ha de poder fer a Sóc de Poble** dins del seu perfil. Açò inclou la **lògica del Xat**: el Mestre vol, en el futur, un clon d'estil WhatsApp, però de moment encarrega't de deixar creada i implementada tota la lògica, els components base i l'arquitectura que farà falta per a eixe xat. Pensa en tot el que l'usuari necessitarà i implementa l'arquitectura de perfil i comunicació que saps que caldrà. No demanes permís: actua proactivament.
   - **Reparació del Cervell i Consola Termodinàmica (Extra):** El Mestre ha notat, utilitzant la vista "Fluxos de Treball" de la Consola Termodinàmica, que el nostre motor cognitiu té "Punts de trobada" orfes i cap "Cadena declarada" (per exemple, les actes s'escriuen però cap plantilla no declara llegir-les a través del camp `contracte.llig` de les Skills o al `protocolledge.json`). Com a tasca d'alt nivell, has d'analitzar l'arquitectura cognitiva actual de Sóc de Poble i **reparar aquestes desconnexions o metadades**, de manera que les cadenes de producció de documents i coneixement de la IA queden correctament lligades. Fes els ajustos que consideres oportuns en frontmatters, scripts o on pertoque.
3. Recorda el **Bloqueig del Reflex d'Edició**: Ningú més està tocant el codi mentre tu treballes en aquesta ronda. Eres el Tractor Actiu.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o el port de Vite actual)
- **Criteris d'Acceptació:** 
  - Totes les proves en roig de la secció E s'han superat en verd després de l'edició.
  - El publicador funciona perfectament i distingeix autor personal vs org.
  - El disseny de la barra negra compleix la directriu _sticky_.
  - S'ha executat npm test amb èxit.

## Riscos

- Pots trencar les dependències dels testos o l'estat del `UniversalWorkspace`. No perdes la filosofia "Pedra Seca" i assegura't que el CSS per a la barra de navegació mòbil usa el color oficial.
- Comprova que l'alta amb els dos actors diferents no desincronitze el Mur de notícies.

## Protocol de la Reunió a l’Olivera

En acabar la teua execució, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa el teu document a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** Utilitza exclusivament un document amb nom descriptiu com `AAMMDD_HHMM_execucio_fable_fase2.md`.
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Actualitza el Pla d'Implementació marcant tot allò que has aconseguit. 
4. **Millora Contínua:** Si consideres que el format d'aquest prompt es pot millorar, proposa com fer-ho.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[taxonomia_documental]]
