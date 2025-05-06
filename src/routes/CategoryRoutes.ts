import express from "express";
import CategoryController from "../controllers/CategoryController";
const router = express.Router();

router.get("/", CategoryController.consultar);

router.post("/", CategoryController.ingresar);

router
  .route("/:id")
  .get(CategoryController.consultarDetalle)
  .put(CategoryController.actualizar)
  .delete(CategoryController.borrar);

export default router;
