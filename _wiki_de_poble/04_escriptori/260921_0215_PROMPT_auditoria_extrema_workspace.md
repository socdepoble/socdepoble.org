---
type: petorreta
status: esborrany
description: Prompt per a l'auditoria extrema del Workspace abans de passar a producció amb dades reals.
tags:
  - escriptori
  - auditoria
---

# Petorreta — Auditoria Extrema del Workspace

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260921 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-21 02:15 |
| Modificació | 26-09-21 02:15 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[UniversalWorkspace]]
- [[260921_0155_pla_implementacio_mestre.md]]

## Entrades

- Una captura de pantalla antiga com a referència visual de com es veien les miniatures (thumbnails) abans de desaparèixer.
- (Cap bundle adjunt. Teniu accés directe a l'entorn local del repositori. Utilitzeu les vostres eines per inspeccionar la base de codi.)

## Consell convocat

Claude Fable (potència baixa) i GPT Astra (mode lleuger).

## Contracte de realitat

1. **PROHIBICIÓ D'EDICIÓ:** Tens STRICTAMENT PROHIBIT modificar, afegir o esborrar cap línia de codi, ni "proposar canvis" interactius. Aquesta és una auditoria pasiva. 
2. **Codi com a veritat absoluta:** Baseu les vostres avaluacions en l'estat actual de `src/components/universal/workspace/UniversalWorkspace.jsx`, `AppGridShell.jsx`, `modules.css` i la resta de l'arquitectura. 
3. Tota afirmació sobre codi es cita com `ruta:linies`. 
4. **MITIGACIÓ "PEDRA SECA"**: El terme "Pedra Seca" fa referència exclusivament al nostre Sistema de Disseny (Design System / UI Kit).
5. **PROTOCOL ANTI-CERCA:** Prohibit activar cap eina de cerca web.
6. **CRÍTIC PER A CODEX I CLAUDE:** El teu rol és única i exclusivament d'auditor i analista. Generaràs l'informe amb els defectes trobats. Si has de mostrar codi, fes-ho en text pla o sense indicar la ruta per evitar que l'IDE l'aplique automàticament. No volem la barra de "Confirmar Canvis".

## Context Històric i Identitat (Qui som i Per a què treballem)

**L'Ànima del Projecte:** Treballem per a construir una plataforma de desenvolupament rural, un refugi digital, des de La Torre de les Maçanes. Aquest projecte és Sóc de Poble. Pots consultar els nostres orígens culturals a rentonar.blogspot.com i socdepoble.net.

**Visió Open-Source i "Estil Obsidian":** Tot el que construïm ací no només és per a nosaltres; la nostra voluntat és regalar-ho (open-source) a la comunitat global, perquè siga útil per a qualsevol persona que ho vullga utilitzar, al pur estil Obsidian (basat en l'Escriptori, arxius Markdown, portable i lliure de tancaments). 

**La Política de Codi Pur ("Zero brossa"):** Com que l'objectiu final és regalar l'arquitectura, l'exigència tècnica és implacable. No volem deixar nyaps, espagueti-code ni "mierda" perquè ningú acabe renegant de nosaltres el dia que ho fem lliure. La IA que llig açò ha d'entendre que no valen pegats ràpids; calen solucions estructurals elegants, testades i impecables. Volem codi "Pedra Seca" de veritat. (Sollutia és l'agència SaaS externa que ens proveeix exclusivament el backend, però el nostre cor és independent).

## Informe d'avanç

S'han completat les primeres accions correctives del Pla Mestre per al `UniversalWorkspace`:
- S'ha eliminat la variant "transparent" de les capçaleres d'accions en `UniversalWorkspace.jsx`, assegurant visualment que s'aplica el color gris original a tota la capçalera (resolent l'"efecte fantasma" on part de la capçalera de la columna central i dreta es mostrava blanca o amb fons incorrecte).
- S'ha implementat el paràmetre `onConnect={false}` en el `DesignSection.jsx` i s'ha actualitzat `UniversalPage.jsx` per permetre ocultar el botó CONNECTAR de publicació quan se sol·licita (com en l'entorn de Disseny).

Ara, abans d'activar el Workspace amb dades reals des de Supabase, demanem una auditoria profunda (Extrema).

## Situació i dades opaques

Necessitem confirmar que els components del Workspace (`UniversalWorkspace.jsx`, `CategoryColumn`, `ItemListColumn`, `AppGridColumn`, i el sistema de grid de `AppGridShell`) no tenen problemes estructurals o d'estat que puguen trencar l'experiència quan es connecte a fonts de dades dinàmiques. No volem sorpreses en passar a producció.

## Missió

1. Realitza una auditoria extrema i implacable sobre l'estructura actual de `UniversalWorkspace.jsx` i els seus estils base. Busca defectes d'accessibilitat, comportaments no controlats, dependències reactives que falten (memory leaks en hooks, closures obsolets), o qualsevol nyap en la renderització.
2. Revisa la solidesa de la graella (`AppGridShell` / CSS), detectant possibles fuites de layout, desbordaments no previstos o conflictes de z-index.
3. Revisa el renderitzat de les miniatures (thumbnails) en el llistat d'elements de la columna central (ex: Notes i Disseny). Actualment falten o mostren només les inicials. Cal auditar l'arquitectura d'aquesta llista i proposar la solució correcta per recuperar-les amb el suport adequat d'imatge i icona (fallback).
4. **Acoblament del Sistema (Inconsistències de Fons):** Audita per què la instància de `UniversalWorkspace` a "Notes" té la primera columna grisa i a "Disseny" la té blanca. El Workspace Universal ha de ser completament agnòstic al contingut i mantenir la mateixa plantilla base per al workflow. Busca fuites de CSS (CSS leaks) d'altres classes (com `.sdp-cataleg` o `.sdp-notes`) que estiguen trencant aquesta separació, i proposa com blindar el component perquè no es trenque el sistema.
5. Si trobes "forats" o pegats temporals, documenta'ls explicant el perquè és un risc i quina seria l'aproximació sòlida ("Pedra Seca").

## Eixida esperada

Genera un document Markdown titulat `260921_0215_INFORME_auditoria_extrema_<el_teu_nom>.md` (guarda'l a l'escriptori) amb els resultats de la teua auditoria. Agrupa les troballes per grau de criticitat (Crític, Important, Menor).

## Incògnites

- Com es comportarà el Workspace exactament quan se li injecten més de 1000 ítems (¿està preparat el CSS per a virtualització o caldrà adaptar-lo?)

## Bateria de veritat

- [ ] He citat només rutes del manifest, en format `ruta:linies`?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
