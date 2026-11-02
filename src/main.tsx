import React, { Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";
class Boundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: "" };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  render() {
    return this.state.error ? (
      <div
        style={{
          padding: 40,
          color: "white",
          background: "#141820",
          height: "100vh",
        }}
      >
        <h1>Unable to initialize the viewport</h1>
        <p>{this.state.error}</p>
        <p>Use a desktop browser with WebGL hardware acceleration enabled.</p>
        <button onClick={() => location.reload()}>Reload</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <Boundary>
    <App />
  </Boundary>,
);
