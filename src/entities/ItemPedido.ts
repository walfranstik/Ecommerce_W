import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Pedido } from "./Pedido";
import { Product } from "./Product";
// Entidad para los ítems individuales dentro de un pedido (para guardar cantidad y precio al momento de la compra)
@Entity("item_pedido")
export class ItemPedido extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  fechaCreacion: Date;

  @UpdateDateColumn()
  fechaActualizacion: Date;
  
  @ManyToOne(() => Pedido, (pedido) => pedido.itemsPedido, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "pedido_id" })
  pedido: Pedido;

  @Column({ name: "pedido_id", type: "int" })
  pedidoId: number;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: "producto_id" })
  producto: Product;

  @Column({ name: "producto_id", type: "int" })
  productoId: number;

  @Column({ type: "int" })
  cantidad: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  precioUnitario: number; // Precio del producto al momento de añadirlo al pedido

  @Column({ type: "decimal", precision: 10, scale: 2 })
  subtotalItem: number; // Precio unitario * cantidad
}
