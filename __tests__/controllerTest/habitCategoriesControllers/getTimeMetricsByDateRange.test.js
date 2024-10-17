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

    const dailyRecordData = {
      minutesUpdate: 45,
    };

    // Function to generate random dates in a specific year
    const randomDatesInYear = (year) => {
      const dates = [];
      for (let month = 1; month <= 12; month++) {
        const daysInMonth = new Date(year, month, 0).getDate(); // Get the number of days in the month
        for (let day = 1; day <= daysInMonth; day++) {
          // Format the date as YYYY-MM-DD
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
            day
          ).padStart(2, "0")}`;
          dates.push(dateStr);
        }
      }
      return dates;
    };

    // Generate random dates for 2023 and 2024
    const dates2023 = randomDatesInYear(2023);
    const dates2024 = randomDatesInYear(2024);

    const categoriesToUpdate = [
      categoryId1,
      categoryId2,
      categoryId3,
      categoryId4,
      categoryId5,
      categoryId6,
    ];

    // Adding daily records for each category in 2023
    for (let i = 0; i < categoriesToUpdate.length; i++) {
      const categoryId = categoriesToUpdate[i];
      const randomDate2023 =
        dates2023[Math.floor(Math.random() * dates2023.length)];

      const dailyRecordData2023 = {
        ...dailyRecordData,
        date: randomDate2023,
      };

      const response2023 = await request
        .post(`/api/daily-records/${categoryId}`)
        .set("Cookie", cookie)
        .send(dailyRecordData2023);

      logInfo(
        `Daily record for 2023 added for category ${categoryId}: ${JSON.stringify(
          response2023.body,
          null,
          2
        )}`
      );
    }

    // Adding daily records for each category in 2024
    for (let i = 0; i < categoriesToUpdate.length; i++) {
      const categoryId = categoriesToUpdate[i];
      const randomDate2024 =
        dates2024[Math.floor(Math.random() * dates2024.length)];

      const dailyRecordData2024 = {
        ...dailyRecordData,
        date: randomDate2024,
      };

      const response2024 = await request
        .post(`/api/daily-records/${categoryId}`)
        .set("Cookie", cookie)
        .send(dailyRecordData2024);

      logInfo(
        `Daily record for 2024 added for category ${categoryId}: ${JSON.stringify(
          response2024.body,
          null,
          2
        )}`
      );
    }
  });

  it("should return all categories and their entries between 15th February and 31st December 2023", async () => {
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

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body).toHaveProperty("categoryDataPercentage");
    expect(response.body.categoryDataPercentage.length).toBeGreaterThan(0);
    expect(response.body.totalMinutes).toBeGreaterThanOrEqual(0);
  });

  it("should return all categories and their entries between 1st January and 31st December 2024", async () => {
    const response = await request
      .get(
        `/api/habit-categories/time-metrics?startDate=2024-01-01&endDate=2024-12-31`
      )
      .set("Cookie", cookie);

    logInfo(
      "Response for time metrics by date range in 2024:",
      JSON.stringify(response.body, null, 2)
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body).toHaveProperty("categoryDataPercentage");
    expect(response.body.categoryDataPercentage.length).toBeGreaterThan(0);
    expect(response.body.totalMinutes).toBeGreaterThanOrEqual(0);
  });
});
