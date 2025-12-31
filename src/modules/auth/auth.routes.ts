import { Router } from "express";
import {
  forgotPasswordController,
  loginController,
  refreshTokenController,
  registerController,
  resetPasswordController,
  logoutController,
  emailVerificationController,
  verifyEmailController,
  verifyEmailChangeController,
} from "./auth.controller.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyUpdateEmailSchema,
} from "@validation/auth.schema.js";
import { validateBody } from "@validation/validateBody.js";
import { asyncHandler } from "@utils/asyncHandler.js";
import { authMiddleware } from "@middleware/auth/requireAuth.js";
import { csrfMiddleware } from "@middleware/security/requireCsrf.js";
import { requireActiveAccount } from "@middleware/security/accountStatusMiddleware.js";

const router = Router();

router.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(registerController)
);

router.post("/login", validateBody(loginSchema), asyncHandler(loginController));
router.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  asyncHandler(forgotPasswordController)
);

router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  asyncHandler(resetPasswordController)
);

router.post(
  "/refresh-token",
  csrfMiddleware,
  asyncHandler(refreshTokenController)
);

router.post(
  "/email/verification",
  authMiddleware,
  requireActiveAccount,
  asyncHandler(emailVerificationController)
);

router.post(
  "/email/verify",
  authMiddleware,
  requireActiveAccount,
  validateBody(verifyEmailSchema),
  asyncHandler(verifyEmailController)
);

router.post(
  "/email/verify-change",
  authMiddleware,
  requireActiveAccount,
  validateBody(verifyUpdateEmailSchema),
  asyncHandler(verifyEmailChangeController)
);

router.post(
  "/logout",
  authMiddleware,
  csrfMiddleware,
  asyncHandler(logoutController)
);

export default router;
