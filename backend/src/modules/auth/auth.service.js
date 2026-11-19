import bcrypt from 'bcryptjs';
import { authRepository } from './auth.repository.js';
import { AppError } from '../../utils/error.js';

export async function register(data) {
  const found = await authRepository.findByEmail(data.email);
  if (found) throw new AppError(409, 'EMAIL_TAKEN');
  const hash = await bcrypt.hash(data.password, 12);
  try {
    const user = await authRepository.createUserWithWorkshop({
      email: data.email, fullName: data.fullName, phone: data.phone ?? null,
      role: data.role, passwordHash: hash,
    }, data.workshop);
    return authRepository.findPublic(user.id);
  } catch (error) {
    if (error?.code === 'P2002') throw new AppError(409, 'EMAIL_TAKEN');
    throw error;
  }
}
export async function verifyCredentials(data) {
  const user = await authRepository.findByEmail(data.email);
  // Time-safe-ish fallback: do not reveal whether the email exists.
  const fallback = '$2a$12$gUGp8riGaIYTRvMR52u7C.Ei9hX5VsKQko0uXxvVIxI0/xL1tJRyW';
  const matches = await bcrypt.compare(data.password, user?.passwordHash ?? fallback);
  if (!user || !matches || user.status !== 'ACTIVE') throw new AppError(401, 'INVALID_CREDENTIALS');
  return user;
}
