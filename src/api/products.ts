import { ConcernKey, Product } from './types';
import { isLiveBackend, request } from './client';

/**
 * The product catalogue.
 *
 * Empty until the scraped catalogue is behind an endpoint. Returning [] rather
 * than sample products keeps every screen honest — an empty state is true, a
 * fake product is not.
 *
 * The API wraps collections as `{ products: [...] }`; that envelope is
 * unwrapped here so screens keep working with plain arrays.
 */
type ProductsEnvelope = { products: Product[] };

/**
 * Products matching any of the given concerns.
 *
 * There is no "list everything" endpoint — the catalogue is queried by
 * concern, because that is the only way a recommendation is ever justified.
 */
export async function listProductsByConcerns(
  concerns: ConcernKey[],
  limit = 5,
): Promise<Product[]> {
  if (!isLiveBackend() || concerns.length === 0) return [];
  const query = concerns.map((c) => `concern=${encodeURIComponent(c)}`).join('&');
  const body = await request<ProductsEnvelope>(`/products?${query}&limit=${limit}`);
  return body.products ?? [];
}

export async function getProduct(id: string): Promise<Product | null> {
  if (!isLiveBackend()) return null;
  return request<Product>(`/products/${encodeURIComponent(id)}`);
}

/** Resolves the ids an analysis returned into full records for the carousel. */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!isLiveBackend() || ids.length === 0) return [];
  const body = await request<ProductsEnvelope>(
    `/products/by-ids?ids=${ids.map(encodeURIComponent).join(',')}`,
  );
  return body.products ?? [];
}
