import { randomBytes } from 'node:crypto';
export const newCode = (prefix) => `${prefix}-${new Date().getUTCFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`;
export function slugify(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 75) || 'xuong';
}
