import { useLoaderData } from "react-router-dom";
import { Page } from "../data/pages";

export default function PageView() {
  const page = useLoaderData() as Page;
  return (
    <>
      <section>
        <div>{page.title}</div>
      </section>
    </>
  );
}
