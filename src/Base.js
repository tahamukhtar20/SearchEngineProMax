const { readFileSync, readdirSync } = require("fs");

// Styling Convention
<<<<<<< HEAD
var console_styles = {
  Reset: "\x1b[0m",
  Heading: "\x1b[1m\x1b[32m",
  Url: "\x1b[2m"
=======
var styles = {
  res: "\x1b[0m",
  head: "\x1b[1m\x1b[32m",
  url: "\x1b[2m"
>>>>>>> bcd4d862904219a3d6b8cd53250f3f3454862c53
};

class Base {
  static dataCount = 0;
  constructor() {
    console.log("Base.contructor");
    this.urls = this.requestData();
    this.maxIndex = this.lastDatasetIndex();
    this.titlesToSkip = Base.getTitlesToSkip();
    this.lemmatizeMap = Base.getLemmatizeMap();
  }

  lastDatasetIndex() {
    console.log("Base.lastDatasetIndex");
    let maxIndex = 0;
    const files = readdirSync("../dataset/splitupDataset");
    files.forEach((file) => {
      const index = parseInt(file.split("_")[1].split(".")[0]);
      if (index > maxIndex) {
        maxIndex = index;
      }
    });
    return maxIndex;
  }

  static getLemmatizeMap() {
    console.log("Base.getLemmatizeMap");
    return JSON.parse(readFileSync("../dataset/lemmatizedMap.json", "utf8"));
  }

  static getTitlesToSkip() {
    console.log("Base.getTitlesToSkip");
    return JSON.parse(readFileSync("../dataset/titlesToSkip.json", "utf8"));
  }

  requestData() {
    console.log(`${styles.head}Base.requestData${styles.res}`);
    const currIndex = Base.dataCount;
    try {
      const datasetSlice = JSON.parse(readFileSync(`../dataset/splitupDataset/dataset_${currIndex}.json`, "utf8"));
      Base.dataCount++;
      return datasetSlice;
    } catch (e) {
      console.log("Base.requestData: No more data to process");
      console.log("Base.requestData: Exiting");
      return [];
    }
  }
}
module.exports = {
  Base,
<<<<<<< HEAD
  console_styles
=======
  styles
>>>>>>> bcd4d862904219a3d6b8cd53250f3f3454862c53
};
