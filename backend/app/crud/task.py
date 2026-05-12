from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate

def create_task(db: Session, body: TaskCreate):
    task = Task(
        title = body.title
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task

def get_tasks(db: Session):
    return db.query(Task).order_by(Task.created_at.desc()).all()

def update_task(db: Session, task_id: int, body: TaskUpdate):
    task = db.query(Task).filter(
        Task.task_id == task_id
    ).first()

    if task is None:
        raise HTTPException(status_code = 404, detail = "할 일을 찾을 수 없습니다.")

    task.title = body.title

    db.commit()
    db.refresh(task)

    return task

def delete_task(db: Session, task_id: int):
    task = db.query(Task).filter(
        Task.task_id == task_id
    ).first()

    if task is None:
        raise HTTPException(status_code=404, detail="할 일을 찾을 수 없습니다.")

    db.delete(task)
    db.commit()

    return task