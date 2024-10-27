import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcrypt";
import User from "../../models/userModels.js";
import { logError, logInfo } from "../../util/logging.js";
import { sendWelcomeEmail } from "./emailWelcomeController.js";
import { autoCreateDefaultCategories } from "../../util/autoCreateDefaultCategories.js";

// OAuth2 clients
const clients = {
  Web: new OAuth2Client(process.env.GOOGLE_CLIENT_ID_WEB),
  iOS: new OAuth2Client(process.env.GOOGLE_CLIENT_ID_IOS),
  Android: new OAuth2Client(process.env.GOOGLE_CLIENT_ID_ANDROID),
  Expo: new OAuth2Client(process.env.GOOGLE_CLIENT_ID_EXPO),
};

export const signInWithGoogleController = async (req, res) => {
  const { token, platform } = req.body;
  logInfo(`Received request with token and platform: ${token}, ${platform}`);

  const client = clients[platform];
  if (!client) {
    logError("Invalid platform: " + platform);
    return res.status(400).json({ error: "Invalid platform" });
  }

  let isNewUser = false; // Track if a new user is being created

  // Special handling for web platform in development/testing
  if (platform === "Web" && !token) {
    try {
      const { email, name, picture } = req.body;

      // Check if user already exists
      let user = await User.findOne({ email });
      if (!user) {
        logInfo("User not found, creating a new user for Web platform...");
        const password = await bcrypt.hash("defaultPassword", 10); // Hash a default password
        user = new User({ name, email, picture, password });
        await user.save();
        isNewUser = true;

        await sendWelcomeEmail(user, res);
        logInfo(`User created successfully: ${user.email}`);
      } else {
        logInfo("User found for Web platform: " + user);
      }

      // Generate JWT token
      const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "72h",
      });
      logInfo("JWT Token generated for Web platform: " + jwtToken);

      // Set the session cookie
      res.cookie("session", jwtToken, { httpOnly: true });
      logInfo("Session cookie set for Web platform");

      // Create default categories if this is a new user
      if (isNewUser) {
        try {
          await autoCreateDefaultCategories(user._id);
        } catch (categoryError) {
          logError(
            `Error creating default categories for new user: ${categoryError.message}`
          );
          return res.status(201).json({
            success: true,
            message:
              "User signed in successfully, but there was an issue creating default categories.",
            token: jwtToken,
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: "User signed in successfully",
        token: jwtToken,
      });
    } catch (error) {
      logError("Error during Web sign-in process: " + error.message);
      return res
        .status(500)
        .json({ error: "Error signing in with Google for Web" });
    }
  }

  // Handling for mobile platforms (iOS, Android, Expo)
  if (!token) {
    logError("idToken from Google is missing for platform: " + platform);
    return res.status(400).json({ error: "idToken from Google is missing." });
  }

  try {
    logInfo("Verifying token with Google for platform: " + platform);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env[`GOOGLE_CLIENT_ID_${platform.toUpperCase()}`],
    });
    logInfo("Token verified successfully for platform: " + platform);

    const payload = ticket.getPayload();
    logInfo(
      "Token payload for platform " + platform + ": " + JSON.stringify(payload)
    );

    const { name, email, picture } = payload;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (!user) {
      logInfo("User not found, creating a new user for platform: " + platform);
      user = new User({ name, email, picture });
      await user.save();
      isNewUser = true;

      await sendWelcomeEmail(user, res);
      logInfo(`User created successfully: ${user.email}`);
    } else {
      logInfo("User found for platform: " + platform + ": " + user);
    }

    // Generate JWT token
    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "72h",
    });
    logInfo("JWT Token generated for platform: " + platform + ": " + jwtToken);

    // Set the session cookie
    res.cookie("session", jwtToken, { httpOnly: true });
    logInfo("Session cookie set for platform: " + platform);

    // Create default categories if this is a new user
    if (isNewUser) {
      try {
        await autoCreateDefaultCategories(user._id);
      } catch (categoryError) {
        logError(
          `Error creating default categories for new user: ${categoryError.message}`
        );
        return res.status(201).json({
          success: true,
          message:
            "User signed in successfully, but there was an issue creating default categories.",
          token: jwtToken,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "User signed in successfully",
      token: jwtToken,
    });
  } catch (error) {
    logError(
      "Error during sign-in process for platform: " +
        platform +
        ": " +
        error.message
    );
    return res.status(500).json({ error: "Error signing in with Google" });
  }
};
