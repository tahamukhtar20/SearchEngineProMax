//Local Imports
const { Base, styles } = require("./Base");
const { BitArray } = require("./Utils/bitArray");
const CONFIG = require("./config");

//Other Imports
var murmur = require("murmurhash-js");
var fs = require("fs");

class BloomFilter extends Base {
  /**
   * @class BloomFilter
   * @extends Base
   */
  constructor() {
    super();
    console.log(`${styles.head}BloomFilter.constructor${styles.res}`);
    // Reads DIRECTORY where the scraped website URLS are stored.
    var files = fs.readdirSync(CONFIG.splitDatasetDIR);
    this.urls = [];
    // Get all the  URLS which have been scraped and store in a variable.
    files.forEach((file) => {
      let data = fs.readFileSync(`${CONFIG.splitDatasetDIR}/${file}`);
      let data_arr = JSON.parse(data);
      this.urls = this.urls.concat(data_arr);
    });
    // Maxumum allowed false positivity rate.
    this.false_positivity_rate = 0.05;
    // Get the required size for the BitArray. Depends on total length of URLS and Allowed false positivity rate.
    this.array_size = this.get_array_size(this.urls.length, this.false_positivity_rate);
    // Get the recommended number of Hash Functions for required length of BloomFilter.
    this.hash_functions_count = this.get_hash_count(this.array_size, this.urls.length);

    // Temporary Fix for two hash functions
    this.hash_functions = [this.hash1, this.hash2];
    this.hash_functions_count = this.hash_functions.length;
    // Initialize the BitArray
    this.bit_arr = new BitArray(this.array_size);
    // Construct the Filter BitArray
    this.construct_filter();
  }
  /**
   * Constructs the BloomFilter Array from existing txt file or from scratch.
   *
   * Checks if an existing filter file is available and loads that file. Proceeds to construct the filter array from scratch if no filter file is available.
   *
   * @param {string[]} urls All the URLS to be stored in the BloomFilter
   * @returns None
   */
  construct_filter(urls = this.urls) {
    console.log(`${styles.head}BloomFilter.construct_filter${styles.res}`);

    // check if the filter is already constructed
    if (fs.existsSync(CONFIG.defaultFilterTXT)) {
      console.log("Filter already exists");
      this.read_filter_from_txt();

      // console.log("bit_array: ", this.bit_arr.return_bit_array());
      return;
    }
    // If the filter file does not exist then construct from scratch.
    urls.forEach((url) => {
      this.hash_url_to_bit_array(url);
    });
    // console.log("bit_array: ", this.bit_arr.return_bit_array());
    console.log(`${styles.head}Bloom Filter Constructed${styles.res}`);
    // Save filter file.
    this.save_filter_to_txt();
  }
  /**
   * Read existing filter file.
   *
   * Reads an existing filter file and updates the BloomFilter BitArray to prevent uneccesary reconstruction overhead of filter Array.
   *
   * @returns None
   */
  read_filter_from_txt() {
    console.log(`${styles.head}BloomFilter.read_filter${styles.res}`);
    // Read the filter array from a text document.
    let data = fs.readFileSync(CONFIG.defaultFilterTXT);
    let data_arr = data.toString().split(",");
    // Update each byte in the BitArray
    data_arr.forEach((byteInt, idx) => {
      this.bit_arr.bit_array[idx] = byteInt;
    });
  }
  /**
   * Saves the filter file.
   *
   * After construction of the filter Array. Store the filter contents in a text file containing integers representing each byte of the BitArray. Prevents unecessary construction of the filter array.
   *
   * @returns None
   */
  save_filter_to_txt() {
    console.log(`${styles.head}BloomFilter.save_filter${styles.res}`);
    // Save the filter array to a text document.
    fs.writeFile(CONFIG.defaultFilterTXT, this.bit_arr.return_array_values(), (err) => {
      if (err) {
        console.log(err);
      }
    });
  }
  /**
   * Hashes URL param to the BitArray using Hash Functions.
   *
   * Does multiple hashing of the URL to reduce false positive rate.
   *
   * @param {string} url URL to be stored in the BitArray
   * @param {Function[]} hash_functions Array of Functions to be used for hashing URL
   */
  hash_url_to_bit_array(url, hash_functions = this.hash_functions) {
    for (let i = 0; i < 2; i++) {
      this.bit_arr.set_bit(hash_functions[i](url, this.array_size));
    }
  }
  /**
   * Returns 0 or 1 depending on the URL if it is stored in the BitArray.
   *
   * @param {string} url URL to be checked in BitArray
   * @param {Function} hash_function Hash function
   * @returns bit representing the URL in the BitArray
   */
  check_url_in_bit_array(url, hash_function) {
    return this.bit_arr.get_bit(hash_function(url, this.array_size));
  }
  /**
   * Checks if a URL exists in the BitArray.
   *
   * @param {string} url URL to check in BitArray
   * @returns True if URL exists in BitArray else false
   */
  check_filter(url) {
    console.log(url);
    var bit_exists = true;
    // Check for each hash function
    for (let i = 0; i < 2; i++) {
      bit_exists = bit_exists && this.check_url_in_bit_array(url, this.hash_functions[i]);
    }

    console.log(`${styles.head}BloomFilter.check_filter${styles.res} ${bit_exists}`);
    return bit_exists;
  }
  /**
   * Returns the suitable number of hash functions.
   *
   * @param {number} array_size Size of BitArray
   * @param {number} item_count Number of URLS (items) to be hashed
   * @returns The suitable number of hash functions for the BitArray
   */
  get_hash_count(array_size, item_count) {
    return Math.ceil((array_size / item_count) * Math.log(2));
  }
  /**
   * Checks the fp rate and items and returns appropriate filter size.
   *
   * @param {number} items_count The number of URLS to be stored in the BitArray
   * @param {number} false_positive_rate The acceptable false positive rate
   * @returns Appropriate length of filter array
   */
  get_array_size(items_count, false_positive_rate) {
    return Math.ceil((-1 * items_count * Math.log(false_positive_rate)) / Math.log(2) ** 2);
  }
  /**
   * Returns the Bit Index where URL needs to be stored.
   *
   * @param {string} url URL to be hashed
   * @param {number} arr_size Size of Filter Array
   * @returns Bit Index of URL
   */
  hash1(url, arr_size) {
    return Math.ceil(Number(murmur.murmur3(url, 0)) % arr_size);
  }
  /**
   * Returns the Bit Index where URL needs to be stored.
   *
   * @param {string} url URL to be hashed
   * @param {number} arr_size Size of Filter Array
   * @returns Bit Index of URL
   */
  hash2(url, arr_size) {
    return Math.ceil(Number(murmur.murmur2(url, 0)) % arr_size);
  }
}

module.exports = { BloomFilter };
