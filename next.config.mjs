/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow all IPs in local network for dev
  allowedDevOrigins: [
    'localhost', 
    '127.0.0.1', 
    '192.168.0.27',
    '*'
  ]
};

export default nextConfig;
