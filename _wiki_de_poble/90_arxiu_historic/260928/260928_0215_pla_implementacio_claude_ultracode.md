---
titol: "Pla d'Implementació T39-T47: Poliment de components, recerca i realitat"
data: "2026-09-28"
estat: "esborrany"
---

# Pla d'Implementació (Claude Ultra Code)

Aquest pla detalla les tasques que s'han d'implementar per polir l'Editor de Documents, les previsualitzacions, la gestió d'identitat, la pàgina de realitat i el motor de cerca.

## T39: Redisseny de la Selecció de Drets d'Autor
- **Objectiu:** Substituir el xicotet diàleg per una vista completa (`CopyrightPage.jsx`) que es munte a l'editor.
- **Detalls:** Ha de llistar les llicències de forma didàctica i explicar que l'elecció feta al perfil s'heretarà per a futures publicacions.

## T40: Selector de Data de Publicació (Calendari Unificat)
- **Objectiu:** A la barra taronja, la data i hora ha de ser clicable i obrir un popover amb el calendari.
- **Detalls:** Cal reutilitzar EXACTAMENT la mateixa estructura de component de calendari usada a la Consola Termodinàmica (`CalendariMapa.jsx`), adaptant-lo perquè càpiga en xicotet. S'eliminarà l'avatar/selector d'identitat d'esta barra perquè ja està a dalt a la TopBar negra.

## T41: Selector de Visibilitat i Botó Publicar
- **Objectiu:** El botó de visibilitat (la bola del món) i el botó taronja de "PUBLICAR" a la fitxa no han de canviar l'estat en silenci (toast). Han d'obrir un menú didàctic interactiu.
- **Detalls:** Quan la persona intente publicar o commutar l'estat, cal mostrar-li un menú que permeta triar clarament entre Fitxa Pública (tothom sap que hi eres) i Fitxa Privada (amb candau, ningú et veu i fas el que vols). Cal unificar el disseny d'aquestes finestres flotants i explicar bé que la publicació es pot tornar a fer privada quan es vullga.

## T42: Millora del Diàleg de Vista Prèvia d'Impressió
- **Objectiu:** L'actual `<Dialeg>` de vista prèvia té "massa scrolls" i es es veu menut malgrat tindre espai.
- **Detalls:** En `DocumentPrintPreview.jsx`, cal modificar els estils (`.sdp-print-dialog` i `.sdp-print-preview`) perquè el diàleg siga més alt (ex: `90vh`) i el contingut de l'iframe s'hi adapte sense generar doble scroll innecessari.

## T43: Lògica de Connexions i Identitat Activa
- **Objectiu:** Integrar la lògica per poder connectar amb qualsevol element (entitats, carpetes, persones, pobles, publicacions) i garantir que la identitat activa és sempre evident.
- **Detalls:**
  1. Aprofitar la vista de "Connectar" perquè permeta interaccions molt granulades:
     - Les connexions poden ser Públiques (per a tothom), Privades, o només "Entre grups" / "A determinades persones" (amics).
     - El botó Connectar serveix per connectar Persones, Categories, Etiquetes o fitxers del teu propi workspace, però **també Pobles i Publicacions**. En definitiva, qualsevol entitat del sistema que tinga el botó "Connectar" ha de ser connectable.
  2. Les entitats/grups/empreses han de poder tindre (opcionalment) un correu electrònic propi. Si no en tenen, s'utilitza per defecte el del creador de l'entitat.
  3. Assegurar-se que l'avatar de la identitat activa es mostra clarament a la barra superior per no confondre l'autoria de qui actua.

## T44: Redisseny de la Pàgina de Realitat (`/realitat`)
- **Objectiu:** Millorar l'aspecte visual de la pàgina on es tria el Nivell d'Interacció amb la IA i els acompanyants.
- **Detalls:** L'actual distribució de llistes en blocs grisos és poc atractiva. Cal aplicar un disseny molt més premium (targetes visuals per a cada nivell, descripcions clares, efectes d'estat actiu/inactiu, etc.) que deixe clar què significa cada nivell de connexió.

## T45: Cerca Avançada i Solució de Resultats Buits (`/cerca`)
- **Objectiu:** Convertir el cercador actual en un cercador avançat (tipus Google) i arreglar el fet que actualment no retorne resultats d'usuaris que sí que estan al sistema.
- **Detalls:**
  - Afegir opcions de filtre (cerca per persones, per pobles, per articles, per esdeveniments, etc.).
  - Revisar la lògica de l'índex o de la cerca al client (`SearchSection` o on estiga) per garantir que trobe les persones registrades i el contingut creat.
  - Millorar el disseny dels resultats (targetes riques, previsualitzacions, etc.) i el calaix del cercador.

## T46: Eina de Re-enquadrament per a Imatges (Crop/Re-frame)
- **Objectiu:** Permetre a l'usuari re-enquadrar les imatges pujades (la imatge Hero i la imatge principal ItemMedia).
- **Detalls:** Sovint les fotos són panoràmiques i el retall automàtic central talla elements importants. Cal afegir un quadre d'eines bàsic (un "cropper") en pujar o editar una foto que permeta moure-la per centrar l'atenció on cal. Per defecte hauria d'oferir format quadrat, però permetent mantenir el format original o triar-ne d'altres si és possible.

## T47: Incidència Crítica d'Autodesament (Pèrdua de Dades)
- **Objectiu:** Resoldre un error pel qual el text escrit a l'editor (ex: l'entradilla del Perfil) es perd en canviar de pàgina.
- **Detalls:** El Mestre ha detectat que l'H2 s'ha guardat, però el text de l'entradilla s'ha esborrat en anar-se'n i tornar. Aquest sistema ha de funcionar com Google Docs: **tot el que s'escriu s'ha de guardar automàticament a l'instant**, sense necessitat de prémer cap botó de guardar. Cal revisar `UniversalEditorShell` o la lògica del TipTap per garantir que l'autodesament és totalment fiable a tot el sistema.
