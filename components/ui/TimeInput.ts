// Platform fork: see TimeInput.web.tsx (input type=time → native dial/picker)
// and TimeInput.native.tsx (typed HH:MM TextInput fallback). Metro picks
// the right file at bundle time; this shim is just for TS imports.
export { TimeInput } from './TimeInput.web';
