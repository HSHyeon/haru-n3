import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
export function buildPwa(directory) {
  const root = resolve(directory);
  function walk(folder) {
    return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
      const path = resolve(folder, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    });
  }
  const files = walk(root)
    .filter((file) => relative(root, file) !== 'sw.js')
    .sort();
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(relative(root, file));
    hash.update(readFileSync(file));
  }
  const version = hash.digest('hex').slice(0, 16);
  const urls = files.map((file) => '/' + relative(root, file).replaceAll('\\', '/'));
  const template = readFileSync(new URL('./sw-template.js', import.meta.url), 'utf8');
  writeFileSync(
    resolve(root, 'sw.js'),
    template
      .replace('__CACHE_NAME__', JSON.stringify('haru-pwa-' + version))
      .replace('__PRECACHE_URLS__', JSON.stringify(urls)),
  );
  return { version, urls };
}
