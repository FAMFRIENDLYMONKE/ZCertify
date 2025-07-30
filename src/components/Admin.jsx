import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState(null);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Check credentials against environment variables
    if (
      credentials.username === import.meta.env.VITE_ADMIN_USERNAME &&
      credentials.password === import.meta.env.VITE_ADMIN_PASSWORD
    ) {
      setIsAuthenticated(true);
      setLoading(false);
    } else {
      setError("Invalid credentials");
      setLoading(false);
    }
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles) => {
    // Helper function to generate badge ID
    const generateBadgeId = async (row) => {
      try {
        const response = await fetch(
          "https://zopencert.onrender.com/badges/issue",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": import.meta.env.VITE_API_KEY,
            },
            body: JSON.stringify({
              recipient_email: row["Email Address"],
              recipient_name: row["Name"],
              badge_class_url: row["Badge Class"],
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.badge_id;
      } catch (error) {
        console.error("Error generating badge:", error);
        throw error;
      }
    };

    // Helper function to process CSV data
    const processCSVData = async (data) => {
      const processedRows = [];
      for (const row of data) {
        try {
          const badgeId = await generateBadgeId(row);
          // Ensure HTTPS for all URLs
          const badgeClassUrl = row["Badge Class"].replace(/^http:/, "https:");
          processedRows.push({
            ...row,
            "Badge Class": badgeClassUrl,
            badgeUrl: `https://zcertify.zairza.com/badge/${badgeId}`,
          });
        } catch (error) {
          setError(`Error processing row for ${row["Name"]}: ${error.message}`);
          throw error;
        }
      }
      return processedRows;
    };
    setError(null);
    setLoading(true);

    const file = acceptedFiles[0];
    if (file && !file.type.match(/^text\/(csv|plain)$/)) {
      setError("Please upload a CSV file");
      setLoading(false);
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          if (results.errors.length > 0) {
            setError(`Error parsing CSV file: ${results.errors[0].message}`);
            setLoading(false);
            return;
          }

          // Validate CSV structure
          if (!results.data || results.data.length === 0) {
            setError("Invalid CSV format: No data found");
            setLoading(false);
            return;
          }

          const headers = results.meta.fields || [];
          const requiredColumns = ["Badge Class", "Name", "Email Address"];
          const hasRequiredColumns = requiredColumns.every((col) =>
            headers.some(
              (header) =>
                header && header.trim().toLowerCase() === col.toLowerCase()
            )
          );

          if (!hasRequiredColumns) {
            setError(
              "CSV must contain columns: Badge Class, Name, Email Address"
            );
            setLoading(false);
            return;
          }

          // Process the data
          const processedRows = await processCSVData(results.data);

          // Prepare the processed data for download
          const processedCsv = Papa.unparse({
            fields: [...headers, "Badge URL"],
            data: processedRows.map((row) => ({
              ...row,
              "Badge URL": row.badgeUrl,
            })),
          });

          // Create download link
          const blob = new Blob([processedCsv], {
            type: "text/csv;charset=utf-8;",
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", "processed_badges.csv");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setProcessedData({
            totalRecords: processedRows.length,
            badgesCreated: processedRows.length,
          });
          setLoading(false);
        } catch (error) {
          setError(`Error processing CSV: ${error.message}`);
          setLoading(false);
        }
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  // Render login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Admin Login
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <input
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Username"
                  value={credentials.username}
                  onChange={(e) =>
                    setCredentials((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render file upload interface when authenticated
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Badge Management
              </h2>
              <p className="text-gray-600">
                Upload a CSV file containing badge details
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-6">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400"
                }`}
            >
              <input {...getInputProps()} />
              {loading ? (
                <div className="animate-pulse">Processing...</div>
              ) : (
                <div>
                  <p className="text-gray-600">
                    {isDragActive
                      ? "Drop the CSV file here"
                      : "Drag 'n' drop a CSV file here, or click to select one"}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    The CSV should contain: Badge Class URL, Name, Email Address
                  </p>
                </div>
              )}
            </div>

            {processedData && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Processing Results
                </h3>
                <div className="bg-gray-50 rounded p-4">
                  <p>Processed {processedData.totalRecords} records</p>
                  <p>Generated {processedData.badgesCreated} new badges</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("adminToken");
            setIsAuthenticated(false);
          }}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Admin;
