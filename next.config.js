// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/mutual/:path*',
        destination: 'http://localhost:8000/api/mutual/:path*', // your FastAPI mutual funds route
      },
      {
        source: '/api/stock/:path*',
        destination: 'http://localhost:8000/api/stock/:path*', // your FastAPI stock route
      },
      {
        source: '/api/crypto/:path*',
        destination: 'http://localhost:8000/api/crypto/:path*', // your FastAPI crypto route
      },
    ];
  },
}
