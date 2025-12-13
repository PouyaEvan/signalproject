# Brain Signal Analyzer 🧠

A web application for analyzing brain signals (EEG) with advanced filtering, artifact removal, emotion detection, and music recommendations.

![Brain Signal Analyzer](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=flat-square&logo=tailwind-css)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-F38020?style=flat-square&logo=cloudflare)

## Features ✨

### Signal Processing
- **Pre-defined Brain Signals**: Happy 😊, Neutral 😐, and Sad 😢 states
- **Custom Signal Designer**: Create your own brain signals with adjustable parameters
- **Band-Pass Filter**: 0.5-45 Hz to remove DC drift and high-frequency noise
- **Notch Filter**: 50/60 Hz to remove power line interference
- **ICA Artifact Removal**: Remove eye blinks and muscle artifacts

### Emotion Analysis
- **LSTM-based Classification**: Deep learning emotion detection
- **Real-time Visualization**: Interactive signal charts
- **Frequency Band Analysis**: Delta, Theta, Alpha, Beta, Gamma powers

### Music Recommendations
- **Emotion-based Music**: Get songs matching your brain state
- **Multiple Genres**: Pop, Rock, Jazz, Classical, Electronic, Hip-Hop, R&B, Ambient
- **Spotify Integration**: Search and download tracks

## Tech Stack 🛠️

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Charts**: Custom Canvas rendering
- **ML**: TensorFlow.js for LSTM
- **Signal Processing**: Custom DSP implementations
- **Deployment**: Cloudflare Pages

## Getting Started 🚀

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/PouyaEvan/signalproject.git
cd signalproject

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

The static files will be generated in the `out` directory.

## Deployment to Cloudflare Pages 🌐

### Using GitHub Actions (Recommended)

1. **Set up Cloudflare Secrets in GitHub**:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Pages permissions
     - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

2. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Deploy to Cloudflare Pages"
   git push origin main
   ```

3. The GitHub Action will automatically build and deploy your site!

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy using Wrangler
npx wrangler pages deploy out --project-name brain-signal-analyzer
```

## Project Structure 📁

```
signalproject/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── src/
│   ├── app/
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Main page
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── SignalChart.tsx     # Signal visualization
│   │   ├── FrequencyChart.tsx  # Frequency band charts
│   │   ├── SignalDesigner.tsx  # Custom signal creator
│   │   ├── EmotionDisplay.tsx  # Emotion results
│   │   ├── FilterControls.tsx  # Signal processing UI
│   │   └── MusicRecommendation.tsx
│   └── lib/
│       ├── utils.ts            # Utility functions
│       ├── signal-generator.ts # Signal generation
│       ├── signal-processing.ts # DSP filters
│       ├── ica-processing.ts   # ICA implementation
│       ├── emotion-classifier.ts # LSTM classifier
│       └── spotify-api.ts      # Spotify integration
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## Signal Processing Pipeline 🔬

1. **Signal Generation/Loading**
   - Pre-defined signals with specific frequency compositions
   - Custom signal designer with wave component sliders

2. **Filtering**
   - Band-pass filter (Butterworth, forward-backward)
   - Notch filter for power line noise

3. **Artifact Removal**
   - ICA-based detection
   - Statistical thresholding

4. **Feature Extraction**
   - FFT-based power spectral analysis
   - Band power calculation (Delta, Theta, Alpha, Beta, Gamma)

5. **Emotion Classification**
   - Rule-based classification using frequency ratios
   - LSTM model for trained classification

## Spotify API Setup 🎵

The app uses the Fast-Creat.ir Spotify API. To enable music features:

1. Get an API key from the service provider
2. Enter the key in the app settings (click "API Key" in header)

API Endpoints used:
- Search: `https://api.fast-creat.ir/spotify?apikey=KEY&action=search&query=QUERY`
- Download: `https://api.fast-creat.ir/spotify?apikey=KEY&action=dl&url=URL`

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

This project is open source and available under the MIT License.

## Acknowledgments 🙏

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Lucide Icons](https://lucide.dev/) for amazing icons
- [TensorFlow.js](https://www.tensorflow.org/js) for browser ML
- [Cloudflare Pages](https://pages.cloudflare.com/) for hosting

---

Made with ❤️ for brain signal analysis