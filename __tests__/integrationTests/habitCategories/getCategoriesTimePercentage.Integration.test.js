import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";
import { logInfo } from "../../../util/logging.js";

const request = supertest(app);

let userId;

beforeAll(async () => {
  await connectToMockDB();
});

afterEach(async () => {
  await clearMockDatabase();
});

afterAll(async () => {
  await closeMockDatabase();
});

describe("Habit Category Percentage Time Tests", () => {
  beforeEach(async () => {
    const testUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1990",
    };

    await request.post("/api/auth/sign-up").send({ user: testUser });

    const loginResponse = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    userId = loginResponse.body.user.id;

    const categories = [
      {
        name: "Family-Time",
        dailyRecords: [{ date: "2022-12-15", totalMinutes: 300 }],
        createdBy: userId,
      },
      {
        name: "Rest",
        dailyRecords: [{ date: "2022-12-15", totalMinutes: 25 }],
        createdBy: userId,
      },
      {
        name: "Exercise",
        dailyRecords: [{ date: "2023-12-11", totalMinutes: 14 }],
        createdBy: userId,
      },
      {
        name: "Family-Time",
        dailyRecords: [{ date: "2023-12-13", totalMinutes: 300 }],
        createdBy: userId,
      },
      {
        name: "Study",
        dailyRecords: [{ date: "2023-12-15", totalMinutes: 300 }],
        createdBy: userId,
      },
      {
        name: "Rest",
        dailyRecords: [{ date: "2023-12-18", totalMinutes: 300 }],
        createdBy: userId,
      },
      {
        name: "Rest",
        dailyRecords: [{ date: "2024-01-01", totalMinutes: 45 }],
        createdBy: userId,
      },
      {
        name: "Work",
        dailyRecords: [{ date: "2024-07-01", totalMinutes: 120 }],
        createdBy: userId,
      },
      {
        name: "Exercise",
        dailyRecords: [{ date: "2024-07-05", totalMinutes: 60 }],
        createdBy: userId,
      },
      {
        name: "Study",
        dailyRecords: [{ date: "2024-07-10", totalMinutes: 90 }],
        createdBy: userId,
      },
      {
        name: "Work",
        dailyRecords: [{ date: "2024-08-01", totalMinutes: 45 }],
        createdBy: userId,
      },
    ];

    logInfo(`Populate MockDB: ${JSON.stringify(categories, null, 2)}`);

    for (const category of categories) {
      await request.post("/api/test/habit-categories/create").send({
        habitCategory: category,
      });
    }
  });

  it("should return total percentage of time with all the categories for a specific day", async () => {
    const response = await request
      .get("/api/test/habit-categories/time-percentage")
      .query({
        userId,
        years: "2022",
        periodType: "day",
        startDate: "2022-12-15",
        endDate: "2022-12-15",
      });

    logInfo(`User ID: ${userId}`);
    logInfo(`Response: ${JSON.stringify(response.body)}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body).toHaveProperty("categoryDataPercentage");

    const { totalMinutes, categoryDataPercentage } = response.body;

    const expectedTotalMinutes = 300 + 25;
    expect(totalMinutes).toBe(expectedTotalMinutes);

    const familyTimeCategory = categoryDataPercentage.find(
      (cat) => cat.name === "Family-Time"
    );
    const restCategory = categoryDataPercentage.find(
      (cat) => cat.name === "Rest"
    );

    const expectedFamilyTimePercentage = (
      (300 / expectedTotalMinutes) *
      100
    ).toFixed(2);
    const expectedRestPercentage = ((25 / expectedTotalMinutes) * 100).toFixed(
      2
    );

    expect(familyTimeCategory.percentage).toBe(expectedFamilyTimePercentage);
    expect(restCategory.percentage).toBe(expectedRestPercentage);
  });

  it("should return categories only for the specified week and exclude dates outside the week", async () => {
    const response = await request
      .get("/api/test/habit-categories/time-percentage")
      .query({
        userId,
        years: "2023",
        periodType: "week",
        startDate: "2023-12-11",
        endDate: "2023-12-17",
      });

    logInfo(`User ID: ${userId}`);
    logInfo(`Response: ${JSON.stringify(response.body)}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body).toHaveProperty("categoryDataPercentage");

    const { totalMinutes, categoryDataPercentage } = response.body;

    // Total esperado: 14 (Exercise) + 300 (Family-Time) + 300 (Study)
    const expectedTotalMinutes = 14 + 300 + 300; // 614 minutos
    expect(totalMinutes).toBe(expectedTotalMinutes);

    const exerciseCategory = categoryDataPercentage.find(
      (cat) => cat.name === "Exercise"
    );
    const familyTimeCategory = categoryDataPercentage.find(
      (cat) => cat.name === "Family-Time"
    );
    const studyCategory = categoryDataPercentage.find(
      (cat) => cat.name === "Study"
    );

    const expectedExercisePercentage = (
      (14 / expectedTotalMinutes) *
      100
    ).toFixed(2);
    const expectedFamilyTimePercentage = (
      (300 / expectedTotalMinutes) *
      100
    ).toFixed(2);
    const expectedStudyPercentage = (
      (300 / expectedTotalMinutes) *
      100
    ).toFixed(2);

    expect(exerciseCategory.percentage).toBe(expectedExercisePercentage);
    expect(familyTimeCategory.percentage).toBe(expectedFamilyTimePercentage);
    expect(studyCategory.percentage).toBe(expectedStudyPercentage);
  });

  it("should return total percentage of time with all the categories for a specific month and year", async () => {
    const response = await request
      .get("/api/test/habit-categories/time-percentage")
      .query({
        userId,
        years: "2024",
        periodType: "month",
        startDate: "2024-07-01",
        endDate: "2024-07-31",
      });

    logInfo(`User ID: ${userId}`);
    logInfo(`Response: ${JSON.stringify(response.body)}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body).toHaveProperty("categoryDataPercentage");

    const { totalMinutes, categoryDataPercentage } = response.body;

    // Total esperado para Julio: 120 (Work) + 60 (Exercise) + 90 (Study)
    const expectedTotalMinutes = 120 + 60 + 90; // Total para Julio
    expect(totalMinutes).toBe(expectedTotalMinutes);

    // Verifica los porcentajes por categoría
    const workCategory = categoryDataPercentage.find(
      (cat) => cat.name === "Work"
    );
    const exerciseCategory = categoryDataPercentage.find(
      (cat) => cat.name === "Exercise"
    );
    const studyCategory = categoryDataPercentage.find(
      (cat) => cat.name === "Study"
    );

    const expectedWorkPercentage = ((120 / expectedTotalMinutes) * 100).toFixed(
      2
    );
    const expectedExercisePercentage = (
      (60 / expectedTotalMinutes) *
      100
    ).toFixed(2);
    const expectedStudyPercentage = ((90 / expectedTotalMinutes) * 100).toFixed(
      2
    );

    expect(workCategory.percentage).toBe(expectedWorkPercentage);
    expect(exerciseCategory.percentage).toBe(expectedExercisePercentage);
    expect(studyCategory.percentage).toBe(expectedStudyPercentage);
  });
});
