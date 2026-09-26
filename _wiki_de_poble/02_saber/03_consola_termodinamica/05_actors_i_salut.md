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

La pestanya «Actores» d'Emowe dibuixa el que hi ha al voltant dels agents: qui mana, per on es parla, qui treballa sol, qui reparteix la faena, qui vigila, quins candats hi ha i sobre quin sòl treballen. Ho detecta per presència de fitxers i binaris, sense llegir contingut privat. El que existix ho pinta amb traç ple i el que falta, amb traç discontinu. Així la mateixa fila és inventari i full de ruta alhora.

| Capa (Emowe) | Al Mas | Font |
|---|---|---|
| qui mana | el Mestre | — |
| els que conversen | IAIA MarIA (Antigravity), Claude (Claude Code) i Codex | `.agents/QUI_SOC.md`, `.agents/consell.json` |
| el consell extern | les dotze membres del Consell, a través de petorretes | `.agents/consell.json` |
| el tauler | l'Escriptori (`04_escriptori/`) i els registres de torn (`.agents/runtime/turns/`) | cicle de vida documental |
| el repartidor | no n'hi ha: cada torn l'obri una persona | — |
| el vigilant | cap de viu: el Reflex daemon apuntava a un script que mai ha existit i es desinstal·la (26-09, pla `260926_1200_pla_implementacio_infraestructura_fons`); el candidat amb script és `porta-plantilla-viva.mjs --vigila` | [[02_calendari]] |
| el planificador | launchd (Plaquetes) | [[02_calendari]] |
| els candats | hooks de Claude Code (`.claude/settings.json`); hooks d'Antigravity declarats sense consumidor acreditat (`.agents/hooks.json`); pre-commit de git | [[01_fluxos_skills]] |
| el sòl | la Wiki (`_wiki_de_poble/`) i el codi | — |

## Principi: candats independents de l'arnés

Un candat que viu dins d'un arnés només protegix del que passa per eixe arnés. Si un actor escriu per un altre camí, el candat no el veu. Per això:

1. La Consola ha de mostrar, **per a cada actor que escriu, quins candats l'afecten de veres**, no quins hi ha declarats.
2. Els controls que importen han de viure allà on passa tothom:
   - la validació sobre el disc (Plaquetes, cada hora);
   - el pre-commit, com a primer pas independent de la cadena;
   - la integració contínua.

## La frontissa de contingut

Protegix les peces estructurals de la interfície: les pàgines de `PAGE_COPY` que pinten el Mur, la portada de la Wiki i les seccions de text. L'origen és l'incident del 24-09: un canvi de nom de clau va deixar sense contingut la targeta del Mur i la portada de la Wiki, i cap porta ho va dir.

1. **Importa l'objecte real** (`import('src/sections/text/pageContent.js')`), no busca text. Un comentari que mencione la clau no la fa existir.
2. **Deriva les claus obligatòries dels consumidors**, no d'una llista escrita a mà:
   - els `pageKey` de `src/config/sections.js`;
   - la llista de pàgines de sistema del Mur, que caldrà moure del component a un mòdul de configuració perquè node la puga importar;
   - la clau de la portada de la Wiki.

   Si un consumidor demana una clau que no existix, la porta falla.
3. **Registra una empremta per clau** (SHA-256 del valor serialitzat i longitud de l'HTML) en un registre declaratiu. Qualsevol canvi d'empremta necessita una aprovació lligada exactament a l'empremta nova. Una reducció de més del 30% de l'HTML, o una clau que desapareix, no passa mai sense aprovació.
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

| Mètrica | Numerador / denominador | Font | Estat |
|---|---|---|---|
| Conformitat documental de l'Escriptori | documents de l'Escriptori que passen `document.mjs check` / documents de l'Escriptori | `tooling/gates/porta-documents.mjs` | mesurable hui |
| Integritat del contingut estructural | claus requerides presents amb empremta aprovada / claus requerides | frontissa de contingut | `N/A` fins que existisca |
| Vigilants vius | llançadors amb script existent i activitat recent / llançadors declarats | [[02_calendari]] | `N/A` fins que existisca el registre ampliat |
| Disparadors útils | skills amb disparador que no és el seu propi nom / skills del cens | `.agents/skills_index.json` | mesurable hui |
| Cadena de portes amb notícies | portes que s'executen fins al final / portes declarades | `tooling/gates/run-portes.mjs` | mesurable hui |
| Frescor de la instantània | minuts des de l'última instantània automàtica | Time Machine | `N/A` fins que existisca |

Una porta que no s'executa no és verda: està **sense notícies**, i la Consola la pinta així.

## Vincles

- [[00_portada]]
- [[01_fluxos_skills]]
- [[02_calendari]]
- [[03_inventari_skills]]
- [[04_contracte_de_dades]]
