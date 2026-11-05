"""Portable synthetic R9 scope/CAS checks. No historical kits or network."""
import hashlib,importlib.util,io,json,os,stat,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'tooling/node0/verifica_kit_node0_r9.py'
spec=importlib.util.spec_from_file_location('r9_verifier',SOURCE);v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
EXTRAS=('tooling/tests/node-suite-manifest.json','_wiki_de_poble/02_saber/00_index_maquina.md','_wiki_de_poble/02_saber/architecture/api_port_neutral_i_allotjament_model_b.md','public/rag-index.json','package.json','.gitignore','tooling/tests/run-node-tests.mjs','tooling/gates/literals-secrets-node0.mjs','tooling/seo/build-social-manifest.test.mjs','tooling/seo/projeccio-publica.test.mjs','tooling/seo/publicacions-federades.test.mjs','tooling/vite/instantania-consola.test.mjs','scripts/node0/servidorNodePoble.mjs')
sha=lambda b:hashlib.sha256(b).hexdigest()
class ScopeTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory(prefix='sdp-r9-verifier-scope-');self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name).resolve();self.counter=0
 def make(self,names,new=False):
  self.counter+=1;kit=self.root/('kit'+str(self.counter));target=self.root/('target'+str(self.counter));kit.mkdir();target.mkdir();rows=[]
  for name in names:
   before=b'TEST_ONLY_BEFORE:'+name.encode();after=b'TEST_ONLY_AFTER:'+name.encode();row={'path':name,'before':None if new else {'sha256':sha(before),'mode':0o600},'after':{'sha256':sha(after),'mode':0o644}};rows.append(row)
   for prefix,data,mode in [('fitxers',after,0o644)]+([] if new else [('preimatges',before,0o600)]):
    out=kit/prefix/name;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(data);out.chmod(mode)
   if not new:
    out=target/name;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(before);out.chmod(0o600)
  (kit/'MANIFEST.json').write_text(json.dumps({'schema':'sdp.node0.cas.v1','name':'TEST_ONLY_R9','files':rows}))
  (kit/'README_INTEGRACIO.md').write_text('Synthetic local scope fixture.\n');(kit/'verifica_i_aplica.py').write_bytes(SOURCE.read_bytes());(kit/'verifica_i_aplica.py').chmod(0o755)
  sums=''.join(sha(p.read_bytes())+'  '+str(p.relative_to(kit))+'\n' for p in sorted(kit.rglob('*')) if p.is_file());(kit/'SHA256SUMS').write_text(sums)
  return kit,target,rows
 def test_scope_fork_is_only_one_exact_static_path(self):
  old=(ROOT/'tooling/node0/verifica_kit_node0_r8.py').read_bytes();self.assertEqual(sha(old),'48cc1e94ed23166ceab96ad98681613bef950c72aa75daf64a56edb4029967f8')
  needle="    'tooling/vite/instantania-consola.test.mjs',\n"
  expected=old.decode().replace(needle,needle+"    'scripts/node0/servidorNodePoble.mjs',\n")
  self.assertEqual(SOURCE.read_text(),expected);self.assertEqual(v.EXTRA_TARGETS_R8,frozenset(EXTRAS))
 def test_explicit_extras_dry_apply_repeat_and_rollback(self):
  kit,target,rows=self.make(EXTRAS)
  self.assertFalse(v.run(kit,target)['write'])
  self.assertFalse(v.run(kit,target,True)['already_applied']);self.assertTrue(v.run(kit,target,True)['already_applied'])
  for row in rows:self.assertEqual((target/row['path']).read_bytes(),b'TEST_ONLY_AFTER:'+row['path'].encode())
  self.assertFalse(v.run(kit,target,False,True)['write']);v.run(kit,target,True,True);self.assertTrue(v.run(kit,target,True,True)['already_applied'])
  for row in rows:self.assertEqual((target/row['path']).read_bytes(),b'TEST_ONLY_BEFORE:'+row['path'].encode());self.assertEqual(stat.S_IMODE((target/row['path']).stat().st_mode),0o600)
  self.assertFalse((target/v.LOCK).exists())
 def test_original_scopes_and_new_file_rollback_remain_supported(self):
  kit,target,rows=self.make(('src/test-only.mjs','tests/test-only.mjs','tooling/node0/test-only.mjs'),new=True);v.run(kit,target,True);v.run(kit,target,True,True)
  for row in rows:self.assertFalse((target/row['path']).exists())
 def test_protected_and_unlisted_neighbor_paths_refused_without_target_changes(self):
  names=('.agents/ESTAT.md','.git/config','_wiki_de_poble/04_escriptori/test.md','_wiki_de_poble/02_saber/not-approved.md','public/rag/not-approved.json','public/rag-index-other.json','package-lock.json','tooling/gates/not-approved.mjs','tooling/tests/not-approved.mjs','tooling/seo/not-approved.mjs','tooling/vite/not-approved.mjs','scripts/node0/not-approved.mjs','scripts/node0/servidorNodePoble.mjs/child','scripts/not-approved.mjs')
  for name in names:
   kit,target,rows=self.make((name,));before=(target/name).read_bytes()
   with self.assertRaises((v.Refusal,OSError)):v.run(kit,target,True)
   self.assertEqual((target/name).read_bytes(),before);self.assertFalse((target/v.LOCK).exists())
 def test_invalid_relative_paths_refused(self):
  for name in ('../package.json','/package.json','tooling/node0/../x','src/.env','src/.git/config','src/x\\y','src/X\u202e'):
   with self.assertRaises(v.Refusal):v.relative(name)
 def test_cas_drift_refused(self):
  kit,target,_=self.make(('package.json',));(target/'package.json').write_bytes(b'TEST_ONLY_INDEPENDENT_CHANGE')
  with self.assertRaisesRegex(v.Refusal,'cas_drift'):v.run(kit,target,True)
  self.assertEqual((target/'package.json').read_bytes(),b'TEST_ONLY_INDEPENDENT_CHANGE')
 def test_tampered_payload_refused(self):
  kit,target,_=self.make(('public/rag-index.json',));before=(target/'public/rag-index.json').read_bytes();(kit/'fitxers/public/rag-index.json').write_bytes(b'TEST_ONLY_CORRUPTED')
  with self.assertRaisesRegex(v.Refusal,'kit_integrity'):v.run(kit,target,True)
  self.assertEqual((target/'public/rag-index.json').read_bytes(),before)
 def test_exact_static_script_new_file_dry_apply_repeat_rollback(self):
  name='scripts/node0/servidorNodePoble.mjs';kit,target,_=self.make((name,),new=True)
  self.assertFalse(v.run(kit,target)['write']);self.assertFalse((target/name).exists())
  v.run(kit,target,True);self.assertEqual((target/name).read_bytes(),b'TEST_ONLY_AFTER:'+name.encode());self.assertTrue(v.run(kit,target,True)['already_applied'])
  self.assertFalse(v.run(kit,target,False,True)['write']);v.run(kit,target,True,True);self.assertFalse((target/name).exists());self.assertFalse((target/v.LOCK).exists())
if __name__=='__main__':
 stream=io.StringIO();result=unittest.TextTestRunner(stream=stream).run(unittest.defaultTestLoader.loadTestsFromTestCase(ScopeTests))
 if not result.wasSuccessful():print(stream.getvalue(),file=__import__('sys').stderr)
 print(json.dumps({'passed':result.testsRun-len(result.failures)-len(result.errors),'failed':len(result.failures)+len(result.errors),'skipped':len(result.skipped)}));raise SystemExit(0 if result.wasSuccessful() else 1)
