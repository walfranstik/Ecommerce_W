import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Category } from "./Category"; // Asumo que tienes una entidad Category
import { ProductImage } from "./ProductImage"; // Entidad para manejar las imágenes
import { Pedido } from "./Pedido";



@Entity("products")
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  fechaCreacion: Date;

  @UpdateDateColumn()
  fechaActualizacion: Date;
  
  @Column({ type: "varchar", length: 255 })
  nombre: string;

  @Column({ type: "text", nullable: true })
  descripcion: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  precio: number; // Precio base del producto (puede ser sobrescrito por variaciones)

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "categoria_id" })
  categoria: Category;

  @Column({ name: "categoria_id", type: "int" })
  categoriaId: number; // Para facilitar las consultas

  @Column({ type: "int", default: 0 })
  stock: number; // Stock general si no se usan variaciones, o stock total si se usan

  // Relación con las imágenes
  @OneToMany(() => ProductImage, (image) => image.product, {
    cascade: true,
  })
  imagenes: ProductImage[];

  @Column({ type: "varchar", length: 255, nullable: true })
  sku?: string; // Stock Keeping Unit (identificador único del producto)

  @Column({ type: "boolean", default: true })
  activo: boolean; // Indica si el producto está activo y visible

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  calificacionPromedio?: number; // Calificación promedio de los usuarios

  @Column({ type: "int", default: 0 })
  numeroResenas?: number; // Número total de reseñas

  @Column({ type: "varchar", length: 255, nullable: true })
  marca?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  modelo?: string;

  
}
