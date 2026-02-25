import { test, expect } from '@playwright/test';

test.describe('CBT Student Flow', () => {
  const examId = 'exam-123';
  const attemptId = 'attempt-123';

  test.beforeEach(async ({ page }) => {
    // Mock Auth (Simulate logged in student)
    // Assuming the app checks a token or cookie.
    // If complex, we might need to actually login.
    // But let's try to mock the API calls first.

    // NOTE: In a real app with HttpOnly cookies, we'd need to actually login via UI or API context.
    // Here we will assume we can bypass or use a mock login page if it exists.
    // For this environment, let's use the standard login helper from the repo if possible,
    // OR just try to mock the network responses and see if the page renders (assuming client-side fetching).

    // Actually, use the fixture login pattern from existing tests
    // But we need a student role.

    // Let's rely on network mocking for data, but we still need to be "authenticated" to access the protected route.
    // I'll try to use the login page object to login as "student" (if valid credential exists)
    // OR just verify the frontend behavior assuming we are on the page.

    // Since I don't have a guaranteed student credential, I will focus on mocking the API responses
    // and verify the UI logic. I will simulate the auth state if local storage/cookie based.
  });

  test('should list exams, take exam, and show result', async ({ page }) => {
    // 1. Mock Exams List
    await page.route('**/api/cbt/exams/student', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: [
            {
              id: examId,
              title: 'Mock Final Exam',
              subject: { name: 'Mathematics' },
              scheduledAt: new Date().toISOString(),
              duration: 60,
              attemptStatus: null
            }
          ]
        }
      });
    });

    // 2. Mock Start Exam
    await page.route(`**/api/cbt/exams/${examId}/start`, async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            id: attemptId,
            examId: examId,
            status: 'IN_PROGRESS',
            startedAt: new Date().toISOString(),
            exam: { // Minimal exam data needed for next page fetch? Actually start returns attempt
                // The next page fetches attempt details
            }
          }
        }
      });
    });

    // 3. Mock Get Attempt (Questions)
    await page.route(`**/api/cbt/attempts/${attemptId}`, async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            id: attemptId,
            status: 'IN_PROGRESS',
            startedAt: new Date().toISOString(),
            answers: [],
            exam: {
              title: 'Mock Final Exam',
              duration: 60,
              questionBank: {
                questions: [
                  {
                    id: 'q1',
                    type: 'MULTIPLE_CHOICE',
                    content: 'What is 2 + 2?',
                    options: [
                      { id: 'opt1', text: '3' },
                      { id: 'opt2', text: '4' }
                    ],
                    order: 0
                  },
                  {
                    id: 'q2',
                    type: 'TRUE_FALSE',
                    content: 'The earth is flat.',
                    order: 1
                  }
                ]
              }
            }
          }
        }
      });
    });

    // 4. Mock Submit Answer
    await page.route(`**/api/cbt/attempts/${attemptId}/answer`, async route => {
      await route.fulfill({ json: { success: true } });
    });

    // 5. Mock Finish Exam
    await page.route(`**/api/cbt/attempts/${attemptId}/finish`, async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            id: attemptId,
            status: 'COMPLETED',
            score: 80,
            finishedAt: new Date().toISOString(),
            exam: {
                title: 'Mock Final Exam',
                maxScore: 100
            }
          }
        }
      });
    });

    // Navigate to exams page
    // We assume we are logged in. If not, this might redirect to login.
    // In a real test run, we'd need to handle auth.
    // Here we assume the test runner has setup auth state or we bypass it via mocks if the app checks /api/auth/me

    // Mock /api/auth/me or similar if needed
    await page.route('**/api/auth/me', async route => {
        await route.fulfill({
            json: {
                success: true,
                data: {
                    id: 'student-1',
                    role: 'STUDENT',
                    name: 'Test Student'
                }
            }
        });
    });

    await page.goto('/cbt/exams');

    // Verify list
    await expect(page.getByText('Mock Final Exam')).toBeVisible();
    await expect(page.getByText('Mathematics')).toBeVisible();

    // Start Exam
    await page.getByText('Start Exam').click();

    // Should navigate to take page
    await expect(page).toHaveURL(new RegExp(`/cbt/take/${attemptId}`));
    await expect(page.getByText('Question 1')).toBeVisible();
    await expect(page.getByText('What is 2 + 2?')).toBeVisible();

    // Answer Q1
    await page.getByLabel('4').click();

    // Next Question
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Question 2')).toBeVisible();
    await expect(page.getByText('The earth is flat.')).toBeVisible();

    // Answer Q2
    await page.getByLabel('False').click();

    // Finish
    await page.getByRole('button', { name: 'Finish Exam' }).click();

    // Should navigate to result
    await expect(page).toHaveURL(new RegExp(`/cbt/result/${attemptId}`));
    await expect(page.getByText('Exam Completed!')).toBeVisible();
    await expect(page.getByText('80')).toBeVisible(); // Score
  });
});
