---
type: prompt
status: esborrany
description: "Prompt per a Codex: Lògica d'Usuari real (Supabase), entrada de Sóc de Poble i correcció visual de bafarada (T15-T16)"
tags: [govern]
---

# Prompt d'Execució i Auditoria Local (SDP - v3.0)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** generat: `_wiki_de_poble/04_escriptori/260927_2130_pla_implementacio_codex.md`. Llegiu-lo abans de procedir.
- [x] **Rebut obtingut** per a l'arxiu generat.

## Registre

> **Telemetria:** Ompliu el camp "Model IA" i "Tokens consumits" obligatòriament a cada document d'eixida per a la Consola de Consums.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260927 |
| Versió | 3.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-27 21:30 |
| Modificació | 26-09-27 21:30 |
| Propietari | Agents Locals (Codex) |
| Plantilla | prompt_local.md (v3.1.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn:codex_logica |
| Tall d'evidència | [HEAD + hora] |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Historial

- **v3.1.0 (260927_1730):** Consolidació històrica. S'afegeix el llegat de 30 anys d'activisme (socdepoble.net) que s'havia perdut, i s'implementa el bloqueig de seguretat on l'Agent Local ha de rebutjar els prompts de MarIA si incompleixen la plantilla o ometen el Pla d'Implementació.
- **v3.0.0 (260927_1505):** Refactorització total cap a un format tècnic, concís i lliure de metàfores (eliminats "Olivera", "Masia"). S'optimitza per claredat tècnica mantenint la visió hipermodular.

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

## Instrucció del torn

Claude Fable acaba d'estabilitzar de forma magistral tota l'arquitectura UI/CSS del sistema (Píndoles, Rails edge-to-edge a 138px, filtres de Xat, ombres 3D). Ara et passem el testimoni (com a Codex / ChatGPT) perquè remates el **Backend i la Lògica de Sessió (Ultracode)**.

Necessitem connectar tot el front-end a Supabase realment (eixir del mode "seed" actual) i habilitar la lògica profunda d'usuari i la paleta de colors pendents.

## Tasques

- **T15: Bafarada Taronja Tènue (UI):** L'usuari ha demanat que la bafarada blanca (missatges rebuts) al xat passe a ser d'un color taronja molt suau, pràcticament blanc brut ataronjat (super tènue), perquè faça un contrast cromàtic i siga el color complementari del blau (missatges propis). Actualitza el CSS o els tokens d'aquesta bafarada.
- **T16: Lògica d'Usuari Real (Supabase):** Implementar l'entrada real de "Sóc de Poble" a l'aplicació. Hem de poder registrar/entrar i tindre tota la lògica d'usuaris del xat connectada correctament. Això inclou l'arquitectura d'autenticació i els enllaços cap a l'adaptador real. Sub-tasques:
  - Crear o permetre la creació de l'usuari real de "Sóc de Poble" a Supabase.
  - Verificar l'adaptador d'entrada (login) per deshabilitar o esquivar l'entorn "seed" quan l'usuari decidisca entrar realment.
  - Finalitzar el circuit que permet enviar/rebre missatges connectant amb l'ID de sessió i l'entitat Sóc de Poble.
- **T17: Uniformitat Tipogràfica de les Barres:** La mida de la lletra als encapçalaments de les barres laterals (com la paraula "Converses" o les categories "Notes Personals", "Wiki de Poble", "Disseny", "Xat") és inconsistent. En alguns llocs és més gran i en altres més menuda (i en majúscules/minúscules produeix l'efecte de ser encara més menuda). Has de revisar l'estil d'aquestes tipografies i unificar-les sota un mateix patró o token base perquè mantinguen el mateix estil de plantilla a totes les columnes del sistema.
- **T18: Enxufabilitat Màxima i Desacoblament de Sollutia:** Comprova activament si hi ha algun mode de dependre encara menys del backend actual (Sollutia/Supabase). Hem d'adoptar la màxima modularitat (sentit de Fedivers). Si detectes lògica de negoci al front-end que estiga fortament acoblada a la base de dades, desmunta-la i refactoritza-la cap a un model "indestructible i segur" on el backend actue exclusivament com un endoll tonto. Corregix tots els errors estructurals que trobes en aquest sentit.
- **T19: Estat Inicial dels Llistats (Vista "Tot" per defecte):** L'usuari ha detectat que en entrar als mòduls documentals (com "Wiki de Poble" o "Consola Termodinàmica"), la llista central (el rail de navegació) apareix completament buida si no se selecciona cap sub-carpeta prèviament. Això dóna la sensació que el mòdul està buit o trencat. La lògica d'aquests mòduls s'ha de refactoritzar perquè, en entrar, la columna central mostre de forma "bruta" TOTS els arxius de la secció (un estat "Tot" per defecte), per tal que l'usuari veja immediatament que hi ha contingut. A més, cal assegurar-se que la carpeta (o etiqueta) "Índex" es tracte com l'arxiu únic que és i no com un directori, i revisar per què el rail lateral no es queda fixat en algunes resolucions quan s'amaga.




### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:** 
  - La bafarada de l'interlocutor ara mostra un taronja molt suau.
  - És possible realitzar login/entrar com a usuari real al backend, carregant el padró no-seed.
  - Les proves de components passen en verd (mantindre estabilitat T1-T14 assolida per Fable).

## Riscos

- Tindre conflictes entre el port mockegeat actual (`backendPort.js` o similar) i el client de Supabase.
- Trencar els alineaments CSS estabilitzats (138px) de Fable en intentar modificar el `background-color` de les bafarades.

## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

## Acte reflex

Tota línia de codi ha de complir el principi d'independència i modularitat.

### Automillora Proactiva (Obligatori)
Quan acabeu de redactar el vostre informe, hi heu d'afegir un punt final titulat "Proposta d'Automillora". Heu de proposar com millorar aquest mateix prompt, les nostres plantilles o els nostres sistemes de comunicació IA-Humà per tal d'evitar friccions innecessàries i accelerar el flux de treball. Sou agents actius: heu d'esforçar-vos en arreglar i esmolar les eines que feu servir, i proposar altres sistemes d'automillora que faciliten la clonació, la hiperenxufabilitat, la comunicació i el flux de treball entre la IA i l'humà.

**[INCIDÈNCIA GREU - PER A L'ANÀLISI DE CODEX]:**
La IAIA MarIA (orquestrador) ha patit una fallada en el seu tractor cognitiu d'higiene. Ha generat aquest mateix prompt mentres l'escriptori (`04_escriptori/`) estava brut d'auditories i plans del torn anterior de Claude Fable, quan la regla estricta és arxivar-ho tot abans d'iniciar una nova "petorreta". Dins de la teua "Proposta d'Automillora", formula una recomanació o actualització de sistema (per exemple en les regles base o a les skills) perquè el "Tractor d'Higiene" de MarIA s'active de manera reflexa, obligant-la a adonar-se visualment de la brutedat i arxivar els elements morts *abans* de redactar qualsevol nou prompt.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[taxonomia_documental]]
