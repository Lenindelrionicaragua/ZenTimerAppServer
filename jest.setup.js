import dotenv from "dotenv";
import { logInfo } from "./src/util/logging";
dotenv.config({ path: ".env.test" });

jest.setTimeout(60000);

logInfo("Loaded RESEND_API_KEY:", process.env.RESEND_API_KEY);
