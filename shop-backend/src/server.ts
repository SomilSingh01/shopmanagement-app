import 'dotenv/config';
import { prisma } from './prisma';
import { createApp } from './app';

const port = process.env.PORT || 5000;
const app = createApp();

// Start Server
(async () => {
  try {
    const res = await prisma.$queryRaw`SELECT 1 as ok`;
    console.log('✅ MySQL connection test succeeded →', res);
  } catch (e) {
    console.error('❌ MySQL connection test FAILED:', e);
    process.exit(1);
  }
})();

app.listen(port, () => console.log(`[server]: Server is running at http://localhost:${port}`));

