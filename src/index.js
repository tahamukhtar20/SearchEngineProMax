const Crawler = require("./Crawler");
const BloomFilter = require("./BloomFilter");

// debugger;

const bFilter = new BloomFilter();

// Test the filter

// path = "Dataset/splitupDataset/dataset_0.json";

// const fs = require("fs");
// const file = fs.readFileSync(path);
// data = JSON.parse(file);
// var check = true;
// data.forEach((url) => {
//   var result = bFilter.check_filter(url);
//   check = check && result;
//   process.stdout.write(`Checking ${url}... ${result} `);
// });

// console.log(`\n\nFinal Result: ${check}`);
