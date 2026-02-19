/**
 * Utility functions for cleaning and sanitizing HTML content
 */

/**
 * Cleans HTML content from rich text editors (TinyMCE, etc.)
 * Removes editor-specific attributes and unwanted markup
 */
export function cleanHTML(html: string | null | undefined): string {
  if (!html) return '';
  
  return html
    // Remove data-mce-fragment attributes
    .replace(/\s*data-mce-fragment="[^"]*"/g, '')
    // Remove data-mce-* attributes
    .replace(/\s*data-mce-[a-z-]+="[^"]*"/g, '')
    // Remove empty style attributes
    .replace(/\s*style=""/g, '')
    // Remove contenteditable attributes
    .replace(/\s*contenteditable="[^"]*"/g, '')
    // Remove data-pm-slice attributes (ProseMirror)
    .replace(/\s*data-pm-slice="[^"]*"/g, '')
    // Remove other common editor attributes
    .replace(/\s*data-id="[^"]*"/g, '')
    .replace(/\s*data-type="[^"]*"/g, '')
    // Clean up any double spaces that might have been created
    .replace(/\s{2,}/g, ' ')
    // Clean up space before closing tags
    .replace(/\s+>/g, '>')
    // Trim the result
    .trim();
}

/**
 * Strips all HTML tags and returns plain text
 * Useful for meta descriptions, previews, etc.
 */
export function stripHTML(html: string | null | undefined): string {
  if (!html) return '';
  
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Truncates text to a specified length
 */
export function truncateText(text: string | null | undefined, maxLength: number = 150): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Truncates HTML content to a specified length while preserving tags
 * Useful for excerpts and previews
 */
export function truncateHTML(html: string | null | undefined, maxLength: number): string {
  if (!html) return '';
  
  const plainText = stripHTML(html);
  if (plainText.length <= maxLength) return cleanHTML(html);
  
  return plainText.substring(0, maxLength) + '...';
}

/**
 * Get clean excerpt from HTML description
 * Strips HTML and truncates to specified length
 */
export function getExcerpt(html: string | null | undefined, maxLength: number = 150): string {
  return truncateText(stripHTML(html), maxLength);
}

