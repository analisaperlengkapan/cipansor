/**
 * E2E Test Utilities - Central Export
 * Import all fixtures, helpers, and page objects from here
 */

// Core exports (use auth fixture as primary test/expect)
export { test, expect, testUsers, loginAsUser, logout } from './fixtures/auth.fixture';
export type { AuthUser } from './fixtures/auth.fixture';

// API Mocking (aliased to avoid conflict)
export { test as apiTest, APIMocker } from './fixtures/api.fixture';
export type { MockAPIResponse } from './fixtures/api.fixture';

// Helpers
export * from './helpers/page-helpers';

// Page Objects
export * from './page-objects';
