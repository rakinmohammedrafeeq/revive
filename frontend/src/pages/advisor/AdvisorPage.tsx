import { Brain, TrendingUp, Briefcase, PiggyBank, Bot } from 'lucide-react';
import { AdvisorChat } from '../../components/advisor/AdvisorChat';
import { FinancialInsights } from '../../components/advisor/FinancialInsights';
import { AgentChat } from '../../components/agent/AgentChat';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';

export const AdvisorPage = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold">AI Tools</h1>
          <p className="text-muted-foreground">
            Investment advice, financial insights, and an agent that can query and manage your records
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <Tabs defaultValue="advisor">
        <TabsList>
          <TabsTrigger value="advisor" id="tab-ai-advisor">
            <Brain className="h-4 w-4" />
            AI Advisor
          </TabsTrigger>
          <TabsTrigger value="agent" id="tab-ai-agent">
            <Bot className="h-4 w-4" />
            AI Agent
          </TabsTrigger>
        </TabsList>

        {/* ── AI Advisor tab — unchanged from the original AdvisorPage ── */}
        <TabsContent value="advisor" className="space-y-6 mt-4">
          {/* Info Banner */}
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-purple-900 dark:text-purple-100">
                  Powered by RAG (Retrieval-Augmented Generation)
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  This AI advisor analyzes your actual financial records and provides professional
                  investment advice, portfolio recommendations, and wealth-building strategies.
                  All data stays secure in your database.
                </p>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdvisorChat />
            <FinancialInsights />
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Investment Advice</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Get recommendations on stocks, mutual funds, real estate, and other investment opportunities
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Portfolio Planning</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive personalized portfolio allocation strategies based on your financial capacity
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Wealth Building</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Get actionable advice on savings, tax planning, and long-term wealth creation
              </p>
            </div>
          </div>
        </TabsContent>

        {/* ── AI Agent tab ── */}
        <TabsContent value="agent" className="space-y-6 mt-4">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                  Tool-Calling Agent — reads real data, writes require your confirmation
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Unlike the advisor, the agent queries your actual transactions using live tools.
                  It can summarise spending, find records semantically, and create or update
                  transactions — but every write action pauses for your explicit approval first.
                </p>
              </div>
            </div>
          </div>

          {/* Agent chat — full width on this tab */}
          <AgentChat />
        </TabsContent>
      </Tabs>
    </div>
  );
};
