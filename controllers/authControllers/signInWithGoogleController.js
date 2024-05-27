import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../../models/userModels.js";
import { logError, logInfo } from "../../util/logging.js";

const clients = {
  web: new OAuth2Client(process.env.GOOGLE_CLIENT_ID_WEB),
  iOS: new OAuth2Client(process.env.GOOGLE_CLIENT_ID_IOS),
  Android: new OAuth2Client(process.env.GOOGLE_CLIENT_ID_ANDROID),
  Expo: new OAuth2Client(process.env.GOOGLE_CLIENT_ID_EXPO),
};

export const signInWithGoogleController = async (req, res) => {
  const { token, platform } = req.body;
  console.log("Received request with token and platform:", token, platform);

  const client = clients[platform];
  if (!client) {
    console.error("Invalid platform:", platform);
    return res.status(400).send({ error: "Invalid platform" });
  }

  try {
    console.log("Verifying token with Google...");
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env[`GOOGLE_CLIENT_ID_${platform.toUpperCase()}`],
    });
    console.log("Token verified successfully");

    const payload = ticket.getPayload();
    console.log("Token payload:", payload);

    const { name, email, picture } = payload;
    console.log(
      "Extracted user details - Name:",
      name,
      "Email:",
      email,
      "Picture:",
      picture
    );

    let user = await User.findOne({ email });
    if (!user) {
      console.log("User not found, creating a new user...");
      user = new User({ name, email, picture });
      await user.save();
    } else {
      console.log("User found:", user);
    }

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "72h", // Extender a 72 horas
    });
    console.log("JWT Token generated:", jwtToken);

    res.cookie("session", jwtToken, { httpOnly: true });
    console.log("Session cookie set");

    res
      .status(200)
      .send({ message: "User signed in successfully", token: jwtToken });
    console.log("Response sent successfully");
  } catch (error) {
    console.error("Error during sign-in process:", error);
    res.status(500).send({ error: "Error signing in with Google" });
  }
};
