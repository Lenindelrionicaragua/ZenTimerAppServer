import { logError, logInfo } from "../../util/logging.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";
import { validateUser } from "../../models/userModels.js";
import User from "../../models/userModels.js";
import validateAllowedFields from "../../util/validateAllowedFields.js";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import { hasBrowserCrypto } from "google-auth-library/build/src/crypto/crypto.js";
import transporter from "../../config/emailConfig.js";

export const signup = async (req, res) => {
  const allowedFields = ["name", "email", "password", "dateOfBirth"];
  // setting server url
  const development = "http://localhost:3000/";
  const production = "https://zen-timer-app-server-7f9db58def4c.herokuapp.com";
  const currentUrl =
    process.env.NODE_ENV === "production" ? production : development;

  if (!(req.body.user instanceof Object)) {
    return res.status(400).json({
      success: false,
      msg: `Invalid request: You need to provide a valid 'user' object. Received: ${JSON.stringify(
        req.body.user
      )}`,
    });
  }

  const invalidFieldsError = validateAllowedFields(
    req.body.user,
    allowedFields
  );
  if (invalidFieldsError) {
    return res
      .status(400)
      .json({ success: false, msg: `Invalid request: ${invalidFieldsError}` });
  }

  try {
    const { name, email, password, dateOfBirth, ...additionalFields } =
      req.body.user;
    const errors = [];

    if (!name || !email || !password || !dateOfBirth) {
      errors.push("Name, email, password, and date of birth are required.");
    }

    if (Object.keys(additionalFields).length > 0) {
      errors.push("Invalid fields present in the request.");
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, msg: errors.join(" ") });
    }

    const errorList = validateUser(req.body.user, true);
    if (errorList.length > 0) {
      return res
        .status(400)
        .json({ success: false, msg: validationErrorMessage(errorList) });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, msg: "User already exists" });
    }

    const newUser = await User.create(req.body.user);
    await sendVerificationEmail(newUser, res);
    logInfo(`User created successfully: ${newUser.email}`);

    return res
      .status(201)
      .json({ success: true, msg: "User created successfully", user: newUser });
  } catch (error) {
    logError(error);
    return res
      .status(500)
      .json({ success: false, msg: "Unable to create user, try again later" });
  }
};

// send verification email
const sendVerificationEmail = async (user, res) => {
  const { _id, email } = user;

  const uniqueString = uuidv4() + _id;

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Verify your Email",
    html: `
      <p>Verify your email address to complete the signup and log into your account.</p>
      <p>This link <b>expires in 6 hours</b>.</p>
      <p>Press <a href="${currentUrl}user/verify/${_id}${uniqueString}">here</a> to proceed.</p>
    `,
  };

  await sendEmail(mailOptions);
};

// hash the uniqueString
const saltRounds = 10;
bcrypt
  .hash(uniqueString, saltRounds)
  .then((hashedUniqueString) => {
    const newVerification = new UserVerification({
      userId: _Id,
      uniqueString: hashedUniqueString,
      createdAt: Date.now(),
      expiresAt: Date.now() + 21600000,
    });

    newVerification
      .save()
      .then(() => {
        transporter
          .sendMail(mailOptions)
          .then(() => {
            // email sent and verification record saved.
            res.json({
              status: "PENDING",
              message: "Verification email sent",
              data: {
                userId: _id,
                email,
              },
            });
          })
          .catch((err) => {
            res.json({
              status: "FAILED",
              message: "Verification email failed",
            });
            logError(err);
          });
      })
      .catch((err) => {
        res.json({
          status: "FAILED",
          message: "Failed to save verification record",
        });
        logError(err);
      });
  })
  .catch((err) => {
    res.json({
      status: "FAILED",
      message: "Failed to hash unique string",
    });
    logError(err);
  });

const sendEmail = async (mailOptions) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // e.g., 'gmail'
    auth: {
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASSWORD,
    },
  });

  await transporter.sendMail(mailOptions);
};
