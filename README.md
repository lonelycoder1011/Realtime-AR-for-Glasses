# Glasses AR Try-On System

A real-time augmented reality glasses try-on application built with Next.js, Three.js, and MediaPipe. Users can virtually try on glasses using their camera with advanced face detection and 3D rendering.

## 🚀 Features

- **Real-time AR**: Live camera feed with instant glasses overlay
- **Face Detection**: Advanced facial landmark detection using MediaPipe
- **3D Rendering**: Realistic glasses positioning with Three.js
- **Modern UI**: Beautiful interface built with shadcn/ui and TailwindCSS
- **TypeScript**: Full type safety throughout the application
- **Mobile Responsive**: Optimized for both desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript
- **3D Graphics**: Three.js, @react-three/fiber, @react-three/drei
- **Computer Vision**: MediaPipe Face Mesh
- **UI Components**: shadcn/ui, TailwindCSS
- **Icons**: Lucide React
- **Development**: ESLint, Prettier, Husky

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd glasses-ar-tryout
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── ar/             # AR-related components
│   ├── camera/         # Camera components
│   └── glasses/        # Glasses components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
│   ├── three/          # Three.js utilities
│   ├── mediapipe/      # MediaPipe utilities
│   └── config.ts       # App configuration
├── types/              # TypeScript type definitions
└── utils/              # General utilities
```

## 🎯 Development Roadmap

This project follows a 15-prompt development plan:

1. ✅ **Project Foundation** - Next.js setup, TypeScript, TailwindCSS
2. 🔄 **Camera Integration** - WebRTC, video streaming
3. 🔄 **Face Detection** - MediaPipe integration
4. 🔄 **3D Scene Setup** - Three.js configuration
5. 🔄 **Face Mapping** - Coordinate transformation
6. 🔄 **3D Models** - Glasses model loading
7. 🔄 **Real-time Positioning** - Dynamic glasses placement
8. 🔄 **Advanced Rendering** - Lighting and materials
9. 🔄 **User Interface** - Controls and interactions
10. 🔄 **Database Integration** - Glasses catalog
11. 🔄 **Performance Optimization** - 30fps target
12. 🔄 **Mobile Optimization** - Touch controls
13. 🔄 **Advanced Features** - Face analysis, customization
14. 🔄 **Testing & QA** - Comprehensive testing
15. 🔄 **Production Deployment** - Live deployment

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## 🌟 Key Features (Planned)

- **Real-time Face Tracking**: 468 facial landmarks detection
- **3D Glasses Positioning**: Accurate placement based on face geometry
- **Multiple Frame Support**: Switch between different glasses models
- **Realistic Rendering**: PBR materials, lighting, and shadows
- **Mobile Optimization**: Touch gestures and responsive design
- **Performance Optimization**: 30fps target on most devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔮 Future Enhancements

- Face shape analysis for frame recommendations
- Virtual prescription lens simulation
- Social sharing capabilities
- Advanced color customization
- Analytics and user behavior tracking
