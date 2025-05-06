import { Request, Response } from "express";
import { AppDataSource } from "../config/conexion_db";
import { Address } from "../entities/Address";
import { AddressInput, AddressSchema } from "../schemas/address.schema";
import { User } from "../entities/User";


class AddressController {
  private  addressRepository = AppDataSource.getRepository(Address);
  private  userRepository = AppDataSource.getRepository(User);
  constructor() {}

  async consultar(req: Request, res: Response) {
    try {
      const data = await this.addressRepository.find();
      res.status(200).json(data);
    } catch (err) {
      if (err instanceof Error) res.status(500).send(err.message);
    }
  }

  async consultarDetalle(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const registro = await this.addressRepository.findOneBy({ id:Number(id) });
      if (!registro) {
        throw new Error("Categoria no encontrada");
      }

      res.status(200).json(registro);
    } catch (err) {
      if (err instanceof Error) res.status(500).send(err.message);
    }
  }

  async ingresar(req: Request, res: Response) {
    try {
      const parsed = AddressSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({error : parsed.error.flatten()});
      }

      const data : AddressInput = parsed.data!;

      const user = await this.userRepository.findOneBy({id:data.usuarioId});

      if (!user || user == null) {
        return res.status(400).json({ error: "El usuario no Existe" });
      }
      const newAddress =  this.addressRepository.create({...data ,user : user! });

      const registro = await this.addressRepository.save(newAddress);
      res.status(201).json(registro);
    } catch (err) {
      if (err instanceof Error) res.status(500).send(err.message);
      else res.status(500).send("Error desconocido al crear una Dirección");
    }
  }


  async actualizar(req: Request, res: Response) {
    const { id } = req.params;
    try {

      const addressExistente = await this.addressRepository.findOneBy({id:Number(id)});
      if (!addressExistente) {
        return res.status(400).json({error : "La Dirección No Existe"})
      }

      const parsed = AddressSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      
      const data: AddressInput = parsed.data!;

      if(data.usuarioId != addressExistente.usuarioId)
        {const user = await this.userRepository.findOneBy({ id: data.usuarioId });

        if (!user || user == null) {
          return res.status(400).json({ error: "El usuario no Existe" });
        }
        addressExistente.user=user;
        }
        this.addressRepository.merge(addressExistente,data);
      const registro = await this.addressRepository.save(addressExistente);
      res.status(201).json(registro);
    } catch (err) {
      if (err instanceof Error) res.status(500).send(err.message);
      else res.status(500).send("Error desconocido al crear una Dirección");
    }
  }

  async borrar(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const registro = await this.addressRepository.findOneBy({ id: Number(id) });
      if (!registro) {
        throw new Error("Dirección no encontrada");
      }
      await this.addressRepository.delete({ id: Number(id) });
      res.sendStatus(204);
    } catch (err) {
      if (err instanceof Error) res.status(500).send(err.message);
    }
  }
}

export default new AddressController();
