import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import HabitCategory from "../../models/habitCategory";

jest.mock("../../util/logging.js", () => ({
  logInfo: jest.fn(),
}));

let mongoServer;

describe("HabitCategory Model Middleware Validation", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should call next with an error if validation fails", async () => {
    const category = new HabitCategory({
      name: "", // Invalid name
      createdBy: null, // Invalid createdBy
      totalMinutes: -10, // Invalid totalMinutes
      createdAt: new Date(),
    });

    const next = jest.fn(); // Mock the next function

    // Call the pre-save middleware manually
    await category.schema.statics
      .pre("save", async function (next) {
        const validationErrors = validateCategory(this); // Assume validateCategory is accessible

        if (validationErrors.length > 0) {
          logInfo("Validation failed: " + validationErrors.join(", "));
          return next(new Error(validationErrors.join(", ")));
        }

        next();
      })
      .call(category, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error)); // Check if next was called with an error
  });

  test("should call next without error if validation passes", async () => {
    const category = new HabitCategory({
      name: "ValidName",
      createdBy: new mongoose.Types.ObjectId(), // Valid ObjectId
      totalMinutes: 30,
      createdAt: new Date(),
    });

    const next = jest.fn(); // Mock the next function

    // Call the pre-save middleware manually
    await category.schema.statics
      .pre("save", async function (next) {
        const validationErrors = validateCategory(this); // Assume validateCategory is accessible

        if (validationErrors.length > 0) {
          logInfo("Validation failed: " + validationErrors.join(", "));
          return next(new Error(validationErrors.join(", ")));
        }

        next();
      })
      .call(category, next);

    expect(next).toHaveBeenCalledWith(); // Check if next was called without arguments
  });
});
