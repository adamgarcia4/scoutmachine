import { CURR_YEAR } from "@/lib/constants";
import { convertDate } from "@/utils/date";
import Link from "next/link";
import { Search } from "../Search";
import { ReactNode, useEffect, useState } from "react";
import haversine from "haversine-distance";
import { FaCrosshairs, FaFire, FaGlobe, FaMapMarkerAlt } from "react-icons/fa";
import { getGeoData } from "@/utils/geo";

const Event = (props: any) => {
  return (
    <Link href={`/events/${props.event.key}`} legacyBehavior>
      <a>
        <div
          className={`border border-[#2A2A2A] bg-card hover:border-gray-600 px-5 py-5 h-40 rounded-lg relative w-full`}
        >
          <h1 className="font-bold text-xl text-white text-left">
            {props.event.name.length > 49
              ? `${props.event.name.slice(0, 49)}...`
              : props.event.name}
          </h1>
          <p className="text-lightGray">
            {convertDate(props.event.start_date)} -{" "}
            {convertDate(props.event.end_date)}, {CURR_YEAR}
          </p>
          <h2 className="text-lightGray absolute bottom-3 left-5 md:text-left text-left">
            📌 {props.event.city}, {props.event.state_prov},{" "}
            {props.event.country} <br />
            {!props.invalidNavigation &&
              !isNaN(props.eventDistances[props.event.event_code]) && (
                <p className="text-sm">
                  <span className="text-gray-400 font-medium">
                    {String(
                      Math.trunc(props.eventDistances[props.event.event_code])
                    ).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    km
                  </span>{" "}
                  away
                </p>
              )}
          </h2>
        </div>
      </a>
    </Link>
  );
};

export const EventsScreen = (props: any) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [showNearbyEvents, setShowNearbyEvents] = useState(false);
  const [nearbyRange, setNearbyRange] = useState<string | number>(350);
  const [invalidNavigation, setInvalidNavigation] = useState(false);
  const [eventDistances, setEventDistances] = useState({});
  const [address, setAddress] = useState("");
  const [filterByAddress, setFilterByAddress] = useState(false);
  const today = new Date();
  const newToday = today.toISOString().split("T")[0];

  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (nearbyRange === "") {
      setNearbyRange(350);
    }

    const fetchGeoData = async () => {
      const data = await getGeoData(address);
      return data;
    };

    if (filterByAddress) {
      fetchGeoData()
        .then((data) => {
          const lat = Number(data?.lat);
          const lng = Number(data?.lng);
          const eventDistances: any = {};

          const nearbyEvents = props.events.filter((event: any) => {
            const distance =
              haversine(
                { lat: event.lat, lng: event.lng },
                {
                  lat,
                  lng,
                }
              ) / 1000; // convert to km

            eventDistances[event.event_code] = distance;
            return distance <= Number(nearbyRange); // events within x km range
          });

          setNearbyEvents(nearbyEvents);
          setEventDistances(eventDistances);
        })
        .then(() => setFilterByAddress(false));
    } else if (address === "") {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") {
          navigator.geolocation.getCurrentPosition((position) => {
            const eventDistances: any = {};

            const nearbyEvents = props.events.filter((event: any) => {
              const distance =
                haversine(
                  { lat: event.lat, lng: event.lng },
                  {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                  }
                ) / 1000; // convert to km

              eventDistances[event.event_code] = distance;
              return distance <= Number(nearbyRange); // events within x km range
            });

            setNearbyEvents(nearbyEvents);
            setEventDistances(eventDistances);
          });
        } else {
          setInvalidNavigation(true);
        }
      });
    }
  }, [props.events, nearbyRange, filterByAddress, address]);

  const renderEventsSection = (
    filterCondition: any,
    title: string | ReactNode
  ) => (
    <div className="max-w-screen-3xl w-full">
      <h1 className="text-lightGray mt-10 mb-5 flex">
        <h1 className="font-bold text-white text-2xl">{title}</h1>

        <span className="border border-[#2A2A2A] text-lightGray text-xl px-2 mt-[-1px] ml-1 rounded-full font-semibold">
          {props.events.filter(filterCondition).length}{" "}
          {props.events.filter(filterCondition).length === 1
            ? "event"
            : "events"}
        </span>
      </h1>
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        {props.events.filter(filterCondition).length > 0 ? (
          props.events
            .filter(filterCondition)
            .map((event: any, key: number) => {
              return (
                <Event
                  key={key}
                  event={event}
                  eventDistances={eventDistances}
                  invalidNavigation={invalidNavigation}
                />
              );
            })
        ) : (
          <p className="text-lightGray whitespace-nowrap">
            Uh oh, looks like there were no events found.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="pr-4 pl-4 md:pl-8 md:pr-8 max-w-screen-3xl w-full">
      <div className="flex flex-wrap gap-x-3">
        <button
          onClick={() => setShowNearbyEvents(!showNearbyEvents)}
          className="flex text-sm mt-5 bg-card border border-[#2A2A2A] hover:border-gray-600 text-lightGray hover:text-white transition-all duration-150 rounded-lg px-3 py-2"
        >
          {!showNearbyEvents && <FaCrosshairs className="text-lg mr-2" />}{" "}
          {showNearbyEvents ? "Show All Events" : "Search Nearby"}
        </button>

        {showNearbyEvents ? (
          <>
            <Search
              placeholder="City / Zip Code / Address"
              onChange={(e: any) => setAddress(e.target.value)}
              icon={<FaMapMarkerAlt className="text-sm text-lightGray" />}
            />
            <Search
              placeholder="Radius (in km)"
              onChange={(e: any) => setNearbyRange(e.target.value)}
              icon={<FaGlobe className="text-sm text-lightGray" />}
            />
            {address && (
              <button
                onClick={() => setFilterByAddress(true)}
                className="flex text-sm mt-5 bg-card border border-[#2A2A2A] hover:border-gray-600 text-lightGray hover:text-white transition-all duration-150 rounded-lg px-3 py-2"
              >
                Search
              </button>
            )}
          </>
        ) : (
          <Search
            placeholder="Search all events..."
            onChange={(e: any) => setSearchQuery(e.target.value)}
          />
        )}
      </div>

      {searchQuery &&
        renderEventsSection(
          (event: any) =>
            (
              event.name +
              event.location_name +
              event.city +
              event.country +
              event.district?.abbreviation
            )
              .toLowerCase()
              .includes(searchQuery.toLowerCase()),
          <p>
            Searching Events{" "}
            <span className="text-lightGray">({searchQuery})</span>
          </p>
        )}

      {showNearbyEvents &&
        renderEventsSection(
          (event: any) =>
            nearbyEvents.some(
              (nearbyEvent: any) => nearbyEvent.name === event.name
            ),
          <p>
            Nearby <span className="text-lightGray">({nearbyRange}km)</span>
          </p>
        )}

      {!showNearbyEvents && !searchQuery && (
        <div>
          {renderEventsSection(
            (event: any) => newToday <= event.end_date,
            "Upcoming"
          )}
          {renderEventsSection(
            (event: any) => event.event_type_string === "Preseason",
            "Preseason"
          )}

          {renderEventsSection((event: any) => event.week === 0, "Week 1")}
          {renderEventsSection((event: any) => event.week === 1, "Week 2")}
          {renderEventsSection((event: any) => event.week === 2, "Week 3")}
          {renderEventsSection((event: any) => event.week === 3, "Week 4")}
          {renderEventsSection((event: any) => event.week === 4, "Week 5")}
          {renderEventsSection((event: any) => event.week === 5, "Week 6")}

          {renderEventsSection(
            (event: any) => event.event_type_string === "Championship Division",
            "FIRST Championship - Houston, TX"
          )}
          {renderEventsSection(
            (event: any) => event.event_type_string === "Offseason",
            "Offseason"
          )}
        </div>
      )}
    </div>
  );
};
