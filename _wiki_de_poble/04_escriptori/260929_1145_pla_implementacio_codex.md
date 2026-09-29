---
type: document
status: esborrany
description: Pla per a Codex
tags:
  - implementacio
visibility: private
reflex: sdp:torn_b46d0134-3956-41ff-b71e-300f7d0459b6:05c0d774-d5f6-4471-b93b-139fe04beb56
---
# Pla d'implementació per a l'auditoria i fortificació de Codex

**Estat del Pla:** [aprovat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_b46d0134-3956-41ff-b71e-300f7d0459b6:05c0d774-d5f6-4471-b93b-139fe04beb56 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-29T09:45:46.937Z |
| Modificació | 2026-09-29T09:45:46.937Z |
| Propietari | MarIA |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Codex (ChatGPT Pro) |
| Tokens consumits | Mesura no disponible en este entorn; no s'estima. |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-29T09:45:46.937Z: esborrany creat; contingut i verificació pendents.

2026-09-29: Codex incorpora les precisions humanes del xat: productes autèntics,
còpia local autoritzada, Google local amb avís i marge/focus discret al cercador.
El contracte real és `backendPort` i la injecció del host existent. La verificació
de Realtime detecta clau pública incompatible i política de lectura absent;
es corregeixen en local amb una prova positiva i denegació a tercers.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### Fase 1: Base de Dades i Migracions (T1)
1. Executar les migracions pendents des de la carpeta `supabase/migrations` (lema, emoticona, xat de pagina).
2. Validar que les taules/polítiques del Xat funcionen en local.

### Fase 2: Incidències UX Crítiques i Auth (T4 i T5)
1. **Google Auth:** En local sense OAuth, mostrar l'avís amistós autoritzat pel Mestre des de l'adaptador. Mantindre el flux remot; no inventar credencials.
2. **Cercador d'Usuaris (Nova Conversa):**
   - Modificar `NovaConversa` (o component equivalent).
   - Si la cerca està buida, carregar explícitament els perfils: **Sóc de Poble** i **IAIA MarIA** per defecte.
   - Fer que qualsevol altra persona isca només quan es busca específicament.
3. **Mercat Buit:**
   - Auditar el flux existent `MercatSection` → `MurContext` → `backendPort`. Copiar els dos productes autèntics al poble local actiu, conservant originals, segons l'autorització humana.
4. **Operativitat del Xat:**
   - Garantir enviament/recepció de missatges a través de `backendPort` i verificar el canal privat amb participants i un tercer sense accés.

### Fase 3: Enxufabilitat Estricta - Llei del Model B (T2)
1. Identificar importacions directes com `import supabase from '@/data/supabase/config'` dins de les vistes (Xat, Comunitat).
2. Fer passar les operacions pel `backendPort` injectat pel host existent i netejar les dependències de UI respecte a la BD.

### Fase 4: Neteja i Deute Tècnic (T3 i T4)
1. Consolidar traduccions (es, en, eu, gl) i retirar cadenes de text hardcodejades.
2. Implementar retirada i restauració d'`icon` i `copyright` quan un compte demana o cancel·la la baixa.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- **Llei del Model B:** Confirmar que no hi ha cap import directe de Supabase en components de React de la UI.
- **Xarxa/Auth:** Validar correu/contrasenya i avís de Google local sense petició OAuth fallida; no acreditar Google sense secrets reals.
- **UX Xat:** Comprovar l'estat buit de "Nova Conversa" (només Sóc de Poble i IAIA visibles).
- **Consistència:** `npm run test` passa correctament.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Conservar contractes, CSS i estructura de l'Onada Final; el focus usa els tokens existents amb més marge. La política Realtime només permet lectura dels fils propis, amb RLS actiu. Google real continua requerint configuració OAuth fora d'este entorn efímer.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
