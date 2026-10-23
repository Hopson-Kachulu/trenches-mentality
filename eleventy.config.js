// Eleventy turns the Markdown files in src/ into a plain HTML website in _site/.
// Netlify runs `npm run build` on every change and serves _site/.
import { feedPlugin } from "@11ty/eleventy-plugin-rss";

export default function (eleventyConfig) {
  // Files copied as-is into the final site
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "src/uploads": "uploads" });

  const now = new Date();

  // Changes every build, so browsers always fetch the newest CSS
  eleventyConfig.addGlobalData("build", String(Date.now()));

  // "Posts" = everything in src/blog that is not a draft and not dated in the future.
  // Future-dated posts appear automatically once the daily rebuild runs past their date.
  eleventyConfig.addCollection("posts", (api) =>
    api
      .getFilteredByGlob("src/blog/*.md")
      .filter((p) => !p.data.draft && p.date <= now)
      .sort((a, b) => b.date - a.date)
  );

  // One list per pillar (Tech, AI, Agriculture, Arts, Hustle)
  eleventyConfig.addCollection("pillarList", (api) => {
    const set = new Set();
    api.getFilteredByGlob("src/blog/*.md").forEach((p) => p.data.pillar && set.add(p.data.pillar));
    return [...set].sort();
  });

  eleventyConfig.addFilter("byPillar", (posts, pillar) => posts.filter((p) => p.data.pillar === pillar));
  eleventyConfig.addFilter("slug", (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  eleventyConfig.addFilter("readableDate", (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
  );
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString());
  eleventyConfig.addFilter("readingTime", (content = "") => {
    const words = String(content).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220)) + " min read";
  });
  eleventyConfig.addFilter("head", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("year", () => new Date().getFullYear());

  // RSS feed at /feed.xml: newsletter tools and socials can auto-post from this
  eleventyConfig.addPlugin(feedPlugin, {
    type: "rss",
    outputPath: "/feed.xml",
    collection: { name: "posts", limit: 20 },
    metadata: {
      language: "en",
      title: "Trenches Mentality",
      subtitle: "Notes from people building their way out.",
      base: "https://trenchesmentality.shop/",
      author: { name: "Hopson" },
    },
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
