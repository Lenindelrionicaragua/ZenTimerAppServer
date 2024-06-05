import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import transporter from "../../config/emailConfig.js";
import UserVerification from "../../models/userVerification.js";
import User from "../../models/userModels.js";
import { logError, logInfo } from "../../util/logging.js";

// Define __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setting server URL based on the environment
const development = "http://localhost:3000/";
const production = "https://zen-timer-app-server-7f9db58def4c.herokuapp.com";
const currentUrl =
  process.env.NODE_ENV === "production" ? production : development;

// Function to send a verification email
export const sendVerificationEmail = async (user, res) => {
  const { _id, email } = user;
  const uniqueString = uuidv4() + _id; // Generate a unique string using uuid and user ID

  // Read the HTML template
  const templatePath = path.join(
    __dirname,
    "../../templates/emailTemplate.html"
  );
  let emailTemplate;
  try {
    emailTemplate = fs.readFileSync(templatePath, "utf-8");
  } catch (error) {
    logError(`Error reading email template: ${error.message}`);
    if (res) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Replace placeholders with actual values
  const verifyUrl = `${currentUrl}/api/auth/verify/${_id}/${uniqueString}`;
  emailTemplate = emailTemplate.replace("{{VERIFY_URL}}", verifyUrl);

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Verify your Email",
    html: emailTemplate,
  };

  const saltRounds = 10;
  bcrypt
    .hash(uniqueString, saltRounds) // Hash the unique string
    .then((hashedUniqueString) => {
      const newVerification = new UserVerification({
        userId: _id,
        uniqueString: hashedUniqueString,
        createdAt: Date.now(),
        expiresAt: Date.now() + 21600000, // 6 hours
      });

      newVerification
        .save() // Save the verification record
        .then(() => {
          transporter
            .sendMail(mailOptions)
            .then(() => {
              logInfo("Verification email sent successfully");
              if (!res.headersSent) {
                res.json({
                  status: "PENDING",
                  message: "Verification email sent",
                  data: {
                    userId: _id,
                    email,
                  },
                });
              }
            })
            .catch((err) => {
              logError(`Verification email failed: ${err.message}`);
              if (!res.headersSent) {
                res.json({
                  status: "FAILED",
                  message: "Verification email failed",
                });
              }
            });
        })
        .catch((err) => {
          logError(`Failed to save verification record: ${err.message}`);
          if (!res.headersSent) {
            res.json({
              status: "FAILED",
              message: "Verification email failed",
            });
          }
        });
    })
    .catch((err) => {
      logError(`Failed to hash unique string: ${err.message}`);
      if (!res.headersSent) {
        res.json({
          status: "FAILED",
          message: "Failed to hash unique string",
        });
      }
    });
};

// Function to resend the verification link
export const resendVerificationLink = async (req, res) => {
  try {
    let { userId, email } = req.body;

    if (!userId || !email) {
      throw Error("Empty user details are not allowed");
    } else {
      await UserVerification.deleteMany({ userId });
      sendVerificationEmail({ _id: userId, email }, res);
      logInfo("Verification link resent"); // Log the info that the verification link has been resent
    }
  } catch (error) {
    logError(error);
    res.json({
      status: "FAILED",
      message: `Verification Link Resend Error. ${error.message}`,
    });
  }
};

// Function to verify the email
export const verifyEmail = (req, res) => {
  let { userId, uniqueString } = req.params;

  UserVerification.findOne({ userId }) // Find the verification record
    .then((result) => {
      if (result) {
        const { expiresAt, uniqueString: hashedUniqueString } = result;

        if (expiresAt < Date.now()) {
          // If the link has expired
          UserVerification.deleteOne({ userId }) // Delete the expired verification record
            .then(() => {
              User.deleteOne({ _id: userId }) // Delete the user
                .then(() => {
                  let message = "Link has expired. Please sign up again";
                  res.redirect(`/user/verified?error=true&message=${message}`);
                })
                .catch((error) => {
                  logError(error);
                  let message =
                    "Clearing user with expired unique string failed.";
                  res.redirect(`/user/verified?error=true&message=${message}`);
                });
            })
            .catch((error) => {
              logError(error);
              let message = "Clearing expired user verification record failed.";
              res.redirect(`/user/verified?error=true&message=${message}`);
            });
        } else {
          // If the link is still valid
          bcrypt
            .compare(uniqueString, hashedUniqueString) // Compare the unique strings
            .then((match) => {
              if (match) {
                // If they match
                User.updateOne({ _id: userId }, { verified: true }) // Update the user's verified status
                  .then(() => {
                    res.sendFile(
                      path.join(__dirname, "../../views/verified.html")
                    );
                  })
                  .catch((error) => {
                    logError(error);
                    let message =
                      "An error occurred while finalizing successful verification.";
                    res.redirect(
                      `/user/verified?error=true&message=${message}`
                    );
                  });
              } else {
                // If the unique strings do not match
                let message =
                  "Invalid verification details passed. Check your inbox.";
                res.redirect(`/user/verified?error=true&message=${message}`);
              }
            })
            .catch((error) => {
              logError(error);
              let message =
                "An error occurred while updating user record to show verified.";
              res.redirect(`/user/verified?error=true&message=${message}`);
            });
        }
      } else {
        // If no verification record is found
        let message =
          "Account record doesn't exist or has been verified already. Please sign up or log in.";
        res.redirect(`/user/verified?error=true&message=${message}`);
      }
    })
    .catch((error) => {
      logError(error);
      let message =
        "An error occurred while checking for existing user verification record";
      res.redirect(`/user/verified?error=true&message=${message}`);
    });
};
