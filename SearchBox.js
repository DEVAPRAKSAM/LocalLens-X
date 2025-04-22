// src/components/SearchBox.js
import React from "react";

function SearchBox({ value, onChange }) {
  return (
    <div className="search-box">
      <input
        type="text"
        placeholder="🔍 Search for a place, issue..."
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export default SearchBox;
