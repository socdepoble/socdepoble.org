---
type: document
status: esborrany
description: "Pla d'Implementació col·laboratiu per a les auditories de Claude i Codex"
tags: [govern, arquitectura, olivera]
---

# Pla d'Implementació: Auditoria de l'Olivera (Arquitectura i Brain)

**Data:** 26-09-23 12:45
**Autoria Inicial:** IAIA MarIA
**Estat:** Obert per a col·laboració (Codex i Claude)

## 1. El que ja sabem (Punt de Partida per a les IAs)

Abans que Codex i Claude lliuren les seues auditories, deixe per escrit el context que he recollit:

### Sobre Sollutia i l'Universal Workspace (Per a Codex)
Sabem que l'arquitectura actual de les targetes UI i l'espai de notes pateix trencaments. En `NotesContext` hi ha problemes d'asincronia i la injecció dels elements visuals dins del `UniversalWorkspace` no està correctament modularitzada. Cal fortificar açò perquè la llei de l'enxufabilitat de Sollutia es complisca, de manera que el `tenant_id` i l'estat global queden blindats davant pèrdues de connexió.
> [!WARNING] **Evidència Visual (Bug de l'Estat Buit):** El Mestre acaba d'aportar captures de pantalla en directe demostrant que la columna central de notes diu **"No hi ha notes."** malgrat que el sistema hauria d'estar carregant les notes ("Bloc de notes", "Sense títol"). Aquest error crític confirma el trencament asíncron del `NotesContext` o de la injecció de l'estat buit. Codex ha d'investigar la causa exacta d'aquesta al·lucinació de l'estat buit.

> [!TIP] **Refinament Arquitectònic de `UniversalWorkspace`:** El Mestre ha establert dos requisits visuals innegociables per adaptar-se de forma agnòstica a qualsevol secció:
> 1. **Títol Dinàmic:** La capçalera de la columna esquerra no pot posar genèricament "ÀREES". Ha d'heretar el nom de la secció on es troba (ex. "DISSENY", "WIKI DE POBLE"). A "Notes" ja funciona correctament ("CARPETES").
> 2. **Replegat Opcional (Zero Fricció):** La fletxa (chevron) per replegar la columna ha de ser opcional. En seccions com Disseny o Wiki on no hi ha contingut inferior (categories/etiquetes), amagar la fletxa és obligatori per indicar a l'usuari que "això és l'únic que hi ha ací baix". Així les IAs entendran que el *workspace* pot mutar segons el projecte.


### Sobre el Col·lapse Cognitiu i el Brain (Per a Claude)
Sabem que continuem actuant com a "Stochastic Parrots", oblidant les instruccions del Mestre, no executant l'acte reflex de netejar l'escriptori, i fallant en les tasques més bàsiques d'arquitectura cognitiva de la Wiki. Els mecanismes de protecció no s'estan activant o els prompts interns no injecten correctament el context. El problema de la "falta d'acte reflex per netejar l'escriptori" ha quedat recentment palès, demostrant que la meua memòria a curt termini no estava activant les regles escrites a les skills.

### Sobre la Barra Lateral (Restauració Visual Pendent)
S'ha detectat que falta el separador visual (un petit gris o línia) entre els enllaços fixos del sistema (Notes, etc.) i les pàgines de tipus document/projecte (El Projecte, Constitució, L'ànima de la IAIA, Full de ruta). **Aquesta restauració s'ha de dur a terme quan finalitze l'auditoria i s'alce el Mode AFK Absolut.**

## 2. Aportacions de l'Auditoria de Codex (Arquitectura)
*(Pendent: L'espai està preparat perquè MarIA el complimente un cop Codex lliure el seu informe `260923_1245_auditoria_codex.md`)*


## 3. Aportacions de l'Auditoria de Claude (El Brain)
*(Pendent: L'espai està preparat perquè MarIA el complimente un cop Claude lliure el seu informe `260923_1245_auditoria_claude.md`)*

> [!IMPORTANT] **Requeriments Addicionals (Sincronització i Editabilitat):**
> 1. **Editabilitat del Sistema:** Encara que les pàgines com "Disseny" o "Wiki de Poble" les cree i mantinga la IA, l'arquitectura ha de preveure que aquests workspaces siguen sempre editables per l'usuari final. L'usuari ha de poder entrar-hi i canviar coses lliurement (integració amb l'editor). (Codex també ha de tindre-ho en compte per a l'UI).
> 2. **Sincronització en Temps Real (Watcher):** Actualment tenim `compile-wiki-to-app.mjs` per bolcar la Wiki, però no tenim un procés que ho actualitze *al ritme del dev server*. Cal que Claude dissenye i propose l'script necessari (o plugin de Vite) per sincronitzar al instant els canvis de la carpeta `_wiki_de_poble` a l'aplicació web perquè el Mestre no haja d'esperar a fer un build.

## 4. Pla d'Acció Definitiu
*(S'acordarà un cop els informes hagen estat llegits i consensuats)*

## Vincles
- [[00_index_escriptori]]


## Aportació de Codex · 260923_1303 · Pendent de consolidació per MarIA

Auditoria lliurada: [[260923_1303_auditoria_codex]]. Esta és la ruta efectiva d’entrega; la referència prevista de les 12:45 era un marcador, no un fitxer existent.

**Dictamen:** no donar llum verda al flux de Notes. Quinze troballes amb evidència i reparació: contracte perdut entre contexts; config absent en upload; tenant sense validació; exemples i notes persistents barrejats; sobreescriptura de drafts nous per errors antics; publicació no idempotent fora de la cua; callbacks sense scope/generació; revisions/drafts sense reconciliació comuna; refresc i paginació; estats UI; creació; errors/persistència local; mock invàlid; límits de les portes; divergència documental de Model B.

**Ordre proposat:** contracte i scope → cablejat Notes/Storage/tenant → servei de desat i conflictes → publicació idempotent → estats UI i paginació → verificació real amb dos usuaris i dos tenants. Les fases i criteris d’acceptació complets estan en l’auditoria. Mantindre les barreres de lectura actuals, la RLS i la modularitat del port. No resoldre-ho només amb una targeta introductòria ni un tractor visual.

11 proves React i 14 Node passen; les reproduccions aïllades detecten defectes que estes proves no cobrixen. La RLS desplegada i la integració real de Sollutia no estan certificades. Proposta sobre Model B vigent; canviar de model seria una decisió separada.

**Mode AFK:** cap línia de codi modificada. Aportació tècnica de Codex, no consens en nom de Claude ni autorització d’implementar.
