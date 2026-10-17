module.exports = {
  root: true,
  extends: ['expo', 'universe/native'],
  rules: {
    'react-hooks/exhaustive-deps': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    radix: 'error',
  },
}
