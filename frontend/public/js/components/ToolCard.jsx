import React from "https://esm.sh/react@18";

export default function ToolCard({ tool }) {
  return (
    <article className="tool-card">
      <div className="tool-card-icon">
        <i className={tool.icon}></i>
      </div>
      <div className="tool-card-body">
        <h4>{tool.title}</h4>
        <p>{tool.description}</p>
      </div>
      <div className="tool-card-action">
        <a href={tool.route} className="btn btn-secondary btn-sm">Open</a>
      </div>
    </article>
  );
}
