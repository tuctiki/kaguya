/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    images: {
        unoptimized: true,
    },
    // Optional: Only apply rewrites in development if needed, 
    // but Next.js usually ignores them in static export builds anyway.
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://127.0.0.1:8000/api/:path*',
            },
            {
                source: '/images/:path*',
                destination: 'http://127.0.0.1:8000/images/:path*',
            },
        ];
    },
};

export default nextConfig;
