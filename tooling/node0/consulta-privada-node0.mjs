/** Private request values use PostgreSQL17 extended Bind, not SQL literals.
 * sqlText's exact generated fragments are replaced before the server sees SQL.
 * A transaction-local parameter array lets existing fixed DO/RLS statements
 * access bound values without interpolating values into PL/pgSQL source.
 * This compiler accepts trusted server-generated SQL only, never HTTP SQL.
 */
import {inspect} from 'node:util';
export const POLITICA_LOG_PRIVAT_NODE0=Object.freeze({
  log_parameter_max_length:'0',log_parameter_max_length_on_error:'0',
  log_statement:'none',log_min_error_statement:'panic',log_min_messages:'fatal',
  log_min_duration_statement:'-1',log_min_duration_sample:'-1',log_statement_sample_rate:'0',
  log_transaction_sample_rate:'0',log_duration:'off',debug_print_parse:'off',debug_print_plan:'off',debug_print_rewritten:'off'
});
const fail=()=>{throw new TypeError('node0_private_query_invalid');};
const MARKER=/convert_from\(decode\('([A-Za-z0-9+/]*={0,2})','base64'\),'UTF8'\)/g;
const PRECHECK=`DO $node0_private_logs$ BEGIN IF current_user <> 'node0_authenticator' OR ${Object.entries(POLITICA_LOG_PRIVAT_NODE0).map(([key,value])=>`current_setting('${key}') IS DISTINCT FROM '${value}'`).join(' OR ')} THEN RAISE EXCEPTION 'node0_private_logging_policy_required' USING ERRCODE='42501'; END IF; END $node0_private_logs$;`;
export function preparaConsultaPrivadaNodeZero(input){
  if(typeof input!=='string'||!input.trim()||Buffer.byteLength(input)>4*1024*1024||input.includes('\0'))fail();
  let sql=input.trim();
  // Fixed backend compiler owns this outer transaction. Do not nest it: the
  // local parameter setting and all RLS context/business statements share it.
  if(sql.startsWith('BEGIN;')&&sql.endsWith('COMMIT;'))sql=sql.slice(6,-7).trim();
  const values=[];let total=0;
  sql=sql.replace(MARKER,(_match,encoded)=>{
    const bytes=Buffer.from(encoded,'base64');if(bytes.toString('base64')!==encoded||values.length>=10000||(total+=bytes.length)>2*1024*1024)fail();
    let value;try{value=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{fail();}
    if(value.includes('\0'))fail();const index=values.push(value)-1;
    return `((current_setting('node0.private_parameters')::jsonb)->>${index})`;
  });
  // Only base64's fixed ASCII alphabet reaches a psql meta-command argument.
  // No quotes, backslashes, newline, variable substitution or command text can
  // originate in a bound value. \bind uses the extended query protocol.
  const encoded=Buffer.from(JSON.stringify(values),'utf8').toString('base64');
  const script=`${PRECHECK}\nBEGIN;\nWITH bound AS MATERIALIZED (SELECT set_config('node0.private_parameters',convert_from(decode($1,'base64'),'UTF8'),true)) SELECT 1 AS installed FROM bound \\bind '${encoded}' \\gset node0_internal_\n${sql}\nCOMMIT;\n`;
  const safe={schema:'sdp.node0.private-bind.v1',parameterCount:values.length};
  return Object.freeze({sql,script,parameterCount:values.length,toJSON:()=>safe,[inspect.custom]:()=>safe});
}
