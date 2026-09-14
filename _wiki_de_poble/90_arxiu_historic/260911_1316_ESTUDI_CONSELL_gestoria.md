---
tipus: document_estudi
estat: en_progres
description: Estudi i assimilació de les auditories del Consell (Codex, etc.) sobre la Gestoria i el Sistema Universal.
---
# 🧠 ESTUDI DEL CONSELL: UNIFORMITZACIÓ DE LA GESTORIA I SISTEMA UNIVERSAL

Aquest document és el meu quadern d'estudi. Ací aniré recopilant, verificant i preparant el codi exacte que aplicarem al sistema un cop rebem totes les auditories del Consell. Estic en **Mode Estudi**, així que cap canvi destructiu s'aplicarà fins que estiga 100% revisat i ordenat per no trencar res.

## 1. APORTACIONS DE CODEX (Rebudes a les 13:08)

L'auditoria de Codex és implacable i molt encertada arquitectònicament. He pres nota dels següents punts crítics a implementar:

### A. Correcció del Generador de Bundles (Fase 0)
Codex ha detectat (amb tota la raó) que el nostre generador de bundles no està incloent la carpeta `public/`.
- **Acció preparada:** Modificarem `tooling/brain/crear_bundle.mjs` per afegir al `FITXERS_OBLIGATORIS`:
  - `public/gestoria/index.html`
  - `public/gestoria/tauler.js`
  - `public/assets/pedra-seca.css`
Així els propers bundles seran completament transparents sobre l'estat d'estos fitxers.

### B. Cromatisme Immutable per a TopBar i SideBar (Plantilla de Sistema)
Com vam remarcar a l'última modificació de la Petorreta, l'esquelet és immutable. Codex ens dóna la solució tècnica:
- **Acció preparada:** Definirem variables exclusives per al "chrome" (la carcassa externa) que no mutaran mai amb el *prefers-color-scheme*:
  - `--sdp-chrome-bg: var(--sdp-pedra-900);`
  - `--sdp-chrome-fg: var(--sdp-pedra-50);`
- Retirarem qualsevol ús de `--sdp-text-invers` a la TopBar i SideBar, i els assignarem els colors del chrome perquè sempre siguen foscos i constants, independentment del mode de color.
- Resoldrem el defecte del text blanc sobre taronja usant el token correcte `--sdp-sobre-accent`.

### C. El Component Canònic: `PillToggle.jsx`
Codex ens ha donat la implementació neta, accessible (`role="group"`, `aria-pressed`) i versàtil. 
- **Estructura CSS:** Usa `inline-grid` per garantir alineació, i `border-radius: var(--sdp-radi-pastilla)`.
- **Interacció:** Transicions suaus i efecte `transform: scale(0.98)` per al clic (donant tacte de botó físic).
- Aquest component centralitzarà TOTS els botons tipus píndola que tenim duplicats (Gestoria, Connectar, Multimèdia).

### D. El Pont Temporal (Iframe Embed)
Mentre separem la lògica fiscal de l'HTML, l'iframe és un mal necessari, però no l'estat final.
- **Acció preparada:** Quan integrem, passarem un paràmetre `?embed=1` a la URL perquè l'HTML autònom de la Gestoria amague la seua pròpia barra, evitant així dobles barres, i garantint que l'usuari només veu l'estructura del `UniversalPage`.

---

## 2. APORTACIONS DE GEMINI FLASH (Rebudes a les 13:23)

L'auditoria de Gemini ha sigut una autèntica classe magistral i ens ha donat la peça que faltava per aconseguir el 10/10 absolut: **el bot directament cap al `UniversalManager`**.

### A. Adéu a l'Iframe, hola `UniversalManager`
Mentre Codex proposava mantenir l'iframe com a pont temporal amb `?embed=1`, Gemini ens ha donat el codi complet per substituir l'arrel de `GestoriaSection.jsx` i integrar-la 100% en l'SPA amb l'engranatge de 3 columnes:
- **Columna 1 (Facetes):** Exercici (2026), Trimestre (1T, 2T, 3T) i Concepte.
- **Columna 2 (Llista):** Les fitxes de la Gestoria convertides a l'estàndard de 96px.
- **Columna 3 (Visor):** La `UniversalPage` que carrega dins el nou `PillToggle` per alternar entre la reixeta pura `.sdp-card-grid` i la taula de liquidació.
Açò elimina d'arrel la reixeta antiga de 4 columnes i qualsevol dependència de l'HTML vell.

### B. Consolidació del `PillToggle` i Accessibilitat
Gemini presenta una solució espectacular amb interacció de teclat (Fletxes, Intro). Ens combinarem el millor d'ambdós mons: la robustesa `role="group"` / `aria-pressed` de Codex (més adequada quan no hi ha panells físics vinculats, només es canvia la vista) amb l'acabat visual impecable de Gemini (`var(--sdp-fons-subtil)` i ombra).

### C. La Llei de Pedra Seca Reafirmada
Ens deixa el CSS exacte per als botons de la `SideBar` (`border-radius: var(--sdp-radi-pastilla)`) i reitera la prohibició d'usar tokens invertibles (`--sdp-fons-invers`) a la TopBar/SideBar inmutables.

---

## 3. APORTACIONS DE GROK (Rebudes a les 13:23)

Grok ha presentat un dictamen executiu molt concís i totalment alineat amb els seus companys de Consell. Reafirma el "Camí únic i quirúrgic":
- **Despullament absolut:** Reitera que no pot sobreviure absolutament res de `public/assets/pedra-seca.css` ni rastres de Tailwind.
- **TopBar i SideBar immutables:** Insisteix en la regla dura que "mai canvien colors ni tipografia entre light/dark" i la prohibició d'usar tokens hard-coded, obligant a dependre dels nous `--sdp-crom-*` o equivalents.
- **Reixeta 100% Universal:** Confirma que forçar el CSS Grid a 3 columnes ja està previst a `AppGridShell` i `index.css`. Açò legitima completament l'arquitectura proposada per Gemini de saltar directament al `UniversalManager`.
- **El `PillToggle` com a Radiogroup:** Grok aporta una variant d'accessibilitat interessant, suggerint `role="radiogroup"` i `role="radio"` amb `aria-checked`. És molt neta, tot i que dependrà de com ho estiga component Claude ara mateix.

---

---

## 4. APORTACIONS DE MISTRAL VIBE (Rebudes a les 13:24)

Mistral Vibe ha posat la cirereta al pastís amb un **Estudi d'Auditoria Definitiu** que empaqueta i estructura tota la saviesa de la resta del Consell:
- **Sobirania Tecnològica:** L'objectiu no és només estètic, és erradicar el deute tècnic. Ens insta a executar una "Neteja Absoluta Destructiva" sobre `pedra-seca.css` i el Tailwind heretat.
- **La Gestoria Autònoma:** Si la maquinària de càlcul fiscal necessitara viure temporalment fora de l'SPA, Vibe ens ha deixat l'estructura exacta del seu `index.html` i `tauler.js` ja convertits als tokens de Pedra Seca. 
- **Full de Ruta Estricte:** Ha plantejat 11 fases quirúrgiques on destaca l'ús del `SDP-LOCK` abans i després de la destrucció del CSS, per assegurar-nos que els càlculs d'impostos de la Gestoria no es vegen compromesos. 

---

## 5. APORTACIONS DE PERPLEXITY (Rebudes a les 13:25)

Perplexity ha actuat com la veu de la prudència extrema i el rigor forense:
- **Alerta d'Al·lucinació Tècnica:** Ens adverteix que, com que el bundle original ometia la carpeta `public/gestoria/`, qualsevol IA que propose reescriure `tauler.js` o la connexió amb Dexie.js ara mateix ho està fent literalment a cegues. No podem tocar eixa maquinària encara.
- **Quarantena Temporal (Iframe):** Recomana exactament el mateix que Codex: mantenir l'iframe (amb `?embed=1` o estils de quarantena) mentre es construeix el `PillToggle` i es fa inmutable el chrome extern (TopBar/SideBar).
- **Veredicte:** Procedir per capes. Primer erradicar el disseny vell, construir el `VistaToggle` i blindar el sistema; la migració de les dades i el càlcul a l'SPA només es farà quan puguem llegir els fitxers reals.

---

---

## 6. APORTACIONS DE DOLA (Rebudes a les 13:27)

Dola ens presenta una visió molt pragmàtica i constructiva per assolir el 10/10 de Pedra Seca sense posar en risc la campanya fiscal:
- **Estratègia de Dues Vies:** Opta fermament per l'**Opció A (Iframe Intel·ligent)** per al 3r Trimestre. Açò s'alinea perfectament amb l'alerta de Perplexity: mantenim l'iframe, però netegem el seu interior, li llevem el Tailwind i li injectem el CSS canònic. La migració nativa a React (Opció B) es deixa per a l'arquitectura final amb Sollutia.
- **PillToggle com a Web Component:** Ens aporta el codi exacte del `PillToggle` implementat com a Custom Element (`<pill-toggle>`), preparat per funcionar de forma autònoma a `tauler.js` amb tots els estils de Pedra Seca i atributs ARIA intactes.
- **TopBar i SideBar a l'HTML:** Proposa reestructurar l'`index.html` de la Gestoria perquè replique de forma nativa l'AppGridShell (TopBar inmutable negra, botons circulats) aconseguint la uniformitat visual total sense necessitat de trencar l'aïllament.

---

## ESTAT DE L'ESTUDI FINAL
- [x] Assimilada l'auditoria de **Codex / Claude Opus**.
- [x] Enviat el prompt de continuació perquè Claude Opus aplique els canvis (SideBar, TopBar, PillToggle, bundle).
- [x] Assimilada la reestructuració de **Gemini Flash** (salt a `UniversalManager`).
- [x] Assimilat el dictamen de **Grok** (Flexbox i accessibilitat `radiogroup`).
---

## 7. APORTACIONS DE DEEPSEEK (Rebudes a les 13:28)

Deepseek ha sorprès prenent una ruta completament diferent a la resta del Consell i fent una **Auditoria Macro-Arquitectònica** de tot el Bundle, fixant-se en l'estat general de l'ecosistema Sóc de Poble:
- **Elogis al rigor:** Valora enormement l'accessibilitat (WCAG AAA), la seguretat (RLS de Supabase) i, sobretot, la impressionant traçabilitat del projecte (comprovacions de hashos, manifests de bundles i mètodes de registre). Diu literalment que és "més rigorós que la majoria de projectes comercials".
- **Toc d'Atenció (Excés d'Enginyeria):** Ens avisa que la governança i el meta-sistema (150 fitxers a `tooling`, 10 skills, el Consell mateix) estan superant el codi del producte en si (`src/` té ~150 fitxers). Ens recomana que vigilem que tot aquest pes siga sostenible i no alenteixca el progrés real.
- **Pendent d'instruccions:** Com que ha llegit tot el codi font, es queda a l'espera d'una pregunta més específica (com la de la Gestoria) per aplicar el seu bisturí sobre eixe mòdul.

---

---

## 8. APORTACIONS DE CLAUDE (Z.ai) (Rebudes a les 13:30)

A través de la plataforma Z, Claude ens ha lliurat una autèntica masterclass d'enginyeria front-end ("Pell nova, ossos vells"):
- **L'origen del problema:** Identifica que la Gestoria no pateix per tindre un "disseny lleig", sinó per tindre **dos orígens de veritat**. La solució binària és eliminar el CSS vell i fer que la Gestoria només consumisca els estils de l'SPA (`pedra-seca.js/css`).
- **Artefactes de Botons (Web Components purs):** Claude ens ha codificat els components clau en vanilla JS (sense React) perquè puguen viure dins de la Gestoria autònoma o qualsevol altra plataforma futura (Horitzó Sollutia):
  - `ps-view-toggle`: El selector de píndola perfecte, amb navegació per fletxes de teclat, roving tabindex i transicions suaus (respectant `prefers-reduced-motion`). I ens fa l'adaptador de React a banda!
  - `ps-date-btn`: Preserva els botons de data de la Gestoria, documentant-los com l'**única excepció** on es permet text clar sobre fons taronja.
  - `ps-topbar` i `ps-sidebar`: El chrome immutable, on estableix la regla estricta que els botons de la barra lateral seran **circulats** per sempre, prohibint els botons de punta a punta.
- **Invariants del 10/10:** Aporta 8 regles mesurables (amb proves a consola) per saber objectivament quan el disseny és perfecte (ex. "Mai més de 3 columnes", "TopBar immutable").

---

## 9. APORTACIONS DE QWEN (Rebudes a les 13:32)

Qwen s'afegeix al consens general aportant una anàlisi molt profunda sobre per què l'enfocament de l'Iframe (defensat per Codex, Perplexity i Dola) és tècnicament superior a altres alternatives com la incrustació directa o el Server-Side Rendering:
- **Aïllament Arquitectònic (Arquitectura Hexagonal):** Defineix l'iframe no com un simple "pegat" per eixir del pas, sinó com un adaptador de port legítim. L'iframe garanteix un aïllament total del DOM i del CSS, la qual cosa ens vacuna contra qualsevol contaminació creuada.
- **Protocol de Comunicació (postMessage):** Proposa utilitzar `window.postMessage()` per establir un contracte de comunicació pur entre la Gestoria i l'SPA (per exemple, per notificar `"gestoria:ready"` o per a futurs esdeveniments), permetent que les dues peces parlen sense tocar-se el codi.
- **Consolidació:** Qwen tanca el cercle. Tota la comunitat d'IAs està d'acord en l'Estratègia Híbrida per a este 3r Trimestre: netejar dràsticament l'interior de la Gestoria perquè adopte visualment Pedra Seca, però blindant el seu motor de càlcul (Dexie) darrere del mur protector de l'iframe.

---

## ESTAT DE L'ESTUDI FINAL
- [x] Assimilada l'auditoria de **Codex**.
- [x] Enviat el prompt de continuació.
- [x] Assimilada la reestructuració de **Gemini Flash** (salt a `UniversalManager`).
- [x] Assimilat el dictamen de **Grok** (Flexbox i accessibilitat `radiogroup`).
- [x] Assimilat l'estudi estructurat de **Mistral Vibe** (Full de Ruta i mitigació de riscos).
- [x] Assimilada l'alerta de **Perplexity** (No tocar Dexie a cegues sense el bundle sencer).
- [x] Assimilat l'estudi pragmàtic de **Dola** (Iframe intel·ligent per al 3T i Web Component).
- [x] Assimilada l'auditoria macro-arquitectònica de **Deepseek** (alerta de sobreenginyeria i felicitacions pel rigor).
- [x] Assimilada la masterclass de **Claude (Z)** (Web Components, inmutabilitat i artefactes de botons).
- [x] Assimilat el reforç teòric de **Qwen** (Arquitectura Hexagonal i postMessage).
- [x] **ESTUDI COMPLETAT (De veritat!).** Ja tenim un volum de coneixement incalculable. A l'espera de vore què acaba de fer Claude a la consola per rematar la feina!
