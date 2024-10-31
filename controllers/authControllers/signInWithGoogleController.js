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

  // if (!token || !platform) {
  //   logError("Platform or token missing in request. Platform: " + platform);
  //   return res.status(400).json({ error: "Platform or token missing" });
  // }

  const client = clients[platform];
  if (!client) {
    logError(`Invalid platform specified: ${platform}`);
    return res.status(400).json({ error: `Invalid platform: ${platform}` });
  }

  let isNewUser = false;

  // Special handling for web platform in development/testing
  if (platform === "Web" && !token) {
    // Handle sign in without a token for web in testing
    try {
      const { email, name, picture } = req.body;
      let user = await User.findOne({ email });

      if (!user) {
        const password = await bcrypt.hash("defaultPassword", 10);
        user = new User({ name, email, picture, password });
        await user.save();
        isNewUser = true;

        await sendWelcomeEmail(user);
        logInfo(`New Web user created: ${user.email}`);
      }

      const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "72h",
      });
      res.cookie("session", jwtToken, { httpOnly: true });

      if (isNewUser) {
        try {
          await autoCreateDefaultCategories(user._id);
        } catch (categoryError) {
          logError(
            `Failed to create categories for new user: ${categoryError.message}`
          );
          return res.status(201).json({
            success: true,
            message:
              "User signed in successfully, but default categories could not be created.",
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
    logError("Google idToken missing for mobile platform");
    return res.status(400).json({ error: "idToken from Google is missing." });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env[`GOOGLE_CLIENT_ID_${platform.toUpperCase()}`],
    });

    const { name, email, picture } = ticket.getPayload();
    let user = await User.findOne({ email });

    try {
      if (!user) {
        user = new User({ name, email, picture });
        await user.save();
        isNewUser = true;
        await sendWelcomeEmail(user);
      }
    } catch (userError) {
      logError("User creation error: " + userError.message);
      return res.status(500).json({ error: "User creation error" });
    }

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "72h",
    });

    res.cookie("session", jwtToken, { httpOnly: true });

    if (isNewUser) {
      try {
        await autoCreateDefaultCategories(user._id);
      } catch (categoryError) {
        logError(`Failed to create categories: ${categoryError.message}`);
        return res.status(201).json({
          success: true,
          message:
            "User signed in, but default categories could not be created.",
          token: jwtToken,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "User signed in successfully",
      token: jwtToken,
      user: {
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    });
  } catch (error) {
    logError("Sign-in error: " + error.message);
    return res.status(500).json({ error: "Error during sign-in process" });
  }
};
