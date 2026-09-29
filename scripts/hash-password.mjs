// Usage: npm run hash-password            (asks for the password, input hidden)
//        npm run hash-password -- 'parol'  (non-interactive)
// Prints ADMIN_PASSWORD_HASH (base64-encoded bcrypt, safe to paste into Vercel or .env)
// and a fresh random SESSION_SECRET.
import { hash } from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';

function ask(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => rl.output.write(s.includes(question) ? s : '*'.repeat(s.length ? 1 : 0));
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

const password = process.argv[2] ?? (await ask('Admin parolu: '));
if (!password || password.length < 8) {
  console.error('Parol ən az 8 simvol olmalıdır.');
  process.exit(1);
}
const bcrypt = await hash(password, 12);
console.log('\nVercel → Settings → Environment Variables:\n');
console.log(`ADMIN_PASSWORD_HASH=${Buffer.from(bcrypt).toString('base64')}`);
console.log(`SESSION_SECRET=${randomBytes(32).toString('base64url')}`);
