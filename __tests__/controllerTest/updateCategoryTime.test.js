import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../__testUtils__/dbMock.js";
import app from "../../app.js";
import HabitCategory from "../../models/habitCategory.js";

const request = supertest(app);

beforeAll(async () => {
  await connectToMockDB();
});

afterEach(async () => {
  await clearMockDatabase();
});

afterAll(async () => {
  await closeMockDatabase();
});

describe("Update category time", () => {
  let testCategory;
  let categoryId;

  beforeEach(async () => {
    testCategory = new HabitCategory({
      name: "Work",
      createdBy: "633a1a0e6d28b961a3e5ffdd",
      totalMinutes: 60,
      createdAt: new Date(),
    });
    await testCategory.save();
    categoryId = testCategory._id;
  });

  it("should successfully update the total minutes of the category", async () => {
    const updateData = { totalMinutes: 30 };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Category updated successfully.");
    expect(response.body.category.totalMinutes).toBe(
      testCategory.totalMinutes + updateData.totalMinutes
    );
  });
});
