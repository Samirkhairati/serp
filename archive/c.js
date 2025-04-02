import fetch from "node-fetch";
import fs from "fs";
import { createObjectCsvWriter } from "csv-writer";

const API_KEY =
  "d7873e2565650ec20295895deca0425af749218227aae602dec9d83efc260246"; // Replace with your SERP API key
const AUTHOR_ID = "uOAfc4YAAAAJ"; // Author ID for Supradeepan K
const MAX_RESULTS = 50;
const RESULTS_PER_PAGE = 10;

const csvWriter = createObjectCsvWriter({
  path: "author_publications.csv",
  header: [
    { id: "title", title: "Title" },
    { id: "type", title: "Type" },
    { id: "journal", title: "Journal" },
    { id: "volume", title: "Volume" },
    { id: "issue", title: "Issue" },
    { id: "year", title: "Year" },
    { id: "link", title: "Link" },
    { id: "citations", title: "Citations" },
  ],
});

const parsePublicationDetails = (publicationText) => {
  if (!publicationText)
    return {
      type: "Unknown",
      journal: "N/A",
      volume: "N/A",
      issue: "N/A",
      year: "N/A",
    };

  // Check if it's a journal publication (format: "JournalName Volume (Issue), Year")
  const pubRegex = /^(.+) (\d+)\s*\((\d+)\),\s*(?:([\d\-]+),\s*)?(\d{4})$/;
  const pubMatch = publicationText.match(pubRegex);

  if (pubMatch) {
    return {
      type: "Publication",
      journal: pubMatch[1], // "Journal of Vibration and Control"
      volume: pubMatch[2], // "25"
      issue: pubMatch[3], // "12"
    };
  } else {
    return {
      type: "Publication",
      journal: publicationText,
      volume: "N/A",
      issue: "N/A",
    };
  }

  console.log(publicationText);
  // Check if it's a book (format: "Publisher, Year")
  // const bookRegex = /^(.+), (\d{4})$/;
  // const bookMatch = publicationText.match(bookRegex);
  // if (bookMatch) {
  //   return {
  //     type: "Book",
  //     journal: bookMatch[1],
  //     volume: "N/A",
  //     issue: "N/A",
  //     year: bookMatch[2],
  //   };
  // }

  // If no match, return unknown type
  return {
    type: "Unknown",
    journal: "N/A",
    volume: "N/A",
    issue: "N/A",
    year: "N/A",
  };
};

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
          const pubDetails = parsePublicationDetails(pub.publication || "");

          return {
            title: pub.title || "N/A",
            type: pubDetails.type,
            journal: pubDetails.journal,
            volume: pubDetails.volume,
            issue: pubDetails.issue,
            year: pub.year,
            link: pub.link || "N/A",
            citations: pub.cited_by?.value || "0",
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
