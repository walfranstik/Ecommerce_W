import { z } from "zod";

export const productSchema = z.object({

  nombre: z.string().min(1),

  descripcion: z.string().optional(),

  precio: z.preprocess((val) => Number(val), z.number().positive()),

  categoriaId: z.preprocess((val) => Number(val), z.number().int().positive()),

  stock: z.preprocess((val) => Number(val), z.number().int().nonnegative()),

  sku: z.string().optional(),
  
  activo: z.preprocess((val) => val === "true" || val === true, z.boolean()),

  calificacionPromedio: z.preprocess((val) => Number(val),z.number().min(0).max(5)),

  numeroResenas: z.preprocess((val) => Number(val), z.number().int().nonnegative()),

  marca: z.string().optional(),

  modelo: z.string().optional(),
});
