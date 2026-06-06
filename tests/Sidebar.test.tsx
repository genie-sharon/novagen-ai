import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Sidebar from "@/components/Sidebar";
import type { Thread } from "@/lib/types";

const mockPush = vi.fn();
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(),
    })),
    select: vi.fn(() => ({
      eq: vi.fn(),
    })),
  })),
  storage: {
    from: vi.fn(() => ({
      remove: vi.fn(),
    })),
  },
  auth: {
    signOut: vi.fn(),
  },
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ threadId: "thread-1" }),
  useRouter: () => ({ push: mockPush }),
}));

const sampleThreads: Thread[] = [
  {
    id: "thread-1",
    user_id: "user-1",
    title: "Chat about NovaGen",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    document_count: 0,
  },
  {
    id: "thread-2",
    user_id: "user-1",
    title: "Document Q&A",
    created_at: new Date().toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    document_count: 2,
  },
];

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays NovaGen branding", () => {
    render(
      <Sidebar initialThreads={sampleThreads} userId="user-1" userEmail="test@example.com" />
    );
    expect(screen.getByText("NovaGen")).toBeInTheDocument();
  });

  it("renders thread titles", () => {
    render(
      <Sidebar initialThreads={sampleThreads} userId="user-1" userEmail="test@example.com" />
    );
    expect(screen.getByText("Chat about NovaGen")).toBeInTheDocument();
    expect(screen.getByText("Document Q&A")).toBeInTheDocument();
  });

  it("shows active thread with active styles", () => {
    render(
      <Sidebar initialThreads={sampleThreads} userId="user-1" userEmail="test@example.com" />
    );
    // thread-1 is active based on useParams mock
    const activeThreadEl = screen.getByText("Chat about NovaGen").closest('[role="button"]');
    expect(activeThreadEl?.className).toContain("bg-pink-100");
  });

  it("has new-thread button", () => {
    render(
      <Sidebar initialThreads={sampleThreads} userId="user-1" userEmail="test@example.com" />
    );
    expect(screen.getByText("New Chat")).toBeInTheDocument();
  });

  it("has logout button", () => {
    render(
      <Sidebar initialThreads={sampleThreads} userId="user-1" userEmail="test@example.com" />
    );
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("displays user email initial", () => {
    render(
      <Sidebar initialThreads={sampleThreads} userId="user-1" userEmail="test@example.com" />
    );
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("shows document indicator for threads with documents", () => {
    render(
      <Sidebar initialThreads={sampleThreads} userId="user-1" userEmail="test@example.com" />
    );
    // thread-2 has document_count: 2 - rendered as title attribute on the emoji span
    expect(screen.getByTitle("2 document(s)")).toBeInTheDocument();
  });
});
