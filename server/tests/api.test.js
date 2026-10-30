
const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const mockQuery = jest.fn();
const mockConnect = jest.fn();

jest.mock("../src/config/db", () => ({
  query: (...args) => mockQuery(...args),
  pool: {
    connect: (...args) => mockConnect(...args),
  },
}));

process.env.JWT_SECRET = "sweety-test-secret";

const app = require("../src/app");
const { getTodayIST } = require("../src/utils/dateUtils");

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });

describe("Sweety API integration tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    test("registers a new user successfully", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            name: "Test User",
            email: "test@example.com",
            created_at: new Date(),
          }],
        });

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "TEST@example.com",
          password: "Password123",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeTruthy();
      expect(response.body.user.email).toBe("test@example.com");
      expect(response.body.user.password).toBeUndefined();
    });

    test("rejects registration with invalid input", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "",
          email: "invalid-email",
          password: "123",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    test("rejects an already registered email", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1 }],
      });

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "Password123",
        });

      expect(response.status).toBe(409);
    });

    test("logs in with valid credentials", async () => {
      const hashedPassword = await bcrypt.hash("Password123", 4);

      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: "Test User",
          email: "test@example.com",
          password: hashedPassword,
          created_at: new Date(),
        }],
      });

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "TEST@example.com",
          password: "Password123",
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeTruthy();
      expect(response.body.user.password).toBeUndefined();
    });

    test("rejects an invalid password", async () => {
      const hashedPassword = await bcrypt.hash("Password123", 4);

      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: "Test User",
          email: "test@example.com",
          password: hashedPassword,
        }],
      });

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "WrongPassword",
        });

      expect(response.status).toBe(401);
    });

    test("rejects access to profile without a token", async () => {
      const response = await request(app)
        .get("/api/auth/profile");

      expect(response.status).toBe(401);
    });

    test("rejects an invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });

    test("returns the authenticated user's profile", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 7,
          name: "Test User",
          email: "test@example.com",
        }],
      });

      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${createToken(7)}`);

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe(7);
      expect(mockQuery.mock.calls[0][1]).toEqual([7]);
    });
  });

  describe("Glucose readings", () => {
    test("requires authentication to access readings", async () => {
      const response = await request(app)
        .get("/api/readings");

      expect(response.status).toBe(401);
    });

    test("rejects a glucose value below 40", async () => {
      const response = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${createToken(7)}`)
        .send({
          date: getTodayIST(),
          time_slot: "morning",
          value: 39,
        });

      expect(response.status).toBe(400);
      expect(mockConnect).not.toHaveBeenCalled();
    });

    test("rejects a glucose value above 600", async () => {
      const response = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${createToken(7)}`)
        .send({
          date: getTodayIST(),
          time_slot: "morning",
          value: 601,
        });

      expect(response.status).toBe(400);
      expect(mockConnect).not.toHaveBeenCalled();
    });

    test("rejects an invalid time slot", async () => {
      const response = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${createToken(7)}`)
        .send({
          date: getTodayIST(),
          time_slot: "midnight",
          value: 120,
        });

      expect(response.status).toBe(400);
      expect(mockConnect).not.toHaveBeenCalled();
    });

    test("rejects a future reading date", async () => {
      const tomorrow = new Date(`${getTodayIST()}T00:00:00.000Z`);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

      const futureDate = tomorrow.toISOString().slice(0, 10);

      const response = await request(app)
        .post("/api/readings")
        .set("Authorization", `Bearer ${createToken(7)}`)
        .send({
          date: futureDate,
          time_slot: "morning",
          value: 120,
        });

      expect(response.status).toBe(400);
      expect(mockConnect).not.toHaveBeenCalled();
    });

    test("returns only the authenticated user's readings", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 10,
          reading_date: getTodayIST(),
          time_slot: "morning",
          glucose_value: 120,
        }],
      });

      const response = await request(app)
        .get("/api/readings")
        .set("Authorization", `Bearer ${createToken(7)}`);

      expect(response.status).toBe(200);
      expect(response.body.readings).toHaveLength(1);

      // The SQL query must be scoped to the authenticated user.
      expect(mockQuery.mock.calls[0][0]).toContain("WHERE user_id = $1");
      expect(mockQuery.mock.calls[0][1]).toEqual([7]);
    });

    test("does not expose another user's reading", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get("/api/readings/99")
        .set("Authorization", `Bearer ${createToken(7)}`);

      expect(response.status).toBe(404);
      expect(mockQuery.mock.calls[0][1]).toEqual(["99", 7]);
    });
  });
});
