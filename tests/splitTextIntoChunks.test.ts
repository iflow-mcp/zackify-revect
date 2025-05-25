import { expect, describe, test } from "bun:test";
import { splitTextIntoChunks } from "../src/utils/splitTextIntoChunks";

describe("splitTextIntoChunks", () => {
  test("should keep short text (under 200 characters) as a single chunk", () => {
    const shortText = "This is a short text that should not be split into chunks.";
    const shortTextChunks = splitTextIntoChunks(shortText);
    
    expect(shortTextChunks.length).toBe(1);
    expect(shortTextChunks[0]).toBe(shortText);
  });

  test("should split text just over 200 characters into chunks", () => {
    const mediumText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia, nunc eu tincidunt lobortis, orci massa accumsan lectus, vel varius metus neque ut enim. Donec ullamcorper risus id enim faucibus, non vestibulum ligula dapibus. Aenean eget erat.";
    const mediumTextChunks = splitTextIntoChunks(mediumText);
    
    expect(mediumTextChunks.length).toBeGreaterThan(1);
    mediumTextChunks.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(200);
    });
    
    // Check that all content is preserved (ignoring whitespace differences)
    const normalizeText = (text: string) => text.replace(/\s+/g, '');
    expect(normalizeText(mediumTextChunks.join(" "))).toBe(normalizeText(mediumText));
  });

  test("should intelligently split long text with newlines", () => {
    const longTextWithNewlines = `Paragraph 1: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia, nunc eu tincidunt lobortis.
Paragraph 2: Orci massa accumsan lectus, vel varius metus neque ut enim. Donec ullamcorper risus id enim faucibus.
Paragraph 3: Non vestibulum ligula dapibus. Aenean eget erat. Phasellus sed leo quis metus sollicitudin consequat.
Paragraph 4: Sed imperdiet eros at diam cursus, sed volutpat nibh accumsan. Integer vel tincidunt nisl, id interdum nisi.
Paragraph 5: Nulla facilisi. Cras eu dolor a neque lacinia tincidunt vel vitae mi. Pellentesque habitant morbi tristique.`;

    const longTextChunks = splitTextIntoChunks(longTextWithNewlines);
    
    expect(longTextChunks.length).toBeGreaterThan(1);
    
    // Verify all chunks are within the maximum size limit
    longTextChunks.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(200);
    });
    
    // Check that all content is preserved (ignoring whitespace differences)
    const normalizeText = (text: string) => text.replace(/\s+/g, '');
    expect(normalizeText(longTextChunks.join(" "))).toBe(normalizeText(longTextWithNewlines));
  });

  test("should handle text with very long lines", () => {
    const longLinesText = "This is a very long line without any newlines that should be split into chunks because it exceeds the 200 character limit but doesn't have any natural breaking points like newlines so the algorithm will have to force a split at some point to keep the chunks within the specified size limits.";
    const longLinesChunks = splitTextIntoChunks(longLinesText);
    
    expect(longLinesChunks.length).toBeGreaterThan(1);
    
    // All chunks should be at most 200 characters
    longLinesChunks.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(200);
    });
    
    // Check that all content is preserved (ignoring whitespace differences)
    const normalizeText = (text: string) => text.replace(/\s+/g, '');
    expect(normalizeText(longLinesChunks.join(" "))).toBe(normalizeText(longLinesText));
  });
});