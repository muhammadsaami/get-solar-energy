// src/services/api/errorHandler.js

export const errorHandler = {
  normalize(error) {
    if (!error.response) {
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout');
      const isCanceled = error.name === 'CanceledError' || error.message?.toLowerCase().includes('canceled');

      return {
        status: 0,
        message: isTimeout
          ? "Analysis timed out. The server took longer than expected to process the document. Please try again."
          : isCanceled
          ? "Request was canceled."
          : "Network error: Unable to connect to the GET Solar server.",
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
    else if (status === 422) {
      const detail = error.response.data?.detail;
      if (Array.isArray(detail) && detail.length > 0) {
        message = detail.map(d => `${d.loc?.slice(-1)[0] || 'Field'}: ${d.msg}`).join(', ');
      } else if (typeof detail === 'string') {
        message = detail;
      } else {
        message = "Validation error. Please verify form inputs.";
      }
    }
    else if (status === 429) message = "GET Solar Copilot is currently experiencing high demand. Please try again in a few moments.";
    else if (status >= 500) message = "An internal server error occurred. Our engineering team has been notified.";

    return {
      status,
      message,
      raw: error.response.data || error.message
    };
  }
};
