import { afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load test fixtures
export const loadFixture = filename => {
  const filePath = path.join(__dirname, 'fixtures', filename);
  return fs.readFileSync(filePath, 'utf-8');
};

afterEach(() => {
  vi.clearAllMocks();
});
