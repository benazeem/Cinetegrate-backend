import { Router } from "express";
import { default as authRouter } from "@modules/auth/auth.routes.js";
import { authMiddleware } from "@middleware/auth/requireAuth.js";
import { default as userRouter } from "@modules/user/user.routes.js";
import { default as projectRouter } from "@modules/project/project.routes.js";
import { paginationAndSortingMiddleware } from "@middleware/paginationAndSorting.js";
import { blockBannedAccounts } from "@middleware/security/accountStatusMiddleware.js";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use(authMiddleware, blockBannedAccounts);
apiRouter.use("/user", userRouter);
apiRouter.use(
  "/projects",
  authMiddleware,
  paginationAndSortingMiddleware,
  projectRouter
);

export default apiRouter;
