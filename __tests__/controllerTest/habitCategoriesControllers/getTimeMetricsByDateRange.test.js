import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";
import { logInfo } from "../../../util/logging.js";

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

describe("getTimeMetricsByDateRange", () => {
  let testUser;
  let testUserId;
  let cookie;
  let categoryId;
  let categoryId1;
  let categoryId2;
  let categoryId3;
  let categoryId4;
  let categoryId5;
  let categoryId6;

  beforeEach(async () => {
    testUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1990",
    };

    // User sign-up and login to get userId
    await request.post("/api/auth/sign-up").send({ user: testUser });

    const loginResponse = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    cookie = loginResponse.headers["set-cookie"];

    // Define categories to be created
    const categories = [
      { name: "Work", createdAt: "2024-01-12" },
      { name: "Exercise", createdAt: "2024-01-12" },
      { name: "Study", createdAt: "2024-01-12" },
      { name: "Rest", createdAt: "2024-01-12" },
      { name: "Family time", createdAt: "2024-01-12" },
      { name: "Screen-free", createdAt: "2024-01-12" },
    ];

    // Loop through the categories and create each one
    for (let i = 0; i < categories.length; i++) {
      const categoryResponse = await request
        .post("/api/habit-categories/create")
        .set("Cookie", cookie) // Ensure the cookie is included for authentication
        .send({ habitCategory: categories[i] });

      // Capturing categoryId and logging info
      testUserId = categoryResponse.body.category.createdBy;
      const categoryId = categoryResponse.body.category._id;
      logInfo(`Category created by user: ${JSON.stringify(testUserId)}`);
      logInfo(`Category created with ID: ${JSON.stringify(categoryId)}`);

      // Storing category IDs for later use
      switch (i) {
        case 0:
          categoryId1 = categoryId;
          break;
        case 1:
          categoryId2 = categoryId;
          break;
        case 2:
          categoryId3 = categoryId;
          break;
        case 3:
          categoryId4 = categoryId;
          break;
        case 4:
          categoryId5 = categoryId;
          break;
        case 5:
          categoryId6 = categoryId;
          break;
        default:
          break;
      }
    }

    // Log all the category IDs for validation purposes
    logInfo(
      "Category IDs created:",
      JSON.stringify(
        [
          categoryId1,
          categoryId2,
          categoryId3,
          categoryId4,
          categoryId5,
          categoryId6,
        ],
        null,
        2
      )
    );

    // Adding multiple daily records for each category
    const dailyRecordData = {
      minutesUpdate: 45,
      date: "2024-10-12", // Valid date format
    };

    // Adding daily records for each category
    const categoriesToUpdate = [
      categoryId1,
      categoryId2,
      categoryId3,
      categoryId4,
      categoryId5,
      categoryId6,
    ];
    for (let i = 0; i < categoriesToUpdate.length; i++) {
      const categoryId = categoriesToUpdate[i];

      // Adding daily record to each category
      const response = await request
        .post(`/api/daily-records/${testUserId}/${categoryId}`)
        .set("Cookie", cookie)
        .send(dailyRecordData);

      // Log the response after adding the daily record
      logInfo(
        `Daily record added for category ${categoryId}: ${JSON.stringify(
          response.body,
          null,
          2
        )}`
      );
    }
  });

  it("should return all categories and their entries between 15th February and 31st December 2023", async () => {
    // Your test case for fetching the categories and their records within a date range
    const response = await request
      .get(
        `/api/habit-categories/time-metrics?startDate=2023-02-15&endDate=2023-12-31`
      )
      .set("Cookie", cookie);

    // Log the response to check the results
    logInfo(
      "Response for time metrics by date range:",
      JSON.stringify(response.body, null, 2)
    );
    // Asegurarse de que la respuesta sea exitosa (status 200)
    expect(response.status).toBe(200);

    // Verificar que la respuesta contenga las propiedades esperadas
    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body).toHaveProperty("categoryDataPercentage");
    expect(response.body.categoryDataPercentage.length).toBeGreaterThan(0);

    // Verificar que el total de minutos es mayor o igual a 0
    expect(response.body.totalMinutes).toBeGreaterThanOrEqual(0);
  });
});
