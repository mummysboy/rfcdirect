// TypeScript-only shim. Metro's platform resolver prefers Map.web.tsx on
// web and Map.native.tsx on native, so this file is never loaded at
// runtime — it just lets `import './Map'` resolve for TS.
export { Map } from './Map.web';
