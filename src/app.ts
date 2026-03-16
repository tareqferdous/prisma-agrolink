import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import { envVars } from "./app/config/env";
import { auth } from "./app/lib/auth";
import { globalErrorHandler } from "./app/middlewares/globalErrorhandler";
import { notFound } from "./app/middlewares/notFound";
import { authRoutes } from "./app/modules/auth/auth.router";
import { bidsRoutes } from "./app/modules/bids/bids.route";
import { listingRoutes } from "./app/modules/listing/listings.route";
import { ordersRoutes } from "./app/modules/orders/orders.route";
import { userRoutes } from "./app/modules/users/users.route";

const app: Application = express();

// Better Auth routes
app.all("/api/auth/sign-in/*splat", toNodeHandler(auth));
app.all("/api/auth/sign-up/*splat", toNodeHandler(auth));
app.all("/api/auth/sign-out/*splat", toNodeHandler(auth));
app.all("/api/auth/session/*splat", toNodeHandler(auth));
app.all("/api/auth/callback/*splat", toNodeHandler(auth));

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

// application routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api", bidsRoutes);
app.use("/api/orders", ordersRoutes);

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
