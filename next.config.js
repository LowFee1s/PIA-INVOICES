/** @type {import('next').NextConfig} */
const nextConfig = {
    api: {
        bodyParser: {
            sizeLimit: '15mb',
        },
    },
};

module.exports = nextConfig;
