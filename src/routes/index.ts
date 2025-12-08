import { Router } from "express";
import  router from "@modules/auth/auth.routes.js";

const apiRouter = Router();

apiRouter.use("/auth", router)

export default apiRouter;
