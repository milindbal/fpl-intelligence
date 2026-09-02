import os
import json
import requests
import re
from bs4 import BeautifulSoup
import time

FPL_API_BASE = "https://fantasy.premierleague.com/api"
UNDERSTAT_EPL_URL = "https://understat.com/league/EPL"
DATA_DIR = "public/data"

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def fetch_fpl_bootstrap():
    print("Fetching FPL bootstrap static data...")
    response = requests.get(f"{FPL_API_BASE}/bootstrap-static/")
    response.raise_for_status()
    data = response.json()
    with open(os.path.join(DATA_DIR, "bootstrap.json"), "w") as f:
        json.dump(data, f)
    return data

def fetch_fpl_fixtures():
    print("Fetching FPL fixtures data...")
    response = requests.get(f"{FPL_API_BASE}/fixtures/")
    response.raise_for_status()
    data = response.json()
    with open(os.path.join(DATA_DIR, "fixtures.json"), "w") as f:
        json.dump(data, f)
    return data

def fetch_understat_players():
    print("Fetching Understat players data...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(UNDERSTAT_EPL_URL, headers=headers)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    scripts = soup.find_all('script')
    
    players_data = []
    for script in scripts:
        if script.string and 'playersData' in script.string:
            match = re.search(r"var playersData\s*=\s*JSON\.parse\('(.*?)'\);", script.string)
            if match:
                encoded_data = match.group(1)
                decoded_data = bytes(encoded_data, 'utf-8').decode('unicode_escape')
                players_data = json.loads(decoded_data)
                break
                
    understat_dir = os.path.join(DATA_DIR, "understat")
    ensure_dir(understat_dir)
    
    with open(os.path.join(understat_dir, "players.json"), "w") as f:
        json.dump(players_data, f)
        
    return players_data

def normalize_string(s):
    if not s:
        return ""
    # Remove accents, special characters, convert to lowercase
    import unicodedata
    s = ''.join(c for c in unicodedata.normalize('NFD', s)
                  if unicodedata.category(c) != 'Mn')
    s = re.sub(r'[^a-zA-Z0-9]', '', s).lower()
    return s

def normalize_data(fpl_data, understat_players):
    print("Normalizing data and generating player mappings...")
    fpl_players = fpl_data.get("elements", [])
    fpl_teams = {t["id"]: t["name"] for t in fpl_data.get("teams", [])}
    
    # Very basic initial mapping based on normalized web_name/first_name+second_name and team
    # A real robust system would need fuzzy matching and manual overrides
    
    mapping = {}
    normalized_players = []
    
    understat_dict = {}
    for p in understat_players:
        # Understat player name format varies, let's try to match on normalized name components
        norm_name = normalize_string(p['player_name'])
        understat_dict[norm_name] = p
        
    for fp in fpl_players:
        norm_web = normalize_string(fp['web_name'])
        norm_full = normalize_string(fp['first_name'] + fp['second_name'])
        
        us_match = None
        # Try full name first
        if norm_full in understat_dict:
            us_match = understat_dict[norm_full]
        # Then web name if it's reasonably long
        elif len(norm_web) > 3:
            for us_name, us_p in understat_dict.items():
                if norm_web in us_name or us_name in norm_web:
                    us_match = us_p
                    break
                    
        if us_match:
            mapping[str(fp['id'])] = us_match['id']
            
        # Create normalized player structure
        player_obj = {
            "id": fp["id"],
            "name": f"{fp['first_name']} {fp['second_name']}",
            "web_name": fp["web_name"],
            "teamId": fp["team"],
            "teamName": fpl_teams.get(fp["team"], "Unknown"),
            "position": ["GKP", "DEF", "MID", "FWD"][fp["element_type"] - 1],
            "price": fp["now_cost"] / 10.0,
            "fpl": {
                "totalPoints": fp["total_points"],
                "form": float(fp["form"]),
                "ownership": float(fp["selected_by_percent"]),
                "minutes": fp["minutes"],
                "goals": fp["goals_scored"],
                "assists": fp["assists"],
                "xG": float(fp["expected_goals"]),
                "xA": float(fp["expected_assists"]),
                "bonus": fp["bonus"],
                "bps": fp["bps"]
            }
        }
        
        if us_match:
            try:
                player_obj["underlying"] = {
                    "xG": float(us_match["xG"]),
                    "xA": float(us_match["xA"]),
                    "npxG": float(us_match["npxG"]),
                    "shots": int(us_match["shots"]),
                    "keyPasses": int(us_match["key_passes"]),
                    "xGChain": float(us_match["xGChain"]),
                    "xGBuildup": float(us_match["xGBuildup"])
                }
            except (ValueError, KeyError, TypeError):
                pass
                
        normalized_players.append(player_obj)
        
    with open(os.path.join(DATA_DIR, "player-mapping.json"), "w") as f:
        json.dump(mapping, f, indent=2)
        
    with open(os.path.join(DATA_DIR, "players.json"), "w") as f:
        json.dump(normalized_players, f)
        
    with open(os.path.join(DATA_DIR, "teams.json"), "w") as f:
        json.dump(fpl_data.get("teams", []), f)

    with open(os.path.join(DATA_DIR, "gameweeks.json"), "w") as f:
        json.dump(fpl_data.get("events", []), f)

def main():
    ensure_dir(DATA_DIR)
    fpl_data = fetch_fpl_bootstrap()
    fetch_fpl_fixtures()
    try:
        us_players = fetch_understat_players()
    except Exception as e:
        print(f"Failed to fetch understat data: {e}. Will generate normalized data without it.")
        us_players = []
        
    normalize_data(fpl_data, us_players)
    print("Data update complete.")

if __name__ == "__main__":
    main()
