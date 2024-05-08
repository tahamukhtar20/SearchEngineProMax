import inverted_index

class SearchEngine:
    def __init__(self):
        self.index = inverted_index.InvertedIndex()
        self.index = self.index.index_docs()

    def search(self, query):
        return self.index[query]
        