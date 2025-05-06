import express from "express";
import cors from "cors";
import morgan from "morgan";
import categoryRoutes from "./routes/CategoryRoutes";
import productRoutes from "./routes/ProductRoutes";
import usuarioRoutes from "./routes/UserRoutes"
import addressRoutes from "./routes/AddressRoutes"
import path from "path";

const app = express();

app.use("/public", express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());



app.use("/categories", categoryRoutes);
app.use("/product", productRoutes);
app.use("/user", usuarioRoutes);
app.use("/address", addressRoutes);

export default app;
