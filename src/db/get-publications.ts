import fetch from "node-fetch";
import fs from "fs";
import { publicationsTable } from "./schema";
import db from ".";
import { usersTable } from "./schema";
import { eq, sql } from "drizzle-orm";

const API_KEY = process.env.SERP_API_KEY!;
const MAX_RESULTS = 50;
const RESULTS_PER_PAGE = 10;
const logs: (typeof publicationsTable.$inferInsert)[] = [];

const parsePublicationDetails = (publicationText) => {
  if (!publicationText)
    return {
      type: "Unknown",
      journal: null,
      volume: null,
      issue: null,
      year: null,
    };

  const pubRegex = /^(.+) (\d+)\s*\((\d+)\),\s*(?:([\d\-]+),\s*)?(\d{4})$/;
  const pubMatch = publicationText.match(pubRegex);

  if (pubMatch) {
    return {
      type: "Publication",
      journal: pubMatch[1],
      volume: pubMatch[2],
      issue: pubMatch[3],
      year: pubMatch[5],
    };
  } else {
    return {
      type: "Publication",
      journal: publicationText,
      volume: null,
      issue: null,
      year: null,
    };
  }
};

const getPublicationsFromAuthor = async (author_id: string) => {
  console.log(`\n--- Fetching publications for author: ${author_id} ---`);
  for (let start = 0; start < MAX_RESULTS; start += RESULTS_PER_PAGE) {
    const url = `https://serpapi.com/search.json?engine=google_scholar_author&author_id=${author_id}&num=${100}&api_key=${API_KEY}`;

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

      let count: number = 1;
      const total: number = publications.length;
      for (const pub of publications) {
        console.log(`Processing publication: ${pub.title}`);
        const pubDetails = parsePublicationDetails(pub.publication || "");
        const authorNames = (pub.authors || "N/A")
          .split(",")
          .map((name) => name.trim())
          .slice(0, 5);

        const publication = {
          title: pub.title || null,
          type: pubDetails.type || null,
          journal: pubDetails.journal || null,
          volume: pubDetails.volume || null,
          issue: pubDetails.issue || null,
          year: pub.year || null,
          link: pub.link,
          citations: pub.cited_by?.value ? pub.cited_by?.value.toString() : 0,
          citation_id: pub.cited_by?.cites_id,
          author_names: authorNames,
          author_ids: [author_id],
        };

        logs.push(publication);
        try {
          await db.insert(publicationsTable).values(publication);
          console.log(
            `[${count} of ${total}] Inserted publication: ${publication.title}`
          );
        } catch (err: any) {
          if (
            (
              await db
                .select()
                .from(publicationsTable)
                .where(
                  eq(publicationsTable.citation_id, publication.citation_id)
                )
            ).length > 0
          ) {
            await db
              .update(publicationsTable)
              .set({
                author_ids: sql`${publicationsTable.author_ids} || ${publication.author_ids}`,
                citations: publication.citations,
              })
              .where(
                eq(publicationsTable.citation_id, publication.citation_id)
              );
            console.log(
              `[${count} of ${total}] Updated existing publication: ${publication.title} with new author_id: ${author_id}`
            );
          } else {
            console.error(
              `[${count} of ${total}] Error inserting publication ${publication.title}: ${err}`
            );
          }
        }
        count++;
      }

      if (publications.length < RESULTS_PER_PAGE) break;
    } catch (error: any) {
      console.error("Error fetching data:", error.message);
      break;
    }
  }
};

async function main() {
  const users = await db.select().from(usersTable);
  let count: number = 1;
  const total: number = users.length;
  for (const user of users) {
    if (!user.author_id) continue;
    await getPublicationsFromAuthor(user.author_id);
    console.log(
      `\nProcessed ${count} of ${total} authors: ${user.name} (${user.author_id})`
    );
    count++;
  }

  if (!fs.existsSync("logs")) {
    fs.mkdirSync("logs", { recursive: true });
  }

  fs.writeFileSync(
    "logs/db_insert_publications.json",
    JSON.stringify(logs, null, 2)
  );

  console.log("\n✅ All publications processed and logged.");
}

main();
