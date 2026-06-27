import fs from 'fs';

let content = fs.readFileSync('src/app/checklists/[set-slug]/page.tsx', 'utf-8');
content = content.replace(
  "export async function generateMetadata({ params }: { params: { 'set-slug': string } }) {",
  "export async function generateMetadata({ params }: { params: Promise<{ 'set-slug': string }> }) {\n  const resolvedParams = await params;"
);
content = content.replace(
  "params['set-slug']",
  "resolvedParams['set-slug']"
);

content = content.replace(
  "export default async function SetPage({ params }: { params: { 'set-slug': string } }) {",
  "export default async function SetPage({ params }: { params: Promise<{ 'set-slug': string }> }) {\n  const resolvedParams = await params;"
);
content = content.replace(
  "params['set-slug']",
  "resolvedParams['set-slug']"
);

fs.writeFileSync('src/app/checklists/[set-slug]/page.tsx', content);
