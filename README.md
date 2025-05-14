# StudyBuddy - AI-Powered Learning Assistant

StudyBuddy is an advanced AI-powered learning assistant built with Next.js and Google's Gemini 2.5 Pro API. It helps students learn more effectively by providing intelligent chat assistance, document processing (including handwritten notes), and LaTeX support for mathematical content.

## Features

- **Intelligent Chat Interface**: Get answers to academic questions using Gemini 2.5 Pro AI
- **Document Processing**: Upload and extract text from images, including handwritten notes
- **LaTeX Support**: Properly render mathematical equations and formulas
- **User Authentication**: Secure login with credentials or Google OAuth
- **Mobile Responsive**: Works well on all device sizes
- **History Tracking**: Save and review previous chat sessions
- **Voice Input**: Ask questions using voice recognition (on supported browsers)

## Tech Stack

- **Frontend**: Next.js 14+, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **AI**: Google Gemini 2.5 Pro API
- **OCR**: Tesseract.js for text extraction
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js v4
- **UI Components**: NextUI
- **Markdown Rendering**: React Markdown with KaTeX for math expressions

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB database (local or Atlas)
- Google Gemini API key
- (Optional) Google OAuth credentials for authentication

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Rishiraj1729/Study-Buddy.git
   cd study-buddy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file based on `.env.local.example`:
   ```bash
   cp .env.local.example .env.local
   ```

4. Fill in the environment variables in `.env.local`:
   - `MONGODB_URI`: Your MongoDB connection string
   - `GEMINI_API_KEY`: Your Google Gemini API key (get from [AI Studio](https://aistudio.google.com/app/apikey))
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Your application URL (http://localhost:3000 for development)
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: (Optional) From Google Cloud Console

5. Create the uploads directory:
   ```bash
   mkdir -p public/uploads
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
study-buddy/
├── public/           # Static assets
│   └── uploads/      # User uploaded files
├── src/              # Source code
│   ├── app/          # Next.js App Router
│   │   ├── api/      # API routes
│   │   └── (routes)/ # Page routes
│   ├── components/   # React components
│   ├── lib/          # Utility functions
│   ├── hooks/        # Custom React hooks
│   └── types/        # TypeScript type definitions
├── .env.local        # Environment variables (create this)
├── next.config.ts    # Next.js configuration
└── tsconfig.json     # TypeScript configuration
```

## Usage

1. **Sign In**: Create an account or sign in with Google
2. **Chat**: Ask academic questions in the chat interface
3. **Upload Documents**: Process images with text, including handwritten notes
4. **View Documents**: Access your uploaded and processed documents
5. **Math Equations**: Use LaTeX syntax to input and display mathematical equations

## Development

```bash
# Run development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

## Deployment

The application can be deployed to Vercel or any other hosting service that supports Next.js:

```bash
npm run build
npm run start
```

For Vercel deployment:
```bash
vercel
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini for the powerful AI capabilities
- Tesseract.js for OCR functionality
- Next.js team for the amazing framework
- NextUI for the beautiful UI components
