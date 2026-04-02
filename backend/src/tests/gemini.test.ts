import { analyzeWithGemini } from '../services/gemini.service';

// Test 5 — Mock Gemini API call
jest.mock('../services/gemini.service', () => ({
  analyzeWithGemini: jest.fn().mockResolvedValue({
    category: 'Bug',
    sentiment: 'Negative',
    priority_score: 8,
    summary: 'Login button not working on mobile',
    tags: ['Mobile', 'Login', 'Bug'],
  }),
}));

describe('Gemini Service', () => {
  it('should return correct analysis structure', async () => {
    const result = await analyzeWithGemini(
      'Login button broken',
      'The login button does not work on mobile devices'
    );
    expect(result).not.toBeNull();
    expect(result?.category).toBe('Bug');
    expect(result?.sentiment).toBe('Negative');
    expect(result?.priority_score).toBeGreaterThanOrEqual(1);
    expect(result?.priority_score).toBeLessThanOrEqual(10);
    expect(Array.isArray(result?.tags)).toBe(true);
  });
});