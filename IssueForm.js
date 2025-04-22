import React, { useState } from "react";
import axios from "axios";

function IssueForm() {
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("image", image);
    formData.append("description", description);

    setStatus("Uploading...");

    try {
      await axios.post("http://localhost:5000/upload", formData);
      setStatus("Issue reported successfully! 🎉");
      setDescription("");
    } catch (error) {
      console.error(error);
      setStatus("Failed to upload 😢");
    }
  };

  return (
    <div className="issue-form">
      <h3>📷 Report an Issue</h3>
      <input type="file" onChange={(e) => setImage(e.target.files[0])} />
      <textarea
        placeholder="Describe the issue"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button onClick={handleUpload}>Submit</button>
      <p className="status">{status}</p>
    </div>
  );
}

export default IssueForm;
