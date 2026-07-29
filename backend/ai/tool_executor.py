"""
backend/ai/tool_executor.py
=============================
GET Solar Energy — Enterprise AI Assistant Tool Executor
Phase 13.0D

Executes tools by delegating to existing service-layer functions.
Validates inputs, checks permissions, audits, monitors, and returns
standardized results. Never accesses the database directly.
"""

import time
import logging
from typing import Any, Dict, List, Optional

from .tool_registry import get_tool_registry
from .guardrails import Guardrails

logger = logging.getLogger(__name__)


class ToolExecutor:
    """Executes tools via existing service-layer functions."""

    _instance: Optional["ToolExecutor"] = None

    def __new__(cls) -> "ToolExecutor":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._registry = get_tool_registry()
        self._guardrails = Guardrails()
        self._initialized = True

    def execute(
        self,
        tool_name: str,
        params: Dict[str, Any],
        *,
        user_role: str,
        user_email: str = "",
        db=None,
    ) -> Dict[str, Any]:
        """
        Execute a single tool by name.

        Returns a standardized result dict with keys:
            tool, success, data, error, latency_ms
        """
        t0 = time.time()

        # 1. Look up tool
        tool = self._registry.get(tool_name)
        if tool is None:
            return self._result(tool_name, False, error=f"Unknown tool: {tool_name}", t0=t0)

        # 2. Sanitize input
        params = self._guardrails.sanitize_input(params)

        # 3. Validate input
        valid, err = self._guardrails.validate_input(params, tool.input_schema)
        if not valid:
            return self._result(tool_name, False, error=err, t0=t0)

        # 4. Check permissions
        allowed, err = self._guardrails.check_permissions(tool.permissions, user_role)
        if not allowed:
            return self._result(tool_name, False, error=err, t0=t0)

        # 5. Execute
        try:
            data = self._dispatch(tool_name, params, db=db, user_email=user_email)
            return self._result(tool_name, True, data=data, t0=t0)
        except Exception as e:
            logger.exception("Tool execution failed: %s", tool_name)
            return self._result(tool_name, False, error=str(e), t0=t0)

    def execute_plan(
        self,
        steps: List[Any],
        *,
        user_role: str,
        user_email: str = "",
        db=None,
    ) -> List[Dict[str, Any]]:
        """Execute a list of ToolStep objects sequentially."""
        results = []
        for step in steps:
            result = self.execute(
                step.tool, step.params,
                user_role=user_role, user_email=user_email, db=db,
            )
            results.append(result)
            # Stop on critical failure (permission denied)
            if not result["success"] and "permission" in (result.get("error") or "").lower():
                break
        return results

    def _dispatch(
        self,
        tool_name: str,
        params: Dict[str, Any],
        *,
        db=None,
        user_email: str = "",
    ) -> Any:
        """Route to the correct existing service function."""

        if tool_name == "c360_get":
            return self._call_c360(params, db)

        if tool_name == "crm_get_customer":
            return self._call_customer_get(params, db)

        if tool_name == "crm_create_task":
            return self._call_crm_create_task(params, db, user_email)

        if tool_name == "crm_installation":
            return self._call_crm_installation(params, db)

        if tool_name == "crm_amc":
            return self._call_crm_amc(params, db)

        if tool_name == "crm_payments":
            return self._call_crm_payments(params, db)

        if tool_name == "ai_analyze":
            return self._call_ai_analyze(params)

        if tool_name == "ai_recommend":
            return self._call_ai_recommend(params)

        if tool_name == "ai_explain":
            return self._call_ai_explain(params)

        if tool_name == "ai_customer_score":
            return self._call_ai_customer_score(params)

        if tool_name == "ai_solar_readiness":
            return self._call_ai_solar_readiness(params)

        if tool_name == "roi_calculate":
            return self._call_roi(params)

        if tool_name == "bill_analyze":
            return self._call_bill_analyze(params)

        if tool_name == "roof_analyze":
            return self._call_roof_analyze(params)

        if tool_name == "reports_generate":
            return self._call_reports(params, db)

        if tool_name == "crm_update_customer":
            return self._call_crm_update_customer(params, db, user_email)

        raise NotImplementedError(f"Tool dispatch not implemented: {tool_name}")

    # ------------------------------------------------------------------
    # CRM / Customer360 service calls
    # ------------------------------------------------------------------

    def _call_c360(self, params: Dict, db) -> Dict:
        from crm_service import get_customer_360
        from utils.responses import serialise
        cid = params.get("customer_id")
        if not cid:
            raise ValueError("customer_id required")
        result = get_customer_360(db, cid)
        return serialise(result) if result else {}

    def _call_customer_get(self, params: Dict, db) -> Dict:
        from customer_service import get_customer_by_id
        from utils.responses import serialise
        cid = params.get("customer_id")
        if not cid:
            raise ValueError("customer_id required")
        result = get_customer_by_id(db, cid)
        return serialise(result) if result else {}

    def _call_crm_create_task(self, params: Dict, db, user_email: str) -> Dict:
        from crm_service import create_task
        from crm_automation import run_crm_automations
        from crm_audit import record_audit
        from utils.responses import serialise
        task = create_task(db, params)
        if params.get("customer_id"):
            run_crm_automations(db, params["customer_id"])
            record_audit(
                db, action="task.created", module="AI Assistant",
                entity_type="Task", entity_id=task.id,
                user=user_email or "AI Assistant",
                new_value={"title": task.title, "priority": task.priority},
            )
        return serialise(task)

    def _call_crm_installation(self, params: Dict, db) -> Dict:
        from crm_service import get_installation
        from utils.responses import serialise
        cid = params.get("customer_id")
        if not cid:
            raise ValueError("customer_id required")
        result = get_installation(db, cid)
        return serialise(result) if result else {"status": "No installation record found"}

    def _call_crm_amc(self, params: Dict, db) -> Dict:
        from crm_service import get_amc
        from utils.responses import serialise
        cid = params.get("customer_id")
        if not cid:
            raise ValueError("customer_id required")
        result = get_amc(db, cid)
        return serialise(result) if result else {"status": "No AMC record found"}

    def _call_crm_payments(self, params: Dict, db) -> Dict:
        from crm_service import get_payments
        from utils.responses import serialise
        cid = params.get("customer_id")
        if not cid:
            raise ValueError("customer_id required")
        payments = get_payments(db, cid)
        return serialise(payments)

    def _call_crm_update_customer(self, params: Dict, db, user_email: str) -> Dict:
        from crm_service import _get_customer
        from crm_automation import run_crm_automations
        from crm_audit import record_audit
        from utils.responses import serialise
        cid = params.get("customer_id")
        if not cid:
            raise ValueError("customer_id required")
        customer = _get_customer(db, cid)
        if not customer:
            raise ValueError(f"Customer {cid} not found")
        old_data = serialise(customer)
        update_data = {k: v for k, v in params.items() if k != "customer_id" and v is not None}
        for k, v in update_data.items():
            if hasattr(customer, k):
                setattr(customer, k, v)
        db.commit()
        db.refresh(customer)
        run_crm_automations(db, cid)
        record_audit(
            db, action="customer.updated", module="AI Assistant",
            entity_type="Customer", entity_id=cid,
            user=user_email or "AI Assistant",
            old_value=old_data, new_value=serialise(customer),
        )
        return serialise(customer)

    # ------------------------------------------------------------------
    # AI Intelligence Engine calls
    # ------------------------------------------------------------------

    def _call_ai_analyze(self, params: Dict) -> Dict:
        from ml.ai_service import get_ai_service
        return get_ai_service().analyze_customer(params.get("customer_data", {}))

    def _call_ai_recommend(self, params: Dict) -> Dict:
        from ml.ai_service import get_ai_service
        result = get_ai_service().recommend(params.get("customer_data", {}))
        if isinstance(result, list):
            return {"recommendations": [r.to_dict() if hasattr(r, 'to_dict') else r for r in result]}
        return result

    def _call_ai_explain(self, params: Dict) -> Dict:
        from ml.ai_service import get_ai_service
        result = get_ai_service().explain(
            params.get("model_name", "bill_model"),
            params.get("prediction"),
            params.get("features_used"),
        )
        return result.to_dict() if hasattr(result, 'to_dict') else result

    def _call_ai_customer_score(self, params: Dict) -> Dict:
        from ml.ai_service import get_ai_service
        return get_ai_service().customer_score(params.get("customer_data", {}))

    def _call_ai_solar_readiness(self, params: Dict) -> Dict:
        from ml.ai_service import get_ai_service
        return get_ai_service().solar_readiness(params.get("customer_data", {}))

    # ------------------------------------------------------------------
    # ROI / Analysis service calls
    # ------------------------------------------------------------------

    def _call_roi(self, params: Dict) -> Dict:
        from roi import ROIRequest, calculate_roi
        import asyncio
        req = ROIRequest(**{k: v for k, v in params.items() if k in ROIRequest.__fields__})
        result = asyncio.get_event_loop().run_until_complete(calculate_roi(req))
        return result.get("data", result)

    def _call_bill_analyze(self, params: Dict) -> Dict:
        """Bill analysis from structured data (reuses inference engine)."""
        if not params:
            return {"message": "No bill data provided. Please provide monthly_units, per_unit_rate, and city."}
        from ml.ai_service import get_ai_service
        return get_ai_service().analyze_customer(params)

    def _call_roof_analyze(self, params: Dict) -> Dict:
        """Roof analysis from structured data (reuses inference engine)."""
        if not params:
            return {"message": "No roof data provided. Please provide length_ft, width_ft, and city."}
        monthly_units = params.get("length_ft", 0) * params.get("width_ft", 0) * 0.5
        customer_data = {"monthly_units": max(monthly_units, 150), "city": params.get("city", "Lucknow")}
        from ml.ai_service import get_ai_service
        return get_ai_service().analyze_customer(customer_data)

    # ------------------------------------------------------------------
    # Reports
    # ------------------------------------------------------------------

    def _call_reports(self, params: Dict, db) -> Dict:
        from crm_report_service import (
            generate_crm_report, generate_sales_report,
            generate_pipeline_report, generate_activity_report,
        )
        rt = params.get("report_type", "crm")
        dispatch = {
            "crm": generate_crm_report,
            "sales": generate_sales_report,
            "pipeline": generate_pipeline_report,
            "activity": generate_activity_report,
        }
        fn = dispatch.get(rt)
        if not fn:
            raise ValueError(f"Unknown report type: {rt}")
        csv_content = fn(db)
        return {"report_type": rt, "csv_content": csv_content, "line_count": len(csv_content.splitlines())}

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _result(tool: str, success: bool, data: Any = None, error: str = None, t0: float = 0) -> Dict:
        return {
            "tool": tool,
            "success": success,
            "data": data,
            "error": error,
            "latency_ms": round((time.time() - t0) * 1000, 2),
        }


def get_tool_executor() -> ToolExecutor:
    return ToolExecutor()
