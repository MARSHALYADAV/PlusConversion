import React from "https://esm.sh/react@18";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import ToolGrid from "./ToolGrid.jsx";
import ImageConverter from "./ImageConverter.jsx";
import pdfTools from "../data/pdfTools.js";

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="main-content">
        <div className="container">
          <section className="hero-card card">
            <div className="hero-copy">
              <h2 className="section-title">Fast PDF tools & image conversion</h2>
              <p className="section-subtitle">
                Manage your files like a pro: merge, split, compress, and convert images with a modern, responsive interface.
              </p>
            </div>
          </section>

          <section className="card tool-section">
            <div className="section-heading">
              <h3>Popular PDF Tools</h3>
              <p>Quick access to the most common PDF actions—modeled after premium converters.</p>
            </div>
            <ToolGrid tools={pdfTools} />
          </section>

          <section className="card converter-section">
            <div className="section-heading">
              <h3>Image Conversion</h3>
              <p>Upload images, choose your options, and download converted files instantly.</p>
            </div>
            <ImageConverter />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
