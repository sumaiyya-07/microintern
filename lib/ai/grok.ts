
export async function getGrokFeedback(
  taskTitle: string,
  taskDesc: string,
  submissionText: string,
  link: string
): Promise<{ rating: number; comment: string }> {
  const apiKey = process.env.GROK_API_KEY;

  if (!apiKey) {
    console.log("GROK_API_KEY not found. Using mock AI feedback.");
    return getMockAiFeedback(taskTitle, submissionText);
  }

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-2",
        messages: [
          {
            role: "system",
            content:
              "You are an elite developer giving feedback on candidate work submissions. Return ONLY a JSON object with keys: 'rating' (integer 1-5) and 'comment' (string, concise, constructive feedback of 2-3 sentences max). Do not include markdown formatting or backticks around the JSON, return the raw JSON object string only.",
          },
          {
            role: "user",
            content: `Task: ${taskTitle}\nDescription: ${taskDesc}\n\nCandidate Submission:\nAnswer: ${submissionText}\nLink: ${link}`,
          },
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    const content = data.choices[0].message.content.trim();

    // Remove any markdown block syntax if returned
    const cleanJson = content.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const result = JSON.parse(cleanJson);

    return {
      rating: Math.max(1, Math.min(5, Number(result.rating) || 4)),
      comment: result.comment || "Good attempt. The submission meets the key requirements.",
    };
  } catch (error) {
    console.error("Error communicating with Grok API, falling back to mock:", error);
    return getMockAiFeedback(taskTitle, submissionText);
  }
}

function getMockAiFeedback(taskTitle: string, submissionText: string) {
  let rating = 4;
  let comment =
    "Excellent design layout and neat execution. The code shows robust module segmentation and adheres to optimal practices. Minor visual refinement could improve contrast ratio on smaller screens.";

  const textLower = submissionText.toLowerCase();

  if (submissionText.length < 60) {
    rating = 3;
    comment =
      "The submission meets basic criteria but lacks complete coverage. Adding step-by-step descriptions or error handling outlines would make it much more comprehensive and ready for production.";
  } else if (textLower.includes("performance") || textLower.includes("accessibility") || textLower.includes("lighthouse")) {
    rating = 5;
    comment =
      "Superb implementation! Showcases high attention to user accessibility standards, modularity, and clean styling patterns. It fits the requested task prompt perfectly.";
  }

  return { rating, comment };
}
