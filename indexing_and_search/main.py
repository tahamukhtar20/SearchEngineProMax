import inverted_index

if __name__ == "__main__":
    index = inverted_index.InvertedIndex()
    index.index_docs()
    index.inverted_index_to_solr_format()
