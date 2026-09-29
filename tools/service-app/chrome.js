const fs = require('fs');
const { chromium } = require('playwright-core');

function chromePath() {
  return [process.env.CHROME, '/usr/local/bin/google-chrome', '/usr/bin/google-chrome']
    .filter(Boolean)
    .find((p) => fs.existsSync(p));
}

/** Headless Chrome tuned for file:// screenshots (register / service-app). */
async function launch() {
  const executablePath = chromePath();
  return chromium.launch({
    executablePath,
    args: ['--allow-file-access-from-files', '--font-render-hinting=none'],
  });
}

module.exports = { launch, chromePath };
