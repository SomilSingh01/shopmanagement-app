import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;

  // Remove 'use client'
  if (content.includes("'use client'") || content.includes('"use client"')) {
    content = content.replace(/'use client'\n?/g, '');
    content = content.replace(/"use client"\n?/g, '');
    changed = true;
  }

  // next/link -> react-router-dom
  if (content.includes('next/link')) {
    content = content.replace(/import Link from 'next\/link'/g, "import { Link } from 'react-router-dom'");
    changed = true;
  }

  // next/navigation
  if (content.includes('next/navigation')) {
    content = content.replace(/import { useRouter } from 'next\/navigation'/g, "import { useNavigate } from 'react-router-dom'");
    content = content.replace(/import { usePathname } from 'next\/navigation'/g, "import { useLocation } from 'react-router-dom'");
    content = content.replace(/const router = useRouter\(\)/g, "const navigate = useNavigate()");
    content = content.replace(/router\.push\(/g, "navigate(");
    content = content.replace(/const pathname = usePathname\(\)/g, "const location = useLocation()");
    content = content.replace(/pathname/g, "location.pathname");
    // In case router was a dependency in useEffect
    content = content.replace(/, router\]/g, ", navigate]");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
}
console.log('Migration script complete.');
