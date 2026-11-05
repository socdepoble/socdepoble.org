"""Synthetic local filesystem fixtures; no installed keys, crypto CLI or Drive."""
import fcntl
import importlib.util
import os
from pathlib import Path
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[2]/'tooling/node0'
def load(name):
    spec=importlib.util.spec_from_file_location(name,ROOT/(name+'.py'))
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
m=load('configura-clau-age-node0')

def recipient():
    alphabet='qpzry9x8gf2tvdw0s3jn54khce6mua7l';values=[0]*52;chk=1
    for v in [3,3,3,0,1,7,5]+values+[0]*6:
        top=chk>>25;chk=((chk&0x1ffffff)<<5)^v
        for i,g in enumerate((0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3)):
            if (top>>i)&1:chk^=g
    chk^=1
    return 'age1'+''.join(alphabet[v] for v in values)+''.join(alphabet[(chk>>(5*(5-i)))&31] for i in range(6))
PUBLIC=recipient()

class PublicRecipientTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='sdp-public-recipient-');self.addCleanup(self.temp.cleanup)
        self.home=Path(self.temp.name).resolve();self.home.chmod(0o700)
    def config(self):
        d=self.home/'.config/socdepoble';d.mkdir(parents=True);d.chmod(0o700)
        (d/'node0.env').write_bytes(b'# TEST_ONLY\nOPAQUE="synthetic-preserved#value"\n');(d/'node0.env').chmod(0o600)
        return d
    def test_plan_and_invalid_recipient_are_inert(self):
        self.assertFalse(m.plan()['privateIdentityGenerated'])
        for value in (None,'not-public',PUBLIC+'\n',PUBLIC[:-1]+'q'):
            with self.assertRaises(m.Failure):m.configure(str(self.home),recipient=value)
        self.assertEqual(list(self.home.iterdir()),[])
    def test_only_public_recipient_is_written_and_repeat_is_idempotent(self):
        d=self.config();first=m.configure(str(self.home),PUBLIC);second=m.configure(str(self.home),PUBLIC)
        self.assertTrue(first['environmentChanged']);self.assertFalse(second['environmentChanged'])
        self.assertFalse((d/m.KEY).exists());self.assertFalse(first['privateIdentityGenerated']);self.assertFalse(first['privateIdentityRead'])
        self.assertFalse(first['externalCustodyVerified']);self.assertFalse(first['r5CustodyClosed'])
        self.assertTrue((d/'node0.env').read_bytes().startswith(b'# TEST_ONLY\nOPAQUE="synthetic-preserved#value"\n'))
    def test_legacy_identity_is_metadata_only_and_never_opened_modified_or_removed(self):
        d=self.config();legacy=d/m.KEY;legacy.write_bytes(b'TEST_ONLY_OPAQUE_NOT_A_KEY');legacy.chmod(0o600);before=legacy.stat()
        real_open=os.open
        def no_identity_open(file,*args,**kwargs):
            if str(file)==m.KEY or str(file).endswith('/'+m.KEY):raise AssertionError('identity open forbidden')
            return real_open(file,*args,**kwargs)
        os.open=no_identity_open
        try:result=m.configure(str(self.home),PUBLIC)
        finally:os.open=real_open
        after=legacy.stat();self.assertEqual((before.st_ino,before.st_size,before.st_mtime_ns),(after.st_ino,after.st_size,after.st_mtime_ns))
        self.assertTrue(result['legacyLocalIdentityPresent']);self.assertFalse(result['r5CustodyClosed'])
    def test_public_config_has_no_private_identity_generation_entrypoint(self):
        self.assertFalse(hasattr(m,'open_key'));self.assertFalse(hasattr(m,'actual_key_canary'))
    def test_lock_and_unsafe_env_still_fail_closed(self):
        d=self.config();fd=os.open(d/'.node0-env.lock',os.O_RDWR|os.O_CREAT,0o600);fcntl.flock(fd,fcntl.LOCK_EX|fcntl.LOCK_NB)
        try:
            with self.assertRaisesRegex(m.Failure,'lock_busy'):m.configure(str(self.home),PUBLIC)
        finally:os.close(fd)
        (d/'node0.env').chmod(0o644)
        with self.assertRaises(m.Failure):m.configure(str(self.home),PUBLIC)
        self.assertFalse((d/m.KEY).exists())
    def test_quote_parser_and_public_recipient_checksum_remain_strict(self):
        data=b'OPAQUE="first\nSDP_WORKSPACE_ACCOUNT=inside-value\nlast"\n'
        output=m.render_env(data,PUBLIC);self.assertTrue(output.startswith(data));self.assertEqual(m.render_env(output,PUBLIC),output)
        with self.assertRaises(m.Failure):m.render_env(b'SDP_WORKSPACE_ACCOUNT=a\nSDP_WORKSPACE_ACCOUNT=b\n',PUBLIC)
    def test_institutional_public_helper_pin_loads_updated_source_only(self):
        module=load('configura-mirall-institucional-node0');key,age,parser=module.primitives()
        self.assertEqual(key.KEY,m.KEY);self.assertEqual(parser(b'SDP_WORKSPACE_MIRROR_DIR=synthetic\n')[1]['SDP_WORKSPACE_MIRROR_DIR'][2],b'synthetic')

if __name__=='__main__':
    import io,json
    suite=unittest.defaultTestLoader.loadTestsFromTestCase(PublicRecipientTests)
    result=unittest.TextTestRunner(stream=io.StringIO()).run(suite)
    print(json.dumps({'passed':result.testsRun-len(result.failures)-len(result.errors),'failed':len(result.failures)+len(result.errors),'skipped':len(result.skipped)}))
    raise SystemExit(0 if result.wasSuccessful() else 1)
