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
    { name: "Work", createdAt: "2024-01-12" },
    { name: "Exercise", createdAt: "2024-01-12" },
    { name: "Study", createdAt: "2024-01-12" },
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
          .post(`/api/daily-records/${categoryId}`)
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
});

afterAll(async () => {
  await clearMockDatabase();
  await closeMockDatabase();
});

describe("getTimeMetricsByDateRange", () => {
  // Make the request with specific dates and verify that the minutes
  // totals and other metrics are as expected for the categories.
  // it("should return all categories and their entries between 15th February and 31st December 2023", async () => {
  //   const response = await request
  //     .get(
  //       `/api/habit-categories/time-metrics?startDate=2023-02-15&endDate=2023-12-31`
  //     )
  //     .set("Cookie", cookie);

  //   expect(response.status).toBe(200);
  //   expect(response.body.success).toBe(true);

  //   expect(response.body).toHaveProperty("totalMinutes");
  //   expect(response.body.totalMinutes).toBe(2835);

  //   expect(response.body).toHaveProperty("categoryCount");
  //   expect(response.body.categoryData.length).toBe(3);

  //   expect(response.body).toHaveProperty("daysWithRecords");
  //   expect(response.body.daysWithRecords).toBe(21);

  //   expect(response.body).toHaveProperty("categoryData");

  //   response.body.categoryData.forEach((category) => {
  //     expect(category).toHaveProperty("name");
  //     expect(category).toHaveProperty("totalMinutes");
  //     expect(category).toHaveProperty("percentage");
  //   });
  // });

  // it("should return all categories and their entries between 15th November 2023 and 15th February 2024", async () => {
  //   const response = await request
  //     .get(
  //       `/api/habit-categories/time-metrics?startDate=2023-11-15&endDate=2024-02-15`
  //     )
  //     .set("Cookie", cookie);

  //   expect(response.status).toBe(200);
  //   expect(response.body.success).toBe(true);

  //   expect(response.body).toHaveProperty("totalMinutes");
  //   expect(response.body.totalMinutes).toBe(1350);

  //   expect(response.body).toHaveProperty("categoryCount");
  //   expect(response.body.categoryData.length).toBe(3);

  //   expect(response.body).toHaveProperty("daysWithRecords");
  //   expect(response.body.daysWithRecords).toBe(9);

  //   response.body.categoryData.forEach((category) => {
  //     expect(category).toHaveProperty("name");
  //     expect(category).toHaveProperty("totalMinutes");
  //     expect(category).toHaveProperty("percentage");
  //   });
  // });

  it("should return all categories and their entries between 1st and 7th March 2023", async () => {
    const response = await request
      .get(
        `/api/habit-categories/time-metrics?startDate=2023-03-01&endDate=2023-03-07`
      )
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Verificar los minutos totales esperados para esa semana
    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body.totalMinutes).toBe(135); // Ajusta basado en los registros predefinidos

    expect(response.body).toHaveProperty("categoryCount");
    expect(response.body.categoryData.length).toBe(3);

    // Verificar la cantidad de días con registros
    expect(response.body).toHaveProperty("daysWithRecords");
    expect(response.body.daysWithRecords).toBe(1); // Basado en que solo haya un registro en ese periodo

    response.body.categoryData.forEach((category) => {
      expect(category).toHaveProperty("name");
      expect(category).toHaveProperty("totalMinutes");
      expect(category).toHaveProperty("percentage");
    });
  });

  // it("should return no data for a range without any records (1st to 10th January 2025)", async () => {
  //   const response = await request
  //     .get(
  //       `/api/habit-categories/time-metrics?startDate=2025-01-01&endDate=2025-01-10`
  //     )
  //     .set("Cookie", cookie);

  //   expect(response.status).toBe(200);
  //   expect(response.body.success).toBe(true);

  //   // Verificar que no haya minutos registrados en ese rango
  //   expect(response.body).toHaveProperty("totalMinutes");
  //   expect(response.body.totalMinutes).toBe(0); // No debería haber registros

  //   expect(response.body).toHaveProperty("categoryCount");
  //   expect(response.body.categoryData.length).toBe(0); // Ninguna categoría debería tener datos

  //   expect(response.body).toHaveProperty("daysWithRecords");
  //   expect(response.body.daysWithRecords).toBe(0); // Ningún día con registros
  // });

  // it("should return all categories and their entries between 1st January and 31st December 2024", async () => {
  //   const response = await request
  //     .get(
  //       `/api/habit-categories/time-metrics?startDate=2024-01-01&endDate=2024-12-31`
  //     )
  //     .set("Cookie", cookie);

  //   logInfo(
  //     "Response for time metrics by date range in 2024:",
  //     JSON.stringify(response.body, null, 2)
  //   );

  //   expect(response.status).toBe(200);
  //   expect(response.body).toHaveProperty("totalMinutes");
  //   expect(response.body).toHaveProperty("categoryData");
  //   expect(response.body.categoryData.length).toBeGreaterThan(0);
  //   expect(response.body.totalMinutes).toBeGreaterThanOrEqual(0);
  // });

  // it("should return all categories and their entries between 1st January and 1st July 2024", async () => {
  //   const response = await request
  //     .get(
  //       `/api/habit-categories/time-metrics?startDate=2024-01-01&endDate=2024-07-01`
  //     )
  //     .set("Cookie", cookie);

  //   logInfo(
  //     "Response for time metrics by date range in 2024:",
  //     JSON.stringify(response.body, null, 2)
  //   );

  //   expect(response.status).toBe(200);
  //   expect(response.body).toHaveProperty("totalMinutes");
  //   expect(response.body).toHaveProperty("categoryData");
  //   expect(response.body.categoryData.length).toBeGreaterThan(0);
  //   expect(response.body.totalMinutes).toBeGreaterThanOrEqual(0);
  // });

  // it("should return time metrics for a specific category in January 2024", async () => {
  //   const newMinutesUpdate = 20;

  //   // Add a record for January 2024
  //   await request
  //     .post(`/api/daily-records/${categoryId1}`)
  //     .set("Cookie", cookie)
  //     .send({
  //       minutesUpdate: newMinutesUpdate,
  //       date: "2024-01-05", // Record on January 5th
  //     });

  //   // Request time metrics for January 2024 for the category
  //   const response = await request
  //     .get(
  //       `/api/habit-categories/time-metrics?startDate=2024-01-01&endDate=2024-01-31&categoryId=${categoryId1}`
  //     )
  //     .set("Cookie", cookie);

  //   expect(response.status).toBe(200); // Ensure the response is OK

  //   // Check if time data exists in the response
  //   expect(response.body).toHaveProperty("totalMinutes");
  //   expect(response.body.totalMinutes).toBeGreaterThanOrEqual(0);

  //   // Ensure category data is returned
  //   expect(response.body).toHaveProperty("categoryData");
  //   expect(response.body.categoryData.length).toBeGreaterThan(0);

  //   // Log response body for inspection
  //   console.log("Response body:", JSON.stringify(response.body, null, 2));

  //   // Find the 'Work' category in the response
  //   const category = response.body.categoryData.find(
  //     (cat) => cat.name === "Work"
  //   );

  //   // Check if the category is present
  //   expect(category).toBeDefined();

  //   // Ensure category has records
  //   expect(category.records.length).toBeGreaterThan(0);

  //   // Check if each record belongs to the correct categoryId
  //   category.records.forEach((record) => {
  //     expect(record.categoryId).toBe(categoryId1);
  //   });

  //   // Verify that record dates are within January 2024 range
  //   category.records.forEach((record) => {
  //     const recordDate = new Date(record.date);
  //     const startDate = new Date("2024-01-01");
  //     const endDate = new Date("2024-01-31");

  //     // Compare dates as millisecond values
  //     expect(recordDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
  //     expect(recordDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
  //   });
  // });

  // it("should fail if the date range is empty strings", async () => {
  //   const response = await request
  //     .get(`/api/habit-categories/time-metrics?startDate={}&endDate={}`)
  //     .set("Cookie", cookie);

  //   expect(response.status).toBe(400);
  //   expect(response.body).toHaveProperty("error");
  //   expect(response.body.error).toBe(
  //     "Invalid date format. Please use YYYY-MM-DD format."
  //   );
  // });

  // it("should fail if the date range is null", async () => {
  //   const response = await request
  //     .get(`/api/habit-categories/time-metrics?startDate=&endDate=`)
  //     .set("Cookie", cookie);

  //   expect(response.status).toBe(400);
  //   expect(response.body).toHaveProperty("error");
  //   expect(response.body.error).toBe(
  //     "Invalid date format. Please use YYYY-MM-DD format."
  //   );
  // });

  // it("should return categories even if the date range is reversed (December to January 2024)", async () => {
  //   const response = await request
  //     .get(
  //       `/api/habit-categories/time-metrics?startDate=2024-12-01&endDate=2024-01-01`
  //     )
  //     .set("Cookie", cookie);

  //   expect(response.status).toBe(200);

  //   expect(response.body).toHaveProperty("totalMinutes");
  //   expect(response.body.totalMinutes).toBeGreaterThanOrEqual(0);

  //   expect(response.body).toHaveProperty("categoryData");
  //   expect(response.body.categoryData.length).toBeGreaterThan(0);
  //   response.body.categoryData.forEach((category) => {
  //     if (category.totalMinutes > 0) {
  //       expect(category.records.length).toBeGreaterThan(0);
  //     } else {
  //       expect(category.records.length).toBe(0);
  //     }
  //   });
  // });
});
