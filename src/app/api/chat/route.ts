import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth.server';
import { generateWithGemini } from '@/lib/gemini';
import { connectToDatabase } from '@/lib/mongoose';
import Chat from '@/lib/models/Chat';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { message, chatId, history = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find existing chat or prepare to create a new one
    let chat;
    if (chatId) {
      chat = await Chat.findOne({
        _id: chatId,
        userId: user.id,
      });

      if (!chat) {
        return NextResponse.json(
          { error: 'Chat not found' },
          { status: 404 }
        );
      }
    }

    // Use the provided history or get from the database
    const messageHistory = history.length > 0 
      ? history 
      : (chat?.messages || []).map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        }));

    // Add the new user message to history
    messageHistory.push({ role: 'user', content: message });

    // Get response from Gemini API
    const response = await generateWithGemini(message, messageHistory);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to generate response' },
        { status: 500 }
      );
    }

    // Add the assistant response to history
    const responseData = response.data || '';
    const assistantMessage = { role: 'assistant', content: responseData };
    messageHistory.push(assistantMessage);

    // Update or create the chat in the database
    if (chat) {
      // Update existing chat
      chat.messages.push(
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'assistant', content: responseData, timestamp: new Date() }
      );
      await chat.save();
    } else {
      // Create a new chat
      chat = await Chat.create({
        userId: user.id,
        title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
        messages: [
          { role: 'user', content: message, timestamp: new Date() },
          { role: 'assistant', content: responseData, timestamp: new Date() },
        ],
      });
    }

    return NextResponse.json({
      chatId: chat._id,
      response: responseData,
      history: messageHistory,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
} 