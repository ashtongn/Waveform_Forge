import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The site is served from https://<user>.github.io/Waveform_Forge/
// so all asset URLs must be prefixed with the repo name.
export default defineConfig({
  plugins: [react()],
  base: '/Waveform_Forge/',
  server: {
    host: true, // needed so the dev server is reachable inside a Codespace
    port: 5173,
  },
});
