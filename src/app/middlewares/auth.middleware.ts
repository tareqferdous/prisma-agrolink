import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        isVerified: boolean;
        isBanned: boolean;
        walletBalance: number;
      };
    }
  }
}

export function requireAuth(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (!session?.user) {
        res.status(401).json({ error: "Unauthorized — please login" });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isVerified: true,
          isBanned: true,
          walletBalance: true,
        },
      });

      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }

      if (user.isBanned) {
        res.status(403).json({ error: "Account has been banned" });
        return;
      }

      if (roles.length > 0 && !roles.includes(user.role)) {
        res.status(403).json({
          error: `Access denied — requires role: ${roles.join(" or ")}`,
        });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ error: "Invalid session" });
    }
  };
}

export function requireVerified(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.user.role === "ADMIN") {
    next();
    return;
  }

  if (!req.user.isVerified) {
    res.status(403).json({
      error: "Account not yet verified by admin",
    });
    return;
  }

  next();
}
