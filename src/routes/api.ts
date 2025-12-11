import { Router } from "express";
import { default as authRouter } from "@modules/auth/auth.routes.js";
import { default as userRouter } from "@modules/user/user.routes.js";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/user", userRouter);

export default apiRouter;
