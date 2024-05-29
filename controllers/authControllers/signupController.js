import { logError, logInfo } from "../../util/logging.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";
import { validateUser } from "../../models/userModels.js";
import User from "../../models/userModels.js";
import validateAllowedFields from "../../util/validateAllowedFields.js";

export const signup = async (req, res) => {
  const allowedFields = ["name", "email", "password", "dateOfBirth"];

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

    const newUser = await User.create(req.body.user).then((result) => {
      // Handle account verification
      sendVerificationEmail(result, res);
    });
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

const { v4: uuidv4 } = require("uuid");

// send verification email
const sendVerificationEmail = ({ _id, email }, res) => {
  // url to be used in the email
  const currentUrl = "http://localHost:3000/";

  const uniqueString = uuidv4() + _id;

  // email options
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
};
