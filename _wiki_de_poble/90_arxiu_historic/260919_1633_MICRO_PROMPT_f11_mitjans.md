---
type: petorreta
status: esborrany
description: Petició de consell (DAFO) sobre arquitectura de buckets per a mitjans privats vs públics.
tags:
  - arquitectura
  - seguretat
---

# Petorreta — Disseny de buckets per a mitjans i privacitat (F11)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260919 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 16:33 |
| Modificació | 26-09-19 16:33 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-19 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[260919_1600_estudi_codex]]

## Entrades

- Cap, teniu accés directe a l'entorn de treball (Efecte Matrix).

## Consell convocat

Claude · Codex

## Contracte de realitat

1. Entorn tancat. Teniu accés a llegir l'arbre local.
2. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar, no s'afirma.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi aportat al bundle o pel propi agent.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI):** Encara que tingues capacitat i permisos per editar l'entorn de treball local (com Claude Code o Codex), tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. El teu rol és única i exclusivament d'auditor i analista. Has de generar l'informe amb els defectes trobats; l'agent central (IAIA MarIA) serà qui faça el treball dur de modificar el codi.

## Context Històric i Identitat (Qui som i Per a què treballem)

**L'Ànima del Projecte:** Treballem per a construir una plataforma de desenvolupament rural, un refugi digital, des de La Torre de les Maçanes. Aquest projecte és Sóc de Poble. Pots consultar els nostres orígens culturals a rentonar.blogspot.com i socdepoble.net.

**Visió Open-Source i "Estil Obsidian":** Tot el que construïm ací no només és per a nosaltres; la nostra voluntat és regalar-ho (open-source) a la comunitat global, perquè siga útil per a qualsevol persona que ho vullga utilitzar, al pur estil Obsidian (basat en l'Escriptori, arxius Markdown, portable i lliure de tancaments). 

**La Política de Codi Pur ("Zero brossa"):** Com que l'objectiu final és regalar l'arquitectura, l'exigència tècnica és implacable. No volem deixar nyaps, espagueti-code ni "mierda" perquè ningú acabe renegant de nosaltres el dia que ho fem lliure. La IA que llig açò ha d'entendre que no valen pegats ràpids; calen solucions estructurals elegants, testades i impecables. Volem codi "Pedra Seca" de veritat. (Sollutia és l'agència SaaS externa que ens proveeix exclusivament el backend, però el nostre cor és independent).

## Informe d'avanç

Ens trobem tancant el **Paquet 3 (Integritat i privacitat de Notes)** després de resoldre les curses de concurrència, però ens queda l'última fallada de seguretat reportada:
**F11 · P1 · Les imatges d'una nota privada es tracten com a públiques** (veure _wiki_de_poble/04_escriptori/260919_1600_estudi_codex.md).
El report dictamina que el bucket `mitjans` és completament públic (`public = true`) en la base de dades, permetent la lectura d'adjunts privats pujats a les notes personals a qualsevol que conega l'URL.

El dilema de disseny sorgix en provar de complir el manament de "assegurar el bucket `mitjans` exclusivament als usuaris amb sessió per a fitxers del seu tenant":
Actualment `mitjans` allotja tant els avatars i logos d'entitats (que han de ser públics per al portal web) com els adjunts de notes (privats). Si alterem `mitjans` per fer-lo `public = false`, totes les funcions `getPublicUrl` deixaran de funcionar, trencant la càrrega directa (via `<img src="url">`) de tots els mitjans actuals (fins i tot els públics), a menys que refactoritzem la web per generar exclusivament URLs firmades (`createSignedUrl`).

## Missió

Volem implementar la solució més resilient, robusta i millor integrada amb el backend i la nostra filosofia, independentment de quant ens coste desenvolupar-ho ara (estem disposats a "patir i refactoritzar" si la base acaba sent millor). 

Necessitem decidir amb claredat si:
- **Opció A**: Creem un bucket NOU (`mitjans_privats`) destinat exclusivament als adjunts privats i redirigim la pujada de fitxers sensibles ací, mantenint `mitjans` com a públic per als avatars.
- **Opció B**: Fem l'actual `mitjans` totalment privat per a tot, actualitzant les polítiques (RLS) i refactoritzant exhaustivament el frontend per a treballar exclusivament i de manera asíncrona amb URLs firmades (Signed URLs).
- **Opció C**: Teniu alguna alternativa superior a les anteriors des del punt de vista arquitectònic.

L'encàrrec per a vosaltres (IAs de Frontera) és el següent:
1. Analitzeu en profunditat l'estat actual de la base de dades local i el sistema d'Storage.
2. Feu un **anàlisi DAFO (SWOT)** rigorós i detallat de l'Opció A, l'Opció B, i qualsevol possible Opció C. Valoreu especialment la resiliència, la durabilitat, la robustesa de seguretat i com s'encaixa millor a llarg termini al sistema i a l'enllaç de Sollutia.
3. Emeteu una recomanació final clara i justificada, triant la solució que assega millor els fonaments del sistema.

## Eixida esperada

Genereu la vostra resposta al xat (no cal crear un fitxer nou) incloent el DAFO i la recomanació. No escrigueu codi, només l'anàlisi arquitectònic.
