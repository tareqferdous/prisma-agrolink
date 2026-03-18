import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import { envVars } from "./app/config/env";
import { auth } from "./app/lib/auth";
import { globalErrorHandler } from "./app/middlewares/globalErrorhandler";
import { notFound } from "./app/middlewares/notFound";
import { adminRoutes } from "./app/modules/admin/admin.route";
import { authRoutes } from "./app/modules/auth/auth.router";
import { bidsRoutes } from "./app/modules/bids/bids.route";
import { listingRoutes } from "./app/modules/listing/listings.route";
import { ordersRoutes } from "./app/modules/orders/orders.route";
import {
  orderReviewRouter,
  userReviewRouter,
} from "./app/modules/reviews/reviews.router";
import { userRoutes } from "./app/modules/users/users.route";
import { walletRoutes } from "./app/modules/wallet/waller.router";

const app: Application = express();

app.use(
  cors({
    origin: [
      envVars.FRONTEND_URL,
      envVars.BETTER_AUTH_URL,
      "http://localhost:3000",
      "http://localhost:5000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Better Auth routes
app.all("/api/auth/sign-in/*splat", toNodeHandler(auth));
app.all("/api/auth/sign-up/*splat", toNodeHandler(auth));
app.all("/api/auth/sign-out/*splat", toNodeHandler(auth));
app.all("/api/auth/get-session", toNodeHandler(auth));
app.all("/api/auth/session/*splat", toNodeHandler(auth));
app.all("/api/auth/callback/*splat", toNodeHandler(auth));

// application routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api", bidsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/orders/:id/review", orderReviewRouter);
app.use("/api/users/:id/reviews", userReviewRouter);
app.use("/api/admin", adminRoutes);

// Basic route
app.get("/", async (req: Request, res: Response) => {
  res.status(201).json({
    success: true,
    message: "API is working",
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
