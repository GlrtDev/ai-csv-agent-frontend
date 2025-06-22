// src/lib/Api.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleFileUpload, handleSendPromptRequest } from "./Api";
import { type PromptResponse } from "@/types/appTypes";

// Mock global fetch
global.fetch = vi.fn();

describe("Api functions", () => {
  beforeEach(() => {
    vi.resetAllMocks(); // Reset mocks before each test
  });

  describe("handleFileUpload", () => {
    const mockFile = new File(["dummy content"], "test.csv", {
      type: "text/csv",
    });

    it("should upload a file successfully and return access token", async () => {
      const mockResponse = { access_token: "test_token", token_type: "bearer" };
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await handleFileUpload(mockFile, "upload-csv");
      expect(fetch).toHaveBeenCalledWith("http://localhost:8000/upload-csv/", {
        method: "POST",
        body: expect.any(FormData),
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw an error if file upload fails with error detail", async () => {
      const errorResponse = { detail: "Upload failed" };
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse,
      });

      await expect(handleFileUpload(mockFile, "upload-csv")).rejects.toThrow(
        "Upload failed",
      );
    });

    it("should throw a generic error if file upload fails without error detail", async () => {
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}), // No detail in error response
      });

      await expect(handleFileUpload(mockFile, "upload-csv")).rejects.toThrow(
        "Failed to upload CSV to upload-csv.",
      );
    });
    it("should throw an error if response is not ok and json parsing fails", async () => {
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error("JSON parse error");
        }, // Simulate JSON parsing error
        text: async () => "Server error text", // Fallback text
      });

      // This scenario in the original code would lead to "Failed to upload CSV to upload-csv"
      // because if response.json() fails, it falls through to the generic error.
      // To specifically test the re-throw of a json error is not directly possible with the current code structure of handleFileUpload
      // as it doesn't try-catch the response.json() call.
      // However, we can test the generic error message is thrown.
      await expect(handleFileUpload(mockFile, "upload-csv")).rejects.toThrow(
        "Failed to upload CSV to upload-csv.",
      );
    });
  });

  describe("handleSendPromptRequest", () => {
    const mockPrompt = "Test prompt";
    const mockToken = "test_token";

    it("should send a prompt successfully and return data", async () => {
      const mockApiResponse: PromptResponse = {
        chart_data: { chartType: "bar", data: [{ label: "A", value: 10 }] },
        summary: "Success summary text",
      };
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = await handleSendPromptRequest(mockPrompt, mockToken);
      expect(fetch).toHaveBeenCalledWith("http://localhost:8000/send-prompt/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ prompt: mockPrompt }),
      });
      expect(result).toEqual(mockApiResponse);
    });

    it("should throw an error if token is missing", async () => {
      await expect(handleSendPromptRequest(mockPrompt, null)).rejects.toThrow(
        "Authentication token is missing.",
      );
    });

    it("should throw an error if sending prompt fails with detail", async () => {
      const errorResponse = { detail: "Prompt processing failed" };
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse,
      });

      await expect(
        handleSendPromptRequest(mockPrompt, mockToken),
      ).rejects.toThrow("API Error: Prompt processing failed");
    });

    it("should throw an error if sending prompt fails with string error", async () => {
      const errorResponse = "A simple string error";
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse, // Server returns a plain string
      });

      await expect(
        handleSendPromptRequest(mockPrompt, mockToken),
      ).rejects.toThrow("API Error: A simple string error");
    });

    it("should throw a generic error if sending prompt fails without specific error detail", async () => {
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}), // No detail in error response
        status: 500,
      });

      await expect(
        handleSendPromptRequest(mockPrompt, mockToken),
      ).rejects.toThrow("Failed to send prompt. Status: 500");
    });

    it("should throw an error if server responds with non-JSON error", async () => {
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error("Cannot parse JSON");
        }, // Simulate error during response.json()
        status: 502,
        statusText: "Bad Gateway",
      });

      await expect(
        handleSendPromptRequest(mockPrompt, mockToken),
      ).rejects.toThrow("Server responded with status 502: Bad Gateway");
    });

    it("should throw an error if response data is missing expected fields", async () => {
      const incompleteResponse = { someOtherData: "data" }; // Missing 'chart_data' and 'summary'
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => incompleteResponse,
      });

      await expect(
        handleSendPromptRequest(mockPrompt, mockToken),
      ).rejects.toThrow(
        'Unexpected response format from the server. Missing "chart_data" and/or "summary" fields.',
      );
    });
  });
});
