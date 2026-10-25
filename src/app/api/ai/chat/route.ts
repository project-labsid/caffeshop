import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

const SYSTEM_PROMPT = `You are "Kopi AI Assistant", an intelligent assistant for a POS (Point of Sale) application called "Kasir Kopi Shop". You help coffee shop owners with:
- Sales analysis and insights
- Product recommendations and restock suggestions  
- Customer insights and retention strategies
- Inventory management advice
- Business performance summaries

Always respond in Bahasa Indonesia. Be concise, helpful, and actionable. When given transaction/product data, provide specific analysis and recommendations. Format responses with clear structure using markdown.`

const AI_FEATURE_TOGGLE_KEYS = [
  'ai_smart_suggestions',
  'ai_auto_categorize',
  'ai_sales_forecast',
  'ai_restock_alert',
  'ai_customer_insight',
] as const

async function getStoreSetting(key: string, accountId: string): Promise<string | null> {
  try {
    const setting = await db.storeSetting.findFirst({
      where: { key, accountId },
    })
    return setting?.value ?? null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const accountId = request.headers.get('x-account-id')
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID diperlukan' }, { status: 400 })
    }

    const body = await request.json()
    const { messages, context } = body as {
      messages: Array<{ role: string; content: string }>
      context?: string
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Messages array is required and must not be empty.' },
        { status: 400 }
      )
    }

    // Read AI model setting (default: gpt-4o-mini)
    const aiModel = (await getStoreSetting('ai_model', accountId)) || 'gpt-4o-mini'

    // Read AI feature toggles in parallel
    const featureToggles = await Promise.all(
      AI_FEATURE_TOGGLE_KEYS.map(async (key) => {
        const value = await getStoreSetting(key, accountId)
        return { key, enabled: value !== 'false' && value !== null }
      })
    )

    // Build feature context for the system prompt
    const enabledFeatures = featureToggles
      .filter((f) => f.enabled)
      .map((f) => f.key)
      .join(', ')

    let fullSystemPrompt = SYSTEM_PROMPT

    if (enabledFeatures) {
      fullSystemPrompt += `\n\nFitur AI yang aktif saat ini: ${enabledFeatures}.`
    }

    // Append user-provided context (e.g., sales data, product data)
    if (context) {
      fullSystemPrompt += `\n\nKonteks data toko saat ini:\n${context}`
    }

    // Prepare messages: system prompt first (role: 'assistant' per SDK requirement), then user messages
    const chatMessages: Array<{ role: string; content: string }> = [
      { role: 'assistant', content: fullSystemPrompt },
      ...messages,
    ]

    // Call AI SDK
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      model: aiModel,
      messages: chatMessages,
      thinking: { type: 'disabled' },
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      return NextResponse.json(
        { success: false, error: 'AI returned an empty response.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      response,
    })
  } catch (error) {
    console.error('AI Chat error:', error)
    const message =
      error instanceof Error ? error.message : 'Terjadi kesalahan pada server.'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
