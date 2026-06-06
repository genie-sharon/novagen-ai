"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import type { UIMessage } from "ai";
import type { Components } from "react-markdown";
import type { ComponentPropsWithoutRef } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute right-2 top-2 cursor-pointer rounded-lg bg-white/10 p-1.5 text-white/60 opacity-0 transition-opacity hover:bg-white/20 hover:text-white group-hover/code:opacity-100"
      aria-label="Copy code"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

function getMessageText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function cleanAssistantText(text: string): string {
  return text
    .replace(/\[\d+\]/g, "")
    .replace(/^\s*[.]\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function MessageBubble({
  message,
}: {
  message: UIMessage;
}) {
  const isUser = message.role === "user";
  const content = getMessageText(message);
  const displayContent = isUser ? content : cleanAssistantText(content);

  const renderContent = () => {
    return (
      <div className="prose prose-sm max-w-none text-[#2A1F24] prose-p:text-[#2A1F24] prose-li:text-[#2A1F24] prose-headings:text-[#20161B] prose-strong:text-[#20161B] prose-code:text-[#D63384] prose-a:text-[#C2185B]">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents(isUser)}
        >
          {displayContent}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div
      className={`flex animate-fade-up gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-pink-600 text-sm font-bold text-white shadow-sm">
          N
        </div>
      )}

      <div
        className={`max-w-[90%] rounded-2xl px-5 py-4 leading-relaxed md:max-w-[75%] ${
          isUser
            ? "rounded-br-sm bg-[#EC4899] text-white"
            : "rounded-bl-sm border border-pink-100 bg-white/90 text-[#2A1F24] shadow-sm"
        }`}
      >
        {renderContent()}
      </div>
    </div>
  );
}

type CodeProps = ComponentPropsWithoutRef<"code"> & { className?: string };

type ListProps = ComponentPropsWithoutRef<"ul">;
type OrderedListProps = ComponentPropsWithoutRef<"ol">;
type ParaProps = ComponentPropsWithoutRef<"p">;
type AnchorProps = ComponentPropsWithoutRef<"a">;

function markdownComponents(isUser: boolean): Components {
  return {
    code({ className, children, ...props }: CodeProps) {
      const match = /language-(\w+)/.exec(className || "");
      const isInline = !match;
      const codeText = String(children).replace(/\n$/, "");

      if (isInline) {
        return (
          <code
            className="rounded-md bg-black/10 px-1.5 py-0.5 font-mono text-sm text-[#D63384]"
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <div className="group/code relative my-3">
          {match && (
            <div className="flex items-center justify-between rounded-t-lg bg-[#1C1018] px-4 py-1.5">
              <span className="text-xs text-pink-300">{match[1]}</span>
              <CopyButton text={codeText} />
            </div>
          )}
          <pre
            className={`overflow-x-auto rounded-b-lg bg-[#1C1018] p-4 text-sm leading-relaxed text-pink-100 ${
              !match ? "rounded-t-lg" : ""
            }`}
          >
            <code className="font-mono">{children}</code>
          </pre>
        </div>
      );
    },
    ul({ children }: ListProps) {
      return <ul className="my-1 list-disc space-y-1 pl-5">{children}</ul>;
    },
    ol({ children }: OrderedListProps) {
      return <ol className="my-1 list-decimal space-y-1 pl-5">{children}</ol>;
    },
    p({ children }: ParaProps) {
      return <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>;
    },
    a({ children, href }: AnchorProps) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={
            isUser
              ? "underline decoration-white/50 hover:decoration-white"
              : "text-[#C2185B] underline decoration-pink-300 hover:decoration-pink-500"
          }
        >
          {children}
        </a>
      );
    },
  } as Components;
}
