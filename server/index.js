const express = require("express");
const axios = require("axios");
const cors = require("cors");
const natural = require("natural");
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

const stopWords = require("stopwords").english;

const { lemmaitizedMap } = require("./lemmatizedMap");

const app = express();
const port = 3000;

app.use(cors("*"));
app.use(express.json());

app.post("/fetch", async (req, res) => {
  console.log("fetching");
  let { url, params } = req.body;

  url = new URL(url);

  const query = processText(params.q);

  params.q = query;
  // params.bq = `${query
  //   .split(" ")
  //   .map((term) => `${term}`)
  //   .join(" AND ")}^2.0`;

  Object.keys(params).forEach((key) =>
    url.searchParams.append(key, params[key])
  );

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // console.log(url);
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ err: `Failed to fetch the URL ${error}` });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

function processText(text) {
  const textLower = text.toLowerCase();
  const textWithoutPunctuation = textLower.replace(/[^\w\s]/g, " ");

  // tokenize the text and remove the stop words
  const tokens = tokenizer.tokenize(textWithoutPunctuation);
  const filteredTokens = tokens.filter((token) => !stopWords.includes(token));

  // remove the tokens with length less than 2 and greater than 32
  const lenFilteredTokens = filteredTokens.filter(
    (token) => token.length >= 2 && token.length <= 32
  );

  // lemmatize the tokens and stem them
  const lemmitizeTokens = lenFilteredTokens.map((token) =>
    lemmaitizedMap[token] ? lemmaitizedMap[token] : token
  );
  return lemmitizeTokens.map((token) => stemmer.stem(token)).join(" ");
}
