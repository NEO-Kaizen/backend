import express from "express";
import router from "./router.ts";
import cors from "cors";
import { errorHandler } from "./shared/middleware/errorHandler.ts";
import Config from "./configs.ts";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: Config.CORS_ORIGINS,
    credentials: true,
  }),
);

app.disable("x-powered-by");

app.use(cookieParser());

app.use(express.json());

app.use(router);

//rotas sempre acima disso:
app.use(errorHandler);
export { app };
