/**
 * Splits text into chunks of 100-200 characters, intelligently splitting by newlines when possible.
 * @param text The text to split into chunks
 * @param maxLength The maximum length of each chunk (default: 200)
 * @returns An array of text chunks
 */
export function splitTextIntoChunks(text: string, maxLength: number = 200): string[] {
  // If text is shorter than maxLength, return it as a single chunk
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  let currentPosition = 0;

  while (currentPosition < text.length) {
    // Find a good splitting point between 100-200 chars
    let endPosition = Math.min(currentPosition + maxLength, text.length);
    
    // If we're not at the end of the text, try to find a newline to split on
    if (endPosition < text.length) {
      // Look for newlines within the acceptable range (100-200 chars)
      const minPosition = currentPosition + 100;
      const textSlice = text.substring(minPosition, endPosition);
      
      // Find the last newline in the slice
      const lastNewlineIndex = textSlice.lastIndexOf('\n');
      
      if (lastNewlineIndex !== -1) {
        // Split at the newline
        endPosition = minPosition + lastNewlineIndex + 1; // +1 to include the newline
      }
    }
    
    // Add the chunk
    chunks.push(text.substring(currentPosition, endPosition).trim());
    currentPosition = endPosition;
  }

  return chunks;
}