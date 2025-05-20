// Temporary file to perform complete fix
const fs = require('fs');

// Read the file
const filePath = './client/src/pages/planning/route-template-steps.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace both occurrences of the problematic SelectItem
content = content.replace(/<SelectItem value="">/g, '<SelectItem value="0">');

// Write the file back
fs.writeFileSync(filePath, content);

console.log('Fix applied successfully!');