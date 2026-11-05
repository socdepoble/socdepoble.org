#!/usr/bin/env python3
"""Read-only capability probe. Never lists directories or follows symlinks."""
import os
import sys
import json
import stat
import unicodedata

FLAGS = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
ACCOUNT = 'GoogleDrive-socdepoble@socdepoble.org'

def valid(value):
    return (isinstance(value, str) and value.startswith('/') and len(value) <= 4096
            and os.path.normpath(value) == value and '\\' not in value
            and len(value.split('/')) <= 64
            and not any(unicodedata.category(c) in ('Cc', 'Cf') for c in value))

def state(info):
    return (info.st_dev, info.st_ino, info.st_uid, stat.S_IMODE(info.st_mode))

def chain(target, home, uid):
    result = []
    try:
        current = '/'
        descriptor = os.open('/', FLAGS)
        result.append((descriptor, state(os.fstat(descriptor))))
        for part in target.split('/')[1:]:
            child = os.open(part, FLAGS, dir_fd=descriptor)
            result.append((child, state(os.fstat(child))))
            descriptor = child
            current = os.path.join(current, part)
            info = os.fstat(child)
            if not stat.S_ISDIR(info.st_mode):
                raise ValueError()
            personal = current == home or current.startswith(home + '/')
            if personal and (info.st_uid != uid or stat.S_IMODE(info.st_mode) & 0o022):
                raise ValueError()
            if not personal and info.st_uid not in (0, uid):
                raise ValueError()
        return result
    except BaseException:
        for fd, _ in reversed(result):
            os.close(fd)
        raise

def main(request):
    target, home, uid = request.get('target'), request.get('homeDir'), request.get('expectedUid')
    if not valid(target) or not valid(home) or type(uid) is not int or uid < 0:
        return False
    drives = [os.path.join(home, 'Library', 'CloudStorage', ACCOUNT, unit)
              for unit in ('My Drive', 'Mi unidad', 'El meu Drive')]
    staging = os.path.join(home, 'socdepoble-node0', 'mirall-workspace-staging')
    if not (any(target.startswith(drive + '/') for drive in drives) or target == staging):
        return False
    first, second = [], []
    try:
        first = chain(target, home, uid)
        second = chain(target, home, uid)
        return [value for _, value in first] == [value for _, value in second]
    except BaseException:
        return False
    finally:
        for fd, _ in reversed(first + second):
            os.close(fd)

try:
    print(json.dumps({'safe': main(json.load(sys.stdin))}, separators=(',', ':')))
except BaseException:
    print('{"safe":false}')
