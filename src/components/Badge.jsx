import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import process from "node";

const Badge = () => {
  const { badge_id } = useParams();
  const [badgeData, setBadgeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const axiosConfig = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Key": process.env("Api_Key"),
      },
    }),
    []
  );

  const fetchBadgeMetadata = useCallback(
    async (metadataUrl) => {
      try {
        const response = await axios.get(metadataUrl, axiosConfig);
        return response.data;
      } catch (err) {
        console.error("Error fetching badge metadata:", err);
        return null;
      }
    },
    [axiosConfig]
  );

  const fetchBadgeData = useCallback(async () => {
    try {
      const response = await axios.get(
        `https://zopencert.onrender.com/badges/verify/${badge_id}`,
        axiosConfig
      );

      const metadataUrl = response.data?.badge_json?.badge;

      if (metadataUrl) {
        const metadata = await fetchBadgeMetadata(metadataUrl);
        setBadgeData({
          ...response.data,
          metadata: metadata,
        });
      } else {
        setBadgeData(response.data);
      }

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [badge_id, axiosConfig, fetchBadgeMetadata]);

  useEffect(() => {
    if (badge_id) {
      fetchBadgeData();
    }
    return () => {
      setBadgeData(null);
      setLoading(true);
      setError(null);
    };
  }, [badge_id, fetchBadgeData]);

  const generateLink = useCallback(
    ({
      name,
      organizationId = "13764293",
      issueYear,
      issueMonth,
      certUrl,
      certId,
    }) => {
      const baseUrl = "https://www.linkedin.com/profile/add/";
      const params = new URLSearchParams({
        startTask: "CERTIFICATION_NAME",
        name,
        organizationId,
        issueYear,
        issueMonth,
        certUrl,
        certId,
      });
      return `${baseUrl}?${params.toString()}`;
    },
    []
  );

  const linkedInData = useMemo(() => {
    if (!badgeData) return null;

    const issueDate = new Date(badgeData.issued_on);
    return {
      name: badgeData.metadata.name,
      issueYear: issueDate.getFullYear().toString(),
      issueMonth: (issueDate.getMonth() + 1).toString(),
      certUrl: `https://zcertify.zairza.co.in/verify/${badge_id}`,
      certId: badge_id,
    };
  }, [badgeData, badge_id]);

  const handleShare = useCallback(() => {
    if (linkedInData) {
      window.open(generateLink(linkedInData), "_blank");
    }
  }, [generateLink, linkedInData]);

  if (loading) {
    return (
      <div className="bg-[#D9D9D9] w-screen h-screen p-5 flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#D9D9D9] w-screen h-screen p-5 flex items-center justify-center">
        <div className="text-2xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!badgeData) {
    return (
      <div className="bg-[#D9D9D9] w-screen h-screen p-5 flex items-center justify-center">
        <div className="text-2xl">Badge not found</div>
      </div>
    );
  }

  return (
    <div className="bg-[#D9D9D9] h-full md:h-screen md:w-screen p-5">
      <div className="bg-white rounded-2xl w-full h-full">
        <div className="flex flex-col gap-y-10 items-center justify-center p-10">
          <h1 className="font-sans md:text-5xl text-3xl text-yellow-400">
            🎉Congratulations🎉
          </h1>
          <img
            src={
              badgeData?.metadata?.image || "https://placehold.jp/450x450.png"
            }
            alt={badgeData?.metadata?.name || "Badge"}
            className="w-[200px]"
            loading="lazy"
            onError={(e) => {
              e.target.src = "https://placehold.jp/450x450.png";
              e.target.alt = "Failed to load badge image";
            }}
          />
          <h2 className="text-2xl md:text-3xl">
            {badgeData?.metadata.name} Badge
          </h2>
          <button
            type="button"
            onClick={handleShare}
            disabled={!linkedInData}
            className="w-max bg-blue-400 md:text-4xl text-xl p-5 rounded-2xl hover:bg-blue-300 transition delay-75 ease-in-out"
          >
            Share on LinkedIn
          </button>
        </div>
      </div>
    </div>
  );
};

export default Badge;
