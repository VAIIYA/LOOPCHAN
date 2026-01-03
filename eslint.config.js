/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  },
};
