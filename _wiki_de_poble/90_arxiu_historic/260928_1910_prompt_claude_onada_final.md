---
type: prompt
status: esborrany
description: "Prompt Onada Final: Fixos UX i Xat (T61-T69)"
tags: [govern]
---
# Prompt d'Execució i Auditoria Local (SDP - v3.0)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual.
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

## Registre

> **Telemetria:** Opliu el camp "Model IA" i "Tokens consumits" obligatòriament a cada document d'eixida per a la Consola de Consums.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260928 |
| Versió | 3.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-28 19:20 |
| Modificació | 26-09-28 19:20 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v3.1.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_final |
| Tall d'evidència | HEAD + 19:20 |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Historial

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

## Instrucció del torn

Ets el director d'enginyeria per al projecte Sóc de Poble.
S'acaba de finalitzar la gran refactorització de disseny (Onades 1-4). En aquest relleu procedirem a la neteja final d'UX, la resolució de conflictes de navegació actius, la gestió de les dades de llavor, i l'adaptació estètica dels menús del xat per acostar-los a la UI de WhatsApp.
Llig atentament el document: `_wiki_de_poble/04_escriptori/260928_1910_pla_implementacio_claude_onada_final.md`.

**MOLT IMPORTANT - REFERÈNCIA VISUAL:** El Mestre t'ha adjuntat diverses captures de pantalla de l'aplicació nativa de WhatsApp. Estudia-les detingudament, ja que l'objectiu és replicar eixa mateixa estructura, fluïdesa i disposició de menús per a l'apartat del Xat, de manera que la corba d'aprenentatge siga nul·la per a l'usuari final.

**TASCA CONCEPTUAL OBLIGATÒRIA:** A banda de l'adaptació visual, audita i valida conceptualment el nou enfocament arquitectònic (l'ús del Xat per acollir comentaris i debats des d'una Pàgina Universal, i la unificació global del cercador). Incorpora la teua visió de viabilitat tècnica o possibles millores al teu informe.

**MOLT IMPORTANT:** Mantingues la congruència absoluta amb els components `UniversalEditorShell`, `BarraTaronja`, `TargetaViva` i la resta de la `Pedra Seca`. Cap modificació ha d'alterar les regles visuals estrictes ni es pot aprovar cap codi que no deixe en verd la totalitat dels tests unitaris.

## Tasques

- T61: Corregir el Fals Actiu a la Barra de Control (Pobles).
- T62: Canvi de Color en Menús Secundaris (Blau en lloc de Taronja).
- T63: Neteja del Xat (bots) i Redirecció de "Comentar" a un Xat Comú (no xat privat ni comentaris clàssics).
- T64: Centrar Botonera Multimèdia.
- T65: Autoria Obligatòria de la Nota d'Onboarding (Sóc de Poble).
- T66: Desar Emoticona al Perfil i instruir sobre l'SQL `2609281500_lema_entradilla_256.sql`.
- T67: Diferenciar "Grups" i "Comunitats" al Xat. **Concepte clau:** Tot grup/comunitat naix d'una Pàgina Universal. L'acció "Comentar" sobre un element obri aquest Xat Comú, en compte de llistar els comentaris davall (com faria WordPress).
- T68: Botó "+" Centralitzat i Eliminació dels 3 punts al Xat.
- T69: Filtres Natius al Buscador del Xat. L'input ha de buscar globalment sense obligar a triar cap filtre per defecte.
- T70: Auditoria Anti-Fantasmes a la Barra Taronja del Xat (assegurar l'ús del component unificat i mostrar-hi sempre l'hora/data).
- T71: Reparació del flux 'Connectar'. El botó connectar sobre un article intern no pot alterar la seua autoria ni afegir placeholders; s'ha de mostrar la Pàgina Universal original intacta, només de lectura, embolicada en la UI per etiquetar-la. A més, prepara la base per al **Contingut Extern (estil Raindrop/Bookmarklet)**: quan s'ingesta un article extern, es crea un element nou editable a la safata de l'usuari amb el títol i entradilla importats.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:** Tots els 2.163 tests passen. La UI no pateix regressions ni a la barra de control ni al menú del xat. 

## Riscos

- Possibles trencaments d'interfície al modificar els menús de Xat i Navbar si s'envaeixen capçaleres globals sense aïllament CSS correcte.

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

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[taxonomia_documental]]
