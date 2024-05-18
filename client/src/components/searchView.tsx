import SearchBar from "./searchBar";
import SlideIn from "./slideIn";

import { pages, Page } from "../data/pages";

import { useState } from "react";

import { FaArrowRight } from "react-icons/fa";

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

function SearchView() {
  const [search, setSearch] = useState("");

  function Heading() {
    return (
      <>
        <div className="mb-20 text-3xl font-bold text-white pointer-events-none">
          Search Engine Pro Max
          <div className="w-full border-b-2"></div>
        </div>
      </>
    );
  }

  function RenderSearchResults() {
    return (
      <>
        <div className=" w-[25%] bg-white rounded-xl overflow-clip flex flex-col gap-1">
          <GetPages searchW={search} />
        </div>
      </>
    );
  }

  function GetPages({ searchW }: SearchWord) {
    return searchData(searchW.toLowerCase()).map((page) => {
      return (
        <div className="flex flex-row justify-between items-center cursor-pointer hover:bg-gray-300">
          <div
            className=" p-2  transition-all duration-300 flex flex-col "
            key={page.id}
          >
            <span className="text-lg">{page.title}</span>
            <span className="text-sm italic">{page.preview}</span>
          </div>
          <div className="flex  w-12 justify-center">
            <FaArrowRight />
          </div>
        </div>
      );
    });
  }

  return (
    <>
      <section className="border-2 border-black flex flex-col gap-2 items-center justify-center h-screen w-full transition-all duration-700">
        <Heading />
        <div className="w-full h-1/2 flex flex-col items-center justify-start gap-1">
          <SearchBar search={search} setSearch={setSearch} />

          {search != "" ? (
            <SlideIn children={<RenderSearchResults />}></SlideIn>
          ) : null}
        </div>
      </section>
    </>
  );
}

export default SearchView;
