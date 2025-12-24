# ===== PRUSA XL + MK4 (LAN) =====
PRUSA_LINK_PRINTERS = [
    {
        "name": "XL-01",
        "model": "XL 5H",
        "url": "http://192.168.88.179",
        "api_key": "API_KEY_XL"
    },
    {
        "name": "MK4-01",
        "model": "MK4",
        "url": "http://192.168.88.180",
        "api_key": "API_KEY_MK4"
    }
]

# ===== MK3 FARM (USB → PrusaLink multi-instance) =====
PRUSA_FARM = {
    "base_url": "http://192.168.88.175",
    "printers": [
        {
            "name": "MK3-01",
            "instance": 1,
            "api_key": "API_KEY_1"
        },
        {
            "name": "MK3-02",
            "instance": 2,
            "api_key": "API_KEY_2"
        },
        {
            "name": "MK3-03",
            "instance": 3,
            "api_key": "API_KEY_3"
        },
        {
            "name": "MK3-04",
            "instance": 4,
            "api_key": "API_KEY_4"
        },
        {
            "name": "MK3-05",
            "instance": 5,
            "api_key": "API_KEY_5"
        },
        {
            "name": "MK3-06",
            "instance": 6,
            "api_key": "API_KEY_6"
        },
        {
            "name": "MK3-07",
            "instance": 7,
            "api_key": "API_KEY_7"
        },
        {
            "name": "MK3-08",
            "instance": 8,
            "api_key": "API_KEY_8"
        },
        {
            "name": "MK3-09",
            "instance": 9,
            "api_key": "API_KEY_9"
        },
        {
            "name": "MK3-10",
            "instance": 10,
            "api_key": "API_KEY_10"
        },
        {
            "name": "MK3-11",
            "instance": 11,
            "api_key": "API_KEY_11"
        },
        {
            "name": "MK3-12",
            "instance": 12,
            "api_key": "API_KEY_12"
        },
        {
            "name": "MK3-13",
            "instance": 13,
            "api_key": "API_KEY_13"
        }
    ]
}
