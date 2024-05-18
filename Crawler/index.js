// Local Imports
const Crawler = require("./Crawler");
const BloomFilter = require("./BloomFilter");
const CONFIG = require("./config");
// Other Imports
const os = require("os");

// Check if output and log directories exist

const crawler = new Crawler();

crawler.start();
