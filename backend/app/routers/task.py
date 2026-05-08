from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.task import (
    TaskCreate,
    TaskResponse,
    TaskListResponse,
    TaskUpdate,
    TaskUpdateResponse
)
from app.crud.task import create_task, get_tasks, update_task, delete_task

router = APIRouter(prefix = "/tasks", tags = ["Tasks"])


@router.post("", response_model = TaskResponse)
def save_task(body: TaskCreate, db: Session = Depends(get_db)):
    task = create_task(db, body)

    return {
        "taskId": task.task_id,
        "message": "할 일 저장 성공"
    }


@router.get("", response_model = List[TaskListResponse])
def read_tasks(db: Session = Depends(get_db)):
    tasks = get_tasks(db)

    return [
        {
            "taskId": task.task_id,
            "title": task.title,
            "createdAt": task.created_at
        }
        for task in tasks
    ]


@router.patch("/{task_id}", response_model = TaskUpdateResponse)
def edit_task(
    task_id: int,
    body: TaskUpdate,
    db: Session = Depends(get_db)
):
    task = update_task(db, task_id, body)

    return {
        "taskId": task.task_id,
        "title": task.title,
        "message": "할 일 수정 성공"
    }

@router.delete("/{task_id}")
def remove_task(task_id: int, db: Session = Depends(get_db)):
    task = delete_task(db, task_id)

    return {
        "taskId": task.task_id,
        "message": "할 일 삭제 성공"
    }