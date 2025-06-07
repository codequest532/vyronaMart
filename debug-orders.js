import fs from 'fs';

// Read the MyVyrona component
const content = fs.readFileSync('client/src/pages/myvyrona.tsx', 'utf8');

// Split into lines and look for any reference to 'orders' that isn't in the queryKey
const lines = content.split('\n');
const problematicLines = [];

lines.forEach((line, index) => {
  // Look for 'orders' that's not in comments, imports, or API calls
  if (line.includes('orders') && 
      !line.includes('//') && 
      !line.includes('import') && 
      !line.includes('queryKey') && 
      !line.includes('api/orders') &&
      !line.includes('orderData') &&
      !line.includes('orderResponse')) {
    problematicLines.push({
      lineNumber: index + 1,
      content: line.trim()
    });
  }
});

console.log('Found potential issues:');
problematicLines.forEach(issue => {
  console.log(`Line ${issue.lineNumber}: ${issue.content}`);
});

// Also check for any undefined variables that might be mistakenly named
const undefinedVarPattern = /\b(orders)\b(?!\s*[:=])/g;
lines.forEach((line, index) => {
  if (undefinedVarPattern.test(line) && 
      !line.includes('queryKey') && 
      !line.includes('api/orders') &&
      !line.includes('//')) {
    console.log(`Potential undefined variable at line ${index + 1}: ${line.trim()}`);
  }
});