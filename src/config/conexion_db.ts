import { DataSource } from "typeorm";
import { Product } from "../entities/Product";
import { Category } from "../entities/Category";
import { Address } from "../entities/Address";
import { Pedido } from "../entities/Pedido";
import { ProductImage } from "../entities/ProductImage";
import { User } from "../entities/User";
import { ItemPedido } from "../entities/ItemPedido";
import { ENV } from "../config/env"; // ajusta la ruta según tu estructura

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: ENV.PORT_DB,
  username: ENV.USER_BD,
  password: ENV.PASSWORD_BD,
  database: ENV.DATABASE_DB,
  logging: true,
  entities: [
    User,
    Product,
    Category,
    Address,
    ProductImage,
    Pedido,
    ItemPedido,
  ],
  synchronize: true,
});
