from transformers import AutoTokenizer, AutoModel
import torch
import torch.nn.functional as F

from dotenv import dotenv_values

config = dotenv_values("./.env")

tokenizer = AutoTokenizer.from_pretrained(config['llm_model'])
model = AutoModel.from_pretrained(config['llm_model'])

def compute_embeddings(input_text):
    inputs = tokenizer(input_text, return_tensors='pt', truncation=True)
    with torch.no_grad():
        outputs = model(**inputs)
    
    embeddings = outputs.last_hidden_state
    mean_embeds = torch.mean(embeddings, dim=1)
    cls_embeds = embeddings[:,0,:]
    return {
        "mean": mean_embeds,
        "cls":cls_embeds
    }
    
def compute_cosine_similarity(embed1, embed2):
    return F.cosine_similarity(embed1, torch.Tensor(embed2), dim=1).squeeze(0).numpy().tolist()