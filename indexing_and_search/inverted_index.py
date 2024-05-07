from collections import OrderedDict, defaultdict
import os
import json


class InvertedIndex:
    def __init__(self):
        self.index = defaultdict()
        self.documents_path = "../output"

    def __repr__(self):
        return str(self.index)
    
    def index_doc(self, doc):
        for _, val in enumerate(doc["content"]["doc"]):
            if val not in self.index:
                self.index[val] = defaultdict()
            if doc["url"] in self.index[val]:
                self.index[val][doc["url"]] += 1
            else:
                self.index[val][doc["url"]] = 1


    
    def index_docs(self):
        for file in os.listdir(self.documents_path):
            with open(os.path.join(self.documents_path, file), "r") as file:
                self.index_doc(json.load(file))
        for key in self.index:
            self.index[key] = OrderedDict(sorted(self.index[key].items(), key=lambda x: x[1], reverse=True))
        return self.index
        
