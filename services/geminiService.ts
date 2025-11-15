import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GameState, Action, DiceCheckResult, DMResponse, Character, CharacterCreationPayload, ApiMetadata } from '../types';

let prompts: any = null;

async function loadPrompts() {
  if (prompts) {
    return prompts;
  }
  // Use fetch to load the JSON file, which is more robust in browser environments
  const response = await fetch('/prompts.json');
  if (!response.ok) {
    throw new Error('Failed to load prompts.json');
  }
  prompts = await response.json();
  return prompts;
}


const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const textModel = 'gemini-2.5-flash';
const imageModel = 'gemini-2.5-flash-image';
const ttsModel = 'gemini-2.5-flash-preview-tts';

// A utility to safely parse JSON from the model, which might be in a markdown block
function parseJsonFromMarkdown(text: string): any {
  const match = text.match(/```json\n([\s\S]*?)\n```/);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error("Failed to parse JSON from markdown block:", e);
      // Fallback to parsing the whole string if markdown block parsing fails
    }
  }
  try {
      return JSON.parse(text);
  } catch(e) {
      console.error("Failed to parse text as JSON:", e);
      throw new Error("Invalid JSON response from model.");
  }
}


export async function getCharacterCreationData(): Promise<CharacterCreationPayload> {
  const prompts = await loadPrompts();
  const { character_creation } = prompts;

  const response = await ai.models.generateContent({
    model: textModel,
    contents: character_creation.prompt,
    config: {
      systemInstruction: character_creation.system_instruction,
      responseMimeType: "application/json",
      // @ts-ignore // The SDK types are not perfectly aligned with the API schema structure
      responseSchema: character_creation.schema
    }
  });

  if (!response.text) {
    throw new Error("Received no text response from Gemini for character creation.");
  }

  const payload = parseJsonFromMarkdown(response.text);
  
  // Basic validation
  if (!payload.scene || !Array.isArray(payload.style_options) || !Array.isArray(payload.stat_array) || !Array.isArray(payload.races) || !Array.isArray(payload.classes) || !Array.isArray(payload.weapons)) {
      throw new Error("Invalid payload structure for character creation.");
  }
  
  return payload as CharacterCreationPayload;
}


export async function getGameTurn(
  gameState: GameState,
  action: Action,
  diceResult?: DiceCheckResult
): Promise<{ dmResponse: DMResponse, apiMetadata: ApiMetadata }> {
    const prompts = await loadPrompts();
    const { game_turn } = prompts;

    const characterString = `Name: ${gameState.character.name}, Gender: ${gameState.character.gender}, Race: ${gameState.character.race}, Class: ${gameState.character.class}, Weapon: ${gameState.character.weapon}. Description: ${gameState.character.description}. Stats: ${JSON.stringify(gameState.character.stats)}`;
    const story_log_string = gameState.storyLog.slice(-5).join('\n---\n'); // Last 5 entries
    
    let action_string: string;
    if (action.actionId === 'custom_action' && action.customAction) {
        if (diceResult) {
            action_string = `The player performed a custom action: "${action.customAction}". They needed to make a skill check, and the result was a ${diceResult}. Describe the outcome of their attempt.`;
        } else {
            action_string = `The player wants to perform a custom action: "${action.customAction}".
First, determine if this action's success is uncertain and requires a skill check.
- If a check IS required: Respond with a 'required_check' object detailing the 'stat' and 'dc'. The 'scene_description' must be a short sentence about *attempting* the action (e.g., "You attempt to pick the lock..."). The 'options' array must be empty.
- If a check is NOT required: Describe the outcome of the action directly, provide three new options, and do not include the 'required_check' field.`;
        }
    } else {
        action_string = `The player chose to perform the action: '${action.actionId}'.`;
    }
    
    if (diceResult && action.actionId !== 'custom_action') {
        action_string += ` They attempted a skill check and the result was a ${diceResult}. Describe the outcome of their attempt.`;
    }

    if (action.actionId === 'start_game') {
        action_string = "The adventure is just beginning. Describe the opening scene.";
    }

    const beat_goal = game_turn.beat_goals[gameState.currentBeat] || "Continue the story.";

    const prompt = game_turn.prompt_template
        .replace('{current_beat}', gameState.currentBeat)
        .replace('{beat_goal}', beat_goal)
        .replace('{character_string}', characterString)
        .replace('{story_log_string}', story_log_string || "This is the very beginning of the story.")
        .replace('{action_string}', action_string);
    
    const response = await ai.models.generateContent({
      model: textModel,
      contents: prompt,
      config: {
        systemInstruction: game_turn.system_instruction,
        responseMimeType: "application/json",
        // @ts-ignore
        responseSchema: game_turn.schema,
      }
    });

    if (!response.text) {
        throw new Error("Received no text response from Gemini for game turn.");
    }
    
    const dmResponse = parseJsonFromMarkdown(response.text) as DMResponse;

    // Basic validation
    if (!dmResponse.scene_description || !Array.isArray(dmResponse.options) || typeof dmResponse.beat_complete !== 'boolean' || typeof dmResponse.player_dead !== 'boolean' || !Array.isArray(dmResponse.visual_lore_updates)) {
        throw new Error("Invalid payload structure for game turn.");
    }

    const apiMetadata: ApiMetadata = {
        usageMetadata: response.usageMetadata,
        finishReason: response.candidates?.[0]?.finishReason,
        safetyRatings: response.candidates?.[0]?.safetyRatings,
        originalPrompt: prompt
    };

    return { dmResponse, apiMetadata };
}

export async function generateSceneImage(sceneDescription: string, character: Character, artStyle: string, visualLore: string): Promise<string> {
    const prompts = await loadPrompts();
    const { visualization } = prompts;
    const characterDescription = `${character.gender} ${character.race} ${character.class} named ${character.name}, wearing ${character.description}, wielding a ${character.weapon}`;

    const prompt = visualization.prompt_template
        .replace('{character_description}', characterDescription)
        .replace('{scene_description}', sceneDescription)
        .replace('{art_style}', artStyle)
        .replace('{visual_lore}', visualLore || "No specific lore yet.");


    const response = await ai.models.generateContent({
        model: imageModel,
        contents: {
            parts: [{ text: prompt }],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) {
        throw new Error("Image generation failed: No response candidate found.");
    }

    if (candidate.finishReason === 'SAFETY') {
        throw new Error("Image generation failed: The request was blocked for safety reasons. Please try a different description.");
    }
    
    const imagePart = candidate.content?.parts?.find(part => part.inlineData);

    if (!imagePart || !imagePart.inlineData) {
        throw new Error("Image generation failed: No image data returned in the response.");
    }
    
    const base64ImageBytes: string = imagePart.inlineData.data;
    return `data:image/png;base64,${base64ImageBytes}`;
}

export async function generateSpeech(text: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: ttsModel,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' }, // Darker, brooding voice
          },
        },
      },
    });
  
    const audioPart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
  
    if (!audioPart || !audioPart.inlineData?.data) {
      throw new Error("Speech generation failed: No audio data returned from the API.");
    }
  
    return audioPart.inlineData.data;
}

export async function getDemystificationReport(metadata: ApiMetadata): Promise<string> {
  const prompts = await loadPrompts();
  const { demystifier } = prompts;

  const prompt = demystifier.prompt_template
    .replace('{original_prompt}', metadata.originalPrompt)
    .replace('{usage_metadata}', JSON.stringify(metadata.usageMetadata || {}, null, 2))
    .replace(/{finish_reason}/g, metadata.finishReason || 'UNKNOWN')
    .replace('{safety_ratings}', JSON.stringify(metadata.safetyRatings || [], null, 2));
    
  const response = await ai.models.generateContent({
    model: textModel,
    contents: prompt,
    config: {
      systemInstruction: demystifier.system_instruction,
    }
  });

  if (!response.text) {
    throw new Error("Received no text response from Gemini for demystification report.");
  }

  return response.text;
}