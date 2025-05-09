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

  // delete the default categories
  await request
    .delete("/api/habit-categories/delete-all-categories")
    .set("Cookie", cookie);

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

describe("getTimeMetricsByDateRange", () => {
  // Make the request with specific dates and verify that the minutes
  // totals and other metrics are as expected for the categories.

  it("should return all categories and their entries between 15th February and 31st December 2023", async () => {
    const response = await request
      .get(
        `/api/habit-categories/date-range-metrics?startDate=2023-02-15&endDate=2023-12-31`
      )
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body.totalMinutes).toBe(2835);

    expect(response.body).toHaveProperty("categoryCount");
    expect(response.body.categoryData.length).toBe(3);

    expect(response.body).toHaveProperty("daysWithRecords");
    expect(response.body.daysWithRecords).toBe(21);

    expect(response.body).toHaveProperty("categoryData");

    response.body.categoryData.forEach((category) => {
      expect(category).toHaveProperty("name");
      expect(category).toHaveProperty("totalMinutes");
      expect(category).toHaveProperty("percentage");
    });
  });

  it("should return all categories and their entries between 15th November 2023 and 15th February 2024", async () => {
    const response = await request
      .get(
        `/api/habit-categories/date-range-metrics?startDate=2023-11-15&endDate=2024-02-15`
      )
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body.totalMinutes).toBe(945);

    expect(response.body).toHaveProperty("categoryCount");
    expect(response.body.categoryData.length).toBe(3);

    expect(response.body).toHaveProperty("daysWithRecords");
    expect(response.body.daysWithRecords).toBe(7);

    response.body.categoryData.forEach((category) => {
      expect(category).toHaveProperty("name");
      expect(category).toHaveProperty("totalMinutes");
      expect(category).toHaveProperty("percentage");
    });
  });

  it("should return all categories and their entries between 1st and 7th March 2023", async () => {
    const response = await request
      .get(
        `/api/habit-categories/date-range-metrics?startDate=2023-03-01&endDate=2023-03-07`
      )
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body.totalMinutes).toBe(135);

    expect(response.body).toHaveProperty("categoryCount");
    expect(response.body.categoryData.length).toBe(3);

    expect(response.body).toHaveProperty("daysWithRecords");
    expect(response.body.daysWithRecords).toBe(1);

    response.body.categoryData.forEach((category) => {
      expect(category).toHaveProperty("name");
      expect(category).toHaveProperty("totalMinutes");
      expect(category).toHaveProperty("percentage");
    });
  });

  it("should return one specific category and their entries between 15th November 2023 and 15th February 2024", async () => {
    const response = await request
      .get(
        `/api/habit-categories/date-range-metrics?startDate=2023-11-15&endDate=2024-02-15&categoryId=${categoryId1}`
      )
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body.totalMinutes).toBe(315);

    expect(response.body).toHaveProperty("categoryCount");
    expect(response.body.categoryData.length).toBe(1);

    expect(response.body).toHaveProperty("daysWithRecords");
    expect(response.body.daysWithRecords).toBe(7);

    expect(response.body.categoryData[0].name).toBe("NewCategory1");

    response.body.categoryData.forEach((category) => {
      expect(category).toHaveProperty("name");
      expect(category).toHaveProperty("totalMinutes");
      expect(category).toHaveProperty("percentage");
    });
  });

  it("should return categories even if the date range is reversed (December to January 2024)", async () => {
    const response = await request
      .get(
        `/api/habit-categories/date-range-metrics?startDate=2024-12-31&endDate=2024-01-01`
      )
      .set("Cookie", cookie);

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body.totalMinutes).toBe(3240);

    expect(response.body).toHaveProperty("categoryData");
    expect(response.body.categoryData.length).toBe(3);
  });

  it("should fail if the date range is empty strings", async () => {
    const response = await request
      .get(`/api/habit-categories/date-range-metrics?startDate={}&endDate={}`)
      .set("Cookie", cookie);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe(
      "Invalid date format. Please use YYYY-MM-DD format."
    );
  });

  it("should fail if the date range is null", async () => {
    const response = await request
      .get(`/api/habit-categories/date-range-metrics?startDate=&endDate=`)
      .set("Cookie", cookie);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe(
      "Invalid date format. Please use YYYY-MM-DD format."
    );
  });

  it("should return 404 if a category ID does not exist or doesn't belong to the user", async () => {
    const invalidCategoryId = "610c512de7f5c72f44bc2641";

    const response = await request
      .get(
        `/api/habit-categories/date-range-metrics?startDate=2024-01-01&endDate=2024-12-31&categoryId=${invalidCategoryId}`
      )
      .set("Cookie", cookie);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Category not found");
  });

  it("should return metrics for all categories across multiple years", async () => {
    const response = await request
      .get(
        `/api/habit-categories/date-range-metrics?startDate=2020-01-01&endDate=2024-12-31`
      )
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body.categoryData.length).toBe(3);
  });

  it("should return metrics for all categories for a specific year", async () => {
    const response = await request
      .get(
        `/api/habit-categories/date-range-metrics?startDate=2024-01-01&endDate=2024-12-31`
      )
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body.categoryData.length).toBe(3);
  });

  it("should return 400 error if only one of the dates is invalid", async () => {
    const response = await request
      .get(
        `/api/habit-categories/date-range-metrics?startDate=invalid&endDate=2024-12-31`
      )
      .set("Cookie", cookie);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe(
      "Invalid date format. Please use YYYY-MM-DD format."
    );
  });

  it("should return metrics for a single day range", async () => {
    const response = await request
      .get(
        `/api/habit-categories/date-range-metrics?startDate=2024-06-02&endDate=2024-06-02`
      )
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.daysWithRecords).toBe(1); // Assuming there's data for this day
  });

  it("should return success with category count = 0 if there are no records in the specified date range", async () => {
    const response = await request
      .get(
        `/api/habit-categories/date-range-metrics?startDate=2025-01-01&endDate=2025-12-31`
      )
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.totalMinutes).toBe(0);
    expect(response.body.categoryCount).toBe(0); // Expecting count to be 0 for active categories
    expect(response.body.daysWithRecords).toBe(0);
    expect(response.body.categoryData.length).toBe(3); // Expecting 9 categories returned, even if they have no records
  });
});
