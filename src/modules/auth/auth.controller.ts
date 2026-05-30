import type { Request, Response, NextFunction } from "express";
import { loginSchema, registerSchema } from "./auth.schema";
import { login, logout, refresh, register } from "./auth.service";
import { AppError } from "../../middlewares/errorHandler";

function setRefreshTokenCookie(res: Response, token: string) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
}

export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);
    const result = await register(data);

    //Set refresh token as httpOnly cookie
    setRefreshTokenCookie(res, result.refreshToken);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);
    const result = await login(data);

    //Set refresh token as httpOnly cookie
    setRefreshTokenCookie(res, result.refreshToken);

    res.status(201).json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies.refreshToken as string | undefined;

    if (!token) {
      throw new AppError("Refresh token missing", 401);
    }

    const result = await refresh(token);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies.refreshToken as string | undefined;

    if (token) {
      await logout(token);
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
}
