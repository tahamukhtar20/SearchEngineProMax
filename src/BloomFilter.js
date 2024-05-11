const { Base, console_styles } = require("./Base");
const { md5 } = require("js-md5");

class BloomFilter extends Base {
  constructor() {
    super();
    console.log(
      `${console_styles.Heading}BloomFilter.constructor${console_styles.Reset}`
    );
    this.false_positivity_rate = 0.05;
    this.array_size = this.get_array_size(
      this.urls.length,
      this.false_positivity_rate
    );
    this.hash_functions = this.get_hash_count(
      this.array_size,
      this.urls.length
    );
    this.bit_array = new Array(this.array_size).fill(0);
    this.construct_filter();
    // console.log(this.check_filter("https://youtubes.com"));
  }

  construct_filter(urls = this.urls) {
    console.log(
      `${console_styles.Heading}BloomFilter.create_filter${console_styles.Reset}`
    );
    urls.forEach((url) => {
      this.hash_url_bit_array(url);
    });
    console.log("bit_array: ", this.bit_array);
    console.log(
      `${console_styles.Heading}Bloom Filter Constructed${console_styles.Reset}`
    );
  }

  hash_url_bit_array(url) {
    // console.log(
    //   `BloomFilter.hash_url_bit_array ${console_styles.Url}${url}${console_styles.Reset}`
    // );
    var hash = Number(md5.digest(url).join("")) % this.array_size;
    this.bit_array[hash] = 1;
    // console.log("hash: ", hash);
  }

  check_filter(url) {
    console.log(
      `${console_styles.Heading}BloomFilter.check_filter${console_styles.Reset}`
    );
    var hash = Number(md5.digest(url).join("")) % this.array_size;
    return this.bit_array[hash] == 1;
  }

  get_hash_count(array_size, item_count) {
    return Math.ceil((array_size / item_count) * Math.log(2));
  }

  get_array_size(items_count, false_positive_rate) {
    return Math.ceil(
      (-1 * items_count * Math.log(false_positive_rate)) / Math.log(2) ** 2
    );
  }
}

module.exports = BloomFilter;
