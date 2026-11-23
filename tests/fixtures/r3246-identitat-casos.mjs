/** Identitats i recursos sintètics: no són comptes ni dades de producció. */
import { readFileSync } from 'node:fs';
export const uuidIdentitat = n => `46030000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export const PERSONES = Object.freeze({ propietaria: uuidIdentitat(1), administradora: uuidIdentitat(2), membre: uuidIdentitat(3), revisora: uuidIdentitat(4) });
export const POBLE = uuidIdentitat(99);
export const ALTRE_POBLE = uuidIdentitat(100);
export const ENTITAT = uuidIdentitat(200);
export const ALTRA_ENTITAT = uuidIdentitat(201);
export const DOMINI = 'r3246-ajuntament.example';
export const CORREUS = Object.freeze({
  propietaria: `secretaria@${DOMINI}`,
  administradora: 'administradora-c3@example.invalid',
  membre: 'membre-c3@example.invalid',
  revisora: 'revisora-c3@example.invalid',
  corporatiu: 'corporatiu-c3@example.invalid'
});
export const EVIDENCIA = 'Evidència sintètica C3: revisió institucional local en una base efímera de proves.';
export const TELEFONS_CANARI = Object.freeze(Object.fromEntries(Object.keys(PERSONES).map(name => [name, `TEL_CANARI_C3_${name.toUpperCase()}_NO_REAL`])));
export const DATA_REGISTRE = '2026-11-23T00:00:00.000Z';
export const DATA_ENTRADA = '2026-11-23T00:01:00.000Z';

/** Extensió del substitut Auth efímer, no del producte. Camps i tipus
 * adjudicats per root després del 42703; cap data ni privilegi per defecte.
 * No toca el helper comú reservat a root i admet que ja els haja afegit. */
async function compatibilitzaAuthIdentitat(pg) {
  const columns = [];
  for (const name of ['created_at', 'last_sign_in_at']) {
    const before = (await pg.query("SELECT format_type(atttypid,atttypmod) AS type,attnotnull AS notnull FROM pg_attribute WHERE attrelid='auth.users'::regclass AND attname=$1 AND attnum>0 AND NOT attisdropped", [name])).rows;
    if (before.length && (before[0].type !== 'timestamp with time zone' || before[0].notnull)) throw new Error('Substitut Auth incompatible amb la fixture adjudicada.');
    if (!before.length) {
      if (name === 'created_at') await pg.exec('ALTER TABLE auth.users ADD COLUMN created_at timestamptz');
      else await pg.exec('ALTER TABLE auth.users ADD COLUMN last_sign_in_at timestamptz');
    }
    columns.push({ name, type: 'timestamptz', nullable: true, added: !before.length, default: null });
  }
  return { scope: 'ephemeral-auth-substitute-only', source: 'identity-fixture', columns, productionSchemaChanged: false };
}

export async function sembraIdentitatsR3246(pg) {
  const compatibilityShim = await compatibilitzaAuthIdentitat(pg);
  const official = (await pg.query("SELECT nom FROM private.ajuntament_municipis_ine WHERE ine='03132'")).rows;
  if (official.length !== 1) throw new Error('La hidratació real no conté el registre INE de la fixture.');
  await pg.query("INSERT INTO public.towns(id,slug,name) VALUES($1,'r3246-municipi-ine-03132',$2)", [POBLE, official[0].nom]);
  await pg.query("INSERT INTO public.towns(id,slug,name) VALUES($1,'r3246-segon-poble-sintetic','Poble sintètic C3 de permisos')", [ALTRE_POBLE]);
  // La sembra la fa el SQL canònic real després d'afegir el poble, no una
  // còpia de DDL ni una organització inventada per la fixture.
  await pg.exec(readFileSync(new URL('../../supabase/migrations/20261122160000_r3242_ajuntament_acreditacio_institucional.sql', import.meta.url), 'utf8'));
  for (const [name, id] of Object.entries(PERSONES)) {
    await pg.query('INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data,created_at,last_sign_in_at) VALUES($1,$2,now(),$3,$4,$5)',
      [id, CORREUS[name], { full_name: `Persona sintètica C3 ${name}`, tenant_id: POBLE, accepta_rgpd: true, telefon: TELEFONS_CANARI[name] }, DATA_REGISTRE, DATA_ENTRADA]);
    for (const townId of [POBLE, ALTRE_POBLE]) await pg.query('INSERT INTO public.town_memberships(town_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [townId, id]);
    await pg.query('INSERT INTO private.normes_acceptades(usuari_id,versio) VALUES($1,private.versio_normes_vigent()) ON CONFLICT DO NOTHING', [id]);
  }
  for (const [org, owner, slug] of [[ENTITAT, PERSONES.propietaria, 'r3246-entitat'], [ALTRA_ENTITAT, PERSONES.membre, 'r3246-altra-entitat']]) {
    await pg.query("INSERT INTO public.organizations(id,tenant_id,slug,name,kind,created_by) VALUES($1,$2,$3,'Entitat sintètica C3','entity',$4)", [org, POBLE, slug, owner]);
    await pg.query("INSERT INTO public.organization_memberships(organization_id,tenant_id,user_id,role) VALUES($1,$2,$3,'owner') ON CONFLICT DO NOTHING", [org, POBLE, owner]);
  }
  await pg.query("INSERT INTO public.organization_memberships(organization_id,tenant_id,user_id,role) VALUES($1,$2,$3,'admin'),($1,$2,$4,'member')", [ENTITAT, POBLE, PERSONES.administradora, PERSONES.membre]);
  await pg.query("INSERT INTO public.user_platform_roles(user_id,role) VALUES($1,'superadmin') ON CONFLICT(user_id) DO UPDATE SET role='superadmin'", [PERSONES.revisora]);
  await pg.query('UPDATE public.organizations SET contact_email=$2,public_email=false WHERE id=$1', [ENTITAT, CORREUS.corporatiu]);
  const halls = await pg.query("SELECT id,claimed FROM public.organizations WHERE tenant_id=$1 AND kind='city_hall' AND municipi_ine IS NOT NULL", [POBLE]);
  if (halls.rows.length !== 1 || halls.rows[0].claimed !== false) throw new Error('Cal l’ajuntament INE real sembrat i encara no acreditat.');
  return { ajuntament: halls.rows[0].id, compatibilityShim };
}
