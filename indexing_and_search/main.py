import search_engine
import inverted_index

if __name__ == "__main__":
<<<<<<< HEAD
    index = inverted_index.InvertedIndex()
    index.index_docs()
    index.inverted_index_to_solr_format()
    
=======
    searchEngine = search_engine.SearchEngine()
    print(searchEngine.search("curiou"))
>>>>>>> bcd4d862904219a3d6b8cd53250f3f3454862c53
