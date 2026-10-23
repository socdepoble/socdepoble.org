---
type: document
status: esborrany
description: Pla per a desallotjar la web antiga de Firebase Hosting, desplegar el build web de Pedra Seca a socdepoble.org i polir l'accés al xat
tags:
  - implementacio
visibility: private
reflex: sdp:torn_8abf96ed-4ca0-4d1e-b8da-82e99e058c03:2089dbe6-75cc-4aa0-841f-c19cf5928467
---
# Pla d'Implementació — Desplegament de Producció Firebase i Puresa Visual del Xat

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_8abf96ed-4ca0-4d1e-b8da-82e99e058c03:2089dbe6-75cc-4aa0-841f-c19cf5928467 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-23T13:56:11.532Z |
| Modificació | 2026-10-23T13:58:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude Opus 5.5 + Gemini 4 Argon + IAIA MarIA |
| Tokens consumits | ~ |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-23T13:56:11.532Z: Diagnosi forense d'incidència a producció: `socdepoble.org` servia un bundle fòssil antic a Firebase Hosting (ruta obsoleta `/chats` i clau de Supabase caducada amb 401). Sol·licitud del Mestre per desallotjar la web antiga, desplegar el build web actualitzat de Pedra Seca i polir el centrat i estil del botó de registre al xat.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes Forenses (Research)
- **Diagnosi de `socdepoble.org`:**
  * La base de dades remota Supabase (D1-A La Torre de les Maçanes) està **100% neta i sana**.
  * A Firebase Hosting (`soc-de-poble`) hi ha encara una compilació de fa mesos (anterior a la gran reforma de Pedra Seca) que redirigeix a `/chats` (en lloc del canònic `/xat`) i injectava una clau d'API antiga que provoca errors 401.
  * El navegador del client manté un Service Worker obsolet que mostrava un avís taronja de versió disponible.
- **Puresa Visual del Xat:**
  * Al peu de la columna de converses sense sessió, el bloc d'accés utilitzava l'estil `.sdp-alerta` heretant una barra vertical de cita de 6px (`border-inline-start-width: 6px`) que el Mestre ha indicat retirar per complet, alineant text i botons al centre de forma neta.

### 2. Tasques Concretes de Desenvolupament

#### T1 · Puresa Visual de l'Accés al Xat (`src/css/modules.css`)
- Suprimir la vora lateral de cita i el fons d'alerta a `.sdp-alerta.sdp-xat-acces` (`border: none; border-inline-start-width: 0; background: transparent;`).
- Centrar el text del missatge (`text-align: center`) i justificar els botons al centre (`justify-content: center`).

#### T2 · Compilació Neta del Web Bundle (`npm run build:web`)
- Recompilar els actius web de producció amb Vite a la carpeta `dist/`.
- Assegurar que els fitxers `.webp` i les rutes canòniques queden integrats amb la configuració de `.env.production.local`.

#### T3 · Desplegament a Firebase Hosting
- Executar `npx firebase-tools deploy --only hosting --project soc-de-poble`.
- Comprovar que el desplegament finalitza amb èxit i substitueix la versió antiga de `socdepoble.org`.

#### T4 · Verificació i Neteja de Memòria Cau
- Validar via HTTP que `https://socdepoble.org/` serveix el nou hash del bundle.
- Confirmar que la ruta canònica és `/xat` i que no hi ha cap petició errònia 401 ni rastres de `/chats`.

#### T5 · Recerca d'Estructura Jurídica, Fiscal i Subvencions (Horitzó Institucional)
- **Objectiu:** Mapejar les opcions legals per a l'escalat de Sóc de Poble com a xarxa social i entitat receptora d'ajudes públiques (línia de 50.000 € de la Generalitat / fons rurals / europeus):
  * **Associació Cultural El Rentonar:** Diagnosi del NIF/CIF vigent (que atorga accés a Canva Pro ONG); estat de la junta directiva (Javi Llinares com a tresorer) i tràmits d'actualització d'actes/junta.
  * **Javi Llinares (Autònom):** Règim actual de facturació per fites/lots i compatibilitat amb ajudes o encàrrecs de desenvolupament.
  * **Projecció Mercantil / Cooperativa:** Valorar cooperativa de consumidors i usuaris o societat comunitària per a garantir que la xarxa pertany al comú dels pobles.
  * **Relació amb Sollutia:** Mantenir el blindatge del Model B (soci tecnològic d'infraestructura, API en lectura per la Frontissa) sense dilució de governança.
  * **Marca Sóc de Poble:** Estat del registre a l'Oficina Espanyola de Patents i Marques (OEPM).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. `npx vitest run src/sections/xat/XatSection.acces.capes.test.js`: Suite d'accés al xat 100% en verd.
2. `npm run build:web`: Compilació neta de `dist/` sense fallades.
3. `npx firebase-tools deploy --only hosting --project soc-de-poble`: Desplegament completat en codi 0.
4. `curl -s -I https://socdepoble.org/`: Capçalera HTTP 200 amb el nou hash del bundle.
5. `node tooling/gates/porta-olivera.mjs --informe`: Porta Olivera en Codi 0.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Caché persistent del Service Worker als navegadors dels usuaris:** Mitigació: L'arxiu `index.html` té configurada la capçalera `Cache-Control: no-cache` a `firebase.json` i el salt de versió a `version.json` força la descàrrega immediata del nou paquet net.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[00_index_escriptori]]
