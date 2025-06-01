// src/components/AiAgentApp.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import userEvent from "@testing-library/user-event";
import AIAgentApp from "@/features/ai-data-analyst/components/AiAgentApp";
import * as Api from "@/lib/Api"; // To mock its functions
import { initialAppState, type PromptResponse } from "@/types/appTypes";

// Mock the API module
vi.mock("@/lib/Api", async (importOriginal) => {
  const actual = await importOriginal<typeof Api>();
  return {
    ...actual,
    handleFileUpload: vi.fn(),
    handleSendPromptRequest: vi.fn(),
  };
});

// Mock sonner's toast
vi.mock("sonner", () => {
  return {
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      message: vi.fn(),
      info: vi.fn(),
      loading: vi.fn(),
      promise: vi.fn(),
      custom: vi.fn(),
      dismiss: vi.fn(),
    },
    Toaster: () => <div data-testid="toaster" />, // Mocked Toaster component
  };
});

// Mock DataChart component
vi.mock("@/features/ai-data-analyst/components/DataChart", () => ({
  __esModule: true,
  default: ({ chartData }: { chartData: any }) => (
    <div data-testid="data-chart">
      Mocked DataChart with data: {JSON.stringify(chartData)}
    </div>
  ),
}));

describe("AIAgentApp Component", () => {
  let mockHandleFileUpload: vi.Mock;
  let mockHandleSendPromptRequest: vi.Mock;
  // Remove mockToastError and mockToastSuccess from here, will use toast.error directly

  beforeEach(() => {
    // Reset mocks and state before each test
    vi.resetAllMocks();
    mockHandleFileUpload = Api.handleFileUpload as vi.Mock;
    mockHandleSendPromptRequest = Api.handleSendPromptRequest as vi.Mock;

    // Reset initial app state if necessary, though component does this internally
  });

  const renderComponent = () => render(<AIAgentApp />);

  it("should render initial state correctly", () => {
    renderComponent();
    expect(screen.getByText("AI Data Analyst Tool")).toBeInTheDocument();
    // Use getByRole for headings to be more specific
    expect(
      screen.getByRole("heading", { name: /Upload CSV File/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Send Prompt/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Upload CSV/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send Prompt/i })).toBeDisabled(); // No prompt initially
  });

  describe("File Upload", () => {
    const testFile = new File(["col1,col2\nval1,val2"], "test.csv", {
      type: "text/csv",
    });

    it("should allow file selection and enable upload button", async () => {
      renderComponent();
      // Target the visible button first, then the actual hidden input for userEvent.upload
      const chooseFileButton = screen.getByRole("button", {
        name: /Click to choose file/i,
      });
      expect(chooseFileButton).toBeInTheDocument();

      const hiddenFileInput = screen.getByLabelText(
        "Upload CSV File",
      ) as HTMLInputElement;
      await userEvent.upload(hiddenFileInput, testFile);

      expect(hiddenFileInput.files?.[0]).toBe(testFile);
      expect(hiddenFileInput.files?.length).toBe(1);
      expect(screen.getByRole("button", { name: /Upload CSV/i })).toBeEnabled();
    });

    it("should call handleFileUpload and show success on successful upload", async () => {
      mockHandleFileUpload.mockResolvedValueOnce({
        access_token: "fake_token",
        token_type: "bearer",
      });
      renderComponent();

      const hiddenFileInput = screen.getByLabelText(
        "Upload CSV File",
      ) as HTMLInputElement;
      await userEvent.upload(hiddenFileInput, testFile);

      const uploadButton = screen.getByRole("button", { name: /Upload CSV/i });
      fireEvent.click(uploadButton);

      expect(uploadButton).toBeDisabled(); // Shows loading
      await waitFor(() =>
        expect(uploadButton).toHaveTextContent(/Processing.../i),
      );

      await waitFor(() =>
        expect(mockHandleFileUpload).toHaveBeenCalledWith(
          testFile,
          "upload-csv",
        ),
      );
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          "CSV uploaded successfully! You can now send a prompt.",
        ),
      );
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: /File Uploaded/i }),
        ).toBeInTheDocument(),
      );
      // The prompt button should now be disabled because the prompt text is empty
      expect(
        screen.getByRole("button", { name: /Send Prompt/i }),
      ).toBeDisabled();
    });

    it("should have Upload CSV button disabled if no file is selected", () => {
      renderComponent();
      const uploadButton = screen.getByRole("button", { name: /Upload CSV/i });
      expect(uploadButton).toBeDisabled();
      // toast.error should not be called because the button click is prevented
      expect(toast.error).not.toHaveBeenCalled();
      expect(mockHandleFileUpload).not.toHaveBeenCalled();
    });

    it("should handle file upload failure", async () => {
      mockHandleFileUpload.mockRejectedValueOnce(
        new Error("Upload failed miserably"),
      );
      renderComponent();

      const hiddenFileInput = screen.getByLabelText(
        "Upload CSV File",
      ) as HTMLInputElement;
      await userEvent.upload(hiddenFileInput, testFile);

      const uploadButton = screen.getByRole("button", { name: /Upload CSV/i });
      fireEvent.click(uploadButton);

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          "Error uploading CSV: Upload failed miserably",
        ),
      );
      expect(screen.getByRole("button", { name: /Upload CSV/i })).toBeEnabled(); // Re-enabled after error
    });
  });

  describe("Send Prompt", () => {
    const testFile = new File(["col1,col2\nval1,val2"], "test.csv", {
      type: "text/csv",
    });
    const promptText = "Analyze this data.";
    const mockToken = "fake_token";

    // Helper to simulate file upload and get token
    const simulateFileUpload = async () => {
      mockHandleFileUpload.mockResolvedValueOnce({
        access_token: mockToken,
        token_type: "bearer",
      });
      const hiddenFileInput = screen.getByLabelText(
        "Upload CSV File",
      ) as HTMLInputElement;
      await userEvent.upload(hiddenFileInput, testFile);
      fireEvent.click(screen.getByRole("button", { name: /Upload CSV/i }));
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: /File Uploaded/i }),
        ).toBeInTheDocument(),
      );
    };

    it("should enable send prompt button when prompt is entered and token exists", async () => {
      renderComponent();
      await simulateFileUpload(); // Sets up the token

      const promptTextarea = screen.getByPlaceholderText(
        /Enter your prompt here.../i,
      );
      await userEvent.type(promptTextarea, promptText);

      expect(
        screen.getByRole("button", { name: /Send Prompt/i }),
      ).toBeEnabled();
    });

    it("should call handleSendPromptRequest and display result on success", async () => {
      const mockApiResponse: PromptResponse = {
        data: { chartType: "line", data: [{ x: 1, y: 2 }] },
        text: "Analysis complete",
      };
      mockHandleSendPromptRequest.mockResolvedValueOnce(mockApiResponse);

      renderComponent();
      await simulateFileUpload();

      const promptTextarea = screen.getByPlaceholderText(
        /Enter your prompt here.../i,
      );
      await userEvent.type(promptTextarea, promptText);

      const sendButton = screen.getByRole("button", { name: /Send Prompt/i });
      fireEvent.click(sendButton);

      expect(sendButton).toBeDisabled(); // Shows loading
      await waitFor(() =>
        expect(sendButton).toHaveTextContent(/Processing.../i),
      );

      await waitFor(() =>
        expect(mockHandleSendPromptRequest).toHaveBeenCalledWith(
          promptText,
          mockToken,
        ),
      );
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          "Prompt processed successfully!",
        ),
      );
      await waitFor(() =>
        expect(screen.getByText("Result")).toBeInTheDocument(),
      );
      await waitFor(() =>
        expect(screen.getByText("Analysis complete")).toBeInTheDocument(),
      ); // resultText
      await waitFor(() =>
        expect(screen.getByTestId("data-chart")).toBeInTheDocument(),
      ); // DataChart is rendered
    });

    it("should display raw JSON result if no chartType or data for chart", async () => {
      const mockApiResponse: PromptResponse = {
        data: { message: "This is a text result" },
        text: "Analysis complete (text only)",
      };
      mockHandleSendPromptRequest.mockResolvedValueOnce(mockApiResponse);

      renderComponent();
      await simulateFileUpload();

      const promptTextarea = screen.getByPlaceholderText(
        /Enter your prompt here.../i,
      );
      await userEvent.type(promptTextarea, promptText);
      fireEvent.click(screen.getByRole("button", { name: /Send Prompt/i }));

      await waitFor(() =>
        expect(screen.getByText("Result")).toBeInTheDocument(),
      );
      const expectedJson = JSON.stringify(mockApiResponse.data, null, 2);

      await waitFor(async () => {
        const resultPre = await screen.findByTestId("json-result");
        expect(resultPre).toBeInTheDocument();
        // Check if the textContent, when parsed as JSON, matches the expected object
        expect(JSON.parse(resultPre.textContent || "")).toEqual(
          mockApiResponse.data,
        );
      });
    });

    it("should have Send Prompt button disabled if prompt is empty (after file upload)", async () => {
      renderComponent();
      await simulateFileUpload(); // Token is present, but prompt is empty

      const sendButton = screen.getByRole("button", { name: /Send Prompt/i });
      expect(sendButton).toBeDisabled();
      // toast.error should not be called because the button click is prevented
      expect(toast.error).not.toHaveBeenCalled();
      expect(mockHandleSendPromptRequest).not.toHaveBeenCalled();
    });

    it("should show error if access token is missing", async () => {
      renderComponent();
      // Do NOT simulate file upload, so no token

      const promptTextarea = screen.getByPlaceholderText(
        /Enter your prompt here.../i,
      );
      await userEvent.type(promptTextarea, promptText);

      const sendButton = screen.getByRole("button", { name: /Send Prompt/i });
      fireEvent.click(sendButton);

      expect(toast.error).toHaveBeenCalledWith(
        "Please upload a CSV file first to obtain an access token.",
      );
      expect(mockHandleSendPromptRequest).not.toHaveBeenCalled();
    });

    it("should handle send prompt failure", async () => {
      mockHandleSendPromptRequest.mockRejectedValueOnce(
        new Error("Prompt failed spectacularly"),
      );
      renderComponent();
      await simulateFileUpload();

      const promptTextarea = screen.getByPlaceholderText(
        /Enter your prompt here.../i,
      );
      await userEvent.type(promptTextarea, promptText);

      const sendButton = screen.getByRole("button", { name: /Send Prompt/i });
      fireEvent.click(sendButton);

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          "Error sending prompt: Prompt failed spectacularly",
        ),
      );
      expect(
        screen.getByRole("button", { name: /Send Prompt/i }),
      ).toBeEnabled(); // Re-enabled
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(
        screen.getByText("Prompt failed spectacularly"),
      ).toBeInTheDocument();
    });
  });
});
