import { Request, Response } from "express";
import { Category } from "../entities/Category";

class CategoryController {
  constructor() {}

  async consultar(req: Request, res: Response) {
    try {
      const data = await Category.find({
        relations: { products: true },
      });
      res.status(200).json(data);
    } catch (err) {
      if (err instanceof Error) res.status(500).send(err.message);
    }
  }

  async consultarDetalle(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const registro = await Category.findOne({
        where: { id: Number(id) },
        relations: { products: true },
      });
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
      const registro = await Category.save(req.body);
      res.status(201).json(registro);
    } catch (err) {
      if (err instanceof Error) res.status(500).send(err.message);
    }
  }

  async actualizar(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const registro = await Category.findOneBy({ id: Number(id) });
      if (!registro) {
        throw new Error("Categoria no encontrada");
      }
      await Category.update({ id: Number(id) }, req.body);

      const registroActualizado = await Category.findOne({
        where: { id: Number(id) },
        relations: { products: true },
      });
      res.status(200).json(registroActualizado);
    } catch (err) {
      if (err instanceof Error) res.status(500).send(err.message);
    }
  }

  async borrar(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const registro = await Category.findOneBy({ id: Number(id) });
      if (!registro) {
        throw new Error("Categoria no encontrada");
      }
      await Category.delete({ id: Number(id) });
      res.status(204).send();
    } catch (err) {
      if (err instanceof Error) res.status(500).send(err.message);
    }
  }
}

export default new CategoryController();
