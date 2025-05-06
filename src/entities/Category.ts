import { Entity, PrimaryGeneratedColumn, Column, OneToMany, BaseEntity } from "typeorm";
import { Product } from "./Product"; // Importa la entidad Product

@Entity("categories")
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255, unique: true })
  nombre: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  descripcion: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  slug: string; // Para URLs amigables (ej., "electronica", "ropa-hombre")

  @OneToMany(() => Product, (product) => product.categoria)
  products: Product[];

  @Column({ type: "varchar", length: 255, nullable: true })
  imagenUrl: string; // URL de la imagen de la categoría

  @Column({ type: "int", nullable: true })
  orden: number; // Para definir el orden de las categorías

  @Column({ type: "boolean", default: true })
  activo: boolean; // Indica si la categoría está activa y visible

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  fechaCreacion: Date;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  fechaActualizacion: Date;

  // Relación auto-referencial para subcategorías (opcional):
  // @ManyToOne(() => Category, category => category.subcategorias)
  // @JoinColumn({ name: 'categoria_padre_id' })
  // padre: Category;

  // @Column({ name: 'categoria_padre_id', type: 'int', nullable: true })
  // padreId: number;

  // @OneToMany(() => Category, category => category.padre)
  // subcategorias: Category[];
}
