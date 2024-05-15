import { Page } from "../data/pages";

export default function PageCard(page: Page) {
  return (
    <>
      <div className="bg-white rounded-xl w-full">
        <span>{page.title}</span>
      </div>
    </>
  );
}
