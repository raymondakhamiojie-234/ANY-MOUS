/**
 * Content Filter Utility
 * Detects profanities, hate slurs, harassment phrases, and per-user custom blocked words.
 */

// Common profanity, hate speech, slurs, and abusive language tokens
export const GLOBAL_PROFANITY_LIST = [
  "asshole",
  "bastard",
  "bitch",
  "cunt",
  "dickhead",
  "douchebag",
  "fag",
  "faggot",
  "fuck",
  "fucker",
  "kill yourself",
  "kys",
  "motherfucker",
  "nigger",
  "nigga",
  "retard",
  "shithead",
  "slut",
  "whore",
];

// Leetspeak translation map for obfuscation detection
const LEET_MAP: Record<string, string> = {
  "@": "a",
  "4": "a",
  "8": "b",
  "3": "e",
  "1": "i",
  "!": "i",
  "|": "i",
  "0": "o",
  "$": "s",
  "5": "s",
  "7": "t",
  "+": "t",
};

/**
 * Normalizes a word token by replacing leetspeak characters and stripping intra-word punctuation
 * e.g. "f.u.c.k" -> "fuck", "b!tch" -> "bitch", "a$$hole" -> "asshole"
 */
export function normalizeWord(word: string): string {
  let w = word.toLowerCase();
  for (const [char, rep] of Object.entries(LEET_MAP)) {
    w = w.split(char).join(rep);
  }
  return w.replace(/[^a-z0-9]/g, "");
}

/**
 * Normalizes a full sentence by replacing leetspeak and collapsing spacing
 */
export function normalizeSentence(text: string): string {
  let normalized = text.toLowerCase();
  for (const [char, rep] of Object.entries(LEET_MAP)) {
    normalized = normalized.split(char).join(rep);
  }
  return normalized.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Checks whether content contains words from the global profanity list.
 */
export function containsGlobalProfanity(content: string): boolean {
  if (!content) return false;

  const rawWords = content.trim().split(/\s+/);
  const normalizedWords = rawWords.map(normalizeWord);
  const sentence = normalizeSentence(content);

  for (const profanity of GLOBAL_PROFANITY_LIST) {
    // Multi-word phrase check (e.g. "kill yourself")
    if (profanity.includes(" ")) {
      if (sentence.includes(profanity)) {
        return true;
      }
      continue;
    }

    // Exact word token check (handles "f.u.c.k", "b!tch", etc.)
    if (normalizedWords.includes(profanity)) {
      return true;
    }

    // Substring match on normalized words with length >= 4 to avoid false positives
    for (const w of normalizedWords) {
      if (w === profanity) return true;
      if (profanity.length >= 4 && w.length >= 4 && w.includes(profanity)) {
        // Guard against false positives like "classic" or "assignment" for "ass"
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks whether content matches any word or phrase in the recipient's custom blocked list.
 * Words are case-insensitive and trimmed.
 */
export function containsUserBlockedWords(
  content: string,
  userBlockedWords?: string | null
): boolean {
  if (!content || !userBlockedWords || !userBlockedWords.trim()) return false;

  const sentence = normalizeSentence(content);
  const rawWords = content.toLowerCase().split(/\s+/);
  const normalizedWords = rawWords.map(normalizeWord);

  const blockedList = userBlockedWords
    .split(/[,;\n]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0);

  for (const word of blockedList) {
    if (!word) continue;

    const normalizedBlocked = normalizeSentence(word);

    // Direct phrase match
    if (sentence.includes(normalizedBlocked)) {
      return true;
    }

    // Word token match
    if (normalizedWords.includes(normalizeWord(word))) {
      return true;
    }
  }

  return false;
}

export interface ContentFilterResult {
  blocked: boolean;
  reason?: "profanity" | "user_blocked_word";
}

/**
 * Validates message content against both global profanity and per-user custom blocked words.
 */
export function filterMessageContent(
  content: string,
  userBlockedWords?: string | null
): ContentFilterResult {
  if (containsGlobalProfanity(content)) {
    return { blocked: true, reason: "profanity" };
  }

  if (containsUserBlockedWords(content, userBlockedWords)) {
    return { blocked: true, reason: "user_blocked_word" };
  }

  return { blocked: false };
}
