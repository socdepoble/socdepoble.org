# 🗃️ Mòduls Supabase

> **Estat**: Refactoritzat (v2.0.0) | **Data**: 2026-09-15 | **Autor**: Consell de la Petorreta

## 📌 Estructura

| Mòdul          | Descripció                          | Línies | Dependències          |
|----------------|--------------------------------------|--------|-------------------------|
| `config.js`    | Configuració base de Supabase       | 50     | -                       |
| `auth.js`      | Autenticación                        | 230    | `config.js`             |
| `notes.js`     | CRUD de notes                        | 180    | `config.js`, `utils.js` |
| `mur.js`       | Gestió del mur                      | 150    | `config.js`, `utils.js` |
| `xat.js`       | Xat en temps real                   | 120    | `config.js`, `utils.js` |
| `storage.js`   | Gestió de fitxers                    | 90     | `config.js`, `utils.js` |
| `realtime.js`  | Subscripcions en temps real          | 60     | `config.js`             |
| `utils.js`     | Funcions utilitàries                 | 200    | `config.js`             |
| `index.js`     | Punt d'entrada                       | 80     | Tots                     |

## 🚀 Ús

### Importar tot
```javascript
import * as supabase from './data/supabase';
```

### Importar mòduls específics
```javascript
import { signInWithEmail, getSession } from './data/supabase/auth';
import { fetchNotes, createNote } from './data/supabase/notes';
import { loadGestoria } from './data/supabase'; // Re-exportat des de frontissa/local
```

## ⚠️ Migració des de `supabaseBackend.js`

1. **Canviar imports**:
   ```diff
   - import { loadGestoria } from './data/supabaseBackend';
   + import { loadGestoria } from './data/supabase';
   ```

2. **Eliminar `supabaseBackend.js`** després de validar que tot funciona.

3. **Executar tests**:
   ```bash
   npm run test:supabase
   ```

## 🔄 Contractes

Cada mòdul exposa un **contracte clar** de funcions. Veure la documentació JSDoc de cada fitxer.

## 📝 Notes

- **Online-First**: El sistema requereix connexió i no hi ha emmagatzematge local de negoci (només autenticació).
- **Enxufabilitat**: Cada mòdul pot ser reemplaçat sense afectar la resta.
- **Compatibilitat**: `index.js` manté compatibilitat amb el codi existent.
