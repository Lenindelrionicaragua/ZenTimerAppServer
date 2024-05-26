import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../../models/userModels.js";
import { logError, logInfo } from "../../util/logging.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const signInWithGoogleController = async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, picture } = ticket.getPayload();

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, email, picture });
      await user.save();
    }

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("session", jwtToken, { httpOnly: true });
    res
      .status(200)
      .send({ message: "User signed in successfully", token: jwtToken });
  } catch (error) {
    logError(error);
    res.status(500).send({ error: "Error signing in with Google" });
  }
};
