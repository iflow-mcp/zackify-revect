import { splitTextIntoChunks } from "../src/utils/splitTextIntoChunks";

// Test case for short text (under 200 chars)
console.log("Test 1: Short text (under 200 characters)");
const shortText = "This is a short text that should not be split into chunks.";
const shortTextChunks = splitTextIntoChunks(shortText);
console.log(`Input length: ${shortText.length}`);
console.log(`Number of chunks: ${shortTextChunks.length}`);
console.log(`Chunks: ${JSON.stringify(shortTextChunks, null, 2)}`);
console.log("Expected: 1 chunk, same as input\n");

// Test case for text just over 200 chars
console.log("Test 2: Text just over 200 characters");
const mediumText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia, nunc eu tincidunt lobortis, orci massa accumsan lectus, vel varius metus neque ut enim. Donec ullamcorper risus id enim faucibus, non vestibulum ligula dapibus. Aenean eget erat.";
const mediumTextChunks = splitTextIntoChunks(mediumText);
console.log(`Input length: ${mediumText.length}`);
console.log(`Number of chunks: ${mediumTextChunks.length}`);
console.log(`Chunks lengths: ${mediumTextChunks.map(c => c.length).join(", ")}`);
console.log("Expected: Chunks between 100-200 characters\n");

// Test case for long text with newlines
console.log("Test 3: Long text with newlines");
const longTextWithNewlines = `Paragraph 1: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia, nunc eu tincidunt lobortis.
Paragraph 2: Orci massa accumsan lectus, vel varius metus neque ut enim. Donec ullamcorper risus id enim faucibus.
Paragraph 3: Non vestibulum ligula dapibus. Aenean eget erat. Phasellus sed leo quis metus sollicitudin consequat.
Paragraph 4: Sed imperdiet eros at diam cursus, sed volutpat nibh accumsan. Integer vel tincidunt nisl, id interdum nisi.
Paragraph 5: Nulla facilisi. Cras eu dolor a neque lacinia tincidunt vel vitae mi. Pellentesque habitant morbi tristique.`;

const longTextChunks = splitTextIntoChunks(longTextWithNewlines);
console.log(`Input length: ${longTextWithNewlines.length}`);
console.log(`Number of chunks: ${longTextChunks.length}`);
console.log(`Chunks lengths: ${longTextChunks.map(c => c.length).join(", ")}`);
for (let i = 0; i < longTextChunks.length; i++) {
  console.log(`Chunk ${i + 1}:\n"${longTextChunks[i]}"\n`);
}
console.log("Expected: Multiple chunks, splitting on newlines within the 100-200 character range\n");

// Test case for text with very long lines
console.log("Test 4: Text with very long lines");
const longLinesText = "This is a very long line without any newlines that should be split into chunks because it exceeds the 200 character limit but doesn't have any natural breaking points like newlines so the algorithm will have to force a split at some point to keep the chunks within the specified size limits.";
const longLinesChunks = splitTextIntoChunks(longLinesText);
console.log(`Input length: ${longLinesText.length}`);
console.log(`Number of chunks: ${longLinesChunks.length}`);
console.log(`Chunks lengths: ${longLinesChunks.map(c => c.length).join(", ")}`);
for (let i = 0; i < longLinesChunks.length; i++) {
  console.log(`Chunk ${i + 1}:\n"${longLinesChunks[i]}"\n`);
}
console.log("Expected: Multiple chunks, forced splits at 200 characters\n");