---
tipus: document
estat: esborrany
description: "Pla d'Implementació: Transició a Online-First (Fase 3) i Reparació d'Esquema (B1, B2)"
---
# Pla d'Implementació: Transició a Online-First (Fase 3) i Reparació d'Esquema (B1, B2)

Aquest pla detalla les operacions SQL necessàries per a culminar l'adopció de l'arquitectura Online-First i l'aïllament multi-tenant.

## Objectius

- **B1**: Reparar la signatura de la funció `list_my_organizations` per alinear-la amb la definició del client (13 columnes) i validar `create_organization`.
- **B2**: Crear la taula `private.ajustos` amb la clau `poble_per_defecte` i actualitzar el trigger `handle_new_user` perquè resolga correctament l'assignació d'alta.
- **Fase 3 (Online-First i Rols Globals)**: Refactoritzar la gestió d'estat a Supabase, eliminant dependències de Zustand, per basar-nos exclusivament en JWT claims i l'API de Supabase.

## Detall dels Canvis SQL a Realitzar

### 1. Canvis a `private.ajustos` i `handle_new_user` (B2)
- Ja existeix la taula `private.ajustos` (línia 17 a `schema.sql`). Inserirem per defecte el UUID de la Torre de les Maçanes com a `poble_per_defecte`.
- Actualitzarem el trigger `public.handle_new_user()` per llegir `poble_per_defecte` de `private.ajustos` quan el metadata `tenant_id` no estiga present en la petició d'alta de l'usuari. (Açò ja està mig plantejat al `schema.sql` actual, però s'ha d'assegurar l'execució i el seed inicial).

### 2. Reparació de `list_my_organizations` (B1)
- L'actual definició a la base de dades no coincideix amb la petició del client (`lema`, `visibility`, `created_by`, etc.). 
- Es regenerarà la funció `list_my_organizations` per retornar exactament els mateixos camps que es defineixen en la taula `public.organizations`:
  - `id, tenant_id, slug, name, kind, parent_organization_id, lema, description, visibility, created_by, created_at, updated_at`.

### 3. Fase 3: Rols Globals, Reclamacions d'Entitat i JWT Claims
- **Superadmin**: Es consolida la funció `private.es_superadmin()` recolzant-se sobre la taula `public.user_platform_roles` amb el rol `superadmin`.
- **Reclamació d'Entitats**: Els procediments emmagatzemats `sollicita_reclamacio` i `resol_reclamacio` gestionaran la inserció a `public.organization_claims`.
- Es crearan regles de polítiques de seguretat RLS (Row Level Security) per lligar de forma nativa l'accés a dades als JWT Claims emesos per Supabase, trencant definitivament la dependència de memòria volàtil de Zustand (Online-First).

## Open Questions
> [!WARNING]
> Abans d'executar les migracions SQL, recomanem avaluar aquest pla mitjançant una **Petorreta** per al Consell (ex. Claude o Codex) com has suggerit, demanant una **Nota (score) sobre la solidesa de l'arquitectura i l'estimació de temps de la implementació de la Fase 3.** L'aprovació d'este pla dispararà eixa validació prèvia.
