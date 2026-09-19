const crypto = require('crypto');

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SPECIAL = '!@#$%&*';
const ALL = UPPER + LOWER + DIGITS + SPECIAL;

function randomChar(charset) {
  return charset[crypto.randomInt(charset.length)];
}

// Generates a random password that always satisfies the password policy
// (upper/lower/digit/special, 12 chars), for Admin-issued temporary passwords.
function generateTempPassword(length = 12) {
  const required = [randomChar(UPPER), randomChar(LOWER), randomChar(DIGITS), randomChar(SPECIAL)];
  const rest = Array.from({ length: length - required.length }, () => randomChar(ALL));
  const chars = [...required, ...rest];

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

module.exports = { generateTempPassword };
