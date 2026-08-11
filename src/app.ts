import express from "express";
import { errorHandler } from "./shared/middleware/errorHandler.ts";

const app = express();
app.disable("x-powered-by");
app.use(express.json());







//rotas sempre acima disso:
app.use(errorHandler);
export { app };
