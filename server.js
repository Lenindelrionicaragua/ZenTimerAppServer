import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import { logInfo, logError } from "./util/logging.js";
import connectDB from "./db/connectDB.js";
import testRouter from "./testRouters.js";

// The environment should set the port
const port = process.env.PORT;
if (port == null) {
  // If this fails, make sure you have created a `.env` file in the right place with the PORT set
  logError(new Error("Cannot find a PORT number, did you create a .env file?"));
}

const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      logInfo(`Server started on port ${port}`);
    });
  } catch (error) {
    logError(error);
  }
};

// For cypress we want to provide an endpoint to seed our data
if (process.env.NODE_ENV !== "production") {
  app.use("/api/test", testRouter);
}
// Start the server
startServer();
