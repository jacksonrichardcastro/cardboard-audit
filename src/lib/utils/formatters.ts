export function getPossessiveName(displayName: string, isOwner: boolean = false): string {
  if (isOwner) {
    return "My";
  }

  if (!displayName) {
    return "Seller's";
  }

  let baseName = displayName.trim();

  // Handle quoted nicknames: Alex 'The Grader' Chen -> Alex's
  const quoteMatch = baseName.match(/^([^\'\"]+)\s*[\'\"]/);
  if (quoteMatch && quoteMatch[1]) {
    baseName = quoteMatch[1].trim();
  } else {
    // Strip leading "The " or "the "
    if (baseName.toLowerCase().startsWith("the ")) {
      baseName = baseName.substring(4).trim();
    }
  }

  if (baseName.toLowerCase().endsWith("s")) {
    return `${baseName}'`;
  }
  return `${baseName}'s`;
}
