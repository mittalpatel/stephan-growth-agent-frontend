// Test-only stand-in for the `server-only` package (see vitest.config.ts).
//
// The real package exports nothing and exists purely so that Next.js fails the
// build when a server-only module is pulled into a client bundle. That check runs
// at build time, so an empty module is a faithful runtime equivalent.
export {};
