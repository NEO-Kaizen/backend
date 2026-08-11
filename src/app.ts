import express from "express";
import router from "./router.ts";
import { errorHandler } from "./shared/middleware/errorHandler.ts";

const app = express();

app.disable("x-powered-by");
app.use(express.json());

app.use(router);







//rotas sempre acima disso:
app.use(errorHandler);
export { app };
