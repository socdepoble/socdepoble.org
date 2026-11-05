#!/usr/bin/env python3
"""R7 supplement: exact institutional mirror directory, one dotenv field only."""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import sys
import types

ACCOUNT = 'socdepoble@socdepoble.org'
ACCOUNT_ROOT = 'GoogleDrive-' + ACCOUNT
UNITS = ('My Drive', 'Mi unidad', 'El meu Drive')
APPROVED_UNIT = 'Mi unidad'  # Native parent was verified by the coordinator.
MIRROR = 'Sóc de Poble · Mirall Sobirà Node 0'
FIELD = 'SDP_WORKSPACE_MIRROR_DIR'
KEY_HELPER_SHA = '6bb393dda70a0a3566f22672e32278cd1fb214512bf3bd4c37ed5a6fea84d1d4'
DIR = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW


class Failure(Exception):
    pass


def fail(code):
    raise Failure(code)


def primitives():
    source = Path(__file__).with_name('configura-clau-age-node0.py')
    fd = os.open(source, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    try:
        info = os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or info.st_uid != os.getuid() or info.st_size > 65536:
            fail('cloud_config_helper_unsafe')
        with os.fdopen(os.dup(fd), 'rb') as stream:
            data = stream.read(65537)
    finally:
        os.close(fd)
    # Reviewed PUBLIC source hash, not a digest of env or identity material.
    if hashlib.sha256(data).hexdigest() != KEY_HELPER_SHA:
        fail('cloud_config_helper_pin')
    key = types.ModuleType('pinned_node0_private_env')
    key.__file__ = str(source)
    exec(compile(data, str(source), 'exec'), key.__dict__)
    # Reuse the reviewed quote-aware parser with a private, single-field scope.
    scope = dict(key.__dict__);scope['TARGETS'] = (FIELD,)
    parser = types.FunctionType(key.parse_env.__code__, scope, 'parse_mirror_env')
    return key, key.helper(), parser


def target(home, unit=APPROVED_UNIT):
    if not isinstance(home, str) or not home.startswith('/') or any(part in ('', '.', '..') for part in home.split('/')[1:]) or any(char in home for char in '\\\r\n\0"') or unit not in UNITS:
        fail('cloud_config_path_invalid')
    return home + '/Library/CloudStorage/' + ACCOUNT_ROOT + '/' + unit + '/' + MIRROR


def render(data, path, parser):
    if not isinstance(path, str) or any(char in path for char in '\\\r\n\0"'):
        fail('cloud_config_value_invalid')
    lines, records = parser(data)
    output = [body + ending for body, ending in lines]
    wanted = path.encode('utf-8')
    quoted = json.dumps(path, ensure_ascii=False).encode('utf-8')
    if FIELD in records:
        index, prefix, current, tail, ending = records[FIELD]
        if current != wanted:
            output[index] = prefix + quoted + tail + ending
        return b''.join(output)
    value = b''.join(output)
    newline = b'\r\n' if data.count(b'\r\n') > data.count(b'\n') / 2 else b'\n'
    if value and not value.endswith(b'\n'):
        value += newline
    return value + FIELD.encode() + b'=' + quoted + newline


def configure(home=None, unit=APPROVED_UNIT):
    key, age, parser = primitives()
    home = os.path.expanduser('~') if home is None else home
    mirror_path = target(home, unit)
    held = []
    def hold(fd):
        held.append(fd);return fd
    try:
        homefd = hold(age.open_root(home));age.owned_dir(homefd)
        library = hold(os.open('Library', DIR, dir_fd=homefd))
        cloud = hold(os.open('CloudStorage', DIR, dir_fd=library))
        account = hold(os.open(ACCOUNT_ROOT, DIR, dir_fd=cloud));age.owned_dir(account)
        drive = hold(os.open(unit, DIR, dir_fd=account));age.owned_dir(drive)
        before_account = os.fstat(account)
        config_parent = hold(os.open('.config', DIR, dir_fd=homefd));age.owned_dir(config_parent)
        config = hold(os.open('socdepoble', DIR, dir_fd=config_parent));age.owned_dir(config, private=True)
        def check():
            for parent, name, child in [(homefd, 'Library', library), (library, 'CloudStorage', cloud), (cloud, ACCOUNT_ROOT, account), (account, unit, drive), (homefd, '.config', config_parent), (config_parent, 'socdepoble', config)]:
                age.same_name(parent, name, child)
            age.owned_dir(account);age.owned_dir(drive);age.owned_dir(config, private=True)
        check()
        lock = hold(os.open('.node0-env.lock', os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW | os.O_NONBLOCK, 0o600, dir_fd=config))
        info = os.fstat(lock)
        if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) != 0o600 or info.st_size:
            fail('cloud_config_lock_unsafe')
        try:fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:fail('cloud_config_lock_busy')
        expected, data = key.read_env(config)
        if expected is None:
            fail('cloud_config_existing_env_required')
        parser(data)
        public = key.parse_env(data)[1]
        recipient = public.get('SDP_WORKSPACE_AGE_RECIPIENT', (None, None, b''))[2]
        if not re.fullmatch(rb'age1[0-9a-z]{58}', recipient) or public.get('SDP_WORKSPACE_ACCOUNT', (None, None, b''))[2] != ACCOUNT.encode():
            fail('cloud_config_public_settings_missing')
        check();created = False
        try:os.mkdir(MIRROR, 0o700, dir_fd=drive);created = True
        except FileExistsError:pass
        mirror = hold(os.open(MIRROR, DIR, dir_fd=drive));age.owned_dir(mirror, private=True)
        def check_target():
            check();age.same_name(drive, MIRROR, mirror);age.owned_dir(mirror, private=True)
        check_target()
        updated = render(data, mirror_path, parser)
        changed = key.update_env(age, config, expected, data, updated, check_target)
        after, final = key.read_env(config)
        if final != updated or parser(final)[1][FIELD][2] != mirror_path.encode('utf-8') or key.parse_env(final)[1]['SDP_WORKSPACE_AGE_RECIPIENT'][2] != recipient:
            fail('cloud_config_final_mismatch')
        check_target()
        after_account = os.fstat(account)
        if stat.S_IMODE(before_account.st_mode) != stat.S_IMODE(after_account.st_mode):
            fail('cloud_config_account_mode_changed')
        return {'schema': 'sdp.node0.institutional-mirror-config.v1', 'account': ACCOUNT, 'unit': unit, 'environmentChanged': changed, 'managedFields': [FIELD], 'mirrorDirectoryCreated': created, 'mirrorDirectoryMode': '0700', 'environmentMode': '0600', 'recipientRetained': True, 'accountRootModePreserved': True, 'accountRootCreated': False, 'otherDriveRootsTouched': False, 'privateIdentityRead': False, 'generationPublished': False, 'cloudUploadVerified': False}
    finally:
        for fd in reversed(held):os.close(fd)


if __name__ == '__main__':
    try:
        if sys.argv[1:] not in ([], ['--apply']):fail('cloud_config_arguments_invalid')
        if not sys.argv[1:]:result = {'apply': False, 'account': ACCOUNT, 'approvedUnit': APPROVED_UNIT, 'managedFields': [FIELD], 'target': target(os.path.expanduser('~')), 'otherDriveRootsTouched': False}
        else:primitives()[1].node0_guard();result = configure()
        print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    except BaseException as error:
        print(json.dumps({'ok': False, 'error': str(error) if isinstance(error, Failure) else 'cloud_config_failed'}), file=sys.stderr)
        sys.exit(1)
