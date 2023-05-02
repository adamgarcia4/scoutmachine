import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { MarketplaceScreen } from "@/components/screens/MarketplaceScreen";
import { db } from "@/lib/db";
import Head from "next/head";

export default function MarketplacePage({
  posts,
}: {
  posts: (any & {
    author: {
      name: string;
      image: string;
    };
  })[];
}) {
  {
    return (
      <>
        <Head>
          <title>Marketplace | Scout Machine</title>
        </Head>

        <Navbar active="Marketplace" />

        <Header
          title="Marketplace"
          desc="Have FRC parts you don't use anymore? Looking to sell or buy?"
        />

        <MarketplaceScreen  />

        <Footer />
      </>
    );
  }
}

export const getServerSideProps = async () => {
  const posts = await db.post.findMany({
    where: {},
    include: {
      author: {
        select: {
          image: true,
          name: true,
          email: true,
        },
      },
    },
  });
  return { props: { posts: JSON.parse(JSON.stringify(posts)) } };
};