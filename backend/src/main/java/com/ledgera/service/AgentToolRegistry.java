package com.ledgera.service;

import com.ledgera.enums.WorkspacePermission;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Builds the RBAC-filtered list of tool schemas sent to the LLM for each agent request.
 *
 * <p>VIEWER users receive only the 4 read tools.
 * EDITOR and OWNER users receive all 7 (read + write).
 *
 * <p>The schemas match exactly the definitions in the approved tool_schemas.md document.
 * No external state — all schemas are pure immutable Maps.
 */
@Component
public class AgentToolRegistry {

    private static final Set<String> WRITE_TOOLS = Set.of("create_transaction", "update_transaction", "delete_transaction");

    /**
     * Returns the tools the calling user is permitted to use based on their workspace permission.
     */
    public List<Map<String, Object>> buildToolList(WorkspacePermission permission) {
        List<Map<String, Object>> tools = new ArrayList<>(readToolSchemas());
        if (permission == WorkspacePermission.EDITOR || permission == WorkspacePermission.OWNER) {
            tools.addAll(writeToolSchemas());
        }
        return tools;
    }

    public boolean isWriteTool(String toolName) {
        return WRITE_TOOLS.contains(toolName);
    }

    // ── Read tools (VIEWER, EDITOR, OWNER) ────────────────────────────────────

    private List<Map<String, Object>> readToolSchemas() {
        return List.of(
            buildTool("get_transactions",
                "Retrieves a paginated list of financial transactions in a workspace. "
                + "Supports optional date range, category, and type filters. "
                + "Returns the transaction ID, amount, type (INCOME/EXPENSE), category, date, and description for each record. "
                + "IMPORTANT: Always call this first when the user wants to update or delete a transaction "
                + "(e.g., 'delete last expense', 'update recent transaction') to get the actual transaction IDs. "
                + "The transactions are ordered by date descending (most recent first). "
                + "Use page/size to control how many results you fetch.",
                Map.of(
                    "type", "object",
                    "properties", Map.of(
                        "workspace_id", intParam("The workspace ID to query."),
                        "start_date",   strParam("Filter records on or after this date (YYYY-MM-DD). Optional."),
                        "end_date",     strParam("Filter records on or before this date (YYYY-MM-DD). Optional."),
                        "category",     strParam("Exact category name to filter by (e.g. 'Food', 'Salary'). Optional."),
                        "type",         enumParam("Filter by transaction type. Optional.", "INCOME", "EXPENSE"),
                        "page",         intParamDefault("Zero-based page number. Defaults to 0.", 0),
                        "size",         intParamDefault("Records per page. Defaults to 20, maximum 50.", 20)
                    ),
                    "required", List.of("workspace_id")
                )),
            buildTool("get_spending_summary",
                "Returns aggregated financial totals for a workspace over an optional time window: "
                + "total income, total expenses, net balance, record count, and a ranked breakdown of "
                + "expenses by category. "
                + "Use this to answer questions like 'How much did we spend in March?' or "
                + "'What are my top expense categories this quarter?'",
                Map.of(
                    "type", "object",
                    "properties", Map.of(
                        "workspace_id", intParam("The workspace ID to summarize."),
                        "start_date",   strParam("Period start date inclusive (YYYY-MM-DD). Omit for all time."),
                        "end_date",     strParam("Period end date inclusive (YYYY-MM-DD). Omit for all time.")
                    ),
                    "required", List.of("workspace_id")
                )),
            buildTool("get_monthly_trends",
                "Returns month-by-month income and expense totals for a workspace, ordered chronologically. "
                + "Useful for trend analysis: 'Is my spending increasing?', 'Which month had the highest income?'",
                Map.of(
                    "type", "object",
                    "properties", Map.of(
                        "workspace_id", intParam("The workspace ID to analyze.")
                    ),
                    "required", List.of("workspace_id")
                )),
            buildTool("search_records",
                "Semantically searches financial records using pgvector similarity — finds records "
                + "related to the query concept even without exact keyword matches. "
                + "Use for queries like 'Find travel expenses' or 'Show me anything medical-related.'",
                Map.of(
                    "type", "object",
                    "properties", Map.of(
                        "workspace_id", intParam("The workspace ID to search in."),
                        "query",        strParam("Natural language description of what to find."),
                        "limit",        intParamDefault("Maximum results to return. Defaults to 10, maximum 20.", 10)
                    ),
                    "required", List.of("workspace_id", "query")
                ))
        );
    }

    // ── Write tools (EDITOR, OWNER only) ──────────────────────────────────────

    private List<Map<String, Object>> writeToolSchemas() {
        return List.of(
            buildTool("create_transaction",
                "Creates a new financial transaction in the workspace. "
                + "This is a WRITE operation — the user will be asked to confirm before anything is saved. "
                + "Do NOT call this unless the user has explicitly asked to add or record a transaction. "
                + "Valid INCOME categories: Salary, Freelance, Business, Investment, Bonus, Interest, "
                + "Rental Income, Refund, Other. "
                + "Valid EXPENSE categories: Food, Groceries, Shopping, Transportation, Fuel, Bills, Rent, "
                + "EMI, Entertainment, Healthcare, Education, Travel, Subscription, Insurance, Gifts, "
                + "Taxes, Investment, Savings, Other.",
                Map.of(
                    "type", "object",
                    "properties", Map.of(
                        "workspace_id", intParam("The workspace where the transaction will be created."),
                        "amount",       numParam("Positive decimal amount (e.g. 250.00)."),
                        "type",         enumParam("INCOME or EXPENSE.", "INCOME", "EXPENSE"),
                        "category",     strParam("Category name from the lists above."),
                        "date",         strParam("Transaction date in YYYY-MM-DD format."),
                        "description",  strParam("Optional short description (max 500 characters).")
                    ),
                    "required", List.of("workspace_id", "amount", "type", "category", "date")
                )),
            buildTool("update_transaction",
                "Updates one or more fields on an existing financial transaction. "
                + "This is a WRITE operation — the user will be asked to confirm before anything changes. "
                + "Only provide fields you want to change; omitted fields keep their current values. "
                + "Do NOT call this unless the user has explicitly asked to edit or correct a transaction.",
                Map.of(
                    "type", "object",
                    "properties", Map.of(
                        "transaction_id", intParam("The ID of the transaction to update."),
                        "workspace_id",   intParam("The workspace the transaction belongs to."),
                        "amount",         numParam("New amount. Optional — omit to leave unchanged."),
                        "type",           enumParam("New type. Optional.", "INCOME", "EXPENSE"),
                        "category",       strParam("New category. Optional — omit to leave unchanged."),
                        "date",           strParam("New date (YYYY-MM-DD). Optional — omit to leave unchanged."),
                        "description",    strParam("New description. Optional — omit to leave unchanged.")
                    ),
                    "required", List.of("transaction_id", "workspace_id")
                )),
            buildTool("delete_transaction",
                "Deletes an existing financial transaction permanently. "
                + "This is a DESTRUCTIVE WRITE operation — the user will be asked to confirm before deletion. "
                + "Once deleted, the transaction cannot be recovered. "
                + "Do NOT call this unless the user has explicitly asked to delete or remove a transaction. "
                + "Always show the transaction details in the confirmation summary so the user knows what will be deleted.",
                Map.of(
                    "type", "object",
                    "properties", Map.of(
                        "transaction_id", intParam("The ID of the transaction to delete."),
                        "workspace_id",   intParam("The workspace the transaction belongs to.")
                    ),
                    "required", List.of("transaction_id", "workspace_id")
                ))
        );
    }

    // ── Schema builder helpers ─────────────────────────────────────────────────

    private Map<String, Object> buildTool(String name, String description, Map<String, Object> parameters) {
        return Map.of(
                "type", "function",
                "function", Map.of(
                        "name", name,
                        "description", description,
                        "parameters", parameters
                )
        );
    }

    private Map<String, Object> intParam(String description) {
        return Map.of("type", "integer", "description", description);
    }

    private Map<String, Object> intParamDefault(String description, int defaultValue) {
        return Map.of("type", "integer", "description", description, "default", defaultValue);
    }

    private Map<String, Object> strParam(String description) {
        return Map.of("type", "string", "description", description);
    }

    private Map<String, Object> numParam(String description) {
        return Map.of("type", "number", "description", description);
    }

    private Map<String, Object> enumParam(String description, String... values) {
        return Map.of("type", "string", "description", description, "enum", List.of(values));
    }
}
