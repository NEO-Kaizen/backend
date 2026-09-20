import express from "express";
import path from "node:path";
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

// Serve uploaded portal assets publicly (GET /uploads/*) - no auth, matches GET /portal-config public behavior
app.use("/uploads", express.static(path.resolve(Config.UPLOAD_DIR), { fallthrough: false }));

app.use(express.json());

app.use(router);

//rotas sempre acima disso:
app.use(errorHandler);
export { app };
