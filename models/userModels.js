import mongoose from "mongoose";
import bcrypt from "bcrypt";
import validateAllowedFields from "../util/validateAllowedFields.js";
import { logInfo } from "../util/logging.js";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, trim: true },
  dateOfBirth: { type: String, trim: true },
  googleId: { type: String },
  picture: { type: String },
});

export const validateUser = (
  userObject,
  requirePassword = true,
  requireName = true,
  requireEmail = true,
  requireDateOfBirth = true,
) => {
  const errorList = [];
  const allowedKeys = ["name", "email", "password", "dateOfBirth"];

  const validatedKeysMessage = validateAllowedFields(userObject, allowedKeys);

  if (validatedKeysMessage.length > 0) {
    errorList.push(validatedKeysMessage);
  }

  if (
    !userObject ||
    !userObject.name ||
    (requireName && userObject.name.trim() === "")
  ) {
    errorList.push("Name is a required field.");
  }

  if (
    requireName &&
    !/^(?:[a-zA-Z0-9]+(?:\s+[a-zA-Z0-9]+)*)?$/.test(userObject.name)
  ) {
    errorList.push(
      "Name can only contain letters, numbers, and a single space between words.",
    );
  }

  if (!userObject?.email || (requireEmail && userObject.email.trim() === "")) {
    errorList.push("Email is a required field");
  }

  if (
    requireEmail &&
    !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(userObject.email)
  ) {
    errorList.push("Email is not in a valid format");
  }

  if (
    requirePassword &&
    (userObject.password === null || userObject.password === "")
  ) {
    errorList.push("Password is a required field");
  }

  if (
    requirePassword &&
    (!userObject.password || userObject.password.length < 8)
  ) {
    errorList.push("Password must be at least 8 characters long");
  }

  if (requirePassword && !/[A-Z]/.test(userObject.password)) {
    errorList.push("Password must contain at least one uppercase letter");
  }

  if (requirePassword && !/[^A-Za-z0-9]/.test(userObject.password)) {
    errorList.push("Password must contain at least one special character.");
  }

  if (
    (requireDateOfBirth && userObject.dateOfBirth === null) ||
    userObject.dateOfBirth === ""
  ) {
    errorList.push("Date Of Birth is a required field.");
  }

  const isValidDateOfBirth = /^[A-Z][a-z]{2} [A-Z][a-z]{2} \d{2} \d{4}$/.test(
    userObject.dateOfBirth,
  );

  if (requireDateOfBirth && (!userObject.dateOfBirth || !isValidDateOfBirth)) {
    errorList.push(
      "Date Of Birth is a required field with valid format (e.g., 'Tue Feb 01 2022').",
    );
  }

  return errorList;
};

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      logInfo(
        `Password hashed successfully for user: ${this.email}. Hash: ${this.password}`,
      );
      next();
    } catch (error) {
      logInfo(`Error hashing password: ${error}`);
      next(error);
    }
  } else {
    next();
    logInfo("No password modification detected.");
  }
});

const User = mongoose.model("user", userSchema);

export default User;
