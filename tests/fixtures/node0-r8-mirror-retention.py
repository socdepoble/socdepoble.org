"""Ordinary deterministic local fixtures for the frozen mirror candidate."""
import base64
import datetime
import gzip
import importlib.util
import io
import json
from pathlib import Path
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('mirror', Path(__file__).resolve().parents[2] / 'tooling/node0/fitxers-mirall.py')
mirror = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mirror)
UTC = datetime.timezone.utc

class CandidateTests(unittest.TestCase):
    def test_one_twelve_pattern_scanner_and_nested_archives(self):
        self.assertEqual(len(mirror.SECRET_PATTERNS), 12)
        jwt = b'eyJhbGciOiJIUzI1NiJ9.' + base64.urlsafe_b64encode(json.dumps({'role':'service_role'}).encode()).rstrip(b'=') + b'.c3ludGhldGlj'
        # Every value here is structural or a synthetic test-only marker.
        samples = [b'PRIVATE KEY', bytes.fromhex('302e020100300506032b657004220420'), b'SDP_TEST=fixture', b'MASTODON_TEST=fixture', b'SMTP_TEST=fixture', b'PGPASSWORD=fixture', b'TunnelSecret', b'AccountTag', b'AGE-SECRET-KEY-1SYNTHETIC', b'sb_secret_SYNTHETIC', jwt, b'Bearer SYNTHETIC']
        for sample in samples:
            compressed = gzip.compress(sample, mtime=0)
            zipbuf = io.BytesIO()
            with zipfile.ZipFile(zipbuf, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
                archive.writestr('public-fixture.txt.gz', compressed)
            for payload in (sample, compressed, zipbuf.getvalue()):
                with self.assertRaisesRegex(RuntimeError, '^mirror_plaintext_secret_marker$'):
                    mirror.scan(payload)
        mirror.scan(b'{"provenance":{"sourceUrl":"https://example.invalid/public?key=in.(public)"}}')
        harmless = b'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjogImFub24ifQ.c3ludGhldGlj'
        mirror.scan(harmless)

    def test_reviewed_public_implementation_does_not_self_match_structural_literals(self):
        folder = Path(__file__).resolve().parents[2] / 'tooling/node0'
        for name in ('fitxers-mirall.py', 'exporta-mirall-workspace-node0.mjs', 'fonts-publiques-mirall-node0.mjs'):
            mirror.scan((folder / name).read_bytes())

    def test_retention_is_bounded_by_thirty_daily_and_twelve_monthly_slots(self):
        now = datetime.datetime(2026, 11, 4, 20, 20, tzinfo=UTC)
        rows = [('current', now)]
        rows += [('daily-' + str(i), now - datetime.timedelta(days=i)) for i in range(1, 30)]
        rows += [('old-' + str(i), now - datetime.timedelta(days=i)) for i in range(31, 900)]
        keep = mirror.retention_keep(rows, now, 'current')
        self.assertIn('current', keep)
        self.assertLessEqual(len(keep), 42)
        self.assertEqual(sum(name.startswith('daily-') for name in keep), 29)
        self.assertLessEqual(sum(name.startswith('old-') for name in keep), 12)
        for name, date in rows:
            if (now.year-date.year)*12+now.month-date.month > 12:
                self.assertNotIn(name, keep)

    def test_daily_retention_preserves_distinct_days_and_current_over_same_day_runs(self):
        now = datetime.datetime(2026, 11, 4, 20, 20, tzinfo=UTC)
        rows = [('current', now - datetime.timedelta(hours=1))]
        rows += [('same-day-' + str(i), now - datetime.timedelta(minutes=i)) for i in range(80)]
        rows += [('day-' + str(i), now - datetime.timedelta(days=i)) for i in range(1, 30)]
        rows.append(('older-yesterday', now - datetime.timedelta(days=1, hours=1)))
        rows.append(('same-utc-day-offset', datetime.datetime.fromisoformat('2026-11-03T23:30:00-02:00')))
        keep = mirror.retention_keep(rows, now, 'current')
        self.assertEqual(keep, {'current'} | {'day-' + str(i) for i in range(1, 30)})
        self.assertNotIn('older-yesterday', keep)
        self.assertNotIn('same-utc-day-offset', keep)

    def test_authentication_covers_exact_manifest_and_checksums(self):
        auth = (bytes(range(32)), 'synthetic-test')
        manifest = b'{"generation":"synthetic"}\n'
        sums = b'0' * 64 + b'  fixture.txt\n'
        first = mirror.auth_bytes(manifest, sums, auth)
        self.assertNotEqual(first, mirror.auth_bytes(manifest+b' ', sums, auth))
        self.assertNotEqual(first, mirror.auth_bytes(manifest, sums+b' ', auth))
        self.assertNotEqual(first, mirror.auth_bytes(manifest, sums, (bytes(reversed(range(32))), 'synthetic-test')))
        self.assertEqual(json.loads(first)['algorithm'], 'HMAC-SHA256')

if __name__ == '__main__':
    unittest.main()
