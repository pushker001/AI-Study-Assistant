# 🧠 AI Study Assistant — Chat with Your PDFs  
### Upload • Understand • Learn

> An intelligent AI web application that lets you upload PDFs and chat with their content — powered by **Cohere embeddings**, **Gemini AI**, **PDF.co**, and **Supabase vector search**.

---

## 🚀 Overview

**AI Study Assistant** (also known as **Chat with PDFs**) is a full-stack AI project that allows users to upload a PDF, process its content, and ask natural-language questions about it.

When a user uploads a PDF:
1. The text is extracted using the **PDF.co API**.  
2. The content is split into smaller, manageable chunks.  
3. Each chunk is converted into an **embedding** using **Cohere’s embedding model**.  
4. The embeddings and text are stored in a **Supabase** vector database.  
5. When the user asks a question, the app retrieves relevant chunks and sends them to **Gemini AI** to generate an accurate, context-aware answer.

This follows a **Retrieval-Augmented Generation (RAG)** pipeline — meaning your chatbot answers directly from your uploaded PDFs, not from random AI knowledge.

---

## 🧩 Features

✅ Upload and process any PDF  
✅ Extract text using **PDF.co API**  
✅ Generate embeddings via **Cohere API**  
✅ Store embeddings efficiently in **Supabase**  
✅ Chat with your uploaded document using **Gemini AI**  
✅ Contextual, accurate, and real-time answers  

---

## 🏗️ Architecture

```text
                ┌──────────────────────────┐
                │        Frontend (UI)     │
                │  Next.js + Tailwind CSS  │
                │  ─────────────────────── │
                │  • PDF Upload Form       │
                │  • Chat Interface        │
                └─────────────┬────────────┘
                              │
                              ▼
                ┌──────────────────────────┐
                │        API Routes        │
                │  (Next.js App Router)    │
                │  • /api/upload → Extract, Embed, Store │
                │  • /api/chat → Retrieve, Answer        │
                └─────────────┬────────────┘
                              │
                              ▼
                ┌──────────────────────────┐
                │       Supabase DB        │
                │ (Vector Storage & Search)│
                │   • Stores embeddings    │
                │   • Performs similarity  │
                └─────────────┬────────────┘
                              │
                              ▼
                ┌──────────────────────────┐
                │        AI Models         │
                │ ──────────────────────── │
                │ • Cohere Embeddings (v3) │
                │ • Gemini 1.5 Flash (LLM) │
                └──────────────────────────┘



