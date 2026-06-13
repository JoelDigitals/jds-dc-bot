const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function timestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

const logger = {
  info: (msg) => console.log(`${colors.cyan}[${timestamp()}] [INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[${timestamp()}] [OK]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[${timestamp()}] [WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[${timestamp()}] [ERROR]${colors.reset} ${msg}`),
  bot: (msg) => console.log(`${colors.magenta}[${timestamp()}] [BOT]${colors.reset} ${msg}`),
  web: (msg) => console.log(`${colors.blue}[${timestamp()}] [WEB]${colors.reset} ${msg}`)
};

module.exports = logger;
