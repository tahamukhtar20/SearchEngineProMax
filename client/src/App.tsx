import "./App.css";
import SearchBar from "./components/searchBar";
import SlideIn from "./components/slideIn";

import { pages, Page } from "./data/pages";

import { useState } from "react";

function searchData(searchWords: string) {
  return pages
    .filter((page) =>
      page.keywords.some((keyword) =>
        keyword.toLowerCase().includes(searchWords)
      )
    )
    .sort((a: Page, b: Page) => {
      return a.score - b.score;
    })
    .slice(0, 5);
}

interface SearchWord {
  searchW: string;
}

function App() {
  const [search, setSearch] = useState("");

  // useEffect(() => {
  //   console.log(searchData(search));
  // }, [search]);

  function GetPages({ searchW }: SearchWord) {
    return searchData(searchW).map((page, idx) => {
      return (
        <>
          <div
            className="bg-white p-2 hover:bg-gray-300 transition-all duration-300"
            key={idx}
          >
            {page.title}
          </div>
        </>
      );
    });
  }

  return (
    <>
      <section className="border-2 border-black flex flex-col gap-2 items-center justify-center h-screen w-full fixed transition-all duration-700">
        <SearchBar search={search} setSearch={setSearch} />
        {search != "" ? (
          <SlideIn
            children={
              <div className="fixed top-[36%] w-[25%] bg-white rounded-xl overflow-clip flex flex-col gap-1">
                <GetPages searchW={search} />
              </div>
            }
          ></SlideIn>
        ) : null}
      </section>
    </>
  );
}

export default App;
