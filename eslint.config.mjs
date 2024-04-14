export default {
    files: ['*.ts'], // Default language
    // Your other root-level config settings...
    overrides: [
      {
        files: ['**/*.ts'],
        parser: '@typescript-eslint/parser',
        // Your other TypeScript-specific config settings...
      },
      // Your other overrides...
    ],
    // ...more config settings
  };
  