
    it('should allow admin to grade manual answers even if not assigned teacher', async () => {
      vi.mocked(prisma.examAttempt.findUnique).mockResolvedValue({
        id: 'attempt-essay', studentId: 'std-1', examId: 'exam-1',
        exam: { teacher: { userId: 'teacher-1' }, maxScore: 100, questionBank: { questions: [] } },
        answers: [],
      } as any);
      await expect(CBTService.gradeManualAnswers('attempt-essay', 'admin-1', [], 'SUPER_ADMIN')).resolves.toBeDefined();
    });
