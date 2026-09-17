---
tipus: skill
estat: canonic
description: Reglament matemàtic visual Pedra Seca (Alta Definició)
tags:
  - disseny
name: pedra-seca
triggers_on:
  - disseny
  - css
  - ui
  - pedra
  - seca
  - estil
  - colors
  - components
core: true
version: 1.0.0
status: canonic
lang: ca
---

<!-- Aquest fitxer és un ESPILL (mirror) automàtic de .agents/skills/pedra-seca/SKILL.md -->

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
- **Accents:**
  - `--sdp-accent` (Taronja): Ús exclusivament per a identitat de marca i estats seleccionats (activació).
  - `--sdp-accio` (Blau): Ús per a elements **interactius que desencadenen accions** (botons, enllaços funcionals).

## 3. L'Escala Matemàtica de l'Espai (Mòduls Reixeta)
L'espai no s'improvisa. Qualsevol regla de `margin`, `padding` o `gap` ha de ser múltiple de `0.25rem` o utilitzar els tokens establits.
- **Micro-espaiat (components interns):** `0.5rem` (8px).
- **Espaiat normal (paddings de targetes, llistes):** `1rem` (16px).
- **Macro-espaiat (separació de seccions):** `2rem` (32px) o `3rem` (48px).
- *Violació Crítica:* Usar valors com `13px`, `0.7rem`, `15px` està estrictament prohibit.

## 4. Estricta Jerarquia Tipogràfica i Lectura
- **Ritme Editorial Màxim:** Cap paràgraf o bloc de text de lectura pot superar els `68ch` d'amplada (`max-width: 68ch;`).
- **Llei de Capçaleres:**
  - Els `h1` pertanyen **exclusivament** a `<header className="page-title">`.
  - Els `h2` van a `div.sdp-text-center` o directament al flux documental (NO dins del títol principal).
  - Els `h1` i `h2` tenen **prohibició estricta** d'acabar amb punt final (`.`).
- **Alçades de Línia (Line Height):** Títols usen `1.2` (compactes). Text de cos usa `1.6` (lectura llarga).

## 5. La Frugalitat Rústica (Ombres i Vores)
Nosaltres som de poble, som Pedra Seca. El *Glassmorphism*, els degradats complexes i les ombres difuminades estaran penalitzats severament.
- **0 Ombres Decoratives:** L'ús de `box-shadow` està prohibit per a finalitats estètiques generals. Només es permet a través dels tokens (`--sdp-ombra-*`) de forma molt contínuda i funcional (p. ex. per elevar un menú flotant contextual sobre una llista). Les targetes normals, per defecte, se separen amb vores o color de fons, no amb ombra permanent.
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

## Ancoratge de Seguretat
- [[00_INDEX_SKILLS]]
