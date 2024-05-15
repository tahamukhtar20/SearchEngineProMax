import { CiSearch } from "react-icons/ci";
import { IconContext } from "react-icons";
import { LuSettings2 } from "react-icons/lu";
import { IoMdClose } from "react-icons/io";
import { ChangeEvent, useRef } from "react";

interface SearchVariables {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
}

export default function SearchBar({ search, setSearch }: SearchVariables) {
  const searchBarRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };
  const handleClear = () => {
    setSearch("");
    if (searchBarRef.current != null) {
      searchBarRef.current.focus();
    }
  };

  return (
    <>
      <div className="fixed top-[30%] w-[25%] px-4 rounded-xl bg-white font-light text-sm py-2  flex flex-row justify-between gap-2 shadow-md focus-within:border-black focus:border-black border transition-all ease-in-out duration-500 ">
        <div className="flex flex-row gap-2 w-full ">
          <IconContext.Provider value={{ size: "1.75em" }}>
            <div>
              <CiSearch />
            </div>
          </IconContext.Provider>
          <input
            type="text"
            className="w-full  placeholder:text-base focus:outline-none text-gray-600"
            placeholder="Search"
            value={search}
            onChange={handleChange}
            ref={searchBarRef}
          />
          {search != "" ? (
            <IconContext.Provider value={{ size: "1.75em" }}>
              <div onClick={handleClear}>
                <IoMdClose />
              </div>
            </IconContext.Provider>
          ) : null}
        </div>
        <div className="border-l border-gray-300 pl-2 flex items-center cursor-pointer">
          <IconContext.Provider value={{ size: "1.5em" }}>
            <div>
              <LuSettings2 />
            </div>
          </IconContext.Provider>
        </div>
      </div>
    </>
  );
}
