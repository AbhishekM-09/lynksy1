export const generateBioOptions = async (category: string, username: string): Promise<string[]> => {
  try {
    const response = await fetch('/api/ai/bios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, username }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to generate bios');
    }

    const bios = await response.json();
    return Array.isArray(bios) ? bios.slice(0, 3) : [
      "Digital creator sharing my journey and useful links.",
      "Check out my latest projects and socials here!",
      "Welcome to my page! Exploring the world and sharing my favorites."
    ];
  } catch (error) {
    console.error("Bio Generation Error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("Settings") || msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("api_key") || msg.toLowerCase().includes("expired")) {
      throw error;
    }
    return [
      "Digital creator sharing my journey and useful links.",
      "Check out my latest projects and socials here!",
      "Welcome to my page! Exploring the world and sharing my favorites."
    ];
  }
};
