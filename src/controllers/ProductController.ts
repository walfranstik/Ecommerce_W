import { Request, Response } from "express";
import { Product } from "../entities/Product";
import { Category } from "../entities/Category"; // Importa la entidad Category
import { ProductImage } from "../entities/ProductImage"; // Importa la entidad ProductImage
import { v4 as uuidv4 } from "uuid"; // Para generar nombres de archivo únicos
import path from "path";
import fs from "fs/promises"; // Para operaciones con el sistema de archivos
import { uploadImage, deleteImage } from "../utils/imageUpload"; // Funciones para subir y eliminar imágenes (asumimos que existen)
import { AppDataSource } from "../config/conexion_db";
import { productSchema } from "../schemas/product.schema";
import { number } from "zod";
import { In } from "typeorm/find-options/operator/In";

class ProductController {
  private productRepository = AppDataSource.getRepository(Product);
  private categoryRepository = AppDataSource.getRepository(Category);
  private imageRepository = AppDataSource.getRepository(ProductImage);
  private uploadDir = path.join(__dirname, "../../public/uploads/products"); // Directorio para guardar imágenes

  constructor() {
    // Crear el directorio de carga si no existe
    fs.mkdir(this.uploadDir, { recursive: true }).catch(console.error);
  }

  async consultar(req: Request, res: Response) {
    try {
      const products = await this.productRepository.find({
        relations: { categoria: true, imagenes: true },
      });
      res.status(200).json(products);
    } catch (err) {
      console.error("Error al consultar productos:", err);
      if (err instanceof Error) res.status(500).send(err.message);
      else res.status(500).send("Error desconocido al consultar productos.");
    }
  }

  async consultarDetalle(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const product = await this.productRepository.findOne({
        where: { id: Number(id) },
        relations: { categoria: true, imagenes: true },
      });
      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      res.status(200).json(product);
    } catch (err) {
      console.error(
        `Error al consultar detalle del producto con ID ${id}:`,
        err
      );
      if (err instanceof Error) res.status(500).send(err.message);
      else
        res
          .status(500)
          .send(
            `Error desconocido al consultar detalle del producto con ID ${id}.`
          );
    }
  }

  async ingresar(req: Request, res: Response) {
    try {
      const parsed = productSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
      }

      const data = parsed.data;
      const categoria = await this.categoryRepository.findOneBy({
        id: data.categoriaId,
      });
      if (!categoria) {
        return res.status(400).json({ message: "Categoría inválida" });
      }

      const newProduct = this.productRepository.create({
        ...data,
        categoria,
        imagenes: [],
      });

      const productSaved = await this.productRepository.save(newProduct);

      const uploadedImages: ProductImage[] = [];
      const files = req.files as Express.Multer.File[];
      let i = 0;
      for (const file of files) {
        const imageUrl = await uploadImage(
          file,
          "public/uploads/products",
          uuidv4()
        );
        i++;
        const newImage = this.imageRepository.create({
          url: imageUrl,
          product: productSaved,
          altText: productSaved.nombre + "-" + i,
        });

        uploadedImages.push(newImage);
      }

      await this.imageRepository.save(uploadedImages);

      productSaved.imagenes = uploadedImages;

      res.status(201).json(productSaved);
    } catch (err) {
      console.error("Error al ingresar producto:", err);
      res.status(500).send("Error interno");
    }
  }

  async actualizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = productSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
      }

      const data = parsed.data;

      const productoExistente = await this.productRepository.findOne({
        where: { id : Number(id) },
        relations: ["imagenes", "categoria"], // Cargar las imágenes y la categoría relacionadas
      });
       
      if (!productoExistente) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      // Validar la categoría si se está actualizando
      if (
        data.categoriaId &&
        data.categoriaId !== productoExistente.categoria.id
      ) {
        const nuevaCategoria = await this.categoryRepository.findOneBy({
          id: data.categoriaId,
        });
        if (!nuevaCategoria) {
          return res.status(400).json({ message: "Categoría inválida" });
        }
        productoExistente.categoria = nuevaCategoria;
      }
      

      // Actualizar los campos básicos del producto
      this.productRepository.merge(productoExistente, data);

      // --- Gestión de imágenes ---

      const files = req.files as Express.Multer.File[];
      const nuevasImagenes: ProductImage[] = [];
      let contadorNuevasImagenes = productoExistente.imagenes.length + 1; // Para generar altText único

      // 1. Subir nuevas imágenes (si las hay)
      for (const file of files) {
        const imageUrl = await uploadImage(
          file,
          "public/uploads/products",
          uuidv4()
        );
        const nuevaImagen = this.imageRepository.create({
          url: imageUrl,
          product: productoExistente,
          altText: productoExistente.nombre + "-" + contadorNuevasImagenes,
        });
        nuevasImagenes.push(nuevaImagen);
        contadorNuevasImagenes++;
      }

      if (nuevasImagenes.length > 0) {
        await this.imageRepository.save(nuevasImagenes);
        productoExistente.imagenes = [
          ...productoExistente.imagenes,
          ...nuevasImagenes,
        ];
      }
      const imagenesAEliminarIds = JSON.parse(req.body.imagenesAEliminar); // Cambiar el nombre para mayor claridad

      if (
        imagenesAEliminarIds &&
        Array.isArray(imagenesAEliminarIds) &&
        imagenesAEliminarIds.length > 0
      ) {
        const imagenesAEliminarEntidades = await this.imageRepository.findBy({
          id: In(imagenesAEliminarIds),
          product: { id: productoExistente.id }, // Asegurarse de que pertenecen al producto
        });

        if (imagenesAEliminarEntidades.length === imagenesAEliminarIds.length) {
          
          for (const imagen of imagenesAEliminarEntidades) {
            await deleteImage(imagen.url, "public/uploads/products");

          }
          await this.imageRepository.remove(imagenesAEliminarEntidades);
          productoExistente.imagenes = productoExistente.imagenes.filter(
            (img) => !imagenesAEliminarIds.includes(String(img.id))
          );
        } else {
          return res.status(400).json({
            message:
              "Algunas imágenes para eliminar no son válidas para este producto.",
          });
        }
      }
      await this.productRepository.save(productoExistente);
      
      res.status(200).json(productoExistente);
    } catch (err) {
      console.error("Error al actualizar producto:", err);
      const error={
        "error": err
      }
      res.status(500).json(error);
    }
  }
    async borrar(req: Request, res: Response) {
      const { id } = req.params;
      try {
        const productToDelete = await this.productRepository.findOne({
          where: { id: Number(id) },
          relations: { imagenes: true },
        });
        if (!productToDelete) {
          return res.status(404).json({ message: "Producto no encontrado" });
        }

        // Eliminar las imágenes asociadas del sistema de archivos y la base de datos
        for (const image of productToDelete.imagenes) {
          try {
            await deleteImage(image.url, this.uploadDir);
          } catch (deleteError) {
            console.error(
              `Error al eliminar la imagen ${image.url}:`,
              deleteError
            );
            return res
              .status(500)
              .json({ message: `Error al eliminar la imagen ${image.url}.` });
          }
        }

        await this.productRepository.remove(productToDelete);
        res.status(204).send(); // 204 No Content para indicar éxito sin cuerpo
      } catch (err) {
        console.error(`Error al borrar producto con ID ${id}:`, err);
        if (err instanceof Error) res.status(500).send(err.message);
        else
          res
            .status(500)
            .send(`Error desconocido al borrar producto con ID ${id}.`);
      }
    }
}

export default new ProductController();
