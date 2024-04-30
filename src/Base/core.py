import json
from setup import logging

class Base:
    def __init__(self):
        """
        Initialize the Base class.
        """
        logging.info("Base.__init__")
        self.URLS = Base.get_data()[:100]


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
    