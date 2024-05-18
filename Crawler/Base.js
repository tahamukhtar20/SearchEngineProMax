const { readFileSync, readdirSync, existsSync, mkdirSync } = require("fs");

const CONFIG = require("./config");

// Styling Convention

var styles = {
  res: "\x1b[0m",
  head: "\x1b[1m\x1b[32m",
  url: "\x1b[2m"
};

class Base {
  static dataCount = 0;
  constructor() {
    console.log("Base.contructor");

    if (!existsSync(CONFIG.outputDIR)) {
      mkdirSync(CONFIG.outputDIR);
    }
    if (!existsSync(CONFIG.logDIR)) {
      mkdirSync(CONFIG.logDIR);
    }

    this.urls = this.requestData();
    this.maxIndex = this.lastDatasetIndex();
    this.titlesToSkip = Base.getTitlesToSkip();
    this.lemmatizeMap = Base.getLemmatizeMap();
  }

  lastDatasetIndex() {
    console.log("Base.lastDatasetIndex");
    let maxIndex = 0;
    const files = readdirSync(CONFIG.splitDatasetDIR);
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
    return JSON.parse(readFileSync(CONFIG.lemmatizeMapJSON, "utf8"));
  }

  static getTitlesToSkip() {
    console.log("Base.getTitlesToSkip");
    return JSON.parse(readFileSync(CONFIG.titlesToSkipJSON, "utf8"));
  }

  requestData() {
    console.log(`${styles.head}Base.requestData${styles.res}`);
    const currIndex = Base.dataCount;
    try {
      const datasetSlice = JSON.parse(
        readFileSync(`${CONFIG.splitDatasetDIR}/dataset_${currIndex}.json`, "utf8")
      );
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
  styles
};
