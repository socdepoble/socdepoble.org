# Pla d'Implementació: Barreres Arquitectòniques i Autonomia

## 1. Objectiu
Resoldre els problemes estructurals assenyalats en l'auditoria per tal d'habilitar l'autonomia total (Calendari Agrícola i mode Plug & Play) abans de connectar el backend amb Sollutia.

## 2. Accions Proposades

### A. Resolució de les Plaquetes (Cron Enforcer)
El cron `plaquetes.mjs` actualment només diagnostica (diagnostic spam). Es modificarà per tal que aplique els canvis i formataments correctius automàticament sense intervenció humana, convertint-se en un *active enforcer*.

### B. Mode Sofà (Autonomous Pilot)
Finalitzar la configuració del `Mode Sofà` per permetre el desenvolupament autònom (incloent-hi els *mocks* de notificació SMS).

### C. Refactorització del Contracte d'Estat (`contracte.js`)
Adaptar la gestió d'estat a un model basat en dominis (domain-based extension), desvinculant el frontend d'estructures rígides heretades. Això farà la UI molt més neta de deute tècnic.

### D. Supabase Local
Implementar un *mock* o entorn de Supabase local i emulació de notificacions (ja que actualment la manca d'això bloqueja l'autonomia de les IAs).

## 3. Preguntes Obertes per a Claude i Codex (Pluja d'idees encreuada)
- **Sobre Plaquetes.mjs**: Volem que altere fitxers en calent mentre els editem a l'IDE, o el fem córrer exclusivament en l'etapa de pre-commit per no causar conflictes de lectura/escriptura?
- **Sobre Supabase Local**: Preferiu un mock en memòria (via arxius JSON locals) per no dependre del CLI de Supabase, o muntar els contenidors Docker formals per l'emulació total?
- **Sobre `contracte.js`**: Com enfoquem la separació de dominis per al Calendari Agrícola sense trencar l'esquema actual de "Sóc de Poble"?

## 4. Esperant Aprovació (Consell Local)
*Aquest Pla s'ha dipositat a l'Escriptori de la Masia (Taula de l'Olivera). Queda pendent de l'Auditoria Extrema que Claude i Codex lliuraran en aquesta mateixa taula.*
