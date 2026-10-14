---
type: document
status: esborrany
description: 'Pla de l''Onada ERP Gestoria: escàner automàtic de carpeta RAW, vista Cabina d''Avió hiperprofessional, correcció d''avatar a la barra i categories en taronja.'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_7029462e-87cc-472a-b96e-a87df295d54e:52a50ed6-a2a7-47c4-90c4-a8e8f61d3611
---
# Pla d'Implementació — Gestoria JARVIS, Escàner de Carpeta i Cabina d'Avió

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_7029462e-87cc-472a-b96e-a87df295d54e:52a50ed6-a2a7-47c4-90c4-a8e8f61d3611 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-13T12:02:09.820Z |
| Modificació | 2026-10-13T12:02:09.820Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Gemini 3.8 Flash (Orquestradora IAIA MarIA) |
| Tokens consumits | ~0.15M |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-13T12:02:09.820Z: esborrany creat.
2026-10-13T12:06:00.000Z: pla completat amb els 5 fronts d'acció recollits en l'auditoria interactiva amb el Mestre.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Auditoria Mestre Javi)
Durant l'auditoria visual de matí a `http://localhost:3340/`, amb la sessió iniciada com a **Javi Llinares** (`socdepoblecom@gmail.com`), s'han identificat cinc necessitats arquitectòniques i d'usabilitat clau per a convertir la Gestoria en un **motor autònom revolucionari (Mode JARVIS per a l'autònom, suferiment zero)**:
1. **L'Avatar a la Barra Negra Superior:** Mostra una «S» perquè `IdentitatContext` només llegeix `user_metadata` en comptes d'hidratar `avatar_url` i `full_name` des de `public.profiles`.
2. **La Boina Taronja de la Gestoria:** Totes les pàgines de la Gestoria (`Tauler`, `Facturació`, `Escàner`, etc.) han de mostrar el titular real autenticat (**Javi Llinares**, La Torre de les Maçanes) amb el seu avatar, i a la dreta **SEMPRE la data i l'hora vives** (mai llevar-les).
3. **Jerarquia de la Barra Lateral en Taronja:** Els títols de grup, capçaleres de categoria i desplegables que no són enllaços directes (com `Sistema`, `Operacions`, `Diners i impostos`, `Arxiu i eines`) han d'anar en color taronja de Pedra Seca (`--sdp-primary`) per a separar visualment l'agrupació de la navegació.
4. **Escàner Local & Ingesta Automàtica RAW (`_gestoria_de_poble/`):** L'usuari no ha d'anar buscant fitxer a fitxer. La Gestoria ha d'acceptar la carpeta arrel, escanejar-la, trobar els extractes a `02_Facturacio/2026_Bancs/` (CSVs, Norma 43), les factures dels trimestres, detectar duplicats i omplir el Tauler automàticament.
5. **Panell tipus «Cabina d'Avió / Cockpit»:** Afegir una vista híper professional d'alta densitat d'instruments (estil Odoo/Holded/FacturaDirecta adaptat al Trellat) que convisca amb la vista de «Targetes» (amigable i amb art) i la vista «Comprimida».

---

### 2. Detall dels Fronts d'Implementació

#### Front A: Correcció de l'Avatar a la Barra Negra
* **Fitxer:** `src/app/contexts/IdentitatContext.jsx` i `src/components/universal/identitat/BotoIdentitatActiva.jsx`.
* **Acció:** En iniciar sessió com a persona, hidratar el perfil des de `public.profiles` (`full_name`, `avatar_url`). Si `avatar_url` està present a la base de dades local, passar-lo directament a `BotoIdentitatActiva` per pintar el rostre de Javi en lloc de la lletra «S».

#### Front B: Boina i Titular Actiu a totes les pantalles de la Gestoria
* **Fitxers:** `src/sections/gestoria/tauler/ShellGestoria.jsx`, `Tauler.jsx`, `Facturacio.jsx` i subseccions de gestoria.
* **Acció:**
  - La barra taronja superior de la Gestoria pren automàticament les dades de l'actor actiu (nom, avatar, població).
  - A la part dreta de la barra taronja, incloure **SEMPRE la data i hora vives** (rellotge / data actualitzada segons `dataHoraDeBarra` o rellotge local), sense ometre-les mai.

#### Front C: Jerarquia Visual de Menú Lateral en Taronja
* **Fitxers:** `src/css/layout.css`, `src/css/modules.css`, `src/components/layout/AppGridColumn.jsx`, `src/apps/gestoria/manifest.js`.
* **Acció:** Estilitzar les etiquetes de grup no clicables i els botons desplegables d'acordió (com `Sistema` al menú principal, o les capçaleres de grup a la BarraApp de la Gestoria) amb `color: var(--sdp-primary)` (taronja Pedra Seca) i pes seminegre (`font-weight: 600`), per a una separació nítida respecte als enllaços normals.

#### Front D: Escàner Local i Ingesta Automàtica RAW (`/app/gestoria/escaner`)
* **Fitxers:** `src/sections/gestoria/escaner/PanellEscaner.jsx`, `src/sections/gestoria/tauler/useGestoria.js`, `src/sections/gestoria/tauler/gestoriaBancs.js`.
* **Acció:**
  - Implementar a l'Escàner Local la lectura de directoris via `window.showDirectoryPicker()` (File System Access API) amb fallback a entrada múltiple de fitxers.
  - Lector intel·ligent: quan rep la carpeta arrel (com `_gestoria_de_poble/`), recorre recursivament les carpetes `02_Facturacio/2026_Bancs/` per trobar CSVs/Norma 43 i `2026_3T/` per a factures.
  - Detecta automàticament duplicats de fitxers, discrepàncies de dates i genera una radiografia estructurada: «X comptes bancaris trobats, Y moviments conciliats, Z factures registrades».
  - Propaga directament les dades extretes al Tauler d'Inici i al context de Gestoria.

#### Front E: Vista «Cabina d'Avió / Cockpit» al Tauler
* **Fitxers:** `src/sections/gestoria/tauler/Tauler.jsx`, `src/sections/gestoria/tauler/CabinaAvio.jsx`.
* **Acció:**
  - Afegir el mode `cabina` al selector de vistes: `Targetes | Cabina d'Avió | Vista comprimida`.
  - En mode «Cabina d'Avió»: panell d'alta densitat d'informació amb mètriques de tresoreria (saldo consolidat, runway en mesos, despeses mitjanes, deute tributari estimat del 303 i 130, gràfic dens de barres de flux de caixa mensuals i alertes de venciment).
  - La vista «Targetes» conserva les seues Universal Cards amb les il·lustracions i art rural.

#### Front F: Consola Termodinàmica Neta, Imatges Rurals, Índex i Diagnòstic en Text
* **Fitxers:** `src/sections/consola/ConsolaTermodinamica.jsx`, `.agents/skills_index.json`, `.claude/skills/`.
* **Acció (Directiva Visual Mestre Javi):**
  - **Imatges Rurals a les Cards:** Col·locar a les capçaleres de les targetes de la Consola Termodinàmica les il·lustracions artístiques de Pedra Seca existents (a `_wiki_de_poble/assets/` i recurs gràfic).
  - **Índex i Diagnòstic en Text Pla al peu:** Al final de la pàgina, davall de les targetes, incorporar un índex de navegació ràpida a cada card (*El pols del cervell*, *Explorador*, *Fluxos de treball*...) i un bloc de text continu (estil terminal / `<pre>` amb tipografia monoespaiada i format net) que mostre el diagnòstic complet del Mas d'un sol colp d'ull.
  - **Resolució de deute de la Consola:** Registrar `core-direccio-autonoma` i `core-informes-pdf` a `.agents/skills_index.json` i a `.claude/skills/`, i oferir una rutina de neteja per als 260 torns caducats antics de runtime.

#### Front G: Destil·lació del Laboratori d'Investigació IA (`02_investigacio_ia/`) i Llei de l'Oblit Saludable
* **Fitxers / Directoris:** `_wiki_de_poble/04_escriptori/02_investigacio_ia/`, `_wiki_de_poble/` i `.agents/skills/`.
* **Acció (Directiva Suprema Mestre Javi):**
  - **La IA no és intel·ligent per acumular, sinó per estudiar i destil·lar:** Actualment hi ha quasi 60 carpetes i fitxers abandonats a `02_investigacio_ia/` que embruten el cervell del projecte.
  - **Estudi de Mercat i Destil·lació:** Claude i Codex han d'auditar el contingut real d'aquestes carpetes:
    * Rescatar els enllaços d'or de GitHub, repositoris de referència i skills operatives d'avantguarda per al projecte.
    * Sintetitzar el coneixement clau en un document Markdown canònic o skill estructurada a la Wiki.
    * Tota la brossa obsoleta, zips o proves del passat s'ha d'arxivar a `90_arxiu_historic/` o descartar, alliberant espai i sobrecàrrega cognitiva.
  - Deixar `02_investigacio_ia/` net i destil·lat.

#### Front H: Fitxa d'Identitat Privada Sobirana & Finestreta Única (Javi Llinares)
* **Fitxers / Origen:** `../_gestoria_de_poble/01_Identitat_Legal/`, `src/app/contexts/IdentitatContext.jsx`, `public.profiles`.
* **Acció (Visió Finestreta Sobirana):**
  - **Identitat Legal Completa:** Claude ha d'extraure les dades estructurades que resideixen a `_gestoria_de_poble/01_Identitat_Legal/` (DNI/NIF de Javier Llinares García, Núm. Afiliació Seguretat Social, domicili fiscal a La Torre de les Maçanes, referències cadastrals, situació de RETA, etc.).
  - **Model de Fitxa Privada:** Hidratar la fitxa d'usuari a `public.profiles` / magatzem local privat amb tots aquests camps oficials.
  - **Objectiu Finestreta Única:** Quan el Mestre demane a la Finestreta «Ompli'm aquest formulari de la Generalitat o de l'Ajuntament», el sistema disposarà de tots els camps preparats per auto-completar el tràmit i signar-lo digitalment amb un sol clic.
  - **Reserva de control humà:** Les imatges de portada i l'avatar personal són d'elecció exclusiva del Mestre; Claude construeix tota l'estructura de camps i dades administratives.

#### Front I: Identitats Sobiranes Multiactor (Javi · Sóc de Poble · El Rentonar · IAIA MarIA) i Operativitat Real de Xarxa Social
* **Fitxers / Origen:** `src/app/contexts/IdentitatContext.jsx`, `src/sections/organitzacions/`, `src/sections/notes/`, `src/sections/mur/`, `src/sections/mercat/`, `src/data/backendPort.js`.
* **Acció (Directiva Suprema Mestre Javi Llinares - Després de provar en viu):**
  - **Propietat i Vinculació de l'Organització `socdepoble`:** A la base de dades local ja existeix el registre de `socdepoble`, però la UI impedia associar-la perquè deia *"L'identificador ja pertany a una altra organització"*. Cal vincular directament a `socdepoblecom@gmail.com` (Javi Llinares) com a propietari / administrador d'aquesta organització, de manera que a "Grups i empreses" aparega com a organització seua i permeta commutar entre Persona (Javi Llinares) i Empresa (Sóc de Poble).
  - **Actor Col·lectiu: El Rentonar:** Donar d'alta i vincular el col·lectiu/paratge rural "El Rentonar" (`elrentonar` / `rentonar`) com a entitat preparada per a rebre notícies i activisme ecològic.
  - **Erradicació de «Foraster» a Notes Personals:** Quan Javi Llinares accedeix a `/notes`, la boina ha de mantindre l'avatar de Javi Llinares i el seu nom, sense caure mai a l'estat per defecte «Foraster».
  - **Segregació i Operativitat de Continguts (Mur i Mercat):** A Sóc de Poble el que és de Sóc de Poble, i a Javi el que és de Javi. L'ordinador en venda que té Javi Llinares ha d'aparèixer filtrat al Mercat com a seu, i a la pestanya general "Tot" convivint amb els productes de la xarxa.
#### Front J: Llei de Correspondència Card ↔ Pàgina (Hero Image) sense Excepcions (Ordre del Mestre, 17:55h)
* **Fitxers / Origen:** `src/sections/consola/ConsolaSection.jsx`, `src/sections/consola/imatgesConsola.js`, `src/components/universal/UniversalPage.jsx`.
* **Acció (Directiva Visual Suprema):**
  - **Principi:** «Una pàgina i una card són el mateix; la card és una miniatura de la pàgina».
  - **Eliminació d'Excepcions:** Quan una Card té il·lustració triada (`imatgesConsola.js`), la seua `UniversalPage` corresponent a la ruta de detall (`/consola`, `/consola/pols`, `/consola/explorador`, etc.) ha de rebre i mostrar exactament eixa mateixa imatge a la capçalera com a `heroImage` (`heroImage={imatgeDePagina(id).imatge}`).
  - **Zero Logos Genèrics:** Evitar que les pàgines de la Consola caiguen en el logo rectangular negre genèric quan la seua card ja té una il·lustració pròpia.

---

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Tests Unitaris:** Executar `npx vitest run src/sections/gestoria` i `src/components/universal/identitat` per garantir que totes les proves continuen en verd (100%).
2. **Verificació al Navegador:**
   - Comprovar que a `http://localhost:3340/` la barra negra superior mostra l'avatar de Javi Llinares.
   - Comprovar que la barra lateral mostra els grups i desplegables en taronja.
   - Entrar a `/app/gestoria/tauler` i verificar que la boina taronja mostra Javi Llinares amb data i hora a la dreta.
   - Anar a `/app/gestoria/escaner`, seleccionar la carpeta `_gestoria_de_poble/` i comprovar que l'escàner llegeix i organitza els comptes i factures a l'acte.
   - Commutar entre «Targetes», «Cabina d'Avió» i «Vista comprimida» al Tauler.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

1. **Compatibilitat de Navegador:** `showDirectoryPicker` és suportat en Chromium/Chrome/Edge/Safari modern. Cal mantindre sempre el botó clàssic de selecció de fitxers com a fallback resilient.
2. **Privacitat i Llei de Pedra Seca:** Res del que s'escaneja no pot eixir de l'ordinador ni pujar-se a servidors externs. Tot el processament de CSVs, PDFs i extractes és 100% local a la memòria del navegador.
3. **Manteniment de l'Estat:** La tria de vista i les dades escanejades no s'han de perdre en canviar entre mòduls de la Gestoria.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
