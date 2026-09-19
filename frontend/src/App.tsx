import { BrowserRouter, Route, Routes } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { WorkspaceProvider } from "@/context/WorkspaceContext"
import { InboxPage } from "@/pages/Inbox"
import { LandingPage } from "@/pages/Landing"
import { StatsPage } from "@/pages/Stats"

export default function App() {
  return (
    <TooltipProvider>
      <WorkspaceProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/inbox" element={<InboxPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </WorkspaceProvider>
    </TooltipProvider>
  )
}
