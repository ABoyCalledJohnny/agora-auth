/** @type {import("prettier").Config} */
const config = {
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
  printWidth: 120,
  plugins: ["prettier-plugin-tailwindcss"],
  overrides: [
    {
      files: ["*.md", "*.mdx"],
      options: {
        useTabs: true,
        tabWidth: 4,
        proseWrap: "preserve",
      },
    },
  ],
};

export default config;
