import { ZodError } from 'zod';
import { AppError } from '../utils/error.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  try {
    const parsed = schema.parse(req[source]);
    if (source === 'query') req.validatedQuery = parsed;
    else req[source] = parsed;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      next(new AppError(400, 'VALIDATION_ERROR', null,
        error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))));
      return;
    }
    next(error);
  }
};
