import { MAX_ADDITIONAL_TEXT } from '../constants';

const XML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

/** True for control chars that are illegal in XML 1.0 (below 0x20 except TAB/LF/CR). */
function isIllegalControl(code: number): boolean {
  return code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d;
}

/** Escape a string for safe inclusion as XML/SVG text content or an attribute value.
 *  Caps length first, drops XML-illegal control chars, then escapes the five XML
 *  predefined entities. This is the single barrier that keeps user text from injecting
 *  SVG/markup when the master SVG is serialized to a string and later parsed/rasterized. */
export function escapeXml(raw: string, maxLen: number = MAX_ADDITIONAL_TEXT): string {
  const capped = raw.slice(0, maxLen);
  let out = '';
  for (const ch of capped) {
    if (ch.length === 1 && isIllegalControl(ch.charCodeAt(0))) continue;
    out += XML_ENTITIES[ch] ?? ch;
  }
  return out;
}
