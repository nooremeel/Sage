const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

function isServerRunning(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(Boolean(res.statusCode && res.statusCode < 500));
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      if (Date.now() - start > timeoutMs) {
        return reject(new Error(`Timed out after ${timeoutMs}ms waiting for ${url}`));
      }
      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          resolve();
        } else {
          setTimeout(check, 500);
        }
      });
      req.on('error', () => {
        setTimeout(check, 500);
      });
      req.setTimeout(1500, () => req.destroy());
    }
    check();
  });
}

async function main() {
  process.chdir(path.resolve(__dirname, '..'));

  const alreadyRunning = await isServerRunning('http://localhost:3000');
  let nextProcess = null;

  if (alreadyRunning) {
    console.log('Next.js server is already active on http://localhost:3000. Reusing existing instance...');
  } else {
    console.log('Starting Next.js dev server on port 3000...');
    nextProcess = spawn(
      process.execPath,
      ['./node_modules/next/dist/bin/next', 'dev', '-p', '3000'],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' },
      }
    );

    nextProcess.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('Ready in') || msg.includes('Starting...')) {
        process.stdout.write(msg);
      }
    });

    nextProcess.stderr.on('data', (d) => {
      process.stderr.write(d.toString());
    });

    console.log('Waiting for http://localhost:3000 to be ready...');
    await waitForServer('http://localhost:3000', 45000);
  }

  try {
    console.log('Next.js server is ready! Running Playwright tests...\n');

    const testArgs = process.argv.slice(2);
    const playwrightArgs = [
      './node_modules/@playwright/test/cli.js',
      'test',
      ...(testArgs.length > 0 ? testArgs : ['e2e/home-page.spec.ts', 'e2e/demo-personas.spec.ts']),
    ];

    const testProcess = spawn(process.execPath, playwrightArgs, {
      stdio: 'inherit',
      env: { ...process.env, CI: '1' },
    });

    const exitCode = await new Promise((resolve) => {
      testProcess.on('close', resolve);
    });

    process.exit(exitCode || 0);
  } catch (err) {
    console.error('E2E Runner failed:', err);
    process.exit(1);
  } finally {
    if (nextProcess) {
      console.log('Stopping Next.js dev server...');
      nextProcess.kill('SIGTERM');
    }
  }
}

main();
