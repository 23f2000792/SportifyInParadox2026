# **App Name**: Paradox SportFlow

## Core Features:

- Live Event Dashboard: Displays today's matches, 'Live Now' events with real-time updates, and provides quick navigation cards for each sport event, keeping the UI minimal and mobile-friendly.
- Detailed Event Pages: Dedicated pages for Kampus Run (results table with sorting and top finishers), Football (group-wise points table, match results, upcoming schedule), Volleyball (similar to football), Badminton (tie results, sub-match results, group standings in expandable cards), and IPL Auction (house squads, team points, remaining purse with card-based layout).
- Real-time Data Updates: Automatically refreshes displayed data across all pages (schedules, results, points, standings) as soon as changes occur in the Firestore database.
- Simplified Admin Panel: A basic, unauthenticated interface allowing event organizers to quickly add and update match results, scores, and standings for all sports events.
- AI Match Recap Tool: A generative AI tool that automatically produces concise and engaging match summaries or highlight snippets for completed games (e.g., Football, Volleyball) based on the recorded scores and key events.

## Style Guidelines:

- The visual concept draws from the energy of competition and the clarity needed for real-time sports data. A light color scheme emphasizes readability and speed. Primary calls to action and key interactive elements use a vibrant, dynamic green, conveying freshness and action. For instance, '#4EAD1F'.
- The background color uses a desaturated tint of the primary hue, providing a clean, airy canvas that promotes focus without distraction. For instance, '#F4F7F3' (an almost-white, light green-grey).
- An analogous accent color provides visual dynamism and is reserved for prominent highlights and critical interactive elements. For instance, '#D5ED5E' (a bright, energetic chartreuse).
- Specific functional color coding for data states: Green for 'Win', Red for 'Loss', and Yellow for 'Live' matches, ensuring immediate visual cues for crucial information.
- For maximum clarity and readability across all data displays and content, the sans-serif font 'Inter' will be used for both headlines and body text, supporting a clean, modern aesthetic.
- A mobile-first responsive layout emphasizing clarity, utilizing clean cards, well-structured tables for results and standings, and intuitive tabs for navigation within event pages. A sticky navigation bar will ensure accessibility to core sections.
- Minimalistic, line-art style icons will be used to represent different sports events and navigation actions, maintaining visual consistency and contributing to a fast-loading interface.
- Subtle and quick transition effects will be employed only where they enhance the user experience, such as state changes or navigation, deliberately avoiding heavy or elaborate animations to maintain performance and speed.