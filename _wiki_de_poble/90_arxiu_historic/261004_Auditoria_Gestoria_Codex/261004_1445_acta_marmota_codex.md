---
type: acta
status: esborrany
description: Punt de continuïtat del tancament 1.0.3, amb separació Gestoria/Wiki, avatars i paquet WordPress; altres fronts ajornats per ordre humana.
tags:
  - acta
visibility: private
reflex: sdp:torn_3829d514-eb9a-406e-ae86-dd2647b0abfd:176c9a4d-7e3b-4881-8a1c-4012b247564e
---
# Acta Marmota: tancament WordPress 1.0.3 i separació de Gestoria

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_3829d514-eb9a-406e-ae86-dd2647b0abfd:176c9a4d-7e3b-4881-8a1c-4012b247564e |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T12:52:41.944Z |
| Modificació | 2026-10-04T13:53:34.816862+00:00 |
| Propietari | agent-local |
| Aprovació humana | Ordre executiva directa del 04/10/2026; abast de tancament limitat. |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |
| Model IA | Codex, basat en GPT-6; variant exacta no exposada. |
| Tokens consumits | No mesurats: comptador exacte del torn no accessible; no equival a zero. |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 5d6e85755085a6dc113cb383144cffe3f65ec83ccf3a27c2da7c875dbcc6942d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

Després d’acabar l’entrega 15:14, comprovació actual de Claude Desktop amb proves pendents: condició humana complida. Pla ampliat i vinculat; Sidebar completa aplicada i paquet nou 15:45 verificat.

2026-10-04: reparació crítica i tancament executats d’acord amb el pla 1420. Es preserva el treball concurrent de Claude a /app/gestoria i es completa la separació estricta segons el criteri final de Claude.

<!-- SDP:SECTION acta.s4 -->
## Resultats

La Gestoria deixa de muntar-se dins d’UniversalWorkspace de la Wiki. L’app existent de Claude té rutes `/app/gestoria/tauler` i `/app/gestoria/aprendre`. Criteri final acceptat: les URLs antigues mostren portada de Wiki, sense obrir l’app; entrada exclusivament per la ruta pròpia. Wrapper Wiki neutre; BarraLateral només memoritza rutes fora de `/app`, amb consulta ordinària. El pont de Tractors continua a Wiki i el contenidor signat no es toca. La funció financera continua només en DEV.

Fitxers del front: `src/apps/gestoria/` i registre/plugin de Claude; Codex completa `src/sections/wiki-de-poble/WikiDePobleSection.jsx`, `RutaWikiDePoble.jsx`, `rutesWiki.js`, l’import de ruta d’`src/app/App.jsx`, `src/apps/plataforma/BarraLateral.jsx` i les proves dependents. Avatars circulars de Claude conservats; Codex elimina una clau duplicada del seed IAIA i actualitza el test de foto. Ajust final de prosa de Claude verificat sense editar CSS.

Ampliació condicionada: el manifest declara nou mòduls i Aprendre; BarraApp és l’única Sidebar. AppGestoria passa la ruta a ShellGestoria amb modulActiu i mostrarRail=false. La mateixa closca conserva useTauler entre els nou mòduls; detall i avís se segellen amb el mòdul d’origen i es tanquen en canviar. Un H1 i una boina al centre. Sis icones admeses s’afigen en esquema i resolutor. Cap canvi al contenidor signat, les dades o els ports. Aprendre i eixir del Full trimestral conserven el desmuntatge privat anterior.

Proves noves: 146/146 de plataforma en cinc suites i 36/36 de closca/privacitat en dues; ESLint exit 0. Navegador ample i mòbil: deu accessos, zero rail interior, Bancs/Full/Impostos en la seua ruta, menú compacte tancat en navegar i retorn blau a Sóc de Poble. La prova de plataforma cobreix retorn a la ruta de Wiki anterior. Revisió independent sense bloquejants.

Proves del tancament anterior: 61/61 de rutes finals, 43/43 d’avatars, 60/60 de capçaleres addicionals (solapament), 2/2 de prosa i 96/96 del connector/runtime/empaquetador. Les 351/351 de base i les 59/59 del criteri de migració són històriques; no se sumen als 61 casos de les fonts actuals. ESLint del front final passa. Dos builds nous release 1.0.3 amb 855 fonts congelades i hashes idèntics després; el tall anterior de 856 fonts queda històric.

Artefacte per a pujar manualment: `wordpress-plugin/builds/socdepoble-enxufe-v1.0.3-261004_1545.zip`, 130.751.256 bytes; SHA-256 `398330989fab0c9e06e0956de2258ba9f6efe1111ddf33d9ab711e56d1eadf06`. SPA i variant directori també empaquetades. Els ZIP 11:51, 14:59 i 15:14 es conserven com a talls anteriors; el definitiu és 15:45, amb verificació exhaustiva valid:true sense errors. Canal sense signatura, igual que la configuració de clau existent; cap alta automàtica d’actualitzacions ni desplegament extern.

Set prompts consumits arxivats amb porta-olivera i handoff canònic. Els 14 documents vius/ajornats queden en Activitat en curs; safata buida. No es modifica la zona protegida ni s’esborren fitxers. Fonts de codi compartides congelades per a empaquetar; no hi ha commit.

**Aprenentatge del torn:** la prova unitària eager amagava una carrera de càrrega. La prova real fallà després de recordar l’àlies i la guarda de namespace sola no bastava. La migració abans del lazy corregia la carrera del primer criteri; Claude retirà després tota migració. La versió final es revalida amb 61 casos i no atribueix el verd anterior a les fonts noves. No s’atribueix el defecte a CSS ni es declara tot el repositori verd.

**Proposta d’Automillora:** incorporar al contracte d’acceptació una URL antiga, una càrrega nova i el retorn, i mantindre un únic escriptor per fitxer. La revisió paral·lela s’ha usat en lectura, amb verificació independent de bytes. No s’han estimat tokens ni estalvi de temps fictici.

<!-- SDP:SECTION acta.s5 -->
## Pendents

L’ordre actual limita el treball a rutes, poliment en curs i empaquetat. Calendari, accessibilitat general, recuperació d’arxius antics, deute comptable i incidències de governança queden ajornats.

La nova instrucció de Sidebar ja està executada amb la condició comprovada: el tancament anterior estava complet i Claude continuava en Verifica 0/1. Coordinació a ESTAT; no s’afirma haver enviat el missatge natiu interromput per interacció humana. Pla 1420 v1.2.0, root únic escriptor de UI i agent de proves limitat a AppGestoria.test.jsx.

Per desplegar, usar el ZIP 15:45 del directori canònic; és instal·lació manual a Gent de la Torre. La comprovació de login/tenant remot i la pujada no formen part d’esta execució. Porta global posterior a l’ampliació: valid:false/planned, 1.198 incidències heretades (1.199 al tall anterior), amb plantilles/autoritat/skills/tests documentals verds. Deute no resolt ni resegellat. Verificació de bytes nova valid:true/errors:[] a /tmp/sdp-sidebar-103-verification.json; 855 fonts estables. Captura 261004_gestoria_sidebar_completa.jpg. Informe i acta passen el comprovador documental.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261004_1435_auditoria_codex]]
- [[261004_1420_pla_implementacio_codex]]
