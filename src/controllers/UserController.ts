import { Request, Response } from "express";
import { Category } from "../entities/Category";
import { AppDataSource } from "../config/conexion_db";
import { Pedido } from "../entities/Pedido";
import { Address } from "../entities/Address";
import { RolUsuario, User } from "../entities/User";
import { UserInput, UserSchema } from "../schemas/user.schema";

class UserController {
  private addressRepository = AppDataSource.getRepository(Address);
  private userRepository = AppDataSource.getRepository(User);

  constructor() {}
  async consultar(req: Request, res: Response) {
    try {
      const users = await this.userRepository.find({
        relations: {direcciones:true }});
      res.status(200).json(users);
    } catch (err) {
      console.error("Error al consultar usuarios:", err);
      if (err instanceof Error) res.status(500).send(err.message);
      else res.status(500).send("Error desconocido al consultar usuarios.");
    }
  }

  async consultarDetalle(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const user = await this.userRepository.findOne({
        where: { id: Number(id) },
        relations: { direcciones: true },
      });
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.status(200).json(user);
    } catch (err) {
      console.error(
        `Error al consultar detalle del usuario con ID ${id}:`,
        err
      );
      if (err instanceof Error) res.status(500).send(err.message);
      else
        res.status(500).send(`Error desconocido al consultar detalle del usuario con ID ${id}.`);
    }
  }

  async ingresar(req: Request, res: Response) {
    try {
      const parsed = UserSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({error : parsed.error.flatten()});
      }

      const data :UserInput = parsed.data;

      const newUser : User = this.userRepository.create({
        ...data,
        rol : data.rol as RolUsuario,
      });

      const registro = await this.userRepository.save(newUser);
      res.status(201).json(registro);
    } catch (err) {
      if (err instanceof Error) res.status(500).send(err.message);
    }
  }

  async actualizar(req: Request, res: Response) {
    const { id } = req.params;
     try {
      const userExistente = await this.userRepository.findOne(
      {where : {id : Number(id)},
      relations : ["direcciones","pedidos"]});

      if (!userExistente) {
        return res.status(400).json({message : "usuario no encontrado"});
      }

       const parsed = UserSchema.safeParse(req.body);


       if (!parsed.success) {
         return res.status(400).json({ error: parsed.error.flatten() });
       }

       const data: UserInput = parsed.data;

       this.userRepository.merge(userExistente,{...data,rol : data.rol as RolUsuario})

       const registro = await this.userRepository.save(userExistente);
       res.status(201).json(registro);
     } catch (err) {
       if (err instanceof Error) res.status(500).send(err.message);
     }
  }

  async borrar(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const registro = await this.userRepository.findOneBy({ id: Number(id) });
      if (!registro) {
        throw new Error("Usuario no encontrado");
      }
      await this.userRepository.delete({ id: Number(id) });
      res.status(204).send();
    } catch (err) {
      if (err instanceof Error) res.status(500).send(err.message);
    }
  }
}

export default new UserController();
