import React from "https://esm.sh/react@18";
import ToolCard from "./ToolCard.jsx";

export default function ToolGrid({ tools }) {
  return (
    <div className="tool-grid">
      {tools.map(tool => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
