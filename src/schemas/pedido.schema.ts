import { z } from "zod";

export const EstadoPedidoZod = z.enum([
  "PENDIENTE",
  "PROCESANDO",
  "ENVIADO",
  "ENTREGADO",
  "CANCELADO",
  "DEVUELTO",
]);
export const EstadoPagoZod = z.enum([
  "PENDIENTE",
  "PAGADO",
  "FALLIDO",
  "REEMBOLSADO",
]);

const numRegex =
  /^(\+?57)?[- ]?(\(?[2-6]\d{1}\)?[- ]?\d{7}|\d{3}[- ]?\d{7}|\d{10})$/;

// --- Esquema para un Item de Pedido (Input Óptimo) ---
export const ItemPedidoInputSchema = z.object({
  productoId: z.number().int().positive({
    message: "Cada item debe tener un productoId válido.",
  }),
  cantidad: z.number().int().positive({
    message: "La cantidad de cada item debe ser un entero positivo.",
  }),

  precioUnitario: z.number().nonnegative({
    message: "El precio unitario de cada item no puede ser negativo.",
  }),
});
export type ItemPedidoInput = z.infer<typeof ItemPedidoInputSchema>;

// --- Esquema Principal del Pedido ---
export const PedidoSchema = z.object({
  // Datos Requeridos
  usuarioId: z
    .number()
    .int()
    .positive({ message: "Se requiere un usuarioId válido." }),
  metodoPago: z.string().min(1, "Se requiere un método de pago.").max(255),
  numeroPedido: z
    .string()
    .min(1, "Se requiere un número de pedido.")
    .max(255)
    .optional(),
  itemsPedido: z
    .array(ItemPedidoInputSchema)
    .min(1, { message: "El pedido debe tener al menos un item." }),

  // Datos Opcionales del Cliente (Pueden venir del usuario autenticado)
  nombreCompleto: z.string().max(255).optional(),
  email: z.string().email("Email inválido.").max(255).optional(),
  telefono: z
    .string()
    .max(20)
    .regex(numRegex, { message: "El formato del teléfono no es válido." })
    .optional(),

  // Datos Opcionales de Envío
  direccionEnvioId: z.number().int().positive().optional(),
  metodoEnvio: z.string().max(255).optional(),
  costoEnvio: z.preprocess(
    // Forzar a número, default 0
    (val) =>
      val === "" || val === null || val === undefined ? 0 : Number(val),
    z.number().nonnegative().default(0)
  ),
  fechaEntrega: z.coerce.date().optional(), // Intentar convertir a fecha

  // Datos Opcionales de Pago y Promoción
  transaccionId: z.string().max(255).optional(),
  codigoPromocional: z.string().max(50).optional(),
  notas: z.string().max(3000).optional(),
  ipAddress: z.string().ip({ version: "v4" }).optional(),

  
});

export type PedidoInput = z.infer<typeof PedidoSchema>;
