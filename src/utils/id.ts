export function nextSeq(existing: string[], prefix: string): number {
  let max = 0;
  const escaped = prefix.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const re = new RegExp('^' + escaped + '(\\d+)$');
  for (const id of existing) {
    const m = id.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return max + 1;
}

let _localCounter = 0;
export function uniqueId(prefix = 'id_'): string {
  _localCounter += 1;
  return prefix + Date.now().toString(36) + '_' + _localCounter.toString(36);
}
