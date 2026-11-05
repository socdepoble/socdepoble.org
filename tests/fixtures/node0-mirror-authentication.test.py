import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest

source = Path(__file__).resolve().parents[2] / 'tooling/node0/provisiona-autenticitat-mirall-node0.py'
spec = importlib.util.spec_from_file_location('public_program', source)
program = importlib.util.module_from_spec(spec)
spec.loader.exec_module(program)


class Provision(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='sdp-r8-hmac-provision-')
        self.addCleanup(self.temp.cleanup)
        self.home = Path(self.temp.name).resolve()
        self.config = self.home / '.config/socdepoble'
        self.config.mkdir(parents=True, mode=0o700)

    def test_atomic_provision_and_metadata_only_repeat(self):
        first = program.provision(str(self.home))
        key = self.config / program.KEY
        self.assertTrue(first['created'])
        self.assertFalse(first['secretRead'])
        before = key.stat()
        self.assertEqual(before.st_size, 32)
        self.assertEqual(before.st_mode & 0o777, 0o600)
        second = program.provision(str(self.home))
        self.assertFalse(second['created'])
        self.assertEqual(key.stat().st_ino, before.st_ino)
        self.assertEqual(key.stat().st_mtime_ns, before.st_mtime_ns)
        self.assertFalse(any(p.name.endswith('.tmp') for p in self.config.iterdir()))

    def test_unsafe_existing_key_and_directory_fail_without_replacement(self):
        key = self.config / program.KEY
        key.write_bytes(b'TEST_ONLY_BAD_SHORT')
        key.chmod(0o600)
        inode = key.stat().st_ino
        with self.assertRaises(RuntimeError):
            program.provision(str(self.home))
        self.assertEqual(key.stat().st_ino, inode)
        key.unlink()
        self.config.chmod(0o755)
        with self.assertRaises(RuntimeError):
            program.provision(str(self.home))
        self.assertFalse(key.exists())

    def test_linked_key_and_parent_symlink_fail(self):
        target = self.home / 'synthetic.bin'
        target.write_bytes(bytes(32))
        target.chmod(0o600)
        key = self.config / program.KEY
        key.symlink_to(target)
        with self.assertRaises(RuntimeError):
            program.provision(str(self.home))
        key.unlink()
        os.link(target, key)
        with self.assertRaises(RuntimeError):
            program.provision(str(self.home))
        key.unlink()
        self.config.rename(self.config.with_name('synthetic-saved'))
        self.config.symlink_to(self.home, target_is_directory=True)
        with self.assertRaises(OSError):
            program.provision(str(self.home))


if __name__ == '__main__':
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(Provision)
    result = unittest.TestResult()
    suite.run(result)
    print(json.dumps({'passed': result.testsRun - len(result.failures) - len(result.errors), 'failed': len(result.failures) + len(result.errors), 'secretPrinted': False}))
    if not result.wasSuccessful():
        import sys
        for case, detail in result.failures + result.errors:
            print(case.id() + ': ' + detail, file=sys.stderr)
        raise SystemExit(1)
