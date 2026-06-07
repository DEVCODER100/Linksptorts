// Module-level store for the pending registration password.
// Held in memory only — never written to any storage.
// Cleared immediately after the registration API call in select-role/page.tsx.
let _password = '';

export const pendingReg = {
  setPassword: (pw: string) => { _password = pw; },
  getPassword: () => _password,
  clear: () => { _password = ''; },
};
