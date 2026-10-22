---
type: informe
status: esborrany
description: 'Carril de Claude al torn 261021_2345: auditoria didàctica del veí del poble, deconstrucció REA d''Obsidian amb les eines MCP i verificació independent dels canvis de Codex (WP < 2,5 MB, PWA, xat, perfil).'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_26323853-dc67-4268-8b87-72e38f13f063:88de4b03-2dfb-47bf-8256-a4d94b1fe670
---
# Auditoria Claude · verificació adversarial, didàctica del veí i REA d'Obsidian

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_26323853-dc67-4268-8b87-72e38f13f063:88de4b03-2dfb-47bf-8256-a4d94b1fe670 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-21T23:44:21.495Z |
| Modificació | 2026-10-21T23:44:21.495Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-21T23:44:21.495Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Relleu 01:50 · repartiment de carrils amb Codex

Claude ha llegit el pla, el prompt, el Llibre Mestre i els esborranys de Codex (261022_0141) i Gemini (261022_0142). A les 01:41 Codex ja tenia en curs, sense commit, els canvis de les tasques 1, 2, 3, 4 i l'estat buit dels plugins: App.jsx, assetResolver.js, els cinc diccionaris, PluginPage.jsx, presentacioPlugins.js, PerfilPublicSection.jsx, XatSection.jsx, Conversa.jsx, FilaConversa.jsx, vite.standalone.config.js, empaqueta.mjs i els seus tests.

Per no xafar-nos, Claude **no edita cap d'eixos fitxers**. Els carrils de Claude en este torn són:

1. **Tasca 5 · auditoria didàctica del veí** de /plugin/gestoria, /plugin/rss, /notes, /mercat i /pobles (lectura de codi i captures sense sessió). Ix com a propostes de text en este informe, no com a edició.
2. **Tasca 7 · REA real d'Obsidian** amb les eines MCP de REA sobre `/Applications/Obsidian.app` (mapa, graf de vincles, panells, manual de comportament), en lectura i amb extracció només a la còpia de proves.
3. **Verificació adversarial i independent** dels canvis de Codex quan els done per acabats: proves dirigides, build real del connector en una còpia fora de l'arbre, mida del zip contra 2.500.000 B, imatges que es queden sense resoldre i comportament del botó PWA.
4. **Tasca 6 · Connectar amb l'autor:** Claude en prepara el disseny (taula, RPC, port i UI) com a proposta. No l'escriu a l'arbre si Codex ja l'està implementant; si Codex o MarIA volen que l'implemente Claude, que ho deixen a l'Escriptori.

Claude no crea cap cron ni cap tasca programada en este torn.

### Relleu 02:05 · el commit global i el que Claude verifica

A les 01:51 una altra mà va fer el commit global `d31c1ccd` amb la feina de Codex (el títol diu `docs(pla-prompt)`, però porta codi de producte) i va ampliar pla i prompt amb tres tasques noves: unificar el perfil de Javi, multimèdia al xat amb REA de WhatsApp i diagnosi de latència. Codex ja ha lliurat informe i acta (261022_0141). Claude no repetix eixa feina: la verifica de manera independent i hi afig el que falte.

Primeres comprovacions de Claude (02:00, curl i python sobre el zip, només lectura):

- `https://socdepoble.org/favicon.svg` respon ara **200 image/svg+xml**, no 500. En canvi, `/favicon.ico` respon 200 amb `text/html` (l'index de l'SPA): no és un error 500, però és un recurs inexistent servit com a pàgina.
- `_builds_de_poble/wordpress/socdepoble.zip` (2.158.729 B, 1.1.10-beta.1) porta `includes/actualitzador.php` i la capçalera `Update URI: https://socdepoble.org/enxufe/`. Per tant, és un paquet del canal propi, no del directori de WordPress.org. Quan es publique una 1.1.10 estable al canal, l'actualitzador el canviarà pel paquet complet de 42 MB.

En marxa: auditoria didàctica independent de les cinc pantalles i REA d'Obsidian centrada en panells i persistència de l'espai, que l'informe de Codex tracta menys. Després vindrà la verificació adversarial: zip en un navegador real, totes les rutes `assets/` del bundle contra l'origen, proves dirigides i bateria completa en una còpia congelada.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

[pendent]

<!-- SDP:SECTION auditoria.s6 -->
## Límits

[pendent]

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
