import { Platform } from 'react-native';
import { Asset } from '../types';

const GEMINI_API_KEY = 'AIzaSyB1jQd8-b0SNM6fThdLCOW6Rzu19CR8Dqc';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface PortfolioData {
  name: string;
  value: number;
  type: string;
  gainLoss: number;
  gainLossPercentage: number;
}

const callGeminiAPI = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    return data.candidates[0]?.content.parts[0]?.text || 'Unable to generate response';
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
};

export const generatePortfolioSummary = async (portfolioData: PortfolioData[]): Promise<string> => {
  try {
    const prompt = `Analyze this investment portfolio and provide a brief, insightful summary in 2-3 sentences. Focus on key trends, risks, and opportunities. Portfolio data: ${JSON.stringify(portfolioData)}`;
    return await callGeminiAPI(prompt);
  } catch (error) {
    console.error('Error generating portfolio summary:', error);
    return 'Unable to generate summary at this time';
  }
};

export const analyzeRiskProfile = async (portfolioData: PortfolioData[]): Promise<string> => {
  try {
    const prompt = `Analyze the risk profile of this investment portfolio. Consider asset allocation, volatility, and diversification. Provide specific recommendations for risk management in 2-3 sentences. Portfolio data: ${JSON.stringify(portfolioData)}`;
    return await callGeminiAPI(prompt);
  } catch (error) {
    console.error('Error analyzing risk profile:', error);
    return 'Unable to analyze risk profile at this time';
  }
};

export const suggestRebalancing = async (portfolioData: PortfolioData[]): Promise<string> => {
  try {
    const prompt = `Based on this portfolio data, suggest specific rebalancing actions to optimize the asset allocation. Consider modern portfolio theory and diversification principles. Provide actionable recommendations in 2-3 sentences. Portfolio data: ${JSON.stringify(portfolioData)}`;
    return await callGeminiAPI(prompt);
  } catch (error) {
    console.error('Error generating rebalancing suggestions:', error);
    return 'Unable to generate rebalancing suggestions at this time';
  }
};

export const analyzeMarketTrends = async (portfolioData: PortfolioData[]): Promise<string> => {
  try {
    const prompt = `Analyze how this portfolio might be affected by current market trends. Consider sector performance, market conditions, and economic indicators. Provide insights in 2-3 sentences. Portfolio data: ${JSON.stringify(portfolioData)}`;
    return await callGeminiAPI(prompt);
  } catch (error) {
    console.error('Error analyzing market trends:', error);
    return 'Unable to analyze market trends at this time';
  }
};

export const suggestNewInvestments = async (portfolioData: PortfolioData[]): Promise<string> => {
  try {
    const prompt = `Based on this portfolio's current composition and performance, suggest potential new investment opportunities that could complement the existing assets. Consider diversification, risk profile, and current market conditions. Provide specific suggestions in 2-3 sentences. Portfolio data: ${JSON.stringify(portfolioData)}`;
    return await callGeminiAPI(prompt);
  } catch (error) {
    console.error('Error generating investment suggestions:', error);
    return 'Unable to generate investment suggestions at this time';
  }
}; 