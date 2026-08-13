import express from "express";
import cookieParser from "cookie-parser";
import { errorHandler } from "./shared/middleware/errorHandler.ts";

const app = express();
app.disable("x-powered-by");
app.use(express.json());
app.use(cookieParser());







//rotas sempre acima disso:
app.use(errorHandler);
export { app };
