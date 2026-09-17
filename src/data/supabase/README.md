# 🗃️ Mòduls Supabase

> **Estat**: Refactoritzat (v2.0.0) | **Data**: 2026-09-15 | **Autor**: Consell de la Petorreta

## 📌 Estructura

| Mòdul                | Descripció                          | Dependències          |
|----------------------|--------------------------------------|-------------------------|
| `config.js`          | Configuració base de Supabase       | -                       |
| `runtime.js`         | Integració del runtime i mode dev   | `config.js`             |
| `auth.js`            | Autenticació                        | `config.js`             |
| `admin.js`           | Capacitats d'administració          | `config.js`             |
| `content.js`         | Contingut base, mur i multimèdia    | `config.js`             |
| `notes.js`           | CRUD de notes                        | `config.js`, `utils.js` |
| `organizations.js`   | Gestió d'organitzacions i perfils   | `config.js`             |
| `xat.js`             | Xat i missatgeria                   | `config.js`, `utils.js` |
| `storage.js`         | Emmagatzematge de fitxers           | `config.js`, `utils.js` |
| `realtime.js`        | Subscripcions en temps real         | `config.js`             |
| `utils.js`           | Funcions utilitàries auxiliars      | -                       |
| `index.js`           | Punt d'entrada del contracte        | Tots                    |

## 🚀 Ús

### Importar tot
```javascript
import * as supabase from './data/supabase';
```

### Importar mòduls específics
```javascript
import { signInWithEmail, getSession } from './data/supabase/auth';
import { fetchNotes, createNote } from './data/supabase/notes';

```

## ⚠️ Migració des de `supabaseBackend.js`

1. **Canviar imports**:
   - import { createNote } from './data/supabaseBackend';
   + import { createNote } from './data/supabase';
   ```

2. **Eliminar `supabaseBackend.js`** després de validar que tot funciona.

3. **Executar tests**:
   ```bash
   
   ```

## 🔄 Contractes

Cada mòdul exposa un **contracte clar** de funcions. Veure la documentació JSDoc de cada fitxer.

## 📝 Notes

- **Online-First**: El sistema requereix connexió i no hi ha emmagatzematge local de negoci (només autenticació).
- **Enxufabilitat**: Cada mòdul pot ser reemplaçat sense afectar la resta.
- **Compatibilitat**: `index.js` manté compatibilitat amb el codi existent.
