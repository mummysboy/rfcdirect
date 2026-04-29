// TypeScript-only shim. Metro's platform resolver prefers LogoUpload.web.tsx
// on web and LogoUpload.native.tsx on native; this file is never loaded at
// runtime — it just lets `import './LogoUpload'` resolve for TS.
export { LogoUpload } from './LogoUpload.web';
