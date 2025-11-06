export function evaluateConditionalVisibility(
  visibleIf: Record<string, any>,
  formData: Record<string, any>
): boolean {
  for (const [key, expected] of Object.entries(visibleIf)) {
    const actual = formData[key];
    if (Array.isArray(expected)) {
      if (!expected.includes(actual)) return false;
    } else if (actual !== expected) {
      return false;
    }
  }
  return true;
}
