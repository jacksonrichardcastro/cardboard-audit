const fs = require('fs');
const path = require('path');

const projectRoot = '/Users/jacksoncastro/Documents/CardBound';
const targetDirs = ['src/app', 'src/lib', 'src/store', 'src/components'];
const outputFile = '/Users/jacksoncastro/.gemini/antigravity/brain/ff419485-e97b-4491-873a-af7fc363d157/master_source_code.md';

let markdownOutput = '# CardBound Master Source Code\n\nThis document contains the core application architecture, database schemas, and Next.js server actions.\n\n';

function traverseDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            traverseDirectory(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const relativePath = path.relative(projectRoot, fullPath);
            const content = fs.readFileSync(fullPath, 'utf8');
            markdownOutput += `## File: ${relativePath}\n\`\`\`typescript\n${content}\n\`\`\`\n\n`;
        }
    }
}

targetDirs.forEach(dir => traverseDirectory(path.join(projectRoot, dir)));

// Add drizzle schema and next config for context
const extraFiles = ['drizzle.config.ts'];
extraFiles.forEach(file => {
    const fullPath = path.join(projectRoot, file);
    if(fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        markdownOutput += `## File: ${file}\n\`\`\`typescript\n${content}\n\`\`\`\n\n`;
    }
});

fs.writeFileSync(outputFile, markdownOutput);
console.log('Successfully generated master source code artifact.');
