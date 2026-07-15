import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    ".next/**",
    "Slot-Booking-Backend/dist/**",
    "Slot-Booking-Backend/node_modules/**",
    ".runtime-mongo/**",
  ]),
]);
