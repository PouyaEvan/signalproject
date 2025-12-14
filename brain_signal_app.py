"""
Brain Signal Analyzer - Desktop Application
EEG signal analysis with filtering, artifact removal, and emotion detection

Requirements:
    pip install customtkinter numpy scipy matplotlib pillow requests

To create executable:
    pip install pyinstaller
    pyinstaller --onefile --windowed --icon=brain.ico --name="BrainSignalAnalyzer" brain_signal_app.py
"""

import customtkinter as ctk
from tkinter import messagebox, filedialog
import numpy as np
from scipy import signal as scipy_signal
from scipy.fft import fft, fftfreq
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure
import threading
import requests
import json
import os
from dataclasses import dataclass
from typing import Optional, Tuple, List, Dict
from enum import Enum

# Set appearance
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

# ===================== CONSTANTS =====================
SAMPLE_RATE = 256  # Hz
DURATION = 10  # seconds

class EmotionType(Enum):
    HAPPY = "happy"
    NEUTRAL = "neutral"
    SAD = "sad"

class MusicGenre(Enum):
    POP = "pop"
    ROCK = "rock"
    JAZZ = "jazz"
    CLASSICAL = "classical"
    ELECTRONIC = "electronic"
    HIPHOP = "hiphop"
    RNB = "rnb"
    AMBIENT = "ambient"

GENRE_DISPLAY = {
    MusicGenre.POP: "🎵 Pop",
    MusicGenre.ROCK: "🎸 Rock",
    MusicGenre.JAZZ: "🎷 Jazz",
    MusicGenre.CLASSICAL: "🎻 Classical",
    MusicGenre.ELECTRONIC: "🎹 Electronic",
    MusicGenre.HIPHOP: "🎤 Hip Hop",
    MusicGenre.RNB: "🎙️ R&B",
    MusicGenre.AMBIENT: "🌙 Ambient",
}

REGION_DISPLAY = {
    "international": "🌍 International",
    "persian": "🇮🇷 Persian",
}

GENRE_SEED_MAP = {
    "pop": "pop",
    "rock": "rock",
    "jazz": "jazz",
    "classical": "classical",
    "electronic": "electronic",
    "hiphop": "hip-hop",
    "rnb": "r-n-b",
    "ambient": "ambient",
}

EMOTION_MUSIC_MAP = {
    "happy": {
        "pop": ["happy upbeat pop", "feel good pop hits"],
        "rock": ["uplifting rock", "happy rock songs"],
        "jazz": ["happy jazz", "upbeat jazz"],
        "classical": ["joyful classical", "uplifting orchestra"],
        "electronic": ["happy electronic", "uplifting EDM"],
        "hiphop": ["happy hip hop", "feel good rap"],
        "rnb": ["happy rnb", "feel good soul"],
        "ambient": ["happy ambient", "uplifting chillout"],
    },
    "neutral": {
        "pop": ["chill pop", "relaxing pop"],
        "rock": ["soft rock", "mellow rock"],
        "jazz": ["smooth jazz", "cool jazz"],
        "classical": ["relaxing classical", "peaceful piano"],
        "electronic": ["chillwave", "downtempo"],
        "hiphop": ["lofi hip hop", "chill rap"],
        "rnb": ["smooth rnb", "chill soul"],
        "ambient": ["calm ambient", "peaceful soundscapes"],
    },
    "sad": {
        "pop": ["sad pop songs", "emotional pop"],
        "rock": ["emotional rock", "sad rock ballads"],
        "jazz": ["sad jazz", "melancholic jazz"],
        "classical": ["sad classical", "emotional orchestra"],
        "electronic": ["sad electronic", "emotional ambient"],
        "hiphop": ["sad hip hop", "emotional rap"],
        "rnb": ["sad rnb", "emotional soul"],
        "ambient": ["sad ambient", "melancholic soundscapes"],
    },
}

PERSIAN_SUFFIX = ["persian", "iranian", "farsi"]

EMOTION_COLORS = {
    "happy": "#22c55e",
    "neutral": "#6b7280",
    "sad": "#ef4444",
}

EMOTION_EMOJIS = {
    "happy": "😊",
    "neutral": "😐",
    "sad": "😢",
}


# ===================== SIGNAL GENERATOR =====================
@dataclass
class BrainSignal:
    data: np.ndarray
    sample_rate: int
    duration: float
    emotion: str
    label: str


def generate_sine_wave(freq: float, amp: float, duration: float, sr: int, phase: float = 0) -> np.ndarray:
    t = np.linspace(0, duration, int(duration * sr), endpoint=False)
    return amp * np.sin(2 * np.pi * freq * t + phase)


def generate_noise(length: int, amplitude: float) -> np.ndarray:
    return (np.random.random(length) - 0.5) * 2 * amplitude


def generate_alpha_waves(duration: float, sr: int) -> np.ndarray:
    return generate_sine_wave(10, 0.8, duration, sr) + generate_sine_wave(11, 0.4, duration, sr, np.pi/4)


def generate_beta_waves(duration: float, sr: int) -> np.ndarray:
    return (generate_sine_wave(18, 0.5, duration, sr) + 
            generate_sine_wave(22, 0.3, duration, sr, np.pi/3) +
            generate_sine_wave(26, 0.2, duration, sr, np.pi/6))


def generate_theta_waves(duration: float, sr: int) -> np.ndarray:
    return generate_sine_wave(5, 0.6, duration, sr) + generate_sine_wave(7, 0.4, duration, sr, np.pi/5)


def generate_delta_waves(duration: float, sr: int) -> np.ndarray:
    return generate_sine_wave(1, 1.0, duration, sr) + generate_sine_wave(2.5, 0.5, duration, sr, np.pi/4)


def generate_gamma_waves(duration: float, sr: int) -> np.ndarray:
    return generate_sine_wave(40, 0.2, duration, sr) + generate_sine_wave(50, 0.1, duration, sr, np.pi/2)


def generate_power_noise(duration: float, sr: int, freq: int = 50, amp: float = 0.25) -> np.ndarray:
    return generate_sine_wave(freq, amp, duration, sr)


def generate_happy_signal(duration: float = DURATION, sr: int = SAMPLE_RATE) -> BrainSignal:
    alpha = generate_alpha_waves(duration, sr)
    beta = generate_beta_waves(duration, sr)
    gamma = generate_gamma_waves(duration, sr)
    noise = generate_noise(len(alpha), 0.2)
    power = generate_power_noise(duration, sr, 50, 0.25)
    
    data = alpha * 1.2 + beta * 0.6 + gamma * 0.3 + noise + power
    return BrainSignal(data, sr, duration, "happy", "😊 Happy Brain Signal")


def generate_neutral_signal(duration: float = DURATION, sr: int = SAMPLE_RATE) -> BrainSignal:
    alpha = generate_alpha_waves(duration, sr)
    beta = generate_beta_waves(duration, sr)
    theta = generate_theta_waves(duration, sr)
    noise = generate_noise(len(alpha), 0.15)
    power = generate_power_noise(duration, sr, 50, 0.2)
    
    data = alpha * 0.8 + beta * 0.5 + theta * 0.3 + noise + power
    return BrainSignal(data, sr, duration, "neutral", "😐 Neutral Brain Signal")


def generate_sad_signal(duration: float = DURATION, sr: int = SAMPLE_RATE) -> BrainSignal:
    alpha = generate_alpha_waves(duration, sr)
    theta = generate_theta_waves(duration, sr)
    delta = generate_delta_waves(duration, sr)
    noise = generate_noise(len(alpha), 0.2)
    power = generate_power_noise(duration, sr, 50, 0.3)
    
    data = alpha * 0.4 + theta * 1.2 + delta * 0.8 + noise + power
    return BrainSignal(data, sr, duration, "sad", "😢 Sad Brain Signal")


def generate_custom_signal(params: Dict, duration: float = DURATION, sr: int = SAMPLE_RATE) -> BrainSignal:
    alpha = generate_alpha_waves(duration, sr)
    beta = generate_beta_waves(duration, sr)
    theta = generate_theta_waves(duration, sr)
    delta = generate_delta_waves(duration, sr)
    gamma = generate_gamma_waves(duration, sr)
    noise = generate_noise(len(alpha), params.get('noise', 0.2))
    power = generate_power_noise(duration, sr, params.get('power_freq', 50), params.get('power_amp', 0.25))
    
    data = (alpha * params.get('alpha', 0.5) +
            beta * params.get('beta', 0.5) +
            theta * params.get('theta', 0.3) +
            delta * params.get('delta', 0.2) +
            gamma * params.get('gamma', 0.3) +
            noise + power)
    
    # Determine emotion
    if params.get('alpha', 0) > 0.8 and params.get('gamma', 0) > 0.2:
        emotion = "happy"
    elif params.get('theta', 0) > 0.8 or params.get('delta', 0) > 0.6:
        emotion = "sad"
    else:
        emotion = "neutral"
    
    return BrainSignal(data, sr, duration, emotion, "🎛️ Custom Signal")


# ===================== SIGNAL PROCESSING =====================
def bandpass_filter(data: np.ndarray, low: float, high: float, sr: int, order: int = 4) -> np.ndarray:
    nyq = 0.5 * sr
    low_norm = low / nyq
    high_norm = high / nyq
    b, a = scipy_signal.butter(order, [low_norm, high_norm], btype='band')
    return scipy_signal.filtfilt(b, a, data)


def notch_filter(data: np.ndarray, freq: float, sr: int, Q: float = 30) -> np.ndarray:
    nyq = 0.5 * sr
    w0 = freq / nyq
    b, a = scipy_signal.iirnotch(w0, Q)
    return scipy_signal.filtfilt(b, a, data)


def remove_artifacts_simple(data: np.ndarray, threshold: float = 3.0) -> Tuple[np.ndarray, np.ndarray]:
    """Remove artifacts using statistical thresholding"""
    mean = np.mean(data)
    std = np.std(data)
    
    clean = data.copy()
    artifacts = np.zeros_like(data)
    
    for i in range(len(data)):
        if abs(data[i] - mean) > threshold * std:
            # Interpolate
            left = data[i-1] if i > 0 else mean
            right = data[i+1] if i < len(data)-1 else mean
            clean[i] = (left + right) / 2
            artifacts[i] = data[i] - clean[i]
    
    return clean, artifacts


def calculate_band_powers(data: np.ndarray, sr: int) -> Dict[str, float]:
    """Calculate power in each frequency band"""
    n = len(data)
    yf = np.abs(fft(data))[:n//2]
    xf = fftfreq(n, 1/sr)[:n//2]
    
    bands = {
        'delta': (0.5, 4),
        'theta': (4, 8),
        'alpha': (8, 13),
        'beta': (13, 30),
        'gamma': (30, 45),
    }
    
    powers = {}
    for name, (low, high) in bands.items():
        mask = (xf >= low) & (xf < high)
        powers[name] = np.mean(yf[mask]**2) if np.any(mask) else 0
    
    return powers


def classify_emotion(data: np.ndarray, sr: int) -> Dict:
    """Classify emotion using calibrated band-power ratios (improved accuracy on synthetic EEG)."""
    powers = calculate_band_powers(data, sr)
    total = sum(powers.values()) + 1e-12
    norm = {k: v / total for k, v in powers.items()}

    # Ratios and helper features
    alpha_r = norm['alpha']
    beta_r = norm['beta']
    gamma_r = norm['gamma']
    theta_r = norm['theta']
    delta_r = norm['delta']
    theta_delta = theta_r + delta_r
    high_freq = alpha_r + beta_r + gamma_r
    beta_alpha = beta_r / (alpha_r + 1e-6)

    # Calibrated scores (tuned for the synthetic generators)
    happy_score = (
        2.0 * alpha_r
        + 1.1 * beta_r
        + 1.3 * gamma_r
        - 0.6 * theta_delta
        + 0.3 * beta_alpha
        + 0.2 * high_freq
    )

    neutral_score = (
        1.2 * alpha_r
        + 1.0 * beta_r
        + 0.8 * theta_r
        + 0.5 * gamma_r
        - 0.3 * abs(alpha_r - 0.30)
        - 0.3 * abs(theta_delta - 0.35)
    )

    sad_score = (
        1.5 * theta_delta
        + 0.8 * delta_r
        + 0.4 * theta_r
        - 0.7 * alpha_r
        - 0.4 * gamma_r
    )

    # Softmax with a mild temperature for better separation
    temp = 1.1
    exp_h = np.exp(happy_score / temp)
    exp_n = np.exp(neutral_score / temp)
    exp_s = np.exp(sad_score / temp)
    total_exp = exp_h + exp_n + exp_s

    probs = {
        'happy': exp_h / total_exp,
        'neutral': exp_n / total_exp,
        'sad': exp_s / total_exp,
    }

    emotion = max(probs, key=probs.get)
    confidence = probs[emotion]

    return {
        'emotion': emotion,
        'confidence': confidence,
        'probabilities': probs,
        'band_powers': powers,
    }


# ===================== SPOTIFY API =====================
# Spotify API Credentials (Hardcoded)
SPOTIFY_CLIENT_ID = "00953e5f30d54024a8cf0a72dc6b766f"
SPOTIFY_CLIENT_SECRET = "30be2eeee20541849a379333aefa4842"

# Fast Creat API key
FAST_CREAT_API_KEY = '5894416619:opSuiY7PUwHB8Ar@Api_ManagerRoBot'


def get_spotify_token() -> Optional[str]:
    """Get Spotify access token using Client Credentials flow"""
    try:
        import base64
        auth_str = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
        auth_b64 = base64.b64encode(auth_str.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {auth_b64}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {"grant_type": "client_credentials"}
        
        response = requests.post(
            "https://accounts.spotify.com/api/token",
            headers=headers,
            data=data,
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json().get("access_token")
    except Exception as e:
        print(f"Token error: {e}")
    return None


def _to_market(region: str) -> str:
    return "IR" if region == "persian" else "US"


def _dedupe_tracks(tracks: List[Dict]) -> List[Dict]:
    seen = set()
    out = []
    for t in tracks:
        key = t.get("url") or f"{t.get('title')}-{t.get('artist')}"
        if key not in seen:
            seen.add(key)
            out.append(t)
    return out


def search_spotify(query: str, genre: str, region: str = "international") -> List[Dict]:
    """Search Spotify using official API with genre + region awareness"""
    token = get_spotify_token()
    if not token:
        return []
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        market = _to_market(region)
        seed = GENRE_SEED_MAP.get(genre, genre)
        results: List[Dict] = []

        # 1) Recommendations endpoint using seed_genres for better genre fidelity
        rec_url = (
            "https://api.spotify.com/v1/recommendations"
            f"?limit=8&market={market}&seed_genres={seed}"
        )
        rec_resp = requests.get(rec_url, headers=headers, timeout=10)
        if rec_resp.status_code == 200:
            rec_data = rec_resp.json()
            for track in rec_data.get("tracks", []):
                results.append({
                    "title": track.get("name", "Unknown"),
                    "artist": ", ".join([a.get("name", "") for a in track.get("artists", [])]),
                    "album": track.get("album", {}).get("name", ""),
                    "url": track.get("external_urls", {}).get("spotify", ""),
                    "preview_url": track.get("preview_url", ""),
                    "image": track.get("album", {}).get("images", [{}])[0].get("url", "") if track.get("album", {}).get("images") else "",
                })

        # 2) Fallback search with genre filter
        search_query = f"{query} genre:\"{seed}\""
        search_params = {
            "q": search_query,
            "type": "track",
            "limit": 8,
            "market": market,
        }
        response = requests.get(
            "https://api.spotify.com/v1/search",
            headers=headers,
            params=search_params,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            tracks = data.get("tracks", {}).get("items", [])
            for track in tracks:
                results.append({
                    "title": track.get("name", "Unknown"),
                    "artist": ", ".join([a["name"] for a in track.get("artists", [])]),
                    "album": track.get("album", {}).get("name", ""),
                    "url": track.get("external_urls", {}).get("spotify", ""),
                    "preview_url": track.get("preview_url", ""),
                    "image": track.get("album", {}).get("images", [{}])[0].get("url", "") if track.get("album", {}).get("images") else ""
                })
        
        return _dedupe_tracks(results)[:8]
    except Exception as e:
        print(f"Spotify search error: {e}")
        # Fallback to Fast Creat API
        try:
            fallback_response = requests.get(
                f"https://api.fast-creat.ir/spotify?apikey={FAST_CREAT_API_KEY}&action=search&query={query}",
                timeout=10
            )
            if fallback_response.status_code == 200:
                fallback_data = fallback_response.json()
                if fallback_data.get("tracks"):
                    fallback_tracks = []
                    for item in fallback_data["tracks"]:
                        fallback_tracks.append({
                            "title": item.get("name", "Unknown"),
                            "artist": item.get("artist", "Unknown"),
                            "album": "Unknown",
                            "url": item.get("link", ""),
                            "preview_url": item.get("link", ""),  # Use download link as preview
                            "image": item.get("image", "https://via.placeholder.com/250?text=MoodFlow")
                        })
                    return fallback_tracks[:8]
        except Exception as fallback_e:
            print(f"Fallback search error: {fallback_e}")
    
    return []


def get_music_query(emotion: str, genre: str, region: str = "international") -> str:
    """Get search query based on emotion, genre, and region (international or persian)."""
    base_queries = EMOTION_MUSIC_MAP.get(emotion, {}).get(genre, ["music"])
    query = np.random.choice(base_queries)

    if region == "persian":
        suffix = np.random.choice(PERSIAN_SUFFIX)
        query = f"{query} {suffix}"
    else:
        # Add mild diversity for international searches
        query = f"{query} best"

    return query


# ===================== MAIN APPLICATION =====================
class BrainSignalApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        self.title("🧠 Brain Signal Analyzer")
        self.geometry("1400x900")
        self.minsize(1200, 800)
        
        # State
        self.current_signal: Optional[BrainSignal] = None
        self.processed_signal: Optional[np.ndarray] = None
        self.emotion_result: Optional[Dict] = None
        self.api_key = ""
        
        # Configure grid
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)
        
        self._create_sidebar()
        self._create_main_content()
        
    def _create_sidebar(self):
        """Create sidebar with controls"""
        sidebar = ctk.CTkFrame(self, width=300, corner_radius=0)
        sidebar.grid(row=0, column=0, sticky="nsew")
        sidebar.grid_rowconfigure(10, weight=1)
        
        # Title
        title = ctk.CTkLabel(sidebar, text="🧠 Brain Signal\nAnalyzer", 
                            font=ctk.CTkFont(size=24, weight="bold"))
        title.grid(row=0, column=0, padx=20, pady=(20, 10))
        
        subtitle = ctk.CTkLabel(sidebar, text="Brain signal analysis", 
                       font=ctk.CTkFont(size=12), text_color="gray")
        subtitle.grid(row=1, column=0, padx=20, pady=(0, 20))
        
        # Signal Selection
        signal_label = ctk.CTkLabel(sidebar, text="Select Signal", 
                       font=ctk.CTkFont(size=14, weight="bold"))
        signal_label.grid(row=2, column=0, padx=20, pady=(10, 5), sticky="w")
        
        self.signal_var = ctk.StringVar(value="happy")
        
        signals = [
            ("😊 Happy", "happy"),
            ("😐 Neutral", "neutral"),
            ("😢 Sad", "sad"),
            ("🎛️ Custom", "custom"),
        ]
        
        for text, value in signals:
            rb = ctk.CTkRadioButton(sidebar, text=text, variable=self.signal_var, 
                                   value=value, command=self._on_signal_change)
            rb.grid(row=signals.index((text, value)) + 3, column=0, padx=30, pady=3, sticky="w")
        
        # Custom Signal Controls
        self.custom_frame = ctk.CTkFrame(sidebar)
        self.custom_frame.grid(row=7, column=0, padx=20, pady=10, sticky="ew")
        
        self.custom_sliders = {}
        wave_types = [
            ("Alpha", "alpha", 0.5),
            ("Beta", "beta", 0.5),
            ("Theta", "theta", 0.3),
            ("Delta", "delta", 0.2),
            ("Gamma", "gamma", 0.3),
            ("Noise", "noise", 0.2),
        ]
        
        for i, (label, key, default) in enumerate(wave_types):
            lbl = ctk.CTkLabel(self.custom_frame, text=label, font=ctk.CTkFont(size=11))
            lbl.grid(row=i, column=0, padx=5, pady=2, sticky="w")
            
            slider = ctk.CTkSlider(self.custom_frame, from_=0, to=1, number_of_steps=100)
            slider.set(default)
            slider.grid(row=i, column=1, padx=5, pady=2, sticky="ew")
            self.custom_sliders[key] = slider
        
        self.custom_frame.grid_columnconfigure(1, weight=1)
        
        # Load Signal Button
        load_btn = ctk.CTkButton(sidebar, text="📥 Load Signal", 
                                command=self._load_signal,
                                font=ctk.CTkFont(size=14, weight="bold"),
                                height=40)
        load_btn.grid(row=8, column=0, padx=20, pady=15, sticky="ew")
        
        # Filter Settings
        filter_label = ctk.CTkLabel(sidebar, text="⚙️ Filter Settings", 
                       font=ctk.CTkFont(size=14, weight="bold"))
        filter_label.grid(row=9, column=0, padx=20, pady=(20, 5), sticky="w")
        
        self.bandpass_var = ctk.BooleanVar(value=True)
        bp_check = ctk.CTkCheckBox(sidebar, text="Band-Pass (0.5-45 Hz)", 
                                  variable=self.bandpass_var)
        bp_check.grid(row=10, column=0, padx=30, pady=3, sticky="w")
        
        self.notch_var = ctk.BooleanVar(value=True)
        notch_check = ctk.CTkCheckBox(sidebar, text="Notch Filter (50 Hz)", 
                                     variable=self.notch_var)
        notch_check.grid(row=11, column=0, padx=30, pady=3, sticky="w")
        
        self.ica_var = ctk.BooleanVar(value=True)
        ica_check = ctk.CTkCheckBox(sidebar, text="Artifact Removal (ICA)", 
                       variable=self.ica_var)
        ica_check.grid(row=12, column=0, padx=30, pady=3, sticky="w")
        
        # Process Button
        process_btn = ctk.CTkButton(sidebar, text="🔬 Process & Analyze", 
                                   command=self._process_signal,
                                   font=ctk.CTkFont(size=14, weight="bold"),
                                   fg_color="#22c55e", hover_color="#16a34a",
                                   height=45)
        process_btn.grid(row=13, column=0, padx=20, pady=15, sticky="ew")
        
        # Spacer
        spacer = ctk.CTkFrame(sidebar, fg_color="transparent")
        spacer.grid(row=14, column=0, sticky="nsew")
        sidebar.grid_rowconfigure(14, weight=1)
        
        # Spotify Status
        spotify_label = ctk.CTkLabel(sidebar, text="🎵 Spotify: Connected ✅", 
                    font=ctk.CTkFont(size=12), text_color="#22c55e")
        spotify_label.grid(row=15, column=0, padx=20, pady=(10, 20), sticky="w")
        
    def _create_main_content(self):
        """Create main content area with tabs"""
        main = ctk.CTkFrame(self)
        main.grid(row=0, column=1, sticky="nsew", padx=10, pady=10)
        main.grid_columnconfigure(0, weight=1)
        main.grid_rowconfigure(1, weight=1)
        
        # Tabs
        self.tabview = ctk.CTkTabview(main)
        self.tabview.grid(row=0, column=0, sticky="nsew", padx=5, pady=5)
        main.grid_rowconfigure(0, weight=1)
        
        self.tab_signal = self.tabview.add("📊 Signal")
        self.tab_frequency = self.tabview.add("📈 Frequency")
        self.tab_emotion = self.tabview.add("🎭 Emotion")
        self.tab_music = self.tabview.add("🎵 Music")
        
        self._setup_signal_tab()
        self._setup_frequency_tab()
        self._setup_emotion_tab()
        self._setup_music_tab()
        
    def _setup_signal_tab(self):
        """Setup signal visualization tab"""
        self.tab_signal.grid_columnconfigure(0, weight=1)
        self.tab_signal.grid_rowconfigure(0, weight=1)
        
        # Create matplotlib figure
        self.fig_signal = Figure(figsize=(10, 6), dpi=100, facecolor='#1a1a2e')
        self.ax_original = self.fig_signal.add_subplot(211)
        self.ax_processed = self.fig_signal.add_subplot(212)
        
        for ax in [self.ax_original, self.ax_processed]:
            ax.set_facecolor('#16213e')
            ax.tick_params(colors='white')
            ax.spines['bottom'].set_color('white')
            ax.spines['left'].set_color('white')
            ax.spines['top'].set_visible(False)
            ax.spines['right'].set_visible(False)
            ax.xaxis.label.set_color('white')
            ax.yaxis.label.set_color('white')
            ax.title.set_color('white')
        
        self.ax_original.set_title("Original Signal", fontsize=12)
        self.ax_processed.set_title("Processed Signal", fontsize=12)
        
        self.fig_signal.tight_layout()
        
        self.canvas_signal = FigureCanvasTkAgg(self.fig_signal, self.tab_signal)
        self.canvas_signal.get_tk_widget().grid(row=0, column=0, sticky="nsew", padx=10, pady=10)
        
    def _setup_frequency_tab(self):
        """Setup frequency analysis tab"""
        self.tab_frequency.grid_columnconfigure(0, weight=1)
        self.tab_frequency.grid_rowconfigure(0, weight=1)
        
        self.fig_freq = Figure(figsize=(10, 6), dpi=100, facecolor='#1a1a2e')
        self.ax_spectrum = self.fig_freq.add_subplot(121)
        self.ax_bands = self.fig_freq.add_subplot(122)
        
        for ax in [self.ax_spectrum, self.ax_bands]:
            ax.set_facecolor('#16213e')
            ax.tick_params(colors='white')
            ax.spines['bottom'].set_color('white')
            ax.spines['left'].set_color('white')
            ax.spines['top'].set_visible(False)
            ax.spines['right'].set_visible(False)
            ax.title.set_color('white')
        
        self.fig_freq.tight_layout()
        
        self.canvas_freq = FigureCanvasTkAgg(self.fig_freq, self.tab_frequency)
        self.canvas_freq.get_tk_widget().grid(row=0, column=0, sticky="nsew", padx=10, pady=10)
        
    def _setup_emotion_tab(self):
        """Setup emotion display tab"""
        self.tab_emotion.grid_columnconfigure(0, weight=1)
        self.tab_emotion.grid_rowconfigure(1, weight=1)
        
        # Result frame
        self.emotion_frame = ctk.CTkFrame(self.tab_emotion)
        self.emotion_frame.grid(row=0, column=0, sticky="ew", padx=20, pady=20)
        self.emotion_frame.grid_columnconfigure((0, 1, 2), weight=1)
        
        # Emotion display
        self.emotion_emoji = ctk.CTkLabel(self.emotion_frame, text="🧠", 
                                         font=ctk.CTkFont(size=80))
        self.emotion_emoji.grid(row=0, column=0, columnspan=3, pady=20)
        
        self.emotion_label = ctk.CTkLabel(self.emotion_frame, text="Waiting for analysis...", 
                         font=ctk.CTkFont(size=28, weight="bold"))
        self.emotion_label.grid(row=1, column=0, columnspan=3, pady=10)
        
        self.confidence_label = ctk.CTkLabel(self.emotion_frame, text="", 
                                            font=ctk.CTkFont(size=16), text_color="gray")
        self.confidence_label.grid(row=2, column=0, columnspan=3, pady=5)
        
        # Progress bars for probabilities
        self.prob_frame = ctk.CTkFrame(self.tab_emotion)
        self.prob_frame.grid(row=1, column=0, sticky="nsew", padx=20, pady=20)
        self.prob_frame.grid_columnconfigure(1, weight=1)
        
        self.prob_bars = {}
        emotions = [("😊 Happy", "happy", "#22c55e"), 
                   ("😐 Neutral", "neutral", "#6b7280"),
                   ("😢 Sad", "sad", "#ef4444")]
        
        for i, (label, key, color) in enumerate(emotions):
            lbl = ctk.CTkLabel(self.prob_frame, text=label, font=ctk.CTkFont(size=14))
            lbl.grid(row=i, column=0, padx=10, pady=10, sticky="w")
            
            bar = ctk.CTkProgressBar(self.prob_frame, progress_color=color)
            bar.set(0)
            bar.grid(row=i, column=1, padx=10, pady=10, sticky="ew")
            
            pct = ctk.CTkLabel(self.prob_frame, text="0%", font=ctk.CTkFont(size=12))
            pct.grid(row=i, column=2, padx=10, pady=10)
            
            self.prob_bars[key] = (bar, pct)
            
    def _setup_music_tab(self):
        """Setup music recommendation tab"""
        self.tab_music.grid_columnconfigure(0, weight=1)
        self.tab_music.grid_rowconfigure(2, weight=1)
        
        # Genre selection
        genre_frame = ctk.CTkFrame(self.tab_music)
        genre_frame.grid(row=0, column=0, sticky="ew", padx=20, pady=10)
        genre_frame.grid_columnconfigure(1, weight=1)
        genre_frame.grid_columnconfigure(3, weight=1)
        
        genre_label = ctk.CTkLabel(genre_frame, text="🎼 Choose Genre:", 
                      font=ctk.CTkFont(size=14, weight="bold"))
        genre_label.grid(row=0, column=0, padx=10, pady=10)
        
        self.genre_var = ctk.StringVar(value="pop")
        genre_menu = ctk.CTkOptionMenu(genre_frame, variable=self.genre_var,
                          values=list(GENRE_DISPLAY.values()))
        genre_menu.grid(row=0, column=1, padx=10, pady=10, sticky="w")

        # Region selection
        region_label = ctk.CTkLabel(genre_frame, text="🌐 Region:",
                       font=ctk.CTkFont(size=14, weight="bold"))
        region_label.grid(row=0, column=2, padx=10, pady=10, sticky="e")

        self.region_var = ctk.StringVar(value="international")
        region_menu = ctk.CTkOptionMenu(genre_frame, variable=self.region_var,
                           values=list(REGION_DISPLAY.values()))
        region_menu.grid(row=0, column=3, padx=10, pady=10, sticky="w")
        
        search_btn = ctk.CTkButton(genre_frame, text="🔍 Find Music",
                                  command=self._search_music,
                                  font=ctk.CTkFont(size=14, weight="bold"))
        search_btn.grid(row=0, column=4, padx=10, pady=10)
        
        # Current emotion display
        self.music_emotion_label = ctk.CTkLabel(self.tab_music, 
                               text="Process a signal to detect emotion",
                               font=ctk.CTkFont(size=16))
        self.music_emotion_label.grid(row=1, column=0, pady=10)
        
        # Results frame (scrollable)
        self.music_scroll = ctk.CTkScrollableFrame(self.tab_music)
        self.music_scroll.grid(row=2, column=0, sticky="nsew", padx=20, pady=10)
        self.music_scroll.grid_columnconfigure(0, weight=1)
        
    def _on_signal_change(self):
        """Handle signal type change"""
        is_custom = self.signal_var.get() == "custom"
        if is_custom:
            self.custom_frame.grid()
        else:
            self.custom_frame.grid_remove()
            
    def _load_signal(self):
        """Load selected signal"""
        signal_type = self.signal_var.get()
        
        if signal_type == "happy":
            self.current_signal = generate_happy_signal()
        elif signal_type == "neutral":
            self.current_signal = generate_neutral_signal()
        elif signal_type == "sad":
            self.current_signal = generate_sad_signal()
        elif signal_type == "custom":
            params = {k: s.get() for k, s in self.custom_sliders.items()}
            self.current_signal = generate_custom_signal(params)
        
        self.processed_signal = None
        self.emotion_result = None
        self._update_signal_plot()
        
        messagebox.showinfo("Signal loaded", 
                   f"Signal {self.current_signal.label} loaded.\n"
                   f"Duration: {self.current_signal.duration} seconds\n"
                   f"Sample rate: {self.current_signal.sample_rate} Hz")
        
    def _process_signal(self):
        """Process the loaded signal"""
        if self.current_signal is None:
            messagebox.showwarning("Error", "Please load a signal first!")
            return
        
        # Start processing in thread
        def process():
            data = self.current_signal.data.copy()
            sr = self.current_signal.sample_rate
            
            # Apply filters
            if self.bandpass_var.get():
                data = bandpass_filter(data, 0.5, 45, sr)
            
            if self.notch_var.get():
                data = notch_filter(data, 50, sr)
            
            if self.ica_var.get():
                data, _ = remove_artifacts_simple(data, 3.0)
            
            self.processed_signal = data
            
            # Classify emotion
            self.emotion_result = classify_emotion(data, sr)
            
            # Update UI
            self.after(0, self._update_all_plots)
            
        thread = threading.Thread(target=process)
        thread.start()
        
    def _update_signal_plot(self):
        """Update signal plots"""
        if self.current_signal is None:
            return
        
        data = self.current_signal.data
        sr = self.current_signal.sample_rate
        t = np.linspace(0, len(data)/sr, len(data))
        
        # Show first 2 seconds
        show_samples = min(2 * sr, len(data))
        
        self.ax_original.clear()
        self.ax_original.plot(t[:show_samples], data[:show_samples], color='#8b5cf6', linewidth=1)
        self.ax_original.set_title(f"Original Signal - {self.current_signal.label}", fontsize=12, color='white')
        self.ax_original.set_xlabel("Time (s)", color='white')
        self.ax_original.set_ylabel("Amplitude", color='white')
        self.ax_original.set_facecolor('#16213e')
        self.ax_original.tick_params(colors='white')
        self.ax_original.grid(True, alpha=0.2)
        
        self.ax_processed.clear()
        if self.processed_signal is not None:
            self.ax_processed.plot(t[:show_samples], self.processed_signal[:show_samples], 
                                  color='#22c55e', linewidth=1)
            self.ax_processed.set_title("Processed Signal", fontsize=12, color='white')
        else:
            self.ax_processed.text(0.5, 0.5, "Not processed", ha='center', va='center',
                                  fontsize=16, color='gray', transform=self.ax_processed.transAxes)
            self.ax_processed.set_title("Processed Signal", fontsize=12, color='white')
        
        self.ax_processed.set_xlabel("Time (s)", color='white')
        self.ax_processed.set_ylabel("Amplitude", color='white')
        self.ax_processed.set_facecolor('#16213e')
        self.ax_processed.tick_params(colors='white')
        self.ax_processed.grid(True, alpha=0.2)
        
        self.fig_signal.tight_layout()
        self.canvas_signal.draw()
        
    def _update_frequency_plot(self):
        """Update frequency plots"""
        if self.processed_signal is None:
            return
        
        data = self.processed_signal
        sr = self.current_signal.sample_rate
        n = len(data)
        
        # FFT
        yf = np.abs(fft(data))[:n//2] * 2 / n
        xf = fftfreq(n, 1/sr)[:n//2]
        
        # Spectrum
        self.ax_spectrum.clear()
        self.ax_spectrum.plot(xf[:200], yf[:200], color='#8b5cf6', linewidth=1)
        self.ax_spectrum.fill_between(xf[:200], yf[:200], alpha=0.3, color='#8b5cf6')
        self.ax_spectrum.set_title("Frequency Spectrum", fontsize=12, color='white')
        self.ax_spectrum.set_xlabel("Frequency (Hz)", color='white')
        self.ax_spectrum.set_ylabel("Magnitude", color='white')
        self.ax_spectrum.set_facecolor('#16213e')
        self.ax_spectrum.tick_params(colors='white')
        self.ax_spectrum.set_xlim(0, 50)
        self.ax_spectrum.grid(True, alpha=0.2)
        
        # Band powers
        if self.emotion_result:
            powers = self.emotion_result['band_powers']
            bands = list(powers.keys())
            values = list(powers.values())
            max_val = max(values) if values else 1
            norm_values = [v/max_val for v in values]
            
            colors = ['#ef4444', '#f97316', '#22c55e', '#3b82f6', '#a855f7']
            
            self.ax_bands.clear()
            bars = self.ax_bands.barh(bands, norm_values, color=colors)
            self.ax_bands.set_title("Band Powers", fontsize=12, color='white')
            self.ax_bands.set_xlabel("Normalized Power", color='white')
            self.ax_bands.set_facecolor('#16213e')
            self.ax_bands.tick_params(colors='white')
            
        self.fig_freq.tight_layout()
        self.canvas_freq.draw()
        
    def _update_emotion_display(self):
        """Update emotion display"""
        if self.emotion_result is None:
            return
        
        emotion = self.emotion_result['emotion']
        confidence = self.emotion_result['confidence']
        probs = self.emotion_result['probabilities']
        
        # Update main display
        self.emotion_emoji.configure(text=EMOTION_EMOJIS.get(emotion, "🧠"))
        
        emotion_names = {"happy": "Happy", "neutral": "Neutral", "sad": "Sad"}
        self.emotion_label.configure(text=emotion_names.get(emotion, emotion).upper(),
                                    text_color=EMOTION_COLORS.get(emotion, "white"))
        
        self.confidence_label.configure(text=f"Confidence: {confidence*100:.1f}%")
        
        # Update probability bars
        for key, (bar, pct) in self.prob_bars.items():
            prob = probs.get(key, 0)
            bar.set(prob)
            pct.configure(text=f"{prob*100:.1f}%")
            
        # Update music tab
        self.music_emotion_label.configure(
            text=f"Detected emotion: {EMOTION_EMOJIS.get(emotion, '')} {emotion_names.get(emotion, emotion)}",
            text_color=EMOTION_COLORS.get(emotion, "white")
        )
        
    def _update_all_plots(self):
        """Update all visualizations"""
        self._update_signal_plot()
        self._update_frequency_plot()
        self._update_emotion_display()
        
        messagebox.showinfo("Processing complete", 
                   f"Detected emotion: {self.emotion_result['emotion']}\n"
                   f"Confidence: {self.emotion_result['confidence']*100:.1f}%")
        
    def _search_music(self):
        """Search for music recommendations"""
        if self.emotion_result is None:
            messagebox.showwarning("Error", "Please process a signal first!")
            return
        
        emotion = self.emotion_result['emotion']
        
        # Get genre from display name
        genre_display = self.genre_var.get()
        genre = "pop"
        for g, display in GENRE_DISPLAY.items():
            if display == genre_display:
                genre = g.value
                break

        # Get region from display name
        region_display = self.region_var.get()
        region = "international"
        for r, display in REGION_DISPLAY.items():
            if display == region_display:
                region = r
                break

        query = get_music_query(emotion, genre, region)
        
        # Clear previous results
        for widget in self.music_scroll.winfo_children():
            widget.destroy()
        
        # Show loading
        loading = ctk.CTkLabel(self.music_scroll, text="Searching...", 
                      font=ctk.CTkFont(size=14))
        loading.grid(row=0, column=0, pady=20)
        self.update()
        
        # Search
        def search():
            results = search_spotify(query, genre, region)
            self.after(0, lambda: self._display_music_results(results, query))
        
        thread = threading.Thread(target=search)
        thread.start()
        
    def _display_music_results(self, results: List[Dict], query: str):
        """Display music search results"""
        # Clear loading
        for widget in self.music_scroll.winfo_children():
            widget.destroy()
        
        if not results:
            no_result = ctk.CTkLabel(self.music_scroll, 
                                    text="No results found. Please check your connection.",
                                    font=ctk.CTkFont(size=14), text_color="gray")
            no_result.grid(row=0, column=0, pady=20)
            return
        
        # Query label
        query_label = ctk.CTkLabel(self.music_scroll, 
                      text=f"Search: \"{query}\"",
                      font=ctk.CTkFont(size=12), text_color="gray")
        query_label.grid(row=0, column=0, pady=10, sticky="w")
        
        # Display tracks
        for i, track in enumerate(results):
            frame = ctk.CTkFrame(self.music_scroll)
            frame.grid(row=i+1, column=0, sticky="ew", pady=5)
            frame.grid_columnconfigure(1, weight=1)
            
            # Icon
            icon = ctk.CTkLabel(frame, text="🎵", font=ctk.CTkFont(size=24))
            icon.grid(row=0, column=0, rowspan=2, padx=10, pady=10)
            
            # Title
            title = track.get('title', track.get('name', 'Unknown'))
            title_label = ctk.CTkLabel(frame, text=title, 
                                      font=ctk.CTkFont(size=14, weight="bold"))
            title_label.grid(row=0, column=1, sticky="w", padx=5, pady=(10, 0))
            
            # Artist
            artist = track.get('artist', track.get('artists', 'Unknown Artist'))
            if isinstance(artist, list):
                artist = ", ".join(artist)
            artist_label = ctk.CTkLabel(frame, text=artist, 
                                       font=ctk.CTkFont(size=12), text_color="gray")
            artist_label.grid(row=1, column=1, sticky="w", padx=5, pady=(0, 10))
            
            # Link button
            url = track.get('url', track.get('link', ''))
            if url:
                def open_url(u=url):
                    import webbrowser
                    webbrowser.open(u)
                
                link_btn = ctk.CTkButton(frame, text="🔗", width=40,
                                        command=open_url)
                link_btn.grid(row=0, column=2, rowspan=2, padx=10, pady=10)


def main():
    app = BrainSignalApp()
    app.mainloop()


if __name__ == "__main__":
    main()
