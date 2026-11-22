/** @format */

const globalForReset = globalThis;

if (!globalForReset.__sherryResetTokens) {
  globalForReset.__sherryResetTokens = new Map();
}

if (!globalForReset.__sherryPasswordOverrides) {
  globalForReset.__sherryPasswordOverrides = new Map();
}

export const resetTokens = globalForReset.__sherryResetTokens;
export const passwordOverrides = globalForReset.__sherryPasswordOverrides;
