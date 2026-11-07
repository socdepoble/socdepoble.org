import contextlib
import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import stat
import tempfile
import unittest
from unittest.mock import patch

WORKER = Path(__file__).resolve().parents[2] / 'tooling/node0/fitxers-mirall.py'
GENERATION = '20261104T212515Z-ef95f03c414aefb7'
SEALED = {
    'generation': GENERATION,
    'manifestSha256': '71fd6fabbedb16df44af41fa942babd9ca02e0759841a416a3f0daac6d837eb9',
    'sumsSha256': '5a9228938f025ed6e2c06d9ab49a55b6dd5752dba7ecba02ed6b4ac62bb8dc5d',
}

def sha(data):
    return hashlib.sha256(data).hexdigest()

def write(path, data):
    path.write_bytes(data)
    path.chmod(0o600)

class CheckpointFunctional(unittest.TestCase):
    def setUp(self):
        spec = importlib.util.spec_from_file_location('checkpoint_fixture_worker', WORKER)
        self.worker = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.worker)
        self.temp = tempfile.TemporaryDirectory(prefix='sdp-r8-checkpoint-')
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name).resolve()
        self.mirror = self.base / 'mirror'
        self.mirror.mkdir(mode=0o700)
        self.generations = self.mirror / 'generacions'
        self.generations.mkdir(mode=0o700)
        self.generation = self.generations / GENERATION
        self.generation.mkdir(mode=0o700)
        for folder in self.worker.FOLDERS:
            (self.generation / folder).mkdir(mode=0o700)
        self.payload = self.generation / self.worker.FOLDERS[0] / 'notice.txt'
        content = b'Synthetic public checkpoint notice.\n'
        write(self.payload, content)
        manifest = {
            'schema': 'sdp.node0.workspace-mirror.v1', 'generation': GENERATION,
            'createdAt': '2026-11-04T21:25:15.000Z', 'folders': list(self.worker.FOLDERS),
            'files': [{'path': self.worker.FOLDERS[0] + '/notice.txt', 'sha256': sha(content), 'bytes': len(content), 'kind': 'public'}],
            # Arbitratge R46, Loop 3 (L2-01) · R42 valida el snapshot del manifest: el de la fixture és el llegat
            # que escrivia l'exportador anterior (pg_dump-transaction, sense ledger capturat).
            'snapshot': {'consistent': 'pg_dump-transaction', 'format': 'pg_dump-custom-gzip-6', 'encryption': 'age-X25519', 'recipientSha256': sha(b'synthetic-recipient'), 'restoreVerified': False},
        }
        manifest_bytes = (json.dumps(manifest, sort_keys=True, separators=(',', ':')) + '\n').encode()
        write(self.generation / 'MANIFEST.json', manifest_bytes)
        entries = {manifest['files'][0]['path']: sha(content), 'MANIFEST.json': sha(manifest_bytes)}
        sums = ''.join(entries[name] + '  ' + name + '\n' for name in sorted(entries)).encode()
        write(self.generation / 'SHA256SUMS', sums)
        self.fixture_checkpoint = {'generation': GENERATION, 'manifestSha256': sha(manifest_bytes), 'sumsSha256': sha(sums)}
        self.pointer = dict({'schema': 'sdp.node0.mirror.current.v1'}, **self.fixture_checkpoint)
        write(self.mirror / 'CURRENT.json', (json.dumps(self.pointer, sort_keys=True, separators=(',', ':')) + '\n').encode())
        write(self.mirror / self.worker.LOCK, b'')
        auth_dir = self.base / 'local-auth'
        auth_dir.mkdir(mode=0o700)
        self.synthetic_key = auth_dir / 'authentication.bin'
        # Fixture material only. The test never reads any key file. All reads
        # occur in the imported worker's existing authentication_key function.
        write(self.synthetic_key, b'S' * 32)
        self.authentication = {'keyFile': str(self.synthetic_key), 'keyId': 'node0-r8-local-1'}
        self.request = {'action': 'bootstrap-r7-authenticity', 'root': str(self.mirror),
                        'authentication': self.authentication, 'operatorApproval': self.worker.R7_BOOTSTRAP_APPROVAL}

    @contextlib.contextmanager
    def synthetic_commitment(self):
        # Only the imported isolated Python module is patched. No request/env
        # override exists in the worker protocol. Actual production commitments
        # are tested separately and must reject this synthetic tree.
        with patch.object(self.worker, 'R7_SEALED_CHECKPOINT', self.fixture_checkpoint):
            yield

    def bootstrap(self):
        with self.synthetic_commitment():
            return self.worker.main(self.request)

    def auth_absent(self):
        self.assertFalse((self.generation / 'AUTHENTICITY.json').exists())

    def test_real_sealed_constants_reject_synthetic_fixture(self):
        self.assertEqual(self.worker.R7_SEALED_CHECKPOINT, SEALED)
        with self.assertRaisesRegex(RuntimeError, 'mirror_checkpoint_pin_mismatch'):
            self.worker.main(self.request)
        self.auth_absent()

    def test_explicit_confirmation_and_no_commitment_override(self):
        for request in [dict(self.request, operatorApproval=''), dict(self.request, expectedManifestSha256=self.fixture_checkpoint['manifestSha256'])]:
            with self.synthetic_commitment(), self.assertRaisesRegex(RuntimeError, 'mirror_checkpoint_approval_required'):
                self.worker.main(request)
        self.auth_absent()

    def test_unsigned_ordinary_inspect_stays_closed_even_for_fixture_commitment(self):
        with self.synthetic_commitment(), self.assertRaises(FileNotFoundError):
            self.worker.main({'action': 'inspect', 'root': str(self.mirror), 'authentication': self.authentication})
        self.auth_absent()

    def test_sealed_fixture_adds_only_authenticity_then_normal_inspect_and_no_overwrite(self):
        before = {name: (self.generation / name).read_bytes() for name in ('MANIFEST.json', 'SHA256SUMS')}
        pointer = (self.mirror / 'CURRENT.json').read_bytes()
        result = self.bootstrap()
        self.assertTrue(result['bootstrapped'])
        self.assertTrue(result['authenticationVerified'])
        for field in ('newGeneration', 'manifestChanged', 'sumsChanged', 'currentChanged'):
            self.assertFalse(result[field])
        self.assertEqual(result['generation'], GENERATION)
        for name, payload in before.items():
            self.assertEqual((self.generation / name).read_bytes(), payload)
        self.assertEqual((self.mirror / 'CURRENT.json').read_bytes(), pointer)
        auth_info = (self.generation / 'AUTHENTICITY.json').stat()
        self.assertEqual(stat.S_IMODE(auth_info.st_mode), 0o600)
        self.assertEqual(auth_info.st_nlink, 1)
        self.assertEqual(self.worker.main({'action': 'inspect', 'root': str(self.mirror), 'authentication': self.authentication})['generation'], GENERATION)
        with self.assertRaisesRegex(RuntimeError, 'mirror_checkpoint_already_authenticated'):
            self.bootstrap()
        after_info = (self.generation / 'AUTHENTICITY.json').stat()
        self.assertEqual((after_info.st_ino, after_info.st_size, after_info.st_mtime_ns), (auth_info.st_ino, auth_info.st_size, auth_info.st_mtime_ns))

    def test_changed_payload_is_rejected_before_authentication_file(self):
        write(self.payload, b'Changed synthetic notice.\n')
        with self.assertRaisesRegex(RuntimeError, 'mirror_content_integrity'):
            self.bootstrap()
        self.auth_absent()

    def test_inventory_rejects_an_unlisted_empty_directory(self):
        (self.generation / self.worker.FOLDERS[0] / 'unlisted').mkdir(mode=0o700)
        with self.assertRaisesRegex(RuntimeError, 'mirror_inventory_integrity'):
            self.bootstrap()
        self.auth_absent()

    def test_lock_is_required_and_existing_lock_permissions_are_checked(self):
        (self.mirror / self.worker.LOCK).unlink()
        with self.assertRaisesRegex(RuntimeError, 'mirror_checkpoint_lock_required'):
            self.bootstrap()
        write(self.mirror / self.worker.LOCK, b'')
        (self.mirror / self.worker.LOCK).chmod(0o644)
        with self.assertRaisesRegex(RuntimeError, 'mirror_root_file_unsafe'):
            self.bootstrap()
        self.auth_absent()

    def test_active_flock_is_respected(self):
        descriptor = os.open(self.mirror / self.worker.LOCK, os.O_RDWR)
        try:
            fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
            with self.assertRaisesRegex(RuntimeError, 'mirror_export_busy'):
                self.bootstrap()
        finally:
            os.close(descriptor)
        self.auth_absent()

    def mutate_before_key(self, mutation, error):
        original = self.worker.authentication_key
        def before(config, mirror):
            mutation()
            return original(config, mirror)
        with patch.object(self.worker, 'authentication_key', before), self.assertRaisesRegex(RuntimeError, error):
            self.bootstrap()
        self.auth_absent()

    def test_current_cas_detects_same_pointer_bytes_with_changed_serialization(self):
        self.mutate_before_key(lambda: write(self.mirror / 'CURRENT.json', (self.mirror / 'CURRENT.json').read_bytes() + b'\n'), 'mirror_current_drift')

    def test_tree_drift_during_validation_is_rejected(self):
        self.mutate_before_key(lambda: write(self.payload, b'Changed after scan.\n'), 'mirror_checkpoint_tree_drift')

    def test_lock_inode_replacement_is_rejected(self):
        def mutation():
            (self.mirror / self.worker.LOCK).rename(self.mirror / 'previous-lock')
            write(self.mirror / self.worker.LOCK, b'')
        self.mutate_before_key(mutation, 'mirror_lock_drift')

    def test_named_root_replacement_is_rejected(self):
        old_root = self.base / 'previous-mirror'
        def mutation():
            self.mirror.rename(old_root)
            self.mirror.mkdir(mode=0o700)
        original = self.worker.authentication_key
        def before(config, mirror):
            mutation()
            return original(config, mirror)
        with patch.object(self.worker, 'authentication_key', before), self.assertRaisesRegex(RuntimeError, 'mirror_root_drift'):
            self.bootstrap()
        self.assertFalse((old_root / 'generacions' / GENERATION / 'AUTHENTICITY.json').exists())

    def test_named_generation_replacement_is_rejected(self):
        old_generation = self.generations / 'previous-generation'
        def mutation():
            self.generation.rename(old_generation)
            self.generation.mkdir(mode=0o700)
        original = self.worker.authentication_key
        def before(config, mirror):
            mutation()
            return original(config, mirror)
        with patch.object(self.worker, 'authentication_key', before), self.assertRaisesRegex(RuntimeError, 'mirror_checkpoint_generation_drift'):
            self.bootstrap()
        self.assertFalse((old_generation / 'AUTHENTICITY.json').exists())

    def test_key_size_is_exactly_32_bytes(self):
        write(self.synthetic_key, b'S' * 33)
        with self.assertRaisesRegex(RuntimeError, 'mirror_authentication_invalid'):
            self.bootstrap()
        self.auth_absent()

    def test_final_normal_inspect_rejects_postwrite_content_drift(self):
        original = self.worker.fresh
        def changed(root, name, data):
            original(root, name, data)
            if name == 'AUTHENTICITY.json':
                write(self.payload, b'Late synthetic content change.\n')
        with patch.object(self.worker, 'fresh', changed), self.assertRaisesRegex(RuntimeError, 'mirror_content_integrity'):
            self.bootstrap()
        with self.assertRaisesRegex(RuntimeError, 'mirror_content_integrity'):
            self.worker.main({'action': 'inspect', 'root': str(self.mirror), 'authentication': self.authentication})

if __name__ == '__main__':
    unittest.main(verbosity=2)
