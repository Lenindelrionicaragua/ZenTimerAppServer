import dotenv from "dotenv";
import { logInfo } from "./util/logging";
dotenv.config({ path: ".env.test" });

jest.setTimeout(100000);

logInfo("Loaded RESEND_API_KEY:", process.env.RESEND_API_KEY);
