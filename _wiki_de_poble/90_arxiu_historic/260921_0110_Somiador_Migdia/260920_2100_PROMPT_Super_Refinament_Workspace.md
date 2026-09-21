---
tipus: petorreta
estat: esborrany
description: "Super refinament del UniversalWorkspace: contrast, botonera PedraSeca i recuperació de continguts"
tags:
  - maquina
  - claude
  - universal-workspace
---
# Petorreta — Super Refinament del UniversalWorkspace

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-202609202100 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-20 21:00 |
| Modificació | 2026-09-20 21:00 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_workspace]]
- [[design_system_specs]]

## 1. Objectiu de la Missió

Molt bona feina amb l'atomització del `UniversalWorkspace`. No obstant això, en separar el codi i fer-lo genèric, s'han perdut alguns detalls de la UI original que són fonamentals per a l'experiència d'usuari i la coherència del Sistema de Disseny (Pedra Seca). 

Necessitem que fases un repàs integral i conceptualitzes molt bé els elements de disseny per arreglar els següents aspectes estructurals i visuals.

## 2. El que has de fer

### 1. Contrast de l'Ítem Actiu a la Llista
Quan un element de la columna esquerra (ex: "Bloc de notes") està actiu (seleccionat), el seu fons canvia a un color clar (blanc/gris molt clar).
- **Problema:** El color del text no canvia a fosc, de manera que la lletra es torna il·legible (text clar sobre fons clar).
- **Solució:** Assegura't que quan l'ítem tinga l'estat d'actiu, el text i la icona passen a un color fosc (negre/gris fosc) per garantir el contrast.

### 2. Recuperar la Targeta Rica (`NotaFitxa`) a la Llista
En la vista anterior teníem una targeta rica a la llista per a les notes, que incloïa una miniatura (imatge), el títol ("Bloc de notes"), la data i un fragment de text ("El teu estudi d'escriptura...").
- **Problema:** Aquesta *card* rica ha desaparegut de la llista (només es veu el títol simple). Encara que vas crear `NotaFitxa.jsx`, pareix que no s'està renderitzant correctament amb tota la seua informació i disseny.
- **Solució:** Restaura el disseny complet d'aquesta minitargeta rica perquè l'usuari puga veure la miniatura quadrada (86px), el títol, la data i l'entradeta, tal com estava previst al disseny original.

### 3. Unificar la Botonera Superior (Topbar Blava de l'Editor)
A la part superior dreta de l'editor de notes, tenim una botonera blava amb diverses accions (fletxes, llibre, traducció, comentaris, compartir i el botó "CONNECTAR").
- **Problema:** Actualment hi ha una mescla d'estils incòmoda: alguns botons són quadrats/rectangulars i altres són completament arredonits.
- **Solució:** Unifica tots aquests botons utilitzant exclusivament els components i tokens del nostre Sistema de Disseny **Pedra Seca**. Han de mantindre una coherència visual total.

### 4. Recuperar els Continguts del Sistema de Disseny (Pàgina de Disseny)
L'espai de Disseny (`DissenySection`) estava molt avançat, però ara moltes pàgines documentades no apareixen o estan desubicades.
- **Problema:** Falta la vista de la `UniversalCard` (la de la samarreta de Sóc de Poble) i altres elements clau de la llibreria de disseny.
- **Solució:** Aplica correctament la plantilla de `UniversalWorkspace` també a la pàgina de Disseny, però respectant absolutament les seues peculiaritats. Açò significa que has de recuperar els seus components, les seues àrees i tot el contingut que aquesta pàgina té originalment. Assegura't de revisar tot el que hi ha i tornar-ho a posar al seu lloc, intentant unificar-ho amb el nou sistema genèric, perquè no perdem res del que teníem avançat.

### 5. Amagar els Filtres de Cerca (Agenda Pendent)
A la columna central de la secció Disseny, davall de la lupa de cerca, hi ha un `div` amb píndoles (contingut, inventari, llista, organisme, targeta).
- **Instrucció:** Aquest `div` ha d'estar amagat per defecte, i només ha d'aparéixer quan es fa clic a la lupa per a buscar. Si et complica molt la implementació ara mateix, elimina aquest `div` temporalment.

## 3. Què NO has de fer

- **No modifiques l'adaptador de dades** ni cap lògica de connexió externa. Centra't a polir el Front-end i la coherència del Sistema de Disseny.

## 4. Contracte de Realitat

- Fes servir un model mental elevat (nivell "mig-alt") per conceptualitzar el Sistema de Disseny Pedra Seca abans de tocar el CSS. La coherència de l'arquitectura visual és prioritària.
- No et deixes cap dels 5 punts.

---
<<<FI_DEL_BUNDLE>>>
