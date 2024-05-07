const { readFileSync } = require("fs");

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

module.exports = Base;
