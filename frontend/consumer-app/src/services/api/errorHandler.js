// src/services/api/errorHandler.js

export const errorHandler = {
  normalize(error) {
    if (!error.response) {
      return {
        status: 0,
        message: "Network error: Unable to connect to the GET Solar server.",
        raw: error.message
      };
    }

    const status = error.response.status;
    let message = "A connection error occurred. Please try again.";

    if (status === 400) message = "Invalid parameters provided.";
    else if (status === 401) message = "Session expired. Please sign in again.";
    else if (status === 403) message = "You do not have permissions to access this feature.";
    else if (status === 404) message = "The requested resource was not found.";
    else if (status === 413) message = "The file uploaded is too large (Maximum size is 5MB).";
    else if (status === 415) message = "Unsupported file type. Please upload a PDF, JPG, or PNG.";
    else if (status === 429) message = "GET Solar Copilot is currently experiencing high demand. Please try again in a few moments.";
    else if (status >= 500) message = "An internal server error occurred. Our engineering team has been notified.";

    return {
      status,
      message,
      raw: error.response.data || error.message
    };
  }
};
