
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { getTodayIST } = require("../src/utils/dateUtils");

const mockQuery = jest.fn();

jest.mock("../src/config/db", () => ({
  query: (...args) => mockQuery(...args),
  pool: {
    connect: jest.fn(),
  },
}));

process.env.JWT_SECRET = "sweety-test-secret";

const app = require("../src/app");

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });

const token = createToken(7);

describe("Reports API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("requires authentication", async () => {
    const response = await request(app)
      .get("/api/reports");

    expect(response.status).toBe(401);
  });

  test("rejects an invalid report date", async () => {
    const response = await request(app)
      .get("/api/reports?date=2026-02-30")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test("rejects a future report date", async () => {
    const tomorrow = new Date(`${getTodayIST()}T00:00:00.000Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const futureDate = tomorrow.toISOString().slice(0, 10);

    const response = await request(app)
      .get(`/api/reports?date=${futureDate}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test("returns daily, month-to-date and previous-month statistics", async () => {
    const selectedDate = "2026-10-15";

    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            reading_date: "2026-10-01",
            time_slot: "morning",
            glucose_value: 100,
          },
          {
            id: 2,
            reading_date: selectedDate,
            time_slot: "morning",
            glucose_value: 121,
          },
          {
            id: 3,
            reading_date: selectedDate,
            time_slot: "after_lunch",
            glucose_value: 130,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 4,
            reading_date: "2026-09-05",
            time_slot: "morning",
            glucose_value: 110,
          },
          {
            id: 5,
            reading_date: "2026-09-20",
            time_slot: "after_lunch",
            glucose_value: 150,
          },
        ],
      });

    const response = await request(app)
      .get(`/api/reports?date=${selectedDate}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.selectedDate).toBe(selectedDate);

    // Daily report
    expect(response.body.daily).toMatchObject({
      date: selectedDate,
      highest: 130,
      lowest: 121,
      average: 125.5,
      count: 2,
    });

    expect(response.body.daily.readings).toHaveLength(2);

    // Month-to-date report
    expect(response.body.monthToDate).toMatchObject({
      startDate: "2026-10-01",
      endDate: selectedDate,
      highest: 130,
      lowest: 100,
      average: 117,
      count: 3,
    });

    // Previous month report
    expect(response.body.monthly).toMatchObject({
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      highest: 150,
      lowest: 110,
      average: 130,
      count: 2,
    });

    // Both queries must be scoped to the authenticated user.
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockQuery.mock.calls[0][1]).toEqual([
      7,
      "2026-10-01",
      selectedDate,
    ]);
    expect(mockQuery.mock.calls[1][1]).toEqual([
      7,
      "2026-09-01",
      "2026-09-30",
    ]);
  });

  test("returns null statistics for empty reports", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .get("/api/reports?date=2026-10-15")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.daily).toMatchObject({
      highest: null,
      lowest: null,
      average: null,
      count: 0,
      readings: [],
    });

    expect(response.body.monthToDate).toMatchObject({
      highest: null,
      lowest: null,
      average: null,
      count: 0,
    });

    expect(response.body.monthly).toMatchObject({
      highest: null,
      lowest: null,
      average: null,
      count: 0,
    });
  });

  test("calculates the previous month's date range correctly across a leap year", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .get("/api/reports?date=2024-03-15")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.monthly.startDate).toBe("2024-02-01");
    expect(response.body.monthly.endDate).toBe("2024-02-29");
  });

  test("does not return another user's report data", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .get("/api/reports?date=2026-10-15")
      .set("Authorization", `Bearer ${createToken(42)}`);

    expect(response.status).toBe(200);

    expect(mockQuery.mock.calls[0][1][0]).toBe(42);
    expect(mockQuery.mock.calls[1][1][0]).toBe(42);
  });
});
