import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthForm from "@/components/AuthForm";
import toast from "react-hot-toast";

const mockPush = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AuthForm - login mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form", () => {
    render(<AuthForm mode="login" />);
    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);
    const emailInput = screen.getByLabelText("Email");
    expect(emailInput).toBeRequired();
    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toBeRequired();
  });

  it("calls signIn on submit and redirects to chat", async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({ error: null });

    render(<AuthForm mode="login" />);
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
    expect(toast.success).toHaveBeenCalledWith("Welcome back!");
    expect(mockPush).toHaveBeenCalledWith("/chat");
  });

  it("displays Supabase error on login failure", async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({
      error: new Error("Invalid login credentials"),
    });

    render(<AuthForm mode="login" />);
    await user.type(screen.getByLabelText("Email"), "bad@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(toast.error).toHaveBeenCalledWith("Invalid login credentials");
  });
});

describe("AuthForm - signup mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders signup form with confirm password", () => {
    render(<AuthForm mode="signup" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("validates password match", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "different");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(toast.error).toHaveBeenCalledWith("Passwords do not match");
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("calls signUp on valid submit", async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({ error: null });

    render(<AuthForm mode="signup" />);
    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "password123",
    });
    expect(toast.success).toHaveBeenCalledWith(
      "Check your email to confirm your account!"
    );
  });
});
