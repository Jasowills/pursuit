/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  // workspace packages ship CJS; map TS sources for jest's CJS runtime
  moduleNameMapper: {
    '^@pursuit/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@pursuit/shared/server$': '<rootDir>/../../packages/shared/src/server.ts',
    '^@pursuit/agent-core$': '<rootDir>/../../packages/agent-core/src/index.ts',
    '^@pursuit/database$': '<rootDir>/../../packages/database/src/index.ts',
  },
  testTimeout: 30000,
};
