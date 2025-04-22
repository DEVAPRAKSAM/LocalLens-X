import React, { useState } from "react";
import LiveMap from "../components/LiveMap";
import IssueForm from "../components/IssueForm";
import SearchBox from "../components/SearchBox";


function Report() {
  const [search, setSearch] = useState("");
  return (
    <div className="report-page">
     <SearchBox value={search} onChange={(e) => setSearch(e.target.value)} />
      <IssueForm />
      <LiveMap search={search} />
    </div>
  );
}

export default Report;
