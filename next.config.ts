
const nextConfig = {
    images: {
      domains: ['res.cloudinary.com'],
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'res.cloudinary.com',
          pathname: '/dzzpx2gjw/image/upload/**',
        },
      ],
    },
  /* config options here */
}
export default nextConfig;
