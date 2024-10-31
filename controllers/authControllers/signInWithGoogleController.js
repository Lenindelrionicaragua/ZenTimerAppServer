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

  const client = clients[platform];
  if (!client) {
    logError(`Invalid platform specified: ${platform}`);
    return res.status(400).json({ error: `Invalid platform: ${platform}` });
  }

  // Special handling for web platform
  if (platform === "Web") {
    if (!token) {
      try {
        const { email, name, picture } = req.body;
        let user = await User.findOne({ email });

        if (!user) {
          const password = await bcrypt.hash("defaultPassword", 10);
          user = new User({ name, email, picture, password });
          await user.save();
          await sendWelcomeEmail(user);
          logInfo(`New Web user created: ${user.email}`);
        }

        const jwtToken = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET,
          {
            expiresIn: "72h",
          }
        );
        res.cookie("session", jwtToken, { httpOnly: true });

        try {
          await autoCreateDefaultCategories(user._id);
        } catch (categoryError) {
          logError(
            `Failed to create categories for new user: ${categoryError.message}`
          );
        }

        const responseData = {
          success: true,
          message: "User signed in successfully",
          token: jwtToken,
          user: {
            name: user.name,
            email: user.email,
            picture: user.picture,
          },
        };
        return res.status(200).json(responseData);
      } catch (error) {
        logError("Error during Web sign-in process: " + error.message);
        return res
          .status(500)
          .json({ error: "Error signing in with Google for Web" });
      }
    } else {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        const responseData = {
          success: true,
          message: "User is already signed in",
          user: {
            name: user.name,
            email: user.email,
            picture: user.picture,
          },
        };
        logInfo(`SignIn response: ${JSON.stringify(responseData)}`);
        return res.status(200).json(responseData);
      } catch (error) {
        logError("Error verifying token for Web sign-in: " + error.message);
        return res.status(401).json({ error: "Invalid token" });
      }
    }
  }

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

    try {
      await autoCreateDefaultCategories(user._id);
    } catch (categoryError) {
      logError(`Failed to create categories: ${categoryError.message}`);
    }

    const responseData = {
      success: true,
      message: "User signed in successfully",
      token: jwtToken,
      user: {
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    };
    return res.status(200).json(responseData);
  } catch (error) {
    logError("Sign-in error: " + error.message);
    return res.status(500).json({ error: "Error during sign-in process" });
  }
};
