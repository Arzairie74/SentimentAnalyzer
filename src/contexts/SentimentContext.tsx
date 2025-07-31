import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { SentimentAnalysis } from '../lib/supabase';
import OpenAI from 'openai';

export interface HarassmentResult extends SentimentAnalysis {
  // Keep the same structure but interpret differently:
  // results.positive = not harassment
  // results.negative = harassment  
  // results.neutral = neutral/unclear
}

interface HarassmentContextType {
  history: HarassmentResult[];
  addResult: (result: HarassmentResult) => void;
  analyzeText: (text: string) => Promise<HarassmentResult>;
  analyzeRedditPost: (url: string) => Promise<HarassmentResult>;
}

const HarassmentContext = createContext<HarassmentContextType | undefined>(undefined);

export function useHarassment() {
  const context = useContext(HarassmentContext);
  if (context === undefined) {
    throw new Error('useHarassment must be used within a HarassmentProvider');
  }
  return context;
}

let openai: OpenAI | null = null;

const initializeOpenAI = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  console.log('=== OpenAI Configuration ===');
  console.log('API Key present:', apiKey ? 'Yes' : 'No');
  console.log('API Key length:', apiKey ? apiKey.length : 0);
  console.log('API Key starts with sk-:', apiKey ? apiKey.startsWith('sk-') : false);
  
  if (apiKey) {
    openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });
    console.log('OpenAI client initialized');
  } else {
    console.log('No OpenAI API key found, will use fallback analysis');
  }
};

initializeOpenAI();

// Reddit scraper functions
const scrapeRedditComments = async (url: string): Promise<string[]> => {
  console.log('=== Starting Reddit Scraping ===');
  console.log('URL:', url);
  
  try {
    // Convert Reddit URL to JSON format for easier parsing
    const jsonUrl = url.endsWith('.json') ? url : `${url}.json?limit=500&depth=10&sort=top`;
    console.log('Fetching JSON from:', jsonUrl);
    
    const response = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'SentimentAnalyzer/1.0.0',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('JSON data received, parsing...');
    
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('Invalid Reddit JSON structure');
    }
    
    const commentsData = data[1];
    if (!commentsData?.data?.children) {
      throw new Error('No comments section found in Reddit data');
    }
    
    const comments: string[] = [];
    
    // Recursive function to extract comments
    const extractComments = (children: any[]) => {
      for (const child of children) {
        if (child.kind === 't1' && child.data) {
          const comment = child.data;
          
          // Skip deleted, removed, or very short comments
          if (comment.body && 
              comment.body !== '[deleted]' && 
              comment.body !== '[removed]' &&
              comment.body !== '[unavailable]' &&
              comment.body.trim().length > 10 &&
              !comment.distinguished) {
            comments.push(comment.body);
          }
          
          // Process replies recursively
          if (comment.replies && comment.replies.data && comment.replies.data.children) {
            extractComments(comment.replies.data.children);
          }
        }
        // Handle "more" comments - these are collapsed comment threads
        else if (child.kind === 'more' && child.data && child.data.children) {
          console.log('Found "more" comments section with', child.data.children.length, 'additional comment IDs');
          // Note: These would require additional API calls to fetch, which we'll skip for now
        }
      }
    };
    
    extractComments(commentsData.data.children);
    
    // Limit to 100 comments for faster processing and rate limit management
    const limitedComments = comments.slice(0, 100);
    
    console.log('Extracted comments:', comments.length, '(limited to', limitedComments.length, ')');
    console.log('Sample comments:', limitedComments.slice(0, 3).map(c => c.substring(0, 50) + '...'));
    
    return limitedComments;
    
  } catch (error) {
    console.error('Reddit scraping error:', error);
    throw new Error(`Failed to scrape Reddit comments: ${error.message}`);
  }
};

// Batch harassment analysis using OpenAI - analyze multiple texts in one request
const analyzeHarassmentBatch = async (texts: string[]): Promise<Array<{ harassment: 'harassment' | 'not-harassment'; score: number }>> => {
  // Use OpenAI if available
  if (openai) {
    try {
      const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo';
      
      // Validate model supports chat completions
      const chatModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4-turbo-preview', 'gpt-4o', 'gpt-4o-mini'];
      if (!chatModels.some(validModel => model.includes(validModel.split('-')[0]))) {
        console.warn(`Model ${model} may not support chat completions, falling back to simple analysis`);
        throw new Error(`Unsupported model: ${model}`);
      }
      
      // Create a single prompt for all texts
      const batchPrompt = texts.map((text, index) => 
        `${index + 1}. "${text.substring(0, 200)}${text.length > 200 ? '...' : ''}"`
      ).join('\n\n');
      
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: `Analyze these ${texts.length} texts for harassment and respond with ONLY a valid JSON array. Each object must have exactly this format: {"harassment": "harassment", "score": 0.95}. Use only "harassment" or "not-harassment" for harassment classification. Score must be between 0 and 1 (higher score = more likely to be harassment). Do not include any other text, explanations, or markdown formatting.

IMPORTANT: Ensure the JSON is valid and complete. Do not truncate the response.

Texts to analyze for harassment:
${batchPrompt}`
          }
        ],
        max_tokens: 4096, // Fixed higher value to prevent truncation
        temperature: 0.1,
        // Don't force JSON object format as it may cause issues
      });
      
      const responseText = completion.choices[0]?.message?.content?.trim();
      console.log('OpenAI raw response:', responseText);
      
      if (responseText) {
        let results;
        try {
          // Clean the response first
          let cleanedResponse = responseText;
          
          // Remove any markdown formatting
          cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          
          // Extract JSON array if it's wrapped in an object
          if (cleanedResponse.includes('"results"') || cleanedResponse.includes('"analysis"') || cleanedResponse.includes('"harassment"')) {
            const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              cleanedResponse = jsonMatch[0];
            }
          }
          
          // Try to parse the cleaned JSON
          results = JSON.parse(cleanedResponse);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Raw response that failed to parse:', responseText);
          
          // Extract complete JSON objects from truncated response
          try {
            // Find all complete sentiment objects using regex
            const objectMatches = responseText.match(/\{\s*"harassment"\s*:\s*"[^"]+"\s*,\s*"score"\s*:\s*[0-9.]+\s*\}/g);
            
            if (objectMatches && objectMatches.length > 0) {
              // Reconstruct valid JSON array from complete objects
              const fixedResponse = '[' + objectMatches.join(',') + ']';
              results = JSON.parse(fixedResponse);
              console.log(`Successfully extracted ${objectMatches.length} complete objects from truncated response`);
            } else {
              console.error('No complete sentiment objects found in response');
              throw new Error('Invalid JSON response from OpenAI');
            }
          } catch (extractionError) {
            console.error('Failed to extract objects from truncated JSON:', extractionError);
            throw new Error('Invalid JSON response from OpenAI');
          }
        }
        
        // Validate the response format - should be an array
        if (Array.isArray(results) && results.length > 0) {
          // Handle partial results if response was truncated
          const expectedLength = texts.length;
          const actualLength = results.length;
          
          if (actualLength < expectedLength) {
            console.warn(`OpenAI returned ${actualLength} results for ${expectedLength} texts, padding with fallback analysis`);
            // Fill missing results with simple analysis
            for (let i = actualLength; i < expectedLength; i++) {
              results.push(analyzeHarassmentSimple(texts[i]));
            }
          }
          
          const validResults = results.map(result => {
            if (result.harassment && result.score !== undefined) {
              const harassment = result.harassment.toLowerCase();
              if (['harassment', 'not-harassment'].includes(harassment)) {
                return { 
                  harassment: harassment as 'harassment' | 'not-harassment', 
                  score: Math.abs(result.score) 
                };
              }
            }
            // Fallback for invalid results
            return { harassment: 'not-harassment' as const, score: 0.5 };
          });
          
          return validResults;
        } else if (results && typeof results === 'object' && !Array.isArray(results)) {
          // Handle case where OpenAI returns an object instead of array
          console.log('OpenAI returned object instead of array, extracting results...');
          const extractedResults = Object.values(results).filter(item => 
            item && typeof item === 'object' && item.harassment
          );
          if (extractedResults.length > 0) {
            return extractedResults.slice(0, texts.length);
          }
        }
      }
      
      throw new Error('Invalid response format from OpenAI');
        
    } catch (error) {
      console.warn('OpenAI API failed, using simple analysis:', error);
      
      // Log more details for debugging
      if (error.response) {
        console.error('OpenAI API Error Response:', error.response.data);
      }
      
      // Don't initialize OpenAI client again if it fails with auth error
      if (error.message && (error.message.includes('401') || error.message.includes('Invalid') || error.message.includes('400'))) {
        openai = null;
      }
    }
  }
  
  // Fallback to simple harassment analysis for all texts
  return texts.map(text => analyzeHarassmentSimple(text));
};

// Simple harassment analysis fallback
const analyzeHarassmentSimple = (text: string): { harassment: 'harassment' | 'not-harassment'; score: number } => {
  const harassmentWords = ['hate', 'kill', 'die', 'stupid', 'idiot', 'loser', 'pathetic', 'worthless', 'disgusting', 'trash', 'garbage', 'moron', 'retard', 'bitch', 'asshole', 'fuck you', 'go die', 'kys', 'neck yourself', 'ugly', 'fat', 'slut', 'whore'];
  const threatWords = ['kill', 'murder', 'hurt', 'harm', 'attack', 'beat', 'punch', 'shoot', 'stab', 'destroy'];
  
  const words = text.toLowerCase().split(/\s+/);
  let harassmentCount = 0;
  let threatCount = 0;
  
  words.forEach(word => {
    if (harassmentWords.includes(word)) harassmentCount++;
    if (threatWords.includes(word)) threatCount++;
  });
  
  // Check for harassment phrases
  const lowerText = text.toLowerCase();
  if (lowerText.includes('kill yourself') || lowerText.includes('kys') || lowerText.includes('go die')) {
    threatCount += 2;
  }
  
  const totalHarassment = harassmentCount + (threatCount * 2); // Threats weighted more heavily
  const score = Math.min(totalHarassment / words.length * 10, 1); // Scale up and cap at 1
  
  if (score > 0.1 || threatCount > 0) return { harassment: 'harassment', score };
  return { harassment: 'not-harassment', score };
};

// Single text harassment analysis (for text analysis page)
const analyzeHarassment = async (text: string): Promise<{ harassment: 'harassment' | 'not-harassment'; score: number }> => {
  const results = await analyzeHarassmentBatch([text]);
  return results[0];
};

// Process large batches of texts efficiently
const analyzeHarassmentLargeBatch = async (texts: string[]): Promise<Array<{ harassment: 'harassment' | 'not-harassment'; score: number }>> => {
  const results = [];
  
  // Process in larger batches for OpenAI (10-20 texts per request)
  const batchSize = openai ? 15 : 50; // Larger batches for OpenAI, even larger for simple analysis
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} (${batch.length} texts)`);
    
    try {
      const batchResults = await analyzeHarassmentBatch(batch);
      results.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < texts.length) {
        const delay = openai ? 2000 : 100; // 2 second delay for OpenAI, 100ms for simple analysis
        console.log(`Waiting ${delay}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
      // Use simple analysis as fallback for this batch
      const fallbackResults = batch.map(text => analyzeHarassmentSimple(text));
      results.push(...fallbackResults);
    }
  }
  
  return results;
};

export function HarassmentProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<HarassmentResult[]>([]);
  const { user } = useAuth();

  // Load user's harassment analysis history
  React.useEffect(() => {
    if (user && isSupabaseConfigured()) {
      loadHistory();
    } else {
      setHistory([]);
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user || !isSupabaseConfigured()) return;

    try {
      const { data, error } = await supabase
        .from('sentiment_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading history:', error);
        return;
      }

      setHistory(data || []);
    } catch (error) {
      console.error('Error in loadHistory:', error);
    }
  };

  const addResult = async (result: Omit<HarassmentResult, 'id' | 'user_id' | 'created_at'>) => {
    console.log('Adding result:', result);
    
    if (!user || !isSupabaseConfigured()) {
      // Store in memory if Supabase not configured
      const memoryResult = {
        id: Date.now().toString(),
        user_id: user?.id || 'temp',
        created_at: new Date().toISOString(),
        ...result
      } as HarassmentResult;
      
      console.log('Storing in memory:', memoryResult);
      setHistory(prev => [memoryResult, ...prev]);
      return memoryResult;
    }

    try {
      const { data, error } = await supabase
        .from('sentiment_analyses')
        .insert({
          user_id: user.id,
          type: result.type,
          content: result.content,
          url: result.url,
          results: result.results,
          analysis: result.analysis,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving analysis:', error);
        // Fallback to memory storage
        const memoryResult = {
          id: Date.now().toString(),
          user_id: user.id,
          created_at: new Date().toISOString(),
          ...result
        } as HarassmentResult;
        
        setHistory(prev => [memoryResult, ...prev]);
        return memoryResult;
      }

      if (data) {
        console.log('Saved to database:', data);
        setHistory(prev => [data, ...prev]);
        return data;
      }
    } catch (error) {
      console.error('Error in addResult:', error);
      // Fallback to memory storage
      const memoryResult = {
        id: Date.now().toString(),
        user_id: user.id,
        created_at: new Date().toISOString(),
        ...result
      } as HarassmentResult;
      
      setHistory(prev => [memoryResult, ...prev]);
      return memoryResult;
    }
    
    // Fallback return (should not reach here)
    const fallbackResult = {
      id: Date.now().toString(),
      user_id: user?.id || 'temp',
      created_at: new Date().toISOString(),
      ...result
    } as HarassmentResult;
    
    return fallbackResult;
  };

  const analyzeText = async (text: string): Promise<HarassmentResult> => {
    console.log('Starting text analysis for:', text.substring(0, 50) + '...');
    
    if (!text || text.trim().length === 0) {
      throw new Error('Please enter some text to analyze');
    }
    
    const analysis = await analyzeHarassment(text);
    console.log('Analysis result:', analysis);
    
    const resultData = {
      type: 'text',
      content: text,
      results: {
        positive: analysis.harassment === 'not-harassment' ? 1 : 0,
        neutral: 0,
        negative: analysis.harassment === 'harassment' ? 1 : 0,
        total: 1
      },
      analysis: [{
        text,
        sentiment: analysis.harassment === 'harassment' ? 'negative' : 'positive',
        score: analysis.score
      }],
    };
    
    console.log('Saving result data:', resultData);
    
    try {
      const savedResult = await addResult(resultData);
      console.log('Saved result:', savedResult);
      return savedResult;
    } catch (error) {
      console.error('Error saving result:', error);
      // Return the result data even if saving fails
      return {
        id: Date.now().toString(),
        user_id: user?.id || 'temp',
        created_at: new Date().toISOString(),
        ...resultData
      } as HarassmentResult;
    }
  };

  const analyzeRedditPost = async (url: string): Promise<HarassmentResult> => {
    try {
      // Scrape comments from Reddit
      const allComments = await scrapeRedditComments(url);
      
      if (allComments.length === 0) {
        throw new Error('No comments found in this Reddit post. The post may have no comments or be private.');
      }
      
      console.log('Analyzing sentiment for', allComments.length, 'comments...');
      const harassmentResults = await analyzeHarassmentLargeBatch(allComments);
      const analysis = allComments.map((comment, index) => ({
        text: comment,
        sentiment: harassmentResults[index].harassment === 'harassment' ? 'negative' : 'positive',
        score: harassmentResults[index].score
      }));
      
      const harassment = analysis.filter(a => a.sentiment === 'negative').length;
      const notHarassment = analysis.filter(a => a.sentiment === 'positive').length;
      const negative = analysis.filter(a => a.sentiment === 'negative').length;
      const positive = analysis.filter(a => a.sentiment === 'positive').length;
      
      console.log('Analysis complete:', { harassment, notHarassment });
      
      const resultData = {
        type: 'reddit',
        content: url,
        url,
        results: {
          positive: notHarassment,
          neutral: 0,
          negative,
          total: allComments.length
        },
        analysis,
      };
      
      const savedResult = await addResult(resultData);
      
      // Return the actual saved result
      return savedResult;
      
    } catch (error) {
      console.error('=== Reddit Scraping Error ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  };

  const value = {
    history,
    addResult,
    analyzeText,
    analyzeRedditPost
  };

  return <HarassmentContext.Provider value={value}>{children}</HarassmentContext.Provider>;
}