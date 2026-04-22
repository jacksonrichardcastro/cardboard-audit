// Empty stub so vitest can resolve `server-only` without triggering its
// client-component poison pill. In Next.js, `server-only` throws when a
// client module transitively imports a server module. Under vitest (node
// environment), vite's default resolve conditions don't select the
// `react-server` export, so the package resolves to its throw-on-import
// path and fails the entire test run. Aliasing it to this empty module is
// the standard escape hatch.
export {};
