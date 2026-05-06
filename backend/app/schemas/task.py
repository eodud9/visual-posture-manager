from pydantic import BaseModel
from datetime import datetime

class TaskCreate(BaseModel):
    title: str

class TaskResponse(BaseModel):
    taskId: int
    message: str

class TaskListResponse(BaseModel):
    taskId: int
    title: str
    createdAt: datetime

class TaskUpdate(BaseModel):
    title: str

class TaskUpdateResponse(BaseModel):
    taskId: int
    title: str
    message: str