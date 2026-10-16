// Bound database reads and evidence preparation; oversize choices are refused explicitly.
export const MAX_CALL_SOURCES=20;
export const MAX_COMBINED_SOURCE_CHARACTERS=1000000;
export function validateSourceSelection(ids:readonly string[]){if(!ids.length)throw Error('Select at least one source.');if(ids.length>MAX_CALL_SOURCES)throw Error(`Select up to ${MAX_CALL_SOURCES} sources for one call.`);if(new Set(ids).size!==ids.length)throw Error('Select each source only once.');}
