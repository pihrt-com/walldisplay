
# Wall Display!
Wall Display is software that runs on Raspberry Pi 3+ and displays the status of the print farm on a monitor (VGA, HDMI, etc.). The status is loaded locally via a LAN network using tokens and printer IP addresses (set in the config file). Wall Display does not load state outside the local network (no cloud required).

Printers:
-   Prusa XL (LAN)  
-   Prusa MK4 (LAN)
-   Prusa MK3 farm (USB → PrusaLink multi-instance)
-   Raise3D (LAN)

[![](https://github.com/pihrt-com/walldisplay/blob/main/www%20test%20local/final_screen.png?raw=true)](https://github.com/pihrt-com/walldisplay/blob/main/www%20test%20local/final_screen.png

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

Reverse proxy on FastAPI:
GET /api/status
-   `/api → http://127.0.0.1:8000` 

## URL 
`http://localhost/ → wallboard UI`
` http://localhost/api/status → JSON data`

## Backend
-   `prusa_link.py` – local PrusaLink (XL, MK4, MK3)
-   `prusa_farm.py` – multi-instance MK3
-   `raise3d.py` – (not ready)
-   only one **JSON format**
    
### Backend output (JSON)

`[  {  "name":  "MK3-08",  "model":  "MK3",  "state":  "printing",  "progress":  98,  "time_left":  163,  "temps":  {  "nozzle":  220,  "bed":  60  }  }  ]`

# Wallboard for real-time monitoring of a 3D printing farm.

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
Gray <-> Not printing / idle
Yellow <-> Printing in progress
Orange <-> Nearing completion
Red <-> Error

## Updates data
Data every 5 seconds
Time every 1 second

# Reinstalling on a new Raspberry Pi

## BACKEND
sudo apt update
sudo apt install -y python3 python3-venv nginx
cd /opt
git clone pihrt-com/walldisplay
cd walldisplay
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

## FASTAPI SERVICE
sudo systemctl enable walldisplay
sudo systemctl start walldisplay

## NGINX
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


sudo ln -s /etc/nginx/sites-available/wallboard /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

sudo systemctl daemon-reexec
sudo systemctl daemon-reload
sudo systemctl enable walldisplay
sudo systemctl start walldisplay

systemctl status walldisplay
logs: 
journalctl -u wallboard -f

## KIOSK
sudo apt install -y chromium unclutter
xset s off
xset -dpms

/opt/walldisplay/app/
├── main.py
├── aggregator.py
├── config.py
└── printers/
    ├─ init.py
    ├─ prusalink.py
    ├─ raise3d.py    
    └─ prusafarm.py

## Test
cd /opt/walldisplay
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000