import React from "react";

interface PlaceholderPageProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function PlaceholderPage({
  icon,
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <div className="mb-6 text-6xl opacity-50">{icon}</div>
      <h1 className="text-4xl font-bold text-foreground mb-4">{title}</h1>
      <p className="text-lg text-muted-foreground max-w-md">{description}</p>
    </div>
  );
}
