const {
  getTodayIST,
  isValidDate,
  isFutureDate,
} = require("../src/utils/dateUtils");

describe("Date Utility Tests", () => {
  describe("getTodayIST()", () => {
    test("should return a date in YYYY-MM-DD format", () => {
      expect(getTodayIST()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("isValidDate()", () => {
    test("should accept a valid date", () => {
      expect(isValidDate("2026-10-30")).toBe(true);
    });

    test("should reject an invalid date", () => {
      expect(isValidDate("2026-13-30")).toBe(false);
    });

    test("should reject an impossible calendar date", () => {
      expect(isValidDate("2026-02-30")).toBe(false);
    });

    test("should reject an incorrectly formatted date", () => {
      expect(isValidDate("30-10-2026")).toBe(false);
    });

    test("should reject empty or non-string values", () => {
      expect(isValidDate("")).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(20261030)).toBe(false);
    });
  });

  describe("isFutureDate()", () => {
    test("should not consider today a future date", () => {
      expect(isFutureDate(getTodayIST())).toBe(false);
    });

    test("should identify tomorrow as a future date", () => {
      const tomorrow = new Date(`${getTodayIST()}T00:00:00.000Z`);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

      const tomorrowString = tomorrow.toISOString().slice(0, 10);

      expect(isFutureDate(tomorrowString)).toBe(true);
    });

    test("should not consider yesterday a future date", () => {
      const yesterday = new Date(`${getTodayIST()}T00:00:00.000Z`);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);

      const yesterdayString = yesterday.toISOString().slice(0, 10);

      expect(isFutureDate(yesterdayString)).toBe(false);
    });
  });
});