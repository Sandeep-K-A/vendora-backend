import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Role, User } from "@prisma/client";
import { env } from "../../lib/env";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middlewares/errorHandler";
import { RegisterInput, LoginInput } from "./auth.schema";

type AuthResponse = {
  user: Omit<User, "password">;
  accessToken: string;
  refreshToken: string;
};

function generateAccessToken(userId: string, role: Role): string {
  return jwt.sign({ userId, role }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

async function generateAuthTokens(user: User): Promise<AuthResponse> {
  //1.Generate tokens
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  //2.Store refresh token in database with expiry
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  //3.Return user without password + tokens
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
}

export async function register(data: RegisterInput): Promise<AuthResponse> {
  //1.Check if the email exist
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError("Email already in use", 409);
  }

  //2.Hash the password with  industry standard 12 salt rounds
  const hashedPassword = await bcrypt.hash(data.password, 12);

  //3.Create user and seller in one transaction to ensure atomicity
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      },
    });

    //4.If the role is SELLER create the seller record automatically
    if (data.role === "SELLER") {
      await tx.seller.create({
        data: { userId: newUser.id },
      });
    }
    return newUser;
  });
  return generateAuthTokens(user);
}

export async function login(data: LoginInput): Promise<AuthResponse> {
  //1.Find user by email
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  //2.Check user exist and password is correct
  const isPasswordValid = user
    ? await bcrypt.compare(data.password, user.password)
    : false;

  if (!user || !isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  return generateAuthTokens(user);
}
