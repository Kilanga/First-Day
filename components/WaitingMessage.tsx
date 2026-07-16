"use client";

import { useEffect, useState } from "react";

const ONBOARDING_MESSAGES = [
  "Sketching the key ideas...",
  "Looking for the questions worth asking...",
  "Connecting the building blocks...",
  "Finding the misconceptions that make teaching stick...",
  "Turning the topic into an onboarding plan...",
  "Choosing a useful first question...",
  "Making room for the tricky bits...",
  "Following the ideas in the order they click...",
  "Looking for examples that make the topic concrete...",
  "Preparing a curious set of field notes...",
  "Checking which ideas belong together...",
  "Giving the onboarding plan a clear shape...",
  "Saving the best questions for your next session...",
  "Making sure your new hire starts in the right place...",
  "Almost ready to learn together...",
];

export default function WaitingMessage() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % ONBOARDING_MESSAGES.length), 10_000);
    return () => window.clearInterval(timer);
  }, []);
  return <span aria-live="polite">{ONBOARDING_MESSAGES[index]}</span>;
}
