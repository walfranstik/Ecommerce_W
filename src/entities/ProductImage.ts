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
import { Product } from "./Product";

@Entity("product_images")
export class ProductImage extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  fechaCreacion: Date;
  
  @Column({ type: "varchar", length: 255 })
  url: string; // Ruta o URL de la imagen

  @Column({ type: "varchar", length: 255, nullable: true })
  altText?: string; // Texto alternativo para la imagen

  @ManyToOne(() => Product, (product) => product.imagenes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "product_id" })
  product: Product;

  @Column({ name: "product_id", type: "int" })
  productId: number;
}
