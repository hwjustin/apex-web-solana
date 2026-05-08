import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WalletProvider } from "./contexts/WalletProvider";
import Home from "./pages/Home";
import Campaign from "./pages/Campaign";
import Demo from "./pages/Demo";
import Publisher from "./pages/Publisher";
import Dashboard from "./pages/Dashboard";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/campaign"} component={Campaign} />
      <Route path={"/demo"} component={Demo} />
      <Route path={"/publisher"} component={Publisher} />
      <Route path={"/dashboard"} component={Dashboard} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <WalletProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </WalletProvider>
    </ErrorBoundary>
  );
}

export default App;
