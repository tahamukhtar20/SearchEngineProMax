import "./App.css";
import SearchBar from "./components/searchBar";
import SlideIn from "./components/slideIn";
import { motion } from "framer-motion";

import { useEffect, useState } from "react";

function sendSolr(url: URL, params: any, setResponse: any) {
  fetch("http://localhost:3000/fetch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ url: url, params: params }),
  })
    .then((response) => response.json())
    .then((data) => {
      const seen = new Set();

      const filteredDocs = data.response.docs.filter(
        (doc: { url: string; "tf-idf": number }) => {
          if (seen.has(doc.url)) {
            return false;
          }
          seen.add(doc.url);
          return true;
        }
      );

      filteredDocs.sort(
        (a: { "tf-idf": number }, b: { "tf-idf": number }) =>
          b["tf-idf"] - a["tf-idf"]
      );

      // Update state with filtered and sorted response
      setResponse(filteredDocs);
    })
    .catch((error) => console.error("Error:", error));
}

function App() {
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState("tf-idf");
  const [response, setResponse] = useState([]);

  useEffect(() => {
    const handleKeyDown = (
      e: KeyboardEvent | React.KeyboardEvent<HTMLDivElement>
    ) => {
      if (e.key === "Enter") {
        console.log("Enter");
        setResponse([]);

        // console.log(searchType);
        let url = null;
        let params = null;

        if (searchType === "tf-idf") {
          url = new URL("http://localhost:8983/solr/inv-docs/select");
          const params = {
            q: search,
            defType: "edismax",
            qf: "word",
            sort: "tf-idf desc",
            start: 0,
            bq: `${search
              .split(" ")
              .map((term) => `${term}`)
              .join(" AND ")}^2.0`,
            rows: 10,
            indent: "true",
            wt: "json",
          };
          sendSolr(url, params, setResponse);
        } else if (searchType === "solr") {
          url = new URL("http://localhost:8983/solr/docs/select");
          params = {
            q: `doc%3A${search}%20OR%20headings%3A${search}`,
            wt: "json",
          };
          sendSolr(url, params, setResponse);
        } else {
          // console.log("bert");
          fetch(`http://localhost:5000/search?search=${search}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          })
            .then((res) => res.json())
            .then((data) => {
              // console.log(data);
              setResponse(data);
            })
            .catch((err) => {
              console.log(err);
            });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [search]);

  return (
    <>
      <section className="flex flex-col px-10 items-center justify-center py-14 pt-10 gap-10 w-full transition-all duration-700 ">
        <div className="flex flex-row gap-2 w-full">
          <SearchBar search={search} setSearch={setSearch} />
          <div>
            <select
              name="search-type"
              id="search-type"
              className=" h-full px-4  rounded-xl bg-white font-light py-2 flex flex-row justify-between gap-2 shadow-md focus-within:border-black focus:border-black border transition-all ease-in-out duration-500"
              value={searchType}
              onChange={(e) => {
                setSearchType(e.currentTarget.value);
                console.log(e.currentTarget.value);
              }}
            >
              <option value="bert">Search with Bert</option>
              <option value="tf-idf">Search with TF-IDF</option>
            </select>
          </div>
        </div>
        {
          <SlideIn>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {response.map((page: any, idx) => (
              <motion.div
                key={page.id}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  delay: idx * 0.05,
                  type: "spring",
                }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full bg-white shadow-md rounded-xl"
              >
                <div className="p-4">
                  <h2 className="text-lg font-semibold">{page.title}</h2>
                  <a
                    href={page.url}
                    className="text-sm font-light text-purple-800 hover:underline"
                  >
                    {page.url}
                  </a>
                  <p className="text-sm font-light">{page.description}</p>
                </div>
              </motion.div>
            ))}
          </SlideIn>
        }
      </section>
    </>
  );
}

export default App;
