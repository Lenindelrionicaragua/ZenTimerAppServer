import supertest from "supertest";
import fs from "fs";
import path from "path";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";
import HabitCategory from "../../../models/habitCategory.js";

const request = supertest(app);

// Mock data file
const mockDataPath = path.join(
  __dirname,
  "../../../__testUtils__/mockHabitCategoryData.json"
);

let mockData;

beforeAll(async () => {
  await connectToMockDB();

  const rawData = fs.readFileSync(mockDataPath);
  mockData = JSON.parse(rawData);
});

// Populate the mock database
beforeEach(async () => {
  await HabitCategory.insertMany(mockData.categories);
});

afterEach(async () => {
  await clearMockDatabase();
});

afterAll(async () => {
  await closeMockDatabase();
});

describe("GET /api/test/habit-categories", () => {
  it("should populate the mock database and log categories", async () => {
    const categories = await HabitCategory.find();
    console.log("Current Categories in DB:", categories);

    expect(categories.length).toBe(mockData.categories.length);
  });
});
