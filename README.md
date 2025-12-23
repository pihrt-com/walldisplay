# Wall Display!
Wall Display is software that runs on Raspberry Pi 3+ and displays the status of the print farm on a monitor (VGA, HDMI, etc.). The status is loaded locally via a LAN network using tokens and printer IP addresses (set in the config file). Wall Display does not load state outside the local network (no cloud required).

Printers:
-   Prusa XL (LAN)  
-   Prusa MK4 (LAN)
-   Prusa MK3 farm (USB → PrusaLink multi-instance)
-   (Raise3D – not ready)

[![](https://github.com/pihrt-com/walldisplay/blob/main/www%20test%20local/final_screen.png?raw=true)](https://github.com/pihrt-com/walldisplay/blob/main/www%20test%20local/final_screen.png

### Python libraries
- Tested in  **Python 3.13** runs in **virtualenv** (`venv`)
-   `fastapi`  
-   `uvicorn`
-   `requests`    
-   `pydantic`

### WEB SERVER Nginx
-   `index.html`
-   `style.css`
-   `app.js`
-   `logo.png`
-   `favicon.png`

Reverse proxy on FastAPI:
GET /api/status
-   `/api → http://127.0.0.1:8000` 

### URL 
`http://localhost/ → wallboard UI`
` http://localhost/api/status → JSON data`

### backend
-   `prusa_link.py` – local PrusaLink (XL, MK4, MK3)
-   `prusa_farm.py` – multi-instance MK3
-   `raise3d.py` – (not ready)
-   only one **JSON format**
    
### Backend output (JSON)

`[  {  "name":  "MK3-08",  "model":  "MK3",  "state":  "printing",  "progress":  98,  "time_left":  163,  "temps":  {  "nozzle":  220,  "bed":  60  }  }  ]`




