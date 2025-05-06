import express from "express";
import CategoryController from "../controllers/CategoryController";
import PedidoController from "../controllers/PedidoController";
const router = express.Router();

router.get("/", (req , res) => { PedidoController.consultar(req , res)} );

router.post("/", (req,res)=>{ PedidoController.ingresar(req,res)});

router
  .route("/:id")
  .get((req, res) => {PedidoController.consultarDetalle(req, res)})
  .put((req,res) => {PedidoController.actualizar(req, res);})
  .delete(CategoryController.borrar);

export default router;
