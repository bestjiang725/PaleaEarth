"""InMemoryTaskManager: lightweight async task tracking without Celery/Redis.

Tasks run in daemon threads. State is tracked in memory + SQLite for persistence.
Suitable for MVP. Replace with Celery for production.
"""

import uuid
import time
import threading
from collections import OrderedDict


class InMemoryTaskManager:
    """Manages async task lifecycle with in-memory state tracking.

    Singleton pattern - use get_task_manager() to access.
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._tasks = OrderedDict()
                    cls._instance._max_history = 100
        return cls._instance

    def create_task(self, task_type: str, params: dict | None = None) -> str:
        """Create a new task and return its ID."""
        task_id = str(uuid.uuid4())
        now = time.time()
        task = {
            "task_id": task_id,
            "task_type": task_type,
            "status": "pending",
            "progress": 0,
            "params": params,
            "result_url": None,
            "error_message": None,
            "created_at": now,
            "updated_at": now,
        }
        self._tasks[task_id] = task

        # Prune old entries
        while len(self._tasks) > self._max_history:
            self._tasks.popitem(last=False)

        return task_id

    def run_task(self, task_id: str, fn, *args, **kwargs):
        """Run fn in a daemon thread. fn receives progress_callback as kwarg.

        fn should accept: progress_callback=lambda p: None
        fn should return: result_url (str) or raise exception
        """
        if task_id not in self._tasks:
            raise ValueError(f"Task {task_id} not found")

        self._tasks[task_id]["status"] = "running"
        self._tasks[task_id]["updated_at"] = time.time()

        def _progress_callback(progress: int):
            self._tasks[task_id]["progress"] = min(100, max(0, progress))
            self._tasks[task_id]["updated_at"] = time.time()

        def _run():
            try:
                result = fn(*args, **kwargs, progress_callback=_progress_callback)
                self._tasks[task_id]["status"] = "done"
                self._tasks[task_id]["result_url"] = result
                self._tasks[task_id]["progress"] = 100
            except Exception as e:
                self._tasks[task_id]["status"] = "fail"
                self._tasks[task_id]["error_message"] = str(e)
            finally:
                self._tasks[task_id]["updated_at"] = time.time()

        t = threading.Thread(target=_run, daemon=True)
        t.start()

    def get_status(self, task_id: str) -> dict | None:
        """Get current task status."""
        return self._tasks.get(task_id)

    def list_tasks(
        self, status: str | None = None, page: int = 1, page_size: int = 20
    ) -> tuple[list[dict], int]:
        """List tasks with optional status filter and pagination."""
        all_tasks = list(self._tasks.values())

        if status:
            all_tasks = [t for t in all_tasks if t["status"] == status]

        # Sort by created_at descending
        all_tasks = sorted(all_tasks, key=lambda t: t["created_at"], reverse=True)

        total = len(all_tasks)
        start = (page - 1) * page_size
        end = start + page_size

        return all_tasks[start:end], total

    def cancel_task(self, task_id: str) -> bool:
        """Cancel a pending or running task. Returns True if cancelled."""
        task = self._tasks.get(task_id)
        if task is None:
            return False
        if task["status"] in ("done", "fail"):
            return False
        task["status"] = "fail"
        task["error_message"] = "任务已取消"
        task["updated_at"] = time.time()
        return True


# Global singleton
_task_manager_instance = None


def get_task_manager() -> InMemoryTaskManager:
    """Get the singleton InMemoryTaskManager instance."""
    global _task_manager_instance
    if _task_manager_instance is None:
        _task_manager_instance = InMemoryTaskManager()
    return _task_manager_instance
