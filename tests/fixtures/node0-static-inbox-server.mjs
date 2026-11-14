/** Test-only launcher: real handler, ephemeral loopback, isolated generated key. */
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const base=process.env.SDP_NODE_BASE_DIR;
if(!process.send||process.env.SDP_NODE0_TEST_STATIC_FIXTURE!=='1'||process.env.SDP_NODE_PORT!=='0'||!base||!path.basename(base).startsWith('sdp-node0-static-r9-')||fs.realpathSync(path.dirname(base))!==fs.realpathSync(os.tmpdir()))throw Error('static_fixture_required');
const listen=http.Server.prototype.listen;
http.Server.prototype.listen=function(port,host,callback){
 // Onada R22 (eixa42): el servidor escolta per defecte només a loopback; 0.0.0.0 tornaria a obrir-lo a la xarxa local.
 if(port!==0||host!=='127.0.0.1')throw Error('static_fixture_binding_changed');
 const server=this;
 process.once('message',message=>{if(message==='stop')server.close(()=>process.disconnect());});
 return listen.call(server,0,'127.0.0.1',()=>{callback?.();process.send({port:server.address().port});});
};
await import('../../scripts/node0/servidorNodePoble.mjs');
