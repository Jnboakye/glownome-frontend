import { Product } from './types';
import { delay } from './client';
import { PRODUCTS, findProduct } from '../data/products';

export async function listProducts(): Promise<Product[]> {
  return delay(PRODUCTS, 300);
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const matched = ids
    .map((id) => findProduct(id))
    .filter((p): p is Product => Boolean(p));
  return delay(matched, 300);
}

export function getProductSync(id: string): Product | undefined {
  return findProduct(id);
}
