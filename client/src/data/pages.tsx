export interface Page {
  id: number;
  score: number;
  title: string;
  preview: string;
  keywords: string[];
}

export const pages: Page[] = [
  {
    id: 1,
    score: 92,
    title: "The Importance of Education",
    preview:
      "Explore why education is crucial for personal and societal development.",
    keywords: ["education", "learning", "development"],
  },
  {
    id: 2,
    score: 85,
    title: "Healthy Living Tips",
    preview: "Discover practical tips for maintaining a healthy lifestyle.",
    keywords: ["health", "wellness", "fitness"],
  },
  {
    id: 3,
    score: 78,
    title: "Financial Planning 101",
    preview:
      "Learn the basics of financial planning and secure your financial future.",
    keywords: ["finance", "money", "planning"],
  },
  {
    id: 4,
    score: 96,
    title: "Introduction to Artificial Intelligence",
    preview:
      "Get started with AI and explore its applications in various domains.",
    keywords: ["artificial intelligence", "AI", "technology"],
  },
];
