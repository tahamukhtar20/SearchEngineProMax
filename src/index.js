const Crawler = require("./Crawler");
const BloomFilter = require("./BloomFilter");

// debugger;

const bFilter = new BloomFilter();
console.log(bFilter.check_filter("https://facebooks.com"));
