const { readFileSync } = require("fs");

// Styling Convention
var styles = {
  res: "\x1b[0m",
  head: "\x1b[1m\x1b[32m",
  url: "\x1b[2m",
};

class Base {
  constructor() {
    console.log("Base.contructor");
    this.urls = Base.getData();
    this.titlesToSkip = Base.getTitlesToSkip();
  }

  static getData() {
    console.log("Base.getData");
    return JSON.parse(readFileSync("dataset/dataset.json", "utf8"));
  }

  static getTitlesToSkip() {
    console.log("Base.getTitlesToSkip");
    return JSON.parse(readFileSync("dataset/titlesToSkip.json", "utf8"));
  }
}
module.exports = {
  Base,
  styles,
};
