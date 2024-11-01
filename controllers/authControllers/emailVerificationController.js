import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import transporter from "../../config/emailConfig.js";
import UserVerification from "../../models/userVerification.js";
import User from "../../models/userModels.js";
import { logError, logInfo } from "../../util/logging.js";

// Setting server URL based on the environment
const development = "http://192.168.178.182:3000";
const production = "https://zen-timer-app-server-7f9db58def4c.herokuapp.com";
const currentUrl =
  process.env.NODE_ENV === "production" ? production : development;

const resolvePath = (relativePath) => {
  return path.resolve(process.cwd(), relativePath);
};

// Function to send a verification email
export const sendVerificationEmail = async (user) => {
  const { _id, email } = user;
  const uniqueString = uuidv4() + _id;
  const templatePath = resolvePath("/path/to/emailTemplate.html");

  let emailTemplate;
  try {
    emailTemplate = fs.readFileSync(templatePath, "utf-8");
  } catch (error) {
    logError(`Error reading email template: ${error.message}`);
    return false; // Error reading template
  }

  const verifyUrl = `${currentUrl}/api/auth/verify/${_id}/${uniqueString}`;
  emailTemplate = emailTemplate.replace("{{VERIFY_URL}}", verifyUrl);

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Verify your Email",
    html: emailTemplate,
  };

  try {
    const hashedUniqueString = await bcrypt.hash(uniqueString, 10);
    const newVerification = new UserVerification({
      userId: _id,
      uniqueString: hashedUniqueString,
      createdAt: Date.now(),
      expiresAt: Date.now() + 21600000, // 6 hours
    });

    await newVerification.save();
    await transporter.sendMail(mailOptions);
    logInfo("Verification email sent successfully");
    return true;
  } catch (error) {
    logError(`Error sending verification email: ${error.message}`);
    return false;
  }
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
      logInfo("Verification link resent");
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
  const verifySuccessFilePath = resolvePath(
    "/Users/leninortizreyes/Desktop/ZenTimerAppServer/views/verified.html"
  );

  logInfo("verifyEmail function called");
  let { userId, uniqueString } = req.params;
  logInfo(`Params - userId: ${userId}, uniqueString: ${uniqueString}`); // Log the received params

  UserVerification.findOne({ userId }) // Find the verification record
    .then((result) => {
      if (result) {
        logInfo("UserVerification record found:", result);
        const { expiresAt, uniqueString: hashedUniqueString } = result;

        if (expiresAt < Date.now()) {
          // If the link has expired
          logInfo("Verification link has expired");
          UserVerification.deleteOne({ userId }) // Delete the expired verification record
            .then(() => {
              User.deleteOne({ _id: userId }) // Delete the user
                .then(() => {
                  let message = "Link has expired. Please sign up again";
                  logInfo(message);
                  verifySuccessMessage = fs.readFileSync(templatePath, "utf-8");
                  res.redirect(`/user/verified?error=true&message=${message}`);
                })
                .catch((error) => {
                  logError(error);
                  let message =
                    "Clearing user with expired unique string failed.";
                  logError(message, error);
                  res.redirect(`/user/verified?error=true&message=${message}`);
                });
            })
            .catch((error) => {
              logError(error);
              let message = "Clearing expired user verification record failed.";
              log(message, error);
              res.redirect(`/user/verified?error=true&message=${message}`);
            });
        } else {
          logInfo("Verification link is still valid");
          bcrypt
            .compare(uniqueString, hashedUniqueString)
            .then((match) => {
              if (match) {
                logInfo("Unique strings match");
                User.updateOne({ _id: userId }, { verified: true }) // Update the user's verified status
                  .then(() => {
                    logInfo("User verification status updated successfully");
                    res.sendFile(verifySuccessFilePath);
                  })
                  .catch((error) => {
                    logError(error);
                    let message =
                      "An error occurred while finalizing successful verification.";
                    logError(message, error);
                    res.redirect(
                      `/user/verified?error=true&message=${message}`
                    );
                  });
              } else {
                let message =
                  "Invalid verification details passed. Check your inbox.";
                logInfo(message);
                res.redirect(`/user/verified?error=true&message=${message}`);
              }
            })
            .catch((error) => {
              logError(error);
              let message =
                "An error occurred while updating user record to show verified.";
              logError(message, error);
              res.redirect(`/user/verified?error=true&message=${message}`);
            });
        }
      } else {
        // If no verification record is found
        let message =
          "Account record doesn't exist or has been verified already. Please sign up or log in.";
        logInfo(message);
        res.redirect(`/user/verified?error=true&message=${message}`);
      }
    })
    .catch((error) => {
      logError(error);
      let message =
        "An error occurred while checking for existing user verification record";
      logInfo(message, error);
      res.redirect(`/user/verified?error=true&message=${message}`);
    });
};
