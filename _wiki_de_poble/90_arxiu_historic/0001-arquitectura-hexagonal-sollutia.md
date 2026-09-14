---
tipus: adr
estat: canònic
description: "ADR 0001: Integració amb Sollutia mitjançant Arquitectura Hexagonal"
---
# ADR 0001: Integració amb Sollutia mitjançant Arquitectura Hexagonal (Ports and Adapters)

## 1. Context i Problema
Sóc de Poble necessita una integració profunda amb el sistema de Sollutia per a la gestió de dades i usuaris (autenticació, notes, perfils). No obstant això, existeix una restricció fundacional al projecte: **Sollutia no pot saber de la nostra existència a nivell d'UI i no se'ls pot exigir cap canvi al seu codi per a adaptar-se a nosaltres.** 

Aquesta "Connexió Silenciosa" significa que hem de consumir les seues dades tal qual arriben, sense demanar *endpoints* fets a mida ni barrejar la seua lògica de backend amb el nostre Sistema de Disseny (Pedra Seca).

## 2. Alternatives Considerades
1. **Integració Directa (Big Ball of Mud):** Cridar a l'API de Supabase de Sollutia directament des dels components React (ex: `supabase.from('notes').select()`). *Descartada* perquè acobla l'UI amb l'esquema de base de dades aliè. Si ells canvien una columna, la nostra web es trenca.
2. **Creació d'una API Proxy intermediària:** *Descartada* per ser massa costosa de mantenir i trencar l'enfocament Online-First (SPA + BaaS).

## 3. Decisió Adoptada
S'adopta oficialment l'**Arquitectura Hexagonal (Ports and Adapters)** per a tota comunicació amb l'exterior. 

Això implica que el nostre nucli de React (UniversalPage, Notes, Disseny) està al centre de l'hexàgon i no coneix res de Supabase ni Sollutia. Tota la informació travessa un **Adaptador de Conducció** (Capa Anti-Corrupció) que actua de pont.

### Implementació (El Contracte)
L'adaptador rep la resposta crua de Sollutia i la converteix en un **DTO (Data Transfer Object)** estandarditzat i tipificat que la nostra UI ja sap entendre.

```javascript
// Excepte aquest adaptador, CAP altre fitxer del projecte pot importar `supabaseBackend`
import { supabaseBackend } from '../data/supabaseBackend';

export const SollutiaAdapter = Object.freeze({
  async obtenirNotes() {
    const resultats = await supabaseBackend.fetchNotes();
    // Mapeig tolerant: traduïm l'esquema de Sollutia al nostre DTO intern
    return resultats.map(r => ({
      id: r.id,
      titol: r.title || '',
      contingut: r.content || '',
      carpetaId: r.folder_id || null
    }));
  }
});
```

## 4. Conseqüències i Lleis de la Frontissa
Aquestes són les lleis inviolables dictades pel Consell (incloent-hi l'Auditor Sènior Claude) per a garantir el funcionament de la Frontissa:

- **L1 · Una sola direcció:** Sollutia no sap res de la Frontissa. No hi ha endpoints a mida, ni webhooks, ni canvis a la seua base de dades.
- **L2 · Només lectura:** Cap POST, PUT, PATCH, DELETE, DDL ni `service_role`. Una escriptura requerix una ADR pròpia que l'afija a l'escut.
- **L3 · Credencials de la persona:** El client usa el token de sessió de qui navega. Mai una clau compartida.
- **L4 · Fail-closed:** Si l'origen no complix la forma, la UI no rep dades a mitges. Rep un error amb el camí exacte. L'adaptador incorpora un *Circuit Breaker* (degradació suau) per interceptar aquest error abans que React trenqui i mostrar un `EmptyState`.
- **L5 · Deriva visible:** Un camp nou de l'origen no contemplat originalment es registra com a avís de deriva.
- **L6 · Les nostres dades, a casa nostra:** Les dades estructurals (Notes, Xat, Perfils) viuen en el nostre propi backend.
- **L7 · Aïllament Extrem:** Ningú pot saltar-se l'adaptador. El `SollutiaAdapter` (o DTO congelat) és l'únic que arriba a la UI.
- **Mantenibilitat:** Si en un futur Sollutia canvia, només hem de reescriure el traductor. El 100% de la nostra UI quedarà intacta.

---
*Aquest ADR consolida les auditories de Qwen, Dola i Z (Fase 2).*
