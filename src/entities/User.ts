import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  JoinColumn,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Pedido } from "./Pedido";
import { Address } from "./Address"; 

export enum RolUsuario {
  CLIENTE = "CLIENTE",
  ADMINISTRADOR = "ADMINISTRADOR",
}

@Entity("usuarios")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  
  @CreateDateColumn()
  fechaCreacion: Date;

  @UpdateDateColumn()
  fechaActualizacion: Date;

  @Column({ type: "varchar", length: 255, unique: true })
  nombreUsuario: string;

  @Column({ type: "varchar", length: 255 })
  contrasena: string;

  @Column({ type: "varchar", length: 255 })
  email: string;

  @Column({ type: "enum", enum: RolUsuario, default: RolUsuario.CLIENTE })
  rol: RolUsuario;

  @Column({ type: "varchar", length: 255, nullable: true })
  nombreCompleto: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  telefono: string;

  @Column({ type: "boolean", default: true })
  activo: boolean;

  @OneToMany(() => Pedido, (pedido) => pedido.usuario)
  pedidos: Pedido[];

  @OneToMany(() => Address, (address) => address.user)
  direcciones: Address[];
}
