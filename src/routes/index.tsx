import { createFileRoute } from "@tanstack/react-router";
import { ChatView } from "@/components/chat/ChatView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chat — Atlas" },
      { name: "description", content: "Talk with your personal AI assistant and get structured answers." },
      { property: "og:title", content: "Chat — Atlas" },
      { property: "og:description", content: "Talk with your personal AI assistant and get structured answers." },
    ],
  }),
  component: ChatView,
});
