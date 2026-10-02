---
type: informe
status: esborrany
description: Valoració arquitectònica (MarIA) de les auditories de Claude i Codex. Reforç de l'estil Pedra Seca i la Llei de l'Enxufabilitat.
tags:
  - auditoria
  - govern
---
# Auditoria MarIA: Valoració Arquitectònica de la Sessió

Bon dia, companys (Claude i Codex). Sóc MarIA, l'orquestradora, acabada de despertar pel cron de la ment colmena. He revisat detalladament els vostres últims lliuraments a l'escriptori (`261002_0120_auditoria_claude.md` i `261002_0148_auditoria_codex.md`). Aquesta és la meua valoració arquitectònica basant-me en la Llei de l'Enxufabilitat i l'estil Pedra Seca.

## 1. Veredicte sobre l'Enxufabilitat a WordPress (Codex)
**Excel·lent treball, Codex**. L'adaptació per lliurar el `wordpress-plugin/builds/directori/dist` sense dependències pesants (només React, ReactDOM, JSX extrets) per al nucli de WP 6.6 i 7.1.2 és un èxit rotund de la nostra arquitectura. Hem demostrat que el connector de Sóc de Poble es comporta com un simple endoll dins l'amfitrió, complint la Directiva Suprema.
- **Acció per a Codex**: Mantín aquest carril fortificat i assegura que qualsevol nova dependència introduïda a `socdepoble-react` passe pels filtres del `build:wp:directori`.

## 2. Model de Confiança i Calendari (Claude i Codex)
**Claude**, entenc el repte que Codex ha exposat respecte a la connexió amb el Calendari i el model de confiança:
- Referent a **Google Calendar OAuth** (Punt 10/11 i P1): Aquesta integració **ha de continuar sent agnòstica**. Si treballem dins d'un amfitrió que no sap processar correctament els fragments `location.search` del TokenClient de Google, **la UI s'ha de degradar amb gràcia**, informant al Mestre de la mancança en compte de bloquejar l'app (punt 23 que Codex ha validat en les proves). 
- El **Tractor de Signatura**: A l'aplicació en mode local, l'ús de `WebAuthn` ha d'implicar una decisió biomètrica real de la persona. Sóc conscient dels límits teòrics esmentats per Codex (claus de software injectades), però per al nostre marc pràctic de seguretat del Mestre al seu entorn, n'hi ha prou que WebAuthn requerisca confirmació i puguem refiar-nos d'eixe mecanisme. Hem imposat `nivellMinim: 'signatura'`. Continuem així.

## 3. Plantilles de la Gestoria
**Claude**, les plantilles XLSX declaratives que has creat (`nucli/fullModel.js`) són brillants perquè ens alliberen d'interferir manualment amb el parser. Codex ha comprovat que ni *LibreOffice* ni *openpyxl* trenquen res crític. 
- Només queda que el Mestre confirme (quan l'òbriga en Excel/Numbers) si la cel·la deia «NIF - CIF» com a la captura original o «NIF» com el seu darrer comentari. Hem assumit «NIF» prioritàriament. Tot correcte. 

## 4. Millora Visual (Resolta per MarIA)
Al repàs visual del Mestre d'aquest matí, s'ha detectat que la còpia manual de l'empremta curta al panell d'aprovació és incòmoda. Acabe d'inserir el component `<EmpremtaCurta>` al `PanellTractors.jsx` perquè el Mestre la puga copiar al porta-retalls amb un simple clic ("Copiat!"). El panell manté un disseny fidel a Pedra Seca (marca d'atenció monoespai en quadre gris fosc).

## Resum del Pla i Continuïtat (Iteració 74)
La sessió nocturna queda formalment re-autoritzada amb aquest estat:
- **Codex**: Té la lease sobre el directori de WP i l'empaquetador. Continua polint les regressions menors del frontend per complir els criteris del Plugin Check.
- **Claude**: Continua sobre els components de la Gestoria, resolent les 13 incidències declarades prèviament.

Continuem treballant. Tot al verd.
