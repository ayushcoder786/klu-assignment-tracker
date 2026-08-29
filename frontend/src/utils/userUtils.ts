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

/**
 * Determines whether a student/user object represents a test or dummy account.
 * Identifies accounts created for testing (e.g. Dummy, Integration Test Student, dummy@gmail.com).
 *
 * @param student The student or user profile object.
 * @returns true if the user is a test or dummy account, false if genuine.
 */
export function isTestStudent(student?: {
  name?: string | null;
  email?: string | null;
  studentId?: string | null;
} | null): boolean {
  if (!student) return true;

  const studentId = (student.studentId || '').trim().toLowerCase();
  const name = (student.name || '').trim().toLowerCase();
  const email = (student.email || '').trim().toLowerCase();

  // 1. Check known test student IDs or test ID patterns
  if (
    studentId === '2200039999' ||
    studentId === '9999999999' ||
    studentId.includes('test') ||
    studentId.includes('dummy')
  ) {
    return true;
  }

  // 2. Check test/dummy name patterns
  if (
    name.includes('dummy') ||
    name.includes('integration test') ||
    name.includes('test student') ||
    name.includes('test user') ||
    name === 'test' ||
    name.startsWith('test ') ||
    name.startsWith('dummy ')
  ) {
    return true;
  }

  // 3. Check test/dummy email patterns
  if (
    email.includes('dummy') ||
    email.endsWith('@example.com') ||
    email.endsWith('@test.com') ||
    email.endsWith('@localhost') ||
    email.startsWith('test@') ||
    email.startsWith('test.') ||
    email.startsWith('test_')
  ) {
    return true;
  }

  // 4. Accounts without studentId that are test accounts or not genuine student records
  if (!studentId && !email.endsWith('@kluniversity.in')) {
    return true;
  }

  return false;
}

/**
 * Helper to check if a string looks like a 24-character hexadecimal MongoDB ObjectId.
 */
export function isMongoObjectId(val?: string | null): boolean {
  if (!val) return false;
  return /^[0-9a-fA-F]{24}$/.test(val.trim());
}

/**
 * Returns formatted student name and student ID for display in admin UI tables and status cards.
 * Ensures that raw MongoDB ObjectIds (e.g. "6a8ed541e2780223698d1733") are never displayed as names or IDs,
 * falling back gracefully to 'Unknown Student' and clean values.
 *
 * @param rawName Raw name or database field
 * @param rawStudentId Raw student ID or database field
 * @returns { name: string, studentId: string }
 */
export function formatStudentDisplay(
  rawName?: string | null,
  rawStudentId?: string | null
): { name: string; studentId: string } {
  let name = (rawName || '').trim();
  let studentId = (rawStudentId || '').trim();

  // If studentId is an ObjectId, clear it as studentId
  if (isMongoObjectId(studentId)) {
    studentId = '';
  }

  // If name is an ObjectId or empty, resolve fallback
  if (isMongoObjectId(name) || !name) {
    if (studentId) {
      name = studentId;
    } else {
      name = 'Unknown Student';
    }
  } else {
    name = getCleanStudentName(name, studentId || 'Student');
  }

  // If studentId is still empty, check if rawStudentId is present
  if (!studentId) {
    if (rawStudentId && !isMongoObjectId(rawStudentId)) {
      studentId = rawStudentId;
    } else {
      studentId = '—';
    }
  }

  return { name, studentId };
}


