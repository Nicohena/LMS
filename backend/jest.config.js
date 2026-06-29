/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        skipLibCheck: true,
        module: 'commonjs',
        target: 'ES2022',
        moduleResolution: 'node',
      },
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 30000,
  clearMocks: true,
  // Transform ESM packages in node_modules that Jest can't handle by default
  transformIgnorePatterns: [
    'node_modules/(?!exceljs|handlebars)',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
  ],
  coverageDirectory: 'coverage',
  verbose: false,
};
