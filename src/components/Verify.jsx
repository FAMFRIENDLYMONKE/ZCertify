import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const Verify = () => {
  const { badge_id } = useParams();
  const [badgeData, setBadgeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const axiosConfig = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
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
        `http://127.0.0.1:8000/badges/verify/${badge_id}`,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Verifying badge...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Verification Failed
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!badgeData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-yellow-600 mb-2">
            Badge Not Found
          </h2>
          <p className="text-gray-600">
            The requested badge could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Badge Verified
            </h2>
            <p className="text-gray-600">
              This badge is authentic and was issued by{" "}
              <a href="https://www.zairza.co.in">Zairza</a>
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-48 h-48 flex-shrink-0">
              <img
                src={
                  badgeData?.metadata?.image ||
                  "https://placehold.jp/450x450.png"
                }
                alt={badgeData?.metadata?.name || "Badge"}
                className="w-full h-full object-contain"
                loading="lazy"
                onError={(e) => {
                  e.target.src = "https://placehold.jp/450x450.png";
                  e.target.alt = "Failed to load badge image";
                }}
              />
            </div>

            <div className="flex-grow">
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Badge Name
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {badgeData?.metadata?.name || badgeData?.name || "N/A"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Recipient
                  </dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    <span className="flex items-center gap-2">
                      {badgeData?.recipient_name || "N/A"}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Issue Date
                  </dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    {badgeData?.issued_on
                      ? new Date(badgeData.issued_on).toLocaleDateString()
                      : "N/A"}
                  </dd>
                </div>

                {badgeData?.metadata?.description && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Description
                    </dt>
                    <dd className="mt-1 text-lg text-gray-900">
                      {badgeData.metadata.description}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Badge ID: <span className="font-mono">{badge_id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify;
