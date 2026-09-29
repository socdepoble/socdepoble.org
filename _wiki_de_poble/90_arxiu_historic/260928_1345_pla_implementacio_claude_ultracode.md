---
titol: "Pla d'Implementació T48-T50: Poliment i Recuperació de Funcionalitats"
data: "2026-09-28"
estat: "esborrany"
---

# Pla d'Implementació (Claude Ultra Code)

Aquest pla detalla les tres noves tasques que s'han d'implementar per polir l'entorn després de la marató T39-T47.

## T48: Resolució d'Errors a la Consola
- **Objectiu:** Netejar els errors que apareixen a la consola de desenvolupament del navegador.
- **Detalls:** El Mestre ha detectat errors recurrents a la consola (com ara "Multiple GoTrueClient instances detected in the same browser context" de Supabase i possibles errors 404 POST). S'han d'investigar i resoldre per mantindre la higiene tècnica de l'aplicació.

## T49: Ampliació del Límit de l'Entradilla a 256 caràcters
- **Objectiu:** Augmentar el límit màxim de caràcters de l'Entradilla/Lema.
- **Detalls:** El límit actual de 120 caràcters es queda molt curt per a descripcions tipus currículum o entradilles completes. S'ha de pujar a 256 caràcters a tot el sistema (formularis de frontend, validacions, base de dades i proves).

## T50: Recuperació de la Previsualització de la Targeta
- **Objectiu:** Tornar a habilitar la vista prèvia en viu de la targeta (card) mentre s'edita la fitxa.
- **Detalls:** Anteriorment, en formar la fitxa (tant al Perfil com a les Notes), es podia anar veient al mateix temps com quedaria la targeta (miniatura) resultant. Aquesta funcionalitat s'ha perdut. Cal investigar on estava implementada i recuperar-la (potser a `UniversalEditorShell` o als formularis de Perfil/Notes), assegurant-se que l'usuari torne a tindre eixe feedback visual immediat a la part dreta mentre escriu a l'esquerra.

## T51: Estandardització de la Barra Taronja
- **Objectiu:** Homogeneïtzar el comportament de la barra taronja a totes les vistes.
- **Detalls:**
  1. La barra taronja ha de mostrar **sempre** la data i l'hora a la part dreta, sense excepcions.
  2. Les icones que apareixen a la barra (com el "pin" o la bola del món) han de ser de color **blanc**, no negres.
  3. **Comportament de l'Emoticono/Ploma central:**
     - En **mode edició**, sempre hi ha d'haver un botó per obrir el selector d'emoticones. Per defecte (si no n'hi ha cap triat), es mostra la icona de la ploma. Si l'usuari tria un emoticono, aquest substitueix la ploma.
     - En la **targeta (card)** o mode lectura, si l'estat és l'opció per defecte (la ploma), **no s'ha de mostrar cap icona** (l'espai queda buit). Només es mostrarà si l'usuari ha triat explícitament un emoticono. Aquesta lògica universal garanteix que l'usuari sempre puga punxar per triar-ne un durant l'edició.
  4. **Comportament de la Data (Pastilla dreta):**
     - Tot document al sistema té una data. **No existeix cap document sense data**. En mode lectura, s'ha de mostrar sempre la data de l'última modificació (o la de creació si no s'ha modificat).
     - En mode edició, es mostra la data i hora d'ara (moment actual de l'edició).
     - Aquesta regla universal de la data s'ha de deixar per escrit i ben documentada al **Manual de Disseny (Pedra Seca)**.

## T52: Revisió i Actualització del Manual de Disseny
- **Objectiu:** Posar al dia el manual de disseny i el catàleg de components interactius.
- **Detalls:** Cal revisar a fons el manual de disseny i el catàleg visual (apartat de Disseny a la web). Hi ha elements desactualitzats i nous components (com la barra taronja, els formularis amb les noves accions, etc.) que encara no estan representats ("pintats") en el manual/catàleg. L'agent ha de detectar aquestes mancances i, depenent de l'espai de context (tokens), implementar directament l'actualització del catàleg o bé proposar les millores concretes per a una propera iteració.

## T56: Resolució de Regressions (Mercat, Pobles, Multimèdia)
- **Objectiu:** Arreglar la càrrega de dades en seccions que s'han desconnectat.
- **Detalls:** L'usuari reporta que les seccions de Mercat, Pobles i Multimèdia no carreguen les dades (ex: "Cap poble trobat"). A la consola de DevTools es veu un error relacionat amb `SessionProvider` dins d'`IdentitatProvider`. Cal investigar i resoldre aquesta desconnexió de l'estat o del context de Supabase per a aquestes tres pàgines, assegurant que tornen a carregar el seu contingut correctament.

## T57: Centrat de Botonera (Multimèdia)
- **Objectiu:** Ajustament visual a la secció Multimèdia.
- **Detalls:** A la vista "Arxiu visual" de Multimèdia, els botons de pastilla ("Galeria", "Cronologia") apareixen alineats a l'esquerra. S'han de centrar horitzontalment perquè queden al mig de la pàgina.

## T58: Autoria de la Nota d'Onboarding (Foraster i nous usuaris)
- **Objectiu:** Corregir l'autoria mostrada a la barra taronja per al document tutorial de l'inici.
- **Detalls:**
  1. El document "Bloc de notes" que veu el Foraster (o un usuari acabat de registrar) a la seua safata no és seu; és una publicació d'exemple creada per "Sóc de Poble".
  2. La barra taronja ha d'indicar sempre l'autor del document que s'està llegint, no la persona que mira la pantalla. Actualment, la barra posa "Foraster" erròniament i el logotip ha desaparegut. Ha de posar "Sóc de Poble" (amb el seu logo/avatar).
  3. Aquest document serveix perquè el Foraster veja com es comporta una UniversalPage completa. Un usuari registrat pot decidir "esborrar" aquesta publicació d'exemple del seu workspace personal, però l'autoria sempre pertany a Sóc de Poble.

## T59: Regressió Entradilla 256 (Backend / SQL)
- **Objectiu:** Finalitzar l'ampliació de l'entradilla a 256 caràcters al servidor.
- **Detalls:** La tasca T49 demanava ampliar el límit de l'entradilla a 256 caràcters (com l'antic Twitter). L'editor ara permet escriure-ho, però en guardar llança un error "400 Bad Request" avisant que el servidor no ho accepta per massa llarg. S'ha de revisar la base de dades (migracions SQL, taules, funcions o polítiques de Supabase) per assegurar que el límit de 256 s'aplica correctament també al backend.

## T53: Ajustos a la Barra Blava i Variacions Mòbils
- **Objectiu:** Polir l'espaiat de la barra blava (UniversalToolbar) i documentar el comportament responsive al manual/catàleg.
- **Detalls:**
  1. **Agrupació (Grup Esquerre):** El trio de navegació de l'esquerra (fletxa enrere, llibre, fletxa avant) té massa separació entre les icones; s'ha de reduir l'espai perquè es perceba visualment com un grup únic.
  2. **Centrat (Grup Central):** El trio central (traductor, comentari, compartir) ja sembla un grup, però s'ha d'assegurar que estiga correctament centrat a la barra blava, entre el grup esquerre i el botó dret.
  3. **Variació Mòbil (Botó Dret):** Quan la pantalla és menuda, el botó complet de text (ex: "CONNECTAR") desapareix i es converteix en un botó circular menut amb un signe "+".
  4. **Documentació:** Aquestes variacions i agrupacions han de quedar clarament descrites al manual de disseny i, si els tokens ho permeten, representades al catàleg de controls de barra.

## T54: Flux de Connexió i Mode Lectura Estricte
- **Objectiu:** Aconseguir que el sistema "Connectar" funcione com un autèntic read-it-later (Raindrop) amb espais de lectura fluids.
- **Detalls:**
  1. **Diàleg de Connectar:** Quan l'usuari fa clic a "Connectar", la pantalla on tria l'abast i la privacitat hauria d'incloure una previsualització visual (una mini-card o miniatura amb foto i títol) d'allò que està a punt de guardar.
  2. **Visualització de Connexions:** En obrir un element des de "Notes > Connectats", no ha de semblar una nota nova en blanc per començar a escriure el títol, sinó que ha de carregar l'article sencer original (la UniversalPage de l'autor).
  3. **Protecció i Mode Lectura:** Com que és un article aliè, s'ha de mostrar en "mode de visualització" pur, bloquejant les barres d'edició i la ploma. L'objectiu és que l'usuari puga amagar els menús laterals i fer servir la interfície exclusivament com un entorn de lectura, estudi i recopilació sense distraccions.

## T55: Neteja i Realisme del Xat (Preparació per a interacció humana)
- **Objectiu:** Fer que el xat siga funcional i connecte l'usuari amb els perfils reals existents, llevant brossa de "IA".
- **Detalls:**
  1. A la llista de xats o contactes han d'aparèixer, per defecte, els usuaris reals del sistema (Sóc de Poble i Javi Llinares), de manera que qualsevol usuari nou que es registre puga interactuar-hi directament.
  2. S'ha de netejar el xat de qualsevol element simulat o "mock" genèric de IA. El focus ha de ser la comunicació persona a persona. Si es manté el perfil de la IAIA MarIA com a assistent funcional, endavant, però s'ha d'eliminar la complexitat innecessària per prioritzar la connexió orgànica entre l'usuari i els administradors de la plataforma.
  3. **Lògica del botó "Comentar" (Barra blava):** Atés que els usuaris reals ja existeixen, el botó central de comentari de la barra blava (UniversalToolbar) té una funció molt clara: obrir una conversa de xat directa amb l'autor de la fitxa/publicació. Per exemple, si algú veu l'ordinador de Javi al Mercat i fa clic a "Comentar", el sistema l'ha de portar al xat privat amb Javi. Aquesta integració s'ha de deixar implementada de forma senzilla.
