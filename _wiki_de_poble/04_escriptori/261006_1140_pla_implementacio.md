---
type: document
status: esborrany
description: Pla per a la segona tanda de prompts
tags:
  - implementacio
visibility: private
reflex: sdp:torn_402313e4-3446-4d79-bb2b-fee87b9fc21a:94a01c63-2563-45d2-8112-d92def027048
---
# Pla Implementacio Segona Tanda

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_402313e4-3446-4d79-bb2b-fee87b9fc21a:94a01c63-2563-45d2-8112-d92def027048 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-06T09:39:46.884Z |
| Modificació | 2026-10-06T09:39:46.884Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude |
| Tokens consumits | Pendent |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-06T09:39:46.884Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

- Anàlisi detallada del fitxer CSV amb la checklist de Tellado.
- Redacció d'un informe d'auditoria que abstraiga les estratègies de contenció, reparació i protecció de WordPress cap a l'arquitectura de Sóc de Poble.
- **DEUTE TÈCNIC (FRONTEND I AUTH):** 
  - Arreglar el sistema d'accés (Login). El botó de "Forçar entrada local (Mock)" no funciona.
  - ~~**Bug latent 1:** `auth.js:856` cridar `logout('others')` esborra la sessió local abans de revocar-la, tancant la sessió al navegador actual i deixant l'orfe al servidor.~~ (✓ Corregit)
  - ~~**Bug latent 2:** `tancaRealtime()` s'executa després d'haver buidat el client, per la qual cosa no tanca res.~~ (✓ Corregit)
  - ~~**AAL2 (2FA):** Afegir el requeriment de segon factor (AAL2) de Supabase a la política de `private.es_superadmin()`. Així blindem el sistema sencer sense tocar React.~~ (✓ Corregit)
  - ~~**Llegir IP:** Actualitzar `private.capcalera_client` per llegir la IP del visitant de manera segura i moderna (fix extret de Vigilante v2.11.8).~~ (✓ Corregit)
- **DEUTE TÈCNIC (BACKEND I CONSOLA):**
  - **Auditoria LEDGER:** Igual que l'audit log de Vigilante, el LEDGER s'ha de millorar perquè alerte si hi ha edicions ocultes al mig de l'arxiu.
  - ~~**Rotar clau DeepL:** S'ha filtrat per un agent a través d'un `cat .env`.~~ (✓ Corregit)
  - **Capçaleres de Seguretat:** Actualment Firebase no està rebent les capçaleres de seguretat `vercel.json` i `CSP` del repositori, només `HSTS`. Cal alinear els builds i els headers per a producció.
  - **Configuració Supabase:** Revisar les taules antigues a producció i protegir el bucket `mitjans` que ara mateix es pot llistar sense sessió. Activar 2FA als proveïdors oficials.
- **AUDITORIA VISUAL I UX (FRONTEND):** 
  - **Correccions Universal Page:** 
    - **Barra blava:** L'organització d'icones ha de ser: la fletxa de "tornar arrere" a l'esquerra, la taula de continguts (icona de llibre) centrada, i la fletxa de "cap avant" a la dreta. Aquest trio d'icones queda perfectament estructurat amb el llibre just al mig.
    - **Barra taronja (Barra d'autor):** Aquesta barra és ESTRICTAMENT una barra d'autor. On has posat "Notícies del Poble", ha d'anar el nom de l'autor de la publicació (ex: "Sóc de Poble", o el nom de la persona/entitat). Aquesta és una regla inamovible d'aquesta barra.
    - **Cos de la publicació:** Has deixat text pla mal maquetat baix de la imatge ("Notícies..."). Sota la imatge principal ha d'anar tot l'entramat visual de la publicació: el logotip i autor, l'H1 (títol principal), les etiquetes associades i, finalment, el copyright baix de tot. Cal respectar l'arquitectura de l'UniversalPage que ja teníem definida.
  - **Simplificació de la Sidebar:** El menú lateral actual és massa dens i espanta (abruma) l'usuari. Cal deixar només l'essencial a la vista (`Control`, `Xat`, `Mur`, `Mercat`, `Pobles`, i moure ací dalt `Notes personals`). Tota la resta (`Calendari`, `Multimèdia`, `Dispositius`, `Disseny`, `Wiki de Poble`, `El projecte`, `Constitució`, etc.) s'ha d'agrupar i amagar dins d'un menú desplegable/acordió anomenat `Sistema`. A més, els enllaços inferiors de `Versions` i `Legal i privacitat` s'han d'integrar també al final d'aquest menú `Sistema`, mantenint el seu color groc per a diferenciar-los de la resta, però eliminant el contenidor independent de baix.
  - **Llista de Xats en Producció (Bug):** A l'entorn de producció (ex. La Torre), només apareix el xat del poble ("La Torre"), però desapareixen els xats globals del sistema ("Sóc de Poble" i "IAIA MarIA") que sí que es veuen en local. Cal revisar la consulta o el filtratge de converses perquè els xats institucionals/globals apareguen sempre per a tots els pobles.
  - **Arxiu Visual (Galeria a l'estil Google Photos):** En la secció Multimèdia, la gestió d'imatges ha de ser simple. En fer clic sobre qualsevol imatge de la graella, ha d'aparèixer un visor amb un panell lateral o modal que mostre les metadades (EXIF, prompt de la IA) i l'historial d'ús (en quin article o mòdul s'està utilitzant).
  - **Logotip de la Sidebar:** El logotip de Sóc de Poble a la part superior del menú lateral està descentrat. S'ha de centrar horitzontalment respecte al contenidor perquè respire igual pels dos costats.
  - **Barra de navegació inferior:** Hi ha massa marge als extrems (uns 48px per costat) i els icones queden molt junts al centre. Cal reduir el marge lateral a 24px i repartir millor l'espai ("aire") entre els icones perquè respiren més.
  - **Comportament del Xat:** La funcionalitat de deixar un tros de columna visible per tornar arrere (habitual en l'Espai de Treball) NO aplica al xat. El xat ha de ser un clon estricte de WhatsApp (pantalla completa per a la conversa quan s'obri, sense que es note la mecànica de l'escriptori).

- **DESENVOLUPAMENT FRONTEND (CLON LOIVERSE):**
  - **Maquetar el TPV (Loiverse):** Dins del sistema, reproduir la UI de Loiverse al mil·límetre (àrea de tiquets a l'esquerra, graella de productes a la dreta).
  - **Capacitat Offline (Prioritat):** L'arquitectura del TPV s'ha de dissenyar tenint sempre en compte que haurà de funcionar sense connexió a Internet (offline). Això és essencial per a l'objectiu d'hipermodularitat i autonomia.
  - **Unificar la gestió de productes:** Separar la lògica entre productes domèstics i productes per a bars.
  - **Bars i Marques:** Qualsevol bar ha de poder entrar com a usuari registrat, posar la seua marca, i vendre els seus productes. Han de tindre una "Carta digital" i una carta de "Menjar per a casa".
  - **Verificar login:** Assegurar que l'accés com a usuari registrat funciona perfectament al llarg del procés.

- **DESENVOLUPAMENT FRONTEND (GESTORIA):**
  - **Capacitat Offline (MOLT CRÍTIC):** La Gestoria gestiona dades personals, financeres i sensibles (impostos, facturació). S'ha d'arquitecturar perquè funcione de manera completament **offline** (sense connexió), per màxima seguretat i privacitat.
  - **Integració amb el TPV:** Enllaçar tot el sistema de compres i vendes del TPV amb l'usuari/entitat activa (siga un bar, un compte personal, un grup ecologista o una empresa).
  - **Canvi de context (Selector d'Entitat):** Permetre triar de manera clara i fluida l'entitat que s'està gestionant (la gestió del bar, el compte personal, etc.).
  - **Estil Visual i Il·lustracions:** Aplicar el nou estil visual de les targetes de Sóc de Poble a la Gestoria. Incloure-hi **il·lustracions ("dibujitos")** a les targetes per fer l'eina més amigable, però mantenint la identitat visual de Sóc de Poble (evitant l'estil genèric de Loiverse en aquest punt on la Gestoria té personalitat pròpia).
  - **Assistent de tràmits:** Incloure una petita ajuda contextual per recordar a l'usuari les dates de presentació de la declaració trimestral (models 303, 130, etc.), per exemple avisant que "ara ve el pont i cal presentar la declaració prompte".

- **CONTINGUT I MULTIMÈDIA:**
  - **Carrusel de la Samarreta:** La publicació de la "Samarreta Sóc de Poble" actualment té la imatge duplicada (una com a Hero de la targeta i una altra dins l'article). S'ha de recuperar el carrusel de 8 imatges de la samarreta (fent servir les recuperades a `_multimedia_de_poble/antic_sistema`). Cal depurar imatges duplicades de la carpeta vella (deixar-ne només una si n'hi ha diverses d'iguals) i muntar un carrusel interactiu. Molt important: garantir que la primera imatge del carrusel i la imatge principal (Hero) de la publicació estiguen ben sincronitzades per no mostrar coses per duplicat innecessàriament a la vista en detall.
  - **Estructura Multimèdia Resilient:** Cal dissenyar i establir on s'allotjaran definitivament i de manera resilient les imatges recuperades (ex: movent-les de `_multimedia_de_poble` a `public/assets/uploads/...`) perquè mai no es trenquen els enllaços, sobretot tenint en compte l'enfocament offline i la compatibilitat amb l'UniversalPage.

- **PLUGIN DE WORDPRESS (Sollutia):**
  - **Empaquetar la versió (ZIP):** Quan s'acabe tota aquesta tanda de tasques menudes (El Xat, Carrusel Samarreta, correccions visuals al menú), s'ha de generar l'arxiu `.zip` final per pujar-lo a WordPress (`gentdelatorre.net`). Açò permetrà que els betatesters puguen accedir-hi, registrar-se i començar a trastejar l'aplicació.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- Comprovar que l'informe resultant s'ha generat amb la taxonomia correcta (auditoria_claude.md) a l'Escriptori.
- Verificar que l'informe aporta valor i se centra en la filosofia de seguretat en lloc d'instruccions literals incompatibles.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Que l'agent s'encalle en els detalls tècnics de PHP/WordPress i fracasse en trobar paral·lelismes valuosos per a Supabase/React.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
