import json
from setup import logging

class Base:
    def __init__(self):
        """
        Initialize the Base class.
        """
        logging.info("Base.__init__")
        self.URLS = Base.get_data()[:100]
        self.TITLES_TO_SKIP = Base.get_titles_to_skip()


    @staticmethod
    def get_data(src="../dataset/dataset.json") -> str:
        """
        Read data from a file.
        """
        logging.info("Base.get_data")
        file = open(src, "r")
        data = file.read()
        file.close()
        return json.loads(data)
    
    @staticmethod
    def get_titles_to_skip(src="../dataset/titles_to_skip.json") -> str:
        """
        Read data from a file.
        """
        logging.info("Base.get_titles_to_skip")
        file = open(src, "r")
        data = file.read()
        file.close()
        return json.loads(data)
    