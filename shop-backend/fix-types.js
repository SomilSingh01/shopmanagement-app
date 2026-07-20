const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'src', 'controllers');

const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.controller.ts'));

for (const file of files) {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix 2: z.ZodError errors property
  content = content.replace(/\(error as z\.ZodError<any>\)\.errors/g, '(error as any).errors');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${file}`);
}
