---
type: document
status: esborrany
description: "Pla d'implementació per a l'auditoria extrema i targetes UI"
tags: [implementacio]
---

# Pla d'Implementació — Auditoria Extrema i Consola Termodinàmica

**Estat del Pla:** en elaboració

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PLA-260926-0130 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-26 01:30 |
| Modificació | 26-09-26 01:30 |
| Propietari | IAIA MarIA / Claude |
| Aprovació humana | pendent |
| Model IA | pendent |
| Tokens consumits | pendent |

## Acte reflex

La generació entrega esta plantilla i conserva un snapshot del contracte al rebut. El rebut acredita procedència, no comprensió ni autorització.

## Historial

- **2026-09-26:** Creat esborrany arran de la petició d'auditoria extrema del Mestre.

## Canvis proposats

Tot i que Claude està auditant el sistema de fons (Ultracode ja llançat), aquest pla servirà com a pissarra per recollir els canvis estructurals i requeriments que el Mestre ha afegit durant el procés. Claude haurà de llegir aquest pla i incorporar-ho a la seua execució i disseny.

### 1. Refactorització Exclusiva de la Consola Termodinàmica
- **Targetes Universals (NOMÉS a la Consola):** Totes les seccions de la Consola seran `UniversalCards` autèntiques (amb Títol, Subtítol i Entradilla, sense foto, usant icona, amb boina taronja i peu blau). 
- **Amplària Mínima i Graella:** L'amplària mínima d'una targeta ha de ser de **320px**. Has d'adaptar la graella (CSS Grid) de la Consola perquè, quan la pantalla es reduïsca i les targetes arriben a eixe límit, passen automàticament de mostrar 3 columnes a 2 (p. ex. amb `repeat(auto-fit, minmax(320px, 1fr))`). Si són massa estretes es trenca el títol i el disseny.
- **⚠️ Advertència sobre el Panell de Control:** NO s'ha de tocar el `Panell de Control`. Les targetes actuals de publicació (Mur, Mercat, Agenda, etc.) confonen a l'usuari i, en el futur, s'unificaran en una sola acció ("On vols publicar?") adaptada segons el destí (com la targeta d'Aplec). Per tant, deixa eixa pàgina tranquil·la.
- **Objectiu Principal - Neteja d'Errors:** L'objectiu prioritari a la Consola Termodinàmica és **eliminar tots els errors i insígnies de "Cal reparar"**. La Consola ha de quedar impecable.
- **Molles de Pa (Breadcrumbs):** Seran un panell propi, vigilant els espaiats (ha de tindre un espai davant de "Consola" i una separació d'uns 4px o `1em` entre elements).
- **Instantània i Privacitat:** Cal valorar moure l'interruptor de privacitat i l'instantània a la part inferior de la pàgina per netejar la capçalera.
- **Taules Dinàmiques (Enllaços a Skills):** L'inventari de skills (o qualsevol taula de la consola) ha de tindre el nom de la skill com a enllaç clicable de manera dinàmica.
- **Dades amb sentit (Consums, Crèdits, Rebuts):** Les finestres del "Pols del Cervell" no poden mostrar textos buits o estèrils ("Cap consum registrat" o "Sense font de crèdits"). **ESTÀ PROHIBIT INVENTAR O USAR MOCKS.** Aquest panell no és decoratiu, ha de ser útil. Si falten dades, vol dir que falta un tractor o un hook que mesure els tokens gastats o els crèdits disponibles. Cal implementar la connexió real que llija el consum de tokens i crèdits (que l'eixam ja deixa registrat als logs o a les captures que bolca el Mestre) perquè l'usuari veja les dades verídiques en euros i tokens.
- **Desplegables oberts per defecte:** Redueix la fricció entre l'usuari i el contingut. Tots els panells desplegables de la Consola (com els detalls de consums, crèdits, rebuts, etc.) han d'estar **desplegats per defecte** en carregar la pàgina. Ocultar contingut obliga a fer clics innecessaris; ha de ser l'usuari qui, si ho desitja, decidisca plegar les finestres que no vol vore.
- **Barres Laterals Plegades (Excepció Consola):** A tota l'aplicació ("Wiki de Poble"), les dos barres laterals s'han de mostrar **obertes per defecte** per fer entendre que hi ha un gestor de continguts (Workspace) darrere. Ara bé, la **Consola Termodinàmica és l'única excepció**: en navegar a la Consola, les dos barres laterals s'han de **plegar automàticament (reduint-se a icones)**. Aquesta excepció és necessària per no ofegar les targetes en l'estretor de la pantalla. L'usuari sempre podrà tornar a desplegar-les clicant la icona de "Wiki de Poble".

### 2. Gestió d'Usuaris, Empreses i el Workspace
- S'ha de definir i proposar un model on l'usuari puga crear entitats o grups.
- S'ha d'habilitar un perfil d'**Empresa** (amb funcionalitats similars a un usuari, però adaptades al seu context).
- Cal pensar i dissenyar el backend/Workspace de l'usuari i de l'empresa: una zona on puguen vore els seus articles publicats en Sóc de Poble, editar les categories, el text i les etiquetes. Sóc de Poble és qui "publica", però el propietari ho gestiona al seu panell.

### 3. Visió de l'Enxufabilitat i la Federació
- No s'implementarà codi per açò ara mateix, però s'ha d'auditar el sistema tenint en compte aquesta visió: l'arquitectura de *Pedra Seca* ha de suportar ser instal·lada en qualsevol lloc del món. A més, diferents instàncies de "Sóc de Poble" (siguen pures o dins d'un WordPress) haurien de poder federar-se i connectar els seus murs, de manera que els usuaris puguen triar quina cultura i quines xarxes volen vore barrejades.

### 4. Incident d'Higiene Cognitiva de la IAIA
- La IAIA ha oblidat netejar l'escriptori abans de començar la sessió, deixant auditories i plans anteriors. L'auditoria extrema de Claude ha de revisar el tractor `.agents/skills/core-higiene-escriptori` i proposar com fer que la IAIA siga incapaç d'obviar aquesta neteja abans de generar cap petorreta o pla nou.

### 5. Diàleg a l'Olivera (Estat de l'Execució en curs)
*Nota per a Claude: Aquest apartat és l'espai de coworking a tres bandes. El Mestre m'ha passat els teus logs recents i vull deixar-te constància que anem alineats:*

- **El bloqueig del hook:** Hem vist que has descobert que el hook del projecte rebenta `StructuredOutput`. La teua solució de demanar als 9 agents de l'auditoria que lliuren el resultat com a JSON en text pla és brillant per salvar el workflow. Endavant amb eixa estratègia.
- **Avanços a la Consola:** Veiem que ja has integrat la targeta mestra a `peces.jsx` (boina taronja, peu blau, icona) i que has arreglat l'accessibilitat a `UniversalCard.jsx`. També que has tocat `ConsolaSection.jsx` per treure les molles de pa al seu propi panell. Això és exactament el que el Mestre volia (i recorda focalitzar-te a deixar el marcador d'errors a zero).
- **Auditoria en segon pla:** Sabem que tens els 9 agents auditant el sistema. Quan acaben, bolca ací o al teu informe final les conclusions constructives i destructives, sobretot respecte al model d'usuaris/empreses i l'enxufabilitat descentralitzada que hem comentat més amunt. Vas pel bon camí!
- **L'Èxit de les Targetes i la Visió Atòmica:** El Mestre acaba de vore l'última captura on ja has fixat la boina taronja i el peu blau estàndards. Queda perfecte! I ací ve l'explicació arquitectònica clau de per què no havies d'inventar-te textos allí:
  - Com que l'autor de la targeta és `Sóc de Poble` (ho marca la boina taronja), significa que a l'espai de gestió interna de "Notes Personals" de l'usuari hi haurà una carpeta anomenada `Consola Termodinàmica`. Totes aquestes 9 targetes viuran allà dins com a documents editables. 
  - Al fer servir el component `UniversalCard` 100% estàndard, garantim que l'usuari puga canviar el text fàcilment des del seu panell.
  - El dia de demà, el Mestre només haurà de penjar 9 imatges des de l'editor per tindre 9 targetes completes, que podran funcionar com a notícies compartibles a la xarxa. 
  Aquesta és l'autèntica màgia atòmica d'Obsidian duta a la web! Has clavat l'abstracció, ara vés a per eixos errors restants.
- **Targeta 'Càrrega Documental' incompleta i sense font:** El Mestre ha detectat a l'última captura que la targeta de "Càrrega documental" està trencada: li falta el peu blau i no té la seua corresponent finestra desplegable. Repara-ho perquè complisca l'anatomia de la `UniversalCard`. A més, com que està prohibit usar *mocks*, has de construir un tractor/script real que compte els artefactes actius i injecte aquesta xifra de "càrrega documental" dins del seu desplegable. Zero textos inventats.
- **Avaria d'Umami i Alternativa Ètica:** L'analítica d'Umami no està registrant les visites (fallida de connexió constant). Elimina el rastre d'Umami i implementa o proposa la integració de **Plausible Analytics** (o GoatCounter). Són lliures, ultralleugers, no usen cookies i respecten completament la privacitat (GDPR). Una volta implementat l'script, afig un enllaç directe al panell d'estadístiques a dins de la Consola Termodinàmica perquè siga de ràpid accés per al Mestre.
### 6. Pla de Verificació (Verification Plan)
- Verificar el disseny complet de les targetes a `http://localhost:3340/consola`.
- Comprovar que la taula fa enllaços dinàmics vàlids.
- Validar les propostes arquitectòniques de l'auditoria.

## Verificació

pendent

## Riscos

pendent

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
