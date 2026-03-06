# EV Casino Simulator - Frontend

A comprehensive Next.js frontend for the EV Casino Simulator backend.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Julia backend running (see main README)

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
# Start frontend (Terminal 1)
npm run dev

# Start backend (Terminal 2, in ev-simulator-julia folder)
julia server.jl
```

Open `http://5.78.132.169:3000/ev-simulator` in your browser.

## 📦 What's Included

- **Complete Next.js setup**: TypeScript, TailwindCSS, ShadCN UI
- **All ShadCN components**: Pre-installed and configured
- **Full TypeScript support**: Strictly typed to match backend API
- **Production ready**: Build and deploy scripts included

## 📁 Project Structure

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── globals.css             # Global styles + TailwindCSS
│   └── ev-simulator/
│       └── page.tsx            # Main simulator page (~1,400 lines)
├── components/
│   └── ui/                      # ShadCN UI components
│       ├── card.tsx
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── tabs.tsx
│       ├── badge.tsx
│       ├── alert.tsx
│       ├── checkbox.tsx
│       └── collapsible.tsx
├── lib/
│   └── utils.ts                # Utility functions
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.ts          # TailwindCSS config
├── postcss.config.js           # PostCSS config
├── next.config.js              # Next.js config
└── components.json              # ShadCN config
```

## ✨ Features

### Simulation Modes
- **Standard**: Fixed bet size with comprehensive statistics
- **Optimal**: Auto-finds best bet for target bust rate
- **Two-Tier**: Switches games at balance threshold

### Bonus Types
- **Cashable**: Standard bonus with wagering requirement
- **Post-Wager**: Bonus awarded after wagering complete
- **Cashback**: 4 variants (ON_WIN, ON_LOSS, BOTH, FIXED_WAGER)
- **Sticky**: Non-withdrawable bonus
- **Free Spins**: With optional rollover
- **Raw**: Single independent bet

### Supported Games
- Blackjack (bj)
- European Roulette (Single, Column/Dozen, Red/Black)
- American Roulette (Red/Black)
- French Roulette (Red/Black)
- Slots (with risk multipliers)
- Digits (custom threshold)

### Advanced Features
- **Pre/Post Coverplay**: Anti-detection strategies
- **Custom House Edge**: Override default house edges
- **FIXED_WAGER Cashback**: Cash vs Bonus distinction
- **Risk Multipliers**: For slots (very_low to very_high)
- **Digits Game**: Custom threshold-based outcomes

## 📊 Results Display

The frontend displays comprehensive results including:

- **Expected Value (EV)**: Average profit per session
- **Bust Rate**: Percentage of sessions that busted
- **Average Time**: Time per session
- **Cash Per Hour**: Hourly earnings rate
- **95% Confidence Interval**: Statistical confidence bounds
- **Profit Percentiles**: Distribution visualization (p5, p25, p50, p75, p95)
- **Standard Deviation**: Measure of variance
- **Optimal Bet**: If using optimal mode

## 🎨 UI/UX Highlights

- **Clean, modern design**: Uses ShadCN components
- **Responsive layout**: Works on desktop and tablet
- **Conditional rendering**: Only shows relevant fields
- **Collapsible sections**: Advanced features hidden by default
- **Visual indicators**: Green for positive EV, red for negative
- **Loading states**: Spinner during API calls
- **Error handling**: User-friendly error messages
- **Tooltips**: Helpful descriptions on complex fields

## 🔧 Configuration

### Backend URL

The frontend is configured to connect to `http://5.78.132.169:8000` by default. To change this, edit `app/ev-simulator/page.tsx`:

```typescript
const response = await fetch("http://your-backend-url:8000/api/simulate", {
```

### Environment Variables

Create `.env.local` for environment-specific variables:

```env
NEXT_PUBLIC_API_URL=http://5.78.132.169:8000
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🧪 Testing

After installation, test with:

1. **Basic Test**: Standard cashable bonus with blackjack
2. **Complex Test**: FIXED_WAGER cashback with bonus option
3. **Two-Tier Test**: BJ → Slots with switch at 2x balance
4. **Advanced Test**: Pre/Post coverplay with custom house edge
5. **Optimal Test**: Find optimal bet for 5% bust rate

## 🔍 Troubleshooting

### Error: "Cannot find module '@/components/ui/...'"

**Solution**: Ensure all ShadCN components are in `components/ui/` directory. They should already be there.

### Error: "Module not found: Can't resolve '@radix-ui/...'"

**Solution**: Run `npm install` to install all dependencies.

### Error: "tailwindcss-animate not found"

**Solution**: Install it:
```bash
npm install -D tailwindcss-animate
```

### TypeScript Errors Before Installation

**Solution**: These are expected. Run `npm install` first, then TypeScript will resolve all types.

### CORS Errors

**Solution**: Ensure backend is running and CORS is enabled in backend `config/env.jl`.

## 🚀 Production Build

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

### Deploy

The project is ready to deploy to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- Any Node.js hosting service

## 📚 Documentation

- **SETUP.md** - Detailed setup instructions
- **INTEGRATION_GUIDE.md** - Quick integration guide
- **IMPLEMENTATION_SUMMARY.md** - What was built

## 🔗 Related

- [Backend API Documentation](../README.md)
- [Deep Analysis](../DEEP_ANALYSIS.md)
- [House Edge Guide](../HOUSE_EDGE_GUIDE.md)

## 💡 Tips

1. **Start Simple**: Test with standard cashable bonus first
2. **Use Defaults**: Default values are pre-configured for quick testing
3. **Check Console**: Browser console shows API requests/responses
4. **Backend Logs**: Julia backend logs show request details
5. **Seed for Reproducibility**: Use random_seed for consistent results

## ✅ Verification Checklist

- [ ] `npm install` completed without errors
- [ ] `npm run dev` starts successfully
- [ ] Frontend loads at `http://5.78.132.169:3000/ev-simulator`
- [ ] Backend is running on `http://5.78.132.169:8000`
- [ ] Form fields are interactive
- [ ] Submit button works
- [ ] Results display after simulation

---

**Ready to use!** Just run `npm install` and `npm run dev` to get started. 🎉
