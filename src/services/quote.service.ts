import axios from "axios";

const FALLBACK_QUOTES = [
  {
    quote: "First, solve the problem. Then, write the code.",
    author: "John Johnson",
    category: "programming",
  },
  {
    quote: "Code is like humor. When you have to explain it, it's bad.",
    author: "Cory House",
    category: "programming",
  },
  {
    quote:
      "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
    author: "Martin Fowler",
    category: "programming",
  },
  {
    quote: "Truth can only be found in one place: the code.",
    author: "Robert C. Martin",
    category: "programming",
  },
  {
    quote: "Make it work, make it right, make it fast.",
    author: "Kent Beck",
    category: "programming",
  },
];

export const getDailyQuote = async () => {
  try {
    const response = await axios.get(
      "https://api.quotable.io/random?tags=technology",
      {
        timeout: 5000,
      },
    );

    return {
      quote: response.data.content,
      author: response.data.author,
      category: "technology",
    };
  } catch (error) {
    console.log("Quote API failed, using fallback");
    // Return random fallback quote
    const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
    return FALLBACK_QUOTES[randomIndex];
  }
};
