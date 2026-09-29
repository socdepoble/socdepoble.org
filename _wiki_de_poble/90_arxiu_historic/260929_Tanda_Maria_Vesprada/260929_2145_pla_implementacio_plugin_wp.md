---
type: document
status: esborrany
description: "Pla d'Implementació per a l'evolució del Plugin de WordPress amb actualitzacions automàtiques i qualitat top-tier."
tags: [arquitectura]
---
# Pla d'Implementació: Evolució del Plugin de WordPress (socdepoble-enxufe)

## Objectiu
Portar el connector de WordPress `socdepoble-enxufe` al màxim nivell possible (Súper Plugin, oficial) implementant un sistema d'actualitzacions automàtiques i suport per a Fedivers. No obstant, **l'objectiu crític de fons és l'enxufabilitat amb Sollutia**: tot el que es dissenye per a WordPress ha d'estar pensat perquè enxufar l'aplicació a Sollutia siga igual de fàcil i no pose cap trava. L'arquitectura del plugin de WP ha de ser el banc de proves per a demostrar la facilitat absoluta d'integració.

## Fases i Tasques (T1-T3)

- **T1: Refactorització estructural i neteja.** Revisar a fons l'estructura actual de `socdepoble-enxufe.php` per garantir els millors estàndards de seguretat, documentació (PHPDoc) i extensibilitat de WordPress. Encara que el codi ja funciona correctament i carrega l'App aïllada amb l'adaptador prim (Model B), cal assegurar que és un plugin de primer nivell.
- **T2: Integració d'Actualitzacions Automàtiques Nadiues.** Proposar i codificar una solució robusta perquè el plugin s'actualitze de forma automàtica. Això pot implicar hookejar a `site_transient_update_plugins` i `plugins_api` per enganyar WordPress perquè busque les actualitzacions directament als releases d'un repositori GitHub (usant un Updater de GitHub natiu o alguna classe com Plugin Update Checker integrada al connector), evitant així dependre del repositori de WordPress.org i habilitant el botó 100% real de "Activar actualitzacions automàtiques".
- **T3: Auditoria del comportament de MarIA.** Analitzar per què l'agent orquestrador (MarIA) no segueix sistemàticament el tractor cognitiu d'higiene d'escriptori (`core-higiene-escriptori`) abans d'iniciar noves tasques, i proposar una directriu contundent per a solucionar-ho.

## Riscos
- **Seguretat a GitHub:** Si el repositori no és públic, l'update checker necessitarà tokens, cosa poc recomanable per a un plugin distribuït o pujat a producció si el token exposa altres repositoris. Si el repositori és públic, no hi ha problema.
- **Impacte a l'SPA:** El connector ha de seguir respectant completament l'amfitrió (Sollutia/WP) i no interferir mai amb la càrrega de l'AppGrid (dist/soc-de-poble.standalone.js).

## Directiva de Sanejament (Higiene del Mas)
- **T4: Resolució d'Orfes i Segell.** Claude haurà d'afegir el camp `contracte.llig` a les skills (`core-memoria-historica`, `sdp-calendari-agricola`, `sdp-casos-us-essencials` i `sdp-workflow`), resoldre l'estat orfe de `core-neteja-brossa` i `core-telemetria-huma`, reconstruir el catàleg de Claude i aplicar la reconciliació al Segell de Seguretat per deixar la Consola totalment en verd abans de tancar el torn.

## Millores de UX i Arquitectura Visual
- **T5: Mètriques a la Taula de Continguts.** A les targetes de la Consola Termodinàmica, la informació de les mètriques (ex: "0 registres de consum", "38 rebuts") s'ha de mostrar centrada, amb cada dada en una línia nova, i embolicada en una etiqueta `<h5>`. A més, cal configurar el component de la Taula de Continguts (`TableOfContents`) perquè rastrege i mostre els encapçalaments fins al nivell `<h6>` (actualment limitat a `<h4>`). L'objectiu és que la navegació lateral mostre d'un colp d'ull l'estat numèric del sistema.
