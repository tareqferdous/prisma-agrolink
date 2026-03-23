import { Server } from "http";
import app from "./app";
import { envVars } from "./app/config/env";

let server: Server;

const shutdown = (reason: string, exitCode: number) => {
  console.log(`${reason}. Shutting down server...`);

  if (server) {
    server.close(() => {
      console.log("Server closed gracefully.");
      process.exit(exitCode);
    });
    return;
  }

  process.exit(exitCode);
};

const bootstrap = () => {
  try {
    server = app.listen(envVars.PORT, () => {
      console.log(`Server is running on http://localhost:${envVars.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    shutdown("Failed to start server", 1);
  }
};

// SIGTERM signal handler
process.on("SIGTERM", () => {
  shutdown("SIGTERM signal received", 0);
});

// SIGINT signal handler
process.on("SIGINT", () => {
  shutdown("SIGINT signal received", 0);
});

// Uncaught exception handler
process.on("uncaughtException", (error) => {
  console.log("Uncaught Exception Detected", error);
  shutdown("Uncaught exception", 1);
});

// Unhandled rejection handler
process.on("unhandledRejection", (error) => {
  console.log("Unhandled Rejection Detected", error);
  shutdown("Unhandled rejection", 1);
});

bootstrap();
