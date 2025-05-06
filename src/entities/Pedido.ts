import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Product } from "./Product";
import { User } from "./User"; 
import { Address } from "./Address"; 
import { ItemPedido } from "./ItemPedido";
import { nullable } from "zod";

export enum EstadoPedido {
  PENDIENTE = "PENDIENTE",
  PROCESANDO = "PROCESANDO",
  ENVIADO = "ENVIADO",
  ENTREGADO = "ENTREGADO",
  CANCELADO = "CANCELADO",
  DEVUELTO = "DEVUELTO",
}

export enum EstadoPago {
  PENDIENTE = "PENDIENTE",
  PAGADO = "PAGADO",
  FALLIDO = "FALLIDO",
  REEMBOLSADO = "REEMBOLSADO",
}

@Entity("pedidos")
export class Pedido extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  fechaCreacion: Date;

  @UpdateDateColumn()
  fechaActualizacion: Date;

  @Column({ type: "enum", enum: EstadoPedido, default: EstadoPedido.PENDIENTE })
  estado: EstadoPedido;

  @ManyToOne(() => User, (user) => user.pedidos, { nullable: false })
  @JoinColumn({ name: "usuario_id" })
  usuario: User;

  @Column({ name: "usuario_id", type: "int" })
  usuarioId: number;

  @ManyToOne(() => Address, { nullable: true, cascade: ["insert", "update"] })
  @JoinColumn({ name: "direccion_envio_id" })
  direccionEnvio: Address;

  @Column({ name: "direccion_envio_id", type: "int", nullable: true })
  direccionEnvioId: number;

  // Relación para los ítems del pedido con detalles (cantidad, precio unitario al momento de la compra)
  @OneToMany(() => ItemPedido, (itemPedido) => itemPedido.pedido, {
    cascade: true,
  })
  itemsPedido: ItemPedido[];

  // --- Campos del Cliente / Envío / Pago ---
  @Column({ type: "varchar", length: 255, nullable: true })
  nombreCompleto?: string;
  @Column({ type: "varchar", length: 255, nullable: true })
  email?: string;
  @Column({ type: "varchar", length: 20, nullable: true })
  telefono?: string;
  @Column({ type: "varchar", length: 255, nullable: true })
  metodoEnvio?: string;
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  costoEnvio: number;
  @Column({ type: "timestamp", nullable: true })
  fechaEntrega?: Date;
  @Column({ type: "varchar", length: 255 }) // Método de pago parece requerido
  metodoPago: string;
  @Column({ type: "varchar", length: 255, nullable: true })
  transaccionId?: string;
  @Column({ type: "enum", enum: EstadoPago, default: EstadoPago.PENDIENTE })
  estadoPago: EstadoPago;
  @Column({ type: "timestamp", nullable: true })
  fechaPago?: Date;

  // --- Campos Calculados ---
  @Column({ type: "decimal", precision: 12, scale: 2 }) // Más precisión para totales
  subtotal: number;
  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  descuento: number;
  @Column({ type: "decimal", precision: 12, scale: 2 })
  total: number;

  // --- Otros Campos (como los tenías) ---
  @Column({ type: "varchar", length: 50, nullable: true })
  codigoPromocional?: string;
  @Column({ type: "text", nullable: true })
  notas?: string;
  @Column({ type: "varchar", length: 3, default: "COP" }) // Establecer moneda por defecto
  moneda: string;
  @Column({ type: "varchar", length: 50, nullable: true })
  ipAddress?: string;

  calcularTotales(): void {
    if (!this.itemsPedido || this.itemsPedido.length === 0) {
      this.subtotal = 0;
      this.total = this.costoEnvio; // Solo costo de envío si no hay items
      this.descuento = 0; // Resetear descuento
      return;
    }

    this.subtotal = this.itemsPedido.reduce(
      (sum, item) => sum + item.subtotalItem,
      0
    );

    // --- Lógica de Descuento ---
    // Ejemplo: si hay código "DTO10", aplica 10% de descuento sobre subtotal
    if (this.codigoPromocional === "DTO10") {
      this.descuento = this.subtotal * 0.1;
    } else {
      this.descuento = 0; // Asegurar que sea 0 si no aplica
    }

    // --- Lógica de Impuestos ---
    const base = this.subtotal - this.descuento;

    // --- Cálculo del Total Final ---
    this.total = base + this.costoEnvio;

    // Redondear a 2 decimales por seguridad (aunque el tipo decimal ayuda)
    this.subtotal = parseFloat(this.subtotal.toFixed(2));
    this.descuento = parseFloat(this.descuento.toFixed(2));
    this.total = parseFloat(this.total.toFixed(2));
  }
}

