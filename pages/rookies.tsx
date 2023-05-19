import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Loading } from "@/components/Loading";
import { Navbar } from "@/components/navbar";
import { TeamCard } from "@/components/TeamCard";
import { API_URL, CURR_YEAR } from "@/lib/constants";
import { getStorage, setStorage } from "@/utils/localStorage";
import { formatTime } from "@/utils/time";
import { useState, useEffect } from "react";
import { FaBolt } from "react-icons/fa";
import Head from "next/head";
import { log } from "@/utils/log";
import db from "@/lib/db";
import { GetServerSideProps } from "next";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]";

async function fetchRookieTeamsData() {
  const cacheDataTeams = getStorage(`rookieTeams_${CURR_YEAR}`);
  const cacheDataAvatars = getStorage(`rookieTeamsAvatars_${CURR_YEAR}`);

  if (cacheDataTeams && cacheDataAvatars) {
    return {
      teams: cacheDataTeams,
      avatars: cacheDataAvatars,
    };
  }

  const start = performance.now();
  const getRookies = async (pageNum: string) =>
    await fetch(`${API_URL}/api/team/teams?page=${pageNum}`, {
      next: { revalidate: 60 },
    }).then((res) => res.json());
  const pageNumbers = [...Array(20).keys()].map((i) => i.toString());
  const pages = await Promise.all(pageNumbers.map((num) => getRookies(num)));
  const data: any = pages
    .flatMap((page: any) => page)
    .filter(
      (team: any) =>
        team.rookie_year === CURR_YEAR && !team.nickname.includes("Off-Season")
    );
  log(
    "warning",
    `Fetching [/team/teams] took ${formatTime(performance.now() - start)}`
  );

  const teamAvatars: any = {};

  const getTeamAvatars = data.map(async (team: any) => {
    try {
      const response = await fetch(
        `${API_URL}/api/team/avatar?team=${team.team_number}`
      );
      const data = await response.json();
      teamAvatars[team.team_number] = data.avatar;
    } catch (error) {
      teamAvatars[team.team_number] = null;
    }
  });

  await Promise.all(getTeamAvatars);

  log(
    "warning",
    `Fetching [/team/avatar] took ${formatTime(performance.now() - start)}`
  );

  setStorage(`rookieTeams_${CURR_YEAR}`, data);
  setStorage(`rookieTeamsAvatars_${CURR_YEAR}`, teamAvatars);

  return {
    teams: data,
    avatars: teamAvatars,
  };
}

export default function RookiesPage({ user }: any) {
  const [rookieTeams, setRookieTeams] = useState<any>();
  const [avatars, setAvatars] = useState<any>();

  useEffect(() => {
    async function fetchData() {
      const teams = (await fetchRookieTeamsData()).teams;
      const avatars = (await fetchRookieTeamsData()).avatars;

      if (teams) setRookieTeams(teams);
      if (avatars) setAvatars(avatars);
    }

    fetchData();
  }, [setRookieTeams, setAvatars]);

  if (!rookieTeams) return <Loading />;
  return (
    <>
      <Head>
        <title>Rookies | Scout Machine</title>
      </Head>

      <Navbar active="Rookie Teams" />

      <Header
        className="flex"
        title={
          <p className="mb-2 text-3xl font-black md:flex md:text-5xl text-primary">
            <FaBolt className="mr-3 md:ml-0 ml-[-10px] md:mb-0 mb-3 w-[50px]" />
            <span className="mr-1 italic md:mr-3">FIRST</span> Rookie Teams
          </p>
        }
        desc={
          <p>
            Get ready to meet the fresh new faces of{" "}
            <span className="italic">FIRST</span> Robotics for {CURR_YEAR}! With
            over{" "}
            <span className="font-bold text-white">{rookieTeams.length}</span>{" "}
            rookie teams joining the competition this year, the excitement is at
            an all-time high. We&apos;re thrilled to highlight these
            up-and-coming teams and give them the recognition they deserve.{" "}
            <br /> <br />
            From the entire <span className="italic">FIRST</span> community,
            welcome!
          </p>
        }
      />

      <div className="w-full pl-4 pr-4 mx-auto md:pr-8 md:pl-8">
        <div className="flex flex-col w-full gap-3 mt-10 sm:grid sm:grid-cols-2 lg:grid-cols-5">
          {Array.isArray(rookieTeams) &&
            rookieTeams.map((team: any, key: number) => {
              return (
                <TeamCard
                  key={key}
                  team={team}
                  avatars={avatars}
                  favourites={user?.favouritedTeams}
                />
              );
            })}
        </div>
      </div>

      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = (await getServerSession(req, res, authOptions)) as Session;

  if (session) {
    const user = await db.user.findUnique({
      where: {
        // @ts-ignore
        id: session.user.id,
      },
      include: {
        favouritedTeams: true,
      },
    });

    return { props: { user } };
  }

  return { props: {} };
};
