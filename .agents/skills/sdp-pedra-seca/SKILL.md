---
type: skill
status: canonic
description: Reglament matemàtic visual Pedra Seca (Alta Definició)
tags:
  - disseny
name: sdp-pedra-seca
triggers_on:
  - disseny
  - estils css
  - interfície
  - pedra
  - seca
  - estil
  - colors
  - components
core: true
---
# 🪨 Pedra Seca 2.0: El Reglament Matemàtic

> [!WARNING]
> **ORDRE RESTRICITVA (HIG per a IA):** 
> Aquest document NO és una guia d'estil filosòfica. És un **contracte matemàtic de validació**. Teniu prohibit dissenyar amb adjectius ("prèmium", "modern") o improvisar marges i colors. Cada propietat CSS ha de passar per aquest filtre de principis inquebrantables. Qualsevol al·lucinació estètica serà rebutjada. No busqueu "Pedra Seca" a internet.

## 1. Topologia Infranquejable (La Roca i el Visor)
1. **Llei de Scroll:** L'element arrel (`.sdp-root` i el `body`) MAI fan scroll (`overflow: hidden`). Només la columna activa (el visor) té permís de desbordament. Prohibit manipular el body per a resoldre desbordaments.
2. **Columnes de Base:** 
   - *Sidebar (La Roca):* Fons inmutablement fosc (`--sdp-pedra-900`) amb text (`--sdp-pedra-50`). MAI s'inverteix amb el mode fosc.
   - *Visor (Main App):* Superfície dinàmica.

## 2. Principi de Color (Tokens Semàntics i Prohibicions)
**Prohibició Absoluta:** Mai, sota cap concepte, es pot assignar un codi HEX (`#FFF`), RGB o un token primitiu (`--sdp-pedra-400`) directament a un component.
- **Fons admissibles:**
  - `--sdp-fons-app`: Superfície base del visor.
  - `--sdp-fons-targeta`: Superfície elevada (cards, diàlegs).
  - `--sdp-fons-invers`: Elements de contrast extrem.
- **Textos admissibles:**
  - `--sdp-text-titol`: Només per a `h1`, `h2`, o text de màxima autoritat.
  - `--sdp-text-cos`: LECTURA NORMAL. Tota la UI funcional.
  - `--sdp-text-suau`: Metadata, dates, descripcions complementàries.
- **Accents (La Nova Jerarquia):**
  - `--sdp-accio` (Blau - PRIMARI): És el botó i color d'interacció principal. S'usa per a tot element **interactiu que desencadena accions** (botons principals, píndoles seleccionades/actives, enllaços funcionals). És instintiu per a l'usuari.
  - `--sdp-accent` (Taronja - SECUNDARI): S'utilitza exclusivament per a identitat de marca (caputxes de targetes, logotips) o botons d'interacció secundària/opcional. Mai ha de competir amb l'acció principal.

## 3. L'Escala Matemàtica de l'Espai (Mòduls Reixeta)
L'espai no s'improvisa. Qualsevol regla de `margin`, `padding` o `gap` ha de ser múltiple de `0.25rem` o utilitzar els tokens establits.
- **Micro-espaiat (components interns):** `0.5rem` (8px).
- **Espaiat normal (paddings de targetes, llistes):** `1rem` (16px).
- **Macro-espaiat (separació de seccions):** `2rem` (32px) o `3rem` (48px).
- *Violació Crítica:* Usar valors com `13px`, `0.7rem`, `15px` està estrictament prohibit.

## 4. Estricta Jerarquia Tipogràfica i Lectura (Regles Impeccable)

- **Llei de Capçaleres i Escala Fluida:**
  - Els `h1` pertanyen **exclusivament** a `<header className="page-title">`.
  - Els `h2` van a `div.sdp-text-center` o directament al flux documental (NO dins del títol principal). Mai poden sobrepassar jeràrquicament a l'H1 en mida visual en pantalles mòbils.
  - Per evitar dissenys genèrics i anomalies, utilitzeu funcions `clamp()` per a les capçaleres, assegurant una escala fluida (p. ex., `font-size: clamp(1.2rem, 3vw, 1.8rem);` per a H2) que mantingue proporcions harmòniques en mòbil i web.
  - Els `h1` i `h2` tenen **prohibició estricta** d'acabar amb punt final (`.`).
- **Alçades de Línia (Line Height):** Títols usen `1.2` (compactes). Text de cos usa `1.6` (lectura llarga).

## 5. La Frugalitat Rústica i el Moviment (Regles Kowalski)
Nosaltres som de poble, som Pedra Seca. El *Glassmorphism*, els degradats complexes i les ombres difuminades estaran penalitzats severament. Tot ha de tenir un comportament previsible i d'alta qualitat ("Taste").
- **Micro-interaccions fluides:** Qualsevol element interactiu (botó, targeta clicable) ha de tenir feedback visual ràpid i precís (estats `:hover` i `:active`). Les transicions no han de superar els `200ms-300ms` i usaran funcions d'easing àgils (tipus `ease-out` o `cubic-bezier` precises) per evitar sensació de lentitud.
- **0 Ombres Decoratives:** L'ús de `box-shadow` està prohibit per a finalitats estètiques generals. Només es permet a través dels tokens (`--sdp-ombra-*`) de forma molt continguda i funcional (p. ex. per elevar un menú flotant contextual sobre una llista). Les targetes normals, per defecte, se separen amb vores o color de fons, no amb ombra permanent.
- **Radis de Vora Espectrals:** Només s'admet l'escala de `--sdp-radi-s` fins `--sdp-radi-xl`. Cap component portarà `border-radius: 5px;`.

## 6. Accessibilitat i Motor Tàctil
Sóc de Poble és Mobile/Tablet First tàctil.
- **Àrea d'interacció matemàtica:** Cap element interactiu o botó baixarà de la variable `--sdp-touch` (44/48px d'altura/amplària clickejable). Mai ho sobreescriguis.

## 7. Model d'Enxufabilitat Universal (Sense Deute Tècnic)
- Tot component s'ha de dissenyar com un *plugin* que hereta els seus colors de les 3 capes esmentades dalt.
- Si construeixes una `<Card>`, no dependrà mai d'on està ubicada per pintar el seu fons, ni tindrà estils *inline* tipus `style={{ marginTop: 20 }}`.

## 8. L'Enquadrament Simètric (Imatges 1:1)
Sempre que la IA reculla, mostri o demani la generació d'una imatge, la proporció assecurada serà d'aspecte quadrat (`1:1`), llevat que existisca una excepció lògica o d'arquitectura validada. L'àrea visual de Pedra Seca és estrictament proporcional.

## 9. Prototipatge Obligatori abans de Programar (Storybook de Pedra Seca)
L'equivalent a l'Spec-driven per al disseny:
- **Res existeix fins que no està al manual:** Abans d'afegir un component nou a producció, t'has de preguntar: Existix el component a `src/sections/disseny/DesignSection.jsx`?
- **NO POTS PROGRAMAR LA FUNCIÓ:** Si no existix el referent visual allà, tens prohibit programar la funció lògica. Primer dissenyes el component de UI i ho afermes a `DesignSection`. Només quan l'esquelet matemàtic aprova l'auditoria, pots connectar les funcions (APIs).

## 10. La Barra Taronja (regles del Mestre, 28-09-2026)
- La pastilla de data és sempre present i plena. Lectura: data de creació o de l'última versió si és posterior. Edició: la data triada al calendari o, si no n'hi ha, la d'ara. Mai la data de l'última edició, mai guionets. Una font de només dia es pinta sense hora.
- L'espai central és l'emoticona del document: en edició, sempre un botó (ploma blanca si no n'hi ha cap); en lectura o targeta, buit si no s'ha triat.
- La ploma només vol dir «tria una emoticona». L'autodesament fa servir el núvol (CloudUpload).
- Totes les icones de la barra són blanques dins del cercle de vel fosc.
- El component pare és `src/components/universal/barres/BarraTaronja.jsx`; PageFrame i els espècimens el munten.

## 11. Identitat Visual (Avatars vs Logotips)
- **Persones i IA (Avatars):** Els usuaris, persones físiques i la IAIA utilitzen OBLIGATÒRIAMENT un avatar redó i gran (300-360 px), mai un logotip corporatiu ni figures abstractes per defecte a les seues fitxes personals.
- **Entitat Oficial:** El logotip complet de "Sóc de Poble" es reserva de forma estricta i exclusiva per a la pàgina corporativa de l'entitat, la capçalera oficial i els actes organitzats per aquesta. Mai s'ha d'utilitzar com a "avatar" o imatge de recurs quan falta la foto d'una persona.

## 12. Tornada arrere lliure de tensió (Pla 261004_2045)

- En mòbil, els menús emergents i calaixos de navegació s'adapten al contingut i tenen un màxim de 300px d'amplària. Han de deixar visible espai tàctil de la vista anterior perquè es puga tancar el menú tocant fora.
- Les etiquetes llargues usen `text-overflow: ellipsis`; el nom complet continua disponible com a nom accessible de l'acció. El truncament visual no elimina la identificació per a lectors de pantalla.
- Este límit s'aplica a menús i calaixos. Una pantalla completa de treball, com l'editor o el visor, és legítima quan conserva una eixida o tornada arrere visible i accessible; no és una prohibició general d'ocupar el 100% de la pantalla.

## Ancoratge de Seguretat
- [[00_INDEX_SKILLS]]
