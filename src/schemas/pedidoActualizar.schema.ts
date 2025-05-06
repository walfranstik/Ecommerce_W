import { z } from "zod";
import {
  EstadoPedidoZod,
  EstadoPagoZod,
  ItemPedidoInputSchema,
} from "./pedido.schema";
const numRegex =
  /^(\+?57)?[- ]?(\(?[2-6]\d{1}\)?[- ]?\d{7}|\d{3}[- ]?\d{7}|\d{10})$/;

// Hacemos la mayoría de los campos opcionales para la actualización
export const PedidoActualizarSchema = z.object({

  nombreCompleto: z.string().max(255).optional(),
  email: z.string().email("Email inválido.").max(255).optional(),
  telefono: z
    .string()
    .max(20)
    .regex(numRegex, { message: "El formato del teléfono no es válido." })
    .optional(),

  direccionEnvioId: z.number().int().positive().optional() , // Permitir null para quitar dirección
  metodoEnvio: z.string().max(255).optional(),
  costoEnvio: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? undefined : Number(val),
    z.number().nonnegative().optional() // Opcional, si no viene no se cambia
  ),
  fechaEntrega: z.coerce.date().optional().nullable(),

  metodoPago: z.string().min(1).max(255).optional(),
  transaccionId: z.string().max(255).optional().nullable(),
  estadoPago: EstadoPagoZod.optional(), // Permitir actualizar estado de pago
  fechaPago: z.coerce.date().optional().nullable(),

  // Si se envía 'itemsPedido', se tomará como la nueva lista completa de items.
  // Si no se envía, los items existentes no se tocarán (a menos que la lógica los borre por otra razón).
  itemsPedido: z
    .array(ItemPedidoInputSchema)
    .min(1, {
      message:
        "Si se actualizan los items, el pedido debe tener al menos un item.",
    })
    .optional(), // El array de items es opcional en la actualización

  codigoPromocional: z.string().max(50).optional().nullable(),
  notas: z.string().max(3000).optional().nullable(),
  // numeroPedido: z.string().max(255).optional(), // Generalmente no se actualiza
  estado: EstadoPedidoZod.optional(), // Permitir actualizar estado del pedido
  ipAddress: z.string().ip({ version: "v4" }).optional(),

  // No permitir enviar moneda, totales, etc. Se calculan o son fijos.
});

export type PedidoActualizarInput = z.infer<typeof PedidoActualizarSchema>;
