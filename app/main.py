from fastapi import FastAPI
from app.aggregator import collect
from app.history import get_power_history, get_sensor_history

app = FastAPI()


@app.get("/api/status")
def status():
    return collect()


@app.get("/api/power_history")
def power_history():
    return get_power_history()


@app.get("/api/sensor_history")
def sensor_history():
    return get_sensor_history()
