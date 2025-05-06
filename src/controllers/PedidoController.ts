import { Request, Response } from "express";
import { EstadoPago, EstadoPedido, Pedido } from "../entities/Pedido";
import { AppDataSource } from "../config/conexion_db";
import { Product } from "../entities/Product";
import { PedidoInput, PedidoSchema } from "../schemas/pedido.schema";
import { EntityManager, In } from "typeorm";
import { User } from "../entities/User";
import { Address } from "../entities/Address";
import { console } from "inspector";
import { ItemPedido } from "../entities/ItemPedido";
import { PedidoActualizarInput, PedidoActualizarSchema } from "../schemas/pedidoActualizar.schema";

class PedidoController {
  private productRepository = AppDataSource.getRepository(Product);
  private pedidoRepository = AppDataSource.getRepository(Pedido);
  private userRepository = AppDataSource.getRepository(User);
  private addressRepository = AppDataSource.getRepository(Address);
  private dataSource = AppDataSource;

  constructor() {}

  async consultar(req: Request, res: Response) {
    try {
      const pedidos = await this.pedidoRepository.find();
      res.status(200).json(pedidos);
    } catch (error) {
      console.error("Error al consultar Pedidos", error);
      if (error instanceof Error) res.status(500).send(error.message);
      else res.status(500).send("Error desconocido al consultar Pedidos.");
    }
  }
  async consultarDetalle(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const pedidos = await this.pedidoRepository.findOneBy({ id: Number(id) });
      res.status(200).json(pedidos);
    } catch (error) {
      console.error("Error al consultar Pedidos", error);
      if (error instanceof Error) res.status(500).send(error.message);
      else res.status(500).send("Error desconocido al consultar Pedidos.");
    }
  }

  // async ingresar(req: Request, res: Response) {
  //   try {
  //     const parsed = PedidoSchema.safeParse(req.body);
  //     if (!parsed.success) {
  //       return res.status(400).json({ error: parsed.error.flatten() });
  //     }
  //     const data: PedidoInput = parsed.data;

  //     const productosEntidades = await this.productRepository.findBy({
  //       id: In(data.productos),
  //     });
  //     if (
  //       !productosEntidades ||
  //       productosEntidades.length < data.productos.length
  //     ) {
  //       return res
  //         .status(400)
  //         .json({ message: "Algunos productos no son válidos" });
  //     }

  //     const usuarioEntidad = await this.userRepository.findOneBy({
  //       id: data.usuarioId,
  //     });
  //     if (!usuarioEntidad) {
  //       return res.status(400).json({ message: "Usuario inválido" });
  //     }

  //     const newPedido: Pedido = this.pedidoRepository.create({
  //       ...data,
  //       estado: data.estado as EstadoPedido,
  //       usuario: usuarioEntidad,
  //       estadoPago: data.estadoPago as EstadoPago,
  //       productos: productosEntidades,
  //     });

  //     if (data.direccionEnvioId) {
  //       const address = await this.addressRepository.findOneBy({
  //         id: data.direccionEnvioId,
  //       });
  //       if (!address) {
  //         return res.status(400).json({ message: "Dirección inválida" });
  //       }
  //       newPedido.direccionEnvio = address;
  //     }

  //     const pedidoGuardado = await this.pedidoRepository.save(newPedido);

  //     return res.status(201).json(pedidoGuardado);
  //   } catch (error) {
  //     console.error("Error al guardar el pedido:", error);
  //     if (error instanceof Error) res.status(500).send(error.message);
  //     else res.status(500).send("Error desconocido al crear un pedido.");
  //   }
  // }

  async ingresar(req: Request, res: Response) {
    // Usar transacción para asegurar atomicidad
    try {
      const pedidoGuardado = await this.dataSource.transaction(
        async (transactionalEntityManager: EntityManager) => {
          // --- Repositorios Transaccionales ---
          // Es mejor obtenerlos del EntityManager transaccional
          const pedidoRepo = transactionalEntityManager.getRepository(Pedido);
          const itemPedidoRepo =
            transactionalEntityManager.getRepository(ItemPedido);
          const productRepo = transactionalEntityManager.getRepository(Product);
          const userRepo = transactionalEntityManager.getRepository(User);
          const addressRepo = transactionalEntityManager.getRepository(Address);

          // Validar Input con Schema Optimizado
          const parsed = PedidoSchema.safeParse(req.body);
          if (!parsed.success) {
            throw {
              status: 400,
              type: "Validation Error",
              errors: parsed.error.flatten(),
            };
          }
          const data: PedidoInput = parsed.data;

          // Validar Entidades Relacionadas (Usuario, Dirección)
          const usuarioEntidad = await userRepo.findOneBy({
            id: data.usuarioId,
          });
          if (!usuarioEntidad) {
            throw {
              status: 400,
              type: "Not Found",
              message: "Usuario no encontrado.",
            };
          }

          let direccionEntidad: Address | null = null;
          if (data.direccionEnvioId) {
            // IMPORTANTE: Validar que la dirección pertenezca al usuario
            direccionEntidad = await addressRepo.findOneBy({
              id: data.direccionEnvioId,
              user: { id: data.usuarioId }, // Asegura que la dirección es del usuario
            });
            if (!direccionEntidad) {
              throw {
                status: 400,
                type: "Not Found",
                message: `Dirección de envío ID ${data.direccionEnvioId} no encontrada o no pertenece al usuario.`,
              };
            }
          }

          // Obtener y Validar Productos (Incluyendo Stock)
          const productoIds = data.itemsPedido.map((item) => item.productoId);
          const productosParaPedido = await productRepo.find({
            where: { id: In(productoIds) },
            select: ["id", "nombre", "stock", "precio"], // Seleccionar solo campos necesarios
          });

          const mapaProductos = new Map<number, Product>();
          productosParaPedido.forEach((p) => mapaProductos.set(p.id, p));

          // Verificar si todos los productos existen y hay stock suficiente
          for (const itemInput of data.itemsPedido) {
            const producto = mapaProductos.get(itemInput.productoId);
            if (!producto) {
              throw {
                status: 400,
                type: "Not Found",
                message: `Producto con ID ${itemInput.productoId} no encontrado.`,
              };
            }
            if (producto.stock < itemInput.cantidad) {
              throw {
                status: 400,
                type: "Stock Error",
                message: `Stock insuficiente para ${producto.nombre} (ID: ${producto.id}). Disponible: ${producto.stock}, Solicitado: ${itemInput.cantidad}.`,
              };
            }
            if (producto.precio != itemInput.precioUnitario) {
              throw {
                status: 400,
                type: "Not Found",
                message: `Producto con ID ${itemInput.productoId} no tiene el mismo Precio unitario.`,
              };
            }
          }

          // Crear Instancia de Pedido (Entidad Principal)
          const newPedido = pedidoRepo.create({
            usuario: usuarioEntidad,
            direccionEnvio: direccionEntidad ?? undefined,
            metodoPago: data.metodoPago,
            // Mapear otros campos opcionales del input si existen
            nombreCompleto: data.nombreCompleto,
            email: data.email,
            telefono: data.telefono,
            metodoEnvio: data.metodoEnvio,
            costoEnvio: data.costoEnvio,
            fechaEntrega: data.fechaEntrega,
            transaccionId: data.transaccionId,
            codigoPromocional: data.codigoPromocional,
            notas: data.notas,
            ipAddress: data.ipAddress,
            // Establecer valores iniciales/por defecto del servidor
            estado: EstadoPedido.PENDIENTE,
            estadoPago: EstadoPago.PENDIENTE,
            moneda: "COP",
            // Los totales se calculan después
          });

          // Crear Instancias de ItemPedido (Entidades Hijas)
          const itemsEntities: ItemPedido[] = [];
          for (const itemInput of data.itemsPedido) {
            const producto = mapaProductos.get(itemInput.productoId)!; // Sabemos que existe por la validación anterior
            const subtotalItem = itemInput.cantidad * itemInput.precioUnitario;

            const newItem = itemPedidoRepo.create({
              producto: producto, // Asociar la entidad completa
              cantidad: itemInput.cantidad,
              precioUnitario: itemInput.precioUnitario, // Precio al momento de la compra
              subtotalItem: parseFloat(subtotalItem.toFixed(2)), // Calcular y redondear subtotal del item
              // 'pedido' se asigna automáticamente por la relación inversa al guardar el pedido con cascade
            });
            itemsEntities.push(newItem);
          }

          // 6. Asignar Items al Pedido y Calcular Totales
          newPedido.itemsPedido = itemsEntities; // Asigna los items creados
          newPedido.calcularTotales(); // Llama al método para calcular subtotal, impuestos, total, etc.

          // 7. Guardar Pedido (TypeORM se encarga de los items por `cascade: true`)
          await pedidoRepo.save(newPedido); // Guarda Pedido e ItemPedido

          // 8. Decrementar Stock (IMPORTANTE: Hacerlo DESPUÉS de guardar exitosamente)
          for (const item of newPedido.itemsPedido) {
            await productRepo.decrement(
              { id: item.productoId },
              "stock",
              item.cantidad
            );
          }

          // 9. Retornar el Pedido Guardado desde la transacción

          return newPedido;
        } // --- Fin de la transacción ---
      ); // Fin llamada a this.dataSource.transaction

      // --- Respuesta Exitosa ---
      // Cargar relaciones necesarias para la respuesta si no están ya cargadas (ej. si se quitó eager)
      const pedidoCompletoParaRespuesta = await this.pedidoRepository.findOne({
        where: { id: pedidoGuardado.id },
        relations: [
          "usuario", // Cargar usuario (sin password!)
          "direccionEnvio",
          "itemsPedido",
          "itemsPedido.producto", // Cargar producto dentro de cada item
        ],
      });

      if (!pedidoCompletoParaRespuesta) {
        // Esto no debería pasar si la transacción fue exitosa, pero por si acaso...
        throw new Error(
          "Pedido guardado pero no encontrado para la respuesta."
        );
      }

      // Limpiar datos sensibles antes de enviar (ej. password del usuario)
      if (pedidoCompletoParaRespuesta.usuario) {
        delete (pedidoCompletoParaRespuesta.usuario as any).password;
        // delete otros campos sensibles...
      }

      return res.status(201).json(pedidoCompletoParaRespuesta);
    } catch (error: any) {
      console.error("Error detallado al crear pedido:", error);

      // Devolver errores de validación específicos
      if (error?.type === "Validation Error") {
        return res
          .status(error.status || 400)
          .json({ message: "Error de Validación", errors: error.errors });
      }
      // Devolver errores de negocio específicos
      if (error?.type === "Not Found" || error?.type === "Stock Error") {
        return res.status(error.status || 400).json({ message: error.message });
      }
      if (error instanceof Error) {
        return res.status(500).json({ errors: error.message });
      }
    }
    // Error genérico del servidor
    return res
      .status(500)
      .json({ message: "Error interno del servidor al crear el pedido." });
  }
  async actualizar(req: Request, res: Response) {
    const pedidoId = parseInt(req.params.id, 10);
    if (isNaN(pedidoId)) {
      return res.status(400).json({ message: "ID de pedido inválido." });
    }

    try {
      const pedidoActualizado = await this.dataSource.transaction(
        async (transactionalEntityManager: EntityManager) => {
          const pedidoRepo = transactionalEntityManager.getRepository(Pedido);
          const itemPedidoRepo =
            transactionalEntityManager.getRepository(ItemPedido);
          const productRepo = transactionalEntityManager.getRepository(Product);
          const userRepo = transactionalEntityManager.getRepository(User); // Necesario si se pudiera cambiar usuario o validar dirección
          const addressRepo = transactionalEntityManager.getRepository(Address);

          // Validar Input
          const parsed = PedidoActualizarSchema.safeParse(req.body);
          if (!parsed.success) {
            throw {
              status: 400,
              type: "Validation Error",
              errors: parsed.error.flatten(),
            };
          }
          const data: PedidoActualizarInput = parsed.data;

          // Obtener Pedido Existente (con sus items actuales y productos de esos items)
          const pedidoExistente = await pedidoRepo.findOne({
            where: { id: pedidoId },
            relations: [
              "usuario", // Para validar `direccionEnvioId` si es necesario
              "itemsPedido",
              "itemsPedido.producto", // Necesitamos el producto para restaurar stock
            ],
          });

          if (!pedidoExistente) {
            throw {
              status: 404,
              type: "Not Found",
              message: "Pedido no encontrado.",
            };
          }

          // --- Lógica de actualización de campos del Pedido ---
          // No permitir cambiar el usuario del pedido
          // if (data.usuarioId && data.usuarioId !== pedidoExistente.usuario.id) {
          //     throw { status: 400, type: "Business Logic Error", message: "No se puede cambiar el usuario de un pedido existente." };
          // }

          if (data.nombreCompleto !== undefined)
            pedidoExistente.nombreCompleto = data.nombreCompleto;
          if (data.email !== undefined) pedidoExistente.email = data.email;
          if (data.telefono !== undefined)
            pedidoExistente.telefono = data.telefono;
          if (data.metodoEnvio !== undefined)
            pedidoExistente.metodoEnvio = data.metodoEnvio;
          if (data.costoEnvio !== undefined)
            pedidoExistente.costoEnvio = data.costoEnvio;
          if (data.fechaEntrega !== undefined)
            pedidoExistente.fechaEntrega = data.fechaEntrega ?? undefined; // Para permitir null
          if (data.metodoPago !== undefined)
            pedidoExistente.metodoPago = data.metodoPago;
          if (data.transaccionId !== undefined)
            pedidoExistente.transaccionId = data.transaccionId ?? undefined;
          if (data.estadoPago !== undefined)
            pedidoExistente.estadoPago = data.estadoPago as EstadoPago;
          if (data.fechaPago !== undefined)
            pedidoExistente.fechaPago = data.fechaPago ?? undefined;
          if (data.codigoPromocional !== undefined)
            pedidoExistente.codigoPromocional =
              data.codigoPromocional ?? undefined;
          if (data.notas !== undefined)
            pedidoExistente.notas = data.notas ?? undefined;
          if (data.estado !== undefined)
            pedidoExistente.estado = data.estado as EstadoPedido;
          if (data.ipAddress !== undefined)
            pedidoExistente.ipAddress = data.ipAddress;

          // Actualizar Dirección de Envío
          if (data.direccionEnvioId !== undefined) {
            // Si se envió explícitamente
            if (data.direccionEnvioId !== null) {
             
              const nuevaDireccion = await addressRepo.findOneBy({
                id: data.direccionEnvioId,
                user: { id: pedidoExistente.usuario.id }, // Validar que pertenece al usuario del pedido
              });
              if (!nuevaDireccion) {
                throw {
                  status: 400,
                  type: "Not Found",
                  message: `Nueva dirección de envío ID ${data.direccionEnvioId} no encontrada o no pertenece al usuario.`,
                };
              }
              pedidoExistente.direccionEnvio = nuevaDireccion;
            }
          }

          // --- Lógica de Actualización de ItemsPedido (si se proporcionaron) ---
          if (data.itemsPedido && Array.isArray(data.itemsPedido)) {
            // a. Restaurar stock de items antiguos (si existen)
            if (
              pedidoExistente.itemsPedido &&
              pedidoExistente.itemsPedido.length > 0
            ) {
              for (const itemAntiguo of pedidoExistente.itemsPedido) {
                if (itemAntiguo.producto && itemAntiguo.producto.id) {
                  // Asegurarse que producto está cargado
                  await productRepo.increment(
                    { id: itemAntiguo.producto.id },
                    "stock",
                    itemAntiguo.cantidad
                  );
                }
              }
              // b. Eliminar items antiguos de la base de datos
              await itemPedidoRepo.delete({ pedido: { id: pedidoId } });
            }

            // c. Validar y Crear Nuevos Items
            const productoIdsNuevos = data.itemsPedido.map(
              (item) => item.productoId
            );
            const productosParaNuevosItems = await productRepo.find({
              where: { id: In(productoIdsNuevos) },
              select: ["id", "nombre", "stock", "precio"],
            });
            const mapaProductosNuevos = new Map<number, Product>();
            productosParaNuevosItems.forEach((p) =>
              mapaProductosNuevos.set(p.id, p)
            );

            const nuevosItemsEntities: ItemPedido[] = [];
            for (const itemInput of data.itemsPedido) {
              const producto = mapaProductosNuevos.get(itemInput.productoId);
              if (!producto) {
                throw {
                  status: 400,
                  type: "Not Found",
                  message: `Producto con ID ${itemInput.productoId} no encontrado para nuevo item.`,
                };
              }
              if (producto.stock < itemInput.cantidad) {
                throw {
                  status: 400,
                  type: "Stock Error",
                  message: `Stock insuficiente para ${producto.nombre} (ID: ${producto.id}). Disponible: ${producto.stock}, Solicitado: ${itemInput.cantidad}.`,
                };
              }
              // Opcional: Validar precio unitario si es necesario, aunque se toma el del input
              if (producto.precio != itemInput.precioUnitario) {
                console.warn(
                  `Advertencia: El precio actual del producto ${producto.id} (${producto.precio}) es diferente al precio unitario enviado (${itemInput.precioUnitario}) para el pedido ${pedidoId}. Se usará el precio enviado.`
                );
              }

              const subtotalItem =
                itemInput.cantidad * itemInput.precioUnitario;
              const nuevoItem = itemPedidoRepo.create({
                producto: producto,
                cantidad: itemInput.cantidad,
                precioUnitario: itemInput.precioUnitario,
                subtotalItem: parseFloat(subtotalItem.toFixed(2)),
                // pedido: pedidoExistente // TypeORM lo asigna con cascade
              });
              nuevosItemsEntities.push(nuevoItem);

              // d. Decrementar stock para los nuevos items
              await productRepo.decrement(
                { id: producto.id },
                "stock",
                itemInput.cantidad
              );
            }
            pedidoExistente.itemsPedido = nuevosItemsEntities; // Asignar la nueva lista de items
          }
          // Si no se envió data.itemsPedido, los items existentes en pedidoExistente.itemsPedido no se tocan.

          // 3. Recalcular Totales
          pedidoExistente.calcularTotales(); // Método en la entidad Pedido

          // 4. Guardar Pedido Actualizado (cascade guardará los items)
          await pedidoRepo.save(pedidoExistente);

          return pedidoExistente;
        } // Fin de la transacción
      ); // Fin llamada a this.dataSource.transaction

      // --- Respuesta Exitosa ---
      const pedidoCompletoParaRespuesta = await this.dataSource
        .getRepository(Pedido)
        .findOne({
          where: { id: pedidoActualizado.id },
          relations: [
            "usuario",
            "direccionEnvio",
            "itemsPedido",
            "itemsPedido.producto",
          ],
        });

      if (!pedidoCompletoParaRespuesta) {
        throw new Error(
          "Pedido actualizado pero no encontrado para la respuesta."
        );
      }
      if (pedidoCompletoParaRespuesta.usuario) {
        delete (pedidoCompletoParaRespuesta.usuario as any).password;
      }

      return res.status(200).json(pedidoCompletoParaRespuesta);
    } catch (error: any) {
      console.error("Error detallado al actualizar pedido:", error);
      if (error?.type === "Validation Error") {
        return res
          .status(error.status || 400)
          .json({ message: "Error de Validación", errors: error.errors });
      }
      if (
        error?.type === "Not Found" ||
        error?.type === "Stock Error" ||
        error?.type === "Business Logic Error"
      ) {
        return res.status(error.status || 400).json({ message: error.message });
      }
      if (
        error instanceof Error &&
        error.message.includes("Pedido guardado pero no encontrado")
      ) {
        return res
          .status(500)
          .json({
            message: "Error interno al procesar la respuesta del pedido.",
          });
      }
      return res
        .status(500)
        .json({
          message: "Error interno del servidor al actualizar el pedido.",
        });
    }
  }
}

export default new PedidoController();