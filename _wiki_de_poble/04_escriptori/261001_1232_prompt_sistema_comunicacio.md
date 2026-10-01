---
type: prompt
status: esborrany
description: "Petició a Claude i Codex per dissenyar l'arquitectura de comunicació (dossier i plantilles) de Sóc de Poble."
tags: [govern]
reflex: "sdp:torn_21f90441-7877-4d89-8c4a-51854de02378:0fbaf706-233a-4a22-9356-c7b3786532ef"
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
| Creació | 26-10-01 12:32 |
| Modificació | 26-10-01 12:32 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v3.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_21f90441-7877-4d89-8c4a-51854de02378:0fbaf706-233a-4a22-9356-c7b3786532ef |
| Tall d'evidència | [HEAD + 1232] |
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

Hem creat una arquitectura tècnica sòlida (Pedra Seca, Enxufabilitat, etc.), però el nostre **sistema de comunicació pública està en bolquers**. Tenim textos dispersos a GitHub (`README.md`), a WordPress (`readme.txt`) i dins de l'App (pàgina "El Projecte") que no estan harmonitzats, cadascun amb un to o llargada diferent.

El Mestre demana que el Consell (tu, Claude, i tu, Codex) conceptualitzeu un **Sistema Arquitectònic de Comunicació Institucional** per a Sóc de Poble. Aquest sistema ha de seguir una estructura amb plantilles normatives que definisquen els casos d'ús (ex: Presentacions d'un paràgraf, mig foli, foli sencer), de la mateixa manera que estandarditzem codi React o procediments amb "skills". Aquesta conceptualització permetrà integrar la lògica al cervell de l'orquestradora (MarIA) perquè puga mantenir la coherència del discurs a tot arreu.

## Tasques

- T1: **Definició de Plantilles de Comunicació:** Proposa l'estructura conceptual d'un document canònic (un "Dossier de Premsa" o manifest base a la Wiki) on residisquen les diferents plantilles de comunicació segons el context.
- T2: **Integració Cognitiva (Skills):** Dissenya l'estructura d'una nova *skill* per a l'orquestradora (ex: `core-portaveu-institucional`) perquè tot agent que redacte descripcions o codi relacionat amb presentacions utilitze estrictament aquest Dossier, evitant al·lucinacions.
- T3: **Proposta de Flux d'Actualització (Propagació):** Proposa un mecanisme arquitectònic segur (o automatització) per garantir que, si s'actualitza el missatge al Dossier, es propague sense fricció a GitHub, WordPress, metadades i a la UI de la pròpia SPA ("El Projecte").

### Criteris d’acceptació i reproducció

- **Criteris d'Acceptació:** No cal programar ni executar canvis en cap repositori; exclusivament s'espera un informe conceptual detallat responent a T1, T2 i T3, que ens servisca de pla d'arquitectura per aplicar en el futur.

## Riscos

- Sobredisseny: Crear un sistema de plantilles tan rígid que l'orquestradora siga incapaç d'adaptar el to al context adequat.
- Conflicte amb la regla de "Format Zero Fricció" si els mètodes d'actualització demanen massa burocràcia.

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
