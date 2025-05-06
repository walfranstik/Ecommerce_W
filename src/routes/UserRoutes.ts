import express from "express";
import UserController from "../controllers/UserController";
const router = express.Router();

router.get("/", (req,res)=>{UserController.consultar(req,res)});

router.post("/", (req,res)=>{UserController.ingresar(req,res)});

router
  .route("/:id")
  .get((req,res)=>{UserController.consultarDetalle(req,res)})
  .put((req,res)=>{UserController.actualizar(req,res)})
  .delete((req,res)=>{
    UserController.borrar(req, res);
  });

export default router;
