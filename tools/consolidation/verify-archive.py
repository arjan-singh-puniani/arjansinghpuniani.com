"""Verify recovery objects and referenced historical Git blobs without executing them."""
import collections
import hashlib
import json
import pathlib
import subprocess

root = pathlib.Path(__file__).resolve().parents[2]
archive = root / 'archive/consolidation-20261017'
rows = json.loads((archive / 'inventory.json').read_text())
objects = {}
blobs = set()
for row in rows:
    if row.get('archive'):
        path = (archive / row['archive']).resolve()
        if not path.is_relative_to(archive.resolve()):
            raise ValueError('Recovery object escapes archive')
        data = objects.setdefault(path, path.read_bytes())
        assert len(data) == row['bytes'], row['path']
        assert hashlib.sha256(data).hexdigest() == row['sha256'], row['path']
    elif row.get('gitBlob') and row['classification'] in ('A', 'D') and not row['reason'].startswith('Original archive'):
        blobs.add(row['gitBlob'])
result = subprocess.run(['git', 'cat-file', '--batch-check'], cwd=root,
    input='\n'.join(sorted(blobs))+'\n', text=True, capture_output=True, check=True)
assert all(line.endswith(' missing') is False for line in result.stdout.splitlines()), result.stdout
assert len(result.stdout.splitlines()) == len(blobs)
print(json.dumps({'artifacts': len(rows), 'classifications': dict(collections.Counter(r['classification'] for r in rows)),
    'verifiedRecoveryObjects': len(objects), 'historicalGitBlobs': len(blobs),
    'uncertainUnreadableOriginals': sum(bool(r.get('unreadable')) for r in rows)}, indent=2))
