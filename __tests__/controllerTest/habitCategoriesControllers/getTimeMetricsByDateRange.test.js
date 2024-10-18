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

    // Function to generate random dates in a specific year
    const randomDatesInYears = (startYear, endYear) => {
      const dates = [];

      for (let year = startYear; year <= endYear; year++) {
        for (let month = 1; month <= 12; month++) {
          const daysInMonth = new Date(year, month, 0).getDate();
          for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
              day
            ).padStart(2, "0")}`;
            dates.push(dateStr);
          }
        }
      }

      return dates;
    };

    // Generate random dates for 2023 and 2024
    const dates = randomDatesInYears(2023, 2024);
    console.log(dates);

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

      // create 10 randomDates for each category
      for (let j = 0; j < 10; j++) {
        const randomDate = dates[Math.floor(Math.random() * dates.length)];

        const dailyRecordData = {
          minutesUpdate: 45,
          date: randomDate,
        };

        try {
          const response = await request
            .post(`/api/daily-records/${categoryId}`)
            .set("Cookie", cookie)
            .send(dailyRecordData);

          logInfo(
            `Daily record added for category ${categoryId}: ${JSON.stringify(
              response.body,
              null,
              2
            )}`
          );
        } catch (error) {
          logInfo(
            `Failed to add record for category ${categoryId}: ${error.message}`
          );
        }
      }
    }
  });

  // it("should return all categories and their entries between 15th February and 31st December 2023", async () => {
  //   const response = await request
  //     .get(
  //       `/api/habit-categories/time-metrics?startDate=2023-02-15&endDate=2023-12-31`
  //     )
  //     .set("Cookie", cookie);

  //   // Log the response to check the results
  //   logInfo(
  //     "Response for time metrics by date range:",
  //     JSON.stringify(response.body, null, 2)
  //   );

  //   expect(response.status).toBe(200);
  //   expect(response.body).toHaveProperty("totalMinutes");
  //   expect(response.body).toHaveProperty("categoryData");
  //   expect(response.body.categoryData.length).toBeGreaterThan(0);
  //   expect(response.body.totalMinutes).toBeGreaterThanOrEqual(0);
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

  it("should return time metrics for a specific category in January 2024", async () => {
    const newMinutesUpdate = 20;

    // Asegúrate de que haya registros para la categoría en el mes de enero 2024
    await request
      .post(`/api/daily-records/${categoryId1}`)
      .set("Cookie", cookie)
      .send({
        minutesUpdate: newMinutesUpdate,
        date: "2024-01-05", // Registro en enero
      });

    const response = await request
      .get(
        `/api/habit-categories/time-metrics?startDate=2024-01-01&endDate=2024-01-31&categoryId=${categoryId1}`
      )
      .set("Cookie", cookie);

    expect(response.status).toBe(200);

    // Verifica que los datos de tiempo estén presentes
    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body.totalMinutes).toBeGreaterThanOrEqual(0);

    // Verifica que la respuesta contenga los datos de la categoría
    expect(response.body).toHaveProperty("categoryData");
    expect(response.body.categoryData.length).toBeGreaterThan(0); // Al menos una categoría debe estar presente

    // Log para inspeccionar la respuesta completa
    console.log("Response body:", JSON.stringify(response.body, null, 2));

    // Encuentra la categoría correspondiente en la respuesta
    const category = response.body.categoryData.find(
      (cat) => cat.name === "Work" // Verifica si 'Work' está en la respuesta
    );

    // Verifica que la categoría esté presente en la respuesta
    expect(category).toBeDefined(); // Asegúrate de que la categoría exista en la respuesta

    // Verifica que la categoría tenga registros
    expect(category.records.length).toBeGreaterThan(0);

    // Verifica que los registros tengan los categoryId correctos
    category.records.forEach((record) => {
      expect(record.categoryId).toBe(categoryId1); // Compara el categoryId de cada registro
    });

    // Verifica que los registros tengan las fechas dentro del rango de enero 2024
    category.records.forEach((record) => {
      const recordDate = new Date(record.date);
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      // Compara las fechas como números de milisegundos
      expect(recordDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      expect(recordDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });
  });

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
