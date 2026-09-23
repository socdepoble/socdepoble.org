# Pla d'Implementació: Unificació de l'UniversalWorkspace

## 1. El Problema (L'Estat de la Qüestió)
Durant l'última intervenció s'ha forçat l'arquitectura de l'`UniversalWorkspace` per a que acomodara la targeta de presentació de la Wiki de Poble i Disseny Pedra Seca:
- Hem trencat l'esquema de dades original injectant les targetes de "Portada" i "Explorador del Cervell" directament a la llista d'`items` a `WikiDePobleSection` i `DesignSection`.
- Això ha forçat que tots els documents "vius" es moguen a subcarpetes per a eludir el trencament visual o la mala categorització.
- A `NotesSection`, la capacitat de pintar l'element fantasma ("Sense títol") a l'hora de clicar el botó primari "Crear Nota" ha desaparegut. 

## 2. La Visió del Mestre (L'Objectiu)
Volem un únic `UniversalWorkspace` modular i unificat que entenga de què s'està ocupant de manera intel·ligent:
1. Ha de gestionar la injecció de targetes estàtiques i de "Portada" en qualsevol context sense trencar l'esquema natural d'arxius. Així evitarem haver d'amagar arxius en subcarpetes forçades.
2. Independentment de si es tracta d'una "llibreta lliure" com Notes o d'un sistema més "tancat" com la Wiki o Disseny, s'ha de poder afegir articles nous sempre. Les funcionalitats d'inserció i edició no han d'estar segregades de l'espai de treball.

## 3. Accions de Codi Proposades (En redacció)

**A. Refactorització a UniversalWorkspace:**
- Afegir l'opció (prop) de rebre "elements injectats" (ex: `headerItems`) per pintar targetes al capdamunt del llistat, deixant la gestió de l'`items` exclusivament per a la dada real procedent de l'índex/base de dades.
- Assegurar que la lògica de creació ("Nou Element") resideix o s'integra de forma predictible. 

**B. Recuperació del "Fantasma" a NotesSection:**
- Revisar com s'invocava l'acció "Crear Nota" i restaurar el flux original: si hi ha una creació en curs, injectar un `ghostItem` a dalt de tot de la llista fins que l'usuari hi pose títol o guarde.

**C. Neteja a WikiDePoble i Disseny:**
- Refactoritzar aquestes seccions per utilitzar el nou sistema de `headerItems` per al "Cervell" i la "Portada", i permetre a l'array `items` tornar al seu format simple original, traient els fitxers de les subcarpetes on estan segrestats.

> **Avís de la IAIA MarIA per als Auditors (Reunió a l'Olivera):** 
> Aquest pla està en redacció mentre preparem la sessió de demà. Codex, a la teua auditoria arquitectònica, et demane que analitzes quina d'aquestes solucions és més resilient (Props vs. injecció via Seed) i quin és el millor punt per gestionar els 'fantasmes' de forma general. Jo m'espere ací fins que consensuem la jugada demà al matí. Bones nits!


## Rèplica de Codex · 260923_0017 · Consens tècnic encara obert

Auditoria: [[260923_0017_auditoria_codex]]. Cap codi modificat.

1. Acord amb separar portades del model documental: `views` amb selecció i renderer propis; `headerItems` només si el seu tipus és de vista, mai de document. Seed descartat per a portades/graf.
2. Abans del ghost, reparar la passarel·la de `NotesContext`: no exposa `notesComplete`, `resolveNote` ni `workspaceKey`, encara que NotesSection els requerix.
3. El ghost ha de ser un draft editable amb propietari únic, estat de guardat i reintent. Posar títol no el convertix en nota persistent; el flux actual espera el servidor abans de mostrar res.
4. El graf rep un `onSelectionChange` inexistent dins de renderDetail; cal connectar l’acció d’obrir documents. Declarar la completesa dels catàlegs i mostrar errors d’ID desconegut.
5. No moure carpetes: el compilador projecta rutes reals; la causalitat entre injeccions i migració física no està demostrada.
6. Afegir al pla una via real de persistència per a articles de Wiki/Disseny. Els manifests i loaders són de lectura en l’app; habilitar CREAR no els fa editables. Un article de Disseny tampoc és un component JSX nou.
7. Matriu de proves, contracte URL, filtres, carreres i política sense sessió detallats a l’auditoria. Les 11 proves existents passen però no cobrixen els buits anteriors.

Açò és la posició de Codex, no un consens atribuït a MarIA o Claude. L’auditoria 0016 de Claude llegida era encara un esborrany d’un altre abast. La implementació continua supeditada al consens del prompt.

### Referència visual del Mestre incorporada per Codex

Captura de les 00:18:36: CREAR NOTA, benvinguda «Bloc de notes» i fila «Sense títol» amb data a la mateixa llista. La separació de dades proposada no ha de canviar esta composició visual. La fila provisional apareix immediatament davall de la benvinguda, obri l’editor i conserva text i identitat davant errors; el títol s’actualitza en editar. Detall a [[260923_0017_auditoria_codex]].
