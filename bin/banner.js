const fs = require('fs');

const banner = `/*!
 * Clean Blog v1.0.0 (http://startbootstrap.com)
 * Copyright ${new Date().getFullYear()} Start Bootstrap
 * Licensed under Apache 2.0 (https://github.com/IronSummitMedia/startbootstrap/blob/gh-pages/LICENSE)
 */
`;

const target = process.argv[2];
if (!target) {
  console.error('Usage: node bin/banner.js <file>');
  process.exit(1);
}

const contents = fs.readFileSync(target, 'utf8');
fs.writeFileSync(target, banner + contents);
