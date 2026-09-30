---
type: acta
status: canonic
description: "Acta de la sessió de disseny T48-T54 amb Claude (Onades de refactorització)"
tags:
  - marmota
  - disseny
---
# Acta Marmota: La Gran Refactorització de Disseny (T48-T54)
Data: 28 de setembre de 2026, 18:45h

## Resum de la Jornada
Una sessió històrica de cirurgia a cor obert on Claude, actuant com a orquestrador de 42 subagents en 4 onades massives (més de 13,5 milions de tokens), ha consolidat les bases visuals i arquitectòniques de Sóc de Poble (`UniversalEditorShell`, `Barra Taronja`, `Targeta Viva`, `Connexions`).

Hem passat d'una arquitectura fragmentada a una cohesió visual on **2.163 de 2.163 tests han eixit verds**, incloent-hi la resurrecció dels antics tests fallits de la T36.

## Fites Aconseguides
1. **T48 (Neteja de Consola):** S'ha optimitzat el `GoTrueClient` de Supabase (sense errors 404 continus ni desconnexions fantasmes). L'error de transicions `InvalidStateError` ha estat controlat.
2. **T49 (Entradilla 256):** Ampliada a 256 caràcters al client i s'ha generat la migració SQL per a la base de dades.
3. **T50 (Targeta Viva):** La previsualització és ara omnipotent. Apareix tant en llistes, com en un *aside* dret si la pantalla és ampla, i s'amaga en favor d'un xip en pantalles menudes.
4. **T51 (Barra Taronja):** Totalment normativitzada seguint les instruccions del Mestre:
   - Data de creació/última versió en lectura. Data d'ara en edició. Cap document sense data.
   - Ploma central només per a escollir emoticones.
   - Nou glif de núvol per a la confirmació de desament.
   - Aquestes normes s'han integrat blindades a la *Skill* de Pedra Seca.
5. **T52 (Catàleg i Manual):** S'ha construït un arbre de llinatge, validant quins components deriven del `PageFrame` o l'`UniversalCard`. S'han creat 7 nous espècimens.
6. **T53 (Barra Blava):** Ajustada l'alineació del trio esquerre i el central. Solucionats trencaments mòbils de la paraula "CONNECTAR".
7. **T54 (Connexions):** El mode "Llegir-ho després" funciona bé. Obrir una connexió des de Notes mostra el mur de lectura original, sense un fals editor actiu.

## Pendent per al Pròxim Relleu (El Nou Prompt)
El proper relleu de Claude començarà llançant el nou document de Prompt que recull:
- **T55 (Xat Real):** Netejar els robots del Xat i activar els contactes reals (Javi i Sóc de Poble) per defecte.
- **T57 (Botonera Multimèdia):** Centrar la botonera de la galeria ("Galeria", "Cronologia").
- **T58 (Autoria Onboarding):** Corregir que la nota per defecte d'onboarding es mostre a la barra taronja sota el logotip i autoria de "Sóc de Poble", i no de "Foraster".
- **T59 (Migració Entradilla):** Executar la migració `2609281500_lema_entradilla_256.sql` a Supabase perquè accepte el text.
- **T60 (Desament d'emoticones al Perfil):** Prendre una decisió arquitectònica sobre on i com desar l'emoticona dels perfils (columna `icon` o RPC).
- **Límits Identificats:** Decidir sobre la mida (24px) del xip tàctil, dates buides del generador de la Wiki, i falsos positius en impressió.

---
*Ment Colmena Integral - Segell d'Entrega - La IAIA MarIA*

## Vincles

- [[00_index]]
