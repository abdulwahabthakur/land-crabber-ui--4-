LandGrabbers

LandGrabbers is a real-world running game that transforms physical movement into territory control. As players run or walk, they capture the areas they pass through on a live map. Other players can enter those same regions to challenge and claim the territory. The goal is to dominate as much of the map as possible through real movement.

Features

Capture territory by running or walking through real locations

Defend zones from other players attempting to take them

Real-time map rendering and location tracking

Supabase authentication and user management

AI-generated challenges using Gemini

Modern UI built with Radix UI, shadcn, and Tailwind CSS

Mobile-friendly and responsive design

Tech Stack
Languages

TypeScript, JavaScript, CSS (Tailwind), SQL

Frameworks and Libraries

Next.js, React, Radix UI, shadcn/ui, Tailwind CSS, Supabase, Google Maps API, Framer Motion, Gemini AI

How It Works

The application tracks the user’s movement with GPS and draws their path on the map. This path becomes captured territory tied to the user's account. When other players move through the same area, they can claim or overlap that territory, creating competition. All data is stored and synced through Supabase, while Google Maps handles geographic visualization.

Inspiration

The project was inspired by the idea of making running more engaging by turning it into a competitive, map-based game. Instead of focusing only on step counts or metrics, LandGrabbers creates a strategic experience where every movement has impact.
How We Built It

The frontend was developed with Next.js and React. UI components were built with shadcn/ui and styled with Tailwind CSS. Supabase handled authentication, database storage, and real-time updates. Google Maps API was used to display territory and track user movement. Gemini AI was integrated to generate dynamic events and challenges.

Challenges

Major challenges included accurate GPS handling, territory boundary calculations, environment variable issues during deployment, and ensuring stable real-time map updates. Integrating multiple APIs while maintaining reliable UI states required careful debugging.

Accomplishments

We built a working prototype that connects real movement to live territory control. We integrated multiple complex systems, designed a clean interface, and created a functional gameplay loop that encourages real-world activity.

What We Learned

We gained experience with multi-API integration, managing real-time location data, building modern UI patterns, and handling the interaction between frontend and backend systems. We also learned how to debug authentication flows, environment issues, and rendering problems in Next.js.
