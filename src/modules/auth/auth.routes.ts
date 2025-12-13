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
  validateBody,
  verifyEmailSchema,
} from "@validation/auth.schema.js";
import { asyncHandler } from "@utils/asyncHandler.js";
import { requireAuth as auth } from "@middleware/auth/requireAuth.js";

const router = Router();

// POST /api/auth/register
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

router.post("/refresh-token", asyncHandler(refreshTokenController));

router.post(
  "/email/verification",
  auth,
  asyncHandler(emailVerificationController)
);

router.post(
  "/email/verify",
  validateBody(verifyEmailSchema),
  asyncHandler(verifyEmailController)
);

router.post(
  "/email/verify-change",
  validateBody(verifyEmailSchema),
  asyncHandler(verifyEmailChangeController)
)

router.post("/logout", asyncHandler(logoutController));

export default router;
