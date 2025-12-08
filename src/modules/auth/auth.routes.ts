import { Router } from "express";
import {
  forgotPasswordController,
  loginController,
  registerController,
  resetPasswordController,
} from "./auth.controller.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  validateBody,
} from "@validation/auth.schema.js";
import { asyncHandler } from "@utils/asyncHandler.js";

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

export default router;
