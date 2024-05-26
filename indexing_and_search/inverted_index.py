from collections import Counter, OrderedDict, defaultdict
import os
import math
from tqdm import tqdm
import json
from dotenv import dotenv_values

HEADINGS_WEIGHT = 1.2
DOC_WEIGHT = 1

config = dotenv_values(".env")

class InvertedIndex:
    def __init__(self):
        self.index = defaultdict(lambda: defaultdict(dict))
        self.documents_path = f"{config['SCRAPED_DATA_DIR']}"

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
                "previewTitle": doc["previewTitle"],
                "preview": doc["preview"],
            }

    def index_docs(self):
        docs = os.listdir(self.documents_path)
        doc_count = len(docs)
        for file in tqdm(docs, total=doc_count):
            with open(os.path.join(self.documents_path, file), "r") as file:
                try:
                    self.index_doc(json.load(file))
                except Exception as e:
                    continue # sample.txt skipped here

        for word, docs in self.index.items():
            idf = math.log(doc_count / len(docs))
            for doc in docs.values():
                self.index[word][doc["url"]]["tf-idf"] = doc["tf"] * idf
                del self.index[word][doc["url"]]["tf"]

        for key in self.index:
            self.index[key] = OrderedDict(sorted(self.index[key].items(), key=lambda x: x[1]["tf-idf"], reverse=True))
        if not os.path.exists(f"{config['TF_IDF_OUTPUT_DIR']}"):
            os.makedirs(config['TF_IDF_OUTPUT_DIR'])
        with open(f"{config['TF_IDF_OUTPUT_DIR']}/index.json", "w") as file:
            json.dump(self.index, file)
        return self.index


    def inverted_index_to_solr_format(self):
        data = {}
        with open("./output/index.json", "r") as file:
            data = json.load(file)
        solr_data = []
        for word, docs in tqdm(data.items()):
            for url, content in docs.items():
                solr_data.append({
                    "id": f"{word}_{content['url']}_{round(content['tf-idf'], 8)}",
                    "word": word,
                    "url": url,
                    "previewTitle": content["previewTitle"],
                    "preview": content["preview"],
                    "tf-idf": content["tf-idf"]                
                })

        with open("./output/solr_index.json", "w") as file:
            json.dump(solr_data, file)
