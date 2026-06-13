const fs = require('fs');
const path = require('path');

const file = 'C:\\Users\\CESAR ALVAREZ\\.gemini\\antigravity\\brain\\fd95292e-8f10-4e75-b180-3c3c12846684\\.system_generated\\logs\\transcript.jsonl';

if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  console.log(`Searching in ${file} (${lines.length} lines)...`);
  
  // Look for product names
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes('poker') || 
        line.toLowerCase().includes('medellín') || 
        line.toLowerCase().includes('caldas') || 
        line.toLowerCase().includes('pony malta') ||
        line.toLowerCase().includes('colombian_products') ||
        line.toLowerCase().includes('aguardiente') ||
        line.toLowerCase().includes('postobón')) {
      console.log(`Line ${index + 1}: ${line.substring(0, 300)}...`);
    }
  });
} else {
  console.log('File does not exist');
}
