from collections import Counter, OrderedDict, defaultdict
import os
import math
from tqdm import tqdm
import json

HEADINGS_WEIGHT = 1.2
DOC_WEIGHT = 1

class InvertedIndex:
    def __init__(self):
        self.index = defaultdict(lambda: defaultdict(dict))
        self.documents_path = "../output"

    def __repr__(self):
        return str(self.index)

    def index_doc(self, doc):
        doc_word_count = Counter(doc["doc"])
        heading_word_count = Counter(doc["headings"])
        heading_words = heading_word_count.keys()
        total_doc_word_count = sum(doc_word_count.values()) + sum(heading_word_count.values())
        if total_doc_word_count == 0:
            return

        combined_word_count = Counter()
        combined_word_count.update(doc_word_count)
        combined_word_count.update(heading_word_count)

        for word, count in combined_word_count.items():
            heading_word = word in heading_words
            self.index[word][doc["url"]] = {
                "tf": (count / total_doc_word_count) * (HEADINGS_WEIGHT if heading_word else DOC_WEIGHT),
                "url": doc["url"],
                "title": doc["previewTitle"],
                "description": doc["preview"],
            }


    def index_docs(self):
        docs = os.listdir(self.documents_path)
        doc_count = len(docs)
        for file in tqdm(docs, total=doc_count):
            with open(os.path.join(self.documents_path, file), "r") as file:
                self.index_doc(json.load(file))

        for word, docs in self.index.items():
            idf = math.log(doc_count / len(docs))
            for doc in docs.values():
                self.index[word][doc["url"]]["tf-idf"] = doc["tf"] * idf
                del self.index[word][doc["url"]]["tf"]

        for key in self.index:
            self.index[key] = OrderedDict(sorted(self.index[key].items(), key=lambda x: x[1]["tf-idf"], reverse=True))

        with open("./output/index.json", "w") as file:
            json.dump(self.index, file)


    def inverted_index_to_solr_format(self):
        data = {}
        with open("./output/index.json", "r") as file:
            data = json.load(file)
        solr_data = []
        for word, docs in data.items():
            for doc in docs:
                solr_data.append({
                    "id": f"{word}_{doc}",
                    "word": word,
                    "url": doc["url"],
                    "title": doc["title"],
                    "description": doc["description"],
                    "tf-idf": doc["tf-idf"]
                })
        with open("./output/solr_index.json", "w") as file:
            json.dump(solr_data, file)
