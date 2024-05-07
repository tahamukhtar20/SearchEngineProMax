const Base = require("./Base");

class BloomFilter extends Base {
  constructor() {
    super();
    console.log("BloomFilter.constructor");
    this.array_size = this.get_array_size(this.urls.length, 0.05);
    this.hash_functions = this.get_hash_count(
      this.array_size,
      this.urls.length
    );
    this.bit_array = new Array(this.array_size).fill((value = 0));
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
