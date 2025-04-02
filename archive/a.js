import fetch from "node-fetch";
import fs from "fs";
import { createObjectCsvWriter } from "csv-writer";

const API_KEY = "d7873e2565650ec20295895deca0425af749218227aae602dec9d83efc260246"; // Replace with your SERP API key
const MAX_RESULTS = 1;
const RESULTS_PER_PAGE = 10;
const personName = "Supradeepan K";

const csvWriter = createObjectCsvWriter({
  path: "publications.csv",
  header: [
    { id: "title", title: "Title" },
    { id: "citations", title: "Citations" },
    { id: "authors", title: "Authors" },
    { id: "journal", title: "Journal" },
    { id: "volume", title: "Volume" },
    { id: "issue", title: "Issue" },
    { id: "year", title: "Year" },
    { id: "link", title: "Link" },
  ],
});

const extractYear = (summary) => summary?.match(/\b(19|20)\d{2}\b/)?.[0] || "N/A";
const extractVolume = (summary) => summary?.match(/vol\.? (\d+)/i)?.[1] || "N/A";
const extractIssue = (summary) => summary?.match(/no\.? (\d+)/i)?.[1] || "N/A";

const fetchPublicationDetails = async (publicationId) => {
  const url = `https://serpapi.com/search.json?engine=google_scholar_author&author_id=${publicationId}&api_key=${API_KEY}`;
  try {
    const response = await fetch(url);
    const json = await response.json();
    if (json.error) {
      console.error("Error fetching publication details:", json.error);
      return null;
    }
    return json;
  } catch (error) {
    console.error("Error fetching publication details:", error.message);
    return null;
  }
};

const getPublications = async () => {
  let allPublications = [];
  let logs = [];

  for (let start = 0; start < MAX_RESULTS; start += RESULTS_PER_PAGE) {
    const url = `https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(
      personName
    )}&start=${start}&api_key=${API_KEY}`;
    console.log(`Fetching results from start=${start}...`);

    try {
      const response = await fetch(url);
      const json = await response.json();

      if (json.error) {
        console.error("Error:", json.error);
        break;
      }

      const publications = json.organic_results;
      if (!publications || publications.length === 0) {
        console.log("No more publications found.");
        break;
      }

      for (const pub of publications) {
        const details = await fetchPublicationDetails(pub.author_id);
        console.log(details)

        allPublications.push({
          title: pub.title || "N/A",
          citations: details?.cited_by?.total || pub.citation_count || "N/A",
          authors: details?.authors?.map((a) => a.name).join(", ") || "N/A",
          journal: pub.publication_info?.summary || "N/A",
          volume: extractVolume(pub.publication_info?.summary),
          issue: extractIssue(pub.publication_info?.summary),
          year: extractYear(pub.publication_info?.summary),
          link: pub.link || "N/A",
        });
      }

      logs.push(publications);
      if (publications.length < RESULTS_PER_PAGE) break;
    } catch (error) {
      console.error("Error fetching data:", error.message);
      break;
    }
  }

  fs.writeFileSync("logs.json", JSON.stringify(logs, null, 2));

  if (allPublications.length === 0) {
    console.log("No publications found.");
    return;
  }

  await csvWriter.writeRecords(allPublications);
  console.log(
    `Fetched ${allPublications.length} publications successfully! Data saved to publications.csv.`
  );
};

getPublications();
