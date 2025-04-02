import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), "..", "docs");

// Function to extract author_id from Google Scholar URL
const extractAuthorId = (url) => {
    console.log("Extracting author ID from URL:", url);
  const match = url.match(/user=([\w-]+)/);
  return match ? match[1] : null;
};

// Read CSV and convert to JSON
const csvFile = path.join(__dirname, "mech_authors.csv");
const jsonFile = path.join(__dirname, "mech_authors.json");

fs.promises
  .readFile(csvFile, "utf8")
  .then((data) => {
    const lines = data.split("\n");
    const jsonOutput = lines
      .map((line) => {
        const row = line.split(",");
        if (row.length >= 5) {
          return {
            name: row[2].trim(),
            author_id: extractAuthorId(row[5].trim()),
          };
        }
        return null;
      })
      .filter((entry) => entry !== null);

    return fs.promises.writeFile(
      jsonFile,
      JSON.stringify(jsonOutput, null, 4),
      "utf8"
    );
  })
  .then(() => console.log("JSON file created:", jsonFile))
  .catch((err) => console.error("Error:", err));
