const { Base, styles } = require("./Base");
const { BitArray } = require("./Utils/bitArray");
const { md5 } = require("js-md5");

class BloomFilter extends Base {
  #false_positivity_rate;
  #hash_functions_count;
  #hash_functions;

  constructor() {
    super();
    console.log(`${styles.head}BloomFilter.constructor${styles.res}`);

    this.#false_positivity_rate = 0.05;

    this.array_size = this.get_array_size(
      this.urls.length,
      this.#false_positivity_rate
    );

    this.#hash_functions_count = this.get_hash_count(
      this.array_size,
      this.urls.length
    );

    // Temporary
    this.#hash_functions = [this.hash1, this.hash2];
    this.#hash_functions_count = this.#hash_functions.length;

    this.bit_array = new BitArray(this.array_size);

    this.construct_filter();
  }

  construct_filter(urls = this.urls) {
    console.log(`${styles.head}BloomFilter.construct_filter${styles.res}`);
    urls.forEach((url) => {
      this.hash_url_to_bit_array(url);
    });
    console.log("bit_array: ", this.bit_array.return_bit_array());
    console.log(`${styles.head}Bloom Filter Constructed${styles.res}`);
  }

  hash_url_to_bit_array(url, hash_functions = this.#hash_functions) {
    for (let i = 0; i < 2; i++) {
      this.bit_array.set_bit(hash_functions[i](url, this.array_size));
    }
  }

  check_url_in_bit_array(url, hash_function) {
    return this.bit_array.get_bit(hash_function(url, this.array_size));
  }

  check_filter(url) {
    console.log(`${styles.head}BloomFilter.check_filter${styles.res}`);

    var bit_exists = true;

    for (let i = 0; i < 2; i++) {
      bit_exists =
        bit_exists && this.check_url_in_bit_array(url, this.#hash_functions[i]);
    }

    return bit_exists;
  }

  get_hash_count(array_size, item_count) {
    return Math.ceil((array_size / item_count) * Math.log(2));
  }

  get_array_size(items_count, false_positive_rate) {
    return Math.ceil(
      (-1 * items_count * Math.log(false_positive_rate)) / Math.log(2) ** 2
    );
  }

  hash1(url, arr_size) {
    return Number(md5.digest(url).join("")) % arr_size;
  }
  hash2(url, arr_size) {
    return Number(md5.digest(url).join("")) ** 2 % arr_size;
  }
}

module.exports = BloomFilter;
