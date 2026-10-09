---
type: document
status: esborrany
description: Pla per donar suport a Claude en l'onada 5
tags:
  - implementacio
visibility: private
reflex: sdp:torn_b3e671f0-df5d-4eaa-a440-0cc4ccaceb7a:a7334093-ed0b-4031-b75a-66bceb003349
---
# Pla Onada 5 UX i Pobles

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_b3e671f0-df5d-4eaa-a440-0cc4ccaceb7a:a7334093-ed0b-4031-b75a-66bceb003349 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-08T21:45:22.987Z |
| Modificació | 2026-10-08T21:45:22.987Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-08T21:45:22.987Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

1. **Slugs i Imatges SEO:** Garantir que URL's com `/#/chat` o pròpies del poble siguen directament accesibles i copiables (hidratades correctament), mostrant la seua imatge quadrada pròpia (del directori `assets`).
2. **Ordre i Espaiat del Menú Inferior (Tabbar):** Modificar l'ordre actual (Xat, Mur, Pobles, Mercat) a **Xat, Mur, Mercat, Pobles**. `Pobles` fa d'espai especial. A més a més, **separar visualment els 5 icones** per afegir més "aire" entre ells, de forma proporcional, evitant que queden tan comprimits i deixen tant d'espai negre buit als extrems laterals. Cal buscar una proporció harmònica equilibrada (sense apilar-los tots en el centre).
3. **Lògica de la Card de Pobles (La Caputxa Naranja):** A la pàgina Pobles (on no es publica, sinó que es mostra la jerarquia activa segons Mur/Mercat):
   - El títol de la caputxa serà l'entitat: `Gent de la Torre`.
   - El subtítol serà el poble: `La Torre de les Maçanes` (no la comarca).
   - Acció de clic a la caputxa (header): navega al **Xat** de `Gent de la Torre`.
   - Acció de clic al cos/imatge: navega al mur del **Poble**.
4. **Anatomia de la Pàgina Poble:** 
   - Ha d'incloure el logotip (Sóc de Poble per als pobles) damunt del títol.
   - H1: `Gent de la Torre`.
   - H2: `La Torre de les Maçanes`.
   - Entradilla: Text extraït de Wikipedia.
   - **Nou botó blau gros** situat davall de l'entradilla per obrir el Xat ("Parlar amb la Gent de la Torre").
   - Categorització de la Card: Per Província i per Comarca.
5. **Script Wikipedia (Automatització):** Documentar i crear la lògica/scraper automàtic on, en afegir un poble nou, s'extraga de Wikipedia: les 3 imatges requerides (Hero, Avatar, Reserva), el text de l'entradilla, i genere automàticament els camps d'H1, H2 i el botó per anar al xat.
6. **Alerta d'Error RPC (Supabase):** Cal reparar un 404 de Supabase, en la funció `obri_fil_de_pagina` que actualment no es troba quan s'accedeix al xat.
7. **Investigació a la Gestoria (Botigues i WordPress):** Cal avaluar i donar-li un estat de la qüestió al Mestre sobre la publicació de l'App. Concretament: entrar a la Gestoria (codi o documentació existent) per buscar la factura d'Apple (març/abril) i la connexió d'internet; l'estat avançat de publicació a Google Play; i la possibilitat de publicar l'extensió de WordPress al repositori oficial considerant el seu pes actual.

### Tasques Futures (Onada 6)

Aquestes tasques **NO formen part de l'Onada 5** i no s'han d'executar ara. Queden registrades per a la següent tanda de desenvolupament:

**Per a la Consola de Manteniment (el Brain):**
8. **Semàfors de color:** Les pastilles i avisos han de tindre codis de colors (verd, taronja, roig) segons la seua gravetat, com un semàfor.
9. **Informació en superfície (Non-clickable cards):** Tot el que conté cada targeta (resum, estat, problemes) s'ha de mostrar a les pastilles exteriors de manera visible, sense necessitat de fer clic per a entrar i llegir-ho.
10. **Auditoria profunda i Reparació:** Revisar a fons les contradiccions, duplicitats, fallades en els tractors i cadenes de treball opaques per deixar la consola a 0 avisos.
11. **Comprovació de botons:** Verificar si hi ha tots els botons necessaris o si cal afegir-ne de nous per a l'inventari.

**Per a la Identitat i la Pàgina del Poble:**
12. **Identitat visual i nominal de la IAIA:** Canviar el nom del xat de "L'ànima de la iaia" per "IAIA MarIA". Crear-li un avatar propi retallant la cara d'una de les iaies amb mòbil de la il·lustració "Festa del Poble". Si el nivell d'IA és 0 (apagada), la IAIA no hauria d'aparéixer al llistat de xats.
13. **Capçalera i Xat de "Gent del Poble":** A la barra taronja de la pàgina del poble, el títol principal ha de ser "Gent de la Torre" (o el poble corresponent), i el nom complet ("La Torre de les Maçanes") anirà com a subtítol. El fil de xat específic també s'ha de dir "Gent de la Torre".
14. **Pestanyes de contingut a la Pàgina del Poble:** Afegir una barra de pestanyes centrada sota la capçalera del poble. La primera vista mostrarà exclusivament totes les targetes creades *des d'eixe poble* per les persones o grups locals (ajuntaments fora de moment).

**Per a Funcionalitats i Higiene del Sistema:**
15. **Cronologia i Dades a les Targetes:** La data d'una targeta ha de reflectir la data de la creació real de la publicació. En crear un poble per primera vegada, s'hi assignarà la data i hora d'aquella primera publicació de naixement del poble.
16. **Agenda i Clon de Google Calendar:** El botó "Agenda" de la targeta portarà a la data específica del Calendari. Cal implementar el mòdul de Calendari calcant la UI/UX de Google Calendar. **ALERTA CRÍTICA:** S'ha detectat que el Mur i el Calendari usen components de calendari diferents; s'han d'unificar en un de sol. **Interactivitat:** Si es fa clic a l'enllaç de l'esdeveniment dins del calendari, portarà a la pàgina de la publicació; si es fa clic al quadre del dia (fora de l'enllaç), es mostraran les targetes d'eixe dia a la part inferior.
17. **Neteja Tècnica del Sistema i Plugins:** Revisar i esborrar residus antics de carpetes de treball i l'ecosistema WordPress (informes d'auditoria vells, carpetes inútils i brossa de Sollutia que no valga). L'objectiu és deixar-ho net, amb Claude preguntant abans d'esborrar si no té clar l'ús d'un arxiu. Implementar també un *Cron* que automatitze aquesta neteja de carpetes.
18. **Motor Cognitiu per a l'Escriptori Net:** S'ha detectat una incidència greu de flux. Si l'Escriptori no es buida correctament d'auditories velles, una nova auditoria perdrà el focus. Claude ha d'estudiar com crear un motor cognitiu (una skill o regla) per garantir que abans de redactar una auditoria, es prepare obligatòriament l'escriptori net, arxivant o descartant qualsevol residu que puga contaminar la visió del pròxim torn.
<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- Validar que les URL directes funcionen al fer refresh al navegador.
- Validar el clic independent de la caputxa vs el body de la card.
- Validar que l'ordre de la tabbar s'ha modificat correctament a totes les pàgines.
- Verificar si la funció `obri_fil_de_pagina` de Supabase es pot reconstruir des del frontend o requereix migració SQL.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Possibles conflictes d'estat reactiu al fer hard refresh a rutes concretes si el store/context no s'ha hidratat completament.
- Tocar la Tabbar pot desalinear la renderització si no s'utilitza l'standard de Pedra Seca.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
