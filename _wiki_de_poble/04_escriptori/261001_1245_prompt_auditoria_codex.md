---
type: prompt
status: esborrany
description: "Peticio a Codex per auditar el codi de Claude i diagnosticar les mètriques trencades de la Consola Termodinàmica."
tags: [govern]
reflex: "sdp:torn_c320797f-eb16-40bd-9ab3-46549ae407d4:b696e2fe-bfea-449c-9c2f-0daa2bbb00b0"
---
# Prompt d'Execució i Auditoria Local

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

## Registre

> **Telemetria:** Opliu el camp "Model IA" i "Tokens consumits" obligatòriament a cada document d'eixida per a la Consola de Consums.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-261001 |
| Versió del document | 3.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-10-01 12:45 |
| Modificació | 26-10-01 12:45 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v3.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_c320797f-eb16-40bd-9ab3-46549ae407d4:b696e2fe-bfea-449c-9c2f-0daa2bbb00b0 |
| Tall d'evidència | [HEAD + 1245] |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Historial

- **v3.3.0:** Refactorització estructural global. Es canvia el camp de registre "Versió" per "Versió del document" per evitar ambigüitats, exigint una migració a protocolledge.json.
- **v3.2.0:** Incorporada explícitament la Directiva Suprema de l'Enxufabilitat amb Sollutia al Context Tècnic. A més, es força l'agent a buscar contradiccions i duplicitats a la fase d'Automillora de manera explícita.
- **v3.1.0 (260927_1730):** Consolidació històrica. S'afegeix el llegat de 30 anys d'activisme (socdepoble.net) que s'havia perdut, i s'implementa el bloqueig de seguretat on l'Agent Local ha de rebutjar els prompts de MarIA si incompleixen la plantilla o ometen el Pla d'Implementació.
- **v3.0.0 (260927_1505):** Refactorització total cap a un format tècnic, concís i lliure de metàfores (eliminats "Olivera", "Masia"). S'optimitza per claredat tècnica mantenint la visió hipermodular.
- **v2.4.0:** Afegida visió Fedivers i App Nadiua.
- **v2.3.0:** Validada com a estructura única per IAs locals.

## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Backend Intercanviable (Model B):** El servidor actual (Supabase) funciona exclusivament com un endoll. Cap lògica de negoci de la UI ha d'estar fortament acoblada a ell. El sistema ha de poder enxufar-se com a mòdul a WordPress o Joomla sense trencar res.
- **Visió de futur:** Evolució cap al **Fedivers** i App Nadiua (offline-first). El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) del seu backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

## Instrucció del torn

Aquest és un torn **d'Auditoria Estructural i Diagnòstic**. Tens dues missions fonamentals sobre l'arquitectura i el cervell del projecte:

1. **Revisió de l'Escriptori i Validació de Canvis (Calendari i Regressions):** Claude acaba de tancar una marató resolent 4 regressions crítiques (T1-T4) i afegint una funcionalitat de Pantalla Completa ("Mode de closca") al Calendari. Has d'actuar com l'auditor d'aquest codi (Pots revisar els darrers commits). Valida constructivament i destructivament el que ha fet Claude, cercant qualsevol possible fuga de memòria, comportament imprevist a iOS/Safari (especialment amb la Pantalla Completa i el *Shadow DOM* de l'Enxufe), o desincronització de l'estat.

2. **Diagnòstic i Expansió de la Consola Termodinàmica:** El Mestre ha detectat que la "Consola Termodinàmica" (la pàgina que vigila la salut del cervell i els tractors) està trencada o mostrant valors orfes. Taules com "Agents atòmics", "Cadenes de faena" o "Calendari de processos" mostren **0** dades (ex: "0 cadenes", "0 suggeriments", "0 agents atòmics"). S'intueix que falten "tractors cognitius" (skills o procediments) o confirmacions de recepció que connecten l'execució amb l'estat del cervell (per exemple, si un tractor no confirma la recepció, el següent pas se salta o no es registra). A més, el Mestre demana que proposes idees d'autoaprenentatge i noves fórmules de mesurament del cervell (noves mètriques) per detectar fallades de sistema que ara mateix ens passen per alt. Et demanem actuar de forma extremadament **radical i destructiva/constructiva**, proposant formes extremes d'estalviar tokens i madurar la IA.

3. **Revisió Arquitectònica de la Wiki (Classificació i Comunicació):** Estem a punt de crear una estructura (Dossier i Plantilles) per a sistematitzar la Comunicació de Sóc de Poble. Actualment tenim la Wiki estructurada en grans carpetes com `01_ser`, `02_saber`, i `03_actuar`. Avalueu aquesta taxonomia tenint en compte que:
   - **SER** és la nostra identitat i presentació (qui som).
   - **SABER** és l'arquitectura i el coneixement tècnic.
   - **ACTUAR** podria ser el màrqueting pur (tècniques de venda i estratègies cap a l'exterior).
   Addicionalment, el Mestre té una carpeta externa a l'arrel (`_comunicacio_de_poble`, fora del repositori) que conté estudis de mercat i dades sensibles i privades. Hem de decidir com integrar aquests conceptes per a tindre un Pla de Comunicació potent a la Wiki sense comprometre la privacitat d'eixos estudis externs (que no poden filtrar-se mai a l'App o al connector).

## Tasques

- T1: **Auditoria del Codi de Claude:** Llig i valida el codi implementat per a T1-T4 i el Botó de Pantalla Completa. Dona la teua conformitat o detecta forats de seguretat/bugs, especialment pel que fa a l'entorn encapsulat de l'Enxufe (WordPress).
- T2: **Diagnòstic de la Consola:** Analitza el codi de la Consola Termodinàmica (`ConsolaSection.jsx`, etc.) i els sistemes de lectura d'agents. Aplane en taules totes les mètriques i busca patrons on falten connexions (per què algunes targetes reben buit `0`). Defineix quins "tractors cognitius" o confirmacions falten per arreglar el flux de dades.
- T3: **Maduració IA i Estalvi de Tokens:** Proposa conceptualment noves fórmules per mesurar el rendiment, la fatiga o els errors de sistema de la pròpia IA. Proposa mètodes radicals d'auditoria i d'estalvi de tokens per fer que el cervell de la IAIA MarIA siga molt més efectiu, madur i eficient.
- T4: **Auditoria Taxonòmica i de Privacitat:** Avalua l'estructura actual `ser/saber/actuar` de la Wiki tenint en compte la diferència entre identitat i màrqueting. Proposa on i com integrar el futur subsistema de Comunicació per a assegurar-ne l'eficàcia organitzativa. A més, defineix una solució radical (potser mitjançant Obsidian Plugins o RAGs privats) per integrar de forma segura el contingut de la carpeta externa `_comunicacio_de_poble` sense que es filtre al repositori públic.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340/wikidepoble?categoria=consola_termodinamica_cat` per veure les targetes i `http://localhost:3340/calendari` per revisar el codi de Claude.
- **Criteris d'Acceptació:** Has de lliurar una auditoria tècnica on aproves o rebutges els canvis de Claude. També has d'incloure el llistat complet de mètriques de la Consola amb l'explicació de per què algunes estan "trencades", proposar estratègies radicals d'estalvi de tokens/maduració i avaluar on penjar l'arquitectura de comunicació. No modifiques codi, només audita i diagnostica (només lectura).

## Riscos

- Falsos negatius en l'auditoria a causa de no entendre l'aïllament del Shadow DOM.
- Proposar mètriques per a la Consola excessivament complexes que disparen el cost de RAG o sobrecarreguen l'estat.

## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

## Acte reflex

Tota línia de codi ha de complir el principi d'independència i modularitat.

### Automillora Proactiva (Obligatori)
Quan acabeu de redactar el vostre informe, hi heu d'afegir un punt final titulat "Proposta d'Automillora". És el vostre deure analitzar críticament aquest mateix prompt a la recerca de **contradiccions, duplicitats o instruccions ambigües**. Heu de dir-me clarament: *"Si m'hagueres demanat això d'aquesta altra forma, o si m'hagueres donat aquest context primer, hauria sigut més eficient i precís"*. Proposeu com millorar la redacció de les nostres plantilles i sistemes de comunicació IA-Humà per evitar friccions. Sou agents actius: esmoleu contínuament les eines que feu servir.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[taxonomia_documental]]
