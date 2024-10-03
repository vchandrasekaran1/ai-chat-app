# AI Chat Website

This is an AI-powered chat application built with Next.js, React, and OpenAI's GPT-4 model. It provides a user-friendly interface for having conversations with an AI assistant.

## Features

- Real-time chat interface
- Multiple chat sessions
- Sidebar for managing chats
- Responsive design
- Markdown support for messages

## Technologies Used

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- OpenAI API (GPT-4)
- AI SDK

## API Usage

This project uses the OpenAI API to generate responses.


Make sure to set up your OpenAI API key in your environment variables.

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/your-username/ai-chat-website.git
   cd ai-chat-website
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Building for Production

To create a production build, run:

npm run build

Then, to start the production server:

npm start