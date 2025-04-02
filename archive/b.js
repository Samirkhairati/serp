import fetch from "node-fetch";
import fs from "fs";
import { createObjectCsvWriter } from "csv-writer";

const API_KEY = "d7873e2565650ec20295895deca0425af749218227aae602dec9d83efc260246"; // Replace with your SERP API key
const AUTHOR_ID = "uOAfc4YAAAAJ"; // Author ID for Supradeepan K
const MAX_RESULTS = 50;
const RESULTS_PER_PAGE = 10;

const csvWriter = createObjectCsvWriter({
  path: "author_publications.csv",
  header: [
    { id: "title", title: "Title" },
    { id: "citations", title: "Citations" },
    { id: "year", title: "Year" },
    { id: "link", title: "Link" },
    { id: "author1_name", title: "Author 1 Name" },
    { id: "author1_email", title: "Author 1 Email" },
    { id: "author2_name", title: "Author 2 Name" },
    { id: "author2_email", title: "Author 2 Email" },
    { id: "author3_name", title: "Author 3 Name" },
    { id: "author3_email", title: "Author 3 Email" },
    { id: "author4_name", title: "Author 4 Name" },
    { id: "author4_email", title: "Author 4 Email" },
    { id: "author5_name", title: "Author 5 Name" },
    { id: "author5_email", title: "Author 5 Email" }
  ],
});

const getPublicationsFromAuthor = async () => {
  let allPublications = [];
  let logs = [];

  for (let start = 0; start < MAX_RESULTS; start += RESULTS_PER_PAGE) {
    const url = `https://serpapi.com/search.json?engine=google_scholar_author&author_id=${AUTHOR_ID}&start=${start}&api_key=${API_KEY}`;
    console.log(`Fetching author publications from start=${start}...`);

    try {
      const response = await fetch(url);
      const json = await response.json();

      if (json.error) {
        console.error("Error:", json.error);
        break;
      }

      const publications = json.articles;
      if (!publications || publications.length === 0) {
        console.log("No more publications found.");
        break;
      }

      logs.push(publications);
      
      allPublications.push(
        ...publications.map((pub) => {
          const authorNames = (pub.authors || "N/A").split(", ").slice(0, 5);
          return {
            title: pub.title || "N/A",
            citations: pub.cited_by?.value || "0",
            year: pub.year || "N/A",
            link: pub.link || "N/A",
            author1_name: authorNames[0] || "N/A",
            author1_email: authorNames[0] ? "placeholder@example.com" : "N/A",
            author2_name: authorNames[1] || "N/A",
            author2_email: authorNames[1] ? "placeholder@example.com" : "N/A",
            author3_name: authorNames[2] || "N/A",
            author3_email: authorNames[2] ? "placeholder@example.com" : "N/A",
            author4_name: authorNames[3] || "N/A",
            author4_email: authorNames[3] ? "placeholder@example.com" : "N/A",
            author5_name: authorNames[4] || "N/A",
            author5_email: authorNames[4] ? "placeholder@example.com" : "N/A"
          };
        })
      );

      if (publications.length < RESULTS_PER_PAGE) break;
    } catch (error) {
      console.error("Error fetching data:", error.message);
      break;
    }
  }

  fs.writeFileSync("author_logs.json", JSON.stringify(logs, null, 2));

  if (allPublications.length === 0) {
    console.log("No publications found.");
    return;
  }

  await csvWriter.writeRecords(allPublications);
  console.log(
    `Fetched ${allPublications.length} publications successfully! Data saved to author_publications.csv.`
  );
};

getPublicationsFromAuthor();
