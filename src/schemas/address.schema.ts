import { z } from "zod";

export const AddressSchema = z.object({

  usuarioId: z.number().int().positive({
    message: "El ID del usuario debe ser un número entero positivo.",
  }),

  direccion: z
    .string()
    .min(5, { message: "La dirección debe tener al menos 5 caracteres." })
    .max(300, { message: "La dirección no puede exceder los 300 caracteres." }), 

  ciudad: z
    .string()
    .min(2, { message: "La ciudad debe tener al menos 2 caracteres." })
    .max(255, { message: "La ciudad no puede exceder los 255 caracteres." }),

  departamento: z
    .string()
    .min(2, { message: "El departamento debe tener al menos 2 caracteres." })
    .max(255, {
      message: "El departamento no puede exceder los 255 caracteres.",
    }),

  codigoPostal: z
    .string()
    .regex(/^[0-9]{5}(?:-[0-9]{4})?$/, {
      message:
        "El código postal debe tener un formato válido (ej: 12345 o 12345-6789).",
    })
    .max(10, {
      message: "El código postal no puede exceder los 10 caracteres.",
    }),

  pais: z
    .string()
    .min(2, { message: "El país debe tener al menos 2 caracteres." })
    .max(100, { message: "El país no puede exceder los 100 caracteres." })
    .default("Colombia"), // Valor por defecto según la entidad

  esPrincipal: z.boolean().default(false)
});

export type AddressInput = z.infer<typeof AddressSchema>;
