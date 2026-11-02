import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  // Relative asset URLs support GitHub project Pages and custom domains.
  base: "./",
  plugins: [react(), tailwindcss()],
});
