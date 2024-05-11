const { readFileSync, readdirSync } = require("fs");

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
    console.log("Base.requestData");
    const currIndex = Base.dataCount;
    try {
      const datasetSlice = JSON.parse(
        readFileSync(
          `../dataset/splitupDataset/dataset_${currIndex}.json`,
          "utf8"
        )
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

module.exports = Base;
