import { useSyncExternalStore } from "react";
import { askCdi } from "./askData.js";

const DAY = 86400000;

const seed = (id, question, ageMs) => {
  const at = Date.now() - ageMs;
  return {
    id,
    title: question,
    createdAt: at,
    updatedAt: at,
    archived: null,
    messages: [
      { id: `${id}-q`, role: "user", text: question, at },
      { id: `${id}-a`, role: "assistant", at: at + 4000, status: "done", ...askCdi(question) },
    ],
  };
};

let state = {
  chats: [
    seed("c-seed-1", "Show the top 5 states by leakage", 3 * 60000),
    seed("c-seed-2", "What is the overall leakage rate for the last 30 days?", DAY + 3600000),
    seed("c-seed-3", "Summarise this week’s memCOT roster checks", 5 * DAY),
  ],
};

const listeners = new Set();

const emit = (next) => {
  state = next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const mapChats = (ids, patch) => state.chats.map((chat) => (ids.includes(chat.id) ? { ...chat, ...patch } : chat));

export const useChatStore = () => useSyncExternalStore(subscribe, () => state);

export const addChat = (chat) => emit({ chats: [chat, ...state.chats] });

export const renameChat = (id, title) => emit({ chats: mapChats([id], { title }) });

export const archiveChats = (ids, reason) => emit({ chats: mapChats(ids, { archived: { at: new Date().toISOString(), reason } }) });

export const restoreChats = (ids) => emit({ chats: mapChats(ids, { archived: null }) });

export const addMessage = (chatId, message) =>
  emit({ chats: state.chats.map((chat) => (chat.id === chatId ? { ...chat, updatedAt: Date.now(), messages: [...chat.messages, message] } : chat)) });

export const patchMessage = (chatId, messageId, patch) =>
  emit({
    chats: state.chats.map((chat) =>
      chat.id === chatId ? { ...chat, messages: chat.messages.map((message) => (message.id === messageId ? { ...message, ...patch } : message)) } : chat
    ),
  });

export const removeMessage = (chatId, messageId) =>
  emit({ chats: state.chats.map((chat) => (chat.id === chatId ? { ...chat, messages: chat.messages.filter((message) => message.id !== messageId) } : chat)) });

export const makeTitle = (question) => (question.length > 60 ? `${question.slice(0, 57)}…` : question);

export const groupOf = (timestamp) => {
  const startOfDay = (value) => new Date(value).setHours(0, 0, 0, 0);
  const days = (startOfDay(Date.now()) - startOfDay(timestamp)) / DAY;
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return days <= 7 ? "Previous 7 days" : "Older";
};

export const GROUPS = ["Today", "Yesterday", "Previous 7 days", "Older"];
