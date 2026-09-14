# Auditoria Visual i Redisseny de la Plantilla Enxufable

El Mestre ha deixat instruccions clares sobre l'aparença visual i la lògica de la interfície d'espai de treball de la Plantilla Enxufable (`AppGridShell` i `UniversalWorkspace`). El disseny actual s'ha "desmuntat" i presenta fantasmes de CSS (icones blanques amb fons, la barra blava de la pàgina universal eixint-se del seu marc, etc.).

La teua missió és refactoritzar els components necessaris perquè complisquen 100% amb les regles que s'acaben de documentar a `.agents/skills/app-grid-shell/SKILL.md`.

> [!IMPORTANT]
> L'usuari ha adjuntat una captura de pantalla ("l'exemple antic") a la conversa. Has d'usar eixa imatge com la **FONT DE VERITAT ABSOLUTA** per entendre com han de quedar les barres grises, l'alineació de les icones i com la barra blava queda exclusivament continguda dins de l'editor de la dreta. Fixa't bé en la imatge abans de tocar el CSS!

## 1. Desacoblament de UniversalPage i UniversalWorkspace
Actualment `UniversalWorkspace` envolta el `<AppGridShell>` dins d'un component `<UniversalPage>`. Açò és erroni, ja que provoca que la barra blava cobrisca totes les tres columnes (Carpetes, Notes i Editor). 
**Llei:** La `UniversalPage` només pot existir dins del component que s'injecta a l'slot `renderEditor`. `UniversalWorkspace` ha de retornar directament el `<AppGridShell>` i el `ManagerProvider`, alliberant l'AppGridShell d'estar captiu dins d'una `UniversalPage`.

## 2. Icones i Colors de Fons de l'AppGridShell
Modifica el HTML/CSS (`AppGridShell.jsx` i `AppGridShell.css`) perquè els botons i les icones de les capçaleres de les columnes esquerra i centre respecten la Pedra Seca:
- Tots els icones de les barres (lupa, roda dentada, fletxes d'obrir/tancar) han de ser **blancs** i el seu fons sempre **transparent**. Res de fons blancs.

## 3. Lògica d'Interfície Dinàmica de les Capçaleres
S'ha d'ajustar la botonera (els `div.app-grid-headers` o equivalents) de l'Esquerra i del Centre en `AppGridShell.jsx`:
- **Columna de Carpetes (Esquerra):** Ha de mostrar el botó "Tot" (a l'esquerra) i la "Roda Dentada" (a la dreta).
- **Columna de Notes (Centre):** Ha de mostrar la "Lupa" (esquerra) i "Crear Nota" (dreta).
- **Quan Carpetes s'oculta:** L'icona per desplegar s'alinea exactament amb la "Roda Dentada" i queden els dos visibles.
- **Quan Notes s'oculta:** El botó "Crear Nota" DESAPAREIX completament, quedant només visible la Lupa i l'icona de desplegar. (La funcionalitat de cerca complida es mostra a l'obrir la lupa).

## 4. Deute Tècnic de Disseny (design-guard)
Durant la teua refactorització, recorda:
- Elimina i corregeix qualsevol rastre de l'atribut `style=` dins del JSX (com el de les columnes flexibles del resizer) substituint-ho per `<style>` inline.
- Evita completament el `:has()` de CSS, ja que trenca la compatibilitat *Baseline 2022*. Afegeix classes modificadores de React (ex. `has-left-collapsed`) a l'estructura de HTML si necessites estilar segons estat.

Si us plau, genera tots els blocs de codi (````javascript` / ````css`) amb el codi llest per ser enganxat.
