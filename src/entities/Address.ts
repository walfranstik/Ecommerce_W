import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { User } from "./User"; 

@Entity("direcciones")
export class Address extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (usuario) => usuario.direcciones, {
    onDelete: "CASCADE",
    eager:true
  })
  @JoinColumn({ name: "usuario_id" })
  user: User;

  @Column({ name: "usuario_id", type: "int" })
  usuarioId: number;

  @Column({ type: "varchar", length: 400})
  direccion: string;

  @Column({ type: "varchar", length: 255 })
  ciudad: string;

  @Column({ type: "varchar", length: 255 })
  departamento: string;

  @Column({ type: "varchar", length: 10 })
  codigoPostal: string;

  @Column({ type: "varchar", length: 100, default:"Colombia" })
  pais: string;

  @Column({ type: "boolean", default: false })
  esPrincipal: boolean; // Indica si esta es la dirección principal del usuario

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  fechaCreacion: Date;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  fechaActualizacion: Date;
}
