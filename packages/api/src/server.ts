import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error-handler.js";
import { config } from "./lib/config.js";
import { startScheduler } from "./jobs/scheduler.js";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan("combined"));
app.use(express.json());

// API routes
app.use("/api/v1", routes);

// Error handler
app.use(errorHandler);

// Start server
const port = config.port;
app.listen(port, () => {
  console.log(`Crypto Terminal API running on port ${port}`);
  console.log(`Environment: ${config.nodeEnv}`);

  // Start scheduler in production
  if (config.nodeEnv === "production") {
    startScheduler();
  }
});

export default app;
