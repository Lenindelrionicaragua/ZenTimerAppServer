import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import transporter from "../../config/emailConfig.js";
import UserVerification from "../../models/userVerification.js";
import { logError, logInfo } from "../../util/logging.js";

const resolvePath = (relativePath) => {
  return path.resolve(process.cwd(), relativePath);
};

// Function to send a welcome email
export const sendWelcomeEmail = async (user) => {
  const { _id, email } = user;
  const uniqueString = uuidv4() + _id; // Generar una cadena única

  const welcomeTemplatePath = resolvePath(
    "/Users/leninortizreyes/Desktop/ZenTimerAppServer/templates/emailWelcomeTemplate.html"
  );

  let welcomeEmailTemplate;
  try {
    welcomeEmailTemplate = fs.readFileSync(welcomeTemplatePath, "utf-8");
  } catch (error) {
    logError(`Error reading welcome email template: ${error.message}`);
    return { success: false, message: "Error reading template" }; // Retornar un objeto de error
  }

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Welcome to Zen Timer App",
    html: welcomeEmailTemplate,
  };

  try {
    const hashedUniqueString = await bcrypt.hash(uniqueString, 10);
    const newVerification = new UserVerification({
      userId: _id,
      uniqueString: hashedUniqueString,
      createdAt: Date.now(),
      expiresAt: Date.now() + 21600000, // 6 horas
    });

    await newVerification.save(); // Guardar el registro de verificación
    await transporter.sendMail(mailOptions); // Enviar el correo electrónico
    logInfo("Welcome email sent successfully");
    return { success: true }; // Retornar un objeto de éxito
  } catch (error) {
    logError(`Error sending welcome email: ${error.message}`);
    return { success: false, message: "Failed to send welcome email" }; // Retornar un objeto de error
  }
};
