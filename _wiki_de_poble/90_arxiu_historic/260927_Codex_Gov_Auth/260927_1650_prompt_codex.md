<!-- SDP:EIXIDA
type: prompt
status: esborrany
description: "Prompt Ultra per a Codex: reparar el Segell de mutació, estandarditzar botons de panells i desenvolupar el flux de Registre/Creació d'Empreses."
tags: [govern, ui, dades]
-->
# Prompt d'Execució i Auditoria Local (SDP - v3.0)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

## Registre

> **Telemetria:** Opliu el camp "Model IA" i "Tokens consumits" obligatòriament a cada document d'eixida per a la Consola de Consums.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260927 |
| Versió | 3.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-27 16:50 |
| Modificació | 26-09-27 16:50 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v3.0.0) |
| Ruta | prompt.local |
| Rebut | pendent |
| Tall d'evidència | [HEAD] |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | Codex (Ultra / GPT-6 Astra) |
| Tokens consumits | [pendent] |

## Historial

- **v3.0.0 (260927_1505):** Refactorització total cap a un format tècnic, concís i lliure de metàfores (eliminats "Olivera", "Masia"). S'optimitza per claredat tècnica mantenint la visió hipermodular.

## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Backend Intercanviable (Model B):** El servidor actual (Supabase) funciona exclusivament com un endoll. Cap lògica de negoci de la UI ha d'estar fortament acoblada a ell. El sistema ha de poder enxufar-se com a mòdul a WordPress o Joomla sense trencar res.
- **Visió de futur:** Evolució cap al **Fedivers** i App Nadiua (offline-first). El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

## Instrucció del torn

Aquest és un torn d'alta intensitat (Ultra) on actues com a Enginyer Tècnic principal. Tens dues responsabilitats fonamentals de fons (Governança i Usabilitat) i una responsabilitat estructural de producte.
Llegeix el `260927_1650_pla_implementacio_codex.md` per veure les directrius clares.

## Tasques

- **T1: Govern (El Segell):** El sistema de polítiques de mutació (a `tooling/gates/mutation-policy.mjs`) actualment està bloquejant operacions legítimes de lectura (subagents no poden retornar informes, `ls` i `grep` bloquejats). Modifica els hooks perquè agents i subagents puguin llegir i llistar fitxers lliurement (evitant milionades de consum de tokens) però sense trencar l'escut protector del repositori.
- **T2: Usabilitat Frontend:** A la UI de l'escriptori, els botons per replegar els panells laterals només permeten fer clic a la petita icona de replegar (`[<]`). Fes que **tota** la pastilla horitzontal (icona de l'esquerra + la paraula + icona de replegar) actuï com un sol botó en els panells de Xat, Disseny i Wiki. Carpetes no s'ha de tocar, i Bloc de Notes tampoc.
- **T3: Modelatge i Flux d'Usuari:** Desenvolupa o estabilitza el codi necessari per permetre que l'usuari entre com a *usuari registrat*. Posteriorment, crea la interfície i els serveis d'endoll per poder crear entitats: `Empreses` i `Grups`. Mantingues tota l'arquitectura de *Model B* (el client és independent, el backend és un servei consumible).

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:**
  - El hook `mutation-policy.mjs` accepta operacions `SubagentHandback`, `ls`, i `grep` de lectura.
  - Els panells de configuració laterals es poden replegar fent clic sobre el text, no només la icona.
  - L'usuari pot fer Login.
  - Hi ha una interfície funcional (integrada al router o modals estables) per crear Empreses i Grups.

## Riscos

- Tocar el hook de polítiques pot obrir bretxes de seguretat; assegura't de separar estrictament read (permès) de write (restringit).
- Crear fluxos d'entitats sense respectar la hipermodularitat i el *Model B*. Tota crida de dades ha d'estar totalment aïllada dels components de React.

## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

## Acte reflex

Tota línia de codi ha de complir el principi d'independència i modularitat.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[taxonomia_documental]]
- [[260927_1650_pla_implementacio_codex]]
