import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui"], // set as default "sans"
        poppins: ["Poppins", "sans-serif"], // optional custom class
      },
    },
  },
  plugins: [],
};

export default config;
