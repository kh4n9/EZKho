export default function robots() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/dashboard/', // Prevent crawling of dashboard pages if they are private
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
