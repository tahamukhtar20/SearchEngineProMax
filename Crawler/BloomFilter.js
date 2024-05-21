//Local Imports
const { Base, styles } = require("./Base");
const { BitArray } = require("./Utils/bitArray");
const CONFIG = require("./config");

//Other Imports
var murmur = require("murmurhash-js");
var fs = require("fs");

class BloomFilter extends Base {
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
  save_filter_to_txt() {
    console.log(`${styles.head}BloomFilter.save_filter${styles.res}`);
    // Save the filter array to a text document.
    fs.writeFile(CONFIG.defaultFilterTXT, this.bit_arr.return_array_values(), (err) => {
      if (err) {
        console.log(err);
      }
    });
  }
  hash_url_to_bit_array(url, hash_functions = this.hash_functions) {
    for (let i = 0; i < 2; i++) {
      this.bit_arr.set_bit(hash_functions[i](url, this.array_size));
    }
  }
  check_url_in_bit_array(url, hash_function) {
    return this.bit_arr.get_bit(hash_function(url, this.array_size));
  }

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
  get_hash_count(array_size, item_count) {
    return Math.ceil((array_size / item_count) * Math.log(2));
  }
  get_array_size(items_count, false_positive_rate) {
    return Math.ceil((-1 * items_count * Math.log(false_positive_rate)) / Math.log(2) ** 2);
  }
  hash1(url, arr_size) {
    return Math.ceil(Number(murmur.murmur3(url, 0)) % arr_size);
  }
  hash2(url, arr_size) {
    return Math.ceil(Number(murmur.murmur2(url, 0)) % arr_size);
  }
}

module.exports = { BloomFilter };
