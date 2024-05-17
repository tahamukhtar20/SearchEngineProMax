class BitArray {
  /**
   * Initializes the BitArray.
   *
   * @class BitArray
   * @param {number} length_of_content Length of the Urls to be hashed
   * @returns None
   * @see Bit Index vs Byte Index
   */
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
  /**
   * Returns BitArray values as integers/numbers.
   * @returns BitArray as Integers
   */
  return_array_values() {
    // Return int values in Uint8Array.
    return this.bit_array.toString();
  }
  /**
   * Returns BitArray in the form of bit string.
   * @returns BitArray as bits
   */
  return_bit_array() {
    // String to hold the 0s and 1s for bit representation.
    let string_array = "";
    // Loop over all the byte indexes and get the bits stored in each index. 8 for Uint8Array.
    for (let i = 0; i < this.bit_array_length; i++) {
      string_array += `${this.get_bit(i)}`;
    }
    return string_array;
  }
  /**
   * Checks the validity of bit index range in BitArray.
   *
   * Checks if the bit index searched exceeds the total length of the BitArray and returns a boolean if the bit index is in a valid range.
   *
   * @param {number} index Bit Index of BitArray
   * @returns True if bit index is in valid range else false
   * @deprecated Not Required anymore
   */
  check_index_range(index) {
    return !(index >= this.bit_array_length);
  }
  /**
   * Sets a bit in the BitArray.
   *
   * This function accepts a bit index as argument and calculates the byte index of the BitArray. It then takes bitwise OR of that byte index to set bit to 1.
   *
   * @param {number} index Bit index of BitArray to be set
   */
  set_bit(index) {
    // Get the appropriate byte index of BitArray to be set.
    const byte_index = Math.floor(index / this.dividing_factor);
    // Take OR with bit string of bit index to be set.
    this.bit_array[byte_index] |= 1 << index % this.dividing_factor;
  }
  /**
   * Clears a bit in the BitArray.
   *
   * This function accepts a bit index as argument and calculates the byte index of the BitArray. It then takes bitwise AND of the complement of that byte index to set bit to 0.
   *
   * @param {number} index Bit Index to be cleared
   */
  clear_bit(index) {
    // Calculate the byte index of the BitArray
    const byte_index = Math.floor(index / this.dividing_factor);
    this.bit_array[byte_index] &= ~(1 << index % this.dividing_factor);
  }
  /**
   * Checks if BitArray has 0 or 1 bit at bit index.
   *
   * Function caluclates the byte index and then takes bitwise AND of that byte index to determine if there was a 1 or 0 at the requried bit index.
   *
   * @param {number} index Bit index to return
   * @returns 0 if bit at index is 0 else 1
   */
  get_bit(index) {
    const byte_index = Math.floor(index / this.dividing_factor);
    return (this.bit_array[byte_index] & (1 << index % this.dividing_factor)) !== 0 ? 1 : 0;
  }
}

module.exports = { BitArray };
