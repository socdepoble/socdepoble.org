---
tipus: petorreta
estat: esborrany
description: "Refinament responsive, icones i atomització del UniversalWorkspace"
tags:
  - maquina
  - claude
  - universal-workspace
---
# Petorreta — Refinament i Atomització del UniversalWorkspace

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-202609202015 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-20 20:15 |
| Modificació | 2026-09-20 20:15 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[app_grid_shell]]
- [[universal_workspace]]

## 1. Objectiu de la Missió

Bona feina amb l'estilització inicial del Workspace! El fons fosc, l'estat *sticky* i les targetes han quedat genial i completament funcionals. Ara, però, necessitem fer un repàs final a tres detalls visuals concrets i assegurar que l'arquitectura del component és **completament atòmica i reutilitzable**.

Aquests són els retocs que has d'aplicar al `UniversalWorkspace.jsx`, `AppGridShell.jsx` o `layout.css`:

## 2. El que has de fer

### 1. Color de les Pestanyes en Mòbil (`app-grid-headers`)
Quan l'aplicació es veu en pantalles menudes (mode `estret`), els títols de les columnes (com "CARPETES" o "NOTES") pugen a la part superior com a pestanyes per commutar entre panells.
- **Problema:** Actualment el seu fons es torna negre, camuflant-se amb la barra superior general (`Topbar`) i confonent l'usuari, que perd la noció de l'espai de treball.
- **Solució:** Aquests botons d'encapçalament (`.app-grid-header-btn`) han de mantindre el seu propi color de fons (el gris de la seua columna) o fins i tot un to lleugerament engroguit/destacat, de manera que s'entenga clarament que pertanyen al Workspace i no al menú de navegació global. 

### 2. El Botó "Tot" (Sense Filete)
A la capçalera grisa immòbil que vas fer, hi ha el botó "Tot" al costat de l'engranatge.
- **Problema:** Aquest botó porta un vora/filet (groc o taronja) que fa mal a la vista en aquest nou context fosc.
- **Solució:** Llevat-li la vora completament. El simple contrast entre el fons del botó i el fons gris fosc de la capçalera serà suficient per donar-li profunditat i elegància.

### 3. Icona Pròpia per a "NOTES"
- "CARPETES" té l'ícona de *chevron* desplegable perquè funciona com un acordió, i això és correcte.
- No obstant això, el títol general de "NOTES" (la columna de llistat) hauria de tindre la seua pròpia icona decorativa estàtica (no un chevron, ja que no es desplega cap avall).
- Afegeix la capacitat de passar icones decoratives als `AppGridColumn` i aplica la corresponent a "NOTES".

### 4. Revisió d'Atomització (Zero Fantasmes)
Aprofita aquest repàs per revisar tot el codi de `UniversalWorkspace.jsx`.
- Assegura't que el component és **100% genèric i atòmic**.
- No ha de tindre cap "fantasma" enganxat (codi acoblat exclusivament al Bloc de Notes).
- Ha de ser tan modular que el Mestre, demà mateix, puga reaprofitar-lo per fer la "Gestoria" o el "Disseny" només injectant-li una matriu de botons diferent, un llistat de dades distint i un editor tancat diferent, sense haver de tocar el JSX estructural ni haver de demanar ajuda a la IA per a canviar configuracions bàsiques.

### 5. Finalitzar la pàgina de Disseny (`DissenySection`)
T'adjuntem tres captures de pantalla (Notes actual, Disseny actual i la referència històrica) perquè entengues bé per què volem separar cada estructura del workspace i com s'han de diferenciar.
- Utilitza la nova arquitectura atòmica de `UniversalWorkspace` per acabar de muntar la pàgina de Disseny (`DissenySection`).
- Assegura't que tots els continguts del sistema de disseny (com la `UniversalCard` i altres components documentats) es renderitzen i es veuen correctament. Actualment no es veuen o no s'han acabat de pintar en la nova estructura.

### 6. Dades (Mock Data) a la Barra Lateral de Notes
A les captures es veu que la columna esquerra de "Notes" ha de tindre el llistat complet de carpetes, categories i etiquetes, però actualment no ho has afegit al codi. Si us plau, assegura't de posar aquestes dades perquè la vista siga 100% fidedigna:
- **Carpetes:** Tot, Mur, Mercat, Pobles, Multimèdia, Esdeveniments, Mapa, Altres notes.
- **Categories:** Sistema.
- **Etiquetes:** Productivitat, Tutorial.

### 7. Amagar els filtres de cerca (Disseny)
A la columna central de la secció Disseny, hi ha un div amb píndoles/etiquetes davall de la lupa de cerca (contingut, inventari, llista, organisme, targeta). Aquest div **ha d'estar amagat per defecte**. 
La idea és que només aparega quan l'usuari faça clic a la lupa per a buscar. Prepara l'estat perquè estiga ocult per defecte. (Si veus que et complica massa la implementació ara mateix, pots simplement esborrar eixe div de píndoles, ja que de moment no és prioritari per al Mestre).

## 3. Què NO has de fer

- No toques la funcionalitat de l'adaptador de dades ni el backend. Açò és purament un refinament visual i de neteja d'API interna del component per a la seua estabilitat com a *core UI*.
- No ens faces una implementació a mig fer: entrega-ho tancat perquè puguem oblidar-nos de l'esquelet visual de l'escriptori i passar a la següent tasca.

## 4. Contracte de Realitat

- Fes els canvis necessaris exclusivament on pertoca. Revisa l'estructura CSS existent a `modules.css` o `layout.css` si et cal modificar el `.app-grid-header-btn` per mòbils.
- Tens llibertat creativa per polir el CSS intern sempre respectant la semàntica de Pedra Seca.

---
<<<FI_DEL_BUNDLE>>>
