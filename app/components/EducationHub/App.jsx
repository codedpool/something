import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "../../style";

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

const initialVideos = [
  { title: "Stock Market for Beginners", videoId: "p7HKvqRI_Bo" },
  { title: "How to Invest in ETFs", videoId: "PHe0bXAIuk0" },
  { title: "Mutual Funds Explained", videoId: "1d_jYPL6uUI" },
  { title: "Cryptocurrency Investing", videoId: "9nlhmVrkv1Q" },
  { title: "Understanding Bonds", videoId: "BWLM5oYqyMk" },
  { title: "Ethereum and Smart Contracts", videoId: "pWGLtjG-F5c" },
];

const trendingNews = [
  {
    title: "Tech Stocks Surge in 2025",
    summary: "Analysts predict a boom in tech investments.",
    url: "https://www.google.com/search?q=tech+stocks+surge+2025",
  },
  {
    title: "Crypto Market Volatility Continues",
    summary: "Bitcoin and Ethereum face fluctuations.",
    url: "https://www.google.com/search?q=crypto+market+volatility+2025",
  },
  {
    title: "Federal Reserve Rate Cut Impact",
    summary: "How lower rates affect markets in 2025.",
    url: "https://www.google.com/search?q=federal+reserve+rate+cut+2025",
  },
  {
    title: "Emerging Markets Gain Momentum",
    summary: "Investment trends in developing economies.",
    url: "https://www.google.com/search?q=emerging+markets+2025",
  },
];

const EducationHub = () => {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState(initialVideos);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchVideos = async () => {
    if (!query) {
      setError("Please enter a search term.");
      return;
    }
    if (!YOUTUBE_API_KEY) {
      setError("Invalid or missing YouTube API key.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query
      )}&type=video&maxResults=6&key=${YOUTUBE_API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (!data.items || data.items.length === 0) throw new Error("No videos found.");
      setVideos(
        data.items.map((item) => ({
          title: item.snippet.title,
          videoId: item.id.videoId,
        }))
      );
    } catch (err) {
      setError(`Failed to fetch videos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.paddingX} ${styles.paddingY} bg-black min-h-screen`}>
      <div className={`${styles.boxWidth} mx-auto`}>
        <motion.h1
          className={`${styles.heading2} text-center text-gray-200`}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Financial Education Hub
        </motion.h1>

        <motion.div
          className={`${styles.flexCenter} flex-col sm:flex-row gap-4 mb-8 border-b border-gray-700 pb-6`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search financial videos..."
            className="p-3 w-full sm:w-3/4 rounded bg-[#1A1A1A] text-white focus:outline-none focus:ring-2 focus:ring-gray-500 placeholder-gray-400 font-poppins border border-gray-700"
          />
          <motion.button
            onClick={fetchVideos}
            className="py-3 px-6 font-poppins font-medium text-[18px] text-black bg-gray-300 hover:bg-gray-400 rounded-[10px] outline-none transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Search
          </motion.button>
        </motion.div>

        {loading && <p className="text-gray-400 text-center">Loading videos...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {/* Video Section */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          {videos.map((video, index) => (
            <motion.div
              key={index}
              className="bg-[#111] border border-gray-700 p-4 rounded-[20px] hover:border-gray-500 transition-all"
              whileHover={{ scale: 1.05 }}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <h3 className="font-poppins font-semibold text-gray-100 text-[18px] leading-[23.4px] mb-3">
                {video.title}
              </h3>
              <iframe
                width="100%"
                height="180"
                src={`https://www.youtube.com/embed/${video.videoId}`}
                frameBorder="0"
                allowFullScreen
                title={video.title}
                className="rounded-lg border border-gray-700"
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Divider line — only one now */}
        <hr className="border-gray-700 mb-10" />

        {/* Trending News Section */}
        <motion.h2
          className="text-center text-gray-200 text-3xl font-semibold mb-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          Trending Financial News
        </motion.h2>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.8 }}
        >
          {trendingNews.map((news, index) => (
            <motion.div
              key={index}
              className="bg-[#111] border border-gray-700 p-4 rounded-[20px] hover:border-gray-500 transition-all"
              whileHover={{ scale: 1.05 }}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.8 + index * 0.2, duration: 0.5 }}
            >
              <h3 className="font-poppins font-semibold text-gray-100 text-[18px] leading-[23.4px] mb-2">
                {news.title}
              </h3>
              <p className="text-gray-400 mb-3">{news.summary}</p>
              <a
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-4 font-poppins font-medium text-[16px] text-black bg-gray-300 hover:bg-gray-400 rounded-[10px] inline-block transition-all"
              >
                Read More
              </a>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default EducationHub;
