// User export utilities

/**
 * Export users to CSV format
 * @param {Array} users - Array of user objects
 * @returns {string} CSV content
 */
export function exportUsersToCSV(users) {
  const headers = [
    "ID",
    "Username",
    "Email",
    "Role",
    "Created Date",
    "Last Updated",
    "Investor Name",
    "Investor Status",
  ];

  const csvContent = [
    headers.join(","),
    ...users.map((user) =>
      [
        user.id,
        `"${user.username}"`,
        `"${user.email}"`,
        user.role,
        new Date(user.createdAt).toLocaleDateString(),
        new Date(user.updatedAt).toLocaleDateString(),
        user.investor ? `"${user.investor.name}"` : "",
        user.investor ? user.investor.status : "",
      ].join(",")
    ),
  ].join("\n");

  return csvContent;
}

/**
 * Download CSV file
 * @param {string} content - CSV content
 * @param {string} filename - File name
 */
export function downloadCSV(content, filename = "users-export.csv") {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Export users to JSON format
 * @param {Array} users - Array of user objects
 * @returns {string} JSON content
 */
export function exportUsersToJSON(users) {
  const exportData = {
    exportDate: new Date().toISOString(),
    totalUsers: users.length,
    users: users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      investor: user.investor
        ? {
            id: user.investor.id,
            name: user.investor.name,
            status: user.investor.status,
          }
        : null,
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Download JSON file
 * @param {string} content - JSON content
 * @param {string} filename - File name
 */
export function downloadJSON(content, filename = "users-export.json") {
  const blob = new Blob([content], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
