import db from ".";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { usersTable } from "./schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonFile = path.join(__dirname, "../../docs/eee_authors.json");

async function main() {
  try {
    const data = await fs.promises.readFile(jsonFile, "utf8");
    const authors = JSON.parse(data);

    for (const author of authors) {
      try {
        await db.insert(usersTable).values({
          name: author.name,
          author_id: author.author_id,
          email: author.email,
          department: "eee",
        });
        console.log(`Inserted author: ${author.name}`);
      } catch (error) {
        console.error(`Error inserting author ${author.name}:`, error);
      }
    }

    console.log("All authors inserted successfully!");
  } catch (error) {
    console.error("Error processing authors:", error);
  }
}

main();
