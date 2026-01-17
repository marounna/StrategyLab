type Entry<T> = { value: T; expiresAt: number };

export class TTLCache<T> {
  private map = new Map<string, Entry<T>>();
  constructor(private ttlMs: number) {}

  get(key: string): T | null {
    const hit = this.map.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expiresAt) {
      this.map.delete(key);
      return null;
    }
    return hit.value;
  }

  set(key: string, value: T) {
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}
