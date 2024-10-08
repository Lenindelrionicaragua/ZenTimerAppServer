import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";
import HabitCategory from "../../../models/habitCategory.js";
import User from "../../../models/userModels.js";
import mockData from "../../../__testUtils__/mockHabitCategoryData.json";

const request = supertest(app);

let userId;

// Conectar a la base de datos mock antes de todas las pruebas
beforeAll(async () => {
  await connectToMockDB();
});

// Limpiar la base de datos mock después de cada prueba
afterEach(async () => {
  await clearMockDatabase();
});

// Cerrar la conexión con la base de datos mock después de todas las pruebas
afterAll(async () => {
  await closeMockDatabase();
});

// Poblar la base de datos con un usuario y categorías antes de cada prueba
beforeEach(async () => {
  const user = new User({
    _id: mockData.user._id,
    name: mockData.user.name,
    email: mockData.user.email,
  });
  await user.save();
  userId = user._id;

  // Poblar la base de datos con las categorías de ejemplo
  const categories = mockData.categories.map((category) => ({
    ...category,
    createdBy: userId,
  }));
  await HabitCategory.insertMany(categories);
});

describe("GET /api/test/habit-categories", () => {
  it("should return the total time for a specific category", async () => {
    const response = await request.get("/api/test/habit-categories").query({
      years: "2024",
      startDate: "2024-10-05",
      endDate: "2024-10-07",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body).toHaveProperty("categoryStats");

    const { categoryStats } = response.body;
    const workCategory = categoryStats.find(
      (category) => category.name === "Work"
    );

    expect(workCategory).toBeDefined();
    expect(workCategory.averageMinutes.daily).toBeGreaterThan(0); // Validar que se haya calculado correctamente
  });

  it("should return 404 if no categories found for the user", async () => {
    // Limpiar la base de datos para probar cuando no hay categorías
    await clearMockDatabase();

    const response = await request.get("/api/test/habit-categories").query({
      years: "2024",
      startDate: "2024-10-05",
      endDate: "2024-10-07",
    });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("No categories found for this user.");
  });
});
