module.exports = {
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  modulePathIgnorePatterns: ["__testUtils__"],
  transformIgnorePatterns: ["/node_modules/"],
  setupFilesAfterEnv: ["./jest.setup.js"],
  testEnvironment: "node",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
