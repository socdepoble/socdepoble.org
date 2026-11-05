#!/usr/bin/env python3
"""Node0 operator only. Secret values arrive on stdin, never argv or stdout."""
import json,os,pwd,re,secrets,stat,sys

def run():
    if sys.platform!='darwin' or pwd.getpwuid(os.getuid()).pw_name!='javi':raise RuntimeError()
    values=json.loads(sys.stdin.readline(8192))
    allowed={'MASTODON_ACCESS_TOKEN','SDP_MASTODON_ACCESS_TOKEN','MASTODON_CLIENT_ID','MASTODON_CLIENT_SECRET'}
    if not isinstance(values,dict) or set(values)!=allowed or values['MASTODON_ACCESS_TOKEN']!=values['SDP_MASTODON_ACCESS_TOKEN']:raise RuntimeError()
    if any(not isinstance(v,str) or not re.fullmatch('[A-Za-z0-9_-]{16,512}',v) for v in values.values()):raise RuntimeError()
    flags=os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW
    parent=os.open('/',flags)
    try:
        for part in ('Users','javi','.config','socdepoble'):
            child=os.open(part,flags,dir_fd=parent);os.close(parent);parent=child
        if os.fstat(parent).st_uid!=os.getuid():raise RuntimeError()
        os.fchmod(parent,0o700)
        lock=os.open('.node0-oauth.lock',os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600,dir_fd=parent)
        lock_info=os.fstat(lock);temp=None;original=None
        try:
            fd=os.open('node0.env',os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK,dir_fd=parent)
            try:
                original=os.fstat(fd)
                if not stat.S_ISREG(original.st_mode) or original.st_nlink!=1 or original.st_uid!=os.getuid() or original.st_mode&0o077 or original.st_size>65536:raise RuntimeError()
                before=os.read(fd,65537)
            finally:os.close(fd)
            text=before.decode('utf-8');ending='\r\n' if '\r\n' in text else '\n';lines=[];seen=set()
            for line in text.splitlines(keepends=True):
                match=re.match(r'^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=',line)
                key=match.group(1) if match else None
                if key in allowed:
                    if key not in seen:lines.append(key+"='"+values[key]+"'"+ending);seen.add(key)
                else:lines.append(line)
            if lines and not lines[-1].endswith(('\n','\r')):lines[-1]+=ending
            for key in sorted(allowed-seen):lines.append(key+"='"+values[key]+"'"+ending)
            after=''.join(lines).encode('utf-8');temp='.node0-oauth-'+secrets.token_hex(12)+'.tmp'
            out=os.open(temp,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600,dir_fd=parent)
            with os.fdopen(out,'wb') as stream:stream.write(after);stream.flush();os.fchmod(stream.fileno(),0o600);os.fsync(stream.fileno())
            current=os.stat('node0.env',dir_fd=parent,follow_symlinks=False)
            if (current.st_dev,current.st_ino,current.st_size,current.st_mtime_ns)!=(original.st_dev,original.st_ino,original.st_size,original.st_mtime_ns):raise RuntimeError()
            fd=os.open('node0.env',os.O_RDONLY|os.O_NOFOLLOW,dir_fd=parent)
            try:
                if os.read(fd,65537)!=before:raise RuntimeError()
            finally:os.close(fd)
            os.rename(temp,'node0.env',src_dir_fd=parent,dst_dir_fd=parent);temp=None;os.fsync(parent)
            result=os.stat('node0.env',dir_fd=parent,follow_symlinks=False)
            if not stat.S_ISREG(result.st_mode) or result.st_nlink!=1 or result.st_mode&0o777!=0o600:raise RuntimeError()
            print(json.dumps({'configured':True,'mode':'0600','atomicReplacement':True,'secretValuesPrinted':False,'keys':sorted(allowed)}))
        finally:
            if temp is not None:
                try:os.unlink(temp,dir_fd=parent)
                except OSError:pass
            os.close(lock)
            try:
                leaf=os.stat('.node0-oauth.lock',dir_fd=parent,follow_symlinks=False)
                if (leaf.st_dev,leaf.st_ino)==(lock_info.st_dev,lock_info.st_ino):os.unlink('.node0-oauth.lock',dir_fd=parent)
            except OSError:pass
    finally:os.close(parent)
try:run()
except BaseException:
    sys.stderr.write('node0_oauth_configuration_failed\n');sys.exit(1)
