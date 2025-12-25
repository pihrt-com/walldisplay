# Walldisplay for real-time monitoring of a 3D printing farm.

## Where does it run?
Raspberry Pi 3+
Raspberry Pi OS
connected to a monitor (HDMI)

## How do I access it?
Locally on the monitor (kiosk)
or from the LAN:
http://IP_RASPBERRY/

## What does it display?
status of all printers
print progress (%)
remaining time
ETA (end date/time)
nearest print end
visual alerts (color changes)

## Meaning of colors
Color <-> Meaning
- Gray <-> Not printing / idle
- Yellow <-> Printing in progress
- Orange <-> Nearing completion
- Red <-> Error

## Updates data
- Data every 5 seconds
- Time every 1 second

Printers:
-   Prusa XL (LAN)  
-   Prusa MK4 (LAN)
-   Prusa MK3 farm (USB → PrusaLink multi-instance)
-   Raise3D (LAN)

[![](https://github.com/pihrt-com/walldisplay/blob/main/www%20test%20example/final_screen.png?raw=true)](https://github.com/pihrt-com/walldisplay/blob/main/www%20test%20example/final_screen.png)


## Remote json export
- POST https://pihrt.com/walldisplay/update
- Authorization: Bearer SECRET_TOKEN


## Python libraries
- Tested in  **Python 3.13** runs in **virtualenv** (`venv`)
-   `fastapi`  
-   `uvicorn`
-   `requests`    
-   `pydantic`

## WEB SERVER Nginx
-   `index.html`
-   `style.css`
-   `app.js`
-   `logo.png`
-   `favicon.png`

On remote webpage (SECRET_TOKEN):
-   `index.html`
-   `style.css`
-   `app.js`
-   `logo.png`
-   `favicon.png`
-   `update.php`

Reverse proxy on FastAPI:
GET /api/status
-   `/api → http://127.0.0.1:8000` 

## URL 
- `http://localhost/ → wallboard UI`
- `http://localhost/api/status → JSON data`

## Backend
-   `prusa_link.py` – local PrusaLink (XL, MK4, MK3)
-   `prusa_farm.py` – multi-instance MK3
-   `raise3d.py` – (Pro2+, Pro3+)
-   only one **JSON format**
    
### Backend output (JSON)
```
{
  "generated_at": 1766676643,
  "printers": [{"name":"XL-01","vendor":"Prusa","model":"XL 5H","state":"printing","job":null,"progress":60.0,"time_left":16320,"temps":{"nozzle":220.0,"bed":60.0}},{"name":"MK4-01","vendor":"Prusa","model":"MK4","state":"printing","job":null,"progress":87.0,"time_left":3660,"temps":{"nozzle":220.3,"bed":60.0}},{"name":"MK3-09","vendor":"Prusa","model":"MK3","state":"printing","job":null,"progress":88.0,"time_left":163},{"name":"MK3-03","vendor":"Prusa","model":"MK3","state":"idle","job":null,"progress":0,"time_left":null},{"name":"MK3-07","vendor":"Prusa","model":"MK3","state":"idle","job":null,"progress":0,"time_left":null},{"name":"MK3-13","vendor":"Prusa","model":"MK3","state":"error","job":null,"progress":0,"time_left":null},{"name":"MK3-12","vendor":"Prusa","model":"MK3","state":"idle","job":null,"progress":0,"time_left":null},{"name":"MK3-10","vendor":"Prusa","model":"MK3","state":"printing","job":null,"progress":60,"time_left": 850},{"name":"MK3-08","vendor":"Prusa","model":"MK3","state":"printing","job":null,"progress":98.0,"time_left":163},{"name":"MK3-11","vendor":"Prusa","model":"MK3","state":"idle","job":null,"progress":0,"time_left":null},{"name":"MK3-02","vendor":"Prusa","model":"MK3","state":"idle","job":null,"progress":0,"time_left":null},{"name":"MK3-06","vendor":"Prusa","model":"MK3","state":"idle","job":null,"progress":0,"time_left":null},{"name":"MK3-05","vendor":"Prusa","model":"MK3","state":"idle","job":null,"progress":0,"time_left":null},{"name":"MK3-01","vendor":"Prusa","model":"MK3","state":"idle","job":null,"progress":0,"time_left":null},{"name":"MK3-04","vendor":"Prusa","model":"MK3","state":"idle","job":null,"progress":0,"time_left":null}]
}  
```

# Reinstalling on a new Raspberry Pi

## BACKEND
```
sudo apt update
sudo apt install -y python3 python3-venv nginx
cd /opt
git clone pihrt-com/walldisplay
cd walldisplay
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## FASTAPI SERVICE
```
sudo systemctl enable walldisplay
sudo systemctl start walldisplay
```

## NGINX
```
sudo apt install -y nginx
sudo mkdir /var/www/walldisplay
sudo chown -R www-data:www-data /var/www/walldisplay
sudo nano /etc/nginx/sites-available/walldisplay

server {
    listen 80;
    server_name _;
    root /var/www/walldisplay;
    index index.html;
    location / {
        try_files $uri $uri/ =404;
    }
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```
sudo ln -s /etc/nginx/sites-available/wallboard /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

```
sudo systemctl daemon-reexec
sudo systemctl daemon-reload
sudo systemctl enable walldisplay
sudo systemctl start walldisplay
```
```
systemctl status walldisplay
```
Logs:
```
journalctl -u wallboard -f
```

## KIOSK
```
sudo apt install -y chromium unclutter
xset s off
xset -dpms
```

```
/opt/walldisplay/app/
├── main.py
├── aggregator.py
├── remote_export.py
├── config.py
└── printers/
    ├─ init.py
    ├─ prusa_link.py
    ├─ raise3d.py    
    └─ prusa_farm.py
```

## Test
cd /opt/walldisplay
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
