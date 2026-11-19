/* ENX-13 · DTO tancat. Cap camp d'autoritat ni JSON cru de Sollutia arriba
   al consumidor perquè un proveïdor afija camps a la seua resposta. */
const camp = (payload, clau) => {
  const d = Object.getOwnPropertyDescriptor(payload, clau);
  if (d && !Object.hasOwn(d, 'value')) throw new Error('Camp no primitiu');
  return d?.value;
};
const text = (v, maxim, missatge) => {
  if (typeof v !== 'string' || !v.trim() || v.length > maxim || /[\u0000-\u001f\u007f]/.test(v)) throw new Error(missatge);
  return v;
};
export const RECURSOS = Object.freeze({
  perfil: Object.freeze({
    traductor: payload => {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)
        || ![Object.prototype, null].includes(Object.getPrototypeOf(payload))) throw new Error('Manca payload');
      const ident = text(camp(payload, 'id') || camp(payload, 'uuid'), 1024, 'Manca id o uuid (ha de ser string)');
      const nom = text(camp(payload, 'display_name') || camp(payload, 'name'), 4000, 'Manca display_name o name (ha de ser string)');
      const email = text(camp(payload, 'email'), 254, 'Manca email (ha de ser string)');
      return Object.freeze({ id: ident, email, name: nom, display_name: nom });
    }
  })
});
