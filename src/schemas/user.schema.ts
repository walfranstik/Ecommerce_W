import { z } from "zod";

export const RolUsuarioZod = z.enum(["CLIENTE", "ADMINISTRADOR"]);

export const UserSchema = z.object({
  nombreUsuario: z
    .string()
    .min(3, {
      message: "El nombre de usuario debe tener al menos 3 caracteres.",
    })
    .max(255, {
      message: "El nombre de usuario no puede exceder los 255 caracteres.",
    })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message:
        "El nombre de usuario solo puede contener letras, números y guiones bajos.",
    }),

  contrasena: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres." })
    .max(255, {
      message: "La contraseña no puede exceder los 255 caracteres.",
    })
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      {
        message:
          "La contraceña debe tener almenos una mayuscula,una minuscula,un numero y un caracter",
      }
    ),

  email: z
    .string()
    .email({ message: "El formato del correo electrónico no es válido." })
    .max(255, {
      message: "El correo electrónico no puede exceder los 255 caracteres.",
    }),

  rol: RolUsuarioZod.default("CLIENTE"), // Valor por defecto según la entidad

  nombreCompleto: z
    .string()
    .max(255, {
      message: "El nombre completo no puede exceder los 255 caracteres.",
    })
    .optional(),

  telefono: z
    .string()
    .max(20, { message: "El teléfono no puede exceder los 20 caracteres." })
    .optional()
    .refine(
      (val) =>
        val === null ||
        val === undefined ||
        /^(\+?57)?[- ]?(\(?[2-6]\d{1}\)?[- ]?\d{7}|\d{3}[- ]?\d{7}|\d{10})$/.test(
          val
        ),
      {
        message:
          "El formato del teléfono no es válido. Ejemplo: +57 300 1234567, 300-1234567 , 3001234567 , +57-300-1234567,+57 300 1234567.",
      }
    ),

  activo: z.boolean().default(true), // Valor por defecto según la entidad

  pedidos: z.array(z.any()).optional(), // Relación
  direcciones: z.array(z.any()).optional(), // Relación
});

export type UserInput = z.infer<typeof UserSchema>;
