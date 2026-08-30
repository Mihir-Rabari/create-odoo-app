import { z } from 'zod';

export const IdParamSchema = z.object({
  id: z.string().min(1, 'ID must not be empty'),
});
export type IdParam = z.infer<typeof IdParamSchema>;

export const UuidSchema = z.string().uuid('Invalid UUID identifier');

export const UuidParamSchema = z.object({
  id: UuidSchema,
});
export type UuidParam = z.infer<typeof UuidParamSchema>;

export const NonEmptyStringSchema = z.string().trim().min(1, 'String cannot be blank');

export const EmailSchema = z.string().trim().email('Invalid email address').toLowerCase();

export const SlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must consist of lowercase alphanumeric characters and single hyphens');

export const IsoDateTimeSchema = z.string().datetime({ message: 'Invalid ISO 8601 datetime format' });
