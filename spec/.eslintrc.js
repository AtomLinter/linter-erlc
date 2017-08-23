module.exports = {
  env: {
    jasmine: true
  },
  rules: {
    "import/no-extraneous-dependencies": [
      "error",
      {
        "devDependencies": true
      }
    ]
  }
}
