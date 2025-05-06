import express from "express";
import ProductController from "../controllers/ProductController";
import path from "path";
import fs from "fs";
import upload from "../middlewares/multer";
const router = express.Router();


router.get("/", (req, res) => {ProductController.consultar(req,res)});

router.get("/formularioingresar", (req, res) => {
  const filePath = path.join(__dirname, "../utils/formulario.html");

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("Formulario no encontrado.");
  }
});

// Ruta para servir el formulario HTML (opcional, si quieres una página dedicada)
router.get('/editar', (req, res) => {
    // Aquí podrías buscar la información del producto por ID y pasarla al template HTML
    // para mostrar los datos actuales y las imágenes existentes.
    const filePath = path.join( __dirname,"../utils/actualizar-formulario.html");
    console.log(filePath);
    console.log("filePath");
     if (fs.existsSync(filePath)) {
       res.sendFile(filePath);
     } else {
       res.status(404).send("Formulario no encontrado.");
     }
});


router.post(
  "/",
  upload.array("imagen-producto", 5),
(req, res) => {ProductController.ingresar(req, res)});

router
  .route("/:id")
  .get((req, res) => {
    ProductController.consultarDetalle(req, res);
  })
  .put(upload.array("nuevasImagenes", 5), (req, res) => {
    ProductController.actualizar(req, res);
  })
  .delete((req,res) =>{ProductController.borrar(req,res) });

export default router;
