import React from "react"
import ReactDOM from "react-dom/client"
import App from "./app.jsx"
import "./index.css"
import "./styles/base.css"
import { ThemeProvider } from "./components/theme-provider.jsx"
import { Toaster } from "./components/ui/toaster"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="todo-theme">
      <App />
      <Toaster />
    </ThemeProvider>
  </React.StrictMode>,
)
