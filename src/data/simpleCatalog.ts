/**
 * Garment list for the photorealistic try-on screen.
 *
 * Loaded from public/assets/garments/manifest.json so a shop can add SKUs by
 * dropping files in a folder, without a rebuild.
 *
 * These are intentionally separate from SAMPLE_PRODUCTS in catalog.ts: that
 * list holds full-person reference photography, which cannot be used as a
 * garment input for a try-on model.
 */

import type { SimpleGarment } from '../components/SimpleTryOn';
import type { GarmentCategory } from '../services/tryOnApi';

interface ManifestEntry {
  id: string;
  name: string;
  nameEn?: string;
  image: string;
  category: GarmentCategory;
}

const CATEGORIES: GarmentCategory[] = ['upper', 'lower', 'overall'];

export async function loadSimpleGarments(
  url = '/assets/garments/manifest.json',
): Promise<SimpleGarment[]> {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`garment manifest unavailable (${response.status})`);

  const data = await response.json();
  const entries: ManifestEntry[] = Array.isArray(data.garments) ? data.garments : [];

  return entries
    .filter((entry) => {
      const ok = entry.id && entry.image && CATEGORIES.includes(entry.category);
      if (!ok) console.warn('[FitAI] skipping invalid garment entry', entry);
      return ok;
    })
    .map((entry) => ({
      id: entry.id,
      name: entry.name || entry.nameEn || entry.id,
      imageUrl: entry.image,
      category: entry.category,
    }));
}
