export const siteConfig = {
  name: "StadiumOS",
  description:
    "Production-grade GenAI-powered platform for the FIFA World Cup 2026",
  url: "https://stadiumos.vercel.app",
  ogImage: "https://stadiumos.vercel.app/og.png",
  links: {
    github: "https://github.com/stadiumos",
  },
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Features",
      href: "#features",
    },
    {
      title: "Architecture",
      href: "#architecture",
    },
  ],
};

export type SiteConfig = typeof siteConfig;
