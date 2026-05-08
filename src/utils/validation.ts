/**
 * Validation Utilities
 * Shared input validation helpers referenced in the backend strategy doc.
 *
 * These are lightweight validators for controllers/services.
 * Zod schemas handle full request-body validation — these helpers are
 * for standalone field-level checks and sanitisation.
 */

/**
 * Validate an email address.
 * @returns true if the email format is valid.
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  // RFC-5322-ish: requires local@domain.tld
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Validate a username.
 * Rules: 3–30 chars, alphanumeric + underscores/hyphens, no spaces or @ symbols.
 * @returns true if valid.
 */
export function validateUsername(username: string): boolean {
  if (!username || typeof username !== "string") return false;
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 30) return false;
  const re = /^[a-zA-Z0-9_-]+$/;
  return re.test(trimmed);
}

/**
 * Validate a password.
 * Rules: minimum 6 characters (allows simple passwords for student demo accounts).
 * @returns true if valid.
 */
export function validatePassword(password: string): boolean {
  if (!password || typeof password !== "string") return false;
  return password.length >= 6;
}

/**
 * Sanitise a string input:
 * - Returns empty string for null/undefined
 * - Trims whitespace
 * - Strips HTML/script tags to prevent XSS
 */
export function sanitizeInput(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value).trim();
  // Remove any HTML tags
  return str.replace(/<[^>]*>/g, "");
}
