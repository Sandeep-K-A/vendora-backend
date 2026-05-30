import type { Request, Response, NextFunction } from "express";
import { loginSchema, registerSchema } from "./auth.schema";
import { login, register } from "./auth.service";
import { success } from "zod";

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
) {
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
) {
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
