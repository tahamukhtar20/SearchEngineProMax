class BitArray {
  #dividing_factor;
  #index_range;

  constructor(length_of_content) {
    this.#dividing_factor = 8;
    this.bit_array_length = length_of_content;
    this.#index_range = Math.ceil(
      this.bit_array_length / this.#dividing_factor
    );
    this.bit_array = new Uint8Array(this.#index_range).fill(0);
  }
  return_bit_array() {
    let string_array = "";
    for (let i = 0; i < this.bit_array_length; i++) {
      string_array += `${this.get_bit(i)}`;
    }
    console.log();
    return string_array;
  }
  #check_index_range(index) {
    return !(index >= this.bit_array_length);
  }
  set_bit(index) {
    const byte_index = Math.floor(index / this.#dividing_factor);
    // console.log(index % this.dividing_factor);
    this.bit_array[byte_index] |= 1 << index % this.#dividing_factor;
  }

  #clear_bit(index) {
    const byte_index = Math.floor(index / this.#dividing_factor);
    this.bit_array[byte_index] &= ~(1 << index % this.#dividing_factor);
  }
  get_bit(index) {
    const byte_index = Math.floor(index / this.#dividing_factor);
    return (this.bit_array[byte_index] &
      (1 << index % this.#dividing_factor)) !==
      0
      ? 1
      : 0;
  }
}

module.exports = { BitArray };
