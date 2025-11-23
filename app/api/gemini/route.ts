import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const geminiApiKey = process.env.GEMINI_API_KEY

export async function POST(request: NextRequest) {
  try {
    if (!geminiApiKey) {
      return NextResponse.json(
        { success: false, error: 'Gemini API key is not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { prompt } = body

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({
      success: true,
      response: text,
    })
  } catch (error) {
    console.error('Gemini API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}

