/**
 * contracteExportacioFederacio.js — P2-09 (D06/D07) · Contracte explícit
 * d'exportació RGPD per a les taules de federació (`realms`, `user_realms`,
 * `connections`, `posts`).
 *
 * PER QUÈ CAL (Auditoria Codex 261024_1315 · P2-09):
 * En les migracions 2609261500 i 2610241410, el bloc `federacio_no_versionada`
 * d'`exporta_les_meues_dades()` (SECURITY DEFINER) inspecciona dinàmicament
 * qualsevol columna `uuid` (llevat d'`id` i `tenant_id`) amb un `OR` i fa
 * `to_jsonb(t)`. Si al node remot una d'estes taules té columnes UUID de
 * contrapart o de moderació (`target_user_id`, `connected_user_id`,
 * `invited_by`, `reply_to_user_id`, `moderator_id`), la inferència per UUID
 * podria incloure files la titularitat de les quals pertany a una altra
 * persona o exposar columnes internes no autoritzades.
 *
 * QUÈ BLINDA ESTE CONTRACTE:
 * 1. Fixa la llista tancada de recursos (`TAULES_FEDERACIO_CONTRACTE`):
 *    `realms`, `user_realms`, `connections` i `posts`.
 * 2. Declara per a cada recurs la columna canònica de propietat
 *    (`columnaPropietat`: `owner_user_id` / `user_id` / `author_id` === `auth.uid()`),
 *    les columnes admeses per precedència (`columnesPropietatAdmeses`), les
 *    columnes UUID explícitament excloses de la inferència de titularitat
 *    (`columnesExclosesPropietat`) i la projecció exacta de columnes
 *    exportables (`columnesExportades`).
 * 3. Filtra i projecta per columnes (`aplicaContracteExportacioFederacio`)
 *    tota resposta de `federacio_no_versionada` abans que isca de l'adaptador
 *    `compte.js`: cap fila aliena (on la columna de propietat no siga `uid`)
 *    ni cap columna fora de `columnesExportades` ix de l’adaptador. El servidor
 *    ha d’aplicar també el candidat 2610311900 abans de retornar la resposta.
 */

export const TAULES_FEDERACIO_CONTRACTE = Object.freeze([
  'realms',
  'user_realms',
  'connections',
  'posts'
]);

const congelaRecurs = (definicio) => Object.freeze({
  ...definicio,
  columnesPropietatAdmeses: Object.freeze([...definicio.columnesPropietatAdmeses]),
  columnesExclosesPropietat: Object.freeze([...definicio.columnesExclosesPropietat]),
  columnesExportades: Object.freeze([...definicio.columnesExportades])
});

export const CONTRACTE_EXPORTACIO_FEDERACIO = Object.freeze({
  realms: congelaRecurs({
    taula: 'realms',
    columnaPropietat: 'owner_user_id',
    columnesPropietatAdmeses: ['owner_user_id', 'user_id'],
    columnesExclosesPropietat: [
      'id',
      'tenant_id',
      'parent_realm_id',
      'moderator_id',
      'reviewed_by',
      'invited_by',
      'target_user_id',
      'updated_by'
    ],
    columnesExportades: [
      'id',
      'tenant_id',
      'slug',
      'name',
      'title',
      'description',
      'domain',
      'protocol',
      'visibility',
      'status',
      'owner_user_id',
      'user_id',
      'created_at',
      'updated_at'
    ],
    predicatSql: 't.owner_user_id = auth.uid()'
  }),
  user_realms: congelaRecurs({
    taula: 'user_realms',
    columnaPropietat: 'user_id',
    columnesPropietatAdmeses: ['user_id'],
    columnesExclosesPropietat: [
      'id',
      'tenant_id',
      'realm_id',
      'invited_by',
      'granted_by',
      'approved_by',
      'revoked_by',
      'moderator_id'
    ],
    columnesExportades: [
      'id',
      'tenant_id',
      'user_id',
      'realm_id',
      'role',
      'status',
      'handle',
      'actor_uri',
      'created_at',
      'updated_at'
    ],
    predicatSql: 't.user_id = auth.uid()'
  }),
  connections: congelaRecurs({
    taula: 'connections',
    columnaPropietat: 'user_id',
    columnesPropietatAdmeses: ['user_id', 'owner_user_id'],
    columnesExclosesPropietat: [
      'id',
      'tenant_id',
      'realm_id',
      'target_user_id',
      'connected_user_id',
      'peer_user_id',
      'follower_id',
      'following_id',
      'invited_by',
      'blocked_user_id'
    ],
    columnesExportades: [
      'id',
      'tenant_id',
      'user_id',
      'owner_user_id',
      'realm_id',
      'provider',
      'remote_actor_uri',
      'remote_handle',
      'direction',
      'status',
      'created_at',
      'updated_at'
    ],
    predicatSql: 't.user_id = auth.uid()'
  }),
  posts: congelaRecurs({
    taula: 'posts',
    columnaPropietat: 'author_id',
    columnesPropietatAdmeses: ['author_id', 'owner_user_id', 'user_id'],
    columnesExclosesPropietat: [
      'id',
      'tenant_id',
      'realm_id',
      'reply_to_user_id',
      'in_reply_to_user_id',
      'reblogged_by_id',
      'moderator_id',
      'mentioned_user_id',
      'deleted_by'
    ],
    columnesExportades: [
      'id',
      'tenant_id',
      'author_id',
      'owner_user_id',
      'user_id',
      'realm_id',
      'title',
      'content',
      'summary',
      'visibility',
      'status',
      'uri',
      'url',
      'published_at',
      'created_at',
      'updated_at'
    ],
    predicatSql: 't.author_id = auth.uid()'
  })
});

export const CONDICIO_SQL_PROPIETAT_FEDERACIO = Object.freeze({
  realms: CONTRACTE_EXPORTACIO_FEDERACIO.realms.predicatSql,
  user_realms: CONTRACTE_EXPORTACIO_FEDERACIO.user_realms.predicatSql,
  connections: CONTRACTE_EXPORTACIO_FEDERACIO.connections.predicatSql,
  posts: CONTRACTE_EXPORTACIO_FEDERACIO.posts.predicatSql
});

export const CONSULTA_SQL_AUDITORIA_ESQUEMA_FEDERACIO = [
  'SELECT table_name, column_name, data_type, is_nullable',
  'FROM information_schema.columns',
  "WHERE table_schema = 'public'",
  "  AND table_name IN ('realms', 'user_realms', 'connections', 'posts')",
  'ORDER BY table_name, ordinal_position;'
].join('\n');

const esObjectePla = (valor) => Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
const normalitzaUid = (uid) => (typeof uid === 'string' ? uid.trim().toLowerCase() : '');

/**
 * Torna la columna de propietat efectiva per a una fila segons la precedència
 * declarada a `columnesPropietatAdmeses` (p. ex. `author_id` abans de
 * `owner_user_id` i `user_id` a `posts`). Si la fila no declara cap columna de
 * propietat admesa, torna `null` (tancat per defecte).
 */
export function columnaPropietatEfectiva(taula, fila) {
  const contracte = Object.hasOwn(CONTRACTE_EXPORTACIO_FEDERACIO, taula)
    ? CONTRACTE_EXPORTACIO_FEDERACIO[taula] : null;
  if (!contracte || !esObjectePla(fila)) return null;
  for (const columna of contracte.columnesPropietatAdmeses) {
    if (Object.prototype.hasOwnProperty.call(fila, columna) && fila[columna] !== undefined) {
      return columna;
    }
  }
  return null;
}

/**
 * Verifica que la fila pertany explícitament a `uid` mitjançant la columna de
 * propietat canònica del recurs (`owner_user_id` / `user_id` / `author_id`).
 * Una coincidència en qualsevol altra columna UUID (`target_user_id`,
 * `invited_by`, `reply_to_user_id`, `moderator_id`, etc.) es rebutja sempre.
 */
export function esFilaPropiaFederacio(taula, fila, uid) {
  const uidNet = normalitzaUid(uid);
  if (!uidNet) return false;
  const columna = columnaPropietatEfectiva(taula, fila);
  if (!columna) return false;
  const valorPropietari = normalitzaUid(fila[columna]);
  return Boolean(valorPropietari) && valorPropietari === uidNet;
}

/**
 * Projecta una fila pròpia deixant exclusivament les columnes declarades a
 * `columnesExportades` del recurs. Si la fila és aliena o no té columna de
 * propietat vàlida, torna `null`.
 */
export function projectaFilaFederacio(taula, fila, uid) {
  if (!esFilaPropiaFederacio(taula, fila, uid)) return null;
  const contracte = Object.hasOwn(CONTRACTE_EXPORTACIO_FEDERACIO, taula)
    ? CONTRACTE_EXPORTACIO_FEDERACIO[taula] : null;
  const projectada = {};
  for (const columna of contracte.columnesExportades) {
    if (Object.prototype.hasOwnProperty.call(fila, columna)) {
      projectada[columna] = fila[columna];
    }
  }
  return projectada;
}

/**
 * Sanea el bloc `federacio_no_versionada` d'`exporta_les_meues_dades()`:
 * - Només admet les claus de `TAULES_FEDERACIO_CONTRACTE`.
 * - Conserva els marcadors d'error d'esquema (`{ error: sqlstate }`).
 * - Filtra cada llista de files amb `projectaFilaFederacio(taula, fila, uid)`,
 *   eliminant qualsevol fila aliena colada per inferència d'UUID i qualsevol
 *   columna fora del contracte.
 */
export function filtraFederacioExportada(federacioNoVersionada, uid) {
  if (!esObjectePla(federacioNoVersionada)) return { error: 'SDP-FED-FORMAT-NO-ADMES' };
  if (federacioNoVersionada.error === 'SDP-FED-FORMAT-NO-ADMES') return { error: 'SDP-FED-FORMAT-NO-ADMES' };
  const resultat = {};
  for (const taula of TAULES_FEDERACIO_CONTRACTE) {
    if (!Object.prototype.hasOwnProperty.call(federacioNoVersionada, taula)) continue;
    const valor = federacioNoVersionada[taula];
    if (Array.isArray(valor)) {
      const incompatible = valor.some((fila) => !columnaPropietatEfectiva(taula, fila)
        || (esFilaPropiaFederacio(taula, fila, uid)
          && CONTRACTE_EXPORTACIO_FEDERACIO[taula].columnesExportades.some((columna) =>
            fila[columna] !== null && typeof fila[columna] === 'object')));
      if (incompatible) {
        resultat[taula] = { error: 'SDP-FED-ESQUEMA-NO-ADMES' };
        continue;
      }
      resultat[taula] = valor
        .map((fila) => projectaFilaFederacio(taula, fila, uid))
        .filter((fila) => fila !== null);
    } else if (esObjectePla(valor) && typeof valor.error === 'string') {
      resultat[taula] = { error: /^(?:[A-Z0-9]{5}|SDP-FED-ESQUEMA-NO-ADMES|SDP-FED-FORMAT-NO-ADMES)$/.test(valor.error)
        ? valor.error : 'SDP-FED-FORMAT-NO-ADMES' };
    } else {
      resultat[taula] = { error: 'SDP-FED-FORMAT-NO-ADMES' };
    }
  }
  return resultat;
}

/**
 * Aplica el contracte d'exportació de federació (`P2-09`) sobre la resposta
 * sencera d'`exporta_les_meues_dades()`. Si la resposta no porta
 * `federacio_no_versionada`, la torna intacta.
 */
export function aplicaContracteExportacioFederacio(dades, uid) {
  if (!esObjectePla(dades)) return dades;
  if (!Object.prototype.hasOwnProperty.call(dades, 'federacio_no_versionada')) return dades;
  return {
    ...dades,
    federacio_no_versionada: filtraFederacioExportada(dades.federacio_no_versionada, uid)
  };
}
