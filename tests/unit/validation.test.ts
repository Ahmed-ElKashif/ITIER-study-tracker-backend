import {
  validateEmail,
  validateUsername,
  validatePassword,
  sanitizeInput,
} from "../../src/utils/validation";

describe("Validation Utilities", () => {
  describe("validateEmail", () => {
    it("should return true for valid emails", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name+tag@domain.co.uk")).toBe(true);
    });

    it("should return false for invalid emails", () => {
      expect(validateEmail("invalid-email")).toBe(false);
      expect(validateEmail("@missinglocal.com")).toBe(false);
      expect(validateEmail("missingdomain@.com")).toBe(false);
      expect(validateEmail("spaces in@email.com")).toBe(false);
    });

    it("should handle null/undefined safely", () => {
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
    });
  });

  describe("validateUsername", () => {
    it("should return true for valid usernames", () => {
      expect(validateUsername("john_doe")).toBe(true);
      expect(validateUsername("jane-smith-123")).toBe(true);
      expect(validateUsername("abc")).toBe(true);
    });

    it("should return false for invalid usernames", () => {
      expect(validateUsername("ab")).toBe(false); // Too short
      expect(validateUsername("john doe")).toBe(false); // Contains space
      expect(validateUsername("john@doe")).toBe(false); // Contains @
      expect(validateUsername("this_username_is_way_too_long_for_the_system")).toBe(false); // Too long
    });

    it("should handle null/undefined safely", () => {
      expect(validateUsername(null as any)).toBe(false);
      expect(validateUsername(undefined as any)).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("should return true for valid passwords", () => {
      expect(validatePassword("password123")).toBe(true);
      expect(validatePassword("123456")).toBe(true);
    });

    it("should return false for invalid passwords", () => {
      expect(validatePassword("short")).toBe(false); // < 6 chars
      expect(validatePassword("12345")).toBe(false);
    });

    it("should handle null/undefined safely", () => {
      expect(validatePassword(null as any)).toBe(false);
      expect(validatePassword(undefined as any)).toBe(false);
    });
  });

  describe("sanitizeInput", () => {
    it("should strip HTML tags", () => {
      expect(sanitizeInput("<h1>Title</h1>Hello")).toBe("TitleHello");
      expect(sanitizeInput("<b>Bold text</b>")).toBe("Bold text");
    });

    it("should trim whitespace", () => {
      expect(sanitizeInput("  padded text  ")).toBe("padded text");
    });

    it("should handle null/undefined safely", () => {
      expect(sanitizeInput(null)).toBe("");
      expect(sanitizeInput(undefined)).toBe("");
    });
  });
});
