import express from "express";
import router from "./router.ts";
import cors from "cors";
import { errorHandler } from "./shared/middleware/errorHandler.ts";
import Config from "./configs.ts";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerDocs from "./swagger.json" with { type: "json" };
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

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
//rotas sempre acima disso:
app.use(errorHandler);

export { app };
