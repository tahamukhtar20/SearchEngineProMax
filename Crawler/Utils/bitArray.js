class BitArray {
  constructor(length_of_content) {
    // Dividing Factor for each byte index of array. 8 for Uint8Array and 64 for default Array.
    this.dividing_factor = 8;
    // Total Length of the Bit Array (total urls)
    this.bit_array_length = length_of_content;
    // Total byte indexes required by Uint8Array with respect to dividing factor.
    this.index_range = Math.ceil(this.bit_array_length / this.dividing_factor);
    // The Bit Array in which the bits will be stored initialized with 0s.
    this.bit_array = new Uint8Array(this.index_range).fill(0);
  }
  return_array_values() {
    // Return int values in Uint8Array.
    return this.bit_array.toString();
  }
  return_bit_array() {
    // String to hold the 0s and 1s for bit representation.
    let string_array = "";
    // Loop over all the byte indexes and get the bits stored in each index. 8 for Uint8Array.
    for (let i = 0; i < this.bit_array_length; i++) {
      string_array += `${this.get_bit(i)}`;
    }
    return string_array;
  }
  check_index_range(index) {
    return !(index >= this.bit_array_length);
  }
  set_bit(index) {
    // Get the appropriate byte index of BitArray to be set.
    const byte_index = Math.floor(index / this.dividing_factor);
    // Take OR with bit string of bit index to be set.
    this.bit_array[byte_index] |= 1 << index % this.dividing_factor;
  }
  clear_bit(index) {
    // Calculate the byte index of the BitArray
    const byte_index = Math.floor(index / this.dividing_factor);
    this.bit_array[byte_index] &= ~(1 << index % this.dividing_factor);
  }
  get_bit(index) {
    const byte_index = Math.floor(index / this.dividing_factor);
    return (this.bit_array[byte_index] & (1 << index % this.dividing_factor)) !== 0 ? 1 : 0;
  }
}

module.exports = { BitArray };
