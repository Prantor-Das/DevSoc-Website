import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
  CREATED,
  OK,
  BAD_REQUEST,
  UNAUTHORIZED,
  CONFLICT,
  NOT_FOUND,
} from "../utils/http.js";
import {
  RegisterSchema,
  LoginSchema,
  UpdateProfileSchema,
} from "../validator/auth.validator.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserProfile,
} from "../services/user.service.js";
import {
  createLocalAccount,
  findCredentialsByEmail,
} from "../services/account.service.js";
import {
  createSession,
  invalidateSessionByToken,
  findValidSessionByRefreshToken,
} from "../services/session.service.js";
import { hashPassword, verifyPassword } from "../libs/crypto.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../libs/jwt.js";
import { setAuthCookies, clearAuthCookies } from "../libs/cookie.js";
import { prisma } from "../libs/db.js";
import { syncUserToConvex } from "../libs/convex.js";

function buildAuthPayload(
  u: { id: string; role: "USER" | "ADMIN" | "SUBCOMMITTEE" },
  sid?: string
) {
  return { sub: u.id, role: u.role, ...(sid && { sid }) };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success)
    throw new ApiError(
      BAD_REQUEST,
      parsed.error.issues.map((e) => e.message).join(", ")
    );

  const { name, email, password, image } = parsed.data;

  const existing = await findUserByEmail(email.toLowerCase());
  if (existing) throw new ApiError(CONFLICT, "Email already registered");

  // Create user and account in a transaction
  const user = await prisma.$transaction(async (tx) => {
    const createUser = await tx.user.create({
      data: { name, email: email.toLowerCase(), image: image ?? null },
    });
    const passwordHash = await hashPassword(password);
    await tx.account.create({
      data: {
        userId: createUser.id,
        providerId: "credentials",
        accountId: createUser.id,
        password: passwordHash,
      },
    });
    return createUser;
  });

  // Sync to Convex (async, but don't block the response)
  syncUserToConvex(user).catch((error) => {
    console.error("Failed to sync user to Convex:", error);
    // Don't throw - this is a background operation
  });

  const access = signAccessToken(buildAuthPayload(user));
  const refresh = signRefreshToken(buildAuthPayload(user));
  const refreshExp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const accessExp = new Date(Date.now() + 15 * 60 * 60 * 1000);

  await prisma.account.updateMany({
    where: { userId: user.id, providerId: "credentials" },
    data: {
      refreshToken: refresh,
      refreshTokenExpiresAt: refreshExp,
      accessToken: access,
      accessTokenExpiresAt: accessExp,
    },
  });

  await createSession(
    user.id,
    refresh,
    refreshExp,
    req.ip,
    req.get("User-Agent") ?? undefined
  );

  setAuthCookies(res, access, refresh);
  return res.status(CREATED).json(
    new ApiResponse(
      CREATED,
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        },
      },
      "User registered successfully"
    )
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success)
    throw new ApiError(
      BAD_REQUEST,
      parsed.error.issues.map((e) => e.message).join(", ")
    );
  const { email, password } = parsed.data;

  const account = await findCredentialsByEmail(email.toLowerCase());
  if (!account || !account.password)
    throw new ApiError(UNAUTHORIZED, "Invalid credentials");

  const ok = await verifyPassword(password, account.password);
  if (!ok) throw new ApiError(UNAUTHORIZED, "Invalid credentials");

  const user = account.user;
  const access = signAccessToken(buildAuthPayload(user));
  const refresh = signRefreshToken(buildAuthPayload(user));
  const refreshExp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const accessExp = new Date(Date.now() + 15 * 60 * 60 * 1000);

    await prisma.account.updateMany({
    where: { userId: user.id, providerId: "credentials" },
    data: {
      refreshToken: refresh,
      refreshTokenExpiresAt: refreshExp,
      accessToken: access,
      accessTokenExpiresAt: accessExp,
    },
  });

  await createSession(
    user.id,
    refresh,
    refreshExp,
    req.ip,
    req.get("User-Agent") ?? undefined
  );

  setAuthCookies(res, access, refresh);
  return res.status(OK).json(
    new ApiResponse(
      OK,
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        },
      },
      "User logged in successfully"
    )
  );
});

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.cookies?.refresh_token;
    if (!token) throw new ApiError(UNAUTHORIZED, "Missing refresh token");

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new ApiError(UNAUTHORIZED, "Invalid refresh token");
    }

    const session = await findValidSessionByRefreshToken(token);
    if (!session || session.userId !== payload.sub)
      throw new ApiError(UNAUTHORIZED, "Session invalid or expired");

    const user = session.user;
    const newAccess = signAccessToken(buildAuthPayload(user, session.id));
    const newRefresh = signRefreshToken(buildAuthPayload(user, session.id));
    const refreshExp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // rotate: delete old, create new
    await prisma.$transaction(async (tx) => {
      await tx.session.delete({ where: { id: session.id } });
      await tx.session.create({
        data: {
          userId: user.id,
          token: newRefresh,
          expiresAt: refreshExp,
          ipAddress: req.ip || null,
          userAgent: req.get("User-Agent") || null,
        },
      });
    });

    setAuthCookies(res, newAccess, newRefresh);
    return res.status(OK).json(new ApiResponse(OK, null, "Token refreshed"));
  }
);

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new ApiError(UNAUTHORIZED, "Unauthorized");
  const user = await findUserById(req.auth.userId);
  if (!user) throw new ApiError(NOT_FOUND, "User not found");
  return res.status(OK).json(
    new ApiResponse(
      OK,
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        },
      },
      "User profile fetched successfully"
    )
  );
});

export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new ApiError(UNAUTHORIZED, "Unauthorized");

    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success)
      throw new ApiError(
        BAD_REQUEST,
        parsed.error.issues.map((e) => e.message).join(", ")
      );

    const updateData: { name?: string; image?: string | null } = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.image !== undefined) updateData.image = parsed.data.image;

    const updated = await updateUserProfile(req.auth.userId, updateData);
    // sync name/image to Convex (async, but don't block the response)
    syncUserToConvex(updated).catch((error) => {
      console.error("Failed to sync user to Convex:", error);
      // Don't throw - this is a background operation
    });

    return res.status(OK).json(
      new ApiResponse(
        OK,
        {
          user: {
            id: updated.id,
            email: updated.email,
            name: updated.name,
            image: updated.image,
          },
        },
        "User profile updated successfully"
      )
    );
  }
);

export const deleteProfile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new ApiError(UNAUTHORIZED, "Unauthorized");
    await prisma.$transaction(async (tx) => {
      await tx.session.deleteMany({ where: { userId: req.auth!.userId } });
      await tx.account.deleteMany({ where: { userId: req.auth!.userId } });
      await tx.user.delete({ where: { id: req.auth!.userId } });
    });
    clearAuthCookies(res);
    return res
      .status(OK)
      .json(new ApiResponse(OK, null, "User profile deleted successfully"));
  }
);

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refresh_token;
  if (token) await invalidateSessionByToken(token);
  clearAuthCookies(res);
  return res
    .status(OK)
    .json(new ApiResponse(OK, null, "User logged out successfully"));
});