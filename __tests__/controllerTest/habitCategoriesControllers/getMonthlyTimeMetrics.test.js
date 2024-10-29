import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";
import { logInfo } from "../../../util/logging.js";

const request = supertest(app);

let testUser;
let cookie;
let categoryId1;
let categoryId2;
let categoryId3;

beforeAll(async () => {
  // Initial user configuration, login and category creation
  // We predefine several dates to create records and verify the calculation
  // of minutes in specific date ranges.
  await connectToMockDB();

  testUser = {
    name: "Test User",
    email: "testuser@example.com",
    password: "Test1234!",
    dateOfBirth: "Tue Feb 01 1990",
  };

  await request.post("/api/auth/sign-up").send({ user: testUser });

  const loginResponse = await request
    .post("/api/auth/log-in")
    .send({ user: { email: testUser.email, password: testUser.password } });

  cookie = loginResponse.headers["set-cookie"];

  const categories = [
    { name: "NewCategory1", createdAt: "2024-01-12" },
    { name: "NewCategory2", createdAt: "2024-01-12" },
    { name: "NewCategory3", createdAt: "2024-01-12" },
  ];

  const categoryPromises = categories.map(async (category, index) => {
    const categoryResponse = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie)
      .send({ habitCategory: category });

    if (index === 0) categoryId1 = categoryResponse.body.category._id;
    if (index === 1) categoryId2 = categoryResponse.body.category._id;
    if (index === 2) categoryId3 = categoryResponse.body.category._id;
  });

  await Promise.all(categoryPromises);

  const predefinedDates = [
    "2023-01-05",
    "2023-01-15",
    "2023-02-10",
    "2023-02-20",
    "2023-03-07",
    "2023-03-22",
    "2023-04-09",
    "2023-04-25",
    "2023-05-05",
    "2023-05-18",
    "2023-06-01",
    "2023-06-21",
    "2023-07-10",
    "2023-07-22",
    "2023-08-05",
    "2023-08-19",
    "2023-09-06",
    "2023-09-17",
    "2023-10-03",
    "2023-10-15",
    "2023-11-09",
    "2023-11-25",
    "2023-12-05",
    "2023-12-19",
    "2024-01-10",
    "2024-01-20",
    "2024-02-05",
    "2024-02-15",
    "2024-03-03",
    "2024-03-18",
    "2024-04-06",
    "2024-04-22",
    "2024-05-12",
    "2024-05-24",
    "2024-06-02",
    "2024-06-20",
    "2024-07-07",
    "2024-07-18",
    "2024-08-04",
    "2024-08-15",
    "2024-09-01",
    "2024-09-20",
    "2024-10-10",
    "2024-10-22",
    "2024-11-06",
    "2024-11-21",
    "2024-12-01",
    "2024-12-17",
  ];

  const categoryRecordsPromises = [];
  for (const date of predefinedDates) {
    const categoriesToUpdate = [categoryId1, categoryId2, categoryId3];
    for (const categoryId of categoriesToUpdate) {
      categoryRecordsPromises.push(
        request
          .post(`/api/time-records/${categoryId}`)
          .set("Cookie", cookie)
          .send({
            minutesUpdate: 45,
            date: date,
          })
          .then((response) => {
            // logInfo(
            //   `Response for category ${categoryId} on ${date}:,
            //   ${JSON.stringify(response.body)}`
            // );
          })
      );
    }
  }

  await Promise.all(categoryRecordsPromises);
}, 10000); // wait to populate de mockDB

afterAll(async () => {
  await clearMockDatabase();
  await closeMockDatabase();
});

describe("getMonthlyTimeMetrics", () => {
  // Test to verify that categories and metrics for the given date range are correct
  it("should return all categories and their entries for February 2024", async () => {
    const response = await request
      .get(`/api/habit-categories/monthly-metrics?month=February&year=2024`)
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body.totalMinutes).toBe(270);

    expect(response.body).toHaveProperty("categoryCount");
    expect(response.body.categoryData.length).toBe(9);

    expect(response.body).toHaveProperty("daysWithRecords");
    expect(response.body.daysWithRecords).toBe(2);

    expect(response.body).toHaveProperty("totalDailyMinutes");

    expect(response.body).toHaveProperty("categoryData");

    response.body.categoryData.forEach((category) => {
      expect(category).toHaveProperty("name");
      expect(category).toHaveProperty("totalMinutes");
      expect(category).toHaveProperty("percentage");
    });
  });

  it("should return the correct metrics when the month is passed as a number", async () => {
    const response = await request
      .get(`/api/habit-categories/monthly-metrics?month=5&year=2024`)
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body.totalMinutes).toBe(270);

    expect(response.body).toHaveProperty("categoryCount");
    expect(response.body.categoryData.length).toBe(9);

    expect(response.body).toHaveProperty("daysWithRecords");
    expect(response.body.daysWithRecords).toBe(2);

    expect(response.body).toHaveProperty("totalDailyMinutes");

    const firstDate = Object.keys(response.body.totalDailyMinutes)[0];
    const firstMinutes = response.body.totalDailyMinutes[firstDate];

    expect(firstDate).toBe("2024-05-12");
    expect(firstMinutes).toBe(135);

    response.body.categoryData.forEach((category) => {
      expect(category).toHaveProperty("name");
      expect(category).toHaveProperty("totalMinutes");
      expect(category).toHaveProperty("percentage");
    });
  });

  it("should return a 404 error for numeric values used as invalid month names", async () => {
    const invalidMonths = [123];

    for (const month of invalidMonths) {
      const response = await request
        .get(`/api/habit-categories/monthly-metrics?month=${month}&year=2023`)
        .set("Cookie", cookie);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe(
        "BAD REQUEST: Invalid month number provided. It should be an integer between 1 and 12."
      );
    }
  });

  it("should return a 404 error for unrecognized string month names", async () => {
    const invalidMonths = ["invalidMonth"];

    for (const month of invalidMonths) {
      const response = await request
        .get(`/api/habit-categories/monthly-metrics?month=${month}&year=2023`)
        .set("Cookie", cookie);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe(
        "BAD REQUEST: Invalid month name or format provided"
      );
    }
  });

  it("should return a 404 error for an invalid date format (e.g., '2023-11-15')t", async () => {
    const response = await request
      .get(`/api/habit-categories/monthly-metrics?month=2023-11-15&year=2023`)
      .set("Cookie", cookie);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe(
      "BAD REQUEST: Invalid month name or format provided"
    );
  });

  it("should return a 404 error for a month number greater than 12", async () => {
    const response = await request
      .get(`/api/habit-categories/monthly-metrics?month=13&year=2023`)
      .set("Cookie", cookie);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe(
      "BAD REQUEST: Invalid month number provided. It should be an integer between 1 and 12."
    );
  });

  it("should return a 404 error for a month number less than 1", async () => {
    const response = await request
      .get(`/api/habit-categories/monthly-metrics?month=0&year=2023`)
      .set("Cookie", cookie);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe(
      "BAD REQUEST: Invalid month number provided. It should be an integer between 1 and 12."
    );
  });

  it("should return a 404 error for non-integer month values (e.g., 12.5)", async () => {
    const nonIntegerMonths = ["12.5", "1.1", "7.8"]; // Non-integer month values

    for (const month of nonIntegerMonths) {
      const response = await request
        .get(`/api/habit-categories/monthly-metrics?month=${month}&year=2023`)
        .set("Cookie", cookie);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe(
        "BAD REQUEST: Invalid month number provided. It should be an integer between 1 and 12."
      );
    }
  });

  it("should correctly handle valid month names regardless of case sensitivity", async () => {
    const validMonths = ["January", "january", "JANUARY", "JaNuArY"];

    for (const month of validMonths) {
      const response = await request
        .get(`/api/habit-categories/monthly-metrics?month=${month}&year=2023`)
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.daysWithRecords).toBe(2);
    }
  });

  it("should return a 404 error for invalid month values", async () => {
    const invalidMonths = [undefined, null, {}]; // These values become strings in a URL

    // Note: When passed in a URL, 'null' and 'undefined' are converted to strings ("null", "undefined").
    // Similarly, {} becomes "[object Object]", so they are treated as valid strings unless explicitly checked.

    for (const month of invalidMonths) {
      const response = await request
        .get(`/api/habit-categories/monthly-metrics?month=${month}&year=2023`)
        .set("Cookie", cookie);

      expect(response.status).toBe(404); // Bad Request
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe(
        "BAD REQUEST: Invalid month name or format provided"
      );
    }
  });

  it("should return a 400 error for empty, missing values", async () => {
    const invalidMonths = ["", []];

    for (const month of invalidMonths) {
      const response = await request
        .get(`/api/habit-categories/monthly-metrics?month=${month}&year=2023`)
        .set("Cookie", cookie);

      expect(response.status).toBe(400); // Bad Request
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe(
        "Both 'month' and 'year' are required in the query parameters."
      );
    }
  });

  it("should return one specific category and their entries for May 2023", async () => {
    const response = await request
      .get(
        `/api/habit-categories/monthly-metrics?month=May&year=2023&categoryId=${categoryId1}`
      )
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body.totalMinutes).toBe(90);

    expect(response.body).toHaveProperty("categoryCount");
    expect(response.body.categoryData.length).toBe(1);

    expect(response.body).toHaveProperty("daysWithRecords");
    expect(response.body.daysWithRecords).toBe(2);

    expect(response.body).toHaveProperty("totalDailyMinutes");

    const firstDate = Object.keys(response.body.totalDailyMinutes)[0];
    const firstMinutes = response.body.totalDailyMinutes[firstDate];

    expect(firstDate).toBe("2023-05-05");
    expect(firstMinutes).toBe(45);

    expect(response.body).toHaveProperty("categoryData");

    response.body.categoryData.forEach((category) => {
      expect(category.name).toBe("NewCategory1");
      expect(category.totalMinutes).toBe(90);
      expect(category.percentage).toBe("100.00");
    });
  });

  it("should return success with category count = 0 if there are no records in the specified month", async () => {
    const response = await request
      .get(
        `/api/habit-categories/monthly-metrics?month=May&year=2025&categoryId=${categoryId2}`
      )
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.totalMinutes).toBe(0);
    expect(response.body.categoryCount).toBe(0); // Expecting count to be 0 for active categories
    expect(response.body.daysWithRecords).toBe(0);
    expect(response.body).toHaveProperty("totalDailyMinutes");
    expect(response.body.totalDailyMinutes).toBe(0); // Expect totalDailyMinutes to be 0 now
    expect(response.body.categoryData.length).toBe(1); // Expecting 1 categories returned, even if they have no records
  });

  it("should return a 400 error for missing or invalid year values", async () => {
    const invalidYears = ["", []];

    for (const year of invalidYears) {
      const response = await request
        .get(`/api/habit-categories/monthly-metrics?month=May&year=${year}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe(
        "Both 'month' and 'year' are required in the query parameters."
      );
    }
  });

  it("should return a 400 error for missing or invalid year values", async () => {
    const invalidYears = [null, "abc", undefined, {}]; // These values become strings in a URL

    // Note: When passed in a URL, 'null' and 'undefined' are converted to strings ("null", "undefined").
    // Similarly, {} becomes "[object Object]", so they are treated as valid strings unless explicitly checked.

    for (const year of invalidYears) {
      const response = await request
        .get(`/api/habit-categories/monthly-metrics?month=May&year=${year}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe(
        "BAD REQUEST: Invalid month number provided. It should be an integer between 1 and 12."
      );
    }
  });

  it("should return correct metrics for boundary month values (January and December)", async () => {
    const boundaryMonths = ["January", "December"];

    for (const month of boundaryMonths) {
      const response = await request
        .get(`/api/habit-categories/monthly-metrics?month=${month}&year=2023`)
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    }
  });

  it("should correctly handle February in a leap year", async () => {
    const response = await request
      .get(`/api/habit-categories/monthly-metrics?month=February&year=2024`)
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.daysWithRecords).toBe(2);
  });

  it("should return success with empty data if user has no categories", async () => {
    await clearMockDatabase(); // Clear data for a fresh test scenario

    const response = await request
      .get(`/api/habit-categories/monthly-metrics?month=May&year=2023`)
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.msg).toBe(
      "No categories found for this user, but the request was successful."
    );
    expect(response.body.categoryCount).toBe(0);
    expect(response.body.categoryData.length).toBe(0);
  });
});
