import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'jsdom',
  // Note: setupFilesAfterFramework is loaded via jest.setup.ts
  setupFilesAfterEach: undefined,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/__tests__/__mocks__/styleMock.js',
  },
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        strict: false,
      },
    }],
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  coverageThreshold: {
    global: {
      lines: 80,
    },
  },
}

export default config
