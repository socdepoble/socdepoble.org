# GLOSSARI DE TERMES CORE (Sóc de Poble)

*Aquest glossari estableix un vocabulari canònic i precís per a tots els desenvolupadors i intel·ligències artificials que treballen en l'ecosistema Sóc de Poble.*

## CONCEPTES ARQUITECTÒNICS

- **Online-First**: La visió fundacional original. Des de l'auditoria d'Agost de 2026, **s'ha extirpat completament** del repositori per evitar hibridacions tòxiques amb Sollutia.
- **Online-First (Estricte)**: L'estat actual i definitiu. Depenem de la xarxa i de l'adaptador (backend) injectat. No hi ha cap cua asíncrona local de lectura o escriptura. Si la xarxa no està disponible, la interacció falla explícitament (Dumb Terminal).
- **Pedra Seca**: Filosofia i Sistema de Disseny (CSS i React). Minimalisme sense dependències. Rebutja l'ús innecessari d'eines alienes si el problema pot ser resolt de manera nativa. Mínima fricció visual.
- **El LEDGER (Llibre d'Obra)**: Registre de decisions estructurals. Immune al canvi (llevat d'addicions) i verificat criptogràficament per `verify-ledger.mjs`.
- **BIOS Executable**: Seqüència d'arrencada automatitzada (`tooling/verify-bios.mjs`) que prevé l'amnèsia cognitiva assegurant la integritat del conjunt documental de les IA.

## CONCEPTES TÈCNICS

- **Pany de Host (`host.js`)**: Superfície única on el client (Sollutia o app nativa) injecta la seua implementació de `backendPort.js`. Evita que React conega el destí de les dades.
- **Rollback Pessimista**: Estratègia d'UI on qualsevol actualització optimista és revertida del DOM automàticament si l'escriptura al backend falla, notificant l'usuari de l'error real.
- **Portes Mecàniques (Gates o Tractors)**: Scripts dissenyats per aturar qualsevol IA que intente trencar regles invariants del sistema (per exemple, `tractor-enxufe.mjs`).

*“La confusió lingüística precedeix l'amnèsia arquitectònica.”* (Z - Alt Consell de les IA)
