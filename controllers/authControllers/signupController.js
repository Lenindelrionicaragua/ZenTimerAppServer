import { logError, logInfo } from "../../util/logging.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";
import { validateUser } from "../../models/userModels.js";
import User from "../../models/userModels.js";
import validateAllowedFields from "../../util/validateAllowedFields.js";
import { sendVerificationEmail } from "./emailVerificationController.js";
import { autoCreateDefaultCategories } from "../../util/autoCreateDefaultCategories.js";

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

  if (req.body.user && req.body.user.email) {
    req.body.user.email = req.body.user.email.toLowerCase();
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

    await autoCreateDefaultCategories(newUser._id);

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
