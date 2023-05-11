/* eslint-disable @next/next/no-img-element */
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Loading } from "@/components/Loading";
import { Navbar } from "@/components/navbar";
import { API_URL, CURR_YEAR } from "@/lib/constants";
import { getStorage, setStorage } from "@/utils/localStorage";
import Link from "next/link";
import { useEffect, useState } from "react";

async function fetchInsightsData() {
  const insightsData = getStorage(`insights_${CURR_YEAR}`);
  if (insightsData) return insightsData;

  const fetchInsights = await fetch(`${API_URL}/api/insights`).then((res) =>
    res.json()
  );

  setStorage(`insights_${CURR_YEAR}`, fetchInsights);
  return insightsData;
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<any>();
  const [avatars, setAvatars] = useState();

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchInsightsData();
      setInsights(data);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (insights) {
      const fetchAvatars = async () => {
        const teamAvatars: any = {};

        await Promise.all(
          insights.top.map(async (team: any) => {
            const data = await fetch(
              `${API_URL}/api/team/avatar?team=${team.teamNumber}`
            ).then((res) => res.json());

            try {
              teamAvatars[team.teamNumber] = data.avatar;
            } catch {
              teamAvatars[team.teamNumber] = null;
            }
          })
        );

        setAvatars(teamAvatars);
      };

      fetchAvatars();
    }
  }, [insights]);

  if (!insights || !avatars) return <Loading />;

  console.log(avatars[118]);

  return (
    <>
      <Navbar />
      <Header
        title="Insights"
        desc={`An overview of insights on the ${CURR_YEAR} Season`}
      />

      <div className="pr-4 pl-4 md:pr-8 md:pl-8 max-w-screen-3xl w-full">
        <h1 className="font-bold text-2xl mt-5">
          Top Performing Teams{" "}
          <span className="text-lightGray text-sm font-medium">
            (per district)
          </span>
        </h1>
        <div className="mt-3 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {insights.top.map((team: any, key: number) => {
            return (
              <div
                key={key}
                className="rounded-lg bg-card py-10 px-10 hover:border-gray-600"
              >
                <Link href={`/teams/${team.teamNumber}`} className="flex mb-1">
                  <img
                    src={`data:image/jpeg;base64,${avatars[team.teamNumber]}`}
                    alt={`${team.teamNumber} Avatar`}
                    className="rounded-full h-8 w-8 mr-2"
                  />
                  <h1 className="text-2xl font-bold">Team {team.teamNumber}</h1>
                </Link>
                <p className="text-lightGray">
                  #1 in the{" "}
                  <span className="text-white">
                    {team.districtCode} District
                  </span>{" "}
                  scoring a total of {team.totalPoints} Ranking Points. <br />{" "}
                  <br />
                  {team.teamNumber} has scored a total of{" "}
                  {team.event1Points + team.event2Points} points at their 2
                  competitions. In{" "}
                  <Link
                    href={`/events/2023${team.event1Code.toLowerCase()}`}
                    className="text-white"
                  >
                    {team.event1Code}
                  </Link>
                  , scoring {team.event1Points} points, and in{" "}
                  <Link
                    href={`/events/2023${team.event2Code.toLowerCase()}`}
                    className="text-white"
                  >
                    {team.event2Code}
                  </Link>
                  , scoring {team.event2Points} points.
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <Footer />
    </>
  );
}
