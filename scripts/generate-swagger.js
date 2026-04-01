const fs = require('fs');
const path = require('path');
const specs = require('../src/config/swagger');

const outDir = path.join(__dirname, '..', 'public');
const outPath = path.join(outDir, 'openapi.json');

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(specs, null, 2), 'utf8');
console.log('Wrote static OpenAPI spec to', outPath);
