import express from "express";
import { errorHandler } from "./shared/middleware/errorHandler.ts";

const app = express();
app.use(express.json());
app.use(errorHandler);
export { app };
