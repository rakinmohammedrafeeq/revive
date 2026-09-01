import { useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Sparkles, Loader2 } from 'lucide-react';
import { useActiveInsights, useGenerateInsights } from '../../hooks/useAdvisor';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import type { FinancialInsight } from '../../types/advisor';

const getInsightIcon = (type: FinancialInsight['insightType']) => {
  switch (type) {
    case 'budget':
      return DollarSign;
    case 'savings':
      return PiggyBank;
    case 'spending':
      return TrendingDown;
    case 'investment':
      return TrendingUp;
    default:
      return Sparkles;
  }
};

const getPriorityColor = (priority: FinancialInsight['priority']) => {
  switch (priority) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'default';
  }
};

export const FinancialInsights = () => {
  const { currentWorkspace } = useWorkspace();
  const { data: insights, isLoading } = useActiveInsights(currentWorkspace?.id);
  const generateMutation = useGenerateInsights();

  const handleGenerate = () => {
    if (!currentWorkspace) {
      return;
    }
    generateMutation.mutate(currentWorkspace.id);
  };

  // Auto-generate insights on mount (like Dashboard does)
  useEffect(() => {
    if (currentWorkspace?.id && !generateMutation.isPending) {
      console.log('Auto-generating insights on page load...');
      generateMutation.mutate(currentWorkspace.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <CardTitle>AI Financial Insights</CardTitle>
            </div>
            <CardDescription>
              Personalized recommendations for <strong>{currentWorkspace?.name || 'your workspace'}</strong> based on your spending patterns
            </CardDescription>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !currentWorkspace}
            size="sm"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!insights || insights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No insights yet for {currentWorkspace?.name || 'this workspace'}</p>
            <p className="text-sm">
              Click "Generate Insights" to analyze your finances
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => {
              const Icon = getInsightIcon(insight.insightType);
              
              return (
                <div
                  key={insight.id}
                  className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{insight.title}</h4>
                      <Badge variant={getPriorityColor(insight.priority)}>
                        {insight.priority}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {insight.insightType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {insight.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(insight.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
