from fastapi import FastAPI
from app.aggregator import collect

app = FastAPI()


@app.get("/api/status")
def status():
    return collect()
