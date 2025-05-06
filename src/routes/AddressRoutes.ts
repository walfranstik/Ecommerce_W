import express from "express";
import AddressController from "../controllers/AddressController";
const router = express.Router();

router.get("/", (req,res)=>{AddressController.consultar(req,res)});

router.post("/", (req,res)=>{AddressController.ingresar(req, res);});

router
  .route("/:id")
  .get((req,res)=>{AddressController.consultarDetalle(req, res);})
  .put((req,res)=>{AddressController.actualizar(req, res);})
  .delete((req,res)=>{AddressController.borrar(req, res);});

export default router;
