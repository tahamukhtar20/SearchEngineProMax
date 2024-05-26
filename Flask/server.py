from flask import Flask, request
from flask_cors import CORS
import os
from dotenv import dotenv_values
import json

from embed import compute_embeddings, compute_cosine_similarity

app = Flask(__name__)
cors = CORS(app)
# Load the config
config = dotenv_values("./.env")
# print(config)

# read the embedding files
files = []
if os.path.exists(config['search-DIR']):
    for file in os.listdir(config['search-DIR']):
            with open(os.path.join(config['search-DIR'], file)) as f:
                file_data = json.load(f)
                files.append(file_data)
                
def sort_func(result):
    return result["score_embed1"] + result["score_embed2"]


@app.route("/search", methods=["GET"])
def search():
    # compute search embeddings
    searchWord = request.args.get('search')
    
    if searchWord is None:
         return "Please specify a valid word", 500

    searchEmbeddings = compute_embeddings(searchWord)['mean']
    
    if not os.path.exists(config['search-DIR']):
        return "Failed: Search Directory not found", 404
    
    # Return docs with high similarity
    sim_thresh = 0.7
    results = []
    global files
    for file_data in files:
        score_embed1 = compute_cosine_similarity(searchEmbeddings, file_data['embed1'])
        score_embed2 = compute_cosine_similarity(searchEmbeddings, file_data['embed2'])
        if score_embed1 > sim_thresh or score_embed2 > sim_thresh:
            results.append({
                "url":file_data['url'],
                "previewTitle":file_data['previewTitle'],
                "preview":file_data['preview'],
                "score_embed1":score_embed1,
                "score_embed2":score_embed2
            })
            
    
    
    return sorted(results, key=sort_func, reverse=True)[:10]