/**
 * Utility functions for sanitizing and formatting student user data.
 */

/**
 * Sanitizes a student's name to ensure it contains ONLY alphabetic characters and spaces.
 * Strips any student IDs, numbers, punctuation, and redundant whitespace.
 *
 * @param name The raw name string from the user profile or LMS (e.g. "AYUSH KUMAR 2500032102").
 * @param fallback Fallback string if no alphabetic characters exist.
 * @returns Cleaned student name containing only letters and spaces (e.g. "AYUSH KUMAR").
 */
export function getCleanStudentName(name?: string | null, fallback: string = 'Student'): string {
  if (!name) return fallback;
  // Replace non-alphabetical characters with a space, collapse multiple spaces, and trim
  const cleaned = name.replace(/[^a-zA-Z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || fallback;
}
