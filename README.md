# Typing Speed Classic 🎯

**Built to kill time, one keystroke at a time**

A modern typing speed test application using classic literature passages. Practice your typing skills with excerpts from timeless books while tracking your WPM, accuracy, and improvement over time.

## ✨ Features

- **Classic Literature**: Practice with passages from Robinson Crusoe, Tom Sawyer, and On the Origin of Species
- **Three Difficulty Levels**: Beginner, Intermediate, and Expert passages tailored to your skill level
- **Real-time Metrics**: Live WPM, accuracy percentage, and timer
- **Personal Best Tracking**: Save and beat your high scores for each difficulty
- **Clean UI**: Modern, accessible design with smooth animations
- **Offline Ready**: No internet required - all books processed locally

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/typing-speed-classic.git
   cd typing-speed-classic
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` and start typing!

## 🎮 How to Play

1. **Choose your difficulty**: Beginner, Intermediate, or Expert
2. **Read the passage**: A random excerpt will appear
3. **Start typing**: Click in the text box and begin typing the passage
4. **Track your progress**: Watch your WPM and accuracy update in real-time
5. **Complete the passage**: See your final stats and try to beat your personal best!

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES2022 modules), Tailwind CSS v3+
- **Build Tool**: Vite
- **Storage**: IndexedDB for passages, localStorage for user stats
- **Accessibility**: WCAG 2.1 AA compliant
- **Text Analysis**: Flesch-Kincaid readability scoring

## 📚 Books Included

- **Robinson Crusoe** by Daniel Defoe (Beginner)
- **The Adventures of Tom Sawyer** by Mark Twain (Intermediate)  
- **On the Origin of Species** by Charles Darwin (Expert)

## 📈 Features in Detail

### Intelligent Passage Selection
- Passages filtered by length and reading difficulty
- Flesch-Kincaid grade level analysis
- Beginner passages avoid complex punctuation and quotes
- Duplicate passage detection

### Real-time Typing Engine
- Live WPM calculation (both gross and net)
- Character-by-character accuracy tracking
- Error highlighting and correction
- Smooth progress indicators

### Personal Progress Tracking
- Personal best scores for each difficulty level
- Persistent storage across browser sessions
- Detailed completion statistics

## 🎯 Perfect for

- **Improving typing speed** - Regular practice with varied content
- **Killing time productively** - Turn downtime into skill building
- **Reading classic literature** - Discover great books while typing
- **Building muscle memory** - Consistent practice with real text

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Project Structure

```
src/
├── modules/
│   ├── typingEngine.js      # Core typing logic
│   ├── difficultyAnalyzer.js # Flesch-Kincaid analysis
│   ├── passageStore.js      # IndexedDB wrapper
│   ├── bookLoader.js        # Book processing
│   ├── textProcessor.js     # Text cleaning & filtering
│   ├── passageGenerator.js  # Random passage selection
│   └── ui/                  # UI components
└── main.js                  # Application bootstrap

public/data/
├── config.json             # Book configuration
└── books/                  # Plain text book files
```

## 📄 License

MIT License - Feel free to use this project to kill time and improve your typing skills!

## 🎉 Contributing

This project was built for fun and to kill time! If you find bugs or want to add features, pull requests are welcome.

---

*"The art of writing is the art of discovering what you believe." - Gustave Flaubert*

**Happy typing!** ⌨️✨