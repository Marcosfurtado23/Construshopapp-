import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  price: z.string().regex(/^\d+(,\d{2})?$/, 'Preço inválido (ex: 10,00)'),
  shipping: z.string().regex(/^\d+(,\d{2})?$/, 'Frete inválido (ex: 0,00)').optional(),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  tag: z.string().optional(),
  tagColor: z.string().optional(),
  image: z.string().url('URL da imagem inválida').or(z.string().startsWith('data:image/')),
});

export type ProductInput = z.infer<typeof productSchema>;
