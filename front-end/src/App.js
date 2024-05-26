import "./App.css";
// Icons
import { CiSearch } from "react-icons/ci";
import { IoIosClose } from "react-icons/io";
import { IconContext } from "react-icons";
import { IoSettingsOutline } from "react-icons/io5";
// Hooks
import { useRef, useState } from "react";
//Framer
import { motion } from "framer-motion";
import axios from "axios";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [searchType, setSearchType] = useState("default");
  const searchBarRef = useRef(null);

  const [showEmpty, setShowEmpty] = useState(false);

  const [response, setResponse] = useState([]);

  const baseUrlTF = "http://localhost:8983/solr/inv-webpages/select";
  const baseUrlDefault = "http://localhost:8983/solr/webpages/select";

  function searchSolr(url, query) {
    axios
      .get(url, query)
      .then((res) => {
        console.log(res.data.response.docs);
        if (res.data.response.docs.length === 0) {
          setShowEmpty(true);
          // console.log("set empty");
          setTimeout(() => {
            setShowEmpty(false);
          }, 3000);
        }
        setResponse(res.data.response.docs);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function searchFlask(query) {
    axios
      .get(`http://localhost:5000/search?search=${query}`)
      .then((res) => {
        console.log(res);
        setResponse(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function createDataInv() {
    setResponse([]);
    const query = {
      params: {
        q: searchTerm,
        defType: "edismax",
        qf: "word",
        sort: "tf-idf desc",
        start: 0,
        bq: `${searchTerm
          .split(" ")
          .map((term) => `${term}`)
          .join(" AND ")}^2.0`,
        rows: 10,
        indent: "true",
        wt: "json",
      },
    };
    searchSolr(baseUrlTF, query);
  }

  function createDataDefault() {
    setResponse([]);
    const query = {
      params: {
        q: `doc:${searchTerm} OR headings:${searchTerm}`,
        wt: "json",
        indent: "true",
        bq: `${searchTerm
          .split(" ")
          .map((term) => `${term}`)
          .join(" OR ")}^2.0`,
        rows: 10,
      },
    };
    searchSolr(baseUrlDefault, query);
  }

  const handleRadioChange = (event) => {
    setResponse([]);
    setSearchType(event.target.value);
    setShowOptions(false);
  };

  function handleSearchTermChange(e) {
    // console.log(e.target.value);
    setShowOptions(false);
    setSearchTerm(e.target.value);
    // console.log(searchTerm);
  }

  function resetSearchTerm() {
    setSearchTerm("");
    // alert("reset search term");
    if (searchBarRef.current != null) {
      searchBarRef.current.value = "";
    }
  }

  return (
    <section className="py-10 w-full flex flex-col justify-start ">
      <div className="  flex items-center justify-center gap-2 mt-10">
        <div className="w-[35%] h-10 shadow-lg relative bg-white px-3 py-2 text-sm text-gray-500 rounded-xl outline-none border border-transparent focus-within:outline-none focus-within:border-black focus-within:border transition-all duration-300 flex items-center gap-1 ">
          {showOptions && (
            <motion.div
              id="options"
              className="bg-white flex items-center justify-around gap-3 rounded-xl px-4 h-10 shadow-lg top-6 left-0 w-full absolute"
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: 20 }}
              transition={{
                duration: 0.3,
                type: "spring",
              }}
              // exit={{ opacity: 0, y: -10 }}
            >
              <label className="flex  items-center">
                <input
                  type="radio"
                  name="searchType"
                  value="tf-idf"
                  checked={searchType === "tf-idf"}
                  onChange={handleRadioChange}
                />
                <span className="mx-1">Search with TF-IDF</span>
              </label>
              <label className="flex  items-center">
                <input
                  type="radio"
                  name="searchType"
                  value="default"
                  checked={searchType === "default"}
                  onChange={handleRadioChange}
                />
                <span className="mx-1">Search Default</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="searchType"
                  value="bert"
                  checked={searchType === "bert"}
                  onChange={handleRadioChange}
                />
                <span className="mx-1">Search with BERT</span>
              </label>
            </motion.div>
          )}
          <IconContext.Provider
            value={{
              color: "black",
              size: "1.5em",
            }}
          >
            <div>
              <CiSearch />
            </div>
          </IconContext.Provider>
          <input
            ref={searchBarRef}
            type="text"
            className="focus:outline-none w-full"
            onChange={handleSearchTermChange}
          />
          {searchTerm !== "" ? (
            <IconContext.Provider
              value={{
                color: "black",
                size: "1.5em",
              }}
            >
              <div onClick={resetSearchTerm}>
                <IoIosClose />
              </div>
            </IconContext.Provider>
          ) : null}
          <div className="h-5 border-r mr-1"></div>
          <IconContext.Provider
            value={{
              color: "black",
              size: "1.3em",
              className: `transition-all duration-500 ease-in-out ${
                showOptions ? "rotate-180" : "rotate-0"
              }`,
              style: {},
            }}
          >
            <div className="" onClick={() => setShowOptions(!showOptions)}>
              <IoSettingsOutline />
            </div>
          </IconContext.Provider>
        </div>
        <button
          onClick={() => {
            if (searchTerm === "") return;
            if (searchType === "tf-idf") {
              createDataInv();
            } else if (searchType === "default") {
              createDataDefault();
            } else {
              searchFlask(searchTerm);
            }
          }}
          className="bg-white h-10 flex items-center justify-center rounded-xl shadow-lg px-3 border border-transparent hover:border-black focus-within:outline-none focus-within:border-black focus-within:border transition-all duration-300"
        >
          <span>Search</span>
        </button>
      </div>
      <div className="flex flex-col items-center justify-center mt-4">
        {showEmpty && (
          <div className=" w-full text-center mt-5">
            <span className="bg-white px-4 py-2  rounded-xl shadow-lg">
              No Results Returned
            </span>
          </div>
        )}
        <div className="flex flex-col items-center justify-start bg-white rounded-xl w-[50%] overflow-hidden">
          {response.map((data, idx) => {
            return (
              <motion.div
                key={idx}
                className=" w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.3 * idx,
                  type: "spring",
                }}
              >
                <a href={data.url} className=" " key={idx}>
                  <div className="hover:bg-slate-300 w-full px-4 py-2">
                    <p className="text-sm italic">{data.previewTitle}</p>
                    <p className="text-xs italic text-gray-500 text-pretty">
                      {data.preview}
                    </p>
                  </div>
                </a>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default App;
