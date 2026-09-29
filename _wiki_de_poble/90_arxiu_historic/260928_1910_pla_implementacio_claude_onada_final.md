---
type: document
status: canonic
description: Pla d'Implementació de l'Onada Final (T61-T71)
---

# Pla d'Implementació: Tancament i Poliment Final d'UX (Onada Final)

## Objectiu Principal
Rematar el poliment de l'experiència d'usuari (UX) de l'arquitectura de Pedra Seca, netejar les dades d'exemple del sistema (contactes falsos) i establir la funcionalitat completa d'autoria, emoticones de perfil i rutes consistents per deixar la branca perfecta.

## T61: Fals Actiu a la Barra de Control (Pobles)
- **Objectiu:** Corregir que s'il·lumine "Pobles" erròniament a la barra esquerra.
- **Detalls:** En visitar el perfil de l'usuari (`/el-meu-perfil`), l'opció "Pobles" queda marcada com a activa a la barra blava (CONTROL). Això és incorrecte perquè l'usuari s'hi navega a través del botó superior, no des de la llista de pobles. Cal corregir el sistema de *matching* de rutes del component de navegació perquè s'assegure que la ruta del perfil no il·lumine cap secció no relacionada a la barra esquerra.

## T62: Canvi de Color a Menús Secundaris (Blau en lloc de Taronja)
- **Objectiu:** Canviar el color d'estat "actiu" en les llistes de navegació secundària per evitar el xoc visual.
- **Detalls:** Actualment, a la columna secundària (per exemple, el menú d'apartats del Perfil, o l'índex del catàleg de disseny), l'element que està actiu es marca amb fons taronja (`--sdp-accent`). El problema és que eixe taronja es toca amb la Barra Taronja de la capçalera de l'editor, i es genera massa concentració de color (un "nyap" visual). 
- **Acció:** S'ha de canviar eixe estat actiu a blau (`--sdp-accio`) en totes les llistes/menús secundaris per afinar el disseny. **Important:** Quan el fons passa a ser blau, el text i la icona del botó han de ser obligatòriament blancs (`#ffffff` o `--sdp-blanc`) per a garantir un contrast i llegibilitat òptims.

## T63: Neteja del Xat i Redirecció de "Comentar" a Grup Comú
- **Objectiu:** Millorar l'experiència inicial del Xat i enllaçar els comentaris.
- **Detalls:**
  1. El mòdul de Xat actualment mostra converses i usuaris falsos/robots. S'han d'eliminar de les dades de llavor perquè només queden contactes reals per defecte.
  2. **Concepte de Comentaris:** Com que cada publicació/element de la xarxa té la seua Pàgina Universal (i no deixa de ser una targeta tipus Obsidian), no mostrarem comentaris anidats davall de la publicació a l'estil clàssic. Quan l'usuari faça clic a "Comentar", s'ha d'obrir/redirigir directament al **Xat comú de grup** associat a eixa pàgina, on es genera el debat col·lectiu.

## T64: Centrar Botonera Multimèdia
- **Objectiu:** Poliment d'alineació.
- **Detalls:** Centrar horitzontalment els botons tipus pastilla ("Galeria", "Cronologia") a la secció Multimèdia de l'aplicació perquè queden perfectament alineats.

## T65: Autoria Obligatòria de la Nota d'Onboarding
- **Objectiu:** Corregir qui apareix com a creador del document d'exemple.
- **Detalls:** A la safata "Notes personals" dels nous usuaris/forasters apareix un "Bloc de notes" que funciona com a tutorial. Actualment la barra taronja assigna l'autoria al "Foraster" erròniament.
- **Acció:** Com que és una publicació de sistema només de lectura, la barra taronja ha de forçar l'autoria de "Sóc de Poble" (amb el seu logotip oficial) independentment de qui ho llija. Aquesta modificació ajuda a entendre al visitant que eixa publicació és del sistema, tot i estar a la seua safata privada.

## T66: Desar Emoticona al Perfil
- **Objectiu:** Permetre desar oficialment una emoticona per al Perfil d'Usuari.
- **Detalls:** Tot i que la UI del Perfil ja permet escollir una emoticona, actualment la base de dades no té cap columna on desar-la. 
- **Acció:** S'ha de generar una migració per afegir el camp `icon` a la taula `profiles` de Supabase i actualitzar els mètodes *RPC/UPSERT* del codi font perquè les actualitzacions del perfil de l'usuari (i el seu estat *llavor*) persistisquen l'emoticona triada com ho fan les Notes.

## T67: Menús "Grups" i "Comunitats" al Xat (Basat en Pàgines Universals)
- **Objectiu:** Replicar l'estructura del WhatsApp real i connectar-la a l'arquitectura.
- **Detalls:** L'èxit d'esta aplicació resideix en imitar la fluïdesa de WhatsApp reduint la corba d'aprenentatge. Als menús del xat cal diferenciar clàssicament entre "Nova conversa", "Nou grup" i "Nova comunitat". **El concepte arquitectònic central:** Un Grup o Comunitat naix a partir d'una Pàgina Universal. Això significa que els comentaris sobre un article o comerç (p. ex. l'Almàssera) es converteixen en un Xat Comú o Comunitat (en lloc d'estar incrustats a la pàgina). Les targetes de Xat han d'estar preparades visualment per a aquesta estructura (amb distintius de grup/comunitat).

## T68: Botó "+" Centralitzat i Eliminació dels 3 punts
- **Objectiu:** Netejar la UI del Xat eliminant botons redundants.
- **Detalls:** Actualment hi ha un botó de tres punts (`...`) per seleccionar xats, a més del botó `+`. S'ha d'eliminar completament el botó dels 3 punts.
- **Acció:** Traslladar l'opció "Seleccionar converses/chats" a dins del menú desplegable del botó `+`. Així el botó `+` mostrarà: "Seleccionar converses", "Nova conversa", "Nou grup", "Nova comunitat", seguit de la llista de "Contactes freqüents".

## T69: Filtres Natius al Buscador del Xat
- **Objectiu:** Replicar el comportament de cerca de WhatsApp.
- **Detalls:** En fer clic a la barra de cerca "Buscar/Cerca una persona", no s'ha d'obrir cap capçalera blava estranya. El cercador ha de ser **global per defecte** (buscar qualsevol paraula dins de qualsevol apartat, ja siguen converses, persones, fotos, etc., sense triar categoria abans).
- **Acció:** Sota de l'input s'ha de mostrar un llistat de filtres tal com fa WhatsApp ("Converses", "Persones", "Fotos", "GIF", "Enllaços", "Vídeos", "Documents", "Àudio", "Enquestes", "Esdeveniments"). Aquests filtres són només opcions visuals per acotar la cerca (com fa l'app original), però l'input ja busca a tot arreu.

## T70: Auditoria i Unificació de la Barra Taronja al Xat (Anti-Fantasmes)
- **Objectiu:** Eliminar qualsevol component "fantasma" de la Barra Taronja.
- **Detalls:** S'ha detectat que la Barra Taronja que es mostra a la dreta en el mòdul de Xat sembla tenir un comportament diferent en la pastilla de la data i l'hora (només mostra la data). 
- **Acció:** Auditar la vista de detalls del Xat per assegurar-se que utilitza el component oficial unificat `src/components/universal/barres/BarraTaronja.jsx`. Si utilitza una versió vella o hardcoded, substituir-la immediatament pel component canònic. Recorda: la pastilla de la data i hora és innegociable i ha d'estar sempre present.

## T71: Reparació del flux 'Connectar' i Lògica Raindrop
- **Objectiu:** Evitar que l'acció "Connectar" clone i deforme les publicacions internes, i definir el model d'ingesta externa.
- **Detalls:** Actualment, en connectar un element intern (p. ex. "L'Ànima de la IAIA"), el sistema crea una nota nova, assigna l'autoria al visitant (Foraster) i posa placeholders per defecte, perdent la imatge i el contingut real.
- **Acció per a Contingut Intern:** "Connectar" un article de Sóc de Poble ha de funcionar com el "Compartir" de Facebook o "Guardar element". No s'ha d'alterar l'article original ni l'autor. L'usuari simplement desa un accés directe a la seua safata (`/notes`). En obrir-lo, ha de veure **l'article original exacte** (amb el seu autor legítim, només de lectura), embolicat amb la UI de les seues carpetes i etiquetes personals.
- **Acció per a Contingut Extern (Bookmarklet tipus Raindrop):** Si el contingut prové de fora de la xarxa (un article extern importat via futur bookmarklet), s'ha de crear un **nou element editable** dins de la safata de l'usuari. El sistema agafarà el títol, subtítol i entradilla de fora i crearà una Pàgina Universal tancada, però com que és extern, l'usuari el podrà obrir i editar per als seus apunts. Claude ha de deixar preparades les bases per a aquesta dicotomia (intern = read-only shortcut; extern = editable clone).

## Procediment Categòric
Totes les implementacions i regles visuals modificades han d'heretar-se del Reglament de Pedra Seca. Aquesta és la pròxima gran i (esperem) última onada funcional per tancar el paquet sencer amb l'aprovació total de la Test Suite.
