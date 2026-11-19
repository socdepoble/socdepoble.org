---
type: document
status: esborrany
description: Els actors del Mas vistos amb la pestanya Actors d'Emowe, el principi de candats independents de l'arnés, la frontissa de contingut i les primeres mètriques de salut.
tags:
  - saber
  - portes
  - govern
---
# Actors i Funció de Salut

Qui mana, qui conversa, qui vigila i quins candats hi ha al Mas, llegit amb la pestanya d'actors d'Emowe. D'ací ixen el principi de candats independents de l'arnés, la frontissa de contingut i les primeres mètriques de la Funció de Salut.

## Els actors del Mas

La pestanya «Actores» d'Emowe dibuixa el que hi ha **al voltant dels agents**: **qui mana**, **per on es parla**, qui treballa sol, qui reparteix la faena, qui vigila, quins candats hi ha i sobre quin sòl treballen. Ho detecta per **presència de fitxers i binaris**, **sense llegir contingut privat**. El que existix ho pinta amb traç ple i el que falta, amb traç discontinu. Així la mateixa fila és **inventari i full de ruta** alhora.

### Qui mana

Al Mas governa **el Mestre** (direcció humana directa, sense fitxer intermedi).

### Els que conversen

Són la **IAIA MarIA (Antigravity)**, **Claude (Claude Code)** i **Codex**, declarats a `.agents/QUI_SOC.md` i `.agents/consell.json`.

### El consell extern

Agrupa **les dotze membres del Consell**, convocades a través de petorretes segons `.agents/consell.json`.

### El tauler

Correspon a l'**Escriptori** (`04_escriptori/`) i als **registres de torn** (`.agents/runtime/turns/`) del **cicle de vida documental**.

### El repartidor

**No n'hi ha** cap d'automàtic: **cada torn l'obri una persona**.

### El vigilant

**Cap de viu**: el Reflex daemon apuntava a un script que mai ha existit i es desinstal·la (26-09, pla `260926_1200_pla_implementacio_infraestructura_fons`); el **candidat amb script** és `porta-plantilla-viva.mjs --vigila` (font: [[02_calendari]]).

### El planificador

S'executa mitjançant `launchd` (**Plaquetes**), documentat a [[02_calendari]].

### Els candats

Inclouen els **hooks de Claude Code** (`.claude/settings.json`), els **hooks d'Antigravity** declarats sense consumidor acreditat (`.agents/hooks.json`) i el **pre-commit de git** (font: [[01_fluxos_skills]]).

### El sòl

És el repositori compartit format per la **Wiki** (`_wiki_de_poble/`) i el **codi**.

## Principi: candats independents de l'arnés

Un candat que viu dins d'un arnés només protegix del que passa per eixe arnés. Si un actor escriu per un altre camí, el candat no el veu. Per això:

1. La Consola ha de mostrar, **per a cada actor que escriu, quins candats l'afecten de veres**, no quins hi ha declarats.
2. Els controls que importen han de viure allà on passa tothom:
   - la validació sobre el disc (Plaquetes, cada hora);
   - el pre-commit, com a primer pas independent de la cadena;
   - la integració contínua.

## La frontissa de contingut

**Nota de vigència** (261103). La **frontissa ja està implementada** a `tooling/gates/frontissa-contingut.mjs`: importa `PAGE_COPY`, **deriva els consumidors** i **compara les empremtes** del registre `.agents/contingut_estructural.json`, que en este tall declara 16 claus. El resultat de `node tooling/gates/frontissa-contingut.mjs --json` és el que acredita quantes són correctes en cada execució; la presència de l'instrument **no equival a `16/16` en verd**. Les descripcions d'actors i processos d'este estudi **no certifiquen que cap llançador estiga actiu**.

Protegix les **peces estructurals de la interfície**: les **pàgines de `PAGE_COPY`** que **pinten el Mur, la portada de la Wiki** i les seccions de text. L'origen és l'**incident del 24-09**: un canvi de nom de clau va deixar **sense contingut** la targeta del Mur i la portada de la Wiki, i **cap porta ho va dir**.

1. **Importa l'objecte real** (`import('src/sections/text/pageContent.js')`), no busca text. Un comentari que mencione la clau no la fa existir.
2. **Deriva les claus obligatòries dels consumidors**, no d'una llista escrita a mà:
   - els `pageKey` de `src/config/sections.js`;
   - les llistes `SYSTEM_PAGES` i `COVER_PAGE_KEYS` de `src/config/systemPages.js`, que Node importa directament;
   - la clau de la portada de la Wiki.

   Si un consumidor demana una clau que no existix, la porta falla.
3. **Registra una empremta per clau** (**SHA-256** del valor serialitzat i longitud de l'HTML) en un **registre declaratiu**. Qualsevol canvi d'empremta necessita una **aprovació lligada exactament** a l'empremta nova. Una **reducció de més del 30%** de l'HTML, o una clau que desapareix, **no passa mai sense aprovació**.
4. **S'executa en tres llocs:**
   - com a primer pas del pre-commit, abans i fora de la cadena de portes;
   - al CI;
   - al diagnòstic horari de Plaquetes, que ho publica per a la Consola.
5. **En temps d'execució, falla en veu alta.** El Mur descarta en silenci una pàgina declarada que no troba. En desenvolupament ha d'avisar.
6. **Mai recomana `git checkout HEAD -- …`.** Si el dany ja està *committejat*, HEAD és el dany. La recuperació és quirúrgica i segueix la skill de restauració segellada.

La frontissa detecta el que s'ha perdut, però no pot recuperar el que mai s'ha guardat. Per això va acompanyada d'instantànies automàtiques del treball, que es descriuen a l'auditoria del 24-09 (Time Machine).

## Què pot vore la Consola d'una al·lucinació documental

**Ho pot detectar de manera determinista:**

- seccions de la plantilla absents o buides;
- blocs fixos alterats (Context, Protocol de l'Olivera);
- rebut absent o que no correspon al document;
- data del nom (`AAMMDD`) que no quadra amb la data de creació del Registre;
- skills citades que no existixen al cens;
- rutes citades que no existixen;
- frontmatter fora de l'esquema.

**No ho pot detectar:** una regla de la doctrina citada de memòria i deformada. L'única defensa és exigir cita literal amb ruta i línia, i comprovar que la línia citada existix i diu el que es cita.

## La Funció de Salut

La [[00_portada]] fixa el contracte de cada mètrica: fórmula, font, denominador, abast, data i prova reproduïble. Si falta una peça, el valor és `N/A`. Primeres mètriques proposades:

### Conformitat documental de l'Escriptori

**Numerador / denominador:** documents de l'Escriptori que passen `document.mjs check` dividits pels **documents totals de l'Escriptori**. **Font:** `tooling/gates/porta-documents.mjs` · **Estat:** **mesurable hui**.

### Integritat del contingut estructural

**Numerador / denominador:** **claus amb empremta aprovada** dividides per la **unió de claus requerides i registrades**. **Font:** `tooling/gates/frontissa-contingut.mjs` · **Estat:** **instrument disponible**; valor del diagnòstic de cada execució.

### Vigilants vius

**Numerador / denominador:** **llançadors amb script existent i activitat recent** dividits pels **llançadors declarats**. **Font:** [[02_calendari]] · **Estat:** `N/A` fins que existisca el registre ampliat.

### Disparadors útils

**Numerador / denominador:** **skills amb disparador** que no és el seu propi nom dividides per les **skills del cens**. **Font:** `.agents/skills_index.json` · **Estat:** **mesurable hui**.

### Cadena de portes amb notícies

**Numerador / denominador:** **portes que s'executen fins al final** dividides per les **portes declarades**. **Font:** `tooling/gates/run-portes.mjs` · **Estat:** **mesurable hui**.

### Frescor de la instantània

**Numerador / denominador:** **minuts transcorreguts** des de l'última instantània automàtica. **Font:** **Time Machine** · **Estat:** `N/A` fins que existisca.

Una porta que no s'executa no és verda: està **sense notícies**, i la Consola la pinta així.

## Vincles

- [[00_portada]]
- [[01_fluxos_skills]]
- [[02_calendari]]
- [[03_inventari_skills]]
- [[04_contracte_de_dades]]
