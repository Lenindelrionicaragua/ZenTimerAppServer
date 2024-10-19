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
  it("should return time metrics for a specific category in January 2024", async () => {
    const response = await request
      .get(
        `/api/habit-categories/time-metrics?startDate=2024-01-01&endDate=2024-01-31&categoryId=${categoryId1}`
      )
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body).toHaveProperty("categoryData");
    expect(response.body.categoryData.length).toBeGreaterThan(0);
  });

  // Otros casos de prueba...
});
