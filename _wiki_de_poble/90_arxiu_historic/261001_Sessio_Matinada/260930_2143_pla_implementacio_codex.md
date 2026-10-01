---
type: document
status: esborrany
description: Pla de fortificació del connector WordPress, aïllament CSS i coordinació amb Claude al Xat
tags:
  - implementacio
visibility: private
reflex: sdp:torn_2c591b20-7040-40dd-abfa-9a538e439ccf:e9b9bb8c-368e-4a77-9755-e034b4903d72
---
# Enxufabilitat WordPress i responsive per contenidor

**Estat del Pla:** encastament implementat; ampliació del Traductor Sobirà D1–D2 en implementació i revisió creuada, autoritzada pel Mestre.

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_2c591b20-7040-40dd-abfa-9a538e439ccf:e9b9bb8c-368e-4a77-9755-e034b4903d72 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T19:43:42.645Z |
| Modificació | 2026-09-30T22:06:28Z |
| Propietari | Codex |
| Aprovació humana | Execució autoritzada pel prompt del Mestre del 2026-09-30; sense publicació ni desplegament |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Codex, GPT-6 |
| Tokens consumits | No disponibles amb exactitud |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 30f1b3310dd558c625a0cef2562b28ee8f08351afd719136367464a3b12aff38. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-30T19:43:42.645Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

Sóc de Poble conserva el client modular i el contracte Model B: WordPress és un amfitrió; els endpoints reals de Sollutia no s’inventen. L’ordre del Mestre autoritza les correccions locals d’encastament i les auditories creuades.

### Repartiment i coordinació amb Claude

Codex reserva `src/PedraSecaEmbed.jsx`, `src/css/base.css`, `src/css/layout.css`, `wordpress-plugin/` i les proves d’encastament. Claude conserva `src/sections/xat/`, els fulls de configuració del Xat i les rutes. Acord C1: Codex modifica només el detector d’amplària d’AppShell a `App.jsx:175-208`; Claude no toca App.jsx. Claude reserva únicament els blocs `.sdp-xat*` de `modules.css`; Codex corregirà el breakpoint mestre de `.sdp-drets__peu`, fora d’eixos blocs. Informes de Claude llegits: pla 2135 i auditoria 2145 (encara provisionals).

### Contracte de la reparació

1. Fer que les regles del breakpoint mestre i la decisió React de compacte usen la mateixa amplària. `.is-compact` ara no té cap regla CSS; l’ús exclusiu d’`@container` deixa sense alternativa els navegadors de Baseline 2022. Evitar consultes anònimes que puguen seleccionar una barra interior.
2. Conservar `fixed` dins de la caixa de l’app: l’encastament ha de respectar una alçada menor que el viewport, el scroll de l’amfitrió i dues instàncies. Contenció explícita a la frontera, independent dels efectes incidentals de `container-type`.
3. Corregir la plantilla de pantalla completa: hereta `min-height:32rem` del bloc ordinari i falla la prova existent de viewport curt. Limitar l’override a la plantilla que l’usuari ha triat.
4. Auditar el cicle de vida del custom element, la recuperació del full d’estils i les fonts. Afegir regressions únicament per defectes demostrables.
5. Verificar inventari i empaquetat en temporal. No generar claus, ni declarar release remota, ni publicar. Els artefactes de prova poden viure en temporal; una entrega final a producció requerix distingir-la d’una release apta per a dades reals.

### Ampliació C2 estabilitzada amb Claude (22:15)

El navegador confirma que `showModal()` enfosquix tota la pàgina i situa Nova conversa fora d’una caixa 375×480. C2 de Claude valida la reparació i reserva a Codex `Dialeg.jsx`, les seues proves, un gestor local auxiliar i el CSS de frontera. Portal com a últim fill de l’arrel `.sdp-root` de la instància, `<dialog>.show()` local, vel propi, Escape consumit, Tab/Maj+Tab cíclics, retorn del focus, inert/aria-hidden només als germans locals amb restitució i apilament. La SPA conserva `showModal()`. El token existent `--z-calaix` situa la capa per damunt de la barra; els toasts es pinten al punt exterior de muntatge i cal verificar que conserven l’ordre. Cap prop ni classe pública del component canvia. Proves: natiu, local, niats, dues instàncies, desmuntatge, focus, forma method=dialog, geometria de 320px i scroll de l’amfitrió.

### Ampliació D1–D2 — Traductor Sobirà, contracte consolidat

Ordre directa del Mestre: Codex assumix el motor WordPress i la frontera d’encastament; Claude, BarraBlava/useAccions i les eixides de sessió de FullAjustos/ControlSection. Visitants autoritzats expressament amb límits. Claude accepta per escrit a C7 l’esmena sense nonce; el detall viu a [[260930_2150_auditoria_codex]].

**Estat de les mesures següents:** implementades en D3 després de l’ordre expressa del Mestre de reprendre. INSERT IGNORE substituïx add_option. 69/69 Node/PHP, 112/112 React/configuració, builds i prova real de navegador passen; revisió final de Claude oberta per D2-F1 i C9-2. La incidència del rebut anterior s’explica a l’auditoria.

- Un sol canal per instància: atribut `traductor-url` → `externalConfig.traductorUrl`. URL HTTP(S) absoluta normalitzada i del mateix origen de la pàgina; ni CDN ni Google Fonts són orígens vàlids. El global SocDePobleConfig conserva només identitat. No hi ha global nou, nonce ni GET/config. La referència HTML copiable a un altre host omet el servei local.
- `POST /wp-json/socdepoble/v1/traduir`, JSON `{textos:[...],desti:'ES'|'EN-GB'|'FR'|'DE',origen:'CA',format:'text'|'html'}`, credentials omit. Fins a50 textos,5000 punts Unicode agregats,20000 bytes de text,32768 bytes de cos. Resposta `{traduccions:[...],origen:'CA',desti,cache:boolean}` en el mateix ordre i longitud; buits preservats. Frontend saneja l’HTML i conserva l’original, sense recàrregues.
- Clau DEEPL_API_KEY exclusivament en constant PHP o entorn del procés, mai VITE ni .env carregat pel plugin. HTTPS oficial DeepL Free/Pro segons sufix:fx, source_lang CA explícit, tag_handling html només quan es demana; sense redireccions, timeout15s, resposta limitada128KiB.
- Servei públic: JSON i control d’origen;30 misses/10min per REMOTE_ADDR resumida amb HMAC. No confiar en X-Forwarded-For. Pressupost durable10000 caràcters/dia i100000/mes UTC per lloc WP, configurable per constants enteres SDP_TRADUCCIO_LIMIT_DIARI/MENSUAL;0 desactiva nou consum. Reserva CAS abans de la xarxa, sense reemborsar timeouts que poden haver sigut facturats. Pany per text i pany curt per reserva; lots independents concurrents.403/429/456 pausa60s per clau de proveïdor. Sense reintents automàtics.
- Transients7dies per text/origen/destí/format/clau, noms HMAC; només èxits complets. Reutilització parcial i duplicats sense facturar. Desinstal·lació elimina pressupost, locks i transients de BD; cache extern expira normalment. Readme declara dades enviades, retenció i DeepL. Porta d’empaquetat busca claus DeepL sense imprimir-les.
- Errors WP REST:400 sdp_traduccio_invalida;403 origen;413 mida;415 json;429 limit;502 proveidor;503 sense_clau/ocupada/pressupost, missatge públic controlat. Absència d’atribut significa servei no configurat.

Alternatives descartades: SDK nou (WordPress té HTTP API), clau en navegador, nonce públic com defensa de quota, pany global durant tota la xarxa i reembossar indiscriminadament errors. Riscos comprovats: concurrència factura dues vegades, eviction reinicia quota, secrets arriben al paquet, normalització d’URL envia text fora del host. Proves PHP amb SQLite, servidor REST real en BD temporal, DeepL amb text sintètic i proves frontend de Claude quan estiguen disponibles. Cap instal·lació al lloc Studio ni publicació implícita.

### Alternatives descartades

- iframe per defecte: alteraria el contracte del custom element i la integració existent.
- Retornar totes les regles al viewport: reproduiria la fallada de bloc estret en escriptori ample.

Mantenibilitat: una font d’amplària per a la navegació i un límit de posicionament explícit, amb proves reproduïbles.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- Resultats locals: 47/47 Node/PHP, 135/135 embed/router, 2/2 AppShell i 25/25 Dialeg+NovaConversa. Builds web/WordPress i lint propi passen; detall, logs i límits a [[260930_2150_auditoria_codex]].
- Vitest: configuració del custom element, router, App i Xat; distingir fallades preexistents de regressions.
- PHP real amb el binari de Studio; plantilla completa, barra d’administració i shortcode ordinari.
- Navegador: desactivar totes les regles @container del full CSS i repetir el tall mestre; bloc de 375/720/1023/1023.5/1024px en viewport ample, alçada de 320/480px, desplaçament de pàgina, amfitrió amb estils agressius i dues instàncies.
- Build web i standalone; empaquetador contra inventari; lint dels fitxers propis.
- Auditoria creuada cada cinc minuts (heartbeat activa); guardar només rondes amb evidència nova. No atribuir canvis a Claude sense contrastar-los amb el seu informe.
- Porta Olivera, comprovació documental i tancament; cap afirmació global de verd si una porta falla.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Tres modes de fallada a comprovar: consulta resolta contra un contenidor equivocat; controls fixos tallats o desplaçats per l’alçada de l’amfitrió; full CSS absent després de remuntar o de fallar adoptedStyleSheets. El repositori té canvis concurrents i governança prèvia; no se sobreescriuen ni s’arxiven documents d’altres agents. La certificació de Sollutia real continua condicionada al contracte dels endpoints, auth i dades de prova.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260930_2135_prompt_codex]]
- [[260930_2135_pla_implementacio_claude]]
- [[260930_2145_auditoria_claude]]
